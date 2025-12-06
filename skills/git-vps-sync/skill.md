---
name: git-vps-sync
description: Manage Git sync between VPS and GitHub for Hostinger srv759970. Handles unrelated histories, untracked files, diverged branches, and sync conflicts automatically.
license: Apache-2.0
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
metadata:
  author: "Julien"
  version: "1.0.0"
  category: "git-operations"
  keywords: ["git", "vps", "sync", "deployment", "hostinger"]
---

# Git VPS Sync - Hostinger srv759970

Automate Git synchronization between VPS and GitHub, handling common edge cases that occur during deployments.

## Server Info

- **Host**: 69.62.108.82
- **User**: automation
- **Primary Repo**: `/var/www/incluzhact`
- **GitHub**: https://github.com/theflysurfer/Site-web-Clem-2
- **Branches**: main (production), staging (preview)

## When to Use This Skill

Invoke automatically when:
- Git pull fails with "unrelated histories"
- Checkout blocked by untracked files
- VPS branch diverged from GitHub
- Merge conflicts during deployment
- Need to force-sync VPS to match GitHub state

## Common Scenarios

### 1. Unrelated Histories

**Problem**: VPS has independent commit history from GitHub

```bash
fatal: refusing to merge unrelated histories
```

**Solutions**:

#### Option A: Merge with allow-unrelated-histories (preserves VPS changes)
```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
git fetch origin main
git merge origin/main --allow-unrelated-histories -m "Merge GitHub into VPS"
EOF
```

**Use when**: VPS has important changes to keep

#### Option B: Hard reset to GitHub (discards VPS changes)
```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
git fetch origin main
git reset --hard origin/main
EOF
```

**Use when**: VPS should exactly match GitHub (most common)

**⚠️ Always verify user intent before hard reset**

### 2. Untracked Files Blocking Operations

**Problem**: Files like `CLAUDE.md`, `claude.md`, `nul` block checkout/merge

```bash
error: The following untracked working tree files would be overwritten by checkout:
	CLAUDE.md
Please move or remove them before you switch branches.
```

**Solution**: Clean untracked files
```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact

# List untracked files first (safety check)
echo "Untracked files to remove:"
git status --porcelain | grep '^??'

# Remove untracked files
git clean -fd

# Or remove specific files
rm -f CLAUDE.md claude.md nul
EOF
```

**Safety**: Always list files before cleaning

### 3. Branch Divergence

**Problem**: VPS and GitHub histories have diverged

```bash
Your branch and 'origin/main' have diverged,
and have 5 and 10 different commits each, respectively.
```

**Diagnosis**:
```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact

# Show divergence
git log --oneline --graph --all --decorate -20

# Count commits ahead/behind
git rev-list --count origin/main..HEAD  # VPS ahead
git rev-list --count HEAD..origin/main  # VPS behind
EOF
```

**Solutions**:

#### If VPS ahead (has new commits):
```bash
# Rebase VPS commits onto GitHub (rewrites history)
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git rebase origin/main'

# Or merge (preserves history)
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git merge origin/main'
```

#### If VPS behind (outdated):
```bash
# Simple fast-forward pull
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git pull origin main'
```

#### If both diverged (conflict):
```bash
# Hard reset to match GitHub (safest for deployments)
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
git fetch origin main
git reset --hard origin/main
EOF
```

### 4. Merge Conflicts

**Problem**: Conflicting changes between VPS and GitHub

**Diagnosis**:
```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact

# List conflicted files
git diff --name-only --diff-filter=U

# Show conflict details
git status
EOF
```

**Solutions**:

#### Abort merge and reset:
```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
git merge --abort
git reset --hard origin/main
EOF
```

#### Manual resolution (rare):
```bash
# 1. Identify conflicts
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git diff --name-only --diff-filter=U'

# 2. Read conflicted files
ssh automation@69.62.108.82 'cd /var/www/incluzhact && cat path/to/conflicted/file.ts'

# 3. Resolve manually or abort
```

## Pre-Deployment Sync Workflow

Complete workflow for safe VPS sync before deployment:

```bash
# Step 1: Check current VPS state
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
echo "=== Current branch ==="
git branch --show-current

echo "=== Status ==="
git status --short

echo "=== Last 5 commits ==="
git log --oneline -5

echo "=== Remote comparison ==="
git fetch origin
git log --oneline HEAD..origin/$(git branch --show-current) | wc -l || echo "Up to date"
EOF

# Step 2: Clean untracked files (if any)
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
if [ -n "$(git status --porcelain | grep '^??')" ]; then
  echo "Cleaning untracked files..."
  git clean -fd
fi
EOF

# Step 3: Sync with GitHub (choose method)
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
BRANCH=$(git branch --show-current)

# Method A: Normal pull (works if no divergence)
if git pull origin $BRANCH 2>&1 | grep -q "fatal\|error"; then
  echo "Pull failed, using hard reset..."
  git fetch origin $BRANCH
  git reset --hard origin/$BRANCH
else
  echo "Pull successful"
fi
EOF

# Step 4: Verify sync
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
echo "=== Sync verification ==="
git log --oneline -3
git status
EOF
```

