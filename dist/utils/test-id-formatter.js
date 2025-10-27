/**
 * Test ID Formatter
 *
 * Provides simplified, user-friendly test identification formats
 * for display in the CLI interface.
 *
 * Now supports dynamic dimension abbreviations from DimensionMetadataService.
 */
export class TestIdFormatter {
    constructor() {
        this.dimensionCache = new Map();
    }
    /**
     * Initialize with DimensionMetadataService for dynamic abbreviations
     */
    setMetadataService(service) {
        this.metadataService = service;
    }
    /**
     * Load dimension abbreviations into cache
     */
    async loadDimensionAbbreviations(dimensions) {
        if (!this.metadataService)
            return;
        for (const dimension of dimensions) {
            try {
                const displayInfo = await this.metadataService.getDisplayInfo(dimension);
                this.dimensionCache.set(dimension.toLowerCase(), displayInfo.abbreviation);
            }
            catch (error) {
                // Fallback to first letter if dimension not found
                this.dimensionCache.set(dimension.toLowerCase(), dimension[0].toUpperCase());
            }
        }
    }
    /**
     * Format a single run test
     * Example: [C1] for Consistency test 1
     */
    formatSingleRun(dimension, index) {
        const prefix = this.getDimensionPrefix(dimension);
        return `[${prefix}${index + 1}]`;
    }
    /**
     * Format a multi-run test
     * Example: [C1 ×3] for Consistency test 1 with 3 runs
     */
    formatMultiRun(dimension, index, runCount) {
        const prefix = this.getDimensionPrefix(dimension);
        return `[${prefix}${index + 1} ×${runCount}]`;
    }
    /**
     * Format progress for a multi-run test
     * Example: [C1 2/3] for Consistency test 1, run 2 of 3
     */
    formatProgress(dimension, index, current, total) {
        const prefix = this.getDimensionPrefix(dimension);
        return `[${prefix}${index + 1} ${current}/${total}]`;
    }
    /**
     * Format a variation test
     * Example: [C1-V] for Consistency test 1 with variations
     */
    formatVariation(dimension, index, variationIndex) {
        const prefix = this.getDimensionPrefix(dimension);
        const base = `${prefix}${index + 1}`;
        if (variationIndex !== undefined) {
            return `[${base}-V${variationIndex + 1}]`;
        }
        return `[${base}-V]`;
    }
    /**
     * Format evaluation status
     * Example: [C1 🧠] for test being evaluated
     */
    formatEvaluating(dimension, index) {
        const prefix = this.getDimensionPrefix(dimension);
        return `[${prefix}${index + 1} 🧠]`;
    }
    /**
     * Get dimension prefix - uses cache from DimensionMetadataService if available
     */
    getDimensionPrefix(dimension) {
        const lowerDim = dimension.toLowerCase();
        // Try cache first (loaded from DimensionMetadataService)
        if (this.dimensionCache.has(lowerDim)) {
            return this.dimensionCache.get(lowerDim);
        }
        // Fallback: generate abbreviation from dimension name
        return this.generateAbbreviation(dimension);
    }
    /**
     * Generate abbreviation from dimension name (fallback method)
     */
    generateAbbreviation(name) {
        const parts = name.split('-');
        if (parts.length === 1) {
            // Single word: take first 2 chars
            return name.substring(0, 2).toUpperCase();
        }
        else {
            // Multiple words: take first letter of first 2 words
            return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase();
        }
    }
    /**
     * Parse a test ID back to its components
     * Now uses dynamic cache to reverse-lookup dimensions
     */
    parseTestId(testId) {
        const match = testId.match(/\[([A-Z]+)(\d+)(?:\s*×(\d+)|\s*(\d+)\/(\d+)|-V(\d+)?|🧠)?\]/);
        if (!match) {
            return {};
        }
        const [, prefix, indexStr, multiRunCount, currentRun, totalRuns, variationIndex] = match;
        // Build reverse map from cache
        const reverseMap = new Map();
        for (const [dimension, abbrev] of this.dimensionCache) {
            reverseMap.set(abbrev, dimension);
        }
        return {
            dimension: reverseMap.get(prefix),
            index: parseInt(indexStr) - 1,
            isMultiRun: !!multiRunCount,
            runCount: multiRunCount ? parseInt(multiRunCount) : undefined,
            currentRun: currentRun ? parseInt(currentRun) : undefined,
            totalRuns: totalRuns ? parseInt(totalRuns) : undefined,
            isVariation: testId.includes('-V'),
            variationIndex: variationIndex ? parseInt(variationIndex) - 1 : undefined
        };
    }
    /**
     * Format a test name with its ID
     */
    formatTestName(testId, testName) {
        return `${testId} ${testName}`;
    }
    /**
     * Format test status with emoji
     */
    formatStatus(testId, status) {
        const statusEmoji = {
            'queued': '⏳',
            'running': '🚀',
            'evaluating': '🧠',
            'completed': '✅',
            'failed': '❌'
        };
        return `${statusEmoji[status]} ${testId}`;
    }
}
// Export singleton instance for convenience
export const testIdFormatter = new TestIdFormatter();
//# sourceMappingURL=test-id-formatter.js.map