/**
 * Enhanced Progress Display with Rich UI
 */
import chalk from 'chalk';
import figures from 'figures';
import logUpdate from 'log-update';
import cliWidth from 'cli-width';
import { animations } from './animations';
export class EnhancedProgressDisplay {
    constructor() {
        this.updateInterval = null;
        this.terminalWidth = cliWidth({ defaultWidth: 80 });
        this.state = {
            currentAgent: '',
            currentDimension: '',
            currentInput: '',
            totalAgents: 0,
            completedAgents: 0,
            totalDimensions: 0,
            completedDimensions: 0,
            totalInputs: 0,
            completedInputs: 0,
            startTime: Date.now(),
            isFromCache: false,
            metrics: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: 0,
                apiCalls: 0,
                cacheHits: 0,
                estimatedTimeRemaining: 0,
            }
        };
    }
    /**
     * Start progress tracking
     */
    start(totalAgents, totalDimensions, totalInputs) {
        this.state.totalAgents = totalAgents;
        this.state.totalDimensions = totalDimensions;
        this.state.totalInputs = totalInputs;
        this.state.startTime = Date.now();
        // Update display every 100ms for smooth animations
        this.updateInterval = setInterval(() => this.render(), 100);
    }
    /**
     * Update current agent
     */
    updateAgent(name, index) {
        this.state.currentAgent = name;
        this.state.completedAgents = index - 1;
    }
    /**
     * Update current dimension
     */
    updateDimension(name, index) {
        this.state.currentDimension = name;
        this.state.completedDimensions = index - 1;
    }
    /**
     * Update current input
     */
    updateInput(input, index, isFromCache = false) {
        this.state.currentInput = input;
        this.state.completedInputs = index - 1;
        this.state.isFromCache = isFromCache;
        if (isFromCache) {
            this.state.metrics.cacheHits++;
        }
        else {
            this.state.metrics.apiCalls++;
        }
    }
    /**
     * Update test metrics
     */
    updateMetrics(passed) {
        this.state.metrics.totalTests++;
        if (passed) {
            this.state.metrics.passed++;
        }
        else {
            this.state.metrics.failed++;
        }
    }
    /**
     * Calculate overall progress
     */
    calculateProgress() {
        const totalOperations = this.state.totalAgents * this.state.totalDimensions * this.state.totalInputs;
        const completedOperations = (this.state.completedAgents * this.state.totalDimensions * this.state.totalInputs) +
            (this.state.completedDimensions * this.state.totalInputs) +
            this.state.completedInputs;
        return totalOperations > 0 ? completedOperations / totalOperations : 0;
    }
    /**
     * Calculate ETA
     */
    calculateETA() {
        const progress = this.calculateProgress();
        if (progress === 0)
            return 'calculating...';
        const elapsed = Date.now() - this.state.startTime;
        const estimatedTotal = elapsed / progress;
        const remaining = estimatedTotal - elapsed;
        if (remaining < 1000)
            return 'almost done';
        if (remaining < 60000)
            return `${Math.ceil(remaining / 1000)}s`;
        if (remaining < 3600000)
            return `${Math.ceil(remaining / 60000)}m`;
        return `${Math.ceil(remaining / 3600000)}h`;
    }
    /**
     * Format duration
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        else {
            return `${seconds}s`;
        }
    }
    /**
     * Create progress bar
     */
    createProgressBar(progress, width = 30) {
        const filled = Math.round(progress * width);
        const empty = width - filled;
        const gradient = [
            chalk.red,
            chalk.yellow,
            chalk.cyan,
            chalk.green,
        ];
        const colorIndex = Math.min(3, Math.floor(progress * 4));
        const color = gradient[colorIndex];
        return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    }
    /**
     * Render the progress display
     */
    render() {
        const progress = this.calculateProgress();
        const eta = this.calculateETA();
        const elapsed = this.formatDuration(Date.now() - this.state.startTime);
        // Build the display
        let display = '\n';
        // Header with animation
        display += chalk.bold.cyan('🧪 Testing AI Agents\n');
        display += chalk.gray('─'.repeat(Math.min(50, this.terminalWidth - 10))) + '\n\n';
        // Current operation with icons
        if (this.state.currentAgent) {
            display += `${chalk.cyan(figures.pointer)} Agent: ${chalk.bold.white(this.state.currentAgent)} `;
            display += chalk.gray(`(${this.state.completedAgents + 1}/${this.state.totalAgents})\n`);
        }
        if (this.state.currentDimension) {
            display += `${chalk.yellow('  └─')} Dimension: ${chalk.white(this.state.currentDimension)} `;
            display += chalk.gray(`(${this.state.completedDimensions + 1}/${this.state.totalDimensions})\n`);
        }
        if (this.state.currentInput) {
            const inputPreview = this.state.currentInput.length > 40
                ? this.state.currentInput.substring(0, 40) + '...'
                : this.state.currentInput;
            const cacheIcon = this.state.isFromCache
                ? chalk.green(` ${figures.circleFilled} cached`)
                : chalk.yellow(` ${figures.circle} API`);
            display += `${chalk.gray('     └─')} Input: "${chalk.italic(inputPreview)}"${cacheIcon}\n`;
        }
        display += '\n';
        // Progress bar with percentage
        const progressBar = this.createProgressBar(progress);
        const percentage = Math.round(progress * 100);
        display += `Progress: ${progressBar} ${chalk.bold(`${percentage}%`)}\n`;
        // Stats line
        display += '\n';
        display += chalk.gray('┌─────────────────────────────────────────────┐\n');
        // Test results
        const passRate = this.state.metrics.totalTests > 0
            ? Math.round((this.state.metrics.passed / this.state.metrics.totalTests) * 100)
            : 0;
        display += chalk.gray('│ ') + chalk.green(`✓ ${this.state.metrics.passed} passed`) + '  ';
        display += chalk.red(`✗ ${this.state.metrics.failed} failed`) + '  ';
        display += chalk.gray(`○ ${this.state.metrics.skipped} skipped`) + '  ';
        display += chalk.cyan(`${passRate}% pass rate`) + chalk.gray(' │\n');
        // Performance metrics
        display += chalk.gray('│ ') + chalk.magenta(`⚡ ${this.state.metrics.apiCalls} API calls`) + '  ';
        display += chalk.green(`💾 ${this.state.metrics.cacheHits} cache hits`) + '  ';
        const cacheRate = (this.state.metrics.apiCalls + this.state.metrics.cacheHits) > 0
            ? Math.round((this.state.metrics.cacheHits / (this.state.metrics.apiCalls + this.state.metrics.cacheHits)) * 100)
            : 0;
        display += chalk.cyan(`${cacheRate}% cache rate`) + chalk.gray(' │\n');
        // Time metrics
        display += chalk.gray('│ ') + chalk.blue(`⏱️  Elapsed: ${elapsed}`) + '  ';
        display += chalk.yellow(`⏳ ETA: ${eta}`) + chalk.gray('                │\n');
        display += chalk.gray('└─────────────────────────────────────────────┘\n');
        // Tips at the bottom
        if (Math.random() > 0.95) {
            const tips = [
                '💡 Tip: Use --quick mode to skip LLM calls for faster testing',
                '💡 Tip: Cache results are automatically saved for faster re-runs',
                '💡 Tip: Press Ctrl+C to stop testing at any time',
                '💡 Tip: Use --verbose for detailed test output',
                '💡 Tip: Reports can be generated in multiple formats',
            ];
            display += '\n' + chalk.dim(tips[Math.floor(Math.random() * tips.length)]);
        }
        logUpdate(display);
    }
    /**
     * Stop progress display
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        logUpdate.done();
    }
    /**
     * Show completion summary
     */
    async complete() {
        this.stop();
        const duration = this.formatDuration(Date.now() - this.state.startTime);
        const passRate = this.state.metrics.totalTests > 0
            ? Math.round((this.state.metrics.passed / this.state.metrics.totalTests) * 100)
            : 0;
        console.log('\n');
        if (passRate === 100) {
            await animations.success('All tests passed! 🎉', 2000);
        }
        else if (passRate >= 80) {
            await animations.pulse(`Tests completed with ${passRate}% pass rate`, 1500);
        }
        else {
            await animations.error(`Tests completed with ${passRate}% pass rate`, 2000);
        }
        // Final summary box
        console.log('\n' + chalk.bold('📊 Final Results\n'));
        console.log(chalk.green(`  ✓ Passed: ${this.state.metrics.passed}`));
        console.log(chalk.red(`  ✗ Failed: ${this.state.metrics.failed}`));
        console.log(chalk.gray(`  ○ Skipped: ${this.state.metrics.skipped}`));
        console.log(chalk.cyan(`  📈 Pass Rate: ${passRate}%`));
        console.log(chalk.blue(`  ⏱️  Duration: ${duration}`));
        console.log(chalk.magenta(`  ⚡ API Calls: ${this.state.metrics.apiCalls}`));
        console.log(chalk.green(`  💾 Cache Hits: ${this.state.metrics.cacheHits}`));
    }
}
// Export singleton instance
export const enhancedProgress = new EnhancedProgressDisplay();
//# sourceMappingURL=enhanced-progress.js.map