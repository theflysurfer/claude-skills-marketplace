# MÉTHODOLOGIE DOCUMENTATION CLAUDE CODE

> **Version**: 2.0.0-DRY
> **Dernière MAJ**: 2025-10-14

---

## 🎯 Objectif

Documenter efficacement sans répétition. Traçabilité, réutilisabilité, clarté.

---

## 📋 Principes

1. **DRY**: Éviter duplication, références croisées
2. **Living docs**: MAJ plutôt que créer, archiver l'obsolète
3. **Audience ciblée**: Humains | LLM | Tous + niveau (1-10)
4. **Actionnable**: Exemples concrets, commandes reproductibles

---

## 📂 Structure

```
projet/
├── docs/
│   ├── guides/                    # Docs évolutifs
│   └── rapports/                  # Docs événementiels
└── README.md                       # Index
```

---

## 🏷️ Nommage

### Docs ÉVOLUTIFS (living docs)
**Types**: GUIDE, METHODOLOGIE, AUDIT, TROUBLESHOOTING
**Nom**: `[TYPE]_[sujet].md` (sans date)
**Horodatage**: dans le contenu, par section

**En-tête YAML obligatoire**:
```yaml
---
title: "Guide X"
version: X.Y.Z
created: YYYY-MM-DD
updated: YYYY-MM-DD
authors: [...]
audience: ["Humains"|"LLM"|"Tous"]
level: "Débutant (1-3)" | "Intermédiaire (4-6)" | "Expert (7-10)"
status: "Actif" | "Archivé" | "Draft"
tags: [...]
related: [fichiers connexes]
---
```

### Docs ÉVÉNEMENTIELS (snapshots)
**Types**: INCIDENT, SESSION, RECHERCHE, RECOMMANDATIONS, MIGRATION, PERFORMANCE, SECURITE
**Nom**: `YYYY.MM.DD_HH.mm_[commit-short]_[TYPE]_[sujet].md`
**Format horodatage fichier**: `2025.10.14_12.33` (points + underscores)

**Métadonnées obligatoires**:
```markdown
## Métadonnées
- **Date**: YYYY-MM-DD HH:MM
- **Commit**: abc1234 (7 chars)
- **Durée**: X heures (si applicable)
```

**Exemples noms fichiers**:
- `2025.10.14_12.33_a888861_RECHERCHE_design-system.md`
- `2025.10.13_14.30_a3f9c21_INCIDENT_nginx-404.md`
- `2025.10.15_09.00_7b2e8d4_SESSION_auth-implementation.md`

---

## 📑 Types de documents

### INCIDENT (événementiel)
**Quand**: Problème bloquant résolu

**Structure**:
```markdown
# Incident: [Titre]

## Métadonnées
- Date, Durée, Sévérité, Commit

## Résumé
[2-3 phrases]

## Symptômes → Timeline → Cause → Solution → Prévention

## Références
```

---

### SESSION (événementiel)
**Quand**: Session significative (feature, refactor)

**Structure**:
```markdown
# Session: [Titre]

## Métadonnées
- Date, Durée, Commits

## Objectif → Réalisations → Décisions → Problèmes → Fichiers modifiés → Tests → Next

## Références
```

---

### GUIDE (évolutif)
**Quand**: Procédure réutilisable

**Structure**:
```markdown
---
[En-tête YAML complet]
---

# Guide: [Titre]

## Vue d'ensemble → Concepts → Procédure pas à pas → Troubleshooting → Exemples → Références
```

---

### AUDIT (évolutif ou événementiel selon usage)
**Quand**: Analyse pré-intervention

**Structure**:
```markdown
# Audit: [Titre]

## Métadonnées

## Résumé exécutif
- Score, Risques, Recommandations

## Findings (🔴 Critique, 🟠 Majeur, 🟡 Mineur)

## Recommandations priorisées → Plan d'action → Références
```

---

### RECHERCHE (événementiel)
**Quand**: Investigation, exploration, benchmark

