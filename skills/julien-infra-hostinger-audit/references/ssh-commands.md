# SSH Commands Reference for Infrastructure Audit

All commands used to collect data from srv759970.hstgr.cloud.

## Connection

```bash
# Standard connection
ssh srv759970

# Or with full details
ssh automation@69.62.108.82
```

## Docker Commands

### Containers

```bash
# All containers with details (JSON)
ssh srv759970 "docker ps -a --format '{{json .}}'"

# All containers (table format)
ssh srv759970 "docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'"

# Running only
ssh srv759970 "docker ps --format '{{.Names}}'"

# Unhealthy containers
ssh srv759970 "docker ps --filter health=unhealthy --format '{{.Names}}\t{{.Status}}'"

# Restarting containers
ssh srv759970 "docker ps --filter status=restarting --format '{{.Names}}\t{{.Status}}'"

# Container details
ssh srv759970 "docker inspect container-name"

# Container logs
ssh srv759970 "docker logs container-name --tail 50"
```

### Images

```bash
# All images (JSON)
ssh srv759970 "docker images --format '{{json .}}'"

# All images (table)
ssh srv759970 "docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}'"

# Dangling images (no tag)
ssh srv759970 "docker images -f dangling=true --format '{{.ID}}\t{{.Size}}'"

# Images sorted by size
ssh srv759970 "docker images --format '{{.Size}}\t{{.Repository}}:{{.Tag}}' | sort -hr"

# Check if image is in use
ssh srv759970 "docker ps -a --filter ancestor=image:tag --format '{{.Names}}'"
```

### Volumes

```bash
# All volumes
ssh srv759970 "docker volume ls --format '{{.Name}}'"

# Orphan/dangling volumes
ssh srv759970 "docker volume ls -qf dangling=true"

# Volume details
ssh srv759970 "docker volume inspect volume-name"

# Volume size (approximate)
ssh srv759970 "sudo du -sh /var/lib/docker/volumes/volume-name/_data"
```

### Networks

```bash
# All networks
ssh srv759970 "docker network ls"

# Network details
ssh srv759970 "docker network inspect network-name"
```

### Docker System

```bash
# Disk usage summary
ssh srv759970 "docker system df"

# Detailed disk usage
ssh srv759970 "docker system df -v"
```

## Scripts Discovery

### Main Script Locations

```bash
# /opt/scripts/ (primary location)
ssh srv759970 "ls -la /opt/scripts/"
ssh srv759970 "find /opt/scripts -name '*.sh' -o -name '*.py'"

# /usr/local/bin/ (system scripts)
ssh srv759970 "ls -la /usr/local/bin/*.sh 2>/dev/null"

# /root/scripts/ (should be moved)
ssh srv759970 "ls -la /root/scripts/ 2>/dev/null"

# /root/*.sh (should be archived)
ssh srv759970 "ls -la /root/*.sh 2>/dev/null"

# /home/automation/scripts/
ssh srv759970 "ls -la /home/automation/scripts/"
```

### Application Scripts

```bash
# All scripts in /opt/*/
ssh srv759970 "find /opt -maxdepth 2 -name '*.sh' 2>/dev/null"

# Python scripts
ssh srv759970 "find /opt -maxdepth 2 -name '*.py' 2>/dev/null | head -50"

# Scripts in project subdirectories
ssh srv759970 "find /opt/*/scripts -name '*.sh' 2>/dev/null"

# Specific project scripts
ssh srv759970 "ls -la /opt/audioguides/*.sh /opt/audioguides/*.py 2>/dev/null"
ssh srv759970 "ls -la /opt/downto40/scripts/ 2>/dev/null"
```

### Script Details

```bash
# Script header/purpose
ssh srv759970 "head -20 /opt/scripts/script-name.sh"

# Script last modified
ssh srv759970 "stat /opt/scripts/script-name.sh"

# Find duplicate scripts by name
ssh srv759970 "find /opt /root /home -name 'script-name.sh' 2>/dev/null"
```

## Cron Jobs

### User Crontabs

```bash
# Root crontab
ssh srv759970 "crontab -l"

# Automation user crontab
ssh srv759970 "sudo crontab -u automation -l"

# List all user crontabs
ssh srv759970 "for user in root automation; do echo \"=== \$user ===\"; sudo crontab -u \$user -l 2>/dev/null; done"
```

