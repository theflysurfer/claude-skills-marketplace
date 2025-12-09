---
name: julien-infra-nginx-audit
description: Audit and auto-fix Nginx configurations on Hostinger VPS srv759970 for IPv6 support, SSL issues, and best practices. Detects missing IPv6 listeners, validates SSL certificates, and applies fixes automatically or generates reports.
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
  keywords: ["nginx", "audit", "ipv6", "ssl", "automation", "hostinger", "validation"]
---

# Nginx Configuration Audit & Auto-Fix

Comprehensive audit tool for Nginx configurations on srv759970.hstgr.cloud. Detects missing IPv6 listeners, SSL certificate issues, security misconfigurations, and applies fixes automatically.

## Server Info

- **Host**: automation@69.62.108.82
- **Alias**: srv759970
- **Nginx config**: /etc/nginx/
- **Sites available**: /etc/nginx/sites-available/
- **Sites enabled**: /etc/nginx/sites-enabled/

## When to Use This Skill

Invoke automatically when:
- User asks to audit Nginx configurations
- After adding multiple new sites
- SSL certificate mismatch errors occur
- Need to verify IPv6 support across all sites
- Security audit requested
- Before major Nginx updates

## Audit Categories

### 1. IPv6 Listener Audit (CRITICAL)

**What it checks:**
- Missing `listen [::]:443 ssl http2;` in HTTPS blocks
- Missing `listen [::]:80;` in HTTP blocks
- Inconsistent IPv6 configuration across server blocks

**Why it matters:**
- Prevents SSL certificate mismatch errors
- Ensures IPv6 clients get correct certificates
- Critical for SNI (Server Name Indication) to work properly

**Auto-fix:** Adds IPv6 listeners to all server blocks

### 2. SSL Certificate Audit

**What it checks:**
- Certificate expiration dates
- Certificate/domain name mismatches
- Missing SSL directives
- Weak SSL protocols (TLSv1.0, TLSv1.1)
- Missing security headers

**Why it matters:**
- Prevents expired certificate errors
- Ensures strong encryption
- Improves security posture

**Auto-fix:** Reports issues (manual certbot renewal required)

### 3. Security Headers Audit

**What it checks:**
- Missing `X-Frame-Options`
- Missing `X-Content-Type-Options`
- Missing `X-XSS-Protection`
- Missing `Strict-Transport-Security` (HSTS)
- Missing `Referrer-Policy`

**Why it matters:**
- Prevents XSS attacks
- Prevents clickjacking
- Improves security score

**Auto-fix:** Adds security headers to server blocks

### 4. Configuration Best Practices

**What it checks:**
- `server_tokens off` (hide Nginx version)
- Proper proxy headers
- Timeout configurations
- Client body size limits
- Log file configurations

**Why it matters:**
- Reduces attack surface
- Improves debugging
- Prevents common issues

**Auto-fix:** Applies recommended settings

## Usage

### Quick Audit (Report Only)

```bash
# SSH to server
ssh srv759970

# Run audit script
/opt/scripts/nginx-audit.sh --report-only

# Output will show:
# - Sites missing IPv6
# - SSL issues
# - Security problems
# - Configuration warnings
```

### Full Audit with Auto-Fix

```bash
# Run audit with automatic fixes
/opt/scripts/nginx-audit.sh --auto-fix

# This will:
# 1. Backup all configs to /opt/backups/nginx-YYYYMMDD-HHMMSS/
# 2. Apply fixes
# 3. Test configuration (nginx -t)
# 4. Reload Nginx if tests pass
# 5. Generate report
```

### Audit Specific Site

```bash
# Audit single site
/opt/scripts/nginx-audit.sh --site mysite.srv759970.hstgr.cloud

# Fix single site
/opt/scripts/nginx-audit.sh --site mysite.srv759970.hstgr.cloud --fix
```

### Generate JSON Report

```bash
# For integration with monitoring tools
/opt/scripts/nginx-audit.sh --json > /opt/reports/nginx-audit.json
```

## Audit Script Features

### 1. IPv6 Detection and Fix

