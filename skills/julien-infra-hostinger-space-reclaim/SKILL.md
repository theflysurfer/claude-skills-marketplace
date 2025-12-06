---
name: julien-infra-hostinger-space-reclaim
description: Reclaim disk space on Hostinger VPS (srv759970) through automated analysis and cleanup of Docker images, volumes, logs, and application data. Use when disk space is critical (>90% usage) or for regular maintenance to prevent space issues.
---

# Hostinger Space Reclamation

Comprehensive disk space analysis and reclamation for srv759970.hstgr.cloud (automation@69.62.108.82).

## When to Use

Invoke this skill when:
- Disk usage >90% (CRITICAL)
- Running out of space warnings
- Docker operations failing due to disk space
- Regular maintenance (monthly cleanup)
- Before deploying large applications
- User asks about disk space, cleanup, or freeing space

## Server Context

- **Host**: `automation@69.62.108.82`
- **Disk**: 193GB total, typically 180GB+ used (94%)
- **Main consumers**: Docker (48GB), Applications (8.5GB), Logs (544MB)
- **Critical threshold**: <20GB available

## Workflow Overview

### Phase 1: Analysis (ALWAYS FIRST)

Run complete disk space analysis before ANY cleanup:

```bash
ssh automation@69.62.108.82 "df -h /"
ssh automation@69.62.108.82 "docker system df"
ssh automation@69.62.108.82 "du -sh /opt/* 2>/dev/null | sort -rh | head -20"
ssh automation@69.62.108.82 "du -sh /var/log/* 2>/dev/null | sort -rh | head -10"
```

Expected findings:
- Disk: 90-95% used
- Docker images: 48GB+ (18GB potentially reclaimable)
- impro-manager: 5.1GB (4.1GB music files)
- Logs: 400-600MB

### Phase 2: Safe Cleanup (NO USER APPROVAL NEEDED)

Level 1 actions with zero risk - execute immediately if space critical:

**1. Remove Dangling Docker Images** (Gain: 0.5-1GB)
```bash
ssh automation@69.62.108.82 "docker image prune -f"
```

**2. Vacuum Systemd Journal** (Gain: 300-400MB)
```bash
ssh automation@69.62.108.82 "sudo journalctl --vacuum-size=100M"
```

**3. Clean Known Safe Logs** (Gain: 10-50MB)
```bash
ssh automation@69.62.108.82 "sudo truncate -s 0 /var/log/rclone-music.log"
ssh automation@69.62.108.82 "sudo truncate -s 0 /var/log/nginx-auto-docker.log"
```

**Expected total gain: 1-1.5GB**

### Phase 3: Moderate Cleanup (ASK USER FIRST)

Level 2 actions - require user confirmation:

**1. Remove Old Docker Images** (Gain: 5-10GB)
```bash
# Show what will be deleted
ssh automation@69.62.108.82 "docker images --filter 'dangling=false' --format '{{.Repository}}:{{.Tag}}\t{{.CreatedSince}}\t{{.Size}}' | grep 'months'"

# If user approves:
ssh automation@69.62.108.82 "docker image prune -a --filter 'until=720h'"  # >30 days
```

**2. Remove Unused Docker Volumes** (Gain: 2-3GB)
```bash
# List volumes
ssh automation@69.62.108.82 "docker volume ls -f dangling=true"

# If user approves:
ssh automation@69.62.108.82 "docker volume prune -f"
```

**3. Migrate impro-manager Music to RClone** (Gain: 4.1GB)

See `scripts/migrate-impro-music.sh` for complete procedure.

Quick version:
```bash
# Backup
ssh automation@69.62.108.82 "tar czf /opt/backups/impro-music-backup-\$(date +%F).tar.gz /opt/impro-manager/music"

# Migrate
ssh automation@69.62.108.82 "mv /opt/impro-manager/music /mnt/rd/impro-manager-music"
ssh automation@69.62.108.82 "ln -s /mnt/rd/impro-manager-music /opt/impro-manager/music"

# Test
curl -f https://impro-manager.srv759970.hstgr.cloud/health
```

