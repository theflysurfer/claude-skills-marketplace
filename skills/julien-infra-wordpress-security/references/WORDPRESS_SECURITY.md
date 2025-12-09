# 🔒 WordPress Security - Guide Complet VPS + Nginx

Guide de sécurisation WordPress pour serveur personnel (VPS) avec Nginx comme reverse proxy.

**Basé sur** : Recherche 2025 des meilleures pratiques (SpinupWP, DigitalOcean, OWASP, WordPress.org)

---

## 📋 Table des Matières

1. [Niveau Serveur (Nginx)](#niveau-serveur-nginx)
2. [Niveau Application (WordPress)](#niveau-application-wordpress)
3. [Niveau Base de Données](#niveau-base-de-données)
4. [Monitoring & Détection](#monitoring--détection)
5. [Checklist de Sécurité](#checklist-de-sécurité)

---

## 🛡️ Niveau Serveur (Nginx)

### 1. Security Headers

Ajouter ces headers à tous les blocs `server` WordPress :

```nginx
# Prévient le chargement du site dans une iframe (clickjacking)
add_header X-Frame-Options "SAMEORIGIN" always;

# Prévient le MIME-sniffing
add_header X-Content-Type-Options "nosniff" always;

# Protection XSS (Cross-Site Scripting)
add_header X-XSS-Protection "1; mode=block" always;

# Référer Policy
add_header Referrer-Policy "no-referrer-when-downgrade" always;

# Content Security Policy (CSP)
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self';" always;

# HTTP Strict Transport Security (HSTS) - Force HTTPS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**⚠️ CSP Note** : La politique ci-dessus est permissive pour WordPress (permet `unsafe-inline` car beaucoup de plugins l'utilisent). Pour plus de sécurité, restreindre progressivement.

---

### 2. Cacher les Versions

```nginx
# Dans http block de nginx.conf
server_tokens off;
more_clear_headers Server;  # Nécessite ngx_headers_more module
```

---

### 3. Bloquer XML-RPC (Attaques Brute Force)

**Option A : Bloquer Complètement**

```nginx
location = /xmlrpc.php {
    deny all;
    access_log off;
    log_not_found off;
    return 444;  # Ferme la connexion sans réponse
}
```

**Option B : Rate Limiting (Si Jetpack utilisé)**

```nginx
# Dans http block
limit_req_zone $binary_remote_addr zone=xmlrpc:10m rate=1r/s;

# Dans server block
location = /xmlrpc.php {
    limit_req zone=xmlrpc burst=5 nodelay;

    # Optionnel: Allow Jetpack seulement
    if ( $query_string !~* ".*jetpack.*" ) {
        return 404;
    }

    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
}
```

**Résultat** : Empêche les attaques DDoS via XML-RPC qui peuvent envoyer des milliers de pingbacks.

---

### 4. Protéger wp-login.php (Brute Force)

**Option A : Rate Limiting**

```nginx
# Dans http block
limit_req_zone $binary_remote_addr zone=wplogin:10m rate=10r/m;

# Dans server block
location = /wp-login.php {
    limit_req zone=wplogin burst=5 nodelay;

    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
}
```

**Option B : Basic Auth (Double Protection)**

```nginx
location = /wp-login.php {
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;

    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
}
```

Créer le fichier `.htpasswd` :
```bash
htpasswd -c /etc/nginx/.htpasswd admin
```

**Option C : Fail2ban (Recommandé)**

Voir section [Monitoring & Détection](#monitoring--détection) ci-dessous.

---

### 5. Sécuriser wp-json REST API

**Rate Limiting pour l'API**

```nginx
# Dans http block
limit_req_zone $binary_remote_addr zone=wpapi:10m rate=10r/s;

# Dans server block
location ~ ^/wp-json/ {
    limit_req zone=wpapi burst=20 nodelay;

    # Optionnel: Bloquer complètement si pas besoin
    # deny all;
    # return 403;

    try_files $uri $uri/ /index.php?$args;
}
```

**Bloquer l'énumération des utilisateurs**

```nginx
location ~* ^/wp-json/wp/v2/users {
    deny all;
    return 403;
}
```

---

### 6. Whitelist PHP Execution (Approche Sécurisée)

**Principe** : N'autoriser l'exécution PHP QUE dans les dossiers nécessaires.

```nginx
# Bloquer PHP dans wp-content (sauf exceptions)
location ~* ^/wp-content/.*\.php$ {
    deny all;
}

# Autoriser PHP seulement dans wp-includes (limité)
location ~* ^/wp-includes/.*\.php$ {
    # Whitelist des fichiers PHP nécessaires
    location ~* ^/wp-includes/(js/tinymce/wp-tinymce\.php|ms-files\.php)$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }
    deny all;
}

# Autoriser PHP dans wp-admin
location ^~ /wp-admin/ {
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }
}

# Root level PHP (wp-login, wp-cron, etc.)
location ~ \.php$ {
    # Whitelist explicite des fichiers autorisés
    location ~* ^/(wp-login|wp-cron|wp-signup|wp-trackback|index)\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }
    deny all;
}
```

**Résultat** : Empêche l'exécution de backdoors PHP uploadés via vulnérabilités.

---

### 7. Bloquer Fichiers Sensibles

```nginx
# Bloquer fichiers cachés (.htaccess, .git, etc.)
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}

# Bloquer wp-config.php
location = /wp-config.php {
    deny all;
}

# Bloquer readme, license, etc.
location ~* ^/(readme|license|changelog)\.(html|txt)$ {
    deny all;
}

# Bloquer fichiers de log
location ~* \.(log|sql|bak|swp|old|tmp)$ {
    deny all;
}

# Bloquer composer/npm files
location ~* (composer\.json|composer\.lock|package\.json|package-lock\.json|yarn\.lock)$ {
    deny all;
}
```

---

### 8. SSL/TLS Configuration (HTTPS)

```nginx
# Protocoles sécurisés seulement (TLS 1.2+)
ssl_protocols TLSv1.2 TLSv1.3;

# Ciphers sécurisés
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers on;

# Session cache
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# OCSP Stapling (vérification certificat plus rapide)
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Diffie-Hellman parameters (générer avec: openssl dhparam -out /etc/nginx/dhparam.pem 2048)
ssl_dhparam /etc/nginx/dhparam.pem;
```

---

### 9. Disable Directory Listing

```nginx
# Dans server block ou http block
autoindex off;
```

---

### 10. Upload Limits

```nginx
# Limite taille upload (ajuster selon besoins)
client_max_body_size 100M;

# Timeouts
client_body_timeout 60s;
client_header_timeout 60s;
```

---

## 📦 Niveau Application (WordPress)

### 1. Fichiers & Permissions

**Permissions recommandées :**

```bash
# Dossiers
find /var/www/wordpress -type d -exec chmod 755 {} \;

# Fichiers
find /var/www/wordpress -type f -exec chmod 644 {} \;

# wp-config.php (le plus restrictif)
chmod 600 /var/www/wordpress/wp-config.php

# Propriétaire (www-data pour PHP-FPM)
chown -R www-data:www-data /var/www/wordpress
```

**Pour Docker :**

```yaml
# Dans docker-compose.yml
services:
  wordpress:
    user: "33:33"  # www-data UID:GID
```

---

### 2. wp-config.php Hardening

```php
<?php
// Désactiver l'éditeur de fichiers (empêche modification de code via admin)
define('DISALLOW_FILE_EDIT', true);

// Désactiver l'installation de plugins/thèmes (si pas besoin)
define('DISALLOW_FILE_MODS', true);

// Forcer SSL pour l'admin
define('FORCE_SSL_ADMIN', true);

// Désactiver debug en production
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);
define('WP_DEBUG_DISPLAY', false);

