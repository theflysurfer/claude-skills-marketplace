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
├── .claude-plugin/                  # Plugin marketplace configuration
│   ├── marketplace.json             # Marketplace catalog
│   └── plugin.json                  # Plugin manifest
├── skills/                          # All custom skills
│   ├── skill-1/
│   ├── skill-2/
│   └── ...
├── scripts/                         # Automation scripts
│   └── integrate-public-skill.sh    # Import skills from public repos
├── template-skill/                  # Reference template for creating new skills
├── agent_skills_spec.md            # Complete skills specification
├── INTEGRATING_PUBLIC_SKILLS.md    # Guide for integrating external skills
├── .gitignore
└── README.md                       # This file
```

## Quick Start

### Listing Available Resources

Discover all available skills and resources in this marketplace:

```bash
# Basic listing
python scripts/list-resources-v2.py

# Advanced features
python scripts/list-resources-v2.py --stats                    # Show statistics
python scripts/list-resources-v2.py --category infrastructure  # Filter by category
python scripts/list-resources-v2.py --keyword docker           # Filter by keyword
python scripts/list-resources-v2.py --search nginx             # Search query
python scripts/list-resources-v2.py --verbose                  # Detailed view

# Team distribution
python scripts/list-resources-v2.py --export-team-config .claude/settings.json

# Or use the slash command in Claude Code
/list-resources
```

**Features:**
- Schema validation for marketplace.json
- Filter by category, keyword, or source type
- Search functionality
- Statistics and analytics
- Team configuration export
- Keywords/tags display

See [docs/LIST_RESOURCES_GUIDE.md](./docs/LIST_RESOURCES_GUIDE.md) for detailed usage and [docs/BEST_PRACTICES.md](./docs/BEST_PRACTICES.md) for marketplace best practices.

### Creating a New Skill

```bash
# 1. Copy the template
cp -r template-skill skills/my-new-skill

# 2. Edit the SKILL.md file
# Modify the YAML frontmatter and instructions

# 3. Test the skill
claude skill install ./skills/my-new-skill
```

### Integrating Public Skills

You can integrate skills from public marketplaces (Anthropic, community repositories) :

```bash
# Integrate a skill from Anthropic's official repository
./scripts/integrate-public-skill.sh frontend-design

# From a custom repository
./scripts/integrate-public-skill.sh -s https://github.com/user/repo -n custom-skill skill-name
```

See [INTEGRATING_PUBLIC_SKILLS.md](./INTEGRATING_PUBLIC_SKILLS.md) for detailed guide.

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

### Method 1: Add to Claude Code (Recommended)

```bash
# Add the marketplace from GitHub
/plugin marketplace add theflysurfer/claude-skills-marketplace

# Or add from local path during development
/plugin marketplace add /path/to/this/repo
```

### Method 2: Team Distribution (extraKnownMarketplaces)

For automatic marketplace installation across your team:

1. **Generate the team config:**
   ```bash
   python scripts/list-resources-v2.py --export-team-config .claude/settings.json
   ```

2. **Add to your project's `.claude/settings.json`:**
   ```json
   {
     "extraKnownMarketplaces": [
       {
         "name": "claude-skills-marketplace",
         "url": "https://github.com/theflysurfer/claude-skills-marketplace"
       }
     ]
   }
   ```

3. **Commit to version control:**
   ```bash
   git add .claude/settings.json
   git commit -m "Add Claude Code marketplace configuration"
   ```

When team members clone the repository and trust it in Claude Code, the marketplace will be automatically available.

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

### Alternative Methods

#### With Claude.ai
Skills can be uploaded directly to Claude.ai (paid plans).

#### With Claude API
Deploy via Skills API for production applications.

#### Direct Installation (Without Marketplace)
```bash
# Clone the repository
git clone https://github.com/theflysurfer/claude-skills-marketplace.git

# Install a specific skill
claude skill install ./claude-skills-marketplace/skills/<skill-name>
```

## Available Skills

### Custom Skills (Proprietary)

| Skill | Description | Category |
|-------|-------------|----------|
| sync-personal-skills | Sync skills to ~/.claude/skills/ and push to GitHub | development |
| hostinger-ssh | SSH management for Hostinger VPS srv759970 | infrastructure |
| hostinger-docker | Docker container management on Hostinger VPS | infrastructure |
| hostinger-nginx | Nginx reverse proxy and SSL management | infrastructure |
| hostinger-database | Database management (PostgreSQL, Redis, MongoDB) | infrastructure |
| hostinger-maintenance | Recurring maintenance and cleanup tasks | operations |
| hostinger-space-reclaim | Disk space analysis and reclamation | operations |

### Integrated Public Skills (from Anthropic)

#### Development Tools
| Skill | Description | Category |
|-------|-------------|----------|
| frontend-design | Create distinctive, production-grade frontend interfaces | development |
| mcp-builder | Create MCP servers to integrate external APIs with Claude | development |
| webapp-testing | Test web applications with Playwright (screenshots, logs, debugging) | development |
| web-artifacts-builder | Build interactive web prototypes and demos quickly | development |
| skill-creator | Official Anthropic guide for creating effective skills | development |

#### Productivity Suite (Office)
| Skill | Description | Category |
|-------|-------------|----------|
| pdf | PDF manipulation toolkit (extract, create, merge, split, forms) | productivity |
| xlsx | Excel spreadsheet creation, editing, formulas, data analysis | productivity |
| docx | Word document creation, editing, tracked changes, comments | productivity |
| pptx | PowerPoint presentation creation, editing, layouts, speaker notes | productivity |

#### Design & Creative
| Skill | Description | Category |
|-------|-------------|----------|
| canvas-design | Design visual art, posters, and infographics (.png, .pdf) | design |

All integrated skills are from [Anthropic's official repository](https://github.com/anthropics/skills) (Apache-2.0 license)

### Enhanced Skills (Based on Anthropic)

| Skill | Description | Category |
|-------|-------------|----------|
| skill-creator-pro | Enhanced skill-creator with Skill Chaining documentation framework | development |

**skill-creator-pro** adds comprehensive workflow documentation including Input/Output specs, visual diagrams, bidirectional skill relationships, and Git hooks integration. Perfect for creating skills that are part of larger workflows.

## Resources

- [Official Claude Skills Documentation](https://docs.anthropic.com/claude/docs/skills)
- [Official Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Skills Specification](./agent_skills_spec.md)

## License

This repository is under Apache 2.0 license, unless otherwise stated in individual skills.

---

**Built with** [Claude Code](https://claude.com/claude-code)
