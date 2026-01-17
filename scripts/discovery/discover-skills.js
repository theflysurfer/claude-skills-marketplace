#!/usr/bin/env node
/**
 * Discover Skills - Build hybrid registry from all sources.
 *
 * Scans marketplace, global (~/.claude/skills), and project sources
 * to build a unified hybrid registry with priority resolution.
 *
 * Pattern from discover-skills.py
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { program } = require('commander');
const fg = require('fast-glob');

const { extractYaml, extractContentSummary } = require('../lib/yaml-parser');
const { readJson, writeJson, computeHash, expandPath, fileExists, readFile } = require('../lib/file-utils');

// Constants
const MARKETPLACE_ROOT = path.resolve(__dirname, '../..');
const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const REGISTRY_DIR = path.join(MARKETPLACE_ROOT, 'registry');
const SYNC_CONFIG_PATH = path.join(REGISTRY_DIR, 'sync-config.json');
const PROJECTS_REGISTRY_PATH = path.join(REGISTRY_DIR, 'projects-registry.json');
const OUTPUT_PATH = path.join(REGISTRY_DIR, 'hybrid-registry.json');

/**
 * Detect local dependencies in skill content.
 * Pattern from discover-skills.py lines 119-138.
 *
 * @param {string} content - SKILL.md content
 * @param {string} skillDir - Skill directory path
 * @returns {Array<string>} List of relative file paths
 */
function detectDependencies(content, skillDir) {
    const deps = [];

    // Match markdown links: [text](path)
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkPattern.exec(content)) !== null) {
        const linkPath = match[2];

        // Skip external URLs
        if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
            continue;
        }

        // Skip anchors
        if (linkPath.startsWith('#')) {
            continue;
        }

        // Resolve relative path
        const fullPath = path.join(skillDir, linkPath);
        const relativePath = path.relative(skillDir, fullPath);

        if (relativePath && !relativePath.startsWith('..')) {
            // Normalize to forward slashes for cross-platform consistency
            deps.push(relativePath.replace(/\\/g, '/'));
        }
    }

    return deps;
}

/**
 * Load existing registry or return empty structure.
 *
 * @returns {Promise<object>} Registry data
 */
async function loadRegistry() {
    const existing = await readJson(OUTPUT_PATH);
    if (existing) {
        return existing;
    }

    return {
        version: '2.0.0',
        last_indexed: new Date().toISOString(),
        sources: [],
        skills: []
    };
}

/**
 * Load projects registry.
 *
 * @returns {Promise<object|null>} Projects registry or null
 */
async function loadProjectsRegistry() {
    return await readJson(PROJECTS_REGISTRY_PATH);
}

/**
 * Load sync configuration.
 *
 * @returns {Promise<object>} Sync config
 */
async function loadSyncConfig() {
    const config = await readJson(SYNC_CONFIG_PATH);
    if (!config) {
        throw new Error(`Sync config not found: ${SYNC_CONFIG_PATH}`);
    }
    return config;
}

/**
 * Find project skill sources from current project.
 * Pattern from discover-skills.py lines 151+.
 *
 * @param {object} syncConfig - Sync configuration
 * @param {object} projectsRegistry - Projects registry
 * @returns {Promise<Array<object>>} List of project sources with metadata
 */
