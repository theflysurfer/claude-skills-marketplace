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
const { execSync } = require('child_process');

// Add lib directory to path for imports
const libDir = path.join(__dirname, 'lib');
const debugLogger = require(path.join(libDir, 'debug-logger.js'));

const { logHookStart, logHookEnd, logDebug } = debugLogger;

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

function loadRelevantMemories(projectName) {
    const claudeMemDir = path.join(os.homedir(), 'OneDrive', 'Coding', '_Projets de code', '2025.12 Claude Mem');
    const searchScript = path.join(claudeMemDir, 'search.py');
    const pythonExe = path.join(claudeMemDir, 'venv', 'Scripts', 'python.exe');

    logDebug('SessionStart', 'session-start-banner.js', `Checking for Claude Mem at ${claudeMemDir}`, 'INFO');

    if (!fs.existsSync(searchScript) || !fs.existsSync(pythonExe)) {
        logDebug('SessionStart', 'session-start-banner.js', 'Claude Mem not available', 'SKIP');
        return;
    }

    try {
        logDebug('SessionStart', 'session-start-banner.js', `Loading memories for project: ${projectName}`, 'INFO');
        const result = execSync(`"${pythonExe}" "${searchScript}" "${projectName}"`, {
            encoding: 'utf-8',
            timeout: 3000
        });

        if (result && result.trim()) {
            const lines = result.trim().split('\n');
            const memoryCount = lines.filter(l => l.trim() && !l.startsWith('=')).length;

            if (memoryCount > 0) {
                console.log(`\n📚 ${memoryCount} session(s) similaire(s) trouvée(s)`);
                console.log('   Use /system:semantic-memory-search for details');
                logDebug('SessionStart', 'session-start-banner.js', `Loaded ${memoryCount} memories`, 'OUTPUT');
            }
        }
    } catch (e) {
        logDebug('SessionStart', 'session-start-banner.js', `Error loading memories: ${e.message}`, 'ERROR');
    }
}

/* istanbul ignore next */
function main() {
    logHookStart('SessionStart', 'session-start-banner.js');

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

        // Auto-load memories
        loadRelevantMemories(projectName);

        console.log();

        logHookEnd('SessionStart', 'session-start-banner.js', true);

    } catch (e) {
        logDebug('SessionStart', 'session-start-banner.js', `ERROR: ${e.message}`, 'ERROR');
        logHookEnd('SessionStart', 'session-start-banner.js', false);
    }
}

// Export for testing
/* istanbul ignore else */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getProjectName,
        getSkillCount,
        loadRelevantMemories
    };
}

// Run main if executed directly
/* istanbul ignore if */
if (require.main === module) {
    main();
}
