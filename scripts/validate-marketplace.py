#!/usr/bin/env python3
"""
Marketplace Validation Script
Validates marketplace.json structure and plugin metadata
Used in CI/CD pipeline and for local validation
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# ANSI color codes
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    BOLD = '\033[1m'
    NC = '\033[0m'


class ValidationResult:
    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.info: List[str] = []

    def add_error(self, message: str):
        self.errors.append(message)

    def add_warning(self, message: str):
        self.warnings.append(message)

    def add_info(self, message: str):
        self.info.append(message)

    def is_valid(self) -> bool:
        return len(self.errors) == 0

    def print_results(self):
        print(f"\n{Colors.BOLD}=== Marketplace Validation Results ==={Colors.NC}\n")

        if self.errors:
            print(f"{Colors.RED}{Colors.BOLD}ERRORS ({len(self.errors)}):{Colors.NC}")
            for error in self.errors:
                print(f"  {Colors.RED}✗{Colors.NC} {error}")
            print()

        if self.warnings:
            print(f"{Colors.YELLOW}{Colors.BOLD}WARNINGS ({len(self.warnings)}):{Colors.NC}")
            for warning in self.warnings:
                print(f"  {Colors.YELLOW}⚠{Colors.NC} {warning}")
            print()

        if self.info:
            print(f"{Colors.BLUE}{Colors.BOLD}INFO ({len(self.info)}):{Colors.NC}")
            for info_msg in self.info:
                print(f"  {Colors.BLUE}ℹ{Colors.NC} {info_msg}")
            print()

        if self.is_valid():
            print(f"{Colors.GREEN}{Colors.BOLD}✓ Validation passed!{Colors.NC}\n")
        else:
            print(f"{Colors.RED}{Colors.BOLD}✗ Validation failed with {len(self.errors)} error(s){Colors.NC}\n")


def load_marketplace_json(file_path: Path) -> Tuple[Dict | None, str | None]:
    """Load and parse marketplace.json"""
    if not file_path.exists():
        return None, "marketplace.json not found"

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f), None
    except json.JSONDecodeError as e:
        return None, f"Invalid JSON: {e}"
    except Exception as e:
        return None, f"Failed to load file: {e}"


def validate_marketplace_structure(data: Dict, result: ValidationResult):
    """Validate top-level marketplace structure"""

    # Required fields
    if 'name' not in data:
        result.add_error("Missing required field: 'name'")
    elif not isinstance(data['name'], str) or not data['name']:
        result.add_error("Field 'name' must be a non-empty string")

    if 'plugins' not in data:
        result.add_error("Missing required field: 'plugins'")
    elif not isinstance(data['plugins'], list):
        result.add_error("Field 'plugins' must be an array")
    else:
        result.add_info(f"Found {len(data['plugins'])} plugins")

    # Recommended fields
    if 'owner' not in data:
        result.add_warning("Recommended field missing: 'owner' (should include name and email)")
    else:
        owner = data['owner']
        if not isinstance(owner, dict):
            result.add_error("Field 'owner' must be an object")
        else:
            if 'name' not in owner:
                result.add_warning("Owner missing 'name' field")
            if 'email' not in owner:
                result.add_warning("Owner missing 'email' field")

    if 'metadata' not in data:
        result.add_warning("Recommended field missing: 'metadata'")
    else:
        metadata = data['metadata']
        if not isinstance(metadata, dict):
            result.add_error("Field 'metadata' must be an object")
        else:
            if 'description' not in metadata:
                result.add_warning("Metadata missing 'description' field")
            if 'version' not in metadata:
                result.add_warning("Metadata missing 'version' field")


def validate_plugin_entry(plugin: Dict, index: int, result: ValidationResult):
    """Validate individual plugin entry"""

    prefix = f"Plugin #{index}"

    # Required: name
    if 'name' not in plugin:
        result.add_error(f"{prefix}: Missing required field 'name'")
        return  # Can't continue without name

    name = plugin['name']
    prefix = f"Plugin '{name}'"

    # Validate name format (kebab-case recommended)
    if not name.islower() or ' ' in name:
        result.add_warning(f"{prefix}: Name should use kebab-case (lowercase with hyphens)")

    # Recommended: source
    if 'source' not in plugin:
        result.add_warning(f"{prefix}: Missing recommended field 'source'")

    # Recommended: description
    if 'description' not in plugin:
        result.add_warning(f"{prefix}: Missing recommended field 'description'")
    else:
        desc = plugin['description']
        if len(desc) < 20:
            result.add_warning(f"{prefix}: Description is very short (< 20 chars)")
        elif len(desc) > 200:
            result.add_warning(f"{prefix}: Description is very long (> 200 chars)")

    # Recommended: version
    if 'version' not in plugin:
        result.add_warning(f"{prefix}: Missing recommended field 'version'")

    # Recommended: license
    if 'license' not in plugin:
        result.add_warning(f"{prefix}: Missing recommended field 'license'")

    # Recommended: category
    if 'category' not in plugin:
        result.add_warning(f"{prefix}: Missing recommended field 'category'")
    else:
        category = plugin['category']
        valid_categories = [
            'development', 'infrastructure', 'operations', 'productivity',
            'design', 'data-science', 'security', 'testing', 'other'
        ]
        if category not in valid_categories:
            result.add_info(f"{prefix}: Using custom category '{category}'")

    # Recommended: keywords
    if 'keywords' not in plugin:
        result.add_warning(f"{prefix}: Missing recommended field 'keywords' (affects discoverability)")
    else:
        keywords = plugin['keywords']
        if not isinstance(keywords, list):
            result.add_error(f"{prefix}: Field 'keywords' must be an array")
        elif len(keywords) < 3:
            result.add_warning(f"{prefix}: Only {len(keywords)} keywords (recommend 3-8 for better discoverability)")
        elif len(keywords) > 10:
            result.add_warning(f"{prefix}: Too many keywords ({len(keywords)}), consider reducing to 3-8 most relevant")

    # Optional: strict mode
    if 'strict' in plugin:
        if not isinstance(plugin['strict'], bool):
            result.add_error(f"{prefix}: Field 'strict' must be a boolean")


def validate_plugin_files(plugin: Dict, marketplace_root: Path, plugin_root: str, result: ValidationResult):
    """Validate that plugin files exist"""

    if 'name' not in plugin:
        return  # Already reported as error

    name = plugin['name']
    source = plugin.get('source', f'./{name}')

    # Skip URL sources
    if source.startswith('http://') or source.startswith('https://'):
        result.add_info(f"Plugin '{name}': Skipping file validation for remote source")
        return

    # Try multiple paths
    # 1. Exact source path
    plugin_path = marketplace_root / source.lstrip('./')

    # 2. If not found and pluginRoot is set, try pluginRoot + source
    if not plugin_path.exists() and plugin_root:
        plugin_path = marketplace_root / plugin_root.lstrip('./') / source.lstrip('./')

    # 3. If still not found, try to find by matching name pattern in pluginRoot
    if not plugin_path.exists() and plugin_root:
        plugin_root_path = marketplace_root / plugin_root.lstrip('./')
        if plugin_root_path.exists():
            # Look for folders containing the plugin name or key parts
            # Normalize common variations
            normalized_name = name.replace('webapp', 'web').replace('-', ' ')
            name_parts = [p for p in normalized_name.split() if len(p) > 2]  # Only significant words

            best_match = None
            best_match_score = 0

            for folder in plugin_root_path.iterdir():
                if not folder.is_dir():
                    continue

                folder_name_lower = folder.name.lower()
                name_lower = name.lower()

                # Exact substring match
                if name_lower in folder_name_lower:
                    plugin_path = folder
                    result.add_info(f"Plugin '{name}': Found at {folder.relative_to(marketplace_root)}")
                    break

                # Check how many significant parts match
                if name_parts:
                    matches = sum(1 for part in name_parts if part.lower() in folder_name_lower)
                    match_ratio = matches / len(name_parts)

                    # Need at least 80% match and minimum 2 matches for fuzzy matching
                    if match_ratio >= 0.8 and matches >= min(2, len(name_parts)):
                        if match_ratio > best_match_score:
                            best_match = folder
                            best_match_score = match_ratio

            # Use best fuzzy match if found
            if best_match and not plugin_path.exists():
                plugin_path = best_match
                result.add_info(f"Plugin '{name}': Found at {best_match.relative_to(marketplace_root)} (fuzzy match, {int(best_match_score*100)}%)")

    if not plugin_path.exists():
        result.add_error(f"Plugin '{name}': Source directory not found: {source}")
    elif not plugin_path.is_dir():
        result.add_error(f"Plugin '{name}': Source is not a directory: {source}")
    else:
        # Check for SKILL.md
        skill_file = plugin_path / 'SKILL.md'
        if not skill_file.exists():
            result.add_warning(f"Plugin '{name}': Missing SKILL.md file")


def validate_duplicates(data: Dict, result: ValidationResult):
    """Check for duplicate plugin names"""

    plugins = data.get('plugins', [])
    names = [p.get('name') for p in plugins if 'name' in p]

    seen = set()
    duplicates = set()

    for name in names:
        if name in seen:
            duplicates.add(name)
        seen.add(name)

    if duplicates:
        for name in duplicates:
            result.add_error(f"Duplicate plugin name: '{name}'")


def main():
    """Main validation function"""

    # Locate marketplace.json
    cwd = Path.cwd()
    marketplace_file = cwd / '.claude-plugin' / 'marketplace.json'

    print(f"{Colors.BOLD}Claude Code Marketplace Validator{Colors.NC}")
    print(f"Validating: {marketplace_file}\n")

    result = ValidationResult()

    # Load marketplace.json
    data, error = load_marketplace_json(marketplace_file)
    if error:
        result.add_error(error)
        result.print_results()
        sys.exit(1)

    # Validate structure
    validate_marketplace_structure(data, result)

    # Get pluginRoot if specified
    plugin_root = data.get('metadata', {}).get('pluginRoot', '')

    # Validate each plugin
    plugins = data.get('plugins', [])
    for idx, plugin in enumerate(plugins):
        validate_plugin_entry(plugin, idx, result)
        validate_plugin_files(plugin, cwd, plugin_root, result)

    # Check for duplicates
    validate_duplicates(data, result)

    # Print results
    result.print_results()

    # Exit with appropriate code
    sys.exit(0 if result.is_valid() else 1)


if __name__ == '__main__':
    main()
