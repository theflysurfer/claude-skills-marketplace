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
const ROUTING_LOG_FILE = path.join(CLAUDE_HOME, 'cache', 'last-routing.json');
const ROUTING_HISTORY_FILE = path.join(CLAUDE_HOME, 'cache', 'routing-history.jsonl');
const NEAR_MISS_LOG_FILE = path.join(CLAUDE_HOME, 'cache', 'near-misses.jsonl');

// Thresholds
const MIN_SCORE = 0.2;
const TOP_K = 3;

// Context Awareness Configuration
const ENABLE_CWD_CONTEXT = process.env.ROUTER_CWD_CONTEXT !== 'false'; // Enabled by default
const CONTEXT_BOOST = 0.7; // Boost value when file extensions match (strong enough to beat generic matches)
const MIN_FILES_FOR_BOOST = 3; // Minimum files of same type to trigger boost

// Extension to Skill Mapping
const EXTENSION_SKILL_MAP = {
    '.pdf': ['anthropic-office-pdf'],
    '.docx': ['anthropic-office-docx'],
    '.doc': ['anthropic-office-docx'],
    '.xlsx': ['anthropic-office-xlsx'],
    '.xls': ['anthropic-office-xlsx'],
    '.xlsm': ['anthropic-office-xlsx'],
    '.pptx': ['anthropic-office-pptx'],
    '.ppt': ['anthropic-office-pptx']
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
 * Scan CWD for file extensions to provide context awareness.
 * Returns a Map of extension -> count.
 */
function scanCWD() {
    if (!ENABLE_CWD_CONTEXT) {
        return new Map();
    }

    try {
        const cwd = process.env.CWD || process.cwd();
        const files = fs.readdirSync(cwd, { withFileTypes: true });

        const extensions = new Map();

        // Limit to first 50 files for performance
        for (const file of files.slice(0, 50)) {
            if (file.isFile()) {
                const ext = path.extname(file.name).toLowerCase();
                if (ext) {
                    extensions.set(ext, (extensions.get(ext) || 0) + 1);
                }
            }
        }

        return extensions;
    } catch (e) {
        // Fail silently - context is optional
        return new Map();
    }
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
    if (!index) return { results: [], allScores: {}, cwdExtensions: new Map() };

    const keywords = index.keywords || {};
    const skillsInfo = index.skills || {};

    // Scan CWD for context awareness
    const cwdExtensions = scanCWD();

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

    // Apply context awareness boost
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

    return { results, allScores: skillScores, cwdExtensions };
}

/**
 * Build human-readable explanation of routing decision.
 */
function buildRoutingExplanation(prompt, matches, cwdExtensions, allScores, elapsed) {
    const explanation = {};

    // Context detection
    if (cwdExtensions.size > 0) {
        const fileTypes = Array.from(cwdExtensions.entries())
            .map(([ext, count]) => `${count} ${ext} file${count > 1 ? 's' : ''}`)
            .join(', ');
        explanation.contextInfo = `   Working directory contains: ${fileTypes}`;
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

    // Reasoning for top match
    if (matches.length > 0) {
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
        if (cwdExtensions.size > 0 && topMatch.name.includes('office')) {
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
            const { results: matches, allScores, cwdExtensions } = route(userPrompt);
            const elapsed = Date.now() - start;

            // Save routing log for /show-routing command
            saveRoutingLog(userPrompt, matches, elapsed);

            // Save to routing history (JSONL)
            saveRoutingHistory(userPrompt, matches, allScores, cwdExtensions, elapsed);

            // Log near-misses for trigger gap analysis
            saveNearMisses(userPrompt, allScores, elapsed);

            // Build detailed routing explanation
            const explanation = buildRoutingExplanation(userPrompt, matches, cwdExtensions, allScores, elapsed);

            // Output PLAIN TEXT to stdout (Claude sees non-JSON text as context)
            if (matches.length > 0) {
                const topMatch = matches[0];
                const confidence = Math.min(100, Math.round(topMatch.score * 20));

                console.log('\n' + '='.repeat(70));
                console.log('🔍 SKILL ROUTING ANALYSIS');
                console.log('='.repeat(70));

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

                // Show main routing result
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
        } catch (e) {
            process.exit(0);
        }
    });
}

main();
