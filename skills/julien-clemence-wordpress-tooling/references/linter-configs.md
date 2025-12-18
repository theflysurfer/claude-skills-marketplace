# Linter Configurations

Configurations prêtes à copier pour le thème clemencefouquet.fr.

## Stylelint - `.stylelintrc.json`

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
| `at-rule-no-unknown` | Autorise `@layer` |

---

## ESLint - `.eslintrc.json`

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

## PHPCS - `phpcs.xml`

```xml
<?xml version="1.0"?>
<ruleset name="Clemence Theme Coding Standards">
  <description>PHPCS ruleset for Clemence Theme</description>

  <file>.</file>

  <exclude-pattern>/vendor/*</exclude-pattern>
  <exclude-pattern>/node_modules/*</exclude-pattern>

  <rule ref="WordPress-Core"/>
  <rule ref="WordPress-Extra"/>

  <rule ref="WordPress.Files.FileName">
    <properties>
      <property name="strict_class_file_names" value="false"/>
    </properties>
  </rule>

  <rule ref="WordPress.WP.I18n">
    <properties>
      <property name="text_domain" type="array" value="clemence-fouquet"/>
    </properties>
  </rule>

  <config name="testVersion" value="8.0-"/>
</ruleset>
```

---

## Package.json scripts

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

## Installation

```bash
# WordPress scripts + linters JS
npm init -y
npm install --save-dev @wordpress/scripts stylelint stylelint-config-standard @wordpress/eslint-plugin

# PHPCS
composer require --dev squizlabs/php_codesniffer wp-coding-standards/wpcs
./vendor/bin/phpcs --config-set installed_paths vendor/wp-coding-standards/wpcs
```

---

## Commandes

```bash
# Lint tout
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

## GitHub Actions - `.github/workflows/lint.yml`

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
