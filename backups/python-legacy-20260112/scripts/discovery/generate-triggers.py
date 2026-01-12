#!/usr/bin/env python3
"""
Generate skill-triggers.json from hybrid-registry.json or SKILL.md files.

Primary mode: Uses hybrid-registry.json if available and up-to-date.
Fallback mode: Scans all skills/*/SKILL.md files directly.

Usage:
    python generate-triggers.py [--marketplace-path PATH] [--from-registry]
"""

import json
import re
import sys
from pathlib import Path

# Configuration
CLAUDE_HOME = Path.home() / ".claude"

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


def extract_content_summary(content: str, max_length: int = 500) -> str:
    """Extract a summary from SKILL.md content for RAG-style indexing.

    This extracts:
    - First paragraph after frontmatter
    - Section headers (## and ###)
    - Key terms from the content
    """
    # Remove frontmatter
    content_without_fm = re.sub(r'^---\n.*?\n---\n?', '', content, flags=re.DOTALL)

    # Remove code blocks (they add noise)
    content_clean = re.sub(r'```[\s\S]*?```', '', content_without_fm)

    # Remove inline code
    content_clean = re.sub(r'`[^`]+`', '', content_clean)

    # Extract section headers as key terms
    headers = re.findall(r'^##+ (.+)$', content_clean, re.MULTILINE)

    # Get first non-empty paragraph
    paragraphs = [p.strip() for p in content_clean.split('\n\n') if p.strip()]
    first_para = paragraphs[0] if paragraphs else ""

    # Build summary: headers + first paragraph
    summary_parts = []

    if headers:
        # Include meaningful headers (skip generic ones like "Usage", "Installation")
        meaningful_headers = [h for h in headers if len(h) > 3 and h.lower() not in
                           ('usage', 'installation', 'configuration', 'examples', 'notes')]
        if meaningful_headers:
            summary_parts.append(' | '.join(meaningful_headers[:5]))

    if first_para:
        # Clean up the first paragraph
        first_para = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', first_para)  # Remove links
        first_para = re.sub(r'[*_]{1,2}([^*_]+)[*_]{1,2}', r'\1', first_para)  # Remove bold/italic
        summary_parts.append(first_para[:300])

    summary = ' '.join(summary_parts)
    return summary[:max_length] if summary else ""


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


def generate_from_hybrid_registry(root: Path) -> bool:
    """
    Generate skill-triggers.json from hybrid-registry.json.

    Returns True if successful, False if registry not available.
    """
    registry_file = root / "configs" / "hybrid-registry.json"
    if not registry_file.exists():
        registry_file = CLAUDE_HOME / "configs" / "hybrid-registry.json"

    if not registry_file.exists():
        return False

    try:
        with open(registry_file, "r", encoding="utf-8") as f:
            registry = json.load(f)
    except (json.JSONDecodeError, IOError):
        return False

    skills = registry.get("skills", {})
    if not skills:
        return False

    output_file = root / "configs" / "skill-triggers.json"
    output_file.parent.mkdir(parents=True, exist_ok=True)

    skills_list = []
    for name, skill in skills.items():
        triggers = skill.get("triggers", [])
        if not triggers:
            continue

        skill_entry = {
            "name": name,
            "triggers": triggers,
            "description": skill.get("description", ""),
            "source": skill.get("resolved_source", "marketplace")
        }

        content_summary = skill.get("content_summary", "")
        if content_summary:
            skill_entry["content_summary"] = content_summary

        skills_list.append(skill_entry)

    # Sort by name for consistency
    skills_list.sort(key=lambda s: s["name"])

    result = {
        "generated": True,
        "version": "4.0.0",
        "description": "Auto-generated from hybrid-registry.json. DO NOT EDIT MANUALLY.",
        "source": "hybrid-registry",
        "skills": skills_list
    }

    output_file.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Generated from hybrid registry: {output_file}")
    print(f"  Skills included: {len(skills_list)}")

    # Count by source
    sources = {}
    for s in skills_list:
        src = s.get("source", "unknown")
        sources[src] = sources.get(src, 0) + 1

    print("\n  By source:")
    for src, count in sorted(sources.items()):
        print(f"    - {src}: {count}")

    return True


def main():
    # Parse arguments
    marketplace_path = None
    from_registry = "--from-registry" in sys.argv
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

    # Try hybrid registry first (if --from-registry or registry exists and is recent)
    registry_file = root / "configs" / "hybrid-registry.json"
    if from_registry or registry_file.exists():
        if generate_from_hybrid_registry(root):
            return

    # Fallback: scan SKILL.md files directly
    print("Falling back to SKILL.md scan...")

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

            # Extract content summary for RAG-style indexing
            content_summary = extract_content_summary(content)

            if triggers and isinstance(triggers, list) and len(triggers) > 0:
                skill_entry = {
                    "name": name,
                    "triggers": triggers,
                    "description": description
                }
                # Add content_summary if not empty (for enhanced semantic matching)
                if content_summary:
                    skill_entry["content_summary"] = content_summary
                skills_with_triggers.append(skill_entry)
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
