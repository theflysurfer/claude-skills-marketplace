#!/bin/bash
# Comprehensive disk space analysis for srv759970
# Usage: ssh automation@69.62.108.82 'bash -s' < analyze-space.sh

set -e

echo "=== Hostinger VPS Space Analysis ==="
echo "Server: srv759970.hstgr.cloud (69.62.108.82)"
echo "Date: $(date +'%Y-%m-%d %H:%M:%S')"
echo ""

# 1. Global Disk Usage
echo "## Global Disk Usage"
df -h / | awk 'NR==1 || /\/$/'
USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')

if [ "$USAGE" -gt 90 ]; then
  echo "⚠️  WARNING: Disk usage CRITICAL (>90%)"
elif [ "$USAGE" -gt 80 ]; then
  echo "⚠️  WARNING: Disk usage HIGH (>80%)"
else
  echo "✓ Disk usage OK (<80%)"
fi
echo ""

# 2. Docker Space
echo "## Docker Space Usage"
docker system df
echo ""

echo "### Reclaimable Docker Space"
docker system df | awk '/RECLAIMABLE/ {print}'
echo ""

# 3. Top Docker Images
echo "## Top 10 Docker Images"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -11
echo ""

# 4. Dangling Images
DANGLING_COUNT=$(docker images -f "dangling=true" -q | wc -l)
if [ "$DANGLING_COUNT" -gt 0 ]; then
  echo "⚠️  Found $DANGLING_COUNT dangling images"
  docker images -f "dangling=true" --format "table {{.ID}}\t{{.Size}}\t{{.CreatedSince}}"
else
  echo "✓ No dangling images"
fi
echo ""

# 5. Top Directories in /opt
echo "## Top 20 Directories in /opt"
du -sh /opt/* 2>/dev/null | sort -rh | head -20
echo ""

# 6. Logs
echo "## Log Files"
du -sh /var/log/* 2>/dev/null | sort -rh | head -10
echo ""

echo "### Systemd Journal"
journalctl --disk-usage
echo ""

# 7. Backups
if [ -d /opt/backups ]; then
  echo "## Backup Files"
  du -sh /opt/backups/* 2>/dev/null
  echo ""
fi

# 8. Large Files
echo "## Files >500MB (sample)"
find /opt -type f -size +500M 2>/dev/null | head -10 || echo "None found in /opt"
echo ""

# 9. Docker Volumes
echo "## Docker Volumes"
docker volume ls -q | wc -l | xargs echo "Total volumes:"
docker volume ls -f "dangling=true" -q | wc -l | xargs echo "Dangling volumes:"
echo ""

# 10. Summary
echo "=== SUMMARY ==="
echo ""
echo "Quick Wins Available:"
echo "- Dangling images: ${DANGLING_COUNT} images"
echo "- Journal size: $(journalctl --disk-usage | awk '{print $(NF-1)" "$NF}')"
echo ""
echo "Recommended Actions:"
if [ "$USAGE" -gt 90 ]; then
  echo "1. [IMMEDIATE] Run safe cleanup (docker prune + journal vacuum)"
  echo "2. [URGENT] Review top consumers in /opt"
  echo "3. [PLAN] Consider image optimization"
elif [ "$USAGE" -gt 80 ]; then
  echo "1. [SOON] Run regular maintenance cleanup"
  echo "2. [REVIEW] Check for old backups and logs"
else
  echo "✓ Space usage is healthy - regular maintenance only"
fi
echo ""
echo "=== END ANALYSIS ==="
