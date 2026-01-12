/**
 * Unit tests for set-terminal-title.js
 *
 * Target: 100% coverage (branches, functions, lines, statements)
 * Test count: 3 tests
 */

// Mock dependencies BEFORE importing module
jest.mock('path');
jest.mock('process');

const path = require('path');

// Import function to test
const { setTitle, getANSIEscapeSequence } = require('../../core/set-terminal-title');

describe('set-terminal-title.js - Unit Tests', () => {
    let mockStdoutWrite;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock process.stdout.write
        mockStdoutWrite = jest.fn();
        process.stdout.write = mockStdoutWrite;

        // Mock process.cwd()
        process.cwd = jest.fn().mockReturnValue('C:\\Users\\julien\\Projects\\my-project');
    });

    describe('getANSIEscapeSequence()', () => {
        test('should return correct ANSI escape sequence', () => {
            const folderName = 'my-project';

            const result = getANSIEscapeSequence(folderName);

            expect(result).toBe('\x1b]0;my-project\x07');
        });

        test('should handle folder names with spaces', () => {
            const folderName = 'My Project Folder';

            const result = getANSIEscapeSequence(folderName);

            expect(result).toBe('\x1b]0;My Project Folder\x07');
        });

        test('should handle empty folder name', () => {
            const folderName = '';

            const result = getANSIEscapeSequence(folderName);

            expect(result).toBe('\x1b]0;\x07');
        });
    });

    describe('setTitle()', () => {
        test('should extract folder name from current directory', () => {
            path.basename.mockReturnValue('my-project');

            setTitle();

            expect(path.basename).toHaveBeenCalledWith('C:\\Users\\julien\\Projects\\my-project');
            expect(mockStdoutWrite).toHaveBeenCalledWith('\x1b]0;my-project\x07');
        });

        test('should handle root directory', () => {
            process.cwd.mockReturnValue('C:\\');
            path.basename.mockReturnValue('C:\\');

            setTitle();

            expect(mockStdoutWrite).toHaveBeenCalledWith('\x1b]0;C:\\\x07');
        });

        test('should handle paths with special characters', () => {
            process.cwd.mockReturnValue('C:\\Users\\julien\\Projects\\my-project_v2.0');
            path.basename.mockReturnValue('my-project_v2.0');

            setTitle();

            expect(mockStdoutWrite).toHaveBeenCalledWith('\x1b]0;my-project_v2.0\x07');
        });
    });
});
