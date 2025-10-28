"use strict";
/**
 * Teams command - Manage teams/crews
 *
 * Provides commands for listing, showing, and testing teams/crews
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
exports.teamsCommand = teamsCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs-extra"));
const display_1 = require("../utils/display");
const discovery_service_1 = require("../services/discovery-service");
const test_execution_service_1 = require("../services/test-execution-service");
const llm_config_manager_1 = require("../services/llm-config-manager");
/**
 * Create the teams command with subcommands
 */
function teamsCommand() {
    const cmd = new commander_1.Command('teams')
        .description('Manage teams/crews')
        .option('-p, --path <path>', 'Project path', process.cwd());
    // List teams subcommand
    cmd.command('list')
        .description('List all discovered teams')
        .option('--json', 'Output as JSON')
        .action(async (options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await listTeams(projectPath, options);
    });
    // Show team subcommand
    cmd.command('show <team>')
        .description('Show details of a specific team')
        .option('--json', 'Output as JSON')
        .action(async (teamName, options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await showTeam(projectPath, teamName, options);
    });
    // Show team workflow subcommand
    cmd.command('workflow <team>')
        .description('Show team workflow and task dependencies')
        .option('--json', 'Output as JSON')
        .action(async (teamName, options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await showTeamWorkflow(projectPath, teamName, options);
    });
    // Test team subcommand
    cmd.command('test <team>')
        .description('Run tests for specific team')
        .option('-p, --dimensions <dimensions>', 'Test dimensions (comma-separated). Defaults to enabled dimensions from config.')
        .option('--split-pane', 'Use split-pane display')
        .option('--generate-missing', 'Generate missing tests before running')
        .option('--json', 'Output as JSON')
        .action(async (teamName, options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await testTeam(projectPath, teamName, options);
    });
    return cmd;
}
/**
 * List all discovered teams
 */
async function listTeams(projectPath, options) {
    if (!options.json) {
        console.log(chalk_1.default.bold.cyan('\n👥 Available Teams\n'));
    }
    const spinner = options.json ? null : (0, display_1.createSpinner)('Discovering teams...');
    spinner?.start();
    try {
        const discoveryService = new discovery_service_1.DiscoveryService();
        const result = await discoveryService.discoverAll({
            projectPath,
            includeTeams: true,
            initializeDimensions: false,
            initializeConfig: false
        });
        spinner?.stop();
        if (result.teams.length === 0) {
            if (options.json) {
                (0, display_1.displayJson)({ teams: [], count: 0 });
            }
            else {
                console.log(chalk_1.default.yellow('No teams found in the project.'));
                console.log(chalk_1.default.gray('\nTip: Make sure you have Crew definitions in your project.'));
            }
            return;
        }
        if (options.json) {
            (0, display_1.displayJson)({
                framework: result.framework,
                teams: discoveryService.formatTeamsForDisplay(result.teams),
                count: result.teams.length
            });
        }
        else {
            console.log(`Found ${result.teams.length} team(s) using ${result.framework}:\n`);
            const formattedTeams = discoveryService.formatTeamsForDisplay(result.teams);
            for (const team of formattedTeams) {
                console.log(`${chalk_1.default.cyan('●')} ${chalk_1.default.bold(team.name)} ${chalk_1.default.gray(`(${team.type})`)}`);
                console.log(`  ${chalk_1.default.gray('Description:')} ${team.description}`);
                console.log(`  ${chalk_1.default.gray('Members:')} ${team.memberCount} agents`);
                console.log(`  ${chalk_1.default.gray('Process:')} ${team.process}`);
                console.log(`  ${chalk_1.default.gray('Capabilities:')} ${team.capabilities.slice(0, 3).join(', ')}${team.capabilities.length > 3 ? '...' : ''}`);
                console.log();
            }
            console.log(chalk_1.default.gray(`Framework: ${result.framework}`));
            console.log(chalk_1.default.gray(`Total teams: ${result.teams.length}`));
        }
    }
    catch (err) {
        spinner?.fail('Failed to discover teams');
        if (options.json) {
            (0, display_1.displayJson)({ error: err.message });
        }
        else {
            (0, display_1.error)(`Failed to discover teams: ${err.message}`);
        }
        throw err;
    }
}
/**
 * Show details of a specific team
 */
