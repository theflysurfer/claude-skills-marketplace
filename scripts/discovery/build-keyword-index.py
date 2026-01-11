#!/usr/bin/env python3
"""
Build keyword index for fast skill routing (<50ms target).
Pre-computes all keyword→skill mappings as JSON lookup.

Run during /sync. Output: ~/.claude/cache/keyword-index.json
"""

import json
import re
from pathlib import Path
from collections import defaultdict

CLAUDE_HOME = Path.home() / ".claude"
TRIGGERS_FILE = CLAUDE_HOME / "configs" / "skill-triggers.json"
INDEX_FILE = CLAUDE_HOME / "cache" / "keyword-index.json"


def tokenize(text: str) -> set:
    """Extract lowercase words from text."""
    return set(re.findall(r'\b\w{2,}\b', text.lower()))


def build_index():
    """Build keyword→skills inverted index."""
    if not TRIGGERS_FILE.exists():
        print(f"Error: {TRIGGERS_FILE} not found")
        return False

    with open(TRIGGERS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    skills = data.get("skills", [])
    if not skills:
        print("No skills found")
        return False

    # Build inverted index: keyword → [(skill_name, weight)]
    keyword_index = defaultdict(list)
    skill_info = {}

    for skill in skills:
        name = skill.get("name", "")
        desc = skill.get("description", "")
        source = skill.get("source", "")
        triggers = skill.get("triggers", [])

        skill_info[name] = {
            "description": desc[:100],
            "source": source
        }

        # Index each trigger phrase
        for trigger in triggers:
            trigger_lower = trigger.lower()
            words = tokenize(trigger)

            # Full phrase match (highest weight)
            keyword_index[trigger_lower].append((name, 1.0))

            # Individual words (lower weight)
            for word in words:
                if len(word) >= 3:
                    keyword_index[word].append((name, 0.3))

        # Index description words (lowest weight)
        desc_words = tokenize(desc)
        for word in desc_words:
            if len(word) >= 4:
                keyword_index[word].append((name, 0.1))

    # Deduplicate and sort by weight
    final_index = {}
    for keyword, matches in keyword_index.items():
        # Aggregate scores per skill
        skill_scores = defaultdict(float)
        for skill_name, weight in matches:
            skill_scores[skill_name] += weight

        # Sort by score descending, keep top 5
        sorted_skills = sorted(skill_scores.items(), key=lambda x: -x[1])[:5]
        final_index[keyword] = sorted_skills

    # Save index
    INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)

    output = {
        "version": "1.0.0",
        "keywords": final_index,
        "skills": skill_info,
        "triggers_mtime": TRIGGERS_FILE.stat().st_mtime
    }

    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False)

    print(f"Keyword index built: {INDEX_FILE}")
    print(f"  Skills: {len(skill_info)}")
    print(f"  Keywords: {len(final_index)}")
    print(f"  Size: {INDEX_FILE.stat().st_size / 1024:.1f} KB")

    return True


if __name__ == "__main__":
    build_index()
