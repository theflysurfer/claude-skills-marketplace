#!/bin/bash

# ========================================
# Nginx Backup Script - Nginx Manager
# ========================================
# Sauvegarde les configurations Nginx avant modification
# Usage: ./nginx-backup.sh [config_name]

set -e

# Configuration
SSH_USER="${SSH_USER:-automation}"
SSH_HOST="${SSH_HOST:-69.62.108.82}"
BACKUP_DIR="backups/nginx"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Créer le dossier de backup local
mkdir -p "$BACKUP_DIR"

echo "========================================"
echo "  Nginx Backup - $TIMESTAMP"
echo "========================================"
echo ""

# Si un nom de config est fourni, sauvegarder seulement ce fichier
if [ -n "$1" ]; then
    CONFIG_NAME=$1
    echo "Backing up specific config: $CONFIG_NAME"

    # Vérifier si le fichier existe sur le serveur
    if ssh ${SSH_USER}@${SSH_HOST} "sudo test -f /etc/nginx/sites-available/$CONFIG_NAME"; then
        # Sauvegarder sur le serveur
        ssh ${SSH_USER}@${SSH_HOST} "sudo cp /etc/nginx/sites-available/$CONFIG_NAME /etc/nginx/sites-available/${CONFIG_NAME}.backup-${TIMESTAMP}"
        log "Remote backup created: ${CONFIG_NAME}.backup-${TIMESTAMP}"

        # Télécharger en local
        scp ${SSH_USER}@${SSH_HOST}:/etc/nginx/sites-available/$CONFIG_NAME "$BACKUP_DIR/${CONFIG_NAME}.backup-${TIMESTAMP}"
        log "Local backup saved: $BACKUP_DIR/${CONFIG_NAME}.backup-${TIMESTAMP}"
    else
        warn "Config file not found: /etc/nginx/sites-available/$CONFIG_NAME"
        exit 1
    fi
else
    # Backup complet de tous les sites
    echo "Creating full backup of Nginx configuration..."

    # Créer backup sur le serveur
    ssh ${SSH_USER}@${SSH_HOST} "sudo tar -czf /tmp/nginx-backup-${TIMESTAMP}.tar.gz /etc/nginx/sites-available/ /etc/nginx/sites-enabled/ /etc/nginx/snippets/ 2>/dev/null"
    log "Remote backup archive created"

    # Télécharger en local
    scp ${SSH_USER}@${SSH_HOST}:/tmp/nginx-backup-${TIMESTAMP}.tar.gz "$BACKUP_DIR/"
    log "Local backup downloaded: $BACKUP_DIR/nginx-backup-${TIMESTAMP}.tar.gz"

    # Nettoyer le fichier temporaire sur le serveur
    ssh ${SSH_USER}@${SSH_HOST} "sudo rm /tmp/nginx-backup-${TIMESTAMP}.tar.gz"
fi

echo ""
echo "========================================"
log "Backup completed successfully!"
echo "Backup location: $BACKUP_DIR"
echo "========================================"
