#!/usr/bin/env node
/**
 * Hook: PreCompact
 * Sauvegarde le transcript brut AVANT compaction pour éviter la perte d'information.
 * Le hook SessionEnd assemblera tous les chunks pour créer la mémoire complète.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Add lib directory to path for imports
const libDir = path.join(__dirname, 'lib');
const debugLogger = require(path.join(libDir, 'debug-logger.js'));

const { logHookStart, logHookEnd, logDebug } = debugLogger;

const CHUNKS_DIR = path.join(os.homedir(), '.claude', 'memory-chunks');

function saveTranscriptChunk(transcriptPath, sessionId, chunkNumber) {
    if (!fs.existsSync(transcriptPath)) {
        return false;
    }

    try {
        // Créer le dossier de chunks
        if (!fs.existsSync(CHUNKS_DIR)) {
            fs.mkdirSync(CHUNKS_DIR, { recursive: true });
        }

        // Nom du chunk: session_id + numéro séquentiel
        const chunkFilename = `${sessionId}_chunk_${String(chunkNumber).padStart(3, '0')}.jsonl`;
        const chunkPath = path.join(CHUNKS_DIR, chunkFilename);

        // Copier le transcript (fs.copyFileSync préserve les métadonnées)
        fs.copyFileSync(transcriptPath, chunkPath);

        // Sauvegarder un index pour cette session
        const indexPath = path.join(CHUNKS_DIR, `${sessionId}_index.json`);
        let index = [];

        if (fs.existsSync(indexPath)) {
            try {
                index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
            } catch (e) {
                // Si l'index est corrompu, on recommence
                index = [];
            }
        }

        const stats = fs.statSync(chunkPath);
        index.push({
            chunk_number: chunkNumber,
            filename: chunkFilename,
            timestamp: new Date().toISOString(),
            size: stats.size
        });

        fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');

        logDebug('PreCompact', 'precompact-save-chunk.js', `Saved chunk ${chunkNumber} for session ${sessionId.substring(0, 8)}`, 'INFO');
        return true;

    } catch (e) {
        logDebug('PreCompact', 'precompact-save-chunk.js', `Error saving chunk: ${e.message}`, 'ERROR');
        return false;
    }
}

function getNextChunkNumber(sessionId) {
    const indexPath = path.join(CHUNKS_DIR, `${sessionId}_index.json`);

    if (!fs.existsSync(indexPath)) {
        return 1;
    }

    try {
        const data = fs.readFileSync(indexPath, 'utf-8');
        const index = JSON.parse(data);

        if (Array.isArray(index) && index.length > 0) {
            const maxChunk = Math.max(...index.map(c => c.chunk_number || 0));
            return maxChunk + 1;
        }
    } catch (e) {
        // Si erreur de lecture/parsing, recommencer à 1
    }

    return 1;
}

/* istanbul ignore next */
function main() {
    logHookStart('PreCompact', 'precompact-save-chunk.js');

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

            logDebug('PreCompact', 'precompact-save-chunk.js', `Transcript: ${transcriptPath}`, 'INFO');
            logDebug('PreCompact', 'precompact-save-chunk.js', `Session: ${sessionId}`, 'INFO');

            if (!transcriptPath || sessionId === 'unknown') {
                logDebug('PreCompact', 'precompact-save-chunk.js', 'Missing transcript or session_id', 'SKIP');
                logHookEnd('PreCompact', 'precompact-save-chunk.js', true);
                process.exit(0);
            }

            // Déterminer le numéro de chunk
            const chunkNumber = getNextChunkNumber(sessionId);
            logDebug('PreCompact', 'precompact-save-chunk.js', `Next chunk number: ${chunkNumber}`, 'INFO');

            // Sauvegarder le chunk
            const success = saveTranscriptChunk(transcriptPath, sessionId, chunkNumber);

            logDebug('PreCompact', 'precompact-save-chunk.js', success ? 'Chunk saved' : 'Chunk save failed', success ? 'INFO' : 'ERROR');
            logHookEnd('PreCompact', 'precompact-save-chunk.js', success);
            process.exit(0);

        } catch (e) {
            logDebug('PreCompact', 'precompact-save-chunk.js', `ERROR: ${e.message}`, 'ERROR');
            logHookEnd('PreCompact', 'precompact-save-chunk.js', false);
            process.exit(0);
        }
    });
}

// Export for testing
/* istanbul ignore else */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        saveTranscriptChunk,
        getNextChunkNumber,
        CHUNKS_DIR
    };
}

// Run main if executed directly
/* istanbul ignore if */
if (require.main === module) {
    main();
}
