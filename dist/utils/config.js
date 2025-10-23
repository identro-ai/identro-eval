"use strict";
/**
 * Configuration management utilities
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = exports.ConfigSchema = void 0;
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.configExists = configExists;
exports.getConfigPath = getConfigPath;
exports.mergeConfig = mergeConfig;
exports.validateConfig = validateConfig;
exports.loadEnvVars = loadEnvVars;
exports.updateLLMConfig = updateLLMConfig;
exports.hasLLMConfig = hasLLMConfig;
exports.getProjectRoot = getProjectRoot;
const cosmiconfig_1 = require("cosmiconfig");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
const chalk_1 = __importDefault(require("chalk"));
const zod_1 = require("zod");
/**
 * Configuration schema
 * Uses flexible schemas to support dynamic dimension loading
 */
exports.ConfigSchema = zod_1.z.object({
    framework: zod_1.z.enum(['auto-detect', 'langchain', 'crewai', 'mcp', 'custom']).default('auto-detect'),
    llm: zod_1.z.object({
        provider: zod_1.z.string().default('openai'),
        model: zod_1.z.string().default('gpt-5-chat-latest'),
        max_concurrent_llm_calls: zod_1.z.number().min(1).max(10).default(3),
        temperature: zod_1.z.number().min(0).max(2).default(0.3),
        max_tokens: zod_1.z.number().min(1).max(10000).default(2000),
        timeout_ms: zod_1.z.number().default(30000),
        enable_cache: zod_1.z.boolean().default(true),
        cache_ttl_seconds: zod_1.z.number().default(3600),
        discovered: zod_1.z.array(zod_1.z.object({
            provider: zod_1.z.string(),
            model: zod_1.z.string(),
            source: zod_1.z.string(),
            apiKeyEnv: zod_1.z.string().optional(),
            endpoint: zod_1.z.string().optional(),
        })).optional(),
        selected: zod_1.z.object({
            provider: zod_1.z.string(),
            model: zod_1.z.string(),
            apiKey: zod_1.z.string().optional(),
            endpoint: zod_1.z.string().optional(),
            temperature: zod_1.z.number().optional(),
            maxTokens: zod_1.z.number().optional(),
        }).optional(),
        override: zod_1.z.object({
            temperature: zod_1.z.number().optional(),
            maxTokens: zod_1.z.number().optional(),
        }).optional(),
        fallback: zod_1.z.array(zod_1.z.string()).optional(),
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
    execution: zod_1.z.object({
        max_concurrent_connections: zod_1.z.number().min(1).max(20).default(5),
        test_timeout_ms: zod_1.z.number().default(60000),
        retry: zod_1.z.object({
            enabled: zod_1.z.boolean().default(true),
            max_retries: zod_1.z.number().min(0).max(5).default(2),
            retry_delay_ms: zod_1.z.number().default(1000),
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
    output: zod_1.z.object({
        format: zod_1.z.enum(['json', 'markdown', 'html']).default('json'),
        directory: zod_1.z.string().default('./identro-reports'),
    }).default({}),
    api: zod_1.z.object({
        endpoint: zod_1.z.string().default('https://api.identro.com'),
        key: zod_1.z.string().optional(),
    }).default({}),
    frameworks: zod_1.z.object({
        crewai: zod_1.z.object({
            python_timeout_ms: zod_1.z.number().default(60000),
            process_reuse: zod_1.z.boolean().default(true),
            max_workers: zod_1.z.number().min(1).max(10).default(3),
        }).default({
            python_timeout_ms: 60000,
            process_reuse: true,
            max_workers: 3,
        }),
        langchain: zod_1.z.object({
            timeout_ms: zod_1.z.number().default(30000),
            enable_tracing: zod_1.z.boolean().default(false),
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
    dimensions: zod_1.z.record(zod_1.z.any()).default({}),
    watch: zod_1.z.object({
        paths: zod_1.z.array(zod_1.z.string()).default(['./src']),
        ignore: zod_1.z.array(zod_1.z.string()).default(['node_modules', 'dist', '.git']),
        debounce: zod_1.z.number().default(1000),
    }).default({}),
    performance: zod_1.z.object({
        maxConcurrency: zod_1.z.number().min(1).max(20).default(5),
        testTimeoutMs: zod_1.z.number().default(60000),
        retryEnabled: zod_1.z.boolean().default(true),
        maxRetries: zod_1.z.number().min(0).max(5).default(2),
        retryDelayMs: zod_1.z.number().default(2000),
    }).default({}),
    ci: zod_1.z.object({
        failOnScoreBelow: zod_1.z.number().min(0).max(850).optional(),
        maxCost: zod_1.z.number().optional(),
        timeout: zod_1.z.number().default(300000), // 5 minutes
    }).default({}),
    reporting: zod_1.z.object({
        retention: zod_1.z.object({
            max_reports: zod_1.z.number().min(1).default(50),
            max_age_days: zod_1.z.number().min(1).default(30),
            always_keep_latest: zod_1.z.number().min(1).default(10),
        }).default({
            max_reports: 50,
            max_age_days: 30,
            always_keep_latest: 10,
        }),
        storage: zod_1.z.object({
            compress_old: zod_1.z.boolean().default(true),
            organize_by_month: zod_1.z.boolean().default(true),
        }).default({
            compress_old: true,
            organize_by_month: true,
        }),
        export: zod_1.z.object({
            enabled: zod_1.z.boolean().default(true),
            default_format: zod_1.z.enum(['html', 'json', 'markdown']).default('html'),
        }).default({
            enabled: true,
            default_format: 'html',
        }),
        manifest: zod_1.z.object({
            enabled: zod_1.z.boolean().default(true),
            include_metadata: zod_1.z.boolean().default(true),
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
exports.DEFAULT_CONFIG = {
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
async function loadConfig(configPath) {
    try {
        // Try to load from specified path
        if (configPath) {
            const content = await fs.readFile(configPath, 'utf-8');
            const parsed = configPath.endsWith('.json')
                ? JSON.parse(content)
                : yaml.parse(content);
            // Handle empty/null YAML files
            const configData = parsed === null || parsed === undefined ? {} : parsed;
            return exports.ConfigSchema.parse(configData);
        }
        // Use cosmiconfig to search for config
        const explorer = (0, cosmiconfig_1.cosmiconfigSync)('identro-eval', {
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
            return exports.ConfigSchema.parse(result.config);
        }
        // Return default config if none found
        return exports.DEFAULT_CONFIG;
    }
    catch (error) {
        console.error(chalk_1.default.yellow('Warning: Failed to load config, using defaults'), error);
        return exports.DEFAULT_CONFIG;
    }
}
/**
 * Save configuration to file
 * NOTE: This should rarely be called directly - templates.ts handles config generation
 */
async function saveConfig(config, configPath) {
    const finalConfig = { ...exports.DEFAULT_CONFIG, ...config };
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
async function configExists() {
    const configPath = path.join(CONFIG_DIR, CONFIG_FILE);
    return fs.pathExists(configPath);
}
/**
 * Get configuration path
 */
function getConfigPath() {
    return path.join(CONFIG_DIR, CONFIG_FILE);
}
/**
 * Merge configurations
 */
function mergeConfig(base, override) {
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
function validateConfig(config) {
    try {
        return exports.ConfigSchema.parse(config);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const issues = error.issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
            throw new Error(`Invalid configuration:\n${issues}`);
        }
        throw error;
    }
}
/**
 * Load environment variables into config
 */
function loadEnvVars(config) {
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
async function updateLLMConfig(projectPath, llmConfig) {
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
function hasLLMConfig(config) {
    return !!(config.llm?.selected?.provider);
}
/**
 * Get project root directory
 */
async function getProjectRoot() {
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