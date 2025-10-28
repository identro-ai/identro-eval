/**
 * Contract analyzer for intelligent test generation
 *
 * Uses LLM providers to analyze agent contracts and generate
 * specific, meaningful test cases based on actual capabilities.
 */
import { ExtractedContract, AnalysisInput, ContractAnalysis, GeneratedTestCase, TestSpecification, ExtractedPrompts } from './types';
import { LLMProvider, LLMProviderConfig } from './llm-provider';
/**
 * Contract analyzer configuration
 */
export interface ContractAnalyzerConfig {
    /** LLM provider to use */
    provider?: 'openai' | 'anthropic';
    /** LLM provider configuration */
    providerConfig?: LLMProviderConfig;
    /** Number of test cases to generate per agent */
    testsPerAgent?: number;
    /** Minimum confidence threshold */
    minConfidence?: number;
    /** Enable verbose logging */
    verbose?: boolean;
}
/**
 * Main contract analyzer class
 */
export declare class ContractAnalyzer {
    private llmProvider;
    private config;
    constructor(config?: ContractAnalyzerConfig);
    /**
     * Analyze a contract from analysis input
     *
     * @param input - Analysis input with prompts and context
     * @returns Contract analysis with test cases
     */
    analyzeContract(input: AnalysisInput): Promise<ContractAnalysis>;
    /**
     * Analyze contracts from extracted prompts
     *
     * @param prompts - Extracted prompts from framework
     * @param framework - Framework name
     * @returns Contract analysis
     */
    analyzeFromPrompts(prompts: ExtractedPrompts, framework: string): Promise<ContractAnalysis>;
    /**
     * Generate test cases from a contract
     *
     * @param contract - Extracted contract
     * @param count - Number of tests to generate
     * @returns Generated test cases
     */
    generateTestCases(contract: ExtractedContract, count?: number): Promise<GeneratedTestCase[]>;
    /**
     * Generate a test specification for an agent
     *
     * @param agentName - Name of the agent
     * @param analysis - Contract analysis
     * @param framework - Framework being used
     * @returns Test specification
     */
    generateTestSpecification(agentName: string, analysis: ContractAnalysis, framework: string): TestSpecification;
    /**
     * Suggest evaluation dimensions based on contract
     *
     * @param contract - Extracted contract
     * @returns Suggested dimension names
     */
    private suggestDimensions;
    /**
     * Generate contract-specific test cases
     *
     * @param contract - Extracted contract
     * @returns Additional test cases
     */
    private generateContractSpecificTests;
    /**
     * Deduplicate test cases by name
     *
     * @param tests - Test cases to deduplicate
     * @returns Unique test cases
     */
    private deduplicateTests;
    /**
     * Validate a contract meets minimum requirements
     *
     * @param contract - Contract to validate
     * @returns True if valid
     */
    validateContract(contract: ExtractedContract): boolean;
    /**
     * Get the LLM provider being used
     *
     * @returns Current LLM provider
     */
    getProvider(): LLMProvider;
    /**
     * Set a new LLM provider
     *
     * @param provider - New provider to use
     */
    setProvider(provider: LLMProvider): void;
}
/**
 * Create a contract analyzer instance
 *
 * @param config - Analyzer configuration
 * @returns Contract analyzer
 */
export declare function createContractAnalyzer(config?: ContractAnalyzerConfig): ContractAnalyzer;
//# sourceMappingURL=contract-analyzer.d.ts.map