#!/usr/bin/env python3
"""
Track Skill Invocations - Records when a skill is invoked.
Hook: PostToolUse (tool_name == "Skill")

Works with semantic-skill-router.py to provide routing feedback.
"""

import json
import sys
from pathlib import Path

# Add lib directory to path for imports
lib_dir = Path(__file__).parent / "lib"
if str(lib_dir) not in sys.path:
    sys.path.insert(0, str(lib_dir))

try:
    from debug_logger import log_hook_start, log_hook_end, log_debug
except ImportError:
    # Fallback no-op functions if logger not available
    def log_hook_start(hook, script): pass
    def log_hook_end(hook, script, success=True): pass
    def log_debug(hook, script, msg, level="INFO"): pass

TRACKING_DIR = Path.home() / ".claude" / "routing-tracking"

def main():
    log_hook_start("PostToolUse", "track-skill-invocation.py")

    try:
        # Read input from stdin (JSON from Claude Code hook)
        try:
            input_data = json.load(sys.stdin)
            log_debug("PostToolUse", "track-skill-invocation.py", "Input parsed successfully", "INFO")
        except json.JSONDecodeError:
            log_debug("PostToolUse", "track-skill-invocation.py", "JSON decode error", "ERROR")
            log_hook_end("PostToolUse", "track-skill-invocation.py", False)
            sys.exit(0)

        tool_name = input_data.get("tool_name", "")

        # Only track Skill invocations
        if tool_name != "Skill":
            log_debug("PostToolUse", "track-skill-invocation.py", f"Not a Skill invocation: {tool_name}", "SKIP")
            log_hook_end("PostToolUse", "track-skill-invocation.py", True)
            sys.exit(0)

        # Extract skill name from tool input
        tool_input = input_data.get("tool_input", {})
        skill_name = tool_input.get("skill", "")

        if not skill_name:
            log_debug("PostToolUse", "track-skill-invocation.py", "No skill name found", "SKIP")
            log_hook_end("PostToolUse", "track-skill-invocation.py", True)
            sys.exit(0)

        log_debug("PostToolUse", "track-skill-invocation.py", f"Tracking skill: {skill_name}", "INFO")

        # Save invocation
        TRACKING_DIR.mkdir(parents=True, exist_ok=True)
        invocation_file = TRACKING_DIR / "last-invocation.json"

        data = {
            "skill_name": skill_name,
            "timestamp": __import__("time").time()
        }

        invocation_file.write_text(json.dumps(data), encoding="utf-8")

        log_debug("PostToolUse", "track-skill-invocation.py", f"Invocation saved", "INFO")
        log_hook_end("PostToolUse", "track-skill-invocation.py", True)

    except Exception as e:
        log_debug("PostToolUse", "track-skill-invocation.py", f"ERROR: {e}", "ERROR")
        log_hook_end("PostToolUse", "track-skill-invocation.py", False)

if __name__ == "__main__":
    main()
