"use strict";
/**
 * Log Service
 *
 * Optional service for saving detailed execution logs to disk.
 * Enabled via config flag: ui.save_logs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class LogService {
    constructor(projectPath, config) {
        this.logStream = null;
        this.logsEnabled = config?.ui?.save_logs ?? false;
        this.logFilePath = '';
        if (this.logsEnabled) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            this.logFilePath = path_1.default.join(projectPath, '.identro', 'logs', `execution-${timestamp}.log`);
            // Create logs directory
            fs_extra_1.default.ensureDirSync(path_1.default.dirname(this.logFilePath));
            // Create write stream
            this.logStream = fs_extra_1.default.createWriteStream(this.logFilePath, { flags: 'a' });
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
exports.LogService = LogService;
//# sourceMappingURL=log-service.js.map