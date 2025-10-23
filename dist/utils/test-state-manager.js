"use strict";
/**
 * Test State Manager
 *
 * Single source of truth for all test states in the CLI interface.
 * Provides centralized state management with subscription-based updates.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestStateManager = void 0;
class TestStateManager {
    constructor(logService) {
        this.tests = new Map();
        this.listeners = new Set();
        this.testIdCounter = 0;
        this.logService = logService;
        this.metrics = {
            totalTests: 0,
            queued: 0,
            running: 0,
            evaluating: 0,
            completed: 0,
            failed: 0,
            apiCalls: 0,
            cacheHits: 0,
            startTime: new Date(),
            totalLLMCalls: 0,
            totalTokensUsed: 0,
            totalCost: 0,
        };
    }
    /**
     * Generate a unique test ID
     */
    generateTestId() {
        return `test-${Date.now()}-${++this.testIdCounter}`;
    }
    /**
     * Create a new test
     */
    createTest(agentName, dimension, inputIndex, input, runIndex) {
        const id = this.generateTestId();
        const test = {
            id,
            agentName,
            dimension,
            inputIndex,
            runIndex,
            input,
            status: 'queued',
        };
        this.tests.set(id, test);
        this.updateMetrics();
        this.notifyTestUpdate(test);
        return id;
    }
    /**
     * Create a new test with a specific ID (for orchestrator integration)
     */
    createTestWithId(id, agentName, dimension, inputIndex, input, runIndex) {
        const test = {
            id,
            agentName,
            dimension,
            inputIndex,
            runIndex,
            input,
            status: 'queued',
        };
        this.tests.set(id, test);
        this.updateMetrics();
        this.notifyTestUpdate(test);
    }
    /**
     * Update a test's state
     */
    updateTest(id, updates) {
        const test = this.tests.get(id);
        if (!test) {
            console.warn(`Test ${id} not found for update`);
            return;
        }
        // Track status transitions for metrics
        const oldStatus = test.status;
        // Apply updates
        Object.assign(test, updates);
        // Update timestamps
        if (updates.status === 'running' && !test.startTime) {
            test.startTime = new Date();
        }
        if (updates.status === 'evaluating' && !test.evaluationStartTime) {
            test.evaluationStartTime = new Date();
        }
        if ((updates.status === 'completed' || updates.status === 'failed')) {
            if (!test.endTime) {
                test.endTime = new Date();
                if (test.startTime) {
                    test.latencyMs = test.endTime.getTime() - test.startTime.getTime();
                }
            }
            if (test.evaluationStartTime && !test.evaluationEndTime) {
                test.evaluationEndTime = new Date();
                test.evaluationLatencyMs = test.evaluationEndTime.getTime() - test.evaluationStartTime.getTime();
            }
        }
        // Update LLM metrics if provided
        if (updates.llmTokensUsed) {
            this.metrics.totalTokensUsed += updates.llmTokensUsed;
            this.metrics.totalLLMCalls++;
        }
        if (updates.llmCost) {
            this.metrics.totalCost += updates.llmCost;
        }
        // Update metrics if status changed
        if (oldStatus !== test.status) {
            this.updateMetrics();
        }
        this.notifyTestUpdate(test);
    }
    /**
     * Get a test by ID
     */
    getTest(id) {
        return this.tests.get(id);
    }
    /**
     * Get all tests
     */
    getAllTests() {
        return Array.from(this.tests.values());
    }
    /**
     * Get tests by status
     */
    getTestsByStatus(status) {
        return this.getAllTests().filter(test => test.status === status);
    }
    /**
     * Get running tests for live display
     */
    getRunningTests() {
        return this.getTestsByStatus('running');
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Remove a test by ID
     */
    removeTest(id) {
        const test = this.tests.get(id);
        if (test) {
            this.tests.delete(id);
            this.updateMetrics();
        }
    }
    /**
     * Update API call metrics
     */
    recordApiCall() {
        this.metrics.apiCalls++;
        this.notifyMetricsUpdate();
    }
    /**
     * Update cache hit metrics
     */
    recordCacheHit() {
        this.metrics.cacheHits++;
        this.notifyMetricsUpdate();
    }
    /**
     * Update evaluation progress
     */
    updateEvaluationProgress(id, progress, tokensUsed, cost) {
        const test = this.tests.get(id);
        if (!test)
            return;
        this.updateTest(id, {
            status: 'evaluating',
            evaluationProgress: progress,
            llmTokensUsed: tokensUsed,
            llmCost: cost
        });
    }
    /**
     * Update multi-run progress
     */
    updateMultiRunProgress(id, completed, total, evaluating = false) {
        const test = this.tests.get(id);
        if (!test)
            return;
        this.updateTest(id, {
            multiRunProgress: {
                completed,
                total,
                evaluating
            }
        });
    }
    /**
     * Add a log entry
     */
    addLog(message, level = 'info') {
        // Emit to UI listeners
        this.listeners.forEach(listener => {
            if (listener.onLog) {
                listener.onLog(message, level);
            }
        });
        // Save to file if log service is enabled
        if (this.logService && this.logService.isEnabled && this.logService.isEnabled()) {
            this.logService.log(message, level);
        }
    }
    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }
    /**
     * Clear all tests and reset state
     */
    reset() {
        this.tests.clear();
        this.testIdCounter = 0;
        this.metrics = {
            totalTests: 0,
            queued: 0,
            running: 0,
            evaluating: 0,
            completed: 0,
            failed: 0,
            apiCalls: 0,
            cacheHits: 0,
            startTime: new Date(),
            totalLLMCalls: 0,
            totalTokensUsed: 0,
            totalCost: 0,
        };
        this.notifyMetricsUpdate();
    }
    /**
     * Get test tree structure for display
     */
    getTestTree() {
        const agents = new Map();
        for (const test of this.tests.values()) {
            if (!agents.has(test.agentName)) {
                agents.set(test.agentName, {
                    id: test.agentName,
                    name: test.agentName,
                    type: 'agent',
                    status: 'queued',
                    children: new Map(),
                });
            }
            const agent = agents.get(test.agentName);
            const dimensionKey = `${test.agentName}-${test.dimension}`;
            if (!agent.children.has(dimensionKey)) {
                agent.children.set(dimensionKey, {
                    id: dimensionKey,
                    name: test.dimension,
                    type: 'dimension',
                    status: 'queued',
                    children: [],
                });
            }
            const dimension = agent.children.get(dimensionKey);
            // For consistency tests, create individual run entries
            if (test.dimension === 'consistency' && test.runIndex !== undefined) {
                dimension.children.push({
                    id: test.id,
                    name: `Input ${test.inputIndex + 1} (Run ${test.runIndex + 1}/3)`,
                    type: 'input',
                    status: test.status,
                    test: test,
                });
            }
            else if (test.dimension !== 'consistency' || test.runIndex === undefined) {
                // For non-consistency tests or consistency tests without runIndex
                dimension.children.push({
                    id: test.id,
                    name: `Input ${test.inputIndex + 1}`,
                    type: 'input',
                    status: test.status,
                    test: test,
                });
            }
        }
        // Convert maps to arrays and update parent statuses
        const result = Array.from(agents.values()).map(agent => {
            agent.children = Array.from(agent.children.values()).map((dimension) => {
                // Update dimension status based on children
                const children = dimension.children;
                const allCompleted = children.every((c) => c.status === 'completed');
                const anyFailed = children.some((c) => c.status === 'failed');
                const anyRunning = children.some((c) => c.status === 'running');
                if (anyFailed)
                    dimension.status = 'failed';
                else if (allCompleted && children.length > 0)
                    dimension.status = 'completed';
                else if (anyRunning)
                    dimension.status = 'running';
                return dimension;
            });
            // Update agent status based on dimensions
            const dimensions = agent.children;
            const allCompleted = agent.dimensions.every((p) => p.status === 'completed');
            const anyFailed = agent.dimensions.some((p) => p.status === 'failed');
            const anyRunning = agent.dimensions.some((p) => p.status === 'running');
            if (anyFailed)
                agent.status = 'failed';
            else if (allCompleted && agent.dimensions.length > 0)
                agent.status = 'completed';
            else if (anyRunning)
                agent.status = 'running';
            return agent;
        });
        return result;
    }
    /**
     * Update metrics based on current test states
     * Count only actual tests (parent tests + single tests), not individual runs
     */
    updateMetrics() {
        const allTests = this.getAllTests();
        // Get parent tests for proper counting
        const parentTests = this.getParentTests();
        // Count only parent tests and single tests (not individual runs)
        const countableTests = allTests.filter(test => !test.id.includes('-run'));
        this.metrics.totalTests = countableTests.length;
        this.metrics.queued = countableTests.filter(t => t.status === 'queued').length;
        this.metrics.running = countableTests.filter(t => t.status === 'running').length;
        this.metrics.evaluating = countableTests.filter(t => t.status === 'evaluating').length;
        this.metrics.completed = countableTests.filter(t => t.status === 'completed').length;
        this.metrics.failed = countableTests.filter(t => t.status === 'failed').length;
        // Calculate average evaluation time from all tests (including runs for accuracy)
        const evaluatedTests = allTests.filter(t => t.evaluationLatencyMs);
        if (evaluatedTests.length > 0) {
            const totalEvalTime = evaluatedTests.reduce((sum, t) => sum + (t.evaluationLatencyMs || 0), 0);
            this.metrics.averageEvaluationTime = totalEvalTime / evaluatedTests.length;
        }
        this.notifyMetricsUpdate();
    }
    /**
     * Get parent tests for evaluation tracking
     * Returns virtual parent tests based on individual runs
     */
    getParentTests() {
        const tests = this.getAllTests();
        const parentTestMap = new Map();
        const singleTests = [];
        // Group tests by parent ID
        for (const test of tests) {
            if (test.id.includes('-run')) {
                // This is an individual run - group by parent ID
                const parentId = test.id.replace(/-run\d+$/, '');
                if (!parentTestMap.has(parentId)) {
                    parentTestMap.set(parentId, []);
                }
                parentTestMap.get(parentId).push(test);
            }
            else {
                // This is a single test
                singleTests.push(test);
            }
        }
        const parentTests = [];
        // Create parent test entries for multi-run tests
        for (const [parentId, runs] of parentTestMap) {
            const status = this.getParentTestStatus(parentId, tests);
            parentTests.push({ id: parentId, status, runs });
        }
        // Add single tests as their own "parent" tests
        for (const singleTest of singleTests) {
            parentTests.push({
                id: singleTest.id,
                status: singleTest.status,
                runs: [singleTest]
            });
        }
        return parentTests;
    }
    /**
     * Get the status of a parent test based on its individual runs
     */
    getParentTestStatus(parentId, allTests) {
        const runs = allTests.filter(t => t.id.startsWith(parentId + '-run'));
        if (runs.length === 0) {
            return 'queued';
        }
        // If any run is evaluating, parent is evaluating
        if (runs.some(r => r.status === 'evaluating')) {
            return 'evaluating';
        }
        // If any run is running, parent is running
        if (runs.some(r => r.status === 'running')) {
            return 'running';
        }
        // If all runs are completed or failed, parent is completed/failed based on majority
        const completedRuns = runs.filter(r => r.status === 'completed');
        const failedRuns = runs.filter(r => r.status === 'failed');
        const totalFinished = completedRuns.length + failedRuns.length;
        if (totalFinished === runs.length) {
            // All runs finished - determine parent status
            return completedRuns.length >= failedRuns.length ? 'completed' : 'failed';
        }
        // Default to queued if not all runs are finished
        return 'queued';
    }
    /**
     * Create or update a parent test state for multi-run tests
     * This ensures parent tests appear in the evaluating/completed groups
     */
    createOrUpdateParentTest(parentId, agentName, dimension, input, status) {
        // Check if parent test already exists
        let parentTest = this.tests.get(parentId);
        if (!parentTest) {
            // Create virtual parent test
            parentTest = {
                id: parentId,
                agentName,
                dimension,
                inputIndex: 0, // Will be updated based on runs
                input,
                status,
                isMultiRun: true,
            };
            this.tests.set(parentId, parentTest);
        }
        else {
            // Update existing parent test status
            this.updateTest(parentId, { status });
        }
    }
    /**
     * Check if all runs for a parent test are complete and update parent status
     */
    checkAndUpdateParentTestStatus(parentId) {
        const allTests = this.getAllTests();
        const runs = allTests.filter(t => t.id.startsWith(parentId + '-run'));
        if (runs.length === 0)
            return;
        // Get expected run count from first run
        const expectedRuns = runs[0]?.totalRuns || 3;
        const completedRuns = runs.filter(r => r.status === 'completed' || r.status === 'failed');
        if (completedRuns.length >= expectedRuns) {
            // All runs complete - parent should be evaluating
            const firstRun = runs[0];
            this.createOrUpdateParentTest(parentId, firstRun.agentName, firstRun.dimension, firstRun.input, 'evaluating');
            // Make parent test visible when it transitions to evaluating
            this.updateTest(parentId, { visibleInQueue: true });
        }
    }
    /**
     * Transition parent test to evaluating state and make it visible
     */
    transitionParentToEvaluating(parentId) {
        const parentTest = this.getTest(parentId);
        if (parentTest && parentTest.isParentTest) {
            this.updateTest(parentId, {
                status: 'evaluating',
                visibleInQueue: true, // Make visible when evaluating
                evaluationStartTime: new Date()
            });
        }
    }
    /**
     * Complete parent test evaluation
     */
    completeParentTestEvaluation(parentId, success, result) {
        const parentTest = this.getTest(parentId);
        if (parentTest && parentTest.isParentTest) {
            this.updateTest(parentId, {
                status: success ? 'completed' : 'failed',
                result: result?.output || result,
                llmEvaluation: result?.llmEvaluation, // Store LLM evaluation with criterion-level details
                endTime: new Date(),
                evaluationEndTime: new Date()
            });
        }
    }
    /**
     * Get tests for queue display (excludes hidden parent tests)
     */
    getQueueDisplayTests() {
        return this.getAllTests().filter(test => test.status === 'queued' && (!test.isParentTest || test.visibleInQueue === true));
    }
    /**
     * Get tests for evaluating display (parent tests and single tests only)
     */
    getEvaluatingDisplayTests() {
        return this.getAllTests().filter(test => test.status === 'evaluating' && (test.isParentTest || !test.id.includes('-run')));
    }
    /**
     * Get tests for completed display (parent tests and single tests only)
     */
    getCompletedDisplayTests() {
        return this.getAllTests().filter(test => (test.status === 'completed' || test.status === 'failed') &&
            (test.isParentTest || !test.id.includes('-run')));
    }
    /**
     * Notify listeners of test updates
     */
    notifyTestUpdate(test) {
        this.listeners.forEach(listener => {
            if (listener.onTestUpdate) {
                listener.onTestUpdate(test);
            }
        });
    }
    /**
     * Notify listeners of metrics updates
     */
    notifyMetricsUpdate() {
        this.listeners.forEach(listener => {
            if (listener.onMetricsUpdate) {
                listener.onMetricsUpdate(this.getMetrics());
            }
        });
    }
}
exports.TestStateManager = TestStateManager;
//# sourceMappingURL=test-state-manager.js.map