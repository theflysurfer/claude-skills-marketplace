# What is CLAUDE.md?

**Sources:**
- [Claude Blog - Using CLAUDE.MD files](https://www.claude.com/blog/using-claude-md-files)
- [Anthropic Engineering - Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

## Definition

> **CLAUDE.md** is a configuration file that Claude automatically incorporates into every conversation, ensuring it always knows your project structure, coding standards, and preferred workflows.

**In simpler terms:** It's a file you create that tells Claude about your project, so you don't have to repeat yourself.

## Purpose

### Without CLAUDE.md

```
You: "Can you add a new API endpoint?"
Claude: "Sure! What's your tech stack?"
You: "Express.js with TypeScript"
Claude: "Where should I put it?"
You: "In src/routes/"
Claude: "What's your error handling pattern?"
You: "We use a custom error middleware..."
[... 10 more questions ...]
```

**Every conversation starts from zero.**

### With CLAUDE.md

```markdown
<!-- CLAUDE.md -->
# My API

Tech: Express.js + TypeScript
Routes go in: src/routes/
Errors: Use ErrorHandler middleware (src/middleware/errors.ts)
```

```
You: "Can you add a new API endpoint?"
Claude: "Sure! I'll add it to src/routes/ using TypeScript and your ErrorHandler pattern."
[Done in one exchange]
```

**Claude already knows the context.**

## How It Works

1. **You create** `CLAUDE.md` in your project root
2. **Claude automatically loads it** at the start of every conversation
3. **Content is prepended** to your prompts invisibly
4. **Claude uses it** to inform all responses

**It's like giving Claude a project handbook.**

## What Goes in CLAUDE.md?

### ✅ SHOULD Include

- Tech stack overview
- Project structure
- Common commands
- Key workflows
- Project-specific gotchas
- Links to other documentation

### ❌ SHOULD NOT Include

- Code style rules (use linters)
- Complete API documentation (link to it)
- General programming knowledge
- Copy-paste from other docs

**Rule:** Include ONLY what's unique to your project and hard to find elsewhere.

## Key Characteristics

### Automatic Loading

- No need to tell Claude to read it
- Loaded at conversation start
- Always available as context

### Persistent

- Survives across conversations
- No need to re-explain each time
- Update once, applies everywhere

### Hierarchical

- Can have multiple CLAUDE.md files
- Monorepos can have per-package files
- Closer to work location = higher priority

### Token Cost

> "The contents of your claude.md are prepended to your prompts, consuming part of your token budget with every interaction."

**Implication:** Keep it concise!

## Real-World Analogy

Think of CLAUDE.md like:

**Onboarding documentation for a new team member** - but one who:
- Never forgets
- Reads it every day
- Applies it automatically
- Never needs it repeated

## File Types

| File | Purpose | Example |
|------|---------|---------|
| `CLAUDE.md` | Shared project context | Team guidelines |
| `CLAUDE.local.md` | Personal overrides (gitignored) | Your preferences |
| `~/.claude/CLAUDE.md` | Global personal settings | Your coding style |

## Example CLAUDE.md

```markdown
# Acme Shop

E-commerce platform. Next.js 14 + TypeScript.

## Structure
app/       # Routes
components/ # React components
lib/       # Utilities

## Commands
npm run dev     # Start dev server
npm test        # Run tests

## Workflows
See: CONTRIBUTING.md

## Important
- Always use Server Actions for data mutations
- Run `npm run lint` before committing
```

**That's it.** Short, focused, links to details.

## Common Questions

### Q: Is it required?

**A:** No. But it makes Claude much more effective.

### Q: How long should it be?

**A:** 50-300 lines ideal. Under 500 max.

### Q: Can I have multiple?

**A:** Yes! Especially in monorepos or large codebases.

### Q: Should I commit it to git?

**A:** Usually yes (`CLAUDE.md`). No for personal overrides (`CLAUDE.local.md`).

### Q: What format?

**A:** Markdown (`.md`). No specific structure required.

### Q: Does Claude always use it?

**A:** Yes, it's automatically loaded. But Claude only applies relevant parts.

## Benefits

1. **Faster onboarding** - New convos start informed
2. **Fewer questions** - Claude knows the basics
3. **Consistent behavior** - Same context every time
4. **Team alignment** - Shared understanding
5. **Better results** - Context improves quality

## Trade-offs

### Pros
- Saves time explaining repeatedly
- Improves Claude's accuracy
- Documents project knowledge
- Team-shareable

### Cons
- Costs tokens on every interaction
- Needs maintenance
- Can become outdated
- Risk of being too verbose

**Balance:** Keep minimal, link to details.

## Evolution

CLAUDE.md is a **living document**:

1. Start minimal
2. Use Claude
3. Note what Claude misunderstands
4. Add ONLY that missing context
5. Remove what doesn't help
6. Repeat

**Don't write it all upfront.**

## Integration with Other Files

CLAUDE.md works alongside:

- **README.md** - User-facing project intro
- **CONTRIBUTING.md** - Contribution guidelines
- **package.json** - Dependencies & scripts
- **.eslintrc** - Code style rules
- **docs/** - Detailed documentation

**CLAUDE.md should reference these, not duplicate them.**

## Summary

**CLAUDE.md is:**
- A project context file for Claude
- Automatically loaded every conversation
- Kept concise and up-to-date
- Focused on unique project details
- Links to other docs (DRY principle)

**Goal:** Give Claude enough context to work effectively without repeating yourself.

## See Also

- [Best Practices](best-practices.md) - How to write good CLAUDE.md
- [DRY Template](dry-template.md) - Minimal starting template
- [File Locations](file-locations.md) - Where to place it
- [External Resources](external-resources.md) - Official documentation
