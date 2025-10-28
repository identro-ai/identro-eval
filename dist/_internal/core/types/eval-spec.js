"use strict";
/**
 * Evaluation specification schema for identro.eval.json
 * Living document that stores tests, history, and user customizations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXAMPLE_EVAL_SPEC = exports.EvalSpecSchema = exports.TestConfigSchema = exports.ProjectConfigSchema = exports.UserCustomizationsSchema = exports.TestRunHistoryEntrySchema = exports.FlowSpecSchema = exports.TeamSpecSchema = exports.AgentEvalSpecSchema = exports.PerformanceTrackingSchema = exports.PerformanceHistoryEntrySchema = exports.DimensionTestSpecsSchema = exports.TestSpecificationSchema = exports.DiscoveryMetadataSchema = exports.TestThresholdsSchema = exports.EvaluationCriterionSchema = exports.SchemaFieldSchema = exports.OutputTypeSchema = exports.FrameworkSchema = exports.AgentTypeSchema = void 0;
exports.validateEvalSpec = validateEvalSpec;
exports.validateEvalSpecSafe = validateEvalSpecSafe;
exports.createDefaultEvalSpec = createDefaultEvalSpec;
const zod_1 = require("zod");
// Agent type enum
exports.AgentTypeSchema = zod_1.z.enum([
    'classifier',
    'rag',
    'task_executor',
    'coordinator',
    'custom'
]);
// Framework enum
exports.FrameworkSchema = zod_1.z.enum([
    'langchain',
    'crewai',
    'autogen',
    'llamaindex',
    'custom'
]);
// Output type enum
exports.OutputTypeSchema = zod_1.z.enum([
    'text',
    'json',
    'classification',
    'structured',
    'custom'
]);
// Schema field type
exports.SchemaFieldSchema = zod_1.z.object({
    type: zod_1.z.enum(['string', 'number', 'boolean', 'array', 'object', 'enum']),
    required: zod_1.z.boolean().optional(),
    description: zod_1.z.string().optional(),
    values: zod_1.z.array(zod_1.z.any()).optional(), // For enum types
    items: zod_1.z.any().optional(), // For array types
    properties: zod_1.z.record(zod_1.z.any()).optional(), // For object types
    min: zod_1.z.number().optional(), // For number types
    max: zod_1.z.number().optional(), // For number types
    minLength: zod_1.z.number().optional(), // For string types
    maxLength: zod_1.z.number().optional(), // For string types
});
/**
 * NEW: Single evaluation criterion with optional overrides
 * Part of the new semantic evaluation architecture
 */
exports.EvaluationCriterionSchema = zod_1.z.object({
    /**
     * The actual criterion to evaluate (e.g., "Output format is consistent")
     */
    criterion: zod_1.z.string(),
    /**
     * Optional: Override dimension's default strictness for this criterion (0-100)
     * User-editable in eval-spec.json
     */
    evaluation_strictness: zod_1.z.number().min(0).max(100).optional(),
    /**
     * Optional: Additional context/instructions for evaluating this criterion
     * User-editable in eval-spec.json
     */
    special_instructions: zod_1.z.string().optional(),
    /**
     * Optional: UI-friendly description for this criterion (4-6 words)
     * LLM-generated during test creation for display in CLI
     */
    ui_description: zod_1.z.string().optional(),
});
/**
 * NEW: Test-level threshold overrides
 * Allows individual tests to override dimension defaults
 */
