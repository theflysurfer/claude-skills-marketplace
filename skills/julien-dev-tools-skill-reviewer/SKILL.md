---
name: skill-reviewer
description: Auto-évaluation et amélioration itérative des skills Claude. Use this skill when you need to review, score, and improve existing skills for quality, clarity, DRY principle compliance, and proper resource organization. Detects duplication, suggests refactoring into references/, and iterates until quality threshold is met.
license: Apache-2.0
metadata:
  author: "Julien"
  version: "1.0.0"
  category: "development"
  purpose: "meta-skill for skill quality assurance"
allowed-tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
---

# Skill Reviewer

This skill enables Claude to critically evaluate and iteratively improve skill quality through systematic self-review, scoring, and refactoring.

## Purpose

Skills often require multiple iterations to reach production quality. This skill automates the review process by:

1. **Reading** and analyzing skill structure and content
2. **Scoring** against 9 quality dimensions (from skill-creator)
3. **Identifying** violations of DRY principle and other issues
4. **Suggesting** specific improvements with examples
5. **Refactoring** content into proper hierarchy (SKILL.md → references/)
6. **Re-evaluating** after changes to measure progress
7. **Iterating** until quality threshold is reached

## When to Use This Skill

Use this skill when:
- ✅ After creating a new skill with skill-creator or skill-creator-pro
- ✅ A skill feels bloated or has duplicated content
- ✅ SKILL.md exceeds 5000 words (progressive disclosure violated)
- ✅ Multiple sections explain similar concepts
- ✅ Before packaging a skill for distribution
- ✅ When onboarding feels difficult despite good skill design
- ✅ Quality score is unknown or suspected to be low

## Core Principles

### DRY (Don't Repeat Yourself)

**Problem**: Information duplicated between SKILL.md and reference files, or within SKILL.md itself.

**Solution**: Progressive disclosure hierarchy
```
SKILL.md (lean, <5k words)
  ├─ Essential workflow instructions
  ├─ When to use this skill
  └─ Pointers to references/ for details

references/ (loaded on-demand)
  ├─ detailed-guide.md (comprehensive how-to)
  ├─ api-docs.md (API specifications)
  ├─ examples.md (concrete examples)
  └─ troubleshooting.md (error scenarios)
```

**Heuristic**: If content is mentioned in SKILL.md and detailed in references/, keep only a brief pointer in SKILL.md.

### Quality Threshold

**Minimum Production Score**: 3.5/5.0 average across 9 dimensions
**Excellence Target**: 4.5/5.0 average

## Review Process

### Step 1: Read and Parse Skill

Read the entire skill structure:

```bash
# Read main skill file
Read skills/skill-name/SKILL.md

# Discover all bundled resources
Glob skills/skill-name/**/*

# Read references if they exist
Read skills/skill-name/references/*.md
```

Parse YAML frontmatter to extract:
- `name`
- `description`
- `license`
- `allowed-tools`
- `metadata`

Analyze content structure:
- Headings hierarchy (H1, H2, H3)
- Section lengths (word count per section)
- Code blocks and examples
- Cross-references between files

### Step 2: Score Against Quality Rubric

Evaluate each dimension on 1-5 scale:

#### 1. Clarity (1-5)

**5 (Excellent)**: Crystal clear, no ambiguity, step-by-step instructions
**3 (Good)**: Clear workflow, some details missing or vague
**1 (Poor)**: Vague, confusing, ambiguous instructions

**Check for**:
- Clear objective stated upfront
- Unambiguous terminology
- Step-by-step workflow with numbered steps
- Examples clarify instructions

**Red flags**:
- ❌ "Do something appropriate"
- ❌ "Handle this as needed"
- ❌ Multiple interpretations possible
- ❌ Unclear what "this" or "it" refers to

#### 2. Completeness (1-5)

**5 (Excellent)**: Covers all scenarios, edge cases, error handling
**3 (Good)**: Covers main use cases, some edge cases missing
**1 (Poor)**: Missing critical steps or error scenarios

**Check for**:
- All workflow steps documented
- Error handling for common failures
- Edge cases addressed
- Prerequisites clearly stated

**Red flags**:
- ❌ "Assume X works"
- ❌ No error handling mentioned
- ❌ Critical steps skipped
- ❌ "And then it's done" (missing intermediate steps)

#### 3. Discoverability (1-5)

