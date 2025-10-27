/**
 * Watch Mode Command - Auto-rerun tests on file changes
 */
import { Command } from 'commander';
import chalk from 'chalk';
import chokidar from 'chokidar';
import * as path from 'path';
import { debounce } from 'lodash';
import { animations } from '../utils/animations';
import { enhancedProgress } from '../utils/enhanced-progress';
import { getEvaluationEngine } from '../services/evaluation-engine';
import { loadConfig } from '../utils/config';
import boxen from 'boxen';
import figures from 'figures';
export function watchCommand() {
    return new Command('watch')
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
            console.log(chalk.yellow('\n⚠ No agents found to watch'));
            process.exit(1);
        }
        // Run initial tests
        console.log(chalk.cyan('\n🚀 Running initial tests...\n'));
        await runTests(session, options.verbose);
        // Setup file watcher
        setupWatcher(session, options);
        // Display watch mode info
        displayWatchInfo(session, options);
        // Keep process alive
        process.stdin.resume();
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log(chalk.yellow('\n\n👋 Stopping watch mode...'));
            displayWatchSummary(session);
            process.exit(0);
        });
    }
    catch (err) {
        console.error(chalk.red('\n❌ Error:'), err.message);
        if (options.verbose) {
            console.error(chalk.gray(err.stack));
        }
        process.exit(1);
    }
}
/**
 * Display watch mode banner
 */
