#!/usr/bin/env node
/**
 * Fast Skill Router - Routes user prompts to skills in <50ms.
 * Uses pre-computed keyword index (pure JS, no heavy dependencies).
 *
 * Hook: UserPromptSubmit
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const INDEX_FILE = path.join(CLAUDE_HOME, 'cache', 'keyword-index.json');
const TRIGGERS_FILE = path.join(CLAUDE_HOME, 'configs', 'skill-triggers.json');

// Thresholds
const MIN_SCORE = 0.2;
const TOP_K = 3;

// Cache
let indexCache = null;

function loadIndex() {
    if (indexCache) return indexCache;

    if (!fs.existsSync(INDEX_FILE)) {
        return null;
    }

    try {
        const data = fs.readFileSync(INDEX_FILE, 'utf-8');
        indexCache = JSON.parse(data);

        // Check freshness
        if (fs.existsSync(TRIGGERS_FILE)) {
            const currentMtime = fs.statSync(TRIGGERS_FILE).mtimeMs / 1000;
            if (Math.abs(indexCache.triggers_mtime - currentMtime) > 1) {
                return null;
            }
        }

        return indexCache;
    } catch (e) {
        return null;
    }
}

function tokenize(text) {
    return (text.toLowerCase().match(/\b\w{2,}\b/g) || []);
}

function route(prompt) {
    const index = loadIndex();
    if (!index) return [];

    const keywords = index.keywords || {};
    const skillsInfo = index.skills || {};

    // Tokenize prompt
    const words = tokenize(prompt);
    const promptLower = prompt.toLowerCase();

    // Score each skill
    const skillScores = {};

    // Check exact phrase matches first (highest priority)
    for (const [keyword, matches] of Object.entries(keywords)) {
        if (promptLower.includes(keyword)) {
            for (const [skillName, weight] of matches) {
                // Boost for multi-word phrase match
                const boost = keyword.includes(' ') ? 1.5 : 1.0;
                skillScores[skillName] = (skillScores[skillName] || 0) + weight * boost;
            }
        }
    }

    // Check word matches
    for (const word of words) {
        if (keywords[word]) {
            for (const [skillName, weight] of keywords[word]) {
                skillScores[skillName] = (skillScores[skillName] || 0) + weight * 0.5;
            }
        }
    }

    // Build results
    const results = Object.entries(skillScores)
        .filter(([_, score]) => score >= MIN_SCORE)
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_K)
        .map(([name, score]) => {
            const info = skillsInfo[name] || {};
            return {
                name,
                description: info.description || '',
                source: info.source || '',
                score
            };
        });

    return results;
}

function main() {
    // Read input from stdin
    let inputData = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
        let chunk;
        while (chunk = process.stdin.read()) {
            inputData += chunk;
        }
    });

    process.stdin.on('end', () => {
        try {
            const data = JSON.parse(inputData);
            const userPrompt = data.user_prompt || '';

            // Skip short prompts
            if (userPrompt.length < 3) {
                console.error('[routing: prompt too short]');
                process.exit(0);
            }

            // Check if index exists
            if (!fs.existsSync(INDEX_FILE)) {
                console.error('[routing: index not built - run build-keyword-index.py]');
                process.exit(0);
            }

            // Route
            const start = Date.now();
            const matches = route(userPrompt);
            const elapsed = Date.now() - start;

            // Output to stderr (visible in gray in Claude)
            if (matches.length > 0) {
                console.error(`🎯 Skill routing (${elapsed}ms):`);
                for (const match of matches) {
                    const scorePct = match.score ? ` ${Math.round(match.score * 100)}%` : '';
                    let sourceTag = '';
                    if (match.source.startsWith('project:')) {
                        sourceTag = ' 📁';
                    } else if (match.source === 'global') {
                        sourceTag = ' 🌐';
                    }
                    console.error(`  → ${match.name}${scorePct}${sourceTag}`);
                }
                console.error(`  💡 Invoke: Skill("${matches[0].name}")`);
            } else {
                console.error(`[routing: no match (${elapsed}ms)]`);
            }
        } catch (e) {
            process.exit(0);
        }
    });
}

main();