**Detection:**
```bash
# Finds sites missing IPv6 listeners
for site in /etc/nginx/sites-enabled/*; do
    if ! grep -q "listen \[::\]:443" "$site" 2>/dev/null; then
        echo "MISSING IPv6 HTTPS: $(basename $site)"
    fi
    if ! grep -q "listen \[::\]:80" "$site" 2>/dev/null; then
        echo "MISSING IPv6 HTTP: $(basename $site)"
    fi
done
```

**Auto-fix:**
```bash
# Adds IPv6 listeners after existing listen directives
sed -i 's/^\(\s*\)listen 443 ssl http2;$/&\n\1listen [::]:443 ssl http2;/' "$site"
sed -i 's/^\(\s*\)listen 80;$/&\n\1listen [::]:80;/' "$site"
```

### 2. SSL Certificate Check

**Detection:**
```bash
# Check all certificates
sudo certbot certificates | grep -E "(Certificate Name|Expiry Date|EXPIRED)"

# Check specific domain
echo | openssl s_client -connect domain.srv759970.hstgr.cloud:443 \
    -servername domain.srv759970.hstgr.cloud 2>/dev/null | \
    openssl x509 -noout -dates
```

### 3. Security Headers Check

**Detection:**
```bash
# Check if site has security headers
grep -E "add_header.*(X-Frame-Options|X-Content-Type|X-XSS|HSTS|Referrer)" "$site"
```

**Auto-fix:**
```bash
# Add security headers block after ssl_certificate directives
sed -i '/ssl_certificate/a\
\
    # Security Headers\
    add_header X-Frame-Options "SAMEORIGIN" always;\
    add_header X-Content-Type-Options "nosniff" always;\
    add_header X-XSS-Protection "1; mode=block" always;\
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;' "$site"
```

### 4. Configuration Validation

**Before applying fixes:**
```bash
# Backup current configs
BACKUP_DIR="/opt/backups/nginx-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /etc/nginx/sites-available/* "$BACKUP_DIR/"
```

**After applying fixes:**
```bash
# Test configuration
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "✅ Fixes applied successfully"
else
    # Rollback on error
    cp -r "$BACKUP_DIR/"* /etc/nginx/sites-available/
    echo "❌ Configuration test failed, rolled back"
fi
```

## Installation

### 1. Create Audit Script

```bash
# SSH to server
ssh srv759970

# Create scripts directory
sudo mkdir -p /opt/scripts
sudo chown automation:automation /opt/scripts

# Create audit script (content in references/nginx-audit-script.sh)
sudo nano /opt/scripts/nginx-audit.sh

# Make executable
sudo chmod +x /opt/scripts/nginx-audit.sh
```

### 2. Create Backup Directory

```bash
sudo mkdir -p /opt/backups
sudo chown automation:automation /opt/backups
```

### 3. Setup Cron Job (Optional)

```bash
# Weekly audit report
sudo crontab -e

# Add this line:
0 3 * * 1 /opt/scripts/nginx-audit.sh --report-only > /opt/reports/nginx-audit-$(date +\%Y\%m\%d).txt 2>&1
```

## Audit Report Format

### Console Output

```
============================================
NGINX CONFIGURATION AUDIT REPORT
Server: srv759970.hstgr.cloud
Date: 2025-12-09 10:30:00
============================================

📊 SUMMARY
Total sites: 65
Sites audited: 65
Critical issues: 3
Warnings: 12
Passed: 50

❌ CRITICAL ISSUES

[1] Missing IPv6 Listeners
Sites affected: 3
- audioguides.srv759970.hstgr.cloud (missing [::]:443 and [::]:80)
- myapp.srv759970.hstgr.cloud (missing [::]:443)
- test-site.srv759970.hstgr.cloud (missing [::]:80)

[2] SSL Certificate Expiring Soon
Sites affected: 2
- old-site.srv759970.hstgr.cloud (expires in 5 days)
- legacy-app.srv759970.hstgr.cloud (expires in 12 days)

⚠️ WARNINGS

[1] Missing Security Headers
Sites affected: 8
- site1.srv759970.hstgr.cloud (missing X-Frame-Options, HSTS)
- site2.srv759970.hstgr.cloud (missing X-XSS-Protection)
...

[2] server_tokens enabled
Sites affected: 4
- Exposing Nginx version information

✅ PASSED CHECKS
- All sites have valid SSL certificates
- No syntax errors found
- All enabled sites are reachable
- Proper proxy headers configured

============================================
RECOMMENDATIONS

1. Run with --auto-fix to add IPv6 listeners
2. Renew SSL certificates for 2 sites
3. Add security headers to 8 sites
4. Hide Nginx version (server_tokens off)

To apply automatic fixes:
/opt/scripts/nginx-audit.sh --auto-fix

To fix specific site:
/opt/scripts/nginx-audit.sh --site SITENAME --fix
============================================
```

