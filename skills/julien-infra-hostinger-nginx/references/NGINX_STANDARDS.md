# 📐 Nginx Configuration Standards

**Project:** Nginx Manager - srv759970.hstgr.cloud
**Purpose:** Standards et bonnes pratiques pour toutes les configurations Nginx
**Last Updated:** 2025-10-28

---

## 🎯 Objectif

Ce document définit les **standards obligatoires** et **bonnes pratiques recommandées** pour toutes les configurations Nginx sur srv759970.hstgr.cloud.

**Règle d'or :** Utiliser les templates dans `templates/` et valider avec `scripts/validate-nginx-config.sh` avant tout déploiement.

---

## ⚠️ Standards OBLIGATOIRES

### 1. Listen Directives (IPv4 + IPv6) ⚡ CRITIQUE

**Problème si non respecté :** Nginx peut servir le **mauvais site** (ex: redirection vers clemencefouquet.fr au lieu de votre site).

**Standard :**
```nginx
# HTTPS block
server {
    listen 443 ssl http2;        # IPv4 HTTPS
    listen [::]:443 ssl http2;   # IPv6 HTTPS - OBLIGATOIRE
    server_name example.com;
    # ...
}

# HTTP block (redirect)
server {
    listen 80;         # IPv4 HTTP
    listen [::]:80;    # IPv6 HTTP - OBLIGATOIRE
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

**Pourquoi IPv6 est critique :**
- Sans `listen [::]:443`, le SNI (Server Name Indication) peut échouer
- Nginx sert alors le **premier site alphabétiquement** (souvent clemence-multidomains)
- Le basic auth ou d'autres configs ne sont pas appliqués

**Vérification :**
```bash
./scripts/validate-nginx-config.sh nom-du-site
# Doit passer les checks "Has IPv6 listen directive"
```

---

### 2. Proxy Headers (Reverse Proxy) ⚡ CRITIQUE

**Problème si non respecté :** HTTPS redirect loops, logs incorrects, authentification cassée.

**Standard obligatoire :**
```nginx
location / {
    proxy_pass http://localhost:PORT;

    # OBLIGATOIRES pour reverse proxy
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;  # CRITIQUE pour HTTPS
}
```

**Headers critiques :**
- `Host` : Permet au backend de connaître le domaine demandé
- `X-Forwarded-Proto` : Indique HTTPS au backend (évite redirect loop)
- `X-Real-IP` / `X-Forwarded-For` : Logs avec vraies IPs clients (pas 127.0.0.1)

**Pour WordPress, ajouter aussi :**
```nginx
proxy_set_header X-Forwarded-Host $host;
```

---

### 3. server_name Défini

**Standard :**
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.srv759970.hstgr.cloud;  # OBLIGATOIRE
    # ...
}
```

**Jamais :**
```nginx
server_name _;  # À éviter sauf pour default_server catch-all
```

---

### 4. SSL Certificates

**Standard :**
```nginx
ssl_certificate /etc/letsencrypt/live/DOMAIN/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/DOMAIN/privkey.pem;
include /etc/letsencrypt/options-ssl-nginx.conf;
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
```

**Vérification avant déploiement :**
```bash
ssh automation@69.62.108.82 "ls -lh /etc/letsencrypt/live/DOMAIN/"
```

---

### 5. HTTP → HTTPS Redirect

**Standard :**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com;
    return 301 https://$server_name$request_uri;  # Utiliser $server_name
}
```

**Jamais :**
```nginx
return 301 https://example.com$request_uri;  # Hardcoded domain = mauvaise pratique
```

---

## ✅ Bonnes Pratiques RECOMMANDÉES

### 6. HTTP/2 Activation

**Recommandé :**
```nginx
listen 443 ssl http2;  # Inclure http2
```

**Bénéfice :** Meilleure performance (multiplexing, compression headers)

---

### 7. Security Headers

**Recommandé pour tous les sites :**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

**Pour WordPress, ajouter CSP compatible :**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self'; base-uri 'self'; form-action 'self';" always;
```

---

### 8. HTTP Method Restriction

**Recommandé (security best practice) :**
```nginx
# Utiliser le snippet
include snippets/http-method-restriction.conf;
```

**Bloque :** PUT, DELETE, TRACE, OPTIONS, CONNECT, PATCH (inutiles pour la plupart des apps)

---

### 9. Logging

**Standard :**
```nginx
access_log /var/log/nginx/SITE_NAME-access.log;
error_log /var/log/nginx/SITE_NAME-error.log;
```

**Utiliser le nom du site** (pas le domaine complet) pour faciliter les logs.

---

### 10. Upload Size (WordPress/Apps)

**Recommandé pour WordPress :**
```nginx
client_max_body_size 100M;  # Permet uploads media WordPress
```

