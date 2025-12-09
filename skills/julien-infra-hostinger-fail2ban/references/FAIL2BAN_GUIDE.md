# 🚨 Fail2ban Management Guide

Quick reference for managing Fail2ban WordPress protection on srv759970.hstgr.cloud

---

## 📊 Quick Status Check

```bash
# Overall status
ssh automation@69.62.108.82 "sudo fail2ban-client status"

# WordPress jails status
ssh automation@69.62.108.82 "sudo fail2ban-client status wordpress-auth"
ssh automation@69.62.108.82 "sudo fail2ban-client status wordpress-hard"
ssh automation@69.62.108.82 "sudo fail2ban-client status wordpress-xmlrpc"
```

**Expected Output:**
```
Status for the jail: wordpress-auth
|- Filter
|  |- Currently failed:	X
|  |- Total failed:	Y
`- Actions
   |- Currently banned:	Z
   |- Total banned:	W
   `- Banned IP list:	1.2.3.4 8.8.8.8
```

---

## 🔓 Unban an IP Address

### Single IP
```bash
# Unban from specific jail
ssh automation@69.62.108.82 "sudo fail2ban-client set wordpress-auth unbanip 1.2.3.4"

# Unban from all jails
ssh automation@69.62.108.82 "sudo fail2ban-client unban 1.2.3.4"
```

### Unban All IPs
```bash
ssh automation@69.62.108.82 "sudo fail2ban-client unban --all"
```

---

## 🔒 Ban an IP Manually

```bash
# Ban specific IP in wordpress-auth jail
ssh automation@69.62.108.82 "sudo fail2ban-client set wordpress-auth banip 1.2.3.4"

# Ban with specific duration (in seconds)
ssh automation@69.62.108.82 "sudo fail2ban-client set wordpress-auth banip 1.2.3.4 7200"
```

---

## 📋 View Banned IPs

```bash
# List currently banned IPs per jail
ssh automation@69.62.108.82 "sudo fail2ban-client status wordpress-auth | grep 'Banned IP list'"

# View all currently banned IPs
ssh automation@69.62.108.82 "sudo iptables -L -n | grep DROP"
```

---

## 📊 View Fail2ban Logs

### Real-time monitoring
```bash
# Live ban events
ssh automation@69.62.108.82 "sudo tail -f /var/log/fail2ban.log | grep Ban"

# All fail2ban activity
ssh automation@69.62.108.82 "sudo tail -f /var/log/fail2ban.log"
```

### Historical analysis
```bash
# Last 50 ban events
ssh automation@69.62.108.82 "sudo grep 'Ban' /var/log/fail2ban.log | tail -50"

# Bans today only
ssh automation@69.62.108.82 "sudo grep 'Ban' /var/log/fail2ban.log | grep '$(date +%Y-%m-%d)'"

# Count bans by IP
ssh automation@69.62.108.82 "sudo grep 'Ban' /var/log/fail2ban.log | awk '{print \$NF}' | sort | uniq -c | sort -nr"
```

---

## ⚙️ Adjust Jail Settings

### Temporarily Adjust Thresholds

**Edit wordpress jail:**
```bash
ssh automation@69.62.108.82
sudo nano /etc/fail2ban/jail.d/wordpress.conf
```

**Common adjustments:**
```ini
[wordpress-auth]
# Increase tolerance
maxretry = 10    # Default: 5
findtime = 1200  # Default: 600 (10 minutes)
bantime = 1800   # Default: 3600 (1 hour)

# Or make more strict
maxretry = 3     # More strict
bantime = 7200   # Ban for 2 hours
```

**Apply changes:**
```bash
sudo fail2ban-client reload wordpress-auth
```

---

## 🔍 Test Filters

### Test detection patterns
```bash
# Test wordpress-auth filter against log
ssh automation@69.62.108.82 "sudo fail2ban-regex /var/log/nginx/clemence-access.log /etc/fail2ban/filter.d/wordpress-auth.conf"

# Test wordpress-hard filter
ssh automation@69.62.108.82 "sudo fail2ban-regex /var/log/nginx/clemence-access.log /etc/fail2ban/filter.d/wordpress-hard.conf"

# See what would be detected (without banning)
ssh automation@69.62.108.82 "sudo fail2ban-regex /var/log/nginx/*-access.log /etc/fail2ban/filter.d/wordpress-auth.conf --print-all-matched"
```

