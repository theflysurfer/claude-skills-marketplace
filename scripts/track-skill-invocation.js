#!/usr/bin/env node
/**
 * Track Skill Invocations - Records when a skill is invoked.
 * Hook: PostToolUse (tool_name == "Skill")
 *
 * Works with semantic-skill-router to provide routing feedback.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Add lib directory to path for imports
const libDir = path.join(__dirname, 'lib');
const debugLogger = require(path.join(libDir, 'debug-logger.js'));

const { logHookStart, logHookEnd, logDebug } = debugLogger;

const TRACKING_DIR = path.join(os.homedir(), '.claude', 'routing-tracking');

function handleInvocation(data) {
    logDebug('PostToolUse', 'track-skill-invocation.js', 'Input parsed successfully', 'INFO');

    const toolName = data.tool_name || '';

    // Only track Skill invocations
    if (toolName !== 'Skill') {
        logDebug('PostToolUse', 'track-skill-invocation.js', `Not a Skill invocation: ${toolName}`, 'SKIP');
        return false;
    }

    const toolInput = data.tool_input || {};
    const skillName = toolInput.skill || '';

    if (!skillName) {
        logDebug('PostToolUse', 'track-skill-invocation.js', 'No skill name found', 'SKIP');
        return false;
    }

    logDebug('PostToolUse', 'track-skill-invocation.js', `Tracking skill: ${skillName}`, 'INFO');

    // Save invocation
    if (!fs.existsSync(TRACKING_DIR)) {
        fs.mkdirSync(TRACKING_DIR, { recursive: true });
    }

    const invocationFile = path.join(TRACKING_DIR, 'last-invocation.json');
    const trackingData = {
        skill_name: skillName,
        timestamp: Date.now() / 1000
    };

    fs.writeFileSync(invocationFile, JSON.stringify(trackingData), 'utf-8');

    logDebug('PostToolUse', 'track-skill-invocation.js', 'Invocation saved', 'INFO');
    return true;
}

/* istanbul ignore next */
function main() {
    logHookStart('PostToolUse', 'track-skill-invocation.js');

    let inputData = '';
    process.stdin.setEncoding('utf8');

    process.stdin.on('readable', () => {
        let chunk;
        while ((chunk = process.stdin.read()) !== null) {
            inputData += chunk;
        }
    });

    process.stdin.on('end', () => {
        try {
            const data = JSON.parse(inputData);
            const success = handleInvocation(data);
            logHookEnd('PostToolUse', 'track-skill-invocation.js', success);
            process.exit(0);
        } catch (e) {
            logDebug('PostToolUse', 'track-skill-invocation.js', `ERROR: ${e.message}`, 'ERROR');
            logHookEnd('PostToolUse', 'track-skill-invocation.js', false);
            process.exit(0);
        }
    });
}

// Export for testing
/* istanbul ignore else */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { handleInvocation, TRACKING_DIR };
}

// Run main if executed directly
/* istanbul ignore if */
if (require.main === module) {
    main();
}
