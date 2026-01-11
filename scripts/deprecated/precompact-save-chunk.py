#!/usr/bin/env python3
"""
Hook: PreCompact
Sauvegarde le transcript brut AVANT compaction pour éviter la perte d'information.
Le hook SessionEnd assemblera tous les chunks pour créer la mémoire complète.
"""
import json
import sys
import shutil
from pathlib import Path
from datetime import datetime

CHUNKS_DIR = Path.home() / ".claude" / "memory-chunks"


def save_transcript_chunk(transcript_path: Path, session_id: str, chunk_number: int):
    """Sauvegarde une copie du transcript avant compaction."""
    if not transcript_path.exists():
        return False

    try:
        # Créer le dossier de chunks
        CHUNKS_DIR.mkdir(parents=True, exist_ok=True)

        # Nom du chunk: session_id + numéro séquentiel
        chunk_filename = f"{session_id}_chunk_{chunk_number:03d}.jsonl"
        chunk_path = CHUNKS_DIR / chunk_filename

        # Copier le transcript
        shutil.copy2(transcript_path, chunk_path)

        # Sauvegarder un index pour cette session
        index_path = CHUNKS_DIR / f"{session_id}_index.json"
        index = []
        if index_path.exists():
            with open(index_path, 'r', encoding='utf-8') as f:
                index = json.load(f)

        index.append({
            "chunk_number": chunk_number,
            "filename": chunk_filename,
            "timestamp": datetime.now().isoformat(),
            "size": chunk_path.stat().st_size
        })

        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2)

        print(f"[precompact] Saved chunk {chunk_number} for session {session_id[:8]}", file=sys.stderr)
        return True

    except Exception as e:
        print(f"[precompact] Error saving chunk: {e}", file=sys.stderr)
        return False


def get_next_chunk_number(session_id: str) -> int:
    """Récupère le prochain numéro de chunk pour cette session."""
    index_path = CHUNKS_DIR / f"{session_id}_index.json"
    if not index_path.exists():
        return 1

    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            index = json.load(f)
            if index:
                return max(c["chunk_number"] for c in index) + 1
    except Exception:
        pass

    return 1


def main():
    try:
        # Lire l'input du hook
        input_data = json.load(sys.stdin)
        transcript_path_str = input_data.get('transcript_path', '')
        session_id = input_data.get('session_id', 'unknown')

        if not transcript_path_str or session_id == 'unknown':
            sys.exit(0)

        transcript_path = Path(transcript_path_str)

        # Déterminer le numéro de chunk
        chunk_number = get_next_chunk_number(session_id)

        # Sauvegarder le chunk
        save_transcript_chunk(transcript_path, session_id, chunk_number)

        sys.exit(0)
    except Exception as e:
        print(f"[precompact] Error: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == '__main__':
    main()