**Appliquer dans les locations concernées :**
- `location / { ... }`
- `location = /wp-login.php { ... }`
- `location ~ ^/wp-admin/ { ... }`

---

## 🔐 Standards de Sécurité WordPress

### 11. Bot Protection

**Utiliser TOUJOURS le snippet WordPress-compatible :**
```nginx
include snippets/bot-protection-wordpress.conf;
```

**❌ NE JAMAIS utiliser :**
```nginx
include snippets/bot-protection.conf;  # Bloque wp-admin !
```

---

### 12. Rate Limiting WordPress

**Standard pour brute force protection :**
```nginx
# wp-login.php
location = /wp-login.php {
    limit_req zone=wplogin burst=5 nodelay;
    limit_req_status 429;
    # ... proxy config
}

# wp-admin
location ~ ^/wp-admin/ {
    limit_req zone=wpadmin burst=50 nodelay;
    limit_req_status 429;
    # ... proxy config
}

# REST API
location ~ ^/wp-json/ {
    limit_req zone=wpapi burst=20 nodelay;
    limit_req_status 429;
    # ... proxy config
}

# XML-RPC (bloquer complètement)
location = /xmlrpc.php {
    limit_req zone=xmlrpc burst=2 nodelay;
    return 444;
}
```

**Zones définies dans :** `/etc/nginx/conf.d/rate-limiting-zones.conf`

---

### 13. PHP Upload Blocking

**OBLIGATOIRE pour WordPress (prevent backdoor) :**
```nginx
location ~* /(?:uploads|files|wp-content/uploads)/.*\.php$ {
    deny all;
    return 403;
}
```

---

## 🚀 Workflow de Déploiement

### Déploiement d'un NOUVEAU site

1. **Copier le template approprié :**
   ```bash
   # WordPress
   cp templates/site-template-wordpress.conf configs/sites-available/nouveau-site

   # Reverse proxy (Streamlit, Node.js, etc.)
   cp templates/site-template-reverse-proxy.conf configs/sites-available/nouveau-site
   ```

2. **Remplacer les placeholders :**
   - `{{DOMAIN_NAME}}` → ex: `nouveau-site.srv759970.hstgr.cloud`
   - `{{SITE_NAME}}` → ex: `nouveau-site` (pour logs)
   - `{{BACKEND_PORT}}` → ex: `8501` (Streamlit), `9002` (WordPress)

3. **Vérifier que le backend tourne :**
   ```bash
   ssh automation@69.62.108.82 "curl -I http://localhost:PORT"
   ```

4. **Valider la configuration :**
   ```bash
   ./scripts/validate-nginx-config.sh nouveau-site
   ```

5. **Déployer :**
   ```bash
   ./scripts/nginx-deploy.sh configs/sites-available/nouveau-site nouveau-site
   ```

6. **Tester :**
   ```bash
   curl -k -I https://nouveau-site.srv759970.hstgr.cloud/
   ```

---

### Modification d'un site EXISTANT

1. **Backup avant modification :**
   ```bash
   ./scripts/nginx-backup.sh nom-du-site
   ```

2. **Modifier localement :**
   ```bash
   nano configs/sites-available/nom-du-site
   ```

3. **Valider :**
   ```bash
   ./scripts/validate-nginx-config.sh nom-du-site
   ```

4. **Déployer :**
   ```bash
   ./scripts/nginx-deploy.sh configs/sites-available/nom-du-site nom-du-site
   ```

5. **Si problème, rollback :**
   ```bash
   ./scripts/nginx-rollback.sh --list nom-du-site
   ./scripts/nginx-rollback.sh nom-du-site TIMESTAMP
   ```

---

## 🔍 Validation & Troubleshooting

### Commandes de Validation

**Valider UN site :**
```bash
./scripts/validate-nginx-config.sh nom-du-site
```

**Valider TOUS les sites :**
```bash
./scripts/validate-nginx-config.sh
```

**Tester la config Nginx sur le serveur :**
```bash
ssh automation@69.62.108.82 "sudo nginx -t"
```

---

### Troubleshooting Commun

#### Problème : Site redirige vers clemencefouquet.fr

**Cause :** Missing IPv6 listen directives

**Solution :**
```nginx
# Ajouter [::] à TOUTES les listen directives
listen 443 ssl http2;
listen [::]:443 ssl http2;  # AJOUTER CETTE LIGNE

listen 80;
listen [::]:80;  # AJOUTER CETTE LIGNE
```

**Vérification :**
```bash
./scripts/validate-nginx-config.sh nom-du-site
# Doit passer "Has IPv6 HTTPS listen directive"
```

---

#### Problème : HTTPS redirect loop

**Cause :** Missing `X-Forwarded-Proto` header

