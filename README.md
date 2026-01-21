# Claude Code Marketplace

Personal marketplace for Claude Code skills with hybrid skill registry, unified logging, and optimized routing.

**Claude Code 2.1.0 Compatible** - Hot reload, hooks in frontmatter, unified skills/commands

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
fast-skill-router.js      ← Routes user prompts to skills (5ms avg)
        ↓
unified-logger.js         ← JSONL structured logging (session tracking)
```

**Priority Resolution**: Project (2) > Global (1) > Marketplace (0)

## Performance

- **SessionStart**: 17ms avg (99.4% improvement from Claude Mem removal)
- **Router**: 5ms avg with context awareness (Office file detection)
- **Unified Logging**: JSONL format with session tracking, 30s cache, rolling buffer (5000 lines)
- **Zero timeouts**: Claude Mem completely removed

## Quick Start

```bash
# Sync skills to ~/.claude/
/sync

# Discover all skills from all sources
python scripts/discovery/discover-skills.py

# Regenerate triggers from hybrid registry
python scripts/discovery/generate-triggers.py

# Monitor logs in real-time (optional)
node scripts/core/log-monitor.js
```

## Structure

```
skills/                           # 66+ marketplace skills (organized by category)
registry/                         # Central registries (renamed from configs/)
├── hybrid-registry.json          # Unified skill index (auto-generated)
├── skill-triggers.json           # Routing triggers (auto-generated)
├── sync-config.json              # Sync config + project sources
├── projects-registry.json        # Known projects
├── hooks-registry.json           # Available hooks
├── servers-registry.json         # Windows startup servers
└── mcp-registry.json             # MCP servers
scripts/
├── core/                         # Core hooks (5ms-17ms performance)
│   ├── session-start-banner.js   # SessionStart hook (17ms avg)
│   ├── fast-skill-router.js      # UserPromptSubmit hook (5ms avg, context-aware)
│   ├── track-skill-invocation.js # PostToolUse hook (skill tracking)
│   ├── log-monitor.js            # Real-time log monitoring dashboard
│   └── ...
├── discovery/                    # Skill/hook/MCP discovery
│   ├── discover-skills.py        # Multi-source skill discovery
│   ├── generate-triggers.py      # Trigger generation
│   ├── discover-hooks.py         # Hook inventory
│   └── discover-mcps.py          # MCP registry
├── sync/                         # Migration utilities
│   └── migrate-skill.py
├── servers/                      # Server management
│   ├── server-manager.py         # Start/stop/list servers
│   └── mcp-auto-install.py       # MCP auto-installation
├── utils/                        # Maintenance scripts
│   ├── cleanup-claude-json.py
│   ├── generate-status-tables.py
│   └── ...
└── lib/                          # Shared libraries
    ├── unified-logger.js         # JSONL structured logging (NEW)
    └── debug-logger.js
docs/                             # Project documentation
├── guides/                       # Evolving docs (GUIDE_, METHODOLOGIE_)
└── rapports/                     # Event-based reports (dated, with commit)
docs-source/                      # MkDocs sources (isolated from build)
└── mkdocs.yml
tests/                            # Unit tests with coverage
└── coverage/                     # Test coverage reports (gitignored)
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

Then run: `python scripts/discovery/discover-skills.py`

## Fast Skill Router

The router suggests skills based on user prompts using **keyword matching** (5ms avg).

**Features:**
- **Context-aware**: Detects Office files (.xlsx, .docx, .pdf) in CWD and boosts relevant skills
- **Analytical verb weighting**: "analyze", "extract", "parse" get 1.5x boost
- **Fuzzy matching**: Tolerates typos (Levenshtein distance ≤1)
- **30-second cache**: CWD scanning cached to avoid repeated I/O
- **Performance threshold**: Skips scan if >200 files in directory

**Triggers must be written as users naturally speak:**

| Bad (Technical) | Good (Natural) |
|-----------------|----------------|
| `xlsx manipulation` | `créer un fichier excel` |
| `git repository sync` | `mettre à jour le serveur` |

See `skills/julien-skill-creator/SKILL.md` for trigger methodology.

## Unified Logging

All hooks and scripts log to `~/.claude/logs/unified.jsonl` with:
- **Session tracking**: Unique session_id for event correlation
- **Structured JSONL**: One event per line, easy parsing
- **Performance metrics**: Duration, status, error tracking
- **Rolling buffer**: Auto-rotation at 5000 lines (~5-10MB max)
- **Real-time monitoring**: `node scripts/core/log-monitor.js`

**Log format:**
```json
{
  "timestamp": "2026-01-11T22:13:55.964Z",
  "session_id": "1768165435949-a3f2",
  "project_name": "Claude Code MarketPlace",
  "project_path": "C:\\Users\\julien\\OneDrive\\...",
  "event_type": "SessionStart",
  "hook_name": "session-start-banner.js",
  "duration_ms": 15,
  "status": "success"
}
```

## Commands

| Command | Description |
|---------|-------------|
| `/julien-sync` | Sync skills, scripts, configs to ~/.claude/ |
| `/julien-project-scan` | Scan all project sources for skills |
| `/julien-project-list` | List registered projects |
| `/julien-project-info` | Show current project details |
| `/julien-list-resources` | List skills, MCPs, hooks with filtering |
| `/julien-servers` | Manage servers (start/stop/status) |
| `/julien-check-loaded-skills` | Show loaded skills by category |
| `/julien-active-folder` | Display current working directory |

## Hooks

| Hook | Event | Purpose | Performance |
|------|-------|---------|-------------|
| `session-start-banner.js` | SessionStart | Display project banner | 17ms avg |
| `fast-skill-router.js` | UserPromptSubmit | Route prompts to skills | 5ms avg |
| `track-skill-invocation.js` | PostToolUse | Record skill usage | <1ms |
| `session-end-cleanup.js` | SessionEnd | Clean temporary files | N/A |
| `protect-claude-process.py` | PreToolUse | Block dangerous commands | N/A |

## Claude Code 2.1.0 Features

This marketplace is compatible with Claude Code 2.1.0+:
- **Hot reload**: Skills automatically reload without restart
- **Hooks in frontmatter**: Skills can define their own hooks
- **Skills progress indicators**: Tool uses displayed in real-time
- **Unified commands/skills**: No more mental model confusion
- **Context visualization**: Skills shown as separate category

## License

Apache 2.0
