---
name: wp-build-tools
description: This skill enforces build tooling, linting, and quality checks for WordPress theme development. Use when setting up project, configuring linters, or running quality checks.
allowed-tools: Read, Write, Edit, Bash
---

# WordPress Build Tools & Quality

## Objectif
Garantir la qualité du code via des outils automatisés : Stylelint, ESLint, PHPCS, et @wordpress/scripts.

---

## Stack recommandée

| Outil | Usage | Config |
|-------|-------|--------|
| `@wordpress/scripts` | Build JS/CSS (Babel + Webpack) | `wp-scripts` |
| `Stylelint` | Lint CSS | `.stylelintrc.json` |
| `ESLint` | Lint JS | `.eslintrc.json` |
| `PHPCS` | Lint PHP | `phpcs.xml` |

---

## Installation

### 1. @wordpress/scripts

```bash
npm init -y
npm install --save-dev @wordpress/scripts
```

### 2. Stylelint

```bash
npm install --save-dev stylelint stylelint-config-standard
```

### 3. ESLint

```bash
npm install --save-dev @wordpress/eslint-plugin
```

### 4. PHPCS

```bash
composer require --dev squizlabs/php_codesniffer
composer require --dev wp-coding-standards/wpcs
./vendor/bin/phpcs --config-set installed_paths vendor/wp-coding-standards/wpcs
```

---

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
    "no-descending-specificity": null,
    "color-function-notation": "legacy",
    "alpha-value-notation": "number",
    "selector-class-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
    "custom-property-pattern": "^([a-z][a-z0-9]*)(-[a-z0-9]+)*$",
    "at-rule-no-unknown": [true, {
      "ignoreAtRules": ["layer"]
    }]
  },
  "ignoreFiles": [
    "node_modules/**",
    "vendor/**",
    "**/*.min.css"
  ]
}
```

### Règles expliquées

| Règle | Effet |
|-------|-------|
| `declaration-no-important` | Interdit `!important` |
| `selector-max-specificity` | Max 0,3,0 (3 classes) |
| `selector-max-compound-selectors` | Max 2 niveaux |
| `selector-max-id` | Interdit les ID |
| `selector-class-pattern` | Force nommage BEM |

---

## Configuration ESLint

### `.eslintrc.json`

```json
{
  "extends": ["plugin:@wordpress/eslint-plugin/recommended"],
  "env": {
    "browser": true,
    "es2021": true
  },
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error"
  },
  "ignorePatterns": [
    "node_modules/",
    "vendor/",
    "*.min.js"
  ]
}
```

---

## Configuration PHPCS

### `phpcs.xml`

```xml
<?xml version="1.0"?>
<ruleset name="Clemence Theme Coding Standards">
  <description>PHPCS ruleset for Clemence Theme</description>

  <!-- Scan these files -->
  <file>.</file>

  <!-- Exclude paths -->
  <exclude-pattern>/vendor/*</exclude-pattern>
  <exclude-pattern>/node_modules/*</exclude-pattern>

  <!-- WordPress Coding Standards -->
  <rule ref="WordPress-Core"/>
  <rule ref="WordPress-Extra"/>

  <!-- Customize rules -->
  <rule ref="WordPress.Files.FileName">
    <properties>
      <property name="strict_class_file_names" value="false"/>
    </properties>
  </rule>

  <!-- Text domain -->
  <rule ref="WordPress.WP.I18n">
    <properties>
      <property name="text_domain" type="array" value="clemence-fouquet"/>
    </properties>
  </rule>

  <!-- PHP version -->
  <config name="testVersion" value="8.0-"/>
</ruleset>
```

---

## Scripts npm

### `package.json`

```json
{
  "name": "clemence-theme",
  "version": "1.0.0",
  "scripts": {
    "start": "wp-scripts start",
    "build": "wp-scripts build",
    "lint:css": "stylelint \"assets/css/**/*.css\"",
    "lint:css:fix": "stylelint \"assets/css/**/*.css\" --fix",
    "lint:js": "eslint assets/js --max-warnings=0",
    "lint:js:fix": "eslint assets/js --fix",
    "lint:php": "vendor/bin/phpcs -p",
    "lint:php:fix": "vendor/bin/phpcbf -p",
    "lint": "npm run lint:css && npm run lint:js && npm run lint:php",
    "test": "npm run lint && npm run build"
  },
  "devDependencies": {
    "@wordpress/scripts": "^27.0.0",
    "@wordpress/eslint-plugin": "^17.0.0",
    "stylelint": "^16.0.0",
    "stylelint-config-standard": "^36.0.0"
  }
}
```

---

## Utilisation

### Lint CSS

```bash
# Vérifier
npm run lint:css

