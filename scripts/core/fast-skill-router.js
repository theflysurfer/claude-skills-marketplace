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

// Import debug logger
let logDebug, logHookStartOld, logHookEndOld;
try {
    const debugLogger = require('../lib/debug-logger.js');
    logDebug = debugLogger.logDebug;
    logHookStartOld = debugLogger.logHookStart;
    logHookEndOld = debugLogger.logHookEnd;
} catch (e) {
    // Fallback no-op functions if logger not available
    logDebug = () => {};
    logHookStartOld = () => {};
    logHookEndOld = () => {};
}

// Import unified logger (NEW)
let unifiedLogger;
try {
    unifiedLogger = require('../lib/unified-logger.js');
} catch (e) {
    // Fallback no-op if not available
    unifiedLogger = {
        logHookStart: () => Date.now(),
        logHookEnd: () => {},
        logRouterDecision: () => {}
    };
}

// Configuration
const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const INDEX_FILE = path.join(CLAUDE_HOME, 'cache', 'keyword-index.json');
const TRIGGERS_FILE = path.join(CLAUDE_HOME, 'registry', 'skill-triggers.json');
const ROUTING_LOG_FILE = path.join(CLAUDE_HOME, 'cache', 'last-routing.json');
const ROUTING_HISTORY_FILE = path.join(CLAUDE_HOME, 'cache', 'routing-history.jsonl');
const NEAR_MISS_LOG_FILE = path.join(CLAUDE_HOME, 'cache', 'near-misses.jsonl');

// Thresholds
const MIN_SCORE = 0.25;  // Increased from 0.2 for better precision
const TOP_K = 2;         // Reduced from 3 to focus on top matches

// Context Awareness Configuration
const ENABLE_CWD_CONTEXT = process.env.ROUTER_CWD_CONTEXT !== 'false'; // Enabled by default
const CONTEXT_BOOST = 0.7; // Boost value when file extensions match (strong enough to beat generic matches)
const MIN_FILES_FOR_BOOST = 3; // Minimum files of same type to trigger boost

// Extension to Skill Mapping (Tier 2 - BOOST)
const EXTENSION_SKILL_MAP = {
    // Office files
    '.pdf': ['anthropic-office-pdf'],
    '.docx': ['anthropic-office-docx'],
    '.doc': ['anthropic-office-docx'],
    '.xlsx': ['anthropic-office-xlsx'],
    '.xls': ['anthropic-office-xlsx'],
    '.xlsm': ['anthropic-office-xlsx'],
    '.csv': ['anthropic-office-xlsx'],
    '.tsv': ['anthropic-office-xlsx'],
    '.pptx': ['anthropic-office-pptx'],
    '.ppt': ['anthropic-office-pptx'],
    // Scripting languages
    '.ahk': ['julien-ref-ahk-v2', 'julien-ref-ahk-v1'],
    '.ahk2': ['julien-ref-ahk-v2'],
    '.ah2': ['julien-ref-ahk-v2'],
    '.ps1': ['julien-ref-powershell'],
    '.bat': ['julien-ref-batch'],
    '.cmd': ['julien-ref-batch'],
    // Subtitles
    '.srt': ['subtitle-translation'],
    '.vtt': ['subtitle-translation'],
    // Documentation
    '.md': ['julien-ref-doc-production', 'julien-ref-notion-markdown']
};

// Context Pattern Detection (Tier 1 - AUTO-ACTIVATE)
// These patterns trigger immediate skill activation when detected
const CONTEXT_AUTO_ACTIVATE = {
    // File-based detection
    files: {
        'astro.config.mjs': 'julien-ref-astro-install',
        'astro.config.ts': 'julien-ref-astro-install',
        'theme.json': 'julien-wordpress-structure-validator',
        'mcp_server.py': 'anthropic-dev-tools-mcp-builder',
        'docker-compose.yml': 'julien-infra-hostinger-docker',
        'docker-compose.yaml': 'julien-infra-hostinger-docker'
    },
    // Folder-based detection
    folders: {
        'wp-content': 'julien-wordpress-structure-validator',
        'wp-admin': 'julien-wordpress-structure-validator',
        'wp-includes': 'julien-wordpress-structure-validator'
    }
};

