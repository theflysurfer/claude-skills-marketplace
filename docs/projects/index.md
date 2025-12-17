# Mapping Projets ↔ Skills

Configuration de l'attribution des skills aux différents projets.

## Architecture

```mermaid
flowchart LR
    subgraph Core["Skills Core (tous projets)"]
        A1[anthropic-office-*]
        A2[julien-dev-tools-*]
        A3[julien-workflow-*]
    end

    subgraph Projects["Projets"]
        P1[Claude Code Marketplace]
        P2[Notion Uploader]
        P3[Site Clem]
        P4[Calibre Manager]
        P5[Site Jokers]
        P6[Media Streaming]
    end

    Core --> P1
    Core --> P2
    Core --> P3
    Core --> P4
    Core --> P5
    Core --> P6

    P2 --> |notion-*| N[Notion Skills]
    P3 --> |wordpress-*, hostinger-*| W[WordPress Skills]
    P4 --> |calibre-*| C[Calibre Skills]
    P5 --> |deploy-*, hostinger-*| D[Deploy Skills]
    P6 --> |media-*, hostinger-*| M[Media Skills]
```

## Skills Core

Ces skills sont disponibles dans **tous** les projets :

| Pattern | Description |
|---------|-------------|
| `anthropic-office-*` | Manipulation documents Office |
| `julien-dev-tools-*` | Outils de développement |
| `julien-workflow-*` | Automatisations workflow |

## Projets configurés

{% for project_id, project in projects.items() %}
### {{ project.name }}

- **Identifiant** : `{{ project_id }}`
- **Tags** : {{ project.tags | join(", ") }}
- **Skills** : {{ project.skills | join(", ") }}

{% endfor %}

## Ajouter un projet

Modifier `configs/project-skills-mapping.json` :

```json
{
  "projects": {
    "owner/repo-name": {
      "name": "Nom du projet",
      "skills": ["pattern-*", "autre-skill"],
      "tags": ["tag1", "tag2"]
    }
  }
}
```

### Identifiants supportés

| Type | Format | Exemple |
|------|--------|---------|
| GitHub | `owner/repo` | `julien-music/claude-code-marketplace` |
| Chemin relatif | `~/_Projets/...` | `~/_Projets de code/2025.09 Notion Uploader` |
