# Theme.json Tokens - clemencefouquet.fr

Tokens disponibles dans theme.json pour le thème Clémence Fouquet.

## Couleurs

```css
/* Violet - Couleur principale */
var(--wp--preset--color--violet-500)    /* #5b2e7f */
var(--wp--preset--color--violet-700)    /* #3a1e54 */

/* Orange - Accent */
var(--wp--preset--color--orange-500)    /* #f89420 */
var(--wp--preset--color--orange-600)    /* #d67b0a */

/* Autres */
var(--wp--preset--color--turquoise-400) /* #51c4b5 */
var(--wp--preset--color--beige-100)     /* #fdf1dd */
var(--wp--preset--color--white)         /* #ffffff */
var(--wp--preset--color--gray-700)      /* #44403c */
var(--wp--preset--color--gray-900)      /* #1c1917 */
```

## Typographie

### Familles
```css
var(--wp--preset--font-family--fraunces)  /* Titres */
var(--wp--preset--font-family--inter)     /* Corps */
```

### Tailles
```css
var(--wp--preset--font-size--xs)          /* 0.618rem */
var(--wp--preset--font-size--small)       /* 0.75rem */
var(--wp--preset--font-size--base)        /* 1rem */
var(--wp--preset--font-size--medium)      /* 1.125rem */
var(--wp--preset--font-size--large)       /* 1.618rem */
var(--wp--preset--font-size--x-large)     /* 2.618rem */
var(--wp--preset--font-size--xx-large)    /* 4.236rem */
```

## Espacements

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

## Convention de nommage BEM

| Préfixe | Usage | Exemple |
|---------|-------|---------|
| `.l-` | Layout (header, footer) | `.l-header`, `.l-footer` |
| `.c-` | Component (card, button) | `.c-card`, `.c-modal` |
| `.u-` | Utility (hidden, flex) | `.u-hidden`, `.u-flex` |
| `.is-` | État | `.is-open`, `.is-active` |
| `.has-` | Présence | `.has-icon`, `.has-submenu` |

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
