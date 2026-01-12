#!/usr/bin/env python3
"""
Generate deployment status tables from registries.
Outputs markdown tables for skills, hooks, and commands.

Usage:
    python generate-status-tables.py [--output FILE] [--section SECTION]

Sections: skills, hooks, commands, servers, all (default)
"""

import json
import argparse
from pathlib import Path
from datetime import datetime

# Paths
SCRIPT_DIR = Path(__file__).parent
CONFIGS_DIR = SCRIPT_DIR.parent / "configs"

def load_json(path: Path) -> dict:
    """Load JSON file safely."""
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def generate_skills_table() -> str:
    """Generate skills deployment status table."""
    registry = load_json(CONFIGS_DIR / "hybrid-registry.json")
    sync_config = load_json(CONFIGS_DIR / "sync-config.json")

    skills_to_sync = set(sync_config.get("skills_to_sync", []))
    skills = registry.get("skills", {})

    lines = [
        "## Skills Deployment Status",
        "",
        f"Total: {len(skills)} skills indexed",
        "",
        "| Skill | Source | Synced Global | Category |",
        "|-------|--------|---------------|----------|"
    ]

    # Group by source
    by_source = {}
    for name, data in skills.items():
        source = data.get("source", "unknown")
        if source not in by_source:
            by_source[source] = []
        by_source[source].append((name, data))

    # Sort sources: marketplace, global, then projects
    source_order = ["marketplace", "global"]
    for source in sorted(by_source.keys()):
        if source not in source_order:
            source_order.append(source)

    for source in source_order:
        if source not in by_source:
            continue
        skills_list = sorted(by_source[source], key=lambda x: x[0])
        for name, data in skills_list:
            synced = "Yes" if name in skills_to_sync else "-"
            category = data.get("category", "-")
            lines.append(f"| `{name}` | {source} | {synced} | {category} |")

    return "\n".join(lines)

def generate_hooks_table() -> str:
    """Generate hooks deployment status table."""
    hooks_registry = load_json(CONFIGS_DIR / "hooks-registry.json")
    sync_config = load_json(CONFIGS_DIR / "sync-config.json")

    hooks_to_sync = sync_config.get("hooks_to_sync", {})
    global_hooks = set(hooks_to_sync.get("global", []))
    optional_hooks = set(hooks_to_sync.get("optional", []))

    lines = [
        "## Hooks Deployment Status",
        "",
        f"Global: {len(global_hooks)} | Optional: {len(optional_hooks)}",
        "",
        "| Hook | Event | Status | Category |",
        "|------|-------|--------|----------|"
    ]

    hooks = hooks_registry.get("hooks", {})
    for name, data in sorted(hooks.items()):
        event = data.get("event", "-")
        category = data.get("category", "-")
        if name in global_hooks:
            status = "Active (global)"
        elif name in optional_hooks:
            status = "Optional"
        else:
            status = "Template"
        lines.append(f"| `{name}` | {event} | {status} | {category} |")

    return "\n".join(lines)

def generate_commands_table() -> str:
    """Generate commands deployment status table."""
    sync_config = load_json(CONFIGS_DIR / "sync-config.json")
    commands = sync_config.get("commands_to_sync", [])

    lines = [
        "## Commands Deployment Status",
        "",
        f"Total: {len(commands)} commands",
        "",
        "| Command | Synced |",
        "|---------|--------|"
    ]

    for cmd in sorted(commands):
        name = cmd.replace(".md", "")
        lines.append(f"| `/{name}` | Yes |")

    return "\n".join(lines)

def generate_servers_table() -> str:
    """Generate servers deployment status table."""
    servers_registry = load_json(CONFIGS_DIR / "servers-registry.json")
    servers = servers_registry.get("servers", {})

    lines = [
        "## Servers Status",
        "",
        f"Total: {len(servers)} servers configured",
        "",
        "| Server | Port | Startup | Category |",
        "|--------|------|---------|----------|"
    ]

    for name, data in sorted(servers.items()):
        port = data.get("port", "-")
        startup = "Yes" if data.get("startup") else "No"
        category = data.get("category", "-")
        lines.append(f"| `{name}` | {port} | {startup} | {category} |")

    return "\n".join(lines)

def generate_summary() -> str:
    """Generate summary counts."""
    registry = load_json(CONFIGS_DIR / "hybrid-registry.json")
    hooks_registry = load_json(CONFIGS_DIR / "hooks-registry.json")
    sync_config = load_json(CONFIGS_DIR / "sync-config.json")
    servers_registry = load_json(CONFIGS_DIR / "servers-registry.json")

    skills_count = len(registry.get("skills", {}))
    hooks_count = len(hooks_registry.get("hooks", {}))
    commands_count = len(sync_config.get("commands_to_sync", []))
    servers_count = len(servers_registry.get("servers", {}))

    lines = [
        "# Marketplace Deployment Status",
        "",
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        "## Summary",
        "",
        "| Component | Count |",
        "|-----------|-------|",
        f"| Skills indexed | {skills_count} |",
        f"| Hooks configured | {hooks_count} |",
        f"| Commands available | {commands_count} |",
        f"| Servers managed | {servers_count} |",
        ""
    ]

    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description="Generate deployment status tables")
    parser.add_argument("--output", "-o", help="Output file (default: stdout)")
    parser.add_argument("--section", "-s", default="all",
                       choices=["skills", "hooks", "commands", "servers", "all"],
                       help="Section to generate")
    args = parser.parse_args()

    sections = {
        "skills": generate_skills_table,
        "hooks": generate_hooks_table,
        "commands": generate_commands_table,
        "servers": generate_servers_table,
    }

    output_parts = [generate_summary()]

    if args.section == "all":
        for name, func in sections.items():
            output_parts.append(func())
            output_parts.append("")
    else:
        output_parts.append(sections[args.section]())

    output = "\n".join(output_parts)

    if args.output:
        Path(args.output).write_text(output, encoding='utf-8')
        print(f"Status tables written to: {args.output}")
    else:
        print(output)

if __name__ == "__main__":
    main()
