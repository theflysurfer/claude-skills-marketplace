#!/bin/bash

# Script de mise à jour des références croisées entre skills
# Remplace les anciens noms par les nouveaux dans les fichiers .md

set -e

echo "🔗 Mise à jour des références croisées entre skills..."
echo ""

SKILLS_DIR="skills"

# Tableau associatif: ancien_nom -> nouveau_nom
declare -A REFS_MAP=(
    # Skills les plus référencés
    ["skill-creator-pro"]="julien-dev-tools-skill-creator-pro"
    ["skill-creator"]="julien-dev-tools-skill-creator-pro"
    ["skill-reviewer"]="julien-dev-tools-skill-reviewer"
    ["deployment-verifier"]="julien-infra-deployment-verifier"
    ["git-vps-sync"]="julien-infra-git-vps-sync"
    ["hostinger-deployment"]="julien-infra-hostinger-deployment"
    ["hostinger-ssh"]="julien-infra-hostinger-ssh"
    ["hostinger-database"]="julien-infra-hostinger-database"
    ["hostinger-docker"]="julien-infra-hostinger-docker"
    ["hostinger-maintenance"]="julien-infra-hostinger-maintenance"
    ["hostinger-nginx"]="julien-infra-hostinger-nginx"
    ["hostinger-space-reclaim"]="julien-infra-hostinger-space-reclaim"
    ["sync-personal-skills"]="julien-workflow-sync-personal-skills"
)

# Fonction pour mettre à jour les références dans un fichier
update_references() {
    local file="$1"
    local updated=false

    for old_ref in "${!REFS_MAP[@]}"; do
        new_ref="${REFS_MAP[$old_ref]}"

        # Patterns à rechercher et remplacer
        # Pattern 1: **old-name**
        if grep -q "\*\*${old_ref}\*\*" "$file"; then
            sed -i "s/\*\*${old_ref}\*\*/\*\*${new_ref}\*\*/g" "$file"
            updated=true
        fi

        # Pattern 2: `old-name`
        if grep -q "\`${old_ref}\`" "$file"; then
            sed -i "s/\`${old_ref}\`/\`${new_ref}\`/g" "$file"
            updated=true
        fi

        # Pattern 3: - **old-name**:
        if grep -q "^- \*\*${old_ref}\*\*:" "$file"; then
            sed -i "s/^- \*\*${old_ref}\*\*:/- \*\*${new_ref}\*\*:/g" "$file"
            updated=true
        fi
    done

    if [ "$updated" = true ]; then
        echo "  ✓ Mis à jour: $file"
    fi
}

# Parcourir tous les fichiers .md dans skills/
echo "📝 Recherche et remplacement des références..."
find "$SKILLS_DIR" -name "*.md" -type f | while read -r file; do
    update_references "$file"
done

echo ""
echo "✅ Mise à jour des références terminée!"
