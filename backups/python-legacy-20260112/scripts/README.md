# Scripts

Automation scripts for managing the Claude Skills Marketplace.

## Available Scripts

### list-resources-v2.py (Recommended)

**Purpose**: Enhanced script to list all skills, agents, and plugins with advanced filtering and analytics.

**Usage**:
```bash
# Basic listing
python scripts/list-resources-v2.py

# Advanced features
python scripts/list-resources-v2.py --stats                    # Statistics
python scripts/list-resources-v2.py --category infrastructure  # Filter by category
python scripts/list-resources-v2.py --keyword docker           # Filter by keyword
python scripts/list-resources-v2.py --search nginx             # Search
python scripts/list-resources-v2.py --verbose                  # Detailed view
python scripts/list-resources-v2.py --list-categories          # List all categories
python scripts/list-resources-v2.py --list-keywords            # List all keywords

# Team distribution
python scripts/list-resources-v2.py --export-team-config .claude/settings.json
```

**Features** (Based on Claude Code Best Practices):
- ✅ Schema validation for marketplace.json
- ✅ Filter by category, keyword, or source type
- ✅ Search functionality (name and description)
- ✅ Statistics and analytics (counts by category, source type)
- ✅ Team configuration export (extraKnownMarketplaces)
- ✅ Keywords/tags display for discoverability
- ✅ Source type detection (github, local, npm, git)
- ✅ Verbose mode with detailed information
- ✅ Color-coded output
- ✅ Cross-platform (Windows, macOS, Linux)

**What it shows**:
- Marketplace Information: name, version, owner, description, total plugins
- Skills by Category: organized tables with name, description, version, license, source, keywords
- Statistics: total plugins, categories, keywords, distribution by category/source
- Usage Instructions: installation, filtering, team distribution

**Integration**: Can be copied to any project using this marketplace. See [docs/LIST_RESOURCES_GUIDE.md](../docs/LIST_RESOURCES_GUIDE.md) for integration and [docs/BEST_PRACTICES.md](../docs/BEST_PRACTICES.md) for marketplace best practices.

---

### list-resources.py (Basic Version)

**Purpose**: Simple script to list all skills, agents, and plugins without advanced features.

**Usage**:
```bash
python scripts/list-resources.py
```

**Features**:
- Detects marketplace vs. project structure automatically
- Displays marketplace metadata
- Lists all skills organized by category
- Shows local skills from `skills/` or `.claude/skills/` directories
- Color-coded output
- Works in both marketplace repos and consumer projects

Use this version if you need a lightweight solution without filtering capabilities.

---

### list-resources.sh (Bash Version)

**Purpose**: Bash version for Linux/macOS users.

**Usage**:
```bash
./scripts/list-resources.sh
```

**Features**: Similar to list-resources.py but for bash environments.

---

### integrate-public-skill.sh

**Purpose**: Import skills from public repositories (Anthropic, community) into this marketplace.

**Usage**:
```bash
# Integrate from Anthropic's official repository
./scripts/integrate-public-skill.sh skill-name

# Integrate from custom repository
./scripts/integrate-public-skill.sh -s https://github.com/user/repo -n custom-name skill-name
```

**Features**:
- Downloads skills from GitHub repositories
- Preserves original attribution and licensing
- Adds integration metadata
- Updates marketplace catalog automatically

**Documentation**: See [INTEGRATING_PUBLIC_SKILLS.md](../INTEGRATING_PUBLIC_SKILLS.md) for detailed usage.

---

## Script Requirements

### list-resources.py
- Python 3.6 or higher
- No external dependencies (uses only standard library)

### list-resources.sh
- Bash shell (Linux, macOS, Git Bash on Windows)
- Standard Unix utilities (grep, sed, wc)

### integrate-public-skill.sh
- Bash shell
- Git
- curl or wget
- jq (optional, for advanced JSON manipulation)

## Development

### Adding a New Script

1. Create the script in `scripts/` directory
2. Make it executable: `chmod +x scripts/your-script.sh`
3. Add documentation to this README
4. Update main README.md if the script is user-facing
5. Consider adding a corresponding slash command in `.claude/commands/`

### Testing Scripts

Always test scripts in a clean environment:

```bash
# Test in a temporary directory
mkdir /tmp/test-marketplace
cd /tmp/test-marketplace
git clone <this-repo>
cd <repo-name>
python scripts/list-resources.py
```

### Code Style

- **Python**: Follow PEP 8 style guide
- **Bash**: Use shellcheck for linting
- **Comments**: Add clear comments explaining complex logic
- **Error handling**: Include proper error messages and exit codes

## See Also

- [docs/LIST_RESOURCES_GUIDE.md](../docs/LIST_RESOURCES_GUIDE.md) - Comprehensive guide for list-resources
- [INTEGRATING_PUBLIC_SKILLS.md](../INTEGRATING_PUBLIC_SKILLS.md) - Guide for integrating external skills
- [MARKETPLACE_GUIDE.md](../MARKETPLACE_GUIDE.md) - General marketplace documentation
