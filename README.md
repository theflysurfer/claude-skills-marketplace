# Claude Code Marketplace

Personal marketplace for Claude Code skills with hybrid skill registry.

## Architecture

```
sync-config.json          ← Defines project sources
        ↓
discover-skills.py        → Scans marketplace + global + projects
        ↓
hybrid-registry.json      ← Unified index with priority resolution
        ↓
generate-triggers.py      → Generates skill-triggers.json
        ↓
semantic-skill-router.py  ← Routes user prompts to skills (TF-IDF)
```

**Priority Resolution**: Project (2) > Global (1) > Marketplace (0)

## Quick Start

```bash
# Sync skills to ~/.claude/
/sync

# Discover all skills from all sources
python scripts/discover-skills.py

# Regenerate triggers from hybrid registry
python scripts/generate-triggers.py
```

## Structure

```
skills/                        # All marketplace skills
registry/
├── hybrid-registry.json       # Unified skill index (auto-generated)
├── skill-triggers.json        # Semantic routing triggers (auto-generated)
├── sync-config.json           # What to sync + project sources
├── projects-registry.json     # Known projects registry
└── project-skills-mapping.json
scripts/
├── discover-skills.py         # Multi-source skill discovery
├── generate-triggers.py       # Trigger generation from registry
├── semantic-skill-router.py   # TF-IDF routing (UserPromptSubmit hook)
├── preload-router.py          # Cache warmup (SessionStart hook)
└── ...
```

## Hybrid Registry

Skills can live in multiple locations:

| Location | Priority | Use Case |
|----------|----------|----------|
| **Project** `.claude/skills/` | 2 (highest) | Project-specific skills |
| **Global** `~/.claude/skills/` | 1 | Synced shared skills |
| **Marketplace** `skills/` | 0 | Source of truth |

**Project skills override global/marketplace** when you're in that project.

### Adding Project Sources

Edit `registry/sync-config.json`:

```json
{
  "project_sources": [
    {
      "project_pattern": "**/2025.10 My Project",
      "skills_path": ".claude/skills",
      "priority": 2
    }
  ]
}
```

Then run: `python scripts/discover-skills.py`

## Semantic Routing

The router suggests skills based on user prompts using TF-IDF.

**Triggers must be written as users naturally speak:**

| Bad (Technical) | Good (Natural) |
|-----------------|----------------|
| `xlsx manipulation` | `créer un fichier excel` |
| `git repository sync` | `mettre à jour le serveur` |

See `skills/julien-skill-creator/SKILL.md` for trigger methodology.

## Commands

| Command | Description |
|---------|-------------|
| `/sync` | Sync skills to ~/.claude/ |
| `/project-scan` | Scan and register projects |
| `/project-list` | List registered projects |
| `/list-resources` | List available skills |

## License

Apache 2.0
