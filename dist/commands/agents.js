/**
 * Agents command - Manage individual agents
 *
 * Provides commands for listing, showing, and testing individual agents
 */
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import * as fs from 'fs-extra';
import { createSpinner, success, displayJson, error, displayAgents } from '../utils/display';
import { DiscoveryService } from '../services/discovery-service';
import { TestExecutionService } from '../services/test-execution-service';
import { llmConfigManager } from '../services/llm-config-manager';
/**
 * Create the agents command with subcommands
 */
export function agentsCommand() {
    const cmd = new Command('agents')
        .description('Manage individual agents')
        .option('-p, --path <path>', 'Project path', process.cwd());
    // List agents subcommand
    cmd.command('list')
        .description('List all discovered agents')
        .option('--json', 'Output as JSON')
        .action(async (options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await listAgents(projectPath, options);
    });
    // Show agent subcommand
    cmd.command('show <agent>')
        .description('Show details of a specific agent')
        .option('--json', 'Output as JSON')
        .action(async (agentName, options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await showAgent(projectPath, agentName, options);
    });
    // Test agent subcommand
    cmd.command('test <agent>')
        .description('Run tests for specific agent')
        .option('-p, --dimensions <dimensions>', 'Test dimensions (comma-separated). Defaults to enabled dimensions from config.')
        .option('--split-pane', 'Use split-pane display')
        .option('--generate-missing', 'Generate missing tests before running')
        .option('--json', 'Output as JSON')
        .action(async (agentName, options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await testAgent(projectPath, agentName, options);
    });
    return cmd;
}
/**
 * List all discovered agents
 */
async function listAgents(projectPath, options) {
    if (!options.json) {
        console.log(chalk.bold.cyan('\n🤖 Available Agents\n'));
    }
    const spinner = options.json ? null : createSpinner('Discovering agents...');
    spinner?.start();
    try {
        const discoveryService = new DiscoveryService();
        const result = await discoveryService.discoverAll({
            projectPath,
            includeTeams: false,
            initializeDimensions: false,
            initializeConfig: false
        });
        spinner?.stop();
        if (result.agents.length === 0) {
            if (options.json) {
                displayJson({ agents: [], count: 0 });
            }
            else {
                console.log(chalk.yellow('No agents found in the project.'));
                console.log(chalk.gray('\nTip: Make sure you\'re in the right directory and your agents follow framework conventions.'));
            }
            return;
        }
        if (options.json) {
            displayJson({
                framework: result.framework,
                agents: discoveryService.formatAgentsForDisplay(result.agents, result.framework),
                count: result.agents.length
            });
        }
        else {
            console.log(`Found ${result.agents.length} agent(s) using ${result.framework}:\n`);
            const displayableAgents = discoveryService.formatAgentsForDisplay(result.agents, result.framework);
            displayAgents(displayableAgents);
            console.log(chalk.gray(`\nFramework: ${result.framework}`));
            console.log(chalk.gray(`Total agents: ${result.agents.length}`));
        }
    }
    catch (err) {
        spinner?.fail('Failed to discover agents');
        if (options.json) {
            displayJson({ error: err.message });
        }
        else {
            error(`Failed to discover agents: ${err.message}`);
        }
        throw err;
    }
}
/**
 * Show details of a specific agent
 */
