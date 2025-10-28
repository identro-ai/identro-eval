"use strict";
/**
 * LLM Configuration Manager
 *
 * Handles dynamic discovery of LLM configurations and updating eval.config.yml
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmConfigManager = exports.LLMConfigManager = void 0;
const llm_discovery_1 = require("./llm-discovery");
const config_1 = require("../utils/config");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
class LLMConfigManager {
    /**
     * Discover and configure LLM for the project
     */
    async discoverAndConfigure(projectPath, options = {}) {
        const { interactive = true, force = false } = options;
        // Load existing config
        const config = await (0, config_1.loadConfig)();
        // Discover LLM configurations first
        const discovered = await (0, llm_discovery_1.discoverLLMs)(projectPath);
        if (discovered.length === 0) {
            console.log(chalk_1.default.yellow('⚠️  No LLM configurations found'));
            console.log('   Please ensure you have:');
            console.log('   - API keys in .env files (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)');
            console.log('   - LLM packages installed (openai, anthropic, etc.)');
            return null;
        }
        let selectedConfig;
        // Check if LLM config already exists and we're not forcing rediscovery
        if (!force && (0, config_1.hasLLMConfig)(config) && interactive) {
            console.log(chalk_1.default.green(`✅ Found ${discovered.length} LLM configuration(s)`));
            // Find OpenAI config
            const openaiConfig = discovered.find(c => c.provider === 'openai');
            if (openaiConfig) {
                // Simplified flow: 3 options
                const { choice } = await inquirer_1.default.prompt([{
                        type: 'list',
                        name: 'choice',
                        message: 'Select LLM configuration:',
                        choices: [
                            {
                                name: `Use default model (${chalk_1.default.cyan(llm_discovery_1.DEFAULT_GPT5_MODEL)})`,
                                value: 'default'
                            },
                            {
                                name: 'Select a different model',
                                value: 'select'
                            },
                            {
                                name: chalk_1.default.gray('Enter a new configuration'),
                                value: 'new'
                            }
                        ]
                    }]);
                if (choice === 'new') {
                    console.log(chalk_1.default.yellow('\n⚠ "Enter a new configuration" will be implemented in a future update'));
                    console.log(chalk_1.default.gray('For now, please set up your API key in .env file and restart'));
                    process.exit(0);
                }
                selectedConfig = { ...openaiConfig };
                if (choice === 'default') {
                    selectedConfig.model = llm_discovery_1.DEFAULT_GPT5_MODEL;
                }
                else if (choice === 'select') {
                    const { selectedModel } = await inquirer_1.default.prompt([{
                            type: 'list',
                            name: 'selectedModel',
                            message: 'Select OpenAI model:',
                            choices: llm_discovery_1.GPT5_MODELS.map(model => ({
                                name: `${model.name} - ${model.description}`,
                                value: model.id,
                            })),
                            default: llm_discovery_1.DEFAULT_GPT5_MODEL,
                        }]);
                    selectedConfig.model = selectedModel;
                }
            }
            else {
                // Non-OpenAI provider
                selectedConfig = discovered[0];
            }
        }
        else if (!force && (0, config_1.hasLLMConfig)(config)) {
            // Non-interactive mode, use existing config
            return config.llm;
        }
        else if (discovered.length === 1 && interactive) {
            // Only one option - simplified flow
            const config = discovered[0];
            console.log(chalk_1.default.cyan('📋 Detected Configuration:'));
            console.log(chalk_1.default.gray(`  • Provider: ${config.provider.toUpperCase()}`));
            console.log(chalk_1.default.gray(`  • Source: ${config.source}`));
            console.log();
            if (config.provider === 'openai') {
                // Simplified flow: 3 options
                const { choice } = await inquirer_1.default.prompt([{
                        type: 'list',
                        name: 'choice',
                        message: 'Select LLM configuration:',
                        choices: [
                            {
                                name: `Use default model (${chalk_1.default.cyan(llm_discovery_1.DEFAULT_GPT5_MODEL)})`,
                                value: 'default'
                            },
                            {
                                name: 'Select a different model',
                                value: 'select'
                            },
                            {
                                name: chalk_1.default.gray('Enter a new configuration'),
                                value: 'new'
                            }
                        ]
                    }]);
                if (choice === 'new') {
                    console.log(chalk_1.default.yellow('\n⚠ "Enter a new configuration" will be implemented in a future update'));
                    console.log(chalk_1.default.gray('For now, please set up your API key in .env file and restart'));
                    process.exit(0);
                }
                selectedConfig = { ...config };
                if (choice === 'default') {
                    selectedConfig.model = llm_discovery_1.DEFAULT_GPT5_MODEL;
                }
                else if (choice === 'select') {
                    const { selectedModel } = await inquirer_1.default.prompt([{
                            type: 'list',
                            name: 'selectedModel',
                            message: 'Select OpenAI model:',
                            choices: llm_discovery_1.GPT5_MODELS.map(model => ({
                                name: `${model.name} - ${model.description}`,
                                value: model.id,
                            })),
                            default: llm_discovery_1.DEFAULT_GPT5_MODEL,
                        }]);
                    selectedConfig.model = selectedModel;
                }
            }
            else {
                // Non-OpenAI provider, just confirm
                const { confirmConfig } = await inquirer_1.default.prompt([{
                        type: 'confirm',
                        name: 'confirmConfig',
                        message: `Use ${config.provider.toUpperCase()} ${config.model}?`,
                        default: true
                    }]);
                if (!confirmConfig) {
                    console.log(chalk_1.default.yellow('\n⚠ LLM configuration declined'));
                    console.log(chalk_1.default.gray('Please set up your preferred API key in .env file and restart'));
                    process.exit(0);
                }
                selectedConfig = config;
            }
        }
        else if (discovered.length === 1) {
            // Non-interactive mode with single option
            selectedConfig = discovered[0];
        }
        else if (interactive) {
            // Multiple options - first select provider
            const openaiConfig = discovered.find(c => c.provider === 'openai');
            const otherConfigs = discovered.filter(c => c.provider !== 'openai');
            const choices = [];
            if (openaiConfig) {
                choices.push({
                    name: `OpenAI (from ${openaiConfig.source})`,
                    value: openaiConfig
                });
            }
            otherConfigs.forEach(config => {
                choices.push({
                    name: `${config.provider.toUpperCase()} ${config.model} (${config.source})`,
                    value: config
                });
            });
            choices.push({
                name: chalk_1.default.gray('Enter a new configuration'),
                value: 'new'
            });
            const { selected } = await inquirer_1.default.prompt([{
                    type: 'list',
                    name: 'selected',
                    message: 'Select LLM provider:',
                    choices,
                }]);
            if (selected === 'new') {
                console.log(chalk_1.default.yellow('\n⚠ "Enter a new configuration" will be implemented in a future update'));
                console.log(chalk_1.default.gray('For now, please set up your API key in .env file and restart'));
                process.exit(0);
            }
            selectedConfig = selected;
            // If OpenAI selected, use simplified 3-option flow
            if (selectedConfig.provider === 'openai') {
                const { choice } = await inquirer_1.default.prompt([{
                        type: 'list',
                        name: 'choice',
                        message: 'Select model:',
                        choices: [
                            {
                                name: `Use default model (${chalk_1.default.cyan(llm_discovery_1.DEFAULT_GPT5_MODEL)})`,
                                value: 'default'
                            },
                            {
                                name: 'Select a different model',
                                value: 'select'
                            }
                        ]
                    }]);
                if (choice === 'default') {
                    selectedConfig.model = llm_discovery_1.DEFAULT_GPT5_MODEL;
                }
                else if (choice === 'select') {
                    const { selectedModel } = await inquirer_1.default.prompt([{
                            type: 'list',
                            name: 'selectedModel',
                            message: 'Select OpenAI model:',
                            choices: llm_discovery_1.GPT5_MODELS.map(model => ({
                                name: `${model.name} - ${model.description}`,
                                value: model.id,
                            })),
                            default: llm_discovery_1.DEFAULT_GPT5_MODEL,
                        }]);
                    selectedConfig.model = selectedModel;
                }
            }
        }
        else {
            // Non-interactive mode, use first available option
            selectedConfig = discovered[0];
        }
        // Create LLM configuration object
        const llmConfig = {
            discovered: discovered.map(d => ({
                provider: d.provider,
                model: d.model,
                source: d.source,
                apiKeyEnv: d.apiKeyEnv,
                endpoint: d.endpoint,
            })),
            selected: {
                provider: selectedConfig.provider,
                model: selectedConfig.model,
                apiKey: selectedConfig.apiKey,
                endpoint: selectedConfig.endpoint,
                temperature: 0.3,
                maxTokens: 2000,
            },
        };
        // Update the configuration file
        await (0, config_1.updateLLMConfig)(projectPath, llmConfig);
        return llmConfig;
    }
    /**
     * Get current LLM configuration
     */
    async getCurrentConfig(projectPath) {
        const config = await (0, config_1.loadConfig)();
        return config.llm;
    }
    /**
     * Check if LLM is configured
     */
    async isConfigured(projectPath) {
        const config = await (0, config_1.loadConfig)();
        return (0, config_1.hasLLMConfig)(config);
    }
    /**
     * Reset LLM configuration (force rediscovery)
     */
    async resetConfig(projectPath) {
        return this.discoverAndConfigure(projectPath, { force: true });
    }
}
exports.LLMConfigManager = LLMConfigManager;
// Export singleton instance
exports.llmConfigManager = new LLMConfigManager();
//# sourceMappingURL=llm-config-manager.js.map