**5 (Excellent)**: Name + description trigger appropriately for all relevant scenarios
**3 (Good)**: Description mentions key scenarios but misses some
**1 (Poor)**: Hard to know when to use, poor description

**Check for**:
- Description includes trigger keywords
- Use cases clearly stated
- Third-person description format
- Examples of when to invoke

**Red flags**:
- ❌ Generic description: "Helps with tasks"
- ❌ No usage scenarios mentioned
- ❌ Name doesn't reflect purpose
- ❌ Missing "Use when..." guidance

#### 4. Context Efficiency (1-5)

**5 (Excellent)**: Lean SKILL.md (<3k words), details in references/
**3 (Good)**: Reasonable length (3-5k words), some verbosity
**1 (Poor)**: Bloated SKILL.md (>7k words), no references/

**Check for**:
- SKILL.md word count
- Appropriate use of references/
- Progressive disclosure respected
- No duplicated content

**Red flags**:
- ❌ SKILL.md >5000 words
- ❌ Long examples in main file (should be in references/examples.md)
- ❌ API docs in SKILL.md (should be in references/api-docs.md)
- ❌ Same information in SKILL.md and references/

#### 5. Actionability (1-5)

**5 (Excellent)**: Checklist-style, copy-paste ready, clear actions
**3 (Good)**: Step-by-step but requires adaptation
**1 (Poor)**: Theoretical, no concrete steps

**Check for**:
- Imperative verbs (verb-first instructions)
- Concrete commands/code provided
- Checklist format where appropriate
- Clear "do this, then that" flow

**Red flags**:
- ❌ "You might want to consider..."
- ❌ Theoretical explanations without steps
- ❌ No concrete examples
- ❌ "Figure out how to..."

#### 6. Resource Organization (1-5)

**5 (Excellent)**: Optimal progressive disclosure, scripts/references/assets well-separated
**3 (Good)**: Good separation, minor organization issues
**1 (Poor)**: Missing bundled resources or all content in SKILL.md

**Check for**:
- `scripts/` for executable code
- `references/` for documentation
- `assets/` for templates/media
- Proper separation of concerns

**Red flags**:
- ❌ Python code in SKILL.md (should be scripts/)
- ❌ Long API docs in SKILL.md (should be references/)
- ❌ Templates in SKILL.md (should be assets/)
- ❌ All content in single file

#### 7. Examples (1-5)

**5 (Excellent)**: Multiple concrete examples covering different scenarios
**3 (Good)**: 1-2 concrete examples
**1 (Poor)**: No examples or only abstract ones

**Check for**:
- Concrete, realistic examples
- Examples cover different use cases
- Copy-paste ready code/commands
- Expected output shown

**Red flags**:
- ❌ "For example, something like X"
- ❌ Placeholder examples (foo, bar, baz)
- ❌ Abstract examples without real context
- ❌ No examples at all

#### 8. Skill Chaining (1-5)

**5 (Excellent)**: Full Input/Output/Dependencies/Visual workflow documented
**3 (Good)**: Mentions related skills, basic workflow
**1 (Poor)**: No relationship to other skills documented

**Check for**:
- Skills Required Before
- Input Expected (precise format)
- Output Produced (format, side effects, duration)
- Compatible Skills After
- Called By (bidirectional)
- Tools Used
- Visual Workflow diagram
- Usage Example

**Red flags**:
- ❌ No mention of other skills
- ❌ Input/output format unclear
- ❌ No workflow context
- ❌ Skill appears isolated

#### 9. Error Handling (1-5)

**5 (Excellent)**: Comprehensive error scenarios with solutions
**3 (Good)**: Basic troubleshooting provided
**1 (Poor)**: No guidance on failures

**Check for**:
- Common errors documented
- Error messages explained
- Solutions/workarounds provided
- Validation steps before critical operations

**Red flags**:
- ❌ "If it fails, debug it"
- ❌ No error scenarios mentioned
- ❌ No troubleshooting section
- ❌ Assumes everything works

### Step 3: Calculate Average Score

```
Average = (Clarity + Completeness + Discoverability + Context Efficiency +
           Actionability + Resource Organization + Examples +
           Skill Chaining + Error Handling) / 9
```

**Score Interpretation**:
- **1.0-2.4**: Skill needs major rework before use
- **2.5-3.4**: Functional but significant improvements needed
- **3.5-4.4**: Good skill, minor refinements recommended
- **4.5-5.0**: Excellent skill, ready for production

### Step 4: Identify Specific Issues

