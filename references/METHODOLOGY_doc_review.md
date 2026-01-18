# Review Methodology - Generic

**Version** : 2.0
**Date dernière mise à jour** : 2025-10-21

---

## 🎯 Vue d'ensemble

Cette méthodologie permet de :
- ✅ Annoter rapidement la documentation avec **4 balises simples**
- ✅ Parser automatiquement les commentaires avec Claude
- ✅ Distinguer changements micro (locaux) vs macro (impact systémique)
- ✅ Appliquer des modifications vérifiées depuis les sources
- ✅ Maintenir la qualité et la traçabilité

**Philosophie** : 4 balises core + 1 flag = clarté maximale, confusion minimale

---

## 🏷️ Système de Balises Simplifié

### Balises CORE (4 essentielles)

| Balise | Hotstring | Usage | Exemples |
|--------|-----------|-------|----------|
| `<!-- @FIX: -->` | `;fix` | Corriger erreur factuelle | Typo, formule incorrecte, info fausse |
| `<!-- @TODO: -->` | `;tod` | Ajouter/modifier contenu (générique) | Reformuler, ajouter exemple, compléter section |
| `<!-- @VERIFY: -->` | `;ver` | Vérifier contre sources | Vérifier formule, tester lien, cross-check data |
| `<!-- @OK: -->` | `;okk` | Validation légère | Section lue, pas de souci évident |

### Balises SPÉCIALES (usage particulier)

| Balise | Hotstring | Usage | Contexte |
|--------|-----------|-------|----------|
| `[MACRO]` | `;mac` | Flag impact systémique | À ajouter APRÈS description si changement macro |
| `<!-- @LOCKED: -->` | `;lck` | Verrouiller contenu | Interdire modification pendant session |
| `<!-- @APPROVED: -->` | `;app` | Validation formelle | NE JAMAIS modifier sauf demande explicite |

---

## 💡 Simplification vs Ancienne Version

### Avant (12 balises)

```markdown
<!-- @FIX: -->           Correction
<!-- @TODO: -->          Ajout
<!-- @CLARIFY: -->       Reformulation
<!-- @MISSING: -->       Info manquante
<!-- @ADD-EXAMPLE: -->   Exemple
<!-- @SUGGEST: -->       Suggestion
<!-- @QUESTION: -->      Question
<!-- @NOTE: -->          Remarque
<!-- @VERIFY: -->        Vérification
<!-- @CHECK-FORMULA: --> Formule
<!-- @CHECK-LINK: -->    Lien
<!-- @METHODOLOGY: -->   Méthodologie
```

### Maintenant (4 balises)

```markdown
<!-- @FIX: -->    Correction factuelle
<!-- @TODO: -->   Ajout/modification/amélioration (générique)
<!-- @VERIFY: --> Vérification contre source
<!-- @OK: -->     Validation
```

### Mapping ancienne → nouvelle

- `@CLARIFY` → `@TODO: Reformuler - [description]`
- `@MISSING` → `@TODO: Ajouter - [description]`
- `@ADD-EXAMPLE` → `@TODO: Exemple - [description]`
- `@SUGGEST` → `@TODO: Suggestion - [description]`
- `@QUESTION` → `@TODO: Question - [description]`
- `@NOTE` → `@TODO: Note - [description]`
- `@CHECK-FORMULA` → `@VERIFY: Formule - [description]`
- `@CHECK-LINK` → `@VERIFY: Lien - [description]`
- `@METHODOLOGY` → `@TODO: Méthodologie - [description]`

**Rétrocompatibilité** : Les anciens hotstrings (`;cla`, `;mis`, etc.) sont mappés automatiquement vers les nouvelles balises dans AHK et VSCode.

---

## 🎚️ Flag d'Impact [MACRO]

### Principe

**Par défaut** : Toute balise = changement **MICRO** (local, sans impact systémique)
**Si impact systémique** : Ajouter `[MACRO]` APRÈS la description

### Syntaxe

```markdown
<!-- @FIX: Formule Amount incorrecte [MACRO] affects 3 databases -->
<!-- @TODO: Renommer champ [MACRO] verify all references -->
<!-- @VERIFY: Workflow change [MACRO] test 4 user roles -->
```

**Hotstring** : `;mac` → `[MACRO]` (taper après avoir écrit la description)

### Workflow utilisateur

```
1. Taper balise : ;fix → <!-- @FIX:  -->
2. Écrire description : Formule Amount = A21*A23 incorrecte
3. Si impact systémique : ;mac → [MACRO]
4. Résultat : <!-- @FIX: Formule Amount = A21*A23 incorrecte [MACRO] -->
```

### Quand utiliser [MACRO] ?

| Trigger | Exemple | Pourquoi MACRO |
|---------|---------|----------------|
| **Formule/calcul modifié** | Changer formule utilisée ailleurs | Propagation calculs |
| **Rename field/variable** | Renommer "Budget" → "Allocation" | Multiples références |
| **Workflow/processus** | Ajouter état "Cancelled" | Impact droits/validations |
| **Relation cross-système** | Modifier lien DB1 → DB2 | Intégrité référentielle |
| **API/sync externe** | Test sync avec ERP | Risque régression externe |

