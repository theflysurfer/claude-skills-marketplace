---
name: julien-infra-hostinger-nginx
description: Manage Nginx reverse proxy on Hostinger VPS srv759970 (automation@69.62.108.82). Use for site configuration, SSL/Let's Encrypt setup, reverse proxy configuration, troubleshooting 502/504 errors, certbot operations, or nginx reload/restart.
license: Apache-2.0
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
metadata:
  author: "Julien"
  version: "2.0.0"
  category: "infrastructure"
  keywords: ["nginx", "reverse-proxy", "ssl", "certbot", "hostinger", "ipv6"]
triggers:
  - "nginx"
  - "reverse proxy"
  - "ssl"
  - "https"
  - "certbot"
  - "let's encrypt"
  - "certificat ssl"
  - "configure nginx for my website"
  - "setup reverse proxy"
  - "je veux configurer nginx"
  - "SSL certificate renewal"
  - "certificat ssl expiré"
  - "configure https for domain"
  - "nginx 502 bad gateway error"
  - "proxy pass configuration"
  - "ajouter un nouveau site nginx"
  - "nginx configuration"
  - "ssl certificate"
  - "web server config"
---

# Nginx Management on Hostinger VPS

Manage Nginx reverse proxy and SSL for 30+ sites on srv759970.hstgr.cloud.

## Server Info

- **Host**: automation@69.62.108.82
- **Alias**: srv759970
- **Nginx config**: /etc/nginx/
- **Sites available**: /etc/nginx/sites-available/
- **Sites enabled**: /etc/nginx/sites-enabled/
- **Logs**: /var/log/nginx/

## When to Use This Skill

Invoke automatically when:
- User asks to configure a new site
- SSL certificate issues or Let's Encrypt setup needed
- Nginx 502/504 errors occur
- Need to add/modify reverse proxy configuration
- Nginx reload or restart required
- Site not accessible or wrong backend

## Common Operations

### 1. Add New Site

To configure a new site with reverse proxy:

```bash
# Connect to server
ssh srv759970

# Create config file
sudo nano /etc/nginx/sites-available/mysite

# Basic reverse proxy template (see templates/reverse-proxy.conf)
server {
    listen 80;
    listen [::]:80;  # IPv6 support (REQUIRED)
    server_name mysite.srv759970.hstgr.cloud;

    location / {
        proxy_pass http://localhost:PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Test configuration
sudo nginx -t

# Enable site
sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/

# Reload Nginx
sudo systemctl reload nginx
```

