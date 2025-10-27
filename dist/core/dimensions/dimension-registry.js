/**
 * Dimension Registry for Plugin-Compatible Architecture
 *
 * Provides dimension-specific requirements without hardcoding in LLM provider.
 * Supports dynamic plugin loading and dimension registration.
 * Now integrates with file-based dimension definitions.
 */
import { DimensionFileLoader } from './dimension-file-loader';
/**
 * Default dimension registry implementation with file-based dimension support
 */
export class DefaultDimensionRegistry {
    dimensions = new Map();
    dimensionLoader;
    dimensionDefinitions = new Map();
    register(generator) {
        this.dimensions.set(generator.name, generator);
    }
    get(name) {
        return this.dimensions.get(name);
    }
    async getAvailableDimensions() {
        // Combine registered generators and file-based dimensions
        const generatorDimensions = Array.from(this.dimensions.keys());
        if (this.dimensionLoader) {
            const fileDimensions = await this.dimensionLoader.loadAllDimensions();
            const fileDimensionNames = Array.from(fileDimensions.keys());
            // Merge and deduplicate
            const allDimensions = new Set([...generatorDimensions, ...fileDimensionNames]);
            return Array.from(allDimensions);
        }
        return generatorDimensions;
    }
    /**
     * Load dimension definitions from files
     */
    async loadDimensionDefinitions(projectPath) {
        this.dimensionLoader = new DimensionFileLoader({
            projectPath,
            createDefaults: true
        });
        // Load all dimension definitions
        const definitions = await this.dimensionLoader.loadAllDimensions();
        this.dimensionDefinitions = definitions;
    }
    /**
     * Get a dimension definition from file
     */
    async getDimensionDefinition(dimensionName) {
        if (this.dimensionDefinitions.has(dimensionName)) {
            return this.dimensionDefinitions.get(dimensionName);
        }
        if (this.dimensionLoader) {
            const definition = await this.dimensionLoader.loadDimension(dimensionName);
            if (definition) {
                this.dimensionDefinitions.set(dimensionName, definition);
            }
            return definition;
        }
        return null;
    }
    /**
     * Get dimension-specific requirements for LLM prompts
     * Now supports both file-based and generator-based dimensions
     * Includes optional context enrichment for better LLM understanding
     */
    async getRequirements(dimensionName) {
        // First try to get requirements from file-based dimension definition
        const dimensionDefinition = await this.getDimensionDefinition(dimensionName);
        if (dimensionDefinition) {
            let requirements = dimensionDefinition.prompts.agent_requirements;
            // Enrich with optional context if available (Phase 3 mini enhancement)
            if (dimensionDefinition.context) {
                const contextParts = [];
                if (dimensionDefinition.context.why_it_matters) {
                    contextParts.push(`\nWHY THIS DIMENSION MATTERS:\n${dimensionDefinition.context.why_it_matters}`);
                }
                if (dimensionDefinition.context.when_to_prioritize) {
                    contextParts.push(`\nWHEN TO PRIORITIZE:\n${dimensionDefinition.context.when_to_prioritize}`);
                }
                // Add any additional custom context fields
                for (const [key, value] of Object.entries(dimensionDefinition.context)) {
                    if (key !== 'why_it_matters' && key !== 'when_to_prioritize' && typeof value === 'string') {
                        contextParts.push(`\n${key.toUpperCase().replace(/_/g, ' ')}:\n${value}`);
                    }
                }
                // Prepend context to requirements for better LLM understanding
                if (contextParts.length > 0) {
                    requirements = contextParts.join('\n') + '\n\n' + requirements;
                }
            }
            return requirements;
        }
        // Fall back to generator-based requirements
        const generator = this.dimensions.get(dimensionName);
        // All dimensions MUST be either file-based or registered generators
        if (!generator) {
            throw new Error(`Dimension '${dimensionName}' not found in registry or dimension files. Available dimensions: ${(await this.getAvailableDimensions()).join(', ')}. Please ensure the dimension is defined in .identro/dimensions/ or registered as a generator.`);
        }
        // All generators MUST implement getDimensionRequirements - no fallbacks
        if (!('getDimensionRequirements' in generator) || typeof generator.getDimensionRequirements !== 'function') {
            throw new Error(`Dimension generator '${dimensionName}' does not implement getDimensionRequirements() method. All dimension generators must implement this method.`);
        }
        return generator.getDimensionRequirements();
    }
    /**
     * Get dimension description for UI display
     */
    async getDimensionDescription(dimensionName) {
        // First try file-based dimension
        const dimensionDefinition = await this.getDimensionDefinition(dimensionName);
        if (dimensionDefinition) {
            return dimensionDefinition.description;
        }
        // Fall back to generator
        const generator = this.dimensions.get(dimensionName);
        if (!generator) {
            throw new Error(`Dimension '${dimensionName}' not found in registry or dimension files.`);
        }
        return generator.description;
    }
    /**
     * Get dimension short description for UI display
     */
    async getDimensionShortDescription(dimensionName) {
        // First try file-based dimension
        const dimensionDefinition = await this.getDimensionDefinition(dimensionName);
        if (dimensionDefinition) {
            return dimensionDefinition.short_description;
        }
        // Fall back to generator
        const generator = this.dimensions.get(dimensionName);
        if (!generator) {
            throw new Error(`Dimension '${dimensionName}' not found in registry or dimension files.`);
        }
        return generator.shortDescription;
    }
    /**
     * Get all dimensions with their descriptions for UI display
     */
    async getDimensionsWithDescriptions() {
        const results = [];
        const availableDimensions = await this.getAvailableDimensions();
        for (const dimensionName of availableDimensions) {
            try {
                const description = await this.getDimensionDescription(dimensionName);
                const shortDescription = await this.getDimensionShortDescription(dimensionName);
                results.push({
                    name: dimensionName,
                    description,
                    shortDescription,
                });
            }
            catch (error) {
                console.warn(`Error loading dimension ${dimensionName}:`, error);
            }
        }
        return results;
    }
    /**
     * Get dimension metadata for UI display
     */
    async getDimensionMetadata(dimensionName) {
        const dimensionDefinition = await this.getDimensionDefinition(dimensionName);
        if (!dimensionDefinition) {
            return null;
        }
        // Helper to convert dimension name to display name
        const toDisplayName = (name) => {
            return name
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };
        // Default icons by category
        const defaultIcons = {
            consistency: '🔄',
            safety: '🛡️',
            performance: '⚡',
            completeness: '✓',
            accuracy: '🎯',
            relevance: '🔍',
            format: '📋',
            'instruction-following': '📝',
            compliance: '⚖️',
            'brand-voice': '🎨',
            'bias-fairness': '⚖️',
            privacy: '🔒',
        };
        return {
            name: dimensionName,
            displayName: dimensionDefinition.metadata.displayName || toDisplayName(dimensionName),
            category: dimensionDefinition.metadata.category,
            icon: dimensionDefinition.metadata.icon || defaultIcons[dimensionName] || 'ℹ️',
            description: dimensionDefinition.description,
            shortDescription: dimensionDefinition.short_description,
        };
    }
    /**
     * Get all dimensions with metadata for UI rendering
     */
    async getAllDimensionsMetadata() {
        const dimensions = await this.getAvailableDimensions();
        const metadata = [];
        for (const dimensionName of dimensions) {
            const meta = await this.getDimensionMetadata(dimensionName);
            if (meta) {
                metadata.push(meta);
            }
        }
        return metadata;
    }
    /**
     * Get dimensions by category
     */
    async getDimensionsByCategory(category) {
        const allMetadata = await this.getAllDimensionsMetadata();
        return allMetadata
            .filter(meta => meta.category === category)
            .map(meta => meta.name);
    }
    /**
     * Load plugins from directory (future enhancement)
     */
    async loadPlugins(pluginDir) {
        // Future implementation for loading external dimension plugins
        console.log(`Plugin loading from ${pluginDir} not yet implemented`);
    }
}
/**
 * Create and initialize dimension registry with core dimensions
 */
