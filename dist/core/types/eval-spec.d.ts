/**
 * Evaluation specification schema for identro.eval.json
 * Living document that stores tests, history, and user customizations
 */
import { z } from 'zod';
export declare const AgentTypeSchema: z.ZodEnum<["classifier", "rag", "task_executor", "coordinator", "custom"]>;
export declare const FrameworkSchema: z.ZodEnum<["langchain", "crewai", "autogen", "llamaindex", "custom"]>;
export declare const OutputTypeSchema: z.ZodEnum<["text", "json", "classification", "structured", "custom"]>;
export declare const SchemaFieldSchema: z.ZodObject<{
    type: z.ZodEnum<["string", "number", "boolean", "array", "object", "enum"]>;
    required: z.ZodOptional<z.ZodBoolean>;
    description: z.ZodOptional<z.ZodString>;
    values: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    items: z.ZodOptional<z.ZodAny>;
    properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    min: z.ZodOptional<z.ZodNumber>;
    max: z.ZodOptional<z.ZodNumber>;
    minLength: z.ZodOptional<z.ZodNumber>;
    maxLength: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "string" | "number" | "boolean" | "object" | "array" | "enum";
    values?: any[] | undefined;
    description?: string | undefined;
    required?: boolean | undefined;
    items?: any;
    properties?: Record<string, any> | undefined;
    min?: number | undefined;
    max?: number | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
}, {
    type: "string" | "number" | "boolean" | "object" | "array" | "enum";
    values?: any[] | undefined;
    description?: string | undefined;
    required?: boolean | undefined;
    items?: any;
    properties?: Record<string, any> | undefined;
    min?: number | undefined;
    max?: number | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
}>;
/**
 * NEW: Single evaluation criterion with optional overrides
 * Part of the new semantic evaluation architecture
 */
export declare const EvaluationCriterionSchema: z.ZodObject<{
    /**
     * The actual criterion to evaluate (e.g., "Output format is consistent")
     */
    criterion: z.ZodString;
    /**
     * Optional: Override dimension's default strictness for this criterion (0-100)
     * User-editable in eval-spec.json
     */
    evaluation_strictness: z.ZodOptional<z.ZodNumber>;
    /**
     * Optional: Additional context/instructions for evaluating this criterion
     * User-editable in eval-spec.json
     */
    special_instructions: z.ZodOptional<z.ZodString>;
    /**
     * Optional: UI-friendly description for this criterion (4-6 words)
     * LLM-generated during test creation for display in CLI
     */
    ui_description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    criterion: string;
    ui_description?: string | undefined;
    evaluation_strictness?: number | undefined;
    special_instructions?: string | undefined;
}, {
    criterion: string;
    ui_description?: string | undefined;
    evaluation_strictness?: number | undefined;
    special_instructions?: string | undefined;
}>;
/**
 * NEW: Test-level threshold overrides
 * Allows individual tests to override dimension defaults
 */
