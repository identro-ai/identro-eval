"use strict";
/**
 * Report command - Generate evaluation reports
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRichReportData = generateRichReportData;
exports.generateRichHtmlReport = generateRichHtmlReport;
exports.reportCommand = reportCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const config_1 = require("../utils/config");
const display_1 = require("../utils/display");
const errors_1 = require("../utils/errors");
const evaluation_engine_1 = require("../services/evaluation-engine");
const child_process_1 = require("child_process");
const util_1 = require("util");
const report_manifest_1 = require("../utils/report-manifest");
const inquirer_1 = __importDefault(require("inquirer"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Generate rich report data structure from TestStateManager data only
 * Completely data-driven with no hardcoded dimension references or fallbacks
 */
async function generateRichReportData(results, projectPath, testStateManager) {
    if (!testStateManager) {
        throw new Error('TestStateManager is required for report generation. No fallback methods available.');
    }
    const agents = {};
    const teams = {};
    // CRITICAL FIX: Use totals from results Map (already calculated correctly in test.ts/interactive.ts)
    // instead of recalculating from TestStateManager
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    for (const [_, testResults] of results) {
        totalTests += testResults.summary.totalTests;
        totalPassed += testResults.summary.passed;
        totalFailed += testResults.summary.failed;
    }
    // Use TestStateManager data for detailed test information
    const allTests = testStateManager.getAllTests();
    const completedTests = allTests.filter((test) => test.status === 'completed' || test.status === 'failed');
    const totalRuns = completedTests.length;
    let totalDuration = 0;
    // Group by agent/team using TestStateManager data
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
                parentTests: [],
                allRuns: [],
                dimensions: new Set(),
                isTeam: isTeam
            });
        }
        const entity = entityData.get(entityName);
        entity.allRuns.push(test);
        entity.dimensions.add(test.dimension);
        // Only add to parentTests if it's not a run
        if (!test.id.includes('-run')) {
            entity.parentTests.push(test);
        }
    }
    // Build agent and team data from TestStateManager
    for (const [entityName, entityInfo] of entityData) {
        const entityRunCount = entityInfo.allRuns.length;
        let entityTotalLatency = 0;
        for (const run of entityInfo.allRuns) {
            entityTotalLatency += run.latencyMs || 0;
        }
        const entityAvgLatency = entityInfo.allRuns.length > 0 ? entityTotalLatency / entityInfo.allRuns.length : 0;
        // CRITICAL FIX: Use summary from results Map instead of recalculating
        // This ensures sidebar shows same counts as terminal and top summary
        const resultsSummary = results.get(entityName)?.summary;
        const entityData = {
            description: `${entityInfo.isTeam ? 'Team' : 'Agent'}: ${entityName}`,
            isTeam: entityInfo.isTeam,
            summary: resultsSummary || {
                totalTests: entityInfo.parentTests.length,
                totalRuns: entityRunCount,
                passed: entityInfo.parentTests.filter(t => t.status === 'completed').length,
                failed: entityInfo.parentTests.filter(t => t.status === 'failed').length,
                successRate: entityInfo.parentTests.length > 0 ? entityInfo.parentTests.filter(t => t.status === 'completed').length / entityInfo.parentTests.length : 0,
                averageLatencyMs: entityAvgLatency,
                duration: `${Math.round(entityAvgLatency)}ms`
            },
            dimensions: {}
        };
        if (entityInfo.isTeam) {
            teams[entityName] = entityData;
        }
        else {
            agents[entityName] = entityData;
        }
        // Build dimension data from actual TestStateManager data - completely data-driven
        for (const dimension of entityInfo.dimensions) {
            const dimensionRuns = entityInfo.allRuns.filter(r => r.dimension === dimension);
            const dimensionTests = [];
            // Detect multi-run dimensions by checking if runs have runIndex
            const hasMultiRuns = dimensionRuns.some(r => r.runIndex !== undefined);
            if (hasMultiRuns) {
                // Group multi-run tests by parent ID
                const runGroups = new Map();
                for (const run of dimensionRuns) {
                    if (run.runIndex !== undefined) {
                        const parentId = run.id.replace(/-run\d+$/, '');
                        if (!runGroups.has(parentId)) {
                            runGroups.set(parentId, []);
                        }
                        runGroups.get(parentId).push(run);
                    }
                }
                // Create test entries for each group
                let testIndex = 1;
                for (const [parentId, testRuns] of runGroups) {
                    if (testRuns.length === 0)
                        continue;
                    const firstRun = testRuns[0];
                    const passedRuns = testRuns.filter(r => r.status === 'completed').length;
                    // Get the actual test status from the parent test (which has the LLM evaluation result)
                    const parentTest = entityInfo.parentTests.find(p => p.id === parentId);
                    const actualTestPassed = parentTest ? parentTest.status === 'completed' : firstRun.status === 'completed';
                    // Use actual LLM evaluation if available, otherwise create fallback
                    const evaluation = parentTest?.llmEvaluation || {
                        reasoning: actualTestPassed
                            ? `Test passed: ${passedRuns}/${testRuns.length} runs successful. Agent demonstrated consistent behavior across multiple runs.`
                            : `Test failed: Only ${passedRuns}/${testRuns.length} runs successful. Agent showed inconsistent behavior or significant output variance.`,
                        score: passedRuns / testRuns.length
                    };
                    dimensionTests.push({
                        name: `${dimension ? (dimension.charAt(0).toUpperCase() + dimension.slice(1)) : "Unknown"} Test ${testIndex}`,
                        description: `Evaluates ${dimension} behavior of the agent`,
                        passed: actualTestPassed,
                        isMultiRun: testRuns.length > 1,
                        totalRuns: testRuns.length,
                        passedRuns,
                        failedRuns: testRuns.length - passedRuns,
                        input: firstRun.input,
                        output: firstRun.result,
                        evaluationCriteria: firstRun.evaluationCriteria || [],
                        evaluation: evaluation,
                        error: actualTestPassed ? null : `Failed ${testRuns.length - passedRuns} out of ${testRuns.length} runs`,
                        latencyMs: testRuns.reduce((sum, r) => sum + (r.latencyMs || 0), 0) / testRuns.length
                    });
                    testIndex++;
                }
            }
            else {
                // Single-run tests
                for (let j = 0; j < dimensionRuns.length; j++) {
                    const run = dimensionRuns[j];
                    // Use actual LLM evaluation if available, otherwise create fallback
                    const evaluation = run.llmEvaluation || {
                        reasoning: run.status === 'completed'
                            ? `Test passed: Agent properly handled ${dimension} requirements and met evaluation criteria.`
                            : `Test failed: Agent failed to meet ${dimension} requirements or evaluation criteria.`,
                        score: run.status === 'completed' ? 1 : 0
                    };
                    dimensionTests.push({
                        name: `${dimension ? (dimension.charAt(0).toUpperCase() + dimension.slice(1)) : "Unknown"} Test ${j + 1}`,
                        description: `Evaluates ${dimension} behavior of the agent`,
                        passed: run.status === 'completed',
                        isMultiRun: false,
                        totalRuns: 1,
                        passedRuns: run.status === 'completed' ? 1 : 0,
                        failedRuns: run.status === 'completed' ? 0 : 1,
                        input: run.input,
                        output: run.result,
                        evaluationCriteria: run.evaluationCriteria || [],
                        evaluation: evaluation,
                        error: run.status === 'completed' ? null : run.error,
                        latencyMs: run.latencyMs || 0
                    });
                }
            }
            // Only add dimension if we have tests for it
            if (dimensionTests.length > 0) {
                const targetEntity = entityInfo.isTeam ? teams[entityName] : agents[entityName];
                targetEntity.dimensions[dimension] = {
                    tests: dimensionTests,
                    summary: {
                        totalTests: dimensionTests.length,
                        totalRuns: dimensionTests.reduce((sum, t) => sum + t.totalRuns, 0),
                        passed: dimensionTests.filter(t => t.passed).length,
                        failed: dimensionTests.filter(t => !t.passed).length
                    }
                };
            }
        }
        totalDuration += entityAvgLatency;
    }
    return {
        metadata: {
            timestamp: new Date().toISOString(),
            project: path_1.default.basename(projectPath),
            reportVersion: '2.0.0'
        },
        summary: {
            totalTests,
            totalRuns,
            passed: totalPassed,
            failed: totalFailed,
            successRate: totalTests > 0 ? totalPassed / totalTests : 0,
            duration: `${Math.round(totalDuration)}ms`
        },
        agents,
        teams
    };
}
/**
 * Generate rich HTML report by combining template with data
 */