**IMPORTANT**: Always include `listen [::]:80;` and `listen [::]:443 ssl http2;` for IPv6 support. Without IPv6 listeners, clients connecting via IPv6 may get the wrong SSL certificate (SNI won't work properly).

### 2. SSL Setup with Let's Encrypt

To add SSL certificate:

```bash
# Install/renew certificate
sudo certbot --nginx -d mysite.srv759970.hstgr.cloud

# Certbot will automatically:
# - Obtain certificate
# - Modify nginx config to add SSL
# - Set up auto-renewal

# Verify renewal timer
sudo systemctl status certbot.timer
```

**Manual renewal:**
```bash
sudo certbot renew --dry-run  # Test
sudo certbot renew            # Actual renewal
```

### 3. Check Site Configuration

To debug a site:

```bash
# Test all configs
sudo nginx -t

# Check specific site config
cat /etc/nginx/sites-enabled/mysite

# Check which port is proxied
grep proxy_pass /etc/nginx/sites-enabled/mysite

# Verify backend is running
docker ps | grep mysite
curl localhost:PORT  # Test backend directly
```

### 4. View Logs

```bash
# Error logs
sudo tail -f /var/log/nginx/error.log

# Access logs
sudo tail -f /var/log/nginx/access.log

# Site-specific logs (if configured)
sudo tail -f /var/log/nginx/mysite.error.log
```

### 5. Reload/Restart Nginx

```bash
# Test config first (ALWAYS do this)
sudo nginx -t

# Reload (no downtime, preferred)
sudo systemctl reload nginx

# Restart (brief downtime)
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

## Troubleshooting

### Wrong SSL Certificate / Certificate Mismatch

**Error**: `Hostname does not match certificate's altnames`

**Cause**: IPv6 clients connecting to a server that doesn't have IPv6 listeners configured. The first available server block (lexicographically) will serve its certificate.

**Symptoms**:
- Site A shows certificate for Site B
- Error only occurs for some users (those with IPv6)
- `openssl s_client` shows correct cert, but browsers show wrong cert

**Fix**:
```bash
# Add IPv6 listeners to BOTH HTTP and HTTPS blocks
sudo nano /etc/nginx/sites-available/yoursite

# Add these lines:
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;  # ← ADD THIS
    server_name yoursite.srv759970.hstgr.cloud;
    ...
}

server {
    listen 80;
    listen [::]:80;  # ← ADD THIS
    server_name yoursite.srv759970.hstgr.cloud;
    ...
}

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Verify both IPv4 and IPv6 work
curl -4 https://yoursite.srv759970.hstgr.cloud
curl -6 https://yoursite.srv759970.hstgr.cloud
```

### 502 Bad Gateway

**Cause**: Backend service is down or not responding.

**Steps**:
1. Check backend container: `docker ps | grep service-name`
2. Check if backend is listening: `curl localhost:PORT`
3. Restart backend if needed: `docker restart container-name`
4. Check backend logs: `docker logs container-name --tail 50`

### 504 Gateway Timeout

**Cause**: Backend is too slow to respond.

**Steps**:
1. Increase timeout in nginx config:
   ```nginx
   proxy_read_timeout 300;
   proxy_connect_timeout 300;
   proxy_send_timeout 300;
   ```
2. Reload nginx: `sudo systemctl reload nginx`
3. Check backend performance

### Certificate Issues

**Problem**: SSL certificate expired or not renewing.

**Steps**:
```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check renewal timer
sudo systemctl status certbot.timer
```

### "Too many redirects"

**Cause**: Misconfigured proxy headers or HTTP/HTTPS loop.

**Fix**: Ensure these headers are set:
```nginx
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
```

### Site not accessible

**Steps**:
1. Check if site is enabled: `ls -la /etc/nginx/sites-enabled/ | grep mysite`
2. Test nginx config: `sudo nginx -t`
3. Check DNS: `dig mysite.srv759970.hstgr.cloud`
4. Check firewall: `sudo ufw status`
5. Test backend: `curl localhost:PORT`

## Nginx Configuration Patterns

### Basic Reverse Proxy

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name app.srv759970.hstgr.cloud;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### WebSocket Support

```nginx
location / {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
}
```

### Static Files + API Proxy

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name app.srv759970.hstgr.cloud;

    # Static files
    location / {
        root /var/www/app;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/;
    }
}
```

### WordPress

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name wordpress.srv759970.hstgr.cloud;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Security Best Practices

1. **Always use SSL in production**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

2. **Hide Nginx version**
   ```nginx
   server_tokens off;
   ```

3. **Rate limiting** (if needed)
   ```nginx
   limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;

   server {
       location / {
           limit_req zone=mylimit burst=20 nodelay;
           proxy_pass http://localhost:8000;
       }
   }
   ```

4. **Block unwanted traffic**
   ```nginx
   # In /etc/nginx/nginx.conf
   # Block bots, scanners
   if ($http_user_agent ~* (bot|crawler|spider|scraper)) {
       return 403;
   }
   ```

## Auto-Start Integration

Many services use the Docker Auto-Start system. When configuring nginx for these:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name myapp.srv759970.hstgr.cloud;

    location / {
        # Proxy to auto-start API (manages container wake-up)
        proxy_pass http://localhost:8890;

        # Auto-start specific headers
        proxy_set_header X-Target-Container "myapp-container";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

See `references/auto-start-integration.md` for details.

## Operational Scripts (v2.0.0)

Located in `scripts/` directory. All scripts use SSH to connect to the VPS.

### Deployment Workflow

```bash
# Safe 6-step deployment (backup → upload → test → enable → reload → health check)
./scripts/nginx-deploy.sh configs/sites/mysite mysite

# Backup current config before changes
./scripts/nginx-backup.sh mysite           # Single site backup
./scripts/nginx-backup.sh                  # Full backup (all sites)

# Rollback to previous version
./scripts/nginx-rollback.sh --list mysite  # List available backups
./scripts/nginx-rollback.sh mysite 20251209-143500  # Restore specific backup

# Health check after deployment
./scripts/health-check.sh --verbose
```

### Synchronization

```bash
# Download configs from VPS to local Git repo
./scripts/sync-from-server.sh             # Sync priority sites
./scripts/sync-from-server.sh --commit    # Sync and auto-commit

