---
name: skill-creator-pro
description: Enhanced guide for creating effective skills with comprehensive Skill Chaining documentation. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations. Includes standardized format for documenting skill relationships, Input/Output specs, and visual workflows.
license: Apache-2.0
metadata:
  author: "Julien (based on Anthropic skill-creator)"
  version: "1.0.0"
  category: "development"
  enhanced: true
  additions:
    - "Comprehensive Skill Chaining documentation framework"
    - "Standardized Input/Output specification format"
    - "Visual workflow diagrams (ASCII)"
    - "Bidirectional skill relationship documentation"
    - "Git hooks integration documentation"
    - "Tools Used documentation"
    - "Concrete usage examples with real-world scenarios"
---

# Skill Creator Pro

This skill provides enhanced guidance for creating effective skills, with a focus on documenting how skills interact within larger workflows.

## About Skills

Skills are modular, self-contained packages that extend Claude's capabilities by providing
specialized knowledge, workflows, and tools. Think of them as "onboarding guides" for specific
domains or tasks—they transform Claude from a general-purpose agent into a specialized agent
equipped with procedural knowledge that no model can fully possess.

### What Skills Provide

1. Specialized workflows - Multi-step procedures for specific domains
2. Tool integrations - Instructions for working with specific file formats or APIs
3. Domain expertise - Company-specific knowledge, schemas, business logic
4. Bundled resources - Scripts, references, and assets for complex and repetitive tasks

### Anatomy of a Skill

