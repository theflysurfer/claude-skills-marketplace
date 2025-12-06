---
name: julien-infra-deployment-verifier
description: Verify deployments on Hostinger VPS srv759970 after code changes. Checks HTTP status, PM2 processes, takes screenshots, and generates deployment reports.
license: Apache-2.0
allowed-tools:
  - Bash
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_close
  - Write
metadata:
  author: "Julien"
  version: "1.0.0"
  category: "deployment"
  keywords: ["deployment", "verification", "testing", "hostinger", "pm2"]
---

# Deployment Verifier - Hostinger srv759970

Automate post-deployment verification for INCLUZ'HACT sites on Hostinger VPS.

## Server Info

- **Host**: 69.62.108.82
- **Production**: https://incluzhact.fr (port 5173, PM2: incluzhact)
- **Preview**: https://preview.incluzhact.fr (port 5174, PM2: incluzhact-preview)

## When to Use This Skill

Invoke automatically **after**:
- `git pull` + `npm run build` + `pm2 restart` completed
- Code deployed to VPS
- Configuration changes (Nginx, PM2)
- SSL certificate renewal

## Verification Checklist

### ✅ Complete Verification Workflow

```bash
# 1. Check PM2 processes
ssh automation@69.62.108.82 'pm2 list'

# 2. Verify HTTP status
curl -I https://incluzhact.fr
curl -I https://preview.incluzhact.fr

# 3. Check PM2 logs for errors
ssh automation@69.62.108.82 'pm2 logs incluzhact --lines 50 --nostream'
ssh automation@69.62.108.82 'pm2 logs incluzhact-preview --lines 50 --nostream'

# 4. Take screenshots (Playwright)
# (Handled by Playwright MCP tools)

# 5. Generate report
# (Handled by Write tool)
```

## 1. PM2 Process Verification

### Check if PM2 apps are running

```bash
ssh automation@69.62.108.82 << 'EOF'
echo "=== PM2 Process Status ==="
pm2 list | grep -E "(incluzhact|jokers-hockey)"

echo ""
echo "=== Detailed Status ==="
pm2 describe incluzhact | grep -E "(status|uptime|restarts|memory)"
pm2 describe incluzhact-preview | grep -E "(status|uptime|restarts|memory)"
EOF
```

**Expected Output**:
```
┌────┬───────────────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id │ name                  │ mode    │ pid     │ uptime   │ ↺      │ status │ cpu      │
├────┼───────────────────────┼─────────┼─────────┼──────────┼────────┼────────┼──────────┤
│ 2  │ incluzhact            │ cluster │ 123456  │ 5m       │ 0      │ online │ 0%       │
│ 4  │ incluzhact-preview    │ fork    │ 789012  │ 5m       │ 0      │ online │ 0%       │
└────┴───────────────────────┴─────────┴─────────┴──────────┴────────┴────────┴──────────┘
```

**Red Flags**:
- ❌ Status: `errored`, `stopped`, `stopping`
- ❌ Uptime: `0s` (constantly restarting)
- ❌ Restarts (↺): >5 in short period
- ❌ Memory: >500MB per instance

### Check for recent crashes

```bash
ssh automation@69.62.108.82 << 'EOF'
echo "=== Recent PM2 Events ==="
pm2 logs incluzhact --lines 20 --nostream | grep -i "error\|fatal\|crash" || echo "✅ No errors"
pm2 logs incluzhact-preview --lines 20 --nostream | grep -i "error\|fatal\|crash" || echo "✅ No errors"
EOF
```

## 2. HTTP Status Verification

### Check if sites are accessible

```bash
# Production
echo "=== Production (incluzhact.fr) ==="
curl -I https://incluzhact.fr 2>&1 | head -15

echo ""

# Preview
echo "=== Preview (preview.incluzhact.fr) ==="
curl -I https://preview.incluzhact.fr 2>&1 | head -15
```

**Expected Headers**:
```
HTTP/1.1 200 OK
Server: nginx
Content-Type: text/html; charset=UTF-8
X-Powered-By: Express
Strict-Transport-Security: max-age=31536000
```

**Red Flags**:
- ❌ HTTP status: 500, 502, 503, 504 (server errors)
- ❌ HTTP status: 404 (not found)
- ❌ Connection timeout
- ❌ SSL certificate errors

### Check SSL certificates

