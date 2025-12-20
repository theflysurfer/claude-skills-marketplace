# Skills

**{{ skills_count }} skills** dans le marketplace | **{{ deployed_global_count }}** déployées globalement

!!! info "Statut de déploiement"
    - 🌐 **{{ deployed_global_count }}** skills déployées dans `~/.claude/skills/`
    - 📦 **{{ not_deployed_count }}** skills non déployées ([voir détails](deployment.md))

    Pour synchroniser : `/sync`

## Par catégorie

{{ category_summary() }}

## Toutes les skills

{% for prefix, skills_list in skills_by_prefix.items() %}
### {{ prefix }}

| Skill | Description | Triggers |
|-------|-------------|----------|
{% for skill in skills_list %}
| `{{ skill.name }}` | {{ skill.description[:50] }}... | {{ skill.triggers_count }} |
{% endfor %}

{% endfor %}

## Recherche

Utilisez la barre de recherche en haut de page pour trouver une skill spécifique.

## Ajouter une skill

1. Créer le dossier `skills/nom-de-la-skill/`
2. Ajouter `SKILL.md` avec le frontmatter YAML
3. Exécuter `python scripts/generate-triggers.py`
4. Exécuter `/sync`

### Format SKILL.md

```yaml
---
name: nom-de-la-skill
description: Description courte de la skill
triggers:
  - trigger 1
  - trigger 2
  - trigger en français
---

# Contenu de la skill

Instructions détaillées...
```

## Invoquer une skill

```bash
# Dans Claude Code
Skill("nom-de-la-skill")

# Ou via le routing automatique (UserPromptSubmit hook)
# Le router suggère la skill appropriée basée sur votre prompt
```
