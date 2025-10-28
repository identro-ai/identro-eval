/**
 * LangChain Framework Adapter
 *
 * Main adapter implementation that provides the interface between
 * Identro Eval and LangChain projects. This adapter:
 * - Detects LangChain usage
 * - Discovers agents
 * - Analyzes agent capabilities
 * - Runs evaluation tests
 */
import { FrameworkAdapter, AgentInfo, AgentSpec, TestContext, TestResults, LLMConfig } from '@identro/eval-core';
/**
 * LangChain adapter implementation
 */
export declare class LangChainAdapter implements FrameworkAdapter {
    name: "langchain";
    supportedLanguages: ('python' | 'typescript' | 'javascript')[];
    private promptExtractor;
    private contractAnalyzer;
    constructor();
    /**
     * Configure the adapter with LLM settings
     */
    configure(llmConfig: LLMConfig): void;
    /**
     * Detect if LangChain is used in the project
     */
    detect(projectPath: string): Promise<boolean>;
    /**
     * Discover all agents in the project
     */
    discoverAgents(projectPath: string): Promise<AgentInfo[]>;
    /**
     * Analyze a specific agent to create evaluation spec
     *
     * This uses a combination of static analysis and LLM-based understanding
     * to determine the agent's capabilities and requirements.
     */
    analyzeAgent(agentPath: string): Promise<AgentSpec>;
    /**
     * Convert schema definition to agent spec format
     */
    private convertSchemaToAgentSpec;
    /**
     * Run evaluation tests on an agent
     */
    runTests(agent: AgentInfo, spec: AgentSpec, context: TestContext): Promise<TestResults>;
    /**
     * Detect LLM configuration in the project
     */
    detectLLMConfig(projectPath: string): Promise<LLMConfig>;
    /**
     * Validate the framework setup
     */
    validate(projectPath: string): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    /**
     * Run a single test on an agent
     */
    private runSingleTest;
    /**
     * Generate sample inputs based on agent type
     */
    private generateSampleInputs;
    /**
     * Determine expected output type based on agent type
     */
    private determineOutputType;
    /**
     * Calculate consistency results
     */
    private calculateConsistency;
    /**
     * Calculate safety results
     */
    private calculateSafety;
    /**
     * Calculate performance results
     */
    private calculatePerformance;
    /**
     * Calculate schema compliance
     */
    private calculateSchemaCompliance;
}
//# sourceMappingURL=adapter.d.ts.map