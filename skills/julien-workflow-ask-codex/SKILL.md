---
name: julien-workflow-ask-codex
description: Get OpenAI Codex CLI's opinion on code, bugs, or implementation. Use when you want a second AI perspective during coding sessions.
---

# Ask Codex

Get feedback from OpenAI's Codex CLI on code, bugs, or implementation approaches.

## Prerequisites

- Codex CLI installed: `npm install -g @openai/codex`
- Authenticated: run `codex login` or sign in with ChatGPT account

## When to Use

- Want a second opinion on code quality
- Need bug analysis
- Code review before commit
- Performance optimization suggestions

## How to Invoke

The user will ask something like:
- "ask codex what it thinks about this code"
- "get codex's opinion on this implementation"
- "fais reviewer ce fichier par codex"

## Execution

### For file review (non-interactive)
```bash
codex exec "Review <file_path> and provide 3 specific improvements for production"
```

### For bug analysis
```bash
codex exec "Analyze <file_path> for potential bugs and edge cases"
```

### For dedicated code review
```bash
codex review
```
Note: `codex review` opens an interactive review session - use `codex exec` for non-interactive feedback.

## Output Format

Present Codex's response clearly to the user. If Codex suggests improvements, summarize them as actionable items.

## Example Usage

**User**: "demande à codex de reviewer le benchmark"

**Action**:
```bash
codex exec "Review scripts/benchmark-semantic-router.py for improvements and potential issues"
```

**Response**: Present Codex's feedback, then ask if user wants to implement any suggestions.

## Notes

- Default model: GPT-5.1 Codex Max
- Supports reasoning levels
- `codex exec` for non-interactive (scripted) use
- `codex review` for interactive review session
- Timeout: allow up to 60s for response

## Tools Used

- `Bash` (usage: run codex CLI command)
