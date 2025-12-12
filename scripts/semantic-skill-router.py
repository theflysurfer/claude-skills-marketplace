#!/usr/bin/env python3
"""
Semantic Skill Router - Routes user prompts to relevant skills using semantic matching.
Hook: UserPromptSubmit

Uses sentence-transformers for local embedding (no API key needed).
Falls back to keyword matching if semantic-router not installed.
"""

import json
import os
import re
import sys
from pathlib import Path

# Configuration
CLAUDE_HOME = Path.home() / ".claude"
SCRIPT_DIR = Path(__file__).parent.parent  # Marketplace root (fallback)

# Try ~/.claude/configs first, then marketplace
TRIGGERS_FILE = CLAUDE_HOME / "configs" / "skill-triggers.json"
if not TRIGGERS_FILE.exists():
    TRIGGERS_FILE = SCRIPT_DIR / "configs" / "skill-triggers.json"

TRACKING_DIR = CLAUDE_HOME / "routing-tracking"

# Thresholds and settings
SIMILARITY_THRESHOLD = 0.4  # Minimum similarity score to suggest
TOP_K = 3  # Maximum number of suggestions
MODEL_NAME = os.environ.get("SEMANTIC_ROUTER_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# Singleton for encoder/router to avoid reloading
_router_cache = {}

def load_triggers() -> dict:
    """Load skill triggers from JSON file."""
    if not TRIGGERS_FILE.exists():
        return {"skills": []}
    with open(TRIGGERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def get_tracking_files():
    """Get paths to tracking files."""
    TRACKING_DIR.mkdir(parents=True, exist_ok=True)
    return {
        "suggestion": TRACKING_DIR / "last-suggestion.json",
        "invocation": TRACKING_DIR / "last-invocation.json"
    }

def save_suggestion(skills: list):
    """Save current suggestion for later comparison."""
    files = get_tracking_files()
    data = {
        "suggested_skills": [s["name"] for s in skills],
        "timestamp": __import__("time").time()
    }
    files["suggestion"].write_text(json.dumps(data), encoding="utf-8")

def load_and_clear_tracking() -> dict:
    """Load tracking data and clear files."""
    files = get_tracking_files()
    result = {"suggestion": None, "invocation": None}

    # Load suggestion
    if files["suggestion"].exists():
        try:
            result["suggestion"] = json.loads(files["suggestion"].read_text(encoding="utf-8"))
            files["suggestion"].unlink()
        except:
            pass

    # Load invocation
    if files["invocation"].exists():
        try:
            result["invocation"] = json.loads(files["invocation"].read_text(encoding="utf-8"))
            files["invocation"].unlink()
        except:
            pass

    return result

def show_previous_routing_result():
    """Show result of previous suggestion (was skill invoked or not)."""
    tracking = load_and_clear_tracking()

    if not tracking["suggestion"]:
        return  # No previous suggestion

    suggested = tracking["suggestion"].get("suggested_skills", [])
    invoked = tracking["invocation"].get("skill_name") if tracking["invocation"] else None

    if not suggested:
        return

    print("---")
    if invoked and invoked in suggested:
        print(f"📍 Routing précédent: **{invoked}** ✅ (suggéré → invoqué)")
    elif invoked:
        print(f"📍 Routing précédent: **{invoked}** ↗️ (autre skill invoquée)")
        print(f"   Suggestion était: {', '.join(suggested[:2])}")
    else:
        print(f"📍 Routing précédent: ❌ (suggestion ignorée)")
        print(f"   Suggestion était: {', '.join(suggested[:2])}")
        print(f"   💡 Tip: Utilise Skill(\"{suggested[0]}\") pour invoquer")
    print("---")
    print()

def keyword_fallback(prompt: str, skills: list) -> list:
    """Fallback to word-boundary keyword matching."""
    # Normalize prompt: lowercase and extract words
    prompt_lower = prompt.lower()
    prompt_words = set(re.findall(r'\b\w+\b', prompt_lower))

    matches = []
    for skill in skills:
        best_score = 0
        for trigger in skill.get("triggers", []):
            trigger_lower = trigger.lower()
            trigger_words = set(re.findall(r'\b\w+\b', trigger_lower))

            # Skip very short triggers (< 3 chars) to avoid false positives
            if len(trigger_lower) < 3:
                continue

            # Word-level matching: count matching words
            if trigger_words:
                matching_words = prompt_words & trigger_words
                word_score = len(matching_words) / len(trigger_words)

                # Bonus for exact phrase match
                if trigger_lower in prompt_lower:
                    word_score = max(word_score, 0.9)

                best_score = max(best_score, word_score)

        if best_score >= 0.5:  # At least 50% of trigger words must match
            matches.append({
                "name": skill["name"],
                "description": skill.get("description", ""),
                "score": best_score
            })

    # Sort by score and limit
    matches.sort(key=lambda x: x["score"], reverse=True)
    return matches[:TOP_K]

def get_router(skills: list):
    """Get or create cached semantic router."""
    global _router_cache

    # Check if we have a cached router
    cache_key = "router"
    if cache_key in _router_cache:
        return _router_cache[cache_key]

    try:
        from semantic_router import Route
        from semantic_router.encoders import HuggingFaceEncoder
        from semantic_router.routers import SemanticRouter
    except ImportError:
        return None

    # Build routes from skills
    routes = []
    for skill in skills:
        if skill.get("triggers"):
            route = Route(
                name=skill["name"],
                utterances=skill["triggers"]
            )
            routes.append(route)

    if not routes:
        return None

    try:
        # Initialize encoder with explicit model and CPU device
        encoder = HuggingFaceEncoder(
            name=MODEL_NAME,
            device="cpu"  # Force CPU to avoid GPU issues
        )
        router = SemanticRouter(
            encoder=encoder,
            routes=routes,
            auto_sync="local"
        )

        # Cache for future calls in same process
        _router_cache[cache_key] = router
        return router

    except Exception as e:
        sys.stderr.write(f"Failed to create router: {e}\n")
        return None

def semantic_route(prompt: str, skills: list) -> list:
    """Route prompt using semantic similarity with threshold filtering and top-k results."""
    router = get_router(skills)

    if router is None:
        return keyword_fallback(prompt, skills)

    try:
        # Get multiple results using limit parameter
        results = router(prompt, limit=TOP_K)

        # Normalize to list (single result when limit=1)
        if not isinstance(results, list):
            results = [results] if results else []

        matches = []
        for result in results:
            if result and result.name:
                score = getattr(result, "similarity_score", None) or getattr(result, "score", 0.5)

                # Apply threshold filter
                if score >= SIMILARITY_THRESHOLD:
                    skill = next((s for s in skills if s["name"] == result.name), None)
                    if skill:
                        matches.append({
                            "name": result.name,
                            "description": skill.get("description", ""),
                            "score": score
                        })

        if matches:
            return matches

    except Exception as e:
        sys.stderr.write(f"Semantic router error: {e}\n")
        return keyword_fallback(prompt, skills)

    return keyword_fallback(prompt, skills)

def main():
    # Read input from stdin (JSON from Claude Code hook)
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    user_prompt = input_data.get("user_prompt", "")

    # Show previous routing result first
    show_previous_routing_result()

    # Skip if prompt is too short (avoid "ok", "y", "n")
    if len(user_prompt) < 3:
        print("[routing: prompt too short]")
        sys.exit(0)

    # Load triggers
    triggers_data = load_triggers()
    skills = triggers_data.get("skills", [])

    if not skills:
        sys.exit(0)

    # Route the prompt
    matches = semantic_route(user_prompt, skills)

    # Output suggestions and save for tracking
    if matches:
        save_suggestion(matches)

        print("---")
        print("SKILL SUGGESTION: Based on your request, consider using:")
        for match in matches[:TOP_K]:
            score_pct = f" ({match['score']:.0%})" if match.get('score') else ""
            skill_name = match['name']
            print(f"- **{skill_name}**: {match['description']}{score_pct}")

        # Show invoke command with actual skill name
        if len(matches) == 1:
            print(f"\nInvoke with: Skill(\"{matches[0]['name']}\")")
        else:
            print(f"\nInvoke the most relevant with: Skill(\"<skill-name>\")")
        print("---")
    else:
        # Option A+B: Show discrete indicator that routing ran but found no match
        print("[routing: no skill match]")

if __name__ == "__main__":
    main()
