/**
 * Unit Tests for precompact-save-chunk.js - 100% Coverage
 *
 * Tests all exported functions:
 * - saveTranscriptChunk()
 * - getNextChunkNumber()
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock fs and os
jest.mock('fs');
jest.mock('os');

// Mock debug logger
jest.mock('../lib/debug-logger.js', () => ({
    logHookStart: jest.fn(),
    logHookEnd: jest.fn(),
    logDebug: jest.fn()
}));

// Import module AFTER mocking
const { saveTranscriptChunk, getNextChunkNumber, CHUNKS_DIR } = require('../precompact-save-chunk.js');

describe('precompact-save-chunk.js - Unit Tests', () => {
    const mockChunksDir = path.join(global.TEST_CLAUDE_HOME, '.claude', 'memory-chunks');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * saveTranscriptChunk() tests (12 tests)
     */

    // Test 1: Return false when transcript doesn't exist
    test('saveTranscriptChunk should return false when transcript not exists', () => {
        fs.existsSync.mockReturnValue(false);

        const result = saveTranscriptChunk('/fake/transcript.jsonl', 'session123', 1);

        expect(result).toBe(false);
        expect(fs.copyFileSync).not.toHaveBeenCalled();
    });

    // Test 2: Successfully save chunk when transcript exists
    test('saveTranscriptChunk should save chunk when transcript exists', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path === '/fake/transcript.jsonl') return true;
            if (path === mockChunksDir) return true;
            if (path.endsWith('_index.json')) return false;
            return false;
        });

        fs.statSync.mockReturnValue({ size: 1234 });
        fs.copyFileSync.mockImplementation(() => {});
        fs.mkdirSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});

        const result = saveTranscriptChunk('/fake/transcript.jsonl', 'session123', 1);

        expect(result).toBe(true);
        expect(fs.copyFileSync).toHaveBeenCalledWith(
            '/fake/transcript.jsonl',
            expect.stringContaining('session123_chunk_001.jsonl')
        );
    });

    // Test 3: Create CHUNKS_DIR if it doesn't exist
    test('saveTranscriptChunk should create CHUNKS_DIR if not exists', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path === '/fake/transcript.jsonl') return true;
            if (path === mockChunksDir) return false; // Dir doesn't exist
            if (path.endsWith('_index.json')) return false;
            return false;
        });

        fs.statSync.mockReturnValue({ size: 1234 });
        fs.copyFileSync.mockImplementation(() => {});
        fs.mkdirSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});

        saveTranscriptChunk('/fake/transcript.jsonl', 'session123', 1);

        expect(fs.mkdirSync).toHaveBeenCalledWith(mockChunksDir, { recursive: true });
    });

    // Test 4: Use correct chunk filename format (zero-padded)
    test('saveTranscriptChunk should use zero-padded chunk numbers', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path === '/fake/transcript.jsonl') return true;
            if (path === mockChunksDir) return true;
            if (path.endsWith('_index.json')) return false;
            return false;
        });

        fs.statSync.mockReturnValue({ size: 1234 });
        fs.copyFileSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});

        saveTranscriptChunk('/fake/transcript.jsonl', 'session123', 5);

        expect(fs.copyFileSync).toHaveBeenCalledWith(
            '/fake/transcript.jsonl',
            expect.stringContaining('session123_chunk_005.jsonl')
        );
    });

    // Test 5: Create new index when it doesn't exist
    test('saveTranscriptChunk should create new index when not exists', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path === '/fake/transcript.jsonl') return true;
            if (path === mockChunksDir) return true;
            if (path.endsWith('_index.json')) return false; // Index doesn't exist
            return false;
        });

        fs.statSync.mockReturnValue({ size: 1234 });
        fs.copyFileSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});

        saveTranscriptChunk('/fake/transcript.jsonl', 'session123', 1);

        const writeCall = fs.writeFileSync.mock.calls.find(call => call[0].endsWith('_index.json'));
        expect(writeCall).toBeDefined();
        const writtenIndex = JSON.parse(writeCall[1]);
        expect(writtenIndex).toHaveLength(1);
        expect(writtenIndex[0].chunk_number).toBe(1);
    });

    // Test 6: Append to existing index
    test('saveTranscriptChunk should append to existing index', () => {
        const existingIndex = [
            { chunk_number: 1, filename: 'session123_chunk_001.jsonl', timestamp: '2024-01-01T10:00:00Z', size: 1000 }
        ];

        fs.existsSync.mockImplementation((path) => {
            if (path === '/fake/transcript.jsonl') return true;
            if (path === mockChunksDir) return true;
            if (path.endsWith('_index.json')) return true; // Index exists
            return false;
        });

        fs.readFileSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) {
                return JSON.stringify(existingIndex);
            }
            return '';
        });

        fs.statSync.mockReturnValue({ size: 1234 });
        fs.copyFileSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});

        saveTranscriptChunk('/fake/transcript.jsonl', 'session123', 2);

        const writeCall = fs.writeFileSync.mock.calls.find(call => call[0].endsWith('_index.json'));
        const writtenIndex = JSON.parse(writeCall[1]);
        expect(writtenIndex).toHaveLength(2);
        expect(writtenIndex[1].chunk_number).toBe(2);
    });

    // Test 7: Handle corrupted index file gracefully
    test('saveTranscriptChunk should handle corrupted index', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path === '/fake/transcript.jsonl') return true;
            if (path === mockChunksDir) return true;
            if (path.endsWith('_index.json')) return true; // Index exists but corrupted
            return false;
        });

        fs.readFileSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) {
                return 'invalid json {{{';
            }
            return '';
        });

        fs.statSync.mockReturnValue({ size: 1234 });
        fs.copyFileSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});

        const result = saveTranscriptChunk('/fake/transcript.jsonl', 'session123', 1);

        expect(result).toBe(true);
        // Should create new index (ignoring corrupted one)
        const writeCall = fs.writeFileSync.mock.calls.find(call => call[0].endsWith('_index.json'));
        const writtenIndex = JSON.parse(writeCall[1]);
        expect(writtenIndex).toHaveLength(1);
    });

    // Test 8: Record correct metadata in index
    test('saveTranscriptChunk should record correct metadata', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path === '/fake/transcript.jsonl') return true;
            if (path === mockChunksDir) return true;
            if (path.endsWith('_index.json')) return false;
            return false;
        });

        fs.statSync.mockReturnValue({ size: 5678 });
        fs.copyFileSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});

        saveTranscriptChunk('/fake/transcript.jsonl', 'session123', 3);

        const writeCall = fs.writeFileSync.mock.calls.find(call => call[0].endsWith('_index.json'));
        const writtenIndex = JSON.parse(writeCall[1]);
        expect(writtenIndex[0]).toMatchObject({
            chunk_number: 3,
            filename: 'session123_chunk_003.jsonl',
            size: 5678
        });
        expect(writtenIndex[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    // Test 9: Handle file copy errors
    test('saveTranscriptChunk should handle copy errors', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path === '/fake/transcript.jsonl') return true;
            return true;
        });

        fs.copyFileSync.mockImplementation(() => {
            throw new Error('EACCES: permission denied');
        });

        const result = saveTranscriptChunk('/fake/transcript.jsonl', 'session123', 1);

        expect(result).toBe(false);
    });

    // Test 10: Handle directory creation errors
    test('saveTranscriptChunk should handle mkdir errors', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path === '/fake/transcript.jsonl') return true;
            if (path === mockChunksDir) return false; // Dir doesn't exist
            return false;
        });

        fs.mkdirSync.mockImplementation(() => {
            throw new Error('EACCES: permission denied');
        });

        const result = saveTranscriptChunk('/fake/transcript.jsonl', 'session123', 1);

        expect(result).toBe(false);
    });

    // Test 11: Handle index write errors
    test('saveTranscriptChunk should handle index write errors', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path === '/fake/transcript.jsonl') return true;
            if (path === mockChunksDir) return true;
            if (path.endsWith('_index.json')) return false;
            return false;
        });

        fs.statSync.mockReturnValue({ size: 1234 });
        fs.copyFileSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) {
                throw new Error('ENOSPC: no space left');
            }
        });

        const result = saveTranscriptChunk('/fake/transcript.jsonl', 'session123', 1);

        expect(result).toBe(false);
    });

    // Test 12: Handle stat errors
    test('saveTranscriptChunk should handle stat errors', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path === '/fake/transcript.jsonl') return true;
            if (path === mockChunksDir) return true;
            if (path.endsWith('_index.json')) return false;
            return false;
        });

        fs.copyFileSync.mockImplementation(() => {});
        fs.statSync.mockImplementation(() => {
            throw new Error('ENOENT: file not found');
        });

        const result = saveTranscriptChunk('/fake/transcript.jsonl', 'session123', 1);

        expect(result).toBe(false);
    });

    /**
     * getNextChunkNumber() tests (6 tests)
     */

    // Test 13: Return 1 when index doesn't exist
    test('getNextChunkNumber should return 1 when index not exists', () => {
        fs.existsSync.mockReturnValue(false);

        const result = getNextChunkNumber('session123');

        expect(result).toBe(1);
    });

    // Test 14: Return 1 when index is empty
    test('getNextChunkNumber should return 1 when index is empty', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('[]');

        const result = getNextChunkNumber('session123');

        expect(result).toBe(1);
    });

    // Test 15: Return max + 1 when index has entries
    test('getNextChunkNumber should return max + 1', () => {
        const index = [
            { chunk_number: 1, filename: 'session123_chunk_001.jsonl' },
            { chunk_number: 3, filename: 'session123_chunk_003.jsonl' },
            { chunk_number: 2, filename: 'session123_chunk_002.jsonl' }
        ];

        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(index));

        const result = getNextChunkNumber('session123');

        expect(result).toBe(4); // max(1, 3, 2) + 1
    });

    // Test 16: Handle corrupted index file
    test('getNextChunkNumber should handle corrupted index', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('invalid json {{{');

        const result = getNextChunkNumber('session123');

        expect(result).toBe(1);
    });

    // Test 17: Handle missing chunk_number in entries
    test('getNextChunkNumber should handle missing chunk_number', () => {
        const index = [
            { chunk_number: 2, filename: 'session123_chunk_002.jsonl' },
            { filename: 'session123_chunk_003.jsonl' }, // missing chunk_number
            { chunk_number: null, filename: 'session123_chunk_004.jsonl' } // null chunk_number
        ];

        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(index));

        const result = getNextChunkNumber('session123');

        expect(result).toBe(3); // max(2, 0, 0) + 1
    });

    // Test 18: Handle file read errors
    test('getNextChunkNumber should handle read errors', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockImplementation(() => {
            throw new Error('EACCES: permission denied');
        });

        const result = getNextChunkNumber('session123');

        expect(result).toBe(1);
    });
});
