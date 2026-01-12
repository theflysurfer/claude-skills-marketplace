#!/usr/bin/env node
/**
 * Cleanup ~/.claude.json - Remove stale projects, caches, and bloat.
 *
 * Can be run manually or via SessionEnd hook.
 * Usage: node cleanup-claude-json.js [--dry-run] [--verbose]
 *
 * Pattern from cleanup-claude-json.py
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const MAX_FILE_SIZE_MB = 5; // Warn if file exceeds this size
const BACKUP_BEFORE_CLEANUP = true;

/**
 * Get path to ~/.claude.json
 *
 * @returns {string} Path to claude.json
 */
function getClaudeJsonPath() {
    return path.join(os.homedir(), '.claude.json');
}

/**
 * Get file size in MB
 *
 * @param {string} filePath - Path to file
 * @returns {number} File size in MB
 */
function getFileSizeMB(filePath) {
    if (!fs.existsSync(filePath)) {
        return 0;
    }
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024);
}

/**
 * Create a timestamped backup of the file
 *
 * @param {string} filePath - Path to file to backup
 * @returns {string} Path to backup file
 */
function backupFile(filePath) {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '_')
        .slice(0, 15); // YYYYMMDD_HHMMSS

    const backupPath = path.join(
        path.dirname(filePath),
        `.claude.json.backup_${timestamp}`
    );

    fs.copyFileSync(filePath, backupPath);
    return backupPath;
}

/**
 * Remove projects whose directories no longer exist
 *
 * @param {Object} data - Claude.json data
 * @param {boolean} dryRun - If true, don't modify data
 * @param {boolean} verbose - If true, print verbose output
 * @returns {number} Number of stale projects removed
 */
function cleanupStaleProjects(data, dryRun = false, verbose = false) {
    let removed = 0;
    const projects = data.projects || {};

    for (const projectPath of Object.keys(projects)) {
        if (!fs.existsSync(projectPath)) {
            if (verbose) {
                console.log(`  [STALE] ${projectPath}`);
            }

            if (!dryRun) {
                delete projects[projectPath];
            }

            removed++;
        }
    }

    return removed;
}

/**
 * Clear cached data that can be regenerated
 *
 * @param {Object} data - Claude.json data
 * @param {boolean} dryRun - If true, don't modify data
 * @param {boolean} verbose - If true, print verbose output
 * @returns {number} Number of caches cleared
 */
function cleanupCaches(data, dryRun = false, verbose = false) {
    let cleaned = 0;

    // Clear statsig caches (feature flags, regenerated on startup)
    if (data.cachedStatsigGates && Object.keys(data.cachedStatsigGates).length > 0) {
        if (verbose) {
            console.log(`  [CACHE] cachedStatsigGates (${Object.keys(data.cachedStatsigGates).length} entries)`);
        }

        if (!dryRun) {
            data.cachedStatsigGates = {};
        }

        cleaned++;
    }

    if (data.cachedDynamicConfigs && Object.keys(data.cachedDynamicConfigs).length > 0) {
        if (verbose) {
            console.log(`  [CACHE] cachedDynamicConfigs (${Object.keys(data.cachedDynamicConfigs).length} entries)`);
        }

        if (!dryRun) {
            data.cachedDynamicConfigs = {};
        }

        cleaned++;
    }

    return cleaned;
}

/**
 * Reset tips history counters
 *
 * @param {Object} data - Claude.json data
 * @param {boolean} dryRun - If true, don't modify data
 * @param {boolean} verbose - If true, print verbose output
 * @returns {number} 1 if tips history was reset, 0 otherwise
 */
function cleanupTipsHistory(data, dryRun = false, verbose = false) {
    if (data.tipsHistory && Object.keys(data.tipsHistory).length > 0) {
        const count = Object.keys(data.tipsHistory).length;

        if (verbose) {
            console.log(`  [TIPS] tipsHistory (${count} entries)`);
        }

        if (!dryRun) {
            data.tipsHistory = {};
        }

        return 1;
    }

    return 0;
}

/**
 * Reset per-project statistics
 *
 * @param {Object} data - Claude.json data
 * @param {boolean} dryRun - If true, don't modify data
 * @param {boolean} verbose - If true, print verbose output
 * @returns {number} Number of stat entries cleared
 */
