"use strict";
/**
 * Generic Test Generator - Dimension File-Based Test Generation
 *
 * Generates test specifications using dimension definitions from YAML files
 * instead of hardcoded generators. This is the single source of truth for
 * test generation that uses user-editable dimension files.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestsFromDimension = generateTestsFromDimension;
/**
 * Generate test specifications from dimension definition (YAML file)
 *
 * This replaces the hardcoded dimension generators and uses dimension definitions
 * loaded from .identro/dimensions/*.yml files that users can edit.
 */
async function generateTestsFromDimension(dimensionDefinition, entity, llmProvider, options = {}) {
    // Extract configuration from dimension definition (YAML file)
    const config = dimensionDefinition.configuration;
    const prompts = dimensionDefinition.prompts;
    // Use dimension configuration with fallbacks to options
    const runsPerInput = options.runsPerInput || config?.runs_per_input || 3;
    const variationsPerInput = options.variationsPerInput || config?.variations_per_input || 2;
    const multiRunEnabled = options.multiRunEnabled !== false; // Default to true
    const testCount = options.testCount || config?.test_count || 3;
    const entityType = options.entityType || 'agent';
    const isTeam = entityType === 'team';
    // LLM provider is required - no fallbacks
    if (!llmProvider) {
        throw new Error('LLM provider is required for dimension-based test generation. Please configure an LLM provider (OpenAI or Anthropic).');
    }
    // For agents: contract required, for teams: structure required
    if (!isTeam && !options.contract) {
        throw new Error('Agent contract is required for dimension-based test generation. Please ensure agent analysis was successful.');
    }
    if (isTeam && !options.structure) {
        throw new Error('Team structure is required for team dimension-based test generation. Please ensure team discovery was successful.');
    }
    // Get dimension requirements from YAML file instead of hardcoded method
    const dimensionRequirements = isTeam && prompts.team_requirements
        ? prompts.team_requirements
        : prompts.agent_requirements;
    if (!dimensionRequirements) {
        throw new Error(`Dimension requirements not found in dimension definition for ${dimensionDefinition.name}. Please check the YAML file has ${isTeam ? 'team_requirements' : 'agent_requirements'}.`);
    }
    // Build entity-agnostic request using dimension definition
    const request = {
        dimension: dimensionDefinition.name, // Allow dynamic dimension names from YAML files
        count: testCount,
        context: {
            framework: entity.framework || 'unknown',
            entityType,
            agentType: entity.type,
            metadata: {
                entityName: entity.name,
                multiRunEnabled,
                runsPerInput,
                variationsPerInput,
                generateSophisticatedInputs: true,
                contractDriven: !isTeam,
                structureDriven: isTeam,
                configuredTestCount: testCount,
                // Include dimension definition metadata
                dimensionVersion: dimensionDefinition.metadata.version,
                dimensionComplexity: dimensionDefinition.metadata.complexity,
                dimensionPriority: dimensionDefinition.priority,
                // Include custom variables from dimension definition
                dimensionVariables: dimensionDefinition.variables,
                // Include dimension requirements from YAML file
                dimensionRequirements: dimensionRequirements,
                // Include evaluation criteria from dimension definition
                evaluationCriteria: prompts.evaluation_criteria,
                // Include custom instructions if provided
                customInstructions: prompts.custom_instructions,
                // Include domain context if provided
                domainContext: prompts.domain_context,
                // Include flow context if provided
                ...(options.context?.metadata || {}),
            },
        },
    };
    // Add contract or structure based on entity type
    if (isTeam) {
        request.structure = options.structure;
    }
    else {
        request.contract = options.contract;
    }
    // Always use direct call - LLM queue management happens at higher level
    const llmGeneratedResult = await llmProvider.generateDimensionTests(request);
    const llmGeneratedTests = llmGeneratedResult.tests;
    // For teams: update entity with LLM-generated contract
    if (isTeam && llmGeneratedResult.contract) {
        updateEntityContract(entity, llmGeneratedResult.contract);
    }
    // Convert LLM-generated tests to TestSpecs with multi-run configuration
    const testSpecs = [];
    for (let i = 0; i < llmGeneratedTests.length; i++) {
        const generatedTest = llmGeneratedTests[i];
        // Use structured evaluation criteria from LLM directly (already in correct format)
        // Create multi-run configuration using dimension configuration
        // Use dimension configuration to determine run type instead of hardcoding dimension names
        const runType = (config?.runs_per_input || 1) > 1 && (config?.variations_per_input || 0) <= 1
            ? 'identical' // Multiple runs of same input
            : 'variations'; // Different variations of input
        const multiRunConfig = multiRunEnabled ? {
            runCount: runsPerInput,
            runType: runType,
            aggregationStrategy: 'compare',
            executionMode: 'parallel', // Run in parallel for efficiency
        } : undefined;
        // Generate UUID for test ID
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require('crypto')));
        const testSpec = {
            id: randomUUID(),
            dimension: dimensionDefinition.name, // Allow dynamic dimension names from YAML files
            input: generatedTest.input,
            expected: generatedTest.expected,
            ui_description: generatedTest.ui_description, // Extract test-level UI description from LLM
            evaluation_criteria: generatedTest.evaluation_criteria, // Use new structured format
            multiRun: multiRunConfig,
            agent: {
                id: entity.id || 'unknown',
                name: entity.name || 'unknown',
                framework: entity.framework || 'unknown',
            },
            metadata: {
                inputIndex: i,
                dimension: dimensionDefinition.name,
                agentName: entity.name || 'unknown',
                generatedBy: 'dimension-file',
                testName: generatedTest.name,
                rationale: generatedTest.rationale,
                category: generatedTest.category,
                priority: generatedTest.priority || dimensionDefinition.priority,
                expectedBehavior: generatedTest.expected,
                totalRuns: runsPerInput,
                isMultiRun: multiRunEnabled,
                entityType,
                // dimension definition metadata
                dimensionDefinition: {
                    name: dimensionDefinition.name,
                    version: dimensionDefinition.metadata.version,
                    description: dimensionDefinition.description,
                    shortDescription: dimensionDefinition.short_description,
                    complexity: dimensionDefinition.metadata.complexity,
                    priority: dimensionDefinition.priority,
                    configuration: config,
                    generatedFrom: 'yaml-file',
                    yamlSource: `.identro/dimensions/${dimensionDefinition.name}.yml`,
                },
                // Enhanced LLM generation context
                llmGeneration: {
                    originalPrompt: dimensionRequirements,
                    reasoning: generatedTest.rationale || `Dimension-based test for ${dimensionDefinition.name}`,
                    confidence: 0.85, // Default confidence for dimension-based tests
                    category: generatedTest.category || `${dimensionDefinition.name}_dimension`,
                    expectedBehavior: typeof generatedTest.expected === 'string'
                        ? generatedTest.expected
                        : JSON.stringify(generatedTest.expected),
                    domainContext: prompts.domain_context || (isTeam ? 'Team structure analysis' : (options.contract?.description || 'Agent contract analysis')),
                    complexityLevel: determineComplexityLevel(generatedTest.input),
                    testingFocus: [
                        `${dimensionDefinition.name}_dimension`,
                        'dimension_file_based',
                        'user_customizable',
                        'yaml_driven'
                    ],
                    dimensionSource: 'yaml-file',
                    customInstructions: prompts.custom_instructions,
                },
            },
            priority: generatedTest.priority || dimensionDefinition.priority,
        };
        testSpecs.push(testSpec);
    }
    // Note: Variation tests disabled to keep test count predictable
    // Users can enable variations by modifying the dimension YAML files if needed
    return testSpecs;
}
/**
 * Update entity with LLM-generated contract (for teams)
 */
function updateEntityContract(entity, contract) {
    if (entity.metadata) {
        entity.metadata.llmGeneratedContract = contract;
        entity.metadata.contractGeneratedAt = new Date().toISOString();
    }
    // Update entity contract if it exists
    if (entity.contract) {
        entity.contract = {
            ...entity.contract,
            ...contract,
            generatedBy: 'dimension-file-llm',
            generatedAt: new Date().toISOString()
        };
    }
}
/**
 * Determine complexity level of test input
 */
function determineComplexityLevel(input) {
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
    const length = inputStr.length;
    const hasComplexStructure = typeof input === 'object' && input !== null;
    const hasMultipleFields = hasComplexStructure && Object.keys(input).length > 3;
    if (length > 1000 || hasMultipleFields) {
        return 'advanced';
    }
    else if (length > 500 || hasComplexStructure) {
        return 'complex';
    }
    else if (length > 100) {
        return 'moderate';
    }
    else {
        return 'simple';
    }
}
//# sourceMappingURL=generic-test-generator.js.map