---
name: calibre-add-book
description: "Adds ebooks to Calibre library from local files or internet (Project Gutenberg). Use when user wants to add, download, import books."
allowed-tools: Bash, Read, Write, WebSearch, WebFetch
---

# Add Books to Calibre

Adds EPUB/PDF/MOBI to the library. Can download from Project Gutenberg.

## Quick Reference

See `calibre-common/config.md` for paths and base commands.

## Steps

1. **Close Calibre** (required before CLI)
2. **Add book(s)**
3. **Reopen Calibre** (optional)

## Commands

### Add local file
```powershell
& 'C:\Program Files\Calibre2\calibredb.exe' add 'PATH\TO\BOOK.epub' --library-path 'C:\Users\julien\OneDrive\Calibre\Calibre Library'
```

### Add with metadata
```powershell
calibredb add "book.epub" --title "Title" --authors "Author" --library-path "..."
```

### Add folder recursively
```powershell
calibredb add "C:\Folder" --recurse --library-path "..."
```

## Download from Gutenberg

1. Search: `WebSearch: "TITLE AUTHOR site:gutenberg.org/ebooks"`
2. Extract ID from URL (`/ebooks/24850` → 24850)
3. Download: `curl -L "https://www.gutenberg.org/ebooks/24850.epub3.images" -o "book.epub"`
4. Add to Calibre

## Scripts

- `scripts/utils/calibredb_cli.py` - Python wrapper

## See also

- `calibre-remove-book` - Remove books
- `calibre-convert` - Convert PDF to EPUB
