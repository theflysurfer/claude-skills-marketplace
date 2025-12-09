---
name: julien-infra-hostinger-deployment
description: Complete deployment workflow for INCLUZ'HACT on Hostinger VPS srv759970. Orchestrates Git sync, build, PM2 restart, and verification for production and preview environments.
license: Apache-2.0
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
  - Skill
metadata:
  author: "Julien"
  version: "2.0.0"
  category: "deployment"
  keywords: ["deployment", "hostinger", "pm2", "nginx", "automation"]
  requires-skills: ["git-vps-sync", "deployment-verifier"]
---

# Hostinger Deployment - INCLUZ'HACT

Complete automated deployment workflow for INCLUZ'HACT website on Hostinger VPS srv759970.

## Overview

This skill orchestrates the full deployment pipeline:
1. **Pre-deployment checks** (disk space, Git status, PM2 health)
2. **Git sync** (using `julien-infra-git-vps-sync` skill)
3. **Build** (npm install + npm run build)
4. **PM2 restart** (graceful restart)
5. **Verification** (using `julien-infra-deployment-verifier` skill)
6. **Rollback** (if deployment fails)

## Server Info

- **Host**: 69.62.108.82
- **User**: automation
- **Repo**: `/var/www/incluzhact`
- **GitHub**: https://github.com/theflysurfer/Site-web-Clem-2

## Environments

| Environment | Branch | URL | Port | PM2 App |
|-------------|--------|-----|------|---------|
| **Production** | main | https://incluzhact.fr | 5173 | incluzhact |
| **Preview** | staging | https://preview.incluzhact.fr | 5174 | incluzhact-preview |

## When to Use This Skill

Invoke automatically when:
- User requests deployment to production or preview
- Code pushed to main or staging branch
- Manual deployment needed after code changes
- Rollback required after failed deployment

## Complete Deployment Workflow

### 1. Pre-Deployment Checks

Run before any deployment to ensure VPS is ready:

```bash
ssh automation@69.62.108.82 << 'EOF'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Pre-Deployment Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check 1: Disk space
echo "📦 Checking disk space..."
DISK_AVAIL=$(df -h /var/www | tail -1 | awk '{print $4}' | sed 's/G//')
if (( $(echo "$DISK_AVAIL < 5" | bc -l) )); then
  echo "❌ WARNING: Low disk space ($DISK_AVAIL GB available)"
  echo "   Run space reclaim before deploying"
else
  echo "✅ Disk space OK ($DISK_AVAIL GB available)"
fi

echo ""

# Check 2: Git repository status
echo "📝 Checking Git repository..."
cd /var/www/incluzhact
if [ -d .git ]; then
  echo "✅ Git repository exists"
  BRANCH=$(git branch --show-current)
  echo "   Current branch: $BRANCH"

  # Check for uncommitted changes
  if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Uncommitted changes detected:"
    git status --short
  else
    echo "✅ Working tree clean"
  fi
else
  echo "❌ ERROR: Not a Git repository!"
  exit 1
fi

echo ""

# Check 3: PM2 processes
echo "🔄 Checking PM2 processes..."
pm2 list | grep -E "(incluzhact|Name)" || echo "❌ PM2 apps not found"

echo ""

# Check 4: Port availability
echo "🌐 Checking ports..."
if ss -tuln | grep -q ":5173"; then
  echo "✅ Port 5173 (production) in use"
else
  echo "⚠️  Port 5173 not listening"
fi

if ss -tuln | grep -q ":5174"; then
  echo "✅ Port 5174 (preview) in use"
else
  echo "⚠️  Port 5174 not listening"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Pre-deployment checks complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
EOF
```

**Decision Points**:
- ❌ Disk space < 5 GB → Run `julien-infra-hostinger-space-reclaim` first
- ⚠️ Uncommitted changes → Ask user if safe to discard
- ❌ PM2 apps not running → Start them before deploying

### 2. Git Sync

Use `julien-infra-git-vps-sync` skill to synchronize VPS with GitHub:

```bash
# Invoke git-vps-sync skill
# This handles:
# - Untracked files
# - Unrelated histories
# - Branch divergence
# - Merge conflicts
```

**Alternative**: Manual sync if skill not available:

