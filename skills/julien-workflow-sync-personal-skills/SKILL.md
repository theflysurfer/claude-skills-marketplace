---
name: julien-workflow-sync-personal-skills
description: Manual sync of core skills and marketplace. Use when automatic SessionStart/SessionEnd hooks need to be triggered manually, or to manage which skills are in the core set.
license: Apache-2.0
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
metadata:
  author: "Julien"
  version: "2.0.0"
  category: "workflow"
---

# Sync Personal Skills (Manual)

Manual synchronization of core skills and marketplace cache. Complements the automatic hooks that run on SessionStart/SessionEnd.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATIC (via Hooks)                        │
├─────────────────────────────────────────────────────────────────┤
│  SessionStart: git pull + sync 8 core skills                    │
│  SessionEnd:   git commit + push if changes                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MANUAL (via this Skill)                      │
├─────────────────────────────────────────────────────────────────┤
│  - Force sync when hooks didn't run                             │
│  - Add/remove skills from core set                              │
│  - Debug sync issues                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Core Skills (8 total)

These skills are synced to `~/.claude/skills/` and available globally:

| Category | Skills |
|----------|--------|
| **Dev Tools** | `julien-dev-tools-skill-creator-pro`, `julien-dev-tools-skill-reviewer`, `julien-dev-tools-claude-md-documenter` |
| **Workflow** | `julien-workflow-check-loaded-skills` |
| **Office** | `anthropic-office-pdf`, `anthropic-office-xlsx`, `anthropic-office-docx`, `anthropic-office-pptx` |

## Usage Examples

- "Sync my core skills manually"
- "Force pull the marketplace"
- "Add hostinger-nginx to my core skills"
- "Remove pdf from core skills"
- "Show sync status"

## Commands

### 1. Force Sync (run hooks manually)

```bash
# Pull marketplace + sync core skills
bash ~/.claude/scripts/sync-marketplace.sh

# Push changes if any
bash ~/.claude/scripts/push-marketplace.sh
```

### 2. Show Current Core Skills

```bash
cat ~/.claude/plugins/marketplaces/claude-skills-marketplace/skills/julien-workflow-sync-personal-skills/sync-config.json | jq -r '.skills_to_sync[]'
```

### 3. Add a Skill to Core Set

Edit `sync-config.json` and add the skill name to `skills_to_sync` array:

```bash
# Location in marketplace cache
~/.claude/plugins/marketplaces/claude-skills-marketplace/skills/julien-workflow-sync-personal-skills/sync-config.json
```

Then run sync:
```bash
bash ~/.claude/scripts/sync-marketplace.sh
```

### 4. Remove a Skill from Core Set

1. Remove from `sync-config.json`
2. Optionally delete from `~/.claude/skills/`:
```bash
rm -rf ~/.claude/skills/skill-name
```

### 5. Debug Sync Issues

```bash
# Check marketplace cache status
cd ~/.claude/plugins/marketplaces/claude-skills-marketplace && git status

# Check core skills directory
ls -la ~/.claude/skills/

# Run sync with debug
bash -x ~/.claude/scripts/sync-marketplace.sh
```

## File Locations

| File | Purpose |
|------|---------|
| `~/.claude/scripts/sync-marketplace.sh` | Pull + sync core skills |
| `~/.claude/scripts/push-marketplace.sh` | Commit + push changes |
| `~/.claude/settings.json` | Hook configuration |
| `~/.claude/skills/` | Core skills (global) |
| `~/.claude/plugins/marketplaces/claude-skills-marketplace/` | Marketplace cache |

## sync-config.json Format

```json
{
  "description": "Configuration for selective skill synchronization",
  "sync_enabled": true,
  "skills_to_sync": [
    "julien-dev-tools-skill-creator-pro",
    "julien-dev-tools-skill-reviewer",
    "julien-workflow-check-loaded-skills",
    "julien-dev-tools-claude-md-documenter",
    "anthropic-office-pdf",
    "anthropic-office-xlsx",
    "anthropic-office-docx",
    "anthropic-office-pptx"
  ]
}
```

## Notes

- Core skills are NOT in the marketplace `/plugin` list (no duplication)
- Marketplace contains only optional/project-specific plugins
- Hooks run automatically - this skill is for manual intervention only
