/**
 * Unit tests for file-utils.js
 *
 * Target: 100% coverage (branches, functions, lines, statements)
 * Test count: ~10-12 tests
 */

const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const crypto = require('crypto');

// Import functions to test
const {
    readJson,
    writeJson,
    computeHash,
    expandPath,
    fileExists,
    readFile,
    getStats,
    ensureDir
} = require('../../lib/file-utils');

describe('file-utils.js - Unit Tests', () => {
    /**
     * computeHash() tests (2 tests)
     * SHA256 content hashing - pure function, no mocking needed
     */
    describe('computeHash()', () => {
        test('should return SHA256 hash (16 chars)', () => {
            const content = 'test content';

            const hash = computeHash(content);

            expect(hash).toHaveLength(16);
            expect(typeof hash).toBe('string');
            // Verify it's a valid hex string
            expect(hash).toMatch(/^[a-f0-9]{16}$/);
        });

        test('should return same hash for same content', () => {
            const content = 'consistent content';

            const hash1 = computeHash(content);
            const hash2 = computeHash(content);

            expect(hash1).toBe(hash2);
        });

        test('should return different hashes for different content', () => {
            const content1 = 'content one';
            const content2 = 'content two';

            const hash1 = computeHash(content1);
            const hash2 = computeHash(content2);

            expect(hash1).not.toBe(hash2);
        });
    });

    /**
     * expandPath() tests (3 tests)
     * Path expansion and resolution - pure function
     */
    describe('expandPath()', () => {
        test('should resolve ~ to home directory', () => {
            const homedir = os.homedir();
            const result = expandPath('~/.config/file.json');

            expect(result).toBe(path.join(homedir, '.config', 'file.json'));
        });

        test('should resolve relative paths to absolute', () => {
            const result = expandPath('./relative/path');

            expect(path.isAbsolute(result)).toBe(true);
            expect(result).toContain('relative');
            expect(result).toContain('path');
        });

        test('should return absolute paths as absolute', () => {
            const absolutePath = path.resolve('/absolute/path/file.json');
            const result = expandPath(absolutePath);

            expect(path.isAbsolute(result)).toBe(true);
        });
    });

    /**
     * Integration tests with real file system
     * These test actual file operations
     */
    describe('Integration tests', () => {
        const testDir = path.join(os.tmpdir(), 'file-utils-test-' + Date.now());
        const testFile = path.join(testDir, 'test.json');

        beforeAll(async () => {
            await fs.mkdir(testDir, { recursive: true });
        });

        afterAll(async () => {
            try {
                await fs.rm(testDir, { recursive: true, force: true });
            } catch (e) {
                // Ignore cleanup errors
            }
        });

        describe('writeJson() and readJson()', () => {
            test('should write and read JSON file', async () => {
                const data = { name: 'test', value: 123, nested: { key: 'value' } };

                await writeJson(testFile, data);
                const result = await readJson(testFile);

                expect(result).toEqual(data);
            });

            test('should return null for missing file', async () => {
                const result = await readJson(path.join(testDir, 'missing.json'));

                expect(result).toBeNull();
            });

            test('should format JSON with indentation', async () => {
                const data = { key: 'value' };

                await writeJson(testFile, data);
                const fileContent = await fs.readFile(testFile, 'utf8');

                expect(fileContent).toContain('\n');
                expect(fileContent).toContain('  ');
            });
        });

        describe('fileExists()', () => {
            test('should return true for existing file', async () => {
                await fs.writeFile(testFile, 'test');

                const result = await fileExists(testFile);

                expect(result).toBe(true);
            });

            test('should return false for missing file', async () => {
                const result = await fileExists(path.join(testDir, 'missing.txt'));

                expect(result).toBe(false);
            });
        });

        describe('readFile()', () => {
            test('should read file contents', async () => {
                const content = 'test file content';
                await fs.writeFile(testFile, content);

                const result = await readFile(testFile);

                expect(result).toBe(content);
            });
        });

        describe('getStats()', () => {
            test('should return file stats', async () => {
                await fs.writeFile(testFile, 'test');

                const stats = await getStats(testFile);

                expect(stats).toBeDefined();
                expect(stats.size).toBeGreaterThan(0);
                expect(stats.mtimeMs).toBeGreaterThan(0);
            });

            test('should return null for missing file', async () => {
                const stats = await getStats(path.join(testDir, 'missing.txt'));

                expect(stats).toBeNull();
            });
        });

        describe('ensureDir()', () => {
            test('should create directory recursively', async () => {
                const newDir = path.join(testDir, 'nested', 'deep', 'dir');

                await ensureDir(newDir);

                const exists = await fileExists(newDir);
                expect(exists).toBe(true);
            });

            test('should not fail if directory already exists', async () => {
                await ensureDir(testDir);

                // Should not throw
                await expect(ensureDir(testDir)).resolves.not.toThrow();
            });
        });
    });
});