### Exemples comparatifs

#### MICRO (pas de flag)
```markdown
<!-- @FIX: Typo "budjet" → "budget" -->
<!-- @TODO: Reformuler - Section trop technique pour non-expert -->
<!-- @TODO: Exemple - Ajouter montant typique contrat -->
<!-- @VERIFY: Formule - Check against JSON source -->
```

#### MACRO (flag requis)
```markdown
<!-- @FIX: Formule Amount = A21*A23 incorrecte [MACRO] should be if(A20="Manual",A21,A23), affects Budget Restant in 3 files -->

<!-- @TODO: Renommer "Budget Restant" → "Budget Available" [MACRO] check 3 databases + API sync -->

<!-- @VERIFY: Workflow add state "Cancelled" [MACRO] test impact on 4 user roles + reporting -->
```

---

## 🔄 Workflow de Review

### Phase 1 : Annotation (User)

1. Ouvrir fichier `.md`
2. Lire section par section
3. Annoter avec hotstrings :
   - Typo → `;fix` Typo "budjet" → "budget"
   - Reformulation → `;tod` Reformuler - Trop technique
   - Formule incorrecte → `;fix` Formule incorrecte `;mac`
   - Section OK → `;okk` Section glossaire
4. Sauvegarder

### Phase 2 : Parsing (Claude)

```bash
"Parse les commentaires de [dossier/fichier]"
"Génère le rapport de suivi des commentaires"
"Traite tous les @FIX de [dossier]"
```

### Phase 3 : Traitement (Claude)

1. **Extraction** : Scan récursif `.md`, extraction balises
2. **Détection impact** :
   - Flag `[MACRO]` explicite → Impact analysis requis
   - Agrégation changements → Détection auto macro cumulé
3. **Vérification** : `@VERIFY` → Check sources
4. **Proposition** : Changements avec preuves
5. **Impact Analysis** : Si `[MACRO]` → génération rapport détaillé
6. **Validation** : User approuve/refuse
7. **Application** : Changements + suppression balises
8. **Commit** : Rapport détaillé

#### Suppression balises après traitement

- ✅ Balises traitées : **SUPPRIMÉES**
- ✅ `@OK` et `@APPROVED` : **CONSERVÉES** avec date uniquement
- Format : `<!-- @OK: 2025-10-21 -->` ou `<!-- @APPROVED: 2025-10-21 -->`

#### Précautions

- ✅ Fichiers sur disque = source de vérité (pas mémoire Claude)
- ✅ `@LOCKED` jamais modifié
- ✅ `@APPROVED` modifié uniquement sur demande explicite
- ✅ Principe non-invention : Extraire depuis sources, JAMAIS inventer

---

## 📋 Format Rapport

```markdown
## Rapport traitement commentaires - [Date]

### Statistiques
- Total : 15 commentaires
- @FIX : 3 (dont 1 [MACRO]) | @TODO : 8 (dont 2 [MACRO])
- @VERIFY : 3 | @OK : 1

### Par fichier
- fichier1.md : 6 (2 MACRO)
- fichier2.md : 5 (1 MACRO)
- fichier3.md : 4 (0 MACRO)

### Par priorité

#### 🔴 Haute priorité (@FIX + [MACRO])
1. **@FIX [MACRO]** - `file.md:L34`
   **Avant** : Formule Amount = A21*A23
   **Après** : if(A20="Manual",A21,A23)
   **Impact** : 3 files use this result
   **Tests** : Verify calculations in file2, file5, file7
   **Action** : Edit L34 + cross-check

#### 🟠 Moyenne (@TODO)
2. **@TODO** - `file.md:L12`
   **Action** : Ajouter exemple montant typique
   **Impact** : Local

#### 🟢 Basse (@VERIFY simple)
3. **@VERIFY** - `file.md:L67`
   **Action** : Check formule against JSON
   **Result** : ✅ Confirmed correct
```

---

## 📋 Template Impact Analysis [MACRO]

Voir section dédiée dans documentation projet-specific.

---

## 🔧 Adaptation par Projet

Cette méthodologie générique doit être **complétée** par `review_methodology_current_project.md` :

1. Pointeur vers ce fichier
2. Sources de données spécifiques
3. Triggers [MACRO] spécifiques au domaine
4. Template documentation projet
5. Commandes Claude adaptées
6. Évolutions méthodologiques

---

## 📚 Changelog

### [2.0] - 2025-10-21
- ✅ **SIMPLIFICATION** : 12 balises → 4 balises core
- ✅ Ajout flag `[MACRO]` pour distinction micro/macro
- ✅ Balises `@LOCKED` et `@APPROVED` conservées (usage spécial)
- ✅ Mapping automatique anciennes balises → nouvelles
- ✅ Rétrocompatibilité hotstrings AHK et VSCode
- ✅ Documentation workflow détaillé

### [1.0] - 2025-09-30
- ✅ Version initiale avec 12 balises
- ✅ Workflow 3 phases
- ✅ Format rapport standardisé
