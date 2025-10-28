/**
 * Progress Display Utilities
 */
export interface ProgressState {
    totalAgents: number;
    currentAgent: number;
    agentName: string;
    totalDimensions: number;
    currentDimension: number;
    dimensionName: string;
    totalInputs: number;
    currentInput: number;
    inputPreview: string;
    startTime: number;
    cached: boolean;
}
export declare class ProgressDisplay {
    private spinner;
    private state;
    private verbose;
    constructor(verbose?: boolean);
    /**
     * Start progress display
     */
    start(totalAgents: number, totalDimensions: number): void;
    /**
     * Update agent progress
     */
    updateAgent(agentName: string, currentAgent: number): void;
    /**
     * Update dimension progress
     */
    updateDimension(dimensionName: string, currentDimension: number): void;
    /**
     * Update input progress
     */
    updateInput(inputPreview: string, currentInput: number, totalInputs: number, cached?: boolean): void;
    /**
     * Update the display
     */
    private updateDisplay;
    /**
     * Calculate overall progress
     */
    private calculateProgress;
    /**
     * Estimate remaining time
     */
    private estimateRemaining;
    /**
     * Format time in seconds to human readable
     */
    private formatTime;
    /**
     * Show success message
     */
    succeed(message?: string): void;
    /**
     * Show failure message
     */
    fail(message?: string): void;
    /**
     * Stop spinner
     */
    stop(): void;
}
export declare function getProgress(verbose?: boolean): ProgressDisplay;
export declare function resetProgress(): void;
//# sourceMappingURL=progress.d.ts.map