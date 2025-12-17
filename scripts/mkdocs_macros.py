"""
MkDocs Macros plugin for Claude Code Marketplace.
Provides dynamic variables for documentation pages.
"""

import json
from pathlib import Path


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

    # Group skills by prefix
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

    # Register variables
    env.variables["skills_count"] = skills_count
    env.variables["skills_list"] = skills_list
    env.variables["skills_by_prefix"] = skills_by_prefix
    env.variables["pending_skills"] = pending_skills
    env.variables["total_pending"] = total_pending
    env.variables["migrated_skills"] = migrated_skills
    env.variables["migrated_count"] = migrated_count
    env.variables["projects"] = projects
    env.variables["projects_count"] = projects_count
    env.variables["progress_percent"] = progress_percent
    env.variables["mcp_count"] = mcp_count
    env.variables["pending_count"] = total_pending

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
