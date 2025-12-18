# Exemples de code

Exemples complets pour le développement WordPress clemencefouquet.fr.

## Block - Structure complète

### block.json

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "clemence/card",
  "title": "Carte",
  "category": "clemence-blocks",
  "textdomain": "clemence-fouquet",
  "attributes": {
    "title": { "type": "string", "default": "" },
    "variant": { "type": "string", "enum": ["default", "featured"], "default": "default" }
  },
  "supports": {
    "html": false,
    "align": ["wide", "full"]
  },
  "editorScript": "file:./index.js",
  "editorStyle": "file:./editor.css",
  "style": "file:./style.css",
  "render": "file:./render.php"
}
```

### render.php

```php
<?php
$title = $attributes['title'] ?? '';
$variant = $attributes['variant'] ?? 'default';
$class = 'c-card c-card--' . esc_attr($variant);
?>

<div <?php echo get_block_wrapper_attributes(['class' => $class]); ?>>
  <?php if ($title) : ?>
    <h3 class="c-card__title"><?php echo esc_html($title); ?></h3>
  <?php endif; ?>

  <?php echo $content; ?>
</div>
```

### edit.js

```javascript
import { __ } from '@wordpress/i18n';
import { useBlockProps, RichText, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';

export default function Edit({ attributes, setAttributes }) {
  const { title, variant } = attributes;
  const blockProps = useBlockProps({
    className: `c-card c-card--${variant}`
  });

  return (
    <>
      <InspectorControls>
        <PanelBody title={__('Paramètres', 'clemence-fouquet')}>
          <SelectControl
            label={__('Variante', 'clemence-fouquet')}
            value={variant}
            options={[
              { label: 'Par défaut', value: 'default' },
              { label: 'Mis en avant', value: 'featured' }
            ]}
            onChange={(value) => setAttributes({ variant: value })}
          />
        </PanelBody>
      </InspectorControls>

      <div {...blockProps}>
        <RichText
          tagName="h3"
          className="c-card__title"
          value={title}
          onChange={(value) => setAttributes({ title: value })}
          placeholder={__('Titre...', 'clemence-fouquet')}
        />
      </div>
    </>
  );
}
```

### style.css

```css
.c-card {
  background: var(--wp--preset--color--white);
  padding: var(--wp--preset--spacing--50);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.c-card__title {
  font-family: var(--wp--preset--font-family--fraunces);
  font-size: var(--wp--preset--font-size--large);
  color: var(--wp--preset--color--violet-500);
  margin-bottom: var(--wp--preset--spacing--30);
}

.c-card--featured {
  background: var(--wp--preset--color--beige-100);
  border-left: 4px solid var(--wp--preset--color--orange-500);
}

.c-card a:focus-visible {
  outline: 2px solid var(--wp--preset--color--violet-500);
  outline-offset: 2px;
}
```

---

## Pattern - Exemple complet

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
<div class="wp-block-cover alignfull" style="min-height:600px">
  <span aria-hidden="true" class="wp-block-cover__background has-violet-500-background-color has-background-dim-100 has-background-dim"></span>

  <div class="wp-block-cover__inner-container">
    <!-- wp:group {"layout":{"type":"constrained"}} -->
    <div class="wp-block-group">

      <!-- wp:heading {"level":1,"textColor":"white","fontSize":"xx-large"} -->
      <h1 class="wp-block-heading has-white-color has-text-color has-xx-large-font-size">Titre principal</h1>
      <!-- /wp:heading -->

      <!-- wp:paragraph {"textColor":"beige-100","fontSize":"large"} -->
      <p class="has-beige-100-color has-text-color has-large-font-size">Description d'accroche qui sera remplacée.</p>
      <!-- /wp:paragraph -->

      <!-- wp:buttons -->
      <div class="wp-block-buttons">
        <!-- wp:button {"backgroundColor":"orange-500","textColor":"white"} -->
        <div class="wp-block-button"><a class="wp-block-button__link has-white-color has-orange-500-background-color has-text-color has-background wp-element-button">En savoir plus</a></div>
        <!-- /wp:button -->
      </div>
      <!-- /wp:buttons -->

    </div>
    <!-- /wp:group -->
  </div>
</div>
<!-- /wp:cover -->
```

---

## Header - JavaScript complet

```javascript
// header-modern.js

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.l-header__toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const header = document.querySelector('.l-header');

  if (!toggle || !mobileNav) return;

  // Toggle menu mobile
  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';

    toggle.setAttribute('aria-expanded', !isOpen);
    toggle.setAttribute('aria-label', isOpen ? 'Ouvrir le menu' : 'Fermer le menu');
    toggle.classList.toggle('is-active');

    mobileNav.classList.toggle('is-open');
    mobileNav.setAttribute('aria-hidden', isOpen);

    // Bloquer le scroll du body
    document.body.classList.toggle('is-menu-open');
  });

  // Fermer avec Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
      toggle.click();
    }
  });

  // Header scrolled
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    header.classList.toggle('is-scrolled', currentScroll > 50);

    // Hide on scroll down, show on scroll up
    if (currentScroll > lastScroll && currentScroll > 200) {
      header.classList.add('is-hidden');
    } else {
      header.classList.remove('is-hidden');
    }

    lastScroll = currentScroll;
  });

  // Focus trap dans menu mobile
  const focusableElements = mobileNav.querySelectorAll(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  mobileNav.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey && document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  });
});
```

---

## Footer - CSS complet

```css
@layer components {
  .l-footer {
    background: var(--wp--preset--color--violet-700);
    color: var(--wp--preset--color--white);
    padding: var(--wp--preset--spacing--70) 0;
  }

  .l-footer__wave {
    position: relative;
    margin-top: -1px;
  }

  .l-footer__wave svg {
    display: block;
    width: 100%;
    height: auto;
    fill: var(--wp--preset--color--violet-700);
  }

  .l-footer__grid {
    display: grid;
    gap: var(--wp--preset--spacing--60);
    grid-template-columns: 1fr;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--wp--preset--spacing--50);
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

  .l-footer__heading {
    font-family: var(--wp--preset--font-family--fraunces);
    font-size: var(--wp--preset--font-size--medium);
    font-weight: 600;
    margin-bottom: var(--wp--preset--spacing--30);
  }

  .l-footer a {
    color: var(--wp--preset--color--beige-100);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .l-footer a:hover {
    color: var(--wp--preset--color--orange-500);
  }

  .l-footer a:focus-visible {
    outline: 2px solid var(--wp--preset--color--orange-500);
    outline-offset: 2px;
  }

  .l-footer__nav {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .l-footer__nav li {
    margin-bottom: var(--wp--preset--spacing--20);
  }

  .l-footer__social {
    display: flex;
    gap: var(--wp--preset--spacing--30);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .l-footer__social a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
  }

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

## Enregistrement PHP

```php
// functions.php

function clemence_register_blocks() {
  // Catégorie custom
  add_filter('block_categories_all', function ($categories) {
    return array_merge([
      [
        'slug' => 'clemence-blocks',
        'title' => __('Clémence', 'clemence-fouquet'),
        'icon' => 'star-filled'
      ],
    ], $categories);
  });

  // Enregistrer les blocs
  $blocks = ['card', 'hero', 'testimonial', 'service'];
  foreach ($blocks as $block) {
    register_block_type(get_stylesheet_directory() . '/blocks/' . $block);
  }
}
add_action('init', 'clemence_register_blocks');

// Catégories de patterns
function clemence_register_pattern_categories() {
  register_block_pattern_category('clemence-sections', [
    'label' => __('Clémence - Sections', 'clemence-fouquet'),
  ]);

  register_block_pattern_category('clemence-heroes', [
    'label' => __('Clémence - Heroes', 'clemence-fouquet'),
  ]);
}
add_action('init', 'clemence_register_pattern_categories');
```
