/**
 * Report Manifest Manager
 *
 * Manages the manifest.json file that tracks all generated reports
 * with metadata for listing, comparison, and retention management.
 */
import { TestResults } from '@identro/eval-core';
export interface ReportManifestEntry {
    id: string;
    timestamp: string;
    filename: string;
    format: 'html' | 'json' | 'markdown';
    type: 'interactive' | 'cli' | 'watch' | 'ci';
    metadata: {
        totalTests: number;
        passedTests: number;
        failedTests: number;
        successRate: number;
        averageLatencyMs: number;
        agentCount: number;
        dimensionCount: number;
        dimensions: string[];
        agents: string[];
        duration?: number;
        llmCalls?: number;
        llmCost?: number;
    };
    size: number;
    compressed?: boolean;
    archived?: boolean;
    monthFolder?: string;
}
export interface ReportManifest {
    version: string;
    created: string;
    lastUpdated: string;
    totalReports: number;
    reports: ReportManifestEntry[];
}
export declare class ReportManifestManager {
    private manifestPath;
    private reportsDir;
    constructor(projectPath: string);
    /**
     * Initialize the manifest file if it doesn't exist
     */
    initialize(): Promise<void>;
    /**
     * Load the manifest from disk
     */
    load(): Promise<ReportManifest>;
    /**
     * Save the manifest to disk
     */
    save(manifest: ReportManifest): Promise<void>;
    /**
     * Add a new report to the manifest
     */
    addReport(reportPath: string, format: 'html' | 'json' | 'markdown', type: 'interactive' | 'cli' | 'watch' | 'ci', results: Map<string, TestResults>, options?: {
        duration?: number;
        llmCalls?: number;
        llmCost?: number;
    }): Promise<string>;
    /**
     * Add a new report to the manifest using TestStateManager data for accurate counts
     */
    addReportFromTestStateManager(reportPath: string, format: 'html' | 'json' | 'markdown', type: 'interactive' | 'cli' | 'watch' | 'ci', testStateManager: any, options?: {
        duration?: number;
        llmCalls?: number;
        llmCost?: number;
    }): Promise<string>;
    /**
     * Get all reports, optionally filtered
     */
    getReports(filter?: {
        type?: string;
        format?: string;
        since?: string;
        until?: string;
        limit?: number;
    }): Promise<ReportManifestEntry[]>;
    /**
     * Get a specific report by ID
     */
    getReport(id: string): Promise<ReportManifestEntry | null>;
    /**
     * Remove a report from the manifest
     */
    removeReport(id: string): Promise<boolean>;
    /**
     * Get reports that should be cleaned up based on retention policy
     */
    getReportsForCleanup(config: {
        maxReports?: number;
        maxAgeDays?: number;
        alwaysKeepLatest?: number;
    }): Promise<ReportManifestEntry[]>;
    /**
     * Update report metadata (e.g., when compressed or archived)
     */
    updateReport(id: string, updates: Partial<ReportManifestEntry>): Promise<boolean>;
    /**
     * Get summary statistics
     */
    getStats(): Promise<{
        totalReports: number;
        totalSize: number;
        oldestReport?: string;
        newestReport?: string;
        averageSuccessRate: number;
        reportsByType: Record<string, number>;
        reportsByFormat: Record<string, number>;
    }>;
    /**
     * Generate a unique report ID
     */
    private generateReportId;
    /**
     * Calculate metadata from test results
     */
    private calculateMetadata;
    /**
     * Calculate metadata from TestStateManager data for accurate counts
     */
    private calculateMetadataFromTestStateManager;
}
//# sourceMappingURL=report-manifest.d.ts.map