// Clés de sécurité uniques (générer sur https://api.wordpress.org/secret-key/1.1/salt/)
define('AUTH_KEY',         'générer une clé unique');
define('SECURE_AUTH_KEY',  'générer une clé unique');
define('LOGGED_IN_KEY',    'générer une clé unique');
define('NONCE_KEY',        'générer une clé unique');
define('AUTH_SALT',        'générer une clé unique');
define('SECURE_AUTH_SALT', 'générer une clé unique');
define('LOGGED_IN_SALT',   'générer une clé unique');
define('NONCE_SALT',       'générer une clé unique');

// Préfixe de table custom (pour éviter SQL injection basique)
$table_prefix = 'wp_rnd42_';  // Changer 'rnd42' par quelque chose d'aléatoire

// Désactiver XML-RPC si pas besoin
add_filter('xmlrpc_enabled', '__return_false');

// Limiter révisions (économise DB)
define('WP_POST_REVISIONS', 5);
define('AUTOSAVE_INTERVAL', 300);  // 5 minutes

// Vider la corbeille automatiquement
define('EMPTY_TRASH_DAYS', 7);

// Proxy settings (si derrière Nginx reverse proxy)
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $_SERVER['HTTPS'] = 'on';
}
```

---

### 3. Plugins de Sécurité (Recommandés)

**Essentiels :**

1. **Wordfence Security** ou **Sucuri Security**
   - Firewall applicatif
   - Scanner de malwares
   - Monitoring en temps réel

2. **iThemes Security** ou **All In One WP Security**
   - Renforcement général
   - 2FA (Two-Factor Authentication)
   - Surveillance des fichiers

3. **WPS Hide Login**
   - Change l'URL de wp-login.php (ex: /mon-login-secret)

4. **Limit Login Attempts Reloaded**
   - Limite les tentatives de connexion (alternative à fail2ban côté WP)

**Optionnels :**

- **WP Fail2ban** - Intégration avec fail2ban système
- **Disable REST API** - Si pas besoin de l'API
- **Disable XML-RPC** - Plugin simple pour désactiver XML-RPC

---

### 4. Mises à Jour

**Activer les mises à jour automatiques :**

```php
// Dans wp-config.php

