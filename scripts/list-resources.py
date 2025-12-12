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


def detect_repository_type(cwd: Path) -> Dict:
    """
    Detect if this is a marketplace or has local skills/commands
    Returns dict with: is_marketplace, skills (global/project), commands (global/project)
    """
    home = Path.home()

    result = {
        'is_marketplace': (cwd / ".claude-plugin" / "marketplace.json").exists(),
        'skills': {
            'global': None,
            'project': None,
            'marketplace': None,  # skills/ at root for marketplace repos
        },
        'commands': {
            'global': None,
            'project': None,
        }
    }

    # Marketplace skills directory (skills/ at root)
    if (cwd / "skills").exists() and (cwd / "skills").is_dir():
        result['skills']['marketplace'] = cwd / "skills"

    # Global skills (~/.claude/skills/)
    global_skills = home / ".claude" / "skills"
    if global_skills.exists() and global_skills.is_dir():
        result['skills']['global'] = global_skills

    # Project skills (.claude/skills/)
    project_skills = cwd / ".claude" / "skills"
    if project_skills.exists() and project_skills.is_dir():
        result['skills']['project'] = project_skills

    # Global commands (~/.claude/commands/)
    global_commands = home / ".claude" / "commands"
    if global_commands.exists() and global_commands.is_dir():
        result['commands']['global'] = global_commands

    # Project commands (.claude/commands/)
    project_commands = cwd / ".claude" / "commands"
    if project_commands.exists() and project_commands.is_dir():
        result['commands']['project'] = project_commands

    return result


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


def display_skills_from_dir(skills_dir: Path, scope: str):
    """Display skills from a specific directory with scope indicator"""
    skill_folders = [f for f in skills_dir.iterdir() if f.is_dir()]
    skills_found = []

    for skill_folder in sorted(skill_folders):
        skill_file = skill_folder / "SKILL.md"

        if not skill_file.exists():
            continue

        try:
            with open(skill_file, 'r', encoding='utf-8') as f:
                content = f.read()

            frontmatter = extract_yaml_frontmatter(content)
            name = frontmatter.get('name', skill_folder.name)
            description = frontmatter.get('description', 'No description')[:60]
            category = frontmatter.get('category', 'N/A')

            skills_found.append((name, description, category, scope))

        except Exception as e:
            print_error(f"Failed to read {skill_file}: {e}")

    return skills_found


def display_local_skills(skills_dirs: Dict[str, Optional[Path]]):
    """Display locally available skills from global and project directories"""
    print_header("## Local Skills", Colors.MAGENTA)

    all_skills = []

    # Collect skills from marketplace directory
    if skills_dirs.get('marketplace'):
        all_skills.extend(display_skills_from_dir(skills_dirs['marketplace'], 'marketplace'))

    # Collect skills from global directory
    if skills_dirs.get('global'):
        all_skills.extend(display_skills_from_dir(skills_dirs['global'], 'global'))

    # Collect skills from project directory
    if skills_dirs.get('project'):
        all_skills.extend(display_skills_from_dir(skills_dirs['project'], 'project'))

    if not all_skills:
        print("No local skills found.\n")
        return

    print("| Skill Name | Description | Category | Scope |")
    print("|------------|-------------|----------|-------|")

    for name, description, category, scope in all_skills:
        scope_display = f"{Colors.CYAN}{scope}{Colors.NC}" if scope == 'global' else scope
        print(f"| {name} | {description} | {category} | {scope} |")

    print()


def get_commands_from_dir(commands_dir: Path, scope: str) -> List[tuple]:
    """Get commands from a specific directory"""
    commands = []
    command_files = [f for f in commands_dir.iterdir() if f.suffix == '.md']

    for cmd_file in sorted(command_files):
        try:
            with open(cmd_file, 'r', encoding='utf-8') as f:
                content = f.read()

            frontmatter = extract_yaml_frontmatter(content)
            command_name = f"/{cmd_file.stem}"
            description = frontmatter.get('description', 'No description')[:60]

            commands.append((command_name, description, scope))

        except Exception as e:
            print_error(f"Failed to read {cmd_file}: {e}")

    return commands


def display_slash_commands(commands_dirs: Dict[str, Optional[Path]]):
    """Display available slash commands from global and project directories"""
    print_header("## Slash Commands", Colors.MAGENTA)

    all_commands = []

    # Collect global commands
    if commands_dirs.get('global'):
        all_commands.extend(get_commands_from_dir(commands_dirs['global'], 'global'))

    # Collect project commands
    if commands_dirs.get('project'):
        all_commands.extend(get_commands_from_dir(commands_dirs['project'], 'project'))

    if not all_commands:
        print("No slash commands found.\n")
        return

    print("| Command | Description | Scope |")
    print("|---------|-------------|-------|")

    for command_name, description, scope in all_commands:
        print(f"| {command_name} | {description} | {scope} |")

    print()


