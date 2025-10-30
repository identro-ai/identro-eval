"use strict";
/**
 * Activity Feed
 *
 * Manages a scrolling feed of test execution events for the CLI UI.
 * Displays narrative-driven, LLM-generated descriptions of test progress.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityFeed = void 0;
const chalk_1 = __importDefault(require("chalk"));
const manual_box_1 = require("./manual-box");
class ActivityFeed {
    constructor() {
        this.entries = [];
        this.maxEntries = 25;
        this.entryIdCounter = 0;
    }
    /**
     * Wrap text to fit within a maximum width
     * Returns array of lines WITHOUT adding indent (caller handles that)
     */
    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length <= maxWidth) {
                currentLine = testLine;
            }
            else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines;
    }
    /**
     * Add a new entry to the feed
     */
    addEntry(entry) {
        const newEntry = {
            ...entry,
            id: `feed-${Date.now()}-${++this.entryIdCounter}`,
            timestamp: new Date(),
        };
        // Add to end of array (chronological order - oldest first)
        this.entries.push(newEntry);
        // Trim from beginning to keep most recent entries
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(-this.maxEntries);
        }
    }
    /**
     * Get recent entries (chronological order - oldest first)
     */
    getRecentEntries(count) {
        if (count) {
            return this.entries.slice(-count);
        }
        return [...this.entries];
    }
    /**
     * Clear all entries
     */
    clear() {
        this.entries = [];
        this.entryIdCounter = 0;
    }
    /**
     * Render the activity feed as formatted text
     * Simple rendering - show all recent entries, allow top to be cut off
     */
    render(width, height) {
        const allLines = [];
        // Header (always included)
        allLines.push(chalk_1.default.bold.white('FEED'));
        allLines.push(chalk_1.default.gray('━'.repeat(width - 4)));
        // Render all recent entries (newest at bottom)
        for (const entry of this.entries) {
            const entryLines = this.renderFeedEntry(entry, width - 4);
            allLines.push(...entryLines);
            allLines.push(''); // Spacing between entries
        }
        // Calculate how many lines we need (account for boxen borders)
        const contentHeight = height - 2; // -2 for boxen's top and bottom borders
        // Build final content array with exact height
        const finalLines = [];
        if (allLines.length <= contentHeight) {
            // All content fits - use it all and pad
            finalLines.push(...allLines);
            while (finalLines.length < contentHeight) {
                finalLines.push('');
            }
        }
        else {
            // Too much content - keep header and most recent entries
            finalLines.push(allLines[0]); // FEED header
            finalLines.push(allLines[1]); // separator
            // Calculate how many content lines we can show
            const availableForEntries = contentHeight - 2; // -2 for header lines
            // Take last N lines (newest entries)
            const startIndex = allLines.length - availableForEntries;
            finalLines.push(...allLines.slice(startIndex));
        }
        // Use manual box drawing for exact dimensions
        return (0, manual_box_1.drawBox)(finalLines.join('\n'), width, height, {
            borderStyle: 'round',
            borderColor: 'gray',
        });
    }
    /**
     * Render a single feed entry
     */
    renderFeedEntry(entry, maxWidth) {
        const lines = [];
        const timestamp = this.formatTimestamp(entry.timestamp);
        switch (entry.type) {
            case 'test_start':
                {
                    const icon = chalk_1.default.cyan('▶');
                    const agentStr = chalk_1.default.white(entry.agentName);
                    const dimStr = chalk_1.default.cyan(entry.dimension);
                    // Format: agent_name > dimension [PARENT_ID - Run X] or [TEST_ID]
                    let testIdDisplay = '';
                    if (entry.data.runNumber && entry.data.parentTestId) {
                        // Multi-run test: show "PARENT_ID - Run X"
                        const parentId = this.shortenTestId(entry.data.parentTestId);
                        testIdDisplay = chalk_1.default.magenta(`[${parentId} - Run ${entry.data.runNumber}]`);
                    }
                    else {
                        // Single test: show just TEST_ID
                        const testId = this.shortenTestId(entry.testId);
                        testIdDisplay = chalk_1.default.magenta(`[${testId}]`);
                    }
                    lines.push(`${chalk_1.default.dim(timestamp)} ${icon} ${agentStr} ${chalk_1.default.dim('>')} ${dimStr} ${testIdDisplay}`);
                    // ALWAYS prefix with "Testing:" and ONLY show if description exists
                    if (entry.data.description) {
                        const desc = entry.data.description.startsWith('Testing:')
                            ? entry.data.description
                            : `Testing: ${entry.data.description}`;
                        // Wrap long descriptions
                        const wrapped = this.wrapText(desc, maxWidth - 6);
                        wrapped.forEach((line, index) => {
                            // All lines use same indent
                            lines.push(`      ${chalk_1.default.gray(line)}`);
                        });
                    }
                }
                break;
            case 'test_progress':
                {
                    const icon = chalk_1.default.cyan('▶');
                    const agentStr = chalk_1.default.white(entry.agentName);
                    const dimStr = chalk_1.default.cyan(entry.dimension);
                    let testIdDisplay = '';
                    if (entry.data.runNumber && entry.data.parentTestId) {
                        const parentId = this.shortenTestId(entry.data.parentTestId);
                        testIdDisplay = chalk_1.default.magenta(`[${parentId} - Run ${entry.data.runNumber}]`);
                    }
                    else {
                        const testId = this.shortenTestId(entry.testId);
                        testIdDisplay = chalk_1.default.magenta(`[${testId}]`);
                    }
                    lines.push(`${chalk_1.default.dim(timestamp)} ${icon} ${agentStr} ${chalk_1.default.dim('>')} ${dimStr} ${testIdDisplay}`);
                    if (entry.data.progress) {
                        lines.push(`      ${chalk_1.default.yellow(entry.data.progress)}`);
                    }
                }
                break;
            case 'eval_start':
                {
                    const icon = chalk_1.default.magenta('◆');
                    const agentStr = chalk_1.default.white(entry.agentName);
                    const dimStr = chalk_1.default.cyan(entry.dimension);
                    // Parent tests show just [TEST_ID]
                    const testId = this.shortenTestId(entry.testId);
                    const testIdDisplay = chalk_1.default.magenta(`[${testId}]`);
                    lines.push(`${chalk_1.default.dim(timestamp)} ${icon} ${agentStr} ${chalk_1.default.dim('>')} ${dimStr} ${testIdDisplay}`);
                    // ALWAYS prefix with "Testing:" and ONLY show if description exists
                    if (entry.data.description) {
                        const desc = entry.data.description.startsWith('Testing:')
                            ? entry.data.description
                            : `Testing: ${entry.data.description}`;
                        // Wrap long descriptions
                        const wrapped = this.wrapText(desc, maxWidth - 6);
                        wrapped.forEach((line) => {
                            // All lines use same indent
                            lines.push(`      ${chalk_1.default.gray(line)}`);
                        });
                    }
                    // Add evaluation status line
                    lines.push(`      ${chalk_1.default.dim('Test execution completed, now evaluating')}`);
                }
                break;
            case 'test_result':
                {
                    const isPassed = entry.data.result === 'passed';
                    // Use simple ✓/✗ icons like left pane
                    const icon = isPassed ? chalk_1.default.green('✓') : chalk_1.default.red('✗');
                    const agentStr = chalk_1.default.white(entry.agentName);
                    const dimStr = chalk_1.default.cyan(entry.dimension);
                    // Parent tests show just [TEST_ID]
                    const testId = this.shortenTestId(entry.testId);
                    const testIdDisplay = chalk_1.default.magenta(`[${testId}]`);
                    lines.push(`${chalk_1.default.dim(timestamp)} ${icon} ${agentStr} ${chalk_1.default.dim('>')} ${dimStr} ${testIdDisplay}`);
                    // ALWAYS prefix with "Testing:" and ONLY show if description exists
                    if (entry.data.description) {
                        const desc = entry.data.description.startsWith('Testing:')
                            ? entry.data.description
                            : `Testing: ${entry.data.description}`;
                        // Wrap long descriptions
                        const wrapped = this.wrapText(desc, maxWidth - 6);
                        wrapped.forEach((line) => {
                            // All lines use same indent
                            lines.push(`      ${chalk_1.default.gray(line)}`);
                        });
                    }
                    // Result line - ONLY show if we have explanation OR failedCriterion (prevents empty results)
                    if (entry.data.explanation || entry.data.failedCriterion) {
                        const resultText = isPassed ? 'PASSED' : 'FAILED';
                        const scoreText = entry.data.score !== undefined ? ` (${entry.data.score}/100)` : '';
                        const resultColor = isPassed ? chalk_1.default.green : chalk_1.default.red;
                        lines.push(`      ${resultColor(`Result: ${resultText}${scoreText}`)}`);
                        // Show explanation ONLY if it exists (NO fallbacks) - wrap if needed
                        if (entry.data.explanation) {
                            const wrapped = this.wrapText(entry.data.explanation, maxWidth - 6);
                            wrapped.forEach((line) => {
                                // All lines use same indent
                                lines.push(`      ${chalk_1.default.gray(line)}`);
                            });
                        }
                        // Failed criterion (for failures only) - wrap if needed
                        if (!isPassed && entry.data.failedCriterion) {
                            const failText = `Failed: ${entry.data.failedCriterion}`;
                            const wrapped = this.wrapText(failText, maxWidth - 6);
                            wrapped.forEach((line) => {
                                // All lines use same indent
                                lines.push(`      ${chalk_1.default.red(line)}`);
                            });
                        }
                    }
                }
                break;
        }
        return lines;
    }
    /**
     * Format timestamp as HH:MM
     */
    formatTimestamp(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    /**
     * Shorten test ID for display
     * e.g., "test-1234567890-1" -> "T0.1"
     */
    shortenTestId(testId) {
        // Extract counter from test ID (e.g., "test-1234567890-5" -> 5)
        const match = testId.match(/-(\d+)$/);
        if (match) {
            const counter = parseInt(match[1], 10);
            // For multi-run tests with "-run" suffix
            if (testId.includes('-run')) {
                const runMatch = testId.match(/-run(\d+)$/);
                if (runMatch) {
                    const runNumber = parseInt(runMatch[1], 10);
                    const baseCounter = counter;
                    return `T${baseCounter}.${runNumber}`;
                }
            }
            return `T${counter}`;
        }
        // Fallback: use last 4 chars
        return testId.slice(-4);
    }
}
exports.ActivityFeed = ActivityFeed;
//# sourceMappingURL=activity-feed.js.map