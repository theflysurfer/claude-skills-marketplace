#!/usr/bin/env python3
"""
Generate Skill Catalog - Creates a formatted catalog of all available skills.

Outputs:
  - Markdown catalog for docs/skills/catalog.md
  - JSON summary for skill-help skill
  - Console output for quick reference

Usage:
    python scripts/generate-skill-catalog.py [--output PATH] [--format FORMAT]
"""

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

# Category configuration
CATEGORY_CONFIG = {
    "office": {"emoji": "🏢", "name": "Office Documents", "priority": 1},
    "dev": {"emoji": "🛠️", "name": "Development", "priority": 2},
    "infra": {"emoji": "🖥️", "name": "Infrastructure", "priority": 3},
    "web": {"emoji": "🌐", "name": "Web Development", "priority": 4},
    "skill": {"emoji": "⚙️", "name": "Skill Management", "priority": 5},
    "workflow": {"emoji": "🔄", "name": "Workflows", "priority": 6},
    "ref": {"emoji": "📚", "name": "References", "priority": 7},
    "media": {"emoji": "🎬", "name": "Media", "priority": 8},
    "wp": {"emoji": "📝", "name": "WordPress", "priority": 9},
    "mcp": {"emoji": "🔌", "name": "MCP Servers", "priority": 10},
    "design": {"emoji": "🎨", "name": "Design", "priority": 11},
    "other": {"emoji": "📦", "name": "Other", "priority": 99},
}


def load_registry() -> dict:
    """Load the hybrid registry."""
    # Try multiple locations
    paths = [
        Path.home() / ".claude" / "configs" / "hybrid-registry.json",
        Path(__file__).parent.parent / "configs" / "hybrid-registry.json",
    ]

    for path in paths:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)

    raise FileNotFoundError("hybrid-registry.json not found")


def extract_category(skill_name: str) -> str:
    """Extract category from skill name prefix."""
    parts = skill_name.split("-")

    if len(parts) >= 2:
        # Handle prefixed names like julien-dev-* or anthropic-office-*
        if parts[0] in ["anthropic", "julien"]:
            return parts[1] if len(parts) > 1 else "other"
        return parts[0]

    return "other"


def group_by_category(skills: dict) -> dict:
    """Group skills by category."""
    categories = defaultdict(list)

    for name, info in skills.items():
        category = extract_category(name)
        categories[category].append({
            "name": name,
            "description": info.get("description", ""),
            "triggers": info.get("triggers", [])[:5],  # First 5 triggers
            "source": info.get("locations", [{}])[0].get("source", "unknown"),
        })

    # Sort skills within each category
    for cat in categories:
        categories[cat].sort(key=lambda x: x["name"])

    return dict(categories)


def generate_markdown(categories: dict, total_count: int) -> str:
    """Generate Markdown catalog."""
    lines = [
        "# Skill Catalog",
        "",
        f"**Total: {total_count} skills available**",
        "",
        "---",
        "",
    ]

    # Sort categories by priority
    sorted_cats = sorted(
        categories.items(),
        key=lambda x: CATEGORY_CONFIG.get(x[0], {}).get("priority", 50)
    )

    for cat_id, skills in sorted_cats:
        config = CATEGORY_CONFIG.get(cat_id, {"emoji": "📦", "name": cat_id.title()})
        emoji = config["emoji"]
        name = config["name"]

        lines.append(f"## {emoji} {name} ({len(skills)} skills)")
        lines.append("")
        lines.append("| Skill | Description |")
        lines.append("|-------|-------------|")

        for skill in skills:
            desc = skill["description"][:80] + "..." if len(skill["description"]) > 80 else skill["description"]
            lines.append(f"| `{skill['name']}` | {desc} |")

        lines.append("")

    # Usage section
    lines.extend([
        "---",
        "",
        "## Usage",
        "",
        "- Type naturally - the router will suggest relevant skills",
        "- Invoke directly: `Skill(\"skill-name\")`",
        "- Run `/show-routing` to see last suggestions",
        "- Run `/help` for interactive exploration",
        "",
    ])

    return "\n".join(lines)


def generate_json_summary(categories: dict, total_count: int) -> dict:
    """Generate JSON summary for programmatic use."""
    return {
        "total_count": total_count,
        "categories": {
            cat_id: {
                "name": CATEGORY_CONFIG.get(cat_id, {}).get("name", cat_id.title()),
                "emoji": CATEGORY_CONFIG.get(cat_id, {}).get("emoji", "📦"),
                "count": len(skills),
                "skills": [s["name"] for s in skills]
            }
            for cat_id, skills in categories.items()
        }
    }


def generate_console_output(categories: dict, total_count: int) -> str:
    """Generate console-friendly output."""
    lines = [
        "",
        f"📚 Skill Catalog ({total_count} skills)",
        "=" * 40,
        "",
    ]

    sorted_cats = sorted(
        categories.items(),
        key=lambda x: CATEGORY_CONFIG.get(x[0], {}).get("priority", 50)
    )

    for cat_id, skills in sorted_cats:
        config = CATEGORY_CONFIG.get(cat_id, {"emoji": "📦", "name": cat_id.title()})
        lines.append(f"{config['emoji']} {config['name']} ({len(skills)})")

        for skill in skills[:3]:  # Show first 3 per category
            lines.append(f"  • {skill['name']}")

        if len(skills) > 3:
            lines.append(f"  ... and {len(skills) - 3} more")

        lines.append("")

    lines.extend([
        "💡 Usage: Skill(\"skill-name\") or /help",
        "",
    ])

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Generate skill catalog")
    parser.add_argument(
        "--output", "-o",
        type=Path,
        default=None,
        help="Output file path (default: stdout)"
    )
    parser.add_argument(
        "--format", "-f",
        choices=["markdown", "json", "console"],
        default="console",
        help="Output format (default: console)"
    )

    args = parser.parse_args()

    try:
        registry = load_registry()
        skills = registry.get("skills", {})
        total_count = len(skills)

        categories = group_by_category(skills)

        if args.format == "markdown":
            output = generate_markdown(categories, total_count)
        elif args.format == "json":
            output = json.dumps(generate_json_summary(categories, total_count), indent=2)
        else:
            output = generate_console_output(categories, total_count)

        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(output, encoding="utf-8")
            print(f"Catalog written to {args.output}")
        else:
            print(output)

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        print("Run /sync or discover-skills.py first.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
