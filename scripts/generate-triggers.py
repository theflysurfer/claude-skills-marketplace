#!/usr/bin/env python3
"""
Generate skill-triggers.json from SKILL.md YAML frontmatter.

Scans all skills/*/SKILL.md files and extracts the 'triggers' field
from the YAML frontmatter to generate a centralized triggers file.

Usage:
    python generate-triggers.py [--marketplace-path PATH]
"""

import json
import re
import sys
from pathlib import Path

# Try to import yaml, fall back to manual parsing if not available
try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


def extract_yaml_manual(content: str) -> dict:
    """Manual YAML parsing for simple frontmatter (fallback)."""
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return {}

    yaml_content = match.group(1)
    result = {}
    current_key = None
    current_list = None

    for line in yaml_content.split('\n'):
        # Skip empty lines
        if not line.strip():
            continue

        # Check for list item
        if line.startswith('  - '):
            if current_list is not None:
                # Clean the value (remove quotes)
                value = line[4:].strip().strip('"').strip("'")
                current_list.append(value)
            continue

        # Check for key: value
        if ':' in line and not line.startswith(' '):
            key, _, value = line.partition(':')
            key = key.strip()
            value = value.strip()

            if value:
                # Simple string value (remove quotes)
                result[key] = value.strip('"').strip("'")
                current_list = None
            else:
                # Start of a list or nested object
                result[key] = []
                current_list = result[key]
                current_key = key

    return result


def extract_yaml(content: str) -> dict:
    """Extract YAML frontmatter from markdown content."""
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return {}

    if HAS_YAML:
        try:
            return yaml.safe_load(match.group(1)) or {}
        except yaml.YAMLError:
            return extract_yaml_manual(content)
    else:
        return extract_yaml_manual(content)


def find_marketplace_root() -> Path:
    """Find marketplace root from script location or current directory."""
    # Try script directory first
    script_dir = Path(__file__).parent
    if (script_dir.parent / "skills").exists():
        return script_dir.parent

    # Try current directory
    cwd = Path.cwd()
    if (cwd / "skills").exists():
        return cwd

    # Try parent directories
    for parent in cwd.parents:
        if (parent / "skills").exists() and (parent / "configs").exists():
            return parent

    raise FileNotFoundError("Could not find marketplace root (directory with skills/ folder)")


def main():
    # Parse arguments
    marketplace_path = None
    args = sys.argv[1:]
    if "--marketplace-path" in args:
        idx = args.index("--marketplace-path")
        if idx + 1 < len(args):
            marketplace_path = Path(args[idx + 1])

    # Find marketplace root
    if marketplace_path:
        root = marketplace_path
    else:
        root = find_marketplace_root()

    skills_dir = root / "skills"
    output_file = root / "configs" / "skill-triggers.json"

    if not skills_dir.exists():
        print(f"Error: skills directory not found at {skills_dir}", file=sys.stderr)
        sys.exit(1)

    # Ensure configs directory exists
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Scan all SKILL.md files
    skills_with_triggers = []
    skills_without_triggers = []

    for skill_md in sorted(skills_dir.glob("*/SKILL.md")):
        try:
            content = skill_md.read_text(encoding="utf-8")
            data = extract_yaml(content)

            name = data.get("name", skill_md.parent.name)
            description = data.get("description", "")
            triggers = data.get("triggers", [])

            if triggers and isinstance(triggers, list) and len(triggers) > 0:
                skills_with_triggers.append({
                    "name": name,
                    "triggers": triggers,
                    "description": description
                })
            else:
                skills_without_triggers.append(name)

        except Exception as e:
            print(f"Warning: Error processing {skill_md}: {e}", file=sys.stderr)

    # Generate output
    result = {
        "generated": True,
        "version": "3.0.0",
        "description": "Auto-generated from SKILL.md frontmatter. DO NOT EDIT MANUALLY.",
        "skills": skills_with_triggers
    }

    output_file.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    # Report
    print(f"Generated: {output_file}")
    print(f"  Skills with triggers: {len(skills_with_triggers)}")
    print(f"  Skills without triggers: {len(skills_without_triggers)}")

    if skills_with_triggers:
        print("\nSkills included:")
        for skill in skills_with_triggers:
            print(f"  - {skill['name']} ({len(skill['triggers'])} triggers)")

    if skills_without_triggers and len(skills_without_triggers) <= 10:
        print(f"\nSkills without triggers (not included):")
        for name in skills_without_triggers[:10]:
            print(f"  - {name}")
        if len(skills_without_triggers) > 10:
            print(f"  ... and {len(skills_without_triggers) - 10} more")


if __name__ == "__main__":
    main()