exports.TestThresholdsSchema = zod_1.z.object({
    /**
     * Percentage of criteria that must pass (0-100)
     * Overrides dimension default
     */
    passing_criteria_percentage: zod_1.z.number().min(0).max(100).optional(),
});
// Discovery metadata for tracking agent changes
exports.DiscoveryMetadataSchema = zod_1.z.object({
    firstSeen: zod_1.z.string().datetime().optional(),
    lastModified: zod_1.z.string().datetime().optional(),
    sourceHash: zod_1.z.string().optional(),
    path: zod_1.z.string().optional(),
    version: zod_1.z.number().int().positive().default(1),
});
// Individual test specification with LLM generation info
exports.TestSpecificationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().optional(), // Made optional to match dimension generators
    input: zod_1.z.any(),
    expected: zod_1.z.any().optional(),
    /**
     * UI-friendly description of what this test is checking (5-7 words)
     * LLM-generated during test creation, shown in CLI
     * Format: "Testing: [description]"
     */
    ui_description: zod_1.z.string().optional(),
    /**
     * Dimension type for this test (runtime field)
     * Now accepts any registered dimension - no hardcoded validation
     */
    dimension: zod_1.z.string().optional(),
    /**
     * Agent information for this test (runtime field)
     */
    agent: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        framework: zod_1.z.string(),
    }).optional(),
    /**
     * Runtime metadata for test execution
     */
    metadata: zod_1.z.any().optional(),
    /**
     * NEW: Evaluation criteria as structured objects (v2.0)
     * Each criterion can have optional strictness and special instructions
     */
    evaluation_criteria: zod_1.z.array(exports.EvaluationCriterionSchema).optional(),
    /**
     * DEPRECATED: Old string-based criteria (v1.0)
     * Now supports both string[] (old) and EvaluationCriterion[] (new) formats
     */
    evaluationCriteria: zod_1.z.union([
        zod_1.z.array(zod_1.z.string()),
        zod_1.z.array(exports.EvaluationCriterionSchema)
    ]).optional(),
    /**
     * NEW: Test-level threshold overrides
     * Allows individual tests to override dimension defaults
     */
    thresholds: exports.TestThresholdsSchema.optional(),
    priority: zod_1.z.number().min(1).max(5).default(3),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    // Multi-run configuration
    multiRun: zod_1.z.object({
        enabled: zod_1.z.boolean().optional(), // Made optional to match dimension generators
        runCount: zod_1.z.number().int().positive(),
        variations: zod_1.z.array(zod_1.z.any()).optional(),
        runType: zod_1.z.string().optional(), // Add fields that dimension generators use
        aggregationStrategy: zod_1.z.string().optional(),
        executionMode: zod_1.z.string().optional(),
        inputVariations: zod_1.z.array(zod_1.z.any()).optional(),
    }).optional(),
    // Flow-specific synthetic inputs for HITL and external interactions
    syntheticInputs: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    // Flow execution metadata
    flowMetadata: zod_1.z.object({
        isFlowTest: zod_1.z.boolean().optional(),
        flowName: zod_1.z.string().optional(),
        estimatedDuration: zod_1.z.number().optional(), // in seconds
        captureArtifacts: zod_1.z.boolean().optional(),
        artifactDirectory: zod_1.z.string().optional(),
        dryRunIntegrations: zod_1.z.boolean().optional(),
        requiresHumanInput: zod_1.z.boolean().optional(),
        externalServices: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
    // User modifications tracking
    userModified: zod_1.z.boolean().optional(),
    userNotes: zod_1.z.string().optional(),
    // Generation metadata
    generatedBy: zod_1.z.string().optional(), // LLM model used
    generatedAt: zod_1.z.string().datetime().optional(),
    // Enhanced LLM generation context preservation
    llmGeneration: zod_1.z.object({
        originalPrompt: zod_1.z.string().optional(), // Full prompt sent to LLM
        reasoning: zod_1.z.string().optional(), // LLM's reasoning for this test
        confidence: zod_1.z.number().min(0).max(1).optional(), // LLM confidence in test
        category: zod_1.z.string().optional(), // LLM-assigned category
        expectedBehavior: zod_1.z.string().optional(), // Detailed expected behavior
        domainContext: zod_1.z.string().optional(), // Domain-specific context used
        complexityLevel: zod_1.z.string().optional(), // Simple, moderate, complex, advanced
        testingFocus: zod_1.z.array(zod_1.z.string()).optional(), // What aspects this test focuses on
    }).optional(),
});
// Dimension-specific test specifications
exports.DimensionTestSpecsSchema = zod_1.z.object({
    generated: zod_1.z.string().datetime().optional(),
    generatedBy: zod_1.z.string().optional(),
    tests: zod_1.z.array(exports.TestSpecificationSchema).default([]),
});
// Performance history entry
exports.PerformanceHistoryEntrySchema = zod_1.z.object({
    timestamp: zod_1.z.string().datetime(),
    dimension: zod_1.z.string(),
    score: zod_1.z.number().min(0).max(1),
    passed: zod_1.z.boolean(),
    details: zod_1.z.any().optional(),
});
// Performance tracking
exports.PerformanceTrackingSchema = zod_1.z.object({
    lastRun: zod_1.z.string().datetime().optional(),
    totalRuns: zod_1.z.number().int().nonnegative().default(0),
    averageScore: zod_1.z.number().min(0).max(1).default(0),
    scoreHistory: zod_1.z.array(exports.PerformanceHistoryEntrySchema).default([]),
    trends: zod_1.z.object({
        improving: zod_1.z.boolean(),
        degrading: zod_1.z.boolean(),
        stable: zod_1.z.boolean(),
    }).optional(),
});
// Agent evaluation specification with living document features
exports.AgentEvalSpecSchema = zod_1.z.object({
    type: exports.AgentTypeSchema,
    description: zod_1.z.string().optional(),
    // Discovery and change tracking
    discovered: exports.DiscoveryMetadataSchema.optional(),
    // Agent contract (LLM-extracted)
    contract: zod_1.z.object({
        role: zod_1.z.string().optional(),
        goal: zod_1.z.string().optional(),
        capabilities: zod_1.z.array(zod_1.z.string()).optional(),
        inputSchema: zod_1.z.any().optional(),
        outputSchema: zod_1.z.any().optional(),
    }).optional(),
    // Generated test specifications by dimension
    testSpecs: zod_1.z.record(zod_1.z.string(), exports.DimensionTestSpecsSchema).optional(),
    // Historical performance tracking
    performance: exports.PerformanceTrackingSchema.optional(),
    // Legacy evaluation_spec for backward compatibility (now optional)
    evaluation_spec: zod_1.z.object({
        sample_inputs: zod_1.z.array(zod_1.z.any()).min(1),
        expected_output_type: exports.OutputTypeSchema.optional(),
        output_schema: zod_1.z.record(exports.SchemaFieldSchema).optional(),
        performance: zod_1.z.object({
            max_latency_ms: zod_1.z.number().positive().optional(),
            min_throughput: zod_1.z.number().positive().optional(),
            timeout_ms: zod_1.z.number().positive().optional(),
        }).optional(),
        safety: zod_1.z.object({
            test_prompt_injection: zod_1.z.boolean().optional(),
            test_boundary_inputs: zod_1.z.boolean().optional(),
            test_error_recovery: zod_1.z.boolean().optional(),
        }).optional(),
        consistency: zod_1.z.object({
            runs_per_input: zod_1.z.number().min(2).max(100).optional(),
            similarity_threshold: zod_1.z.number().min(0).max(1).optional(),
        }).optional(),
        determinism: zod_1.z.object({
            expect_deterministic: zod_1.z.boolean().optional(),
            allowed_variance: zod_1.z.number().min(0).max(1).optional(),
        }).optional(),
    }).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
// Team/Crew specification for multi-agent testing with enhanced analysis
exports.TeamSpecSchema = zod_1.z.object({
    name: zod_1.z.string(),
    members: zod_1.z.array(zod_1.z.string()),
    coordinator: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    // Discovery metadata
    discovered: exports.DiscoveryMetadataSchema.optional(),
    // Complete Phase 1 & 2 analysis data (matching FlowSpec structure)
    analysis: zod_1.z.object({
        // Crew metadata
        crewMetadata: zod_1.z.object({
            agentCount: zod_1.z.number().optional(),
            taskCount: zod_1.z.number().optional(),
            estimatedDuration: zod_1.z.number().optional(), // in seconds
            process: zod_1.z.enum(['sequential', 'hierarchical', 'unknown']).optional(),
            hasMemory: zod_1.z.boolean().optional(),
            hasCache: zod_1.z.boolean().optional(),
            verboseMode: zod_1.z.boolean().optional(),
        }).optional(),
        // Behavioral dimensions (matching flow analysis)
        behavioralDimensions: zod_1.z.object({
            hasToolUsage: zod_1.z.boolean().optional(),
            toolsList: zod_1.z.array(zod_1.z.string()).optional(),
            hasFileIO: zod_1.z.boolean().optional(),
            fileOperations: zod_1.z.object({
                reads: zod_1.z.boolean().optional(),
                writes: zod_1.z.boolean().optional(),
                formats: zod_1.z.array(zod_1.z.string()).optional(),
            }).optional(),
            hasExternalAPIs: zod_1.z.boolean().optional(),
            apiCalls: zod_1.z.array(zod_1.z.string()).optional(),
            hasHumanInLoop: zod_1.z.boolean().optional(),
            humanInteractionPoints: zod_1.z.array(zod_1.z.object({
                taskName: zod_1.z.string(),
                type: zod_1.z.enum(['input', 'approval', 'review']),
                description: zod_1.z.string(),
                blocking: zod_1.z.boolean().optional(),
            })).optional(),
            hasConditionalLogic: zod_1.z.boolean().optional(),
            conditionalPaths: zod_1.z.array(zod_1.z.object({
                condition: zod_1.z.string(),
                target: zod_1.z.string(),
                lineno: zod_1.z.number().optional(),
            })).optional(),
            hasErrorHandling: zod_1.z.boolean().optional(),
            errorHandlers: zod_1.z.array(zod_1.z.object({
                exceptionTypes: zod_1.z.array(zod_1.z.string()),
                hasRetry: zod_1.z.boolean(),
                hasFallback: zod_1.z.boolean(),
                lineno: zod_1.z.number().optional(),
            })).optional(),
            hasStateManagement: zod_1.z.boolean().optional(),
            stateVariables: zod_1.z.array(zod_1.z.string()).optional(),
            complexityLevel: zod_1.z.enum(['simple', 'moderate', 'complex', 'advanced']).optional(),
        }).optional(),
        // External interactions
        externalInteractions: zod_1.z.object({
            tools: zod_1.z.array(zod_1.z.object({
                name: zod_1.z.string(),
                type: zod_1.z.enum(['search', 'file', 'api', 'database', 'custom']),
                operations: zod_1.z.array(zod_1.z.string()).optional(),
                requiredEnvVars: zod_1.z.array(zod_1.z.string()).optional(),
            })).optional(),
            apis: zod_1.z.array(zod_1.z.object({
                name: zod_1.z.string(),
                endpoint: zod_1.z.string().optional(),
                envVar: zod_1.z.string().optional(),
                operations: zod_1.z.array(zod_1.z.string()).optional(),
                protocol: zod_1.z.enum(['http', 'https', 'websocket', 'grpc']).optional(),
            })).optional(),
            databases: zod_1.z.array(zod_1.z.object({
                type: zod_1.z.enum(['sqlite', 'postgres', 'mysql', 'mongodb', 'redis', 'unknown']),
                operations: zod_1.z.array(zod_1.z.string()).optional(),
                requiredEnvVars: zod_1.z.array(zod_1.z.string()).optional(),
            })).optional(),
            fileOperations: zod_1.z.object({
                reads: zod_1.z.array(zod_1.z.string()).optional(),
                writes: zod_1.z.array(zod_1.z.string()).optional(),
                formats: zod_1.z.array(zod_1.z.string()).optional(),
            }).optional(),
            llmProviders: zod_1.z.array(zod_1.z.object({
                provider: zod_1.z.enum(['openai', 'anthropic', 'google', 'azure', 'aws', 'custom']),
                model: zod_1.z.string(),
                agent: zod_1.z.string(),
            })).optional(),
        }).optional(),
        // Enhanced flow chart
        flowChart: zod_1.z.string().optional(),
        // YAML configuration (full data)
        yamlConfig: zod_1.z.object({
            agents: zod_1.z.record(zod_1.z.object({
                role: zod_1.z.string().optional(),
                goal: zod_1.z.string().optional(),
                backstory: zod_1.z.string().optional(),
                tools: zod_1.z.array(zod_1.z.string()).optional(),
                llm: zod_1.z.string().optional(),
                max_iter: zod_1.z.number().optional(),
                verbose: zod_1.z.boolean().optional(),
                allow_delegation: zod_1.z.boolean().optional(),
            })).optional(),
            tasks: zod_1.z.record(zod_1.z.object({
                description: zod_1.z.string().optional(),
                expected_output: zod_1.z.string().optional(),
                agent: zod_1.z.string().optional(),
                tools: zod_1.z.array(zod_1.z.string()).optional(),
                human_input: zod_1.z.boolean().optional(),
                context: zod_1.z.array(zod_1.z.string()).optional(),
            })).optional(),
            crews: zod_1.z.record(zod_1.z.object({
                agents: zod_1.z.array(zod_1.z.string()).optional(),
                tasks: zod_1.z.array(zod_1.z.string()).optional(),
                process: zod_1.z.enum(['sequential', 'hierarchical']).optional(),
                memory: zod_1.z.boolean().optional(),
                cache: zod_1.z.boolean().optional(),
            })).optional(),
        }).optional(),
    }).optional(),
    // Enhanced contract (LLM-generated from rich context)
    contract: zod_1.z.object({
        purpose: zod_1.z.string().optional(), // LLM-generated
        type: zod_1.z.enum(['crew', 'team', 'workflow', 'pipeline']).optional(),
        description: zod_1.z.string().optional(),
        capabilities: zod_1.z.array(zod_1.z.string()).optional(),
        complexity: zod_1.z.enum(['simple', 'moderate', 'complex', 'advanced']).optional(),
        domain: zod_1.z.string().optional(),
        useCases: zod_1.z.array(zod_1.z.string()).optional(),
        limitations: zod_1.z.array(zod_1.z.string()).optional(),
        dependencies: zod_1.z.array(zod_1.z.string()).optional(),
        estimatedDuration: zod_1.z.number().optional(), // in seconds
        requiresHumanInput: zod_1.z.boolean().optional(),
        externalServices: zod_1.z.array(zod_1.z.string()).optional(),
        producesArtifacts: zod_1.z.boolean().optional(),
        artifactTypes: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
    // Test specifications by dimension
    testSpecs: zod_1.z.record(zod_1.z.string(), exports.DimensionTestSpecsSchema).optional(),
    // Execution configuration
    executionConfig: zod_1.z.object({
        timeout: zod_1.z.number().optional(), // in milliseconds
        allowExternalCalls: zod_1.z.boolean().optional(),
        captureArtifacts: zod_1.z.boolean().optional(),
        artifactDirectory: zod_1.z.string().optional(),
    }).optional(),
    // Performance tracking
    performance: exports.PerformanceTrackingSchema.optional(),
});
// Flow specification with complete Phase 1 & 2 analysis data
exports.FlowSpecSchema = zod_1.z.object({
    name: zod_1.z.string(),
    type: zod_1.z.literal('workflow'),
    description: zod_1.z.string().optional(),
    // Discovery metadata
    discovered: exports.DiscoveryMetadataSchema.optional(),
    // Complete Phase 1 & 2 analysis data
    analysis: zod_1.z.object({
        // Workflow metadata from Phase 1
        workflowMetadata: zod_1.z.object({
            stepCount: zod_1.z.number().optional(),
            estimatedDuration: zod_1.z.number().optional(), // in seconds
            crewCount: zod_1.z.number().optional(),
            humanInteractionPoints: zod_1.z.array(zod_1.z.object({
                method: zod_1.z.string(),
                type: zod_1.z.string(),
                description: zod_1.z.string().optional(),
            })).optional(),
            externalServices: zod_1.z.array(zod_1.z.object({
                name: zod_1.z.string(),
                operations: zod_1.z.array(zod_1.z.string()).optional(),
                envVar: zod_1.z.string().optional(),
            })).optional(),
            routerLabels: zod_1.z.array(zod_1.z.string()).optional(),
            parallelCrews: zod_1.z.boolean().optional(),
            crewChaining: zod_1.z.boolean().optional(),
        }).optional(),
        // AST analysis from Phase 2
        behavioralDimensions: zod_1.z.object({
            collectsUserInput: zod_1.z.boolean().optional(),
            makesLLMCalls: zod_1.z.boolean().optional(),
            hasFileIO: zod_1.z.boolean().optional(),
            hasConditionalLogic: zod_1.z.boolean().optional(),
            hasLoops: zod_1.z.boolean().optional(),
            executesCrews: zod_1.z.boolean().optional(),
            crewCount: zod_1.z.number().optional(),
            crewChaining: zod_1.z.boolean().optional(),
            parallelCrews: zod_1.z.boolean().optional(),
            hasHumanInLoop: zod_1.z.boolean().optional(),
            hasExternalIntegrations: zod_1.z.boolean().optional(),
            hasStateEvolution: zod_1.z.boolean().optional(),
            hasParallelExecution: zod_1.z.boolean().optional(),
            hasInfiniteLoop: zod_1.z.boolean().optional(),
        }).optional(),
        // External interactions analysis
        externalInteractions: zod_1.z.object({
            crews: zod_1.z.array(zod_1.z.string()).optional(),
            apis: zod_1.z.array(zod_1.z.string()).optional(),
            databases: zod_1.z.boolean().optional(),
            fileOperations: zod_1.z.object({
                reads: zod_1.z.boolean().optional(),
                writes: zod_1.z.boolean().optional(),
                formats: zod_1.z.array(zod_1.z.string()).optional(),
            }).optional(),
            services: zod_1.z.array(zod_1.z.object({
                name: zod_1.z.string(),
                envVar: zod_1.z.string().optional(),
                operations: zod_1.z.array(zod_1.z.string()).optional(),
            })).optional(),
        }).optional(),
        // Router logic analysis
        routingLogic: zod_1.z.object({
            routerMethods: zod_1.z.array(zod_1.z.string()).optional(),
            routerLabels: zod_1.z.array(zod_1.z.string()).optional(),
            conditionalPaths: zod_1.z.array(zod_1.z.object({
                condition: zod_1.z.string(),
                target: zod_1.z.string(),
                lineno: zod_1.z.number().optional(),
            })).optional(),
        }).optional(),
        // Framework-specific signals
        frameworkSpecific: zod_1.z.object({
            decorators: zod_1.z.object({
                starts: zod_1.z.array(zod_1.z.string()).optional(),
                listeners: zod_1.z.array(zod_1.z.string()).optional(),
                routers: zod_1.z.array(zod_1.z.string()).optional(),
            }).optional(),
            stateModel: zod_1.z.string().optional(),
            flowClass: zod_1.z.string().optional(),
        }).optional(),
        // Enhanced flow chart
        flowChart: zod_1.z.string().optional(),
        // YAML configuration analysis
        yamlConfig: zod_1.z.object({
            agents: zod_1.z.record(zod_1.z.any()).optional(),
            tasks: zod_1.z.record(zod_1.z.any()).optional(),
            crews: zod_1.z.record(zod_1.z.any()).optional(),
        }).optional(),
    }).optional(),
    // LLM-generated contract (populated during test generation)
    contract: zod_1.z.object({
        purpose: zod_1.z.string().optional(), // LLM-generated flow purpose
        description: zod_1.z.string().optional(), // LLM-generated description
        capabilities: zod_1.z.array(zod_1.z.string()).optional(), // LLM-identified capabilities
        inputRequirements: zod_1.z.array(zod_1.z.string()).optional(), // What inputs the flow needs
        outputDescription: zod_1.z.string().optional(), // What the flow produces
        complexity: zod_1.z.enum(['simple', 'moderate', 'complex', 'advanced']).optional(),
        domain: zod_1.z.string().optional(), // Domain/industry context
        useCases: zod_1.z.array(zod_1.z.string()).optional(), // Primary use cases
        limitations: zod_1.z.array(zod_1.z.string()).optional(), // Known limitations
        dependencies: zod_1.z.array(zod_1.z.string()).optional(), // External dependencies
    }).optional(),
    // Test specifications by dimension
    testSpecs: zod_1.z.record(zod_1.z.string(), exports.DimensionTestSpecsSchema).optional(),
    // Execution configuration
    executionConfig: zod_1.z.object({
        timeout: zod_1.z.number().optional(), // in milliseconds
        allowExternalCalls: zod_1.z.boolean().optional(),
        captureArtifacts: zod_1.z.boolean().optional(),
        artifactDirectory: zod_1.z.string().optional(),
        dryRunIntegrations: zod_1.z.boolean().optional(),
        maxRetries: zod_1.z.number().optional(),
    }).optional(),
    // Performance tracking
    performance: exports.PerformanceTrackingSchema.optional(),
});
// Test run history entry
exports.TestRunHistoryEntrySchema = zod_1.z.object({
    runId: zod_1.z.string(),
    timestamp: zod_1.z.string().datetime(),
    agentsTestedCount: zod_1.z.number().int().nonnegative(),
    dimensionsRun: zod_1.z.array(zod_1.z.string()),
    overallScore: zod_1.z.number().min(0).max(1),
    duration: zod_1.z.number().positive(),
    tokenUsage: zod_1.z.number().int().nonnegative().optional(),
    cost: zod_1.z.number().nonnegative().optional(),
});
// User customizations
exports.UserCustomizationsSchema = zod_1.z.object({
    globalCriteria: zod_1.z.array(zod_1.z.string()).optional(),
    dimensionOverrides: zod_1.z.record(zod_1.z.string(), zod_1.z.object({
        customPrompt: zod_1.z.string().optional(),
        customCriteria: zod_1.z.array(zod_1.z.string()).optional(),
    })).optional(),
});
// Project configuration
exports.ProjectConfigSchema = zod_1.z.object({
    framework: exports.FrameworkSchema,
    language: zod_1.z.enum(['python', 'typescript', 'javascript']),
    root_path: zod_1.z.string().optional(),
    llm_config: zod_1.z.object({
        provider: zod_1.z.string().optional(),
        model: zod_1.z.string().optional(),
        api_key_env: zod_1.z.string().optional(),
        temperature: zod_1.z.number().min(0).max(2).optional(),
        max_tokens: zod_1.z.number().positive().optional(),
    }).optional(),
    environment: zod_1.z.record(zod_1.z.string()).optional(),
});
// Test configuration
exports.TestConfigSchema = zod_1.z.object({
    dimensions: zod_1.z.object({
        // Core dimensions (3)
        consistency: zod_1.z.boolean().optional(),
        safety: zod_1.z.boolean().optional(),
        performance: zod_1.z.boolean().optional(),
        // Quality dimensions (5)
        completeness: zod_1.z.boolean().optional(),
        accuracy: zod_1.z.boolean().optional(),
        relevance: zod_1.z.boolean().optional(),
        format: zod_1.z.boolean().optional(),
        'instruction-following': zod_1.z.boolean().optional(),
        // Enterprise dimensions (4)
        compliance: zod_1.z.boolean().optional(),
        'brand-voice': zod_1.z.boolean().optional(),
        'bias-fairness': zod_1.z.boolean().optional(),
        privacy: zod_1.z.boolean().optional(),
        // Legacy
        schema: zod_1.z.boolean().optional(),
        determinism: zod_1.z.boolean().optional(),
    }).optional(),
    timeout_ms: zod_1.z.number().positive().optional(),
    parallel: zod_1.z.boolean().optional(),
    verbose: zod_1.z.boolean().optional(),
    output_format: zod_1.z.enum(['json', 'html', 'markdown']).optional(),
});
// Main evaluation specification schema - Living Document
exports.EvalSpecSchema = zod_1.z.object({
    version: zod_1.z.string().regex(/^\d+\.\d+$/),
    projectId: zod_1.z.string().optional(), // Unique project identifier
    lastScanned: zod_1.z.string().datetime().optional(), // Last scan timestamp
    project: exports.ProjectConfigSchema,
    agents: zod_1.z.record(exports.AgentEvalSpecSchema),
    // Team/Crew relationships
    teams: zod_1.z.record(zod_1.z.string(), exports.TeamSpecSchema).optional(),
    // Flow specifications with complete analysis data
    flows: zod_1.z.record(zod_1.z.string(), exports.FlowSpecSchema).optional(),
    // Global test history
    testHistory: zod_1.z.object({
        runs: zod_1.z.array(exports.TestRunHistoryEntrySchema),
    }).optional(),
    // User customizations
    customizations: exports.UserCustomizationsSchema.optional(),
    metadata: zod_1.z.object({
        created_at: zod_1.z.string().datetime().optional(),
        updated_at: zod_1.z.string().datetime().optional(),
        author: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
});
/**
 * Validate an evaluation specification
 */
function validateEvalSpec(spec) {
    return exports.EvalSpecSchema.parse(spec);
}
/**
 * Validate an evaluation specification with error details
 */
function validateEvalSpecSafe(spec) {
    const result = exports.EvalSpecSchema.safeParse(spec);
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
function createDefaultEvalSpec(framework, language) {
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
exports.EXAMPLE_EVAL_SPEC = {
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