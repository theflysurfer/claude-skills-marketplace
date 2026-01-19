#!/usr/bin/env python3
"""
Hook Stop - Annonce vocale + toast Windows quand Claude termine
Triggered when Claude stops responding
"""

import sys
import json
import asyncio
import tempfile
import subprocess
import re
from pathlib import Path
from threading import Thread

# Fix Windows asyncio issues
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


def show_toast(project: str):
    """Show Windows toast notification"""
    try:
        from winotify import Notification, audio

        toast = Notification(
            app_id="Claude Code",
            title="Tâche terminée",
            msg=f"Le projet {project} a terminé",
            duration="short"
        )
        toast.set_audio(audio.Default, loop=False)
        toast.show()
    except Exception:
        # Fallback: try PowerShell toast if winotify fails
        try:
            ps_script = f'''
            [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
            $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
            $textNodes = $template.GetElementsByTagName("text")
            $textNodes.Item(0).AppendChild($template.CreateTextNode("Claude Code")) | Out-Null
            $textNodes.Item(1).AppendChild($template.CreateTextNode("Le projet {project} a terminé")) | Out-Null
            $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
            [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Code").Show($toast)
            '''
            subprocess.run(["powershell", "-Command", ps_script], capture_output=True)
        except Exception:
            pass  # Silent fail


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

    # Show toast in parallel (non-blocking)
    toast_thread = Thread(target=show_toast, args=(project,), daemon=True)
    toast_thread.start()

    # Play voice announcement
    try:
        asyncio.run(speak(message))
    except Exception as e:
        # Silent fail - don't block Claude
        print(f"Voice hook error: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
