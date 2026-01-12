/**
 * Unit tests for cleanup-claude-json.js
 *
 * Target: 100% coverage (branches, functions, lines, statements)
 * Test count: 20 tests
 */

// Mock dependencies BEFORE importing module
jest.mock('fs');
jest.mock('os');

const fs = require('fs');
const os = require('os');
const path = require('path');

// Import functions to test
const {
    getClaudeJsonPath,
    getFileSizeMB,
    backupFile,
    cleanupStaleProjects,
    cleanupCaches,
    cleanupTipsHistory,
    cleanupProjectStats,
    cleanupBase64Content,
    main
} = require('../../utils/cleanup-claude-json');

describe('cleanup-claude-json.js - Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
    });

    /**
     * getClaudeJsonPath() tests (1 test)
     */
    describe('getClaudeJsonPath()', () => {
        test('should return path to ~/.claude.json', () => {
            os.homedir.mockReturnValue('/home/user');

            const result = getClaudeJsonPath();

            expect(result).toBe(path.join('/home/user', '.claude.json'));
        });
    });

    /**
     * getFileSizeMB() tests (2 tests)
     */
    describe('getFileSizeMB()', () => {
        test('should return file size in MB', () => {
            const filePath = '/path/to/file.json';

            fs.statSync.mockReturnValue({ size: 5242880 }); // 5 MB
            fs.existsSync.mockReturnValue(true);

            const result = getFileSizeMB(filePath);

            expect(result).toBeCloseTo(5.0, 1);
        });

        test('should return 0 if file does not exist', () => {
            const filePath = '/path/to/missing.json';

            fs.existsSync.mockReturnValue(false);

            const result = getFileSizeMB(filePath);

            expect(result).toBe(0);
        });
    });

    /**
     * backupFile() tests (2 tests)
     */
    describe('backupFile()', () => {
        test('should create timestamped backup', () => {
            const filePath = path.join('/home/user', '.claude.json');
            const mockDate = new Date('2026-01-12T15:30:00Z');

            // Mock Date constructor and methods
            const RealDate = Date;
            global.Date = class extends RealDate {
                constructor() {
                    return mockDate;
                }
                static now() {
                    return mockDate.getTime();
                }
            };
            global.Date.prototype = RealDate.prototype;

            fs.copyFileSync.mockReturnValue(undefined);

            const result = backupFile(filePath);

            expect(result).toContain('.claude.json.backup_');
            expect(result).toContain('202601');  // Year and month
            expect(fs.copyFileSync).toHaveBeenCalled();

            global.Date = RealDate;
        });

        test('should handle different timestamps', () => {
            const filePath = path.join('/home/user', '.claude.json');

            // Just verify it creates a backup with a timestamp
            fs.copyFileSync.mockReturnValue(undefined);

            const result = backupFile(filePath);

            expect(result).toContain('.claude.json.backup_');
            expect(result).toMatch(/\.claude\.json\.backup_\d{8}_\d{6}/);
            expect(fs.copyFileSync).toHaveBeenCalled();
        });
    });

    /**
     * cleanupStaleProjects() tests (3 tests)
     */
    describe('cleanupStaleProjects()', () => {
        test('should remove projects with non-existent paths', () => {
            const data = {
                projects: {
                    '/path/exists': { name: 'exists' },
                    '/path/missing': { name: 'missing' }
                }
            };

            fs.existsSync.mockImplementation((p) => p === '/path/exists');

            const removed = cleanupStaleProjects(data, false, false);

            expect(removed).toBe(1);
            expect(data.projects['/path/exists']).toBeDefined();
            expect(data.projects['/path/missing']).toBeUndefined();
        });

        test('should not modify data in dry-run mode', () => {
            const data = {
                projects: {
                    '/path/exists': { name: 'exists' },
                    '/path/missing': { name: 'missing' }
                }
            };

            fs.existsSync.mockImplementation((p) => p === '/path/exists');

            const removed = cleanupStaleProjects(data, true, false);

            expect(removed).toBe(1);
            expect(data.projects['/path/missing']).toBeDefined(); // Still there in dry-run
        });

        test('should print verbose output', () => {
            const data = {
                projects: {
                    '/path/missing': { name: 'missing' }
                }
            };

            fs.existsSync.mockReturnValue(false);

            cleanupStaleProjects(data, false, true);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[STALE]'));
        });
    });

    /**
     * cleanupCaches() tests (5 tests)
     */
    describe('cleanupCaches()', () => {
        test('should clear cachedStatsigGates', () => {
            const data = {
                cachedStatsigGates: { key1: 'value1', key2: 'value2' }
            };

            const cleaned = cleanupCaches(data, false, false);

            expect(cleaned).toBe(1);
            expect(data.cachedStatsigGates).toEqual({});
        });

        test('should clear cachedDynamicConfigs', () => {
            const data = {
                cachedDynamicConfigs: { config1: 'data1' }
            };

            const cleaned = cleanupCaches(data, false, false);

            expect(cleaned).toBe(1);
            expect(data.cachedDynamicConfigs).toEqual({});
        });

        test('should clear both caches when present', () => {
            const data = {
                cachedStatsigGates: { key1: 'value1' },
                cachedDynamicConfigs: { config1: 'data1' }
            };

            const cleaned = cleanupCaches(data, false, false);

            expect(cleaned).toBe(2);
            expect(data.cachedStatsigGates).toEqual({});
            expect(data.cachedDynamicConfigs).toEqual({});
        });

        test('should print verbose output for cachedStatsigGates', () => {
            const data = {
                cachedStatsigGates: { key1: 'value1' }
            };

            cleanupCaches(data, false, true);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[CACHE] cachedStatsigGates'));
        });

        test('should print verbose output for cachedDynamicConfigs', () => {
            const data = {
                cachedDynamicConfigs: { config1: 'data1' }
            };

            cleanupCaches(data, false, true);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[CACHE] cachedDynamicConfigs'));
        });
    });

    /**
     * cleanupTipsHistory() tests (3 tests)
     */
    describe('cleanupTipsHistory()', () => {
        test('should reset tipsHistory', () => {
            const data = {
                tipsHistory: { tip1: 5, tip2: 3 }
            };

            const result = cleanupTipsHistory(data, false, false);

            expect(result).toBe(1);
            expect(data.tipsHistory).toEqual({});
        });

        test('should return 0 if no tipsHistory', () => {
            const data = {};

            const result = cleanupTipsHistory(data, false, false);

            expect(result).toBe(0);
        });

        test('should print verbose output', () => {
            const data = {
                tipsHistory: { tip1: 5, tip2: 3 }
            };

            cleanupTipsHistory(data, false, true);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[TIPS]'));
        });
    });

    /**
     * cleanupProjectStats() tests (4 tests)
     */
    describe('cleanupProjectStats()', () => {
        test('should clear project stats keys', () => {
            const data = {
                projects: {
                    '/project1': {
                        name: 'Project 1',
                        lastCost: 100,
                        lastDuration: 5000,
                        lastTotalInputTokens: 1000
                    }
                }
            };

            const cleaned = cleanupProjectStats(data, false, false);

            expect(cleaned).toBe(3);
            expect(data.projects['/project1'].lastCost).toBeUndefined();
            expect(data.projects['/project1'].lastDuration).toBeUndefined();
            expect(data.projects['/project1'].name).toBe('Project 1'); // Non-stat key preserved
        });

        test('should handle multiple projects', () => {
            const data = {
                projects: {
                    '/project1': { lastCost: 100 },
                    '/project2': { lastDuration: 5000 }
                }
            };

            const cleaned = cleanupProjectStats(data, false, false);

            expect(cleaned).toBe(2);
        });

        test('should not modify in dry-run mode', () => {
            const data = {
                projects: {
                    '/project1': { lastCost: 100 }
                }
            };

            const cleaned = cleanupProjectStats(data, true, false);

            expect(cleaned).toBe(1);
            expect(data.projects['/project1'].lastCost).toBe(100); // Still there
        });

        test('should print verbose output', () => {
            const data = {
                projects: {
                    '/project1': { lastCost: 100 }
                }
            };

            cleanupProjectStats(data, false, true);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[STATS]'));
        });
    });

    /**
     * cleanupBase64Content() tests (5 tests)
     */
    describe('cleanupBase64Content()', () => {
        test('should remove data:image base64 strings', () => {
            const data = {
                content: 'data:image/png;base64,' + 'A'.repeat(2000)
            };

            const cleaned = cleanupBase64Content(data, false, false);

            expect(cleaned).toBe(1);
            expect(data.content).toBeUndefined();
        });

        test('should remove long base64-like strings', () => {
            const data = {
                largeField: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(300) // 7800 chars, all base64 chars
            };

            const cleaned = cleanupBase64Content(data, false, false);

            expect(cleaned).toBe(1);
            expect(data.largeField).toBeUndefined();
        });

        test('should handle nested objects recursively', () => {
            const data = {
                level1: {
                    level2: {
                        image: 'data:image/jpeg;base64,' + 'B'.repeat(2000)
                    }
                }
            };

            const cleaned = cleanupBase64Content(data, false, false);

            expect(cleaned).toBe(1);
            expect(data.level1.level2.image).toBeUndefined();
        });

        test('should handle arrays', () => {
            const data = {
                items: [
                    { image: 'data:image/png;base64,' + 'C'.repeat(2000) },
                    { text: 'normal text' }
                ]
            };

            const cleaned = cleanupBase64Content(data, false, false);

            expect(cleaned).toBe(1);
            expect(data.items[0].image).toBeUndefined();
            expect(data.items[1].text).toBe('normal text');
        });

        test('should print verbose output', () => {
            const data = {
                content: 'data:image/png;base64,' + 'A'.repeat(2000)
            };

            cleanupBase64Content(data, false, true);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[BASE64]'));
        });
    });

    /**
     * main() tests (4 tests)
     */
    describe('main()', () => {
        test('should return 1 if file does not exist', async () => {
            os.homedir.mockReturnValue('/home/user');
            fs.existsSync.mockReturnValue(false);

            const result = await main();

            expect(result).toBe(1);
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('File not found'));
        });

        test('should perform cleanup and save', async () => {
            os.homedir.mockReturnValue('/home/user');
            fs.existsSync.mockImplementation((p) => {
                if (p.includes('.claude.json')) return true;
                return p === '/path/exists';
            });
            fs.statSync.mockReturnValue({ size: 5242880 }); // 5 MB
            fs.readFileSync.mockReturnValue(JSON.stringify({
                projects: {
                    '/path/exists': { name: 'exists', lastCost: 100 },
                    '/path/missing': { name: 'missing' }
                },
                cachedStatsigGates: { key1: 'value1' },
                tipsHistory: { tip1: 5 }
            }));
            fs.writeFileSync.mockReturnValue(undefined);
            fs.copyFileSync.mockReturnValue(undefined);

            const result = await main();

            expect(result).toBe(0);
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Cleanup operations'));
        });

        test('should not save in dry-run mode', async () => {
            process.argv = ['node', 'script.js', '--dry-run'];

            os.homedir.mockReturnValue('/home/user');
            fs.existsSync.mockReturnValue(true);
            fs.statSync.mockReturnValue({ size: 1048576 }); // 1 MB
            fs.readFileSync.mockReturnValue(JSON.stringify({
                projects: {},
                cachedStatsigGates: {}
            }));

            const result = await main();

            expect(result).toBe(0);
            expect(fs.writeFileSync).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('DRY RUN'));

            process.argv = ['node', 'script.js']; // Reset
        });

        test('should warn if file exceeds size threshold', async () => {
            os.homedir.mockReturnValue('/home/user');
            fs.existsSync.mockReturnValue(true);
            fs.statSync.mockReturnValue({ size: 10485760 }); // 10 MB (exceeds 5 MB threshold)
            fs.readFileSync.mockReturnValue(JSON.stringify({
                projects: {},
                cachedStatsigGates: {}
            }));
            fs.writeFileSync.mockReturnValue(undefined);
            fs.copyFileSync.mockReturnValue(undefined);

            await main();

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('WARNING'));
        });
    });
});