```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
BRANCH=$(git branch --show-current)

echo "🔄 Syncing Git repository..."

# Clean untracked files
git clean -fd

# Fetch latest
git fetch origin $BRANCH

# Try pull, fallback to reset
if git pull origin $BRANCH 2>&1 | grep -q "fatal\|error"; then
  echo "⚠️  Pull failed, using hard reset..."
  git reset --hard origin/$BRANCH
else
  echo "✅ Pull successful"
fi

echo "✅ Git sync complete"
git log --oneline -3
EOF
```

### 3. Install Dependencies

```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact

echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
  echo "✅ Dependencies installed"
else
  echo "❌ npm install failed!"
  exit 1
fi
EOF
```

**Red Flags**:
- ❌ `EACCES` permission denied → Fix ownership
- ❌ Network timeout → Check VPS internet connection
- ❌ Package conflicts → Clear node_modules and retry

### 4. Build Application

```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact

echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful"

  # Verify build artifacts
  if [ -d dist/public ]; then
    SIZE=$(du -sh dist/public | awk '{print $1}')
    echo "   Build size: $SIZE"
  else
    echo "❌ Build artifacts not found!"
    exit 1
  fi
else
  echo "❌ Build failed!"
  exit 1
fi
EOF
```

**Red Flags**:
- ❌ TypeScript errors → Fix before deploying
- ❌ Missing files → Check Git sync
- ❌ Out of memory → Increase swap or reduce build concurrency

### 5. Restart PM2

```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact

echo "🔄 Restarting PM2 application..."

# Determine which app to restart based on current branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ]; then
  APP="incluzhact"
  ENV="production"
elif [ "$BRANCH" = "staging" ]; then
  APP="incluzhact-preview"
  ENV="preview"
else
  echo "⚠️  Unknown branch: $BRANCH"
  echo "   Assuming production (incluzhact)"
  APP="incluzhact"
  ENV="production"
fi

echo "   Target: $APP ($ENV)"

# Restart with 0-downtime
pm2 reload $APP --update-env

if [ $? -eq 0 ]; then
  echo "✅ PM2 restart successful"
  pm2 list | grep $APP
else
  echo "❌ PM2 restart failed!"
  pm2 logs $APP --lines 20 --nostream
  exit 1
fi
EOF
```

**PM2 Commands**:
- `pm2 reload` → 0-downtime restart (cluster mode)
- `pm2 restart` → Stop then start (brief downtime)
- `pm2 stop` → Stop without restart

### 6. Post-Deployment Verification

Use `julien-infra-deployment-verifier` skill to confirm deployment success:

```bash
# Invoke deployment-verifier skill
# This checks:
# - PM2 status
# - HTTP status codes
# - SSL certificates
# - Error logs
# - Takes screenshots
```

**Alternative**: Manual verification if skill not available:

```bash
# Wait for PM2 to stabilize
sleep 10

# Check PM2
ssh automation@69.62.108.82 'pm2 list | grep incluzhact'

# Check HTTP
curl -I https://incluzhact.fr
curl -I https://preview.incluzhact.fr

# Check logs for errors
ssh automation@69.62.108.82 'pm2 logs incluzhact --lines 50 --nostream | grep -i "error" || echo "✅ No errors"'
```

### 7. Deployment Logging

Log deployment for audit trail:

```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact

# Create deployment log
LOG_DIR="/var/www/incluzhact/logs"
mkdir -p $LOG_DIR

LOG_FILE="$LOG_DIR/deployments.log"

echo "$(date '+%Y-%m-%d %H:%M:%S') | Branch: $(git branch --show-current) | Commit: $(git rev-parse --short HEAD) | User: $(whoami)" >> $LOG_FILE

echo "✅ Deployment logged to $LOG_FILE"
EOF
```

## Complete Deployment Script

Save as `deploy.sh` or run directly:

