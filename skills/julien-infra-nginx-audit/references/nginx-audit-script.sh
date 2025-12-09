#!/bin/bash
#
# Nginx Configuration Audit & Auto-Fix Script
# Server: srv759970.hstgr.cloud (automation@69.62.108.82)
# Version: 1.0.0
# Date: 2025-12-09
#
# Usage:
#   ./nginx-audit.sh                       # Full audit report
#   ./nginx-audit.sh --auto-fix            # Apply all fixes
#   ./nginx-audit.sh --site SITENAME       # Audit single site
#   ./nginx-audit.sh --site SITENAME --fix # Fix single site
#   ./nginx-audit.sh --dry-run             # Show what would change
#   ./nginx-audit.sh --json                # JSON output
#

set -euo pipefail

# Configuration
SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"
BACKUP_DIR="/opt/backups/nginx-$(date +%Y%m%d-%H%M%S)"
REPORT_DIR="/opt/reports"
LOG_FILE="/var/log/nginx-audit.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_SITES=0
CRITICAL_ISSUES=0
WARNINGS=0
PASSED_CHECKS=0
FIXED_ISSUES=0

# Flags
AUTO_FIX=false
DRY_RUN=false
JSON_OUTPUT=false
VERBOSE=false
SINGLE_SITE=""
CHECK_TYPE="all"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-fix)
            AUTO_FIX=true
            shift
            ;;
        --fix)
            AUTO_FIX=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --site)
            SINGLE_SITE="$2"
            shift 2
            ;;
        --check)
            CHECK_TYPE="$2"
            shift 2
            ;;
        --report-only)
            AUTO_FIX=false
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

# Print functions
print_header() {
    if [ "$JSON_OUTPUT" = false ]; then
        echo -e "\n${BLUE}============================================${NC}"
        echo -e "${BLUE}$1${NC}"
        echo -e "${BLUE}============================================${NC}\n"
    fi
}

print_critical() {
    if [ "$JSON_OUTPUT" = false ]; then
        echo -e "${RED}❌ $1${NC}"
    fi
    ((CRITICAL_ISSUES++))
}

print_warning() {
    if [ "$JSON_OUTPUT" = false ]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    fi
    ((WARNINGS++))
}

print_success() {
    if [ "$JSON_OUTPUT" = false ]; then
        echo -e "${GREEN}✅ $1${NC}"
    fi
    ((PASSED_CHECKS++))
}

print_info() {
    if [ "$JSON_OUTPUT" = false ]; then
        echo -e "${BLUE}ℹ️  $1${NC}"
    fi
}

# Backup function
create_backup() {
    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN: Would create backup at $BACKUP_DIR"
        return
    fi

    print_info "Creating backup at $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    cp -r "$SITES_AVAILABLE"/* "$BACKUP_DIR/" 2>/dev/null || true
    log "Backup created at $BACKUP_DIR"
}

