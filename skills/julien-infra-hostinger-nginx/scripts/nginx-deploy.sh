#!/bin/bash

# ========================================
# Nginx Deploy Script - Nginx Manager
# ========================================
# Déploie une configuration Nginx avec backup et vérification
# Usage: ./nginx-deploy.sh <local_config_path> <remote_config_name>

set -e

# Configuration
SSH_USER="${SSH_USER:-automation}"
SSH_HOST="${SSH_HOST:-69.62.108.82}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# Vérifier les arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <local_config_path> <remote_config_name>"
    echo ""
    echo "Example:"
    echo "  $0 configs/sites/clemence-multidomains clemence-multidomains"
    exit 1
fi

LOCAL_CONFIG=$1
REMOTE_NAME=$2

echo "========================================"
echo "  Nginx Deploy - Safe Deployment"
echo "========================================"
echo ""
echo "Local config:  $LOCAL_CONFIG"
echo "Remote name:   $REMOTE_NAME"
echo ""

# Vérifier que le fichier local existe
if [ ! -f "$LOCAL_CONFIG" ]; then
    error "Local config file not found: $LOCAL_CONFIG"
    exit 1
fi

# Étape 1: Backup de la config actuelle
warn "Step 1/6: Creating backup of current config..."
bash "$SCRIPT_DIR/nginx-backup.sh" "$REMOTE_NAME"
echo ""

# Étape 2: Upload du nouveau fichier
log "Step 2/6: Uploading new config..."
scp "$LOCAL_CONFIG" ${SSH_USER}@${SSH_HOST}:/tmp/${REMOTE_NAME}.tmp
ssh ${SSH_USER}@${SSH_HOST} "sudo mv /tmp/${REMOTE_NAME}.tmp /etc/nginx/sites-available/${REMOTE_NAME}"
log "Config uploaded"
echo ""

# Étape 3: Test de la configuration
log "Step 3/6: Testing Nginx configuration..."
if ssh ${SSH_USER}@${SSH_HOST} "sudo nginx -t" 2>&1 | grep -q "test is successful"; then
    log "Configuration test passed"
else
    error "Configuration test failed!"
    warn "Rolling back to previous config..."
    bash "$SCRIPT_DIR/nginx-rollback.sh" "$REMOTE_NAME" "$(ssh ${SSH_USER}@${SSH_HOST} "ls -t /etc/nginx/sites-available/${REMOTE_NAME}.backup-* | head -1 | sed 's/.*backup-//'")"
    exit 1
fi
echo ""

# Étape 4: Activer le site si pas déjà fait
log "Step 4/6: Ensuring site is enabled..."
if ! ssh ${SSH_USER}@${SSH_HOST} "sudo test -L /etc/nginx/sites-enabled/${REMOTE_NAME}"; then
    warn "Creating symlink in sites-enabled..."
    ssh ${SSH_USER}@${SSH_HOST} "sudo ln -sf /etc/nginx/sites-available/${REMOTE_NAME} /etc/nginx/sites-enabled/${REMOTE_NAME}"
    log "Site enabled"
else
    log "Site already enabled"
fi
echo ""

# Étape 5: Recharger Nginx
log "Step 5/6: Reloading Nginx..."
ssh ${SSH_USER}@${SSH_HOST} "sudo systemctl reload nginx"
log "Nginx reloaded"
echo ""

# Étape 6: Health check
log "Step 6/6: Running health check..."
if bash "$SCRIPT_DIR/health-check.sh"; then
    echo ""
    echo "========================================"
    log "Deployment completed successfully!"
    echo "========================================"
else
    error "Health check failed!"
    warn "You may need to investigate the issue"
    warn "Use './nginx-rollback.sh $REMOTE_NAME <timestamp>' to rollback if needed"
    exit 1
fi
