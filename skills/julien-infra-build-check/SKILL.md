---
name: build-check
description: Verify build integrity and run pre-deployment checks for the Jokers Hockey project. Use this when preparing to deploy, testing the build, or ensuring code quality before production.
---

# Build Check and Quality Assurance

This skill performs comprehensive build verification and quality checks before deployment.

## When to Use This Skill

Activate when the user requests:
- "Check if the build works"
- "Test the build"
- "Verify before deploying"
- "Run quality checks"
- "Make sure everything builds"
- "Pre-deployment check"
- "Is it ready to deploy?"

## Build Verification Process

### 1. TypeScript Compilation Check

```bash
# Check TypeScript without emitting files
npm run check

# Expected output: No errors
# If errors found, fix before proceeding
```

### 2. Full Build Test

```bash
# Clean previous build
rm -rf dist/

# Run full build
npm run build

# This runs:
# 1. vite build (frontend)
# 2. esbuild server/index.ts (backend)
```

### 3. Verify Build Output

```bash
# Check dist structure
ls -la dist/
ls -la dist/public/

# Expected structure:
# dist/
# ├── index.js        (server bundle ~5KB)
# └── public/
#     ├── index.html  (~2KB)
#     ├── assets/
#     │   ├── index-[hash].css  (~70KB)
#     │   ├── index-[hash].js   (~350KB)
#     │   └── [images].png
#     └── favicon.png
```

### 4. Bundle Size Check

```bash
# Check bundle sizes (warnings if too large)
du -sh dist/public/assets/*.js
du -sh dist/public/assets/*.css

# Ideal sizes:
# - JS bundle: < 500KB (gzipped < 150KB)
# - CSS bundle: < 100KB (gzipped < 20KB)
# - Total assets: < 20MB
```

## Quality Checks

### Code Quality

```bash
# TypeScript compilation
npm run check

# Check for common issues
grep -r "console.log" client/src/ || echo "No console.logs found"
grep -r "debugger" client/src/ || echo "No debuggers found"
```

### Dependencies Audit

```bash
# Check for security vulnerabilities
npm audit

# Review high/critical issues
npm audit --production

# Fix if possible
npm audit fix
```

### Environment Variables

```bash
# Check required variables are documented
cat .env.example 2>/dev/null || echo "Create .env.example"

# Verify local .env exists
test -f .env && echo ".env exists" || echo "WARNING: .env missing"
```

## Production Readiness Checklist

### Pre-Deploy Verification

Run this checklist before deployment:

```bash
#!/bin/bash
echo "=== Jokers Hockey Build Check ==="

# 1. Clean install
echo "[1/8] Clean install..."
rm -rf node_modules package-lock.json
npm install

# 2. TypeScript check
echo "[2/8] TypeScript compilation..."
npm run check || exit 1

# 3. Build
echo "[3/8] Building project..."
npm run build || exit 1

# 4. Verify dist
echo "[4/8] Verifying build output..."
test -f dist/index.js || { echo "ERROR: Server bundle missing"; exit 1; }
test -f dist/public/index.html || { echo "ERROR: Client HTML missing"; exit 1; }
test -d dist/public/assets || { echo "ERROR: Assets missing"; exit 1; }

# 5. Check bundle sizes
echo "[5/8] Checking bundle sizes..."
JS_SIZE=$(du -sk dist/public/assets/*.js | awk '{print $1}')
if [ $JS_SIZE -gt 1000 ]; then
  echo "WARNING: JS bundle is large (${JS_SIZE}KB)"
fi

# 6. Security audit
echo "[6/8] Security audit..."
npm audit --production

# 7. Database schema check
echo "[7/8] Database schema..."
grep -r "export const" shared/schema.ts || echo "WARNING: No schema exports"

# 8. Config files
echo "[8/8] Checking configs..."
test -f ecosystem.config.cjs || echo "WARNING: PM2 config missing on server"
test -f drizzle.config.ts || { echo "ERROR: Drizzle config missing"; exit 1; }

echo "=== Build Check Complete ==="
echo "✓ Ready for deployment"
```

