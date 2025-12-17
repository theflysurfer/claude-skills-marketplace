---
name: wp-header-contract
description: This skill enforces header structure, accessibility, and styling rules for clemencefouquet.fr. Use when creating or modifying the site header, navigation, logo, or mobile menu.
allowed-tools: Read, Write, Edit
---

# WordPress Header Contract

## Objectif
Garantir un header accessible, responsive et maintenable avec effet glassmorphisme.

---

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

---

## Classes CSS

### Layout principal
```css
.l-header { }              /* Container principal */
.l-header__skip { }        /* Skip link */
.l-header__logo { }        /* Zone logo */
.l-header__nav { }         /* Navigation desktop */
.l-header__actions { }     /* Zone CTA/recherche */
.l-header__toggle { }      /* Bouton burger */
.l-header__toggle-icon { } /* Icône burger */
```

### États
```css
.l-header.is-scrolled { }  /* Header scrollé (sticky) */
.l-header.is-open { }      /* Menu mobile ouvert */
.l-header__toggle.is-active { } /* Burger actif */
```

### Mobile nav
```css
.l-mobile-nav { }          /* Container menu mobile */
.l-mobile-nav.is-open { }  /* Menu ouvert */
```

---

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

### Layout flex
```css
@layer components {
  .l-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--wp--preset--spacing--40) var(--wp--preset--spacing--50);
    gap: var(--wp--preset--spacing--40);
  }
}
```

### Logo
```css
@layer components {
  .l-header__logo {
    flex-shrink: 0;
  }

  .l-header__logo img {
    width: 200px;
    height: auto;
  }
}
```

### Navigation desktop
```css
@layer components {
  .l-header__nav {
    display: none; /* Mobile first */
  }

  @media (min-width: 768px) {
    .l-header__nav {
      display: flex;
      gap: var(--wp--preset--spacing--40);
    }
  }
}
```

### Bouton burger
```css
@layer components {
  .l-header__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;  /* Touch target minimum */
    height: 44px;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
  }

  @media (min-width: 768px) {
    .l-header__toggle {
      display: none;
    }
  }
}
```

---

## Accessibilité (OBLIGATOIRE)

### Skip link
```css
.l-header__skip {
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: var(--wp--preset--spacing--20) var(--wp--preset--spacing--40);
  background: var(--wp--preset--color--violet-500);
  color: var(--wp--preset--color--white);
}

.l-header__skip:focus {
  left: var(--wp--preset--spacing--40);
  top: var(--wp--preset--spacing--40);
}
```

### Focus visible
```css
.l-header a:focus-visible,
.l-header button:focus-visible {
  outline: 2px solid var(--wp--preset--color--violet-500);
  outline-offset: 2px;
}
```

### Bouton mobile
- `aria-controls="mobile-nav"` : référence l'ID du menu
- `aria-expanded="false/true"` : état ouvert/fermé
- `aria-label` : label accessible

### Navigation
- `aria-label="Navigation principale"` sur `<nav>`
- `aria-current="page"` sur le lien actif

---

## JavaScript requis

### Toggle menu mobile
```javascript
const toggle = document.querySelector('.l-header__toggle');
const mobileNav = document.getElementById('mobile-nav');

toggle.addEventListener('click', () => {
  const isOpen = toggle.getAttribute('aria-expanded') === 'true';

  toggle.setAttribute('aria-expanded', !isOpen);
  toggle.classList.toggle('is-active');
  mobileNav.classList.toggle('is-open');
  mobileNav.setAttribute('aria-hidden', isOpen);

  // Update label
  toggle.setAttribute('aria-label',
    isOpen ? 'Ouvrir le menu' : 'Fermer le menu'
  );
});
```

### Fermer avec Escape
```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
    toggle.click();
  }
});
```

### Header scrolled
```javascript
window.addEventListener('scroll', () => {
  const header = document.querySelector('.l-header');
  header.classList.toggle('is-scrolled', window.scrollY > 50);
});
```

---

## Responsive breakpoints

| Breakpoint | Comportement |
|------------|--------------|
| < 768px | Menu burger, nav cachée |
| ≥ 768px | Nav visible, burger caché |
| ≥ 1024px | Layout étendu |

---

## Touch targets

Tous les éléments interactifs doivent avoir une taille minimale de **44x44px** :
- Bouton burger
- Liens de navigation
- Boutons CTA

```css
.l-header__nav a,
.l-header__toggle,
.l-header__actions button {
  min-width: 44px;
  min-height: 44px;
}
```

---

## Checklist header

### Structure
- [ ] Skip link en premier
- [ ] Logo avec lien vers accueil
- [ ] Nav avec aria-label
- [ ] Bouton burger avec aria-controls et aria-expanded
- [ ] Menu mobile avec id correspondant

### CSS
- [ ] Glassmorphisme avec backdrop-filter
- [ ] Sticky positioning
- [ ] Z-index approprié
- [ ] Responsive (mobile first)
- [ ] Touch targets 44x44px

### Accessibilité
- [ ] Focus visible sur tous les liens
- [ ] Skip link fonctionnel
- [ ] aria-expanded toggle correctement
- [ ] Fermeture avec Escape
- [ ] Contraste suffisant

### JavaScript
- [ ] Toggle menu fonctionne
- [ ] États aria mis à jour
- [ ] Classe is-scrolled ajoutée au scroll
- [ ] Pas d'erreurs console

---

## Anti-patterns à éviter

### ❌ Ne pas faire
```css
/* Trop spécifique */
header.site-header .main-nav ul li a { }

/* !important */
.header { display: flex !important; }

/* ID selector */
#main-header { }

/* Position absolute pour layout */
.nav { position: absolute; right: 0; }
```

### ✅ Faire
```css
/* Spécificité correcte */
.l-header__nav a { }

/* Layer approprié */
@layer components {
  .l-header { display: flex; }
}

/* Classes uniquement */
.l-header { }

/* Flex/Grid pour layout */
.l-header { display: flex; justify-content: space-between; }
```

---

## Fichiers concernés

- `assets/css/header-modern.css` - Styles principaux
- `parts/header.html` - Template part FSE
- `patterns/header-modern.php` - Pattern (si utilisé)
- `assets/js/header-modern.js` - JavaScript
