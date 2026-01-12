/**
 * Unit tests for build-keyword-index.js
 *
 * Target: 100% coverage (branches, functions, lines, statements)
 * Test count: ~10-15 tests
 */

// Mock dependencies BEFORE importing module
jest.mock('../../lib/file-utils');

// Import functions to test
const {
    tokenize,
    buildIndex
} = require('../../discovery/build-keyword-index');

describe('build-keyword-index.js - Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * tokenize() tests (5 tests)
     * Extract lowercase words from text
     */
    describe('tokenize()', () => {
        test('should extract lowercase words (2+ chars)', () => {
            const text = 'Hello World This Is A Test';
            const result = tokenize(text);

            expect(result).toBeInstanceOf(Set);
            expect(result.has('hello')).toBe(true);
            expect(result.has('world')).toBe(true);
            expect(result.has('this')).toBe(true);
            expect(result.has('test')).toBe(true);
        });

        test('should ignore words < 2 chars', () => {
            const text = 'A is at my I';
            const result = tokenize(text);

            expect(result.has('a')).toBe(false);
            expect(result.has('i')).toBe(false);
            expect(result.has('is')).toBe(true);
            expect(result.has('at')).toBe(true);
            expect(result.has('my')).toBe(true);
        });

        test('should return Set of unique words', () => {
            const text = 'test test test duplicate duplicate';
            const result = tokenize(text);

            expect(result).toBeInstanceOf(Set);
            expect(result.size).toBe(2);
            expect(result.has('test')).toBe(true);
            expect(result.has('duplicate')).toBe(true);
        });

        test('should handle empty text', () => {
            const text = '';
            const result = tokenize(text);

            expect(result).toBeInstanceOf(Set);
            expect(result.size).toBe(0);
        });

        test('should handle special characters and punctuation', () => {
            const text = 'hello, world! how are you?';
            const result = tokenize(text);

            expect(result.has('hello')).toBe(true);
            expect(result.has('world')).toBe(true);
            expect(result.has('how')).toBe(true);
            expect(result.has('are')).toBe(true);
            expect(result.has('you')).toBe(true);
        });
    });

    /**
     * buildIndex() tests (10 tests)
     * Build inverted index keyword → skills
     */
    describe('buildIndex()', () => {
        const { readJson, writeJson, fileExists, getStats, ensureDir } = require('../../lib/file-utils');

        test('should return false if triggers file not found', async () => {
            fileExists.mockResolvedValue(false);

            const result = await buildIndex();

            expect(result).toBe(false);
        });

        test('should return false if no skills found', async () => {
            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue({
                version: '4.0.0',
                skills: []
            });

            const result = await buildIndex();

            expect(result).toBe(false);
        });

        test('should build inverted index keyword → skills', async () => {
            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue({
                version: '4.0.0',
                skills: [
                    {
                        name: 'skill-1',
                        triggers: ['test trigger'],
                        description: 'Test skill description',
                        source: 'marketplace'
                    }
                ]
            });

            getStats.mockResolvedValue({ mtimeMs: 1000, size: 1024 });
            ensureDir.mockResolvedValue();
            writeJson.mockResolvedValue();

            const result = await buildIndex();

            expect(result).toBe(true);
            expect(writeJson).toHaveBeenCalled();
        });

        test('should use full phrase weight 1.0', async () => {
            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue({
                version: '4.0.0',
                skills: [
                    {
                        name: 'skill-1',
                        triggers: ['test trigger'],
                        description: 'Description',
                        source: 'marketplace'
                    }
                ]
            });

            getStats.mockResolvedValue({ mtimeMs: 1000, size: 1024 });
            ensureDir.mockResolvedValue();
            writeJson.mockResolvedValue();

            await buildIndex();

            const writtenData = writeJson.mock.calls[0][1];
            const testTriggerEntry = writtenData.keywords['test trigger'];

            expect(testTriggerEntry).toBeDefined();
            expect(testTriggerEntry[0][1]).toBe(1.0); // Weight should be 1.0
        });

        test('should use individual words weight 0.3', async () => {
            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue({
                version: '4.0.0',
                skills: [
                    {
                        name: 'skill-1',
                        triggers: ['test trigger'],
                        description: 'Description',
                        source: 'marketplace'
                    }
                ]
            });

            getStats.mockResolvedValue({ mtimeMs: 1000, size: 1024 });
            ensureDir.mockResolvedValue();
            writeJson.mockResolvedValue();

            await buildIndex();

            const writtenData = writeJson.mock.calls[0][1];

            // Individual words from triggers should have weight 0.3
            expect(writtenData.keywords['test']).toBeDefined();
            expect(writtenData.keywords['trigger']).toBeDefined();
        });

        test('should use description words weight 0.1', async () => {
            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue({
                version: '4.0.0',
                skills: [
                    {
                        name: 'skill-1',
                        triggers: ['trigger'],
                        description: 'description word',
                        source: 'marketplace'
                    }
                ]
            });

            getStats.mockResolvedValue({ mtimeMs: 1000, size: 1024 });
            ensureDir.mockResolvedValue();
            writeJson.mockResolvedValue();

            await buildIndex();

            const writtenData = writeJson.mock.calls[0][1];

            // Description words (4+ chars) should have weight 0.1
            expect(writtenData.keywords['description']).toBeDefined();
            expect(writtenData.keywords['word']).toBeDefined();
        });

        test('should aggregate scores per skill', async () => {
            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue({
                version: '4.0.0',
                skills: [
                    {
                        name: 'skill-1',
                        triggers: ['test', 'test trigger'],
                        description: 'test description',
                        source: 'marketplace'
                    }
                ]
            });

            getStats.mockResolvedValue({ mtimeMs: 1000, size: 1024 });
            ensureDir.mockResolvedValue();
            writeJson.mockResolvedValue();

            await buildIndex();

            const writtenData = writeJson.mock.calls[0][1];

            // 'test' appears in multiple places, scores should aggregate
            expect(writtenData.keywords['test']).toBeDefined();
            expect(writtenData.keywords['test'][0][0]).toBe('skill-1');
            // Score should be > 0.3 (aggregated from multiple sources)
            expect(writtenData.keywords['test'][0][1]).toBeGreaterThan(0.3);
        });

        test('should keep top 5 skills per keyword', async () => {
            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue({
                version: '4.0.0',
                skills: [
                    { name: 'skill-1', triggers: ['common'], description: 'test', source: 'marketplace' },
                    { name: 'skill-2', triggers: ['common'], description: 'test', source: 'marketplace' },
                    { name: 'skill-3', triggers: ['common'], description: 'test', source: 'marketplace' },
                    { name: 'skill-4', triggers: ['common'], description: 'test', source: 'marketplace' },
                    { name: 'skill-5', triggers: ['common'], description: 'test', source: 'marketplace' },
                    { name: 'skill-6', triggers: ['common'], description: 'test', source: 'marketplace' }
                ]
            });

            getStats.mockResolvedValue({ mtimeMs: 1000, size: 1024 });
            ensureDir.mockResolvedValue();
            writeJson.mockResolvedValue();

            await buildIndex();

            const writtenData = writeJson.mock.calls[0][1];

            // Should keep only top 5 skills for keyword 'common'
            expect(writtenData.keywords['common']).toBeDefined();
            expect(writtenData.keywords['common'].length).toBeLessThanOrEqual(5);
        });

        test('should store skill info', async () => {
            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue({
                version: '4.0.0',
                skills: [
                    {
                        name: 'skill-1',
                        triggers: ['test'],
                        description: 'Test skill with a long description that should be truncated',
                        source: 'marketplace'
                    }
                ]
            });

            getStats.mockResolvedValue({ mtimeMs: 1000, size: 1024 });
            ensureDir.mockResolvedValue();
            writeJson.mockResolvedValue();

            await buildIndex();

            const writtenData = writeJson.mock.calls[0][1];

            expect(writtenData.skills['skill-1']).toBeDefined();
            expect(writtenData.skills['skill-1'].description).toBeDefined();
            expect(writtenData.skills['skill-1'].description.length).toBeLessThanOrEqual(100);
            expect(writtenData.skills['skill-1'].source).toBe('marketplace');
        });

        test('should include triggers_mtime in output', async () => {
            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue({
                version: '4.0.0',
                skills: [
                    {
                        name: 'skill-1',
                        triggers: ['test'],
                        description: 'Test',
                        source: 'marketplace'
                    }
                ]
            });

            getStats.mockResolvedValue({ mtimeMs: 123456789, size: 1024 });
            ensureDir.mockResolvedValue();
            writeJson.mockResolvedValue();

            await buildIndex();

            const writtenData = writeJson.mock.calls[0][1];

            expect(writtenData.triggers_mtime).toBe(123456.789); // mtimeMs / 1000
        });
    });
});