### JSON Output

```json
{
  "timestamp": "2025-12-09T10:30:00Z",
  "server": "srv759970.hstgr.cloud",
  "summary": {
    "total_sites": 65,
    "audited": 65,
    "critical": 3,
    "warnings": 12,
    "passed": 50
  },
  "critical_issues": [
    {
      "category": "ipv6",
      "severity": "critical",
      "count": 3,
      "sites": [
        {
          "name": "audioguides.srv759970.hstgr.cloud",
          "missing": ["[::]:443", "[::]:80"],
          "auto_fixable": true
        }
      ]
    }
  ],
  "warnings": [...],
  "passed": [...],
  "recommendations": [...]
}
```

## Safe Mode Features

### Automatic Backup

Every fix operation creates a timestamped backup:
```
/opt/backups/nginx-20251209-103000/
├── audioguides.srv759970.hstgr.cloud
├── ca-handi-long
├── wordpress.srv759970.hstgr.cloud
└── ...
```

### Rollback on Failure

If `nginx -t` fails after applying fixes:
1. Automatically restores from backup
2. Shows error details
3. Generates rollback report
4. No downtime

### Dry Run Mode

```bash
# See what would be changed without applying
/opt/scripts/nginx-audit.sh --dry-run

# Output shows exact sed commands that would run
```

## Integration with Other Skills

### Used by julien-infra-hostinger-nginx

When adding new site:
```bash
# After creating config
sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Run audit to verify
/opt/scripts/nginx-audit.sh --site mysite
```

### Used by julien-infra-hostinger-maintenance

Monthly maintenance includes:
```bash
# Full audit with fixes
/opt/scripts/nginx-audit.sh --auto-fix

# SSL renewal check
sudo certbot renew --dry-run

# Clean old backups (keep last 10)
ls -t /opt/backups/nginx-* | tail -n +11 | xargs rm -rf
```

## Common Audit Scenarios

### Scenario 1: New Site Added Without IPv6

**Problem:** Site shows SSL certificate mismatch for IPv6 clients

**Detection:**
```bash
/opt/scripts/nginx-audit.sh --site newsite.srv759970.hstgr.cloud
# Output: ❌ Missing [::]:443 and [::]:80 listeners
```

**Fix:**
```bash
/opt/scripts/nginx-audit.sh --site newsite.srv759970.hstgr.cloud --fix
# Adds IPv6 listeners, tests, reloads
```

**Verify:**
```bash
curl -6 https://newsite.srv759970.hstgr.cloud
# Should work now
```

### Scenario 2: Mass Migration to IPv6

**Problem:** 20+ sites need IPv6 support

**Solution:**
```bash
# Audit all sites
/opt/scripts/nginx-audit.sh --report-only > audit-before.txt

# Review report
cat audit-before.txt

# Apply fixes to all sites
/opt/scripts/nginx-audit.sh --auto-fix

# Verify
/opt/scripts/nginx-audit.sh --report-only > audit-after.txt
diff audit-before.txt audit-after.txt
```

### Scenario 3: Security Audit

**Problem:** Need to add security headers to all sites

**Solution:**
```bash
/opt/scripts/nginx-audit.sh --check security --auto-fix
```

## Reference Files

