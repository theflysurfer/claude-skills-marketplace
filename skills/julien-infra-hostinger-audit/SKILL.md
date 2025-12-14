---
name: julien-infra-hostinger-audit
description: Infrastructure audit and discovery for Hostinger VPS srv759970. Inventories all Docker containers, images, scripts, cron jobs, systemd services, portals. Compares actual state vs registry.yml, identifies orphans, duplicates, and undocumented resources. Generates YAML inventory files and HTML dashboard.
license: Apache-2.0
triggers:
  - audit vps
  - what's running
  - inventory hostinger
  - server audit
  - discover services
  - list containers
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
metadata:
  author: "Julien"
  version: "1.0.0"
  category: "audit"
  keywords: ["audit", "inventory", "discovery", "orphans", "drift", "infrastructure"]
---

# Hostinger Infrastructure Audit Skill

Comprehensive infrastructure audit and discovery for srv759970.hstgr.cloud.

## When to Use This Skill

Invoke automatically when user mentions:
- "audit", "inventory", "discover", "what's running"
- "orphan", "unused", "undocumented"
- "drift", "compare registry", "what's missing"
- "scripts on server", "cron jobs", "systemd services"
- "portals", "dashboards", "what services exist"

## Server Info

- **Host**: automation@69.62.108.82
- **Alias**: srv759970
- **SSH**: `ssh srv759970`

## Audit Modes

### Full Audit (default)
```
"Run infrastructure audit"
"Audit the server"
```
Runs all discovery, orphan detection, and registry comparison.

### Discovery Only (`--discover`)
```
"Discover all services"
"Inventory the server"
```
Inventories everything without comparison or orphan detection.

### Orphans Only (`--orphans`)
```
"Find orphan resources"
"What's unused on the server"
```
Identifies orphan volumes, dangling images, misplaced scripts.

### Registry Diff (`--diff`)
```
"Compare registry vs reality"
"What's not documented"
```
Compares registry.yml against actual running services.

## Output Files

All outputs go to `docs/audit/` in the Hostinger repository:

```
docs/audit/
├── inventory/
│   ├── containers.yml      # All Docker containers
│   ├── images.yml          # All Docker images
│   ├── scripts.yml         # All scripts (150+ locations)
│   ├── systemd.yml         # Services, timers, PM2
│   ├── cron.yml            # All cron jobs
│   └── portals.yml         # Portals and dashboards
├── orphans/
│   └── orphans-report.yml  # Orphan resources
├── diff/
│   └── registry-diff.yml   # Registry vs reality
└── reports/
    ├── audit-report.md     # Human-readable summary
    └── dashboard.html      # Visual dashboard
```

## Data Collection Commands

### Docker Containers
```bash
ssh srv759970 "docker ps -a --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}'"
```

### Docker Images
```bash
ssh srv759970 "docker images --format '{{.Repository}}|{{.Tag}}|{{.ID}}|{{.Size}}'"
```

### Orphan Volumes
```bash
ssh srv759970 "docker volume ls -qf dangling=true"
```

### Dangling Images
```bash
ssh srv759970 "docker images -f dangling=true --format '{{.ID}}|{{.Size}}'"
```

### Scripts Discovery
```bash
# Main locations
ssh srv759970 "find /opt/scripts -name '*.sh' -o -name '*.py' 2>/dev/null"
ssh srv759970 "find /usr/local/bin -name '*.sh' 2>/dev/null"
ssh srv759970 "find /root/scripts -name '*.sh' -o -name '*.py' 2>/dev/null"
ssh srv759970 "find /root -maxdepth 1 -name '*.sh' 2>/dev/null"
ssh srv759970 "find /home/automation/scripts -name '*.sh' -o -name '*.py' 2>/dev/null"

# Application scripts
ssh srv759970 "ls /opt/*/scripts/*.sh 2>/dev/null"
ssh srv759970 "ls /opt/*/*.py 2>/dev/null | head -50"
```

### Cron Jobs
```bash
# User crontabs
ssh srv759970 "crontab -l 2>/dev/null"
ssh srv759970 "sudo crontab -u automation -l 2>/dev/null"

# System cron
ssh srv759970 "cat /etc/crontab"
ssh srv759970 "ls /etc/cron.d/"
```

### Systemd Services
```bash
# Custom services
ssh srv759970 "systemctl list-units --type=service --state=running --no-pager | grep -vE 'systemd|dbus|ssh|cron|rsyslog|snapd|ufw|multipathd|polkit|accounts-daemon|networkd|resolved|timesyncd|user@|ModemManager|udisks'"

# Custom timers
ssh srv759970 "systemctl list-timers --no-pager"

# PM2 processes
ssh srv759970 "sudo -u automation pm2 list 2>/dev/null"
```

### Nginx Sites
```bash
ssh srv759970 "ls /etc/nginx/sites-enabled/"
```

### SSL Certificates
```bash
ssh srv759970 "sudo certbot certificates 2>/dev/null | grep -E 'Certificate Name|Expiry Date|Domains'"
```

### Portals Discovery
```bash
ssh srv759970 "ls -la /opt/api-portal/ /opt/dashy/ /opt/monitoring/ 2>/dev/null"
ssh srv759970 "cat /etc/nginx/sites-enabled/portal 2>/dev/null | head -30"
```