# Corriger automatiquement
npm run lint:css:fix
```

### Lint JS

```bash
# Vérifier
npm run lint:js

# Corriger automatiquement
npm run lint:js:fix
```

### Lint PHP

```bash
# Vérifier
npm run lint:php

# Corriger automatiquement
npm run lint:php:fix
```

### Build

```bash
# Développement (watch)
npm run start

# Production
npm run build
```

---

## Intégration CI (GitHub Actions)

### `.github/workflows/lint.yml`

```yaml
name: Lint

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint CSS
        run: npm run lint:css

      - name: Lint JS
        run: npm run lint:js

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          tools: composer

      - name: Install Composer dependencies
        run: composer install --prefer-dist --no-progress

      - name: Lint PHP
        run: npm run lint:php
```

---

## Erreurs communes

### Stylelint : `declaration-no-important`

```bash
# Erreur
assets/css/custom.css
  10:15  error  Unexpected !important  declaration-no-important

# Solution : utiliser la spécificité
body .selector { color: red; }
```

### Stylelint : `selector-max-specificity`

```bash
# Erreur
assets/css/header.css
  25:1  error  Expected selector ".l-header .nav .menu .item .link" to have a specificity no more than "0,3,0"

# Solution : réduire les niveaux
.l-header__link { }
```

### ESLint : `no-unused-vars`

```bash
# Erreur
assets/js/app.js
  5:7  error  'config' is assigned a value but never used  no-unused-vars

# Solution : supprimer ou utiliser la variable
```

### PHPCS : `WordPress.Files.FileName`

```bash
# Erreur
patterns/hero.php: File name "hero.php" is not a valid class name

# Solution : ignorer pour les patterns (config dans phpcs.xml)
```

---

## Commandes de vérification rapide

### Avant commit

```bash
# Tout linter
npm run lint

# Si erreurs CSS, voir détails
npm run lint:css -- --formatter verbose
```

### Trouver les !important

```bash
grep -rn '!important' assets/css/
```

### Compter les problèmes

```bash
# CSS
npm run lint:css 2>&1 | grep -c 'error'

# JS
npm run lint:js 2>&1 | grep -c 'error'
```

---

## Checklist setup projet

- [ ] `npm init -y`
- [ ] `npm install --save-dev @wordpress/scripts stylelint stylelint-config-standard @wordpress/eslint-plugin`
- [ ] `composer require --dev squizlabs/php_codesniffer wp-coding-standards/wpcs`
- [ ] Créer `.stylelintrc.json`
- [ ] Créer `.eslintrc.json`
- [ ] Créer `phpcs.xml`
- [ ] Ajouter scripts dans `package.json`
- [ ] Tester `npm run lint`
- [ ] (Optionnel) Ajouter CI GitHub Actions

---

## Bonnes pratiques

### 1. Linter avant commit

Toujours exécuter `npm run lint` avant de committer.

### 2. Fix automatique d'abord

Utiliser `--fix` pour corriger les erreurs triviales automatiquement.

### 3. Zero warnings

Configurer `--max-warnings=0` pour traiter les warnings comme des erreurs.

### 4. Pre-commit hooks

Utiliser Husky pour linter automatiquement :

```bash
npm install --save-dev husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.css": "stylelint --fix",
    "*.js": "eslint --fix",
    "*.php": "vendor/bin/phpcbf"
  }
}
```

### 5. Ignorer les fichiers générés

Ne jamais linter les fichiers dans `node_modules/`, `vendor/`, ou les fichiers `.min.js/.min.css`.
