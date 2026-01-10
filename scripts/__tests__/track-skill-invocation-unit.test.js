const fs = require('fs');
const path = require('path');
const { handleInvocation, TRACKING_DIR } = require('../track-skill-invocation.js');

describe('track-skill-invocation.js (unit tests)', () => {
    const invocationFile = path.join(TRACKING_DIR, 'last-invocation.json');

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
    test('should track Skill invocation successfully', () => {
        const inputData = {
            tool_name: 'Skill',
            tool_input: {
                skill: 'anthropic-office-pdf'
            }
        };

        const result = handleInvocation(inputData);
        expect(result).toBe(true);
        expect(fs.existsSync(invocationFile)).toBe(true);

        const saved = JSON.parse(fs.readFileSync(invocationFile, 'utf-8'));
        expect(saved.skill_name).toBe('anthropic-office-pdf');
        expect(saved.timestamp).toBeGreaterThan(0);
    });

    // Test 2: Skip non-Skill tool invocations
    test('should skip non-Skill tool invocations', () => {
        const inputData = {
            tool_name: 'Read',
            tool_input: {}
        };

        const result = handleInvocation(inputData);
        expect(result).toBe(false);
        expect(fs.existsSync(invocationFile)).toBe(false);
    });

    // Test 3: Handle missing skill name
    test('should handle missing skill name', () => {
        const inputData = {
            tool_name: 'Skill',
            tool_input: {}
        };

        const result = handleInvocation(inputData);
        expect(result).toBe(false);
        expect(fs.existsSync(invocationFile)).toBe(false);
    });

    // Test 4: Handle malformed tool_input (not an object)
    test('should handle malformed tool_input', () => {
        const inputData = {
            tool_name: 'Skill',
            tool_input: 'not an object'
        };

        const result = handleInvocation(inputData);
        expect(result).toBe(false);
        expect(fs.existsSync(invocationFile)).toBe(false);
    });

    // Test 5: Handle null tool_input
    test('should handle null tool_input', () => {
        const inputData = {
            tool_name: 'Skill',
            tool_input: null
        };

        const result = handleInvocation(inputData);
        expect(result).toBe(false);
        expect(fs.existsSync(invocationFile)).toBe(false);
    });

    // Test 6: Handle empty tool_name
    test('should handle empty tool_name', () => {
        const inputData = {
            tool_name: '',
            tool_input: { skill: 'test' }
        };

        const result = handleInvocation(inputData);
        expect(result).toBe(false);
        expect(fs.existsSync(invocationFile)).toBe(false);
    });

    // Test 7: Handle empty skill name in tool_input
    test('should handle empty skill name in tool_input', () => {
        const inputData = {
            tool_name: 'Skill',
            tool_input: { skill: '' }
        };

        const result = handleInvocation(inputData);
        expect(result).toBe(false);
        expect(fs.existsSync(invocationFile)).toBe(false);
    });

    // Test 8: Handle undefined tool_name
    test('should handle undefined tool_name', () => {
        const inputData = {
            tool_input: { skill: 'test' }
        };

        const result = handleInvocation(inputData);
        expect(result).toBe(false);
        expect(fs.existsSync(invocationFile)).toBe(false);
    });

    // Test 9: Handle undefined tool_input
    test('should handle undefined tool_input', () => {
        const inputData = {
            tool_name: 'Skill'
        };

        const result = handleInvocation(inputData);
        expect(result).toBe(false);
        expect(fs.existsSync(invocationFile)).toBe(false);
    });

    // Test 10: Handle null skill in tool_input
    test('should handle null skill in tool_input', () => {
        const inputData = {
            tool_name: 'Skill',
            tool_input: { skill: null }
        };

        const result = handleInvocation(inputData);
        expect(result).toBe(false);
        expect(fs.existsSync(invocationFile)).toBe(false);
    });

    // Test 11: Create TRACKING_DIR if it doesn't exist
    test('should create TRACKING_DIR if it does not exist', () => {
        // Remove tracking directory
        if (fs.existsSync(TRACKING_DIR)) {
            if (fs.existsSync(invocationFile)) {
                fs.unlinkSync(invocationFile);
            }
            fs.rmdirSync(TRACKING_DIR);
        }

        const inputData = {
            tool_name: 'Skill',
            tool_input: { skill: 'test-skill' }
        };

        const result = handleInvocation(inputData);
        expect(result).toBe(true);
        expect(fs.existsSync(TRACKING_DIR)).toBe(true);
        expect(fs.existsSync(invocationFile)).toBe(true);
    });

    // Test 12: Verify tracking dir exists when already present
    test('should work when TRACKING_DIR already exists', () => {
        // Ensure directory exists
        if (!fs.existsSync(TRACKING_DIR)) {
            fs.mkdirSync(TRACKING_DIR, { recursive: true });
        }

        const inputData = {
            tool_name: 'Skill',
            tool_input: { skill: 'test-skill-2' }
        };

        const result = handleInvocation(inputData);
        expect(result).toBe(true);
        expect(fs.existsSync(invocationFile)).toBe(true);

        const saved = JSON.parse(fs.readFileSync(invocationFile, 'utf-8'));
        expect(saved.skill_name).toBe('test-skill-2');
    });
});
