# CLAUDE.md File Locations

**Source:** [Claude Blog - Using CLAUDE.MD files](https://www.claude.com/blog/using-claude-md-files)

## Cascading Memory Locations

CLAUDE.md files are loaded in **hierarchical order of precedence**:

```
1. Home directory:     ~/.claude/CLAUDE.md          (Lowest priority)
2. Project root:       /project/CLAUDE.md
3. Parent directory:   /project/packages/CLAUDE.md
4. Working directory:  /project/packages/api/CLAUDE.md  (Highest priority)
```

**Rule:** Closer to where Claude is working = higher priority.

## Common Patterns

### Pattern 1: Simple Project (Single CLAUDE.md)

```
my-project/
├── CLAUDE.md          ← All project context here
├── src/
├── tests/
└── package.json
```

**When to use:**
- Single app/library
- Unified tech stack
- Small to medium codebase

**Check into git:** ✅ Yes

### Pattern 2: Project + Local (Personal Overrides)

```
my-project/
├── CLAUDE.md          ← Shared team context
├── CLAUDE.local.md    ← Your personal notes (gitignored)
├── src/
└── package.json
```

**When to use:**
- Want team-wide defaults
- Need personal overrides/notes
- Testing new instructions before sharing

**Check into git:**
- `CLAUDE.md`: ✅ Yes
- `CLAUDE.local.md`: ❌ No (add to .gitignore)

### Pattern 3: Monorepo (Hierarchical)

```
monorepo/
├── CLAUDE.md                      ← General monorepo context
├── packages/
│   ├── api/
│   │   ├── CLAUDE.md              ← API-specific context
│   │   └── src/
│   ├── web/
│   │   ├── CLAUDE.md              ← Web-specific context
│   │   └── src/
│   └── shared/
│       ├── CLAUDE.md              ← Shared lib context
│       └── src/
└── package.json
```

**When to use:**
- Monorepo with multiple packages
- Each package has different tech/workflows
- Want context loaded based on work location

**How it works:**
- Working in `/packages/api/src/` → Loads: `~/`, `/monorepo/`, `/packages/api/` CLAUDE.md files
- Working in `/packages/web/src/` → Loads: `~/`, `/monorepo/`, `/packages/web/` CLAUDE.md files

### Pattern 4: Feature-Specific (On-Demand)

```
project/
├── CLAUDE.md                      ← Core project context
├── src/
│   ├── auth/
│   │   ├── CLAUDE.md              ← Auth subsystem context
│   │   └── [auth files]
│   ├── payments/
│   │   ├── CLAUDE.md              ← Payments subsystem context
│   │   └── [payment files]
│   └── api/
│       ├── CLAUDE.md              ← API layer context
│       └── [api files]
└── package.json
```

**When to use:**
- Large codebase with distinct subsystems
- Each feature has unique patterns/rules
- Want to avoid loading all context unnecessarily

**How it works:**
- Claude loads subsystem CLAUDE.md only when working in that directory
- Reduces token usage for unrelated features

## File Naming Conventions

### Standard Names

| Filename | Purpose | Git? |
|----------|---------|------|
| `CLAUDE.md` | Shared project context | ✅ Commit |
| `CLAUDE.local.md` | Personal overrides | ❌ Gitignore |
| `claude.md` | Alternate (lowercase) | ✅ Works, but prefer uppercase |

**Recommendation:** Use `CLAUDE.md` (uppercase) for consistency with community.

## Priority Rules

When multiple CLAUDE.md files exist:

```
Working in: /project/packages/api/src/auth/handler.ts

Loads (in order):
1. ~/.claude/CLAUDE.md              (Global personal context)
2. /project/CLAUDE.md                (Project root)
3. /project/packages/CLAUDE.md       (Package level - if exists)
4. /project/packages/api/CLAUDE.md   (Package-specific)
5. /project/packages/api/src/CLAUDE.md         (Directory-specific - if exists)
6. /project/packages/api/src/auth/CLAUDE.md    (Feature-specific - if exists)
```

**Later files override earlier files** for conflicting instructions.

## Decision Tree

```
Choose file location:

Single app/library?
├─ YES → Use /project/CLAUDE.md
│
└─ NO → Is it a monorepo?
   ├─ YES → Use hierarchical structure
   │  ├─ /monorepo/CLAUDE.md (general)
   │  └─ /monorepo/packages/*/CLAUDE.md (per-package)
   │
   └─ NO → Large app with subsystems?
      ├─ YES → Use feature-specific
      │  ├─ /project/CLAUDE.md (core)
      │  └─ /project/src/feature/CLAUDE.md (per-feature)
      │
      └─ NO → Just use /project/CLAUDE.md
```

## Best Practices

### ✅ DO

1. **Start simple** - One CLAUDE.md at root
2. **Add hierarchy only when needed** - Don't over-engineer
3. **Use CLAUDE.local.md for personal experiments**
4. **Check main CLAUDE.md into git**
5. **Document what's in each file** (in the file itself)

### ❌ DON'T

1. **Don't create empty CLAUDE.md files** - Only add when needed
2. **Don't duplicate content** - Use hierarchy to specialize, not repeat
3. **Don't put secrets in CLAUDE.md** - It's checked into git
4. **Don't create deep hierarchies** - 2-3 levels max
5. **Don't forget to gitignore CLAUDE.local.md**

## Examples

### Example 1: Simple Project

```bash
# .gitignore
CLAUDE.local.md
```

```markdown
<!-- CLAUDE.md -->
# My Simple API

Quick context for the entire project.
```

### Example 2: Monorepo

```markdown
<!-- /monorepo/CLAUDE.md -->
# Acme Monorepo

General context shared across all packages.
See individual package CLAUDE.md for package-specific info.
```

```markdown
<!-- /monorepo/packages/api/CLAUDE.md -->
# API Package

Specific to the API package.
Inherits general context from /monorepo/CLAUDE.md.
```

### Example 3: Large App

```markdown
<!-- /project/CLAUDE.md -->
# Main Project

Core project context applicable everywhere.
See src/*/CLAUDE.md for subsystem-specific context.
```

```markdown
<!-- /project/src/auth/CLAUDE.md -->
# Auth Subsystem

Loaded ONLY when working in src/auth/.
Authentication-specific patterns and rules.
```

## .gitignore Configuration

**Recommended .gitignore:**

```gitignore
# Personal Claude config
CLAUDE.local.md
*.local.md

# Optional: Ignore all CLAUDE.md (if you prefer local-only)
# CLAUDE.md
```

**Most common:** Commit `CLAUDE.md`, ignore `CLAUDE.local.md`

## Home Directory Context

**Location:** `~/.claude/CLAUDE.md`

**Purpose:**
- Personal preferences across ALL projects
- Common aliases/shortcuts you always use
- Your coding style (not project-specific)

**Example:**

```markdown
<!-- ~/.claude/CLAUDE.md -->
# My Personal Preferences

## Style
I prefer:
- Functional programming
- Explicit over implicit
- Comments explaining "why", not "what"

## Common Patterns
When I say "add tests", I mean:
- Unit tests with Jest
- Coverage > 80%
- Test both happy and error paths
```

**Note:** Keep this minimal - most context should be project-specific.

## Troubleshooting

### Claude not seeing CLAUDE.md

**Possible causes:**
1. Typo in filename (`claude.md` vs `CLAUDE.md` - both work, but check)
2. File in wrong location (not in project root)
3. File encoding issue (should be UTF-8)

**Fix:** Check filename, location, and encoding.

### Conflicting instructions

**Cause:** Multiple CLAUDE.md files with contradicting instructions.

**Fix:**
1. Check which files are loaded: `ls -la **/CLAUDE.md`
2. Remember: closer to working dir = higher priority
3. Use specificity to override (more specific beats more general)

### Context too large

**Cause:** Multiple CLAUDE.md files loaded, total content too large.

**Fix:**
1. Reduce content in each file
2. Move some instructions to feature-specific files
3. Use on-demand loading (only load when in that dir)

## Quick Reference

| Use Case | Structure | Files |
|----------|-----------|-------|
| Simple project | Flat | 1 CLAUDE.md at root |
| Personal overrides | Flat + local | CLAUDE.md + CLAUDE.local.md |
| Monorepo | Hierarchical | Root + per-package |
| Large app | Feature-specific | Root + per-feature |
| Personal prefs | Home dir | ~/.claude/CLAUDE.md |

## See Also

- [Best Practices](best-practices.md) - What to put in CLAUDE.md
- [DRY Template](dry-template.md) - How to structure content
- [External Resources](external-resources.md) - Official documentation
