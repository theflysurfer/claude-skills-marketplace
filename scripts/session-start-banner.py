#!/usr/bin/env python3
"""
Session Start Banner - Shows project folder prominently and sets terminal title.
Hook: SessionStart
"""

import os
import sys
from pathlib import Path

def get_project_name():
    """Get current project directory name."""
    if "CLAUDE_PROJECT_DIR" in os.environ:
        return Path(os.environ["CLAUDE_PROJECT_DIR"]).name
    return Path.cwd().name

def set_terminal_title(title: str):
    """Set terminal/tab title (works on Windows Terminal, iTerm2, etc.)."""
    # ANSI escape sequence for setting window title
    sys.stdout.write(f"\033]0;📁 {title}\007")
    sys.stdout.flush()

def print_banner(project_name: str):
    """Print a visible banner with project name."""
    width = max(len(project_name) + 4, 40)
    line = "═" * width

    print(f"\n{line}")
    print(f"📁 {project_name}")
    print(f"{line}\n")

def main():
    project_name = get_project_name()

    # Set terminal title (sticky - survives /compact)
    set_terminal_title(project_name)

    # Print banner (visible at session start)
    print_banner(project_name)

if __name__ == "__main__":
    main()