def display_usage_instructions(config: Dict):
    """Display usage instructions based on repository type"""
    print_header("## Usage Instructions", Colors.MAGENTA)

    home = Path.home()
    has_skills = any(config['skills'].values())
    has_commands = any(config['commands'].values())

    if config['is_marketplace']:
        print(f"{Colors.BOLD}Installing from this marketplace:{Colors.NC}")
        print(f"  1. Add marketplace to Claude Code:")
        print(f"     {Colors.CYAN}/plugin marketplace add <github-url-or-local-path>{Colors.NC}\n")
        print(f"  2. Browse available plugins:")
        print(f"     {Colors.CYAN}/plugin{Colors.NC}\n")
        print(f"  3. Install a skill:")
        print(f"     {Colors.CYAN}/plugin install <skill-name>{Colors.NC}\n")

    if has_skills:
        print(f"{Colors.BOLD}Using skills:{Colors.NC}")
        print(f"  Skills are automatically invoked by Claude based on your task context.")
        print(f"  Claude reads skill descriptions and decides when to use them.\n")
        print(f"  {Colors.BOLD}Skill locations:{Colors.NC}")
        print(f"    - Global:  {Colors.CYAN}~/.claude/skills/<skill-name>/SKILL.md{Colors.NC}")
        print(f"    - Project: {Colors.CYAN}.claude/skills/<skill-name>/SKILL.md{Colors.NC}\n")

    if has_commands:
        print(f"{Colors.BOLD}Using slash commands:{Colors.NC}")
        print(f"  Slash commands are user-invoked with the /<command> syntax.")
        print(f"  Example: {Colors.CYAN}/list-resources{Colors.NC}\n")
        print(f"  {Colors.BOLD}Command locations:{Colors.NC}")
        print(f"    - Global:  {Colors.CYAN}~/.claude/commands/<command>.md{Colors.NC}")
        print(f"    - Project: {Colors.CYAN}.claude/commands/<command>.md{Colors.NC}\n")

    print(f"{Colors.BOLD}Quick command:{Colors.NC}")
    print(f"  Run this script anytime: {Colors.CYAN}python scripts/list-resources.py{Colors.NC}\n")

    print(f"{Colors.BOLD}For more information:{Colors.NC}")
    print(f"  - Claude Skills Documentation: {Colors.CYAN}https://docs.anthropic.com/claude/docs/skills{Colors.NC}")
    print(f"  - Repository README: Check README.md for detailed guides\n")


def main():
    """Main execution"""
    print_header("=== Available Resources ===", Colors.CYAN)

    cwd = Path.cwd()
    config = detect_repository_type(cwd)

    # Display detection summary
    if config['is_marketplace']:
        print_success("Marketplace detected")
    if config['skills']['marketplace']:
        print_success(f"Marketplace skills: {Colors.BOLD}skills/{Colors.NC}")
    if config['skills']['global']:
        print_success(f"Global skills: {Colors.BOLD}~/.claude/skills/{Colors.NC}")
    if config['skills']['project']:
        print_success(f"Project skills: {Colors.BOLD}.claude/skills/{Colors.NC}")
    if config['commands']['global']:
        print_success(f"Global commands: {Colors.BOLD}~/.claude/commands/{Colors.NC}")
    if config['commands']['project']:
        print_success(f"Project commands: {Colors.BOLD}.claude/commands/{Colors.NC}")
    print()

    # Display marketplace information
    if config['is_marketplace']:
        marketplace_data = load_marketplace_data(cwd)
        if marketplace_data:
            display_marketplace_info(marketplace_data)
            display_marketplace_skills(marketplace_data)

    # Display local skills (from all sources)
    has_any_skills = any(config['skills'].values())
    if has_any_skills:
        display_local_skills(config['skills'])

    # Display slash commands (from all sources)
    has_any_commands = any(config['commands'].values())
    if has_any_commands:
        display_slash_commands(config['commands'])

    # Show usage instructions
    if config['is_marketplace'] or has_any_skills or has_any_commands:
        display_usage_instructions(config)
    else:
        print_error("No marketplace, skills, or commands found.")
        print("  This script should be run from:")
        print("    - A marketplace repository (with .claude-plugin/marketplace.json)")
        print("    - A project with skills (skills/, .claude/skills/, or ~/.claude/skills/)")
        print("    - A project with commands (.claude/commands/ or ~/.claude/commands/)\n")
        sys.exit(1)

    print_header("=== End of Resources List ===", Colors.CYAN)


if __name__ == "__main__":
    main()