async function findProjectSkillSources(syncConfig, projectsRegistry) {
    const sources = [];

    // Check if current directory is a registered project
    const cwd = process.cwd();

    if (!projectsRegistry || !projectsRegistry.projects) {
        return sources;
    }

    // Find project matching current directory
    for (const [projectPath, projectInfo] of Object.entries(projectsRegistry.projects)) {
        const normalizedProjectPath = path.normalize(projectPath);
        const normalizedCwd = path.normalize(cwd);

        // Check if CWD is within this project
        if (normalizedCwd.startsWith(normalizedProjectPath)) {
            // Look for .claude/skills directory
            const skillsDir = path.join(projectPath, '.claude', 'skills');

            if (await fileExists(skillsDir)) {
                sources.push({
                    type: 'project',
                    path: skillsDir,
                    priority: 2,
                    project_name: projectInfo.name || path.basename(projectPath),
                    project_path: projectPath
                });
            }
        }
    }

    // Also scan project_sources from sync-config
    if (syncConfig.project_sources) {
        for (const sourceConfig of syncConfig.project_sources) {
            // Handle both string patterns and object configs
            const projectPattern = typeof sourceConfig === 'string'
                ? sourceConfig
                : sourceConfig.project_pattern;
            const skillsPath = typeof sourceConfig === 'string'
                ? '.claude/skills'
                : (sourceConfig.skills_path || '.claude/skills');
            const priority = typeof sourceConfig === 'string'
                ? 2
                : (sourceConfig.priority || 2);

            // DON'T use expandPath on glob patterns - it breaks them!
            // expandPath('**/foo') => 'C:\...\**\foo' which is invalid

            // Use glob to find directories matching pattern
            // Search from common project roots, not just CWD
            const searchRoots = [
                path.join(os.homedir(), 'OneDrive', 'Coding', '_Projets de code'),
                path.join(os.homedir(), 'Projects'),
                path.join(os.homedir(), 'Code'),
                process.cwd()
            ];

            let matches = [];
            for (const root of searchRoots) {
                if (await fileExists(root)) {
                    const found = await fg(projectPattern, {
                        onlyDirectories: true,
                        absolute: true,
                        ignore: ['**/node_modules/**', '**/.git/**'],
                        cwd: root
                    });
                    matches.push(...found);
                }
            }
            // Dedupe matches
            matches = [...new Set(matches)];

            for (const matchPath of matches) {
                // Build skills directory path
                const skillsDir = path.join(matchPath, skillsPath);

                if (await fileExists(skillsDir)) {
                    sources.push({
                        type: 'project',
                        path: skillsDir,
                        priority,
                        project_name: path.basename(matchPath),
                        project_path: matchPath
                    });
                }
            }
        }
    }

    return sources;
}

/**
 * Scan a source directory for SKILL.md files.
 * Pattern from discover-skills.py lines 227-276.
 *
 * @param {object} source - Source metadata {type, path, priority}
 * @returns {Promise<Array<object>>} List of discovered skills
 */