For each dimension scoring <4/5, document **specific** problems with **line references**:

**Format**:
```markdown
## Issue: [Dimension] - Score X/5

**Location**: SKILL.md lines Y-Z

**Problem**: [Specific issue description]

**Example**:
[Quote the problematic section]

**Impact**: [How this affects skill quality]

**Suggested Fix**: [Concrete improvement]
```

**Common Issue Patterns**:

#### DRY Violations

**Pattern**: Same content in multiple places

```markdown
## Issue: DRY Violation - Context Efficiency 2/5

**Location**:
- SKILL.md lines 45-120 (API documentation)
- references/api-docs.md (same content duplicated)

**Problem**: API reference duplicated between SKILL.md and references/

**Suggested Fix**:
1. Keep only high-level overview in SKILL.md (5-10 lines)
2. Add pointer: "For complete API reference, see references/api-docs.md"
3. Move detailed docs to references/ only
```

#### Bloated SKILL.md

**Pattern**: SKILL.md >5000 words

```markdown
## Issue: Bloated Main File - Context Efficiency 2/5

**Location**: SKILL.md (7,500 words total)

**Problem**: Exceeds 5k word guideline, violates progressive disclosure

**Suggested Fix**:
1. Extract detailed examples → references/examples.md
2. Move troubleshooting → references/troubleshooting.md
3. Move API specs → references/api-reference.md
4. Keep only essential workflow in SKILL.md (~2-3k words)
```

#### Missing References Structure

**Pattern**: Everything in SKILL.md, no references/

```markdown
## Issue: No Progressive Disclosure - Resource Organization 2/5

**Location**: SKILL.md contains all content

**Problem**: No references/ directory for on-demand loading

**Suggested Fix**:
1. Create references/ directory
2. Extract sections:
   - Detailed workflow → references/detailed-guide.md
   - Examples → references/examples.md
   - API docs → references/api-reference.md
3. Update SKILL.md with pointers
```

#### Unclear Workflow

**Pattern**: No clear step-by-step process

```markdown
## Issue: Vague Instructions - Clarity 2/5

**Location**: SKILL.md lines 30-80

**Problem**: Instructions use "handle appropriately" and "do as needed"

**Current**:
"Process the input file and handle any errors appropriately"

**Suggested Fix**:
"Process the input file following these steps:
1. Validate file exists: `if [ ! -f input.txt ]; then error; fi`
2. Parse content: `python scripts/parse.py input.txt`
3. Handle errors: If parse fails with 'Invalid format', check..."
```

### Step 5: Suggest Refactoring Plan

Based on issues identified, create a **prioritized refactoring plan**:

**Template**:

```markdown
# Refactoring Plan for [skill-name]

## Current Score: X.X/5.0

## Target Score: 4.5/5.0

## Priority 1: Critical Issues (Must Fix)

### Issue 1: [Title]
- **Current State**: [Description]
- **Target State**: [What it should be]
- **Actions**:
  1. [Specific action]
  2. [Specific action]
- **Files to Create/Modify**:
  - Create: references/api-docs.md
  - Modify: SKILL.md (remove duplication, add pointer)
- **Expected Impact**: Context Efficiency 2/5 → 5/5

### Issue 2: [Title]
...

## Priority 2: High Impact Improvements

### Issue 3: [Title]
...

## Priority 3: Polish and Refinement

### Issue 4: [Title]
...
```

### Step 6: Execute Refactoring (Interactive)

**Ask user for confirmation** before making changes:

```markdown
I've identified X issues with this skill (current score: Y.Y/5.0).

Would you like me to:

A) Show the detailed refactoring plan (review first)
B) Execute Priority 1 fixes automatically
C) Walk through fixes one-by-one interactively
D) Focus on a specific dimension (e.g., just DRY violations)
```

**If user chooses B or C**, execute refactoring:

#### Example: Extract to References

**Before** (SKILL.md - 200 lines):
```markdown
## API Reference

### Endpoint: GET /users
Returns list of users...

[150 lines of API documentation]
```

**After** (SKILL.md - 10 lines):
```markdown
## API Reference

For complete API documentation including all endpoints, parameters,
and response formats, see `references/api-reference.md`.

Quick reference of main endpoints:
- GET /users - List users
- POST /users - Create user
- GET /users/{id} - Get user details
```

