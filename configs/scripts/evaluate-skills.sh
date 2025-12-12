#!/bin/bash
# Analyse le prompt et suggère les skills pertinentes (~150ms)
# Hook: UserPromptSubmit

# Chemin absolu Windows (sandbox Claude Code ne résout pas $HOME correctement)
CLAUDE_HOME="/c/Users/julien"
TRIGGERS_FILE="$CLAUDE_HOME/.claude/skill-triggers.json"

# Lire input JSON depuis stdin
INPUT=$(cat)
USER_PROMPT=$(echo "$INPUT" | jq -r '.user_prompt // empty' 2>/dev/null)

# Skip si prompt vide ou trop court
if [ -z "$USER_PROMPT" ] || [ ${#USER_PROMPT} -lt 10 ]; then
    exit 0
fi

# Skip si pas de fichier triggers
if [ ! -f "$TRIGGERS_FILE" ]; then
    exit 0
fi

# Convertir prompt en lowercase pour matching
PROMPT_LOWER=$(echo "$USER_PROMPT" | tr '[:upper:]' '[:lower:]')

# Chercher les skills matchantes
MATCHES=""
while IFS= read -r skill; do
    name=$(echo "$skill" | jq -r '.name')
    desc=$(echo "$skill" | jq -r '.description')

    # Parcourir les triggers
    matched=false
    while IFS= read -r trigger; do
        trigger_lower=$(echo "$trigger" | tr '[:upper:]' '[:lower:]')
        if echo "$PROMPT_LOWER" | grep -qi "$trigger_lower"; then
            matched=true
            break
        fi
    done < <(echo "$skill" | jq -r '.triggers[]')

    if [ "$matched" = true ]; then
        if [ -z "$MATCHES" ]; then
            MATCHES="- **$name**: $desc"
        else
            MATCHES="$MATCHES
- **$name**: $desc"
        fi
    fi
done < <(jq -c '.skills[]' "$TRIGGERS_FILE" 2>/dev/null)

# Injecter suggestion si matches trouvés
if [ -n "$MATCHES" ]; then
    echo "---"
    echo "SKILL SUGGESTION: Based on your request, consider using:"
    echo "$MATCHES"
    echo ""
    echo "Invoke with: Skill(\"skill-name\")"
    echo "---"
fi

exit 0
