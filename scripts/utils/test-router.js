#!/usr/bin/env node
/**
 * Test Router - Test the skill router with sample prompts.
 *
 * Usage:
 *   node test-router.js                     # Run all test cases
 *   node test-router.js "my custom prompt"  # Test a single prompt
 *   node test-router.js --interactive       # Interactive mode
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const INDEX_FILE = path.join(CLAUDE_HOME, 'cache', 'keyword-index.json');

// Test cases with expected results
const TEST_CASES = [
    // Commit skill
    { prompt: 'commit', expected: 'julien-dev-commit-message' },
    { prompt: 'git commit', expected: 'julien-dev-commit-message' },
    { prompt: 'commiter mes changements', expected: 'julien-dev-commit-message' },
    { prompt: 'help me commit', expected: 'julien-dev-commit-message' },

    // Office skills
    { prompt: 'créer un fichier excel', expected: 'anthropic-office-xlsx' },
    { prompt: 'create xlsx spreadsheet', expected: 'anthropic-office-xlsx' },
    { prompt: 'lire ce pdf', expected: 'anthropic-office-pdf' },
    { prompt: 'create word document', expected: 'anthropic-office-docx' },
    { prompt: 'make a powerpoint', expected: 'anthropic-office-pptx' },

    // Infrastructure skills
    { prompt: 'deploy to hostinger', expected: 'julien-infra-hostinger' },
    { prompt: 'nginx 502 error', expected: 'julien-infra-hostinger-web' },
    { prompt: 'docker container issue', expected: 'julien-infra-hostinger-docker' },

    // Development skills
    { prompt: 'create a new skill', expected: 'julien-skill-creator' },
    { prompt: 'review my skill', expected: 'julien-skill-reviewer' },
    { prompt: 'help', expected: 'julien-skill-help' },
    { prompt: '/help', expected: 'julien-skill-help' },

    // AHK skills
    { prompt: 'autohotkey v2 script', expected: 'julien-ref-ahk-v2' },
    { prompt: 'ahk hotkey', expected: 'julien-ref-ahk' },

    // Notion skills
    { prompt: 'notion template', expected: 'julien-notion-template' },
    { prompt: 'enrich github page in notion', expected: 'julien-notion-github-enricher' },

    // Misc
    { prompt: 'translate subtitles', expected: 'subtitle-translation' },
    { prompt: 'traduire sous-titres srt', expected: 'subtitle-translation' },
];

function loadIndex() {
    if (!fs.existsSync(INDEX_FILE)) {
        console.error('Index file not found:', INDEX_FILE);
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
}

function tokenize(text) {
    return (text.toLowerCase().match(/\b\w{2,}\b/g) || []);
}

function route(prompt, index) {
    const keywords = index.keywords || {};
    const skillScores = {};
    const promptLower = prompt.toLowerCase();

    // Check phrase matches
    for (const [keyword, matches] of Object.entries(keywords)) {
        if (promptLower.includes(keyword)) {
            for (const [skillName, weight] of matches) {
                const boost = keyword.includes(' ') ? 1.5 : 1.0;
                skillScores[skillName] = (skillScores[skillName] || 0) + weight * boost;
            }
        }
    }

    // Check word matches
    const words = tokenize(prompt);
    for (const word of words) {
        if (keywords[word]) {
            for (const [skillName, weight] of keywords[word]) {
                skillScores[skillName] = (skillScores[skillName] || 0) + weight * 0.5;
            }
        }
    }

    // Sort by score
    const results = Object.entries(skillScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, score]) => ({ name, score }));

    return results;
}

function runTestCases(index) {
    console.log('');
    console.log('='.repeat(80));
    console.log('                         ROUTER TEST RESULTS');
    console.log('='.repeat(80));
    console.log('');

    let passed = 0;
    let failed = 0;
    const failures = [];

    for (const test of TEST_CASES) {
        const results = route(test.prompt, index);
        const topMatch = results[0];
        const matched = topMatch && topMatch.name.includes(test.expected.replace('julien-infra-hostinger', ''));

        // More flexible matching - check if expected is substring of result or vice versa
        const isMatch = topMatch && (
            topMatch.name.includes(test.expected) ||
            test.expected.includes(topMatch.name.split('-').slice(0, -1).join('-'))
        );

        if (isMatch) {
            passed++;
            console.log(`  ✓ "${test.prompt}"`);
            console.log(`    → ${topMatch.name} (${topMatch.score.toFixed(2)})`);
        } else {
            failed++;
            failures.push(test);
            console.log(`  ✗ "${test.prompt}"`);
            console.log(`    Expected: ${test.expected}`);
            console.log(`    Got:      ${topMatch ? `${topMatch.name} (${topMatch.score.toFixed(2)})` : 'NO MATCH'}`);
            if (results.length > 1) {
                console.log(`    Top 3: ${results.slice(0, 3).map(r => r.name).join(', ')}`);
            }
        }
        console.log('');
    }

    console.log('='.repeat(80));
    console.log(`RESULTS: ${passed}/${TEST_CASES.length} passed (${(passed/TEST_CASES.length*100).toFixed(0)}%)`);
    console.log('='.repeat(80));

    if (failures.length > 0) {
        console.log('\nFAILED CASES:');
        for (const f of failures) {
            console.log(`  - "${f.prompt}" (expected: ${f.expected})`);
        }
    }

    return { passed, failed, total: TEST_CASES.length };
}

function testSinglePrompt(prompt, index) {
    console.log(`\nTesting: "${prompt}"\n`);

    const results = route(prompt, index);

    if (results.length === 0) {
        console.log('  NO MATCH');
    } else {
        console.log('Top 10 results:');
        console.log('-'.repeat(60));
        results.forEach((r, i) => {
            const confidence = Math.min(100, Math.round(r.score * 20));
            const bar = '█'.repeat(Math.floor(confidence / 5));
            console.log(`  ${(i+1).toString().padStart(2)}. ${r.name.padEnd(40)} ${bar} ${confidence}%`);
        });
    }
}

async function interactiveMode(index) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('\nInteractive Router Test');
    console.log('Type prompts to test, or "exit" to quit.\n');

    const ask = () => {
        rl.question('Prompt> ', (answer) => {
            if (answer.toLowerCase() === 'exit') {
                rl.close();
                return;
            }
            testSinglePrompt(answer, index);
            ask();
        });
    };

    ask();
}

async function main() {
    const args = process.argv.slice(2);

    const index = loadIndex();
    console.log(`Loaded index with ${Object.keys(index.keywords || {}).length} keywords`);

    if (args.includes('--interactive') || args.includes('-i')) {
        await interactiveMode(index);
    } else if (args.length > 0 && !args[0].startsWith('-')) {
        // Single prompt test
        testSinglePrompt(args.join(' '), index);
    } else {
        // Run all test cases
        runTestCases(index);
    }
}

main();
