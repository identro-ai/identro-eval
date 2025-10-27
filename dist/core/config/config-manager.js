/**
 * Configuration Manager
 *
 * Centralized configuration loading and validation for Identro evaluation system.
 * Supports hierarchical configuration with defaults, user overrides, and runtime parameters.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
    framework: 'auto-detect',
    llm: {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        max_concurrent_llm_calls: 3,
        temperature: 0.3,
        max_tokens: 2000,
        timeout_ms: 30000,
        enable_cache: true,
        cache_ttl_seconds: 3600,
    },
    execution: {
        max_concurrent_connections: 5,
        test_timeout_ms: 60000,
        retry: {
            enabled: true,
            max_retries: 2,
            retry_delay_ms: 1000,
        },
    },
    dimensions: {
        consistency: {
            enabled: true,
            test_count: 3,
            runs_per_input: 3,
            similarity_threshold: 0.8,
            // NEW: Evaluation defaults
            default_strictness: 85,
            passing_criteria_percentage: 100,
        },
        safety: {
            enabled: true,
            test_count: 3,
            test_prompt_injection: false, // Disabled for CrewAI by default
            test_boundary_inputs: false,
            // NEW: Evaluation defaults (stricter for safety)
            default_strictness: 95,
            passing_criteria_percentage: 100,
        },
        performance: {
            enabled: true,
            test_count: 3,
            concurrent_requests: 5,
            timeout_ms: 60000,
            latency_threshold_ms: 20000,
            // NEW: Evaluation defaults (slightly more lenient)
            default_strictness: 80,
            passing_criteria_percentage: 100,
        },
        schema: {
            enabled: false, // Disabled by default since we're skipping schema generator
            test_count: 3,
            strict_validation: true,
            // NEW: Evaluation defaults
            default_strictness: 85,
            passing_criteria_percentage: 100,
        },
    },
    frameworks: {
        crewai: {
            python_timeout_ms: 60000,
            process_reuse: true,
            max_workers: 3,
        },
        langchain: {
            timeout_ms: 30000,
            enable_tracing: false,
        },
    },
    output: {
        format: 'json',
        directory: './identro-reports',
    },
    api: {
        endpoint: 'https://api.identro.com',
    },
    watch: {
        paths: ['./src'],
        ignore: ['node_modules', 'dist', '.git'],
        debounce: 1000,
    },
    performance: {
        maxConcurrency: 5,
        testTimeoutMs: 60000,
        retryEnabled: true,
        maxRetries: 2,
        retryDelayMs: 2000,
    },
    ci: {
        timeout: 300000, // 5 minutes
    },
};
/**
 * Configuration Manager class
 */
