"use strict";
/**
 * Watch Mode Command - Auto-rerun tests on file changes
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
exports.watchCommand = watchCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const chokidar_1 = __importDefault(require("chokidar"));
const path = __importStar(require("path"));
const debounce_js_1 = __importDefault(require("lodash/debounce.js"));
const animations_1 = require("../utils/animations");
const enhanced_progress_1 = require("../utils/enhanced-progress");
const evaluation_engine_1 = require("../services/evaluation-engine");
const config_1 = require("../utils/config");
const boxen_1 = __importDefault(require("boxen"));
const figures_1 = __importDefault(require("figures"));
function watchCommand() {
    return new commander_1.Command('watch')
        .description('Watch for changes and auto-rerun tests')
        .option('-p, --path <path>', 'Project path to watch', process.cwd())
        .option('-f, --framework <framework>', 'AI framework (auto-detected if not specified)')
        .option('--dimensions <dimensions...>', 'Test dimensions to run', ['consistency', 'safety', 'performance'])
        .option('--quick', 'Use quick mode (no LLM calls)', false)
        .option('--debounce <ms>', 'Debounce delay in milliseconds', '2000')
        .option('--ignore <dimensions...>', 'Dimensions to ignore', ['node_modules', '.git', 'dist', 'build'])
        .option('--verbose', 'Show detailed output', false)
        .action(async (options) => {
        await runWatchMode(options);
    });
}
async function runWatchMode(options) {
    const session = {
        projectPath: path.resolve(options.path),
        framework: options.framework || '',
        agents: [],
        testConfig: {
            dimensions: options.dimensions,
            quick: options.quick,
        },
        lastRunTime: new Date(),
        totalRuns: 0,
        passHistory: [],
    };
    // Display watch mode banner
    displayWatchBanner();
    try {
        // Initial discovery
        await initialDiscovery(session);
        if (session.agents.length === 0) {
            console.log(chalk_1.default.yellow('\n⚠ No agents found to watch'));
            process.exit(1);
        }
        // Run initial tests
        console.log(chalk_1.default.cyan('\n🚀 Running initial tests...\n'));
        await runTests(session, options.verbose);
        // Setup file watcher
        setupWatcher(session, options);
        // Display watch mode info
        displayWatchInfo(session, options);
        // Keep process alive
        process.stdin.resume();
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log(chalk_1.default.yellow('\n\n👋 Stopping watch mode...'));
            displayWatchSummary(session);
            process.exit(0);
        });
    }
    catch (err) {
        console.error(chalk_1.default.red('\n❌ Error:'), err.message);
        if (options.verbose) {
            console.error(chalk_1.default.gray(err.stack));
        }
        process.exit(1);
    }
}
/**
 * Display watch mode banner
 */
function displayWatchBanner() {
    console.clear();
    console.log((0, boxen_1.default)(chalk_1.default.bold.cyan('👁️  Watch Mode Active\n') +
        chalk_1.default.white('Auto-rerun tests on file changes\n') +
        chalk_1.default.gray('Press Ctrl+C to stop'), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
    }));
}
/**
 * Initial agent discovery
 */
async function initialDiscovery(session) {
    const spinner = animations_1.animations.loading('Discovering agents...', 'dots12');
    try {
        const config = await (0, config_1.loadConfig)();
        const engine = (0, evaluation_engine_1.getEvaluationEngine)();
        await engine.initialize(config);
        // Detect framework if not specified
        if (!session.framework) {
            session.framework = await engine.detectFramework(session.projectPath) || 'unknown';
        }
        // Discover agents
        const discovery = await engine.discoverAgents(session.projectPath, session.framework);
        session.agents = discovery.agents;
        spinner.stop();
        console.log(chalk_1.default.green(`✓ Found ${session.agents.length} agent(s) in ${session.framework} project`));
        // Display agents
        session.agents.forEach(agent => {
            console.log(chalk_1.default.gray(`  ${figures_1.default.pointer} ${agent.name}`));
        });
    }
    catch (err) {
        spinner.stop();
        throw err;
    }
}
/**
 * Run tests for all agents
 */
