---
name: julien-infra-hostinger-fail2ban
description: Manage Fail2ban jails and IP bans on Hostinger VPS srv759970. Use for WordPress security hardening, IP ban/unban operations, monitoring brute-force attacks, or when security audit shows missing Fail2ban protection.
license: Apache-2.0
allowed-tools:
  - Bash
  - Read
metadata:
  author: "Julien"
  version: "1.0.0"
  category: "security"
  keywords: ["fail2ban", "security", "wordpress", "brute-force", "ip-ban"]
---

# Fail2ban Management - Hostinger VPS

Manage Fail2ban jails, IP bans, and WordPress brute-force protection on srv759970.hstgr.cloud.

## When to Use This Skill

Invoke automatically when:
- User asks to ban/unban an IP address
- Security audit shows missing Fail2ban protection
- Monitoring brute-force attack patterns
- Installing WordPress security jails
- Checking banned IPs status
- Managing Fail2ban configuration

**Trigger phrases**:
- "Ban IP X.X.X.X"
- "Unban IP X.X.X.X"
- "Install Fail2ban WordPress jails"
- "Check Fail2ban status"
- "Show banned IPs"
- "Who is attacking my WordPress?"

## Server Context

- **Host**: 69.62.108.82
- **User**: automation (SSH key authentication)
- **Fail2ban version**: Ubuntu 24.04 default
- **Log files**: `/var/log/nginx/*-access.log`

## WordPress Jails Overview

| Jail | Purpose | maxretry | findtime | bantime |
|------|---------|----------|----------|---------|
| `wordpress-auth` | Login brute-force | 5 | 10 min | 1 hour |
| `wordpress-hard` | Recon attacks | 3 | 5 min | 2 hours |
| `wordpress-xmlrpc` | XML-RPC abuse | 2 | 1 min | 1 hour |

### Detection Patterns

**wordpress-auth** detects:
- Failed POST to `/wp-login.php`
- 401, 403, 429 responses

**wordpress-hard** detects:
- Direct access to `wp-config.php`
- User enumeration (`?author=`)
- Access to `debug.log`
- Scanning for backup files (`.sql`, `.zip`, `.bak`)
- PHP execution in uploads

**wordpress-xmlrpc** detects:
- Any POST to `/xmlrpc.php`
- GET requests to `/xmlrpc.php`

## Quick Commands

### Status Check

```bash
# Overall Fail2ban status
ssh srv759970 "sudo fail2ban-client status"

# WordPress jails status
ssh srv759970 "sudo fail2ban-client status wordpress-auth"
ssh srv759970 "sudo fail2ban-client status wordpress-hard"
ssh srv759970 "sudo fail2ban-client status wordpress-xmlrpc"

# Currently banned IPs
ssh srv759970 "sudo fail2ban-client status wordpress-auth | grep 'Banned IP'"
```

### Ban/Unban IP

```bash
# Ban IP in specific jail
ssh srv759970 "sudo fail2ban-client set wordpress-auth banip 1.2.3.4"

# Unban IP from specific jail
ssh srv759970 "sudo fail2ban-client set wordpress-auth unbanip 1.2.3.4"

# Unban from ALL jails
ssh srv759970 "sudo fail2ban-client unban 1.2.3.4"

# Unban all IPs
ssh srv759970 "sudo fail2ban-client unban --all"
```

### View Logs

```bash
# Real-time ban events
ssh srv759970 "sudo tail -f /var/log/fail2ban.log | grep Ban"

# Last 50 ban events
ssh srv759970 "sudo grep 'Ban' /var/log/fail2ban.log | tail -50"

# Bans today
ssh srv759970 "sudo grep 'Ban' /var/log/fail2ban.log | grep '\$(date +%Y-%m-%d)'"

# Top banned IPs
ssh srv759970 "sudo grep 'Ban' /var/log/fail2ban.log | awk '{print \$NF}' | sort | uniq -c | sort -nr | head -10"
```

## Install WordPress Jails

### Step 1: Copy Jail Configuration

```bash
# Upload jail config to server
ssh srv759970 "sudo tee /etc/fail2ban/jail.d/wordpress.conf << 'EOF'
$(cat configs/jails/wordpress.conf)
EOF"
```

### Step 2: Copy Filter Configurations

```bash
# Upload wordpress-auth filter
ssh srv759970 "sudo tee /etc/fail2ban/filter.d/wordpress-auth.conf << 'EOF'
$(cat configs/filters/wordpress-auth.conf)
EOF"

# Upload wordpress-hard filter
ssh srv759970 "sudo tee /etc/fail2ban/filter.d/wordpress-hard.conf << 'EOF'
$(cat configs/filters/wordpress-hard.conf)
EOF"

# Upload wordpress-xmlrpc filter
ssh srv759970 "sudo tee /etc/fail2ban/filter.d/wordpress-xmlrpc.conf << 'EOF'
$(cat configs/filters/wordpress-xmlrpc.conf)
EOF"
```

