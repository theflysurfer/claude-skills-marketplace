#!/usr/bin/env node
/**
 * Test Unified Logging - Generate sample log entries for testing monitoring dashboard
 */

const path = require('path');
const libDir = path.join(__dirname, 'lib');
const unifiedLogger = require(path.join(libDir, 'unified-logger.js'));

console.log('Generating test log entries...\n');

// Simulate SessionStart event
console.log('1. Simulating SessionStart...');
const sessionStartTime = unifiedLogger.logHookStart('SessionStart', 'test-session-start', 'test');
setTimeout(() => {
    unifiedLogger.logHookEnd('SessionStart', 'test-session-start', sessionStartTime, 'success', {
        test_mode: true
    });
    console.log('   ✓ SessionStart completed (100ms)\n');

    // Simulate UserPromptSubmit (fast-skill-router)
    console.log('2. Simulating UserPromptSubmit (fast routing)...');
    const routerStartTime = unifiedLogger.logHookStart('UserPromptSubmit', 'test-fast-router', 'test');
    setTimeout(() => {
        unifiedLogger.logRouterDecision(
            'create an excel file with sales data',
            [
                { name: 'anthropic-office-xlsx', score: 2.5, source: 'keyword' },
                { name: 'anthropic-office-docx', score: 0.4, source: 'keyword' }
            ],
            { '.xlsx': 5, '.csv': 2 },
            8
        );
        unifiedLogger.logHookEnd('UserPromptSubmit', 'test-fast-router', routerStartTime, 'success');
        console.log('   ✓ Routing completed (8ms)\n');

        // Simulate PostToolUse (skill invocation)
        console.log('3. Simulating PostToolUse (skill invocation)...');
        const toolUseStartTime = unifiedLogger.logHookStart('PostToolUse', 'test-track-invocation', 'test');
        unifiedLogger.logSkillInvocation('anthropic-office-xlsx', { test: true }, 'router');
        unifiedLogger.logHookEnd('PostToolUse', 'test-track-invocation', toolUseStartTime, 'success', {
            skill_name: 'anthropic-office-xlsx'
        });
        console.log('   ✓ Skill invocation tracked (2ms)\n');

        // Simulate a slow event (should trigger alert)
        console.log('4. Simulating slow event (>5s)...');
        const slowStartTime = unifiedLogger.logHookStart('SessionStart', 'test-slow-hook', 'test');
        setTimeout(() => {
            unifiedLogger.logHookEnd('SessionStart', 'test-slow-hook', slowStartTime, 'timeout', {
                error_message: 'spawnSync ETIMEDOUT'
            });
            console.log('   ⚠️  Slow event completed (6000ms)\n');

            // Simulate an error
            console.log('5. Simulating error event...');
            const errorStartTime = unifiedLogger.logHookStart('UserPromptSubmit', 'test-error-hook', 'test');
            unifiedLogger.logHookEnd('UserPromptSubmit', 'test-error-hook', errorStartTime, 'error', {
                error_message: 'Test error for demonstration'
            });
            console.log('   ✗ Error event logged\n');

            console.log('✅ All test events generated!');
            console.log('\nNow run: node scripts/core/log-monitor.js');
            console.log('Or with filters: node scripts/core/log-monitor.js --project="2025.11 Claude Code MarketPlace"');
        }, 6000);
    }, 8);
}, 100);