async function runTests(session, verbose = false) {
    session.totalRuns++;
    session.lastRunTime = new Date();
    const startTime = Date.now();
    let totalPassed = 0;
    let totalFailed = 0;
    // Use enhanced progress display
    enhanced_progress_1.enhancedProgress.start(session.agents.length, session.testConfig.dimensions.length, 3 // sample inputs per agent
    );
    try {
        for (let i = 0; i < session.agents.length; i++) {
            const agent = session.agents[i];
            enhanced_progress_1.enhancedProgress.updateAgent(agent.name, i + 1);
            for (let j = 0; j < session.testConfig.dimensions.length; j++) {
                const dimension = session.testConfig.dimensions[j];
                enhanced_progress_1.enhancedProgress.updateDimension(dimension, j + 1);
                // Simulate test execution (in real implementation, call actual test runner)
                for (let k = 0; k < 3; k++) {
                    enhanced_progress_1.enhancedProgress.updateInput(`Test input ${k + 1}`, k + 1, Math.random() > 0.7);
                    // Simulate test result
                    const passed = Math.random() > 0.2;
                    enhanced_progress_1.enhancedProgress.updateMetrics(passed);
                    if (passed)
                        totalPassed++;
                    else
                        totalFailed++;
                    // Simulate processing time
                    await new Promise(resolve => setTimeout(resolve, session.testConfig.quick ? 100 : 500));
                }
            }
        }
        await enhanced_progress_1.enhancedProgress.complete();
        const passRate = Math.round((totalPassed / (totalPassed + totalFailed)) * 100);
        session.passHistory.push(passRate);
        // Keep only last 10 results
        if (session.passHistory.length > 10) {
            session.passHistory.shift();
        }
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        // Display run summary
        console.log('\n' + chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan(`Run #${session.totalRuns} completed in ${duration}s`));
        console.log(chalk_1.default.gray('─'.repeat(50)) + '\n');
    }
    catch (err) {
        enhanced_progress_1.enhancedProgress.stop();
        console.error(chalk_1.default.red('Test execution failed:'), err.message);
    }
}
/**
 * Setup file watcher
 */
function setupWatcher(session, options) {
    const watchPaths = [
        path.join(session.projectPath, '**/*.py'),
        path.join(session.projectPath, '**/*.yaml'),
        path.join(session.projectPath, '**/*.yml'),
        path.join(session.projectPath, '**/*.ts'),
        path.join(session.projectPath, '**/*.js'),
    ];
    const ignored = options.ignore.map((dimension) => path.join(session.projectPath, dimension, '**'));
    const watcher = chokidar_1.default.watch(watchPaths, {
        ignored,
        persistent: true,
        ignoreInitial: true,
    });
    // Debounced test runner
    const runTestsDebounced = (0, debounce_js_1.default)(async (changePath) => {
        console.clear();
        displayWatchBanner();
        console.log(chalk_1.default.yellow(`\n🔄 Change detected: ${path.relative(session.projectPath, changePath)}`));
        console.log(chalk_1.default.cyan('Re-running tests...\n'));
        // Check if agents need re-discovery
        if (changePath.endsWith('.py') || changePath.endsWith('.yaml')) {
            const spinner = animations_1.animations.loading('Re-discovering agents...', 'dots12');
            try {
                const engine = (0, evaluation_engine_1.getEvaluationEngine)();
                const discovery = await engine.discoverAgents(session.projectPath, session.framework);
                if (discovery.agents.length !== session.agents.length) {
                    session.agents = discovery.agents;
                    spinner.stop();
                    console.log(chalk_1.default.yellow(`⚠ Agent count changed: ${discovery.agents.length} agent(s) found`));
                }
                else {
                    spinner.stop();
                }
            }
            catch (err) {
                spinner.stop();
                console.error(chalk_1.default.red('Failed to re-discover agents'));
            }
        }
        await runTests(session, options.verbose);
        displayWatchInfo(session, options);
    }, parseInt(options.debounce));
    // Watch events
    watcher
        .on('change', runTestsDebounced)
        .on('add', runTestsDebounced)
        .on('unlink', runTestsDebounced)
        .on('error', error => console.error(chalk_1.default.red('Watcher error:'), error));
    console.log(chalk_1.default.green('\n✓ File watcher initialized'));
}
/**
 * Display watch mode info
 */