function cleanupProjectStats(data, dryRun = false, verbose = false) {
    let cleaned = 0;

    const statsKeys = [
        'lastCost', 'lastAPIDuration', 'lastAPIDurationWithoutRetries',
        'lastToolDuration', 'lastDuration', 'lastLinesAdded', 'lastLinesRemoved',
        'lastTotalInputTokens', 'lastTotalOutputTokens',
        'lastTotalCacheCreationInputTokens', 'lastTotalCacheReadInputTokens',
        'lastModelUsage', 'lastTotalWebSearchRequests'
    ];

    const projects = data.projects || {};

    for (const projectPath in projects) {
        const projectData = projects[projectPath];

        for (const key of statsKeys) {
            if (key in projectData) {
                if (!dryRun) {
                    delete projectData[key];
                }

                cleaned++;
            }
        }
    }

    if (verbose && cleaned > 0) {
        console.log(`  [STATS] Cleared ${cleaned} stat entries across ${Object.keys(projects).length} projects`);
    }

    return cleaned;
}

/**
 * Remove any base64 encoded content (images, etc.)
 *
 * @param {Object} data - Claude.json data
 * @param {boolean} dryRun - If true, don't modify data
 * @param {boolean} verbose - If true, print verbose output
 * @returns {number} Number of base64 fields removed
 */
function cleanupBase64Content(data, dryRun = false, verbose = false) {
    let cleaned = 0;

    function scanAndClean(obj, pathStr = '') {
        if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            const keysToDelete = [];

            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string' && value.length > 1000) {
                    // Check if it looks like base64
                    const isDataImage = value.startsWith('data:image');
                    const looksLikeBase64 = value.length > 5000 &&
                        value.slice(0, 100).split('').every(c =>
                            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.includes(c)
                        );

                    if (isDataImage || looksLikeBase64) {
                        if (verbose) {
                            console.log(`  [BASE64] ${pathStr}.${key} (${value.length} chars)`);
                        }

                        keysToDelete.push(key);
                        cleaned++;
                    }
                } else if (typeof value === 'object' && value !== null) {
                    scanAndClean(value, `${pathStr}.${key}`);
                }
            }

            if (!dryRun) {
                for (const key of keysToDelete) {
                    delete obj[key];
                }
            }
        } else if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                scanAndClean(item, `${pathStr}[${index}]`);
            });
        }
    }

    scanAndClean(data);
    return cleaned;
}

/**
 * Main execution function
 *
 * @returns {Promise<number>} Exit code
 */
async function main() {
    const dryRun = process.argv.includes('--dry-run');
    const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');

    const claudeJson = getClaudeJsonPath();

    if (!fs.existsSync(claudeJson)) {
        console.log(`File not found: ${claudeJson}`);
        return 1;
    }

    // Check file size
    const sizeMB = getFileSizeMB(claudeJson);
    console.log(`File: ${claudeJson}`);
    console.log(`Size: ${sizeMB.toFixed(2)} MB`);

    if (sizeMB > MAX_FILE_SIZE_MB) {
        console.log(`WARNING: File exceeds ${MAX_FILE_SIZE_MB} MB threshold!`);
    }

    if (dryRun) {
        console.log('\n[DRY RUN - No changes will be made]\n');
    }

    // Load data
    const content = fs.readFileSync(claudeJson, 'utf8');
    const data = JSON.parse(content);

    // Backup
    if (BACKUP_BEFORE_CLEANUP && !dryRun) {
        const backupPath = backupFile(claudeJson);
        console.log(`Backup: ${backupPath}\n`);
    }

    // Run cleanups
    console.log('Cleanup operations:');

    const stale = cleanupStaleProjects(data, dryRun, verbose);
    console.log(`  - Stale projects removed: ${stale}`);

    const caches = cleanupCaches(data, dryRun, verbose);
    console.log(`  - Caches cleared: ${caches}`);

    const tips = cleanupTipsHistory(data, dryRun, verbose);
    console.log(`  - Tips history reset: ${tips ? 'yes' : 'no'}`);

    const stats = cleanupProjectStats(data, dryRun, verbose);
    console.log(`  - Project stats cleared: ${stats}`);

    const base64 = cleanupBase64Content(data, dryRun, verbose);
    console.log(`  - Base64 content removed: ${base64}`);

    // Save
    if (!dryRun) {
        fs.writeFileSync(claudeJson, JSON.stringify(data, null, 2), 'utf8');

        const newSizeMB = getFileSizeMB(claudeJson);
        const saved = sizeMB - newSizeMB;
        console.log(`\nNew size: ${newSizeMB.toFixed(2)} MB (saved ${saved.toFixed(2)} MB)`);
    } else {
        console.log('\n[DRY RUN COMPLETE - Run without --dry-run to apply changes]');
    }

    return 0;
}

// CLI wrapper
/* istanbul ignore next */
if (require.main === module) {
    main().then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}

module.exports = {
    getClaudeJsonPath,
    getFileSizeMB,
    backupFile,
    cleanupStaleProjects,
    cleanupCaches,
    cleanupTipsHistory,
    cleanupProjectStats,
    cleanupBase64Content,
    main
};
