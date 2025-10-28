/**
 * Dimension Registry for Plugin-Compatible Architecture
 *
 * Provides dimension-specific requirements without hardcoding in LLM provider.
 * Supports dynamic plugin loading and dimension registration.
 * Now integrates with file-based dimension definitions.
 */
import { DimensionGenerator } from '../orchestration/types';
import { DimensionDefinition } from './dimension-definition';
/**
 * Dimension registry interface for plugin support
 */
export interface DimensionRegistry {
    getRequirements(dimensionName: string): Promise<string>;
    getAvailableDimensions(): Promise<string[]>;
    register(generator: DimensionGenerator): void;
    get(name: string): DimensionGenerator | undefined;
    getDimensionDefinition(dimensionName: string): Promise<DimensionDefinition | null>;
    loadDimensionDefinitions(projectPath: string): Promise<void>;
}
/**
 * Default dimension registry implementation with file-based dimension support
 */
export declare class DefaultDimensionRegistry implements DimensionRegistry {
    private dimensions;
    private dimensionLoader?;
    private dimensionDefinitions;
    register(generator: DimensionGenerator): void;
    get(name: string): DimensionGenerator | undefined;
    getAvailableDimensions(): Promise<string[]>;
    /**
     * Load dimension definitions from files
     */
    loadDimensionDefinitions(projectPath: string): Promise<void>;
    /**
     * Get a dimension definition from file
     */
    getDimensionDefinition(dimensionName: string): Promise<DimensionDefinition | null>;
    /**
     * Get dimension-specific requirements for LLM prompts
     * Now supports both file-based and generator-based dimensions
     * Includes optional context enrichment for better LLM understanding
     */
    getRequirements(dimensionName: string): Promise<string>;
    /**
     * Get dimension description for UI display
     */
    getDimensionDescription(dimensionName: string): Promise<string>;
    /**
     * Get dimension short description for UI display
     */
    getDimensionShortDescription(dimensionName: string): Promise<string>;
    /**
     * Get all dimensions with their descriptions for UI display
     */
    getDimensionsWithDescriptions(): Promise<Array<{
        name: string;
        description: string;
        shortDescription: string;
    }>>;
    /**
     * Get dimension metadata for UI display
     */
    getDimensionMetadata(dimensionName: string): Promise<{
        name: string;
        displayName: string;
        category: 'core' | 'quality' | 'enterprise';
        icon: string;
        description: string;
        shortDescription: string;
    } | null>;
    /**
     * Get all dimensions with metadata for UI rendering
     */
    getAllDimensionsMetadata(): Promise<Array<{
        name: string;
        displayName: string;
        category: 'core' | 'quality' | 'enterprise';
        icon: string;
        description: string;
        shortDescription: string;
    }>>;
    /**
     * Get dimensions by category
     */
    getDimensionsByCategory(category: 'core' | 'quality' | 'enterprise'): Promise<string[]>;
    /**
     * Load plugins from directory (future enhancement)
     */
    loadPlugins(pluginDir: string): Promise<void>;
}
/**
 * Create and initialize dimension registry with core dimensions
 */
export declare function createDimensionRegistry(): DimensionRegistry;
/**
 * Load core dimension definitions from their respective files
 */
export declare function loadCoreDimensionDefinitions(): Promise<Map<string, DimensionDefinition>>;
//# sourceMappingURL=dimension-registry.d.ts.map