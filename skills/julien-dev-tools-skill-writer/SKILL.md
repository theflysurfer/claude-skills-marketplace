---
name: skill-writer
description: This skill should be used when users want to create a new skill or update an existing skill that extends Claude's capabilities with specialized workflows, domain knowledge, or tool integrations.
allowed-tools: Read, Write, Edit, Bash
---

# Skill Writer

Create effective skills following Anthropic's official design philosophy and specifications.

**Reference**: github.com/anthropics/skills/skill-creator for comprehensive guidance

## About Skills

Skills are modular packages that extend Claude's capabilities by providing specialized knowledge, workflows, and tools. They transform Claude from general-purpose agent into domain-specialized agent equipped with procedural knowledge that no model can fully possess.

**Skills provide**:
- Specialized workflows (multi-step procedures)
- Tool integrations (file formats, APIs)
- Domain expertise (company-specific knowledge, schemas)
- Bundled resources (scripts, references, assets)

## Skill Anatomy

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/      - Executable code (Python/Bash)
    ├── references/   - Documentation loaded on-demand
    └── assets/       - Output files (templates, images)
```

### SKILL.md (Required)

**YAML frontmatter**:
- `name`: Lowercase hyphen-case matching directory name
- `description`: 100-150 chars, explains what/when to use (third-person: "This skill should be used when...")
- `allowed-tools`: (optional) Pre-approved tools list

**Markdown body**:
- Purpose statement (few sentences)
- When to use
- How to use (procedural instructions)
- References to bundled resources

### Bundled Resources (Optional)

**scripts/** - Executable code for deterministic tasks
- When: Same code rewritten repeatedly or reliability needed
- Benefits: Token efficient, deterministic, may execute without loading into context

**references/** - Documentation loaded as needed
- When: Large reference material Claude should consult
- Examples: API docs, schemas, policies, detailed guides
- Benefits: Keeps SKILL.md lean, loaded only when needed
- Best practice: For large files (>10k words), include grep patterns in SKILL.md

**assets/** - Files used in output (not loaded into context)
- When: Templates, images, boilerplate for final output
- Examples: Logo images, PowerPoint templates, HTML boilerplate, fonts
- Benefits: Separates output resources from documentation

## Progressive Disclosure

Skills use three-level loading:
1. **Metadata** (name + description) - Always in context (~100 words)
2. **SKILL.md body** - When skill triggers (<5k words)
3. **Bundled resources** - As needed by Claude

## Creation Process

### Step 1: Gather Concrete Examples

Ask user for specific examples of how the skill will be used:
- "What functionality should this skill support?"
- "Can you give examples of how this would be used?"
- "What would a user say to trigger this skill?"

Avoid overwhelming with too many questions at once. Start with most important and follow up as needed.

**Conclude when**: Clear sense of functionality the skill should support.

### Step 2: Plan Reusable Contents

Analyze each example:
1. Consider how to execute from scratch
2. Identify what scripts/references/assets would help when executing repeatedly

**Examples**:
- PDF rotation → `scripts/rotate_pdf.py`
- Frontend webapp → `assets/hello-world/` boilerplate
- BigQuery queries → `references/schema.md`

Create list of reusable resources to include.

### Step 3: Initialize Structure

Create skill directory structure:

```bash
mkdir -p skill-name/{scripts,references,assets}
```

Create SKILL.md template with proper frontmatter.

### Step 4: Develop the Skill

**Start with reusable contents**: Implement `scripts/`, `references/`, and `assets/` files first. May require user input (brand assets, documentation, etc.).

**Update SKILL.md**:

Answer these questions:
1. What is the purpose? (few sentences)
2. When should it be used?
3. How should Claude use it? (reference all bundled resources)

**Writing style**:
- Use **imperative/infinitive form** (verb-first instructions)
- Objective, instructional language ("To accomplish X, do Y")
- NOT second person ("You should...")
- Focus on information beneficial and non-obvious to Claude
- Consider procedural knowledge, domain details, reusable assets

**Avoid duplication**: Information lives in either SKILL.md or references files, not both. Prefer references for detailed information. Keep SKILL.md lean with essential procedural instructions only.

### Step 5: Validate Quality

Check against standards:

**YAML frontmatter**:
- ✓ Name in hyphen-case, matches directory
- ✓ Description 100-150 chars, explains what/when
- ✓ Third-person description ("This skill should be used when...")

**Content**:
- ✓ Purpose statement clear
- ✓ When to use clearly defined
- ✓ How to use with step-by-step instructions
- ✓ 100-200 lines ideal (not 300+)
- ✓ References bundled resources
- ✓ Imperative/infinitive form throughout

**Resources**:
- ✓ No duplication between SKILL.md and references
- ✓ Large references include grep patterns
- ✓ Scripts for repetitive/deterministic tasks
- ✓ Assets for output files

**Security**:
- ✓ No hardcoded credentials (passwords, API keys, tokens)
- ✓ Sensitive data in `.env` file
- ✓ `.env` added to `.gitignore`
- ✓ Instructions use environment variables (`$VAR` or `source .env`)

**Portability**:
- ✓ Use relative paths (`.env`, `./scripts/`) instead of absolute paths
- ✓ Use `~/.claude/skills/` for user paths, not hardcoded home directories
- ✓ Avoid platform-specific paths (e.g., `C:\Users\...` in examples)

### Step 6: Test and Iterate

1. Test skill on real tasks
2. Notice struggles or inefficiencies
3. Identify needed updates to SKILL.md or resources
4. Implement changes and test again

## Design Principles

**Focused scope**: Single well-defined purpose, not trying to cover too much

**Concise instructions**: Essential procedural knowledge only, reference docs for details

**Progressive disclosure**: Name/description optimized for Claude to decide relevance before loading

**Operational focus**: Instructions Claude follows, not meta-commentary

**DRY principle**: Reference existing docs instead of duplicating

## Anti-Patterns to Avoid

❌ Description >200 chars (breaks progressive disclosure)
❌ Content >300 lines (too much detail)
❌ Duplicates existing docs (should reference instead)
❌ Development notes in content (timestamps, changelog)
❌ Generic/vague description (doesn't explain when to use)
❌ Second-person language ("you should...")
❌ Information in both SKILL.md and references files
❌ **Hardcoded credentials** (passwords, API keys, database credentials, tokens)
❌ **Sensitive data in code examples** (use placeholders or `.env` variables)
❌ **Absolute paths** in examples (`/home/user/...`, `C:\Users\...`)
❌ **Platform-specific paths** (Windows-only or Unix-only examples)

## References

- **Official spec**: github.com/anthropics/skills/agent_skills_spec.md
- **Skill creator**: github.com/anthropics/skills/skill-creator
- **Template**: github.com/anthropics/skills/template-skill
- **Examples**: github.com/anthropics/skills (algorithmic-art, brand-guidelines, etc.)
