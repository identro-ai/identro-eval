/**
 * Analyze command - Analyze agent and team contracts and capabilities
 *
 * Updated to use AnalysisService for unified logic with interactive mode
 */
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { createSpinner, success, displayJson, error, warning } from '../utils/display';
import { withErrorHandling } from '../utils/errors';
import { AnalysisService } from '../services/analysis-service';
import { DiscoveryService } from '../services/discovery-service';
import inquirer from 'inquirer';
export function analyzeCommand() {
    return new Command('analyze')
        .description('Analyze agent and team contracts and capabilities')
        .option('-a, --agent <name>', 'Analyze specific agent')
        .option('-t, --team <name>', 'Analyze specific team')
        .option('-p, --path <path>', 'Project path', process.cwd())
        .option('--include-teams', 'Include team/crew analysis', true)
        .option('--no-teams', 'Exclude team/crew analysis')
        .option('--contracts-only', 'Only extract contracts (no test generation)')
        .option('--force', 'Force re-analysis of all entities')
        .option('--json', 'Output as JSON')
        .action(withErrorHandling(async (options) => {
        await runAnalyze(options);
    }));
}
/**
 * Run the analysis process using AnalysisService
 */
async function runAnalyze(options) {
    const projectPath = path.resolve(options.path || process.cwd());
    if (!options.json) {
        console.log(chalk.bold('\n📊 Analyzing Agent and Team Contracts\n'));
    }
    const spinner = options.json ? null : createSpinner('Initializing analysis...');
    spinner?.start();
    try {
        // Discover entities first
        if (spinner) {
            spinner.text = 'Discovering agents and teams...';
        }
        const discoveryService = new DiscoveryService();
        const discoveryResult = await discoveryService.discoverAll({
            projectPath,
            includeTeams: options.includeTeams !== false,
            initializeDimensions: false,
            initializeConfig: false
        });
        if (discoveryResult.agents.length === 0 && discoveryResult.teams.length === 0) {
            spinner?.fail('No agents or teams found to analyze');
            if (!options.json) {
                console.log(chalk.yellow('\n⚠️  No agents or teams found in the project'));
                console.log(chalk.gray('\nTip: Run'), chalk.bold('identro-eval discover'), chalk.gray('to see what entities are available'));
            }
            else {
                displayJson({ error: 'No agents or teams found', entities: [] });
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
                    console.log(chalk.yellow(`\n⚠️  Agent '${options.agent}' not found`));
                    console.log(chalk.gray('\nAvailable agents:'));
                    discoveryResult.agents.forEach(a => console.log(chalk.cyan(`  • ${a.name}`)));
                }
                else {
                    displayJson({
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
                    console.log(chalk.yellow(`\n⚠️  Team '${options.team}' not found`));
                    console.log(chalk.gray('\nAvailable teams:'));
                    discoveryResult.teams.forEach(t => console.log(chalk.cyan(`  • ${t.name}`)));
                }
                else {
                    displayJson({
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
        const analysisService = new AnalysisService();
        const existingAnalysis = await analysisService.hasExistingAnalysis(projectPath);
        let reanalyzeExisting = [];
        if (existingAnalysis.exists && !options.force && !options.json) {
            spinner?.stop();
            console.log(chalk.yellow(`\n⚠ Found existing analysis with ${existingAnalysis.agentCount} agent(s) and ${existingAnalysis.teamCount} team(s)`));
            const { action } = await inquirer.prompt([{
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
                console.log(chalk.gray('\nAnalysis cancelled'));
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
                const { selectedEntities } = await inquirer.prompt([{
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
            displayJson({
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
            console.log(chalk.bold('\nAnalysis Results:'));
            console.log(chalk.gray('─'.repeat(50)));
            if (analysisResult.analyzedAgents > 0) {
                console.log(chalk.green(`\n✅ Agents analyzed: ${analysisResult.analyzedAgents}`));
            }
            if (analysisResult.analyzedTeams > 0) {
                console.log(chalk.green(`✅ Teams analyzed: ${analysisResult.analyzedTeams}`));
            }
            if (analysisResult.errors.length > 0) {
                console.log(chalk.yellow(`\n⚠ ${analysisResult.errors.length} error(s):`));
                analysisResult.errors.slice(0, 3).forEach(err => {
                    console.log(chalk.red(`  • ${err.entity}: ${err.error}`));
                });
                if (analysisResult.errors.length > 3) {
                    console.log(chalk.gray(`  ... and ${analysisResult.errors.length - 3} more`));
                }
            }
            console.log(chalk.gray('\n' + '─'.repeat(50)));
            if (summary.totalAnalyzed > 0) {
                success(`\n✨ Analysis complete! ${summary.totalAnalyzed} entities analyzed`);
                console.log(chalk.gray(`Success rate: ${(summary.successRate * 100).toFixed(1)}%`));
                console.log(chalk.gray('\nNext steps:'));
                console.log(chalk.cyan('  1. Run'), chalk.bold('identro-eval generate'), chalk.cyan('to generate tests'));
                console.log(chalk.cyan('  2. Run'), chalk.bold('identro-eval test'), chalk.cyan('to execute tests'));
                console.log(chalk.cyan('  3. Run'), chalk.bold('identro-eval report'), chalk.cyan('to generate reports'));
            }
            else {
                warning('\n⚠️  No entities were successfully analyzed');
            }
        }
    }
    catch (err) {
        spinner?.fail('Analysis failed');
        if (options.json) {
            displayJson({
                error: err.message,
                stack: err.stack
            });
        }
        else {
            error(`Analysis failed: ${err.message}`);
            if (err.stack && process.env.DEBUG) {
                console.error(chalk.gray(err.stack));
            }
        }
        throw err;
    }
}
//# sourceMappingURL=analyze.js.map