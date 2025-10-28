"use strict";
/**
 * Report Manifest Manager
 *
 * Manages the manifest.json file that tracks all generated reports
 * with metadata for listing, comparison, and retention management.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportManifestManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class ReportManifestManager {
    constructor(projectPath) {
        this.reportsDir = path.join(projectPath, '.identro', 'reports');
        this.manifestPath = path.join(this.reportsDir, 'manifest.json');
    }
    /**
     * Initialize the manifest file if it doesn't exist
     */
    async initialize() {
        await fs.ensureDir(this.reportsDir);
        if (!await fs.pathExists(this.manifestPath)) {
            const manifest = {
                version: '1.0.0',
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                totalReports: 0,
                reports: []
            };
            await fs.writeJson(this.manifestPath, manifest, { spaces: 2 });
        }
    }
    /**
     * Load the manifest from disk
     */
    async load() {
        await this.initialize();
        return await fs.readJson(this.manifestPath);
    }
    /**
     * Save the manifest to disk
     */
    async save(manifest) {
        manifest.lastUpdated = new Date().toISOString();
        await fs.writeJson(this.manifestPath, manifest, { spaces: 2 });
    }
    /**
     * Add a new report to the manifest
     */
    async addReport(reportPath, format, type, results, options = {}) {
        const manifest = await this.load();
        const timestamp = new Date().toISOString();
        const filename = path.basename(reportPath);
        const id = this.generateReportId(timestamp, type);
        // Calculate metadata from results
        const metadata = this.calculateMetadata(results, options);
        // Get file size
        const stats = await fs.stat(reportPath);
        // Determine month folder
        const date = new Date(timestamp);
        const monthFolder = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const entry = {
            id,
            timestamp,
            filename,
            format,
            type,
            metadata,
            size: stats.size,
            monthFolder
        };
        manifest.reports.push(entry);
        manifest.totalReports = manifest.reports.length;
        await this.save(manifest);
        return id;
    }
    /**
     * Add a new report to the manifest using TestStateManager data for accurate counts
     */
    async addReportFromTestStateManager(reportPath, format, type, testStateManager, options = {}) {
        const manifest = await this.load();
        const timestamp = new Date().toISOString();
        const filename = path.basename(reportPath);
        const id = this.generateReportId(timestamp, type);
        // Calculate metadata from TestStateManager data for accurate counts
        const metadata = this.calculateMetadataFromTestStateManager(testStateManager, options);
        // Get file size
        const stats = await fs.stat(reportPath);
        // Determine month folder
        const date = new Date(timestamp);
        const monthFolder = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const entry = {
            id,
            timestamp,
            filename,
            format,
            type,
            metadata,
            size: stats.size,
            monthFolder
        };
        manifest.reports.push(entry);
        manifest.totalReports = manifest.reports.length;
        await this.save(manifest);
        return id;
    }
    /**
     * Get all reports, optionally filtered
     */
    async getReports(filter) {
        const manifest = await this.load();
        let reports = [...manifest.reports];
        // Apply filters
        if (filter) {
            if (filter.type) {
                reports = reports.filter(r => r.type === filter.type);
            }
            if (filter.format) {
                reports = reports.filter(r => r.format === filter.format);
            }
            if (filter.since) {
                reports = reports.filter(r => r.timestamp >= filter.since);
            }
            if (filter.until) {
                reports = reports.filter(r => r.timestamp <= filter.until);
            }
        }
        // Sort by timestamp (newest first)
        reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        // Apply limit
        if (filter?.limit) {
            reports = reports.slice(0, filter.limit);
        }
        return reports;
    }
    /**
     * Get a specific report by ID
     */
    async getReport(id) {
        const manifest = await this.load();
        return manifest.reports.find(r => r.id === id) || null;
    }
    /**
     * Remove a report from the manifest
     */
    async removeReport(id) {
        const manifest = await this.load();
        const index = manifest.reports.findIndex(r => r.id === id);
        if (index === -1) {
            return false;
        }
        manifest.reports.splice(index, 1);
        manifest.totalReports = manifest.reports.length;
        await this.save(manifest);
        return true;
    }
    /**
     * Get reports that should be cleaned up based on retention policy
     */
    async getReportsForCleanup(config) {
        const manifest = await this.load();
        const reports = [...manifest.reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const toCleanup = [];
        const now = new Date();
        // Always keep the latest N reports
        const alwaysKeep = config.alwaysKeepLatest || 10;
        const protectedReports = reports.slice(0, alwaysKeep);
        const candidatesForCleanup = reports.slice(alwaysKeep);
        for (const report of candidatesForCleanup) {
            let shouldCleanup = false;
            // Check max reports limit
            if (config.maxReports && reports.length > config.maxReports) {
                const excessCount = reports.length - config.maxReports;
                const reportIndex = reports.indexOf(report);
                if (reportIndex >= config.maxReports) {
                    shouldCleanup = true;
                }
            }
            // Check age limit
            if (config.maxAgeDays) {
                const reportDate = new Date(report.timestamp);
                const ageInDays = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
                if (ageInDays > config.maxAgeDays) {
                    shouldCleanup = true;
                }
            }
            if (shouldCleanup) {
                toCleanup.push(report);
            }
        }
        return toCleanup;
    }
    /**
     * Update report metadata (e.g., when compressed or archived)
     */
    async updateReport(id, updates) {
        const manifest = await this.load();
        const report = manifest.reports.find(r => r.id === id);
        if (!report) {
            return false;
        }
        Object.assign(report, updates);
        await this.save(manifest);
        return true;
    }
    /**
     * Get summary statistics
     */
    async getStats() {
        const manifest = await this.load();
        const reports = manifest.reports;
        if (reports.length === 0) {
            return {
                totalReports: 0,
                totalSize: 0,
                averageSuccessRate: 0,
                reportsByType: {},
                reportsByFormat: {}
            };
        }
        const totalSize = reports.reduce((sum, r) => sum + r.size, 0);
        const averageSuccessRate = reports.reduce((sum, r) => sum + r.metadata.successRate, 0) / reports.length;
        const sortedByDate = [...reports].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const reportsByType = {};
        const reportsByFormat = {};
        for (const report of reports) {
            reportsByType[report.type] = (reportsByType[report.type] || 0) + 1;
            reportsByFormat[report.format] = (reportsByFormat[report.format] || 0) + 1;
        }
        return {
            totalReports: reports.length,
            totalSize,
            oldestReport: sortedByDate[0]?.timestamp,
            newestReport: sortedByDate[sortedByDate.length - 1]?.timestamp,
            averageSuccessRate,
            reportsByType,
            reportsByFormat
        };
    }
    /**
     * Generate a unique report ID
     */
    generateReportId(timestamp, type) {
        const date = new Date(timestamp);
        const dateStr = date.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Remove milliseconds and Z
        return `${type}-${dateStr}`;
    }
    /**
     * Calculate metadata from test results
     */
    calculateMetadata(results, options) {
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        let totalLatency = 0;
        let testCount = 0;
        const agents = new Set();
        const dimensions = new Set();
        for (const [agentName, result] of results) {
            agents.add(agentName);
            totalTests += result.summary.totalTests;
            passedTests += result.summary.passed;
            failedTests += result.summary.failed;
            if (result.summary.averageLatencyMs) {
                totalLatency += result.summary.averageLatencyMs * result.summary.totalTests;
                testCount += result.summary.totalTests;
            }
            // Extract dimensions from result
            Object.keys(result.dimensions).forEach(dimension => dimensions.add(dimension));
        }
        const averageLatencyMs = testCount > 0 ? totalLatency / testCount : 0;
        const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
            averageLatencyMs: Math.round(averageLatencyMs),
            agentCount: agents.size,
            dimensionCount: dimensions.size,
            dimensions: Array.from(dimensions),
            agents: Array.from(agents),
            duration: options.duration,
            llmCalls: options.llmCalls,
            llmCost: options.llmCost
        };
    }
    /**
     * Calculate metadata from TestStateManager data for accurate counts
     */
    calculateMetadataFromTestStateManager(testStateManager, options) {
        const allTests = testStateManager.getAllTests();
        const completedTests = allTests.filter((test) => test.status === 'completed' || test.status === 'failed');
        // Count PARENT tests only (not individual runs) - same logic as terminal summary
        const parentTests = completedTests.filter((test) => !test.id.includes('-run'));
        const totalTests = parentTests.length;
        const passedTests = parentTests.filter((test) => test.status === 'completed').length;
        const failedTests = parentTests.filter((test) => test.status === 'failed').length;
        // Calculate average latency from all runs (including individual runs for accuracy)
        let totalLatency = 0;
        let runCount = 0;
        const agents = new Set();
        const dimensions = new Set();
        for (const test of completedTests) {
            agents.add(test.agentName);
            dimensions.add(test.dimension);
            if (test.latencyMs) {
                totalLatency += test.latencyMs;
                runCount++;
            }
        }
        const averageLatencyMs = runCount > 0 ? totalLatency / runCount : 0;
        const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
            averageLatencyMs: Math.round(averageLatencyMs),
            agentCount: agents.size,
            dimensionCount: dimensions.size,
            dimensions: Array.from(dimensions),
            agents: Array.from(agents),
            duration: options.duration,
            llmCalls: options.llmCalls,
            llmCost: options.llmCost
        };
    }
}
exports.ReportManifestManager = ReportManifestManager;
//# sourceMappingURL=report-manifest.js.map