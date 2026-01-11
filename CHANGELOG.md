# Changelog

All notable changes to this marketplace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-01-11

### Added
- **Unified Logging System** - JSONL structured logging with session tracking
  - `scripts/lib/unified-logger.js` - Centralized logging library
  - `scripts/core/log-monitor.js` - Real-time monitoring dashboard
  - Session ID tracking for event correlation
  - Rolling buffer (5000 lines, auto-rotation)
  - Performance: SessionStart 17ms avg, Router 5ms avg

- **Fast Skill Router Optimizations**
  - 30-second CWD cache (avoids repeated disk I/O)
  - Performance threshold: skip scan if >200 files
  - File limit reduced from 50 to 30
  - TOP_K reduced from 3 to 2 for better precision
  - MIN_SCORE increased from 0.2 to 0.25

- **8 New Command Skills** - `/julien-cmd-*` namespace
  - julien-cmd-sync, julien-cmd-list-resources
  - julien-cmd-project-scan, julien-cmd-project-list, julien-cmd-project-info
  - julien-cmd-active-folder, julien-cmd-servers, julien-cmd-check-loaded-skills

### Changed - BREAKING
- **Architecture Reorganization** (Claude Code 2.1.0 compatible)
  - Renamed `/configs` → `/registry` (200+ file references updated)
  - Isolated MkDocs: `/docs` → `/docs-source/`, `/site` gitignored
  - Removed obsolete `/home` directory
  - Moved `/coverage` → `/tests/coverage` and gitignored
  - Reorganized `/scripts` into 6 categories:
    - `core/` - Session hooks (session-start, router, tracking)
    - `discovery/` - Skill/hook/MCP discovery scripts
    - `sync/` - Migration utilities
    - `servers/` - Server management
    - `utils/` - Cleanup and maintenance
    - `lib/` - Shared libraries (unified-logger, debug-logger)

- **Hook Migration to Unified Logger**
  - session-start-banner.js - 17ms avg (removed Claude Mem, was 3000ms timeout)
  - fast-skill-router.js - 5ms avg with context awareness
  - track-skill-invocation.js - <1ms avg

### Removed
- **Claude Mem Integration** - Completely removed (99.4% performance improvement)
  - Removed PreCompact hook (precompact-save-chunk)
  - Removed SessionEnd memory hook (save-session-for-memory)
  - Deleted 410 MB of memory-chunks/
  - Eliminated 3000ms SessionStart timeout

- **Deprecated Scripts Cleanup** - 25 files deleted (4,234 lines, 184KB)
  - Claude Mem scripts: precompact-save-chunk, save-session-for-memory (4 files)
  - Old Python hook versions (4 files)
  - Benchmark tools (3 files)
  - Old routing implementations (3 files)
  - Validation utilities (5 files)
  - Test files (2 files)
  - Misc utilities (4 files)

### Performance
- **SessionStart**: 3000ms timeout → 17ms avg (99.4% improvement)
- **Router**: ~10ms → 5ms avg (50% improvement)
- **Error rate**: 1.5% (target <5%)
- **Zero timeouts**: Claude Mem completely removed

### Documentation
- Updated README.md with new architecture, performance metrics, Claude Code 2.1.0 features
- Added unified logging documentation with format examples
- Added fast skill router features (context-aware, fuzzy matching, caching)
- Updated all command references to new `/julien-cmd-*` namespace

### Migration Notes
For existing installations:
1. Update all references from `configs/` to `registry/`
2. Update script paths: `scripts/discover-skills.py` → `scripts/discovery/discover-skills.py`
3. Remove Claude Mem hooks from `~/.claude/settings.json` if present
4. Run `/julien-sync` to deploy updated hooks globally
5. Logs now in `~/.claude/logs/unified.jsonl` (JSONL format)

### Added - Skills (Nginx Manager Migration)
- **julien-infra-hostinger-wordpress-security** v1.0.0 - WordPress security audit with 25+ checks
  - 7 audit categories: Nginx, Files, WP Config, Users, Plugins, Database, Fail2ban
  - 0-100% scoring system with CRITICAL/WARNING/GOOD/EXCELLENT levels
  - security-audit.sh script (355 LOC)
  - WORDPRESS_SECURITY.md comprehensive reference guide
  - Skill chaining with hostinger-nginx and hostinger-fail2ban

- **julien-infra-hostinger-fail2ban** v1.0.0 - Fail2ban jail management for WordPress
  - 3 WordPress jails: wordpress-auth, wordpress-hard, wordpress-xmlrpc
  - 3 detection filters with regex patterns
  - Ban/unban operations and monitoring
  - FAIL2BAN_GUIDE.md reference guide
  - Skill chaining with wordpress-security

