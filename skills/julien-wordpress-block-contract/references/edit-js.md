# edit.js - Patterns

## Structure standard

```javascript
import { __ } from '@wordpress/i18n';
import { useBlockProps, RichText, InspectorControls, MediaUpload } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Button } from '@wordpress/components';
import './editor.css';

export default function Edit({ attributes, setAttributes }) {
  const { title, description, imageUrl, variant } = attributes;

  const blockProps = useBlockProps({
    className: `c-card c-card--${variant}`,
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
              { label: 'En vedette', value: 'featured' },
            ]}
            onChange={(value) => setAttributes({ variant: value })}
          />
        </PanelBody>
      </InspectorControls>

      <div {...blockProps}>
        {imageUrl && (
          <img
            className="c-card__image"
            src={imageUrl}
            alt=""
          />
        )}
        <RichText
          tagName="h3"
          className="c-card__title"
          value={title}
          onChange={(value) => setAttributes({ title: value })}
          placeholder={__('Titre...', 'clemence-fouquet')}
        />
        <RichText
          tagName="p"
          className="c-card__description"
          value={description}
          onChange={(value) => setAttributes({ description: value })}
          placeholder={__('Description...', 'clemence-fouquet')}
        />
      </div>
    </>
  );
}
```

---

## MediaUpload

```javascript
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';

<MediaUploadCheck>
  <MediaUpload
    onSelect={(media) => setAttributes({
      imageId: media.id,
      imageUrl: media.url
    })}
    allowedTypes={['image']}
    value={imageId}
    render={({ open }) => (
      <Button onClick={open} variant="primary">
        {imageUrl ? __('Changer l\'image', 'clemence-fouquet') : __('Ajouter une image', 'clemence-fouquet')}
      </Button>
    )}
  />
</MediaUploadCheck>
```

---

## index.js (Registration)

```javascript
import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import metadata from './block.json';
import './style.css';

registerBlockType(metadata.name, {
  edit: Edit,
  save: () => null, // Dynamic render via PHP
});
```

---

## InspectorControls avancés

```javascript
import {
  PanelBody,
  SelectControl,
  ToggleControl,
  RangeControl,
  ColorPalette
} from '@wordpress/components';

<InspectorControls>
  <PanelBody title={__('Apparence', 'clemence-fouquet')}>
    <ToggleControl
      label={__('Mettre en vedette', 'clemence-fouquet')}
      checked={isFeatured}
      onChange={(value) => setAttributes({ isFeatured: value })}
    />
    <RangeControl
      label={__('Colonnes', 'clemence-fouquet')}
      value={columns}
      onChange={(value) => setAttributes({ columns: value })}
      min={1}
      max={4}
    />
  </PanelBody>
</InspectorControls>
```
