---
name: hostinger-ssh
description: SSH connection and server management for Hostinger VPS srv759970 (automation@69.62.108.82). Use for connecting to server, checking system status, managing users, troubleshooting SSH connection issues, or when Permission denied errors occur.
license: Apache-2.0
allowed-tools:
  - Bash
  - Read
metadata:
  author: "Julien"
  version: "1.0.0"
  category: "infrastructure"
  keywords: ["ssh", "server", "hostinger", "vps", "connection"]
---

# SSH & Server Management - Hostinger VPS

Manage SSH connections and server operations on srv759970.hstgr.cloud.

## Server Info

- **Host**: 69.62.108.82
- **User**: automation (not root, sudo configured)
- **Alias**: srv759970 (if configured in ~/.ssh/config)
- **OS**: Ubuntu 24.04.2 LTS
- **Key type**: ED25519
- **Key location**: `%USERPROFILE%\.ssh\id_ed25519` (Windows) or `~/.ssh/id_ed25519` (Linux/Mac)

## When to Use This Skill

Invoke automatically when:
- User needs to connect to the server
- SSH connection fails with "Permission denied"
- System status checks needed (disk, RAM, CPU)
- User management operations required
- Server operations requested (uptime, logs, processes)

## Quick Connection

### Basic SSH

```bash
# Using IP
ssh automation@69.62.108.82

# Using alias (if configured)
ssh srv759970
```

### Quick Status Check

```bash
# System resources
ssh srv759970 'free -h && df -h && uptime'

# Docker containers
ssh srv759970 'docker ps --format "table {{.Names}}\t{{.Status}}"'

# Network connections
ssh srv759970 'ss -tuln | grep LISTEN'
```

## SSH Configuration

### Setup SSH Config (Recommended)

Create/edit `~/.ssh/config`:

```
Host srv759970
    HostName 69.62.108.82
    User automation
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

**Benefits**:
- Connect with: `ssh srv759970`
- Keeps connection alive
- Avoids key confusion with multiple keys

### Generate New SSH Key (if needed)

```bash
# Windows PowerShell or Git Bash
ssh-keygen -t ed25519 -C "your_email@example.com"

# Accept default location (~/.ssh/id_ed25519)
# Set a passphrase (recommended)
```

### Add Key to Server

```bash
# Copy public key to clipboard (Windows)
cat ~/.ssh/id_ed25519.pub | clip

# Then on server (using password initially)
ssh automation@69.62.108.82
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## System Status Commands

### Disk Space

```bash
# Overview
ssh srv759970 'df -h'

# Specific directories
ssh srv759970 'du -sh /opt/* | sort -h | tail -10'

# Find large files
ssh srv759970 'find /opt -type f -size +1G -exec ls -lh {} \; 2>/dev/null'
```

**Alert thresholds**:
- < 20 GB free → Warning
- < 10 GB free → Critical action needed

### Memory Usage

```bash
# RAM overview
ssh srv759970 'free -h'

# Top memory consumers
ssh srv759970 'docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" | head -15'

# System processes
ssh srv759970 'ps aux --sort=-%mem | head -20'
```

### CPU & Load

```bash
# System load
ssh srv759970 'uptime'

# CPU usage per container
ssh srv759970 'docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}"'

# Top CPU processes
ssh srv759970 'ps aux --sort=-%cpu | head -20'
```

### Network Status

```bash
# Listening ports
ssh srv759970 'ss -tuln | grep LISTEN'

# Established connections
ssh srv759970 'ss -tun | grep ESTAB | wc -l'

# Check if port is open
ssh srv759970 'nc -zv localhost 8000'
```

## User Management

### Automation User Details

The `automation` user has:
- ✅ Sudo access (almost all commands)
- ✅ Docker group membership
- ✅ SSH key authentication
- ❌ Cannot reboot/shutdown server
- ❌ Cannot modify sudo config

### Check User Permissions

```bash
# Current user
ssh srv759970 'whoami'

# Groups
ssh srv759970 'groups'

# Sudo capabilities
ssh srv759970 'sudo -l'

# Check if in docker group
ssh srv759970 'groups | grep docker'
```

### Switch to Root (if needed)

```bash
# Run command as root
ssh srv759970 'sudo command'

# Interactive root shell (avoid if possible)
ssh srv759970 'sudo -i'
```

## Troubleshooting SSH Connection

### Permission Denied Error

**Most common cause on Windows**: SSH key permissions too open.

**Solution**:

1. **Diagnose**:
   ```bash
   # Test connection with verbose output
   ssh -v automation@69.62.108.82

   # Look for "Permissions ... are too open"
   ```

2. **Fix permissions** (Windows PowerShell):
   ```powershell
   # Use the fix script
   powershell -ExecutionPolicy Bypass -File scripts/fix-ssh-permissions.ps1
   ```

3. **Manual fix** (Windows):
   ```powershell
   $keyPath = "$env:USERPROFILE\.ssh\id_ed25519"

   # Remove inheritance and all permissions
   $acl = Get-Acl $keyPath
   $acl.SetAccessRuleProtection($true, $false)
   $acl.Access | ForEach-Object { $acl.RemoveAccessRule($_) | Out-Null }

   # Add only current user with full control
   $user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
   $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($user, "FullControl", "Allow")
   $acl.AddAccessRule($rule)

   Set-Acl $keyPath $acl
   ```