async function showAgent(projectPath, agentName, options) {
    if (!options.json) {
        console.log(chalk.bold.cyan(`\n📄 Agent: ${agentName}\n`));
    }
    const spinner = options.json ? null : createSpinner('Loading agent details...');
    spinner?.start();
    try {
        // Load eval spec to get agent details
        const evalSpecPath = path.join(projectPath, '.identro', 'eval-spec.json');
        if (!await fs.pathExists(evalSpecPath)) {
            spinner?.fail('No evaluation spec found');
            if (options.json) {
                displayJson({
                    error: 'No evaluation spec found',
                    suggestion: 'Run "identro-eval analyze" first'
                });
            }
            else {
                error('No evaluation spec found');
                console.log(chalk.gray('\nRun'), chalk.cyan('identro-eval analyze'), chalk.gray('first to analyze agents.'));
            }
            return;
        }
        const evalSpec = await fs.readJson(evalSpecPath);
        const agent = evalSpec.agents[agentName];
        if (!agent) {
            spinner?.fail(`Agent '${agentName}' not found`);
            if (options.json) {
                displayJson({
                    error: `Agent '${agentName}' not found`,
                    availableAgents: Object.keys(evalSpec.agents || {})
                });
            }
            else {
                error(`Agent '${agentName}' not found`);
                console.log(chalk.gray('\nAvailable agents:'));
                Object.keys(evalSpec.agents || {}).forEach(name => {
                    console.log(chalk.cyan(`  • ${name}`));
                });
            }
            return;
        }
        spinner?.stop();
        if (options.json) {
            displayJson({
                name: agentName,
                type: agent.type,
                description: agent.description,
                contract: agent.contract,
                testSpecs: Object.keys(agent.testSpecs || {}),
                performance: agent.performance
            });
        }
        else {
            // Display agent details
            console.log(`${chalk.bold('Name:')} ${agentName}`);
            console.log(`${chalk.bold('Type:')} ${agent.type}`);
            console.log(`${chalk.bold('Description:')} ${agent.description}`);
            console.log();
            // Contract details
            if (agent.contract) {
                console.log(chalk.bold.yellow('📋 Contract:'));
                // Try multiple sources for description
                const description = agent.contract.description ||
                    agent.contract.goal ||
                    agent.metadata?.goal ||
                    agent.description ||
                    'Not provided';
                console.log(`  Description: ${description}`);
                // Show role if available
                const role = agent.contract.role || agent.metadata?.role;
                if (role) {
                    console.log(`  Role: ${role}`);
                }
                // Show goal if different from description
                const goal = agent.contract.goal || agent.metadata?.goal;
                if (goal && goal !== description) {
                    console.log(`  Goal: ${goal}`);
                }
                console.log(`  Capabilities: ${agent.contract.capabilities?.length || 0}`);
                if (agent.contract.capabilities?.length > 0) {
                    agent.contract.capabilities.slice(0, 3).forEach((cap) => {
                        console.log(chalk.gray(`    • ${cap}`));
                    });
                    if (agent.contract.capabilities.length > 3) {
                        console.log(chalk.gray(`    ... and ${agent.contract.capabilities.length - 3} more`));
                    }
                }
                // Show tools if available
                const tools = agent.contract.tools || agent.metadata?.tools;
                if (tools && tools.length > 0) {
                    console.log(`  Tools: ${tools.length}`);
                    tools.slice(0, 3).forEach((tool) => {
                        console.log(chalk.gray(`    • ${tool}`));
                    });
                    if (tools.length > 3) {
                        console.log(chalk.gray(`    ... and ${tools.length - 3} more`));
                    }
                }
                console.log();
            }
            // Test specs
            const testSpecs = Object.keys(agent.testSpecs || {});
            console.log(chalk.bold.yellow('🧪 Test Specs:'));
            if (testSpecs.length > 0) {
                testSpecs.forEach(dimension => {
                    const tests = agent.testSpecs[dimension]?.tests || [];
                    console.log(`  ${dimension}: ${tests.length} tests`);
                });
            }
            else {
                console.log(chalk.gray('  No tests generated yet'));
                console.log(chalk.gray('  Run'), chalk.cyan(`identro-eval generate --agents ${agentName}`), chalk.gray('to generate tests'));
            }
            console.log();
            // Performance
            console.log(chalk.bold.yellow('📊 Performance:'));
            console.log(`  Total Runs: ${agent.performance?.totalRuns || 0}`);
            console.log(`  Average Score: ${agent.performance?.averageScore || 0}`);
            console.log();
            // File location
            if (agent.discovered?.path) {
                console.log(chalk.gray(`File: ${path.relative(projectPath, agent.discovered.path)}`));
            }
        }
    }
    catch (err) {
        spinner?.fail('Failed to load agent details');
        if (options.json) {
            displayJson({ error: err.message });
        }
        else {
            error(`Failed to load agent details: ${err.message}`);
        }
        throw err;
    }
}
/**
 * Test a specific agent
 */
