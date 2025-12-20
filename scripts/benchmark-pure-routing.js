#!/usr/bin/env node
/**
 * Benchmark pure routing time (no subprocess overhead)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const INDEX_FILE = path.join(CLAUDE_HOME, 'cache', 'keyword-index.json');

function tokenize(text) {
    return (text.toLowerCase().match(/\b\w{2,}\b/g) || []);
}

function route(prompt, index) {
    const keywords = index.keywords || {};
    const skillsInfo = index.skills || {};
    const promptLower = prompt.toLowerCase();
    const words = tokenize(prompt);

    const skillScores = {};

    // Phrase matches
    for (const [keyword, matches] of Object.entries(keywords)) {
        if (promptLower.includes(keyword)) {
            for (const [skillName, weight] of matches) {
                const boost = keyword.includes(' ') ? 1.5 : 1.0;
                skillScores[skillName] = (skillScores[skillName] || 0) + weight * boost;
            }
        }
    }

    // Word matches
    for (const word of words) {
        if (keywords[word]) {
            for (const [skillName, weight] of keywords[word]) {
                skillScores[skillName] = (skillScores[skillName] || 0) + weight * 0.5;
            }
        }
    }

    return Object.entries(skillScores)
        .filter(([_, score]) => score >= 0.2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, score]) => ({
            name,
            description: (skillsInfo[name] || {}).description || '',
            score
        }));
}

// Load index once
const loadStart = process.hrtime.bigint();
const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
const loadTime = Number(process.hrtime.bigint() - loadStart) / 1e6;

const prompts = [
    ['créer un fichier excel', 'anthropic-office-xlsx'],
    ['faire un commit', 'commit-message'],
    ['upload une image wordpress', 'wp-clem-hostinger-upload-image'],
    ['valider structure wordpress', 'wordpress-structure-validator'],
    ['create a new skill', 'julien-skill-creator'],
    ['synchroniser le thème', 'wp-sync-workflows'],
    ['modifier une page wp-cli', 'wp-wpcli-remote'],
    ['nettoyer le css', 'wp-clean-css'],
];

console.log('Benchmark PURE routing (no subprocess)');
console.log(`Index load time: ${loadTime.toFixed(1)}ms`);
console.log('='.repeat(75));

const times = [];
let correct = 0;

for (const [prompt, expected] of prompts) {
    const start = process.hrtime.bigint();
    const results = route(prompt, index);
    const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
    times.push(elapsed);

    const got = results[0]?.name || 'N/A';
    const isMatch = got === expected ? '✓' : '✗';
    if (got === expected) correct++;

    console.log(`${elapsed.toFixed(2).padStart(8)}ms | ${prompt.slice(0,30).padEnd(30)} | ${got.padEnd(25)} ${isMatch}`);
}

console.log('='.repeat(75));
const min = Math.min(...times);
const max = Math.max(...times);
const avg = times.reduce((a,b) => a+b, 0) / times.length;
console.log(`Pure routing: Min=${min.toFixed(2)}ms Max=${max.toFixed(2)}ms Avg=${avg.toFixed(2)}ms`);
console.log(`Total (with index load): ${(loadTime + avg).toFixed(1)}ms`);
console.log(`Accuracy: ${correct}/${prompts.length} (${Math.round(correct/prompts.length*100)}%)`);
