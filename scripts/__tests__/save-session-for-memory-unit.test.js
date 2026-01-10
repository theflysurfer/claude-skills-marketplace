/**
 * Unit Tests for save-session-for-memory.js - 100% Coverage
 *
 * Tests all exported functions:
 * - assembleFullTranscript()
 * - extractSemanticContent()
 * - cleanupChunks()
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
const { assembleFullTranscript, extractSemanticContent, cleanupChunks, CHUNKS_DIR } = require('../save-session-for-memory.js');

describe('save-session-for-memory.js - Unit Tests', () => {
    const mockChunksDir = path.join(global.TEST_CLAUDE_HOME, '.claude', 'memory-chunks');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * assembleFullTranscript() tests (12 tests)
     */

    // Test 1: Return empty array when no chunks and no transcript
    test('assembleFullTranscript should return empty when no data', () => {
        fs.existsSync.mockReturnValue(false);

        const result = assembleFullTranscript('session123', '/fake/transcript.jsonl');

        expect(result).toEqual([]);
    });

    // Test 2: Load chunks from index
    test('assembleFullTranscript should load chunks from index', () => {
        const mockIndex = [
            { chunk_number: 1, filename: 'session123_chunk_001.jsonl' }
        ];

        const mockChunkContent = [
            JSON.stringify({ role: 'user', content: 'test message 1' }),
            JSON.stringify({ role: 'assistant', content: 'response 1' })
        ].join('\n');

        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return true;
            if (path.endsWith('_chunk_001.jsonl')) return true;
            if (path === '/fake/transcript.jsonl') return false;
            return false;
        });

        fs.readFileSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return JSON.stringify(mockIndex);
            if (path.endsWith('_chunk_001.jsonl')) return mockChunkContent;
            return '';
        });

        const result = assembleFullTranscript('session123', '/fake/transcript.jsonl');

        expect(result).toHaveLength(2);
        expect(result[0].role).toBe('user');
        expect(result[1].role).toBe('assistant');
    });

    // Test 3: Sort chunks by chunk_number
    test('assembleFullTranscript should sort chunks by number', () => {
        const mockIndex = [
            { chunk_number: 3, filename: 'session123_chunk_003.jsonl' },
            { chunk_number: 1, filename: 'session123_chunk_001.jsonl' },
            { chunk_number: 2, filename: 'session123_chunk_002.jsonl' }
        ];

        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return true;
            if (path.includes('_chunk_')) return true;
            if (path === '/fake/transcript.jsonl') return false;
            return false;
        });

        fs.readFileSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return JSON.stringify(mockIndex);
            if (path.endsWith('_chunk_001.jsonl')) return JSON.stringify({ order: 1 });
            if (path.endsWith('_chunk_002.jsonl')) return JSON.stringify({ order: 2 });
            if (path.endsWith('_chunk_003.jsonl')) return JSON.stringify({ order: 3 });
            return '';
        });

        const result = assembleFullTranscript('session123', '/fake/transcript.jsonl');

        expect(result).toHaveLength(3);
        expect(result[0].order).toBe(1);
        expect(result[1].order).toBe(2);
        expect(result[2].order).toBe(3);
    });

    // Test 4: Skip malformed JSON lines in chunks
    test('assembleFullTranscript should skip malformed JSON in chunks', () => {
        const mockIndex = [{ chunk_number: 1, filename: 'session123_chunk_001.jsonl' }];
        const mockChunkContent = [
            JSON.stringify({ role: 'user', content: 'valid' }),
            'invalid json {{{',
            JSON.stringify({ role: 'assistant', content: 'valid' })
        ].join('\n');

        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return true;
            if (path.endsWith('_chunk_001.jsonl')) return true;
            if (path === '/fake/transcript.jsonl') return false;
            return false;
        });

        fs.readFileSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return JSON.stringify(mockIndex);
            if (path.endsWith('_chunk_001.jsonl')) return mockChunkContent;
            return '';
        });

        const result = assembleFullTranscript('session123', '/fake/transcript.jsonl');

        expect(result).toHaveLength(2); // Only valid entries
    });

    // Test 5: Load final transcript
    test('assembleFullTranscript should load final transcript', () => {
        const mockTranscript = [
            JSON.stringify({ role: 'user', content: 'final message' })
        ].join('\n');

        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return false;
            if (path === '/fake/transcript.jsonl') return true;
            return false;
        });

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = assembleFullTranscript('session123', '/fake/transcript.jsonl');

        expect(result).toHaveLength(1);
        expect(result[0].content).toBe('final message');
    });

    // Test 6: Combine chunks and final transcript
    test('assembleFullTranscript should combine chunks and final transcript', () => {
        const mockIndex = [{ chunk_number: 1, filename: 'session123_chunk_001.jsonl' }];
        const mockChunkContent = JSON.stringify({ role: 'user', content: 'from chunk' });
        const mockTranscript = JSON.stringify({ role: 'user', content: 'from transcript' });

        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return true;
            if (path.endsWith('_chunk_001.jsonl')) return true;
            if (path === '/fake/transcript.jsonl') return true;
            return false;
        });

        fs.readFileSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return JSON.stringify(mockIndex);
            if (path.endsWith('_chunk_001.jsonl')) return mockChunkContent;
            if (path === '/fake/transcript.jsonl') return mockTranscript;
            return '';
        });

        const result = assembleFullTranscript('session123', '/fake/transcript.jsonl');

        expect(result).toHaveLength(2);
        expect(result[0].content).toBe('from chunk');
        expect(result[1].content).toBe('from transcript');
    });

    // Test 7: Handle missing chunk files
    test('assembleFullTranscript should skip missing chunk files', () => {
        const mockIndex = [
            { chunk_number: 1, filename: 'session123_chunk_001.jsonl' },
            { chunk_number: 2, filename: 'session123_chunk_002.jsonl' }
        ];

        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return true;
            if (path.endsWith('_chunk_001.jsonl')) return true;
            if (path.endsWith('_chunk_002.jsonl')) return false; // Missing!
            if (path === '/fake/transcript.jsonl') return false;
            return false;
        });

        fs.readFileSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return JSON.stringify(mockIndex);
            if (path.endsWith('_chunk_001.jsonl')) return JSON.stringify({ role: 'user' });
            return '';
        });

        const result = assembleFullTranscript('session123', '/fake/transcript.jsonl');

        expect(result).toHaveLength(1); // Only chunk 1 loaded
    });

    // Test 8: Handle corrupted index JSON
    test('assembleFullTranscript should handle corrupted index', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return true;
            if (path === '/fake/transcript.jsonl') return false;
            return false;
        });

        fs.readFileSync.mockReturnValue('invalid json {{{');

        const result = assembleFullTranscript('session123', '/fake/transcript.jsonl');

        expect(result).toEqual([]);
    });

    // Test 9: Handle chunk read errors
    test('assembleFullTranscript should handle chunk read errors', () => {
        const mockIndex = [{ chunk_number: 1, filename: 'session123_chunk_001.jsonl' }];

        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return true;
            if (path.endsWith('_chunk_001.jsonl')) return true;
            if (path === '/fake/transcript.jsonl') return false;
            return false;
        });

        fs.readFileSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return JSON.stringify(mockIndex);
            if (path.endsWith('_chunk_001.jsonl')) throw new Error('EACCES: permission denied');
            return '';
        });

        const result = assembleFullTranscript('session123', '/fake/transcript.jsonl');

        expect(result).toEqual([]);
    });

    // Test 10: Handle transcript read errors
    test('assembleFullTranscript should handle transcript read errors', () => {
        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return false;
            if (path === '/fake/transcript.jsonl') return true;
            return false;
        });

        fs.readFileSync.mockImplementation(() => {
            throw new Error('EACCES: permission denied');
        });

        const result = assembleFullTranscript('session123', '/fake/transcript.jsonl');

        expect(result).toEqual([]);
    });

    // Test 11: Skip malformed JSON in final transcript
    test('assembleFullTranscript should skip malformed JSON in transcript', () => {
        const mockTranscript = [
            JSON.stringify({ role: 'user', content: 'valid 1' }),
            'invalid json',
            JSON.stringify({ role: 'user', content: 'valid 2' })
        ].join('\n');

        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return false;
            if (path === '/fake/transcript.jsonl') return true;
            return false;
        });

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = assembleFullTranscript('session123', '/fake/transcript.jsonl');

        expect(result).toHaveLength(2);
    });

    // Test 12: Handle chunks with missing chunk_number (a missing)
    test('assembleFullTranscript should handle missing chunk_number', () => {
        const mockIndex = [
            { filename: 'session123_chunk_001.jsonl' }, // no chunk_number
            { chunk_number: 2, filename: 'session123_chunk_002.jsonl' }
        ];

        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return true;
            if (path.includes('_chunk_')) return true;
            if (path === '/fake/transcript.jsonl') return false;
            return false;
        });

        fs.readFileSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return JSON.stringify(mockIndex);
            if (path.includes('_chunk_')) return JSON.stringify({ role: 'user' });
            return '';
        });

        const result = assembleFullTranscript('session123', '/fake/transcript.jsonl');

        expect(result).toHaveLength(2); // Both loaded despite missing chunk_number
    });

    // Test 12b: Handle chunks with missing chunk_number (b missing) - for 100% branch coverage
    test('assembleFullTranscript should handle missing chunk_number reversed', () => {
        const mockIndex = [
            { chunk_number: 2, filename: 'session123_chunk_002.jsonl' },
            { filename: 'session123_chunk_001.jsonl' } // no chunk_number (b is missing)
        ];

        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return true;
            if (path.includes('_chunk_')) return true;
            if (path === '/fake/transcript.jsonl') return false;
            return false;
        });

        fs.readFileSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return JSON.stringify(mockIndex);
            if (path.includes('_chunk_')) return JSON.stringify({ role: 'user' });
            return '';
        });

        const result = assembleFullTranscript('session123', '/fake/transcript.jsonl');

        expect(result).toHaveLength(2); // Both loaded despite missing chunk_number
    });

    /**
     * extractSemanticContent() tests (15 tests)
     */

    // Test 13: Return null when entries empty
    test('extractSemanticContent should return null when entries empty', () => {
        expect(extractSemanticContent([], '/fake/cwd')).toBeNull();
        expect(extractSemanticContent(null, '/fake/cwd')).toBeNull();
    });

    // Test 14: Extract user messages (string content)
    test('extractSemanticContent should extract user messages', () => {
        const entries = [
            { role: 'user', content: 'This is a user message that is long enough to be included' }
        ];

        const result = extractSemanticContent(entries, '/project/dir');

        expect(result).toContain('## User Requests');
        expect(result).toContain('This is a user message');
    });

    // Test 15: Extract user messages (array content with text items)
    test('extractSemanticContent should extract user messages from array', () => {
        const entries = [
            { role: 'user', content: [
                { type: 'text', text: 'Message from array content that is long enough' }
            ]}
        ];

        const result = extractSemanticContent(entries, '/project/dir');

        expect(result).toContain('Message from array content');
    });

    // Test 16: Truncate messages to 500 chars
    test('extractSemanticContent should truncate messages to 500 chars', () => {
        const longMessage = 'a'.repeat(600);
        const entries = [{ role: 'user', content: longMessage }];

        const result = extractSemanticContent(entries, '/project/dir');

        // Message should be truncated in collection
        expect(result).toContain('aaa'); // Some 'a's present
        expect(result.match(/a+/g)[0].length).toBeLessThanOrEqual(500);
    });

    // Test 17: Skip messages shorter than 20 chars
    test('extractSemanticContent should skip short messages', () => {
        const entries = [
            { role: 'user', content: 'short' },
            { role: 'user', content: 'This message is long enough to be included in the summary' }
        ];

        const result = extractSemanticContent(entries, '/project/dir');

        expect(result).not.toContain('short');
        expect(result).toContain('This message is long enough');
    });

    // Test 18: Extract files from assistant content
    test('extractSemanticContent should extract file mentions', () => {
        const entries = [
            { role: 'user', content: 'Please check the code' },
            { role: 'assistant', content: 'I looked at script.py and config.json' }
        ];

        const result = extractSemanticContent(entries, '/project/dir');

        expect(result).toContain('## Files Mentioned');
        expect(result).toContain('script.py');
        expect(result).toContain('config.json');
    });

    // Test 19: Limit files to 15 in output
    test('extractSemanticContent should limit files to 15', () => {
        const files = Array.from({length: 25}, (_, i) => `file${i}.js`).join(' ');
        const entries = [
            { role: 'user', content: 'Check all these files please: long message' },
            { role: 'assistant', content: files }
        ];

        const result = extractSemanticContent(entries, '/project/dir');

        // Should have Files Mentioned section but limited to 15
        const fileLines = result.split('\n').filter(l => l.match(/^- file\d+\.js$/));
        expect(fileLines.length).toBeLessThanOrEqual(15);
    });

    // Test 20: Generate markdown with project name
    test('extractSemanticContent should include project name', () => {
        const entries = [{ role: 'user', content: 'Test message that is long enough' }];

        const result = extractSemanticContent(entries, '/home/user/my-awesome-project');

        expect(result).toContain('# Session: my-awesome-project');
        expect(result).toContain('**Project**: my-awesome-project');
    });

    // Test 21: Limit user messages to 10
    test('extractSemanticContent should limit user messages to 10', () => {
        const entries = Array.from({length: 15}, (_, i) => ({
            role: 'user',
            content: `This is user message number ${i} and it is long enough to be included`
        }));

        const result = extractSemanticContent(entries, '/project/dir');

        // Count lines starting with "- This is user message"
        const messageLines = result.split('\n').filter(l => l.startsWith('- This is user message'));
        expect(messageLines.length).toBe(10);
    });

    // Test 22: Truncate messages to 200 chars in summary
    test('extractSemanticContent should truncate summary messages to 200 chars', () => {
        const longMessage = 'a'.repeat(300);
        const entries = [{ role: 'user', content: longMessage }];

        const result = extractSemanticContent(entries, '/project/dir');

        const messageLine = result.split('\n').find(l => l.startsWith('- '));
        expect(messageLine.length).toBeLessThanOrEqual(202); // "- " (2) + 197 + "..." (3) = 202
    });

    // Test 23: Return null when no user messages
    test('extractSemanticContent should return null when no user messages', () => {
        const entries = [
            { role: 'assistant', content: 'Only assistant responses here' }
        ];

        const result = extractSemanticContent(entries, '/project/dir');

        expect(result).toBeNull();
    });

    // Test 24: Handle no files mentioned
    test('extractSemanticContent should handle no files mentioned', () => {
        const entries = [
            { role: 'user', content: 'Just a general question about programming' },
            { role: 'assistant', content: 'Here is some general advice' }
        ];

        const result = extractSemanticContent(entries, '/project/dir');

        expect(result).toContain('## Files Mentioned');
        expect(result).toContain('- None detected');
    });

    // Test 25: Handle null or empty cwd
    test('extractSemanticContent should handle null cwd', () => {
        const entries = [{ role: 'user', content: 'Test message that is long enough' }];

        const resultNull = extractSemanticContent(entries, null);
        const resultEmpty = extractSemanticContent(entries, '');

        expect(resultNull).toContain('# Session: Unknown');
        expect(resultEmpty).toContain('# Session: Unknown');
    });

    // Test 26: Handle non-string assistant content
    test('extractSemanticContent should handle non-string assistant content', () => {
        const entries = [
            { role: 'user', content: 'Test message that is long enough' },
            { role: 'assistant', content: ['array', 'content'] }
        ];

        const result = extractSemanticContent(entries, '/project/dir');

        expect(result).toContain('- None detected'); // No files extracted from array
    });

    // Test 27: Skip non-text items in user content array
    test('extractSemanticContent should skip non-text items in array', () => {
        const entries = [
            { role: 'user', content: [
                { type: 'image', data: 'base64...' },
                { type: 'text', text: 'This is a text message that should be included' },
                { type: 'unknown', data: 'something' }
            ]}
        ];

        const result = extractSemanticContent(entries, '/project/dir');

        expect(result).toContain('This is a text message');
        expect(result).not.toContain('base64');
    });

    /**
     * cleanupChunks() tests (6 tests)
     */

    // Test 28: Delete chunks and index when they exist
    test('cleanupChunks should delete chunks and index', () => {
        const mockIndex = [
            { chunk_number: 1, filename: 'session123_chunk_001.jsonl' },
            { chunk_number: 2, filename: 'session123_chunk_002.jsonl' }
        ];

        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return true;
            if (path.includes('_chunk_')) return true;
            return false;
        });

        fs.readFileSync.mockReturnValue(JSON.stringify(mockIndex));
        fs.unlinkSync.mockImplementation(() => {});

        cleanupChunks('session123');

        expect(fs.unlinkSync).toHaveBeenCalledTimes(3); // 2 chunks + 1 index
        expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('_chunk_001.jsonl'));
        expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('_chunk_002.jsonl'));
        expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('_index.json'));
    });

    // Test 29: Skip when index doesn't exist
    test('cleanupChunks should skip when index not exists', () => {
        fs.existsSync.mockReturnValue(false);

        cleanupChunks('session123');

        expect(fs.readFileSync).not.toHaveBeenCalled();
        expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    // Test 30: Handle index read errors
    test('cleanupChunks should handle index read errors', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockImplementation(() => {
            throw new Error('EACCES: permission denied');
        });

        cleanupChunks('session123');

        expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    // Test 31: Handle chunk delete errors
    test('cleanupChunks should handle chunk delete errors', () => {
        const mockIndex = [{ chunk_number: 1, filename: 'session123_chunk_001.jsonl' }];

        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return true;
            if (path.includes('_chunk_')) return true;
            return false;
        });

        fs.readFileSync.mockReturnValue(JSON.stringify(mockIndex));
        fs.unlinkSync.mockImplementation(() => {
            throw new Error('EACCES: permission denied');
        });

        // Should not throw
        cleanupChunks('session123');
    });

    // Test 32: Skip missing chunk files during cleanup
    test('cleanupChunks should skip missing chunk files', () => {
        const mockIndex = [
            { chunk_number: 1, filename: 'session123_chunk_001.jsonl' },
            { chunk_number: 2, filename: 'session123_chunk_002.jsonl' }
        ];

        fs.existsSync.mockImplementation((path) => {
            if (path.endsWith('_index.json')) return true;
            if (path.endsWith('_chunk_001.jsonl')) return true;
            if (path.endsWith('_chunk_002.jsonl')) return false; // Missing
            return false;
        });

        fs.readFileSync.mockReturnValue(JSON.stringify(mockIndex));
        fs.unlinkSync.mockImplementation(() => {});

        cleanupChunks('session123');

        // Should delete chunk 1 and index, skip chunk 2
        expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
    });

    // Test 33: Handle corrupted index during cleanup
    test('cleanupChunks should handle corrupted index', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('invalid json {{{');

        // Should not throw
        cleanupChunks('session123');

        expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    /**
     * Additional tests for 100% branch coverage (Tests 34-37)
     */

    // Test 34: Handle user entry with null/undefined content
    test('extractSemanticContent should handle null user content', () => {
        const entries = [
            { role: 'user', content: null },
            { role: 'user', content: undefined },
            { role: 'user' }, // no content property
            { role: 'user', content: 'Valid message that is long enough' }
        ];

        const result = extractSemanticContent(entries, '/project/dir');

        expect(result).toContain('Valid message');
    });

    // Test 35: Handle item with null/undefined text in array
    test('extractSemanticContent should handle null item text', () => {
        const entries = [
            { role: 'user', content: [
                { type: 'text', text: null },
                { type: 'text', text: undefined },
                { type: 'text' }, // no text property
                { type: 'text', text: 'Valid text that is long enough' }
            ]}
        ];

        const result = extractSemanticContent(entries, '/project/dir');

        expect(result).toContain('Valid text');
    });

    // Test 36: Handle entries with role that is not user or assistant
    test('extractSemanticContent should skip non-user/assistant roles', () => {
        const entries = [
            { role: 'system', content: 'System message' },
            { role: 'unknown', content: 'Unknown role message' },
            { role: 'user', content: 'This is a valid user message that should be included' }
        ];

        const result = extractSemanticContent(entries, '/project/dir');

        expect(result).toContain('This is a valid user message');
        expect(result).not.toContain('System message');
        expect(result).not.toContain('Unknown role');
    });

    // Test 37: Handle assistant entry with null/undefined content
    test('extractSemanticContent should handle null assistant content', () => {
        const entries = [
            { role: 'user', content: 'Check the files please, this is long enough' },
            { role: 'assistant', content: null },
            { role: 'assistant', content: undefined },
            { role: 'assistant' }, // no content
            { role: 'assistant', content: 'Found script.py' }
        ];

        const result = extractSemanticContent(entries, '/project/dir');

        expect(result).toContain('script.py');
    });
});
