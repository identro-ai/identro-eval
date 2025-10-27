/**
 * Terminal Report Formatter - Modern Terminal UI
 *
 * Creates beautiful terminal displays for test results with modern aesthetics
 * Now supports dynamic dimensions via DimensionMetadataService
 */
import chalk from 'chalk';
import Table from 'cli-table3';
import boxen from 'boxen';
import gradient from 'gradient-string';
// Global dimension metadata service (should be initialized before use)
let dimensionMetadataService = null;
const dimensionInfoCache = new Map();
/**
 * Initialize dimension metadata service for dynamic dimension support
 */
export function initializeDimensionMetadata(service) {
    dimensionMetadataService = service;
}
// Modern color palette
const colors = {
    primary: '#0070f3',
    success: '#00ff88',
    error: '#ff0080',
    warning: '#ffaa00',
    info: '#00d4ff',
    muted: '#666666',
    text: '#ffffff',
    background: '#000000'
};
// Unicode symbols for modern look
const symbols = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
    robot: '🤖',
    team: '👥',
    chart: '📊',
    lightning: '⚡',
    shield: '🛡️',
    cycle: '🔄',
    target: '🎯',
    dashboard: '📈',
    details: '📋',
    export: '💾',
    compare: '🔄',
    rerun: '🔁',
    quit: '🚪'
};
/**
 * Display beautiful terminal summary after test completion
 * Now uses TestStateManager directly - same source as split-pane display
 */
