#!/usr/bin/env python3
"""
List Resources Script v2 - Enhanced with Claude Code Best Practices
Based on official documentation at code.claude.com/docs/en/plugin-marketplaces

Features:
- Marketplace.json schema validation
- Keywords/tags display for better discoverability
- Strict mode indication
- Source type detection (git, github, local, npm)
- Filter by category, tag, or source
- Export formats (JSON, Markdown, Team config)
- Search functionality
"""

import json
import os
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Set
import re

# ANSI color codes
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    MAGENTA = '\033[0;35m'
    CYAN = '\033[0;36m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    NC = '\033[0m'


def print_header(text: str, color: str = Colors.CYAN):
    """Print a formatted header"""
    print(f"\n{Colors.BOLD}{color}{text}{Colors.NC}\n")


def print_success(text: str):
    """Print success message"""
    print(f"{Colors.GREEN}✓{Colors.NC} {text}")


def print_warning(text: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠{Colors.NC} {text}")


def print_error(text: str):
    """Print error message"""
    print(f"{Colors.RED}✗{Colors.NC} {text}")


def print_info(text: str):
    """Print info message"""
    print(f"{Colors.BLUE}ℹ{Colors.NC} {text}")


def detect_source_type(source: str) -> str:
    """Detect the type of plugin source"""
    if source.startswith('http://') or source.startswith('https://'):
        if 'github.com' in source:
            return 'github'
        return 'git/url'
    elif source.startswith('./') or source.startswith('../'):
        return 'local'
    elif source.startswith('npm:') or source.startswith('@'):
        return 'npm'
    elif '/' not in source:
        return 'relative'
    return 'unknown'


def validate_marketplace_schema(data: Dict) -> List[str]:
    """
    Validate marketplace.json against Claude Code schema
    Returns list of validation warnings/errors
    """
    issues = []

    # Required fields
    if 'name' not in data:
        issues.append("Missing required field: 'name'")

    if 'plugins' not in data:
        issues.append("Missing required field: 'plugins'")
    elif not isinstance(data['plugins'], list):
        issues.append("Field 'plugins' must be an array")

    # Recommended fields
    if 'owner' not in data:
        issues.append("Recommended field missing: 'owner' (should include name and email)")

    if 'metadata' not in data:
        issues.append("Recommended field missing: 'metadata' (should include description, version)")

    # Validate plugin entries
    if 'plugins' in data:
        for idx, plugin in enumerate(data['plugins']):
            if 'name' not in plugin:
                issues.append(f"Plugin at index {idx}: Missing required field 'name'")
            if 'source' not in plugin:
                issues.append(f"Plugin at index {idx}: Missing recommended field 'source'")
            if 'description' not in plugin:
                issues.append(f"Plugin at index {idx}: Missing recommended field 'description'")

    return issues


def load_marketplace_data(cwd: Path) -> Optional[Dict]:
    """Load and validate marketplace.json data"""
    marketplace_file = cwd / ".claude-plugin" / "marketplace.json"
    if not marketplace_file.exists():
        return None

    try:
        with open(marketplace_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Validate schema
        issues = validate_marketplace_schema(data)
        if issues:
            print_warning("Marketplace schema validation issues found:")
            for issue in issues[:5]:  # Show first 5 issues
                print(f"  {Colors.DIM}- {issue}{Colors.NC}")
            if len(issues) > 5:
                print(f"  {Colors.DIM}... and {len(issues) - 5} more{Colors.NC}")
            print()

        return data

    except json.JSONDecodeError as e:
        print_error(f"Invalid JSON in marketplace.json: {e}")
        return None
    except Exception as e:
        print_error(f"Failed to load marketplace.json: {e}")
        return None


def display_marketplace_info(data: Dict, verbose: bool = False):
    """Display marketplace metadata"""
    print_header("## Marketplace Information", Colors.MAGENTA)

    name = data.get('name', 'Unknown')
    version = data.get('metadata', {}).get('version', 'N/A')
    description = data.get('metadata', {}).get('description', 'No description')
    owner = data.get('owner', {})
    owner_name = owner.get('name', 'Unknown')
    owner_email = owner.get('email', 'N/A')

    plugins_count = len(data.get('plugins', []))

    print(f"  {Colors.BOLD}Name:{Colors.NC} {name}")
    print(f"  {Colors.BOLD}Version:{Colors.NC} {version}")
    print(f"  {Colors.BOLD}Owner:{Colors.NC} {owner_name} <{owner_email}>")
    print(f"  {Colors.BOLD}Description:{Colors.NC} {description}")
    print(f"  {Colors.BOLD}Total Plugins:{Colors.NC} {plugins_count}")

    if verbose and 'metadata' in data:
        metadata = data['metadata']
        if 'pluginRoot' in metadata:
            print(f"  {Colors.BOLD}Plugin Root:{Colors.NC} {metadata['pluginRoot']}")

    print()


def get_all_categories(plugins: List[Dict]) -> Set[str]:
    """Extract all unique categories from plugins"""
    return {p.get('category', 'uncategorized') for p in plugins}


def get_all_keywords(plugins: List[Dict]) -> Set[str]:
    """Extract all unique keywords from plugins"""
    keywords = set()
    for plugin in plugins:
        plugin_keywords = plugin.get('keywords', [])
        if isinstance(plugin_keywords, list):
            keywords.update(plugin_keywords)
    return keywords


def display_marketplace_skills(data: Dict,
                               filter_category: Optional[str] = None,
                               filter_keyword: Optional[str] = None,
                               filter_source: Optional[str] = None,
                               search_query: Optional[str] = None,
                               show_keywords: bool = True,
                               verbose: bool = False):
    """Display skills with filtering options"""
    print_header("## Skills by Category", Colors.MAGENTA)

    plugins = data.get('plugins', [])

    # Apply filters
    if filter_category:
        plugins = [p for p in plugins if p.get('category', '').lower() == filter_category.lower()]
    if filter_keyword:
        plugins = [p for p in plugins if filter_keyword.lower() in [k.lower() for k in p.get('keywords', [])]]
    if filter_source:
        plugins = [p for p in plugins if filter_source.lower() in detect_source_type(p.get('source', '')).lower()]
    if search_query:
        query_lower = search_query.lower()
        plugins = [p for p in plugins if
                   query_lower in p.get('name', '').lower() or
                   query_lower in p.get('description', '').lower()]

    if not plugins:
        print_warning("No plugins found matching your filters.")
        return

    # Group by category
    by_category: Dict[str, List[Dict]] = {}
    for plugin in plugins:
        category = plugin.get('category', 'uncategorized')
        if category not in by_category:
            by_category[category] = []
        by_category[category].append(plugin)

    # Display each category
    for category in sorted(by_category.keys()):
        print(f"{Colors.BOLD}{Colors.YELLOW}### {category.title()}{Colors.NC}")
        print(f"{Colors.DIM}({len(by_category[category])} plugins){Colors.NC}\n")

        if verbose:
            # Verbose mode: show more details
            for plugin in by_category[category]:
                name = plugin.get('name', 'N/A')
                desc = plugin.get('description', 'No description')
                version = plugin.get('version', 'N/A')
                license_type = plugin.get('license', 'N/A')
                source = plugin.get('source', 'N/A')
                source_type = detect_source_type(source)
                strict_mode = plugin.get('strict', True)
                keywords = plugin.get('keywords', [])

                print(f"{Colors.BOLD}{name}{Colors.NC} (v{version})")
                print(f"  {desc}")
                print(f"  {Colors.DIM}License: {license_type} | Source: {source_type} | Strict: {strict_mode}{Colors.NC}")

                if show_keywords and keywords:
                    keywords_str = ', '.join(keywords[:5])
                    if len(keywords) > 5:
                        keywords_str += f" +{len(keywords) - 5} more"
                    print(f"  {Colors.DIM}Keywords: {keywords_str}{Colors.NC}")

                print()
        else:
            # Table mode
            if show_keywords:
                print("| Name | Description | Version | License | Source | Keywords |")
                print("|------|-------------|---------|---------|--------|----------|")
            else:
                print("| Name | Description | Version | License | Source |")
                print("|------|-------------|---------|---------|--------|")

            for plugin in by_category[category]:
                name = plugin.get('name', 'N/A')
                desc = plugin.get('description', 'No description')[:60]
                version = plugin.get('version', 'N/A')
                license_type = plugin.get('license', 'N/A')
                source = plugin.get('source', 'N/A')
                source_type = detect_source_type(source)
                keywords = plugin.get('keywords', [])
                keywords_str = ', '.join(keywords[:3]) if keywords else '-'

                if show_keywords:
                    print(f"| {name} | {desc} | {version} | {license_type} | {source_type} | {keywords_str} |")
                else:
                    print(f"| {name} | {desc} | {version} | {license_type} | {source_type} |")

            print()


def display_statistics(data: Dict):
    """Display marketplace statistics"""
    print_header("## Statistics", Colors.MAGENTA)

    plugins = data.get('plugins', [])
    categories = get_all_categories(plugins)
    keywords = get_all_keywords(plugins)

    # Count by category
    by_category = {}
    for plugin in plugins:
        category = plugin.get('category', 'uncategorized')
        by_category[category] = by_category.get(category, 0) + 1

    # Count by source type
    by_source = {}
    for plugin in plugins:
        source_type = detect_source_type(plugin.get('source', ''))
        by_source[source_type] = by_source.get(source_type, 0) + 1

    print(f"  {Colors.BOLD}Total Plugins:{Colors.NC} {len(plugins)}")
    print(f"  {Colors.BOLD}Categories:{Colors.NC} {len(categories)}")
    print(f"  {Colors.BOLD}Unique Keywords:{Colors.NC} {len(keywords)}")
    print()

    print(f"  {Colors.BOLD}Plugins per Category:{Colors.NC}")
    for category, count in sorted(by_category.items(), key=lambda x: -x[1]):
        print(f"    - {category}: {count}")
    print()

    print(f"  {Colors.BOLD}Plugins per Source Type:{Colors.NC}")
    for source_type, count in sorted(by_source.items(), key=lambda x: -x[1]):
        print(f"    - {source_type}: {count}")
    print()


def export_team_config(data: Dict, output_file: str):
    """Export extraKnownMarketplaces config for team distribution"""
    config = {
        "extraKnownMarketplaces": [
            {
                "name": data.get('name', 'marketplace'),
                "url": "https://github.com/YOUR_ORG/YOUR_REPO"  # User should update this
            }
        ]
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)

    print_success(f"Team config exported to: {output_file}")
    print_info("Add this to your project's .claude/settings.json")
    print_info("Update the 'url' field with your actual repository URL")


def display_usage_instructions(is_marketplace: bool):
    """Display usage instructions"""
    print_header("## Usage Instructions", Colors.MAGENTA)

    if is_marketplace:
        print(f"{Colors.BOLD}Installing from this marketplace:{Colors.NC}")
        print(f"  1. Add marketplace to Claude Code:")
        print(f"     {Colors.CYAN}/plugin marketplace add <github-url-or-local-path>{Colors.NC}\n")
        print(f"  2. Browse available plugins:")
        print(f"     {Colors.CYAN}/plugin{Colors.NC}\n")
        print(f"  3. Install a plugin:")
        print(f"     {Colors.CYAN}/plugin install <plugin-name>{Colors.NC}\n")

        print(f"{Colors.BOLD}Team distribution (extraKnownMarketplaces):{Colors.NC}")
        print(f"  Add to your project's .claude/settings.json:")
        print(f"  {Colors.CYAN}python scripts/list-resources-v2.py --export-team-config{Colors.NC}\n")

    print(f"{Colors.BOLD}Advanced filtering:{Colors.NC}")
    print(f"  Filter by category: {Colors.CYAN}python scripts/list-resources-v2.py --category infrastructure{Colors.NC}")
    print(f"  Filter by keyword: {Colors.CYAN}python scripts/list-resources-v2.py --keyword docker{Colors.NC}")
    print(f"  Search: {Colors.CYAN}python scripts/list-resources-v2.py --search nginx{Colors.NC}")
    print(f"  Show statistics: {Colors.CYAN}python scripts/list-resources-v2.py --stats{Colors.NC}\n")

    print(f"{Colors.BOLD}For more information:{Colors.NC}")
    print(f"  - Claude Code Docs: {Colors.CYAN}https://code.claude.com/docs{Colors.NC}")
    print(f"  - Plugin Marketplaces: {Colors.CYAN}https://code.claude.com/docs/en/plugin-marketplaces{Colors.NC}\n")


def main():
    """Main execution with argument parsing"""
    parser = argparse.ArgumentParser(
        description='List resources from Claude Code marketplace',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument('--category', '-c', help='Filter by category')
    parser.add_argument('--keyword', '-k', help='Filter by keyword')
    parser.add_argument('--source', '-s', help='Filter by source type (github, local, npm, etc.)')
    parser.add_argument('--search', '-q', help='Search in name and description')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show detailed information')
    parser.add_argument('--stats', action='store_true', help='Show statistics')
    parser.add_argument('--no-keywords', action='store_true', help='Hide keywords in table view')
    parser.add_argument('--export-team-config', metavar='FILE', help='Export extraKnownMarketplaces config')
    parser.add_argument('--list-categories', action='store_true', help='List all available categories')
    parser.add_argument('--list-keywords', action='store_true', help='List all available keywords')

    args = parser.parse_args()

    print_header("=== Claude Code Marketplace Resources ===", Colors.CYAN)

    cwd = Path.cwd()

    # Check for marketplace
    marketplace_data = load_marketplace_data(cwd)
    if not marketplace_data:
        print_error("No marketplace found in this repository.")
        print("  This script requires a .claude-plugin/marketplace.json file")
        print(f"  See: {Colors.CYAN}https://code.claude.com/docs/en/plugin-marketplaces{Colors.NC}\n")
        sys.exit(1)

    print_success("Marketplace detected\n")

    # Handle list options
    if args.list_categories:
        categories = get_all_categories(marketplace_data.get('plugins', []))
        print_header("Available Categories", Colors.MAGENTA)
        for cat in sorted(categories):
            print(f"  - {cat}")
        print()
        return

    if args.list_keywords:
        keywords = get_all_keywords(marketplace_data.get('plugins', []))
        print_header("Available Keywords", Colors.MAGENTA)
        for kw in sorted(keywords):
            print(f"  - {kw}")
        print()
        return

    # Handle export
    if args.export_team_config:
        export_team_config(marketplace_data, args.export_team_config)
        return

    # Display information
    display_marketplace_info(marketplace_data, verbose=args.verbose)

    if args.stats:
        display_statistics(marketplace_data)

    display_marketplace_skills(
        marketplace_data,
        filter_category=args.category,
        filter_keyword=args.keyword,
        filter_source=args.source,
        search_query=args.search,
        show_keywords=not args.no_keywords,
        verbose=args.verbose
    )

    display_usage_instructions(is_marketplace=True)

    print_header("=== End of Resources List ===", Colors.CYAN)


if __name__ == "__main__":
    main()
