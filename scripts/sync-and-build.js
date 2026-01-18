#!/usr/bin/env node
/**
 * Unified sync script - rebuilds all registries and optionally docs.
 *
 * Orchestrates the full discovery pipeline:
 * 1. discover-skills.js  -> hybrid-registry.json
 * 2. generate-triggers.js -> skill-triggers.json
 * 3. build-keyword-index.js -> keyword-index.json
 * 4. Copy to ~/.claude/ -> global sync
 * 5. mkdocs build (optional) -> regenerate docs
 *
 * Usage:
 *   node sync-and-build.js           # Sync registries only
 *   node sync-and-build.js --docs    # Sync + build docs
 *   node sync-and-build.js --serve   # Sync + serve docs
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const MARKETPLACE = path.resolve(__dirname, '..');
const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const REGISTRY_DIR = path.join(MARKETPLACE, 'registry');
const SCRIPTS_DISCOVERY = path.join(MARKETPLACE, 'scripts', 'discovery');
const DOCS_SOURCE = path.join(MARKETPLACE, 'docs-source');

/**
 * Run a command and print its output in real-time.
 * @param {string} cmd - Command to execute
 * @param {object} options - execSync options
 */
function runCommand(cmd, options = {}) {
    try {
        execSync(cmd, {
            stdio: 'inherit',
            shell: true,
            ...options
        });
        return true;
    } catch (error) {
        console.error(`Error running: ${cmd}`);
        console.error(error.message);
        return false;
    }
}

/**
 * Copy file with directory creation if needed.
 * @param {string} src - Source path
 * @param {string} dest - Destination path
 */
function copyFile(src, dest) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${path.basename(src)} -> ${dest}`);
}

async function main() {
    const args = process.argv.slice(2);
    const buildDocs = args.includes('--docs');
    const serveDocs = args.includes('--serve');
    const skipSync = args.includes('--skip-sync');
    const verbose = args.includes('--verbose') || args.includes('-v');

    console.log('========================================');
    console.log('  Marketplace Sync & Build');
    console.log('========================================\n');

    // Step 1: Discover skills
    console.log('=== 1. Discover skills ===');
    const discoverScript = path.join(SCRIPTS_DISCOVERY, 'discover-skills.js');
    if (!runCommand(`node "${discoverScript}"`, { cwd: MARKETPLACE })) {
        console.error('Failed to discover skills. Aborting.');
        process.exit(1);
    }

    // Step 2: Generate triggers
    console.log('\n=== 2. Generate triggers ===');
    const triggersScript = path.join(SCRIPTS_DISCOVERY, 'generate-triggers.js');
    if (!runCommand(`node "${triggersScript}"`, { cwd: MARKETPLACE })) {
        console.error('Failed to generate triggers. Aborting.');
        process.exit(1);
    }

    // Step 3: Sync triggers to global ~/.claude/ (BEFORE building index)
    // Important: build-keyword-index reads from ~/.claude/registry/skill-triggers.json
    if (!skipSync) {
        console.log('\n=== 3. Sync registries to ~/.claude/ ===');

        const filesToSync = [
            { src: 'hybrid-registry.json', dest: path.join(CLAUDE_HOME, 'configs', 'hybrid-registry.json') },
            { src: 'skill-triggers.json', dest: path.join(CLAUDE_HOME, 'registry', 'skill-triggers.json') }
        ];

        for (const file of filesToSync) {
            const srcPath = path.join(REGISTRY_DIR, file.src);
            if (fs.existsSync(srcPath)) {
                copyFile(srcPath, file.dest);
            } else {
                console.warn(`  Warning: ${file.src} not found, skipping`);
            }
        }
    }

    // Step 4: Build keyword index (AFTER sync so mtime matches)
    console.log('\n=== 4. Build keyword index ===');
    const indexScript = path.join(SCRIPTS_DISCOVERY, 'build-keyword-index.js');
    if (!runCommand(`node "${indexScript}"`, { cwd: MARKETPLACE })) {
        console.error('Failed to build keyword index. Aborting.');
        process.exit(1);
    }

    // Step 5: Build/serve docs (optional)
    if (buildDocs || serveDocs) {
        console.log('\n=== 5. Build MkDocs ===');

        if (!fs.existsSync(DOCS_SOURCE)) {
            console.warn(`  Warning: docs-source not found at ${DOCS_SOURCE}`);
            console.warn('  Skipping docs build.');
        } else {
            const mkdocsCmd = serveDocs ? 'mkdocs serve' : 'mkdocs build';
            if (serveDocs) {
                // For serve, use spawn to allow Ctrl+C
                console.log(`  Running: ${mkdocsCmd}`);
                console.log('  Press Ctrl+C to stop\n');
                const child = spawn('mkdocs', ['serve'], {
                    cwd: DOCS_SOURCE,
                    stdio: 'inherit',
                    shell: true
                });
                child.on('error', (err) => console.error('Failed to start mkdocs:', err.message));
            } else {
                runCommand(mkdocsCmd, { cwd: DOCS_SOURCE });
            }
        }
    }

    if (!serveDocs) {
        // Summary
        console.log('\n========================================');
        console.log('  Sync complete');
        console.log('========================================');

        // Count skills in registry
        const registryPath = path.join(REGISTRY_DIR, 'hybrid-registry.json');
        if (fs.existsSync(registryPath)) {
            const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
            const skillCount = registry.skills ? registry.skills.length : 0;
            console.log(`\n  Total skills: ${skillCount}`);
        }

        console.log('\n  Files updated:');
        console.log('  - registry/hybrid-registry.json');
        console.log('  - registry/skill-triggers.json');
        if (!skipSync) {
            console.log('  - ~/.claude/configs/hybrid-registry.json');
            console.log('  - ~/.claude/registry/skill-triggers.json');
        }
        console.log('  - ~/.claude/cache/keyword-index.json');
    }
}

main().catch((error) => {
    console.error('Sync failed:', error.message);
    process.exit(1);
});
