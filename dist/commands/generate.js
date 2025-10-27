/**
 * Generate command - Generate tests using LLM
 *
 * New command that uses TestGenerationService for standalone LLM test generation
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { success, error, createSpinner, displayJson } from '../utils/display';
import { withErrorHandling } from '../utils/errors';
import { TestGenerationService } from '../services/test-generation-service';
import { DiscoveryService } from '../services/discovery-service';
import { llmConfigManager } from '../services/llm-config-manager';
import { DimensionFileLoader, DefaultDimensionRegistry, createDimensionMetadataService } from '@identro/eval-core';
import path from 'path';
/**
 * Create the generate command
 */
export function generateCommand() {
    return new Command('generate')
        .description('Generate tests using LLM')
        .option('-a, --agents <names>', 'Comma-separated agent names to generate tests for')
        .option('-t, --teams <names>', 'Comma-separated team names to generate tests for')
        .option('-p, --dimensions <dimensions>', 'Test dimensions to generate (comma-separated). Defaults to enabled dimensions from config.')
        .option('--path <path>', 'Project path', process.cwd())
        .option('--concurrency <number>', 'Number of concurrent LLM calls', '3')
        .option('--force', 'Overwrite existing tests')
        .option('--json', 'Output as JSON')
        .action(withErrorHandling(async (options) => {
        await runGenerate(options);
    }));
}
/**
 * Run the test generation process
 */
