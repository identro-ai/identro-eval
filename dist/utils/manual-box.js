"use strict";
/**
 * Manual Box Drawing Utilities
 *
 * Provides manual ASCII box drawing with exact dimension control.
 * Works reliably with any package versions since we control every character.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.drawBox = drawBox;
exports.padLinesToWidth = padLinesToWidth;
const chalk_1 = __importDefault(require("chalk"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const BORDER_CHARS = {
    round: {
        topLeft: '╭',
        topRight: '╮',
        bottomLeft: '╰',
        bottomRight: '╯',
        horizontal: '─',
        vertical: '│',
    },
    single: {
        topLeft: '┌',
        topRight: '┐',
        bottomLeft: '└',
        bottomRight: '┘',
        horizontal: '─',
        vertical: '│',
    },
    double: {
        topLeft: '╔',
        topRight: '╗',
        bottomLeft: '╚',
        bottomRight: '╝',
        horizontal: '═',
        vertical: '║',
    },
};
/**
 * Draw a box with exact dimensions
 */
function drawBox(content, width, height, options = {}) {
    const { borderStyle = 'round', borderColor = 'gray', padding = 0, } = options;
    const chars = BORDER_CHARS[borderStyle];
    const colorFn = getColorFunction(borderColor);
    // Content area dimensions (excluding borders)
    const contentWidth = width - 2; // -2 for left and right borders
    const contentHeight = height - 2; // -2 for top and bottom borders
    // Split content into lines
    const contentLines = content.split('\n');
    // Build the box
    const lines = [];
    // Top border
    lines.push(colorFn(chars.topLeft + chars.horizontal.repeat(contentWidth) + chars.topRight));
    // Content lines with side borders
    for (let i = 0; i < contentHeight; i++) {
        const contentLine = contentLines[i] || '';
        // Calculate display length (without ANSI codes)
        const displayLength = (0, strip_ansi_1.default)(contentLine).length;
        // Pad or truncate to exact width
        let paddedContent;
        if (displayLength > contentWidth) {
            // Truncate while preserving ANSI codes
            paddedContent = truncateWithAnsi(contentLine, contentWidth);
        }
        else {
            // Pad to exact width
            const paddingNeeded = contentWidth - displayLength;
            paddedContent = contentLine + ' '.repeat(paddingNeeded);
        }
        lines.push(colorFn(chars.vertical) + paddedContent + colorFn(chars.vertical));
    }
    // Bottom border
    lines.push(colorFn(chars.bottomLeft + chars.horizontal.repeat(contentWidth) + chars.bottomRight));
    return lines.join('\n');
}
/**
 * Truncate string while preserving ANSI codes
 */
function truncateWithAnsi(str, maxLength) {
    let result = '';
    let visibleLength = 0;
    let inEscapeSeq = false;
    for (let i = 0; i < str.length && visibleLength < maxLength; i++) {
        const char = str[i];
        if (char === '\x1b') {
            inEscapeSeq = true;
        }
        result += char;
        if (!inEscapeSeq) {
            visibleLength++;
        }
        if (inEscapeSeq && char === 'm') {
            inEscapeSeq = false;
        }
    }
    return result;
}
/**
 * Get chalk color function for border color
 */
function getColorFunction(color) {
    switch (color) {
        case 'yellow':
            return chalk_1.default.yellow;
        case 'green':
            return chalk_1.default.green;
        case 'red':
            return chalk_1.default.red;
        case 'cyan':
            return chalk_1.default.cyan;
        case 'gray':
        default:
            return chalk_1.default.gray;
    }
}
/**
 * Pad lines to exact width, accounting for ANSI codes
 */
function padLinesToWidth(lines, width) {
    return lines.map(line => {
        const displayLength = (0, strip_ansi_1.default)(line).length;
        if (displayLength < width) {
            return line + ' '.repeat(width - displayLength);
        }
        else if (displayLength > width) {
            return truncateWithAnsi(line, width);
        }
        return line;
    });
}
//# sourceMappingURL=manual-box.js.map