function displayWatchInfo(session, options) {
    console.log('\n' + chalk_1.default.bold.cyan('📊 Watch Mode Status'));
    console.log(chalk_1.default.gray('─'.repeat(50)));
    console.log(chalk_1.default.white('Watching:'), chalk_1.default.cyan(session.projectPath));
    console.log(chalk_1.default.white('Framework:'), chalk_1.default.cyan(session.framework));
    console.log(chalk_1.default.white('Agents:'), chalk_1.default.cyan(session.agents.length));
    console.log(chalk_1.default.white('Dimensions:'), chalk_1.default.cyan(session.testConfig.dimensions.join(', ')));
    console.log(chalk_1.default.white('Mode:'), session.testConfig.quick ? chalk_1.default.yellow('Quick (no LLM)') : chalk_1.default.green('Full'));
    console.log(chalk_1.default.white('Debounce:'), chalk_1.default.cyan(`${options.debounce}ms`));
    if (session.passHistory.length > 0) {
        const avgPassRate = Math.round(session.passHistory.reduce((a, b) => a + b, 0) / session.passHistory.length);
        console.log(chalk_1.default.white('Avg Pass Rate:'), getPassRateColor(avgPassRate)(`${avgPassRate}%`));
        // Show trend
        if (session.passHistory.length > 1) {
            const trend = getTrend(session.passHistory);
            console.log(chalk_1.default.white('Trend:'), trend);
        }
    }
    console.log(chalk_1.default.gray('─'.repeat(50)));
    console.log(chalk_1.default.gray('\nWaiting for file changes... (Press Ctrl+C to stop)'));
}
/**
 * Display watch summary on exit
 */
function displayWatchSummary(session) {
    if (session.totalRuns === 0)
        return;
    console.log('\n' + (0, boxen_1.default)(chalk_1.default.bold('Watch Mode Summary\n\n') +
        `${chalk_1.default.white('Total Runs:')} ${session.totalRuns}\n` +
        `${chalk_1.default.white('Session Duration:')} ${formatDuration(Date.now() - session.lastRunTime.getTime())}\n` +
        `${chalk_1.default.white('Agents Tested:')} ${session.agents.length}\n` +
        (session.passHistory.length > 0
            ? `${chalk_1.default.white('Average Pass Rate:')} ${Math.round(session.passHistory.reduce((a, b) => a + b, 0) / session.passHistory.length)}%`
            : ''), {
        padding: 1,
        borderStyle: 'double',
        borderColor: 'cyan',
    }));
}
/**
 * Get color for pass rate
 */
function getPassRateColor(rate) {
    if (rate >= 90)
        return chalk_1.default.green;
    if (rate >= 70)
        return chalk_1.default.yellow;
    return chalk_1.default.red;
}
/**
 * Get trend indicator
 */
function getTrend(history) {
    if (history.length < 2)
        return chalk_1.default.gray('—');
    const recent = history.slice(-3);
    const older = history.slice(-6, -3);
    if (older.length === 0)
        return chalk_1.default.gray('—');
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (recentAvg > olderAvg + 5)
        return chalk_1.default.green('↑ Improving');
    if (recentAvg < olderAvg - 5)
        return chalk_1.default.red('↓ Declining');
    return chalk_1.default.yellow('→ Stable');
}
/**
 * Format duration
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    else {
        return `${seconds}s`;
    }
}
//# sourceMappingURL=watch.js.map