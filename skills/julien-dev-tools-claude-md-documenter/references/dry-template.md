# DRY CLAUDE.md Template

**Principle:** Link to existing docs, don't duplicate them.

## Minimal Template

```markdown
# [Project Name]

## Quick Context
[2-3 sentences: What is this project? What problem does it solve?]

## Tech Stack
- Primary: [language/framework]
- Key deps: [list or link to package.json/requirements.txt]

Full details: [link to tech doc or package.json]

## Project Structure
```
[Minimal tree showing important directories]
OR
See: `docs/architecture.md` for full structure
```

## Common Commands
```bash
[3-5 most frequently used commands]
```

All commands: See `package.json` "scripts" section
OR
All commands: Run `npm run` to list

## Key Workflows

### [Workflow 1 name]
[Brief steps OR link to docs/workflows.md]

### [Workflow 2 name]
[Brief steps OR link to CONTRIBUTING.md]

## Important Notes
- [Critical gotcha #1 not documented elsewhere]
- [Critical gotcha #2 not documented elsewhere]

## References
- Architecture: [link]
- API Docs: [link]
- Contributing: [link]
- Code Style: [link to .eslintrc / style guide]
```

## When to Expand Each Section

### Quick Context
**Include:** 2-3 sentences max
**Link to:** Full README.md or docs/overview.md
**Don't:** Write multi-paragraph history

### Tech Stack
**Include:** Main language/framework, 3-5 critical dependencies
**Link to:** package.json, requirements.txt, go.mod
**Don't:** List every dependency with versions

### Project Structure
**Include:** 5-10 most important directories
**Link to:** Full architecture doc or README
**Don't:** Show complete file tree

### Common Commands
**Include:** 3-5 commands used daily
**Link to:** package.json scripts, Makefile, docs/commands.md
**Don't:** List 50+ commands

### Workflows
**Include:** Unique steps not documented elsewhere
**Link to:** CONTRIBUTING.md, docs/workflows.md
**Don't:** Duplicate existing workflow docs

### Important Notes
**Include:** Project-specific gotchas
**Don't:** General programming advice

### References
**Always include:** Links to all relevant docs
**Organize:** By topic (architecture, API, contributing, etc.)

## Size Guidelines

| Section | Target Lines | Max Lines |
|---------|--------------|-----------|
| Quick Context | 3-5 | 10 |
| Tech Stack | 5-10 | 20 |
| Project Structure | 10-20 | 30 |
| Common Commands | 5-15 | 30 |
| Workflows (each) | 5-10 | 20 |
| Important Notes | 5-15 | 30 |
| References | 5-10 | 20 |
| **TOTAL** | **40-85** | **160** |

**Absolute maximum:** 500 lines including examples

## Example: Too Much vs Just Right

### ❌ TOO MUCH (Duplicates Info)

```markdown
# My API

## Project Structure
```
project/
├── src/
│   ├── controllers/
│   │   ├── userController.js
│   │   │   └── Contains user CRUD operations
│   │   │       ├── getUser() - fetches user by ID
│   │   │       ├── createUser() - creates new user
│   │   │       └── [10 more functions explained]
│   │   ├── postController.js
│   │   └── [20 more files explained]
[... 200 more lines ...]
```

## API Endpoints
### POST /api/users
Creates a new user.
Request body: {name, email, password}
Returns: {id, name, email, createdAt}
[... 50 more endpoints ...]
```

**Problems:**
- 200+ lines of structure that changes frequently
- Duplicates API documentation
- Hard to maintain

### ✅ JUST RIGHT (Links to Info)

```markdown
# My API

## Project Structure
```
src/
├── controllers/  # Request handlers
├── models/      # Database schemas
├── routes/      # API routes
└── utils/       # Helpers
```

Full structure with details: `docs/architecture.md`

## API Endpoints
See: `docs/api/openapi.yaml` or visit `/api-docs` when running

Quick test: `npm run test:api`
```

**Why better:**
- Concise (15 lines vs 200+)
- Links to source of truth
- Easy to maintain

## Conditional Expansion

**Expand a section when:**
- Information exists NOWHERE else
- It's critical for Claude to know
- It changes rarely
- It's project-specific

**Keep it minimal when:**
- It's documented elsewhere
- It changes frequently
- It's generated (API specs, deps)
- It's enforced by tooling (linting)

## Decision Tree

