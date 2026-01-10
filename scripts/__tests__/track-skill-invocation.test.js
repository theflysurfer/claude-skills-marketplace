const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');

// Import the module to test (for unit testing individual functions)
const { handleInvocation, TRACKING_DIR: getTrackingDir } = require('../track-skill-invocation.js');

describe('track-skill-invocation.js', () => {
    let scriptPath;
    let trackingDir;
    let invocationFile;
    let debugLog;

    beforeAll(() => {
        scriptPath = path.join(__dirname, '../track-skill-invocation.js');
        trackingDir = path.join(os.homedir(), '.claude', 'routing-tracking');
        invocationFile = path.join(trackingDir, 'last-invocation.json');
        debugLog = path.join(os.homedir(), '.claude', 'logs', 'hooks-debug.log');
    });

    beforeEach(() => {
        // Clean up before each test
        if (fs.existsSync(invocationFile)) {
            fs.unlinkSync(invocationFile);
        }
    });

    afterEach(() => {
        // Cleanup after each test
        if (fs.existsSync(invocationFile)) {
            fs.unlinkSync(invocationFile);
        }
    });

    // Test 1: Track Skill invocation successfully
    test('should track Skill invocation successfully', (done) => {
        const inputData = {
            tool_name: 'Skill',
            tool_input: {
                skill: 'anthropic-office-pdf'
            }
        };

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(fs.existsSync(invocationFile)).toBe(true);

            const saved = JSON.parse(fs.readFileSync(invocationFile, 'utf-8'));
            expect(saved.skill_name).toBe('anthropic-office-pdf');
            expect(saved.timestamp).toBeGreaterThan(0);

            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 2: Skip non-Skill tool invocations
    test('should skip non-Skill tool invocations', (done) => {
        const inputData = {
            tool_name: 'Read',
            tool_input: {}
        };

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(fs.existsSync(invocationFile)).toBe(false);
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 3: Handle missing skill name
    test('should handle missing skill name', (done) => {
        const inputData = {
            tool_name: 'Skill',
            tool_input: {}
        };

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(fs.existsSync(invocationFile)).toBe(false);
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 4: Handle invalid JSON input
    test('should handle invalid JSON input', (done) => {
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(fs.existsSync(invocationFile)).toBe(false);
            done();
        });

        proc.stdin.write('invalid json');
        proc.stdin.end();
    });

    // Test 5: Verify debug logging
    test('should log to debug file', (done) => {
        const logsBefore = fs.existsSync(debugLog) ? fs.statSync(debugLog).size : 0;

        const inputData = {
            tool_name: 'Skill',
            tool_input: { skill: 'test-skill' }
        };

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            const logsAfter = fs.statSync(debugLog).size;
            expect(logsAfter).toBeGreaterThan(logsBefore);

            const logContent = fs.readFileSync(debugLog, 'utf-8');
            expect(logContent).toContain('[PostToolUse]');
            expect(logContent).toContain('[track-skill-invocation.js]');
            expect(logContent).toContain('START');
            expect(logContent).toContain('END');

            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 6: Handle empty stdin
    test('should handle empty stdin gracefully', (done) => {
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(fs.existsSync(invocationFile)).toBe(false);
            done();
        });

        proc.stdin.end(); // Send EOF without data
    });

    // Test 7: Handle malformed tool_input (not an object)
    test('should handle malformed tool_input', (done) => {
        const inputData = {
            tool_name: 'Skill',
            tool_input: 'not an object'
        };

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(fs.existsSync(invocationFile)).toBe(false);
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 8: Handle null tool_input
    test('should handle null tool_input', (done) => {
        const inputData = {
            tool_name: 'Skill',
            tool_input: null
        };

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(fs.existsSync(invocationFile)).toBe(false);
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 9: Handle empty tool_name
    test('should handle empty tool_name', (done) => {
        const inputData = {
            tool_name: '',
            tool_input: { skill: 'test' }
        };

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(fs.existsSync(invocationFile)).toBe(false);
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 10: Handle empty skill name in tool_input
    test('should handle empty skill name in tool_input', (done) => {
        const inputData = {
            tool_name: 'Skill',
            tool_input: { skill: '' }
        };

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(fs.existsSync(invocationFile)).toBe(false);
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 11: Verify directory creation when tracking dir doesn't exist
    test('should create tracking directory if it does not exist', (done) => {
        // Delete the tracking directory if it exists
        if (fs.existsSync(trackingDir)) {
            fs.rmSync(trackingDir, { recursive: true, force: true });
        }

        const inputData = {
            tool_name: 'Skill',
            tool_input: { skill: 'test-skill' }
        };

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            // Directory should have been created
            expect(fs.existsSync(trackingDir)).toBe(true);
            // File should exist
            expect(fs.existsSync(invocationFile)).toBe(true);
            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });

    // Test 12: Verify timestamp precision
    test('should use Unix timestamp in seconds (not milliseconds)', (done) => {
        const inputData = {
            tool_name: 'Skill',
            tool_input: { skill: 'test-skill' }
        };

        const beforeTimestamp = Date.now() / 1000;

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            const afterTimestamp = Date.now() / 1000;

            const saved = JSON.parse(fs.readFileSync(invocationFile, 'utf-8'));

            // Timestamp should be in seconds (10 digits), not milliseconds (13 digits)
            expect(saved.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
            expect(saved.timestamp).toBeLessThanOrEqual(afterTimestamp);

            // Verify it's not milliseconds (would be much larger)
            expect(saved.timestamp).toBeLessThan(Date.now()); // < milliseconds

            done();
        });

        proc.stdin.write(JSON.stringify(inputData));
        proc.stdin.end();
    });
});
