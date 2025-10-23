"use strict";
/**
 * Update notification utilities
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForUpdates = checkForUpdates;
exports.forceUpdateCheck = forceUpdateCheck;
exports.getCurrentVersion = getCurrentVersion;
exports.displayVersion = displayVersion;
const update_notifier_1 = __importDefault(require("update-notifier"));
const chalk_1 = __importDefault(require("chalk"));
const boxen_1 = __importDefault(require("boxen"));
/**
 * Check for CLI updates
 */
function checkForUpdates() {
    try {
        // Import package.json for version info
        const pkg = require('../../package.json');
        // Create notifier
        const notifier = (0, update_notifier_1.default)({
            pkg,
            updateCheckInterval: 1000 * 60 * 60 * 24, // 1 day
        });
        // Check if update is available
        if (notifier.update) {
            const { current, latest } = notifier.update;
            const message = chalk_1.default.yellow('Update available: ') +
                chalk_1.default.gray(current) +
                chalk_1.default.yellow(' → ') +
                chalk_1.default.green(latest) +
                '\n' +
                chalk_1.default.cyan('Run ') +
                chalk_1.default.bold('npm install -g @identro/eval-cli') +
                chalk_1.default.cyan(' to update');
            console.log((0, boxen_1.default)(message, {
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
            console.error(chalk_1.default.gray('Failed to check for updates:', error));
        }
    }
}
/**
 * Force check for updates (used in update command)
 */
async function forceUpdateCheck() {
    try {
        const pkg = require('../../package.json');
        const notifier = (0, update_notifier_1.default)({
            pkg,
            updateCheckInterval: 0, // Force check
        });
        // Wait for check to complete
        await notifier.fetchInfo();
        if (notifier.update) {
            const { current, latest } = notifier.update;
            console.log(chalk_1.default.yellow('\n📦 Update available!'));
            console.log(chalk_1.default.gray(`  Current version: ${current}`));
            console.log(chalk_1.default.green(`  Latest version:  ${latest}`));
            console.log('\n' + chalk_1.default.cyan('To update, run:'));
            console.log(chalk_1.default.bold('  npm install -g @identro/eval-cli'));
            return true;
        }
        else {
            console.log(chalk_1.default.green('✓ You are using the latest version'));
            return false;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to check for updates:'), error);
        return false;
    }
}
/**
 * Get current version
 */
function getCurrentVersion() {
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
function displayVersion() {
    const version = getCurrentVersion();
    console.log(chalk_1.default.cyan(`Identro Eval CLI v${version}`));
}
//# sourceMappingURL=updates.js.map