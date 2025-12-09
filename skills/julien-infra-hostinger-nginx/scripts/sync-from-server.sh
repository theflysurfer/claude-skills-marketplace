#!/bin/bash

# ========================================
# Sync from Server - Nginx Manager
# ========================================
# Télécharge les configs Nginx depuis le serveur vers le repo Git local
# Usage: ./sync-from-server.sh [--commit]

set -e

# Configuration
SSH_USER="${SSH_USER:-automation}"
SSH_HOST="${SSH_HOST:-69.62.108.82}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIGS_DIR="$PROJECT_DIR/configs"
AUTO_COMMIT=false

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Parse arguments
if [[ "$1" == "--commit" ]]; then
    AUTO_COMMIT=true
fi

echo "========================================"
echo "  Sync from Server → Git Local"
echo "========================================"
echo ""

# Créer structure de dossiers si nécessaire
mkdir -p "$CONFIGS_DIR/sites-available"
mkdir -p "$CONFIGS_DIR/sites-enabled"
mkdir -p "$CONFIGS_DIR/snippets"

# Lister les sites actifs sur le serveur
info "Fetching list of active sites from server..."
ACTIVE_SITES=$(ssh ${SSH_USER}@${SSH_HOST} "ls -1 /etc/nginx/sites-enabled/" 2>/dev/null | grep -v default || echo "")

if [ -z "$ACTIVE_SITES" ]; then
    warn "No active sites found on server"
    exit 1
fi

echo "Active sites found:"
echo "$ACTIVE_SITES" | sed 's/^/  - /'
echo ""

# Sites prioritaires (toujours syncer)
PRIORITY_SITES=(
    "clemence-multidomains"
    "jesuishyperphagique"
    "panneauxsolidaires"
    "solidarlink"
)

# Télécharger les configs des sites prioritaires
log "Syncing priority sites..."
for site in "${PRIORITY_SITES[@]}"; do
    if ssh ${SSH_USER}@${SSH_HOST} "sudo test -f /etc/nginx/sites-available/$site" 2>/dev/null; then
        info "  → $site"
        ssh ${SSH_USER}@${SSH_HOST} "sudo cat /etc/nginx/sites-available/$site" > "$CONFIGS_DIR/sites-available/$site"

        # Vérifier si le site est activé
        if echo "$ACTIVE_SITES" | grep -q "^$site$"; then
            echo "enabled" > "$CONFIGS_DIR/sites-enabled/$site.enabled"
        fi
    else
        warn "  ✗ $site not found on server"
    fi
done
echo ""

# Télécharger les snippets critiques
log "Syncing snippets..."
CRITICAL_SNIPPETS=(
    "bot-protection.conf"
    "bot-protection-wordpress.conf"
    "basic-auth.conf"
    "proxy-params.conf"
)

for snippet in "${CRITICAL_SNIPPETS[@]}"; do
    if ssh ${SSH_USER}@${SSH_HOST} "sudo test -f /etc/nginx/snippets/$snippet" 2>/dev/null; then
        info "  → $snippet"
        ssh ${SSH_USER}@${SSH_HOST} "sudo cat /etc/nginx/snippets/$snippet" > "$CONFIGS_DIR/snippets/$snippet"
    else
        warn "  ✗ $snippet not found on server"
    fi
done
echo ""

# Télécharger nginx.conf principal
log "Syncing main nginx.conf..."
ssh ${SSH_USER}@${SSH_HOST} "sudo cat /etc/nginx/nginx.conf" > "$CONFIGS_DIR/nginx.conf"
echo ""

# Créer un fichier de métadonnées
log "Creating metadata..."
cat > "$CONFIGS_DIR/SYNC_INFO.txt" <<EOF
Last sync: $(date '+%Y-%m-%d %H:%M:%S')
Server: ${SSH_USER}@${SSH_HOST}
Active sites: $(echo "$ACTIVE_SITES" | wc -l)
Synced by: $(whoami)

Active sites list:
$(echo "$ACTIVE_SITES" | sed 's/^/  - /')
EOF

log "Metadata saved"
echo ""

# Git status
cd "$PROJECT_DIR"
if git rev-parse --git-dir > /dev/null 2>&1; then
    info "Checking Git status..."

    # Voir les changements
    CHANGES=$(git status --porcelain configs/ || echo "")

    if [ -n "$CHANGES" ]; then
        echo ""
        echo "Changes detected:"
        git status --short configs/
        echo ""

        if [ "$AUTO_COMMIT" = true ]; then
            log "Auto-committing changes..."
            git add configs/
            git commit -m "Sync from server - $(date '+%Y-%m-%d %H:%M:%S')

Synced configs:
$(echo "$ACTIVE_SITES" | sed 's/^/- /')

Changes:
$(echo "$CHANGES" | head -10)
"
            log "Changes committed"
        else
            warn "Use --commit flag to auto-commit changes"
            info "Or manually run: git add configs/ && git commit -m 'Sync from server'"
        fi
    else
        log "No changes detected - configs are up to date"
    fi
else
    warn "Not a git repository"
fi

echo ""
echo "========================================"
log "Sync completed successfully!"
echo "Local configs location: $CONFIGS_DIR"
echo "========================================"
