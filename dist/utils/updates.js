/**
 * Update notification utilities
 */
import updateNotifier from 'update-notifier';
import chalk from 'chalk';
import boxen from 'boxen';
/**
 * Check for CLI updates
 */
export function checkForUpdates() {
    try {
        // Import package.json for version info
        const pkg = require('../../package.json');
        // Create notifier
        const notifier = updateNotifier({
            pkg,
            updateCheckInterval: 1000 * 60 * 60 * 24, // 1 day
        });
        // Check if update is available
        if (notifier.update) {
            const { current, latest } = notifier.update;
            const message = chalk.yellow('Update available: ') +
                chalk.gray(current) +
                chalk.yellow(' → ') +
                chalk.green(latest) +
                '\n' +
                chalk.cyan('Run ') +
                chalk.bold('npm install -g @identro/eval-cli') +
                chalk.cyan(' to update');
            console.log(boxen(message, {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'yellow',
            }));
        }
    }
    catch (error) {
        // Silently ignore update check errors
        if (process.env.DEBUG) {
            console.error(chalk.gray('Failed to check for updates:', error));
        }
    }
}
/**
 * Force check for updates (used in update command)
 */
export async function forceUpdateCheck() {
    try {
        const pkg = require('../../package.json');
        const notifier = updateNotifier({
            pkg,
            updateCheckInterval: 0, // Force check
        });
        // Wait for check to complete
        await notifier.fetchInfo();
        if (notifier.update) {
            const { current, latest } = notifier.update;
            console.log(chalk.yellow('\n📦 Update available!'));
            console.log(chalk.gray(`  Current version: ${current}`));
            console.log(chalk.green(`  Latest version:  ${latest}`));
            console.log('\n' + chalk.cyan('To update, run:'));
            console.log(chalk.bold('  npm install -g @identro/eval-cli'));
            return true;
        }
        else {
            console.log(chalk.green('✓ You are using the latest version'));
            return false;
        }
    }
    catch (error) {
        console.error(chalk.red('Failed to check for updates:'), error);
        return false;
    }
}
/**
 * Get current version
 */
export function getCurrentVersion() {
    try {
        const pkg = require('../../package.json');
        return pkg.version;
    }
    catch {
        return 'unknown';
    }
}
/**
 * Display version information
 */
export function displayVersion() {
    const version = getCurrentVersion();
    console.log(chalk.cyan(`Identro Eval CLI v${version}`));
}
//# sourceMappingURL=updates.js.map