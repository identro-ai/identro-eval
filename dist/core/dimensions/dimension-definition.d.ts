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
 * Flexible metric value supporting any JSON type
 * Used for dimension-specific metric thresholds as LLM context
 */
export type MetricValue = number | string | boolean | null | MetricValue[] | {
    [key: string]: MetricValue;
};
/**
 * Dimension configuration schema
 */
export declare const DimensionConfigSchema: z.ZodObject<{
    test_count: z.ZodDefault<z.ZodNumber>;
    runs_per_input: z.ZodDefault<z.ZodNumber>;
    variations_per_input: z.ZodDefault<z.ZodNumber>;
    similarity_threshold: z.ZodDefault<z.ZodNumber>;
    timeout_ms: z.ZodDefault<z.ZodNumber>;
    concurrent_requests: z.ZodDefault<z.ZodNumber>;
    latency_threshold_ms: z.ZodDefault<z.ZodNumber>;
    strict_validation: z.ZodDefault<z.ZodBoolean>;
    test_prompt_injection: z.ZodDefault<z.ZodBoolean>;
    test_boundary_inputs: z.ZodDefault<z.ZodBoolean>;
    test_error_recovery: z.ZodDefault<z.ZodBoolean>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    test_count: z.ZodDefault<z.ZodNumber>;
    runs_per_input: z.ZodDefault<z.ZodNumber>;
    variations_per_input: z.ZodDefault<z.ZodNumber>;
    similarity_threshold: z.ZodDefault<z.ZodNumber>;
    timeout_ms: z.ZodDefault<z.ZodNumber>;
    concurrent_requests: z.ZodDefault<z.ZodNumber>;
    latency_threshold_ms: z.ZodDefault<z.ZodNumber>;
    strict_validation: z.ZodDefault<z.ZodBoolean>;
    test_prompt_injection: z.ZodDefault<z.ZodBoolean>;
    test_boundary_inputs: z.ZodDefault<z.ZodBoolean>;
    test_error_recovery: z.ZodDefault<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    test_count: z.ZodDefault<z.ZodNumber>;
    runs_per_input: z.ZodDefault<z.ZodNumber>;
    variations_per_input: z.ZodDefault<z.ZodNumber>;
    similarity_threshold: z.ZodDefault<z.ZodNumber>;
    timeout_ms: z.ZodDefault<z.ZodNumber>;
    concurrent_requests: z.ZodDefault<z.ZodNumber>;
    latency_threshold_ms: z.ZodDefault<z.ZodNumber>;
    strict_validation: z.ZodDefault<z.ZodBoolean>;
    test_prompt_injection: z.ZodDefault<z.ZodBoolean>;
    test_boundary_inputs: z.ZodDefault<z.ZodBoolean>;
    test_error_recovery: z.ZodDefault<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Dimension prompts schema - Updated for new evaluation architecture
 */
export declare const DimensionPromptsSchema: z.ZodObject<{
    agent_requirements: z.ZodString;
    team_requirements: z.ZodOptional<z.ZodString>;
    flow_requirements: z.ZodOptional<z.ZodString>;
    /**
     * NEW: Evaluation instructions for LLM
     * Explains how to evaluate tests against criteria
     */
    evaluation_instructions: z.ZodOptional<z.ZodString>;
    /**
     * DEPRECATED: Moved to EvaluationCriterion objects in eval-spec.json
     * Kept for backwards compatibility
     */
    evaluation_criteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    custom_instructions: z.ZodOptional<z.ZodString>;
    domain_context: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    agent_requirements: string;
    evaluation_criteria?: string[] | undefined;
    team_requirements?: string | undefined;
    flow_requirements?: string | undefined;
    evaluation_instructions?: string | undefined;
    custom_instructions?: string | undefined;
    domain_context?: string | undefined;
}, {
    agent_requirements: string;
    evaluation_criteria?: string[] | undefined;
    team_requirements?: string | undefined;
    flow_requirements?: string | undefined;
    evaluation_instructions?: string | undefined;
    custom_instructions?: string | undefined;
    domain_context?: string | undefined;
}>;
/**
 * Dimension-level settings for evaluation behavior
 * NOTE: These are typically loaded from eval.config.yml, not stored in dimension files
 */
export declare const DimensionSettingsSchema: z.ZodOptional<z.ZodObject<{
    /**
     * Evaluation behavior settings
     */
    evaluationSettings: z.ZodOptional<z.ZodObject<{
        /**
         * Default strictness for all criteria (0-100)
         * Higher = stricter evaluation
         * Default: 85
         */
        default_strictness: z.ZodOptional<z.ZodNumber>;
        /**
         * Percentage of criteria that must pass for test to pass (0-100)
         * Default: 100 (all criteria must pass)
         */
        passing_criteria_percentage: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        passing_criteria_percentage?: number | undefined;
        default_strictness?: number | undefined;
    }, {
        passing_criteria_percentage?: number | undefined;
        default_strictness?: number | undefined;
    }>>;
    /**
     * Dimension-specific metric thresholds used as LLM context
     * These are reference values, not hard pass/fail gates
     * Supports any JSON type for maximum flexibility
     */
    metricThresholds: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<MetricValue, z.ZodTypeDef, MetricValue>>>;
}, "strip", z.ZodTypeAny, {
    evaluationSettings?: {
        passing_criteria_percentage?: number | undefined;
        default_strictness?: number | undefined;
    } | undefined;
    metricThresholds?: Record<string, MetricValue> | undefined;
}, {
    evaluationSettings?: {
        passing_criteria_percentage?: number | undefined;
        default_strictness?: number | undefined;
    } | undefined;
    metricThresholds?: Record<string, MetricValue> | undefined;
}>>;
/**
 * Dimension metadata schema
 */
export declare const DimensionMetadataSchema: z.ZodObject<{
    author: z.ZodOptional<z.ZodString>;
    version: z.ZodDefault<z.ZodString>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /**
     * UI Display Metadata - for dynamic dimension rendering in reports
     */
    category: z.ZodDefault<z.ZodEnum<["core", "quality", "enterprise"]>>;
    displayName: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    complexity: z.ZodDefault<z.ZodEnum<["simple", "moderate", "complex", "advanced"]>>;
}, "strip", z.ZodTypeAny, {
    version: string;
    tags: string[];
    category: "core" | "quality" | "enterprise";
    complexity: "simple" | "moderate" | "complex" | "advanced";
    created_at?: string | undefined;
    updated_at?: string | undefined;
    author?: string | undefined;
    displayName?: string | undefined;
    icon?: string | undefined;
}, {
    version?: string | undefined;
    tags?: string[] | undefined;
    category?: "core" | "quality" | "enterprise" | undefined;
    complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    author?: string | undefined;
    displayName?: string | undefined;
    icon?: string | undefined;
}>;
/**
 * Dimension context schema - Flexible additional context for LLM prompt enrichment
 * All fields are optional to allow dimensions to include only relevant context
 */
export declare const DimensionContextSchema: z.ZodObject<{
    /**
     * Why this dimension matters - business/user impact, consequences of failure
     * Helps LLM understand real-world importance and generate relevant tests
     */
    why_it_matters: z.ZodOptional<z.ZodString>;
    /**
     * When to prioritize this dimension - use cases where it's critical vs nice-to-have
     * Helps LLM understand context and generate appropriate test scenarios
     */
    when_to_prioritize: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    /**
     * Why this dimension matters - business/user impact, consequences of failure
     * Helps LLM understand real-world importance and generate relevant tests
     */
    why_it_matters: z.ZodOptional<z.ZodString>;
    /**
     * When to prioritize this dimension - use cases where it's critical vs nice-to-have
     * Helps LLM understand context and generate appropriate test scenarios
     */
    when_to_prioritize: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    /**
     * Why this dimension matters - business/user impact, consequences of failure
     * Helps LLM understand real-world importance and generate relevant tests
     */
    why_it_matters: z.ZodOptional<z.ZodString>;
    /**
     * When to prioritize this dimension - use cases where it's critical vs nice-to-have
     * Helps LLM understand context and generate appropriate test scenarios
     */
    when_to_prioritize: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Main dimension definition schema
 *
 * IMPORTANT: Dimension files should contain ONLY prompts and metadata.
 * Configuration values should come from eval.config.yml
 */
export declare const DimensionDefinitionSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    short_description: z.ZodString;
    priority: z.ZodDefault<z.ZodNumber>;
    /**
     * DEPRECATED: Configuration should come from eval.config.yml
     * Kept for backwards compatibility
     */
    configuration: z.ZodOptional<z.ZodObject<{
        test_count: z.ZodDefault<z.ZodNumber>;
        runs_per_input: z.ZodDefault<z.ZodNumber>;
        variations_per_input: z.ZodDefault<z.ZodNumber>;
        similarity_threshold: z.ZodDefault<z.ZodNumber>;
        timeout_ms: z.ZodDefault<z.ZodNumber>;
        concurrent_requests: z.ZodDefault<z.ZodNumber>;
        latency_threshold_ms: z.ZodDefault<z.ZodNumber>;
        strict_validation: z.ZodDefault<z.ZodBoolean>;
        test_prompt_injection: z.ZodDefault<z.ZodBoolean>;
        test_boundary_inputs: z.ZodDefault<z.ZodBoolean>;
        test_error_recovery: z.ZodDefault<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        test_count: z.ZodDefault<z.ZodNumber>;
        runs_per_input: z.ZodDefault<z.ZodNumber>;
        variations_per_input: z.ZodDefault<z.ZodNumber>;
        similarity_threshold: z.ZodDefault<z.ZodNumber>;
        timeout_ms: z.ZodDefault<z.ZodNumber>;
        concurrent_requests: z.ZodDefault<z.ZodNumber>;
        latency_threshold_ms: z.ZodDefault<z.ZodNumber>;
        strict_validation: z.ZodDefault<z.ZodBoolean>;
        test_prompt_injection: z.ZodDefault<z.ZodBoolean>;
        test_boundary_inputs: z.ZodDefault<z.ZodBoolean>;
        test_error_recovery: z.ZodDefault<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        test_count: z.ZodDefault<z.ZodNumber>;
        runs_per_input: z.ZodDefault<z.ZodNumber>;
        variations_per_input: z.ZodDefault<z.ZodNumber>;
        similarity_threshold: z.ZodDefault<z.ZodNumber>;
        timeout_ms: z.ZodDefault<z.ZodNumber>;
        concurrent_requests: z.ZodDefault<z.ZodNumber>;
        latency_threshold_ms: z.ZodDefault<z.ZodNumber>;
        strict_validation: z.ZodDefault<z.ZodBoolean>;
        test_prompt_injection: z.ZodDefault<z.ZodBoolean>;
        test_boundary_inputs: z.ZodDefault<z.ZodBoolean>;
        test_error_recovery: z.ZodDefault<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>>;
    prompts: z.ZodObject<{
        agent_requirements: z.ZodString;
        team_requirements: z.ZodOptional<z.ZodString>;
        flow_requirements: z.ZodOptional<z.ZodString>;
        /**
         * NEW: Evaluation instructions for LLM
         * Explains how to evaluate tests against criteria
         */
        evaluation_instructions: z.ZodOptional<z.ZodString>;
        /**
         * DEPRECATED: Moved to EvaluationCriterion objects in eval-spec.json
         * Kept for backwards compatibility
         */
        evaluation_criteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        custom_instructions: z.ZodOptional<z.ZodString>;
        domain_context: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        agent_requirements: string;
        evaluation_criteria?: string[] | undefined;
        team_requirements?: string | undefined;
        flow_requirements?: string | undefined;
        evaluation_instructions?: string | undefined;
        custom_instructions?: string | undefined;
        domain_context?: string | undefined;
    }, {
        agent_requirements: string;
        evaluation_criteria?: string[] | undefined;
        team_requirements?: string | undefined;
        flow_requirements?: string | undefined;
        evaluation_instructions?: string | undefined;
        custom_instructions?: string | undefined;
        domain_context?: string | undefined;
    }>;
    metadata: z.ZodDefault<z.ZodObject<{
        author: z.ZodOptional<z.ZodString>;
        version: z.ZodDefault<z.ZodString>;
        created_at: z.ZodOptional<z.ZodString>;
        updated_at: z.ZodOptional<z.ZodString>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        /**
         * UI Display Metadata - for dynamic dimension rendering in reports
         */
        category: z.ZodDefault<z.ZodEnum<["core", "quality", "enterprise"]>>;
        displayName: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        complexity: z.ZodDefault<z.ZodEnum<["simple", "moderate", "complex", "advanced"]>>;
    }, "strip", z.ZodTypeAny, {
        version: string;
        tags: string[];
        category: "core" | "quality" | "enterprise";
        complexity: "simple" | "moderate" | "complex" | "advanced";
        created_at?: string | undefined;
        updated_at?: string | undefined;
        author?: string | undefined;
        displayName?: string | undefined;
        icon?: string | undefined;
    }, {
        version?: string | undefined;
        tags?: string[] | undefined;
        category?: "core" | "quality" | "enterprise" | undefined;
        complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
        created_at?: string | undefined;
        updated_at?: string | undefined;
        author?: string | undefined;
        displayName?: string | undefined;
        icon?: string | undefined;
    }>>;
    /**
     * NEW: Optional context for LLM prompt enrichment
     * Provides business impact and prioritization guidance to help LLM generate better tests
     * All fields are optional - dimensions can include only relevant context
     */
    context: z.ZodOptional<z.ZodObject<{
        /**
         * Why this dimension matters - business/user impact, consequences of failure
         * Helps LLM understand real-world importance and generate relevant tests
         */
        why_it_matters: z.ZodOptional<z.ZodString>;
        /**
         * When to prioritize this dimension - use cases where it's critical vs nice-to-have
         * Helps LLM understand context and generate appropriate test scenarios
         */
        when_to_prioritize: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        /**
         * Why this dimension matters - business/user impact, consequences of failure
         * Helps LLM understand real-world importance and generate relevant tests
         */
        why_it_matters: z.ZodOptional<z.ZodString>;
        /**
         * When to prioritize this dimension - use cases where it's critical vs nice-to-have
         * Helps LLM understand context and generate appropriate test scenarios
         */
        when_to_prioritize: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        /**
         * Why this dimension matters - business/user impact, consequences of failure
         * Helps LLM understand real-world importance and generate relevant tests
         */
        why_it_matters: z.ZodOptional<z.ZodString>;
        /**
         * When to prioritize this dimension - use cases where it's critical vs nice-to-have
         * Helps LLM understand context and generate appropriate test scenarios
         */
        when_to_prioritize: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    /**
     * NEW: Dimension-level settings (typically from eval.config.yml)
     * Separated from prompts for cleaner architecture
     */
    settings: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        /**
         * Evaluation behavior settings
         */
        evaluationSettings: z.ZodOptional<z.ZodObject<{
            /**
             * Default strictness for all criteria (0-100)
             * Higher = stricter evaluation
             * Default: 85
             */
            default_strictness: z.ZodOptional<z.ZodNumber>;
            /**
             * Percentage of criteria that must pass for test to pass (0-100)
             * Default: 100 (all criteria must pass)
             */
            passing_criteria_percentage: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            passing_criteria_percentage?: number | undefined;
            default_strictness?: number | undefined;
        }, {
            passing_criteria_percentage?: number | undefined;
            default_strictness?: number | undefined;
        }>>;
        /**
         * Dimension-specific metric thresholds used as LLM context
         * These are reference values, not hard pass/fail gates
         * Supports any JSON type for maximum flexibility
         */
        metricThresholds: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<MetricValue, z.ZodTypeDef, MetricValue>>>;
    }, "strip", z.ZodTypeAny, {
        evaluationSettings?: {
            passing_criteria_percentage?: number | undefined;
            default_strictness?: number | undefined;
        } | undefined;
        metricThresholds?: Record<string, MetricValue> | undefined;
    }, {
        evaluationSettings?: {
            passing_criteria_percentage?: number | undefined;
            default_strictness?: number | undefined;
        } | undefined;
        metricThresholds?: Record<string, MetricValue> | undefined;
    }>>>;
    /**
     * DEPRECATED: Custom variables that can be used in prompts
     * Kept for backwards compatibility
     */
    variables: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    name: string;
    metadata: {
        version: string;
        tags: string[];
        category: "core" | "quality" | "enterprise";
        complexity: "simple" | "moderate" | "complex" | "advanced";
        created_at?: string | undefined;
        updated_at?: string | undefined;
        author?: string | undefined;
        displayName?: string | undefined;
        icon?: string | undefined;
    };
    priority: number;
    short_description: string;
    prompts: {
        agent_requirements: string;
        evaluation_criteria?: string[] | undefined;
        team_requirements?: string | undefined;
        flow_requirements?: string | undefined;
        evaluation_instructions?: string | undefined;
        custom_instructions?: string | undefined;
        domain_context?: string | undefined;
    };
    context?: z.objectOutputType<{
        /**
         * Why this dimension matters - business/user impact, consequences of failure
         * Helps LLM understand real-world importance and generate relevant tests
         */
        why_it_matters: z.ZodOptional<z.ZodString>;
        /**
         * When to prioritize this dimension - use cases where it's critical vs nice-to-have
         * Helps LLM understand context and generate appropriate test scenarios
         */
        when_to_prioritize: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    configuration?: z.objectOutputType<{
        test_count: z.ZodDefault<z.ZodNumber>;
        runs_per_input: z.ZodDefault<z.ZodNumber>;
        variations_per_input: z.ZodDefault<z.ZodNumber>;
        similarity_threshold: z.ZodDefault<z.ZodNumber>;
        timeout_ms: z.ZodDefault<z.ZodNumber>;
        concurrent_requests: z.ZodDefault<z.ZodNumber>;
        latency_threshold_ms: z.ZodDefault<z.ZodNumber>;
        strict_validation: z.ZodDefault<z.ZodBoolean>;
        test_prompt_injection: z.ZodDefault<z.ZodBoolean>;
        test_boundary_inputs: z.ZodDefault<z.ZodBoolean>;
        test_error_recovery: z.ZodDefault<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    settings?: {
        evaluationSettings?: {
            passing_criteria_percentage?: number | undefined;
            default_strictness?: number | undefined;
        } | undefined;
        metricThresholds?: Record<string, MetricValue> | undefined;
    } | undefined;
    variables?: Record<string, any> | undefined;
}, {
    description: string;
    name: string;
    short_description: string;
    prompts: {
        agent_requirements: string;
        evaluation_criteria?: string[] | undefined;
        team_requirements?: string | undefined;
        flow_requirements?: string | undefined;
        evaluation_instructions?: string | undefined;
        custom_instructions?: string | undefined;
        domain_context?: string | undefined;
    };
    metadata?: {
        version?: string | undefined;
        tags?: string[] | undefined;
        category?: "core" | "quality" | "enterprise" | undefined;
        complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
        created_at?: string | undefined;
        updated_at?: string | undefined;
        author?: string | undefined;
        displayName?: string | undefined;
        icon?: string | undefined;
    } | undefined;
    priority?: number | undefined;
    context?: z.objectInputType<{
        /**
         * Why this dimension matters - business/user impact, consequences of failure
         * Helps LLM understand real-world importance and generate relevant tests
         */
        why_it_matters: z.ZodOptional<z.ZodString>;
        /**
         * When to prioritize this dimension - use cases where it's critical vs nice-to-have
         * Helps LLM understand context and generate appropriate test scenarios
         */
        when_to_prioritize: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    configuration?: z.objectInputType<{
        test_count: z.ZodDefault<z.ZodNumber>;
        runs_per_input: z.ZodDefault<z.ZodNumber>;
        variations_per_input: z.ZodDefault<z.ZodNumber>;
        similarity_threshold: z.ZodDefault<z.ZodNumber>;
        timeout_ms: z.ZodDefault<z.ZodNumber>;
        concurrent_requests: z.ZodDefault<z.ZodNumber>;
        latency_threshold_ms: z.ZodDefault<z.ZodNumber>;
        strict_validation: z.ZodDefault<z.ZodBoolean>;
        test_prompt_injection: z.ZodDefault<z.ZodBoolean>;
        test_boundary_inputs: z.ZodDefault<z.ZodBoolean>;
        test_error_recovery: z.ZodDefault<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    settings?: {
        evaluationSettings?: {
            passing_criteria_percentage?: number | undefined;
            default_strictness?: number | undefined;
        } | undefined;
        metricThresholds?: Record<string, MetricValue> | undefined;
    } | undefined;
    variables?: Record<string, any> | undefined;
}>;
/**
 * Type exports
 */
export type DimensionConfig = z.infer<typeof DimensionConfigSchema>;
export type DimensionPrompts = z.infer<typeof DimensionPromptsSchema>;
export type DimensionMetadata = z.infer<typeof DimensionMetadataSchema>;
export type DimensionSettings = z.infer<typeof DimensionSettingsSchema>;
export type DimensionContext = z.infer<typeof DimensionContextSchema>;
export type DimensionDefinition = z.infer<typeof DimensionDefinitionSchema>;
/**
 * Validate a dimension definition
 */
export declare function validateDimensionDefinition(definition: unknown): DimensionDefinition;
/**
 * Validate a dimension definition with error details
 */
export declare function validateDimensionDefinitionSafe(definition: unknown): {
    success: boolean;
    data?: DimensionDefinition;
    errors?: z.ZodError;
};
/**
 * Create a default dimension definition
 */
export declare function createDefaultDimensionDefinition(name: string, description: string, shortDescription: string): DimensionDefinition;
//# sourceMappingURL=dimension-definition.d.ts.map