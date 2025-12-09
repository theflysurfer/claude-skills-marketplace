#!/bin/bash

# ========================================
# Nginx Rollback Script - Nginx Manager
# ========================================
# Restaure une configuration Nginx depuis un backup
# Usage: ./nginx-rollback.sh <config_name> <backup_timestamp>
#        ./nginx-rollback.sh --list [config_name]

set -e

# Configuration
SSH_USER="${SSH_USER:-automation}"
SSH_HOST="${SSH_HOST:-69.62.108.82}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Fonction pour lister les backups
list_backups() {
    local config_name=$1

    echo "========================================"
    echo "  Available Backups"
    echo "========================================"
    echo ""

    if [ -n "$config_name" ]; then
        echo "Backups for: $config_name"
        ssh ${SSH_USER}@${SSH_HOST} "ls -lh /etc/nginx/sites-available/${config_name}.backup-* 2>/dev/null | awk '{print \$9, \$6, \$7, \$8}'" || warn "No backups found for $config_name"
    else
        echo "All config backups:"
        ssh ${SSH_USER}@${SSH_HOST} "ls -lh /etc/nginx/sites-available/*.backup-* 2>/dev/null | awk '{print \$9, \$6, \$7, \$8}'" || warn "No backups found"
    fi

    echo ""
}

# Fonction de rollback
rollback_config() {
    local config_name=$1
    local backup_timestamp=$2

    echo "========================================"
    echo "  Nginx Rollback"
    echo "========================================"
    echo ""
    echo "Config: $config_name"
    echo "Backup: $backup_timestamp"
    echo ""

    # Vérifier que le backup existe
    if ! ssh ${SSH_USER}@${SSH_HOST} "sudo test -f /etc/nginx/sites-available/${config_name}.backup-${backup_timestamp}"; then
        error "Backup not found: ${config_name}.backup-${backup_timestamp}"
        exit 1
    fi

    # Créer un backup de la config actuelle avant rollback
    warn "Creating safety backup of current config..."
    ssh ${SSH_USER}@${SSH_HOST} "sudo cp /etc/nginx/sites-available/$config_name /etc/nginx/sites-available/${config_name}.before-rollback-$(date +%Y%m%d-%H%M%S)"

    # Restaurer le backup
    log "Restoring backup..."
    ssh ${SSH_USER}@${SSH_HOST} "sudo cp /etc/nginx/sites-available/${config_name}.backup-${backup_timestamp} /etc/nginx/sites-available/$config_name"

    # Tester la configuration
    log "Testing Nginx configuration..."
    if ssh ${SSH_USER}@${SSH_HOST} "sudo nginx -t" 2>&1 | grep -q "test is successful"; then
        log "Configuration test passed"

        # Recharger Nginx
        log "Reloading Nginx..."
        ssh ${SSH_USER}@${SSH_HOST} "sudo systemctl reload nginx"
        log "Nginx reloaded successfully"

        echo ""
        echo "========================================"
        log "Rollback completed successfully!"
        echo "========================================"
    else
        error "Configuration test failed!"
        warn "Rolling back to previous config..."
        ssh ${SSH_USER}@${SSH_HOST} "sudo cp /etc/nginx/sites-available/${config_name}.before-rollback-$(date +%Y%m%d-%H%M%S) /etc/nginx/sites-available/$config_name"
        exit 1
    fi
}

# Main
if [ "$1" == "--list" ]; then
    list_backups "$2"
    exit 0
fi

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <config_name> <backup_timestamp>"
    echo "       $0 --list [config_name]"
    echo ""
    echo "Examples:"
    echo "  $0 clemence-multidomains 20251028-082230"
    echo "  $0 --list clemence-multidomains"
    exit 1
fi

rollback_config "$1" "$2"