## Test Local Production Build

### Run Locally

```bash
# Build the project
npm run build

# Set production environment
export NODE_ENV=production
export PORT=5000
export DATABASE_URL="postgresql://user:pass@localhost:5432/jokers_dev"

# Start production server
npm start

# Test in browser
# Open: http://localhost:5000
```

### Verify Functionality

1. **Homepage loads** - Check / route
2. **Navigation works** - Test all menu links
3. **Images load** - Verify all assets
4. **No console errors** - Check browser console
5. **Responsive design** - Test mobile view
6. **Forms work** - Test contact form if applicable

## Common Build Issues

### TypeScript Errors

```bash
# View detailed errors
npm run check

# Common fixes:
# - Missing imports
# - Type mismatches
# - Unused variables
# - Path alias issues (@/, @shared/, @assets/)
```

### Vite Build Fails

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Reinstall
npm install

# Try again
npm run build
```

### Missing Assets

```bash
# Verify asset paths in code
grep -r "attached_assets" client/src/

# Check vite.config.ts alias
cat vite.config.ts | grep -A 3 "alias:"

# Ensure attached_assets folder exists
ls -la attached_assets/
```

### Large Bundle Size

```bash
# Analyze bundle
npm run build

# Check what's included
ls -lah dist/public/assets/

# Optimize images if needed
# Consider lazy loading for large images
```

## Database Schema Validation

```bash
# Verify schema is valid TypeScript
npx tsc --noEmit shared/schema.ts

# Check for exports
grep "export const" shared/schema.ts

# Validate Drizzle config
cat drizzle.config.ts

# Test database push (dry run)
npm run db:push
```

## Git Status Check

```bash
# Ensure working directory is clean
git status

# Check for uncommitted changes
git diff

# Verify you're on correct branch
git branch --show-current

# Check remote is up to date
git fetch
git status
```

## Performance Checks

### Build Speed

```bash
# Time the build
time npm run build

# Typical times:
# - Vite build: 4-8 seconds
# - esbuild: < 1 second
# - Total: < 10 seconds
```

### Runtime Performance

```bash
# After starting local server
# Check memory usage
ps aux | grep "node.*dist/index.js"

# Expected: 50-100MB RSS
```

## Deployment Readiness

### Final Checklist

Before running deploy-jokers skill:

- [ ] TypeScript compiles without errors
- [ ] Build completes successfully
- [ ] dist/ folder contains all expected files
- [ ] No console.log or debugger statements
- [ ] No high/critical security vulnerabilities
- [ ] Database schema is valid
- [ ] Environment variables documented
- [ ] Git working directory clean or committed
- [ ] Local testing passed
- [ ] Bundle sizes reasonable

### If All Checks Pass

```bash
# You're ready to deploy
echo "✓ Build verified - Ready for deployment"
echo "Next: Use deploy-jokers skill to push to production"
```

## Automated Check Script

Save as `.claude/skills/build-check/check.sh`:

```bash
#!/bin/bash
set -e

echo "🔍 Running comprehensive build check..."

npm run check && echo "✓ TypeScript OK" || exit 1
npm run build && echo "✓ Build OK" || exit 1
test -f dist/index.js && echo "✓ Server bundle OK" || exit 1
test -f dist/public/index.html && echo "✓ Client bundle OK" || exit 1

echo ""
echo "✅ All checks passed!"
echo "Ready to deploy with: deploy-jokers skill"
```

Make executable:
```bash
chmod +x .claude/skills/build-check/check.sh
```

## Resources

- TypeScript: https://www.typescriptlang.org/docs/
- Vite Build: https://vitejs.dev/guide/build.html
- Bundle Analysis: https://vitejs.dev/guide/build.html#build-optimizations