### Step 3: Restart Fail2ban

```bash
ssh srv759970 "sudo systemctl restart fail2ban"
```

### Step 4: Verify Installation

```bash
# Check jails are active
ssh srv759970 "sudo fail2ban-client status | grep wordpress"

# Test filters
ssh srv759970 "sudo fail2ban-regex /var/log/nginx/clemence-access.log /etc/fail2ban/filter.d/wordpress-auth.conf"
```

## Configuration Reference

### Jail File: `configs/jails/wordpress.conf`

```ini
[wordpress-auth]
enabled = true
port = http,https
filter = wordpress-auth
logpath = /var/log/nginx/*-access.log
maxretry = 5
findtime = 600
bantime = 3600

[wordpress-hard]
enabled = true
port = http,https
filter = wordpress-hard
logpath = /var/log/nginx/*-access.log
maxretry = 3
findtime = 300
bantime = 7200

[wordpress-xmlrpc]
enabled = true
port = http,https
filter = wordpress-xmlrpc
logpath = /var/log/nginx/*-access.log
maxretry = 2
findtime = 60
bantime = 3600
```

### Adjusting Thresholds

To make more lenient (fewer false positives):
```bash
ssh srv759970 << 'EOF'
sudo sed -i 's/maxretry = 5/maxretry = 10/' /etc/fail2ban/jail.d/wordpress.conf
sudo fail2ban-client reload wordpress-auth
EOF
```

To make stricter:
```bash
ssh srv759970 << 'EOF'
sudo sed -i 's/maxretry = 5/maxretry = 3/' /etc/fail2ban/jail.d/wordpress.conf
sudo sed -i 's/bantime = 3600/bantime = 7200/' /etc/fail2ban/jail.d/wordpress.conf
sudo fail2ban-client reload wordpress-auth
EOF
```

## Whitelist IPs

### Add to Whitelist

```bash
ssh srv759970 << 'EOF'
sudo sed -i '/^\[DEFAULT\]/a ignoreip = 127.0.0.1/8 ::1 YOUR_HOME_IP' /etc/fail2ban/jail.d/wordpress.conf
sudo systemctl restart fail2ban
EOF
```

### Check Whitelist

```bash
ssh srv759970 "grep 'ignoreip' /etc/fail2ban/jail.d/wordpress.conf"
```

## Troubleshooting

### Fail2ban Not Detecting Attacks

```bash
# 1. Test filter against logs
ssh srv759970 "sudo fail2ban-regex /var/log/nginx/*-access.log /etc/fail2ban/filter.d/wordpress-auth.conf"

# 2. Check jail is enabled
ssh srv759970 "sudo fail2ban-client status | grep wordpress"

# 3. Verify log path exists
ssh srv759970 "ls -la /var/log/nginx/*-access.log"

# 4. Check Fail2ban service
ssh srv759970 "sudo systemctl status fail2ban"
```

### Legitimate User Banned

```bash
# 1. Unban immediately
ssh srv759970 "sudo fail2ban-client unban USER_IP"

# 2. Add to whitelist (if recurring)
# Edit /etc/fail2ban/jail.d/wordpress.conf
# Add IP to ignoreip line

# 3. Consider increasing maxretry threshold
```

### Service Won't Start

```bash
# 1. Check configuration syntax
ssh srv759970 "sudo fail2ban-client -t"

# 2. View service logs
ssh srv759970 "sudo journalctl -u fail2ban -n 50"

# 3. Check filter syntax
ssh srv759970 "sudo fail2ban-regex --help"
```

## Statistics & Monitoring

### Daily Summary

```bash
ssh srv759970 << 'EOF'
echo "=== Fail2ban Summary ==="
echo "Date: $(date)"
echo ""
for jail in wordpress-auth wordpress-hard wordpress-xmlrpc; do
    echo "[$jail]"
    sudo fail2ban-client status $jail 2>/dev/null | grep -E "Currently|Total"
done
echo ""
echo "Top 5 banned IPs today:"
sudo grep "Ban" /var/log/fail2ban.log | grep "$(date +%Y-%m-%d)" | awk '{print $NF}' | sort | uniq -c | sort -nr | head -5
EOF
```

### Weekly Ban Trend

```bash
ssh srv759970 << 'EOF'
echo "Bans per day (last 7 days):"
for i in {0..6}; do
    date=$(date -d "-$i days" +%Y-%m-%d)
    count=$(sudo grep "Ban" /var/log/fail2ban.log | grep "$date" | wc -l)
    echo "$date: $count bans"
done
EOF
```

## Emergency Commands

### Disable All Banning (Temporarily)

```bash
ssh srv759970 "sudo systemctl stop fail2ban"
```

### Re-enable

```bash
ssh srv759970 "sudo systemctl start fail2ban"
```

### Flush All Bans and Reset

```bash
ssh srv759970 "sudo fail2ban-client unban --all && sudo systemctl restart fail2ban"
```

### Remove WordPress Jails Completely

