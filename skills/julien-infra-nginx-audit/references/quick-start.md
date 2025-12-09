# Nginx Audit Tool - Quick Start Guide

## Installation (One-Time Setup)

```bash
# SSH to server
ssh automation@69.62.108.82

# Navigate to temp directory
cd /tmp

# Copy the audit script (from your local machine)
# Method 1: Using scp from local machine
scp nginx-audit-script.sh automation@69.62.108.82:/tmp/

# Method 2: Or copy content manually
nano nginx-audit-script.sh
# Paste content, save and exit

# Run installation
chmod +x install.sh
./install.sh
```

## Quick Commands

### 1. Run First Audit (Report Only)

```bash
/opt/scripts/nginx-audit.sh --report-only
```

**What it does:**
- Scans all enabled Nginx sites
- Reports missing IPv6 listeners
- Checks SSL certificate expiration
- Checks security headers
- Shows warnings and critical issues
- **Does NOT make any changes**

### 2. Fix All Issues Automatically

```bash
/opt/scripts/nginx-audit.sh --auto-fix
```

**What it does:**
- Creates automatic backup in `/opt/backups/`
- Adds missing IPv6 listeners
- Adds missing security headers
- Tests configuration with `nginx -t`
- Reloads Nginx if tests pass
- Rolls back automatically if tests fail

### 3. Audit Single Site

```bash
/opt/scripts/nginx-audit.sh --site audioguides.srv759970.hstgr.cloud
```

### 4. Fix Single Site

```bash
/opt/scripts/nginx-audit.sh --site audioguides.srv759970.hstgr.cloud --fix
```

### 5. Dry Run (See What Would Change)

```bash
/opt/scripts/nginx-audit.sh --dry-run
```

### 6. Check Only IPv6

```bash
/opt/scripts/nginx-audit.sh --check ipv6
```

### 7. Check Only Security

```bash
/opt/scripts/nginx-audit.sh --check security
```

### 8. Generate JSON Report

```bash
/opt/scripts/nginx-audit.sh --json > /opt/reports/audit.json
```

## Common Scenarios

### Scenario 1: Just Added a New Site

```bash
# 1. Add site config
sudo nano /etc/nginx/sites-available/mysite

# 2. Enable site
sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/

# 3. Get SSL certificate
sudo certbot --nginx -d mysite.srv759970.hstgr.cloud

# 4. Audit the new site
/opt/scripts/nginx-audit.sh --site mysite.srv759970.hstgr.cloud

# 5. Fix any issues
/opt/scripts/nginx-audit.sh --site mysite.srv759970.hstgr.cloud --fix
```

### Scenario 2: SSL Certificate Mismatch Error

**Problem:** Users getting "certificate doesn't match domain" error

```bash
# 1. Check which sites are missing IPv6
/opt/scripts/nginx-audit.sh --check ipv6

# 2. Fix all IPv6 issues
/opt/scripts/nginx-audit.sh --check ipv6 --auto-fix

# 3. Verify fix
curl -6 https://yoursite.srv759970.hstgr.cloud
```

### Scenario 3: Bulk Fix All Sites

**Problem:** Multiple sites need IPv6 + security headers

```bash
# 1. See what needs fixing
/opt/scripts/nginx-audit.sh --report-only > /tmp/audit-before.txt
cat /tmp/audit-before.txt

# 2. Dry run to see changes
/opt/scripts/nginx-audit.sh --dry-run

# 3. Apply all fixes
/opt/scripts/nginx-audit.sh --auto-fix

# 4. Verify
/opt/scripts/nginx-audit.sh --report-only > /tmp/audit-after.txt
diff /tmp/audit-before.txt /tmp/audit-after.txt
```

### Scenario 4: Something Broke - Restore Backup

```bash
# 1. List available backups
ls -lt /opt/backups/

# 2. Restore from backup
/opt/scripts/nginx-restore.sh /opt/backups/nginx-20251209-103000

# This will:
# - Backup current config first
# - Restore from specified backup
# - Test configuration
# - Reload nginx if tests pass
```

