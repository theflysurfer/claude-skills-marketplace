# Référence Rapide

Toutes les commandes, skills et outils disponibles dans le marketplace.

---

## Commandes Slash

Commandes disponibles directement dans Claude Code.

| Commande | Description |
|----------|-------------|
| `/sync` | Synchronise skills, scripts et configs vers ~/.claude/ |
| `/list-resources` | Liste toutes les skills et MCPs disponibles |
| `/project-scan` | Scanne les projets et met à jour le registre |
| `/project-list` | Liste tous les projets enregistrés |
| `/project-info` | Affiche les infos du projet courant |
| `/check-loaded-skills` | Vérifie les skills chargées (global vs projet) |

---

## Scripts Utilitaires

Scripts Python/JS exécutables manuellement.

### Gestion Skills

```bash
# Générer les triggers depuis les SKILL.md
python scripts/generate-triggers.py

# Découvrir les skills dans les projets
python scripts/discover-skills.py

# Migrer une skill vers le marketplace
python scripts/migrate-skill.py

# Construire l'index de routing
python scripts/build-keyword-index.py
```

### Gestion MCPs

```bash
# Découvrir les MCPs installés vs disponibles
python scripts/discover-mcps.py

# Installer automatiquement les MCPs recommandés
python scripts/mcp-auto-install.py
```

### Gestion Hooks

```bash
# Preview des hooks à synchroniser
python scripts/sync-hooks.py

# Appliquer les hooks dans settings.json
python scripts/sync-hooks.py --apply

# Scanner les hooks dans tous les projets
python scripts/scan-all-hooks.py
```

### Gestion Projets

```bash
# Mettre à jour le registre des projets
python scripts/project-registry.py

# Vérifier la configuration d'un projet
python scripts/check-project-setup.py
```

### Maintenance

```bash
# Nettoyer les fichiers .claude.json orphelins
python scripts/cleanup-claude-json.py

# Benchmark du router sémantique
python scripts/benchmark-semantic-router.py
```

---

## Skills Principales

### Dev Tools

| Skill | Usage | Invocation |
|-------|-------|------------|
| Créer skill | Créer une nouvelle skill | `Skill("julien-skill-creator")` |
| Review skill | Analyser qualité d'une skill | `Skill("julien-skill-reviewer")` |
| Renommer skill | Renommer une skill | `Skill("julien-skill-renamer")` |
| Créer hook | Créer un nouveau hook | `Skill("julien-dev-hook-creator")` |
| Documenter CLAUDE.md | Créer/MAJ CLAUDE.md | `Skill("julien-dev-claude-md-documenter")` |
| PowerShell profile | Gérer profil PS | `Skill("julien-dev-powershell-profile")` |

### Workflow

| Skill | Usage | Invocation |
|-------|-------|------------|
| Conseil Gemini | Obtenir avis Gemini CLI | `Skill("julien-workflow-advice-gemini")` |
| Conseil Codex | Obtenir avis Codex CLI | `Skill("julien-workflow-advice-codex")` |
| Background tasks | Queue de tâches idle | `Skill("julien-workflow-queuing-background-tasks")` |
| Check skills | Voir skills chargées | `Skill("julien-workflow-check-loaded-skills")` |

### Office (Anthropic)

| Skill | Usage | Invocation |
|-------|-------|------------|
| Excel | Créer/éditer .xlsx | `Skill("anthropic-office-xlsx")` |
| Word | Créer/éditer .docx | `Skill("anthropic-office-docx")` |
| PowerPoint | Créer/éditer .pptx | `Skill("anthropic-office-pptx")` |
| PDF | Manipuler PDF | `Skill("anthropic-office-pdf")` |

### Références

| Skill | Usage | Invocation |
|-------|-------|------------|
| AHK v1 | Syntaxe AutoHotkey v1 | `Skill("julien-ref-ahk-v1")` |
| AHK v2 | Syntaxe AutoHotkey v2 | `Skill("julien-ref-ahk-v2")` |
| PowerShell | Référence PowerShell | `Skill("julien-ref-powershell")` |
| Batch | Référence Batch/CMD | `Skill("julien-ref-batch")` |
| Astro | Guide install Astro | `Skill("julien-ref-astro-install")` |
| Notion MD | Parser Notion markdown | `Skill("julien-ref-notion-markdown")` |

---

## Hooks Actifs

Hooks configurés dans `~/.claude/settings.json`.

| Hook | Event | Description |
|------|-------|-------------|
| `session-start-banner` | SessionStart | Affiche bannière projet |
| `fast-skill-router` | UserPromptSubmit | Route vers skills (~3ms) |
| `track-skill-invocation` | PostToolUse | Analytics invocations |
| `session-end-cleanup` | SessionEnd | Nettoie fichiers temp |
| `idle-queue-check` | SessionEnd | Vérifie jobs en attente |

### Templates Disponibles

| Template | Event | Usage |
|----------|-------|-------|
| `pre-write-validate.py` | PreToolUse | Bloquer écritures sensibles |
| `audit-logging.py` | PostToolUse | Logger toutes actions |
| `session-summary.py` | SessionEnd | Résumé de session |

---

## MCPs Principaux

### Office
- `@anthropic/mcp-office` - Documents Office

### Browser
- `playwright` - Automatisation web
- `puppeteer` - Headless Chrome

### APIs
- `github` - API GitHub
- `notion` - API Notion

### Outils Dev
- `filesystem` - Accès fichiers
- `memory` - Mémoire persistante
- `idle-queue` - Queue de jobs

---

## Fichiers de Configuration

| Fichier | Emplacement | Contenu |
|---------|-------------|---------|
| `settings.json` | `~/.claude/` | Hooks, plugins, préférences |
| `.mcp.json` | `~/.claude/` | Serveurs MCP globaux |
| `skill-triggers.json` | `configs/` | Triggers des skills |
| `hooks-registry.json` | `configs/` | Registre des hooks |
| `mcp-registry.json` | `configs/` | Registre des MCPs |
| `projects-registry.json` | `configs/` | Registre des projets |
| `sync-config.json` | `configs/` | Config de synchronisation |

---

## Raccourcis Utiles

```bash
# Ouvrir la doc MkDocs
http://127.0.0.1:8000

# Vérifier les MCPs actifs
/mcp

# Lister skills chargées
/check-loaded-skills

# Synchroniser tout
/sync
```

---

## Voir aussi

- [Architecture](dev/architecture.md)
- [Scopes](dev/scopes.md)
- [Hooks](dev/hooks.md)
- [Semantic Routing](dev/semantic-routing.md)
