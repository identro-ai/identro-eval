/**
 * DimensionMetadata - Helper service for dynamic dimension metadata
 *
 * Provides dimension-specific information without hardcoding, supporting
 * the plugin system architecture.
 */
import { DimensionRegistry } from './dimension-registry';
/**
 * Dimension behavior flags loaded from dimension definitions
 */
export interface DimensionBehavior {
    supportsMultiRun: boolean;
    defaultRunCount: number;
    hasSpecialMetrics: boolean;
    requiresCustomEvaluation: boolean;
    category: 'core' | 'quality' | 'enterprise';
}
/**
 * Dimension display metadata
 */
export interface DimensionDisplayInfo {
    name: string;
    displayName: string;
    icon: string;
    symbol: string;
    abbreviation: string;
    description: string;
    shortDescription: string;
    category: 'core' | 'quality' | 'enterprise';
}
/**
 * DimensionMetadataService - Provides dynamic dimension metadata
 */
export declare class DimensionMetadataService {
    private registry;
    private metadataCache;
    private behaviorCache;
    constructor(registry: DimensionRegistry);
    /**
     * Get display information for a dimension
     */
    getDisplayInfo(dimensionName: string): Promise<DimensionDisplayInfo>;
    /**
     * Get behavior flags for a dimension
     */
    getBehavior(dimensionName: string): Promise<DimensionBehavior>;
    /**
     * Get all available dimensions with their display info
     */
    getAllDimensionsDisplay(): Promise<DimensionDisplayInfo[]>;
    /**
     * Get dimensions by category
     */
    getDimensionsByCategory(category: 'core' | 'quality' | 'enterprise'): Promise<string[]>;
    /**
     * Check if a dimension supports multi-run
     */
    supportsMultiRun(dimensionName: string): Promise<boolean>;
    /**
     * Get default run count for a dimension
     */
    getDefaultRunCount(dimensionName: string): Promise<number>;
    /**
     * Generate abbreviation from dimension name
     */
    private generateAbbreviation;
    /**
     * Get symbol for dimension display
     */
    private getSymbolForDimension;
    /**
     * Clear caches (useful for testing or when dimensions are reloaded)
     */
    clearCache(): void;
}
/**
 * Create a DimensionMetadataService instance
 */
export declare function createDimensionMetadataService(registry: DimensionRegistry): DimensionMetadataService;
//# sourceMappingURL=dimension-metadata.d.ts.map