async function showTeam(projectPath, teamName, options) {
    if (!options.json) {
        console.log(chalk_1.default.bold.cyan(`\n👥 Team: ${teamName}\n`));
    }
    const spinner = options.json ? null : (0, display_1.createSpinner)('Loading team details...');
    spinner?.start();
    try {
        // Load eval spec to get team details
        const evalSpecPath = path_1.default.join(projectPath, '.identro', 'eval-spec.json');
        if (!await fs.pathExists(evalSpecPath)) {
            spinner?.fail('No evaluation spec found');
            if (options.json) {
                (0, display_1.displayJson)({
                    error: 'No evaluation spec found',
                    suggestion: 'Run "identro-eval analyze --include-teams" first'
                });
            }
            else {
                (0, display_1.error)('No evaluation spec found');
                console.log(chalk_1.default.gray('\nRun'), chalk_1.default.cyan('identro-eval analyze --include-teams'), chalk_1.default.gray('first to analyze teams.'));
            }
            return;
        }
        const evalSpec = await fs.readJson(evalSpecPath);
        // PHASE 2 FIX: Read teams from evalSpec.teams instead of evalSpec.agents
        const team = evalSpec.teams?.[teamName];
        if (!team) {
            spinner?.fail(`Team '${teamName}' not found`);
            if (options.json) {
                (0, display_1.displayJson)({
                    error: `Team '${teamName}' not found`,
                    availableTeams: Object.keys(evalSpec.teams || {})
                });
            }
            else {
                (0, display_1.error)(`Team '${teamName}' not found`);
                console.log(chalk_1.default.gray('\nAvailable teams:'));
                Object.keys(evalSpec.teams || {}).forEach(name => {
                    console.log(chalk_1.default.cyan(`  • ${name}`));
                });
            }
            return;
        }
        spinner?.stop();
        if (options.json) {
            (0, display_1.displayJson)({
                name: teamName,
                type: team.type,
                description: team.description,
                contract: team.contract,
                testSpecs: Object.keys(team.testSpecs || {}),
                performance: team.performance
            });
        }
        else {
            // Display team details
            console.log(`${chalk_1.default.bold('Name:')} ${teamName}`);
            console.log(`${chalk_1.default.bold('Type:')} ${team.type}`);
            console.log(`${chalk_1.default.bold('Description:')} ${team.description}`);
            console.log();
            // Team structure
            const teamStructure = team.contract?.metadata?.teamStructure;
            if (teamStructure) {
                console.log(chalk_1.default.bold.yellow('👥 Team Structure:'));
                console.log(`  Process: ${teamStructure.process}`);
                console.log(`  Members: ${teamStructure.agents?.length || 0} agents`);
                if (teamStructure.agents?.length > 0) {
                    console.log(`  Agents:`);
                    teamStructure.agents.slice(0, 3).forEach((agent) => {
                        console.log(chalk_1.default.gray(`    • ${agent.name} (${agent.role})`));
                    });
                    if (teamStructure.agents.length > 3) {
                        console.log(chalk_1.default.gray(`    ... and ${teamStructure.agents.length - 3} more`));
                    }
                }
                if (teamStructure.tasks?.length > 0) {
                    console.log(`  Tasks: ${teamStructure.tasks.length}`);
                    teamStructure.tasks.slice(0, 3).forEach((task) => {
                        console.log(chalk_1.default.gray(`    • ${task.name} → ${task.agent}`));
                    });
                    if (teamStructure.tasks.length > 3) {
                        console.log(chalk_1.default.gray(`    ... and ${teamStructure.tasks.length - 3} more`));
                    }
                }
                console.log();
            }
            // Capabilities
            if (team.contract?.capabilities?.length > 0) {
                console.log(chalk_1.default.bold.yellow('🔧 Capabilities:'));
                team.contract.capabilities.slice(0, 5).forEach((cap) => {
                    console.log(chalk_1.default.gray(`  • ${cap}`));
                });
                if (team.contract.capabilities.length > 5) {
                    console.log(chalk_1.default.gray(`  ... and ${team.contract.capabilities.length - 5} more`));
                }
                console.log();
            }
            // Test specs
            const testSpecs = Object.keys(team.testSpecs || {});
            console.log(chalk_1.default.bold.yellow('🧪 Test Specs:'));
            if (testSpecs.length > 0) {
                testSpecs.forEach(dimension => {
                    const tests = team.testSpecs[dimension]?.tests || [];
                    console.log(`  ${dimension}: ${tests.length} tests`);
                });
            }
            else {
                console.log(chalk_1.default.gray('  No tests generated yet'));
                console.log(chalk_1.default.gray('  Run'), chalk_1.default.cyan(`identro-eval generate --teams ${teamName}`), chalk_1.default.gray('to generate tests'));
            }
            console.log();
            // Performance
            console.log(chalk_1.default.bold.yellow('📊 Performance:'));
            console.log(`  Total Runs: ${team.performance?.totalRuns || 0}`);
            console.log(`  Average Score: ${team.performance?.averageScore || 0}`);
            console.log();
            // File location
            if (team.discovered?.path) {
                console.log(chalk_1.default.gray(`File: ${path_1.default.relative(projectPath, team.discovered.path)}`));
            }
        }
    }
    catch (err) {
        spinner?.fail('Failed to load team details');
        if (options.json) {
            (0, display_1.displayJson)({ error: err.message });
        }
        else {
            (0, display_1.error)(`Failed to load team details: ${err.message}`);
        }
        throw err;
    }
}
/**
 * Show team workflow and task dependencies
 */
