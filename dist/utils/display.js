/**
 * Display utilities for CLI
 */
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import ora from 'ora';
import Table from 'cli-table3';
/**
 * Display the CLI banner
 */
export function displayBanner() {
    console.log(chalk.cyan(figlet.textSync('Identro Eval', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
    })));
    console.log(boxen(chalk.bold('🎯 AI Agent Evaluation Suite\n') +
        chalk.gray('Test and validate your AI agents with confidence'), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
    }));
}
/**
 * Create a spinner for long-running operations
 */
export function createSpinner(text) {
    return ora({
        text,
        spinner: 'dots',
        color: 'cyan',
    });
}
/**
 * Display success message
 */
export function success(message) {
    console.log(chalk.green('✓'), message);
}
/**
 * Display error message
 */
export function error(message) {
    console.log(chalk.red('✗'), message);
}
/**
 * Display warning message
 */
export function warning(message) {
    console.log(chalk.yellow('⚠'), message);
}
/**
 * Display info message
 */
export function info(message) {
    console.log(chalk.blue('ℹ'), message);
}
/**
 * Display a section header
 */
export function section(title) {
    console.log('\n' + chalk.bold.underline(title));
}
/**
 * Display a subsection
 */
export function subsection(title) {
    console.log(chalk.gray('  ├─'), chalk.bold(title));
}
/**
 * Display a list item
 */
export function listItem(text, indent = 2) {
    const spaces = ' '.repeat(indent);
    console.log(spaces + chalk.gray('•'), text);
}
/**
 * Create a table for displaying data
 */
export function createTable(options) {
    return new Table({
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
export function displayKeyValue(key, value, indent = 0) {
    const spaces = ' '.repeat(indent);
    console.log(spaces + chalk.gray(key + ':'), chalk.white(value));
}
/**
 * Display a progress bar
 */
export function displayProgress(current, total, label) {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 20);
    const empty = 20 - filled;
    const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    const text = label ? `${label}: ` : '';
    console.log(`${text}[${bar}] ${percentage}% (${current}/${total})`);
}
/**
 * Display JSON output (for --json flag)
 */
export function displayJson(data) {
    console.log(JSON.stringify(data, null, 2));
}
/**
 * Display a code block
 */
export function displayCode(code, language) {
    const lines = code.split('\n');
    console.log(chalk.gray('```' + (language || '')));
    lines.forEach(line => console.log(chalk.white(line)));
    console.log(chalk.gray('```'));
}
/**
 * Display test results
 */
export function displayTestResults(passed, failed, skipped = 0) {
    const total = passed + failed + skipped;
    console.log('\n' + chalk.bold('Test Results:'));
    console.log(chalk.green(`  ✓ ${passed} passed`));
    if (failed > 0) {
        console.log(chalk.red(`  ✗ ${failed} failed`));
    }
    if (skipped > 0) {
        console.log(chalk.gray(`  ○ ${skipped} skipped`));
    }
    const percentage = Math.round((passed / total) * 100);
    const color = percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red';
    console.log('\n' + chalk[color](`  Success rate: ${percentage}%`));
}
/**
 * Display discovered agents
 */
export function displayAgents(agents) {
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
export function displayLLMOptions(llms) {
    console.log('\n' + chalk.bold('Available LLM Configurations:'));
    llms.forEach((llm, index) => {
        const statusIcon = llm.status === 'available' ? '✓' :
            llm.status === 'error' ? '✗' : '○';
        const statusColor = llm.status === 'available' ? 'green' :
            llm.status === 'error' ? 'red' : 'gray';
        console.log(`\n${chalk.bold(`${index + 1}.`)} ${chalk.cyan(llm.provider)} (${llm.model})`);
        console.log(`   Source: ${chalk.gray(llm.source)}`);
        console.log(`   Status: ${chalk[statusColor](statusIcon + ' ' + llm.status)}`);
        if (llm.cost) {
            console.log(`   Cost: ${chalk.yellow(llm.cost)}`);
        }
    });
}
//# sourceMappingURL=display.js.map