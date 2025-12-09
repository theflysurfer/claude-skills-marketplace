# Example Audit Outputs

## Example 1: Fresh Server with Multiple Issues

### Command
```bash
/opt/scripts/nginx-audit.sh --report-only
```

### Output
```
============================================
NGINX CONFIGURATION AUDIT REPORT
Server: srv759970.hstgr.cloud
Date: 2025-12-09 10:30:00
Mode: REPORT ONLY
============================================

📊 Auditing 65 sites...

❌ Missing IPv6: audioguides.srv759970.hstgr.cloud (both [::]:443 and [::]:80)
❌ Missing IPv6: test-app.srv759970.hstgr.cloud ([::]:443 only)
❌ Missing IPv6: legacy-site.srv759970.hstgr.cloud (both [::]:443 and [::]:80)
❌ SSL EXPIRING SOON: old-project.srv759970.hstgr.cloud (expires in 4 days)
⚠️  Missing security headers in blog.srv759970.hstgr.cloud: X-Frame-Options X-XSS-Protection HSTS
⚠️  Missing security headers in portfolio.srv759970.hstgr.cloud: HSTS Referrer-Policy
⚠️  Missing security headers in api.srv759970.hstgr.cloud: X-Frame-Options X-Content-Type-Options X-XSS-Protection HSTS Referrer-Policy
⚠️  server_tokens not disabled in demo.srv759970.hstgr.cloud
⚠️  server_tokens not disabled in staging.srv759970.hstgr.cloud

============================================
AUDIT SUMMARY
============================================
Total sites audited: 65
Critical issues: 4
Warnings: 5
Passed checks: 56

Recommendations:
1. Run with --auto-fix to add IPv6 listeners to 3 sites
2. Renew SSL certificate for old-project.srv759970.hstgr.cloud
3. Add security headers to 3 sites
4. Disable server_tokens on 2 sites

To apply automatic fixes:
/opt/scripts/nginx-audit.sh --auto-fix
============================================
```

## Example 2: Auto-Fix Operation

### Command
```bash
/opt/scripts/nginx-audit.sh --auto-fix
```

### Output
```
============================================
NGINX CONFIGURATION AUDIT
Server: srv759970.hstgr.cloud
Date: 2025-12-09 10:35:00
Mode: AUTO-FIX
============================================

ℹ️  Creating backup at /opt/backups/nginx-20251209-103500

📊 Auditing 65 sites...

❌ Missing IPv6: audioguides.srv759970.hstgr.cloud (both [::]:443 and [::]:80)
ℹ️  Fixing IPv6 for audioguides.srv759970.hstgr.cloud...
✅ Added [::]:443 listener
✅ Added [::]:80 listener

❌ Missing IPv6: test-app.srv759970.hstgr.cloud ([::]:443 only)
ℹ️  Fixing IPv6 for test-app.srv759970.hstgr.cloud...
✅ Added [::]:443 listener

❌ Missing IPv6: legacy-site.srv759970.hstgr.cloud (both [::]:443 and [::]:80)
ℹ️  Fixing IPv6 for legacy-site.srv759970.hstgr.cloud...
✅ Added [::]:443 listener
✅ Added [::]:80 listener

⚠️  Missing security headers in blog.srv759970.hstgr.cloud: X-Frame-Options X-XSS-Protection HSTS
ℹ️  Adding security headers to blog.srv759970.hstgr.cloud...
✅ Added 3 security headers

⚠️  Missing security headers in portfolio.srv759970.hstgr.cloud: HSTS Referrer-Policy
ℹ️  Adding security headers to portfolio.srv759970.hstgr.cloud...
✅ Added 2 security headers

⚠️  Missing security headers in api.srv759970.hstgr.cloud: X-Frame-Options X-Content-Type-Options X-XSS-Protection HSTS Referrer-Policy
ℹ️  Adding security headers to api.srv759970.hstgr.cloud...
✅ Added 5 security headers

ℹ️  Testing Nginx configuration...
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
✅ Configuration test passed

ℹ️  Reloading Nginx...
✅ Nginx reloaded successfully

============================================
AUDIT SUMMARY
============================================
Total sites audited: 65
Critical issues: 4
Warnings: 5
Passed checks: 56
Fixes applied: 15

Backup location: /opt/backups/nginx-20251209-103500
============================================
```

## Example 3: Single Site Audit

### Command
```bash
/opt/scripts/nginx-audit.sh --site audioguides.srv759970.hstgr.cloud
```

