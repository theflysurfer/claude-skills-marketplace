/**
 * Unit tests for scan-all-skills.js
 *
 * Target: 100% coverage (branches, functions, lines, statements)
 * Test count: 10 tests
 */

// Mock dependencies BEFORE importing module
jest.mock('fs');
jest.mock('../../lib/file-utils');

const fs = require('fs');
const path = require('path');
const { writeJson } = require('../../lib/file-utils');

// Import functions to test
const { findSkills, scanAllDirectories, main } = require('../../discovery/scan-all-skills');

describe('scan-all-skills.js - Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
    });

    /**
     * findSkills() tests (6 tests)
     * Find skills in a single directory
     */
    describe('findSkills()', () => {
        test('should find skills in .claude/skills with SKILL.md', () => {
            const basePath = 'C:\\Projects';
            const project1Path = path.join(basePath, 'project1');
            const skillsPath = path.join(project1Path, '.claude', 'skills');

            // Mock fs.existsSync
            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === basePath) return true;
                if (filePath === skillsPath) return true;
                if (filePath.includes('SKILL.md')) return true;
                return false;
            });

            // Mock fs.readdirSync
            fs.readdirSync.mockImplementation((dirPath) => {
                if (dirPath === basePath) return ['project1', 'project2'];
                if (dirPath === skillsPath) return ['skill-a', 'skill-b'];
                return [];
            });

            // Mock fs.statSync
            fs.statSync.mockImplementation((filePath) => ({
                isDirectory: () => !filePath.endsWith('SKILL.md'),
                isFile: () => filePath.endsWith('SKILL.md')
            }));

            const result = findSkills(basePath);

            expect(result['project1']).toBeDefined();
            expect(result['project1'].skills_count).toBe(2);
            expect(result['project1'].items).toHaveLength(2);
            expect(result['project1'].items[0].type).toBe('skill');
        });

        test('should detect dir without SKILL.md as dir_no_skill', () => {
            const basePath = 'C:\\Projects';
            const project1Path = path.join(basePath, 'project1');
            const skillsPath = path.join(project1Path, '.claude', 'skills');

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === basePath) return true;
                if (filePath === skillsPath) return true;
                if (filePath.includes('SKILL.md')) return false; // No SKILL.md
                return false;
            });

            fs.readdirSync.mockImplementation((dirPath) => {
                if (dirPath === basePath) return ['project1'];
                if (dirPath === skillsPath) return ['not-a-skill'];
                return [];
            });

            fs.statSync.mockImplementation(() => ({
                isDirectory: () => true,
                isFile: () => false
            }));

            const result = findSkills(basePath);

            expect(result['project1']).toBeDefined();
            expect(result['project1'].items[0].type).toBe('dir_no_skill');
        });

        test('should detect .md files as file type', () => {
            const basePath = 'C:\\Projects';
            const project1Path = path.join(basePath, 'project1');
            const skillsPath = path.join(project1Path, '.claude', 'skills');

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === basePath) return true;
                if (filePath === skillsPath) return true;
                return false;
            });

            fs.readdirSync.mockImplementation((dirPath) => {
                if (dirPath === basePath) return ['project1'];
                if (dirPath === skillsPath) return ['readme.md'];
                return [];
            });

            fs.statSync.mockImplementation((filePath) => ({
                isDirectory: () => !filePath.endsWith('.md'),
                isFile: () => filePath.endsWith('.md')
            }));

            const result = findSkills(basePath);

            expect(result['project1']).toBeDefined();
            expect(result['project1'].items[0].type).toBe('file');
            expect(result['project1'].items[0].name).toBe('readme.md');
        });

        test('should exclude hidden directories (starting with .)', () => {
            const basePath = 'C:\\Projects';

            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockReturnValue(['project1', '.hidden-project', '.git']);
            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });

            const result = findSkills(basePath);

            expect(result['.hidden-project']).toBeUndefined();
            expect(result['.git']).toBeUndefined();
        });

        test('should exclude directories in EXCLUDE list', () => {
            const basePath = 'C:\\Projects';

            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockReturnValue(['project1', '2025.11 Claude Code MarketPlace']);
            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });

            const result = findSkills(basePath);

            expect(result['2025.11 Claude Code MarketPlace']).toBeUndefined();
        });

        test('should skip projects without .claude/skills directory', () => {
            const basePath = 'C:\\Projects';

            fs.readdirSync.mockReturnValue(['project-no-skills']);
            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });
            fs.existsSync.mockReturnValue(false); // No .claude/skills

            const result = findSkills(basePath);

            expect(result['project-no-skills']).toBeUndefined();
        });

        test('should skip non-directory files in base path', () => {
            const basePath = 'C:\\Projects';

            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockReturnValue(['project1', 'readme.txt']);
            fs.statSync.mockImplementation((filePath) => ({
                isDirectory: () => !filePath.endsWith('.txt'),
                isFile: () => filePath.endsWith('.txt')
            }));

            const result = findSkills(basePath);

            // readme.txt should be skipped
            expect(result['readme.txt']).toBeUndefined();
        });

        test('should handle projects with mixed skill types', () => {
            const basePath = 'C:\\Projects';
            const project1Path = path.join(basePath, 'project1');
            const skillsPath = path.join(project1Path, '.claude', 'skills');

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === basePath) return true;
                if (filePath === skillsPath) return true;
                if (filePath.includes('skill-a') && filePath.endsWith('SKILL.md')) return true;
                if (filePath.includes('skill-b') && filePath.endsWith('SKILL.md')) return false;
                return false;
            });

            fs.readdirSync.mockImplementation((dirPath) => {
                if (dirPath === basePath) return ['project1'];
                if (dirPath === skillsPath) return ['skill-a', 'skill-b', 'readme.md'];
                return [];
            });

            fs.statSync.mockImplementation((filePath) => ({
                isDirectory: () => !filePath.endsWith('.md'),
                isFile: () => filePath.endsWith('.md')
            }));

            const result = findSkills(basePath);

            expect(result['project1'].items).toHaveLength(3);
            expect(result['project1'].items[0].type).toBe('skill');       // skill-a with SKILL.md
            expect(result['project1'].items[1].type).toBe('dir_no_skill'); // skill-b without SKILL.md
            expect(result['project1'].items[2].type).toBe('file');         // readme.md file
            expect(result['project1'].skills_count).toBe(1); // Only skill-a
        });
    });

    /**
     * scanAllDirectories() tests (2 tests)
     * Scan multiple directories
     */
    describe('scanAllDirectories()', () => {
        test('should scan multiple directories', () => {
            const scanDirs = ['C:\\Projects1', 'C:\\Projects2'];

            fs.readdirSync.mockImplementation((dirPath) => {
                if (dirPath === 'C:\\Projects1') return ['proj1'];
                if (dirPath === 'C:\\Projects2') return ['proj2'];
                if (dirPath.includes('skills')) return ['skill1'];
                return [];
            });

            fs.statSync.mockImplementation(() => ({
                isDirectory: () => true,
                isFile: () => false
            }));

            fs.existsSync.mockImplementation((filePath) => {
                return filePath.includes('.claude\\skills') ||
                       filePath.includes('.claude/skills') ||
                       filePath.includes('SKILL.md');
            });

            const result = scanAllDirectories(scanDirs);

            expect(result['C:\\Projects1']).toBeDefined();
            expect(result['C:\\Projects2']).toBeDefined();
        });

        test('should skip non-existent directories', () => {
            const scanDirs = ['C:\\NonExistent'];

            fs.existsSync.mockReturnValue(false);

            const result = scanAllDirectories(scanDirs);

            expect(result['C:\\NonExistent']).toEqual({});
        });
    });

    /**
     * main() tests (3 tests)
     * Main execution with output
     */
    describe('main()', () => {
        test('should print summary and save JSON', async () => {
            const scanDir = 'C:\\Users\\julien\\OneDrive\\Coding\\_Projets de code';
            const project1Path = path.join(scanDir, 'proj1');
            const skillsPath = path.join(project1Path, '.claude', 'skills');

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === scanDir) return true;
                if (filePath === skillsPath) return true;
                if (filePath.includes('SKILL.md')) return true;
                return false;
            });

            fs.readdirSync.mockImplementation((dirPath) => {
                if (dirPath === scanDir) return ['proj1'];
                if (dirPath === skillsPath) return ['skill1'];
                return [];
            });

            fs.statSync.mockImplementation(() => ({
                isDirectory: () => true,
                isFile: () => false
            }));

            writeJson.mockResolvedValue();

            await main();

            expect(console.log).toHaveBeenCalledWith('=== SCAN RESULTS ===\n');
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Total skills found:'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining(scanDir));
            expect(writeJson).toHaveBeenCalled();
        });

        test('should print project details with other files count', async () => {
            const scanDir = 'C:\\Users\\julien\\OneDrive\\Coding\\_Projets de code';
            const project1Path = path.join(scanDir, 'proj1');
            const skillsPath = path.join(project1Path, '.claude', 'skills');

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === scanDir) return true;
                if (filePath === skillsPath) return true;
                if (filePath.includes('skill1') && filePath.endsWith('SKILL.md')) return true;
                return false;
            });

            fs.readdirSync.mockImplementation((dirPath) => {
                if (dirPath === scanDir) return ['proj1'];
                if (dirPath === skillsPath) return ['skill1', 'readme.md']; // 1 skill + 1 other file
                return [];
            });

            fs.statSync.mockImplementation((filePath) => ({
                isDirectory: () => !filePath.endsWith('.md'),
                isFile: () => filePath.endsWith('.md')
            }));

            writeJson.mockResolvedValue();

            await main();

            // Check that it prints "1 skills (+1 other files)"
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('proj1: 1 skills'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[SKILL] skill1'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[FILE] readme.md'));
        });

        test('should handle empty scan results', async () => {
            fs.existsSync.mockReturnValue(false);
            fs.readdirSync.mockReturnValue([]);
            writeJson.mockResolvedValue();

            await main();

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Total skills found: 0'));
        });
    });
});