**Structure**:
```markdown
# Recherche: [Titre]

## Métadonnées
- Date, Objectif, Durée

## Question → Méthodologie → Découvertes → Options → Comparaison → Recommandation → Références
```

---

### PEDAGOGIQUE (évolutif)
**Quand**: Transfert de connaissance

**Structure**:
```markdown
# [Concept] expliqué (Niveau X/10)

## Métadonnées

## Vue d'ensemble → Analogie → Concept détaillé → Exemples → Pièges → Pour aller plus loin → Glossaire
```

---

### RECOMMANDATIONS (événementiel)
**Quand**: Décision technique importante

**Structure**:
```markdown
# Recommandations: [Titre]

## Métadonnées

## Contexte → Options évaluées (Avantages/Inconvénients/Évaluation) → Matrice décision → Recommandation → Risques → Next
```

---

### MIGRATION (événementiel)
**Quand**: Migration techno/version/infra

**Structure**:
```markdown
# Migration: [Titre]

## Métadonnées

## Objectif → Avant/Après → Procédure → Vérifications → Problèmes → Rollback plan → Leçons → Suivi
```

---

### PERFORMANCE (événementiel)
**Quand**: Optimisation mesurable

**Structure**:
```markdown
# Performance: [Titre]

## Métadonnées

## Résumé → Métriques avant → Optimisations → Métriques après → Graphiques → Recommandations → Références
```

---

### SECURITE (événementiel)
**Quand**: Audit sécurité, vulnérabilités

**Structure**:
```markdown
# Audit Sécurité: [Titre]

⚠️ CONFIDENTIEL - NE PAS COMMITTER AVEC DÉTAILS SENSIBLES

## Métadonnées

## Résumé → Vulnérabilités (🔴🟠🟡) → Bonnes pratiques → Plan remédiation → Vérifications → Références
```

---

## 🔄 Workflow

**Créer rapport quand**:
- Session > 1h avec changements significatifs → SESSION
- Problème bloquant résolu → INCIDENT
- Investigation terminée → RECHERCHE
- Décision technique → RECOMMANDATIONS
- Nouvelle procédure → GUIDE (ou MAJ)
- Migration effectuée → MIGRATION
- Optimisation mesurable → PERFORMANCE
- Vulnérabilité trouvée → SECURITE

**Production**:
1. Choisir type
2. Utiliser template
3. Remplir toutes sections
4. Nommer correctement
5. Ajouter métadonnées
6. Référencer dans README
7. Commit

**Maintenance**:
- Guides: MAJ en-tête YAML + contenu
- Rapports: immutables (créer nouveau si besoin)

---

## ✅ Checklist qualité

### Fond
- [ ] Toutes sections remplies
- [ ] Pas de TODO/À compléter
- [ ] Commandes testées
- [ ] Chemins corrects
- [ ] Liens valides

### Forme
- [ ] Nommage respecté
- [ ] Métadonnées présentes
- [ ] Markdown valide
- [ ] Code blocks avec langage

### Contexte
- [ ] Audience identifiée
- [ ] Niveau adapté
- [ ] Références croisées

### Traçabilité
- [ ] Commits mentionnés
- [ ] Fichiers listés
- [ ] Timeline claire

---

## 📚 Formats communs

**Horodatage**: ISO 8601 avec timezone (`2025-10-14T14:32:15Z`)
**Commit**: Hash court 7 caractères (`abc1234`)
**Fichiers**: Chemins absolus ou relatifs clairs
**Liens**: Références croisées (`voir GUIDE_X.md section Y`)

---

## 🔄 Évolution méthodologie

Document vivant. Pour améliorer:
1. Créer RECOMMANDATIONS_methodologie-doc.md
2. Tester sur 2-3 sessions
3. MAJ ce doc si validé

**Historique**:
| Version | Date | Changements |
|---------|------|-------------|
| 1.0.0 | 2025-10-13 | Création initiale |
| 2.0.0-DRY | 2025-10-14 | Refonte DRY, 95% réduction |

---

**Note**: Faciliter le travail, pas le complexifier. Utiliser uniquement les types pertinents.
