#!/usr/bin/env node
/**
 * Benchmark the fast skill router
 */

const { spawnSync } = require('child_process');

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

const times = [];
let correct = 0;

console.log('Benchmark Node.js router');
console.log('='.repeat(75));
console.log(`${'Time'.padStart(6)} | ${'Prompt'.padEnd(30)} | ${'Expected'.padEnd(25)} | ${'Got'.padEnd(25)}`);
console.log('-'.repeat(75));

for (const [prompt, expected] of prompts) {
    const inputJson = JSON.stringify({ user_prompt: prompt });

    const start = process.hrtime.bigint();
    const result = spawnSync('node', ['scripts/fast-skill-router.js'], {
        input: inputJson,
        encoding: 'utf-8',
        cwd: process.cwd()
    });
    const elapsed = Number(process.hrtime.bigint() - start) / 1e6; // ms
    times.push(elapsed);

    // Extract first skill suggestion
    const output = result.stdout || '';
    let got = 'N/A';
    for (const line of output.split('\n')) {
        if (line.startsWith('- **')) {
            const match = line.match(/\*\*(.+?)\*\*/);
            if (match) got = match[1];
            break;
        }
    }

    const isMatch = got === expected ? '✓' : '✗';
    if (got === expected) correct++;

    console.log(`${elapsed.toFixed(0).padStart(5)}ms | ${prompt.slice(0,30).padEnd(30)} | ${expected.padEnd(25)} | ${got.padEnd(25)} ${isMatch}`);
}

console.log('='.repeat(75));
const min = Math.min(...times);
const max = Math.max(...times);
const avg = times.reduce((a,b) => a+b, 0) / times.length;
console.log(`Performance: Min=${min.toFixed(0)}ms Max=${max.toFixed(0)}ms Avg=${avg.toFixed(0)}ms`);
console.log(`Accuracy: ${correct}/${prompts.length} (${Math.round(correct/prompts.length*100)}%)`);