### System Cron

```bash
# /etc/crontab
ssh srv759970 "cat /etc/crontab"

# /etc/cron.d/ files
ssh srv759970 "ls -la /etc/cron.d/"
ssh srv759970 "cat /etc/cron.d/*"

# Cron directories
ssh srv759970 "ls /etc/cron.daily/"
ssh srv759970 "ls /etc/cron.hourly/"
ssh srv759970 "ls /etc/cron.weekly/"
ssh srv759970 "ls /etc/cron.monthly/"
```

## Systemd Services

### Service Status

```bash
# All running services
ssh srv759970 "systemctl list-units --type=service --state=running --no-pager"

# Custom services only (exclude system)
ssh srv759970 "systemctl list-units --type=service --state=running --no-pager | grep -vE 'systemd|dbus|ssh|cron|rsyslog|snapd|ufw|multipathd|polkit|accounts-daemon|networkd|resolved|timesyncd|user@|ModemManager|udisks'"

# Failed services
ssh srv759970 "systemctl list-units --type=service --state=failed --no-pager"

# Service details
ssh srv759970 "systemctl status service-name"
ssh srv759970 "systemctl cat service-name"
```

### Timers

```bash
# All timers
ssh srv759970 "systemctl list-timers --no-pager"

# Timer details
ssh srv759970 "systemctl status timer-name.timer"
ssh srv759970 "systemctl cat timer-name.timer"
```

### PM2 Processes

```bash
# PM2 list (as automation user)
ssh srv759970 "sudo -u automation pm2 list"

# PM2 details
ssh srv759970 "sudo -u automation pm2 show process-name"

# PM2 logs
ssh srv759970 "sudo -u automation pm2 logs process-name --lines 20"
```

## Nginx Configuration

### Sites

```bash
# Enabled sites
ssh srv759970 "ls /etc/nginx/sites-enabled/"

# Available sites
ssh srv759970 "ls /etc/nginx/sites-available/"

# Site config content
ssh srv759970 "cat /etc/nginx/sites-enabled/site-name"

# Find upstream/proxy_pass
ssh srv759970 "grep -r 'proxy_pass' /etc/nginx/sites-enabled/"

# Find server_name
ssh srv759970 "grep -r 'server_name' /etc/nginx/sites-enabled/"
```

### Nginx Status

```bash
# Nginx status
ssh srv759970 "sudo systemctl status nginx"

# Test configuration
ssh srv759970 "sudo nginx -t"

# Reload
ssh srv759970 "sudo systemctl reload nginx"
```

## SSL Certificates

```bash
# All certificates
ssh srv759970 "sudo certbot certificates"

# Certificates summary
ssh srv759970 "sudo certbot certificates 2>/dev/null | grep -E 'Certificate Name|Expiry Date|Domains'"

# Check specific domain
ssh srv759970 "sudo certbot certificates --cert-name domain.srv759970.hstgr.cloud"

# Expiring soon (manual check)
ssh srv759970 "sudo certbot certificates | grep -B2 -A2 'VALID:'"
```

## Portals & Dashboards

### Directory Discovery

```bash
# Main portal directories
ssh srv759970 "ls -la /opt/api-portal/ /opt/dashy/ /opt/monitoring/ 2>/dev/null"

# All /opt directories
ssh srv759970 "ls -la /opt/"

# /var/www directories
ssh srv759970 "ls -la /var/www/"
```

### Portal Configs

```bash
# Portal nginx config
ssh srv759970 "cat /etc/nginx/sites-enabled/portal"

# Dashy config
ssh srv759970 "cat /opt/dashy/conf.yml"

# API portal index
ssh srv759970 "head -50 /opt/api-portal/index.html"
```

## System Resources

### Disk Space

```bash
# Overall disk usage
ssh srv759970 "df -h"

# /opt directory sizes
ssh srv759970 "sudo du -sh /opt/* 2>/dev/null | sort -hr"

# Largest files
ssh srv759970 "sudo find /opt -type f -size +100M -exec ls -lh {} \; 2>/dev/null | sort -k5 -hr | head -20"

# Docker log sizes
ssh srv759970 "sudo find /var/lib/docker/containers -name '*-json.log' -exec ls -lh {} \; | sort -k5 -hr | head -10"
```