export async function displayTerminalSummary(results, testStateManager) {
    console.clear();
    // If we have access to TestStateManager, use it directly (same as split-pane)
    let totalTests = 0;
    let totalRuns = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalLatency = 0;
    let fastestTest = Infinity;
    let slowestTest = 0;
    if (testStateManager) {
        // Use TestStateManager data directly - same as split-pane display
        const allTests = testStateManager.getAllTests();
        const completedTests = allTests.filter((test) => test.status === 'completed' || test.status === 'failed');
        // Count PARENT tests only (not individual runs) - same logic as split-pane
        const parentTests = completedTests.filter((test) => !test.id.includes('-run'));
        totalTests = parentTests.length;
        totalPassed = parentTests.filter((test) => test.status === 'completed').length;
        totalFailed = parentTests.filter((test) => test.status === 'failed').length;
        // Count all runs for run statistics
        totalRuns = completedTests.length;
        // Calculate latency from all runs
        for (const test of completedTests) {
            if (test.latencyMs) {
                totalLatency += test.latencyMs;
                fastestTest = Math.min(fastestTest, test.latencyMs);
                slowestTest = Math.max(slowestTest, test.latencyMs);
            }
        }
        if (completedTests.length > 0) {
            totalLatency = totalLatency / completedTests.length;
        }
    }
    else {
        // Fallback to results data if TestStateManager not available
        for (const [_, result] of results) {
            totalTests += result.summary.totalTests;
            totalPassed += result.summary.passed;
            totalFailed += result.summary.failed;
            totalLatency += result.summary.averageLatencyMs || 0;
            const allRuns = result.tests || [];
            totalRuns += allRuns.length;
            for (const test of allRuns) {
                if (test.latencyMs) {
                    fastestTest = Math.min(fastestTest, test.latencyMs);
                    slowestTest = Math.max(slowestTest, test.latencyMs);
                }
            }
        }
        if (results.size > 0) {
            totalLatency = totalLatency / results.size;
        }
    }
    const avgLatency = results.size > 0 ? Math.round(totalLatency / results.size) : 0;
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';
    // Header with gradient
    const headerText = gradient('#0070f3', '#00ff88')('✨ EVALUATION COMPLETE ✨');
    console.log();
    console.log('━'.repeat(80));
    console.log();
    console.log(headerText.padStart(50));
    console.log();
    console.log('━'.repeat(80));
    console.log();
    // Main metrics table
    const metricsTable = new Table({
        head: [
            chalk.bold('TOTAL TESTS'),
            chalk.bold('PASSED'),
            chalk.bold('FAILED'),
            chalk.bold('SUCCESS RATE')
        ],
        style: {
            head: ['cyan'],
            border: ['gray'],
            'padding-left': 2,
            'padding-right': 2
        },
        colWidths: [15, 15, 15, 15]
    });
    metricsTable.push([
        chalk.white.bold(`${totalTests} tests`),
        chalk.green(`${totalPassed} ${symbols.success}`),
        totalFailed > 0 ? chalk.red(`${totalFailed} ${symbols.error}`) : chalk.gray('0'),
        parseFloat(successRate) >= 90 ? chalk.green.bold(`${successRate}%`) :
            parseFloat(successRate) >= 70 ? chalk.yellow.bold(`${successRate}%`) :
                chalk.red.bold(`${successRate}%`)
    ]);
    // Add runs information
    if (totalRuns > totalTests) {
        metricsTable.push([
            chalk.gray(`${totalRuns} runs`),
            chalk.gray('(individual executions)'),
            chalk.gray(''),
            chalk.gray('')
        ]);
    }
    console.log(metricsTable.toString());
    console.log();
    // Performance highlights
    console.log(chalk.cyan.bold(`  ${symbols.lightning} Performance Highlights`));
    console.log(chalk.gray(`  ├─ Average Latency: ${chalk.white.bold(avgLatency + 'ms')}`));
    if (fastestTest !== Infinity) {
        console.log(chalk.gray(`  ├─ Fastest Test: ${chalk.green.bold(Math.round(fastestTest) + 'ms')}`));
    }
    if (slowestTest > 0) {
        console.log(chalk.gray(`  └─ Slowest Test: ${chalk.yellow.bold(Math.round(slowestTest) + 'ms')}`));
    }
    console.log();
    // Separate tables for agents and teams - use TestStateManager data if available
    if (results.size > 0 && testStateManager) {
        // Use TestStateManager data directly for accurate agent counts
        const allTests = testStateManager.getAllTests();
        const completedTests = allTests.filter((test) => test.status === 'completed' || test.status === 'failed');
        // Group by agent and count parent tests only
        const agentStats = new Map();
        for (const test of completedTests) {
            if (test.id.includes('-run'))
                continue; // Skip individual runs, count parent tests only
            const agentName = test.agentName;
            // Enhanced team detection
            const isTeam = test.id.startsWith('team-') ||
                (test.metadata && test.metadata.isTeamTest) ||
                agentName.includes('_crew') ||
                agentName.includes('_team') ||
                agentName.endsWith('_crew') ||
                agentName.endsWith('_team');
            if (!agentStats.has(agentName)) {
                agentStats.set(agentName, { tests: 0, passed: 0, failed: 0, isTeam: isTeam });
            }
            const stats = agentStats.get(agentName);
            stats.tests++;
            if (test.status === 'completed') {
                stats.passed++;
            }
            else {
                stats.failed++;
            }
        }
        // Separate agents and teams
        const agents = new Map();
        const teams = new Map();
        for (const [entityName, stats] of agentStats) {
            if (stats.isTeam) {
                teams.set(entityName, stats);
            }
            else {
                agents.set(entityName, stats);
            }
        }
        // Display agents table if we have agents
        if (agents.size > 0) {
            console.log(chalk.cyan.bold(`  ${symbols.robot} Individual Agents Performance`));
            const agentTable = new Table({
                head: [
                    chalk.bold('AGENT'),
                    chalk.bold('TESTS'),
                    chalk.bold('PASSED'),
                    chalk.bold('FAILED'),
                    chalk.bold('SCORE')
                ],
                style: {
                    head: ['cyan'],
                    border: ['gray'],
                    'padding-left': 1,
                    'padding-right': 1
                },
                colWidths: [25, 8, 8, 8, 12]
            });
            for (const [entityName, stats] of agents) {
                const entitySuccessRate = stats.tests > 0 ? (stats.passed / stats.tests) : 0;
                // Create visual progress bar
                const barLength = 8;
                const filledBars = Math.round(entitySuccessRate * barLength);
                const progressBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);
                agentTable.push([
                    `${symbols.robot} ${chalk.white(entityName)}`,
                    chalk.white(stats.tests.toString()),
                    stats.passed > 0 ? chalk.green(`${stats.passed} ${symbols.success}`) : chalk.gray('0'),
                    stats.failed > 0 ? chalk.red(`${stats.failed} ${symbols.error}`) : chalk.gray('0'),
                    entitySuccessRate >= 0.9 ? chalk.green(progressBar) :
                        entitySuccessRate >= 0.7 ? chalk.yellow(progressBar) :
                            chalk.red(progressBar)
                ]);
            }
            console.log(agentTable.toString());
            console.log();
        }
        // Display teams table if we have teams
        if (teams.size > 0) {
            console.log(chalk.cyan.bold(`  ${symbols.team} Teams Performance`));
            const teamTable = new Table({
                head: [
                    chalk.bold('TEAM'),
                    chalk.bold('TESTS'),
                    chalk.bold('PASSED'),
                    chalk.bold('FAILED'),
                    chalk.bold('SCORE')
                ],
                style: {
                    head: ['cyan'],
                    border: ['gray'],
                    'padding-left': 1,
                    'padding-right': 1
                },
                colWidths: [25, 8, 8, 8, 12]
            });
            for (const [entityName, stats] of teams) {
                const entitySuccessRate = stats.tests > 0 ? (stats.passed / stats.tests) : 0;
                // Create visual progress bar
                const barLength = 8;
                const filledBars = Math.round(entitySuccessRate * barLength);
                const progressBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);
                teamTable.push([
                    `${symbols.team} ${chalk.white(entityName)}`,
                    chalk.white(stats.tests.toString()),
                    stats.passed > 0 ? chalk.green(`${stats.passed} ${symbols.success}`) : chalk.gray('0'),
                    stats.failed > 0 ? chalk.red(`${stats.failed} ${symbols.error}`) : chalk.gray('0'),
                    entitySuccessRate >= 0.9 ? chalk.green(progressBar) :
                        entitySuccessRate >= 0.7 ? chalk.yellow(progressBar) :
                            chalk.red(progressBar)
                ]);
            }
            console.log(teamTable.toString());
            console.log();
        }
    }
    else if (results.size > 0) {
        // Fallback to results data if TestStateManager not available
        console.log(chalk.cyan.bold(`  ${symbols.chart} Agent & Team Performance Matrix`));
        const agentTable = new Table({
            head: [
                chalk.bold('ENTITY'),
                chalk.bold('TYPE'),
                chalk.bold('TESTS'),
                chalk.bold('PASSED'),
                chalk.bold('FAILED'),
                chalk.bold('SCORE')
            ],
            style: {
                head: ['cyan'],
                border: ['gray'],
                'padding-left': 1,
                'padding-right': 1
            },
            colWidths: [20, 8, 8, 8, 8, 12]
        });
        for (const [entityName, result] of results) {
            const entitySuccessRate = result.summary.totalTests > 0 ?
                (result.summary.passed / result.summary.totalTests) : 0;
            // Enhanced team detection for fallback
            const isTeam = entityName.includes('_crew') || entityName.includes('_team');
            const entityIcon = isTeam ? symbols.team : symbols.robot;
            const entityType = isTeam ? chalk.yellow('Team') : chalk.blue('Agent');
            // Create visual progress bar
            const barLength = 8;
            const filledBars = Math.round(entitySuccessRate * barLength);
            const progressBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);
            agentTable.push([
                `${entityIcon} ${chalk.white(entityName)}`,
                entityType,
                chalk.white(result.summary.totalTests.toString()),
                result.summary.passed > 0 ? chalk.green(`${result.summary.passed} ${symbols.success}`) : chalk.gray('0'),
                result.summary.failed > 0 ? chalk.red(`${result.summary.failed} ${symbols.error}`) : chalk.gray('0'),
                entitySuccessRate >= 0.9 ? chalk.green(progressBar) :
                    entitySuccessRate >= 0.7 ? chalk.yellow(progressBar) :
                        chalk.red(progressBar)
            ]);
        }
        console.log(agentTable.toString());
        console.log();
    }
    // Dimension analysis (if available) - now supports all 12 dimensions dynamically
    const dimensionResults = new Map();
    if (testStateManager) {
        // Use TestStateManager data for accurate dimension analysis
        const allTests = testStateManager.getAllTests();
        const completedTests = allTests.filter((test) => test.status === 'completed' || test.status === 'failed');
        // Count parent tests only for dimension statistics
        const parentTests = completedTests.filter((test) => !test.id.includes('-run'));
        for (const test of parentTests) {
            const dimension = test.dimension;
            if (!dimension)
                continue;
            const metadata = getDimensionMetadata(dimension);
            const existing = dimensionResults.get(dimension) || { passed: 0, total: 0, category: metadata.category };
            dimensionResults.set(dimension, {
                passed: existing.passed + (test.status === 'completed' ? 1 : 0),
                total: existing.total + 1,
                category: metadata.category
            });
        }
    }
    else {
        // Fallback to results data
        for (const [_, result] of results) {
            if (result.dimensions) {
                for (const dimension of Object.keys(result.dimensions)) {
                    const metadata = getDimensionMetadata(dimension);
                    const existing = dimensionResults.get(dimension) || { passed: 0, total: 0, category: metadata.category };
                    const dimensionPassed = result.summary.passed > 0 ? 1 : 0;
                    dimensionResults.set(dimension, {
                        passed: existing.passed + dimensionPassed,
                        total: existing.total + 1,
                        category: metadata.category
                    });
                }
            }
        }
    }
    if (dimensionResults.size > 0) {
        // Group dimensions by category
        const categoryGroups = new Map();
        for (const [dimension, data] of dimensionResults) {
            const category = data.category;
            if (!categoryGroups.has(category)) {
                categoryGroups.set(category, []);
            }
            categoryGroups.get(category).push([dimension, data]);
        }
        // Display dimensions grouped by category
        console.log(chalk.cyan.bold(`  ${symbols.target} Dimension Analysis by Category`));
        console.log();
        // Display in category order: Core → Quality → Enterprise → Other
        const categoryOrder = ['Core', 'Quality', 'Enterprise', 'Other'];
        for (const category of categoryOrder) {
            const dimensions = categoryGroups.get(category);
            if (!dimensions || dimensions.length === 0)
                continue;
            const metadata = getDimensionMetadata(dimensions[0][0]);
            console.log(chalk.white.bold(`  ${metadata.categoryIcon} ${category} Dimensions`));
            const dimensionTable = new Table({
                head: [chalk.bold('DIMENSION'), chalk.bold('PROGRESS')],
                style: {
                    head: ['cyan'],
                    border: ['gray'],
                    'padding-left': 1,
                    'padding-right': 1
                },
                colWidths: [25, 50]
            });
            for (const [dimension, data] of dimensions) {
                const rate = data.total > 0 ? (data.passed / data.total) : 0;
                const percentage = Math.round(rate * 100);
                // Create visual progress bar
                const barLength = 35;
                const filledBars = Math.round(rate * barLength);
                const progressBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);
                const coloredBar = rate >= 0.9 ? chalk.green(progressBar) :
                    rate >= 0.7 ? chalk.yellow(progressBar) :
                        chalk.red(progressBar);
                const dimensionMetadata = getDimensionMetadata(dimension);
                dimensionTable.push([
                    `${getDimensionIcon(dimension)} ${chalk.white(dimensionMetadata.displayName)} (${data.total})`,
                    `${coloredBar} ${chalk.white.bold(percentage + '%')}`
                ]);
            }
            console.log(dimensionTable.toString());
            console.log();
        }
    }
    // Issues detected
    const issues = collectIssues(results);
    if (issues.length > 0) {
        console.log(chalk.yellow.bold(`  ${symbols.warning} Issues Detected (${issues.length})`));
        for (const issue of issues.slice(0, 3)) { // Show max 3 issues
            console.log(chalk.gray(`  └─ ${issue}`));
        }
        if (issues.length > 3) {
            console.log(chalk.gray(`  └─ ... and ${issues.length - 3} more (view details for full list)`));
        }
        console.log();
    }
    console.log('━'.repeat(80));
}
/**
 * Display interactive menu for post-test actions
 */
