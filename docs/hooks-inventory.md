# Inventaire des Hooks Dispersés

> Généré le 2025-12-17

## Résumé

| Métrique | Valeur |
|----------|--------|
| Projets avec hooks | 5 |
| Hooks uniques | ~10 |
| Réutilisables | 3-4 |

---

## Projets avec hooks personnalisés

### 2025.09 Notion Uploader
**Fichier**: `settings.json`

| Event | Hook | Description |
|-------|------|-------------|
| UserPromptSubmit | `load-notion-context.py` | **Routing local** - Détecte domaine et charge contexte |

**Pattern réutilisable**: Oui - routing contextuel par projet

---

### 2025.10 Site internet Clem
**Fichier**: `settings.local.json`

| Event | Hook | Description |
|-------|------|-------------|
| PreToolUse | `pre-write-validate.sh` | Validation avant écriture |
| PostToolUse | `post-write-lint.sh` | Lint après écriture |

**Pattern réutilisable**: Oui - validation/lint générique

---

### 2025.11 Calibre
**Fichier**: `settings.json`

| Event | Hook | Description |
|-------|------|-------------|
| UserPromptSubmit | `detect-calibre-skills.py` | **Routing local** - Détecte mots-clés Calibre → suggère skills |

**Pattern réutilisable**: Oui - suggestion de skills contextuelle

---

### 2025.11 Site Web Jokers
**Fichier**: `settings.json`

| Event | Hook | Description |
|-------|------|-------------|
| PostToolUse (Write) | echo audit | Log fichiers écrits |
| PostToolUse (Edit) | echo audit | Log fichiers édités |
| PreToolUse (Bash) | echo audit | Log commandes bash |
| UserPromptSubmit | echo session | Log prompts |

**Pattern réutilisable**: Oui - audit logging générique

---

### 2025.12 Media streaming server [Hostinger]
**Fichier**: `settings.json`

| Event | Hook | Description |
|-------|------|-------------|
| PreToolUse | Python inline | Validation complexe |
| PreToolUse | Python inline | Logging avec timestamps |
| SessionEnd | Python inline | Cleanup logs |

**Pattern réutilisable**: Partiel - logging avancé

---

## Patterns réutilisables identifiés

### 1. Routing contextuel par projet
**Source**: Notion Uploader, Calibre

Détecte des mots-clés dans le prompt et:
- Charge du contexte approprié
- Suggère des skills pertinentes

→ **Peut être remplacé par le semantic-skill-router centralisé**

### 2. Validation pre-write
**Source**: Site internet Clem

Valide les fichiers avant écriture (syntaxe, format).

→ **Pourrait devenir un hook template**

### 3. Audit logging
**Source**: Site Web Jokers, Media streaming server

Log toutes les actions (prompts, fichiers, commandes).

→ **Pourrait devenir un hook template**

---

## Recommandations

### Centraliser dans le marketplace?

| Pattern | Action recommandée |
|---------|-------------------|
| Routing contextuel | ❌ Non - remplacé par semantic-skill-router |
| Validation pre-write | ⚠️ Peut-être - créer template |
| Audit logging | ⚠️ Peut-être - créer template |
| Logging avancé | ❌ Non - trop spécifique |

### Créer des hooks templates?

```
hooks/
├── templates/
│   ├── audit-logger.py       # Log toutes les actions
│   ├── file-validator.sh     # Valide avant écriture
│   └── skill-suggester.py    # Suggère skills (remplacé par router)
```

---

## Conclusion

Les hooks sont **plus difficiles à centraliser** que les skills car:
- Ils ont souvent une logique très spécifique au projet
- Ils interagissent avec des fichiers/contextes locaux
- Le semantic-skill-router centralisé remplace déjà le pattern "routing"

**Recommandation**:
1. Garder les hooks dans les projets (pas de migration)
2. Documenter les patterns réutilisables
3. Le système de routing centralisé remplacera les hooks de routing locaux
