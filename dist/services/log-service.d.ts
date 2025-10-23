/**
 * Log Service
 *
 * Optional service for saving detailed execution logs to disk.
 * Enabled via config flag: ui.save_logs
 */
export declare class LogService {
    private logsEnabled;
    private logFilePath;
    private logStream;
    constructor(projectPath: string, config: any);
    /**
     * Log a message to file
     */
    log(message: string, level?: string): void;
    /**
     * Close the log stream
     */
    close(): void;
    /**
     * Check if logs are enabled
     */
    isEnabled(): boolean;
    /**
     * Get the path to the log file
     */
    getLogFilePath(): string;
}
//# sourceMappingURL=log-service.d.ts.map