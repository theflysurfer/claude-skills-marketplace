"""
MkDocs Macros plugin for Claude Code Marketplace.
Provides dynamic variables for documentation pages.
"""

import json
import os
from pathlib import Path

# Category definitions with patterns
SKILL_CATEGORIES = {
    "office": {
        "name": "Office (Anthropic)",
        "description": "Skills pour manipuler les documents Office (Excel, Word, PowerPoint, PDF)",
        "patterns": ["anthropic-office-"],
        "icon": "material-file-document"
    },
    "web-design": {
        "name": "Web & Design",
        "description": "Skills pour le design web, les artifacts et les tests frontend",
        "patterns": ["anthropic-web-", "anthropic-design-", "anthropic-dev-tools-mcp"],
        "icon": "material-palette"
    },
    "dev-tools": {
        "name": "Dev Tools",
        "description": "Outils de développement, création de skills, hooks et documentation",
        "patterns": ["julien-dev-", "julien-skill-"],
        "icon": "material-tools"
    },
    "workflow": {
        "name": "Workflow",
        "description": "Automatisation des workflows, conseils IA, gestion des tâches",
        "patterns": ["julien-workflow-"],
        "icon": "material-cog"
    },
    "infrastructure": {
        "name": "Infrastructure",
        "description": "Gestion serveurs Hostinger, Docker, déploiement, VPS",
        "patterns": ["julien-infra-"],
        "icon": "material-server"
    },
    "wordpress": {
        "name": "WordPress",
        "description": "Skills WordPress, Gutenberg, thèmes Clémence, WP-CLI",
        "patterns": ["julien-clemence-", "wp-", "wordpress-"],
        "icon": "material-wordpress"
    },
    "media": {
        "name": "Media",
        "description": "Gestion médias, Jellyfin, transcoding, sous-titres",
        "patterns": ["julien-media-"],
        "icon": "material-movie"
    },
    "notion": {
        "name": "Notion",
        "description": "Intégration Notion, routing inbox, enrichissement GitHub",
        "patterns": ["notion-"],
        "icon": "material-note"
    },
    "references": {
        "name": "Références",
        "description": "Guides de référence: AHK, PowerShell, Batch, Astro, etc.",
        "patterns": ["julien-ref-"],
        "icon": "material-book"
    },
    "other": {
        "name": "Autres",
        "description": "Skills diverses: Calibre, MCP installer, etc.",
        "patterns": [],
        "icon": "material-puzzle"
    }
}


def categorize_skill(skill_name: str) -> str:
    """Determine the category of a skill based on its name."""
    for cat_id, cat_info in SKILL_CATEGORIES.items():
        if cat_id == "other":
            continue
        for pattern in cat_info["patterns"]:
            if skill_name.startswith(pattern):
                return cat_id
    return "other"


