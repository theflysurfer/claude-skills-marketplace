---
name: wp-clem-hostinger-upload-image
description: Upload images to clemencefouquet.fr WordPress on Hostinger VPS via Docker. Specific to wordpress-clemence container. Use when user asks to upload images to Clémence's site.
allowed-tools: Bash
---

# WordPress Image Upload - Clemencefouquet.fr (Hostinger VPS)

Upload images to WordPress Docker container and register them in the media library.

**Specific to**:
- Site: https://clemencefouquet.fr
- Hosting: Hostinger VPS (69.62.108.82)
- Container: `wordpress-clemence`
- SSH user: `automation`

**Credentials**: Stored in `.env` file (never hardcode in skill)

## Required Input

Ask user for:
1. **Local image path**: Path to image file (relative to project root or absolute). Must be typed manually, not copy-pasted due to Claude Code bug.
2. **Image filename**: Desired filename in WordPress (optional, defaults to original name)
3. **Image title**: Human-readable title for WordPress media library

**Path examples**:
- Relative: `./assets/images/hero.png`, `assets/images/logo.png`
- Absolute: User will provide their specific path
- Home: `~/Downloads/image.png`

WordPress organizes uploads by year/month: `uploads/2025/01/`, `2025/02/`, etc.

## Complete Workflow

### 1. Upload to Server

```bash
scp "{{LOCAL_PATH}}" automation@69.62.108.82:/tmp/{{FILENAME}}
```

Example with relative path:
```bash
scp "./assets/images/hero.png" automation@69.62.108.82:/tmp/hero.png
```

### 2. Copy to WordPress with Correct Permissions

```bash
ssh automation@69.62.108.82 "
  docker exec wordpress-clemence mkdir -p /var/www/html/wp-content/uploads/{{YEAR}}/{{MONTH}} && \
  docker cp /tmp/{{FILENAME}} wordpress-clemence:/var/www/html/wp-content/uploads/{{YEAR}}/{{MONTH}}/{{FILENAME}} && \
  docker exec -u root wordpress-clemence chown www-data:www-data /var/www/html/wp-content/uploads/{{YEAR}}/{{MONTH}}/{{FILENAME}} && \
  docker exec wordpress-clemence chmod 644 /var/www/html/wp-content/uploads/{{YEAR}}/{{MONTH}}/{{FILENAME}}
"
```

**Key point**: Use `-u root` for chown to avoid permission denied errors.

Replace `{{YEAR}}` and `{{MONTH}}` with current date (e.g., 2025/11).

### 3. Verify Upload

```bash
# Check file exists with correct permissions
ssh automation@69.62.108.82 "docker exec wordpress-clemence ls -lh /var/www/html/wp-content/uploads/{{YEAR}}/{{MONTH}}/ | grep {{FILENAME}}"

# Expected output: -rw-r--r-- 1 www-data www-data SIZE DATE {{FILENAME}}

# Check web accessibility
curl -I https://clemencefouquet.fr/wp-content/uploads/{{YEAR}}/{{MONTH}}/{{FILENAME}}

# Expected: HTTP/2 200 OK
```

### 4. Register in WordPress Media Library

Insert image into database so it appears in WordPress admin:

```bash
# Load credentials from .env
source .env

# Insert into wp_posts
ssh automation@69.62.108.82 "docker exec mysql-clemence mysql -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME -e \"
INSERT INTO wp_posts (
  post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt,
  post_status, comment_status, ping_status, post_name, to_ping, pinged,
  post_modified, post_modified_gmt, post_content_filtered, post_parent,
  guid, menu_order, post_type, post_mime_type, comment_count
)
VALUES (
  1,
  NOW(),
  UTC_TIMESTAMP(),
  '',
  '{{IMAGE_TITLE}}',
  '',
  'inherit',
  'closed',
  'closed',
  '{{IMAGE_SLUG}}',
  '',
  '',
  NOW(),
  UTC_TIMESTAMP(),
  '',
  0,
  'https://clemencefouquet.fr/wp-content/uploads/{{YEAR}}/{{MONTH}}/{{FILENAME}}',
  0,
  'attachment',
  '{{MIME_TYPE}}',
  0
);
SELECT LAST_INSERT_ID() as attachment_id;
\""
```

**Variables**:
- `{{IMAGE_TITLE}}`: Ex: "Hero Image"
- `{{IMAGE_SLUG}}`: Ex: "hero-image" (lowercase, hyphens)
- `{{MIME_TYPE}}`: See MIME types section below

### 5. Add Image Metadata

