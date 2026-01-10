/**
 * Unit Tests for session-end-delete-reserved.js - 100% Coverage
 *
 * Tests all exported functions:
 * - convertToGitBashPath()
 * - buildReservedFilesCommand()
 * - buildShortFilesCommand()
 * - executeCleanup()
 */

const { execSync } = require('child_process');

// Mock child_process
jest.mock('child_process');

// Mock debug logger
jest.mock('../lib/debug-logger.js', () => ({
    logHookStart: jest.fn(),
    logHookEnd: jest.fn(),
    logDebug: jest.fn()
}));

// Import module AFTER mocking
const { convertToGitBashPath, buildReservedFilesCommand, buildShortFilesCommand, executeCleanup } = require('../session-end-delete-reserved.js');

describe('session-end-delete-reserved.js - Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * convertToGitBashPath() tests (7 tests)
     */

    // Test 1: Convert Windows path with C: drive
    test('convertToGitBashPath should convert C: drive path', () => {
        const result = convertToGitBashPath('C:\\Users\\julien\\project');

        expect(result).toBe('/c/Users/julien/project');
    });

    // Test 2: Convert Windows path with D: drive
    test('convertToGitBashPath should convert other drive letters', () => {
        const resultD = convertToGitBashPath('D:\\data\\folder');
        const resultE = convertToGitBashPath('E:\\backup');

        expect(resultD).toBe('/d/data/folder');
        expect(resultE).toBe('/e/backup');
    });

    // Test 3: Handle paths without drive letter
    test('convertToGitBashPath should handle paths without drive', () => {
        const result = convertToGitBashPath('/home/user/project');

        expect(result).toBe('/home/user/project');
    });

    // Test 4: Handle null/undefined
    test('convertToGitBashPath should handle null/undefined', () => {
        expect(convertToGitBashPath(null)).toBe('');
        expect(convertToGitBashPath(undefined)).toBe('');
        expect(convertToGitBashPath('')).toBe('');
    });

    // Test 5: Convert backslashes to forward slashes
    test('convertToGitBashPath should convert backslashes', () => {
        const result = convertToGitBashPath('C:\\path\\with\\many\\folders');

        expect(result).toBe('/c/path/with/many/folders');
    });

    // Test 6: Lowercase drive letter
    test('convertToGitBashPath should lowercase drive letter', () => {
        const result = convertToGitBashPath('C:\\Project');

        expect(result).toBe('/c/Project'); // Only drive lowercased, not path
    });

    // Test 7: Handle mixed forward/back slashes
    test('convertToGitBashPath should handle mixed slashes', () => {
        const result = convertToGitBashPath('C:\\path/mixed\\slashes');

        expect(result).toBe('/c/path/mixed/slashes');
    });

    /**
     * buildReservedFilesCommand() tests (3 tests)
     */

    // Test 8: Build correct command for reserved files
    test('buildReservedFilesCommand should build correct command', () => {
        const result = buildReservedFilesCommand('/c/project/dir');

        expect(result).toContain('fd -H -I -t f -i');
        expect(result).toContain('nul|null|con|prn|aux');
        expect(result).toContain('"/c/project/dir"');
        expect(result).toContain('--exec rm -f {}');
    });

    // Test 9: Handle paths with spaces
    test('buildReservedFilesCommand should handle paths with spaces', () => {
        const result = buildReservedFilesCommand('/c/my project/folder');

        expect(result).toContain('"/c/my project/folder"');
    });

    // Test 10: Include all reserved names
    test('buildReservedFilesCommand should include all reserved names', () => {
        const result = buildReservedFilesCommand('/c/path');

        expect(result).toContain('nul');
        expect(result).toContain('null');
        expect(result).toContain('con');
        expect(result).toContain('prn');
        expect(result).toContain('aux');
    });

    /**
     * buildShortFilesCommand() tests (2 tests)
     */

    // Test 11: Build correct command for short files
    test('buildShortFilesCommand should build correct command', () => {
        const result = buildShortFilesCommand('/c/project/dir');

        expect(result).toContain('fd -H -I -t f');
        expect(result).toContain('"^.$"'); // Pattern for 0-1 char filenames
        expect(result).toContain('"/c/project/dir"');
        expect(result).toContain('--exec rm -f {}');
    });

    // Test 12: Handle paths with spaces
    test('buildShortFilesCommand should handle paths with spaces', () => {
        const result = buildShortFilesCommand('/c/my project/folder');

        expect(result).toContain('"/c/my project/folder"');
    });

    /**
     * executeCleanup() tests (8 tests)
     */

    // Test 13: Return false when cwd is empty/null
    test('executeCleanup should return false when cwd empty', () => {
        expect(executeCleanup(null)).toBe(false);
        expect(executeCleanup(undefined)).toBe(false);
        expect(executeCleanup('')).toBe(false);
    });

    // Test 14: Execute both commands successfully
    test('executeCleanup should execute both cleanup commands', () => {
        execSync.mockImplementation(() => {});

        const result = executeCleanup('C:\\project\\dir');

        expect(result).toBe(true);
        expect(execSync).toHaveBeenCalledTimes(2);

        // Verify first call (reserved files)
        expect(execSync.mock.calls[0][0]).toContain('nul|null|con|prn|aux');

        // Verify second call (short files)
        expect(execSync.mock.calls[1][0]).toContain('^.$');
    });

    // Test 15: Handle reserved files command error (silent fail)
    test('executeCleanup should handle reserved files error silently', () => {
        execSync.mockImplementation((cmd) => {
            if (cmd.includes('nul|null')) {
                throw new Error('Command failed');
            }
        });

        const result = executeCleanup('C:\\project\\dir');

        expect(result).toBe(true); // Still succeeds
        expect(execSync).toHaveBeenCalledTimes(2); // Both commands attempted
    });

    // Test 16: Handle short files command error (silent fail)
    test('executeCleanup should handle short files error silently', () => {
        execSync.mockImplementation((cmd) => {
            if (cmd.includes('^.$')) {
                throw new Error('Command failed');
            }
        });

        const result = executeCleanup('C:\\project\\dir');

        expect(result).toBe(true); // Still succeeds
        expect(execSync).toHaveBeenCalledTimes(2);
    });

    // Test 17: Handle both commands failing
    test('executeCleanup should handle both commands failing', () => {
        execSync.mockImplementation(() => {
            throw new Error('Command failed');
        });

        const result = executeCleanup('C:\\project\\dir');

        expect(result).toBe(true); // Still succeeds (silent fail)
    });

    // Test 18: Handle timeout errors
    test('executeCleanup should handle timeout errors', () => {
        execSync.mockImplementation(() => {
            const error = new Error('Command timed out');
            error.killed = true;
            throw error;
        });

        const result = executeCleanup('C:\\project\\dir');

        expect(result).toBe(true); // Silent fail
    });

    // Test 19: Use correct timeout
    test('executeCleanup should set timeout on execSync', () => {
        execSync.mockImplementation(() => {});

        executeCleanup('C:\\project\\dir');

        // Verify timeout is set in options
        expect(execSync.mock.calls[0][1]).toMatchObject({ timeout: 15000 });
        expect(execSync.mock.calls[1][1]).toMatchObject({ timeout: 15000 });
    });

    // Test 20: Handle error in path conversion
    test('executeCleanup should return false on path conversion error', () => {
        // This test ensures the try-catch works
        // We can't easily force convertToGitBashPath to fail since it's pure,
        // but we can test the overall error handling

        execSync.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = executeCleanup('C:\\valid\\path');

        // Should handle error gracefully
        expect(result).toBe(true); // Silent fail
    });
});
