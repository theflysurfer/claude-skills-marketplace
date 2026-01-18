#!/usr/bin/env python3
"""
PreToolUse hook: Block commands that would kill Claude Code instances.

Exit codes:
  0 = Allow the command
  2 = Block the command
"""
import sys
import json
import re

# Patterns that could kill Claude Code instances
BLOCKED_PATTERNS = [
    # Windows taskkill
    r'taskkill.*(/im|/pid).*claude',
    r'taskkill.*(/im|/pid).*node',
    r'taskkill.*(/im|/pid).*python.*claude',
    r'taskkill.*/f.*/im.*claude',

    # PowerShell Stop-Process
    r'Stop-Process.*claude',
    r'Stop-Process.*-Name.*node',
    r'kill.*-Name.*claude',

    # Unix/Linux kill commands
    r'pkill.*claude',
    r'pkill.*-f.*claude',
    r'pkill.*node.*claude',
    r'killall.*claude',
    r'killall.*node',

    # Generic kill with specific patterns
    r'kill\s+-9\s+.*claude',
    r'kill\s+-SIGKILL.*claude',

    # Port-based killing (Claude Code uses various ports)
    r'kill.*lsof.*-i.*:',
    r'fuser.*-k.*/',
]

# Additional dangerous patterns
DANGEROUS_PATTERNS = [
    r'rm\s+-rf\s+/\s*$',  # rm -rf /
    r'rm\s+-rf\s+~\s*$',  # rm -rf ~
    r':()\s*{\s*:\s*\|\s*:\s*&\s*}\s*;',  # Fork bomb
]


def main():
    """Check if the Bash command should be blocked."""
    try:
        input_data = json.loads(sys.stdin.read())
    except json.JSONDecodeError:
        # Can't parse input, allow by default
        sys.exit(0)

    tool_input = input_data.get('tool_input', {})
    command = tool_input.get('command', '')

    if not command:
        sys.exit(0)

    # Check for Claude-killing patterns
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            result = {
                "decision": "block",
                "reason": f"Blocked: This command could terminate Claude Code instances."
            }
            print(json.dumps(result))
            sys.exit(2)

    # Check for other dangerous patterns
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            result = {
                "decision": "block",
                "reason": f"Blocked: Dangerous system command detected."
            }
            print(json.dumps(result))
            sys.exit(2)

    # Allow the command
    sys.exit(0)


if __name__ == '__main__':
    main()
