# Accessibilité Blocs - Guide Détaillé

## Focus visible (OBLIGATOIRE)

```css
.c-card a:focus-visible,
.c-card button:focus-visible {
  outline: 2px solid var(--wp--preset--color--violet-500);
  outline-offset: 2px;
}
```

---

## Images

### Alt text obligatoire

```php
// Récupérer l'alt depuis la médiathèque
$alt = get_post_meta($image_id, '_wp_attachment_image_alt', true);

// Si pas d'alt défini, utiliser le titre
if ( empty( $alt ) ) {
  $alt = get_the_title( $image_id );
}

echo wp_get_attachment_image( $image_id, 'medium', false, [
  'class' => 'c-card__image',
  'alt'   => $alt,
] );
```

### Images décoratives

```php
// aria-hidden pour images décoratives
<img src="<?php echo esc_url($decorative_img); ?>" alt="" aria-hidden="true" />
```

---

## Headings hiérarchiques

### Règles

- Page = 1 seul h1
- Blocs = h2 ou plus
- Ne pas sauter de niveaux (h2 → h4 interdit)
- Respecter la hiérarchie logique

### Vérification

```php
// Dans block.json, utiliser "level" pour personnaliser
"attributes": {
  "headingLevel": {
    "type": "number",
    "default": 2
  }
}
```

```php
// Dans render.php
$tag = 'h' . absint( $heading_level );
?>
<<?php echo $tag; ?> class="c-card__title">
  <?php echo esc_html( $title ); ?>
</<?php echo $tag; ?>>
```

---

## Liens

### Liens descriptifs

```php
// Mauvais
<a href="#">En savoir plus</a>

// Bon
<a href="<?php echo esc_url($url); ?>" aria-label="<?php echo esc_attr($title); ?> - En savoir plus">
  En savoir plus
</a>
```

### Liens externes

```php
<?php if ( $is_external ) : ?>
  <a href="<?php echo esc_url($url); ?>"
     target="_blank"
     rel="noopener noreferrer"
     aria-label="<?php echo esc_attr($title); ?> (s'ouvre dans un nouvel onglet)">
    <?php echo esc_html($title); ?>
    <span class="screen-reader-text">(s'ouvre dans un nouvel onglet)</span>
  </a>
<?php endif; ?>
```

---

## Boutons

### Différencier liens et boutons

```php
// Lien = navigation
<a href="<?php echo esc_url($url); ?>" class="c-card__link">
  Voir le détail
</a>

// Bouton = action
<button type="button" class="c-card__action" onclick="toggleDetails()">
  Afficher plus
</button>
```

### Bouton avec état

```php
<button
  type="button"
  aria-expanded="<?php echo $is_expanded ? 'true' : 'false'; ?>"
  aria-controls="details-<?php echo esc_attr($id); ?>">
  <?php echo $is_expanded ? __('Masquer', 'clemence-fouquet') : __('Afficher', 'clemence-fouquet'); ?>
</button>
```

---

## Contraste

### Minimum WCAG AA

| Élément | Ratio minimum |
|---------|---------------|
| Texte normal | 4.5:1 |
| Texte large (18px+) | 3:1 |
| Éléments UI | 3:1 |

### Utiliser tokens

```css
/* Toujours utiliser les couleurs theme.json validées */
.c-card__title {
  color: var(--wp--preset--color--gray-900);  /* Validé AA */
}

.c-card__description {
  color: var(--wp--preset--color--gray-700);  /* Validé AA */
}
```

---

## Touch targets

### Minimum 44x44px

```css
.c-card__link {
  display: inline-block;
  min-height: 44px;
  min-width: 44px;
  padding: var(--wp--preset--spacing--30);
}
```

---

## Animations

### Respecter prefers-reduced-motion

```css
.c-card {
  transition: transform 0.3s ease;
}

.c-card:hover {
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .c-card {
    transition: none;
  }

  .c-card:hover {
    transform: none;
  }
}
```

---

## Screen readers

### Texte caché visuellement

```css
.screen-reader-text {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

```php
<span class="screen-reader-text">
  <?php esc_html_e( 'Information supplémentaire', 'clemence-fouquet' ); ?>
</span>
```

---

## Checklist accessibilité bloc

- [ ] Alt text sur toutes les images
- [ ] Focus visible (outline 2px)
- [ ] Contraste ≥ 4.5:1
- [ ] Touch targets ≥ 44x44px
- [ ] Headings hiérarchiques
- [ ] Liens descriptifs (aria-label si générique)
- [ ] prefers-reduced-motion respecté
- [ ] Screen reader text si nécessaire
