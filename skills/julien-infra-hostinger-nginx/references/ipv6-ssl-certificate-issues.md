# IPv6 and SSL Certificate Issues

## Problem Overview

When Nginx server blocks don't have IPv6 listeners configured (`listen [::]:443 ssl http2;`), clients connecting via IPv6 will receive the **wrong SSL certificate**, causing SSL verification errors.

## Root Cause

### How Nginx Handles Multiple Server Blocks

1. Nginx processes server blocks in the order they appear in configuration files
2. When a connection arrives on a specific port (e.g., 443), Nginx looks for a matching server block based on:
   - The listen directive (IP address + port)
   - The Server Name Indication (SNI) from the client

### The IPv6 Problem

If you have multiple sites configured like this:

**Site A (audioguides.srv759970.hstgr.cloud):**
```nginx
server {
    listen 443 ssl http2;  # IPv4 only
    server_name audioguides.srv759970.hstgr.cloud;
    ssl_certificate /path/to/audioguides/cert.pem;
    ...
}
```

**Site B (ca-handi-long.srv759970.hstgr.cloud):**
```nginx
server {
    listen 443 ssl http2;        # IPv4
    listen [::]:443 ssl http2;   # IPv6 ← This is configured
    server_name ca-handi-long.srv759970.hstgr.cloud;
    ssl_certificate /path/to/ca-handi-long/cert.pem;
    ...
}
```

**What happens:**
- IPv4 clients connecting to Site A → Correct certificate (audioguides)
- IPv4 clients connecting to Site B → Correct certificate (ca-handi-long)
- IPv6 clients connecting to Site A → **WRONG certificate (ca-handi-long)** ❌
- IPv6 clients connecting to Site B → Correct certificate (ca-handi-long)

**Why Site A fails for IPv6:**
- Site A has no `listen [::]:443` directive
- When an IPv6 client connects to `audioguides.srv759970.hstgr.cloud:443`
- Nginx can't match the connection to Site A's server block (no IPv6 listener)
- Nginx falls back to the **first available server block** that listens on `[::]:443`
- That happens to be Site B (ca-handi-long)
- Site B's certificate is presented, causing the mismatch error

## Error Messages

Users will see errors like:

**Browser:**
```
NET::ERR_CERT_COMMON_NAME_INVALID
The certificate is not valid for audioguides.srv759970.hstgr.cloud
```

**curl/WebFetch:**
```
Hostname/IP does not match certificate's altnames:
Host: audioguides.srv759970.hstgr.cloud. is not in the cert's altnames:
DNS:ca-handi-long.srv759970.hstgr.cloud
```

**OpenSSL test:**
```bash
openssl s_client -connect audioguides.srv759970.hstgr.cloud:443 \
    -servername audioguides.srv759970.hstgr.cloud </dev/null 2>&1 | grep subject

# Shows wrong certificate:
subject=CN=ca-handi-long.srv759970.hstgr.cloud
```

## Symptoms and Detection

### Intermittent Issues
- Some users can access the site, others can't
- Issue may only affect certain networks or ISPs (those with IPv6 enabled)
- Desktop works, mobile doesn't (or vice versa)

### Testing IPv4 vs IPv6

```bash
# Test IPv4 explicitly
curl -4 -I https://yoursite.srv759970.hstgr.cloud

# Test IPv6 explicitly
curl -6 -I https://yoursite.srv759970.hstgr.cloud
```

If IPv4 works but IPv6 shows certificate error, you have this problem.

### Check Which Certificate is Presented

```bash
# Via IPv4
openssl s_client -connect yoursite.srv759970.hstgr.cloud:443 \
    -servername yoursite.srv759970.hstgr.cloud -4 </dev/null 2>&1 | \
    grep -E '(subject=|issuer=)'

# Via IPv6
openssl s_client -connect yoursite.srv759970.hstgr.cloud:443 \
    -servername yoursite.srv759970.hstgr.cloud -6 </dev/null 2>&1 | \
    grep -E '(subject=|issuer=)'
```

If the certificate subject differs between IPv4 and IPv6, you have this problem.

### Audit All Sites for IPv6 Support

```bash
# Check which sites have IPv6 listeners
sudo nginx -T 2>/dev/null | grep -B 5 "listen.*\[::\]"

# Check which sites are missing IPv6
for site in /etc/nginx/sites-enabled/*; do
    echo "=== $site ==="
    grep -E "server_name|listen" "$site" | head -4
done
```

