---
name: clemence-wordpress-tooling
description: Build tools, CSS architecture, and Git workflows for clemencefouquet.fr WordPress theme. Covers linting, @layer CSS, and sync between Laragon/Git/VPS.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# WordPress Tooling - clemencefouquet.fr

Complete tooling guide for the Clémence Fouquet WordPress theme: build tools, CSS architecture, and deployment workflows.

---

## Table of Contents

1. [Build Tools & Quality](#1-build-tools--quality)
2. [Clean CSS Architecture](#2-clean-css-architecture)
3. [Git Sync Workflows](#3-git-sync-workflows)

---

# 1. Build Tools & Quality

## Stack recommandée

| Outil | Usage | Config |
|-------|-------|--------|
| `@wordpress/scripts` | Build JS/CSS (Babel + Webpack) | `wp-scripts` |
| `Stylelint` | Lint CSS | `.stylelintrc.json` |
| `ESLint` | Lint JS | `.eslintrc.json` |
| `PHPCS` | Lint PHP | `phpcs.xml` |

## Installation

```bash
# WordPress scripts
npm init -y
npm install --save-dev @wordpress/scripts

# Stylelint
npm install --save-dev stylelint stylelint-config-standard

# ESLint
npm install --save-dev @wordpress/eslint-plugin

# PHPCS
composer require --dev squizlabs/php_codesniffer wp-coding-standards/wpcs
./vendor/bin/phpcs --config-set installed_paths vendor/wp-coding-standards/wpcs
```

## Configuration Stylelint

### `.stylelintrc.json`

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "declaration-no-important": true,
    "selector-max-specificity": "0,3,0",
    "selector-max-compound-selectors": 2,
    "selector-max-id": 0,
    "selector-class-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
    "at-rule-no-unknown": [true, { "ignoreAtRules": ["layer"] }]
  },
  "ignoreFiles": ["node_modules/**", "vendor/**", "**/*.min.css"]
}
```

## Configuration ESLint

### `.eslintrc.json`

```json
{
  "extends": ["plugin:@wordpress/eslint-plugin/recommended"],
  "env": { "browser": true, "es2021": true },
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error"
  },
  "ignorePatterns": ["node_modules/", "vendor/", "*.min.js"]
}
```

## Configuration PHPCS

### `phpcs.xml`

```xml
<?xml version="1.0"?>
<ruleset name="Clemence Theme Coding Standards">
  <file>.</file>
  <exclude-pattern>/vendor/*</exclude-pattern>
  <exclude-pattern>/node_modules/*</exclude-pattern>
  <rule ref="WordPress-Core"/>
  <rule ref="WordPress-Extra"/>
  <rule ref="WordPress.WP.I18n">
    <properties>
      <property name="text_domain" type="array" value="clemence-fouquet"/>
    </properties>
  </rule>
</ruleset>
```

## Scripts npm

```json
{
  "scripts": {
    "start": "wp-scripts start",
    "build": "wp-scripts build",
    "lint:css": "stylelint \"assets/css/**/*.css\"",
    "lint:css:fix": "stylelint \"assets/css/**/*.css\" --fix",
    "lint:js": "eslint assets/js --max-warnings=0",
    "lint:js:fix": "eslint assets/js --fix",
    "lint:php": "vendor/bin/phpcs -p",
    "lint:php:fix": "vendor/bin/phpcbf -p",
    "lint": "npm run lint:css && npm run lint:js && npm run lint:php"
  }
}
```

## Utilisation

```bash
# Lint all
npm run lint

# Fix automatique
npm run lint:css:fix
npm run lint:js:fix
npm run lint:php:fix

# Build
npm run start  # Dev (watch)
npm run build  # Production
```

---

# 2. Clean CSS Architecture

## Règles NON NÉGOCIABLES

### 1. Interdiction de `!important`

```css
/* INTERDIT */
.header { color: red !important; }

