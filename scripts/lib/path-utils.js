#!/usr/bin/env node
/**
 * Path Utilities - Path encoding for project registry.
 *
 * Pattern from project-registry.py for Windows drive letter encoding.
 * Used to create safe filesystem names from full paths.
 */

const path = require('path');

/**
 * Encode path for use as filename/identifier.
 * Converts C:\Users\julien → C-Users-julien
 *
 * @param {string} p - Path to encode
 * @returns {string} Encoded path safe for filenames
 */
function encodePath(p) {
    // Normalize to forward slashes
    let normalized = p.replace(/\\/g, '/');

    // Replace drive letter colon
    normalized = normalized.replace(/:/g, '-');

    // Remove leading/trailing slashes
    normalized = normalized.replace(/^\/+|\/+$/g, '');

    return normalized;
}

/**
 * Decode path from encoded form.
 * Converts C-Users-julien → C:/Users/julien
 *
 * Note: Windows drive letters are restored with colon.
 * Result uses forward slashes (cross-platform).
 *
 * @param {string} encoded - Encoded path
 * @returns {string} Decoded path with forward slashes
 */
function decodePath(encoded) {
    // Check if starts with drive letter pattern (e.g., C-, D-)
    const driveMatch = encoded.match(/^([A-Z])-/);

    if (driveMatch) {
        // Restore drive letter with colon
        const driveLetter = driveMatch[1];
        const rest = encoded.slice(2); // Skip "C-"
        return `${driveLetter}:/${rest}`;
    }

    // Not a Windows path, just return as-is
    return encoded;
}

/**
 * Get platform-specific path separator.
 *
 * @returns {string} Path separator ('/' or '\\')
 */
function getPathSeparator() {
    return path.sep;
}

/**
 * Normalize path to use forward slashes.
 * Cross-platform safe.
 *
 * @param {string} p - Path to normalize
 * @returns {string} Path with forward slashes
 */
function normalizePath(p) {
    return p.replace(/\\/g, '/');
}

/**
 * Check if path is Windows absolute path.
 *
 * @param {string} p - Path to check
 * @returns {boolean} True if Windows absolute path
 */
function isWindowsAbsolutePath(p) {
    return /^[A-Z]:[/\\]/.test(p);
}

/**
 * Check if path is UNC path.
 *
 * @param {string} p - Path to check
 * @returns {boolean} True if UNC path
 */
function isUNCPath(p) {
    return /^\\\\/.test(p);
}

/**
 * Join path components (cross-platform safe).
 *
 * @param {...string} parts - Path parts to join
 * @returns {string} Joined path
 */
function joinPath(...parts) {
    return path.join(...parts);
}

/**
 * Get basename from path.
 *
 * @param {string} p - Path
 * @param {string} ext - Optional extension to remove
 * @returns {string} Basename
 */
function basename(p, ext) {
    return path.basename(p, ext);
}

/**
 * Get directory name from path.
 *
 * @param {string} p - Path
 * @returns {string} Directory name
 */
function dirname(p) {
    return path.dirname(p);
}

/**
 * Get file extension.
 *
 * @param {string} p - Path
 * @returns {string} Extension including dot
 */
function extname(p) {
    return path.extname(p);
}

/**
 * Check if path is absolute.
 *
 * @param {string} p - Path
 * @returns {boolean} True if absolute
 */
function isAbsolute(p) {
    return path.isAbsolute(p);
}

module.exports = {
    encodePath,
    decodePath,
    getPathSeparator,
    normalizePath,
    isWindowsAbsolutePath,
    isUNCPath,
    joinPath,
    basename,
    dirname,
    extname,
    isAbsolute
};
