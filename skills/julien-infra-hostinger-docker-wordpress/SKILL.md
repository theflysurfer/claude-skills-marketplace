---
name: hostinger-docker
description: This skill provides Docker commands for WordPress on Hostinger VPS. Use when managing containers, viewing logs, fixing permissions, or debugging Docker issues.
allowed-tools: Bash, Read
---

# Hostinger Docker Commands

## Objectif
Gérer les containers Docker WordPress sur le VPS Hostinger.

---

## Configuration

```bash
SSH_HOST="srv759970"
VPS_IP="69.62.108.82"
WP_CONTAINER="wordpress-clemence"
DB_CONTAINER="mysql-clemence"
CLI_CONTAINER="wp-cli-clemence"
COMPOSE_DIR="/opt/wordpress-clemence"
```

---

## Containers du projet

| Container | Image | Port | Usage |
|-----------|-------|------|-------|
| wordpress-clemence | wordpress:latest | 9002 | WordPress + PHP |
| mysql-clemence | mysql:8.0 | 3306 | Base de données |
| wp-cli-clemence | wordpress:cli | - | WP-CLI |

---

## Commandes fréquentes

### Status des containers

```bash
# Voir tous les containers
ssh $SSH_HOST "docker ps"

# Containers clemence uniquement
ssh $SSH_HOST "docker ps | grep clemence"

# Stats en temps réel
ssh $SSH_HOST "docker stats --no-stream"
```

### Logs

```bash
# Logs WordPress
ssh $SSH_HOST "docker logs $WP_CONTAINER --tail=50"

# Logs MySQL
ssh $SSH_HOST "docker logs $DB_CONTAINER --tail=50"

# Suivre les logs en temps réel
ssh $SSH_HOST "docker logs -f $WP_CONTAINER"

# Logs avec timestamp
ssh $SSH_HOST "docker logs $WP_CONTAINER --tail=100 --timestamps"
```

### Redémarrage

```bash
# Redémarrer WordPress
ssh $SSH_HOST "docker restart $WP_CONTAINER"

# Redémarrer tout avec docker-compose
ssh $SSH_HOST "cd $COMPOSE_DIR && docker-compose restart"

# Arrêt + démarrage (reset complet)
ssh $SSH_HOST "cd $COMPOSE_DIR && docker-compose down && docker-compose up -d"
```

### Exécuter des commandes dans le container

```bash
# Shell bash dans WordPress
ssh $SSH_HOST "docker exec -it $WP_CONTAINER bash"

# Commande simple
ssh $SSH_HOST "docker exec $WP_CONTAINER ls /var/www/html/wp-content/themes"

# Commande en root
ssh $SSH_HOST "docker exec -u root $WP_CONTAINER chown -R www-data:www-data /var/www/html"
```

### Copier des fichiers

```bash
# Local → Container
scp fichier.txt $SSH_HOST:/tmp/
ssh $SSH_HOST "docker cp /tmp/fichier.txt $WP_CONTAINER:/var/www/html/"

# Container → Local
ssh $SSH_HOST "docker cp $WP_CONTAINER:/var/www/html/wp-config.php /tmp/"
scp $SSH_HOST:/tmp/wp-config.php ./
```

### Permissions

```bash
# Fixer propriétaire (www-data)
ssh $SSH_HOST "docker exec $WP_CONTAINER chown -R www-data:www-data /var/www/html/wp-content"

# Fixer permissions fichiers (644) et dossiers (755)
ssh $SSH_HOST "docker exec $WP_CONTAINER find /var/www/html/wp-content -type f -exec chmod 644 {} \;"
ssh $SSH_HOST "docker exec $WP_CONTAINER find /var/www/html/wp-content -type d -exec chmod 755 {} \;"

# Uploads spécifiquement
ssh $SSH_HOST "docker exec $WP_CONTAINER chmod -R 775 /var/www/html/wp-content/uploads"
```

### Espace disque

