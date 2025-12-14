#!/usr/bin/env python3
"""
Subtitle Translation Script - OpenRouter + Llama 3.3 70B
Production-tested on 635+ episodes

Usage:
    python translate_srt.py [--source EN] [--target FR] [--path /path/to/srt/files]
"""

import requests
import re
import json
import time
import sys
import argparse
from pathlib import Path
from datetime import datetime

# === CONFIGURATION ===
OPENROUTER_API_KEY = "YOUR_API_KEY_HERE"  # Replace with your key
MODEL = "meta-llama/llama-3.3-70b-instruct"  # $0.11/M input, $0.34/M output
API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Optimal parameters (production-tested)
BATCH_SIZE = 25
REQUEST_TIMEOUT = 90
MAX_RETRIES = 3
DELAY_BETWEEN_REQUESTS = 0.5

# File paths
PROGRESS_FILE = Path("translation_progress.json")
LOG_FILE = Path("translation.log")
FAILED_BATCHES_FILE = Path("failed_batches.json")

# Stats
stats = {"completed": 0, "failed": 0, "total_cost": 0.0}


def log(msg):
    """Log with timestamp to console and file"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    line = f"{timestamp} {msg}"
    print(line)
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(line + '\n')


def get_credits():
    """Get remaining OpenRouter credits"""
    try:
        r = requests.get(
            "https://openrouter.ai/api/v1/credits",
            headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
            timeout=10
        )
        if r.status_code == 200:
            data = r.json().get("data", {})
            return data.get("total_credits", 0) - data.get("total_usage", 0)
    except:
        pass
    return None


# === PROGRESS MANAGEMENT ===

def load_progress():
    try:
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"completed": [], "failed": [], "total_cost": 0.0}


def save_progress(state):
    state["last_update"] = datetime.now().isoformat()
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def load_failed_batches():
    try:
        with open(FAILED_BATCHES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"batches": [], "stats": {"retried": 0, "fixed": 0}}


def save_failed_batches(data):
    with open(FAILED_BATCHES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def add_failed_batch(file_path, batch_index, blocks_data):
    """Queue a failed batch for retry"""
    failed_data = load_failed_batches()
    failed_data["batches"].append({
        "file": str(file_path),
        "batch_index": batch_index,
        "blocks": blocks_data,
        "retry_count": 0,
        "timestamp": datetime.now().isoformat()
    })
    save_failed_batches(failed_data)


# === SRT PARSING ===

def parse_srt(content):
    """Parse SRT content into list of (index, timing, text) tuples"""
    blocks = []
    current = []

    for line in content.strip().split('\n'):
        if line.strip() == '':
            if current:
                idx = current[0]
                timing = current[1]
                text = '\n'.join(current[2:])
                blocks.append((idx, timing, text))
                current = []
        else:
            current.append(line)

    if current:
        idx = current[0]
        timing = current[1]
        text = '\n'.join(current[2:])
        blocks.append((idx, timing, text))

    return blocks


# === HTML TAG HANDLING ===

def extract_formatting(text):
    """Extract HTML tags with positions for restoration"""
    tags = []
    for match in re.finditer(r'<[^>]+>', text):
        tags.append({
            'start': match.start(),
            'end': match.end(),
            'tag': match.group(),
            'is_open': not match.group().startswith('</')
        })
    return tags


def strip_html_tags(text):
    """Remove HTML tags for clean translation"""
    return re.sub(r'<[^>]+>', '', text)


def apply_formatting(translated, original_tags):
    """Reapply original HTML structure to translation"""
    if not original_tags:
        return translated

    # Simple approach: preserve wrapping tags
    has_open_italic = any(t['tag'] == '<i>' for t in original_tags)
    has_close_italic = any(t['tag'] == '</i>' for t in original_tags)

    result = translated
    if has_open_italic and not result.startswith('<i>'):
        result = '<i>' + result
    if has_close_italic and not result.endswith('</i>'):
        result = result + '</i>'

    return result


# === TRANSLATION ===

def translate_batch(texts, source_lang, target_lang):
    """Translate a batch of texts using OpenRouter API"""
    prompt = f"""Translate these {source_lang} subtitles to {target_lang}.
Return ONLY a valid JSON array of translated strings in the same order.
Keep translations natural and conversational. Preserve line breaks within each subtitle.

