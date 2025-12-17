# Configuration Calibre

## Chemins

| Variable | Valeur |
|----------|--------|
| `LIBRARY` | `C:\Users\julien\OneDrive\Calibre\Calibre Library` |
| `CALIBREDB` | `C:\Program Files\Calibre2\calibredb.exe` |
| `EBOOK_CONVERT` | `C:\Program Files\Calibre2\ebook-convert.exe` |
| `DB` | `C:\Users\julien\OneDrive\Calibre\Calibre Library\metadata.db` |

## Commandes de base

### Fermer Calibre (obligatoire avant CLI)

```powershell
Stop-Process -Name calibre -Force -ErrorAction SilentlyContinue
```

### Template calibredb

```powershell
& 'C:\Program Files\Calibre2\calibredb.exe' COMMAND --library-path 'C:\Users\julien\OneDrive\Calibre\Calibre Library'
```

### Relancer Calibre

```powershell
Start-Process 'C:\Program Files\Calibre2\calibre.exe'
```

## Liseuse

- **Modèle** : Sony PRS-T1
- **Formats** : EPUB (préféré), PDF, TXT
