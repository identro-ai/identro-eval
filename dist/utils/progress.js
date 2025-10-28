"use strict";
/**
 * Progress Display Utilities
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressDisplay = void 0;
exports.getProgress = getProgress;
exports.resetProgress = resetProgress;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
class ProgressDisplay {
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
        this.spinner = (0, ora_1.default)({
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
            status = `\n${chalk_1.default.bold('🧪 Testing CrewAI Agents')}\n\n`;
            status += `Agent: ${chalk_1.default.cyan(this.state.agentName)} (${this.state.currentAgent}/${this.state.totalAgents})\n`;
            if (this.state.dimensionName) {
                status += `├─ Dimension: ${chalk_1.default.yellow(this.state.dimensionName)} (${this.state.currentDimension}/${this.state.totalDimensions})\n`;
            }
            if (this.state.inputPreview) {
                const preview = this.state.inputPreview.length > 50
                    ? this.state.inputPreview.substring(0, 50) + '...'
                    : this.state.inputPreview;
                const cacheIndicator = this.state.cached ? chalk_1.default.green(' [cached]') : chalk_1.default.yellow(' [API call]');
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
exports.ProgressDisplay = ProgressDisplay;
// Singleton instance
let progressInstance = null;
function getProgress(verbose = false) {
    if (!progressInstance) {
        progressInstance = new ProgressDisplay(verbose);
    }
    return progressInstance;
}
function resetProgress() {
    if (progressInstance) {
        progressInstance.stop();
    }
    progressInstance = null;
}
//# sourceMappingURL=progress.js.map