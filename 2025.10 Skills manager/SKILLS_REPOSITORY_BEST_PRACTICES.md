# Skills Repository - Best Practices & Organization

**Date:** 2025-10-30
**Source:** Claude Official Documentation + Community Best Practices

## Overview

This document outlines best practices for organizing and maintaining a repository of Claude Code skills, based on official Anthropic guidelines and community standards.

---

## Repository Structure

### Recommended Directory Layout

```
my-skills-repository/
├── README.md                    # Overview, installation, skill list
├── SKILLS_MARKETPLACE.md        # Marketplace/distribution guide
├── CONTRIBUTING.md              # Guidelines for adding skills
├── .gitignore                   # Ignore logs, temp files
│
├── skills/                      # Main skills directory
│   ├── windows/                 # Category: Windows utilities
│   │   ├── delete-reserved-names/
│   │   │   ├── SKILL.md        # Main skill file (required)
│   │   │   ├── config.json     # Configuration metadata
│   │   │   ├── README.md       # User documentation
│   │   │   └── scripts/        # Supporting scripts
│   │   │       └── delete-nul-gitbash.sh
│   │   │
│   │   └── onedrive-sync-fix/  # Another Windows skill
│   │       └── SKILL.md
│   │
│   ├── development/             # Category: Development tools
│   │   ├── code-reviewer/
│   │   │   └── SKILL.md
│   │   └── test-generator/
│   │       └── SKILL.md
│   │
│   ├── automation/              # Category: Automation
│   │   └── task-scheduler/
│   │       └── SKILL.md
│   │
│   └── documentation/           # Category: Documentation
│       └── readme-generator/
│           └── SKILL.md
│
├── templates/                   # Skill templates
│   ├── basic-skill-template/
│   │   ├── SKILL.md.template
│   │   └── config.json.template
│   └── advanced-skill-template/
│       └── SKILL.md.template
│
└── docs/                        # Additional documentation
    ├── installation.md
    ├── skill-authoring-guide.md
    └── troubleshooting.md
```

---

## Skill Organization Principles

### 1. One Skill = One Capability

**DO:**
- `delete-reserved-names` - Deletes Windows reserved filenames
- `onedrive-sync-fix` - Fixes OneDrive sync issues
- `git-commit-helper` - Helps write better git commits

**DON'T:**
- `windows-utilities` - Too broad, combines unrelated functions
- `fix-everything` - Unclear scope

### 2. Clear Categorization

Organize skills into logical categories:

**Categories by Domain:**
- `windows/` - Windows-specific utilities
- `development/` - Development tools
- `automation/` - Task automation
- `documentation/` - Documentation generation
- `security/` - Security tools
- `data/` - Data processing
- `creative/` - Creative tools
- `enterprise/` - Enterprise workflows

**Categories by Language:**
- `python-tools/`
- `javascript-tools/`
- `bash-scripts/`

**Categories by Framework:**
- `django-helpers/`
- `react-tools/`
- `nodejs-utilities/`

Choose one organizational scheme and stick to it consistently.

### 3. Naming Conventions

**Skill Directory Names:**
- Use lowercase with hyphens: `delete-reserved-names`
- Be descriptive: `onedrive-sync-fix` not `fix-sync`
- Avoid redundant prefixes: `git-commit-helper` not `skill-git-commit-helper`

**File Names:**
- Required: `SKILL.md` (uppercase, exact spelling)
- Optional: `README.md`, `config.json`
- Scripts: lowercase with extensions: `delete-nul-gitbash.sh`

---

## Essential Files for Each Skill

### 1. SKILL.md (Required)

The main instruction file for Claude.

**Structure:**
```markdown
---
name: skill-identifier
description: Clear description of what this does and when to use it
---

# Skill Title

## Instructions for Claude

Step-by-step instructions that Claude follows.

### Step 1: Do this
[Clear instructions]

### Step 2: Then do this
[Clear instructions]

## Example Commands

```bash
command example here
```

## When to Use This Skill

- Trigger phrase 1
- Trigger phrase 2

## Requirements

- Tool 1
- Tool 2
```

