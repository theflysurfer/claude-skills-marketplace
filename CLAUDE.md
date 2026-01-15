# Claude Code Marketplace

## Project Purpose

Central marketplace for Claude Code ecosystem management:
- **Skills** - 54+ skills indexed from marketplace, global, and project sources
- **Hooks** - 5 global hooks for session lifecycle automation
- **Commands** - 8 slash commands for marketplace operations
- **Servers** - Windows startup server management
- **MCPs** - MCP server registry and auto-installation

## Commands

| Command | Purpose |
|---------|---------|
| `/julien-sync` | Sync skills, commands, scripts to ~/.claude/ |
| `/julien-list-resources` | List skills, MCPs, hooks with filtering |
| `/julien-project-scan` | Scan all project sources for skills |
| `/julien-project-list` | List registered projects |
| `/julien-project-info` | Show current project details |
| `/julien-active-folder` | Display current working directory |
| `/julien-servers` | Manage servers (start/stop/status) |
| `/julien-check-loaded-skills` | Show loaded skills by category |

## Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| `session-start-banner` | SessionStart | Display project banner |
| `fast-skill-router` | UserPromptSubmit | Route prompts to skills (~3ms) |
| `track-skill-invocation` | PostToolUse | Record skill usage for analytics |
| `session-end-cleanup` | SessionEnd | Clean temporary files |
| `protect-claude-process` | PreToolUse | Block dangerous process commands |

### Router Configuration

The `fast-skill-router` now injects skill content directly for high-confidence matches (score ≥1.0).

**Context matching is currently disabled** - only keyword-based routing is active. Context detection (file extensions in cwd) was causing false positives. To re-enable, modify `fast-skill-router.js` and set `ENABLE_CONTEXT_MATCHING = true`.

## Key Scripts

| Script | Purpose |
|--------|---------|
| `discover-skills.py` | Scan all sources, build hybrid-registry.json |
| `generate-triggers.py` | Generate skill-triggers.json from registry |
| `fast-skill-router.js` | Fast keyword-based routing (~3ms) |
| `semantic-skill-router.py` | TF-IDF semantic routing |
| `preload-router.py` | Warm TF-IDF cache at session start |
| `server-manager.py` | Start/stop/list servers and utilities |
| `discover-mcps.py` | Discover and register MCP servers |
| `mcp-auto-install.py` | Auto-install MCPs from registry |
| `discover-hooks.py` | Scan and index available hooks |
| `track-skill-invocation.py` | Log skill usage for feedback |

## Registries

| File | Purpose |
|------|---------|
| `hybrid-registry.json` | Unified index of all skills with metadata |
| `skill-triggers.json` | Trigger keywords for semantic routing |
| `sync-config.json` | What to sync + project_sources definitions |
| `projects-registry.json` | Known projects with paths |
| `hooks-registry.json` | Available hooks with descriptions |
| `servers-registry.json` | Servers and utilities for Windows startup |
| `mcp-registry.json` | MCP servers with credentials |

## Servers Management

Servers are defined in `servers-registry.json` and managed via `/julien-servers`:
- **idle-queue** - Background job queue (port 8742)
- **mkdocs** - Documentation server (port 8000)
- **cooking-manager** - Auchan shopping app
- **money-manager** - Finance app (port 3000)

Startup files are in `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\`

## Workflow: Adding a Skill

1. Create skill in `skills/skill-name/SKILL.md`
2. Add triggers in YAML frontmatter (natural language, 10-20)
3. Run `python scripts/discover-skills.py`
4. Run `python scripts/generate-triggers.py`
5. Add to `sync-config.json` if should be global

## Workflow: Adding Project Source

1. Add pattern to `sync-config.json` -> `project_sources`
2. Run `python scripts/discover-skills.py`
3. Project skills with triggers will be indexed

## Priority Resolution

Project (2) > Global (1) > Marketplace (0)

Skills in project `.claude/skills/` override global when in that project.

## Trigger Writing Rules

- Natural language, not technical jargon
- Include French + English
- 3 categories: keywords, action phrases, problem phrases
- Minimum 5, optimal 10-20, max 50

## Don't

- Edit hybrid-registry.json manually (auto-generated)
- Edit skill-triggers.json manually (auto-generated)
- Put secrets in skills (use .env)
- Kill Claude processes (protected by hook)