```bash
source .env

ssh automation@69.62.108.82 "docker exec mysql-clemence mysql -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME -e \"
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
({{ATTACHMENT_ID}}, '_wp_attached_file', '{{YEAR}}/{{MONTH}}/{{FILENAME}}'),
({{ATTACHMENT_ID}}, '_wp_attachment_metadata', 'a:5:{s:5:\\\"width\\\";i:{{WIDTH}};s:6:\\\"height\\\";i:{{HEIGHT}};s:4:\\\"file\\\";s:{{FILE_LENGTH}}:\\\"{{YEAR}}/{{MONTH}}/{{FILENAME}}\\\";s:8:\\\"filesize\\\";i:{{FILESIZE}};s:10:\\\"image_meta\\\";a:0:{}}');
\""
```

**Variables**:
- `{{ATTACHMENT_ID}}`: From step 4 output
- `{{WIDTH}}`, `{{HEIGHT}}`: Image dimensions (use actual values or estimate like 2048x2048)
- `{{FILE_LENGTH}}`: Character count of "{{YEAR}}/{{MONTH}}/{{FILENAME}}" string
- `{{FILESIZE}}`: File size in bytes

### 6. Verify in WordPress

Image should now appear in WordPress Media Library. Refresh admin page to see it.

## MIME Types

- PNG: `image/png`
- JPG/JPEG: `image/jpeg`
- SVG: `image/svg+xml`
- WebP: `image/webp`
- GIF: `image/gif`

## Quick One-Liner (File Upload Only)

For quick uploads without media library registration:

```bash
# Upload image
scp "{{LOCAL_PATH}}" automation@69.62.108.82:/tmp/{{FILENAME}}

# Copy with correct permissions
ssh automation@69.62.108.82 "
  YEAR=\$(date +%Y) && \
  MONTH=\$(date +%m) && \
  docker exec wordpress-clemence mkdir -p /var/www/html/wp-content/uploads/\$YEAR/\$MONTH && \
  docker cp /tmp/{{FILENAME}} wordpress-clemence:/var/www/html/wp-content/uploads/\$YEAR/\$MONTH/{{FILENAME}} && \
  docker exec -u root wordpress-clemence chown www-data:www-data /var/www/html/wp-content/uploads/\$YEAR/\$MONTH/{{FILENAME}} && \
  docker exec wordpress-clemence chmod 644 /var/www/html/wp-content/uploads/\$YEAR/\$MONTH/{{FILENAME}} && \
  echo 'Image uploaded: https://clemencefouquet.fr/wp-content/uploads/'\$YEAR'/'\$MONTH'/{{FILENAME}}'
"
```

## Troubleshooting

**Permission denied on chown**:
- Solution: Use `docker exec -u root` to run chown as root
- Correct: `docker exec -u root wordpress-clemence chown www-data:www-data ...`

**Image not in WordPress media library**:
- Cause: Image only copied physically, not registered in database
- Solution: Execute steps 4 & 5 to insert into wp_posts and wp_postmeta

**Owner is 1001:1001 instead of www-data**:
- Cause: chown failed (permission denied)
- Impact: WordPress cannot modify/delete image
- Solution: Use `docker exec -u root` for chown command

**MySQL error "Field 'to_ping' doesn't have a default value"**:
- Cause: Missing required fields in INSERT
- Solution: Include all fields (to_ping, pinged, post_content_filtered, etc.)

**Image path bug when copy-pasting**:
- Cause: Claude Code converts file paths to images when copy-pasted
- Solution: Type file path manually character-by-character

## Critical Notes

1. **Always use `-u root`** for chown to avoid permission errors
2. **Register in database** (steps 4 & 5) for WordPress media library visibility
3. **Owner must be www-data** for WordPress to modify/delete images
4. **Type paths manually** - don't copy-paste due to Claude Code bug
5. **Escape $ in SSH** commands using `\$(date)` not `$(date)`
6. **Use relative paths** when possible (`./assets/images/`) for portability

## Environment Variables

Create `.env` file in project root:

```bash
# .env
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_CONTAINER=mysql-clemence
```

**IMPORTANT**:
- Replace placeholders with actual credentials
- Add `.env` to `.gitignore` to prevent committing credentials
- Never commit `.env` to version control

## References

**Infrastructure**:
- Container: `wordpress-clemence`
- SSH: `automation@69.62.108.82`
- WordPress uploads: `/var/www/html/wp-content/uploads/`
- Web URL: `https://clemencefouquet.fr/wp-content/uploads/{YEAR}/{MONTH}/{FILENAME}`

**Database**: Load from `.env` using `source .env` before MySQL commands
