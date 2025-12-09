#!/bin/bash

# ========================================
# Health Check Script - Nginx Manager
# ========================================
# Vérifie que les services critiques sont accessibles
# Usage: ./health-check.sh [--verbose]

set -e

# Configuration
SSH_USER="${SSH_USER:-automation}"
SSH_HOST="${SSH_HOST:-69.62.108.82}"
VERBOSE=false

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Services critiques à vérifier
declare -A CRITICAL_SERVICES=(
    ["clemencefouquet.fr"]="https://clemencefouquet.fr"
    ["clemence-admin"]="https://clemencefouquet.fr/wp-admin/"
)

# Parse arguments
if [[ "$1" == "--verbose" ]]; then
    VERBOSE=true
fi

# Fonction de log
log() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Fonction de vérification HTTP
check_url() {
    local name=$1
    local url=$2

    if [ "$VERBOSE" = true ]; then
        echo "Checking: $url"
    fi

    # Utiliser curl avec timeout de 10s
    status_code=$(ssh ${SSH_USER}@${SSH_HOST} "curl -k -s -o /dev/null -w '%{http_code}' --max-time 10 '$url'" 2>/dev/null || echo "000")

    if [[ "$status_code" == "200" ]] || [[ "$status_code" == "302" ]]; then
        log "$name - HTTP $status_code"
        return 0
    else
        error "$name - HTTP $status_code (expected 200 or 302)"
        return 1
    fi
}

# Fonction de vérification des conteneurs Docker
check_containers() {
    local service_name=$1
    shift
    local containers=("$@")

    if [ "$VERBOSE" = true ]; then
        echo "Checking containers for: $service_name"
    fi

    for container in "${containers[@]}"; do
        status=$(ssh ${SSH_USER}@${SSH_HOST} "sudo docker inspect -f '{{.State.Status}}' $container 2>/dev/null" || echo "not_found")

        if [[ "$status" == "running" ]]; then
            log "Container $container is running"
        else
            error "Container $container is $status (expected running)"
            return 1
        fi
    done

    return 0
}

# Main
echo "========================================"
echo "  Nginx Manager - Health Check"
echo "========================================"
echo ""

failed=0
total=0

# Vérifier les services HTTP
echo "Checking HTTP services..."
for service in "${!CRITICAL_SERVICES[@]}"; do
    ((total++))
    if ! check_url "$service" "${CRITICAL_SERVICES[$service]}"; then
        ((failed++))
    fi
done
echo ""

# Vérifier les conteneurs WordPress Clémence
echo "Checking Docker containers..."
((total++))
if check_containers "WordPress Clémence" "wordpress-clemence" "nginx-clemence" "mysql-clemence"; then
    log "All WordPress Clémence containers are running"
else
    ((failed++))
    error "Some WordPress Clémence containers are down"
fi
echo ""

# Résumé
echo "========================================"
if [ $failed -eq 0 ]; then
    log "All checks passed! ($total/$total)"
    exit 0
else
    error "$failed/$total checks failed"
    exit 1
fi
