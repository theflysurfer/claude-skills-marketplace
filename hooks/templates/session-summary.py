#!/usr/bin/env python3
"""
Session Summary Hook Template

Generates a summary at session end:
- Files created/modified during session
- Tools used and counts
- Duration estimate

Configuration:
    Edit SUMMARY_FILE and options to customize.

Usage:
    Add to ~/.claude/settings.json:
    {
      "hooks": {
        "SessionEnd": [{
          "hooks": [{
            "type": "command",
            "command": "python ~/.claude/hooks/session-summary.py",
            "timeout": 10
          }]
        }]
      }
    }
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from collections import Counter

# ========================================
# CONFIGURATION - Customize these
# ========================================

SUMMARY_FILE = Path.home() / ".claude" / "logs" / "session-summary.md"
AUDIT_LOG = Path.home() / ".claude" / "logs" / "audit.log"
SHOW_IN_TERMINAL = True  # Print summary to stderr

# ========================================
# HOOK LOGIC
# ========================================

def parse_audit_log() -> dict:
    """Parse audit log to get session stats."""
    stats = {
        "tools": Counter(),
        "files_modified": set(),
        "start_time": None,
        "end_time": None,
    }

    if not AUDIT_LOG.exists():
        return stats

    try:
        with open(AUDIT_LOG, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue

                # Parse timestamp
                if line.startswith("["):
                    try:
                        ts_end = line.index("]")
                        timestamp = line[1:ts_end]
                        dt = datetime.fromisoformat(timestamp)

                        if stats["start_time"] is None:
                            stats["start_time"] = dt
                        stats["end_time"] = dt

                        # Parse tool name
                        rest = line[ts_end + 2:]
                        if ":" in rest:
                            tool_name = rest.split(":")[0].strip()
                            stats["tools"][tool_name] += 1

                            # Extract file paths for Write/Edit
                            if tool_name in ["Write", "Edit"]:
                                if "file_path=" in rest:
                                    import re
                                    match = re.search(r"file_path='([^']+)'", rest)
                                    if match:
                                        stats["files_modified"].add(match.group(1))
                    except (ValueError, IndexError):
                        pass
    except Exception:
        pass

    return stats


def generate_summary(stats: dict) -> str:
    """Generate markdown summary."""
    lines = [
        "# Session Summary",
        "",
        f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
    ]

    # Duration
    if stats["start_time"] and stats["end_time"]:
        duration = stats["end_time"] - stats["start_time"]
        lines.append(f"**Duration**: {duration}")
        lines.append("")

    # Tools used
    if stats["tools"]:
        lines.append("## Tools Used")
        lines.append("")
        lines.append("| Tool | Count |")
        lines.append("|------|-------|")
        for tool, count in stats["tools"].most_common(10):
            lines.append(f"| {tool} | {count} |")
        lines.append("")

    # Files modified
    if stats["files_modified"]:
        lines.append("## Files Modified")
        lines.append("")
        for f in sorted(stats["files_modified"])[:20]:
            lines.append(f"- `{f}`")
        if len(stats["files_modified"]) > 20:
            lines.append(f"- *...and {len(stats['files_modified']) - 20} more*")
        lines.append("")

    return "\n".join(lines)


def main():
    try:
        # Generate stats from audit log
        stats = parse_audit_log()

        # Generate summary
        summary = generate_summary(stats)

        # Save to file
        SUMMARY_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
            f.write(summary)

        # Print to terminal if enabled
        if SHOW_IN_TERMINAL:
            print("\n" + "=" * 40, file=sys.stderr)
            print("SESSION SUMMARY", file=sys.stderr)
            print("=" * 40, file=sys.stderr)
            if stats["tools"]:
                print(f"Tools used: {sum(stats['tools'].values())}", file=sys.stderr)
                top_tools = ", ".join(f"{t}({c})" for t, c in stats["tools"].most_common(5))
                print(f"Top: {top_tools}", file=sys.stderr)
            if stats["files_modified"]:
                print(f"Files modified: {len(stats['files_modified'])}", file=sys.stderr)
            print(f"Summary saved: {SUMMARY_FILE}", file=sys.stderr)
            print("=" * 40 + "\n", file=sys.stderr)

        sys.exit(0)

    except Exception as e:
        print(f"Session summary error: {e}", file=sys.stderr)
        sys.exit(0)  # Non-blocking on error


if __name__ == "__main__":
    main()