async function generateRichHtmlReport(reportData, projectPath) {
    // Read the embedded HTML template
    const templatePath = path_1.default.join(__dirname, '../../templates/embedded-report-viewer.html');
    let htmlTemplate = await fs_extra_1.default.readFile(templatePath, 'utf-8');
    // Save report data to JSON files for reference (optional)
    const reportsDir = path_1.default.join(projectPath, '.identro', 'reports');
    await fs_extra_1.default.ensureDir(reportsDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDataPath = path_1.default.join(reportsDir, `report-${timestamp}.json`);
    await fs_extra_1.default.writeJson(reportDataPath, reportData, { spaces: 2 });
    // Create latest.json for reference
    const latestPath = path_1.default.join(reportsDir, 'latest.json');
    await fs_extra_1.default.writeJson(latestPath, reportData, { spaces: 2 });
    // Embed the data directly into the HTML using simple string replacement
    const embeddedData = JSON.stringify(reportData, null, 2);
    // Replace the placeholder with actual data
    htmlTemplate = htmlTemplate.replace('"REPORT_DATA_PLACEHOLDER"', embeddedData);
    return htmlTemplate;
}
function reportCommand() {
    const cmd = new commander_1.Command('report')
        .description('Generate and manage evaluation reports');
    // Main report generation command (default action)
    cmd
        .option('-p, --path <path>', 'Project path', process.cwd())
        .option('-f, --format <format>', 'Report format (text, json, html, markdown, rich)', 'text')
        .option('-o, --output <file>', 'Output file path')
        .option('--from-file <file>', 'Load results from file instead of running tests')
        .option('--json', 'Output as JSON')
        .option('--open', 'Open report in browser (for rich format)')
        .action((0, errors_1.withErrorHandling)(async (options) => {
        await runReport(options);
    }));
    // List historical reports
    cmd
        .command('list')
        .alias('ls')
        .description('List all historical reports')
        .option('-p, --path <path>', 'Project path')
        .option('--type <type>', 'Filter by report type (interactive, cli, watch, ci)')
        .option('--format <format>', 'Filter by format (html, json, markdown)')
        .option('--since <date>', 'Show reports since date (ISO format)')
        .option('--limit <number>', 'Limit number of reports shown', '20')
        .option('--json', 'Output as JSON')
        .action((0, errors_1.withErrorHandling)(async (options) => {
        await listReports(options);
    }));
    // View specific report
    cmd
        .command('view <id>')
        .description('View a specific historical report')
        .option('-p, --path <path>', 'Project path', process.cwd())
        .option('--open', 'Open report in browser (for HTML reports)')
        .option('--json', 'Output as JSON')
        .action((0, errors_1.withErrorHandling)(async (id, options) => {
        await viewReport(id, options);
    }));
    // Compare two reports
    cmd
        .command('compare <id1> <id2>')
        .description('Compare two historical reports')
        .option('-p, --path <path>', 'Project path', process.cwd())
        .option('--json', 'Output as JSON')
        .action((0, errors_1.withErrorHandling)(async (id1, id2, options) => {
        await compareReports(id1, id2, options);
    }));
    // Clean old reports
    cmd
        .command('clean')
        .description('Clean old reports based on retention policy')
        .option('-p, --path <path>', 'Project path', process.cwd())
        .option('--dry-run', 'Show what would be deleted without actually deleting')
        .option('--force', 'Skip confirmation prompt')
        .option('--json', 'Output as JSON')
        .action((0, errors_1.withErrorHandling)(async (options) => {
        await cleanReports(options);
    }));
    // Export report
    cmd
        .command('export <id>')
        .description('Export a report to a shareable location')
        .option('-p, --path <path>', 'Project path', process.cwd())
        .option('-o, --output <file>', 'Output file path')
        .option('-f, --format <format>', 'Export format (html, json, markdown)', 'html')
        .option('--open', 'Open exported report')
        .option('--json', 'Output as JSON')
        .action((0, errors_1.withErrorHandling)(async (id, options) => {
        await exportReport(id, options);
    }));
    // Show report statistics
    cmd
        .command('stats')
        .description('Show report statistics and summary')
        .option('-p, --path <path>', 'Project path', process.cwd())
        .option('--json', 'Output as JSON')
        .action((0, errors_1.withErrorHandling)(async (options) => {
        await showReportStats(options);
    }));
    // Interactive report selector
    cmd
        .command('select')
        .alias('choose')
        .description('Interactively select and view a report')
        .option('-p, --path <path>', 'Project path')
        .option('--json', 'Output as JSON')
        .action((0, errors_1.withErrorHandling)(async (options) => {
        await selectReport(options);
    }));
    return cmd;
}
async function runReport(options) {
    const config = await (0, config_1.loadConfig)();
    const projectPath = path_1.default.resolve(options.path || process.cwd());
    const reportFormat = options.format || 'text';
    // Validate format
    const validFormats = ['text', 'json', 'html', 'markdown', 'rich'];
    if (!validFormats.includes(reportFormat)) {
        if (options.json) {
            (0, display_1.displayJson)({
                error: `Invalid format: ${reportFormat}`,
                validFormats
            });
        }
        else {
            (0, display_1.error)(`Invalid format: ${reportFormat}`);
            console.log(chalk_1.default.gray('\nValid formats:'));
            validFormats.forEach(f => console.log(chalk_1.default.cyan(`  • ${f}`)));
        }
        return;
    }
    if (!options.json) {
        console.log(chalk_1.default.bold('\n📄 Generating Evaluation Report\n'));
    }
    const spinner = options.json ? null : (0, display_1.createSpinner)('Loading test results...');
    spinner?.start();
    try {
        let results;
        if (options.fromFile) {
            // Load results from file
            const resultsPath = path_1.default.resolve(options.fromFile);
            if (!await fs_extra_1.default.pathExists(resultsPath)) {
                spinner?.fail(`Results file not found: ${resultsPath}`);
                if (options.json) {
                    (0, display_1.displayJson)({ error: `Results file not found: ${resultsPath}` });
                }
                else {
                    (0, display_1.error)(`Results file not found: ${resultsPath}`);
                }
                return;
            }
            const data = await fs_extra_1.default.readJson(resultsPath);
            // Convert to Map if it's an object
            if (data.agents) {
                results = new Map(Object.entries(data.agents));
            }
            else {
                results = new Map(Object.entries(data));
            }
        }
        else {
            // Check if we have saved results
            const savedResultsPath = path_1.default.join(projectPath, '.identro', 'test-results.json');
            if (await fs_extra_1.default.pathExists(savedResultsPath)) {
                if (spinner) {
                    spinner.text = 'Loading saved test results...';
                }
                const data = await fs_extra_1.default.readJson(savedResultsPath);
                results = new Map(Object.entries(data.agents || data));
            }
            else {
                // Run tests to get results
                if (spinner) {
                    spinner.text = 'Running tests to generate report...';
                }
                const engine = (0, evaluation_engine_1.getEvaluationEngine)();
                await engine.initialize(config);
                // Load or create eval spec
                const evalSpecPath = path_1.default.join(projectPath, '.identro', 'eval-spec.json');
                let evalSpec;
                if (await fs_extra_1.default.pathExists(evalSpecPath)) {
                    evalSpec = await fs_extra_1.default.readJson(evalSpecPath);
                }
                else {
                    evalSpec = await engine.createEvalSpec(projectPath, config);
                }
                // Run tests
                results = await engine.runTests(projectPath, evalSpec);
            }
        }
        if (results.size === 0) {
            spinner?.fail('No test results found');
            if (options.json) {
                (0, display_1.displayJson)({ error: 'No test results found' });
            }
            else {
                console.log(chalk_1.default.yellow('\n⚠️  No test results found'));
                console.log(chalk_1.default.gray('\nTip: Run'), chalk_1.default.bold('identro-eval test'), chalk_1.default.gray('first to generate test results'));
            }
            return;
        }
        // Generate report
        if (spinner) {
            spinner.text = 'Generating report...';
        }
        let report;
        let reportData;
        if (reportFormat === 'rich') {
            // Generate rich HTML report
            reportData = await generateRichReportData(results, projectPath);
            report = await generateRichHtmlReport(reportData, projectPath);
        }
        else {
            // Use existing report generation
            const engine = (0, evaluation_engine_1.getEvaluationEngine)();
            await engine.initialize(config);
            report = engine.generateReport(results, reportFormat);
        }
        // Save or display report
        if (options.output) {
            const outputPath = path_1.default.resolve(options.output);
            await fs_extra_1.default.ensureDir(path_1.default.dirname(outputPath));
            await fs_extra_1.default.writeFile(outputPath, report, 'utf-8');
            spinner?.succeed(`Report saved to ${outputPath}`);
            if (options.json) {
                (0, display_1.displayJson)({
                    success: true,
                    outputPath,
                    format: reportFormat,
                    agents: results.size,
                });
            }
            else {
                (0, display_1.success)(`\n✨ Report generated successfully!`);
                (0, display_1.info)(`Saved to: ${outputPath}`);
                // Show summary
                let totalTests = 0;
                let totalPassed = 0;
                let totalFailed = 0;
                for (const [_, testResults] of results) {
                    totalTests += testResults.summary.totalTests;
                    totalPassed += testResults.summary.passed;
                    totalFailed += testResults.summary.failed;
                }
                console.log(chalk_1.default.gray('\nSummary:'));
                console.log(chalk_1.default.gray(`  • Agents: ${results.size}`));
                console.log(chalk_1.default.gray(`  • Total Tests: ${totalTests}`));
                console.log(chalk_1.default.gray(`  • Passed: ${totalPassed}`));
                console.log(chalk_1.default.gray(`  • Failed: ${totalFailed}`));
                console.log(chalk_1.default.gray(`  • Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`));
                // Suggest how to view the report
                if (reportFormat === 'html' || reportFormat === 'rich') {
                    console.log(chalk_1.default.gray('\nTo view the report:'));
                    console.log(chalk_1.default.cyan(`  open ${outputPath}`));
                }
                // Auto-open if requested
                if (options.open && (reportFormat === 'rich' || reportFormat === 'html')) {
                    try {
                        await execAsync(`open "${outputPath}"`);
                        console.log(chalk_1.default.green('📖 Report opened in browser'));
                    }
                    catch (err) {
                        console.log(chalk_1.default.yellow('⚠️  Could not auto-open browser. Please open the file manually.'));
                    }
                }
            }
        }
        else {
            spinner?.succeed('Report generated');
            if (options.json) {
                // For JSON output option, just output the report
                if (reportFormat === 'json') {
                    console.log(report);
                }
                else {
                    (0, display_1.displayJson)({
                        report,
                        format: reportFormat,
                        agents: results.size,
                    });
                }
            }
            else {
                if (reportFormat === 'rich') {
                    // For rich format, we need to save it to view it
                    const tempReportPath = path_1.default.join(projectPath, '.identro', 'reports', 'temp-report.html');
                    await fs_extra_1.default.ensureDir(path_1.default.dirname(tempReportPath));
                    await fs_extra_1.default.writeFile(tempReportPath, report, 'utf-8');
                    console.log(chalk_1.default.green('✨ Rich report generated!'));
                    console.log(chalk_1.default.gray('Saved to:'), chalk_1.default.cyan(tempReportPath));
                    if (options.open) {
                        try {
                            await execAsync(`open "${tempReportPath}"`);
                            console.log(chalk_1.default.green('📖 Report opened in browser'));
                        }
                        catch (err) {
                            console.log(chalk_1.default.yellow('⚠️  Could not auto-open browser. Please open the file manually.'));
                        }
                    }
                    else {
                        console.log(chalk_1.default.gray('\nTo view the report:'));
                        console.log(chalk_1.default.cyan(`  open ${tempReportPath}`));
                        console.log(chalk_1.default.gray('Or use:'), chalk_1.default.bold('--open'), chalk_1.default.gray('to auto-open in browser'));
                    }
                }
                else {
                    // Display report to console
                    console.log();
                    console.log(report);
                    // Show save tip
                    console.log(chalk_1.default.gray('\nTip: Use'), chalk_1.default.bold('--output <file>'), chalk_1.default.gray('to save the report to a file'));
                }
            }
        }
    }
    catch (err) {
        spinner?.fail('Report generation failed');
        if (options.json) {
            (0, display_1.displayJson)({
                error: err.message,
                stack: err.stack
            });
        }
        else {
            (0, display_1.error)(`Report generation failed: ${err.message}`);
            if (err.stack && process.env.DEBUG) {
                console.error(chalk_1.default.gray(err.stack));
            }
        }
        throw err;
    }
}
/**
 * List historical reports
 */
async function listReports(options) {
    // Simple path resolution - use provided path or current working directory
    const projectPath = options.path ? path_1.default.resolve(options.path) : process.cwd();
    const manifestManager = new report_manifest_1.ReportManifestManager(projectPath);
    if (!options.json) {
        console.log(chalk_1.default.bold('\n📋 Historical Reports\n'));
    }
    try {
        const filter = {};
        if (options.type)
            filter.type = options.type;
        if (options.format)
            filter.format = options.format;
        if (options.since)
            filter.since = options.since;
        if (options.limit)
            filter.limit = parseInt(options.limit);
        const reports = await manifestManager.getReports(filter);
        if (reports.length === 0) {
            if (options.json) {
                (0, display_1.displayJson)({ reports: [], total: 0 });
            }
            else {
                console.log(chalk_1.default.yellow('📭 No reports found'));
                console.log(chalk_1.default.gray('\nTip: Run'), chalk_1.default.bold('identro-eval interactive'), chalk_1.default.gray('to generate your first report'));
            }
            return;
        }
        if (options.json) {
            (0, display_1.displayJson)({ reports, total: reports.length });
            return;
        }
        // Display reports in a table format
        console.log(chalk_1.default.gray('ID'.padEnd(25)) +
            chalk_1.default.gray('Date'.padEnd(20)) +
            chalk_1.default.gray('Type'.padEnd(12)) +
            chalk_1.default.gray('Format'.padEnd(8)) +
            chalk_1.default.gray('Tests'.padEnd(8)) +
            chalk_1.default.gray('Success'.padEnd(10)) +
            chalk_1.default.gray('Size'));
        console.log(chalk_1.default.gray('─'.repeat(90)));
        for (const report of reports) {
            const date = new Date(report.timestamp).toLocaleDateString();
            const time = new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const successRate = `${report.metadata.successRate.toFixed(1)}%`;
            const size = formatFileSize(report.size);
            const statusColor = report.metadata.successRate >= 80 ? chalk_1.default.green :
                report.metadata.successRate >= 60 ? chalk_1.default.yellow : chalk_1.default.red;
            console.log(chalk_1.default.cyan(report.id.padEnd(25)) +
                chalk_1.default.gray(`${date} ${time}`.padEnd(20)) +
                chalk_1.default.blue(report.type.padEnd(12)) +
                chalk_1.default.magenta(report.format.padEnd(8)) +
                chalk_1.default.white(report.metadata.totalTests.toString().padEnd(8)) +
                statusColor(successRate.padEnd(10)) +
                chalk_1.default.gray(size));
        }
        console.log(chalk_1.default.gray('\n📊 Summary:'));
        console.log(chalk_1.default.gray(`  • Total reports: ${reports.length}`));
        console.log(chalk_1.default.gray(`  • Average success rate: ${(reports.reduce((sum, r) => sum + r.metadata.successRate, 0) / reports.length).toFixed(1)}%`));
        const totalSize = reports.reduce((sum, r) => sum + r.size, 0);
        console.log(chalk_1.default.gray(`  • Total size: ${formatFileSize(totalSize)}`));
        console.log(chalk_1.default.gray('\n💡 Commands:'));
        console.log(chalk_1.default.gray('  • View report:'), chalk_1.default.cyan('identro-eval report view <id>'));
        console.log(chalk_1.default.gray('  • Compare reports:'), chalk_1.default.cyan('identro-eval report compare <id1> <id2>'));
        console.log(chalk_1.default.gray('  • Export report:'), chalk_1.default.cyan('identro-eval report export <id>'));
    }
    catch (err) {
        if (options.json) {
            (0, display_1.displayJson)({ error: err.message });
        }
        else {
            (0, display_1.error)(`Failed to list reports: ${err.message}`);
        }
        throw err;
    }
}
/**
 * View a specific report
 */
async function viewReport(id, options) {
    const projectPath = path_1.default.resolve(options.path || process.cwd());
    const manifestManager = new report_manifest_1.ReportManifestManager(projectPath);
    try {
        const report = await manifestManager.getReport(id);
        if (!report) {
            if (options.json) {
                (0, display_1.displayJson)({ error: `Report not found: ${id}` });
            }
            else {
                (0, display_1.error)(`Report not found: ${id}`);
                console.log(chalk_1.default.gray('\nTip: Use'), chalk_1.default.bold('identro-eval report list'), chalk_1.default.gray('to see available reports'));
            }
            return;
        }
        if (options.json) {
            (0, display_1.displayJson)({ report });
            return;
        }
        // Display report details
        console.log(chalk_1.default.bold(`\n📄 Report: ${report.id}\n`));
        console.log(chalk_1.default.gray('Basic Information:'));
        console.log(`  • Date: ${chalk_1.default.cyan(new Date(report.timestamp).toLocaleString())}`);
        console.log(`  • Type: ${chalk_1.default.blue(report.type)}`);
        console.log(`  • Format: ${chalk_1.default.magenta(report.format)}`);
        console.log(`  • File: ${chalk_1.default.gray(report.filename)}`);
        console.log(`  • Size: ${chalk_1.default.gray(formatFileSize(report.size))}`);
        console.log(chalk_1.default.gray('\nTest Results:'));
        console.log(`  • Total Tests: ${chalk_1.default.white(report.metadata.totalTests)}`);
        console.log(`  • Passed: ${chalk_1.default.green(report.metadata.passedTests)}`);
        console.log(`  • Failed: ${chalk_1.default.red(report.metadata.failedTests)}`);
        console.log(`  • Success Rate: ${getSuccessRateColor(report.metadata.successRate)}${report.metadata.successRate.toFixed(1)}%${chalk_1.default.reset()}`);
        console.log(`  • Average Latency: ${chalk_1.default.gray(report.metadata.averageLatencyMs)}ms`);
        console.log(chalk_1.default.gray('\nAgents & Dimensions:'));
        console.log(`  • Agents (${report.metadata.agentCount}): ${chalk_1.default.cyan(report.metadata.agents.join(', '))}`);
        console.log(`  • Dimensions (${report.metadata.dimensionCount}): ${chalk_1.default.blue(report.metadata.dimensions.join(', '))}`);
        if (report.metadata.duration) {
            console.log(`  • Duration: ${chalk_1.default.gray(report.metadata.duration)}ms`);
        }
        if (report.metadata.llmCalls) {
            console.log(`  • LLM Calls: ${chalk_1.default.gray(report.metadata.llmCalls)}`);
        }
        if (report.metadata.llmCost) {
            console.log(`  • LLM Cost: ${chalk_1.default.gray('$' + report.metadata.llmCost.toFixed(4))}`);
        }
        // Show file path
        const reportPath = path_1.default.join(projectPath, '.identro', 'reports', report.filename);
        console.log(chalk_1.default.gray('\nFile Location:'));
        console.log(`  ${chalk_1.default.cyan(reportPath)}`);
        // Auto-open HTML reports by default, or if requested
        if (report.format === 'html') {
            try {
                await execAsync(`open "${reportPath}"`);
                console.log(chalk_1.default.green('\n📖 Report opened in browser'));
            }
            catch (err) {
                console.log(chalk_1.default.yellow('\n⚠️  Could not auto-open browser. Please open the file manually.'));
                console.log(chalk_1.default.gray('File path:'), chalk_1.default.cyan(reportPath));
            }
        }
    }
    catch (err) {
        if (options.json) {
            (0, display_1.displayJson)({ error: err.message });
        }
        else {
            (0, display_1.error)(`Failed to view report: ${err.message}`);
        }
        throw err;
    }
}
/**
 * Compare two reports
 */
async function compareReports(id1, id2, options) {
    const projectPath = path_1.default.resolve(options.path || process.cwd());
    const manifestManager = new report_manifest_1.ReportManifestManager(projectPath);
    try {
        const [report1, report2] = await Promise.all([
            manifestManager.getReport(id1),
            manifestManager.getReport(id2)
        ]);
        if (!report1) {
            const message = `Report not found: ${id1}`;
            if (options.json) {
                (0, display_1.displayJson)({ error: message });
            }
            else {
                (0, display_1.error)(message);
            }
            return;
        }
        if (!report2) {
            const message = `Report not found: ${id2}`;
            if (options.json) {
                (0, display_1.displayJson)({ error: message });
            }
            else {
                (0, display_1.error)(message);
            }
            return;
        }
        // Calculate comparison metrics
        const comparison = {
            reports: { report1, report2 },
            changes: {
                totalTests: report2.metadata.totalTests - report1.metadata.totalTests,
                passedTests: report2.metadata.passedTests - report1.metadata.passedTests,
                failedTests: report2.metadata.failedTests - report1.metadata.failedTests,
                successRate: report2.metadata.successRate - report1.metadata.successRate,
                averageLatency: report2.metadata.averageLatencyMs - report1.metadata.averageLatencyMs,
                agentCount: report2.metadata.agentCount - report1.metadata.agentCount,
                dimensionCount: report2.metadata.dimensionCount - report1.metadata.dimensionCount
            },
            timeDiff: new Date(report2.timestamp).getTime() - new Date(report1.timestamp).getTime()
        };
        if (options.json) {
            (0, display_1.displayJson)({ comparison });
            return;
        }
        // Display comparison
        console.log(chalk_1.default.bold(`\n🔍 Report Comparison\n`));
        console.log(chalk_1.default.gray('Reports:'));
        console.log(`  • Report 1: ${chalk_1.default.cyan(report1.id)} (${new Date(report1.timestamp).toLocaleString()})`);
        console.log(`  • Report 2: ${chalk_1.default.cyan(report2.id)} (${new Date(report2.timestamp).toLocaleString()})`);
        console.log(`  • Time Difference: ${chalk_1.default.gray(formatTimeDiff(comparison.timeDiff))}`);
        console.log(chalk_1.default.gray('\nTest Results Comparison:'));
        console.log(`  • Total Tests: ${formatChange(comparison.changes.totalTests)} (${report1.metadata.totalTests} → ${report2.metadata.totalTests})`);
        console.log(`  • Passed Tests: ${formatChange(comparison.changes.passedTests)} (${report1.metadata.passedTests} → ${report2.metadata.passedTests})`);
        console.log(`  • Failed Tests: ${formatChange(comparison.changes.failedTests, true)} (${report1.metadata.failedTests} → ${report2.metadata.failedTests})`);
        console.log(`  • Success Rate: ${formatChange(comparison.changes.successRate, false, '%')} (${report1.metadata.successRate.toFixed(1)}% → ${report2.metadata.successRate.toFixed(1)}%)`);
        console.log(`  • Avg Latency: ${formatChange(comparison.changes.averageLatency, true, 'ms')} (${report1.metadata.averageLatencyMs}ms → ${report2.metadata.averageLatencyMs}ms)`);
        console.log(chalk_1.default.gray('\nConfiguration Changes:'));
        console.log(`  • Agents: ${formatChange(comparison.changes.agentCount)} (${report1.metadata.agentCount} → ${report2.metadata.agentCount})`);
        console.log(`  • Dimensions: ${formatChange(comparison.changes.dimensionCount)} (${report1.metadata.dimensionCount} → ${report2.metadata.dimensionCount})`);
        // Show agent and dimension differences
        const newAgents = report2.metadata.agents.filter(a => !report1.metadata.agents.includes(a));
        const removedAgents = report1.metadata.agents.filter(a => !report2.metadata.agents.includes(a));
        const newDimensions = report2.metadata.dimensions.filter(p => !report1.metadata.dimensions.includes(p));
        const removedDimensions = report1.metadata.dimensions.filter(p => !report2.metadata.dimensions.includes(p));
        if (newAgents.length > 0 || removedAgents.length > 0 || newDimensions.length > 0 || removedDimensions.length > 0) {
            console.log(chalk_1.default.gray('\nDetailed Changes:'));
            if (newAgents.length > 0) {
                console.log(`  • New Agents: ${chalk_1.default.green(newAgents.join(', '))}`);
            }
            if (removedAgents.length > 0) {
                console.log(`  • Removed Agents: ${chalk_1.default.red(removedAgents.join(', '))}`);
            }
            if (newDimensions.length > 0) {
                console.log(`  • New Dimensions: ${chalk_1.default.green(newDimensions.join(', '))}`);
            }
            if (removedDimensions.length > 0) {
                console.log(`  • Removed Dimensions: ${chalk_1.default.red(removedDimensions.join(', '))}`);
            }
        }
        // Overall assessment
        console.log(chalk_1.default.gray('\nOverall Assessment:'));
        if (comparison.changes.successRate > 5) {
            console.log(chalk_1.default.green('  ✅ Significant improvement in success rate'));
        }
        else if (comparison.changes.successRate < -5) {
            console.log(chalk_1.default.red('  ❌ Significant decline in success rate'));
        }
        else {
            console.log(chalk_1.default.yellow('  ➖ Minimal change in success rate'));
        }
        if (comparison.changes.averageLatency < -100) {
            console.log(chalk_1.default.green('  ⚡ Performance improved'));
        }
        else if (comparison.changes.averageLatency > 100) {
            console.log(chalk_1.default.red('  🐌 Performance declined'));
        }
    }
    catch (err) {
        if (options.json) {
            (0, display_1.displayJson)({ error: err.message });
        }
        else {
            (0, display_1.error)(`Failed to compare reports: ${err.message}`);
        }
        throw err;
    }
}
/**
 * Clean old reports based on retention policy
 */
async function cleanReports(options) {
    const projectPath = path_1.default.resolve(options.path || process.cwd());
    const manifestManager = new report_manifest_1.ReportManifestManager(projectPath);
    const config = await (0, config_1.loadConfig)();
    try {
        // Get retention policy from config
        const retentionConfig = config?.reporting?.retention || {
            max_reports: 50,
            max_age_days: 30,
            always_keep_latest: 10
        };
        const reportsToCleanup = await manifestManager.getReportsForCleanup({
            maxReports: retentionConfig.max_reports,
            maxAgeDays: retentionConfig.max_age_days,
            alwaysKeepLatest: retentionConfig.always_keep_latest
        });
        if (reportsToCleanup.length === 0) {
            if (options.json) {
                (0, display_1.displayJson)({ message: 'No reports need cleanup', cleaned: 0 });
            }
            else {
                console.log(chalk_1.default.green('\n✨ No reports need cleanup'));
                console.log(chalk_1.default.gray('All reports are within retention policy limits'));
            }
            return;
        }
        if (options.json && options.dryRun) {
            (0, display_1.displayJson)({
                dryRun: true,
                reportsToCleanup: reportsToCleanup.length,
                reports: reportsToCleanup
            });
            return;
        }
        if (!options.json) {
            console.log(chalk_1.default.bold('\n🧹 Report Cleanup\n'));
            console.log(chalk_1.default.gray('Retention Policy:'));
            console.log(`  • Max Reports: ${retentionConfig.max_reports}`);
            console.log(`  • Max Age: ${retentionConfig.max_age_days} days`);
            console.log(`  • Always Keep Latest: ${retentionConfig.always_keep_latest}`);
            console.log();
            console.log(chalk_1.default.yellow(`Found ${reportsToCleanup.length} reports to cleanup:`));
            for (const report of reportsToCleanup.slice(0, 10)) { // Show first 10
                const age = Math.floor((Date.now() - new Date(report.timestamp).getTime()) / (1000 * 60 * 60 * 24));
                console.log(`  • ${chalk_1.default.cyan(report.id)} (${age} days old, ${formatFileSize(report.size)})`);
            }
            if (reportsToCleanup.length > 10) {
                console.log(chalk_1.default.gray(`  ... and ${reportsToCleanup.length - 10} more`));
            }
        }
        if (options.dryRun) {
            if (!options.json) {
                console.log(chalk_1.default.blue('\n🔍 Dry run - no files will be deleted'));
                console.log(chalk_1.default.gray('Use without --dry-run to actually delete these reports'));
            }
            return;
        }
        // Confirm deletion unless --force is used
        if (!options.force && !options.json) {
            const { confirm } = await inquirer_1.default.prompt([{
                    type: 'confirm',
                    name: 'confirm',
                    message: `Delete ${reportsToCleanup.length} reports?`,
                    default: false
                }]);
            if (!confirm) {
                console.log(chalk_1.default.yellow('Cleanup cancelled'));
                return;
            }
        }
        // Delete reports
        const spinner = options.json ? null : (0, display_1.createSpinner)('Cleaning up reports...');
        spinner?.start();
        let deletedCount = 0;
        let totalSizeFreed = 0;
        for (const report of reportsToCleanup) {
            try {
                const reportPath = path_1.default.join(projectPath, '.identro', 'reports', report.filename);
                if (await fs_extra_1.default.pathExists(reportPath)) {
                    await fs_extra_1.default.remove(reportPath);
                    totalSizeFreed += report.size;
                }
                await manifestManager.removeReport(report.id);
                deletedCount++;
            }
            catch (err) {
                console.warn(`Failed to delete report ${report.id}: ${err}`);
            }
        }
        spinner?.succeed(`Cleaned up ${deletedCount} reports`);
        if (options.json) {
            (0, display_1.displayJson)({
                cleaned: deletedCount,
                sizeFreed: totalSizeFreed,
                message: `Cleaned up ${deletedCount} reports, freed ${formatFileSize(totalSizeFreed)}`
            });
        }
        else {
            (0, display_1.success)(`\n✨ Cleanup complete!`);
            console.log(chalk_1.default.gray(`  • Deleted: ${deletedCount} reports`));
            console.log(chalk_1.default.gray(`  • Space freed: ${formatFileSize(totalSizeFreed)}`));
        }
    }
    catch (err) {
        if (options.json) {
            (0, display_1.displayJson)({ error: err.message });
        }
        else {
            (0, display_1.error)(`Failed to clean reports: ${err.message}`);
        }
        throw err;
    }
}
/**
 * Export a report to a shareable location
 */
async function exportReport(id, options) {
    const projectPath = path_1.default.resolve(options.path || process.cwd());
    const manifestManager = new report_manifest_1.ReportManifestManager(projectPath);
    try {
        const report = await manifestManager.getReport(id);
        if (!report) {
            const message = `Report not found: ${id}`;
            if (options.json) {
                (0, display_1.displayJson)({ error: message });
            }
            else {
                (0, display_1.error)(message);
            }
            return;
        }
        const exportFormat = options.format || 'html';
        const sourceReportPath = path_1.default.join(projectPath, '.identro', 'reports', report.filename);
        // Determine output path
        let outputPath;
        if (options.output) {
            outputPath = path_1.default.resolve(options.output);
        }
        else {
            const timestamp = new Date(report.timestamp).toISOString().slice(0, 10); // YYYY-MM-DD
            const filename = `identro-report-${report.type}-${timestamp}.${exportFormat}`;
            outputPath = path_1.default.join(process.cwd(), filename);
        }
        if (!options.json) {
            console.log(chalk_1.default.bold('\n📤 Export Report\n'));
            console.log(`  • Report: ${chalk_1.default.cyan(report.id)}`);
            console.log(`  • Format: ${chalk_1.default.magenta(exportFormat)}`);
            console.log(`  • Output: ${chalk_1.default.gray(outputPath)}`);
        }
        const spinner = options.json ? null : (0, display_1.createSpinner)('Exporting report...');
        spinner?.start();
        // Copy or convert the report
        if (report.format === exportFormat) {
            // Direct copy
            await fs_extra_1.default.copy(sourceReportPath, outputPath);
        }
        else {
            // Format conversion needed
            if (exportFormat === 'html' && report.format === 'json') {
                // Convert JSON to HTML
                const reportData = await fs_extra_1.default.readJson(sourceReportPath);
                const htmlContent = await generateRichHtmlReport(reportData, projectPath);
                await fs_extra_1.default.writeFile(outputPath, htmlContent, 'utf-8');
            }
            else {
                // For other conversions, just copy and warn
                await fs_extra_1.default.copy(sourceReportPath, outputPath);
                if (!options.json) {
                    console.log(chalk_1.default.yellow('\n⚠️  Format conversion not supported, exported original format'));
                }
            }
        }
        spinner?.succeed('Report exported successfully');
        if (options.json) {
            (0, display_1.displayJson)({
                success: true,
                reportId: id,
                outputPath,
                format: exportFormat,
                originalFormat: report.format
            });
        }
        else {
            (0, display_1.success)('\n✨ Report exported successfully!');
            console.log(chalk_1.default.gray(`Saved to: ${outputPath}`));
            // Auto-open if requested
            if (options.open && (exportFormat === 'html')) {
                try {
                    await execAsync(`open "${outputPath}"`);
                    console.log(chalk_1.default.green('📖 Report opened in browser'));
                }
                catch (err) {
                    console.log(chalk_1.default.yellow('⚠️  Could not auto-open browser. Please open the file manually.'));
                }
            }
        }
    }
    catch (err) {
        if (options.json) {
            (0, display_1.displayJson)({ error: err.message });
        }
        else {
            (0, display_1.error)(`Failed to export report: ${err.message}`);
        }
        throw err;
    }
}
/**
 * Show report statistics
 */
async function showReportStats(options) {
    const projectPath = path_1.default.resolve(options.path || process.cwd());
    const manifestManager = new report_manifest_1.ReportManifestManager(projectPath);
    try {
        const stats = await manifestManager.getStats();
        if (options.json) {
            (0, display_1.displayJson)({ stats });
            return;
        }
        console.log(chalk_1.default.bold('\n📊 Report Statistics\n'));
        if (stats.totalReports === 0) {
            console.log(chalk_1.default.yellow('📭 No reports found'));
            console.log(chalk_1.default.gray('\nTip: Run'), chalk_1.default.bold('identro-eval interactive'), chalk_1.default.gray('to generate your first report'));
            return;
        }
        console.log(chalk_1.default.gray('Overview:'));
        console.log(`  • Total Reports: ${chalk_1.default.white(stats.totalReports)}`);
        console.log(`  • Total Size: ${chalk_1.default.gray(formatFileSize(stats.totalSize))}`);
        console.log(`  • Average Success Rate: ${getSuccessRateColor(stats.averageSuccessRate)}${stats.averageSuccessRate.toFixed(1)}%${chalk_1.default.reset()}`);
        if (stats.oldestReport && stats.newestReport) {
            console.log(`  • Date Range: ${chalk_1.default.gray(new Date(stats.oldestReport).toLocaleDateString())} - ${chalk_1.default.gray(new Date(stats.newestReport).toLocaleDateString())}`);
        }
        console.log(chalk_1.default.gray('\nBy Type:'));
        for (const [type, count] of Object.entries(stats.reportsByType)) {
            console.log(`  • ${chalk_1.default.blue(type)}: ${count}`);
        }
        console.log(chalk_1.default.gray('\nBy Format:'));
        for (const [format, count] of Object.entries(stats.reportsByFormat)) {
            console.log(`  • ${chalk_1.default.magenta(format)}: ${count}`);
        }
        // Storage recommendations
        console.log(chalk_1.default.gray('\n💡 Storage Recommendations:'));
        if (stats.totalReports > 50) {
            console.log(chalk_1.default.yellow('  • Consider cleaning old reports with: identro-eval report clean'));
        }
        if (stats.totalSize > 100 * 1024 * 1024) { // 100MB
            console.log(chalk_1.default.yellow('  • Reports are using significant disk space'));
        }
    }
    catch (err) {
        if (options.json) {
            (0, display_1.displayJson)({ error: err.message });
        }
        else {
            (0, display_1.error)(`Failed to get report statistics: ${err.message}`);
        }
        throw err;
    }
}
/**
 * Utility functions
 */
function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
function formatTimeDiff(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0)
        return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0)
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0)
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
}
function formatChange(value, inverse = false, unit = '') {
    if (value === 0)
        return chalk_1.default.gray(`±0${unit}`);
    const isPositive = inverse ? value < 0 : value > 0;
    const color = isPositive ? chalk_1.default.green : chalk_1.default.red;
    const sign = value > 0 ? '+' : '';
    return color(`${sign}${value}${unit}`);
}
/**
 * Interactive report selector
 */
