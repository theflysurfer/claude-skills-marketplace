---
name: julien-ref-doc-production
description: Documentation production methodology with DRY principles. Covers 8 document types (GUIDE, INCIDENT, SESSION, AUDIT, RECHERCHE, etc.), naming conventions, and YAML metadata.
triggers:
  - comment documenter mon projet
  - aide-moi à structurer ma doc
  - je veux écrire la doc
  - modèle de document
  - écrire un rapport
  - how to document my project
  - help me write documentation
  - project documentation guide
  - create documentation
  - incident report
  - session report
  - guide template
---

# Documentation Production Methodology

> **Version**: 2.0.0-DRY

---

## Principles

## Observability

**First**: At the start of execution, display:
```
🔧 Skill "julien-ref-doc-production" activated
```

1. **DRY**: Avoid duplication, use cross-references
2. **Living docs**: Update rather than create, archive obsolete
3. **Targeted audience**: Humans | LLM | All + level (1-10)
4. **Actionable**: Concrete examples, reproducible commands

---

## Structure

```
project/
├── docs/
│   ├── guides/        # Evolving docs
│   └── rapports/      # Event-based docs
└── README.md          # Index
```

---

## Naming Conventions

### EVOLVING Docs (living docs)
**Types**: GUIDE, METHODOLOGIE, AUDIT, TROUBLESHOOTING
**Name**: `[TYPE]_[subject].md` (no date)
**Timestamp**: In content, per section

**Required YAML header**:
```yaml
---
title: "Guide X"
version: X.Y.Z
created: YYYY-MM-DD
updated: YYYY-MM-DD
authors: [...]
audience: ["Humans"|"LLM"|"All"]
level: "Beginner (1-3)" | "Intermediate (4-6)" | "Expert (7-10)"
status: "Active" | "Archived" | "Draft"
tags: [...]
related: [related files]
---
```

### EVENT-BASED Docs (snapshots)
**Types**: INCIDENT, SESSION, RECHERCHE, RECOMMANDATIONS, MIGRATION, PERFORMANCE, SECURITE
**Name**: `YYYY.MM.DD_HH.mm_[commit-short]_[TYPE]_[subject].md`
**Timestamp format**: `2025.10.14_12.33` (dots + underscores)

**Required metadata**:
```markdown
## Metadata
- **Date**: YYYY-MM-DD HH:MM
- **Commit**: abc1234 (7 chars)
- **Duration**: X hours (if applicable)
```

---

## Document Types

### INCIDENT (event-based)
**When**: Blocking problem resolved

```markdown
# Incident: [Title]

## Metadata
- Date, Duration, Severity, Commit

## Summary
[2-3 sentences]

## Symptoms → Timeline → Cause → Solution → Prevention

## References
```

---

### SESSION (event-based)
**When**: Significant session (feature, refactor)

```markdown
# Session: [Title]

## Metadata
- Date, Duration, Commits

## Objective → Achievements → Decisions → Problems → Modified files → Tests → Next

## References
```

---

### GUIDE (evolving)
**When**: Reusable procedure

```markdown
---
[Complete YAML header]
---

# Guide: [Title]

## Overview → Concepts → Step-by-step → Troubleshooting → Examples → References
```

---

### AUDIT (evolving or event-based)
**When**: Pre-intervention analysis

```markdown
# Audit: [Title]

## Metadata

## Executive Summary
- Score, Risks, Recommendations

## Findings (Critical, Major, Minor)

## Prioritized recommendations → Action plan → References
```

---

### RECHERCHE (event-based)
**When**: Investigation, exploration, benchmark

```markdown
# Research: [Title]

## Metadata
- Date, Objective, Duration

## Question → Methodology → Discoveries → Options → Comparison → Recommendation → References
```

---

### RECOMMANDATIONS (event-based)
**When**: Important technical decision

```markdown
# Recommendations: [Title]

## Metadata

## Context → Evaluated options (Pros/Cons/Evaluation) → Decision matrix → Recommendation → Risks → Next
```

---

### MIGRATION (event-based)
**When**: Tech/version/infra migration

```markdown
# Migration: [Title]

## Metadata

## Objective → Before/After → Procedure → Verifications → Problems → Rollback plan → Lessons → Follow-up
```

---

### PERFORMANCE (event-based)
**When**: Measurable optimization

```markdown
# Performance: [Title]

## Metadata

## Summary → Metrics before → Optimizations → Metrics after → Charts → Recommendations → References
```

---

### SECURITE (event-based)
**When**: Security audit, vulnerabilities

```markdown
# Security Audit: [Title]

## Metadata

## Summary → Vulnerabilities (Critical/Major/Minor) → Best practices → Remediation plan → Verifications → References
```

---

## Workflow

**Create report when**:
- Session > 1h with significant changes → SESSION
- Blocking problem resolved → INCIDENT
- Investigation completed → RECHERCHE
- Technical decision → RECOMMANDATIONS
- New procedure → GUIDE (or update)
- Migration completed → MIGRATION
- Measurable optimization → PERFORMANCE
- Vulnerability found → SECURITE

**Production**:
1. Choose type
2. Use template
3. Fill all sections
4. Name correctly
5. Add metadata
6. Reference in README
7. Commit

---

## Quality Checklist

### Content
- [ ] All sections filled
- [ ] No TODO/To complete
- [ ] Commands tested
- [ ] Paths correct
- [ ] Links valid

### Form
- [ ] Naming respected
- [ ] Metadata present
- [ ] Valid Markdown
- [ ] Code blocks with language

### Context
- [ ] Audience identified
- [ ] Level adapted
- [ ] Cross-references

### Traceability
- [ ] Commits mentioned
- [ ] Files listed
- [ ] Timeline clear

---

## Related Skills

- **julien-ref-doc-review**: Use after writing to annotate and review documentation with @FIX, @TODO, @VERIFY tags
