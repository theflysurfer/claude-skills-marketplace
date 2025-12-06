---
name: template-skill
description: Base template for creating a new Claude skill. Use this file as a starting point for your own skills.
license: Apache-2.0
---

# Template Skill

This file is a template for creating your own Claude skills.

## How to Use This Template

1. **Copy this folder** and rename it with your skill name (in kebab-case)
2. **Modify the YAML frontmatter** at the top of this file
3. **Replace these instructions** with your skill-specific instructions

## YAML Frontmatter Structure

### Required Fields

- **name**: Unique identifier in kebab-case
  - ✅ Good: `my-awesome-skill`
  - ❌ Bad: `My_Awesome_Skill`, `myAwesomeSkill`

- **description**: Clear and concise description
  - Explain what the skill does
  - Indicate when to use it
  - Mention typical use cases

### Optional Fields

- **license**: Skill license (e.g., `Apache-2.0`, `MIT`)
- **allowed-tools**: List of tools Claude can use
- **metadata**: Custom metadata

## Complete Frontmatter Example

```yaml
---
name: data-analyzer
description: Analyzes monthly sales data and generates reports with charts.
license: MIT
allowed-tools:
  - Read
  - Write
  - Bash
metadata:
  author: "Your Name"
  version: "1.0.0"
  category: "analysis"
---
```

## Instructions for Your Skill

After the frontmatter, write your instructions in Markdown:

### 1. Context and Objective

Explain the context in which this skill should be used.

### 2. Execution Steps

Detail the steps Claude should follow.

### 3. Examples

Provide concrete usage examples.

### 4. Expected Output Format

Describe the expected format or result.

## Additional Resources

You can include additional files:
- Python, JavaScript scripts, etc.
- Configuration files
- Document templates
- Images or diagrams

Reference these files in your instructions so Claude can use them.
