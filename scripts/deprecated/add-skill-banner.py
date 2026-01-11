#!/usr/bin/env python3
"""
Add Skill Banner - Adds activation announcement instruction to existing SKILL.md files.

This script scans all SKILL.md files and adds the observability instruction
if it's not already present.

Usage:
    python scripts/add-skill-banner.py [--dry-run] [--path PATH]
"""

import argparse
import re
import sys
from pathlib import Path

# Pattern to detect if skill already has activation announcement
ACTIVATION_PATTERNS = [
    r"🔧\s*Skill",
    r"Skill.*activated",
    r"Skill.*activé",
    r"Display activation message",
    r"affiche.*activation",
]

# Instruction to add
ACTIVATION_INSTRUCTION = '''
## Observability

**First**: At the start of execution, display:
```
🔧 Skill "{skill_name}" activated
```

'''


def has_activation_instruction(content: str) -> bool:
    """Check if the skill already has an activation instruction."""
    for pattern in ACTIVATION_PATTERNS:
        if re.search(pattern, content, re.IGNORECASE):
            return True
    return False


def extract_skill_name(content: str) -> str:
    """Extract skill name from YAML frontmatter."""
    match = re.search(r'^name:\s*(.+)$', content, re.MULTILINE)
    if match:
        return match.group(1).strip().strip('"\'')
    return "unknown-skill"


def find_insertion_point(content: str) -> int:
    """Find the best insertion point for the activation instruction.

    Strategy:
    1. After the first H2 heading (## ...)
    2. After the frontmatter if no H2 found
    """
    # Find end of frontmatter
    frontmatter_match = re.search(r'^---\s*\n.*?\n---\s*\n', content, re.DOTALL)
    if not frontmatter_match:
        return 0

    frontmatter_end = frontmatter_match.end()

    # Find first H2 after frontmatter
    rest_of_content = content[frontmatter_end:]
    h2_match = re.search(r'^##\s+.+$', rest_of_content, re.MULTILINE)

    if h2_match:
        # Insert after the first H2 heading and its following blank line
        h2_end = frontmatter_end + h2_match.end()
        # Skip any blank lines after the heading
        while h2_end < len(content) and content[h2_end] in '\n\r':
            h2_end += 1
        return h2_end

    return frontmatter_end


def add_activation_instruction(content: str, skill_name: str) -> str:
    """Add activation instruction to skill content."""
    instruction = ACTIVATION_INSTRUCTION.format(skill_name=skill_name)
    insertion_point = find_insertion_point(content)

    # Ensure proper spacing
    before = content[:insertion_point].rstrip('\n')
    after = content[insertion_point:].lstrip('\n')

    return before + '\n\n' + instruction.strip() + '\n\n' + after


def process_skill(skill_path: Path, dry_run: bool = False) -> dict:
    """Process a single SKILL.md file."""
    result = {
        'path': str(skill_path),
        'skill_name': None,
        'status': None,
        'message': None
    }

    try:
        content = skill_path.read_text(encoding='utf-8')
        skill_name = extract_skill_name(content)
        result['skill_name'] = skill_name

        if has_activation_instruction(content):
            result['status'] = 'skipped'
            result['message'] = 'Already has activation instruction'
            return result

        new_content = add_activation_instruction(content, skill_name)

        if dry_run:
            result['status'] = 'would_modify'
            result['message'] = 'Would add activation instruction'
        else:
            skill_path.write_text(new_content, encoding='utf-8')
            result['status'] = 'modified'
            result['message'] = 'Added activation instruction'

    except Exception as e:
        result['status'] = 'error'
        result['message'] = str(e)

    return result


def main():
    parser = argparse.ArgumentParser(
        description='Add activation announcement to SKILL.md files'
    )
    parser.add_argument(
        '--dry-run', '-n',
        action='store_true',
        help='Show what would be done without making changes'
    )
    parser.add_argument(
        '--path', '-p',
        type=Path,
        default=None,
        help='Path to skills directory (default: marketplace skills)'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Show all processed files, not just modified ones'
    )

    args = parser.parse_args()

    # Determine skills path
    if args.path:
        skills_path = args.path
    else:
        # Default to marketplace skills
        script_dir = Path(__file__).parent
        skills_path = script_dir.parent / 'skills'

    if not skills_path.exists():
        print(f"Error: Skills path not found: {skills_path}", file=sys.stderr)
        sys.exit(1)

    # Find all SKILL.md files
    skill_files = list(skills_path.glob('*/SKILL.md'))

    if not skill_files:
        print(f"No SKILL.md files found in {skills_path}")
        sys.exit(0)

    print(f"{'[DRY RUN] ' if args.dry_run else ''}Processing {len(skill_files)} skills in {skills_path}\n")

    stats = {'modified': 0, 'skipped': 0, 'error': 0, 'would_modify': 0}

    for skill_file in sorted(skill_files):
        result = process_skill(skill_file, dry_run=args.dry_run)
        stats[result['status']] = stats.get(result['status'], 0) + 1

        # Print result
        if args.verbose or result['status'] in ('modified', 'would_modify', 'error'):
            status_icon = {
                'modified': '+',
                'would_modify': '~',
                'skipped': '-',
                'error': '!'
            }.get(result['status'], '?')

            print(f"[{status_icon}] {result['skill_name']}: {result['message']}")

    # Summary
    print(f"\nSummary:")
    if args.dry_run:
        print(f"  Would modify: {stats.get('would_modify', 0)}")
    else:
        print(f"  Modified: {stats.get('modified', 0)}")
    print(f"  Skipped (already has): {stats.get('skipped', 0)}")
    if stats.get('error', 0) > 0:
        print(f"  Errors: {stats.get('error', 0)}")


if __name__ == '__main__':
    main()