Every skill consists of a required SKILL.md file and optional bundled resources:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation intended to be loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts, etc.)
```

#### SKILL.md (required)

**Metadata Quality:** The `name` and `description` in YAML frontmatter determine when Claude will use the skill. Be specific about what the skill does and when to use it. Use the third-person (e.g. "This skill should be used when..." instead of "Use this skill when...").

#### Bundled Resources (optional)

##### Scripts (`scripts/`)

Executable code (Python/Bash/etc.) for tasks that require deterministic reliability or are repeatedly rewritten.

- **When to include**: When the same code is being rewritten repeatedly or deterministic reliability is needed
- **Example**: `scripts/rotate_pdf.py` for PDF rotation tasks
- **Benefits**: Token efficient, deterministic, may be executed without loading into context
- **Note**: Scripts may still need to be read by Claude for patching or environment-specific adjustments

##### References (`references/`)

Documentation and reference material intended to be loaded as needed into context to inform Claude's process and thinking.

- **When to include**: For documentation that Claude should reference while working
- **Examples**: `references/finance.md` for financial schemas, `references/mnda.md` for company NDA template, `references/policies.md` for company policies, `references/api_docs.md` for API specifications
- **Use cases**: Database schemas, API documentation, domain knowledge, company policies, detailed workflow guides
- **Benefits**: Keeps SKILL.md lean, loaded only when Claude determines it's needed
- **Best practice**: If files are large (>10k words), include grep search patterns in SKILL.md
- **Avoid duplication**: Information should live in either SKILL.md or references files, not both. Prefer references files for detailed information unless it's truly core to the skill—this keeps SKILL.md lean while making information discoverable without hogging the context window. Keep only essential procedural instructions and workflow guidance in SKILL.md; move detailed reference material, schemas, and examples to references files.

##### Assets (`assets/`)

Files not intended to be loaded into context, but rather used within the output Claude produces.

- **When to include**: When the skill needs files that will be used in the final output
- **Examples**: `assets/logo.png` for brand assets, `assets/slides.pptx` for PowerPoint templates, `assets/frontend-template/` for HTML/React boilerplate, `assets/font.ttf` for typography
- **Use cases**: Templates, images, icons, boilerplate code, fonts, sample documents that get copied or modified
- **Benefits**: Separates output resources from documentation, enables Claude to use files without loading them into context

### Progressive Disclosure Design Principle

Skills use a three-level loading system to manage context efficiently:

1. **Metadata (name + description)** - Always in context (~100 words)
2. **SKILL.md body** - When skill triggers (<5k words)
3. **Bundled resources** - As needed by Claude (Unlimited*)

*Unlimited because scripts can be executed without reading into context window.

## Skill Creation Process

To create a skill, follow the "Skill Creation Process" in order, skipping steps only if there is a clear reason why they are not applicable.

### Step 1: Understanding the Skill with Concrete Examples

Skip this step only when the skill's usage patterns are already clearly understood. It remains valuable even when working with an existing skill.

To create an effective skill, clearly understand concrete examples of how the skill will be used. This understanding can come from either direct user examples or generated examples that are validated with user feedback.

For example, when building an image-editor skill, relevant questions include:

- "What functionality should the image-editor skill support? Editing, rotating, anything else?"
- "Can you give some examples of how this skill would be used?"
- "I can imagine users asking for things like 'Remove the red-eye from this image' or 'Rotate this image'. Are there other ways you imagine this skill being used?"
- "What would a user say that should trigger this skill?"

To avoid overwhelming users, avoid asking too many questions in a single message. Start with the most important questions and follow up as needed for better effectiveness.

Conclude this step when there is a clear sense of the functionality the skill should support.

### Step 2: Planning the Reusable Skill Contents

To turn concrete examples into an effective skill, analyze each example by:

1. Considering how to execute on the example from scratch
2. Identifying what scripts, references, and assets would be helpful when executing these workflows repeatedly

Example: When building a `pdf-editor` skill to handle queries like "Help me rotate this PDF," the analysis shows:

1. Rotating a PDF requires re-writing the same code each time
2. A `scripts/rotate_pdf.py` script would be helpful to store in the skill

Example: When designing a `frontend-webapp-builder` skill for queries like "Build me a todo app" or "Build me a dashboard to track my steps," the analysis shows:

1. Writing a frontend webapp requires the same boilerplate HTML/React each time
2. An `assets/hello-world/` template containing the boilerplate HTML/React project files would be helpful to store in the skill

Example: When building a `big-query` skill to handle queries like "How many users have logged in today?" the analysis shows:

1. Querying BigQuery requires re-discovering the table schemas and relationships each time
2. A `references/schema.md` file documenting the table schemas would be helpful to store in the skill

To establish the skill's contents, analyze each concrete example to create a list of the reusable resources to include: scripts, references, and assets.

### Step 3: Initializing the Skill

At this point, it is time to actually create the skill.

Skip this step only if the skill being developed already exists, and iteration or packaging is needed. In this case, continue to the next step.

When creating a new skill from scratch, always run the `init_skill.py` script. The script conveniently generates a new template skill directory that automatically includes everything a skill requires, making the skill creation process much more efficient and reliable.

Usage:

```bash
scripts/init_skill.py <skill-name> --path <output-directory>
```

The script:

- Creates the skill directory at the specified path
- Generates a SKILL.md template with proper frontmatter and TODO placeholders
- Creates example resource directories: `scripts/`, `references/`, and `assets/`
- Adds example files in each directory that can be customized or deleted

After initialization, customize or remove the generated SKILL.md and example files as needed.

### Step 4: Edit the Skill

When editing the (newly-generated or existing) skill, remember that the skill is being created for another instance of Claude to use. Focus on including information that would be beneficial and non-obvious to Claude. Consider what procedural knowledge, domain-specific details, or reusable assets would help another Claude instance execute these tasks more effectively.

#### Start with Reusable Skill Contents

To begin implementation, start with the reusable resources identified above: `scripts/`, `references/`, and `assets/` files. Note that this step may require user input. For example, when implementing a `brand-guidelines` skill, the user may need to provide brand assets or templates to store in `assets/`, or documentation to store in `references/`.

Also, delete any example files and directories not needed for the skill. The initialization script creates example files in `scripts/`, `references/`, and `assets/` to demonstrate structure, but most skills won't need all of them.

#### Update SKILL.md

**Writing Style:** Write the entire skill using **imperative/infinitive form** (verb-first instructions), not second person. Use objective, instructional language (e.g., "To accomplish X, do Y" rather than "You should do X" or "If you need to do X"). This maintains consistency and clarity for AI consumption.

To complete SKILL.md, answer the following questions:

1. What is the purpose of the skill, in a few sentences?
2. When should the skill be used?
3. In practice, how should Claude use the skill? All reusable skill contents developed above should be referenced so that Claude knows how to use them.

#### Document Skill Chaining (Critical)

Skills rarely work in isolation. **Always document how this skill interacts with other skills** using a standardized chaining format. This is critical for workflow understanding and skill discoverability.

Add a **"Skill Chaining"** section at the end of SKILL.md with these subsections:

**1. Skills Required Before**
- List prerequisite skills with level: (obligatoire|recommandé|optionnel)
- Explain why each is needed
- Or state "None (entry point skill)" if this is the first in a workflow

**2. Input Expected**
- Precise format (file path, URL, Git state, environment variable, etc.)
- Environment prerequisites (Node.js version, SSH access, etc.)
- Required configuration (config files, API keys, etc.)

**3. Output Produced**
- Precise format (file path, deployed URL, report format, etc.)
- Side effects (git commits, VPS modifications, file deletions, etc.)
- Estimated duration (helps users set expectations)

**4. Compatible Skills After**
Group by priority:
- **Obligatoires**: Must follow this skill (workflow breaks without them)
- **Recommandés**: Should follow for best results
- **Optionnels**: Can follow in some scenarios

For each, briefly explain what it adds/does next.

**5. Called By**
Document bidirectionally:
- Parent skills that invoke this one (with context)
- Git hooks that trigger this skill (e.g., pre-push.sh, post-merge.sh)
- Direct user invocation scenarios (e.g., "Manual deployment override")

**6. Tools Used**
- List Claude Code tools with brief usage: `ToolName (usage: description)`
- Examples: `Bash (usage: git commands, npm scripts)`, `Edit (usage: modify ecosystem.config.cjs)`

**7. Visual Workflow**
ASCII diagram showing skill position in workflow:
```
[Previous Skill or User action]
    ↓
