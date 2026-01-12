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
const unifiedLogger = require(path.join(libDir, 'unified-logger.js'));

const { logHookStart: logHookStartOld, logHookEnd: logHookEndOld, logDebug } = debugLogger;

const TRACKING_DIR = path.join(os.homedir(), '.claude', 'routing-tracking');

function handleInvocation(data) {
    logDebug('PostToolUse', 'track-skill-invocation.js', 'Input parsed successfully', 'INFO');

    const toolName = data.tool_name || '';

    // Only track Skill invocations
    if (toolName !== 'Skill') {
        logDebug('PostToolUse', 'track-skill-invocation.js', `Not a Skill invocation: ${toolName}`, 'SKIP');
        return { success: false };
    }

    const toolInput = data.tool_input || {};
    const skillName = toolInput.skill || '';

    if (!skillName) {
        logDebug('PostToolUse', 'track-skill-invocation.js', 'No skill name found', 'SKIP');
        return { success: false };
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
    return { success: true, skillName };
}

/* istanbul ignore next */
function main() {
    // Old logging system (keep for compatibility)
    logHookStartOld('PostToolUse', 'track-skill-invocation.js');

    // NEW: Unified logging system
    const startTime = unifiedLogger.logHookStart('PostToolUse', 'track-skill-invocation.js', 'core');

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
            const result = handleInvocation(data);

            // OLD: Keep old logging
            logHookEndOld('PostToolUse', 'track-skill-invocation.js', result.success);

            // NEW: Unified logging with skill invocation tracking
            if (result.success && result.skillName) {
                unifiedLogger.logSkillInvocation(result.skillName, {}, 'direct');
                unifiedLogger.logHookEnd('PostToolUse', 'track-skill-invocation.js', startTime, 'success', {
                    skill_name: result.skillName
                });
            } else {
                unifiedLogger.logHookEnd('PostToolUse', 'track-skill-invocation.js', startTime, 'skip', {
                    reason: 'not a skill invocation'
                });
            }

            process.exit(0);
        } catch (e) {
            logDebug('PostToolUse', 'track-skill-invocation.js', `ERROR: ${e.message}`, 'ERROR');

            // OLD: Keep old logging
            logHookEndOld('PostToolUse', 'track-skill-invocation.js', false);

            // NEW: Unified logging with error
            unifiedLogger.logHookEnd('PostToolUse', 'track-skill-invocation.js', startTime, 'error', {
                error_message: e.message
            });

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
