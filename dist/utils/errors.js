"use strict";
/**
 * Error handling utilities
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.FrameworkError = exports.LLMError = exports.ConfigError = exports.CLIError = void 0;
exports.setupErrorHandlers = setupErrorHandlers;
exports.handleError = handleError;
exports.withErrorHandling = withErrorHandling;
exports.formatError = formatError;
exports.isRetryableError = isRetryableError;
exports.retryWithBackoff = retryWithBackoff;
const chalk_1 = __importDefault(require("chalk"));
const display_1 = require("./display");
/**
 * Custom error classes
 */
class CLIError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'CLIError';
    }
}
exports.CLIError = CLIError;
class ConfigError extends CLIError {
    constructor(message, details) {
        super(message, 'CONFIG_ERROR', details);
        this.name = 'ConfigError';
    }
}
exports.ConfigError = ConfigError;
class LLMError extends CLIError {
    constructor(message, details) {
        super(message, 'LLM_ERROR', details);
        this.name = 'LLMError';
    }
}
exports.LLMError = LLMError;
class FrameworkError extends CLIError {
    constructor(message, details) {
        super(message, 'FRAMEWORK_ERROR', details);
        this.name = 'FrameworkError';
    }
}
exports.FrameworkError = FrameworkError;
class ValidationError extends CLIError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Setup global error handlers
 */
function setupErrorHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        console.error(chalk_1.default.red('\n✗ Unexpected error occurred:'));
        console.error(chalk_1.default.red(err.message));
        if (process.env.DEBUG) {
            console.error(chalk_1.default.gray(err.stack));
        }
        else {
            console.error(chalk_1.default.gray('Run with DEBUG=1 for more details'));
        }
        process.exit(1);
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error(chalk_1.default.red('\n✗ Unhandled promise rejection:'));
        console.error(chalk_1.default.red(reason?.message || reason));
        if (process.env.DEBUG) {
            console.error(chalk_1.default.gray(reason?.stack || ''));
        }
        process.exit(1);
    });
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
        console.log(chalk_1.default.yellow('\n\nInterrupted by user'));
        process.exit(0);
    });
    // Handle SIGTERM
    process.on('SIGTERM', () => {
        console.log(chalk_1.default.yellow('\n\nTerminated'));
        process.exit(0);
    });
}
/**
 * Handle CLI errors gracefully
 */
function handleError(err) {
    if (err instanceof CLIError) {
        (0, display_1.error)(err.message);
        if (err.details) {
            console.error(chalk_1.default.gray(`  ${err.details}`));
        }
        // Provide helpful suggestions based on error type
        if (err instanceof ConfigError) {
            console.log(chalk_1.default.yellow('\n💡 Try running: identro-eval init'));
        }
        else if (err instanceof LLMError) {
            console.log(chalk_1.default.yellow('\n💡 Try running: identro-eval llm test'));
        }
        else if (err instanceof FrameworkError) {
            console.log(chalk_1.default.yellow('\n💡 Make sure you have the correct framework installed'));
        }
        process.exit(1);
    }
    else if (err instanceof Error) {
        (0, display_1.error)(`Unexpected error: ${err.message}`);
        if (process.env.DEBUG) {
            console.error(chalk_1.default.gray(err.stack));
        }
        else {
            console.error(chalk_1.default.gray('Run with DEBUG=1 for more details'));
        }
        process.exit(1);
    }
    else {
        (0, display_1.error)('An unknown error occurred');
        console.error(err);
        process.exit(1);
    }
}
/**
 * Wrap async functions with error handling
 */
function withErrorHandling(fn) {
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
function formatError(err) {
    if (err instanceof Error) {
        return err.message;
    }
    return String(err);
}
/**
 * Check if error is retryable
 */
function isRetryableError(err) {
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
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
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
            console.log(chalk_1.default.yellow(`  Retrying in ${delay}ms... (attempt ${i + 2}/${maxRetries})`));
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
//# sourceMappingURL=errors.js.map