### Memory

```bash
# Memory usage
ssh srv759970 "free -h"

# Container memory
ssh srv759970 "docker stats --no-stream --format 'table {{.Name}}\t{{.MemUsage}}' | sort -k2 -hr | head -15"
```

### CPU

```bash
# Load average
ssh srv759970 "uptime"

# Top processes
ssh srv759970 "top -bn1 | head -15"
```

## Comparison Commands

### Compare with Registry

```bash
# Get running container names
ssh srv759970 "docker ps --format '{{.Names}}'" > /tmp/running.txt

# Compare with registry (local)
# Then compare /tmp/running.txt with registry.yml entries
```

### Find Orphans

```bash
# Orphan volumes
ssh srv759970 "docker volume ls -qf dangling=true"

# Dangling images
ssh srv759970 "docker images -f dangling=true -q"

# Unused images (not in any container)
ssh srv759970 "docker images -q" > /tmp/all_images.txt
ssh srv759970 "docker ps -a --format '{{.Image}}'" > /tmp/used_images.txt
# Compare locally
```

## Combined Audit Commands

### Quick Health Check

```bash
ssh srv759970 << 'EOF'
echo "=== System Health ==="
echo "Uptime: $(uptime)"
echo ""
echo "=== Disk ==="
df -h | grep -E "Filesystem|/dev/"
echo ""
echo "=== Memory ==="
free -h
echo ""
echo "=== Docker ==="
docker ps -a --format "table {{.Names}}\t{{.Status}}" | head -20
echo ""
echo "=== Unhealthy ==="
docker ps --filter health=unhealthy --format "{{.Names}}"
echo ""
echo "=== Restarting ==="
docker ps --filter status=restarting --format "{{.Names}}"
EOF
```

### Full Inventory Collection

```bash
ssh srv759970 << 'EOF'
echo "=== CONTAINERS ==="
docker ps -a --format '{{.Names}}|{{.Image}}|{{.Status}}'
echo ""
echo "=== IMAGES ==="
docker images --format '{{.Repository}}:{{.Tag}}|{{.ID}}|{{.Size}}'
echo ""
echo "=== VOLUMES ==="
docker volume ls -qf dangling=true
echo ""
echo "=== SCRIPTS ==="
find /opt/scripts /usr/local/bin /root/scripts /home/automation/scripts -name "*.sh" 2>/dev/null
echo ""
echo "=== CRON ROOT ==="
crontab -l 2>/dev/null
echo ""
echo "=== CRON AUTOMATION ==="
sudo crontab -u automation -l 2>/dev/null
echo ""
echo "=== SYSTEMD CUSTOM ==="
systemctl list-units --type=service --state=running --no-pager | grep -vE "systemd|dbus|ssh"
echo ""
echo "=== TIMERS ==="
systemctl list-timers --no-pager
echo ""
echo "=== PM2 ==="
sudo -u automation pm2 list 2>/dev/null
echo ""
echo "=== NGINX SITES ==="
ls /etc/nginx/sites-enabled/
echo ""
echo "=== SSL ==="
sudo certbot certificates 2>/dev/null | grep -E "Certificate Name|Expiry"
EOF
```

## Error Handling

### Permission Issues

```bash
# Use sudo for protected files
ssh srv759970 "sudo cat /etc/nginx/..."
ssh srv759970 "sudo certbot certificates"
ssh srv759970 "sudo crontab -u automation -l"

# For PM2 (runs as automation user)
ssh srv759970 "sudo -u automation pm2 list"
```

### Large Output

```bash
# Limit output
ssh srv759970 "docker ps -a" | head -50
ssh srv759970 "find /opt -name '*.sh'" | head -100

# Count first
ssh srv759970 "docker ps -a | wc -l"
ssh srv759970 "find /opt -name '*.sh' | wc -l"
```

### Timeout Issues

```bash
# Add timeout for slow commands
ssh -o ConnectTimeout=10 srv759970 "command"

# Or use timeout command
ssh srv759970 "timeout 30 find /opt -name '*.sh'"
```