### Updated - Skills (Nginx Manager Migration)
- **julien-infra-hostinger-nginx** v1.1.0 → v2.0.0 - Major enrichment
  - Added `scripts/` directory with 8 operational scripts:
    - nginx-deploy.sh - Safe 6-step deployment workflow
    - nginx-backup.sh - Configuration backup
    - nginx-rollback.sh - Restore from backup
    - health-check.sh - Service health verification
    - sync-from-server.sh - Download configs from VPS
    - sync-to-server.sh - Upload configs to VPS
    - create-new-site.sh - Interactive site creation wizard
    - wp-cli.sh - WordPress CLI wrapper
  - Added `templates/` directory with 4 production templates:
    - site-wordpress.conf - WordPress Docker template
    - site-reverse-proxy.conf - Generic reverse proxy
    - site-wordpress-phpfpm.conf - WordPress PHP-FPM template
    - rate-limiting-zones.conf - Rate limiting configuration
  - Added `references/snippets/` with 5 security snippets:
    - ssl-hardening.conf
    - bot-protection-wordpress.conf
    - bot-protection-generic.conf
    - http-method-restriction.conf
    - basic-auth.conf
  - Added NGINX_STANDARDS.md comprehensive reference

- **julien-infra-hostinger-nginx-audit** v1.0.0 → v1.1.0 - Enhanced validation
  - Added validate-nginx-config.sh script (286 LOC)
  - 11 validation checks with CRITICAL/WARNING severity
  - Exit codes for CI/CD integration
  - Single site validation support
  - Colored console output

### Added - Skills
- **julien-workflow-check-loaded-skills** - New workflow skill to check which skills are loaded globally and project-level
  - Displays skills by category (Hostinger, Anthropic, custom)
  - Shows counts for each category
  - Identifies project-level overrides
  - Includes troubleshooting guide for missing skills
  - Accessible via `/check-loaded-skills` slash command
  - Comprehensive skill resolution reference guide

### Added - Discovery & Listing Tools
- Enhanced list-resources-v2.py script with advanced features:
  - Schema validation for marketplace.json
  - Filter by category, keyword, and source type
  - Search functionality across names and descriptions
  - Statistics and analytics dashboard
  - Keywords/tags display for better discoverability
  - Source type detection (github, local, npm, git)
  - Verbose mode with detailed information
- Basic list-resources.py for simple listing
- Bash version (list-resources.sh) for Linux/macOS

### Added - CI/CD & Automation
- validate-marketplace.py: Comprehensive marketplace validation script
  - Fuzzy matching for plugin folder detection
  - Schema validation against Claude Code standards
  - Duplicate detection
  - SKILL.md file verification
- GitHub Actions workflows:
  - validate-marketplace.yml: Automatic validation on push/PR
  - list-resources.yml: Weekly resources listing generation
- Pull Request template with checklist

### Added - Team Distribution
- Team configuration export functionality
- .claude/settings-marketplace.json with correct GitHub URL
- extraKnownMarketplaces support documentation

### Added - Documentation
- docs/BEST_PRACTICES.md: Complete guide based on official Claude Code docs
- docs/INSTALLATION.md: Comprehensive installation guide for all methods
- docs/LIST_RESOURCES_GUIDE.md: Detailed usage guide for discovery tools
- .github/PULL_REQUEST_TEMPLATE.md: Standardized PR process

### Changed
- Updated README.md with:
  - Team distribution instructions (extraKnownMarketplaces)
  - Multiple installation methods
  - Enhanced Quick Start section
  - Direct GitHub URL integration
- Enhanced scripts/README.md with feature comparison
- Improved slash command documentation
- Updated .claude/settings-marketplace.json with actual repository URL

### Fixed
- Plugin source path resolution in validation script
- Fuzzy matching algorithm for skill folder detection
- Marketplace.json source paths compatibility with pluginRoot

### Documentation
- Added comprehensive best practices based on official sources
- Enhanced inline documentation in all scripts
- Created complete installation guide for teams
- Added troubleshooting sections

## [1.0.0] - 2025-12-06

### Added
- Initial marketplace structure
- Basic list-resources.py script
- list-resources.sh bash version
- Slash command /list-resources
- 19 initial skills (development, infrastructure, operations, productivity, design)
- Integration script for public skills
- Comprehensive documentation

### Skills Included
- Development: 8 skills (skill-creator, frontend-design, mcp-builder, webapp-testing, web-artifacts-builder, skill-creator, skill-reviewer, sync-personal-skills)
- Infrastructure: 4 skills (hostinger-ssh, hostinger-docker, hostinger-nginx, hostinger-database)
- Operations: 2 skills (hostinger-maintenance, hostinger-space-reclaim)
- Productivity: 4 skills (pdf, xlsx, docx, pptx)
- Design: 1 skill (canvas-design)

---

## How to Update This File

When making changes:
1. Add new entries under `[Unreleased]`
2. Categorize changes: Added, Changed, Deprecated, Removed, Fixed, Security
3. When releasing, change `[Unreleased]` to version number with date
4. Follow semver for version numbering