**Expected total gain: 11-17GB**

### Phase 4: Advanced Actions (EXPERT ONLY)

Level 3 actions - require expert review:

**1. Rebuild Oversized Docker Images**

Images identified for optimization:
- whisperx (8.77GB → 3-4GB with CPU PyTorch)
- paperflow-worker (6.65GB → 2.5-3GB with multi-stage)

See `hostinger-docker-optimizer` skill for complete rebuilding workflow.

**2. Cleanup Application Directories**

Analyze specific apps:
```bash
ssh automation@69.62.108.82 "du -sh /opt/impro-manager/* 2>/dev/null"
ssh automation@69.62.108.82 "find /opt/impro-manager -name '*.log' -o -name 'node_modules'"
```

**Expected total gain: 8-15GB (if images rebuilt)**

## Quick Actions by Scenario

### Scenario: Emergency Space (< 10GB available)

```bash
# Run ALL safe actions immediately
ssh automation@69.62.108.82 "docker image prune -f && sudo journalctl --vacuum-size=100M"
```

Then propose moderate cleanup to user.

### Scenario: Regular Maintenance

Run analysis, then execute safe cleanup + ask user about moderate actions.

### Scenario: Before Large Deployment

Run full analysis, report findings, recommend cleanup based on deployment size needs.

## Key Principles

1. **ALWAYS analyze before cleanup** - Never delete blindly
2. **Safe actions first** - Start with zero-risk operations
3. **User confirmation for data** - Always ask before touching app data or volumes
4. **Backup before major changes** - Especially for migrations
5. **Test after cleanup** - Verify services still work
6. **Document findings** - Report what was reclaimed

## Safety Checks

Before ANY cleanup:
- Check if containers are running: `docker ps`
- Verify mount points: `df -h /mnt/rd`
- Confirm RClone availability for migrations

After cleanup:
- Verify disk space gained: `df -h /`
- Check containers still running: `docker ps`
- Test key services: curl health endpoints

## Common Findings

Based on srv759970 analysis (2025-12-04):

**Disk Usage**:
- Total: 193GB
- Used: 180GB (94%)
- Available: 14GB
- Status: CRITICAL

**Top Space Consumers**:
1. Docker images: 48.31GB (18GB reclaimable)
2. impro-manager: 5.1GB (4.1GB music files to migrate)
3. Logs: 544MB (400MB reclaimable)
4. Docker volumes: 4.4GB (2.3GB reclaimable)

**Recommended Actions**:
1. Safe cleanup: 1-1.5GB (immediate)
2. Moderate cleanup: 11-17GB (with approval)
3. Image optimization: 8-15GB (expert, time-consuming)

**Total Realistic Gain: 20-33GB**

## Scripts

- `scripts/analyze-space.sh` - Complete disk space analysis
- `scripts/safe-cleanup.sh` - Run all safe cleanup actions
- `scripts/migrate-impro-music.sh` - Migrate music to RClone mount
- `scripts/backup-before-cleanup.sh` - Create safety backups

## References

- `references/space-analysis-2025-12-04.md` - Latest detailed analysis
- `references/docker-optimization.md` - Image optimization guide
- `references/cleanup-levels.md` - Risk levels for each action

## Related Skills

- `julien-infra-hostinger-docker` - Docker operations and management
- `hostinger-docker-optimizer` - Rebuild and optimize Docker images
- `julien-infra-hostinger-maintenance` - General maintenance procedures

## Monitoring

Set up alerts for disk space:
```bash
# Add to crontab for daily checks
0 9 * * * df -h / | awk '$5+0 > 85 {print "Disk usage: "$5" on "$6}' | mail -s "Disk Alert srv759970" user@example.com
```
