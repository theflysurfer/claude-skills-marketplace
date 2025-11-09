# Agent Skills Specification

**Version**: 1.0
**Release Date**: 2025-10-16

## Definition

A **skill** is a folder containing instructions, scripts, and resources that agents can discover and load dynamically to perform better at specific tasks.

## Skill Recognition

A folder is recognized as a skill if it contains a file named **`SKILL.md`** at its root.

## Minimal Structure

The simplest possible skill contains a single file:

```
my-skill/
└── SKILL.md
```

## SKILL.md File Format

The `SKILL.md` file must contain:

1. **YAML frontmatter** at the beginning of the file
2. **Markdown content** following the frontmatter

### Example Structure

```markdown
---
name: my-skill
description: Description of the skill and its use cases
license: Apache-2.0
allowed-tools:
  - Read
  - Write
metadata:
  author: "Author Name"
  version: "1.0.0"
---

# Skill Instructions

Your detailed instructions in Markdown here...
```

## YAML Properties

### Required Properties

#### `name` (string, required)

- **Format**: kebab-case (lowercase and hyphens only)
- **Allowed characters**: Unicode lowercase alphanumeric characters and hyphens (`-`)
- **Constraint**: Must exactly match the parent folder name

**Valid examples**:
- `data-analyzer`
- `report-generator`
- `skill-test-123`

**Invalid examples**:
- `Data_Analyzer` (uppercase and underscores)
- `dataAnalyzer` (camelCase)
- `data analyzer` (spaces)

#### `description` (string, required)

Clear and concise description of the skill that explains:
- What the skill does
- When to use it
- Appropriate use cases

This description helps Claude determine when to appropriately activate the skill.

### Optional Properties

#### `license` (string, optional)

Information about the skill's license.

**Recommendation**: Use short SPDX format (e.g., `Apache-2.0`, `MIT`, `GPL-3.0`)

#### `allowed-tools` (array, optional)

List of pre-approved tools that Claude can use with this skill.

**Support**: Claude Code

**Example**:
```yaml
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
```

#### `metadata` (object, optional)

Custom key-value pairs for client-specific or application-specific properties.

**Example**:
```yaml
metadata:
  author: "John Doe"
  version: "1.2.3"
  category: "data-analysis"
  tags: ["finance", "reporting"]
```

## Markdown Content

After the YAML frontmatter, Markdown content can include:

- Detailed instructions for Claude
- Execution steps
- Examples and use cases
- Constraints and best practices
- Expected output formats
- References to other skill files

**No restrictions** are imposed on Markdown content.

## Best Practices

### File Organization

```
my-skill/
├── SKILL.md              # Main instructions (REQUIRED)
├── README.md             # Developer documentation
├── scripts/              # Auxiliary scripts
│   ├── process.py
│   └── helpers.js
├── templates/            # Document templates
│   └── report.md
└── data/                 # Reference data
    └── config.json
```

### Referencing Files

In your Markdown instructions, reference other skill files:

```markdown
To process the data, use the provided `scripts/process.py` script.
The report template is located in `templates/report.md`.
```

## Skill Validation

A valid skill must:

- ✅ Have a `SKILL.md` file at the root
- ✅ Contain valid YAML frontmatter
- ✅ Define `name` and `description` properties
- ✅ Use a `name` in kebab-case matching the folder
- ✅ Have Markdown content after the frontmatter

## Resources

- **Official Documentation**: [docs.anthropic.com/claude/docs/skills](https://docs.anthropic.com/claude/docs/skills)
- **Official Repository**: [github.com/anthropics/skills](https://github.com/anthropics/skills)

---

This specification is based on official Anthropic documentation.
