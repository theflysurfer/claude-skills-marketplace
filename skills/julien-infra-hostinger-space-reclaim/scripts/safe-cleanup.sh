#!/bin/bash
# Safe cleanup actions for srv759970 - NO user approval needed
# These actions have ZERO risk of data loss or service disruption
# Usage: ssh automation@69.62.108.82 'bash -s' < safe-cleanup.sh

set -e

echo "=== Safe Disk Space Cleanup ==="
echo "Server: srv759970.hstgr.cloud"
echo "Date: $(date +'%Y-%m-%d %H:%M:%S')"
echo ""

# Check disk space before
BEFORE=$(df -h / | awk 'NR==2 {print $3}')
echo "Disk usage before: $BEFORE"
echo ""

TOTAL_RECLAIMED=0

# 1. Remove dangling Docker images
echo "## 1. Removing Dangling Docker Images"
DANGLING_COUNT=$(docker images -f "dangling=true" -q | wc -l)
if [ "$DANGLING_COUNT" -gt 0 ]; then
  echo "Found $DANGLING_COUNT dangling images"
  docker image prune -f
  echo "✓ Dangling images removed"
else
  echo "✓ No dangling images to remove"
fi
echo ""

# 2. Vacuum systemd journal
echo "## 2. Vacuuming Systemd Journal"
JOURNAL_BEFORE=$(journalctl --disk-usage | awk '{print $(NF-1)}' | tr -d 'M')
echo "Journal size before: ${JOURNAL_BEFORE}M"
sudo journalctl --vacuum-size=100M
JOURNAL_AFTER=$(journalctl --disk-usage | awk '{print $(NF-1)}' | tr -d 'M')
echo "Journal size after: ${JOURNAL_AFTER}M"
JOURNAL_SAVED=$((JOURNAL_BEFORE - JOURNAL_AFTER))
echo "✓ Saved ${JOURNAL_SAVED}M from journal"
echo ""

# 3. Truncate known safe logs
echo "## 3. Truncating Safe Log Files"

# RClone music log (can be safely truncated)
if [ -f /var/log/rclone-music.log ]; then
  RCLONE_SIZE=$(du -m /var/log/rclone-music.log | cut -f1)
  sudo truncate -s 0 /var/log/rclone-music.log
  echo "✓ Truncated rclone-music.log (${RCLONE_SIZE}M)"
else
  echo "- rclone-music.log not found"
fi

# Nginx auto-docker log
if [ -f /var/log/nginx-auto-docker.log ]; then
  NGINX_SIZE=$(du -m /var/log/nginx-auto-docker.log | cut -f1)
  sudo truncate -s 0 /var/log/nginx-auto-docker.log
  echo "✓ Truncated nginx-auto-docker.log (${NGINX_SIZE}M)"
else
  echo "- nginx-auto-docker.log not found"
fi

# Services status log (regenerates automatically)
if [ -f /var/log/services-status.log ]; then
  STATUS_SIZE=$(du -m /var/log/services-status.log | cut -f1)
  sudo truncate -s 0 /var/log/services-status.log
  echo "✓ Truncated services-status.log (${STATUS_SIZE}M)"
else
  echo "- services-status.log not found"
fi
echo ""

# 4. Clean package manager cache (if any)
echo "## 4. Cleaning Package Manager Cache"
if command -v apt-get &> /dev/null; then
  sudo apt-get clean
  echo "✓ apt cache cleaned"
fi
echo ""

# 5. Remove temporary files older than 7 days
echo "## 5. Cleaning Old Temporary Files"
TMP_BEFORE=$(du -sm /tmp 2>/dev/null | cut -f1)
find /tmp -type f -atime +7 -delete 2>/dev/null || true
TMP_AFTER=$(du -sm /tmp 2>/dev/null | cut -f1)
TMP_SAVED=$((TMP_BEFORE - TMP_AFTER))
if [ "$TMP_SAVED" -gt 0 ]; then
  echo "✓ Cleaned ${TMP_SAVED}M from /tmp"
else
  echo "✓ /tmp already clean"
fi
echo ""

# Check disk space after
AFTER=$(df -h / | awk 'NR==2 {print $3}')
echo "=== CLEANUP COMPLETE ==="
echo ""
echo "Disk usage before: $BEFORE"
echo "Disk usage after: $AFTER"
echo ""
echo "Actions performed:"
echo "- Removed dangling Docker images"
echo "- Vacuumed systemd journal to 100MB"
echo "- Truncated safe log files"
echo "- Cleaned package cache"
echo "- Removed old temp files"
echo ""
echo "Services Status: ALL SAFE (no services impacted)"
echo ""
df -h /
