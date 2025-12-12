#!/usr/bin/env python3
"""
Track Skill Invocations - Records when a skill is invoked.
Hook: PostToolUse (tool_name == "Skill")

Works with semantic-skill-router.py to provide routing feedback.
"""

import json
import sys
from pathlib import Path

TRACKING_DIR = Path.home() / ".claude" / "routing-tracking"

def main():
    # Read input from stdin (JSON from Claude Code hook)
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")

    # Only track Skill invocations
    if tool_name != "Skill":
        sys.exit(0)

    # Extract skill name from tool input
    tool_input = input_data.get("tool_input", {})
    skill_name = tool_input.get("skill", "")

    if not skill_name:
        sys.exit(0)

    # Save invocation
    TRACKING_DIR.mkdir(parents=True, exist_ok=True)
    invocation_file = TRACKING_DIR / "last-invocation.json"

    data = {
        "skill_name": skill_name,
        "timestamp": __import__("time").time()
    }

    invocation_file.write_text(json.dumps(data), encoding="utf-8")

if __name__ == "__main__":
    main()
