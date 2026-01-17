#!/usr/bin/env node
/**
 * Debug Project Discovery - Test why project sources aren't found.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const fg = require('fast-glob');

const MARKETPLACE_ROOT = path.resolve(__dirname, '../..');
const REGISTRY_DIR = path.join(MARKETPLACE_ROOT, 'registry');
const SYNC_CONFIG_PATH = path.join(REGISTRY_DIR, 'sync-config.json');

async function fileExists(p) {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

async function main() {
    console.log('=== DEBUG PROJECT DISCOVERY ===\n');

    // Load sync config
    const syncConfig = JSON.parse(await fs.readFile(SYNC_CONFIG_PATH, 'utf-8'));
    console.log(`Loaded sync-config with ${syncConfig.project_sources.length} project_sources\n`);

    const searchRoots = [
        path.join(os.homedir(), 'OneDrive', 'Coding', '_Projets de code'),
        path.join(os.homedir(), 'Projects'),
        path.join(os.homedir(), 'Code'),
        process.cwd()
    ];

    console.log('Search roots:');
    for (const root of searchRoots) {
        const exists = await fileExists(root);
        console.log(`  ${exists ? '✓' : '✗'} ${root}`);
    }
    console.log('');

    // Test each project source
    for (const sourceConfig of syncConfig.project_sources) {
        const projectPattern = sourceConfig.project_pattern;
        const skillsPath = sourceConfig.skills_path || '.claude/skills';

        console.log(`\n--- Pattern: ${projectPattern} ---`);

        for (const root of searchRoots) {
            if (!await fileExists(root)) continue;

            console.log(`\n  Testing from: ${root}`);

            // Test 1: Direct glob
            try {
                const found = await fg(projectPattern, {
                    onlyDirectories: true,
                    absolute: true,
                    ignore: ['**/node_modules/**', '**/.git/**'],
                    cwd: root
                });
                console.log(`    Glob result: ${found.length} matches`);
                for (const match of found) {
                    console.log(`      - ${match}`);
                    const skillsDir = path.join(match, skillsPath);
                    const hasSkills = await fileExists(skillsDir);
                    console.log(`        Skills dir (${skillsPath}): ${hasSkills ? 'EXISTS' : 'NOT FOUND'}`);
                }
            } catch (err) {
                console.log(`    Glob error: ${err.message}`);
            }

            // Test 2: Try simpler pattern (just the folder name)
            const simpleName = projectPattern.replace('**/', '');
            try {
                const simpleFound = await fg(`**/${simpleName}`, {
                    onlyDirectories: true,
                    absolute: true,
                    ignore: ['**/node_modules/**', '**/.git/**'],
                    cwd: root,
                    deep: 2
                });
                if (simpleFound.length > 0 && simpleFound.length !== found?.length) {
                    console.log(`    Simple pattern (**/${simpleName}) found: ${simpleFound.length}`);
                }
            } catch (err) {
                // Ignore
            }
        }
    }

    // Test 3: Direct directory listing
    console.log('\n\n=== DIRECT DIRECTORY CHECK ===');
    const mainRoot = path.join(os.homedir(), 'OneDrive', 'Coding', '_Projets de code');
    console.log(`\nListing ${mainRoot}:`);

    try {
        const entries = await fs.readdir(mainRoot, { withFileTypes: true });
        const projectDirs = entries.filter(e => e.isDirectory() && e.name.startsWith('2025.'));
        console.log(`Found ${projectDirs.length} project directories (starting with 2025.):`);

        for (const dir of projectDirs.slice(0, 10)) {
            const skillsDir = path.join(mainRoot, dir.name, '.claude', 'skills');
            const hasSkills = await fileExists(skillsDir);
            console.log(`  ${hasSkills ? '✓' : '-'} ${dir.name}`);
        }
        if (projectDirs.length > 10) {
            console.log(`  ... and ${projectDirs.length - 10} more`);
        }
    } catch (err) {
        console.log(`Error listing: ${err.message}`);
    }

    // Test 4: Check specific projects from config
    console.log('\n\n=== CHECK CONFIGURED PROJECTS ===');
    for (const sourceConfig of syncConfig.project_sources) {
        const projectName = sourceConfig.project_pattern.replace('**/', '');
        const fullPath = path.join(mainRoot, projectName);
        const skillsDir = path.join(fullPath, '.claude', 'skills');

        const dirExists = await fileExists(fullPath);
        const skillsExists = await fileExists(skillsDir);

        console.log(`\n${projectName}:`);
        console.log(`  Directory: ${dirExists ? '✓ EXISTS' : '✗ NOT FOUND'} - ${fullPath}`);
        console.log(`  Skills:    ${skillsExists ? '✓ EXISTS' : '✗ NOT FOUND'} - ${skillsDir}`);

        if (skillsExists) {
            try {
                const skillFiles = await fg('**/SKILL.md', { cwd: skillsDir, absolute: true });
                console.log(`  SKILL.md files: ${skillFiles.length}`);
                for (const f of skillFiles) {
                    console.log(`    - ${path.relative(skillsDir, f)}`);
                }
            } catch (e) {
                console.log(`  Error scanning skills: ${e.message}`);
            }
        }
    }
}

main().catch(console.error);
