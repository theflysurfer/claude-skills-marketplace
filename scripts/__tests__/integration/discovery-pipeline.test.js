/**
 * Integration test for complete discovery pipeline
 *
 * Tests the full workflow:
 * 1. discover-skills.js → hybrid-registry.json
 * 2. generate-triggers.js → skill-triggers.json
 * 3. build-keyword-index.js → keyword-index.json
 *
 * Target: Validate end-to-end pipeline produces correct outputs
 */

const path = require('path');
const os = require('os');
const { readJson } = require('../../lib/file-utils');

// Import main functions from each script
const { main: discoverSkills } = require('../../discovery/discover-skills');
const { generateFromHybridRegistry } = require('../../discovery/generate-triggers');
const { buildIndex } = require('../../discovery/build-keyword-index');

describe('Discovery Pipeline - Integration Test', () => {
    const MARKETPLACE_ROOT = path.resolve(__dirname, '../../..');
    const REGISTRY_DIR = path.join(MARKETPLACE_ROOT, 'registry');
    const CLAUDE_HOME = path.join(os.homedir(), '.claude');

    test('Full discovery pipeline produces correct outputs', async () => {
        // Step 1: Run discover-skills.js
        console.log('Running discover-skills.js...');
        await discoverSkills({ dryRun: false });

        // Verify hybrid-registry.json was created
        const registryPath = path.join(REGISTRY_DIR, 'hybrid-registry.json');
        const registry = await readJson(registryPath);

        expect(registry).not.toBeNull();
        expect(registry.version).toBeDefined();
        expect(registry.skills).toBeDefined();
        expect(Array.isArray(registry.skills)).toBe(true);
        expect(registry.skills.length).toBeGreaterThan(50);

        console.log(`  ✓ hybrid-registry.json created: ${registry.skills.length} skills`);

        // Verify registry structure
        expect(registry.sources).toBeDefined();
        expect(registry.last_indexed).toBeDefined();
        expect(registry.stats).toBeDefined();

        // Verify skills have required fields
        const firstSkill = registry.skills[0];
        expect(firstSkill.name).toBeDefined();
        expect(firstSkill.source).toBeDefined();
        expect(firstSkill.priority).toBeDefined();

        // Step 2: Run generate-triggers.js
        console.log('Running generate-triggers.js...');
        const triggersGenerated = await generateFromHybridRegistry();

        expect(triggersGenerated).toBe(true);

        // Verify skill-triggers.json was created
        const triggersPath = path.join(REGISTRY_DIR, 'skill-triggers.json');
        const triggers = await readJson(triggersPath);

        expect(triggers).not.toBeNull();
        expect(triggers.version).toBe('4.0.0');
        expect(triggers.skills).toBeDefined();
        expect(Array.isArray(triggers.skills)).toBe(true);
        expect(triggers.skills.length).toBeGreaterThan(40);

        console.log(`  ✓ skill-triggers.json created: ${triggers.skills.length} skills with triggers`);

        // Verify trigger structure
        const firstTrigger = triggers.skills[0];
        expect(firstTrigger.name).toBeDefined();
        expect(firstTrigger.triggers).toBeDefined();
        expect(Array.isArray(firstTrigger.triggers)).toBe(true);
        expect(firstTrigger.description).toBeDefined();

        // Step 3: Run build-keyword-index.js
        console.log('Running build-keyword-index.js...');
        const indexBuilt = await buildIndex();

        expect(indexBuilt).toBe(true);

        // Verify keyword-index.json was created
        const indexPath = path.join(CLAUDE_HOME, 'cache', 'keyword-index.json');
        const index = await readJson(indexPath);

        expect(index).not.toBeNull();
        expect(index.version).toBe('1.0.0');
        expect(index.keywords).toBeDefined();
        expect(Object.keys(index.keywords).length).toBeGreaterThan(1000);
        expect(index.skills).toBeDefined();

        console.log(`  ✓ keyword-index.json created: ${Object.keys(index.keywords).length} keywords`);

        // Verify index structure
        const firstKeyword = Object.keys(index.keywords)[0];
        const keywordEntry = index.keywords[firstKeyword];
        expect(Array.isArray(keywordEntry)).toBe(true);
        expect(keywordEntry[0]).toBeDefined();
        expect(keywordEntry[0][0]).toBeDefined(); // skill name
        expect(typeof keywordEntry[0][1]).toBe('number'); // weight

        // Verify triggers_mtime is present
        expect(index.triggers_mtime).toBeDefined();
        expect(typeof index.triggers_mtime).toBe('number');

        console.log('\n✓ Complete pipeline validation successful!');
        console.log(`  - ${registry.skills.length} skills discovered`);
        console.log(`  - ${triggers.skills.length} skills with triggers`);
        console.log(`  - ${Object.keys(index.keywords).length} keywords indexed`);
    }, 60000); // 60 second timeout for full pipeline
});
