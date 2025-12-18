# Image Upload - clemencefouquet.fr

Upload d'images vers WordPress sur Hostinger VPS.

## Required Input

1. **Local image path**: Chemin vers l'image (taper manuellement, ne pas copier-coller)
2. **Image filename**: Nom du fichier dans WordPress
3. **Image title**: Titre pour la médiathèque

## Quick Upload (fichier seulement)

```bash
# Variables
LOCAL_PATH="./assets/images/hero.png"
FILENAME="hero.png"

# Upload
scp "$LOCAL_PATH" automation@69.62.108.82:/tmp/$FILENAME

ssh automation@69.62.108.82 "
  YEAR=\$(date +%Y) && \
  MONTH=\$(date +%m) && \
  docker exec wordpress-clemence mkdir -p /var/www/html/wp-content/uploads/\$YEAR/\$MONTH && \
  docker cp /tmp/$FILENAME wordpress-clemence:/var/www/html/wp-content/uploads/\$YEAR/\$MONTH/$FILENAME && \
  docker exec -u root wordpress-clemence chown www-data:www-data /var/www/html/wp-content/uploads/\$YEAR/\$MONTH/$FILENAME && \
  docker exec wordpress-clemence chmod 644 /var/www/html/wp-content/uploads/\$YEAR/\$MONTH/$FILENAME && \
  echo 'Image uploaded: https://clemencefouquet.fr/wp-content/uploads/'\$YEAR'/'\$MONTH'/$FILENAME'
"
```

---

## Full Upload (avec enregistrement médiathèque)

### Step 1: Upload to Server

```bash
scp "{{LOCAL_PATH}}" automation@69.62.108.82:/tmp/{{FILENAME}}
```

### Step 2: Copy with Permissions

```bash
ssh automation@69.62.108.82 "
  docker exec wordpress-clemence mkdir -p /var/www/html/wp-content/uploads/{{YEAR}}/{{MONTH}} && \
  docker cp /tmp/{{FILENAME}} wordpress-clemence:/var/www/html/wp-content/uploads/{{YEAR}}/{{MONTH}}/{{FILENAME}} && \
  docker exec -u root wordpress-clemence chown www-data:www-data /var/www/html/wp-content/uploads/{{YEAR}}/{{MONTH}}/{{FILENAME}} && \
  docker exec wordpress-clemence chmod 644 /var/www/html/wp-content/uploads/{{YEAR}}/{{MONTH}}/{{FILENAME}}
"
```

**IMPORTANT**: Utiliser `-u root` pour chown.

### Step 3: Verify

```bash
# Check file
ssh automation@69.62.108.82 "docker exec wordpress-clemence ls -lh /var/www/html/wp-content/uploads/{{YEAR}}/{{MONTH}}/ | grep {{FILENAME}}"

# Check web
curl -I https://clemencefouquet.fr/wp-content/uploads/{{YEAR}}/{{MONTH}}/{{FILENAME}}
```

### Step 4: Register in Media Library

```bash
source .env

ssh automation@69.62.108.82 "docker exec mysql-clemence mysql -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME -e \"
INSERT INTO wp_posts (
  post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt,
  post_status, comment_status, ping_status, post_name, to_ping, pinged,
  post_modified, post_modified_gmt, post_content_filtered, post_parent,
  guid, menu_order, post_type, post_mime_type, comment_count
)
VALUES (
  1, NOW(), UTC_TIMESTAMP(), '', '{{IMAGE_TITLE}}', '', 'inherit', 'closed', 'closed',
  '{{IMAGE_SLUG}}', '', '', NOW(), UTC_TIMESTAMP(), '', 0,
  'https://clemencefouquet.fr/wp-content/uploads/{{YEAR}}/{{MONTH}}/{{FILENAME}}',
  0, 'attachment', '{{MIME_TYPE}}', 0
);
SELECT LAST_INSERT_ID() as attachment_id;
\""
```

### Step 5: Add Metadata

```bash
source .env

ssh automation@69.62.108.82 "docker exec mysql-clemence mysql -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME -e \"
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
({{ATTACHMENT_ID}}, '_wp_attached_file', '{{YEAR}}/{{MONTH}}/{{FILENAME}}'),
({{ATTACHMENT_ID}}, '_wp_attachment_metadata', 'a:5:{s:5:\\\"width\\\";i:{{WIDTH}};s:6:\\\"height\\\";i:{{HEIGHT}};s:4:\\\"file\\\";s:{{FILE_LENGTH}}:\\\"{{YEAR}}/{{MONTH}}/{{FILENAME}}\\\";s:8:\\\"filesize\\\";i:{{FILESIZE}};s:10:\\\"image_meta\\\";a:0:{}}');
\""
```

---

## MIME Types

| Extension | MIME Type |
|-----------|-----------|
| PNG | `image/png` |
| JPG/JPEG | `image/jpeg` |
| SVG | `image/svg+xml` |
| WebP | `image/webp` |
| GIF | `image/gif` |

---

## Environment Variables

Créer `.env` à la racine du projet:

```bash
# .env
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_CONTAINER=mysql-clemence
```

**IMPORTANT**: Ajouter `.env` à `.gitignore`.

---

## Troubleshooting

### Permission denied on chown
```bash
# Utiliser -u root
docker exec -u root wordpress-clemence chown www-data:www-data ...
```

### Image not in media library
- Cause: Image copiée physiquement mais pas enregistrée en BDD
- Solution: Exécuter steps 4 & 5 pour insérer dans wp_posts et wp_postmeta

### Owner is 1001:1001
```bash
# Fix permissions
docker exec -u root wordpress-clemence chown -R www-data:www-data /var/www/html/wp-content/uploads/
```

### Path bug copy-paste
- Cause: Claude Code convertit les chemins collés en images
- Solution: Taper le chemin manuellement caractère par caractère

---

## Critical Notes

1. **Toujours `-u root`** pour chown
2. **Register in database** pour visibilité médiathèque
3. **Owner www-data** obligatoire
4. **Taper les chemins** manuellement (bug copy-paste)
5. **Escape $ in SSH**: `\$(date)` pas `$(date)`
6. **Toujours `--allow-root`** pour WP-CLI dans Docker
