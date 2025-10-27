/**
 * Error handling utilities
 */
import chalk from 'chalk';
import { error } from './display';
/**
 * Custom error classes
 */
export class CLIError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'CLIError';
    }
}
export class ConfigError extends CLIError {
    constructor(message, details) {
        super(message, 'CONFIG_ERROR', details);
        this.name = 'ConfigError';
    }
}
export class LLMError extends CLIError {
    constructor(message, details) {
        super(message, 'LLM_ERROR', details);
        this.name = 'LLMError';
    }
}
export class FrameworkError extends CLIError {
    constructor(message, details) {
        super(message, 'FRAMEWORK_ERROR', details);
        this.name = 'FrameworkError';
    }
}
export class ValidationError extends CLIError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}
/**
 * Setup global error handlers
 */
export function setupErrorHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        console.error(chalk.red('\n✗ Unexpected error occurred:'));
        console.error(chalk.red(err.message));
        if (process.env.DEBUG) {
            console.error(chalk.gray(err.stack));
        }
        else {
            console.error(chalk.gray('Run with DEBUG=1 for more details'));
        }
        process.exit(1);
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error(chalk.red('\n✗ Unhandled promise rejection:'));
        console.error(chalk.red(reason?.message || reason));
        if (process.env.DEBUG) {
            console.error(chalk.gray(reason?.stack || ''));
        }
        process.exit(1);
    });
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n\nInterrupted by user'));
        process.exit(0);
    });
    // Handle SIGTERM
    process.on('SIGTERM', () => {
        console.log(chalk.yellow('\n\nTerminated'));
        process.exit(0);
    });
}
/**
 * Handle CLI errors gracefully
 */
export function handleError(err) {
    if (err instanceof CLIError) {
        error(err.message);
        if (err.details) {
            console.error(chalk.gray(`  ${err.details}`));
        }
        // Provide helpful suggestions based on error type
        if (err instanceof ConfigError) {
            console.log(chalk.yellow('\n💡 Try running: identro-eval init'));
        }
        else if (err instanceof LLMError) {
            console.log(chalk.yellow('\n💡 Try running: identro-eval llm test'));
        }
        else if (err instanceof FrameworkError) {
            console.log(chalk.yellow('\n💡 Make sure you have the correct framework installed'));
        }
        process.exit(1);
    }
    else if (err instanceof Error) {
        error(`Unexpected error: ${err.message}`);
        if (process.env.DEBUG) {
            console.error(chalk.gray(err.stack));
        }
        else {
            console.error(chalk.gray('Run with DEBUG=1 for more details'));
        }
        process.exit(1);
    }
    else {
        error('An unknown error occurred');
        console.error(err);
        process.exit(1);
    }
}
/**
 * Wrap async functions with error handling
 */
export function withErrorHandling(fn) {
    return (async (...args) => {
        try {
            return await fn(...args);
        }
        catch (err) {
            handleError(err);
        }
    });
}
/**
 * Format error for display
 */
export function formatError(err) {
    if (err instanceof Error) {
        return err.message;
    }
    return String(err);
}
/**
 * Check if error is retryable
 */
export function isRetryableError(err) {
    if (err instanceof Error) {
        const message = err.message.toLowerCase();
        return (message.includes('timeout') ||
            message.includes('econnrefused') ||
            message.includes('enotfound') ||
            message.includes('rate limit') ||
            message.includes('429'));
    }
    return false;
}
/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (err) {
            lastError = err;
            if (!isRetryableError(err) || i === maxRetries - 1) {
                throw err;
            }
            const delay = baseDelay * Math.pow(2, i);
            console.log(chalk.yellow(`  Retrying in ${delay}ms... (attempt ${i + 2}/${maxRetries})`));
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
//# sourceMappingURL=errors.js.map