#!/usr/bin/env node
/**
 * Routing Stats - Analyze router performance from logs.
 *
 * Reads routing-history.jsonl and near-misses.jsonl to generate
 * performance metrics and identify trigger gaps.
 *
 * Usage:
 *   node routing-stats.js              # Full report
 *   node routing-stats.js --json       # JSON output
 *   node routing-stats.js --summary    # Quick summary only
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const ROUTING_HISTORY = path.join(CLAUDE_HOME, 'cache', 'routing-history.jsonl');
const NEAR_MISSES = path.join(CLAUDE_HOME, 'cache', 'near-misses.jsonl');

function loadJsonl(filePath) {
    if (!fs.existsSync(filePath)) return [];
    return fs.readFileSync(filePath, 'utf-8')
        .split('\n')
        .filter(l => l.trim())
        .map(l => {
            try { return JSON.parse(l); }
            catch { return null; }
        })
        .filter(Boolean);
}

function analyzeHistory(entries) {
    const stats = {
        total: entries.length,
        matches: 0,
        noMatch: 0,
        highConfidence: 0,
        lowConfidence: 0,
        totalTime: 0,
        skillHits: {},
        byDay: {},
        avgConfidence: 0
    };

    let confidenceSum = 0;
    let confidenceCount = 0;

    for (const entry of entries) {
        stats.totalTime += entry.elapsed_ms || 0;

        // Extract day for daily stats
        const day = entry.timestamp?.split('T')[0] || 'unknown';
        stats.byDay[day] = stats.byDay[day] || { matches: 0, noMatch: 0 };

        if (entry.matches && entry.matches.length > 0) {
            stats.matches++;
            stats.byDay[day].matches++;

            const top = entry.matches[0];
            stats.skillHits[top.name] = (stats.skillHits[top.name] || 0) + 1;

            if (top.confidence >= 50) {
                stats.highConfidence++;
            } else {
                stats.lowConfidence++;
            }

            confidenceSum += top.confidence || 0;
            confidenceCount++;
        } else {
            stats.noMatch++;
            stats.byDay[day].noMatch++;
        }
    }

    stats.matchRate = stats.total > 0 ? (stats.matches / stats.total * 100) : 0;
    stats.avgTime = stats.total > 0 ? (stats.totalTime / stats.total) : 0;
    stats.avgConfidence = confidenceCount > 0 ? (confidenceSum / confidenceCount) : 0;

    return stats;
}

function analyzeNearMisses(entries) {
    const stats = {
        total: entries.length,
        bySkill: {},
        avgGap: {}
    };

    for (const entry of entries) {
        if (!entry.near_misses) continue;

        for (const nm of entry.near_misses) {
            stats.bySkill[nm.name] = (stats.bySkill[nm.name] || 0) + 1;
            stats.avgGap[nm.name] = stats.avgGap[nm.name] || { sum: 0, count: 0 };
            stats.avgGap[nm.name].sum += nm.gap_to_threshold;
            stats.avgGap[nm.name].count++;
        }
    }

    // Calculate averages
    for (const skill of Object.keys(stats.avgGap)) {
        const data = stats.avgGap[skill];
        stats.avgGap[skill] = data.count > 0 ? (data.sum / data.count) : 0;
    }

    return stats;
}

function printReport(historyStats, nearMissStats) {
    console.log('');
    console.log('='.repeat(70));
    console.log('                    ROUTING PERFORMANCE REPORT');
    console.log('='.repeat(70));

    // Overall stats
    console.log('\n## OVERALL STATS\n');
    console.log(`Total routings:      ${historyStats.total}`);
    console.log(`Match rate:          ${historyStats.matchRate.toFixed(1)}% (${historyStats.matches} matches)`);
    console.log(`No match:            ${(100 - historyStats.matchRate).toFixed(1)}% (${historyStats.noMatch} prompts)`);
    console.log(`High confidence:     ${historyStats.highConfidence} (>= 50%)`);
    console.log(`Low confidence:      ${historyStats.lowConfidence} (< 50%)`);
    console.log(`Avg confidence:      ${historyStats.avgConfidence.toFixed(1)}%`);
    console.log(`Avg response time:   ${historyStats.avgTime.toFixed(1)}ms`);

    // Top matched skills
    console.log('\n## TOP MATCHED SKILLS\n');
    const topSkills = Object.entries(historyStats.skillHits)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    if (topSkills.length === 0) {
        console.log('  (no matches recorded)');
    } else {
        for (const [skill, count] of topSkills) {
            const pct = (count / historyStats.matches * 100).toFixed(1);
            console.log(`  ${count.toString().padStart(4)}x  ${skill.padEnd(45)} (${pct}%)`);
        }
    }

    // Near misses (trigger gaps)
    console.log('\n## NEAR-MISSES (Trigger Gaps)\n');
    console.log('Skills that almost matched (score 0.10-0.24) - need better triggers:\n');

    const topNearMisses = Object.entries(nearMissStats.bySkill)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    if (topNearMisses.length === 0) {
        console.log('  (no near-misses recorded)');
    } else {
        for (const [skill, count] of topNearMisses) {
            const avgGap = nearMissStats.avgGap[skill]?.toFixed(0) || '?';
            console.log(`  ${count.toString().padStart(4)}x  ${skill.padEnd(45)} (avg gap: ${avgGap}%)`);
        }
    }

    // Daily trend
    console.log('\n## DAILY TREND (last 7 days)\n');
    const days = Object.entries(historyStats.byDay)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 7);

    if (days.length === 0) {
        console.log('  (no daily data)');
    } else {
        console.log('  Date         Matches   No Match   Rate');
        console.log('  ' + '-'.repeat(50));
        for (const [day, data] of days) {
            const total = data.matches + data.noMatch;
            const rate = total > 0 ? (data.matches / total * 100).toFixed(1) : 0;
            console.log(`  ${day}   ${data.matches.toString().padStart(7)}   ${data.noMatch.toString().padStart(8)}   ${rate}%`);
        }
    }

    // Recommendations
    console.log('\n## RECOMMENDATIONS\n');

    if (historyStats.matchRate < 30) {
        console.log('  [!] Match rate is very low (<30%)');
        console.log('      -> Consider lowering MIN_SCORE threshold in fast-skill-router.js');
        console.log('      -> Add more triggers to frequently used skills');
    }

    if (topNearMisses.length > 5) {
        console.log('  [!] Many near-misses detected');
        console.log('      -> Skills with frequent near-misses need better triggers:');
        topNearMisses.slice(0, 3).forEach(([skill]) => {
            console.log(`         - ${skill}`);
        });
    }

    if (historyStats.avgTime > 50) {
        console.log('  [!] Average routing time is high (>50ms)');
        console.log('      -> Consider optimizing keyword index or reducing skill count');
    }

    console.log('\n' + '='.repeat(70));
}

function main() {
    const args = process.argv.slice(2);
    const jsonOutput = args.includes('--json');
    const summaryOnly = args.includes('--summary');

    // Load data
    const historyEntries = loadJsonl(ROUTING_HISTORY);
    const nearMissEntries = loadJsonl(NEAR_MISSES);

    // Analyze
    const historyStats = analyzeHistory(historyEntries);
    const nearMissStats = analyzeNearMisses(nearMissEntries);

    if (jsonOutput) {
        console.log(JSON.stringify({
            history: historyStats,
            nearMisses: nearMissStats
        }, null, 2));
    } else if (summaryOnly) {
        console.log(`Match rate: ${historyStats.matchRate.toFixed(1)}% | Avg time: ${historyStats.avgTime.toFixed(1)}ms | Near-misses: ${nearMissStats.total}`);
    } else {
        printReport(historyStats, nearMissStats);
    }
}

main();
