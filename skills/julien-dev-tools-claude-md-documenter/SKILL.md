---
name: julien-dev-tools-claude-md-documenter
description: Guide for creating effective CLAUDE.md files following DRY principles. Points to official docs and best practices without duplication. Helps document project context concisely.
license: Apache-2.0
category: development
keywords:
  - claude-md
  - documentation
  - project-context
  - dry
  - best-practices
metadata:
  author: "Julien"
  version: "1.0.0"
---

# CLAUDE.md Documenter

Help users create effective `CLAUDE.md` files following **DRY principles** (Don't Repeat Yourself).

## Core Principle: Point, Don't Duplicate

**This skill does NOT repeat documentation.** Instead, it:
- ✅ Points to authoritative sources
- ✅ Provides structure and templates
- ✅ Gives project-specific guidance
- ❌ Does NOT duplicate official docs

## What is CLAUDE.md?

A configuration file that Claude automatically loads for project context.

**📚 Full explanation:** See [references/what-is-claude-md.md](references/what-is-claude-md.md)

## Quick Start

When user asks to document a CLAUDE.md file:

### 1. Understand the Project First

**Before writing anything**, ask:
- What's the tech stack?
- What's the project structure?
- What are common pain points?
- What workflows are repetitive?

### 2. Use the DRY Template

**Read:** [references/dry-template.md](references/dry-template.md) for the minimal template.

**Key sections:**
```markdown
# Project Name

## Tech Stack
[Link to package.json / requirements.txt / tech doc]

## Structure
[Link to architecture doc or tree command output]

## Commands
[Link to scripts section in package.json]

## Workflows
[Link to CONTRIBUTING.md or workflow docs]

## References
- Architecture: [link]
- API Docs: [link]
- Style Guide: [link]
```

### 3. Follow Best Practices

**📖 Read these in order:**

1. **Keep it concise:** [references/best-practices.md#concise](references/best-practices.md)
   - CLAUDE.md content is prepended to EVERY prompt
   - Verbose files = higher token cost + noise

2. **~150-200 instructions max:** [references/best-practices.md#instruction-limits](references/best-practices.md)
   - Models can follow 150-200 instructions consistently

3. **Point to linters, don't duplicate:** [references/best-practices.md#avoid-code-style](references/best-practices.md)
   - Never make Claude do a linter's job
   - Reference: `.eslintrc`, `.prettierrc`, etc.

4. **Iterate over time:** [references/best-practices.md#iterate](references/best-practices.md)
   - Living document, not "set and forget"

**Full best practices list:** [references/best-practices.md](references/best-practices.md)

## DRY Examples

### ❌ BAD (Duplicates information)

```markdown
# My Project

## Code Style
- Use 2 spaces for indentation
- Use single quotes for strings
- Max line length is 100
- Always use semicolons
- Use const instead of let when possible
- [... 50 more linting rules ...]
```

### ✅ GOOD (Points to source)

```markdown
# My Project

## Code Style
See `.eslintrc.json` and `.prettierrc` - run `npm run lint` to check.
```

### ❌ BAD (Repeats documentation)

```markdown
## API Endpoints

### POST /api/users
Creates a new user. Accepts JSON body with:
- name (string, required)
- email (string, required)
- age (number, optional)
[... entire API documentation ...]
```

### ✅ GOOD (References documentation)

```markdown
## API

Full API docs: `docs/api/README.md`
OpenAPI spec: `docs/openapi.yaml`
Test with: `npm run test:api`
```

## When to Include Details vs References

### Include in CLAUDE.md:
- Project-specific workflows NOT documented elsewhere
- Common gotchas unique to this project
- Bash commands that aren't in package.json
- Critical context Claude MUST know

### Reference externally:
- Code style (use linters)
- API specs (use OpenAPI/docs)
- Architecture (use diagrams/docs)
- Dependencies (use package.json)
- Git workflow (use CONTRIBUTING.md)

## File Locations

**📍 Where to place CLAUDE.md:** [references/file-locations.md](references/file-locations.md)

- Root: `/CLAUDE.md` (recommended)
- Local: `/CLAUDE.local.md` (gitignored, personal)
- Monorepo parent: `/packages/CLAUDE.md`
- Feature-specific: `/src/auth/CLAUDE.md`

## Workflow

### Step 1: Audit Existing Docs

```bash
# Check what docs already exist
ls -la docs/
cat package.json | jq '.scripts'
cat CONTRIBUTING.md
```

### Step 2: Identify Gaps

What's NOT documented but Claude needs to know?

### Step 3: Create Minimal CLAUDE.md

Use template from [references/dry-template.md](references/dry-template.md)

### Step 4: Add References

Link to existing docs, don't duplicate them.

### Step 5: Test & Iterate

Ask Claude to do tasks relying on CLAUDE.md instructions.
Refine based on results.

## Anti-Patterns to Avoid

**🚫 Don't repeat yourself:**
- ❌ Copy-paste from other docs
- ❌ Duplicate package.json scripts
- ❌ List all API endpoints
- ❌ Include entire coding standards

**✅ Do point to sources:**
- ✅ "See docs/api.md for endpoints"
- ✅ "Run npm run to see all commands"
- ✅ "Follow .eslintrc for style"
- ✅ "Architecture: docs/architecture.md"

## Official Resources

**🌐 External Links:** [references/external-resources.md](references/external-resources.md)

Essential reading:
- [Anthropic: Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Claude Blog: Using CLAUDE.MD files](https://www.claude.com/blog/using-claude-md-files)
- [HumanLayer: Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

## Example Output

When documenting a CLAUDE.md, provide:

```markdown
# [Project Name]

## Quick Context
[2-3 sentences about the project]

## Tech Stack
See: `package.json`, `requirements.txt`, or [link to tech doc]

## Structure
```
[Project tree or link to architecture doc]
```

## Common Commands
```bash
npm run dev        # Start dev server
npm test          # Run tests
npm run build     # Production build
```
See: `package.json` "scripts" section for all commands

## Workflows

### Development
1. [Steps or link to CONTRIBUTING.md]

### Deployment
See: `docs/deployment.md`

## Important Notes
[Project-specific gotchas that aren't documented elsewhere]

## References
- API: [link]
- Architecture: [link]
- Contributing: [link]
- Style Guide: [link]
```

## Key Reminders

1. **Always ask about existing docs first** - Don't create redundant content
2. **Keep it under 500 lines** - Longer = more expensive + more noise
3. **Link, don't duplicate** - DRY principle is paramount
4. **Iterate based on usage** - Not a one-time task
5. **Project-specific only** - General knowledge belongs in docs/

## Read First

Before helping with CLAUDE.md, **always read:**
1. [references/best-practices.md](references/best-practices.md) - Core principles
2. [references/dry-template.md](references/dry-template.md) - Minimal template
3. [references/external-resources.md](references/external-resources.md) - Official sources

This skill embodies DRY by not repeating official documentation.
All detailed information is in references/ with proper attribution.
