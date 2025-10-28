/**
 * Simplified Test Runner
 *
 * Single source of truth for test execution without competing orchestrators.
 * Uses TestStateManager as the main controller with direct LLM evaluation.
 */
import type { TestSpec, LLMProvider, TeamEntity, DimensionDefinition } from '@identro/eval-core';
import type { TestStateManager } from './test-state-manager';
import type { FrameworkAdapter } from '@identro/eval-core';
import type { ConfigManager } from '@identro/eval-core';
export interface SimplifiedTestRunnerConfig {
    maxConcurrency: number;
    maxLLMCalls: number;
    timeoutMs: number;
    retryEnabled: boolean;
    maxRetries: number;
    retryDelayMs: number;
}
export interface TestExecutionContext {
    projectPath: string;
    cache?: any;
    splitPane?: {
        addLog: (message: string, level: 'info' | 'success' | 'error' | 'warning' | 'debug') => void;
        updateMetrics: (apiCall: boolean, cacheHit: boolean) => void;
    };
}
export declare class SimplifiedTestRunner {
    private testStateManager;
    private llmProvider;
    private config;
    private configManager?;
    private dimensionRegistry?;
    private activeLLMEvaluations;
    private llmEvaluationQueue;
    constructor(testStateManager: TestStateManager, llmProvider: LLMProvider | null, config: SimplifiedTestRunnerConfig, configManager?: ConfigManager | undefined, dimensionRegistry?: {
        getDimension: (name: string) => Promise<DimensionDefinition>;
    } | undefined);
    /**
     * Run all tests with proper queue-based concurrency control
     */
    runAllTests(testSpecs: TestSpec[], adapter: FrameworkAdapter, context: TestExecutionContext): Promise<void>;
    /**
     * Run team tests with proper queue-based concurrency control
     * CRITICAL: Teams now use pre-generated test inputs from session (same as agents)
     */
    runTeamTests(teams: TeamEntity[], dimensions: string[], adapter: FrameworkAdapter, context: TestExecutionContext, teamTestInputs?: any): Promise<void>;
    /**
     * Fallback team inputs (only used if LLM generation failed)
     */
    private getFallbackTeamInputs;
    /**
     * Generate test inputs for teams using LLM (NO STATIC CONTENT)
     */
    private generateTeamTestInputs;
    /**
     * Generate structured team inputs (fallback when LLM fails, but still no static content)
     */
    private generateStructuredTeamInputs;
    /**
     * Normalize evaluation criteria to EvaluationCriterion[] format
     * Converts old string[] format to new EvaluationCriterion[] format while preserving all fields
     */
    private normalizeCriteria;
    /**
     * Generate evaluation criteria for teams (team-specific, not agent criteria)
     * Returns EvaluationCriterion[] for new format
     *
     * Now uses generic team criteria - dimension-specific evaluation comes from
     * dimension definition files which are already used in LLM evaluation.
     */
    private generateTeamEvaluationCriteria;
    /**
     * Run a single test with direct state management
     */
    private runSingleTest;
    /**
     * Execute test using adapter's simple interface
     */
    private executeTest;
    /**
     * Execute test using adapter - simplified interface
     */
    private executeWithAdapter;
    /**
     * Queue LLM evaluation with concurrency control
     */
    private queueLLMEvaluation;
    /**
     * Process LLM evaluation queue with concurrency control
     */
    private processLLMEvaluationQueue;
    /**
     * LLM evaluation with proper state management
     * UPDATED: Load dimension config from eval.config.yml and dimension definition for prompts
     */
    private evaluateTest;
    /**
     * Determine if a test should be evaluated
     */
    private shouldEvaluateTest;
    /**
     * Generate cache key for test
     */
    private generateCacheKey;
    /**
     * Extract the first failed criterion text from evaluation result
     */
    private extractFailedCriterion;
}
//# sourceMappingURL=simplified-test-runner.d.ts.map