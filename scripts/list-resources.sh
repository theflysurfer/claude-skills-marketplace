#!/bin/bash

# List Resources Script
# Generic script to list skills, agents, and plugins available in marketplace or local repo
# Works for both marketplace repositories and consumer repositories

set -e

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}=== Available Resources ===${NC}\n"

# Detect repository type
IS_MARKETPLACE=false
HAS_LOCAL_SKILLS=false
SKILLS_DIR=""

if [ -f ".claude-plugin/marketplace.json" ]; then
    IS_MARKETPLACE=true
    echo -e "${GREEN}✓${NC} Marketplace detected\n"
fi

if [ -d "skills" ]; then
    HAS_LOCAL_SKILLS=true
    SKILLS_DIR="skills"
    echo -e "${GREEN}✓${NC} Local skills directory found: ${BOLD}skills/${NC}\n"
elif [ -d ".claude/skills" ]; then
    HAS_LOCAL_SKILLS=true
    SKILLS_DIR=".claude/skills"
    echo -e "${GREEN}✓${NC} Local skills directory found: ${BOLD}.claude/skills/${NC}\n"
fi

# Function to parse JSON and display marketplace info
display_marketplace_info() {
    if [ ! -f ".claude-plugin/marketplace.json" ]; then
        return
    fi

    echo -e "${BOLD}${MAGENTA}## Marketplace Information${NC}\n"

    # Extract marketplace metadata using grep and sed (more portable than jq)
    NAME=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' .claude-plugin/marketplace.json | head -1 | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' .claude-plugin/marketplace.json | head -1 | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    DESCRIPTION=$(grep -o '"description"[[:space:]]*:[[:space:]]*"[^"]*"' .claude-plugin/marketplace.json | head -1 | sed 's/.*"description"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

    # Count plugins
    PLUGIN_COUNT=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' .claude-plugin/marketplace.json | grep -v "claude-skills-marketplace" | wc -l)

    echo -e "  ${BOLD}Name:${NC} $NAME"
    echo -e "  ${BOLD}Version:${NC} $VERSION"
    echo -e "  ${BOLD}Description:${NC} $DESCRIPTION"
    echo -e "  ${BOLD}Total Skills:${NC} $PLUGIN_COUNT"
    echo ""
}

# Function to display skills by category
display_marketplace_skills() {
    if [ ! -f ".claude-plugin/marketplace.json" ]; then
        return
    fi

    echo -e "${BOLD}${MAGENTA}## Skills by Category${NC}\n"

    # Extract unique categories
    CATEGORIES=$(grep -o '"category"[[:space:]]*:[[:space:]]*"[^"]*"' .claude-plugin/marketplace.json | sed 's/.*"category"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | sort -u)

    for CATEGORY in $CATEGORIES; do
        echo -e "${BOLD}${YELLOW}### ${CATEGORY^}${NC}\n"
        echo -e "| Name | Description | Version | License |"
        echo -e "|------|-------------|---------|---------|"

        # This is a simplified version - in production you'd want proper JSON parsing
        # For now, we'll just count and show that skills exist in this category
        grep -A 10 "\"category\"[[:space:]]*:[[:space:]]*\"$CATEGORY\"" .claude-plugin/marketplace.json | \
        grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' | \
        head -1 | \
        sed 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | \
        while read -r skill_name; do
            # Get description for this skill
            SKILL_DESC=$(grep -A 5 "\"name\"[[:space:]]*:[[:space:]]*\"$skill_name\"" .claude-plugin/marketplace.json | grep '"description"' | head -1 | sed 's/.*"description"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | cut -c1-60)
            SKILL_VER=$(grep -A 5 "\"name\"[[:space:]]*:[[:space:]]*\"$skill_name\"" .claude-plugin/marketplace.json | grep '"version"' | head -1 | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
            SKILL_LIC=$(grep -A 5 "\"name\"[[:space:]]*:[[:space:]]*\"$skill_name\"" .claude-plugin/marketplace.json | grep '"license"' | head -1 | sed 's/.*"license"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

            if [ -n "$skill_name" ]; then
                echo "| $skill_name | $SKILL_DESC | $SKILL_VER | $SKILL_LIC |"
            fi
        done
        echo ""
    done
}

# Function to display local skills
display_local_skills() {
    if [ -z "$SKILLS_DIR" ] || [ ! -d "$SKILLS_DIR" ]; then
        return
    fi

    echo -e "${BOLD}${MAGENTA}## Local Skills${NC}\n"
    echo -e "| Skill Name | Description |"
    echo -e "|------------|-------------|"

    for skill_folder in "$SKILLS_DIR"/*; do
        if [ -d "$skill_folder" ]; then
            SKILL_FILE="$skill_folder/SKILL.md"
            if [ -f "$SKILL_FILE" ]; then
                SKILL_NAME=$(basename "$skill_folder")
                # Try to extract description from YAML frontmatter
                SKILL_DESC=$(grep -A 1 "^description:" "$SKILL_FILE" | tail -1 | sed 's/^[[:space:]]*//' | cut -c1-80)

                if [ -z "$SKILL_DESC" ]; then
                    SKILL_DESC="No description available"
                fi

                echo "| $SKILL_NAME | $SKILL_DESC |"
            fi
        fi
    done
    echo ""
}

# Function to display usage instructions
display_usage_instructions() {
    echo -e "${BOLD}${MAGENTA}## Usage Instructions${NC}\n"

    if [ "$IS_MARKETPLACE" = true ]; then
        echo -e "${BOLD}Installing from this marketplace:${NC}"
        echo -e "  1. Add marketplace to Claude Code:"
        echo -e "     ${CYAN}/plugin marketplace add <github-url-or-local-path>${NC}\n"
        echo -e "  2. Browse available plugins:"
        echo -e "     ${CYAN}/plugin${NC}\n"
        echo -e "  3. Install a skill:"
        echo -e "     ${CYAN}/plugin install <skill-name>${NC}\n"
    fi

    if [ "$HAS_LOCAL_SKILLS" = true ]; then
        echo -e "${BOLD}Using local skills:${NC}"
        echo -e "  1. Install skill locally:"
        echo -e "     ${CYAN}claude skill install ./$SKILLS_DIR/<skill-name>${NC}\n"
        echo -e "  2. List installed skills:"
        echo -e "     ${CYAN}claude skill list${NC}\n"
        echo -e "  3. Use a skill:"
        echo -e "     ${CYAN}/<skill-name>${NC}\n"
    fi

    echo -e "${BOLD}For more information:${NC}"
    echo -e "  - Documentation: ${CYAN}https://docs.anthropic.com/claude/docs/skills${NC}"
    echo -e "  - This repository: ${CYAN}$(git config --get remote.origin.url 2>/dev/null || echo 'N/A')${NC}\n"
}

# Main execution
if [ "$IS_MARKETPLACE" = true ]; then
    display_marketplace_info
    display_marketplace_skills
fi

if [ "$HAS_LOCAL_SKILLS" = true ]; then
    display_local_skills
fi

if [ "$IS_MARKETPLACE" = false ] && [ "$HAS_LOCAL_SKILLS" = false ]; then
    echo -e "${RED}✗${NC} No marketplace or skills directory found in this repository."
    echo -e "  This script should be run from:"
    echo -e "    - A marketplace repository (with .claude-plugin/marketplace.json)"
    echo -e "    - A project with local skills (skills/ or .claude/skills/ directory)\n"
    exit 1
fi

display_usage_instructions

echo -e "${BOLD}${CYAN}=== End of Resources List ===${NC}\n"
