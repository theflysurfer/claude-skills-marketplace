#!/bin/bash

# ========================================
# WordPress Security Audit Script
# ========================================
# Audit de sécurité WordPress sur VPS + Nginx
# Usage: ./security-audit.sh [wordpress_path] [domain]

set -e

# Configuration
SSH_USER="${SSH_USER:-automation}"
SSH_HOST="${SSH_HOST:-69.62.108.82}"
WP_PATH="${1:-/var/www/wordpress}"
DOMAIN="${2:-example.srv759970.hstgr.cloud}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

info() {
    echo -e "${BLUE}[i]${NC} $1"
}

check() {
    local test=$1
    local message=$2

    if [ $test -eq 0 ]; then
        log "$message"
        return 0
    else
        error "$message"
        return 1
    fi
}

echo "========================================"
echo "  WordPress Security Audit"
echo "========================================"
echo ""
echo "WordPress: $WP_PATH"
echo "Domain: $DOMAIN"
echo ""

# Compteurs
TOTAL=0
PASSED=0
FAILED=0
WARNINGS=0

# ========================================
# 1. Nginx Configuration
# ========================================
info "Checking Nginx configuration..."
echo ""

# SSL/TLS
((TOTAL++))
if ssh ${SSH_USER}@${SSH_HOST} "sudo grep -q 'TLSv1.2\|TLSv1.3' /etc/nginx/sites-available/${DOMAIN%.*} 2>/dev/null"; then
    log "SSL/TLS protocols secure (TLS 1.2+)"
    ((PASSED++))
else
    error "SSL/TLS protocols not secure or not configured"
    ((FAILED++))
fi

# HSTS Header
((TOTAL++))
if ssh ${SSH_USER}@${SSH_HOST} "sudo grep -q 'Strict-Transport-Security' /etc/nginx/sites-available/${DOMAIN%.*} 2>/dev/null"; then
    log "HSTS header configured"
    ((PASSED++))
else
    error "HSTS header missing"
    ((FAILED++))
fi

# X-Frame-Options
((TOTAL++))
if ssh ${SSH_USER}@${SSH_HOST} "sudo grep -q 'X-Frame-Options' /etc/nginx/sites-available/${DOMAIN%.*} 2>/dev/null"; then
    log "X-Frame-Options header configured"
    ((PASSED++))
else
    error "X-Frame-Options header missing"
    ((FAILED++))
fi

# XML-RPC blocked
((TOTAL++))
if ssh ${SSH_USER}@${SSH_HOST} "sudo grep -q 'xmlrpc.php.*deny' /etc/nginx/sites-available/${DOMAIN%.*} 2>/dev/null"; then
    log "XML-RPC blocked or protected"
    ((PASSED++))
else
    warn "XML-RPC not blocked (vulnerable to DDoS)"
    ((WARNINGS++))
fi

# wp-login rate limiting
((TOTAL++))
if ssh ${SSH_USER}@${SSH_HOST} "sudo grep -q 'wp-login.*limit_req' /etc/nginx/sites-available/${DOMAIN%.*} 2>/dev/null"; then
    log "wp-login.php rate limiting configured"
    ((PASSED++))
else
    warn "wp-login.php not rate limited (vulnerable to brute force)"
    ((WARNINGS++))
fi

echo ""

# ========================================
# 2. File Permissions
# ========================================
info "Checking file permissions..."
echo ""

# wp-config.php permissions
((TOTAL++))
PERM=$(ssh ${SSH_USER}@${SSH_HOST} "sudo stat -c '%a' $WP_PATH/wp-config.php 2>/dev/null" || echo "000")
if [ "$PERM" == "600" ] || [ "$PERM" == "640" ] || [ "$PERM" == "660" ]; then
    log "wp-config.php permissions secure ($PERM)"
    ((PASSED++))
else
    error "wp-config.php permissions insecure ($PERM, should be 600/640/660)"
    ((FAILED++))
fi

# Directory permissions
((TOTAL++))
WRITABLE=$(ssh ${SSH_USER}@${SSH_HOST} "sudo find $WP_PATH -type d -perm 777 2>/dev/null | wc -l")
if [ "$WRITABLE" -eq 0 ]; then
    log "No world-writable directories (777)"
    ((PASSED++))
else
    error "$WRITABLE world-writable directories found (777)"
    ((FAILED++))
fi

# .git directory exposed
((TOTAL++))
if ssh ${SSH_USER}@${SSH_HOST} "sudo test -d $WP_PATH/.git 2>/dev/null"; then
    error ".git directory exists and may be exposed"
    ((FAILED++))
else
    log "No .git directory in webroot"
    ((PASSED++))
fi

echo ""

# ========================================
# 3. WordPress Configuration
# ========================================
info "Checking WordPress configuration..."
echo ""

# Debug mode
((TOTAL++))
if ssh ${SSH_USER}@${SSH_HOST} "sudo grep -q \"define.*'WP_DEBUG'.*false\" $WP_PATH/wp-config.php 2>/dev/null"; then
    log "Debug mode disabled"
    ((PASSED++))
else
    warn "Debug mode may be enabled (check wp-config.php)"
    ((WARNINGS++))
fi

# File editing disabled
((TOTAL++))
if ssh ${SSH_USER}@${SSH_HOST} "sudo grep -q \"define.*'DISALLOW_FILE_EDIT'.*true\" $WP_PATH/wp-config.php 2>/dev/null"; then
    log "File editing disabled (DISALLOW_FILE_EDIT)"
    ((PASSED++))
