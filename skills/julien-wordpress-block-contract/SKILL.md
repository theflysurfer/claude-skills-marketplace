---
name: wp-block-contract
description: This skill enforces Gutenberg block development structure, metadata, and styling rules. Use when creating or modifying custom blocks for the WordPress theme.
allowed-tools: Read, Write, Edit, Bash
---

# WordPress Block Development Contract

## Objectif
Garantir des blocs Gutenberg modulaires, accessibles et maintenables avec une structure standard.

---

## Structure obligatoire d'un bloc

```
blocks/
└── card/
    ├── block.json          # Metadata (OBLIGATOIRE)
    ├── edit.js             # Composant éditeur React
    ├── save.js             # Rendu statique (ou null si dynamique)
    ├── render.php          # Rendu dynamique serveur
    ├── style.css           # Styles front-end
    ├── editor.css          # Styles éditeur uniquement
    └── index.js            # Point d'entrée (register)
```

---

## Règles fondamentales

### 1. block.json obligatoire

Champs requis :
- `name` : Namespace/nom unique (ex: `clemence/card`)
- `title` : Titre affiché dans l'éditeur
- `category` : Catégorie de bloc
- `attributes` : Propriétés avec types et défauts
- `supports` : Fonctionnalités activées

> Voir `references/block-json.md` pour exemples complets

### 2. Attributs typés avec défauts

```json
{
  "attributes": {
    "title": { "type": "string", "default": "" },
    "variant": { "type": "string", "enum": ["default", "featured"], "default": "default" }
  }
}
```

### 3. CSS avec tokens theme.json

Utiliser **exclusivement** les variables CSS de theme.json :

```css
.c-card {
  background: var(--wp--preset--color--white);
  padding: var(--wp--preset--spacing--50);
  font-size: var(--wp--preset--font-size--base);
}
```

> Voir `../wp-tokens.md` pour la liste complète

### 4. PHP avec échappement

**TOUJOURS échapper** les outputs :
- `esc_html()` pour texte
- `esc_attr()` pour attributs
- `esc_url()` pour URLs
- `get_block_wrapper_attributes()` pour wrapper

```php
<div <?php echo get_block_wrapper_attributes(['class' => 'c-card']); ?>>
  <h3><?php echo esc_html($title); ?></h3>
  <a href="<?php echo esc_url($link); ?>">
    <?php esc_html_e('En savoir plus', 'clemence-fouquet'); ?>
  </a>
</div>
```

> Voir `references/render-php.md` pour templates complets

### 5. JS avec imports WordPress

```javascript
import { __ } from '@wordpress/i18n';
import { useBlockProps, RichText, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
```

> Voir `references/edit-js.md` pour patterns

---

## Accessibilité (OBLIGATOIRE)

### Focus visible

```css
.c-card a:focus-visible,
.c-card button:focus-visible {
  outline: 2px solid var(--wp--preset--color--violet-500);
  outline-offset: 2px;
}
```

### Images avec alt

```php
echo wp_get_attachment_image($image_id, 'medium', false, [
  'class' => 'c-card__image',
  'alt'   => get_post_meta($image_id, '_wp_attachment_image_alt', true),
]);
```

### Headings hiérarchiques

- Respecter h2 > h3 > h4
- Ne pas sauter de niveaux

### Liens descriptifs

```php
<a href="<?php echo esc_url($url); ?>" aria-label="<?php echo esc_attr($title); ?> - En savoir plus">
  En savoir plus
</a>
```

> Voir `references/accessibility.md` pour détails

---

## Nommage CSS (BEM)

```css
/* Block */
.c-card { }

/* Element */
.c-card__title { }
.c-card__image { }

/* Modifier */
.c-card--featured { }
.c-card--horizontal { }
```

---

## Enregistrement PHP

```php
function clemence_register_blocks() {
  // Catégorie
  add_filter('block_categories_all', function ($categories) {
    return array_merge([
      ['slug' => 'clemence-blocks', 'title' => __('Clémence', 'clemence-fouquet')],
    ], $categories);
  });

  // Blocs
  $blocks = ['card', 'hero', 'testimonial'];
  foreach ($blocks as $block) {
    register_block_type(get_stylesheet_directory() . '/blocks/' . $block);
  }
}
add_action('init', 'clemence_register_blocks');
```

---

## Checklist bloc

### Structure
- [ ] `block.json` complet avec tous les champs
- [ ] Attributs typés avec défauts
- [ ] `supports` configurés
- [ ] `textdomain` défini

### CSS
- [ ] Utilise tokens theme.json (voir `../wp-tokens.md`)
- [ ] Nommage BEM (.c-block, .c-block__element)
- [ ] Pas de !important
- [ ] Focus visible sur éléments interactifs
- [ ] Taille < 8 KB

### PHP
- [ ] Tous les outputs échappés
- [ ] `get_block_wrapper_attributes()` utilisé
- [ ] Attributs vérifiés avant usage
- [ ] Traductions avec textdomain

### JS
- [ ] Imports propres (@wordpress/*)
- [ ] InspectorControls pour sidebar
- [ ] useBlockProps utilisé
- [ ] Pas de console.log

### Accessibilité
- [ ] Alt text sur images
- [ ] Hiérarchie headings respectée
- [ ] Liens descriptifs
- [ ] Focus states
- [ ] Contraste suffisant

---

## Anti-patterns

### Ne pas faire

```javascript
// Styles inline
<div style={{ padding: '20px', color: 'red' }}>

// Attributs sans défaut
"title": { "type": "string" }
```

```php
// Pas d'échappement
<?php echo $title; ?>
```

### Faire

```javascript
// Classes dynamiques
className={`c-card c-card--${variant}`}

// Attributs avec défauts
"title": { "type": "string", "default": "" }
```

```php
// Échapper tout
<?php echo esc_html($title); ?>
```

---

## Références

- `references/block-json.md` - Exemples block.json complets
- `references/edit-js.md` - Patterns edit.js
- `references/render-php.md` - Templates render.php
- `references/accessibility.md` - Règles accessibilité détaillées
- `../wp-tokens.md` - Tokens theme.json
- `../wp-checklists.md` - Checklists communes (CSS, PHP, JS, Accessibilité)
- `../wp-clean-css/SKILL.md` - Architecture CSS
