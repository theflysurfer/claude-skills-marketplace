---
name: julien-workflow-sync-personal-skills
description: Synchronizes skills from this marketplace repository to ~/.claude/skills/ for global availability across all projects. Also commits and pushes changes to GitHub.
license: Apache-2.0
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
metadata:
  author: "Julien"
  version: "1.0.0"
  category: "development"
---

# Sync Personal Skills

This skill synchronizes skills from the marketplace repository to your personal `~/.claude/skills/` directory, making them globally available across all your Claude Code projects.

## Purpose

- **Push skills** from marketplace repo to `~/.claude/skills/` for personal use
- **Update marketplace.json** with new skills automatically
- **Commit and push** changes to GitHub repository

## Workflow

When you activate this skill, Claude will:

1. **Scan** the `skills/` directory in the marketplace repository
2. **Copy** each skill folder to `~/.claude/skills/`
3. **Update** `.claude-plugin/marketplace.json` with any new skills
4. **Commit** changes to the local git repository
5. **Push** changes to GitHub remote

## Usage Examples

- "Sync my skills to personal directory"
- "Push all marketplace skills to ~/.claude"
- "Update my personal skills and commit to GitHub"
- "Deploy skills globally and push to remote"

## Instructions

### Step 1: Identify Marketplace Repository

First, determine the marketplace repository root:
- Look for `.claude-plugin/marketplace.json`
- This is the source of truth for skills

### Step 2: Scan Skills Directory

List all skill directories in `skills/`:
```bash
ls -d skills/*/
```

For each skill directory found:
- Verify it contains a `SKILL.md` file
- Read the YAML frontmatter to get skill metadata (name, description, version)

### Step 3: Copy Skills to Personal Directory

For each valid skill:

```bash
# Create personal skills directory if it doesn't exist
mkdir -p ~/.claude/skills/

# Remove existing skill directory if it exists
rm -rf ~/.claude/skills/skill-name

# Copy the skill
cp -r skills/skill-name ~/.claude/skills/
```

**Important**:
- Remove old directory first, then copy fresh version
- This ensures clean sync without leftover files
- Preserve directory structure
- Skip the `julien-workflow-sync-personal-skills` skill itself (avoid recursion)

### Step 4: Update marketplace.json

Read `.claude-plugin/marketplace.json` and check the `plugins` array.

For each skill found in `skills/` directory:
- Check if it already exists in the `plugins` array
- If NOT found, add a new entry:

```json
{
  "name": "skill-name",
  "source": "./skill-name",
  "description": "Description from SKILL.md frontmatter",
  "version": "Version from SKILL.md metadata or 1.0.0",
  "license": "License from SKILL.md or Apache-2.0",
  "category": "Category from SKILL.md metadata or general"
}
```

Write the updated marketplace.json back to disk.

### Step 5: Commit to Git

Stage all changes and create a commit:

```bash
git add .
git commit -m "$(cat <<'EOF'
Sync skills to personal directory and update marketplace

- Updated marketplace.json with latest skills
- Synced skills to ~/.claude/skills/
- Skills are now globally available

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Step 6: Push to GitHub

```bash
git push origin master
```

Or use the current branch if not on master:
```bash
git push origin $(git branch --show-current)
```

## Output Format

Provide a summary after completion:

```
✅ Sync Complete!

Skills synchronized to ~/.claude/skills/:
- docker-optimizer (v1.0.0)
- sync-personal-skills (v1.0.0)
- [other skills...]

📝 marketplace.json updated with X skills

📦 Git commit created: [commit hash]
🚀 Pushed to GitHub: theflysurfer/claude-skills-marketplace

Your skills are now globally available in all Claude Code projects!
```

## Error Handling

### If marketplace.json is invalid:
- Show clear error message
- Do not proceed with sync
- Suggest fixing the JSON syntax

### If git push fails:
- Show the error message
- Confirm if local commit succeeded
- Suggest manual push or checking remote configuration

### If ~/.claude/skills/ cannot be created:
- Check permissions
- Suggest creating it manually
- Provide the exact command to run

## Safety Checks

Before syncing:
1. Verify we're in a git repository
2. Verify `.claude-plugin/marketplace.json` exists
3. Verify `skills/` directory exists
4. Check for uncommitted changes (warn user)

## Exclusions

Do NOT sync:
- `skills/README.md` (documentation file, not a skill)
- `julien-workflow-sync-personal-skills` itself (avoid recursion)
- Any hidden files or directories starting with `.`
- Any `node_modules/` or `__pycache__/` directories

## Notes

- This skill only pushes FROM marketplace TO personal directory
- It does not pull changes back from ~/.claude/skills/
- The marketplace repository is the single source of truth
- Always develop/edit skills in the marketplace repo, then sync
