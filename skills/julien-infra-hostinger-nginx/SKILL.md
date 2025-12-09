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
  version: "1.1.0"
  category: "infrastructure"
  keywords: ["nginx", "reverse-proxy", "ssl", "certbot", "hostinger", "ipv6"]
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

## Reference Files

- **templates/reverse-proxy.conf** - Basic reverse proxy template
- **templates/wordpress.conf** - WordPress-specific config
- **references/ssl-certbot.md** - Complete SSL/Certbot guide
- **references/ipv6-ssl-certificate-issues.md** - IPv6 configuration and SSL certificate mismatch troubleshooting (NEW v1.1.0)
- **references/troubleshooting-502-504.md** - Detailed error debugging
- **references/auto-start-integration.md** - Docker auto-start config

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

## Changelog

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
