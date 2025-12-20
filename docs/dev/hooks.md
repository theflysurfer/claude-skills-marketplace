# Hooks

Gestion centralisée des hooks Claude Code.

<div class="skill-actions">
  <button class="skill-action-btn" data-skill-action="sync">
    Synchroniser hooks
  </button>
  <button class="skill-action-btn skill-copy-btn" data-copy-command="/sync">
    Copier /sync
  </button>
</div>

{{ hooks_summary() }}

## Tous les Hooks

{{ hooks_table() }}

## Par Catégorie

{{ hooks_by_category() }}

## Types de Hooks

### Hooks Globaux (🌐)

Hooks exécutés directement depuis le marketplace. Toujours à jour.

**Déployés automatiquement** via `/sync` :
- `session-start-banner` - Bannière au démarrage
- `fast-skill-router` - Routing vers skills
- `track-skill-invocation` - Analytics
- `session-end-cleanup` - Nettoyage

### Templates (📋)

Hooks à copier et personnaliser pour vos besoins.

**Disponibles** dans `hooks/templates/` :
- `pre-write-validate.py` - Protection fichiers sensibles
- `audit-logging.py` - Log des actions
- `session-summary.py` - Résumé de session

## Installation d'un Template

1. **Copier le template**

```bash
cp "path/to/marketplace/hooks/templates/pre-write-validate.py" ~/.claude/hooks/
```

2. **Personnaliser** (éditer les constantes en haut du script)

3. **Ajouter dans settings.json**

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "python ~/.claude/hooks/pre-write-validate.py",
        "timeout": 5
      }]
    }]
  }
}
```

## Events Disponibles

| Event | Déclencheur | Usage typique |
|-------|-------------|---------------|
| `SessionStart` | Début de session | Bannière, chargement contexte |
| `UserPromptSubmit` | Chaque prompt | Routing, suggestions |
| `PreToolUse` | Avant un outil | Validation, protection |
| `PostToolUse` | Après un outil | Logging, tracking |
| `SessionEnd` | Fin de session | Cleanup, résumé |

## Matchers

Pour `PreToolUse` et `PostToolUse`, utilisez des matchers :

```json
{
  "matcher": "Write|Edit",  // Regex: Write OU Edit
  "matcher": "Bash",        // Exact: seulement Bash
  "matcher": "*"            // Wildcard: tous les outils
}
```

## Exit Codes

| Code | Effet |
|------|-------|
| `0` | Succès, continue |
| `2` | **Bloque l'action** |
| Autre | Erreur (non-bloquant) |

## Debugging

```bash
# Voir les logs
tail -f ~/.claude/logs/audit.log

# Tester un hook manuellement
echo '{"tool_name":"Write","tool_input":{"file_path":".env"}}' | python hooks/templates/pre-write-validate.py

# Vérifier la config actuelle
cat ~/.claude/settings.json | python -c "import sys,json; print(json.dumps(json.load(sys.stdin).get('hooks',{}), indent=2))"
```

## Créer un Hook Custom

Utilisez la skill dédiée :

```
Skill("julien-dev-hook-creator")
```

## Voir aussi

- [Architecture](architecture.md) - Vue globale du système
- [Scopes](scopes.md) - Global vs Projet
- [Semantic Routing](semantic-routing.md) - Comment fonctionne le router
