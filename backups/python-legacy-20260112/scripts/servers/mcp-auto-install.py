#!/usr/bin/env python3
"""
MCP Auto-Installer - Installs MCPs from the registry into .mcp.json.

Usage:
    python mcp-auto-install.py notion          # Install notion MCP globally
    python mcp-auto-install.py playwright --project  # Install in project .mcp.json
    python mcp-auto-install.py --list          # List available MCPs
    python mcp-auto-install.py --recommended   # Install all recommended MCPs

Options:
    --project    Install in project .mcp.json (default: global ~/.claude/.mcp.json)
    --list       List all available MCPs
    --recommended Install all MCPs marked as recommended
    --dry-run    Show what would be done without making changes
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional

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
            return json.load(f)
    except Exception as e:
        print(f"[WARN] Failed to parse {path}: {e}", file=sys.stderr)
        return {}


def save_mcp_config(path: Path, config: Dict):
    """Save a .mcp.json config file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    print(f"[OK] Saved: {path}")


def get_project_mcp_file() -> Optional[Path]:
    """Get the project-level .mcp.json path."""
    cwd = Path.cwd()

    # Look for .claude folder in current or parent directories
    for parent in [cwd] + list(cwd.parents)[:3]:
        claude_dir = parent / ".claude"
        if claude_dir.exists():
            return claude_dir / ".mcp.json"

    # Create in current directory
    return cwd / ".claude" / ".mcp.json"


def check_credentials(mcp_info: Dict, credentials: Dict) -> List[str]:
    """Check if required credentials are available."""
    missing = []
    env_required = mcp_info.get("env_required", [])
    wcm_keys = mcp_info.get("wcm_keys", [])

    for env_var in env_required:
        # Check if env var is set
        if not os.environ.get(env_var):
            # Check if we have WCM key mapping
            wcm_key = None
            for key, cred_info in credentials.items():
                if cred_info.get("env_var") == env_var:
                    wcm_key = cred_info.get("wcm_name")
                    break

            if wcm_key:
                missing.append(f"{env_var} (store in WCM as {wcm_key})")
            else:
                missing.append(env_var)

    return missing


def install_mcp(mcp_name: str, registry: Dict, target_file: Path, dry_run: bool = False) -> bool:
    """Install a single MCP into the config file."""
    mcps = registry.get("mcps", {})
    credentials = registry.get("credential_manager", {}).get("credentials", {})

    if mcp_name not in mcps:
        print(f"[ERROR] MCP not found in registry: {mcp_name}", file=sys.stderr)
        print(f"Available MCPs: {', '.join(sorted(mcps.keys()))}")
        return False

    mcp_info = mcps[mcp_name]
    config_template = mcp_info.get("config", {})

    if not config_template:
        print(f"[ERROR] No config template for MCP: {mcp_name}", file=sys.stderr)
        return False

    # Check credentials
    missing_creds = check_credentials(mcp_info, credentials)
    if missing_creds:
        print(f"[WARN] Missing credentials for {mcp_name}:")
        for cred in missing_creds:
            print(f"  - {cred}")
        print("  Run: source ~/.claude/scripts/load-secrets-wcm.sh")

    # Load existing config
    existing_config = load_mcp_config(target_file)

    # Determine format (with or without mcpServers wrapper)
    if "mcpServers" in existing_config:
        servers = existing_config["mcpServers"]
    else:
        servers = existing_config

    # Check if already installed
    if mcp_name in servers:
        print(f"[SKIP] {mcp_name} already installed in {target_file}")
        return True

    # Add the MCP
    servers[mcp_name] = config_template

    # Rebuild config with proper format
    if "mcpServers" in existing_config:
        existing_config["mcpServers"] = servers
    else:
        existing_config = servers

    if dry_run:
        print(f"[DRY-RUN] Would install {mcp_name} to {target_file}")
        print(f"  Config: {json.dumps(config_template, indent=2)}")
    else:
        save_mcp_config(target_file, existing_config)
        print(f"[OK] Installed {mcp_name}")
        print(f"  Description: {mcp_info.get('description', 'N/A')}")
        if mcp_info.get("triggers"):
            print(f"  Triggers: {', '.join(mcp_info['triggers'][:3])}")

    return True


def list_mcps(registry: Dict):
    """List all available MCPs."""
    mcps = registry.get("mcps", {})
    categories = registry.get("categories", {})

    print("\nAvailable MCPs:")
    print("-" * 60)

    # Group by category
    by_category = {}
    for name, info in mcps.items():
        cat = info.get("category", "utilities")
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append((name, info))

    for cat_id, mcps_list in by_category.items():
        cat_info = categories.get(cat_id, {})
        icon = cat_info.get("icon", "")
        cat_name = cat_info.get("name", cat_id)
        print(f"\n{icon} {cat_name}")

        for name, info in sorted(mcps_list):
            rec = " [recommended]" if info.get("recommended") else ""
            env = f" (requires: {', '.join(info.get('env_required', []))})" if info.get("env_required") else ""
            print(f"  - {name}{rec}{env}")
            print(f"    {info.get('description', '')}")


def install_recommended(registry: Dict, target_file: Path, dry_run: bool = False) -> int:
    """Install all recommended MCPs."""
    mcps = registry.get("mcps", {})
    installed = 0

    print("\nInstalling recommended MCPs...")
    for name, info in mcps.items():
        if info.get("recommended"):
            if install_mcp(name, registry, target_file, dry_run):
                installed += 1

    print(f"\nInstalled {installed} recommended MCPs")
    return installed


def main():
    args = sys.argv[1:]

    # Parse flags
    project_mode = "--project" in args
    list_mode = "--list" in args
    recommended_mode = "--recommended" in args
    dry_run = "--dry-run" in args

    # Remove flags from args
    mcp_names = [a for a in args if not a.startswith("--")]

    # Load registry
    registry = load_registry()
    if not registry:
        sys.exit(1)

    # Determine target file
    if project_mode:
        target_file = get_project_mcp_file()
        print(f"Target: {target_file} (project)")
    else:
        target_file = GLOBAL_MCP_FILE
        print(f"Target: {target_file} (global)")

    # Execute command
    if list_mode:
        list_mcps(registry)
    elif recommended_mode:
        install_recommended(registry, target_file, dry_run)
    elif mcp_names:
        for mcp_name in mcp_names:
            install_mcp(mcp_name, registry, target_file, dry_run)
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
