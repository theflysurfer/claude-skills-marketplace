# Marketplace Development Guide

This guide explains how to develop and maintain this Claude Skills marketplace.

## What is a Marketplace?

A marketplace is a catalog of available plugins/skills that enables:
- **Centralized discovery**: Users can find all your skills in one place
- **Version management**: Track and update skill versions
- **Team distribution**: Easy sharing across teams
- **One-command installation**: Users can install skills with `/plugin install skill-name`

## Marketplace Structure

```
.claude-plugin/
├── marketplace.json    # Catalog of available skills
└── plugin.json         # Marketplace plugin manifest
```

## marketplace.json Format

The `marketplace.json` file catalogs all available skills:

```json
{
  "name": "claude-skills-marketplace",
  "owner": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "metadata": {
    "description": "Description of your marketplace",
    "version": "1.0.0",
    "pluginRoot": "./skills"
  },
  "plugins": [
    {
      "name": "my-skill",
      "source": "./my-skill",
      "description": "What the skill does",
      "version": "1.0.0",
      "license": "Apache-2.0",
      "keywords": ["tag1", "tag2"],
      "category": "productivity"
    }
  ]
}
```

### Required Fields

- **name**: Marketplace identifier (kebab-case)
- **owner**: Maintainer contact info
- **plugins**: Array of available skills

### Plugin Entry Required Fields

- **name**: Skill identifier (kebab-case)
- **source**: Path to skill folder (relative to pluginRoot)

### Plugin Entry Optional Fields

- **description**: What the skill does
- **version**: Skill version (semver)
- **license**: SPDX license identifier
- **keywords/tags**: For discovery
- **category**: Organization classification
- **author**: Creator information
- **homepage**: Documentation URL
- **repository**: Source code location

## plugin.json Format

The `plugin.json` defines the marketplace itself as a plugin:

```json
{
  "name": "marketplace-name",
  "version": "1.0.0",
  "description": "Marketplace description",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "license": "Apache-2.0",
  "homepage": "https://github.com/user/repo",
  "repository": {
    "type": "git",
    "url": "https://github.com/user/repo"
  },
  "keywords": ["claude", "skills"],
  "category": "skills"
}
```

## Adding a New Skill to the Marketplace

### 1. Create the Skill

```bash
# Copy template
cp -r template-skill skills/my-new-skill

# Edit SKILL.md with your instructions
```

### 2. Add to marketplace.json

Edit `.claude-plugin/marketplace.json` and add to the `plugins` array:

```json
{
  "name": "my-new-skill",
  "source": "./my-new-skill",
  "description": "Clear description of what the skill does",
  "version": "1.0.0",
  "license": "Apache-2.0",
  "keywords": ["relevant", "tags"],
  "category": "productivity"
}
```

### 3. Test Locally

```bash
# Add marketplace locally
/plugin marketplace add /path/to/this/repo

# Install your skill
/plugin install my-new-skill

# Test it
/my-new-skill
```

## Publishing the Marketplace

### To GitHub

1. Create a GitHub repository
2. Push this code to GitHub
3. Update URLs in `plugin.json`
4. Users can then add with:
   ```bash
   /plugin marketplace add yourusername/repo-name
   ```

### Distribution Options

**Public Repository**:
- Push to public GitHub repo
- Anyone can add your marketplace
- Share the marketplace add command

**Private Repository**:
- Push to private GitHub repo
- Share with team members only
- Requires access permissions

**Local Development**:
- Keep in local directory
- Add with absolute path
- Good for testing before publishing

## Plugin Source Options

### Local Relative Path (Recommended for this repo)
```json
{
  "name": "my-skill",
  "source": "./my-skill"
}
```

### GitHub Repository
```json
{
  "name": "external-skill",
  "source": {
    "source": "github",
    "repo": "username/repo-name"
  }
}
```

### Git URL
```json
{
  "name": "git-skill",
  "source": {
    "source": "url",
    "url": "https://gitlab.com/team/skill.git"
  }
}
```

## Version Management

### Updating a Skill Version

1. Update the skill code
2. Update version in marketplace.json:
   ```json
   {
     "name": "my-skill",
     "version": "1.1.0"
   }
   ```
3. Update marketplace metadata version if needed
4. Commit and push changes

### Semantic Versioning

Follow semver (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Best Practices

1. **Clear Descriptions**: Make skill descriptions clear and concise
2. **Appropriate Keywords**: Use relevant keywords for discovery
3. **Version Control**: Always update versions when making changes
4. **Testing**: Test skills locally before publishing
5. **Documentation**: Keep README and guides up to date
6. **Licensing**: Specify licenses for all skills
7. **Categories**: Use consistent category names

## Categories

Suggested categories:
- `productivity`
- `development`
- `documentation`
- `testing`
- `data-analysis`
- `automation`
- `communication`

## Troubleshooting

### Skill Not Found
- Check plugin name matches folder name
- Verify source path is correct
- Ensure pluginRoot is set correctly

### Installation Fails
- Verify SKILL.md has valid YAML frontmatter
- Check all required fields are present
- Validate JSON syntax in marketplace files

### Skill Not Loading
- Check SKILL.md format
- Verify name in YAML matches folder
- Review error messages in Claude Code

## Resources

- [Official Plugin Marketplaces Docs](https://code.claude.com/docs/en/plugin-marketplaces)
- [Official Skills Repository](https://github.com/anthropics/skills)
- [Skills Specification](./agent_skills_spec.md)
