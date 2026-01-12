/**
 * Debug Logger - Centralized logging for hooks debugging
 *
 * Logs hook execution to ~/.claude/logs/hooks-debug.log for diagnostics.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const LOG_FILE = path.join(os.homedir(), '.claude', 'logs', 'hooks-debug.log');

/**
 * Log debug info to centralized file
 *
 * @param {string} hookName - Hook type (SessionStart, UserPromptSubmit, etc.)
 * @param {string} scriptName - Script name (fast-skill-router.js, etc.)
 * @param {string} message - Log message
 * @param {string} level - Log level (INFO, ERROR, TRACE, etc.)
 */
function logDebug(hookName, scriptName, message, level = 'INFO') {
    try {
        const dir = path.dirname(LOG_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);
        const line = `[${timestamp}] [${hookName}] [${scriptName}] [${level}] ${message}\n`;

        fs.appendFileSync(LOG_FILE, line, 'utf-8');
    } catch (error) {
        // Silently fail - logging should never break hooks
    }
}

/**
 * Log hook execution start with environment vars
 *
 * @param {string} hookName - Hook type
 * @param {string} scriptName - Script name
 */
function logHookStart(hookName, scriptName) {
    logDebug(hookName, scriptName, 'START', 'INFO');

    const verbosity = process.env.CLAUDE_VERBOSITY || 'not set';
    const emoji = process.env.CLAUDE_HOOK_EMOJI || 'not set';
    logDebug(hookName, scriptName, `CLAUDE_VERBOSITY=${verbosity}`, 'ENV');
    logDebug(hookName, scriptName, `CLAUDE_HOOK_EMOJI=${emoji}`, 'ENV');
}

/**
 * Log hook execution end
 *
 * @param {string} hookName - Hook type
 * @param {string} scriptName - Script name
 * @param {boolean} success - Whether hook succeeded
 */
function logHookEnd(hookName, scriptName, success = true) {
    const status = success ? 'SUCCESS' : 'FAILED';
    logDebug(hookName, scriptName, `END (${status})`, 'INFO');
}

module.exports = { logDebug, logHookStart, logHookEnd };