## Registry Comparison

Compare against `docs/applications/registry.yml`:

1. **Load registry.yml** - Get all documented applications
2. **Get running containers** - `docker ps --format '{{.Names}}'`
3. **Compare**:
   - In registry but not running → "Stopped services"
   - Running but not in registry → "Undocumented services"
4. **Check ports** - Declared vs actual
5. **Check nginx** - Sites with/without backends

## Orphan Detection Rules

### Docker Orphans
- **Dangling images**: `<none>` tag, check if used by containers
- **Orphan volumes**: Not attached to any container
- **Stopped containers**: Exited > 30 days (except auto-start)

### Script Orphans
- Scripts in `/root/` → Should be in `/opt/scripts/`
- Scripts in `/root/scripts/` → Move to `/opt/scripts/`
- Duplicate scripts → Same name in multiple locations

### Cron Orphans
- Duplicate jobs (same script in multiple crontabs)
- Jobs calling non-existent scripts

## Health Score Calculation

```
Base Score: 100

Deductions:
- Each unhealthy container: -5
- Each restarting container: -10
- Each undocumented service: -1
- Each orphan volume: -0.5
- Each dangling image in use: -3
- Each script in wrong location: -1
- Each duplicate cron job: -2
- Each SSL cert expiring <30d: -2

Categories:
- 80-100: Healthy
- 60-79: Needs Attention
- 40-59: Warning
- <40: Critical
```

## Audit Workflow

### Step 1: Collect Docker Data
```bash
# Containers
ssh srv759970 "docker ps -a --format '{{json .}}'" > /tmp/containers.json

# Images
ssh srv759970 "docker images --format '{{json .}}'" > /tmp/images.json

# Volumes
ssh srv759970 "docker volume ls --format '{{json .}}'" > /tmp/volumes.json
```

### Step 2: Collect System Data
```bash
# Scripts, crons, systemd (see commands above)
```

### Step 3: Collect Nginx/SSL Data
```bash
# Sites and certificates (see commands above)
```

### Step 4: Load Registry
```bash
# Read docs/applications/registry.yml
```

### Step 5: Compare and Analyze
- Match containers to registry
- Identify orphans
- Detect duplicates
- Calculate health score

### Step 6: Generate Reports
- Write YAML inventory files
- Write markdown report
- Generate HTML dashboard

## YAML Output Schemas

See `references/yaml-schemas.md` for complete schemas.

### containers.yml Structure
```yaml
metadata:
  generated_at: "ISO-8601"
  server: srv759970.hstgr.cloud
  total_containers: N

containers:
  - name: container-name
    image: image:tag
    status: running|exited|restarting
    ports: ["8080:80"]
    health: healthy|unhealthy|none
    registry_match: true|false
    compose_dir: /opt/project/
```

### scripts.yml Structure
```yaml
metadata:
  generated_at: "ISO-8601"
  total_scripts: N

locations:
  opt_scripts:
    path: /opt/scripts/
    scripts:
      - name: script.sh
        purpose: "Description"
        cron: "schedule or null"
        documented: true|false
```

## Dashboard Generation

The HTML dashboard (`dashboard.html`) displays:

1. **Health Score** - Visual gauge
2. **Summary Cards** - Containers, scripts, crons, SSL
3. **Drift Visualization** - Documented vs undocumented bars
4. **Issues List** - Critical, warning, info
5. **Tables** - Undocumented services, expiring certs
6. **Action Items** - Prioritized recommendations

## Integration with Other Skills

### Skills that should call this skill
- `hostinger-maintenance` → Monthly audit
- `hostinger-deployment` → Post-deploy verification
- `hostinger-space-reclaim` → Identify cleanup targets

### Skills this skill may call
- `hostinger-ssh` → Server connection (implicit)

## Quick Commands

```bash
# Full audit
"Run infrastructure audit"

# Quick container check
ssh srv759970 "docker ps -a --format 'table {{.Names}}\t{{.Status}}' | head -20"

# Quick script count
ssh srv759970 "find /opt /root /home/automation -name '*.sh' 2>/dev/null | wc -l"

# Quick orphan check
ssh srv759970 "docker volume ls -qf dangling=true | wc -l"
```

## Best Practices

1. **Run audit monthly** or after major changes
2. **Review orphans before cleanup** - Some may be intentional
3. **Update registry.yml** after discovering undocumented services
4. **Track health score** over time
5. **Address critical issues first** (restarting containers, expiring SSL)

## Troubleshooting

### SSH Connection Issues
```bash
# Test connection
ssh srv759970 "echo 'Connected'"

# If fails, check SSH config
cat ~/.ssh/config | grep -A5 srv759970
```

### Permission Issues
```bash
# Some commands need sudo
ssh srv759970 "sudo certbot certificates"
ssh srv759970 "sudo -u automation pm2 list"
```

### Large Output Handling
```bash
# Limit output for large inventories
ssh srv759970 "docker ps -a" | head -50
ssh srv759970 "find /opt -name '*.sh'" | head -100
```

## Changelog

### v1.0.0 (2025-12-09)
- Initial release
- Full audit with 4 modes
- YAML inventory generation
- HTML dashboard
- Health score calculation
- Orphan detection
- Registry comparison