async function showTeamWorkflow(projectPath, teamName, options) {
    if (!options.json) {
        console.log(chalk_1.default.bold.cyan(`\n🔄 Team Workflow: ${teamName}\n`));
    }
    const spinner = options.json ? null : (0, display_1.createSpinner)('Loading workflow details...');
    spinner?.start();
    try {
        // Load eval spec to get team details
        const evalSpecPath = path_1.default.join(projectPath, '.identro', 'eval-spec.json');
        if (!await fs.pathExists(evalSpecPath)) {
            spinner?.fail('No evaluation spec found');
            if (options.json) {
                (0, display_1.displayJson)({
                    error: 'No evaluation spec found',
                    suggestion: 'Run "identro-eval analyze --include-teams" first'
                });
            }
            else {
                (0, display_1.error)('No evaluation spec found');
                console.log(chalk_1.default.gray('\nRun'), chalk_1.default.cyan('identro-eval analyze --include-teams'), chalk_1.default.gray('first to analyze teams.'));
            }
            return;
        }
        const evalSpec = await fs.readJson(evalSpecPath);
        // PHASE 2 FIX: Read teams from evalSpec.teams instead of evalSpec.agents
        const team = evalSpec.teams?.[teamName];
        if (!team) {
            spinner?.fail(`Team '${teamName}' not found`);
            if (options.json) {
                (0, display_1.displayJson)({
                    error: `Team '${teamName}' not found`
                });
            }
            else {
                (0, display_1.error)(`Team '${teamName}' not found`);
            }
            return;
        }
        const teamStructure = team.contract?.metadata?.teamStructure;
        const workflow = teamStructure?.workflow;
        spinner?.stop();
        if (options.json) {
            (0, display_1.displayJson)({
                name: teamName,
                workflow: workflow,
                tasks: teamStructure?.tasks || [],
                agents: teamStructure?.agents || []
            });
        }
        else {
            console.log(`${chalk_1.default.bold('Team:')} ${teamName}`);
            console.log(`${chalk_1.default.bold('Process:')} ${teamStructure?.process || 'Unknown'}`);
            console.log();
            // Workflow summary
            if (workflow?.summary) {
                console.log(chalk_1.default.bold.yellow('🔄 Workflow:'));
                console.log(`  ${workflow.summary}`);
                console.log();
            }
            // Task sequence
            if (workflow?.sequence?.length > 0) {
                console.log(chalk_1.default.bold.yellow('📋 Task Sequence:'));
                workflow.sequence.forEach((taskName, index) => {
                    const task = teamStructure?.tasks?.find((t) => t.name === taskName);
                    console.log(`  ${index + 1}. ${chalk_1.default.cyan(taskName)}`);
                    if (task) {
                        console.log(`     ${chalk_1.default.gray('Agent:')} ${task.agent}`);
                        console.log(`     ${chalk_1.default.gray('Dependencies:')} ${task.dependencies?.join(', ') || 'none'}`);
                    }
                });
                console.log();
            }
            // Dependency chain
            if (workflow?.dependencyChain?.length > 0) {
                console.log(chalk_1.default.bold.yellow('🔗 Dependency Chain:'));
                workflow.dependencyChain.forEach((dep) => {
                    const level = '  '.repeat(dep.level);
                    console.log(`${level}${chalk_1.default.cyan(dep.task)} ${chalk_1.default.gray(`(level ${dep.level})`)}`);
                    if (dep.dependsOn?.length > 0) {
                        console.log(`${level}  ${chalk_1.default.gray('Depends on:')} ${dep.dependsOn.join(', ')}`);
                    }
                });
                console.log();
            }
            // Parallel groups
            if (workflow?.parallelGroups?.length > 0) {
                console.log(chalk_1.default.bold.yellow('⚡ Parallel Groups:'));
                workflow.parallelGroups.forEach((group, index) => {
                    console.log(`  Group ${index + 1}: ${group.join(', ')}`);
                });
                console.log();
            }
        }
    }
    catch (err) {
        spinner?.fail('Failed to load workflow details');
        if (options.json) {
            (0, display_1.displayJson)({ error: err.message });
        }
        else {
            (0, display_1.error)(`Failed to load workflow details: ${err.message}`);
        }
        throw err;
    }
}
/**
 * Test a specific team
 */