/* CORRECT - Augmenter la spécificité */
.l-header .l-header__title { color: red; }
```

### 2. Spécificité maximale : 2 niveaux

```css
/* INTERDIT - 4 niveaux */
.site-header .nav-menu .menu-item .menu-link { }

/* CORRECT - 2 niveaux */
.l-header__nav .menu-link { }
```

### 3. Tokens theme.json obligatoires

```css
/* INTERDIT - Valeurs hardcodées */
color: #5b2e7f;
padding: 24px;

/* CORRECT - Tokens theme.json */
color: var(--wp--preset--color--violet-500);
padding: var(--wp--preset--spacing--50);
```

### 4. Pas de sélecteurs d'ID

```css
/* INTERDIT */
#header { }

/* CORRECT */
.l-header { }
```

## Architecture CSS en Layers

### Ordre des layers

```css
@layer reset, base, blocks, components, utilities;
```

| Layer | Contenu | Exemple |
|-------|---------|---------|
| `reset` | Reset CSS, box-sizing | `*, *::before { box-sizing: border-box; }` |
| `base` | Styles éléments HTML | `body { line-height: 1.5; }` |
| `blocks` | Blocs Gutenberg custom | `.wp-block-hero { }` |
| `components` | Composants UI | `.l-header { }`, `.c-card { }` |
| `utilities` | Classes utilitaires | `.u-hidden { display: none; }` |

## CRITIQUE : Overrides WordPress

**CSS hors @layer bat TOUJOURS CSS dans @layer**. WordPress génère du CSS sans @layer.

### Solution : Overrides HORS @layer

```css
/* WORDPRESS OVERRIDES - HORS @layer */
body header.wp-block-group.site-header,
html body .site-header {
  width: 100vw;
  max-width: 100vw;
}

body .alignfull,
html body .alignfull {
  max-width: none;
  width: 100vw;
  margin-left: calc(50% - 50vw);
}

/* NOS STYLES CUSTOM - DANS @layer */
@layer components {
  .l-header {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
  }
}
```

### Priorité d'enqueue

```php
// Dans functions.php - priorité 20 pour gagner
add_action('wp_enqueue_scripts', 'clemence_enqueue_assets', 20);
```

## Tokens theme.json disponibles

### Couleurs
```css
var(--wp--preset--color--violet-500)    /* #5b2e7f */
var(--wp--preset--color--violet-700)    /* #3a1e54 */
var(--wp--preset--color--orange-500)    /* #f89420 */
var(--wp--preset--color--turquoise-400) /* #51c4b5 */
var(--wp--preset--color--beige-100)     /* #fdf1dd */
```

### Typographie
```css
var(--wp--preset--font-family--fraunces)  /* Titres */
var(--wp--preset--font-family--inter)     /* Corps */
var(--wp--preset--font-size--base)        /* 1rem */
var(--wp--preset--font-size--large)       /* 1.618rem */
```

### Espacements
```css
var(--wp--preset--spacing--40)  /* 16px */
var(--wp--preset--spacing--50)  /* 24px */
var(--wp--preset--spacing--60)  /* 32px */
var(--wp--preset--spacing--70)  /* 48px */
```

## Convention de nommage

| Préfixe | Usage | Exemple |
|---------|-------|---------|
| `.l-` | Layout | `.l-header`, `.l-footer` |
| `.c-` | Component | `.c-card`, `.c-modal` |
| `.u-` | Utility | `.u-hidden`, `.u-flex` |
| `.is-` | État | `.is-open`, `.is-active` |

## Commandes utiles

```bash
# Détecter les !important
grep -rn '!important' assets/css/

