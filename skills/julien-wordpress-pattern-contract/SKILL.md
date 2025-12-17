---
name: wp-pattern-contract
description: This skill enforces Gutenberg block pattern development rules. Use when creating or modifying patterns that compose multiple blocks into reusable sections.
allowed-tools: Read, Write, Edit
---

# WordPress Pattern Development Contract

## Objectif
Garantir des patterns Gutenberg réutilisables, modulaires et sans CSS additionnel.

---

## Règle fondamentale

> **Un pattern = une composition de blocs existants**
> **JAMAIS de nouvelles règles CSS dans un pattern**

---

## Structure d'un pattern

### Fichier PHP

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

---

## Header du pattern (OBLIGATOIRE)

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| `Title` | ✅ | Nom affiché dans l'éditeur |
| `Slug` | ✅ | Identifiant unique (namespace/nom) |
| `Categories` | ✅ | Catégories pour le filtrage |
| `Keywords` | Recommandé | Mots-clés pour la recherche |
| `Viewport Width` | Optionnel | Largeur de preview (défaut: 1200) |
| `Block Types` | Optionnel | Types de blocs compatibles |

---

## Catégories

### Custom (functions.php)

```php
register_block_pattern_category('clemence-sections', [
  'label' => __('Clémence - Sections', 'clemence-fouquet'),
]);

register_block_pattern_category('clemence-heroes', [
  'label' => __('Clémence - Heroes', 'clemence-fouquet'),
]);
```

### Standards WordPress

`featured`, `header`, `footer`, `text`, `gallery`, `call-to-action`, `team`, `testimonials`

---

## Règles de composition

### 1. Uniquement blocs existants

```php
// ✅ CORRECT - Blocs core
<!-- wp:heading -->
<!-- wp:paragraph -->
<!-- wp:button -->
<!-- wp:cover -->

// ❌ INTERDIT - HTML custom
<div class="custom-hero">...</div>
```

### 2. Pas de CSS additionnel

```php
// ❌ INTERDIT
<!-- wp:group {"className":"my-custom-section"} -->
// + .my-custom-section { padding: 100px; }

// ✅ CORRECT - Options natives
<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|80"}}}} -->
```

### 3. Utiliser les presets theme.json

```php
// ✅ CORRECT
<!-- wp:heading {"textColor":"violet-500","fontSize":"x-large"} -->
<!-- wp:group {"backgroundColor":"beige-100"} -->
<!-- wp:paragraph {"style":{"spacing":{"padding":{"top":"var:preset|spacing|60"}}}} -->

// ❌ INTERDIT - Valeurs hardcodées
<!-- wp:heading {"style":{"color":{"text":"#5b2e7f"}}} -->
```

> Voir `../wp-tokens.md` pour la liste complète des tokens

### 4. Layouts standards

```php
// Constrained (centré avec max-width)
<!-- wp:group {"layout":{"type":"constrained"}} -->

// Flow (vertical, pleine largeur)
<!-- wp:group {"layout":{"type":"flow"}} -->

// Flex (horizontal)
<!-- wp:group {"layout":{"type":"flex","justifyContent":"space-between"}} -->

// Grid
<!-- wp:columns {"columns":3} -->
```

---

## Responsive

### Colonnes stackées sur mobile

```php
<!-- wp:columns {"isStackedOnMobile":true} -->
```

### Alignements

```php
<!-- wp:group {"align":"wide"} -->
<!-- wp:group {"align":"full"} -->
```

**Éviter les media queries custom** - le pattern doit fonctionner avec le responsive natif de WordPress.

---

## Slots de contenu

### Placeholders clairs

```php
<!-- wp:heading {"level":1} -->
<h1 class="wp-block-heading">Titre principal</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Description d'accroche qui sera remplacée par l'utilisateur.</p>
<!-- /wp:paragraph -->
```

---

## Checklist pattern

### Header
- [ ] Title descriptif
- [ ] Slug unique avec namespace
- [ ] Categories appropriées
- [ ] Keywords pour recherche

### Composition
- [ ] Uniquement blocs existants (core ou custom)
- [ ] Pas de HTML brut
- [ ] Pas de classes CSS custom
- [ ] Utilise presets theme.json (voir `../wp-tokens.md`)

### Responsive
- [ ] Stack on mobile pour colonnes
- [ ] Alignements appropriés
- [ ] Testé sur mobile/tablet/desktop

### Contenu
- [ ] Slots de contenu clairement définis
- [ ] Textes placeholder descriptifs
- [ ] Hiérarchie headings respectée (h2 > h3)

### Accessibilité
- [ ] Headings logiques
- [ ] Textes de boutons descriptifs
- [ ] Contraste couleurs suffisant

---

## Anti-patterns

### ❌ Ne pas faire

```php
// CSS additionnel
<!-- wp:group {"className":"my-pattern-section"} -->

// HTML brut
<section class="hero-section">
  <h1>Titre</h1>
</section>

// Valeurs hardcodées
<!-- wp:group {"style":{"color":{"background":"#5b2e7f"}}} -->

// Styles inline complexes en px
<!-- wp:group {"style":{"spacing":{"padding":{"top":"100px"}}}} -->
```

### ✅ Faire

```php
// Presets couleur
<!-- wp:group {"backgroundColor":"violet-500"} -->

// Variables preset spacing
<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|70"}}}} -->
```

---

## Wrapper optionnel

Si vraiment nécessaire pour un styling contextuel :

1. Classe simple : `.p-hero`, `.p-services`
2. Définie dans `@layer components`
3. Uniquement pour layout global
4. Pas de styles de contenu

```php
<!-- wp:group {"className":"p-hero"} -->
```

```css
@layer components {
  .p-hero { /* Uniquement layout global */ }
}
```

---

## Références

- `references/examples.md` - Exemples complets de patterns
- `../wp-tokens.md` - Tokens theme.json
- `../wp-checklists.md` - Checklists communes
- `../wp-clean-css/SKILL.md` - Architecture CSS
- `../wp-block-contract/SKILL.md` - Si création de blocs custom
