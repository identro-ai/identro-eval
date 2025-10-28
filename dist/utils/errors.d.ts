/**
 * Error handling utilities
 */
/**
 * Custom error classes
 */
export declare class CLIError extends Error {
    code: string;
    details?: string | undefined;
    constructor(message: string, code: string, details?: string | undefined);
}
export declare class ConfigError extends CLIError {
    constructor(message: string, details?: string);
}
export declare class LLMError extends CLIError {
    constructor(message: string, details?: string);
}
export declare class FrameworkError extends CLIError {
    constructor(message: string, details?: string);
}
export declare class ValidationError extends CLIError {
    constructor(message: string, details?: string);
}
/**
 * Setup global error handlers
 */
export declare function setupErrorHandlers(): void;
/**
 * Handle CLI errors gracefully
 */
export declare function handleError(err: unknown): void;
/**
 * Wrap async functions with error handling
 */
export declare function withErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T): T;
/**
 * Format error for display
 */
export declare function formatError(err: unknown): string;
/**
 * Check if error is retryable
 */
export declare function isRetryableError(err: unknown): boolean;
/**
 * Retry with exponential backoff
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number, baseDelay?: number): Promise<T>;
//# sourceMappingURL=errors.d.ts.map