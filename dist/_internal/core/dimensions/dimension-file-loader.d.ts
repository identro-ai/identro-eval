/**
 * Dimension File Loader
 *
 * Loads dimension definitions from YAML files in the .identro/dimensions/ directory
 * and provides them to dimension generators.
 */
import { DimensionDefinition } from './dimension-definition';
import { DimensionGenerator } from '../orchestration/types';
export interface DimensionFileLoaderOptions {
    projectPath: string;
    createDefaults?: boolean;
}
export declare class DimensionFileLoader {
    private dimensionsPath;
    private createDefaults;
    private cache;
    private registeredGenerators;
    constructor(options: DimensionFileLoaderOptions);
    /**
     * Register a dimension generator for creating default dimensions
     */
    registerGenerator(generator: DimensionGenerator): void;
    /**
     * Register multiple dimension generators
     */
    registerGenerators(generators: DimensionGenerator[]): void;
    /**
     * Load a dimension definition by name
     */
    loadDimension(dimensionName: string): Promise<DimensionDefinition | null>;
    /**
     * Load all available dimensions
     */
    loadAllDimensions(): Promise<Map<string, DimensionDefinition>>;
    /**
     * Save a dimension definition to file
     */
    saveDimension(dimensionName: string, dimension: DimensionDefinition): Promise<void>;
    /**
     * Check if a dimension file exists
     */
    dimensionExists(dimensionName: string): Promise<boolean>;
    /**
     * Get the path to a dimension file
     */
    getDimensionFilePath(dimensionName: string): string;
    /**
     * Clear the dimension cache
     */
    clearCache(): void;
    /**
     * Ensure the dimensions directory exists
     */
    private ensureDimensionsDirectory;
    /**
     * Create a default dimension definition for a given dimension name
     * Uses core dimension definitions instead of removed generators
     */
    private createDefaultDimensionForName;
}
//# sourceMappingURL=dimension-file-loader.d.ts.map