#!/usr/bin/env python3
"""
Fast Skill Router - Routes user prompts to skills in <50ms.
Uses pre-computed keyword index (no sklearn at runtime).

Hook: UserPromptSubmit
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict

# Configuration
CLAUDE_HOME = Path.home() / ".claude"
INDEX_FILE = CLAUDE_HOME / "cache" / "keyword-index.json"
TRIGGERS_FILE = CLAUDE_HOME / "configs" / "skill-triggers.json"

# Thresholds
MIN_SCORE = 0.2
TOP_K = 3

# Cache
_index_cache = None


def load_index() -> dict:
    """Load keyword index from cache."""
    global _index_cache
    if _index_cache:
        return _index_cache

    if not INDEX_FILE.exists():
        return None

    try:
        with open(INDEX_FILE, "r", encoding="utf-8") as f:
            _index_cache = json.load(f)

        # Check freshness
        if TRIGGERS_FILE.exists():
            current_mtime = TRIGGERS_FILE.stat().st_mtime
            if _index_cache.get("triggers_mtime", 0) != current_mtime:
                return None

        return _index_cache
    except Exception:
        return None


def tokenize(text: str) -> list:
    """Extract words from text."""
    return re.findall(r'\b\w{2,}\b', text.lower())


def route(prompt: str) -> list:
    """Route prompt to skills using keyword index."""
    index = load_index()
    if not index:
        return []

    keywords = index.get("keywords", {})
    skills_info = index.get("skills", {})

    # Tokenize prompt
    words = tokenize(prompt)
    prompt_lower = prompt.lower()

    # Score each skill
    skill_scores = defaultdict(float)

    # Check exact phrase matches first (highest priority)
    for keyword, matches in keywords.items():
        if keyword in prompt_lower:
            for skill_name, weight in matches:
                # Boost for exact phrase match
                boost = 1.5 if len(keyword.split()) > 1 else 1.0
                skill_scores[skill_name] += weight * boost

    # Check word matches
    for word in words:
        if word in keywords:
            for skill_name, weight in keywords[word]:
                skill_scores[skill_name] += weight * 0.5

    # Build results
    results = []
    for skill_name, score in sorted(skill_scores.items(), key=lambda x: -x[1]):
        if score >= MIN_SCORE:
            info = skills_info.get(skill_name, {})
            results.append({
                "name": skill_name,
                "description": info.get("description", ""),
                "source": info.get("source", ""),
                "score": score
            })
            if len(results) >= TOP_K:
                break

    return results


def main():
    # Read input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    user_prompt = input_data.get("user_prompt", "")

    # Skip short prompts
    if len(user_prompt) < 3:
        print("[routing: prompt too short]")
        sys.exit(0)

    # Check if index exists
    if not INDEX_FILE.exists():
        print("[routing: index not built - run build-keyword-index.py]")
        sys.exit(0)

    # Route
    matches = route(user_prompt)

    # Output
    if matches:
        print("---")
        print("SKILL SUGGESTION:")
        for match in matches:
            score_pct = f" ({match['score']:.0%})" if match.get('score') else ""
            source = match.get('source', '')
            source_tag = ""
            if source.startswith("project:"):
                source_tag = " [project]"
            elif source == "global":
                source_tag = " [global]"

            print(f"- **{match['name']}**: {match['description'][:60]}...{score_pct}{source_tag}")

        if len(matches) == 1:
            print(f"\nInvoke: Skill(\"{matches[0]['name']}\")")
        else:
            print(f"\nInvoke: Skill(\"<skill-name>\")")
        print("---")
    else:
        print("[routing: no skill match]")


if __name__ == "__main__":
    main()