# Rollback function
rollback() {
    print_critical "Configuration test failed! Rolling back..."
    cp -r "$BACKUP_DIR"/* "$SITES_AVAILABLE/"
    log "Rolled back from $BACKUP_DIR"
    print_info "Restored to previous configuration"
}

# Check IPv6 listeners
check_ipv6() {
    local site_file="$1"
    local site_name=$(basename "$site_file")
    local missing_ipv6_443=false
    local missing_ipv6_80=false

    # Check for HTTPS IPv6 listener
    if ! grep -q "listen \[::\]:443" "$site_file" 2>/dev/null; then
        missing_ipv6_443=true
    fi

    # Check for HTTP IPv6 listener
    if ! grep -q "listen \[::\]:80" "$site_file" 2>/dev/null; then
        missing_ipv6_80=true
    fi

    if [ "$missing_ipv6_443" = true ] || [ "$missing_ipv6_80" = true ]; then
        if [ "$missing_ipv6_443" = true ] && [ "$missing_ipv6_80" = true ]; then
            print_critical "Missing IPv6: $site_name (both [::]:443 and [::]:80)"
        elif [ "$missing_ipv6_443" = true ]; then
            print_critical "Missing IPv6: $site_name ([::]:443 only)"
        else
            print_critical "Missing IPv6: $site_name ([::]:80 only)"
        fi

        if [ "$AUTO_FIX" = true ]; then
            fix_ipv6 "$site_file" "$missing_ipv6_443" "$missing_ipv6_80"
        fi
        return 1
    else
        if [ "$VERBOSE" = true ]; then
            print_success "IPv6 OK: $site_name"
        fi
        return 0
    fi
}

# Fix IPv6 listeners
fix_ipv6() {
    local site_file="$1"
    local fix_443="$2"
    local fix_80="$3"
    local site_name=$(basename "$site_file")

    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN: Would add IPv6 listeners to $site_name"
        return
    fi

    print_info "Fixing IPv6 for $site_name..."

    # Add IPv6 for HTTPS (443)
    if [ "$fix_443" = true ]; then
        # Add [::]:443 after every 'listen 443 ssl'
        sed -i '/listen 443 ssl/a\    listen [::]:443 ssl http2;' "$site_file"
        print_success "Added [::]:443 listener"
        ((FIXED_ISSUES++))
    fi

    # Add IPv6 for HTTP (80)
    if [ "$fix_80" = true ]; then
        # Add [::]:80 after every 'listen 80'
        sed -i '/^\s*listen 80;/a\    listen [::]:80;' "$site_file"
        print_success "Added [::]:80 listener"
        ((FIXED_ISSUES++))
    fi

    log "Fixed IPv6 for $site_name"
}

# Check SSL certificate expiration
check_ssl_expiration() {
    local site_file="$1"
    local site_name=$(basename "$site_file")
    local domain=""

    # Extract server_name
    domain=$(grep "server_name" "$site_file" | head -1 | awk '{print $2}' | tr -d ';')

    if [ -z "$domain" ]; then
        return 0
    fi

    # Check if SSL is configured
    if ! grep -q "ssl_certificate" "$site_file"; then
        return 0
    fi

    # Check certificate expiration via certbot
    local cert_info=$(sudo certbot certificates 2>/dev/null | grep -A 5 "Certificate Name: $domain" || true)

    if [ -n "$cert_info" ]; then
        local expiry=$(echo "$cert_info" | grep "Expiry Date" | awk '{print $3}')
        local days_until_expiry=$(( ($(date -d "$expiry" +%s) - $(date +%s)) / 86400 ))

        if [ "$days_until_expiry" -lt 0 ]; then
            print_critical "SSL EXPIRED: $site_name (expired $((days_until_expiry * -1)) days ago)"
        elif [ "$days_until_expiry" -lt 7 ]; then
            print_critical "SSL EXPIRING SOON: $site_name (expires in $days_until_expiry days)"
        elif [ "$days_until_expiry" -lt 30 ]; then
            print_warning "SSL expires soon: $site_name (expires in $days_until_expiry days)"
        else
            if [ "$VERBOSE" = true ]; then
                print_success "SSL OK: $site_name (expires in $days_until_expiry days)"
            fi
        fi
    fi
}

# Check security headers
check_security_headers() {
    local site_file="$1"
    local site_name=$(basename "$site_file")
    local missing_headers=()

    # Check for common security headers
    if ! grep -q "X-Frame-Options" "$site_file"; then
        missing_headers+=("X-Frame-Options")
    fi

    if ! grep -q "X-Content-Type-Options" "$site_file"; then
        missing_headers+=("X-Content-Type-Options")
    fi

    if ! grep -q "X-XSS-Protection" "$site_file"; then
        missing_headers+=("X-XSS-Protection")
    fi

    if ! grep -q "Strict-Transport-Security" "$site_file"; then
        missing_headers+=("HSTS")
    fi

    if ! grep -q "Referrer-Policy" "$site_file"; then
        missing_headers+=("Referrer-Policy")
    fi

    if [ ${#missing_headers[@]} -gt 0 ]; then
        print_warning "Missing security headers in $site_name: ${missing_headers[*]}"

        if [ "$AUTO_FIX" = true ]; then
            fix_security_headers "$site_file" "${missing_headers[@]}"
        fi
        return 1
    else
        if [ "$VERBOSE" = true ]; then
            print_success "Security headers OK: $site_name"
        fi
        return 0
    fi
}

# Fix security headers
fix_security_headers() {
    local site_file="$1"
    shift
    local missing_headers=("$@")
    local site_name=$(basename "$site_file")

    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN: Would add security headers to $site_name"
        return
    fi

    print_info "Adding security headers to $site_name..."

    # Find the first server block with ssl_certificate and add headers after it
    for header in "${missing_headers[@]}"; do
        case "$header" in
            "X-Frame-Options")
                sed -i '/ssl_certificate.*fullchain/a\    add_header X-Frame-Options "SAMEORIGIN" always;' "$site_file"
                ;;
            "X-Content-Type-Options")
                sed -i '/ssl_certificate.*fullchain/a\    add_header X-Content-Type-Options "nosniff" always;' "$site_file"
                ;;
            "X-XSS-Protection")
                sed -i '/ssl_certificate.*fullchain/a\    add_header X-XSS-Protection "1; mode=block" always;' "$site_file"
                ;;
            "HSTS")
                sed -i '/ssl_certificate.*fullchain/a\    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;' "$site_file"
                ;;
            "Referrer-Policy")
                sed -i '/ssl_certificate.*fullchain/a\    add_header Referrer-Policy "strict-origin-when-cross-origin" always;' "$site_file"
                ;;
        esac
    done

    print_success "Added ${#missing_headers[@]} security headers"
    ((FIXED_ISSUES++))
    log "Added security headers to $site_name"
}

# Check server_tokens
check_server_tokens() {
    local site_file="$1"
    local site_name=$(basename "$site_file")

    if grep -q "server_tokens off" "$site_file"; then
        if [ "$VERBOSE" = true ]; then
            print_success "server_tokens off: $site_name"
        fi
        return 0
    else
        print_warning "server_tokens not disabled in $site_name"
        return 1
    fi
}

# Main audit function
audit_site() {
    local site_file="$1"
    local site_name=$(basename "$site_file")

    if [ "$VERBOSE" = true ]; then
        echo ""
        print_info "Auditing: $site_name"
    fi

    ((TOTAL_SITES++))

    # Run checks based on CHECK_TYPE
    case "$CHECK_TYPE" in
        "all")
            check_ipv6 "$site_file"
            check_ssl_expiration "$site_file"
            check_security_headers "$site_file"
            check_server_tokens "$site_file"
            ;;
        "ipv6")
            check_ipv6 "$site_file"
            ;;
        "ssl")
            check_ssl_expiration "$site_file"
            ;;
        "security")
            check_security_headers "$site_file"
            check_server_tokens "$site_file"
            ;;
        *)
            print_critical "Unknown check type: $CHECK_TYPE"
            exit 1
            ;;
    esac
}

# Test Nginx configuration
test_nginx() {
    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN: Would test nginx configuration"
        return 0
    fi

    print_info "Testing Nginx configuration..."
    if sudo nginx -t 2>&1 | tee -a "$LOG_FILE"; then
        print_success "Configuration test passed"
        return 0
    else
        print_critical "Configuration test FAILED"
        return 1
    fi
}

# Reload Nginx
reload_nginx() {
    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN: Would reload nginx"
        return 0
    fi

    print_info "Reloading Nginx..."
    if sudo systemctl reload nginx; then
        print_success "Nginx reloaded successfully"
        log "Nginx reloaded successfully"
        return 0
    else
        print_critical "Nginx reload FAILED"
        log "Nginx reload FAILED"
        return 1
    fi
}

# Print summary
print_summary() {
    if [ "$JSON_OUTPUT" = true ]; then
        # JSON output
        cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "server": "srv759970.hstgr.cloud",
  "summary": {
    "total_sites": $TOTAL_SITES,
    "critical_issues": $CRITICAL_ISSUES,
    "warnings": $WARNINGS,
    "passed_checks": $PASSED_CHECKS,
    "fixes_applied": $FIXED_ISSUES
  },
  "backup_location": "$BACKUP_DIR"
}
EOF
    else
        print_header "AUDIT SUMMARY"
        echo "Total sites audited: $TOTAL_SITES"
        echo -e "${RED}Critical issues: $CRITICAL_ISSUES${NC}"
        echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
        echo -e "${GREEN}Passed checks: $PASSED_CHECKS${NC}"

        if [ "$AUTO_FIX" = true ] && [ "$DRY_RUN" = false ]; then
            echo -e "${GREEN}Fixes applied: $FIXED_ISSUES${NC}"
            echo -e "\nBackup location: $BACKUP_DIR"
        fi

        echo ""
    fi
}

# Main execution
main() {
    # Print header
    if [ "$JSON_OUTPUT" = false ]; then
        print_header "NGINX CONFIGURATION AUDIT"
        echo "Server: srv759970.hstgr.cloud"
        echo "Date: $(date)"
        echo "Mode: $([ "$AUTO_FIX" = true ] && echo "AUTO-FIX" || echo "REPORT ONLY")"
        [ "$DRY_RUN" = true ] && echo "DRY RUN: No changes will be applied"
        echo ""
    fi

    # Create backup if auto-fix enabled
    if [ "$AUTO_FIX" = true ]; then
        create_backup
    fi

    # Audit sites
    if [ -n "$SINGLE_SITE" ]; then
        # Single site audit
        site_file="$SITES_AVAILABLE/$SINGLE_SITE"
        if [ ! -f "$site_file" ]; then
            print_critical "Site not found: $SINGLE_SITE"
            exit 1
        fi
        audit_site "$site_file"
    else
        # Audit all enabled sites
        for site_file in "$SITES_ENABLED"/*; do
            if [ -f "$site_file" ]; then
                audit_site "$site_file"
            fi
        done
    fi

    # Test and reload if fixes were applied
    if [ "$AUTO_FIX" = true ] && [ "$FIXED_ISSUES" -gt 0 ] && [ "$DRY_RUN" = false ]; then
        echo ""
        if test_nginx; then
            reload_nginx
        else
            rollback
            exit 1
        fi
    fi

    # Print summary
    print_summary

    # Exit with error code if critical issues found
    if [ "$CRITICAL_ISSUES" -gt 0 ]; then
        exit 1
    fi
}

# Run main
main
