# Nginx Audit & Auto-Fix Tool

Comprehensive audit and auto-fix tool for Nginx configurations on Hostinger VPS srv759970.

## Quick Start

```bash
# 1. Run audit (report only, no changes)
/opt/scripts/nginx-audit.sh --report-only

# 2. Fix all issues automatically
/opt/scripts/nginx-audit.sh --auto-fix

# 3. Audit + fix single site
/opt/scripts/nginx-audit.sh --site mysite.srv759970.hstgr.cloud --fix
```

## What It Does

### Detects and Fixes

✅ **Missing IPv6 Listeners** (CRITICAL)
- Prevents SSL certificate mismatch errors
- Adds `listen [::]:443 ssl http2;` and `listen [::]:80;`

✅ **SSL Certificate Issues**
- Detects expired certificates
- Warns about certificates expiring soon

✅ **Missing Security Headers**
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security (HSTS)
- Referrer-Policy

✅ **Configuration Best Practices**
- server_tokens visibility
- Proxy header configuration
- Timeout settings

## Installation

See [references/install.sh](references/install.sh) and [references/quick-start.md](references/quick-start.md)

```bash
ssh automation@69.62.108.82
cd /tmp
# Copy install.sh and nginx-audit-script.sh
chmod +x install.sh
./install.sh
```

## Features

### 🔒 Safe Operations

- **Automatic Backup**: Every fix creates timestamped backup
- **Configuration Test**: `nginx -t` before reload
- **Automatic Rollback**: Restores backup if tests fail
- **Zero Downtime**: Uses `nginx reload` not `restart`

### 📊 Flexible Reporting

- Console output (colored, readable)
- JSON output (for automation)
- Detailed logs in `/var/log/nginx-audit.log`

### 🎯 Selective Auditing

- All sites or single site
- All checks or specific category (ipv6, ssl, security)
- Dry run mode (see what would change)

### ⚡ Automation Ready

- Cron job support
- Exit codes for scripting
- JSON output for monitoring integration

## File Structure

```
julien-infra-nginx-audit/
├── SKILL.md                          # Main skill documentation
├── README.md                         # This file
└── references/
    ├── nginx-audit-script.sh         # Main audit script (deploy to /opt/scripts/)
    ├── install.sh                    # Installation script
    ├── quick-start.md                # Quick start guide
    └── ipv6-ssl-certificate-issues.md # Deep dive IPv6/SSL issues
```

## Usage Examples

### Check What Needs Fixing

```bash
/opt/scripts/nginx-audit.sh --report-only
```

Output:
```
============================================
NGINX CONFIGURATION AUDIT REPORT
Server: srv759970.hstgr.cloud
============================================

❌ CRITICAL ISSUES
- audioguides.srv759970.hstgr.cloud: Missing [::]:443 and [::]:80
- test-site.srv759970.hstgr.cloud: Missing [::]:443

⚠️ WARNINGS
- old-site.srv759970.hstgr.cloud: Missing security headers

✅ PASSED
- 62 other sites OK
```

### Fix Everything

```bash
/opt/scripts/nginx-audit.sh --auto-fix
```

Output:
```
📁 Creating backup at /opt/backups/nginx-20251209-103000
❌ Missing IPv6: audioguides.srv759970.hstgr.cloud
✅ Added [::]:443 listener
✅ Added [::]:80 listener
✅ Configuration test passed
✅ Nginx reloaded successfully
```

### Restore from Backup

```bash
/opt/scripts/nginx-restore.sh /opt/backups/nginx-20251209-103000
```

## Command Reference

| Command | Description |
|---------|-------------|
| `--report-only` | Audit only, no changes |
| `--auto-fix` | Apply all fixes automatically |
| `--site SITENAME` | Audit single site |
| `--site SITENAME --fix` | Fix single site |
| `--dry-run` | Show what would change |
| `--check ipv6` | Only check IPv6 |
| `--check ssl` | Only check SSL |
| `--check security` | Only check security |
| `--json` | JSON output |
| `--verbose` | Detailed output |

## Integration

### With julien-infra-hostinger-nginx

After creating new site:
```bash
# Create site
sudo nano /etc/nginx/sites-available/mysite

# Enable site
sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/

# Get SSL
sudo certbot --nginx -d mysite.srv759970.hstgr.cloud

# Audit
/opt/scripts/nginx-audit.sh --site mysite.srv759970.hstgr.cloud --fix
```

### Weekly Automation

```bash
# Add to crontab
0 3 * * 1 /opt/scripts/nginx-audit.sh --report-only > /opt/reports/nginx-audit-$(date +\%Y\%m\%d).txt 2>&1
```

## Real-World Impact

**Before Audit Tool:**
- Manual IPv6 configuration → human error
- SSL certificate mismatches → site downtime
- Security headers forgotten → vulnerabilities
- Time: 30+ minutes per site

**After Audit Tool:**
- Automated detection and fix
- Zero downtime deployments
- Consistent security across all sites
- Time: < 1 minute for all 65 sites

## Version History

### v1.0.0 (2025-12-09)
- Initial release
- IPv6 listener detection and auto-fix
- SSL certificate expiration checks
- Security headers audit
- Automatic backup and rollback
- JSON report format
- Dry run mode

## See Also

- **julien-infra-hostinger-nginx** - Main Nginx management skill
- **references/ipv6-ssl-certificate-issues.md** - Deep dive into IPv6/SSL problems
- **references/quick-start.md** - Detailed quick start guide

## Support

Check logs:
```bash
tail -f /var/log/nginx-audit.log
```

Manual verification:
```bash
# Test IPv4 and IPv6
curl -4 https://yoursite.srv759970.hstgr.cloud
curl -6 https://yoursite.srv759970.hstgr.cloud

# Check SSL certificate
openssl s_client -connect yoursite.srv759970.hstgr.cloud:443 \
    -servername yoursite.srv759970.hstgr.cloud </dev/null 2>&1 | \
    grep subject
```