export async function showInteractiveMenu(reportPath) {
    console.log(chalk.cyan(`  ${symbols.dashboard} Report generated and saved to: ${chalk.white.bold(reportPath.split('/').slice(-3).join('/'))}`));
    console.log();
    console.log(chalk.white.bold('  What would you like to do next?'));
    console.log();
    const menuBox = boxen(chalk.white(`
  [D] ${symbols.dashboard} Open Dashboard     View rich HTML report in your browser
  [T] ${symbols.details} Test Details       Show detailed test results in terminal
  [E] ${symbols.export} Export Report      Save report in different formats
  [C] ${symbols.compare} Compare Results    Compare with previous test runs
  [R] ${symbols.rerun} Re-run Failed      Re-run only the failed tests
  [Q] ${symbols.quit} Quit               Exit to terminal
    `), {
        padding: 1,
        margin: { left: 2 },
        borderStyle: 'round',
        borderColor: 'cyan',
        backgroundColor: 'black'
    });
    console.log(menuBox);
    console.log();
    console.log(chalk.gray('  Press a key to continue...'));
    // Wait for user input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    return new Promise((resolve) => {
        const onKeypress = (chunk) => {
            const key = chunk.toString().toLowerCase();
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', onKeypress);
            switch (key) {
                case 'd':
                    resolve('dashboard');
                    break;
                case 't':
                    resolve('details');
                    break;
                case 'e':
                    resolve('export');
                    break;
                case 'c':
                    resolve('compare');
                    break;
                case 'r':
                    resolve('rerun');
                    break;
                case 'q':
                case '\u0003': // Ctrl+C
                    resolve('quit');
                    break;
                default:
                    resolve('quit');
            }
        };
        process.stdin.on('data', onKeypress);
    });
}
/**
 * Display criterion-level evaluation results
 */
