#!/usr/bin/env python3
"""Scan all projects for .claude/skills folders and list skills."""
import os
import json
from pathlib import Path

SCAN_DIRS = [
    Path(r"C:\Users\julien\OneDrive\Coding\_Projets de code"),
    Path(r"C:\Users\julien\OneDrive\Coding\_référentiels de code"),
]
EXCLUDE = ["2025.11 Claude Code MarketPlace"]

def find_skills(base_path: Path) -> dict:
    """Find all skills in a directory tree."""
    results = {}

    for item in base_path.iterdir():
        if not item.is_dir():
            continue
        if item.name in EXCLUDE:
            continue
        if item.name.startswith('.'):
            continue

        skills_path = item / ".claude" / "skills"
        if skills_path.exists() and skills_path.is_dir():
            skills = []
            for skill_dir in skills_path.iterdir():
                if skill_dir.is_dir():
                    skill_md = skill_dir / "SKILL.md"
                    if skill_md.exists():
                        skills.append({
                            "name": skill_dir.name,
                            "type": "skill",
                            "path": str(skill_dir)
                        })
                    else:
                        skills.append({
                            "name": skill_dir.name,
                            "type": "dir_no_skill",
                            "path": str(skill_dir)
                        })
                elif skill_dir.is_file() and skill_dir.suffix == ".md":
                    skills.append({
                        "name": skill_dir.name,
                        "type": "file",
                        "path": str(skill_dir)
                    })

            if skills:
                results[item.name] = {
                    "path": str(item),
                    "skills_count": len([s for s in skills if s["type"] == "skill"]),
                    "items": skills
                }

    return results

def main():
    all_results = {}
    total_skills = 0

    for scan_dir in SCAN_DIRS:
        if scan_dir.exists():
            results = find_skills(scan_dir)
            all_results[str(scan_dir)] = results
            for project, data in results.items():
                total_skills += data["skills_count"]

    # Print summary
    print(f"=== SCAN RESULTS ===\n")
    print(f"Total skills found: {total_skills}\n")

    for scan_dir, projects in all_results.items():
        if projects:
            print(f"\n--- {scan_dir} ---\n")
            for project, data in sorted(projects.items()):
                skill_count = data["skills_count"]
                other_count = len(data["items"]) - skill_count
                print(f"{project}: {skill_count} skills", end="")
                if other_count > 0:
                    print(f" (+{other_count} other files)", end="")
                print()
                for item in data["items"]:
                    marker = "[SKILL]" if item["type"] == "skill" else "[FILE]" if item["type"] == "file" else "[DIR]"
                    print(f"    {marker} {item['name']}")

    # Save JSON
    output_path = Path(__file__).parent.parent / "docs" / "skills-scan-results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "total_skills": total_skills,
            "results": all_results
        }, f, indent=2, ensure_ascii=False)
    print(f"\n\nJSON saved to: {output_path}")

if __name__ == "__main__":
    main()
