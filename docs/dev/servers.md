# Serveurs

Gestion des serveurs et applications au démarrage Windows.

## Serveurs Enregistrés

{{ servers_table() }}

## Utilitaires

{{ utilities_table() }}

## Commandes

### Lister les serveurs

```bash
python scripts/server-manager.py list
```

### Voir le statut

```bash
python scripts/server-manager.py status
```

### Démarrer un serveur

```bash
python scripts/server-manager.py start idle-queue
python scripts/server-manager.py start mkdocs
python scripts/server-manager.py start money-manager
```

### Arrêter un serveur

```bash
python scripts/server-manager.py stop idle-queue
python scripts/server-manager.py stop mkdocs
```

## Dossier Startup Windows

Les raccourcis de démarrage sont dans :

```
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
```

## Ajouter un nouveau serveur

1. Éditer `configs/servers-registry.json`
2. Ajouter l'entrée dans `servers` ou `utilities`
3. Créer le raccourci dans le dossier Startup si nécessaire

Exemple d'entrée :

```json
"mon-serveur": {
  "name": "Mon Serveur",
  "description": "Description du serveur",
  "port": 3000,
  "start_command": "npm run dev",
  "cwd": "C:\\path\\to\\project",
  "startup": true,
  "startup_file": "Mon Serveur.lnk",
  "category": "project"
}
```

## Catégories

| Catégorie | Description |
|-----------|-------------|
| `core` | Services essentiels Claude |
| `docs` | Serveurs de documentation |
| `app` | Applications personnelles |
| `project` | Serveurs de développement |

## Voir aussi

- [Hooks](hooks.md) - Automatisation lifecycle
- [Architecture](architecture.md) - Vue globale
