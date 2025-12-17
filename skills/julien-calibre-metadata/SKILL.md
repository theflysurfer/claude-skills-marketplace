---
name: calibre-metadata
description: "Manages book metadata: title, author, cover, tags, language. Use when user wants to edit, fix, or extract book information."
allowed-tools: Bash, Read, Write
---

# Manage Metadata

Edit and extract book metadata.

## Quick Reference

See `calibre-common/config.md` for paths.

## Metadata Fields

`title`, `authors`, `publisher`, `pubdate`, `languages`, `tags`, `series`, `series_index`, `comments`, `cover`

## Commands

### View metadata
```powershell
calibredb show_metadata BOOK_ID --library-path "..."
```

### Set metadata
```powershell
calibredb set_metadata BOOK_ID -f 'title:New Title' --library-path "..."
calibredb set_metadata BOOK_ID -f 'authors:Author Name' --library-path "..."
calibredb set_metadata BOOK_ID -f 'languages:fra' --library-path "..."
calibredb set_metadata BOOK_ID -f 'tags:Fiction, Classic' --library-path "..."
```

### Set cover
```powershell
calibredb set_metadata BOOK_ID -c 'cover.jpg' --library-path "..."
```

### Extract from file
```powershell
& 'C:\Program Files\Calibre2\ebook-meta.exe' 'book.epub'
```

## Scripts

- `scripts/analyze/extract_metadata.py` - Batch extraction

## See also

- `calibre-analyze` - Find books with missing metadata
