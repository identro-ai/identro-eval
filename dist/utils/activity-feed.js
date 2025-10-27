/**
 * Activity Feed
 *
 * Manages a scrolling feed of test execution events for the CLI UI.
 * Displays narrative-driven, LLM-generated descriptions of test progress.
 */
import chalk from 'chalk';
import boxen from 'boxen';
export class ActivityFeed {
    constructor() {
        this.entries = [];
        this.maxEntries = 25;
        this.entryIdCounter = 0;
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
        allLines.push(chalk.bold.white('FEED'));
        allLines.push(chalk.gray('━'.repeat(width - 4)));
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
        return boxen(finalLines.join('\n'), {
            borderStyle: 'round',
            borderColor: 'gray',
            padding: 0,
            width: width,
            height: height,
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
                    const icon = chalk.cyan('▶');
                    const agentStr = chalk.white(entry.agentName);
                    const dimStr = chalk.cyan(entry.dimension);
                    // Format: agent_name > dimension [PARENT_ID - Run X] or [TEST_ID]
                    let testIdDisplay = '';
                    if (entry.data.runNumber && entry.data.parentTestId) {
                        // Multi-run test: show "PARENT_ID - Run X"
                        const parentId = this.shortenTestId(entry.data.parentTestId);
                        testIdDisplay = chalk.magenta(`[${parentId} - Run ${entry.data.runNumber}]`);
                    }
                    else {
                        // Single test: show just TEST_ID
                        const testId = this.shortenTestId(entry.testId);
                        testIdDisplay = chalk.magenta(`[${testId}]`);
                    }
                    lines.push(`${chalk.dim(timestamp)} ${icon} ${agentStr} ${chalk.dim('>')} ${dimStr} ${testIdDisplay}`);
                    // ALWAYS prefix with "Testing:" and ONLY show if description exists
                    if (entry.data.description) {
                        const desc = entry.data.description.startsWith('Testing:')
                            ? entry.data.description
                            : `Testing: ${entry.data.description}`;
                        lines.push(`      ${chalk.gray(desc)}`);
                    }
                }
                break;
            case 'test_progress':
                {
                    const icon = chalk.cyan('▶');
                    const agentStr = chalk.white(entry.agentName);
                    const dimStr = chalk.cyan(entry.dimension);
                    let testIdDisplay = '';
                    if (entry.data.runNumber && entry.data.parentTestId) {
                        const parentId = this.shortenTestId(entry.data.parentTestId);
                        testIdDisplay = chalk.magenta(`[${parentId} - Run ${entry.data.runNumber}]`);
                    }
                    else {
                        const testId = this.shortenTestId(entry.testId);
                        testIdDisplay = chalk.magenta(`[${testId}]`);
                    }
                    lines.push(`${chalk.dim(timestamp)} ${icon} ${agentStr} ${chalk.dim('>')} ${dimStr} ${testIdDisplay}`);
                    if (entry.data.progress) {
                        lines.push(`      ${chalk.yellow(entry.data.progress)}`);
                    }
                }
                break;
            case 'eval_start':
                {
                    const icon = chalk.magenta('◆');
                    const agentStr = chalk.white(entry.agentName);
                    const dimStr = chalk.cyan(entry.dimension);
                    // Parent tests show just [TEST_ID]
                    const testId = this.shortenTestId(entry.testId);
                    const testIdDisplay = chalk.magenta(`[${testId}]`);
                    lines.push(`${chalk.dim(timestamp)} ${icon} ${agentStr} ${chalk.dim('>')} ${dimStr} ${testIdDisplay}`);
                    // ALWAYS prefix with "Testing:" and ONLY show if description exists
                    if (entry.data.description) {
                        const desc = entry.data.description.startsWith('Testing:')
                            ? entry.data.description
                            : `Testing: ${entry.data.description}`;
                        lines.push(`      ${chalk.gray(desc)}`);
                    }
                    // Add evaluation status line
                    lines.push(`      ${chalk.dim('Test execution completed, now evaluating')}`);
                }
                break;
            case 'test_result':
                {
                    const isPassed = entry.data.result === 'passed';
                    // Use simple ✓/✗ icons like left pane
                    const icon = isPassed ? chalk.green('✓') : chalk.red('✗');
                    const agentStr = chalk.white(entry.agentName);
                    const dimStr = chalk.cyan(entry.dimension);
                    // Parent tests show just [TEST_ID]
                    const testId = this.shortenTestId(entry.testId);
                    const testIdDisplay = chalk.magenta(`[${testId}]`);
                    lines.push(`${chalk.dim(timestamp)} ${icon} ${agentStr} ${chalk.dim('>')} ${dimStr} ${testIdDisplay}`);
                    // ALWAYS prefix with "Testing:" and ONLY show if description exists
                    if (entry.data.description) {
                        const desc = entry.data.description.startsWith('Testing:')
                            ? entry.data.description
                            : `Testing: ${entry.data.description}`;
                        lines.push(`      ${chalk.gray(desc)}`);
                    }
                    // Result line - ONLY show if we have explanation OR failedCriterion (prevents empty results)
                    if (entry.data.explanation || entry.data.failedCriterion) {
                        const resultText = isPassed ? 'PASSED' : 'FAILED';
                        const scoreText = entry.data.score !== undefined ? ` (${entry.data.score}/100)` : '';
                        const resultColor = isPassed ? chalk.green : chalk.red;
                        lines.push(`      ${resultColor(`Result: ${resultText}${scoreText}`)}`);
                        // Show explanation ONLY if it exists (NO fallbacks)
                        if (entry.data.explanation) {
                            const explanation = entry.data.explanation.length > 60
                                ? entry.data.explanation.substring(0, 60) + '...'
                                : entry.data.explanation;
                            lines.push(`      ${chalk.gray(explanation)}`);
                        }
                        // Failed criterion (for failures only, truncate if too long)
                        if (!isPassed && entry.data.failedCriterion) {
                            const criterion = entry.data.failedCriterion.length > 60
                                ? entry.data.failedCriterion.substring(0, 60) + '...'
                                : entry.data.failedCriterion;
                            lines.push(`      ${chalk.red(`Failed: ${criterion}`)}`);
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
//# sourceMappingURL=activity-feed.js.map