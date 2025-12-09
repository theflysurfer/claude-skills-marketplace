#!/bin/bash

# ========================================
# WP-CLI Helper Script - Nginx Manager
# ========================================
# Exécute WP-CLI sur un site WordPress distant
# Usage: ./wp-cli.sh <site> <wp-cli-command>
#
# Exemples:
#   ./wp-cli.sh clemence "plugin list"
#   ./wp-cli.sh clemence "user list"
#   ./wp-cli.sh clemence "core version"

set -e

# Configuration
SSH_USER="${SSH_USER:-automation}"
SSH_HOST="${SSH_HOST:-69.62.108.82}"

# Sites disponibles
declare -A SITES=(
    ["clemence"]="wp-cli-clemence"
    ["jesuishyperphagique"]="wp-cli-jesuishyperphagique"
    ["panneauxsolidaires"]="wp-cli-panneauxsolidaires"
    ["solidarlink"]="wp-cli-solidarlink"
)

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

# Vérifier arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <site> <wp-cli-command>"
    echo ""
    echo "Available sites:"
    for site in "${!SITES[@]}"; do
        echo "  - $site"
    done
    echo ""
    echo "Examples:"
    echo "  $0 clemence \"plugin list\""
    echo "  $0 clemence \"user list --role=administrator\""
    echo "  $0 clemence \"core version\""
    echo "  $0 clemence \"db query 'SELECT option_value FROM wp_options WHERE option_name=\"siteurl\"'\""
    exit 1
fi

SITE=$1
WP_COMMAND=$2

# Vérifier que le site existe
if [ -z "${SITES[$SITE]}" ]; then
    error "Site '$SITE' not found"
    echo ""
    echo "Available sites:"
    for site in "${!SITES[@]}"; do
        echo "  - $site"
    done
    exit 1
fi

CONTAINER=${SITES[$SITE]}

log "Executing WP-CLI on $SITE (container: $CONTAINER)"
echo "Command: wp $WP_COMMAND"
echo ""

# Exécuter WP-CLI
ssh ${SSH_USER}@${SSH_HOST} "docker exec $CONTAINER wp $WP_COMMAND --allow-root"

echo ""
log "Done"
