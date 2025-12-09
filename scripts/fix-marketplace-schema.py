#!/usr/bin/env python3
"""
Fix marketplace.json schema by removing metadata from plugin entries
Claude Code doesn't allow 'metadata' field in individual plugin entries
"""

import json
from pathlib import Path

# Load marketplace.json
marketplace_file = Path('.claude-plugin/marketplace.json')

with open(marketplace_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Remove metadata from all plugin entries
fixed_count = 0
for plugin in data.get('plugins', []):
    if 'metadata' in plugin:
        del plugin['metadata']
        fixed_count += 1
        print(f"✓ Removed metadata from: {plugin.get('name', 'unknown')}")

# Save fixed marketplace.json
with open(marketplace_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n✅ Fixed {fixed_count} plugins")
print(f"📝 Saved to {marketplace_file}")
