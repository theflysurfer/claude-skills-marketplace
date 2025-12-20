#!/usr/bin/env python3
"""
Build TF-IDF cache for semantic skill router.
Run this during /sync to pre-compute the model.

Output: ~/.claude/cache/tfidf-router.pkl
"""

import json
import pickle
from pathlib import Path

CLAUDE_HOME = Path.home() / ".claude"
TRIGGERS_FILE = CLAUDE_HOME / "configs" / "skill-triggers.json"
CACHE_FILE = CLAUDE_HOME / "cache" / "tfidf-router.pkl"


def build_cache():
    """Build and save TF-IDF cache."""
    if not TRIGGERS_FILE.exists():
        print(f"Error: {TRIGGERS_FILE} not found")
        return False

    # Load triggers
    with open(TRIGGERS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    skills = data.get("skills", [])
    if not skills:
        print("No skills found")
        return False

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
    except ImportError:
        print("sklearn not installed")
        return False

    # Build corpus
    corpus = []
    skill_map = []

    for skill in skills:
        triggers = skill.get("triggers", [])
        desc = skill.get("description", "")
        name = skill.get("name", "")
        source = skill.get("source", "")
        combined = " ".join(triggers + [desc])
        corpus.append(combined)
        skill_map.append({
            "name": name,
            "description": desc,
            "source": source
        })

    # Fit vectorizer
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        lowercase=True,
        token_pattern=r'\b\w+\b'
    )
    matrix = vectorizer.fit_transform(corpus)

    # Save cache
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)

    cache = {
        "vectorizer": vectorizer,
        "matrix": matrix,
        "skill_map": skill_map,
        "triggers_mtime": TRIGGERS_FILE.stat().st_mtime
    }

    with open(CACHE_FILE, "wb") as f:
        pickle.dump(cache, f)

    print(f"Cache built: {CACHE_FILE}")
    print(f"  Skills: {len(skills)}")
    print(f"  Vocabulary: {len(vectorizer.vocabulary_)} terms")
    print(f"  Matrix: {matrix.shape}")

    return True


if __name__ == "__main__":
    build_cache()
