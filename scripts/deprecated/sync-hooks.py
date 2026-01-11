#!/usr/bin/env python3
"""
Sync Hooks - Generate and apply hooks configuration to ~/.claude/settings.json

This script:
1. Reads hooks-registry.json
2. Generates the hooks configuration
3. Updates ~/.claude/settings.json with the hooks

Usage:
    python scripts/sync-hooks.py              # Preview changes
    python scripts/sync-hooks.py --apply      # Apply changes
    python scripts/sync-hooks.py --dry-run    # Show what would be done
"""

import json
import sys
from pathlib import Path
from typing import Any

# ========================================
# CONFIGURATION
# ========================================

MARKETPLACE_ROOT = Path(__file__).parent.parent
HOOKS_REGISTRY = MARKETPLACE_ROOT / "configs" / "hooks-registry.json"
SYNC_CONFIG = MARKETPLACE_ROOT / "configs" / "sync-config.json"
SETTINGS_FILE = Path.home() / ".claude" / "settings.json"

# ========================================
# FUNCTIONS
# ========================================

def load_json(path: Path) -> dict:
    """Load JSON file."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {path}: {e}", file=sys.stderr)
        return {}


def save_json(path: Path, data: dict) -> bool:
    """Save JSON file."""
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving {path}: {e}", file=sys.stderr)
        return False


def generate_hook_command(hook_id: str, hook_info: dict) -> dict:
    """Generate a hook command configuration."""
    if hook_info.get("external"):
        # External command (like idle-queue)
        return {
            "type": "command",
            "command": hook_info.get("command", ""),
            "timeout": hook_info.get("timeout", 10)
        }

    script = hook_info.get("script", "")
    if not script:
        return None

    # Determine script path
    if script.startswith("scripts/"):
        # Core script from marketplace
        script_path = MARKETPLACE_ROOT / script
    elif script.startswith("hooks/"):
        # Template - use home path
        script_path = Path.home() / ".claude" / script.replace("hooks/", "hooks/")
    else:
        script_path = Path(script)

    # Generate command based on extension
    if script.endswith(".js"):
        command = f'node "{script_path}"'
    elif script.endswith(".py"):
        # Use runpy for robustness on Windows
        command = f'python -c "import runpy;from pathlib import Path;runpy.run_path(str(Path(r\\"{script_path}\\")),run_name=\\"__main__\\")"'
    else:
        command = str(script_path)

    return {
        "type": "command",
        "command": command,
        "timeout": hook_info.get("timeout", 10)
    }


def generate_hooks_config(registry: dict, hooks_to_include: list) -> dict:
    """Generate the hooks configuration for settings.json."""
    hooks = registry.get("hooks", {})
    config = {}

    # Group hooks by event
    by_event = {}
    for hook_id in hooks_to_include:
        if hook_id not in hooks:
            print(f"Warning: Hook '{hook_id}' not found in registry", file=sys.stderr)
            continue

        hook_info = hooks[hook_id]
        if hook_info.get("template"):
            continue  # Skip templates

        event = hook_info.get("event", "")
        if not event:
            continue

        if event not in by_event:
            by_event[event] = []

        hook_cmd = generate_hook_command(hook_id, hook_info)
        if hook_cmd:
            matcher = hook_info.get("matcher")
            by_event[event].append({
                "id": hook_id,
                "matcher": matcher,
                "command": hook_cmd
            })

    # Build config structure
    for event, event_hooks in by_event.items():
        # Group by matcher
        by_matcher = {}
        for h in event_hooks:
            matcher = h.get("matcher") or "__default__"
            if matcher not in by_matcher:
                by_matcher[matcher] = []
            by_matcher[matcher].append(h["command"])

        config[event] = []
        for matcher, commands in by_matcher.items():
            entry = {"hooks": commands}
            if matcher != "__default__":
                entry["matcher"] = matcher
            config[event].append(entry)

    return config


def merge_hooks_config(existing: dict, new_hooks: dict) -> dict:
    """Merge new hooks config with existing settings."""
    result = existing.copy()
    result["hooks"] = new_hooks
    return result


def show_diff(old_hooks: dict, new_hooks: dict):
    """Show difference between old and new hooks config."""
    print("\n=== Hooks Configuration Diff ===\n")

    old_events = set(old_hooks.keys())
    new_events = set(new_hooks.keys())

    # Removed events
    for event in old_events - new_events:
        print(f"- {event}: (removed)")

    # Added events
    for event in new_events - old_events:
        print(f"+ {event}: (added)")
        for entry in new_hooks[event]:
            matcher = entry.get("matcher", "*")
            print(f"    + matcher={matcher}, hooks={len(entry.get('hooks', []))}")

    # Modified events
    for event in old_events & new_events:
        old_str = json.dumps(old_hooks[event], sort_keys=True)
        new_str = json.dumps(new_hooks[event], sort_keys=True)
        if old_str != new_str:
            print(f"~ {event}: (modified)")

    print()


def main():
    apply = "--apply" in sys.argv
    dry_run = "--dry-run" in sys.argv

    print("=" * 50)
    print("Sync Hooks - Claude Code Marketplace")
    print("=" * 50)
    print()

    # Load registries
    registry = load_json(HOOKS_REGISTRY)
    if not registry:
        print("Error: Could not load hooks-registry.json", file=sys.stderr)
        sys.exit(1)

    sync_config = load_json(SYNC_CONFIG)
    hooks_to_sync = sync_config.get("hooks_to_sync", {})
    global_hooks = hooks_to_sync.get("global", [])
    optional_hooks = hooks_to_sync.get("optional", [])

    print(f"Registry: {len(registry.get('hooks', {}))} hooks")
    print(f"Global hooks to sync: {len(global_hooks)}")
    print(f"Optional hooks: {len(optional_hooks)}")
    print()

    # Generate new config
    all_hooks = global_hooks + optional_hooks
    new_hooks = generate_hooks_config(registry, all_hooks)

    print("Generated hooks configuration:")
    for event, entries in new_hooks.items():
        hook_count = sum(len(e.get("hooks", [])) for e in entries)
        print(f"  - {event}: {hook_count} hook(s)")
    print()

    # Load existing settings
    settings = load_json(SETTINGS_FILE)
    old_hooks = settings.get("hooks", {})

    # Show diff
    show_diff(old_hooks, new_hooks)

    if dry_run:
        print("Dry run - no changes made")
        print("\nNew hooks config would be:")
        print(json.dumps(new_hooks, indent=2))
        return

    if apply:
        # Apply changes
        new_settings = merge_hooks_config(settings, new_hooks)
        if save_json(SETTINGS_FILE, new_settings):
            print(f"✓ Settings updated: {SETTINGS_FILE}")
            print("\nRestart Claude Code to apply changes.")
        else:
            print("✗ Failed to update settings", file=sys.stderr)
            sys.exit(1)
    else:
        print("Preview mode - use --apply to save changes")
        print("Use --dry-run to see the full new config")


if __name__ == "__main__":
    main()
