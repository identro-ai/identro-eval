/**
 * Test ID Formatter
 *
 * Provides simplified, user-friendly test identification formats
 * for display in the CLI interface.
 *
 * Now supports dynamic dimension abbreviations from DimensionMetadataService.
 */
import { DimensionMetadataService } from '@identro/eval-core';
export declare class TestIdFormatter {
    private dimensionCache;
    private metadataService?;
    /**
     * Initialize with DimensionMetadataService for dynamic abbreviations
     */
    setMetadataService(service: DimensionMetadataService): void;
    /**
     * Load dimension abbreviations into cache
     */
    loadDimensionAbbreviations(dimensions: string[]): Promise<void>;
    /**
     * Format a single run test
     * Example: [C1] for Consistency test 1
     */
    formatSingleRun(dimension: string, index: number): string;
    /**
     * Format a multi-run test
     * Example: [C1 ×3] for Consistency test 1 with 3 runs
     */
    formatMultiRun(dimension: string, index: number, runCount: number): string;
    /**
     * Format progress for a multi-run test
     * Example: [C1 2/3] for Consistency test 1, run 2 of 3
     */
    formatProgress(dimension: string, index: number, current: number, total: number): string;
    /**
     * Format a variation test
     * Example: [C1-V] for Consistency test 1 with variations
     */
    formatVariation(dimension: string, index: number, variationIndex?: number): string;
    /**
     * Format evaluation status
     * Example: [C1 🧠] for test being evaluated
     */
    formatEvaluating(dimension: string, index: number): string;
    /**
     * Get dimension prefix - uses cache from DimensionMetadataService if available
     */
    private getDimensionPrefix;
    /**
     * Generate abbreviation from dimension name (fallback method)
     */
    private generateAbbreviation;
    /**
     * Parse a test ID back to its components
     * Now uses dynamic cache to reverse-lookup dimensions
     */
    parseTestId(testId: string): {
        dimension?: string;
        index?: number;
        isMultiRun?: boolean;
        runCount?: number;
        currentRun?: number;
        totalRuns?: number;
        isVariation?: boolean;
        variationIndex?: number;
    };
    /**
     * Format a test name with its ID
     */
    formatTestName(testId: string, testName: string): string;
    /**
     * Format test status with emoji
     */
    formatStatus(testId: string, status: 'queued' | 'running' | 'evaluating' | 'completed' | 'failed'): string;
}
export declare const testIdFormatter: TestIdFormatter;
//# sourceMappingURL=test-id-formatter.d.ts.map