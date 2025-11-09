# Claude Skills Marketplace

Personal marketplace for developing and sharing **Claude Skills** - folders containing instructions, scripts, and resources that dynamically enhance Claude's capabilities for specialized tasks.

## What is a Skill?

A Claude skill is a set of instructions and resources that enable Claude to:
- Complete specific tasks in a repeatable way
- Follow organization-specific workflows
- Automate personal or professional tasks
- Create documents following brand guidelines
- Analyze data according to specific methodologies

## Repository Structure

```
marketplace/
├── .claude-plugin/         # Plugin marketplace configuration
│   ├── marketplace.json    # Marketplace catalog
│   └── plugin.json         # Plugin manifest
├── skills/                 # All custom skills
│   ├── skill-1/
│   ├── skill-2/
│   └── ...
├── template-skill/         # Reference template for creating new skills
├── agent_skills_spec.md   # Complete skills specification
├── .gitignore
└── README.md              # This file
```

## Quick Start

### Creating a New Skill

```bash
# 1. Copy the template
cp -r template-skill skills/my-new-skill

# 2. Edit the SKILL.md file
# Modify the YAML frontmatter and instructions

# 3. Test the skill
claude skill install ./skills/my-new-skill
```

### Minimal Skill Structure

```markdown
---
name: my-skill
description: Clear description of what the skill does and when to use it
---

# Instructions

Place your detailed instructions here in Markdown.
```

## YAML Properties

### Required
- **name**: Identifier in kebab-case (lowercase and hyphens only)
- **description**: Explanation of the skill's purpose and appropriate use cases

### Optional
- **license**: License information
- **allowed-tools**: List of pre-approved tools (Claude Code support)
- **metadata**: Custom key-value pairs

## Installing the Marketplace

### Add This Marketplace to Claude Code

```bash
# Add the marketplace from GitHub
/plugin marketplace add theflysurfer/claude-skills-marketplace

# Or add from local path during development
/plugin marketplace add /path/to/this/repo
```

### Installing Skills from the Marketplace

Once the marketplace is added:

```bash
# Browse available plugins
/plugin

# Install a skill from this marketplace
/plugin install skill-name

# List installed skills
claude skill list

# Use a skill
/skill-name
```

### With Claude.ai
Skills can be uploaded directly to Claude.ai (paid plans).

### With Claude API
Deploy via Skills API for production applications.

## Available Skills

| Skill | Description | Status |
|-------|-------------|--------|
| *In development* | - | - |

## Resources

- [Official Claude Skills Documentation](https://docs.anthropic.com/claude/docs/skills)
- [Official Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Skills Specification](./agent_skills_spec.md)

## License

This repository is under Apache 2.0 license, unless otherwise stated in individual skills.

---

**Built with** [Claude Code](https://claude.com/claude-code)