[THIS SKILL]
    ├─► Action 1
    ├─► Action 2
    └─► Action 3
    ↓
[Possible Next Skills]
    ├─► Skill A (if condition X)
    ├─► Skill B (recommended)
    └─► Skill C (optional)
```

**8. Usage Example**
Provide at least one concrete scenario:
- **Scenario**: Real-world situation description
- **Command/Invocation**: Exact command or how user triggers it
- **Result**: Expected outcome with specifics (URL, file path, duration)

**Example Skill Chaining Section:**

```markdown
## 🔗 Skill Chaining

### Skills Required Before
- **local-testing** (recommandé): Validates code locally before deployment to avoid deploying broken code

### Input Expected
- Git branch ready to deploy: `main` (production) or `staging` (preview)
- Code validated via **local-testing**: build succeeded, TypeScript check passed
- SSH access to VPS configured: `automation@69.62.108.82`
- File: `ecosystem.config.cjs` exists on VPS (not committed to Git)

### Output Produced
- **Format**: Application deployed and running on VPS
- **Side effects**:
  - PM2 process restarted (`incluzhact` or `incluzhact-preview`)
  - New Git commit checked out on VPS
  - npm dependencies installed/updated
  - Production build generated in `/var/www/incluzhact/dist/`
- **Duration**: 2-3 minutes (rsync 30s + npm install 60s + build 60s + restart 5s)

### Compatible Skills After

