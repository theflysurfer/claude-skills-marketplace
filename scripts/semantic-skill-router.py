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
SCRIPT_DIR = Path(__file__).parent.parent  # Marketplace root
TRIGGERS_FILE = SCRIPT_DIR / "configs" / "skill-triggers.json"
CACHE_FILE = Path.home() / ".claude" / "semantic-router-cache.json"

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
    """Route prompt using semantic similarity with threshold filtering."""
    router = get_router(skills)

    if router is None:
        return keyword_fallback(prompt, skills)

    try:
        # Get multiple results if available
        # Note: semantic_router's __call__ returns single result
        # We use it and check the score
        result = router(prompt)

        if result and result.name:
            score = getattr(result, "similarity_score", None) or getattr(result, "score", 0.5)

            # Apply threshold filter
            if score < SIMILARITY_THRESHOLD:
                # Below threshold, try keyword fallback
                return keyword_fallback(prompt, skills)

            # Find the skill details
            skill = next((s for s in skills if s["name"] == result.name), None)
            if skill:
                return [{
                    "name": result.name,
                    "description": skill.get("description", ""),
                    "score": score
                }]

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

    # Skip if prompt is too short
    if len(user_prompt) < 10:
        sys.exit(0)

    # Load triggers
    triggers_data = load_triggers()
    skills = triggers_data.get("skills", [])

    if not skills:
        sys.exit(0)

    # Route the prompt
    matches = semantic_route(user_prompt, skills)

    # Output suggestions
    if matches:
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

if __name__ == "__main__":
    main()
