#!/usr/bin/env node
/**
 * Session Start Banner - Display project banner at session start
 * Hook: SessionStart
 *
 * Displays:
 * - Project name
 * - Skill count
 * - Terminal title
 * - Relevant memories from Claude Mem
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
// execSync removed - no longer needed after Claude Mem removal

// Add lib directory to path for imports
const libDir = path.join(__dirname, 'lib');
const debugLogger = require(path.join(libDir, 'debug-logger.js'));
const unifiedLogger = require(path.join(libDir, 'unified-logger.js'));

const { logHookStart: logHookStartOld, logHookEnd: logHookEndOld, logDebug } = debugLogger;

function getProjectName() {
    if (process.env.CLAUDE_PROJECT_DIR) {
        return path.basename(process.env.CLAUDE_PROJECT_DIR);
    }
    return path.basename(process.cwd());
}

function getSkillCount() {
    try {
        const registryPath = path.join(os.homedir(), '.claude', 'configs', 'hybrid-registry.json');
        if (fs.existsSync(registryPath)) {
            const data = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
            const count = Object.keys(data.skills || {}).length;
            logDebug('SessionStart', 'session-start-banner.js', `Found ${count} skills in registry`, 'INFO');
            return count;
        }
        logDebug('SessionStart', 'session-start-banner.js', 'Registry not found', 'SKIP');
    } catch (e) {
        logDebug('SessionStart', 'session-start-banner.js', `Error reading registry: ${e.message}`, 'ERROR');
    }
    return null;
}

// REMOVED: loadRelevantMemories() function
// This was causing 3-second timeouts on EVERY SessionStart (ETIMEDOUT errors)
// Claude Mem integration will be reimplemented in future with proper async handling
// For now, use /system:semantic-memory-search manually if needed

/* istanbul ignore next */
function main() {
    // Old logging system (keep for compatibility)
    logHookStartOld('SessionStart', 'session-start-banner.js');

    // NEW: Unified logging system
    const startTime = unifiedLogger.logHookStart('SessionStart', 'session-start-banner.js', 'core');

    try {
        const projectName = getProjectName();
        const skillCount = getSkillCount();

        logDebug('SessionStart', 'session-start-banner.js', `Project: ${projectName}`, 'INFO');
        logDebug('SessionStart', 'session-start-banner.js', `Skill count: ${skillCount}`, 'INFO');

        // Set terminal title
        try {
            process.stdout.write(`\x1b]0;${projectName}\x07`);
            logDebug('SessionStart', 'session-start-banner.js', 'Terminal title set', 'INFO');
        } catch (e) {
            logDebug('SessionStart', 'session-start-banner.js', `Error setting title: ${e.message}`, 'ERROR');
        }

        // Print banner
        const lineLength = Math.max(projectName.length + 4, 40);
        const line = '='.repeat(lineLength);
        const bannerLines = [
            '',
            line,
            `[>] ${projectName}`,
            line
        ];

        if (skillCount && skillCount > 0) {
            bannerLines.push(`\n[i] ${skillCount} skills | /help pour decouvrir`);
        }

        logDebug('SessionStart', 'session-start-banner.js', `Banner has ${bannerLines.length} lines`, 'INFO');
        logDebug('SessionStart', 'session-start-banner.js', 'Writing banner', 'OUTPUT');

        bannerLines.forEach(line => console.log(line));

        // REMOVED: loadRelevantMemories() call - was causing 3s timeout
        // See comment above for details

        console.log();

        // Old logging system
        logHookEndOld('SessionStart', 'session-start-banner.js', true);

        // NEW: Unified logging system with duration
        unifiedLogger.logHookEnd('SessionStart', 'session-start-banner.js', startTime, 'success', {
            project_name: projectName,
            skill_count: skillCount
        });

    } catch (e) {
        logDebug('SessionStart', 'session-start-banner.js', `ERROR: ${e.message}`, 'ERROR');
        logHookEndOld('SessionStart', 'session-start-banner.js', false);

        // NEW: Unified logging with error
        unifiedLogger.logHookEnd('SessionStart', 'session-start-banner.js', startTime, 'error', {
            error_message: e.message
        });
    }
}

// Export for testing
/* istanbul ignore else */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getProjectName,
        getSkillCount
        // loadRelevantMemories removed
    };
}

// Run main if executed directly
/* istanbul ignore if */
if (require.main === module) {
    main();
}
