"use strict";
/**
 * dimension definition Schema for External Dimension Files
 *
 * Defines the structure for dimension definition files that can be edited by users
 * in the .identro/dimensions/ directory.
 *
 * IMPORTANT: Dimension files contain ONLY prompts and metadata.
 * ALL configuration values (test_count, strictness, etc.) come from eval.config.yml
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DimensionDefinitionSchema = exports.DimensionContextSchema = exports.DimensionMetadataSchema = exports.DimensionSettingsSchema = exports.DimensionPromptsSchema = exports.DimensionConfigSchema = void 0;
exports.validateDimensionDefinition = validateDimensionDefinition;
exports.validateDimensionDefinitionSafe = validateDimensionDefinitionSafe;
exports.createDefaultDimensionDefinition = createDefaultDimensionDefinition;
const zod_1 = require("zod");
/**
 * Zod schema for MetricValue (for validation)
 */
const MetricValueSchema = zod_1.z.lazy(() => zod_1.z.union([
    zod_1.z.number(),
    zod_1.z.string(),
    zod_1.z.boolean(),
    zod_1.z.null(),
    zod_1.z.array(MetricValueSchema),
    zod_1.z.record(zod_1.z.string(), MetricValueSchema),
]));
/**
 * Dimension configuration schema
 */
exports.DimensionConfigSchema = zod_1.z.object({
    test_count: zod_1.z.number().int().positive().default(3),
    runs_per_input: zod_1.z.number().int().positive().default(3),
    variations_per_input: zod_1.z.number().int().positive().default(2),
    similarity_threshold: zod_1.z.number().min(0).max(1).default(0.8),
    timeout_ms: zod_1.z.number().int().positive().default(60000),
    concurrent_requests: zod_1.z.number().int().positive().default(5),
    latency_threshold_ms: zod_1.z.number().int().positive().default(20000),
    strict_validation: zod_1.z.boolean().default(true),
    test_prompt_injection: zod_1.z.boolean().default(false),
    test_boundary_inputs: zod_1.z.boolean().default(false),
    test_error_recovery: zod_1.z.boolean().default(false),
    // Allow custom configuration fields
}).passthrough();
/**
 * Dimension prompts schema - Updated for new evaluation architecture
 */
exports.DimensionPromptsSchema = zod_1.z.object({
    agent_requirements: zod_1.z.string(),
    team_requirements: zod_1.z.string().optional(),
    flow_requirements: zod_1.z.string().optional(),
    /**
     * NEW: Evaluation instructions for LLM
     * Explains how to evaluate tests against criteria
     */
    evaluation_instructions: zod_1.z.string().optional(),
    /**
     * DEPRECATED: Moved to EvaluationCriterion objects in eval-spec.json
     * Kept for backwards compatibility
     */
    evaluation_criteria: zod_1.z.array(zod_1.z.string()).optional(),
    custom_instructions: zod_1.z.string().optional(),
    domain_context: zod_1.z.string().optional(),
});
/**
 * Dimension-level settings for evaluation behavior
 * NOTE: These are typically loaded from eval.config.yml, not stored in dimension files
 */
exports.DimensionSettingsSchema = zod_1.z.object({
    /**
     * Evaluation behavior settings
     */
    evaluationSettings: zod_1.z.object({
        /**
         * Default strictness for all criteria (0-100)
         * Higher = stricter evaluation
         * Default: 85
         */
        default_strictness: zod_1.z.number().min(0).max(100).optional(),
        /**
         * Percentage of criteria that must pass for test to pass (0-100)
         * Default: 100 (all criteria must pass)
         */
        passing_criteria_percentage: zod_1.z.number().min(0).max(100).optional(),
    }).optional(),
    /**
     * Dimension-specific metric thresholds used as LLM context
     * These are reference values, not hard pass/fail gates
     * Supports any JSON type for maximum flexibility
     */
    metricThresholds: zod_1.z.record(zod_1.z.string(), MetricValueSchema).optional(),
}).optional();
/**
 * Dimension metadata schema
 */
exports.DimensionMetadataSchema = zod_1.z.object({
    author: zod_1.z.string().optional(),
    version: zod_1.z.string().default('1.0.0'),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    /**
     * UI Display Metadata - for dynamic dimension rendering in reports
     */
    category: zod_1.z.enum(['core', 'quality', 'enterprise']).default('quality'),
    displayName: zod_1.z.string().optional(), // If not provided, uses name with capitalization
    icon: zod_1.z.string().optional(), // Emoji icon for display
    complexity: zod_1.z.enum(['simple', 'moderate', 'complex', 'advanced']).default('moderate'),
});
/**
 * Dimension context schema - Flexible additional context for LLM prompt enrichment
 * All fields are optional to allow dimensions to include only relevant context
 */
exports.DimensionContextSchema = zod_1.z.object({
    /**
     * Why this dimension matters - business/user impact, consequences of failure
     * Helps LLM understand real-world importance and generate relevant tests
     */
    why_it_matters: zod_1.z.string().optional(),
    /**
     * When to prioritize this dimension - use cases where it's critical vs nice-to-have
     * Helps LLM understand context and generate appropriate test scenarios
     */
    when_to_prioritize: zod_1.z.string().optional(),
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
exports.DimensionDefinitionSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    short_description: zod_1.z.string(),
    // NOTE: 'enabled' removed - it's configuration, not definition!
    // Enable/disable dimensions in eval.config.yml under dimensions.enabled
    priority: zod_1.z.number().int().min(1).max(10).default(5),
    /**
     * DEPRECATED: Configuration should come from eval.config.yml
     * Kept for backwards compatibility
     */
    configuration: exports.DimensionConfigSchema.optional(),
    prompts: exports.DimensionPromptsSchema,
    metadata: exports.DimensionMetadataSchema.default({}),
    /**
     * NEW: Optional context for LLM prompt enrichment
     * Provides business impact and prioritization guidance to help LLM generate better tests
     * All fields are optional - dimensions can include only relevant context
     */
    context: exports.DimensionContextSchema.optional(),
    /**
     * NEW: Dimension-level settings (typically from eval.config.yml)
     * Separated from prompts for cleaner architecture
     */
    settings: exports.DimensionSettingsSchema.optional(),
    /**
     * DEPRECATED: Custom variables that can be used in prompts
     * Kept for backwards compatibility
     */
    variables: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
/**
 * Validate a dimension definition
 */
function validateDimensionDefinition(definition) {
    return exports.DimensionDefinitionSchema.parse(definition);
}
/**
 * Validate a dimension definition with error details
 */
function validateDimensionDefinitionSafe(definition) {
    const result = exports.DimensionDefinitionSchema.safeParse(definition);
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
function createDefaultDimensionDefinition(name, description, shortDescription) {
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