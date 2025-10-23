/**
 * Test Execution Service - Unified test execution logic
 *
 * Extracts test execution functionality from interactive mode to be shared
 * between interactive and standalone commands.
 */
import { TestStateManager } from '../utils/test-state-manager';
import type { TestResults } from '@identro/eval-core';
export interface TestExecutionOptions {
    projectPath: string;
    entityNames?: string[];
    dimensions?: string[];
    llmConfig?: any;
    splitPane?: boolean;
    maxConcurrency?: number;
    generateMissing?: boolean;
    onProgress?: (completed: number, total: number) => void;
    onTestComplete?: (testId: string, result: any) => void;
    onError?: (error: Error) => void;
}
export interface TestExecutionResult {
    results: Map<string, TestResults>;
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    successRate: number;
    duration: number;
    testStateManager: TestStateManager;
}
export declare class TestExecutionService {
    /**
     * Execute tests using SimplifiedTestRunner
     */
    executeTests(options: TestExecutionOptions): Promise<TestExecutionResult>;
    /**
     * Generate missing tests before execution
     */
    private generateMissingTests;
    /**
     * Initialize LLM provider from config
     */
    private initializeLLMProvider;
    /**
     * Build TestResults from TestStateManager data
     */
    private buildResultsFromStateManager;
    /**
     * Get execution summary for display
     */
    getExecutionSummary(result: TestExecutionResult): {
        successRate: number;
        averageLatency: number;
        totalDuration: number;
        entitiesTested: number;
        hasFailures: boolean;
    };
}
//# sourceMappingURL=test-execution-service.d.ts.map