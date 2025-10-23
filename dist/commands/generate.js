"use strict";
/**
 * Generate command - Generate tests using LLM
 *
 * New command that uses TestGenerationService for standalone LLM test generation
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
exports.generateCommand = generateCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const display_1 = require("../utils/display");
const errors_1 = require("../utils/errors");
const test_generation_service_1 = require("../services/test-generation-service");
const discovery_service_1 = require("../services/discovery-service");
const llm_config_manager_1 = require("../services/llm-config-manager");
const eval_core_1 = require("@identro/eval-core");
const path_1 = __importDefault(require("path"));
/**
 * Create the generate command
 */
function generateCommand() {
    return new commander_1.Command('generate')
        .description('Generate tests using LLM')
        .option('-a, --agents <names>', 'Comma-separated agent names to generate tests for')
        .option('-t, --teams <names>', 'Comma-separated team names to generate tests for')
        .option('-p, --dimensions <dimensions>', 'Test dimensions to generate (comma-separated). Defaults to enabled dimensions from config.')
        .option('--path <path>', 'Project path', process.cwd())
        .option('--concurrency <number>', 'Number of concurrent LLM calls', '3')
        .option('--force', 'Overwrite existing tests')
        .option('--json', 'Output as JSON')
        .action((0, errors_1.withErrorHandling)(async (options) => {
        await runGenerate(options);
    }));
}
/**
 * Run the test generation process
 */