- **references/nginx-audit-script.sh** - Complete audit script
- **references/nginx-audit-config.json** - Audit rules configuration
- **references/audit-examples.md** - Example audit reports
- **templates/audit-cron.sh** - Cron job template

## Important Notes

- **Always backup** before bulk operations
- **Test on one site first** before mass auto-fix
- **Review audit report** before applying fixes
- **Monitor logs** after applying fixes
- **Keep backups** for 30 days minimum
- **Run weekly audits** to catch new issues early

## Quick Commands Reference

```bash
# Full audit report
/opt/scripts/nginx-audit.sh --report-only

# Auto-fix all issues
/opt/scripts/nginx-audit.sh --auto-fix

# Audit single site
/opt/scripts/nginx-audit.sh --site SITENAME

# Fix single site
/opt/scripts/nginx-audit.sh --site SITENAME --fix

# Dry run (show what would change)
/opt/scripts/nginx-audit.sh --dry-run

# JSON output
/opt/scripts/nginx-audit.sh --json

# Only check IPv6
/opt/scripts/nginx-audit.sh --check ipv6

# Only check SSL
/opt/scripts/nginx-audit.sh --check ssl

# Verbose output
/opt/scripts/nginx-audit.sh --verbose

# Rollback to backup
/opt/scripts/nginx-restore.sh /opt/backups/nginx-20251209-103000
```

## 🔗 Skill Chaining

### Skills Required Before
- **julien-infra-hostinger-nginx** (obligatoire): Must have Nginx configs to audit
- **julien-infra-hostinger-ssh** (recommandé): Ensures SSH access configured

### Input Expected
- SSH access to VPS: `automation@69.62.108.82`
- Nginx installed and configured: `/etc/nginx/`
- At least one site configured in `/etc/nginx/sites-available/`
- Write permissions for backup directory: `/opt/backups/`

### Output Produced
- **Format**: Audit report (console, JSON, or markdown file)
- **Side effects**:
  - Backup created in `/opt/backups/nginx-[timestamp]/` (if auto-fix enabled)
  - Nginx configs modified (if auto-fix enabled):
    - IPv6 listeners added (`listen [::]:80;` and `listen [::]:443 ssl http2;`)
    - Security headers added (X-Frame-Options, HSTS, etc.)
    - Best practice directives added (server_tokens off, etc.)
  - Nginx reloaded (if auto-fix applied successfully)
- **Duration**: 10-30 seconds (audit-only) or 1-2 minutes (with auto-fix)

### Compatible Skills After

**Obligatoires:**
- **julien-infra-deployment-verifier**: Verify HTTP/SSL still working after auto-fix changes

**Recommandés:**
- **julien-infra-hostinger-maintenance**: If multiple issues found, schedule cleanup

**Optionnels:**
- Manual review: For complex issues that require human judgment
- Security scan: External tools (Qualys SSL Labs, Mozilla Observatory)

### Called By
- **julien-infra-hostinger-nginx**: Immediately after creating/modifying Nginx configs (OBLIGATOIRE in workflow)
- **julien-infra-hostinger-deployment**: After deployment completes (recommandé)
- **julien-infra-hostinger-docker**: After Docker service with reverse proxy deployed
- Direct user invocation: "Audit all Nginx configs" or "Fix SSL certificate issues"
- Cron job: Weekly automated audits (`0 3 * * 1 /opt/scripts/nginx-audit.sh --report-only`)

### Tools Used
- `Bash` (usage: SSH commands, nginx -t, systemctl reload, sed for auto-fix, grep for pattern matching)
- `Read` (usage: read Nginx config files to analyze)
- `Write` (usage: generate audit reports in markdown/JSON format)
- `Edit` (usage: apply auto-fixes to Nginx config files)
- `Grep` (usage: search for missing IPv6 listeners, SSL directives, security headers)

### Visual Workflow

