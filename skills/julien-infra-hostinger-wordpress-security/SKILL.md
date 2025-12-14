---
name: julien-infra-hostinger-wordpress-security
description: Audit sécurité WordPress (25+ checks, scoring 0-100%). Use for WordPress security audits, after WordPress deployment, or when security hardening needed. Checks Nginx, files, WP config, users, plugins, database, and Fail2ban.
license: Apache-2.0
triggers:
  - wordpress security
  - audit wordpress
  - wp security
  - wordpress hardening
  - securiser wordpress
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
metadata:
  author: "Julien"
  version: "1.0.0"
  category: "security"
  keywords: ["wordpress", "security", "audit", "hardening", "nginx", "fail2ban"]
---

# WordPress Security Audit - Hostinger VPS

Comprehensive WordPress security auditing for srv759970.hstgr.cloud with 25+ automated checks and scoring system.

## When to Use This Skill

Invoke automatically when:
- User requests WordPress security audit
- After deploying a new WordPress site
- When security hardening is needed
- Before going to production with WordPress
- When investigating potential security breach
- Periodic security health checks (monthly)

**Trigger phrases**:
- "Audit WordPress security"
- "Check WordPress security for [site]"
- "Is my WordPress site secure?"
- "Security score for [site]"
- "Harden WordPress [site]"

## Server Context

- **Host**: 69.62.108.82
- **User**: automation (SSH key authentication)
- **WordPress locations**:
  - Docker: `/opt/wordpress-[site]/` or `/opt/[site]-wp/`
  - PHP-FPM: `/var/www/[site]/`
- **Nginx configs**: `/etc/nginx/sites-available/[site]`

## Security Audit Overview

### 7 Audit Categories

| Category | Checks | Weight |
|----------|--------|--------|
| 1. Nginx Security | 8 | 25% |
| 2. File Permissions | 6 | 15% |
| 3. WordPress Config | 5 | 20% |
| 4. Users & Auth | 4 | 15% |
| 5. Plugins & Themes | 3 | 10% |
| 6. Database | 2 | 10% |
| 7. Fail2ban | 2 | 5% |

**Total**: 30 checks

### Scoring System

| Score | Level | Action |
|-------|-------|--------|
| 90-100% | ✅ EXCELLENT | Maintain current security |
| 75-89% | 🟢 GOOD | Minor improvements recommended |
| 50-74% | 🟡 WARNING | Security hardening needed |
| < 50% | 🔴 CRITICAL | Immediate action required |

## Quick Audit Commands

### Run Full Security Audit

```bash
# Using the security-audit.sh script
ssh srv759970 'bash -s' < scripts/security-audit.sh [site-name]

# Example for clemencefouquet.fr
ssh srv759970 'bash -s' < scripts/security-audit.sh clemencefouquet
```

### Manual Quick Checks

```bash
# 1. Check Nginx security headers
ssh srv759970 'curl -sI https://site.srv759970.hstgr.cloud | grep -iE "x-frame|x-content|strict-transport|x-xss"'

# 2. Check SSL configuration
ssh srv759970 'curl -sI https://site.srv759970.hstgr.cloud | grep -iE "server:|x-powered"'

# 3. Check wp-config.php permissions
ssh srv759970 'ls -la /opt/wordpress-site/wp-config.php 2>/dev/null || ls -la /var/www/site/wp-config.php'

# 4. Check if debug is disabled
ssh srv759970 'grep -i "WP_DEBUG" /opt/wordpress-site/wp-config.php'

# 5. Check Fail2ban WordPress jails
ssh srv759970 'sudo fail2ban-client status | grep wordpress'
```

## Detailed Audit Checks

### Category 1: Nginx Security (8 checks)

