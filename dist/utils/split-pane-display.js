"use strict";
/**
 * Split-Pane Terminal Display
 * Advanced 3-pane interface for test execution
 * Now uses TestStateManager as single source of truth
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitPaneDisplay = void 0;
const chalk_1 = __importDefault(require("chalk"));
const boxen_1 = __importDefault(require("boxen"));
const cli_width_1 = __importDefault(require("cli-width"));
const ansi_escapes_1 = __importDefault(require("ansi-escapes"));
const log_update_1 = __importDefault(require("log-update"));
const figures_1 = __importDefault(require("figures"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const test_id_formatter_1 = require("./test-id-formatter");
const activity_feed_1 = require("./activity-feed");
/**
 * Color scheme for enhanced visual hierarchy
 */
const Colors = {
    // Status colors
    queued: chalk_1.default.hex('#4A90E2'), // Soft blue - calm, waiting
    running: chalk_1.default.hex('#FFA500'), // Vibrant amber - active
    completed: chalk_1.default.hex('#10B981'), // Emerald green - success
    failed: chalk_1.default.hex('#EF4444'), // Coral red - error
    cached: chalk_1.default.hex('#8B5CF6'), // Purple - special cached status
    // UI element colors
    header: chalk_1.default.hex('#06B6D4'), // Cyan for headers
    border: {
        idle: 'gray',
        running: 'yellow',
        success: 'green',
        error: 'red',
        mixed: 'cyan'
    },
    // Text hierarchy
    primary: chalk_1.default.white,
    secondary: chalk_1.default.hex('#9CA3AF'), // Gray-400
    muted: chalk_1.default.hex('#6B7280'), // Gray-500
    accent: chalk_1.default.hex('#F59E0B'), // Amber-500
    // Progress indicators
    progress: {
        empty: chalk_1.default.hex('#374151'), // Gray-700
        quarter: chalk_1.default.hex('#FCD34D'), // Yellow-300
        half: chalk_1.default.hex('#FBBF24'), // Yellow-400
        threeQuarter: chalk_1.default.hex('#F59E0B'), // Amber-500
        full: chalk_1.default.hex('#10B981') // Emerald-500
    }
};
/**
 * Visual progress indicators using Unicode characters
 */
