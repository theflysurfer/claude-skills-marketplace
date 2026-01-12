/**
 * Unit Tests for session-stats-dashboard.js - 100% Coverage
 *
 * Tests all three exported functions:
 * - parseTranscript()
 * - formatDuration()
 * - displayDashboard()
 */

const fs = require('fs');
const path = require('path');

// Mock fs
jest.mock('fs');

// Mock debug logger
jest.mock('../lib/debug-logger.js', () => ({
    logHookStart: jest.fn(),
    logHookEnd: jest.fn(),
    logDebug: jest.fn()
}));

// Import module AFTER mocking
const { parseTranscript, formatDuration, displayDashboard } = require('../session-stats-dashboard.js');

describe('session-stats-dashboard.js - Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default mocks
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('');
    });

    /**
     * parseTranscript() tests (8 tests)
     */

    // Test 1: Return empty stats when file does not exist
    test('parseTranscript should return empty stats when file not exists', () => {
        fs.existsSync.mockReturnValue(false);

        const result = parseTranscript('/fake/transcript.jsonl');

        expect(result).toEqual({
            start_time: null,
            end_time: null,
            skills_used: new Map(),
            tools_used: new Map(),
            files_modified: new Set(),
            user_prompts: 0,
            assistant_responses: 0
        });
    });

    // Test 2: Parse user prompts correctly
    test('parseTranscript should count user prompts', () => {
        const mockTranscript = [
            JSON.stringify({ role: 'user', timestamp: '2024-01-01T10:00:00Z' }),
            JSON.stringify({ role: 'user', timestamp: '2024-01-01T10:05:00Z' }),
            JSON.stringify({ role: 'user', timestamp: '2024-01-01T10:10:00Z' })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        expect(result.user_prompts).toBe(3);
    });

    // Test 3: Parse assistant responses correctly
    test('parseTranscript should count assistant responses', () => {
        const mockTranscript = [
            JSON.stringify({ role: 'assistant', content: [], timestamp: '2024-01-01T10:00:00Z' }),
            JSON.stringify({ role: 'assistant', content: [], timestamp: '2024-01-01T10:05:00Z' })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        expect(result.assistant_responses).toBe(2);
    });

    // Test 4: Track Skill invocations
    test('parseTranscript should track Skill invocations', () => {
        const mockTranscript = [
            JSON.stringify({
                role: 'assistant',
                content: [
                    { type: 'tool_use', name: 'Skill', input: { skill: 'anthropic-office-pdf' } },
                    { type: 'tool_use', name: 'Skill', input: { skill: 'anthropic-office-pdf' } },
                    { type: 'tool_use', name: 'Skill', input: { skill: 'julien-dev-commit-message' } }
                ],
                timestamp: '2024-01-01T10:00:00Z'
            })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        expect(result.skills_used.get('anthropic-office-pdf')).toBe(2);
        expect(result.skills_used.get('julien-dev-commit-message')).toBe(1);
        expect(result.skills_used.size).toBe(2);
    });

    // Test 5: Track other tool uses
    test('parseTranscript should track tool uses', () => {
        const mockTranscript = [
            JSON.stringify({
                role: 'assistant',
                content: [
                    { type: 'tool_use', name: 'Read', input: { file_path: '/test/file.txt' } },
                    { type: 'tool_use', name: 'Write', input: { file_path: '/test/output.txt' } },
                    { type: 'tool_use', name: 'Read', input: {} }
                ],
                timestamp: '2024-01-01T10:00:00Z'
            })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        expect(result.tools_used.get('Read')).toBe(2);
        expect(result.tools_used.get('Write')).toBe(1);
        expect(result.tools_used.size).toBe(2);
    });

    // Test 6: Extract file paths from tool inputs
    test('parseTranscript should extract file paths', () => {
        const mockTranscript = [
            JSON.stringify({
                role: 'assistant',
                content: [
                    { type: 'tool_use', name: 'Read', input: { file_path: '/test/file1.txt' } },
                    { type: 'tool_use', name: 'Write', input: { file_path: '/test/file2.txt' } },
                    { type: 'tool_use', name: 'Edit', input: { file_path: '/test/file1.txt' } }
                ],
                timestamp: '2024-01-01T10:00:00Z'
            })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        expect(result.files_modified.has('/test/file1.txt')).toBe(true);
        expect(result.files_modified.has('/test/file2.txt')).toBe(true);
        expect(result.files_modified.size).toBe(2); // Deduplicated
    });

    // Test 7: Handle malformed JSON lines gracefully
    test('parseTranscript should skip malformed JSON lines', () => {
        const mockTranscript = [
            'invalid json',
            JSON.stringify({ role: 'user', timestamp: '2024-01-01T10:00:00Z' }),
            '{ broken json',
            JSON.stringify({ role: 'assistant', content: [], timestamp: '2024-01-01T10:05:00Z' })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        // Should only count the 2 valid lines
        expect(result.user_prompts).toBe(1);
        expect(result.assistant_responses).toBe(1);
    });

    // Test 8: Track timestamps correctly (start and end)
    test('parseTranscript should track start and end timestamps', () => {
        const mockTranscript = [
            JSON.stringify({ role: 'user', timestamp: '2024-01-01T10:00:00Z' }),
            JSON.stringify({ role: 'user', timestamp: '2024-01-01T10:05:00Z' }),
            JSON.stringify({ role: 'user', timestamp: '2024-01-01T10:10:00Z' })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        expect(result.start_time).toEqual(new Date('2024-01-01T10:00:00Z'));
        expect(result.end_time).toEqual(new Date('2024-01-01T10:10:00Z'));
    });

    /**
     * formatDuration() tests (4 tests)
     */

    // Test 9: Format duration in hours
    test('formatDuration should format hours correctly', () => {
        const start = new Date('2024-01-01T10:00:00Z');
        const end = new Date('2024-01-01T12:34:56Z');

        const result = formatDuration(start, end);

        expect(result).toBe('2h 34m 56s');
    });

    // Test 10: Format duration in minutes only
    test('formatDuration should format minutes correctly', () => {
        const start = new Date('2024-01-01T10:00:00Z');
        const end = new Date('2024-01-01T10:05:30Z');

        const result = formatDuration(start, end);

        expect(result).toBe('5m 30s');
    });

    // Test 11: Format duration in seconds only
    test('formatDuration should format seconds correctly', () => {
        const start = new Date('2024-01-01T10:00:00Z');
        const end = new Date('2024-01-01T10:00:45Z');

        const result = formatDuration(start, end);

        expect(result).toBe('45s');
    });

    // Test 12: Return 'unknown' when start or end is null
    test('formatDuration should return unknown when timestamps null', () => {
        expect(formatDuration(null, new Date())).toBe('unknown');
        expect(formatDuration(new Date(), null)).toBe('unknown');
        expect(formatDuration(null, null)).toBe('unknown');
    });

    /**
     * displayDashboard() tests (3 tests)
     */

    // Test 13: Display dashboard with all stats
    test('displayDashboard should display all stats', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const mockStats = {
            start_time: new Date('2024-01-01T10:00:00Z'),
            end_time: new Date('2024-01-01T10:30:00Z'),
            user_prompts: 5,
            assistant_responses: 4,
            skills_used: new Map([
                ['skill1', 3],
                ['skill2', 2]
            ]),
            tools_used: new Map([
                ['Read', 10],
                ['Write', 5]
            ]),
            files_modified: new Set([
                '/test/file1.txt',
                '/test/file2.txt'
            ])
        };

        displayDashboard(mockStats);

        // Verify console.log was called with expected content
        const allLogs = consoleSpy.mock.calls.map(call => call[0]).join(' ');
        expect(allLogs).toContain('SESSION STATISTICS');
        expect(allLogs).toContain('30m 0s'); // Duration
        expect(allLogs).toContain('5 prompts, 4 responses');
        expect(allLogs).toContain('Skills used (2)');
        expect(allLogs).toContain('skill1 (3x)');
        expect(allLogs).toContain('Top tools');
        expect(allLogs).toContain('Read (10x)');
        expect(allLogs).toContain('Files modified: 2');

        consoleSpy.mockRestore();
    });

    // Test 14: Display dashboard with >5 skills (test truncation)
    test('displayDashboard should truncate skills list when >5', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const mockStats = {
            start_time: new Date('2024-01-01T10:00:00Z'),
            end_time: new Date('2024-01-01T10:30:00Z'),
            user_prompts: 10,
            assistant_responses: 10,
            skills_used: new Map([
                ['skill1', 10],
                ['skill2', 9],
                ['skill3', 8],
                ['skill4', 7],
                ['skill5', 6],
                ['skill6', 5],
                ['skill7', 4]
            ]),
            tools_used: new Map(),
            files_modified: new Set()
        };

        displayDashboard(mockStats);

        const allLogs = consoleSpy.mock.calls.map(call => call[0]).join(' ');
        expect(allLogs).toContain('... and 2 more'); // 7 skills, show top 5, hide 2

        consoleSpy.mockRestore();
    });

    // Test 15: Display dashboard with >5 files (test truncation)
    test('displayDashboard should truncate files list when >5', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const mockStats = {
            start_time: null,
            end_time: null,
            user_prompts: 0,
            assistant_responses: 0,
            skills_used: new Map(),
            tools_used: new Map(),
            files_modified: new Set([
                '/file1.txt',
                '/file2.txt',
                '/file3.txt',
                '/file4.txt',
                '/file5.txt',
                '/file6.txt',
                '/file7.txt'
            ])
        };

        displayDashboard(mockStats);

        const allLogs = consoleSpy.mock.calls.map(call => call[0]).join(' ');
        expect(allLogs).toContain('... and 4 more'); // 7 files, show top 3, hide 4

        consoleSpy.mockRestore();
    });

    /**
     * Additional tests for 100% branch coverage (Tests 16-20)
     */

    // Test 16: Handle entry without timestamp
    test('parseTranscript should handle entry without timestamp', () => {
        const mockTranscript = [
            JSON.stringify({ role: 'user', timestamp: '2024-01-01T10:00:00Z' }),
            JSON.stringify({ role: 'user' }), // No timestamp
            JSON.stringify({ role: 'user', timestamp: '2024-01-01T10:10:00Z' })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        // Should still count the prompt without timestamp
        expect(result.user_prompts).toBe(3);
        // Start and end times should still be set from entries that have timestamps
        expect(result.start_time).toEqual(new Date('2024-01-01T10:00:00Z'));
        expect(result.end_time).toEqual(new Date('2024-01-01T10:10:00Z'));
    });

    // Test 17: Handle content that is not an array
    test('parseTranscript should handle content not as array', () => {
        const mockTranscript = [
            JSON.stringify({ role: 'assistant', content: 'string content', timestamp: '2024-01-01T10:00:00Z' }),
            JSON.stringify({ role: 'assistant', content: null, timestamp: '2024-01-01T10:05:00Z' }),
            JSON.stringify({ role: 'assistant', content: 123, timestamp: '2024-01-01T10:10:00Z' })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        // Should count all assistant responses
        expect(result.assistant_responses).toBe(3);
        // But no tools should be tracked (content not array)
        expect(result.tools_used.size).toBe(0);
        expect(result.skills_used.size).toBe(0);
    });

    // Test 18: Handle Skill with missing input or skill property
    test('parseTranscript should handle Skill with missing input', () => {
        const mockTranscript = [
            JSON.stringify({
                role: 'assistant',
                content: [
                    { type: 'tool_use', name: 'Skill', input: null }, // null input
                    { type: 'tool_use', name: 'Skill', input: {} }, // empty input
                    { type: 'tool_use', name: 'Skill', input: { skill: null } }, // null skill
                    { type: 'tool_use', name: 'Skill' } // no input field
                ],
                timestamp: '2024-01-01T10:00:00Z'
            })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        // All should be tracked as 'unknown'
        expect(result.skills_used.get('unknown')).toBe(4);
    });

    // Test 19: Handle tool with missing name
    test('parseTranscript should handle tool with missing name', () => {
        const mockTranscript = [
            JSON.stringify({
                role: 'assistant',
                content: [
                    { type: 'tool_use', input: { file_path: '/test.txt' } }, // no name
                    { type: 'tool_use', name: null, input: { file_path: '/test2.txt' } } // null name
                ],
                timestamp: '2024-01-01T10:00:00Z'
            })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        // Both should be tracked as 'unknown'
        expect(result.tools_used.get('unknown')).toBe(2);
        // File paths should still be extracted
        expect(result.files_modified.has('/test.txt')).toBe(true);
        expect(result.files_modified.has('/test2.txt')).toBe(true);
    });

    // Test 20: Handle tool input without file_path
    test('parseTranscript should handle tool input without file_path', () => {
        const mockTranscript = [
            JSON.stringify({
                role: 'assistant',
                content: [
                    { type: 'tool_use', name: 'Bash', input: { command: 'ls' } }, // no file_path
                    { type: 'tool_use', name: 'Read', input: { file_path: null } }, // null file_path
                    { type: 'tool_use', name: 'Write', input: {} } // empty input
                ],
                timestamp: '2024-01-01T10:00:00Z'
            })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        // All tools should be counted
        expect(result.tools_used.get('Bash')).toBe(1);
        expect(result.tools_used.get('Read')).toBe(1);
        expect(result.tools_used.get('Write')).toBe(1);
        // But no files should be tracked
        expect(result.files_modified.size).toBe(0);
    });

    // Test 21: Handle entry with unknown role (not user or assistant)
    test('parseTranscript should skip entries with unknown role', () => {
        const mockTranscript = [
            JSON.stringify({ role: 'user', timestamp: '2024-01-01T10:00:00Z' }),
            JSON.stringify({ role: 'system', timestamp: '2024-01-01T10:05:00Z' }),
            JSON.stringify({ role: 'unknown', timestamp: '2024-01-01T10:10:00Z' })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        // Only user should be counted
        expect(result.user_prompts).toBe(1);
        expect(result.assistant_responses).toBe(0);
    });

    // Test 22: Handle content array with non-object items
    test('parseTranscript should skip non-object items in content array', () => {
        const mockTranscript = [
            JSON.stringify({
                role: 'assistant',
                content: [
                    'string item',
                    123,
                    null,
                    undefined,
                    true,
                    { type: 'tool_use', name: 'Read', input: { file_path: '/test.txt' } }
                ],
                timestamp: '2024-01-01T10:00:00Z'
            })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        // Should count assistant response
        expect(result.assistant_responses).toBe(1);
        // Should only track the valid tool_use object
        expect(result.tools_used.get('Read')).toBe(1);
        expect(result.tools_used.size).toBe(1);
    });

    // Test 23: Handle item with type that is not 'tool_use'
    test('parseTranscript should skip items without tool_use type', () => {
        const mockTranscript = [
            JSON.stringify({
                role: 'assistant',
                content: [
                    { type: 'text', text: 'some text' },
                    { type: 'thinking', content: 'thinking...' },
                    { type: 'tool_use', name: 'Read', input: { file_path: '/test.txt' } },
                    { text: 'no type field' }
                ],
                timestamp: '2024-01-01T10:00:00Z'
            })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        // Should count assistant response
        expect(result.assistant_responses).toBe(1);
        // Should only track the tool_use item
        expect(result.tools_used.get('Read')).toBe(1);
        expect(result.tools_used.size).toBe(1);
    });

    // Test 24: Handle tool with null/missing input (line 81 coverage)
    test('parseTranscript should handle tool with null or missing input', () => {
        const mockTranscript = [
            JSON.stringify({
                role: 'assistant',
                content: [
                    { type: 'tool_use', name: 'Bash' }, // no input field
                    { type: 'tool_use', name: 'Grep', input: null } // null input
                ],
                timestamp: '2024-01-01T10:00:00Z'
            })
        ].join('\n');

        fs.readFileSync.mockReturnValue(mockTranscript);

        const result = parseTranscript('/fake/transcript.jsonl');

        // Both tools should be counted
        expect(result.tools_used.get('Bash')).toBe(1);
        expect(result.tools_used.get('Grep')).toBe(1);
        // No files should be tracked (no input.file_path)
        expect(result.files_modified.size).toBe(0);
    });
});
