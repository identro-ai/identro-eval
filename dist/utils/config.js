/**
 * Configuration management utilities
 */
import { cosmiconfigSync } from 'cosmiconfig';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import chalk from 'chalk';
import { z } from 'zod';
/**
 * Configuration schema
 * Uses flexible schemas to support dynamic dimension loading
 */
export const ConfigSchema = z.object({
    framework: z.enum(['auto-detect', 'langchain', 'crewai', 'mcp', 'custom']).default('auto-detect'),
    llm: z.object({
        provider: z.string().default('openai'),
        model: z.string().default('gpt-5-chat-latest'),
        max_concurrent_llm_calls: z.number().min(1).max(10).default(3),
        temperature: z.number().min(0).max(2).default(0.3),
        max_tokens: z.number().min(1).max(10000).default(2000),
        timeout_ms: z.number().default(30000),
        enable_cache: z.boolean().default(true),
        cache_ttl_seconds: z.number().default(3600),
        discovered: z.array(z.object({
            provider: z.string(),
            model: z.string(),
            source: z.string(),
            apiKeyEnv: z.string().optional(),
            endpoint: z.string().optional(),
        })).optional(),
        selected: z.object({
            provider: z.string(),
            model: z.string(),
            apiKey: z.string().optional(),
            endpoint: z.string().optional(),
            temperature: z.number().optional(),
            maxTokens: z.number().optional(),
        }).optional(),
        override: z.object({
            temperature: z.number().optional(),
            maxTokens: z.number().optional(),
        }).optional(),
        fallback: z.array(z.string()).optional(),
    }).default({
        provider: 'openai',
        model: 'gpt-5-chat-latest',
        max_concurrent_llm_calls: 3,
        temperature: 0.3,
        max_tokens: 2000,
        timeout_ms: 30000,
        enable_cache: true,
        cache_ttl_seconds: 3600,
    }),
    execution: z.object({
        max_concurrent_connections: z.number().min(1).max(20).default(5),
        test_timeout_ms: z.number().default(60000),
        retry: z.object({
            enabled: z.boolean().default(true),
            max_retries: z.number().min(0).max(5).default(2),
            retry_delay_ms: z.number().default(1000),
        }).default({
            enabled: true,
            max_retries: 2,
            retry_delay_ms: 1000,
        }),
    }).default({
        max_concurrent_connections: 5,
        test_timeout_ms: 60000,
        retry: {
            enabled: true,
            max_retries: 2,
            retry_delay_ms: 1000,
        },
    }),
    output: z.object({
        format: z.enum(['json', 'markdown', 'html']).default('json'),
        directory: z.string().default('./identro-reports'),
    }).default({}),
    api: z.object({
        endpoint: z.string().default('https://api.identro.com'),
        key: z.string().optional(),
    }).default({}),
    frameworks: z.object({
        crewai: z.object({
            python_timeout_ms: z.number().default(60000),
            process_reuse: z.boolean().default(true),
            max_workers: z.number().min(1).max(10).default(3),
        }).default({
            python_timeout_ms: 60000,
            process_reuse: true,
            max_workers: 3,
        }),
        langchain: z.object({
            timeout_ms: z.number().default(30000),
            enable_tracing: z.boolean().default(false),
        }).default({
            timeout_ms: 30000,
            enable_tracing: false,
        }),
    }).default({
        crewai: {
            python_timeout_ms: 60000,
            process_reuse: true,
            max_workers: 3,
        },
        langchain: {
            timeout_ms: 30000,
            enable_tracing: false,
        },
    }),
    // Flexible dimensions schema - accepts any dimension configuration
    // This allows the system to dynamically load dimensions without hardcoding
    dimensions: z.record(z.any()).default({}),
    watch: z.object({
        paths: z.array(z.string()).default(['./src']),
        ignore: z.array(z.string()).default(['node_modules', 'dist', '.git']),
        debounce: z.number().default(1000),
    }).default({}),
    performance: z.object({
        maxConcurrency: z.number().min(1).max(20).default(5),
        testTimeoutMs: z.number().default(60000),
        retryEnabled: z.boolean().default(true),
        maxRetries: z.number().min(0).max(5).default(2),
        retryDelayMs: z.number().default(2000),
    }).default({}),
    ci: z.object({
        failOnScoreBelow: z.number().min(0).max(850).optional(),
        maxCost: z.number().optional(),
        timeout: z.number().default(300000), // 5 minutes
    }).default({}),
    reporting: z.object({
        retention: z.object({
            max_reports: z.number().min(1).default(50),
            max_age_days: z.number().min(1).default(30),
            always_keep_latest: z.number().min(1).default(10),
        }).default({
            max_reports: 50,
            max_age_days: 30,
            always_keep_latest: 10,
        }),
        storage: z.object({
            compress_old: z.boolean().default(true),
            organize_by_month: z.boolean().default(true),
        }).default({
            compress_old: true,
            organize_by_month: true,
        }),
        export: z.object({
            enabled: z.boolean().default(true),
            default_format: z.enum(['html', 'json', 'markdown']).default('html'),
        }).default({
            enabled: true,
            default_format: 'html',
        }),
        manifest: z.object({
            enabled: z.boolean().default(true),
            include_metadata: z.boolean().default(true),
        }).default({
            enabled: true,
            include_metadata: true,
        }),
    }).default({
        retention: {
            max_reports: 50,
            max_age_days: 30,
            always_keep_latest: 10,
        },
        storage: {
            compress_old: true,
            organize_by_month: true,
        },
        export: {
            enabled: true,
            default_format: 'html',
        },
        manifest: {
            enabled: true,
            include_metadata: true,
        },
    }),
});
/**
 * Default configuration (minimal - dimensions come from template)
 * NOTE: Dimensions are NOT hardcoded here - they come from eval.config.yml.template
 */
