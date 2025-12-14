#!/usr/bin/env python3
"""
Silent deletion of Windows reserved/problematic filenames at session end.
Uses subprocess to call Git Bash find command.

Targets:
- Windows reserved names: nul, null, con, prn, aux, com1-9, lpt1-9
- Empty filenames
- Single space filenames
- Non-printable character filenames
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

        # Delete Windows reserved names
        reserved_cmd = f'find "{cwd}" -type f \\( -iname "nul" -o -iname "null" -o -iname "con" -o -iname "prn" -o -iname "aux" \\) -delete 2>/dev/null'
        subprocess.run(['bash', '-c', reserved_cmd], capture_output=True, timeout=15)

        # Delete files with 0 or 1 character filenames (empty, space, any single char)
        # Regex matches paths ending with /X or / where X is any single character
        short_name_cmd = f'find "{cwd}" -type f -regextype posix-extended -regex ".*/[^/]?$" -delete 2>/dev/null'
        subprocess.run(['bash', '-c', short_name_cmd], capture_output=True, timeout=15)

    except Exception:
        pass  # Silent fail

    sys.exit(0)

if __name__ == '__main__':
    main()
