# Checklists de développement

Checklists pour valider les composants WordPress du thème clemencefouquet.fr.

## Checklist Bloc Gutenberg

### Structure
- [ ] `block.json` complet avec tous les champs requis
- [ ] Attributs typés avec défauts
- [ ] `supports` configurés
- [ ] `textdomain` défini (`clemence-fouquet`)

### CSS
- [ ] Utilise tokens theme.json (voir [tokens.md](tokens.md))
- [ ] Nommage BEM (.c-block, .c-block__element)
- [ ] Pas de !important
- [ ] Focus visible sur éléments interactifs
- [ ] Taille < 8 KB

### PHP
- [ ] Tous les outputs échappés (`esc_html`, `esc_attr`, `esc_url`)
- [ ] `get_block_wrapper_attributes()` utilisé
- [ ] Attributs vérifiés avant usage
- [ ] Traductions avec textdomain

### JavaScript
- [ ] Imports propres (@wordpress/*)
- [ ] InspectorControls pour sidebar
- [ ] useBlockProps utilisé
- [ ] Pas de console.log

### Accessibilité
- [ ] Alt text sur images
- [ ] Hiérarchie headings respectée (h2 > h3 > h4)
- [ ] Liens descriptifs avec aria-label si nécessaire
- [ ] Focus states visibles
- [ ] Contraste suffisant (4.5:1)

---

## Checklist Pattern

### Header
- [ ] Title descriptif
- [ ] Slug unique avec namespace (`clemence/...`)
- [ ] Categories appropriées
- [ ] Keywords pour recherche

### Composition
- [ ] Uniquement blocs existants (core ou custom)
- [ ] Pas de HTML brut
- [ ] Pas de classes CSS custom
- [ ] Utilise presets theme.json

### Responsive
- [ ] Stack on mobile pour colonnes (`isStackedOnMobile: true`)
- [ ] Alignements appropriés (`wide`, `full`)
- [ ] Testé sur mobile/tablet/desktop

### Contenu
- [ ] Slots de contenu clairement définis
- [ ] Textes placeholder descriptifs
- [ ] Hiérarchie headings respectée

---

## Checklist Header

### Structure
- [ ] Skip link en premier élément
- [ ] Logo avec lien vers accueil
- [ ] Nav avec `aria-label="Navigation principale"`
- [ ] Bouton burger avec `aria-controls` et `aria-expanded`
- [ ] Menu mobile avec id correspondant

### CSS
- [ ] Glassmorphisme avec `backdrop-filter`
- [ ] Sticky positioning
- [ ] Z-index approprié (100+)
- [ ] Responsive (mobile first)
- [ ] Touch targets 44x44px minimum

### Accessibilité
- [ ] Focus visible sur tous les liens
- [ ] Skip link fonctionnel
- [ ] `aria-expanded` toggle correctement
- [ ] Fermeture avec Escape
- [ ] Contraste suffisant

### JavaScript
- [ ] Toggle menu fonctionne
- [ ] États aria mis à jour dynamiquement
- [ ] Classe `is-scrolled` ajoutée au scroll
- [ ] Pas d'erreurs console

---

## Checklist Footer

### Structure
- [ ] Séparateur wave (optionnel)
- [ ] Grid 2-4 colonnes responsive
- [ ] Titres de section en h2
- [ ] Navigation avec `aria-label`
- [ ] Section contact avec `<address>`
- [ ] Liens sociaux avec `aria-label`
- [ ] Barre légale séparée

### CSS
- [ ] Fond `violet-700`
- [ ] Texte `white` ou `beige-100`
- [ ] Grid responsive (1→2→4 colonnes)
- [ ] Taille police >= 14px
- [ ] Focus visible sur liens

### Accessibilité
- [ ] Contraste AA validé
- [ ] `aria-label` unique sur chaque nav
- [ ] `aria-label` sur icônes sociales
- [ ] `<address>` pour infos contact
- [ ] Liens descriptifs

### Contenu
- [ ] Copyright avec année courante
- [ ] Lien mentions légales
- [ ] Email de contact fonctionnel
- [ ] Liens sociaux fonctionnels