export const DEFAULT_CONFIG = {
    framework: 'auto-detect',
    llm: {
        provider: 'openai',
        model: 'gpt-5-chat-latest',
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
    output: {
        format: 'json',
        directory: './identro-reports',
    },
    api: {
        endpoint: 'https://api.identro.com',
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
    // Dimensions intentionally empty - loaded from template
    dimensions: {},
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
        timeout: 300000,
    },
    reporting: {
        retention: {
            max_reports: 50,
            max_age_days: 30,
            always_keep_latest: 10,
        },
        storage: {
            compress_old: true,
            organize_by_month: true,
        },
        export: {
            enabled: true,
            default_format: 'html',
        },
        manifest: {
            enabled: true,
            include_metadata: true,
        },
    },
};
/**
 * Configuration file paths
 */
const CONFIG_DIR = '.identro';
const CONFIG_FILE = 'eval.config.yml';
/**
 * Load configuration from file or create default
 */
export async function loadConfig(configPath) {
    try {
        // Try to load from specified path
        if (configPath) {
            const content = await fs.readFile(configPath, 'utf-8');
            const parsed = configPath.endsWith('.json')
                ? JSON.parse(content)
                : yaml.parse(content);
            // Handle empty/null YAML files
            const configData = parsed === null || parsed === undefined ? {} : parsed;
            return ConfigSchema.parse(configData);
        }
        // Use cosmiconfig to search for config
        const explorer = cosmiconfigSync('identro-eval', {
            searchPlaces: [
                'package.json',
                '.identro-evalrc',
                '.identro-evalrc.json',
                '.identro-evalrc.yaml',
                '.identro-evalrc.yml',
                '.identro-evalrc.js',
                'identro-eval.config.js',
                path.join(CONFIG_DIR, CONFIG_FILE),
            ],
        });
        const result = explorer.search();
        if (result) {
            return ConfigSchema.parse(result.config);
        }
        // Return default config if none found
        return DEFAULT_CONFIG;
    }
    catch (error) {
        console.error(chalk.yellow('Warning: Failed to load config, using defaults'), error);
        return DEFAULT_CONFIG;
    }
}
/**
 * Save configuration to file
 * NOTE: This should rarely be called directly - templates.ts handles config generation
 */
export async function saveConfig(config, configPath) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const targetPath = configPath || path.join(CONFIG_DIR, CONFIG_FILE);
    // Ensure directory exists
    await fs.ensureDir(path.dirname(targetPath));
    // Save as YAML
    const yamlContent = yaml.stringify(finalConfig, {
        indent: 2,
        lineWidth: 120,
    });
    await fs.writeFile(targetPath, yamlContent, 'utf-8');
}
/**
 * Check if configuration exists
 */
