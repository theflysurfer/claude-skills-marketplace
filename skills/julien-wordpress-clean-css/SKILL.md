---
name: wp-clean-css
description: This skill enforces CSS architecture with @layer, prohibits !important, and validates theme.json token usage. Use when writing, reviewing, or modifying any CSS file in the WordPress theme.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# WordPress Clean CSS Architecture

## Objectif
Garantir un CSS maintenable, performant et accessible pour le thème WordPress clemencefouquet.fr.

---

## Règles NON NÉGOCIABLES

### 1. Interdiction de `!important`

**JAMAIS de `!important`** sauf cas documenté de plugin legacy.

```css
/* ❌ INTERDIT */
.header { color: red !important; }

/* ✅ CORRECT - Augmenter la spécificité */
.l-header .l-header__title { color: red; }

/* ✅ CORRECT - Utiliser @layer */
@layer utilities {
  .u-text-red { color: red; }
}
```

### 2. Spécificité maximale : 2 niveaux

```css
/* ❌ INTERDIT - 4 niveaux */
.site-header .nav-menu .menu-item .menu-link { }

/* ✅ CORRECT - 2 niveaux */
.l-header__nav .menu-link { }
```

### 3. Tokens theme.json obligatoires

Utilise TOUJOURS les variables CSS générées par theme.json :

```css
/* ❌ INTERDIT - Valeurs hardcodées */
color: #5b2e7f;
font-size: 16px;
padding: 24px;

/* ✅ CORRECT - Tokens theme.json */
color: var(--wp--preset--color--violet-500);
font-size: var(--wp--preset--font-size--base);
padding: var(--wp--preset--spacing--50);
```

### 4. Pas de sélecteurs d'ID

```css
/* ❌ INTERDIT */
#header { }
#main-nav { }

/* ✅ CORRECT */
.l-header { }
.l-header__nav { }
```

---

## Architecture CSS en Layers

### Ordre des layers (du moins au plus spécifique)

```css
@layer reset, base, blocks, components, utilities;
```

| Layer | Contenu | Exemple |
|-------|---------|---------|
| `reset` | Reset CSS, box-sizing | `*, *::before, *::after { box-sizing: border-box; }` |
| `base` | Styles éléments HTML | `body { line-height: 1.5; }` |
| `blocks` | Blocs Gutenberg custom | `.wp-block-hero { }` |
| `components` | Composants UI | `.l-header { }`, `.c-card { }` |
| `utilities` | Classes utilitaires | `.u-hidden { display: none; }` |

---

## ⚠️ CRITIQUE : Overrides WordPress

### Le problème des @layer

**CSS hors @layer bat TOUJOURS CSS dans @layer**, peu importe l'ordre des layers.

WordPress génère du CSS **sans @layer** (pour `.is-layout-constrained`, `.alignfull`, etc.), donc nos styles dans `@layer` perdent automatiquement.

### Solution : Overrides HORS @layer

```css
/* ============================================
   WORDPRESS OVERRIDES - HORS @layer
   Haute spécificité pour battre WordPress
   ============================================ */

/* Header full-width */
body header.wp-block-group.site-header,
html body .site-header {
  width: 100vw;
  max-width: 100vw;
  /* PAS de !important - la spécificité suffit */
}

/* Alignfull */
body .alignfull,
body .wp-block-group.alignfull,
html body .alignfull {
  max-width: none;
  width: 100vw;
  margin-left: calc(50% - 50vw);
}

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  html body *,
  html body *::before,
  html body *::after {
    animation-duration: 0.01ms;
    transition-duration: 0.01ms;
  }
}

/* ============================================
   NOS STYLES CUSTOM - DANS @layer
   ============================================ */

@layer components {
  .l-header {
    /* Nos styles custom */
  }
}
```

### Priorité d'enqueue

Charger **APRÈS** WordPress (priorité par défaut = 10) :

```php
// Dans functions.php - priorité 20 pour gagner
add_action('wp_enqueue_scripts', 'clemence_enqueue_assets', 20);
```

### Patterns de spécificité

| Besoin | Sélecteur | Spécificité |
|--------|-----------|-------------|
| Override simple | `body .selector` | 0-1-1 |
| Override fort | `html body .selector` | 0-1-2 |
| Override très fort | `body .parent .selector` | 0-2-1 |

### Règle d'or

> **Overrides WordPress = HORS @layer + haute spécificité**
> **Styles custom = DANS @layer + nommage BEM**

### Exemple de structure

