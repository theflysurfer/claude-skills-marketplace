"""
Hook Output - Dual-channel output system for hooks

Provides functions to output to terminal (stderr) and Claude context (stdout)
based on verbosity configuration.
"""

import sys

try:
    from .config_reader import get_verbosity, should_use_emoji
except ImportError:
    from config_reader import get_verbosity, should_use_emoji

try:
    from .debug_logger import log_debug
except ImportError:
    from debug_logger import log_debug


def to_terminal(message, min_level=2):
    """Output to terminal (stderr) based on verbosity level

    Args:
        message: Message to display
        min_level: Minimum verbosity level to display (default: 2)
    """
    verbosity = get_verbosity()

    # LOG: Trace every call
    log_debug("ANY", "hook_output", f"to_terminal(min_level={min_level}, verbosity={verbosity})", "TRACE")

    if verbosity >= min_level:
        log_debug("ANY", "hook_output", f"Writing to stderr: {message[:100]}...", "OUTPUT")
        sys.stderr.write(message + "\n")
        sys.stderr.flush()
    else:
        log_debug("ANY", "hook_output", f"Skipped (verbosity {verbosity} < {min_level})", "SKIP")


def to_context(message, prefix="CONTEXT"):
    """Output to Claude context (stdout)

    Args:
        message: Message to inject into Claude's context
        prefix: Prefix (CONTEXT, INSTRUCTION, etc.)
    """
    log_debug("ANY", "hook_output", f"to_context(prefix={prefix}, message_len={len(message)})", "TRACE")
    log_debug("ANY", "hook_output", f"Writing to stdout: {prefix}: {message[:100]}...", "OUTPUT")

    sys.stdout.write(f"{prefix}: {message}\n")
    sys.stdout.flush()


def to_both(message, min_level=2, prefix="CONTEXT"):
    """Output to both terminal and context

    Args:
        message: Message to output
        min_level: Minimum verbosity level for terminal
        prefix: Prefix for context injection
    """
    to_terminal(message, min_level)
    to_context(message, prefix)
