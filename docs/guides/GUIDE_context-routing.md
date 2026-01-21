# Context Routing - Roadmap & Future Improvements

## Current Implementation (v1.0)

### Tier System
| Tier | Name | Behavior | Threshold |
|------|------|----------|-----------|
| 1 | AUTO-ACTIVATE | Immediate skill activation | Pattern detected |
| 2 | BOOST | +0.7 score bonus | 3+ files of type |
| 3 | HINT | Shown in suggestions | Pattern detected |

### Supported Patterns

**Tier 1 - Auto-Activation:**
- `.ahk2` / `.ah2` (3+) → julien-ref-ahk-v2
- `.ahk` (3+) + v2 syntax → julien-ref-ahk-v2
- `.ahk` (3+) + v1 syntax → julien-ref-ahk-v1
- `astro.config.mjs` → julien-ref-astro-install
- `theme.json` → julien-wordpress-structure-validator
- `wp-content/` → julien-wordpress-structure-validator
- `mcp_server.py` → anthropic-dev-tools-mcp-builder
- `docker-compose.yml` → julien-infra-hostinger-docker

**Tier 2 - Boost:**
- Office: `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.csv`, `.tsv`
- Scripts: `.ahk`, `.ahk2`, `.ah2`, `.ps1`, `.bat`, `.cmd`
- Media: `.srt`, `.vtt`
- Docs: `.md`

**Tier 3 - Hints:**
- `.git/` → julien-dev-commit-message
- `.github/` → julien-dev-commit-message
- `package.json` → anthropic-web-frontend-design
- `tsconfig.json` → anthropic-web-frontend-design

---

## Proposed Additional Patterns (Phase 5)

Based on analysis of all 54 skills, these additional patterns could significantly improve routing:

### New Tier 1 - Auto-Activation (High Confidence)

| Pattern | Skill | Reason |
|---------|-------|--------|
| `.mcp.json` | julien-mcp-installer | MCP configuration file |
| `CLAUDE.md` | julien-dev-claude-md-documenter | Project instructions file |
| `.claude/settings.json` | julien-dev-hook-creator | Hook configuration |
| `skills/` folder | julien-skill-creator | Skill development context |
| `SKILL.md` | julien-skill-reviewer | Skill editing context |
| `Microsoft.PowerShell_profile.ps1` | julien-dev-powershell-profile | Profile management |
| `srv759970` in path | julien-infra-hostinger-core | Hostinger VPS context |
| `pyproject.toml` + `mcp` content | anthropic-dev-tools-mcp-builder | Python MCP project |
| `Dockerfile` + `hostinger` | julien-infra-hostinger-docker | Hostinger Docker context |

### New Tier 2 - Boost (Extension-Based)

| Extensions | Skills | Count Required |
|------------|--------|----------------|
| `.test.js`, `.spec.ts`, `.test.tsx` | anthropic-web-testing | 3+ |
| `_test.py`, `test_*.py` | anthropic-web-testing | 3+ |
| `.py` (general) | anthropic-dev-tools-mcp-builder | 5+ |
| `.tsx`, `.jsx` | anthropic-web-frontend-design | 3+ |
| `.vue` | anthropic-web-frontend-design | 3+ |
| `.svelte` | anthropic-web-frontend-design | 3+ |

### New Tier 2 - Documentation Boost (IMPORTANT)

Pour les fichiers markdown et documentation, boost systématique:

| Context | Skills | Priority |
|---------|--------|----------|
| `docs/` folder exists | julien-ref-doc-production | High |
| 5+ `.md` files | julien-ref-doc-production | High |
| `README.md` present | julien-ref-doc-production | Medium |
| `CHANGELOG.md` present | julien-ref-doc-production | Medium |
| `notion` in path | julien-ref-notion-markdown | High |
| `.mdx` files | anthropic-web-frontend-design | Medium |

### New Tier 3 - Hints (Contextual Suggestions)

| Pattern | Skills | Shown When |
|---------|--------|------------|
| `.claude/` folder | julien-maintenance-claude-json | Folder exists |
| `.env` file | (warning) | Security reminder |
| `Dockerfile` | julien-infra-deployment-verifier | File exists |
| `deploy/` folder | julien-infra-deployment-verifier | Folder exists |
| `.github/workflows/` | julien-dev-commit-message | CI/CD context |

### Implementation Code Changes

