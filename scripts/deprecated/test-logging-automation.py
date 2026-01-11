#!/usr/bin/env python3
"""
Test Logging Automation - Validate unified logging system with automated tests

Uses `claude -p` command (pattern from skill-api-server.py) to execute
Claude Code commands programmatically and verify logs are properly generated.

Usage:
    python scripts/test-logging-automation.py
"""

import subprocess
import time
import json
from pathlib import Path
from datetime import datetime

# Configuration
LOG_FILE = Path.home() / ".claude" / "logs" / "unified.jsonl"
PROJECT_ROOT = Path(__file__).parent.parent

def tail_logs(n=5):
    """Read last N lines from unified.jsonl"""
    if not LOG_FILE.exists():
        print(f"⚠️  Log file not found: {LOG_FILE}")
        return []

    with open(LOG_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        return [json.loads(line) for line in lines[-n:] if line.strip()]

def run_test_sequence():
    """Execute test commands and verify logs"""
    print("=" * 70)
    print("CLAUDE CODE LOGGING AUTOMATION TEST")
    print("=" * 70)
    print(f"Log file: {LOG_FILE}")
    print(f"Project: {PROJECT_ROOT}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    test_cases = [
        ("List skills", "list all available skills"),
        ("Read file", "read the CLAUDE.md file"),
        ("Skill invocation", "Skill('julien-list-resources')"),
        ("Context awareness", "what files are in the current directory?")
    ]

    results = []

    for name, command in test_cases:
        print(f"\n[TEST] {name}")
        print(f"  Command: {command}")

        # Get initial log count
        start_log_count = len(tail_logs(100))

        # Execute command
        try:
            # On Windows, need shell=True for .cmd files
            result = subprocess.run(
                ["claude", "-p", command],
                capture_output=True,
                text=True,
                timeout=30,
                cwd=PROJECT_ROOT,
                shell=True  # Required for Windows .cmd files
            )

            # Wait for logs to flush
            time.sleep(1)

            # Check logs
            new_logs = tail_logs(20)[start_log_count:]

            # Verify expected events
            event_types = [log.get('event_type', 'unknown') for log in new_logs]
            total_duration = sum(log.get('duration_ms', 0) for log in new_logs)

            results.append({
                'test': name,
                'command': command,
                'exit_code': result.returncode,
                'events': event_types,
                'duration_ms': total_duration,
                'success': len(new_logs) > 0 and result.returncode == 0
            })

            print(f"  ✓ Exit code: {result.returncode}")
            print(f"  ✓ Events: {', '.join(event_types) if event_types else 'none'}")
            print(f"  ✓ Total duration: {total_duration}ms")

            # Check for specific expected events
            if 'SessionStart' in event_types:
                print("  ✓ SessionStart logged")
            if 'UserPromptSubmit' in event_types:
                print("  ✓ UserPromptSubmit logged")
            if 'RouterDecision' in event_types:
                print("  ✓ RouterDecision logged")

        except subprocess.TimeoutExpired:
            print(f"  ✗ TIMEOUT after 30s")
            results.append({
                'test': name,
                'command': command,
                'exit_code': -1,
                'events': [],
                'duration_ms': 30000,
                'success': False
            })
        except Exception as e:
            print(f"  ✗ ERROR: {e}")
            results.append({
                'test': name,
                'command': command,
                'exit_code': -1,
                'events': [],
                'duration_ms': 0,
                'success': False
            })

    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)

    passed = sum(1 for r in results if r['success'])
    failed = len(results) - passed

    for r in results:
        status = "✅ PASS" if r['success'] else "❌ FAIL"
        events_count = len(r['events'])
        print(f"{status} | {r['test']:25} | {r['duration_ms']:6}ms | {events_count} events")

    print()
    print(f"Total: {len(results)} tests | Passed: {passed} | Failed: {failed}")

    # Validation checks
    print("\n" + "=" * 70)
    print("VALIDATION CHECKS")
    print("=" * 70)

    all_logs = tail_logs(100)

    # Check SessionStart duration
    session_starts = [log for log in all_logs if log.get('event_type') == 'SessionStart']
    if session_starts:
        avg_session_start = sum(log.get('duration_ms', 0) for log in session_starts) / len(session_starts)
        status = "✅" if avg_session_start < 500 else "❌"
        print(f"{status} SessionStart avg duration: {avg_session_start:.0f}ms (target: <500ms)")

    # Check UserPromptSubmit duration
    user_prompts = [log for log in all_logs if log.get('event_type') == 'UserPromptSubmit']
    if user_prompts:
        avg_prompt = sum(log.get('duration_ms', 0) for log in user_prompts) / len(user_prompts)
        status = "✅" if avg_prompt < 10 else "⚠️"
        print(f"{status} UserPromptSubmit avg duration: {avg_prompt:.0f}ms (target: <10ms)")

    # Check for timeout errors
    timeouts = [log for log in all_logs if log.get('status') == 'timeout']
    status = "✅" if len(timeouts) == 0 else "❌"
    print(f"{status} No ETIMEDOUT errors: {len(timeouts)} found")

    # Check session_id consistency
    session_ids = set(log.get('session_id', 'unknown') for log in all_logs)
    status = "✅" if len(session_ids) >= 1 else "❌"
    print(f"{status} Session ID tracking: {len(session_ids)} sessions")

    # Check log completeness
    has_session_start = any(log.get('event_type') == 'SessionStart' for log in all_logs)
    has_router_decision = any(log.get('event_type') == 'RouterDecision' for log in all_logs)
    status = "✅" if has_session_start and has_router_decision else "⚠️"
    print(f"{status} Log completeness: SessionStart={has_session_start}, RouterDecision={has_router_decision}")

    print()
    return results

if __name__ == "__main__":
    try:
        results = run_test_sequence()
        success_rate = sum(1 for r in results if r['success']) / len(results) if results else 0

        if success_rate == 1.0:
            print("✅ All tests passed!")
            exit(0)
        elif success_rate >= 0.5:
            print(f"⚠️  Some tests failed ({success_rate*100:.0f}% passed)")
            exit(1)
        else:
            print(f"❌ Most tests failed ({success_rate*100:.0f}% passed)")
            exit(2)

    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        exit(130)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        exit(3)
