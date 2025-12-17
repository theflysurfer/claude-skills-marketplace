# Exemples Complets de Patterns

## Hero Simple

```php
<?php
/**
 * Title: Hero Simple
 * Slug: clemence/hero-simple
 * Categories: clemence-heroes
 * Keywords: hero, banner, simple
 */
?>

<!-- wp:cover {"overlayColor":"violet-500","minHeight":500,"align":"full"} -->
<div class="wp-block-cover alignfull">
  <span aria-hidden="true" class="wp-block-cover__background has-violet-500-background-color"></span>
  <div class="wp-block-cover__inner-container">
    <!-- wp:heading {"textAlign":"center","level":1,"textColor":"white"} -->
    <h1 class="wp-block-heading has-text-align-center has-white-color has-text-color">Titre</h1>
    <!-- /wp:heading -->
  </div>
</div>
<!-- /wp:cover -->
```

---

## Hero Violet Organique (complet)

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

    <!-- wp:group {"layout":{"type":"constrained","contentSize":"800px"}} -->
    <div class="wp-block-group">

      <!-- wp:heading {"level":1,"textColor":"white","fontSize":"xx-large"} -->
      <h1 class="wp-block-heading has-white-color has-text-color has-xx-large-font-size">
        Titre du Hero
      </h1>
      <!-- /wp:heading -->

      <!-- wp:paragraph {"textColor":"beige-100","fontSize":"large"} -->
      <p class="has-beige-100-color has-text-color has-large-font-size">
        Description du hero avec texte d'accroche.
      </p>
      <!-- /wp:paragraph -->

      <!-- wp:buttons -->
      <div class="wp-block-buttons">
        <!-- wp:button {"backgroundColor":"orange-500","textColor":"white"} -->
        <div class="wp-block-button">
          <a class="wp-block-button__link has-white-color has-orange-500-background-color has-text-color has-background wp-element-button">
            Découvrir
          </a>
        </div>
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

## Services 3 Colonnes

```php
<?php
/**
 * Title: Services 3 Colonnes
 * Slug: clemence/services-3-col
 * Categories: clemence-sections
 * Keywords: services, grille, colonnes
 */
?>

<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70"}}}} -->
<div class="wp-block-group alignwide">

  <!-- wp:heading {"textAlign":"center"} -->
  <h2 class="wp-block-heading has-text-align-center">Nos Services</h2>
  <!-- /wp:heading -->

  <!-- wp:columns {"isStackedOnMobile":true} -->
  <div class="wp-block-columns is-stacked-on-mobile">

    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":3} -->
      <h3 class="wp-block-heading">Service 1</h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph -->
      <p>Description du service.</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->

    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":3} -->
      <h3 class="wp-block-heading">Service 2</h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph -->
      <p>Description du service.</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->

    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":3} -->
      <h3 class="wp-block-heading">Service 3</h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph -->
      <p>Description du service.</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->

  </div>
  <!-- /wp:columns -->

</div>
<!-- /wp:group -->
```

---

## CTA Section

```php
<?php
/**
 * Title: CTA Section
 * Slug: clemence/cta-section
 * Categories: clemence-sections, call-to-action
 * Keywords: cta, call to action, bouton
 */
?>

<!-- wp:group {"backgroundColor":"beige-100","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group has-beige-100-background-color has-background">

  <!-- wp:heading {"textAlign":"center","textColor":"violet-500"} -->
  <h2 class="wp-block-heading has-text-align-center has-violet-500-color has-text-color">
    Prêt à démarrer ?
  </h2>
  <!-- /wp:heading -->

  <!-- wp:paragraph {"align":"center"} -->
  <p class="has-text-align-center">
    Contactez-nous pour discuter de votre projet.
  </p>
  <!-- /wp:paragraph -->

  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button {"backgroundColor":"orange-500"} -->
    <div class="wp-block-button">
      <a class="wp-block-button__link has-orange-500-background-color has-background wp-element-button">
        Contactez-nous
      </a>
    </div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->

</div>
<!-- /wp:group -->
```

---

## Template de spécification

Utiliser ce format pour documenter chaque pattern :

```yaml
Pattern: [Nom]
Usage: [Description courte]

Catégories: clemence-sections, clemence-heroes
Keywords: mot1, mot2, mot3

Blocs utilisés:
  - core/cover
  - core/group
  - core/heading
  - core/paragraph
  - core/buttons

Slots:
  - Titre (h1): Texte principal
  - Description (p): 1-2 phrases
  - CTA (button): Texte + URL

Presets utilisés:
  - Colors: violet-500, orange-500, white, beige-100
  - Spacing: 60, 70, 80
  - Font sizes: large, x-large, xx-large

Responsive:
  - Desktop: Layout normal
  - Tablet: Colonnes 2x2
  - Mobile: Stack vertical

Fichier: patterns/[slug].php
```