async function runGenerate(options) {
    const projectPath = path.resolve(options.path || process.cwd());
    if (!options.json) {
        console.log(chalk.bold('\n🧠 Generating Tests with LLM\n'));
    }
    const spinner = options.json ? null : createSpinner('Initializing test generation...');
    spinner?.start();
    try {
        // Load available dimensions dynamically from dimension files
        const dimensionLoader = new DimensionFileLoader({
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
            const { loadConfig } = await import('../utils/config');
            const configPath = path.join(projectPath, '.identro', 'eval.config.yml');
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
                displayJson({
                    error: `Invalid dimensions: ${invalidDimensions.join(', ')}`,
                    validDimensions,
                    availableDimensions: validDimensions.length
                });
            }
            else {
                error(`Invalid dimensions: ${invalidDimensions.join(', ')}`);
                console.log(chalk.gray('\nAvailable dimensions:'));
                // Group dimensions by category using DimensionMetadataService
                const dimensionRegistry = new DefaultDimensionRegistry();
                await dimensionRegistry.loadDimensionDefinitions(projectPath);
                const metadataService = createDimensionMetadataService(dimensionRegistry);
                const coreDimensions = await metadataService.getDimensionsByCategory('core');
                const qualityDimensions = await metadataService.getDimensionsByCategory('quality');
                const enterpriseDimensions = await metadataService.getDimensionsByCategory('enterprise');
                if (coreDimensions.length > 0) {
                    console.log(chalk.bold.cyan('\nCore Dimensions:'));
                    coreDimensions.forEach(p => console.log(chalk.cyan(`  • ${p}`)));
                }
                if (qualityDimensions.length > 0) {
                    console.log(chalk.bold.cyan('\nQuality Dimensions:'));
                    qualityDimensions.forEach(p => console.log(chalk.cyan(`  • ${p}`)));
                }
                if (enterpriseDimensions.length > 0) {
                    console.log(chalk.bold.cyan('\nEnterprise Dimensions:'));
                    enterpriseDimensions.forEach(p => console.log(chalk.cyan(`  • ${p}`)));
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
            const discoveryService = new DiscoveryService();
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
                    displayJson({ error: 'No agents or teams found in project' });
                }
                else {
                    error('No agents or teams found in project');
                    console.log(chalk.gray('\nTip: Run'), chalk.cyan('identro-eval discover'), chalk.gray('to see available entities'));
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
                displayJson({ error: 'No entities specified for test generation' });
            }
            else {
                error('No entities specified for test generation');
            }
            return;
        }
        // Check for existing tests if not forcing
        if (!options.force) {
            if (spinner) {
                spinner.text = 'Checking for existing tests...';
            }
            const testGenService = new TestGenerationService();
            const allEntityNames = [...selectedAgents, ...selectedTeams];
            const existingCheck = await testGenService.checkExistingTests(projectPath, allEntityNames, dimensions);
            if (existingCheck.hasTests) {
                spinner?.stop();
                if (options.json) {
                    displayJson({
                        warning: 'Existing tests found',
                        existingTests: existingCheck.existingTests,
                        missingTests: existingCheck.missingTests,
                        suggestion: 'Use --force to overwrite existing tests'
                    });
                    return;
                }
                console.log(chalk.yellow('\n⚠ Found existing tests:'));
                for (const existing of existingCheck.existingTests) {
                    console.log(chalk.gray(`  • ${existing.entity} - ${existing.dimension}: ${existing.testCount} tests`));
                }
                if (existingCheck.missingTests.length > 0) {
                    console.log(chalk.cyan('\nMissing tests:'));
                    for (const missing of existingCheck.missingTests) {
                        console.log(chalk.gray(`  • ${missing.entity} - ${missing.dimension}`));
                    }
                }
                console.log(chalk.gray('\nOptions:'));
                console.log(chalk.cyan('  • Use'), chalk.bold('--force'), chalk.cyan('to overwrite existing tests'));
                console.log(chalk.cyan('  • Specify'), chalk.bold('--agents'), chalk.cyan('or'), chalk.bold('--teams'), chalk.cyan('to generate for specific entities'));
                return;
            }
        }
        // Discover and configure LLM
        if (spinner) {
            spinner.text = 'Configuring LLM provider...';
        }
        const llmConfig = await llmConfigManager.discoverAndConfigure(projectPath);
        if (!llmConfig || !llmConfig.discovered || llmConfig.discovered.length === 0) {
            spinner?.fail('No LLM configuration found');
            if (options.json) {
                displayJson({
                    error: 'No LLM configuration found',
                    suggestion: 'Please set up an API key (e.g., OPENAI_API_KEY)'
                });
            }
            else {
                error('No LLM configuration found');
                console.log(chalk.gray('\nPlease set up an API key:'));
                console.log(chalk.cyan('  • OPENAI_API_KEY for OpenAI'));
                console.log(chalk.cyan('  • ANTHROPIC_API_KEY for Anthropic'));
            }
            return;
        }
        const selectedLLMConfig = llmConfig.discovered[0];
        if (!options.json) {
            console.log(chalk.green(`\n✓ Using ${selectedLLMConfig.provider.toUpperCase()} ${selectedLLMConfig.model}`));
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
        const testGenService = new TestGenerationService();
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
                    console.log(chalk.green(`  ✅ ${taskName} (${duration}ms)`));
                }
            },
            onTaskError: (taskName, error) => {
                if (!options.json) {
                    console.log(chalk.red(`  ❌ ${taskName}: ${error.message}`));
                }
            }
        });
        spinner?.stop();
        if (options.json) {
            displayJson({
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
            console.log(chalk.bold.green('\n🎉 Test Generation Complete!'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(chalk.green(`✅ Generated ${result.totalTestsGenerated} tests`));
            console.log(chalk.cyan(`📊 Success rate: ${(summary.successRate * 100).toFixed(1)}%`));
            console.log(chalk.cyan(`⚡ Tasks: ${result.successfulTasks}/${result.totalTasks} successful`));
            console.log(chalk.cyan(`🎯 Entities: ${totalEntities} (${selectedAgents.length} agents, ${selectedTeams.length} teams)`));
            console.log(chalk.cyan(`🧪 Dimensions: ${dimensions.join(', ')}`));
            console.log(chalk.cyan(`🤖 LLM: ${selectedLLMConfig.provider} ${selectedLLMConfig.model}`));
            if (result.errors.length > 0) {
                console.log(chalk.yellow(`\n⚠ ${result.errors.length} error(s):`));
                result.errors.slice(0, 3).forEach(err => {
                    console.log(chalk.red(`  • ${err.task}: ${err.error}`));
                });
                if (result.errors.length > 3) {
                    console.log(chalk.gray(`  ... and ${result.errors.length - 3} more`));
                }
            }
            console.log(chalk.gray('\n─'.repeat(50)));
            success('Tests ready for execution!');
            console.log(chalk.gray('\nNext steps:'));
            console.log(chalk.cyan('  • Run'), chalk.bold('identro-eval test'), chalk.cyan('to execute the generated tests'));
            console.log(chalk.cyan('  • Run'), chalk.bold('identro-eval report'), chalk.cyan('to generate reports after testing'));
        }
    }
    catch (err) {
        spinner?.fail('Test generation failed');
        if (options.json) {
            displayJson({
                error: err.message,
                stack: err.stack
            });
        }
        else {
            error(`Test generation failed: ${err.message}`);
            if (err.stack && process.env.DEBUG) {
                console.error(chalk.gray(err.stack));
            }
        }
        throw err;
    }
}
//# sourceMappingURL=generate.js.map