async function runGenerate(options) {
    const projectPath = path_1.default.resolve(options.path || process.cwd());
    if (!options.json) {
        console.log(chalk_1.default.bold('\n🧠 Generating Tests with LLM\n'));
    }
    const spinner = options.json ? null : (0, display_1.createSpinner)('Initializing test generation...');
    spinner?.start();
    try {
        // Load available dimensions dynamically from dimension files
        const dimensionLoader = new eval_core_1.DimensionFileLoader({
            projectPath,
            createDefaults: true
        });
        const availableDimensions = await dimensionLoader.loadAllDimensions();
        const validDimensions = Array.from(availableDimensions.keys());
        // Parse requested dimensions (default to enabled dimensions from config)
        let dimensions;
        if (options.dimensions) {
            dimensions = options.dimensions.split(',').map(p => p.trim());
        }
        else {
            // Default to enabled dimensions from config
            const { loadConfig } = await Promise.resolve().then(() => __importStar(require('../utils/config')));
            const configPath = path_1.default.join(projectPath, '.identro', 'eval.config.yml');
            const config = await loadConfig(configPath);
            // Load dimensions dynamically - no hardcoded fallback
            if (config.dimensions?.enabled && config.dimensions.enabled.length > 0) {
                dimensions = config.dimensions.enabled;
            }
            else {
                // If no config, load all available dimensions
                dimensions = Array.from(availableDimensions.keys());
            }
        }
        // Validate requested dimensions
        const invalidDimensions = dimensions.filter(p => !validDimensions.includes(p));
        if (invalidDimensions.length > 0) {
            spinner?.fail(`Invalid dimensions: ${invalidDimensions.join(', ')}`);
            if (options.json) {
                (0, display_1.displayJson)({
                    error: `Invalid dimensions: ${invalidDimensions.join(', ')}`,
                    validDimensions,
                    availableDimensions: validDimensions.length
                });
            }
            else {
                (0, display_1.error)(`Invalid dimensions: ${invalidDimensions.join(', ')}`);
                console.log(chalk_1.default.gray('\nAvailable dimensions:'));
                // Group dimensions by category using DimensionMetadataService
                const dimensionRegistry = new eval_core_1.DefaultDimensionRegistry();
                await dimensionRegistry.loadDimensionDefinitions(projectPath);
                const metadataService = (0, eval_core_1.createDimensionMetadataService)(dimensionRegistry);
                const coreDimensions = await metadataService.getDimensionsByCategory('core');
                const qualityDimensions = await metadataService.getDimensionsByCategory('quality');
                const enterpriseDimensions = await metadataService.getDimensionsByCategory('enterprise');
                if (coreDimensions.length > 0) {
                    console.log(chalk_1.default.bold.cyan('\nCore Dimensions:'));
                    coreDimensions.forEach(p => console.log(chalk_1.default.cyan(`  • ${p}`)));
                }
                if (qualityDimensions.length > 0) {
                    console.log(chalk_1.default.bold.cyan('\nQuality Dimensions:'));
                    qualityDimensions.forEach(p => console.log(chalk_1.default.cyan(`  • ${p}`)));
                }
                if (enterpriseDimensions.length > 0) {
                    console.log(chalk_1.default.bold.cyan('\nEnterprise Dimensions:'));
                    enterpriseDimensions.forEach(p => console.log(chalk_1.default.cyan(`  • ${p}`)));
                }
            }
            return;
        }
        // Discover entities if not specified
        let selectedAgents = [];
        let selectedTeams = [];
        if (!options.agents && !options.teams) {
            if (spinner) {
                spinner.text = 'Discovering agents and teams...';
            }
            const discoveryService = new discovery_service_1.DiscoveryService();
            const discoveryResult = await discoveryService.discoverAll({
                projectPath,
                includeTeams: true,
                initializeDimensions: false,
                initializeConfig: false
            });
            selectedAgents = discoveryResult.agents.map(a => a.name);
            selectedTeams = discoveryResult.teams.map(t => t.name);
            if (selectedAgents.length === 0 && selectedTeams.length === 0) {
                spinner?.fail('No agents or teams found');
                if (options.json) {
                    (0, display_1.displayJson)({ error: 'No agents or teams found in project' });
                }
                else {
                    (0, display_1.error)('No agents or teams found in project');
                    console.log(chalk_1.default.gray('\nTip: Run'), chalk_1.default.cyan('identro-eval discover'), chalk_1.default.gray('to see available entities'));
                }
                return;
            }
        }
        else {
            // Parse specified agents and teams
            if (options.agents) {
                selectedAgents = options.agents.split(',').map(a => a.trim());
            }
            if (options.teams) {
                selectedTeams = options.teams.split(',').map(t => t.trim());
            }
        }
        const totalEntities = selectedAgents.length + selectedTeams.length;
        if (totalEntities === 0) {
            spinner?.fail('No entities specified for test generation');
            if (options.json) {
                (0, display_1.displayJson)({ error: 'No entities specified for test generation' });
            }
            else {
                (0, display_1.error)('No entities specified for test generation');
            }
            return;
        }
        // Check for existing tests if not forcing
        if (!options.force) {
            if (spinner) {
                spinner.text = 'Checking for existing tests...';
            }
            const testGenService = new test_generation_service_1.TestGenerationService();
            const allEntityNames = [...selectedAgents, ...selectedTeams];
            const existingCheck = await testGenService.checkExistingTests(projectPath, allEntityNames, dimensions);
            if (existingCheck.hasTests) {
                spinner?.stop();
                if (options.json) {
                    (0, display_1.displayJson)({
                        warning: 'Existing tests found',
                        existingTests: existingCheck.existingTests,
                        missingTests: existingCheck.missingTests,
                        suggestion: 'Use --force to overwrite existing tests'
                    });
                    return;
                }
                console.log(chalk_1.default.yellow('\n⚠ Found existing tests:'));
                for (const existing of existingCheck.existingTests) {
                    console.log(chalk_1.default.gray(`  • ${existing.entity} - ${existing.dimension}: ${existing.testCount} tests`));
                }
                if (existingCheck.missingTests.length > 0) {
                    console.log(chalk_1.default.cyan('\nMissing tests:'));
                    for (const missing of existingCheck.missingTests) {
                        console.log(chalk_1.default.gray(`  • ${missing.entity} - ${missing.dimension}`));
                    }
                }
                console.log(chalk_1.default.gray('\nOptions:'));
                console.log(chalk_1.default.cyan('  • Use'), chalk_1.default.bold('--force'), chalk_1.default.cyan('to overwrite existing tests'));
                console.log(chalk_1.default.cyan('  • Specify'), chalk_1.default.bold('--agents'), chalk_1.default.cyan('or'), chalk_1.default.bold('--teams'), chalk_1.default.cyan('to generate for specific entities'));
                return;
            }
        }
        // Discover and configure LLM
        if (spinner) {
            spinner.text = 'Configuring LLM provider...';
        }
        const llmConfig = await llm_config_manager_1.llmConfigManager.discoverAndConfigure(projectPath);
        if (!llmConfig || !llmConfig.discovered || llmConfig.discovered.length === 0) {
            spinner?.fail('No LLM configuration found');
            if (options.json) {
                (0, display_1.displayJson)({
                    error: 'No LLM configuration found',
                    suggestion: 'Please set up an API key (e.g., OPENAI_API_KEY)'
                });
            }
            else {
                (0, display_1.error)('No LLM configuration found');
                console.log(chalk_1.default.gray('\nPlease set up an API key:'));
                console.log(chalk_1.default.cyan('  • OPENAI_API_KEY for OpenAI'));
                console.log(chalk_1.default.cyan('  • ANTHROPIC_API_KEY for Anthropic'));
            }
            return;
        }
        const selectedLLMConfig = llmConfig.discovered[0];
        if (!options.json) {
            console.log(chalk_1.default.green(`\n✓ Using ${selectedLLMConfig.provider.toUpperCase()} ${selectedLLMConfig.model}`));
        }
        // Build entities array
        const entities = [
            ...selectedAgents.map(name => ({ name, type: 'agent' })),
            ...selectedTeams.map(name => ({ name, type: 'team' }))
        ];
        // Generate tests
        if (spinner) {
            spinner.text = `Generating tests for ${totalEntities} entities...`;
        }
        const testGenService = new test_generation_service_1.TestGenerationService();
        let completedTasks = 0;
        let totalTasks = 0;
        const result = await testGenService.generateTests({
            projectPath,
            entities,
            dimensions: dimensions,
            llmConfig: selectedLLMConfig,
            concurrency: parseInt(options.concurrency || '3'),
            onProgress: (completed, total, currentTask) => {
                completedTasks = completed;
                totalTasks = total;
                if (spinner && currentTask) {
                    spinner.text = `${completed}/${total} - ${currentTask}`;
                }
            },
            onTaskComplete: (taskName, duration) => {
                if (!options.json) {
                    console.log(chalk_1.default.green(`  ✅ ${taskName} (${duration}ms)`));
                }
            },
            onTaskError: (taskName, error) => {
                if (!options.json) {
                    console.log(chalk_1.default.red(`  ❌ ${taskName}: ${error.message}`));
                }
            }
        });
        spinner?.stop();
        if (options.json) {
            (0, display_1.displayJson)({
                success: true,
                summary: {
                    totalTasks: result.totalTasks,
                    successfulTasks: result.successfulTasks,
                    failedTasks: result.failedTasks,
                    totalTestsGenerated: result.totalTestsGenerated,
                    successRate: result.totalTasks > 0 ? result.successfulTasks / result.totalTasks : 0
                },
                entities: {
                    agents: selectedAgents,
                    teams: selectedTeams
                },
                dimensions: dimensions,
                llmProvider: `${selectedLLMConfig.provider} ${selectedLLMConfig.model}`,
                errors: result.errors
            });
        }
        else {
            const summary = testGenService.getGenerationSummary(result);
            console.log(chalk_1.default.bold.green('\n🎉 Test Generation Complete!'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(chalk_1.default.green(`✅ Generated ${result.totalTestsGenerated} tests`));
            console.log(chalk_1.default.cyan(`📊 Success rate: ${(summary.successRate * 100).toFixed(1)}%`));
            console.log(chalk_1.default.cyan(`⚡ Tasks: ${result.successfulTasks}/${result.totalTasks} successful`));
            console.log(chalk_1.default.cyan(`🎯 Entities: ${totalEntities} (${selectedAgents.length} agents, ${selectedTeams.length} teams)`));
            console.log(chalk_1.default.cyan(`🧪 Dimensions: ${dimensions.join(', ')}`));
            console.log(chalk_1.default.cyan(`🤖 LLM: ${selectedLLMConfig.provider} ${selectedLLMConfig.model}`));
            if (result.errors.length > 0) {
                console.log(chalk_1.default.yellow(`\n⚠ ${result.errors.length} error(s):`));
                result.errors.slice(0, 3).forEach(err => {
                    console.log(chalk_1.default.red(`  • ${err.task}: ${err.error}`));
                });
                if (result.errors.length > 3) {
                    console.log(chalk_1.default.gray(`  ... and ${result.errors.length - 3} more`));
                }
            }
            console.log(chalk_1.default.gray('\n─'.repeat(50)));
            (0, display_1.success)('Tests ready for execution!');
            console.log(chalk_1.default.gray('\nNext steps:'));
            console.log(chalk_1.default.cyan('  • Run'), chalk_1.default.bold('identro-eval test'), chalk_1.default.cyan('to execute the generated tests'));
            console.log(chalk_1.default.cyan('  • Run'), chalk_1.default.bold('identro-eval report'), chalk_1.default.cyan('to generate reports after testing'));
        }
    }
    catch (err) {
        spinner?.fail('Test generation failed');
        if (options.json) {
            (0, display_1.displayJson)({
                error: err.message,
                stack: err.stack
            });
        }
        else {
            (0, display_1.error)(`Test generation failed: ${err.message}`);
            if (err.stack && process.env.DEBUG) {
                console.error(chalk_1.default.gray(err.stack));
            }
        }
        throw err;
    }
}
//# sourceMappingURL=generate.js.map