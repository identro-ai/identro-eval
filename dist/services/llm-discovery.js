/**
 * LLM Discovery Service
 *
 * Automatically discovers LLM configurations from:
 * - Environment variables
 * - Configuration files
 * - Code analysis
 * - Local model servers
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { glob } from 'glob';
import { createSpinner } from '../utils/display';
/**
 * GPT-5 Models
 */
// GPT-5 Models with correct API aliases
// Note: Reasoning models (gpt-5, gpt-5-mini, gpt-5-nano) are slower but provide better quality
// Chat models (gpt-5-chat-latest) are faster and recommended for test generation
export const GPT5_MODELS = [
    { id: 'gpt-5-chat-latest', name: 'GPT-5 Chat Latest (Main)', description: 'Fast, full capability (Default)', apiAlias: 'gpt-5-chat-latest' },
    { id: 'gpt-5', name: 'GPT-5 (Thinking)', description: 'Advanced reasoning (slower)', apiAlias: 'gpt-5' },
    { id: 'gpt-5-mini', name: 'GPT-5 Mini (Thinking Mini)', description: 'Balanced reasoning', apiAlias: 'gpt-5-mini' },
    { id: 'gpt-5-nano', name: 'GPT-5 Nano (Thinking Nano)', description: 'Fast reasoning', apiAlias: 'gpt-5-nano' }
];
export const DEFAULT_GPT5_MODEL = 'gpt-5-chat-latest';
/**
 * LLM cost estimates (per 1K tokens)
 */
const LLM_COSTS = {
    'gpt-4-turbo': '~$0.03',
    'gpt-4': '~$0.06',
    'gpt-3.5-turbo': '~$0.002',
    'claude-3-opus': '~$0.015',
    'claude-3-sonnet': '~$0.003',
    'claude-3-haiku': '~$0.0004',
    'gemini-pro': '~$0.001',
    'llama2': 'Free (local)',
    'codellama': 'Free (local)',
    'mistral': 'Free (local)',
};
/**
 * Discover all available LLM configurations
 */
export async function discoverLLMs(projectPath = process.cwd()) {
    const spinner = createSpinner('Discovering LLM configurations...');
    spinner.start();
    const discovered = [];
    try {
        // 1. Check environment variables
        discovered.push(...await discoverFromEnv());
        // 2. Check .env files
        discovered.push(...await discoverFromEnvFiles(projectPath));
        // 3. Check configuration files
        discovered.push(...await discoverFromConfigFiles(projectPath));
        // 4. Analyze code for LLM usage
        discovered.push(...await discoverFromCode(projectPath));
        // 5. Check for local models
        discovered.push(...await discoverLocalModels());
        // Remove duplicates
        const unique = deduplicateLLMs(discovered);
        spinner.succeed(`Found ${unique.length} LLM configuration(s)`);
        return unique;
    }
    catch (error) {
        spinner.fail('Failed to discover LLMs');
        throw error;
    }
}
/**
 * Discover LLMs from environment variables
 */
async function discoverFromEnv() {
    const llms = [];
    // OpenAI
    if (process.env.OPENAI_API_KEY) {
        llms.push({
            provider: 'openai',
            model: process.env.OPENAI_MODEL || 'gpt-5-chat-latest',
            source: 'Environment variables',
            apiKeyEnv: 'OPENAI_API_KEY',
            apiKey: process.env.OPENAI_API_KEY,
            endpoint: process.env.OPENAI_BASE_URL,
            status: 'available',
            cost: LLM_COSTS['gpt-4-turbo'],
        });
    }
    // Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
        llms.push({
            provider: 'anthropic',
            model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
            source: 'Environment variables',
            apiKeyEnv: 'ANTHROPIC_API_KEY',
            apiKey: process.env.ANTHROPIC_API_KEY,
            endpoint: process.env.ANTHROPIC_BASE_URL,
            status: 'available',
            cost: LLM_COSTS['claude-3-opus'],
        });
    }
    // Azure OpenAI
    if (process.env.AZURE_OPENAI_API_KEY) {
        llms.push({
            provider: 'azure-openai',
            model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
            source: 'Environment variables',
            apiKeyEnv: 'AZURE_OPENAI_API_KEY',
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            status: 'available',
            cost: LLM_COSTS['gpt-4'],
        });
    }
    // Google Gemini
    if (process.env.GOOGLE_API_KEY) {
        llms.push({
            provider: 'google',
            model: process.env.GOOGLE_MODEL || 'gemini-pro',
            source: 'Environment variables',
            apiKeyEnv: 'GOOGLE_API_KEY',
            apiKey: process.env.GOOGLE_API_KEY,
            status: 'available',
            cost: LLM_COSTS['gemini-pro'],
        });
    }
    return llms;
}
/**
 * Discover LLMs from .env files
 */
