# Comment Utiliser les Skills dans un Repository

Guide complet pour utiliser les skills de cette marketplace dans vos projets.

---

## 📚 Table des Matières

1. [Installation et Configuration](#installation-et-configuration)
2. [Méthodes d'Utilisation](#méthodes-dutilisation)
3. [Exemples Pratiques par Skill](#exemples-pratiques-par-skill)
4. [Workflows Combinés](#workflows-combinés)
5. [Troubleshooting](#troubleshooting)

---

## Installation et Configuration

### Méthode 1: Installation Globale (Recommandé)

Les skills installés globalement sont disponibles dans **tous vos projets**.

#### Étape 1: Sync vers ~/.claude/skills/

Utilisez le skill `sync-personal-skills` de cette marketplace :

```bash
# Depuis ce repository marketplace
cd /path/to/2025.11\ Claude\ Code\ MarketPlace

# Activez Claude Code et utilisez le skill
# Dans Claude Code, tapez :
/sync-personal-skills
```

**Ou manuellement** :

```bash
# Copier tous les skills vers le dossier global
cp -r skills/* ~/.claude/skills/

# Vérifier l'installation
ls ~/.claude/skills/
```

#### Étape 2: Vérifier les Skills Disponibles

Dans n'importe quel projet avec Claude Code :

```bash
# Lister les skills disponibles
claude skill list

# Ou dans la conversation Claude Code :
"Quels skills sont disponibles ?"
```

### Méthode 2: Installation par Projet (Locale)

Pour utiliser des skills uniquement dans un projet spécifique :

```bash
# Dans votre projet
cd /path/to/mon-projet

# Créer le dossier .claude si nécessaire
mkdir -p .claude/skills

# Copier les skills souhaités
cp -r /path/to/marketplace/skills/frontend-design .claude/skills/
cp -r /path/to/marketplace/skills/mcp-builder .claude/skills/
```

**Avantages** :
- ✅ Skills versionnés avec le projet (Git)
- ✅ Équipe partage les mêmes skills
- ✅ Isolation par projet

**Inconvénients** :
- ⚠️ Duplication si utilisés dans plusieurs projets
- ⚠️ Maintenance manuelle

### Méthode 3: Via Plugin Marketplace

Si ce repository est publié sur GitHub :

```bash
# Ajouter la marketplace
/plugin marketplace add theflysurfer/claude-skills-marketplace

# Installer un skill spécifique
/plugin install frontend-design
/plugin install mcp-builder
```

---

## Méthodes d'Utilisation

### 1. Invocation Automatique (Recommandé)

Claude détecte automatiquement quand utiliser un skill basé sur le **contexte et la description**.

**Exemple - frontend-design** :

```plaintext
Vous: "Crée-moi une landing page moderne pour une startup de biotech"

Claude: [Détecte automatiquement frontend-design]
        [Charge le skill]
        [Applique les principes de design distinctif]
        [Génère HTML/CSS avec typographie unique]
```

**Comment ça marche ?**
- Claude lit la `description` dans le frontmatter YAML
- Compare avec votre demande
- Charge le skill si pertinent

### 2. Invocation Explicite par Slash Command

Forcer l'utilisation d'un skill :

```bash
/frontend-design "Crée une page d'accueil minimaliste"
/mcp-builder "Crée un serveur MCP pour l'API GitHub"
/webapp-testing "Teste la page localhost:3000"
```

**Avantages** :
- ✅ Contrôle total sur quel skill utiliser
- ✅ Utile pour tester un skill
- ✅ Force un skill même si non détecté automatiquement

### 3. Mention dans la Conversation

Mentionner explicitement le skill :

```plaintext
Vous: "En utilisant le skill mcp-builder, crée-moi un serveur MCP
      pour l'API Notion avec support des pages et databases"

Claude: [Charge mcp-builder explicitement]
        [Suit le guide Phase 1-4]
        [Génère le code FastMCP]
```

### 4. Workflow Multi-Skills

Enchaîner plusieurs skills :

```plaintext
Vous: "Crée une landing page (frontend-design), puis teste-la
      (webapp-testing), et crée un PowerPoint de présentation (pptx)"

Claude: [Utilise frontend-design]
        → Génère la landing page
        [Utilise webapp-testing]
        → Teste la page
        [Utilise pptx]
        → Crée la présentation
```

---

## Exemples Pratiques par Skill

### 🎨 Frontend Design

#### Cas d'usage
Créer des interfaces web distinctives et production-ready.

#### Comment l'invoquer

**Automatique** - Mentionnez :
- "interface", "landing page", "dashboard", "composant React"
- "design", "UI", "frontend", "page web"

**Exemples** :

```plaintext
1. "Crée une landing page pour une app de méditation"
   → Génère HTML/CSS avec design calme, typographie unique

2. "Construis un dashboard analytics avec des charts"
   → Applique design bold avec data visualization

3. "Crée un composant React pour un profil utilisateur"
   → Code React avec styles distinctifs
```

#### Vérifier que le skill est actif

```plaintext
Claude mentionnera dans sa réponse :
"I'm using the frontend-design skill to create a distinctive interface..."
```

---

### 🔌 MCP Builder

#### Cas d'usage
Créer des serveurs MCP pour connecter Claude à des APIs externes.

#### Comment l'invoquer

**Automatique** - Mentionnez :
- "MCP server", "Model Context Protocol"
- "intégrer une API", "connecter Claude à..."

**Exemples** :

```plaintext
1. "Crée un serveur MCP pour l'API GitHub"
   → Guide complet : recherche docs, design tools, code FastMCP

2. "Intègre Notion avec Claude via MCP"
   → Serveur MCP avec tools pour pages/databases

3. "Construis un MCP pour Stripe payments"
   → Serveur avec authentication et payment tools
```

#### Workflow du skill

Le skill vous guide à travers 4 phases :
1. **Research** - Étudie l'API cible
2. **Design** - Définit les tools MCP
3. **Implementation** - Code FastMCP ou TypeScript
4. **Testing** - Valide avec Claude

---

### 🧪 Webapp Testing

#### Cas d'usage
Tester des applications web locales avec Playwright.

#### Comment l'invoquer

**Automatique** - Mentionnez :
- "teste l'app", "vérifier la page", "screenshot"
- "localhost", "debug UI", "logs navigateur"

**Exemples** :

```plaintext
1. "Teste localhost:3000 et prends des screenshots"
   → Lance Playwright, capture screenshots, analyse UI

2. "Vérifie que le formulaire de login fonctionne"
   → Teste interactions, validation, erreurs

3. "Debug pourquoi le bouton ne répond pas"
   → Inspecte DOM, console logs, événements
```

#### Prérequis

```bash
# Installer Playwright si pas déjà fait
npm install -D @playwright/test
npx playwright install
```

---

### 📄 PDF / XLSX / DOCX / PPTX (Suite Office)

#### Cas d'usage
Manipuler des documents Office programmatiquement.

#### Comment les invoquer

**Automatique** - Mentionnez le type de fichier :

**PDF** :
```plaintext
1. "Extrais le texte de rapport.pdf"
2. "Fusionne ces 3 PDFs en un seul"
3. "Remplis le formulaire PDF avec ces données"
```

**XLSX** :
```plaintext
1. "Crée un budget Excel avec formules"
2. "Analyse sales-data.xlsx et génère un rapport"
3. "Ajoute un graphique à ce spreadsheet"
```

**DOCX** :
```plaintext
1. "Crée un contrat Word avec sections numérotées"
2. "Modifie proposal.docx avec tracked changes"
3. "Extrais tous les commentaires du document"
```

**PPTX** :
```plaintext
1. "Crée une présentation de 10 slides sur notre produit"
2. "Ajoute des speaker notes à chaque slide"
3. "Convertis ce markdown en PowerPoint"
```

---

### 🎨 Canvas Design

#### Cas d'usage
Créer des visuels (posters, infographics) en PNG/PDF.

#### Comment l'invoquer

**Automatique** - Mentionnez :
- "poster", "infographic", "visual art"
- "design", "graphique", "illustration"

**Exemples** :

```plaintext
1. "Crée un poster pour un événement tech"
   → Design PNG avec typographie unique

2. "Génère une infographie sur le changement climatique"
   → Visual avec données, charts, design cohérent

3. "Design un logo minimaliste pour une startup"
   → Concepts visuels en PNG/PDF
```

---

### 🏗️ Web Artifacts Builder

#### Cas d'usage
Prototyper rapidement des outils web interactifs.

#### Comment l'invoquer

**Automatique** - Mentionnez :
- "prototype", "démo", "outil web"
- "quick app", "interactive"

**Exemples** :

```plaintext
1. "Crée un calculateur de taxes interactif"
   → HTML/JS standalone avec calculs en temps réel

2. "Prototyper une todo app simple"
   → App fonctionnelle avec localStorage

3. "Construis un color picker tool"
   → Interface interactive pour choisir couleurs
```

---

### 🛠️ Skill Creator / Skill Creator Pro

#### Cas d'usage
Créer vos propres skills personnalisés.

#### Comment l'invoquer

**Explicite** - Mentionnez clairement :

```plaintext
1. "J'aimerais créer un skill pour déployer sur Vercel"
   → Guide Step 1-6 du skill-creator

2. "Aide-moi à créer un skill avec Skill Chaining complet"
   → Utilise skill-creator-pro
   → Génère SKILL.md avec Input/Output, Visual Workflow
```

#### Workflow

**Avec skill-creator-pro** :
1. Understanding (exemples concrets)
2. Planning (scripts, references, assets)
3. Initialize (template structure)
4. Edit (SKILL.md + **Skill Chaining**)
5. Package (validation)
6. Iterate (quality rubric)

---

## Workflows Combinés

### Workflow 1: Développement Frontend Complet

```plaintext
Vous: "Crée une landing page startup biotech, teste-la,
      et génère une présentation pour les investisseurs"

Étapes automatiques :
1. frontend-design → Génère landing page distinctive
2. webapp-testing → Teste fonctionnalité et UI
3. pptx → Crée présentation avec screenshots
```

### Workflow 2: Création de MCP Server avec Tests

```plaintext
Vous: "Crée un serveur MCP pour Airtable, documente-le
      dans un Word, et fais une présentation technique"

Étapes :
1. mcp-builder → Développe le serveur FastMCP
2. docx → Documentation technique avec tracked changes
3. pptx → Présentation architecture
```

### Workflow 3: Déploiement Infrastructure

```plaintext
Vous: "Déploie mon app Next.js sur Hostinger VPS"

Skills automatiques (si vous avez les skills Hostinger) :
1. hostinger-ssh → Connexion VPS
2. hostinger-docker → Setup container
3. hostinger-nginx → Configure reverse proxy
4. hostinger-deployment → Déploie l'app
```

### Workflow 4: Création de Skill Personnalisé

```plaintext
Vous: "Crée un skill pour automatiser mes rapports hebdomadaires"

Utilise skill-creator-pro :
1. Step 1 : Exemples de rapports
2. Step 2 : Planning (templates Excel, scripts Python)
3. Step 3 : Initialize skill structure
4. Step 4 : Edit + Skill Chaining documentation
5. Step 5 : Package et valider
```

---

## Configuration Avancée

### Personnaliser le Comportement des Skills

#### 1. Modifier la Priorité d'un Skill

Éditer `~/.claude/skills/<skill-name>/SKILL.md` :

```yaml
---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces.
             USE THIS SKILL for ALL web UI tasks. # ← Force priorité
---
```

#### 2. Créer des Variantes de Skills

```bash
# Copier et personnaliser
cp -r ~/.claude/skills/frontend-design ~/.claude/skills/frontend-design-minimal

# Éditer pour style minimaliste spécifique
nano ~/.claude/skills/frontend-design-minimal/SKILL.md
```

#### 3. Combiner Skills dans un Meta-Skill

Créer un skill qui orchestre d'autres skills :

```markdown
---
name: full-stack-builder
description: Build complete full-stack applications using frontend-design,
             mcp-builder, and webapp-testing in sequence.
---

# Full Stack Builder

This skill orchestrates multiple skills to build complete applications.

## Workflow

1. Use **frontend-design** to create the UI
2. Use **mcp-builder** to create backend integrations
3. Use **webapp-testing** to validate functionality

## Skill Chaining

### Skills Required Before
None (entry point skill)

### Compatible Skills After
- **hostinger-deployment** (if deploying to VPS)
- **pptx** (if creating presentation)
```

---

## Troubleshooting

### Skill Ne Se Charge Pas Automatiquement

**Problème** : Claude n'utilise pas le skill attendu

**Solutions** :

1. **Vérifier installation** :
   ```bash
   ls ~/.claude/skills/<skill-name>/SKILL.md
   ```

2. **Invoquer explicitement** :
   ```plaintext
   /skill-name "votre demande"
   ```

3. **Améliorer la description** :
   ```yaml
   # Dans SKILL.md, soyez plus spécifique
   description: Use this skill when user asks for X, Y, or Z
   ```

4. **Mentionner dans la demande** :
   ```plaintext
   "En utilisant le skill frontend-design, crée..."
   ```

### Skill Se Charge Mais N'A Pas Les Ressources

**Problème** : Le skill cherche `scripts/` ou `references/` manquants

**Solution** :

```bash
# Vérifier structure complète
ls -la ~/.claude/skills/<skill-name>/

# Devrait contenir :
# SKILL.md
# scripts/ (si mentionné dans SKILL.md)
# references/ (si mentionné dans SKILL.md)
# assets/ (si mentionné dans SKILL.md)

# Re-copier depuis marketplace si incomplet
cp -r /path/to/marketplace/skills/<skill-name>/* ~/.claude/skills/<skill-name>/
```

### Conflit Entre Plusieurs Skills

**Problème** : Deux skills se déclenchent pour la même demande

**Solutions** :

1. **Invoquer explicitement le bon skill** :
   ```plaintext
   /frontend-design "crée une landing page"
   ```

2. **Modifier les descriptions** pour mieux différencier

3. **Désactiver temporairement un skill** :
   ```bash
   mv ~/.claude/skills/skill-conflictuel ~/.claude/skills/_disabled_skill-conflictuel
   ```

### Erreur "Skill Not Found"

**Problème** : `/skill-name` retourne une erreur

**Solutions** :

```bash
# 1. Vérifier le nom exact
ls ~/.claude/skills/

# 2. Le nom doit matcher exactement le 'name:' dans SKILL.md
cat ~/.claude/skills/skill-name/SKILL.md | head -5

# 3. Pas d'espaces ou caractères spéciaux
# ✅ Bon : frontend-design
# ❌ Mauvais : Frontend Design, frontend_design
```

---

## Bonnes Pratiques

### 1. Commencer Simple

```plaintext
# ✅ Bon - Demande claire et simple
"Crée une landing page pour une app de fitness"

# ❌ Éviter - Trop complexe d'un coup
"Crée une landing page, une API, un dashboard admin,
 des tests, un déploiement CI/CD, et une présentation"
```

### 2. Utiliser les Skills en Séquence

```plaintext
# ✅ Bon - Une étape à la fois
1. "Crée la landing page" (frontend-design)
2. "Maintenant teste-la" (webapp-testing)
3. "Crée une présentation des résultats" (pptx)

# Permet d'ajuster entre chaque étape
```

### 3. Fournir du Contexte

```plaintext
# ✅ Bon - Contexte clair
"Crée un dashboard analytics pour suivre les KPIs de ventes.
 Style : moderne et minimaliste
 Couleurs : bleu et blanc
 Charts : line chart (revenus), bar chart (par produit)"

# ❌ Insuffisant
"Fais un dashboard"
```

### 4. Itérer et Affiner

```plaintext
1. "Crée une landing page startup biotech"
   → Claude génère v1

2. "Rends la typographie plus audacieuse"
   → Claude ajuste avec frontend-design

3. "Ajoute une section testimonials"
   → Claude enrichit

Chaque itération bénéficie du skill actif
```

### 5. Documenter Vos Workflows

Si vous utilisez souvent les mêmes séquences, créez un meta-skill ou documentez :

```markdown
# Mon Workflow Standard

1. **Design** : frontend-design
2. **Test** : webapp-testing
3. **Deploy** : hostinger-deployment
4. **Present** : pptx

Commande type :
"Suis mon workflow standard pour créer [description]"
```

---

## Exemples Complets End-to-End

### Exemple 1: Créer et Déployer une Landing Page

```plaintext
# Étape 1 : Créer la page
Vous: "Crée une landing page pour une startup SaaS B2B de
      gestion de projets. Style moderne, professionnel."

Claude: [frontend-design actif]
        Génère HTML/CSS avec design distinctif

# Étape 2 : Tester localement
Vous: "Lance un serveur local et teste la page"

Claude: [webapp-testing actif]
        python -m http.server 8000
        Tests Playwright, screenshots

# Étape 3 : Créer présentation
Vous: "Crée une présentation PowerPoint avec screenshots
      et description technique"

Claude: [pptx actif]
        Génère presentation.pptx avec slides

# Étape 4 : Déployer (si skills Hostinger installés)
Vous: "Déploie sur mon VPS Hostinger"

Claude: [hostinger-deployment actif]
        Rsync → VPS → Nginx config → Live
```

### Exemple 2: Créer un MCP Server Complet

```plaintext
# Étape 1 : Créer le serveur
Vous: "Crée un serveur MCP pour l'API Todoist avec
      support des tâches et projets"

Claude: [mcp-builder actif]
        Phase 1 : Recherche API Todoist
        Phase 2 : Design tools (list_tasks, create_task, etc.)
        Phase 3 : Code FastMCP
        Phase 4 : Tests

# Étape 2 : Documenter
Vous: "Crée un document Word avec la documentation technique"

Claude: [docx actif]
        Documentation.docx avec architecture, setup, exemples

# Étape 3 : Présenter
Vous: "Présentation PowerPoint pour l'équipe technique"

Claude: [pptx actif]
        Présentation technique avec code examples
```

### Exemple 3: Créer Votre Propre Skill

```plaintext
Vous: "Je veux créer un skill pour générer automatiquement
      mes rapports hebdomadaires avec des données de GitHub
      et Linear. Guide-moi avec Skill Chaining complet."

Claude: [skill-creator-pro actif]

Step 1 - Understanding:
"Pouvez-vous donner un exemple de rapport hebdomadaire ?"

Step 2 - Planning:
- scripts/fetch_github_data.py
- scripts/fetch_linear_data.py
- templates/weekly_report.xlsx
- references/github_api.md

Step 3 - Initialize:
Génère structure skill

Step 4 - Edit + Skill Chaining:
SKILL.md complet avec :
- Input Expected : GitHub token, Linear API key
- Output Produced : weekly_report_YYYY-MM-DD.xlsx
- Compatible Skills After : pptx (présentation), docx (format Word)

Step 5 - Package:
Validation et weekly-report-generator.zip

Step 6 - Iterate:
Score qualité, améliorations suggérées
```

---

## Résumé - Quick Reference

| Skill | Trigger Keywords | Usage Type |
|-------|-----------------|------------|
| frontend-design | "landing page", "UI", "dashboard" | Auto |
| mcp-builder | "MCP server", "intégrer API" | Auto |
| webapp-testing | "teste localhost", "screenshot" | Auto |
| pptx | "présentation", "PowerPoint", "slides" | Auto |
| xlsx | "Excel", "spreadsheet", "formules" | Auto |
| docx | "Word", "document", "contrat" | Auto |
| pdf | "PDF", "fusionner", "extraire texte" | Auto |
| canvas-design | "poster", "infographic", "visual" | Auto |
| web-artifacts-builder | "prototype", "démo rapide", "outil" | Auto |
| skill-creator | "créer un skill" | Explicite |
| skill-creator-pro | "skill avec Skill Chaining" | Explicite |
| hostinger-* | "déploie sur VPS", "SSH Hostinger" | Auto |

**Invocation** :
- **Auto** : Mentionnez les keywords dans votre demande
- **Explicite** : Utilisez `/skill-name` ou "En utilisant le skill..."

---

**Fichier créé** : `HOW_TO_USE_SKILLS.md`
**Prochaine étape** : Testez vos skills dans un projet réel ! 🚀