else
    error "File editing not disabled (admins can edit theme/plugin files)"
    ((FAILED++))
fi

# Force SSL Admin
((TOTAL++))
if ssh ${SSH_USER}@${SSH_HOST} "sudo grep -q \"define.*'FORCE_SSL_ADMIN'.*true\" $WP_PATH/wp-config.php 2>/dev/null"; then
    log "Force SSL for admin enabled"
    ((PASSED++))
else
    warn "Force SSL for admin not enabled"
    ((WARNINGS++))
fi

# Table prefix
((TOTAL++))
PREFIX=$(ssh ${SSH_USER}@${SSH_HOST} "sudo grep '^\\$table_prefix' $WP_PATH/wp-config.php 2>/dev/null | cut -d\"'\" -f2")
if [ "$PREFIX" != "wp_" ]; then
    log "Custom table prefix used ($PREFIX)"
    ((PASSED++))
else
    warn "Default table prefix 'wp_' used (easier for SQL injection)"
    ((WARNINGS++))
fi

echo ""

# ========================================
# 4. Users & Access
# ========================================
info "Checking users..."
echo ""

# Admin user exists
((TOTAL++))
ADMIN_EXISTS=$(ssh ${SSH_USER}@${SSH_HOST} "sudo -u www-data wp user list --path=$WP_PATH --role=administrator --field=user_login 2>/dev/null | grep -i '^admin$' || echo ''")
if [ -z "$ADMIN_EXISTS" ]; then
    log "No 'admin' username (good practice)"
    ((PASSED++))
else
    error "'admin' username exists (common brute force target)"
    ((FAILED++))
fi

echo ""

# ========================================
# 5. Plugins & Themes
# ========================================
info "Checking plugins and themes..."
echo ""

# Outdated plugins
((TOTAL++))
OUTDATED_PLUGINS=$(ssh ${SSH_USER}@${SSH_HOST} "sudo -u www-data wp plugin list --path=$WP_PATH --update=available --format=count 2>/dev/null" || echo "0")
if [ "$OUTDATED_PLUGINS" -eq 0 ]; then
    log "All plugins up to date"
    ((PASSED++))
else
    warn "$OUTDATED_PLUGINS plugins need updates"
    ((WARNINGS++))
fi

# Inactive plugins
((TOTAL++))
INACTIVE_PLUGINS=$(ssh ${SSH_USER}@${SSH_HOST} "sudo -u www-data wp plugin list --path=$WP_PATH --status=inactive --format=count 2>/dev/null" || echo "0")
if [ "$INACTIVE_PLUGINS" -eq 0 ]; then
    log "No inactive plugins"
    ((PASSED++))
else
    warn "$INACTIVE_PLUGINS inactive plugins (should be deleted)"
    ((WARNINGS++))
fi

# Outdated themes
((TOTAL++))
OUTDATED_THEMES=$(ssh ${SSH_USER}@${SSH_HOST} "sudo -u www-data wp theme list --path=$WP_PATH --update=available --format=count 2>/dev/null" || echo "0")
if [ "$OUTDATED_THEMES" -eq 0 ]; then
    log "All themes up to date"
    ((PASSED++))
else
    warn "$OUTDATED_THEMES themes need updates"
    ((WARNINGS++))
fi

echo ""

# ========================================
# 6. Database
# ========================================
info "Checking database security..."
echo ""

# Remote root access
((TOTAL++))
REMOTE_ROOT=$(ssh ${SSH_USER}@${SSH_HOST} "sudo mysql -e \"SELECT User, Host FROM mysql.user WHERE User='root' AND Host!='localhost'\" 2>/dev/null | wc -l")
if [ "$REMOTE_ROOT" -eq 0 ]; then
    log "MySQL root cannot connect remotely"
    ((PASSED++))
else
    error "MySQL root can connect remotely (insecure)"
    ((FAILED++))
fi

echo ""

# ========================================
# 7. Fail2ban
# ========================================
info "Checking fail2ban..."
echo ""

# Fail2ban installed
((TOTAL++))
if ssh ${SSH_USER}@${SSH_HOST} "command -v fail2ban-client >/dev/null 2>&1"; then
    log "Fail2ban installed"
    ((PASSED++))

    # WordPress jail active
    ((TOTAL++))
    if ssh ${SSH_USER}@${SSH_HOST} "sudo fail2ban-client status 2>/dev/null | grep -q wordpress"; then
        log "WordPress fail2ban jail active"
        ((PASSED++))
    else
        warn "WordPress fail2ban jail not configured"
        ((WARNINGS++))
    fi
else
    error "Fail2ban not installed"
    ((FAILED++))
fi

echo ""

# ========================================
# Summary
# ========================================
echo "========================================"
echo "  Security Audit Summary"
echo "========================================"
echo ""
echo "Total checks: $TOTAL"
log "Passed: $PASSED"
warn "Warnings: $WARNINGS"
error "Failed: $FAILED"
echo ""

# Score
SCORE=$((PASSED * 100 / TOTAL))

if [ $SCORE -ge 90 ]; then
    log "Security Score: $SCORE% - Excellent!"
elif [ $SCORE -ge 70 ]; then
    warn "Security Score: $SCORE% - Good, but can be improved"
elif [ $SCORE -ge 50 ]; then
    warn "Security Score: $SCORE% - Needs attention"
else
    error "Security Score: $SCORE% - Critical issues found!"
fi

echo ""
echo "========================================"

# Exit code
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
