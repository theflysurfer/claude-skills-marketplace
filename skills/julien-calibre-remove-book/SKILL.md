---
name: calibre-remove-book
description: "Removes books from Calibre library by ID, author, or language. Use when user wants to delete, remove books or clean the library."
allowed-tools: Bash, Read, Write
---

# Remove Books from Calibre

Removes books by ID or criteria (author, language).

## Quick Reference

See `calibre-common/config.md` for paths. See `calibre-common/queries.md` for SQL.

## Steps

1. **Close Calibre** (required)
2. **Find books to remove** (by ID, search, or SQL)
3. **Remove books**

## Commands

### Remove by ID
```powershell
& 'C:\Program Files\Calibre2\calibredb.exe' remove 123 --permanent --library-path 'C:\Users\julien\OneDrive\Calibre\Calibre Library'
```

### Remove multiple
```powershell
calibredb remove 98,99,100,101 --permanent --library-path "..."
```

### Search then remove
```powershell
# Find IDs first
calibredb search "author:Zola" --library-path "..."
# Then remove
calibredb remove ID1,ID2 --permanent --library-path "..."
```

### Remove format only (keep book)
```powershell
calibredb remove_format 123 PDF --library-path "..."
```

## Find by criteria

### English books
```python
python scripts/analyze/find_english_books.py
```

### Empty books (no format)
```python
python scripts/analyze/find_empty_books.py
```

## Scripts

- `scripts/analyze/find_english_books.py`
- `scripts/analyze/find_empty_books.py`
- `scripts/manage/remove_books.py`

## See also

- `calibre-add-book` - Add books
- `calibre-cleanup` - Bulk cleanup
