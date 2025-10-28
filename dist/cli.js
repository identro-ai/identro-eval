#!/usr/bin/env node
"use strict";
/**
 * Identro Eval CLI
 *
 * Modern, developer-friendly CLI for AI agent evaluation
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
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const dotenv = __importStar(require("dotenv"));
const package_json_1 = require("../package.json");
// Commands
const init_1 = require("./commands/init");
const discover_1 = require("./commands/discover");
const analyze_1 = require("./commands/analyze");
const test_1 = require("./commands/test");
const report_1 = require("./commands/report");
const watch_1 = require("./commands/watch");
const config_1 = require("./commands/config");
const llm_1 = require("./commands/llm");
const interactive_1 = require("./commands/interactive");
const dimensions_1 = require("./commands/dimensions");
const generate_1 = require("./commands/generate");
const agents_1 = require("./commands/agents");
const teams_1 = require("./commands/teams");
// Utils
const display_1 = require("./utils/display");
const updates_1 = require("./utils/updates");
const config_2 = require("./utils/config");
const errors_1 = require("./utils/errors");
// Load environment variables
dotenv.config();
// Setup error handlers
(0, errors_1.setupErrorHandlers)();
// Create main program
const program = new commander_1.Command();
// Check if --json flag is present before displaying banner
const hasJsonFlag = process.argv.includes('--json');
// Display banner only if not in JSON mode
if (!hasJsonFlag) {
    (0, display_1.displayBanner)();
    // Check for updates
    (0, updates_1.checkForUpdates)();
}
// Configure program
program
    .name('identro-eval')
    .description('AI Agent Evaluation Suite - Test and validate your AI agents')
    .version(package_json_1.version)
    .option('-c, --config <path>', 'Path to configuration file')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--no-color', 'Disable colored output')
    .option('--json', 'Output results as JSON')
    .hook('preAction', async (thisCommand) => {
    // Load configuration before any command
    const config = await (0, config_2.loadConfig)(thisCommand.opts().config);
    thisCommand.setOptionValue('loadedConfig', config);
});
// Add commands
program.addCommand((0, interactive_1.interactiveCommand)());
program.addCommand((0, init_1.initCommand)());
program.addCommand((0, discover_1.discoverCommand)());
program.addCommand((0, analyze_1.analyzeCommand)());
program.addCommand((0, generate_1.generateCommand)());
program.addCommand((0, test_1.testCommand)());
program.addCommand((0, report_1.reportCommand)());
program.addCommand((0, watch_1.watchCommand)());
program.addCommand((0, config_1.configCommand)());
program.addCommand((0, llm_1.llmCommand)());
program.addCommand((0, dimensions_1.dimensionsCommand)());
program.addCommand((0, agents_1.agentsCommand)());
program.addCommand((0, teams_1.teamsCommand)());
// Check if no command was provided before parsing
const args = process.argv.slice(2);
const hasCommand = args.some(arg => !arg.startsWith('-') && !arg.startsWith('--'));
const hasHelpFlag = args.includes('--help') || args.includes('-h');
if (!hasCommand && !hasHelpFlag) {
    // Run interactive wizard as default instead of showing help
    (0, interactive_1.runInteractiveWizard)().catch(err => {
        console.error(chalk_1.default.red('Error:'), err.message);
        if (process.env.DEBUG) {
            console.error(chalk_1.default.gray(err.stack));
        }
        process.exit(1);
    });
}
else {
    // Parse arguments only if a command was provided or help was requested
    program.parse(process.argv);
}
//# sourceMappingURL=cli.js.map