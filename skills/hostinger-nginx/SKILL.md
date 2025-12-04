---
name: hostinger-nginx
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
  version: "1.0.0"
  category: "infrastructure"
  keywords: ["nginx", "reverse-proxy", "ssl", "certbot", "hostinger"]
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
- **references/troubleshooting-502-504.md** - Detailed error debugging
- **references/auto-start-integration.md** - Docker auto-start config

## Important Notes

- **Always test config** with `sudo nginx -t` before reload
- **Use reload, not restart** to avoid downtime
- **Check backend first** when debugging 502/504
- **SSL certificates auto-renew** via certbot timer
- **Logs are your friend** - check error.log first

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
```
