"use strict";
/**
 * LLM command - Manage LLM configurations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmCommand = llmCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const llm_discovery_1 = require("../services/llm-discovery");
const display_1 = require("../utils/display");
const errors_1 = require("../utils/errors");
const config_1 = require("../utils/config");
function llmCommand() {
    return new commander_1.Command('llm')
        .description('Manage LLM configurations')
        .addCommand(llmDiscoverCommand())
        .addCommand(llmTestCommand())
        .addCommand(llmSelectCommand())
        .addCommand(llmCostsCommand());
}
function llmDiscoverCommand() {
    return new commander_1.Command('discover')
        .description('Discover available LLM configurations')
        .action((0, errors_1.withErrorHandling)(async () => {
        console.log(chalk_1.default.bold('\n🔍 Discovering LLM Configurations\n'));
        const llms = await (0, llm_discovery_1.discoverLLMs)();
        if (llms.length > 0) {
            (0, display_1.displayLLMOptions)(llms);
            (0, display_1.success)(`\nFound ${llms.length} LLM configuration(s)`);
        }
        else {
            (0, display_1.info)('No LLM configurations found');
            console.log(chalk_1.default.gray('\nTips:'));
            console.log(chalk_1.default.cyan('  • Set OPENAI_API_KEY environment variable'));
            console.log(chalk_1.default.cyan('  • Create a .env file with API keys'));
            console.log(chalk_1.default.cyan('  • Install Ollama for local models'));
        }
    }));
}
function llmTestCommand() {
    return new commander_1.Command('test')
        .description('Test LLM connections')
        .action((0, errors_1.withErrorHandling)(async () => {
        console.log(chalk_1.default.bold('\n🧪 Testing LLM Connections\n'));
        const llms = await (0, llm_discovery_1.discoverLLMs)();
        for (const llm of llms) {
            await (0, llm_discovery_1.testLLMConnection)(llm);
        }
    }));
}
function llmSelectCommand() {
    return new commander_1.Command('select')
        .description('Select an LLM for analysis')
        .action((0, errors_1.withErrorHandling)(async () => {
        console.log(chalk_1.default.bold('\n🎯 Select LLM Configuration\n'));
        const llms = await (0, llm_discovery_1.discoverLLMs)();
        if (llms.length === 0) {
            (0, display_1.error)('No LLM configurations found');
            return;
        }
        // Find OpenAI config
        const openaiConfig = llms.find(c => c.provider === 'openai');
        if (openaiConfig) {
            // Simplified flow: 3 options for OpenAI
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
                            name: chalk_1.default.gray('Use a different provider'),
                            value: 'other'
                        }
                    ]
                }]);
            let selectedModel = llm_discovery_1.DEFAULT_GPT5_MODEL;
            if (choice === 'select') {
                const { model } = await inquirer_1.default.prompt([{
                        type: 'list',
                        name: 'model',
                        message: 'Select OpenAI model:',
                        choices: llm_discovery_1.GPT5_MODELS.map(m => ({
                            name: `${m.name} - ${m.description}`,
                            value: m.id,
                        })),
                        default: llm_discovery_1.DEFAULT_GPT5_MODEL,
                    }]);
                selectedModel = model;
            }
            else if (choice === 'other') {
                // Show other providers
                const otherLLMs = llms.filter(l => l.provider !== 'openai');
                if (otherLLMs.length === 0) {
                    (0, display_1.error)('No other providers found');
                    return;
                }
                const { selection } = await inquirer_1.default.prompt([{
                        type: 'list',
                        name: 'selection',
                        message: 'Select provider:',
                        choices: otherLLMs.map((llm, index) => ({
                            name: `${llm.provider} (${llm.model}) - ${llm.source}`,
                            value: index,
                        })),
                    }]);
                const selected = otherLLMs[selection];
                const config = await (0, config_1.loadConfig)();
                config.llm = {
                    ...config.llm,
                    selected: {
                        provider: selected.provider,
                        model: selected.model,
                        apiKey: selected.apiKey,
                        endpoint: selected.endpoint,
                    },
                };
                await (0, config_1.saveConfig)(config);
                (0, display_1.success)(`Selected ${selected.provider} (${selected.model})`);
                return;
            }
            // Save OpenAI config
            const config = await (0, config_1.loadConfig)();
            config.llm = {
                ...config.llm,
                selected: {
                    provider: openaiConfig.provider,
                    model: selectedModel,
                    apiKey: openaiConfig.apiKey,
                    endpoint: openaiConfig.endpoint,
                },
            };
            await (0, config_1.saveConfig)(config);
            (0, display_1.success)(`Selected OpenAI (${selectedModel})`);
        }
        else {
            // No OpenAI, show all options
            const choices = llms.map((llm, index) => ({
                name: `${llm.provider} (${llm.model}) - ${llm.source}`,
                value: index,
            }));
            const { selection } = await inquirer_1.default.prompt([{
                    type: 'list',
                    name: 'selection',
                    message: 'Select an LLM:',
                    choices,
                }]);
            const selected = llms[selection];
            const config = await (0, config_1.loadConfig)();
            config.llm = {
                ...config.llm,
                selected: {
                    provider: selected.provider,
                    model: selected.model,
                    apiKey: selected.apiKey,
                    endpoint: selected.endpoint,
                },
            };
            await (0, config_1.saveConfig)(config);
            (0, display_1.success)(`Selected ${selected.provider} (${selected.model})`);
        }
    }));
}
function llmCostsCommand() {
    return new commander_1.Command('costs')
        .description('Estimate costs for analysis')
        .option('-t, --tokens <number>', 'Estimated tokens', '10000')
        .action((0, errors_1.withErrorHandling)(async (options) => {
        console.log(chalk_1.default.bold('\n💰 Cost Estimation\n'));
        const config = await (0, config_1.loadConfig)();
        const tokens = parseInt(options.tokens);
        if (config.llm?.selected) {
            const llm = {
                provider: config.llm.selected.provider,
                model: config.llm.selected.model,
                source: 'config',
                status: 'available',
                cost: '~$0.03', // Default estimate
            };
            const cost = (0, llm_discovery_1.estimateCost)(llm, tokens);
            (0, display_1.info)(`Estimated cost for ${tokens} tokens: ${cost}`);
        }
        else {
            (0, display_1.error)('No LLM selected. Run "identro-eval llm select" first');
        }
    }));
}
//# sourceMappingURL=llm.js.map