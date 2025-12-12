---
description: Sync core skills, commands, and scripts from marketplace to ~/.claude/
---

# Sync Marketplace to Global

Synchronize skills, commands, and scripts from the marketplace to your global `~/.claude/` folder.

## What to sync

Read `configs/sync-config.json` for the list of:
- `skills_to_sync`: Skills to copy to `~/.claude/skills/`
- `commands_to_sync`: Commands to copy to `~/.claude/commands/`
- `scripts_to_sync`: Scripts to copy to `~/.claude/scripts/`
- `configs_to_sync`: Configs to copy to `~/.claude/configs/`

## Execute

```bash
# 1. Create directories
mkdir -p ~/.claude/skills ~/.claude/commands ~/.claude/scripts

# 2. Sync skills
for skill in $(cat configs/sync-config.json | jq -r '.skills_to_sync[]'); do
  cp -r "skills/$skill" ~/.claude/skills/ 2>/dev/null && echo "✓ skill: $skill"
done

# 3. Sync commands
for cmd in $(cat configs/sync-config.json | jq -r '.commands_to_sync[]'); do
  cp ".claude/commands/$cmd" ~/.claude/commands/ 2>/dev/null && echo "✓ cmd: $cmd"
done

# 4. Sync scripts
for script in $(cat configs/sync-config.json | jq -r '.scripts_to_sync[]'); do
  cp "scripts/$script" ~/.claude/scripts/ 2>/dev/null && echo "✓ script: $script"
done
```

## After sync

- Skills available globally in all projects
- Commands available with `/sync` and `/list-resources`
- Scripts available for hooks (semantic-router, tracking)
