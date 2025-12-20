# {{ categories_info["workflow"].name }}

{{ categories_info["workflow"].description }}

**{{ categories_info["workflow"].count }} skills disponibles**

## Skills

{{ skills_table("workflow") }}

## Fonctionnalités

### Conseils IA
- `julien-workflow-advice-gemini` - Obtenir l'avis de Gemini CLI
- `julien-workflow-advice-codex` - Obtenir l'avis de Codex CLI

### Automatisation
- `julien-workflow-queuing-background-tasks` - Queue de tâches en arrière-plan
- `julien-workflow-check-loaded-skills` - Vérifier les skills chargées

## Utilisation

```bash
# Demander un second avis à Gemini
Skill("julien-workflow-advice-gemini")

# Lancer une tâche en arrière-plan
Skill("julien-workflow-queuing-background-tasks")
```