### Output
```
============================================
NGINX CONFIGURATION AUDIT
Server: srv759970.hstgr.cloud
Date: 2025-12-09 10:40:00
Mode: REPORT ONLY
Site: audioguides.srv759970.hstgr.cloud
============================================

ℹ️  Auditing: audioguides.srv759970.hstgr.cloud

❌ Missing IPv6: audioguides.srv759970.hstgr.cloud (both [::]:443 and [::]:80)
✅ SSL OK: audioguides.srv759970.hstgr.cloud (expires in 85 days)
✅ Security headers OK: audioguides.srv759970.hstgr.cloud
⚠️  server_tokens not disabled in audioguides.srv759970.hstgr.cloud

============================================
AUDIT SUMMARY
============================================
Total sites audited: 1
Critical issues: 1
Warnings: 1
Passed checks: 2

To fix this site:
/opt/scripts/nginx-audit.sh --site audioguides.srv759970.hstgr.cloud --fix
============================================
```

## Example 4: Dry Run Mode

### Command
```bash
/opt/scripts/nginx-audit.sh --dry-run
```

### Output
```
============================================
NGINX CONFIGURATION AUDIT
Server: srv759970.hstgr.cloud
Date: 2025-12-09 10:45:00
Mode: AUTO-FIX
DRY RUN: No changes will be applied
============================================

ℹ️  DRY RUN: Would create backup at /opt/backups/nginx-20251209-104500

📊 Auditing 65 sites...

❌ Missing IPv6: audioguides.srv759970.hstgr.cloud (both [::]:443 and [::]:80)
ℹ️  DRY RUN: Would add IPv6 listeners to audioguides.srv759970.hstgr.cloud

❌ Missing IPv6: test-app.srv759970.hstgr.cloud ([::]:443 only)
ℹ️  DRY RUN: Would add IPv6 listeners to test-app.srv759970.hstgr.cloud

⚠️  Missing security headers in blog.srv759970.hstgr.cloud: X-Frame-Options X-XSS-Protection HSTS
ℹ️  DRY RUN: Would add security headers to blog.srv759970.hstgr.cloud

ℹ️  DRY RUN: Would test nginx configuration
ℹ️  DRY RUN: Would reload nginx

============================================
AUDIT SUMMARY
============================================
Total sites audited: 65
Critical issues: 2
Warnings: 1
Passed checks: 62
Fixes applied: 0

DRY RUN - No changes were made
To apply these fixes, run without --dry-run
============================================
```

## Example 5: JSON Output

### Command
```bash
/opt/scripts/nginx-audit.sh --json
```

### Output
```json
{
  "timestamp": "2025-12-09T10:50:00Z",
  "server": "srv759970.hstgr.cloud",
  "summary": {
    "total_sites": 65,
    "critical_issues": 3,
    "warnings": 4,
    "passed_checks": 58,
    "fixes_applied": 0
  },
  "backup_location": ""
}
```

## Example 6: IPv6 Only Check

### Command
```bash
/opt/scripts/nginx-audit.sh --check ipv6
```

### Output
```
============================================
NGINX CONFIGURATION AUDIT
Server: srv759970.hstgr.cloud
Date: 2025-12-09 10:55:00
Mode: REPORT ONLY
Check Type: ipv6
============================================

📊 Auditing 65 sites (IPv6 only)...

❌ Missing IPv6: audioguides.srv759970.hstgr.cloud (both [::]:443 and [::]:80)
❌ Missing IPv6: test-app.srv759970.hstgr.cloud ([::]:443 only)
❌ Missing IPv6: legacy-site.srv759970.hstgr.cloud (both [::]:443 and [::]:80)
✅ IPv6 OK: ca-handi-long.srv759970.hstgr.cloud
✅ IPv6 OK: wordpress.srv759970.hstgr.cloud
... (62 more sites OK)

============================================
AUDIT SUMMARY
============================================
Total sites audited: 65
Critical issues: 3
Warnings: 0
Passed checks: 62

To fix IPv6 issues:
/opt/scripts/nginx-audit.sh --check ipv6 --auto-fix
============================================
```

## Example 7: Configuration Test Failure with Rollback

### Command
```bash
/opt/scripts/nginx-audit.sh --auto-fix
```