```bash
#!/bin/bash

# Configuration
TARGET_ENV=${1:-preview}  # production or preview
BRANCH=${2:-staging}      # main or staging

if [ "$TARGET_ENV" = "production" ]; then
  BRANCH="main"
  APP="incluzhact"
  URL="https://incluzhact.fr"
elif [ "$TARGET_ENV" = "preview" ]; then
  BRANCH="staging"
  APP="incluzhact-preview"
  URL="https://preview.incluzhact.fr"
else
  echo "❌ Invalid environment: $TARGET_ENV"
  echo "Usage: $0 [production|preview]"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Deploying to $TARGET_ENV ($BRANCH)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Pre-deployment checks
echo "📋 Step 1/7: Pre-deployment checks..."
ssh automation@69.62.108.82 << EOF
  cd /var/www/incluzhact
  df -h /var/www | tail -1
  git status --short
  pm2 list | grep incluzhact
EOF
echo ""

# Step 2: Git sync
echo "🔄 Step 2/7: Syncing Git repository..."
ssh automation@69.62.108.82 << EOF
  cd /var/www/incluzhact
  git checkout $BRANCH
  git clean -fd
  git fetch origin $BRANCH
  git reset --hard origin/$BRANCH
  echo "Current commit: \$(git rev-parse --short HEAD)"
EOF
echo ""

# Step 3: Install dependencies
echo "📦 Step 3/7: Installing dependencies..."
ssh automation@69.62.108.82 'cd /var/www/incluzhact && npm install' || {
  echo "❌ Deployment failed at npm install"
  exit 1
}
echo ""

# Step 4: Build
echo "🔨 Step 4/7: Building application..."
ssh automation@69.62.108.82 'cd /var/www/incluzhact && npm run build' || {
  echo "❌ Deployment failed at build"
  exit 1
}
echo ""

# Step 5: Restart PM2
echo "🔄 Step 5/7: Restarting PM2..."
ssh automation@69.62.108.82 "pm2 reload $APP --update-env" || {
  echo "❌ Deployment failed at PM2 restart"
  ssh automation@69.62.108.82 "pm2 logs $APP --lines 20 --nostream"
  exit 1
}
echo ""

# Step 6: Wait for stabilization
echo "⏳ Step 6/7: Waiting for PM2 to stabilize..."
sleep 10
echo ""

# Step 7: Verification
echo "✅ Step 7/7: Verifying deployment..."
HTTP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' $URL)
if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ HTTP status: $HTTP_STATUS"
else
  echo "❌ HTTP status: $HTTP_STATUS"
fi

ssh automation@69.62.108.82 "pm2 list | grep $APP"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment to $TARGET_ENV complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Site URL: $URL"
echo "📊 PM2 logs: ssh automation@69.62.108.82 'pm2 logs $APP'"
```

## Usage Examples

### Deploy to preview (default)
```bash
# From local machine
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git checkout staging && git pull origin staging && npm install && npm run build && pm2 restart incluzhact-preview'

# Or using script
bash deploy.sh preview
```

### Deploy to production
```bash
# From local machine
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git checkout main && git pull origin main && npm install && npm run build && pm2 restart incluzhact'

# Or using script
bash deploy.sh production
```

### Deploy specific commit
```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
git fetch origin
git checkout abc1234  # specific commit hash
npm install
npm run build
pm2 restart incluzhact
EOF
```

## Rollback Procedure

If deployment fails, rollback to previous version:

### Quick rollback (last commit)
```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact

echo "🔄 Rolling back to previous commit..."

# Go back 1 commit
git reset --hard HEAD^

# Rebuild
npm install
npm run build

# Restart PM2
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ]; then
  pm2 restart incluzhact
else
  pm2 restart incluzhact-preview
fi

echo "✅ Rollback complete"
git log --oneline -3
EOF
```

### Rollback to specific commit
```bash
ROLLBACK_COMMIT="abc1234"

ssh automation@69.62.108.82 << EOF
cd /var/www/incluzhact

echo "🔄 Rolling back to commit $ROLLBACK_COMMIT..."

git reset --hard $ROLLBACK_COMMIT
npm install
npm run build

BRANCH=\$(git branch --show-current)
if [ "\$BRANCH" = "main" ]; then
  pm2 restart incluzhact
else
  pm2 restart incluzhact-preview
fi

echo "✅ Rollback complete"
git log --oneline -3
EOF
```

### Emergency rollback (keep old process running)
```bash
# If new deployment is broken, rollback and restart
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact

# Rollback code
git reset --hard HEAD^

# DON'T rebuild, just restart with old build
pm2 restart incluzhact incluzhact-preview

echo "✅ Emergency rollback complete"
EOF
```

## Troubleshooting

### Deployment hangs at npm install

**Cause**: Network timeout or corrupted node_modules