| # | Check | Pass Criteria | Command |
|---|-------|---------------|---------|
| 1.1 | X-Frame-Options | Present: DENY or SAMEORIGIN | `curl -sI URL \| grep X-Frame` |
| 1.2 | X-Content-Type-Options | Present: nosniff | `curl -sI URL \| grep X-Content-Type` |
| 1.3 | X-XSS-Protection | Present: 1; mode=block | `curl -sI URL \| grep X-XSS` |
| 1.4 | Strict-Transport-Security | Present with max-age | `curl -sI URL \| grep Strict-Transport` |
| 1.5 | Content-Security-Policy | Present (any policy) | `curl -sI URL \| grep Content-Security` |
| 1.6 | Server header hidden | No "Server: nginx/x.x" | `curl -sI URL \| grep Server` |
| 1.7 | SSL/TLS version | TLS 1.2+ only | Check nginx ssl_protocols |
| 1.8 | Rate limiting | Zones configured | Check nginx config |

### Category 2: File Permissions (6 checks)

| # | Check | Pass Criteria | Command |
|---|-------|---------------|---------|
| 2.1 | wp-config.php | 640 or 600 | `stat -c %a wp-config.php` |
| 2.2 | .htaccess | 644 or 640 | `stat -c %a .htaccess` |
| 2.3 | wp-content/uploads | 755 | `stat -c %a wp-content/uploads` |
| 2.4 | wp-admin | 755 | `stat -c %a wp-admin` |
| 2.5 | wp-includes | 755 | `stat -c %a wp-includes` |
| 2.6 | index.php in uploads | Present (prevents listing) | `test -f wp-content/uploads/index.php` |

### Category 3: WordPress Config (5 checks)

| # | Check | Pass Criteria | Command |
|---|-------|---------------|---------|
| 3.1 | WP_DEBUG | false | `grep WP_DEBUG wp-config.php` |
| 3.2 | DISALLOW_FILE_EDIT | true | `grep DISALLOW_FILE_EDIT wp-config.php` |
| 3.3 | Unique salts | Not default | Check AUTH_KEY, SECURE_AUTH_KEY |
| 3.4 | Table prefix | Not 'wp_' | `grep table_prefix wp-config.php` |
| 3.5 | FORCE_SSL_ADMIN | true | `grep FORCE_SSL_ADMIN wp-config.php` |

### Category 4: Users & Auth (4 checks)

| # | Check | Pass Criteria | Command |
|---|-------|---------------|---------|
| 4.1 | No 'admin' user | User doesn't exist | `wp user list --field=user_login` |
| 4.2 | No user ID 1 as admin | Different ID | `wp user list --fields=ID,user_login` |
| 4.3 | Strong passwords | Plugin or policy | Check security plugins |
| 4.4 | 2FA available | Plugin installed | Check for 2FA plugins |

### Category 5: Plugins & Themes (3 checks)

| # | Check | Pass Criteria | Command |
|---|-------|---------------|---------|
| 5.1 | Security plugin | Installed & active | `wp plugin list --status=active` |
| 5.2 | No vulnerable plugins | All up to date | `wp plugin list --update=available` |
| 5.3 | Unused themes removed | Only 1-2 themes | `wp theme list` |

### Category 6: Database (2 checks)

| # | Check | Pass Criteria | Command |
|---|-------|---------------|---------|
| 6.1 | Non-default prefix | Not 'wp_' | Check wp-config.php |
| 6.2 | Remote access disabled | localhost only | Check MySQL/MariaDB config |

### Category 7: Fail2ban (2 checks)

| # | Check | Pass Criteria | Command |
|---|-------|---------------|---------|
| 7.1 | WordPress jails active | At least 1 jail | `fail2ban-client status` |
| 7.2 | Recent bans < threshold | < 50 bans/week | Check ban logs |

## Script Usage

### security-audit.sh

Located at `scripts/security-audit.sh` (355 LOC)

```bash
# Run audit for specific site
ssh srv759970 << 'EOF'
cd /tmp
cat > security-audit.sh << 'SCRIPT'
# ... script content uploaded ...
SCRIPT
bash security-audit.sh clemencefouquet
rm security-audit.sh
EOF

# Or if script is already on server
ssh srv759970 '/opt/scripts/security-audit.sh clemencefouquet'
```

