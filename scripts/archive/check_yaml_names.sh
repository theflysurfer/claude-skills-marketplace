#!/bin/bash

cd "C:\Users\julien\OneDrive\Coding\_Projets de code\2025.11 Claude Code MarketPlace"

echo "Checking for YAML name mismatches..."
echo ""

for skill_dir in skills/*/; do
    skill_name=$(basename "$skill_dir")
    skill_file="${skill_dir}SKILL.md"

    if [ -f "$skill_file" ]; then
        yaml_name=$(grep "^name:" "$skill_file" | head -1 | sed 's/name: //')

        if [ -n "$yaml_name" ] && [ "$yaml_name" != "$skill_name" ]; then
            echo "❌ Directory: $skill_name"
            echo "   YAML name: $yaml_name"
            echo ""
        fi
    fi
done

echo "Done."
