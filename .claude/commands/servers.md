Affiche le statut des serveurs et permet de les démarrer/arrêter.

## Exécution

```bash
# Lister tous les serveurs avec statut
python "$MARKETPLACE_ROOT/scripts/server-manager.py" list

# Afficher uniquement les serveurs actifs
python "$MARKETPLACE_ROOT/scripts/server-manager.py" status
```

## Actions disponibles

```bash
# Démarrer un serveur
python "$MARKETPLACE_ROOT/scripts/server-manager.py" start <server_id>

# Arrêter un serveur
python "$MARKETPLACE_ROOT/scripts/server-manager.py" stop <server_id>
```

## Serveurs disponibles

- `idle-queue` - Service tâches arrière-plan (port 8742)
- `mkdocs` - Documentation locale (port 8000)
- `cooking-manager` - App courses Auchan
- `jokers` - Site Jokers Hockey (port 5000)
- `money-manager` - App finances (port 3000)
