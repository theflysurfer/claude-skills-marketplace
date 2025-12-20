---
name: julien-skill-migration
description: "Intelligently migrate skills from local to marketplace with dependency analysis, path verification, and venv detection. Use when: migrate skill, publish skill, move to marketplace."
license: Apache-2.0
metadata:
  author: "Julien"
  version: "2.1.0"
  category: "workflow"
triggers:
  - "migrate skill"
  - "move skill to marketplace"
  - "publish skill"
  - "share skill"
  - "skill migration"
  - "local to marketplace"
  - "migrer skill"
  - "déplacer skill"
  - "publier skill"
---

# Intelligent Skill Migration (Local → Marketplace)

Migrate skills with deep analysis of dependencies, paths, scripts, and requirements.

## Prerequisites

- Source skill in `.claude/skills/<name>/SKILL.md`
- Marketplace: `~/OneDrive/Coding/_Projets de code/2025.11 Claude Code MarketPlace`
- Python 3.10+ for analysis script

## Migration Process

### Phase 1: Deep Analysis

**1.1 Inventory skill contents**

```bash
# List all files
Glob .claude/skills/<skill-name>/**/*

# Read main file
Read .claude/skills/<skill-name>/SKILL.md
```

**1.2 Analyze Python scripts**

For each `.py` file, parse imports using AST and categorize:
- **Stdlib**: No action needed
- **Common**: Document `pip install` requirement
- **Heavy**: Recommend venv

See [references/dependency-categories.md](references/dependency-categories.md) for full lists.

**1.3 Path portability check**

Scan ALL files for non-portable patterns:

| Pattern | Issue | Fix |
|---------|-------|-----|
| `C:\Users\...` | Windows hardcoded | `~/` or `Path.home()` |
| `/home/user/...` | Linux hardcoded | `~/` or `Path.home()` |
| `\\` backslashes | Windows-only | Forward slashes `/` |

**1.4 Security scan**

Check for exposed secrets: `api_key`, `password`, `token`, `secret`, connection strings.

### Phase 2: Migration Report

Present findings BEFORE any action:

```markdown
## Migration Analysis: {skill-name}

### Structure
- SKILL.md: ✅ Valid (142 lines)
- Scripts: 2 files | References: 1 file

### Dependencies
- Stdlib: os, sys, json
- Pip install: requests, pyyaml
- Heavy: None → No venv needed

### Issues
⚠️ 2 path issues | ❌ 1 security issue

### Recommendations
1. Fix paths  2. Remove API key  3. Document deps
```

### Phase 3: User Decision

Ask:
1. "Corriger les problèmes automatiquement?"
2. "Catégorie? (dev-tools, workflow, mcp, notion, media, infra)"
3. "Nom final: `julien-{category}-{name}` OK?"

### Phase 4: Execute Migration

```bash
# 1. Copy to marketplace
MARKETPLACE="$HOME/OneDrive/Coding/_Projets de code/2025.11 Claude Code MarketPlace"
cp -r .claude/skills/<local>/ "$MARKETPLACE/skills/julien-<category>-<name>/"

# 2. Update frontmatter name
Edit SKILL.md: name: julien-<category>-<name>

# 3. Add to sync config
Edit configs/sync-config.json: add to skills_to_sync

# 4. Regenerate triggers
python "$MARKETPLACE/scripts/generate-triggers.py"
```

### Phase 5: Verification

Verify:
- [ ] All files copied
- [ ] Frontmatter updated
- [ ] sync-config.json updated
- [ ] Triggers generated
- [ ] MCP-REQUIREMENTS.md generated (if .mcp.json present)

## MCP Configuration Handling

Skills using MCP servers (Playwright, Notion, etc.) require special attention during migration.

### What Gets Detected

| Item | Detection Method |
|------|------------------|
| `.mcp.json` file | File presence check |
| MCP server configs | JSON parsing of mcpServers |
| Environment variables | env keys extraction |
| Command requirements | npx, uvx, node, python detection |

