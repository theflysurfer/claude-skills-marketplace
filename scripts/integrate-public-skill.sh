#!/bin/bash
# integrate-public-skill.sh
# Script to integrate public skills into your marketplace

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MARKETPLACE_ROOT="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$MARKETPLACE_ROOT/skills"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Help
show_help() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS] SKILL_NAME

Integrate a public skill from Anthropic or other sources into your marketplace.

OPTIONS:
    -s, --source URL    Git repository URL (default: https://github.com/anthropics/skills)
    -p, --path PATH     Path within repo (default: skills/SKILL_NAME)
    -n, --name NAME     Custom name for the skill (default: SKILL_NAME)
    -c, --category CAT  Category (default: community)
    -h, --help          Show this help message

EXAMPLES:
    # Integrate frontend-design from Anthropic
    $(basename "$0") frontend-design

    # Integrate from custom repo
    $(basename "$0") -s https://github.com/user/repo -p skills/custom custom-skill

    # With custom name and category
    $(basename "$0") -n my-frontend -c development frontend-design
EOF
}

# Parse arguments
SOURCE_REPO="https://github.com/anthropics/skills"
SKILL_PATH=""
CUSTOM_NAME=""
CATEGORY="community"

while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--source)
            SOURCE_REPO="$2"
            shift 2
            ;;
        -p|--path)
            SKILL_PATH="$2"
            shift 2
            ;;
        -n|--name)
            CUSTOM_NAME="$2"
            shift 2
            ;;
        -c|--category)
            CATEGORY="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            SKILL_NAME="$1"
            shift
            ;;
    esac
done

# Validate
if [ -z "$SKILL_NAME" ]; then
    echo -e "${RED}Error: SKILL_NAME is required${NC}"
    show_help
    exit 1
fi

# Set defaults
TARGET_NAME="${CUSTOM_NAME:-$SKILL_NAME}"
SOURCE_PATH="${SKILL_PATH:-skills/$SKILL_NAME}"
TEMP_DIR="/tmp/skill-integration-$$"

echo -e "${BLUE}🔄 Integrating skill: $SKILL_NAME${NC}"
echo -e "${BLUE}   Source: $SOURCE_REPO${NC}"
echo -e "${BLUE}   Target: $TARGET_NAME${NC}"
echo ""

# Check if skill already exists
if [ -d "$SKILLS_DIR/$TARGET_NAME" ]; then
    echo -e "${YELLOW}⚠️  Skill '$TARGET_NAME' already exists${NC}"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
    rm -rf "$SKILLS_DIR/$TARGET_NAME"
fi

# Clone repository
echo -e "${BLUE}📦 Cloning repository...${NC}"
git clone --depth 1 --quiet "$SOURCE_REPO" "$TEMP_DIR"

# Check if skill exists in repo
if [ ! -d "$TEMP_DIR/$SOURCE_PATH" ]; then
    echo -e "${RED}❌ Error: Skill not found at $SOURCE_PATH${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Copy skill
echo -e "${BLUE}📋 Copying skill files...${NC}"
mkdir -p "$SKILLS_DIR/$TARGET_NAME"
cp -r "$TEMP_DIR/$SOURCE_PATH"/* "$SKILLS_DIR/$TARGET_NAME/"

# Read SKILL.md metadata
SKILL_MD="$SKILLS_DIR/$TARGET_NAME/SKILL.md"
if [ -f "$SKILL_MD" ]; then
    DESCRIPTION=$(grep -A 1 "^description:" "$SKILL_MD" | tail -1 | sed 's/description: //' | tr -d '\n')
    LICENSE=$(grep -A 1 "^license:" "$SKILL_MD" | tail -1 | sed 's/license: //' | tr -d '\n')
else
    echo -e "${YELLOW}⚠️  No SKILL.md found${NC}"
    DESCRIPTION="Integrated from $SOURCE_REPO"
    LICENSE="Unknown"
fi

# Create ATTRIBUTION.md
echo -e "${BLUE}📝 Creating attribution file...${NC}"
cat > "$SKILLS_DIR/$TARGET_NAME/ATTRIBUTION.md" <<EOF
# Attribution

This skill is integrated from an external source.

**Original Source**: $SOURCE_REPO
**Original Path**: $SOURCE_PATH
**License**: ${LICENSE:-Apache-2.0}
**Integrated**: $(date +%Y-%m-%d)

## Modifications

- $(date +%Y-%m-%d) - Initial integration into personal marketplace

EOF

# Extract commit info if possible
if [ -d "$TEMP_DIR/.git" ]; then
    COMMIT_HASH=$(cd "$TEMP_DIR" && git rev-parse --short HEAD)
    COMMIT_DATE=$(cd "$TEMP_DIR" && git log -1 --format=%ai)
    cat >> "$SKILLS_DIR/$TARGET_NAME/ATTRIBUTION.md" <<EOF
## Source Version

- **Commit**: $COMMIT_HASH
- **Date**: $COMMIT_DATE

EOF
fi

# Cleanup temp
rm -rf "$TEMP_DIR"

# Output marketplace.json entry
echo ""
echo -e "${GREEN}✅ Skill integrated successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Add this to your .claude-plugin/marketplace.json:${NC}"
echo ""
cat <<EOF
{
  "name": "$TARGET_NAME",
  "source": "./$TARGET_NAME",
  "description": "${DESCRIPTION:-Integrated skill from $SOURCE_REPO}",
  "version": "1.0.0",
  "license": "${LICENSE:-Apache-2.0}",
  "category": "$CATEGORY",
  "keywords": ["community", "integrated"],
  "metadata": {
    "upstream": "$SOURCE_REPO",
    "path": "$SOURCE_PATH",
    "integrated": "$(date +%Y-%m-%d)",
    "forked": true
  }
}
EOF
echo ""
echo -e "${BLUE}💡 Next steps:${NC}"
echo -e "   1. Update .claude-plugin/marketplace.json"
echo -e "   2. Review and test the skill"
echo -e "   3. Update README.md with attribution"
echo -e "   4. Run: /skill $TARGET_NAME (to test)"
echo ""
