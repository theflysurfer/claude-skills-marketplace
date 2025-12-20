# Statut de déploiement

Vue dynamique des skills déployées vs disponibles.

<div class="skill-actions">
  <button class="skill-action-btn" data-skill-action="sync">
    Synchroniser les skills
  </button>
  <button class="skill-action-btn" data-skill-action="check-loaded-skills">
    Vérifier skills chargées
  </button>
  <button class="skill-action-btn skill-copy-btn" data-copy-command="/sync">
    Copier /sync
  </button>
</div>

{{ deployment_summary() }}

## Légende des scopes

| Icône | Scope | Signification |
|-------|-------|---------------|
| 🌐 | Global | Déployée dans `~/.claude/skills/` (disponible partout) |
| 📁 | Projet | Déployée dans `.claude/skills/` du projet courant |
| 📦 | Non déployé | Disponible dans le marketplace, non synchronisée |

## Skills déployées globalement

**{{ deployed_global_count }} skills** dans `~/.claude/skills/` :

{% for skill in deployed_global_skills %}
- `{{ skill }}`
{% endfor %}

## Skills externes (hors marketplace)

Ces skills sont dans `~/.claude/skills/` mais pas dans le marketplace :

{% for skill in deployment_info.global.external %}
- `{{ skill }}`
{% else %}
*Aucune skill externe*
{% endfor %}

## Synchronisation

Pour déployer les skills du marketplace vers global :

```bash
/sync
```

Ou manuellement :

```bash
# Copier une skill spécifique
cp -r "path/to/marketplace/skills/ma-skill" ~/.claude/skills/

# Vérifier le déploiement
ls ~/.claude/skills/
```

## Voir aussi

- [Scopes (Global vs Projet)](../dev/scopes.md) - Comprendre les priorités
- [Architecture](../dev/architecture.md) - Vue globale du système