def define_env(env):
    """Define variables and macros for MkDocs."""

    # Get marketplace root (parent of scripts/)
    marketplace_root = Path(__file__).parent.parent

    # Load configurations
    config_dir = marketplace_root / "configs"
    skills_dir = marketplace_root / "skills"

    # Load project-skills-mapping.json
    mapping_file = config_dir / "project-skills-mapping.json"
    mapping = {}
    if mapping_file.exists():
        with open(mapping_file, "r", encoding="utf-8") as f:
            mapping = json.load(f)

    # Load skill-triggers.json
    triggers_file = config_dir / "skill-triggers.json"
    triggers_data = {"skills": []}
    if triggers_file.exists():
        with open(triggers_file, "r", encoding="utf-8") as f:
            triggers_data = json.load(f)

    # Count skills in skills/ directory
    skills_count = len(list(skills_dir.glob("*/SKILL.md"))) if skills_dir.exists() else 0

    # Get skills list with metadata
    skills_list = []
    for skill_dir in sorted(skills_dir.glob("*")):
        skill_file = skill_dir / "SKILL.md"
        if skill_file.exists():
            skill_info = parse_skill_frontmatter(skill_file)
            if skill_info:
                skills_list.append(skill_info)

    # ========================================
    # DEPLOYMENT STATUS: Scan what's actually deployed
    # ========================================

    # Scan global ~/.claude/skills/
    global_skills_dir = Path.home() / ".claude" / "skills"
    deployed_global = set()
    if global_skills_dir.exists():
        for skill_dir in global_skills_dir.iterdir():
            if skill_dir.is_dir() and (skill_dir / "SKILL.md").exists():
                deployed_global.add(skill_dir.name)

    # Scan current project .claude/skills/ (if exists)
    # Note: This runs at build time, so it shows marketplace's own project skills
    project_skills_dir = marketplace_root / ".claude" / "skills"
    deployed_project = set()
    if project_skills_dir.exists():
        for skill_dir in project_skills_dir.iterdir():
            if skill_dir.is_dir() and (skill_dir / "SKILL.md").exists():
                deployed_project.add(skill_dir.name)

    # Build deployment info per skill
    marketplace_skills = {s["name"] for s in skills_list}

    deployment_info = {
        "global": {
            "count": len(deployed_global),
            "skills": sorted(deployed_global),
            "from_marketplace": sorted(deployed_global & marketplace_skills),
            "external": sorted(deployed_global - marketplace_skills)
        },
        "project": {
            "count": len(deployed_project),
            "skills": sorted(deployed_project)
        },
        "marketplace": {
            "count": len(marketplace_skills),
            "deployed": sorted(deployed_global & marketplace_skills),
            "not_deployed": sorted(marketplace_skills - deployed_global)
        }
    }

    # Add deployment status to each skill
    for skill in skills_list:
        skill["deployed_global"] = skill["name"] in deployed_global
        skill["deployed_project"] = skill["name"] in deployed_project
        if skill["deployed_global"]:
            skill["scope"] = "🌐 Global"
        elif skill["deployed_project"]:
            skill["scope"] = "📁 Projet"
        else:
            skill["scope"] = "📦 Non déployé"

    # Group skills by prefix (legacy)
    skills_by_prefix = {}
    for skill in skills_list:
        parts = skill["name"].split("-")
        if len(parts) >= 2:
            prefix = f"{parts[0]}-{parts[1]}"
        else:
            prefix = "other"

        if prefix not in skills_by_prefix:
            skills_by_prefix[prefix] = []
        skills_by_prefix[prefix].append(skill)

    # Group skills by category (new)
    skills_by_category = {cat_id: [] for cat_id in SKILL_CATEGORIES.keys()}
    for skill in skills_list:
        category = categorize_skill(skill["name"])
        skills_by_category[category].append(skill)

    # Build category info with counts
    categories_info = {}
    for cat_id, cat_data in SKILL_CATEGORIES.items():
        categories_info[cat_id] = {
            "id": cat_id,
            "name": cat_data["name"],
            "description": cat_data["description"],
            "icon": cat_data["icon"],
            "skills": skills_by_category[cat_id],
            "count": len(skills_by_category[cat_id])
        }

    # Count pending skills
    pending_skills = mapping.get("skills_inventory", {}).get("pending", [])
    total_pending = sum(s.get("count", 0) for s in pending_skills)

    # Count migrated skills
    migrated_skills = mapping.get("skills_inventory", {}).get("migrated", [])
    migrated_count = len(migrated_skills)

    # Count projects
    projects = mapping.get("projects", {})
    projects_count = len(projects)

    # Calculate progress
    total_skills = skills_count + total_pending
    progress_percent = round((skills_count / total_skills * 100) if total_skills > 0 else 0)

    # Count MCP servers (estimate based on skills with mcp- prefix)
    mcp_count = len([s for s in skills_list if "mcp" in s["name"].lower()])
    if mcp_count == 0:
        mcp_count = 28  # Default from plan

    # Load MCP registry for mcp_count
    mcp_registry_file = config_dir / "mcp-registry.json"
    if mcp_registry_file.exists():
        with open(mcp_registry_file, "r", encoding="utf-8") as f:
            mcp_registry = json.load(f)
            mcp_count = len(mcp_registry.get("mcps", {}))
            mcp_categories = mcp_registry.get("categories", {})
            mcp_list = mcp_registry.get("mcps", {})
    else:
        mcp_count = 27
        mcp_categories = {}
        mcp_list = {}

    # Register variables
    env.variables["skills_count"] = skills_count
    env.variables["skills_list"] = skills_list
    env.variables["skills_by_prefix"] = skills_by_prefix
    env.variables["skills_by_category"] = skills_by_category
    env.variables["categories_info"] = categories_info
    env.variables["pending_skills"] = pending_skills
    env.variables["total_pending"] = total_pending
    env.variables["migrated_skills"] = migrated_skills
    env.variables["migrated_count"] = migrated_count
    env.variables["projects"] = projects
    env.variables["projects_count"] = projects_count
    env.variables["progress_percent"] = progress_percent
    env.variables["mcp_count"] = mcp_count
    env.variables["mcp_list"] = mcp_list
    env.variables["mcp_categories"] = mcp_categories
    env.variables["pending_count"] = total_pending

    # Deployment info
    env.variables["deployment_info"] = deployment_info
    env.variables["deployed_global_count"] = deployment_info["global"]["count"]
    env.variables["deployed_global_skills"] = deployment_info["global"]["skills"]
    env.variables["not_deployed_count"] = len(deployment_info["marketplace"]["not_deployed"])
    env.variables["not_deployed_skills"] = deployment_info["marketplace"]["not_deployed"]

    # Register individual category variables for easy access
    for cat_id, cat_info in categories_info.items():
        env.variables[f"cat_{cat_id}"] = cat_info

    # Register macros
    @env.macro
    def skill_badge(status):
        """Generate a status badge."""
        colors = {
            "active": "green",
            "pending": "orange",
            "migrated": "blue",
            "inactive": "red"
        }
        color = colors.get(status, "gray")
        return f'<span class="status-{status}">{status}</span>'

    @env.macro
    def progress_bar(percent):
        """Generate a progress bar."""
        return f'''
        <div class="progress-bar">
            <div class="fill" style="width: {percent}%"></div>
        </div>
        <small>{percent}% complete</small>
        '''

    @env.macro
    def skills_table(category_id: str, show_scope: bool = True) -> str:
        """Generate a markdown table of skills for a given category."""
        if category_id not in categories_info:
            return f"*Catégorie '{category_id}' non trouvée*"

        cat = categories_info[category_id]
        if not cat["skills"]:
            return "*Aucune skill dans cette catégorie*"

        if show_scope:
            lines = ["| Skill | Description | Scope | Triggers |", "|-------|-------------|-------|----------|"]
        else:
            lines = ["| Skill | Description | Triggers |", "|-------|-------------|----------|"]

        for skill in sorted(cat["skills"], key=lambda x: x["name"]):
            name = skill["name"]
            desc = skill["description"][:50] + "..." if len(skill["description"]) > 50 else skill["description"]
            triggers = skill["triggers_count"]
            scope = skill.get("scope", "?")
            if show_scope:
                lines.append(f"| `{name}` | {desc} | {scope} | {triggers} |")
            else:
                lines.append(f"| `{name}` | {desc} | {triggers} |")

        return "\n".join(lines)

    @env.macro
    def deployment_summary() -> str:
        """Generate a deployment status summary."""
        info = deployment_info
        global_count = info["global"]["count"]
        marketplace_count = info["marketplace"]["count"]
        not_deployed = info["marketplace"]["not_deployed"]
        not_deployed_count = len(not_deployed)

        lines = [
            "## État du déploiement",
            "",
            f"| Scope | Count | Status |",
            f"|-------|-------|--------|",
            f"| 🌐 Global (`~/.claude/skills/`) | **{global_count}** | Déployées |",
            f"| 📦 Marketplace | **{marketplace_count}** | Disponibles |",
            f"| ⚠️ Non déployées | **{not_deployed_count}** | À synchroniser |",
            "",
        ]

        if not_deployed:
            lines.append("### Skills non déployées")
            lines.append("")
            lines.append("Ces skills du marketplace ne sont pas dans `~/.claude/skills/` :")
            lines.append("")
            for skill_name in not_deployed[:20]:  # Limit to 20
                lines.append(f"- `{skill_name}`")
            if len(not_deployed) > 20:
                lines.append(f"- *... et {len(not_deployed) - 20} autres*")
            lines.append("")
            lines.append("> Pour déployer : `/sync`")

        return "\n".join(lines)

    @env.macro
    def category_summary() -> str:
        """Generate a summary table of all categories."""
        lines = ["| Catégorie | Skills | Description |", "|-----------|--------|-------------|"]
        for cat_id, cat in categories_info.items():
            if cat["count"] > 0:
                link = f"[{cat['name']}](categories/{cat_id}.md)"
                lines.append(f"| {link} | {cat['count']} | {cat['description'][:50]}... |")
        return "\n".join(lines)

    @env.macro
    def mcp_table(category: str = None) -> str:
        """Generate a markdown table of MCPs, optionally filtered by category."""
        if not mcp_list:
            return "*Aucun MCP disponible*"

        lines = ["| MCP | Description | Type |", "|-----|-------------|------|"]
        for name, info in sorted(mcp_list.items()):
            if category and info.get("category") != category:
                continue
            desc = info.get("description", "")[:50]
            install_type = info.get("install_type", "npx")
            recommended = " ⭐" if info.get("recommended") else ""
            lines.append(f"| `{name}`{recommended} | {desc} | {install_type} |")

        return "\n".join(lines) if len(lines) > 2 else "*Aucun MCP dans cette catégorie*"

    # ========================================
    # HOOKS MACROS
    # ========================================

    @env.macro
    def hooks_table(category: str = None, show_templates: bool = True) -> str:
        """Generate a markdown table of hooks from hooks-registry.json."""
        hooks_file = config_dir / "hooks-registry.json"
        if not hooks_file.exists():
            return "*Registre hooks non trouvé*"

        try:
            with open(hooks_file, "r", encoding="utf-8") as f:
                hooks_data = json.load(f)
        except Exception:
            return "*Erreur lecture hooks-registry.json*"

        hooks = hooks_data.get("hooks", {})
        if not hooks:
            return "*Aucun hook enregistré*"

        lines = ["| Hook | Event | Description | Scope |", "|------|-------|-------------|-------|"]

        for hook_id, info in sorted(hooks.items()):
            if category and info.get("category") != category:
                continue
            if not show_templates and info.get("template"):
                continue

            name = info.get("name", hook_id)
            event = info.get("event", "?")
            matcher = info.get("matcher", "")
            if matcher:
                event = f"{event} ({matcher})"
            desc = info.get("description", "")[:45]
            if len(info.get("description", "")) > 45:
                desc += "..."

            scope = info.get("scope", "global")
            if scope == "global":
                scope_icon = "🌐"
            elif scope == "template":
                scope_icon = "📋"
            else:
                scope_icon = "📁"

            lines.append(f"| `{hook_id}` | {event} | {desc} | {scope_icon} {scope} |")

        return "\n".join(lines) if len(lines) > 2 else "*Aucun hook dans cette catégorie*"

    @env.macro
    def hooks_by_category() -> str:
        """Generate hooks grouped by category."""
        hooks_file = config_dir / "hooks-registry.json"
        if not hooks_file.exists():
            return "*Registre hooks non trouvé*"

        try:
            with open(hooks_file, "r", encoding="utf-8") as f:
                hooks_data = json.load(f)
        except Exception:
            return "*Erreur lecture hooks-registry.json*"

        hooks = hooks_data.get("hooks", {})
        categories = hooks_data.get("categories", {})

        # Group by category
        by_cat = {}
        for hook_id, info in hooks.items():
            cat = info.get("category", "other")
            if cat not in by_cat:
                by_cat[cat] = []
            by_cat[cat].append((hook_id, info))

        lines = []
        for cat_id, cat_hooks in by_cat.items():
            cat_info = categories.get(cat_id, {"name": cat_id, "description": ""})
            lines.append(f"### {cat_info.get('name', cat_id)}")
            lines.append("")
            lines.append(f"{cat_info.get('description', '')}")
            lines.append("")
            lines.append("| Hook | Event | Scope |")
            lines.append("|------|-------|-------|")
            for hook_id, info in cat_hooks:
                event = info.get("event", "?")
                scope = "📋 template" if info.get("template") else "🌐 global"
                lines.append(f"| `{hook_id}` | {event} | {scope} |")
            lines.append("")

        return "\n".join(lines)

    @env.macro
    def hooks_summary() -> str:
        """Generate a summary of hooks status."""
        hooks_file = config_dir / "hooks-registry.json"
        if not hooks_file.exists():
            return "*Registre hooks non trouvé*"

        try:
            with open(hooks_file, "r", encoding="utf-8") as f:
                hooks_data = json.load(f)
        except Exception:
            return "*Erreur lecture hooks-registry.json*"

        hooks = hooks_data.get("hooks", {})
        deployment = hooks_data.get("deployment", {})

        total = len(hooks)
        global_hooks = len([h for h in hooks.values() if not h.get("template")])
        templates = len([h for h in hooks.values() if h.get("template")])

        lines = [
            "## État des Hooks",
            "",
            "| Type | Count |",
            "|------|-------|",
            f"| 🌐 Hooks globaux | **{global_hooks}** |",
            f"| 📋 Templates | **{templates}** |",
            f"| **Total** | **{total}** |",
            "",
        ]

        # Check deployed hooks
        deployed = deployment.get("global_hooks", [])
        if deployed:
            lines.append(f"> **{len(deployed)}** hooks déployés automatiquement via `/sync`")

        return "\n".join(lines)


def parse_skill_frontmatter(skill_file: Path) -> dict:
    """Parse YAML frontmatter from a SKILL.md file."""
    try:
        content = skill_file.read_text(encoding="utf-8")

        # Check for YAML frontmatter
        if not content.startswith("---"):
            return None

        # Find end of frontmatter
        end_idx = content.find("---", 3)
        if end_idx == -1:
            return None

        frontmatter = content[3:end_idx].strip()

        # Simple YAML parsing (avoiding external dependency)
        result = {
            "name": "",
            "description": "",
            "triggers": [],
            "triggers_count": 0
        }

        current_key = None
        for line in frontmatter.split("\n"):
            line = line.strip()
            if not line:
                continue

            if line.startswith("name:"):
                result["name"] = line[5:].strip().strip('"\'')
            elif line.startswith("description:"):
                result["description"] = line[12:].strip().strip('"\'')
            elif line.startswith("triggers:"):
                current_key = "triggers"
            elif current_key == "triggers" and line.startswith("- "):
                result["triggers"].append(line[2:].strip().strip('"\''))

        result["triggers_count"] = len(result["triggers"])

        return result if result["name"] else None

    except Exception:
        return None
