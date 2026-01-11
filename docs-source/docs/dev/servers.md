# Serveurs

Gestion des serveurs et applications au démarrage Windows.

## Serveurs Enregistrés

{{ servers_table_with_actions() }}

## Utilitaires

{{ utilities_table() }}

## Commandes CLI

### Lister les serveurs

```bash
python scripts/server-manager.py list
```

### Voir le statut (ports actifs)

```bash
python scripts/server-manager.py status
```

### Démarrer un serveur

```bash
python scripts/server-manager.py start <server-id>
```

### Arrêter un serveur

```bash
python scripts/server-manager.py stop <server-id>
```

## Commande Claude Code

Utilisez `/julien-servers` pour gérer les serveurs directement dans Claude Code.

## Dossier Startup Windows

Les scripts de démarrage sont dans :

```
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
```

Fichiers actuels :

| Fichier | Serveur |
|---------|---------|
| `idle-queue.bat` | Idle Queue (port 8742) |
| `AI Observer.bat` | AI tokens watcher (port 8180) |
| `Cooking Manager.bat` | Backend (3001) + Frontend (5173) |
| `Money Manager.bat` | Next.js (port 3000) |
| `Claude Marketplace Docs.lnk` | MkDocs (port 8000) |

## Ajouter un nouveau serveur

1. Éditer `registry/servers-registry.json`
2. Ajouter l'entrée dans `servers` ou `utilities`
3. Créer le fichier `.bat` dans le dossier Startup

Exemple d'entrée :

```json
"mon-serveur": {
  "name": "Mon Serveur",
  "description": "Description du serveur",
  "port": 3000,
  "start_command": "npm run dev",
  "cwd": "C:\\path\\to\\project",
  "startup": true,
  "startup_file": "Mon Serveur.bat",
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
