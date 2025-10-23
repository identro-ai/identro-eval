/**
 * Test State Manager
 *
 * Single source of truth for all test states in the CLI interface.
 * Provides centralized state management with subscription-based updates.
 */
export type TestStatus = 'queued' | 'running' | 'evaluating' | 'completed' | 'failed';
export interface TestState {
    id: string;
    agentName: string;
    dimension: string;
    inputIndex: number;
    runIndex?: number;
    input: string;
    status: TestStatus;
    startTime?: Date;
    endTime?: Date;
    result?: any;
    error?: string;
    latencyMs?: number;
    evaluationStartTime?: Date;
    evaluationEndTime?: Date;
    evaluationProgress?: string;
    evaluationLatencyMs?: number;
    llmTokensUsed?: number;
    llmCost?: number;
    llmProvider?: string;
    evaluationCriteria?: string[];
    llmEvaluation?: any;
    isMultiRun?: boolean;
    totalRuns?: number;
    completedRuns?: number;
    multiRunProgress?: {
        completed: number;
        total: number;
        evaluating: boolean;
    };
    isParentTest?: boolean;
    visibleInQueue?: boolean;
    displayId?: string;
    displayName?: string;
    testDescription?: string;
    evalDescription?: string;
    resultExplanation?: string;
    failedCriterion?: string;
}
export interface TestMetrics {
    totalTests: number;
    queued: number;
    running: number;
    evaluating: number;
    completed: number;
    failed: number;
    apiCalls: number;
    cacheHits: number;
    startTime: Date;
    totalLLMCalls: number;
    totalTokensUsed: number;
    totalCost: number;
    averageEvaluationTime?: number;
}
export interface TestStateListener {
    onTestUpdate?: (test: TestState) => void;
    onMetricsUpdate?: (metrics: TestMetrics) => void;
    onLog?: (message: string, level: 'info' | 'success' | 'error' | 'warning' | 'debug') => void;
}
export declare class TestStateManager {
    private tests;
    private listeners;
    private metrics;
    private testIdCounter;
    private logService?;
    constructor(logService?: any);
    /**
     * Generate a unique test ID
     */
    generateTestId(): string;
    /**
     * Create a new test
     */
    createTest(agentName: string, dimension: string, inputIndex: number, input: string, runIndex?: number): string;
    /**
     * Create a new test with a specific ID (for orchestrator integration)
     */
    createTestWithId(id: string, agentName: string, dimension: string, inputIndex: number, input: string, runIndex?: number): void;
    /**
     * Update a test's state
     */
    updateTest(id: string, updates: Partial<TestState>): void;
    /**
     * Get a test by ID
     */
    getTest(id: string): TestState | undefined;
    /**
     * Get all tests
     */
    getAllTests(): TestState[];
    /**
     * Get tests by status
     */
    getTestsByStatus(status: TestStatus): TestState[];
    /**
     * Get running tests for live display
     */
    getRunningTests(): TestState[];
    /**
     * Get current metrics
     */
    getMetrics(): TestMetrics;
    /**
     * Remove a test by ID
     */
    removeTest(id: string): void;
    /**
     * Update API call metrics
     */
    recordApiCall(): void;
    /**
     * Update cache hit metrics
     */
    recordCacheHit(): void;
    /**
     * Update evaluation progress
     */
    updateEvaluationProgress(id: string, progress: string, tokensUsed?: number, cost?: number): void;
    /**
     * Update multi-run progress
     */
    updateMultiRunProgress(id: string, completed: number, total: number, evaluating?: boolean): void;
    /**
     * Add a log entry
     */
    addLog(message: string, level?: 'info' | 'success' | 'error' | 'warning' | 'debug'): void;
    /**
     * Subscribe to state changes
     */
    subscribe(listener: TestStateListener): () => void;
    /**
     * Clear all tests and reset state
     */
    reset(): void;
    /**
     * Get test tree structure for display
     */
    getTestTree(): any[];
    /**
     * Update metrics based on current test states
     * Count only actual tests (parent tests + single tests), not individual runs
     */
    private updateMetrics;
    /**
     * Get parent tests for evaluation tracking
     * Returns virtual parent tests based on individual runs
     */
    getParentTests(): Array<{
        id: string;
        status: TestStatus;
        runs: TestState[];
    }>;
    /**
     * Get the status of a parent test based on its individual runs
     */
    private getParentTestStatus;
    /**
     * Create or update a parent test state for multi-run tests
     * This ensures parent tests appear in the evaluating/completed groups
     */
    createOrUpdateParentTest(parentId: string, agentName: string, dimension: string, input: string, status: TestStatus): void;
    /**
     * Check if all runs for a parent test are complete and update parent status
     */
    checkAndUpdateParentTestStatus(parentId: string): void;
    /**
     * Transition parent test to evaluating state and make it visible
     */
    transitionParentToEvaluating(parentId: string): void;
    /**
     * Complete parent test evaluation
     */
    completeParentTestEvaluation(parentId: string, success: boolean, result?: any): void;
    /**
     * Get tests for queue display (excludes hidden parent tests)
     */
    getQueueDisplayTests(): TestState[];
    /**
     * Get tests for evaluating display (parent tests and single tests only)
     */
    getEvaluatingDisplayTests(): TestState[];
    /**
     * Get tests for completed display (parent tests and single tests only)
     */
    getCompletedDisplayTests(): TestState[];
    /**
     * Notify listeners of test updates
     */
    private notifyTestUpdate;
    /**
     * Notify listeners of metrics updates
     */
    private notifyMetricsUpdate;
}
//# sourceMappingURL=test-state-manager.d.ts.map