```bash
echo "=== SSL Certificate Check ==="
echo | openssl s_client -servername incluzhact.fr -connect incluzhact.fr:443 2>/dev/null | openssl x509 -noout -dates

echo ""

echo | openssl s_client -servername preview.incluzhact.fr -connect preview.incluzhact.fr:443 2>/dev/null | openssl x509 -noout -dates
```

**Expected**:
```
notBefore=Dec  1 00:00:00 2024 GMT
notAfter=Mar  1 23:59:59 2025 GMT
```

**Red Flag**: `notAfter` date is < 30 days away

## 3. Visual Verification (Screenshots)

### Take screenshots of critical pages

```javascript
// Production - Coming Soon page
await page.goto('https://incluzhact.fr');
await page.screenshot({ path: 'production-home.png' });

// Preview - Full site
const pages = [
  '/',
  '/a-propos',
  '/services',
  '/projets',
  '/contact'
];

for (const path of pages) {
  await page.goto(`https://preview.incluzhact.fr${path}`);
  await page.screenshot({ path: `preview-${path.replace('/', 'home')}.png` });
}
```

### Check for visual regressions

Manual inspection for:
- ✅ Logo displays correctly
- ✅ Navigation menu works
- ✅ Images load
- ✅ Fonts render properly
- ✅ Layout not broken
- ✅ No console errors

## 4. Functional Testing

### Test critical functionality

```bash
# Check if contact form endpoint exists
curl -X POST https://preview.incluzhact.fr/api/contact \
  -H "Content-Type: application/json" \
  -d '{}' \
  2>&1 | head -10

# Expected: 400 Bad Request (validation error) - means endpoint works
# Red Flag: 404 Not Found - means route broken
```

### Test page navigation

```javascript
// Use Playwright to verify all routes load
const routes = ['/', '/a-propos', '/services', '/projets', '/contact'];

for (const route of routes) {
  const response = await page.goto(`https://preview.incluzhact.fr${route}`);
  console.log(`${route}: ${response.status()}`);
  // Expected: 200 for all routes
}
```

## 5. Deployment Report

### Generate deployment verification report

```bash
# Run full verification and save report
{
  echo "# Deployment Verification Report"
  echo "Date: $(date)"
  echo ""
  echo "## PM2 Status"
  ssh automation@69.62.108.82 'pm2 list | grep incluzhact'
  echo ""
  echo "## HTTP Status"
  echo "Production: $(curl -s -o /dev/null -w '%{http_code}' https://incluzhact.fr)"
  echo "Preview: $(curl -s -o /dev/null -w '%{http_code}' https://preview.incluzhact.fr)"
  echo ""
  echo "## Recent Logs"
  ssh automation@69.62.108.82 'pm2 logs incluzhact --lines 10 --nostream'
} > deployment-report-$(date +%Y%m%d-%H%M%S).md
```

## Complete Verification Script

```bash
#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Deployment Verification Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. PM2 Check
echo "📦 Step 1/5: Checking PM2 processes..."
ssh automation@69.62.108.82 << 'EOF'
pm2 list | grep -E "incluzhact" | grep "online" > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ PM2 processes online"
else
  echo "❌ PM2 processes not running!"
  pm2 list
  exit 1
fi
EOF

echo ""

# 2. HTTP Check
echo "🌐 Step 2/5: Checking HTTP status..."
PROD_STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://incluzhact.fr)
PREVIEW_STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://preview.incluzhact.fr)

if [ "$PROD_STATUS" = "200" ]; then
  echo "✅ Production: HTTP $PROD_STATUS"
else
  echo "❌ Production: HTTP $PROD_STATUS"
fi

if [ "$PREVIEW_STATUS" = "200" ]; then
  echo "✅ Preview: HTTP $PREVIEW_STATUS"
else
  echo "❌ Preview: HTTP $PREVIEW_STATUS"
fi

echo ""

# 3. Error Check
echo "📝 Step 3/5: Checking for errors in logs..."
ssh automation@69.62.108.82 << 'EOF'
ERRORS=$(pm2 logs incluzhact --lines 50 --nostream | grep -i "error\|fatal\|crash" | wc -l)
if [ "$ERRORS" -eq 0 ]; then
  echo "✅ No errors in production logs"
else
  echo "⚠️  Found $ERRORS errors in production logs"
fi

ERRORS=$(pm2 logs incluzhact-preview --lines 50 --nostream | grep -i "error\|fatal\|crash" | wc -l)
if [ "$ERRORS" -eq 0 ]; then
  echo "✅ No errors in preview logs"
else
  echo "⚠️  Found $ERRORS errors in preview logs"
fi
EOF

echo ""

