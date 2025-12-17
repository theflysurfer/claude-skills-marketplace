---
name: wp-sync-workflows
description: This skill manages sync workflows between local development (Laragon), Git, and production VPS. Use for commits, deployments, and syncing content changes made by Clémence via Gutenberg.
allowed-tools: Bash, Read, Write
---

# WordPress Git Workflow

## Objectif
Gérer le flux bidirectionnel entre développement local et production, incluant la récupération des modifications faites par Clémence via Gutenberg.

---

## Variables d'environnement

```bash
# Local (Laragon)
LOCAL_THEME="C:\laragon\www\clemence\wp-content\themes\clemence-theme"
LOCAL_URL="http://localhost/clemence"

# Projet Git
PROJECT_ROOT="C:\Users\julien\OneDrive\Coding\_Projets de code\2025.10 Site internet Clem"
PROJECT_THEME="$PROJECT_ROOT\wordpress\clemence-theme"

# Production VPS
SSH_HOST="srv759970"
VPS_IP="69.62.108.82"
CONTAINER="wordpress-clemence"
VPS_THEME="/var/www/html/wp-content/themes/clemence-theme"
PROD_URL="https://clemencefouquet.fr"
```

---

## Workflow 1 : Développement Local → Production

### Flux
```
Laragon (dev) → Projet Git (commit) → GitHub (push) → VPS (deploy)
```

### Étape 1 : Développer dans Laragon

1. Modifier les fichiers dans `C:\laragon\www\clemence\`
2. Tester sur http://localhost/clemence
3. Vérifier dans le navigateur (Ctrl+Shift+R pour hard refresh)

### Étape 2 : Synchroniser Laragon → Projet Git

```bash
# Windows PowerShell
robocopy "$LOCAL_THEME" "$PROJECT_THEME" /MIR /XD .git /XF *.log

# Ou manuellement pour fichiers spécifiques
cp "$LOCAL_THEME/assets/css/header-modern.css" "$PROJECT_THEME/assets/css/"
```

### Étape 3 : Commit avec message conventionnel

```bash
cd "$PROJECT_ROOT"

# Vérifier les changements
git status
git diff

# Commit
git add .
git commit -m "$(cat <<'EOF'
feat(header): réduire espacement logo-navigation

- Gap réduit de 2rem à 1rem
- Alignement vertical centré
- Test mobile OK

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Étape 4 : Push vers GitHub

```bash
git push origin main
# ou
git push origin dev
```

### Étape 5 : Déployer sur VPS

```bash
# Créer archive du thème
cd "$PROJECT_THEME"
tar -czf /tmp/theme.tar.gz .

# Upload sur VPS
scp /tmp/theme.tar.gz $SSH_HOST:/tmp/

# Extraire dans le container
ssh $SSH_HOST "docker cp /tmp/theme.tar.gz $CONTAINER:/tmp/ && \
  docker exec $CONTAINER bash -c 'cd /var/www/html/wp-content/themes/clemence-theme && tar -xzf /tmp/theme.tar.gz' && \
  docker exec $CONTAINER chown -R www-data:www-data /var/www/html/wp-content/themes/clemence-theme"

# Vérifier
curl -I $PROD_URL
```

---

## Workflow 2 : Sync Modifications Clémence (Production → Local)

### Flux
```
VPS (Gutenberg) → Backup → Projet Git (commit) → Laragon (sync)
```

### Quand l'utiliser
- Clémence a modifié du contenu via l'admin WordPress
- Des pages ont été créées/modifiées
- Des media ont été uploadés
- Le thème a été modifié via l'éditeur de site

### Étape 1 : Backup avant sync (OBLIGATOIRE)

```bash
# Créer un backup complet
ssh $SSH_HOST "docker exec $CONTAINER wp db export /tmp/backup-$(date +%Y%m%d).sql --allow-root"
ssh $SSH_HOST "docker exec $CONTAINER tar -czf /tmp/uploads-$(date +%Y%m%d).tar.gz -C /var/www/html/wp-content uploads"
```

### Étape 2 : Exporter les contenus

```bash
# Export pages/posts en XML
ssh $SSH_HOST "docker exec $CONTAINER wp export --post_type=page,post --allow-root" > "$PROJECT_ROOT/backups/content-$(date +%Y%m%d).xml"

# Export base de données (tables de contenu)
ssh $SSH_HOST "docker exec $CONTAINER wp db export - --tables=wp_posts,wp_postmeta,wp_terms,wp_term_relationships --allow-root" > "$PROJECT_ROOT/backups/content-db-$(date +%Y%m%d).sql"
```

### Étape 3 : Exporter le thème (si modifié)

```bash
# Télécharger le thème depuis production
ssh $SSH_HOST "docker exec $CONTAINER tar -czf /tmp/theme-prod.tar.gz -C /var/www/html/wp-content/themes clemence-theme"
scp $SSH_HOST:/tmp/theme-prod.tar.gz "$PROJECT_ROOT/backups/"

# Extraire pour comparaison
mkdir -p "$PROJECT_ROOT/backups/theme-prod-$(date +%Y%m%d)"
tar -xzf "$PROJECT_ROOT/backups/theme-prod.tar.gz" -C "$PROJECT_ROOT/backups/theme-prod-$(date +%Y%m%d)"
```

