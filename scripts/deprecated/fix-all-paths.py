#!/usr/bin/env python3
"""
Fix ALL source paths in marketplace.json to match actual directory names
Critical bug: All paths use shortened names that don't match real directories
"""

import json
from pathlib import Path

# Mapping of marketplace names to actual directory paths
PATH_MAPPING = {
    "./sync-personal-skills": "./julien-workflow-sync-personal-skills",
    "./hostinger-ssh": "./julien-infra-hostinger-ssh",
    "./hostinger-docker": "./julien-infra-hostinger-docker",
    "./hostinger-nginx": "./julien-infra-hostinger-nginx",
    "./hostinger-database": "./julien-infra-hostinger-database",
    "./hostinger-maintenance": "./julien-infra-hostinger-maintenance",
    "./hostinger-space-reclaim": "./julien-infra-hostinger-space-reclaim",
    "./frontend-design": "./anthropic-web-frontend-design",
    "./pdf": "./anthropic-office-pdf",
    "./xlsx": "./anthropic-office-xlsx",
    "./docx": "./anthropic-office-docx",
    "./pptx": "./anthropic-office-pptx",
    "./mcp-builder": "./anthropic-dev-tools-mcp-builder",
    "./webapp-testing": "./anthropic-web-testing",
    "./canvas-design": "./anthropic-design-canvas",
    "./web-artifacts-builder": "./anthropic-web-artifacts-builder",
    "./skill-creator": "./julien-dev-tools-skill-creator",
    "./skill-creator-pro": "./julien-dev-tools-skill-creator",
    "./skill-reviewer": "./julien-dev-tools-skill-reviewer",
}

# Load marketplace.json
marketplace_file = Path('.claude-plugin/marketplace.json')

with open(marketplace_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Fix all source paths
fixed_count = 0
for plugin in data.get('plugins', []):
    old_source = plugin.get('source', '')
    if old_source in PATH_MAPPING:
        new_source = PATH_MAPPING[old_source]
        plugin['source'] = new_source
        fixed_count += 1
        print(f"✓ {plugin['name']:30} {old_source:30} → {new_source}")
    else:
        print(f"⚠ {plugin['name']:30} {old_source:30} (no mapping found)")

# Save fixed marketplace.json
with open(marketplace_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n✅ Fixed {fixed_count} plugin paths")
print(f"📝 Saved to {marketplace_file}")
