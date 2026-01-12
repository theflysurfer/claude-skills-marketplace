/**
 * Unit tests for scan-all-hooks.js
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
const { findHooks, scanAllDirectories, main } = require('../../discovery/scan-all-hooks');

describe('scan-all-hooks.js - Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
    });

    /**
     * findHooks() tests (11 tests)
     * Find hooks in settings files
     */
    describe('findHooks()', () => {
        test('should return empty object if base path does not exist', () => {
            const basePath = 'C:\\NonExistent';

            fs.existsSync.mockReturnValue(false);

            const result = findHooks(basePath);

            expect(result).toEqual({});
        });

        test('should find hooks in settings.json', () => {
            const basePath = 'C:\\Projects';
            const project1Path = path.join(basePath, 'project1');
            const claudeDir = path.join(project1Path, '.claude');
            const settingsPath = path.join(claudeDir, 'settings.json');

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === basePath) return true;
                if (filePath === claudeDir) return true;
                if (filePath === settingsPath) return true;
                return false;
            });

            fs.readdirSync.mockReturnValue(['project1']);
            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });

            fs.readFileSync.mockReturnValue(JSON.stringify({
                hooks: {
                    SessionStart: [{ hooks: [{ command: 'echo test' }] }]
                }
            }));

            const result = findHooks(basePath);

            expect(result['project1']).toBeDefined();
            expect(result['project1'].settings_files).toHaveLength(1);
            expect(result['project1'].settings_files[0].file).toBe('settings.json');
            expect(result['project1'].settings_files[0].hooks.SessionStart).toBe(1);
        });

        test('should find hooks in settings.local.json', () => {
            const basePath = 'C:\\Projects';
            const project1Path = path.join(basePath, 'project1');
            const claudeDir = path.join(project1Path, '.claude');
            const localSettingsPath = path.join(claudeDir, 'settings.local.json');

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === basePath) return true;
                if (filePath === claudeDir) return true;
                if (filePath === localSettingsPath) return true;
                return false;
            });

            fs.readdirSync.mockReturnValue(['project1']);
            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });

            fs.readFileSync.mockImplementation((filePath) => {
                if (filePath === path.join(claudeDir, 'settings.json')) {
                    throw new Error('ENOENT');
                }
                return JSON.stringify({
                    hooks: {
                        SessionEnd: [{ hooks: [{ command: 'cleanup' }] }]
                    }
                });
            });

            const result = findHooks(basePath);

            expect(result['project1'].settings_files[0].file).toBe('settings.local.json');
            expect(result['project1'].settings_files[0].hooks.SessionEnd).toBe(1);
        });

        test('should count multiple hooks in list', () => {
            const basePath = 'C:\\Projects';
            const project1Path = path.join(basePath, 'project1');
            const claudeDir = path.join(project1Path, '.claude');
            const settingsPath = path.join(claudeDir, 'settings.json');

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === basePath) return true;
                if (filePath === claudeDir) return true;
                if (filePath === settingsPath) return true;
                return false;
            });

            fs.readdirSync.mockReturnValue(['project1']);
            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });

            fs.readFileSync.mockReturnValue(JSON.stringify({
                hooks: {
                    SessionStart: [
                        { hooks: [{ command: 'hook1' }] },
                        { hooks: [{ command: 'hook2' }] }
                    ]
                }
            }));

            const result = findHooks(basePath);

            expect(result['project1'].settings_files[0].hooks.SessionStart).toBe(2);
        });

        test('should handle non-array hook as count 1', () => {
            const basePath = 'C:\\Projects';
            const project1Path = path.join(basePath, 'project1');
            const claudeDir = path.join(project1Path, '.claude');
            const settingsPath = path.join(claudeDir, 'settings.json');

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === basePath) return true;
                if (filePath === claudeDir) return true;
                if (filePath === settingsPath) return true;
                return false;
            });

            fs.readdirSync.mockReturnValue(['project1']);
            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });

            fs.readFileSync.mockReturnValue(JSON.stringify({
                hooks: {
                    SessionStart: { command: 'single-hook' }
                }
            }));

            const result = findHooks(basePath);

            expect(result['project1'].settings_files[0].hooks.SessionStart).toBe(1);
        });

        test('should skip projects without .claude directory', () => {
            const basePath = 'C:\\Projects';

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === basePath) return true;
                return false; // No .claude
            });

            fs.readdirSync.mockReturnValue(['project1']);
            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });

            const result = findHooks(basePath);

            expect(result['project1']).toBeUndefined();
        });

        test('should skip projects with empty hooks', () => {
            const basePath = 'C:\\Projects';
            const project1Path = path.join(basePath, 'project1');
            const claudeDir = path.join(project1Path, '.claude');
            const settingsPath = path.join(claudeDir, 'settings.json');

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === basePath) return true;
                if (filePath === claudeDir) return true;
                if (filePath === settingsPath) return true;
                return false;
            });

            fs.readdirSync.mockReturnValue(['project1']);
            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });

            fs.readFileSync.mockReturnValue(JSON.stringify({ hooks: {} }));

            const result = findHooks(basePath);

            expect(result['project1']).toBeUndefined();
        });

        test('should handle JSON parse errors gracefully', () => {
            const basePath = 'C:\\Projects';
            const project1Path = path.join(basePath, 'project1');
            const claudeDir = path.join(project1Path, '.claude');
            const settingsPath = path.join(claudeDir, 'settings.json');

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === basePath) return true;
                if (filePath === claudeDir) return true;
                if (filePath === settingsPath) return true;
                return false;
            });

            fs.readdirSync.mockReturnValue(['project1']);
            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });

            fs.readFileSync.mockReturnValue('invalid {{{ json');

            const result = findHooks(basePath);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Error reading'));
            expect(result['project1']).toBeUndefined();
        });

        test('should skip non-directory files in base path', () => {
            const basePath = 'C:\\Projects';

            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockReturnValue(['project1', 'readme.txt']);
            fs.statSync.mockImplementation((filePath) => ({
                isDirectory: () => !filePath.endsWith('.txt'),
                isFile: () => filePath.endsWith('.txt')
            }));

            const result = findHooks(basePath);

            // readme.txt should be skipped
            expect(result['readme.txt']).toBeUndefined();
        });

        test('should exclude hidden directories', () => {
            const basePath = 'C:\\Projects';

            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockReturnValue(['project1', '.hidden', '.git']);
            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });

            const result = findHooks(basePath);

            expect(result['.hidden']).toBeUndefined();
            expect(result['.git']).toBeUndefined();
        });

        test('should exclude directories in EXCLUDE list', () => {
            const basePath = 'C:\\Projects';

            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockReturnValue(['project1', '2025.11 Claude Code MarketPlace']);
            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });

            const result = findHooks(basePath);

            expect(result['2025.11 Claude Code MarketPlace']).toBeUndefined();
        });
    });

    /**
     * scanAllDirectories() tests (1 test)
     */
    describe('scanAllDirectories()', () => {
        test('should scan multiple directories', () => {
            const scanDirs = ['C:\\Projects1', 'C:\\Projects2'];

            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockImplementation((dirPath) => {
                if (dirPath === 'C:\\Projects1') return ['proj1'];
                if (dirPath === 'C:\\Projects2') return ['proj2'];
                return [];
            });

            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });
            fs.readFileSync.mockReturnValue(JSON.stringify({
                hooks: { SessionStart: [{ hooks: [{ command: 'test' }] }] }
            }));

            const result = scanAllDirectories(scanDirs);

            expect(result['C:\\Projects1']).toBeDefined();
            expect(result['C:\\Projects2']).toBeDefined();
        });
    });

    /**
     * main() tests (2 tests)
     */
    describe('main()', () => {
        test('should print summary and save JSON', async () => {
            const scanDir = 'C:\\Users\\julien\\OneDrive\\Coding\\_Projets de code';
            const project1Path = path.join(scanDir, 'proj1');
            const claudeDir = path.join(project1Path, '.claude');

            fs.existsSync.mockImplementation((filePath) => {
                if (filePath === scanDir) return true;
                if (filePath === claudeDir) return true;
                if (filePath.includes('settings.json')) return true;
                return false;
            });

            fs.readdirSync.mockImplementation((dirPath) => {
                if (dirPath === scanDir) return ['proj1'];
                return [];
            });

            fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });
            fs.readFileSync.mockReturnValue(JSON.stringify({
                hooks: { SessionStart: [{ hooks: [{ command: 'echo test' }] }] }
            }));

            writeJson.mockResolvedValue();

            await main();

            expect(console.log).toHaveBeenCalledWith('=== HOOKS SCAN RESULTS ===\n');
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Total projects with hooks:'));
            expect(writeJson).toHaveBeenCalled();
        });

        test('should handle empty results', async () => {
            fs.existsSync.mockReturnValue(false);
            fs.readdirSync.mockReturnValue([]);
            writeJson.mockResolvedValue();

            await main();

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Total projects with hooks: 0'));
        });
    });
});
