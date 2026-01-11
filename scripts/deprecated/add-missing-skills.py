#!/usr/bin/env python3
"""
Add missing skills to marketplace.json
"""

import json
from pathlib import Path

# Skills to add with their metadata
MISSING_SKILLS = [
    {
        "name": "deployment-verifier",
        "source": "./julien-infra-deployment-verifier",
        "description": "Verify deployments on Hostinger VPS srv759970 after code changes. Checks HTTP status, PM2 processes, takes screenshots, and generates deployment reports.",
        "version": "1.0.0",
        "license": "Apache-2.0",
        "category": "deployment",
        "keywords": ["deployment", "verification", "testing", "hostinger", "pm2"]
    },
    {
        "name": "git-vps-sync",
        "source": "./julien-infra-git-vps-sync",
        "description": "Manage Git sync between VPS and GitHub for Hostinger srv759970. Handles unrelated histories, untracked files, diverged branches, and sync conflicts automatically.",
        "version": "1.0.0",
        "license": "Apache-2.0",
        "category": "git-operations",
        "keywords": ["git", "sync", "vps", "github", "conflicts", "hostinger"]
    },
    {
        "name": "hostinger-deployment",
        "source": "./julien-infra-hostinger-deployment",
        "description": "Complete deployment workflow for INCLUZ'HACT on Hostinger VPS srv759970. Orchestrates Git sync, build, PM2 restart, and verification for production and preview environments.",
        "version": "1.0.0",
        "license": "Apache-2.0",
        "category": "deployment",
        "keywords": ["deployment", "automation", "hostinger", "workflow", "pm2", "git"]
    },
    {
        "name": "nginx-audit",
        "source": "./julien-infra-nginx-audit",
        "description": "Audit and auto-fix Nginx configurations on Hostinger VPS srv759970 for IPv6 support, SSL issues, and best practices. Detects missing IPv6 listeners, validates SSL certificates, and applies fixes automatically or generates reports.",
        "version": "1.0.0",
        "license": "Apache-2.0",
        "category": "infrastructure",
        "keywords": ["nginx", "audit", "ipv6", "ssl", "configuration", "hostinger"]
    }
]

# Load marketplace.json
marketplace_file = Path('.claude-plugin/marketplace.json')

with open(marketplace_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Check which skills are already in the marketplace
existing_names = {p['name'] for p in data.get('plugins', [])}
print(f"Found {len(existing_names)} existing plugins\n")

# Add missing skills
added_count = 0
for skill in MISSING_SKILLS:
    if skill['name'] not in existing_names:
        data['plugins'].append(skill)
        added_count += 1
        print(f"✓ Added: {skill['name']:25} ({skill['category']})")
    else:
        print(f"⊘ Skipped: {skill['name']:25} (already exists)")

# Save updated marketplace.json
with open(marketplace_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n✅ Added {added_count} missing skills")
print(f"📊 Total plugins now: {len(data['plugins'])}")
print(f"📝 Saved to {marketplace_file}")
