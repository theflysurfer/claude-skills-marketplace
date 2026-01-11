/**
 * Real-Time Log Monitoring Dashboard
 *
 * Tails ~/.claude/logs/unified.jsonl and displays events in real-time
 * with performance aggregation and alerts.
 *
 * Usage:
 *   node scripts/core/log-monitor.js [--session=SESSION_ID] [--project=PROJECT_NAME]
 *
 * Features:
 * - Real-time tail of unified.jsonl
 * - Filter by session, project, event type
 * - Performance aggregation (avg duration, error rate)
 * - Alerts for timeouts >5s or error rate >10%
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Config
const LOG_FILE = path.join(os.homedir(), '.claude', 'logs', 'unified.jsonl');
const ALERT_TIMEOUT_MS = 5000; // Alert if duration >5s
const ALERT_ERROR_RATE = 0.10; // Alert if error rate >10%
const STATS_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// CLI args
const args = process.argv.slice(2);
const filters = {
    session: args.find(a => a.startsWith('--session='))?.split('=')[1],
    project: args.find(a => a.startsWith('--project='))?.split('=')[1],
    eventType: args.find(a => a.startsWith('--event='))?.split('=')[1]
};

// Stats tracking
const stats = {
    events: [],
    byEventType: {},
    byHook: {},
    errors: 0,
    total: 0
};

/**
 * Format timestamp for display
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Get status icon
 */
function getStatusIcon(status) {
    switch (status) {
        case 'success': return '\u2713'; // ✓
        case 'error': return '\u2717'; // ✗
        case 'timeout': return '\u2717'; // ✗
        case 'skip': return '\u27A4'; // ➤
        default: return '\u2022'; // •
    }
}

/**
 * Get status color (ANSI codes)
 */
