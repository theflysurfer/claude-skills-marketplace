---
name: pm2-management
description: Manage the PM2 process for Jokers Hockey production server. Use this when the user wants to check logs, restart the app, monitor performance, or troubleshoot the live application.
---

# PM2 Process Management

This skill manages the PM2 process for the Jokers Hockey website running on the production server.

## When to Use This Skill

Activate when the user requests:
- "Check the logs"
- "Restart the application"
- "Is the site running?"
- "Monitor the app"
- "Check server status"
- "View production logs"
- "Troubleshoot the live site"
- "Check memory usage"

## Application Details

- **Process Name**: `jokers-hockey`
- **Server**: automation@69.62.108.82
- **Path**: /var/www/jokers
- **Port**: 5020
- **URL**: https://jokers.srv759970.hstgr.cloud
- **Config File**: /var/www/jokers/ecosystem.config.cjs

## Common PM2 Commands

### Status and Monitoring

```bash
# SSH to server
ssh automation@69.62.108.82

# Check process status
pm2 status jokers-hockey

# Detailed process info
pm2 show jokers-hockey

# Real-time monitoring (CPU, memory)
pm2 monit

# List all processes
pm2 list
```

### Log Management

```bash
# View real-time logs (all)
pm2 logs jokers-hockey

# View last 100 lines
pm2 logs jokers-hockey --lines 100

# View last 50 lines without streaming
pm2 logs jokers-hockey --lines 50 --nostream

# View only errors
pm2 logs jokers-hockey --err

# View only output
pm2 logs jokers-hockey --out

# Clear logs
pm2 flush jokers-hockey
```

### Process Control

```bash
# Restart application
pm2 restart jokers-hockey

# Stop application
pm2 stop jokers-hockey

# Start application
pm2 start jokers-hockey

# Reload application (zero-downtime)
pm2 reload jokers-hockey

# Delete from PM2
pm2 delete jokers-hockey
```

### Performance Monitoring

```bash
# CPU and memory usage
pm2 status

# Detailed metrics
pm2 show jokers-hockey

# Live monitoring dashboard
pm2 monit

# JSON format for parsing
pm2 jlist | jq '.[] | select(.name=="jokers-hockey")'
```

## Troubleshooting Guide

### Application Not Running

```bash
# Check status
pm2 status jokers-hockey

# If stopped, start it
pm2 start jokers-hockey

# If errored, check logs
pm2 logs jokers-hockey --lines 100

# If not in list, start from config
cd /var/www/jokers
pm2 start ecosystem.config.cjs
```

### High Memory Usage

```bash
# Check memory
pm2 show jokers-hockey

# If over 500MB (max_memory_restart), it will auto-restart
# To manually restart:
pm2 restart jokers-hockey

# Check for memory leaks in logs
pm2 logs jokers-hockey | grep -i "memory\|heap"
```

### Application Crashes

```bash
# View recent logs
pm2 logs jokers-hockey --lines 200

# Check error logs
tail -f /var/www/jokers/logs/error.log

# Common issues to check:
# - Database connection (DATABASE_URL)
# - Port already in use
# - Missing node_modules
# - Build artifacts missing (dist/)
```

### Port Conflicts

```bash
# Check what's using port 5020
netstat -tulpn | grep :5020
# or
ss -tulpn | grep :5020

# If conflict, stop other process or change PORT in .env
```

## PM2 Configuration

The application is configured via `ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [{
    name: 'jokers-hockey',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5020
    },
    env_file: '.env',
    max_memory_restart: '500M',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false
  }]
}
```

### Update Configuration

```bash
# After modifying ecosystem.config.cjs
pm2 restart jokers-hockey --update-env

# Or reload from file
pm2 delete jokers-hockey
pm2 start ecosystem.config.cjs
pm2 save
```

## Persistence and Auto-Start

### Save Current Configuration

```bash
# Save current PM2 process list
pm2 save

# This updates /home/automation/.pm2/dump.pm2
```

### Setup Auto-Start on Boot

