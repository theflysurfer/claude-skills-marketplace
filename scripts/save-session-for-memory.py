#!/usr/bin/env python3
"""
Hook: SessionEnd
Assemble les chunks PreCompact + transcript final, extrait le contenu sémantique
et le sauvegarde pour Claude Mem.
"""
import json
import sys
import re
from pathlib import Path
from datetime import datetime

SUMMARIES_DIR = Path.home() / ".claude" / "compacted-summaries"
CHUNKS_DIR = Path.home() / ".claude" / "memory-chunks"


def assemble_full_transcript(session_id: str, final_transcript_path: Path) -> list:
    """Assemble tous les chunks PreCompact + transcript final en une liste complète."""
    all_entries = []

    # 1. Charger les chunks PreCompact s'ils existent
    index_path = CHUNKS_DIR / f"{session_id}_index.json"
    if index_path.exists():
        try:
            with open(index_path, 'r', encoding='utf-8') as f:
                index = json.load(f)

            for chunk_info in sorted(index, key=lambda x: x['chunk_number']):
                chunk_path = CHUNKS_DIR / chunk_info['filename']
                if chunk_path.exists():
                    with open(chunk_path, 'r', encoding='utf-8') as f:
                        for line in f:
                            try:
                                entry = json.loads(line.strip())
                                all_entries.append(entry)
                            except json.JSONDecodeError:
                                pass
        except Exception as e:
            print(f"[memory] Error loading chunks: {e}", file=sys.stderr)

    # 2. Ajouter le transcript final (peut contenir des entrées après la dernière compaction)
    if final_transcript_path.exists():
        try:
            with open(final_transcript_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                        all_entries.append(entry)
                    except json.JSONDecodeError:
                        pass
        except Exception as e:
            print(f"[memory] Error loading final transcript: {e}", file=sys.stderr)

    return all_entries


def extract_semantic_content(entries: list, cwd: str) -> str:
    """Extrait le contenu sémantique d'une liste d'entrées de transcript."""
    if not entries:
        return None

    user_messages = []
    files_mentioned = set()

    for entry in entries:
        # Extraire messages utilisateur
        if entry.get('role') == 'user':
            content = entry.get('content', '')
            if isinstance(content, str) and len(content) > 20:
                user_messages.append(content[:500])
            elif isinstance(content, list):
                for item in content:
                    if isinstance(item, dict) and item.get('type') == 'text':
                        text = item.get('text', '')
                        if len(text) > 20:
                            user_messages.append(text[:500])
        # Extraire fichiers mentionnés
        elif entry.get('role') == 'assistant':
            content = entry.get('content', '')
            if isinstance(content, str):
                # Chercher des patterns de fichiers
                files = re.findall(r'[\w/\\.-]+\.(py|js|ts|vue|md|json|yaml|tsx|jsx|css|html)', content)
                files_mentioned.update(files[:20])

    if not user_messages:
        return None

    # Generer le resume markdown
    project_name = Path(cwd).name if cwd else "Unknown"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    summary_lines = [
        f"# Session: {project_name}",
        f"**Date**: {timestamp}",
        f"**Project**: {project_name}",
        "",
        "## User Requests",
    ]

    for msg in user_messages[:10]:
        clean_msg = msg.replace('\n', ' ').strip()
        if len(clean_msg) > 200:
            clean_msg = clean_msg[:200] + "..."
        summary_lines.append(f"- {clean_msg}")

    summary_lines.append("")
    summary_lines.append("## Files Mentioned")

    if files_mentioned:
        for f in list(files_mentioned)[:15]:
            summary_lines.append(f"- {f}")
    else:
        summary_lines.append("- None detected")

    return "\n".join(summary_lines)


def cleanup_chunks(session_id: str):
    """Supprime les chunks temporaires après assemblage."""
    try:
        index_path = CHUNKS_DIR / f"{session_id}_index.json"
        if index_path.exists():
            with open(index_path, 'r', encoding='utf-8') as f:
                index = json.load(f)

            # Supprimer tous les fichiers de chunk
            for chunk_info in index:
                chunk_path = CHUNKS_DIR / chunk_info['filename']
                if chunk_path.exists():
                    chunk_path.unlink()

            # Supprimer l'index
            index_path.unlink()
            print(f"[memory] Cleaned up {len(index)} chunks", file=sys.stderr)

    except Exception as e:
        print(f"[memory] Error cleaning chunks: {e}", file=sys.stderr)


def main():
    try:
        input_data = json.load(sys.stdin)
        transcript_path_str = input_data.get('transcript_path', '')
        session_id = input_data.get('session_id', 'unknown')
        cwd = input_data.get('cwd', '')

        if not transcript_path_str:
            sys.exit(0)

        transcript_path = Path(transcript_path_str)

        # Assembler tous les chunks + transcript final
        all_entries = assemble_full_transcript(session_id, transcript_path)

        if not all_entries:
            sys.exit(0)

        # Extraire le contenu sémantique
        summary = extract_semantic_content(all_entries, cwd)
        if not summary:
            sys.exit(0)

        # Sauvegarder
        SUMMARIES_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"session-{timestamp}-{session_id[:8]}.md"
        filepath = SUMMARIES_DIR / filename

        filepath.write_text(summary, encoding='utf-8')
        print(f"[memory] Saved: {filename} ({len(all_entries)} entries)", file=sys.stderr)

        # Nettoyer les chunks temporaires
        cleanup_chunks(session_id)

        sys.exit(0)
    except Exception as e:
        print(f"[memory] Error: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == '__main__':
    main()