**New file** (references/api-reference.md):
```markdown
# API Reference

Complete documentation of all API endpoints.

## Endpoint: GET /users

Returns paginated list of users.

**URL**: `/api/v1/users`

**Parameters**:
- `page` (int, optional): Page number (default: 1)
- `limit` (int, optional): Results per page (default: 20)

[Full detailed documentation]
```

#### Example: Add Skill Chaining

**Before**: No Skill Chaining section

**After**: Add at end of SKILL.md

```markdown
## 🔗 Skill Chaining

### Skills Required Before
- **prerequisite-skill** (recommandé): Ensures X is configured

### Input Expected
- File path: `config.yaml` with valid schema
- Environment: Node.js v18+ installed
- API key: `GITHUB_TOKEN` environment variable set

### Output Produced
- **Format**: `output/report.json` with results
- **Side effects**:
  - Creates `output/` directory
  - Logs to `logs/skill-name.log`
- **Duration**: 2-5 minutes depending on data size

### Compatible Skills After
**Recommandés**:
- **reporter-skill**: Generate human-readable report from output.json
- **validator-skill**: Validate output meets requirements

### Called By
- **workflow-manager**: Part of complete deployment workflow
- Direct user invocation: Manual execution for testing

### Tools Used
- `Read` (usage: parse config.yaml)
- `Bash` (usage: git commands, npm scripts)
- `Write` (usage: generate output/report.json)

### Visual Workflow
\`\`\`
User provides config.yaml
    ↓
[THIS SKILL]
    ├─► Validate config
    ├─► Process data
    └─► Generate report
    ↓
output/report.json created
    ↓
[Optional next steps]
    ├─► reporter-skill
    └─► validator-skill
\`\`\`

### Usage Example

**Scenario**: Process user analytics data

**Command**: `/skill-name config.yaml`

**Result**:
- Report generated at `output/report.json`
- Processing completed in ~3 minutes
- Ready for reporter-skill to create presentation
```

### Step 7: Re-evaluate After Changes

After refactoring, **re-score the skill**:

1. Re-read modified files
2. Re-score all 9 dimensions
3. Calculate new average
4. Compare before/after scores

**Report format**:

```markdown
# Re-evaluation Results

## Score Improvement

| Dimension | Before | After | Change |
|-----------|--------|-------|--------|
| Clarity | 3/5 | 4/5 | +1 ✅ |
| Completeness | 3/5 | 4/5 | +1 ✅ |
| Discoverability | 4/5 | 4/5 | - |
| Context Efficiency | 2/5 | 5/5 | +3 ✅✅✅ |
| Actionability | 3/5 | 4/5 | +1 ✅ |
| Resource Organization | 2/5 | 5/5 | +3 ✅✅✅ |
| Examples | 2/5 | 4/5 | +2 ✅✅ |
| Skill Chaining | 1/5 | 5/5 | +4 ✅✅✅✅ |
| Error Handling | 2/5 | 3/5 | +1 ✅ |
| **AVERAGE** | **2.4/5** | **4.2/5** | **+1.8** ✅ |

## Status

✅ **Target reached**: 4.2/5 exceeds minimum threshold of 3.5/5
✅ **Production ready**: Skill can be packaged and distributed

## Remaining Recommendations

While the skill is now production-ready, consider these optional improvements:

1. **Error Handling** (3/5 → 4/5):
   - Add troubleshooting section in references/troubleshooting.md
   - Document common errors with solutions

2. **Examples** (4/5 → 5/5):
   - Add 2-3 more real-world examples
   - Cover edge cases in references/examples.md
```

### Step 8: Iterate if Needed

If average score is still <3.5/5:

```markdown
Current score: 3.2/5 (below production threshold)

Critical issues remaining:
1. [Issue description]
2. [Issue description]

Would you like me to:
A) Continue with next iteration of fixes
B) Focus on specific dimension (which one?)
C) Show what's blocking the score
D) Stop here and review manually
```

**Continue iterating** until:
- ✅ Average score ≥ 3.5/5 (minimum)
- ✅ No dimension scores <3/5 (critical threshold)
- ✅ User is satisfied with quality

**Safety limit**: Maximum 5 iterations to prevent infinite loops. If not converging, suggest manual review.

## Output Format

### Initial Review Report

