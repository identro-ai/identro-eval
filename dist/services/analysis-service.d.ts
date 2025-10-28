/**
 * Analysis Service - Unified agent and team analysis logic
 *
 * Extracts analysis functionality from interactive mode to be shared
 * between interactive and standalone commands.
 */
import type { EvalSpec } from '@identro/eval-core';
export interface AnalysisOptions {
    projectPath: string;
    agents?: any[];
    teams?: any[];
    flows?: any[];
    framework?: string;
    reanalyzeExisting?: string[];
    contractsOnly?: boolean;
}
export interface AnalysisResult {
    analyzedAgents: number;
    analyzedTeams: number;
    analyzedFlows: number;
    skippedAgents: number;
    skippedTeams: number;
    skippedFlows: number;
    evalSpec: EvalSpec;
    errors: Array<{
        entity: string;
        error: string;
    }>;
}
export declare class AnalysisService {
    /**
     * Analyze agents and teams, extracting contracts and capabilities
     */
    analyzeAll(options: AnalysisOptions): Promise<AnalysisResult>;
    /**
     * Analyze individual agents - ENHANCED with integration detection
     */
    private analyzeAgents;
    /**
     * Detect integrations for a single agent using crew-integration-detector
     */
    private detectAgentIntegrations;
    /**
     * Infer agent capabilities from integration metadata
     */
    private inferCapabilitiesFromIntegrations;
    /**
     * Extract required environment variables from integrations
     */
    private extractRequiredEnvVars;
    /**
     * Analyze teams/crews - CRITICAL FIX: Use updateTeam, not updateAgent
     */
    private analyzeTeams;
    /**
     * Analyze flows and populate evalSpec.flows with complete Phase 1 & 2 analysis
     */
    private analyzeFlows;
    /**
     * Extract contract from a single entity (agent or team)
     */
    extractContract(entityPath: string, framework: string): Promise<any>;
    /**
     * Check if eval spec exists and has agents
     */
    hasExistingAnalysis(projectPath: string): Promise<{
        exists: boolean;
        agentCount: number;
        teamCount: number;
        agents: string[];
        teams: string[];
    }>;
    /**
     * Get analysis summary for display
     */
    getAnalysisSummary(result: AnalysisResult): {
        totalAnalyzed: number;
        totalSkipped: number;
        totalErrors: number;
        hasErrors: boolean;
        successRate: number;
    };
}
//# sourceMappingURL=analysis-service.d.ts.map