#!/usr/bin/env python3
"""Scan all projects for .claude/settings*.json with hooks."""
import os
import json
from pathlib import Path

SCAN_DIRS = [
    Path(r"C:\Users\julien\OneDrive\Coding\_Projets de code"),
    Path(r"C:\Users\julien\OneDrive\Coding\_référentiels de code"),
]
EXCLUDE = ["2025.11 Claude Code MarketPlace"]

def find_hooks(base_path: Path) -> dict:
    """Find all hooks in settings files."""
    results = {}

    for item in base_path.iterdir():
        if not item.is_dir():
            continue
        if item.name in EXCLUDE:
            continue
        if item.name.startswith('.'):
            continue

        claude_dir = item / ".claude"
        if not claude_dir.exists():
            continue

        for settings_file in ["settings.json", "settings.local.json"]:
            settings_path = claude_dir / settings_file
            if settings_path.exists():
                try:
                    with open(settings_path, "r", encoding="utf-8") as f:
                        data = json.load(f)

                    if "hooks" in data and data["hooks"]:
                        hooks = data["hooks"]
                        hook_summary = {}
                        for event, config in hooks.items():
                            if config:
                                hook_summary[event] = len(config) if isinstance(config, list) else 1

                        if hook_summary:
                            if item.name not in results:
                                results[item.name] = {
                                    "path": str(item),
                                    "settings_files": []
                                }
                            results[item.name]["settings_files"].append({
                                "file": settings_file,
                                "hooks": hook_summary,
                                "full_hooks": hooks
                            })
                except Exception as e:
                    print(f"Error reading {settings_path}: {e}")

    return results

def main():
    all_results = {}
    total_projects_with_hooks = 0

    for scan_dir in SCAN_DIRS:
        if scan_dir.exists():
            results = find_hooks(scan_dir)
            all_results[str(scan_dir)] = results
            total_projects_with_hooks += len(results)

    # Print summary
    print(f"=== HOOKS SCAN RESULTS ===\n")
    print(f"Total projects with hooks: {total_projects_with_hooks}\n")

    for scan_dir, projects in all_results.items():
        if projects:
            print(f"\n--- {scan_dir} ---\n")
            for project, data in sorted(projects.items()):
                print(f"\n📁 {project}")
                for sf in data["settings_files"]:
                    print(f"   File: {sf['file']}")
                    for event, count in sf["hooks"].items():
                        print(f"      - {event}: {count} hook(s)")
                    # Show actual hook commands
                    print("   Commands:")
                    for event, hooks_list in sf["full_hooks"].items():
                        if isinstance(hooks_list, list):
                            for hook_group in hooks_list:
                                if isinstance(hook_group, dict) and "hooks" in hook_group:
                                    for h in hook_group["hooks"]:
                                        cmd = h.get("command", "")[:80]
                                        print(f"      [{event}] {cmd}...")

    # Save JSON
    output_path = Path(__file__).parent.parent / "docs" / "hooks-scan-results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "total_projects": total_projects_with_hooks,
            "results": all_results
        }, f, indent=2, ensure_ascii=False)
    print(f"\n\nJSON saved to: {output_path}")

if __name__ == "__main__":
    main()
