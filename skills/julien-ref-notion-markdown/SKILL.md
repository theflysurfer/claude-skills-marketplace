---
name: julien-ref-notion-markdown
description: Markdown structuring guide for Universal Notion Uploader parser. Covers supported elements (H1-H3, callouts, tables, task lists), rich text formatting, and LLM best practices.
triggers:
  - notion markdown
  - notion uploader
  - markdown notion
  - notion callout
  - notion parser
  - markdown to notion
  - notion api markdown
  - universal notion uploader
  - notion table
---

# Markdown Structuring Guide for Universal Notion Uploader

Guide for LLMs generating markdown destined to be uploaded to Notion via the Universal Notion Uploader parser.

---

## Parser Architecture

```
MarkdownParser
├── AdmonitionParser    # Multi-standard callouts
├── RichTextParser      # Inline formatting (bold, italic, code, etc.)
├── TableParser         # Markdown tables → Notion
└── ImageParser         # Local and external images
```

---

## Supported Elements

### 1. Headings (H1-H3 Only)

```markdown
# Heading 1
## Heading 2
### Heading 3
```

**Notion API**: `heading_1`, `heading_2`, `heading_3`

**Limitations**: Maximum 3 levels. H4+ NOT supported by Notion.

**Workaround for H4+**: Use **bold paragraph**
```markdown
**Pseudo-Heading 4**
Content of the section...
```

---

### 2. Rich Text (Inline Formatting)

```markdown
**bold** or __bold__
*italic* or _italic_
`code inline`
~~strikethrough~~
[links](https://example.com)
```

- Combine freely: `**bold *and italic***`
- Parser handles overlaps automatically

---

### 3. Callouts (4 Syntaxes Supported)

#### GitHub GFM (PREFERRED)
```markdown
> [!NOTE]
> This is an important note.
> Can contain multiple lines.
```

**Types**: NOTE, TIP, IMPORTANT, WARNING, CAUTION, DANGER, INFO, EXAMPLE

#### Python-Markdown
```markdown
!!! note "Optional Title"
    Indented content.
```

#### MyST Markdown
```markdown
:::note Optional Title
Content without indentation.
:::
```

#### Docusaurus
```markdown
:::tip
Content directly.
:::
```

**Type → Emoji Mapping**:
| Type | Emoji | Color |
|------|-------|-------|
| NOTE | 📝 | blue_background |
| TIP | 💡 | yellow_background |
| IMPORTANT | ❗ | purple_background |
| WARNING | ⚠️ | orange_background |
| CAUTION | 🚨 | red_background |
| DANGER | 🔥 | red_background |
| INFO | ℹ️ | blue_background |
| EXAMPLE | 📖 | gray_background |

**DO NOT** mix syntaxes in the same callout.

---

### 4. Lists

#### Unordered Lists
```markdown
- Item 1
- Item 2
  - Nested item (indentation)
- Item 3
```

Variants: `-`, `*`, `+`

#### Ordered Lists
```markdown
1. First item
2. Second item
   1. Nested item
3. Third item
```

#### Task Lists (To-Do)
```markdown
- [ ] Uncompleted task
- [x] Completed task
- [X] Also completed (uppercase supported)
```

**Notion API**: `to_do` block with `checked: true/false`

Rich text works in list items:
```markdown
- **Bold item** with *italic*
- [ ] Task with `inline code`
- Item with [link](url)
```

---

### 5. Code Blocks

```markdown
```python
def hello():
    print("Hello world")
```
```

- **Always specify language** after ` ``` `
- If unknown language, use `plain text`
- No rich text in code blocks (raw text only)
- Long code (>2000 chars) auto-chunked

---

### 6. Tables

```markdown
| Name | **Status** | Count |
| ---- | ---------- | ----- |
| foo  | *active*   | 42    |
| bar  | inactive   | 0     |
```

**Rich text in cells**: Bold, italic, code inline, links supported

**Recommendations**:
- Prefer ≤ 10 columns for readability (warning beyond)
- No strict technical limit
- Structure: Header row → Separator row → Data rows

---

### 7. Blockquotes

```markdown
> This is a normal quote.
> Can contain multiple lines.
```

**Distinction with callouts**:
```markdown
> Simple blockquote       → Notion quote block
> [!NOTE] Callout         → Notion callout block
```

Rich text supported in quotes.

---

### 8. Images

#### External Images (URLs)
```markdown
![Alt text](https://example.com/image.png)
```

#### Local Images
```markdown
![Alt text](./images/photo.jpg)
```

- Relative paths resolved from `base_dir` config
- Local images require upload (slower)
- Alt text recommended but not displayed in Notion (API limitation)

---

## Parsing Order (Priority)

1. **Tables** (multi-line, high priority)
2. **Code blocks** (multi-line)
3. **Callouts** (multi-line, 4 syntaxes)
4. **Images** (single line)
5. **Headings** (H1-H3)
6. **Task lists** (`- [ ]` / `- [x]`) - BEFORE unordered lists
7. **Unordered lists** (`-`, `*`, `+`)
8. **Ordered lists** (`1.`, `2.`)
9. **Blockquotes** (`> text`)
10. **Paragraphs** (fallback)

---

## NOT Supported

### Markdown Features
- Footnotes (`[^1]`)
- Definition lists
- HTML inline
- Emoji shortcodes (`:smile:`)
- Headings H4-H6
- Nested blockquotes (`>> Level 2`)
- Indented code blocks (use fenced instead)

---

## Patterns to Avoid

### Heading too deep
```markdown
#### H4 Heading  ❌
```
→ Use `### H3` or `**Pseudo H4 in bold**`

### Table too wide
```markdown
| C1 | C2 | C3 | ... | C12 |  ⚠️ Hard to read
```
→ Split into multiple tables

### Malformed callout
```markdown
> [!NOTE] Title
Content without >  ❌
```
→ Every line needs `>`

### Code block without language
```markdown
```
code without language  ⚠️ Works but not optimal
```
```
→ Always specify language

---

## LLM Pre-Upload Checklist

- [ ] Headings max H3 (no H4+)
- [ ] Callouts use valid syntax (prefer GFM)
- [ ] Tables compact (≤ 10 columns recommended)
- [ ] Code blocks have language specified
- [ ] Task lists use `- [ ]` and `- [x]`
- [ ] Images use URLs or valid paths
- [ ] Rich text in paragraphs/lists/tables/tasks
- [ ] No HTML inline
- [ ] No unsupported syntax (footnotes, definition lists)

---

## Quick Reference

### Inline Formatting
```markdown
**bold**  __bold__
*italic*  _italic_
`code`
~~strikethrough~~
[link](url)
```

### Blocks
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

### Callout Types
```
NOTE  TIP  IMPORTANT  WARNING  CAUTION  DANGER  INFO  EXAMPLE
```
