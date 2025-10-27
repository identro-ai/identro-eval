/**
 * Discover command - Find AI agents and teams in the project
 *
 * Updated to use DiscoveryService for unified logic with interactive mode
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { success, error, info, section, displayAgents, createSpinner, displayJson } from '../utils/display';
import { withErrorHandling } from '../utils/errors';
import { DiscoveryService } from '../services/discovery-service';
import path from 'path';
/**
 * Create the discover command
 */
export function discoverCommand() {
    return new Command('discover')
        .description('Discover AI agents and teams in your project')
        .option('-f, --framework <type>', 'Specify framework (langchain, crewai, etc.)')
        .option('-p, --path <path>', 'Project path to scan', process.cwd())
        .option('--include-teams', 'Include team/crew discovery', true)
        .option('--no-teams', 'Exclude team/crew discovery')
        .option('--init-dimensions', 'Initialize dimension files', true)
        .option('--no-dimensions', 'Skip dimension file initialization')
        .option('--init-config', 'Initialize config directory', true)
        .option('--no-config', 'Skip config directory initialization')
        .option('--json', 'Output as JSON')
        .action(withErrorHandling(async (options) => {
        await runDiscover(options);
    }));
}
/**
 * Run the discovery process using DiscoveryService
 */
async function runDiscover(options) {
    const projectPath = path.resolve(options.path || process.cwd());
    if (!options.json) {
        console.log(chalk.bold('\n🔍 Discovering AI Agents and Teams\n'));
        section('Project Analysis');
    }
    const spinner = options.json ? null : createSpinner('Scanning project...');
    spinner?.start();
    try {
        const discoveryService = new DiscoveryService();
        // Use DiscoveryService for unified discovery logic
        const result = await discoveryService.discoverAll({
            projectPath,
            framework: options.framework,
            includeTeams: options.includeTeams !== false,
            initializeDimensions: options.initDimensions !== false,
            initializeConfig: options.initConfig !== false
        });
        const summary = discoveryService.getDiscoverySummary(result);
        if (options.json) {
            spinner?.stop();
            displayJson({
                framework: result.framework,
                agents: discoveryService.formatAgentsForDisplay(result.agents, result.framework),
                teams: discoveryService.formatTeamsForDisplay(result.teams),
                summary: {
                    framework: summary.framework,
                    agentCount: summary.agentCount,
                    teamCount: summary.teamCount,
                    totalEntities: summary.totalEntities
                }
            });
            return;
        }
        spinner?.succeed(`Found ${summary.totalEntities} entities using ${summary.framework}`);
        if (summary.totalEntities > 0) {
            console.log();
            // Display agents
            if (summary.agentCount > 0) {
                console.log(chalk.bold.cyan('🤖 Individual Agents:'));
                const displayableAgents = discoveryService.formatAgentsForDisplay(result.agents, result.framework);
                displayAgents(displayableAgents);
            }
            // Display teams
            if (summary.teamCount > 0) {
                console.log(chalk.bold.cyan('\n👥 Teams/Crews:'));
                console.log();
                const formattedTeams = discoveryService.formatTeamsForDisplay(result.teams);
                for (const team of formattedTeams) {
                    console.log(`${chalk.cyan('●')} ${chalk.bold(team.name)} ${chalk.gray(`(${team.type})`)}`);
                    console.log(`  ${chalk.gray('Description:')} ${team.description}`);
                    console.log(`  ${chalk.gray('Members:')} ${team.memberCount} agents`);
                    console.log(`  ${chalk.gray('Process:')} ${team.process}`);
                    console.log(`  ${chalk.gray('Capabilities:')} ${team.capabilities.slice(0, 3).join(', ')}${team.capabilities.length > 3 ? '...' : ''}`);
                    console.log();
                }
            }
            success(`\n✨ Discovery complete! Found ${summary.agentCount} agent(s) and ${summary.teamCount} team(s)`);
            console.log(chalk.gray('\nNext steps:'));
            console.log(chalk.cyan('  1. Run'), chalk.bold('identro-eval analyze'), chalk.cyan('to analyze contracts'));
            console.log(chalk.cyan('  2. Run'), chalk.bold('identro-eval generate'), chalk.cyan('to generate tests'));
            console.log(chalk.cyan('  3. Run'), chalk.bold('identro-eval test'), chalk.cyan('to execute tests'));
            console.log(chalk.cyan('  4. Run'), chalk.bold('identro-eval report'), chalk.cyan('to generate reports'));
        }
        else {
            info(`\nNo agents or teams found in the project using ${summary.framework}`);
            console.log(chalk.gray('\nTips:'));
            console.log(chalk.cyan('  • Make sure you\'re in the right directory'));
            console.log(chalk.cyan('  • Check if your agents follow framework conventions'));
            console.log(chalk.cyan('  • For LangChain: Look for files with LLMChain, ConversationChain, etc.'));
            console.log(chalk.cyan('  • For CrewAI: Look for Agent class definitions and Crew instances'));
        }
    }
    catch (err) {
        spinner?.fail('Discovery failed');
        if (options.json) {
            displayJson({
                error: err.message,
                stack: err.stack
            });
        }
        else {
            error(`Discovery failed: ${err.message}`);
            if (err.stack && process.env.DEBUG) {
                console.error(chalk.gray(err.stack));
            }
        }
        throw err;
    }
}
//# sourceMappingURL=discover.js.map