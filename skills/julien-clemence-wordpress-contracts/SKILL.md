---
name: clemence-wordpress-contracts
description: Development contracts for clemencefouquet.fr WordPress theme. Enforces rules for Gutenberg blocks, patterns, header, and footer. Use when creating or modifying theme components.
allowed-tools: Read, Write, Edit, Bash
---

# WordPress Development Contracts - clemencefouquet.fr

Contracts that enforce consistent, accessible, and maintainable code for the Clémence Fouquet WordPress theme.

---

## Table of Contents

1. [Block Contract](#1-block-contract)
2. [Pattern Contract](#2-pattern-contract)
3. [Header Contract](#3-header-contract)
4. [Footer Contract](#4-footer-contract)
5. [Shared Resources](#shared-resources)

---

# 1. Block Contract

## Objectif
Garantir des blocs Gutenberg modulaires, accessibles et maintenables avec une structure standard.

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

## Règles fondamentales

### 1. block.json obligatoire

Champs requis :
- `name` : Namespace/nom unique (ex: `clemence/card`)
- `title` : Titre affiché dans l'éditeur
- `category` : Catégorie de bloc
- `attributes` : Propriétés avec types et défauts
- `supports` : Fonctionnalités activées

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

```css
.c-card {
  background: var(--wp--preset--color--white);
  padding: var(--wp--preset--spacing--50);
  font-size: var(--wp--preset--font-size--base);
}
```

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

### 5. JS avec imports WordPress

```javascript
import { __ } from '@wordpress/i18n';
import { useBlockProps, RichText, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
```

## Enregistrement PHP

```php
function clemence_register_blocks() {
  add_filter('block_categories_all', function ($categories) {
    return array_merge([
      ['slug' => 'clemence-blocks', 'title' => __('Clémence', 'clemence-fouquet')],
    ], $categories);
  });

  $blocks = ['card', 'hero', 'testimonial'];
  foreach ($blocks as $block) {
    register_block_type(get_stylesheet_directory() . '/blocks/' . $block);
  }
}
add_action('init', 'clemence_register_blocks');
```

## Checklist bloc

- [ ] `block.json` complet avec tous les champs
- [ ] Attributs typés avec défauts
- [ ] Utilise tokens theme.json
- [ ] Nommage BEM (.c-block, .c-block__element)
- [ ] Tous les outputs échappés
- [ ] `get_block_wrapper_attributes()` utilisé
- [ ] Imports propres (@wordpress/*)
- [ ] Focus visible sur éléments interactifs
- [ ] Alt text sur images
- [ ] Hiérarchie headings respectée

---

# 2. Pattern Contract

## Objectif
Garantir des patterns Gutenberg réutilisables, modulaires et sans CSS additionnel.

## Règle fondamentale

> **Un pattern = une composition de blocs existants**
> **JAMAIS de nouvelles règles CSS dans un pattern**

## Structure d'un pattern

```php
<?php
/**
 * Title: Hero Violet Organique
 * Slug: clemence/hero-violet-organic
 * Categories: clemence-sections
 * Keywords: hero, banner, organic, violet
 * Viewport Width: 1440
 * Block Types: core/post-content
 */
?>

<!-- wp:cover {"overlayColor":"violet-500","minHeight":600,"align":"full"} -->
<div class="wp-block-cover alignfull">
  <!-- Contenu composé de blocs existants -->
</div>
<!-- /wp:cover -->
```

## Header du pattern (OBLIGATOIRE)

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| `Title` | Yes | Nom affiché dans l'éditeur |
| `Slug` | Yes | Identifiant unique (namespace/nom) |
| `Categories` | Yes | Catégories pour le filtrage |
| `Keywords` | Recommandé | Mots-clés pour la recherche |

## Règles de composition

### 1. Uniquement blocs existants

```php
// CORRECT - Blocs core
<!-- wp:heading -->
<!-- wp:paragraph -->
<!-- wp:button -->

// INTERDIT - HTML custom
<div class="custom-hero">...</div>
```

### 2. Pas de CSS additionnel

```php
// INTERDIT
<!-- wp:group {"className":"my-custom-section"} -->

// CORRECT - Options natives
<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|80"}}}} -->
```

### 3. Utiliser les presets theme.json

```php
// CORRECT
<!-- wp:heading {"textColor":"violet-500","fontSize":"x-large"} -->

// INTERDIT - Valeurs hardcodées
<!-- wp:heading {"style":{"color":{"text":"#5b2e7f"}}} -->
```

## Checklist pattern

- [ ] Title descriptif
- [ ] Slug unique avec namespace
- [ ] Uniquement blocs existants (core ou custom)
- [ ] Pas de HTML brut
- [ ] Pas de classes CSS custom
- [ ] Utilise presets theme.json
- [ ] Stack on mobile pour colonnes
- [ ] Headings logiques

---

# 3. Header Contract

## Objectif
Garantir un header accessible, responsive et maintenable avec effet glassmorphisme.

## Structure HTML obligatoire

```html
<header class="l-header">
  <!-- Skip link (premier élément) -->
  <a href="#main-content" class="l-header__skip">
    Aller au contenu principal
  </a>

  <!-- Logo -->
  <div class="l-header__logo">
    <!-- wp:site-logo -->
  </div>

  <!-- Navigation principale -->
  <nav class="l-header__nav" aria-label="Navigation principale">
    <!-- wp:navigation -->
  </nav>

  <!-- Actions (CTA, recherche) -->
  <div class="l-header__actions">
    <!-- Boutons, recherche -->
  </div>

  <!-- Bouton menu mobile -->
  <button
    class="l-header__toggle"
    aria-controls="mobile-nav"
    aria-expanded="false"
    aria-label="Ouvrir le menu"
  >
    <span class="l-header__toggle-icon"></span>
  </button>
</header>

<!-- Menu mobile (hors header) -->
<div id="mobile-nav" class="l-mobile-nav" aria-hidden="true">
  <!-- Contenu menu mobile -->
</div>
```

## Classes CSS

```css
.l-header { }              /* Container principal */
.l-header__skip { }        /* Skip link */
.l-header__logo { }        /* Zone logo */
.l-header__nav { }         /* Navigation desktop */
.l-header__actions { }     /* Zone CTA/recherche */
.l-header__toggle { }      /* Bouton burger */

/* États */
.l-header.is-scrolled { }  /* Header scrollé (sticky) */
.l-header.is-open { }      /* Menu mobile ouvert */
```

## Règles CSS

### Glassmorphisme
```css
@layer components {
  .l-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
}
```

## Accessibilité (OBLIGATOIRE)

### Skip link
```css
.l-header__skip {
  position: absolute;
  left: -9999px;
  z-index: 999;
}

.l-header__skip:focus {
  left: var(--wp--preset--spacing--40);
  top: var(--wp--preset--spacing--40);
}
```

### Bouton mobile
- `aria-controls="mobile-nav"` : référence l'ID du menu
- `aria-expanded="false/true"` : état ouvert/fermé
- `aria-label` : label accessible

## JavaScript requis

```javascript
const toggle = document.querySelector('.l-header__toggle');
const mobileNav = document.getElementById('mobile-nav');

toggle.addEventListener('click', () => {
  const isOpen = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', !isOpen);
  toggle.classList.toggle('is-active');
  mobileNav.classList.toggle('is-open');
  mobileNav.setAttribute('aria-hidden', isOpen);
});

// Fermer avec Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
    toggle.click();
  }
});
```

## Checklist header

- [ ] Skip link en premier
- [ ] Logo avec lien vers accueil
- [ ] Nav avec aria-label
- [ ] Bouton burger avec aria-controls et aria-expanded
- [ ] Glassmorphisme avec backdrop-filter
- [ ] Touch targets 44x44px
- [ ] Focus visible sur tous les liens
- [ ] Fermeture avec Escape

---

# 4. Footer Contract

## Objectif
Garantir un footer accessible, informatif et visuellement cohérent avec le design organique.

## Structure HTML obligatoire

```html
<footer class="l-footer">
  <!-- Séparateur organique (optionnel) -->
  <div class="l-footer__wave">
    <svg><!-- Wave SVG --></svg>
  </div>

  <!-- Grid de colonnes -->
  <div class="l-footer__grid">
    <!-- Colonne 1 : À propos -->
    <div class="l-footer__col">
      <h2 class="l-footer__heading">À propos</h2>
      <p>Description courte...</p>
    </div>

    <!-- Colonne 2 : Navigation -->
    <div class="l-footer__col">
      <h2 class="l-footer__heading">Navigation</h2>
      <nav aria-label="Navigation footer">
        <ul class="l-footer__nav">...</ul>
      </nav>
    </div>

    <!-- Colonne 3 : Contact -->
    <div class="l-footer__col">
      <h2 class="l-footer__heading">Contact</h2>
      <address class="l-footer__contact">
        <a href="mailto:contact@clemencefouquet.fr">contact@clemencefouquet.fr</a>
      </address>
    </div>

    <!-- Colonne 4 : Réseaux sociaux -->
    <div class="l-footer__col">
      <h2 class="l-footer__heading">Suivez-moi</h2>
      <ul class="l-footer__social">
        <li><a href="#" aria-label="LinkedIn"><svg>...</svg></a></li>
      </ul>
    </div>
  </div>

  <!-- Barre légale -->
  <div class="l-footer__legal">
    <p>&copy; 2025 Clémence Fouquet. Tous droits réservés.</p>
    <nav aria-label="Liens légaux">
      <a href="/mentions-legales">Mentions légales</a>
    </nav>
  </div>
</footer>
```

## Règles CSS

### Couleurs et fond
```css
@layer components {
  .l-footer {
    background: var(--wp--preset--color--violet-700);
    color: var(--wp--preset--color--white);
  }

  .l-footer a {
    color: var(--wp--preset--color--beige-100);
  }

  .l-footer a:hover {
    color: var(--wp--preset--color--orange-500);
  }
}
```

### Grid responsive
```css
@layer components {
  .l-footer__grid {
    display: grid;
    gap: var(--wp--preset--spacing--60);
    grid-template-columns: 1fr;
  }

  @media (min-width: 768px) {
    .l-footer__grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (min-width: 1024px) {
    .l-footer__grid { grid-template-columns: repeat(4, 1fr); }
  }
}
```

## Accessibilité (OBLIGATOIRE)

### Contraste
- `white` sur `violet-700` : OK
- `beige-100` sur `violet-700` : OK
- Taille de police minimum 14px

### Navigation accessible
```html
<!-- Chaque nav a un label unique -->
<nav aria-label="Navigation footer">...</nav>
<nav aria-label="Liens légaux">...</nav>
```

### Liens sociaux
```html
<a href="#" aria-label="LinkedIn de Clémence Fouquet">
  <svg aria-hidden="true">...</svg>
</a>
```

## Checklist footer

- [ ] Grid 2-4 colonnes responsive
- [ ] Titres de section en h2
- [ ] Navigation avec aria-label
- [ ] Section contact avec `<address>`
- [ ] Liens sociaux avec aria-label
- [ ] Fond violet-700, texte blanc/beige
- [ ] Taille police >= 14px
- [ ] Copyright avec année courante

---

# Shared Resources

## Tokens theme.json

### Couleurs
```css
var(--wp--preset--color--violet-500)    /* #5b2e7f */
var(--wp--preset--color--violet-700)    /* #3a1e54 */
var(--wp--preset--color--orange-500)    /* #f89420 */
var(--wp--preset--color--turquoise-400) /* #51c4b5 */
var(--wp--preset--color--beige-100)     /* #fdf1dd */
var(--wp--preset--color--white)         /* #ffffff */
```

### Typographie
```css
var(--wp--preset--font-family--fraunces)  /* Titres */
var(--wp--preset--font-family--inter)     /* Corps */

var(--wp--preset--font-size--base)        /* 1rem */
var(--wp--preset--font-size--large)       /* 1.618rem */
var(--wp--preset--font-size--x-large)     /* 2.618rem */
```

### Espacements
```css
var(--wp--preset--spacing--40)  /* 16px */
var(--wp--preset--spacing--50)  /* 24px */
var(--wp--preset--spacing--60)  /* 32px */
var(--wp--preset--spacing--70)  /* 48px */
```

## Convention de nommage BEM

| Préfixe | Usage | Exemple |
|---------|-------|---------|
| `.l-` | Layout (header, footer) | `.l-header`, `.l-footer` |
| `.c-` | Component (card, button) | `.c-card`, `.c-modal` |
| `.u-` | Utility (hidden, flex) | `.u-hidden`, `.u-flex` |
| `.is-` | État | `.is-open`, `.is-active` |

```css
/* Block */
.c-card { }

/* Element */
.c-card__title { }

/* Modifier */
.c-card--featured { }
```

## Anti-patterns communs

### Ne pas faire
```css
/* !important */
.header { display: flex !important; }

/* ID selector */
#main-header { }

/* Trop de niveaux */
.site-header .nav-menu .menu-item .menu-link { }

/* Valeurs hardcodées */
color: #5b2e7f;
padding: 20px;
```

### Faire
```css
/* Layer approprié */
@layer components {
  .l-header { display: flex; }
}

/* Classes uniquement */
.l-header { }

/* Max 2 niveaux */
.l-header__nav a { }

/* Tokens theme.json */
color: var(--wp--preset--color--violet-500);
padding: var(--wp--preset--spacing--50);
```
