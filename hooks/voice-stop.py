#!/usr/bin/env python3
"""
Hook Stop - Annonce vocale du projet termine avec Edge TTS (voix neurale)
Triggered when Claude stops responding
"""

import sys
import json
import asyncio
import tempfile
import subprocess
import re
from pathlib import Path

# Fix Windows asyncio issues
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


async def speak(text: str, voice: str = "fr-FR-DeniseNeural"):
    """Generate and play TTS audio using Edge TTS"""
    import edge_tts

    # Generate audio to temp file
    temp_file = Path(tempfile.gettempdir()) / "claude_voice_stop.mp3"

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(temp_file))

    # Play with ffplay (simple and reliable)
    subprocess.run(
        ["ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet", str(temp_file)],
        capture_output=True
    )


def get_project_name():
    """Read JSON from stdin and extract project name"""
    try:
        input_data = sys.stdin.read()
        # Remove BOM if present
        if input_data.startswith('\ufeff'):
            input_data = input_data[1:]
        data = json.loads(input_data)
        cwd = data.get("cwd", "")
        name = Path(cwd).name if cwd else "inconnu"
        # Remove date prefix like "2025.11 " or "2024.09 "
        name = re.sub(r'^\d{4}\.\d{2}\s+', '', name)
        return name
    except Exception:
        return "inconnu"


def main():
    # Read stdin BEFORE starting asyncio
    project = get_project_name()
    message = f"Le projet {project} a terminé"

    try:
        asyncio.run(speak(message))
    except Exception as e:
        # Silent fail - don't block Claude
        print(f"Voice hook error: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