```javascript
// Add to EXTENSION_SKILL_MAP
const EXTENSION_SKILL_MAP = {
    // ... existing ...

    // Testing files
    '.test.js': ['anthropic-web-testing'],
    '.spec.js': ['anthropic-web-testing'],
    '.test.ts': ['anthropic-web-testing'],
    '.spec.ts': ['anthropic-web-testing'],
    '.test.tsx': ['anthropic-web-testing'],

    // Frontend frameworks
    '.tsx': ['anthropic-web-frontend-design'],
    '.jsx': ['anthropic-web-frontend-design'],
    '.vue': ['anthropic-web-frontend-design'],
    '.svelte': ['anthropic-web-frontend-design'],

    // Python
    '.py': ['anthropic-dev-tools-mcp-builder'],
};

// Add to CONTEXT_AUTO_ACTIVATE
const CONTEXT_AUTO_ACTIVATE = {
    files: {
        // ... existing ...
        '.mcp.json': 'julien-mcp-installer',
        'CLAUDE.md': 'julien-dev-claude-md-documenter',
        'SKILL.md': 'julien-skill-reviewer',
        'Microsoft.PowerShell_profile.ps1': 'julien-dev-powershell-profile',
        'pyproject.toml': null,  // Needs content check for MCP
    },
    folders: {
        // ... existing ...
        'skills': 'julien-skill-creator',
        '.claude': 'julien-maintenance-claude-json',
        'docs': 'julien-ref-doc-production',
    }
};

// NEW: Path-based detection
const PATH_PATTERNS = {
    'srv759970': 'julien-infra-hostinger-core',
    'notion': 'julien-ref-notion-markdown',
    'hostinger': 'julien-infra-hostinger-core',
};

function checkPathPatterns(cwd) {
    for (const [pattern, skill] of Object.entries(PATH_PATTERNS)) {
        if (cwd.toLowerCase().includes(pattern)) {
            return { skill, reason: `Path contains "${pattern}"` };
        }
    }
    return null;
}
```

---

## Future Improvements

### Phase 4: SKILL.md Context Patterns

Add `context_patterns` to individual SKILL.md YAML frontmatter:

```yaml
---
name: julien-ref-ahk-v2
triggers:
  - autohotkey v2
  - ahk2 script
context_patterns:
  extensions: [.ahk2, .ah2]
  files: []
  folders: []
  tier: auto-activate
  detection_logic: |
    If .ahk2/.ah2 files present → Auto-activate
    If .ahk files + v2 syntax → Auto-activate
---
```

**Benefits:**
- Decentralized configuration (each skill defines its own context)
- Easier to maintain and extend
- Can be auto-discovered by `discover-skills.py`

**Files to modify:**
- `scripts/discovery/discover-skills.py` - Extract context_patterns
- `registry/hybrid-registry.json` - Store context_patterns metadata
- 20+ `skills/*/SKILL.md` - Add context_patterns section

---

### Improvement: Smarter Auto-Activation

**Problem:** Auto-activation can override user intent (e.g., "create excel" in AHK project still activates AHK skill)

**Solution Options:**

1. **Keyword Override**: If prompt contains strong keywords for another skill, don't auto-activate
   ```javascript
   // If Excel keyword detected AND score > 0.8, skip auto-activation
   if (skillScores['anthropic-office-xlsx'] > 0.8) {
       context.autoActivate = null;
   }
   ```

2. **Confidence Threshold**: Only auto-activate if no other skill scores above threshold
   ```javascript
   const maxOtherScore = Math.max(...Object.values(skillScores));
   if (maxOtherScore < 0.5) {
       // Safe to auto-activate
   }
   ```

3. **User Preference**: Allow `CONTEXT_AUTO_ACTIVATE=false` env var to disable

---

### Improvement: Nested Directory Scanning

**Current:** Only scans root directory (50 files max)

**Proposed:** Scan one level deep for better detection

```javascript
function scanContextDeep(dir, depth = 1) {
    // Scan root
    const context = scanContext();

    // Scan immediate subdirectories (depth 1)
    if (depth > 0) {
        for (const folder of context.folders) {
            const subContext = scanContext(path.join(dir, folder), depth - 1);
            // Merge extension counts
            // Check for pattern files
        }
    }
    return context;
}
```

**Use cases:**
- `src/components/*.tsx` → Detect React project
- `tests/*.test.js` → Detect test framework
- `docs/*.md` → Detect documentation project

---

### Improvement: Content-Based Detection

**Current:** Only file names/extensions

**Proposed:** Read file headers for better detection