async function testTeam(projectPath, teamName, options) {
    if (!options.json) {
        console.log(chalk_1.default.bold.cyan(`\n🧪 Testing Team: ${teamName}\n`));
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
            entityNames: [teamName],
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
        const teamResult = result.results.get(teamName);
        if (options.json) {
            (0, display_1.displayJson)({
                team: teamName,
                summary: teamResult?.summary,
                dimensions: teamResult?.dimensions,
                duration: result.duration,
                success: result.totalFailed === 0
            });
        }
        else {
            console.log(chalk_1.default.bold('\nTest Results:'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            if (teamResult) {
                const summary = teamResult.summary;
                const passRate = (summary.successRate * 100).toFixed(1);
                const status = summary.failed === 0 ? chalk_1.default.green('✅') : chalk_1.default.red('❌');
                console.log(`\n${status} ${chalk_1.default.bold(teamName)}`);
                console.log(chalk_1.default.gray(`   Tests: ${summary.totalTests} | Passed: ${summary.passed} | Failed: ${summary.failed}`));
                console.log(chalk_1.default.gray(`   Success Rate: ${passRate}% | Avg Latency: ${summary.averageLatencyMs.toFixed(0)}ms`));
                // Show dimension results
                if (teamResult.dimensions) {
                    const dimensionResults = [];
                    if (teamResult.dimensions.consistency) {
                        dimensionResults.push(`Consistency: ${teamResult.dimensions.consistency.isConsistent ? '✅' : '❌'}`);
                    }
                    if (teamResult.dimensions.safety) {
                        dimensionResults.push(`Safety: ${(teamResult.dimensions.safety.safetyScore * 100).toFixed(0)}%`);
                    }
                    if (teamResult.dimensions.performance) {
                        dimensionResults.push(`Performance: ${teamResult.dimensions.performance.latencyPercentiles?.p50 || 'N/A'}ms`);
                    }
                    if (dimensionResults.length > 0) {
                        console.log(chalk_1.default.gray(`   Dimensions: ${dimensionResults.join(' | ')}`));
                    }
                }
            }
            else {
                console.log(chalk_1.default.red(`\n❌ No results found for ${teamName}`));
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
//# sourceMappingURL=teams.js.map