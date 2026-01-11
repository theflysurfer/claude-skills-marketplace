#!/usr/bin/env python3
"""
Semantic Skill Router - Routes user prompts to relevant skills.
Hook: UserPromptSubmit

Uses TF-IDF for fast routing (~2ms per query).
Falls back to sentence-transformers for ambiguous cases.
"""

import json
import os
import re
import sys
import fnmatch
from pathlib import Path

# Configuration
CLAUDE_HOME = Path.home() / ".claude"
SCRIPT_DIR = Path(__file__).parent.parent  # Marketplace root (fallback)

# Config files
TRIGGERS_FILE = CLAUDE_HOME / "configs" / "skill-triggers.json"
if not TRIGGERS_FILE.exists():
    TRIGGERS_FILE = SCRIPT_DIR / "configs" / "skill-triggers.json"

REGISTRY_FILE = SCRIPT_DIR / "configs" / "projects-registry.json"
if not REGISTRY_FILE.exists():
    REGISTRY_FILE = CLAUDE_HOME / "configs" / "projects-registry.json"

# Hybrid registry (new)
HYBRID_REGISTRY_FILE = SCRIPT_DIR / "configs" / "hybrid-registry.json"
if not HYBRID_REGISTRY_FILE.exists():
    HYBRID_REGISTRY_FILE = CLAUDE_HOME / "configs" / "hybrid-registry.json"

TRACKING_DIR = CLAUDE_HOME / "routing-tracking"
TFIDF_CACHE_FILE = CLAUDE_HOME / "cache" / "tfidf-router.pkl"

# Thresholds
TFIDF_THRESHOLD = 0.15  # Minimum TF-IDF score
SEMANTIC_THRESHOLD = 0.4  # Minimum semantic score
PROJECT_SKILL_BOOST = 0.15  # Boost for project-matching skills
TOP_K = 3

# Cache for TF-IDF vectorizer and matrix
_tfidf_cache = {}


def load_tfidf_cache():
    """Load pre-built TF-IDF cache if available."""
    global _tfidf_cache

    if _tfidf_cache:
        return True

    if not TFIDF_CACHE_FILE.exists():
        return False

    try:
        import pickle
        with open(TFIDF_CACHE_FILE, "rb") as f:
            cache = pickle.load(f)

        # Check freshness
        current_mtime = TRIGGERS_FILE.stat().st_mtime if TRIGGERS_FILE.exists() else 0
        if cache.get("triggers_mtime", 0) != current_mtime:
            return False

        _tfidf_cache["vectorizer"] = cache["vectorizer"]
        _tfidf_cache["matrix"] = cache["matrix"]
        _tfidf_cache["skill_map"] = [
            (i, s["name"], s["description"])
            for i, s in enumerate(cache["skill_map"])
        ]
        return True

    except Exception:
        return False