function displayCriterionResults(test, indent = '  │  ') {
    // Check if we have LLM evaluation data with criterion analysis
    const evaluation = test.llmEvaluation || test.evaluation;
    if (!evaluation || !evaluation.reasoning?.criterionAnalysis) {
        return;
    }
    const criterionAnalysis = evaluation.reasoning.criterionAnalysis;
    const passedPercentage = evaluation.reasoning.passedPercentage || 0;
    const passingThreshold = evaluation.reasoning.passingThreshold || 100;
    console.log(chalk.gray(`${indent}`));
    console.log(chalk.white.bold(`${indent}Evaluation Criteria (${passedPercentage.toFixed(0)}% passed, ${passingThreshold}% required):`));
    for (let i = 0; i < criterionAnalysis.length; i++) {
        const criterion = criterionAnalysis[i];
        const isLast = i === criterionAnalysis.length - 1;
        const prefix = isLast ? '└─' : '├─';
        // Status icon and criterion text
        const statusIcon = criterion.met ? chalk.green(symbols.success) : chalk.red(symbols.error);
        const statusText = criterion.met ? chalk.green('PASSED') : chalk.red('FAILED');
        const scoreText = chalk.white(`(${(criterion.score * 100).toFixed(0)}%)`);
        console.log(chalk.gray(`${indent}${prefix} ${statusIcon} ${statusText} ${scoreText}`));
        console.log(chalk.gray(`${indent}${isLast ? '  ' : '│ '} ${chalk.white(criterion.criterion)}`));
        // Show strictness if available (from original criterion or default)
        const strictness = criterion.strictness || criterion.evaluation_strictness || 85;
        console.log(chalk.gray(`${indent}${isLast ? '  ' : '│ '} Strictness: ${chalk.cyan(strictness + '/100')}`));
        // Show evidence (truncate if too long)
        if (criterion.evidence) {
            const evidence = criterion.evidence.length > 100
                ? criterion.evidence.substring(0, 100) + '...'
                : criterion.evidence;
            console.log(chalk.gray(`${indent}${isLast ? '  ' : '│ '} ${chalk.italic(evidence)}`));
        }
        // Show reasoning if different from evidence
        if (criterion.reasoning && criterion.reasoning !== criterion.evidence) {
            const reasoning = criterion.reasoning.length > 80
                ? criterion.reasoning.substring(0, 80) + '...'
                : criterion.reasoning;
            console.log(chalk.gray(`${indent}${isLast ? '  ' : '│ '} ${chalk.dim(reasoning)}`));
        }
        if (!isLast) {
            console.log(chalk.gray(`${indent}│`));
        }
    }
}
/**
 * Display detailed test results in terminal
 */