```javascript
const CONTENT_PATTERNS = {
    // Python
    'fastmcp': 'anthropic-dev-tools-mcp-builder',
    'from fastapi import': 'anthropic-web-backend',

    // JavaScript
    'import React': 'anthropic-web-frontend-design',
    'import { defineConfig }': 'julien-ref-astro-install',

    // Config files
    '"scripts"': 'anthropic-web-frontend-design', // package.json
};

function detectFromContent(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8').slice(0, 1024);
    for (const [pattern, skill] of Object.entries(CONTENT_PATTERNS)) {
        if (content.includes(pattern)) return skill;
    }
    return null;
}
```

---

### Improvement: Project Type Detection

Detect project type holistically, not just individual files:

```javascript
const PROJECT_TYPES = {
    'astro': {
        required: ['astro.config.mjs'],
        optional: ['src/pages/', 'src/components/'],
        skill: 'julien-ref-astro-install'
    },
    'wordpress-theme': {
        required: ['style.css', 'functions.php'],
        optional: ['theme.json', 'templates/'],
        skill: 'julien-wordpress-structure-validator'
    },
    'mcp-server': {
        required: ['mcp_server.py'],
        optional: ['pyproject.toml'],
        skill: 'anthropic-dev-tools-mcp-builder'
    },
    'node-project': {
        required: ['package.json'],
        optional: ['tsconfig.json', 'node_modules/'],
        skill: 'anthropic-web-frontend-design'
    }
};
```

---

### Improvement: Context Persistence

**Problem:** Context is recalculated every prompt (even with 30s cache)

**Solution:** Save detected project type to `.claude/project-context.json`

```json
{
    "detected_at": "2026-01-12T12:00:00Z",
    "project_type": "ahk-v2",
    "auto_activate": "julien-ref-ahk-v2",
    "extensions": {".ahk2": 5, ".ahk": 2},
    "confidence": 0.95
}
```

**Benefits:**
- Faster routing (no disk scan)
- User can manually override
- Survives session restarts

---

### Improvement: Multi-Skill Context

**Current:** Only one skill can be auto-activated

**Proposed:** Activate multiple complementary skills

```javascript
const SKILL_COMBINATIONS = {
    'wordpress-dev': ['julien-wordpress-structure-validator', 'julien-ref-doc-production'],
    'fullstack-js': ['anthropic-web-frontend-design', 'anthropic-web-backend'],
    'python-mcp': ['anthropic-dev-tools-mcp-builder', 'julien-ref-doc-production']
};
```

---

### Improvement: Learning from Usage

Track which skills are actually used in each project type:

```javascript
// After skill invocation
function trackContextUsage(projectType, skillUsed, wasHelpful) {
    const stats = loadUsageStats();
    stats[projectType] = stats[projectType] || {};
    stats[projectType][skillUsed] = stats[projectType][skillUsed] || { used: 0, helpful: 0 };
    stats[projectType][skillUsed].used++;
    if (wasHelpful) stats[projectType][skillUsed].helpful++;
    saveUsageStats(stats);
}
```

Use this data to improve auto-activation confidence over time.

---

## Priority Matrix

| Improvement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| SKILL.md context_patterns | High | Medium | P1 |
| Keyword override for auto-activation | High | Low | P1 |
| User preference env var | Medium | Low | P2 |
| Nested directory scanning | Medium | Medium | P2 |
| Content-based detection | High | High | P3 |
| Project type detection | High | High | P3 |
| Context persistence | Medium | Medium | P3 |
| Multi-skill context | Low | Medium | P4 |
| Learning from usage | Low | High | P4 |

---

## Testing Checklist

Before implementing new features, test in these project types:

- [ ] AHK v1 project (pure .ahk files with v1 syntax)
- [ ] AHK v2 project (pure .ahk2 files)
- [ ] Mixed AHK project (.ahk with v2 syntax)
- [ ] WordPress theme (theme.json + wp-content/)
- [ ] Astro project (astro.config.mjs)
- [ ] MCP server (mcp_server.py)
- [ ] Node.js project (package.json)
- [ ] Python project (pyproject.toml)
- [ ] Office documents folder (multiple .pdf/.xlsx)
- [ ] Subtitle project (multiple .srt files)
- [ ] Empty/new project (no context)
- [ ] Mixed project (multiple technologies)

---

## References

- `scripts/core/fast-skill-router.js` - Main implementation
- `scripts/lib/unified-logger.js` - Logging
- `registry/hybrid-registry.json` - Skill metadata
- GitHub Issues: #8810, #10401, #12151 (UserPromptSubmit stdin bug)
