/**
 * Eval Spec Manager
 *
 * Core operations for managing the eval-spec.json living document
 * Handles loading, saving, versioning, and change detection
 */
import { EvalSpec, TestSpecification, DimensionTestSpecs } from '../types/eval-spec';
export interface ChangeDetectionResult {
    new: string[];
    modified: string[];
    unchanged: string[];
    removed: string[];
}
export interface AgentInfo {
    id: string;
    path: string;
    source: string;
    type?: string;
    description?: string;
}
export declare class EvalSpecManager {
    private identroPath;
    private specPath;
    private historyPath;
    constructor(projectPath: string);
    /**
     * Initialize the .identro directory structure
     */
    initialize(): Promise<void>;
    /**
     * Load the eval spec, creating a default if it doesn't exist
     */
    load(): Promise<EvalSpec>;
    /**
     * Save the eval spec with optional backup
     */
    save(spec: EvalSpec, options?: {
        backup?: boolean;
    }): Promise<void>;
    /**
     * Create a backup of the current spec
     */
    private createBackup;
    /**
     * Create a history snapshot
     */
    private createHistorySnapshot;
    /**
     * Clean up old history files
     */
    private cleanupHistory;
    /**
     * Create a default eval spec
     */
    private createDefault;
    /**
     * Generate a unique project ID
     */
    private generateProjectId;
    /**
     * Detect changes between current spec and discovered agents
     */
    detectChanges(spec: EvalSpec, discoveredAgents: AgentInfo[]): Promise<ChangeDetectionResult>;
    /**
     * Hash agent source code for change detection
     */
    private hashAgentSource;
    /**
     * Update agent in spec with new information
     */
    updateAgent(spec: EvalSpec, agentInfo: AgentInfo, contract?: any, testSpecs?: Record<string, DimensionTestSpecs>): Promise<void>;
    /**
     * Merge test specs, preserving user modifications
     */
    private mergeTestSpecs;
    /**
     * Update performance metrics after a test run
     */
    updatePerformance(spec: EvalSpec, agentId: string, dimension: string, score: number, passed: boolean, details?: any): Promise<void>;
    /**
     * Calculate performance trends
     */
    private calculateTrends;
    /**
     * Add a test run to history
     */
    addTestRun(spec: EvalSpec, runId: string, agentsTestedCount: number, dimensionsRun: string[], overallScore: number, duration: number, tokenUsage?: number, cost?: number): Promise<void>;
    /**
     * Get test specs for an agent and dimension
     */
    getTestSpecs(spec: EvalSpec, agentId: string, dimension: string): TestSpecification[];
    /**
     * Mark a test as user-modified
     */
    markTestAsModified(spec: EvalSpec, agentId: string, dimension: string, testId: string, notes?: string): void;
    /**
     * Update agent test specs with LLM-generated tests
     */
    updateAgentTestSpecs(spec: EvalSpec, agentId: string, testSpecs: Record<string, DimensionTestSpecs>): Promise<void>;
    /**
     * Update team in spec with new information
     */
    updateTeam(spec: EvalSpec, teamInfo: {
        name: string;
        members: string[];
        coordinator?: string;
        description?: string;
        path?: string;
    }, contract?: any, testSpecs?: Record<string, DimensionTestSpecs>): Promise<void>;
    /**
     * Update flow in spec with new information
     */
    updateFlow(spec: EvalSpec, flowInfo: {
        name: string;
        type: 'workflow';
        description?: string;
        path?: string;
    }, analysis?: any, testSpecs?: Record<string, DimensionTestSpecs>): Promise<void>;
    /**
     * Get performance summary for all agents
     */
    getPerformanceSummary(spec: EvalSpec): {
        totalAgents: number;
        averageScore: number;
        improving: number;
        degrading: number;
        stable: number;
    };
}
export default EvalSpecManager;
//# sourceMappingURL=eval-spec-manager.d.ts.map