// Context Hints (Tier 3 - HINT only, shown in suggestions)
const CONTEXT_HINTS = {
    '.git': ['julien-dev-commit-message'],
    '.github': ['julien-dev-commit-message'],
    'package.json': ['anthropic-web-frontend-design'],
    'tsconfig.json': ['anthropic-web-frontend-design']
};

// Analytical Verbs Weighting (Tier 1 verbs get 1.5x boost)
const ANALYTICAL_VERBS = {
    // English Tier 1
    'extract': 1.5, 'analyze': 1.5, 'parse': 1.5, 'examine': 1.5, 'read': 1.5,
    // French Tier 1
    'extraire': 1.5, 'analyser': 1.5, 'parser': 1.5, 'examiner': 1.5, 'lire': 1.5, 'lis': 1.5,
    // English Tier 2
    'process': 1.4, 'review': 1.4, 'check': 1.3, 'scan': 1.3,
    // French Tier 2
    'traiter': 1.4, 'vérifier': 1.3, 'scanner': 1.3,
    // Creation verbs
    'create': 1.2, 'build': 1.2, 'generate': 1.2,
    'créer': 1.2, 'construire': 1.2, 'générer': 1.2
};

// Fuzzy Matching Configuration
const ENABLE_FUZZY_MATCH = process.env.ROUTER_FUZZY_MATCH !== 'false'; // Enabled by default
const MAX_EDIT_DISTANCE = 1; // Maximum Levenshtein distance for fuzzy match

// Typo Map - Common misspellings to correct forms
const TYPO_MAP = {
    // French typos
    'parseur': 'parser',
    'analyseur': 'analyser',
    'fusioner': 'fusionner',
    'remplire': 'remplir',
    'divizer': 'diviser',
    'extrair': 'extraire',
    'lir': 'lire',
    'verifier': 'vérifier',
    // English typos
    'analys': 'analyze',
    'analize': 'analyze',
    'examin': 'examine',
    'proces': 'process',
    'creat': 'create',
    'generat': 'generate'
};

// Cache
let indexCache = null;

// CWD scan cache (30 second TTL)
let cwdCache = { extensions: new Map(), timestamp: 0, cwd: '' };
const CWD_CACHE_TTL = 30000; // 30 seconds

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

/**
 * Scan current working directory for context patterns.
 * Detects: file extensions, specific files, folders, and special patterns.
 * Returns comprehensive context object for intelligent routing.
 * Cached for 30 seconds to avoid repeated disk I/O.
 */
