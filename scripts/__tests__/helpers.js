/**
 * Test Helpers - Utilities for testing CLI hooks
 *
 * Provides functions to:
 * - Execute hook scripts with stdin input
 * - Create mock file structures
 * - Verify test outputs
 */

const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Execute a hook script with stdin input
 *
 * @param {string} scriptName - Name of the script (e.g., 'track-skill-invocation.js')
 * @param {object} inputData - JSON data to send via stdin
 * @param {object} options - Additional options (env, timeout, etc.)
 * @returns {Promise<{error, stdout, stderr, exitCode}>}
 */
function execScriptWithStdin(scriptName, inputData, options = {}) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, '..', scriptName);

    const execOptions = {
      timeout: options.timeout || 10000,
      env: { ...process.env, ...options.env }
    };

    const proc = execFile('node', [scriptPath], execOptions, (error, stdout, stderr) => {
      resolve({
        error,
        stdout,
        stderr,
        exitCode: error ? error.code : 0
      });
    });

    // Send JSON data to stdin
    if (inputData) {
      proc.stdin.write(JSON.stringify(inputData));
    }
    proc.stdin.end();
  });
}

/**
 * Execute a hook script without stdin
 *
 * @param {string} scriptName - Name of the script
 * @param {object} options - Additional options
 * @returns {Promise<{error, stdout, stderr, exitCode}>}
 */
function execScript(scriptName, options = {}) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, '..', scriptName);

    const execOptions = {
      timeout: options.timeout || 10000,
      env: { ...process.env, ...options.env }
    };

    execFile('node', [scriptPath], execOptions, (error, stdout, stderr) => {
      resolve({
        error,
        stdout,
        stderr,
        exitCode: error ? error.code : 0
      });
    });
  });
}

/**
 * Create mock file structure in test environment
 *
 * @param {object} structure - File paths mapped to contents
 *   Example: {
 *     'configs/hybrid-registry.json': '{"skills": {}}',
 *     'logs/hooks-debug.log': ''
 *   }
 */
function createMockFiles(structure) {
  Object.keys(structure).forEach(filePath => {
    const fullPath = path.join(global.TEST_CLAUDE_HOME, '.claude', filePath);
    const dir = path.dirname(fullPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file content
    fs.writeFileSync(fullPath, structure[filePath], 'utf-8');
  });
}

/**
 * Read a file from test environment
 *
 * @param {string} filePath - Relative path from ~/.claude/
 * @returns {string|null} - File contents or null if not exists
 */
function readTestFile(filePath) {
  const fullPath = path.join(global.TEST_CLAUDE_HOME, '.claude', filePath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Check if a file exists in test environment
 *
 * @param {string} filePath - Relative path from ~/.claude/
 * @returns {boolean}
 */
function testFileExists(filePath) {
  const fullPath = path.join(global.TEST_CLAUDE_HOME, '.claude', filePath);
  return fs.existsSync(fullPath);
}

/**
 * Delete a file from test environment
 *
 * @param {string} filePath - Relative path from ~/.claude/
 */
function deleteTestFile(filePath) {
  const fullPath = path.join(global.TEST_CLAUDE_HOME, '.claude', filePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

/**
 * Create a mock transcript file (JSONL format)
 *
 * @param {string} filePath - Relative path from ~/.claude/
 * @param {array} entries - Array of transcript entries
 */
function createMockTranscript(filePath, entries) {
  const fullPath = path.join(global.TEST_CLAUDE_HOME, '.claude', filePath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const jsonl = entries.map(entry => JSON.stringify(entry)).join('\n');
  fs.writeFileSync(fullPath, jsonl, 'utf-8');
}

/**
 * Parse JSONL file from test environment
 *
 * @param {string} filePath - Relative path from ~/.claude/
 * @returns {array} - Array of parsed JSON objects
 */
function parseTestJSONL(filePath) {
  const content = readTestFile(filePath);

  if (!content) {
    return [];
  }

  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    })
    .filter(entry => entry !== null);
}

/**
 * Wait for a condition to be true (polling)
 *
 * @param {function} condition - Function that returns boolean
 * @param {number} timeout - Max wait time in ms
 * @param {number} interval - Check interval in ms
 * @returns {Promise<boolean>}
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return false;
}

/**
 * Get debug log entries for a specific hook
 *
 * @param {string} hookName - Hook name (e.g., 'SessionStart')
 * @param {string} scriptName - Script name (e.g., 'session-start-banner.js')
 * @returns {array} - Array of log line objects
 */
function getDebugLogs(hookName = null, scriptName = null) {
  const logContent = readTestFile('logs/hooks-debug.log');

  if (!logContent) {
    return [];
  }

  return logContent
    .split('\n')
    .filter(line => line.trim())
    .filter(line => {
      if (hookName && !line.includes(`[${hookName}]`)) {
        return false;
      }
      if (scriptName && !line.includes(`[${scriptName}]`)) {
        return false;
      }
      return true;
    })
    .map(line => {
      // Parse: [timestamp] [hookName] [scriptName] [level] message
      const match = line.match(/\[(.*?)\] \[(.*?)\] \[(.*?)\] \[(.*?)\] (.+)/);
      if (match) {
        return {
          timestamp: match[1],
          hook: match[2],
          script: match[3],
          level: match[4],
          message: match[5]
        };
      }
      return null;
    })
    .filter(entry => entry !== null);
}

module.exports = {
  execScriptWithStdin,
  execScript,
  createMockFiles,
  readTestFile,
  testFileExists,
  deleteTestFile,
  createMockTranscript,
  parseTestJSONL,
  waitFor,
  getDebugLogs
};
