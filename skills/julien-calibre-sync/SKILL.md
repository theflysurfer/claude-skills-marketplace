---
name: calibre-sync
description: "Syncs books with e-reader (Sony PRS-T1). Checks compatible formats and device connection. Use when user wants to transfer books to e-reader."
allowed-tools: Bash, Read
---

# Sync with E-Reader

Transfers books to Sony PRS-T1 e-reader.

## Device

- **Model**: Sony PRS-T1
- **Formats**: EPUB (preferred), PDF, TXT

## Check Connection

### Via Calibre (recommended)
Open Calibre - device appears in sidebar when connected.

### Via PowerShell
```powershell
Get-PnpDevice | Where-Object { $_.FriendlyName -like "*Sony*" -or $_.FriendlyName -like "*Reader*" }
```

## Transfer Books

**Use Calibre GUI** (no CLI support for device sync):
1. Connect e-reader
2. Select books in Calibre
3. Right-click → "Send to device"

## Prepare Books

### Find books without EPUB
```powershell
calibredb list --search 'NOT formats:EPUB' --fields id,title,formats --library-path "..."
```

### Convert if needed
See `calibre-convert` skill.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Device not detected | Unplug, wait 5s, replug |
| "No suitable format" | Convert to EPUB first |
| Transfer fails | Check device storage space |

## See also

- `calibre-convert` - Convert to EPUB
- `calibre-analyze` - Find books without EPUB
