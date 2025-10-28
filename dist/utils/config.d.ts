/**
 * Configuration management utilities
 */
import { z } from 'zod';
/**
 * Configuration schema
 * Uses flexible schemas to support dynamic dimension loading
 */
export declare const ConfigSchema: z.ZodObject<{
    framework: z.ZodDefault<z.ZodEnum<["auto-detect", "langchain", "crewai", "mcp", "custom"]>>;
    llm: z.ZodDefault<z.ZodObject<{
        provider: z.ZodDefault<z.ZodString>;
        model: z.ZodDefault<z.ZodString>;
        max_concurrent_llm_calls: z.ZodDefault<z.ZodNumber>;
        temperature: z.ZodDefault<z.ZodNumber>;
        max_tokens: z.ZodDefault<z.ZodNumber>;
        timeout_ms: z.ZodDefault<z.ZodNumber>;
        enable_cache: z.ZodDefault<z.ZodBoolean>;
        cache_ttl_seconds: z.ZodDefault<z.ZodNumber>;
        discovered: z.ZodOptional<z.ZodArray<z.ZodObject<{
            provider: z.ZodString;
            model: z.ZodString;
            source: z.ZodString;
            apiKeyEnv: z.ZodOptional<z.ZodString>;
            endpoint: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            provider: string;
            model: string;
            source: string;
            apiKeyEnv?: string | undefined;
            endpoint?: string | undefined;
        }, {
            provider: string;
            model: string;
            source: string;
            apiKeyEnv?: string | undefined;
            endpoint?: string | undefined;
        }>, "many">>;
        selected: z.ZodOptional<z.ZodObject<{
            provider: z.ZodString;
            model: z.ZodString;
            apiKey: z.ZodOptional<z.ZodString>;
            endpoint: z.ZodOptional<z.ZodString>;
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            provider: string;
            model: string;
            temperature?: number | undefined;
            endpoint?: string | undefined;
            apiKey?: string | undefined;
            maxTokens?: number | undefined;
        }, {
            provider: string;
            model: string;
            temperature?: number | undefined;
            endpoint?: string | undefined;
            apiKey?: string | undefined;
            maxTokens?: number | undefined;
        }>>;
        override: z.ZodOptional<z.ZodObject<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            temperature?: number | undefined;
            maxTokens?: number | undefined;
        }, {
            temperature?: number | undefined;
            maxTokens?: number | undefined;
        }>>;
        fallback: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        provider: string;
        model: string;
        max_concurrent_llm_calls: number;
        temperature: number;
        max_tokens: number;
        timeout_ms: number;
        enable_cache: boolean;
        cache_ttl_seconds: number;
        discovered?: {
            provider: string;
            model: string;
            source: string;
            apiKeyEnv?: string | undefined;
            endpoint?: string | undefined;
        }[] | undefined;
        selected?: {
            provider: string;
            model: string;
            temperature?: number | undefined;
            endpoint?: string | undefined;
            apiKey?: string | undefined;
            maxTokens?: number | undefined;
        } | undefined;
        override?: {
            temperature?: number | undefined;
            maxTokens?: number | undefined;
        } | undefined;
        fallback?: string[] | undefined;
    }, {
        provider?: string | undefined;
        model?: string | undefined;
        max_concurrent_llm_calls?: number | undefined;
        temperature?: number | undefined;
        max_tokens?: number | undefined;
        timeout_ms?: number | undefined;
        enable_cache?: boolean | undefined;
        cache_ttl_seconds?: number | undefined;
        discovered?: {
            provider: string;
            model: string;
            source: string;
            apiKeyEnv?: string | undefined;
            endpoint?: string | undefined;
        }[] | undefined;
        selected?: {
            provider: string;
            model: string;
            temperature?: number | undefined;
            endpoint?: string | undefined;
            apiKey?: string | undefined;
            maxTokens?: number | undefined;
        } | undefined;
        override?: {
            temperature?: number | undefined;
            maxTokens?: number | undefined;
        } | undefined;
        fallback?: string[] | undefined;
    }>>;
    execution: z.ZodDefault<z.ZodObject<{
        max_concurrent_connections: z.ZodDefault<z.ZodNumber>;
        test_timeout_ms: z.ZodDefault<z.ZodNumber>;
        retry: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            max_retries: z.ZodDefault<z.ZodNumber>;
            retry_delay_ms: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            max_retries: number;
            retry_delay_ms: number;
        }, {
            enabled?: boolean | undefined;
            max_retries?: number | undefined;
            retry_delay_ms?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        max_concurrent_connections: number;
        test_timeout_ms: number;
        retry: {
            enabled: boolean;
            max_retries: number;
            retry_delay_ms: number;
        };
    }, {
        max_concurrent_connections?: number | undefined;
        test_timeout_ms?: number | undefined;
        retry?: {
            enabled?: boolean | undefined;
            max_retries?: number | undefined;
            retry_delay_ms?: number | undefined;
        } | undefined;
    }>>;
    output: z.ZodDefault<z.ZodObject<{
        format: z.ZodDefault<z.ZodEnum<["json", "markdown", "html"]>>;
        directory: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        format: "json" | "markdown" | "html";
        directory: string;
    }, {
        format?: "json" | "markdown" | "html" | undefined;
        directory?: string | undefined;
    }>>;
    api: z.ZodDefault<z.ZodObject<{
        endpoint: z.ZodDefault<z.ZodString>;
        key: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        endpoint: string;
        key?: string | undefined;
    }, {
        endpoint?: string | undefined;
        key?: string | undefined;
    }>>;
    frameworks: z.ZodDefault<z.ZodObject<{
        crewai: z.ZodDefault<z.ZodObject<{
            python_timeout_ms: z.ZodDefault<z.ZodNumber>;
            process_reuse: z.ZodDefault<z.ZodBoolean>;
            max_workers: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            python_timeout_ms: number;
            process_reuse: boolean;
            max_workers: number;
        }, {
            python_timeout_ms?: number | undefined;
            process_reuse?: boolean | undefined;
            max_workers?: number | undefined;
        }>>;
        langchain: z.ZodDefault<z.ZodObject<{
            timeout_ms: z.ZodDefault<z.ZodNumber>;
            enable_tracing: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            timeout_ms: number;
            enable_tracing: boolean;
        }, {
            timeout_ms?: number | undefined;
            enable_tracing?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        langchain: {
            timeout_ms: number;
            enable_tracing: boolean;
        };
        crewai: {
            python_timeout_ms: number;
            process_reuse: boolean;
            max_workers: number;
        };
    }, {
        langchain?: {
            timeout_ms?: number | undefined;
            enable_tracing?: boolean | undefined;
        } | undefined;
        crewai?: {
            python_timeout_ms?: number | undefined;
            process_reuse?: boolean | undefined;
            max_workers?: number | undefined;
        } | undefined;
    }>>;
    dimensions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    watch: z.ZodDefault<z.ZodObject<{
        paths: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        ignore: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        debounce: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        paths: string[];
        ignore: string[];
        debounce: number;
    }, {
        paths?: string[] | undefined;
        ignore?: string[] | undefined;
        debounce?: number | undefined;
    }>>;
    performance: z.ZodDefault<z.ZodObject<{
        maxConcurrency: z.ZodDefault<z.ZodNumber>;
        testTimeoutMs: z.ZodDefault<z.ZodNumber>;
        retryEnabled: z.ZodDefault<z.ZodBoolean>;
        maxRetries: z.ZodDefault<z.ZodNumber>;
        retryDelayMs: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxConcurrency: number;
        testTimeoutMs: number;
        retryEnabled: boolean;
        maxRetries: number;
        retryDelayMs: number;
    }, {
        maxConcurrency?: number | undefined;
        testTimeoutMs?: number | undefined;
        retryEnabled?: boolean | undefined;
        maxRetries?: number | undefined;
        retryDelayMs?: number | undefined;
    }>>;
    ci: z.ZodDefault<z.ZodObject<{
        failOnScoreBelow: z.ZodOptional<z.ZodNumber>;
        maxCost: z.ZodOptional<z.ZodNumber>;
        timeout: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        timeout: number;
        failOnScoreBelow?: number | undefined;
        maxCost?: number | undefined;
    }, {
        failOnScoreBelow?: number | undefined;
        maxCost?: number | undefined;
        timeout?: number | undefined;
    }>>;
    reporting: z.ZodDefault<z.ZodObject<{
        retention: z.ZodDefault<z.ZodObject<{
            max_reports: z.ZodDefault<z.ZodNumber>;
            max_age_days: z.ZodDefault<z.ZodNumber>;
            always_keep_latest: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            max_reports: number;
            max_age_days: number;
            always_keep_latest: number;
        }, {
            max_reports?: number | undefined;
            max_age_days?: number | undefined;
            always_keep_latest?: number | undefined;
        }>>;
        storage: z.ZodDefault<z.ZodObject<{
            compress_old: z.ZodDefault<z.ZodBoolean>;
            organize_by_month: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            compress_old: boolean;
            organize_by_month: boolean;
        }, {
            compress_old?: boolean | undefined;
            organize_by_month?: boolean | undefined;
        }>>;
        export: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            default_format: z.ZodDefault<z.ZodEnum<["html", "json", "markdown"]>>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            default_format: "json" | "markdown" | "html";
        }, {
            enabled?: boolean | undefined;
            default_format?: "json" | "markdown" | "html" | undefined;
        }>>;
        manifest: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            include_metadata: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            include_metadata: boolean;
        }, {
            enabled?: boolean | undefined;
            include_metadata?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        retention: {
            max_reports: number;
            max_age_days: number;
            always_keep_latest: number;
        };
        storage: {
            compress_old: boolean;
            organize_by_month: boolean;
        };
        export: {
            enabled: boolean;
            default_format: "json" | "markdown" | "html";
        };
        manifest: {
            enabled: boolean;
            include_metadata: boolean;
        };
    }, {
        retention?: {
            max_reports?: number | undefined;
            max_age_days?: number | undefined;
            always_keep_latest?: number | undefined;
        } | undefined;
        storage?: {
            compress_old?: boolean | undefined;
            organize_by_month?: boolean | undefined;
        } | undefined;
        export?: {
            enabled?: boolean | undefined;
            default_format?: "json" | "markdown" | "html" | undefined;
        } | undefined;
        manifest?: {
            enabled?: boolean | undefined;
            include_metadata?: boolean | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    framework: "auto-detect" | "langchain" | "crewai" | "mcp" | "custom";
    llm: {
        provider: string;
        model: string;
        max_concurrent_llm_calls: number;
        temperature: number;
        max_tokens: number;
        timeout_ms: number;
        enable_cache: boolean;
        cache_ttl_seconds: number;
        discovered?: {
            provider: string;
            model: string;
            source: string;
            apiKeyEnv?: string | undefined;
            endpoint?: string | undefined;
        }[] | undefined;
        selected?: {
            provider: string;
            model: string;
            temperature?: number | undefined;
            endpoint?: string | undefined;
            apiKey?: string | undefined;
            maxTokens?: number | undefined;
        } | undefined;
        override?: {
            temperature?: number | undefined;
            maxTokens?: number | undefined;
        } | undefined;
        fallback?: string[] | undefined;
    };
    execution: {
        max_concurrent_connections: number;
        test_timeout_ms: number;
        retry: {
            enabled: boolean;
            max_retries: number;
            retry_delay_ms: number;
        };
    };
    output: {
        format: "json" | "markdown" | "html";
        directory: string;
    };
    api: {
        endpoint: string;
        key?: string | undefined;
    };
    frameworks: {
        langchain: {
            timeout_ms: number;
            enable_tracing: boolean;
        };
        crewai: {
            python_timeout_ms: number;
            process_reuse: boolean;
            max_workers: number;
        };
    };
    dimensions: Record<string, any>;
    watch: {
        paths: string[];
        ignore: string[];
        debounce: number;
    };
    performance: {
        maxConcurrency: number;
        testTimeoutMs: number;
        retryEnabled: boolean;
        maxRetries: number;
        retryDelayMs: number;
    };
    ci: {
        timeout: number;
        failOnScoreBelow?: number | undefined;
        maxCost?: number | undefined;
    };
    reporting: {
        retention: {
            max_reports: number;
            max_age_days: number;
            always_keep_latest: number;
        };
        storage: {
            compress_old: boolean;
            organize_by_month: boolean;
        };
        export: {
            enabled: boolean;
            default_format: "json" | "markdown" | "html";
        };
        manifest: {
            enabled: boolean;
            include_metadata: boolean;
        };
    };
}, {
    framework?: "auto-detect" | "langchain" | "crewai" | "mcp" | "custom" | undefined;
    llm?: {
        provider?: string | undefined;
        model?: string | undefined;
        max_concurrent_llm_calls?: number | undefined;
        temperature?: number | undefined;
        max_tokens?: number | undefined;
        timeout_ms?: number | undefined;
        enable_cache?: boolean | undefined;
        cache_ttl_seconds?: number | undefined;
        discovered?: {
            provider: string;
            model: string;
            source: string;
            apiKeyEnv?: string | undefined;
            endpoint?: string | undefined;
        }[] | undefined;
        selected?: {
            provider: string;
            model: string;
            temperature?: number | undefined;
            endpoint?: string | undefined;
            apiKey?: string | undefined;
            maxTokens?: number | undefined;
        } | undefined;
        override?: {
            temperature?: number | undefined;
            maxTokens?: number | undefined;
        } | undefined;
        fallback?: string[] | undefined;
    } | undefined;
    execution?: {
        max_concurrent_connections?: number | undefined;
        test_timeout_ms?: number | undefined;
        retry?: {
            enabled?: boolean | undefined;
            max_retries?: number | undefined;
            retry_delay_ms?: number | undefined;
        } | undefined;
    } | undefined;
    output?: {
        format?: "json" | "markdown" | "html" | undefined;
        directory?: string | undefined;
    } | undefined;
    api?: {
        endpoint?: string | undefined;
        key?: string | undefined;
    } | undefined;
    frameworks?: {
        langchain?: {
            timeout_ms?: number | undefined;
            enable_tracing?: boolean | undefined;
        } | undefined;
        crewai?: {
            python_timeout_ms?: number | undefined;
            process_reuse?: boolean | undefined;
            max_workers?: number | undefined;
        } | undefined;
    } | undefined;
    dimensions?: Record<string, any> | undefined;
    watch?: {
        paths?: string[] | undefined;
        ignore?: string[] | undefined;
        debounce?: number | undefined;
    } | undefined;
    performance?: {
        maxConcurrency?: number | undefined;
        testTimeoutMs?: number | undefined;
        retryEnabled?: boolean | undefined;
        maxRetries?: number | undefined;
        retryDelayMs?: number | undefined;
    } | undefined;
    ci?: {
        failOnScoreBelow?: number | undefined;
        maxCost?: number | undefined;
        timeout?: number | undefined;
    } | undefined;
    reporting?: {
        retention?: {
            max_reports?: number | undefined;
            max_age_days?: number | undefined;
            always_keep_latest?: number | undefined;
        } | undefined;
        storage?: {
            compress_old?: boolean | undefined;
            organize_by_month?: boolean | undefined;
        } | undefined;
        export?: {
            enabled?: boolean | undefined;
            default_format?: "json" | "markdown" | "html" | undefined;
        } | undefined;
        manifest?: {
            enabled?: boolean | undefined;
            include_metadata?: boolean | undefined;
        } | undefined;
    } | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
/**
 * Default configuration (minimal - dimensions come from template)
 * NOTE: Dimensions are NOT hardcoded here - they come from eval.config.yml.template
 */
export declare const DEFAULT_CONFIG: Config;
/**
 * Load configuration from file or create default
 */
export declare function loadConfig(configPath?: string): Promise<Config>;
/**
 * Save configuration to file
 * NOTE: This should rarely be called directly - templates.ts handles config generation
 */
export declare function saveConfig(config: Partial<Config>, configPath?: string): Promise<void>;
/**
 * Check if configuration exists
 */
export declare function configExists(): Promise<boolean>;
/**
 * Get configuration path
 */
export declare function getConfigPath(): string;
/**
 * Merge configurations
 */
export declare function mergeConfig(base: Config, override: Partial<Config>): Config;
/**
 * Validate configuration
 */
export declare function validateConfig(config: unknown): Config;
/**
 * Load environment variables into config
 */
export declare function loadEnvVars(config: Config): Config;
/**
 * Update LLM configuration in the config file
 */
export declare function updateLLMConfig(projectPath: string, llmConfig: any): Promise<void>;
/**
 * Check if LLM configuration exists in config
 */
export declare function hasLLMConfig(config: Config): boolean;
/**
 * Get project root directory
 */
export declare function getProjectRoot(): Promise<string>;
//# sourceMappingURL=config.d.ts.map