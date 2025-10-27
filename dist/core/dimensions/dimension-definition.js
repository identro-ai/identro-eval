/**
 * dimension definition Schema for External Dimension Files
 *
 * Defines the structure for dimension definition files that can be edited by users
 * in the .identro/dimensions/ directory.
 *
 * IMPORTANT: Dimension files contain ONLY prompts and metadata.
 * ALL configuration values (test_count, strictness, etc.) come from eval.config.yml
 */
import { z } from 'zod';
/**
 * Zod schema for MetricValue (for validation)
 */
const MetricValueSchema = z.lazy(() => z.union([
    z.number(),
    z.string(),
    z.boolean(),
    z.null(),
    z.array(MetricValueSchema),
    z.record(z.string(), MetricValueSchema),
]));
/**
 * Dimension configuration schema
 */
export const DimensionConfigSchema = z.object({
    test_count: z.number().int().positive().default(3),
    runs_per_input: z.number().int().positive().default(3),
    variations_per_input: z.number().int().positive().default(2),
    similarity_threshold: z.number().min(0).max(1).default(0.8),
    timeout_ms: z.number().int().positive().default(60000),
    concurrent_requests: z.number().int().positive().default(5),
    latency_threshold_ms: z.number().int().positive().default(20000),
    strict_validation: z.boolean().default(true),
    test_prompt_injection: z.boolean().default(false),
    test_boundary_inputs: z.boolean().default(false),
    test_error_recovery: z.boolean().default(false),
    // Allow custom configuration fields
}).passthrough();
/**
 * Dimension prompts schema - Updated for new evaluation architecture
 */
export const DimensionPromptsSchema = z.object({
    agent_requirements: z.string(),
    team_requirements: z.string().optional(),
    flow_requirements: z.string().optional(),
    /**
     * NEW: Evaluation instructions for LLM
     * Explains how to evaluate tests against criteria
     */
    evaluation_instructions: z.string().optional(),
    /**
     * DEPRECATED: Moved to EvaluationCriterion objects in eval-spec.json
     * Kept for backwards compatibility
     */
    evaluation_criteria: z.array(z.string()).optional(),
    custom_instructions: z.string().optional(),
    domain_context: z.string().optional(),
});
/**
 * Dimension-level settings for evaluation behavior
 * NOTE: These are typically loaded from eval.config.yml, not stored in dimension files
 */
export const DimensionSettingsSchema = z.object({
    /**
     * Evaluation behavior settings
     */
    evaluationSettings: z.object({
        /**
         * Default strictness for all criteria (0-100)
         * Higher = stricter evaluation
         * Default: 85
         */
        default_strictness: z.number().min(0).max(100).optional(),
        /**
         * Percentage of criteria that must pass for test to pass (0-100)
         * Default: 100 (all criteria must pass)
         */
        passing_criteria_percentage: z.number().min(0).max(100).optional(),
    }).optional(),
    /**
     * Dimension-specific metric thresholds used as LLM context
     * These are reference values, not hard pass/fail gates
     * Supports any JSON type for maximum flexibility
     */
    metricThresholds: z.record(z.string(), MetricValueSchema).optional(),
}).optional();
/**
 * Dimension metadata schema
 */
export const DimensionMetadataSchema = z.object({
    author: z.string().optional(),
    version: z.string().default('1.0.0'),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
    tags: z.array(z.string()).default([]),
    /**
     * UI Display Metadata - for dynamic dimension rendering in reports
     */
    category: z.enum(['core', 'quality', 'enterprise']).default('quality'),
    displayName: z.string().optional(), // If not provided, uses name with capitalization
    icon: z.string().optional(), // Emoji icon for display
    complexity: z.enum(['simple', 'moderate', 'complex', 'advanced']).default('moderate'),
});
/**
 * Dimension context schema - Flexible additional context for LLM prompt enrichment
 * All fields are optional to allow dimensions to include only relevant context
 */
export const DimensionContextSchema = z.object({
    /**
     * Why this dimension matters - business/user impact, consequences of failure
     * Helps LLM understand real-world importance and generate relevant tests
     */
    why_it_matters: z.string().optional(),
    /**
     * When to prioritize this dimension - use cases where it's critical vs nice-to-have
     * Helps LLM understand context and generate appropriate test scenarios
     */
    when_to_prioritize: z.string().optional(),
    /**
     * Allow any additional context fields for future expansion
     * Dimensions can add custom context dimensions as needed
     */
}).passthrough();
/**
 * Main dimension definition schema
 *
 * IMPORTANT: Dimension files should contain ONLY prompts and metadata.
 * Configuration values should come from eval.config.yml
 */
export const DimensionDefinitionSchema = z.object({
    name: z.string(),
    description: z.string(),
    short_description: z.string(),
    // NOTE: 'enabled' removed - it's configuration, not definition!
    // Enable/disable dimensions in eval.config.yml under dimensions.enabled
    priority: z.number().int().min(1).max(10).default(5),
    /**
     * DEPRECATED: Configuration should come from eval.config.yml
     * Kept for backwards compatibility
     */
    configuration: DimensionConfigSchema.optional(),
    prompts: DimensionPromptsSchema,
    metadata: DimensionMetadataSchema.default({}),
    /**
     * NEW: Optional context for LLM prompt enrichment
     * Provides business impact and prioritization guidance to help LLM generate better tests
     * All fields are optional - dimensions can include only relevant context
     */
    context: DimensionContextSchema.optional(),
    /**
     * NEW: Dimension-level settings (typically from eval.config.yml)
     * Separated from prompts for cleaner architecture
     */
    settings: DimensionSettingsSchema.optional(),
    /**
     * DEPRECATED: Custom variables that can be used in prompts
     * Kept for backwards compatibility
     */
    variables: z.record(z.string(), z.any()).optional(),
});
/**
 * Validate a dimension definition
 */
export function validateDimensionDefinition(definition) {
    return DimensionDefinitionSchema.parse(definition);
}
/**
 * Validate a dimension definition with error details
 */
export function validateDimensionDefinitionSafe(definition) {
    const result = DimensionDefinitionSchema.safeParse(definition);
    if (result.success) {
        return { success: true, data: result.data };
    }
    else {
        return { success: false, errors: result.error };
    }
}
/**
 * Create a default dimension definition
 */
export function createDefaultDimensionDefinition(name, description, shortDescription) {
    return {
        name,
        description,
        short_description: shortDescription,
        priority: 5,
        configuration: {
            test_count: 3,
            runs_per_input: 3,
            variations_per_input: 2,
            similarity_threshold: 0.8,
            timeout_ms: 60000,
            concurrent_requests: 5,
            latency_threshold_ms: 20000,
            strict_validation: true,
            test_prompt_injection: false,
            test_boundary_inputs: false,
            test_error_recovery: false,
        },
        prompts: {
            agent_requirements: `Generate tests for ${name} dimension.`,
            evaluation_criteria: [
                'Test should be relevant to the dimension',
                'Evaluation criteria should be clear and measurable',
            ],
        },
        metadata: {
            version: '1.0.0',
            created_at: new Date().toISOString(),
            tags: [],
            category: 'quality',
            complexity: 'moderate',
        },
        variables: {},
    };
}
//# sourceMappingURL=dimension-definition.js.map