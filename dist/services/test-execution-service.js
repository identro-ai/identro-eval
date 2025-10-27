/**
 * Test Execution Service - Unified test execution logic
 *
 * Extracts test execution functionality from interactive mode to be shared
 * between interactive and standalone commands.
 */
import * as path from 'path';
import { loadConfig } from '../utils/config';
import { TestStateManager } from '../utils/test-state-manager';
import { SimplifiedTestRunner } from '../utils/simplified-test-runner';
import { SplitPaneDisplay } from '../utils/split-pane-display';
import { DefaultDimensionRegistry, createDimensionMetadataService } from '@identro/eval-core';
export class TestExecutionService {
    /**
     * Execute tests using SimplifiedTestRunner
     */
    async executeTests(options) {
        const { projectPath, entityNames, dimensions, llmConfig, splitPane = false, maxConcurrency = 5, generateMissing = false, onProgress, onTestComplete, onError } = options;
        const startTime = Date.now();
        try {
            // Load configuration
            const configPath = path.join(projectPath, '.identro', 'eval.config.yml');
            const config = await loadConfig(configPath);
            // Initialize adapters and services
            const { CrewAIAdapter } = await import('@identro/eval-crewai');
            const { CacheService } = await import('../services/cache');
            const adapter = new CrewAIAdapter();
            const cache = new CacheService();
            // Create test state manager
            const testStateManager = new TestStateManager();
            // Initialize split-pane display if requested
            let splitPaneDisplay;
            if (splitPane) {
                splitPaneDisplay = new SplitPaneDisplay(testStateManager, maxConcurrency);
                splitPaneDisplay.initialize();
            }
            // Create LLM provider if configured
            let llmProvider = null;
            if (llmConfig) {
                llmProvider = await this.initializeLLMProvider(llmConfig);
                if (splitPaneDisplay) {
                    splitPaneDisplay.addLog('🧠 Initialized LLM provider for evaluation', 'info');
                }
            }
            // Create SimplifiedTestRunner
            const simplifiedTestRunner = new SimplifiedTestRunner(testStateManager, llmProvider, {
                maxConcurrency,
                maxLLMCalls: config?.llm?.max_concurrent_llm_calls || 3,
                timeoutMs: config?.performance?.testTimeoutMs || 60000,
                retryEnabled: config?.performance?.retryEnabled ?? true,
                maxRetries: config?.performance?.maxRetries || 2,
                retryDelayMs: config?.performance?.retryDelayMs || 2000
            });
            if (splitPaneDisplay) {
                splitPaneDisplay.addLog('🚀 Initialized SimplifiedTestRunner', 'info');
            }
            // Load and validate test specifications
            const { EvalSpecManager, TestSpecLoader } = await import('@identro/eval-core');
            const specManager = new EvalSpecManager(projectPath);
            const evalSpec = await specManager.load();
            const testSpecLoader = new TestSpecLoader();
            // Determine entities to test
            const allEntities = Object.keys(evalSpec.agents || {});
            const selectedEntities = entityNames || allEntities;
            if (selectedEntities.length === 0) {
                throw new Error('No entities found to test');
            }
            // Determine dimensions to test - load dynamically
            const dimensionRegistry = new DefaultDimensionRegistry();
            await dimensionRegistry.loadDimensionDefinitions(projectPath);
            const allDimensions = await dimensionRegistry.getAvailableDimensions();
            const selectedDimensions = dimensions || allDimensions;
            const metadataService = createDimensionMetadataService(dimensionRegistry);
            // Generate missing tests if requested
            if (generateMissing) {
                await this.generateMissingTests(projectPath, selectedEntities, selectedDimensions, llmConfig, splitPaneDisplay);
                // Reload eval spec after generation
                const updatedEvalSpec = await specManager.load();
                Object.assign(evalSpec, updatedEvalSpec);
            }
            // Validate test specifications exist
            const validation = testSpecLoader.validateTestSpecs(evalSpec, selectedEntities, selectedDimensions);
            if (!validation.valid) {
                const errorMsg = `Missing test specifications: ${validation.missing.map(m => `${m.agent}-${m.dimension}`).join(', ')}`;
                if (splitPaneDisplay) {
                    splitPaneDisplay.addLog(`❌ ${errorMsg}`, 'error');
                }
                throw new Error(errorMsg);
            }
            // Load test specifications
            const loadedTests = await testSpecLoader.loadTestsFromSpec(evalSpec, selectedEntities, selectedDimensions);
            if (splitPaneDisplay) {
                splitPaneDisplay.addLog(`📋 Loaded ${loadedTests.testSpecs.length} test specifications`, 'info');
                splitPaneDisplay.addLog(`📊 Test breakdown: ${loadedTests.metadata.agentCount} entities, ${loadedTests.metadata.dimensionCount} dimensions`, 'info');
            }
            if (loadedTests.testSpecs.length === 0) {
                throw new Error('No tests found for selected entities and dimensions');
            }
            // Pre-create all tests in StateManager
            if (splitPaneDisplay) {
                splitPaneDisplay.addLog('🔧 Pre-creating tests in StateManager...', 'info');
            }
            for (const testSpec of loadedTests.testSpecs) {
                const entityName = testSpec.agent?.name || testSpec.metadata?.agentName || 'unknown';
                const dimension = testSpec.dimension;
                const inputIndex = testSpec.metadata?.inputIndex || 0;
                const input = testSpec.input;
                const runIndex = testSpec.metadata?.runIndex;
                testStateManager.createTestWithId(testSpec.id, entityName, dimension, inputIndex, input, runIndex);
                // Mark parent tests appropriately
                if (testSpec.metadata?.isParentTest) {
                    testStateManager.updateTest(testSpec.id, {
                        isMultiRun: true,
                        isParentTest: true,
                        visibleInQueue: false,
                        totalRuns: testSpec.metadata.totalRuns || 3,
                        completedRuns: 0
                    });
                }
            }
            const allTests = testStateManager.getAllTests();
            if (splitPaneDisplay) {
                splitPaneDisplay.addLog(`✅ Pre-created ${allTests.length} tests in StateManager`, 'info');
            }
            // Execute tests using SimplifiedTestRunner
            await simplifiedTestRunner.runAllTests(loadedTests.testSpecs, adapter, {
                projectPath,
                cache,
                splitPane: splitPaneDisplay ? {
                    addLog: (message, level) => splitPaneDisplay?.addLog(message, level),
                    updateMetrics: (apiCall, cacheHit) => splitPaneDisplay?.updateMetrics(apiCall, cacheHit)
                } : undefined
            });
            // Build results from TestStateManager
            const results = await this.buildResultsFromStateManager(testStateManager, selectedEntities, metadataService);
            // Calculate totals
            let totalTests = 0;
            let totalPassed = 0;
            let totalFailed = 0;
            for (const [_, result] of results) {
                totalTests += result.summary.totalTests;
                totalPassed += result.summary.passed;
                totalFailed += result.summary.failed;
            }
            const duration = Date.now() - startTime;
            const successRate = totalTests > 0 ? totalPassed / totalTests : 0;
            if (splitPaneDisplay) {
                splitPaneDisplay.addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
                splitPaneDisplay.addLog('All tests completed! 🎉', 'success');
                splitPaneDisplay.addLog(`📊 Final Results: ${totalPassed}/${totalTests} passed (${(successRate * 100).toFixed(1)}% success rate)`, successRate >= 0.8 ? 'success' : successRate >= 0.6 ? 'warning' : 'error');
                // Stop split-pane display
                splitPaneDisplay.stop();
            }
            // Call progress callback
            onProgress?.(totalTests, totalTests);
            return {
                results,
                totalTests,
                totalPassed,
                totalFailed,
                successRate,
                duration,
                testStateManager
            };
        }
        catch (error) {
            onError?.(error);
            throw error;
        }
    }
    /**
     * Generate missing tests before execution
     */
    async generateMissingTests(projectPath, entityNames, dimensions, llmConfig, splitPaneDisplay) {
        if (!llmConfig) {
            throw new Error('LLM configuration required for test generation');
        }
        if (splitPaneDisplay) {
            splitPaneDisplay.addLog('🧠 Generating missing tests...', 'info');
        }
        const { TestGenerationService } = await import('./test-generation-service');
        const testGenService = new TestGenerationService();
        // Load eval spec to get entity information
        const { EvalSpecManager } = await import('@identro/eval-core');
        const specManager = new EvalSpecManager(projectPath);
        const evalSpec = await specManager.load();
        // Build entities array
        const entities = entityNames.map(name => {
            const entity = evalSpec.agents[name];
            const entityType = entity?.contract?.metadata?.isTeam ? 'team' : 'agent';
            return {
                name,
                type: entityType,
                originalEntity: entity
            };
        });
        // Generate tests
        const result = await testGenService.generateTests({
            projectPath,
            entities,
            dimensions,
            llmConfig,
            onProgress: (completed, total, currentTask) => {
                if (splitPaneDisplay && currentTask) {
                    splitPaneDisplay.addLog(`⚡ ${currentTask}`, 'info');
                }
            },
            onTaskComplete: (taskName, duration) => {
                if (splitPaneDisplay) {
                    splitPaneDisplay.addLog(`✅ ${taskName} (${duration}ms)`, 'success');
                }
            },
            onTaskError: (taskName, error) => {
                if (splitPaneDisplay) {
                    splitPaneDisplay.addLog(`❌ ${taskName}: ${error.message}`, 'error');
                }
            }
        });
        if (splitPaneDisplay) {
            splitPaneDisplay.addLog(`✅ Generated ${result.totalTestsGenerated} tests (${result.successfulTasks}/${result.totalTasks} tasks successful)`, 'success');
        }
    }
    /**
     * Initialize LLM provider from config
     */
    async initializeLLMProvider(llmConfig) {
        if (!llmConfig) {
            return null;
        }
        // Initialize dimension registry for LLM provider
        const { DefaultDimensionRegistry } = await import('@identro/eval-core');
        const dimensionRegistry = new DefaultDimensionRegistry();
        if (llmConfig.provider === 'openai') {
            const { OpenAIProvider } = await import('@identro/eval-core');
            const apiKey = llmConfig.apiKey || process.env.OPENAI_API_KEY || process.env[llmConfig.apiKeyEnv];
            if (!apiKey) {
                throw new Error('OpenAI API key not found. Please ensure OPENAI_API_KEY is set.');
            }
            return new OpenAIProvider({
                apiKey,
                model: llmConfig.model || 'gpt-4-turbo-preview',
            }, dimensionRegistry);
        }
        else if (llmConfig.provider === 'anthropic') {
            const { AnthropicProvider } = await import('@identro/eval-core');
            const apiKey = llmConfig.apiKey || process.env.ANTHROPIC_API_KEY || process.env[llmConfig.apiKeyEnv];
            if (!apiKey) {
                throw new Error('Anthropic API key not found. Please set ANTHROPIC_API_KEY environment variable.');
            }
            return new AnthropicProvider({
                apiKey,
                model: llmConfig.model || 'claude-3-opus-20240229',
            }, dimensionRegistry);
        }
        return null;
    }
    /**
     * Build TestResults from TestStateManager data
     */
    async buildResultsFromStateManager(testStateManager, entityNames, metadataService) {
        const results = new Map();
        const completedTests = testStateManager.getAllTests().filter(test => test.status === 'completed' || test.status === 'failed');
        // Group data by entity
        const entityData = new Map();
        for (const test of completedTests) {
            const entityName = test.agentName;
            if (!entityData.has(entityName)) {
                entityData.set(entityName, {
                    tests: new Map(),
                    runs: [],
                    dimensions: new Set()
                });
            }
            const entity = entityData.get(entityName);
            entity.runs.push({
                input: test.input,
                output: test.result,
                latencyMs: test.latencyMs || 0,
                success: test.status === 'completed',
                error: test.error
            });
            // Group runs by test
            const testId = `${test.dimension}-${test.inputIndex}`;
            if (!entity.tests.has(testId)) {
                entity.tests.set(testId, []);
            }
            entity.tests.get(testId).push({
                input: test.input,
                output: test.result,
                latencyMs: test.latencyMs || 0,
                success: test.status === 'completed',
                error: test.error,
                dimension: test.dimension
            });
            entity.dimensions.add(test.dimension);
        }
        // Build TestResults for each entity
        for (const entityName of entityNames) {
            const entity = entityData.get(entityName);
            if (!entity)
                continue;
            const actualTestCount = entity.tests.size;
            const totalRuns = entity.runs.length;
            // Count passed/failed tests
            let passedTests = 0;
            let failedTests = 0;
            for (const [testId, runs] of entity.tests) {
                const passedRuns = runs.filter(r => r.success).length;
                const testPassed = passedRuns > runs.length / 2; // Majority rule
                if (testPassed) {
                    passedTests++;
                }
                else {
                    failedTests++;
                }
            }
            let totalLatency = 0;
            for (const run of entity.runs) {
                totalLatency += run.latencyMs;
            }
            // Build dimension data
            const dimensions = {};
            for (const dimension of entity.dimensions) {
                const dimensionTests = Array.from(entity.tests.entries()).filter(([testId, runs]) => runs[0].dimension === dimension);
                const dimensionTestCount = dimensionTests.length;
                const dimensionPassedTests = dimensionTests.filter(([_, runs]) => {
                    const passedRuns = runs.filter(r => r.success).length;
                    return passedRuns > runs.length / 2;
                }).length;
                // Build dimension-specific metrics dynamically
                const dimensionMetrics = {};
                // Check if dimension supports multi-run (for consistency-type metrics)
                const supportsMultiRun = await metadataService.supportsMultiRun(dimension);
                if (supportsMultiRun) {
                    dimensionMetrics.isConsistent = dimensionPassedTests === dimensionTestCount;
                    dimensionMetrics.outputVariance = 1 - dimensionPassedTests / dimensionTestCount;
                    dimensionMetrics.confidence = dimensionPassedTests / dimensionTestCount;
                }
                // Add generic metrics for all dimensions
                dimensionMetrics.score = dimensionPassedTests / dimensionTestCount;
                dimensionMetrics.passedTests = dimensionPassedTests;
                dimensionMetrics.totalTests = dimensionTestCount;
                dimensions[dimension] = dimensionMetrics;
            }
            const testResult = {
                agentId: entityName,
                timestamp: new Date(),
                tests: entity.runs,
                dimensions: dimensions,
                summary: {
                    totalTests: actualTestCount,
                    passed: passedTests,
                    failed: failedTests,
                    averageLatencyMs: totalRuns > 0 ? totalLatency / totalRuns : 0,
                    successRate: actualTestCount > 0 ? passedTests / actualTestCount : 0
                }
            };
            results.set(entityName, testResult);
        }
        return results;
    }
    /**
     * Get execution summary for display
     */
    getExecutionSummary(result) {
        let totalLatency = 0;
        let totalRuns = 0;
        for (const [_, testResult] of result.results) {
            totalLatency += testResult.summary.averageLatencyMs * testResult.tests.length;
            totalRuns += testResult.tests.length;
        }
        return {
            successRate: result.successRate,
            averageLatency: totalRuns > 0 ? totalLatency / totalRuns : 0,
            totalDuration: result.duration,
            entitiesTested: result.results.size,
            hasFailures: result.totalFailed > 0
        };
    }
}
//# sourceMappingURL=test-execution-service.js.map