**Output format**:
```
========================================
WordPress Security Audit - clemencefouquet.fr
========================================

[NGINX] Checking security headers...
✅ X-Frame-Options: SAMEORIGIN
✅ X-Content-Type-Options: nosniff
❌ Content-Security-Policy: MISSING
...

[FILES] Checking permissions...
✅ wp-config.php: 640
❌ .htaccess: 666 (should be 644)
...

========================================
SECURITY SCORE: 72/100 (WARNING)
========================================

Recommendations:
1. Add Content-Security-Policy header to Nginx config
2. Fix .htaccess permissions: chmod 644 .htaccess
3. Install Fail2ban WordPress jails
```

## Remediation Actions

### If Score < 75% (Warning Level)

**Immediate actions**:

1. **Fix security headers** (use hostinger-nginx skill):
   ```nginx
   # Add to site config
   include /etc/nginx/snippets/security-headers.conf;
   ```

2. **Fix file permissions**:
   ```bash
   ssh srv759970 << 'EOF'
   chmod 640 /opt/wordpress-site/wp-config.php
   chmod 644 /opt/wordpress-site/.htaccess
   chown www-data:www-data /opt/wordpress-site/wp-config.php
   EOF
   ```

3. **Disable debug mode**:
   ```bash
   ssh srv759970 "sed -i \"s/define('WP_DEBUG', true)/define('WP_DEBUG', false)/\" /opt/wordpress-site/wp-config.php"
   ```

4. **Install Fail2ban jails** (use hostinger-fail2ban skill):
   ```bash
   # See julien-infra-hostinger-fail2ban skill
   ```

### If Score < 50% (Critical Level)

**Emergency actions**:

1. Consider taking site offline temporarily
2. Run malware scan
3. Check for unauthorized users
4. Review recent file changes
5. Check database for injected content
6. Reset all passwords

## Reference Documentation

See `references/WORDPRESS_SECURITY.md` for:
- Complete hardening guide
- Nginx security configuration
- WordPress wp-config.php best practices
- Database security
- Fail2ban integration details
- Security checklist (printable)

## 🔗 Skill Chaining

### Skills Required Before

| Skill | Required | Purpose |
|-------|----------|---------|
| **hostinger-ssh** | ✅ Obligatoire | SSH access to server |
| **hostinger-nginx** | ✅ Obligatoire | WordPress site must have Nginx configured |
| **hostinger-docker** | ⚪ Optionnel | If WordPress runs in Docker |

### Input Expected

- **SSH access**: automation@69.62.108.82
- **WordPress site accessible**: https://site.srv759970.hstgr.cloud
- **Nginx config exists**: /etc/nginx/sites-available/[site]
- **WordPress directory**: /opt/wordpress-[site]/ or Docker container

### Output Produced

- **Format**: Security audit report (console output)
- **Side effects**:
  - Security recommendations generated
  - Score calculated (0-100%)
  - Critical issues flagged
  - Remediation steps provided
- **Duration**: 30-60 seconds

### Compatible Skills After

**Recommandés:**
- **hostinger-fail2ban**: Install jails if audit shows missing Fail2ban protection
- **nginx-audit**: Verify Nginx security after WordPress hardening
- **hostinger-nginx**: Apply security headers or SSL fixes

**Optionnels:**
- **hostinger-maintenance**: Schedule regular security audits
- **deployment-verifier**: Take screenshot after remediation

### Called By

| Caller | Context |
|--------|---------|
| **hostinger-deployment** | After WordPress deployment |
| **hostinger-nginx** | After configuring WordPress reverse proxy |
| **Manual** | "Audit WordPress security for clemencefouquet.fr" |
| **Scheduled** | Weekly/monthly security checks |

### Tools Used

