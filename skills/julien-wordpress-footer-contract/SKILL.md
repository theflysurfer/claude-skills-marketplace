---
name: wp-footer-contract
description: This skill enforces footer structure and styling rules for clemencefouquet.fr. Use when creating or modifying the site footer, including links, contact info, and legal mentions.
allowed-tools: Read, Write, Edit
---

# WordPress Footer Contract

## Objectif
Garantir un footer accessible, informatif et visuellement cohérent avec le design organique du site.

---

## Structure HTML obligatoire

```html
<footer class="l-footer">
  <!-- Séparateur organique (optionnel) -->
  <div class="l-footer__wave">
    <svg><!-- Wave SVG --></svg>
  </div>

  <!-- Contenu principal -->
  <div class="l-footer__content">

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
          <ul class="l-footer__nav">
            <li><a href="#">Accueil</a></li>
            <li><a href="#">Services</a></li>
            <!-- ... -->
          </ul>
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
          <li>
            <a href="#" aria-label="LinkedIn">
              <svg><!-- Icon --></svg>
            </a>
          </li>
        </ul>
      </div>

    </div>
  </div>

  <!-- Barre légale -->
  <div class="l-footer__legal">
    <p>&copy; 2025 Clémence Fouquet. Tous droits réservés.</p>
    <nav aria-label="Liens légaux">
      <a href="/mentions-legales">Mentions légales</a>
      <a href="/politique-confidentialite">Politique de confidentialité</a>
    </nav>
  </div>

</footer>
```

---

## Classes CSS

### Layout principal
```css
.l-footer { }              /* Container principal */
.l-footer__wave { }        /* Séparateur SVG */
.l-footer__content { }     /* Zone de contenu */
.l-footer__grid { }        /* Grid des colonnes */
.l-footer__col { }         /* Colonne individuelle */
.l-footer__heading { }     /* Titre de section */
.l-footer__nav { }         /* Liste navigation */
.l-footer__contact { }     /* Infos contact */
.l-footer__social { }      /* Liens sociaux */
.l-footer__legal { }       /* Barre légale */
```

---

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
    .l-footer__grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .l-footer__grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
}
```

### Wave separator
```css
@layer components {
  .l-footer__wave {
    position: relative;
    margin-top: -1px; /* Éviter le gap */
  }

  .l-footer__wave svg {
    display: block;
    width: 100%;
    height: auto;
    fill: var(--wp--preset--color--violet-700);
  }
}
```

### Typographie
```css
@layer components {
  .l-footer__heading {
    font-family: var(--wp--preset--font-family--fraunces);
    font-size: var(--wp--preset--font-size--medium);
    font-weight: 600;
    margin-bottom: var(--wp--preset--spacing--30);
  }

  .l-footer p,
  .l-footer li,
  .l-footer address {
    font-size: var(--wp--preset--font-size--base); /* Minimum 14px */
    line-height: 1.6;
  }
}
```

### Navigation footer
```css
@layer components {
  .l-footer__nav {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .l-footer__nav li {
    margin-bottom: var(--wp--preset--spacing--20);
  }

  .l-footer__nav a {
    text-decoration: none;
    transition: color 0.2s ease;
  }
}
```

### Barre légale
```css
@layer components {
  .l-footer__legal {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--wp--preset--spacing--40);
    padding-top: var(--wp--preset--spacing--50);
    margin-top: var(--wp--preset--spacing--60);
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    font-size: var(--wp--preset--font-size--small);
  }

  .l-footer__legal nav {
    display: flex;
    gap: var(--wp--preset--spacing--40);
  }
}
```

---

## Accessibilité (OBLIGATOIRE)

### Contraste
Le footer utilise un fond violet foncé. Les textes doivent respecter :
- **Texte normal** : ratio ≥ 4.5:1
- **Texte large** : ratio ≥ 3:1

Couleurs validées :
- `white` sur `violet-700` : ✅ OK
- `beige-100` sur `violet-700` : ✅ OK
- `orange-500` sur `violet-700` : ✅ OK (large text)

### Taille de police minimum
```css
/* JAMAIS moins de 14px dans le footer */
.l-footer {
  font-size: max(var(--wp--preset--font-size--base), 14px);
}
```

### Navigation accessible
```html
<!-- Chaque nav a un label unique -->
<nav aria-label="Navigation footer">...</nav>
<nav aria-label="Liens légaux">...</nav>
```

### Liens sociaux
```html
<!-- Toujours un aria-label pour les icônes -->
<a href="#" aria-label="LinkedIn de Clémence Fouquet">
  <svg aria-hidden="true">...</svg>
</a>
```

### Contact
```html
<!-- Utiliser <address> pour les infos de contact -->
<address class="l-footer__contact">
  <a href="mailto:contact@clemencefouquet.fr">
    contact@clemencefouquet.fr
  </a>
</address>
```

### Focus visible
```css
.l-footer a:focus-visible {
  outline: 2px solid var(--wp--preset--color--orange-500);
  outline-offset: 2px;
}
```

---

## Responsive

| Breakpoint | Colonnes | Comportement |
|------------|----------|--------------|
| < 768px | 1 | Stack vertical |
| 768px - 1023px | 2 | 2x2 grid |
| ≥ 1024px | 4 | Ligne complète |

---

## Checklist footer

### Structure
- [ ] Séparateur wave (optionnel)
- [ ] Grid 2-4 colonnes
- [ ] Titres de section en h2
- [ ] Navigation avec aria-label
- [ ] Section contact avec `<address>`
- [ ] Liens sociaux avec aria-label
- [ ] Barre légale séparée

### CSS
- [ ] Fond violet-700
- [ ] Texte blanc/beige
- [ ] Grid responsive
- [ ] Taille police ≥ 14px
- [ ] Focus visible sur liens

### Accessibilité
- [ ] Contraste AA validé
- [ ] aria-label sur chaque nav
- [ ] aria-label sur icônes sociales
- [ ] `<address>` pour contact
- [ ] Liens descriptifs

### Contenu
- [ ] Copyright avec année courante
- [ ] Lien mentions légales
- [ ] Email de contact
- [ ] Liens sociaux fonctionnels

---

## Anti-patterns à éviter

### ❌ Ne pas faire
```css
/* Texte trop petit */
.footer-text { font-size: 10px; }

/* Contraste insuffisant */
.footer { background: #666; color: #888; }

/* Float pour layout */
.footer-col { float: left; width: 25%; }

/* !important */
.footer { padding: 20px !important; }
```

### ✅ Faire
```css
/* Taille minimum */
.l-footer { font-size: var(--wp--preset--font-size--base); }

/* Contraste validé */
.l-footer {
  background: var(--wp--preset--color--violet-700);
  color: var(--wp--preset--color--white);
}

/* Grid moderne */
.l-footer__grid { display: grid; }

/* Sans !important */
@layer components {
  .l-footer { padding: var(--wp--preset--spacing--70); }
}
```

---

## Fichiers concernés

- `assets/css/footer-modern.css` - Styles principaux
- `assets/svg/footer-wave.svg` - Séparateur organique
- `assets/svg/footer-blob.svg` - Forme décorative (optionnel)
- `parts/footer.html` - Template part FSE
- `patterns/footer-modern.php` - Pattern (si utilisé)
- `assets/js/footer-modern.js` - JavaScript (newsletter, accordions)
