"use strict";
/**
 * Discover command - Find AI agents and teams in the project
 *
 * Updated to use DiscoveryService for unified logic with interactive mode
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverCommand = discoverCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const display_1 = require("../utils/display");
const errors_1 = require("../utils/errors");
const discovery_service_1 = require("../services/discovery-service");
const path_1 = __importDefault(require("path"));
/**
 * Create the discover command
 */
function discoverCommand() {
    return new commander_1.Command('discover')
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
        .action((0, errors_1.withErrorHandling)(async (options) => {
        await runDiscover(options);
    }));
}
/**
 * Run the discovery process using DiscoveryService
 */
async function runDiscover(options) {
    const projectPath = path_1.default.resolve(options.path || process.cwd());
    if (!options.json) {
        console.log(chalk_1.default.bold('\n🔍 Discovering AI Agents and Teams\n'));
        (0, display_1.section)('Project Analysis');
    }
    const spinner = options.json ? null : (0, display_1.createSpinner)('Scanning project...');
    spinner?.start();
    try {
        const discoveryService = new discovery_service_1.DiscoveryService();
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
            (0, display_1.displayJson)({
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
                console.log(chalk_1.default.bold.cyan('🤖 Individual Agents:'));
                const displayableAgents = discoveryService.formatAgentsForDisplay(result.agents, result.framework);
                (0, display_1.displayAgents)(displayableAgents);
            }
            // Display teams
            if (summary.teamCount > 0) {
                console.log(chalk_1.default.bold.cyan('\n👥 Teams/Crews:'));
                console.log();
                const formattedTeams = discoveryService.formatTeamsForDisplay(result.teams);
                for (const team of formattedTeams) {
                    console.log(`${chalk_1.default.cyan('●')} ${chalk_1.default.bold(team.name)} ${chalk_1.default.gray(`(${team.type})`)}`);
                    console.log(`  ${chalk_1.default.gray('Description:')} ${team.description}`);
                    console.log(`  ${chalk_1.default.gray('Members:')} ${team.memberCount} agents`);
                    console.log(`  ${chalk_1.default.gray('Process:')} ${team.process}`);
                    console.log(`  ${chalk_1.default.gray('Capabilities:')} ${team.capabilities.slice(0, 3).join(', ')}${team.capabilities.length > 3 ? '...' : ''}`);
                    console.log();
                }
            }
            (0, display_1.success)(`\n✨ Discovery complete! Found ${summary.agentCount} agent(s) and ${summary.teamCount} team(s)`);
            console.log(chalk_1.default.gray('\nNext steps:'));
            console.log(chalk_1.default.cyan('  1. Run'), chalk_1.default.bold('identro-eval analyze'), chalk_1.default.cyan('to analyze contracts'));
            console.log(chalk_1.default.cyan('  2. Run'), chalk_1.default.bold('identro-eval generate'), chalk_1.default.cyan('to generate tests'));
            console.log(chalk_1.default.cyan('  3. Run'), chalk_1.default.bold('identro-eval test'), chalk_1.default.cyan('to execute tests'));
            console.log(chalk_1.default.cyan('  4. Run'), chalk_1.default.bold('identro-eval report'), chalk_1.default.cyan('to generate reports'));
        }
        else {
            (0, display_1.info)(`\nNo agents or teams found in the project using ${summary.framework}`);
            console.log(chalk_1.default.gray('\nTips:'));
            console.log(chalk_1.default.cyan('  • Make sure you\'re in the right directory'));
            console.log(chalk_1.default.cyan('  • Check if your agents follow framework conventions'));
            console.log(chalk_1.default.cyan('  • For LangChain: Look for files with LLMChain, ConversationChain, etc.'));
            console.log(chalk_1.default.cyan('  • For CrewAI: Look for Agent class definitions and Crew instances'));
        }
    }
    catch (err) {
        spinner?.fail('Discovery failed');
        if (options.json) {
            (0, display_1.displayJson)({
                error: err.message,
                stack: err.stack
            });
        }
        else {
            (0, display_1.error)(`Discovery failed: ${err.message}`);
            if (err.stack && process.env.DEBUG) {
                console.error(chalk_1.default.gray(err.stack));
            }
        }
        throw err;
    }
}
//# sourceMappingURL=discover.js.map