```bash
# Generate startup script (already done)
pm2 startup

# After any changes, save
pm2 save
```

### Verify Auto-Start

```bash
# Check if PM2 starts on boot
systemctl status pm2-automation

# Manually restart PM2 daemon
pm2 kill
pm2 resurrect
```

## Log Files

### PM2 Managed Logs
- **Output**: `/var/www/jokers/logs/output.log`
- **Errors**: `/var/www/jokers/logs/error.log`

### Direct Log Access
```bash
# Tail output logs
tail -f /var/www/jokers/logs/output.log

# Tail error logs
tail -f /var/www/jokers/logs/error.log

# Search logs for errors
grep -i "error" /var/www/jokers/logs/error.log | tail -50
```

### Nginx Logs (Reverse Proxy)
```bash
# Access logs
sudo tail -f /var/log/nginx/jokers_ssl_access.log

# Error logs
sudo tail -f /var/log/nginx/jokers_ssl_error.log
```

## Health Checks

### Quick Health Check

```bash
# Check if process is running
pm2 status jokers-hockey | grep online

# Test HTTP response
curl -I https://jokers.srv759970.hstgr.cloud

# Check port listening
netstat -tulpn | grep :5020
```

### Detailed Health Check

```bash
# Run comprehensive check
cd /var/www/jokers

# 1. PM2 Status
pm2 status jokers-hockey

# 2. Nginx Status
sudo systemctl status nginx

# 3. Port Check
ss -tulpn | grep :5020

# 4. Database Connection
docker exec postgresql-shared psql -U postgres -d jokers_prod -c "SELECT 1;"

# 5. HTTP Response
curl -sS https://jokers.srv759970.hstgr.cloud | head -20

# 6. SSL Certificate
echo | openssl s_client -servername jokers.srv759970.hstgr.cloud -connect jokers.srv759970.hstgr.cloud:443 2>/dev/null | openssl x509 -noout -dates
```

## Performance Optimization

### Check Resource Usage

```bash
# CPU and Memory
pm2 monit

# Process details
pm2 show jokers-hockey

# System resources
top -bn1 | grep -A 5 "node"
htop  # Interactive
```

### Optimize if Needed

```bash
# Increase max memory restart threshold
# Edit ecosystem.config.cjs
max_memory_restart: '1G'  # instead of 500M

# Then restart
pm2 restart jokers-hockey --update-env
```

## Deployment Integration

After deploying new code:

```bash
# Standard restart
pm2 restart jokers-hockey

# Zero-downtime reload (cluster mode)
pm2 reload jokers-hockey

# With environment update
pm2 restart jokers-hockey --update-env
```

## Common Scenarios

### Site is Down
```bash
1. pm2 status jokers-hockey  # Check if running
2. pm2 logs jokers-hockey    # Check recent errors
3. pm2 restart jokers-hockey # Restart if needed
4. curl -I https://jokers.srv759970.hstgr.cloud  # Verify
```

### Slow Performance
```bash
1. pm2 monit                 # Check CPU/memory
2. pm2 logs jokers-hockey    # Check for errors
3. pm2 flush jokers-hockey   # Clear old logs
4. pm2 restart jokers-hockey # Restart to clear memory
```

### After Code Changes
```bash
1. npm run build             # Build new code
2. pm2 restart jokers-hockey # Restart with new build
3. pm2 logs jokers-hockey --lines 20  # Verify startup
```

## Best Practices

1. **Always check logs** before restarting to understand issues
2. **Use pm2 save** after making changes
3. **Monitor memory usage** regularly to prevent crashes
4. **Keep logs clean** with periodic `pm2 flush`
5. **Test locally** before deploying changes
6. **Use reload** instead of restart for zero-downtime
7. **Check Nginx logs** if PM2 shows healthy but site is down

## Resources

- PM2 Documentation: https://pm2.keymetrics.io/docs/usage/quick-start/
- Ecosystem Config: /var/www/jokers/ecosystem.config.cjs
- Application Logs: /var/www/jokers/logs/
