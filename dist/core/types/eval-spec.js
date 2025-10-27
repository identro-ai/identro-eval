/**
 * Evaluation specification schema for identro.eval.json
 * Living document that stores tests, history, and user customizations
 */
import { z } from 'zod';
// Agent type enum
export const AgentTypeSchema = z.enum([
    'classifier',
    'rag',
    'task_executor',
    'coordinator',
    'custom'
]);
// Framework enum
export const FrameworkSchema = z.enum([
    'langchain',
    'crewai',
    'autogen',
    'llamaindex',
    'custom'
]);
// Output type enum
export const OutputTypeSchema = z.enum([
    'text',
    'json',
    'classification',
    'structured',
    'custom'
]);
// Schema field type
export const SchemaFieldSchema = z.object({
    type: z.enum(['string', 'number', 'boolean', 'array', 'object', 'enum']),
    required: z.boolean().optional(),
    description: z.string().optional(),
    values: z.array(z.any()).optional(), // For enum types
    items: z.any().optional(), // For array types
    properties: z.record(z.any()).optional(), // For object types
    min: z.number().optional(), // For number types
    max: z.number().optional(), // For number types
    minLength: z.number().optional(), // For string types
    maxLength: z.number().optional(), // For string types
});
/**
 * NEW: Single evaluation criterion with optional overrides
 * Part of the new semantic evaluation architecture
 */
export const EvaluationCriterionSchema = z.object({
    /**
     * The actual criterion to evaluate (e.g., "Output format is consistent")
     */
    criterion: z.string(),
    /**
     * Optional: Override dimension's default strictness for this criterion (0-100)
     * User-editable in eval-spec.json
     */
    evaluation_strictness: z.number().min(0).max(100).optional(),
    /**
     * Optional: Additional context/instructions for evaluating this criterion
     * User-editable in eval-spec.json
     */
    special_instructions: z.string().optional(),
    /**
     * Optional: UI-friendly description for this criterion (4-6 words)
     * LLM-generated during test creation for display in CLI
     */
    ui_description: z.string().optional(),
});
/**
 * NEW: Test-level threshold overrides
 * Allows individual tests to override dimension defaults
 */