def load_triggers() -> dict:
    """Load skill triggers from JSON."""
    if not TRIGGERS_FILE.exists():
        return {"skills": []}
    with open(TRIGGERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def load_project_registry() -> dict:
    """Load project registry."""
    if not REGISTRY_FILE.exists():
        return {"projects": {}, "project_types": {}}
    try:
        with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {"projects": {}, "project_types": {}}


def load_hybrid_registry() -> dict:
    """Load hybrid skill registry."""
    if not HYBRID_REGISTRY_FILE.exists():
        return {"skills": {}, "sources": []}
    try:
        with open(HYBRID_REGISTRY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {"skills": {}, "sources": []}


def is_path_within(child: str, parent: str) -> bool:
    """Check if child path is within parent path."""
    try:
        child_path = Path(child).resolve()
        parent_path = Path(parent).resolve()
        return str(child_path).startswith(str(parent_path))
    except Exception:
        return False


def resolve_skill_path(skill_name: str, cwd: str = None) -> tuple:
    """
    Resolve a skill name to its physical path using hybrid registry.

    Priority: Project (2) > Global (1) > Marketplace (0)

    Returns:
        (full_path, skill_metadata) or (None, None) if not found
    """
    if cwd is None:
        cwd = os.getcwd()

    registry = load_hybrid_registry()
    skill = registry.get("skills", {}).get(skill_name)

    if not skill:
        return None, None

    locations = skill.get("locations", [])
    sources = {s["id"]: s for s in registry.get("sources", [])}

    # Sort locations by source priority (higher = better)
    def get_priority(loc):
        source = sources.get(loc.get("source"), {})
        return source.get("priority", 0)

    sorted_locs = sorted(locations, key=get_priority, reverse=True)

    for loc in sorted_locs:
        source_id = loc.get("source", "")

        # Project sources only match if we're in that project
        if source_id.startswith("project:"):
            source = sources.get(source_id, {})
            project_path = source.get("project_path", "")
            if project_path and is_path_within(cwd, project_path):
                return loc.get("full_path"), skill
            continue  # Skip project sources we're not in

        # Global and marketplace are always available
        return loc.get("full_path"), skill

    return None, None


def get_available_skills_for_context(cwd: str = None) -> list:
    """
    Get all skills available in current context.

    - Always includes global/marketplace skills
    - Adds project-specific skills if in a registered project
    """
    if cwd is None:
        cwd = os.getcwd()

    registry = load_hybrid_registry()
    sources = {s["id"]: s for s in registry.get("sources", [])}
    available = []

    for name, skill in registry.get("skills", {}).items():
        locations = skill.get("locations", [])

        # Check if any location is accessible
        accessible = False
        for loc in locations:
            source_id = loc.get("source", "")

            if source_id.startswith("project:"):
                source = sources.get(source_id, {})
                project_path = source.get("project_path", "")
                if project_path and is_path_within(cwd, project_path):
                    accessible = True
                    break
            else:
                # Global/marketplace always accessible
                accessible = True
                break

        if accessible:
            available.append({
                "name": name,
                "description": skill.get("description", ""),
                "triggers": skill.get("triggers", []),
                "scope": skill.get("scope", "global"),
                "resolved_source": skill.get("resolved_source", "")
            })

    return available


def encode_path(path: str) -> str:
    """Encode path like Claude Code."""
    normalized = os.path.normpath(os.path.abspath(path))
    encoded = normalized.replace('/', '-').replace('\\', '-').replace(':', '-')
    while '--' in encoded:
        encoded = encoded.replace('--', '-')
    return encoded.strip('-')


def get_project_skills() -> list[str]:
    """Get skills for current project."""
    cwd = os.getcwd()
    encoded = encode_path(cwd)
    registry = load_project_registry()

    if encoded in registry.get("projects", {}):
        return registry["projects"][encoded].get("skills", [])

    # Try to detect type
    project_types = registry.get("project_types", {})
    for type_name, type_info in project_types.items():
        for pattern in type_info.get("detection_patterns", []):
            from glob import glob as glob_files
            if glob_files(os.path.join(cwd, pattern), recursive=True):
                return type_info.get("default_skills", [])
    return []


def skill_matches_patterns(skill_name: str, patterns: list[str]) -> bool:
    """Check if skill matches patterns."""
    for pattern in patterns:
        if fnmatch.fnmatch(skill_name, pattern):
            return True
    return False


def apply_project_boost(matches: list, project_skills: list[str]) -> list:
    """Boost scores for project-matching skills."""
    if not project_skills:
        return matches

    boosted = []
    for match in matches:
        new_match = match.copy()
        if skill_matches_patterns(match["name"], project_skills):
            new_match["score"] = min(1.0, match.get("score", 0.5) + PROJECT_SKILL_BOOST)
            new_match["project_boost"] = True
        boosted.append(new_match)

    boosted.sort(key=lambda x: x["score"], reverse=True)
    return boosted


# =============================================================================
# TF-IDF ROUTER (Fast: ~2ms per query)
# =============================================================================

def get_tfidf_router(skills: list):
    """Get or create cached TF-IDF vectorizer and matrix."""
    global _tfidf_cache

    # Try loading from disk cache first (fast: ~10ms)
    if not _tfidf_cache and load_tfidf_cache():
        pass  # Cache loaded from disk

    if "vectorizer" in _tfidf_cache:
        return _tfidf_cache["vectorizer"], _tfidf_cache["matrix"], _tfidf_cache["skill_map"]

    # Fall back to building (slow first time: ~3s with sklearn import)
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
    except ImportError:
        return None, None, None

    # Build corpus
    corpus = []
    skill_map = []  # (index, skill_name, skill_description)

    for skill in skills:
        triggers = skill.get("triggers", [])
        desc = skill.get("description", "")
        combined = ' '.join(triggers + [desc])
        corpus.append(combined)
        skill_map.append((len(corpus) - 1, skill["name"], desc))

    if not corpus:
        return None, None, None

    # Fit vectorizer
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        lowercase=True,
        token_pattern=r'\b\w+\b'
    )
    matrix = vectorizer.fit_transform(corpus)

    _tfidf_cache["vectorizer"] = vectorizer
    _tfidf_cache["matrix"] = matrix
    _tfidf_cache["skill_map"] = skill_map

    return vectorizer, matrix, skill_map


def tfidf_route(prompt: str, skills: list) -> list:
    """Route using TF-IDF similarity."""
    vectorizer, matrix, skill_map = get_tfidf_router(skills)

    if vectorizer is None:
        return []

    try:
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np

        query_vec = vectorizer.transform([prompt])
        similarities = cosine_similarity(query_vec, matrix).flatten()

        # Get top matches above threshold
        top_indices = np.argsort(similarities)[-TOP_K:][::-1]

        matches = []
        for idx in top_indices:
            score = similarities[idx]
            if score >= TFIDF_THRESHOLD:
                _, name, desc = skill_map[idx]
                matches.append({
                    "name": name,
                    "description": desc,
                    "score": float(score),
                    "method": "tfidf"
                })

        return matches

    except Exception as e:
        sys.stderr.write(f"TF-IDF error: {e}\n")
        return []


# =============================================================================
# KEYWORD FALLBACK (Ultra-fast: <1ms)
# =============================================================================

def keyword_fallback(prompt: str, skills: list) -> list:
    """Simple keyword matching fallback."""
    prompt_lower = prompt.lower()
    prompt_words = set(re.findall(r'\b\w+\b', prompt_lower))

    matches = []
    for skill in skills:
        best_score = 0
        for trigger in skill.get("triggers", []):
            trigger_lower = trigger.lower()
            trigger_words = set(re.findall(r'\b\w+\b', trigger_lower))

            if len(trigger_lower) < 3:
                continue

            if trigger_words:
                matching = prompt_words & trigger_words
                score = len(matching) / len(trigger_words)

                if trigger_lower in prompt_lower:
                    score = max(score, 0.9)

                best_score = max(best_score, score)

        if best_score >= 0.5:
            matches.append({
                "name": skill["name"],
                "description": skill.get("description", ""),
                "score": best_score,
                "method": "keyword"
            })

    matches.sort(key=lambda x: x["score"], reverse=True)
    return matches[:TOP_K]


# =============================================================================
# MAIN ROUTER
# =============================================================================

def route_prompt(prompt: str, skills: list) -> list:
    """Route prompt to skills using best available method."""
    # Try TF-IDF first (fast)
    matches = tfidf_route(prompt, skills)

    # If no good matches, try keyword fallback
    if not matches or matches[0]["score"] < TFIDF_THRESHOLD:
        keyword_matches = keyword_fallback(prompt, skills)
        if keyword_matches:
            matches = keyword_matches

    return matches


# =============================================================================
# TRACKING
# =============================================================================

def get_tracking_files():
    """Get tracking file paths."""
    TRACKING_DIR.mkdir(parents=True, exist_ok=True)
    return {
        "suggestion": TRACKING_DIR / "last-suggestion.json",
        "invocation": TRACKING_DIR / "last-invocation.json"
    }


def save_suggestion(skills: list):
    """Save suggestion for tracking."""
    files = get_tracking_files()
    data = {
        "suggested_skills": [s["name"] for s in skills],
        "timestamp": __import__("time").time()
    }
    files["suggestion"].write_text(json.dumps(data), encoding="utf-8")


def load_and_clear_tracking() -> dict:
    """Load and clear tracking data."""
    files = get_tracking_files()
    result = {"suggestion": None, "invocation": None}

    for key in ["suggestion", "invocation"]:
        if files[key].exists():
            try:
                result[key] = json.loads(files[key].read_text(encoding="utf-8"))
                files[key].unlink()
            except:
                pass

    return result


def show_previous_result():
    """Show previous routing result."""
    tracking = load_and_clear_tracking()

    if not tracking["suggestion"]:
        return

    suggested = tracking["suggestion"].get("suggested_skills", [])
    invoked = tracking["invocation"].get("skill_name") if tracking["invocation"] else None

    if not suggested:
        return

    print("---")
    if invoked and invoked in suggested:
        print(f"📍 Routing précédent: **{invoked}** ✅")
    elif invoked:
        print(f"📍 Routing précédent: **{invoked}** ↗️ (suggestion: {', '.join(suggested[:2])})")
    else:
        print(f"📍 Routing précédent: ❌ (suggestion ignorée: {', '.join(suggested[:2])})")
    print("---")
    print()


# =============================================================================
# MAIN
# =============================================================================

def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    user_prompt = input_data.get("user_prompt", "")

    # Show previous result
    show_previous_result()

    # Skip short prompts
    if len(user_prompt) < 3:
        print("[routing: prompt too short]")
        sys.exit(0)

    # Load skills
    triggers_data = load_triggers()
    skills = triggers_data.get("skills", [])

    if not skills:
        sys.exit(0)

    # Route
    matches = route_prompt(user_prompt, skills)

    # Apply project boost
    project_skills = get_project_skills()
    if project_skills:
        matches = apply_project_boost(matches, project_skills)

    # Output
    if matches:
        save_suggestion(matches)

        # Enrich with hybrid registry info
        hybrid_reg = load_hybrid_registry()
        hybrid_skills = hybrid_reg.get("skills", {})

        print("---")
        print("SKILL SUGGESTION:")
        for match in matches[:TOP_K]:
            score_pct = f" ({match['score']:.0%})" if match.get('score') else ""
            boost = " 📍" if match.get('project_boost') else ""

            # Get source from hybrid registry
            skill_info = hybrid_skills.get(match['name'], {})
            source = skill_info.get("resolved_source", "")
            source_tag = ""
            if source.startswith("project:"):
                source_tag = " [project]"
            elif source == "global":
                source_tag = " [global]"

            print(f"- **{match['name']}**: {match['description'][:80]}...{score_pct}{boost}{source_tag}")

        if len(matches) == 1:
            print(f"\nInvoke: Skill(\"{matches[0]['name']}\")")
        else:
            print(f"\nInvoke: Skill(\"<skill-name>\")")
        print("---")
    else:
        print("[routing: no skill match]")


if __name__ == "__main__":
    main()
