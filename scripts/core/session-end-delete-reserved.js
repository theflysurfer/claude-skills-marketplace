#!/usr/bin/env node
/**
 * Silent deletion of Windows reserved/problematic filenames at session end.
 * Uses fd (5-10x faster than find) via Git Bash.
 *
 * Targets:
 * - Windows reserved names: nul, null, con, prn, aux
 * - Short filenames (0-1 character)
 */

const { execSync } = require('child_process');

// Add lib directory to path for imports
const path = require('path');
const libDir = path.join(__dirname, 'lib');
const debugLogger = require(path.join(libDir, 'debug-logger.js'));

const { logHookStart, logHookEnd, logDebug } = debugLogger;

function convertToGitBashPath(windowsPath) {
    if (!windowsPath) {
        return '';
    }

    // Convert Windows path to Git Bash path
    // C:\path\to\dir -> /c/path/to/dir
    let bashPath = windowsPath.replace(/\\/g, '/');

    if (bashPath.includes(':')) {
        bashPath = bashPath.replace(/^([A-Za-z]):/, (match, drive) => {
            return '/' + drive.toLowerCase();
        });
    }

    return bashPath;
}

function buildReservedFilesCommand(gitBashPath) {
    // Delete Windows reserved names using fd (ultra-fast)
    // -H = include hidden, -I = no-ignore (include .gitignore'd files)
    return `fd -H -I -t f -i "^(nul|null|con|prn|aux)$" "${gitBashPath}" --exec rm -f {} 2>/dev/null`;
}

function buildShortFilesCommand(gitBashPath) {
    // Delete files with 0-1 character filenames
    return `fd -H -I -t f "^.$" "${gitBashPath}" --exec rm -f {} 2>/dev/null`;
}

function executeCleanup(cwd) {
    if (!cwd) {
        return false;
    }

    // Convert to Git Bash path
    const gitBashPath = convertToGitBashPath(cwd);

    // Delete reserved names
    const reservedCmd = buildReservedFilesCommand(gitBashPath);
    try {
        execSync(`bash -c "${reservedCmd}"`, { timeout: 15000, stdio: 'ignore' });
    } catch (e) {
        // Silent fail for reserved files
    }

    // Delete short filenames
    const shortCmd = buildShortFilesCommand(gitBashPath);
    try {
        execSync(`bash -c "${shortCmd}"`, { timeout: 15000, stdio: 'ignore' });
    } catch (e) {
        // Silent fail for short files
    }

    return true;
}

/* istanbul ignore next */
function main() {
    logHookStart('SessionEnd', 'session-end-delete-reserved.js');

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
            const cwd = data.cwd || '';

            logDebug('SessionEnd', 'session-end-delete-reserved.js', `CWD: ${cwd}`, 'INFO');

            if (!cwd) {
                logDebug('SessionEnd', 'session-end-delete-reserved.js', 'No CWD provided', 'SKIP');
                logHookEnd('SessionEnd', 'session-end-delete-reserved.js', true);
                process.exit(0);
            }

            // Execute cleanup
            logDebug('SessionEnd', 'session-end-delete-reserved.js', 'Cleaning up reserved files...', 'INFO');
            const success = executeCleanup(cwd);

            logDebug('SessionEnd', 'session-end-delete-reserved.js', success ? 'Cleanup complete' : 'Cleanup skipped', success ? 'INFO' : 'SKIP');
            logHookEnd('SessionEnd', 'session-end-delete-reserved.js', true); // Always succeed (silent fail)
            process.exit(0);

        } catch (e) {
            logDebug('SessionEnd', 'session-end-delete-reserved.js', `ERROR: ${e.message}`, 'ERROR');
            logHookEnd('SessionEnd', 'session-end-delete-reserved.js', true); // Always succeed (silent fail)
            process.exit(0);
        }
    });
}

// Export for testing
/* istanbul ignore else */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        convertToGitBashPath,
        buildReservedFilesCommand,
        buildShortFilesCommand,
        executeCleanup
    };
}

// Run main if executed directly
/* istanbul ignore if */
if (require.main === module) {
    main();
}