```markdown
# Skill Review: [skill-name]

## Executive Summary

- **Overall Score**: X.X/5.0
- **Status**: [Needs major rework | Functional | Good | Excellent]
- **Recommendation**: [Action needed]
- **Estimated refactoring time**: [X iterations]

## Detailed Scores

[9-dimension table]

## Critical Issues (Priority 1)

[List of must-fix issues]

## Recommended Improvements (Priority 2)

[List of high-impact improvements]

## Optional Polish (Priority 3)

[List of nice-to-have refinements]

## Refactoring Plan

[Detailed plan with specific actions]

## Next Steps

[What to do next]
```

### Post-Refactoring Report

```markdown
# Re-evaluation: [skill-name]

## Before/After Comparison

[Score improvement table]

## Changes Made

1. ✅ [Change description]
2. ✅ [Change description]

## Files Modified

- Modified: SKILL.md (-150 lines, +50 lines)
- Created: references/api-reference.md (+200 lines)
- Created: references/examples.md (+100 lines)

## Quality Achievement

✅ Production threshold reached: 4.2/5 (target: 3.5/5)

## Remaining Opportunities

[Optional improvements]
```

## DRY Principle - Detailed Guidance

### Common Duplication Patterns

#### Pattern 1: API Documentation in Multiple Places

**Violation**:
```
SKILL.md (150 lines):
  - Full API endpoint documentation
  - Parameter descriptions
  - Response formats

references/api-docs.md (150 lines):
  - Same content duplicated
```

**Fix**:
```
SKILL.md (10 lines):
  - Brief overview: "This skill uses X API"
  - Pointer: "See references/api-docs.md for complete reference"
  - Quick examples of main endpoints

references/api-docs.md (150 lines):
  - Complete API documentation
  - All endpoints, parameters, responses
```

#### Pattern 2: Examples Scattered Throughout

**Violation**:
```
SKILL.md:
  - Section 1: Example A (30 lines)
  - Section 2: Example B (30 lines)
  - Section 3: Example C (30 lines)
  - Section 4: Example D (30 lines)
```

**Fix**:
```
SKILL.md:
  - Brief example references
  - "For detailed examples, see references/examples.md"

references/examples.md:
  - Example A (comprehensive)
  - Example B (comprehensive)
  - Example C (comprehensive)
  - Example D (comprehensive)
```

#### Pattern 3: Repeated Context/Setup Instructions

**Violation**:
```
SKILL.md:
  Step 1: "Ensure Node.js v18+ is installed..."
  Step 5: "Make sure Node.js v18+ is available..."
  Step 10: "Verify Node.js v18+ installation..."
```

**Fix**:
```
SKILL.md:
  ## Prerequisites
  - Node.js v18+
  - npm v9+

  [Then reference in steps]
  Step 1: [Assumes prerequisites met]
  Step 5: [Assumes prerequisites met]
```

### Progressive Disclosure Hierarchy

**Principle**: Information flows from general to specific, loaded on-demand

```
Level 1: SKILL.md (always loaded)
  ├─ Purpose and when to use
  ├─ High-level workflow (5-10 steps)
  └─ Pointers to references/

Level 2: references/ (loaded when Claude determines needed)
  ├─ detailed-guide.md (step-by-step with all details)
  ├─ api-reference.md (complete API docs)
  ├─ examples.md (comprehensive examples)
  ├─ troubleshooting.md (error scenarios)
  └─ advanced-usage.md (power user features)

Level 3: scripts/ (executed, not loaded into context)
  ├─ helper.py (deterministic operations)
  └─ validation.sh (automated checks)

Level 4: assets/ (used in output, not loaded)
  ├─ template.yaml
  └─ logo.png
```

**Word Count Guidelines**:
- SKILL.md: 2000-3000 words (ideal), max 5000
- Each reference file: 500-2000 words
- Total skill: unlimited (thanks to progressive disclosure)

## Error Handling Patterns

Document common errors with **actionable solutions**:

### Template

```markdown
## Troubleshooting

### Error: "ModuleNotFoundError: No module named 'X'"

**Cause**: Python package X not installed

**Solution**:
\`\`\`bash
pip install X
# Or from requirements
pip install -r scripts/requirements.txt
\`\`\`

**Prevention**: Always run prerequisites check before main workflow

### Error: "Permission denied" when writing to output/

**Cause**: Insufficient permissions for output directory

**Solution**:
\`\`\`bash
# Check permissions
ls -la output/

# Fix permissions
chmod u+w output/

# Or create directory if missing
mkdir -p output/
\`\`\`

**Prevention**: Skill should create output/ if it doesn't exist
```

## 🔗 Skill Chaining

