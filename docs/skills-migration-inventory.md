# Inventaire des Skills à Migrer

> Généré le 2025-12-17 (scan complet v2)

## Résumé

| Source | Skills | Action |
|--------|--------|--------|
| Marketplace (`skills/`) | 64 | ✅ Centralisées |
| **Projets dispersés** | **62** | **🔴 À MIGRER** |
| **~/.claude/skills/ orphelines** | **5** | **🔴 À MIGRER** |
| `_référentiels` (guides) | 8 | À convertir |
| **TOTAL À MIGRER** | **67** | |

---

## 🔴 Skills orphelines dans ~/.claude/skills/ (5)

Ces skills existent dans le dossier global mais PAS dans le marketplace:

| Skill | Description | Action |
|-------|-------------|--------|
| notion-github-enhance-note | Enrichir GitHub entries avec metadata API | Migrer |
| notion-inbox-to-github | Déplacer entries inbox vers GitHub DB | Migrer |
| notion-route-entry | Router entries Notion vers bons DB | Migrer |
| onepiece-workflow | Pipeline transcoding OnePiece (GPU local → Dropbox) | Migrer |
| startup-shortcuts-cleaner | Nettoyer raccourcis startup Windows | Migrer |

---

## 🔴 Skills à migrer depuis les projets (62)

### 2025.09 Notion Uploader (4 skills)
| Skill | Type |
|-------|------|
| notion-context-hook | Notion |
| zimprobagnais-categories | Spécifique |
| zimprobagnais-categories-film-quotes | Spécifique |
| zimprobagnais-echauffements | Spécifique |

### 2025.10 Delete null files (1 skill)
| Skill | Type |
|-------|------|
| delete-reserved-names | Utility |

### 2025.10 Rclone OneDrive (5 skills)
| Skill | Type |
|-------|------|
| migration-cleanup | Migration |
| migration-config | Migration |
| migration-monitor | Migration |
| migration-start | Migration |
| migration-verify | Migration |

### 2025.10 Site internet Clem (16 skills)
| Skill | Type |
|-------|------|
| commit-message | Git |
| hostinger-docker | Infra |
| onedrive-git-commit | Git |
| skill-reviewer | Dev Tools |
| skill-writer | Dev Tools |
| wordpress-structure-validator | WordPress |
| wp-block-contract | WordPress |
| wp-build-tools | WordPress |
| wp-clean-css | WordPress |
| wp-clem-hostinger-upload-image | WordPress/Spécifique |
| wp-footer-contract | WordPress |
| wp-header-contract | WordPress |
| wp-pattern-contract | WordPress |
| wp-remote-architecture | WordPress |
| wp-sync-workflows | WordPress |
| wp-wpcli-remote | WordPress |

### 2025.10 Wake chain (1 skill)
| Skill | Type |
|-------|------|
| docker-hostinger | Infra |

### 2025.11 Calibre (7 skills)
| Skill | Type |
|-------|------|
| calibre-add-book | Calibre |
| calibre-analyze | Calibre |
| calibre-cleanup | Calibre |
| calibre-convert | Calibre |
| calibre-metadata | Calibre |
| calibre-remove-book | Calibre |
| calibre-sync | Calibre |

### 2025.11 Site Web Jokers (4 skills)
| Skill | Type |
|-------|------|
| build-check | Deploy |
| database-migration | Deploy |
| deploy-jokers | Deploy/Spécifique |
| pm2-management | Deploy |

### 2025.11 Voyage en italie [Hostinger] (15 skills) 🆕
| Skill | Type |
|-------|------|
| audioguide-01-synopsis | Audioguide |
| audioguide-02-research | Audioguide |
| audioguide-03-academic | Audioguide |
| audioguide-03b-academic-papers | Audioguide |
| audioguide-04-sensory | Audioguide |
| audioguide-05-localization | Audioguide |
| audioguide-06-cultural-representations | Audioguide |
| audioguide-07-reviewer | Audioguide |
| audioguide-08-generate-txt | Audioguide |
| audioguide-09-review-tts | Audioguide |
| audioguide-10-generate-html | Audioguide |
| audioguide-11-generate-audio | Audioguide |
| audioguide-12-deploy-web | Audioguide |
| audioguide-13-analyze-floorplan | Audioguide |
| audioguide-orchestrator-enrichment | Audioguide |