```
[Trigger: After Nginx config change OR scheduled audit]
    ↓
julien-infra-nginx-audit (THIS SKILL)
    ├─► Step 1: Scan all sites
    │   ├─► Find all configs in /etc/nginx/sites-available/
    │   ├─► Parse server blocks
    │   └─► Extract domains, ports, SSL status
    ├─► Step 2: IPv6 Audit (CRITICAL)
    │   ├─► Check for "listen [::]:80;" in HTTP blocks
    │   ├─► Check for "listen [::]:443 ssl http2;" in HTTPS blocks
    │   └─► Flag missing IPv6 listeners (prevents SSL mismatch)
    ├─► Step 3: SSL Audit
    │   ├─► Check certificate expiration dates
    │   ├─► Verify SSL protocols (TLSv1.2+)
    │   └─► Check for weak ciphers
    ├─► Step 4: Security Headers Audit
    │   ├─► Check for X-Frame-Options
    │   ├─► Check for HSTS
    │   ├─► Check for X-Content-Type-Options
    │   └─► Check for CSP (optional)
    ├─► Step 5: Best Practices Audit
    │   ├─► server_tokens off
    │   ├─► client_max_body_size set
    │   └─► Proper proxy headers
    ├─► Step 6: Generate Report
    │   ├─► Summary: X critical, Y warnings, Z passed
    │   ├─► Detailed issues per site
    │   └─► Recommendations
    └─► Step 7: Auto-fix (if enabled)
        ├─► Backup configs to /opt/backups/nginx-[timestamp]/
        ├─► Apply fixes via sed/Edit
        ├─► Test config: sudo nginx -t
        ├─► If OK: sudo systemctl reload nginx
        └─► If FAIL: Restore from backup
    ↓
Audit complete: Report generated or fixes applied ✅
    ↓
julien-infra-deployment-verifier (OBLIGATOIRE if auto-fix applied)
    ├─► Check HTTP status (verify sites still accessible)
    ├─► Check SSL certificates (verify IPv6 fix worked)
    └─► Take screenshots (visual regression check)
    ↓
[Optional] Report to user or log to monitoring system
```

### Usage Example 1: Audit all sites after adding new site

**Scenario**: After creating new Nginx config for `myapp.srv759970.hstgr.cloud`, audit all configs to ensure consistency

**Command**:
```bash
# Automatically invoked after nginx config creation, or manually:
# "Audit all Nginx configurations"
```

**Result**:
- **Audit report**:
  - Total sites: 66
  - Critical issues: 1 (myapp missing IPv6 listeners)
  - Warnings: 0
  - Passed: 65
- **Issue detected**:
  - `myapp.srv759970.hstgr.cloud`: Missing `listen [::]:443 ssl http2;` and `listen [::]:80;`
- **Recommendation**: Run audit with `--auto-fix` to add IPv6 listeners
- Duration: ~15 seconds

### Usage Example 2: Auto-fix IPv6 issues across all sites

**Scenario**: After discovering 3 sites missing IPv6 listeners (causing SSL certificate mismatch for IPv6 clients)

**Command**:
```bash
# "Fix all Nginx IPv6 issues automatically"
```

**Result**:
- **Backup created**: `/opt/backups/nginx-20251209-143500/`
- **Sites fixed**: 3
  - `audioguides.srv759970.hstgr.cloud`: Added `listen [::]:80;` and `listen [::]:443 ssl http2;`
  - `myapp.srv759970.hstgr.cloud`: Added `listen [::]:80;` and `listen [::]:443 ssl http2;`
  - `test-site.srv759970.hstgr.cloud`: Added `listen [::]:80;`
- **Nginx config test**: PASSED ✅
- **Nginx reload**: SUCCESS ✅
- **Verification**: All 3 sites now return correct SSL certificates for both IPv4 and IPv6
- Duration: ~45 seconds
- **Next**: `julien-infra-deployment-verifier` automatically invoked to confirm all sites still accessible

### Usage Example 3: Scheduled weekly audit (cron)

**Scenario**: Automated weekly audit to catch configuration drift or expiring SSL certificates

**Cron job**:
```bash
0 3 * * 1 /opt/scripts/nginx-audit.sh --report-only --json > /opt/reports/nginx-audit-$(date +\%Y\%m\%d).json
```

