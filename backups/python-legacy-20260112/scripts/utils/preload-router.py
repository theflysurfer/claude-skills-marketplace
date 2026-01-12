#!/usr/bin/env python3
"""
Pre-load TF-IDF router for fast skill routing.
Run at session start to warm up sklearn and build cache.

Hook: SessionStart (background)

Usage:
    python preload-router.py          # Pre-load and cache
    python preload-router.py --check  # Check if cache exists
"""

import json
import pickle
import sys
import time
from pathlib import Path

CLAUDE_HOME = Path.home() / ".claude"
TRIGGERS_FILE = CLAUDE_HOME / "configs" / "skill-triggers.json"
CACHE_FILE = CLAUDE_HOME / "cache" / "tfidf-router.pkl"


def load_triggers() -> dict:
    """Load skill triggers."""
    if not TRIGGERS_FILE.exists():
        return {"skills": []}
    return json.loads(TRIGGERS_FILE.read_text(encoding="utf-8"))


def build_and_cache():
    """Build TF-IDF vectorizer and cache it."""
    start = time.time()

    # Import sklearn (slow part)
    from sklearn.feature_extraction.text import TfidfVectorizer
    import_time = time.time() - start

    # Load skills
    triggers_data = load_triggers()
    skills = triggers_data.get("skills", [])

    if not skills:
        print("No skills found")
        return False

    # Build corpus
    corpus = []
    skill_map = []

    for skill in skills:
        triggers = skill.get("triggers", [])
        desc = skill.get("description", "")
        combined = ' '.join(triggers + [desc])
        corpus.append(combined)
        skill_map.append({
            "name": skill["name"],
            "description": desc
        })

    # Fit vectorizer
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        lowercase=True,
        token_pattern=r'\b\w+\b'
    )
    matrix = vectorizer.fit_transform(corpus)
    build_time = time.time() - start - import_time

    # Cache
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)

    cache_data = {
        "vectorizer": vectorizer,
        "matrix": matrix,
        "skill_map": skill_map,
        "triggers_mtime": TRIGGERS_FILE.stat().st_mtime if TRIGGERS_FILE.exists() else 0,
        "created_at": time.time()
    }

    with open(CACHE_FILE, "wb") as f:
        pickle.dump(cache_data, f)

    total_time = time.time() - start
    print(f"Router pre-loaded: {len(skills)} skills in {total_time*1000:.0f}ms")
    print(f"  sklearn import: {import_time*1000:.0f}ms")
    print(f"  TF-IDF build: {build_time*1000:.0f}ms")
    print(f"  Cache saved: {CACHE_FILE}")

    return True


def check_cache() -> bool:
    """Check if cache exists and is valid."""
    if not CACHE_FILE.exists():
        print("Cache not found")
        return False

    try:
        with open(CACHE_FILE, "rb") as f:
            cache = pickle.load(f)

        # Check if triggers file changed
        current_mtime = TRIGGERS_FILE.stat().st_mtime if TRIGGERS_FILE.exists() else 0
        if cache.get("triggers_mtime", 0) != current_mtime:
            print("Cache outdated (triggers changed)")
            return False

        skill_count = len(cache.get("skill_map", []))
        created = cache.get("created_at", 0)
        age_mins = (time.time() - created) / 60

        print(f"Cache valid: {skill_count} skills, {age_mins:.0f}min old")
        return True

    except Exception as e:
        print(f"Cache invalid: {e}")
        return False


def load_cache():
    """Load cached TF-IDF router."""
    if not CACHE_FILE.exists():
        return None

    try:
        with open(CACHE_FILE, "rb") as f:
            cache = pickle.load(f)

        # Check freshness
        current_mtime = TRIGGERS_FILE.stat().st_mtime if TRIGGERS_FILE.exists() else 0
        if cache.get("triggers_mtime", 0) != current_mtime:
            return None

        return cache

    except Exception:
        return None


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        valid = check_cache()
        sys.exit(0 if valid else 1)
    else:
        success = build_and_cache()
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
