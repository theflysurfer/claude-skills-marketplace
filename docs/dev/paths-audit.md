# Phase F - Audit Paths et Dépendances

> **Date**: 2025-12-17
> **Status**: Terminé

## Résumé

| Catégorie | Findings | Action |
|-----------|----------|--------|
| Paths hardcodés `C:\Users\julien` | Fichiers JSON générés | OK - outputs dynamiques |
| Paths `/home/automation/` | Skills Media (VPS) | OK - chemins serveur corrects |
| Paths `~/.claude` | Documentation | OK - portable |
| Scripts `scripts/*.py` | Stdlib uniquement | OK - pas de deps externes |
| Skills Python | Deps externes | Documenté dans requirements.txt |

## Paths Hardcodés

### `C:\Users\julien` (Windows)

**Trouvés dans:**
- `docs/hooks-scan-results.json` - Résultat de scan
- `docs/skills-scan-results.json` - Résultat de scan
- `docs/projects-skills-scan.json` - Résultat de scan

**Verdict**: Ces fichiers sont des **outputs dynamiques** générés par les scripts de scan. Ils contiennent les paths de la machine locale au moment du scan. **Aucune action requise** - ces fichiers sont régénérés à chaque scan.

### `/home/automation/` (Linux VPS)

**Trouvés dans:**
- `skills/julien-media-jellyfin-scan/` - Chemins sur serveur Hostinger
- `skills/julien-media-stack-refresh/` - Chemins sur serveur Hostinger
- `skills/julien-media-realdebrid-cleanup/` - Chemins sur serveur Hostinger
- `skills/julien-deploy-pm2-management/` - Chemins sur serveur Hostinger
- `skills/julien-infra-hostinger-audit/` - Chemins sur serveur Hostinger

**Verdict**: Ces paths sont **corrects** - ils décrivent la structure du serveur VPS Hostinger distant. **Aucune action requise**.

### `~/.claude` (Portable)

**Trouvés dans:**
- Documentation MkDocs
- Skills de configuration
- Scripts sync

**Verdict**: **Portable** - `~` s'expanse vers le home directory sur toutes les plateformes.

## Dépendances Python

### Scripts Core (`scripts/*.py`)

| Script | Dépendances |
|--------|-------------|
| `semantic-skill-router.py` | `semantic_router`, `sentence-transformers` (optionnel) |
| `generate-triggers.py` | stdlib |
| `session-start-banner.py` | stdlib |
| `track-skill-invocation.py` | stdlib |
| `mkdocs_macros.py` | stdlib |
| Autres | stdlib |

**Note**: Le router sémantique a un **fallback keyword matching** si semantic-router n'est pas installé.

### Skills Anthropic

| Skill | Dépendances |
|-------|-------------|
| `anthropic-office-docx` | `defusedxml`, `lxml` |
| `anthropic-office-xlsx` | `openpyxl` |
| `anthropic-office-pptx` | `python-pptx`, `Pillow` |
| `anthropic-web-testing` | `playwright` |
| `anthropic-dev-tools-mcp-builder` | `anthropic`, `mcp` |

### Skills Julien

| Skill | Dépendances |
|-------|-------------|
| `notion-*` | `requests` |
| `julien-dev-tools-skill-reviewer` | `PyYAML` |

## Fichiers Créés

- `requirements.txt` - Dépendances consolidées
- `docs/dev/paths-audit.md` - Ce document

## Recommandations

1. **Environnement virtuel**: `python -m venv .venv && pip install -r requirements.txt`
2. **Installation minimale**: Les scripts core fonctionnent sans deps externes
3. **Semantic router**: Optionnel, fallback sur keyword matching
4. **Skills Anthropic**: Installer deps selon les skills utilisées

## Variables d'Environnement

| Variable | Usage | Défaut |
|----------|-------|--------|
| `SEMANTIC_ROUTER_MODEL` | Modèle HuggingFace | `sentence-transformers/all-MiniLM-L6-v2` |
| `CLAUDE_MARKETPLACE_ROOT` | Racine marketplace | Auto-détecté |

## Portabilité Testée

- [x] Windows 11
- [ ] Linux (WSL)
- [ ] macOS

La portabilité Linux/Mac n'est pas testée mais devrait fonctionner car:
- Scripts utilisent `Path.home()` et `Path(__file__)`
- Pas de chemins hardcodés vers Windows
- `~` expansion fonctionne partout