**Key Components:**
- YAML frontmatter with `name` and `description`
- Clear instructions for Claude (not just for humans)
- Example commands and code snippets
- Trigger phrases
- Requirements

### 2. config.json (Recommended)

Structured metadata about the skill.

**Example:**
```json
{
  "name": "skill-identifier",
  "version": "1.0.0",
  "description": "Skill description",
  "author": "Your Name",
  "created": "2025-10-30",
  "updated": "2025-10-30",
  "tags": ["tag1", "tag2"],
  "triggers": ["phrase1", "phrase2"],
  "requirements": {
    "tools": ["bash", "git"],
    "platforms": ["windows", "linux"]
  },
  "tools": ["Bash", "Read", "Write"],
  "workflow": [
    {
      "step": 1,
      "action": "First action",
      "command": "command here"
    }
  ]
}
```

### 3. README.md (Recommended)

User-facing documentation.

**Structure:**
```markdown
# Skill Name

## Quick Start

How to use this skill in 2 sentences.

## What This Skill Does

Detailed explanation.

## Installation

### Local (This Project Only)
```bash
# Already included
```

### Global (All Projects)
```bash
cp -r .claude/skills/skill-name ~/.claude/skills/
```

## Usage

Trigger phrases and examples.

## Requirements

What's needed to use this skill.

## Troubleshooting

Common issues and solutions.

## Version History

- 1.0.0 (2025-10-30) - Initial release
```

### 4. Supporting Files (Optional)

**Scripts:**
```
scripts/
├── helper-script.sh
├── automation.py
└── utilities.js
```

**Templates:**
```
templates/
├── config-template.json
└── output-template.md
```

**Resources:**
```
resources/
├── data.csv
└── reference.pdf
```

---

## Repository Root Files

### README.md

**Must Include:**
- Repository purpose
- List of all skills with brief descriptions
- Installation instructions (local vs global)
- Quick start guide
- Link to detailed docs

