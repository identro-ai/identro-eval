/**
 * Enhanced Progress Display with Rich UI
 */
export declare class EnhancedProgressDisplay {
    private state;
    private terminalWidth;
    private updateInterval;
    constructor();
    /**
     * Start progress tracking
     */
    start(totalAgents: number, totalDimensions: number, totalInputs: number): void;
    /**
     * Update current agent
     */
    updateAgent(name: string, index: number): void;
    /**
     * Update current dimension
     */
    updateDimension(name: string, index: number): void;
    /**
     * Update current input
     */
    updateInput(input: string, index: number, isFromCache?: boolean): void;
    /**
     * Update test metrics
     */
    updateMetrics(passed: boolean): void;
    /**
     * Calculate overall progress
     */
    private calculateProgress;
    /**
     * Calculate ETA
     */
    private calculateETA;
    /**
     * Format duration
     */
    private formatDuration;
    /**
     * Create progress bar
     */
    private createProgressBar;
    /**
     * Render the progress display
     */
    private render;
    /**
     * Stop progress display
     */
    stop(): void;
    /**
     * Show completion summary
     */
    complete(): Promise<void>;
}
export declare const enhancedProgress: EnhancedProgressDisplay;
//# sourceMappingURL=enhanced-progress.d.ts.map