#!/bin/bash

# ========================================
# Nginx Configuration Validator
# ========================================
# Validates all Nginx site configurations for common issues
# Usage: ./validate-nginx-config.sh [site_name]
#        If site_name is provided, validates only that site
#        Otherwise, validates all enabled sites

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSH_USER="${SSH_USER:-automation}"
SSH_HOST="${SSH_HOST:-69.62.108.82}"
SITES_ENABLED="/etc/nginx/sites-enabled"
SITES_AVAILABLE="/etc/nginx/sites-available"

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Issues found
declare -a ISSUES
declare -a WARNINGS

echo "========================================"
echo "  Nginx Configuration Validator"
echo "========================================"
echo ""

# Function to log results
log_pass() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_fail() {
    echo -e "${RED}[✗]${NC} $1"
    ISSUES+=("$1")
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
    WARNINGS+=("$1")
    ((WARNING_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Function to validate a single site configuration
validate_site() {
    local site_name="$1"
    local config_content="$2"

    log_info "Validating: $site_name"
    echo ""

    # Check 1: IPv4 listen directive
    if echo "$config_content" | grep -q "listen 443 ssl"; then
        log_pass "$site_name: Has IPv4 HTTPS listen directive"
    else
        log_fail "$site_name: Missing 'listen 443 ssl' (IPv4 HTTPS)"
    fi

    # Check 2: IPv6 listen directive for HTTPS
    if echo "$config_content" | grep -q "listen \[::]:443 ssl"; then
        log_pass "$site_name: Has IPv6 HTTPS listen directive"
    else
        if echo "$config_content" | grep -q "listen 443 ssl"; then
            log_fail "$site_name: Missing 'listen [::]:443 ssl' (IPv6 HTTPS) - SNI may fail!"
        fi
    fi

    # Check 3: IPv4 HTTP redirect
    if echo "$config_content" | grep -q "listen 80"; then
        log_pass "$site_name: Has IPv4 HTTP listen directive"
    else
        log_warn "$site_name: Missing 'listen 80' (IPv4 HTTP redirect)"
    fi

    # Check 4: IPv6 HTTP redirect
    if echo "$config_content" | grep -q "listen \[::]:80"; then
        log_pass "$site_name: Has IPv6 HTTP listen directive"
    else
        if echo "$config_content" | grep -q "listen 80"; then
            log_warn "$site_name: Missing 'listen [::]:80' (IPv6 HTTP redirect)"
        fi
    fi

    # Check 5: server_name defined
    if echo "$config_content" | grep -q "server_name"; then
        server_names=$(echo "$config_content" | grep "server_name" | head -1 | sed 's/.*server_name //; s/;//')
        log_pass "$site_name: Has server_name defined: $server_names"
    else
        log_fail "$site_name: Missing 'server_name' directive"
    fi

    # Check 6: SSL certificate paths
    if echo "$config_content" | grep -q "ssl_certificate "; then
        cert_path=$(echo "$config_content" | grep "ssl_certificate " | grep -v "ssl_certificate_key" | head -1 | awk '{print $2}' | tr -d ';')
        log_pass "$site_name: SSL certificate configured: $cert_path"
    else
        if echo "$config_content" | grep -q "listen 443 ssl"; then
            log_fail "$site_name: Missing 'ssl_certificate' directive"
        fi
    fi

    # Check 7: SSL certificate key
    if echo "$config_content" | grep -q "ssl_certificate_key"; then
        key_path=$(echo "$config_content" | grep "ssl_certificate_key" | head -1 | awk '{print $2}' | tr -d ';')
        log_pass "$site_name: SSL key configured: $key_path"
    else
        if echo "$config_content" | grep -q "listen 443 ssl"; then
            log_fail "$site_name: Missing 'ssl_certificate_key' directive"
        fi
    fi

    # Check 8: HTTP/2 enabled
    if echo "$config_content" | grep -q "listen 443 ssl http2"; then
        log_pass "$site_name: HTTP/2 enabled"
    else
        if echo "$config_content" | grep -q "listen 443 ssl"; then
            log_warn "$site_name: HTTP/2 not enabled (add 'http2' to listen directive)"
        fi
    fi

    # Check 9: HTTP to HTTPS redirect
    if echo "$config_content" | grep -q "return 301 https://"; then
        log_pass "$site_name: HTTP→HTTPS redirect configured"
    else
        if echo "$config_content" | grep -q "listen 80"; then
            log_warn "$site_name: No HTTP→HTTPS redirect found"
        fi
    fi

    # Check 10: Proxy headers for WordPress/apps
    if echo "$config_content" | grep -q "proxy_pass"; then
        log_info "$site_name: Using reverse proxy"

        if echo "$config_content" | grep -q "proxy_set_header Host"; then
            log_pass "$site_name: Proxy Host header set"
        else
            log_fail "$site_name: Missing 'proxy_set_header Host' - May cause issues!"
        fi

        if echo "$config_content" | grep -q "proxy_set_header X-Real-IP"; then
            log_pass "$site_name: Proxy X-Real-IP header set"
        else
            log_warn "$site_name: Missing 'proxy_set_header X-Real-IP' - Logs won't show real IPs"
        fi

        if echo "$config_content" | grep -q "proxy_set_header X-Forwarded-For"; then
            log_pass "$site_name: Proxy X-Forwarded-For header set"
        else
            log_warn "$site_name: Missing 'proxy_set_header X-Forwarded-For'"
        fi

        if echo "$config_content" | grep -q "proxy_set_header X-Forwarded-Proto"; then
            log_pass "$site_name: Proxy X-Forwarded-Proto header set"
        else
            log_fail "$site_name: Missing 'proxy_set_header X-Forwarded-Proto' - HTTPS detection may fail!"
        fi
    fi

    # Check 11: Security headers (if not WordPress with snippet)
    if ! echo "$config_content" | grep -q "include snippets/"; then
        if echo "$config_content" | grep -q "add_header X-Frame-Options"; then
            log_pass "$site_name: Has security headers"
        else
            log_warn "$site_name: No security headers found (consider adding)"
        fi
    fi

    echo ""
}

# Get list of sites to validate
if [ $# -eq 1 ]; then
    # Validate single site
    SITE_NAME="$1"
    log_info "Validating single site: $SITE_NAME"
    echo ""

    CONFIG_CONTENT=$(ssh ${SSH_USER}@${SSH_HOST} "cat ${SITES_AVAILABLE}/${SITE_NAME}" 2>/dev/null || echo "")

    if [ -z "$CONFIG_CONTENT" ]; then
        echo -e "${RED}Error:${NC} Site '$SITE_NAME' not found in ${SITES_AVAILABLE}"
        exit 1
    fi

    validate_site "$SITE_NAME" "$CONFIG_CONTENT"
else
    # Validate all enabled sites
    log_info "Validating all enabled sites..."
    echo ""

    # Get list of enabled sites
    ENABLED_SITES=$(ssh ${SSH_USER}@${SSH_HOST} "ls ${SITES_ENABLED}" 2>/dev/null || echo "")

    if [ -z "$ENABLED_SITES" ]; then
        echo -e "${RED}Error:${NC} No enabled sites found or cannot connect to server"
        exit 1
    fi

    # Count sites
    SITE_COUNT=$(echo "$ENABLED_SITES" | wc -l)
    log_info "Found $SITE_COUNT enabled site(s)"
    echo ""

    # Validate each site
    for site in $ENABLED_SITES; do
        # Skip backup files and non-config files
        if [[ "$site" == *.backup* ]] || [[ "$site" == *~ ]]; then
            log_info "Skipping backup file: $site"
            continue
        fi

        # Get site config content
        CONFIG_CONTENT=$(ssh ${SSH_USER}@${SSH_HOST} "cat ${SITES_ENABLED}/${site}" 2>/dev/null || echo "")

        if [ -z "$CONFIG_CONTENT" ]; then
            log_warn "Cannot read config for: $site"
            continue
        fi

        validate_site "$site" "$CONFIG_CONTENT"
    done
fi

# Summary
echo "========================================"
echo "  Validation Summary"
echo "========================================"
echo ""
echo -e "Total checks:    ${BLUE}${TOTAL_CHECKS}${NC}"
echo -e "Passed:          ${GREEN}${PASSED_CHECKS}${NC}"
echo -e "Failed:          ${RED}${FAILED_CHECKS}${NC}"
echo -e "Warnings:        ${YELLOW}${WARNING_CHECKS}${NC}"
echo ""

# Show critical issues
if [ ${FAILED_CHECKS} -gt 0 ]; then
    echo -e "${RED}Critical Issues Found:${NC}"
    for issue in "${ISSUES[@]}"; do
        echo -e "  ${RED}✗${NC} $issue"
    done
    echo ""
fi

# Show warnings
if [ ${WARNING_CHECKS} -gt 0 ]; then
    echo -e "${YELLOW}Warnings:${NC}"
    for warning in "${WARNINGS[@]}"; do
        echo -e "  ${YELLOW}!${NC} $warning"
    done
    echo ""
fi

# Exit code
if [ ${FAILED_CHECKS} -gt 0 ]; then
    echo -e "${RED}Validation FAILED${NC} - Please fix critical issues"
    exit 1
else
    echo -e "${GREEN}Validation PASSED${NC} - All critical checks OK"
    if [ ${WARNING_CHECKS} -gt 0 ]; then
        echo -e "${YELLOW}Note:${NC} There are ${WARNING_CHECKS} warning(s) to review"
    fi
    exit 0
fi