async function scanSource(source) {
    const skills = [];

    const { type, path: sourcePath, priority } = source;

    console.log(`Scanning ${type} source: ${sourcePath}`);

    if (!await fileExists(sourcePath)) {
        console.warn(`Source path does not exist: ${sourcePath}`);
        return skills;
    }

    // Find all SKILL.md files
    const skillFiles = await fg('**/SKILL.md', {
        cwd: sourcePath,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/deprecated/**', '**/assets/**', '**/templates/**', '**/examples/**', '**/backups/**']
    });

    console.log(`Found ${skillFiles.length} SKILL.md files in ${type} source`);

    for (const skillFile of skillFiles) {
        try {
            const content = await readFile(skillFile);
            const yaml = extractYaml(content);

            if (!yaml.name) {
                console.warn(`Skipping ${skillFile}: no name in frontmatter`);
                continue;
            }

            const skillDir = path.dirname(skillFile);
            const skillName = yaml.name;

            // Extract metadata
            const description = yaml.description || '';
            const triggers = yaml.triggers || [];
            const allowedTools = yaml['allowed-tools'] || [];
            const license = yaml.license || 'Unknown';
            const metadata = yaml.metadata || {};

            // Compute content hash
            const contentHash = computeHash(content);

            // Detect dependencies
            const dependencies = detectDependencies(content, skillDir);

            // Extract content summary
            const summary = extractContentSummary(content);

            // Build skill entry
            const skill = {
                name: skillName,
                description,
                source: type,
                priority,
                path: skillDir,
                skill_file: skillFile,
                triggers,
                allowed_tools: allowedTools,
                license,
                metadata,
                content_hash: contentHash,
                dependencies,
                summary,
                discovered_at: new Date().toISOString()
            };

            // Add project context if applicable
            if (source.project_name) {
                skill.project_name = source.project_name;
                skill.project_path = source.project_path;
            }

            skills.push(skill);

        } catch (error) {
            console.error(`Error processing ${skillFile}:`, error.message);
        }
    }

    return skills;
}

/**
 * Resolve skill conflicts based on priority.
 * Pattern from discover-skills.py lines 279-313.
 *
 * When multiple skills have the same name, keep the one with highest priority.
 * Priority: Project (2) > Global (1) > Marketplace (0)
 *
 * @param {Array<object>} allSkills - All discovered skills
 * @returns {Array<object>} Resolved skills (duplicates removed)
 */
function resolveSkills(allSkills) {
    const skillMap = new Map();

    for (const skill of allSkills) {
        const name = skill.name;

        if (!skillMap.has(name)) {
            skillMap.set(name, skill);
        } else {
            const existing = skillMap.get(name);

            // Replace if new skill has higher priority
            if (skill.priority > existing.priority) {
                console.log(`Priority override: ${name} (${skill.source} priority ${skill.priority} > ${existing.source} priority ${existing.priority})`);
                skillMap.set(name, skill);
            } else if (skill.priority === existing.priority) {
                console.warn(`Duplicate skill at same priority: ${name} (keeping first found)`);
            }
        }
    }

    return Array.from(skillMap.values());
}

/**
 * Main discovery function.
 *
 * @param {object} options - CLI options
 * @returns {Promise<object>} Registry data
 */
async function main(options) {
    console.log('Starting skill discovery...');
    console.log(`Marketplace root: ${MARKETPLACE_ROOT}`);
    console.log(`Claude home: ${CLAUDE_HOME}`);

    // Load configurations
    const syncConfig = await loadSyncConfig();
    const projectsRegistry = await loadProjectsRegistry();

    // Define sources
    const sources = [
        {
            type: 'marketplace',
            path: path.join(MARKETPLACE_ROOT, 'skills'),
            priority: 0
        },
        {
            type: 'global',
            path: path.join(CLAUDE_HOME, 'skills'),
            priority: 1
        }
    ];

    // Add project sources
    const projectSources = await findProjectSkillSources(syncConfig, projectsRegistry);
    sources.push(...projectSources);

    console.log(`\nScanning ${sources.length} sources:`);
    for (const source of sources) {
        console.log(`  - ${source.type} (priority ${source.priority}): ${source.path}`);
    }

    // Scan all sources
    let allSkills = [];

    for (const source of sources) {
        const skills = await scanSource(source);
        allSkills.push(...skills);
    }

    console.log(`\nTotal skills discovered: ${allSkills.length}`);

    // Resolve conflicts
    const resolvedSkills = resolveSkills(allSkills);

    console.log(`Skills after priority resolution: ${resolvedSkills.length}`);

    // Build registry
    const registry = {
        version: '2.0.0',
        last_indexed: new Date().toISOString(),
        sources: sources.map(s => ({
            type: s.type,
            path: s.path,
            priority: s.priority,
            project_name: s.project_name
        })),
        skills: resolvedSkills,
        stats: {
            total_skills: resolvedSkills.length,
            by_source: {
                marketplace: resolvedSkills.filter(s => s.source === 'marketplace').length,
                global: resolvedSkills.filter(s => s.source === 'global').length,
                project: resolvedSkills.filter(s => s.source === 'project').length
            },
            with_triggers: resolvedSkills.filter(s => s.triggers.length > 0).length,
            with_dependencies: resolvedSkills.filter(s => s.dependencies.length > 0).length
        }
    };

    // Write output
    if (!options.dryRun) {
        await writeJson(OUTPUT_PATH, registry);
        console.log(`\nRegistry written to: ${OUTPUT_PATH}`);
    } else {
        console.log('\n[DRY RUN] Registry not written');
    }

    // Print summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total skills: ${registry.stats.total_skills}`);
    console.log(`  - Marketplace: ${registry.stats.by_source.marketplace}`);
    console.log(`  - Global: ${registry.stats.by_source.global}`);
    console.log(`  - Project: ${registry.stats.by_source.project}`);
    console.log(`With triggers: ${registry.stats.with_triggers}`);
    console.log(`With dependencies: ${registry.stats.with_dependencies}`);

    return registry;
}

// CLI
/* istanbul ignore next */
if (require.main === module) {
    program
        .name('discover-skills')
        .description('Discover and index skills from all sources')
        .option('--dry-run', 'Run without writing output')
        .option('--json', 'Output JSON to stdout')
        .parse(process.argv);

    const options = program.opts();

    main(options)
        .then(registry => {
            if (options.json) {
                console.log(JSON.stringify(registry, null, 2));
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('Error:', error.message);
            console.error(error.stack);
            process.exit(1);
        });
}

module.exports = {
    main,
    scanSource,
    resolveSkills,
    detectDependencies,
    loadRegistry,
    loadProjectsRegistry,
    loadSyncConfig,
    findProjectSkillSources
};
