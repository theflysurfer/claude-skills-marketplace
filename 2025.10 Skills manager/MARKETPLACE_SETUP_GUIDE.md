# Claude Skills Marketplace Setup Guide

**Date:** 2025-10-30

## Transform This Repository Into a Skills Marketplace

This guide shows how to evolve this repository from a single-skill project into a reusable skills marketplace.

---

## Current State

```
2025.10 Delete null files/
├── .claude/
│   └── skills/
│       └── delete-reserved-names/
│           ├── SKILL.md
│           ├── config.json
│           └── README.md
├── delete-nul-gitbash.sh
└── README.md
```

**Status:** Single project with one embedded skill.

---

## Option 1: Dedicated Skills Repository (Recommended)

### Goal
Create a separate repository specifically for Claude skills that you and others can reuse.

### Structure

```
my-claude-skills/
├── README.md                           # Marketplace overview
├── CONTRIBUTING.md                     # How to add skills
├── LICENSE                            # License (MIT recommended)
│
├── skills/
│   ├── windows/
│   │   └── delete-reserved-names/     # This skill
│   │       ├── SKILL.md
│   │       ├── config.json
│   │       ├── README.md
│   │       └── scripts/
│   │           └── delete-nul-gitbash.sh
│   │
│   ├── onedrive/
│   │   └── sync-troubleshooter/       # Future skill
│   │       └── SKILL.md
│   │
│   └── automation/
│       └── file-cleanup/              # Future skill
│           └── SKILL.md
│
├── templates/
│   └── basic-skill/
│       ├── SKILL.md.template
│       └── config.json.template
│
└── docs/
    ├── installation.md
    ├── authoring-guide.md
    └── troubleshooting.md
```

### Setup Steps

**1. Create New Repository**
```bash
# On GitHub: Create new repo "claude-skills" or "my-claude-skills"
cd /path/to/new/location
mkdir my-claude-skills
cd my-claude-skills
git init
```

**2. Create Directory Structure**
```bash
mkdir -p skills/windows/delete-reserved-names
mkdir -p skills/onedrive
mkdir -p skills/automation
mkdir -p templates/basic-skill
mkdir -p docs
```

**3. Copy Current Skill**
```bash
# Copy from current project
cp -r "/path/to/2025.10 Delete null files/.claude/skills/delete-reserved-names"/* \
      skills/windows/delete-reserved-names/

# Copy the shell script
mkdir -p skills/windows/delete-reserved-names/scripts
cp "/path/to/2025.10 Delete null files/delete-nul-gitbash.sh" \
   skills/windows/delete-reserved-names/scripts/
```

