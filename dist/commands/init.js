"use strict";
/**
 * Init command - Initialize Identro Eval in a project
 *
 * Updated to use DiscoveryService for framework detection and enhanced with new commands
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
exports.initCommand = initCommand;
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const config_1 = require("../utils/config");
const templates_1 = require("../utils/templates");
const display_1 = require("../utils/display");
const llm_discovery_1 = require("../services/llm-discovery");
const discovery_service_1 = require("../services/discovery-service");
const errors_1 = require("../utils/errors");
/**
 * Create the init command
 */
function initCommand() {
    return new commander_1.Command('init')
        .description('Initialize Identro Eval in your project')
        .option('-y, --yes', 'Skip prompts and use defaults')
        .option('-f, --force', 'Overwrite existing configuration')
        .action((0, errors_1.withErrorHandling)(async (options) => {
        await runInit(options);
    }));
}
/**
 * Run the initialization process
 */
async function runInit(options) {
    console.log(chalk_1.default.bold('\n🚀 Initializing Identro Eval\n'));
    // Check for existing config
    if (await (0, config_1.configExists)() && !options.force) {
        (0, display_1.warning)('Configuration already exists');
        const { overwrite } = await inquirer_1.default.prompt([{
                type: 'confirm',
                name: 'overwrite',
                message: 'Do you want to overwrite the existing configuration?',
                default: false,
            }]);
        if (!overwrite) {
            (0, display_1.info)('Initialization cancelled');
            return;
        }
    }
    let config = { ...config_1.DEFAULT_CONFIG };
    if (!options.yes) {
        // Interactive setup
        config = await interactiveSetup();
    }
    else {
        // Auto setup with defaults
        (0, display_1.info)('Using default configuration');
        // Try to discover LLMs automatically
        const llms = await (0, llm_discovery_1.discoverLLMs)();
        if (llms.length > 0) {
            const available = llms.filter(llm => llm.status === 'available');
            if (available.length > 0) {
                config.llm = {
                    ...config_1.DEFAULT_CONFIG.llm,
                    discovered: llms,
                    selected: {
                        provider: available[0].provider,
                        model: available[0].model,
                        apiKey: available[0].apiKey,
                        endpoint: available[0].endpoint,
                    },
                };
                (0, display_1.info)(`Auto-selected LLM: ${available[0].provider} (${available[0].model})`);
            }
        }
    }
    // Initialize .identro directory with templates
    const spinner = (0, display_1.createSpinner)('Initializing Identro configuration...');
    spinner.start();
    try {
        // Extract configuration for template variables
        const templateConfig = {
            framework: config.framework || 'auto-detect',
            llmProvider: config.llm?.selected?.provider || 'openai',
            llmModel: config.llm?.selected?.model || 'gpt-4-turbo-preview',
            outputFormat: config.output?.format || 'json',
            outputDirectory: config.output?.directory || './identro-reports',
        };
        // Initialize .identro directory with templates
        await (0, templates_1.initializeIdentroDirectory)(process.cwd(), templateConfig);
        // Update .gitignore
        await (0, templates_1.updateGitignore)(process.cwd());
        spinner.succeed('Configuration initialized');
        // Display summary
        displaySummary(config);
        (0, display_1.success)('\n✨ Identro Eval initialized successfully!');
        console.log(chalk_1.default.gray('\nNext steps:'));
        console.log(chalk_1.default.cyan('  1. Run'), chalk_1.default.bold('identro-eval discover'), chalk_1.default.cyan('to find agents and teams'));
        console.log(chalk_1.default.cyan('  2. Run'), chalk_1.default.bold('identro-eval analyze'), chalk_1.default.cyan('to extract contracts and capabilities'));
        console.log(chalk_1.default.cyan('  3. Run'), chalk_1.default.bold('identro-eval generate'), chalk_1.default.cyan('to generate tests using LLM'));
        console.log(chalk_1.default.cyan('  4. Run'), chalk_1.default.bold('identro-eval test'), chalk_1.default.cyan('to execute evaluation tests'));
        console.log(chalk_1.default.cyan('  5. Run'), chalk_1.default.bold('identro-eval report'), chalk_1.default.cyan('to generate detailed reports'));
        console.log(chalk_1.default.gray('\nOr use the guided experience:'));
        console.log(chalk_1.default.cyan('  • Run'), chalk_1.default.bold('identro-eval interactive'), chalk_1.default.cyan('for step-by-step guidance'));
        console.log(chalk_1.default.gray('\nManagement commands:'));
        console.log(chalk_1.default.cyan('  • Run'), chalk_1.default.bold('identro-eval agents list'), chalk_1.default.cyan('to manage individual agents'));
        console.log(chalk_1.default.cyan('  • Run'), chalk_1.default.bold('identro-eval teams list'), chalk_1.default.cyan('to manage teams/crews'));
        console.log(chalk_1.default.cyan('  • Run'), chalk_1.default.bold('identro-eval dimensions list'), chalk_1.default.cyan('to manage test dimensions'));
    }
    catch (err) {
        spinner.fail('Failed to initialize configuration');
        throw err;
    }
}
/**
 * Interactive setup wizard
 */