## Understanding the Report

### Critical Issues (❌)

**Must be fixed immediately** - causes actual user-facing problems:
- Missing IPv6 listeners → SSL certificate mismatch
- SSL certificate expired → Site inaccessible
- SSL certificate expiring in < 7 days → Site will be inaccessible soon

### Warnings (⚠️)

**Should be fixed** - security or best practice issues:
- Missing security headers → Security vulnerabilities
- server_tokens enabled → Exposing server information
- SSL expiring in 7-30 days → Needs renewal soon

### Passed (✅)

Everything working correctly:
- IPv6 listeners configured
- SSL certificate valid
- Security headers present

## Safety Features

### 1. Automatic Backup

Every `--auto-fix` creates a timestamped backup:
```
/opt/backups/nginx-20251209-103000/
```

### 2. Configuration Test

Before reloading Nginx:
```bash
sudo nginx -t
```

If test fails → automatic rollback

### 3. No Downtime

Uses `nginx reload` (not restart):
- Zero downtime
- Graceful connection handling

### 4. Detailed Logging

All operations logged to:
```
/var/log/nginx-audit.log
```

## Files and Directories

```
/opt/scripts/
├── nginx-audit.sh       # Main audit script
└── nginx-restore.sh     # Backup restore script

/opt/backups/
└── nginx-YYYYMMDD-HHMMSS/  # Automatic backups

/opt/reports/
└── nginx-audit-YYYYMMDD.txt  # Weekly audit reports

/var/log/
└── nginx-audit.log      # Audit operation log
```

## Automation (Optional)

### Weekly Audit Email

```bash
# Edit crontab
crontab -e

# Add this line for weekly report
0 3 * * 1 /opt/scripts/nginx-audit.sh --report-only | mail -s "Nginx Audit Report" admin@example.com
```

### Daily IPv6 Check

```bash
# Quick check for critical IPv6 issues only
0 6 * * * /opt/scripts/nginx-audit.sh --check ipv6 --report-only | grep -i critical && echo "IPv6 issues detected" | mail -s "CRITICAL: Nginx IPv6 Issues" admin@example.com
```

## Troubleshooting

### Script Won't Run

```bash
# Check permissions
ls -la /opt/scripts/nginx-audit.sh

# Should be: -rwxr-xr-x

# Fix if needed
chmod +x /opt/scripts/nginx-audit.sh
```

### "Permission Denied" on Nginx Files

```bash
# Script needs sudo access to nginx configs
# Make sure 'automation' user can run sudo nginx commands
sudo visudo

# Should have this line:
# automation ALL=(ALL) NOPASSWD: /usr/sbin/nginx
```

### Backup Directory Full

```bash
# Clean old backups (keep last 10)
cd /opt/backups
ls -t | tail -n +11 | xargs rm -rf
```

## Next Steps

1. ✅ Run first audit: `/opt/scripts/nginx-audit.sh --report-only`
2. ✅ Review the report
3. ✅ Test on one site: `/opt/scripts/nginx-audit.sh --site TESTSITE --fix`
4. ✅ Verify the fix works
5. ✅ Apply to all sites: `/opt/scripts/nginx-audit.sh --auto-fix`

## Getting Help

View full documentation:
- Skill: `julien-infra-nginx-audit`
- Nginx skill: `julien-infra-hostinger-nginx`

Check logs:
```bash
tail -f /var/log/nginx-audit.log
```

Test individual site manually:
```bash
# Check IPv4
curl -4 -I https://yoursite.srv759970.hstgr.cloud

# Check IPv6
curl -6 -I https://yoursite.srv759970.hstgr.cloud

# Check SSL certificate
openssl s_client -connect yoursite.srv759970.hstgr.cloud:443 \
    -servername yoursite.srv759970.hstgr.cloud </dev/null 2>&1 | \
    grep subject
```