export async function configExists() {
    const configPath = path.join(CONFIG_DIR, CONFIG_FILE);
    return fs.pathExists(configPath);
}
/**
 * Get configuration path
 */
export function getConfigPath() {
    return path.join(CONFIG_DIR, CONFIG_FILE);
}
/**
 * Merge configurations
 */
export function mergeConfig(base, override) {
    return {
        ...base,
        ...override,
        output: {
            ...base.output,
            ...override.output,
        },
        api: {
            ...base.api,
            ...override.api,
        },
        llm: {
            ...base.llm,
            ...override.llm,
            selected: override.llm?.selected || base.llm?.selected,
            override: {
                ...base.llm?.override,
                ...override.llm?.override,
            },
        },
        watch: {
            ...base.watch,
            ...override.watch,
        },
        performance: {
            ...base.performance,
            ...override.performance,
        },
        ci: {
            ...base.ci,
            ...override.ci,
        },
    };
}
/**
 * Validate configuration
 */
export function validateConfig(config) {
    try {
        return ConfigSchema.parse(config);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
            throw new Error(`Invalid configuration:\n${issues}`);
        }
        throw error;
    }
}
/**
 * Load environment variables into config
 */
export function loadEnvVars(config) {
    const updated = { ...config };
    // Load API key from env
    if (!updated.api.key && process.env.IDENTRO_API_KEY) {
        updated.api.key = process.env.IDENTRO_API_KEY;
    }
    // Load LLM API keys from env
    if (updated.llm?.selected) {
        const provider = updated.llm.selected.provider;
        if (!updated.llm.selected.apiKey) {
            if (provider === 'openai' && process.env.OPENAI_API_KEY) {
                updated.llm.selected.apiKey = process.env.OPENAI_API_KEY;
            }
            else if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
                updated.llm.selected.apiKey = process.env.ANTHROPIC_API_KEY;
            }
            else if (provider === 'azure' && process.env.AZURE_OPENAI_API_KEY) {
                updated.llm.selected.apiKey = process.env.AZURE_OPENAI_API_KEY;
            }
        }
    }
    return updated;
}
/**
 * Update LLM configuration in the config file
 */
export async function updateLLMConfig(projectPath, llmConfig) {
    const configPath = path.join(projectPath, CONFIG_DIR, CONFIG_FILE);
    const config = await loadConfig(configPath);
    // Update the LLM configuration
    config.llm = {
        ...config.llm,
        ...llmConfig,
    };
    await saveConfig(config, configPath);
}
/**
 * Check if LLM configuration exists in config
 */
export function hasLLMConfig(config) {
    return !!(config.llm?.selected?.provider);
}
/**
 * Get project root directory
 */
export async function getProjectRoot() {
    // Look for common project markers
    const markers = ['package.json', '.git', 'pyproject.toml', 'requirements.txt'];
    let currentDir = process.cwd();
    while (currentDir !== path.dirname(currentDir)) {
        for (const marker of markers) {
            if (await fs.pathExists(path.join(currentDir, marker))) {
                return currentDir;
            }
        }
        currentDir = path.dirname(currentDir);
    }
    // Default to current directory
    return process.cwd();
}
//# sourceMappingURL=config.js.map