# Upload local config to VPS (uses nginx-deploy.sh for sites)
./scripts/sync-to-server.sh mysite
./scripts/sync-to-server.sh snippets/bot-protection.conf
```

### Site Creation

```bash
# Interactive wizard to create new Nginx site
./scripts/create-new-site.sh
# Prompts for: site type (WordPress/Reverse Proxy), domain, port, options
```

### WordPress Management

```bash
# WP-CLI commands on remote WordPress containers
./scripts/wp-cli.sh clemence "plugin list"
./scripts/wp-cli.sh clemence "user list --role=administrator"
./scripts/wp-cli.sh clemence "core version"
```

## Templates (v2.0.0)

Located in `templates/` directory. Use as base for new site configurations.

| Template | Use Case | Key Features |
|----------|----------|--------------|
| `site-reverse-proxy.conf` | Generic apps (Streamlit, Node.js, etc.) | Proxy headers, WebSocket support |
| `site-wordpress.conf` | WordPress Docker | Rate limiting zones, WP-specific headers |
| `site-wordpress-phpfpm.conf` | WordPress PHP-FPM | PHP-FPM fastcgi config, upload limits |
| `rate-limiting-zones.conf` | Rate limiting | Global zones for wp-login, xmlrpc |

**Template Variables**:
- `{{DOMAIN_NAME}}` - Full domain (e.g., `myapp.srv759970.hstgr.cloud`)
- `{{SITE_NAME}}` - Short name for logs/files (e.g., `myapp`)
- `{{BACKEND_PORT}}` - Backend port (e.g., `8501`)

## Security Snippets (v2.0.0)

Located in `references/snippets/`. Include in Nginx configs with `include snippets/filename.conf;`

| Snippet | Purpose | Include Location |
|---------|---------|------------------|
| `ssl-hardening.conf` | TLS 1.2/1.3, OCSP stapling, strong ciphers | http block |
| `bot-protection-wordpress.conf` | Block bad bots, protect WP-specific paths | server block |
| `bot-protection-generic.conf` | Generic bot protection (non-WordPress) | server block |
| `http-method-restriction.conf` | Allow only GET/HEAD/POST | location block |
| `basic-auth.conf` | HTTP basic authentication | location block |

**Example usage in site config**:
```nginx
server {
    # ... other directives ...

    # Include bot protection
    include snippets/bot-protection-wordpress.conf;

    # Protect wp-admin
    location /wp-admin/ {
        include snippets/basic-auth.conf;
        proxy_pass http://localhost:9000;
    }
}
```

## Reference Files

**Documentation**:
- **references/NGINX_STANDARDS.md** - Complete Nginx standards and conventions (NEW v2.0.0)
- **references/ssl-certbot.md** - SSL/Certbot guide
- **references/ipv6-ssl-certificate-issues.md** - IPv6 and SSL troubleshooting (v1.1.0)

**Templates** (see Templates section above):
- **templates/site-reverse-proxy.conf** - Generic reverse proxy
- **templates/site-wordpress.conf** - WordPress Docker
- **templates/site-wordpress-phpfpm.conf** - WordPress PHP-FPM
- **templates/rate-limiting-zones.conf** - Rate limiting zones

**Security Snippets** (see Security Snippets section above):
- **references/snippets/ssl-hardening.conf**
- **references/snippets/bot-protection-wordpress.conf**
- **references/snippets/bot-protection-generic.conf**
- **references/snippets/http-method-restriction.conf**
- **references/snippets/basic-auth.conf**

## Important Notes

- **Always test config** with `sudo nginx -t` before reload
- **Use reload, not restart** to avoid downtime
- **Check backend first** when debugging 502/504
- **SSL certificates auto-renew** via certbot timer
- **Logs are your friend** - check error.log first
- **CRITICAL: Always add IPv6 listeners** (`listen [::]:80;` and `listen [::]:443 ssl http2;`) to prevent SSL certificate mismatch errors for IPv6 clients

## Quick Commands Reference

```bash
# Test config
sudo nginx -t

# Reload (preferred)
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# View errors
sudo tail -f /var/log/nginx/error.log

# List all sites
ls /etc/nginx/sites-enabled/

# Check certificate
sudo certbot certificates

# Renew SSL
sudo certbot renew

# Verify IPv6 support (check for [::]:443 and [::]:80)
sudo nginx -T | grep -E "listen.*\[::\]"

# Test SSL cert from command line
openssl s_client -connect yoursite.srv759970.hstgr.cloud:443 -servername yoursite.srv759970.hstgr.cloud </dev/null 2>&1 | grep subject

