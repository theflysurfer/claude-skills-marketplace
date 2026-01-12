/**
 * Unit tests for discover-skills.js
 *
 * Target: 100% coverage (branches, functions, lines, statements)
 * Test count: ~25-30 tests
 */

// Mock dependencies BEFORE importing module
jest.mock('../../lib/file-utils');
jest.mock('../../lib/yaml-parser');
jest.mock('fast-glob');

const fg = require('fast-glob');
const path = require('path');

// Import functions to test
const {
    detectDependencies,
    loadRegistry,
    loadProjectsRegistry,
    loadSyncConfig,
    findProjectSkillSources,
    scanSource,
    resolveSkills,
    main
} = require('../../discovery/discover-skills');

describe('discover-skills.js - Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * detectDependencies() tests (5 tests)
     * Detects local file references in markdown content
     */
    describe('detectDependencies()', () => {
        test('should find markdown links with relative paths', () => {
            const content = 'See [reference](./references/doc.md) for details.';
            const skillDir = '/path/to/skill';

            const deps = detectDependencies(content, skillDir);

            expect(deps).toContain('references/doc.md');
        });

        test('should ignore external URLs (http/https)', () => {
            const content = 'See [website](https://example.com) and [docs](http://example.com/docs).';
            const skillDir = '/path/to/skill';

            const deps = detectDependencies(content, skillDir);

            expect(deps).toEqual([]);
        });

        test('should ignore anchor links', () => {
            const content = 'Jump to [section](#section-name).';
            const skillDir = '/path/to/skill';

            const deps = detectDependencies(content, skillDir);

            expect(deps).toEqual([]);
        });

        test('should resolve relative paths correctly', () => {
            const content = '[Parent](../parent.md) and [Child](./sub/child.md)';
            const skillDir = '/path/to/skill';

            const deps = detectDependencies(content, skillDir);

            // Relative paths should be included (not starting with ..)
            expect(deps).toContain('sub/child.md');
            expect(deps).not.toContain(expect.stringContaining('..'));
        });

        test('should return empty array when no dependencies', () => {
            const content = 'No links here, just plain text.';
            const skillDir = '/path/to/skill';

            const deps = detectDependencies(content, skillDir);

            expect(deps).toEqual([]);
        });
    });

    /**
     * loadRegistry() tests (3 tests)
     * Loads existing registry or returns empty structure
     */
    describe('loadRegistry()', () => {
        const { readJson } = require('../../lib/file-utils');

        test('should load existing registry file', async () => {
            const mockRegistry = {
                version: '2.0.0',
                skills: [{ name: 'test-skill' }]
            };

            readJson.mockResolvedValue(mockRegistry);

            const result = await loadRegistry();

            expect(result).toEqual(mockRegistry);
        });

        test('should return empty structure if file does not exist', async () => {
            readJson.mockResolvedValue(null);

            const result = await loadRegistry();

            expect(result).toHaveProperty('version', '2.0.0');
            expect(result).toHaveProperty('skills', []);
            expect(result).toHaveProperty('sources', []);
        });

        test('should handle JSON parse errors gracefully', async () => {
            readJson.mockRejectedValue(new Error('Invalid JSON'));

            await expect(loadRegistry()).rejects.toThrow();
        });
    });

    /**
     * loadSyncConfig() tests (3 tests)
     * Loads sync configuration
     */
    describe('loadSyncConfig()', () => {
        const { readJson } = require('../../lib/file-utils');

        test('should load sync-config.json successfully', async () => {
            const mockConfig = {
                project_sources: [],
                skills_to_sync: ['skill-1']
            };

            readJson.mockResolvedValue(mockConfig);

            const result = await loadSyncConfig();

            expect(result).toEqual(mockConfig);
        });

        test('should throw error if sync-config.json not found', async () => {
            readJson.mockResolvedValue(null);

            await expect(loadSyncConfig()).rejects.toThrow('Sync config not found');
        });

        test('should handle malformed JSON', async () => {
            readJson.mockRejectedValue(new Error('Malformed JSON'));

            await expect(loadSyncConfig()).rejects.toThrow();
        });
    });

    /**
     * findProjectSkillSources() tests (4 tests)
     * Finds project skill sources from current directory
     */
    describe('findProjectSkillSources()', () => {
        const { fileExists } = require('../../lib/file-utils');

        test('should find skills in current project directory', async () => {
            const syncConfig = { project_sources: [] };
            const projectsRegistry = {
                projects: {
                    '/current/project': { name: 'Test Project' }
                }
            };

            // Mock process.cwd()
            const originalCwd = process.cwd;
            process.cwd = jest.fn(() => '/current/project');

            fileExists.mockResolvedValue(true);

            const sources = await findProjectSkillSources(syncConfig, projectsRegistry);

            expect(sources).toHaveLength(1);
            expect(sources[0]).toMatchObject({
                type: 'project',
                priority: 2,
                project_name: 'Test Project'
            });

            process.cwd = originalCwd;
        });

        test('should parse project_sources with object configs', async () => {
            const syncConfig = {
                project_sources: [
                    {
                        project_pattern: '/test/project',
                        skills_path: '.claude/skills',
                        priority: 2
                    }
                ]
            };
            const projectsRegistry = { projects: {} };

            fg.mockResolvedValue(['/test/project']);
            fileExists.mockResolvedValue(true);

            const sources = await findProjectSkillSources(syncConfig, projectsRegistry);

            expect(sources).toHaveLength(1);
            expect(sources[0].priority).toBe(2);
        });

        test('should parse project_sources with string patterns', async () => {
            const syncConfig = {
                project_sources: ['/simple/path']
            };
            const projectsRegistry = { projects: {} };

            fg.mockResolvedValue(['/simple/path']);
            fileExists.mockResolvedValue(true);

            const sources = await findProjectSkillSources(syncConfig, projectsRegistry);

            expect(sources).toHaveLength(1);
            expect(sources[0].priority).toBe(2); // Default priority
        });

        test('should return empty array when no projects found', async () => {
            const syncConfig = { project_sources: [] };
            const projectsRegistry = { projects: {} };

            const originalCwd = process.cwd;
            process.cwd = jest.fn(() => '/unknown/project');

            const sources = await findProjectSkillSources(syncConfig, projectsRegistry);

            expect(sources).toEqual([]);

            process.cwd = originalCwd;
        });

        test('should skip project when skills directory does not exist', async () => {
            const syncConfig = { project_sources: [] };
            const projectsRegistry = {
                projects: {
                    '/test/project': { name: 'Test Project' }
                }
            };

            const originalCwd = process.cwd;
            process.cwd = jest.fn(() => '/test/project');

            fileExists.mockResolvedValue(false); // Skills dir doesn't exist

            const sources = await findProjectSkillSources(syncConfig, projectsRegistry);

            expect(sources).toEqual([]);

            process.cwd = originalCwd;
        });

        test('should handle undefined project_sources', async () => {
            const syncConfig = {}; // No project_sources field
            const projectsRegistry = { projects: {} };

            const sources = await findProjectSkillSources(syncConfig, projectsRegistry);

            expect(sources).toEqual([]);
        });

        test('should handle project_sources with non-existent skills path', async () => {
            const syncConfig = {
                project_sources: [
                    {
                        project_pattern: '/test/project',
                        skills_path: 'custom/path',
                        priority: 1
                    }
                ]
            };
            const projectsRegistry = { projects: {} };

            fg.mockResolvedValue(['/test/project']);
            fileExists.mockResolvedValue(false); // Skills path doesn't exist

            const sources = await findProjectSkillSources(syncConfig, projectsRegistry);

            expect(sources).toEqual([]);
        });

        test('should use basename when project name is missing', async () => {
            const syncConfig = { project_sources: [] };
            const projectsRegistry = {
                projects: {
                    '/test/project': {} // No name field
                }
            };

            const originalCwd = process.cwd;
            process.cwd = jest.fn(() => '/test/project');

            fileExists.mockResolvedValue(true);

            const sources = await findProjectSkillSources(syncConfig, projectsRegistry);

            expect(sources).toHaveLength(1);
            expect(sources[0].project_name).toBe('project'); // Uses basename

            process.cwd = originalCwd;
        });

        test('should use default skills_path when not specified', async () => {
            const syncConfig = {
                project_sources: [
                    {
                        project_pattern: '/test/project'
                        // No skills_path specified
                    }
                ]
            };
            const projectsRegistry = { projects: {} };

            fg.mockResolvedValue(['/test/project']);
            fileExists.mockResolvedValue(true);

            const sources = await findProjectSkillSources(syncConfig, projectsRegistry);

            expect(sources).toHaveLength(1);
            expect(sources[0].path).toMatch(/\.claude[\\\/]skills/); // Default path with Windows/Unix separators
        });

        test('should use default priority when not specified', async () => {
            const syncConfig = {
                project_sources: [
                    {
                        project_pattern: '/test/project'
                        // No priority specified
                    }
                ]
            };
            const projectsRegistry = { projects: {} };

            fg.mockResolvedValue(['/test/project']);
            fileExists.mockResolvedValue(true);

            const sources = await findProjectSkillSources(syncConfig, projectsRegistry);

            expect(sources).toHaveLength(1);
            expect(sources[0].priority).toBe(2); // Default priority
        });
    });

    /**
     * scanSource() tests (6 tests)
     * Scans a source directory for SKILL.md files
     */
    describe('scanSource()', () => {
        const { fileExists, readFile, computeHash } = require('../../lib/file-utils');
        const { extractYaml, extractContentSummary } = require('../../lib/yaml-parser');

        test('should find all SKILL.md files in source', async () => {
            const source = {
                type: 'marketplace',
                path: '/marketplace/skills',
                priority: 0
            };

            fg.mockResolvedValue([
                '/marketplace/skills/skill-1/SKILL.md',
                '/marketplace/skills/skill-2/SKILL.md'
            ]);

            fileExists.mockResolvedValue(true);
            readFile.mockResolvedValue('---\nname: test-skill\n---\nContent');
            extractYaml.mockReturnValue({ name: 'test-skill', triggers: [] });
            computeHash.mockReturnValue('abc123');
            extractContentSummary.mockReturnValue('Summary');

            const skills = await scanSource(source);

            expect(skills.length).toBeGreaterThan(0);
        });

        test('should parse YAML frontmatter with CRLF', async () => {
            const source = {
                type: 'marketplace',
                path: '/test/skills',
                priority: 0
            };

            fg.mockResolvedValue(['/test/skills/skill/SKILL.md']);
            fileExists.mockResolvedValue(true);
            readFile.mockResolvedValue('---\r\nname: test-skill\r\n---\r\nContent');
            extractYaml.mockReturnValue({ name: 'test-skill' });
            computeHash.mockReturnValue('abc123');
            extractContentSummary.mockReturnValue('Summary');

            const skills = await scanSource(source);

            expect(extractYaml).toHaveBeenCalledWith(expect.stringContaining('\r\n'));
        });

        test('should skip files without name in frontmatter', async () => {
            const source = {
                type: 'marketplace',
                path: '/test/skills',
                priority: 0
            };

            fg.mockResolvedValue(['/test/skills/bad/SKILL.md']);
            fileExists.mockResolvedValue(true);
            readFile.mockResolvedValue('---\ndescription: No name\n---\n');
            extractYaml.mockReturnValue({ description: 'No name' }); // No name field

            const skills = await scanSource(source);

            expect(skills).toEqual([]);
        });

        test('should detect dependencies', async () => {
            const source = {
                type: 'marketplace',
                path: '/test/skills',
                priority: 0
            };

            fg.mockResolvedValue(['/test/skills/skill/SKILL.md']);
            fileExists.mockResolvedValue(true);
            readFile.mockResolvedValue('---\nname: skill\n---\nSee [ref](./doc.md)');
            extractYaml.mockReturnValue({ name: 'skill' });
            computeHash.mockReturnValue('abc123');
            extractContentSummary.mockReturnValue('Summary');

            const skills = await scanSource(source);

            expect(skills[0].dependencies).toContain('doc.md');
        });

        test('should compute content hash', async () => {
            const source = {
                type: 'marketplace',
                path: '/test/skills',
                priority: 0
            };

            fg.mockResolvedValue(['/test/skills/skill/SKILL.md']);
            fileExists.mockResolvedValue(true);
            readFile.mockResolvedValue('---\nname: skill\n---\nContent');
            extractYaml.mockReturnValue({ name: 'skill' });
            computeHash.mockReturnValue('abc123def456');
            extractContentSummary.mockReturnValue('Summary');

            const skills = await scanSource(source);

            expect(skills[0].content_hash).toBe('abc123def456');
        });

        test('should handle read errors gracefully', async () => {
            const source = {
                type: 'marketplace',
                path: '/test/skills',
                priority: 0
            };

            fg.mockResolvedValue(['/test/skills/skill/SKILL.md']);
            fileExists.mockResolvedValue(true);
            readFile.mockRejectedValue(new Error('Permission denied'));

            const skills = await scanSource(source);

            // Should not throw, just skip the file
            expect(skills).toEqual([]);
        });
    });

    /**
     * resolveSkills() tests (4 tests)
     * Resolves skill conflicts based on priority
     */
    describe('resolveSkills()', () => {
        test('should keep skill with highest priority', () => {
            const skills = [
                { name: 'skill-1', priority: 0, source: 'marketplace' },
                { name: 'skill-1', priority: 1, source: 'global' },
                { name: 'skill-1', priority: 2, source: 'project' }
            ];

            const resolved = resolveSkills(skills);

            expect(resolved).toHaveLength(1);
            expect(resolved[0].source).toBe('project');
            expect(resolved[0].priority).toBe(2);
        });

        test('should respect priority order: Project > Global > Marketplace', () => {
            const skills = [
                { name: 'skill-1', priority: 0, source: 'marketplace' },
                { name: 'skill-2', priority: 1, source: 'global' },
                { name: 'skill-3', priority: 2, source: 'project' }
            ];

            const resolved = resolveSkills(skills);

            expect(resolved).toHaveLength(3);
        });

        test('should warn when same priority duplicates exist', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const skills = [
                { name: 'skill-1', priority: 1, source: 'global' },
                { name: 'skill-1', priority: 1, source: 'global' }
            ];

            resolveSkills(skills);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Duplicate skill at same priority')
            );

            consoleSpy.mockRestore();
        });

        test('should return Map converted to Array', () => {
            const skills = [
                { name: 'skill-1', priority: 0 },
                { name: 'skill-2', priority: 0 }
            ];

            const resolved = resolveSkills(skills);

            expect(Array.isArray(resolved)).toBe(true);
            expect(resolved).toHaveLength(2);
        });
    });

    /**
     * loadProjectsRegistry() tests (2 tests)
     * Loads projects registry or returns null
     */
    describe('loadProjectsRegistry()', () => {
        const { readJson } = require('../../lib/file-utils');

        test('should load projects registry file', async () => {
            const mockRegistry = {
                projects: {
                    '/path/to/project': { name: 'Test Project' }
                }
            };

            readJson.mockResolvedValue(mockRegistry);

            const result = await loadProjectsRegistry();

            expect(result).toEqual(mockRegistry);
        });

        test('should return null if file does not exist', async () => {
            readJson.mockResolvedValue(null);

            const result = await loadProjectsRegistry();

            expect(result).toBeNull();
        });
    });

    /**
     * main() tests (3 tests)
     * Main discovery orchestration
     */
    describe('main()', () => {
        const { readJson, writeJson } = require('../../lib/file-utils');

        test('should scan all sources and build registry', async () => {
            // Mock sync config
            readJson.mockImplementation((path) => {
                if (path.includes('sync-config')) {
                    return Promise.resolve({
                        project_sources: []
                    });
                }
                if (path.includes('projects-registry')) {
                    return Promise.resolve(null);
                }
                return Promise.resolve(null);
            });

            // Mock scanSource results
            fg.mockResolvedValue([]);

            const { fileExists } = require('../../lib/file-utils');
            fileExists.mockResolvedValue(true);

            writeJson.mockResolvedValue();

            const result = await main({ dryRun: false });

            expect(result).toHaveProperty('version', '2.0.0');
            expect(result).toHaveProperty('skills');
            expect(result).toHaveProperty('stats');
            expect(writeJson).toHaveBeenCalled();
        });

        test('should not write output in dry-run mode', async () => {
            readJson.mockImplementation((path) => {
                if (path.includes('sync-config')) {
                    return Promise.resolve({
                        project_sources: []
                    });
                }
                return Promise.resolve(null);
            });

            fg.mockResolvedValue([]);

            const { fileExists, writeJson } = require('../../lib/file-utils');
            fileExists.mockResolvedValue(true);

            const result = await main({ dryRun: true });

            expect(result).toHaveProperty('version', '2.0.0');
            expect(writeJson).not.toHaveBeenCalled();
        });

        test('should calculate stats correctly', async () => {
            readJson.mockImplementation((path) => {
                if (path.includes('sync-config')) {
                    return Promise.resolve({
                        project_sources: []
                    });
                }
                return Promise.resolve(null);
            });

            fg.mockResolvedValue([]);

            const { fileExists, writeJson } = require('../../lib/file-utils');
            fileExists.mockResolvedValue(true);
            writeJson.mockResolvedValue();

            const result = await main({ dryRun: false });

            expect(result.stats).toHaveProperty('total_skills');
            expect(result.stats).toHaveProperty('by_source');
            expect(result.stats).toHaveProperty('with_triggers');
            expect(result.stats).toHaveProperty('with_dependencies');
        });

        test('should count skills by source correctly', async () => {
            readJson.mockImplementation((path) => {
                if (path.includes('sync-config')) {
                    return Promise.resolve({
                        project_sources: []
                    });
                }
                return Promise.resolve(null);
            });

            // Mock finding skills from different sources
            fg.mockResolvedValue([
                '/marketplace/skills/skill-1/SKILL.md',
                '/global/skills/skill-2/SKILL.md'
            ]);

            const { fileExists, readFile, computeHash, writeJson } = require('../../lib/file-utils');
            const { extractYaml, extractContentSummary } = require('../../lib/yaml-parser');

            fileExists.mockResolvedValue(true);

            let callCount = 0;
            readFile.mockImplementation(() => {
                callCount++;
                return Promise.resolve(`---\nname: skill-${callCount}\ntriggers: [test]\n---\nContent`);
            });

            extractYaml.mockImplementation(() => ({
                name: `skill-${callCount}`,
                triggers: ['test']
            }));

            computeHash.mockReturnValue('abc123');
            extractContentSummary.mockReturnValue('Summary');
            writeJson.mockResolvedValue();

            const result = await main({ dryRun: false });

            expect(result.stats.by_source).toHaveProperty('marketplace');
            expect(result.stats.by_source).toHaveProperty('global');
            expect(result.stats.by_source).toHaveProperty('project');
        });
    });

    /**
     * scanSource() additional tests (2 tests)
     * Additional coverage for edge cases
     */
    describe('scanSource() - additional coverage', () => {
        const { fileExists, readFile } = require('../../lib/file-utils');

        test('should handle missing source path', async () => {
            const source = {
                type: 'marketplace',
                path: '/nonexistent/path',
                priority: 0
            };

            fileExists.mockResolvedValue(false);

            const skills = await scanSource(source);

            expect(skills).toEqual([]);
        });

        test('should include project context when available', async () => {
            const source = {
                type: 'project',
                path: '/test/project/.claude/skills',
                priority: 2,
                project_name: 'Test Project',
                project_path: '/test/project'
            };

            fg.mockResolvedValue(['/test/project/.claude/skills/skill/SKILL.md']);
            fileExists.mockResolvedValue(true);
            readFile.mockResolvedValue('---\nname: test-skill\n---\nContent');

            const { extractYaml, extractContentSummary } = require('../../lib/yaml-parser');
            const { computeHash } = require('../../lib/file-utils');

            extractYaml.mockReturnValue({ name: 'test-skill' });
            computeHash.mockReturnValue('abc123');
            extractContentSummary.mockReturnValue('Summary');

            const skills = await scanSource(source);

            expect(skills[0].project_name).toBe('Test Project');
            expect(skills[0].project_path).toBe('/test/project');
        });
    });
});