**4. Create README.md**
```markdown
# My Claude Skills Marketplace

A curated collection of Claude Code skills for Windows utilities, automation, and productivity.

## Available Skills

### Windows Utilities

#### delete-reserved-names
Delete Windows reserved filenames (NUL, CON, PRN, etc.) that block OneDrive sync.

**Tags:** windows, onedrive, troubleshooting
**Version:** 2.0.0
**Author:** Your Name

[View Details](skills/windows/delete-reserved-names/README.md)

## Quick Install

### Install All Skills (Global)
```bash
git clone https://github.com/yourusername/my-claude-skills.git
cd my-claude-skills
cp -r skills/* ~/.claude/skills/
```

### Install Single Skill
```bash
git clone https://github.com/yourusername/my-claude-skills.git
cd my-claude-skills
cp -r skills/windows/delete-reserved-names ~/.claude/skills/
```

### Use as Claude Code Marketplace
```
In Claude Code:
/plugin marketplace add yourusername/my-claude-skills
/plugin install windows-utilities@my-claude-skills
```

## Documentation

- [Installation Guide](docs/installation.md)
- [Authoring Guide](docs/authoring-guide.md)
- [Troubleshooting](docs/troubleshooting.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - See [LICENSE](LICENSE)
```

**5. Create Installation Guide**
```bash
cat > docs/installation.md << 'EOF'
# Installation Guide

## Method 1: Global Installation (All Projects)

Install skills globally so they're available in all Claude Code projects:

```bash
git clone https://github.com/yourusername/my-claude-skills.git
cd my-claude-skills
cp -r skills/* ~/.claude/skills/
```

Verify installation:
```bash
ls ~/.claude/skills/
```

## Method 2: Project-Specific Installation

Install skills for a specific project:

```bash
cd your-project
mkdir -p .claude/skills
git clone https://github.com/yourusername/my-claude-skills.git temp-skills
cp -r temp-skills/skills/* .claude/skills/
rm -rf temp-skills
git add .claude/skills
git commit -m "Add Claude skills"
```

## Method 3: Git Submodule (Advanced)

Track skills as a submodule for easy updates:

```bash
cd your-project
git submodule add https://github.com/yourusername/my-claude-skills.git .claude/skills-repo
ln -s .claude/skills-repo/skills .claude/skills
git commit -m "Add skills submodule"
```

Update skills:
```bash
git submodule update --remote
```

## Method 4: Claude Code Marketplace (Coming Soon)

```
/plugin marketplace add yourusername/my-claude-skills
/plugin install windows-utilities@my-claude-skills
```

## Verification

Test that skills are detected:

1. Open Claude Code
2. Say: "J'ai des fichiers nul qui bloquent OneDrive"
3. Claude should activate the `delete-reserved-names` skill

## Troubleshooting

### Skill not detected
- Check file is named exactly `SKILL.md` (uppercase)
- Verify YAML frontmatter is present
- Restart Claude Code

### Permission issues
- Check file permissions: `chmod -R 755 ~/.claude/skills/`
EOF
```

**6. Create CONTRIBUTING.md**
```markdown
# Contributing to My Claude Skills

## Adding a New Skill

### 1. Choose Category

Determine which category your skill belongs to:
- `windows/` - Windows utilities
- `onedrive/` - OneDrive tools
- `automation/` - Automation scripts
- `development/` - Development tools
- Create new category if needed

### 2. Create Skill Directory

```bash
mkdir -p skills/category-name/your-skill-name
cd skills/category-name/your-skill-name
```

### 3. Required Files

**SKILL.md** (required)
```markdown
---
name: your-skill-name
description: What this skill does and when to use it
---

# Your Skill Title

## Instructions for Claude
[Step-by-step instructions]
```

**config.json** (recommended)
```json
{
  "name": "your-skill-name",
  "version": "1.0.0",
  "description": "Skill description",
  "tags": ["tag1", "tag2"]
}
```

**README.md** (recommended)
User-facing documentation

### 4. Submission Checklist

- [ ] Skill has focused purpose (one capability)
- [ ] SKILL.md includes YAML frontmatter
- [ ] Clear trigger phrases in description
- [ ] Instructions are clear for Claude
- [ ] Examples provided
- [ ] No sensitive data (keys, passwords)
- [ ] Tested and working
- [ ] README.md documents usage
- [ ] Appropriate category

### 5. Submit Pull Request

```bash
git checkout -b add-skill-your-skill-name
git add skills/category/your-skill-name/
git commit -m "Add your-skill-name skill"
git push origin add-skill-your-skill-name
```

Then create PR on GitHub.

## Guidelines

### Naming Conventions
- Directory: `lowercase-with-hyphens`
- SKILL.md: exactly `SKILL.md` (uppercase)

### Quality Standards
- One skill = one capability
- Clear, specific descriptions
- Working examples
- Comprehensive documentation

### Code Standards
- Scripts should be cross-platform when possible
- Document requirements clearly
- Use environment variables for credentials
- Include error handling

## Questions?

Open an issue or discussion on GitHub.
```

**7. Initialize Git**
```bash
git add .
git commit -m "Initial commit: Claude Skills Marketplace"
git remote add origin https://github.com/yourusername/my-claude-skills.git
git push -u origin main
```

---

## Option 2: Expand Current Repository

### Goal
Keep current repository but organize it as a multi-skill project.

### Structure

```
2025.10 Delete null files/
├── .claude/
│   └── skills/
│       ├── delete-reserved-names/        # Original skill
│       │   ├── SKILL.md
│       │   └── config.json
│       │
│       ├── onedrive-sync-monitor/        # New skill
│       │   └── SKILL.md
│       │
│       └── windows-file-utilities/       # New skill
│           └── SKILL.md
│
├── scripts/                               # Shared scripts
│   ├── delete-nul-gitbash.sh
│   └── sync-checker.sh
│
├── docs/
│   └── SKILLS_GUIDE.md
│
└── README.md                              # Updated README
```

### Setup Steps

**1. Reorganize Current Structure**
```bash
# Already done - skills are in .claude/skills/
```

**2. Add More Skills**
```bash
mkdir -p .claude/skills/onedrive-sync-monitor
mkdir -p .claude/skills/windows-file-utilities
```

**3. Update README.md**

Add a "Skills Included" section:

```markdown
## Skills Included

This repository includes multiple Claude Code skills:

### 1. delete-reserved-names
Delete Windows reserved filenames (NUL, CON, PRN, etc.) that block OneDrive sync.

**Location:** `.claude/skills/delete-reserved-names/`
**Version:** 2.0.0
**Tags:** windows, onedrive, troubleshooting

[View Documentation](.claude/skills/delete-reserved-names/README.md)

### 2. onedrive-sync-monitor (Coming Soon)
Monitor OneDrive sync status and alert on issues.

### 3. windows-file-utilities (Coming Soon)
Collection of Windows file management utilities.

## Installation

### Use in This Project
Skills are automatically detected when you open this project in Claude Code.

### Copy to Other Projects
```bash
cp -r .claude/skills/delete-reserved-names /path/to/other-project/.claude/skills/
```

### Install Globally
```bash
cp -r .claude/skills/* ~/.claude/skills/
```
```

---

## Option 3: Hybrid Approach

### Goal
Keep current project focused, but link to a separate skills repository.

### Setup

**1. Create separate skills repo** (as in Option 1)

**2. In current project, add submodule:**
```bash
cd "2025.10 Delete null files"
git submodule add https://github.com/yourusername/my-claude-skills.git .claude/skills-marketplace
```

**3. Symlink to use skills:**
```bash
ln -s .claude/skills-marketplace/skills/windows/delete-reserved-names .claude/skills/delete-reserved-names
```

**4. Update in README:**
```markdown
## Skills

This project uses skills from our [Claude Skills Marketplace](https://github.com/yourusername/my-claude-skills).

Currently using:
- [delete-reserved-names](https://github.com/yourusername/my-claude-skills/tree/main/skills/windows/delete-reserved-names)
```

---

## Marketplace Distribution Methods

### Method A: GitHub Repository (Simple)

**Pros:**
- Easy to set up
- Version control
- Free hosting
- Community contributions

**Cons:**
- Manual installation
- No automatic updates

**User Installation:**
```bash
git clone https://github.com/yourusername/my-claude-skills.git
cp -r my-claude-skills/skills/* ~/.claude/skills/
```

### Method B: Claude Code Plugin System (Advanced)

**Pros:**
- Native integration
- Automatic updates
- Discoverable in Claude Code
- Professional

**Cons:**
- More complex setup
- Requires plugin configuration

**Configuration:**

Create `.claude-marketplace/marketplace.json`:
```json
{
  "name": "my-claude-skills",
  "version": "1.0.0",
  "description": "Windows utilities and automation skills",
  "url": "https://github.com/yourusername/my-claude-skills",
  "author": "Your Name",
  "license": "MIT",
  "bundles": [
    {
      "id": "windows-utilities",
      "name": "Windows Utilities",
      "description": "Essential Windows tools",
      "version": "1.0.0",
      "skills": [
        "skills/windows/delete-reserved-names"
      ]
    }
  ]
}
```

**User Installation:**
```
/plugin marketplace add yourusername/my-claude-skills
/plugin install windows-utilities@my-claude-skills
```

### Method C: NPM Package (Experimental)

**Setup:**

Create `package.json`:
```json
{
  "name": "@yourusername/claude-skills",
  "version": "1.0.0",
  "description": "Claude Code skills collection",
  "main": "index.js",
  "keywords": ["claude", "skills", "ai"],
  "author": "Your Name",
  "license": "MIT",
  "files": [
    "skills/**/*"
  ],
  "scripts": {
    "install-global": "cp -r skills/* ~/.claude/skills/",
    "install-project": "cp -r skills/* .claude/skills/"
  }
}
```

**User Installation:**
```bash
npm install -g @yourusername/claude-skills
npm run install-global
```

---

## Recommended Path

### For Personal Use
→ **Option 2** (Expand current repository)
- Simple
- Keep everything in one place
- Easy to manage

### For Team Sharing
→ **Option 1** (Dedicated skills repo)
- Professional
- Easy to share
- Separate concerns

### For Community Sharing
→ **Option 1** + **Method B** (Dedicated repo + Plugin system)
- Maximum reach
- Best user experience
- Professional presentation

---

## Next Steps

### Short Term (This Week)

1. **Decide on approach** (Option 1, 2, or 3)
2. **Create repository structure**
3. **Migrate current skill**
4. **Write documentation**
5. **Push to GitHub**

### Medium Term (This Month)

1. **Add 2-3 more skills**
2. **Create skill templates**
3. **Write contribution guidelines**
4. **Test with team members**

### Long Term (Next Quarter)

1. **Set up plugin system** (if desired)
2. **Build community**
3. **Accept contributions**
4. **Maintain and update**

---

## Resources

### Official Documentation
- [Claude Skills Docs](https://docs.claude.com/en/docs/claude-code/skills)
- [Official Skills Repo](https://github.com/anthropics/skills)
- [Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

### Community Examples
- [Awesome Claude Skills](https://github.com/travisvn/awesome-claude-skills)
- [Superpowers Library](https://github.com/obra/superpowers)

### Templates
- Use `templates/` folder in your repo
- Copy from `anthropics/skills` examples

---

## Checklist: Publishing Your Marketplace

- [ ] Repository created on GitHub
- [ ] Clear README with skill list
- [ ] Installation instructions
- [ ] CONTRIBUTING.md for contributors
- [ ] LICENSE file (MIT recommended)
- [ ] At least 1-3 working skills
- [ ] Skills tested and documented
- [ ] Examples provided
- [ ] No sensitive data committed
- [ ] Proper .gitignore
- [ ] Tags/releases for versions
- [ ] (Optional) Plugin configuration
- [ ] (Optional) CI/CD for testing

---

## Example Marketplace README

```markdown
# 🚀 My Claude Skills Marketplace

**Boost your productivity with curated Claude Code skills.**

## 📦 Available Skills (3)

### Windows Utilities
- **delete-reserved-names** - Delete Windows reserved filenames blocking OneDrive
- **file-permission-fixer** - Fix Windows file permissions

### Automation
- **task-scheduler** - Schedule and automate repetitive tasks

## ⚡ Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/my-claude-skills.git

# Install all skills globally
cd my-claude-skills
cp -r skills/* ~/.claude/skills/

# Or install single skill
cp -r skills/windows/delete-reserved-names ~/.claude/skills/
```

## 📚 Documentation

- [Installation Guide](docs/installation.md)
- [Skill Authoring](docs/authoring-guide.md)
- [Troubleshooting](docs/troubleshooting.md)

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT License - Free to use and modify

---

**⭐ Star this repo if you find it useful!**
```

---

**Ready to build your skills marketplace? Start with Option 1 or 2 above!**
