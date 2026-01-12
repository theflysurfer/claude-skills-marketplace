#!/usr/bin/env node
/**
 * Set Windows Terminal tab title to current folder name.
 *
 * Outputs ANSI escape sequence to set terminal title.
 * Works with Windows Terminal, ConEmu, etc.
 *
 * Pattern from set-terminal-title.py
 */

const path = require('path');

/**
 * Generate ANSI escape sequence for setting terminal title.
 *
 * @param {string} folderName - The folder name to display
 * @returns {string} ANSI escape sequence
 */
function getANSIEscapeSequence(folderName) {
    // ANSI escape sequence: ESC ] 0 ; <title> BEL
    // \x1b = ESC (033 octal)
    // \x07 = BEL (007 octal)
    return `\x1b]0;${folderName}\x07`;
}

/**
 * Set terminal title to current folder name.
 */
function setTitle() {
    const cwd = process.cwd();
    const folderName = path.basename(cwd);
    const escapeSequence = getANSIEscapeSequence(folderName);

    process.stdout.write(escapeSequence);
}

// CLI wrapper
/* istanbul ignore next */
function main() {
    setTitle();
}

/* istanbul ignore next */
if (require.main === module) {
    main();
}

module.exports = { setTitle, getANSIEscapeSequence };
