"use strict";
/**
 * Analyze command - Analyze agent and team contracts and capabilities
 *
 * Updated to use AnalysisService for unified logic with interactive mode
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCommand = analyzeCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const display_1 = require("../utils/display");
const errors_1 = require("../utils/errors");
const analysis_service_1 = require("../services/analysis-service");
const discovery_service_1 = require("../services/discovery-service");
const inquirer_1 = __importDefault(require("inquirer"));
function analyzeCommand() {
    return new commander_1.Command('analyze')
        .description('Analyze agent and team contracts and capabilities')
        .option('-a, --agent <name>', 'Analyze specific agent')
        .option('-t, --team <name>', 'Analyze specific team')
        .option('-p, --path <path>', 'Project path', process.cwd())
        .option('--include-teams', 'Include team/crew analysis', true)
        .option('--no-teams', 'Exclude team/crew analysis')
        .option('--contracts-only', 'Only extract contracts (no test generation)')
        .option('--force', 'Force re-analysis of all entities')
        .option('--json', 'Output as JSON')
        .action((0, errors_1.withErrorHandling)(async (options) => {
        await runAnalyze(options);
    }));
}
/**
 * Run the analysis process using AnalysisService
 */
async function runAnalyze(options) {
    const projectPath = path_1.default.resolve(options.path || process.cwd());
    if (!options.json) {
        console.log(chalk_1.default.bold('\n📊 Analyzing Agent and Team Contracts\n'));
    }
    const spinner = options.json ? null : (0, display_1.createSpinner)('Initializing analysis...');
    spinner?.start();
    try {
        // Discover entities first
        if (spinner) {
            spinner.text = 'Discovering agents and teams...';
        }
        const discoveryService = new discovery_service_1.DiscoveryService();
        const discoveryResult = await discoveryService.discoverAll({
            projectPath,
            includeTeams: options.includeTeams !== false,
            initializeDimensions: false,
            initializeConfig: false
        });
        if (discoveryResult.agents.length === 0 && discoveryResult.teams.length === 0) {
            spinner?.fail('No agents or teams found to analyze');
            if (!options.json) {
                console.log(chalk_1.default.yellow('\n⚠️  No agents or teams found in the project'));
                console.log(chalk_1.default.gray('\nTip: Run'), chalk_1.default.bold('identro-eval discover'), chalk_1.default.gray('to see what entities are available'));
            }
            else {
                (0, display_1.displayJson)({ error: 'No agents or teams found', entities: [] });
            }
            return;
        }
        // Filter entities if specific ones requested
        let selectedAgents = discoveryResult.agents;
        let selectedTeams = discoveryResult.teams;
        if (options.agent) {
            const agent = discoveryResult.agents.find(a => a.name === options.agent);
            if (!agent) {
                spinner?.fail(`Agent '${options.agent}' not found`);
                if (!options.json) {
                    console.log(chalk_1.default.yellow(`\n⚠️  Agent '${options.agent}' not found`));
                    console.log(chalk_1.default.gray('\nAvailable agents:'));
                    discoveryResult.agents.forEach(a => console.log(chalk_1.default.cyan(`  • ${a.name}`)));
                }
                else {
                    (0, display_1.displayJson)({
                        error: `Agent '${options.agent}' not found`,
                        availableAgents: discoveryResult.agents.map(a => a.name)
                    });
                }
                return;
            }
            selectedAgents = [agent];
            selectedTeams = []; // Don't analyze teams if specific agent requested
        }
        if (options.team) {
            const team = discoveryResult.teams.find(t => t.name === options.team);
            if (!team) {
                spinner?.fail(`Team '${options.team}' not found`);
                if (!options.json) {
                    console.log(chalk_1.default.yellow(`\n⚠️  Team '${options.team}' not found`));
                    console.log(chalk_1.default.gray('\nAvailable teams:'));
                    discoveryResult.teams.forEach(t => console.log(chalk_1.default.cyan(`  • ${t.name}`)));
                }
                else {
                    (0, display_1.displayJson)({
                        error: `Team '${options.team}' not found`,
                        availableTeams: discoveryResult.teams.map(t => t.name)
                    });
                }
                return;
            }
            selectedTeams = [team];
            selectedAgents = []; // Don't analyze agents if specific team requested
        }
        // Check for existing analysis and handle user choices
        const analysisService = new analysis_service_1.AnalysisService();
        const existingAnalysis = await analysisService.hasExistingAnalysis(projectPath);
        let reanalyzeExisting = [];
        if (existingAnalysis.exists && !options.force && !options.json) {
            spinner?.stop();
            console.log(chalk_1.default.yellow(`\n⚠ Found existing analysis with ${existingAnalysis.agentCount} agent(s) and ${existingAnalysis.teamCount} team(s)`));
            const { action } = await inquirer_1.default.prompt([{
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do with existing analysis?',
                    choices: [
                        { name: 'Keep existing and add new entities only', value: 'keep' },
                        { name: 'Re-analyze specific entities', value: 'select' },
                        { name: 'Start fresh (delete all existing)', value: 'fresh' },
                        { name: 'Cancel', value: 'cancel' }
                    ]
                }]);
            if (action === 'cancel') {
                console.log(chalk_1.default.gray('\nAnalysis cancelled'));
                return;
            }
            if (action === 'fresh') {
                // Will re-analyze everything
            }
            else if (action === 'select') {
                const allEntities = [
                    ...existingAnalysis.agents.map(name => ({ name, type: 'agent', existing: true })),
                    ...existingAnalysis.teams.map(name => ({ name, type: 'team', existing: true })),
                    ...selectedAgents.map(a => ({ name: a.name, type: 'agent', existing: false })),
                    ...selectedTeams.map(t => ({ name: t.name, type: 'team', existing: false }))
                ];
                const { selectedEntities } = await inquirer_1.default.prompt([{
                        type: 'checkbox',
                        name: 'selectedEntities',
                        message: 'Select entities to analyze/re-analyze:',
                        choices: allEntities.map(entity => ({
                            name: entity.existing ? `${entity.name} (${entity.type}, existing)` : `${entity.name} (${entity.type}, new)`,
                            value: entity.name,
                            checked: !entity.existing // Check new entities by default
                        }))
                    }]);
                // Filter to selected entities
                selectedAgents = selectedAgents.filter(a => selectedEntities.includes(a.name));
                selectedTeams = selectedTeams.filter(t => selectedEntities.includes(t.name));
                reanalyzeExisting = selectedEntities.filter((name) => existingAnalysis.agents.includes(name) || existingAnalysis.teams.includes(name));
            }
            else if (action === 'keep') {
                // Only analyze new entities
                selectedAgents = selectedAgents.filter(a => !existingAnalysis.agents.includes(a.name));
                selectedTeams = selectedTeams.filter(t => !existingAnalysis.teams.includes(t.name));
            }
            spinner?.start();
        }
        // Run analysis using AnalysisService
        if (spinner) {
            spinner.text = 'Analyzing contracts and capabilities...';
        }
        const analysisResult = await analysisService.analyzeAll({
            projectPath,
            agents: selectedAgents,
            teams: selectedTeams,
            framework: discoveryResult.framework,
            reanalyzeExisting,
            contractsOnly: options.contractsOnly
        });
        const summary = analysisService.getAnalysisSummary(analysisResult);
        spinner?.stop();
        if (options.json) {
            (0, display_1.displayJson)({
                framework: discoveryResult.framework,
                summary: {
                    totalAnalyzed: summary.totalAnalyzed,
                    totalSkipped: summary.totalSkipped,
                    successRate: summary.successRate,
                    analyzedAgents: analysisResult.analyzedAgents,
                    analyzedTeams: analysisResult.analyzedTeams
                },
                errors: analysisResult.errors
            });
        }
        else {
            console.log(chalk_1.default.bold('\nAnalysis Results:'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            if (analysisResult.analyzedAgents > 0) {
                console.log(chalk_1.default.green(`\n✅ Agents analyzed: ${analysisResult.analyzedAgents}`));
            }
            if (analysisResult.analyzedTeams > 0) {
                console.log(chalk_1.default.green(`✅ Teams analyzed: ${analysisResult.analyzedTeams}`));
            }
            if (analysisResult.errors.length > 0) {
                console.log(chalk_1.default.yellow(`\n⚠ ${analysisResult.errors.length} error(s):`));
                analysisResult.errors.slice(0, 3).forEach(err => {
                    console.log(chalk_1.default.red(`  • ${err.entity}: ${err.error}`));
                });
                if (analysisResult.errors.length > 3) {
                    console.log(chalk_1.default.gray(`  ... and ${analysisResult.errors.length - 3} more`));
                }
            }
            console.log(chalk_1.default.gray('\n' + '─'.repeat(50)));
            if (summary.totalAnalyzed > 0) {
                (0, display_1.success)(`\n✨ Analysis complete! ${summary.totalAnalyzed} entities analyzed`);
                console.log(chalk_1.default.gray(`Success rate: ${(summary.successRate * 100).toFixed(1)}%`));
                console.log(chalk_1.default.gray('\nNext steps:'));
                console.log(chalk_1.default.cyan('  1. Run'), chalk_1.default.bold('identro-eval generate'), chalk_1.default.cyan('to generate tests'));
                console.log(chalk_1.default.cyan('  2. Run'), chalk_1.default.bold('identro-eval test'), chalk_1.default.cyan('to execute tests'));
                console.log(chalk_1.default.cyan('  3. Run'), chalk_1.default.bold('identro-eval report'), chalk_1.default.cyan('to generate reports'));
            }
            else {
                (0, display_1.warning)('\n⚠️  No entities were successfully analyzed');
            }
        }
    }
    catch (err) {
        spinner?.fail('Analysis failed');
        if (options.json) {
            (0, display_1.displayJson)({
                error: err.message,
                stack: err.stack
            });
        }
        else {
            (0, display_1.error)(`Analysis failed: ${err.message}`);
            if (err.stack && process.env.DEBUG) {
                console.error(chalk_1.default.gray(err.stack));
            }
        }
        throw err;
    }
}
//# sourceMappingURL=analyze.js.map