// Auto-update WordPress core (minor versions)
define('WP_AUTO_UPDATE_CORE', 'minor');

// Auto-update plugins (avec prudence!)
add_filter('auto_update_plugin', '__return_true');

// Auto-update themes
add_filter('auto_update_theme', '__return_true');
```

**Ou via WP-CLI :**

```bash
# Mettre à jour tout
wp core update
wp plugin update --all
wp theme update --all
```

---

### 5. Utilisateurs & Mots de Passe

**Bonnes pratiques :**

- ❌ Ne JAMAIS utiliser `admin` comme nom d'utilisateur
- ✅ Utiliser des noms uniques et non-prévisibles
- ✅ Mots de passe de 16+ caractères avec mix majuscules/minuscules/chiffres/symboles
- ✅ Activer 2FA (Two-Factor Authentication)
- ✅ Créer des utilisateurs avec les privilèges minimums requis

**Supprimer utilisateur admin par défaut :**

```bash
# Via WP-CLI
wp user delete admin --reassign=<new-admin-id>
```

---

### 6. Désactiver Énumération des Utilisateurs

```php
// Dans functions.php du thème

// Bloquer ?author=1 enumeration
add_action('template_redirect', function() {
    if (is_author()) {
        wp_redirect(home_url(), 301);
        exit;
    }
});

// Bloquer REST API user enumeration (si pas déjà fait dans Nginx)
add_filter('rest_endpoints', function($endpoints) {
    if (isset($endpoints['/wp/v2/users'])) {
        unset($endpoints['/wp/v2/users']);
    }
    if (isset($endpoints['/wp/v2/users/(?P<id>[\d]+)'])) {
        unset($endpoints['/wp/v2/users/(?P<id>[\d]+)']);
    }
    return $endpoints;
});
```

---

## 🗄️ Niveau Base de Données

### 1. Utilisateur MySQL Dédié

```sql
-- Créer un utilisateur dédié par site WordPress
CREATE USER 'wp_clemence'@'localhost' IDENTIFIED BY 'mot_de_passe_fort';

-- Donner UNIQUEMENT les privilèges nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX
ON clemence_db.* TO 'wp_clemence'@'localhost';

