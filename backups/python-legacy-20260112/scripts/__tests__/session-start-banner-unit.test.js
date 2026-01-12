/**
 * Unit Tests for session-start-banner.js - 100% Coverage
 *
 * Tests all three exported functions:
 * - getProjectName()
 * - getSkillCount()
 * - loadRelevantMemories()
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Mock all external dependencies
jest.mock('fs');
jest.mock('os');
jest.mock('child_process');

// Mock debug logger
jest.mock('../lib/debug-logger.js', () => ({
    logHookStart: jest.fn(),
    logHookEnd: jest.fn(),
    logDebug: jest.fn()
}));

// Import module AFTER mocking
const { getProjectName, getSkillCount, loadRelevantMemories } = require('../session-start-banner.js');
const { logDebug } = require('../lib/debug-logger.js');

describe('session-start-banner.js - Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default mocks
        os.homedir.mockReturnValue('/mock/home');
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('{"skills":{}}');
        execSync.mockReturnValue('');

        // Mock process.cwd
        jest.spyOn(process, 'cwd').mockReturnValue('/mock/project');

        // Clear env var
        delete process.env.CLAUDE_PROJECT_DIR;
    });

    afterEach(() => {
        process.cwd.mockRestore();
    });

    /**
     * getProjectName() tests (2 tests - 2 branches)
     */

    // Test 1: Use CLAUDE_PROJECT_DIR when set
    test('getProjectName should use CLAUDE_PROJECT_DIR when set', () => {
        process.env.CLAUDE_PROJECT_DIR = '/custom/project/path';

        const result = getProjectName();

        expect(result).toBe('path');
        expect(path.basename('/custom/project/path')).toBe('path');
    });

    // Test 2: Use cwd when CLAUDE_PROJECT_DIR not set
    test('getProjectName should use cwd when CLAUDE_PROJECT_DIR not set', () => {
        delete process.env.CLAUDE_PROJECT_DIR;
        process.cwd.mockReturnValue('/current/working/dir');

        const result = getProjectName();

        expect(result).toBe('dir');
    });

    /**
     * getSkillCount() tests (7 tests - multiple branches)
     */

    // Test 3: Return skill count when registry exists with skills
    test('getSkillCount should return count when registry exists with skills', () => {
        const mockRegistry = {
            skills: {
                'skill1': {},
                'skill2': {},
                'skill3': {}
            }
        };

        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistry));

        const result = getSkillCount();

        expect(result).toBe(3);
        expect(logDebug).toHaveBeenCalledWith(
            'SessionStart',
            'session-start-banner.js',
            'Found 3 skills in registry',
            'INFO'
        );
    });

    // Test 4: Return 0 when registry exists with empty skills
    test('getSkillCount should return 0 when skills object is empty', () => {
        const mockRegistry = {
            skills: {}
        };

        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistry));

        const result = getSkillCount();

        expect(result).toBe(0);
        expect(logDebug).toHaveBeenCalledWith(
            'SessionStart',
            'session-start-banner.js',
            'Found 0 skills in registry',
            'INFO'
        );
    });

    // Test 5: Handle missing skills property (use default empty object)
    test('getSkillCount should handle missing skills property', () => {
        const mockRegistry = {};

        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistry));

        const result = getSkillCount();

        expect(result).toBe(0);
    });

    // Test 6: Return null when registry does not exist
    test('getSkillCount should return null when registry does not exist', () => {
        fs.existsSync.mockReturnValue(false);

        const result = getSkillCount();

        expect(result).toBeNull();
        expect(logDebug).toHaveBeenCalledWith(
            'SessionStart',
            'session-start-banner.js',
            'Registry not found',
            'SKIP'
        );
    });

    // Test 7: Handle JSON parse error
    test('getSkillCount should handle JSON parse error', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('invalid json {{{');

        const result = getSkillCount();

        expect(result).toBeNull();
        expect(logDebug).toHaveBeenCalledWith(
            'SessionStart',
            'session-start-banner.js',
            expect.stringContaining('Error reading registry'),
            'ERROR'
        );
    });

    // Test 8: Handle fs.readFileSync error
    test('getSkillCount should handle file read error', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockImplementation(() => {
            throw new Error('EACCES: permission denied');
        });

        const result = getSkillCount();

        expect(result).toBeNull();
        expect(logDebug).toHaveBeenCalledWith(
            'SessionStart',
            'session-start-banner.js',
            'Error reading registry: EACCES: permission denied',
            'ERROR'
        );
    });

    // Test 9: Handle skills property as null
    test('getSkillCount should handle skills property as null', () => {
        const mockRegistry = {
            skills: null
        };

        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistry));

        const result = getSkillCount();

        expect(result).toBe(0);
    });

    /**
     * loadRelevantMemories() tests (6 tests - multiple branches)
     */

    // Test 10: Load memories when Claude Mem available with results
    test('loadRelevantMemories should load memories when available', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        // Mock Claude Mem paths exist
        fs.existsSync.mockImplementation((path) => {
            if (path.includes('search.py') || path.includes('python.exe')) {
                return true;
            }
            return false;
        });

        // Mock execSync to return memory results
        execSync.mockReturnValue('session1\nsession2\n====\nsession3\n');

        loadRelevantMemories('test-project');

        expect(execSync).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('\n📚 3 session(s) similaire(s) trouvée(s)');
        expect(consoleSpy).toHaveBeenCalledWith('   Use /system:semantic-memory-search for details');
        expect(logDebug).toHaveBeenCalledWith(
            'SessionStart',
            'session-start-banner.js',
            'Loaded 3 memories',
            'OUTPUT'
        );

        consoleSpy.mockRestore();
    });

    // Test 11: Skip when no memories found (empty result)
    test('loadRelevantMemories should skip when no memories found', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        fs.existsSync.mockImplementation((path) => {
            if (path.includes('search.py') || path.includes('python.exe')) {
                return true;
            }
            return false;
        });

        // Empty result
        execSync.mockReturnValue('');

        loadRelevantMemories('test-project');

        expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('session(s) similaire(s)'));

        consoleSpy.mockRestore();
    });

    // Test 12: Skip when memory count is 0 (only separator lines)
    test('loadRelevantMemories should skip when memory count is 0', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        fs.existsSync.mockImplementation((path) => {
            if (path.includes('search.py') || path.includes('python.exe')) {
                return true;
            }
            return false;
        });

        // Only separator lines (filtered out)
        execSync.mockReturnValue('====\n=====\n');

        loadRelevantMemories('test-project');

        expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('session(s) similaire(s)'));

        consoleSpy.mockRestore();
    });

    // Test 13: Skip when search script does not exist
    test('loadRelevantMemories should skip when search script does not exist', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path.includes('search.py')) {
                return false; // Script does not exist
            }
            if (path.includes('python.exe')) {
                return true;
            }
            return false;
        });

        loadRelevantMemories('test-project');

        expect(execSync).not.toHaveBeenCalled();
        expect(logDebug).toHaveBeenCalledWith(
            'SessionStart',
            'session-start-banner.js',
            'Claude Mem not available',
            'SKIP'
        );
    });

    // Test 14: Skip when python exe does not exist
    test('loadRelevantMemories should skip when python exe does not exist', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path.includes('search.py')) {
                return true;
            }
            if (path.includes('python.exe')) {
                return false; // Python exe does not exist
            }
            return false;
        });

        loadRelevantMemories('test-project');

        expect(execSync).not.toHaveBeenCalled();
        expect(logDebug).toHaveBeenCalledWith(
            'SessionStart',
            'session-start-banner.js',
            'Claude Mem not available',
            'SKIP'
        );
    });

    // Test 15: Handle execSync error (timeout or command failure)
    test('loadRelevantMemories should handle execSync error', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path.includes('search.py') || path.includes('python.exe')) {
                return true;
            }
            return false;
        });

        execSync.mockImplementation(() => {
            throw new Error('ETIMEDOUT: command timed out');
        });

        loadRelevantMemories('test-project');

        expect(logDebug).toHaveBeenCalledWith(
            'SessionStart',
            'session-start-banner.js',
            'Error loading memories: ETIMEDOUT: command timed out',
            'ERROR'
        );
    });
});
