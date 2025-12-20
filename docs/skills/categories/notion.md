# {{ categories_info["notion"].name }}

{{ categories_info["notion"].description }}

**{{ categories_info["notion"].count }} skills disponibles**

## Skills

{{ skills_table("notion") }}

## Fonctionnalités

### Routing Inbox
- `notion-route-entry` - Router une entrée vers la bonne base

### GitHub Integration
- `notion-inbox-to-github` - Déplacer de l'inbox vers GitHub DB
- `notion-github-enhance-note` - Enrichir avec métadonnées GitHub

## Utilisation

```bash
# Router une entrée de l'inbox
Skill("notion-route-entry")

# Enrichir une entrée GitHub
Skill("notion-github-enhance-note")
```

## Prérequis

- Token API Notion configuré dans WCM (`MCP_NOTION_API_TOKEN`)
- Bases de données Notion structurées (Inbox, GitHub, etc.)
