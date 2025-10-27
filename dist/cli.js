#!/usr/bin/env node
/**
 * Identro Eval CLI
 *
 * Modern, developer-friendly CLI for AI agent evaluation
 */
import { Command } from 'commander';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import { version } from '../package.json';
// Commands
import { initCommand } from './commands/init';
import { discoverCommand } from './commands/discover';
import { analyzeCommand } from './commands/analyze';
import { testCommand } from './commands/test';
import { reportCommand } from './commands/report';
import { watchCommand } from './commands/watch';
import { configCommand } from './commands/config';
import { llmCommand } from './commands/llm';
import { interactiveCommand, runInteractiveWizard } from './commands/interactive';
import { dimensionsCommand } from './commands/dimensions';
import { generateCommand } from './commands/generate';
import { agentsCommand } from './commands/agents';
import { teamsCommand } from './commands/teams';
// Utils
import { displayBanner } from './utils/display';
import { checkForUpdates } from './utils/updates';
import { loadConfig } from './utils/config';
import { setupErrorHandlers } from './utils/errors';
// Load environment variables
dotenv.config();
// Setup error handlers
setupErrorHandlers();
// Create main program
const program = new Command();
// Check if --json flag is present before displaying banner
const hasJsonFlag = process.argv.includes('--json');
// Display banner only if not in JSON mode
if (!hasJsonFlag) {
    displayBanner();
    // Check for updates
    checkForUpdates();
}
// Configure program
program
    .name('identro-eval')
    .description('AI Agent Evaluation Suite - Test and validate your AI agents')
    .version(version)
    .option('-c, --config <path>', 'Path to configuration file')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--no-color', 'Disable colored output')
    .option('--json', 'Output results as JSON')
    .hook('preAction', async (thisCommand) => {
    // Load configuration before any command
    const config = await loadConfig(thisCommand.opts().config);
    thisCommand.setOptionValue('loadedConfig', config);
});
// Add commands
program.addCommand(interactiveCommand());
program.addCommand(initCommand());
program.addCommand(discoverCommand());
program.addCommand(analyzeCommand());
program.addCommand(generateCommand());
program.addCommand(testCommand());
program.addCommand(reportCommand());
program.addCommand(watchCommand());
program.addCommand(configCommand());
program.addCommand(llmCommand());
program.addCommand(dimensionsCommand());
program.addCommand(agentsCommand());
program.addCommand(teamsCommand());
// Check if no command was provided before parsing
const args = process.argv.slice(2);
const hasCommand = args.some(arg => !arg.startsWith('-') && !arg.startsWith('--'));
const hasHelpFlag = args.includes('--help') || args.includes('-h');
if (!hasCommand && !hasHelpFlag) {
    // Run interactive wizard as default instead of showing help
    runInteractiveWizard().catch(err => {
        console.error(chalk.red('Error:'), err.message);
        if (process.env.DEBUG) {
            console.error(chalk.gray(err.stack));
        }
        process.exit(1);
    });
}
else {
    // Parse arguments only if a command was provided or help was requested
    program.parse(process.argv);
}
//# sourceMappingURL=cli.js.map