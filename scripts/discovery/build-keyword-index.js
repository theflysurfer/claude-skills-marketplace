#!/usr/bin/env node
/**
 * Build keyword index for fast skill routing (<50ms target).
 * Pre-computes all keyword→skill mappings as JSON lookup.
 *
 * Run during /sync. Output: ~/.claude/cache/keyword-index.json
 *
 * Pattern from build-keyword-index.py
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const { readJson, writeJson, fileExists, getStats, ensureDir } = require('../lib/file-utils');

// Constants
const MARKETPLACE_ROOT = path.resolve(__dirname, '../..');
const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const INDEX_FILE = path.join(CLAUDE_HOME, 'cache', 'keyword-index.json');

// Try multiple locations for skill-triggers.json (marketplace registry, global registry)
const TRIGGERS_FILE_LOCATIONS = [
    path.join(MARKETPLACE_ROOT, 'registry', 'skill-triggers.json'),
    path.join(CLAUDE_HOME, 'registry', 'skill-triggers.json'),
    path.join(CLAUDE_HOME, 'configs', 'skill-triggers.json')
];

/**
 * Extract lowercase words from text.
 * Pattern from build-keyword-index.py lines 19-21.
 *
 * @param {string} text - Text to tokenize
 * @returns {Set<string>} Set of words (2+ chars)
 */
function tokenize(text) {
    const words = text.toLowerCase().match(/\b\w{2,}\b/g) || [];
    return new Set(words);
}

/**
 * Build keyword→skills inverted index.
 * Pattern from build-keyword-index.py lines 24-102.
 *
 * @returns {Promise<boolean>} True if successful
 */
async function buildIndex() {
    // Find skill-triggers.json in any of the possible locations
    let triggersFile = null;
    for (const location of TRIGGERS_FILE_LOCATIONS) {
        if (await fileExists(location)) {
            triggersFile = location;
            break;
        }
    }

    if (!triggersFile) {
        console.error(`Error: skill-triggers.json not found in any of:`);
        for (const location of TRIGGERS_FILE_LOCATIONS) {
            console.error(`  - ${location}`);
        }
        return false;
    }

    console.log(`Using triggers file: ${triggersFile}`);

    const data = await readJson(triggersFile);
    const skills = data?.skills || [];

    if (skills.length === 0) {
        console.error('No skills found');
        return false;
    }

    // Build inverted index: keyword → [(skill_name, weight)]
    const keywordIndex = {};
    const skillInfo = {};

    for (const skill of skills) {
        const name = skill.name || '';
        const desc = skill.description || '';
        const source = skill.source || '';
        const triggers = skill.triggers || [];

        skillInfo[name] = {
            description: desc.slice(0, 100),
            source
        };

        // Index each trigger phrase
        for (const trigger of triggers) {
            const triggerLower = trigger.toLowerCase();
            const words = tokenize(trigger);

            // Full phrase match (highest weight)
            if (!keywordIndex[triggerLower]) {
                keywordIndex[triggerLower] = [];
            }
            keywordIndex[triggerLower].push([name, 1.0]);

            // Individual words (lower weight)
            for (const word of words) {
                if (word.length >= 3) {
                    if (!keywordIndex[word]) {
                        keywordIndex[word] = [];
                    }
                    keywordIndex[word].push([name, 0.3]);
                }
            }
        }

        // Index description words (lowest weight)
        const descWords = tokenize(desc);
        for (const word of descWords) {
            if (word.length >= 4) {
                if (!keywordIndex[word]) {
                    keywordIndex[word] = [];
                }
                keywordIndex[word].push([name, 0.1]);
            }
        }
    }

    // Deduplicate and sort by weight
    const finalIndex = {};

    for (const [keyword, matches] of Object.entries(keywordIndex)) {
        // Aggregate scores per skill
        const skillScores = {};

        for (const [skillName, weight] of matches) {
            skillScores[skillName] = (skillScores[skillName] || 0) + weight;
        }

        // Sort by score descending, keep top 5
        const sortedSkills = Object.entries(skillScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        finalIndex[keyword] = sortedSkills;
    }

    // Get triggers file mtime
    const triggersStats = await getStats(triggersFile);
    const triggersMtime = triggersStats ? triggersStats.mtimeMs / 1000 : 0;

    // Save index
    await ensureDir(path.dirname(INDEX_FILE));

    const output = {
        version: '1.0.0',
        keywords: finalIndex,
        skills: skillInfo,
        triggers_mtime: triggersMtime
    };

    await writeJson(INDEX_FILE, output);

    // Get file size
    const indexStats = await getStats(INDEX_FILE);
    const fileSize = indexStats ? indexStats.size / 1024 : 0;

    console.log(`Keyword index built: ${INDEX_FILE}`);
    console.log(`  Skills: ${Object.keys(skillInfo).length}`);
    console.log(`  Keywords: ${Object.keys(finalIndex).length}`);
    console.log(`  Size: ${fileSize.toFixed(1)} KB`);

    return true;
}

// CLI
/* istanbul ignore next */
if (require.main === module) {
    buildIndex()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Error:', error.message);
            console.error(error.stack);
            process.exit(1);
        });
}

module.exports = { buildIndex, tokenize };
