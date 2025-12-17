---
name: skill-reviewer
description: Reviews Claude skills against Anthropic's official design philosophy and specifications. Use when asked to review, validate, or check if a skill follows best practices.
allowed-tools: Read, WebFetch
---

# Skill Reviewer

Reviews skills against Anthropic's official standards from github.com/anthropics/skills.

## When to Use

- User asks to review a skill
- User wants to validate skill structure
- User asks if skill follows best practices
- After creating/modifying a skill

## Review Criteria

### 1. YAML Frontmatter (Required)

**name**:
- Lowercase with hyphens (hyphen-case)
- Matches parent directory name
- Unicode alphanumeric characters only

**description**:
- 100-150 characters (concise for progressive disclosure)
- Explains WHAT the skill does
- Clarifies WHEN to activate it
- Functional, not marketing tone

**allowed-tools** (optional):
- Lists pre-approved tools
- Only if skill needs specific tool access

### 2. Content Philosophy

**Focused scope**:
- Single, well-defined purpose
- Not trying to cover too much
- Specific workflow or task

**Concise instructions**:
- 100-200 lines ideal (not 300+)
- Focus on "what Claude needs to execute"
- Reference external docs for context

**Progressive disclosure**:
- Claude sees name + description first
- Decides relevance before loading full content
- Only loads what's needed, when needed

### 3. Structure Best Practices

**Clear sections**:
- Variables/inputs clearly defined
- Step-by-step workflow if procedural
- Examples when helpful (not required)

**References over duplication**:
- Link to comprehensive docs
- Don't repeat what exists elsewhere
- Keep DRY (Don't Repeat Yourself)

**Operational focus**:
- Instructions Claude follows
- Not meta-commentary about development
- Remove version history, changelog, timestamps

### 4. Anti-Patterns to Flag

❌ **Description too long** (>200 chars)
❌ **Too much detail** (300+ lines)
❌ **Duplicates existing docs** (should reference instead)
❌ **Development notes** in content (timestamps, "validated on...", changelog)
❌ **Generic/vague description** (doesn't explain when to use)
❌ **Mixed language** without clear reason
❌ **Overly complex** (trying to do too much)
❌ **Hardcoded credentials** (passwords, API keys, tokens, database credentials)
❌ **Sensitive data in examples** (should use placeholders or `.env` variables)
❌ **Absolute paths** in examples (`/home/user/...`, `C:\Users\...`)
❌ **Platform-specific paths** (Windows-only or Unix-only)

## Review Output Format

```markdown
## Skill Review: {{SKILL_NAME}}

### ✅ Strengths
- [List what follows best practices]

### ⚠️ Issues Found
- [List problems with severity]

### 📋 Recommendations
- [Specific actionable improvements]

### Metrics
- Description length: {{X}} chars (target: 100-150)
- Content length: {{Y}} lines (target: 100-200)
- YAML valid: Yes/No
- References docs: Yes/No
- Hardcoded credentials: Yes/No (should be No)
- Uses relative paths: Yes/No (should be Yes)
```

## Reference Documentation

- **Official spec**: github.com/anthropics/skills/agent_skills_spec.md
- **Template**: github.com/anthropics/skills/template-skill
- **Examples**: github.com/anthropics/skills (algorithmic-art, brand-guidelines, etc.)

## Process

1. Read the SKILL.md file
2. Check YAML frontmatter against spec
3. Analyze description (length, clarity, activation triggers)
4. Review content (length, focus, structure)
5. **Scan for security issues** (hardcoded passwords, API keys, tokens)
6. Identify anti-patterns
7. Generate review with specific recommendations

## Security Checks

Search skill content for:
- **Passwords**: `password=`, `-p`, `PASSWORD=`
- **API keys**: `api_key=`, `API_KEY=`, `token=`
- **Database credentials**: `mysql -u USER -pPASSWORD`, `postgresql://user:pass@`
- **Tokens**: `Bearer`, `OAuth`, `JWT`

**Recommendation if found**:
- Move credentials to `.env` file
- Use environment variables (`$VAR_NAME` or `source .env`)
- Add `.env` to `.gitignore`
- Document `.env` structure in skill's Environment Variables section

## Portability Checks

Search skill content for:
- **Absolute paths**: `/home/username/`, `/Users/username/`, `C:\Users\`
- **Platform-specific**: Windows paths (`C:\`, backslashes), Unix-only commands
- **Hardcoded usernames**: Specific user directories in examples

**Recommendation if found**:
- Use relative paths: `.env`, `./scripts/`, `~/` for home directory
- Use platform-agnostic examples or provide both Unix/Windows versions
- Use `~/.claude/skills/` instead of `/home/user/.claude/skills/`
- Replace absolute paths with placeholders: `{{PROJECT_ROOT}}`, `{{HOME}}`
