# Cleanup Action Risk Levels

Quick reference for space reclamation actions categorized by risk level.

## Level 1: SAFE (Execute Immediately)

**No user approval needed - Zero risk**

| Action | Gain | Risk | Command |
|--------|------|------|---------|
| Prune dangling images | 0.5-1GB | None | `docker image prune -f` |
| Vacuum journal to 100MB | 300-400MB | None | `journalctl --vacuum-size=100M` |
| Truncate rclone log | 10-50MB | None | `truncate -s 0 /var/log/rclone-music.log` |
| Truncate nginx-auto log | 1-5MB | None | `truncate -s 0 /var/log/nginx-auto-docker.log` |
| Clean apt cache | 10-50MB | None | `apt-get clean` |
| Remove old /tmp files | 10-100MB | None | `find /tmp -atime +7 -delete` |

**Total Level 1: 1-1.5GB**

Execute via: `bash scripts/safe-cleanup.sh`

---

## Level 2: MODERATE (Ask User First)

**Require user confirmation - Low to medium risk**

| Action | Gain | Risk | Why Ask |
|--------|------|------|---------|
| Prune old images (>30d) | 5-10GB | Medium | May remove images needed for rollback |
| Prune unused volumes | 2-3GB | Medium | May contain app data if volume mapping changed |
| Migrate impro music to RClone | 4.1GB | Low | Changes file location (symlink created) |
| Remove old backups (>90d) | 0.5-2GB | Low | Permanent deletion of backups |
| Clean node_modules in dev dirs | 0.5-1GB | Low | May be needed for local dev |

**Total Level 2: 12-21GB**

Always:
1. Show what will be deleted
2. Ask user to confirm
3. Create backup if deleting data
4. Verify services after action

---

## Level 3: ADVANCED (Expert Review)

**Require expert knowledge - High risk**

| Action | Gain | Risk | Considerations |
|--------|------|------|----------------|
| Rebuild whisperx (CPU PyTorch) | 4-5GB | High | Service downtime, requires testing |
| Rebuild paperflow (multi-stage) | 3-4GB | High | Service downtime, may break functionality |
| System prune --all --volumes | 20-30GB | CRITICAL | Deletes ALL unused resources |
| Clean Docker overlay2 manually | Variable | CRITICAL | Can corrupt containers |
| Remove container logs manually | 1-5GB | Medium | Need to configure log rotation |

**Total Level 3: 8-50GB**

Requirements:
1. Full backup before action
2. Maintenance window (services will be down)
3. Rollback plan documented
4. Testing environment first (if possible)
5. Monitor logs after deployment

---

## Decision Tree

```
Disk usage?
├─ >95% → Execute Level 1 immediately, then propose Level 2
├─ 90-95% → Execute Level 1, ask about Level 2
├─ 80-90% → Propose Level 1 + Level 2
└─ <80% → Regular maintenance only

User urgent?
├─ Yes → Execute Level 1, show Level 2 options
└─ No → Analyze, report, let user decide

Data involved?
├─ System data → Level 1 (safe)
├─ App data → Level 2 (ask)
└─ Container internals → Level 3 (expert)
```

---

## Execution Order (When Multiple Levels)

1. **Analysis first** - Always understand current state
2. **Level 1 safe actions** - Quick wins, no risk
3. **Level 2 moderate** - Best ROI with user approval
4. **Level 3 advanced** - Only if still critical

---

## Post-Cleanup Verification

After ANY cleanup action:

```bash
# 1. Check disk space
df -h /

# 2. Verify containers running
docker ps --format 'table {{.Names}}\t{{.Status}}'

# 3. Test key services
curl -f https://whisperx.srv759970.hstgr.cloud/health
curl -f https://impro-manager.srv759970.hstgr.cloud/health
curl -f https://dashy.srv759970.hstgr.cloud/

# 4. Check for errors
docker ps -a | grep -v "Up"
```

If ANY verification fails:
1. Stop further cleanup
2. Investigate the failing service
3. Rollback if necessary
4. Document the issue

---

## Emergency Procedure (<5GB Available)

**CRITICAL SITUATION - Execute immediately:**

```bash
# 1. Safe cleanup (no questions)
docker image prune -f
sudo journalctl --vacuum-size=50M

# 2. Emergency prune (ask once)
docker system prune -f  # NOT --all

# 3. Check gain
df -h /

# 4. If still critical (<10GB), escalate to Level 3
```

---

## Rollback Procedures

### If Migration Fails

```bash
# Impro-manager music migration rollback
rm /opt/impro-manager/music
mv /mnt/rd/impro-manager-music /opt/impro-manager/music
docker restart impro-manager
```

### If Image Rebuild Breaks Service

```bash
# Restore from backup tag
docker tag whisperx_whisperx:backup-YYYYMMDD whisperx_whisperx:latest
docker-compose up -d --force-recreate whisperx
```

### If Prune Deletes Needed Volume

```bash
# Restore from backup (if created)
docker volume create volume_name
docker run --rm -v volume_name:/target -v /opt/backups:/backup ubuntu tar xzf /backup/volume-backup.tar.gz -C /target
```

---

**Last Updated**: 2025-12-04
**Based On**: srv759970 space analysis and Docker audit