const ProgressRings = {
    empty: '◯', // 0%
    quarter: '◔', // 25%
    half: '◑', // 50%
    threeQuarter: '◕', // 75%
    full: '●' // 100%
};
class SplitPaneDisplay {
    constructor(testStateManager, maxConcurrency) {
        this.height = 40; // Terminal height
        this.logs = [];
        this.selectedNodeId = null;
        this.updateInterval = null;
        this.unsubscribe = null;
        this.renderPending = false;
        this.lastRenderTime = 0;
        this.RENDER_THROTTLE_MS = 500; // Update every 0.5 seconds
        this.maxConcurrency = 5; // Default, will be updated from config
        // Smart Log Formatting state
        this.expandedLogGroups = new Set(); // Track which log groups are expanded
        this.logGroupStates = new Map();
        this.width = (0, cli_width_1.default)({ defaultWidth: 120 });
        this.testStateManager = testStateManager;
        this.activityFeed = new activity_feed_1.ActivityFeed();
        if (maxConcurrency) {
            this.maxConcurrency = maxConcurrency;
        }
        // Handle terminal resize
        process.stdout.on('resize', () => {
            this.width = (0, cli_width_1.default)({ defaultWidth: 120 });
            this.throttledRender();
        });
        // Subscribe to state changes with throttling
        this.unsubscribe = this.testStateManager.subscribe({
            onTestUpdate: (test) => {
                // Add feed entries based on test status changes
                this.updateActivityFeed(test);
                // Throttle state update renders
                this.throttledRender();
            },
            onMetricsUpdate: (metrics) => {
                // Throttle metrics update renders
                this.throttledRender();
            },
            onLog: (message, level) => {
                this.addLogEntry(message, level);
                this.throttledRender();
            }
        });
    }
    /**
     * Throttled render to prevent excessive re-renders
     */
    throttledRender() {
        const now = Date.now();
        // If we're already pending a render, don't schedule another
        if (this.renderPending) {
            return;
        }
        // If enough time has passed since last render, render immediately
        if (now - this.lastRenderTime >= this.RENDER_THROTTLE_MS) {
            this.lastRenderTime = now;
            this.render();
            return;
        }
        // Otherwise, schedule a render for later
        this.renderPending = true;
        const timeToWait = this.RENDER_THROTTLE_MS - (now - this.lastRenderTime);
        setTimeout(() => {
            this.renderPending = false;
            this.lastRenderTime = Date.now();
            this.render();
        }, timeToWait);
    }
    /**
     * Initialize the display - now just starts rendering since state is managed externally
     */
    initialize() {
        // Clear logs
        this.logs = [];
        // Start rendering
        this.startRendering();
    }
    /**
     * Start the rendering loop - now event-driven with periodic refresh for timers
     */
    startRendering() {
        // Initial render
        this.throttledRender();
        // Set up periodic refresh every 500ms to update timers
        this.updateInterval = setInterval(() => {
            // Check if all tests are complete
            const metrics = this.testStateManager.getMetrics();
            const allComplete = (metrics.completed + metrics.failed) >= metrics.totalTests && metrics.totalTests > 0;
            if (allComplete) {
                // Stop periodic updates to avoid memory leak
                if (this.updateInterval) {
                    clearInterval(this.updateInterval);
                    this.updateInterval = null;
                }
            }
            this.render(); // Direct render for periodic updates
        }, 500);
    }
    /**
     * Stop the rendering loop and cleanup
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
    /**
     * Main render function - creates 3-pane layout
     */
    render() {
        const output = [];
        // Clear screen and move to top
        output.push(ansi_escapes_1.default.clearScreen);
        output.push(ansi_escapes_1.default.cursorTo(0, 0));
        // Header
        output.push(this.renderHeader());
        // Progress bar (moved above panes, no space between header and progress bar)
        output.push(this.renderProgressBar());
        output.push('');
        // Calculate pane dimensions for 2-pane layout (35% left, 65% right)
        const leftPaneWidth = Math.floor(this.width * 0.35);
        const rightPaneWidth = this.width - leftPaneWidth - 2; // Account for borders and spacing
        // Render two-pane layout with SAME height for both panes
        const paneHeight = 30;
        const leftPane = this.renderTestQueueAndStatus(leftPaneWidth, paneHeight);
        const rightPane = this.renderLiveLogs(rightPaneWidth, paneHeight);
        // Combine panes side by side - ensure equal line counts
        const leftLines = leftPane.split('\n');
        const rightLines = rightPane.split('\n');
        // Use exact pane height (not max) to ensure consistency
        const linesToRender = paneHeight + 2; // +2 for border
        for (let i = 0; i < linesToRender; i++) {
            const left = (leftLines[i] || '').padEnd(leftPaneWidth, ' ');
            const right = (rightLines[i] || '').padEnd(rightPaneWidth, ' ');
            output.push(`${left} ${right}`);
        }
        // Footer (shortcuts only, no progress bar, minimal spacing)
        output.push(this.renderFooter());
        // Update display
        (0, log_update_1.default)(output.join('\n'));
    }
    /**
     * Render header with branding and dynamic status
     */
    renderHeader() {
        const title = Colors.header.bold('IDENTRO EVAL');
        const subtitle = Colors.secondary('AI Agent Testing Suite v1.0.0');
        const time = Colors.muted(new Date().toLocaleTimeString());
        // Get overall system status for dynamic border color
        const allTests = this.testStateManager.getAllTests();
        const runningTests = allTests.filter(test => test.status === 'running');
        const failedTests = allTests.filter(test => test.status === 'failed');
        const completedTests = allTests.filter(test => test.status === 'completed');
        let borderColor = Colors.border.idle;
        let statusIndicator = '';
        if (runningTests.length > 0) {
            borderColor = Colors.border.running;
            statusIndicator = Colors.running(` ● ${runningTests.length} running`);
        }
        else if (failedTests.length > 0 && completedTests.length > 0) {
            borderColor = Colors.border.mixed;
            statusIndicator = Colors.accent(` ◐ mixed results`);
        }
        else if (failedTests.length > 0) {
            borderColor = Colors.border.error;
            statusIndicator = Colors.failed(` ✗ failures detected`);
        }
        else if (completedTests.length > 0) {
            borderColor = Colors.border.success;
            statusIndicator = Colors.completed(` ✓ all passed`);
        }
        return (0, boxen_1.default)(`${title}  ${subtitle}${statusIndicator}\n${time}`, {
            padding: { top: 0, bottom: 0, left: 2, right: 2 },
            borderStyle: 'round',
            borderColor: borderColor,
            width: this.width,
        });
    }
    /**
     * Render test queue and status (left pane) with enhanced color coding
     */
    renderTestQueueAndStatus(width, height) {
        const lines = [];
        // Pane header with reduced emoji usage
        lines.push(Colors.primary.bold('TEST QUEUE & STATUS'));
        lines.push(Colors.secondary('━'.repeat(width - 2)));
        // Get all tests from state manager
        const allTests = this.testStateManager.getAllTests();
        // CRITICAL FIX: Use the same display methods as the working test script
        const queuedTests = this.testStateManager.getQueueDisplayTests();
        const evaluatingTests = this.testStateManager.getEvaluatingDisplayTests();
        const completedDisplayTests = this.testStateManager.getCompletedDisplayTests();
        // For running tests, show individual runs and single tests (not parent tests)
        const runningTests = allTests.filter(test => test.status === 'running' && !test.isParentTest);
        // Separate completed and failed for display
        const completedTests = completedDisplayTests.filter(test => test.status === 'completed');
        const failedTests = completedDisplayTests.filter(test => test.status === 'failed');
        if (allTests.length === 0) {
            lines.push(Colors.muted('No tests found...'));
        }
        // CRITICAL FIX: Running section - show individual runs, not grouped parent tests
        if (runningTests.length > 0) {
            // Show actual count of running individual tests/runs (not grouped)
            lines.push(Colors.running.bold(`▶ RUNNING (${runningTests.length}/${this.maxConcurrency} active)`));
            // Show each individual running test/run separately (like queued group)
            runningTests.slice(0, this.maxConcurrency).forEach(test => {
                const testId = test.displayId || test_id_formatter_1.testIdFormatter.formatSingleRun(test.dimension, test.inputIndex);
                let timeDisplay = '0.0s';
                if (test.startTime) {
                    const elapsed = ((Date.now() - test.startTime.getTime()) / 1000).toFixed(1);
                    timeDisplay = `${elapsed}s`;
                }
                let displayLine = '';
                // Generic display for all multi-run dimensions
                if (test.runIndex !== undefined && test.totalRuns) {
                    displayLine = `${Colors.accent(testId)} ${Colors.running(timeDisplay)} ${Colors.primary(test.agentName)} ${Colors.secondary('>')} ${Colors.secondary(test.dimension)} ${Colors.muted(`(${test.runIndex + 1}/${test.totalRuns})`)}`;
                }
                else {
                    // Show single test
                    displayLine = `${Colors.accent(testId)} ${Colors.running(timeDisplay)} ${Colors.primary(test.agentName)} ${Colors.secondary('>')} ${Colors.secondary(test.dimension)}`;
                }
                lines.push(displayLine);
            });
            // Show overflow if more than maxConcurrency
            if (runningTests.length > this.maxConcurrency) {
                lines.push(Colors.muted(`... and ${runningTests.length - this.maxConcurrency} more (queue overflow)`));
            }
        }
        // Evaluating section - show tests being evaluated by LLM with enhanced visibility
        if (evaluatingTests.length > 0) {
            // Add spacing only if there were running tests above
            if (runningTests.length > 0) {
                lines.push('');
            }
            // Calculate total cost for evaluating tests
            const totalTokens = evaluatingTests.reduce((sum, test) => sum + (test.llmTokensUsed || 0), 0);
            const estimatedCost = totalTokens * 0.00002; // Rough estimate: $0.02 per 1K tokens
            let headerText = `🧠 EVALUATING (${evaluatingTests.length})`;
            if (totalTokens > 0) {
                headerText += ` - ${totalTokens} tokens (~$${estimatedCost.toFixed(4)})`;
            }
            lines.push(Colors.accent.bold(headerText));
            evaluatingTests.slice(0, 5).forEach(test => {
                const testId = test.displayId || test_id_formatter_1.testIdFormatter.formatEvaluating(test.dimension, test.inputIndex);
                const agentName = test.agentName;
                let displayLine = '';
                let evaluationDetail = '';
                // Generic evaluation progress messages for all dimensions
                if (test.isMultiRun) {
                    evaluationDetail = `Comparing ${test.dimension} across runs...`;
                }
                else if (test.evaluationProgress) {
                    evaluationDetail = test.evaluationProgress;
                }
                else {
                    evaluationDetail = `Evaluating ${test.dimension}...`;
                }
                displayLine = `${Colors.accent(testId)} ${Colors.primary(agentName)} ${Colors.secondary('>')} ${Colors.muted(evaluationDetail)}`;
                // Show real-time token usage and cost if available
                if (test.llmTokensUsed) {
                    const testCost = test.llmTokensUsed * 0.00002;
                    displayLine += ` ${Colors.muted(`(${test.llmTokensUsed} tokens, $${testCost.toFixed(4)})`)}`;
                }
                lines.push(displayLine);
            });
        }
        // Queued section - show individual tests with enhanced color coding
        if (queuedTests.length > 0) {
            // Add spacing only if there were tests above
            if (runningTests.length > 0 || evaluatingTests.length > 0) {
                lines.push('');
            }
            lines.push(Colors.queued.bold(`◯ QUEUED (${queuedTests.length})`));
            // Show individual queued tests - up to 8 to fill space
            queuedTests.slice(0, 8).forEach(test => {
                const testId = test.displayId || test_id_formatter_1.testIdFormatter.formatSingleRun(test.dimension, test.inputIndex);
                let displayLine = '';
                // Generic display for all multi-run dimensions
                if (test.runIndex !== undefined && test.totalRuns) {
                    displayLine = `${Colors.muted(testId)} ${Colors.secondary(test.agentName)} ${Colors.muted('>')} ${Colors.secondary(test.dimension)} ${Colors.muted(`(${test.runIndex + 1}/${test.totalRuns})`)}`;
                }
                else {
                    displayLine = `${Colors.muted(testId)} ${Colors.secondary(test.agentName)} ${Colors.muted('>')} ${Colors.secondary(test.dimension)}`;
                }
                lines.push(displayLine);
            });
            if (queuedTests.length > 8) {
                lines.push(Colors.muted(`... and ${queuedTests.length - 8} more`));
            }
        }
        // Completed section - show PARENT TESTS ONLY (not individual runs)
        const parentCompletedTests = completedTests.filter(test => !test.id.includes('-run'));
        const parentFailedTests = failedTests.filter(test => !test.id.includes('-run'));
        const finishedParentTests = [...parentCompletedTests, ...parentFailedTests];
        if (finishedParentTests.length > 0) {
            // Add spacing only if there were tests above
            if (runningTests.length > 0 || evaluatingTests.length > 0 || queuedTests.length > 0) {
                lines.push('');
            }
            // Dynamic header based on results
            const hasFailures = parentFailedTests.length > 0;
            const headerText = hasFailures ?
                `● COMPLETED (${parentCompletedTests.length} passed, ${parentFailedTests.length} failed)` :
                `✓ COMPLETED (${finishedParentTests.length})`;
            const headerColor = hasFailures ? Colors.accent : Colors.completed;
            lines.push(headerColor.bold(headerText));
            // Show recent completed/failed PARENT tests - up to 8
            const recentFinished = finishedParentTests
                .sort((a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0))
                .slice(0, 8);
            recentFinished.forEach(test => {
                const testId = test.displayId || test_id_formatter_1.testIdFormatter.formatSingleRun(test.dimension, test.inputIndex);
                const isSuccess = test.status === 'completed';
                const statusColor = isSuccess ? Colors.completed : Colors.failed;
                const icon = isSuccess ? '✓' : '✗';
                // Generic status text for all dimensions
                let statusText = isSuccess ? '(passed)' : '(failed)';
                // Add latency info if available and significant
                if (test.latencyMs && test.latencyMs > 3000) {
                    statusText = `(${(test.latencyMs / 1000).toFixed(1)}s)`;
                }
                const displayLine = `${Colors.muted(testId)} ${statusColor(icon)} ${Colors.secondary(test.agentName)} ${Colors.muted('>')} ${Colors.secondary(test.dimension)} ${Colors.muted(statusText)}`;
                lines.push(displayLine);
            });
        }
        // If no tests at all, show helpful message
        if (allTests.length === 0) {
            lines.push('');
            lines.push(Colors.muted('Waiting for tests to be created...'));
        }
        // Fill remaining space
        while (lines.length < height - 1) {
            lines.push('');
        }
        // Dynamic border color based on test states
        let borderColor = Colors.border.idle;
        if (runningTests.length > 0) {
            borderColor = Colors.border.running;
        }
        else if (queuedTests.length > 0) {
            borderColor = Colors.border.mixed;
        }
        else if (failedTests.length > 0) {
            borderColor = Colors.border.error;
        }
        else if (completedTests.length > 0) {
            borderColor = Colors.border.success;
        }
        return (0, boxen_1.default)(lines.join('\n'), {
            borderStyle: 'round',
            borderColor: borderColor,
            width: width,
            height: height,
            padding: 0,
        });
    }
    /**
     * Render activity feed (middle pane) - new narrative-driven design
     */
    renderLiveLogs(width, height) {
        // Use ActivityFeed's built-in render method
        return this.activityFeed.render(width, height);
    }
    /**
     * Render metrics (right pane) with reduced visual noise
     */
    renderMetrics(width, height) {
        const lines = [];
        // Pane header - no emoji
        lines.push(chalk_1.default.bold.white('METRICS'));
        lines.push(chalk_1.default.gray('━'.repeat(width - 2)));
        lines.push('');
        // Get metrics from state manager
        const metrics = this.testStateManager.getMetrics();
        // Progress overview
        const passRate = metrics.totalTests > 0
            ? Math.round((metrics.completed / metrics.totalTests) * 100)
            : 0;
        // LLM Metrics section if available
        if (metrics.totalLLMCalls > 0) {
            lines.push(chalk_1.default.white('LLM Usage:'));
            lines.push(`  ${chalk_1.default.cyan('🧠')} Calls: ${metrics.totalLLMCalls}`);
            lines.push(`  ${chalk_1.default.yellow('📊')} Tokens: ${metrics.totalTokensUsed.toLocaleString()}`);
            lines.push(`  ${chalk_1.default.green('💰')} Cost: $${metrics.totalCost.toFixed(4)}`);
            if (metrics.averageEvaluationTime) {
                lines.push(`  ${chalk_1.default.blue('⏱')} Avg Eval: ${(metrics.averageEvaluationTime / 1000).toFixed(1)}s`);
            }
            lines.push('');
        }
        lines.push(chalk_1.default.white('Progress:'));
        const completed = metrics.completed + metrics.failed;
        const progressPct = metrics.totalTests > 0 ? Math.round((completed / metrics.totalTests) * 100) : 0;
        lines.push(`  ${this.renderMiniProgressBar(progressPct, width - 4)}`);
        lines.push(`  ${completed}/${metrics.totalTests} tests (${progressPct}%)`);
        lines.push('');
        // Test results - using simple characters
        lines.push(chalk_1.default.white('Results:'));
        lines.push(`  ${chalk_1.default.green('✓')} Passed: ${metrics.completed}`);
        lines.push(`  ${chalk_1.default.red('✗')} Failed: ${metrics.failed}`);
        lines.push(`  ${chalk_1.default.gray('○')} Skipped: 0`);
        lines.push(`  ${chalk_1.default.cyan('│')} Pass Rate: ${passRate}%`);
        lines.push('');
        // Performance - minimal icons
        lines.push(chalk_1.default.white('Performance:'));
        lines.push(`  ${chalk_1.default.yellow('→')} API Calls: ${metrics.apiCalls}`);
        lines.push(`  ${chalk_1.default.magenta('◆')} Cache Hits: ${metrics.cacheHits}`);
        const cacheRate = metrics.apiCalls + metrics.cacheHits > 0
            ? Math.round((metrics.cacheHits / (metrics.apiCalls + metrics.cacheHits)) * 100)
            : 0;
        lines.push(`  ${chalk_1.default.cyan('│')} Cache Rate: ${cacheRate}%`);
        lines.push('');
        // Time - no emoji
        const elapsed = Math.floor((Date.now() - metrics.startTime.getTime()) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        lines.push(chalk_1.default.white('Duration:'));
        lines.push(`  ${minutes}m ${seconds}s`);
        // ETA
        if (completed > 0 && completed < metrics.totalTests) {
            const avgTimePerTest = elapsed / completed;
            const remainingTests = metrics.totalTests - completed;
            const eta = Math.ceil(avgTimePerTest * remainingTests);
            const etaMin = Math.floor(eta / 60);
            const etaSec = eta % 60;
            lines.push(`  ETA: ${etaMin}m ${etaSec}s`);
        }
        // Fill remaining space
        while (lines.length < height - 1) {
            lines.push('');
        }
        return (0, boxen_1.default)(lines.join('\n'), {
            borderStyle: 'round',
            borderColor: 'gray',
            width: width,
            height: height,
            padding: 0,
        });
    }
    /**
     * Render progress bar above panes
     */
    renderProgressBar() {
        const metrics = this.testStateManager.getMetrics();
        const allTests = this.testStateManager.getAllTests();
        const runningTests = allTests.filter(test => test.status === 'running');
        const evaluatingTests = allTests.filter(test => test.status === 'evaluating');
        // Calculate metrics
        const completed = metrics.completed + metrics.failed;
        const progressPct = metrics.totalTests > 0 ? Math.round((completed / metrics.totalTests) * 100) : 0;
        // Calculate total duration
        const durationMs = Date.now() - metrics.startTime.getTime();
        const durationMin = Math.floor(durationMs / 60000);
        const durationSec = Math.floor((durationMs % 60000) / 1000);
        const durationText = `${durationMin}m ${durationSec}s elapsed`;
        // Progress bar - wider for better visibility
        const barWidth = Math.floor(this.width * 0.5); // Use 50% of terminal width
        const filled = Math.floor((progressPct / 100) * barWidth);
        const empty = barWidth - filled;
        // Use different shading for filled portion
        const progressBar = chalk_1.default.green('█'.repeat(filled)) + chalk_1.default.gray('░'.repeat(empty));
        // Build progress line with metrics
        const metricsText = [
            `${completed}/${metrics.totalTests} TESTS (${progressPct}%)`,
            `${metrics.apiCalls} API calls`,
            durationText
        ].join(' | ');
        return (0, boxen_1.default)(`${progressBar}\n${Colors.secondary(metricsText)}`, {
            padding: { top: 0, bottom: 0, left: 2, right: 2 },
            borderStyle: 'round',
            borderColor: progressPct === 100 ? 'green' : 'cyan',
            width: this.width,
        });
    }
    /**
     * Render footer with functional shortcuts only
     */
    renderFooter() {
        const metrics = this.testStateManager.getMetrics();
        const completed = metrics.completed + metrics.failed;
        // Keyboard shortcuts
        const isComplete = completed === metrics.totalTests && metrics.totalTests > 0;
        const shortcuts = isComplete
            ? `${chalk_1.default.green('✓')} Tests Complete  •  ${chalk_1.default.cyan('R')} Report  •  ${chalk_1.default.cyan('V')} View Summary  •  ${chalk_1.default.cyan('Q')} Quit`
            : `${Colors.running('●')} Running...  ${chalk_1.default.cyan('Ctrl+C')} to stop`;
        return shortcuts;
    }
    /**
     * Generate test ID using the new formatter
     */
    generateTestId(test) {
        if (test.displayId) {
            return test.displayId;
        }
        // Use the new test ID formatter
        if (test.isMultiRun && test.totalRuns) {
            if (test.runIndex !== undefined) {
                return test_id_formatter_1.testIdFormatter.formatProgress(test.dimension, test.inputIndex, test.runIndex + 1, test.totalRuns);
            }
            else {
                return test_id_formatter_1.testIdFormatter.formatMultiRun(test.dimension, test.inputIndex, test.totalRuns);
            }
        }
        return test_id_formatter_1.testIdFormatter.formatSingleRun(test.dimension, test.inputIndex);
    }
    /**
     * Render mini progress bar
     */
    renderMiniProgressBar(percent, width) {
        // Clamp percent between 0 and 100 to avoid negative values
        const clampedPercent = Math.max(0, Math.min(100, percent));
        const filled = Math.floor(clampedPercent * width / 100);
        const empty = Math.max(0, width - filled); // Ensure empty is never negative
        let color = chalk_1.default.green;
        if (clampedPercent < 33)
            color = chalk_1.default.red;
        else if (clampedPercent < 66)
            color = chalk_1.default.yellow;
        return color('█'.repeat(filled)) + chalk_1.default.gray('░'.repeat(empty));
    }
    /**
     * Update activity feed based on test state changes
     * Feed entries mirror what's shown in left pane - both driven from same source
     */
    updateActivityFeed(test) {
        const testId = this.generateTestId(test);
        // Track which tests have already created eval entries to prevent duplicates
        if (!this.evalEntriesCreated) {
            this.evalEntriesCreated = new Set();
        }
        // Add feed entries based on status transitions
        switch (test.status) {
            case 'running':
                // Show test_start for ALL running tests (individual runs AND single tests)
                // This mirrors the left pane RUNNING section
                // Skip ONLY parent tests (they don't actually run, their children do)
                if (!test.isParentTest) {
                    // Extract parent test ID for multi-run tests
                    let parentTestId;
                    let runNumber;
                    if (test.runIndex !== undefined) {
                        // This is a multi-run test - extract parent ID
                        parentTestId = test.id.replace(/-run\d+$/, '');
                        runNumber = test.runIndex + 1; // Convert to 1-based
                    }
                    this.activityFeed.addEntry({
                        type: 'test_start',
                        testId: test.id,
                        agentName: test.agentName,
                        dimension: test.dimension,
                        data: {
                            description: test.testDescription, // NO fallback
                            parentTestId: parentTestId,
                            runNumber: runNumber,
                        },
                    });
                }
                break;
            case 'evaluating':
                // ONLY for parent tests or single tests (NOT individual runs)
                const isIndividualRun = test.id.includes('-run');
                if (isIndividualRun && !test.isParentTest) {
                    return; // Skip individual runs for evaluation
                }
                // Skip parent tests that aren't visible yet
                if (test.isParentTest && !test.visibleInQueue) {
                    return;
                }
                // CRITICAL: Only create ONE eval_start entry per test (prevent duplicates)
                if (this.evalEntriesCreated.has(test.id)) {
                    return; // Already created eval entry for this test
                }
                this.evalEntriesCreated.add(test.id);
                // Show test description (what we're testing)
                const evalDescription = test.testDescription || test.evalDescription;
                // ONLY add entry if we have a description
                if (evalDescription) {
                    this.activityFeed.addEntry({
                        type: 'eval_start',
                        testId: test.id,
                        agentName: test.agentName,
                        dimension: test.dimension,
                        data: {
                            description: evalDescription, // NO fallback
                        },
                    });
                }
                break;
            case 'completed':
            case 'failed':
                // ONLY for parent tests or single tests (NOT individual runs)
                const isIndividualRunResult = test.id.includes('-run');
                if (isIndividualRunResult && !test.isParentTest) {
                    return; // Skip individual runs for results
                }
                const passed = test.status === 'completed';
                // ONLY create result entry if we have explanation OR failedCriterion
                if (test.resultExplanation || test.failedCriterion) {
                    this.activityFeed.addEntry({
                        type: 'test_result',
                        testId: test.id,
                        agentName: test.agentName,
                        dimension: test.dimension,
                        data: {
                            description: test.testDescription, // Include test description
                            result: passed ? 'passed' : 'failed',
                            score: test.result?.score ? Math.round(test.result.score * 100) : undefined,
                            explanation: test.resultExplanation, // NO fallback
                            failedCriterion: !passed ? test.failedCriterion : undefined, // NO fallback
                        },
                    });
                }
                break;
        }
    }
    /**
     * Add a log entry with rich formatting for prompts/responses
     */
    addLogEntry(message, level = 'info') {
        // Filter out repetitive progress messages
        if (message.includes('Progress:') && message.includes('tests (') && message.includes('running)')) {
            const progressLogs = this.logs.filter((log) => log.includes('Progress:'));
            if (progressLogs.length > 0) {
                return;
            }
        }
        // Use shorter timestamp format (HH:MM)
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        // Enhanced formatting for different message types
        let formattedMessage = message;
        let icon = figures_1.default.info;
        let color = chalk_1.default.blue;
        // Detect and format different log types
        if (message.includes('→') && message.includes('[T')) {
            // Request message: [T1.1] → "prompt text"
            icon = '→';
            color = chalk_1.default.cyan;
        }
        else if (message.includes('←') && message.includes('[T')) {
            // Response message: [T1.1] ← "response text" (123 chars)
            icon = '←';
            color = chalk_1.default.green;
        }
        else if (message.includes('✅') && message.includes('[T')) {
            // Success message: [T1.1] ✅ PASSED
            icon = '✅';
            color = chalk_1.default.green;
        }
        else if (message.includes('❌') && message.includes('[T')) {
            // Failure message: [T1.1] ❌ FAILED
            icon = '❌';
            color = chalk_1.default.red;
        }
        else if (message.includes('💾')) {
            // Cache message
            icon = '💾';
            color = chalk_1.default.magenta;
        }
        else if (message.includes('⚡')) {
            // Performance/process message
            icon = '⚡';
            color = chalk_1.default.yellow;
        }
        else {
            // Default icons based on level
            const levelIcons = {
                info: chalk_1.default.blue(figures_1.default.info),
                success: chalk_1.default.green(figures_1.default.tick),
                error: chalk_1.default.red(figures_1.default.cross),
                warning: chalk_1.default.yellow(figures_1.default.warning),
                debug: chalk_1.default.gray(figures_1.default.circle),
            };
            icon = levelIcons[level];
            color = chalk_1.default.blue;
        }
        this.logs.push(`${chalk_1.default.dim(timestamp)} ${color(icon)} ${formattedMessage}`);
        // Keep only last 100 logs
        if (this.logs.length > 100) {
            this.logs = this.logs.slice(-100);
        }
    }
    /**
     * Add rich log entry for test execution
     */
    addTestLog(testId, type, content, extra) {
        let message = '';
        switch (type) {
            case 'request':
                // Show more of the prompt - increase limit to 100 characters
                const truncatedPrompt = content.length > 100 ?
                    content.substring(0, 80) + '...' + content.substring(content.length - 17) :
                    content;
                message = `${testId} → "${truncatedPrompt}"`;
                break;
            case 'response':
                // Show more of the response and include character count
                const truncatedResponse = content.length > 100 ?
                    content.substring(0, 80) + '...' + content.substring(content.length - 17) :
                    content;
                const charCount = content.length;
                message = `${testId} ← "${truncatedResponse}" (${charCount} chars)`;
                break;
            case 'success':
                message = `${testId} ✅ PASSED${extra ? ` - ${extra}` : ''}`;
                break;
            case 'failure':
                message = `${testId} ❌ FAILED${extra ? ` - ${extra}` : ''}`;
                break;
        }
        this.addLogEntry(message, type === 'failure' ? 'error' : type === 'success' ? 'success' : 'info');
    }
    /**
     * Legacy methods for backward compatibility - now delegate to state manager
     */
    updateTestStatus(testId, status) {
        // Map old status names to new ones
        const statusMap = {
            'passed': 'completed',
            'skipped': 'failed', // For now, treat skipped as failed
        };
        const newStatus = statusMap[status] || status;
        this.testStateManager.updateTest(testId, { status: newStatus });
    }
    updateLiveTest(agentName, dimension, input, progress, status = 'running') {
        // This is now handled by the state manager automatically
        // Legacy method kept for compatibility
    }
    updateMetrics(apiCall = false, cacheHit = false) {
        if (apiCall)
            this.testStateManager.recordApiCall();
        if (cacheHit)
            this.testStateManager.recordCacheHit();
    }
    addLog(message, level = 'info') {
        this.testStateManager.addLog(message, level);
    }
    /**
     * Select a node in the tree
     */
    selectNode(nodeId) {
        this.selectedNodeId = nodeId;
    }
    // ============================================================================
    // SMART LOG FORMATTING METHODS
    // ============================================================================
    /**
     * Group logs by test ID for collapsible sections
     */
    groupLogsByTest(logs) {
        const groups = [];
        let currentGroup = null;
        logs.forEach(log => {
            // Extract test ID from log if present (e.g., [T1.1])
            const testIdMatch = log.match(/\[T\d+(?:\.\d+)?\]/);
            const testId = testIdMatch ? testIdMatch[0] : null;
            if (testId) {
                // Start a new group or add to existing group with same test ID
                const existingGroup = groups.find(g => g.testId === testId);
                if (existingGroup) {
                    existingGroup.logs.push(log);
                }
                else {
                    groups.push({ testId, logs: [log] });
                }
            }
            else {
                // System log without test ID
                if (!currentGroup || currentGroup.testId !== null) {
                    currentGroup = { testId: null, logs: [] };
                    groups.push(currentGroup);
                }
                currentGroup.logs.push(log);
            }
        });
        return groups;
    }
    /**
     * Check if a log group is expanded
     */
    isLogGroupExpanded(testId) {
        // By default, expand running tests and collapse completed ones
        const test = this.testStateManager.getAllTests().find(t => this.generateTestId(t) === testId);
        if (test && test.status === 'running') {
            return true; // Always expand running tests
        }
        // Check if manually expanded
        return this.expandedLogGroups.has(testId);
    }
    /**
     * Get status icon for a test
     */
    getTestStatusIcon(testId) {
        const test = this.testStateManager.getAllTests().find(t => this.generateTestId(t) === testId);
        if (!test)
            return '';
        switch (test.status) {
            case 'running':
                return chalk_1.default.yellow('●');
            case 'completed':
                return chalk_1.default.green('✓');
            case 'failed':
                return chalk_1.default.red('✗');
            case 'queued':
                return chalk_1.default.gray('○');
            case 'evaluating':
                return chalk_1.default.cyan('🧠');
            default:
                return '';
        }
    }
    /**
     * Format log with syntax highlighting
     */
    formatLogWithSyntaxHighlighting(log, width) {
        // Apply background colors for different severity levels
        if (log.includes('❌') || log.includes('FAILED') || log.includes('Error')) {
            // Error background - light red tint
            return chalk_1.default.bgRed.black(log.substring(0, width - 2));
        }
        else if (log.includes('⚠') || log.includes('Warning')) {
            // Warning background - light yellow tint
            return chalk_1.default.bgYellow.black(log.substring(0, width - 2));
        }
        else if (log.includes('✅') || log.includes('PASSED') || log.includes('Success')) {
            // Success background - light green tint
            return chalk_1.default.bgGreen.black(log.substring(0, width - 2));
        }
        // Syntax highlighting for prompts and responses
        let formatted = log;
        // Highlight quoted strings (prompts/responses)
        formatted = formatted.replace(/"([^"]+)"/g, (match, p1) => {
            // Smart truncation for long strings
            if (p1.length > 50) {
                const start = p1.substring(0, 20);
                const end = p1.substring(p1.length - 20);
                return chalk_1.default.cyan(`"${start}...${end}"`);
            }
            return chalk_1.default.cyan(match);
        });
        // Highlight test IDs
        formatted = formatted.replace(/\[T\d+(?:\.\d+)?\]/g, match => chalk_1.default.magenta.bold(match));
        // Highlight timestamps
        formatted = formatted.replace(/\d{2}:\d{2}/g, match => chalk_1.default.dim(match));
        // Highlight numbers (e.g., character counts, percentages)
        formatted = formatted.replace(/\b\d+\b/g, match => chalk_1.default.yellow(match));
        // Truncate if too long
        if ((0, strip_ansi_1.default)(formatted).length > width - 2) {
            const stripped = (0, strip_ansi_1.default)(formatted);
            const truncated = stripped.substring(0, width - 5) + '...';
            return truncated;
        }
        return formatted;
    }
    /**
     * Simple log formatting with minimal colors and better readability
     */
    formatLogSimple(log, width) {
        // Strip ANSI codes to get clean text
        const cleanLog = (0, strip_ansi_1.default)(log);
        // Extract components
        const timestampMatch = cleanLog.match(/^(\d{2}:\d{2})/);
        const testIdMatch = cleanLog.match(/\[T\d+(?:\.\d+)?\]/);
        // Determine log type and apply minimal styling
        let label = '';
        let labelColor = chalk_1.default.gray;
        let messageColor = chalk_1.default.white;
        if (cleanLog.includes('FAILED') || cleanLog.includes('❌')) {
            label = 'FAIL';
            labelColor = chalk_1.default.red;
            messageColor = chalk_1.default.white;
        }
        else if (cleanLog.includes('PASSED') || cleanLog.includes('✅')) {
            label = 'PASS';
            labelColor = chalk_1.default.green;
            messageColor = chalk_1.default.white;
        }
        else if (cleanLog.includes('Executing') || cleanLog.includes('Testing')) {
            label = 'EXEC';
            labelColor = chalk_1.default.blue;
            messageColor = chalk_1.default.white;
        }
        else if (cleanLog.includes('Input:')) {
            label = 'INFO';
            labelColor = chalk_1.default.cyan;
            messageColor = chalk_1.default.white;
        }
        else if (cleanLog.includes('Warning') || cleanLog.includes('⚠')) {
            label = 'WARN';
            labelColor = chalk_1.default.yellow;
            messageColor = chalk_1.default.white;
        }
        else if (cleanLog.includes('Python') || cleanLog.includes('process')) {
            label = 'PROC';
            labelColor = chalk_1.default.magenta;
            messageColor = chalk_1.default.gray;
        }
        else {
            label = 'INFO';
            labelColor = chalk_1.default.gray;
            messageColor = chalk_1.default.gray;
        }
        // Build formatted log
        let formatted = '';
        // Add timestamp if present
        if (timestampMatch) {
            formatted += chalk_1.default.dim(timestampMatch[1]) + ' ';
        }
        // Add label
        if (label) {
            formatted += labelColor(label) + ' ';
        }
        // Extract message content (remove timestamp and icons)
        let message = cleanLog;
        if (timestampMatch) {
            message = message.substring(timestampMatch[0].length).trim();
        }
        // Keep test IDs in the message for context
        let testIdPrefix = '';
        if (testIdMatch) {
            testIdPrefix = chalk_1.default.magenta(testIdMatch[0]) + ' ';
            message = message.replace(testIdMatch[0], '').trim();
        }
        // Remove icons but keep the rest of the message
        message = message.replace(/[✅❌⚡💾⚠ℹ→←]/g, '').trim();
        // Calculate available space for message
        // Account for: timestamp (5) + space (1) + label (4) + space (1) + testId (if present) + margin (3)
        const prefixLength = (0, strip_ansi_1.default)(formatted).length + (0, strip_ansi_1.default)(testIdPrefix).length;
        const availableWidth = width - prefixLength - 3;
        // Smart truncation with much higher limits
        if (message.length > availableWidth && availableWidth > 20) {
            // Check if message contains quoted text (prompts/responses)
            const quoteMatch = message.match(/"([^"]+)"/);
            if (quoteMatch && quoteMatch[1]) {
                const quotedText = quoteMatch[1];
                const beforeQuote = message.substring(0, message.indexOf(quoteMatch[0]));
                const afterQuote = message.substring(message.indexOf(quoteMatch[0]) + quoteMatch[0].length);
                // Calculate space for quoted content
                const contextLength = beforeQuote.length + afterQuote.length + 2; // +2 for quotes
                const quotedAvailable = availableWidth - contextLength - 3; // -3 for ellipsis
                if (quotedText.length > quotedAvailable && quotedAvailable > 30) {
                    // Show more of the quoted content
                    const showLength = Math.floor(quotedAvailable * 0.8); // Show 80% at start
                    const endLength = Math.floor(quotedAvailable * 0.2); // Show 20% at end
                    const truncatedQuote = quotedText.substring(0, showLength) + '...' +
                        quotedText.substring(quotedText.length - endLength);
                    message = beforeQuote + '"' + truncatedQuote + '"' + afterQuote;
                }
            }
            else {
                // For non-quoted text, show as much as possible
                message = message.substring(0, availableWidth - 3) + '...';
            }
        }
        // Combine all parts
        formatted += testIdPrefix + messageColor(message);
        return formatted;
    }
    /**
     * Get summary for collapsed log group
     */
    getLogGroupSummary(group) {
        const logCount = group.logs.length;
        const hasErrors = group.logs.some(log => log.includes('❌') || log.includes('FAILED'));
        const hasWarnings = group.logs.some(log => log.includes('⚠') || log.includes('Warning'));
        let summary = `${logCount} log${logCount !== 1 ? 's' : ''}`;
        if (hasErrors) {
            summary += chalk_1.default.red(' (errors)');
        }
        else if (hasWarnings) {
            summary += chalk_1.default.yellow(' (warnings)');
        }
        // Add last log preview
        if (group.logs.length > 0) {
            const lastLog = group.logs[group.logs.length - 1];
            const preview = (0, strip_ansi_1.default)(lastLog).substring(0, 30);
            summary += chalk_1.default.dim(` - ${preview}...`);
        }
        return summary;
    }
    /**
     * Get border color for log pane based on severity
     */
    getLogPaneBorderColor() {
        // Check for errors in recent logs
        const hasErrors = this.logs.some(log => log.includes('❌') || log.includes('FAILED') || log.includes('Error'));
        if (hasErrors) {
            return 'red';
        }
        // Check for warnings
        const hasWarnings = this.logs.some(log => log.includes('⚠') || log.includes('Warning'));
        if (hasWarnings) {
            return 'yellow';
        }
        // Check if tests are running
        const runningTests = this.testStateManager.getAllTests().filter(t => t.status === 'running');
        if (runningTests.length > 0) {
            return 'cyan';
        }
        return 'gray';
    }
    /**
     * Toggle log group expansion
     */
    toggleLogGroup(testId) {
        if (this.expandedLogGroups.has(testId)) {
            this.expandedLogGroups.delete(testId);
        }
        else {
            this.expandedLogGroups.add(testId);
        }
        this.throttledRender();
    }
    /**
     * Update log group state based on test status
     */
    updateLogGroupState(testId, state) {
        this.logGroupStates.set(testId, state);
    }
    /**
     * Count active agent interactions (individual runs, not just tests)
     */
    countActiveInteractions(runningTests) {
        let count = 0;
        for (const test of runningTests) {
            if (test.isMultiRun && test.totalRuns) {
                // For multi-run tests, count how many runs are actually active
                // This is a simplification - in reality we'd need more detailed tracking
                count += Math.min(test.totalRuns, this.maxConcurrency);
            }
            else {
                count += 1;
            }
        }
        return Math.min(count, this.maxConcurrency);
    }
    /**
     * Group multi-run tests together for cleaner display
     */
    groupMultiRunTests(runningTests) {
        const groups = [];
        // Group tests by base test ID (without run suffix)
        const testGroups = new Map();
        for (const test of runningTests) {
            // Extract base test ID (remove run suffix like -run1, -run2)
            let baseId = test.id;
            if (test.runIndex !== undefined) {
                // For multi-run tests, extract base ID
                baseId = test.id.replace(/-run\d+$/, '');
            }
            if (!testGroups.has(baseId)) {
                testGroups.set(baseId, []);
            }
            testGroups.get(baseId).push(test);
        }
        // Convert groups to display format
        for (const [baseId, tests] of testGroups) {
            const firstTest = tests[0];
            const isMultiRun = tests.length > 1 || (firstTest.isMultiRun === true);
            groups.push({
                isMultiRun,
                baseTestId: baseId,
                agentName: firstTest.agentName,
                dimension: firstTest.dimension,
                runs: tests,
                totalRuns: firstTest.totalRuns || tests.length,
            });
        }
        return groups;
    }
}
exports.SplitPaneDisplay = SplitPaneDisplay;
//# sourceMappingURL=split-pane-display.js.map