## Solution

### Fix Individual Site

Edit the site's configuration:

```bash
sudo nano /etc/nginx/sites-available/yoursite
```

Add IPv6 listeners to **both HTTP and HTTPS** blocks:

```nginx
# HTTPS block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;  # ← ADD THIS
    server_name yoursite.srv759970.hstgr.cloud;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ...
}

# HTTP redirect block
server {
    listen 80;
    listen [::]:80;  # ← ADD THIS
    server_name yoursite.srv759970.hstgr.cloud;
    return 301 https://$server_name$request_uri;
}
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Verify Fix

```bash
# Both should now show correct certificate
curl -4 -I https://yoursite.srv759970.hstgr.cloud
curl -6 -I https://yoursite.srv759970.hstgr.cloud

# Both should show same certificate
openssl s_client -connect yoursite.srv759970.hstgr.cloud:443 \
    -servername yoursite.srv759970.hstgr.cloud -4 </dev/null 2>&1 | grep subject
openssl s_client -connect yoursite.srv759970.hstgr.cloud:443 \
    -servername yoursite.srv759970.hstgr.cloud -6 </dev/null 2>&1 | grep subject
```

### Bulk Fix All Sites

```bash
# Find all site configs missing IPv6
for site in /etc/nginx/sites-available/*; do
    if ! grep -q "listen \[::\]:443" "$site" 2>/dev/null; then
        echo "Missing IPv6: $site"
    fi
done

# Use sed to add IPv6 listeners (BE CAREFUL - test on one site first)
sudo sed -i 's/listen 443 ssl http2;/listen 443 ssl http2;\n    listen [::]:443 ssl http2;/' /etc/nginx/sites-available/yoursite
sudo sed -i 's/listen 80;$/listen 80;\n    listen [::]:80;/' /etc/nginx/sites-available/yoursite

# ALWAYS test before reloading
sudo nginx -t
sudo systemctl reload nginx
```

## Prevention

### Always Use Complete Listen Directives

When creating new sites, **always** include both IPv4 and IPv6:

```nginx
# Good - Both IPv4 and IPv6
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    ...
}

# Bad - IPv4 only
server {
    listen 443 ssl http2;
    ...
}
```

### Template for New Sites

```nginx
# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mysite.srv759970.hstgr.cloud;

    ssl_certificate /etc/letsencrypt/live/mysite.srv759970.hstgr.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mysite.srv759970.hstgr.cloud/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name mysite.srv759970.hstgr.cloud;
    return 301 https://$server_name$request_uri;
}
```

### Automated Check Script

Create a monitoring script:

```bash
#!/bin/bash
# /opt/scripts/check-ipv6-nginx.sh

echo "Sites missing IPv6 listeners:"
for site in /etc/nginx/sites-enabled/*; do
    if ! grep -q "listen \[::\]:443" "$site" 2>/dev/null; then
        basename "$site"
    fi
done
```

Run periodically or after adding new sites.

## Real-World Case Study

**Scenario**: audioguides.srv759970.hstgr.cloud was returning ca-handi-long's certificate

**Investigation**:
1. `curl https://audioguides.srv759970.hstgr.cloud` → SSL error
2. `openssl s_client` → showed `CN=ca-handi-long.srv759970.hstgr.cloud`
3. Both domains had same IP address (DNS was correct)
4. Checked nginx configs: audioguides had no `listen [::]:443`
5. ca-handi-long had `listen [::]:443`, was first IPv6 listener alphabetically

**Fix**: Added IPv6 listeners to audioguides config

**Result**: Both sites now work correctly on IPv4 and IPv6

## Related Resources

- [Nginx Server Names Documentation](https://nginx.org/en/docs/http/server_names.html)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [SNI (Server Name Indication) Overview](https://en.wikipedia.org/wiki/Server_Name_Indication)

## Key Takeaways

1. **Always configure IPv6 listeners** for all sites, even if you think your users don't use IPv6
2. IPv6 adoption is widespread - many ISPs and mobile networks prefer IPv6
3. Missing IPv6 listeners causes SNI to fail, resulting in wrong certificate being served
4. This is a configuration issue, not a certificate or DNS issue
5. The fix is simple: add `listen [::]:443 ssl http2;` and `listen [::]:80;`
6. Test both IPv4 and IPv6 after making changes
7. Include IPv6 listeners in all templates and documentation
