#!/usr/bin/env python3
"""
List Resources Script
Generic script to list skills, agents, and plugins available in marketplace or local repo
Works for both marketplace repositories and consumer repositories
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
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
    NC = '\033[0m'  # No Color


def print_header(text: str, color: str = Colors.CYAN):
    """Print a formatted header"""
    print(f"\n{Colors.BOLD}{color}{text}{Colors.NC}\n")


def print_success(text: str):
    """Print success message"""
    print(f"{Colors.GREEN}✓{Colors.NC} {text}")


def print_error(text: str):
    """Print error message"""
    print(f"{Colors.RED}✗{Colors.NC} {text}")


def detect_repository_type(cwd: Path) -> tuple[bool, Optional[Path]]:
    """
    Detect if this is a marketplace or has local skills
    Returns: (is_marketplace, skills_dir)
    """
    is_marketplace = (cwd / ".claude-plugin" / "marketplace.json").exists()
    skills_dir = None

    if (cwd / "skills").exists() and (cwd / "skills").is_dir():
        skills_dir = cwd / "skills"
    elif (cwd / ".claude" / "skills").exists() and (cwd / ".claude" / "skills").is_dir():
        skills_dir = cwd / ".claude" / "skills"

    return is_marketplace, skills_dir


def load_marketplace_data(cwd: Path) -> Optional[Dict]:
    """Load marketplace.json data"""
    marketplace_file = cwd / ".claude-plugin" / "marketplace.json"
    if not marketplace_file.exists():
        return None

    try:
        with open(marketplace_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print_error(f"Failed to load marketplace.json: {e}")
        return None


def display_marketplace_info(data: Dict):
    """Display marketplace metadata"""
    print_header("## Marketplace Information", Colors.MAGENTA)

    name = data.get('name', 'Unknown')
    version = data.get('metadata', {}).get('version', 'N/A')
    description = data.get('metadata', {}).get('description', 'No description')
    owner = data.get('owner', {}).get('name', 'Unknown')

    plugins_count = len(data.get('plugins', []))

    print(f"  {Colors.BOLD}Name:{Colors.NC} {name}")
    print(f"  {Colors.BOLD}Version:{Colors.NC} {version}")
    print(f"  {Colors.BOLD}Owner:{Colors.NC} {owner}")
    print(f"  {Colors.BOLD}Description:{Colors.NC} {description}")
    print(f"  {Colors.BOLD}Total Skills:{Colors.NC} {plugins_count}\n")


def display_marketplace_skills(data: Dict):
    """Display skills organized by category"""
    print_header("## Skills by Category", Colors.MAGENTA)

    plugins = data.get('plugins', [])

    # Group by category
    by_category: Dict[str, List[Dict]] = {}
    for plugin in plugins:
        category = plugin.get('category', 'uncategorized')
        if category not in by_category:
            by_category[category] = []
        by_category[category].append(plugin)

    # Display each category
    for category in sorted(by_category.keys()):
        print(f"{Colors.BOLD}{Colors.YELLOW}### {category.title()}{Colors.NC}\n")
        print("| Name | Description | Version | License | Source |")
        print("|------|-------------|---------|---------|--------|")

        for plugin in by_category[category]:
            name = plugin.get('name', 'N/A')
            desc = plugin.get('description', 'No description')[:80]
            version = plugin.get('version', 'N/A')
            license = plugin.get('license', 'N/A')

            # Determine source
            metadata = plugin.get('metadata', {})
            if 'source' in metadata:
                source = metadata['source']
            else:
                source = 'original'

            print(f"| {name} | {desc} | {version} | {license} | {source} |")

        print()


def extract_yaml_frontmatter(content: str) -> Dict:
    """Extract YAML frontmatter from a markdown file"""
    pattern = r'^---\s*\n(.*?)\n---\s*\n'
    match = re.match(pattern, content, re.DOTALL)

    if not match:
        return {}

    yaml_content = match.group(1)
    result = {}

    # Simple YAML parsing for common fields
    for line in yaml_content.split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            result[key] = value

    return result


def display_local_skills(skills_dir: Path):
    """Display locally available skills"""
    print_header("## Local Skills", Colors.MAGENTA)

    print("| Skill Name | Description | Category |")
    print("|------------|-------------|----------|")

    skill_folders = [f for f in skills_dir.iterdir() if f.is_dir()]

    for skill_folder in sorted(skill_folders):
        skill_file = skill_folder / "SKILL.md"

        if not skill_file.exists():
            continue

        try:
            with open(skill_file, 'r', encoding='utf-8') as f:
                content = f.read()

            frontmatter = extract_yaml_frontmatter(content)
            name = frontmatter.get('name', skill_folder.name)
            description = frontmatter.get('description', 'No description')[:80]
            category = frontmatter.get('category', 'N/A')

            print(f"| {name} | {description} | {category} |")

        except Exception as e:
            print_error(f"Failed to read {skill_file}: {e}")

    print()


def display_usage_instructions(is_marketplace: bool, has_local_skills: bool, skills_dir: Optional[Path]):
    """Display usage instructions based on repository type"""
    print_header("## Usage Instructions", Colors.MAGENTA)

    if is_marketplace:
        print(f"{Colors.BOLD}Installing from this marketplace:{Colors.NC}")
        print(f"  1. Add marketplace to Claude Code:")
        print(f"     {Colors.CYAN}/plugin marketplace add <github-url-or-local-path>{Colors.NC}\n")
        print(f"  2. Browse available plugins:")
        print(f"     {Colors.CYAN}/plugin{Colors.NC}\n")
        print(f"  3. Install a skill:")
        print(f"     {Colors.CYAN}/plugin install <skill-name>{Colors.NC}\n")

    if has_local_skills:
        print(f"{Colors.BOLD}Using local skills:{Colors.NC}")
        print(f"  1. Install skill locally:")
        print(f"     {Colors.CYAN}claude skill install ./{skills_dir.name}/<skill-name>{Colors.NC}\n")
        print(f"  2. List installed skills:")
        print(f"     {Colors.CYAN}claude skill list{Colors.NC}\n")
        print(f"  3. Use a skill in Claude Code:")
        print(f"     {Colors.CYAN}/<skill-name>{Colors.NC}\n")

    print(f"{Colors.BOLD}Quick command:{Colors.NC}")
    print(f"  Run this script anytime: {Colors.CYAN}python scripts/list-resources.py{Colors.NC}\n")

    print(f"{Colors.BOLD}For more information:{Colors.NC}")
    print(f"  - Claude Skills Documentation: {Colors.CYAN}https://docs.anthropic.com/claude/docs/skills{Colors.NC}")
    print(f"  - Repository README: Check README.md for detailed guides\n")


def main():
    """Main execution"""
    print_header("=== Available Resources ===", Colors.CYAN)

    cwd = Path.cwd()
    is_marketplace, skills_dir = detect_repository_type(cwd)

    if is_marketplace:
        print_success("Marketplace detected\n")
    if skills_dir:
        print_success(f"Local skills directory found: {Colors.BOLD}{skills_dir.name}/{Colors.NC}\n")

    # Display marketplace information
    if is_marketplace:
        marketplace_data = load_marketplace_data(cwd)
        if marketplace_data:
            display_marketplace_info(marketplace_data)
            display_marketplace_skills(marketplace_data)

    # Display local skills
    if skills_dir:
        display_local_skills(skills_dir)

    # Show usage instructions
    if is_marketplace or skills_dir:
        display_usage_instructions(is_marketplace, bool(skills_dir), skills_dir)
    else:
        print_error("No marketplace or skills directory found in this repository.")
        print("  This script should be run from:")
        print("    - A marketplace repository (with .claude-plugin/marketplace.json)")
        print("    - A project with local skills (skills/ or .claude/skills/ directory)\n")
        sys.exit(1)

    print_header("=== End of Resources List ===", Colors.CYAN)


if __name__ == "__main__":
    main()
