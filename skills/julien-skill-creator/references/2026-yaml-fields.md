# 2026 YAML Fields Reference

Comprehensive guide to Anthropic skill YAML frontmatter fields as of January 2026.

## Table of Contents

1. [Required Fields](#required-fields)
2. [Version Tracking](#version-tracking)
3. [Licensing](#licensing)
4. [Tool Restrictions (Security)](#tool-restrictions-security)
5. [Invocation Control](#invocation-control)
6. [Execution Modes](#execution-modes)
7. [Lifecycle Hooks](#lifecycle-hooks)
8. [Triggers (Discovery)](#triggers-discovery)
9. [Metadata](#metadata)
10. [Complete Example](#complete-example)
11. [Migration Guide](#migration-guide)
12. [Validation Checklist](#validation-checklist)

---

## Required Fields

These fields are mandatory in every skill:

### `name`

**Type**: String
**Max length**: 64 characters
**Format**: Lowercase letters, numbers, hyphens only
**Restrictions**: Cannot contain "anthropic" or "claude", no XML tags

```yaml
name: excel-report-generator
```

**Best practices:**
- Use gerund form (preferred): `processing-pdfs`, `analyzing-data`
- Or noun form: `pdf-processor`, `data-analyzer`
- Avoid: `ExcelReportGenerator`, `excel_report`, `EXCEL-REPORT`

### `description`

**Type**: String
**Max length**: 1024 characters
**Format**: Third-person voice, non-empty
**Must include**: What the skill does AND when to use it

```yaml
description: >
  Generates monthly Excel reports with charts and pivot tables from CSV data.
  Use when creating reports, analyzing sales data, or generating spreadsheets.
```

**Best practices:**
- Start with action verb: "Processes...", "Generates...", "Analyzes..."
- Include trigger keywords naturally
- Explain the "when" (context for Claude's skill discovery)
- Avoid first/second person: "I can help...", "You can use this..."
- Keep under 200 chars if possible (progressive disclosure)

---

## Version Tracking

### `version`

**Type**: String
**Format**: Semantic versioning (MAJOR.MINOR.PATCH)
**Optional but recommended**

```yaml
version: "1.2.3"
```

**When to use**: Always recommended for:
- Hot-reload tracking (Claude Code v2.1.0+)
- Change management
- Debugging ("which version is loaded?")

**Versioning guidelines:**
- MAJOR: Breaking changes, incompatible API
- MINOR: New features, backward-compatible
- PATCH: Bug fixes, no new features

**Example evolution:**
```yaml
version: "1.0.0"  # Initial release
version: "1.1.0"  # Added new trigger keywords
version: "1.1.1"  # Fixed path bug
version: "2.0.0"  # Changed output format (breaking)
```

---

## Licensing

### `license`

**Type**: String
**Common values**: `Apache-2.0`, `MIT`, `proprietary`

```yaml
license: Apache-2.0
```

**When to use**:
- Marketplace distribution
- Open-source skills
- Commercial skills (use `proprietary`)

**License comparison:**

| License | Commercial Use | Modification | Attribution Required |
|---------|----------------|--------------|---------------------|
| Apache-2.0 | ✓ | ✓ | ✓ |
| MIT | ✓ | ✓ | ✓ |
| Proprietary | Restricted | Restricted | N/A |

---

## Tool Restrictions (Security)

### `allowed-tools`

**Type**: Array of strings
**Purpose**: Whitelist tools Claude can use when skill is active

```yaml
allowed-tools:
  - Read
  - Write
  - Bash
```

**Available tools**:
- `Read`, `Write`, `Edit`
- `Bash`, `Glob`, `Grep`
- `Task`, `WebFetch`, `WebSearch`
- `TodoWrite`, `AskUserQuestion`
- Custom MCP tools

**When to use**:

1. **Deployment skills** (prevent accidental file edits):
   ```yaml
   allowed-tools: [Read, Bash]
   ```

2. **Read-only analysis**:
   ```yaml
   allowed-tools: [Read, Grep, Glob]
   ```

3. **Restricted write operations**:
   ```yaml
   allowed-tools: [Read, Write]  # No Bash execution
   ```

**Security benefits:**
- Limits blast radius if skill is compromised
- Prevents accidental destructive operations
- Documents intended tool usage

**Anti-pattern**: Don't restrict tools unnecessarily - it limits skill flexibility.

---

## Invocation Control

### `user-invocable`

**Type**: Boolean
**Default**: `true`
**Purpose**: Show skill in `/skills/` slash menu?

```yaml
user-invocable: true   # Visible in menu
user-invocable: false  # Hidden from menu (Claude can still discover it)
```

**When to use `false`**:
- Internal helper skills (called only by other skills)
- Intermediate workflow steps
- Skills with complex prerequisites

**Example use case**:
```yaml
# Helper skill for validation (not directly invoked)
name: validate-deployment-environment
user-invocable: false
```

### `disable-model-invocation`

**Type**: Boolean
**Default**: `false`
**Purpose**: Prevent Claude from auto-triggering based on description

```yaml
disable-model-invocation: false  # Claude can auto-trigger
disable-model-invocation: true   # Manual invocation only (/skill-name)
```

**When to use `true`**:
- Destructive operations (delete database, force push)
- Production deployments
- Skills requiring explicit user approval
- Admin-only commands

**Example use case:**
```yaml
# Production deploy - require explicit /deploy command
name: production-deployment
disable-model-invocation: true
```

---

## Execution Modes

### `mode`

**Type**: String
**Values**: `interactive`, `batch`, `autonomous`
**Optional**

```yaml
mode: interactive
```

**Modes explained:**

| Mode | User Interaction | Use Case | Example |
|------|------------------|----------|---------|
| `interactive` | Required at steps | User approvals, confirmations | Database migration with checkpoints |
| `batch` | None (bulk processing) | Large dataset processing | Batch image conversion |
| `autonomous` | None (background) | Monitoring, scheduled tasks | Server health checks |

**Interactive mode example:**
```yaml
mode: interactive

# Skill asks for approval at each step:
# "Apply migration 1 of 5? (Y/n)"
# "Deploy to staging? (Y/n)"
# "Deploy to production? (Y/n)"
```

**Batch mode example:**
```yaml
mode: batch

# Processes 1000 files without interruption
# Summarizes results at end
```

**Autonomous mode example:**
```yaml
mode: autonomous

# Runs in background
# Logs issues
# Only notifies on errors
```

---

## Lifecycle Hooks

### `hooks`

**Type**: Array of objects
**Available since**: Claude Code v2.1.0 (January 7, 2026)
**Purpose**: Execute actions at specific skill lifecycle events

```yaml
hooks:
  - event: PreToolUse
    action: validate_environment
  - event: PostToolUse
    action: log_results
  - event: Stop
    action: cleanup_temp_files
```

**Available events:**

| Event | Triggered | Use Case |
|-------|-----------|----------|
| `PreToolUse` | Before any tool execution | Environment validation, prerequisites check |
| `PostToolUse` | After tool execution | Result logging, audit trail |
| `Stop` | On skill termination | Cleanup, save state, close connections |

**Hook actions:**
- Can be script names (e.g., `scripts/validate.sh`)
- Or inline bash commands
- Executed in skill's working directory

**Complete example:**
```yaml
hooks:
  - event: PreToolUse
    action: |
      # Check SSH connection before deployment
      ssh user@server "echo 'Connection OK'" || exit 1

  - event: PostToolUse
    action: scripts/log-audit.py

  - event: Stop
    action: |
      # Cleanup temporary files
      rm -rf /tmp/skill-temp-*
      echo "Cleanup complete"
```

**When to use:**
- SSH/database connection validation (PreToolUse)
- Audit logging for compliance (PostToolUse)
- Temporary file cleanup (Stop)
- State persistence (Stop)

**Performance note**: Hooks add overhead. Use only when necessary.

---

## Triggers (Discovery)

### `triggers`

**Type**: Array of strings
**Recommended**: 10-20 natural language phrases
**Purpose**: Enable semantic skill routing

```yaml
triggers:
  # Keywords (1-2 words)
  - "excel"
  - "report"
  - "graphique"

  # Action phrases (FR + EN)
  - "créer un rapport"
  - "generate report"
  - "make spreadsheet"

  # Problem phrases
  - "I need a report"
  - "comment créer un tableau"
  - "monthly sales data"
```

**Trigger categories (include all 3):**

1. **Keywords**: Core concepts users mention
2. **Action phrases**: What users want to DO (3-5 words)
3. **Problem phrases**: How users describe their PROBLEM

**Best practices:**

✓ **DO:**
- Use natural language ("créer un fichier excel")
- Include French AND English
- Mix keywords, actions, problems
- Think: "How would a user ask for this?"

✗ **DON'T:**
- Use technical jargon ("xlsx manipulation")
- Use only keywords ("excel", "pdf")
- Forget bilingual coverage
- Write more than 50 triggers (diminishing returns)

**Quality guidelines:**

| Count | Quality |
|-------|---------|
| 0-4 | ❌ Insufficient (skill won't be discovered) |
| 5-9 | ⚠️ Minimal (might miss variations) |
| 10-20 | ✓ Optimal (good coverage) |
| 21-50 | ✓ Comprehensive (excellent coverage) |
| 50+ | ⚠️ Overkill (diminishing returns) |

**Testing triggers:**
```bash
python scripts/benchmark-semantic-router.py "créer un rapport excel"
# Should return your skill name
```

---

## Metadata

### `metadata`

**Type**: Object
**Purpose**: Additional skill information (organization, attribution)

```yaml
metadata:
  author: "Julien"
  category: "development"
  keywords: ["excel", "reporting", "analysis"]
  tags: ["data", "business-intelligence"]
  created: "2026-01-11"
  updated: "2026-01-11"
```

**Common fields:**
- `author`: Skill creator
- `category`: Skill type (development, analysis, deployment, etc.)
- `keywords`: Search terms (not triggers - these are for documentation/filtering)
- `tags`: Additional classification
- `created` / `updated`: Timestamps

**When to use:**
- Marketplace distribution
- Team skill management
- Organizational attribution
- Future skill categorization features

---

## Complete Example

Skill combining all 2026 fields:

```yaml
---
name: postgres-database-migrator
description: >
  Executes PostgreSQL database migrations with rollback support and validation.
  Use when updating database schemas, adding tables, or modifying columns.
  Supports multiple environments (dev, staging, production).
version: "2.1.0"
license: Apache-2.0
user-invocable: true
disable-model-invocation: true  # Require explicit /postgres-database-migrator
mode: interactive               # Approval at each step
allowed-tools:
  - Read                        # Read migration files
  - Bash                        # Execute psql
  - AskUserQuestion             # Confirmations
hooks:
  - event: PreToolUse
    action: scripts/validate-db-connection.sh
  - event: PostToolUse
    action: scripts/log-migration.py
  - event: Stop
    action: scripts/cleanup-temp-sql.sh
triggers:
  # Keywords
  - "postgres"
  - "postgresql"
  - "database"
  - "migration"
  - "schema"

  # Action phrases (FR)
  - "migrer la base de données"
  - "mettre à jour le schéma"
  - "ajouter une table"
  - "modifier une colonne"

  # Action phrases (EN)
  - "migrate database"
  - "update schema"
  - "add table"
  - "modify column"

  # Problem phrases
  - "database out of sync"
  - "schema changes needed"
  - "need to update database"
  - "la base n'est pas à jour"
metadata:
  author: "Julien"
  category: "database"
  keywords: ["postgresql", "migration", "drizzle"]
  environments: ["dev", "staging", "production"]
  created: "2026-01-05"
  updated: "2026-01-11"
---
```

---

## Migration Guide

### Adding 2026 Fields to Existing Skills

**Step 1: Add version**
```yaml
version: "1.0.0"  # Start at 1.0.0 or current version
```

**Step 2: Add triggers (CRITICAL)**
```yaml
triggers:
  - existing-trigger-1
  - existing-trigger-2
  # Add 8-18 more natural language triggers
```

**Step 3: Add optional fields as needed**
```yaml
user-invocable: true           # If hidden from menu
disable-model-invocation: true # If manual-only
mode: interactive              # If requires user input
allowed-tools: [Read, Write]   # If security-sensitive
```

**Step 4: Test**
```bash
# Verify YAML parsing
python -c "import yaml; yaml.safe_load(open('SKILL.md').read())"

# Test triggers
python scripts/benchmark-semantic-router.py "trigger phrase"
```

**Step 5: Bump version**
```yaml
version: "1.1.0"  # New fields = minor version bump
```

### Backward Compatibility

**All new fields are optional** - existing skills continue to work:

```yaml
# Minimal valid skill (still works)
---
name: my-skill
description: What it does and when to use it.
---
```

**Progressive enhancement**: Add fields incrementally as needed.

---

## Validation Checklist

Before distributing your skill:

- [ ] `name` ≤ 64 chars, lowercase, hyphens, no reserved words
- [ ] `description` includes "what" + "when", ≤ 1024 chars, third person
- [ ] `triggers` array has 10-20 natural language phrases (FR + EN)
- [ ] `version` follows semantic versioning (MAJOR.MINOR.PATCH)
- [ ] `allowed-tools` lists only necessary tools (if used)
- [ ] `hooks` tested and working (if used)
- [ ] YAML parses without errors
- [ ] Triggers tested with benchmark-semantic-router.py
- [ ] No hardcoded credentials or sensitive data
- [ ] All paths use forward slashes (not Windows backslashes)

**Test command:**
```bash
# Validate YAML syntax
python -c "import yaml; print(yaml.safe_load(open('skills/your-skill/SKILL.md').read().split('---')[1]))"
```

---

## Official Resources

- **Specification**: [agentskills.io/specification](https://agentskills.io)
- **Platform Docs**: [platform.claude.com - Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- **Best Practices**: [Agent Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- **Claude Code Docs**: [code.claude.com - Skills](https://code.claude.com/docs/en/skills)
- **GitHub Repository**: [github.com/anthropics/skills](https://github.com/anthropics/skills)

**Last updated**: January 2026 (Claude Code v2.1.0 release)