**Solution :**
```nginx
location / {
    proxy_pass http://localhost:PORT;
    proxy_set_header X-Forwarded-Proto $scheme;  # AJOUTER CETTE LIGNE
    # ... autres headers
}
```

---

#### Problème : wp-admin retourne 404 (WordPress)

**Cause :** Mauvais snippet de bot protection

**Solution :**
```nginx
# Remplacer
include snippets/bot-protection.conf;

# Par
include snippets/bot-protection-wordpress.conf;
```

---

#### Problème : Basic auth ne fonctionne pas

**Causes possibles :**
1. Mauvais site servi (vérifier IPv6 listen)
2. Snippet auth pas inclus
3. Fichier .htpasswd manquant

**Vérification :**
```bash
# 1. Tester avec Host header explicite
curl -k -I -H 'Host: site.srv759970.hstgr.cloud' https://69.62.108.82/
# Devrait retourner 401 Unauthorized

# 2. Vérifier fichier htpasswd
ssh automation@69.62.108.82 "cat /etc/nginx/.htpasswd"

# 3. Vérifier snippet inclus
grep "include snippets/basic-auth.conf" configs/sites-available/nom-du-site
```

---

#### Problème : Logs montrent IP 127.0.0.1

**Cause :** Missing proxy headers

**Solution :**
```nginx
location / {
    proxy_pass http://localhost:PORT;
    proxy_set_header X-Real-IP $remote_addr;         # AJOUTER
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # AJOUTER
    # ...
}
```

---

## 📚 Templates Disponibles

| Template | Usage | Path |
|----------|-------|------|
| **WordPress** | Sites WordPress derrière Docker | `templates/site-template-wordpress.conf` |
| **Reverse Proxy** | Streamlit, Node.js, apps génériques | `templates/site-template-reverse-proxy.conf` |

**Créer un nouveau template :**
1. Partir d'une config existante fonctionnelle
2. Remplacer les valeurs spécifiques par `{{PLACEHOLDERS}}`
3. Ajouter checklist de déploiement dans les commentaires
4. Ajouter section "Common Issues" avec solutions

---

## 🔧 Scripts Disponibles

| Script | Description | Usage |
|--------|-------------|-------|
| `validate-nginx-config.sh` | Valide configs (IPv6, headers, SSL) | `./scripts/validate-nginx-config.sh [site]` |
| `nginx-deploy.sh` | Déploiement sécurisé avec backup | `./scripts/nginx-deploy.sh local remote` |
| `nginx-backup.sh` | Backup manuel | `./scripts/nginx-backup.sh [site]` |
| `nginx-rollback.sh` | Restauration backup | `./scripts/nginx-rollback.sh site timestamp` |
| `health-check.sh` | Vérification services critiques | `./scripts/health-check.sh` |
| `sync-from-server.sh` | Download configs → Git | `./scripts/sync-from-server.sh [--commit]` |
| `sync-to-server.sh` | Upload Git → Server | `./scripts/sync-to-server.sh file` |

---

## ✅ Checklist Pré-Déploiement

Avant TOUT déploiement, vérifier :

- [ ] **IPv4 + IPv6 listen** : `listen 443 ssl http2;` ET `listen [::]:443 ssl http2;`
- [ ] **IPv4 + IPv6 HTTP redirect** : `listen 80;` ET `listen [::]:80;`
- [ ] **server_name défini** : Pas de `server_name _;` sauf default_server
- [ ] **SSL certificates existent** : `ls /etc/letsencrypt/live/DOMAIN/`
- [ ] **Proxy headers complets** : Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto
- [ ] **Backend running** : `curl http://localhost:PORT`
- [ ] **Validation passed** : `./scripts/validate-nginx-config.sh site`
- [ ] **Backup créé** : Automatique avec nginx-deploy.sh
- [ ] **Nginx test OK** : `sudo nginx -t`
- [ ] **Health check après déploiement** : `./scripts/health-check.sh`

---

## 📖 Documentation Complémentaire

- **Templates :** `templates/`
- **Scripts :** `scripts/`
- **Gap Analysis :** `docs/HARDENING_GAP_ANALYSIS.md`
- **Phase 4 Report :** `docs/SECURITY_PHASE4_COMPLETED.md`
- **Quick Reference :** `QUICK_REFERENCE.md`

---

## 🆘 Support & Contact

En cas de problème non documenté :
1. Vérifier `docs/NGINX_STANDARDS.md` (ce document)
2. Valider avec `./scripts/validate-nginx-config.sh`
3. Consulter templates dans `templates/`
4. Vérifier logs : `/var/log/nginx/SITE-error.log`

---

**Version:** 1.0
**Date:** 2025-10-28
**Maintainer:** Julien Fernandez
**Dernière validation:** Phase 4 completion