# 4. SSL Check
echo "🔒 Step 4/5: Checking SSL certificates..."
PROD_SSL=$(echo | openssl s_client -servername incluzhact.fr -connect incluzhact.fr:443 2>/dev/null | openssl x509 -noout -enddate)
PREVIEW_SSL=$(echo | openssl s_client -servername preview.incluzhact.fr -connect preview.incluzhact.fr:443 2>/dev/null | openssl x509 -noout -enddate)

echo "✅ Production SSL: $PROD_SSL"
echo "✅ Preview SSL: $PREVIEW_SSL"

echo ""

# 5. Screenshot (handled by Playwright in skill invocation)
echo "📸 Step 5/5: Taking screenshots (manual)..."
echo "✅ Use Playwright tools to capture visual state"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment verification complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

## Quick Verification Commands

### Minimal check (30 seconds)
```bash
# PM2 + HTTP only
ssh automation@69.62.108.82 'pm2 list | grep incluzhact' && \
curl -I https://incluzhact.fr && \
curl -I https://preview.incluzhact.fr
```

### Standard check (2 minutes)
```bash
# PM2 + HTTP + Logs
bash deployment-verifier-script.sh
```

### Full check (5 minutes)
```bash
# PM2 + HTTP + Logs + Screenshots + Report
bash deployment-verifier-script.sh
# Then use Playwright for screenshots
# Then generate report
```

## Troubleshooting Failed Verifications

### PM2 process errored

```bash
# View error logs
ssh automation@69.62.108.82 'pm2 logs incluzhact --err --lines 100'

# Restart
ssh automation@69.62.108.82 'pm2 restart incluzhact'

# If still failing, rebuild
ssh automation@69.62.108.82 << 'EOF'
cd /var/www/incluzhact
npm run build
pm2 restart incluzhact
EOF
```

### HTTP 502 Bad Gateway

**Cause**: PM2 app not responding, Nginx can't proxy

**Solution**:
```bash
# Check if PM2 listening on correct port
ssh automation@69.62.108.82 'ss -tuln | grep -E "5173|5174"'

# Restart PM2
ssh automation@69.62.108.82 'pm2 restart incluzhact incluzhact-preview'

# Check Nginx config
ssh automation@69.62.108.82 'sudo nginx -t && sudo systemctl restart nginx'
```

### HTTP 404 Not Found

**Cause**: Route doesn't exist or build failed

**Solution**:
```bash
# Check if build artifacts exist
ssh automation@69.62.108.82 'ls -lh /var/www/incluzhact/dist/public'

# Rebuild
ssh automation@69.62.108.82 'cd /var/www/incluzhact && npm run build && pm2 restart incluzhact'
```

### SSL certificate errors

**Cause**: Certificate expired or not found

**Solution**:
```bash
# Renew certificate
ssh automation@69.62.108.82 'sudo certbot renew --nginx'

# Force renew if needed
ssh automation@69.62.108.82 'sudo certbot renew --force-renewal --nginx'
```

## Integration with Deployment Workflow

Use this skill **after** deployment completes:

```bash
# 1. Deploy code
ssh automation@69.62.108.82 'cd /var/www/incluzhact && git pull && npm install && npm run build && pm2 restart incluzhact'

# 2. Wait for PM2 to stabilize
sleep 10

# 3. Run verification (this skill)
bash deployment-verifier-script.sh

# 4. Take screenshots
# (Use Playwright MCP tools)

# 5. Review report
cat deployment-report-*.md
```

## Success Criteria

Deployment is successful if **ALL** checks pass:

- ✅ PM2 status: `online`
- ✅ PM2 uptime: >10 seconds
- ✅ PM2 restarts: 0 (or low)
- ✅ HTTP status: 200
- ✅ SSL valid: >30 days remaining
- ✅ No errors in logs
- ✅ Screenshots show correct UI
- ✅ All routes accessible

## Related Skills

- **julien-infra-git-vps-sync**: Pre-deployment Git sync
- **julien-infra-hostinger-deployment**: Full deployment workflow
- **julien-infra-hostinger-ssh**: SSH connection management

## Quick Reference

```bash
# Minimal check
ssh automation@69.62.108.82 'pm2 list' && curl -I https://incluzhact.fr

# Full verification
bash deployment-verifier-script.sh

# Check logs
ssh automation@69.62.108.82 'pm2 logs incluzhact --lines 50'

# Restart if needed
ssh automation@69.62.108.82 'pm2 restart incluzhact incluzhact-preview'
```
