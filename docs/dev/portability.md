# Portabilité du Système de Hooks

## Principe de Conception

**RÈGLE FONDAMENTALE**: Tout script utilisé dans un hook DOIT être:

1. **Versionné** dans `scripts/` du marketplace repo
2. **Listé** dans `configs/sync-config.json` → `scripts_to_sync`
3. **Déployé** via `/julien-sync` sur chaque nouvelle machine

## Architecture

```
Marketplace Repo (Git)          ~/.claude/ (Deployed)
├── scripts/                    ├── scripts/
│   ├── session-start-banner.py │   ├── session-start-banner.py
│   ├── fast-skill-router.js    │   ├── fast-skill-router.js
│   └── ...                     │   └── ...
└── configs/                    └── settings.json (references scripts)
    └── sync-config.json (lists scripts to deploy)
```

**Flux**:
```
1. Développement → marketplace/scripts/
2. Configuration → sync-config.json
3. Déploiement → /julien-sync → ~/.claude/scripts/
4. Utilisation → settings.json hooks
```

## Hooks Actuels et Leurs Scripts

| Hook | Scripts | Versionnés | Synced |
|------|---------|------------|--------|
| SessionStart | `session-start-banner.py` | ✅ | ✅ |
| UserPromptSubmit | `fast-skill-router.js` | ✅ | ✅ |
| PostToolUse (Skill) | `track-skill-invocation.py` | ✅ | ✅ |
| PostToolUse (Bash) | `cleanup-null-files.ps1` | ✅ | ✅ |
| PreCompact | `precompact-save-chunk.py` | ✅ | ✅ |
| SessionEnd | `session-end-delete-reserved.py`<br>`save-session-for-memory.py`<br>`session-stats-dashboard.py` | ✅ | ✅ |
| Stop | `set-terminal-title.py` | ✅ | ✅ |

## Vérification Manuelle

Pour vérifier qu'aucun script n'est oublié, exécuter dans le marketplace:

```bash
# Lister tous les scripts référencés dans settings.json
grep -Eo "scripts/[^\"']+" ~/.claude/settings.json | sort -u

# Vérifier qu'ils existent tous dans le repo
cd marketplace
for script in $(grep -Eo "scripts/[^\"']+" ~/.claude/settings.json | cut -d/ -f2- | sort -u); do
  if [ -f "scripts/$script" ]; then
    echo "✓ $script"
  else
    echo "✗ MANQUANT: $script"
  fi
done

# Vérifier qu'ils sont dans sync-config.json
python -c "
import json
from pathlib import Path
config = json.loads(Path('configs/sync-config.json').read_text())
scripts_in_sync = set(config['scripts_to_sync'])
print('Scripts in sync-config:', len(scripts_in_sync))
"
```

## Vérification Automatique

Utiliser le script de validation:

```bash
python scripts/validate-portability.py
```

Ce script vérifie:
- ✅ Tous les scripts hooks sont dans le repo
- ✅ Tous les scripts hooks sont dans sync-config.json
- ✅ Pas de scripts "deployment-only"

## Workflow: Créer un Nouveau Hook

### ❌ MAUVAISE Méthode (Risque de Perte)

```bash
# NE PAS FAIRE ÇA:
vim ~/.claude/scripts/mon-nouveau-hook.py  # ❌ Pas versionné
# Ajouter le hook dans ~/.claude/settings.json
# Ça marche... jusqu'au prochain PC
```

**Problème**: Le script n'est pas versionné. Perte garantie au changement de machine.

### ✅ BONNE Méthode (Portable)

```bash
# 1. Développer dans le repo marketplace
cd "C:\Users\julien\OneDrive\Coding\_Projets de code\2025.11 Claude Code MarketPlace"
vim scripts/mon-nouveau-hook.py

# 2. Ajouter dans sync-config.json
# Éditer configs/sync-config.json:
# "scripts_to_sync": [..., "mon-nouveau-hook.py"]

# 3. Tester le déploiement
/julien-sync
ls ~/.claude/scripts/mon-nouveau-hook.py  # Vérifier

# 4. Ajouter le hook dans settings.json
vim ~/.claude/settings.json

# 5. Valider
python scripts/validate-portability.py

# 6. Commit
git add scripts/mon-nouveau-hook.py configs/sync-config.json
git commit -m "feat: add mon-nouveau-hook for XYZ"
git push
```

## Recovery: Nouvelle Machine

Si tu changes d'ordinateur ou réinstalles:

```bash
# 1. Cloner le marketplace
cd "C:\Users\julien\OneDrive\Coding\_Projets de code"
git clone [repo-url] "2025.11 Claude Code MarketPlace"

# 2. Lancer Claude Code dans le marketplace
cd "2025.11 Claude Code MarketPlace"
claude

# 3. Sync tous les scripts/skills/configs
/julien-sync

# 4. Vérifier que tout est déployé
ls ~/.claude/scripts/
ls ~/.claude/skills/
ls ~/.claude/configs/

# 5. Les hooks settings.json référencent maintenant des scripts existants
# Pas de perte, tout fonctionne immédiatement
```

## Historique du Problème

**Avant cette PR** (commit < `dynamic-knitting-conway`):
- 5 scripts critiques étaient deployment-only
- Risque de perte au changement de machine
- Aucune validation automatique

**Scripts concernés** (maintenant versionnés):
- `precompact-save-chunk.py`
- `save-session-for-memory.py`
- `session-stats-dashboard.py`
- `set-terminal-title.py`
- `cleanup-null-files.ps1`

**Après cette PR**:
- ✅ Tous les scripts hooks versionnés dans marketplace
- ✅ sync-config.json à jour
- ✅ Script de validation `validate-portability.py`
- ✅ Documentation complète

## Maintenance

Exécuter régulièrement:

```bash
# Avant chaque commit majeur
python scripts/validate-portability.py

# Après avoir ajouté un hook
grep -r "\.claude/scripts" ~/.claude/settings.json
python scripts/validate-portability.py
```

## FAQ

**Q: Pourquoi ne pas juste versionner `~/.claude/settings.json` ?**
R: On le fait (`home_files_to_sync`), mais ça ne suffit pas. Si les scripts référencés n'existent pas, les hooks échouent.

**Q: Que se passe-t-il si j'oublie d'ajouter un script dans sync-config.json ?**
R: Le script ne sera pas déployé sur une nouvelle machine. `validate-portability.py` détectera le problème.

**Q: Puis-je avoir des scripts "locaux" non versionnés ?**
R: Oui, mais ils ne doivent PAS être utilisés dans les hooks globaux. Réservé pour des expérimentations temporaires.

**Q: Comment puis-je tester un hook sans le versionner ?**
R: Développe dans `marketplace/scripts/`, ajoute dans sync-config (sans commit), teste avec `/julien-sync`. Une fois validé, commit.
