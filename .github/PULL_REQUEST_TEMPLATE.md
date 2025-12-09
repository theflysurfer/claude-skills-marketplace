# Pull Request

## Description

<!-- Provide a brief description of the changes -->

## Type of Change

- [ ] New skill/plugin
- [ ] Bug fix
- [ ] Enhancement to existing skill
- [ ] Documentation update
- [ ] Infrastructure/CI improvement
- [ ] Other (please describe):

## Checklist

### For New Skills

- [ ] Skill follows naming convention (kebab-case)
- [ ] SKILL.md includes YAML frontmatter with required fields
- [ ] Description is clear and concise (20-200 characters)
- [ ] Category is appropriate
- [ ] Keywords/tags added (3-8 relevant tags)
- [ ] Version specified (semver format)
- [ ] License specified
- [ ] Documentation includes usage examples
- [ ] Added to .claude-plugin/marketplace.json

### General

- [ ] Code follows project style guidelines
- [ ] Self-review of code completed
- [ ] Documentation updated (if applicable)
- [ ] Tests pass locally
- [ ] `python scripts/validate-marketplace.py` passes
- [ ] No sensitive information (credentials, API keys) included

## Testing

<!-- Describe how you tested these changes -->

```bash
# Commands used to test
python scripts/validate-marketplace.py
python scripts/list-resources-v2.py --search <skill-name>
```

## Screenshots (if applicable)

<!-- Add screenshots to help explain your changes -->

## Related Issues

<!-- Link any related issues: Fixes #123, Closes #456 -->

## Additional Notes

<!-- Any additional information or context -->

---

### For Reviewers

- [ ] Marketplace validation passes
- [ ] Skill metadata is complete
- [ ] No security concerns
- [ ] Documentation is clear
