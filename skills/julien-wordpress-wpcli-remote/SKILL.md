---
name: wp-wpcli-remote
description: This skill provides WP-CLI commands for remote WordPress management on VPS. Use when modifying content, pages, menus, options, or running maintenance tasks directly on production.
allowed-tools: Bash, Read
---

# WP-CLI Remote Commands

## Objectif
Exécuter des commandes WP-CLI sur le VPS de production via Docker.

---

## Configuration

```bash
SSH_HOST="srv759970"
CONTAINER="wordpress-clemence"
WP="docker exec $CONTAINER wp --allow-root"
```

## Pattern d'exécution

```bash
ssh $SSH_HOST "docker exec $CONTAINER wp <command> --allow-root"
```

---

## Commandes fréquentes

### Pages et Posts

```bash
# Lister les pages
ssh $SSH_HOST "$WP post list --post_type=page --fields=ID,post_title,post_status"

# Créer une page
ssh $SSH_HOST "$WP post create --post_type=page --post_title='Nouvelle Page' --post_status=publish"

# Mettre à jour le contenu (via STDIN)
ssh $SSH_HOST "docker exec -i $CONTAINER wp post update <ID> --post_content=\"\$(cat)\" --allow-root" << 'EOF'
<!-- wp:paragraph -->
<p>Nouveau contenu</p>
<!-- /wp:paragraph -->
EOF

# Supprimer une page
ssh $SSH_HOST "$WP post delete <ID> --force"

# Changer le statut
ssh $SSH_HOST "$WP post update <ID> --post_status=draft"
```

### Menus

```bash
# Lister les menus
ssh $SSH_HOST "$WP menu list"

# Voir les items d'un menu
ssh $SSH_HOST "$WP menu item list primary"

# Ajouter une page au menu
ssh $SSH_HOST "$WP menu item add-post primary <page_id>"

# Ajouter un lien custom
ssh $SSH_HOST "$WP menu item add-custom primary 'Contact' 'https://clemencefouquet.fr/contact'"

# Supprimer un item
ssh $SSH_HOST "$WP menu item delete <item_id>"
```

### Médias

```bash
# Lister les médias
ssh $SSH_HOST "$WP media list --fields=ID,post_title,file"

# Importer une image
ssh $SSH_HOST "$WP media import /path/to/image.jpg --title='Mon Image'"

# Régénérer les thumbnails
ssh $SSH_HOST "$WP media regenerate --yes"
```

### Options WordPress

```bash
# Lire une option
ssh $SSH_HOST "$WP option get siteurl"
ssh $SSH_HOST "$WP option get blogname"

# Modifier une option
ssh $SSH_HOST "$WP option update blogdescription 'Nouvelle description'"

# Page d'accueil
ssh $SSH_HOST "$WP option update show_on_front page"
ssh $SSH_HOST "$WP option update page_on_front <page_id>"
```

### Utilisateurs

```bash
# Lister les utilisateurs
ssh $SSH_HOST "$WP user list"

# Créer un utilisateur
ssh $SSH_HOST "$WP user create nouveau nouveau@email.com --role=editor"

# Réinitialiser mot de passe
ssh $SSH_HOST "$WP user update <user_id> --user_pass='newpassword'"
```

### Thèmes

```bash
# Lister les thèmes
ssh $SSH_HOST "$WP theme list"

# Thème actif
ssh $SSH_HOST "$WP theme list --status=active --field=name"

# Activer un thème
ssh $SSH_HOST "$WP theme activate twentytwentyfour"
```

### Plugins

```bash
# Lister les plugins
ssh $SSH_HOST "$WP plugin list"

# Activer/désactiver
ssh $SSH_HOST "$WP plugin activate akismet"
ssh $SSH_HOST "$WP plugin deactivate akismet"

# Mettre à jour
ssh $SSH_HOST "$WP plugin update --all"
```

### Maintenance

```bash
# Vider le cache
ssh $SSH_HOST "$WP cache flush"

# Vérifier la base de données
ssh $SSH_HOST "$WP db check"

# Optimiser la base de données
ssh $SSH_HOST "$WP db optimize"

# Infos WordPress
ssh $SSH_HOST "$WP --info"
ssh $SSH_HOST "$WP core version"
```

### Search-Replace

```bash
# Dry-run d'abord
ssh $SSH_HOST "$WP search-replace 'ancien-domaine.com' 'clemencefouquet.fr' --dry-run"

# Exécuter
ssh $SSH_HOST "$WP search-replace 'ancien-domaine.com' 'clemencefouquet.fr'"
```

### Export/Import

```bash
# Export XML
ssh $SSH_HOST "$WP export --post_type=page" > pages.xml

# Export base de données
ssh $SSH_HOST "$WP db export -" > backup.sql

# Import
ssh $SSH_HOST "$WP import file.xml --authors=create"
```

---

## Pattern STDIN pour contenus longs

Évite les problèmes de quotes :

```bash
ssh $SSH_HOST "docker exec -i $CONTAINER wp post update <ID> --post_content=\"\$(cat)\" --allow-root" << 'EOF'
<!-- wp:group -->
<div class="wp-block-group">
  <!-- wp:heading -->
  <h2>Titre avec "quotes"</h2>
  <!-- /wp:heading -->
</div>
<!-- /wp:group -->
EOF
```

---

## Bonnes pratiques

1. **Toujours `--allow-root`** dans Docker
2. **Vérifier avant modifier** : lister puis update
3. **Backup avant grosses modifs** : `sudo /opt/scripts/backup-wordpress-full.sh`
4. **STDIN pour contenus** : évite les problèmes d'échappement
5. **Tester en dry-run** : search-replace, delete, etc.

---

## Troubleshooting

### Commande timeout
```bash
# Augmenter timeout
ssh $SSH_HOST "docker exec -e WP_CLI_TIMEOUT=300 $CONTAINER wp ..."
```

### Permission denied
```bash
# Vérifier que www-data a les droits
ssh $SSH_HOST "docker exec $CONTAINER chown -R www-data:www-data /var/www/html/wp-content"
```

### Plugin non trouvé
```bash
# S'assurer que le path est correct
ssh $SSH_HOST "docker exec $CONTAINER ls /var/www/html/wp-content/plugins/"
```