### 2025.12 Civ 1 streaming [Hostinger] (4 skills) 🆕
| Skill | Type |
|-------|------|
| civ1-hostinger-backup | Streaming/Spécifique |
| civ1-hostinger-bootstrap | Streaming/Spécifique |
| civ1-hostinger-deploy | Streaming/Spécifique |
| civ1-hostinger-reset-auth | Streaming/Spécifique |

### 2025.12 Fetch GPT chats (1 skill)
| Skill | Type |
|-------|------|
| ai-chat-export-to-markdown | Export |

### 2025.12 Media streaming server [Hostinger] (3 skills) 🆕
| Skill | Type |
|-------|------|
| jellyfin-scan | Media |
| media-stack-refresh | Media |
| realdebrid-cleanup | Media |

### 2025.12 Queue manager (1 skill)
| Skill | Type |
|-------|------|
| queuing-background-tasks | Workflow |

---

## Projets avec .claude/skills/ mais sans SKILL.md

Ces projets ont des fichiers .md isolés (pas de vrais skills):

| Projet | Fichiers |
|--------|----------|
| 2025.10 Rag perso | deploy-update.md, test-api.md |
| 2025.11 Windhawk | git-commit-push.md, windhawk-config.md |

---

## Projets avec mix skills + fichiers

| Projet | Skills | Fichiers isolés |
|--------|--------|-----------------|
| 2025.10 Rclone OneDrive | 5 | 7 fichiers .md |
| 2025.10 Site internet Clem | 16 | wp-tokens.md |
| 2025.10 Wake chain | 1 | README.md |
| 2025.11 Calibre | 7 | calibre-common (dir sans SKILL.md) |
| 2025.12 Media streaming server | 3 | 7 fichiers .md |

---

## Catégorisation par type

### Réutilisables (migrer vers marketplace)
| Catégorie | Skills | Détail |
|-----------|--------|--------|
| WordPress | 13 | wp-*, wordpress-* |
| Calibre | 7 | calibre-* |
| Migration/Rclone | 5 | migration-* |
| Deploy/PM2 | 4 | build-check, database-migration, pm2-management, deploy-* |
| Infra Hostinger | 2 | docker-hostinger, hostinger-docker |
| Dev Tools | 2 | skill-reviewer, skill-writer |
| Git | 2 | commit-message, onedrive-git-commit |
| Media | 3 | jellyfin-scan, media-stack-refresh, realdebrid-cleanup |
| Utility | 2 | delete-reserved-names, queuing-background-tasks |
| Export | 1 | ai-chat-export-to-markdown |
| Notion | 1 | notion-context-hook |

### Spécifiques projet (garder local ou supprimer?)
| Catégorie | Skills | Projet |
|-----------|--------|--------|
| Audioguide | 15 | Voyage en italie |
| Civ1 Streaming | 4 | Civ 1 streaming |
| Zimprobagnais | 3 | Notion Uploader |
| Clem spécifique | 1 | wp-clem-hostinger-upload-image |
| Jokers spécifique | 1 | deploy-jokers |

---

## Statistiques

- **Total skills dispersées**: 62 (projets) + 5 (orphelines) = **67**
- **Projets avec skills**: 14
- **Skills réutilisables**: ~40
- **Skills spécifiques projet**: ~27

---

## Plan de migration suggéré

### Phase 1: Migration des skills réutilisables (~33)
```
skills/julien-wordpress-*     (13 skills)
skills/julien-calibre-*       (7 skills)
skills/julien-migration-*     (5 skills)
skills/julien-deploy-*        (4 skills)
skills/julien-media-*         (3 skills)
skills/julien-infra-*         (2 skills - à merger avec existants?)
skills/julien-dev-tools-*     (à merger avec existants)
```

### Phase 2: Décision sur skills spécifiques (~24)
- **audioguide-***: Garder local ou créer package "audioguide creator"?
- **civ1-***: Garder local (très spécifique)
- **zimprobagnais-***: Garder local (très spécifique)

### Phase 3: Nettoyage
- Supprimer skills migrées des projets source
- Convertir fichiers .md isolés en skills si utiles
