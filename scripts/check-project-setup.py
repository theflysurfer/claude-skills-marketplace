#!/usr/bin/env python3
"""
Check project setup and suggest missing components.
Hook: SessionStart (optional)

Detects missing files and offers to install them from the marketplace.
"""

import json
import os
import shutil
import sys
from pathlib import Path
from datetime import datetime

# Paths
HOME = Path.home()
CLAUDE_HOME = HOME / ".claude"
SCRIPT_DIR = Path(__file__).parent

# Try to find marketplace root
MARKETPLACE_CANDIDATES = [
    SCRIPT_DIR.parent,  # If running from marketplace
    HOME / "OneDrive" / "Coding" / "_Projets de code" / "2025.11 Claude Code MarketPlace",
]

def find_marketplace() -> Path | None:
    """Find the marketplace root directory."""
    for candidate in MARKETPLACE_CANDIDATES:
        if (candidate / "skills").is_dir() and (candidate / "configs" / "sync-config.json").exists():
            return candidate
    return None


# Required files for project registry to work
REQUIRED_FILES = {
    "configs/projects-registry.json": {
        "description": "Registre des projets",
        "source": "configs/projects-registry.json",
        "target": CLAUDE_HOME / "configs" / "projects-registry.json"
    },
    "scripts/project-registry.py": {
        "description": "Script de gestion du registre",
        "source": "scripts/project-registry.py",
        "target": CLAUDE_HOME / "scripts" / "project-registry.py"
    },
    "scripts/semantic-skill-router.py": {
        "description": "Router sémantique avec boost projet",
        "source": "scripts/semantic-skill-router.py",
        "target": CLAUDE_HOME / "scripts" / "semantic-skill-router.py"
    },
    "configs/skill-triggers.json": {
        "description": "Index des triggers de skills",
        "source": "configs/skill-triggers.json",
        "target": CLAUDE_HOME / "configs" / "skill-triggers.json"
    }
}


def check_file(file_info: dict, marketplace: Path) -> dict:
    """Check if a file exists and is up to date."""
    target = file_info["target"]
    source = marketplace / file_info["source"]

    result = {
        "exists": target.exists(),
        "source_exists": source.exists(),
        "outdated": False,
        "target": str(target),
        "source": str(source)
    }

    if result["exists"] and result["source_exists"]:
        # Check if outdated (source newer than target)
        target_mtime = target.stat().st_mtime
        source_mtime = source.stat().st_mtime
        result["outdated"] = source_mtime > target_mtime
        result["target_mtime"] = datetime.fromtimestamp(target_mtime).isoformat()
        result["source_mtime"] = datetime.fromtimestamp(source_mtime).isoformat()

    return result


def install_file(file_info: dict, marketplace: Path) -> bool:
    """Install a file from marketplace to global."""
    source = marketplace / file_info["source"]
    target = file_info["target"]

    if not source.exists():
        return False

    # Create parent directory if needed
    target.parent.mkdir(parents=True, exist_ok=True)

    # Copy file
    shutil.copy2(source, target)
    return True


def check_all(marketplace: Path, verbose: bool = True) -> dict:
    """Check all required files."""
    results = {}
    missing = []
    outdated = []

    for name, info in REQUIRED_FILES.items():
        status = check_file(info, marketplace)
        results[name] = status

        if not status["exists"]:
            missing.append((name, info))
        elif status["outdated"]:
            outdated.append((name, info))

    if verbose:
        if missing:
            print("⚠️  Fichiers manquants:")
            for name, info in missing:
                print(f"   - {info['description']}: {name}")

        if outdated:
            print("🔄 Fichiers obsolètes:")
            for name, info in outdated:
                print(f"   - {info['description']}: {name}")

        if not missing and not outdated:
            print("✅ Tous les fichiers sont à jour")

    return {
        "results": results,
        "missing": [m[0] for m in missing],
        "outdated": [o[0] for o in outdated]
    }


def install_missing(marketplace: Path, files: list[str], verbose: bool = True) -> int:
    """Install missing or outdated files."""
    installed = 0

    for name in files:
        if name not in REQUIRED_FILES:
            continue

        info = REQUIRED_FILES[name]
        if install_file(info, marketplace):
            installed += 1
            if verbose:
                print(f"   ✅ Installé: {info['description']}")
        else:
            if verbose:
                print(f"   ❌ Échec: {info['description']} (source non trouvée)")

    return installed


def interactive_check():
    """Interactive check and install prompt."""
    marketplace = find_marketplace()

    if not marketplace:
        print("❌ Marketplace non trouvé")
        print("   Chemins recherchés:")
        for candidate in MARKETPLACE_CANDIDATES:
            print(f"   - {candidate}")
        return False

    print(f"📦 Marketplace: {marketplace}")
    print()

    status = check_all(marketplace)

    all_missing = status["missing"] + status["outdated"]

    if not all_missing:
        return True

    print()
    print("Voulez-vous installer/mettre à jour ces fichiers? [O/n]")

    # In non-interactive mode, auto-install
    if not sys.stdin.isatty():
        response = "o"
    else:
        try:
            response = input().strip().lower()
        except EOFError:
            response = "o"

    if response in ("", "o", "oui", "y", "yes"):
        print()
        print("Installation en cours...")
        installed = install_missing(marketplace, all_missing)
        print()
        print(f"✅ {installed} fichier(s) installé(s)")
        return True
    else:
        print("Installation annulée")
        return False


def main():
    """Main entry point."""
    # Check for command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()

        if command == "check":
            marketplace = find_marketplace()
            if not marketplace:
                print("Marketplace non trouvé", file=sys.stderr)
                sys.exit(1)

            status = check_all(marketplace)
            if status["missing"] or status["outdated"]:
                sys.exit(1)
            sys.exit(0)

        elif command == "install":
            marketplace = find_marketplace()
            if not marketplace:
                print("Marketplace non trouvé", file=sys.stderr)
                sys.exit(1)

            status = check_all(marketplace, verbose=False)
            all_files = status["missing"] + status["outdated"]

            if all_files:
                installed = install_missing(marketplace, all_files)
                print(f"Installé: {installed} fichier(s)")
            else:
                print("Rien à installer")
            sys.exit(0)

        elif command == "json":
            # JSON output for hooks
            marketplace = find_marketplace()
            if not marketplace:
                print(json.dumps({"error": "marketplace_not_found"}))
                sys.exit(1)

            status = check_all(marketplace, verbose=False)
            print(json.dumps(status, indent=2))
            sys.exit(0)

        else:
            print(f"Commande inconnue: {command}")
            print("Usage: check-project-setup.py [check|install|json]")
            sys.exit(1)

    # Interactive mode
    interactive_check()


if __name__ == "__main__":
    main()