export async function displayDetailedResults(results, testStateManager) {
    console.clear();
    console.log();
    console.log('━'.repeat(80));
    console.log();
    console.log(gradient('#0070f3', '#00ff88')('📋 DETAILED TEST RESULTS').padStart(50));
    console.log();
    console.log('━'.repeat(80));
    console.log();
    // Use TestStateManager data if available for more accurate results
    if (testStateManager) {
        const allTests = testStateManager.getAllTests();
        const completedTests = allTests.filter((test) => test.status === 'completed' || test.status === 'failed');
        // Group by entity (agent/team)
        const entityData = new Map();
        for (const test of completedTests) {
            const entityName = test.agentName;
            // Enhanced team detection - check multiple indicators
            const isTeam = test.id.startsWith('team-') ||
                (test.metadata && test.metadata.isTeamTest) ||
                entityName.includes('_crew') ||
                entityName.includes('_team') ||
                entityName.endsWith('_crew') ||
                entityName.endsWith('_team');
            if (!entityData.has(entityName)) {
                entityData.set(entityName, {
                    tests: [],
                    dimensions: new Set(),
                    isTeam: isTeam
                });
            }
            const entity = entityData.get(entityName);
            entity.tests.push(test);
            entity.dimensions.add(test.dimension);
        }
        // Display each entity - ONLY show parent tests, not individual runs
        for (const [entityName, entityInfo] of entityData) {
            // Filter to only parent tests (not individual runs)
            const parentTests = entityInfo.tests.filter(t => !t.id.includes('-run'));
            const passedTests = parentTests.filter(t => t.status === 'completed').length;
            const totalTests = parentTests.length;
            const entitySuccessRate = `[${passedTests}/${totalTests} ${passedTests < totalTests ? symbols.warning : symbols.success}]`;
            const entityIcon = entityInfo.isTeam ? symbols.team : symbols.robot;
            const entityLabel = entityInfo.isTeam ? chalk.yellow('(Team)') : chalk.blue('(Agent)');
            console.log(chalk.cyan.bold(`${entityIcon} ${entityName} ${entityLabel}`) + chalk.gray(entitySuccessRate.padStart(80 - entityName.length - 15)));
            console.log('━'.repeat(80));
            console.log();
            // Group PARENT tests by dimension
            for (const dimension of entityInfo.dimensions) {
                const dimensionParentTests = parentTests.filter(t => t.dimension === dimension);
                const dimensionPassed = dimensionParentTests.filter(t => t.status === 'completed').length;
                const dimensionStatus = `[${dimensionPassed}/${dimensionParentTests.length} ${dimensionPassed === dimensionParentTests.length ? symbols.success : symbols.warning}]`;
                console.log(chalk.white.bold(`  ${getDimensionIcon(dimension)} ${dimension ? (dimension.charAt(0).toUpperCase() + dimension.slice(1)) : 'Unknown'} Tests`) +
                    chalk.gray(dimensionStatus.padStart(50)));
                for (let j = 0; j < Math.min(dimensionParentTests.length, 5); j++) { // Show max 5 parent tests per dimension
                    const test = dimensionParentTests[j];
                    const status = test.status === 'completed' ? chalk.green(symbols.success) : chalk.red(symbols.error);
                    const latency = test.latencyMs ? chalk.gray(`${Math.round(test.latencyMs)}ms`) : '';
                    // Show parent test with multi-run info if applicable
                    const testLabel = test.isMultiRun ? `Parent Test ${j + 1} (${test.totalRuns || 3} runs)` : `Test ${j + 1}`;
                    console.log(chalk.gray(`  ├─ ${status} ${testLabel}`) + latency.padStart(60));
                    // Display criterion-level results if available
                    displayCriterionResults(test, '  │  ');
                    if (test.status === 'failed' && test.error && (!test.llmEvaluation || !test.llmEvaluation.reasoning?.criterionAnalysis)) {
                        console.log(chalk.gray(`  │  └─ Error: ${chalk.red(test.error.substring(0, 60))}${test.error.length > 60 ? '...' : ''}`));
                    }
                }
                if (dimensionParentTests.length > 5) {
                    console.log(chalk.gray(`  └─ ... and ${dimensionParentTests.length - 5} more tests`));
                }
                console.log();
            }
            console.log();
        }
    }
    else {
        // Fallback to original results-based display
        for (const [entityName, result] of results) {
            const entitySuccessRate = `[${result.summary.passed}/${result.summary.totalTests} ${result.summary.failed > 0 ? symbols.warning : symbols.success}]`;
            // Enhanced team detection
            const isTeam = entityName.includes('_crew') || entityName.includes('_team') || entityName.includes('team');
            const entityIcon = isTeam ? symbols.team : symbols.robot;
            const entityLabel = isTeam ? chalk.yellow('(Team)') : chalk.blue('(Agent)');
            console.log(chalk.cyan.bold(`${entityIcon} ${entityName} ${entityLabel}`) + chalk.gray(entitySuccessRate.padStart(80 - entityName.length - 15)));
            console.log('━'.repeat(80));
            console.log();
            // Dynamically extract dimensions from result.dimensions if available
            const availableDimensions = result.dimensions ? Object.keys(result.dimensions) : [];
            if (availableDimensions.length > 0) {
                // Group tests by actual dimensions in the results
                for (const dimensionName of availableDimensions) {
                    const dimensionData = result.dimensions[dimensionName];
                    if (!dimensionData)
                        continue;
                    const dimensionTests = Array.isArray(dimensionData) ? dimensionData : dimensionData.tests || [];
                    if (dimensionTests.length === 0)
                        continue;
                    const dimensionPassed = dimensionTests.filter((t) => t.success || t.passed).length;
                    const dimensionStatus = `[${dimensionPassed}/${dimensionTests.length} ${dimensionPassed === dimensionTests.length ? symbols.success : symbols.warning}]`;
                    const metadata = getDimensionMetadata(dimensionName);
                    console.log(chalk.white.bold(`  ${getDimensionIcon(dimensionName)} ${metadata.displayName} Tests`) +
                        chalk.gray(dimensionStatus.padStart(50)));
                    for (let j = 0; j < Math.min(dimensionTests.length, 5); j++) { // Show max 5 tests per dimension
                        const test = dimensionTests[j];
                        const status = (test.success || test.passed) ? chalk.green(symbols.success) : chalk.red(symbols.error);
                        const latency = test.latencyMs ? chalk.gray(`${Math.round(test.latencyMs)}ms`) : '';
                        console.log(chalk.gray(`  ├─ ${status} Test ${j + 1}`) + latency.padStart(60));
                        if (!(test.success || test.passed) && test.error) {
                            console.log(chalk.gray(`  │  └─ Error: ${chalk.red(test.error.substring(0, 60))}${test.error.length > 60 ? '...' : ''}`));
                        }
                    }
                    if (dimensionTests.length > 5) {
                        console.log(chalk.gray(`  └─ ... and ${dimensionTests.length - 5} more tests`));
                    }
                    console.log();
                }
            }
            else {
                // Ultimate fallback if no dimension data available
                console.log(chalk.gray(`  No detailed dimension data available`));
                console.log();
            }
            console.log();
        }
    }
    console.log(chalk.gray('[Press SPACE for menu, Q to quit]'));
    // Wait for user input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    return new Promise((resolve) => {
        const onKeypress = (chunk) => {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', onKeypress);
            resolve();
        };
        process.stdin.on('data', onKeypress);
    });
}
/**
 * Get icon for test dimension - uses DimensionMetadataService if available
 */