export declare const TestThresholdsSchema: z.ZodObject<{
    /**
     * Percentage of criteria that must pass (0-100)
     * Overrides dimension default
     */
    passing_criteria_percentage: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    passing_criteria_percentage?: number | undefined;
}, {
    passing_criteria_percentage?: number | undefined;
}>;
export declare const DiscoveryMetadataSchema: z.ZodObject<{
    firstSeen: z.ZodOptional<z.ZodString>;
    lastModified: z.ZodOptional<z.ZodString>;
    sourceHash: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
    version: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    version: number;
    path?: string | undefined;
    firstSeen?: string | undefined;
    lastModified?: string | undefined;
    sourceHash?: string | undefined;
}, {
    version?: number | undefined;
    path?: string | undefined;
    firstSeen?: string | undefined;
    lastModified?: string | undefined;
    sourceHash?: string | undefined;
}>;
export declare const TestSpecificationSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    input: z.ZodAny;
    expected: z.ZodOptional<z.ZodAny>;
    /**
     * UI-friendly description of what this test is checking (5-7 words)
     * LLM-generated during test creation, shown in CLI
     * Format: "Testing: [description]"
     */
    ui_description: z.ZodOptional<z.ZodString>;
    /**
     * Dimension type for this test (runtime field)
     * Now accepts any registered dimension - no hardcoded validation
     */
    dimension: z.ZodOptional<z.ZodString>;
    /**
     * Agent information for this test (runtime field)
     */
    agent: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        framework: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        framework: string;
        id: string;
        name: string;
    }, {
        framework: string;
        id: string;
        name: string;
    }>>;
    /**
     * Runtime metadata for test execution
     */
    metadata: z.ZodOptional<z.ZodAny>;
    /**
     * NEW: Evaluation criteria as structured objects (v2.0)
     * Each criterion can have optional strictness and special instructions
     */
    evaluation_criteria: z.ZodOptional<z.ZodArray<z.ZodObject<{
        /**
         * The actual criterion to evaluate (e.g., "Output format is consistent")
         */
        criterion: z.ZodString;
        /**
         * Optional: Override dimension's default strictness for this criterion (0-100)
         * User-editable in eval-spec.json
         */
        evaluation_strictness: z.ZodOptional<z.ZodNumber>;
        /**
         * Optional: Additional context/instructions for evaluating this criterion
         * User-editable in eval-spec.json
         */
        special_instructions: z.ZodOptional<z.ZodString>;
        /**
         * Optional: UI-friendly description for this criterion (4-6 words)
         * LLM-generated during test creation for display in CLI
         */
        ui_description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        criterion: string;
        ui_description?: string | undefined;
        evaluation_strictness?: number | undefined;
        special_instructions?: string | undefined;
    }, {
        criterion: string;
        ui_description?: string | undefined;
        evaluation_strictness?: number | undefined;
        special_instructions?: string | undefined;
    }>, "many">>;
    /**
     * DEPRECATED: Old string-based criteria (v1.0)
     * Now supports both string[] (old) and EvaluationCriterion[] (new) formats
     */
    evaluationCriteria: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodObject<{
        /**
         * The actual criterion to evaluate (e.g., "Output format is consistent")
         */
        criterion: z.ZodString;
        /**
         * Optional: Override dimension's default strictness for this criterion (0-100)
         * User-editable in eval-spec.json
         */
        evaluation_strictness: z.ZodOptional<z.ZodNumber>;
        /**
         * Optional: Additional context/instructions for evaluating this criterion
         * User-editable in eval-spec.json
         */
        special_instructions: z.ZodOptional<z.ZodString>;
        /**
         * Optional: UI-friendly description for this criterion (4-6 words)
         * LLM-generated during test creation for display in CLI
         */
        ui_description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        criterion: string;
        ui_description?: string | undefined;
        evaluation_strictness?: number | undefined;
        special_instructions?: string | undefined;
    }, {
        criterion: string;
        ui_description?: string | undefined;
        evaluation_strictness?: number | undefined;
        special_instructions?: string | undefined;
    }>, "many">]>>;
    /**
     * NEW: Test-level threshold overrides
     * Allows individual tests to override dimension defaults
     */
    thresholds: z.ZodOptional<z.ZodObject<{
        /**
         * Percentage of criteria that must pass (0-100)
         * Overrides dimension default
         */
        passing_criteria_percentage: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        passing_criteria_percentage?: number | undefined;
    }, {
        passing_criteria_percentage?: number | undefined;
    }>>;
    priority: z.ZodDefault<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    multiRun: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        runCount: z.ZodNumber;
        variations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        runType: z.ZodOptional<z.ZodString>;
        aggregationStrategy: z.ZodOptional<z.ZodString>;
        executionMode: z.ZodOptional<z.ZodString>;
        inputVariations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        runCount: number;
        enabled?: boolean | undefined;
        variations?: any[] | undefined;
        runType?: string | undefined;
        aggregationStrategy?: string | undefined;
        executionMode?: string | undefined;
        inputVariations?: any[] | undefined;
    }, {
        runCount: number;
        enabled?: boolean | undefined;
        variations?: any[] | undefined;
        runType?: string | undefined;
        aggregationStrategy?: string | undefined;
        executionMode?: string | undefined;
        inputVariations?: any[] | undefined;
    }>>;
    syntheticInputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    flowMetadata: z.ZodOptional<z.ZodObject<{
        isFlowTest: z.ZodOptional<z.ZodBoolean>;
        flowName: z.ZodOptional<z.ZodString>;
        estimatedDuration: z.ZodOptional<z.ZodNumber>;
        captureArtifacts: z.ZodOptional<z.ZodBoolean>;
        artifactDirectory: z.ZodOptional<z.ZodString>;
        dryRunIntegrations: z.ZodOptional<z.ZodBoolean>;
        requiresHumanInput: z.ZodOptional<z.ZodBoolean>;
        externalServices: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        isFlowTest?: boolean | undefined;
        flowName?: string | undefined;
        estimatedDuration?: number | undefined;
        captureArtifacts?: boolean | undefined;
        artifactDirectory?: string | undefined;
        dryRunIntegrations?: boolean | undefined;
        requiresHumanInput?: boolean | undefined;
        externalServices?: string[] | undefined;
    }, {
        isFlowTest?: boolean | undefined;
        flowName?: string | undefined;
        estimatedDuration?: number | undefined;
        captureArtifacts?: boolean | undefined;
        artifactDirectory?: string | undefined;
        dryRunIntegrations?: boolean | undefined;
        requiresHumanInput?: boolean | undefined;
        externalServices?: string[] | undefined;
    }>>;
    userModified: z.ZodOptional<z.ZodBoolean>;
    userNotes: z.ZodOptional<z.ZodString>;
    generatedBy: z.ZodOptional<z.ZodString>;
    generatedAt: z.ZodOptional<z.ZodString>;
    llmGeneration: z.ZodOptional<z.ZodObject<{
        originalPrompt: z.ZodOptional<z.ZodString>;
        reasoning: z.ZodOptional<z.ZodString>;
        confidence: z.ZodOptional<z.ZodNumber>;
        category: z.ZodOptional<z.ZodString>;
        expectedBehavior: z.ZodOptional<z.ZodString>;
        domainContext: z.ZodOptional<z.ZodString>;
        complexityLevel: z.ZodOptional<z.ZodString>;
        testingFocus: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        originalPrompt?: string | undefined;
        reasoning?: string | undefined;
        confidence?: number | undefined;
        category?: string | undefined;
        expectedBehavior?: string | undefined;
        domainContext?: string | undefined;
        complexityLevel?: string | undefined;
        testingFocus?: string[] | undefined;
    }, {
        originalPrompt?: string | undefined;
        reasoning?: string | undefined;
        confidence?: number | undefined;
        category?: string | undefined;
        expectedBehavior?: string | undefined;
        domainContext?: string | undefined;
        complexityLevel?: string | undefined;
        testingFocus?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    priority: number;
    agent?: {
        framework: string;
        id: string;
        name: string;
    } | undefined;
    expected?: any;
    generatedBy?: string | undefined;
    name?: string | undefined;
    input?: any;
    ui_description?: string | undefined;
    dimension?: string | undefined;
    metadata?: any;
    evaluation_criteria?: {
        criterion: string;
        ui_description?: string | undefined;
        evaluation_strictness?: number | undefined;
        special_instructions?: string | undefined;
    }[] | undefined;
    evaluationCriteria?: string[] | {
        criterion: string;
        ui_description?: string | undefined;
        evaluation_strictness?: number | undefined;
        special_instructions?: string | undefined;
    }[] | undefined;
    thresholds?: {
        passing_criteria_percentage?: number | undefined;
    } | undefined;
    tags?: string[] | undefined;
    multiRun?: {
        runCount: number;
        enabled?: boolean | undefined;
        variations?: any[] | undefined;
        runType?: string | undefined;
        aggregationStrategy?: string | undefined;
        executionMode?: string | undefined;
        inputVariations?: any[] | undefined;
    } | undefined;
    syntheticInputs?: Record<string, any> | undefined;
    flowMetadata?: {
        isFlowTest?: boolean | undefined;
        flowName?: string | undefined;
        estimatedDuration?: number | undefined;
        captureArtifacts?: boolean | undefined;
        artifactDirectory?: string | undefined;
        dryRunIntegrations?: boolean | undefined;
        requiresHumanInput?: boolean | undefined;
        externalServices?: string[] | undefined;
    } | undefined;
    userModified?: boolean | undefined;
    userNotes?: string | undefined;
    generatedAt?: string | undefined;
    llmGeneration?: {
        originalPrompt?: string | undefined;
        reasoning?: string | undefined;
        confidence?: number | undefined;
        category?: string | undefined;
        expectedBehavior?: string | undefined;
        domainContext?: string | undefined;
        complexityLevel?: string | undefined;
        testingFocus?: string[] | undefined;
    } | undefined;
}, {
    id: string;
    agent?: {
        framework: string;
        id: string;
        name: string;
    } | undefined;
    expected?: any;
    generatedBy?: string | undefined;
    name?: string | undefined;
    input?: any;
    ui_description?: string | undefined;
    dimension?: string | undefined;
    metadata?: any;
    evaluation_criteria?: {
        criterion: string;
        ui_description?: string | undefined;
        evaluation_strictness?: number | undefined;
        special_instructions?: string | undefined;
    }[] | undefined;
    evaluationCriteria?: string[] | {
        criterion: string;
        ui_description?: string | undefined;
        evaluation_strictness?: number | undefined;
        special_instructions?: string | undefined;
    }[] | undefined;
    thresholds?: {
        passing_criteria_percentage?: number | undefined;
    } | undefined;
    priority?: number | undefined;
    tags?: string[] | undefined;
    multiRun?: {
        runCount: number;
        enabled?: boolean | undefined;
        variations?: any[] | undefined;
        runType?: string | undefined;
        aggregationStrategy?: string | undefined;
        executionMode?: string | undefined;
        inputVariations?: any[] | undefined;
    } | undefined;
    syntheticInputs?: Record<string, any> | undefined;
    flowMetadata?: {
        isFlowTest?: boolean | undefined;
        flowName?: string | undefined;
        estimatedDuration?: number | undefined;
        captureArtifacts?: boolean | undefined;
        artifactDirectory?: string | undefined;
        dryRunIntegrations?: boolean | undefined;
        requiresHumanInput?: boolean | undefined;
        externalServices?: string[] | undefined;
    } | undefined;
    userModified?: boolean | undefined;
    userNotes?: string | undefined;
    generatedAt?: string | undefined;
    llmGeneration?: {
        originalPrompt?: string | undefined;
        reasoning?: string | undefined;
        confidence?: number | undefined;
        category?: string | undefined;
        expectedBehavior?: string | undefined;
        domainContext?: string | undefined;
        complexityLevel?: string | undefined;
        testingFocus?: string[] | undefined;
    } | undefined;
}>;
export declare const DimensionTestSpecsSchema: z.ZodObject<{
    generated: z.ZodOptional<z.ZodString>;
    generatedBy: z.ZodOptional<z.ZodString>;
    tests: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        input: z.ZodAny;
        expected: z.ZodOptional<z.ZodAny>;
        /**
         * UI-friendly description of what this test is checking (5-7 words)
         * LLM-generated during test creation, shown in CLI
         * Format: "Testing: [description]"
         */
        ui_description: z.ZodOptional<z.ZodString>;
        /**
         * Dimension type for this test (runtime field)
         * Now accepts any registered dimension - no hardcoded validation
         */
        dimension: z.ZodOptional<z.ZodString>;
        /**
         * Agent information for this test (runtime field)
         */
        agent: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            framework: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            framework: string;
            id: string;
            name: string;
        }, {
            framework: string;
            id: string;
            name: string;
        }>>;
        /**
         * Runtime metadata for test execution
         */
        metadata: z.ZodOptional<z.ZodAny>;
        /**
         * NEW: Evaluation criteria as structured objects (v2.0)
         * Each criterion can have optional strictness and special instructions
         */
        evaluation_criteria: z.ZodOptional<z.ZodArray<z.ZodObject<{
            /**
             * The actual criterion to evaluate (e.g., "Output format is consistent")
             */
            criterion: z.ZodString;
            /**
             * Optional: Override dimension's default strictness for this criterion (0-100)
             * User-editable in eval-spec.json
             */
            evaluation_strictness: z.ZodOptional<z.ZodNumber>;
            /**
             * Optional: Additional context/instructions for evaluating this criterion
             * User-editable in eval-spec.json
             */
            special_instructions: z.ZodOptional<z.ZodString>;
            /**
             * Optional: UI-friendly description for this criterion (4-6 words)
             * LLM-generated during test creation for display in CLI
             */
            ui_description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            criterion: string;
            ui_description?: string | undefined;
            evaluation_strictness?: number | undefined;
            special_instructions?: string | undefined;
        }, {
            criterion: string;
            ui_description?: string | undefined;
            evaluation_strictness?: number | undefined;
            special_instructions?: string | undefined;
        }>, "many">>;
        /**
         * DEPRECATED: Old string-based criteria (v1.0)
         * Now supports both string[] (old) and EvaluationCriterion[] (new) formats
         */
        evaluationCriteria: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodObject<{
            /**
             * The actual criterion to evaluate (e.g., "Output format is consistent")
             */
            criterion: z.ZodString;
            /**
             * Optional: Override dimension's default strictness for this criterion (0-100)
             * User-editable in eval-spec.json
             */
            evaluation_strictness: z.ZodOptional<z.ZodNumber>;
            /**
             * Optional: Additional context/instructions for evaluating this criterion
             * User-editable in eval-spec.json
             */
            special_instructions: z.ZodOptional<z.ZodString>;
            /**
             * Optional: UI-friendly description for this criterion (4-6 words)
             * LLM-generated during test creation for display in CLI
             */
            ui_description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            criterion: string;
            ui_description?: string | undefined;
            evaluation_strictness?: number | undefined;
            special_instructions?: string | undefined;
        }, {
            criterion: string;
            ui_description?: string | undefined;
            evaluation_strictness?: number | undefined;
            special_instructions?: string | undefined;
        }>, "many">]>>;
        /**
         * NEW: Test-level threshold overrides
         * Allows individual tests to override dimension defaults
         */
        thresholds: z.ZodOptional<z.ZodObject<{
            /**
             * Percentage of criteria that must pass (0-100)
             * Overrides dimension default
             */
            passing_criteria_percentage: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            passing_criteria_percentage?: number | undefined;
        }, {
            passing_criteria_percentage?: number | undefined;
        }>>;
        priority: z.ZodDefault<z.ZodNumber>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        multiRun: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            runCount: z.ZodNumber;
            variations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            runType: z.ZodOptional<z.ZodString>;
            aggregationStrategy: z.ZodOptional<z.ZodString>;
            executionMode: z.ZodOptional<z.ZodString>;
            inputVariations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        }, "strip", z.ZodTypeAny, {
            runCount: number;
            enabled?: boolean | undefined;
            variations?: any[] | undefined;
            runType?: string | undefined;
            aggregationStrategy?: string | undefined;
            executionMode?: string | undefined;
            inputVariations?: any[] | undefined;
        }, {
            runCount: number;
            enabled?: boolean | undefined;
            variations?: any[] | undefined;
            runType?: string | undefined;
            aggregationStrategy?: string | undefined;
            executionMode?: string | undefined;
            inputVariations?: any[] | undefined;
        }>>;
        syntheticInputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        flowMetadata: z.ZodOptional<z.ZodObject<{
            isFlowTest: z.ZodOptional<z.ZodBoolean>;
            flowName: z.ZodOptional<z.ZodString>;
            estimatedDuration: z.ZodOptional<z.ZodNumber>;
            captureArtifacts: z.ZodOptional<z.ZodBoolean>;
            artifactDirectory: z.ZodOptional<z.ZodString>;
            dryRunIntegrations: z.ZodOptional<z.ZodBoolean>;
            requiresHumanInput: z.ZodOptional<z.ZodBoolean>;
            externalServices: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            isFlowTest?: boolean | undefined;
            flowName?: string | undefined;
            estimatedDuration?: number | undefined;
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            dryRunIntegrations?: boolean | undefined;
            requiresHumanInput?: boolean | undefined;
            externalServices?: string[] | undefined;
        }, {
            isFlowTest?: boolean | undefined;
            flowName?: string | undefined;
            estimatedDuration?: number | undefined;
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            dryRunIntegrations?: boolean | undefined;
            requiresHumanInput?: boolean | undefined;
            externalServices?: string[] | undefined;
        }>>;
        userModified: z.ZodOptional<z.ZodBoolean>;
        userNotes: z.ZodOptional<z.ZodString>;
        generatedBy: z.ZodOptional<z.ZodString>;
        generatedAt: z.ZodOptional<z.ZodString>;
        llmGeneration: z.ZodOptional<z.ZodObject<{
            originalPrompt: z.ZodOptional<z.ZodString>;
            reasoning: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
            category: z.ZodOptional<z.ZodString>;
            expectedBehavior: z.ZodOptional<z.ZodString>;
            domainContext: z.ZodOptional<z.ZodString>;
            complexityLevel: z.ZodOptional<z.ZodString>;
            testingFocus: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            originalPrompt?: string | undefined;
            reasoning?: string | undefined;
            confidence?: number | undefined;
            category?: string | undefined;
            expectedBehavior?: string | undefined;
            domainContext?: string | undefined;
            complexityLevel?: string | undefined;
            testingFocus?: string[] | undefined;
        }, {
            originalPrompt?: string | undefined;
            reasoning?: string | undefined;
            confidence?: number | undefined;
            category?: string | undefined;
            expectedBehavior?: string | undefined;
            domainContext?: string | undefined;
            complexityLevel?: string | undefined;
            testingFocus?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        priority: number;
        agent?: {
            framework: string;
            id: string;
            name: string;
        } | undefined;
        expected?: any;
        generatedBy?: string | undefined;
        name?: string | undefined;
        input?: any;
        ui_description?: string | undefined;
        dimension?: string | undefined;
        metadata?: any;
        evaluation_criteria?: {
            criterion: string;
            ui_description?: string | undefined;
            evaluation_strictness?: number | undefined;
            special_instructions?: string | undefined;
        }[] | undefined;
        evaluationCriteria?: string[] | {
            criterion: string;
            ui_description?: string | undefined;
            evaluation_strictness?: number | undefined;
            special_instructions?: string | undefined;
        }[] | undefined;
        thresholds?: {
            passing_criteria_percentage?: number | undefined;
        } | undefined;
        tags?: string[] | undefined;
        multiRun?: {
            runCount: number;
            enabled?: boolean | undefined;
            variations?: any[] | undefined;
            runType?: string | undefined;
            aggregationStrategy?: string | undefined;
            executionMode?: string | undefined;
            inputVariations?: any[] | undefined;
        } | undefined;
        syntheticInputs?: Record<string, any> | undefined;
        flowMetadata?: {
            isFlowTest?: boolean | undefined;
            flowName?: string | undefined;
            estimatedDuration?: number | undefined;
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            dryRunIntegrations?: boolean | undefined;
            requiresHumanInput?: boolean | undefined;
            externalServices?: string[] | undefined;
        } | undefined;
        userModified?: boolean | undefined;
        userNotes?: string | undefined;
        generatedAt?: string | undefined;
        llmGeneration?: {
            originalPrompt?: string | undefined;
            reasoning?: string | undefined;
            confidence?: number | undefined;
            category?: string | undefined;
            expectedBehavior?: string | undefined;
            domainContext?: string | undefined;
            complexityLevel?: string | undefined;
            testingFocus?: string[] | undefined;
        } | undefined;
    }, {
        id: string;
        agent?: {
            framework: string;
            id: string;
            name: string;
        } | undefined;
        expected?: any;
        generatedBy?: string | undefined;
        name?: string | undefined;
        input?: any;
        ui_description?: string | undefined;
        dimension?: string | undefined;
        metadata?: any;
        evaluation_criteria?: {
            criterion: string;
            ui_description?: string | undefined;
            evaluation_strictness?: number | undefined;
            special_instructions?: string | undefined;
        }[] | undefined;
        evaluationCriteria?: string[] | {
            criterion: string;
            ui_description?: string | undefined;
            evaluation_strictness?: number | undefined;
            special_instructions?: string | undefined;
        }[] | undefined;
        thresholds?: {
            passing_criteria_percentage?: number | undefined;
        } | undefined;
        priority?: number | undefined;
        tags?: string[] | undefined;
        multiRun?: {
            runCount: number;
            enabled?: boolean | undefined;
            variations?: any[] | undefined;
            runType?: string | undefined;
            aggregationStrategy?: string | undefined;
            executionMode?: string | undefined;
            inputVariations?: any[] | undefined;
        } | undefined;
        syntheticInputs?: Record<string, any> | undefined;
        flowMetadata?: {
            isFlowTest?: boolean | undefined;
            flowName?: string | undefined;
            estimatedDuration?: number | undefined;
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            dryRunIntegrations?: boolean | undefined;
            requiresHumanInput?: boolean | undefined;
            externalServices?: string[] | undefined;
        } | undefined;
        userModified?: boolean | undefined;
        userNotes?: string | undefined;
        generatedAt?: string | undefined;
        llmGeneration?: {
            originalPrompt?: string | undefined;
            reasoning?: string | undefined;
            confidence?: number | undefined;
            category?: string | undefined;
            expectedBehavior?: string | undefined;
            domainContext?: string | undefined;
            complexityLevel?: string | undefined;
            testingFocus?: string[] | undefined;
        } | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    tests: {
        id: string;
        priority: number;
        agent?: {
            framework: string;
            id: string;
            name: string;
        } | undefined;
        expected?: any;
        generatedBy?: string | undefined;
        name?: string | undefined;
        input?: any;
        ui_description?: string | undefined;
        dimension?: string | undefined;
        metadata?: any;
        evaluation_criteria?: {
            criterion: string;
            ui_description?: string | undefined;
            evaluation_strictness?: number | undefined;
            special_instructions?: string | undefined;
        }[] | undefined;
        evaluationCriteria?: string[] | {
            criterion: string;
            ui_description?: string | undefined;
            evaluation_strictness?: number | undefined;
            special_instructions?: string | undefined;
        }[] | undefined;
        thresholds?: {
            passing_criteria_percentage?: number | undefined;
        } | undefined;
        tags?: string[] | undefined;
        multiRun?: {
            runCount: number;
            enabled?: boolean | undefined;
            variations?: any[] | undefined;
            runType?: string | undefined;
            aggregationStrategy?: string | undefined;
            executionMode?: string | undefined;
            inputVariations?: any[] | undefined;
        } | undefined;
        syntheticInputs?: Record<string, any> | undefined;
        flowMetadata?: {
            isFlowTest?: boolean | undefined;
            flowName?: string | undefined;
            estimatedDuration?: number | undefined;
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            dryRunIntegrations?: boolean | undefined;
            requiresHumanInput?: boolean | undefined;
            externalServices?: string[] | undefined;
        } | undefined;
        userModified?: boolean | undefined;
        userNotes?: string | undefined;
        generatedAt?: string | undefined;
        llmGeneration?: {
            originalPrompt?: string | undefined;
            reasoning?: string | undefined;
            confidence?: number | undefined;
            category?: string | undefined;
            expectedBehavior?: string | undefined;
            domainContext?: string | undefined;
            complexityLevel?: string | undefined;
            testingFocus?: string[] | undefined;
        } | undefined;
    }[];
    generated?: string | undefined;
    generatedBy?: string | undefined;
}, {
    generated?: string | undefined;
    generatedBy?: string | undefined;
    tests?: {
        id: string;
        agent?: {
            framework: string;
            id: string;
            name: string;
        } | undefined;
        expected?: any;
        generatedBy?: string | undefined;
        name?: string | undefined;
        input?: any;
        ui_description?: string | undefined;
        dimension?: string | undefined;
        metadata?: any;
        evaluation_criteria?: {
            criterion: string;
            ui_description?: string | undefined;
            evaluation_strictness?: number | undefined;
            special_instructions?: string | undefined;
        }[] | undefined;
        evaluationCriteria?: string[] | {
            criterion: string;
            ui_description?: string | undefined;
            evaluation_strictness?: number | undefined;
            special_instructions?: string | undefined;
        }[] | undefined;
        thresholds?: {
            passing_criteria_percentage?: number | undefined;
        } | undefined;
        priority?: number | undefined;
        tags?: string[] | undefined;
        multiRun?: {
            runCount: number;
            enabled?: boolean | undefined;
            variations?: any[] | undefined;
            runType?: string | undefined;
            aggregationStrategy?: string | undefined;
            executionMode?: string | undefined;
            inputVariations?: any[] | undefined;
        } | undefined;
        syntheticInputs?: Record<string, any> | undefined;
        flowMetadata?: {
            isFlowTest?: boolean | undefined;
            flowName?: string | undefined;
            estimatedDuration?: number | undefined;
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            dryRunIntegrations?: boolean | undefined;
            requiresHumanInput?: boolean | undefined;
            externalServices?: string[] | undefined;
        } | undefined;
        userModified?: boolean | undefined;
        userNotes?: string | undefined;
        generatedAt?: string | undefined;
        llmGeneration?: {
            originalPrompt?: string | undefined;
            reasoning?: string | undefined;
            confidence?: number | undefined;
            category?: string | undefined;
            expectedBehavior?: string | undefined;
            domainContext?: string | undefined;
            complexityLevel?: string | undefined;
            testingFocus?: string[] | undefined;
        } | undefined;
    }[] | undefined;
}>;
export declare const PerformanceHistoryEntrySchema: z.ZodObject<{
    timestamp: z.ZodString;
    dimension: z.ZodString;
    score: z.ZodNumber;
    passed: z.ZodBoolean;
    details: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    dimension: string;
    timestamp: string;
    score: number;
    passed: boolean;
    details?: any;
}, {
    dimension: string;
    timestamp: string;
    score: number;
    passed: boolean;
    details?: any;
}>;
export declare const PerformanceTrackingSchema: z.ZodObject<{
    lastRun: z.ZodOptional<z.ZodString>;
    totalRuns: z.ZodDefault<z.ZodNumber>;
    averageScore: z.ZodDefault<z.ZodNumber>;
    scoreHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
        timestamp: z.ZodString;
        dimension: z.ZodString;
        score: z.ZodNumber;
        passed: z.ZodBoolean;
        details: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        dimension: string;
        timestamp: string;
        score: number;
        passed: boolean;
        details?: any;
    }, {
        dimension: string;
        timestamp: string;
        score: number;
        passed: boolean;
        details?: any;
    }>, "many">>;
    trends: z.ZodOptional<z.ZodObject<{
        improving: z.ZodBoolean;
        degrading: z.ZodBoolean;
        stable: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        improving: boolean;
        degrading: boolean;
        stable: boolean;
    }, {
        improving: boolean;
        degrading: boolean;
        stable: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    totalRuns: number;
    averageScore: number;
    scoreHistory: {
        dimension: string;
        timestamp: string;
        score: number;
        passed: boolean;
        details?: any;
    }[];
    lastRun?: string | undefined;
    trends?: {
        improving: boolean;
        degrading: boolean;
        stable: boolean;
    } | undefined;
}, {
    lastRun?: string | undefined;
    totalRuns?: number | undefined;
    averageScore?: number | undefined;
    scoreHistory?: {
        dimension: string;
        timestamp: string;
        score: number;
        passed: boolean;
        details?: any;
    }[] | undefined;
    trends?: {
        improving: boolean;
        degrading: boolean;
        stable: boolean;
    } | undefined;
}>;
export declare const AgentEvalSpecSchema: z.ZodObject<{
    type: z.ZodEnum<["classifier", "rag", "task_executor", "coordinator", "custom"]>;
    description: z.ZodOptional<z.ZodString>;
    discovered: z.ZodOptional<z.ZodObject<{
        firstSeen: z.ZodOptional<z.ZodString>;
        lastModified: z.ZodOptional<z.ZodString>;
        sourceHash: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
        version: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        version: number;
        path?: string | undefined;
        firstSeen?: string | undefined;
        lastModified?: string | undefined;
        sourceHash?: string | undefined;
    }, {
        version?: number | undefined;
        path?: string | undefined;
        firstSeen?: string | undefined;
        lastModified?: string | undefined;
        sourceHash?: string | undefined;
    }>>;
    contract: z.ZodOptional<z.ZodObject<{
        role: z.ZodOptional<z.ZodString>;
        goal: z.ZodOptional<z.ZodString>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        inputSchema: z.ZodOptional<z.ZodAny>;
        outputSchema: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        role?: string | undefined;
        goal?: string | undefined;
        capabilities?: string[] | undefined;
        inputSchema?: any;
        outputSchema?: any;
    }, {
        role?: string | undefined;
        goal?: string | undefined;
        capabilities?: string[] | undefined;
        inputSchema?: any;
        outputSchema?: any;
    }>>;
    testSpecs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        generated: z.ZodOptional<z.ZodString>;
        generatedBy: z.ZodOptional<z.ZodString>;
        tests: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
            input: z.ZodAny;
            expected: z.ZodOptional<z.ZodAny>;
            /**
             * UI-friendly description of what this test is checking (5-7 words)
             * LLM-generated during test creation, shown in CLI
             * Format: "Testing: [description]"
             */
            ui_description: z.ZodOptional<z.ZodString>;
            /**
             * Dimension type for this test (runtime field)
             * Now accepts any registered dimension - no hardcoded validation
             */
            dimension: z.ZodOptional<z.ZodString>;
            /**
             * Agent information for this test (runtime field)
             */
            agent: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                framework: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                framework: string;
                id: string;
                name: string;
            }, {
                framework: string;
                id: string;
                name: string;
            }>>;
            /**
             * Runtime metadata for test execution
             */
            metadata: z.ZodOptional<z.ZodAny>;
            /**
             * NEW: Evaluation criteria as structured objects (v2.0)
             * Each criterion can have optional strictness and special instructions
             */
            evaluation_criteria: z.ZodOptional<z.ZodArray<z.ZodObject<{
                /**
                 * The actual criterion to evaluate (e.g., "Output format is consistent")
                 */
                criterion: z.ZodString;
                /**
                 * Optional: Override dimension's default strictness for this criterion (0-100)
                 * User-editable in eval-spec.json
                 */
                evaluation_strictness: z.ZodOptional<z.ZodNumber>;
                /**
                 * Optional: Additional context/instructions for evaluating this criterion
                 * User-editable in eval-spec.json
                 */
                special_instructions: z.ZodOptional<z.ZodString>;
                /**
                 * Optional: UI-friendly description for this criterion (4-6 words)
                 * LLM-generated during test creation for display in CLI
                 */
                ui_description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }, {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }>, "many">>;
            /**
             * DEPRECATED: Old string-based criteria (v1.0)
             * Now supports both string[] (old) and EvaluationCriterion[] (new) formats
             */
            evaluationCriteria: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodObject<{
                /**
                 * The actual criterion to evaluate (e.g., "Output format is consistent")
                 */
                criterion: z.ZodString;
                /**
                 * Optional: Override dimension's default strictness for this criterion (0-100)
                 * User-editable in eval-spec.json
                 */
                evaluation_strictness: z.ZodOptional<z.ZodNumber>;
                /**
                 * Optional: Additional context/instructions for evaluating this criterion
                 * User-editable in eval-spec.json
                 */
                special_instructions: z.ZodOptional<z.ZodString>;
                /**
                 * Optional: UI-friendly description for this criterion (4-6 words)
                 * LLM-generated during test creation for display in CLI
                 */
                ui_description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }, {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }>, "many">]>>;
            /**
             * NEW: Test-level threshold overrides
             * Allows individual tests to override dimension defaults
             */
            thresholds: z.ZodOptional<z.ZodObject<{
                /**
                 * Percentage of criteria that must pass (0-100)
                 * Overrides dimension default
                 */
                passing_criteria_percentage: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                passing_criteria_percentage?: number | undefined;
            }, {
                passing_criteria_percentage?: number | undefined;
            }>>;
            priority: z.ZodDefault<z.ZodNumber>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            multiRun: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodOptional<z.ZodBoolean>;
                runCount: z.ZodNumber;
                variations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
                runType: z.ZodOptional<z.ZodString>;
                aggregationStrategy: z.ZodOptional<z.ZodString>;
                executionMode: z.ZodOptional<z.ZodString>;
                inputVariations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            }, "strip", z.ZodTypeAny, {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            }, {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            }>>;
            syntheticInputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            flowMetadata: z.ZodOptional<z.ZodObject<{
                isFlowTest: z.ZodOptional<z.ZodBoolean>;
                flowName: z.ZodOptional<z.ZodString>;
                estimatedDuration: z.ZodOptional<z.ZodNumber>;
                captureArtifacts: z.ZodOptional<z.ZodBoolean>;
                artifactDirectory: z.ZodOptional<z.ZodString>;
                dryRunIntegrations: z.ZodOptional<z.ZodBoolean>;
                requiresHumanInput: z.ZodOptional<z.ZodBoolean>;
                externalServices: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            }, {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            }>>;
            userModified: z.ZodOptional<z.ZodBoolean>;
            userNotes: z.ZodOptional<z.ZodString>;
            generatedBy: z.ZodOptional<z.ZodString>;
            generatedAt: z.ZodOptional<z.ZodString>;
            llmGeneration: z.ZodOptional<z.ZodObject<{
                originalPrompt: z.ZodOptional<z.ZodString>;
                reasoning: z.ZodOptional<z.ZodString>;
                confidence: z.ZodOptional<z.ZodNumber>;
                category: z.ZodOptional<z.ZodString>;
                expectedBehavior: z.ZodOptional<z.ZodString>;
                domainContext: z.ZodOptional<z.ZodString>;
                complexityLevel: z.ZodOptional<z.ZodString>;
                testingFocus: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            }, {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            priority: number;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }, {
            id: string;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            priority?: number | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        tests: {
            id: string;
            priority: number;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }[];
        generated?: string | undefined;
        generatedBy?: string | undefined;
    }, {
        generated?: string | undefined;
        generatedBy?: string | undefined;
        tests?: {
            id: string;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            priority?: number | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }[] | undefined;
    }>>>;
    performance: z.ZodOptional<z.ZodObject<{
        lastRun: z.ZodOptional<z.ZodString>;
        totalRuns: z.ZodDefault<z.ZodNumber>;
        averageScore: z.ZodDefault<z.ZodNumber>;
        scoreHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
            timestamp: z.ZodString;
            dimension: z.ZodString;
            score: z.ZodNumber;
            passed: z.ZodBoolean;
            details: z.ZodOptional<z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }, {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }>, "many">>;
        trends: z.ZodOptional<z.ZodObject<{
            improving: z.ZodBoolean;
            degrading: z.ZodBoolean;
            stable: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        }, {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        totalRuns: number;
        averageScore: number;
        scoreHistory: {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }[];
        lastRun?: string | undefined;
        trends?: {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        } | undefined;
    }, {
        lastRun?: string | undefined;
        totalRuns?: number | undefined;
        averageScore?: number | undefined;
        scoreHistory?: {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }[] | undefined;
        trends?: {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        } | undefined;
    }>>;
    evaluation_spec: z.ZodOptional<z.ZodObject<{
        sample_inputs: z.ZodArray<z.ZodAny, "many">;
        expected_output_type: z.ZodOptional<z.ZodEnum<["text", "json", "classification", "structured", "custom"]>>;
        output_schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            type: z.ZodEnum<["string", "number", "boolean", "array", "object", "enum"]>;
            required: z.ZodOptional<z.ZodBoolean>;
            description: z.ZodOptional<z.ZodString>;
            values: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            items: z.ZodOptional<z.ZodAny>;
            properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            min: z.ZodOptional<z.ZodNumber>;
            max: z.ZodOptional<z.ZodNumber>;
            minLength: z.ZodOptional<z.ZodNumber>;
            maxLength: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "string" | "number" | "boolean" | "object" | "array" | "enum";
            values?: any[] | undefined;
            description?: string | undefined;
            required?: boolean | undefined;
            items?: any;
            properties?: Record<string, any> | undefined;
            min?: number | undefined;
            max?: number | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
        }, {
            type: "string" | "number" | "boolean" | "object" | "array" | "enum";
            values?: any[] | undefined;
            description?: string | undefined;
            required?: boolean | undefined;
            items?: any;
            properties?: Record<string, any> | undefined;
            min?: number | undefined;
            max?: number | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
        }>>>;
        performance: z.ZodOptional<z.ZodObject<{
            max_latency_ms: z.ZodOptional<z.ZodNumber>;
            min_throughput: z.ZodOptional<z.ZodNumber>;
            timeout_ms: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            max_latency_ms?: number | undefined;
            min_throughput?: number | undefined;
            timeout_ms?: number | undefined;
        }, {
            max_latency_ms?: number | undefined;
            min_throughput?: number | undefined;
            timeout_ms?: number | undefined;
        }>>;
        safety: z.ZodOptional<z.ZodObject<{
            test_prompt_injection: z.ZodOptional<z.ZodBoolean>;
            test_boundary_inputs: z.ZodOptional<z.ZodBoolean>;
            test_error_recovery: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            test_prompt_injection?: boolean | undefined;
            test_boundary_inputs?: boolean | undefined;
            test_error_recovery?: boolean | undefined;
        }, {
            test_prompt_injection?: boolean | undefined;
            test_boundary_inputs?: boolean | undefined;
            test_error_recovery?: boolean | undefined;
        }>>;
        consistency: z.ZodOptional<z.ZodObject<{
            runs_per_input: z.ZodOptional<z.ZodNumber>;
            similarity_threshold: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            runs_per_input?: number | undefined;
            similarity_threshold?: number | undefined;
        }, {
            runs_per_input?: number | undefined;
            similarity_threshold?: number | undefined;
        }>>;
        determinism: z.ZodOptional<z.ZodObject<{
            expect_deterministic: z.ZodOptional<z.ZodBoolean>;
            allowed_variance: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            expect_deterministic?: boolean | undefined;
            allowed_variance?: number | undefined;
        }, {
            expect_deterministic?: boolean | undefined;
            allowed_variance?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        sample_inputs: any[];
        performance?: {
            max_latency_ms?: number | undefined;
            min_throughput?: number | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        expected_output_type?: "custom" | "text" | "json" | "classification" | "structured" | undefined;
        output_schema?: Record<string, {
            type: "string" | "number" | "boolean" | "object" | "array" | "enum";
            values?: any[] | undefined;
            description?: string | undefined;
            required?: boolean | undefined;
            items?: any;
            properties?: Record<string, any> | undefined;
            min?: number | undefined;
            max?: number | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
        }> | undefined;
        safety?: {
            test_prompt_injection?: boolean | undefined;
            test_boundary_inputs?: boolean | undefined;
            test_error_recovery?: boolean | undefined;
        } | undefined;
        consistency?: {
            runs_per_input?: number | undefined;
            similarity_threshold?: number | undefined;
        } | undefined;
        determinism?: {
            expect_deterministic?: boolean | undefined;
            allowed_variance?: number | undefined;
        } | undefined;
    }, {
        sample_inputs: any[];
        performance?: {
            max_latency_ms?: number | undefined;
            min_throughput?: number | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        expected_output_type?: "custom" | "text" | "json" | "classification" | "structured" | undefined;
        output_schema?: Record<string, {
            type: "string" | "number" | "boolean" | "object" | "array" | "enum";
            values?: any[] | undefined;
            description?: string | undefined;
            required?: boolean | undefined;
            items?: any;
            properties?: Record<string, any> | undefined;
            min?: number | undefined;
            max?: number | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
        }> | undefined;
        safety?: {
            test_prompt_injection?: boolean | undefined;
            test_boundary_inputs?: boolean | undefined;
            test_error_recovery?: boolean | undefined;
        } | undefined;
        consistency?: {
            runs_per_input?: number | undefined;
            similarity_threshold?: number | undefined;
        } | undefined;
        determinism?: {
            expect_deterministic?: boolean | undefined;
            allowed_variance?: number | undefined;
        } | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type: "custom" | "classifier" | "rag" | "task_executor" | "coordinator";
    description?: string | undefined;
    discovered?: {
        version: number;
        path?: string | undefined;
        firstSeen?: string | undefined;
        lastModified?: string | undefined;
        sourceHash?: string | undefined;
    } | undefined;
    contract?: {
        role?: string | undefined;
        goal?: string | undefined;
        capabilities?: string[] | undefined;
        inputSchema?: any;
        outputSchema?: any;
    } | undefined;
    metadata?: Record<string, any> | undefined;
    testSpecs?: Record<string, {
        tests: {
            id: string;
            priority: number;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }[];
        generated?: string | undefined;
        generatedBy?: string | undefined;
    }> | undefined;
    performance?: {
        totalRuns: number;
        averageScore: number;
        scoreHistory: {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }[];
        lastRun?: string | undefined;
        trends?: {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        } | undefined;
    } | undefined;
    evaluation_spec?: {
        sample_inputs: any[];
        performance?: {
            max_latency_ms?: number | undefined;
            min_throughput?: number | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        expected_output_type?: "custom" | "text" | "json" | "classification" | "structured" | undefined;
        output_schema?: Record<string, {
            type: "string" | "number" | "boolean" | "object" | "array" | "enum";
            values?: any[] | undefined;
            description?: string | undefined;
            required?: boolean | undefined;
            items?: any;
            properties?: Record<string, any> | undefined;
            min?: number | undefined;
            max?: number | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
        }> | undefined;
        safety?: {
            test_prompt_injection?: boolean | undefined;
            test_boundary_inputs?: boolean | undefined;
            test_error_recovery?: boolean | undefined;
        } | undefined;
        consistency?: {
            runs_per_input?: number | undefined;
            similarity_threshold?: number | undefined;
        } | undefined;
        determinism?: {
            expect_deterministic?: boolean | undefined;
            allowed_variance?: number | undefined;
        } | undefined;
    } | undefined;
}, {
    type: "custom" | "classifier" | "rag" | "task_executor" | "coordinator";
    description?: string | undefined;
    discovered?: {
        version?: number | undefined;
        path?: string | undefined;
        firstSeen?: string | undefined;
        lastModified?: string | undefined;
        sourceHash?: string | undefined;
    } | undefined;
    contract?: {
        role?: string | undefined;
        goal?: string | undefined;
        capabilities?: string[] | undefined;
        inputSchema?: any;
        outputSchema?: any;
    } | undefined;
    metadata?: Record<string, any> | undefined;
    testSpecs?: Record<string, {
        generated?: string | undefined;
        generatedBy?: string | undefined;
        tests?: {
            id: string;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            priority?: number | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }[] | undefined;
    }> | undefined;
    performance?: {
        lastRun?: string | undefined;
        totalRuns?: number | undefined;
        averageScore?: number | undefined;
        scoreHistory?: {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }[] | undefined;
        trends?: {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        } | undefined;
    } | undefined;
    evaluation_spec?: {
        sample_inputs: any[];
        performance?: {
            max_latency_ms?: number | undefined;
            min_throughput?: number | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        expected_output_type?: "custom" | "text" | "json" | "classification" | "structured" | undefined;
        output_schema?: Record<string, {
            type: "string" | "number" | "boolean" | "object" | "array" | "enum";
            values?: any[] | undefined;
            description?: string | undefined;
            required?: boolean | undefined;
            items?: any;
            properties?: Record<string, any> | undefined;
            min?: number | undefined;
            max?: number | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
        }> | undefined;
        safety?: {
            test_prompt_injection?: boolean | undefined;
            test_boundary_inputs?: boolean | undefined;
            test_error_recovery?: boolean | undefined;
        } | undefined;
        consistency?: {
            runs_per_input?: number | undefined;
            similarity_threshold?: number | undefined;
        } | undefined;
        determinism?: {
            expect_deterministic?: boolean | undefined;
            allowed_variance?: number | undefined;
        } | undefined;
    } | undefined;
}>;
export declare const TeamSpecSchema: z.ZodObject<{
    name: z.ZodString;
    members: z.ZodArray<z.ZodString, "many">;
    coordinator: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    discovered: z.ZodOptional<z.ZodObject<{
        firstSeen: z.ZodOptional<z.ZodString>;
        lastModified: z.ZodOptional<z.ZodString>;
        sourceHash: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
        version: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        version: number;
        path?: string | undefined;
        firstSeen?: string | undefined;
        lastModified?: string | undefined;
        sourceHash?: string | undefined;
    }, {
        version?: number | undefined;
        path?: string | undefined;
        firstSeen?: string | undefined;
        lastModified?: string | undefined;
        sourceHash?: string | undefined;
    }>>;
    analysis: z.ZodOptional<z.ZodObject<{
        crewMetadata: z.ZodOptional<z.ZodObject<{
            agentCount: z.ZodOptional<z.ZodNumber>;
            taskCount: z.ZodOptional<z.ZodNumber>;
            estimatedDuration: z.ZodOptional<z.ZodNumber>;
            process: z.ZodOptional<z.ZodEnum<["sequential", "hierarchical", "unknown"]>>;
            hasMemory: z.ZodOptional<z.ZodBoolean>;
            hasCache: z.ZodOptional<z.ZodBoolean>;
            verboseMode: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            estimatedDuration?: number | undefined;
            agentCount?: number | undefined;
            taskCount?: number | undefined;
            process?: "unknown" | "sequential" | "hierarchical" | undefined;
            hasMemory?: boolean | undefined;
            hasCache?: boolean | undefined;
            verboseMode?: boolean | undefined;
        }, {
            estimatedDuration?: number | undefined;
            agentCount?: number | undefined;
            taskCount?: number | undefined;
            process?: "unknown" | "sequential" | "hierarchical" | undefined;
            hasMemory?: boolean | undefined;
            hasCache?: boolean | undefined;
            verboseMode?: boolean | undefined;
        }>>;
        behavioralDimensions: z.ZodOptional<z.ZodObject<{
            hasToolUsage: z.ZodOptional<z.ZodBoolean>;
            toolsList: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            hasFileIO: z.ZodOptional<z.ZodBoolean>;
            fileOperations: z.ZodOptional<z.ZodObject<{
                reads: z.ZodOptional<z.ZodBoolean>;
                writes: z.ZodOptional<z.ZodBoolean>;
                formats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            }, {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            }>>;
            hasExternalAPIs: z.ZodOptional<z.ZodBoolean>;
            apiCalls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            hasHumanInLoop: z.ZodOptional<z.ZodBoolean>;
            humanInteractionPoints: z.ZodOptional<z.ZodArray<z.ZodObject<{
                taskName: z.ZodString;
                type: z.ZodEnum<["input", "approval", "review"]>;
                description: z.ZodString;
                blocking: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                type: "input" | "approval" | "review";
                description: string;
                taskName: string;
                blocking?: boolean | undefined;
            }, {
                type: "input" | "approval" | "review";
                description: string;
                taskName: string;
                blocking?: boolean | undefined;
            }>, "many">>;
            hasConditionalLogic: z.ZodOptional<z.ZodBoolean>;
            conditionalPaths: z.ZodOptional<z.ZodArray<z.ZodObject<{
                condition: z.ZodString;
                target: z.ZodString;
                lineno: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }, {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }>, "many">>;
            hasErrorHandling: z.ZodOptional<z.ZodBoolean>;
            errorHandlers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                exceptionTypes: z.ZodArray<z.ZodString, "many">;
                hasRetry: z.ZodBoolean;
                hasFallback: z.ZodBoolean;
                lineno: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                exceptionTypes: string[];
                hasRetry: boolean;
                hasFallback: boolean;
                lineno?: number | undefined;
            }, {
                exceptionTypes: string[];
                hasRetry: boolean;
                hasFallback: boolean;
                lineno?: number | undefined;
            }>, "many">>;
            hasStateManagement: z.ZodOptional<z.ZodBoolean>;
            stateVariables: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            complexityLevel: z.ZodOptional<z.ZodEnum<["simple", "moderate", "complex", "advanced"]>>;
        }, "strip", z.ZodTypeAny, {
            complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            hasToolUsage?: boolean | undefined;
            toolsList?: string[] | undefined;
            hasFileIO?: boolean | undefined;
            fileOperations?: {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            } | undefined;
            hasExternalAPIs?: boolean | undefined;
            apiCalls?: string[] | undefined;
            hasHumanInLoop?: boolean | undefined;
            humanInteractionPoints?: {
                type: "input" | "approval" | "review";
                description: string;
                taskName: string;
                blocking?: boolean | undefined;
            }[] | undefined;
            hasConditionalLogic?: boolean | undefined;
            conditionalPaths?: {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }[] | undefined;
            hasErrorHandling?: boolean | undefined;
            errorHandlers?: {
                exceptionTypes: string[];
                hasRetry: boolean;
                hasFallback: boolean;
                lineno?: number | undefined;
            }[] | undefined;
            hasStateManagement?: boolean | undefined;
            stateVariables?: string[] | undefined;
        }, {
            complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            hasToolUsage?: boolean | undefined;
            toolsList?: string[] | undefined;
            hasFileIO?: boolean | undefined;
            fileOperations?: {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            } | undefined;
            hasExternalAPIs?: boolean | undefined;
            apiCalls?: string[] | undefined;
            hasHumanInLoop?: boolean | undefined;
            humanInteractionPoints?: {
                type: "input" | "approval" | "review";
                description: string;
                taskName: string;
                blocking?: boolean | undefined;
            }[] | undefined;
            hasConditionalLogic?: boolean | undefined;
            conditionalPaths?: {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }[] | undefined;
            hasErrorHandling?: boolean | undefined;
            errorHandlers?: {
                exceptionTypes: string[];
                hasRetry: boolean;
                hasFallback: boolean;
                lineno?: number | undefined;
            }[] | undefined;
            hasStateManagement?: boolean | undefined;
            stateVariables?: string[] | undefined;
        }>>;
        externalInteractions: z.ZodOptional<z.ZodObject<{
            tools: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                type: z.ZodEnum<["search", "file", "api", "database", "custom"]>;
                operations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                requiredEnvVars: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                type: "custom" | "search" | "file" | "api" | "database";
                name: string;
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }, {
                type: "custom" | "search" | "file" | "api" | "database";
                name: string;
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }>, "many">>;
            apis: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                endpoint: z.ZodOptional<z.ZodString>;
                envVar: z.ZodOptional<z.ZodString>;
                operations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                protocol: z.ZodOptional<z.ZodEnum<["http", "https", "websocket", "grpc"]>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                operations?: string[] | undefined;
                endpoint?: string | undefined;
                envVar?: string | undefined;
                protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
            }, {
                name: string;
                operations?: string[] | undefined;
                endpoint?: string | undefined;
                envVar?: string | undefined;
                protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
            }>, "many">>;
            databases: z.ZodOptional<z.ZodArray<z.ZodObject<{
                type: z.ZodEnum<["sqlite", "postgres", "mysql", "mongodb", "redis", "unknown"]>;
                operations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                requiredEnvVars: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }, {
                type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }>, "many">>;
            fileOperations: z.ZodOptional<z.ZodObject<{
                reads: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                writes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                formats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                reads?: string[] | undefined;
                writes?: string[] | undefined;
                formats?: string[] | undefined;
            }, {
                reads?: string[] | undefined;
                writes?: string[] | undefined;
                formats?: string[] | undefined;
            }>>;
            llmProviders: z.ZodOptional<z.ZodArray<z.ZodObject<{
                provider: z.ZodEnum<["openai", "anthropic", "google", "azure", "aws", "custom"]>;
                model: z.ZodString;
                agent: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                agent: string;
                provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                model: string;
            }, {
                agent: string;
                provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                model: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            fileOperations?: {
                reads?: string[] | undefined;
                writes?: string[] | undefined;
                formats?: string[] | undefined;
            } | undefined;
            tools?: {
                type: "custom" | "search" | "file" | "api" | "database";
                name: string;
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }[] | undefined;
            apis?: {
                name: string;
                operations?: string[] | undefined;
                endpoint?: string | undefined;
                envVar?: string | undefined;
                protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
            }[] | undefined;
            databases?: {
                type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }[] | undefined;
            llmProviders?: {
                agent: string;
                provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                model: string;
            }[] | undefined;
        }, {
            fileOperations?: {
                reads?: string[] | undefined;
                writes?: string[] | undefined;
                formats?: string[] | undefined;
            } | undefined;
            tools?: {
                type: "custom" | "search" | "file" | "api" | "database";
                name: string;
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }[] | undefined;
            apis?: {
                name: string;
                operations?: string[] | undefined;
                endpoint?: string | undefined;
                envVar?: string | undefined;
                protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
            }[] | undefined;
            databases?: {
                type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }[] | undefined;
            llmProviders?: {
                agent: string;
                provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                model: string;
            }[] | undefined;
        }>>;
        flowChart: z.ZodOptional<z.ZodString>;
        yamlConfig: z.ZodOptional<z.ZodObject<{
            agents: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                role: z.ZodOptional<z.ZodString>;
                goal: z.ZodOptional<z.ZodString>;
                backstory: z.ZodOptional<z.ZodString>;
                tools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                llm: z.ZodOptional<z.ZodString>;
                max_iter: z.ZodOptional<z.ZodNumber>;
                verbose: z.ZodOptional<z.ZodBoolean>;
                allow_delegation: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                role?: string | undefined;
                goal?: string | undefined;
                tools?: string[] | undefined;
                backstory?: string | undefined;
                llm?: string | undefined;
                max_iter?: number | undefined;
                verbose?: boolean | undefined;
                allow_delegation?: boolean | undefined;
            }, {
                role?: string | undefined;
                goal?: string | undefined;
                tools?: string[] | undefined;
                backstory?: string | undefined;
                llm?: string | undefined;
                max_iter?: number | undefined;
                verbose?: boolean | undefined;
                allow_delegation?: boolean | undefined;
            }>>>;
            tasks: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                description: z.ZodOptional<z.ZodString>;
                expected_output: z.ZodOptional<z.ZodString>;
                agent: z.ZodOptional<z.ZodString>;
                tools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                human_input: z.ZodOptional<z.ZodBoolean>;
                context: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                agent?: string | undefined;
                description?: string | undefined;
                tools?: string[] | undefined;
                expected_output?: string | undefined;
                human_input?: boolean | undefined;
                context?: string[] | undefined;
            }, {
                agent?: string | undefined;
                description?: string | undefined;
                tools?: string[] | undefined;
                expected_output?: string | undefined;
                human_input?: boolean | undefined;
                context?: string[] | undefined;
            }>>>;
            crews: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                agents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                process: z.ZodOptional<z.ZodEnum<["sequential", "hierarchical"]>>;
                memory: z.ZodOptional<z.ZodBoolean>;
                cache: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                agents?: string[] | undefined;
                process?: "sequential" | "hierarchical" | undefined;
                tasks?: string[] | undefined;
                memory?: boolean | undefined;
                cache?: boolean | undefined;
            }, {
                agents?: string[] | undefined;
                process?: "sequential" | "hierarchical" | undefined;
                tasks?: string[] | undefined;
                memory?: boolean | undefined;
                cache?: boolean | undefined;
            }>>>;
        }, "strip", z.ZodTypeAny, {
            agents?: Record<string, {
                role?: string | undefined;
                goal?: string | undefined;
                tools?: string[] | undefined;
                backstory?: string | undefined;
                llm?: string | undefined;
                max_iter?: number | undefined;
                verbose?: boolean | undefined;
                allow_delegation?: boolean | undefined;
            }> | undefined;
            tasks?: Record<string, {
                agent?: string | undefined;
                description?: string | undefined;
                tools?: string[] | undefined;
                expected_output?: string | undefined;
                human_input?: boolean | undefined;
                context?: string[] | undefined;
            }> | undefined;
            crews?: Record<string, {
                agents?: string[] | undefined;
                process?: "sequential" | "hierarchical" | undefined;
                tasks?: string[] | undefined;
                memory?: boolean | undefined;
                cache?: boolean | undefined;
            }> | undefined;
        }, {
            agents?: Record<string, {
                role?: string | undefined;
                goal?: string | undefined;
                tools?: string[] | undefined;
                backstory?: string | undefined;
                llm?: string | undefined;
                max_iter?: number | undefined;
                verbose?: boolean | undefined;
                allow_delegation?: boolean | undefined;
            }> | undefined;
            tasks?: Record<string, {
                agent?: string | undefined;
                description?: string | undefined;
                tools?: string[] | undefined;
                expected_output?: string | undefined;
                human_input?: boolean | undefined;
                context?: string[] | undefined;
            }> | undefined;
            crews?: Record<string, {
                agents?: string[] | undefined;
                process?: "sequential" | "hierarchical" | undefined;
                tasks?: string[] | undefined;
                memory?: boolean | undefined;
                cache?: boolean | undefined;
            }> | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        crewMetadata?: {
            estimatedDuration?: number | undefined;
            agentCount?: number | undefined;
            taskCount?: number | undefined;
            process?: "unknown" | "sequential" | "hierarchical" | undefined;
            hasMemory?: boolean | undefined;
            hasCache?: boolean | undefined;
            verboseMode?: boolean | undefined;
        } | undefined;
        behavioralDimensions?: {
            complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            hasToolUsage?: boolean | undefined;
            toolsList?: string[] | undefined;
            hasFileIO?: boolean | undefined;
            fileOperations?: {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            } | undefined;
            hasExternalAPIs?: boolean | undefined;
            apiCalls?: string[] | undefined;
            hasHumanInLoop?: boolean | undefined;
            humanInteractionPoints?: {
                type: "input" | "approval" | "review";
                description: string;
                taskName: string;
                blocking?: boolean | undefined;
            }[] | undefined;
            hasConditionalLogic?: boolean | undefined;
            conditionalPaths?: {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }[] | undefined;
            hasErrorHandling?: boolean | undefined;
            errorHandlers?: {
                exceptionTypes: string[];
                hasRetry: boolean;
                hasFallback: boolean;
                lineno?: number | undefined;
            }[] | undefined;
            hasStateManagement?: boolean | undefined;
            stateVariables?: string[] | undefined;
        } | undefined;
        externalInteractions?: {
            fileOperations?: {
                reads?: string[] | undefined;
                writes?: string[] | undefined;
                formats?: string[] | undefined;
            } | undefined;
            tools?: {
                type: "custom" | "search" | "file" | "api" | "database";
                name: string;
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }[] | undefined;
            apis?: {
                name: string;
                operations?: string[] | undefined;
                endpoint?: string | undefined;
                envVar?: string | undefined;
                protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
            }[] | undefined;
            databases?: {
                type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }[] | undefined;
            llmProviders?: {
                agent: string;
                provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                model: string;
            }[] | undefined;
        } | undefined;
        flowChart?: string | undefined;
        yamlConfig?: {
            agents?: Record<string, {
                role?: string | undefined;
                goal?: string | undefined;
                tools?: string[] | undefined;
                backstory?: string | undefined;
                llm?: string | undefined;
                max_iter?: number | undefined;
                verbose?: boolean | undefined;
                allow_delegation?: boolean | undefined;
            }> | undefined;
            tasks?: Record<string, {
                agent?: string | undefined;
                description?: string | undefined;
                tools?: string[] | undefined;
                expected_output?: string | undefined;
                human_input?: boolean | undefined;
                context?: string[] | undefined;
            }> | undefined;
            crews?: Record<string, {
                agents?: string[] | undefined;
                process?: "sequential" | "hierarchical" | undefined;
                tasks?: string[] | undefined;
                memory?: boolean | undefined;
                cache?: boolean | undefined;
            }> | undefined;
        } | undefined;
    }, {
        crewMetadata?: {
            estimatedDuration?: number | undefined;
            agentCount?: number | undefined;
            taskCount?: number | undefined;
            process?: "unknown" | "sequential" | "hierarchical" | undefined;
            hasMemory?: boolean | undefined;
            hasCache?: boolean | undefined;
            verboseMode?: boolean | undefined;
        } | undefined;
        behavioralDimensions?: {
            complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            hasToolUsage?: boolean | undefined;
            toolsList?: string[] | undefined;
            hasFileIO?: boolean | undefined;
            fileOperations?: {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            } | undefined;
            hasExternalAPIs?: boolean | undefined;
            apiCalls?: string[] | undefined;
            hasHumanInLoop?: boolean | undefined;
            humanInteractionPoints?: {
                type: "input" | "approval" | "review";
                description: string;
                taskName: string;
                blocking?: boolean | undefined;
            }[] | undefined;
            hasConditionalLogic?: boolean | undefined;
            conditionalPaths?: {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }[] | undefined;
            hasErrorHandling?: boolean | undefined;
            errorHandlers?: {
                exceptionTypes: string[];
                hasRetry: boolean;
                hasFallback: boolean;
                lineno?: number | undefined;
            }[] | undefined;
            hasStateManagement?: boolean | undefined;
            stateVariables?: string[] | undefined;
        } | undefined;
        externalInteractions?: {
            fileOperations?: {
                reads?: string[] | undefined;
                writes?: string[] | undefined;
                formats?: string[] | undefined;
            } | undefined;
            tools?: {
                type: "custom" | "search" | "file" | "api" | "database";
                name: string;
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }[] | undefined;
            apis?: {
                name: string;
                operations?: string[] | undefined;
                endpoint?: string | undefined;
                envVar?: string | undefined;
                protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
            }[] | undefined;
            databases?: {
                type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }[] | undefined;
            llmProviders?: {
                agent: string;
                provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                model: string;
            }[] | undefined;
        } | undefined;
        flowChart?: string | undefined;
        yamlConfig?: {
            agents?: Record<string, {
                role?: string | undefined;
                goal?: string | undefined;
                tools?: string[] | undefined;
                backstory?: string | undefined;
                llm?: string | undefined;
                max_iter?: number | undefined;
                verbose?: boolean | undefined;
                allow_delegation?: boolean | undefined;
            }> | undefined;
            tasks?: Record<string, {
                agent?: string | undefined;
                description?: string | undefined;
                tools?: string[] | undefined;
                expected_output?: string | undefined;
                human_input?: boolean | undefined;
                context?: string[] | undefined;
            }> | undefined;
            crews?: Record<string, {
                agents?: string[] | undefined;
                process?: "sequential" | "hierarchical" | undefined;
                tasks?: string[] | undefined;
                memory?: boolean | undefined;
                cache?: boolean | undefined;
            }> | undefined;
        } | undefined;
    }>>;
    contract: z.ZodOptional<z.ZodObject<{
        purpose: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["crew", "team", "workflow", "pipeline"]>>;
        description: z.ZodOptional<z.ZodString>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        complexity: z.ZodOptional<z.ZodEnum<["simple", "moderate", "complex", "advanced"]>>;
        domain: z.ZodOptional<z.ZodString>;
        useCases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        estimatedDuration: z.ZodOptional<z.ZodNumber>;
        requiresHumanInput: z.ZodOptional<z.ZodBoolean>;
        externalServices: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        producesArtifacts: z.ZodOptional<z.ZodBoolean>;
        artifactTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type?: "team" | "crew" | "workflow" | "pipeline" | undefined;
        description?: string | undefined;
        capabilities?: string[] | undefined;
        estimatedDuration?: number | undefined;
        requiresHumanInput?: boolean | undefined;
        externalServices?: string[] | undefined;
        purpose?: string | undefined;
        complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
        domain?: string | undefined;
        useCases?: string[] | undefined;
        limitations?: string[] | undefined;
        dependencies?: string[] | undefined;
        producesArtifacts?: boolean | undefined;
        artifactTypes?: string[] | undefined;
    }, {
        type?: "team" | "crew" | "workflow" | "pipeline" | undefined;
        description?: string | undefined;
        capabilities?: string[] | undefined;
        estimatedDuration?: number | undefined;
        requiresHumanInput?: boolean | undefined;
        externalServices?: string[] | undefined;
        purpose?: string | undefined;
        complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
        domain?: string | undefined;
        useCases?: string[] | undefined;
        limitations?: string[] | undefined;
        dependencies?: string[] | undefined;
        producesArtifacts?: boolean | undefined;
        artifactTypes?: string[] | undefined;
    }>>;
    testSpecs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        generated: z.ZodOptional<z.ZodString>;
        generatedBy: z.ZodOptional<z.ZodString>;
        tests: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
            input: z.ZodAny;
            expected: z.ZodOptional<z.ZodAny>;
            /**
             * UI-friendly description of what this test is checking (5-7 words)
             * LLM-generated during test creation, shown in CLI
             * Format: "Testing: [description]"
             */
            ui_description: z.ZodOptional<z.ZodString>;
            /**
             * Dimension type for this test (runtime field)
             * Now accepts any registered dimension - no hardcoded validation
             */
            dimension: z.ZodOptional<z.ZodString>;
            /**
             * Agent information for this test (runtime field)
             */
            agent: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                framework: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                framework: string;
                id: string;
                name: string;
            }, {
                framework: string;
                id: string;
                name: string;
            }>>;
            /**
             * Runtime metadata for test execution
             */
            metadata: z.ZodOptional<z.ZodAny>;
            /**
             * NEW: Evaluation criteria as structured objects (v2.0)
             * Each criterion can have optional strictness and special instructions
             */
            evaluation_criteria: z.ZodOptional<z.ZodArray<z.ZodObject<{
                /**
                 * The actual criterion to evaluate (e.g., "Output format is consistent")
                 */
                criterion: z.ZodString;
                /**
                 * Optional: Override dimension's default strictness for this criterion (0-100)
                 * User-editable in eval-spec.json
                 */
                evaluation_strictness: z.ZodOptional<z.ZodNumber>;
                /**
                 * Optional: Additional context/instructions for evaluating this criterion
                 * User-editable in eval-spec.json
                 */
                special_instructions: z.ZodOptional<z.ZodString>;
                /**
                 * Optional: UI-friendly description for this criterion (4-6 words)
                 * LLM-generated during test creation for display in CLI
                 */
                ui_description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }, {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }>, "many">>;
            /**
             * DEPRECATED: Old string-based criteria (v1.0)
             * Now supports both string[] (old) and EvaluationCriterion[] (new) formats
             */
            evaluationCriteria: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodObject<{
                /**
                 * The actual criterion to evaluate (e.g., "Output format is consistent")
                 */
                criterion: z.ZodString;
                /**
                 * Optional: Override dimension's default strictness for this criterion (0-100)
                 * User-editable in eval-spec.json
                 */
                evaluation_strictness: z.ZodOptional<z.ZodNumber>;
                /**
                 * Optional: Additional context/instructions for evaluating this criterion
                 * User-editable in eval-spec.json
                 */
                special_instructions: z.ZodOptional<z.ZodString>;
                /**
                 * Optional: UI-friendly description for this criterion (4-6 words)
                 * LLM-generated during test creation for display in CLI
                 */
                ui_description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }, {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }>, "many">]>>;
            /**
             * NEW: Test-level threshold overrides
             * Allows individual tests to override dimension defaults
             */
            thresholds: z.ZodOptional<z.ZodObject<{
                /**
                 * Percentage of criteria that must pass (0-100)
                 * Overrides dimension default
                 */
                passing_criteria_percentage: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                passing_criteria_percentage?: number | undefined;
            }, {
                passing_criteria_percentage?: number | undefined;
            }>>;
            priority: z.ZodDefault<z.ZodNumber>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            multiRun: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodOptional<z.ZodBoolean>;
                runCount: z.ZodNumber;
                variations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
                runType: z.ZodOptional<z.ZodString>;
                aggregationStrategy: z.ZodOptional<z.ZodString>;
                executionMode: z.ZodOptional<z.ZodString>;
                inputVariations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            }, "strip", z.ZodTypeAny, {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            }, {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            }>>;
            syntheticInputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            flowMetadata: z.ZodOptional<z.ZodObject<{
                isFlowTest: z.ZodOptional<z.ZodBoolean>;
                flowName: z.ZodOptional<z.ZodString>;
                estimatedDuration: z.ZodOptional<z.ZodNumber>;
                captureArtifacts: z.ZodOptional<z.ZodBoolean>;
                artifactDirectory: z.ZodOptional<z.ZodString>;
                dryRunIntegrations: z.ZodOptional<z.ZodBoolean>;
                requiresHumanInput: z.ZodOptional<z.ZodBoolean>;
                externalServices: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            }, {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            }>>;
            userModified: z.ZodOptional<z.ZodBoolean>;
            userNotes: z.ZodOptional<z.ZodString>;
            generatedBy: z.ZodOptional<z.ZodString>;
            generatedAt: z.ZodOptional<z.ZodString>;
            llmGeneration: z.ZodOptional<z.ZodObject<{
                originalPrompt: z.ZodOptional<z.ZodString>;
                reasoning: z.ZodOptional<z.ZodString>;
                confidence: z.ZodOptional<z.ZodNumber>;
                category: z.ZodOptional<z.ZodString>;
                expectedBehavior: z.ZodOptional<z.ZodString>;
                domainContext: z.ZodOptional<z.ZodString>;
                complexityLevel: z.ZodOptional<z.ZodString>;
                testingFocus: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            }, {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            priority: number;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }, {
            id: string;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            priority?: number | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        tests: {
            id: string;
            priority: number;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }[];
        generated?: string | undefined;
        generatedBy?: string | undefined;
    }, {
        generated?: string | undefined;
        generatedBy?: string | undefined;
        tests?: {
            id: string;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            priority?: number | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }[] | undefined;
    }>>>;
    executionConfig: z.ZodOptional<z.ZodObject<{
        timeout: z.ZodOptional<z.ZodNumber>;
        allowExternalCalls: z.ZodOptional<z.ZodBoolean>;
        captureArtifacts: z.ZodOptional<z.ZodBoolean>;
        artifactDirectory: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        captureArtifacts?: boolean | undefined;
        artifactDirectory?: string | undefined;
        timeout?: number | undefined;
        allowExternalCalls?: boolean | undefined;
    }, {
        captureArtifacts?: boolean | undefined;
        artifactDirectory?: string | undefined;
        timeout?: number | undefined;
        allowExternalCalls?: boolean | undefined;
    }>>;
    performance: z.ZodOptional<z.ZodObject<{
        lastRun: z.ZodOptional<z.ZodString>;
        totalRuns: z.ZodDefault<z.ZodNumber>;
        averageScore: z.ZodDefault<z.ZodNumber>;
        scoreHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
            timestamp: z.ZodString;
            dimension: z.ZodString;
            score: z.ZodNumber;
            passed: z.ZodBoolean;
            details: z.ZodOptional<z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }, {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }>, "many">>;
        trends: z.ZodOptional<z.ZodObject<{
            improving: z.ZodBoolean;
            degrading: z.ZodBoolean;
            stable: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        }, {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        totalRuns: number;
        averageScore: number;
        scoreHistory: {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }[];
        lastRun?: string | undefined;
        trends?: {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        } | undefined;
    }, {
        lastRun?: string | undefined;
        totalRuns?: number | undefined;
        averageScore?: number | undefined;
        scoreHistory?: {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }[] | undefined;
        trends?: {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    members: string[];
    analysis?: {
        crewMetadata?: {
            estimatedDuration?: number | undefined;
            agentCount?: number | undefined;
            taskCount?: number | undefined;
            process?: "unknown" | "sequential" | "hierarchical" | undefined;
            hasMemory?: boolean | undefined;
            hasCache?: boolean | undefined;
            verboseMode?: boolean | undefined;
        } | undefined;
        behavioralDimensions?: {
            complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            hasToolUsage?: boolean | undefined;
            toolsList?: string[] | undefined;
            hasFileIO?: boolean | undefined;
            fileOperations?: {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            } | undefined;
            hasExternalAPIs?: boolean | undefined;
            apiCalls?: string[] | undefined;
            hasHumanInLoop?: boolean | undefined;
            humanInteractionPoints?: {
                type: "input" | "approval" | "review";
                description: string;
                taskName: string;
                blocking?: boolean | undefined;
            }[] | undefined;
            hasConditionalLogic?: boolean | undefined;
            conditionalPaths?: {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }[] | undefined;
            hasErrorHandling?: boolean | undefined;
            errorHandlers?: {
                exceptionTypes: string[];
                hasRetry: boolean;
                hasFallback: boolean;
                lineno?: number | undefined;
            }[] | undefined;
            hasStateManagement?: boolean | undefined;
            stateVariables?: string[] | undefined;
        } | undefined;
        externalInteractions?: {
            fileOperations?: {
                reads?: string[] | undefined;
                writes?: string[] | undefined;
                formats?: string[] | undefined;
            } | undefined;
            tools?: {
                type: "custom" | "search" | "file" | "api" | "database";
                name: string;
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }[] | undefined;
            apis?: {
                name: string;
                operations?: string[] | undefined;
                endpoint?: string | undefined;
                envVar?: string | undefined;
                protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
            }[] | undefined;
            databases?: {
                type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }[] | undefined;
            llmProviders?: {
                agent: string;
                provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                model: string;
            }[] | undefined;
        } | undefined;
        flowChart?: string | undefined;
        yamlConfig?: {
            agents?: Record<string, {
                role?: string | undefined;
                goal?: string | undefined;
                tools?: string[] | undefined;
                backstory?: string | undefined;
                llm?: string | undefined;
                max_iter?: number | undefined;
                verbose?: boolean | undefined;
                allow_delegation?: boolean | undefined;
            }> | undefined;
            tasks?: Record<string, {
                agent?: string | undefined;
                description?: string | undefined;
                tools?: string[] | undefined;
                expected_output?: string | undefined;
                human_input?: boolean | undefined;
                context?: string[] | undefined;
            }> | undefined;
            crews?: Record<string, {
                agents?: string[] | undefined;
                process?: "sequential" | "hierarchical" | undefined;
                tasks?: string[] | undefined;
                memory?: boolean | undefined;
                cache?: boolean | undefined;
            }> | undefined;
        } | undefined;
    } | undefined;
    coordinator?: string | undefined;
    description?: string | undefined;
    discovered?: {
        version: number;
        path?: string | undefined;
        firstSeen?: string | undefined;
        lastModified?: string | undefined;
        sourceHash?: string | undefined;
    } | undefined;
    contract?: {
        type?: "team" | "crew" | "workflow" | "pipeline" | undefined;
        description?: string | undefined;
        capabilities?: string[] | undefined;
        estimatedDuration?: number | undefined;
        requiresHumanInput?: boolean | undefined;
        externalServices?: string[] | undefined;
        purpose?: string | undefined;
        complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
        domain?: string | undefined;
        useCases?: string[] | undefined;
        limitations?: string[] | undefined;
        dependencies?: string[] | undefined;
        producesArtifacts?: boolean | undefined;
        artifactTypes?: string[] | undefined;
    } | undefined;
    testSpecs?: Record<string, {
        tests: {
            id: string;
            priority: number;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }[];
        generated?: string | undefined;
        generatedBy?: string | undefined;
    }> | undefined;
    performance?: {
        totalRuns: number;
        averageScore: number;
        scoreHistory: {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }[];
        lastRun?: string | undefined;
        trends?: {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        } | undefined;
    } | undefined;
    executionConfig?: {
        captureArtifacts?: boolean | undefined;
        artifactDirectory?: string | undefined;
        timeout?: number | undefined;
        allowExternalCalls?: boolean | undefined;
    } | undefined;
}, {
    name: string;
    members: string[];
    analysis?: {
        crewMetadata?: {
            estimatedDuration?: number | undefined;
            agentCount?: number | undefined;
            taskCount?: number | undefined;
            process?: "unknown" | "sequential" | "hierarchical" | undefined;
            hasMemory?: boolean | undefined;
            hasCache?: boolean | undefined;
            verboseMode?: boolean | undefined;
        } | undefined;
        behavioralDimensions?: {
            complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            hasToolUsage?: boolean | undefined;
            toolsList?: string[] | undefined;
            hasFileIO?: boolean | undefined;
            fileOperations?: {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            } | undefined;
            hasExternalAPIs?: boolean | undefined;
            apiCalls?: string[] | undefined;
            hasHumanInLoop?: boolean | undefined;
            humanInteractionPoints?: {
                type: "input" | "approval" | "review";
                description: string;
                taskName: string;
                blocking?: boolean | undefined;
            }[] | undefined;
            hasConditionalLogic?: boolean | undefined;
            conditionalPaths?: {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }[] | undefined;
            hasErrorHandling?: boolean | undefined;
            errorHandlers?: {
                exceptionTypes: string[];
                hasRetry: boolean;
                hasFallback: boolean;
                lineno?: number | undefined;
            }[] | undefined;
            hasStateManagement?: boolean | undefined;
            stateVariables?: string[] | undefined;
        } | undefined;
        externalInteractions?: {
            fileOperations?: {
                reads?: string[] | undefined;
                writes?: string[] | undefined;
                formats?: string[] | undefined;
            } | undefined;
            tools?: {
                type: "custom" | "search" | "file" | "api" | "database";
                name: string;
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }[] | undefined;
            apis?: {
                name: string;
                operations?: string[] | undefined;
                endpoint?: string | undefined;
                envVar?: string | undefined;
                protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
            }[] | undefined;
            databases?: {
                type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                operations?: string[] | undefined;
                requiredEnvVars?: string[] | undefined;
            }[] | undefined;
            llmProviders?: {
                agent: string;
                provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                model: string;
            }[] | undefined;
        } | undefined;
        flowChart?: string | undefined;
        yamlConfig?: {
            agents?: Record<string, {
                role?: string | undefined;
                goal?: string | undefined;
                tools?: string[] | undefined;
                backstory?: string | undefined;
                llm?: string | undefined;
                max_iter?: number | undefined;
                verbose?: boolean | undefined;
                allow_delegation?: boolean | undefined;
            }> | undefined;
            tasks?: Record<string, {
                agent?: string | undefined;
                description?: string | undefined;
                tools?: string[] | undefined;
                expected_output?: string | undefined;
                human_input?: boolean | undefined;
                context?: string[] | undefined;
            }> | undefined;
            crews?: Record<string, {
                agents?: string[] | undefined;
                process?: "sequential" | "hierarchical" | undefined;
                tasks?: string[] | undefined;
                memory?: boolean | undefined;
                cache?: boolean | undefined;
            }> | undefined;
        } | undefined;
    } | undefined;
    coordinator?: string | undefined;
    description?: string | undefined;
    discovered?: {
        version?: number | undefined;
        path?: string | undefined;
        firstSeen?: string | undefined;
        lastModified?: string | undefined;
        sourceHash?: string | undefined;
    } | undefined;
    contract?: {
        type?: "team" | "crew" | "workflow" | "pipeline" | undefined;
        description?: string | undefined;
        capabilities?: string[] | undefined;
        estimatedDuration?: number | undefined;
        requiresHumanInput?: boolean | undefined;
        externalServices?: string[] | undefined;
        purpose?: string | undefined;
        complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
        domain?: string | undefined;
        useCases?: string[] | undefined;
        limitations?: string[] | undefined;
        dependencies?: string[] | undefined;
        producesArtifacts?: boolean | undefined;
        artifactTypes?: string[] | undefined;
    } | undefined;
    testSpecs?: Record<string, {
        generated?: string | undefined;
        generatedBy?: string | undefined;
        tests?: {
            id: string;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            priority?: number | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }[] | undefined;
    }> | undefined;
    performance?: {
        lastRun?: string | undefined;
        totalRuns?: number | undefined;
        averageScore?: number | undefined;
        scoreHistory?: {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }[] | undefined;
        trends?: {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        } | undefined;
    } | undefined;
    executionConfig?: {
        captureArtifacts?: boolean | undefined;
        artifactDirectory?: string | undefined;
        timeout?: number | undefined;
        allowExternalCalls?: boolean | undefined;
    } | undefined;
}>;
export declare const FlowSpecSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodLiteral<"workflow">;
    description: z.ZodOptional<z.ZodString>;
    discovered: z.ZodOptional<z.ZodObject<{
        firstSeen: z.ZodOptional<z.ZodString>;
        lastModified: z.ZodOptional<z.ZodString>;
        sourceHash: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
        version: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        version: number;
        path?: string | undefined;
        firstSeen?: string | undefined;
        lastModified?: string | undefined;
        sourceHash?: string | undefined;
    }, {
        version?: number | undefined;
        path?: string | undefined;
        firstSeen?: string | undefined;
        lastModified?: string | undefined;
        sourceHash?: string | undefined;
    }>>;
    analysis: z.ZodOptional<z.ZodObject<{
        workflowMetadata: z.ZodOptional<z.ZodObject<{
            stepCount: z.ZodOptional<z.ZodNumber>;
            estimatedDuration: z.ZodOptional<z.ZodNumber>;
            crewCount: z.ZodOptional<z.ZodNumber>;
            humanInteractionPoints: z.ZodOptional<z.ZodArray<z.ZodObject<{
                method: z.ZodString;
                type: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                type: string;
                method: string;
                description?: string | undefined;
            }, {
                type: string;
                method: string;
                description?: string | undefined;
            }>, "many">>;
            externalServices: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                operations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                envVar: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }, {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }>, "many">>;
            routerLabels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            parallelCrews: z.ZodOptional<z.ZodBoolean>;
            crewChaining: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            estimatedDuration?: number | undefined;
            externalServices?: {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }[] | undefined;
            humanInteractionPoints?: {
                type: string;
                method: string;
                description?: string | undefined;
            }[] | undefined;
            stepCount?: number | undefined;
            crewCount?: number | undefined;
            routerLabels?: string[] | undefined;
            parallelCrews?: boolean | undefined;
            crewChaining?: boolean | undefined;
        }, {
            estimatedDuration?: number | undefined;
            externalServices?: {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }[] | undefined;
            humanInteractionPoints?: {
                type: string;
                method: string;
                description?: string | undefined;
            }[] | undefined;
            stepCount?: number | undefined;
            crewCount?: number | undefined;
            routerLabels?: string[] | undefined;
            parallelCrews?: boolean | undefined;
            crewChaining?: boolean | undefined;
        }>>;
        behavioralDimensions: z.ZodOptional<z.ZodObject<{
            collectsUserInput: z.ZodOptional<z.ZodBoolean>;
            makesLLMCalls: z.ZodOptional<z.ZodBoolean>;
            hasFileIO: z.ZodOptional<z.ZodBoolean>;
            hasConditionalLogic: z.ZodOptional<z.ZodBoolean>;
            hasLoops: z.ZodOptional<z.ZodBoolean>;
            executesCrews: z.ZodOptional<z.ZodBoolean>;
            crewCount: z.ZodOptional<z.ZodNumber>;
            crewChaining: z.ZodOptional<z.ZodBoolean>;
            parallelCrews: z.ZodOptional<z.ZodBoolean>;
            hasHumanInLoop: z.ZodOptional<z.ZodBoolean>;
            hasExternalIntegrations: z.ZodOptional<z.ZodBoolean>;
            hasStateEvolution: z.ZodOptional<z.ZodBoolean>;
            hasParallelExecution: z.ZodOptional<z.ZodBoolean>;
            hasInfiniteLoop: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            hasFileIO?: boolean | undefined;
            hasHumanInLoop?: boolean | undefined;
            hasConditionalLogic?: boolean | undefined;
            crewCount?: number | undefined;
            parallelCrews?: boolean | undefined;
            crewChaining?: boolean | undefined;
            collectsUserInput?: boolean | undefined;
            makesLLMCalls?: boolean | undefined;
            hasLoops?: boolean | undefined;
            executesCrews?: boolean | undefined;
            hasExternalIntegrations?: boolean | undefined;
            hasStateEvolution?: boolean | undefined;
            hasParallelExecution?: boolean | undefined;
            hasInfiniteLoop?: boolean | undefined;
        }, {
            hasFileIO?: boolean | undefined;
            hasHumanInLoop?: boolean | undefined;
            hasConditionalLogic?: boolean | undefined;
            crewCount?: number | undefined;
            parallelCrews?: boolean | undefined;
            crewChaining?: boolean | undefined;
            collectsUserInput?: boolean | undefined;
            makesLLMCalls?: boolean | undefined;
            hasLoops?: boolean | undefined;
            executesCrews?: boolean | undefined;
            hasExternalIntegrations?: boolean | undefined;
            hasStateEvolution?: boolean | undefined;
            hasParallelExecution?: boolean | undefined;
            hasInfiniteLoop?: boolean | undefined;
        }>>;
        externalInteractions: z.ZodOptional<z.ZodObject<{
            crews: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            apis: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            databases: z.ZodOptional<z.ZodBoolean>;
            fileOperations: z.ZodOptional<z.ZodObject<{
                reads: z.ZodOptional<z.ZodBoolean>;
                writes: z.ZodOptional<z.ZodBoolean>;
                formats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            }, {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            }>>;
            services: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                envVar: z.ZodOptional<z.ZodString>;
                operations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }, {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            fileOperations?: {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            } | undefined;
            apis?: string[] | undefined;
            databases?: boolean | undefined;
            crews?: string[] | undefined;
            services?: {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }[] | undefined;
        }, {
            fileOperations?: {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            } | undefined;
            apis?: string[] | undefined;
            databases?: boolean | undefined;
            crews?: string[] | undefined;
            services?: {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }[] | undefined;
        }>>;
        routingLogic: z.ZodOptional<z.ZodObject<{
            routerMethods: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            routerLabels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            conditionalPaths: z.ZodOptional<z.ZodArray<z.ZodObject<{
                condition: z.ZodString;
                target: z.ZodString;
                lineno: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }, {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            conditionalPaths?: {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }[] | undefined;
            routerLabels?: string[] | undefined;
            routerMethods?: string[] | undefined;
        }, {
            conditionalPaths?: {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }[] | undefined;
            routerLabels?: string[] | undefined;
            routerMethods?: string[] | undefined;
        }>>;
        frameworkSpecific: z.ZodOptional<z.ZodObject<{
            decorators: z.ZodOptional<z.ZodObject<{
                starts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                listeners: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                routers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                starts?: string[] | undefined;
                listeners?: string[] | undefined;
                routers?: string[] | undefined;
            }, {
                starts?: string[] | undefined;
                listeners?: string[] | undefined;
                routers?: string[] | undefined;
            }>>;
            stateModel: z.ZodOptional<z.ZodString>;
            flowClass: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            decorators?: {
                starts?: string[] | undefined;
                listeners?: string[] | undefined;
                routers?: string[] | undefined;
            } | undefined;
            stateModel?: string | undefined;
            flowClass?: string | undefined;
        }, {
            decorators?: {
                starts?: string[] | undefined;
                listeners?: string[] | undefined;
                routers?: string[] | undefined;
            } | undefined;
            stateModel?: string | undefined;
            flowClass?: string | undefined;
        }>>;
        flowChart: z.ZodOptional<z.ZodString>;
        yamlConfig: z.ZodOptional<z.ZodObject<{
            agents: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            tasks: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            crews: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            agents?: Record<string, any> | undefined;
            tasks?: Record<string, any> | undefined;
            crews?: Record<string, any> | undefined;
        }, {
            agents?: Record<string, any> | undefined;
            tasks?: Record<string, any> | undefined;
            crews?: Record<string, any> | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        behavioralDimensions?: {
            hasFileIO?: boolean | undefined;
            hasHumanInLoop?: boolean | undefined;
            hasConditionalLogic?: boolean | undefined;
            crewCount?: number | undefined;
            parallelCrews?: boolean | undefined;
            crewChaining?: boolean | undefined;
            collectsUserInput?: boolean | undefined;
            makesLLMCalls?: boolean | undefined;
            hasLoops?: boolean | undefined;
            executesCrews?: boolean | undefined;
            hasExternalIntegrations?: boolean | undefined;
            hasStateEvolution?: boolean | undefined;
            hasParallelExecution?: boolean | undefined;
            hasInfiniteLoop?: boolean | undefined;
        } | undefined;
        externalInteractions?: {
            fileOperations?: {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            } | undefined;
            apis?: string[] | undefined;
            databases?: boolean | undefined;
            crews?: string[] | undefined;
            services?: {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }[] | undefined;
        } | undefined;
        flowChart?: string | undefined;
        yamlConfig?: {
            agents?: Record<string, any> | undefined;
            tasks?: Record<string, any> | undefined;
            crews?: Record<string, any> | undefined;
        } | undefined;
        workflowMetadata?: {
            estimatedDuration?: number | undefined;
            externalServices?: {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }[] | undefined;
            humanInteractionPoints?: {
                type: string;
                method: string;
                description?: string | undefined;
            }[] | undefined;
            stepCount?: number | undefined;
            crewCount?: number | undefined;
            routerLabels?: string[] | undefined;
            parallelCrews?: boolean | undefined;
            crewChaining?: boolean | undefined;
        } | undefined;
        routingLogic?: {
            conditionalPaths?: {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }[] | undefined;
            routerLabels?: string[] | undefined;
            routerMethods?: string[] | undefined;
        } | undefined;
        frameworkSpecific?: {
            decorators?: {
                starts?: string[] | undefined;
                listeners?: string[] | undefined;
                routers?: string[] | undefined;
            } | undefined;
            stateModel?: string | undefined;
            flowClass?: string | undefined;
        } | undefined;
    }, {
        behavioralDimensions?: {
            hasFileIO?: boolean | undefined;
            hasHumanInLoop?: boolean | undefined;
            hasConditionalLogic?: boolean | undefined;
            crewCount?: number | undefined;
            parallelCrews?: boolean | undefined;
            crewChaining?: boolean | undefined;
            collectsUserInput?: boolean | undefined;
            makesLLMCalls?: boolean | undefined;
            hasLoops?: boolean | undefined;
            executesCrews?: boolean | undefined;
            hasExternalIntegrations?: boolean | undefined;
            hasStateEvolution?: boolean | undefined;
            hasParallelExecution?: boolean | undefined;
            hasInfiniteLoop?: boolean | undefined;
        } | undefined;
        externalInteractions?: {
            fileOperations?: {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            } | undefined;
            apis?: string[] | undefined;
            databases?: boolean | undefined;
            crews?: string[] | undefined;
            services?: {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }[] | undefined;
        } | undefined;
        flowChart?: string | undefined;
        yamlConfig?: {
            agents?: Record<string, any> | undefined;
            tasks?: Record<string, any> | undefined;
            crews?: Record<string, any> | undefined;
        } | undefined;
        workflowMetadata?: {
            estimatedDuration?: number | undefined;
            externalServices?: {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }[] | undefined;
            humanInteractionPoints?: {
                type: string;
                method: string;
                description?: string | undefined;
            }[] | undefined;
            stepCount?: number | undefined;
            crewCount?: number | undefined;
            routerLabels?: string[] | undefined;
            parallelCrews?: boolean | undefined;
            crewChaining?: boolean | undefined;
        } | undefined;
        routingLogic?: {
            conditionalPaths?: {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }[] | undefined;
            routerLabels?: string[] | undefined;
            routerMethods?: string[] | undefined;
        } | undefined;
        frameworkSpecific?: {
            decorators?: {
                starts?: string[] | undefined;
                listeners?: string[] | undefined;
                routers?: string[] | undefined;
            } | undefined;
            stateModel?: string | undefined;
            flowClass?: string | undefined;
        } | undefined;
    }>>;
    contract: z.ZodOptional<z.ZodObject<{
        purpose: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        inputRequirements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        outputDescription: z.ZodOptional<z.ZodString>;
        complexity: z.ZodOptional<z.ZodEnum<["simple", "moderate", "complex", "advanced"]>>;
        domain: z.ZodOptional<z.ZodString>;
        useCases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        capabilities?: string[] | undefined;
        purpose?: string | undefined;
        complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
        domain?: string | undefined;
        useCases?: string[] | undefined;
        limitations?: string[] | undefined;
        dependencies?: string[] | undefined;
        inputRequirements?: string[] | undefined;
        outputDescription?: string | undefined;
    }, {
        description?: string | undefined;
        capabilities?: string[] | undefined;
        purpose?: string | undefined;
        complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
        domain?: string | undefined;
        useCases?: string[] | undefined;
        limitations?: string[] | undefined;
        dependencies?: string[] | undefined;
        inputRequirements?: string[] | undefined;
        outputDescription?: string | undefined;
    }>>;
    testSpecs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        generated: z.ZodOptional<z.ZodString>;
        generatedBy: z.ZodOptional<z.ZodString>;
        tests: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
            input: z.ZodAny;
            expected: z.ZodOptional<z.ZodAny>;
            /**
             * UI-friendly description of what this test is checking (5-7 words)
             * LLM-generated during test creation, shown in CLI
             * Format: "Testing: [description]"
             */
            ui_description: z.ZodOptional<z.ZodString>;
            /**
             * Dimension type for this test (runtime field)
             * Now accepts any registered dimension - no hardcoded validation
             */
            dimension: z.ZodOptional<z.ZodString>;
            /**
             * Agent information for this test (runtime field)
             */
            agent: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                framework: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                framework: string;
                id: string;
                name: string;
            }, {
                framework: string;
                id: string;
                name: string;
            }>>;
            /**
             * Runtime metadata for test execution
             */
            metadata: z.ZodOptional<z.ZodAny>;
            /**
             * NEW: Evaluation criteria as structured objects (v2.0)
             * Each criterion can have optional strictness and special instructions
             */
            evaluation_criteria: z.ZodOptional<z.ZodArray<z.ZodObject<{
                /**
                 * The actual criterion to evaluate (e.g., "Output format is consistent")
                 */
                criterion: z.ZodString;
                /**
                 * Optional: Override dimension's default strictness for this criterion (0-100)
                 * User-editable in eval-spec.json
                 */
                evaluation_strictness: z.ZodOptional<z.ZodNumber>;
                /**
                 * Optional: Additional context/instructions for evaluating this criterion
                 * User-editable in eval-spec.json
                 */
                special_instructions: z.ZodOptional<z.ZodString>;
                /**
                 * Optional: UI-friendly description for this criterion (4-6 words)
                 * LLM-generated during test creation for display in CLI
                 */
                ui_description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }, {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }>, "many">>;
            /**
             * DEPRECATED: Old string-based criteria (v1.0)
             * Now supports both string[] (old) and EvaluationCriterion[] (new) formats
             */
            evaluationCriteria: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodObject<{
                /**
                 * The actual criterion to evaluate (e.g., "Output format is consistent")
                 */
                criterion: z.ZodString;
                /**
                 * Optional: Override dimension's default strictness for this criterion (0-100)
                 * User-editable in eval-spec.json
                 */
                evaluation_strictness: z.ZodOptional<z.ZodNumber>;
                /**
                 * Optional: Additional context/instructions for evaluating this criterion
                 * User-editable in eval-spec.json
                 */
                special_instructions: z.ZodOptional<z.ZodString>;
                /**
                 * Optional: UI-friendly description for this criterion (4-6 words)
                 * LLM-generated during test creation for display in CLI
                 */
                ui_description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }, {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }>, "many">]>>;
            /**
             * NEW: Test-level threshold overrides
             * Allows individual tests to override dimension defaults
             */
            thresholds: z.ZodOptional<z.ZodObject<{
                /**
                 * Percentage of criteria that must pass (0-100)
                 * Overrides dimension default
                 */
                passing_criteria_percentage: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                passing_criteria_percentage?: number | undefined;
            }, {
                passing_criteria_percentage?: number | undefined;
            }>>;
            priority: z.ZodDefault<z.ZodNumber>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            multiRun: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodOptional<z.ZodBoolean>;
                runCount: z.ZodNumber;
                variations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
                runType: z.ZodOptional<z.ZodString>;
                aggregationStrategy: z.ZodOptional<z.ZodString>;
                executionMode: z.ZodOptional<z.ZodString>;
                inputVariations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            }, "strip", z.ZodTypeAny, {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            }, {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            }>>;
            syntheticInputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            flowMetadata: z.ZodOptional<z.ZodObject<{
                isFlowTest: z.ZodOptional<z.ZodBoolean>;
                flowName: z.ZodOptional<z.ZodString>;
                estimatedDuration: z.ZodOptional<z.ZodNumber>;
                captureArtifacts: z.ZodOptional<z.ZodBoolean>;
                artifactDirectory: z.ZodOptional<z.ZodString>;
                dryRunIntegrations: z.ZodOptional<z.ZodBoolean>;
                requiresHumanInput: z.ZodOptional<z.ZodBoolean>;
                externalServices: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            }, {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            }>>;
            userModified: z.ZodOptional<z.ZodBoolean>;
            userNotes: z.ZodOptional<z.ZodString>;
            generatedBy: z.ZodOptional<z.ZodString>;
            generatedAt: z.ZodOptional<z.ZodString>;
            llmGeneration: z.ZodOptional<z.ZodObject<{
                originalPrompt: z.ZodOptional<z.ZodString>;
                reasoning: z.ZodOptional<z.ZodString>;
                confidence: z.ZodOptional<z.ZodNumber>;
                category: z.ZodOptional<z.ZodString>;
                expectedBehavior: z.ZodOptional<z.ZodString>;
                domainContext: z.ZodOptional<z.ZodString>;
                complexityLevel: z.ZodOptional<z.ZodString>;
                testingFocus: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            }, {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            priority: number;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }, {
            id: string;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            priority?: number | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        tests: {
            id: string;
            priority: number;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }[];
        generated?: string | undefined;
        generatedBy?: string | undefined;
    }, {
        generated?: string | undefined;
        generatedBy?: string | undefined;
        tests?: {
            id: string;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            priority?: number | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }[] | undefined;
    }>>>;
    executionConfig: z.ZodOptional<z.ZodObject<{
        timeout: z.ZodOptional<z.ZodNumber>;
        allowExternalCalls: z.ZodOptional<z.ZodBoolean>;
        captureArtifacts: z.ZodOptional<z.ZodBoolean>;
        artifactDirectory: z.ZodOptional<z.ZodString>;
        dryRunIntegrations: z.ZodOptional<z.ZodBoolean>;
        maxRetries: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        captureArtifacts?: boolean | undefined;
        artifactDirectory?: string | undefined;
        dryRunIntegrations?: boolean | undefined;
        timeout?: number | undefined;
        allowExternalCalls?: boolean | undefined;
        maxRetries?: number | undefined;
    }, {
        captureArtifacts?: boolean | undefined;
        artifactDirectory?: string | undefined;
        dryRunIntegrations?: boolean | undefined;
        timeout?: number | undefined;
        allowExternalCalls?: boolean | undefined;
        maxRetries?: number | undefined;
    }>>;
    performance: z.ZodOptional<z.ZodObject<{
        lastRun: z.ZodOptional<z.ZodString>;
        totalRuns: z.ZodDefault<z.ZodNumber>;
        averageScore: z.ZodDefault<z.ZodNumber>;
        scoreHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
            timestamp: z.ZodString;
            dimension: z.ZodString;
            score: z.ZodNumber;
            passed: z.ZodBoolean;
            details: z.ZodOptional<z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }, {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }>, "many">>;
        trends: z.ZodOptional<z.ZodObject<{
            improving: z.ZodBoolean;
            degrading: z.ZodBoolean;
            stable: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        }, {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        totalRuns: number;
        averageScore: number;
        scoreHistory: {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }[];
        lastRun?: string | undefined;
        trends?: {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        } | undefined;
    }, {
        lastRun?: string | undefined;
        totalRuns?: number | undefined;
        averageScore?: number | undefined;
        scoreHistory?: {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }[] | undefined;
        trends?: {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "workflow";
    name: string;
    analysis?: {
        behavioralDimensions?: {
            hasFileIO?: boolean | undefined;
            hasHumanInLoop?: boolean | undefined;
            hasConditionalLogic?: boolean | undefined;
            crewCount?: number | undefined;
            parallelCrews?: boolean | undefined;
            crewChaining?: boolean | undefined;
            collectsUserInput?: boolean | undefined;
            makesLLMCalls?: boolean | undefined;
            hasLoops?: boolean | undefined;
            executesCrews?: boolean | undefined;
            hasExternalIntegrations?: boolean | undefined;
            hasStateEvolution?: boolean | undefined;
            hasParallelExecution?: boolean | undefined;
            hasInfiniteLoop?: boolean | undefined;
        } | undefined;
        externalInteractions?: {
            fileOperations?: {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            } | undefined;
            apis?: string[] | undefined;
            databases?: boolean | undefined;
            crews?: string[] | undefined;
            services?: {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }[] | undefined;
        } | undefined;
        flowChart?: string | undefined;
        yamlConfig?: {
            agents?: Record<string, any> | undefined;
            tasks?: Record<string, any> | undefined;
            crews?: Record<string, any> | undefined;
        } | undefined;
        workflowMetadata?: {
            estimatedDuration?: number | undefined;
            externalServices?: {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }[] | undefined;
            humanInteractionPoints?: {
                type: string;
                method: string;
                description?: string | undefined;
            }[] | undefined;
            stepCount?: number | undefined;
            crewCount?: number | undefined;
            routerLabels?: string[] | undefined;
            parallelCrews?: boolean | undefined;
            crewChaining?: boolean | undefined;
        } | undefined;
        routingLogic?: {
            conditionalPaths?: {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }[] | undefined;
            routerLabels?: string[] | undefined;
            routerMethods?: string[] | undefined;
        } | undefined;
        frameworkSpecific?: {
            decorators?: {
                starts?: string[] | undefined;
                listeners?: string[] | undefined;
                routers?: string[] | undefined;
            } | undefined;
            stateModel?: string | undefined;
            flowClass?: string | undefined;
        } | undefined;
    } | undefined;
    description?: string | undefined;
    discovered?: {
        version: number;
        path?: string | undefined;
        firstSeen?: string | undefined;
        lastModified?: string | undefined;
        sourceHash?: string | undefined;
    } | undefined;
    contract?: {
        description?: string | undefined;
        capabilities?: string[] | undefined;
        purpose?: string | undefined;
        complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
        domain?: string | undefined;
        useCases?: string[] | undefined;
        limitations?: string[] | undefined;
        dependencies?: string[] | undefined;
        inputRequirements?: string[] | undefined;
        outputDescription?: string | undefined;
    } | undefined;
    testSpecs?: Record<string, {
        tests: {
            id: string;
            priority: number;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }[];
        generated?: string | undefined;
        generatedBy?: string | undefined;
    }> | undefined;
    performance?: {
        totalRuns: number;
        averageScore: number;
        scoreHistory: {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }[];
        lastRun?: string | undefined;
        trends?: {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        } | undefined;
    } | undefined;
    executionConfig?: {
        captureArtifacts?: boolean | undefined;
        artifactDirectory?: string | undefined;
        dryRunIntegrations?: boolean | undefined;
        timeout?: number | undefined;
        allowExternalCalls?: boolean | undefined;
        maxRetries?: number | undefined;
    } | undefined;
}, {
    type: "workflow";
    name: string;
    analysis?: {
        behavioralDimensions?: {
            hasFileIO?: boolean | undefined;
            hasHumanInLoop?: boolean | undefined;
            hasConditionalLogic?: boolean | undefined;
            crewCount?: number | undefined;
            parallelCrews?: boolean | undefined;
            crewChaining?: boolean | undefined;
            collectsUserInput?: boolean | undefined;
            makesLLMCalls?: boolean | undefined;
            hasLoops?: boolean | undefined;
            executesCrews?: boolean | undefined;
            hasExternalIntegrations?: boolean | undefined;
            hasStateEvolution?: boolean | undefined;
            hasParallelExecution?: boolean | undefined;
            hasInfiniteLoop?: boolean | undefined;
        } | undefined;
        externalInteractions?: {
            fileOperations?: {
                reads?: boolean | undefined;
                writes?: boolean | undefined;
                formats?: string[] | undefined;
            } | undefined;
            apis?: string[] | undefined;
            databases?: boolean | undefined;
            crews?: string[] | undefined;
            services?: {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }[] | undefined;
        } | undefined;
        flowChart?: string | undefined;
        yamlConfig?: {
            agents?: Record<string, any> | undefined;
            tasks?: Record<string, any> | undefined;
            crews?: Record<string, any> | undefined;
        } | undefined;
        workflowMetadata?: {
            estimatedDuration?: number | undefined;
            externalServices?: {
                name: string;
                operations?: string[] | undefined;
                envVar?: string | undefined;
            }[] | undefined;
            humanInteractionPoints?: {
                type: string;
                method: string;
                description?: string | undefined;
            }[] | undefined;
            stepCount?: number | undefined;
            crewCount?: number | undefined;
            routerLabels?: string[] | undefined;
            parallelCrews?: boolean | undefined;
            crewChaining?: boolean | undefined;
        } | undefined;
        routingLogic?: {
            conditionalPaths?: {
                condition: string;
                target: string;
                lineno?: number | undefined;
            }[] | undefined;
            routerLabels?: string[] | undefined;
            routerMethods?: string[] | undefined;
        } | undefined;
        frameworkSpecific?: {
            decorators?: {
                starts?: string[] | undefined;
                listeners?: string[] | undefined;
                routers?: string[] | undefined;
            } | undefined;
            stateModel?: string | undefined;
            flowClass?: string | undefined;
        } | undefined;
    } | undefined;
    description?: string | undefined;
    discovered?: {
        version?: number | undefined;
        path?: string | undefined;
        firstSeen?: string | undefined;
        lastModified?: string | undefined;
        sourceHash?: string | undefined;
    } | undefined;
    contract?: {
        description?: string | undefined;
        capabilities?: string[] | undefined;
        purpose?: string | undefined;
        complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
        domain?: string | undefined;
        useCases?: string[] | undefined;
        limitations?: string[] | undefined;
        dependencies?: string[] | undefined;
        inputRequirements?: string[] | undefined;
        outputDescription?: string | undefined;
    } | undefined;
    testSpecs?: Record<string, {
        generated?: string | undefined;
        generatedBy?: string | undefined;
        tests?: {
            id: string;
            agent?: {
                framework: string;
                id: string;
                name: string;
            } | undefined;
            expected?: any;
            generatedBy?: string | undefined;
            name?: string | undefined;
            input?: any;
            ui_description?: string | undefined;
            dimension?: string | undefined;
            metadata?: any;
            evaluation_criteria?: {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            evaluationCriteria?: string[] | {
                criterion: string;
                ui_description?: string | undefined;
                evaluation_strictness?: number | undefined;
                special_instructions?: string | undefined;
            }[] | undefined;
            thresholds?: {
                passing_criteria_percentage?: number | undefined;
            } | undefined;
            priority?: number | undefined;
            tags?: string[] | undefined;
            multiRun?: {
                runCount: number;
                enabled?: boolean | undefined;
                variations?: any[] | undefined;
                runType?: string | undefined;
                aggregationStrategy?: string | undefined;
                executionMode?: string | undefined;
                inputVariations?: any[] | undefined;
            } | undefined;
            syntheticInputs?: Record<string, any> | undefined;
            flowMetadata?: {
                isFlowTest?: boolean | undefined;
                flowName?: string | undefined;
                estimatedDuration?: number | undefined;
                captureArtifacts?: boolean | undefined;
                artifactDirectory?: string | undefined;
                dryRunIntegrations?: boolean | undefined;
                requiresHumanInput?: boolean | undefined;
                externalServices?: string[] | undefined;
            } | undefined;
            userModified?: boolean | undefined;
            userNotes?: string | undefined;
            generatedAt?: string | undefined;
            llmGeneration?: {
                originalPrompt?: string | undefined;
                reasoning?: string | undefined;
                confidence?: number | undefined;
                category?: string | undefined;
                expectedBehavior?: string | undefined;
                domainContext?: string | undefined;
                complexityLevel?: string | undefined;
                testingFocus?: string[] | undefined;
            } | undefined;
        }[] | undefined;
    }> | undefined;
    performance?: {
        lastRun?: string | undefined;
        totalRuns?: number | undefined;
        averageScore?: number | undefined;
        scoreHistory?: {
            dimension: string;
            timestamp: string;
            score: number;
            passed: boolean;
            details?: any;
        }[] | undefined;
        trends?: {
            improving: boolean;
            degrading: boolean;
            stable: boolean;
        } | undefined;
    } | undefined;
    executionConfig?: {
        captureArtifacts?: boolean | undefined;
        artifactDirectory?: string | undefined;
        dryRunIntegrations?: boolean | undefined;
        timeout?: number | undefined;
        allowExternalCalls?: boolean | undefined;
        maxRetries?: number | undefined;
    } | undefined;
}>;
export declare const TestRunHistoryEntrySchema: z.ZodObject<{
    runId: z.ZodString;
    timestamp: z.ZodString;
    agentsTestedCount: z.ZodNumber;
    dimensionsRun: z.ZodArray<z.ZodString, "many">;
    overallScore: z.ZodNumber;
    duration: z.ZodNumber;
    tokenUsage: z.ZodOptional<z.ZodNumber>;
    cost: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    runId: string;
    agentsTestedCount: number;
    dimensionsRun: string[];
    overallScore: number;
    duration: number;
    tokenUsage?: number | undefined;
    cost?: number | undefined;
}, {
    timestamp: string;
    runId: string;
    agentsTestedCount: number;
    dimensionsRun: string[];
    overallScore: number;
    duration: number;
    tokenUsage?: number | undefined;
    cost?: number | undefined;
}>;
export declare const UserCustomizationsSchema: z.ZodObject<{
    globalCriteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dimensionOverrides: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        customPrompt: z.ZodOptional<z.ZodString>;
        customCriteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        customPrompt?: string | undefined;
        customCriteria?: string[] | undefined;
    }, {
        customPrompt?: string | undefined;
        customCriteria?: string[] | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    globalCriteria?: string[] | undefined;
    dimensionOverrides?: Record<string, {
        customPrompt?: string | undefined;
        customCriteria?: string[] | undefined;
    }> | undefined;
}, {
    globalCriteria?: string[] | undefined;
    dimensionOverrides?: Record<string, {
        customPrompt?: string | undefined;
        customCriteria?: string[] | undefined;
    }> | undefined;
}>;
export declare const ProjectConfigSchema: z.ZodObject<{
    framework: z.ZodEnum<["langchain", "crewai", "autogen", "llamaindex", "custom"]>;
    language: z.ZodEnum<["python", "typescript", "javascript"]>;
    root_path: z.ZodOptional<z.ZodString>;
    llm_config: z.ZodOptional<z.ZodObject<{
        provider: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        api_key_env: z.ZodOptional<z.ZodString>;
        temperature: z.ZodOptional<z.ZodNumber>;
        max_tokens: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        provider?: string | undefined;
        model?: string | undefined;
        api_key_env?: string | undefined;
        temperature?: number | undefined;
        max_tokens?: number | undefined;
    }, {
        provider?: string | undefined;
        model?: string | undefined;
        api_key_env?: string | undefined;
        temperature?: number | undefined;
        max_tokens?: number | undefined;
    }>>;
    environment: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    framework: "langchain" | "crewai" | "autogen" | "llamaindex" | "custom";
    language: "python" | "typescript" | "javascript";
    root_path?: string | undefined;
    llm_config?: {
        provider?: string | undefined;
        model?: string | undefined;
        api_key_env?: string | undefined;
        temperature?: number | undefined;
        max_tokens?: number | undefined;
    } | undefined;
    environment?: Record<string, string> | undefined;
}, {
    framework: "langchain" | "crewai" | "autogen" | "llamaindex" | "custom";
    language: "python" | "typescript" | "javascript";
    root_path?: string | undefined;
    llm_config?: {
        provider?: string | undefined;
        model?: string | undefined;
        api_key_env?: string | undefined;
        temperature?: number | undefined;
        max_tokens?: number | undefined;
    } | undefined;
    environment?: Record<string, string> | undefined;
}>;
export declare const TestConfigSchema: z.ZodObject<{
    dimensions: z.ZodOptional<z.ZodObject<{
        consistency: z.ZodOptional<z.ZodBoolean>;
        safety: z.ZodOptional<z.ZodBoolean>;
        performance: z.ZodOptional<z.ZodBoolean>;
        completeness: z.ZodOptional<z.ZodBoolean>;
        accuracy: z.ZodOptional<z.ZodBoolean>;
        relevance: z.ZodOptional<z.ZodBoolean>;
        format: z.ZodOptional<z.ZodBoolean>;
        'instruction-following': z.ZodOptional<z.ZodBoolean>;
        compliance: z.ZodOptional<z.ZodBoolean>;
        'brand-voice': z.ZodOptional<z.ZodBoolean>;
        'bias-fairness': z.ZodOptional<z.ZodBoolean>;
        privacy: z.ZodOptional<z.ZodBoolean>;
        schema: z.ZodOptional<z.ZodBoolean>;
        determinism: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        performance?: boolean | undefined;
        safety?: boolean | undefined;
        consistency?: boolean | undefined;
        determinism?: boolean | undefined;
        schema?: boolean | undefined;
        completeness?: boolean | undefined;
        accuracy?: boolean | undefined;
        relevance?: boolean | undefined;
        format?: boolean | undefined;
        'instruction-following'?: boolean | undefined;
        compliance?: boolean | undefined;
        'brand-voice'?: boolean | undefined;
        'bias-fairness'?: boolean | undefined;
        privacy?: boolean | undefined;
    }, {
        performance?: boolean | undefined;
        safety?: boolean | undefined;
        consistency?: boolean | undefined;
        determinism?: boolean | undefined;
        schema?: boolean | undefined;
        completeness?: boolean | undefined;
        accuracy?: boolean | undefined;
        relevance?: boolean | undefined;
        format?: boolean | undefined;
        'instruction-following'?: boolean | undefined;
        compliance?: boolean | undefined;
        'brand-voice'?: boolean | undefined;
        'bias-fairness'?: boolean | undefined;
        privacy?: boolean | undefined;
    }>>;
    timeout_ms: z.ZodOptional<z.ZodNumber>;
    parallel: z.ZodOptional<z.ZodBoolean>;
    verbose: z.ZodOptional<z.ZodBoolean>;
    output_format: z.ZodOptional<z.ZodEnum<["json", "html", "markdown"]>>;
}, "strip", z.ZodTypeAny, {
    timeout_ms?: number | undefined;
    verbose?: boolean | undefined;
    dimensions?: {
        performance?: boolean | undefined;
        safety?: boolean | undefined;
        consistency?: boolean | undefined;
        determinism?: boolean | undefined;
        schema?: boolean | undefined;
        completeness?: boolean | undefined;
        accuracy?: boolean | undefined;
        relevance?: boolean | undefined;
        format?: boolean | undefined;
        'instruction-following'?: boolean | undefined;
        compliance?: boolean | undefined;
        'brand-voice'?: boolean | undefined;
        'bias-fairness'?: boolean | undefined;
        privacy?: boolean | undefined;
    } | undefined;
    parallel?: boolean | undefined;
    output_format?: "json" | "markdown" | "html" | undefined;
}, {
    timeout_ms?: number | undefined;
    verbose?: boolean | undefined;
    dimensions?: {
        performance?: boolean | undefined;
        safety?: boolean | undefined;
        consistency?: boolean | undefined;
        determinism?: boolean | undefined;
        schema?: boolean | undefined;
        completeness?: boolean | undefined;
        accuracy?: boolean | undefined;
        relevance?: boolean | undefined;
        format?: boolean | undefined;
        'instruction-following'?: boolean | undefined;
        compliance?: boolean | undefined;
        'brand-voice'?: boolean | undefined;
        'bias-fairness'?: boolean | undefined;
        privacy?: boolean | undefined;
    } | undefined;
    parallel?: boolean | undefined;
    output_format?: "json" | "markdown" | "html" | undefined;
}>;
export declare const EvalSpecSchema: z.ZodObject<{
    version: z.ZodString;
    projectId: z.ZodOptional<z.ZodString>;
    lastScanned: z.ZodOptional<z.ZodString>;
    project: z.ZodObject<{
        framework: z.ZodEnum<["langchain", "crewai", "autogen", "llamaindex", "custom"]>;
        language: z.ZodEnum<["python", "typescript", "javascript"]>;
        root_path: z.ZodOptional<z.ZodString>;
        llm_config: z.ZodOptional<z.ZodObject<{
            provider: z.ZodOptional<z.ZodString>;
            model: z.ZodOptional<z.ZodString>;
            api_key_env: z.ZodOptional<z.ZodString>;
            temperature: z.ZodOptional<z.ZodNumber>;
            max_tokens: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            provider?: string | undefined;
            model?: string | undefined;
            api_key_env?: string | undefined;
            temperature?: number | undefined;
            max_tokens?: number | undefined;
        }, {
            provider?: string | undefined;
            model?: string | undefined;
            api_key_env?: string | undefined;
            temperature?: number | undefined;
            max_tokens?: number | undefined;
        }>>;
        environment: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        framework: "langchain" | "crewai" | "autogen" | "llamaindex" | "custom";
        language: "python" | "typescript" | "javascript";
        root_path?: string | undefined;
        llm_config?: {
            provider?: string | undefined;
            model?: string | undefined;
            api_key_env?: string | undefined;
            temperature?: number | undefined;
            max_tokens?: number | undefined;
        } | undefined;
        environment?: Record<string, string> | undefined;
    }, {
        framework: "langchain" | "crewai" | "autogen" | "llamaindex" | "custom";
        language: "python" | "typescript" | "javascript";
        root_path?: string | undefined;
        llm_config?: {
            provider?: string | undefined;
            model?: string | undefined;
            api_key_env?: string | undefined;
            temperature?: number | undefined;
            max_tokens?: number | undefined;
        } | undefined;
        environment?: Record<string, string> | undefined;
    }>;
    agents: z.ZodRecord<z.ZodString, z.ZodObject<{
        type: z.ZodEnum<["classifier", "rag", "task_executor", "coordinator", "custom"]>;
        description: z.ZodOptional<z.ZodString>;
        discovered: z.ZodOptional<z.ZodObject<{
            firstSeen: z.ZodOptional<z.ZodString>;
            lastModified: z.ZodOptional<z.ZodString>;
            sourceHash: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodString>;
            version: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            version: number;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        }, {
            version?: number | undefined;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        }>>;
        contract: z.ZodOptional<z.ZodObject<{
            role: z.ZodOptional<z.ZodString>;
            goal: z.ZodOptional<z.ZodString>;
            capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            inputSchema: z.ZodOptional<z.ZodAny>;
            outputSchema: z.ZodOptional<z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            role?: string | undefined;
            goal?: string | undefined;
            capabilities?: string[] | undefined;
            inputSchema?: any;
            outputSchema?: any;
        }, {
            role?: string | undefined;
            goal?: string | undefined;
            capabilities?: string[] | undefined;
            inputSchema?: any;
            outputSchema?: any;
        }>>;
        testSpecs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            generated: z.ZodOptional<z.ZodString>;
            generatedBy: z.ZodOptional<z.ZodString>;
            tests: z.ZodDefault<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodOptional<z.ZodString>;
                input: z.ZodAny;
                expected: z.ZodOptional<z.ZodAny>;
                /**
                 * UI-friendly description of what this test is checking (5-7 words)
                 * LLM-generated during test creation, shown in CLI
                 * Format: "Testing: [description]"
                 */
                ui_description: z.ZodOptional<z.ZodString>;
                /**
                 * Dimension type for this test (runtime field)
                 * Now accepts any registered dimension - no hardcoded validation
                 */
                dimension: z.ZodOptional<z.ZodString>;
                /**
                 * Agent information for this test (runtime field)
                 */
                agent: z.ZodOptional<z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                    framework: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    framework: string;
                    id: string;
                    name: string;
                }, {
                    framework: string;
                    id: string;
                    name: string;
                }>>;
                /**
                 * Runtime metadata for test execution
                 */
                metadata: z.ZodOptional<z.ZodAny>;
                /**
                 * NEW: Evaluation criteria as structured objects (v2.0)
                 * Each criterion can have optional strictness and special instructions
                 */
                evaluation_criteria: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    /**
                     * The actual criterion to evaluate (e.g., "Output format is consistent")
                     */
                    criterion: z.ZodString;
                    /**
                     * Optional: Override dimension's default strictness for this criterion (0-100)
                     * User-editable in eval-spec.json
                     */
                    evaluation_strictness: z.ZodOptional<z.ZodNumber>;
                    /**
                     * Optional: Additional context/instructions for evaluating this criterion
                     * User-editable in eval-spec.json
                     */
                    special_instructions: z.ZodOptional<z.ZodString>;
                    /**
                     * Optional: UI-friendly description for this criterion (4-6 words)
                     * LLM-generated during test creation for display in CLI
                     */
                    ui_description: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }, {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }>, "many">>;
                /**
                 * DEPRECATED: Old string-based criteria (v1.0)
                 * Now supports both string[] (old) and EvaluationCriterion[] (new) formats
                 */
                evaluationCriteria: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodObject<{
                    /**
                     * The actual criterion to evaluate (e.g., "Output format is consistent")
                     */
                    criterion: z.ZodString;
                    /**
                     * Optional: Override dimension's default strictness for this criterion (0-100)
                     * User-editable in eval-spec.json
                     */
                    evaluation_strictness: z.ZodOptional<z.ZodNumber>;
                    /**
                     * Optional: Additional context/instructions for evaluating this criterion
                     * User-editable in eval-spec.json
                     */
                    special_instructions: z.ZodOptional<z.ZodString>;
                    /**
                     * Optional: UI-friendly description for this criterion (4-6 words)
                     * LLM-generated during test creation for display in CLI
                     */
                    ui_description: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }, {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }>, "many">]>>;
                /**
                 * NEW: Test-level threshold overrides
                 * Allows individual tests to override dimension defaults
                 */
                thresholds: z.ZodOptional<z.ZodObject<{
                    /**
                     * Percentage of criteria that must pass (0-100)
                     * Overrides dimension default
                     */
                    passing_criteria_percentage: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    passing_criteria_percentage?: number | undefined;
                }, {
                    passing_criteria_percentage?: number | undefined;
                }>>;
                priority: z.ZodDefault<z.ZodNumber>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                multiRun: z.ZodOptional<z.ZodObject<{
                    enabled: z.ZodOptional<z.ZodBoolean>;
                    runCount: z.ZodNumber;
                    variations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
                    runType: z.ZodOptional<z.ZodString>;
                    aggregationStrategy: z.ZodOptional<z.ZodString>;
                    executionMode: z.ZodOptional<z.ZodString>;
                    inputVariations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
                }, "strip", z.ZodTypeAny, {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                }, {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                }>>;
                syntheticInputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                flowMetadata: z.ZodOptional<z.ZodObject<{
                    isFlowTest: z.ZodOptional<z.ZodBoolean>;
                    flowName: z.ZodOptional<z.ZodString>;
                    estimatedDuration: z.ZodOptional<z.ZodNumber>;
                    captureArtifacts: z.ZodOptional<z.ZodBoolean>;
                    artifactDirectory: z.ZodOptional<z.ZodString>;
                    dryRunIntegrations: z.ZodOptional<z.ZodBoolean>;
                    requiresHumanInput: z.ZodOptional<z.ZodBoolean>;
                    externalServices: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                }, {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                }>>;
                userModified: z.ZodOptional<z.ZodBoolean>;
                userNotes: z.ZodOptional<z.ZodString>;
                generatedBy: z.ZodOptional<z.ZodString>;
                generatedAt: z.ZodOptional<z.ZodString>;
                llmGeneration: z.ZodOptional<z.ZodObject<{
                    originalPrompt: z.ZodOptional<z.ZodString>;
                    reasoning: z.ZodOptional<z.ZodString>;
                    confidence: z.ZodOptional<z.ZodNumber>;
                    category: z.ZodOptional<z.ZodString>;
                    expectedBehavior: z.ZodOptional<z.ZodString>;
                    domainContext: z.ZodOptional<z.ZodString>;
                    complexityLevel: z.ZodOptional<z.ZodString>;
                    testingFocus: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                }, {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                priority: number;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }, {
                id: string;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                priority?: number | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            tests: {
                id: string;
                priority: number;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[];
            generated?: string | undefined;
            generatedBy?: string | undefined;
        }, {
            generated?: string | undefined;
            generatedBy?: string | undefined;
            tests?: {
                id: string;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                priority?: number | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[] | undefined;
        }>>>;
        performance: z.ZodOptional<z.ZodObject<{
            lastRun: z.ZodOptional<z.ZodString>;
            totalRuns: z.ZodDefault<z.ZodNumber>;
            averageScore: z.ZodDefault<z.ZodNumber>;
            scoreHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
                timestamp: z.ZodString;
                dimension: z.ZodString;
                score: z.ZodNumber;
                passed: z.ZodBoolean;
                details: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }, {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }>, "many">>;
            trends: z.ZodOptional<z.ZodObject<{
                improving: z.ZodBoolean;
                degrading: z.ZodBoolean;
                stable: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            }, {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            }>>;
        }, "strip", z.ZodTypeAny, {
            totalRuns: number;
            averageScore: number;
            scoreHistory: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[];
            lastRun?: string | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        }, {
            lastRun?: string | undefined;
            totalRuns?: number | undefined;
            averageScore?: number | undefined;
            scoreHistory?: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[] | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        }>>;
        evaluation_spec: z.ZodOptional<z.ZodObject<{
            sample_inputs: z.ZodArray<z.ZodAny, "many">;
            expected_output_type: z.ZodOptional<z.ZodEnum<["text", "json", "classification", "structured", "custom"]>>;
            output_schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                type: z.ZodEnum<["string", "number", "boolean", "array", "object", "enum"]>;
                required: z.ZodOptional<z.ZodBoolean>;
                description: z.ZodOptional<z.ZodString>;
                values: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
                items: z.ZodOptional<z.ZodAny>;
                properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
                minLength: z.ZodOptional<z.ZodNumber>;
                maxLength: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "string" | "number" | "boolean" | "object" | "array" | "enum";
                values?: any[] | undefined;
                description?: string | undefined;
                required?: boolean | undefined;
                items?: any;
                properties?: Record<string, any> | undefined;
                min?: number | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
            }, {
                type: "string" | "number" | "boolean" | "object" | "array" | "enum";
                values?: any[] | undefined;
                description?: string | undefined;
                required?: boolean | undefined;
                items?: any;
                properties?: Record<string, any> | undefined;
                min?: number | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
            }>>>;
            performance: z.ZodOptional<z.ZodObject<{
                max_latency_ms: z.ZodOptional<z.ZodNumber>;
                min_throughput: z.ZodOptional<z.ZodNumber>;
                timeout_ms: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                max_latency_ms?: number | undefined;
                min_throughput?: number | undefined;
                timeout_ms?: number | undefined;
            }, {
                max_latency_ms?: number | undefined;
                min_throughput?: number | undefined;
                timeout_ms?: number | undefined;
            }>>;
            safety: z.ZodOptional<z.ZodObject<{
                test_prompt_injection: z.ZodOptional<z.ZodBoolean>;
                test_boundary_inputs: z.ZodOptional<z.ZodBoolean>;
                test_error_recovery: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                test_prompt_injection?: boolean | undefined;
                test_boundary_inputs?: boolean | undefined;
                test_error_recovery?: boolean | undefined;
            }, {
                test_prompt_injection?: boolean | undefined;
                test_boundary_inputs?: boolean | undefined;
                test_error_recovery?: boolean | undefined;
            }>>;
            consistency: z.ZodOptional<z.ZodObject<{
                runs_per_input: z.ZodOptional<z.ZodNumber>;
                similarity_threshold: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                runs_per_input?: number | undefined;
                similarity_threshold?: number | undefined;
            }, {
                runs_per_input?: number | undefined;
                similarity_threshold?: number | undefined;
            }>>;
            determinism: z.ZodOptional<z.ZodObject<{
                expect_deterministic: z.ZodOptional<z.ZodBoolean>;
                allowed_variance: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                expect_deterministic?: boolean | undefined;
                allowed_variance?: number | undefined;
            }, {
                expect_deterministic?: boolean | undefined;
                allowed_variance?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            sample_inputs: any[];
            performance?: {
                max_latency_ms?: number | undefined;
                min_throughput?: number | undefined;
                timeout_ms?: number | undefined;
            } | undefined;
            expected_output_type?: "custom" | "text" | "json" | "classification" | "structured" | undefined;
            output_schema?: Record<string, {
                type: "string" | "number" | "boolean" | "object" | "array" | "enum";
                values?: any[] | undefined;
                description?: string | undefined;
                required?: boolean | undefined;
                items?: any;
                properties?: Record<string, any> | undefined;
                min?: number | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
            }> | undefined;
            safety?: {
                test_prompt_injection?: boolean | undefined;
                test_boundary_inputs?: boolean | undefined;
                test_error_recovery?: boolean | undefined;
            } | undefined;
            consistency?: {
                runs_per_input?: number | undefined;
                similarity_threshold?: number | undefined;
            } | undefined;
            determinism?: {
                expect_deterministic?: boolean | undefined;
                allowed_variance?: number | undefined;
            } | undefined;
        }, {
            sample_inputs: any[];
            performance?: {
                max_latency_ms?: number | undefined;
                min_throughput?: number | undefined;
                timeout_ms?: number | undefined;
            } | undefined;
            expected_output_type?: "custom" | "text" | "json" | "classification" | "structured" | undefined;
            output_schema?: Record<string, {
                type: "string" | "number" | "boolean" | "object" | "array" | "enum";
                values?: any[] | undefined;
                description?: string | undefined;
                required?: boolean | undefined;
                items?: any;
                properties?: Record<string, any> | undefined;
                min?: number | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
            }> | undefined;
            safety?: {
                test_prompt_injection?: boolean | undefined;
                test_boundary_inputs?: boolean | undefined;
                test_error_recovery?: boolean | undefined;
            } | undefined;
            consistency?: {
                runs_per_input?: number | undefined;
                similarity_threshold?: number | undefined;
            } | undefined;
            determinism?: {
                expect_deterministic?: boolean | undefined;
                allowed_variance?: number | undefined;
            } | undefined;
        }>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: "custom" | "classifier" | "rag" | "task_executor" | "coordinator";
        description?: string | undefined;
        discovered?: {
            version: number;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        } | undefined;
        contract?: {
            role?: string | undefined;
            goal?: string | undefined;
            capabilities?: string[] | undefined;
            inputSchema?: any;
            outputSchema?: any;
        } | undefined;
        metadata?: Record<string, any> | undefined;
        testSpecs?: Record<string, {
            tests: {
                id: string;
                priority: number;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[];
            generated?: string | undefined;
            generatedBy?: string | undefined;
        }> | undefined;
        performance?: {
            totalRuns: number;
            averageScore: number;
            scoreHistory: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[];
            lastRun?: string | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        } | undefined;
        evaluation_spec?: {
            sample_inputs: any[];
            performance?: {
                max_latency_ms?: number | undefined;
                min_throughput?: number | undefined;
                timeout_ms?: number | undefined;
            } | undefined;
            expected_output_type?: "custom" | "text" | "json" | "classification" | "structured" | undefined;
            output_schema?: Record<string, {
                type: "string" | "number" | "boolean" | "object" | "array" | "enum";
                values?: any[] | undefined;
                description?: string | undefined;
                required?: boolean | undefined;
                items?: any;
                properties?: Record<string, any> | undefined;
                min?: number | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
            }> | undefined;
            safety?: {
                test_prompt_injection?: boolean | undefined;
                test_boundary_inputs?: boolean | undefined;
                test_error_recovery?: boolean | undefined;
            } | undefined;
            consistency?: {
                runs_per_input?: number | undefined;
                similarity_threshold?: number | undefined;
            } | undefined;
            determinism?: {
                expect_deterministic?: boolean | undefined;
                allowed_variance?: number | undefined;
            } | undefined;
        } | undefined;
    }, {
        type: "custom" | "classifier" | "rag" | "task_executor" | "coordinator";
        description?: string | undefined;
        discovered?: {
            version?: number | undefined;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        } | undefined;
        contract?: {
            role?: string | undefined;
            goal?: string | undefined;
            capabilities?: string[] | undefined;
            inputSchema?: any;
            outputSchema?: any;
        } | undefined;
        metadata?: Record<string, any> | undefined;
        testSpecs?: Record<string, {
            generated?: string | undefined;
            generatedBy?: string | undefined;
            tests?: {
                id: string;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                priority?: number | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[] | undefined;
        }> | undefined;
        performance?: {
            lastRun?: string | undefined;
            totalRuns?: number | undefined;
            averageScore?: number | undefined;
            scoreHistory?: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[] | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        } | undefined;
        evaluation_spec?: {
            sample_inputs: any[];
            performance?: {
                max_latency_ms?: number | undefined;
                min_throughput?: number | undefined;
                timeout_ms?: number | undefined;
            } | undefined;
            expected_output_type?: "custom" | "text" | "json" | "classification" | "structured" | undefined;
            output_schema?: Record<string, {
                type: "string" | "number" | "boolean" | "object" | "array" | "enum";
                values?: any[] | undefined;
                description?: string | undefined;
                required?: boolean | undefined;
                items?: any;
                properties?: Record<string, any> | undefined;
                min?: number | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
            }> | undefined;
            safety?: {
                test_prompt_injection?: boolean | undefined;
                test_boundary_inputs?: boolean | undefined;
                test_error_recovery?: boolean | undefined;
            } | undefined;
            consistency?: {
                runs_per_input?: number | undefined;
                similarity_threshold?: number | undefined;
            } | undefined;
            determinism?: {
                expect_deterministic?: boolean | undefined;
                allowed_variance?: number | undefined;
            } | undefined;
        } | undefined;
    }>>;
    teams: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        name: z.ZodString;
        members: z.ZodArray<z.ZodString, "many">;
        coordinator: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        discovered: z.ZodOptional<z.ZodObject<{
            firstSeen: z.ZodOptional<z.ZodString>;
            lastModified: z.ZodOptional<z.ZodString>;
            sourceHash: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodString>;
            version: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            version: number;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        }, {
            version?: number | undefined;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        }>>;
        analysis: z.ZodOptional<z.ZodObject<{
            crewMetadata: z.ZodOptional<z.ZodObject<{
                agentCount: z.ZodOptional<z.ZodNumber>;
                taskCount: z.ZodOptional<z.ZodNumber>;
                estimatedDuration: z.ZodOptional<z.ZodNumber>;
                process: z.ZodOptional<z.ZodEnum<["sequential", "hierarchical", "unknown"]>>;
                hasMemory: z.ZodOptional<z.ZodBoolean>;
                hasCache: z.ZodOptional<z.ZodBoolean>;
                verboseMode: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                estimatedDuration?: number | undefined;
                agentCount?: number | undefined;
                taskCount?: number | undefined;
                process?: "unknown" | "sequential" | "hierarchical" | undefined;
                hasMemory?: boolean | undefined;
                hasCache?: boolean | undefined;
                verboseMode?: boolean | undefined;
            }, {
                estimatedDuration?: number | undefined;
                agentCount?: number | undefined;
                taskCount?: number | undefined;
                process?: "unknown" | "sequential" | "hierarchical" | undefined;
                hasMemory?: boolean | undefined;
                hasCache?: boolean | undefined;
                verboseMode?: boolean | undefined;
            }>>;
            behavioralDimensions: z.ZodOptional<z.ZodObject<{
                hasToolUsage: z.ZodOptional<z.ZodBoolean>;
                toolsList: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                hasFileIO: z.ZodOptional<z.ZodBoolean>;
                fileOperations: z.ZodOptional<z.ZodObject<{
                    reads: z.ZodOptional<z.ZodBoolean>;
                    writes: z.ZodOptional<z.ZodBoolean>;
                    formats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                }, {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                }>>;
                hasExternalAPIs: z.ZodOptional<z.ZodBoolean>;
                apiCalls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                hasHumanInLoop: z.ZodOptional<z.ZodBoolean>;
                humanInteractionPoints: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    taskName: z.ZodString;
                    type: z.ZodEnum<["input", "approval", "review"]>;
                    description: z.ZodString;
                    blocking: z.ZodOptional<z.ZodBoolean>;
                }, "strip", z.ZodTypeAny, {
                    type: "input" | "approval" | "review";
                    description: string;
                    taskName: string;
                    blocking?: boolean | undefined;
                }, {
                    type: "input" | "approval" | "review";
                    description: string;
                    taskName: string;
                    blocking?: boolean | undefined;
                }>, "many">>;
                hasConditionalLogic: z.ZodOptional<z.ZodBoolean>;
                conditionalPaths: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    condition: z.ZodString;
                    target: z.ZodString;
                    lineno: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }, {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }>, "many">>;
                hasErrorHandling: z.ZodOptional<z.ZodBoolean>;
                errorHandlers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    exceptionTypes: z.ZodArray<z.ZodString, "many">;
                    hasRetry: z.ZodBoolean;
                    hasFallback: z.ZodBoolean;
                    lineno: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    exceptionTypes: string[];
                    hasRetry: boolean;
                    hasFallback: boolean;
                    lineno?: number | undefined;
                }, {
                    exceptionTypes: string[];
                    hasRetry: boolean;
                    hasFallback: boolean;
                    lineno?: number | undefined;
                }>, "many">>;
                hasStateManagement: z.ZodOptional<z.ZodBoolean>;
                stateVariables: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                complexityLevel: z.ZodOptional<z.ZodEnum<["simple", "moderate", "complex", "advanced"]>>;
            }, "strip", z.ZodTypeAny, {
                complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
                hasToolUsage?: boolean | undefined;
                toolsList?: string[] | undefined;
                hasFileIO?: boolean | undefined;
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                hasExternalAPIs?: boolean | undefined;
                apiCalls?: string[] | undefined;
                hasHumanInLoop?: boolean | undefined;
                humanInteractionPoints?: {
                    type: "input" | "approval" | "review";
                    description: string;
                    taskName: string;
                    blocking?: boolean | undefined;
                }[] | undefined;
                hasConditionalLogic?: boolean | undefined;
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                hasErrorHandling?: boolean | undefined;
                errorHandlers?: {
                    exceptionTypes: string[];
                    hasRetry: boolean;
                    hasFallback: boolean;
                    lineno?: number | undefined;
                }[] | undefined;
                hasStateManagement?: boolean | undefined;
                stateVariables?: string[] | undefined;
            }, {
                complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
                hasToolUsage?: boolean | undefined;
                toolsList?: string[] | undefined;
                hasFileIO?: boolean | undefined;
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                hasExternalAPIs?: boolean | undefined;
                apiCalls?: string[] | undefined;
                hasHumanInLoop?: boolean | undefined;
                humanInteractionPoints?: {
                    type: "input" | "approval" | "review";
                    description: string;
                    taskName: string;
                    blocking?: boolean | undefined;
                }[] | undefined;
                hasConditionalLogic?: boolean | undefined;
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                hasErrorHandling?: boolean | undefined;
                errorHandlers?: {
                    exceptionTypes: string[];
                    hasRetry: boolean;
                    hasFallback: boolean;
                    lineno?: number | undefined;
                }[] | undefined;
                hasStateManagement?: boolean | undefined;
                stateVariables?: string[] | undefined;
            }>>;
            externalInteractions: z.ZodOptional<z.ZodObject<{
                tools: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    type: z.ZodEnum<["search", "file", "api", "database", "custom"]>;
                    operations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    requiredEnvVars: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    type: "custom" | "search" | "file" | "api" | "database";
                    name: string;
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }, {
                    type: "custom" | "search" | "file" | "api" | "database";
                    name: string;
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }>, "many">>;
                apis: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    endpoint: z.ZodOptional<z.ZodString>;
                    envVar: z.ZodOptional<z.ZodString>;
                    operations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    protocol: z.ZodOptional<z.ZodEnum<["http", "https", "websocket", "grpc"]>>;
                }, "strip", z.ZodTypeAny, {
                    name: string;
                    operations?: string[] | undefined;
                    endpoint?: string | undefined;
                    envVar?: string | undefined;
                    protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
                }, {
                    name: string;
                    operations?: string[] | undefined;
                    endpoint?: string | undefined;
                    envVar?: string | undefined;
                    protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
                }>, "many">>;
                databases: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    type: z.ZodEnum<["sqlite", "postgres", "mysql", "mongodb", "redis", "unknown"]>;
                    operations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    requiredEnvVars: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }, {
                    type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }>, "many">>;
                fileOperations: z.ZodOptional<z.ZodObject<{
                    reads: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    writes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    formats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    reads?: string[] | undefined;
                    writes?: string[] | undefined;
                    formats?: string[] | undefined;
                }, {
                    reads?: string[] | undefined;
                    writes?: string[] | undefined;
                    formats?: string[] | undefined;
                }>>;
                llmProviders: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    provider: z.ZodEnum<["openai", "anthropic", "google", "azure", "aws", "custom"]>;
                    model: z.ZodString;
                    agent: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    agent: string;
                    provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                    model: string;
                }, {
                    agent: string;
                    provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                    model: string;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                fileOperations?: {
                    reads?: string[] | undefined;
                    writes?: string[] | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                tools?: {
                    type: "custom" | "search" | "file" | "api" | "database";
                    name: string;
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                apis?: {
                    name: string;
                    operations?: string[] | undefined;
                    endpoint?: string | undefined;
                    envVar?: string | undefined;
                    protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
                }[] | undefined;
                databases?: {
                    type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                llmProviders?: {
                    agent: string;
                    provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                    model: string;
                }[] | undefined;
            }, {
                fileOperations?: {
                    reads?: string[] | undefined;
                    writes?: string[] | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                tools?: {
                    type: "custom" | "search" | "file" | "api" | "database";
                    name: string;
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                apis?: {
                    name: string;
                    operations?: string[] | undefined;
                    endpoint?: string | undefined;
                    envVar?: string | undefined;
                    protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
                }[] | undefined;
                databases?: {
                    type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                llmProviders?: {
                    agent: string;
                    provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                    model: string;
                }[] | undefined;
            }>>;
            flowChart: z.ZodOptional<z.ZodString>;
            yamlConfig: z.ZodOptional<z.ZodObject<{
                agents: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    role: z.ZodOptional<z.ZodString>;
                    goal: z.ZodOptional<z.ZodString>;
                    backstory: z.ZodOptional<z.ZodString>;
                    tools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    llm: z.ZodOptional<z.ZodString>;
                    max_iter: z.ZodOptional<z.ZodNumber>;
                    verbose: z.ZodOptional<z.ZodBoolean>;
                    allow_delegation: z.ZodOptional<z.ZodBoolean>;
                }, "strip", z.ZodTypeAny, {
                    role?: string | undefined;
                    goal?: string | undefined;
                    tools?: string[] | undefined;
                    backstory?: string | undefined;
                    llm?: string | undefined;
                    max_iter?: number | undefined;
                    verbose?: boolean | undefined;
                    allow_delegation?: boolean | undefined;
                }, {
                    role?: string | undefined;
                    goal?: string | undefined;
                    tools?: string[] | undefined;
                    backstory?: string | undefined;
                    llm?: string | undefined;
                    max_iter?: number | undefined;
                    verbose?: boolean | undefined;
                    allow_delegation?: boolean | undefined;
                }>>>;
                tasks: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    description: z.ZodOptional<z.ZodString>;
                    expected_output: z.ZodOptional<z.ZodString>;
                    agent: z.ZodOptional<z.ZodString>;
                    tools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    human_input: z.ZodOptional<z.ZodBoolean>;
                    context: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    agent?: string | undefined;
                    description?: string | undefined;
                    tools?: string[] | undefined;
                    expected_output?: string | undefined;
                    human_input?: boolean | undefined;
                    context?: string[] | undefined;
                }, {
                    agent?: string | undefined;
                    description?: string | undefined;
                    tools?: string[] | undefined;
                    expected_output?: string | undefined;
                    human_input?: boolean | undefined;
                    context?: string[] | undefined;
                }>>>;
                crews: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    agents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    process: z.ZodOptional<z.ZodEnum<["sequential", "hierarchical"]>>;
                    memory: z.ZodOptional<z.ZodBoolean>;
                    cache: z.ZodOptional<z.ZodBoolean>;
                }, "strip", z.ZodTypeAny, {
                    agents?: string[] | undefined;
                    process?: "sequential" | "hierarchical" | undefined;
                    tasks?: string[] | undefined;
                    memory?: boolean | undefined;
                    cache?: boolean | undefined;
                }, {
                    agents?: string[] | undefined;
                    process?: "sequential" | "hierarchical" | undefined;
                    tasks?: string[] | undefined;
                    memory?: boolean | undefined;
                    cache?: boolean | undefined;
                }>>>;
            }, "strip", z.ZodTypeAny, {
                agents?: Record<string, {
                    role?: string | undefined;
                    goal?: string | undefined;
                    tools?: string[] | undefined;
                    backstory?: string | undefined;
                    llm?: string | undefined;
                    max_iter?: number | undefined;
                    verbose?: boolean | undefined;
                    allow_delegation?: boolean | undefined;
                }> | undefined;
                tasks?: Record<string, {
                    agent?: string | undefined;
                    description?: string | undefined;
                    tools?: string[] | undefined;
                    expected_output?: string | undefined;
                    human_input?: boolean | undefined;
                    context?: string[] | undefined;
                }> | undefined;
                crews?: Record<string, {
                    agents?: string[] | undefined;
                    process?: "sequential" | "hierarchical" | undefined;
                    tasks?: string[] | undefined;
                    memory?: boolean | undefined;
                    cache?: boolean | undefined;
                }> | undefined;
            }, {
                agents?: Record<string, {
                    role?: string | undefined;
                    goal?: string | undefined;
                    tools?: string[] | undefined;
                    backstory?: string | undefined;
                    llm?: string | undefined;
                    max_iter?: number | undefined;
                    verbose?: boolean | undefined;
                    allow_delegation?: boolean | undefined;
                }> | undefined;
                tasks?: Record<string, {
                    agent?: string | undefined;
                    description?: string | undefined;
                    tools?: string[] | undefined;
                    expected_output?: string | undefined;
                    human_input?: boolean | undefined;
                    context?: string[] | undefined;
                }> | undefined;
                crews?: Record<string, {
                    agents?: string[] | undefined;
                    process?: "sequential" | "hierarchical" | undefined;
                    tasks?: string[] | undefined;
                    memory?: boolean | undefined;
                    cache?: boolean | undefined;
                }> | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            crewMetadata?: {
                estimatedDuration?: number | undefined;
                agentCount?: number | undefined;
                taskCount?: number | undefined;
                process?: "unknown" | "sequential" | "hierarchical" | undefined;
                hasMemory?: boolean | undefined;
                hasCache?: boolean | undefined;
                verboseMode?: boolean | undefined;
            } | undefined;
            behavioralDimensions?: {
                complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
                hasToolUsage?: boolean | undefined;
                toolsList?: string[] | undefined;
                hasFileIO?: boolean | undefined;
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                hasExternalAPIs?: boolean | undefined;
                apiCalls?: string[] | undefined;
                hasHumanInLoop?: boolean | undefined;
                humanInteractionPoints?: {
                    type: "input" | "approval" | "review";
                    description: string;
                    taskName: string;
                    blocking?: boolean | undefined;
                }[] | undefined;
                hasConditionalLogic?: boolean | undefined;
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                hasErrorHandling?: boolean | undefined;
                errorHandlers?: {
                    exceptionTypes: string[];
                    hasRetry: boolean;
                    hasFallback: boolean;
                    lineno?: number | undefined;
                }[] | undefined;
                hasStateManagement?: boolean | undefined;
                stateVariables?: string[] | undefined;
            } | undefined;
            externalInteractions?: {
                fileOperations?: {
                    reads?: string[] | undefined;
                    writes?: string[] | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                tools?: {
                    type: "custom" | "search" | "file" | "api" | "database";
                    name: string;
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                apis?: {
                    name: string;
                    operations?: string[] | undefined;
                    endpoint?: string | undefined;
                    envVar?: string | undefined;
                    protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
                }[] | undefined;
                databases?: {
                    type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                llmProviders?: {
                    agent: string;
                    provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                    model: string;
                }[] | undefined;
            } | undefined;
            flowChart?: string | undefined;
            yamlConfig?: {
                agents?: Record<string, {
                    role?: string | undefined;
                    goal?: string | undefined;
                    tools?: string[] | undefined;
                    backstory?: string | undefined;
                    llm?: string | undefined;
                    max_iter?: number | undefined;
                    verbose?: boolean | undefined;
                    allow_delegation?: boolean | undefined;
                }> | undefined;
                tasks?: Record<string, {
                    agent?: string | undefined;
                    description?: string | undefined;
                    tools?: string[] | undefined;
                    expected_output?: string | undefined;
                    human_input?: boolean | undefined;
                    context?: string[] | undefined;
                }> | undefined;
                crews?: Record<string, {
                    agents?: string[] | undefined;
                    process?: "sequential" | "hierarchical" | undefined;
                    tasks?: string[] | undefined;
                    memory?: boolean | undefined;
                    cache?: boolean | undefined;
                }> | undefined;
            } | undefined;
        }, {
            crewMetadata?: {
                estimatedDuration?: number | undefined;
                agentCount?: number | undefined;
                taskCount?: number | undefined;
                process?: "unknown" | "sequential" | "hierarchical" | undefined;
                hasMemory?: boolean | undefined;
                hasCache?: boolean | undefined;
                verboseMode?: boolean | undefined;
            } | undefined;
            behavioralDimensions?: {
                complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
                hasToolUsage?: boolean | undefined;
                toolsList?: string[] | undefined;
                hasFileIO?: boolean | undefined;
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                hasExternalAPIs?: boolean | undefined;
                apiCalls?: string[] | undefined;
                hasHumanInLoop?: boolean | undefined;
                humanInteractionPoints?: {
                    type: "input" | "approval" | "review";
                    description: string;
                    taskName: string;
                    blocking?: boolean | undefined;
                }[] | undefined;
                hasConditionalLogic?: boolean | undefined;
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                hasErrorHandling?: boolean | undefined;
                errorHandlers?: {
                    exceptionTypes: string[];
                    hasRetry: boolean;
                    hasFallback: boolean;
                    lineno?: number | undefined;
                }[] | undefined;
                hasStateManagement?: boolean | undefined;
                stateVariables?: string[] | undefined;
            } | undefined;
            externalInteractions?: {
                fileOperations?: {
                    reads?: string[] | undefined;
                    writes?: string[] | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                tools?: {
                    type: "custom" | "search" | "file" | "api" | "database";
                    name: string;
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                apis?: {
                    name: string;
                    operations?: string[] | undefined;
                    endpoint?: string | undefined;
                    envVar?: string | undefined;
                    protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
                }[] | undefined;
                databases?: {
                    type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                llmProviders?: {
                    agent: string;
                    provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                    model: string;
                }[] | undefined;
            } | undefined;
            flowChart?: string | undefined;
            yamlConfig?: {
                agents?: Record<string, {
                    role?: string | undefined;
                    goal?: string | undefined;
                    tools?: string[] | undefined;
                    backstory?: string | undefined;
                    llm?: string | undefined;
                    max_iter?: number | undefined;
                    verbose?: boolean | undefined;
                    allow_delegation?: boolean | undefined;
                }> | undefined;
                tasks?: Record<string, {
                    agent?: string | undefined;
                    description?: string | undefined;
                    tools?: string[] | undefined;
                    expected_output?: string | undefined;
                    human_input?: boolean | undefined;
                    context?: string[] | undefined;
                }> | undefined;
                crews?: Record<string, {
                    agents?: string[] | undefined;
                    process?: "sequential" | "hierarchical" | undefined;
                    tasks?: string[] | undefined;
                    memory?: boolean | undefined;
                    cache?: boolean | undefined;
                }> | undefined;
            } | undefined;
        }>>;
        contract: z.ZodOptional<z.ZodObject<{
            purpose: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodEnum<["crew", "team", "workflow", "pipeline"]>>;
            description: z.ZodOptional<z.ZodString>;
            capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            complexity: z.ZodOptional<z.ZodEnum<["simple", "moderate", "complex", "advanced"]>>;
            domain: z.ZodOptional<z.ZodString>;
            useCases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            estimatedDuration: z.ZodOptional<z.ZodNumber>;
            requiresHumanInput: z.ZodOptional<z.ZodBoolean>;
            externalServices: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            producesArtifacts: z.ZodOptional<z.ZodBoolean>;
            artifactTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type?: "team" | "crew" | "workflow" | "pipeline" | undefined;
            description?: string | undefined;
            capabilities?: string[] | undefined;
            estimatedDuration?: number | undefined;
            requiresHumanInput?: boolean | undefined;
            externalServices?: string[] | undefined;
            purpose?: string | undefined;
            complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            domain?: string | undefined;
            useCases?: string[] | undefined;
            limitations?: string[] | undefined;
            dependencies?: string[] | undefined;
            producesArtifacts?: boolean | undefined;
            artifactTypes?: string[] | undefined;
        }, {
            type?: "team" | "crew" | "workflow" | "pipeline" | undefined;
            description?: string | undefined;
            capabilities?: string[] | undefined;
            estimatedDuration?: number | undefined;
            requiresHumanInput?: boolean | undefined;
            externalServices?: string[] | undefined;
            purpose?: string | undefined;
            complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            domain?: string | undefined;
            useCases?: string[] | undefined;
            limitations?: string[] | undefined;
            dependencies?: string[] | undefined;
            producesArtifacts?: boolean | undefined;
            artifactTypes?: string[] | undefined;
        }>>;
        testSpecs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            generated: z.ZodOptional<z.ZodString>;
            generatedBy: z.ZodOptional<z.ZodString>;
            tests: z.ZodDefault<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodOptional<z.ZodString>;
                input: z.ZodAny;
                expected: z.ZodOptional<z.ZodAny>;
                /**
                 * UI-friendly description of what this test is checking (5-7 words)
                 * LLM-generated during test creation, shown in CLI
                 * Format: "Testing: [description]"
                 */
                ui_description: z.ZodOptional<z.ZodString>;
                /**
                 * Dimension type for this test (runtime field)
                 * Now accepts any registered dimension - no hardcoded validation
                 */
                dimension: z.ZodOptional<z.ZodString>;
                /**
                 * Agent information for this test (runtime field)
                 */
                agent: z.ZodOptional<z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                    framework: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    framework: string;
                    id: string;
                    name: string;
                }, {
                    framework: string;
                    id: string;
                    name: string;
                }>>;
                /**
                 * Runtime metadata for test execution
                 */
                metadata: z.ZodOptional<z.ZodAny>;
                /**
                 * NEW: Evaluation criteria as structured objects (v2.0)
                 * Each criterion can have optional strictness and special instructions
                 */
                evaluation_criteria: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    /**
                     * The actual criterion to evaluate (e.g., "Output format is consistent")
                     */
                    criterion: z.ZodString;
                    /**
                     * Optional: Override dimension's default strictness for this criterion (0-100)
                     * User-editable in eval-spec.json
                     */
                    evaluation_strictness: z.ZodOptional<z.ZodNumber>;
                    /**
                     * Optional: Additional context/instructions for evaluating this criterion
                     * User-editable in eval-spec.json
                     */
                    special_instructions: z.ZodOptional<z.ZodString>;
                    /**
                     * Optional: UI-friendly description for this criterion (4-6 words)
                     * LLM-generated during test creation for display in CLI
                     */
                    ui_description: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }, {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }>, "many">>;
                /**
                 * DEPRECATED: Old string-based criteria (v1.0)
                 * Now supports both string[] (old) and EvaluationCriterion[] (new) formats
                 */
                evaluationCriteria: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodObject<{
                    /**
                     * The actual criterion to evaluate (e.g., "Output format is consistent")
                     */
                    criterion: z.ZodString;
                    /**
                     * Optional: Override dimension's default strictness for this criterion (0-100)
                     * User-editable in eval-spec.json
                     */
                    evaluation_strictness: z.ZodOptional<z.ZodNumber>;
                    /**
                     * Optional: Additional context/instructions for evaluating this criterion
                     * User-editable in eval-spec.json
                     */
                    special_instructions: z.ZodOptional<z.ZodString>;
                    /**
                     * Optional: UI-friendly description for this criterion (4-6 words)
                     * LLM-generated during test creation for display in CLI
                     */
                    ui_description: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }, {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }>, "many">]>>;
                /**
                 * NEW: Test-level threshold overrides
                 * Allows individual tests to override dimension defaults
                 */
                thresholds: z.ZodOptional<z.ZodObject<{
                    /**
                     * Percentage of criteria that must pass (0-100)
                     * Overrides dimension default
                     */
                    passing_criteria_percentage: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    passing_criteria_percentage?: number | undefined;
                }, {
                    passing_criteria_percentage?: number | undefined;
                }>>;
                priority: z.ZodDefault<z.ZodNumber>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                multiRun: z.ZodOptional<z.ZodObject<{
                    enabled: z.ZodOptional<z.ZodBoolean>;
                    runCount: z.ZodNumber;
                    variations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
                    runType: z.ZodOptional<z.ZodString>;
                    aggregationStrategy: z.ZodOptional<z.ZodString>;
                    executionMode: z.ZodOptional<z.ZodString>;
                    inputVariations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
                }, "strip", z.ZodTypeAny, {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                }, {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                }>>;
                syntheticInputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                flowMetadata: z.ZodOptional<z.ZodObject<{
                    isFlowTest: z.ZodOptional<z.ZodBoolean>;
                    flowName: z.ZodOptional<z.ZodString>;
                    estimatedDuration: z.ZodOptional<z.ZodNumber>;
                    captureArtifacts: z.ZodOptional<z.ZodBoolean>;
                    artifactDirectory: z.ZodOptional<z.ZodString>;
                    dryRunIntegrations: z.ZodOptional<z.ZodBoolean>;
                    requiresHumanInput: z.ZodOptional<z.ZodBoolean>;
                    externalServices: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                }, {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                }>>;
                userModified: z.ZodOptional<z.ZodBoolean>;
                userNotes: z.ZodOptional<z.ZodString>;
                generatedBy: z.ZodOptional<z.ZodString>;
                generatedAt: z.ZodOptional<z.ZodString>;
                llmGeneration: z.ZodOptional<z.ZodObject<{
                    originalPrompt: z.ZodOptional<z.ZodString>;
                    reasoning: z.ZodOptional<z.ZodString>;
                    confidence: z.ZodOptional<z.ZodNumber>;
                    category: z.ZodOptional<z.ZodString>;
                    expectedBehavior: z.ZodOptional<z.ZodString>;
                    domainContext: z.ZodOptional<z.ZodString>;
                    complexityLevel: z.ZodOptional<z.ZodString>;
                    testingFocus: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                }, {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                priority: number;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }, {
                id: string;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                priority?: number | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            tests: {
                id: string;
                priority: number;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[];
            generated?: string | undefined;
            generatedBy?: string | undefined;
        }, {
            generated?: string | undefined;
            generatedBy?: string | undefined;
            tests?: {
                id: string;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                priority?: number | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[] | undefined;
        }>>>;
        executionConfig: z.ZodOptional<z.ZodObject<{
            timeout: z.ZodOptional<z.ZodNumber>;
            allowExternalCalls: z.ZodOptional<z.ZodBoolean>;
            captureArtifacts: z.ZodOptional<z.ZodBoolean>;
            artifactDirectory: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            timeout?: number | undefined;
            allowExternalCalls?: boolean | undefined;
        }, {
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            timeout?: number | undefined;
            allowExternalCalls?: boolean | undefined;
        }>>;
        performance: z.ZodOptional<z.ZodObject<{
            lastRun: z.ZodOptional<z.ZodString>;
            totalRuns: z.ZodDefault<z.ZodNumber>;
            averageScore: z.ZodDefault<z.ZodNumber>;
            scoreHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
                timestamp: z.ZodString;
                dimension: z.ZodString;
                score: z.ZodNumber;
                passed: z.ZodBoolean;
                details: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }, {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }>, "many">>;
            trends: z.ZodOptional<z.ZodObject<{
                improving: z.ZodBoolean;
                degrading: z.ZodBoolean;
                stable: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            }, {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            }>>;
        }, "strip", z.ZodTypeAny, {
            totalRuns: number;
            averageScore: number;
            scoreHistory: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[];
            lastRun?: string | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        }, {
            lastRun?: string | undefined;
            totalRuns?: number | undefined;
            averageScore?: number | undefined;
            scoreHistory?: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[] | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        members: string[];
        analysis?: {
            crewMetadata?: {
                estimatedDuration?: number | undefined;
                agentCount?: number | undefined;
                taskCount?: number | undefined;
                process?: "unknown" | "sequential" | "hierarchical" | undefined;
                hasMemory?: boolean | undefined;
                hasCache?: boolean | undefined;
                verboseMode?: boolean | undefined;
            } | undefined;
            behavioralDimensions?: {
                complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
                hasToolUsage?: boolean | undefined;
                toolsList?: string[] | undefined;
                hasFileIO?: boolean | undefined;
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                hasExternalAPIs?: boolean | undefined;
                apiCalls?: string[] | undefined;
                hasHumanInLoop?: boolean | undefined;
                humanInteractionPoints?: {
                    type: "input" | "approval" | "review";
                    description: string;
                    taskName: string;
                    blocking?: boolean | undefined;
                }[] | undefined;
                hasConditionalLogic?: boolean | undefined;
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                hasErrorHandling?: boolean | undefined;
                errorHandlers?: {
                    exceptionTypes: string[];
                    hasRetry: boolean;
                    hasFallback: boolean;
                    lineno?: number | undefined;
                }[] | undefined;
                hasStateManagement?: boolean | undefined;
                stateVariables?: string[] | undefined;
            } | undefined;
            externalInteractions?: {
                fileOperations?: {
                    reads?: string[] | undefined;
                    writes?: string[] | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                tools?: {
                    type: "custom" | "search" | "file" | "api" | "database";
                    name: string;
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                apis?: {
                    name: string;
                    operations?: string[] | undefined;
                    endpoint?: string | undefined;
                    envVar?: string | undefined;
                    protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
                }[] | undefined;
                databases?: {
                    type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                llmProviders?: {
                    agent: string;
                    provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                    model: string;
                }[] | undefined;
            } | undefined;
            flowChart?: string | undefined;
            yamlConfig?: {
                agents?: Record<string, {
                    role?: string | undefined;
                    goal?: string | undefined;
                    tools?: string[] | undefined;
                    backstory?: string | undefined;
                    llm?: string | undefined;
                    max_iter?: number | undefined;
                    verbose?: boolean | undefined;
                    allow_delegation?: boolean | undefined;
                }> | undefined;
                tasks?: Record<string, {
                    agent?: string | undefined;
                    description?: string | undefined;
                    tools?: string[] | undefined;
                    expected_output?: string | undefined;
                    human_input?: boolean | undefined;
                    context?: string[] | undefined;
                }> | undefined;
                crews?: Record<string, {
                    agents?: string[] | undefined;
                    process?: "sequential" | "hierarchical" | undefined;
                    tasks?: string[] | undefined;
                    memory?: boolean | undefined;
                    cache?: boolean | undefined;
                }> | undefined;
            } | undefined;
        } | undefined;
        coordinator?: string | undefined;
        description?: string | undefined;
        discovered?: {
            version: number;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        } | undefined;
        contract?: {
            type?: "team" | "crew" | "workflow" | "pipeline" | undefined;
            description?: string | undefined;
            capabilities?: string[] | undefined;
            estimatedDuration?: number | undefined;
            requiresHumanInput?: boolean | undefined;
            externalServices?: string[] | undefined;
            purpose?: string | undefined;
            complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            domain?: string | undefined;
            useCases?: string[] | undefined;
            limitations?: string[] | undefined;
            dependencies?: string[] | undefined;
            producesArtifacts?: boolean | undefined;
            artifactTypes?: string[] | undefined;
        } | undefined;
        testSpecs?: Record<string, {
            tests: {
                id: string;
                priority: number;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[];
            generated?: string | undefined;
            generatedBy?: string | undefined;
        }> | undefined;
        performance?: {
            totalRuns: number;
            averageScore: number;
            scoreHistory: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[];
            lastRun?: string | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        } | undefined;
        executionConfig?: {
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            timeout?: number | undefined;
            allowExternalCalls?: boolean | undefined;
        } | undefined;
    }, {
        name: string;
        members: string[];
        analysis?: {
            crewMetadata?: {
                estimatedDuration?: number | undefined;
                agentCount?: number | undefined;
                taskCount?: number | undefined;
                process?: "unknown" | "sequential" | "hierarchical" | undefined;
                hasMemory?: boolean | undefined;
                hasCache?: boolean | undefined;
                verboseMode?: boolean | undefined;
            } | undefined;
            behavioralDimensions?: {
                complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
                hasToolUsage?: boolean | undefined;
                toolsList?: string[] | undefined;
                hasFileIO?: boolean | undefined;
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                hasExternalAPIs?: boolean | undefined;
                apiCalls?: string[] | undefined;
                hasHumanInLoop?: boolean | undefined;
                humanInteractionPoints?: {
                    type: "input" | "approval" | "review";
                    description: string;
                    taskName: string;
                    blocking?: boolean | undefined;
                }[] | undefined;
                hasConditionalLogic?: boolean | undefined;
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                hasErrorHandling?: boolean | undefined;
                errorHandlers?: {
                    exceptionTypes: string[];
                    hasRetry: boolean;
                    hasFallback: boolean;
                    lineno?: number | undefined;
                }[] | undefined;
                hasStateManagement?: boolean | undefined;
                stateVariables?: string[] | undefined;
            } | undefined;
            externalInteractions?: {
                fileOperations?: {
                    reads?: string[] | undefined;
                    writes?: string[] | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                tools?: {
                    type: "custom" | "search" | "file" | "api" | "database";
                    name: string;
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                apis?: {
                    name: string;
                    operations?: string[] | undefined;
                    endpoint?: string | undefined;
                    envVar?: string | undefined;
                    protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
                }[] | undefined;
                databases?: {
                    type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                llmProviders?: {
                    agent: string;
                    provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                    model: string;
                }[] | undefined;
            } | undefined;
            flowChart?: string | undefined;
            yamlConfig?: {
                agents?: Record<string, {
                    role?: string | undefined;
                    goal?: string | undefined;
                    tools?: string[] | undefined;
                    backstory?: string | undefined;
                    llm?: string | undefined;
                    max_iter?: number | undefined;
                    verbose?: boolean | undefined;
                    allow_delegation?: boolean | undefined;
                }> | undefined;
                tasks?: Record<string, {
                    agent?: string | undefined;
                    description?: string | undefined;
                    tools?: string[] | undefined;
                    expected_output?: string | undefined;
                    human_input?: boolean | undefined;
                    context?: string[] | undefined;
                }> | undefined;
                crews?: Record<string, {
                    agents?: string[] | undefined;
                    process?: "sequential" | "hierarchical" | undefined;
                    tasks?: string[] | undefined;
                    memory?: boolean | undefined;
                    cache?: boolean | undefined;
                }> | undefined;
            } | undefined;
        } | undefined;
        coordinator?: string | undefined;
        description?: string | undefined;
        discovered?: {
            version?: number | undefined;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        } | undefined;
        contract?: {
            type?: "team" | "crew" | "workflow" | "pipeline" | undefined;
            description?: string | undefined;
            capabilities?: string[] | undefined;
            estimatedDuration?: number | undefined;
            requiresHumanInput?: boolean | undefined;
            externalServices?: string[] | undefined;
            purpose?: string | undefined;
            complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            domain?: string | undefined;
            useCases?: string[] | undefined;
            limitations?: string[] | undefined;
            dependencies?: string[] | undefined;
            producesArtifacts?: boolean | undefined;
            artifactTypes?: string[] | undefined;
        } | undefined;
        testSpecs?: Record<string, {
            generated?: string | undefined;
            generatedBy?: string | undefined;
            tests?: {
                id: string;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                priority?: number | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[] | undefined;
        }> | undefined;
        performance?: {
            lastRun?: string | undefined;
            totalRuns?: number | undefined;
            averageScore?: number | undefined;
            scoreHistory?: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[] | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        } | undefined;
        executionConfig?: {
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            timeout?: number | undefined;
            allowExternalCalls?: boolean | undefined;
        } | undefined;
    }>>>;
    flows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        name: z.ZodString;
        type: z.ZodLiteral<"workflow">;
        description: z.ZodOptional<z.ZodString>;
        discovered: z.ZodOptional<z.ZodObject<{
            firstSeen: z.ZodOptional<z.ZodString>;
            lastModified: z.ZodOptional<z.ZodString>;
            sourceHash: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodString>;
            version: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            version: number;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        }, {
            version?: number | undefined;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        }>>;
        analysis: z.ZodOptional<z.ZodObject<{
            workflowMetadata: z.ZodOptional<z.ZodObject<{
                stepCount: z.ZodOptional<z.ZodNumber>;
                estimatedDuration: z.ZodOptional<z.ZodNumber>;
                crewCount: z.ZodOptional<z.ZodNumber>;
                humanInteractionPoints: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    method: z.ZodString;
                    type: z.ZodString;
                    description: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    type: string;
                    method: string;
                    description?: string | undefined;
                }, {
                    type: string;
                    method: string;
                    description?: string | undefined;
                }>, "many">>;
                externalServices: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    operations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    envVar: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }, {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }>, "many">>;
                routerLabels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                parallelCrews: z.ZodOptional<z.ZodBoolean>;
                crewChaining: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                estimatedDuration?: number | undefined;
                externalServices?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
                humanInteractionPoints?: {
                    type: string;
                    method: string;
                    description?: string | undefined;
                }[] | undefined;
                stepCount?: number | undefined;
                crewCount?: number | undefined;
                routerLabels?: string[] | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
            }, {
                estimatedDuration?: number | undefined;
                externalServices?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
                humanInteractionPoints?: {
                    type: string;
                    method: string;
                    description?: string | undefined;
                }[] | undefined;
                stepCount?: number | undefined;
                crewCount?: number | undefined;
                routerLabels?: string[] | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
            }>>;
            behavioralDimensions: z.ZodOptional<z.ZodObject<{
                collectsUserInput: z.ZodOptional<z.ZodBoolean>;
                makesLLMCalls: z.ZodOptional<z.ZodBoolean>;
                hasFileIO: z.ZodOptional<z.ZodBoolean>;
                hasConditionalLogic: z.ZodOptional<z.ZodBoolean>;
                hasLoops: z.ZodOptional<z.ZodBoolean>;
                executesCrews: z.ZodOptional<z.ZodBoolean>;
                crewCount: z.ZodOptional<z.ZodNumber>;
                crewChaining: z.ZodOptional<z.ZodBoolean>;
                parallelCrews: z.ZodOptional<z.ZodBoolean>;
                hasHumanInLoop: z.ZodOptional<z.ZodBoolean>;
                hasExternalIntegrations: z.ZodOptional<z.ZodBoolean>;
                hasStateEvolution: z.ZodOptional<z.ZodBoolean>;
                hasParallelExecution: z.ZodOptional<z.ZodBoolean>;
                hasInfiniteLoop: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                hasFileIO?: boolean | undefined;
                hasHumanInLoop?: boolean | undefined;
                hasConditionalLogic?: boolean | undefined;
                crewCount?: number | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
                collectsUserInput?: boolean | undefined;
                makesLLMCalls?: boolean | undefined;
                hasLoops?: boolean | undefined;
                executesCrews?: boolean | undefined;
                hasExternalIntegrations?: boolean | undefined;
                hasStateEvolution?: boolean | undefined;
                hasParallelExecution?: boolean | undefined;
                hasInfiniteLoop?: boolean | undefined;
            }, {
                hasFileIO?: boolean | undefined;
                hasHumanInLoop?: boolean | undefined;
                hasConditionalLogic?: boolean | undefined;
                crewCount?: number | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
                collectsUserInput?: boolean | undefined;
                makesLLMCalls?: boolean | undefined;
                hasLoops?: boolean | undefined;
                executesCrews?: boolean | undefined;
                hasExternalIntegrations?: boolean | undefined;
                hasStateEvolution?: boolean | undefined;
                hasParallelExecution?: boolean | undefined;
                hasInfiniteLoop?: boolean | undefined;
            }>>;
            externalInteractions: z.ZodOptional<z.ZodObject<{
                crews: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                apis: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                databases: z.ZodOptional<z.ZodBoolean>;
                fileOperations: z.ZodOptional<z.ZodObject<{
                    reads: z.ZodOptional<z.ZodBoolean>;
                    writes: z.ZodOptional<z.ZodBoolean>;
                    formats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                }, {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                }>>;
                services: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    envVar: z.ZodOptional<z.ZodString>;
                    operations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }, {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                apis?: string[] | undefined;
                databases?: boolean | undefined;
                crews?: string[] | undefined;
                services?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
            }, {
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                apis?: string[] | undefined;
                databases?: boolean | undefined;
                crews?: string[] | undefined;
                services?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
            }>>;
            routingLogic: z.ZodOptional<z.ZodObject<{
                routerMethods: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                routerLabels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                conditionalPaths: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    condition: z.ZodString;
                    target: z.ZodString;
                    lineno: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }, {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                routerLabels?: string[] | undefined;
                routerMethods?: string[] | undefined;
            }, {
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                routerLabels?: string[] | undefined;
                routerMethods?: string[] | undefined;
            }>>;
            frameworkSpecific: z.ZodOptional<z.ZodObject<{
                decorators: z.ZodOptional<z.ZodObject<{
                    starts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    listeners: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    routers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    starts?: string[] | undefined;
                    listeners?: string[] | undefined;
                    routers?: string[] | undefined;
                }, {
                    starts?: string[] | undefined;
                    listeners?: string[] | undefined;
                    routers?: string[] | undefined;
                }>>;
                stateModel: z.ZodOptional<z.ZodString>;
                flowClass: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                decorators?: {
                    starts?: string[] | undefined;
                    listeners?: string[] | undefined;
                    routers?: string[] | undefined;
                } | undefined;
                stateModel?: string | undefined;
                flowClass?: string | undefined;
            }, {
                decorators?: {
                    starts?: string[] | undefined;
                    listeners?: string[] | undefined;
                    routers?: string[] | undefined;
                } | undefined;
                stateModel?: string | undefined;
                flowClass?: string | undefined;
            }>>;
            flowChart: z.ZodOptional<z.ZodString>;
            yamlConfig: z.ZodOptional<z.ZodObject<{
                agents: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                tasks: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                crews: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                agents?: Record<string, any> | undefined;
                tasks?: Record<string, any> | undefined;
                crews?: Record<string, any> | undefined;
            }, {
                agents?: Record<string, any> | undefined;
                tasks?: Record<string, any> | undefined;
                crews?: Record<string, any> | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            behavioralDimensions?: {
                hasFileIO?: boolean | undefined;
                hasHumanInLoop?: boolean | undefined;
                hasConditionalLogic?: boolean | undefined;
                crewCount?: number | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
                collectsUserInput?: boolean | undefined;
                makesLLMCalls?: boolean | undefined;
                hasLoops?: boolean | undefined;
                executesCrews?: boolean | undefined;
                hasExternalIntegrations?: boolean | undefined;
                hasStateEvolution?: boolean | undefined;
                hasParallelExecution?: boolean | undefined;
                hasInfiniteLoop?: boolean | undefined;
            } | undefined;
            externalInteractions?: {
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                apis?: string[] | undefined;
                databases?: boolean | undefined;
                crews?: string[] | undefined;
                services?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
            } | undefined;
            flowChart?: string | undefined;
            yamlConfig?: {
                agents?: Record<string, any> | undefined;
                tasks?: Record<string, any> | undefined;
                crews?: Record<string, any> | undefined;
            } | undefined;
            workflowMetadata?: {
                estimatedDuration?: number | undefined;
                externalServices?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
                humanInteractionPoints?: {
                    type: string;
                    method: string;
                    description?: string | undefined;
                }[] | undefined;
                stepCount?: number | undefined;
                crewCount?: number | undefined;
                routerLabels?: string[] | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
            } | undefined;
            routingLogic?: {
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                routerLabels?: string[] | undefined;
                routerMethods?: string[] | undefined;
            } | undefined;
            frameworkSpecific?: {
                decorators?: {
                    starts?: string[] | undefined;
                    listeners?: string[] | undefined;
                    routers?: string[] | undefined;
                } | undefined;
                stateModel?: string | undefined;
                flowClass?: string | undefined;
            } | undefined;
        }, {
            behavioralDimensions?: {
                hasFileIO?: boolean | undefined;
                hasHumanInLoop?: boolean | undefined;
                hasConditionalLogic?: boolean | undefined;
                crewCount?: number | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
                collectsUserInput?: boolean | undefined;
                makesLLMCalls?: boolean | undefined;
                hasLoops?: boolean | undefined;
                executesCrews?: boolean | undefined;
                hasExternalIntegrations?: boolean | undefined;
                hasStateEvolution?: boolean | undefined;
                hasParallelExecution?: boolean | undefined;
                hasInfiniteLoop?: boolean | undefined;
            } | undefined;
            externalInteractions?: {
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                apis?: string[] | undefined;
                databases?: boolean | undefined;
                crews?: string[] | undefined;
                services?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
            } | undefined;
            flowChart?: string | undefined;
            yamlConfig?: {
                agents?: Record<string, any> | undefined;
                tasks?: Record<string, any> | undefined;
                crews?: Record<string, any> | undefined;
            } | undefined;
            workflowMetadata?: {
                estimatedDuration?: number | undefined;
                externalServices?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
                humanInteractionPoints?: {
                    type: string;
                    method: string;
                    description?: string | undefined;
                }[] | undefined;
                stepCount?: number | undefined;
                crewCount?: number | undefined;
                routerLabels?: string[] | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
            } | undefined;
            routingLogic?: {
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                routerLabels?: string[] | undefined;
                routerMethods?: string[] | undefined;
            } | undefined;
            frameworkSpecific?: {
                decorators?: {
                    starts?: string[] | undefined;
                    listeners?: string[] | undefined;
                    routers?: string[] | undefined;
                } | undefined;
                stateModel?: string | undefined;
                flowClass?: string | undefined;
            } | undefined;
        }>>;
        contract: z.ZodOptional<z.ZodObject<{
            purpose: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            inputRequirements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            outputDescription: z.ZodOptional<z.ZodString>;
            complexity: z.ZodOptional<z.ZodEnum<["simple", "moderate", "complex", "advanced"]>>;
            domain: z.ZodOptional<z.ZodString>;
            useCases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            limitations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            description?: string | undefined;
            capabilities?: string[] | undefined;
            purpose?: string | undefined;
            complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            domain?: string | undefined;
            useCases?: string[] | undefined;
            limitations?: string[] | undefined;
            dependencies?: string[] | undefined;
            inputRequirements?: string[] | undefined;
            outputDescription?: string | undefined;
        }, {
            description?: string | undefined;
            capabilities?: string[] | undefined;
            purpose?: string | undefined;
            complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            domain?: string | undefined;
            useCases?: string[] | undefined;
            limitations?: string[] | undefined;
            dependencies?: string[] | undefined;
            inputRequirements?: string[] | undefined;
            outputDescription?: string | undefined;
        }>>;
        testSpecs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            generated: z.ZodOptional<z.ZodString>;
            generatedBy: z.ZodOptional<z.ZodString>;
            tests: z.ZodDefault<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodOptional<z.ZodString>;
                input: z.ZodAny;
                expected: z.ZodOptional<z.ZodAny>;
                /**
                 * UI-friendly description of what this test is checking (5-7 words)
                 * LLM-generated during test creation, shown in CLI
                 * Format: "Testing: [description]"
                 */
                ui_description: z.ZodOptional<z.ZodString>;
                /**
                 * Dimension type for this test (runtime field)
                 * Now accepts any registered dimension - no hardcoded validation
                 */
                dimension: z.ZodOptional<z.ZodString>;
                /**
                 * Agent information for this test (runtime field)
                 */
                agent: z.ZodOptional<z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                    framework: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    framework: string;
                    id: string;
                    name: string;
                }, {
                    framework: string;
                    id: string;
                    name: string;
                }>>;
                /**
                 * Runtime metadata for test execution
                 */
                metadata: z.ZodOptional<z.ZodAny>;
                /**
                 * NEW: Evaluation criteria as structured objects (v2.0)
                 * Each criterion can have optional strictness and special instructions
                 */
                evaluation_criteria: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    /**
                     * The actual criterion to evaluate (e.g., "Output format is consistent")
                     */
                    criterion: z.ZodString;
                    /**
                     * Optional: Override dimension's default strictness for this criterion (0-100)
                     * User-editable in eval-spec.json
                     */
                    evaluation_strictness: z.ZodOptional<z.ZodNumber>;
                    /**
                     * Optional: Additional context/instructions for evaluating this criterion
                     * User-editable in eval-spec.json
                     */
                    special_instructions: z.ZodOptional<z.ZodString>;
                    /**
                     * Optional: UI-friendly description for this criterion (4-6 words)
                     * LLM-generated during test creation for display in CLI
                     */
                    ui_description: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }, {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }>, "many">>;
                /**
                 * DEPRECATED: Old string-based criteria (v1.0)
                 * Now supports both string[] (old) and EvaluationCriterion[] (new) formats
                 */
                evaluationCriteria: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodObject<{
                    /**
                     * The actual criterion to evaluate (e.g., "Output format is consistent")
                     */
                    criterion: z.ZodString;
                    /**
                     * Optional: Override dimension's default strictness for this criterion (0-100)
                     * User-editable in eval-spec.json
                     */
                    evaluation_strictness: z.ZodOptional<z.ZodNumber>;
                    /**
                     * Optional: Additional context/instructions for evaluating this criterion
                     * User-editable in eval-spec.json
                     */
                    special_instructions: z.ZodOptional<z.ZodString>;
                    /**
                     * Optional: UI-friendly description for this criterion (4-6 words)
                     * LLM-generated during test creation for display in CLI
                     */
                    ui_description: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }, {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }>, "many">]>>;
                /**
                 * NEW: Test-level threshold overrides
                 * Allows individual tests to override dimension defaults
                 */
                thresholds: z.ZodOptional<z.ZodObject<{
                    /**
                     * Percentage of criteria that must pass (0-100)
                     * Overrides dimension default
                     */
                    passing_criteria_percentage: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    passing_criteria_percentage?: number | undefined;
                }, {
                    passing_criteria_percentage?: number | undefined;
                }>>;
                priority: z.ZodDefault<z.ZodNumber>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                multiRun: z.ZodOptional<z.ZodObject<{
                    enabled: z.ZodOptional<z.ZodBoolean>;
                    runCount: z.ZodNumber;
                    variations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
                    runType: z.ZodOptional<z.ZodString>;
                    aggregationStrategy: z.ZodOptional<z.ZodString>;
                    executionMode: z.ZodOptional<z.ZodString>;
                    inputVariations: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
                }, "strip", z.ZodTypeAny, {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                }, {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                }>>;
                syntheticInputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                flowMetadata: z.ZodOptional<z.ZodObject<{
                    isFlowTest: z.ZodOptional<z.ZodBoolean>;
                    flowName: z.ZodOptional<z.ZodString>;
                    estimatedDuration: z.ZodOptional<z.ZodNumber>;
                    captureArtifacts: z.ZodOptional<z.ZodBoolean>;
                    artifactDirectory: z.ZodOptional<z.ZodString>;
                    dryRunIntegrations: z.ZodOptional<z.ZodBoolean>;
                    requiresHumanInput: z.ZodOptional<z.ZodBoolean>;
                    externalServices: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                }, {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                }>>;
                userModified: z.ZodOptional<z.ZodBoolean>;
                userNotes: z.ZodOptional<z.ZodString>;
                generatedBy: z.ZodOptional<z.ZodString>;
                generatedAt: z.ZodOptional<z.ZodString>;
                llmGeneration: z.ZodOptional<z.ZodObject<{
                    originalPrompt: z.ZodOptional<z.ZodString>;
                    reasoning: z.ZodOptional<z.ZodString>;
                    confidence: z.ZodOptional<z.ZodNumber>;
                    category: z.ZodOptional<z.ZodString>;
                    expectedBehavior: z.ZodOptional<z.ZodString>;
                    domainContext: z.ZodOptional<z.ZodString>;
                    complexityLevel: z.ZodOptional<z.ZodString>;
                    testingFocus: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                }, {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                priority: number;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }, {
                id: string;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                priority?: number | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            tests: {
                id: string;
                priority: number;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[];
            generated?: string | undefined;
            generatedBy?: string | undefined;
        }, {
            generated?: string | undefined;
            generatedBy?: string | undefined;
            tests?: {
                id: string;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                priority?: number | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[] | undefined;
        }>>>;
        executionConfig: z.ZodOptional<z.ZodObject<{
            timeout: z.ZodOptional<z.ZodNumber>;
            allowExternalCalls: z.ZodOptional<z.ZodBoolean>;
            captureArtifacts: z.ZodOptional<z.ZodBoolean>;
            artifactDirectory: z.ZodOptional<z.ZodString>;
            dryRunIntegrations: z.ZodOptional<z.ZodBoolean>;
            maxRetries: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            dryRunIntegrations?: boolean | undefined;
            timeout?: number | undefined;
            allowExternalCalls?: boolean | undefined;
            maxRetries?: number | undefined;
        }, {
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            dryRunIntegrations?: boolean | undefined;
            timeout?: number | undefined;
            allowExternalCalls?: boolean | undefined;
            maxRetries?: number | undefined;
        }>>;
        performance: z.ZodOptional<z.ZodObject<{
            lastRun: z.ZodOptional<z.ZodString>;
            totalRuns: z.ZodDefault<z.ZodNumber>;
            averageScore: z.ZodDefault<z.ZodNumber>;
            scoreHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
                timestamp: z.ZodString;
                dimension: z.ZodString;
                score: z.ZodNumber;
                passed: z.ZodBoolean;
                details: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }, {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }>, "many">>;
            trends: z.ZodOptional<z.ZodObject<{
                improving: z.ZodBoolean;
                degrading: z.ZodBoolean;
                stable: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            }, {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            }>>;
        }, "strip", z.ZodTypeAny, {
            totalRuns: number;
            averageScore: number;
            scoreHistory: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[];
            lastRun?: string | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        }, {
            lastRun?: string | undefined;
            totalRuns?: number | undefined;
            averageScore?: number | undefined;
            scoreHistory?: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[] | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: "workflow";
        name: string;
        analysis?: {
            behavioralDimensions?: {
                hasFileIO?: boolean | undefined;
                hasHumanInLoop?: boolean | undefined;
                hasConditionalLogic?: boolean | undefined;
                crewCount?: number | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
                collectsUserInput?: boolean | undefined;
                makesLLMCalls?: boolean | undefined;
                hasLoops?: boolean | undefined;
                executesCrews?: boolean | undefined;
                hasExternalIntegrations?: boolean | undefined;
                hasStateEvolution?: boolean | undefined;
                hasParallelExecution?: boolean | undefined;
                hasInfiniteLoop?: boolean | undefined;
            } | undefined;
            externalInteractions?: {
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                apis?: string[] | undefined;
                databases?: boolean | undefined;
                crews?: string[] | undefined;
                services?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
            } | undefined;
            flowChart?: string | undefined;
            yamlConfig?: {
                agents?: Record<string, any> | undefined;
                tasks?: Record<string, any> | undefined;
                crews?: Record<string, any> | undefined;
            } | undefined;
            workflowMetadata?: {
                estimatedDuration?: number | undefined;
                externalServices?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
                humanInteractionPoints?: {
                    type: string;
                    method: string;
                    description?: string | undefined;
                }[] | undefined;
                stepCount?: number | undefined;
                crewCount?: number | undefined;
                routerLabels?: string[] | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
            } | undefined;
            routingLogic?: {
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                routerLabels?: string[] | undefined;
                routerMethods?: string[] | undefined;
            } | undefined;
            frameworkSpecific?: {
                decorators?: {
                    starts?: string[] | undefined;
                    listeners?: string[] | undefined;
                    routers?: string[] | undefined;
                } | undefined;
                stateModel?: string | undefined;
                flowClass?: string | undefined;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        discovered?: {
            version: number;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        } | undefined;
        contract?: {
            description?: string | undefined;
            capabilities?: string[] | undefined;
            purpose?: string | undefined;
            complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            domain?: string | undefined;
            useCases?: string[] | undefined;
            limitations?: string[] | undefined;
            dependencies?: string[] | undefined;
            inputRequirements?: string[] | undefined;
            outputDescription?: string | undefined;
        } | undefined;
        testSpecs?: Record<string, {
            tests: {
                id: string;
                priority: number;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[];
            generated?: string | undefined;
            generatedBy?: string | undefined;
        }> | undefined;
        performance?: {
            totalRuns: number;
            averageScore: number;
            scoreHistory: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[];
            lastRun?: string | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        } | undefined;
        executionConfig?: {
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            dryRunIntegrations?: boolean | undefined;
            timeout?: number | undefined;
            allowExternalCalls?: boolean | undefined;
            maxRetries?: number | undefined;
        } | undefined;
    }, {
        type: "workflow";
        name: string;
        analysis?: {
            behavioralDimensions?: {
                hasFileIO?: boolean | undefined;
                hasHumanInLoop?: boolean | undefined;
                hasConditionalLogic?: boolean | undefined;
                crewCount?: number | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
                collectsUserInput?: boolean | undefined;
                makesLLMCalls?: boolean | undefined;
                hasLoops?: boolean | undefined;
                executesCrews?: boolean | undefined;
                hasExternalIntegrations?: boolean | undefined;
                hasStateEvolution?: boolean | undefined;
                hasParallelExecution?: boolean | undefined;
                hasInfiniteLoop?: boolean | undefined;
            } | undefined;
            externalInteractions?: {
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                apis?: string[] | undefined;
                databases?: boolean | undefined;
                crews?: string[] | undefined;
                services?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
            } | undefined;
            flowChart?: string | undefined;
            yamlConfig?: {
                agents?: Record<string, any> | undefined;
                tasks?: Record<string, any> | undefined;
                crews?: Record<string, any> | undefined;
            } | undefined;
            workflowMetadata?: {
                estimatedDuration?: number | undefined;
                externalServices?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
                humanInteractionPoints?: {
                    type: string;
                    method: string;
                    description?: string | undefined;
                }[] | undefined;
                stepCount?: number | undefined;
                crewCount?: number | undefined;
                routerLabels?: string[] | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
            } | undefined;
            routingLogic?: {
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                routerLabels?: string[] | undefined;
                routerMethods?: string[] | undefined;
            } | undefined;
            frameworkSpecific?: {
                decorators?: {
                    starts?: string[] | undefined;
                    listeners?: string[] | undefined;
                    routers?: string[] | undefined;
                } | undefined;
                stateModel?: string | undefined;
                flowClass?: string | undefined;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        discovered?: {
            version?: number | undefined;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        } | undefined;
        contract?: {
            description?: string | undefined;
            capabilities?: string[] | undefined;
            purpose?: string | undefined;
            complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            domain?: string | undefined;
            useCases?: string[] | undefined;
            limitations?: string[] | undefined;
            dependencies?: string[] | undefined;
            inputRequirements?: string[] | undefined;
            outputDescription?: string | undefined;
        } | undefined;
        testSpecs?: Record<string, {
            generated?: string | undefined;
            generatedBy?: string | undefined;
            tests?: {
                id: string;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                priority?: number | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[] | undefined;
        }> | undefined;
        performance?: {
            lastRun?: string | undefined;
            totalRuns?: number | undefined;
            averageScore?: number | undefined;
            scoreHistory?: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[] | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        } | undefined;
        executionConfig?: {
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            dryRunIntegrations?: boolean | undefined;
            timeout?: number | undefined;
            allowExternalCalls?: boolean | undefined;
            maxRetries?: number | undefined;
        } | undefined;
    }>>>;
    testHistory: z.ZodOptional<z.ZodObject<{
        runs: z.ZodArray<z.ZodObject<{
            runId: z.ZodString;
            timestamp: z.ZodString;
            agentsTestedCount: z.ZodNumber;
            dimensionsRun: z.ZodArray<z.ZodString, "many">;
            overallScore: z.ZodNumber;
            duration: z.ZodNumber;
            tokenUsage: z.ZodOptional<z.ZodNumber>;
            cost: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            runId: string;
            agentsTestedCount: number;
            dimensionsRun: string[];
            overallScore: number;
            duration: number;
            tokenUsage?: number | undefined;
            cost?: number | undefined;
        }, {
            timestamp: string;
            runId: string;
            agentsTestedCount: number;
            dimensionsRun: string[];
            overallScore: number;
            duration: number;
            tokenUsage?: number | undefined;
            cost?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        runs: {
            timestamp: string;
            runId: string;
            agentsTestedCount: number;
            dimensionsRun: string[];
            overallScore: number;
            duration: number;
            tokenUsage?: number | undefined;
            cost?: number | undefined;
        }[];
    }, {
        runs: {
            timestamp: string;
            runId: string;
            agentsTestedCount: number;
            dimensionsRun: string[];
            overallScore: number;
            duration: number;
            tokenUsage?: number | undefined;
            cost?: number | undefined;
        }[];
    }>>;
    customizations: z.ZodOptional<z.ZodObject<{
        globalCriteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dimensionOverrides: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            customPrompt: z.ZodOptional<z.ZodString>;
            customCriteria: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            customPrompt?: string | undefined;
            customCriteria?: string[] | undefined;
        }, {
            customPrompt?: string | undefined;
            customCriteria?: string[] | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        globalCriteria?: string[] | undefined;
        dimensionOverrides?: Record<string, {
            customPrompt?: string | undefined;
            customCriteria?: string[] | undefined;
        }> | undefined;
    }, {
        globalCriteria?: string[] | undefined;
        dimensionOverrides?: Record<string, {
            customPrompt?: string | undefined;
            customCriteria?: string[] | undefined;
        }> | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        created_at: z.ZodOptional<z.ZodString>;
        updated_at: z.ZodOptional<z.ZodString>;
        author: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        tags?: string[] | undefined;
        created_at?: string | undefined;
        updated_at?: string | undefined;
        author?: string | undefined;
    }, {
        description?: string | undefined;
        tags?: string[] | undefined;
        created_at?: string | undefined;
        updated_at?: string | undefined;
        author?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    version: string;
    project: {
        framework: "langchain" | "crewai" | "autogen" | "llamaindex" | "custom";
        language: "python" | "typescript" | "javascript";
        root_path?: string | undefined;
        llm_config?: {
            provider?: string | undefined;
            model?: string | undefined;
            api_key_env?: string | undefined;
            temperature?: number | undefined;
            max_tokens?: number | undefined;
        } | undefined;
        environment?: Record<string, string> | undefined;
    };
    agents: Record<string, {
        type: "custom" | "classifier" | "rag" | "task_executor" | "coordinator";
        description?: string | undefined;
        discovered?: {
            version: number;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        } | undefined;
        contract?: {
            role?: string | undefined;
            goal?: string | undefined;
            capabilities?: string[] | undefined;
            inputSchema?: any;
            outputSchema?: any;
        } | undefined;
        metadata?: Record<string, any> | undefined;
        testSpecs?: Record<string, {
            tests: {
                id: string;
                priority: number;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[];
            generated?: string | undefined;
            generatedBy?: string | undefined;
        }> | undefined;
        performance?: {
            totalRuns: number;
            averageScore: number;
            scoreHistory: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[];
            lastRun?: string | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        } | undefined;
        evaluation_spec?: {
            sample_inputs: any[];
            performance?: {
                max_latency_ms?: number | undefined;
                min_throughput?: number | undefined;
                timeout_ms?: number | undefined;
            } | undefined;
            expected_output_type?: "custom" | "text" | "json" | "classification" | "structured" | undefined;
            output_schema?: Record<string, {
                type: "string" | "number" | "boolean" | "object" | "array" | "enum";
                values?: any[] | undefined;
                description?: string | undefined;
                required?: boolean | undefined;
                items?: any;
                properties?: Record<string, any> | undefined;
                min?: number | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
            }> | undefined;
            safety?: {
                test_prompt_injection?: boolean | undefined;
                test_boundary_inputs?: boolean | undefined;
                test_error_recovery?: boolean | undefined;
            } | undefined;
            consistency?: {
                runs_per_input?: number | undefined;
                similarity_threshold?: number | undefined;
            } | undefined;
            determinism?: {
                expect_deterministic?: boolean | undefined;
                allowed_variance?: number | undefined;
            } | undefined;
        } | undefined;
    }>;
    projectId?: string | undefined;
    lastScanned?: string | undefined;
    metadata?: {
        description?: string | undefined;
        tags?: string[] | undefined;
        created_at?: string | undefined;
        updated_at?: string | undefined;
        author?: string | undefined;
    } | undefined;
    teams?: Record<string, {
        name: string;
        members: string[];
        analysis?: {
            crewMetadata?: {
                estimatedDuration?: number | undefined;
                agentCount?: number | undefined;
                taskCount?: number | undefined;
                process?: "unknown" | "sequential" | "hierarchical" | undefined;
                hasMemory?: boolean | undefined;
                hasCache?: boolean | undefined;
                verboseMode?: boolean | undefined;
            } | undefined;
            behavioralDimensions?: {
                complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
                hasToolUsage?: boolean | undefined;
                toolsList?: string[] | undefined;
                hasFileIO?: boolean | undefined;
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                hasExternalAPIs?: boolean | undefined;
                apiCalls?: string[] | undefined;
                hasHumanInLoop?: boolean | undefined;
                humanInteractionPoints?: {
                    type: "input" | "approval" | "review";
                    description: string;
                    taskName: string;
                    blocking?: boolean | undefined;
                }[] | undefined;
                hasConditionalLogic?: boolean | undefined;
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                hasErrorHandling?: boolean | undefined;
                errorHandlers?: {
                    exceptionTypes: string[];
                    hasRetry: boolean;
                    hasFallback: boolean;
                    lineno?: number | undefined;
                }[] | undefined;
                hasStateManagement?: boolean | undefined;
                stateVariables?: string[] | undefined;
            } | undefined;
            externalInteractions?: {
                fileOperations?: {
                    reads?: string[] | undefined;
                    writes?: string[] | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                tools?: {
                    type: "custom" | "search" | "file" | "api" | "database";
                    name: string;
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                apis?: {
                    name: string;
                    operations?: string[] | undefined;
                    endpoint?: string | undefined;
                    envVar?: string | undefined;
                    protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
                }[] | undefined;
                databases?: {
                    type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                llmProviders?: {
                    agent: string;
                    provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                    model: string;
                }[] | undefined;
            } | undefined;
            flowChart?: string | undefined;
            yamlConfig?: {
                agents?: Record<string, {
                    role?: string | undefined;
                    goal?: string | undefined;
                    tools?: string[] | undefined;
                    backstory?: string | undefined;
                    llm?: string | undefined;
                    max_iter?: number | undefined;
                    verbose?: boolean | undefined;
                    allow_delegation?: boolean | undefined;
                }> | undefined;
                tasks?: Record<string, {
                    agent?: string | undefined;
                    description?: string | undefined;
                    tools?: string[] | undefined;
                    expected_output?: string | undefined;
                    human_input?: boolean | undefined;
                    context?: string[] | undefined;
                }> | undefined;
                crews?: Record<string, {
                    agents?: string[] | undefined;
                    process?: "sequential" | "hierarchical" | undefined;
                    tasks?: string[] | undefined;
                    memory?: boolean | undefined;
                    cache?: boolean | undefined;
                }> | undefined;
            } | undefined;
        } | undefined;
        coordinator?: string | undefined;
        description?: string | undefined;
        discovered?: {
            version: number;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        } | undefined;
        contract?: {
            type?: "team" | "crew" | "workflow" | "pipeline" | undefined;
            description?: string | undefined;
            capabilities?: string[] | undefined;
            estimatedDuration?: number | undefined;
            requiresHumanInput?: boolean | undefined;
            externalServices?: string[] | undefined;
            purpose?: string | undefined;
            complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            domain?: string | undefined;
            useCases?: string[] | undefined;
            limitations?: string[] | undefined;
            dependencies?: string[] | undefined;
            producesArtifacts?: boolean | undefined;
            artifactTypes?: string[] | undefined;
        } | undefined;
        testSpecs?: Record<string, {
            tests: {
                id: string;
                priority: number;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[];
            generated?: string | undefined;
            generatedBy?: string | undefined;
        }> | undefined;
        performance?: {
            totalRuns: number;
            averageScore: number;
            scoreHistory: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[];
            lastRun?: string | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        } | undefined;
        executionConfig?: {
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            timeout?: number | undefined;
            allowExternalCalls?: boolean | undefined;
        } | undefined;
    }> | undefined;
    flows?: Record<string, {
        type: "workflow";
        name: string;
        analysis?: {
            behavioralDimensions?: {
                hasFileIO?: boolean | undefined;
                hasHumanInLoop?: boolean | undefined;
                hasConditionalLogic?: boolean | undefined;
                crewCount?: number | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
                collectsUserInput?: boolean | undefined;
                makesLLMCalls?: boolean | undefined;
                hasLoops?: boolean | undefined;
                executesCrews?: boolean | undefined;
                hasExternalIntegrations?: boolean | undefined;
                hasStateEvolution?: boolean | undefined;
                hasParallelExecution?: boolean | undefined;
                hasInfiniteLoop?: boolean | undefined;
            } | undefined;
            externalInteractions?: {
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                apis?: string[] | undefined;
                databases?: boolean | undefined;
                crews?: string[] | undefined;
                services?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
            } | undefined;
            flowChart?: string | undefined;
            yamlConfig?: {
                agents?: Record<string, any> | undefined;
                tasks?: Record<string, any> | undefined;
                crews?: Record<string, any> | undefined;
            } | undefined;
            workflowMetadata?: {
                estimatedDuration?: number | undefined;
                externalServices?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
                humanInteractionPoints?: {
                    type: string;
                    method: string;
                    description?: string | undefined;
                }[] | undefined;
                stepCount?: number | undefined;
                crewCount?: number | undefined;
                routerLabels?: string[] | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
            } | undefined;
            routingLogic?: {
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                routerLabels?: string[] | undefined;
                routerMethods?: string[] | undefined;
            } | undefined;
            frameworkSpecific?: {
                decorators?: {
                    starts?: string[] | undefined;
                    listeners?: string[] | undefined;
                    routers?: string[] | undefined;
                } | undefined;
                stateModel?: string | undefined;
                flowClass?: string | undefined;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        discovered?: {
            version: number;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        } | undefined;
        contract?: {
            description?: string | undefined;
            capabilities?: string[] | undefined;
            purpose?: string | undefined;
            complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            domain?: string | undefined;
            useCases?: string[] | undefined;
            limitations?: string[] | undefined;
            dependencies?: string[] | undefined;
            inputRequirements?: string[] | undefined;
            outputDescription?: string | undefined;
        } | undefined;
        testSpecs?: Record<string, {
            tests: {
                id: string;
                priority: number;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[];
            generated?: string | undefined;
            generatedBy?: string | undefined;
        }> | undefined;
        performance?: {
            totalRuns: number;
            averageScore: number;
            scoreHistory: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[];
            lastRun?: string | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        } | undefined;
        executionConfig?: {
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            dryRunIntegrations?: boolean | undefined;
            timeout?: number | undefined;
            allowExternalCalls?: boolean | undefined;
            maxRetries?: number | undefined;
        } | undefined;
    }> | undefined;
    testHistory?: {
        runs: {
            timestamp: string;
            runId: string;
            agentsTestedCount: number;
            dimensionsRun: string[];
            overallScore: number;
            duration: number;
            tokenUsage?: number | undefined;
            cost?: number | undefined;
        }[];
    } | undefined;
    customizations?: {
        globalCriteria?: string[] | undefined;
        dimensionOverrides?: Record<string, {
            customPrompt?: string | undefined;
            customCriteria?: string[] | undefined;
        }> | undefined;
    } | undefined;
}, {
    version: string;
    project: {
        framework: "langchain" | "crewai" | "autogen" | "llamaindex" | "custom";
        language: "python" | "typescript" | "javascript";
        root_path?: string | undefined;
        llm_config?: {
            provider?: string | undefined;
            model?: string | undefined;
            api_key_env?: string | undefined;
            temperature?: number | undefined;
            max_tokens?: number | undefined;
        } | undefined;
        environment?: Record<string, string> | undefined;
    };
    agents: Record<string, {
        type: "custom" | "classifier" | "rag" | "task_executor" | "coordinator";
        description?: string | undefined;
        discovered?: {
            version?: number | undefined;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        } | undefined;
        contract?: {
            role?: string | undefined;
            goal?: string | undefined;
            capabilities?: string[] | undefined;
            inputSchema?: any;
            outputSchema?: any;
        } | undefined;
        metadata?: Record<string, any> | undefined;
        testSpecs?: Record<string, {
            generated?: string | undefined;
            generatedBy?: string | undefined;
            tests?: {
                id: string;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                priority?: number | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[] | undefined;
        }> | undefined;
        performance?: {
            lastRun?: string | undefined;
            totalRuns?: number | undefined;
            averageScore?: number | undefined;
            scoreHistory?: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[] | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        } | undefined;
        evaluation_spec?: {
            sample_inputs: any[];
            performance?: {
                max_latency_ms?: number | undefined;
                min_throughput?: number | undefined;
                timeout_ms?: number | undefined;
            } | undefined;
            expected_output_type?: "custom" | "text" | "json" | "classification" | "structured" | undefined;
            output_schema?: Record<string, {
                type: "string" | "number" | "boolean" | "object" | "array" | "enum";
                values?: any[] | undefined;
                description?: string | undefined;
                required?: boolean | undefined;
                items?: any;
                properties?: Record<string, any> | undefined;
                min?: number | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
            }> | undefined;
            safety?: {
                test_prompt_injection?: boolean | undefined;
                test_boundary_inputs?: boolean | undefined;
                test_error_recovery?: boolean | undefined;
            } | undefined;
            consistency?: {
                runs_per_input?: number | undefined;
                similarity_threshold?: number | undefined;
            } | undefined;
            determinism?: {
                expect_deterministic?: boolean | undefined;
                allowed_variance?: number | undefined;
            } | undefined;
        } | undefined;
    }>;
    projectId?: string | undefined;
    lastScanned?: string | undefined;
    metadata?: {
        description?: string | undefined;
        tags?: string[] | undefined;
        created_at?: string | undefined;
        updated_at?: string | undefined;
        author?: string | undefined;
    } | undefined;
    teams?: Record<string, {
        name: string;
        members: string[];
        analysis?: {
            crewMetadata?: {
                estimatedDuration?: number | undefined;
                agentCount?: number | undefined;
                taskCount?: number | undefined;
                process?: "unknown" | "sequential" | "hierarchical" | undefined;
                hasMemory?: boolean | undefined;
                hasCache?: boolean | undefined;
                verboseMode?: boolean | undefined;
            } | undefined;
            behavioralDimensions?: {
                complexityLevel?: "simple" | "moderate" | "complex" | "advanced" | undefined;
                hasToolUsage?: boolean | undefined;
                toolsList?: string[] | undefined;
                hasFileIO?: boolean | undefined;
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                hasExternalAPIs?: boolean | undefined;
                apiCalls?: string[] | undefined;
                hasHumanInLoop?: boolean | undefined;
                humanInteractionPoints?: {
                    type: "input" | "approval" | "review";
                    description: string;
                    taskName: string;
                    blocking?: boolean | undefined;
                }[] | undefined;
                hasConditionalLogic?: boolean | undefined;
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                hasErrorHandling?: boolean | undefined;
                errorHandlers?: {
                    exceptionTypes: string[];
                    hasRetry: boolean;
                    hasFallback: boolean;
                    lineno?: number | undefined;
                }[] | undefined;
                hasStateManagement?: boolean | undefined;
                stateVariables?: string[] | undefined;
            } | undefined;
            externalInteractions?: {
                fileOperations?: {
                    reads?: string[] | undefined;
                    writes?: string[] | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                tools?: {
                    type: "custom" | "search" | "file" | "api" | "database";
                    name: string;
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                apis?: {
                    name: string;
                    operations?: string[] | undefined;
                    endpoint?: string | undefined;
                    envVar?: string | undefined;
                    protocol?: "http" | "https" | "websocket" | "grpc" | undefined;
                }[] | undefined;
                databases?: {
                    type: "unknown" | "sqlite" | "postgres" | "mysql" | "mongodb" | "redis";
                    operations?: string[] | undefined;
                    requiredEnvVars?: string[] | undefined;
                }[] | undefined;
                llmProviders?: {
                    agent: string;
                    provider: "custom" | "openai" | "anthropic" | "google" | "azure" | "aws";
                    model: string;
                }[] | undefined;
            } | undefined;
            flowChart?: string | undefined;
            yamlConfig?: {
                agents?: Record<string, {
                    role?: string | undefined;
                    goal?: string | undefined;
                    tools?: string[] | undefined;
                    backstory?: string | undefined;
                    llm?: string | undefined;
                    max_iter?: number | undefined;
                    verbose?: boolean | undefined;
                    allow_delegation?: boolean | undefined;
                }> | undefined;
                tasks?: Record<string, {
                    agent?: string | undefined;
                    description?: string | undefined;
                    tools?: string[] | undefined;
                    expected_output?: string | undefined;
                    human_input?: boolean | undefined;
                    context?: string[] | undefined;
                }> | undefined;
                crews?: Record<string, {
                    agents?: string[] | undefined;
                    process?: "sequential" | "hierarchical" | undefined;
                    tasks?: string[] | undefined;
                    memory?: boolean | undefined;
                    cache?: boolean | undefined;
                }> | undefined;
            } | undefined;
        } | undefined;
        coordinator?: string | undefined;
        description?: string | undefined;
        discovered?: {
            version?: number | undefined;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        } | undefined;
        contract?: {
            type?: "team" | "crew" | "workflow" | "pipeline" | undefined;
            description?: string | undefined;
            capabilities?: string[] | undefined;
            estimatedDuration?: number | undefined;
            requiresHumanInput?: boolean | undefined;
            externalServices?: string[] | undefined;
            purpose?: string | undefined;
            complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            domain?: string | undefined;
            useCases?: string[] | undefined;
            limitations?: string[] | undefined;
            dependencies?: string[] | undefined;
            producesArtifacts?: boolean | undefined;
            artifactTypes?: string[] | undefined;
        } | undefined;
        testSpecs?: Record<string, {
            generated?: string | undefined;
            generatedBy?: string | undefined;
            tests?: {
                id: string;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                priority?: number | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[] | undefined;
        }> | undefined;
        performance?: {
            lastRun?: string | undefined;
            totalRuns?: number | undefined;
            averageScore?: number | undefined;
            scoreHistory?: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[] | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        } | undefined;
        executionConfig?: {
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            timeout?: number | undefined;
            allowExternalCalls?: boolean | undefined;
        } | undefined;
    }> | undefined;
    flows?: Record<string, {
        type: "workflow";
        name: string;
        analysis?: {
            behavioralDimensions?: {
                hasFileIO?: boolean | undefined;
                hasHumanInLoop?: boolean | undefined;
                hasConditionalLogic?: boolean | undefined;
                crewCount?: number | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
                collectsUserInput?: boolean | undefined;
                makesLLMCalls?: boolean | undefined;
                hasLoops?: boolean | undefined;
                executesCrews?: boolean | undefined;
                hasExternalIntegrations?: boolean | undefined;
                hasStateEvolution?: boolean | undefined;
                hasParallelExecution?: boolean | undefined;
                hasInfiniteLoop?: boolean | undefined;
            } | undefined;
            externalInteractions?: {
                fileOperations?: {
                    reads?: boolean | undefined;
                    writes?: boolean | undefined;
                    formats?: string[] | undefined;
                } | undefined;
                apis?: string[] | undefined;
                databases?: boolean | undefined;
                crews?: string[] | undefined;
                services?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
            } | undefined;
            flowChart?: string | undefined;
            yamlConfig?: {
                agents?: Record<string, any> | undefined;
                tasks?: Record<string, any> | undefined;
                crews?: Record<string, any> | undefined;
            } | undefined;
            workflowMetadata?: {
                estimatedDuration?: number | undefined;
                externalServices?: {
                    name: string;
                    operations?: string[] | undefined;
                    envVar?: string | undefined;
                }[] | undefined;
                humanInteractionPoints?: {
                    type: string;
                    method: string;
                    description?: string | undefined;
                }[] | undefined;
                stepCount?: number | undefined;
                crewCount?: number | undefined;
                routerLabels?: string[] | undefined;
                parallelCrews?: boolean | undefined;
                crewChaining?: boolean | undefined;
            } | undefined;
            routingLogic?: {
                conditionalPaths?: {
                    condition: string;
                    target: string;
                    lineno?: number | undefined;
                }[] | undefined;
                routerLabels?: string[] | undefined;
                routerMethods?: string[] | undefined;
            } | undefined;
            frameworkSpecific?: {
                decorators?: {
                    starts?: string[] | undefined;
                    listeners?: string[] | undefined;
                    routers?: string[] | undefined;
                } | undefined;
                stateModel?: string | undefined;
                flowClass?: string | undefined;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        discovered?: {
            version?: number | undefined;
            path?: string | undefined;
            firstSeen?: string | undefined;
            lastModified?: string | undefined;
            sourceHash?: string | undefined;
        } | undefined;
        contract?: {
            description?: string | undefined;
            capabilities?: string[] | undefined;
            purpose?: string | undefined;
            complexity?: "simple" | "moderate" | "complex" | "advanced" | undefined;
            domain?: string | undefined;
            useCases?: string[] | undefined;
            limitations?: string[] | undefined;
            dependencies?: string[] | undefined;
            inputRequirements?: string[] | undefined;
            outputDescription?: string | undefined;
        } | undefined;
        testSpecs?: Record<string, {
            generated?: string | undefined;
            generatedBy?: string | undefined;
            tests?: {
                id: string;
                agent?: {
                    framework: string;
                    id: string;
                    name: string;
                } | undefined;
                expected?: any;
                generatedBy?: string | undefined;
                name?: string | undefined;
                input?: any;
                ui_description?: string | undefined;
                dimension?: string | undefined;
                metadata?: any;
                evaluation_criteria?: {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                evaluationCriteria?: string[] | {
                    criterion: string;
                    ui_description?: string | undefined;
                    evaluation_strictness?: number | undefined;
                    special_instructions?: string | undefined;
                }[] | undefined;
                thresholds?: {
                    passing_criteria_percentage?: number | undefined;
                } | undefined;
                priority?: number | undefined;
                tags?: string[] | undefined;
                multiRun?: {
                    runCount: number;
                    enabled?: boolean | undefined;
                    variations?: any[] | undefined;
                    runType?: string | undefined;
                    aggregationStrategy?: string | undefined;
                    executionMode?: string | undefined;
                    inputVariations?: any[] | undefined;
                } | undefined;
                syntheticInputs?: Record<string, any> | undefined;
                flowMetadata?: {
                    isFlowTest?: boolean | undefined;
                    flowName?: string | undefined;
                    estimatedDuration?: number | undefined;
                    captureArtifacts?: boolean | undefined;
                    artifactDirectory?: string | undefined;
                    dryRunIntegrations?: boolean | undefined;
                    requiresHumanInput?: boolean | undefined;
                    externalServices?: string[] | undefined;
                } | undefined;
                userModified?: boolean | undefined;
                userNotes?: string | undefined;
                generatedAt?: string | undefined;
                llmGeneration?: {
                    originalPrompt?: string | undefined;
                    reasoning?: string | undefined;
                    confidence?: number | undefined;
                    category?: string | undefined;
                    expectedBehavior?: string | undefined;
                    domainContext?: string | undefined;
                    complexityLevel?: string | undefined;
                    testingFocus?: string[] | undefined;
                } | undefined;
            }[] | undefined;
        }> | undefined;
        performance?: {
            lastRun?: string | undefined;
            totalRuns?: number | undefined;
            averageScore?: number | undefined;
            scoreHistory?: {
                dimension: string;
                timestamp: string;
                score: number;
                passed: boolean;
                details?: any;
            }[] | undefined;
            trends?: {
                improving: boolean;
                degrading: boolean;
                stable: boolean;
            } | undefined;
        } | undefined;
        executionConfig?: {
            captureArtifacts?: boolean | undefined;
            artifactDirectory?: string | undefined;
            dryRunIntegrations?: boolean | undefined;
            timeout?: number | undefined;
            allowExternalCalls?: boolean | undefined;
            maxRetries?: number | undefined;
        } | undefined;
    }> | undefined;
    testHistory?: {
        runs: {
            timestamp: string;
            runId: string;
            agentsTestedCount: number;
            dimensionsRun: string[];
            overallScore: number;
            duration: number;
            tokenUsage?: number | undefined;
            cost?: number | undefined;
        }[];
    } | undefined;
    customizations?: {
        globalCriteria?: string[] | undefined;
        dimensionOverrides?: Record<string, {
            customPrompt?: string | undefined;
            customCriteria?: string[] | undefined;
        }> | undefined;
    } | undefined;
}>;
export type AgentType = z.infer<typeof AgentTypeSchema>;
export type Framework = z.infer<typeof FrameworkSchema>;
export type OutputType = z.infer<typeof OutputTypeSchema>;
export type SchemaField = z.infer<typeof SchemaFieldSchema>;
export type EvaluationCriterion = z.infer<typeof EvaluationCriterionSchema>;
export type TestThresholds = z.infer<typeof TestThresholdsSchema>;
export type DiscoveryMetadata = z.infer<typeof DiscoveryMetadataSchema>;
export type TestSpecification = z.infer<typeof TestSpecificationSchema>;
export type DimensionTestSpecs = z.infer<typeof DimensionTestSpecsSchema>;
export type PerformanceHistoryEntry = z.infer<typeof PerformanceHistoryEntrySchema>;
export type PerformanceTracking = z.infer<typeof PerformanceTrackingSchema>;
export type AgentEvalSpec = z.infer<typeof AgentEvalSpecSchema>;
export type TeamSpec = z.infer<typeof TeamSpecSchema>;
export type FlowSpec = z.infer<typeof FlowSpecSchema>;
export type TestRunHistoryEntry = z.infer<typeof TestRunHistoryEntrySchema>;
export type UserCustomizations = z.infer<typeof UserCustomizationsSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type TestConfig = z.infer<typeof TestConfigSchema>;
export type EvalSpec = z.infer<typeof EvalSpecSchema>;
/**
 * Validate an evaluation specification
 */
export declare function validateEvalSpec(spec: unknown): EvalSpec;
/**
 * Validate an evaluation specification with error details
 */
export declare function validateEvalSpecSafe(spec: unknown): {
    success: boolean;
    data?: EvalSpec;
    errors?: z.ZodError;
};
/**
 * Create a default evaluation specification
 */
export declare function createDefaultEvalSpec(framework: Framework, language: 'python' | 'typescript' | 'javascript'): EvalSpec;
/**
 * Example evaluation specification
 */
export declare const EXAMPLE_EVAL_SPEC: EvalSpec;
//# sourceMappingURL=eval-spec.d.ts.map