const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');

describe('session-start-banner.js', () => {
    const scriptPath = path.join(__dirname, '../session-start-banner.js');
    const mockRegistryPath = path.join(os.homedir(), '.claude', 'configs', 'hybrid-registry.json');
    const debugLog = path.join(os.homedir(), '.claude', 'logs', 'hooks-debug.log');
    let originalRegistry = null;

    beforeAll(() => {
        // Backup original registry if it exists
        if (fs.existsSync(mockRegistryPath)) {
            originalRegistry = fs.readFileSync(mockRegistryPath, 'utf-8');
        }
    });

    afterAll(() => {
        // Restore original registry
        if (originalRegistry !== null) {
            fs.writeFileSync(mockRegistryPath, originalRegistry, 'utf-8');
        }
    });

    beforeEach(() => {
        // Create test registry with 3 skills
        const testRegistry = {
            skills: {
                'skill1': { name: 'skill1' },
                'skill2': { name: 'skill2' },
                'skill3': { name: 'skill3' }
            }
        };
        fs.mkdirSync(path.dirname(mockRegistryPath), { recursive: true });
        fs.writeFileSync(mockRegistryPath, JSON.stringify(testRegistry), 'utf-8');
    });

    // Test 1: Display project name banner
    test('should display project name banner', (done) => {
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('[>]');
            expect(stdout).toMatch(/={40,}/); // Line of equals
            done();
        });
    });

    // Test 2: Display skill count
    test('should display skill count from registry', (done) => {
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('skills');
            expect(stdout).toContain('/help');
            expect(stdout).toMatch(/\d+\s+skills/); // Match "N skills"
            done();
        });
    });

    // Test 3: Set terminal title
    test('should set terminal title with ANSI escape sequence', (done) => {
        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            // Verify ANSI escape sequence for title (ESC]0;title BEL)
            expect(stdout).toMatch(/\x1b]0;.+\x07/);
            done();
        });
    });

    // Test 4: Handle missing registry gracefully
    test('should handle missing registry gracefully', (done) => {
        // Delete registry
        fs.unlinkSync(mockRegistryPath);

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull(); // Should not crash
            expect(stdout).toContain('[>]'); // Still displays banner
            done();
        });
    });

    // Test 5: Verify debug logging
    test('should log to debug file', (done) => {
        const logsBefore = fs.existsSync(debugLog) ? fs.statSync(debugLog).size : 0;

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            const logsAfter = fs.statSync(debugLog).size;
            expect(logsAfter).toBeGreaterThan(logsBefore);

            const logContent = fs.readFileSync(debugLog, 'utf-8');
            expect(logContent).toContain('[SessionStart]');
            expect(logContent).toContain('[session-start-banner.js]');
            expect(logContent).toContain('START');
            expect(logContent).toContain('END');

            done();
        });
    });

    // Test 6: Handle empty skills object (0 skills)
    test('should handle empty skills object gracefully', (done) => {
        const emptyRegistry = { skills: {} };
        fs.writeFileSync(mockRegistryPath, JSON.stringify(emptyRegistry), 'utf-8');

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('[>]');
            // Should not display skill count if 0
            done();
        });
    });

    // Test 7: Handle malformed registry JSON
    test('should handle malformed registry JSON', (done) => {
        fs.writeFileSync(mockRegistryPath, '{invalid json', 'utf-8');

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull(); // Should not crash
            expect(stdout).toContain('[>]'); // Still displays banner
            done();
        });
    });

    // Test 8: Handle null skills in registry
    test('should handle null skills in registry', (done) => {
        const nullSkillsRegistry = { skills: null };
        fs.writeFileSync(mockRegistryPath, JSON.stringify(nullSkillsRegistry), 'utf-8');

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('[>]');
            done();
        });
    });

    // Test 9: Handle registry without skills key
    test('should handle registry without skills key', (done) => {
        const noSkillsRegistry = { other: 'data' };
        fs.writeFileSync(mockRegistryPath, JSON.stringify(noSkillsRegistry), 'utf-8');

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('[>]');
            done();
        });
    });

    // Test 10: Handle large skill count (>99)
    test('should handle large skill count', (done) => {
        const largeRegistry = { skills: {} };
        for (let i = 0; i < 150; i++) {
            largeRegistry.skills[`skill${i}`] = { name: `skill${i}` };
        }
        fs.writeFileSync(mockRegistryPath, JSON.stringify(largeRegistry), 'utf-8');

        const proc = execFile('node', [scriptPath], (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('[>]');
            expect(stdout).toMatch(/150\s+skills/);
            done();
        });
    });
});
