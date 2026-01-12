/**
 * Global Test Setup - Creates isolated test environment
 *
 * This file runs before all tests to:
 * - Mock os.homedir() to use temp directory
 * - Create unique test environment per run
 * - Cleanup after all tests complete
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

// Create unique temp dir for each test run
const TEST_RUN_ID = Date.now();
global.TEST_CLAUDE_HOME = path.join(os.tmpdir(), `test-claude-${TEST_RUN_ID}`);

console.log(`\n🧪 Test Environment: ${global.TEST_CLAUDE_HOME}\n`);

// Mock os.homedir() globally for all tests
const originalHomedir = os.homedir;
jest.spyOn(os, 'homedir').mockImplementation(() => {
  return global.TEST_CLAUDE_HOME;
});

// Create test directory structure
beforeAll(() => {
  const dirs = [
    path.join(global.TEST_CLAUDE_HOME, '.claude', 'logs'),
    path.join(global.TEST_CLAUDE_HOME, '.claude', 'configs'),
    path.join(global.TEST_CLAUDE_HOME, '.claude', 'routing-tracking'),
    path.join(global.TEST_CLAUDE_HOME, '.claude', 'memory-chunks'),
    path.join(global.TEST_CLAUDE_HOME, '.claude', 'compacted-summaries'),
    path.join(global.TEST_CLAUDE_HOME, '.claude', 'cache')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  console.log('✅ Test directories created');
});

// Cleanup after all tests
afterAll(() => {
  // Restore original homedir
  os.homedir = originalHomedir;

  // Delete test directory
  if (fs.existsSync(global.TEST_CLAUDE_HOME)) {
    try {
      fs.rmSync(global.TEST_CLAUDE_HOME, { recursive: true, force: true });
      console.log('\n✅ Test environment cleaned up\n');
    } catch (e) {
      console.warn(`⚠️  Could not clean up test directory: ${e.message}`);
    }
  }
});

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});

// Suppress console output during tests (unless verbose)
if (!process.env.VERBOSE) {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  };
}
