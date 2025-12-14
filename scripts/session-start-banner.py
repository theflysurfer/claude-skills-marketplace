#!/usr/bin/env python3
"""
Session Start Banner - Shows project folder prominently and sets terminal title.
Hook: SessionStart
"""

import os
import sys
from pathlib import Path

# Force UTF-8 encoding on Windows to avoid UnicodeEncodeError
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def get_project_name():
    """Get current project directory name."""
    if "CLAUDE_PROJECT_DIR" in os.environ:
        return Path(os.environ["CLAUDE_PROJECT_DIR"]).name
    return Path.cwd().name

def main():
    try:
        project_name = get_project_name()

        # Set terminal title (sticky - survives /compact)
        try:
            sys.stdout.write(f"\033]0;{project_name}\007")
            sys.stdout.flush()
        except:
            pass

        # Print banner (ASCII only for maximum compatibility)
        line = "=" * max(len(project_name) + 4, 40)
        print(f"\n{line}")
        print(f"[>] {project_name}")
        print(f"{line}\n")

    except Exception:
        # Silent fail - don't break Claude startup
        pass

if __name__ == "__main__":
    main()
