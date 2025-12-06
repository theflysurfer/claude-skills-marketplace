---
name: julien-infra-hostinger-maintenance
description: Recurring maintenance tasks for Hostinger VPS srv759970 - clean Docker resources, clear system cache, check disk space, verify SSL certificates, update services. Use when performing scheduled maintenance, cleanup operations, or proactive system health checks.
license: Apache-2.0
allowed-tools:
  - Bash
  - Read
metadata:
  author: "Julien"
  version: "1.0.0"
  category: "operations"
  keywords: ["maintenance", "cleanup", "runbooks", "monitoring", "disk-space"]
---

# Hostinger VPS Maintenance Runbooks

Recurring maintenance tasks and operational procedures for srv759970.

## When to Use This Skill

Invoke automatically when:
- User mentions "maintenance", "cleanup", "clean cache"
- Disk space warnings occur
- Performance degradation reported
- Scheduled maintenance needed (weekly/monthly)
- Docker resources need cleanup
- System optimization requested

## Server Info

- **Host**: automation@69.62.108.82
- **Alias**: srv759970
- **Disk**: 193 GB total, ~117 GB available (target: >20 GB free)
- **RAM**: 16 GB total, 9 GB target free
- **Containers**: 36 active / 64 total

## Weekly Maintenance Tasks

### Task 1: Clean Docker Resources

**When**: Every Monday morning
**Why**: Reclaim disk space from dangling images, stopped containers, unused volumes

```bash
ssh srv759970 << 'EOF'
echo "=== Docker Cleanup Starting ==="
date

# Show current usage
echo "Before cleanup:"
docker system df

# Remove dangling images (no tag, not used)
echo "Removing dangling images..."
docker image prune -f

# Remove unused volumes (not attached to containers)
echo "Removing unused volumes..."
docker volume prune -f

# Show space reclaimed
echo "After cleanup:"
docker system df

echo "=== Cleanup Complete ==="
EOF
```

**Expected space reclaimed**: 500 MB - 2 GB
**Duration**: 2-3 minutes

**⚠️ Do NOT run** `docker system prune -a` (removes ALL unused images, breaks auto-start)

### Task 2: Check Disk Space

**When**: Daily (automated monitoring)
**Why**: Prevent disk full situations

```bash
ssh srv759970 << 'EOF'
echo "=== Disk Space Report ==="
df -h | grep -E "Filesystem|/dev/"

echo ""
echo "=== Top 10 Largest Directories in /opt ==="
sudo du -sh /opt/* 2>/dev/null | sort -h | tail -10

echo ""
echo "=== Docker Disk Usage ==="
docker system df
EOF
```

**Alert thresholds**:
- < 20 GB free → Warning
- < 10 GB free → Critical
- < 5 GB free → Emergency cleanup needed

### Task 3: Check Container Health

**When**: Daily
**Why**: Ensure all production containers are running

```bash
ssh srv759970 << 'EOF'
echo "=== Container Health Check ==="

# List all containers with status
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Size}}'

echo ""
echo "=== Containers NOT Running (should be empty or auto-start) ==="
docker ps -a --filter "status=exited" --format '{{.Names}}\t{{.Status}}'

echo ""
echo "=== Containers Restarting (investigate these) ==="
docker ps --filter "status=restarting" --format '{{.Names}}\t{{.Status}}'
EOF
```

**Action if containers down**:
- Check logs: `docker logs container-name --tail 50`
- Check auto-start config if expected to be stopped
- Restart if needed: `docker restart container-name`

### Task 4: Monitor RAM Usage

**When**: Daily
**Why**: Auto-start system relies on available RAM

```bash
ssh srv759970 'free -h && echo "" && docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" | head -15'
```

**Target**: 9 GB free RAM
**Action if < 5 GB free**: Check for memory leaks, restart heavy containers

## Monthly Maintenance Tasks

### Task 1: Verify SSL Certificates

**When**: 1st of each month
**Why**: Ensure auto-renewal is working

```bash
ssh srv759970 << 'EOF'
echo "=== SSL Certificate Status ==="
sudo certbot certificates

echo ""
echo "=== Certificates Expiring Soon (< 30 days) ==="
sudo certbot certificates | grep -A 3 "VALID:"
EOF
```

**Expected**: All certificates should auto-renew at 30 days before expiry

**Action if cert expires soon**:
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Task 2: Update Docker Images

**When**: 1st Monday of month
**Why**: Security updates, bug fixes

```bash
# For each critical service (do this manually per service)
cd /opt/service-name
docker-compose pull
docker-compose up -d
docker logs service-name --tail 20  # Verify startup
```

**Critical services to update**:
- nginx (infrastructure)
- monitoring stack (grafana, prometheus)
- databases-shared (postgres, redis)
- whisperx, tika (AI services)

**⚠️ Test in dev first** for application containers

### Task 3: Backup Verification

**When**: 1st of each month
**Why**: Ensure backups are complete and restorable

```bash
ssh srv759970 << 'EOF'
echo "=== Backup Status ==="

# Check backup directories
ls -lh /opt/backups/ | tail -10

# Check database backup sizes
echo ""
echo "=== Recent Database Backups ==="
find /opt/backups -name "*.sql*" -mtime -7 -exec ls -lh {} \;

# Check docker volume backups
echo ""
echo "=== Recent Volume Backups ==="
find /opt/backups -name "*volume*.tar.gz" -mtime -7 -exec ls -lh {} \;
EOF
```

