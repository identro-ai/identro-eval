/**
 * Shared dimension context and utilities
 * Centralizes common dimension documentation sections and validation
 */
/**
 * Dimension context template structure
 */
export interface DimensionContextTemplate {
    what_it_is: string;
    why_it_matters: string;
    when_to_prioritize: string;
    common_failures: string;
    relationship_to_other_dimensions: string;
    real_world_examples: string;
}
/**
 * Developer guidance template structure
 */
export interface DeveloperGuidanceTemplate {
    when_to_use: string;
    when_to_skip: string;
    how_to_improve: string;
    testing_strategy: string;
}
/**
 * Dimension metadata template structure
 */
export interface DimensionMetadataTemplate {
    version: string;
    created_at: string;
    updated_at: string;
    tags: string[];
    complexity: 'basic' | 'moderate' | 'advanced';
    author: string;
    category: 'core' | 'quality' | 'safety' | 'performance';
    impact?: {
        user_impact: 'high' | 'medium' | 'low';
        business_impact: 'high' | 'medium' | 'low';
        technical_complexity: 'high' | 'medium' | 'low';
    };
    evolution?: {
        current_version: string;
        focus: string;
        known_limitations: string[];
        future_improvements: string[];
    };
}
/**
 * Shared dimension context utilities
 */
export declare const DIMENSION_CONTEXT: {
    /**
     * Generate evaluation process template for a dimension
     * This template is used in dimension YAML files under prompts.evaluation_instructions
     */
    evaluationProcessTemplate: (dimensionName: string, specificGuidance: string) => string;
    /**
     * Generate metadata template for a dimension
     */
    metadataTemplate: (_dimensionName: string, category: "core" | "quality" | "safety" | "performance", complexity: "basic" | "moderate" | "advanced", tags: string[]) => DimensionMetadataTemplate;
    /**
     * Context template structure (to be filled per dimension)
     */
    contextTemplate: () => DimensionContextTemplate;
    /**
     * Developer guidance template structure (to be filled per dimension)
     */
    developerGuidanceTemplate: () => DeveloperGuidanceTemplate;
};
/**
 * Dimension validation utilities
 */
export declare class DimensionValidator {
    /**
     * Validate that a dimension definition has all required sections
     *
     * @param dimensionDef - dimension definition object to validate
     * @returns Validation result with list of missing fields
     */
    static validate(dimensionDef: any): {
        valid: boolean;
        missing: string[];
    };
    /**
     * Validate that dimension has enhanced v2.0 sections
     * These are the new context and developer_guidance sections
     *
     * @param dimensionDef - dimension definition object to validate
     * @returns Validation result with list of missing enhanced sections
     */
    static validateEnhanced(dimensionDef: any): {
        valid: boolean;
        missing: string[];
    };
    /**
     * Get dimension version from metadata
     *
     * @param dimensionDef - dimension definition object
     * @returns Version string or 'unknown'
     */
    static getVersion(dimensionDef: any): string;
    /**
     * Check if dimension is enhanced (v2.0)
     *
     * @param dimensionDef - dimension definition object
     * @returns True if dimension has v2.0 enhancements
     */
    static isEnhanced(dimensionDef: any): boolean;
}
/**
 * Dimension documentation generator utilities
 */
export declare class DimensionDocGenerator {
    /**
     * Generate markdown documentation for a dimension
     *
     * @param dimensionDef - dimension definition object
     * @returns Markdown documentation string
     */
    static generateMarkdown(dimensionDef: any): string;
    /**
     * Generate summary table for all dimensions
     *
     * @param dimensions - Array of dimension definitions
     * @returns Markdown table string
     */
    static generateSummaryTable(dimensions: any[]): string;
}
//# sourceMappingURL=dimension-context.d.ts.map