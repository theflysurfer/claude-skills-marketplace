---
name: calibre-cleanup
description: "Cleans and organizes Calibre library: removes duplicates, empty books, redundant formats. Use for library maintenance and organization."
allowed-tools: Bash, Read, Write
---

# Cleanup Library

Removes unwanted books and formats.

## Quick Reference

See `calibre-common/config.md` for paths.

## Cleanup Tasks

| Task | Script | Action |
|------|--------|--------|
| Empty books | `find_empty_books.py` | Remove books with no format |
| PDF when EPUB exists | `remove_books.py` | Remove redundant PDFs |
| English books | `find_english_books.py` | Remove if unwanted |
| Set EPUB as primary | `set_primary_format.py` | Prefer EPUB |

## Workflow

```bash
# 1. Close Calibre + OneDrive
Stop-Process -Name calibre,OneDrive -Force -ErrorAction SilentlyContinue

# 2. Identify
python scripts/analyze/find_empty_books.py
python scripts/analyze/find_books_without_epub.py

# 3. Clean books from database
calibredb remove ID1,ID2 --permanent --library-path "..."

# 4. Clean orphaned folders (if any)
python scripts/force_delete_orphans.py

# 5. Reopen Calibre
```

## Remove Orphaned Folders

After removing books, orphaned folders may remain on disk. Use the force delete script:

```bash
# Detect and remove all orphaned folders (uses Windows 'rd' command)
python scripts/force_delete_orphans.py

# The script tries multiple deletion methods:
# 1. Python shutil.rmtree
# 2. Windows takeown + icacls
# 3. Windows rd /s /q (most reliable, bypasses OneDrive locks)
# 4. PowerShell Remove-Item
```

**Note**: The script uses `subprocess` with Windows `rd` command to bypass OneDrive file locks.

## Remove PDF when EPUB exists

```powershell
# Find books with both formats
calibredb list --search 'formats:PDF AND formats:EPUB' --fields id,title --library-path "..."

# Remove PDF format
calibredb remove_format BOOK_ID PDF --library-path "..."
```

## Scripts

- `scripts/manage/remove_books.py`
- `scripts/manage/set_primary_format.py`

## See also

- `calibre-analyze` - Find issues first
- `calibre-remove-book` - Remove individual books
