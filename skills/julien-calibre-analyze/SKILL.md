---
name: calibre-analyze
description: "Analyzes Calibre library: finds duplicates, empty books, missing formats, metadata issues. Use for auditing, diagnosing, or reporting on library state."
allowed-tools: Bash, Read
---

# Analyze Calibre Library

Audits and reports on library state.

## Quick Reference

See `calibre-common/queries.md` for SQL queries.

## Available Analyses

| Analysis | Script | Command |
|----------|--------|---------|
| Empty books | `find_empty_books.py` | Books with no format |
| Without EPUB | `find_books_without_epub.py` | PDF-only books |
| English books | `find_english_books.py` | Filter by language |
| Library stats | `analyze_library.py` | Format counts |

## Run Scripts

```bash
python scripts/analyze/find_empty_books.py
python scripts/analyze/find_books_without_epub.py
python scripts/analyze/find_english_books.py
python scripts/analyze/analyze_library.py
```

## calibredb queries

```powershell
# List all
calibredb list --library-path "..."

# Search by language
calibredb list --search 'language:eng' --library-path "..."

# Book metadata
calibredb show_metadata BOOK_ID --library-path "..."
```

## SQL (direct access)

See `calibre-common/queries.md` for:
- Books without EPUB
- Duplicates by title
- Books by language
- Format statistics

## See also

- `calibre-cleanup` - Act on analysis results
- `calibre-convert` - Convert missing EPUBs