function scanContext() {
    if (!ENABLE_CWD_CONTEXT) {
        return { extensions: new Map(), files: new Set(), folders: new Set(), autoActivate: null, hints: [] };
    }

    try {
        const cwd = process.env.CWD || process.cwd();
        const now = Date.now();

        // Return cached result if still fresh
        if (cwdCache.cwd === cwd && (now - cwdCache.timestamp) < CWD_CACHE_TTL) {
            return cwdCache.context || { extensions: cwdCache.extensions, files: new Set(), folders: new Set(), autoActivate: null, hints: [] };
        }

        const entries = fs.readdirSync(cwd, { withFileTypes: true });

        // Skip scanning if too many entries (performance threshold)
        if (entries.length > 200) {
            const emptyContext = { extensions: new Map(), files: new Set(), folders: new Set(), autoActivate: null, hints: [] };
            cwdCache = { context: emptyContext, extensions: new Map(), timestamp: now, cwd };
            return emptyContext;
        }

        const context = {
            extensions: new Map(),
            files: new Set(),
            folders: new Set(),
            autoActivate: null,  // Tier 1 skill to auto-activate
            autoActivateReason: null,
            hints: []  // Tier 3 suggestions
        };

        // Scan all entries (limit to 50 for performance)
        for (const entry of entries.slice(0, 50)) {
            const name = entry.name.toLowerCase();

            if (entry.isFile()) {
                // Track file name for pattern matching
                context.files.add(name);

                // Track extension
                const ext = path.extname(name).toLowerCase();
                if (ext) {
                    context.extensions.set(ext, (context.extensions.get(ext) || 0) + 1);
                }

                // Check for Tier 1 auto-activation files
                if (!context.autoActivate && CONTEXT_AUTO_ACTIVATE.files[name]) {
                    context.autoActivate = CONTEXT_AUTO_ACTIVATE.files[name];
                    context.autoActivateReason = `File detected: ${entry.name}`;
                }

                // Check for Tier 3 hints
                if (CONTEXT_HINTS[name]) {
                    context.hints.push(...CONTEXT_HINTS[name]);
                }
            } else if (entry.isDirectory()) {
                // Track folder name
                context.folders.add(name);

                // Check for Tier 1 auto-activation folders
                if (!context.autoActivate && CONTEXT_AUTO_ACTIVATE.folders[name]) {
                    context.autoActivate = CONTEXT_AUTO_ACTIVATE.folders[name];
                    context.autoActivateReason = `Folder detected: ${entry.name}/`;
                }

                // Check for Tier 3 hints (folders like .git)
                if (CONTEXT_HINTS[name]) {
                    context.hints.push(...CONTEXT_HINTS[name]);
                }
            }
        }

        // Special AHK version detection
        // .ahk2 / .ah2 extension = ALWAYS v2 (no ambiguity)
        // .ahk extension = could be v1 OR v2, need syntax detection
        const ahk2Count = (context.extensions.get('.ahk2') || 0) + (context.extensions.get('.ah2') || 0);
        const ahkCount = context.extensions.get('.ahk') || 0;

        if (ahk2Count >= MIN_FILES_FOR_BOOST) {
            // .ahk2 / .ah2 files = definitely v2
            context.autoActivate = 'julien-ref-ahk-v2';
            context.autoActivateReason = `AutoHotkey v2 project (${ahk2Count} .ahk2/.ah2 files)`;
        } else if (ahkCount >= MIN_FILES_FOR_BOOST) {
            // .ahk files need syntax detection (could be v1 or v2)
            const ahkVersion = detectAHKVersion(cwd);
            if (ahkVersion === 2) {
                context.autoActivate = 'julien-ref-ahk-v2';
                context.autoActivateReason = `AutoHotkey v2 syntax detected (${ahkCount} .ahk files)`;
            } else if (ahkVersion === 1) {
                context.autoActivate = 'julien-ref-ahk-v1';
                context.autoActivateReason = `AutoHotkey v1 syntax detected (${ahkCount} .ahk files)`;
            }
            // If version undetermined, don't auto-activate (let keyword routing handle it)
        }

        // Update cache
        cwdCache = { context, extensions: context.extensions, timestamp: now, cwd };

        return context;
    } catch (e) {
        // Fail silently - context is optional
        return { extensions: new Map(), files: new Set(), folders: new Set(), autoActivate: null, hints: [] };
    }
}

/**
 * Detect AutoHotkey version from .ahk files in directory.
 * Returns 1, 2, or null if undetermined.
 */