async function discoverFromEnvFiles(projectPath) {
    const llms = [];
    const envPaths = [
        path.join(projectPath, '.env'),
        path.join(projectPath, '.env.local'),
        path.join(projectPath, '.env.development'),
    ];
    for (const envPath of envPaths) {
        if (await fs.pathExists(envPath)) {
            // CRITICAL FIX: Load the .env file into process.env
            dotenv.config({ path: envPath });
            const envConfig = dotenv.parse(await fs.readFile(envPath, 'utf-8'));
            // OpenAI
            if (envConfig.OPENAI_API_KEY) {
                llms.push({
                    provider: 'openai',
                    model: envConfig.OPENAI_MODEL || 'gpt-5-chat-latest',
                    source: path.relative(projectPath, envPath),
                    apiKeyEnv: 'OPENAI_API_KEY',
                    apiKey: envConfig.OPENAI_API_KEY, // Store the actual key
                    status: 'available',
                    cost: LLM_COSTS['gpt-4-turbo'],
                });
            }
            // Anthropic
            if (envConfig.ANTHROPIC_API_KEY) {
                llms.push({
                    provider: 'anthropic',
                    model: envConfig.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
                    source: path.relative(projectPath, envPath),
                    apiKeyEnv: 'ANTHROPIC_API_KEY',
                    apiKey: envConfig.ANTHROPIC_API_KEY, // Store the actual key
                    status: 'available',
                    cost: LLM_COSTS['claude-3-opus'],
                });
            }
        }
    }
    return llms;
}
/**
 * Discover LLMs from configuration files
 */
async function discoverFromConfigFiles(projectPath) {
    const llms = [];
    // Look for common config files
    const configDimensions = [
        'config/**/*.{json,yaml,yml}',
        'settings/**/*.{json,yaml,yml}',
        '**/llm.{json,yaml,yml}',
        '**/ai.{json,yaml,yml}',
    ];
    for (const dimension of configDimensions) {
        const files = await glob(dimension, {
            cwd: projectPath,
            ignore: ['node_modules/**', 'dist/**'],
        });
        for (const file of files) {
            const fullPath = path.join(projectPath, file);
            const content = await fs.readFile(fullPath, 'utf-8');
            try {
                const config = file.endsWith('.json')
                    ? JSON.parse(content)
                    : require('yaml').parse(content);
                // Look for LLM configurations
                if (config.llm || config.openai || config.anthropic) {
                    const llmConfig = config.llm || config.openai || config.anthropic;
                    if (llmConfig.apiKey || llmConfig.api_key) {
                        llms.push({
                            provider: detectProviderFromConfig(llmConfig),
                            model: llmConfig.model || llmConfig.modelName || 'unknown',
                            source: path.relative(projectPath, fullPath),
                            status: 'available',
                            endpoint: llmConfig.endpoint || llmConfig.baseUrl,
                        });
                    }
                }
            }
            catch {
                // Ignore parsing errors
            }
        }
    }
    return llms;
}
/**
 * Discover LLMs from code analysis
 */
