#!/usr/bin/env node
/**
 * Generate skill-triggers.json from hybrid-registry.json.
 *
 * Primary mode: Uses hybrid-registry.json (preferred).
 * Fallback mode: Scans SKILL.md files directly.
 *
 * Pattern from generate-triggers.py
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { program } = require('commander');
const fg = require('fast-glob');

const { extractYaml, extractContentSummary } = require('../lib/yaml-parser');
const { readJson, writeJson, fileExists, readFile } = require('../lib/file-utils');

// Constants
const MARKETPLACE_ROOT = path.resolve(__dirname, '../..');
const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const REGISTRY_DIR = path.join(MARKETPLACE_ROOT, 'registry');
const HYBRID_REGISTRY_PATH = path.join(REGISTRY_DIR, 'hybrid-registry.json');
const OUTPUT_PATH = path.join(REGISTRY_DIR, 'skill-triggers.json');

/**
 * Generate skill-triggers.json from hybrid-registry.json.
 * Pattern from generate-triggers.py lines 150-221.
 *
 * @returns {Promise<boolean>} True if successful, False if registry not available
 */
async function generateFromHybridRegistry() {
    // Try marketplace registry first, then global
    let registryPath = HYBRID_REGISTRY_PATH;

    if (!await fileExists(registryPath)) {
        registryPath = path.join(CLAUDE_HOME, 'registry', 'hybrid-registry.json');
    }

    if (!await fileExists(registryPath)) {
        return false;
    }

    try {
        const registry = await readJson(registryPath);

        if (!registry || !registry.skills || registry.skills.length === 0) {
            return false;
        }

        const skillsList = [];

        for (const skill of registry.skills) {
            const triggers = skill.triggers || [];
            if (triggers.length === 0) {
                continue;
            }

            const skillEntry = {
                name: skill.name,
                triggers,
                description: skill.description || '',
                source: skill.source || 'marketplace'
            };

            // Add content summary if available
            if (skill.summary) {
                skillEntry.content_summary = skill.summary;
            }

            skillsList.push(skillEntry);
        }

        // Sort by name for consistency
        skillsList.sort((a, b) => a.name.localeCompare(b.name));

        const result = {
            generated: true,
            version: '4.0.0',
            description: 'Auto-generated from hybrid-registry.json. DO NOT EDIT MANUALLY.',
            source: 'hybrid-registry',
            skills: skillsList
        };

        await writeJson(OUTPUT_PATH, result);

        console.log(`Generated from hybrid registry: ${OUTPUT_PATH}`);
        console.log(`  Skills included: ${skillsList.length}`);

        // Count by source
        const sources = {};
        for (const skill of skillsList) {
            const src = skill.source || 'unknown';
            sources[src] = (sources[src] || 0) + 1;
        }

        console.log('\n  By source:');
        for (const [src, count] of Object.entries(sources).sort()) {
            console.log(`    - ${src}: ${count}`);
        }

        return true;

    } catch (error) {
        console.error(`Error reading registry: ${error.message}`);
        return false;
    }
}

/**
 * Generate skill-triggers.json by scanning SKILL.md files directly (fallback).
 * Pattern from generate-triggers.py lines 247-318.
 *
 * @returns {Promise<void>}
 */
async function generateFromSkillFiles() {
    console.log('Falling back to SKILL.md scan...');

    const skillsDir = path.join(MARKETPLACE_ROOT, 'skills');

    if (!await fileExists(skillsDir)) {
        throw new Error(`Skills directory not found: ${skillsDir}`);
    }

    // Find all SKILL.md files
    const skillFiles = await fg('**/SKILL.md', {
        cwd: skillsDir,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/deprecated/**']
    });

    const skillsWithTriggers = [];
    const skillsWithoutTriggers = [];

    for (const skillFile of skillFiles.sort()) {
        try {
            const content = await readFile(skillFile);
            const yaml = extractYaml(content);

            const name = yaml.name || path.basename(path.dirname(skillFile));
            const description = yaml.description || '';
            const triggers = yaml.triggers || [];

            // Extract content summary
            const contentSummary = extractContentSummary(content);

            if (triggers && Array.isArray(triggers) && triggers.length > 0) {
                const skillEntry = {
                    name,
                    triggers,
                    description
                };

                if (contentSummary) {
                    skillEntry.content_summary = contentSummary;
                }

                skillsWithTriggers.push(skillEntry);
            } else {
                skillsWithoutTriggers.push(name);
            }

        } catch (error) {
            console.warn(`Warning: Error processing ${skillFile}: ${error.message}`);
        }
    }

    // Generate output
    const result = {
        generated: true,
        version: '3.0.0',
        description: 'Auto-generated from SKILL.md frontmatter. DO NOT EDIT MANUALLY.',
        skills: skillsWithTriggers
    };

    await writeJson(OUTPUT_PATH, result);

    // Report
    console.log(`Generated: ${OUTPUT_PATH}`);
    console.log(`  Skills with triggers: ${skillsWithTriggers.length}`);
    console.log(`  Skills without triggers: ${skillsWithoutTriggers.length}`);

    if (skillsWithTriggers.length > 0) {
        console.log('\nSkills included:');
        for (const skill of skillsWithTriggers) {
            console.log(`  - ${skill.name} (${skill.triggers.length} triggers)`);
        }
    }

    if (skillsWithoutTriggers.length > 0 && skillsWithoutTriggers.length <= 10) {
        console.log('\nSkills without triggers (not included):');
        for (const name of skillsWithoutTriggers.slice(0, 10)) {
            console.log(`  - ${name}`);
        }
        if (skillsWithoutTriggers.length > 10) {
            console.log(`  ... and ${skillsWithoutTriggers.length - 10} more`);
        }
    }
}

/**
 * Main execution function.
 *
 * @param {object} options - CLI options
 * @returns {Promise<void>}
 */
async function main(options) {
    console.log('Generating skill-triggers.json...');

    // Try hybrid registry first (preferred)
    if (options.fromRegistry || await fileExists(HYBRID_REGISTRY_PATH)) {
        if (await generateFromHybridRegistry()) {
            return;
        }
    }

    // Fallback to direct SKILL.md scan
    await generateFromSkillFiles();
}

// CLI
/* istanbul ignore next */
if (require.main === module) {
    program
        .name('generate-triggers')
        .description('Generate skill-triggers.json from hybrid-registry or SKILL.md files')
        .option('--from-registry', 'Force use of hybrid-registry.json')
        .option('--json', 'Output JSON to stdout')
        .parse(process.argv);

    const options = program.opts();

    main(options)
        .then(() => {
            process.exit(0);
        })
        .catch(error => {
            console.error('Error:', error.message);
            console.error(error.stack);
            process.exit(1);
        });
}

module.exports = { main, generateFromHybridRegistry, generateFromSkillFiles };
