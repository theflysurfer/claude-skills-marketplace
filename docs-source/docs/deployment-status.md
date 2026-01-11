# Marketplace Deployment Status

Generated: 2026-01-02 13:14

## Summary

| Component | Count |
|-----------|-------|
| Skills indexed | 54 |
| Hooks configured | 9 |
| Commands available | 8 |
| Servers managed | 5 |

## Skills Deployment Status

Total: 54 skills indexed

| Skill | Source | Synced Global | Category |
|-------|--------|---------------|----------|
| `anthropic-design-canvas` | unknown | - | - |
| `anthropic-dev-tools-mcp-builder` | unknown | Yes | - |
| `anthropic-office-docx` | unknown | Yes | - |
| `anthropic-office-pdf` | unknown | Yes | - |
| `anthropic-office-pptx` | unknown | Yes | - |
| `anthropic-office-xlsx` | unknown | Yes | - |
| `anthropic-web-artifacts-builder` | unknown | - | - |
| `anthropic-web-frontend-design` | unknown | - | - |
| `anthropic-web-testing` | unknown | - | - |
| `commit-message` | unknown | - | - |
| `fastmcp-quality-review` | unknown | - | - |
| `julien-dev-claude-md-documenter` | unknown | Yes | - |
| `julien-dev-hook-creator` | unknown | Yes | - |
| `julien-dev-powershell-profile` | unknown | Yes | - |
| `julien-infra-deployment-verifier` | unknown | - | - |
| `julien-infra-git-vps-sync` | unknown | - | - |
| `julien-infra-hostinger-core` | unknown | - | - |
| `julien-infra-hostinger-database` | unknown | - | - |
| `julien-infra-hostinger-docker` | unknown | - | - |
| `julien-infra-hostinger-security` | unknown | - | - |
| `julien-infra-hostinger-web` | unknown | - | - |
| `julien-infra-jokers` | unknown | - | - |
| `julien-mcp-installer` | unknown | Yes | - |
| `julien-media-onepiece-workflow` | unknown | - | - |
| `julien-media-subtitle-translation` | unknown | - | - |
| `julien-ref-ahk-v1` | unknown | Yes | - |
| `julien-ref-ahk-v2` | unknown | Yes | - |
| `julien-ref-astro-install` | unknown | Yes | - |
| `julien-ref-batch` | unknown | Yes | - |
| `julien-ref-doc-production` | unknown | Yes | - |
| `julien-ref-doc-review` | unknown | Yes | - |
| `julien-ref-notion-markdown` | unknown | Yes | - |
| `julien-ref-powershell` | unknown | Yes | - |
| `julien-skill-creator` | unknown | Yes | - |
| `julien-skill-migration` | unknown | Yes | - |
| `julien-skill-move-to-core` | unknown | Yes | - |
| `julien-skill-renamer` | unknown | Yes | - |
| `julien-skill-reviewer` | unknown | Yes | - |
| `julien-skill-router` | unknown | Yes | - |
| `julien-workflow-advice-codex` | unknown | Yes | - |
| `julien-workflow-advice-gemini` | unknown | Yes | - |
| `julien-workflow-check-loaded-skills` | unknown | Yes | - |
| `julien-workflow-queuing-background-tasks` | unknown | Yes | - |
| `wordpress-structure-validator` | unknown | - | - |
| `wp-block-contract` | unknown | - | - |
| `wp-build-tools` | unknown | - | - |
| `wp-clean-css` | unknown | - | - |
| `wp-clem-hostinger-upload-image` | unknown | - | - |
| `wp-footer-contract` | unknown | - | - |
| `wp-header-contract` | unknown | - | - |
| `wp-pattern-contract` | unknown | - | - |
| `wp-remote-architecture` | unknown | - | - |
| `wp-sync-workflows` | unknown | - | - |
| `wp-wpcli-remote` | unknown | - | - |

## Hooks Deployment Status

Global: 5 | Optional: 1

| Hook | Event | Status | Category |
|------|-------|--------|----------|
| `audit-logging` | PostToolUse | Template | logging |
| `fast-skill-router` | UserPromptSubmit | Active (global) | routing |
| `idle-queue-check` | SessionEnd | Optional | tracking |
| `pre-write-validate` | PreToolUse | Template | security |
| `protect-claude-process` | PreToolUse | Active (global) | security |
| `session-end-cleanup` | SessionEnd | Active (global) | cleanup |
| `session-start-banner` | SessionStart | Active (global) | display |
| `session-summary` | SessionEnd | Template | logging |
| `track-skill-invocation` | PostToolUse | Active (global) | tracking |

## Commands Deployment Status

Total: 8 commands

| Command | Synced |
|---------|--------|
| `/julien-active-folder` | Yes |
| `/julien-check-loaded-skills` | Yes |
| `/julien-list-resources` | Yes |
| `/julien-project-info` | Yes |
| `/julien-project-list` | Yes |
| `/julien-project-scan` | Yes |
| `/julien-servers` | Yes |
| `/julien-sync` | Yes |

## Servers Status

Total: 5 servers configured

| Server | Port | Startup | Category |
|--------|------|---------|----------|
| `cooking-manager` | - | Yes | app |
| `idle-queue` | 8742 | Yes | core |
| `jokers` | 5000 | No | project |
| `mkdocs` | 8000 | Yes | docs |
| `money-manager` | 3000 | Yes | project |
