# Claude Code Marketplace Best Practices

This document outlines best practices for creating and managing Claude Code marketplaces, based on official documentation and industry standards.

## Table of Contents

- [Marketplace Structure](#marketplace-structure)
- [Plugin Metadata](#plugin-metadata)
- [Team Distribution](#team-distribution)
- [Discoverability](#discoverability)
- [Versioning](#versioning)
- [Security](#security)
- [Documentation](#documentation)

## Marketplace Structure

### marketplace.json Location

Place your marketplace catalog at:
```
.claude-plugin/marketplace.json
```

### Required Fields

```json
{
  "name": "your-marketplace-name",
  "plugins": [
    {
      "name": "plugin-name",
      "source": "./plugin-folder",
      "description": "Clear, concise description"
    }
  ]
}
```

### Recommended Fields

```json
{
  "name": "your-marketplace-name",
  "owner": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "metadata": {
    "description": "Marketplace purpose and scope",
    "version": "1.0.0",
    "pluginRoot": "./skills"
  },
  "plugins": [...]
}
```

## Plugin Metadata

### Naming Conventions

- **Name**: Use kebab-case (lowercase with hyphens)
- **Length**: 1-4 words, max 20 characters recommended
- **Memorable**: Easy to remember and type
- **Descriptive**: Indicates the plugin's purpose

Examples:
- ✅ `hostinger-nginx`
- ✅ `skill-creator-pro`
- ❌ `my-really-long-plugin-name-that-does-everything`

### Description Best Practices

- **Concise**: 1-2 sentences
- **Clear value proposition**: What problem does it solve?
- **Use case oriented**: When should users use it?
- **SEO-friendly**: Include relevant keywords naturally

Example:
```
"description": "Manage Nginx reverse proxy on Hostinger VPS srv759970. Use for site configuration, SSL/Let's Encrypt setup, reverse proxy configuration, troubleshooting 502/504 errors, certbot operations, or nginx reload/restart."
```

### Categorization

Choose appropriate categories for better discoverability:

- `development` - Development tools, builders, testing
- `infrastructure` - Server management, deployment, containerization
- `operations` - Maintenance, monitoring, automation
- `productivity` - Office tools, documentation, communication
- `design` - Visual design, creative tools
- `data-science` - ML, analytics, data processing
- `security` - Security audits, vulnerability scanning

### Keywords/Tags

Include 3-8 relevant keywords:

```json
{
  "keywords": ["nginx", "reverse-proxy", "ssl", "certbot", "hostinger"]
}
```

**Best practices:**
- Use specific, searchable terms
- Include technology names
- Add use case keywords
- Avoid keyword stuffing
- Don't duplicate words from name/description

## Team Distribution

### Using extraKnownMarketplaces

For team-wide marketplace distribution, add to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": [
    {
      "name": "your-marketplace",
      "url": "https://github.com/your-org/your-marketplace"
    }
  ]
}
```

**Benefits:**
- Auto-installs when team members trust the repository
- Centralizes plugin management
- Ensures consistency across the team

**Generate config:**
```bash
python scripts/list-resources-v2.py --export-team-config .claude/settings.json
```

### Version Pinning

Treat plugins as first-class dependencies:

```json
{
  "name": "my-plugin",
  "version": "1.2.3",
  "source": "https://github.com/org/repo/releases/tag/v1.2.3"
}
```

**Benefits:**
- Prevents "works on my machine" drift
- Enables rollback to known-good versions
- Facilitates testing and staging

## Discoverability

### SEO for Descriptions

Include relevant terms that users might search for:

```json
{
  "name": "hostinger-docker",
  "description": "Docker container management on Hostinger VPS - optimize images, deploy services, troubleshoot errors",
  "keywords": ["docker", "containers", "optimization", "hostinger", "deployment"]
}
```

### README and Documentation

Each plugin should include:
- Clear README.md with usage examples
- Prerequisites and dependencies
- Quick start guide
- Troubleshooting section
- Links to related resources

### Metadata Organization

Use consistent metadata fields:

```json
{
  "metadata": {
    "source": "original|anthropic|enhanced",
    "upstream": "https://github.com/original/repo",
    "integrated": "2025-12-05",
    "author": "Author Name",
    "basedOn": "parent-skill-name"
  }
}
```

## Versioning

### Semantic Versioning

Follow semver (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

Example:
```
1.0.0 → Initial release
1.1.0 → Added new feature
1.1.1 → Fixed bug
2.0.0 → Breaking change
```

### Changelog

Maintain a CHANGELOG.md in each plugin:

```markdown
# Changelog

## [1.1.0] - 2025-12-09
### Added
- New filtering feature
- Export to JSON

### Fixed
- Bug in parsing logic

## [1.0.0] - 2025-12-01
### Added
- Initial release
```

## Security

### Code Review

Before publishing:
- Review all code for security vulnerabilities
- Check for hardcoded credentials
- Validate external inputs
- Use safe defaults

### Trust Dialog

Claude Code shows an interactive trust dialog for new marketplaces:
- Users must verify they trust the source
- This prevents automatic execution of untrusted code
- Educate users about security implications

### CI/CD Gates

Apply the same rigor as production code:
- Automated security scanning
- Dependency vulnerability checks
- Code review requirements
- Test coverage thresholds

## Documentation

### Plugin Documentation Structure

```
plugin-name/
├── SKILL.md              # Main skill file with YAML frontmatter
├── README.md             # Overview and quick start
├── references/           # Detailed documentation
│   ├── guide.md
│   └── examples.md
├── scripts/              # Helper scripts
└── ATTRIBUTION.md        # Credits and licenses
```

### YAML Frontmatter

Include comprehensive metadata:

```yaml
---
name: plugin-name
description: Clear, concise description of what this plugin does and when to use it
category: infrastructure
version: 1.0.0
license: Apache-2.0
keywords:
  - keyword1
  - keyword2
  - keyword3
metadata:
  author: Your Name
  repository: https://github.com/you/repo
  documentation: https://example.com/docs
---
```

### Usage Examples

Include realistic examples:

```markdown
## Examples

### Basic Usage
\`\`\`bash
claude skill install ./skills/plugin-name
\`\`\`

### Common Scenarios

**Scenario 1: Deploy to production**
\`\`\`
/plugin-name --env production --deploy
\`\`\`

**Scenario 2: Run maintenance**
\`\`\`
/plugin-name --maintenance --cleanup
\`\`\`
```

## Listing and Discovery

### Use list-resources Script

Provide a discovery tool for users:

```bash
# List all resources
python scripts/list-resources-v2.py

# Filter by category
python scripts/list-resources-v2.py --category infrastructure

# Search
python scripts/list-resources-v2.py --search docker

# Show statistics
python scripts/list-resources-v2.py --stats
```

### Metadata Completeness

Ensure all plugins have:
- ✅ Name
- ✅ Description
- ✅ Version
- ✅ License
- ✅ Category
- ✅ Keywords
- ✅ Source

Run validation:
```bash
python scripts/list-resources-v2.py
# Check for validation warnings
```

## References

### Official Documentation

- [Claude Code Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Claude Code Slash Commands](https://code.claude.com/docs/en/slash-commands)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

### Community Resources

- [Claude Code Marketplace (Community)](https://claudecodemarketplace.com/)
- [Anthropic Official Skills](https://github.com/anthropics/skills)
- [Claude Code Plugins Hub](https://github.com/jeremylongshore/claude-code-plugins-plus)

### Industry Standards

- [VSCode Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [JetBrains Marketplace Best Practices](https://plugins.jetbrains.com/docs/marketplace/best-practices-for-listing.html)
- [Semantic Versioning](https://semver.org/)

---

**Last updated**: 2025-12-09
**Version**: 1.0.0
