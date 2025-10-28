"use strict";
/**
 * Agents command - Manage individual agents
 *
 * Provides commands for listing, showing, and testing individual agents
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
exports.agentsCommand = agentsCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs-extra"));
const display_1 = require("../utils/display");
const discovery_service_1 = require("../services/discovery-service");
const test_execution_service_1 = require("../services/test-execution-service");
const llm_config_manager_1 = require("../services/llm-config-manager");
/**
 * Create the agents command with subcommands
 */
function agentsCommand() {
    const cmd = new commander_1.Command('agents')
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
        console.log(chalk_1.default.bold.cyan('\n🤖 Available Agents\n'));
    }
    const spinner = options.json ? null : (0, display_1.createSpinner)('Discovering agents...');
    spinner?.start();
    try {
        const discoveryService = new discovery_service_1.DiscoveryService();
        const result = await discoveryService.discoverAll({
            projectPath,
            includeTeams: false,
            initializeDimensions: false,
            initializeConfig: false
        });
        spinner?.stop();
        if (result.agents.length === 0) {
            if (options.json) {
                (0, display_1.displayJson)({ agents: [], count: 0 });
            }
            else {
                console.log(chalk_1.default.yellow('No agents found in the project.'));
                console.log(chalk_1.default.gray('\nTip: Make sure you\'re in the right directory and your agents follow framework conventions.'));
            }
            return;
        }
        if (options.json) {
            (0, display_1.displayJson)({
                framework: result.framework,
                agents: discoveryService.formatAgentsForDisplay(result.agents, result.framework),
                count: result.agents.length
            });
        }
        else {
            console.log(`Found ${result.agents.length} agent(s) using ${result.framework}:\n`);
            const displayableAgents = discoveryService.formatAgentsForDisplay(result.agents, result.framework);
            (0, display_1.displayAgents)(displayableAgents);
            console.log(chalk_1.default.gray(`\nFramework: ${result.framework}`));
            console.log(chalk_1.default.gray(`Total agents: ${result.agents.length}`));
        }
    }
    catch (err) {
        spinner?.fail('Failed to discover agents');
        if (options.json) {
            (0, display_1.displayJson)({ error: err.message });
        }
        else {
            (0, display_1.error)(`Failed to discover agents: ${err.message}`);
        }
        throw err;
    }
}
/**
 * Show details of a specific agent
 */
async function showAgent(projectPath, agentName, options) {
    if (!options.json) {
        console.log(chalk_1.default.bold.cyan(`\n📄 Agent: ${agentName}\n`));
    }
    const spinner = options.json ? null : (0, display_1.createSpinner)('Loading agent details...');
    spinner?.start();
    try {
        // Load eval spec to get agent details
        const evalSpecPath = path_1.default.join(projectPath, '.identro', 'eval-spec.json');
        if (!await fs.pathExists(evalSpecPath)) {
            spinner?.fail('No evaluation spec found');
            if (options.json) {
                (0, display_1.displayJson)({
                    error: 'No evaluation spec found',
                    suggestion: 'Run "identro-eval analyze" first'
                });
            }
            else {
                (0, display_1.error)('No evaluation spec found');
                console.log(chalk_1.default.gray('\nRun'), chalk_1.default.cyan('identro-eval analyze'), chalk_1.default.gray('first to analyze agents.'));
            }
            return;
        }
        const evalSpec = await fs.readJson(evalSpecPath);
        const agent = evalSpec.agents[agentName];
        if (!agent) {
            spinner?.fail(`Agent '${agentName}' not found`);
            if (options.json) {
                (0, display_1.displayJson)({
                    error: `Agent '${agentName}' not found`,
                    availableAgents: Object.keys(evalSpec.agents || {})
                });
            }
            else {
                (0, display_1.error)(`Agent '${agentName}' not found`);
                console.log(chalk_1.default.gray('\nAvailable agents:'));
                Object.keys(evalSpec.agents || {}).forEach(name => {
                    console.log(chalk_1.default.cyan(`  • ${name}`));
                });
            }
            return;
        }
        spinner?.stop();
        if (options.json) {
            (0, display_1.displayJson)({
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
            console.log(`${chalk_1.default.bold('Name:')} ${agentName}`);
            console.log(`${chalk_1.default.bold('Type:')} ${agent.type}`);
            console.log(`${chalk_1.default.bold('Description:')} ${agent.description}`);
            console.log();
            // Contract details
            if (agent.contract) {
                console.log(chalk_1.default.bold.yellow('📋 Contract:'));
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
                        console.log(chalk_1.default.gray(`    • ${cap}`));
                    });
                    if (agent.contract.capabilities.length > 3) {
                        console.log(chalk_1.default.gray(`    ... and ${agent.contract.capabilities.length - 3} more`));
                    }
                }
                // Show tools if available
                const tools = agent.contract.tools || agent.metadata?.tools;
                if (tools && tools.length > 0) {
                    console.log(`  Tools: ${tools.length}`);
                    tools.slice(0, 3).forEach((tool) => {
                        console.log(chalk_1.default.gray(`    • ${tool}`));
                    });
                    if (tools.length > 3) {
                        console.log(chalk_1.default.gray(`    ... and ${tools.length - 3} more`));
                    }
                }
                console.log();
            }
            // Test specs
            const testSpecs = Object.keys(agent.testSpecs || {});
            console.log(chalk_1.default.bold.yellow('🧪 Test Specs:'));
            if (testSpecs.length > 0) {
                testSpecs.forEach(dimension => {
                    const tests = agent.testSpecs[dimension]?.tests || [];
                    console.log(`  ${dimension}: ${tests.length} tests`);
                });
            }
            else {
                console.log(chalk_1.default.gray('  No tests generated yet'));
                console.log(chalk_1.default.gray('  Run'), chalk_1.default.cyan(`identro-eval generate --agents ${agentName}`), chalk_1.default.gray('to generate tests'));
            }
            console.log();
            // Performance
            console.log(chalk_1.default.bold.yellow('📊 Performance:'));
            console.log(`  Total Runs: ${agent.performance?.totalRuns || 0}`);
            console.log(`  Average Score: ${agent.performance?.averageScore || 0}`);
            console.log();
            // File location
            if (agent.discovered?.path) {
                console.log(chalk_1.default.gray(`File: ${path_1.default.relative(projectPath, agent.discovered.path)}`));
            }
        }
    }
    catch (err) {
        spinner?.fail('Failed to load agent details');
        if (options.json) {
            (0, display_1.displayJson)({ error: err.message });
        }
        else {
            (0, display_1.error)(`Failed to load agent details: ${err.message}`);
        }
        throw err;
    }
}
/**
 * Test a specific agent
 */