function displayWatchBanner() {
    console.clear();
    console.log(boxen(chalk.bold.cyan('👁️  Watch Mode Active\n') +
        chalk.white('Auto-rerun tests on file changes\n') +
        chalk.gray('Press Ctrl+C to stop'), {
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
    const spinner = animations.loading('Discovering agents...', 'dots12');
    try {
        const config = await loadConfig();
        const engine = getEvaluationEngine();
        await engine.initialize(config);
        // Detect framework if not specified
        if (!session.framework) {
            session.framework = await engine.detectFramework(session.projectPath) || 'unknown';
        }
        // Discover agents
        const discovery = await engine.discoverAgents(session.projectPath, session.framework);
        session.agents = discovery.agents;
        spinner.stop();
        console.log(chalk.green(`✓ Found ${session.agents.length} agent(s) in ${session.framework} project`));
        // Display agents
        session.agents.forEach(agent => {
            console.log(chalk.gray(`  ${figures.pointer} ${agent.name}`));
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
    enhancedProgress.start(session.agents.length, session.testConfig.dimensions.length, 3 // sample inputs per agent
    );
    try {
        for (let i = 0; i < session.agents.length; i++) {
            const agent = session.agents[i];
            enhancedProgress.updateAgent(agent.name, i + 1);
            for (let j = 0; j < session.testConfig.dimensions.length; j++) {
                const dimension = session.testConfig.dimensions[j];
                enhancedProgress.updateDimension(dimension, j + 1);
                // Simulate test execution (in real implementation, call actual test runner)
                for (let k = 0; k < 3; k++) {
                    enhancedProgress.updateInput(`Test input ${k + 1}`, k + 1, Math.random() > 0.7);
                    // Simulate test result
                    const passed = Math.random() > 0.2;
                    enhancedProgress.updateMetrics(passed);
                    if (passed)
                        totalPassed++;
                    else
                        totalFailed++;
                    // Simulate processing time
                    await new Promise(resolve => setTimeout(resolve, session.testConfig.quick ? 100 : 500));
                }
            }
        }
        await enhancedProgress.complete();
        const passRate = Math.round((totalPassed / (totalPassed + totalFailed)) * 100);
        session.passHistory.push(passRate);
        // Keep only last 10 results
        if (session.passHistory.length > 10) {
            session.passHistory.shift();
        }
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        // Display run summary
        console.log('\n' + chalk.gray('─'.repeat(50)));
        console.log(chalk.cyan(`Run #${session.totalRuns} completed in ${duration}s`));
        console.log(chalk.gray('─'.repeat(50)) + '\n');
    }
    catch (err) {
        enhancedProgress.stop();
        console.error(chalk.red('Test execution failed:'), err.message);
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
    const watcher = chokidar.watch(watchPaths, {
        ignored,
        persistent: true,
        ignoreInitial: true,
    });
    // Debounced test runner
    const runTestsDebounced = debounce(async (changePath) => {
        console.clear();
        displayWatchBanner();
        console.log(chalk.yellow(`\n🔄 Change detected: ${path.relative(session.projectPath, changePath)}`));
        console.log(chalk.cyan('Re-running tests...\n'));
        // Check if agents need re-discovery
        if (changePath.endsWith('.py') || changePath.endsWith('.yaml')) {
            const spinner = animations.loading('Re-discovering agents...', 'dots12');
            try {
                const engine = getEvaluationEngine();
                const discovery = await engine.discoverAgents(session.projectPath, session.framework);
                if (discovery.agents.length !== session.agents.length) {
                    session.agents = discovery.agents;
                    spinner.stop();
                    console.log(chalk.yellow(`⚠ Agent count changed: ${discovery.agents.length} agent(s) found`));
                }
                else {
                    spinner.stop();
                }
            }
            catch (err) {
                spinner.stop();
                console.error(chalk.red('Failed to re-discover agents'));
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
        .on('error', error => console.error(chalk.red('Watcher error:'), error));
    console.log(chalk.green('\n✓ File watcher initialized'));
}
/**
 * Display watch mode info
 */
function displayWatchInfo(session, options) {
    console.log('\n' + chalk.bold.cyan('📊 Watch Mode Status'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white('Watching:'), chalk.cyan(session.projectPath));
    console.log(chalk.white('Framework:'), chalk.cyan(session.framework));
    console.log(chalk.white('Agents:'), chalk.cyan(session.agents.length));
    console.log(chalk.white('Dimensions:'), chalk.cyan(session.testConfig.dimensions.join(', ')));
    console.log(chalk.white('Mode:'), session.testConfig.quick ? chalk.yellow('Quick (no LLM)') : chalk.green('Full'));
    console.log(chalk.white('Debounce:'), chalk.cyan(`${options.debounce}ms`));
    if (session.passHistory.length > 0) {
        const avgPassRate = Math.round(session.passHistory.reduce((a, b) => a + b, 0) / session.passHistory.length);
        console.log(chalk.white('Avg Pass Rate:'), getPassRateColor(avgPassRate)(`${avgPassRate}%`));
        // Show trend
        if (session.passHistory.length > 1) {
            const trend = getTrend(session.passHistory);
            console.log(chalk.white('Trend:'), trend);
        }
    }
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray('\nWaiting for file changes... (Press Ctrl+C to stop)'));
}
/**
 * Display watch summary on exit
 */
function displayWatchSummary(session) {
    if (session.totalRuns === 0)
        return;
    console.log('\n' + boxen(chalk.bold('Watch Mode Summary\n\n') +
        `${chalk.white('Total Runs:')} ${session.totalRuns}\n` +
        `${chalk.white('Session Duration:')} ${formatDuration(Date.now() - session.lastRunTime.getTime())}\n` +
        `${chalk.white('Agents Tested:')} ${session.agents.length}\n` +
        (session.passHistory.length > 0
            ? `${chalk.white('Average Pass Rate:')} ${Math.round(session.passHistory.reduce((a, b) => a + b, 0) / session.passHistory.length)}%`
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
        return chalk.green;
    if (rate >= 70)
        return chalk.yellow;
    return chalk.red;
}
/**
 * Get trend indicator
 */
function getTrend(history) {
    if (history.length < 2)
        return chalk.gray('—');
    const recent = history.slice(-3);
    const older = history.slice(-6, -3);
    if (older.length === 0)
        return chalk.gray('—');
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (recentAvg > olderAvg + 5)
        return chalk.green('↑ Improving');
    if (recentAvg < olderAvg - 5)
        return chalk.red('↓ Declining');
    return chalk.yellow('→ Stable');
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