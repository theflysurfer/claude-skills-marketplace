#!/bin/bash
#
# Installation Script for Nginx Audit Tool
# Server: srv759970.hstgr.cloud (automation@69.62.108.82)
# Version: 1.0.0
#

set -euo pipefail

echo "============================================"
echo "Nginx Audit Tool Installation"
echo "============================================"
echo ""

# Check if running on correct server
if [ "$(hostname)" != "srv759970" ]; then
    echo "⚠️  Warning: This script is designed for srv759970.hstgr.cloud"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create directories
echo "📁 Creating directories..."
sudo mkdir -p /opt/scripts
sudo mkdir -p /opt/backups
sudo mkdir -p /opt/reports
sudo mkdir -p /opt/templates/nginx

# Set permissions
sudo chown -R automation:automation /opt/scripts
sudo chown -R automation:automation /opt/backups
sudo chown -R automation:automation /opt/reports
sudo chown -R automation:automation /opt/templates

echo "✅ Directories created"

# Download/copy audit script
echo ""
echo "📥 Installing audit script..."

# Check if script exists locally
if [ -f "nginx-audit-script.sh" ]; then
    sudo cp nginx-audit-script.sh /opt/scripts/nginx-audit.sh
    echo "✅ Copied from local file"
else
    echo "⚠️  nginx-audit-script.sh not found in current directory"
    echo "Please copy it manually to /opt/scripts/nginx-audit.sh"
fi

# Make executable
sudo chmod +x /opt/scripts/nginx-audit.sh

# Create log file
sudo touch /var/log/nginx-audit.log
sudo chown automation:automation /var/log/nginx-audit.log

echo "✅ Audit script installed"

# Create restore script
echo ""
echo "📥 Creating restore script..."

cat > /tmp/nginx-restore.sh <<'EOF'
#!/bin/bash
# Nginx Configuration Restore Script

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_directory>"
    echo ""
    echo "Available backups:"
    ls -lt /opt/backups/ | grep "^d" | head -10
    exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: Backup directory not found: $BACKUP_DIR"
    exit 1
fi

echo "Restoring from: $BACKUP_DIR"
read -p "Continue? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Backup current config before restore
CURRENT_BACKUP="/opt/backups/nginx-before-restore-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$CURRENT_BACKUP"
cp -r /etc/nginx/sites-available/* "$CURRENT_BACKUP/"

# Restore
sudo cp -r "$BACKUP_DIR"/* /etc/nginx/sites-available/

# Test
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "✅ Restored successfully"
else
    echo "❌ Configuration test failed"
    echo "Rolling back..."
    sudo cp -r "$CURRENT_BACKUP"/* /etc/nginx/sites-available/
    exit 1
fi
EOF

sudo mv /tmp/nginx-restore.sh /opt/scripts/nginx-restore.sh
sudo chmod +x /opt/scripts/nginx-restore.sh
sudo chown automation:automation /opt/scripts/nginx-restore.sh

echo "✅ Restore script created"

# Setup cron job (optional)
echo ""
read -p "Setup weekly audit cron job? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Add cron job
    (crontab -l 2>/dev/null; echo "# Weekly Nginx audit (every Monday at 3 AM)") | crontab -
    (crontab -l 2>/dev/null; echo "0 3 * * 1 /opt/scripts/nginx-audit.sh --report-only > /opt/reports/nginx-audit-\$(date +\\%Y\\%m\\%d).txt 2>&1") | crontab -
    echo "✅ Cron job added"
fi

# Test installation
echo ""
echo "🧪 Testing installation..."

if /opt/scripts/nginx-audit.sh --help 2>/dev/null; then
    echo "✅ Audit script is working"
else
    echo "⚠️  Audit script test failed"
fi

# Print summary
echo ""
echo "============================================"
echo "Installation Complete!"
echo "============================================"
echo ""
echo "Available commands:"
echo "  /opt/scripts/nginx-audit.sh --report-only"
echo "  /opt/scripts/nginx-audit.sh --auto-fix"
echo "  /opt/scripts/nginx-audit.sh --site SITENAME"
echo "  /opt/scripts/nginx-restore.sh <backup_dir>"
echo ""
echo "Directories:"
echo "  Scripts:  /opt/scripts/"
echo "  Backups:  /opt/backups/"
echo "  Reports:  /opt/reports/"
echo "  Logs:     /var/log/nginx-audit.log"
echo ""
echo "Run your first audit:"
echo "  /opt/scripts/nginx-audit.sh --report-only"
echo ""
