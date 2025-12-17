# Skills

Liste complète des {{ skills_count }} skills disponibles dans le marketplace.

## Skills par préfixe

{% for prefix, skills_list in skills_by_prefix.items() %}
### {{ prefix }}

| Skill | Description | Triggers |
|-------|-------------|----------|
{% for skill in skills_list %}
| [{{ skill.name }}]({{ skill.name }}.md) | {{ skill.description[:60] }}... | {{ skill.triggers_count }} |
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