**Solution**:
```bash
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
EOF
```

### Build fails with TypeScript errors

**Cause**: Code not tested locally before deploying

**Solution**:
```bash
# Test locally first
npm run check
npm run build

# If passing locally, sync might be needed
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git status'
```

### PM2 restart fails

**Cause**: PM2 configuration missing or corrupted

**Solution**:
```bash
# Check PM2 config
ssh automation@69.62.108.82 'cat /var/www/incluzhact/ecosystem.config.cjs'

# Restart PM2 daemon
ssh automation@69.62.108.82 'pm2 kill && pm2 resurrect'

# Or delete and recreate app
ssh automation@69.62.108.82 'pm2 delete incluzhact && pm2 start ecosystem.config.cjs --only incluzhact'
```

### HTTP 502 after deployment

**Cause**: Build artifacts corrupted or PM2 not listening

**Solution**:
```bash
# Check PM2 logs
ssh automation@69.62.108.82 'pm2 logs incluzhact --lines 100'

# Check if port listening
ssh automation@69.62.108.82 'ss -tuln | grep 5173'

# Rebuild and restart
ssh automation@69.62.108.82 'cd /var/www/incluzhact && npm run build && pm2 restart incluzhact'
```

## Best Practices

1. **Always test locally first**: `npm run check && npm run build`
2. **Deploy to preview before production**: Test on staging branch
3. **Monitor logs during deployment**: `pm2 logs --follow`
4. **Keep deployment history**: Log every deployment
5. **Have rollback plan ready**: Know previous stable commit
6. **Verify after deployment**: Use `julien-infra-deployment-verifier` skill
7. **Deploy during low traffic**: Minimize user impact
8. **Backup before major changes**: Copy `/var/www/incluzhact` if risky

## Monitoring Post-Deployment

### First 5 minutes (critical)
```bash
# Watch PM2 logs
ssh automation@69.62.108.82 'pm2 logs incluzhact --follow'

# Check for errors
ssh automation@69.62.108.82 'pm2 logs incluzhact --err --lines 50'

# Monitor HTTP status
watch -n 5 'curl -s -o /dev/null -w "%{http_code}" https://incluzhact.fr'
```

### First hour
- Check error rates in logs
- Verify all routes accessible
- Test contact form
- Check SSL certificate
- Monitor PM2 memory usage

### First 24 hours
- Review deployment logs
- Check for memory leaks
- Verify no increased error rates
- Confirm no user complaints

## Deployment Checklist

