---
name: wp-remote-architecture
description: This skill describes the remote WordPress site structure, page hierarchy, templates, and global configuration. Use when referencing site architecture, page structure, or templates on production.
allowed-tools: Bash, Read, Grep
---

# WordPress Site Architecture

## Objectif
Gérer la structure globale du site clemencefouquet.fr : pages, templates, navigation et configuration theme.json.

---

## Structure des pages

### Pages actuelles

| Page | Slug | Template | Status |
|------|------|----------|--------|
| Accueil | `/` | `page-accueil.html` | ✅ Publiée |
| Services | `/services` | `page.html` | ✅ Publiée |
| À propos | `/a-propos` | `page.html` | ✅ Publiée |
| Projets engagés | `/projets-engages` | `page.html` | ✅ Publiée |
| Contact | `/contact` | `page.html` | ✅ Publiée |
| Mentions légales | `/mentions-legales` | `page.html` | ✅ Publiée |

### Créer une nouvelle page

```bash
# Via WP-CLI
ssh srv759970 "docker exec wordpress-clemence wp post create \
  --post_type=page \
  --post_title='Nouvelle Page' \
  --post_status=publish \
  --post_name='nouvelle-page' \
  --allow-root"
```

### Assigner un template

```bash
# Assigner un template FSE à une page
ssh srv759970 "docker exec wordpress-clemence wp post meta update <ID> _wp_page_template 'page-accueil' --allow-root"
```

---

## Templates FSE

### Structure des templates

```
templates/
├── index.html          # Template par défaut (obligatoire)
├── page.html           # Pages standard
├── page-accueil.html   # Page d'accueil custom
├── single.html         # Articles
└── home.html           # Blog index
```

### Template parts

```
parts/
├── header.html         # Header global
└── footer.html         # Footer global
```

### Anatomie d'un template

```html
<!-- templates/page.html -->
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">

  <!-- wp:post-title {"level":1} /-->
  <!-- wp:post-content {"layout":{"type":"constrained"}} /-->

</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
```

---

## Navigation et menus

### Menus enregistrés

```php
// Dans functions.php
register_nav_menus([
  'primary' => 'Navigation principale',
  'footer'  => 'Navigation footer',
  'legal'   => 'Liens légaux'
]);
```

### Structure du menu principal

```
Navigation principale
├── Accueil
├── Services
├── À propos
├── Projets engagés
└── Contact
```

### Gérer les menus via WP-CLI

```bash
# Lister les menus
ssh srv759970 "docker exec wordpress-clemence wp menu list --allow-root"

# Voir les items d'un menu
ssh srv759970 "docker exec wordpress-clemence wp menu item list primary --allow-root"

# Ajouter un item
ssh srv759970 "docker exec wordpress-clemence wp menu item add-post primary <post_id> --allow-root"
```

---

## Configuration theme.json

### Structure

```json
{
  "$schema": "https://schemas.wp.org/trunk/theme.json",
  "version": 2,
  "settings": {
    "color": { },
    "typography": { },
    "spacing": { },
    "layout": { }
  },
  "styles": {
    "color": { },
    "typography": { },
    "spacing": { },
    "elements": { }
  },
  "templateParts": [ ],
  "customTemplates": [ ]
}
```

### Settings importants

```json
{
  "settings": {
    "layout": {
      "contentSize": "62ch",
      "wideSize": "1440px"
    },
    "spacing": {
      "units": ["px", "rem", "vh"]
    },
    "typography": {
      "fluid": true
    }
  }
}
```

### Déclarer les templates custom

```json
{
  "customTemplates": [
    {
      "name": "page-accueil",
      "title": "Page d'accueil",
      "postTypes": ["page"]
    }
  ],
  "templateParts": [
    {
      "name": "header",
      "title": "Header",
      "area": "header"
    },
    {
      "name": "footer",
      "title": "Footer",
      "area": "footer"
    }
  ]
}
```

---

## Patterns Gutenberg

### Patterns disponibles

```
patterns/
├── header-modern.php        # Header glassmorphisme
├── footer-modern.php        # Footer avec wave
├── hero-violet-organic.php  # Hero section
├── service-cards-3-col.php  # Grille services
└── vision-section.php       # Section vision/mission
```

### Enregistrer une catégorie de patterns

```php
// Dans functions.php
register_block_pattern_category('clemence-sections', [
  'label' => 'Clémence - Sections'
]);

register_block_pattern_category('clemence-pages', [
  'label' => 'Clémence - Pages'
]);
```

### Structure d'un pattern

