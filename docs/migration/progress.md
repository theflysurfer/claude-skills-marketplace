# Progression de la migration

Suivi détaillé de la migration des skills vers le marketplace centralisé.

## Dashboard

| Métrique | Valeur |
|----------|--------|
| Skills migrées | {{ migrated_count }} |
| Skills en attente | {{ total_pending }} |
| Progression | {{ progress_percent }}% |

## Timeline

```mermaid
gantt
    title Migration des Skills
    dateFormat  YYYY-MM-DD
    section Phase E
    MkDocs Dashboard           :done, e1, 2025-12-17, 1d
    section Phase C
    WordPress skills           :c1, after e1, 2d
    Calibre skills             :c2, after c1, 1d
    Deploy skills              :c3, after c2, 1d
    Media skills               :c4, after c3, 1d
    Audioguide skills          :c5, after c4, 2d
    Orphelines                 :c6, after c5, 1d
    section Phase F
    Audit paths                :f1, after c6, 2d
```

## Skills migrées

{% if migrated_skills %}
| Skill | Source | Date |
|-------|--------|------|
{% for skill in migrated_skills %}
| {{ skill.name }} | {{ skill.source }} | {{ skill.date }} |
{% endfor %}
{% else %}
*Aucune skill migrée pour le moment.*
{% endif %}

## Historique

### 2025-12-17

- Création du dashboard MkDocs Material
- Configuration du plugin de génération de skills
- Mise en place de la structure documentation

## Prochaines étapes

1. **Phase C** : Migrer les 67 skills des projets
2. **Phase F** : Auditer les dépendances et chemins
3. **Phase D** : Refactorer les 28 MCP en 1 skill installer
4. **Phase A** : Implémenter le routing contextuel
