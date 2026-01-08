#!/usr/bin/env python3
"""
Validation de Portabilité - Vérifie que tous les scripts hooks sont versionnés

Valide que tous les scripts référencés dans ~/.claude/settings.json sont:
1. Présents dans le repo marketplace (scripts/)
2. Listés dans configs/sync-config.json (scripts_to_sync)

Usage:
    python scripts/validate-portability.py

Exit codes:
    0 - Tous les scripts sont correctement versionnés et synced
    1 - Des problèmes de portabilité ont été détectés
"""

import json
import re
import sys
from pathlib import Path
from typing import Set, Dict, List

# Paths
MARKETPLACE_ROOT = Path(__file__).parent.parent
SETTINGS_FILE = Path.home() / ".claude" / "settings.json"
SYNC_CONFIG = MARKETPLACE_ROOT / "configs" / "sync-config.json"
SCRIPTS_DIR = MARKETPLACE_ROOT / "scripts"


def extract_scripts_from_settings() -> Set[str]:
    """Extrait tous les scripts référencés dans settings.json."""
    if not SETTINGS_FILE.exists():
        print(f"⚠️  Warning: {SETTINGS_FILE} not found")
        return set()

    try:
        with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
            settings = json.load(f)

        scripts = set()

        # Parser tous les hooks
        hooks_section = settings.get('hooks', {})
        for hook_name, hook_configs in hooks_section.items():
            for config in hook_configs:
                for hook in config.get('hooks', []):
                    if hook.get('type') == 'command':
                        command = hook.get('command', '')
                        # Extraire les noms de fichiers des commandes
                        # Pattern 1: runpy.run_path(str(Path.home()/'.claude/scripts/FILENAME.py')
                        match1 = re.search(r"\.claude/scripts/([^'\"]+)", command)
                        if match1:
                            scripts.add(match1.group(1))
                        # Pattern 2: %USERPROFILE%\.claude\scripts\FILENAME.js
                        match2 = re.search(r"\.claude\\\\scripts\\\\([^\"']+)", command)
                        if match2:
                            scripts.add(match2.group(1))

        return scripts
    except Exception as e:
        print(f"❌ Error reading settings.json: {e}")
        return set()


def get_scripts_in_repo() -> Set[str]:
    """Liste tous les scripts présents dans le repo."""
    if not SCRIPTS_DIR.exists():
        return set()

    scripts = set()
    for file in SCRIPTS_DIR.iterdir():
        if file.is_file():
            scripts.add(file.name)

    return scripts


def get_scripts_in_sync_config() -> Set[str]:
    """Liste tous les scripts dans sync-config.json."""
    if not SYNC_CONFIG.exists():
        print(f"❌ Error: {SYNC_CONFIG} not found")
        return set()

    try:
        with open(SYNC_CONFIG, 'r', encoding='utf-8') as f:
            config = json.load(f)

        return set(config.get('scripts_to_sync', []))
    except Exception as e:
        print(f"❌ Error reading sync-config.json: {e}")
        return set()


def group_scripts_by_hook() -> Dict[str, List[str]]:
    """Groupe les scripts par hook pour un affichage structuré."""
    if not SETTINGS_FILE.exists():
        return {}

    groups = {}

    try:
        with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
            settings = json.load(f)

        hooks_section = settings.get('hooks', {})
        for hook_name, hook_configs in hooks_section.items():
            scripts_for_hook = []
            for config in hook_configs:
                for hook in config.get('hooks', []):
                    if hook.get('type') == 'command':
                        command = hook.get('command', '')
                        match1 = re.search(r"\.claude/scripts/([^'\"]+)", command)
                        if match1:
                            scripts_for_hook.append(match1.group(1))
                        match2 = re.search(r"\.claude\\\\scripts\\\\([^\"']+)", command)
                        if match2:
                            scripts_for_hook.append(match2.group(1))

            if scripts_for_hook:
                groups[hook_name] = scripts_for_hook

    except Exception:
        pass

    return groups


def validate_portability() -> bool:
    """Valide la portabilité complète du système de hooks."""
    print("=" * 70)
    print("🔍 PORTABILITY VALIDATION")
    print("=" * 70)

    # Extract data
    scripts_in_settings = extract_scripts_from_settings()
    scripts_in_repo = get_scripts_in_repo()
    scripts_in_sync = get_scripts_in_sync_config()

    print(f"\n📊 Summary:")
    print(f"   - Scripts referenced in hooks: {len(scripts_in_settings)}")
    print(f"   - Scripts in marketplace repo: {len(scripts_in_repo)}")
    print(f"   - Scripts in sync-config.json: {len(scripts_in_sync)}")

    # Check for issues
    missing_from_repo = scripts_in_settings - scripts_in_repo
    missing_from_sync = scripts_in_settings - scripts_in_sync
    unused_in_repo = scripts_in_repo - scripts_in_settings
    unused_in_sync = scripts_in_sync - scripts_in_settings

    issues_found = False

    # Critical: Scripts referenced but not in repo
    if missing_from_repo:
        issues_found = True
        print(f"\n❌ CRITICAL: {len(missing_from_repo)} script(s) referenced in hooks but NOT in repo:")
        for script in sorted(missing_from_repo):
            print(f"   - {script}")
        print("\n   ⚠️  These scripts will be LOST if you switch computers!")
        print("   Action: Copy from ~/.claude/scripts/ to marketplace/scripts/")

    # Critical: Scripts referenced but not in sync-config
    if missing_from_sync:
        issues_found = True
        print(f"\n❌ CRITICAL: {len(missing_from_sync)} script(s) in repo but NOT in sync-config:")
        for script in sorted(missing_from_sync):
            print(f"   - {script}")
        print("\n   ⚠️  These scripts won't be deployed on new machines!")
        print("   Action: Add to configs/sync-config.json -> scripts_to_sync")

    # Info: Scripts in repo but not used in hooks (OK, might be utilities)
    if unused_in_repo:
        print(f"\n📋 Info: {len(unused_in_repo)} script(s) in repo but not referenced in hooks:")
        for script in sorted(unused_in_repo)[:5]:
            print(f"   - {script}")
        if len(unused_in_repo) > 5:
            print(f"   ... and {len(unused_in_repo) - 5} more")
        print("   (This is OK - they might be utilities or commands)")

    # Warning: Scripts in sync-config but not used
    if unused_in_sync:
        print(f"\n⚠️  Warning: {len(unused_in_sync)} script(s) in sync-config but not in hooks:")
        for script in sorted(unused_in_sync):
            print(f"   - {script}")
        print("   (This is OK if they're utilities, but verify they're needed)")

    # Display hook structure
    if not issues_found and scripts_in_settings:
        print(f"\n✅ All hooks properly configured:")
        groups = group_scripts_by_hook()
        for hook_name, scripts in sorted(groups.items()):
            print(f"\n   {hook_name}:")
            for script in scripts:
                in_repo = "✓" if script in scripts_in_repo else "✗"
                in_sync = "✓" if script in scripts_in_sync else "✗"
                print(f"      [{in_repo}|{in_sync}] {script}")

    print("\n" + "=" * 70)

    if issues_found:
        print("❌ PORTABILITY ISSUES FOUND - Action required before commit")
        print("=" * 70)
        return False
    else:
        print("✅ ALL HOOKS SCRIPTS ARE PROPERLY VERSIONED AND SYNCED")
        print("=" * 70)
        return True


def main():
    """Point d'entrée principal."""
    success = validate_portability()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
