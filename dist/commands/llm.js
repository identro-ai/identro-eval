/**
 * LLM command - Manage LLM configurations
 */
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { discoverLLMs, testLLMConnection, estimateCost, GPT5_MODELS, DEFAULT_GPT5_MODEL } from '../services/llm-discovery';
import { displayLLMOptions, success, error, info } from '../utils/display';
import { withErrorHandling } from '../utils/errors';
import { loadConfig, saveConfig } from '../utils/config';
export function llmCommand() {
    return new Command('llm')
        .description('Manage LLM configurations')
        .addCommand(llmDiscoverCommand())
        .addCommand(llmTestCommand())
        .addCommand(llmSelectCommand())
        .addCommand(llmCostsCommand());
}
function llmDiscoverCommand() {
    return new Command('discover')
        .description('Discover available LLM configurations')
        .action(withErrorHandling(async () => {
        console.log(chalk.bold('\n🔍 Discovering LLM Configurations\n'));
        const llms = await discoverLLMs();
        if (llms.length > 0) {
            displayLLMOptions(llms);
            success(`\nFound ${llms.length} LLM configuration(s)`);
        }
        else {
            info('No LLM configurations found');
            console.log(chalk.gray('\nTips:'));
            console.log(chalk.cyan('  • Set OPENAI_API_KEY environment variable'));
            console.log(chalk.cyan('  • Create a .env file with API keys'));
            console.log(chalk.cyan('  • Install Ollama for local models'));
        }
    }));
}
function llmTestCommand() {
    return new Command('test')
        .description('Test LLM connections')
        .action(withErrorHandling(async () => {
        console.log(chalk.bold('\n🧪 Testing LLM Connections\n'));
        const llms = await discoverLLMs();
        for (const llm of llms) {
            await testLLMConnection(llm);
        }
    }));
}
function llmSelectCommand() {
    return new Command('select')
        .description('Select an LLM for analysis')
        .action(withErrorHandling(async () => {
        console.log(chalk.bold('\n🎯 Select LLM Configuration\n'));
        const llms = await discoverLLMs();
        if (llms.length === 0) {
            error('No LLM configurations found');
            return;
        }
        // Find OpenAI config
        const openaiConfig = llms.find(c => c.provider === 'openai');
        if (openaiConfig) {
            // Simplified flow: 3 options for OpenAI
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
                            name: chalk.gray('Use a different provider'),
                            value: 'other'
                        }
                    ]
                }]);
            let selectedModel = DEFAULT_GPT5_MODEL;
            if (choice === 'select') {
                const { model } = await inquirer.prompt([{
                        type: 'list',
                        name: 'model',
                        message: 'Select OpenAI model:',
                        choices: GPT5_MODELS.map(m => ({
                            name: `${m.name} - ${m.description}`,
                            value: m.id,
                        })),
                        default: DEFAULT_GPT5_MODEL,
                    }]);
                selectedModel = model;
            }
            else if (choice === 'other') {
                // Show other providers
                const otherLLMs = llms.filter(l => l.provider !== 'openai');
                if (otherLLMs.length === 0) {
                    error('No other providers found');
                    return;
                }
                const { selection } = await inquirer.prompt([{
                        type: 'list',
                        name: 'selection',
                        message: 'Select provider:',
                        choices: otherLLMs.map((llm, index) => ({
                            name: `${llm.provider} (${llm.model}) - ${llm.source}`,
                            value: index,
                        })),
                    }]);
                const selected = otherLLMs[selection];
                const config = await loadConfig();
                config.llm = {
                    ...config.llm,
                    selected: {
                        provider: selected.provider,
                        model: selected.model,
                        apiKey: selected.apiKey,
                        endpoint: selected.endpoint,
                    },
                };
                await saveConfig(config);
                success(`Selected ${selected.provider} (${selected.model})`);
                return;
            }
            // Save OpenAI config
            const config = await loadConfig();
            config.llm = {
                ...config.llm,
                selected: {
                    provider: openaiConfig.provider,
                    model: selectedModel,
                    apiKey: openaiConfig.apiKey,
                    endpoint: openaiConfig.endpoint,
                },
            };
            await saveConfig(config);
            success(`Selected OpenAI (${selectedModel})`);
        }
        else {
            // No OpenAI, show all options
            const choices = llms.map((llm, index) => ({
                name: `${llm.provider} (${llm.model}) - ${llm.source}`,
                value: index,
            }));
            const { selection } = await inquirer.prompt([{
                    type: 'list',
                    name: 'selection',
                    message: 'Select an LLM:',
                    choices,
                }]);
            const selected = llms[selection];
            const config = await loadConfig();
            config.llm = {
                ...config.llm,
                selected: {
                    provider: selected.provider,
                    model: selected.model,
                    apiKey: selected.apiKey,
                    endpoint: selected.endpoint,
                },
            };
            await saveConfig(config);
            success(`Selected ${selected.provider} (${selected.model})`);
        }
    }));
}
function llmCostsCommand() {
    return new Command('costs')
        .description('Estimate costs for analysis')
        .option('-t, --tokens <number>', 'Estimated tokens', '10000')
        .action(withErrorHandling(async (options) => {
        console.log(chalk.bold('\n💰 Cost Estimation\n'));
        const config = await loadConfig();
        const tokens = parseInt(options.tokens);
        if (config.llm?.selected) {
            const llm = {
                provider: config.llm.selected.provider,
                model: config.llm.selected.model,
                source: 'config',
                status: 'available',
                cost: '~$0.03', // Default estimate
            };
            const cost = estimateCost(llm, tokens);
            info(`Estimated cost for ${tokens} tokens: ${cost}`);
        }
        else {
            error('No LLM selected. Run "identro-eval llm select" first');
        }
    }));
}
//# sourceMappingURL=llm.js.map