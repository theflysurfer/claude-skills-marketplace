/**
 * Unified Logger for Claude Code Marketplace
 *
 * Provides structured JSONL logging for hooks, skills, and router decisions.
 * Logs to ~/.claude/logs/unified.jsonl for real-time monitoring and analysis.
 *
 * Format: One JSON object per line (JSONL)
 * Features:
 * - Session ID tracking
 * - Project path correlation
 * - Performance metrics
 * - Hook/skill/router correlation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Log file path
const LOG_DIR = path.join(os.homedir(), '.claude', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'unified.jsonl');

// Rolling log configuration
const MAX_LOG_LINES = 5000;  // Keep last 5000 lines (~5-10MB)
const CHECK_INTERVAL = 100;   // Check rotation every 100 writes
let writeCounter = 0;

// Generate stable session ID for this process
// Format: timestamp-random (e.g., "1736628000000-a3f9")
const SESSION_ID = `${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;

// Ensure log directory exists
try {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
} catch (e) {
    // Silent fail - logging is optional
}

/**
 * Get session context from environment variables
 */
function getSessionContext() {
    return {
        session_id: SESSION_ID,  // Use generated session ID
        project_name: process.env.CLAUDE_PROJECT_NAME || path.basename(process.env.CWD || process.cwd()),
        project_path: process.env.CWD || process.cwd()
    };
}

/**
 * Rotate log file if it exceeds MAX_LOG_LINES
 * Keeps only the most recent lines (rolling buffer)
 * @private
 */
function rotateLogIfNeeded() {
    try {
        if (!fs.existsSync(LOG_FILE)) return;

        // Read all lines
        const content = fs.readFileSync(LOG_FILE, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());

        // Check if rotation needed
        if (lines.length > MAX_LOG_LINES) {
            // Keep only last MAX_LOG_LINES lines
            const recentLines = lines.slice(-MAX_LOG_LINES);
            fs.writeFileSync(LOG_FILE, recentLines.join('\n') + '\n', 'utf-8');
        }
    } catch (e) {
        // Silent fail - rotation errors shouldn't break logging
    }
}

/**
 * Write a log entry to unified.jsonl
 * @private
 */
function writeLog(entry) {
    try {
        const line = JSON.stringify(entry) + '\n';
        fs.appendFileSync(LOG_FILE, line, 'utf-8');

        // Check for rotation periodically (not on every write for performance)
        writeCounter++;
        if (writeCounter >= CHECK_INTERVAL) {
            rotateLogIfNeeded();
            writeCounter = 0;
        }
    } catch (e) {
        // Silent fail - logging should never break the hook
        console.error('[unified-logger] Failed to write log:', e.message);
    }
}

/**
 * Log hook start event
 * @param {string} eventType - SessionStart|UserPromptSubmit|PreToolUse|PostToolUse|SessionEnd|PreCompact|Stop
 * @param {string} hookName - Name of the hook script (e.g., 'session-start-banner.js')
 * @param {string} hookType - core|project|plugin
 * @param {object} metadata - Additional metadata (optional)
 */
function logHookStart(eventType, hookName, hookType = 'core', metadata = {}) {
    const context = getSessionContext();
    const entry = {
        timestamp: new Date().toISOString(),
        ...context,
        event_type: eventType,
        hook_name: hookName,
        hook_type: hookType,
        action: 'start',
        ...metadata
    };
    writeLog(entry);
    return Date.now(); // Return start time for duration calculation
}

/**
 * Log hook end event with duration and status
 * @param {string} eventType - SessionStart|UserPromptSubmit|etc.
 * @param {string} hookName - Name of the hook script
 * @param {number} startTime - Start time from logHookStart() (timestamp in ms)
 * @param {string} status - success|error|timeout|skip
 * @param {object} details - Additional details (error messages, skip reasons, etc.)
 */
function logHookEnd(eventType, hookName, startTime, status = 'success', details = {}) {
    const context = getSessionContext();
    const duration_ms = Date.now() - startTime;

    const entry = {
        timestamp: new Date().toISOString(),
        ...context,
        event_type: eventType,
        hook_name: hookName,
        action: 'end',
        duration_ms,
        status,
        details
    };
    writeLog(entry);
}

/**
 * Log skill invocation
 * @param {string} skillName - Name of the skill invoked
 * @param {object} args - Arguments passed to the skill
 * @param {string} source - How was the skill invoked (router|manual|command)
 */
function logSkillInvocation(skillName, args = {}, source = 'unknown') {
    const context = getSessionContext();
    const entry = {
        timestamp: new Date().toISOString(),
        ...context,
        event_type: 'SkillInvocation',
        skill_name: skillName,
        source,
        args
    };
    writeLog(entry);
}

/**
 * Log router decision
 * @param {string} prompt - User prompt (truncated to 200 chars)
 * @param {array} matches - Array of matched skills with scores
 * @param {object} context - Context object with cwd_extensions and top_10_scores
 * @param {number} elapsed - Routing time in milliseconds
 */
function logRouterDecision(prompt, matches, contextData = {}, elapsed = 0) {
    const context = getSessionContext();

    // Extract cwd_extensions and top_10_scores from contextData
    const cwdExtensions = contextData.cwd_extensions || {};
    const top10Scores = contextData.top_10_scores || [];

    const entry = {
        timestamp: new Date().toISOString(),
        ...context,
        event_type: 'RouterDecision',
        prompt: prompt.substring(0, 200), // Truncate for privacy
        matches: matches.slice(0, 3).map(m => ({
            name: m.name,
            score: Math.round(m.score * 100) / 100,
            source: m.source
        })),
        cwd_extensions: Object.keys(cwdExtensions).length > 0 ?
            Array.from(Object.entries(cwdExtensions)).map(([ext, count]) => `${count}×${ext}`) :
            [],
        top_10_scores: top10Scores,
        duration_ms: elapsed,
        match_count: matches.length
    };
    writeLog(entry);
}

/**
 * Log performance metrics
 * @param {object} metrics - Performance metrics {memory_mb, cpu_percent, etc.}
 */
function logPerformance(metrics = {}) {
    const context = getSessionContext();
    const entry = {
        timestamp: new Date().toISOString(),
        ...context,
        event_type: 'Performance',
        metrics
    };
    writeLog(entry);
}

/**
 * Log generic event
 * @param {string} eventType - Custom event type
 * @param {object} data - Event data
 */
function logEvent(eventType, data = {}) {
    const context = getSessionContext();
    const entry = {
        timestamp: new Date().toISOString(),
        ...context,
        event_type: eventType,
        ...data
    };
    writeLog(entry);
}

module.exports = {
    logHookStart,
    logHookEnd,
    logSkillInvocation,
    logRouterDecision,
    logPerformance,
    logEvent
};
