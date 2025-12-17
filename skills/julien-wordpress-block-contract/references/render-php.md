# render.php - Templates

## Structure standard

```php
<?php
/**
 * Card block render
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

// Récupérer les attributs avec défauts
$title       = $attributes['title'] ?? '';
$description = $attributes['description'] ?? '';
$image_id    = $attributes['imageId'] ?? 0;
$link_url    = $attributes['linkUrl'] ?? '';
$variant     = $attributes['variant'] ?? 'default';

// Classes
$classes = [
  'c-card',
  'c-card--' . esc_attr( $variant ),
];

// Block wrapper attributes
$wrapper_attributes = get_block_wrapper_attributes( [
  'class' => implode( ' ', $classes ),
] );
?>

<div <?php echo $wrapper_attributes; ?>>
  <?php if ( $image_id ) : ?>
    <figure class="c-card__figure">
      <?php echo wp_get_attachment_image( $image_id, 'medium', false, [
        'class' => 'c-card__image',
      ] ); ?>
    </figure>
  <?php endif; ?>

  <?php if ( $title ) : ?>
    <h3 class="c-card__title">
      <?php echo esc_html( $title ); ?>
    </h3>
  <?php endif; ?>

  <?php if ( $description ) : ?>
    <p class="c-card__description">
      <?php echo esc_html( $description ); ?>
    </p>
  <?php endif; ?>

  <?php if ( $link_url ) : ?>
    <a href="<?php echo esc_url( $link_url ); ?>" class="c-card__link">
      <?php esc_html_e( 'En savoir plus', 'clemence-fouquet' ); ?>
    </a>
  <?php endif; ?>
</div>
```

---

## Échappement - Guide

| Fonction | Usage | Exemple |
|----------|-------|---------|
| `esc_html()` | Texte affiché | `<?php echo esc_html($title); ?>` |
| `esc_attr()` | Attribut HTML | `<div data-id="<?php echo esc_attr($id); ?>">` |
| `esc_url()` | URL | `<a href="<?php echo esc_url($link); ?>">` |
| `esc_js()` | JavaScript inline | `onclick="alert('<?php echo esc_js($msg); ?>')"` |
| `wp_kses_post()` | HTML limité | `<?php echo wp_kses_post($content); ?>` |

---

## Traductions

```php
// Texte simple
<?php esc_html_e( 'En savoir plus', 'clemence-fouquet' ); ?>

// Avec variable
<?php echo esc_html( sprintf( __( 'Article %d', 'clemence-fouquet' ), $count ) ); ?>

// Pluriel
<?php echo esc_html( sprintf(
  _n( '%d article', '%d articles', $count, 'clemence-fouquet' ),
  $count
) ); ?>
```

---

## Images responsive

```php
<?php
// Avec srcset automatique
echo wp_get_attachment_image( $image_id, 'large', false, [
  'class'   => 'c-card__image',
  'loading' => 'lazy',
  'decoding' => 'async',
] );
?>
```

---

## Lien avec attributs conditionnels

```php
<?php
$link_attrs = [
  'href'  => esc_url( $link_url ),
  'class' => 'c-card__link',
];

if ( $open_new_tab ) {
  $link_attrs['target'] = '_blank';
  $link_attrs['rel']    = 'noopener noreferrer';
}

$link_attrs_string = '';
foreach ( $link_attrs as $key => $value ) {
  $link_attrs_string .= sprintf( ' %s="%s"', esc_attr( $key ), esc_attr( $value ) );
}
?>

<a<?php echo $link_attrs_string; ?>>
  <?php esc_html_e( 'En savoir plus', 'clemence-fouquet' ); ?>
</a>
```