function getStatusColor(status) {
    switch (status) {
        case 'success': return '\x1b[32m'; // Green
        case 'error': return '\x1b[31m'; // Red
        case 'timeout': return '\x1b[31m'; // Red
        case 'skip': return '\x1b[33m'; // Yellow
        default: return '\x1b[37m'; // White
    }
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const YELLOW = '\x1b[33m';

/**
 * Format duration with color
 */
function formatDuration(ms) {
    if (ms > ALERT_TIMEOUT_MS) {
        return `${YELLOW}${ms}ms \u26A0\uFE0F${RESET}`; // ⚠️
    } else if (ms > 1000) {
        return `${YELLOW}${ms}ms${RESET}`;
    }
    return `${ms}ms`;
}

/**
 * Display a log entry
 */
function displayEntry(entry) {
    // Apply filters
    if (filters.session && entry.session_id !== filters.session) return;
    if (filters.project && entry.project_name !== filters.project) return;
    if (filters.eventType && entry.event_type !== filters.eventType) return;

    const time = formatTime(entry.timestamp);
    const sessionShort = entry.session_id.substring(0, 8);

    // Update stats
    stats.total++;
    if (entry.status === 'error' || entry.status === 'timeout') {
        stats.errors++;
    }

    // Track by event type
    if (!stats.byEventType[entry.event_type]) {
        stats.byEventType[entry.event_type] = { count: 0, totalDuration: 0, errors: 0 };
    }
    stats.byEventType[entry.event_type].count++;
    if (entry.duration_ms) {
        stats.byEventType[entry.event_type].totalDuration += entry.duration_ms;
    }
    if (entry.status === 'error' || entry.status === 'timeout') {
        stats.byEventType[entry.event_type].errors++;
    }

    // Track by hook
    if (entry.hook_name) {
        if (!stats.byHook[entry.hook_name]) {
            stats.byHook[entry.hook_name] = { count: 0, totalDuration: 0, errors: 0 };
        }
        stats.byHook[entry.hook_name].count++;
        if (entry.duration_ms) {
            stats.byHook[entry.hook_name].totalDuration += entry.duration_ms;
        }
        if (entry.status === 'error' || entry.status === 'timeout') {
            stats.byHook[entry.hook_name].errors++;
        }
    }

    // Store for windowed stats
    stats.events.push({...entry, parsedTime: Date.now()});
    // Keep only last 10 minutes
    const cutoff = Date.now() - STATS_WINDOW_MS;
    stats.events = stats.events.filter(e => e.parsedTime > cutoff);

    // Display based on action
    if (entry.action === 'start') {
        console.log(`${DIM}[${time}]${RESET} ${BOLD}SESSION ${sessionShort}${RESET} | ${entry.project_name}`);
        console.log(`  ${DIM}\u251C\u2500${RESET} [${entry.event_type}] ${entry.hook_name} ${DIM}started...${RESET}`);
    } else if (entry.action === 'end') {
        const icon = getStatusIcon(entry.status);
        const color = getStatusColor(entry.status);
        const duration = entry.duration_ms ? formatDuration(entry.duration_ms) : '';

        let line = `  ${DIM}\u2514\u2500${RESET} [${entry.event_type}] ${entry.hook_name} ${color}${icon}${RESET} ${duration}`;

        // Add error details if present
        if (entry.details && entry.details.error_message) {
            line += ` ${YELLOW}(${entry.details.error_message})${RESET}`;
        }

        console.log(line);
    } else if (entry.event_type === 'RouterDecision') {
        const matches = entry.matches || [];
        if (matches.length > 0) {
            const topMatch = matches[0];
            const duration = formatDuration(entry.duration_ms);
            console.log(`${DIM}[${time}]${RESET} ${BOLD}ROUTER${RESET} | ${entry.project_name}`);
            console.log(`  ${DIM}\u2514\u2500${RESET} Matched: ${BOLD}${topMatch.name}${RESET} (score: ${topMatch.score}) in ${duration}`);
            if (entry.cwd_extensions && entry.cwd_extensions.length > 0) {
                console.log(`     ${DIM}Context: ${entry.cwd_extensions.join(', ')}${RESET}`);
            }
        }
    } else if (entry.event_type === 'SkillInvocation') {
        console.log(`${DIM}[${time}]${RESET} ${BOLD}SKILL${RESET} | ${entry.skill_name}`);
        console.log(`  ${DIM}\u2514\u2500${RESET} Source: ${entry.source}`);
    }
}

/**
 * Display performance stats
 */
function displayStats() {
    console.log(`\n${BOLD}=== Performance (last 10min) ===${RESET}`);

    // Overall stats
    const errorRate = stats.total > 0 ? (stats.errors / stats.total) : 0;
    const errorRatePercent = Math.round(errorRate * 100);
    const errorColor = errorRate > ALERT_ERROR_RATE ? YELLOW : RESET;
    console.log(`Total events: ${stats.total} | Errors: ${errorColor}${stats.errors} (${errorRatePercent}%)${RESET}`);

    // By event type
    console.log(`\n${BOLD}By Event Type:${RESET}`);
    Object.entries(stats.byEventType).forEach(([eventType, data]) => {
        const avg = data.count > 0 ? Math.round(data.totalDuration / data.count) : 0;
        const avgColor = avg > ALERT_TIMEOUT_MS ? YELLOW : RESET;
        const errRate = data.count > 0 ? Math.round((data.errors / data.count) * 100) : 0;
        console.log(`  \u2022 ${eventType}: ${avgColor}${avg}ms avg${RESET} | ${data.count} events | ${errRate}% errors`);
    });

    // Top hooks by duration
    console.log(`\n${BOLD}Slowest Hooks:${RESET}`);
    const hooksSorted = Object.entries(stats.byHook)
        .map(([name, data]) => ({ name, avg: data.count > 0 ? data.totalDuration / data.count : 0 }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5);

    hooksSorted.forEach(({ name, avg }) => {
        const avgRounded = Math.round(avg);
        const color = avgRounded > ALERT_TIMEOUT_MS ? YELLOW : RESET;
        console.log(`  \u2022 ${name}: ${color}${avgRounded}ms${RESET}`);
    });

    console.log('');
}

/**
 * Main monitoring loop
 */
function main() {
    console.log(`${BOLD}=== Claude Code Log Monitor ===${RESET}`);
    console.log(`Monitoring: ${LOG_FILE}`);
    if (filters.session) console.log(`Filter: session=${filters.session}`);
    if (filters.project) console.log(`Filter: project=${filters.project}`);
    if (filters.eventType) console.log(`Filter: event=${filters.eventType}`);
    console.log('Press Ctrl+C to exit\n');

    // Check if log file exists
    if (!fs.existsSync(LOG_FILE)) {
        console.log(`${YELLOW}Warning: Log file not found. Waiting for first entry...${RESET}\n`);
    } else {
        // Read existing entries
        const content = fs.readFileSync(LOG_FILE, 'utf-8');
        const lines = content.trim().split('\n').filter(l => l.length > 0);

        // Display last 20 entries
        const recentLines = lines.slice(-20);
        recentLines.forEach(line => {
            try {
                const entry = JSON.parse(line);
                displayEntry(entry);
            } catch (e) {
                // Skip malformed lines
            }
        });

        if (recentLines.length > 0) {
            displayStats();
        }
    }

    // Watch for new entries
    let position = fs.existsSync(LOG_FILE) ? fs.statSync(LOG_FILE).size : 0;

    // Display stats every 30 seconds
    setInterval(() => {
        if (stats.total > 0) {
            displayStats();
        }
    }, 30000);

    // Tail the file
    fs.watchFile(LOG_FILE, { interval: 500 }, () => {
        try {
            const currentSize = fs.statSync(LOG_FILE).size;
            if (currentSize < position) {
                // File was truncated, reset
                position = 0;
            }

            if (currentSize > position) {
                const stream = fs.createReadStream(LOG_FILE, {
                    start: position,
                    end: currentSize
                });

                let buffer = '';
                stream.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // Keep incomplete line in buffer

                    lines.forEach(line => {
                        if (line.trim()) {
                            try {
                                const entry = JSON.parse(line);
                                displayEntry(entry);
                            } catch (e) {
                                console.error(`${YELLOW}[monitor] Failed to parse line: ${e.message}${RESET}`);
                            }
                        }
                    });
                });

                stream.on('end', () => {
                    position = currentSize;
                });
            }
        } catch (e) {
            // File might not exist yet, ignore
        }
    });

    // Keep process alive
    process.stdin.resume();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log(`\n${BOLD}=== Final Stats ===${RESET}`);
    displayStats();
    console.log('Monitoring stopped.');
    process.exit(0);
});

main();