async function testAgent(projectPath, agentName, options) {
    if (!options.json) {
        console.log(chalk.bold.cyan(`\n🧪 Testing Agent: ${agentName}\n`));
    }
    const spinner = options.json ? null : createSpinner('Initializing test execution...');
    spinner?.start();
    try {
        const dimensions = options.dimensions?.split(',').map(p => p.trim()) || ['consistency', 'safety', 'performance'];
        // Get LLM config if generating missing tests
        let llmConfig = null;
        if (options.generateMissing) {
            const llmConfigResult = await llmConfigManager.discoverAndConfigure(projectPath);
            llmConfig = llmConfigResult?.discovered?.[0];
        }
        const testExecutionService = new TestExecutionService();
        const result = await testExecutionService.executeTests({
            projectPath,
            entityNames: [agentName],
            dimensions: dimensions,
            llmConfig,
            splitPane: options.splitPane,
            generateMissing: options.generateMissing,
            onProgress: (completed, total) => {
                if (spinner) {
                    spinner.text = `Running tests: ${completed}/${total}`;
                }
            }
        });
        spinner?.stop();
        const agentResult = result.results.get(agentName);
        if (options.json) {
            displayJson({
                agent: agentName,
                summary: agentResult?.summary,
                dimensions: agentResult?.dimensions,
                duration: result.duration,
                success: result.totalFailed === 0
            });
        }
        else {
            console.log(chalk.bold('\nTest Results:'));
            console.log(chalk.gray('─'.repeat(50)));
            if (agentResult) {
                const summary = agentResult.summary;
                const passRate = (summary.successRate * 100).toFixed(1);
                const status = summary.failed === 0 ? chalk.green('✅') : chalk.red('❌');
                console.log(`\n${status} ${chalk.bold(agentName)}`);
                console.log(chalk.gray(`   Tests: ${summary.totalTests} | Passed: ${summary.passed} | Failed: ${summary.failed}`));
                console.log(chalk.gray(`   Success Rate: ${passRate}% | Avg Latency: ${summary.averageLatencyMs.toFixed(0)}ms`));
                // Show dimension results
                if (agentResult.dimensions) {
                    const dimensionResults = [];
                    if (agentResult.dimensions.consistency) {
                        dimensionResults.push(`Consistency: ${agentResult.dimensions.consistency.isConsistent ? '✅' : '❌'}`);
                    }
                    if (agentResult.dimensions.safety) {
                        dimensionResults.push(`Safety: ${(agentResult.dimensions.safety.safetyScore * 100).toFixed(0)}%`);
                    }
                    if (agentResult.dimensions.performance) {
                        dimensionResults.push(`Performance: ${agentResult.dimensions.performance.latencyPercentiles?.p50 || 'N/A'}ms`);
                    }
                    if (dimensionResults.length > 0) {
                        console.log(chalk.gray(`   Dimensions: ${dimensionResults.join(' | ')}`));
                    }
                }
            }
            else {
                console.log(chalk.red(`\n❌ No results found for ${agentName}`));
            }
            console.log(chalk.gray('\n' + '─'.repeat(50)));
            if (result.totalFailed === 0) {
                success(`\n✨ All tests passed! (${result.totalPassed}/${result.totalTests})`);
            }
            else {
                console.log(chalk.yellow(`\n⚠️  ${result.totalFailed} test(s) failed (${result.totalPassed}/${result.totalTests} passed)`));
            }
            console.log(chalk.gray(`\nCompleted in ${(result.duration / 1000).toFixed(2)}s`));
        }
    }
    catch (err) {
        spinner?.fail('Test execution failed');
        if (options.json) {
            displayJson({ error: err.message });
        }
        else {
            error(`Test execution failed: ${err.message}`);
        }
        throw err;
    }
}
//# sourceMappingURL=agents.js.map