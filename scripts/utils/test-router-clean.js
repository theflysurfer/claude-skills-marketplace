#!/usr/bin/env node
/**
 * Test router with cleaned prompts
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const INDEX_FILE = path.join(CLAUDE_HOME, 'cache', 'keyword-index.json');

function cleanPromptForRouting(prompt) {
    let cleaned = prompt;
    // Remove skill activation messages
    cleaned = cleaned.replace(/🔧\s*Skill\s*"[^"]+"\s*activated/gi, '');
    // Remove skill names in quotes
    cleaned = cleaned.replace(/"(julien|anthropic|cooking|subtitle|startup|onepiece)-[a-z0-9-]+"/gi, '');
    // Remove skill tags
    cleaned = cleaned.replace(/<skill[^>]*>[\s\S]*?<\/skill>/gi, '');
    // Remove triple quotes
    cleaned = cleaned.replace(/"""[\s\S]*?"""/g, '');
    // Remove code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    // Remove large quoted blocks (>50 chars)
    cleaned = cleaned.replace(/"([^"]{50,})"/g, '');
    // Remove YAML frontmatter
    cleaned = cleaned.replace(/---[\s\S]*?---/g, '');
    // Remove skill doc headers
    cleaned = cleaned.replace(/^#+ .*(?:Quick Start|Prerequisites|Usage|Commands|API).*$/gm, '');
    // Remove technical terms from skill docs
    cleaned = cleaned.replace(/\b(queue_task|background_job|idle[-_]queue)\b/gi, '');
    return cleaned.trim();
}

function tokenize(text) {
    return (text.toLowerCase().match(/\b\w{2,}\b/g) || []);
}

function loadIndex() {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
}

function route(prompt, useCleaning = true) {
    const index = loadIndex();
    const keywords = index.keywords || {};

    const cleanedPrompt = useCleaning ? cleanPromptForRouting(prompt) : prompt;
    const promptLower = cleanedPrompt.toLowerCase();
    const skillScores = {};

    for (const [keyword, matches] of Object.entries(keywords)) {
        if (promptLower.includes(keyword)) {
            for (const [skillName, weight] of matches) {
                const boost = keyword.includes(' ') ? 1.5 : 1.0;
                skillScores[skillName] = (skillScores[skillName] || 0) + weight * boost;
            }
        }
    }

    const words = tokenize(cleanedPrompt);
    for (const word of words) {
        if (keywords[word]) {
            for (const [skillName, weight] of keywords[word]) {
                skillScores[skillName] = (skillScores[skillName] || 0) + weight * 0.5;
            }
        }
    }

    return Object.entries(skillScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, score]) => ({ name, score }));
}

// Test: User citing skill output
const problematicPrompt = `c'est hyper faux : "
● 🔧 Skill "julien-workflow-queuing-background-tasks" activated

  Je vais d'abord comprendre ce qu'est Planotator et pourquoi il n'a pas été déclenché.
"`;

console.log('=== TEST: Problematic prompt (user citing skill) ===\n');

console.log('WITHOUT cleaning:');
const withoutCleaning = route(problematicPrompt, false);
console.log('Top match:', withoutCleaning[0]?.name, '(score:', withoutCleaning[0]?.score, ')');

console.log('\nWITH cleaning:');
const withCleaning = route(problematicPrompt, true);
if (withCleaning.length === 0) {
    console.log('No match (correct!)');
} else {
    console.log('Top match:', withCleaning[0]?.name, '(score:', withCleaning[0]?.score, ')');
}

console.log('\n=== Cleaned prompt ===');
console.log(JSON.stringify(cleanPromptForRouting(problematicPrompt)));
