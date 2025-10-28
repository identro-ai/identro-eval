/**
 * CrewAI Adapter - Simplified Architecture
 *
 * Direct execution without internal orchestration.
 * Works with TestStateManager as single source of truth.
 *
 * This replaces the OrchestratedCrewAIAdapter to eliminate double orchestration.
 */
import type { FrameworkAdapter, AgentInfo, AgentSpec, TestContext, TestResults, TestSpec, TeamEntity, TeamExecutionResult } from '@identro/eval-core';
export interface FlowTestSpec extends TestSpec {
    syntheticInputs?: Record<string, any>;
    flowMetadata?: {
        isFlowTest?: boolean;
        flowName?: string;
        estimatedDuration?: number;
        captureArtifacts?: boolean;
        artifactDirectory?: string;
        dryRunIntegrations?: boolean;
    };
}
export interface SimpleTestContext {
    projectPath: string;
    timeoutMs: number;
    splitPane?: {
        addLog: (message: string, level: 'info' | 'success' | 'error' | 'warning' | 'debug') => void;
    };
}
export declare class CrewAIAdapter implements FrameworkAdapter {
    name: "crewai";
    supportedLanguages: ("python" | "typescript" | "javascript")[];
    private processPool;
    private readonly maxProcessAge;
    private cleanupInterval;
    detect(projectPath: string): Promise<boolean>;
    discoverAgents(projectPath: string): Promise<AgentInfo[]>;
    /**
     * Enhanced agent type inference using tools and role
     */
    private inferAgentTypeEnhanced;
    analyzeAgent(agentPath: string): Promise<AgentSpec>;
    /**
     * NEW: Simple test execution method for SimplifiedTestRunner
     * Enhanced to support flow execution with synthetic inputs
     */
    executeTest(testSpec: TestSpec, context: SimpleTestContext): Promise<string>;
    /**
     * Execute flow with synthetic input injection
     */
    private executeFlow;
    /**
     * Legacy method for backward compatibility - simplified without orchestration
     */
    runTests(agent: AgentInfo, spec: AgentSpec, context: TestContext & {
        dimensions?: string[];
        splitPane?: any;
        cache?: any;
        quick?: boolean;
        progress?: any;
        testStateManager?: any;
        config?: any;
        evalSpec?: any;
    }): Promise<TestResults>;
    private executeCrewAI;
    private getOrCreatePythonProcess;
    /**
     * Find the correct Python interpreter for the project
     * Checks for virtual environments in order of preference
     * Caches result for performance
     */
    private findPythonInterpreter;
    /**
     * Load cached Python path if valid
     */
    private loadCachedPythonPath;
    /**
     * Cache Python path for future runs
     */
    private cachePythonPath;
    private startCleanupInterval;
    cleanup(): Promise<void>;
    private inferAgentType;
    detectLLMConfig(projectPath: string): Promise<Record<string, any>>;
    validate(projectPath: string): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    /**
     * Discover teams/crews in the project (teams/crews ONLY, NOT flows)
     */
    discoverTeams(projectPath: string): Promise<TeamEntity[]>;
    /**
     * Discover teams with detailed statistics
     */
    discoverTeamsWithDetails(projectPath: string): Promise<import("@identro/eval-core").TeamDiscoveryResult>;
    /**
     * NEW: Discover flows separately with complete Phase 1 & 2 analysis
     */
    discoverFlows(projectPath: string): Promise<any[]>;
    /**
     * Execute a team/crew test
     */
    executeTeam(team: TeamEntity, input: any, context: SimpleTestContext): Promise<TeamExecutionResult>;
    /**
     * Get or create a Python process specifically for team execution
     */
    private getOrCreateTeamProcess;
}
//# sourceMappingURL=adapter.d.ts.map