#!/usr/bin/env python3
"""
Session Stats Dashboard - Shows session statistics at session end
Hook: SessionEnd

Displays:
- Session duration
- Skills invoked
- Tools used
- Files modified
- Summary of work done
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from collections import Counter

def parse_transcript(transcript_path: Path) -> dict:
    """Parse session transcript and extract statistics."""
    stats = {
        "start_time": None,
        "end_time": None,
        "skills_used": Counter(),
        "tools_used": Counter(),
        "files_modified": set(),
        "user_prompts": 0,
        "assistant_responses": 0,
    }

    if not transcript_path.exists():
        return stats

    try:
        with open(transcript_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())

                    # Track timestamps
                    if 'timestamp' in entry:
                        ts = datetime.fromisoformat(entry['timestamp'].replace('Z', '+00:00'))
                        if stats["start_time"] is None:
                            stats["start_time"] = ts
                        stats["end_time"] = ts

                    # Count user prompts
                    if entry.get('role') == 'user':
                        stats["user_prompts"] += 1

                    # Count assistant responses
                    elif entry.get('role') == 'assistant':
                        stats["assistant_responses"] += 1

                        # Extract tool uses from content
                        content = entry.get('content', [])
                        if isinstance(content, list):
                            for item in content:
                                if isinstance(item, dict):
                                    # Skill invocations
                                    if item.get('type') == 'tool_use' and item.get('name') == 'Skill':
                                        skill = item.get('input', {}).get('skill', 'unknown')
                                        stats["skills_used"][skill] += 1

                                    # Other tools
                                    elif item.get('type') == 'tool_use':
                                        tool = item.get('name', 'unknown')
                                        stats["tools_used"][tool] += 1

                                        # Extract file paths
                                        tool_input = item.get('input', {})
                                        if 'file_path' in tool_input:
                                            stats["files_modified"].add(tool_input['file_path'])

                except json.JSONDecodeError:
                    continue
    except Exception:
        pass

    return stats


def format_duration(start: datetime, end: datetime) -> str:
    """Format duration as human-readable string."""
    if not start or not end:
        return "unknown"

    delta = end - start
    hours = int(delta.total_seconds() // 3600)
    minutes = int((delta.total_seconds() % 3600) // 60)
    seconds = int(delta.total_seconds() % 60)

    if hours > 0:
        return f"{hours}h {minutes}m {seconds}s"
    elif minutes > 0:
        return f"{minutes}m {seconds}s"
    else:
        return f"{seconds}s"


def display_dashboard(stats: dict):
    """Display session statistics dashboard."""
    print("\n" + "=" * 60)
    print("📊 SESSION STATISTICS")
    print("=" * 60)

    # Duration
    if stats["start_time"] and stats["end_time"]:
        duration = format_duration(stats["start_time"], stats["end_time"])
        print(f"\n⏱️  Duration: {duration}")

    # Interaction count
    print(f"💬 Exchanges: {stats['user_prompts']} prompts, {stats['assistant_responses']} responses")

    # Skills used
    if stats["skills_used"]:
        print(f"\n🔧 Skills used ({len(stats['skills_used'])}):")
        for skill, count in stats["skills_used"].most_common(5):
            print(f"   • {skill} ({count}x)")
        if len(stats["skills_used"]) > 5:
            print(f"   ... and {len(stats['skills_used']) - 5} more")

    # Top tools
    if stats["tools_used"]:
        print(f"\n🛠️  Top tools:")
        for tool, count in stats["tools_used"].most_common(5):
            print(f"   • {tool} ({count}x)")

    # Files modified
    if stats["files_modified"]:
        file_count = len(stats["files_modified"])
        print(f"\n📝 Files modified: {file_count}")
        if file_count <= 5:
            for f in sorted(stats["files_modified"]):
                print(f"   • {f}")
        else:
            for f in sorted(stats["files_modified"])[:3]:
                print(f"   • {f}")
            print(f"   ... and {file_count - 3} more")

    print("\n" + "=" * 60)
    print("Session saved to memory. Use /system:semantic-memory-search to recall.")
    print("=" * 60 + "\n")


def main():
    try:
        # Read hook input
        input_data = json.load(sys.stdin)
        transcript_path = Path(input_data.get('transcript_path', ''))

        if not transcript_path.exists():
            sys.exit(0)

        # Parse and display stats
        stats = parse_transcript(transcript_path)
        display_dashboard(stats)

        sys.exit(0)
    except Exception as e:
        # Silent fail - don't break session end
        print(f"[stats] Error: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == '__main__':
    main()