# Compter les couleurs hardcodées
grep -oE '#[0-9a-fA-F]{3,6}' assets/css/*.css | wc -l

# Vérifier la taille totale CSS
wc -c assets/css/*.css | tail -1
```

---

# 3. Git Sync Workflows

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

## Workflow 1 : Local → Production

### Flux
```
Laragon (dev) → Projet Git (commit) → GitHub (push) → VPS (deploy)
```

### Étape 1 : Synchroniser Laragon → Projet Git

```bash
# Windows PowerShell
robocopy "$LOCAL_THEME" "$PROJECT_THEME" /MIR /XD .git /XF *.log
```

### Étape 2 : Commit

```bash
cd "$PROJECT_ROOT"
git status
git diff
git add .
git commit -m "$(cat <<'EOF'
feat(header): réduire espacement logo-navigation

- Gap réduit de 2rem à 1rem
- Alignement vertical centré

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Étape 3 : Push et Deploy

```bash
git push origin main

# Créer archive et upload
cd "$PROJECT_THEME"
tar -czf /tmp/theme.tar.gz .
scp /tmp/theme.tar.gz $SSH_HOST:/tmp/

# Extraire dans le container
ssh $SSH_HOST "docker cp /tmp/theme.tar.gz $CONTAINER:/tmp/ && \
  docker exec $CONTAINER bash -c 'cd $VPS_THEME && tar -xzf /tmp/theme.tar.gz' && \
  docker exec $CONTAINER chown -R www-data:www-data $VPS_THEME"

# Vérifier
curl -I $PROD_URL
```

## Workflow 2 : Production → Local (Sync Clémence)

### Flux
```
VPS (Gutenberg) → Backup → Projet Git (commit) → Laragon (sync)
```

### Quand l'utiliser
- Clémence a modifié du contenu via l'admin WordPress
- Des pages ont été créées/modifiées
- Le thème a été modifié via l'éditeur de site

### Étape 1 : Backup avant sync (OBLIGATOIRE)

```bash
ssh $SSH_HOST "docker exec $CONTAINER wp db export /tmp/backup-$(date +%Y%m%d).sql --allow-root"
ssh $SSH_HOST "docker exec $CONTAINER tar -czf /tmp/uploads-$(date +%Y%m%d).tar.gz -C /var/www/html/wp-content uploads"
```

### Étape 2 : Exporter le thème

```bash
ssh $SSH_HOST "docker exec $CONTAINER tar -czf /tmp/theme-prod.tar.gz -C /var/www/html/wp-content/themes clemence-theme"
scp $SSH_HOST:/tmp/theme-prod.tar.gz "$PROJECT_ROOT/backups/"

# Extraire pour comparaison
mkdir -p "$PROJECT_ROOT/backups/theme-prod-$(date +%Y%m%d)"
tar -xzf "$PROJECT_ROOT/backups/theme-prod.tar.gz" -C "$PROJECT_ROOT/backups/theme-prod-$(date +%Y%m%d)"
```

### Étape 3 : Comparer et merger

```bash
diff -r "$PROJECT_THEME" "$PROJECT_ROOT/backups/theme-prod-$(date +%Y%m%d)/clemence-theme"
cp -r "$PROJECT_ROOT/backups/theme-prod-$(date +%Y%m%d)/clemence-theme/"* "$PROJECT_THEME/"
```

### Étape 4 : Commit les changements

```bash
git checkout -b content-sync/$(date +%Y%m%d)
git add .
git commit -m "sync: Import modifications Clémence $(date +%Y-%m-%d)"
git push origin content-sync/$(date +%Y%m%d)

# Merger dans main
git checkout main
git merge content-sync/$(date +%Y%m%d)
```

## Format des commits

### Types

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring |
| `style` | Formatage CSS |
| `sync` | Sync production → local |

### Scopes

| Scope | Usage |
|-------|-------|
| `header` | Header, navigation |
| `footer` | Footer |
| `hero` | Section hero |
| `css` | Styles globaux |
| `deploy` | Déploiement |

## Checklist déploiement

### Avant
- [ ] Tests locaux OK (Laragon)
- [ ] Commit avec message clair
- [ ] Push vers GitHub
- [ ] Pas de fichiers sensibles

### Pendant
- [ ] Backup production fait
- [ ] Archive thème créée
- [ ] Permissions www-data appliquées

### Après
- [ ] Site accessible (curl -I)
- [ ] Vérification visuelle
- [ ] Cache vidé si nécessaire

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
