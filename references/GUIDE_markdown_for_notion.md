# Guide de Structuration Markdown pour LLMs
## Universal Notion Uploader - Parser Intelligent

---

## 🎯 Objectif de ce Document

Ce guide explique comment structurer votre markdown pour une compatibilité optimale avec le **Universal Notion Uploader**, un parser intelligent Python qui convertit markdown en blocs Notion.

**Public cible :** Large Language Models générant du markdown destiné à être uploadé dans Notion via ce système.

---

## 📐 Architecture du Parser

Le système utilise un **MarkdownParser centralisé** avec des sous-parsers spécialisés :

```python
MarkdownParser
├── AdmonitionParser    # Callouts multi-standards
├── RichTextParser      # Formatage inline (bold, italic, code, etc.)
├── TableParser         # Tables markdown → Notion
└── ImageParser         # Images locales et externes
```

### Fichiers Sources
- **Parser principal :** `src/parsers/markdown_parser.py`
- **Callouts :** `src/parsers/admonition_parser.py`
- **Rich text :** `src/parsers/rich_text_parser.py`
- **Tables :** `src/parsers/table_parser.py`
- **Images :** `src/parsers/image_parser.py`

---

## ✅ Éléments Markdown Supportés

### 1. **Headings (Titres)**

```markdown
# Heading 1
## Heading 2
### Heading 3
```

**Notion API :** `heading_1`, `heading_2`, `heading_3`

**Limitations :**
- Maximum 3 niveaux (H1-H3)
- H4+ non supportés par Notion

**Recommandation LLM :**
- Utiliser H1 pour sections principales
- H2 pour sous-sections
- H3 pour détails
- NE PAS utiliser H4-H6

---

### 2. **Paragraphs (Paragraphes avec Rich Text)**

```markdown
Ceci est un paragraphe normal avec **bold**, *italic*, `code inline`, ~~strikethrough~~, et [liens](https://example.com).
```

**Rich Text Supporté :**
- **Bold :** `**text**` ou `__text__`
- *Italic :* `*text*` ou `_text_`
- `Code inline :` `` `code` ``
- ~~Strikethrough :~~ `~~text~~`
- [Liens](url) : `[text](url)`

**Parser Utilisé :** `RichTextParser.parse()`

**Notion API :** Converti en `paragraph` block avec `rich_text` annotations

**Recommandation LLM :**
- Combiner librement formatages dans paragraphes
- Le parser gère overlaps automatiquement (ex: `**bold *and italic***`)
- Liens markdown standards fonctionnent

---

### 3. **Callouts (Admonitions Multi-Standards)**

Le parser supporte **4 syntaxes différentes** de callouts :

#### **GitHub Flavored Markdown (GFM)**
```markdown
> [!NOTE]
> Ceci est une note importante.
> Peut contenir plusieurs lignes.
```

**Types supportés :** `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`

#### **Python-Markdown**
```markdown
!!! note "Titre optionnel"
    Contenu indenté.
    Peut contenir plusieurs lignes.
```

#### **MyST Markdown**
```markdown
:::note Titre optionnel
Contenu sans indentation.
Plus de contenu.
:::
```

#### **Docusaurus**
```markdown
:::tip
Contenu directement.
:::
```

**Mapping Notion :**
| Type | Emoji | Couleur Background |
|------|-------|-------------------|
| NOTE | 📝 | blue_background |
| TIP | 💡 | yellow_background |
| IMPORTANT | ❗ | purple_background |
| WARNING | ⚠️ | orange_background |
| CAUTION | 🚨 | red_background |
| DANGER | 🔥 | red_background |
| INFO | ℹ️ | blue_background |
| EXAMPLE | 📖 | gray_background |

**Parser Utilisé :** `AdmonitionParser.parse()`

**Notion API :** Converti en `callout` block avec emoji + color

**Recommandation LLM :**
- **Préférer GitHub GFM** pour simplicité (`> [!NOTE]`)
- Rich text supporté dans contenu callout (bold, italic, etc.)
- Le parser détecte automatiquement le format utilisé

**⚠️ ATTENTION :** Ne pas mélanger syntaxes dans un même callout

---

### 4. **Lists (Listes)**

