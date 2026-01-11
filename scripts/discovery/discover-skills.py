#!/usr/bin/env python3
"""
Discover and index skills from multiple sources into hybrid-registry.json.

Scans marketplace, global, and project sources to build a unified skill index.
Detects local dependencies and resolves which source wins per skill.

Usage:
    python discover-skills.py [--verbose]
"""

import hashlib
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

# Try to import yaml
try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False

# Configuration
CLAUDE_HOME = Path.home() / ".claude"
SCRIPT_DIR = Path(__file__).parent.parent  # Marketplace root

REGISTRY_FILE = SCRIPT_DIR / "configs" / "hybrid-registry.json"
PROJECTS_REGISTRY = SCRIPT_DIR / "configs" / "projects-registry.json"
SYNC_CONFIG = SCRIPT_DIR / "configs" / "sync-config.json"

VERBOSE = "--verbose" in sys.argv or "-v" in sys.argv


def log(msg: str, always: bool = False):
    """Print message if verbose or always."""
    if VERBOSE or always:
        print(msg)


def extract_yaml_manual(content: str) -> dict:
    """Manual YAML parsing for simple frontmatter."""
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return {}

    yaml_content = match.group(1)
    result = {}
    current_list = None

    for line in yaml_content.split('\n'):
        if not line.strip():
            continue

        if line.startswith('  - '):
            if current_list is not None:
                value = line[4:].strip().strip('"').strip("'")
                current_list.append(value)
            continue

        if ':' in line and not line.startswith(' '):
            key, _, value = line.partition(':')
            key = key.strip()
            value = value.strip()

            if value:
                result[key] = value.strip('"').strip("'")
                current_list = None
            else:
                result[key] = []
                current_list = result[key]

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
    return extract_yaml_manual(content)


def extract_content_summary(content: str, max_length: int = 500) -> str:
    """Extract a summary from SKILL.md content."""
    content_without_fm = re.sub(r'^---\n.*?\n---\n?', '', content, flags=re.DOTALL)
    content_clean = re.sub(r'```[\s\S]*?```', '', content_without_fm)
    content_clean = re.sub(r'`[^`]+`', '', content_clean)

    headers = re.findall(r'^##+ (.+)$', content_clean, re.MULTILINE)
    paragraphs = [p.strip() for p in content_clean.split('\n\n') if p.strip()]
    first_para = paragraphs[0] if paragraphs else ""

    summary_parts = []
    if headers:
        meaningful = [h for h in headers if len(h) > 3 and h.lower() not in
                      ('usage', 'installation', 'configuration', 'examples', 'notes')]
        if meaningful:
            summary_parts.append(' | '.join(meaningful[:5]))

    if first_para:
        first_para = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', first_para)
        first_para = re.sub(r'[*_]{1,2}([^*_]+)[*_]{1,2}', r'\1', first_para)
        summary_parts.append(first_para[:300])

    summary = ' '.join(summary_parts)
    return summary[:max_length] if summary else ""


def detect_dependencies(content: str, skill_path: Path) -> dict:
    """Detect local dependencies in skill content."""
    deps = {
        "local_files": [],
        "requires_project_context": False,
        "external_scripts": []
    }

    # Find relative path references (../)
    relative_refs = re.findall(r'\.\./[^\s\)\]"\']+', content)
    if relative_refs:
        deps["local_files"] = list(set(relative_refs))
        deps["requires_project_context"] = True

    # Find script references
    script_refs = re.findall(r'scripts/[^\s\)\]"\']+\.py', content)
    if script_refs:
        deps["external_scripts"] = list(set(script_refs))

    return deps