```bash
# Taille des containers
ssh $SSH_HOST "docker system df"

# Détail par container
ssh $SSH_HOST "docker ps -s"

# Nettoyer (attention!)
ssh $SSH_HOST "docker system prune -f"
```

---

## Docker Compose

### Fichier compose
```bash
# Voir la config
ssh $SSH_HOST "cat $COMPOSE_DIR/docker-compose.yml"

# Valider la config
ssh $SSH_HOST "cd $COMPOSE_DIR && docker-compose config"
```

### Opérations compose

```bash
# Status
ssh $SSH_HOST "cd $COMPOSE_DIR && docker-compose ps"

# Démarrer
ssh $SSH_HOST "cd $COMPOSE_DIR && docker-compose up -d"

# Arrêter
ssh $SSH_HOST "cd $COMPOSE_DIR && docker-compose down"

# Reconstruire (après modif Dockerfile)
ssh $SSH_HOST "cd $COMPOSE_DIR && docker-compose build --no-cache"
```

---

## Troubleshooting

### Container qui crash

```bash
# Voir pourquoi il s'est arrêté
ssh $SSH_HOST "docker logs $WP_CONTAINER --tail=200"

# Inspecter
ssh $SSH_HOST "docker inspect $WP_CONTAINER | grep -A 10 State"

# Redémarrer
ssh $SSH_HOST "docker restart $WP_CONTAINER"
```

### Erreur de connexion MySQL

```bash
# Vérifier que MySQL tourne
ssh $SSH_HOST "docker ps | grep mysql"

# Tester la connexion
ssh $SSH_HOST "docker exec $DB_CONTAINER mysql -u wp_user -p -e 'SHOW DATABASES;'"

# Vérifier les variables d'env
ssh $SSH_HOST "docker exec $WP_CONTAINER env | grep WORDPRESS_DB"
```

### Site lent

```bash
# Vérifier les ressources
ssh $SSH_HOST "docker stats --no-stream"

# Logs d'erreur PHP
ssh $SSH_HOST "docker exec $WP_CONTAINER tail -50 /var/log/apache2/error.log" 2>/dev/null || \
ssh $SSH_HOST "docker logs $WP_CONTAINER 2>&1 | grep -i error | tail -50"
```

### Espace disque plein

```bash
# Voir l'espace
ssh $SSH_HOST "df -h /"

# Nettoyer les logs Docker
ssh $SSH_HOST "sudo truncate -s 0 /var/lib/docker/containers/*/*.log"

# Supprimer les images non utilisées
ssh $SSH_HOST "docker image prune -f"
```

---

## Sauvegardes

### Backup manuel rapide

```bash
# Backup database
ssh $SSH_HOST "docker exec $DB_CONTAINER mysqldump -u wp_user -p wordpress > /tmp/db-backup.sql"

# Backup wp-content
ssh $SSH_HOST "docker exec $WP_CONTAINER tar -czf /tmp/wp-content.tar.gz -C /var/www/html wp-content"
```

### Backup complet (script)

```bash
ssh $SSH_HOST "sudo /opt/scripts/backup-wordpress-full.sh"
```

---

## Nginx (reverse proxy)

Le site utilise Nginx comme reverse proxy devant Docker.

```bash
# Vérifier config Nginx
ssh $SSH_HOST "sudo nginx -t"

# Recharger Nginx
ssh $SSH_HOST "sudo systemctl reload nginx"

# Voir la config du site
ssh $SSH_HOST "cat /etc/nginx/sites-enabled/clemence"

# Logs Nginx
ssh $SSH_HOST "sudo tail -50 /var/log/nginx/clemence-error.log"
```

---

## Bonnes pratiques

1. **Toujours backup avant modifications** : `/opt/scripts/backup-wordpress-full.sh`
2. **Vérifier les logs après changement** : `docker logs`
3. **Ne pas modifier dans le container** : modifier en local puis sync
4. **Permissions www-data** : après chaque upload de fichiers
5. **Monitorer l'espace disque** : les logs Docker peuvent grossir
