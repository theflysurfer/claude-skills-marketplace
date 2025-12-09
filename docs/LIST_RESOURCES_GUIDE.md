# List Resources Guide

This guide explains how to use the generic resource listing tool for Claude Code marketplaces and projects.

## Overview

The `list-resources` command/script provides a unified way to discover and explore:
- Skills available in a marketplace
- Local skills in a project
- Installation instructions based on context
- Metadata about resources (version, license, category, etc.)

**Version 2 Features** (Enhanced):
- Schema validation
- Advanced filtering (category, keyword, source type, search)
- Statistics and analytics
- Team configuration export
- Keywords/tags display
- Source type detection

## Usage

### Method 1: Python Script v2 (Recommended)

Run directly from the command line:

```bash
# Basic listing
python scripts/list-resources-v2.py

# With filters
python scripts/list-resources-v2.py --category infrastructure
python scripts/list-resources-v2.py --keyword docker
python scripts/list-resources-v2.py --search nginx

# Show statistics
python scripts/list-resources-v2.py --stats

# Verbose mode
python scripts/list-resources-v2.py --verbose

# Export team config
python scripts/list-resources-v2.py --export-team-config .claude/settings.json
```

### Method 2: Python Script v1 (Basic)

For simple listing without filters:

```bash
python scripts/list-resources.py
```

This works on all platforms (Windows, macOS, Linux).

### Method 2: Bash Script (Linux/macOS)

```bash
./scripts/list-resources.sh
```

### Method 3: Slash Command (Claude Code)

Within Claude Code, use the slash command:

```
/list-resources
```

## What It Shows

### For Marketplace Repositories

When run in a marketplace repository (with `.claude-plugin/marketplace.json`):

- **Marketplace Information**: Name, version, owner, description, total count
- **Skills by Category**: Organized tables showing:
  - Skill name
  - Description
  - Version
  - License
  - Source (original/anthropic/enhanced)
- **Installation Instructions**: How to add the marketplace and install skills

### For Projects with Local Skills

When run in a project with `skills/` or `.claude/skills/` directory:

- **Local Skills**: Table showing all locally available skills
- **Usage Instructions**: How to install and use these skills

### For Projects Using a Marketplace

The script works in both the marketplace repository AND in projects that have downloaded skills from the marketplace.

## Integration in Your Project

### Step 1: Copy the Scripts

Copy these files to your project:

```bash
# Copy the Python script (recommended)
cp scripts/list-resources.py YOUR_PROJECT/scripts/

# Copy the bash script (optional)
cp scripts/list-resources.sh YOUR_PROJECT/scripts/
```

### Step 2: Copy the Slash Command (Optional)

```bash
# Create .claude/commands directory if it doesn't exist
mkdir -p YOUR_PROJECT/.claude/commands

# Copy the slash command
cp .claude/commands/list-resources.md YOUR_PROJECT/.claude/commands/
```

### Step 3: Make Scripts Executable

```bash
chmod +x YOUR_PROJECT/scripts/list-resources.py
chmod +x YOUR_PROJECT/scripts/list-resources.sh
```

### Step 4: Use It

```bash
# From your project root
python scripts/list-resources.py
```

## Example Output

```
=== Available Resources ===

✓ Marketplace detected

✓ Local skills directory found: skills/

## Marketplace Information

  Name: claude-skills-marketplace
  Version: 1.0.0
  Owner: Julien
  Description: Personal marketplace for developing and sharing custom Claude skills
  Total Skills: 19

## Skills by Category

### Development

| Name | Description | Version | License | Source |
|------|-------------|---------|---------|--------|
| skill-creator-pro | Enhanced skill-creator with Skill Chaining docs | 1.0.0 | Apache-2.0 | enhanced |
| frontend-design | Create production-grade frontend interfaces | 1.0.0 | Apache-2.0 | anthropic |

### Infrastructure

| Name | Description | Version | License | Source |
|------|-------------|---------|---------|--------|
| hostinger-docker | Docker container management on Hostinger VPS | 1.0.0 | Apache-2.0 | original |
| hostinger-nginx | Nginx reverse proxy and SSL management | 1.0.0 | Apache-2.0 | original |

## Usage Instructions

Installing from this marketplace:
  1. Add marketplace to Claude Code:
     /plugin marketplace add <github-url-or-local-path>

  2. Browse available plugins:
     /plugin

  3. Install a skill:
     /plugin install <skill-name>

=== End of Resources List ===
```

## Features

- **Cross-platform**: Works on Windows, macOS, and Linux
- **Context-aware**: Detects marketplace vs. project structure
- **Formatted output**: Color-coded, organized tables
- **Comprehensive**: Shows all metadata from marketplace.json
- **Easy integration**: Copy and use in any project

## Requirements

- Python 3.6+ (for Python script)
- Bash (for shell script, Linux/macOS only)

## Troubleshooting

### "No marketplace or skills directory found"

This means you're running the script in a directory that:
- Doesn't have `.claude-plugin/marketplace.json` (not a marketplace)
- Doesn't have `skills/` or `.claude/skills/` directory (no local skills)

**Solution**: Navigate to your marketplace or project root directory before running.

### Colors not showing in Windows CMD

Windows CMD may not support ANSI color codes by default.

**Solutions**:
- Use PowerShell instead of CMD
- Use Windows Terminal
- Use Git Bash
- The script will still work, just without colors

### Slash command not recognized

The slash command requires Claude Code to recognize `.claude/commands/` directory.

**Solution**: Ensure:
- The file is named correctly: `.claude/commands/list-resources.md`
- The YAML frontmatter is valid
- You're running Claude Code in the directory containing `.claude/`

## Customization

### Modifying the Script

You can customize `scripts/list-resources.py` to:
- Change the output format
- Add additional metadata fields
- Filter skills by criteria
- Export to different formats (JSON, CSV, etc.)

### Example: Export to JSON

Add this function to `list-resources.py`:

```python
def export_json(data: Dict, filename: str = "resources.json"):
    """Export resources to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Exported to {filename}")
```

## See Also

- [Claude Skills Documentation](https://docs.anthropic.com/claude/docs/skills)
- [INTEGRATING_PUBLIC_SKILLS.md](../INTEGRATING_PUBLIC_SKILLS.md)
- [MARKETPLACE_GUIDE.md](../MARKETPLACE_GUIDE.md)

## License

This script is provided under the Apache-2.0 license, same as the marketplace.
