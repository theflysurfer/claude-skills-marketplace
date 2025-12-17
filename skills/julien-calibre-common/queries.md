# Requêtes SQL Calibre

Base : `C:\Users\julien\OneDrive\Calibre\Calibre Library\metadata.db`

## Livres

### Tous les livres
```sql
SELECT id, title, author_sort FROM books ORDER BY author_sort, title
```

### Livres vides (sans format)
```sql
SELECT b.id, b.title, b.author_sort
FROM books b LEFT JOIN data d ON b.id = d.book
WHERE d.id IS NULL
```

### Livres sans EPUB
```sql
SELECT b.id, b.title, author_sort, GROUP_CONCAT(d.format) as formats
FROM books b JOIN data d ON b.id = d.book
WHERE b.id NOT IN (SELECT book FROM data WHERE format = 'EPUB')
GROUP BY b.id
```

### Livres par langue
```sql
SELECT b.id, b.title, l.lang_code
FROM books b
JOIN books_languages_link bll ON b.id = bll.book
JOIN languages l ON bll.lang_code = l.id
WHERE l.lang_code = 'eng'  -- ou 'fra'
```

## Statistiques

### Formats
```sql
SELECT format, COUNT(*) as count FROM data GROUP BY format ORDER BY count DESC
```

### Doublons (même titre)
```sql
SELECT title, COUNT(*) as n FROM books GROUP BY title HAVING n > 1
```
