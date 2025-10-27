/**
 * Dimension File Loader
 *
 * Loads dimension definitions from YAML files in the .identro/dimensions/ directory
 * and provides them to dimension generators.
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { validateDimensionDefinitionSafe, createDefaultDimensionDefinition } from './dimension-definition';
export class DimensionFileLoader {
    dimensionsPath;
    createDefaults;
    cache = new Map();
    registeredGenerators = new Map();
    constructor(options) {
        this.dimensionsPath = path.join(options.projectPath, '.identro', 'dimensions');
        this.createDefaults = options.createDefaults ?? true;
    }
    /**
     * Register a dimension generator for creating default dimensions
     */
    registerGenerator(generator) {
        this.registeredGenerators.set(generator.name, generator);
    }
    /**
     * Register multiple dimension generators
     */
    registerGenerators(generators) {
        for (const generator of generators) {
            this.registerGenerator(generator);
        }
    }
    /**
     * Load a dimension definition by name
     */
    async loadDimension(dimensionName) {
        // Check cache first
        if (this.cache.has(dimensionName)) {
            return this.cache.get(dimensionName);
        }
        const dimensionFilePath = path.join(this.dimensionsPath, `${dimensionName}.yml`);
        try {
            // Check if dimension file exists
            if (!(await fs.pathExists(dimensionFilePath))) {
                if (this.createDefaults) {
                    // Create default dimension file if it doesn't exist
                    const defaultDimension = await this.createDefaultDimensionForName(dimensionName);
                    await this.saveDimension(dimensionName, defaultDimension);
                    this.cache.set(dimensionName, defaultDimension);
                    return defaultDimension;
                }
                return null;
            }
            // Read and parse YAML file
            const fileContent = await fs.readFile(dimensionFilePath, 'utf-8');
            const parsedContent = yaml.load(fileContent);
            // Validate dimension definition
            const validation = validateDimensionDefinitionSafe(parsedContent);
            if (!validation.success) {
                console.warn(`Invalid dimension definition in ${dimensionFilePath}:`, validation.errors?.message);
                if (this.createDefaults) {
                    // Fall back to default dimension
                    const defaultDimension = await this.createDefaultDimensionForName(dimensionName);
                    this.cache.set(dimensionName, defaultDimension);
                    return defaultDimension;
                }
                return null;
            }
            // Cache and return valid dimension
            const validDimension = validation.data;
            this.cache.set(dimensionName, validDimension);
            return validDimension;
        }
        catch (error) {
            console.warn(`Error loading dimension ${dimensionName}:`, error);
            if (this.createDefaults) {
                // Fall back to default dimension
                const defaultDimension = await this.createDefaultDimensionForName(dimensionName);
                this.cache.set(dimensionName, defaultDimension);
                return defaultDimension;
            }
            return null;
        }
    }
    /**
     * Load all available dimensions
     */
    async loadAllDimensions() {
        await this.ensureDimensionsDirectory();
        const dimensions = new Map();
        try {
            const files = await fs.readdir(this.dimensionsPath);
            const ymlFiles = files.filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
            for (const file of ymlFiles) {
                const dimensionName = path.basename(file, path.extname(file));
                const dimension = await this.loadDimension(dimensionName);
                if (dimension) {
                    dimensions.set(dimensionName, dimension);
                }
            }
            // Ensure default dimensions exist using core dimension definitions
            if (this.createDefaults) {
                const { loadCoreDimensionDefinitions } = await import('./dimension-registry');
                const coreDefinitions = await loadCoreDimensionDefinitions();
                for (const [dimensionName, definition] of coreDefinitions) {
                    if (!dimensions.has(dimensionName)) {
                        await this.saveDimension(dimensionName, definition);
                        dimensions.set(dimensionName, definition);
                    }
                }
            }
        }
        catch (error) {
            console.warn('Error loading dimensions directory:', error);
        }
        return dimensions;
    }
    /**
     * Save a dimension definition to file
     */
    async saveDimension(dimensionName, dimension) {
        await this.ensureDimensionsDirectory();
        const dimensionFilePath = path.join(this.dimensionsPath, `${dimensionName}.yml`);
        // Update metadata
        const updatedDimension = {
            ...dimension,
            metadata: {
                ...dimension.metadata,
                updated_at: new Date().toISOString(),
            },
        };
        // Convert to YAML with nice formatting
        const yamlContent = yaml.dump(updatedDimension, {
            indent: 2,
            lineWidth: 120,
            noRefs: true,
            sortKeys: false,
        });
        await fs.writeFile(dimensionFilePath, yamlContent, 'utf-8');
        // Update cache
        this.cache.set(dimensionName, updatedDimension);
    }
    /**
     * Check if a dimension file exists
     */
    async dimensionExists(dimensionName) {
        const dimensionFilePath = path.join(this.dimensionsPath, `${dimensionName}.yml`);
        return fs.pathExists(dimensionFilePath);
    }
    /**
     * Get the path to a dimension file
     */
    getDimensionFilePath(dimensionName) {
        return path.join(this.dimensionsPath, `${dimensionName}.yml`);
    }
    /**
     * Clear the dimension cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Ensure the dimensions directory exists
     */
    async ensureDimensionsDirectory() {
        await fs.ensureDir(this.dimensionsPath);
    }
    /**
     * Create a default dimension definition for a given dimension name
     * Uses core dimension definitions instead of removed generators
     */
    async createDefaultDimensionForName(dimensionName) {
        // Use core dimension definitions instead of generators
        try {
            const { loadCoreDimensionDefinitions } = await import('./dimension-registry');
            const coreDefinitions = await loadCoreDimensionDefinitions();
            const coreDefinition = coreDefinitions.get(dimensionName);
            if (coreDefinition) {
                return coreDefinition;
            }
        }
        catch (error) {
            console.warn(`Could not load core dimension definition for ${dimensionName}:`, error);
        }
        // Fallback to basic dimension definition
        return createDefaultDimensionDefinition(dimensionName, `${dimensionName.charAt(0).toUpperCase() + dimensionName.slice(1)} testing dimension`, `Test ${dimensionName} aspects`);
    }
}
//# sourceMappingURL=dimension-file-loader.js.map