function detectAHKVersion(dir) {
    try {
        const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.ahk'));
        if (files.length === 0) return null;

        // Read first AHK file (up to 2KB)
        const firstFile = path.join(dir, files[0]);
        const content = fs.readFileSync(firstFile, 'utf-8').slice(0, 2048);

        // v2 indicators
        const v2Patterns = [
            /^#Requires\s+AutoHotkey\s+v?2/im,
            /\bglobal\s+\w+\s*:=/,
            /\bclass\s+\w+\s*\{/,
            /\(\)\s*=>/,
            /\.Push\(/,
            /\.Length\b/
        ];

        // v1 indicators
        const v1Patterns = [
            /^#NoEnv\b/m,
            /\bSetBatchLines\b/,
            /:=\s*Object\(\)/,
            /\bIfEqual\b/,
            /\bStringReplace\b/
        ];

        const v2Score = v2Patterns.filter(p => p.test(content)).length;
        const v1Score = v1Patterns.filter(p => p.test(content)).length;

        if (v2Score > v1Score) return 2;
        if (v1Score > v2Score) return 1;
        return null;
    } catch (e) {
        return null;
    }
}

// Legacy alias for backward compatibility
function scanCWD() {
    const context = scanContext();
    return context.extensions;
}

/**
 * Apply context boost based on file extensions in CWD.
 * Boosts skills if 3+ files of relevant type are detected.
 */
function applyContextBoost(skillScores, cwdExtensions, hasAnalyticalVerb) {
    if (cwdExtensions.size === 0) return;

    for (const [ext, count] of cwdExtensions) {
        const skills = EXTENSION_SKILL_MAP[ext];

        // Only boost if we have significant presence (3+ files)
        if (skills && count >= MIN_FILES_FOR_BOOST) {
            for (const skillName of skills) {
                // Apply boost if:
                // 1. Skill already has some score, OR
                // 2. Prompt contains analytical verb (indicates intent to process files)
                if (skillScores[skillName] > 0) {
                    skillScores[skillName] += CONTEXT_BOOST;
                } else if (hasAnalyticalVerb) {
                    // Give minimal base score + context boost for analytical intent
                    skillScores[skillName] = CONTEXT_BOOST;
                }
            }
        }
    }
}

/**
 * Apply analytical verb boosting to word matches.
 * Verbs like "extract", "analyze", "parse" get 1.5x weight.
 */
function applyVerbBoost(skillScores, words, keywords) {
    for (const word of words) {
        const verbBoost = ANALYTICAL_VERBS[word];

        if (verbBoost && keywords[word]) {
            for (const [skillName, weight] of keywords[word]) {
                // Apply verb boost on top of base word score
                const additionalBoost = weight * 0.5 * (verbBoost - 1.0);
                skillScores[skillName] = (skillScores[skillName] || 0) + additionalBoost;
            }
        }
    }
}

/**
 * Calculate Levenshtein distance between two strings.
 * Returns the minimum number of edits (insert, delete, substitute) needed.
 */
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(a.length + 1).fill(null).map(() =>
        Array(b.length + 1).fill(null)
    );

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[a.length][b.length];
}

/**
 * Apply fuzzy matching for typos and minor misspellings.
 * Uses typo map first (O(1)), then Levenshtein distance for short words.
 */
function applyFuzzyMatching(skillScores, words, keywords) {
    if (!ENABLE_FUZZY_MATCH) return;

    for (const word of words) {
        // Skip if already matched exactly
        if (keywords[word]) continue;

        // Check typo map first (fast)
        const corrected = TYPO_MAP[word];
        if (corrected && keywords[corrected]) {
            for (const [skillName, weight] of keywords[corrected]) {
                // Reduced weight for fuzzy matches (0.3x instead of 0.5x)
                skillScores[skillName] = (skillScores[skillName] || 0) + weight * 0.3;
            }
            continue;
        }

        // Levenshtein distance for short words only (4-10 chars for performance)
        if (word.length < 4 || word.length > 10) continue;

        for (const keyword of Object.keys(keywords)) {
            // Skip if length difference is too large
            if (Math.abs(keyword.length - word.length) > MAX_EDIT_DISTANCE) continue;

            // Calculate distance
            const distance = levenshteinDistance(word, keyword);
            if (distance <= MAX_EDIT_DISTANCE) {
                for (const [skillName, weight] of keywords[keyword]) {
                    // Reduced weight for fuzzy matches
                    skillScores[skillName] = (skillScores[skillName] || 0) + weight * 0.3;
                }
                break; // Only match first fuzzy keyword to avoid over-scoring
            }
        }
    }
}

/**
 * Save routing log for debugging (last routing only).
 */
function saveRoutingLog(prompt, matches, elapsed) {
    try {
        const logData = {
            timestamp: new Date().toISOString(),
            prompt: prompt.substring(0, 200),
            matches: matches.map(m => ({
                name: m.name,
                score: Math.round(m.score * 100),
                source: m.source
            })),
            elapsed_ms: elapsed,
            match_count: matches.length
        };
        fs.writeFileSync(ROUTING_LOG_FILE, JSON.stringify(logData, null, 2), 'utf-8');
    } catch (e) {
        // Silent fail
    }
}

/**
 * Append to routing history (JSONL format) with rich metadata.
 */
function saveRoutingHistory(prompt, matches, allScores, cwdExtensions, elapsed) {
    try {
        // Hash prompt for privacy
        const crypto = require('crypto');
        const promptHash = crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);

        const historyEntry = {
            timestamp: new Date().toISOString(),
            prompt_hash: promptHash,
            prompt_length: prompt.length,
            matches: matches.map(m => ({
                name: m.name,
                score: Math.round(m.score * 100) / 100,
                confidence: Math.min(100, Math.round(m.score * 20))
            })),
            context: {
                has_office_files: cwdExtensions.size > 0,
                file_extensions: Array.from(cwdExtensions.keys())
            },
            elapsed_ms: elapsed,
            top_match_confidence: matches.length > 0 ? Math.min(100, Math.round(matches[0].score * 20)) : 0
        };

        fs.appendFileSync(ROUTING_HISTORY_FILE, JSON.stringify(historyEntry) + '\n', 'utf-8');
    } catch (e) {
        // Silent fail
    }
}