-- NE PAS donner SUPER, FILE, PROCESS, RELOAD, SHUTDOWN, etc.
```

---

### 2. Préfixe de Table Custom

Lors de l'installation, changer `wp_` par quelque chose d'aléatoire (ex: `wp_x7f2_`).

**Si déjà installé, changer via plugin** : Brozzme DB Prefix & Tools Addon

---

### 3. Backups Réguliers

```bash
# Backup automatique quotidien (cron)
0 3 * * * mysqldump -u root -p'PASSWORD' clemence_db | gzip > /backups/wordpress/clemence_db_$(date +\%Y\%m\%d).sql.gz

# Garder seulement 30 derniers jours
find /backups/wordpress/ -name "clemence_db_*.sql.gz" -mtime +30 -delete
```

**Ou utiliser plugin** : UpdraftPlus, BackWPup

---

### 4. Sécuriser MySQL

```bash
# Lancer le script de sécurisation
mysql_secure_installation
```

Répond :
- Remove anonymous users? **Yes**
- Disallow root login remotely? **Yes**
- Remove test database? **Yes**
- Reload privilege tables? **Yes**

---

## 🔍 Monitoring & Détection

### 1. Fail2ban (Brute Force Protection)

**Installer Fail2ban :**

```bash
apt-get install fail2ban
```

**Créer filtre WordPress : `/etc/fail2ban/filter.d/wordpress-auth.conf`**

```ini
[Definition]
failregex = ^<HOST> .* "POST /wp-login\.php
            ^<HOST> .* "POST /xmlrpc\.php
ignoreregex =
```

**Créer jail : `/etc/fail2ban/jail.d/wordpress.conf`**

```ini
[wordpress-auth]
enabled = true
filter = wordpress-auth
logpath = /var/log/nginx/access.log
maxretry = 3
findtime = 600
bantime = 3600
action = iptables-multiport[name=wordpress, port="http,https"]
```

**Redémarrer Fail2ban :**

```bash
systemctl restart fail2ban
fail2ban-client status wordpress-auth
```

**Résultat** : Après 3 tentatives de connexion échouées en 10 min, l'IP est bannie 1h.

---

### 2. Log Monitoring

**Surveiller les logs Nginx pour WordPress :**

```bash
# Accès logs
tail -f /var/log/nginx/clemence-access.log

# Erreur logs
tail -f /var/log/nginx/clemence-error.log

# Chercher les 404 suspects
grep "404" /var/log/nginx/clemence-access.log | grep -E "(wp-config|xmlrpc|\.git|\.env)"

# Chercher les tentatives wp-login
grep "wp-login.php" /var/log/nginx/clemence-access.log | grep "POST"
```

---

### 3. File Integrity Monitoring

**Utiliser plugin WordPress :**
- Wordfence (scanner intégré)
- Sucuri Security (monitoring des fichiers)

**Ou script bash custom :**

```bash
#!/bin/bash
# Sauvegarder checksums des fichiers WordPress core
find /var/www/wordpress -type f ! -path "*/wp-content/*" -exec md5sum {} \; > /tmp/wp-checksums.txt

# Comparer avec précédent scan
if [ -f /var/checksums/wp-checksums-prev.txt ]; then
    diff /var/checksums/wp-checksums-prev.txt /tmp/wp-checksums.txt > /tmp/wp-changes.txt
    if [ -s /tmp/wp-changes.txt ]; then
        echo "WordPress files changed!" | mail -s "WordPress File Changes" admin@example.com < /tmp/wp-changes.txt
    fi
fi

# Sauvegarder pour prochain scan
cp /tmp/wp-checksums.txt /var/checksums/wp-checksums-prev.txt
```

---

### 4. Alertes Automatiques

**Email si échec de connexion (plugin requis) :**

- WP Activity Log
- Simple History
- Wordfence

**Ou via Fail2ban :**

```ini
# Dans /etc/fail2ban/jail.d/wordpress.conf
action = iptables-multiport[name=wordpress, port="http,https"]
         sendmail-whois[name=wordpress, dest=admin@example.com]
