#!/usr/bin/env python3
"""
Discover hooks from all sources: marketplace, global, and projects.
Generates a unified hooks-inventory.json.
"""
import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Paths
MARKETPLACE_ROOT = Path(__file__).parent.parent
HOOKS_REGISTRY = MARKETPLACE_ROOT / "configs" / "hooks-registry.json"
PROJECTS_REGISTRY = MARKETPLACE_ROOT / "configs" / "projects-registry.json"
OUTPUT_FILE = MARKETPLACE_ROOT / "configs" / "hooks-inventory.json"
HOME_SETTINGS = Path.home() / ".claude" / "settings.json"


def load_json(path: Path) -> dict:
    """Load JSON file, return empty dict if not found."""
    if path.exists():
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def extract_hooks_from_settings(settings: dict) -> list:
    """Extract hook definitions from a settings.json file."""
    hooks = []
    hooks_config = settings.get('hooks', {})

    for event, event_hooks in hooks_config.items():
        if not isinstance(event_hooks, list):
            event_hooks = [event_hooks]

        for hook in event_hooks:
            if isinstance(hook, dict):
                # Nested structure with matcher
                matcher = hook.get('matcher', '*')
                inner_hooks = hook.get('hooks', [])
                for inner in inner_hooks:
                    hooks.append({
                        'event': event,
                        'matcher': matcher,
                        'type': inner.get('type', 'command'),
                        'command': inner.get('command', ''),
                        'timeout': inner.get('timeout', 10)
                    })
            elif isinstance(hook, str):
                # Simple command string
                hooks.append({
                    'event': event,
                    'type': 'command',
                    'command': hook
                })

    return hooks


def discover_marketplace_hooks() -> list:
    """Load hooks from marketplace registry."""
    registry = load_json(HOOKS_REGISTRY)
    hooks = []

    for hook_id, hook_data in registry.get('hooks', {}).items():
        hooks.append({
            'id': hook_id,
            'name': hook_data.get('name', hook_id),
            'event': hook_data.get('event'),
            'matcher': hook_data.get('matcher'),
            'description': hook_data.get('description', ''),
            'category': hook_data.get('category', 'other'),
            'scope': hook_data.get('scope', 'global'),
            'template': hook_data.get('template', False),
            'script': hook_data.get('script'),
            'command': hook_data.get('command'),
            'external': hook_data.get('external', False)
        })

    return hooks


def discover_global_hooks() -> list:
    """Load hooks from user's global settings."""
    settings = load_json(HOME_SETTINGS)
    return extract_hooks_from_settings(settings)


def discover_project_hooks() -> dict:
    """Scan all registered projects for hooks."""
    projects_registry = load_json(PROJECTS_REGISTRY)
    project_hooks = {}

    projects = projects_registry.get('projects', {})

    for project_name, project_data in projects.items():
        project_path = Path(project_data.get('path', ''))
        settings_path = project_path / '.claude' / 'settings.json'

        if settings_path.exists():
            settings = load_json(settings_path)
            hooks = extract_hooks_from_settings(settings)

            if hooks:
                project_hooks[project_name] = {
                    'path': str(project_path),
                    'hooks': hooks
                }

    return project_hooks


def main():
    """Main discovery process."""
    print("Discovering hooks from all sources...")

    # Discover from all sources
    marketplace = discover_marketplace_hooks()
    print(f"  - Marketplace: {len(marketplace)} hooks")

    global_hooks = discover_global_hooks()
    print(f"  - Global (~/.claude/settings.json): {len(global_hooks)} hooks")

    project_hooks = discover_project_hooks()
    total_project_hooks = sum(len(p['hooks']) for p in project_hooks.values())
    print(f"  - Projects: {total_project_hooks} hooks in {len(project_hooks)} projects")

    # Build inventory
    inventory = {
        "version": "1.0.0",
        "generated": datetime.now().isoformat(),
        "summary": {
            "marketplace": len(marketplace),
            "global": len(global_hooks),
            "projects": total_project_hooks,
            "total": len(marketplace) + len(global_hooks) + total_project_hooks
        },
        "sources": {
            "marketplace": {
                "path": str(HOOKS_REGISTRY),
                "hooks": marketplace
            },
            "global": {
                "path": str(HOME_SETTINGS),
                "hooks": global_hooks
            },
            "projects": project_hooks
        }
    }

    # Write output
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(inventory, f, indent=2, ensure_ascii=False)

    print(f"\nInventory saved to: {OUTPUT_FILE}")
    print(f"Total: {inventory['summary']['total']} hooks discovered")

    return 0


if __name__ == '__main__':
    sys.exit(main())