# Test IPv4 vs IPv6 responses
curl -4 https://yoursite.srv759970.hstgr.cloud  # Force IPv4
curl -6 https://yoursite.srv759970.hstgr.cloud  # Force IPv6
```

## 🔗 Skill Chaining

### Skills Required Before
- **julien-infra-hostinger-ssh** (recommandé): Ensures SSH access to VPS before Nginx configuration
- **julien-infra-hostinger-deployment** (optionnel): If configuring Nginx for newly deployed app

### Input Expected
- SSH access to VPS: `automation@69.62.108.82`
- Application running on backend port (e.g., 5173 for production, 5174 for preview)
- Domain name configured: `*.srv759970.hstgr.cloud` or custom domain
- Backend service accessible: `http://localhost:[PORT]`

### Output Produced
- **Format**: Nginx reverse proxy configured and running
- **Side effects**:
  - New site config created in `/etc/nginx/sites-available/`
  - Symlink created in `/etc/nginx/sites-enabled/`
  - Nginx configuration reloaded
  - SSL certificate requested and installed (Let's Encrypt)
  - IPv6 listeners configured (`listen [::]:80;` and `listen [::]:443 ssl http2;`)
- **Duration**: 1-3 minutes (config 30s + SSL certificate request 60-120s + nginx reload 5s)

### Compatible Skills After

**Obligatoires:**
- **julien-infra-nginx-audit**: Audit Nginx security configuration after any Nginx changes (CRITICAL)
- **julien-infra-deployment-verifier**: Verify HTTP/SSL working correctly after Nginx config

**Recommandés:**
- **julien-infra-wordpress-security**: For WordPress sites, run security audit (25+ checks, scoring 0-100%) (NEW v2.0.0)
- **julien-infra-hostinger-maintenance**: Schedule SSL certificate renewal checks

**Optionnels:**
- **julien-infra-hostinger-fail2ban**: Install WordPress Fail2ban jails if security audit recommends (NEW v2.0.0)
- Performance testing: Verify reverse proxy performance with load testing

### Called By
- **julien-infra-hostinger-deployment**: After PM2 restart, verify/configure Nginx proxy (OBLIGATOIRE in deployment workflow)
- **julien-infra-hostinger-docker**: When deploying Docker services that need reverse proxy
- Direct user invocation: "Configure Nginx for new site" or "Fix SSL certificate mismatch"
- Manual configuration: When setting up new domains or troubleshooting 502/SSL errors

### Tools Used
- `Bash` (usage: SSH commands, nginx config edit, certbot SSL, systemctl reload/restart)
- `Read` (usage: verify existing nginx configs before modification)
- `Edit` (usage: modify nginx site configurations)
- `Grep` (usage: search for IPv6 listener configurations, find SSL certificate issues)

### Visual Workflow

```
[New application deployed OR SSL issue detected]
    ↓
julien-infra-hostinger-nginx (THIS SKILL)
    ├─► Step 1: Create site config
    │   ├─► Create /etc/nginx/sites-available/mysite
    │   ├─► Add server block with IPv4/IPv6 listeners
    │   │   ├─► listen 80;
    │   │   ├─► listen [::]:80;  ← CRITICAL for IPv6
    │   │   ├─► proxy_pass http://localhost:[PORT]
    │   │   └─► Set proxy headers
    │   └─► Symlink to sites-enabled/
    ├─► Step 2: Test and reload Nginx
    │   ├─► sudo nginx -t
    │   └─► sudo systemctl reload nginx
    ├─► Step 3: Request SSL certificate
    │   ├─► sudo certbot --nginx -d mysite.srv759970.hstgr.cloud
    │   └─► Certbot auto-adds:
    │       ├─► listen 443 ssl http2;
    │       ├─► listen [::]:443 ssl http2;  ← CRITICAL for IPv6
    │       ├─► ssl_certificate paths
    │       └─► HTTP→HTTPS redirect
    ├─► Step 4: Verify IPv6 configuration
    │   ├─► sudo nginx -T | grep -E "listen.*\[::\]"
    │   ├─► Verify: [::]:80 and [::]:443 present
    │   └─► If missing, manually add IPv6 listeners
    └─► Step 5: Test SSL from both IPv4 and IPv6
        ├─► curl -4 https://mysite.srv759970.hstgr.cloud
        ├─► curl -6 https://mysite.srv759970.hstgr.cloud
        └─► openssl s_client -servername mysite... -connect mysite:443
    ↓
Nginx configured with IPv6 support ✅
    ↓
julien-infra-nginx-audit (OBLIGATOIRE)
    ├─► Audit security headers
    ├─► Check for IPv6 listener coverage
    ├─► Verify SSL certificate matches
    └─► Scan for common misconfigurations
    ↓
julien-infra-deployment-verifier
    ├─► Verify HTTP 200 status
    ├─► Verify SSL certificate validity
    └─► Take screenshots
```

### Usage Example 1: Configure Nginx for new deployment

**Scenario**: After deploying new Express app on port 5174, configure Nginx reverse proxy

**Command**:
```bash
# Invoked automatically by deployment skill, or manually:
# "Configure Nginx reverse proxy for preview.incluzhact.fr on port 5174"
```

**Result**:
- Site config created: `/etc/nginx/sites-available/preview-incluzhact`
- IPv6 listeners added: `listen [::]:80;` and `listen [::]:443 ssl http2;`
- SSL certificate installed: Let's Encrypt for preview.incluzhact.fr
- Nginx reloaded successfully
- HTTP→HTTPS redirect configured
- IPv6 verification: Both `curl -4` and `curl -6` return correct SSL certificate
- Duration: ~2 minutes
- **Next**: Run `julien-infra-nginx-audit` to verify security

### Usage Example 2: Fix SSL certificate mismatch (IPv6 issue)

**Scenario**: Users report "Certificate doesn't match hostname" error (IPv6 clients getting wrong cert)

**Command**:
```bash
# Diagnosed via browser error or nginx audit
# "Fix SSL certificate mismatch for mysite.srv759970.hstgr.cloud"
```

**Result**:
- Root cause identified: Missing `listen [::]:443 ssl http2;` in server block
- Fix applied:
  ```nginx
  server {
      listen 443 ssl http2;
      listen [::]:443 ssl http2;  # ← ADDED
      server_name mysite.srv759970.hstgr.cloud;
      # ... rest of config
  }
  server {
      listen 80;
      listen [::]:80;  # ← ADDED
      server_name mysite.srv759970.hstgr.cloud;
      # ... rest of config
  }
  ```
- Nginx reloaded: `sudo systemctl reload nginx`
- Verification:
  - `curl -6 https://mysite.srv759970.hstgr.cloud` now returns correct certificate ✅
  - SNI working properly for IPv6 clients ✅
- Duration: ~30 seconds
- **Next**: Run `julien-infra-nginx-audit` to ensure no other sites have same issue

## Changelog

### v2.0.0 (2025-12-09)
- **MAJOR**: Migrated operational scripts from Nginx Manager repository
- Added 8 operational scripts in `scripts/`:
  - `nginx-deploy.sh` - Safe 6-step deployment workflow
  - `nginx-backup.sh` - Backup configurations (single or full)
  - `nginx-rollback.sh` - Restore from backup with safety checks
  - `health-check.sh` - Verify services are accessible
  - `sync-from-server.sh` - Download configs from VPS to local Git
  - `sync-to-server.sh` - Upload configs to VPS with deploy
  - `create-new-site.sh` - Interactive wizard to create new site
  - `wp-cli.sh` - WP-CLI wrapper for WordPress sites
- Added 4 production templates in `templates/`:
  - `site-wordpress.conf` - WordPress Docker template
  - `site-reverse-proxy.conf` - Generic reverse proxy template
  - `site-wordpress-phpfpm.conf` - WordPress PHP-FPM template
  - `rate-limiting-zones.conf` - Rate limiting zones
- Added 5 security snippets in `references/snippets/`:
  - `ssl-hardening.conf` - TLS 1.2/1.3, OCSP stapling
  - `bot-protection-wordpress.conf` - WordPress-aware bot protection
  - `bot-protection-generic.conf` - Generic bot protection
  - `http-method-restriction.conf` - Allow only GET/HEAD/POST
  - `basic-auth.conf` - HTTP basic authentication
- Added `references/NGINX_STANDARDS.md` - Complete Nginx standards documentation
- Updated Skill Chaining section with wordpress-security and fail2ban references

### v1.1.0 (2025-12-09)
- **CRITICAL FIX**: Added IPv6 support documentation to prevent SSL certificate mismatch errors
- Added new troubleshooting section: "Wrong SSL Certificate / Certificate Mismatch"
- Updated all configuration templates to include `listen [::]:80;` and `listen [::]:443 ssl http2;`
- Added IPv6 verification commands to Quick Commands Reference
- Added warning in "Important Notes" about mandatory IPv6 listeners
- Root cause: SNI (Server Name Indication) doesn't work properly without IPv6 listeners configured

### v1.0.0 (2025-12-06)
- Initial release
- Basic Nginx management operations
- SSL/Let's Encrypt integration
- Troubleshooting guides for 502/504 errors
- Configuration templates
