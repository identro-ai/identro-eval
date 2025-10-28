"use strict";
/**
 * Test Generation Service - Unified LLM test generation logic
 *
 * Extracts test generation functionality from interactive mode to be shared
 * between interactive and standalone commands.
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
exports.TestGenerationService = void 0;
const config_1 = require("../utils/config");
const llm_config_manager_1 = require("./llm-config-manager");
class TestGenerationService {
    /**
     * Generate tests for entities using LLM
     */
    async generateTests(options) {
        const { projectPath, entities, dimensions, evalSpec: providedEvalSpec, llmConfig, concurrency = 3, onProgress, onTaskComplete, onTaskError } = options;
        // Load configuration
        const config = await (0, config_1.loadConfig)();
        // Initialize LLM provider
        const llmProvider = await this.initializeLLMProvider(llmConfig || await this.discoverLLMConfig(projectPath));
        // Initialize dimension file loader
        const { DimensionFileLoader } = await Promise.resolve().then(() => __importStar(require('../_internal/core')));
        const dimensionFileLoader = new DimensionFileLoader({
            projectPath,
            createDefaults: true
        });
        // Use provided evalSpec or load fresh
        let evalSpec;
        let specManager;
        if (providedEvalSpec) {
            // Use provided eval-spec (avoids sync issues)
            evalSpec = providedEvalSpec;
            const { EvalSpecManager } = await Promise.resolve().then(() => __importStar(require('../_internal/core')));
            specManager = new EvalSpecManager(projectPath);
        }
        else {
            // Load fresh eval-spec
            const { EvalSpecManager } = await Promise.resolve().then(() => __importStar(require('../_internal/core')));
            specManager = new EvalSpecManager(projectPath);
            evalSpec = await specManager.load();
        }
        // Initialize LLM Queue Manager for concurrent generation
        const { LLMQueueManager } = await Promise.resolve().then(() => __importStar(require('../_internal/core')));
        const llmQueueManager = new LLMQueueManager({
            maxConcurrentCalls: concurrency,
            onTaskStart: (task) => {
                onProgress?.(0, 0, task.name);
            },
            onTaskComplete: (task, result, duration) => {
                onTaskComplete?.(task.name, duration);
            },
            onTaskError: (task, error, duration) => {
                onTaskError?.(task.name, error);
            },
            onProgress: (completed, total) => {
                onProgress?.(completed, total);
            }
        });
        const result = {
            totalTasks: 0,
            successfulTasks: 0,
            failedTasks: 0,
            totalTestsGenerated: 0,
            evalSpec,
            errors: []
        };
        // Generate tests for each entity+dimension combination
        const generationTasks = [];
        for (const entity of entities) {
            for (const dimension of dimensions) {
                // Get dimension definition from file loader
                const dimensionDefinition = await dimensionFileLoader.loadDimension(dimension);
                if (!dimensionDefinition) {
                    result.errors.push({ task: `${entity.name}-${dimension}`, error: `Dimension '${dimension}' not found` });
                    continue;
                }
                result.totalTasks++;
                const taskId = `${entity.name}-${dimension}`;
                const taskName = `${dimension} tests for ${entity.name}`;
                // Create LLM queue task
                const queueTask = {
                    id: taskId,
                    name: taskName,
                    execute: async () => {
                        if (entity.type === 'agent') {
                            return await this.generateAgentTests(entity, dimension, dimensionDefinition, llmProvider, evalSpec, specManager, config);
                        }
                        else if (entity.type === 'flow') {
                            return await this.generateFlowTests(entity, dimension, dimensionDefinition, llmProvider, evalSpec, specManager, config);
                        }
                        else {
                            return await this.generateTeamTests(entity, dimension, dimensionDefinition, llmProvider, evalSpec, specManager, config);
                        }
                    }
                };
                generationTasks.push(llmQueueManager.enqueue(queueTask));
            }
        }
        // Execute all generation tasks
        const results = await Promise.allSettled(generationTasks);
        // Process results
        for (const taskResult of results) {
            if (taskResult.status === 'fulfilled') {
                result.successfulTasks++;
                result.totalTestsGenerated += taskResult.value.testCount || 0;
            }
            else {
                result.failedTasks++;
                result.errors.push({
                    task: 'unknown',
                    error: taskResult.reason?.message || 'Unknown error'
                });
            }
        }
        // Save updated eval spec
        if (result.successfulTasks > 0) {
            await specManager.save(evalSpec, { backup: true });
            result.evalSpec = evalSpec;
        }
        return result;
    }
    /**
     * Generate tests for an individual agent
     */
    async generateAgentTests(agent, dimension, dimensionDefinition, llmProvider, evalSpec, specManager, config) {
        const { generateTestsFromDimension } = await Promise.resolve().then(() => __importStar(require('../_internal/core')));
        // Get agent from eval spec
        const agentSpec = evalSpec.agents[agent.name];
        if (!agentSpec) {
            throw new Error(`Agent '${agent.name}' not found in eval spec`);
        }
        // Convert contract to ExtractedContract format
        let extractedContract = undefined;
        if (agentSpec.contract) {
            extractedContract = {
                description: agentSpec.contract.goal || agentSpec.contract.role || `${agent.name} agent`,
                capabilities: agentSpec.contract.capabilities || [],
                confidence: 0.8,
                extractedFrom: [agentSpec.discovered?.path || 'agent definition'],
                inputSchema: agentSpec.contract.inputSchema,
                outputSchema: agentSpec.contract.outputSchema,
                metadata: agentSpec.contract
            };
        }
        // Generate tests using dimension definition
        const testSpecs = await generateTestsFromDimension(dimensionDefinition, { name: agent.name, ...agentSpec }, llmProvider, {
            contract: extractedContract,
            multiRunEnabled: config?.dimensions?.consistency?.enabled !== false,
            runsPerInput: config?.dimensions?.consistency?.runs_per_input || 3,
            variationsPerInput: 3,
            testCount: config?.dimensions?.[dimension]?.test_count || 3,
            config: config?.dimensions?.[dimension] || {},
            entityType: 'agent'
        });
        // Convert to test specifications format
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require('crypto')));
        const testSpecifications = testSpecs.map((spec) => ({
            id: spec.id || randomUUID(),
            name: spec.metadata?.testName || spec.id,
            input: spec.input,
            expected: spec.expected,
            ui_description: spec.ui_description, // Extract test-level UI description
            evaluationCriteria: spec.evaluation_criteria || spec.evaluationCriteria || [],
            priority: spec.priority || 1,
            tags: spec.tags || [],
            multiRun: spec.multiRun,
            userModified: false,
            generatedBy: llmProvider.model || 'llm',
            generatedAt: new Date().toISOString(),
        }));
        // Update eval spec
        await specManager.updateAgent(evalSpec, { id: agent.name, path: '', source: '', type: 'general' }, undefined, {
            [dimension]: {
                tests: testSpecifications,
                generated: new Date().toISOString(),
                generatedBy: llmProvider.model || 'llm'
            }
        });
        return { testCount: testSpecifications.length };
    }
    /**
     * Generate tests for a team/crew/flow
     */
    async generateTeamTests(team, dimension, dimensionDefinition, llmProvider, evalSpec, specManager, config) {
        const { generateTestsFromDimension } = await Promise.resolve().then(() => __importStar(require('../_internal/core')));
        // Get team from eval spec - check teams section first, fallback to agents for backwards compatibility
        const teamSpec = (evalSpec.teams && evalSpec.teams[team.name]) || evalSpec.agents[team.name];
        if (!teamSpec) {
            throw new Error(`Team '${team.name}' not found in eval spec`);
        }
        // Check if this is a flow and get enhanced analysis
        let flowAnalysis = null;
        let flowContract = null;
        if (team.type === 'workflow' || team.metadata?.flowType === 'crewai_flow') {
            // Get enhanced flow analysis
            flowAnalysis = await this.getFlowAnalysis(team, teamSpec);
            flowContract = await this.buildFlowContract(flowAnalysis, teamSpec);
        }
        // Build comprehensive context for LLM
        const entityContext = flowContract ? {
            // Enhanced flow context
            name: team.name,
            type: 'flow',
            framework: 'crewai',
            path: teamSpec.discovered?.path || '',
            description: flowContract.description,
            // Rich flow understanding
            flowChart: flowContract.flowChart,
            workflowMetadata: flowContract.workflowMetadata,
            capabilities: flowContract.capabilities,
            routerPaths: flowContract.routerPaths,
            humanInteractionPoints: flowContract.humanInteractionPoints,
            externalServices: flowContract.externalServices,
            crewOrchestration: flowContract.crewOrchestration,
            metadata: {
                isFlow: true,
                flowType: 'crewai_flow',
                complexity: this.assessFlowComplexity(flowContract)
            }
        } : {
            // ENHANCED: Traditional team context with Phase 1-3 analysis data
            name: team.name,
            type: 'team',
            framework: 'crewai',
            path: teamSpec.discovered?.path || '',
            description: teamSpec.contract?.description || `Team: ${team.name}`,
            // PHASE 4 ENHANCEMENT: Include rich analysis from Phase 2 discovery
            metadata: {
                isTeam: true,
                // Pass all enhanced analysis to LLM provider (use type assertion for teams)
                enhancedAnalysis: teamSpec.analysis || null,
                complexity: teamSpec.analysis?.behavioralDimensions?.complexityLevel || 'moderate'
            }
        };
        // Generate tests using dimension definition with rich context
        const testSpecs = await generateTestsFromDimension(dimensionDefinition, entityContext, llmProvider, {
            // Enhanced context for flows - pass through structure parameter
            contract: flowContract ? this.buildFlowContractForGeneration(flowContract) : undefined,
            structure: flowContract?.workflowMetadata || this.buildBasicTeamStructure(teamSpec),
            // Standard configuration
            multiRunEnabled: config?.dimensions?.consistency?.enabled !== false,
            runsPerInput: config?.dimensions?.consistency?.runs_per_input || 3,
            variationsPerInput: 3,
            testCount: config?.dimensions?.[dimension]?.test_count || 3,
            config: config?.dimensions?.[dimension] || {},
            entityType: 'team', // Always use 'team' for teams/flows
            // Pass flow or crew context to LLM provider  
            context: {
                framework: 'crewai',
                entityType: 'team',
                metadata: {
                    isFlow: !!flowContract,
                    flowContract: flowContract,
                    // PHASE 4 ENHANCEMENT: Include enhanced crew analysis for non-flow teams
                    enhancedAnalysis: !flowContract ? teamSpec.analysis : null,
                    complexity: flowContract
                        ? this.assessFlowComplexity(flowContract)
                        : (teamSpec.analysis?.behavioralDimensions?.complexityLevel || 'moderate')
                }
            }
        });
        // Convert to test specifications format with flow-specific enhancements
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require('crypto')));
        const testSpecifications = testSpecs.map((spec) => ({
            id: spec.id || randomUUID(),
            name: spec.metadata?.testName || spec.id,
            input: spec.input,
            expected: spec.expected,
            ui_description: spec.ui_description, // Extract test-level UI description
            evaluationCriteria: spec.evaluation_criteria || spec.evaluationCriteria || [],
            priority: spec.priority || 1,
            tags: [...(spec.tags || []), flowContract ? 'flow-test' : 'team-test'],
            multiRun: spec.multiRun,
            // Flow-specific synthetic inputs - extract from LLM response first, then fallback to defaults
            syntheticInputs: spec.metadata?.llmGeneration?.synthetic_inputs ||
                spec.synthetic_inputs ||
                (flowContract?.humanInteractionPoints?.length > 0 ?
                    this.generateDefaultSyntheticInputs(flowContract.humanInteractionPoints) : undefined),
            userModified: false,
            generatedBy: llmProvider.model || 'llm',
            generatedAt: new Date().toISOString(),
        }));
        // PHASE 3 FIX: Use updateTeam() to store in evalSpec.teams (NOT evalSpec.agents)
        await specManager.updateTeam(evalSpec, {
            name: team.name,
            path: '',
            description: flowContract?.description || teamSpec.contract?.description || `Team: ${team.name}`,
            members: [],
            coordinator: flowContract ? 'flow-orchestrator' : 'team-leader'
        }, flowContract, // Pass the enhanced contract
        {
            [dimension]: {
                tests: testSpecifications,
                generated: new Date().toISOString(),
                generatedBy: llmProvider.model || 'llm'
            }
        });
        return { testCount: testSpecifications.length };
    }
    /**
     * Generate tests for a flow (CrewAI workflows)
     */
    async generateFlowTests(flow, dimension, dimensionDefinition, llmProvider, evalSpec, specManager, config) {
        const { generateTestsFromDimension } = await Promise.resolve().then(() => __importStar(require('../_internal/core')));
        // Get flow from eval spec flows section
        const flowSpec = evalSpec.flows?.[flow.name];
        if (!flowSpec) {
            throw new Error(`Flow '${flow.name}' not found in eval spec flows section`);
        }
        // Build comprehensive flow context for LLM using stored analysis
        const entityContext = {
            name: flow.name,
            type: 'flow',
            framework: 'crewai',
            path: flowSpec.discovered?.path || '',
            description: flowSpec.description || `CrewAI Flow: ${flow.name}`,
            // Rich flow understanding from stored analysis
            flowChart: flowSpec.analysis?.flowChart || 'Flow chart not available',
            workflowMetadata: flowSpec.analysis?.workflowMetadata || {},
            capabilities: flowSpec.contract?.capabilities || [],
            routerPaths: flowSpec.analysis?.routingLogic?.routerLabels || [],
            humanInteractionPoints: flowSpec.analysis?.workflowMetadata?.humanInteractionPoints || [],
            externalServices: flowSpec.analysis?.workflowMetadata?.externalServices || [],
            metadata: {
                isFlow: true,
                flowType: 'crewai_flow',
                complexity: flowSpec.contract?.complexity || 'moderate'
            }
        };
        // Generate tests using dimension definition with rich flow context
        const testSpecs = await generateTestsFromDimension(dimensionDefinition, entityContext, llmProvider, {
            // Enhanced context for flows
            contract: {
                description: flowSpec.description || `CrewAI Flow: ${flow.name}`,
                capabilities: flowSpec.contract?.capabilities || [],
                confidence: 0.9,
                extractedFrom: ['flow-analysis', 'ast-parser', 'yaml-config'],
                metadata: {
                    flowChart: flowSpec.analysis?.flowChart,
                    routerPaths: flowSpec.analysis?.routingLogic?.routerLabels,
                    humanInteractionPoints: flowSpec.analysis?.workflowMetadata?.humanInteractionPoints,
                    externalServices: flowSpec.analysis?.workflowMetadata?.externalServices,
                    estimatedDuration: flowSpec.analysis?.workflowMetadata?.estimatedDuration,
                    producesArtifacts: flowSpec.analysis?.externalInteractions?.fileOperations?.writes
                }
            },
            structure: flowSpec.analysis?.workflowMetadata || { name: flow.name, type: 'workflow' },
            // Standard configuration
            multiRunEnabled: config?.dimensions?.consistency?.enabled !== false,
            runsPerInput: config?.dimensions?.consistency?.runs_per_input || 3,
            variationsPerInput: 3,
            testCount: config?.dimensions?.[dimension]?.test_count || 3,
            config: config?.dimensions?.[dimension] || {},
            entityType: 'team', // Use 'team' for compatibility with existing dimension system
            // Pass complete flow context to LLM provider
            context: {
                framework: 'crewai',
                entityType: 'flow',
                metadata: {
                    isFlow: true,
                    flowContract: flowSpec,
                    complexity: flowSpec.contract?.complexity || 'moderate'
                }
            }
        });
        // Debug output removed - was causing flickering in UI
        // For flows, we need to manually extract the contract from the LLM provider
        // since the existing generateTestsFromDimension doesn't return contracts
        // This is flow-specific logic that doesn't affect agents/teams
        if (!flowSpec.contract) {
            console.log(`🧠 Generating flow-specific contract for: ${flow.name}`);
            try {
                // Call LLM provider directly for contract generation (flow-specific)
                const contractResult = await llmProvider.generateDimensionTests({
                    dimension: 'contract-generation',
                    count: 1,
                    structure: flowSpec.analysis?.workflowMetadata || { name: flow.name, type: 'workflow' },
                    context: {
                        framework: 'crewai',
                        entityType: 'flow',
                        metadata: {
                            isFlow: true,
                            flowContract: flowSpec,
                            complexity: flowSpec.contract?.complexity || 'moderate'
                        }
                    }
                });
                if (contractResult.contract) {
                    console.log(`✅ Saving LLM-generated contract for flow: ${flow.name}`);
                    flowSpec.contract = {
                        purpose: contractResult.contract.goal || contractResult.contract.description,
                        description: contractResult.contract.description,
                        capabilities: contractResult.contract.capabilities || [],
                        complexity: contractResult.contract?.complexity || 'moderate'
                    };
                }
            }
            catch (contractError) {
                console.warn(`Failed to generate contract for ${flow.name}:`, contractError);
            }
        }
        // Convert to test specifications format with flow-specific enhancements
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require('crypto')));
        const testSpecifications = (testSpecs || []).map((spec) => ({
            id: spec.id || randomUUID(),
            name: spec.metadata?.testName || spec.id,
            input: spec.input,
            expected: spec.expected,
            ui_description: spec.ui_description, // Extract test-level UI description
            evaluationCriteria: spec.evaluation_criteria || spec.evaluationCriteria || [],
            priority: spec.priority || 1,
            tags: [...(spec.tags || []), 'flow-test'],
            multiRun: spec.multiRun,
            // Flow-specific synthetic inputs
            syntheticInputs: spec.metadata?.llmGeneration?.synthetic_inputs ||
                spec.synthetic_inputs ||
                (flowSpec.analysis?.workflowMetadata?.humanInteractionPoints && flowSpec.analysis.workflowMetadata.humanInteractionPoints.length > 0 ?
                    this.generateDefaultSyntheticInputs(flowSpec.analysis.workflowMetadata.humanInteractionPoints) : undefined),
            userModified: false,
            generatedBy: llmProvider.model || 'llm',
            generatedAt: new Date().toISOString(),
        }));
        // Update flow spec in flows section
        if (!flowSpec.testSpecs) {
            flowSpec.testSpecs = {};
        }
        flowSpec.testSpecs[dimension] = {
            tests: testSpecifications,
            generated: new Date().toISOString(),
            generatedBy: llmProvider.model || 'llm'
        };
        // Contract generation is handled by the LLM provider in buildFlowAnalysisPrompt()
        // No need for redundant contract generation logic here
        return { testCount: testSpecifications.length };
    }
    /**
     * Get enhanced flow analysis for a team/flow
     */
    async getFlowAnalysis(team, teamSpec) {
        try {
            // Import enhanced workflow discovery
            const { analyzeFlowFile } = await Promise.resolve().then(() => __importStar(require('../_internal/crewai')));
            const filePath = teamSpec.discovered?.path || team.path;
            if (!filePath) {
                return null;
            }
            const analysis = await analyzeFlowFile(filePath);
            return analysis;
        }
        catch (error) {
            console.warn(`Could not get enhanced flow analysis for ${team.name}:`, error);
            return null;
        }
    }
    /**
     * Build comprehensive flow contract from analysis
     */
    async buildFlowContract(flowAnalysis, teamSpec) {
        if (!flowAnalysis?.entity) {
            return null;
        }
        const entity = flowAnalysis.entity;
        return {
            description: `CrewAI Flow: ${entity.name} - ${entity.contract?.description || 'Advanced workflow orchestration'}`,
            // Flow structure understanding
            flowChart: entity.flowChart || 'Flow chart not available',
            workflowMetadata: entity.workflowMetadata,
            capabilities: entity.contract?.capabilities || [],
            // Router path analysis
            routerPaths: entity.flowSignals?.routingLogic?.routerLabels || [],
            routerLogic: entity.flowSignals?.routingLogic || {},
            // Human interaction points
            humanInteractionPoints: entity.workflowMetadata?.humanInteractionPoints || [],
            // External services
            externalServices: entity.workflowMetadata?.externalServices || [],
            // Crew orchestration details
            crewOrchestration: {
                crewCount: entity.workflowMetadata?.crewCount || 0,
                crews: entity.flowSignals?.externalInteractions?.crews || [],
                parallelExecution: entity.workflowMetadata?.parallelCrews || false,
                crewChaining: entity.workflowMetadata?.crewChaining || false
            },
            // Execution characteristics
            estimatedDuration: entity.workflowMetadata?.estimatedDuration || 300,
            producesArtifacts: entity.workflowMetadata?.producesArtifacts || false,
            artifactTypes: entity.flowSignals?.externalInteractions?.fileOperations?.formats || [],
            // Technical details
            flowSignals: entity.flowSignals,
            yamlConfig: entity.yamlConfig
        };
    }
    /**
     * Build basic team structure for non-flow teams
     */
    buildBasicTeamStructure(teamSpec) {
        return teamSpec.contract?.metadata?.teamStructure || {
            name: teamSpec.name || 'Unknown Team',
            process: 'sequential',
            agents: [],
            tasks: [],
            workflow: { summary: 'Traditional crew workflow' }
        };
    }
    /**
     * Assess flow complexity for test generation
     */
    assessFlowComplexity(flowContract) {
        let complexity = 0;
        // Router paths add complexity
        complexity += (flowContract.routerPaths?.length || 0) * 2;
        // Human interaction points add complexity
        complexity += (flowContract.humanInteractionPoints?.length || 0) * 3;
        // External services add complexity
        complexity += (flowContract.externalServices?.length || 0) * 2;
        // Crew orchestration adds complexity
        complexity += (flowContract.crewOrchestration?.crewCount || 0) * 1;
        // Parallel execution adds complexity
        if (flowContract.crewOrchestration?.parallelExecution) {
            complexity += 3;
        }
        // Artifact production adds complexity
        if (flowContract.producesArtifacts) {
            complexity += 2;
        }
        if (complexity <= 3)
            return 'simple';
        if (complexity <= 8)
            return 'moderate';
        if (complexity <= 15)
            return 'complex';
        return 'advanced';
    }
    /**
     * Generate default synthetic inputs for HITL points
     */
    generateDefaultSyntheticInputs(humanInteractionPoints) {
        const syntheticInputs = {};
        for (const point of humanInteractionPoints) {
            if (point.type === 'approval') {
                syntheticInputs[point.method] = {
                    action: 'approve',
                    reason: 'Automated test approval'
                };
            }
            else if (point.type === 'input') {
                syntheticInputs[point.method] = {
                    input: 'Test input data',
                    priority: 'normal'
                };
            }
            else if (point.type === 'review') {
                syntheticInputs[point.method] = {
                    action: 'accept',
                    feedback: 'Looks good for testing'
                };
            }
        }
        return syntheticInputs;
    }
    /**
     * Build flow contract for test generation (ExtractedContract format)
     */
    buildFlowContractForGeneration(flowContract) {
        return {
            description: flowContract.description,
            capabilities: flowContract.capabilities,
            confidence: 0.9, // High confidence for flow analysis
            extractedFrom: ['flow-analysis', 'ast-parser', 'yaml-config'],
            metadata: {
                flowChart: flowContract.flowChart,
                routerPaths: flowContract.routerPaths,
                humanInteractionPoints: flowContract.humanInteractionPoints,
                externalServices: flowContract.externalServices,
                crewOrchestration: flowContract.crewOrchestration,
                estimatedDuration: flowContract.estimatedDuration,
                producesArtifacts: flowContract.producesArtifacts,
                artifactTypes: flowContract.artifactTypes,
                complexity: this.assessFlowComplexity(flowContract)
            }
        };
    }
    /**
     * Initialize LLM provider from config
     */
    async initializeLLMProvider(llmConfig) {
        if (!llmConfig) {
            throw new Error('No LLM configuration provided');
        }
        if (llmConfig.provider === 'openai') {
            const { OpenAIProvider } = await Promise.resolve().then(() => __importStar(require('../_internal/core')));
            const apiKey = llmConfig.apiKey || process.env.OPENAI_API_KEY || process.env[llmConfig.apiKeyEnv];
            if (!apiKey) {
                throw new Error('OpenAI API key not found. Please ensure OPENAI_API_KEY is set.');
            }
            return new OpenAIProvider({
                apiKey,
                model: llmConfig.model || 'gpt-4-turbo-preview',
            });
        }
        else if (llmConfig.provider === 'anthropic') {
            const { AnthropicProvider } = await Promise.resolve().then(() => __importStar(require('../_internal/core')));
            const apiKey = llmConfig.apiKey || process.env.ANTHROPIC_API_KEY || process.env[llmConfig.apiKeyEnv];
            if (!apiKey) {
                throw new Error('Anthropic API key not found. Please set ANTHROPIC_API_KEY environment variable.');
            }
            return new AnthropicProvider({
                apiKey,
                model: llmConfig.model || 'claude-3-opus-20240229',
            });
        }
        else {
            throw new Error(`Unsupported LLM provider: ${llmConfig.provider}`);
        }
    }
    /**
     * Discover LLM configuration
     */
    async discoverLLMConfig(projectPath) {
        const llmConfig = await llm_config_manager_1.llmConfigManager.discoverAndConfigure(projectPath);
        if (!llmConfig || !llmConfig.discovered || llmConfig.discovered.length === 0) {
            throw new Error('No LLM configuration found. Please set up an API key (e.g., OPENAI_API_KEY).');
        }
        return llmConfig.discovered[0]; // Use first discovered config
    }
    /**
     * Check if tests already exist for entities and dimensions
     */
    async checkExistingTests(projectPath, entityNames, dimensions) {
        const { EvalSpecManager, TestSpecLoader } = await Promise.resolve().then(() => __importStar(require('../_internal/core')));
        try {
            const specManager = new EvalSpecManager(projectPath);
            const evalSpec = await specManager.load();
            const testSpecLoader = new TestSpecLoader();
            const validation = testSpecLoader.validateTestSpecs(evalSpec, entityNames, dimensions);
            const existingTests = [];
            const missingTests = [];
            for (const entityName of entityNames) {
                for (const dimension of dimensions) {
                    const entity = evalSpec.agents[entityName];
                    if (entity && entity.testSpecs && entity.testSpecs[dimension]) {
                        existingTests.push({
                            entity: entityName,
                            dimension: dimension,
                            testCount: entity.testSpecs[dimension].tests?.length || 0
                        });
                    }
                    else {
                        missingTests.push({ entity: entityName, dimension: dimension });
                    }
                }
            }
            return {
                hasTests: existingTests.length > 0,
                missingTests,
                existingTests
            };
        }
        catch (err) {
            return {
                hasTests: false,
                missingTests: entityNames.flatMap(entity => dimensions.map(dimension => ({ entity, dimension }))),
                existingTests: []
            };
        }
    }
    /**
     * Get generation summary for display
     */
    getGenerationSummary(result) {
        return {
            successRate: result.totalTasks > 0 ? result.successfulTasks / result.totalTasks : 0,
            averageTestsPerTask: result.successfulTasks > 0 ? result.totalTestsGenerated / result.successfulTasks : 0,
            hasErrors: result.errors.length > 0,
            totalEntities: new Set(result.errors.map(e => e.task.split('-')[0])).size
        };
    }
}
exports.TestGenerationService = TestGenerationService;
//# sourceMappingURL=test-generation-service.js.map