/**
 * Log near-misses: skills that almost matched (score 0.1-0.19).
 * Helps identify trigger gaps.
 */
function saveNearMisses(prompt, allScores, elapsed) {
    try {
        const nearMisses = Object.entries(allScores)
            .filter(([_, score]) => score >= 0.1 && score < MIN_SCORE)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (nearMisses.length === 0) return;

        const crypto = require('crypto');
        const promptHash = crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);

        const nearMissEntry = {
            timestamp: new Date().toISOString(),
            prompt_hash: promptHash,
            prompt_preview: prompt.substring(0, 100),
            near_misses: nearMisses.map(([name, score]) => ({
                name,
                score: Math.round(score * 100) / 100,
                gap_to_threshold: Math.round((MIN_SCORE - score) * 100)
            })),
            elapsed_ms: elapsed
        };

        fs.appendFileSync(NEAR_MISS_LOG_FILE, JSON.stringify(nearMissEntry) + '\n', 'utf-8');
    } catch (e) {
        // Silent fail
    }
}

function route(prompt) {
    const index = loadIndex();
    if (!index) return { results: [], allScores: {}, context: { extensions: new Map() }, autoActivated: false };

    const keywords = index.keywords || {};
    const skillsInfo = index.skills || {};

    // Scan CWD for context awareness (extended version)
    const context = scanContext();
    const cwdExtensions = context.extensions;

    // Check for Tier 1 auto-activation FIRST
    if (context.autoActivate) {
        const info = skillsInfo[context.autoActivate] || {};
        const autoResult = {
            name: context.autoActivate,
            description: info.description || '',
            source: info.source || 'context-auto',
            score: 1.0,
            autoActivated: true,
            autoReason: context.autoActivateReason
        };

        // Still calculate other scores for Top 10 display, but auto-activated skill wins
        const skillScores = {};
        skillScores[context.autoActivate] = 1.0;

        // Run normal scoring for other skills (for display purposes)
        const words = tokenize(prompt);
        const promptLower = prompt.toLowerCase();
        for (const [keyword, matches] of Object.entries(keywords)) {
            if (promptLower.includes(keyword)) {
                for (const [skillName, weight] of matches) {
                    if (skillName !== context.autoActivate) {
                        const boost = keyword.includes(' ') ? 1.5 : 1.0;
                        skillScores[skillName] = (skillScores[skillName] || 0) + weight * boost;
                    }
                }
            }
        }

        return {
            results: [autoResult],
            allScores: skillScores,
            context,
            cwdExtensions,
            autoActivated: true,
            autoReason: context.autoActivateReason
        };
    }

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

    // Detect if prompt contains analytical verbs
    const hasAnalyticalVerb = words.some(word => ANALYTICAL_VERBS[word]);

    // Apply analytical verb boosting
    applyVerbBoost(skillScores, words, keywords);

    // Apply fuzzy matching for typos (Tier 2 matching)
    applyFuzzyMatching(skillScores, words, keywords);

    // Apply context awareness boost (Tier 2)
    applyContextBoost(skillScores, cwdExtensions, hasAnalyticalVerb);

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

    return { results, allScores: skillScores, context, cwdExtensions, autoActivated: false, hints: context.hints };
}