**Example:**
```markdown
# My Claude Skills Collection

A collection of reusable Claude Code skills for [your domain].

## Available Skills

### Windows Utilities
- **delete-reserved-names** - Delete Windows reserved filenames (NUL, CON, etc.)
- **onedrive-sync-fix** - Fix OneDrive synchronization issues

### Development Tools
- **code-reviewer** - Automated code review with best practices
- **test-generator** - Generate unit tests from code

## Quick Install

### Install All Skills (Global)
```bash
cp -r skills/* ~/.claude/skills/
```

### Install Single Skill
```bash
cp -r skills/windows/delete-reserved-names ~/.claude/skills/
```

### Use as Project Skills
```bash
git clone <repo-url> my-project
cd my-project
# Skills in .claude/skills/ are auto-detected
```

## Documentation

- [Installation Guide](docs/installation.md)
- [Skill Authoring Guide](docs/skill-authoring-guide.md)
- [Troubleshooting](docs/troubleshooting.md)
```

### CONTRIBUTING.md

Guidelines for adding new skills:

```markdown
# Contributing Skills

## Skill Submission Checklist

- [ ] Skill has clear, focused purpose
- [ ] SKILL.md includes YAML frontmatter
- [ ] Description is specific and trigger-rich
- [ ] Instructions are clear for Claude
- [ ] Examples are provided
- [ ] README.md documents user-facing info
- [ ] config.json has complete metadata
- [ ] Skill is categorized correctly
- [ ] Skill is tested and works
- [ ] No sensitive data in files

## File Structure Required

```
category/skill-name/
├── SKILL.md        (required)
├── config.json     (recommended)
└── README.md       (recommended)
```

## Naming Conventions

- Directory: `lowercase-with-hyphens`
- SKILL.md: exactly `SKILL.md` (uppercase)
- Other files: `lowercase-readme.md`

## Testing Your Skill

1. Install locally: `cp -r your-skill ~/.claude/skills/`
2. Open Claude Code
3. Test trigger phrases
4. Verify Claude activates the skill
5. Confirm expected behavior
```

### .gitignore

```
# Logs
*.log
logs/

# Temporary files
*.tmp
temp/
.DS_Store

# IDE
.vscode/
.idea/

# User-specific
.env
credentials.json

# Test outputs
test-output/
```

---

## Distribution Methods

### Method 1: Git Repository (Recommended)

**Setup:**
```bash
# Users clone your repo
git clone https://github.com/yourusername/my-claude-skills.git

# Install skills globally
cd my-claude-skills
cp -r skills/* ~/.claude/skills/

# Or use as project skills
# Skills in .claude/skills/ are auto-detected when project is opened
```

**Advantages:**
- Version control
- Easy updates (`git pull`)
- Community contributions via PRs
- Issue tracking

### Method 2: Claude Code Marketplace (Plugin System)

**Setup:**
```markdown
In Claude Code:
/plugin marketplace add yourusername/my-claude-skills
/plugin install skill-bundle@your-marketplace
```

**Requirements:**
- Repository on GitHub
- Proper plugin configuration
- Marketplace metadata

**Advantages:**
- Native integration
- Automatic updates
- Discoverability

### Method 3: Manual Distribution

**Setup:**
- Share zip file
- Users extract to `~/.claude/skills/`

**Advantages:**
- Simple for small teams
- No git required
- Works offline

---

## Versioning Best Practices

### Semantic Versioning

Use semver for skills: `MAJOR.MINOR.PATCH`

**Example:**
- `1.0.0` - Initial release
- `1.1.0` - Added new feature
- `1.1.1` - Bug fix
- `2.0.0` - Breaking change

### Version Documentation

**In config.json:**
```json
{
  "version": "2.0.0",
  "created": "2025-10-29",
  "updated": "2025-10-30",
  "changelog": "Added OneDrive restart step"
}
```

**In SKILL.md:**
```markdown
---
name: skill-name
version: 2.0.0
description: Skill description
---
```

**In README.md:**
```markdown
## Version History

### 2.0.0 (2025-10-30)
- Added automatic OneDrive restart
- Improved error handling
- Breaking: Changed command syntax

### 1.0.0 (2025-10-29)
- Initial release
```

---

## Skill Quality Checklist

### Before Publishing

- [ ] **Focused**: One skill = one capability
- [ ] **Named well**: Descriptive, lowercase-with-hyphens
- [ ] **Documented**: SKILL.md with clear instructions
- [ ] **Metadata**: config.json with complete info
- [ ] **User docs**: README.md for end users
- [ ] **Examples**: Include example commands/usage
- [ ] **Triggers**: Clear trigger phrases in description
- [ ] **Tested**: Verified working in Claude Code
- [ ] **Categorized**: In appropriate directory
- [ ] **Versioned**: Semantic version number
- [ ] **Safe**: No credentials or sensitive data
- [ ] **Portable**: Works across systems (if applicable)

### During Maintenance

- [ ] **Update version** on changes
- [ ] **Update changelog** with changes
- [ ] **Update docs** to reflect changes
- [ ] **Test** after each update
- [ ] **Tag releases** in git

---

## Security Best Practices

### Do Not Include

- Passwords or API keys
- Credentials files
- Personal paths (use variables)
- Company-specific data
- Sensitive information

### Use Environment Variables

**Bad:**
```bash
API_KEY="sk-1234567890abcdef"
```

**Good:**
```bash
API_KEY="${OPENAI_API_KEY}"
```

### Document Requirements

```markdown
## Requirements

- Environment variable: `GITHUB_TOKEN`
- File: `~/.config/app/credentials.json`
- Tool: Git Bash (install from git-scm.com)
```

---

## Marketplace Setup (Advanced)

### Plugin Bundle Configuration

If you want to create a marketplace:

**File:** `.claude/marketplace.json`
```json
{
  "name": "my-skills-marketplace",
  "version": "1.0.0",
  "description": "Collection of productivity skills",
  "author": "Your Name",
  "url": "https://github.com/yourusername/my-claude-skills",
  "plugins": [
    {
      "id": "windows-utilities",
      "name": "Windows Utilities Bundle",
      "description": "Windows system utilities",
      "skills": [
        "skills/windows/delete-reserved-names",
        "skills/windows/onedrive-sync-fix"
      ]
    },
    {
      "id": "dev-tools",
      "name": "Development Tools Bundle",
      "description": "Development productivity tools",
      "skills": [
        "skills/development/code-reviewer",
        "skills/development/test-generator"
      ]
    }
  ]
}
```

### Installation Commands

Users install via:
```
/plugin marketplace add yourusername/my-claude-skills
/plugin install windows-utilities@my-skills-marketplace
```

---

## Testing & Validation

### Manual Testing

1. **Install skill locally:**
   ```bash
   cp -r your-skill ~/.claude/skills/
   ```

2. **Open Claude Code**

3. **Test triggers:**
   - Say trigger phrases
   - Verify skill activates
   - Check Claude follows instructions

4. **Test edge cases:**
   - Missing files
   - Invalid inputs
   - Error conditions

### Team Testing

- Have colleagues test
- Gather feedback on clarity
- Verify cross-platform compatibility
- Check for confusing instructions

---

## Real-World Examples

### Example 1: Simple Single-File Skill

```
skills/
└── quick-commit/
    └── SKILL.md
```

**When to use:** Very simple skill, no scripts needed.

### Example 2: Complex Multi-File Skill

```
skills/
└── project-scaffolder/
    ├── SKILL.md
    ├── config.json
    ├── README.md
    ├── scripts/
    │   ├── scaffold.py
    │   └── validate.sh
    └── templates/
        ├── package.json.template
        └── README.md.template
```

**When to use:** Complex skill with supporting files.

### Example 3: Skill Collection Repository

```
my-claude-skills/
├── README.md
├── CONTRIBUTING.md
├── LICENSE
├── skills/
│   ├── windows/
│   │   ├── delete-reserved-names/
│   │   └── onedrive-sync-fix/
│   ├── development/
│   │   ├── code-reviewer/
│   │   └── test-generator/
│   └── automation/
│       └── task-scheduler/
├── templates/
│   └── basic-skill-template/
└── docs/
    ├── installation.md
    └── skill-authoring-guide.md
```

**When to use:** Sharing multiple skills, team/community use.

---

## Community Resources

### Official Resources

- **Claude Docs:** https://docs.claude.com/en/docs/claude-code/skills
- **Official Skills Repo:** https://github.com/anthropics/skills
- **Best Practices:** https://www.anthropic.com/engineering/claude-code-best-practices

### Community Resources

- **Awesome Claude Skills:** https://github.com/travisvn/awesome-claude-skills
- **Superpowers Library:** https://github.com/obra/superpowers

---

## Quick Reference

### Skill File Requirements

| File | Required? | Purpose |
|------|-----------|---------|
| `SKILL.md` | ✅ Required | Main instructions for Claude |
| `config.json` | ⭐ Recommended | Structured metadata |
| `README.md` | ⭐ Recommended | User documentation |
| `scripts/` | ➖ Optional | Supporting scripts |
| `templates/` | ➖ Optional | Template files |
| `resources/` | ➖ Optional | Supporting resources |

### Installation Paths

| Path | Type | Scope |
|------|------|-------|
| `~/.claude/skills/` | Personal | All projects |
| `.claude/skills/` | Project | Current project only |
| Plugin marketplace | Marketplace | Installable bundles |

### Good Skill Names

✅ `delete-reserved-names`
✅ `onedrive-sync-fix`
✅ `git-commit-helper`
✅ `code-reviewer`

❌ `utility` (too vague)
❌ `fix-everything` (too broad)
❌ `Skill-Windows-Utils` (wrong format)
❌ `skill_name` (use hyphens not underscores)

---

## Conclusion

Following these best practices ensures your skills are:
- **Discoverable**: Clear names and descriptions
- **Maintainable**: Organized structure, versioned
- **Reusable**: Portable, well-documented
- **Shareable**: Git-based, marketplace-ready
- **Professional**: Consistent, tested, secure

Start with simple single-file skills, then graduate to complex multi-file skills as needed.

Happy skill building!

---

**Last Updated:** 2025-10-30
**Version:** 1.0.0
**Author:** Claude Code
