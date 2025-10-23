"use strict";
/**
 * Display utilities for CLI
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayBanner = displayBanner;
exports.createSpinner = createSpinner;
exports.success = success;
exports.error = error;
exports.warning = warning;
exports.info = info;
exports.section = section;
exports.subsection = subsection;
exports.listItem = listItem;
exports.createTable = createTable;
exports.displayKeyValue = displayKeyValue;
exports.displayProgress = displayProgress;
exports.displayJson = displayJson;
exports.displayCode = displayCode;
exports.displayTestResults = displayTestResults;
exports.displayAgents = displayAgents;
exports.displayLLMOptions = displayLLMOptions;
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
const boxen_1 = __importDefault(require("boxen"));
const ora_1 = __importDefault(require("ora"));
const cli_table3_1 = __importDefault(require("cli-table3"));
/**
 * Display the CLI banner
 */
function displayBanner() {
    console.log(chalk_1.default.cyan(figlet_1.default.textSync('Identro Eval', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
    })));
    console.log((0, boxen_1.default)(chalk_1.default.bold('🎯 AI Agent Evaluation Suite\n') +
        chalk_1.default.gray('Test and validate your AI agents with confidence'), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
    }));
}
/**
 * Create a spinner for long-running operations
 */
function createSpinner(text) {
    return (0, ora_1.default)({
        text,
        spinner: 'dots',
        color: 'cyan',
    });
}
/**
 * Display success message
 */
function success(message) {
    console.log(chalk_1.default.green('✓'), message);
}
/**
 * Display error message
 */
function error(message) {
    console.log(chalk_1.default.red('✗'), message);
}
/**
 * Display warning message
 */
function warning(message) {
    console.log(chalk_1.default.yellow('⚠'), message);
}
/**
 * Display info message
 */
function info(message) {
    console.log(chalk_1.default.blue('ℹ'), message);
}
/**
 * Display a section header
 */
function section(title) {
    console.log('\n' + chalk_1.default.bold.underline(title));
}
/**
 * Display a subsection
 */
function subsection(title) {
    console.log(chalk_1.default.gray('  ├─'), chalk_1.default.bold(title));
}
/**
 * Display a list item
 */
function listItem(text, indent = 2) {
    const spaces = ' '.repeat(indent);
    console.log(spaces + chalk_1.default.gray('•'), text);
}
/**
 * Create a table for displaying data
 */
function createTable(options) {
    return new cli_table3_1.default({
        style: {
            head: ['cyan'],
            border: ['gray'],
        },
        ...options,
    });
}
/**
 * Display key-value pairs
 */
function displayKeyValue(key, value, indent = 0) {
    const spaces = ' '.repeat(indent);
    console.log(spaces + chalk_1.default.gray(key + ':'), chalk_1.default.white(value));
}
/**
 * Display a progress bar
 */
function displayProgress(current, total, label) {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 20);
    const empty = 20 - filled;
    const bar = chalk_1.default.green('█'.repeat(filled)) + chalk_1.default.gray('░'.repeat(empty));
    const text = label ? `${label}: ` : '';
    console.log(`${text}[${bar}] ${percentage}% (${current}/${total})`);
}
/**
 * Display JSON output (for --json flag)
 */
function displayJson(data) {
    console.log(JSON.stringify(data, null, 2));
}
/**
 * Display a code block
 */
function displayCode(code, language) {
    const lines = code.split('\n');
    console.log(chalk_1.default.gray('```' + (language || '')));
    lines.forEach(line => console.log(chalk_1.default.white(line)));
    console.log(chalk_1.default.gray('```'));
}
/**
 * Display test results
 */
function displayTestResults(passed, failed, skipped = 0) {
    const total = passed + failed + skipped;
    console.log('\n' + chalk_1.default.bold('Test Results:'));
    console.log(chalk_1.default.green(`  ✓ ${passed} passed`));
    if (failed > 0) {
        console.log(chalk_1.default.red(`  ✗ ${failed} failed`));
    }
    if (skipped > 0) {
        console.log(chalk_1.default.gray(`  ○ ${skipped} skipped`));
    }
    const percentage = Math.round((passed / total) * 100);
    const color = percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red';
    console.log('\n' + chalk_1.default[color](`  Success rate: ${percentage}%`));
}
/**
 * Display discovered agents
 */
function displayAgents(agents) {
    const table = createTable({
        head: ['Agent Name', 'Type', 'Framework'],
        colWidths: [30, 20, 15],
    });
    agents.forEach(agent => {
        table.push([agent.name, agent.type, agent.framework]);
    });
    console.log(table.toString());
}
/**
 * Display LLM options
 */
function displayLLMOptions(llms) {
    console.log('\n' + chalk_1.default.bold('Available LLM Configurations:'));
    llms.forEach((llm, index) => {
        const statusIcon = llm.status === 'available' ? '✓' :
            llm.status === 'error' ? '✗' : '○';
        const statusColor = llm.status === 'available' ? 'green' :
            llm.status === 'error' ? 'red' : 'gray';
        console.log(`\n${chalk_1.default.bold(`${index + 1}.`)} ${chalk_1.default.cyan(llm.provider)} (${llm.model})`);
        console.log(`   Source: ${chalk_1.default.gray(llm.source)}`);
        console.log(`   Status: ${chalk_1.default[statusColor](statusIcon + ' ' + llm.status)}`);
        if (llm.cost) {
            console.log(`   Cost: ${chalk_1.default.yellow(llm.cost)}`);
        }
    });
}
//# sourceMappingURL=display.js.map