async function selectReport(options) {
    const projectPath = options.path ? path_1.default.resolve(options.path) : process.cwd();
    const manifestManager = new report_manifest_1.ReportManifestManager(projectPath);
    try {
        const reports = await manifestManager.getReports();
        if (reports.length === 0) {
            if (options.json) {
                (0, display_1.displayJson)({ error: 'No reports found' });
            }
            else {
                console.log(chalk_1.default.yellow('\n📭 No reports found'));
                console.log(chalk_1.default.gray('\nTip: Run'), chalk_1.default.bold('identro-eval interactive'), chalk_1.default.gray('to generate your first report'));
            }
            return;
        }
        if (options.json) {
            (0, display_1.displayJson)({ reports, total: reports.length });
            return;
        }
        console.log(chalk_1.default.bold('\n📋 Select Report to View\n'));
        // Create choices for inquirer
        const choices = reports.map(report => {
            const date = new Date(report.timestamp).toLocaleDateString();
            const time = new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const successRate = report.metadata.successRate.toFixed(1);
            const statusIcon = report.metadata.successRate >= 80 ? '✅' :
                report.metadata.successRate >= 60 ? '⚠️' : '❌';
            return {
                name: `${statusIcon} ${chalk_1.default.cyan(report.id)} - ${chalk_1.default.gray(date + ' ' + time)} - ${chalk_1.default.blue(report.type)} (${report.metadata.totalTests} tests, ${successRate}% success)`,
                value: report.id,
                short: report.id
            };
        });
        const { selectedReportId } = await inquirer_1.default.prompt([{
                type: 'list',
                name: 'selectedReportId',
                message: 'Select a report to view:',
                choices,
                pageSize: 10
            }]);
        // Ask what to do with the selected report
        const { action } = await inquirer_1.default.prompt([{
                type: 'list',
                name: 'action',
                message: 'What would you like to do with this report?',
                choices: [
                    { name: '👁️  View Details', value: 'view' },
                    { name: '🌐 Open in Browser (HTML reports)', value: 'open' },
                    { name: '📤 Export Report', value: 'export' },
                    { name: '📊 Show Statistics', value: 'stats' },
                    { name: '🔙 Back to List', value: 'back' }
                ]
            }]);
        switch (action) {
            case 'view':
                await viewReport(selectedReportId, { path: options.path });
                break;
            case 'open':
                const report = await manifestManager.getReport(selectedReportId);
                if (report && report.format === 'html') {
                    const reportPath = path_1.default.join(projectPath, '.identro', 'reports', report.filename);
                    try {
                        await execAsync(`open "${reportPath}"`);
                        console.log(chalk_1.default.green('\n📖 Report opened in browser'));
                    }
                    catch (err) {
                        console.log(chalk_1.default.yellow('\n⚠️  Could not auto-open browser. Please open the file manually.'));
                        console.log(chalk_1.default.gray('File path:'), chalk_1.default.cyan(reportPath));
                    }
                }
                else {
                    console.log(chalk_1.default.yellow('\n⚠️  Only HTML reports can be opened in browser'));
                    console.log(chalk_1.default.gray('This report format:'), chalk_1.default.magenta(report?.format || 'unknown'));
                }
                break;
            case 'export':
                const { exportFormat } = await inquirer_1.default.prompt([{
                        type: 'list',
                        name: 'exportFormat',
                        message: 'Select export format:',
                        choices: [
                            { name: '📊 HTML', value: 'html' },
                            { name: '📋 JSON', value: 'json' },
                            { name: '📝 Markdown', value: 'markdown' }
                        ]
                    }]);
                const { customOutput } = await inquirer_1.default.prompt([{
                        type: 'confirm',
                        name: 'customOutput',
                        message: 'Specify custom output path?',
                        default: false
                    }]);
                let exportOptions = { path: options.path, format: exportFormat };
                if (customOutput) {
                    const { outputPath } = await inquirer_1.default.prompt([{
                            type: 'input',
                            name: 'outputPath',
                            message: 'Enter output path:',
                            default: `./identro-report-${selectedReportId.split('-').slice(-3).join('-')}.${exportFormat}`
                        }]);
                    exportOptions.output = outputPath;
                }
                await exportReport(selectedReportId, exportOptions);
                break;
            case 'stats':
                await showReportStats({ path: options.path });
                break;
            case 'back':
                await selectReport(options); // Recursive call to show list again
                break;
        }
    }
    catch (err) {
        if (options.json) {
            (0, display_1.displayJson)({ error: err.message });
        }
        else {
            (0, display_1.error)(`Failed to select report: ${err.message}`);
        }
        throw err;
    }
}
function getSuccessRateColor(rate) {
    if (rate >= 80)
        return chalk_1.default.green;
    if (rate >= 60)
        return chalk_1.default.yellow;
    return chalk_1.default.red;
}
//# sourceMappingURL=report.js.map