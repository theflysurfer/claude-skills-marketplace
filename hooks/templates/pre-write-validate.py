#!/usr/bin/env python3
"""
Pre-Write Validation Hook Template

Validates file writes before they happen:
- Blocks writes to sensitive paths
- Protects critical directories
- Warns on dangerous patterns

Configuration:
    Edit BLOCKED_PATHS and PROTECTED_DIRS to customize.

Usage:
    Add to ~/.claude/settings.json:
    {
      "hooks": {
        "PreToolUse": [{
          "matcher": "Write|Edit",
          "hooks": [{
            "type": "command",
            "command": "python ~/.claude/hooks/pre-write-validate.py",
            "timeout": 5
          }]
        }]
      }
    }
"""

import json
import sys
import re
from pathlib import Path

# ========================================
# CONFIGURATION - Customize these
# ========================================

BLOCKED_PATHS = [
    ".env",
    ".env.local",
    ".env.production",
    "credentials.json",
    "secrets.json",
    "*.key",
    "*.pem",
    "id_rsa*",
    "*.secret",
]

PROTECTED_DIRS = [
    "node_modules",
    ".git",
    "__pycache__",
    "venv",
    ".venv",
]

WARN_PATTERNS = [
    r"password\s*=",
    r"api_key\s*=",
    r"secret\s*=",
    r"token\s*=",
]

# ========================================
# HOOK LOGIC
# ========================================

def matches_pattern(path: str, patterns: list) -> bool:
    """Check if path matches any glob pattern."""
    path_obj = Path(path)
    for pattern in patterns:
        if "*" in pattern:
            # Simple glob matching
            import fnmatch
            if fnmatch.fnmatch(path_obj.name, pattern):
                return True
        elif path_obj.name == pattern or pattern in str(path_obj):
            return True
    return False


def is_in_protected_dir(path: str, protected: list) -> bool:
    """Check if path is inside a protected directory."""
    path_str = str(Path(path))
    for dir_name in protected:
        if f"/{dir_name}/" in path_str or f"\\{dir_name}\\" in path_str:
            return True
        if path_str.endswith(f"/{dir_name}") or path_str.endswith(f"\\{dir_name}"):
            return True
    return False


def check_content_warnings(content: str) -> list:
    """Check content for potentially dangerous patterns."""
    warnings = []
    for pattern in WARN_PATTERNS:
        if re.search(pattern, content, re.IGNORECASE):
            warnings.append(f"Content may contain sensitive data (pattern: {pattern})")
    return warnings


def main():
    try:
        # Read hook input from stdin
        input_data = sys.stdin.read()
        if not input_data:
            sys.exit(0)

        data = json.loads(input_data)
        tool_name = data.get("tool_name", "")
        tool_input = data.get("tool_input", {})

        # Get file path from tool input
        file_path = tool_input.get("file_path", "") or tool_input.get("path", "")
        if not file_path:
            sys.exit(0)

        # Check blocked paths
        if matches_pattern(file_path, BLOCKED_PATHS):
            print(f"BLOCKED: Cannot write to sensitive file: {file_path}", file=sys.stderr)
            sys.exit(2)  # Exit code 2 = block the action

        # Check protected directories
        if is_in_protected_dir(file_path, PROTECTED_DIRS):
            print(f"BLOCKED: Cannot write to protected directory: {file_path}", file=sys.stderr)
            sys.exit(2)

        # Check content for warnings (non-blocking)
        content = tool_input.get("content", "") or tool_input.get("new_string", "")
        if content:
            warnings = check_content_warnings(content)
            for warning in warnings:
                print(f"WARNING: {warning}", file=sys.stderr)

        # All checks passed
        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as e:
        print(f"Hook error: {e}", file=sys.stderr)
        sys.exit(0)  # Non-blocking on error


if __name__ == "__main__":
    main()
