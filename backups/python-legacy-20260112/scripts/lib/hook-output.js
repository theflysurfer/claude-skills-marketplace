/**
 * Hook Output - Dual-channel output system for hooks
 *
 * Provides functions to output to terminal (stderr) and Claude context (stdout)
 * based on verbosity configuration.
 */

const { getVerbosity, shouldUseEmoji } = require('./config-reader.js');
const { logDebug } = require('./debug-logger.js');

/**
 * Output to terminal (stderr) based on verbosity level
 *
 * @param {string} message - Message to display
 * @param {number} minLevel - Minimum verbosity level to display (default: 2)
 */
function toTerminal(message, minLevel = 2) {
    const verbosity = getVerbosity();

    // LOG: Trace every call
    logDebug('ANY', 'hook-output', `toTerminal(minLevel=${minLevel}, verbosity=${verbosity})`, 'TRACE');

    if (verbosity >= minLevel) {
        logDebug('ANY', 'hook-output', `Writing to stderr: ${message.substring(0, 100)}...`, 'OUTPUT');
        console.error(message);
    } else {
        logDebug('ANY', 'hook-output', `Skipped (verbosity ${verbosity} < ${minLevel})`, 'SKIP');
    }
}

/**
 * Output to Claude context (stdout)
 *
 * @param {string} message - Message to inject into Claude's context
 * @param {string} prefix - Prefix (CONTEXT, INSTRUCTION, etc.)
 */
function toContext(message, prefix = 'CONTEXT') {
    logDebug('ANY', 'hook-output', `toContext(prefix=${prefix}, message_len=${message.length})`, 'TRACE');
    logDebug('ANY', 'hook-output', `Writing to stdout: ${prefix}: ${message.substring(0, 100)}...`, 'OUTPUT');

    console.log(`${prefix}: ${message}`);
}

/**
 * Output to both terminal and context
 *
 * @param {string} message - Message to output
 * @param {number} minLevel - Minimum verbosity level for terminal
 * @param {string} prefix - Prefix for context injection
 */
function toBoth(message, minLevel = 2, prefix = 'CONTEXT') {
    toTerminal(message, minLevel);
    toContext(message, prefix);
}

module.exports = { toTerminal, toContext, toBoth, getVerbosity, shouldUseEmoji };
