/**
 * Enhanced LLM provider interface for contract analysis, test generation, and evaluation
 *
 * Supports multiple LLM providers (OpenAI, Anthropic, etc.)
 * for analyzing prompts, generating test cases, and evaluating results.
 */
import { ExtractedContract, AnalysisInput, GeneratedTestCase, SchemaDefinition } from './types';
/**
 * Team structure for LLM analysis
 */
export interface TeamStructure {
    name: string;
    process: string;
    agents: any[];
    tasks: any[];
    workflow: any;
}
/**
 * Dimension registry interface for plugin support
 */
export interface DimensionRegistry {
    getRequirements(dimensionName: string): Promise<string>;
    getAvailableDimensions(): Promise<string[]>;
}
/**
 * Enhanced test generation request (supports both agents and teams)
 */
export interface TestGenerationRequest {
    /** Agent contract (for individual agents) */
    contract?: ExtractedContract;
    /** Team structure (for teams) */
    structure?: TeamStructure;
    /** Dimension type */
    dimension: string;
    /** Number of tests to generate */
    count?: number;
    /** Additional context */
    context?: {
        framework: string;
        entityType?: 'agent' | 'team';
        agentType?: string;
        existingInputs?: any[];
        metadata?: Record<string, any>;
    };
}
/**
 * Enhanced test generation result (includes team contracts)
 */
export interface TestGenerationResult {
    tests: GeneratedTestCase[];
    contract?: ExtractedContract;
}
/**
 * Test evaluation request (Updated for semantic evaluation architecture)
 */
export interface TestEvaluationRequest {
    /** Original input */
    input: any;
    /** Agent output */
    output: any;
    /** Expected behavior/criteria */
    expected?: any;
    /** Dimension being tested */
    dimension: string;
    /** Agent contract for context */
    contract: ExtractedContract;
    /** NEW: Evaluation criteria as structured objects (v2.0) */
    criteria: Array<{
        criterion: string;
        evaluation_strictness?: number;
        special_instructions?: string;
    }>;
    /** NEW: Dimension config from eval.config.yml (for settings) */
    dimension_config?: {
        default_strictness?: number;
        passing_criteria_percentage?: number;
    };
    /** NEW: dimension definition (for prompts only) */
    dimension_definition?: any;
    /** NEW: Test-level threshold overrides */
    thresholds?: {
        passing_criteria_percentage?: number;
    };
}
/**
 * Test evaluation result
 */
export interface TestEvaluationResult {
    /** Overall score (0-1) */
    score: number;
    /** Pass/fail determination */
    passed: boolean;
    /** Detailed reasoning - can be string or structured object */
    reasoning: string | {
        criterionAnalysis?: Array<{
            criterion: string;
            met: boolean;
            evidence: string;
            score: number;
        }>;
        overallAssessment?: string;
        specificEvidence?: string[];
    };
    /** Specific issues found */
    issues: Array<{
        type: 'error' | 'warning' | 'info';
        message: string;
        severity: number;
    }>;
    /** Confidence in evaluation (0-1) */
    confidence: number;
    /** Suggestions for improvement */
    suggestions?: string[];
    /** Actionable recommendations */
    recommendations?: {
        ifFailed?: string[];
        forImprovement?: string[];
    };
}
/**
 * Batch processing support
 */
export interface BatchRequest<T> {
    requests: T[];
    maxConcurrency?: number;
    onProgress?: (completed: number, total: number) => void;
}
/**
 * Native tool types for Responses API
 */
export type NativeTool = {
    type: 'web_search';
} | {
    type: 'code_interpreter';
} | {
    type: 'file_search';
};
/**
 * LLM provider configuration
 */
export interface LLMProviderConfig {
    /** API key for the provider */
    apiKey?: string;
    /** Base URL for API calls */
    baseUrl?: string;
    /** Model to use */
    model?: string;
    /** Maximum tokens for responses */
    maxTokens?: number;
    /** Temperature for generation */
    temperature?: number;
    /** Request timeout in milliseconds */
    timeoutMs?: number;
    /** Enable caching of results */
    enableCache?: boolean;
    /** Cache TTL in seconds */
    cacheTtlSeconds?: number;
    /** Enable response storage (Responses API) */
    store?: boolean;
    /** Native tools to enable (Responses API) */
    tools?: NativeTool[];
}
/**
 * Analysis context for better results
 */
export interface AnalysisContext {
    /** Framework being analyzed */
    framework: string;
    /** Agent type if known */
    agentType?: string;
    /** Additional context */
    metadata?: Record<string, any>;
}
/**
 * Enhanced interface for LLM providers
 */
