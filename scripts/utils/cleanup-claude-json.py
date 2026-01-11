#!/usr/bin/env python3
"""
Cleanup ~/.claude.json - Remove stale projects, caches, and bloat.
Hook: Can be run manually or via SessionEnd hook.

Usage:
    python cleanup-claude-json.py [--dry-run] [--verbose]
"""

import json
import os
import sys
import shutil
from pathlib import Path
from datetime import datetime

# Configuration
MAX_FILE_SIZE_MB = 5  # Warn if file exceeds this size
BACKUP_BEFORE_CLEANUP = True

def get_claude_json_path() -> Path:
    """Get path to ~/.claude.json"""
    return Path.home() / ".claude.json"

def get_file_size_mb(path: Path) -> float:
    """Get file size in MB"""
    if path.exists():
        return path.stat().st_size / (1024 * 1024)
    return 0

def backup_file(path: Path) -> Path:
    """Create a backup of the file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = path.parent / f".claude.json.backup_{timestamp}"
    shutil.copy2(path, backup_path)
    return backup_path

def cleanup_stale_projects(data: dict, dry_run: bool = False, verbose: bool = False) -> int:
    """Remove projects whose directories no longer exist"""
    removed = 0
    projects = data.get("projects", {})
    stale_projects = []

    for project_path in list(projects.keys()):
        if not Path(project_path).exists():
            stale_projects.append(project_path)
            if not dry_run:
                del projects[project_path]
            removed += 1
            if verbose:
                print(f"  [STALE] {project_path}")

    return removed

def cleanup_caches(data: dict, dry_run: bool = False, verbose: bool = False) -> int:
    """Clear cached data that can be regenerated"""
    cleaned = 0

    # Clear statsig caches (feature flags, regenerated on startup)
    if "cachedStatsigGates" in data and data["cachedStatsigGates"]:
        if verbose:
            print(f"  [CACHE] cachedStatsigGates ({len(data['cachedStatsigGates'])} entries)")
        if not dry_run:
            data["cachedStatsigGates"] = {}
        cleaned += 1

    if "cachedDynamicConfigs" in data and data["cachedDynamicConfigs"]:
        if verbose:
            print(f"  [CACHE] cachedDynamicConfigs ({len(data['cachedDynamicConfigs'])} entries)")
        if not dry_run:
            data["cachedDynamicConfigs"] = {}
        cleaned += 1

    return cleaned

def cleanup_tips_history(data: dict, dry_run: bool = False, verbose: bool = False) -> int:
    """Reset tips history counters (they just track how many times tips were shown)"""
    if "tipsHistory" in data and data["tipsHistory"]:
        count = len(data["tipsHistory"])
        if verbose:
            print(f"  [TIPS] tipsHistory ({count} entries)")
        if not dry_run:
            data["tipsHistory"] = {}
        return 1
    return 0

def cleanup_project_stats(data: dict, dry_run: bool = False, verbose: bool = False) -> int:
    """Reset per-project statistics (cost, tokens, duration, etc.)"""
    cleaned = 0
    stats_keys = [
        "lastCost", "lastAPIDuration", "lastAPIDurationWithoutRetries",
        "lastToolDuration", "lastDuration", "lastLinesAdded", "lastLinesRemoved",
        "lastTotalInputTokens", "lastTotalOutputTokens",
        "lastTotalCacheCreationInputTokens", "lastTotalCacheReadInputTokens",
        "lastModelUsage", "lastTotalWebSearchRequests"
    ]

    projects = data.get("projects", {})
    for project_path, project_data in projects.items():
        for key in stats_keys:
            if key in project_data:
                if not dry_run:
                    del project_data[key]
                cleaned += 1

    if verbose and cleaned > 0:
        print(f"  [STATS] Cleared {cleaned} stat entries across {len(projects)} projects")

    return cleaned

def cleanup_base64_content(data: dict, dry_run: bool = False, verbose: bool = False) -> int:
    """Remove any base64 encoded content (images, etc.)"""
    cleaned = 0

    def scan_and_clean(obj, path=""):
        nonlocal cleaned
        if isinstance(obj, dict):
            keys_to_delete = []
            for key, value in obj.items():
                if isinstance(value, str) and len(value) > 1000:
                    # Check if it looks like base64
                    if value.startswith("data:image") or (
                        len(value) > 5000 and
                        all(c in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=" for c in value[:100])
                    ):
                        if verbose:
                            print(f"  [BASE64] {path}.{key} ({len(value)} chars)")
                        keys_to_delete.append(key)
                        cleaned += 1
                else:
                    scan_and_clean(value, f"{path}.{key}")

            if not dry_run:
                for key in keys_to_delete:
                    del obj[key]
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                scan_and_clean(item, f"{path}[{i}]")

    scan_and_clean(data)
    return cleaned

def main():
    dry_run = "--dry-run" in sys.argv
    verbose = "--verbose" in sys.argv or "-v" in sys.argv

    claude_json = get_claude_json_path()

    if not claude_json.exists():
        print(f"File not found: {claude_json}")
        return 1

    # Check file size
    size_mb = get_file_size_mb(claude_json)
    print(f"File: {claude_json}")
    print(f"Size: {size_mb:.2f} MB")

    if size_mb > MAX_FILE_SIZE_MB:
        print(f"WARNING: File exceeds {MAX_FILE_SIZE_MB} MB threshold!")

    if dry_run:
        print("\n[DRY RUN - No changes will be made]\n")

    # Load data
    with open(claude_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Backup
    if BACKUP_BEFORE_CLEANUP and not dry_run:
        backup_path = backup_file(claude_json)
        print(f"Backup: {backup_path}\n")

    # Run cleanups
    print("Cleanup operations:")

    stale = cleanup_stale_projects(data, dry_run, verbose)
    print(f"  - Stale projects removed: {stale}")

    caches = cleanup_caches(data, dry_run, verbose)
    print(f"  - Caches cleared: {caches}")

    tips = cleanup_tips_history(data, dry_run, verbose)
    print(f"  - Tips history reset: {'yes' if tips else 'no'}")

    stats = cleanup_project_stats(data, dry_run, verbose)
    print(f"  - Project stats cleared: {stats}")

    base64 = cleanup_base64_content(data, dry_run, verbose)
    print(f"  - Base64 content removed: {base64}")

    # Save
    if not dry_run:
        with open(claude_json, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        new_size_mb = get_file_size_mb(claude_json)
        saved = size_mb - new_size_mb
        print(f"\nNew size: {new_size_mb:.2f} MB (saved {saved:.2f} MB)")
    else:
        print("\n[DRY RUN COMPLETE - Run without --dry-run to apply changes]")

    return 0

if __name__ == "__main__":
    sys.exit(main())
