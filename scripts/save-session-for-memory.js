#!/usr/bin/env node
/**
 * Hook: SessionEnd
 * Assemble les chunks PreCompact + transcript final, extrait le contenu sémantique
 * et le sauvegarde pour Claude Mem.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Add lib directory to path for imports
const libDir = path.join(__dirname, 'lib');
const debugLogger = require(path.join(libDir, 'debug-logger.js'));

const { logHookStart, logHookEnd, logDebug } = debugLogger;

const SUMMARIES_DIR = path.join(os.homedir(), '.claude', 'compacted-summaries');
const CHUNKS_DIR = path.join(os.homedir(), '.claude', 'memory-chunks');

function assembleFullTranscript(sessionId, finalTranscriptPath) {
    const allEntries = [];

    // 1. Charger les chunks PreCompact s'ils existent
    const indexPath = path.join(CHUNKS_DIR, `${sessionId}_index.json`);
    if (fs.existsSync(indexPath)) {
        try {
            const indexData = fs.readFileSync(indexPath, 'utf-8');
            const index = JSON.parse(indexData);

            // Trier par chunk_number
            const sortedIndex = index.sort((a, b) => (a.chunk_number || 0) - (b.chunk_number || 0));

            for (const chunkInfo of sortedIndex) {
                const chunkPath = path.join(CHUNKS_DIR, chunkInfo.filename);
                if (fs.existsSync(chunkPath)) {
                    try {
                        const content = fs.readFileSync(chunkPath, 'utf-8');
                        const lines = content.split('\n').filter(l => l.trim());

                        for (const line of lines) {
                            try {
                                const entry = JSON.parse(line);
                                allEntries.push(entry);
                            } catch (e) {
                                // Skip malformed lines
                            }
                        }
                    } catch (e) {
                        logDebug('SessionEnd', 'save-session-for-memory.js', `Error reading chunk ${chunkInfo.filename}: ${e.message}`, 'ERROR');
                    }
                }
            }
        } catch (e) {
            logDebug('SessionEnd', 'save-session-for-memory.js', `Error loading chunks: ${e.message}`, 'ERROR');
        }
    }

    // 2. Ajouter le transcript final
    if (fs.existsSync(finalTranscriptPath)) {
        try {
            const content = fs.readFileSync(finalTranscriptPath, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim());

            for (const line of lines) {
                try {
                    const entry = JSON.parse(line);
                    allEntries.push(entry);
                } catch (e) {
                    // Skip malformed lines
                }
            }
        } catch (e) {
            logDebug('SessionEnd', 'save-session-for-memory.js', `Error loading final transcript: ${e.message}`, 'ERROR');
        }
    }

    return allEntries;
}

function extractSemanticContent(entries, cwd) {
    if (!entries || entries.length === 0) {
        return null;
    }

    const userMessages = [];
    const filesMentioned = new Set();

    for (const entry of entries) {
        // Extraire messages utilisateur
        if (entry.role === 'user') {
            const content = entry.content || '';

            if (typeof content === 'string' && content.length > 20) {
                userMessages.push(content.substring(0, 500));
            } else if (Array.isArray(content)) {
                for (const item of content) {
                    if (typeof item === 'object' && item !== null && item.type === 'text') {
                        const text = item.text || '';
                        if (text.length > 20) {
                            userMessages.push(text.substring(0, 500));
                        }
                    }
                }
            }
        }
        // Extraire fichiers mentionnés
        else if (entry.role === 'assistant') {
            const content = entry.content || '';

            if (typeof content === 'string') {
                // Chercher des patterns de fichiers (json avant js pour éviter capture partielle)
                const filePattern = /[\w/\\.-]+\.(py|json|yaml|tsx|jsx|ts|js|vue|md|css|html)/g;
                const matches = content.match(filePattern) || [];
                matches.slice(0, 20).forEach(f => filesMentioned.add(f));
            }
        }
    }

    if (userMessages.length === 0) {
        return null;
    }

    // Générer le résumé markdown
    const projectName = cwd ? path.basename(cwd) : 'Unknown';
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const summaryLines = [
        `# Session: ${projectName}`,
        `**Date**: ${timestamp}`,
        `**Project**: ${projectName}`,
        '',
        '## User Requests',
    ];

    for (const msg of userMessages.slice(0, 10)) {
        let cleanMsg = msg.replace(/\n/g, ' ').trim();
        if (cleanMsg.length > 200) {
            cleanMsg = cleanMsg.substring(0, 197) + '...'; // 197 + "..." = 200, then "- " + 200 = 202
        }
        summaryLines.push(`- ${cleanMsg}`);
    }

    summaryLines.push('');
    summaryLines.push('## Files Mentioned');

    if (filesMentioned.size > 0) {
        const filesArray = Array.from(filesMentioned).slice(0, 15);
        for (const f of filesArray) {
            summaryLines.push(`- ${f}`);
        }
    } else {
        summaryLines.push('- None detected');
    }

    return summaryLines.join('\n');
}

function cleanupChunks(sessionId) {
    try {
        const indexPath = path.join(CHUNKS_DIR, `${sessionId}_index.json`);
        if (fs.existsSync(indexPath)) {
            const indexData = fs.readFileSync(indexPath, 'utf-8');
            const index = JSON.parse(indexData);

            // Supprimer tous les fichiers de chunk
            for (const chunkInfo of index) {
                const chunkPath = path.join(CHUNKS_DIR, chunkInfo.filename);
                if (fs.existsSync(chunkPath)) {
                    fs.unlinkSync(chunkPath);
                }
            }

            // Supprimer l'index
            fs.unlinkSync(indexPath);
            logDebug('SessionEnd', 'save-session-for-memory.js', `Cleaned up ${index.length} chunks`, 'INFO');
        }
    } catch (e) {
        logDebug('SessionEnd', 'save-session-for-memory.js', `Error cleaning chunks: ${e.message}`, 'ERROR');
    }
}

/* istanbul ignore next */
function main() {
    logHookStart('SessionEnd', 'save-session-for-memory.js');

    let inputData = '';
    process.stdin.setEncoding('utf8');

    process.stdin.on('readable', () => {
        let chunk;
        while ((chunk = process.stdin.read()) !== null) {
            inputData += chunk;
        }
    });

    process.stdin.on('end', () => {
        try {
            const data = JSON.parse(inputData);
            const transcriptPath = data.transcript_path || '';
            const sessionId = data.session_id || 'unknown';
            const cwd = data.cwd || '';

            logDebug('SessionEnd', 'save-session-for-memory.js', `Transcript: ${transcriptPath}`, 'INFO');
            logDebug('SessionEnd', 'save-session-for-memory.js', `Session: ${sessionId}`, 'INFO');
            logDebug('SessionEnd', 'save-session-for-memory.js', `CWD: ${cwd}`, 'INFO');

            if (!transcriptPath) {
                logDebug('SessionEnd', 'save-session-for-memory.js', 'No transcript path', 'SKIP');
                logHookEnd('SessionEnd', 'save-session-for-memory.js', true);
                process.exit(0);
            }

            // Assembler tous les chunks + transcript final
            logDebug('SessionEnd', 'save-session-for-memory.js', 'Assembling full transcript...', 'INFO');
            const allEntries = assembleFullTranscript(sessionId, transcriptPath);

            if (!allEntries || allEntries.length === 0) {
                logDebug('SessionEnd', 'save-session-for-memory.js', 'No entries found', 'SKIP');
                logHookEnd('SessionEnd', 'save-session-for-memory.js', true);
                process.exit(0);
            }

            // Extraire le contenu sémantique
            logDebug('SessionEnd', 'save-session-for-memory.js', `Extracting semantic content from ${allEntries.length} entries...`, 'INFO');
            const summary = extractSemanticContent(allEntries, cwd);

            if (!summary) {
                logDebug('SessionEnd', 'save-session-for-memory.js', 'No semantic content extracted', 'SKIP');
                logHookEnd('SessionEnd', 'save-session-for-memory.js', true);
                process.exit(0);
            }

            // Sauvegarder
            if (!fs.existsSync(SUMMARIES_DIR)) {
                fs.mkdirSync(SUMMARIES_DIR, { recursive: true });
            }

            const now = new Date();
            const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
            const filename = `session-${timestamp}-${sessionId.substring(0, 8)}.md`;
            const filepath = path.join(SUMMARIES_DIR, filename);

            fs.writeFileSync(filepath, summary, 'utf-8');
            logDebug('SessionEnd', 'save-session-for-memory.js', `Saved: ${filename} (${allEntries.length} entries)`, 'OUTPUT');

            // Nettoyer les chunks temporaires
            cleanupChunks(sessionId);

            logHookEnd('SessionEnd', 'save-session-for-memory.js', true);
            process.exit(0);

        } catch (e) {
            logDebug('SessionEnd', 'save-session-for-memory.js', `ERROR: ${e.message}`, 'ERROR');
            logHookEnd('SessionEnd', 'save-session-for-memory.js', false);
            process.exit(0);
        }
    });
}

// Export for testing
/* istanbul ignore else */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        assembleFullTranscript,
        extractSemanticContent,
        cleanupChunks,
        SUMMARIES_DIR,
        CHUNKS_DIR
    };
}

// Run main if executed directly
/* istanbul ignore if */
if (require.main === module) {
    main();
}
