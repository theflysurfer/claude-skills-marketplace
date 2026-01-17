#!/usr/bin/env node
/**
 * Delete files with reserved Windows names (nul, null, con, prn, aux).
 * Hook: SessionEnd
 *
 * These files block OneDrive and cannot be deleted easily.
 * Uses the \\?\ extended path prefix to bypass Windows restrictions.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const RESERVED_NAMES = ['nul', 'null', 'con', 'prn', 'aux', 'com1', 'lpt1'];
const LOG_FILE = path.join(os.homedir(), '.claude', 'logs', 'cleanup-null.log');

/**
 * Delete a reserved Windows filename using extended path prefix.
 * @param {string} filepath - Path to delete
 * @returns {boolean} True if deleted
 */
function deleteReservedFile(filepath) {
    try {
        const absPath = path.resolve(filepath);

        // On Windows, use the \\?\ prefix via cmd /c del
        if (process.platform === 'win32') {
            const extendedPath = `\\\\?\\${absPath}`;
            execSync(`cmd /c del /f /q "${extendedPath}"`, {
                stdio: 'ignore',
                windowsHide: true
            });
            return true;
        } else {
            // On Unix, just use unlink
            fs.unlinkSync(absPath);
            return true;
        }
    } catch (e) {
        return false;
    }
}

/**
 * Check if a file exists (including reserved names on Windows).
 * @param {string} filepath - Path to check
 * @returns {boolean} True if exists
 */
function fileExists(filepath) {
    try {
        fs.accessSync(filepath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

/**
 * Log deletion to file.
 * @param {string[]} deleted - List of deleted file names
 * @param {string} targetDir - Directory where files were deleted
 */
function logDeletion(deleted, targetDir) {
    try {
        const logDir = path.dirname(LOG_FILE);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const timestamp = new Date().toISOString();
        const entry = `[${timestamp}] Deleted: ${deleted.join(', ')} in ${targetDir}\n`;
        fs.appendFileSync(LOG_FILE, entry);
    } catch {
        // Silent fail
    }
}

function main() {
    // Read JSON from stdin to get CWD
    let targetDir = null;

    try {
        let inputData = '';
        // Read stdin synchronously
        const fd = fs.openSync(0, 'r');
        const buf = Buffer.alloc(4096);
        let n;
        while ((n = fs.readSync(fd, buf)) > 0) {
            inputData += buf.slice(0, n).toString();
        }
        fs.closeSync(fd);

        if (inputData.trim()) {
            const data = JSON.parse(inputData);
            targetDir = data.cwd;
        }
    } catch {
        // No stdin or parse error
    }

    // Fallback to environment variable or current directory
    if (!targetDir) {
        targetDir = process.env.CLAUDE_PROJECT_DIR || process.env.CWD || process.cwd();
    }

    // Check and delete reserved files
    const deleted = [];

    for (const name of RESERVED_NAMES) {
        const filepath = path.join(targetDir, name);
        if (fileExists(filepath)) {
            if (deleteReservedFile(filepath)) {
                deleted.push(name);
            }
        }
    }

    // Log if something was deleted
    if (deleted.length > 0) {
        logDeletion(deleted, targetDir);
        // Also print to stderr for visibility
        console.error(`[cleanup] Deleted reserved files: ${deleted.join(', ')}`);
    }
}

main();