- `Bash` (SSH commands, script execution)
- `Read` (read configuration files)
- `Grep` (search for patterns in configs)

### Visual Workflow

```
[WordPress deployed OR security check requested]
    ↓
┌─────────────────────────────────────────────────┐
│        julien-infra-wordpress-security          │
├─────────────────────────────────────────────────┤
│  Step 1: Nginx Security (8 checks)              │
│    ├─► SSL hardening (TLS 1.2+)                 │
│    ├─► Security headers (X-Frame, HSTS...)      │
│    ├─► Rate limiting configured                 │
│    └─► Bot protection active                    │
│                                                 │
│  Step 2: File Security (6 checks)               │
│    ├─► wp-config.php permissions                │
│    ├─► Directory listing disabled               │
│    └─► Upload folder secured                    │
│                                                 │
│  Step 3: WordPress Config (5 checks)            │
│    ├─► Debug mode disabled                      │
│    ├─► File editing disabled                    │
│    └─► Salt keys defined                        │
│                                                 │
│  Step 4: Users & Auth (4 checks)                │
│    ├─► No admin user                            │
│    └─► Strong passwords                         │
│                                                 │
│  Step 5: Plugins (3 checks)                     │
│    ├─► Security plugin installed                │
│    └─► No vulnerable plugins                    │
│                                                 │
│  Step 6: Database (2 checks)                    │
│    └─► Prefix not default                       │
│                                                 │
│  Step 7: Fail2ban (2 checks)                    │
│    └─► WordPress jails active                   │
└─────────────────────────────────────────────────┘
    ↓
Security Score: XX/100 (CRITICAL/WARNING/GOOD/EXCELLENT)
    ↓
┌─────────────────────────────────────────────────┐
│  [If score < 75%]                               │
│    → hostinger-fail2ban (install missing jails) │
│    → hostinger-nginx (fix headers/SSL)          │
│                                                 │
│  [If nginx issues found]                        │
│    → nginx-audit (comprehensive audit)          │
└─────────────────────────────────────────────────┘
```

### Usage Example

**Scenario**: User deploys new WordPress site and wants security audit

**Command**: "Audit security for the new WordPress site clemencefouquet.fr"

**Expected Flow**:
1. Skill activates, connects via SSH
2. Runs 30 security checks across 7 categories
3. Calculates score: 65% (WARNING)
4. Identifies issues:
   - Missing Content-Security-Policy header
   - Fail2ban jails not installed
   - WP_DEBUG is true
5. Provides remediation steps
6. Recommends: "Use hostinger-fail2ban to install WordPress jails"
7. After remediation, re-audit shows: 91% (EXCELLENT)

## Common Issues & Solutions

### Issue: "Cannot find WordPress installation"

**Cause**: Wrong path or Docker container name

**Solution**:
```bash
# Find WordPress installations
ssh srv759970 'find /opt -maxdepth 2 -name "wp-config.php" 2>/dev/null'
ssh srv759970 'docker ps | grep -i wordpress'
```

### Issue: "Permission denied reading wp-config.php"

**Cause**: File owned by different user

**Solution**:
```bash
ssh srv759970 'sudo cat /opt/wordpress-site/wp-config.php | grep -i debug'
```

### Issue: "Fail2ban not installed"

**Solution**: Use `hostinger-fail2ban` skill to install WordPress jails

## Important Notes

- Always run audit **before** going to production
- Re-audit **after** applying fixes to verify score improved
- Schedule **monthly** audits for production sites
- Document any **exceptions** (e.g., intentionally relaxed settings)
- Keep `references/WORDPRESS_SECURITY.md` updated with new threats

## Changelog

### v1.0.0 (2025-12-09)
- Initial release
- 25+ security checks across 7 categories
- Scoring system (0-100%)
- Skill chaining with fail2ban and nginx skills
- security-audit.sh script (355 LOC)
- WORDPRESS_SECURITY.md reference guide
