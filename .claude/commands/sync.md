---
description: Sync core skills and commands from marketplace to ~/.claude/
---

# Sync Marketplace to Global

Synchronize skills and commands from the marketplace to your global `~/.claude/` folder.

## What to sync

Read `configs/sync-config.json` for the list of:
- `skills_to_sync`: Skills to copy to `~/.claude/skills/`
- `commands_to_sync`: Commands to copy to `~/.claude/commands/`

## Execute

```bash
# 1. Create directories if needed
mkdir -p ~/.claude/skills ~/.claude/commands

# 2. Read config and sync skills
# For each skill in skills_to_sync:
cp -r skills/<skill-name> ~/.claude/skills/

# 3. Sync commands
cp .claude/commands/sync.md ~/.claude/commands/
cp .claude/commands/list-resources.md ~/.claude/commands/
```

## Quick command

```bash
cd "<marketplace-path>"
for skill in $(cat configs/sync-config.json | jq -r '.skills_to_sync[]'); do
  cp -r "skills/$skill" ~/.claude/skills/ 2>/dev/null && echo "✓ $skill"
done
for cmd in $(cat configs/sync-config.json | jq -r '.commands_to_sync[]'); do
  cp ".claude/commands/$cmd" ~/.claude/commands/ 2>/dev/null && echo "✓ $cmd"
done
```

## After sync

- Skills available globally in all projects
- Commands available with `/sync` and `/list-resources`
