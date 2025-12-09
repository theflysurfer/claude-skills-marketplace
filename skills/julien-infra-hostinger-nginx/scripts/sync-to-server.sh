#!/bin/bash

# ========================================
# Sync to Server - Nginx Manager
# ========================================
# Upload une config locale vers le serveur (avec backup et tests)
# Usage: ./sync-to-server.sh <config_name>

set -e

# Configuration
SSH_USER="${SSH_USER:-automation}"
SSH_HOST="${SSH_HOST:-69.62.108.82}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIGS_DIR="$PROJECT_DIR/configs"

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

# Vérifier l'argument
if [ -z "$1" ]; then
    echo "Usage: $0 <config_name>"
    echo ""
    echo "Examples:"
    echo "  $0 clemence-multidomains"
    echo "  $0 snippets/bot-protection-wordpress.conf"
    echo ""
    echo "Available configs:"
    ls -1 "$CONFIGS_DIR/sites-available/" 2>/dev/null | sed 's/^/  - sites-available\//' || echo "  (none)"
    ls -1 "$CONFIGS_DIR/snippets/" 2>/dev/null | sed 's/^/  - snippets\//' || echo "  (none)"
    exit 1
fi

CONFIG_NAME=$1

# Déterminer le type de config (site ou snippet)
if [[ "$CONFIG_NAME" == snippets/* ]]; then
    # C'est un snippet
    LOCAL_FILE="$CONFIGS_DIR/$CONFIG_NAME"
    REMOTE_PATH="/etc/nginx/$CONFIG_NAME"
    CONFIG_TYPE="snippet"
elif [ -f "$CONFIGS_DIR/sites-available/$CONFIG_NAME" ]; then
    # C'est un site
    LOCAL_FILE="$CONFIGS_DIR/sites-available/$CONFIG_NAME"
    REMOTE_PATH="/etc/nginx/sites-available/$CONFIG_NAME"
    CONFIG_TYPE="site"
else
    error "Config not found: $CONFIG_NAME"
    exit 1
fi

echo "========================================"
echo "  Sync to Server - Safe Upload"
echo "========================================"
echo ""
echo "Config type: $CONFIG_TYPE"
echo "Local file:  $LOCAL_FILE"
echo "Remote path: $REMOTE_PATH"
echo ""

# Vérifier que le fichier local existe
if [ ! -f "$LOCAL_FILE" ]; then
    error "Local file not found: $LOCAL_FILE"
    exit 1
fi

# Vérifier si Git est propre
cd "$PROJECT_DIR"
if git rev-parse --git-dir > /dev/null 2>&1; then
    if ! git diff --quiet "$LOCAL_FILE" 2>/dev/null; then
        warn "File has uncommitted changes in Git"
        warn "Consider committing first: git add $LOCAL_FILE && git commit -m 'Update config'"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Utiliser nginx-deploy.sh si c'est un site
if [ "$CONFIG_TYPE" = "site" ]; then
    warn "Using nginx-deploy.sh for safe deployment..."
    bash "$SCRIPT_DIR/nginx-deploy.sh" "$LOCAL_FILE" "$CONFIG_NAME"
    exit $?
fi

# Pour les snippets, déploiement simple (pas de reload requis généralement)
log "Backing up current snippet on server..."
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ssh ${SSH_USER}@${SSH_HOST} "sudo test -f $REMOTE_PATH && sudo cp $REMOTE_PATH ${REMOTE_PATH}.backup-${TIMESTAMP} || true"

log "Uploading snippet to server..."
scp "$LOCAL_FILE" ${SSH_USER}@${SSH_HOST}:/tmp/$(basename "$REMOTE_PATH").tmp
ssh ${SSH_USER}@${SSH_HOST} "sudo mv /tmp/$(basename "$REMOTE_PATH").tmp $REMOTE_PATH"

log "Setting correct permissions..."
ssh ${SSH_USER}@${SSH_HOST} "sudo chown root:root $REMOTE_PATH && sudo chmod 644 $REMOTE_PATH"

echo ""
warn "Snippet uploaded but Nginx NOT reloaded"
warn "Sites using this snippet need manual reload:"
echo "  ssh ${SSH_USER}@${SSH_HOST} 'sudo nginx -t && sudo systemctl reload nginx'"

echo ""
echo "========================================"
log "Sync to server completed!"
echo "========================================"
