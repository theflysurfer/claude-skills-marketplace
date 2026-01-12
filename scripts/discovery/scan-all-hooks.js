#!/usr/bin/env node
/**
 * Scan all projects for .claude/settings*.json with hooks.
 *
 * Scans predefined directories for projects containing hooks configuration
 * in settings.json or settings.local.json files.
 *
 * Pattern from scan-all-hooks.py
 */

const fs = require('fs');
const path = require('path');
const { writeJson } = require('../lib/file-utils');

// Directories to scan
const SCAN_DIRS = [
    'C:\\Users\\julien\\OneDrive\\Coding\\_Projets de code',
    'C:\\Users\\julien\\OneDrive\\Coding\\_référentiels de code'
];

// Projects to exclude
const EXCLUDE = ['2025.11 Claude Code MarketPlace'];

/**
 * Find all hooks in settings files within a directory tree.
 *
 * @param {string} basePath - Base directory to scan
 * @returns {Object} Results by project name
 */
function findHooks(basePath) {
    const results = {};

    // Check if base path exists
    if (!fs.existsSync(basePath)) {
        return results;
    }

    const items = fs.readdirSync(basePath);

    for (const item of items) {
        const itemPath = path.join(basePath, item);

        // Skip non-directories
        if (!fs.statSync(itemPath).isDirectory()) {
            continue;
        }

        // Skip excluded directories
        if (EXCLUDE.includes(item)) {
            continue;
        }

        // Skip hidden directories
        if (item.startsWith('.')) {
            continue;
        }

        // Check for .claude directory
        const claudeDir = path.join(itemPath, '.claude');
        if (!fs.existsSync(claudeDir)) {
            continue;
        }

        // Check both settings files
        const settingsFiles = ['settings.json', 'settings.local.json'];

        for (const settingsFile of settingsFiles) {
            const settingsPath = path.join(claudeDir, settingsFile);

            if (fs.existsSync(settingsPath)) {
                try {
                    const content = fs.readFileSync(settingsPath, 'utf8');
                    const data = JSON.parse(content);

                    if (data.hooks && Object.keys(data.hooks).length > 0) {
                        const hooks = data.hooks;
                        const hookSummary = {};

                        // Count hooks per event
                        for (const [event, config] of Object.entries(hooks)) {
                            if (config) {
                                // If it's an array, count items, otherwise count as 1
                                hookSummary[event] = Array.isArray(config) ? config.length : 1;
                            }
                        }

                        if (Object.keys(hookSummary).length > 0) {
                            // Initialize project entry if needed
                            if (!results[item]) {
                                results[item] = {
                                    path: itemPath,
                                    settings_files: []
                                };
                            }

                            results[item].settings_files.push({
                                file: settingsFile,
                                hooks: hookSummary,
                                full_hooks: hooks
                            });
                        }
                    }
                } catch (error) {
                    console.log(`Error reading ${settingsPath}: ${error.message}`);
                }
            }
        }
    }

    return results;
}

/**
 * Scan all configured directories for hooks.
 *
 * @param {string[]} scanDirs - Directories to scan
 * @returns {Object} Results by scan directory
 */
function scanAllDirectories(scanDirs) {
    const allResults = {};

    for (const scanDir of scanDirs) {
        if (fs.existsSync(scanDir)) {
            allResults[scanDir] = findHooks(scanDir);
        } else {
            allResults[scanDir] = {};
        }
    }

    return allResults;
}

/**
 * Main execution function.
 */
async function main() {
    const allResults = scanAllDirectories(SCAN_DIRS);
    let totalProjectsWithHooks = 0;

    // Count total projects with hooks
    for (const scanDir in allResults) {
        totalProjectsWithHooks += Object.keys(allResults[scanDir]).length;
    }

    // Print summary
    console.log('=== HOOKS SCAN RESULTS ===\n');
    console.log(`Total projects with hooks: ${totalProjectsWithHooks}\n`);

    for (const scanDir in allResults) {
        const projects = allResults[scanDir];
        if (Object.keys(projects).length > 0) {
            console.log(`\n--- ${scanDir} ---\n`);

            // Sort projects by name
            const sortedProjects = Object.entries(projects).sort((a, b) => a[0].localeCompare(b[0]));

            for (const [projectName, data] of sortedProjects) {
                console.log(`\n📁 ${projectName}`);

                for (const sf of data.settings_files) {
                    console.log(`   File: ${sf.file}`);

                    // Print hook counts
                    for (const [event, count] of Object.entries(sf.hooks)) {
                        console.log(`      - ${event}: ${count} hook(s)`);
                    }

                    // Print actual hook commands
                    console.log('   Commands:');
                    for (const [event, hooksList] of Object.entries(sf.full_hooks)) {
                        if (Array.isArray(hooksList)) {
                            for (const hookGroup of hooksList) {
                                if (hookGroup && typeof hookGroup === 'object' && hookGroup.hooks) {
                                    for (const h of hookGroup.hooks) {
                                        const cmd = (h.command || '').slice(0, 80);
                                        console.log(`      [${event}] ${cmd}...`);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Save JSON
    const outputPath = path.join(__dirname, '..', 'docs', 'hooks-scan-results.json');
    await writeJson(outputPath, {
        total_projects: totalProjectsWithHooks,
        results: allResults
    });
    console.log(`\n\nJSON saved to: ${outputPath}`);
}

// CLI wrapper
/* istanbul ignore next */
if (require.main === module) {
    main().catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}

module.exports = { findHooks, scanAllDirectories, main };
