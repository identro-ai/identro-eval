/**
 * Report Organizer
 *
 * Handles consistent report naming, organization, and symlink management
 * for the historical reporting system.
 */
import { TestResults } from '@identro/eval-core';
export interface ReportOrganizationConfig {
    organizeByMonth: boolean;
    createSymlinks: boolean;
    compressOld: boolean;
    compressAfterDays: number;
}
export declare class ReportOrganizer {
    private projectPath;
    private reportsDir;
    private manifestManager;
    constructor(projectPath: string);
    /**
     * Generate a consistent report filename
     */
    generateReportFilename(type: 'interactive' | 'cli' | 'watch' | 'ci', format: 'html' | 'json' | 'markdown', timestamp?: Date): string;
    /**
     * Get the organized path for a report (with monthly folders if enabled)
     */
    getOrganizedPath(filename: string, timestamp: Date, config: ReportOrganizationConfig): string;
    /**
     * Save a report with proper organization and tracking
     */
    saveReport(content: string, type: 'interactive' | 'cli' | 'watch' | 'ci', format: 'html' | 'json' | 'markdown', results: Map<string, TestResults>, options?: {
        timestamp?: Date;
        duration?: number;
        llmCalls?: number;
        llmCost?: number;
        config?: ReportOrganizationConfig;
    }): Promise<{
        reportPath: string;
        reportId: string;
    }>;
    /**
     * Create symlinks to the latest reports
     */
    createSymlinks(reportPath: string, format: 'html' | 'json' | 'markdown', type: 'interactive' | 'cli' | 'watch' | 'ci'): Promise<void>;
    /**
     * Organize existing reports into monthly folders
     */
    organizeExistingReports(): Promise<{
        organized: number;
        errors: string[];
    }>;
    /**
     * Compress old reports to save space
     */
    compressOldReports(olderThanDays?: number): Promise<{
        compressed: number;
        spaceFreed: number;
        errors: string[];
    }>;
    /**
     * Create a report index HTML file for easy browsing
     */
    createReportIndex(): Promise<string>;
    /**
     * Clean up broken symlinks
     */
    cleanupBrokenSymlinks(): Promise<number>;
    /**
     * Get report file path from manifest entry
     */
    getReportPath(report: any): string;
    /**
     * Migrate reports to new organization structure
     */
    migrateToNewStructure(): Promise<{
        migrated: number;
        errors: string[];
    }>;
    /**
     * Format file size helper
     */
    private formatFileSize;
}
//# sourceMappingURL=report-organizer.d.ts.map