#### **Listes non ordonnées**
```markdown
- Item 1
- Item 2
  - Nested item (indentation)
- Item 3
```

**Variantes supportées :** `-`, `*`, `+`

#### **Listes ordonnées**
```markdown
1. Premier item
2. Deuxième item
   1. Nested item
3. Troisième item
```

#### **Task Lists (To-Do)** ✨ NOUVEAU
```markdown
- [ ] Task non complétée
- [x] Task complétée
- [X] Task complétée (majuscule aussi supportée)
```

**Notion API :**
- Listes: `bulleted_list_item`, `numbered_list_item`
- Tasks: `to_do` block avec `checked: true/false`

**Rich Text dans Items :**
```markdown
- **Bold item** avec *italic*
- [ ] Task avec `code inline`
- Item avec [lien](url)
```

**Recommandation LLM :**
- Rich text complètement supporté dans list items et tasks
- Task lists parsées AVANT unordered lists (priorité pattern)
- `- [ ]` → to_do unchecked, `- [x]` → to_do checked
- Indentation détectée (4 espaces ou 1 tab)
- Numérotation automatique gérée par Notion

---

### 5. **Code Blocks**

```markdown
```python
def hello():
    print("Hello world")
```
```

**Languages supportés :** Tous languages standards (python, javascript, java, etc.)

**Notion API :** `code` block avec `language` attribute

