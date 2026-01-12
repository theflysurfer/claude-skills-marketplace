#!/usr/bin/env node
/**
 * YAML Parser - Wrapper around js-yaml with manual fallback.
 *
 * Pattern from discover-skills.py lines 44-90.
 * Provides robust YAML frontmatter parsing for SKILL.md files.
 */

const yaml = require('js-yaml');

/**
 * Extract YAML frontmatter from markdown content.
 * Uses js-yaml with fallback to manual parser for edge cases.
 *
 * @param {string} content - Markdown content with YAML frontmatter
 * @returns {object} Parsed YAML data or empty object if no frontmatter
 */
function extractYaml(content) {
    // Handle both LF (\n) and CRLF (\r\n) line endings
    const match = content.match(/^---\r?\n(.*?)\r?\n---/s);
    if (!match) {
        return {};
    }

    try {
        return yaml.load(match[1]) || {};
    } catch (e) {
        // Fallback to manual parser if js-yaml fails
        return extractYamlManual(content);
    }
}

/**
 * Manual YAML parser for simple frontmatter.
 * Handles basic YAML structures when js-yaml fails.
 *
 * Pattern from discover-skills.py lines 44-76.
 *
 * @param {string} content - Markdown content
 * @returns {object} Parsed YAML data
 */
function extractYamlManual(content) {
    // Handle both LF (\n) and CRLF (\r\n) line endings
    const match = content.match(/^---\r?\n(.*?)\r?\n---/s);
    if (!match) {
        return {};
    }

    const yamlContent = match[1];
    const result = {};
    let currentList = null;

    // Split on both \r\n and \n
    for (const line of yamlContent.split(/\r?\n/)) {
        if (!line.trim()) {
            continue;
        }

        // Handle list items
        if (line.startsWith('  - ')) {
            if (currentList !== null) {
                const value = line.slice(4).trim().replace(/^["']|["']$/g, '');
                currentList.push(value);
            }
            continue;
        }

        // Handle key-value pairs
        if (line.includes(':') && !line.startsWith(' ')) {
            const [key, ...valueParts] = line.split(':');
            const keyTrimmed = key.trim();
            const valueTrimmed = valueParts.join(':').trim();

            if (valueTrimmed) {
                // Scalar value
                result[keyTrimmed] = valueTrimmed.replace(/^["']|["']$/g, '');
                currentList = null;
            } else {
                // List value (next lines will be list items)
                result[keyTrimmed] = [];
                currentList = result[keyTrimmed];
            }
        }
    }

    return result;
}

/**
 * Extract content summary from SKILL.md content.
 * Pattern from discover-skills.py lines 93-116.
 *
 * @param {string} content - Markdown content
 * @param {number} maxLength - Maximum summary length (default: 500)
 * @returns {string} Content summary
 */
function extractContentSummary(content, maxLength = 500) {
    // Remove YAML frontmatter (handle both LF and CRLF)
    const contentWithoutFm = content.replace(/^---\r?\n.*?\r?\n---\r?\n?/s, '');

    // Remove code blocks
    let contentClean = contentWithoutFm.replace(/```[\s\S]*?```/g, '');

    // Remove inline code
    contentClean = contentClean.replace(/`[^`]+`/g, '');

    // Extract headers
    const headers = contentClean.match(/^##+ (.+)$/gm) || [];
    const headerTexts = headers.map(h => h.replace(/^##+ /, ''));

    // Extract paragraphs (split on both \n\n and \r\n\r\n)
    const paragraphs = contentClean.split(/(?:\r?\n){2,}/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    const firstPara = paragraphs[0] || '';

    // Build summary
    const summaryParts = [];

    // Add meaningful headers
    if (headerTexts.length > 0) {
        const meaningful = headerTexts.filter(h =>
            h.length > 3 &&
            !['usage', 'installation', 'configuration', 'examples', 'notes'].includes(h.toLowerCase())
        );
        if (meaningful.length > 0) {
            summaryParts.push(meaningful.slice(0, 5).join(' | '));
        }
    }

    // Add first paragraph
    if (firstPara) {
        // Remove markdown links
        let cleaned = firstPara.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        // Remove bold/italic
        cleaned = cleaned.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1');
        summaryParts.push(cleaned.slice(0, 300));
    }

    const summary = summaryParts.join(' ');
    return summary.slice(0, maxLength);
}

module.exports = {
    extractYaml,
    extractYamlManual,
    extractContentSummary
};
