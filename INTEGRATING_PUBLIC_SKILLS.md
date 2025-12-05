# Intégrer des Skills Publiques

Guide pour intégrer des skills provenant de marketplaces publiques dans votre marketplace personnelle.

## 🔒 Considérations Légales

### Vérifier la License

Avant d'intégrer un skill public, **vérifiez toujours la licence** :

```bash
# Chercher le fichier LICENSE ou la license dans SKILL.md
cat skill-folder/LICENSE
cat skill-folder/SKILL.md | grep -i "license"
```

### Licences Compatibles

✅ **Licences permissives** (safe à intégrer) :
- `Apache-2.0` - Utilisée par Anthropic
- `MIT` - Très permissive
- `BSD-3-Clause` - Compatible
- `CC0-1.0` - Domaine public

⚠️ **Licences avec conditions** :
- `GPL-3.0` - Requiert que votre marketplace soit aussi GPL
- `AGPL-3.0` - Idem + obligations réseau

❌ **À éviter** :
- Pas de licence = tous droits réservés
- Licences propriétaires

### Obligations à Respecter

Pour Apache-2.0 et MIT :
1. ✅ Conserver le fichier LICENSE original
2. ✅ Conserver les notices de copyright
3. ✅ Documenter les modifications
4. ✅ Mentionner la source dans votre README

## 📦 Méthode 1 : Fork Direct (Recommandé)

### Étape 1 : Trouver le skill