4. **Verify**:
   ```bash
   ssh automation@69.62.108.82 "echo 'Connection OK'"
   ```

### Connection Timeout

**Causes**:
- Server down
- Network issue
- Firewall blocking port 22

**Steps**:
```bash
# 1. Ping server
ping -n 4 69.62.108.82

# 2. Check if port 22 is open
telnet 69.62.108.82 22
# Or with nc (if installed)
nc -zv 69.62.108.82 22

# 3. Check from different network
# Try mobile hotspot to rule out local network issues
```

### "Host key verification failed"

**Cause**: Server's host key changed (rare, but happens after reinstall)

**Solution**:
```bash
# Remove old host key
ssh-keygen -R 69.62.108.82
ssh-keygen -R srv759970

# Reconnect (will ask to verify new key)
ssh automation@69.62.108.82
```

**⚠️ Only do this if you're sure the server was reinstalled**

### Multiple SSH Keys Conflict

**Problem**: Wrong key being used

**Solution**:
```bash
# Specify key explicitly
ssh -i ~/.ssh/id_ed25519 automation@69.62.108.82

# Or use IdentitiesOnly in SSH config
Host srv759970
    IdentitiesOnly yes
    IdentityFile ~/.ssh/id_ed25519
```

## Common Server Operations

### View System Logs

```bash
# System log (recent entries)
ssh srv759970 'sudo journalctl -n 100 --no-pager'

# Specific service
ssh srv759970 'sudo journalctl -u nginx -n 50 --no-pager'

# Follow logs in real-time
ssh srv759970 'sudo journalctl -f'
```

### Check Services Status

```bash
# Nginx
ssh srv759970 'sudo systemctl status nginx'

# Docker
ssh srv759970 'sudo systemctl status docker'

# All services
ssh srv759970 'systemctl list-units --type=service --state=running'
```

### Process Management

```bash
# Find process by name
ssh srv759970 'ps aux | grep nginx'

# Kill process (graceful)
ssh srv759970 'sudo kill PID'

# Kill process (force)
ssh srv759970 'sudo kill -9 PID'

# Process tree
ssh srv759970 'pstree -p'
```

### File Operations

```bash
# Check if file exists
ssh srv759970 'test -f /opt/myfile && echo "exists" || echo "not found"'

# Read file
ssh srv759970 'cat /opt/myfile'

# Check directory size
ssh srv759970 'du -sh /opt/myapp'

# List recent files
ssh srv759970 'ls -lt /opt/myapp | head -20'
```

## Running Multi-Line Commands

Use heredoc for complex commands:

```bash
ssh srv759970 << 'EOF'
echo "Starting maintenance..."
docker image prune -f
docker volume prune -f
df -h
echo "Maintenance complete"
EOF
```

## Security Best Practices

1. **Always use key authentication** (never passwords)
2. **Use automation user** (not root)
3. **Keep keys secure** (proper permissions, passphrases)
4. **Use SSH config** to avoid mistakes
5. **Keep connection alive** with ServerAliveInterval
6. **Audit sudo logs**: `/var/log/sudo-automation.log`

## Automation User Restrictions

The automation user **CANNOT**:
- ❌ Reboot server: `sudo reboot`
- ❌ Shutdown server: `sudo shutdown`
- ❌ Modify sudo config
- ❌ Change root password
- ❌ Modify critical system files (intentional safety)

The automation user **CAN**:
- ✅ Manage services: `sudo systemctl restart nginx`
- ✅ Docker operations: `docker-compose up -d`
- ✅ Modify configs: `sudo nano /etc/nginx/sites-available/site`
- ✅ SSL/Certbot: `sudo certbot --nginx`
- ✅ Install packages: `sudo apt install package`
- ✅ View logs: `sudo journalctl -u service`
- ✅ Change file permissions: `sudo chown automation:automation file`

**Why?** Safety - prevents accidental server shutdown via Claude Code operations.

## Reference Files

- **scripts/fix-ssh-permissions.ps1** - Fix SSH key permissions on Windows
- **references/ssh-config-examples.md** - SSH config templates
- **references/automation-user-guide.md** - Detailed user permissions

## Quick Commands Reference

```bash
# Connect
ssh automation@69.62.108.82

# Status check
ssh srv759970 'free -h && df -h && uptime'

# Docker containers
ssh srv759970 'docker ps'

# Fix SSH permissions (Windows)
powershell scripts/fix-ssh-permissions.ps1

# Disk space
ssh srv759970 'df -h'

# Memory usage
ssh srv759970 'free -h'

# View logs
ssh srv759970 'sudo journalctl -n 100'
```

## Important Notes

- **automation user** is the default account for all operations
- **SSH keys** must have correct permissions (600 on Linux, restricted on Windows)
- **Connection issues** are usually permission-related on Windows
- **Sudo logs** are in `/var/log/sudo-automation.log` for audit
- **Never use root** for day-to-day operations