**Action if backups missing**: Review backup scripts, ensure cron jobs running

### Task 4: Review Nginx Logs

**When**: 1st of each month
**Why**: Identify issues, security threats, performance problems

```bash
ssh srv759970 << 'EOF'
echo "=== Nginx Error Summary (Last 7 Days) ==="
sudo grep "error" /var/log/nginx/error.log | tail -50

echo ""
echo "=== Most Common Errors ==="
sudo grep "error" /var/log/nginx/error.log | awk '{print $9, $10, $11}' | sort | uniq -c | sort -rn | head -10

echo ""
echo "=== 502/504 Errors ==="
sudo grep -E "502|504" /var/log/nginx/access.log | tail -20
EOF
```

### Task 5: System Updates

**When**: 1st Sunday of month (low traffic)
**Why**: Security patches, kernel updates

```bash
ssh srv759970 << 'EOF'
echo "=== Available Updates ==="
sudo apt update
apt list --upgradable

echo ""
echo "=== Security Updates ==="
sudo apt list --upgradable | grep -i security
EOF
```

**To apply updates** (requires planning):
```bash
# Standard packages (safe)
sudo apt update && sudo apt upgrade -y

# Kernel updates (requires reboot - plan carefully)
sudo apt full-upgrade

# After kernel update (coordinate with users)
sudo reboot
```

**⚠️ Coordinate reboots** - affects all 45 applications

## Emergency Procedures

### Emergency: Disk Space Critical (< 5 GB)

**Immediate actions**:

```bash
ssh srv759970 << 'EOF'
# 1. Find largest files
echo "=== Top 20 Largest Files ==="
sudo find /opt -type f -size +100M -exec ls -lh {} \; 2>/dev/null | sort -k5 -hr | head -20

# 2. Check Docker logs (can be huge)
echo ""
echo "=== Large Log Files ==="
sudo find /var/lib/docker/containers -name "*-json.log" -exec ls -lh {} \; | sort -k5 -hr | head -10

# 3. Truncate large container logs if needed
# sudo truncate -s 0 /var/lib/docker/containers/CONTAINER_ID/CONTAINER_ID-json.log

# 4. Docker cleanup (aggressive)
echo ""
echo "=== Aggressive Docker Cleanup ==="
docker system prune -f
docker image prune -a -f --filter "until=168h"  # Remove images older than 1 week

# 5. Clean apt cache
sudo apt clean
sudo apt autoclean
EOF
```

### Emergency: RAM Critical (< 2 GB)

**Immediate actions**:

```bash
# 1. Identify memory hogs
ssh srv759970 'docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" | sort -k2 -hr | head -10'

# 2. Stop non-critical auto-start containers
ssh srv759970 'docker stop support-dashboard cristina-strapi-api'

# 3. Restart leaking containers
ssh srv759970 'docker restart container-name'
```

### Emergency: Service Down

See `runbooks/service-down-checklist.md` for systematic debugging

### Emergency: SSL Certificate Expired

```bash
# Force immediate renewal
ssh srv759970 'sudo certbot renew --force-renewal && sudo systemctl reload nginx'
```

## Monitoring Automation

### Set Up Disk Space Alerts

Add to crontab (`crontab -e`):

```bash
# Check disk space daily at 8 AM
0 8 * * * df -h / | awk '$5 > 80 {print "Disk usage warning:", $0}' | mail -s "Disk Space Alert" your@email.com
```

### Set Up Container Health Checks

```bash
# Check container health hourly
0 * * * * docker ps -a --filter "status=exited" | grep -v "auto-start" && echo "Containers down!" | mail -s "Container Alert" your@email.com
```

## Runbook Files

- **runbooks/weekly-tasks.md** - Detailed weekly procedures
- **runbooks/monthly-tasks.md** - Detailed monthly procedures
- **runbooks/emergency-disk-full.md** - Disk space emergency
- **runbooks/emergency-ram-critical.md** - Memory emergency
- **runbooks/service-down-checklist.md** - Service debugging
- **runbooks/backup-restore.md** - Backup and restore procedures

## Scripts

- **scripts/docker-cleanup.sh** - Automated Docker cleanup
- **scripts/disk-space-report.sh** - Generate disk usage report
- **scripts/container-health-check.sh** - Check all containers
- **scripts/ssl-check.sh** - Verify SSL certificates

## Quick Commands Reference

```bash
# Disk space
ssh srv759970 'df -h && docker system df'

# Docker cleanup
ssh srv759970 'docker image prune -f && docker volume prune -f'

# Container status
ssh srv759970 'docker ps --format "table {{.Names}}\t{{.Status}}"'

# RAM usage
ssh srv759970 'free -h'

# SSL certificates
ssh srv759970 'sudo certbot certificates'

# Nginx status
ssh srv759970 'sudo systemctl status nginx'
```

## Best Practices

1. **Schedule maintenance during low-traffic periods** (weekends, early morning)
2. **Always backup before major operations**
3. **Test in staging/dev first** when possible
4. **Document any issues** found during maintenance
5. **Monitor for 1 hour after maintenance** to catch issues early
6. **Keep runbook updated** with new procedures

## Notes

- Maintenance tasks are **preventive** - don't wait for problems
- **Auto-start system** means many containers stopped = normal
- **Coordinate with users** before service-impacting maintenance
- **Log all maintenance actions** for audit trail
