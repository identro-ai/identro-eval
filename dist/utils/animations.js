"use strict";
/**
 * Enhanced Animation Utilities for Rich Terminal UI
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.animations = exports.AnimatedDisplay = void 0;
const chalk_1 = __importDefault(require("chalk"));
const figures_1 = __importDefault(require("figures"));
const log_update_1 = __importDefault(require("log-update"));
const cli_cursor_1 = __importDefault(require("cli-cursor"));
const cli_spinners_1 = __importDefault(require("cli-spinners"));
const ansi_escapes_1 = __importDefault(require("ansi-escapes"));
// @ts-ignore - chalk-animation doesn't have types
const chalk_animation_1 = __importDefault(require("chalk-animation"));
class AnimatedDisplay {
    constructor() {
        this.animation = null;
    }
    /**
     * Show animated success message
     */
    success(message, duration = 1500) {
        return new Promise((resolve) => {
            const frames = [
                chalk_1.default.green(`${figures_1.default.tick} ${message}`),
                chalk_1.default.green.bold(`${figures_1.default.tick} ${message}`),
                chalk_1.default.greenBright.bold(`${figures_1.default.tick} ${message} ✨`),
            ];
            let i = 0;
            const interval = setInterval(() => {
                (0, log_update_1.default)(frames[i % frames.length]);
                i++;
            }, 150);
            setTimeout(() => {
                clearInterval(interval);
                log_update_1.default.done();
                resolve();
            }, duration);
        });
    }
    /**
     * Show animated error message
     */
    error(message, duration = 2000) {
        return new Promise((resolve) => {
            const frames = [
                chalk_1.default.red(`${figures_1.default.cross} ${message}`),
                chalk_1.default.red.bold(`${figures_1.default.cross} ${message}`),
                chalk_1.default.redBright.bold(`${figures_1.default.cross} ${message} ${figures_1.default.warning}`),
            ];
            let i = 0;
            const interval = setInterval(() => {
                (0, log_update_1.default)(frames[i % frames.length]);
                i++;
            }, 200);
            setTimeout(() => {
                clearInterval(interval);
                log_update_1.default.done();
                resolve();
            }, duration);
        });
    }
    /**
     * Show rainbow text animation
     */
    rainbow(text, duration = 2000) {
        return new Promise((resolve) => {
            this.animation = chalk_animation_1.default.rainbow(text);
            setTimeout(() => {
                this.animation.stop();
                resolve();
            }, duration);
        });
    }
    /**
     * Show pulse animation
     */
    pulse(text, duration = 2000) {
        return new Promise((resolve) => {
            this.animation = chalk_animation_1.default.pulse(text);
            setTimeout(() => {
                this.animation.stop();
                resolve();
            }, duration);
        });
    }
    /**
     * Show glitch animation
     */
    glitch(text, duration = 1500) {
        return new Promise((resolve) => {
            this.animation = chalk_animation_1.default.glitch(text);
            setTimeout(() => {
                this.animation.stop();
                resolve();
            }, duration);
        });
    }
    /**
     * Show loading animation with custom spinner
     */
    loading(text, spinnerName = 'dots12') {
        const spinner = cli_spinners_1.default[spinnerName];
        let i = 0;
        cli_cursor_1.default.hide();
        const interval = setInterval(() => {
            const frame = spinner.frames[i % spinner.frames.length];
            (0, log_update_1.default)(`${chalk_1.default.cyan(frame)} ${text}`);
            i++;
        }, spinner.interval);
        return {
            stop: () => {
                clearInterval(interval);
                log_update_1.default.clear();
                cli_cursor_1.default.show();
            },
            update: (newText) => {
                text = newText;
            }
        };
    }
    /**
     * Show progress bar with animation
     */
    progressBar(current, total, label = '') {
        const percentage = Math.min(100, Math.round((current / total) * 100));
        const barLength = 30;
        const filled = Math.round((percentage / 100) * barLength);
        const empty = barLength - filled;
        const bar = chalk_1.default.cyan('█').repeat(filled) + chalk_1.default.gray('░').repeat(empty);
        const percentageText = chalk_1.default.bold(`${percentage}%`);
        const colors = [chalk_1.default.cyan, chalk_1.default.cyanBright, chalk_1.default.blue, chalk_1.default.blueBright];
        const color = colors[Math.floor(percentage / 25)];
        (0, log_update_1.default)(`${label ? chalk_1.default.gray(label + ': ') : ''}[${bar}] ${color(percentageText)}`);
        if (percentage === 100) {
            setTimeout(() => log_update_1.default.done(), 500);
        }
    }
    /**
     * Clear the screen with animation
     */
    clearScreen() {
        process.stdout.write(ansi_escapes_1.default.clearScreen);
    }
    /**
     * Show typing animation
     */
    async typeWriter(text, delay = 50) {
        cli_cursor_1.default.hide();
        for (let i = 0; i <= text.length; i++) {
            (0, log_update_1.default)(text.substring(0, i) + (i < text.length ? '▋' : ''));
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        log_update_1.default.done();
        cli_cursor_1.default.show();
    }
    /**
     * Show countdown animation
     */
    async countdown(seconds, message = 'Starting in') {
        for (let i = seconds; i > 0; i--) {
            const display = chalk_1.default.bold.cyan(`${message} ${i}...`);
            (0, log_update_1.default)(display);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        log_update_1.default.clear();
    }
}
exports.AnimatedDisplay = AnimatedDisplay;
exports.animations = new AnimatedDisplay();
//# sourceMappingURL=animations.js.map