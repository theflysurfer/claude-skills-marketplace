#!/bin/bash
# Sync marketplace complet au démarrage de session Claude Code
# Hook: SessionStart

trap 'exit 0' ERR

# Chemin absolu Windows (sandbox Claude Code ne résout pas $HOME correctement)
CLAUDE_HOME="/c/Users/julien"
LOCAL_MARKETPLACE="$CLAUDE_HOME/OneDrive/Coding/_Projets de code/2025.11 Claude Code MarketPlace"
INSTALLED_MARKETPLACE="$CLAUDE_HOME/.claude/plugins/marketplaces/claude-skills-marketplace"
SKILLS_DIR="$CLAUDE_HOME/.claude/skills"
CONFIG_FILE="$INSTALLED_MARKETPLACE/skills/julien-workflow-sync-personal-skills/sync-config.json"

# 1. Sync marketplace.json depuis projet local
if [ -f "$LOCAL_MARKETPLACE/.claude-plugin/marketplace.json" ]; then
    mkdir -p "$INSTALLED_MARKETPLACE/.claude-plugin" 2>/dev/null || true
    cp "$LOCAL_MARKETPLACE/.claude-plugin/marketplace.json" "$INSTALLED_MARKETPLACE/.claude-plugin/" 2>/dev/null || true
fi

# 2. Sync skills depuis projet local
if [ -d "$LOCAL_MARKETPLACE/skills" ]; then
    mkdir -p "$INSTALLED_MARKETPLACE/skills" 2>/dev/null || true
    cp -r "$LOCAL_MARKETPLACE/skills/"* "$INSTALLED_MARKETPLACE/skills/" 2>/dev/null || true
fi

# 3. Sync configs (skill-triggers.json, scripts)
CONFIGS_SRC="$LOCAL_MARKETPLACE/configs"
if [ -d "$CONFIGS_SRC" ]; then
    if [ -f "$CONFIGS_SRC/skill-triggers.json" ]; then
        cp "$CONFIGS_SRC/skill-triggers.json" "$CLAUDE_HOME/.claude/" 2>/dev/null || true
    fi
    if [ -d "$CONFIGS_SRC/scripts" ]; then
        mkdir -p "$CLAUDE_HOME/.claude/scripts" 2>/dev/null || true
        cp "$CONFIGS_SRC/scripts/"*.sh "$CLAUDE_HOME/.claude/scripts/" 2>/dev/null || true
        chmod +x "$CLAUDE_HOME/.claude/scripts/"*.sh 2>/dev/null || true
    fi
fi

# 4. Sync core skills vers ~/.claude/skills/
if [ -f "$CONFIG_FILE" ] && command -v jq &>/dev/null; then
    mkdir -p "$SKILLS_DIR" 2>/dev/null || true
    SKILLS=$(jq -r '.skills_to_sync[]' "$CONFIG_FILE" 2>/dev/null | tr -d '\r') || true
    for skill in $SKILLS; do
        src="$INSTALLED_MARKETPLACE/skills/$skill"
        if [ -d "$src" ]; then
            rm -rf "$SKILLS_DIR/$skill" 2>/dev/null || true
            cp -r "$src" "$SKILLS_DIR/" 2>/dev/null || true
        fi
    done
fi

exit 0