```php
<?php
/**
 * Title: Hero Violet Organique
 * Slug: clemence/hero-violet-organic
 * Categories: clemence-sections
 * Keywords: hero, banner, organic
 */
?>

<!-- wp:cover {"overlayColor":"violet-500"} -->
<div class="wp-block-cover">
  <!-- Contenu du pattern -->
</div>
<!-- /wp:cover -->
```

---

## Commandes WP-CLI essentielles

### Pages

```bash
# Lister les pages
wp post list --post_type=page --fields=ID,post_title,post_name,post_status

# Créer une page
wp post create --post_type=page --post_title="Titre" --post_status=publish

# Supprimer une page
wp post delete <ID> --force

# Mettre à jour le contenu
wp post update <ID> --post_content="$(cat content.html)"
```

### Menus

```bash
# Créer un menu
wp menu create "Navigation principale"

# Assigner un emplacement
wp menu location assign primary primary

# Ajouter des items
wp menu item add-post primary <page_id>
wp menu item add-custom primary "Contact" "https://clemencefouquet.fr/contact"
```

### Options

```bash
# Page d'accueil statique
wp option update show_on_front page
wp option update page_on_front <ID>

# Permalinks
wp rewrite structure '/%postname%/'
wp rewrite flush
```

### Export/Import

```bash
# Export
wp export --post_type=page --dir=/tmp/

# Import
wp import /tmp/export.xml --authors=create
```

---

## Homepage configuration

### Définir une page d'accueil statique

```bash
# 1. Créer ou identifier la page d'accueil
PAGE_ID=$(ssh srv759970 "docker exec wordpress-clemence wp post list --post_type=page --name=accueil --field=ID --allow-root")

# 2. Configurer en page d'accueil
ssh srv759970 "docker exec wordpress-clemence wp option update show_on_front page --allow-root"
ssh srv759970 "docker exec wordpress-clemence wp option update page_on_front $PAGE_ID --allow-root"
```

### Vérifier la configuration

```bash
ssh srv759970 "docker exec wordpress-clemence wp option get show_on_front --allow-root"
ssh srv759970 "docker exec wordpress-clemence wp option get page_on_front --allow-root"
```

---

## SEO et metadata

### Title et description

Utiliser le bloc `core/post-title` et configurer via Yoast/RankMath ou manuellement :

```bash
# Mettre à jour le titre SEO
wp post meta update <ID> _yoast_wpseo_title "Titre SEO | Clémence Fouquet"
wp post meta update <ID> _yoast_wpseo_metadesc "Description de la page..."
```

### Canonical URL

```bash
wp option update siteurl "https://clemencefouquet.fr"
wp option update home "https://clemencefouquet.fr"
```

---

## Checklist nouvelle page

### Création
- [ ] Slug cohérent et en français
- [ ] Template approprié assigné
- [ ] Contenu structuré (headings, paragraphs)
- [ ] Images optimisées avec alt text

### Navigation
- [ ] Ajoutée au menu principal (si pertinent)
- [ ] Ajoutée au footer (si pertinent)
- [ ] Breadcrumb fonctionnel

### SEO
- [ ] Title unique
- [ ] Meta description
- [ ] URL propre

### Accessibilité
- [ ] Hiérarchie des headings (h1 > h2 > h3)
- [ ] Alt text sur toutes les images
- [ ] Liens descriptifs

---

## Structure de fichiers recommandée

```
wordpress/clemence-theme/
├── style.css                 # Metadata thème
├── functions.php             # Enqueues, supports
├── theme.json                # Design system
├── editor-styles.css         # Styles éditeur
│
├── assets/
│   ├── css/                  # Stylesheets
│   ├── js/                   # Scripts
│   └── svg/                  # Icons, shapes
│
├── templates/                # Templates FSE
│   ├── index.html
│   ├── page.html
│   └── page-accueil.html
│
├── parts/                    # Template parts
│   ├── header.html
│   └── footer.html
│
└── patterns/                 # Block patterns
    ├── hero-violet-organic.php
    └── service-cards-3-col.php
```

---

## Bonnes pratiques

### Templates
- Un template = une structure de page
- Pas de contenu hardcodé dans les templates
- Utiliser les template parts pour header/footer

### Patterns
- Réutilisables et modulaires
- Catégorisés correctement
- Documentés avec Title, Slug, Categories, Keywords

### Navigation
- Maximum 7 items dans le menu principal
- Hiérarchie claire (pas plus de 2 niveaux)
- Labels courts et descriptifs

### theme.json
- Source unique pour les tokens
- Pas de CSS inline dans theme.json
- Versionner les changements
