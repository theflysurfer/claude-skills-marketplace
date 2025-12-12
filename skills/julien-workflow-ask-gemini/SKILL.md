---
name: julien-workflow-ask-gemini
description: Get Gemini CLI's opinion on code, architecture, or implementation. Use when you want a second AI perspective during coding sessions.
---

# Ask Gemini

Get feedback from Google's Gemini CLI on code, architecture decisions, or implementation approaches.

## Prerequisites

- Gemini CLI installed: `npm install -g @google/gemini-cli`
- Authenticated: run `gemini` once to login with Google account

## When to Use

- Want a second opinion on code quality
- Need architectural review
- Comparing implementation approaches
- Code review before commit

## How to Invoke

The user will ask something like:
- "ask gemini what it thinks about this code"
- "get gemini's opinion on this approach"
- "demande à gemini de reviewer ce fichier"

## Execution

### For file review
```bash
gemini "Review this code and provide 3 specific improvements: $(cat <file_path>)"
```

### For architectural questions
```bash
gemini "<user's question about architecture or approach>"
```

### For comparing approaches
```bash
gemini "Compare these two approaches and recommend which is better: Approach A: <desc> vs Approach B: <desc>"
```

## Output Format

Present Gemini's response clearly to the user. If Gemini suggests improvements, summarize them as actionable items.

## Example Usage

**User**: "demande à gemini ce qu'il pense du semantic-skill-router.py"

**Action**:
```bash
gemini "Review this Python script for a semantic routing system. List 3 improvements for production use: $(cat scripts/semantic-skill-router.py)"
```

**Response**: Present Gemini's feedback, then ask if user wants to implement any suggestions.

## Notes

- Gemini has 1M token context window
- Default model: Gemini 2.5 Pro
- Timeout: allow up to 60s for response
- If response is cut off, Gemini may still be processing

## Tools Used

- `Bash` (usage: run gemini CLI command)
