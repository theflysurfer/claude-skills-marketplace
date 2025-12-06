#!/bin/bash
# Migrate impro-manager music files to RClone mount
# This frees ~4.1GB on local disk by moving music to remote storage
# Usage: ssh automation@69.62.108.82 'bash -s' < migrate-impro-music.sh

set -e

BACKUP_DIR="/opt/backups"
SOURCE="/opt/impro-manager/music"
DEST="/mnt/rd/impro-manager-music"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/impro-music-backup-$TIMESTAMP.tar.gz"

echo "=== Impro-Manager Music Migration ==="
echo "Date: $(date)"
echo ""

# Pre-flight checks
echo "## Pre-flight Checks"
echo ""

# 1. Check source exists
if [ ! -d "$SOURCE" ]; then
  echo "❌ ERROR: Source directory $SOURCE not found"
  exit 1
fi
echo "✓ Source directory exists: $SOURCE"

# 2. Check RClone mount
if [ ! -d "/mnt/rd" ]; then
  echo "❌ ERROR: RClone mount /mnt/rd not available"
  exit 1
fi
echo "✓ RClone mount available: /mnt/rd"

# 3. Check destination parent writable
if [ ! -w "/mnt/rd" ]; then
  echo "❌ ERROR: Cannot write to /mnt/rd"
  exit 1
fi
echo "✓ Destination writable"

# 4. Check backup directory
if [ ! -d "$BACKUP_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
fi
echo "✓ Backup directory ready: $BACKUP_DIR"

# 5. Check current size
SOURCE_SIZE=$(du -sh "$SOURCE" | cut -f1)
echo "✓ Source size: $SOURCE_SIZE"
echo ""

# Create backup
echo "## Creating Backup"
echo "Backup file: $BACKUP_FILE"
echo "This may take a few minutes..."
tar czf "$BACKUP_FILE" "$SOURCE"
BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "✓ Backup created: $BACKUP_SIZE"
echo ""

# Move to RClone
echo "## Moving to RClone Mount"
echo "Moving $SOURCE to $DEST..."
mv "$SOURCE" "$DEST"
echo "✓ Music files moved to RClone"
echo ""

# Create symlink
echo "## Creating Symlink"
ln -s "$DEST" "$SOURCE"
echo "✓ Symlink created: $SOURCE -> $DEST"
echo ""

# Verify
echo "## Verification"
if [ -L "$SOURCE" ]; then
  echo "✓ Symlink exists"
else
  echo "❌ ERROR: Symlink not created"
  echo "ROLLBACK: mv $DEST $SOURCE"
  exit 1
fi

if [ -d "$SOURCE" ]; then
  echo "✓ Music directory accessible"
else
  echo "❌ ERROR: Music directory not accessible"
  exit 1
fi

FILE_COUNT=$(find "$SOURCE" -name "*.mp3" 2>/dev/null | wc -l)
echo "✓ Music files found: $FILE_COUNT mp3 files"
echo ""

# Test application
echo "## Testing Application"
echo "Checking impro-manager health..."
if curl -f -s https://impro-manager.srv759970.hstgr.cloud/health > /dev/null 2>&1; then
  echo "✓ Application health check passed"
else
  echo "⚠️  WARNING: Health check failed - verify manually"
fi
echo ""

# Summary
echo "=== MIGRATION COMPLETE ==="
echo ""
echo "Space freed: $SOURCE_SIZE"
echo "Backup location: $BACKUP_FILE"
echo ""
echo "The music files are now stored on RClone mount and accessed via symlink."
echo "The application should continue to work transparently."
echo ""
echo "To rollback if needed:"
echo "  rm $SOURCE"
echo "  mv $DEST $SOURCE"
echo ""
echo "If everything works after 7 days, you can delete the backup:"
echo "  rm $BACKUP_FILE"