**Result**:
- Runs every Monday at 3:00 AM
- Generates JSON report: `/opt/reports/nginx-audit-20251209.json`
- Report includes:
  - SSL certificates expiring in < 30 days
  - New sites missing IPv6 listeners
  - Missing security headers
- Duration: ~20 seconds
- **Alert**: If critical issues > 0, send notification (can integrate with monitoring)

## Validation Script

### validate-nginx-config.sh

Located at `scripts/validate-nginx-config.sh` (286 LOC)

Quick validation script that checks 11 common configuration issues across all Nginx sites.

**Usage:**
```bash
# Validate all enabled sites
./scripts/validate-nginx-config.sh

# Validate single site
./scripts/validate-nginx-config.sh mysite.srv759970.hstgr.cloud
```

**11 Validation Checks:**

| # | Check | Severity | Description |
|---|-------|----------|-------------|
| 1 | IPv4 HTTPS | CRITICAL | `listen 443 ssl` present |
| 2 | IPv6 HTTPS | CRITICAL | `listen [::]:443 ssl` present (prevents SNI issues) |
| 3 | IPv4 HTTP | WARNING | `listen 80` for HTTP redirect |
| 4 | IPv6 HTTP | WARNING | `listen [::]:80` for HTTP redirect |
| 5 | server_name | CRITICAL | server_name directive defined |
| 6 | SSL Certificate | CRITICAL | ssl_certificate path configured |
| 7 | SSL Key | CRITICAL | ssl_certificate_key path configured |
| 8 | HTTP/2 | WARNING | http2 enabled in listen directive |
| 9 | HTTPS Redirect | WARNING | HTTP→HTTPS redirect (return 301) |
| 10 | Proxy Headers | CRITICAL/WARNING | Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto |
| 11 | Security Headers | WARNING | X-Frame-Options present |

**Sample Output:**
```
========================================
  Nginx Configuration Validator
========================================

[i] Validating all enabled sites...
[i] Found 65 enabled site(s)

[i] Validating: clemencefouquet.srv759970.hstgr.cloud

[✓] clemencefouquet.srv759970.hstgr.cloud: Has IPv4 HTTPS listen directive
[✓] clemencefouquet.srv759970.hstgr.cloud: Has IPv6 HTTPS listen directive
[✓] clemencefouquet.srv759970.hstgr.cloud: Has IPv4 HTTP listen directive
[✓] clemencefouquet.srv759970.hstgr.cloud: Has IPv6 HTTP listen directive
[✓] clemencefouquet.srv759970.hstgr.cloud: Has server_name defined
[✓] clemencefouquet.srv759970.hstgr.cloud: SSL certificate configured
[✓] clemencefouquet.srv759970.hstgr.cloud: SSL key configured
[✓] clemencefouquet.srv759970.hstgr.cloud: HTTP/2 enabled
[✓] clemencefouquet.srv759970.hstgr.cloud: HTTP→HTTPS redirect configured
...

========================================
  Validation Summary
========================================

Total checks:    650
Passed:          643
Failed:          3
Warnings:        4

Critical Issues Found:
  ✗ newsite: Missing 'listen [::]:443 ssl' (IPv6 HTTPS)
  ✗ testapp: Missing 'proxy_set_header X-Forwarded-Proto'
  ✗ oldsite: Missing 'ssl_certificate' directive

Warnings:
  ! site1: HTTP/2 not enabled
  ! site2: No HTTP→HTTPS redirect found
  ...

Validation FAILED - Please fix critical issues
```

**Exit Codes:**
- `0`: All critical checks passed
- `1`: One or more critical failures

## Changelog

### v1.1.0 (2025-12-09)
- Added validate-nginx-config.sh script (286 LOC)
- 11 validation checks documented
- Critical vs warning severity levels
- Single site validation support
- Colored console output
- Exit codes for CI/CD integration

### v1.0.0 (2025-12-09)
- Initial release
- IPv6 listener detection and auto-fix
- SSL certificate expiration checks
- Security headers audit
- Configuration best practices checks
- Automatic backup and rollback
- JSON report format
- Dry run mode
- Single site and bulk operations