```

---

## ✅ Checklist de Sécurité

### Serveur (Nginx)

- [ ] Security headers configurés (HSTS, CSP, X-Frame-Options, etc.)
- [ ] SSL/TLS sécurisé (TLS 1.2+, ciphers forts)
- [ ] XML-RPC bloqué ou rate-limited
- [ ] wp-login.php protégé (rate limit + fail2ban)
- [ ] wp-json API rate-limited
- [ ] Énumération utilisateurs bloquée (/wp-json/wp/v2/users)
- [ ] Whitelist PHP execution (pas d'exécution dans /wp-content/)
- [ ] Fichiers sensibles bloqués (wp-config.php, .git, etc.)
- [ ] Directory listing désactivé
- [ ] Server tokens cachés
- [ ] Upload limits configurés
- [ ] Fail2ban installé et actif

### WordPress

- [ ] wp-config.php sécurisé (DISALLOW_FILE_EDIT, clés uniques)
- [ ] Permissions fichiers correctes (755 dirs, 644 files, 600 wp-config)
- [ ] Utilisateur admin par défaut supprimé
- [ ] Mots de passe forts (16+ caractères)
- [ ] 2FA activé
- [ ] Plugins de sécurité installés (Wordfence/Sucuri)
- [ ] Mises à jour automatiques activées
- [ ] URL de login changée (WPS Hide Login)
- [ ] Énumération utilisateurs bloquée
- [ ] Debug mode désactivé en production
- [ ] Limite de révisions configurée

### Base de Données

- [ ] Utilisateur MySQL dédié par site
- [ ] Privilèges minimums donnés
- [ ] Préfixe de table custom (pas `wp_`)
- [ ] mysql_secure_installation exécuté
- [ ] Backups automatiques configurés
- [ ] Connexion root remote désactivée

### Monitoring

- [ ] Fail2ban actif et testé
- [ ] Logs Nginx surveillés
- [ ] Alertes email configurées
- [ ] File integrity monitoring actif
- [ ] Health checks réguliers

---

## 🚨 En Cas d'Attaque

### 1. Site Compromis

```bash
# 1. Mettre le site en maintenance
wp maintenance-mode activate

# 2. Scanner avec Wordfence
wp wordfence scan

# 3. Restaurer depuis backup propre
# (voir docs/BACKUP_RESTORE.md)

# 4. Changer TOUTES les clés de sécurité
# Regénérer sur https://api.wordpress.org/secret-key/1.1/salt/

# 5. Changer tous les mots de passe (WP + MySQL)

# 6. Vérifier les utilisateurs
wp user list

# 7. Vérifier les plugins/thèmes
wp plugin list
wp theme list
```

---

### 2. Attaque DDoS

```bash
# 1. Identifier les IPs attaquantes
tail -1000 /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -20

# 2. Bannir manuellement
iptables -A INPUT -s <IP_ATTAQUANTE> -j DROP

# 3. Activer Cloudflare (si disponible)
# Cloudflare offre protection DDoS gratuite

# 4. Rate limiting agressif temporaire
# Réduire les limites dans nginx.conf
```

---

## 📚 Ressources

### Documentation Officielle

- [WordPress Security - Codex](https://wordpress.org/support/article/hardening-wordpress/)
- [Nginx Security - Official Docs](https://nginx.org/en/docs/)
- [OWASP WordPress Security](https://owasp.org/www-project-wordpress-security/)

### Outils

- [Wordfence](https://www.wordfence.com/)
- [Sucuri SiteCheck](https://sitecheck.sucuri.net/)
- [WPScan](https://wpscan.com/) - Scanner de vulnérabilités WordPress

### Guides Référencés

- SpinupWP - Nginx Security Hardening (2024)
- DigitalOcean - Protect WordPress from XML-RPC Attacks
- GetPageSpeed - Best Practice Secure NGINX Configuration for WordPress

---

**Dernière mise à jour** : 2025-10-28
**Sources** : Recherche web 2025 + best practices OWASP
**Auteur** : Julien Fernandez (avec Claude Code)
