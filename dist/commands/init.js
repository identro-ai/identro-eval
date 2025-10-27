/**
 * Init command - Initialize Identro Eval in a project
 *
 * Updated to use DiscoveryService for framework detection and enhanced with new commands
 */
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { configExists, getConfigPath, DEFAULT_CONFIG } from '../utils/config';
import { initializeIdentroDirectory, updateGitignore } from '../utils/templates';
import { success, info, warning, section, displayKeyValue, createSpinner } from '../utils/display';
import { discoverLLMs } from '../services/llm-discovery';
import { DiscoveryService } from '../services/discovery-service';
import { withErrorHandling } from '../utils/errors';
/**
 * Create the init command
 */
export function initCommand() {
    return new Command('init')
        .description('Initialize Identro Eval in your project')
        .option('-y, --yes', 'Skip prompts and use defaults')
        .option('-f, --force', 'Overwrite existing configuration')
        .action(withErrorHandling(async (options) => {
        await runInit(options);
    }));
}
/**
 * Run the initialization process
 */
async function runInit(options) {
    console.log(chalk.bold('\n🚀 Initializing Identro Eval\n'));
    // Check for existing config
    if (await configExists() && !options.force) {
        warning('Configuration already exists');
        const { overwrite } = await inquirer.prompt([{
                type: 'confirm',
                name: 'overwrite',
                message: 'Do you want to overwrite the existing configuration?',
                default: false,
            }]);
        if (!overwrite) {
            info('Initialization cancelled');
            return;
        }
    }
    let config = { ...DEFAULT_CONFIG };
    if (!options.yes) {
        // Interactive setup
        config = await interactiveSetup();
    }
    else {
        // Auto setup with defaults
        info('Using default configuration');
        // Try to discover LLMs automatically
        const llms = await discoverLLMs();
        if (llms.length > 0) {
            const available = llms.filter(llm => llm.status === 'available');
            if (available.length > 0) {
                config.llm = {
                    ...DEFAULT_CONFIG.llm,
                    discovered: llms,
                    selected: {
                        provider: available[0].provider,
                        model: available[0].model,
                        apiKey: available[0].apiKey,
                        endpoint: available[0].endpoint,
                    },
                };
                info(`Auto-selected LLM: ${available[0].provider} (${available[0].model})`);
            }
        }
    }
    // Initialize .identro directory with templates
    const spinner = createSpinner('Initializing Identro configuration...');
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
        await initializeIdentroDirectory(process.cwd(), templateConfig);
        // Update .gitignore
        await updateGitignore(process.cwd());
        spinner.succeed('Configuration initialized');
        // Display summary
        displaySummary(config);
        success('\n✨ Identro Eval initialized successfully!');
        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.cyan('  1. Run'), chalk.bold('identro-eval discover'), chalk.cyan('to find agents and teams'));
        console.log(chalk.cyan('  2. Run'), chalk.bold('identro-eval analyze'), chalk.cyan('to extract contracts and capabilities'));
        console.log(chalk.cyan('  3. Run'), chalk.bold('identro-eval generate'), chalk.cyan('to generate tests using LLM'));
        console.log(chalk.cyan('  4. Run'), chalk.bold('identro-eval test'), chalk.cyan('to execute evaluation tests'));
        console.log(chalk.cyan('  5. Run'), chalk.bold('identro-eval report'), chalk.cyan('to generate detailed reports'));
        console.log(chalk.gray('\nOr use the guided experience:'));
        console.log(chalk.cyan('  • Run'), chalk.bold('identro-eval interactive'), chalk.cyan('for step-by-step guidance'));
        console.log(chalk.gray('\nManagement commands:'));
        console.log(chalk.cyan('  • Run'), chalk.bold('identro-eval agents list'), chalk.cyan('to manage individual agents'));
        console.log(chalk.cyan('  • Run'), chalk.bold('identro-eval teams list'), chalk.cyan('to manage teams/crews'));
        console.log(chalk.cyan('  • Run'), chalk.bold('identro-eval dimensions list'), chalk.cyan('to manage test dimensions'));
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
    section('Project Configuration');
    // Framework detection using DiscoveryService
    const spinner = createSpinner('Detecting framework...');
    spinner.start();
    let detectedFramework;
    try {
        const discoveryService = new DiscoveryService();
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
            info(`Found ${discoveryResult.agents.length} agent(s) and ${discoveryResult.teams.length} team(s)`);
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
            detectedChoice.name += chalk.green(' ✓ (detected)');
        }
    }
    const { framework } = await inquirer.prompt([{
            type: 'list',
            name: 'framework',
            message: 'Which AI framework are you using?',
            choices: frameworkChoices,
            default: detectedFramework || 'auto-detect',
        }]);
    config.framework = framework;
    // LLM Configuration
    section('LLM Configuration');
    const llms = await discoverLLMs();
    if (llms.length > 0) {
        info(`Found ${llms.length} LLM configuration(s)`);
        const choices = llms.map((llm, index) => ({
            name: `${llm.provider} (${llm.model}) - ${llm.source} ${llm.cost ? `- ${llm.cost}` : ''}`,
            value: index,
        }));
        choices.push({ name: 'Configure manually', value: -1 });
        choices.push({ name: 'Use mock provider (no LLM required)', value: -2 });
        const { llmChoice } = await inquirer.prompt([{
                type: 'list',
                name: 'llmChoice',
                message: 'Select an LLM for contract analysis:',
                choices,
            }]);
        if (llmChoice >= 0) {
            const selected = llms[llmChoice];
            config.llm = {
                ...DEFAULT_CONFIG.llm,
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
                warning(`API key not found. Set ${selected.apiKeyEnv} environment variable`);
            }
        }
        else if (llmChoice === -1) {
            // Manual configuration
            config.llm = await manualLLMConfig();
        }
        else {
            // Mock provider
            config.llm = {
                ...DEFAULT_CONFIG.llm,
                selected: {
                    provider: 'mock',
                    model: 'mock',
                },
            };
        }
    }
    else {
        warning('No LLM configurations found');
        const { configureLLM } = await inquirer.prompt([{
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
                ...DEFAULT_CONFIG.llm,
                selected: {
                    provider: 'mock',
                    model: 'mock',
                },
            };
            info('Using mock provider for testing');
        }
    }
    // Output configuration
    section('Output Configuration');
    const { outputFormat, outputDir } = await inquirer.prompt([
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
    section('evaluation dimensions');
    // Load core dimension definitions to get available dimensions
    const { loadCoreDimensionDefinitions } = await import('@identro/eval-core');
    const coreDefinitions = await loadCoreDimensionDefinitions();
    const dimensionChoices = Array.from(coreDefinitions.values()).map((dimension) => ({
        name: `${dimension.name.charAt(0).toUpperCase() + dimension.name.slice(1)} - ${dimension.short_description}`,
        value: dimension.name,
        checked: dimension.name !== 'schema' // Enable all except schema by default
    }));
    const { dimensions } = await inquirer.prompt([{
            type: 'checkbox',
            name: 'dimensions',
            message: 'Select evaluation dimensions to use:',
            choices: dimensionChoices,
        }]);
    config.dimensions = dimensions;
    // API configuration (optional)
    const { configureAPI } = await inquirer.prompt([{
            type: 'confirm',
            name: 'configureAPI',
            message: 'Do you want to configure Identro API integration?',
            default: false,
        }]);
    if (configureAPI) {
        const { apiEndpoint, apiKey } = await inquirer.prompt([
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
    const { provider, model, apiKey, endpoint } = await inquirer.prompt([
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
        ...DEFAULT_CONFIG.llm,
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
            info('Added .identro to .gitignore');
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
    section('Configuration Summary');
    displayKeyValue('Framework', config.framework || 'auto-detect', 2);
    if (config.llm?.selected) {
        displayKeyValue('LLM Provider', config.llm.selected.provider, 2);
        displayKeyValue('Model', config.llm.selected.model, 2);
    }
    if (config.output) {
        displayKeyValue('Output Format', config.output.format || 'json', 2);
        displayKeyValue('Output Directory', config.output.directory || './identro-reports', 2);
    }
    if (config.dimensions) {
        const enabledDimensions = Object.entries(config.dimensions || {})
            .filter(([_, dimension]) => dimension.enabled)
            .map(([name]) => name);
        displayKeyValue('evaluation dimensions', enabledDimensions.join(', '), 2);
    }
    console.log(chalk.gray(`\nConfiguration saved to: ${getConfigPath()}`));
}
//# sourceMappingURL=init.js.map