### Étape 4 : Comparer et merger

```bash
# Voir les différences
diff -r "$PROJECT_THEME" "$PROJECT_ROOT/backups/theme-prod-$(date +%Y%m%d)/clemence-theme"

# Si OK, copier les changements
cp -r "$PROJECT_ROOT/backups/theme-prod-$(date +%Y%m%d)/clemence-theme/"* "$PROJECT_THEME/"
```

### Étape 5 : Commit les changements de Clémence

```bash
# Créer une branche dédiée
git checkout -b content-sync/$(date +%Y%m%d)

# Commit
git add .
git commit -m "$(cat <<'EOF'
sync: Import modifications Clémence $(date +%Y-%m-%d)

Changements importés depuis production :
- [Lister les changements]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push
git push origin content-sync/$(date +%Y%m%d)

# Merger dans main (après review)
git checkout main
git merge content-sync/$(date +%Y%m%d)
```

### Étape 6 : Sync vers Laragon

```bash
# Copier vers Laragon
robocopy "$PROJECT_THEME" "$LOCAL_THEME" /MIR /XD .git

# Importer la base de données si nécessaire
mysql -u root clemence < "$PROJECT_ROOT/backups/content-db-$(date +%Y%m%d).sql"
```

---

## Branches Git

### Structure recommandée

```
main              # Production stable
├── dev           # Développement actif
├── feature/*     # Nouvelles fonctionnalités
├── fix/*         # Corrections
└── content-sync/* # Sync des modifs Clémence
```

### Conventions de nommage

```bash
# Features
git checkout -b feature/nouveau-hero
git checkout -b feature/menu-mobile

# Fixes
git checkout -b fix/header-spacing
git checkout -b fix/footer-links

# Sync
git checkout -b content-sync/20251119
```

---

## Format des commits

### Types

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring (pas de changement fonctionnel) |
| `style` | Formatage CSS (pas de changement logique) |
| `docs` | Documentation |
| `chore` | Maintenance |
| `sync` | Synchronisation production → local |

### Scopes

| Scope | Usage |
|-------|-------|
| `header` | Header, navigation |
| `footer` | Footer |
| `hero` | Section hero |
| `pages` | Pages WordPress |
| `css` | Styles globaux |
| `deploy` | Déploiement |

### Exemple complet

```bash
git commit -m "$(cat <<'EOF'
feat(hero): ajouter animation fade-in au scroll

- Animation avec Intersection Observer
- Respecte prefers-reduced-motion
- Délai progressif sur les éléments enfants

Closes #42

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Commandes rapides

### Status et diff
```bash
git status
git diff
git diff --staged
git log --oneline -10
```

### Branches
```bash
git branch -a
git checkout -b feature/xxx
git checkout main
git merge feature/xxx
```

### Remote
```bash
git remote -v
git fetch origin
git pull origin main
git push origin main
```

### Annuler
```bash
git restore .                    # Annuler modifications non commitées
git restore --staged .           # Unstage
git reset --soft HEAD~1          # Annuler dernier commit (garde les fichiers)
```

---

## Checklist déploiement

### Avant déploiement
- [ ] Tests locaux OK (Laragon)
- [ ] Commit avec message clair
- [ ] Push vers GitHub
- [ ] Pas de fichiers sensibles (.env, credentials)

### Pendant déploiement
- [ ] Backup production fait
- [ ] Archive thème créée
- [ ] Upload + extraction OK
- [ ] Permissions www-data appliquées

### Après déploiement
- [ ] Site accessible (curl -I)
- [ ] Vérification visuelle
- [ ] Cache vidé si nécessaire
- [ ] Test fonctionnel rapide

---

## Troubleshooting

### Git refuse de push
```bash
# Vérifier la remote
git remote -v

# Forcer (attention!)
git push --force-with-lease origin main
```

### Conflits de merge
```bash
# Voir les fichiers en conflit
git status

# Résoudre manuellement puis
git add .
git commit -m "fix: résolution conflits merge"
```

### Permissions VPS
```bash
ssh $SSH_HOST "docker exec $CONTAINER chown -R www-data:www-data /var/www/html/wp-content/themes/clemence-theme"
ssh $SSH_HOST "docker exec $CONTAINER chmod -R 755 /var/www/html/wp-content/themes/clemence-theme"
```

### Rollback
```bash
# Revenir au commit précédent
git revert HEAD

# Ou restaurer un backup
scp "$PROJECT_ROOT/backups/theme-backup.tar.gz" $SSH_HOST:/tmp/
ssh $SSH_HOST "docker exec $CONTAINER tar -xzf /tmp/theme-backup.tar.gz -C /var/www/html/wp-content/themes/"
```
