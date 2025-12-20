# Hooks Claude Code

Ce dossier contient les hooks et templates pour Claude Code.

## Structure

```
hooks/
├── templates/           # Templates réutilisables (à copier)
│   ├── pre-write-validate.py
│   ├── audit-logging.py
│   └── session-summary.py
└── README.md
```

## Hooks Core vs Templates

### Hooks Core

Les hooks core sont exécutés directement depuis le marketplace via chemin absolu.
Ils sont automatiquement à jour quand le marketplace est mis à jour.

| Hook | Event | Description |
|------|-------|-------------|
| `session-start-banner.py` | SessionStart | Affiche bannière projet |
| `fast-skill-router.js` | UserPromptSubmit | Route vers skills |
| `track-skill-invocation.py` | PostToolUse | Analytics invocations |
| `session-end-delete-reserved.py` | SessionEnd | Cleanup fichiers temp |

### Templates

Les templates sont des hooks prêts à l'emploi à copier et personnaliser.

| Template | Event | Description |
|----------|-------|-------------|
| `pre-write-validate.py` | PreToolUse | Bloque écritures sensibles |
| `audit-logging.py` | PostToolUse | Log toutes les actions |
| `session-summary.py` | SessionEnd | Résumé de session |

## Installation

### Via /sync

```bash
/sync
```

Les hooks core sont automatiquement configurés.

### Manuellement (templates)

1. Copier le template vers `~/.claude/hooks/`
2. Personnaliser la configuration dans le script
3. Ajouter dans `~/.claude/settings.json`

Exemple pour `pre-write-validate.py` :

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

## Créer un Hook Custom

Voir la skill `julien-dev-hook-creator` pour un guide complet.

```bash
Skill("julien-dev-hook-creator")
```

## Exit Codes

| Code | Signification |
|------|---------------|
| 0 | Succès (continue) |
| 2 | Bloquer l'action |
| Autre | Erreur (non-bloquant) |

## Debugging

```bash
# Voir les logs
tail -f ~/.claude/logs/audit.log

# Tester un hook
echo '{"tool_name":"Write","tool_input":{"file_path":".env"}}' | python hooks/templates/pre-write-validate.py
```