**Recommandation LLM :**
- Toujours spécifier language après ` ``` `
- Si language inconnu, utiliser `plain text`
- Pas de rich text dans code blocks (texte brut uniquement)

---

### 6. **Tables**

```markdown
| Name | **Status** | Count |
| ---- | ---------- | ----- |
| foo  | *active*   | 42    |
| bar  | inactive   | 0     |
```

**Parser Utilisé :** `TableParser.parse()`

**Rich Text dans Cellules :**
- ✅ Bold, italic, code inline supportés
- ✅ Liens supportés

**Notion API :** `table` block avec `table_row` children

**⚠️ NOTES Performance :**
- **Pas de limite stricte de colonnes** (ancienne limite 5 colonnes supprimée)
- Warning automatique si table > 10 colonnes (lisibilité dans Notion)
- L'API Notion supporte de nombreuses colonnes, mais privilégier tables compactes pour meilleure lisibilité

**Structure Requise :**
1. Header row (`| col1 | col2 |`)
2. Separator row (`| ---- | ---- |`)
3. Data rows

**Recommandation LLM :**
- Aligner colonnes visuellement (optionnel mais lisible)
- **Privilégier ≤ 10 colonnes** pour meilleure lisibilité (warning au-delà)
- Pas de limite technique stricte, mais tables très larges difficiles à lire dans Notion
- Rich text fonctionne dans cellules (ex: `**bold**`)

---

### 7. **Blockquotes (Citations)**

```markdown
> Ceci est une citation normale.
> Peut contenir plusieurs lignes.
```

**Notion API :** `quote` block

**Rich Text Supporté :**
```markdown
> Citation avec **bold** et *italic*.
```

**⚠️ DISTINCTION avec Callouts GitHub :**
```markdown
> Simple blockquote       → Notion quote block
> [!NOTE] Callout         → Notion callout block
```

Le parser détecte automatiquement via regex : `^>\s+(?!\[!)(.+)$`

**Recommandation LLM :**
- Utiliser `>` pour citations standards
- Utiliser `> [!TYPE]` pour callouts enrichis

---

### 8. **Images**

#### **Images Externes (URLs)**
```markdown
![Alt text](https://example.com/image.png)
```

**Notion API :** `image` block avec `external` type

#### **Images Locales**
```markdown
![Alt text](./images/photo.jpg)
![Alt text](images/diagram.png)
```

**Parser Utilisé :** `ImageParser.extract_images()`

**Résolution Chemins :**
- Chemins relatifs résolus depuis `base_dir` config
- Chemins absolus supportés
- Upload local → Notion `file_upload` type

**Recommandation LLM :**
- Préférer URLs externes quand possible
- Images locales nécessitent upload (lent)
- Alt text recommandé pour accessibilité

**⚠️ LIMITATION :** Alt text non affiché dans Notion (API limitation)

---

## 🚫 Éléments NON Supportés

### ❌ Markdown Avancé
- [ ] Footnotes (ex: `[^1]`) - Pas de block type footnote dans Notion API
- [ ] Definition lists - Pas de block type definition dans Notion API
- [ ] HTML inline - Non supporté par Notion API
- [ ] Emoji shortcodes (ex: `:smile:`) - Non implémenté actuellement

### ❌ Headings H4-H6
Notion limite à 3 niveaux uniquement.

**Workaround :** Utiliser **bold paragraph** pour H4+
```markdown
**Pseudo-Heading 4**
Contenu de la section...
```

### ❌ Nested Blockquotes
```markdown
> Level 1
>> Level 2  ❌ Non supporté
```

### ❌ Indented Code Blocks
```markdown
    code indenté  ❌ Non supporté
```

**Utiliser fenced code blocks** à la place :
```markdown
```
code indenté
```
```

---

## 📊 Ordre de Parsing (Priorité Patterns)

Le parser traite les éléments dans cet ordre :

1. **Tables** (multi-ligne, détection haute priorité)
2. **Code blocks** (multi-ligne, ` ``` `)
3. **Callouts** (multi-ligne, 4 syntaxes)
4. **Images** (pattern ligne unique)
5. **Headings** (H1-H3)
6. **Task lists** (- [ ] / - [x]) ✨ AVANT unordered lists
7. **Unordered lists** (-, *, +)
8. **Ordered lists** (1., 2., 3.)
9. **Blockquotes** (> text)
10. **Paragraphs** (fallback)

**Implication :** Si ambiguïté, priorité donnée aux patterns plus hauts.

**Exemple :**
```markdown
> Text avec |pipe|
```
→ Traité comme blockquote (pas table, car pas de structure complète)

---

## 🎨 Bonnes Pratiques pour LLMs

### 1. **Structurer Hiérarchiquement**
```markdown
# Section Principale (H1)

Paragraphe introductif.

## Sous-section (H2)

Détails de la sous-section.

### Détails (H3)

Informations précises.
```

### 2. **Utiliser Callouts pour Infos Clés**
```markdown
> [!TIP]
> Utilisez des callouts pour **mettre en avant** des informations importantes.
```

### 3. **Rich Text dans Contexte**
```markdown
Le parser supporte **formatage complexe** incluant *italic*, `code`, et même ~~strikethrough~~ simultanément.
```

### 4. **Tables Compactes**
```markdown
| Colonne 1 | Colonne 2 | Colonne 3 |
| --------- | --------- | --------- |
| **Bold**  | *Italic*  | `code`    |
```

**⚠️ Rappel :** Max 5 colonnes.

### 5. **Code Blocks Annotés**
```markdown
```python
# Toujours spécifier language
def example():
    pass
```
```

### 6. **Images avec Alt Text**
```markdown
![Diagramme architecture système](./diagrams/architecture.png)
```

---

## 🔧 Configuration & Modes d'Upload

### **Modes d'Upload Disponibles**

#### **1. Sequential Mode**
- Pages créées côte à côte (flat structure)
- Style : SharePoint
- Config : `UPLOAD_MODE=sequential`

#### **2. Hierarchical Mode**
- Structure arborescente (folders → pages)
- Style : Ragic
- Config : `UPLOAD_MODE=hierarchical`

#### **3. Mixed Mode**
- Folders → Headings inline
- Files → Child pages
- Config : `UPLOAD_MODE=mixed`

### **Configuration Features**
```python
features = {
    "link_resolution": True,      # Résolution liens internes
    "image_upload": True,          # Upload images locales
    "rich_text_formatting": True,  # Formatage inline
    "extended_markdown": True,     # Callouts multi-standards
    "flush_before_upload": True    # Vider page avant upload
}
```

---

## ⚡ Patterns à Éviter

### ❌ Mauvais Exemples

**1. Heading trop profond**
```markdown
#### H4 Heading  ❌
```

**Solution :**
```markdown
### H3 Heading  ✅

**Pseudo H4 en bold**
```

**2. Table trop large**
```markdown
| C1 | C2 | C3 | C4 | C5 | C6 |  ❌ (6 colonnes)
```

**Solution :** Diviser en 2 tables.

**3. Callout mal formaté**
```markdown
> [!NOTE] Titre
Contenu sans >  ❌
```

**Solution :**
```markdown
> [!NOTE]
> Contenu avec >  ✅
```

**4. Code block sans language**
```markdown
```
code sans language  ⚠️ Acceptable mais non optimal
```
```

**Solution :**
```markdown
```python
code avec language  ✅
```
```

---

## 🧪 Exemple Complet Optimal

```markdown
# Guide Utilisateur

Introduction avec **bold**, *italic*, et `code inline`.

## Installation

> [!IMPORTANT]
> Nécessite Python 3.11+

```bash
pip install universal-notion-uploader
```

### Configuration

Créer fichier `.env` :

| Variable | Description | Requis |
| -------- | ----------- | ------ |
| `NOTION_API_KEY` | Clé API | ✅ |
| `ROOT_PAGE_ID` | ID page racine | ✅ |

## Utilisation

Liste des étapes :

1. **Configurer** environnement
2. Scanner fichiers markdown
   - Vérifier structure
   - Valider syntaxe
3. Uploader vers Notion

> [!TIP]
> Utiliser `--dry-run` pour tester sans upload.

### Code Exemple

```python
from src.core.uploader import UniversalNotionUploader

uploader = UniversalNotionUploader.from_env()
result = await uploader.upload()
```

![Architecture](https://example.com/architecture.png)

## Support

Contactez-nous pour assistance.
```

**Ce qui rend cet exemple optimal :**
- ✅ Hiérarchie claire (H1 → H2 → H3)
- ✅ Callouts GitHub GFM
- ✅ Table ≤ 5 colonnes avec rich text
- ✅ Code block avec language
- ✅ Rich text dans paragraphes et listes
- ✅ Image externe
- ✅ Pas de H4+

---

## 📚 Référence Rapide

### **Formatage Inline (Rich Text)**
```markdown
**bold**  __bold__
*italic*  _italic_
`code`
~~strikethrough~~
[link](url)
```

### **Blocks**
```markdown
# H1  ## H2  ### H3
- [ ] Task unchecked
- [x] Task checked
- List  * List  + List
1. Ordered
> Blockquote
> [!NOTE] Callout
```python
Code
```
| Table | Header |
![Image](url)
```

### **Callouts Types**
```markdown
NOTE  TIP  IMPORTANT  WARNING  CAUTION  DANGER  INFO  EXAMPLE
```

---

## 🔍 Debugging & Validation

### **Vérifier Parsing Avant Upload**

```python
from src.parsers.markdown_parser import MarkdownParser

parser = MarkdownParser()
blocks = parser.parse(markdown_content)

# Inspecter blocks générés
for block in blocks:
    print(block["type"])  # heading_1, paragraph, callout, etc.
```

### **Logs Verbeux**
```bash
LOG_LEVEL=debug notion-upload
```

### **Dry Run**
```bash
notion-upload --dry-run
```

---

## 📖 Documentation Complète

**Repository GitHub :** (lien du projet)

**Fichiers Sources Parser :**
- `src/parsers/markdown_parser.py` (L54-162) : Parse principal
- `src/parsers/admonition_parser.py` (L58-84) : Callouts
- `src/parsers/rich_text_parser.py` (L110-184) : Rich text
- `src/parsers/table_parser.py` (L33-106) : Tables
- `src/parsers/image_parser.py` (L47-87) : Images

**Tests :**
- `tests/test_markdown_parser.py`
- `tests/test_admonition_parser.py`
- `tests/test_rich_text_parser.py`

---

## 🎯 Checklist LLM Pré-Upload

Avant de générer markdown destiné à ce système :

- [ ] Headings max H3 (pas H4+)
- [ ] Callouts utilisent syntaxe valide (préférer GFM)
- [ ] Tables compactes (≤ 10 colonnes recommandé pour lisibilité)
- [ ] Code blocks ont language spécifié
- [ ] Task lists utilisent `- [ ]` et `- [x]` (supporté ✅)
- [ ] Images utilisent URLs ou chemins valides
- [ ] Rich text utilisé dans paragraphes/listes/tables/tasks
- [ ] Texte long (>2000 chars) sera chunké automatiquement ✅
- [ ] Pas de HTML inline
- [ ] Pas de syntaxe markdown non supportée (footnotes, definition lists, etc.)