### What Gets Generated

When `.mcp.json` is found, the migration script automatically generates:

**`MCP-REQUIREMENTS.md`** containing:
- List of required MCP servers
- Package names and commands
- Required environment variables
- Installation instructions with JSON config

### Post-Migration Steps for MCP Skills

1. Review generated `MCP-REQUIREMENTS.md`
2. Set required environment variables in target project
3. Verify npx/uvx available on target system
4. Test MCP server activation with `/mcp`

### Example MCP Analysis Output

```
## MCP Configuration
Servers: 1
  - playwright: @tontoko/fast-playwright-mcp

⚠️ Required environment variables:
  - PLAYWRIGHT_HEADLESS

Commands needed: npx
```

## Script Usage

```bash
# Analyze only (no migration)
python scripts/migrate-skill.py .claude/skills/my-skill --analyze-only

# Full migration
python scripts/migrate-skill.py .claude/skills/my-skill -c workflow

# With auto-fix
python scripts/migrate-skill.py .claude/skills/my-skill -c workflow --auto-fix

# JSON output
python scripts/migrate-skill.py .claude/skills/my-skill --json
```

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| "Target already exists" | Skill name conflict | Choose different name or delete existing |
| "Source not found" | Wrong path | Verify `.claude/skills/<name>/SKILL.md` exists |
| "Security issues found" | API keys detected | Remove secrets or use `--auto-fix` |
| "Frontmatter invalid" | Missing name/description | Fix YAML frontmatter first |

**Rollback:**
```bash
# Remove from marketplace
rm -rf "$MARKETPLACE/skills/julien-<category>-<name>"
# Local version remains intact
```

## Skill Chaining

### Skills Required Before
- None (standalone entry point)
- Optional: `julien-dev-tools-skill-creator` to create/improve skill first

### Input Expected
- Path to local skill (`.claude/skills/<name>/`)
- User approval for fixes
- Target category

### Output Produced
- **Format**: Migrated skill in marketplace
- **Side effects**: Updates sync-config.json, generates triggers
- **Duration**: 2-5 minutes

### Compatible Skills After
- **julien-dev-tools-skill-reviewer**: Review migrated skill quality
- **/sync**: Deploy to global `~/.claude/skills/`

### Called By
- Direct: "Migrate my-skill to marketplace"
- After creation: "Move this skill to marketplace"

### Tools Used
- `Read`: Analyze skill files
- `Glob`: Find all files
- `Grep`: Search paths/secrets patterns
- `Edit`: Fix issues, update configs
- `Bash`: Copy files, run scripts

### Visual Workflow

```
User: "Migrate my-skill"
    ↓
[PHASE 1] Analysis
    ├─► Inventory files
    ├─► Parse imports
    ├─► Check paths
    └─► Security scan
    ↓
[PHASE 2] Report → Present findings
    ↓
[PHASE 3] Decision
    ├─► Auto-fix? → Category? → Confirm name?
    ↓
[PHASE 4] Execute
    ├─► Copy to marketplace
    ├─► Update frontmatter
    └─► Update configs
    ↓
[PHASE 5] Verify → Done ✅
```

## Usage Example

**Scenario**: Migrate local deployment skill

**Command**: `Migrate .claude/skills/my-deploy to marketplace`

**Analysis Output**:
```
MIGRATION ANALYSIS: my-deploy
- SKILL.md: ✅ Valid (89 lines)
- Scripts: 1 Python file
- Dependencies: requests (pip install)
- Path issues: 1 (C:\Users\...)
- Security: ✅ Clean

Ready for migration!
```

**Dialog**:
```
Claude: "Catégorie? (dev-tools, workflow, mcp...)"
User: "workflow"
Claude: "Nom: julien-workflow-my-deploy. OK?"
User: "oui"
```

**Result**:
- Created: `marketplace/skills/julien-workflow-my-deploy/`
- Updated: `sync-config.json`, `skill-triggers.json`
- Next: Run `/sync` to deploy globally