export const TestThresholdsSchema = z.object({
    /**
     * Percentage of criteria that must pass (0-100)
     * Overrides dimension default
     */
    passing_criteria_percentage: z.number().min(0).max(100).optional(),
});
// Discovery metadata for tracking agent changes
export const DiscoveryMetadataSchema = z.object({
    firstSeen: z.string().datetime().optional(),
    lastModified: z.string().datetime().optional(),
    sourceHash: z.string().optional(),
    path: z.string().optional(),
    version: z.number().int().positive().default(1),
});
// Individual test specification with LLM generation info
export const TestSpecificationSchema = z.object({
    id: z.string(),
    name: z.string().optional(), // Made optional to match dimension generators
    input: z.any(),
    expected: z.any().optional(),
    /**
     * UI-friendly description of what this test is checking (5-7 words)
     * LLM-generated during test creation, shown in CLI
     * Format: "Testing: [description]"
     */
    ui_description: z.string().optional(),
    /**
     * Dimension type for this test (runtime field)
     * Now accepts any registered dimension - no hardcoded validation
     */
    dimension: z.string().optional(),
    /**
     * Agent information for this test (runtime field)
     */
    agent: z.object({
        id: z.string(),
        name: z.string(),
        framework: z.string(),
    }).optional(),
    /**
     * Runtime metadata for test execution
     */
    metadata: z.any().optional(),
    /**
     * NEW: Evaluation criteria as structured objects (v2.0)
     * Each criterion can have optional strictness and special instructions
     */
    evaluation_criteria: z.array(EvaluationCriterionSchema).optional(),
    /**
     * DEPRECATED: Old string-based criteria (v1.0)
     * Now supports both string[] (old) and EvaluationCriterion[] (new) formats
     */
    evaluationCriteria: z.union([
        z.array(z.string()),
        z.array(EvaluationCriterionSchema)
    ]).optional(),
    /**
     * NEW: Test-level threshold overrides
     * Allows individual tests to override dimension defaults
     */
    thresholds: TestThresholdsSchema.optional(),
    priority: z.number().min(1).max(5).default(3),
    tags: z.array(z.string()).optional(),
    // Multi-run configuration
    multiRun: z.object({
        enabled: z.boolean().optional(), // Made optional to match dimension generators
        runCount: z.number().int().positive(),
        variations: z.array(z.any()).optional(),
        runType: z.string().optional(), // Add fields that dimension generators use
        aggregationStrategy: z.string().optional(),
        executionMode: z.string().optional(),
        inputVariations: z.array(z.any()).optional(),
    }).optional(),
    // Flow-specific synthetic inputs for HITL and external interactions
    syntheticInputs: z.record(z.string(), z.any()).optional(),
    // Flow execution metadata
    flowMetadata: z.object({
        isFlowTest: z.boolean().optional(),
        flowName: z.string().optional(),
        estimatedDuration: z.number().optional(), // in seconds
        captureArtifacts: z.boolean().optional(),
        artifactDirectory: z.string().optional(),
        dryRunIntegrations: z.boolean().optional(),
        requiresHumanInput: z.boolean().optional(),
        externalServices: z.array(z.string()).optional(),
    }).optional(),
    // User modifications tracking
    userModified: z.boolean().optional(),
    userNotes: z.string().optional(),
    // Generation metadata
    generatedBy: z.string().optional(), // LLM model used
    generatedAt: z.string().datetime().optional(),
    // Enhanced LLM generation context preservation
    llmGeneration: z.object({
        originalPrompt: z.string().optional(), // Full prompt sent to LLM
        reasoning: z.string().optional(), // LLM's reasoning for this test
        confidence: z.number().min(0).max(1).optional(), // LLM confidence in test
        category: z.string().optional(), // LLM-assigned category
        expectedBehavior: z.string().optional(), // Detailed expected behavior
        domainContext: z.string().optional(), // Domain-specific context used
        complexityLevel: z.string().optional(), // Simple, moderate, complex, advanced
        testingFocus: z.array(z.string()).optional(), // What aspects this test focuses on
    }).optional(),
});
// Dimension-specific test specifications
export const DimensionTestSpecsSchema = z.object({
    generated: z.string().datetime().optional(),
    generatedBy: z.string().optional(),
    tests: z.array(TestSpecificationSchema).default([]),
});
// Performance history entry
export const PerformanceHistoryEntrySchema = z.object({
    timestamp: z.string().datetime(),
    dimension: z.string(),
    score: z.number().min(0).max(1),
    passed: z.boolean(),
    details: z.any().optional(),
});
// Performance tracking
export const PerformanceTrackingSchema = z.object({
    lastRun: z.string().datetime().optional(),
    totalRuns: z.number().int().nonnegative().default(0),
    averageScore: z.number().min(0).max(1).default(0),
    scoreHistory: z.array(PerformanceHistoryEntrySchema).default([]),
    trends: z.object({
        improving: z.boolean(),
        degrading: z.boolean(),
        stable: z.boolean(),
    }).optional(),
});
// Agent evaluation specification with living document features
export const AgentEvalSpecSchema = z.object({
    type: AgentTypeSchema,
    description: z.string().optional(),
    // Discovery and change tracking
    discovered: DiscoveryMetadataSchema.optional(),
    // Agent contract (LLM-extracted)
    contract: z.object({
        role: z.string().optional(),
        goal: z.string().optional(),
        capabilities: z.array(z.string()).optional(),
        inputSchema: z.any().optional(),
        outputSchema: z.any().optional(),
    }).optional(),
    // Generated test specifications by dimension
    testSpecs: z.record(z.string(), DimensionTestSpecsSchema).optional(),
    // Historical performance tracking
    performance: PerformanceTrackingSchema.optional(),
    // Legacy evaluation_spec for backward compatibility (now optional)
    evaluation_spec: z.object({
        sample_inputs: z.array(z.any()).min(1),
        expected_output_type: OutputTypeSchema.optional(),
        output_schema: z.record(SchemaFieldSchema).optional(),
        performance: z.object({
            max_latency_ms: z.number().positive().optional(),
            min_throughput: z.number().positive().optional(),
            timeout_ms: z.number().positive().optional(),
        }).optional(),
        safety: z.object({
            test_prompt_injection: z.boolean().optional(),
            test_boundary_inputs: z.boolean().optional(),
            test_error_recovery: z.boolean().optional(),
        }).optional(),
        consistency: z.object({
            runs_per_input: z.number().min(2).max(100).optional(),
            similarity_threshold: z.number().min(0).max(1).optional(),
        }).optional(),
        determinism: z.object({
            expect_deterministic: z.boolean().optional(),
            allowed_variance: z.number().min(0).max(1).optional(),
        }).optional(),
    }).optional(),
    metadata: z.record(z.any()).optional(),
});
// Team/Crew specification for multi-agent testing with enhanced analysis
export const TeamSpecSchema = z.object({
    name: z.string(),
    members: z.array(z.string()),
    coordinator: z.string().optional(),
    description: z.string().optional(),
    // Discovery metadata
    discovered: DiscoveryMetadataSchema.optional(),
    // Complete Phase 1 & 2 analysis data (matching FlowSpec structure)
    analysis: z.object({
        // Crew metadata
        crewMetadata: z.object({
            agentCount: z.number().optional(),
            taskCount: z.number().optional(),
            estimatedDuration: z.number().optional(), // in seconds
            process: z.enum(['sequential', 'hierarchical', 'unknown']).optional(),
            hasMemory: z.boolean().optional(),
            hasCache: z.boolean().optional(),
            verboseMode: z.boolean().optional(),
        }).optional(),
        // Behavioral dimensions (matching flow analysis)
        behavioralDimensions: z.object({
            hasToolUsage: z.boolean().optional(),
            toolsList: z.array(z.string()).optional(),
            hasFileIO: z.boolean().optional(),
            fileOperations: z.object({
                reads: z.boolean().optional(),
                writes: z.boolean().optional(),
                formats: z.array(z.string()).optional(),
            }).optional(),
            hasExternalAPIs: z.boolean().optional(),
            apiCalls: z.array(z.string()).optional(),
            hasHumanInLoop: z.boolean().optional(),
            humanInteractionPoints: z.array(z.object({
                taskName: z.string(),
                type: z.enum(['input', 'approval', 'review']),
                description: z.string(),
                blocking: z.boolean().optional(),
            })).optional(),
            hasConditionalLogic: z.boolean().optional(),
            conditionalPaths: z.array(z.object({
                condition: z.string(),
                target: z.string(),
                lineno: z.number().optional(),
            })).optional(),
            hasErrorHandling: z.boolean().optional(),
            errorHandlers: z.array(z.object({
                exceptionTypes: z.array(z.string()),
                hasRetry: z.boolean(),
                hasFallback: z.boolean(),
                lineno: z.number().optional(),
            })).optional(),
            hasStateManagement: z.boolean().optional(),
            stateVariables: z.array(z.string()).optional(),
            complexityLevel: z.enum(['simple', 'moderate', 'complex', 'advanced']).optional(),
        }).optional(),
        // External interactions
        externalInteractions: z.object({
            tools: z.array(z.object({
                name: z.string(),
                type: z.enum(['search', 'file', 'api', 'database', 'custom']),
                operations: z.array(z.string()).optional(),
                requiredEnvVars: z.array(z.string()).optional(),
            })).optional(),
            apis: z.array(z.object({
                name: z.string(),
                endpoint: z.string().optional(),
                envVar: z.string().optional(),
                operations: z.array(z.string()).optional(),
                protocol: z.enum(['http', 'https', 'websocket', 'grpc']).optional(),
            })).optional(),
            databases: z.array(z.object({
                type: z.enum(['sqlite', 'postgres', 'mysql', 'mongodb', 'redis', 'unknown']),
                operations: z.array(z.string()).optional(),
                requiredEnvVars: z.array(z.string()).optional(),
            })).optional(),
            fileOperations: z.object({
                reads: z.array(z.string()).optional(),
                writes: z.array(z.string()).optional(),
                formats: z.array(z.string()).optional(),
            }).optional(),
            llmProviders: z.array(z.object({
                provider: z.enum(['openai', 'anthropic', 'google', 'azure', 'aws', 'custom']),
                model: z.string(),
                agent: z.string(),
            })).optional(),
        }).optional(),
        // Enhanced flow chart
        flowChart: z.string().optional(),
        // YAML configuration (full data)
        yamlConfig: z.object({
            agents: z.record(z.object({
                role: z.string().optional(),
                goal: z.string().optional(),
                backstory: z.string().optional(),
                tools: z.array(z.string()).optional(),
                llm: z.string().optional(),
                max_iter: z.number().optional(),
                verbose: z.boolean().optional(),
                allow_delegation: z.boolean().optional(),
            })).optional(),
            tasks: z.record(z.object({
                description: z.string().optional(),
                expected_output: z.string().optional(),
                agent: z.string().optional(),
                tools: z.array(z.string()).optional(),
                human_input: z.boolean().optional(),
                context: z.array(z.string()).optional(),
            })).optional(),
            crews: z.record(z.object({
                agents: z.array(z.string()).optional(),
                tasks: z.array(z.string()).optional(),
                process: z.enum(['sequential', 'hierarchical']).optional(),
                memory: z.boolean().optional(),
                cache: z.boolean().optional(),
            })).optional(),
        }).optional(),
    }).optional(),
    // Enhanced contract (LLM-generated from rich context)
    contract: z.object({
        purpose: z.string().optional(), // LLM-generated
        type: z.enum(['crew', 'team', 'workflow', 'pipeline']).optional(),
        description: z.string().optional(),
        capabilities: z.array(z.string()).optional(),
        complexity: z.enum(['simple', 'moderate', 'complex', 'advanced']).optional(),
        domain: z.string().optional(),
        useCases: z.array(z.string()).optional(),
        limitations: z.array(z.string()).optional(),
        dependencies: z.array(z.string()).optional(),
        estimatedDuration: z.number().optional(), // in seconds
        requiresHumanInput: z.boolean().optional(),
        externalServices: z.array(z.string()).optional(),
        producesArtifacts: z.boolean().optional(),
        artifactTypes: z.array(z.string()).optional(),
    }).optional(),
    // Test specifications by dimension
    testSpecs: z.record(z.string(), DimensionTestSpecsSchema).optional(),
    // Execution configuration
    executionConfig: z.object({
        timeout: z.number().optional(), // in milliseconds
        allowExternalCalls: z.boolean().optional(),
        captureArtifacts: z.boolean().optional(),
        artifactDirectory: z.string().optional(),
    }).optional(),
    // Performance tracking
    performance: PerformanceTrackingSchema.optional(),
});
// Flow specification with complete Phase 1 & 2 analysis data
export const FlowSpecSchema = z.object({
    name: z.string(),
    type: z.literal('workflow'),
    description: z.string().optional(),
    // Discovery metadata
    discovered: DiscoveryMetadataSchema.optional(),
    // Complete Phase 1 & 2 analysis data
    analysis: z.object({
        // Workflow metadata from Phase 1
        workflowMetadata: z.object({
            stepCount: z.number().optional(),
            estimatedDuration: z.number().optional(), // in seconds
            crewCount: z.number().optional(),
            humanInteractionPoints: z.array(z.object({
                method: z.string(),
                type: z.string(),
                description: z.string().optional(),
            })).optional(),
            externalServices: z.array(z.object({
                name: z.string(),
                operations: z.array(z.string()).optional(),
                envVar: z.string().optional(),
            })).optional(),
            routerLabels: z.array(z.string()).optional(),
            parallelCrews: z.boolean().optional(),
            crewChaining: z.boolean().optional(),
        }).optional(),
        // AST analysis from Phase 2
        behavioralDimensions: z.object({
            collectsUserInput: z.boolean().optional(),
            makesLLMCalls: z.boolean().optional(),
            hasFileIO: z.boolean().optional(),
            hasConditionalLogic: z.boolean().optional(),
            hasLoops: z.boolean().optional(),
            executesCrews: z.boolean().optional(),
            crewCount: z.number().optional(),
            crewChaining: z.boolean().optional(),
            parallelCrews: z.boolean().optional(),
            hasHumanInLoop: z.boolean().optional(),
            hasExternalIntegrations: z.boolean().optional(),
            hasStateEvolution: z.boolean().optional(),
            hasParallelExecution: z.boolean().optional(),
            hasInfiniteLoop: z.boolean().optional(),
        }).optional(),
        // External interactions analysis
        externalInteractions: z.object({
            crews: z.array(z.string()).optional(),
            apis: z.array(z.string()).optional(),
            databases: z.boolean().optional(),
            fileOperations: z.object({
                reads: z.boolean().optional(),
                writes: z.boolean().optional(),
                formats: z.array(z.string()).optional(),
            }).optional(),
            services: z.array(z.object({
                name: z.string(),
                envVar: z.string().optional(),
                operations: z.array(z.string()).optional(),
            })).optional(),
        }).optional(),
        // Router logic analysis
        routingLogic: z.object({
            routerMethods: z.array(z.string()).optional(),
            routerLabels: z.array(z.string()).optional(),
            conditionalPaths: z.array(z.object({
                condition: z.string(),
                target: z.string(),
                lineno: z.number().optional(),
            })).optional(),
        }).optional(),
        // Framework-specific signals
        frameworkSpecific: z.object({
            decorators: z.object({
                starts: z.array(z.string()).optional(),
                listeners: z.array(z.string()).optional(),
                routers: z.array(z.string()).optional(),
            }).optional(),
            stateModel: z.string().optional(),
            flowClass: z.string().optional(),
        }).optional(),
        // Enhanced flow chart
        flowChart: z.string().optional(),
        // YAML configuration analysis
        yamlConfig: z.object({
            agents: z.record(z.any()).optional(),
            tasks: z.record(z.any()).optional(),
            crews: z.record(z.any()).optional(),
        }).optional(),
    }).optional(),
    // LLM-generated contract (populated during test generation)
    contract: z.object({
        purpose: z.string().optional(), // LLM-generated flow purpose
        description: z.string().optional(), // LLM-generated description
        capabilities: z.array(z.string()).optional(), // LLM-identified capabilities
        inputRequirements: z.array(z.string()).optional(), // What inputs the flow needs
        outputDescription: z.string().optional(), // What the flow produces
        complexity: z.enum(['simple', 'moderate', 'complex', 'advanced']).optional(),
        domain: z.string().optional(), // Domain/industry context
        useCases: z.array(z.string()).optional(), // Primary use cases
        limitations: z.array(z.string()).optional(), // Known limitations
        dependencies: z.array(z.string()).optional(), // External dependencies
    }).optional(),
    // Test specifications by dimension
    testSpecs: z.record(z.string(), DimensionTestSpecsSchema).optional(),
    // Execution configuration
    executionConfig: z.object({
        timeout: z.number().optional(), // in milliseconds
        allowExternalCalls: z.boolean().optional(),
        captureArtifacts: z.boolean().optional(),
        artifactDirectory: z.string().optional(),
        dryRunIntegrations: z.boolean().optional(),
        maxRetries: z.number().optional(),
    }).optional(),
    // Performance tracking
    performance: PerformanceTrackingSchema.optional(),
});
// Test run history entry
export const TestRunHistoryEntrySchema = z.object({
    runId: z.string(),
    timestamp: z.string().datetime(),
    agentsTestedCount: z.number().int().nonnegative(),
    dimensionsRun: z.array(z.string()),
    overallScore: z.number().min(0).max(1),
    duration: z.number().positive(),
    tokenUsage: z.number().int().nonnegative().optional(),
    cost: z.number().nonnegative().optional(),
});
// User customizations
export const UserCustomizationsSchema = z.object({
    globalCriteria: z.array(z.string()).optional(),
    dimensionOverrides: z.record(z.string(), z.object({
        customPrompt: z.string().optional(),
        customCriteria: z.array(z.string()).optional(),
    })).optional(),
});
// Project configuration
export const ProjectConfigSchema = z.object({
    framework: FrameworkSchema,
    language: z.enum(['python', 'typescript', 'javascript']),
    root_path: z.string().optional(),
    llm_config: z.object({
        provider: z.string().optional(),
        model: z.string().optional(),
        api_key_env: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
        max_tokens: z.number().positive().optional(),
    }).optional(),
    environment: z.record(z.string()).optional(),
});
// Test configuration
export const TestConfigSchema = z.object({
    dimensions: z.object({
        // Core dimensions (3)
        consistency: z.boolean().optional(),
        safety: z.boolean().optional(),
        performance: z.boolean().optional(),
        // Quality dimensions (5)
        completeness: z.boolean().optional(),
        accuracy: z.boolean().optional(),
        relevance: z.boolean().optional(),
        format: z.boolean().optional(),
        'instruction-following': z.boolean().optional(),
        // Enterprise dimensions (4)
        compliance: z.boolean().optional(),
        'brand-voice': z.boolean().optional(),
        'bias-fairness': z.boolean().optional(),
        privacy: z.boolean().optional(),
        // Legacy
        schema: z.boolean().optional(),
        determinism: z.boolean().optional(),
    }).optional(),
    timeout_ms: z.number().positive().optional(),
    parallel: z.boolean().optional(),
    verbose: z.boolean().optional(),
    output_format: z.enum(['json', 'html', 'markdown']).optional(),
});
// Main evaluation specification schema - Living Document
export const EvalSpecSchema = z.object({
    version: z.string().regex(/^\d+\.\d+$/),
    projectId: z.string().optional(), // Unique project identifier
    lastScanned: z.string().datetime().optional(), // Last scan timestamp
    project: ProjectConfigSchema,
    agents: z.record(AgentEvalSpecSchema),
    // Team/Crew relationships
    teams: z.record(z.string(), TeamSpecSchema).optional(),
    // Flow specifications with complete analysis data
    flows: z.record(z.string(), FlowSpecSchema).optional(),
    // Global test history
    testHistory: z.object({
        runs: z.array(TestRunHistoryEntrySchema),
    }).optional(),
    // User customizations
    customizations: UserCustomizationsSchema.optional(),
    metadata: z.object({
        created_at: z.string().datetime().optional(),
        updated_at: z.string().datetime().optional(),
        author: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
    }).optional(),
});
/**
 * Validate an evaluation specification
 */