---

## 🛡️ Whitelist IPs

### Add permanent whitelist
```bash
ssh automation@69.62.108.82
sudo nano /etc/fail2ban/jail.d/wordpress.conf
```

**Add at top of file:**
```ini
[DEFAULT]
# Whitelist specific IPs (never ban these)
ignoreip = 127.0.0.1/8 ::1
           YOUR_HOME_IP
           YOUR_OFFICE_IP
```

**Restart fail2ban:**
```bash
sudo systemctl restart fail2ban
```

---

## 🔄 Restart/Reload Fail2ban

```bash
# Reload configuration (keeps bans)
ssh automation@69.62.108.82 "sudo fail2ban-client reload"

# Reload specific jail
ssh automation@69.62.108.82 "sudo fail2ban-client reload wordpress-auth"

# Full restart (clears all bans)
ssh automation@69.62.108.82 "sudo systemctl restart fail2ban"

# Stop fail2ban
ssh automation@69.62.108.82 "sudo systemctl stop fail2ban"

# Start fail2ban
ssh automation@69.62.108.82 "sudo systemctl start fail2ban"
```

---

## 📈 Statistics & Reports

### Ban statistics per jail
```bash
# Total bans ever
ssh automation@69.62.108.82 "sudo fail2ban-client status wordpress-auth | grep 'Total banned'"

# Currently banned
ssh automation@69.62.108.82 "sudo fail2ban-client status wordpress-auth | grep 'Currently banned'"

# Failed attempts detected
ssh automation@69.62.108.82 "sudo fail2ban-client status wordpress-auth | grep 'Total failed'"
```

### Top 10 banned IPs
```bash
ssh automation@69.62.108.82 "sudo grep 'Ban' /var/log/fail2ban.log | awk '{print \$NF}' | sort | uniq -c | sort -nr | head -10"
```

### Bans per day (last 7 days)
```bash
ssh automation@69.62.108.82 "for i in {0..6}; do date=\$(date -d \"-\$i days\" +%Y-%m-%d); count=\$(sudo grep \"Ban\" /var/log/fail2ban.log | grep \"\$date\" | wc -l); echo \"\$date: \$count bans\"; done"
```

---

## 🚨 Common Issues & Solutions

### Issue: Legitimate user banned

**Solution:**
```bash
# 1. Unban the IP
ssh automation@69.62.108.82 "sudo fail2ban-client unban 1.2.3.4"

# 2. Whitelist if recurring
# Add to ignoreip in /etc/fail2ban/jail.d/wordpress.conf

# 3. Increase maxretry if too strict
# Edit jail config: maxretry = 10 instead of 5
```

---

### Issue: Fail2ban not detecting attacks

**Solution:**
```bash
# 1. Check filter is working
ssh automation@69.62.108.82 "sudo fail2ban-regex /var/log/nginx/clemence-access.log /etc/fail2ban/filter.d/wordpress-auth.conf"

# 2. Check jail is enabled
ssh automation@69.62.108.82 "sudo fail2ban-client status | grep wordpress"

# 3. Check log path is correct
ssh automation@69.62.108.82 "sudo ls -lh /var/log/nginx/*-access.log"

# 4. Restart fail2ban
ssh automation@69.62.108.82 "sudo systemctl restart fail2ban"
```

---

### Issue: Too many false positives

**Solution:**
```bash
# 1. Increase maxretry threshold
# Edit /etc/fail2ban/jail.d/wordpress.conf
maxretry = 10  # Instead of 5

# 2. Increase findtime window
findtime = 1200  # 20 minutes instead of 10

# 3. Check filter patterns
# Review /etc/fail2ban/filter.d/wordpress-*.conf
# Remove overly aggressive patterns

# 4. Reload
ssh automation@69.62.108.82 "sudo fail2ban-client reload"
```

---

### Issue: Fail2ban service not starting

**Solution:**
```bash
# 1. Check service status
ssh automation@69.62.108.82 "sudo systemctl status fail2ban"

# 2. Check configuration syntax
ssh automation@69.62.108.82 "sudo fail2ban-client -t"

# 3. View service logs
ssh automation@69.62.108.82 "sudo journalctl -u fail2ban -n 50"

# 4. Fix configuration errors and restart
ssh automation@69.62.108.82 "sudo systemctl restart fail2ban"
```

