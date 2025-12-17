---
name: deploy-jokers
description: Deploy the Jokers Hockey website to production server. Use this skill when the user asks to deploy, push to production, update the live site, or publish changes to jokers.srv759970.hstgr.cloud.
---

# Deploy Jokers to Production

This skill handles deployment of the Jokers Hockey website to the Hostinger VPS production server.

## When to Use This Skill

Activate this skill when the user requests any of these actions:
- "Deploy to production"
- "Push the changes to the server"
- "Update the live site"
- "Deploy the Jokers website"
- "Publish the site"
- "Put this on the server"

## Deployment Steps

### 1. Pre-Deployment Checks

Before deploying, verify:
```bash
# Check TypeScript compilation
npm run check

# Test build locally
npm run build

# Verify dist folder was created
ls -la dist/
ls -la dist/public/
```

### 2. Connect to Server

```bash
ssh automation@69.62.108.82
cd /var/www/jokers
```

### 3. Deploy Code

**Option A: Via Git (Recommended)**
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Push database schema changes
npm run db:push

# Build the project
npm run build

# Restart PM2
pm2 restart jokers-hockey

# Check status
pm2 status jokers-hockey
pm2 logs jokers-hockey --lines 50
```

**Option B: Via Direct Upload (if no Git)**
```bash
# On local machine: Create archive
cd "C:\Users\julien\OneDrive\Coding\_Projets de code\2025.11 Site Web Jokers"
tar -czf jokers-deploy.tar.gz --exclude='node_modules' --exclude='dist' --exclude='.git' .

# Upload to server
scp jokers-deploy.tar.gz automation@69.62.108.82:/var/www/jokers/

# On server: Extract and deploy
ssh automation@69.62.108.82
cd /var/www/jokers
tar -xzf jokers-deploy.tar.gz
rm jokers-deploy.tar.gz
npm install
npm run db:push
npm run build
pm2 restart jokers-hockey
```

### 4. Verify Deployment

```bash
# Check PM2 status
pm2 status jokers-hockey

# View recent logs
pm2 logs jokers-hockey --lines 50

# Test HTTP response
curl -I https://jokers.srv759970.hstgr.cloud

# Check Nginx logs if issues
sudo tail -f /var/log/nginx/jokers_ssl_error.log
```

## Important Configuration Details

- **Server**: srv759970.hstgr.cloud (69.62.108.82)
- **User**: automation
- **Application Path**: /var/www/jokers
- **PM2 Process**: jokers-hockey
- **Port**: 5020
- **URL**: https://jokers.srv759970.hstgr.cloud
- **Database**: PostgreSQL (localhost:5432/jokers_prod)

## Rollback Procedure

If deployment fails:
```bash
# View logs for errors
pm2 logs jokers-hockey --lines 100

# Restart application
pm2 restart jokers-hockey

# If needed, revert to previous version
git log --oneline -5
git checkout <previous-commit>
npm install
npm run build
pm2 restart jokers-hockey
```

## Common Issues

### Build Fails
- Check TypeScript errors: `npm run check`
- Verify all dependencies installed: `npm install`
- Check Node version: `node --version` (should be 20+)

### PM2 Won't Start
- Check logs: `pm2 logs jokers-hockey`
- Verify port 5020 is available: `netstat -tulpn | grep :5020`
- Check .env file exists with correct DATABASE_URL

### Site Returns 502
- Application not running: `pm2 restart jokers-hockey`
- Check Nginx config: `sudo nginx -t`
- Verify proxy_pass port matches (5020)

## Post-Deployment

After successful deployment:
1. Test the site in a browser: https://jokers.srv759970.hstgr.cloud
2. Verify all pages load correctly
3. Check browser console for errors
4. Save PM2 state: `pm2 save`

## Security Notes

- Never commit .env files
- Database credentials stored server-side only
- SSL certificate auto-renews via Let's Encrypt
- Always test builds locally before deploying
