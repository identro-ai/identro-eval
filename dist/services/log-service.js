/**
 * Log Service
 *
 * Optional service for saving detailed execution logs to disk.
 * Enabled via config flag: ui.save_logs
 */
import fs from 'fs-extra';
import path from 'path';
export class LogService {
    constructor(projectPath, config) {
        this.logStream = null;
        this.logsEnabled = config?.ui?.save_logs ?? false;
        this.logFilePath = '';
        if (this.logsEnabled) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            this.logFilePath = path.join(projectPath, '.identro', 'logs', `execution-${timestamp}.log`);
            // Create logs directory
            fs.ensureDirSync(path.dirname(this.logFilePath));
            // Create write stream
            this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
            // Log initialization
            this.log('Log service initialized', 'info');
        }
    }
    /**
     * Log a message to file
     */
    log(message, level = 'info') {
        if (!this.logsEnabled || !this.logStream)
            return;
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
        this.logStream.write(logLine);
    }
    /**
     * Close the log stream
     */
    close() {
        if (this.logStream) {
            this.log('Log service closing', 'info');
            this.logStream.end();
            this.logStream = null;
        }
    }
    /**
     * Check if logs are enabled
     */
    isEnabled() {
        return this.logsEnabled;
    }
    /**
     * Get the path to the log file
     */
    getLogFilePath() {
        return this.logFilePath;
    }
}
//# sourceMappingURL=log-service.js.map