```bash
ssh srv759970 << 'EOF'
sudo rm /etc/fail2ban/jail.d/wordpress.conf
sudo rm /etc/fail2ban/filter.d/wordpress-auth.conf
sudo rm /etc/fail2ban/filter.d/wordpress-hard.conf
sudo rm /etc/fail2ban/filter.d/wordpress-xmlrpc.conf
sudo systemctl restart fail2ban
EOF
```

## Reference Documentation

See `references/FAIL2BAN_GUIDE.md` for:
- Complete command reference
- Advanced configuration (email notifications, permanent bans)
- GeoIP blocking
- Monitoring dashboard script
- Best practices

## 🔗 Skill Chaining

### Skills Required Before

| Skill | Required | Purpose |
|-------|----------|---------|
| **hostinger-ssh** | Obligatoire | SSH access to server |
| **wordpress-security** | Optionnel | Identifies missing Fail2ban protection |

### Input Expected

- **SSH access**: automation@69.62.108.82
- **Fail2ban installed**: `systemctl status fail2ban` returns active
- **WordPress sites exist**: For WordPress jail installation
- **Nginx logs accessible**: `/var/log/nginx/*-access.log`

### Output Produced

- **Format**: Jail status, ban operations result, statistics
- **Side effects**:
  - Jails installed: `/etc/fail2ban/jail.d/wordpress.conf`
  - Filters created: `/etc/fail2ban/filter.d/wordpress-*.conf`
  - Fail2ban restarted
  - IPs banned/unbanned in iptables
- **Duration**: 10-30 seconds (operations), 1-2 minutes (full install)

### Compatible Skills After

**Recommandés:**
- **wordpress-security**: Re-audit to verify Fail2ban checks now pass
- **hostinger-maintenance**: Schedule regular ban list cleanup

**Optionnels:**
- **nginx-audit**: Verify Nginx security alongside Fail2ban

### Called By

| Caller | Context |
|--------|---------|
| **wordpress-security** | When audit shows missing Fail2ban protection |
| **Manual** | "Install WordPress Fail2ban jails" |
| **Manual** | "Ban IP 1.2.3.4" or "Unban IP 1.2.3.4" |
| **Emergency** | "Block IP attacking wp-login.php" |

### Tools Used

- `Bash` (SSH commands, configuration management)
- `Read` (read configuration files)

### Visual Workflow

```
[Security audit shows missing Fail2ban OR manual request]
    ↓
┌─────────────────────────────────────────────────┐
│         julien-infra-hostinger-fail2ban         │
├─────────────────────────────────────────────────┤
│                                                 │
│  Operation: INSTALL WORDPRESS JAILS             │
│    ├─► Create jail: /etc/fail2ban/jail.d/       │
│    │   └─► wordpress.conf (3 jails)             │
│    ├─► Create filters: /etc/fail2ban/filter.d/  │
│    │   ├─► wordpress-auth.conf                  │
│    │   ├─► wordpress-hard.conf                  │
│    │   └─► wordpress-xmlrpc.conf                │
│    ├─► Restart: systemctl restart fail2ban      │
│    └─► Verify: fail2ban-client status           │
│                                                 │
│  Operation: BAN/UNBAN IP                        │
│    ├─► Ban: fail2ban-client set [jail] banip    │
│    └─► Unban: fail2ban-client set [jail] unbanip│
│                                                 │
│  Operation: MONITOR                             │
│    ├─► Status: fail2ban-client status [jail]    │
│    ├─► Banned IPs: grep Ban fail2ban.log        │
│    └─► Statistics: count by IP, by day          │
│                                                 │
└─────────────────────────────────────────────────┘
    ↓
Operation complete
    ↓
[If jails installed] → wordpress-security (re-audit, score improved)
```

### Usage Example

**Scenario**: Security audit shows Fail2ban not protecting WordPress

**Command**: "Install Fail2ban WordPress jails"

**Expected Flow**:
1. Skill activates, connects via SSH
2. Uploads wordpress.conf jail configuration
3. Uploads 3 filter files (auth, hard, xmlrpc)
4. Restarts Fail2ban service
5. Verifies jails are active: 3 jails running
6. Reports: "WordPress Fail2ban protection installed"
7. Recommends: "Re-run wordpress-security audit"

**Result after re-audit**:
- Fail2ban checks now pass
- Security score improved by ~5-10%

## Important Notes

- **Never ban your own IP** - Add to whitelist first
- **Test filters before production** - Use `fail2ban-regex`
- **Monitor false positives** - Adjust maxretry if too strict
- **Logs rotate** - Check `/var/log/fail2ban.log` rotation
- **Restart clears bans** - `systemctl restart` clears all active bans

## Changelog

### v1.0.0 (2025-12-09)
- Initial release
- 3 WordPress jails (auth, hard, xmlrpc)
- 3 detection filters
- FAIL2BAN_GUIDE.md reference guide
- Skill chaining with wordpress-security