export interface LLMProvider {
    /** Provider name */
    name: string;
    /**
     * Analyze a prompt to extract contract
     *
     * @param input - Analysis input with prompts and context
     * @param context - Additional analysis context
     * @returns Extracted contract
     */
    analyzePrompt(input: AnalysisInput, context?: AnalysisContext): Promise<ExtractedContract>;
    /**
     * Generate test cases from a contract (legacy method)
     *
     * @param contract - Extracted contract
     * @param count - Number of test cases to generate
     * @returns Generated test cases
     */
    generateTests(contract: ExtractedContract, count?: number): Promise<GeneratedTestCase[]>;
    /**
     * Generate dimension-specific test cases
     *
     * @param request - Test generation request
     * @returns Generated test cases and optional contract
     */
    generateDimensionTests(request: TestGenerationRequest): Promise<TestGenerationResult>;
    /**
     * Evaluate a test result
     *
     * @param request - Test evaluation request
     * @returns Evaluation result
     */
    evaluateTestResult(request: TestEvaluationRequest): Promise<TestEvaluationResult>;
    /**
     * Batch generate tests for multiple dimensions
     *
     * @param requests - Batch of test generation requests
     * @returns Generated test cases for each request
     */
    batchGenerateTests(requests: BatchRequest<TestGenerationRequest>): Promise<GeneratedTestCase[][]>;
    /**
     * Batch evaluate test results
     *
     * @param requests - Batch of evaluation requests
     * @returns Evaluation results for each request
     */
    batchEvaluateResults(requests: BatchRequest<TestEvaluationRequest>): Promise<TestEvaluationResult[]>;
    /**
     * Infer schema from examples
     *
     * @param examples - Example inputs/outputs
     * @returns Inferred schema
     */
    inferSchema(examples: Array<any>): Promise<SchemaDefinition>;
    /**
     * Get token usage for the last request
     *
     * @returns Token count
     */
    getLastTokenUsage(): number;
}
/**
 * OpenAI LLM provider
 */
export declare class OpenAIProvider implements LLMProvider {
    name: string;
    private config;
    private lastTokenUsage;
    private cache;
    private dimensionRegistry?;
    private lastResponseId?;
    constructor(config?: LLMProviderConfig, dimensionRegistry?: DimensionRegistry);
    analyzePrompt(input: AnalysisInput, context?: AnalysisContext): Promise<ExtractedContract>;
    generateTests(contract: ExtractedContract, count?: number): Promise<GeneratedTestCase[]>;
    generateDimensionTests(request: TestGenerationRequest): Promise<TestGenerationResult>;
    evaluateTestResult(request: TestEvaluationRequest): Promise<TestEvaluationResult>;
    batchGenerateTests(requests: BatchRequest<TestGenerationRequest>): Promise<GeneratedTestCase[][]>;
    batchEvaluateResults(requests: BatchRequest<TestEvaluationRequest>): Promise<TestEvaluationResult[]>;
    inferSchema(examples: Array<any>): Promise<SchemaDefinition>;
    getLastTokenUsage(): number;
    private getMultiRunEvaluationPrompt;
    private getSingleRunEvaluationPrompt;
    private buildMultiRunUserPrompt;
    private buildSingleRunUserPrompt;
    private getDimensionRequirements;
    /**
     * Build team analysis prompt for LLM (teams/crews only)
     * ENHANCED: Now uses rich analysis data from Phases 1-3 and PromptBuilder for consistency
     */
    private buildTeamAnalysisPrompt;
    /**
     * Build flow analysis prompt for LLM (flows only)
     */
    private buildFlowAnalysisPrompt;
    /**
     * Build agent test prompt for LLM
     */
    private buildAgentTestPrompt;
    /**
     * Call OpenAI Responses API (migrated from Chat Completions API)
     *
     * Phase 1: Core API migration
     * - Uses /responses endpoint instead of /chat/completions
     * - Separates instructions and input
     * - Uses text.format for structured outputs
     * - Parses output items instead of choices
     *
     * Phase 2: Enhanced features
     * - Supports native tools (web_search, code_interpreter, etc.)
     * - Supports response storage with store parameter
     * - Tracks response_id for multi-turn conversations
     */
    private callAPI;
    /**
     * Get the last response ID for multi-turn conversations
     */
    getLastResponseId(): string | undefined;
}
/**
 * Anthropic LLM provider
 */
export declare class AnthropicProvider implements LLMProvider {
    name: string;
    private config;
    private lastTokenUsage;
    private cache;
    private dimensionRegistry?;
    constructor(config?: LLMProviderConfig, dimensionRegistry?: DimensionRegistry);
    analyzePrompt(input: AnalysisInput, context?: AnalysisContext): Promise<ExtractedContract>;
    generateTests(contract: ExtractedContract, count?: number): Promise<GeneratedTestCase[]>;
    generateDimensionTests(request: TestGenerationRequest): Promise<TestGenerationResult>;
    evaluateTestResult(request: TestEvaluationRequest): Promise<TestEvaluationResult>;
    batchGenerateTests(requests: BatchRequest<TestGenerationRequest>): Promise<GeneratedTestCase[][]>;
    batchEvaluateResults(requests: BatchRequest<TestEvaluationRequest>): Promise<TestEvaluationResult[]>;
    inferSchema(examples: Array<any>): Promise<SchemaDefinition>;
    getLastTokenUsage(): number;
    private getDimensionRequirements;
    private callAPI;
}
/**
 * Factory function to create LLM provider
 */
export declare function createLLMProvider(provider: 'openai' | 'anthropic', config?: LLMProviderConfig, dimensionRegistry?: DimensionRegistry): LLMProvider;
//# sourceMappingURL=llm-provider.d.ts.map