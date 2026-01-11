# Skills en attente de migration

Liste des {{ total_pending }} skills à migrer depuis les différents projets vers le marketplace.

## Progression globale

```mermaid
pie title Migration des Skills
    "Migrées" : {{ migrated_count }}
    "En attente" : {{ total_pending }}
```

## Par source

{% for source in pending_skills %}
### {{ source.source }}

| Status | Skill | Nouveau nom |
|--------|-------|-------------|
{% for skill in source.skills %}
| ⏳ | `{{ skill }}` | `julien-{{ skill }}` |
{% endfor %}

**Total** : {{ source.count }} skills

---
{% endfor %}

## Processus de migration

Pour chaque skill à migrer :

1. **Copier** le dossier source vers `marketplace/skills/julien-{nom}/`
2. **Vérifier** le frontmatter YAML (name, description, triggers)
3. **Renommer** si nécessaire avec le préfixe approprié
4. **Supprimer** l'original du projet source
5. **Créer symlink** dans le projet vers le marketplace
6. **Mettre à jour** `project-skills-mapping.json`
7. **Régénérer** triggers : `python scripts/generate-triggers.py`
8. **Synchroniser** : `/sync`

## Checklist migration

- [ ] WordPress (13 skills) - Site internet Clem
- [ ] Calibre (7 skills) - Calibre Manager
- [ ] Migration/Rclone (5 skills) - Rclone OneDrive
- [ ] Deploy/PM2 (4 skills) - Site Web Jokers
- [ ] Audioguide (15 skills) - Voyage en Italie
- [ ] Media (3 skills) - Media streaming server
- [ ] Civ1 streaming (4 skills) - Civ 1 streaming
- [ ] Orphelines (5 skills) - ~/.claude/skills
- [ ] Zimprobagnais (3 skills) - Notion Uploader