async function interactiveSetup() {
    const config = {};
    (0, display_1.section)('Project Configuration');
    // Framework detection using DiscoveryService
    const spinner = (0, display_1.createSpinner)('Detecting framework...');
    spinner.start();
    let detectedFramework;
    try {
        const discoveryService = new discovery_service_1.DiscoveryService();
        const discoveryResult = await discoveryService.discoverAll({
            projectPath: process.cwd(),
            includeTeams: false,
            initializeDimensions: false,
            initializeConfig: false
        });
        detectedFramework = discoveryResult.framework;
        spinner.succeed(`Detected framework: ${detectedFramework}`);
        // Show what was found
        if (discoveryResult.agents.length > 0 || discoveryResult.teams.length > 0) {
            (0, display_1.info)(`Found ${discoveryResult.agents.length} agent(s) and ${discoveryResult.teams.length} team(s)`);
        }
    }
    catch (err) {
        spinner.warn('Could not auto-detect framework');
    }
    // Framework selection with auto-detected default
    const frameworkChoices = [
        { name: 'Auto-detect (recommended)', value: 'auto-detect' },
        { name: 'LangChain', value: 'langchain' },
        { name: 'CrewAI', value: 'crewai' },
        { name: 'MCP (Model Context Protocol)', value: 'mcp' },
        { name: 'Custom/Other', value: 'custom' },
    ];
    // If we detected a framework, highlight it
    if (detectedFramework) {
        const detectedChoice = frameworkChoices.find(choice => choice.value === detectedFramework);
        if (detectedChoice) {
            detectedChoice.name += chalk_1.default.green(' ✓ (detected)');
        }
    }
    const { framework } = await inquirer_1.default.prompt([{
            type: 'list',
            name: 'framework',
            message: 'Which AI framework are you using?',
            choices: frameworkChoices,
            default: detectedFramework || 'auto-detect',
        }]);
    config.framework = framework;
    // LLM Configuration
    (0, display_1.section)('LLM Configuration');
    const llms = await (0, llm_discovery_1.discoverLLMs)();
    if (llms.length > 0) {
        (0, display_1.info)(`Found ${llms.length} LLM configuration(s)`);
        const choices = llms.map((llm, index) => ({
            name: `${llm.provider} (${llm.model}) - ${llm.source} ${llm.cost ? `- ${llm.cost}` : ''}`,
            value: index,
        }));
        choices.push({ name: 'Configure manually', value: -1 });
        choices.push({ name: 'Use mock provider (no LLM required)', value: -2 });
        const { llmChoice } = await inquirer_1.default.prompt([{
                type: 'list',
                name: 'llmChoice',
                message: 'Select an LLM for contract analysis:',
                choices,
            }]);
        if (llmChoice >= 0) {
            const selected = llms[llmChoice];
            config.llm = {
                ...config_1.DEFAULT_CONFIG.llm,
                discovered: llms,
                selected: {
                    provider: selected.provider,
                    model: selected.model,
                    apiKey: selected.apiKey,
                    endpoint: selected.endpoint,
                },
            };
            // Check if API key is needed
            if (!selected.apiKey && selected.apiKeyEnv) {
                (0, display_1.warning)(`API key not found. Set ${selected.apiKeyEnv} environment variable`);
            }
        }
        else if (llmChoice === -1) {
            // Manual configuration
            config.llm = await manualLLMConfig();
        }
        else {
            // Mock provider
            config.llm = {
                ...config_1.DEFAULT_CONFIG.llm,
                selected: {
                    provider: 'mock',
                    model: 'mock',
                },
            };
        }
    }
    else {
        (0, display_1.warning)('No LLM configurations found');
        const { configureLLM } = await inquirer_1.default.prompt([{
                type: 'confirm',
                name: 'configureLLM',
                message: 'Would you like to configure an LLM manually?',
                default: true,
            }]);
        if (configureLLM) {
            config.llm = await manualLLMConfig();
        }
        else {
            config.llm = {
                ...config_1.DEFAULT_CONFIG.llm,
                selected: {
                    provider: 'mock',
                    model: 'mock',
                },
            };
            (0, display_1.info)('Using mock provider for testing');
        }
    }
    // Output configuration
    (0, display_1.section)('Output Configuration');
    const { outputFormat, outputDir } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'outputFormat',
            message: 'Default output format:',
            choices: [
                { name: 'JSON', value: 'json' },
                { name: 'Markdown', value: 'markdown' },
                { name: 'HTML', value: 'html' },
            ],
            default: 'json',
        },
        {
            type: 'input',
            name: 'outputDir',
            message: 'Output directory for reports:',
            default: './identro-reports',
        },
    ]);
    config.output = {
        format: outputFormat,
        directory: outputDir,
    };
    // evaluation dimensions - load dynamically from core dimension definitions
    (0, display_1.section)('evaluation dimensions');
    // Load core dimension definitions to get available dimensions
    const { loadCoreDimensionDefinitions } = await Promise.resolve().then(() => __importStar(require('../_internal/core')));
    const coreDefinitions = await loadCoreDimensionDefinitions();
    const dimensionChoices = Array.from(coreDefinitions.values()).map((dimension) => ({
        name: `${dimension.name.charAt(0).toUpperCase() + dimension.name.slice(1)} - ${dimension.short_description}`,
        value: dimension.name,
        checked: dimension.name !== 'schema' // Enable all except schema by default
    }));
    const { dimensions } = await inquirer_1.default.prompt([{
            type: 'checkbox',
            name: 'dimensions',
            message: 'Select evaluation dimensions to use:',
            choices: dimensionChoices,
        }]);
    config.dimensions = dimensions;
    // API configuration (optional)
    const { configureAPI } = await inquirer_1.default.prompt([{
            type: 'confirm',
            name: 'configureAPI',
            message: 'Do you want to configure Identro API integration?',
            default: false,
        }]);
    if (configureAPI) {
        const { apiEndpoint, apiKey } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'apiEndpoint',
                message: 'Identro API endpoint:',
                default: 'https://api.identro.com',
            },
            {
                type: 'password',
                name: 'apiKey',
                message: 'Identro API key (optional):',
            },
        ]);
        config.api = {
            endpoint: apiEndpoint,
            key: apiKey || undefined,
        };
    }
    return config;
}
/**
 * Manual LLM configuration
 */
