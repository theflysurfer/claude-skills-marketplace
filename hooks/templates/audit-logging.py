#!/usr/bin/env python3
"""
Audit Logging Hook Template

Logs all tool invocations for audit purposes:
- Records tool name, inputs, and timestamp
- Saves to a rotating log file
- Useful for debugging and compliance

Configuration:
    Edit LOG_FILE and LOG_LEVEL to customize.

Usage:
    Add to ~/.claude/settings.json:
    {
      "hooks": {
        "PostToolUse": [{
          "matcher": "*",
          "hooks": [{
            "type": "command",
            "command": "python ~/.claude/hooks/audit-logging.py",
            "timeout": 5
          }]
        }]
      }
    }
"""

import json
import sys
from datetime import datetime
from pathlib import Path

# ========================================
# CONFIGURATION - Customize these
# ========================================

LOG_FILE = Path.home() / ".claude" / "logs" / "audit.log"
LOG_LEVEL = "INFO"  # DEBUG, INFO, WARNING
MAX_LOG_SIZE_MB = 10
MAX_CONTENT_LENGTH = 500  # Truncate long content

# Tools to skip logging
SKIP_TOOLS = [
    "Read",  # Too verbose
]

# ========================================
# HOOK LOGIC
# ========================================

def ensure_log_dir():
    """Create log directory if needed."""
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)


def rotate_log_if_needed():
    """Rotate log file if too large."""
    if LOG_FILE.exists():
        size_mb = LOG_FILE.stat().st_size / (1024 * 1024)
        if size_mb > MAX_LOG_SIZE_MB:
            backup = LOG_FILE.with_suffix(".log.old")
            if backup.exists():
                backup.unlink()
            LOG_FILE.rename(backup)


def truncate_content(content: str, max_len: int = MAX_CONTENT_LENGTH) -> str:
    """Truncate content for logging."""
    if len(content) > max_len:
        return content[:max_len] + f"... ({len(content)} chars total)"
    return content


def format_log_entry(data: dict) -> str:
    """Format a log entry."""
    timestamp = datetime.now().isoformat()
    tool_name = data.get("tool_name", "unknown")
    tool_input = data.get("tool_input", {})

    # Summarize tool input
    summary_parts = []
    for key, value in tool_input.items():
        if isinstance(value, str):
            value = truncate_content(value)
        summary_parts.append(f"{key}={value!r}")

    summary = ", ".join(summary_parts[:5])  # Max 5 params
    if len(summary_parts) > 5:
        summary += f" (+{len(summary_parts) - 5} more)"

    return f"[{timestamp}] {tool_name}: {summary}"


def main():
    try:
        # Read hook input from stdin
        input_data = sys.stdin.read()
        if not input_data:
            sys.exit(0)

        data = json.loads(input_data)
        tool_name = data.get("tool_name", "")

        # Skip certain tools
        if tool_name in SKIP_TOOLS:
            sys.exit(0)

        # Prepare log
        ensure_log_dir()
        rotate_log_if_needed()

        # Write log entry
        log_entry = format_log_entry(data)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(log_entry + "\n")

        if LOG_LEVEL == "DEBUG":
            print(f"[audit] {log_entry}", file=sys.stderr)

        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as e:
        if LOG_LEVEL == "DEBUG":
            print(f"Audit hook error: {e}", file=sys.stderr)
        sys.exit(0)  # Non-blocking on error


if __name__ == "__main__":
    main()