### Skills Required Before

- **skill-creator** or **skill-creator-pro** (obligatoire): This skill reviews skills created by skill-creator
- None if reviewing an existing skill not just created

### Input Expected

- **Format**: Path to skill directory containing SKILL.md
- **Example**: `skills/my-skill/` or absolute path
- **Prerequisites**: Skill must have valid YAML frontmatter

### Output Produced

- **Format**: Review report in markdown
- **Side effects**:
  - May create `references/` directory
  - May create new .md files in references/
  - May modify SKILL.md (with user approval)
  - Creates backup before modifications: `SKILL.md.backup-YYYYMMDD-HHMMSS`
- **Duration**:
  - Initial review: 30-60 seconds
  - Refactoring iteration: 1-2 minutes
  - Full improvement cycle (3-5 iterations): 5-10 minutes

### Compatible Skills After

**Obligatoires** (if score <3.5/5):
- **skill-reviewer** (this skill): Re-run after manual fixes

**Recommandés** (if score ≥3.5/5):
- **skill-creator** package_skill.py: Package the improved skill
- **sync-personal-skills**: Deploy to ~/.claude/skills/

**Optionnels**:
- **git-workflow**: Commit improved skill
- Documentation skills (docx, pdf): Create skill documentation

### Called By

- **skill-creator-pro**: After Step 4 (Edit), before Step 5 (Package)
- Direct user invocation: "Review my skill X"
- CI/CD pipeline: Automated quality checks

### Tools Used

- `Read` (usage: read SKILL.md, references/, parse frontmatter)
- `Glob` (usage: discover all files in skill directory)
- `Grep` (usage: search for duplication patterns, word count)
- `Edit` (usage: refactor SKILL.md, fix issues)
- `Write` (usage: create references/*.md files)
- `Bash` (usage: word count via wc, backup files)

### Visual Workflow

```
User: "Review skills/my-skill"
    ↓
skill-reviewer (this skill)
    ├─► Read SKILL.md + references/
    ├─► Score 9 dimensions
    ├─► Identify issues
    └─► Generate report
    ↓
Score < 3.5/5?
    YES ↓
    ├─► Suggest refactoring plan
    ├─► Execute fixes (with approval)
    ├─► Re-evaluate
    └─► Iterate until ≥3.5/5
    NO ↓
    └─► Production ready ✅
    ↓
[Next steps]
    ├─► package_skill.py (if distributing)
    ├─► sync-personal-skills (if deploying)
    └─► git commit (if version control)
```

### Usage Example

**Scenario**: Review a newly created deployment skill

**Command**:
```plaintext
"Review the skill at skills/deployment-manager/"
```

**Process**:
1. skill-reviewer reads SKILL.md (6000 words - too long!)
2. Scores: Average 2.8/5 (below threshold)
3. Identifies issues:
   - DRY violation: API docs duplicated
   - Bloated SKILL.md (6000 words vs 3000 ideal)
   - Missing Skill Chaining section
4. Suggests refactoring:
   - Extract to references/api-reference.md
   - Extract to references/examples.md
   - Add Skill Chaining section
5. User approves: "Yes, refactor"
6. Executes changes
7. Re-evaluates: Average 4.3/5 ✅
8. Production ready!

**Result**:
- SKILL.md: 6000 → 2500 words
- Created: references/api-reference.md (2000 words)
- Created: references/examples.md (1500 words)
- Added: Skill Chaining section
- Score: 2.8/5 → 4.3/5
- Status: Production ready
- Time: ~8 minutes (3 iterations)

## Quality Assurance Checklist

Before marking a skill as production-ready, verify:

- [ ] Average score ≥ 3.5/5
- [ ] No dimension scores <3/5
- [ ] SKILL.md ≤5000 words
- [ ] Proper progressive disclosure (references/ used appropriately)
- [ ] No DRY violations detected
- [ ] Skill Chaining section present (if skill interacts with others)
- [ ] Examples are concrete and realistic
- [ ] Error handling documented
- [ ] YAML frontmatter valid
- [ ] All references/ files referenced from SKILL.md
- [ ] All scripts/ referenced from workflow instructions

## Notes

- This skill uses the same 9-dimension rubric as skill-creator for consistency
- Iterations are capped at 5 to prevent infinite loops
- Always create backups before modifying files
- User approval required before refactoring
- Scores are subjective but use consistent criteria
- DRY principle is prioritized in refactoring suggestions
