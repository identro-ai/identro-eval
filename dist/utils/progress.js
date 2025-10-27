/**
 * Progress Display Utilities
 */
import chalk from 'chalk';
import ora from 'ora';
export class ProgressDisplay {
    constructor(verbose = false) {
        this.verbose = verbose;
        this.state = {
            totalAgents: 0,
            currentAgent: 0,
            agentName: '',
            totalDimensions: 0,
            currentDimension: 0,
            dimensionName: '',
            totalInputs: 0,
            currentInput: 0,
            inputPreview: '',
            startTime: Date.now(),
            cached: false,
        };
        this.spinner = ora({
            text: 'Initializing tests...',
            spinner: 'dots',
        });
    }
    /**
     * Start progress display
     */
    start(totalAgents, totalDimensions) {
        this.state.totalAgents = totalAgents;
        this.state.totalDimensions = totalDimensions;
        this.state.startTime = Date.now();
        this.spinner.start();
    }
    /**
     * Update agent progress
     */
    updateAgent(agentName, currentAgent) {
        this.state.agentName = agentName;
        this.state.currentAgent = currentAgent;
        this.updateDisplay();
    }
    /**
     * Update dimension progress
     */
    updateDimension(dimensionName, currentDimension) {
        this.state.dimensionName = dimensionName;
        this.state.currentDimension = currentDimension;
        this.updateDisplay();
    }
    /**
     * Update input progress
     */
    updateInput(inputPreview, currentInput, totalInputs, cached = false) {
        this.state.inputPreview = inputPreview;
        this.state.currentInput = currentInput;
        this.state.totalInputs = totalInputs;
        this.state.cached = cached;
        this.updateDisplay();
    }
    /**
     * Update the display
     */
    updateDisplay() {
        const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
        const progress = this.calculateProgress();
        const estimate = this.estimateRemaining(progress);
        // Build status text
        let status = '';
        if (this.verbose) {
            // Detailed progress
            status = `\n${chalk.bold('🧪 Testing CrewAI Agents')}\n\n`;
            status += `Agent: ${chalk.cyan(this.state.agentName)} (${this.state.currentAgent}/${this.state.totalAgents})\n`;
            if (this.state.dimensionName) {
                status += `├─ Dimension: ${chalk.yellow(this.state.dimensionName)} (${this.state.currentDimension}/${this.state.totalDimensions})\n`;
            }
            if (this.state.inputPreview) {
                const preview = this.state.inputPreview.length > 50
                    ? this.state.inputPreview.substring(0, 50) + '...'
                    : this.state.inputPreview;
                const cacheIndicator = this.state.cached ? chalk.green(' [cached]') : chalk.yellow(' [API call]');
                status += `│  └─ Input ${this.state.currentInput}/${this.state.totalInputs}: "${preview}"${cacheIndicator}\n`;
            }
            // Progress bar
            const barLength = 30;
            const filled = Math.max(0, Math.min(barLength, Math.floor(progress * barLength)));
            const remaining = Math.max(0, barLength - filled);
            const bar = '█'.repeat(filled) + '░'.repeat(remaining);
            status += `│\n└─ Progress: ${bar} ${(progress * 100).toFixed(0)}% | Time: ${this.formatTime(elapsed)}`;
            if (estimate > 0) {
                status += ` | Est: ${this.formatTime(estimate)} remaining`;
            }
            this.spinner.text = status;
        }
        else {
            // Simple progress
            const cacheIndicator = this.state.cached ? ' [cached]' : '';
            status = `Testing ${this.state.agentName} - ${this.state.dimensionName}${cacheIndicator}`;
            this.spinner.text = status;
        }
    }
    /**
     * Calculate overall progress
     */
    calculateProgress() {
        if (this.state.totalAgents === 0)
            return 0;
        const agentProgress = (this.state.currentAgent - 1) / this.state.totalAgents;
        const dimensionProgress = this.state.currentDimension / (this.state.totalDimensions * this.state.totalAgents);
        const inputProgress = this.state.currentInput / (this.state.totalInputs * this.state.totalDimensions * this.state.totalAgents);
        return agentProgress + dimensionProgress + inputProgress;
    }
    /**
     * Estimate remaining time
     */
    estimateRemaining(progress) {
        if (progress === 0)
            return 0;
        const elapsed = (Date.now() - this.state.startTime) / 1000;
        const total = elapsed / progress;
        return Math.floor(total - elapsed);
    }
    /**
     * Format time in seconds to human readable
     */
    formatTime(seconds) {
        if (seconds < 60)
            return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    }
    /**
     * Show success message
     */
    succeed(message) {
        this.spinner.succeed(message || 'Tests complete');
    }
    /**
     * Show failure message
     */
    fail(message) {
        this.spinner.fail(message || 'Tests failed');
    }
    /**
     * Stop spinner
     */
    stop() {
        this.spinner.stop();
    }
}
// Singleton instance
let progressInstance = null;
export function getProgress(verbose = false) {
    if (!progressInstance) {
        progressInstance = new ProgressDisplay(verbose);
    }
    return progressInstance;
}
export function resetProgress() {
    if (progressInstance) {
        progressInstance.stop();
    }
    progressInstance = null;
}
//# sourceMappingURL=progress.js.map