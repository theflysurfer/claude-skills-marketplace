# {{ categories_info["notion"].name }}

{{ categories_info["notion"].description }}

**{{ categories_info["notion"].count }} skills disponibles**

## Skills

{{ skills_table("notion") }}

## Skills PKM (projet 2025.09 Notion Uploader)

Les skills suivantes sont disponibles dans le projet `2025.09 Notion Uploader` (`.claude/skills/`):

### Routing Inbox
- `notion-route-entry` - Router une entrée vers la bonne base

### GitHub Integration
- `notion-inbox-to-github` - Déplacer de l'inbox vers GitHub DB
- `notion-github-enhance-note` - Enrichir avec métadonnées GitHub

> Ces skills utilisent des IDs de bases de données spécifiques et ne sont pas dans le marketplace global.

## Prérequis

- Token API Notion configuré dans WCM (`MCP_NOTION_API_TOKEN`)
- Bases de données Notion structurées (Inbox, GitHub, etc.)
