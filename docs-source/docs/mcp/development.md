# Développement MCP

Guide pour développer et tester des serveurs MCP (Model Context Protocol).

## Outils de développement

| Outil | Usage | Hot reload |
|-------|-------|------------|
| `fastmcp dev` | Lance MCP Inspector (debug web) | Non - outil de test isolé |
| `mcp-hmr` | Hot Module Replacement réel | Oui - recharge les modules modifiés |

### Complémentarité

- **fastmcp dev** : Pour développer et tester en isolation, avec un inspecteur web
- **mcp-hmr** : Pour le hot reload en production avec Claude Code

## FastMCP vs SDK officiel

### SDK officiel (mcp)

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server

server = Server("mon-mcp")

@server.list_tools()
async def list_tools():
    return [Tool(name="mon_outil", ...)]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    # Logique complexe avec TextContent
    pass
```

### FastMCP (recommandé)

```python
from fastmcp import FastMCP
from typing import Annotated

mcp = FastMCP("mon-mcp")

@mcp.tool()
def mon_outil(
    param: Annotated[str, "Description du paramètre"]
) -> dict:
    """Description de l'outil."""
    return {"result": "valeur"}
```

**Avantages FastMCP :**

- Code plus concis (50% moins de lignes)
- Typage avec `Annotated` pour la documentation
- Retour direct de dict/str (pas de TextContent)
- Compatible avec `mcp-hmr` pour le hot reload

## Workflow de développement

### 1. Créer le serveur FastMCP

```python
# mon_mcp/server.py
from fastmcp import FastMCP

mcp = FastMCP("mon-serveur")

@mcp.tool()
def hello(name: str) -> str:
    """Salue l'utilisateur."""
    return f"Bonjour {name}!"
```

### 2. Tester avec FastMCP Inspector

```bash
# Lance un inspecteur web sur http://localhost:5173
fastmcp dev mon_mcp.server:mcp
```

### 3. Configurer avec mcp-hmr pour Claude Code

Dans `~/.claude.json` :

```json
{
  "mcpServers": {
    "mon-serveur": {
      "command": "python",
      "args": ["-m", "mcp_hmr", "mon_mcp.server:mcp"],
      "cwd": "/chemin/vers/projet"
    }
  }
}
```

### 4. Développer avec hot reload

1. Lancez Claude Code
2. Modifiez `server.py`
3. Les changements sont rechargés automatiquement
4. Pas besoin de `/mcp reset`

## Installation

```bash
# FastMCP (framework)
pip install fastmcp

# mcp-hmr (hot reload)
pip install mcp-hmr

# SDK officiel (si nécessaire)
pip install mcp
```

## Ressources

- [FastMCP GitHub](https://github.com/jlowin/fastmcp)
- [mcp-hmr PyPI](https://pypi.org/project/mcp-hmr/)
- [MCP Specification](https://modelcontextprotocol.io/)

## Migration SDK → FastMCP

Pour convertir un serveur existant :

1. Remplacer `Server` par `FastMCP`
2. Convertir `@server.list_tools()` + `@server.call_tool()` en `@mcp.tool()`
3. Utiliser `Annotated[type, "description"]` pour les paramètres
4. Retourner directement dict/str au lieu de `TextContent`
5. Supprimer le code `async` si non nécessaire (FastMCP gère)

```python
# Avant (SDK)
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "hello":
        return [TextContent(type="text", text=f"Bonjour {arguments['name']}")]

# Après (FastMCP)
@mcp.tool()
def hello(name: str) -> str:
    return f"Bonjour {name}"
```