export class ConfigManager {
    config;
    configPath;
    constructor(config) {
        this.config = this.mergeConfig(DEFAULT_CONFIG, config || {});
    }
    /**
     * Load configuration from file
     */
    static async fromFile(configPath) {
        try {
            const content = await fs.readFile(configPath, 'utf-8');
            const userConfig = yaml.load(content);
            const manager = new ConfigManager(userConfig);
            manager.configPath = configPath;
            return manager;
        }
        catch (error) {
            console.warn(`Warning: Could not load config from ${configPath}, using defaults`);
            return new ConfigManager();
        }
    }
    /**
     * Load configuration from project directory
     */
    static async fromProject(projectPath) {
        const configPath = path.join(projectPath, '.identro', 'eval.config.yml');
        return ConfigManager.fromFile(configPath);
    }
    /**
     * Get the full configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get execution configuration
     */
    getExecution() {
        return { ...this.config.execution };
    }
    /**
     * Get LLM configuration
     */
    getLLM() {
        return { ...this.config.llm };
    }
    /**
     * Get dimension configuration
     */
    getDimensions() {
        return { ...this.config.dimensions };
    }
    /**
     * Get dimension-specific configuration
     */
    getDimension(dimension) {
        return { ...this.config.dimensions[dimension] };
    }
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
    getDimensionSettings(dimensionName) {
        const dimension = this.config.dimensions[dimensionName];
        if (!dimension) {
            // Return defaults if dimension not found
            return {
                test_count: 3,
                runs_per_input: 1,
                default_strictness: 85,
                passing_criteria_percentage: 100,
            };
        }
        // Extract evaluation-relevant settings
        return {
            test_count: dimension.test_count,
            runs_per_input: 'runs_per_input' in dimension ? dimension.runs_per_input : undefined,
            default_strictness: 'default_strictness' in dimension ? dimension.default_strictness : 85,
            passing_criteria_percentage: 'passing_criteria_percentage' in dimension ? dimension.passing_criteria_percentage : 100,
            concurrent_requests: 'concurrent_requests' in dimension ? dimension.concurrent_requests : undefined,
            timeout_ms: 'timeout_ms' in dimension ? dimension.timeout_ms : undefined,
        };
    }
    /**
     * Get framework configuration
     */
    getFrameworks() {
        return { ...this.config.frameworks };
    }
    /**
     * Get framework-specific configuration
     */
    getFramework(framework) {
        return { ...this.config.frameworks[framework] };
    }
    /**
     * Update configuration at runtime
     */
    updateConfig(updates) {
        this.config = this.mergeConfig(this.config, updates);
    }
    /**
     * Save configuration to file
     */
    async saveConfig(configPath) {
        const targetPath = configPath || this.configPath;
        if (!targetPath) {
            throw new Error('No config path specified');
        }
        // Ensure directory exists
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        // Convert to YAML and save
        const yamlContent = yaml.dump(this.config, {
            indent: 2,
            lineWidth: 120,
            noRefs: true,
        });
        await fs.writeFile(targetPath, yamlContent, 'utf-8');
    }
    /**
     * Create default configuration file
     */
    static async createDefaultConfig(projectPath) {
        const configPath = path.join(projectPath, '.identro', 'eval.config.yml');
        const manager = new ConfigManager();
        await manager.saveConfig(configPath);
        return manager;
    }
    /**
     * Validate configuration
     */
    validate() {
        const errors = [];
        // Validate execution config
        if (this.config.execution.max_concurrent_connections < 1) {
            errors.push('execution.max_concurrent_connections must be at least 1');
        }
        if (this.config.execution.test_timeout_ms < 1000) {
            errors.push('execution.test_timeout_ms must be at least 1000ms');
        }
        // Validate LLM config
        if (!['openai', 'anthropic'].includes(this.config.llm.provider)) {
            errors.push('llm.provider must be "openai" or "anthropic"');
        }
        if (this.config.llm.max_concurrent_llm_calls < 1) {
            errors.push('llm.max_concurrent_llm_calls must be at least 1');
        }
        if (this.config.llm.temperature < 0 || this.config.llm.temperature > 2) {
            errors.push('llm.temperature must be between 0 and 2');
        }
        // Validate dimension configs
        for (const [dimensionName, dimensionConfig] of Object.entries(this.config.dimensions)) {
            if (dimensionConfig.test_count < 1) {
                errors.push(`dimensions.${dimensionName}.test_count must be at least 1`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * Deep merge configuration objects
     */
    mergeConfig(base, override) {
        const result = { ...base };
        for (const [key, value] of Object.entries(override)) {
            if (value !== undefined) {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // @ts-ignore - Deep merge for nested objects
                    result[key] = { ...result[key], ...value };
                }
                else {
                    // @ts-ignore - Direct assignment for primitives
                    result[key] = value;
                }
            }
        }
        return result;
    }
    /**
     * Get configuration summary for logging
     */
    getSummary() {
        const config = this.config;
        return [
            `Execution: ${config.execution.max_concurrent_connections} concurrent, ${config.execution.test_timeout_ms}ms timeout`,
            `LLM: ${config.llm.provider} (${config.llm.model}), ${config.llm.max_concurrent_llm_calls} concurrent calls`,
            `Dimensions: ${Object.entries(config.dimensions).filter(([, p]) => p.enabled).map(([name]) => name).join(', ')}`,
        ].join('\n');
    }
}
/**
 * Global configuration instance
 */
let globalConfig = null;
/**
 * Get or create global configuration
 */
export function getGlobalConfig() {
    if (!globalConfig) {
        globalConfig = new ConfigManager();
    }
    return globalConfig;
}
/**
 * Set global configuration
 */
export function setGlobalConfig(config) {
    globalConfig = config;
}
/**
 * Initialize configuration from project
 */
export async function initializeConfig(projectPath) {
    const config = await ConfigManager.fromProject(projectPath);
    setGlobalConfig(config);
    return config;
}
//# sourceMappingURL=config-manager.js.map