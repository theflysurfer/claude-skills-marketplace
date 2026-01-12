/**
 * Unit tests for yaml-parser.js
 *
 * Target: 100% coverage (branches, functions, lines, statements)
 * Test count: ~12-15 tests
 */

// No external dependencies to mock for yaml-parser
const yaml = require('js-yaml');

// Import functions to test
const {
    extractYaml,
    extractYamlManual,
    extractContentSummary
} = require('../../lib/yaml-parser');

describe('yaml-parser.js - Unit Tests', () => {
    /**
     * extractYaml() tests (7 tests)
     * Parse YAML frontmatter with js-yaml and fallback
     */
    describe('extractYaml()', () => {
        test('should parse YAML with LF line endings', () => {
            const content = '---\nname: test-skill\ndescription: Test\n---\nContent';

            const result = extractYaml(content);

            expect(result.name).toBe('test-skill');
            expect(result.description).toBe('Test');
        });

        test('should parse YAML with CRLF line endings', () => {
            const content = '---\r\nname: test-skill\r\ndescription: Test\r\n---\r\nContent';

            const result = extractYaml(content);

            expect(result.name).toBe('test-skill');
            expect(result.description).toBe('Test');
        });

        test('should return empty object if no frontmatter', () => {
            const content = 'Just plain content without frontmatter';

            const result = extractYaml(content);

            expect(result).toEqual({});
        });

        test('should parse nested objects', () => {
            const content = '---\nname: test\nmetadata:\n  key1: value1\n  key2: value2\n---\nContent';

            const result = extractYaml(content);

            expect(result.name).toBe('test');
            expect(result.metadata).toEqual({
                key1: 'value1',
                key2: 'value2'
            });
        });

        test('should parse arrays', () => {
            const content = '---\nname: test\ntriggers:\n  - trigger1\n  - trigger2\n---\nContent';

            const result = extractYaml(content);

            expect(result.name).toBe('test');
            expect(result.triggers).toEqual(['trigger1', 'trigger2']);
        });

        test('should fallback to manual parser if js-yaml fails', () => {
            // Malformed YAML that js-yaml can't parse but manual parser can handle
            const content = '---\nname: test-skill\ninvalid yaml: [unclosed\n---\nContent';

            const result = extractYaml(content);

            // Manual parser should at least extract the name
            expect(result.name).toBe('test-skill');
        });

        test('should handle YAML with colons in values', () => {
            const content = '---\nname: test\nurl: https://example.com:8080/path\n---\nContent';

            const result = extractYaml(content);

            expect(result.name).toBe('test');
            expect(result.url).toBe('https://example.com:8080/path');
        });
    });

    /**
     * extractYamlManual() tests (5 tests)
     * Manual YAML parser fallback
     */
    describe('extractYamlManual()', () => {
        test('should parse simple key: value pairs', () => {
            const content = '---\nname: test-skill\ndescription: Test description\nversion: 1.0\n---\nContent';

            const result = extractYamlManual(content);

            expect(result.name).toBe('test-skill');
            expect(result.description).toBe('Test description');
            expect(result.version).toBe('1.0');
        });

        test('should parse lists with - items', () => {
            const content = '---\nname: test\ntriggers:\n  - trigger1\n  - trigger2\n  - trigger3\n---\nContent';

            const result = extractYamlManual(content);

            expect(result.name).toBe('test');
            expect(result.triggers).toEqual(['trigger1', 'trigger2', 'trigger3']);
        });

        test('should handle CRLF line endings', () => {
            const content = '---\r\nname: test-skill\r\ndescription: Test\r\n---\r\nContent';

            const result = extractYamlManual(content);

            expect(result.name).toBe('test-skill');
            expect(result.description).toBe('Test');
        });

        test('should return empty object if no frontmatter', () => {
            const content = 'No frontmatter here';

            const result = extractYamlManual(content);

            expect(result).toEqual({});
        });

        test('should ignore indented list items for nested structures', () => {
            const content = '---\nname: test\nlist:\n  - item1\n  - item2\n---\nContent';

            const result = extractYamlManual(content);

            expect(result.name).toBe('test');
            // Manual parser handles indented lists as the 'list' key
            expect(result.list).toBeDefined();
        });
    });

    /**
     * extractContentSummary() tests (5 tests)
     * Extract content summary from markdown
     */
    describe('extractContentSummary()', () => {
        test('should extract headers (##, ###)', () => {
            const content = '---\nname: test\n---\n## Usage\nSome usage info\n### Examples\nExample here';

            const result = extractContentSummary(content);

            expect(result).toContain('Usage');
            expect(result).toContain('Examples');
        });

        test('should extract first paragraph', () => {
            const content = '---\nname: test\n---\n\nThis is the first paragraph.\n\nSecond paragraph.';

            const result = extractContentSummary(content);

            expect(result).toContain('This is the first paragraph');
        });

        test('should remove code blocks', () => {
            const content = '---\nname: test\n---\n\nSummary text\n\n```javascript\ncode here\n```\n\nMore text';

            const result = extractContentSummary(content);

            expect(result).toContain('Summary text');
            expect(result).not.toContain('code here');
        });

        test('should truncate to maxLength', () => {
            const content = '---\nname: test\n---\n\n' + 'A'.repeat(2000);

            const result = extractContentSummary(content, 500);

            expect(result.length).toBeLessThanOrEqual(500);
        });

        test('should handle content without headers', () => {
            const content = '---\nname: test\n---\n\nJust plain content without any headers.';

            const result = extractContentSummary(content);

            expect(result).toContain('Just plain content');
        });

        test('should return empty string for empty content', () => {
            const content = '---\nname: test\n---\n\n';

            const result = extractContentSummary(content);

            expect(result).toBe('');
        });

        test('should handle mixed LF and CRLF', () => {
            const content = '---\r\nname: test\n---\r\n## Header\r\nContent\nMore content';

            const result = extractContentSummary(content);

            expect(result).toContain('Header');
            expect(result).toContain('Content');
        });
    });
});
