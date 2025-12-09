# Installation Guide

Complete guide for installing and using this Claude Code marketplace.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [For Teams](#for-teams)

## Prerequisites

- Claude Code CLI installed
- Git (for cloning the repository)
- Python 3.6+ (for validation and listing scripts)

### Installing Claude Code

If you haven't installed Claude Code yet:

```bash
# Install via npm (if available)
npm install -g claude-code

# Or follow official instructions at:
# https://code.claude.com/docs
```

## Installation Methods

### Method 1: Via Claude Code Plugin System (Recommended)

This is the easiest method for end users.

```bash
# Open Claude Code
claude

# Add the marketplace
/plugin marketplace add theflysurfer/claude-skills-marketplace

# Browse available skills
/plugin

# Install a specific skill
/plugin install skill-name
```

### Method 2: Team Distribution (extraKnownMarketplaces)

Best for teams who want automatic marketplace installation.

#### Step 1: Generate Team Configuration

```bash
# Clone this repository
git clone https://github.com/theflysurfer/claude-skills-marketplace.git
cd claude-skills-marketplace

# Generate the configuration
python scripts/list-resources-v2.py --export-team-config .claude/settings.json
```

#### Step 2: Add to Your Project

Copy the generated `.claude/settings.json` to your project's root:

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

#### Step 3: Commit and Share

```bash
# In your project
git add .claude/settings.json
git commit -m "feat: add Claude Code marketplace configuration"
git push
```

When team members:
1. Clone the repository
2. Open it in Claude Code
3. Trust the folder in the interactive trust dialog

The marketplace will be automatically available.

### Method 3: Direct Clone and Install

For development or testing individual skills without the marketplace.

```bash
# Clone the repository
git clone https://github.com/theflysurfer/claude-skills-marketplace.git
cd claude-skills-marketplace

# Browse available skills
python scripts/list-resources-v2.py

# Install a specific skill
claude skill install ./skills/skill-name

# Or use the full path for skills with prefixes
claude skill install ./skills/julien-infra-hostinger-nginx
```

### Method 4: Local Marketplace Development

For marketplace maintainers or contributors.

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/claude-skills-marketplace.git
cd claude-skills-marketplace

# Add as local marketplace
/plugin marketplace add /absolute/path/to/claude-skills-marketplace

# Test changes
python scripts/validate-marketplace.py
python scripts/list-resources-v2.py --stats
```

## Verification

### Verify Installation

```bash
# List all marketplaces
/plugin marketplace list

# Should show: claude-skills-marketplace

# List skills from this marketplace
/plugin list
```

### Verify Skills

```bash
# List installed skills
claude skill list

# Test a skill (example)
/hostinger-nginx
```

### Verify with Scripts

```bash
# Navigate to marketplace directory
cd claude-skills-marketplace

# Run validation
python scripts/validate-marketplace.py

# List all resources
python scripts/list-resources-v2.py

# Show statistics
python scripts/list-resources-v2.py --stats

# Filter by category
python scripts/list-resources-v2.py --category infrastructure
```

## Troubleshooting

### Marketplace Not Found

**Problem:** Claude Code can't find the marketplace

**Solutions:**
- Verify the GitHub URL is correct: `https://github.com/theflysurfer/claude-skills-marketplace`
- Check your internet connection
- Try removing and re-adding: `/plugin marketplace remove claude-skills-marketplace` then add again

### Skills Not Appearing

**Problem:** Skills from marketplace don't appear in `/plugin` list

**Solutions:**
- Refresh the marketplace: `/plugin marketplace refresh`
- Check marketplace.json is valid: `python scripts/validate-marketplace.py`
- Verify you've trusted the marketplace in the interactive dialog

### Permission Denied

**Problem:** Permission denied when installing skills

**Solutions:**
- Check file permissions: `ls -la .claude-plugin/`
- Ensure you have write access to `~/.claude/skills/`
- On Windows, run as Administrator if necessary

### Validation Fails

**Problem:** `validate-marketplace.py` reports errors

**Solutions:**
- Check the error messages for specific issues
- Verify all skill folders exist: `ls skills/`
- Ensure marketplace.json syntax is valid: `python -m json.tool .claude-plugin/marketplace.json`
- Check SKILL.md files exist: `find skills -name "SKILL.md"`

### Import Errors (Python Scripts)

**Problem:** Python scripts fail with import errors

**Solutions:**
- Verify Python version: `python --version` (need 3.6+)
- Scripts use only standard library, no pip install needed
- Check you're in the correct directory: `pwd`

## For Teams

### Initial Setup (Team Lead)

```bash
# 1. Fork or clone this repository
git clone https://github.com/theflysurfer/claude-skills-marketplace.git

# 2. Customize for your team (optional)
# - Add/remove skills
# - Update marketplace.json

# 3. Generate team config
python scripts/list-resources-v2.py --export-team-config .claude/settings.json

# 4. Add to your team's project repository
cp .claude/settings.json /path/to/team/project/.claude/

# 5. Commit and push
cd /path/to/team/project
git add .claude/settings.json
git commit -m "feat: add Claude Code marketplace"
git push
```

### Team Member Onboarding

```bash
# 1. Clone your team's project
git clone https://github.com/your-org/your-project.git
cd your-project

# 2. Open in Claude Code
claude

# 3. Trust the folder when prompted
# (Select "Trust" in the interactive dialog)

# 4. Marketplace is now available
/plugin
```

### Updating for Teams

```bash
# Team lead updates marketplace
cd claude-skills-marketplace
git pull origin master

# Regenerate team config if needed
python scripts/list-resources-v2.py --export-team-config .claude/settings.json

# Team members refresh
/plugin marketplace refresh
```

## Version Pinning

For production stability, pin specific versions:

```json
{
  "extraKnownMarketplaces": [
    {
      "name": "claude-skills-marketplace",
      "url": "https://github.com/theflysurfer/claude-skills-marketplace#v1.0.0"
    }
  ]
}
```

Replace `#v1.0.0` with the desired release tag.

## Security Considerations

- **Interactive Trust Dialog**: Always review the marketplace source before trusting
- **Code Review**: For teams, review marketplace contents before distributing
- **Version Control**: Pin versions in production
- **CI/CD**: Use validation workflow to catch issues early

## Next Steps

- [Best Practices](BEST_PRACTICES.md) - Marketplace and skill creation guidelines
- [List Resources Guide](LIST_RESOURCES_GUIDE.md) - Using discovery tools
- [Contributing](../CONTRIBUTING.md) - How to contribute skills

## Support

- **Issues**: [GitHub Issues](https://github.com/theflysurfer/claude-skills-marketplace/issues)
- **Discussions**: [GitHub Discussions](https://github.com/theflysurfer/claude-skills-marketplace/discussions)
- **Documentation**: [Official Claude Code Docs](https://code.claude.com/docs)

---

**Last Updated**: 2025-12-09
