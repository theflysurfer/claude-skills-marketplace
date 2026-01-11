# Installation des MCP Servers

Guide pour installer et configurer les serveurs MCP.

## Prérequis

- Node.js 18+
- npm ou pnpm
- Claude Code installé

## Installation rapide

```bash
# Installer un serveur MCP
npx -y @anthropic/mcp-server-nom

# Exemple : serveur filesystem
npx -y @anthropic/mcp-server-filesystem
```

## Configuration manuelle

!!! warning "Emplacement correct"
    Les serveurs MCP vont dans **`.mcp.json`**, PAS dans `settings.json` !

1. Créer ou éditer `~/.claude/.mcp.json`
2. Ajouter la configuration du serveur :

```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-server-filesystem", "/chemin/autorisé"]
  }
}
```

3. Redémarrer Claude Code ou exécuter `/mcp` pour vérifier

## Serveurs recommandés

### Office (manipulation documents)

```json
{
  "office": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-office"]
  }
}
```

### Puppeteer (automatisation web)

```json
{
  "puppeteer": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-server-puppeteer"]
  }
}
```

### GitHub

```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-server-github"],
    "env": {
      "GITHUB_TOKEN": "ghp_xxx"
    }
  }
}
```

### Serveur Python (exemple: idle-queue)

```json
{
  "idle-queue": {
    "command": "python",
    "args": ["-m", "idle_queue.mcp_server"]
  }
}
```

## Dépannage

### Le serveur ne démarre pas

1. Vérifier que Node.js est installé : `node --version`
2. Vérifier les logs : `~/.claude/logs/mcp-*.log`
3. Tester manuellement : `npx -y @anthropic/mcp-server-nom`

### Permissions insuffisantes

Pour le serveur filesystem, spécifier les chemins autorisés :

```json
{
  "args": ["-y", "@anthropic/mcp-server-filesystem", "/chemin1", "/chemin2"]
}
```

### Conflits de ports

Certains serveurs utilisent des ports spécifiques. Vérifier qu'ils ne sont pas déjà utilisés.

## Voir aussi

- [Liste des serveurs](index.md)
- [Documentation MCP](https://modelcontextprotocol.io/)