export function createDimensionRegistry() {
    const registry = new DefaultDimensionRegistry();
    // Core dimensions will be registered by their respective generators
    // This allows each generator to define its own requirements
    return registry;
}
/**
 * Load core dimension definitions from their respective files
 */
export async function loadCoreDimensionDefinitions() {
    const definitions = new Map();
    // Import core dimensions (3) - existing dimensions
    try {
        const { CONSISTENCY_DIMENSION_DEFINITION } = await import('./consistency');
        definitions.set('consistency', CONSISTENCY_DIMENSION_DEFINITION);
    }
    catch (error) {
        console.error('Failed to load consistency dimension:', error);
    }
    try {
        const { SAFETY_DIMENSION_DEFINITION } = await import('./safety');
        definitions.set('safety', SAFETY_DIMENSION_DEFINITION);
    }
    catch (error) {
        console.error('Failed to load safety dimension:', error);
    }
    try {
        const { PERFORMANCE_DIMENSION_DEFINITION } = await import('./performance');
        definitions.set('performance', PERFORMANCE_DIMENSION_DEFINITION);
    }
    catch (error) {
        console.error('Failed to load performance dimension:', error);
    }
    // Import quality dimensions (5) - new dimensions
    try {
        const { COMPLETENESS_DIMENSION_DEFINITION } = await import('./completeness');
        definitions.set('completeness', COMPLETENESS_DIMENSION_DEFINITION);
    }
    catch (error) {
        console.error('Failed to load completeness dimension:', error);
    }
    try {
        const { ACCURACY_DIMENSION_DEFINITION } = await import('./accuracy');
        definitions.set('accuracy', ACCURACY_DIMENSION_DEFINITION);
    }
    catch (error) {
        console.error('Failed to load accuracy dimension:', error);
    }
    try {
        const { RELEVANCE_DIMENSION_DEFINITION } = await import('./relevance');
        definitions.set('relevance', RELEVANCE_DIMENSION_DEFINITION);
    }
    catch (error) {
        console.error('Failed to load relevance dimension:', error);
    }
    try {
        const { FORMAT_DIMENSION_DEFINITION } = await import('./format');
        definitions.set('format', FORMAT_DIMENSION_DEFINITION);
    }
    catch (error) {
        console.error('Failed to load format dimension:', error);
    }
    try {
        const { INSTRUCTION_FOLLOWING_DIMENSION_DEFINITION } = await import('./instruction-following');
        definitions.set('instruction-following', INSTRUCTION_FOLLOWING_DIMENSION_DEFINITION);
    }
    catch (error) {
        console.error('Failed to load instruction-following dimension:', error);
    }
    // Import enterprise dimensions (4) - new dimensions
    try {
        const { COMPLIANCE_DIMENSION_DEFINITION } = await import('./compliance');
        definitions.set('compliance', COMPLIANCE_DIMENSION_DEFINITION);
    }
    catch (error) {
        console.error('Failed to load compliance dimension:', error);
    }
    try {
        const { BRAND_VOICE_DIMENSION_DEFINITION } = await import('./brand-voice');
        definitions.set('brand-voice', BRAND_VOICE_DIMENSION_DEFINITION);
    }
    catch (error) {
        console.error('Failed to load brand-voice dimension:', error);
    }
    try {
        const { BIAS_FAIRNESS_DIMENSION_DEFINITION } = await import('./bias-fairness');
        definitions.set('bias-fairness', BIAS_FAIRNESS_DIMENSION_DEFINITION);
    }
    catch (error) {
        console.error('Failed to load bias-fairness dimension:', error);
    }
    try {
        const { PRIVACY_DIMENSION_DEFINITION } = await import('./privacy');
        definitions.set('privacy', PRIVACY_DIMENSION_DEFINITION);
    }
    catch (error) {
        console.error('Failed to load privacy dimension:', error);
    }
    // Silently return definitions - caller can log if needed
    return definitions;
}
//# sourceMappingURL=dimension-registry.js.map