**Recommandés:**
- **accessibility-audit**: Audit WCAG compliance on deployed site (important for INCLUZ'HACT)
- **image-optimization**: Optimize images if new ones were added

**Optionnels:**
- **performance-monitoring**: Check Lighthouse scores post-deployment

### Called By
- **git-workflow-manager**: During complete deployment workflows (feature → staging → main)
- **post-push.sh hook**: Automatic deployment triggered after `git push origin staging|main`
- Direct user invocation: Manual deployment when hooks are bypassed or troubleshooting

### Tools Used
- `Bash` (usage: rsync files to VPS, ssh commands, npm install/build, pm2 restart)
- `Read` (usage: verify ecosystem.config.cjs exists before deployment)
- `AskUserQuestion` (usage: confirm production deployment if risky changes detected)

### Visual Workflow

```
User: git push origin staging
    ↓
pre-push.sh hook (validation)
    ├─► npm run build
    ├─► npm run check
    └─► Detect secrets
    ↓
Push succeeds
    ↓
post-push.sh hook (optional)
    ↓
deployment-manager (this skill)
    ├─► rsync local → VPS (exclude node_modules, .git)
    ├─► SSH to VPS
    ├─► git checkout staging
    ├─► npm install --production=false
    ├─► npm run build
    └─► pm2 restart incluzhact-preview
    ↓
Site deployed on preview.incluzhact.fr
    ↓
[Optional next steps]
    ├─► accessibility-audit (recommended for INCLUZ'HACT)
    └─► performance-monitoring (optional)
```

### Usage Example

**Scenario**: Deploy a new feature to preview environment for client testing

**Command**:
```bash
git push origin staging
# Hook automatically triggers deployment
```

**Result**:
- Site updated on https://preview.incluzhact.fr
- Deployment completes in ~2-3 minutes
- PM2 logs confirm successful restart: `pm2 logs incluzhact-preview --lines 20`
- Changes visible immediately (hard refresh: Ctrl+Shift+R)
```

**Why Skill Chaining Matters:**

1. **Discoverability**: Users/Claude know which skill to use next
2. **Workflow clarity**: Shows how skills connect in larger processes
3. **Bidirectional docs**: If A calls B, both documents mention each other
4. **Debugging**: Clear Input/Output helps diagnose issues between skills
5. **Onboarding**: New users understand complete workflow, not just isolated skills

### Step 5: Packaging a Skill

Once the skill is ready, it should be packaged into a distributable zip file that gets shared with the user. The packaging process automatically validates the skill first to ensure it meets all requirements:

```bash
scripts/package_skill.py <path/to/skill-folder>
```

Optional output directory specification:

```bash
scripts/package_skill.py <path/to/skill-folder> ./dist
```

The packaging script will:

1. **Validate** the skill automatically, checking:
   - YAML frontmatter format and required fields
   - Skill naming conventions and directory structure
   - Description completeness and quality
   - File organization and resource references

2. **Package** the skill if validation passes, creating a zip file named after the skill (e.g., `my-skill.zip`) that includes all files and maintains the proper directory structure for distribution.

If validation fails, the script will report the errors and exit without creating a package. Fix any validation errors and run the packaging command again.

### Step 6: Iterate with Self-Assessment

After testing the skill, users may request improvements. Often this happens right after using the skill, with fresh context of how the skill performed.

**IMPORTANT**: Skill improvement should happen through **multiple targeted iterations**, not in a single pass. Each iteration focuses on one specific improvement area, with self-assessment before moving to the next.

#### Iterative Improvement Process

**Never attempt to fix everything at once.** Instead, follow this structured approach:

1. **Initial Self-Assessment**
   - Score the skill across key quality dimensions (see scoring rubric below)
   - Identify the 3-5 most critical gaps
   - Prioritize improvements by impact (high-impact issues first)

2. **Targeted Iteration Cycle** (repeat for each improvement area)
   - **Focus**: Choose ONE specific aspect to improve
   - **Analyze**: What exactly needs improvement and why?
   - **Implement**: Make focused changes to SKILL.md or bundled resources
   - **Test**: Use the skill on real tasks to validate improvement
   - **Re-score**: Measure improvement in that specific dimension
   - **Document**: Note what changed and why it's better

3. **When to Stop Iterating**
   - All critical issues (score <3/5) are resolved
   - User is satisfied with skill performance
   - Diminishing returns (improvements become marginal)

#### Quality Assessment Rubric

Score each dimension from 1-5, then calculate average:

| Dimension | 1 (Poor) | 3 (Good) | 5 (Excellent) |
|-----------|----------|----------|---------------|
| **Clarity** | Vague, ambiguous instructions | Clear workflow, some details missing | Crystal clear, no ambiguity |
| **Completeness** | Missing critical steps/resources | Covers main use cases | Handles edge cases, errors |
| **Discoverability** | Hard to know when to use skill | Description mentions key scenarios | Name + description trigger appropriately |
| **Context Efficiency** | Bloated SKILL.md (>5k words) | Reasonable length, some verbosity | Lean SKILL.md, references for details |
| **Actionability** | Theoretical, no concrete steps | Step-by-step workflow provided | Checklist-style, copy-paste ready |
| **Resource Organization** | Missing bundled resources or all in SKILL.md | Good separation scripts/refs/assets | Optimal progressive disclosure |
| **Examples** | No examples or only abstract ones | 1-2 concrete examples | Multiple examples covering scenarios |
| **Skill Chaining** | No relationship to other skills documented | Mentions related skills | Full Input/Output/Dependencies documented |
| **Error Handling** | No guidance on failures | Basic troubleshooting | Comprehensive error scenarios |

**Average Score Interpretation:**
- **1.0-2.4**: Skill needs major rework before use
- **2.5-3.4**: Functional but significant improvements needed
- **3.5-4.4**: Good skill, minor refinements recommended
- **4.5-5.0**: Excellent skill, ready for production

#### Example Iteration Plan

After initial assessment showing:
- Clarity: 4/5
- Completeness: 3/5 (missing error handling)
- Discoverability: 2/5 (poor description)
- Context Efficiency: 4/5
- Actionability: 3/5 (lacks checklists)
- Resource Organization: 5/5
- Examples: 2/5 (no concrete examples)
- Skill Chaining: 1/5 (not documented)
- Error Handling: 2/5 (minimal)
- **Average: 2.9/5** (Functional but needs improvement)

**Iteration 1 - Critical Fix: Discoverability (2/5 → 5/5)**
- **Problem**: Description too generic ("Handles deployment tasks")
- **Fix**: Rewrite to be specific: "Deploys React+Express apps to VPS via rsync + PM2 restart. Use when pushing to staging/main branches for auto-deployment to preview.incluzhact.fr or incluzhact.fr"
- **Result**: Score improved to 5/5, skill now triggers appropriately

**Iteration 2 - High Impact: Skill Chaining (1/5 → 5/5)**
- **Problem**: No documentation of relationships to other skills
- **Fix**: Add comprehensive "Skill Chaining" section with Input/Output/Dependencies/Visual workflow
- **Result**: Score improved to 5/5, users understand workflow context

**Iteration 3 - Medium Impact: Examples (2/5 → 4/5)**
- **Problem**: Only abstract descriptions, no concrete usage scenarios
- **Fix**: Add 3 real-world examples with exact commands and expected output
- **Result**: Score improved to 4/5, much clearer usage

**Iteration 4 - Medium Impact: Completeness (3/5 → 4/5)**
- **Problem**: Missing error scenarios (SSH fails, build fails, PM2 down)
- **Fix**: Add "Troubleshooting" section with common errors and solutions
- **Result**: Score improved to 4/5, handles real-world issues

**Final Score: 4.5/5** (Excellent, ready for production)

#### Common Improvement Areas by Iteration

**First iteration typically addresses:**
- Discoverability (name/description triggers appropriately)
- Critical missing steps that cause skill to fail

**Second iteration typically addresses:**
- Skill chaining documentation (relationships to other skills)
- Resource organization (move details to references/)

**Third iteration typically addresses:**
- Concrete examples (real scenarios with exact commands)
- Error handling (troubleshooting common failures)

**Fourth+ iterations address:**
- Edge cases and advanced scenarios
- Performance optimizations (reducing token usage)
- Polish (formatting, consistency, readability)
