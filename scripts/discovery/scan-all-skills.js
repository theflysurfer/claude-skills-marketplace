#!/usr/bin/env node
/**
 * Scan all projects for .claude/skills folders and list skills.
 *
 * Scans predefined directories for projects containing skills,
 * categorizes items as: skill (with SKILL.md), dir_no_skill, or file (.md files).
 *
 * Pattern from scan-all-skills.py
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
 * Find all skills in a directory tree.
 *
 * @param {string} basePath - Base directory to scan
 * @returns {Object} Results by project name
 */
function findSkills(basePath) {
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

        // Check for .claude/skills directory
        const skillsPath = path.join(itemPath, '.claude', 'skills');
        if (!fs.existsSync(skillsPath) || !fs.statSync(skillsPath).isDirectory()) {
            continue;
        }

        // Scan skills directory
        const skills = [];
        const skillItems = fs.readdirSync(skillsPath);

        for (const skillItem of skillItems) {
            const skillItemPath = path.join(skillsPath, skillItem);
            const stat = fs.statSync(skillItemPath);

            if (stat.isDirectory()) {
                // Check if directory has SKILL.md
                const skillMdPath = path.join(skillItemPath, 'SKILL.md');
                if (fs.existsSync(skillMdPath)) {
                    skills.push({
                        name: skillItem,
                        type: 'skill',
                        path: skillItemPath
                    });
                } else {
                    skills.push({
                        name: skillItem,
                        type: 'dir_no_skill',
                        path: skillItemPath
                    });
                }
            } else if (stat.isFile() && path.extname(skillItem) === '.md') {
                // .md file directly in skills directory
                skills.push({
                    name: skillItem,
                    type: 'file',
                    path: skillItemPath
                });
            }
        }

        // Add project to results if it has skills
        if (skills.length > 0) {
            results[item] = {
                path: itemPath,
                skills_count: skills.filter(s => s.type === 'skill').length,
                items: skills
            };
        }
    }

    return results;
}

/**
 * Scan all configured directories for skills.
 *
 * @param {string[]} scanDirs - Directories to scan
 * @returns {Object} Results by scan directory
 */
function scanAllDirectories(scanDirs) {
    const allResults = {};

    for (const scanDir of scanDirs) {
        if (fs.existsSync(scanDir)) {
            allResults[scanDir] = findSkills(scanDir);
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
    let totalSkills = 0;

    // Count total skills
    for (const scanDir in allResults) {
        const projects = allResults[scanDir];
        for (const projectName in projects) {
            totalSkills += projects[projectName].skills_count;
        }
    }

    // Print summary
    console.log('=== SCAN RESULTS ===\n');
    console.log(`Total skills found: ${totalSkills}\n`);

    for (const scanDir in allResults) {
        const projects = allResults[scanDir];
        if (Object.keys(projects).length > 0) {
            console.log(`\n--- ${scanDir} ---\n`);

            // Sort projects by name
            const sortedProjects = Object.entries(projects).sort((a, b) => a[0].localeCompare(b[0]));

            for (const [projectName, data] of sortedProjects) {
                const skillCount = data.skills_count;
                const otherCount = data.items.length - skillCount;

                let line = `${projectName}: ${skillCount} skills`;
                if (otherCount > 0) {
                    line += ` (+${otherCount} other files)`;
                }
                console.log(line);

                // Print items
                for (const item of data.items) {
                    const marker = item.type === 'skill' ? '[SKILL]' :
                                   item.type === 'file' ? '[FILE]' : '[DIR]';
                    console.log(`    ${marker} ${item.name}`);
                }
            }
        }
    }

    // Save JSON
    const outputPath = path.join(__dirname, '..', 'docs', 'skills-scan-results.json');
    await writeJson(outputPath, {
        total_skills: totalSkills,
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

module.exports = { findSkills, scanAllDirectories, main };