```css
@layer reset, base, blocks, components, utilities;

@layer reset {
  *, *::before, *::after {
    box-sizing: border-box;
  }
}

@layer base {
  body {
    font-family: var(--wp--preset--font-family--inter);
    line-height: 1.5;
  }
}

@layer blocks {
  .wp-block-clemence-hero {
    padding: var(--wp--preset--spacing--70);
  }
}

@layer components {
  .l-header {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
  }
}

@layer utilities {
  .u-visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    clip: rect(0, 0, 0, 0);
  }
}
```

---

## Convention de nommage

### Préfixes obligatoires

| Préfixe | Usage | Exemple |
|---------|-------|---------|
| `.l-` | Layout (header, footer, grid) | `.l-header`, `.l-footer` |
| `.c-` | Component (card, button, modal) | `.c-card`, `.c-modal` |
| `.u-` | Utility (hidden, flex, text) | `.u-hidden`, `.u-flex` |
| `.is-` | État | `.is-open`, `.is-active` |
| `.has-` | Présence d'élément | `.has-icon`, `.has-submenu` |

### BEM simplifié

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

## Tokens theme.json disponibles

### Couleurs
```css
var(--wp--preset--color--violet-500)    /* #5b2e7f */
var(--wp--preset--color--violet-700)    /* #3a1e54 */
var(--wp--preset--color--orange-500)    /* #f89420 */
var(--wp--preset--color--orange-600)    /* #d67b0a */
var(--wp--preset--color--turquoise-400) /* #51c4b5 */
var(--wp--preset--color--beige-100)     /* #fdf1dd */
var(--wp--preset--color--white)         /* #ffffff */
var(--wp--preset--color--gray-700)      /* #44403c */
var(--wp--preset--color--gray-900)      /* #1c1917 */
```

### Typographie
```css
var(--wp--preset--font-family--fraunces)  /* Titres */
var(--wp--preset--font-family--inter)     /* Corps */

var(--wp--preset--font-size--xs)          /* 0.618rem */
var(--wp--preset--font-size--small)       /* 0.75rem */
var(--wp--preset--font-size--base)        /* 1rem */
var(--wp--preset--font-size--medium)      /* 1.125rem */
var(--wp--preset--font-size--large)       /* 1.618rem */
var(--wp--preset--font-size--x-large)     /* 2.618rem */
var(--wp--preset--font-size--xx-large)    /* 4.236rem */
```

### Espacements
```css
var(--wp--preset--spacing--10)  /* 4px */
var(--wp--preset--spacing--20)  /* 8px */
var(--wp--preset--spacing--30)  /* 12px */
var(--wp--preset--spacing--40)  /* 16px */
var(--wp--preset--spacing--50)  /* 24px */
var(--wp--preset--spacing--60)  /* 32px */
var(--wp--preset--spacing--70)  /* 48px */
var(--wp--preset--spacing--80)  /* 64px */
var(--wp--preset--spacing--90)  /* 80px */
```

---

## Structure des fichiers CSS

### Organisation cible (migration en cours)

```
assets/css/
├── 01-reset.css         (@layer reset)
├── 02-base.css          (@layer base)
├── 03-blocks.css        (@layer blocks)
├── 04-components.css    (@layer components)
└── 05-utilities.css     (@layer utilities)
```

### Organisation actuelle (legacy)

Les fichiers actuels seront progressivement migrés vers la structure en layers.

---

## Checklist avant commit CSS

> Voir `../wp-checklists.md` pour la checklist complète

- [ ] Aucun `!important`
- [ ] Spécificité max 2 niveaux
- [ ] Tokens theme.json (voir `../wp-tokens.md`)
- [ ] Préfixes corrects (.l-, .c-, .u-)
- [ ] Layer approprié déclaré
- [ ] Responsive testé

**Accessibilité** : voir `../wp-checklists.md#accessibilité-checklist-wcag-aa`

---

## Commandes utiles

### Détecter les !important
```bash
grep -rn '!important' assets/css/
```

### Compter les couleurs hardcodées
```bash
grep -oE '#[0-9a-fA-F]{3,6}' assets/css/*.css | wc -l
```

### Vérifier la taille totale CSS
```bash
wc -c assets/css/*.css | tail -1
```

---

## Exceptions documentées

Si tu dois utiliser `!important` pour un cas legacy, documente-le :

```css
/*
 * EXCEPTION: !important requis pour override plugin XYZ
 * Ticket: #123
 * À supprimer quand plugin mis à jour
 */
.plugin-xyz-element {
  color: var(--wp--preset--color--gray-900) !important;
}
```
