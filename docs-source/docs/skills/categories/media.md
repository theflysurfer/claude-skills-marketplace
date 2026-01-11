# {{ categories_info["media"].name }}

{{ categories_info["media"].description }}

**{{ categories_info["media"].count }} skills disponibles**

## Skills

{{ skills_table("media") }}

## Fonctionnalités

### Streaming & Jellyfin
- `julien-media-jellyfin-scan` - Scanner la bibliothèque Jellyfin
- `julien-media-stack-refresh` - Rafraîchir le stack média

### Transcoding
- `julien-media-onepiece-workflow` - Pipeline OnePiece (GPU transcoding)
- `julien-media-subtitle-translation` - Traduction de sous-titres

### Debrid
- `julien-media-realdebrid-cleanup` - Nettoyage RealDebrid

## Utilisation

```bash
# Scanner Jellyfin
Skill("julien-media-jellyfin-scan")

# Traduire des sous-titres
Skill("julien-media-subtitle-translation")
```
