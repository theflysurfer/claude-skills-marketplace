---
name: calibre-convert
description: "Converts PDF to EPUB for e-readers. Analyzes PDF type and applies best conversion strategy. Use when user wants to convert PDF, create EPUB, or prepare books for e-reader."
allowed-tools: Bash, Read, Write
---

# Convert PDF to EPUB

Converts PDF files to EPUB format for e-readers.

## Quick Reference

See `calibre-common/config.md` for paths.

## Steps

1. **Close Calibre** (required)
2. **Find books without EPUB**
3. **Convert PDF → EPUB**
4. **Add EPUB to existing book**

## Commands

### Find books without EPUB
```powershell
calibredb list --search 'formats:PDF NOT formats:EPUB' --fields id,title,formats --library-path "..."
```

Or: `python scripts/analyze/find_books_without_epub.py`

### Convert
```powershell
& 'C:\Program Files\Calibre2\ebook-convert.exe' 'input.pdf' 'output.epub'
```

### With heuristics (better quality)
```powershell
ebook-convert 'input.pdf' 'output.epub' --enable-heuristics
```

### Add EPUB to existing book
```powershell
calibredb add_format BOOK_ID 'output.epub' --library-path "..."
```

## PDF Types

| Type | Quality | Notes |
|------|---------|-------|
| Text PDF | Good | Direct conversion |
| Scanned/Image | Poor | Needs OCR |
| Mixed | Variable | Use heuristics |

## Useful options

- `--enable-heuristics` - Better structure detection
- `--base-font-size 12` - Font size
- `--margin-top 10` - Margins

## Scripts

- `scripts/convert/batch_convert.py` - Batch conversion
- `scripts/convert/analyze_pdf_type.py` - Analyze PDF

## See also

- `calibre-analyze` - Find books without EPUB
