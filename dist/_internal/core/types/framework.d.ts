/**
 * Core framework adapter interface that all framework implementations must follow
 */
export type AgentType = 'classifier' | 'rag' | 'task_executor' | 'coordinator' | 'custom';
export type Framework = 'langchain' | 'crewai' | 'autogen' | 'llamaindex' | 'custom';
/**
 * Information about a discovered agent in a project
 */
export interface AgentInfo {
    /** Unique identifier for the agent */
    id: string;
    /** Human-readable name of the agent */
    name: string;
    /** Type of agent based on its functionality */
    type: AgentType;
    /** File path where the agent is defined */
    path: string;
    /** Framework the agent uses */
    framework: Framework;
    /** Additional metadata specific to the framework */
    metadata?: Record<string, any>;
    /** Agent's description or purpose if available */
    description?: string;
    /** Dependencies or tools the agent uses */
    dependencies?: string[];
}
/**
 * Specification for how an agent should be evaluated
 */
export interface AgentSpec {
    /** Agent information */
    agent: AgentInfo;
    /** Sample inputs for testing */
    sampleInputs: any[];
    /** Expected output type */
    expectedOutputType?: 'text' | 'json' | 'classification' | 'structured' | 'custom';
    /** Output schema if structured */
    outputSchema?: Record<string, any>;
    /** Performance expectations */
    performance?: {
        maxLatencyMs?: number;
        minThroughput?: number;
    };
    /** Safety requirements */
    safety?: {
        preventPromptInjection?: boolean;
        handleBoundaryInputs?: boolean;
    };
}
/**
 * Test execution context
 */
export interface TestContext {
    /** Project root directory */
    projectPath: string;
    /** Environment variables */
    env?: Record<string, string>;
    /** Timeout for test execution */
    timeoutMs?: number;
    /** Number of runs for consistency testing */
    consistencyRuns?: number;
    /** Verbose logging */
    verbose?: boolean;
}
/**
 * Result from running a test
 */
export interface TestResult {
    /** Input that was tested */
    input: any;
    /** Output from the agent */
    output: any;
    /** Execution time in milliseconds */
    latencyMs: number;
    /** Whether the test passed */
    success: boolean;
    /** Error if test failed */
    error?: string;
    /** Additional metrics */
    metrics?: Record<string, any>;
}
/**
 * Results from all test dimensions
 */
export interface TestResults {
    /** Agent that was tested */
    agentId: string;
    /** Timestamp of test execution */
    timestamp: Date;
    /** Individual test results */
    tests: TestResult[];
    /** Dimension-specific results */
    dimensions: {
        consistency?: ConsistencyResult;
        safety?: SafetyResult;
        performance?: PerformanceResult;
        schema?: SchemaResult;
        determinism?: DeterminismResult;
    };
    /** Overall summary */
    summary: {
        totalTests: number;
        passed: number;
        failed: number;
        averageLatencyMs: number;
        successRate: number;
    };
}
/**
 * Consistency test results
 */
export interface ConsistencyResult {
    /** Variance in outputs for same input */
    outputVariance: number;
    /** Similarity scores between runs */
    similarityScores: number[];
    /** Whether outputs are consistent */
    isConsistent: boolean;
    /** Confidence in consistency measurement */
    confidence: number;
    /** LLM evaluation metrics (when LLM evaluation is used) */
    llmMetrics?: {
        averageScore: number;
        passRate: number;
        totalTokenUsage: number;
        evaluatedTests: number;
        /** Number of multi-run tests executed */
        multiRunTests?: number;
        /** Average number of runs per test */
        averageRunsPerTest?: number;
    };
}
/**
 * Safety test results
 */
export interface SafetyResult {
    /** Prompt injection test results */
    promptInjectionResistant: boolean;
    /** Boundary input handling */
    boundaryHandling: boolean;
    /** Error recovery capability */
    errorRecovery: boolean;
    /** Safety score 0-1 */
    safetyScore: number;
}
/**
 * Performance test results
 */
export interface PerformanceResult {
    /** Latency percentiles */
    latencyPercentiles: {
        p50: number;
        p90: number;
        p95: number;
        p99: number;
    };
    /** Throughput metrics */
    throughput: {
        requestsPerSecond: number;
        tokensPerSecond?: number;
    };
    /** Timeout rate */
    timeoutRate: number;
    /** Performance score 0-1 */
    performanceScore: number;
}
/**
 * Schema compliance results
 */
export interface SchemaResult {
    /** Whether outputs match expected schema */
    schemaCompliant: boolean;
    /** Validation errors if any */
    validationErrors: string[];
    /** Compliance rate across all tests */
    complianceRate: number;
    /** Schema score 0-1 */
    schemaScore: number;
}
/**
 * Determinism test results
 */
export interface DeterminismResult {
    /** Whether agent behaves deterministically */
    isDeterministic: boolean;
    /** Predictability score */
    predictabilityScore: number;
    /** Behavioral dimensions detected */
    dimensions: string[];
    /** Determinism score 0-1 */
    determinismScore: number;
}
/**
 * LLM configuration for framework adapters
 */
export interface LLMConfig {
    /** LLM provider */
    provider: 'openai' | 'anthropic' | 'azure' | 'huggingface' | 'local';
    /** Model name */
    model?: string;
    /** API key */
    apiKey?: string;
    /** Environment variable name for API key */
    apiKeyEnv?: string;
    /** API endpoint URL */
    endpoint?: string;
    /** Temperature setting */
    temperature?: number;
    /** Maximum tokens */
    maxTokens?: number;
    /** Maximum concurrent LLM calls */
    maxConcurrentCalls?: number;
}
/**
 * Main framework adapter interface
 */
export interface FrameworkAdapter {
    /** Framework name */
    name: Framework;
    /** Supported languages */
    supportedLanguages: ('python' | 'typescript' | 'javascript')[];
    /**
     * Configure the adapter with LLM settings
     */
    configure?(llmConfig: LLMConfig): void;
    /**
     * Detect if this framework is used in the project
     */
    detect(projectPath: string): Promise<boolean>;
    /**
     * Discover all agents in the project
     */
    discoverAgents(projectPath: string): Promise<AgentInfo[]>;
    /**
     * Analyze a specific agent to create evaluation spec
     */
    analyzeAgent(agentPath: string): Promise<AgentSpec>;
    /**
     * Run evaluation tests on an agent
     */
    runTests(agent: AgentInfo, spec: AgentSpec, context: TestContext): Promise<TestResults>;
    /**
     * Get the project's LLM configuration
     */
    detectLLMConfig?(projectPath: string): Promise<Record<string, any>>;
    /**
     * Validate the framework setup
     */
    validate?(projectPath: string): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
}
//# sourceMappingURL=framework.d.ts.map