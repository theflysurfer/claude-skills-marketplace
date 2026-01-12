#!/usr/bin/env node
/**
 * File Utilities - Common file operations for discovery scripts.
 *
 * Provides async file operations, hash computation, and path expansion.
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

/**
 * Read and parse JSON file.
 *
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<object>} Parsed JSON data
 */
async function readJson(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        if (e.code === 'ENOENT') {
            return null; // File doesn't exist
        }
        throw e;
    }
}

/**
 * Write JSON data to file with pretty formatting.
 *
 * @param {string} filePath - Path to write to
 * @param {object} data - Data to write
 * @param {number} indent - Indentation spaces (default: 2)
 * @returns {Promise<void>}
 */
async function writeJson(filePath, data, indent = 2) {
    const json = JSON.stringify(data, null, indent);
    await fs.writeFile(filePath, json + '\n', 'utf-8');
}

/**
 * Compute SHA256 hash of content.
 * Pattern from discover-skills.py lines 141-143.
 *
 * @param {string} content - Content to hash
 * @returns {string} First 16 characters of SHA256 hex digest
 */
function computeHash(content) {
    return crypto.createHash('sha256')
        .update(content, 'utf-8')
        .digest('hex')
        .slice(0, 16);
}

/**
 * Expand path with ~ and resolve to absolute path.
 * Pattern from discover-skills.py lines 146-148.
 *
 * @param {string} p - Path to expand
 * @returns {string} Absolute path
 */
function expandPath(p) {
    if (p.startsWith('~')) {
        return path.resolve(p.replace(/^~/, os.homedir()));
    }
    return path.resolve(p);
}

/**
 * Check if file exists.
 *
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if file exists
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if directory exists.
 *
 * @param {string} dirPath - Path to check
 * @returns {Promise<boolean>} True if directory exists
 */
async function dirExists(dirPath) {
    try {
        const stats = await fs.stat(dirPath);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

/**
 * Read file content.
 *
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} File content
 */
async function readFile(filePath) {
    return await fs.readFile(filePath, 'utf-8');
}

/**
 * Write file content.
 *
 * @param {string} filePath - Path to file
 * @param {string} content - Content to write
 * @returns {Promise<void>}
 */
async function writeFile(filePath, content) {
    await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Ensure directory exists, create if not.
 *
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function ensureDir(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (e) {
        if (e.code !== 'EEXIST') {
            throw e;
        }
    }
}

/**
 * Get file stats.
 *
 * @param {string} filePath - Path to file
 * @returns {Promise<object>} File stats or null if not found
 */
async function getStats(filePath) {
    try {
        return await fs.stat(filePath);
    } catch {
        return null;
    }
}

/**
 * Synchronously check if file exists.
 * Use only when async is not possible.
 *
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file exists
 */
function fileExistsSync(filePath) {
    try {
        fsSync.accessSync(filePath);
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    readJson,
    writeJson,
    computeHash,
    expandPath,
    fileExists,
    dirExists,
    readFile,
    writeFile,
    ensureDir,
    getStats,
    fileExistsSync
};