def compute_hash(content: str) -> str:
    """Compute SHA256 hash of content."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()[:16]


def expand_path(path: str) -> Path:
    """Expand ~ and resolve path."""
    return Path(os.path.expanduser(path)).resolve()


def load_registry() -> dict:
    """Load or create hybrid registry."""
    if REGISTRY_FILE.exists():
        try:
            with open(REGISTRY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass

    return {
        "version": "1.0.0",
        "description": "Hybrid skill registry",
        "last_indexed": None,
        "sources": [],
        "project_sources": [],
        "skills": {}
    }


def load_projects_registry() -> dict:
    """Load projects registry to find project paths."""
    if PROJECTS_REGISTRY.exists():
        try:
            with open(PROJECTS_REGISTRY, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {"projects": {}}


def load_sync_config() -> dict:
    """Load sync configuration."""
    if SYNC_CONFIG.exists():
        try:
            with open(SYNC_CONFIG, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {}


def find_project_skill_sources(projects_reg: dict) -> list:
    """Find project sources based on project_sources patterns from sync-config.json."""
    sources = []
    sync_config = load_sync_config()

    for ps in sync_config.get("project_sources", []):
        pattern = ps.get("project_pattern", "")
        skills_path = ps.get("skills_path", ".claude/skills")
        priority = ps.get("priority", 2)

        # Search in projects registry
        for encoded_path, project in projects_reg.get("projects", {}).items():
            project_path = project.get("path", "")
            if not project_path:
                continue

            # Match pattern against project path
            import fnmatch
            if fnmatch.fnmatch(project_path, pattern) or pattern.replace("**/", "") in project_path:
                full_skills_path = Path(project_path) / skills_path
                if full_skills_path.exists():
                    source_id = f"project:{project.get('name', encoded_path)}"
                    sources.append({
                        "id": source_id,
                        "type": "project",
                        "path": str(full_skills_path),
                        "project_path": project_path,
                        "priority": priority,
                        "skills_pattern": "*/SKILL.md"
                    })
                    log(f"  Found project source: {source_id}")

    return sources


def scan_source(source: dict) -> list:
    """Scan a source for skills."""
    skills = []
    source_path = expand_path(source["path"])
    pattern = source.get("skills_pattern", "*/SKILL.md")

    if not source_path.exists():
        log(f"  Source path does not exist: {source_path}")
        return skills

    for skill_md in sorted(source_path.glob(pattern)):
        try:
            content = skill_md.read_text(encoding='utf-8')
            data = extract_yaml(content)

            name = data.get("name", skill_md.parent.name)
            description = data.get("description", "")
            triggers = data.get("triggers", [])

            if not triggers or not isinstance(triggers, list):
                log(f"    Skipped {name}: no triggers")
                continue

            content_summary = extract_content_summary(content)
            dependencies = detect_dependencies(content, skill_md)
            file_hash = compute_hash(content)
            mtime = datetime.fromtimestamp(skill_md.stat().st_mtime).isoformat()

            skill_info = {
                "name": name,
                "description": description,
                "triggers": triggers,
                "content_summary": content_summary,
                "location": {
                    "source": source["id"],
                    "path": str(skill_md.relative_to(source_path)),
                    "full_path": str(skill_md),
                    "hash": file_hash,
                    "mtime": mtime
                },
                "dependencies": dependencies
            }

            skills.append(skill_info)
            log(f"    Found: {name} ({len(triggers)} triggers)")

        except Exception as e:
            log(f"    Error processing {skill_md}: {e}")

    return skills


def resolve_skills(all_skills: list, sources: list) -> dict:
    """Resolve which source wins for each skill."""
    # Build priority map
    priority_map = {s["id"]: s.get("priority", 0) for s in sources}

    # Group by skill name
    by_name = {}
    for skill in all_skills:
        name = skill["name"]
        if name not in by_name:
            by_name[name] = []
        by_name[name].append(skill)

    # Resolve each skill
    resolved = {}
    for name, variants in by_name.items():
        # Sort by priority (higher wins)
        variants.sort(key=lambda s: priority_map.get(s["location"]["source"], 0), reverse=True)
        winner = variants[0]

        resolved[name] = {
            "name": name,
            "description": winner["description"],
            "triggers": winner["triggers"],
            "content_summary": winner.get("content_summary", ""),
            "locations": [v["location"] for v in variants],
            "resolved_source": winner["location"]["source"],
            "dependencies": winner.get("dependencies", {}),
            "scope": "project" if winner["location"]["source"].startswith("project:") else "global"
        }

        if len(variants) > 1:
            log(f"  Resolved {name}: {winner['location']['source']} wins over {[v['location']['source'] for v in variants[1:]]}")

    return resolved


def main():
    print("=" * 60)
    print("Hybrid Skill Discovery")
    print("=" * 60)

    # Load registries
    registry = load_registry()
    projects_reg = load_projects_registry()

    # Build sources list
    all_sources = list(registry.get("sources", []))

    # Add project sources (from sync-config.json)
    print("\nFinding project sources...")
    project_sources = find_project_skill_sources(projects_reg)
    all_sources.extend(project_sources)

    print(f"\nSources to scan: {len(all_sources)}")
    for s in all_sources:
        print(f"  [{s.get('priority', 0)}] {s['id']}: {s['path']}")

    # Scan all sources
    all_skills = []
    for source in all_sources:
        print(f"\nScanning {source['id']}...")
        skills = scan_source(source)
        all_skills.extend(skills)
        print(f"  Found {len(skills)} skills")

    # Resolve conflicts
    print("\nResolving skill priorities...")
    resolved = resolve_skills(all_skills, all_sources)

    # Update registry
    registry["skills"] = resolved
    registry["last_indexed"] = datetime.now().isoformat()

    # Save
    REGISTRY_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(REGISTRY_FILE, 'w', encoding='utf-8') as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)

    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"Total skills indexed: {len(resolved)}")

    # Count by scope
    global_count = sum(1 for s in resolved.values() if s["scope"] == "global")
    project_count = sum(1 for s in resolved.values() if s["scope"] == "project")
    print(f"  Global skills: {global_count}")
    print(f"  Project skills: {project_count}")

    # Count with dependencies
    with_deps = sum(1 for s in resolved.values() if s.get("dependencies", {}).get("requires_project_context"))
    print(f"  Skills with local dependencies: {with_deps}")

    # Multi-location skills
    multi = sum(1 for s in resolved.values() if len(s.get("locations", [])) > 1)
    print(f"  Skills in multiple locations: {multi}")

    print(f"\nRegistry saved to: {REGISTRY_FILE}")


if __name__ == "__main__":
    main()
