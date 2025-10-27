/**
 * DimensionMetadata - Helper service for dynamic dimension metadata
 *
 * Provides dimension-specific information without hardcoding, supporting
 * the plugin system architecture.
 */
/**
 * DimensionMetadataService - Provides dynamic dimension metadata
 */
export class DimensionMetadataService {
    registry;
    metadataCache = new Map();
    behaviorCache = new Map();
    constructor(registry) {
        this.registry = registry;
    }
    /**
     * Get display information for a dimension
     */
    async getDisplayInfo(dimensionName) {
        if (this.metadataCache.has(dimensionName)) {
            return this.metadataCache.get(dimensionName);
        }
        // Get dimension definition first
        const definition = await this.registry.getDimensionDefinition(dimensionName);
        if (!definition) {
            throw new Error(`Dimension '${dimensionName}' not found in registry`);
        }
        // Generate abbreviation from name (first letter of each word, max 2 chars)
        const abbreviation = this.generateAbbreviation(dimensionName);
        // Get symbol from metadata or use icon
        const symbol = this.getSymbolForDimension(definition.metadata.icon || '', dimensionName);
        // Build display name from metadata or generate from name
        const displayName = definition.metadata.displayName ||
            dimensionName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const displayInfo = {
            name: definition.name,
            displayName: displayName,
            icon: definition.metadata.icon || this.getSymbolForDimension('', dimensionName),
            symbol: symbol,
            abbreviation: abbreviation,
            description: definition.description,
            shortDescription: definition.short_description,
            category: definition.metadata.category,
        };
        this.metadataCache.set(dimensionName, displayInfo);
        return displayInfo;
    }
    /**
     * Get behavior flags for a dimension
     */
    async getBehavior(dimensionName) {
        if (this.behaviorCache.has(dimensionName)) {
            return this.behaviorCache.get(dimensionName);
        }
        const definition = await this.registry.getDimensionDefinition(dimensionName);
        if (!definition) {
            throw new Error(`Dimension '${dimensionName}' not found in registry`);
        }
        // Determine behavior from dimension definition and configuration
        // Multi-run support: Check if dimension has multi-run config or is consistency
        const supportsMultiRun = definition.configuration?.runs_per_input ?
            definition.configuration.runs_per_input > 1 :
            (dimensionName === 'consistency');
        const behavior = {
            supportsMultiRun: supportsMultiRun,
            defaultRunCount: definition.configuration?.runs_per_input ?? 3,
            hasSpecialMetrics: !!definition.settings?.metricThresholds,
            requiresCustomEvaluation: !!definition.settings?.evaluationSettings,
            category: definition.metadata.category,
        };
        this.behaviorCache.set(dimensionName, behavior);
        return behavior;
    }
    /**
     * Get all available dimensions with their display info
     */
    async getAllDimensionsDisplay() {
        const dimensions = await this.registry.getAvailableDimensions();
        const displayInfos = [];
        for (const dimensionName of dimensions) {
            try {
                const displayInfo = await this.getDisplayInfo(dimensionName);
                displayInfos.push(displayInfo);
            }
            catch (error) {
                console.warn(`Failed to get display info for dimension ${dimensionName}:`, error);
            }
        }
        return displayInfos;
    }
    /**
     * Get dimensions by category
     */
    async getDimensionsByCategory(category) {
        const allDimensions = await this.registry.getAvailableDimensions();
        const categoryDimensions = [];
        for (const dimensionName of allDimensions) {
            try {
                const definition = await this.registry.getDimensionDefinition(dimensionName);
                if (definition && definition.metadata.category === category) {
                    categoryDimensions.push(dimensionName);
                }
            }
            catch (error) {
                console.warn(`Failed to check category for dimension ${dimensionName}:`, error);
            }
        }
        return categoryDimensions;
    }
    /**
     * Check if a dimension supports multi-run
     */
    async supportsMultiRun(dimensionName) {
        const behavior = await this.getBehavior(dimensionName);
        return behavior.supportsMultiRun;
    }
    /**
     * Get default run count for a dimension
     */
    async getDefaultRunCount(dimensionName) {
        const behavior = await this.getBehavior(dimensionName);
        return behavior.defaultRunCount;
    }
    /**
     * Generate abbreviation from dimension name
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
     * Get symbol for dimension display
     */
    getSymbolForDimension(icon, name) {
        // Use icon as symbol, or map to Unicode symbol
        if (icon) {
            return icon;
        }
        // Fallback mapping for common dimensions
        const symbolMap = {
            'consistency': '🔄',
            'safety': '🛡️',
            'performance': '⚡',
            'completeness': '✓',
            'accuracy': '🎯',
            'relevance': '🔍',
            'format': '📋',
            'instruction-following': '📝',
            'compliance': '⚖️',
            'brand-voice': '🎨',
            'bias-fairness': '⚖️',
            'privacy': '🔒',
            'schema': '📋',
        };
        return symbolMap[name] || 'ℹ️';
    }
    /**
     * Clear caches (useful for testing or when dimensions are reloaded)
     */
    clearCache() {
        this.metadataCache.clear();
        this.behaviorCache.clear();
    }
}
/**
 * Create a DimensionMetadataService instance
 */
export function createDimensionMetadataService(registry) {
    return new DimensionMetadataService(registry);
}
//# sourceMappingURL=dimension-metadata.js.map