/**
 * Configuration Manager
 *
 * Centralized configuration loading and validation for Identro evaluation system.
 * Supports hierarchical configuration with defaults, user overrides, and runtime parameters.
 */
/**
 * Main configuration interface - unified schema for CLI and Core
 */
export interface EvalConfig {
    /** Framework Configuration */
    framework: 'auto-detect' | 'langchain' | 'crewai' | 'mcp' | 'custom';
    /** LLM provider configuration */
    llm: {
        /** LLM provider (openai, anthropic) */
        provider: 'openai' | 'anthropic';
        /** Model to use */
        model: string;
        /** Maximum concurrent LLM calls */
        max_concurrent_llm_calls: number;
        /** Temperature for generation */
        temperature: number;
        /** Maximum tokens for responses */
        max_tokens: number;
        /** Request timeout in milliseconds */
        timeout_ms: number;
        /** Enable caching of results */
        enable_cache: boolean;
        /** Cache TTL in seconds */
        cache_ttl_seconds: number;
    };
    /** Execution configuration */
    execution: {
        /** Maximum concurrent test executions */
        max_concurrent_connections: number;
        /** Test timeout in milliseconds */
        test_timeout_ms: number;
        /** Retry configuration */
        retry: {
            enabled: boolean;
            max_retries: number;
            retry_delay_ms: number;
        };
    };
    /** Dimension-specific configuration */
    dimensions: {
        consistency: {
            enabled: boolean;
            test_count: number;
            runs_per_input: number;
            similarity_threshold: number;
            default_strictness?: number;
            passing_criteria_percentage?: number;
        };
        safety: {
            enabled: boolean;
            test_count: number;
            test_prompt_injection: boolean;
            test_boundary_inputs: boolean;
            default_strictness?: number;
            passing_criteria_percentage?: number;
        };
        performance: {
            enabled: boolean;
            test_count: number;
            concurrent_requests: number;
            timeout_ms: number;
            latency_threshold_ms: number;
            default_strictness?: number;
            passing_criteria_percentage?: number;
        };
        schema: {
            enabled: boolean;
            test_count: number;
            strict_validation: boolean;
            default_strictness?: number;
            passing_criteria_percentage?: number;
        };
    };
    /** Framework-specific configuration */
    frameworks: {
        crewai: {
            python_timeout_ms: number;
            process_reuse: boolean;
            max_workers: number;
        };
        langchain: {
            timeout_ms: number;
            enable_tracing: boolean;
        };
    };
    /** Output configuration */
    output: {
        format: 'json' | 'markdown' | 'html';
        directory: string;
    };
    /** API configuration (optional) */
    api: {
        endpoint: string;
        key?: string;
    };
    /** Watch configuration (for development) */
    watch: {
        paths: string[];
        ignore: string[];
        debounce: number;
    };
    /** Performance configuration */
    performance: {
        maxConcurrency: number;
        testTimeoutMs: number;
        retryEnabled: boolean;
        maxRetries: number;
        retryDelayMs: number;
    };
    /** CI configuration */
    ci: {
        failOnScoreBelow?: number;
        maxCost?: number;
        timeout: number;
    };
}
/**
 * Configuration Manager class
 */
export declare class ConfigManager {
    private config;
    private configPath?;
    constructor(config?: Partial<EvalConfig>);
    /**
     * Load configuration from file
     */
    static fromFile(configPath: string): Promise<ConfigManager>;
    /**
     * Load configuration from project directory
     */
    static fromProject(projectPath: string): Promise<ConfigManager>;
    /**
     * Get the full configuration
     */
    getConfig(): EvalConfig;
    /**
     * Get execution configuration
     */
    getExecution(): EvalConfig['execution'];
    /**
     * Get LLM configuration
     */
    getLLM(): EvalConfig['llm'];
    /**
     * Get dimension configuration
     */
    getDimensions(): EvalConfig['dimensions'];
    /**
     * Get dimension-specific configuration
     */
    getDimension(dimension: keyof EvalConfig['dimensions']): EvalConfig['dimensions'][typeof dimension];
    /**
     * Get dimension-specific evaluation settings
     * Returns the evaluation configuration for a dimension including:
     * - test_count: Number of tests to generate
     * - runs_per_input: Number of runs per test (for consistency dimensions)
     * - default_strictness: Default evaluation strictness (0-100)
     * - passing_criteria_percentage: Percentage of criteria that must pass
     *
     * This is the SINGLE SOURCE OF TRUTH for dimension evaluation settings.
     */
    getDimensionSettings(dimensionName: string): {
        test_count?: number;
        runs_per_input?: number;
        default_strictness?: number;
        passing_criteria_percentage?: number;
        concurrent_requests?: number;
        timeout_ms?: number;
    };
    /**
     * Get framework configuration
     */
    getFrameworks(): EvalConfig['frameworks'];
    /**
     * Get framework-specific configuration
     */
    getFramework(framework: keyof EvalConfig['frameworks']): EvalConfig['frameworks'][typeof framework];
    /**
     * Update configuration at runtime
     */
    updateConfig(updates: Partial<EvalConfig>): void;
    /**
     * Save configuration to file
     */
    saveConfig(configPath?: string): Promise<void>;
    /**
     * Create default configuration file
     */
    static createDefaultConfig(projectPath: string): Promise<ConfigManager>;
    /**
     * Validate configuration
     */
    validate(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Deep merge configuration objects
     */
    private mergeConfig;
    /**
     * Get configuration summary for logging
     */
    getSummary(): string;
}
/**
 * Get or create global configuration
 */
export declare function getGlobalConfig(): ConfigManager;
/**
 * Set global configuration
 */
export declare function setGlobalConfig(config: ConfigManager): void;
/**
 * Initialize configuration from project
 */
export declare function initializeConfig(projectPath: string): Promise<ConfigManager>;
//# sourceMappingURL=config-manager.d.ts.map