{json.dumps(texts, ensure_ascii=False)}"""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }

    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(
                API_URL,
                headers=headers,
                json=data,
                timeout=REQUEST_TIMEOUT
            )

            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                # Extract JSON from response
                content = content.strip()
                if content.startswith("```"):
                    content = re.sub(r'^```\w*\n?', '', content)
                    content = re.sub(r'\n?```$', '', content)

                translations = json.loads(content)
                if len(translations) == len(texts):
                    return translations
                else:
                    log(f"    Length mismatch: got {len(translations)}, expected {len(texts)}")

        except json.JSONDecodeError:
            log(f"    JSON parse error, retry {attempt + 1}/{MAX_RETRIES}...")
        except requests.Timeout:
            log(f"    Timeout, retry {attempt + 1}/{MAX_RETRIES}...")
        except Exception as e:
            log(f"    Error: {e}, retry {attempt + 1}/{MAX_RETRIES}...")

        time.sleep(2 ** attempt)  # Exponential backoff

    return None


def translate_srt_file(input_path, output_path, source_lang, target_lang):
    """Translate a single SRT file"""
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return False, f"Read error: {e}"

    blocks = parse_srt(content)
    if not blocks:
        return False, "No subtitles found"

    log(f"  {len(blocks)} subtitles to translate")

    translated_blocks = []
    failed_batches_count = 0

    for i in range(0, len(blocks), BATCH_SIZE):
        batch = blocks[i:i+BATCH_SIZE]
        batch_index = i // BATCH_SIZE

        # Extract formatting and clean text
        original_texts = [b[2] for b in batch]
        formatting_info = [extract_formatting(t) for t in original_texts]
        clean_texts = [strip_html_tags(t) for t in original_texts]

        # Translate
        translations = translate_batch(clean_texts, source_lang, target_lang)

        if translations:
            for j, (idx, timing, orig) in enumerate(batch):
                if j < len(translations):
                    trans = apply_formatting(translations[j], formatting_info[j])
                else:
                    trans = orig
                translated_blocks.append((idx, timing, trans))
        else:
            failed_batches_count += 1
            log(f"  Batch {batch_index + 1} failed, queuing for retry")

            # Save for retry
            blocks_data = []
            for j, (idx, timing, orig) in enumerate(batch):
                blocks_data.append({
                    "idx": idx,
                    "timing": timing,
                    "original": orig,
                    "clean_text": clean_texts[j],
                    "formatting": formatting_info[j]
                })
                translated_blocks.append((idx, timing, orig))

            add_failed_batch(output_path, batch_index, blocks_data)

        # Progress
        progress = (i + len(batch)) / len(blocks) * 100
        if (batch_index % 3 == 0) or (i + len(batch) >= len(blocks)):
            log(f"  Progress: {progress:.0f}%")

        time.sleep(DELAY_BETWEEN_REQUESTS)

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        for idx, timing, text in translated_blocks:
            f.write(f"{idx}\n{timing}\n{text}\n\n")

    return True, f"{len(blocks)} subtitles, {failed_batches_count} batches queued for retry"


def scan_srt_files(base_path, source_suffix='.eng.srt', target_suffix='.fr.srt'):
    """Find SRT files to translate"""
    base = Path(base_path)
    ready = []

    for srt_file in base.rglob(f'*{source_suffix}'):
        target_file = Path(str(srt_file).replace(source_suffix, target_suffix))
        if not target_file.exists():
            ready.append({
                "source": srt_file,
                "target": target_file,
                "name": srt_file.name
            })

    return sorted(ready, key=lambda x: x["name"])


def main():
    parser = argparse.ArgumentParser(description='Translate SRT subtitle files')
    parser.add_argument('--path', type=str, default='.', help='Path to SRT files')
    parser.add_argument('--source', type=str, default='English', help='Source language')
    parser.add_argument('--target', type=str, default='French', help='Target language')
    parser.add_argument('--source-suffix', type=str, default='.eng.srt', help='Source file suffix')
    parser.add_argument('--target-suffix', type=str, default='.fr.srt', help='Target file suffix')
    args = parser.parse_args()

    print("=" * 60)
    print(f"SUBTITLE TRANSLATION - {args.source} → {args.target}")
    print(f"Model: {MODEL}")
    print(f"Path: {args.path}")
    print("=" * 60)

    # Check credits
    credits = get_credits()
    if credits is not None:
        print(f"OpenRouter credits: ${credits:.2f}")

    # Load progress
    state = load_progress()
    completed_set = set(state["completed"])
    stats["total_cost"] = state.get("total_cost", 0.0)

    # Scan files
    ready = scan_srt_files(args.path, args.source_suffix, args.target_suffix)
    todo = [r for r in ready if str(r["source"]) not in completed_set]

    print(f"\nFiles to translate: {len(ready)}")
    print(f"Already done: {len(completed_set)}")
    print(f"Remaining: {len(todo)}")

    if not todo:
        print("\nAll files translated!")
        return

    print(f"\nStarting at {datetime.now().strftime('%H:%M')}")
    print("-" * 60)

    for i, task in enumerate(todo):
        log(f"\n[{i+1}/{len(todo)}] {task['name'][:60]}...")

        start = time.time()
        success, msg = translate_srt_file(
            task["source"],
            task["target"],
            args.source,
            args.target
        )
        elapsed = time.time() - start

        if success:
            state["completed"].append(str(task["source"]))
            stats["completed"] += 1
            log(f"  OK ({elapsed:.1f}s) - {msg}")
        else:
            state["failed"].append(str(task["source"]))
            stats["failed"] += 1
            log(f"  FAILED ({elapsed:.1f}s) - {msg}")

        save_progress(state)

        # Status
        remaining = get_credits()
        credits_str = f"${remaining:.2f}" if remaining is not None else "?"
        print(f"=== {stats['completed']} OK, {stats['failed']} failed | Credits: {credits_str} ===")

    print("\n" + "=" * 60)
    print("COMPLETED!")
    print(f"  Translated: {stats['completed']}")
    print(f"  Failed: {stats['failed']}")
    print("=" * 60)


def run_resilient():
    """Run with auto-restart on errors"""
    max_restarts = 50
    restart_count = 0

    while restart_count < max_restarts:
        try:
            main()
            break
        except KeyboardInterrupt:
            log("Manual stop (Ctrl+C)")
            break
        except Exception as e:
            restart_count += 1
            log(f"!!! ERROR: {e}")
            log(f"!!! Auto-restart {restart_count}/{max_restarts} in 30s...")
            time.sleep(30)

    if restart_count >= max_restarts:
        log(f"!!! Too many restarts ({max_restarts}), giving up")


if __name__ == "__main__":
    run_resilient()
