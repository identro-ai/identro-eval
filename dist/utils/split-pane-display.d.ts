/**
 * Split-Pane Terminal Display
 * Advanced 3-pane interface for test execution
 * Now uses TestStateManager as single source of truth
 */
import { TestStateManager } from './test-state-manager';
export declare class SplitPaneDisplay {
    private width;
    private height;
    private testStateManager;
    private activityFeed;
    private logs;
    private selectedNodeId;
    private updateInterval;
    private unsubscribe;
    private renderPending;
    private lastRenderTime;
    private readonly RENDER_THROTTLE_MS;
    private maxConcurrency;
    private expandedLogGroups;
    private logGroupStates;
    private evalEntriesCreated?;
    constructor(testStateManager: TestStateManager, maxConcurrency?: number);
    /**
     * Throttled render to prevent excessive re-renders
     */
    private throttledRender;
    /**
     * Initialize the display - now just starts rendering since state is managed externally
     */
    initialize(): void;
    /**
     * Start the rendering loop - now event-driven with periodic refresh for timers
     */
    private startRendering;
    /**
     * Stop the rendering loop and cleanup
     */
    stop(): void;
    /**
     * Main render function - creates 3-pane layout
     */
    private render;
    /**
     * Get version from package.json
     */
    private getVersion;
    /**
     * Render header with branding and dynamic status
     */
    private renderHeader;
    /**
     * Render test queue and status (left pane) with enhanced color coding
     */
    private renderTestQueueAndStatus;
    /**
     * Render activity feed (middle pane) - new narrative-driven design
     */
    private renderLiveLogs;
    /**
     * Render metrics (right pane) with reduced visual noise
     */
    private renderMetrics;
    /**
     * Render progress bar above panes
     */
    private renderProgressBar;
    /**
     * Render footer with functional shortcuts only
     */
    private renderFooter;
    /**
     * Generate test ID using the new formatter
     */
    private generateTestId;
    /**
     * Render mini progress bar
     */
    private renderMiniProgressBar;
    /**
     * Update activity feed based on test state changes
     * Feed entries mirror what's shown in left pane - both driven from same source
     */
    private updateActivityFeed;
    /**
     * Add a log entry with rich formatting for prompts/responses
     */
    private addLogEntry;
    /**
     * Add rich log entry for test execution
     */
    addTestLog(testId: string, type: 'request' | 'response' | 'success' | 'failure', content: string, extra?: string): void;
    /**
     * Legacy methods for backward compatibility - now delegate to state manager
     */
    updateTestStatus(testId: string, status: 'running' | 'passed' | 'failed' | 'skipped' | 'evaluating'): void;
    updateLiveTest(agentName: string, dimension: string, input: string, progress: number, status?: 'running' | 'completed'): void;
    updateMetrics(apiCall?: boolean, cacheHit?: boolean): void;
    addLog(message: string, level?: 'info' | 'success' | 'error' | 'warning' | 'debug'): void;
    /**
     * Select a node in the tree
     */
    selectNode(nodeId: string): void;
    /**
     * Group logs by test ID for collapsible sections
     */
    private groupLogsByTest;
    /**
     * Check if a log group is expanded
     */
    private isLogGroupExpanded;
    /**
     * Get status icon for a test
     */
    private getTestStatusIcon;
    /**
     * Format log with syntax highlighting
     */
    private formatLogWithSyntaxHighlighting;
    /**
     * Simple log formatting with minimal colors and better readability
     */
    private formatLogSimple;
    /**
     * Get summary for collapsed log group
     */
    private getLogGroupSummary;
    /**
     * Get border color for log pane based on severity
     */
    private getLogPaneBorderColor;
    /**
     * Toggle log group expansion
     */
    toggleLogGroup(testId: string): void;
    /**
     * Update log group state based on test status
     */
    private updateLogGroupState;
    /**
     * Count active agent interactions (individual runs, not just tests)
     */
    private countActiveInteractions;
    /**
     * Group multi-run tests together for cleaner display
     */
    private groupMultiRunTests;
}
//# sourceMappingURL=split-pane-display.d.ts.map