### Output (Simulated Error)
```
============================================
NGINX CONFIGURATION AUDIT
Server: srv759970.hstgr.cloud
Date: 2025-12-09 11:00:00
Mode: AUTO-FIX
============================================

ℹ️  Creating backup at /opt/backups/nginx-20251209-110000

📊 Auditing 65 sites...

❌ Missing IPv6: bad-config.srv759970.hstgr.cloud (both [::]:443 and [::]:80)
ℹ️  Fixing IPv6 for bad-config.srv759970.hstgr.cloud...
✅ Added [::]:443 listener
✅ Added [::]:80 listener

ℹ️  Testing Nginx configuration...
nginx: [emerg] unexpected "}" in /etc/nginx/sites-available/bad-config.srv759970.hstgr.cloud:25
nginx: configuration file /etc/nginx/nginx.conf test failed
❌ Configuration test FAILED

❌ Configuration test failed! Rolling back...
ℹ️  Restored to previous configuration

ERROR: Configuration test failed, changes rolled back
============================================
```

## Example 8: Successful Single Site Fix

### Command
```bash
/opt/scripts/nginx-audit.sh --site audioguides.srv759970.hstgr.cloud --fix
```

### Output
```
============================================
NGINX CONFIGURATION AUDIT
Server: srv759970.hstgr.cloud
Date: 2025-12-09 11:05:00
Mode: AUTO-FIX
Site: audioguides.srv759970.hstgr.cloud
============================================

ℹ️  Creating backup at /opt/backups/nginx-20251209-110500

ℹ️  Auditing: audioguides.srv759970.hstgr.cloud

❌ Missing IPv6: audioguides.srv759970.hstgr.cloud (both [::]:443 and [::]:80)
ℹ️  Fixing IPv6 for audioguides.srv759970.hstgr.cloud...
✅ Added [::]:443 listener
✅ Added [::]:80 listener

ℹ️  Testing Nginx configuration...
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
✅ Configuration test passed

ℹ️  Reloading Nginx...
✅ Nginx reloaded successfully

============================================
AUDIT SUMMARY
============================================
Total sites audited: 1
Critical issues: 1
Warnings: 0
Passed checks: 0
Fixes applied: 2

Backup location: /opt/backups/nginx-20251209-110500

Site is now configured correctly!
Verify: curl -6 https://audioguides.srv759970.hstgr.cloud
============================================
```

## Example 9: Verbose Output

### Command
```bash
/opt/scripts/nginx-audit.sh --verbose
```

### Output (Partial)
```
============================================
NGINX CONFIGURATION AUDIT
Server: srv759970.hstgr.cloud
Date: 2025-12-09 11:10:00
Mode: REPORT ONLY
============================================

📊 Auditing 65 sites...

ℹ️  Auditing: audioguides.srv759970.hstgr.cloud
❌ Missing IPv6: audioguides.srv759970.hstgr.cloud (both [::]:443 and [::]:80)
✅ SSL OK: audioguides.srv759970.hstgr.cloud (expires in 85 days)
✅ Security headers OK: audioguides.srv759970.hstgr.cloud

ℹ️  Auditing: ca-handi-long.srv759970.hstgr.cloud
✅ IPv6 OK: ca-handi-long.srv759970.hstgr.cloud
✅ SSL OK: ca-handi-long.srv759970.hstgr.cloud (expires in 86 days)
✅ Security headers OK: ca-handi-long.srv759970.hstgr.cloud
✅ server_tokens off: ca-handi-long.srv759970.hstgr.cloud

ℹ️  Auditing: wordpress.srv759970.hstgr.cloud
✅ IPv6 OK: wordpress.srv759970.hstgr.cloud
✅ SSL OK: wordpress.srv759970.hstgr.cloud (expires in 35 days)
⚠️  Missing security headers in wordpress.srv759970.hstgr.cloud: HSTS

... (continues for all 65 sites)

============================================
AUDIT SUMMARY
============================================
... (summary as usual)
```

## Log File Example

### Location
```
/var/log/nginx-audit.log
```

### Content
```
[2025-12-09 10:30:00] Starting audit - mode: report-only
[2025-12-09 10:30:00] Auditing 65 sites
[2025-12-09 10:30:15] Found 3 sites missing IPv6
[2025-12-09 10:30:15] Found 4 security warnings
[2025-12-09 10:30:15] Audit complete - critical: 3, warnings: 4
[2025-12-09 10:35:00] Starting audit - mode: auto-fix
[2025-12-09 10:35:00] Backup created at /opt/backups/nginx-20251209-103500
[2025-12-09 10:35:01] Fixed IPv6 for audioguides.srv759970.hstgr.cloud
[2025-12-09 10:35:02] Fixed IPv6 for test-app.srv759970.hstgr.cloud
[2025-12-09 10:35:03] Added security headers to blog.srv759970.hstgr.cloud
[2025-12-09 10:35:10] Configuration test passed
[2025-12-09 10:35:11] Nginx reloaded successfully
[2025-12-09 10:35:11] Audit complete - fixes applied: 10
```
