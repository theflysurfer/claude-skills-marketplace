/**
 * Unit tests for generate-triggers.js
 *
 * Target: 100% coverage (branches, functions, lines, statements)
 * Test count: ~15-20 tests
 */

// Mock dependencies BEFORE importing module
jest.mock('../../lib/file-utils');
jest.mock('../../lib/yaml-parser');
jest.mock('fast-glob');

const fg = require('fast-glob');

// Import functions to test
const {
    generateFromHybridRegistry,
    generateFromSkillFiles,
    main
} = require('../../discovery/generate-triggers');

describe('generate-triggers.js - Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * generateFromHybridRegistry() tests (8 tests)
     * Generate from hybrid-registry.json (primary mode)
     */
    describe('generateFromHybridRegistry()', () => {
        const { readJson, writeJson, fileExists } = require('../../lib/file-utils');

        test('should generate from hybrid-registry.json', async () => {
            const mockRegistry = {
                version: '2.0.0',
                skills: [
                    { name: 'skill-1', triggers: ['test'], description: 'Test skill', source: 'marketplace' },
                    { name: 'skill-2', triggers: ['demo'], description: 'Demo skill', source: 'global' }
                ]
            };

            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue(mockRegistry);
            writeJson.mockResolvedValue();

            const result = await generateFromHybridRegistry();

            expect(result).toBe(true);
            expect(writeJson).toHaveBeenCalled();
        });

        test('should filter skills without triggers', async () => {
            const mockRegistry = {
                version: '2.0.0',
                skills: [
                    { name: 'skill-1', triggers: ['test'], description: 'Test', source: 'marketplace' },
                    { name: 'skill-2', triggers: [], description: 'No triggers', source: 'global' },
                    { name: 'skill-3', description: 'No triggers field', source: 'marketplace' }
                ]
            };

            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue(mockRegistry);
            writeJson.mockResolvedValue();

            await generateFromHybridRegistry();

            const writtenData = writeJson.mock.calls[0][1];
            expect(writtenData.skills).toHaveLength(1);
            expect(writtenData.skills[0].name).toBe('skill-1');
        });

        test('should sort skills alphabetically by name', async () => {
            const mockRegistry = {
                version: '2.0.0',
                skills: [
                    { name: 'zebra-skill', triggers: ['z'], description: 'Z', source: 'marketplace' },
                    { name: 'alpha-skill', triggers: ['a'], description: 'A', source: 'global' },
                    { name: 'beta-skill', triggers: ['b'], description: 'B', source: 'marketplace' }
                ]
            };

            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue(mockRegistry);
            writeJson.mockResolvedValue();

            await generateFromHybridRegistry();

            const writtenData = writeJson.mock.calls[0][1];
            expect(writtenData.skills[0].name).toBe('alpha-skill');
            expect(writtenData.skills[1].name).toBe('beta-skill');
            expect(writtenData.skills[2].name).toBe('zebra-skill');
        });

        test('should include content_summary if present', async () => {
            const mockRegistry = {
                version: '2.0.0',
                skills: [
                    { name: 'skill-1', triggers: ['test'], description: 'Test', source: 'marketplace', summary: 'Test summary' }
                ]
            };

            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue(mockRegistry);
            writeJson.mockResolvedValue();

            await generateFromHybridRegistry();

            const writtenData = writeJson.mock.calls[0][1];
            expect(writtenData.skills[0].content_summary).toBe('Test summary');
        });

        test('should use version 4.0.0', async () => {
            const mockRegistry = {
                version: '2.0.0',
                skills: [
                    { name: 'skill-1', triggers: ['test'], description: 'Test', source: 'marketplace' }
                ]
            };

            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue(mockRegistry);
            writeJson.mockResolvedValue();

            await generateFromHybridRegistry();

            const writtenData = writeJson.mock.calls[0][1];
            expect(writtenData.version).toBe('4.0.0');
        });

        test('should return false if registry file does not exist', async () => {
            fileExists.mockResolvedValue(false);

            const result = await generateFromHybridRegistry();

            expect(result).toBe(false);
            expect(writeJson).not.toHaveBeenCalled();
        });

        test('should return false if registry has no skills', async () => {
            const mockRegistry = {
                version: '2.0.0',
                skills: []
            };

            fileExists.mockResolvedValue(true);
            readJson.mockResolvedValue(mockRegistry);

            const result = await generateFromHybridRegistry();

            expect(result).toBe(false);
            expect(writeJson).not.toHaveBeenCalled();
        });

        test('should handle read errors gracefully', async () => {
            fileExists.mockResolvedValue(true);
            readJson.mockRejectedValue(new Error('Read error'));

            const result = await generateFromHybridRegistry();

            expect(result).toBe(false);
            expect(writeJson).not.toHaveBeenCalled();
        });
    });

    /**
     * generateFromSkillFiles() tests (7 tests)
     * Fallback mode: scan SKILL.md directly
     */
    describe('generateFromSkillFiles()', () => {
        const { fileExists, readFile, writeJson } = require('../../lib/file-utils');
        const { extractYaml, extractContentSummary } = require('../../lib/yaml-parser');

        test('should scan SKILL.md files', async () => {
            fileExists.mockResolvedValue(true);
            fg.mockResolvedValue([
                '/marketplace/skills/skill-1/SKILL.md',
                '/marketplace/skills/skill-2/SKILL.md'
            ]);

            readFile.mockResolvedValue('---\nname: test-skill\ntriggers: [test]\n---\nContent');
            extractYaml.mockReturnValue({ name: 'test-skill', triggers: ['test'], description: 'Test' });
            extractContentSummary.mockReturnValue('Summary');
            writeJson.mockResolvedValue();

            await generateFromSkillFiles();

            expect(fg).toHaveBeenCalled();
            expect(writeJson).toHaveBeenCalled();
        });

        test('should parse YAML frontmatter', async () => {
            fileExists.mockResolvedValue(true);
            fg.mockResolvedValue(['/marketplace/skills/skill/SKILL.md']);

            readFile.mockResolvedValue('---\nname: test\ntriggers: [t1, t2]\n---\nContent');
            extractYaml.mockReturnValue({ name: 'test', triggers: ['t1', 't2'], description: 'Test' });
            extractContentSummary.mockReturnValue('Summary');
            writeJson.mockResolvedValue();

            await generateFromSkillFiles();

            expect(extractYaml).toHaveBeenCalledWith(expect.stringContaining('name: test'));
        });

        test('should extract content summary', async () => {
            fileExists.mockResolvedValue(true);
            fg.mockResolvedValue(['/marketplace/skills/skill/SKILL.md']);

            readFile.mockResolvedValue('---\nname: test\ntriggers: [test]\n---\nContent here');
            extractYaml.mockReturnValue({ name: 'test', triggers: ['test'] });
            extractContentSummary.mockReturnValue('Content here');
            writeJson.mockResolvedValue();

            await generateFromSkillFiles();

            const writtenData = writeJson.mock.calls[0][1];
            expect(writtenData.skills[0].content_summary).toBe('Content here');
        });

        test('should filter skills without triggers', async () => {
            fileExists.mockResolvedValue(true);
            fg.mockResolvedValue([
                '/skills/skill-1/SKILL.md',
                '/skills/skill-2/SKILL.md'
            ]);

            let callCount = 0;
            readFile.mockImplementation(() => {
                callCount++;
                return Promise.resolve(`---\nname: skill-${callCount}\n---\nContent`);
            });

            extractYaml.mockImplementation(() => {
                return callCount === 1
                    ? { name: 'skill-1', triggers: ['test'] }
                    : { name: 'skill-2' }; // No triggers
            });

            extractContentSummary.mockReturnValue('Summary');
            writeJson.mockResolvedValue();

            await generateFromSkillFiles();

            const writtenData = writeJson.mock.calls[0][1];
            expect(writtenData.skills).toHaveLength(1);
            expect(writtenData.skills[0].name).toBe('skill-1');
        });

        test('should use version 3.0.0', async () => {
            fileExists.mockResolvedValue(true);
            fg.mockResolvedValue(['/skills/skill/SKILL.md']);

            readFile.mockResolvedValue('---\nname: test\ntriggers: [test]\n---\nContent');
            extractYaml.mockReturnValue({ name: 'test', triggers: ['test'] });
            extractContentSummary.mockReturnValue('Summary');
            writeJson.mockResolvedValue();

            await generateFromSkillFiles();

            const writtenData = writeJson.mock.calls[0][1];
            expect(writtenData.version).toBe('3.0.0');
        });

        test('should handle read errors gracefully', async () => {
            fileExists.mockResolvedValue(true);
            fg.mockResolvedValue(['/skills/skill/SKILL.md']);

            readFile.mockRejectedValue(new Error('Permission denied'));
            writeJson.mockResolvedValue();

            await generateFromSkillFiles();

            const writtenData = writeJson.mock.calls[0][1];
            expect(writtenData.skills).toHaveLength(0);
        });

        test('should throw error if skills directory not found', async () => {
            fileExists.mockResolvedValue(false);

            await expect(generateFromSkillFiles()).rejects.toThrow('Skills directory not found');
        });
    });

    /**
     * main() tests (3 tests)
     * Main execution orchestration
     */
    describe('main()', () => {
        const { fileExists } = require('../../lib/file-utils');

        test('should use hybrid registry if available', async () => {
            fileExists.mockResolvedValue(true);

            const { readJson, writeJson } = require('../../lib/file-utils');
            readJson.mockResolvedValue({
                version: '2.0.0',
                skills: [
                    { name: 'test', triggers: ['test'], description: 'Test', source: 'marketplace' }
                ]
            });
            writeJson.mockResolvedValue();

            await main({});

            expect(writeJson).toHaveBeenCalled();
        });

        test('should fallback to skill files if registry not available', async () => {
            fileExists.mockImplementation((path) => {
                // Registry doesn't exist, but skills dir does
                return Promise.resolve(!path.includes('hybrid-registry'));
            });

            fg.mockResolvedValue([]);

            const { writeJson } = require('../../lib/file-utils');
            writeJson.mockResolvedValue();

            await main({});

            expect(fg).toHaveBeenCalled();
        });

        test('should force use of registry when --from-registry flag', async () => {
            fileExists.mockResolvedValue(true);

            const { readJson, writeJson } = require('../../lib/file-utils');
            readJson.mockResolvedValue({
                version: '2.0.0',
                skills: [
                    { name: 'test', triggers: ['test'], description: 'Test', source: 'marketplace' }
                ]
            });
            writeJson.mockResolvedValue();

            await main({ fromRegistry: true });

            expect(readJson).toHaveBeenCalled();
            expect(fg).not.toHaveBeenCalled();
        });
    });
});
