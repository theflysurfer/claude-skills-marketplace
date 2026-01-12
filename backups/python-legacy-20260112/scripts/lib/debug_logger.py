"""
Debug Logger - Centralized logging for hooks debugging

Logs hook execution to ~/.claude/logs/hooks-debug.log for diagnostics.
"""

from pathlib import Path
from datetime import datetime
import os

LOG_FILE = Path.home() / ".claude" / "logs" / "hooks-debug.log"

def log_debug(hook_name, script_name, message, level="INFO"):
    """Log debug info to centralized file

    Args:
        hook_name: Hook type (SessionStart, UserPromptSubmit, etc.)
        script_name: Script name (session-start-banner.py, etc.)
        message: Log message
        level: Log level (INFO, ERROR, TRACE, etc.)
    """
    try:
        LOG_FILE.parent.mkdir(exist_ok=True)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] [{hook_name}] [{script_name}] [{level}] {message}\n")
            f.flush()
    except Exception:
        # Silently fail - logging should never break hooks
        pass

def log_hook_start(hook_name, script_name):
    """Log hook execution start with environment vars

    Args:
        hook_name: Hook type
        script_name: Script name
    """
    log_debug(hook_name, script_name, "START", "INFO")

    # Log environment variables
    verbosity = os.getenv("CLAUDE_VERBOSITY", "not set")
    emoji = os.getenv("CLAUDE_HOOK_EMOJI", "not set")
    log_debug(hook_name, script_name, f"CLAUDE_VERBOSITY={verbosity}", "ENV")
    log_debug(hook_name, script_name, f"CLAUDE_HOOK_EMOJI={emoji}", "ENV")

def log_hook_end(hook_name, script_name, success=True):
    """Log hook execution end

    Args:
        hook_name: Hook type
        script_name: Script name
        success: Whether hook succeeded
    """
    status = "SUCCESS" if success else "FAILED"
    log_debug(hook_name, script_name, f"END ({status})", "INFO")
