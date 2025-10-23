"use strict";
/**
 * Simplified Test Runner
 *
 * Single source of truth for test execution without competing orchestrators.
 * Uses TestStateManager as the main controller with direct LLM evaluation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimplifiedTestRunner = void 0;
class SimplifiedTestRunner {
    constructor(testStateManager, llmProvider, config, configManager, dimensionRegistry) {
        this.testStateManager = testStateManager;
        this.llmProvider = llmProvider;
        this.config = config;
        this.configManager = configManager;
        this.dimensionRegistry = dimensionRegistry;
        this.activeLLMEvaluations = new Set();
        this.llmEvaluationQueue = [];
    }
    /**
     * Run all tests with proper queue-based concurrency control
     */
    async runAllTests(testSpecs, adapter, context) {
        // Filter out parent tests - only execute individual runs and single tests
        const executableTests = testSpecs.filter(spec => !spec.metadata?.isParentTest);
        context.splitPane?.addLog(`🚀 Starting simplified test execution: ${executableTests.length} tests (max concurrency: ${this.config.maxConcurrency})`, 'info');
        // Queue-based concurrency control
        const testQueue = [...executableTests];
        const activeTests = new Set();
        // Function to start next test from queue
        const startNextTest = () => {
            if (testQueue.length > 0 && activeTests.size < this.config.maxConcurrency) {
                const testSpec = testQueue.shift();
                const testPromise = this.runSingleTest(testSpec, adapter, context)
                    .finally(() => {
                    activeTests.delete(testPromise);
                    // Immediately try to start next test
                    startNextTest();
                });
                activeTests.add(testPromise);
                // Continue starting tests until we hit max concurrency or run out of tests
                if (testQueue.length > 0 && activeTests.size < this.config.maxConcurrency) {
                    setImmediate(startNextTest);
                }
            }
        };
        // Start initial batch
        startNextTest();
        // Wait for all tests to complete
        while (activeTests.size > 0 || testQueue.length > 0) {
            if (activeTests.size > 0) {
                await Promise.race(activeTests);
            }
            else {
                // Safety break if queue has items but no active tests
                break;
            }
        }
        context.splitPane?.addLog('✅ All test executions completed', 'success');
    }
    /**
     * Run team tests with proper queue-based concurrency control
     * CRITICAL: Teams now use pre-generated test inputs from session (same as agents)
     */
    async runTeamTests(teams, dimensions, adapter, context, teamTestInputs // Pre-generated team test inputs from LLM queue
    ) {
        if (teams.length === 0) {
            return;
        }
        context.splitPane?.addLog(`👥 Starting team test execution: ${teams.length} teams, ${dimensions.length} dimensions`, 'info');
        // Generate team test specs using PRE-GENERATED inputs (same as agents)
        const teamTestSpecs = [];
        for (const team of teams) {
            const dimension = dimensions[0]; // Get dimension from dimensions array
            for (const dimension of dimensions) {
                // Use pre-generated test inputs from LLM queue (same flow as agents)
                const inputKey = `${team.name}-${dimension}`;
                const testInputs = teamTestInputs?.[inputKey] || this.getFallbackTeamInputs(team, dimension);
                for (let i = 0; i < testInputs.length; i++) {
                    const testId = `team-${team.name}-${dimension}-${i}`;
                    const teamTestSpec = {
                        id: testId,
                        dimension: dimension,
                        input: testInputs[i],
                        priority: 1,
                        agent: {
                            id: team.id,
                            name: team.name,
                            framework: team.framework
                        },
                        metadata: {
                            isTeamTest: true,
                            teamName: team.name,
                            inputIndex: i,
                            agentName: team.name
                        },
                        evaluation_criteria: this.generateTeamEvaluationCriteria(team, dimension)
                    };
                    teamTestSpecs.push(teamTestSpec);
                    // Create test in state manager (same as agents)
                    this.testStateManager.createTestWithId(testId, team.name, dimension, i, testInputs[i]);
                }
            }
        }
        // Execute team tests using the same queue system as agents
        await this.runAllTests(teamTestSpecs, adapter, context);
    }
    /**
     * Fallback team inputs (only used if LLM generation failed)
     */
    getFallbackTeamInputs(team, dimension) {
        return [{
                task: `Team ${dimension} evaluation task for ${team.name}`,
                focus_areas: [dimension, 'collaboration'],
                output_format: 'team report',
                team_context: `Team coordination required`,
                generated_by: 'fallback'
            }];
    }
    /**
     * Generate test inputs for teams using LLM (NO STATIC CONTENT)
     */
    async generateTeamTestInputs(team, dimension, llmProvider) {
        // NEVER use static content - always use LLM to generate team-specific test inputs
        if (!llmProvider) {
            throw new Error('LLM provider is required for team test generation. No static fallbacks allowed.');
        }
        try {
            // Create team-specific prompt for LLM test generation
            const teamPrompt = `
You are generating test inputs for a TEAM/CREW of AI agents, not individual agents.

TEAM INFORMATION:
- Team Name: ${team.name}
- Team Type: ${team.type}
- Team Members: ${team.composition?.memberCount || 0} agents
- Team Process: ${team.composition?.process || 'unknown'}
- Team Description: ${team.contract.description}
- Team Capabilities: ${team.contract.capabilities.join(', ')}

IMPORTANT: This is a TEAM of multiple agents working together, not a single agent.
Teams have different characteristics than individual agents:
- Teams coordinate between multiple agents
- Teams can handle more complex, multi-step tasks
- Teams may take longer but produce more comprehensive results
- Teams should demonstrate collaboration and coordination

Generate 3 test inputs for the "${dimension}" dimension that are specifically designed for TEAM testing.
Each test should:
1. Be appropriate for a team of ${team.composition?.memberCount || 'multiple'} agents
2. Test team coordination and collaboration
3. Be more complex than individual agent tests
4. Focus on the "${dimension}" evaluation dimension

Return a JSON array of test inputs. Each input should be an object with:
- task: The main task for the team
- focus_areas: Array of areas to focus on
- output_format: Expected output format
- team_context: Why this task requires a team vs individual agent

Example format:
[
  {
    "task": "Complex multi-step task requiring team coordination",
    "focus_areas": ["collaboration", "coordination", "quality"],
    "output_format": "comprehensive report",
    "team_context": "Requires multiple perspectives and coordinated effort"
  }
]
`;
            // Call LLM to generate team-specific test inputs
            const response = await llmProvider.generateText({
                prompt: teamPrompt,
                maxTokens: 1000,
                temperature: 0.7
            });
            // Parse LLM response
            let testInputs;
            try {
                // Extract JSON from response
                const jsonMatch = response.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    testInputs = JSON.parse(jsonMatch[0]);
                }
                else {
                    throw new Error('No JSON array found in LLM response');
                }
            }
            catch (parseError) {
                console.warn(`Failed to parse LLM response for team ${team.name}, using fallback generation`);
                // Generate structured inputs based on team characteristics
                testInputs = this.generateStructuredTeamInputs(team, dimension);
            }
            // Validate and ensure we have at least 3 test inputs
            if (!Array.isArray(testInputs) || testInputs.length === 0) {
                testInputs = this.generateStructuredTeamInputs(team, dimension);
            }
            // Ensure each input has required fields
            return testInputs.map((input, index) => ({
                task: input.task || `Team task ${index + 1} for ${dimension} testing`,
                focus_areas: input.focus_areas || [dimension, 'collaboration', 'coordination'],
                output_format: input.output_format || 'comprehensive report',
                team_context: input.team_context || `Requires team of ${team.composition?.memberCount || 'multiple'} agents`,
                dimension: dimension,
                generated_by: 'llm',
                team_name: team.name
            }));
        }
        catch (error) {
            console.error(`Error generating LLM test inputs for team ${team.name}:`, error);
            // Fallback to structured generation (still no static content)
            return this.generateStructuredTeamInputs(team, dimension);
        }
    }
    /**
     * Generate structured team inputs (fallback when LLM fails, but still no static content)
     */
    generateStructuredTeamInputs(team, dimension) {
        const teamSize = team.composition?.memberCount || 2;
        const teamProcess = team.composition?.process || 'sequential';
        const teamCapabilities = team.contract.capabilities.slice(0, 3).join(', ');
        // Generate team-specific inputs based on team characteristics
        const baseTask = `Complex ${dimension} evaluation task requiring ${teamSize} agents with ${teamProcess} coordination`;
        return [
            {
                task: `${baseTask} - Multi-perspective analysis`,
                focus_areas: [dimension, 'team_coordination', 'collaborative_analysis'],
                output_format: 'comprehensive team report',
                team_context: `Requires ${teamSize} agents working in ${teamProcess} process`,
                dimension: dimension,
                generated_by: 'structured',
                team_name: team.name,
                team_capabilities: teamCapabilities
            },
            {
                task: `${baseTask} - Cross-agent validation`,
                focus_areas: [dimension, 'cross_validation', 'quality_assurance'],
                output_format: 'validated analysis',
                team_context: `Team members must validate each other's work`,
                dimension: dimension,
                generated_by: 'structured',
                team_name: team.name,
                team_capabilities: teamCapabilities
            },
            {
                task: `${baseTask} - Coordinated problem solving`,
                focus_areas: [dimension, 'problem_solving', 'team_efficiency'],
                output_format: 'solution framework',
                team_context: `Complex problem requiring coordinated team approach`,
                dimension: dimension,
                generated_by: 'structured',
                team_name: team.name,
                team_capabilities: teamCapabilities
            }
        ];
    }
    /**
     * Normalize evaluation criteria to EvaluationCriterion[] format
     * Converts old string[] format to new EvaluationCriterion[] format while preserving all fields
     */
    normalizeCriteria(criteria) {
        // Return empty if no criteria (caller must handle this)
        if (!criteria || (Array.isArray(criteria) && criteria.length === 0)) {
            return [];
        }
        // If already in new format with objects, return as-is (preserves all fields)
        if (Array.isArray(criteria) && criteria.length > 0 && typeof criteria[0] === 'object' && criteria[0].criterion) {
            return criteria;
        }
        // Convert old string[] format to new format (basic criterion only)
        if (Array.isArray(criteria) && criteria.length > 0 && typeof criteria[0] === 'string') {
            return criteria.map((c) => ({ criterion: c }));
        }
        return [];
    }
    /**
     * Generate evaluation criteria for teams (team-specific, not agent criteria)
     * Returns EvaluationCriterion[] for new format
     *
     * Now uses generic team criteria - dimension-specific evaluation comes from
     * dimension definition files which are already used in LLM evaluation.
     */
    generateTeamEvaluationCriteria(team, dimension) {
        const teamSize = team.composition?.memberCount || 'multiple';
        const teamProcess = team.composition?.process || 'unknown';
        // Generic team criteria that apply to all dimensions
        // Dimension-specific evaluation logic comes from dimension definition files
        const criteriaStrings = [
            `The team of ${teamSize} agents should provide a coherent, well-structured response`,
            `The output should demonstrate clear collaboration and coordination between team members`,
            `The response should show evidence of multi-agent coordination and task distribution`,
            `The team should leverage the strengths of multiple agents working together`,
            `The output quality should exceed what a single agent could produce alone`,
            `The ${teamProcess} process should be executed properly`,
            `The team should demonstrate effective coordination and task distribution`,
            `The combined output should show value from multi-agent collaboration`
        ];
        // Convert to EvaluationCriterion format
        return criteriaStrings.map(criterion => ({ criterion }));
    }
    /**
     * Run a single test with direct state management
     */
    async runSingleTest(testSpec, adapter, context) {
        const testId = testSpec.id;
        // Direct state management like test script - include evaluation criteria
        const normalizedCriteria = this.normalizeCriteria(testSpec.evaluation_criteria || testSpec.evaluationCriteria);
        // Extract eval description from first criterion if available
        const firstCriterion = normalizedCriteria[0];
        const evalDescription = firstCriterion?.ui_description || 'Evaluating test result';
        this.testStateManager.updateTest(testId, {
            status: 'running',
            evaluationCriteria: normalizedCriteria.map(c => c.criterion), // Store as string[] for state manager
            testDescription: testSpec.ui_description, // Load from test spec
            evalDescription: evalDescription, // From first criterion
        });
        try {
            // Execute test using adapter's simple interface
            const result = await this.executeTest(testSpec, adapter, context);
            // Update state with execution result
            this.testStateManager.updateTest(testId, {
                status: 'completed',
                result: result.output,
                latencyMs: result.latencyMs,
                endTime: new Date()
            });
            // Handle parent test status for multi-run tests
            if (testSpec.metadata?.runIndex !== undefined) {
                const parentId = testId.replace(/-run\d+$/, '');
                this.testStateManager.checkAndUpdateParentTestStatus(parentId);
            }
            // Queue LLM evaluation with concurrency control
            if (this.shouldEvaluateTest(testSpec)) {
                this.queueLLMEvaluation(testSpec, result, context);
            }
        }
        catch (error) {
            const errorMessage = error.message;
            this.testStateManager.updateTest(testId, {
                status: 'failed',
                error: errorMessage,
                endTime: new Date()
            });
            // Check parent test status even for failed runs
            if (testSpec.metadata?.runIndex !== undefined) {
                const parentId = testId.replace(/-run\d+$/, '');
                this.testStateManager.checkAndUpdateParentTestStatus(parentId);
            }
            context.splitPane?.addLog(`❌ Test ${testId} failed: ${errorMessage}`, 'error');
        }
    }
    /**
     * Execute test using adapter's simple interface
     */
    async executeTest(testSpec, adapter, context) {
        const startTime = Date.now();
        // Check cache first
        if (context.cache) {
            const cacheKey = this.generateCacheKey(testSpec);
            const cached = await context.cache.get(cacheKey);
            if (cached) {
                context.splitPane?.addLog(`💾 Cache hit for test ${testSpec.id}`, 'info');
                context.splitPane?.updateMetrics(false, true); // Cache hit
                return {
                    output: cached.output,
                    latencyMs: cached.latencyMs || 100,
                    success: true
                };
            }
        }
        // Record API call
        context.splitPane?.updateMetrics(true, false); // API call made
        // Execute using simplified adapter interface
        const output = await this.executeWithAdapter(testSpec, adapter, context);
        const latencyMs = Date.now() - startTime;
        // Cache the result
        if (context.cache) {
            const cacheKey = this.generateCacheKey(testSpec);
            await context.cache.set(cacheKey, { output, latencyMs });
        }
        return { output, latencyMs, success: true };
    }
    /**
     * Execute test using adapter - simplified interface
     */
    async executeWithAdapter(testSpec, adapter, context) {
        // Use the adapter's direct execution method
        if ('executeTest' in adapter && typeof adapter.executeTest === 'function') {
            context.splitPane?.addLog(`🚀 Using direct executeTest method for ${testSpec.id}`, 'debug');
            return await adapter.executeTest(testSpec, {
                projectPath: context.projectPath,
                timeoutMs: this.config.timeoutMs,
                splitPane: context.splitPane
            });
        }
        // If no direct execution method, throw error instead of falling back
        throw new Error(`Adapter ${adapter.name} does not support direct execution. Please implement executeTest method.`);
    }
    /**
     * Queue LLM evaluation with concurrency control
     */
    queueLLMEvaluation(testSpec, result, context) {
        if (!this.llmProvider) {
            return; // Skip evaluation if no LLM provider
        }
        const evaluationTask = async () => {
            await this.evaluateTest(testSpec, result, context);
        };
        // Add to queue
        this.llmEvaluationQueue.push(evaluationTask);
        // Process queue with concurrency control
        this.processLLMEvaluationQueue(context);
    }
    /**
     * Process LLM evaluation queue with concurrency control
     */
    processLLMEvaluationQueue(context) {
        // Start evaluations up to max concurrent LLM calls
        while (this.llmEvaluationQueue.length > 0 &&
            this.activeLLMEvaluations.size < this.config.maxLLMCalls) {
            const evaluationTask = this.llmEvaluationQueue.shift();
            const evaluationPromise = evaluationTask()
                .finally(() => {
                this.activeLLMEvaluations.delete(evaluationPromise);
                // Process more evaluations when one completes
                this.processLLMEvaluationQueue(context);
            });
            this.activeLLMEvaluations.add(evaluationPromise);
        }
    }
    /**
     * LLM evaluation with proper state management
     * UPDATED: Load dimension config from eval.config.yml and dimension definition for prompts
     */
    async evaluateTest(testSpec, result, context) {
        if (!this.llmProvider) {
            return; // Skip evaluation if no LLM provider
        }
        const testId = testSpec.id;
        let evaluationTestId = testId;
        // For multi-run tests, evaluate the parent test
        if (testSpec.metadata?.runIndex !== undefined) {
            evaluationTestId = testId.replace(/-run\d+$/, '');
            // Transition parent to evaluating
            this.testStateManager.transitionParentToEvaluating(evaluationTestId);
        }
        else {
            // Single test - transition to evaluating
            this.testStateManager.updateTest(testId, { status: 'evaluating' });
        }
        try {
            context.splitPane?.addLog(`🧠 Evaluating test ${evaluationTestId}...`, 'info');
            // Collect all outputs for multi-run tests
            let evaluationInput;
            let evaluationOutput;
            if (testSpec.metadata?.runIndex !== undefined) {
                // Multi-run test - collect all run outputs
                const parentId = testId.replace(/-run\d+$/, '');
                const allTests = this.testStateManager.getAllTests();
                const runs = allTests.filter(t => t.id.startsWith(parentId + '-run'));
                evaluationInput = testSpec.input;
                evaluationOutput = runs.map(run => run.result).filter(Boolean);
            }
            else {
                // Single test
                evaluationInput = testSpec.input;
                evaluationOutput = result.output;
            }
            // NEW: Load dimension settings from eval.config.yml (for evaluation defaults)
            const dimensionConfig = this.configManager?.getDimensionSettings(testSpec.dimension || 'consistency') || {
                default_strictness: 85,
                passing_criteria_percentage: 100,
            };
            // NEW: Load dimension definition (for evaluation prompts)
            let dimensionDefinition;
            if (this.dimensionRegistry && testSpec.dimension) {
                try {
                    dimensionDefinition = await this.dimensionRegistry.getDimension(testSpec.dimension);
                }
                catch (error) {
                    context.splitPane?.addLog(`⚠️ Could not load dimension definition for ${testSpec.dimension}`, 'warning');
                }
            }
            // Create team-aware contract for LLM evaluation
            const isTeamTest = testSpec.metadata?.isTeamTest || testSpec.id.startsWith('team-');
            const entityType = isTeamTest ? 'Team' : 'Agent';
            const entityName = testSpec.agent?.name || 'Unknown';
            const evaluationContract = {
                description: isTeamTest
                    ? `TEAM evaluation for ${entityName} - This is a TEAM of multiple AI agents working together, not a single agent. Teams coordinate between agents, handle complex multi-step tasks, and demonstrate collaboration.`
                    : `${entityName} agent test evaluation`,
                capabilities: [],
                confidence: 0.8,
                extractedFrom: ['test-spec'],
                metadata: {
                    isTeam: isTeamTest,
                    entityType: entityType,
                    teamContext: isTeamTest ? `Multi-agent team requiring coordination and collaboration` : undefined
                }
            };
            // NEW: Updated evaluation request with separated config and prompts
            const normalizedCriteria = this.normalizeCriteria(testSpec.evaluation_criteria || testSpec.evaluationCriteria);
            // ERROR if no criteria - fail fast instead of using fallbacks
            if (normalizedCriteria.length === 0) {
                throw new Error(`No evaluation criteria found for test ${testId}. LLM must generate evaluation_criteria - fallbacks not allowed.`);
            }
            const evaluation = await this.llmProvider.evaluateTestResult({
                input: evaluationInput,
                output: evaluationOutput,
                dimension: testSpec.dimension || 'consistency',
                criteria: normalizedCriteria,
                contract: evaluationContract,
                dimension_config: dimensionConfig, // From eval.config.yml
                dimension_definition: dimensionDefinition, // For prompts only
                thresholds: testSpec.thresholds // Test-level overrides (already in schema)
            });
            // Update test with evaluation results
            const success = evaluation.passed !== false; // Default to true unless explicitly false
            // Extract UI explanation and failed criterion from evaluation
            const uiExplanation = evaluation.ui_explanation;
            const failedCriterion = success ? undefined : this.extractFailedCriterion(evaluation);
            if (testSpec.metadata?.runIndex !== undefined) {
                // Complete parent test evaluation with LLM results
                this.testStateManager.completeParentTestEvaluation(evaluationTestId, success, {
                    llmEvaluation: evaluation,
                    output: result.output
                });
                // Also update with UI descriptions
                if (uiExplanation || failedCriterion) {
                    this.testStateManager.updateTest(evaluationTestId, {
                        resultExplanation: uiExplanation,
                        failedCriterion: failedCriterion
                    });
                }
            }
            else {
                // Complete single test with LLM results
                this.testStateManager.updateTest(testId, {
                    status: success ? 'completed' : 'failed',
                    llmTokensUsed: evaluation.tokenUsage || 0,
                    llmEvaluation: evaluation, // Store LLM evaluation with criterion-level details
                    evaluationEndTime: new Date(),
                    resultExplanation: uiExplanation, // UI-friendly explanation
                    failedCriterion: failedCriterion, // First failed criterion text
                });
            }
            context.splitPane?.addLog(`✅ Evaluation completed for ${evaluationTestId}: ${success ? 'PASSED' : 'FAILED'}`, success ? 'success' : 'error');
        }
        catch (error) {
            const errorMessage = error.message;
            if (testSpec.metadata?.runIndex !== undefined) {
                this.testStateManager.completeParentTestEvaluation(evaluationTestId, false, {
                    error: errorMessage
                });
            }
            else {
                this.testStateManager.updateTest(testId, {
                    status: 'failed',
                    error: `Evaluation failed: ${errorMessage}`,
                    evaluationEndTime: new Date()
                });
            }
            context.splitPane?.addLog(`❌ Evaluation failed for ${evaluationTestId}: ${errorMessage}`, 'error');
        }
    }
    /**
     * Determine if a test should be evaluated
     */
    shouldEvaluateTest(testSpec) {
        // Single tests should be evaluated immediately
        if (testSpec.metadata?.runIndex === undefined) {
            return true;
        }
        // Multi-run tests: only evaluate when it's the last run of a parent test
        const parentId = testSpec.id.replace(/-run\d+$/, '');
        const allTests = this.testStateManager.getAllTests();
        const runs = allTests.filter(t => t.id.startsWith(parentId + '-run'));
        const completedRuns = runs.filter(t => t.status === 'completed' || t.status === 'failed');
        const expectedRuns = testSpec.metadata?.totalRuns || 3;
        return completedRuns.length >= expectedRuns;
    }
    /**
     * Generate cache key for test
     */
    generateCacheKey(testSpec) {
        const agentName = testSpec.agent?.name || 'unknown';
        const runSuffix = testSpec.metadata?.runIndex !== undefined ? `-run${testSpec.metadata.runIndex}` : '';
        return `${agentName}-${testSpec.dimension}-${JSON.stringify(testSpec.input)}${runSuffix}`;
    }
    /**
     * Extract the first failed criterion text from evaluation result
     */
    extractFailedCriterion(evaluation) {
        try {
            // Check if evaluation has structured reasoning with criterion analysis
            if (evaluation.reasoning && typeof evaluation.reasoning === 'object') {
                const criterionAnalysis = evaluation.reasoning.criterionAnalysis;
                if (Array.isArray(criterionAnalysis)) {
                    const failedCriteria = criterionAnalysis.filter((c) => !c.met);
                    if (failedCriteria.length > 0) {
                        return failedCriteria[0].criterion;
                    }
                }
            }
            // Fallback: try to extract from issues
            if (evaluation.issues && Array.isArray(evaluation.issues) && evaluation.issues.length > 0) {
                const firstIssue = evaluation.issues[0];
                if (firstIssue.message) {
                    // Remove "Criterion failed: " prefix if present
                    return firstIssue.message.replace(/^Criterion failed:\s*/, '');
                }
            }
        }
        catch (error) {
            console.warn('Failed to extract failed criterion:', error);
        }
        return undefined;
    }
}
exports.SimplifiedTestRunner = SimplifiedTestRunner;
//# sourceMappingURL=simplified-test-runner.js.map