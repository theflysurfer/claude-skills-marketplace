#!/usr/bin/env python3
"""
Silent deletion of Windows reserved/problematic filenames at session end.
Uses fd (5-10x faster than find) via Git Bash.

Targets:
- Windows reserved names: nul, null, con, prn, aux
- Short filenames (0-1 character)
"""
import sys
import json
import subprocess
import re

def main():
    try:
        # Read hook input from stdin
        input_data = json.load(sys.stdin)
        cwd = input_data.get('cwd', '')

        if not cwd:
            sys.exit(0)

        # Convert Windows path to Git Bash path
        # C:\path\to\dir -> /c/path/to/dir
        if ':' in cwd:
            cwd = cwd.replace('\\', '/')
            cwd = re.sub(r'^([A-Za-z]):', lambda m: '/' + m.group(1).lower(), cwd)

        # Delete Windows reserved names using fd (ultra-fast)
        # -H = include hidden, -I = no-ignore (include .gitignore'd files)
        reserved_cmd = f'fd -H -I -t f -i "^(nul|null|con|prn|aux)$" "{cwd}" --exec rm -f {{}} 2>/dev/null'
        subprocess.run(['bash', '-c', reserved_cmd], capture_output=True, timeout=15)

        # Delete files with 0-1 character filenames
        short_cmd = f'fd -H -I -t f "^.$" "{cwd}" --exec rm -f {{}} 2>/dev/null'
        subprocess.run(['bash', '-c', short_cmd], capture_output=True, timeout=15)

    except Exception:
        pass  # Silent fail

    sys.exit(0)

if __name__ == '__main__':
    main()
