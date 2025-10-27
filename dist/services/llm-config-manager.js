/**
 * LLM Configuration Manager
 *
 * Handles dynamic discovery of LLM configurations and updating eval.config.yml
 */
import { discoverLLMs, GPT5_MODELS, DEFAULT_GPT5_MODEL } from './llm-discovery';
import { loadConfig, updateLLMConfig, hasLLMConfig } from '../utils/config';
import chalk from 'chalk';
import inquirer from 'inquirer';
export class LLMConfigManager {
    /**
     * Discover and configure LLM for the project
     */
    async discoverAndConfigure(projectPath, options = {}) {
        const { interactive = true, force = false } = options;
        // Load existing config
        const config = await loadConfig();
        // Discover LLM configurations first
        const discovered = await discoverLLMs(projectPath);
        if (discovered.length === 0) {
            console.log(chalk.yellow('⚠️  No LLM configurations found'));
            console.log('   Please ensure you have:');
            console.log('   - API keys in .env files (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)');
            console.log('   - LLM packages installed (openai, anthropic, etc.)');
            return null;
        }
        let selectedConfig;
        // Check if LLM config already exists and we're not forcing rediscovery
        if (!force && hasLLMConfig(config) && interactive) {
            console.log(chalk.green(`✅ Found ${discovered.length} LLM configuration(s)`));
            // Find OpenAI config
            const openaiConfig = discovered.find(c => c.provider === 'openai');
            if (openaiConfig) {
                // Simplified flow: 3 options
                const { choice } = await inquirer.prompt([{
                        type: 'list',
                        name: 'choice',
                        message: 'Select LLM configuration:',
                        choices: [
                            {
                                name: `Use default model (${chalk.cyan(DEFAULT_GPT5_MODEL)})`,
                                value: 'default'
                            },
                            {
                                name: 'Select a different model',
                                value: 'select'
                            },
                            {
                                name: chalk.gray('Enter a new configuration'),
                                value: 'new'
                            }
                        ]
                    }]);
                if (choice === 'new') {
                    console.log(chalk.yellow('\n⚠ "Enter a new configuration" will be implemented in a future update'));
                    console.log(chalk.gray('For now, please set up your API key in .env file and restart'));
                    process.exit(0);
                }
                selectedConfig = { ...openaiConfig };
                if (choice === 'default') {
                    selectedConfig.model = DEFAULT_GPT5_MODEL;
                }
                else if (choice === 'select') {
                    const { selectedModel } = await inquirer.prompt([{
                            type: 'list',
                            name: 'selectedModel',
                            message: 'Select OpenAI model:',
                            choices: GPT5_MODELS.map(model => ({
                                name: `${model.name} - ${model.description}`,
                                value: model.id,
                            })),
                            default: DEFAULT_GPT5_MODEL,
                        }]);
                    selectedConfig.model = selectedModel;
                }
            }
            else {
                // Non-OpenAI provider
                selectedConfig = discovered[0];
            }
        }
        else if (!force && hasLLMConfig(config)) {
            // Non-interactive mode, use existing config
            return config.llm;
        }
        else if (discovered.length === 1 && interactive) {
            // Only one option - simplified flow
            const config = discovered[0];
            console.log(chalk.cyan('📋 Detected Configuration:'));
            console.log(chalk.gray(`  • Provider: ${config.provider.toUpperCase()}`));
            console.log(chalk.gray(`  • Source: ${config.source}`));
            console.log();
            if (config.provider === 'openai') {
                // Simplified flow: 3 options
                const { choice } = await inquirer.prompt([{
                        type: 'list',
                        name: 'choice',
                        message: 'Select LLM configuration:',
                        choices: [
                            {
                                name: `Use default model (${chalk.cyan(DEFAULT_GPT5_MODEL)})`,
                                value: 'default'
                            },
                            {
                                name: 'Select a different model',
                                value: 'select'
                            },
                            {
                                name: chalk.gray('Enter a new configuration'),
                                value: 'new'
                            }
                        ]
                    }]);
                if (choice === 'new') {
                    console.log(chalk.yellow('\n⚠ "Enter a new configuration" will be implemented in a future update'));
                    console.log(chalk.gray('For now, please set up your API key in .env file and restart'));
                    process.exit(0);
                }
                selectedConfig = { ...config };
                if (choice === 'default') {
                    selectedConfig.model = DEFAULT_GPT5_MODEL;
                }
                else if (choice === 'select') {
                    const { selectedModel } = await inquirer.prompt([{
                            type: 'list',
                            name: 'selectedModel',
                            message: 'Select OpenAI model:',
                            choices: GPT5_MODELS.map(model => ({
                                name: `${model.name} - ${model.description}`,
                                value: model.id,
                            })),
                            default: DEFAULT_GPT5_MODEL,
                        }]);
                    selectedConfig.model = selectedModel;
                }
            }
            else {
                // Non-OpenAI provider, just confirm
                const { confirmConfig } = await inquirer.prompt([{
                        type: 'confirm',
                        name: 'confirmConfig',
                        message: `Use ${config.provider.toUpperCase()} ${config.model}?`,
                        default: true
                    }]);
                if (!confirmConfig) {
                    console.log(chalk.yellow('\n⚠ LLM configuration declined'));
                    console.log(chalk.gray('Please set up your preferred API key in .env file and restart'));
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
                name: chalk.gray('Enter a new configuration'),
                value: 'new'
            });
            const { selected } = await inquirer.prompt([{
                    type: 'list',
                    name: 'selected',
                    message: 'Select LLM provider:',
                    choices,
                }]);
            if (selected === 'new') {
                console.log(chalk.yellow('\n⚠ "Enter a new configuration" will be implemented in a future update'));
                console.log(chalk.gray('For now, please set up your API key in .env file and restart'));
                process.exit(0);
            }
            selectedConfig = selected;
            // If OpenAI selected, use simplified 3-option flow
            if (selectedConfig.provider === 'openai') {
                const { choice } = await inquirer.prompt([{
                        type: 'list',
                        name: 'choice',
                        message: 'Select model:',
                        choices: [
                            {
                                name: `Use default model (${chalk.cyan(DEFAULT_GPT5_MODEL)})`,
                                value: 'default'
                            },
                            {
                                name: 'Select a different model',
                                value: 'select'
                            }
                        ]
                    }]);
                if (choice === 'default') {
                    selectedConfig.model = DEFAULT_GPT5_MODEL;
                }
                else if (choice === 'select') {
                    const { selectedModel } = await inquirer.prompt([{
                            type: 'list',
                            name: 'selectedModel',
                            message: 'Select OpenAI model:',
                            choices: GPT5_MODELS.map(model => ({
                                name: `${model.name} - ${model.description}`,
                                value: model.id,
                            })),
                            default: DEFAULT_GPT5_MODEL,
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
        await updateLLMConfig(projectPath, llmConfig);
        return llmConfig;
    }
    /**
     * Get current LLM configuration
     */
    async getCurrentConfig(projectPath) {
        const config = await loadConfig();
        return config.llm;
    }
    /**
     * Check if LLM is configured
     */
    async isConfigured(projectPath) {
        const config = await loadConfig();
        return hasLLMConfig(config);
    }
    /**
     * Reset LLM configuration (force rediscovery)
     */
    async resetConfig(projectPath) {
        return this.discoverAndConfigure(projectPath, { force: true });
    }
}
// Export singleton instance
export const llmConfigManager = new LLMConfigManager();
//# sourceMappingURL=llm-config-manager.js.map