export function validateEvalSpec(spec) {
    return EvalSpecSchema.parse(spec);
}
/**
 * Validate an evaluation specification with error details
 */
export function validateEvalSpecSafe(spec) {
    const result = EvalSpecSchema.safeParse(spec);
    if (result.success) {
        return { success: true, data: result.data };
    }
    else {
        return { success: false, errors: result.error };
    }
}
/**
 * Create a default evaluation specification
 */
export function createDefaultEvalSpec(framework, language) {
    return {
        version: '1.0',
        project: {
            framework,
            language,
        },
        agents: {},
        metadata: {
            created_at: new Date().toISOString(),
            author: 'Identro Eval',
        },
    };
}
/**
 * Example evaluation specification
 */
export const EXAMPLE_EVAL_SPEC = {
    version: '1.0',
    project: {
        framework: 'langchain',
        language: 'python',
        llm_config: {
            provider: 'openai',
            model: 'gpt-4',
            api_key_env: 'OPENAI_API_KEY',
            temperature: 0.7,
        },
    },
    agents: {
        'RouterAgent': {
            type: 'classifier',
            description: 'Routes customer inquiries to appropriate departments',
            evaluation_spec: {
                sample_inputs: [
                    'I need help with my billing',
                    'How do I reset my password?',
                    'I want to cancel my subscription',
                    'The app is crashing on startup',
                ],
                expected_output_type: 'classification',
                output_schema: {
                    category: {
                        type: 'enum',
                        values: ['billing', 'technical', 'account', 'general'],
                        required: true,
                    },
                    confidence: {
                        type: 'number',
                        min: 0,
                        max: 1,
                        required: true,
                    },
                    reasoning: {
                        type: 'string',
                        required: false,
                    },
                },
                performance: {
                    max_latency_ms: 2000,
                    min_throughput: 10,
                },
                safety: {
                    test_prompt_injection: true,
                    test_boundary_inputs: true,
                },
                consistency: {
                    runs_per_input: 5,
                    similarity_threshold: 0.8,
                },
            },
        },
        'KnowledgeAgent': {
            type: 'rag',
            description: 'Answers questions using knowledge base',
            evaluation_spec: {
                sample_inputs: [
                    'What are your business hours?',
                    'How do I update my payment method?',
                    'What is your refund policy?',
                ],
                expected_output_type: 'text',
                performance: {
                    max_latency_ms: 5000,
                },
                safety: {
                    test_prompt_injection: true,
                },
            },
        },
    },
};
//# sourceMappingURL=eval-spec.js.map