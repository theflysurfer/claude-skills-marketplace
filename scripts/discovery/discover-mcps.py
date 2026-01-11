#!/usr/bin/env python3
"""
Discover MCPs - Scans installed vs available MCPs.
Reads mcp-registry.json and compares with .mcp.json files.

Usage:
    python discover-mcps.py              # Show all MCPs status
    python discover-mcps.py --installed  # Show only installed
    python discover-mcps.py --available  # Show only available (not installed)
    python discover-mcps.py --json       # Output as JSON
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Set

# Paths
CLAUDE_HOME = Path.home() / ".claude"
MARKETPLACE_ROOT = Path(__file__).parent.parent

# Try multiple registry locations (global first, then marketplace)
REGISTRY_LOCATIONS = [
    CLAUDE_HOME / "configs" / "mcp-registry.json",
    MARKETPLACE_ROOT / "configs" / "mcp-registry.json",
]
GLOBAL_MCP_FILE = CLAUDE_HOME / ".mcp.json"


def find_registry() -> Optional[Path]:
    """Find the MCP registry file."""
    for path in REGISTRY_LOCATIONS:
        if path.exists():
            return path
    return None


def load_registry() -> Dict:
    """Load the centralized MCP registry."""
    registry_file = find_registry()
    if not registry_file:
        print(f"[ERROR] Registry not found in: {REGISTRY_LOCATIONS}", file=sys.stderr)
        return {}

    with open(registry_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_mcp_config(path: Path) -> Dict:
    """Load a .mcp.json config file."""
    if not path.exists():
        return {}

    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Handle both formats: with and without mcpServers wrapper
        if "mcpServers" in data:
            return data["mcpServers"]
        return data
    except Exception as e:
        print(f"[WARN] Failed to parse {path}: {e}", file=sys.stderr)
        return {}


def find_project_mcp_files() -> List[Path]:
    """Find all project-level .mcp.json files."""
    project_files = []

    # Check common project roots
    coding_roots = [
        Path.home() / "OneDrive" / "Coding" / "_Projets de code",
        Path.home() / "OneDrive" / "Coding" / "_Référentiels de code",
        Path.home() / "Projects",
        Path.home() / "dev",
    ]

    for root in coding_roots:
        if root.exists():
            # Look for .claude/.mcp.json in project folders
            for project_dir in root.iterdir():
                if project_dir.is_dir():
                    mcp_file = project_dir / ".claude" / ".mcp.json"
                    if mcp_file.exists():
                        project_files.append(mcp_file)

    return project_files


def get_installed_mcps() -> Dict[str, Dict]:
    """Get all installed MCPs from global and project configs."""
    installed = {}

    # Global MCPs
    global_mcps = load_mcp_config(GLOBAL_MCP_FILE)
    for name, config in global_mcps.items():
        installed[name] = {
            "config": config,
            "source": "global",
            "path": str(GLOBAL_MCP_FILE)
        }

    # Project MCPs
    for project_file in find_project_mcp_files():
        project_mcps = load_mcp_config(project_file)
        for name, config in project_mcps.items():
            if name not in installed:
                installed[name] = {
                    "config": config,
                    "source": f"project:{project_file.parent.parent.name}",
                    "path": str(project_file)
                }

    return installed


def compare_mcps(registry: Dict, installed: Dict) -> Dict:
    """Compare registry MCPs with installed ones."""
    registry_mcps = registry.get("mcps", {})
    categories = registry.get("categories", {})

    result = {
        "installed": [],
        "available": [],
        "unknown": [],  # Installed but not in registry
        "by_category": {}
    }

    # Check registry MCPs
    for name, info in registry_mcps.items():
        category = info.get("category", "utilities")

        if category not in result["by_category"]:
            cat_info = categories.get(category, {})
            result["by_category"][category] = {
                "name": cat_info.get("name", category),
                "icon": cat_info.get("icon", ""),
                "mcps": []
            }

        mcp_entry = {
            "name": name,
            "description": info.get("description", ""),
            "triggers": info.get("triggers", []),
            "env_required": info.get("env_required", []),
            "recommended": info.get("recommended", False),
        }

        if name in installed:
            mcp_entry["installed"] = True
            mcp_entry["source"] = installed[name]["source"]
            result["installed"].append(mcp_entry)
        else:
            mcp_entry["installed"] = False
            result["available"].append(mcp_entry)

        result["by_category"][category]["mcps"].append(mcp_entry)

    # Check for unknown MCPs (installed but not in registry)
    registry_names = set(registry_mcps.keys())
    for name, info in installed.items():
        if name not in registry_names:
            result["unknown"].append({
                "name": name,
                "source": info["source"],
                "path": info["path"]
            })

    return result


def print_report(comparison: Dict, show_installed: bool = True, show_available: bool = True):
    """Print a formatted report."""
    print("\n" + "=" * 60)
    print("MCP Discovery Report")
    print("=" * 60)

    # Summary
    total_installed = len(comparison["installed"])
    total_available = len(comparison["available"])
    total_unknown = len(comparison["unknown"])

    print(f"\nSummary:")
    print(f"  Installed: {total_installed}")
    print(f"  Available: {total_available}")
    if total_unknown > 0:
        print(f"  Unknown (not in registry): {total_unknown}")

    # By category
    if show_installed or show_available:
        print("\n" + "-" * 60)
        print("By Category:")
        print("-" * 60)

        for cat_id, cat_info in comparison["by_category"].items():
            icon = cat_info.get("icon", "")
            name = cat_info.get("name", cat_id)
            mcps = cat_info.get("mcps", [])

            # Filter based on flags
            if not show_installed:
                mcps = [m for m in mcps if not m.get("installed")]
            if not show_available:
                mcps = [m for m in mcps if m.get("installed")]

            if not mcps:
                continue

            print(f"\n{icon} {name}")
            for mcp in mcps:
                status = "[x]" if mcp.get("installed") else "[ ]"
                rec = " *" if mcp.get("recommended") else ""
                source = f" ({mcp.get('source')})" if mcp.get("installed") else ""
                print(f"  {status} {mcp['name']}{rec}{source}")
                if mcp.get("description"):
                    print(f"      {mcp['description']}")

    # Unknown MCPs
    if comparison["unknown"]:
        print("\n" + "-" * 60)
        print("Unknown MCPs (installed but not in registry):")
        print("-" * 60)
        for mcp in comparison["unknown"]:
            print(f"  - {mcp['name']} ({mcp['source']})")

    print("\n" + "=" * 60)
    print("Legend: [x] = installed, * = recommended")
    print("=" * 60 + "\n")


def main():
    args = set(sys.argv[1:])

    # Load data
    registry = load_registry()
    if not registry:
        sys.exit(1)

    installed = get_installed_mcps()
    comparison = compare_mcps(registry, installed)

    # Output
    if "--json" in args:
        print(json.dumps(comparison, indent=2, ensure_ascii=False))
    else:
        show_installed = "--available" not in args
        show_available = "--installed" not in args
        print_report(comparison, show_installed, show_available)


if __name__ == "__main__":
    main()
