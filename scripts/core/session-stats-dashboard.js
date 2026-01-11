#!/usr/bin/env node
/**
 * Session Stats Dashboard - Shows session statistics at session end
 * Hook: SessionEnd
 *
 * Displays:
 * - Session duration
 * - Skills invoked
 * - Tools used
 * - Files modified
 * - Summary of work done
 */

const fs = require('fs');
const path = require('path');

// Add lib directory to path for imports
const libDir = path.join(__dirname, 'lib');
const debugLogger = require(path.join(libDir, 'debug-logger.js'));

const { logHookStart, logHookEnd, logDebug } = debugLogger;

function parseTranscript(transcriptPath) {
    const stats = {
        start_time: null,
        end_time: null,
        skills_used: new Map(),
        tools_used: new Map(),
        files_modified: new Set(),
        user_prompts: 0,
        assistant_responses: 0
    };

    if (!fs.existsSync(transcriptPath)) {
        return stats;
    }

    try {
        const content = fs.readFileSync(transcriptPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());

        for (const line of lines) {
            try {
                const entry = JSON.parse(line);

                // Track timestamps
                if (entry.timestamp) {
                    const ts = new Date(entry.timestamp);
                    if (!stats.start_time) {
                        stats.start_time = ts;
                    }
                    stats.end_time = ts;
                }

                // Count user prompts
                if (entry.role === 'user') {
                    stats.user_prompts++;
                }

                // Count assistant responses
                else if (entry.role === 'assistant') {
                    stats.assistant_responses++;

                    // Extract tool uses from content
                    const content = entry.content || [];
                    if (Array.isArray(content)) {
                        for (const item of content) {
                            if (typeof item === 'object' && item !== null) {
                                // Skill invocations
                                if (item.type === 'tool_use' && item.name === 'Skill') {
                                    const skill = (item.input || {}).skill || 'unknown';
                                    stats.skills_used.set(skill, (stats.skills_used.get(skill) || 0) + 1);
                                }

                                // Other tools
                                else if (item.type === 'tool_use') {
                                    const tool = item.name || 'unknown';
                                    stats.tools_used.set(tool, (stats.tools_used.get(tool) || 0) + 1);

                                    // Extract file paths
                                    const toolInput = item.input || {};
                                    if (toolInput.file_path) {
                                        stats.files_modified.add(toolInput.file_path);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                // Skip malformed lines
                continue;
            }
        }
    } catch (e) {
        // Silent fail
    }

    return stats;
}

function formatDuration(start, end) {
    if (!start || !end) {
        return 'unknown';
    }

    const delta = (end - start) / 1000; // seconds
    const hours = Math.floor(delta / 3600);
    const minutes = Math.floor((delta % 3600) / 60);
    const seconds = Math.floor(delta % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

function displayDashboard(stats) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SESSION STATISTICS');
    console.log('='.repeat(60));

    // Duration
    if (stats.start_time && stats.end_time) {
        const duration = formatDuration(stats.start_time, stats.end_time);
        console.log(`\n⏱️  Duration: ${duration}`);
    }

    // Interaction count
    console.log(`💬 Exchanges: ${stats.user_prompts} prompts, ${stats.assistant_responses} responses`);

    // Skills used
    if (stats.skills_used.size > 0) {
        console.log(`\n🔧 Skills used (${stats.skills_used.size}):`);
        const sortedSkills = Array.from(stats.skills_used.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        for (const [skill, count] of sortedSkills) {
            console.log(`   • ${skill} (${count}x)`);
        }
        if (stats.skills_used.size > 5) {
            console.log(`   ... and ${stats.skills_used.size - 5} more`);
        }
    }

    // Top tools
    if (stats.tools_used.size > 0) {
        console.log(`\n🛠️  Top tools:`);
        const sortedTools = Array.from(stats.tools_used.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        for (const [tool, count] of sortedTools) {
            console.log(`   • ${tool} (${count}x)`);
        }
    }

    // Files modified
    if (stats.files_modified.size > 0) {
        const fileCount = stats.files_modified.size;
        console.log(`\n📝 Files modified: ${fileCount}`);
        const sortedFiles = Array.from(stats.files_modified).sort();

        if (fileCount <= 5) {
            for (const f of sortedFiles) {
                console.log(`   • ${f}`);
            }
        } else {
            for (const f of sortedFiles.slice(0, 3)) {
                console.log(`   • ${f}`);
            }
            console.log(`   ... and ${fileCount - 3} more`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Session saved to memory. Use /system:semantic-memory-search to recall.');
    console.log('='.repeat(60) + '\n');
}

/* istanbul ignore next */
function main() {
    logHookStart('SessionEnd', 'session-stats-dashboard.js');

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

            logDebug('SessionEnd', 'session-stats-dashboard.js', `Transcript: ${transcriptPath}`, 'INFO');

            if (!fs.existsSync(transcriptPath)) {
                logDebug('SessionEnd', 'session-stats-dashboard.js', 'Transcript not found', 'SKIP');
                logHookEnd('SessionEnd', 'session-stats-dashboard.js', true);
                process.exit(0);
            }

            // Parse and display stats
            logDebug('SessionEnd', 'session-stats-dashboard.js', 'Parsing transcript...', 'INFO');
            const stats = parseTranscript(transcriptPath);

            logDebug('SessionEnd', 'session-stats-dashboard.js', `Stats: ${stats.user_prompts} prompts`, 'INFO');
            logDebug('SessionEnd', 'session-stats-dashboard.js', 'Displaying dashboard', 'OUTPUT');

            displayDashboard(stats);

            logHookEnd('SessionEnd', 'session-stats-dashboard.js', true);
            process.exit(0);

        } catch (e) {
            logDebug('SessionEnd', 'session-stats-dashboard.js', `ERROR: ${e.message}`, 'ERROR');
            logHookEnd('SessionEnd', 'session-stats-dashboard.js', false);
            // Silent fail - don't break session end
            console.error(`[stats] Error: ${e.message}`);
            process.exit(0);
        }
    });
}

// Export for testing
/* istanbul ignore else */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseTranscript,
        formatDuration,
        displayDashboard
    };
}

// Run main if executed directly
/* istanbul ignore if */
if (require.main === module) {
    main();
}
