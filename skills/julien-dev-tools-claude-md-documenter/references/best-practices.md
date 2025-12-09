# CLAUDE.md Best Practices

**Sources:** This document consolidates best practices from official Anthropic documentation and community guides. All content is attributed.

## Core Principles

### 1. Keep It Concise {#concise}

**Source:** [Anthropic Engineering - Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

> "The contents of your claude.md are prepended to your prompts, consuming part of your token budget with every interaction."

**Why it matters:**
- CLAUDE.md content is sent with EVERY message
- Verbose files = higher cost per interaction
- More content = more noise for the model
- Harder for Claude to follow instructions

**Guideline:** Keep under 500 lines, aim for 200-300.

### 2. Instruction Limits (~150-200 max) {#instruction-limits}

**Source:** [HumanLayer Blog - Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

> "Frontier thinking LLMs can follow approximately 150-200 instructions with reasonable consistency."

**What counts as an instruction:**
- Direct commands ("Use X for Y")
- Formatting rules ("Always format dates as...")
- Workflow steps ("When deploying, first...")
- Preferences ("Prefer A over B")

**Not instructions:**
- Context ("This is a React project")
- References ("See docs/api.md")
- File locations ("Config in config/")

### 3. Avoid Code Style Guidelines {#avoid-code-style}

**Source:** [Anthropic Engineering](https://www.anthropic.com/engineering/claude-code-best-practices)

> "Never send an LLM to do a linter's job."

**Why:**
- LLMs are slow compared to linters
- LLMs are expensive compared to linters
- Linters are deterministic, LLMs are not
- Linting rules change, CLAUDE.md should be stable

**Instead:**
```markdown
❌ Don't: List 50 ESLint rules in CLAUDE.md
✅ Do: "Code style: See .eslintrc - run npm run lint"
```

### 4. Iterate Over Time {#iterate}

**Source:** [Claude Blog - Using CLAUDE.MD files](https://www.claude.com/blog/using-claude-md-files)

> "Treat claude.md as a living document, not 'set it and forget it'."

**Process:**
1. Start minimal
2. Give Claude tasks
3. Note what Claude doesn't know
4. Add ONLY that missing context
5. Remove what doesn't help
6. Repeat

**Anti-pattern:** Writing complete CLAUDE.md upfront.

### 5. Be Clear and Specific

**Source:** [Claude Docs - Prompting Best Practices](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)

> "Claude 4.x models respond well to clear, explicit instructions."

**Examples:**

❌ **Vague:**
```markdown
## Testing
Test your code.
```

✅ **Specific:**
```markdown
## Testing
Run `npm test` before committing.
Failed tests block CI - fix them first.
```

### 6. Provide Context and Motivation

**Source:** [Claude Docs - Be Clear and Direct](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct)

> "Providing context or motivation behind your instructions can help Claude better understand your goals."

**Example:**

❌ **No context:**
```markdown
Don't use class components.
```

✅ **With motivation:**
```markdown
Use function components with hooks (not classes).
Why: Our codebase migrated to hooks for better testability.
```

### 7. Use Examples Carefully

**Source:** [Claude Docs - Prompting Best Practices](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)

> "Claude 4.x models pay close attention to details and examples."

**Guidelines:**
- Examples should match desired behavior exactly
- Don't show anti-patterns without clear labels
- Quality over quantity (1-2 good examples > 10 mediocre)

### 8. Manage Context Window

**Source:** [Anthropic Engineering](https://www.anthropic.com/engineering/claude-code-best-practices)

> "During long sessions, Claude's context window can fill with irrelevant conversation."

**CLAUDE.md implications:**
- Don't add content that's only needed sometimes
- Use feature-specific CLAUDE.md files in subdirectories
- Let Claude pull them in on-demand

**Example structure:**
```
/CLAUDE.md                    # Core project context
/src/auth/CLAUDE.md          # Auth-specific (loaded when working in auth/)
/src/payments/CLAUDE.md      # Payments-specific
```

### 9. Don't Over-Document

**Principle:** If it's already documented elsewhere (and easy to find), just reference it.

**Decision tree:**
```
Is this documented elsewhere?
├─ Yes, in project docs
│  └─ ✅ Link to it
├─ Yes, in package.json
│  └─ ✅ Reference it ("See package.json scripts")
├─ Yes, in code comments
│  └─ ✅ Point to file
└─ No, and Claude needs it
   └─ ✅ Add to CLAUDE.md
```

### 10. Project-Specific Only

**What belongs in CLAUDE.md:**
- Unique project workflows
- Team conventions not documented elsewhere
- Critical gotchas
- Common debugging steps

**What doesn't belong:**
- General programming knowledge
- Language syntax
- Framework basics
- Tool usage (unless project-specific customization)

## Summary Checklist

Before finalizing CLAUDE.md, check:

- [ ] Under 500 lines (preferably 200-300)
- [ ] Fewer than 150-200 instructions
- [ ] No code style rules (defer to linters)
- [ ] Clear, specific instructions with motivation
- [ ] References to existing docs (not duplication)
- [ ] Project-specific content only
- [ ] Examples are accurate and helpful
- [ ] File locations specified
- [ ] Ready to iterate based on usage

## Anti-Patterns

### ❌ The Encyclopedia

```markdown
# Project

## React Basics
React is a JavaScript library...
[500 lines of React documentation]

## TypeScript Guide
TypeScript adds static typing...
[1000 lines of TypeScript docs]
```

**Problem:** Duplicates public knowledge Claude already has.

### ❌ The Linter Clone

```markdown
## Code Style
- Use 2 spaces
- Max line length 100
- Semicolons required
- [100 more linting rules]
```

**Problem:** Linters do this better, faster, cheaper.

### ❌ The Novel

```markdown
# My Amazing Project

This project was started in 2018 by...
[5 pages of project history]

The architecture evolved from...
[10 pages of architectural evolution]
```

**Problem:** Too much noise, buries useful instructions.

### ❌ The API Spec

```markdown
## API Endpoints

### GET /api/users
Returns list of users...
[Full OpenAPI specification pasted]
```

**Problem:** This should be in OpenAPI/Swagger docs, not CLAUDE.md.

## See Also

- [DRY Template](dry-template.md) - Minimal CLAUDE.md template
- [External Resources](external-resources.md) - Official documentation links
- [File Locations](file-locations.md) - Where to place CLAUDE.md files