async function manualLLMConfig() {
    const { provider, model, apiKey, endpoint } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'provider',
            message: 'LLM Provider:',
            choices: [
                'openai',
                'anthropic',
                'azure-openai',
                'google',
                'ollama',
                'lm-studio',
                'other',
            ],
        },
        {
            type: 'input',
            name: 'model',
            message: 'Model name:',
            default: (answers) => {
                switch (answers.provider) {
                    case 'openai': return 'gpt-4-turbo-preview';
                    case 'anthropic': return 'claude-3-opus-20240229';
                    case 'google': return 'gemini-pro';
                    case 'ollama': return 'llama2';
                    default: return '';
                }
            },
        },
        {
            type: 'password',
            name: 'apiKey',
            message: 'API Key (leave empty to use environment variable):',
            when: (answers) => !['ollama', 'lm-studio'].includes(answers.provider),
        },
        {
            type: 'input',
            name: 'endpoint',
            message: 'API Endpoint (optional):',
            when: (answers) => ['ollama', 'lm-studio', 'other'].includes(answers.provider),
            default: (answers) => {
                switch (answers.provider) {
                    case 'ollama': return 'http://localhost:11434';
                    case 'lm-studio': return 'http://localhost:1234';
                    default: return '';
                }
            },
        },
    ]);
    return {
        ...config_1.DEFAULT_CONFIG.llm,
        selected: {
            provider,
            model,
            apiKey: apiKey || undefined,
            endpoint: endpoint || undefined,
        },
    };
}
/**
 * Ensure .gitignore includes .identro directory
 */
async function ensureGitignore() {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    try {
        let content = '';
        if (await fs.pathExists(gitignorePath)) {
            content = await fs.readFile(gitignorePath, 'utf-8');
        }
        if (!content.includes('.identro')) {
            content += '\n# Identro Eval\n.identro/\n';
            await fs.writeFile(gitignorePath, content);
            (0, display_1.info)('Added .identro to .gitignore');
        }
    }
    catch {
        // Ignore errors
    }
}
/**
 * Display configuration summary
 */
function displaySummary(config) {
    (0, display_1.section)('Configuration Summary');
    (0, display_1.displayKeyValue)('Framework', config.framework || 'auto-detect', 2);
    if (config.llm?.selected) {
        (0, display_1.displayKeyValue)('LLM Provider', config.llm.selected.provider, 2);
        (0, display_1.displayKeyValue)('Model', config.llm.selected.model, 2);
    }
    if (config.output) {
        (0, display_1.displayKeyValue)('Output Format', config.output.format || 'json', 2);
        (0, display_1.displayKeyValue)('Output Directory', config.output.directory || './identro-reports', 2);
    }
    if (config.dimensions) {
        const enabledDimensions = Object.entries(config.dimensions || {})
            .filter(([_, dimension]) => dimension.enabled)
            .map(([name]) => name);
        (0, display_1.displayKeyValue)('evaluation dimensions', enabledDimensions.join(', '), 2);
    }
    console.log(chalk_1.default.gray(`\nConfiguration saved to: ${(0, config_1.getConfigPath)()}`));
}
//# sourceMappingURL=init.js.map