function getDimensionIcon(dimension) {
    // Try to use dimension metadata service
    if (dimensionInfoCache.has(dimension)) {
        return dimensionInfoCache.get(dimension).icon;
    }
    // Fallback to default icons if service not available
    const fallbackIcons = {
        'consistency': symbols.cycle,
        'safety': symbols.shield,
        'performance': symbols.lightning,
        'completeness': '✓',
        'accuracy': '🎯',
        'relevance': '🔍',
        'format': '📋',
        'instruction-following': '📝',
        'compliance': '⚖️',
        'brand-voice': '🎨',
        'bias-fairness': '⚖️',
        'privacy': '🔒',
        'schema': '📋',
    };
    return fallbackIcons[dimension] || symbols.info;
}
/**
 * Get dimension category and display name - uses DimensionMetadataService if available
 */
function getDimensionMetadata(dimension) {
    // Try to use cached dimension info
    if (dimensionInfoCache.has(dimension)) {
        const info = dimensionInfoCache.get(dimension);
        const categoryIcons = {
            'core': '🔵',
            'quality': '🟢',
            'enterprise': '🟡'
        };
        return {
            category: info.category.charAt(0).toUpperCase() + info.category.slice(1),
            displayName: info.displayName,
            categoryIcon: categoryIcons[info.category] || '⚪'
        };
    }
    // Fallback to generating metadata if service not available
    const displayName = dimension.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return {
        category: 'Other',
        displayName: displayName,
        categoryIcon: '⚪'
    };
}
/**
 * Pre-load dimension metadata for all dimensions in results
 * Should be called before displaying terminal summary
 */
