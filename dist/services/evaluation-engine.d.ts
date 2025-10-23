/**
 * Evaluation Engine Service
 * Manages the core evaluation engine instance and framework adapters
 */
import { EvaluationEngine, type EvalSpec, type TestResults, type ExtractedContract } from '@identro/eval-core';
import type { Config } from '../utils/config';
/**
 * Singleton evaluation engine service
 */
export declare class EvaluationEngineService {
    private static instance;
    private engine;
    private initialized;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): EvaluationEngineService;
    /**
     * Initialize the engine with adapters
     */
    initialize(config?: Config): Promise<void>;
    /**
     * Get the evaluation engine
     */
    getEngine(): EvaluationEngine;
    /**
     * Detect framework in project
     */
    detectFramework(projectPath: string): Promise<string | null>;
    /**
     * Discover agents in project
     */
    discoverAgents(projectPath: string, framework?: string): Promise<{
        framework: string;
        agents: import("@identro/eval-core").AgentInfo[];
    }>;
    /**
     * Analyze an agent
     */
    analyzeAgent(agentPath: string, framework: string): Promise<import("@identro/eval-core").AgentSpec>;
    /**
     * Run tests for agents
     */
    runTests(projectPath: string, evalSpec: EvalSpec, options?: {
        agentName?: string;
        dimension?: string;
        quick?: boolean;
        cache?: any;
        progress?: any;
        parallel?: number;
    }): Promise<Map<string, TestResults>>;
    /**
     * Generate report from test results
     */
    generateReport(results: Map<string, TestResults>, format?: 'text' | 'json' | 'html' | 'markdown'): string;
    /**
     * Extract contract from an agent
     */
    extractContract(agentPath: string, framework: string): Promise<ExtractedContract>;
    /**
     * Extract contract from CrewAI agent
     */
    private extractCrewAIContract;
    /**
     * Extract contract from LangChain agent
     */
    private extractLangChainContract;
    /**
     * Create or load eval spec for a project
     */
    createEvalSpec(projectPath: string, config: Config): Promise<EvalSpec>;
}
export declare function getEvaluationEngine(): EvaluationEngineService;
//# sourceMappingURL=evaluation-engine.d.ts.map