Sources principales :
- [Anthropic officiel](https://github.com/anthropics/skills)
- [claude-plugins.dev](https://claude-plugins.dev/)
- [awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills)

### Étape 2 : Copier le skill

```bash
# Naviguer vers votre marketplace
cd ~/your-marketplace

# Créer le dossier du skill
mkdir -p skills/frontend-design

# Copier depuis un repo cloné temporairement
git clone https://github.com/anthropics/skills /tmp/anthropic-skills
cp -r /tmp/anthropic-skills/skills/frontend-design/* skills/frontend-design/
rm -rf /tmp/anthropic-skills
```

### Étape 3 : Ajouter les attributions

Créez `skills/frontend-design/ATTRIBUTION.md` :

```markdown
# Attribution

This skill is adapted from the Anthropic Skills repository.

**Original Source**: https://github.com/anthropics/skills/tree/main/skills/frontend-design
**Original License**: Apache-2.0
**Original Copyright**: Copyright © 2024 Anthropic, PBC

## Modifications

- [Date] - Adapted for personal marketplace
- [Date] - Added custom templates for X framework
```

### Étape 4 : Mettre à jour marketplace.json

```json
{
  "plugins": [
    {
      "name": "frontend-design",
      "source": "./frontend-design",
      "description": "Creates distinctive, production-grade frontend interfaces (from Anthropic)",
      "version": "1.0.0",
      "license": "Apache-2.0",
      "category": "development",
      "keywords": ["frontend", "design", "ui", "anthropic"],
      "metadata": {
        "upstream": "https://github.com/anthropics/skills/tree/main/skills/frontend-design",
        "forked": true
      }
    }
  ]
}
```

### Étape 5 : Documenter dans README.md

```markdown
## Skills Sources

### From Anthropic Official
- **frontend-design** - [Original](https://github.com/anthropics/skills/tree/main/skills/frontend-design) (Apache-2.0)

### Custom Skills
- **hostinger-nginx** - Proprietary
- **sync-personal-skills** - Proprietary
```

## 🔄 Méthode 2 : Git Submodules

Pour garder les skills synchronisés avec l'upstream :

```bash
# Ajouter comme submodule
git submodule add https://github.com/anthropics/skills vendor/anthropic-skills

# Créer des symlinks vers les skills que vous voulez
ln -s ../../vendor/anthropic-skills/skills/frontend-design skills/frontend-design
ln -s ../../vendor/anthropic-skills/skills/mcp-builder skills/mcp-builder

# Commit
git add .gitmodules vendor/ skills/
git commit -m "Add Anthropic skills as submodule"
```

**Mise à jour** :
```bash
git submodule update --remote
```

**Avantages** :
- ✅ Mises à jour faciles
- ✅ Traçabilité claire de la source

**Inconvénients** :
- ⚠️ Complexité Git (submodules can be tricky)
- ⚠️ Dépendance au repo externe

## 🎨 Méthode 3 : Marketplace Curator

Créez une marketplace thématique qui agrège plusieurs sources :

```
my-frontend-marketplace/
├── skills/
│   ├── anthropic-frontend-design/     # From Anthropic
│   ├── shadcn-components/             # From community
│   ├── tailwind-workflows/            # From community
│   └── custom-react-patterns/         # Your own
└── .claude-plugin/
    └── marketplace.json
```

**marketplace.json** avec métadonnées d'origine :

```json
{
  "name": "frontend-skills-collection",
  "metadata": {
    "description": "Curated collection of frontend development skills",
    "theme": "frontend",
    "aggregated": true
  },
  "plugins": [
    {
      "name": "frontend-design",
      "source": "./anthropic-frontend-design",
      "description": "...",
      "metadata": {
        "source": "anthropic",
        "upstream": "https://github.com/anthropics/skills",
        "curated": true
      }
    }
  ]
}
```

## 🚀 Exemple : Intégrer Frontend Design d'Anthropic

Script automatisé :

```bash
#!/bin/bash
# integrate-anthropic-skill.sh

SKILL_NAME=$1
TEMP_DIR="/tmp/anthropic-skills-$$"

# Cloner le repo Anthropic
git clone --depth 1 https://github.com/anthropics/skills "$TEMP_DIR"

# Copier le skill
cp -r "$TEMP_DIR/skills/$SKILL_NAME" "skills/$SKILL_NAME"

# Créer ATTRIBUTION.md
cat > "skills/$SKILL_NAME/ATTRIBUTION.md" <<EOF
# Attribution

**Original Source**: https://github.com/anthropics/skills/tree/main/skills/$SKILL_NAME
**License**: Apache-2.0
**Copyright**: Copyright © 2024 Anthropic, PBC

Integrated on: $(date +%Y-%m-%d)
EOF

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Skill '$SKILL_NAME' integrated successfully"
echo "📝 Don't forget to update marketplace.json"
```

Usage :
```bash
chmod +x integrate-anthropic-skill.sh
./integrate-anthropic-skill.sh frontend-design
```

## 📊 Recommandations par Type de Skill

### Skills génériques (frontend-design, mcp-builder)
**Recommandation** : Fork direct avec attribution
- Peu de changements attendus
- Personnalisation probable

### Skills spécialisés (testing, git workflows)
**Recommandation** : Submodule si actif upstream
- Mises à jour fréquentes
- Peu de personnalisation

### Skills pour apprendre
**Recommandation** : Fork et modifier librement
- Expérimentation encouragée
- Pas besoin de sync

## ⚙️ Maintenance

### Garder trace des upstream

Créez `UPSTREAM.md` :

```markdown
# Upstream Skills

| Skill | Source | Version | Last Sync | Notes |
|-------|--------|---------|-----------|-------|
| frontend-design | anthropics/skills | - | 2024-12-05 | Forked, no modifications |
| mcp-builder | anthropics/skills | - | 2024-12-05 | Modified templates/ |
```

### Vérifier les updates

```bash
# Script pour vérifier si les skills upstream ont changé
#!/bin/bash

for skill in frontend-design mcp-builder; do
  UPSTREAM="https://github.com/anthropics/skills/tree/main/skills/$skill"
  echo "Check updates for $skill: $UPSTREAM"
  # Compare dates, commits, etc.
done
```

## 🎯 Best Practices

1. **Toujours attribuer** même si la licence ne l'exige pas strictement
2. **Documenter les modifications** dans ATTRIBUTION.md
3. **Préfixer les noms** si conflit potentiel : `anthropic-frontend-design`
4. **Catégoriser clairement** : `"source": "community"` vs `"source": "proprietary"`
5. **Version locking** : noter quelle version/commit vous avez forké

## 🤝 Contribuer en Retour

Si vous améliorez un skill public :

1. Créez une PR sur le repo original
2. Partagez vos templates dans `awesome-claude-skills`
3. Créez un blog post sur vos customisations

## ⚖️ Résumé

| Critère | Fork Direct | Submodule | Curator |
|---------|-------------|-----------|---------|
| Contrôle | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Mises à jour | ⭐ | ⭐⭐⭐ | ⭐⭐ |
| Simplicité | ⭐⭐⭐ | ⭐ | ⭐⭐ |
| Personnalisation | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ |

**Recommandation générale** : Commencez par Fork Direct, passez à Submodule seulement si vous avez besoin de sync régulier.