/**
 * Build human-readable explanation of routing decision.
 */
function buildRoutingExplanation(prompt, routingResult, elapsed) {
    const { results: matches, cwdExtensions, allScores, autoActivated, autoReason, context, hints } = routingResult;
    const explanation = {};

    // Auto-activation detection (Tier 1 - highest priority)
    if (autoActivated) {
        explanation.autoActivated = true;
        explanation.autoReason = autoReason;
        explanation.autoActivationDisplay = [
            '',
            '🎯 AUTO-ACTIVATION (Context Detection):',
            '─'.repeat(60),
            `  ✅ ${autoReason}`,
            `  🔧 Auto-activated: ${matches[0]?.name || 'unknown'}`,
            '─'.repeat(60)
        ].join('\n');
    }

    // Context detection
    if (cwdExtensions && cwdExtensions.size > 0) {
        const fileTypes = Array.from(cwdExtensions.entries())
            .map(([ext, count]) => `${count} ${ext} file${count > 1 ? 's' : ''}`)
            .join(', ');
        explanation.contextInfo = `   Working directory contains: ${fileTypes}`;
    }

    // Context hints (Tier 3)
    if (hints && hints.length > 0) {
        explanation.hints = [...new Set(hints)]; // Dedupe
    }

    // Query enhancements (typos, fuzzy matches)
    const enhancements = [];
    const words = tokenize(prompt);

    // Check for typo corrections
    for (const word of words) {
        if (TYPO_MAP[word]) {
            enhancements.push(`"${word}" → "${TYPO_MAP[word]}" (typo corrected)`);
        }
    }

    // Check for analytical verbs
    const analyticalVerbs = words.filter(w => ANALYTICAL_VERBS[w]);
    if (analyticalVerbs.length > 0) {
        enhancements.push(`Detected analytical intent: ${analyticalVerbs.join(', ')}`);
    }

    if (enhancements.length > 0) {
        explanation.enhancements = enhancements.map(e => `   • ${e}`).join('\n');
    }

    // Reasoning for top match (skip if auto-activated)
    if (!autoActivated && matches.length > 0) {
        const topMatch = matches[0];
        const reasons = [];

        // Check why it matched
        const promptLower = prompt.toLowerCase();

        // Check for explicit skill mentions
        if (promptLower.includes('pdf') && topMatch.name.includes('pdf')) {
            reasons.push('Explicit PDF keyword match');
        } else if (promptLower.includes('excel') || promptLower.includes('xlsx')) {
            reasons.push('Explicit Excel keyword match');
        } else if (promptLower.includes('word') || promptLower.includes('docx')) {
            reasons.push('Explicit Word keyword match');
        } else if (promptLower.includes('powerpoint') || promptLower.includes('pptx')) {
            reasons.push('Explicit PowerPoint keyword match');
        }

        // Check for context boost
        if (cwdExtensions && cwdExtensions.size > 0 && topMatch.name.includes('office')) {
            const relevantExt = Array.from(cwdExtensions.keys()).find(ext => {
                if (ext === '.pdf' && topMatch.name.includes('pdf')) return true;
                if (['.xlsx', '.xls'].includes(ext) && topMatch.name.includes('xlsx')) return true;
                if (['.docx', '.doc'].includes(ext) && topMatch.name.includes('docx')) return true;
                if (['.pptx', '.ppt'].includes(ext) && topMatch.name.includes('pptx')) return true;
                return false;
            });
            if (relevantExt) {
                reasons.push(`Context boost from ${relevantExt} files in directory`);
            }
        }

        // Check for analytical verbs
        if (analyticalVerbs.length > 0) {
            reasons.push(`Analytical verbs boost (${analyticalVerbs.join(', ')})`);
        }

        if (reasons.length > 0) {
            explanation.reasoning = reasons.join(' + ');
        } else {
            explanation.reasoning = 'Keyword and trigger matching';
        }
    }

    return explanation;
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
        // Old logging system
        logHookStartOld('UserPromptSubmit', 'fast-skill-router.js');

        // NEW: Unified logging
        const startTime = unifiedLogger.logHookStart('UserPromptSubmit', 'fast-skill-router.js', 'core');

        try {
            logDebug('UserPromptSubmit', 'fast-skill-router.js', `Stdin received: ${inputData.length} bytes`, 'INPUT');

            const data = JSON.parse(inputData);
            const userPrompt = data.user_prompt || '';

            logDebug('UserPromptSubmit', 'fast-skill-router.js', `Prompt: "${userPrompt}"`, 'PROMPT');

            // Skip short prompts
            if (userPrompt.length < 3) {
                logDebug('UserPromptSubmit', 'fast-skill-router.js', 'Prompt too short, skipping', 'SKIP');
                console.error('[routing: prompt too short]');

                logHookEndOld('UserPromptSubmit', 'fast-skill-router.js', true);
                unifiedLogger.logHookEnd('UserPromptSubmit', 'fast-skill-router.js', startTime, 'skip', {
                    reason: 'prompt too short'
                });
                process.exit(0);
            }

            // Check if index exists
            if (!fs.existsSync(INDEX_FILE)) {
                logDebug('UserPromptSubmit', 'fast-skill-router.js', 'Index file not found', 'ERROR');
                console.error('[routing: index not built - run build-keyword-index.py]');

                logHookEndOld('UserPromptSubmit', 'fast-skill-router.js', false);
                unifiedLogger.logHookEnd('UserPromptSubmit', 'fast-skill-router.js', startTime, 'error', {
                    error_message: 'index file not found'
                });
                process.exit(0);
            }

            logDebug('UserPromptSubmit', 'fast-skill-router.js', 'Starting routing...', 'INFO');

            // Route
            const start = Date.now();
            const routingResult = route(userPrompt);
            const { results: matches, allScores, cwdExtensions, autoActivated, autoReason, context, hints } = routingResult;
            const elapsed = Date.now() - start;

            logDebug('UserPromptSubmit', 'fast-skill-router.js', `Routing completed in ${elapsed}ms`, 'INFO');
            if (autoActivated) {
                logDebug('UserPromptSubmit', 'fast-skill-router.js', `AUTO-ACTIVATED: ${matches[0]?.name} (${autoReason})`, 'ROUTE');
            } else if (matches.length > 0) {
                logDebug('UserPromptSubmit', 'fast-skill-router.js', `Top match: ${matches[0].name} (score: ${matches[0].score})`, 'ROUTE');
            } else {
                logDebug('UserPromptSubmit', 'fast-skill-router.js', 'No matches found', 'ROUTE');
            }

            // NEW: Log router decision to unified logger with top 10 scores
            const top10Scores = Object.entries(allScores)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([skill, score]) => ({
                    skill,
                    score: Math.round(score * 100) / 100,
                    confidence: Math.min(100, Math.round(score * 20))
                }));

            unifiedLogger.logRouterDecision(
                userPrompt,
                matches,
                {
                    cwd_extensions: Object.fromEntries(cwdExtensions),
                    top_10_scores: top10Scores
                },
                elapsed
            );

            // Save routing log for /show-routing command
            saveRoutingLog(userPrompt, matches, elapsed);

            // Save to routing history (JSONL)
            saveRoutingHistory(userPrompt, matches, allScores, cwdExtensions, elapsed);

            // Log near-misses for trigger gap analysis
            saveNearMisses(userPrompt, allScores, elapsed);

            // Build detailed routing explanation
            const explanation = buildRoutingExplanation(userPrompt, routingResult, elapsed);

            // Output PLAIN TEXT to stdout (Claude sees non-JSON text as context)
            if (matches.length > 0) {
                const topMatch = matches[0];
                const confidence = Math.min(100, Math.round(topMatch.score * 20));

                console.log('\n' + '='.repeat(70));
                console.log('🔍 SKILL ROUTING ANALYSIS');
                console.log('='.repeat(70));

                // Show AUTO-ACTIVATION first (Tier 1 - highest priority)
                if (explanation.autoActivated && explanation.autoActivationDisplay) {
                    console.log(explanation.autoActivationDisplay);
                }

                // Show context detection
                if (explanation.contextInfo) {
                    console.log('\n📂 Context Detected:');
                    console.log(explanation.contextInfo);
                }

                // Show corrections/enhancements
                if (explanation.enhancements) {
                    console.log('\n✨ Query Enhancements:');
                    console.log(explanation.enhancements);
                }

                // Show main routing result (skip if auto-activated, already shown above)
                if (!explanation.autoActivated) {
                    console.log('\n🎯 Routing Result:');

                    // Strong match (>= 1.0): Direct instruction
                    if (topMatch.score >= 1.0) {
                        console.log(`   ✅ STRONG MATCH (${confidence}% confidence)`);
                        console.log(`   → Use Skill("${topMatch.name}")`);
                        if (explanation.reasoning) {
                            console.log(`   📝 Why: ${explanation.reasoning}`);
                        }
                    }
                    // Medium match (0.5-1.0): Suggestion
                    else if (topMatch.score >= 0.5) {
                        console.log(`   💡 SUGGESTED (${confidence}% confidence)`);
                        console.log(`   → Skill("${topMatch.name}") might help`);
                        if (explanation.reasoning) {
                            console.log(`   📝 Why: ${explanation.reasoning}`);
                        }
                    }
                    // Weak matches: Show for awareness
                    else if (topMatch.score >= 0.2) {
                        console.log(`   📋 RELATED SKILLS (low confidence)`);
                        matches.slice(0, 3).forEach(m => {
                            const conf = Math.min(100, Math.round(m.score * 20));
                            console.log(`   • ${m.name} (${conf}%)`);
                        });
                    }
                }

                // Show top 10 skills ranking (verbose mode)
                if (process.env.VERBOSE_ROUTING !== 'false') {
                    console.log('\n📊 Top 10 Skills Ranking:');
                    console.log('─'.repeat(70));

                    // Sort all skills by score and take top 10
                    const allSkills = Object.entries(allScores)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10);

                    allSkills.forEach(([skill, score], index) => {
                        const confidence = Math.min(100, Math.round(score * 20));
                        const barLength = Math.floor(confidence / 5);
                        const bar = '█'.repeat(barLength);
                        const status = score >= MIN_SCORE ? '✓' :
                                      score >= 0.10 ? '~' : '✗';

                        console.log(`  ${status} ${(index+1).toString().padStart(2)}. ${skill.padEnd(40)} ${bar} ${confidence}%`);
                    });

                    console.log('─'.repeat(70));
                    console.log('  ✓ Above threshold (≥0.25) | ~ Near-miss (0.10-0.24) | ✗ Below threshold');
                }

                // Show performance
                console.log(`\n⚡ Performance: ${elapsed}ms`);
                console.log('='.repeat(70) + '\n');
            }

            // Debug output to stderr (gray text, for debugging only)
            if (matches.length > 0) {
                console.error(`[routing: ${matches[0].name} ${Math.round(matches[0].score * 100)}% (${elapsed}ms)]`);
            } else {
                console.error(`[routing: no match (${elapsed}ms)]`);
            }

            // Old logging system
            logHookEndOld('UserPromptSubmit', 'fast-skill-router.js', true);

            // NEW: Unified logging system with duration
            unifiedLogger.logHookEnd('UserPromptSubmit', 'fast-skill-router.js', startTime, 'success');
        } catch (e) {
            logDebug('UserPromptSubmit', 'fast-skill-router.js', `ERROR: ${e.message}`, 'ERROR');

            // Old logging system
            logHookEndOld('UserPromptSubmit', 'fast-skill-router.js', false);

            // NEW: Unified logging system with error
            unifiedLogger.logHookEnd('UserPromptSubmit', 'fast-skill-router.js', startTime, 'error', {
                error_message: e.message
            });
            process.exit(0);
        }
    });
}

main();
