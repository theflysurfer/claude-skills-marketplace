# block.json - Exemples Complets

## Exemple Card

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "clemence/card",
  "version": "1.0.0",
  "title": "Card",
  "category": "clemence-blocks",
  "icon": "index-card",
  "description": "Carte avec image, titre et description.",
  "keywords": ["card", "carte", "teaser"],
  "textdomain": "clemence-fouquet",
  "attributes": {
    "title": {
      "type": "string",
      "default": ""
    },
    "description": {
      "type": "string",
      "default": ""
    },
    "imageId": {
      "type": "number"
    },
    "imageUrl": {
      "type": "string"
    },
    "linkUrl": {
      "type": "string",
      "default": ""
    },
    "variant": {
      "type": "string",
      "enum": ["default", "featured", "horizontal"],
      "default": "default"
    }
  },
  "supports": {
    "html": false,
    "align": ["wide", "full"],
    "color": {
      "background": true,
      "text": true
    },
    "spacing": {
      "margin": true,
      "padding": true
    },
    "typography": {
      "fontSize": true
    }
  },
  "editorScript": "file:./index.js",
  "editorStyle": "file:./editor.css",
  "style": "file:./style.css",
  "render": "file:./render.php"
}
```

---

## Types d'attributs

| Type | Usage | Exemple |
|------|-------|---------|
| `string` | Texte | `"title": { "type": "string" }` |
| `number` | Nombre | `"count": { "type": "number" }` |
| `boolean` | Oui/Non | `"isActive": { "type": "boolean" }` |
| `array` | Liste | `"items": { "type": "array" }` |
| `object` | Objet | `"settings": { "type": "object" }` |

---

## Attributs avec source

```json
{
  "attributes": {
    "title": {
      "type": "string",
      "default": "",
      "source": "html",
      "selector": ".c-card__title"
    }
  }
}
```

---

## Supports disponibles

```json
{
  "supports": {
    "html": false,
    "align": ["wide", "full"],
    "anchor": true,
    "color": {
      "background": true,
      "text": true,
      "link": true,
      "gradients": true
    },
    "spacing": {
      "margin": true,
      "padding": true,
      "blockGap": true
    },
    "typography": {
      "fontSize": true,
      "lineHeight": true,
      "fontFamily": true
    },
    "__experimentalBorder": {
      "color": true,
      "radius": true,
      "style": true,
      "width": true
    }
  }
}
```
