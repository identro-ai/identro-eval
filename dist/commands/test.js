/**
 * Test command - Run evaluation tests
 *
 * Uses SimplifiedTestRunner (same as interactive command) to ensure:
 * - Process pooling (85% performance improvement)
 * - Single source of truth (TestStateManager)
 * - No double orchestration
 * - Proper concurrency control
 */
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { loadConfig } from '../utils/config';
import { createSpinner, displayJson, error, info } from '../utils/display';
import { withErrorHandling } from '../utils/errors';
import { CacheService } from '../services/cache';
import { DefaultDimensionRegistry, createDimensionMetadataService } from '@identro/eval-core';
import fs from 'fs-extra';
export function testCommand() {
    return new Command('test')
        .description('Run evaluation tests on agents')
        .option('-a, --agent <name>', 'Test specific agent')
        .option('-p, --path <path>', 'Project path', process.cwd())
        .option('--dimension <dimensions>', 'Run specific test dimensions (comma-separated: consistency,safety,performance,schema)')
        .option('--parallel <number>', 'Number of parallel tests (default: 1)', '1')
        .option('--quick', 'Quick mode - minimal tests with caching')
        .option('--clear-cache', 'Clear cache before running tests')
        .option('--no-cache', 'Disable caching')
        .option('--verbose', 'Show detailed progress')
        .option('--ci', 'CI mode - exit with error code on test failures')
        .option('--json', 'Output as JSON')
        .option('--save-results', 'Save test results to file')
        .action(withErrorHandling(async (options) => {
        await runTest(options);
    }));
}
async function runTest(options) {
    const config = await loadConfig();
    const projectPath = path.resolve(options.path || process.cwd());
    // Initialize cache
    const cache = new CacheService();
    if (options.clearCache) {
        await cache.clear();
    }
    // Note: Progress display removed - using SimplifiedTestRunner's internal progress tracking
    const progress = null;
    if (!options.json && !options.ci) {
        console.log(chalk.bold('\n🧪 Running Evaluation Tests\n'));
        if (options.quick) {
            console.log(chalk.yellow('⚡ Quick mode enabled - using minimal tests\n'));
        }
        if (options.parallel && parseInt(options.parallel) > 1) {
            console.log(chalk.cyan(`🔀 Running ${options.parallel} tests in parallel\n`));
        }
    }
    const spinner = options.json || options.ci
        ? null
        : createSpinner('Initializing tests...');
    spinner?.start();
    try {
        // Load eval spec - must exist with generated tests
        if (spinner) {
            spinner.text = 'Loading evaluation spec...';
        }
        const evalSpecPath = path.join(projectPath, '.identro', 'eval-spec.json');
        if (!await fs.pathExists(evalSpecPath)) {
            spinner?.fail('No evaluation spec found');
            if (!options.json) {
                console.log(chalk.red('\n❌ No evaluation spec found'));
                console.log(chalk.yellow('\nTo generate tests, run:'));
                console.log(chalk.cyan('  identro-eval interactive'));
                console.log(chalk.gray('\nThis will analyze your agents and generate LLM-powered tests.'));
            }
            else {
                displayJson({
                    error: 'No evaluation spec found',
                    suggestion: 'Run "identro-eval interactive" to generate tests'
                });
            }
            return;
        }
        const evalSpec = await fs.readJson(evalSpecPath);
        // Auto-detect available dimensions from eval-spec.json
        const availableDimensionsInSpec = new Set();
        // Check agents for available dimensions
        for (const agentName in evalSpec.agents || {}) {
            const agent = evalSpec.agents[agentName];
            if (agent.testSpecs) {
                Object.keys(agent.testSpecs).forEach(dimension => {
                    // Only add if this dimension has actual tests
                    if (agent.testSpecs[dimension]?.tests && agent.testSpecs[dimension].tests.length > 0) {
                        availableDimensionsInSpec.add(dimension);
                    }
                });
            }
        }
        // Check teams for available dimensions
        for (const teamName in evalSpec.teams || {}) {
            const team = evalSpec.teams[teamName];
            if (team.testSpecs) {
                Object.keys(team.testSpecs).forEach(dimension => {
                    // Only add if this dimension has actual tests
                    if (team.testSpecs[dimension]?.tests && team.testSpecs[dimension].tests.length > 0) {
                        availableDimensionsInSpec.add(dimension);
                    }
                });
            }
        }
        // Load valid dimensions dynamically from dimension registry
        const dimensionRegistry = new DefaultDimensionRegistry();
        await dimensionRegistry.loadDimensionDefinitions(projectPath);
        const validDimensions = await dimensionRegistry.getAvailableDimensions();
        const metadataService = createDimensionMetadataService(dimensionRegistry);
        let selectedDimensions;
        if (options.dimension) {
            // User specified dimensions - validate them
            const dimensions = options.dimension.split(',').map((p) => p.trim());
            const invalidDimensions = dimensions.filter((p) => !validDimensions.includes(p));
            if (invalidDimensions.length > 0) {
                spinner?.fail(`Invalid dimensions: ${invalidDimensions.join(', ')}`);
                if (!options.json) {
                    console.log(chalk.yellow(`\n⚠️  Invalid dimensions: ${invalidDimensions.join(', ')}`));
                    console.log(chalk.gray('\nValid dimensions:'));
                    validDimensions.forEach(p => console.log(chalk.cyan(`  • ${p}`)));
                }
                else {
                    displayJson({
                        error: `Invalid dimensions: ${invalidDimensions.join(', ')}`,
                        validDimensions
                    });
                }
                return;
            }
            selectedDimensions = dimensions;
        }
        else {
            // Auto-detect: only run dimensions that exist in eval-spec.json
            selectedDimensions = Array.from(availableDimensionsInSpec);
            if (selectedDimensions.length === 0) {
                spinner?.fail('No test dimensions found in eval-spec.json');
                if (!options.json) {
                    console.log(chalk.yellow('\n⚠️ No test dimensions found in eval-spec.json'));
                    console.log(chalk.gray('\nRun "identro-eval interactive" to generate tests'));
                }
                return;
            }
        }
        // Quick mode: only run first available dimension (typically consistency)
        if (options.quick) {
            // Prefer consistency if available, otherwise use first dimension
            selectedDimensions = selectedDimensions.includes('consistency')
                ? ['consistency']
                : [selectedDimensions[0]];
        }
        // Determine which agents to test - only include agents that have tests
        const availableAgents = Object.keys(evalSpec.agents || {});
        const agentsWithTests = availableAgents.filter(agentName => {
            const agent = evalSpec.agents[agentName];
            if (!agent.testSpecs)
                return false;
            // Check if agent has any tests for any dimension
            return Object.keys(agent.testSpecs).some(dimension => {
                return agent.testSpecs[dimension]?.tests && agent.testSpecs[dimension].tests.length > 0;
            });
        });
        let selectedAgents = agentsWithTests;
        if (options.agent) {
            if (!availableAgents.includes(options.agent)) {
                spinner?.fail(`Agent '${options.agent}' not found`);
                if (!options.json) {
                    console.log(chalk.red(`\n❌ Agent '${options.agent}' not found`));
                    console.log(chalk.gray('\nAvailable agents:'));
                    availableAgents.forEach(name => console.log(chalk.cyan(`  • ${name}`)));
                }
                else {
                    displayJson({
                        error: `Agent '${options.agent}' not found`,
                        availableAgents
                    });
                }
                return;
            }
            // Check if specified agent has tests
            if (!agentsWithTests.includes(options.agent)) {
                spinner?.fail(`Agent '${options.agent}' has no tests`);
                if (!options.json) {
                    console.log(chalk.red(`\n❌ Agent '${options.agent}' has no generated tests`));
                    console.log(chalk.gray('\nAgents with tests:'));
                    agentsWithTests.forEach(name => console.log(chalk.cyan(`  • ${name}`)));
                    console.log(chalk.gray('\nTo generate tests, run:'));
                    console.log(chalk.cyan('  identro-eval interactive'));
                }
                else {
                    displayJson({
                        error: `Agent '${options.agent}' has no tests`,
                        agentsWithTests
                    });
                }
                return;
            }
            selectedAgents = [options.agent];
        }
        // Use TestSpecLoader to validate and load tests
        if (spinner) {
            spinner.text = 'Validating test specifications...';
        }
        const { TestSpecLoader } = await import('@identro/eval-core');
        const testSpecLoader = new TestSpecLoader();
        // Validate that tests exist for selected agents and dimensions
        const validation = testSpecLoader.validateTestSpecs(evalSpec, selectedAgents, selectedDimensions);
        if (!validation.valid) {
            spinner?.fail('No tests found for selected agents and dimensions');
            if (!options.json) {
                console.log(chalk.red('\n❌ No tests found for selected agents and dimensions'));
                console.log(chalk.yellow('\nMissing test specifications:'));
                for (const missing of validation.missing) {
                    console.log(chalk.red(`  • ${missing.agent} - ${missing.dimension}: ${missing.reason}`));
                }
                console.log(chalk.gray('\nTo generate tests, run:'));
                console.log(chalk.cyan('  identro-eval interactive'));
            }
            else {
                displayJson({
                    error: 'No tests found',
                    missing: validation.missing,
                    suggestion: 'Run "identro-eval interactive" to generate tests'
                });
            }
            return;
        }
        // Show warnings if any
        if (validation.warnings.length > 0 && !options.json) {
            console.log(chalk.yellow('\n⚠️ Warnings:'));
            for (const warning of validation.warnings) {
                console.log(chalk.yellow(`  • ${warning}`));
            }
        }
        // Load test specifications
        const loadedTests = await testSpecLoader.loadTestsFromSpec(evalSpec, selectedAgents, selectedDimensions);
        // Count actual parent tests for accurate display
        const parentTestCount = loadedTests.testSpecs.filter(spec => spec.metadata?.isParentTest || !spec.id.includes('-run')).length;
        if (spinner) {
            spinner.text = `Running ${parentTestCount} parent tests (${loadedTests.testSpecs.length} total with runs)...`;
        }
        const startTime = Date.now();
        // SIMPLIFIED ARCHITECTURE: Use SimplifiedTestRunner (same as interactive command)
        // This provides process pooling (85% perf improvement) and eliminates double orchestration
        if (spinner) {
            spinner.text = 'Initializing test runner...';
        }
        // Import simplified test runner and dependencies
        const { CrewAIAdapter } = await import('@identro/eval-crewai');
        const { TestStateManager } = await import('../utils/test-state-manager');
        const { SimplifiedTestRunner } = await import('../utils/simplified-test-runner');
        const adapter = new CrewAIAdapter();
        const cache = new CacheService();
        const testStateManager = new TestStateManager();
        // Create LLM provider if configured (for evaluation)
        let llmProvider = null;
        if (config?.llm) {
            try {
                if (config.llm.provider === 'openai') {
                    const { OpenAIProvider } = await import('@identro/eval-core');
                    const apiKey = process.env.OPENAI_API_KEY;
                    if (apiKey) {
                        llmProvider = new OpenAIProvider({
                            apiKey: apiKey,
                            model: config.llm.model || 'gpt-4-turbo-preview',
                        });
                        if (spinner) {
                            spinner.text = 'Initialized OpenAI LLM provider for evaluation';
                        }
                    }
                }
                else if (config.llm.provider === 'anthropic') {
                    const { AnthropicProvider } = await import('@identro/eval-core');
                    const apiKey = process.env.ANTHROPIC_API_KEY;
                    if (apiKey) {
                        llmProvider = new AnthropicProvider({
                            apiKey: apiKey,
                            model: config.llm.model || 'claude-3-opus-20240229',
                        });
                        if (spinner) {
                            spinner.text = 'Initialized Anthropic LLM provider for evaluation';
                        }
                    }
                }
            }
            catch (err) {
                // LLM provider optional - continue without it
                if (options.verbose) {
                    console.log(chalk.yellow('⚠️  LLM provider initialization failed, continuing without evaluation'));
                }
            }
        }
        // Create SimplifiedTestRunner
        const simplifiedTestRunner = new SimplifiedTestRunner(testStateManager, llmProvider, {
            maxConcurrency: config?.performance?.maxConcurrency || parseInt(options.parallel || '1'),
            maxLLMCalls: config?.llm?.max_concurrent_llm_calls || 3,
            timeoutMs: config?.performance?.testTimeoutMs || 60000,
            retryEnabled: config?.performance?.retryEnabled ?? true,
            maxRetries: config?.performance?.maxRetries || 2,
            retryDelayMs: config?.performance?.retryDelayMs || 2000
        });
        if (spinner) {
            spinner.text = 'Pre-creating tests in state manager...';
        }
        // Pre-create ALL tests in TestStateManager (required for proper state tracking)
        for (const testSpec of loadedTests.testSpecs) {
            const agentName = testSpec.agent?.name || testSpec.metadata?.agentName || 'unknown';
            const dimension = testSpec.dimension;
            const inputIndex = testSpec.metadata?.inputIndex || 0;
            const input = testSpec.input;
            const runIndex = testSpec.metadata?.runIndex;
            testStateManager.createTestWithId(testSpec.id, agentName, dimension, inputIndex, input, runIndex);
            // Mark parent tests appropriately
            if (testSpec.metadata?.isParentTest) {
                testStateManager.updateTest(testSpec.id, {
                    isMultiRun: true,
                    isParentTest: true,
                    visibleInQueue: false,
                    totalRuns: testSpec.metadata.totalRuns || 3,
                    completedRuns: 0
                });
            }
        }
        if (spinner) {
            spinner.text = `Running ${loadedTests.testSpecs.length} tests with process pooling...`;
        }
        // Track progress for dynamic status display
        let statusUpdateInterval = null;
        if (spinner) {
            // Update status every 500ms with real-time counts from TestStateManager
            // Use SAME display logic as split-pane (parent tests + single tests only)
            statusUpdateInterval = setInterval(() => {
                // Get counts using TestStateManager display methods (filters properly)
                const queuedTests = testStateManager.getQueueDisplayTests();
                const evaluatingTests = testStateManager.getEvaluatingDisplayTests();
                const completedTests = testStateManager.getCompletedDisplayTests();
                // For running, we need to count parent tests OR single tests (not individual runs)
                // Use same logic as getEvaluatingDisplayTests/getCompletedDisplayTests
                const allTests = testStateManager.getAllTests();
                const runningTests = allTests.filter(test => test.status === 'running' && (test.isParentTest || !test.id.includes('-run')));
                // Separate passed and failed
                const passedTests = completedTests.filter(test => test.status === 'completed');
                const failedTests = completedTests.filter(test => test.status === 'failed');
                // Build dynamic status lines - total should match loaded test count
                const line1 = `${runningTests.length} Running, ${evaluatingTests.length} Evaluating, ${queuedTests.length} In Queue, ${completedTests.length} Completed`;
                const line2 = `${passedTests.length} Passed, ${failedTests.length} Failed`;
                spinner.text = `${line1}\n${line2}`;
            }, 500);
        }
        // Execute tests using SimplifiedTestRunner (same as interactive command)
        await simplifiedTestRunner.runAllTests(loadedTests.testSpecs, adapter, {
            projectPath,
            cache,
            splitPane: {
                addLog: (message, level) => {
                    // Silent during normal operation - status indicators show progress
                },
                updateMetrics: (apiCall, cacheHit) => {
                    // Update cache stats (silent for non-verbose mode)
                }
            }
        });
        // Stop status updates
        if (statusUpdateInterval) {
            clearInterval(statusUpdateInterval);
        }
        const duration = Date.now() - startTime;
        // Get results from TestStateManager (single source of truth)
        // CRITICAL FIX: Use same logic as interactive.ts - getAllTests() with manual filter
        // This ensures we get ALL completed tests including consistency parent tests
        const completedTests = testStateManager.getAllTests().filter(test => test.status === 'completed' || test.status === 'failed');
        // Build results using TestStateManager data
        const results = new Map();
        const agentData = new Map();
        // Group data by agent and test
        for (const test of completedTests) {
            const agentName = test.agentName;
            if (!agentData.has(agentName)) {
                agentData.set(agentName, {
                    tests: new Map(),
                    runs: [],
                    dimensions: new Set()
                });
            }
            const agent = agentData.get(agentName);
            agent.runs.push({
                input: test.input,
                output: test.result,
                latencyMs: test.latencyMs || 0,
                success: test.status === 'completed',
                error: test.error,
                passed: test.status === 'completed'
            });
            // Group runs by test
            const testId = `${test.dimension}-${test.inputIndex}`;
            if (!agent.tests.has(testId)) {
                agent.tests.set(testId, []);
            }
            agent.tests.get(testId).push({
                input: test.input,
                output: test.result,
                latencyMs: test.latencyMs || 0,
                success: test.status === 'completed',
                error: test.error,
                dimension: test.dimension
            });
            agent.dimensions.add(test.dimension);
        }
        // Build TestResults for each agent
        for (const agentName of selectedAgents) {
            const agent = agentData.get(agentName);
            if (!agent)
                continue;
            // CRITICAL FIX: Count actual unique tests from grouped data (same as interactive command)
            // agent.tests is a Map where each key is a unique test (dimension-inputIndex)
            const actualTestCount = agent.tests.size;
            const totalRuns = agent.runs.length;
            // Count passed/failed tests from grouped test data (majority rule for multi-run tests)
            let passedTests = 0;
            let failedTests = 0;
            for (const [testId, runs] of agent.tests) {
                const passedRuns = runs.filter(r => r.success).length;
                const testPassed = passedRuns > runs.length / 2; // Majority rule for multi-run tests
                if (testPassed) {
                    passedTests++;
                }
                else {
                    failedTests++;
                }
            }
            let totalLatency = 0;
            for (const run of agent.runs) {
                totalLatency += run.latencyMs;
            }
            // Build dimension data
            const dimensions = {};
            for (const dimension of agent.dimensions) {
                const dimensionTests = Array.from(agent.tests.entries()).filter(([testId, runs]) => runs[0].dimension === dimension);
                const dimensionTestCount = dimensionTests.length;
                const dimensionPassedTests = dimensionTests.filter(([_, runs]) => {
                    const passedRuns = runs.filter(r => r.success).length;
                    return passedRuns > runs.length / 2;
                }).length;
                // Build dimension-specific metrics dynamically
                const dimensionMetrics = {};
                // Check if dimension supports multi-run (for consistency-type metrics)
                const supportsMultiRun = await metadataService.supportsMultiRun(dimension);
                if (supportsMultiRun) {
                    dimensionMetrics.isConsistent = dimensionPassedTests === dimensionTestCount;
                    dimensionMetrics.outputVariance = 1 - dimensionPassedTests / dimensionTestCount;
                    dimensionMetrics.confidence = dimensionPassedTests / dimensionTestCount;
                }
                // Add generic metrics for all dimensions
                dimensionMetrics.score = dimensionPassedTests / dimensionTestCount;
                dimensionMetrics.passedTests = dimensionPassedTests;
                dimensionMetrics.totalTests = dimensionTestCount;
                // Add performance metrics if available
                if (totalRuns > 0) {
                    dimensionMetrics.latencyPercentiles = {
                        p50: totalLatency / totalRuns,
                        p95: totalLatency / totalRuns,
                        p99: totalLatency / totalRuns
                    };
                }
                dimensions[dimension] = dimensionMetrics;
            }
            results.set(agentName, {
                agentId: agentName,
                timestamp: new Date(),
                tests: agent.runs,
                dimensions: dimensions,
                summary: {
                    totalTests: actualTestCount,
                    passed: passedTests,
                    failed: failedTests,
                    averageLatencyMs: totalRuns > 0 ? totalLatency / totalRuns : 0,
                    successRate: actualTestCount > 0 ? passedTests / actualTestCount : 0
                }
            });
        }
        // Calculate totals
        let totalTests = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        let totalSkipped = 0;
        for (const [_, testResults] of results) {
            totalTests += testResults.summary.totalTests;
            totalPassed += testResults.summary.passed;
            totalFailed += testResults.summary.failed;
            totalSkipped += 0; // TODO: Add skipped support when available in TestResults
        }
        spinner?.succeed('Tests complete');
        // Save results if requested
        if (options.saveResults) {
            const resultsPath = path.join(projectPath, '.identro', 'test-results.json');
            await fs.ensureDir(path.dirname(resultsPath));
            const resultsData = {
                timestamp: new Date().toISOString(),
                duration,
                summary: {
                    totalTests,
                    passed: totalPassed,
                    failed: totalFailed,
                    skipped: totalSkipped,
                },
                agents: Object.fromEntries(results),
            };
            await fs.writeJson(resultsPath, resultsData, { spaces: 2 });
            if (!options.json && !options.ci) {
                info(`Results saved to ${resultsPath}`);
            }
        }
        // Generate HTML report automatically (for dashboard link)
        const reportModule = await import('./report');
        const reportData = await reportModule.generateRichReportData(results, projectPath, testStateManager);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportsDir = path.join(projectPath, '.identro', 'reports');
        await fs.ensureDir(reportsDir);
        const reportPath = path.join(reportsDir, `test-${timestamp}.html`);
        const htmlReport = await reportModule.generateRichHtmlReport(reportData, projectPath);
        await fs.writeFile(reportPath, htmlReport);
        // Track report in manifest
        const { ReportManifestManager } = await import('../utils/report-manifest');
        const manifestManager = new ReportManifestManager(projectPath);
        const metrics = testStateManager.getMetrics();
        await manifestManager.addReportFromTestStateManager(reportPath, 'html', 'cli', testStateManager, {
            duration: Date.now() - metrics.startTime.getTime(),
            llmCalls: metrics.totalLLMCalls,
            llmCost: metrics.totalCost
        });
        // Display results
        if (options.json) {
            displayJson({
                summary: {
                    totalTests,
                    passed: totalPassed,
                    failed: totalFailed,
                    skipped: totalSkipped,
                    duration,
                },
                agents: Object.fromEntries(results),
                reportPath,
            });
        }
        else {
            // Compact results table for CI/CD
            console.log();
            console.log(chalk.bold('📊 Test Results'));
            console.log(chalk.gray('─'.repeat(70)));
            // Header
            console.log(chalk.gray('Agent'.padEnd(25)) +
                chalk.gray('Tests'.padEnd(10)) +
                chalk.gray('Passed'.padEnd(10)) +
                chalk.gray('Failed'.padEnd(10)) +
                chalk.gray('Success Rate'.padEnd(15)));
            console.log(chalk.gray('─'.repeat(70)));
            // Results per agent
            for (const [agentName, testResults] of results) {
                const summary = testResults.summary;
                const passRate = (summary.successRate * 100).toFixed(1);
                const status = summary.failed === 0 ? chalk.green('✅') : chalk.red('❌');
                console.log(`${status} ${chalk.bold(agentName.padEnd(22))} ` +
                    `${summary.totalTests.toString().padEnd(10)}` +
                    `${chalk.green(summary.passed.toString().padEnd(10))}` +
                    `${chalk.red(summary.failed.toString().padEnd(10))}` +
                    `${passRate}%`);
            }
            console.log(chalk.gray('─'.repeat(70)));
            // Summary
            const successRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : '0';
            console.log(chalk.bold('Total'.padEnd(25)) +
                `${totalTests.toString().padEnd(10)}` +
                `${chalk.green(totalPassed.toString().padEnd(10))}` +
                `${chalk.red(totalFailed.toString().padEnd(10))}` +
                `${successRate}%`);
            console.log();
            // Overall status
            if (totalFailed === 0) {
                console.log(chalk.green.bold(`✨ All tests passed! (${totalPassed}/${totalTests})`));
            }
            else {
                console.log(chalk.yellow.bold(`⚠️  ${totalFailed} test(s) failed (${totalPassed}/${totalTests} passed)`));
            }
            console.log(chalk.gray(`Completed in ${(duration / 1000).toFixed(2)}s`));
            // Report link
            console.log();
            console.log(chalk.cyan('📖 View detailed dashboard:'));
            console.log(chalk.white(`   ${reportPath}`));
            console.log();
            console.log(chalk.gray('   Or run:'), chalk.cyan(`open ${reportPath}`));
            console.log();
            // Auto-exit after displaying results (non-interactive command)
            // Clean up and force exit
            if (statusUpdateInterval) {
                clearInterval(statusUpdateInterval);
            }
            process.exit(totalFailed > 0 ? 1 : 0);
        }
        // Exit with error code if tests failed in CI mode
        if (options.ci && totalFailed > 0) {
            process.exit(1);
        }
    }
    catch (err) {
        spinner?.fail('Tests failed');
        if (options.json) {
            displayJson({
                error: err.message,
                stack: err.stack
            });
        }
        else if (!options.ci) {
            error(`Tests failed: ${err.message}`);
            if (err.stack && process.env.DEBUG) {
                console.error(chalk.gray(err.stack));
            }
        }
        // Always exit with error in CI mode
        if (options.ci) {
            process.exit(1);
        }
        throw err;
    }
}
//# sourceMappingURL=test.js.map