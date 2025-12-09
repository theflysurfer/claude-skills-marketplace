#!/bin/bash

# Script de renommage des skills selon la nouvelle taxonomie
# Format: [prefix]-[domaine]-[fonction]

set -e

echo "🔄 Démarrage du renommage des skills..."
echo ""

# Tableau associatif: ancien_nom -> nouveau_nom
declare -A SKILLS_MAP=(
    # Documents Office (Anthropic)
    ["docx"]="anthropic-office-docx"
    ["pdf"]="anthropic-office-pdf"
    ["pptx"]="anthropic-office-pptx"
    ["xlsx"]="anthropic-office-xlsx"

    # Web/Frontend (Anthropic)
    ["frontend-design"]="anthropic-web-frontend-design"
    ["web-artifacts-builder"]="anthropic-web-artifacts-builder"
    ["webapp-testing"]="anthropic-web-testing"

    # Design (Anthropic)
    ["canvas-design"]="anthropic-design-canvas"

    # Dev Tools (Anthropic)
    ["mcp-builder"]="anthropic-dev-tools-mcp-builder"

    # Infrastructure Hostinger (Julien)
    ["hostinger-database"]="julien-infra-hostinger-database"
    ["hostinger-deployment"]="julien-infra-hostinger-deployment"
    ["hostinger-docker"]="julien-infra-hostinger-docker"
    ["hostinger-maintenance"]="julien-infra-hostinger-maintenance"
    ["hostinger-nginx"]="julien-infra-hostinger-nginx"
    ["hostinger-space-reclaim"]="julien-infra-hostinger-space-reclaim"
    ["hostinger-ssh"]="julien-infra-hostinger-ssh"
    ["deployment-verifier"]="julien-infra-deployment-verifier"
    ["git-vps-sync"]="julien-infra-git-vps-sync"

    # Dev Tools (Julien)
    ["skill-creator-pro"]="julien-dev-tools-skill-creator-pro"
    ["skill-reviewer"]="julien-dev-tools-skill-reviewer"

    # Workflow (Julien)
    ["sync-personal-skills"]="julien-workflow-sync-personal-skills"
)

SKILLS_DIR="skills"

# Étape 1: Renommer les dossiers
echo "📁 Étape 1/3: Renommage des dossiers..."
for old_name in "${!SKILLS_MAP[@]}"; do
    new_name="${SKILLS_MAP[$old_name]}"
    old_path="$SKILLS_DIR/$old_name"
    new_path="$SKILLS_DIR/$new_name"

    if [ -d "$old_path" ]; then
        echo "  ✓ $old_name → $new_name"
        git mv "$old_path" "$new_path"
    else
        echo "  ⚠ Dossier non trouvé: $old_path"
    fi
done
echo ""

# Étape 2: Mettre à jour les noms dans les YAML frontmatter
echo "📝 Étape 2/3: Mise à jour des YAML frontmatter..."
for old_name in "${!SKILLS_MAP[@]}"; do
    new_name="${SKILLS_MAP[$old_name]}"
    new_path="$SKILLS_DIR/$new_name"

    # Chercher SKILL.md ou skill.md
    if [ -f "$new_path/SKILL.md" ]; then
        skill_file="$new_path/SKILL.md"
    elif [ -f "$new_path/skill.md" ]; then
        skill_file="$new_path/skill.md"
    else
        continue
    fi

    # Mettre à jour le champ name: dans le frontmatter
    if grep -q "^name: $old_name" "$skill_file"; then
        sed -i "s/^name: $old_name/name: $new_name/" "$skill_file"
        echo "  ✓ Mis à jour: $skill_file"
    fi
done
echo ""

# Étape 3: Créer un fichier de mapping pour référence
echo "📋 Étape 3/3: Création du fichier de mapping..."
cat > "SKILLS_RENAME_MAP.md" << 'EOF'
# Skills Rename Mapping

Cette table documente le renommage des skills selon la nouvelle taxonomie.

Format: `[prefix]-[domaine]-[fonction]`

| Ancien nom | Nouveau nom | Catégorie |
|------------|-------------|-----------|
EOF

# Trier et ajouter les mappings
for old_name in $(echo "${!SKILLS_MAP[@]}" | tr ' ' '\n' | sort); do
    new_name="${SKILLS_MAP[$old_name]}"

    # Déterminer la catégorie
    if [[ $new_name == anthropic-office-* ]]; then
        category="Documents Office"
    elif [[ $new_name == anthropic-web-* ]]; then
        category="Web/Frontend"
    elif [[ $new_name == anthropic-design-* ]]; then
        category="Design"
    elif [[ $new_name == anthropic-dev-tools-* ]]; then
        category="Dev Tools (Anthropic)"
    elif [[ $new_name == julien-infra-* ]]; then
        category="Infrastructure"
    elif [[ $new_name == julien-dev-tools-* ]]; then
        category="Dev Tools (Julien)"
    elif [[ $new_name == julien-workflow-* ]]; then
        category="Workflow"
    else
        category="Autre"
    fi

    echo "| \`$old_name\` | \`$new_name\` | $category |" >> "SKILLS_RENAME_MAP.md"
done

echo ""
echo "✅ Renommage terminé!"
echo ""
echo "📊 Résumé:"
echo "  - ${#SKILLS_MAP[@]} skills renommés"
echo "  - Fichier de mapping créé: SKILLS_RENAME_MAP.md"
echo ""
echo "⚠️  Prochaines étapes manuelles:"
echo "  1. Vérifier les références croisées entre skills"
echo "  2. Mettre à jour les fichiers README si nécessaire"
echo "  3. Tester l'importation des skills renommés"