async function testAgent(projectPath, agentName, options) {
    if (!options.json) {
        console.log(chalk_1.default.bold.cyan(`\n🧪 Testing Agent: ${agentName}\n`));
    }
    const spinner = options.json ? null : (0, display_1.createSpinner)('Initializing test execution...');
    spinner?.start();
    try {
        const dimensions = options.dimensions?.split(',').map(p => p.trim()) || ['consistency', 'safety', 'performance'];
        // Get LLM config if generating missing tests
        let llmConfig = null;
        if (options.generateMissing) {
            const llmConfigResult = await llm_config_manager_1.llmConfigManager.discoverAndConfigure(projectPath);
            llmConfig = llmConfigResult?.discovered?.[0];
        }
        const testExecutionService = new test_execution_service_1.TestExecutionService();
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
            (0, display_1.displayJson)({
                agent: agentName,
                summary: agentResult?.summary,
                dimensions: agentResult?.dimensions,
                duration: result.duration,
                success: result.totalFailed === 0
            });
        }
        else {
            console.log(chalk_1.default.bold('\nTest Results:'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            if (agentResult) {
                const summary = agentResult.summary;
                const passRate = (summary.successRate * 100).toFixed(1);
                const status = summary.failed === 0 ? chalk_1.default.green('✅') : chalk_1.default.red('❌');
                console.log(`\n${status} ${chalk_1.default.bold(agentName)}`);
                console.log(chalk_1.default.gray(`   Tests: ${summary.totalTests} | Passed: ${summary.passed} | Failed: ${summary.failed}`));
                console.log(chalk_1.default.gray(`   Success Rate: ${passRate}% | Avg Latency: ${summary.averageLatencyMs.toFixed(0)}ms`));
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
                        console.log(chalk_1.default.gray(`   Dimensions: ${dimensionResults.join(' | ')}`));
                    }
                }
            }
            else {
                console.log(chalk_1.default.red(`\n❌ No results found for ${agentName}`));
            }
            console.log(chalk_1.default.gray('\n' + '─'.repeat(50)));
            if (result.totalFailed === 0) {
                (0, display_1.success)(`\n✨ All tests passed! (${result.totalPassed}/${result.totalTests})`);
            }
            else {
                console.log(chalk_1.default.yellow(`\n⚠️  ${result.totalFailed} test(s) failed (${result.totalPassed}/${result.totalTests} passed)`));
            }
            console.log(chalk_1.default.gray(`\nCompleted in ${(result.duration / 1000).toFixed(2)}s`));
        }
    }
    catch (err) {
        spinner?.fail('Test execution failed');
        if (options.json) {
            (0, display_1.displayJson)({ error: err.message });
        }
        else {
            (0, display_1.error)(`Test execution failed: ${err.message}`);
        }
        throw err;
    }
}
//# sourceMappingURL=agents.js.map