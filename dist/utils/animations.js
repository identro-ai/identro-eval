/**
 * Enhanced Animation Utilities for Rich Terminal UI
 */
import chalk from 'chalk';
import figures from 'figures';
import logUpdate from 'log-update';
import cliCursor from 'cli-cursor';
import cliSpinners from 'cli-spinners';
import ansiEscapes from 'ansi-escapes';
// @ts-ignore - chalk-animation doesn't have types
import chalkAnimation from 'chalk-animation';
export class AnimatedDisplay {
    constructor() {
        this.animation = null;
    }
    /**
     * Show animated success message
     */
    success(message, duration = 1500) {
        return new Promise((resolve) => {
            const frames = [
                chalk.green(`${figures.tick} ${message}`),
                chalk.green.bold(`${figures.tick} ${message}`),
                chalk.greenBright.bold(`${figures.tick} ${message} ✨`),
            ];
            let i = 0;
            const interval = setInterval(() => {
                logUpdate(frames[i % frames.length]);
                i++;
            }, 150);
            setTimeout(() => {
                clearInterval(interval);
                logUpdate.done();
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
                chalk.red(`${figures.cross} ${message}`),
                chalk.red.bold(`${figures.cross} ${message}`),
                chalk.redBright.bold(`${figures.cross} ${message} ${figures.warning}`),
            ];
            let i = 0;
            const interval = setInterval(() => {
                logUpdate(frames[i % frames.length]);
                i++;
            }, 200);
            setTimeout(() => {
                clearInterval(interval);
                logUpdate.done();
                resolve();
            }, duration);
        });
    }
    /**
     * Show rainbow text animation
     */
    rainbow(text, duration = 2000) {
        return new Promise((resolve) => {
            this.animation = chalkAnimation.rainbow(text);
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
            this.animation = chalkAnimation.pulse(text);
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
            this.animation = chalkAnimation.glitch(text);
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
        const spinner = cliSpinners[spinnerName];
        let i = 0;
        cliCursor.hide();
        const interval = setInterval(() => {
            const frame = spinner.frames[i % spinner.frames.length];
            logUpdate(`${chalk.cyan(frame)} ${text}`);
            i++;
        }, spinner.interval);
        return {
            stop: () => {
                clearInterval(interval);
                logUpdate.clear();
                cliCursor.show();
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
        const bar = chalk.cyan('█').repeat(filled) + chalk.gray('░').repeat(empty);
        const percentageText = chalk.bold(`${percentage}%`);
        const colors = [chalk.cyan, chalk.cyanBright, chalk.blue, chalk.blueBright];
        const color = colors[Math.floor(percentage / 25)];
        logUpdate(`${label ? chalk.gray(label + ': ') : ''}[${bar}] ${color(percentageText)}`);
        if (percentage === 100) {
            setTimeout(() => logUpdate.done(), 500);
        }
    }
    /**
     * Clear the screen with animation
     */
    clearScreen() {
        process.stdout.write(ansiEscapes.clearScreen);
    }
    /**
     * Show typing animation
     */
    async typeWriter(text, delay = 50) {
        cliCursor.hide();
        for (let i = 0; i <= text.length; i++) {
            logUpdate(text.substring(0, i) + (i < text.length ? '▋' : ''));
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        logUpdate.done();
        cliCursor.show();
    }
    /**
     * Show countdown animation
     */
    async countdown(seconds, message = 'Starting in') {
        for (let i = seconds; i > 0; i--) {
            const display = chalk.bold.cyan(`${message} ${i}...`);
            logUpdate(display);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        logUpdate.clear();
    }
}
export const animations = new AnimatedDisplay();
//# sourceMappingURL=animations.js.map