## Quick Commands

### Force sync VPS to GitHub (nuclear option)
```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
BRANCH=$(git branch --show-current)
git clean -fd
git fetch origin $BRANCH
git reset --hard origin/$BRANCH
echo "VPS now matches GitHub $BRANCH"
EOF
```

### Check if VPS needs sync
```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
git fetch origin
BRANCH=$(git branch --show-current)
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/$BRANCH)

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "✅ VPS is up to date"
else
  echo "⚠️  VPS needs sync"
  echo "Local:  $LOCAL"
  echo "Remote: $REMOTE"
fi
EOF
```

### Switch VPS branch safely
```bash
BRANCH="staging"  # or "main"

ssh automation@69.62.108.82 << EOF
cd /var/www/incluzhact

# Clean workspace
git clean -fd
git reset --hard

# Switch branch
git checkout $BRANCH
git pull origin $BRANCH

echo "Switched to $BRANCH"
git log --oneline -3
EOF
```

## Safety Checks

Before any destructive operation (hard reset, clean):

1. **Verify current state**:
   ```bash
   ssh automation@69.62.108.82 'cd /var/www/incluzhact && git status'
   ```

2. **Check for uncommitted changes**:
   ```bash
   ssh automation@69.62.108.82 'cd /var/www/incluzhact && git diff --stat'
   ```

3. **Ask user if unsure**:
   ```bash
   # Use AskUserQuestion tool if VPS has diverged commits
   ```

4. **Verify after sync**:
   ```bash
   ssh automation@69.62.108.82 'cd /var/www/incluzhact && git log --oneline -5'
   ```

## Troubleshooting

### "Permission denied" during git operations

```bash
# Check SSH connection
ssh automation@69.62.108.82 'whoami'

# Check Git repo ownership
ssh automation@69.62.108.82 'ls -la /var/www/incluzhact/.git'

# Fix ownership if needed
ssh automation@69.62.108.82 'sudo chown -R automation:automation /var/www/incluzhact'
```

### "Not a git repository"

```bash
# Verify repo exists
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git status'

# Re-initialize if needed (DANGEROUS)
ssh automation@69.62.108.82 << 'EOF'
cd /var/www
rm -rf incluzhact
git clone https://github.com/theflysurfer/Site-web-Clem-2.git incluzhact
cd incluzhact
git checkout staging  # or main
EOF
```

### "Could not resolve host 'github.com'"

```bash
# Check VPS internet connection
ssh automation@69.62.108.82 'ping -c 3 github.com'

# Check DNS
ssh automation@69.62.108.82 'cat /etc/resolv.conf'
```

## Integration with Deployment

Use this skill **before** building and restarting PM2:

```bash
# 1. Sync Git (this skill)
bash git-vps-sync workflow

# 2. Install dependencies
ssh automation@69.62.108.82 'cd /var/www/incluzhact && npm install'

# 3. Build
ssh automation@69.62.108.82 'cd /var/www/incluzhact && npm run build'

# 4. Restart PM2
ssh automation@69.62.108.82 'pm2 restart incluzhact'
```

## Decision Matrix

| Scenario | Recommended Action | Risk |
|----------|-------------------|------|
| VPS behind GitHub | `git pull` | Low |
| Untracked files | `git clean -fd` | Medium |
| Diverged histories | `git reset --hard origin/branch` | High |
| VPS has unique commits | Ask user, then merge or reset | High |
| Merge conflict | Abort + reset | Medium |

## Best Practices

1. **Always fetch before comparing**: `git fetch origin`
2. **Check status first**: `git status` before destructive ops
3. **List before cleaning**: Show untracked files before `git clean`
4. **Verify after sync**: `git log --oneline -3`
5. **Use hard reset for deployments**: VPS should match GitHub exactly
6. **Ask user for diverged commits**: Don't lose work without confirmation

## Related Skills

- **hostinger-ssh**: SSH connection management
- **hostinger-deployment**: Full deployment workflow
- **deployment-verifier**: Post-deployment verification

## Quick Reference

```bash
# Safe sync (try pull, fallback to reset)
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git pull || (git fetch && git reset --hard origin/$(git branch --show-current))'

# Nuclear option (match GitHub exactly)
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git clean -fd && git fetch origin && git reset --hard origin/$(git branch --show-current)'

# Check if sync needed
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git fetch && git status'
```
