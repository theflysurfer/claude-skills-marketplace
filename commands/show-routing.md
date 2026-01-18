Affiche le dernier routing de skill effectue par le routeur.

## Execution

Lis le fichier de log du routing et affiche les resultats de facon lisible.

```bash
cat ~/.claude/cache/last-routing.json 2>/dev/null || echo '{"error": "No routing log found. Submit a prompt first."}'
```

## Format de sortie

Presente les informations de facon claire :

| Champ | Description |
|-------|-------------|
| timestamp | Quand le routing a ete effectue |
| prompt | Les 200 premiers caracteres du prompt |
| matches | Skills suggerees avec leur score (%) |
| elapsed_ms | Temps d'execution du routing |

## Exemple

Si le fichier contient :
```json
{
  "timestamp": "2024-01-06T10:30:00.000Z",
  "prompt": "create an excel file",
  "matches": [
    {"name": "anthropic-office-xlsx", "score": 95, "source": "global"}
  ],
  "elapsed_ms": 3
}
```

Affiche :
```
Dernier routing (2024-01-06 10:30:00)
Prompt: "create an excel file"
Temps: 3ms

Suggestions:
  1. anthropic-office-xlsx (95%) [global]
```
