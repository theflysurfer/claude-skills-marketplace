# SSL Certificate Management with Certbot

Complete guide for managing SSL certificates on Hostinger VPS using Let's Encrypt and Certbot.

## Initial Setup

Certbot is already installed on srv759970. To verify:

```bash
certbot --version
```

## Obtaining a Certificate

### Basic SSL Setup

For a single domain:

```bash
sudo certbot --nginx -d mysite.srv759970.hstgr.cloud
```

For multiple domains (same certificate):

```bash
sudo certbot --nginx -d mysite.srv759970.hstgr.cloud -d www.mysite.com
```

### What Certbot Does Automatically

1. **Validates domain ownership** via HTTP challenge
2. **Obtains certificate** from Let's Encrypt
3. **Modifies nginx config** to enable SSL
4. **Sets up auto-renewal** via systemd timer

### Certificate Storage

Certificates are stored in:
- **Certificates**: `/etc/letsencrypt/live/domain/`
  - `fullchain.pem` - Certificate + intermediate chain
  - `privkey.pem` - Private key
  - `cert.pem` - Certificate only
  - `chain.pem` - Intermediate certificates

- **Archives**: `/etc/letsencrypt/archive/domain/`
- **Renewal configs**: `/etc/letsencrypt/renewal/domain.conf`

## Certificate Renewal

### Automatic Renewal

Certbot sets up a systemd timer for automatic renewal:

```bash
# Check timer status
sudo systemctl status certbot.timer

# View timer schedule
sudo systemctl list-timers certbot.timer
```

Timer runs twice daily and renews certificates expiring within 30 days.

### Manual Renewal

```bash
# Dry run (test renewal without actually renewing)
sudo certbot renew --dry-run

# Force renewal (even if not near expiration)
sudo certbot renew --force-renewal

# Renew specific domain
sudo certbot renew --cert-name mysite.srv759970.hstgr.cloud
```

### Post-Renewal Hooks

To run commands after renewal (e.g., reload nginx):

```bash
sudo certbot renew --deploy-hook "systemctl reload nginx"
```

Or add to renewal config (`/etc/letsencrypt/renewal/domain.conf`):
```ini
[renewalparams]
post_hook = systemctl reload nginx
```

## Certificate Management

### List All Certificates

```bash
sudo certbot certificates
```

Output shows:
- Certificate name
- Domains covered
- Expiry date
- Certificate path

### View Certificate Details

```bash
# Using certbot
sudo certbot certificates -d mysite.srv759970.hstgr.cloud

# Using openssl
openssl x509 -in /etc/letsencrypt/live/mysite.srv759970.hstgr.cloud/cert.pem -text -noout
```

### Delete Certificate

```bash
sudo certbot delete --cert-name mysite.srv759970.hstgr.cloud
```

**Warning**: This does NOT remove nginx configuration. Update nginx manually.

### Revoke Certificate

If compromised:

```bash
sudo certbot revoke --cert-path /etc/letsencrypt/live/mysite.srv759970.hstgr.cloud/cert.pem
```

## Troubleshooting

### Certificate Not Renewing

**Check renewal logs**:
```bash
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

**Common issues**:

1. **Site not accessible**
   - Ensure site responds on HTTP (port 80)
   - Check firewall: `sudo ufw status`
   - Verify nginx config: `sudo nginx -t`

2. **Rate limits**
   - Let's Encrypt has rate limits (5 certificates/domain/week)
   - Use staging environment for testing: `--test-cert`

3. **Validation fails**
   - Check DNS: `dig mysite.srv759970.hstgr.cloud`
   - Ensure `.well-known/acme-challenge/` is accessible
   - Check nginx doesn't block `/.well-known/`

### Certificate Expired

If auto-renewal failed:

```bash
# Force immediate renewal
sudo certbot renew --force-renewal

# If that fails, obtain new certificate
sudo certbot --nginx -d mysite.srv759970.hstgr.cloud --force-renewal
```

### Multiple Nginx Configs Conflict

If certbot modifies wrong config:

```bash
# Specify config file
sudo certbot --nginx --nginx-server-root /etc/nginx/sites-enabled/mysite
```

## Best Practices

1. **Test before production**
   ```bash
   # Use staging environment (won't count against rate limits)
   sudo certbot --nginx -d test.srv759970.hstgr.cloud --staging
   ```

2. **Monitor expiry dates**
   ```bash
   # Add to cron or monitoring
   sudo certbot certificates | grep "Expiry Date"
   ```

3. **Keep Certbot updated**
   ```bash
   sudo apt update && sudo apt upgrade certbot python3-certbot-nginx
   ```

4. **Backup certificates**
   ```bash
   sudo tar -czf letsencrypt-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/
   ```

## Advanced: Wildcard Certificates

Wildcard certs require DNS validation (not HTTP):

```bash
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d "*.srv759970.hstgr.cloud"
```

You'll need to add TXT records to DNS.

## Common Nginx SSL Configuration

After certbot runs, nginx config will include:

```nginx
server {
    listen 443 ssl;
    server_name mysite.srv759970.hstgr.cloud;

    ssl_certificate /etc/letsencrypt/live/mysite.srv759970.hstgr.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mysite.srv759970.hstgr.cloud/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Your proxy config...
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name mysite.srv759970.hstgr.cloud;
    return 301 https://$host$request_uri;
}
```

## Quick Reference

```bash
# Obtain certificate
sudo certbot --nginx -d domain.com

# Renew all certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# List certificates
sudo certbot certificates

# Delete certificate
sudo certbot delete --cert-name domain.com

# Check renewal timer
sudo systemctl status certbot.timer

# View renewal logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

## Rate Limits (Let's Encrypt)

- **Certificates per Registered Domain**: 50/week
- **Duplicate Certificate**: 5/week
- **Failed Validations**: 5/hour

Use `--staging` flag for testing to avoid hitting limits.

## Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://eff-certbot.readthedocs.io/)
- [Rate Limits](https://letsencrypt.org/docs/rate-limits/)