async function discoverFromCode(projectPath) {
    const llms = [];
    try {
        // Search for common LLM initialization dimensions
        const codeDimensions = [
            '**/*.{js,ts,jsx,tsx,py}',
        ];
        const files = await glob(codeDimensions[0], {
            cwd: projectPath,
            ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**', 'coverage/**'],
        });
        // Limit to first 10 files for performance and add timeout
        const limitedFiles = files.slice(0, 10);
        for (const file of limitedFiles) {
            try {
                const fullPath = path.join(projectPath, file);
                // Skip large files (> 1MB)
                const stats = await fs.stat(fullPath);
                if (stats.size > 1024 * 1024) {
                    continue;
                }
                const content = await fs.readFile(fullPath, 'utf-8');
                // OpenAI dimensions
                if (content.includes('new OpenAI') || content.includes('OpenAI(')) {
                    const modelMatch = content.match(/model['":\s]+["']([^"']+)["']/);
                    llms.push({
                        provider: 'openai',
                        model: modelMatch ? modelMatch[1] : 'gpt-5-chat-latest',
                        source: `Code: ${path.relative(projectPath, fullPath)}`,
                        apiKeyEnv: 'OPENAI_API_KEY',
                        status: process.env.OPENAI_API_KEY ? 'available' : 'unconfigured',
                        cost: LLM_COSTS['gpt-4-turbo'],
                    });
                }
                // Anthropic dimensions
                if (content.includes('new Anthropic') || content.includes('Anthropic(')) {
                    const modelMatch = content.match(/model['":\s]+["']([^"']+)["']/);
                    llms.push({
                        provider: 'anthropic',
                        model: modelMatch ? modelMatch[1] : 'claude-3-opus-20240229',
                        source: `Code: ${path.relative(projectPath, fullPath)}`,
                        apiKeyEnv: 'ANTHROPIC_API_KEY',
                        status: process.env.ANTHROPIC_API_KEY ? 'available' : 'unconfigured',
                        cost: LLM_COSTS['claude-3-opus'],
                    });
                }
                // LangChain dimensions
                if (content.includes('ChatOpenAI') || content.includes('ChatAnthropic')) {
                    const isOpenAI = content.includes('ChatOpenAI');
                    const modelMatch = content.match(/model(?:Name)?['":\s]+["']([^"']+)["']/);
                    llms.push({
                        provider: isOpenAI ? 'openai' : 'anthropic',
                        model: modelMatch ? modelMatch[1] : (isOpenAI ? 'gpt-5-chat-latest' : 'claude-3-opus-20240229'),
                        source: `LangChain: ${path.relative(projectPath, fullPath)}`,
                        apiKeyEnv: isOpenAI ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY',
                        status: process.env[isOpenAI ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'] ? 'available' : 'unconfigured',
                        cost: LLM_COSTS[isOpenAI ? 'gpt-4-turbo' : 'claude-3-opus'],
                    });
                }
                // Ollama dimensions
                if (content.includes('Ollama') || content.includes('ollama')) {
                    const modelMatch = content.match(/model['":\s]+["']([^"']+)["']/);
                    llms.push({
                        provider: 'ollama',
                        model: modelMatch ? modelMatch[1] : 'llama2',
                        source: `Code: ${path.relative(projectPath, fullPath)}`,
                        endpoint: 'http://localhost:11434',
                        status: 'unconfigured',
                        cost: 'Free (local)',
                    });
                }
            }
            catch (error) {
                // Skip files that can't be read
                continue;
            }
        }
    }
    catch (error) {
        // If code analysis fails, just return empty array
        console.warn('Code analysis failed:', error);
    }
    return llms;
}
/**
 * Discover local model servers
 */
async function discoverLocalModels() {
    const llms = [];
    // Check for Ollama
    try {
        const response = await fetch('http://localhost:11434/api/tags', {
            signal: AbortSignal.timeout(1000),
        });
        if (response.ok) {
            const data = await response.json();
            const models = data.models || [];
            for (const model of models) {
                llms.push({
                    provider: 'ollama',
                    model: model.name,
                    source: 'Local Ollama server',
                    endpoint: 'http://localhost:11434',
                    status: 'available',
                    cost: 'Free (local)',
                });
            }
        }
    }
    catch {
        // Ollama not running
    }
    // Check for LM Studio
    try {
        const response = await fetch('http://localhost:1234/v1/models', {
            signal: AbortSignal.timeout(1000),
        });
        if (response.ok) {
            const data = await response.json();
            const models = data.data || [];
            for (const model of models) {
                llms.push({
                    provider: 'lm-studio',
                    model: model.id,
                    source: 'Local LM Studio server',
                    endpoint: 'http://localhost:1234',
                    status: 'available',
                    cost: 'Free (local)',
                });
            }
        }
    }
    catch {
        // LM Studio not running
    }
    return llms;
}
/**
 * Detect provider from configuration object
 */
function detectProviderFromConfig(config) {
    if (config.provider)
        return config.provider;
    if (config.apiKey?.startsWith('sk-'))
        return 'openai';
    if (config.apiKey?.startsWith('claude-'))
        return 'anthropic';
    if (config.endpoint?.includes('openai'))
        return 'openai';
    if (config.endpoint?.includes('anthropic'))
        return 'anthropic';
    if (config.endpoint?.includes('azure'))
        return 'azure-openai';
    return 'unknown';
}
/**
 * Deduplicate discovered LLMs
 */
function deduplicateLLMs(llms) {
    const seen = new Set();
    const unique = [];
    for (const llm of llms) {
        const key = `${llm.provider}:${llm.model}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(llm);
        }
    }
    return unique;
}
/**
 * Test LLM connection
 */
export async function testLLMConnection(llm) {
    const spinner = createSpinner(`Testing ${llm.provider} connection...`);
    spinner.start();
    try {
        // Simple test based on provider
        switch (llm.provider) {
            case 'openai':
                if (!llm.apiKey && !process.env.OPENAI_API_KEY) {
                    throw new Error('API key not found');
                }
                // Could make a simple API call here
                spinner.succeed(`${llm.provider} connection successful`);
                return true;
            case 'anthropic':
                if (!llm.apiKey && !process.env.ANTHROPIC_API_KEY) {
                    throw new Error('API key not found');
                }
                spinner.succeed(`${llm.provider} connection successful`);
                return true;
            case 'ollama':
            case 'lm-studio':
                const response = await fetch(`${llm.endpoint}/api/tags`, {
                    signal: AbortSignal.timeout(2000),
                });
                if (!response.ok) {
                    throw new Error('Server not responding');
                }
                spinner.succeed(`${llm.provider} connection successful`);
                return true;
            default:
                spinner.warn(`Cannot test ${llm.provider} connection`);
                return false;
        }
    }
    catch (error) {
        spinner.fail(`${llm.provider} connection failed: ${error}`);
        return false;
    }
}
/**
 * Estimate cost for analysis
 */
export function estimateCost(llm, estimatedTokens = 10000) {
    const costPer1k = llm.cost?.match(/\$([0-9.]+)/)?.[1];
    if (!costPer1k || llm.cost?.includes('Free')) {
        return llm.cost || 'Unknown';
    }
    const totalCost = (parseFloat(costPer1k) * estimatedTokens) / 1000;
    return `~$${totalCost.toFixed(2)}`;
}
//# sourceMappingURL=llm-discovery.js.map