---

## 🔧 Advanced Configuration

### Custom ban actions (email notification)

**Edit action:**
```bash
sudo nano /etc/fail2ban/action.d/sendmail-whois.conf
```

**Configure in jail:**
```ini
[wordpress-hard]
action = iptables-multiport[name=wordpress-hard, port="http,https", protocol=tcp]
         sendmail-whois[name=wordpress-hard, dest=your@email.com]
```

---

### Permanent bans (never expire)

```bash
sudo nano /etc/fail2ban/jail.d/wordpress.conf
```

**Add permanent ban section:**
```ini
[wordpress-permanent]
enabled = true
filter = wordpress-hard
maxretry = 1
findtime = 86400
bantime = -1    # Permanent ban
```

---

### Country blocking (GeoIP)

**Requires:** `geoip-database` package

```bash
# Install GeoIP
sudo apt-get install geoip-database geoip-bin

# Create filter
sudo nano /etc/fail2ban/filter.d/geoip.conf
```

**Filter content:**
```ini
[Definition]
failregex = <HOST>
ignoreregex =

[Init]
# Block specific countries (example: CN, RU)
badcountry = CN RU
```

---

## 📊 Monitoring Dashboard

### Create daily summary script

**Create script:**
```bash
nano ~/fail2ban-summary.sh
```

**Script content:**
```bash
#!/bin/bash
echo "=== Fail2ban Daily Summary ==="
echo "Date: $(date)"
echo ""
echo "Active Jails:"
sudo fail2ban-client status | grep "Jail list"
echo ""
echo "Currently Banned IPs:"
for jail in wordpress-auth wordpress-hard wordpress-xmlrpc; do
    echo "  $jail:"
    sudo fail2ban-client status $jail | grep "Currently banned"
done
echo ""
echo "Total Bans Today:"
sudo grep "Ban" /var/log/fail2ban.log | grep "$(date +%Y-%m-%d)" | wc -l
echo ""
echo "Top 5 Banned IPs Today:"
sudo grep "Ban" /var/log/fail2ban.log | grep "$(date +%Y-%m-%d)" | awk '{print $NF}' | sort | uniq -c | sort -nr | head -5
```

**Run daily:**
```bash
chmod +x ~/fail2ban-summary.sh
# Add to crontab: 0 8 * * * ~/fail2ban-summary.sh | mail -s "Fail2ban Summary" your@email.com
```

---

## 🎯 Best Practices

1. **Monitor regularly** - Check status at least weekly
2. **Review bans** - Investigate banned IPs to understand attack patterns
3. **Adjust thresholds** - Fine-tune maxretry/findtime based on real traffic
4. **Whitelist known IPs** - Add your own IPs to ignoreip
5. **Test before production** - Use fail2ban-regex to test filters
6. **Keep logs** - Rotate and archive fail2ban logs for analysis
7. **Update filters** - Review and update detection patterns periodically
8. **Backup configuration** - Keep copies of working jail/filter configs

---

## 📚 Configuration Files Reference

**Main configuration:**
- `/etc/fail2ban/fail2ban.conf` - Fail2ban daemon config (don't edit)
- `/etc/fail2ban/jail.conf` - Default jails (don't edit)

**Custom configuration:**
- `/etc/fail2ban/jail.d/wordpress.conf` - WordPress jails (edit this)
- `/etc/fail2ban/filter.d/wordpress-*.conf` - Detection patterns (edit this)

**Logs:**
- `/var/log/fail2ban.log` - Fail2ban activity log
- `/var/log/nginx/*-access.log` - Nginx logs (parsed by filters)
- `/var/log/auth.log` - SSH authentication log

---

## 🆘 Emergency Commands

### Completely disable Fail2ban
```bash
ssh automation@69.62.108.82 "sudo systemctl stop fail2ban && sudo systemctl disable fail2ban"
```

### Flush all bans and reset
```bash
ssh automation@69.62.108.82 "sudo fail2ban-client unban --all && sudo systemctl restart fail2ban"
```

### Remove WordPress jails completely
```bash
ssh automation@69.62.108.82 "sudo rm /etc/fail2ban/jail.d/wordpress.conf && sudo systemctl restart fail2ban"
```

---

**Last Updated:** 2025-10-28
**Version:** 1.0.0
