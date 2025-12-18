# Git Workflows - clemencefouquet.fr

Workflows de synchronisation entre Laragon, Git, et VPS production.

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

## Workflow 1: Local → Production

### Flux
```
Laragon (dev) → Projet Git (commit) → GitHub (push) → VPS (deploy)
```

### Étape 1: Sync Laragon → Git

```bash
# Windows PowerShell
robocopy "$LOCAL_THEME" "$PROJECT_THEME" /MIR /XD .git /XF *.log

# Ou fichiers spécifiques
cp "$LOCAL_THEME/assets/css/header-modern.css" "$PROJECT_THEME/assets/css/"
```

### Étape 2: Commit

```bash
cd "$PROJECT_ROOT"
git status
git diff
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

### Étape 3: Push

```bash
git push origin main
```

### Étape 4: Deploy

```bash
# Créer archive
cd "$PROJECT_THEME"
tar -czf /tmp/theme.tar.gz .

# Upload sur VPS
scp /tmp/theme.tar.gz $SSH_HOST:/tmp/

# Extraire dans container
ssh $SSH_HOST "docker cp /tmp/theme.tar.gz $CONTAINER:/tmp/ && \
  docker exec $CONTAINER bash -c 'cd $VPS_THEME && tar -xzf /tmp/theme.tar.gz' && \
  docker exec $CONTAINER chown -R www-data:www-data $VPS_THEME"

# Vérifier
curl -I $PROD_URL
```

---

## Workflow 2: Production → Local (Sync Clémence)

### Flux
```
VPS (Gutenberg) → Backup → Projet Git (commit) → Laragon (sync)
```

### Quand l'utiliser
- Clémence a modifié du contenu via l'admin
- Des pages ont été créées/modifiées
- Le thème a été modifié via l'éditeur de site

### Étape 1: Backup (OBLIGATOIRE)

```bash
ssh $SSH_HOST "docker exec $CONTAINER wp db export /tmp/backup-$(date +%Y%m%d).sql --allow-root"
ssh $SSH_HOST "docker exec $CONTAINER tar -czf /tmp/uploads-$(date +%Y%m%d).tar.gz -C /var/www/html/wp-content uploads"
```

### Étape 2: Exporter le thème

```bash
ssh $SSH_HOST "docker exec $CONTAINER tar -czf /tmp/theme-prod.tar.gz -C /var/www/html/wp-content/themes clemence-theme"
scp $SSH_HOST:/tmp/theme-prod.tar.gz "$PROJECT_ROOT/backups/"

mkdir -p "$PROJECT_ROOT/backups/theme-prod-$(date +%Y%m%d)"
tar -xzf "$PROJECT_ROOT/backups/theme-prod.tar.gz" -C "$PROJECT_ROOT/backups/theme-prod-$(date +%Y%m%d)"
```

### Étape 3: Comparer et merger

```bash
diff -r "$PROJECT_THEME" "$PROJECT_ROOT/backups/theme-prod-$(date +%Y%m%d)/clemence-theme"
cp -r "$PROJECT_ROOT/backups/theme-prod-$(date +%Y%m%d)/clemence-theme/"* "$PROJECT_THEME/"
```

### Étape 4: Commit

```bash
git checkout -b content-sync/$(date +%Y%m%d)
git add .
git commit -m "sync: Import modifications Clémence $(date +%Y-%m-%d)"
git push origin content-sync/$(date +%Y%m%d)

# Merger dans main
git checkout main
git merge content-sync/$(date +%Y%m%d)
```

### Étape 5: Sync vers Laragon

```bash
robocopy "$PROJECT_THEME" "$LOCAL_THEME" /MIR /XD .git
```

---

## Format des commits

### Types

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring |
| `style` | Formatage CSS |
| `docs` | Documentation |
| `chore` | Maintenance |
| `sync` | Sync production → local |

### Scopes

| Scope | Usage |
|-------|-------|
| `header` | Header, navigation |
| `footer` | Footer |
| `hero` | Section hero |
| `pages` | Pages WordPress |
| `css` | Styles globaux |
| `deploy` | Déploiement |

---

## Troubleshooting

### Permissions VPS
```bash
ssh $SSH_HOST "docker exec $CONTAINER chown -R www-data:www-data $VPS_THEME"
ssh $SSH_HOST "docker exec $CONTAINER chmod -R 755 $VPS_THEME"
```

### Rollback
```bash
git revert HEAD

# ou restaurer backup
scp "$PROJECT_ROOT/backups/theme-backup.tar.gz" $SSH_HOST:/tmp/
ssh $SSH_HOST "docker exec $CONTAINER tar -xzf /tmp/theme-backup.tar.gz -C /var/www/html/wp-content/themes/"
```

### Conflits de merge
```bash
git status
# Résoudre manuellement puis
git add .
git commit -m "fix: résolution conflits merge"
```