```
For each piece of information:

Is it documented elsewhere in the project?
├─ YES
│  ├─ Is that documentation easy to find?
│  │  ├─ YES → Link to it
│  │  └─ NO → Add to CLAUDE.md + improve other doc
│  └─
└─ NO
   ├─ Does Claude need to know it?
   │  ├─ YES → Add to CLAUDE.md
   │  └─ NO → Don't add
   └─
```

## Real-World Example

**Project:** Next.js e-commerce site

```markdown
# Acme Shop

## Quick Context
E-commerce platform built with Next.js 14, selling physical products.
Uses Stripe for payments, Vercel for hosting.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Prisma + PostgreSQL
- Stripe, Resend

See: `package.json` for complete dependencies

## Structure
```
app/              # Next.js routes
├── (shop)/      # Public shop pages
├── admin/       # Admin dashboard
└── api/         # API routes
components/       # React components
lib/             # Utilities
prisma/          # Database schema
```

## Commands
```bash
npm run dev          # Start dev (http://localhost:3000)
npm run db:push      # Push schema changes
npm run stripe:listen # Test webhooks locally
```

All commands: `package.json` scripts section

## Workflows

### Adding a New Feature
1. Create feature branch
2. Add types in `lib/types.ts`
3. Add to Prisma schema if DB changes
4. Run `npm run db:push`
5. See: `CONTRIBUTING.md` for full flow

### Debugging Stripe Webhooks
1. Run `npm run stripe:listen` in terminal
2. Copy webhook secret to `.env.local`
3. Make test purchase
4. Check: `logs/stripe.log`

## Important Notes
- Always use Server Actions for mutations (not Route Handlers)
- Product images must be optimized before upload (see `lib/image-utils.ts`)
- Stripe webhook endpoint: `/api/webhooks/stripe` must be registered in Stripe dashboard

## References
- API Routes: `app/api/README.md`
- Database Schema: `prisma/schema.prisma`
- UI Components: Storybook at `/storybook`
- Deployment: `docs/deployment.md`
```

**Analysis:**
- 57 lines total
- Links to 8 external docs
- Only includes unique, undocumented gotchas
- No duplication of package.json, schema, etc.

## Template Variations

### For Monorepos

```markdown
# [Monorepo Name]

## Structure
```
packages/
├── api/          # Backend API
├── web/          # Frontend app
└── shared/       # Shared utilities
```

Each package has own README. See: `docs/monorepo-guide.md`

## Working in This Repo
```bash
npm run dev:api    # Start API only
npm run dev:web    # Start web only
npm run dev        # Start all
```

Package-specific commands: See each package's README
```

### For Libraries

```markdown
# [Library Name]

## Quick Context
[What does this library do? What problem does it solve?]

## Development
```bash
npm test           # Run tests
npm run build      # Build for publication
npm run docs       # Generate API docs
```

## Contributing
See: `CONTRIBUTING.md` for full guide

## Publishing
See: `docs/release-process.md`
```

### For Scripts/Tools

```markdown
# [Tool Name]

## What It Does
[1 sentence description]

## Usage
```bash
./tool.sh [options]
```

See: `./tool.sh --help` for all options

## Configuration
Edit: `config.json` (see `config.example.json` for template)

## Troubleshooting
See: `docs/troubleshooting.md`
```

## Anti-Pattern: The Expander

**Don't do this:**

```markdown
# Project

## Commands

Here are ALL the commands in package.json explained:

- `npm run dev` - Starts the development server on port 3000 using nodemon...
- `npm run build` - Compiles TypeScript to JavaScript, runs webpack...
- `npm test` - Runs Jest test suite with coverage, outputs to coverage/...
[... 50 more commands with detailed explanations ...]
```

**Instead:**

```markdown
# Project

## Commands
```bash
npm run dev        # Start dev server
npm test          # Run tests
npm run build     # Production build
```

All commands: Run `npm run` or see `package.json` scripts
```

## Summary

1. **Start minimal** - Use this template as maximum, not minimum
2. **Link first** - Always prefer linking to duplicating
3. **Expand judiciously** - Only add what's truly undocumented
4. **Keep under 200 lines** - Aim for 50-100 for most projects
5. **Iterate** - Add more only when Claude actually needs it

## See Also

- [Best Practices](best-practices.md) - Core principles
- [External Resources](external-resources.md) - Official docs
