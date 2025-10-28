/**
 * Test Generation Service - Unified LLM test generation logic
 *
 * Extracts test generation functionality from interactive mode to be shared
 * between interactive and standalone commands.
 */
import type { EvalSpec } from '@identro/eval-core';
export interface TestGenerationOptions {
    projectPath: string;
    entities: Array<{
        name: string;
        type: 'agent' | 'team' | 'flow';
        [key: string]: any;
    }>;
    dimensions: string[];
    evalSpec?: EvalSpec;
    llmConfig?: any;
    concurrency?: number;
    onProgress?: (completed: number, total: number, currentTask?: string) => void;
    onTaskComplete?: (taskName: string, duration: number) => void;
    onTaskError?: (taskName: string, error: Error) => void;
}
export interface TestGenerationResult {
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    totalTestsGenerated: number;
    evalSpec: EvalSpec;
    errors: Array<{
        task: string;
        error: string;
    }>;
}
export declare class TestGenerationService {
    /**
     * Generate tests for entities using LLM
     */
    generateTests(options: TestGenerationOptions): Promise<TestGenerationResult>;
    /**
     * Generate tests for an individual agent
     */
    private generateAgentTests;
    /**
     * Generate tests for a team/crew/flow
     */
    private generateTeamTests;
    /**
     * Generate tests for a flow (CrewAI workflows)
     */
    private generateFlowTests;
    /**
     * Get enhanced flow analysis for a team/flow
     */
    private getFlowAnalysis;
    /**
     * Build comprehensive flow contract from analysis
     */
    private buildFlowContract;
    /**
     * Build basic team structure for non-flow teams
     */
    private buildBasicTeamStructure;
    /**
     * Assess flow complexity for test generation
     */
    private assessFlowComplexity;
    /**
     * Generate default synthetic inputs for HITL points
     */
    private generateDefaultSyntheticInputs;
    /**
     * Build flow contract for test generation (ExtractedContract format)
     */
    private buildFlowContractForGeneration;
    /**
     * Initialize LLM provider from config
     */
    private initializeLLMProvider;
    /**
     * Discover LLM configuration
     */
    private discoverLLMConfig;
    /**
     * Check if tests already exist for entities and dimensions
     */
    checkExistingTests(projectPath: string, entityNames: string[], dimensions: string[]): Promise<{
        hasTests: boolean;
        missingTests: Array<{
            entity: string;
            dimension: string;
        }>;
        existingTests: Array<{
            entity: string;
            dimension: string;
            testCount: number;
        }>;
    }>;
    /**
     * Get generation summary for display
     */
    getGenerationSummary(result: TestGenerationResult): {
        successRate: number;
        averageTestsPerTask: number;
        hasErrors: boolean;
        totalEntities: number;
    };
}
//# sourceMappingURL=test-generation-service.d.ts.map