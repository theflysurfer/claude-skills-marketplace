"""Set Windows Terminal tab title to current folder name."""
import os
import sys

def set_title():
    folder = os.path.basename(os.getcwd())
    # ANSI escape sequence for setting terminal title
    # Works with Windows Terminal, ConEmu, etc.
    sys.stdout.write(f"\033]0;{folder}\007")
    sys.stdout.flush()

if __name__ == "__main__":
    set_title()
