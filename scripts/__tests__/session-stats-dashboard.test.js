const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');

describe('session-stats-dashboard.js', () => {
    const scriptPath = path.join(__dirname, '../session-stats-dashboard.js');
    const testTranscriptPath = path.join(os.tmpdir(), 'test-transcript.jsonl');
    const debugLog = path.join(os.homedir(), '.claude', 'logs', 'hooks-debug.log');

    beforeEach(() => {
        // Clean up before each test
        if (fs.existsSync(testTranscriptPath)) {
            fs.unlinkSync(testTranscriptPath);
        }
    });

    afterEach(() => {
        // Cleanup after each test
        if (fs.existsSync(testTranscriptPath)) {
            fs.unlinkSync(testTranscriptPath);
        }
    });

    // Test 1: Parse transcript successfully with all stats
    test('should parse transcript successfully with all stats', (done) => {
        const transcript = [
            { timestamp: '2024-01-01T10:00:00Z', role: 'user', content: 'test prompt' },
            { timestamp: '2024-01-01T10:00:05Z', role: 'assistant', content: [
                { type: 'tool_use', name: 'Skill', input: { skill: 'anthropic-office-pdf' } },
                { type: 'tool_use', name: 'Read', input: { file_path: '/test/file.txt' } }
            ]},
            { timestamp: '2024-01-01T10:00:10Z', role: 'user', content: 'another prompt' }
        ].map(e => JSON.stringify(e)).join('\n');

        fs.writeFileSync(testTranscriptPath, transcript, 'utf-8');

        const inputData = { transcript_path: testTranscriptPath };
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('SESSION STATISTICS');
            expect(stdout).toContain('Duration:');
            expect(stdout).toContain('Exchanges:');
            expect(stdout).toContain('Skills used');
            expect(stdout).toContain('anthropic-office-pdf');
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 2: Handle missing transcript file
    test('should handle missing transcript file', (done) => {
        const inputData = { transcript_path: '/nonexistent/path.jsonl' };
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull(); // Should not crash
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 3: Handle empty transcript file
    test('should handle empty transcript file', (done) => {
        fs.writeFileSync(testTranscriptPath, '', 'utf-8');

        const inputData = { transcript_path: testTranscriptPath };
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('SESSION STATISTICS');
            expect(stdout).toContain('0 prompts');
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 4: Handle malformed JSONL lines (skip gracefully)
    test('should handle malformed JSONL lines gracefully', (done) => {
        const transcript = [
            JSON.stringify({ timestamp: '2024-01-01T10:00:00Z', role: 'user', content: 'test' }),
            'invalid json line',
            JSON.stringify({ timestamp: '2024-01-01T10:00:05Z', role: 'assistant', content: [] })
        ].join('\n');

        fs.writeFileSync(testTranscriptPath, transcript, 'utf-8');

        const inputData = { transcript_path: testTranscriptPath };
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('SESSION STATISTICS');
            expect(stdout).toContain('1 prompts'); // Should count valid lines
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 5: Format duration for hours/minutes/seconds
    test('should format duration correctly', (done) => {
        const transcript = [
            JSON.stringify({ timestamp: '2024-01-01T10:00:00Z', role: 'user', content: 'test' }),
            JSON.stringify({ timestamp: '2024-01-01T11:35:45Z', role: 'assistant', content: [] })
        ].join('\n');

        fs.writeFileSync(testTranscriptPath, transcript, 'utf-8');

        const inputData = { transcript_path: testTranscriptPath };
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('Duration:');
            expect(stdout).toMatch(/1h\s+35m\s+45s/);
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 6: Handle duration edge cases (short duration)
    test('should handle short duration (seconds only)', (done) => {
        const transcript = [
            JSON.stringify({ timestamp: '2024-01-01T10:00:00Z', role: 'user', content: 'test' }),
            JSON.stringify({ timestamp: '2024-01-01T10:00:15Z', role: 'assistant', content: [] })
        ].join('\n');

        fs.writeFileSync(testTranscriptPath, transcript, 'utf-8');

        const inputData = { transcript_path: testTranscriptPath };
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('15s');
            // Check duration line specifically doesn't have hours/minutes
            const durationMatch = stdout.match(/Duration:\s+(.+)/);
            if (durationMatch) {
                expect(durationMatch[1]).not.toMatch(/\d+h/);
                expect(durationMatch[1]).not.toMatch(/\d+m/);
            }
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 7: Display skills used with counts
    test('should display skills used with counts', (done) => {
        const transcript = [
            JSON.stringify({ timestamp: '2024-01-01T10:00:00Z', role: 'assistant', content: [
                { type: 'tool_use', name: 'Skill', input: { skill: 'skill-1' } }
            ]}),
            JSON.stringify({ timestamp: '2024-01-01T10:00:05Z', role: 'assistant', content: [
                { type: 'tool_use', name: 'Skill', input: { skill: 'skill-1' } },
                { type: 'tool_use', name: 'Skill', input: { skill: 'skill-2' } }
            ]})
        ].join('\n');

        fs.writeFileSync(testTranscriptPath, transcript, 'utf-8');

        const inputData = { transcript_path: testTranscriptPath };
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('Skills used');
            expect(stdout).toContain('skill-1 (2x)');
            expect(stdout).toContain('skill-2 (1x)');
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 8: Display files modified
    test('should display files modified', (done) => {
        const transcript = [
            JSON.stringify({ timestamp: '2024-01-01T10:00:00Z', role: 'assistant', content: [
                { type: 'tool_use', name: 'Write', input: { file_path: '/test/file1.txt' } },
                { type: 'tool_use', name: 'Edit', input: { file_path: '/test/file2.txt' } }
            ]})
        ].join('\n');

        fs.writeFileSync(testTranscriptPath, transcript, 'utf-8');

        const inputData = { transcript_path: testTranscriptPath };
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('Files modified: 2');
            expect(stdout).toContain('/test/file1.txt');
            expect(stdout).toContain('/test/file2.txt');
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 9: Handle invalid JSON in stdin
    test('should handle invalid JSON in stdin', (done) => {
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull(); // Should not crash
            done();
        });

        proc.stdin.write('invalid json');
        proc.stdin.end();
    });

    // Test 10: Handle missing transcript_path field
    test('should handle missing transcript_path field', (done) => {
        const inputData = { other_field: 'value' };
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull(); // Should not crash
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });
});