export async function preloadDimensionMetadata(dimensions) {
    if (!dimensionMetadataService)
        return;
    for (const dimension of dimensions) {
        try {
            const info = await dimensionMetadataService.getDisplayInfo(dimension);
            dimensionInfoCache.set(dimension, info);
        }
        catch (error) {
            // Skip dimensions that aren't found - fallback will be used
        }
    }
}
/**
 * Collect issues from test results
 */
function collectIssues(results) {
    const issues = [];
    for (const [agentName, result] of results) {
        // Add failed tests as issues
        for (const test of result.tests || []) {
            if (!test.success && test.error) {
                const shortError = test.error.length > 50 ? test.error.substring(0, 50) + '...' : test.error;
                issues.push(`${agentName}: ${shortError}`);
            }
        }
        // Add dimension-specific issues
        if (result.dimensions?.consistency && !result.dimensions.consistency.isConsistent) {
            issues.push(`${agentName}: Consistency test failed - output variance too high`);
        }
        if (result.dimensions?.performance) {
            const perf = result.dimensions.performance;
            if (perf.timeoutRate && perf.timeoutRate > 0.1) {
                issues.push(`${agentName}: High timeout rate (${Math.round(perf.timeoutRate * 100)}%)`);
            }
        }
    }
    return issues;
}
//# sourceMappingURL=terminal-report-formatter.js.map