Before deploying:
- [ ] Code tested locally (`npm run dev`)
- [ ] TypeScript checks pass (`npm run check`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Changes committed and pushed to GitHub
- [ ] VPS has sufficient disk space (>5 GB)
- [ ] PM2 apps are healthy
- [ ] SSL certificates valid (>30 days)

After deploying:
- [ ] PM2 status is `online`
- [ ] HTTP status code is 200
- [ ] No errors in PM2 logs
- [ ] Screenshots show correct UI
- [ ] All routes accessible
- [ ] Deployment logged

## 🔗 Skill Chaining

### Skills Required Before
- **julien-infra-git-vps-sync** (obligatoire): Synchronizes VPS Git repository with GitHub before building
- **julien-infra-hostinger-ssh** (recommandé): Ensures SSH access is configured
- **julien-infra-hostinger-space-reclaim** (optionnel): If disk space < 5 GB, reclaim space first

### Input Expected
- Code pushed to GitHub: `main` (production) or `staging` (preview) branch
- SSH access to VPS configured: `automation@69.62.108.82`
- VPS Git repository synchronized (via git-vps-sync skill)
- File: `ecosystem.config.cjs` exists on VPS at `/var/www/incluzhact/`
- Sufficient disk space: >5 GB available

### Output Produced
- **Format**: Application deployed and running on VPS
- **URLs**:
  - Production: https://incluzhact.fr (port 5173, PM2: incluzhact)
  - Preview: https://preview.incluzhact.fr (port 5174, PM2: incluzhact-preview)
- **Side effects**:
  - PM2 process restarted (`incluzhact` or `incluzhact-preview`)
  - New Git commit checked out on VPS
  - npm dependencies installed/updated
  - Production build generated in `/var/www/incluzhact/dist/`
  - Deployment logged to `/var/www/incluzhact/logs/deployments.log`
- **Duration**: 2-4 minutes (npm install 60s + build 60-90s + restart 5s + verification 30s)

### Compatible Skills After

**Obligatoires:**
- **julien-infra-deployment-verifier**: Verifies deployment success (PM2 status, HTTP, SSL, logs, screenshots)
- **julien-infra-hostinger-nginx** (obligatoire): Configure/verify Nginx reverse proxy with IPv6 support for proper SSL/SNI

**Recommandés:**
- **julien-infra-nginx-audit**: Audit Nginx security configuration after deployment changes

**Optionnels:**
- **julien-infra-hostinger-maintenance**: Schedule regular maintenance after deployment
- Accessibility audit: Check WCAG compliance (important for INCLUZ'HACT)
- Performance monitoring: Lighthouse scores post-deployment

### Called By
- Direct user invocation: "Deploy to production/preview"
- Git hooks: `post-push.sh` hook after `git push origin staging|main` (if configured)
- Manual deployment: When troubleshooting or deploying specific commits

### Tools Used
- `Bash` (usage: SSH commands, npm install/build, pm2 restart, git operations)
- `Read` (usage: verify ecosystem.config.cjs exists before deployment)
- `Write` (usage: create deployment logs, backup configs)
- `AskUserQuestion` (usage: confirm production deployment if risky changes detected)
- `Skill` (usage: invoke git-vps-sync and deployment-verifier skills)

### Visual Workflow

```
User: git push origin staging
    ↓
Pre-deployment checks (disk space, Git status, PM2 health)
    ↓
julien-infra-git-vps-sync (step 2/7)
    ├─► git clean -fd
    ├─► git fetch origin staging
    └─► git reset --hard origin/staging
    ↓
julien-infra-hostinger-deployment (THIS SKILL)
    ├─► npm install (step 3/7)
    ├─► npm run build (step 4/7)
    ├─► pm2 reload incluzhact-preview --update-env (step 5/7)
    ├─► Wait 10s for stabilization (step 6/7)
    └─► Log deployment to deployments.log
    ↓
julien-infra-hostinger-nginx (OBLIGATOIRE)
    ├─► Verify reverse proxy config
    ├─► Check IPv6 listeners ([::]:80, [::]:443)
    └─► Ensure correct SSL certificate for domain
    ↓
julien-infra-deployment-verifier (step 7/7, OBLIGATOIRE)
    ├─► Check PM2 status (online, uptime >10s)
    ├─► HTTP status code (200)
    ├─► SSL certificate validity
    ├─► Error logs check
    └─► Screenshots of deployed UI
    ↓
[Optional next steps]
    ├─► julien-infra-nginx-audit (security check)
    ├─► Accessibility audit (WCAG compliance)
    └─► Performance monitoring (Lighthouse)
```

### Usage Example

**Scenario**: Deploy new feature to preview environment for client testing

**Command**:
```bash
git push origin staging
# Or manually: "Deploy to preview environment"
```

**Result**:
- Site updated on https://preview.incluzhact.fr
- Deployment completes in ~2-4 minutes
- PM2 logs confirm successful restart: `pm2 logs incluzhact-preview --lines 20`
- Changes visible immediately (hard refresh: Ctrl+Shift+R)
- Nginx proxy verified with IPv6 support
- Deployment logged with timestamp and commit hash

## Related Skills

- **julien-infra-git-vps-sync**: Pre-deployment Git synchronization
- **julien-infra-deployment-verifier**: Post-deployment verification
- **julien-infra-hostinger-nginx**: Nginx reverse proxy configuration (OBLIGATOIRE)
- **julien-infra-hostinger-ssh**: SSH connection management
- **julien-infra-hostinger-space-reclaim**: Disk space management
- **julien-infra-nginx-audit**: Nginx security audit

## Quick Reference

```bash
# Deploy to preview
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git checkout staging && git pull origin staging && npm install && npm run build && pm2 restart incluzhact-preview'

# Deploy to production
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git checkout main && git pull origin main && npm install && npm run build && pm2 restart incluzhact'

# Rollback
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git reset --hard HEAD^ && npm run build && pm2 restart incluzhact'

# Check status
ssh automation@69.62.108.82 'pm2 list && curl -I https://incluzhact.fr'
```
