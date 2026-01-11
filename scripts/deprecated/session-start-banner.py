#!/usr/bin/env python3
"""
Session Start Banner - Shows project folder prominently and sets terminal title.
Hook: SessionStart
"""

import json
import os
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

# Force UTF-8 encoding on Windows to avoid UnicodeEncodeError
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def get_project_name():
    """Get current project directory name."""
    if "CLAUDE_PROJECT_DIR" in os.environ:
        return Path(os.environ["CLAUDE_PROJECT_DIR"]).name
    return Path.cwd().name

def get_skill_count():
    """Get count of indexed skills from hybrid registry."""
    try:
        registry_path = Path.home() / ".claude" / "configs" / "hybrid-registry.json"
        if registry_path.exists():
            with open(registry_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return len(data.get("skills", {}))
    except Exception:
        pass
    return None

def main():
    log_hook_start("SessionStart", "session-start-banner.py")

    try:
        project_name = get_project_name()
        skill_count = get_skill_count()

        log_debug("SessionStart", "session-start-banner.py", f"Project: {project_name}", "INFO")
        log_debug("SessionStart", "session-start-banner.py", f"Skill count: {skill_count}", "INFO")

        # Set terminal title (sticky - survives /compact)
        try:
            sys.stdout.write(f"\033]0;{project_name}\007")
            sys.stdout.flush()
            log_debug("SessionStart", "session-start-banner.py", "Terminal title set", "INFO")
        except:
            pass

        # Print banner (ASCII only for maximum compatibility)
        line = "=" * max(len(project_name) + 4, 40)
        banner_lines = [
            "",
            line,
            f"[>] {project_name}",
            line
        ]

        if skill_count and skill_count > 0:
            banner_lines.append(f"\n[i] {skill_count} skills | /help pour decouvrir")

        log_debug("SessionStart", "session-start-banner.py", f"Banner has {len(banner_lines)} lines", "INFO")
        log_debug("SessionStart", "session-start-banner.py", "Writing banner to stdout", "OUTPUT")

        for line_content in banner_lines:
            print(line_content)

        # Auto-load relevant memories
        load_relevant_memories(project_name)

        print()

        log_hook_end("SessionStart", "session-start-banner.py", success=True)

    except Exception as e:
        log_debug("SessionStart", "session-start-banner.py", f"ERROR: {e}", "ERROR")
        log_hook_end("SessionStart", "session-start-banner.py", success=False)
        # Silent fail - don't break Claude startup
        pass


def load_relevant_memories(project_name: str):
    """Load relevant memories from Claude Mem based on project name."""
    import subprocess

    claude_mem_dir = Path.home() / "OneDrive" / "Coding" / "_Projets de code" / "2025.12 Claude Mem"
    search_script = claude_mem_dir / "search.py"
    python_exe = claude_mem_dir / "venv" / "Scripts" / "python.exe"

    # Check if Claude Mem is installed
    if not search_script.exists() or not python_exe.exists():
        return

    try:
        # Search for memories related to this project
        result = subprocess.run(
            [str(python_exe), str(search_script), project_name],
            capture_output=True,
            text=True,
            timeout=3
        )

        if result.returncode == 0 and result.stdout.strip():
            # Parse output to count memories
            lines = result.stdout.strip().split('\n')
            memory_count = len([l for l in lines if l.strip() and not l.startswith('=')])

            if memory_count > 0:
                print(f"\n📚 {memory_count} session(s) similaire(s) trouvée(s)")
                print("   Use /system:semantic-memory-search for details")
    except (subprocess.TimeoutExpired, Exception):
        # Silent fail - memory loading is optional
        pass

if __name__ == "__main__":
    main()
