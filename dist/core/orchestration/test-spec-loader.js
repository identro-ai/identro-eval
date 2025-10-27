/**
 * Test Specification Loader
 *
 * Loads pre-generated test specifications from eval-spec.json files
 * and converts them to TestSpec format for execution orchestration.
 *
 * This component bridges the gap between the analysis phase (where tests
 * are generated and saved) and the execution phase (where tests are run).
 */
export class TestSpecLoader {
    metadataService;
    /**
     * Set dimension metadata service for dynamic multi-run detection
     */
    setMetadataService(service) {
        this.metadataService = service;
    }
    /**
     * Check if a dimension supports multi-run based on test config or dimension metadata
     */
    async supportsMultiRun(test, dimension) {
        // Primary: check test-level multiRun config
        if (test.multiRun?.enabled !== undefined) {
            return test.multiRun.enabled;
        }
        // Secondary: check dimension metadata service
        if (this.metadataService) {
            try {
                return await this.metadataService.supportsMultiRun(dimension);
            }
            catch (error) {
                // Fall through to default
            }
        }
        // Final fallback: single run
        return false;
    }
    /**
     * Get default run count for a dimension
     */
    async getDefaultRunCount(test, dimension) {
        // Primary: check test-level multiRun config
        if (test.multiRun?.runCount) {
            return test.multiRun.runCount;
        }
        // Secondary: check dimension metadata service
        if (this.metadataService) {
            try {
                return await this.metadataService.getDefaultRunCount(dimension);
            }
            catch (error) {
                // Fall through to default
            }
        }
        // Final fallback
        return 1;
    }
    /**
     * Normalize input by extracting from nested structures if needed
     */
    normalizeInput(input) {
        // Handle the old nested structure with actual_input_to_agent
        if (input && typeof input === 'object' && input.actual_input_to_agent) {
            return input.actual_input_to_agent;
        }
        // Return input as-is if it's already normalized
        return input;
    }
    /**
     * Generate run IDs for multi-run tests based on parent test ID
     */
    generateRunIds(parentTestId, runCount) {
        const runIds = [];
        for (let i = 0; i < runCount; i++) {
            runIds.push(`${parentTestId}-run${i}`);
        }
        return runIds;
    }
    /**
     * Load agent test specifications from eval-spec.json
     */
    async loadAgentTests(agents, selectedAgents, selectedDimensions) {
        const testSpecs = [];
        const generatedBy = new Set();
        let multiRunCount = 0;
        // Process each selected agent
        for (const agentName of selectedAgents) {
            const agentSpec = agents[agentName];
            if (!agentSpec || !agentSpec.testSpecs) {
                console.warn(`No test specs found for agent: ${agentName}`);
                continue;
            }
            // Process each selected dimension for this agent
            for (const dimension of selectedDimensions) {
                const dimensionSpecs = agentSpec.testSpecs[dimension];
                if (!dimensionSpecs || !dimensionSpecs.tests) {
                    console.warn(`No ${dimension} tests found for agent: ${agentName}`);
                    continue;
                }
                // Track who generated these tests
                if (dimensionSpecs.generatedBy) {
                    generatedBy.add(dimensionSpecs.generatedBy);
                }
                // Convert each test to TestSpec format
                for (let i = 0; i < dimensionSpecs.tests.length; i++) {
                    const test = dimensionSpecs.tests[i];
                    // Normalize input to handle nested structures
                    const normalizedInput = this.normalizeInput(test.input);
                    // Determine if this is a multi-run test (dynamic check)
                    const isMultiRun = await this.supportsMultiRun(test, dimension);
                    const runCount = await this.getDefaultRunCount(test, dimension);
                    if (isMultiRun) {
                        multiRunCount++;
                        // Use the exact ID from eval-spec.json (no modification)
                        const parentTestId = test.id;
                        if (!parentTestId) {
                            console.warn(`Multi-run test missing ID for ${agentName}-${dimension}-${i}`);
                            continue;
                        }
                        // Generate run IDs based on parent test ID
                        const runIds = this.generateRunIds(parentTestId, runCount);
                        // Create multi-run configuration with pre-generated run IDs
                        const runType = test.multiRun?.runType;
                        const aggregationStrategy = test.multiRun?.aggregationStrategy;
                        const executionMode = test.multiRun?.executionMode;
                        const multiRunConfig = {
                            runCount: runCount,
                            runType: (runType === 'variations' || runType === 'identical') ? runType : 'identical',
                            aggregationStrategy: (aggregationStrategy === 'compare' || aggregationStrategy === 'statistical' || aggregationStrategy === 'sequential') ? aggregationStrategy : 'compare',
                            executionMode: (executionMode === 'parallel' || executionMode === 'sequential') ? executionMode : 'parallel',
                            inputVariations: test.multiRun?.inputVariations,
                        };
                        // Create individual TestSpecs for each run (for execution tracking)
                        for (let runIndex = 0; runIndex < runCount; runIndex++) {
                            const runTestSpec = {
                                id: runIds[runIndex], // Use pre-generated run ID
                                dimension: dimension, // Use dimension as-is from eval-spec
                                input: normalizedInput,
                                expected: test.expected,
                                ui_description: test.ui_description, // ✅ CRITICAL: Preserve ui_description from eval-spec.json
                                evaluationCriteria: test.evaluation_criteria || test.evaluationCriteria || [],
                                multiRun: undefined, // Individual runs don't have multiRun config
                                agent: {
                                    id: agentName,
                                    name: agentName,
                                    framework: 'unknown',
                                },
                                metadata: {
                                    inputIndex: i,
                                    dimension: dimension,
                                    agentName: agentName,
                                    generatedBy: dimensionSpecs.generatedBy || 'unknown',
                                    testName: test.name || `${dimension} test ${i + 1}`,
                                    rationale: test.name,
                                    category: dimension,
                                    priority: test.priority || 2,
                                    expectedBehavior: test.expected,
                                    totalRuns: runCount,
                                    isMultiRun: false, // Individual runs are not multi-run
                                    originalTestIndex: i,
                                    loadedFromSpec: true,
                                    specGenerated: dimensionSpecs.generated,
                                    parentTestId: parentTestId, // Link to parent test
                                    runIndex: runIndex, // Track which run this is
                                },
                                priority: test.priority || 2,
                            };
                            testSpecs.push(runTestSpec);
                        }
                        // Also create the parent test spec for evaluation tracking
                        const parentTestSpec = {
                            id: parentTestId, // Use exact ID from eval-spec.json
                            dimension: dimension,
                            input: normalizedInput,
                            expected: test.expected,
                            ui_description: test.ui_description, // ✅ CRITICAL: Preserve ui_description from eval-spec.json
                            evaluationCriteria: test.evaluation_criteria || test.evaluationCriteria || [],
                            multiRun: multiRunConfig,
                            agent: {
                                id: agentName,
                                name: agentName,
                                framework: 'unknown',
                            },
                            metadata: {
                                inputIndex: i,
                                dimension: dimension,
                                agentName: agentName,
                                generatedBy: dimensionSpecs.generatedBy || 'unknown',
                                testName: test.name || `${dimension} test ${i + 1}`,
                                rationale: test.name,
                                category: dimension,
                                priority: test.priority || 2,
                                expectedBehavior: test.expected,
                                totalRuns: runCount,
                                isMultiRun: true,
                                originalTestIndex: i,
                                loadedFromSpec: true,
                                specGenerated: dimensionSpecs.generated,
                                isParentTest: true, // Mark as parent test
                            },
                            priority: test.priority || 2,
                        };
                        testSpecs.push(parentTestSpec);
                    }
                    else {
                        // Single run test - use exact ID from eval-spec.json
                        const testId = test.id;
                        if (!testId) {
                            console.warn(`Single test missing ID for ${agentName}-${dimension}-${i}`);
                            continue;
                        }
                        const testSpec = {
                            id: testId, // Use exact ID from eval-spec.json
                            dimension: dimension,
                            input: normalizedInput,
                            expected: test.expected,
                            ui_description: test.ui_description, // ✅ CRITICAL: Preserve ui_description from eval-spec.json
                            evaluationCriteria: test.evaluation_criteria || test.evaluationCriteria || [],
                            multiRun: undefined,
                            agent: {
                                id: agentName,
                                name: agentName,
                                framework: 'unknown',
                            },
                            metadata: {
                                inputIndex: i,
                                dimension: dimension,
                                agentName: agentName,
                                generatedBy: dimensionSpecs.generatedBy || 'unknown',
                                testName: test.name || `${dimension} test ${i + 1}`,
                                rationale: test.name,
                                category: dimension,
                                priority: test.priority || 2,
                                expectedBehavior: test.expected,
                                totalRuns: 1,
                                isMultiRun: false,
                                originalTestIndex: i,
                                loadedFromSpec: true,
                                specGenerated: dimensionSpecs.generated,
                            },
                            priority: test.priority || 2,
                        };
                        testSpecs.push(testSpec);
                    }
                }
            }
        }
        return {
            testSpecs,
            metadata: {
                totalTests: testSpecs.length,
                agentCount: selectedAgents.length,
                dimensionCount: selectedDimensions.length,
                multiRunTests: multiRunCount,
                generatedBy: Array.from(generatedBy),
            },
        };
    }
    /**
     * Load team test specifications from eval-spec.json
     */
    async loadTeamTests(teams, selectedTeams, selectedDimensions) {
        const testSpecs = [];
        const generatedBy = new Set();
        let multiRunCount = 0;
        // Process each selected team
        for (const teamName of selectedTeams) {
            const teamSpec = teams[teamName];
            if (!teamSpec || !teamSpec.testSpecs) {
                console.warn(`No test specs found for team: ${teamName}`);
                continue;
            }
            // Process each selected dimension for this team
            for (const dimension of selectedDimensions) {
                const dimensionSpecs = teamSpec.testSpecs[dimension];
                if (!dimensionSpecs || !dimensionSpecs.tests) {
                    console.warn(`No ${dimension} tests found for team: ${teamName}`);
                    continue;
                }
                // Track who generated these tests
                if (dimensionSpecs.generatedBy) {
                    generatedBy.add(dimensionSpecs.generatedBy);
                }
                // Convert each test to TestSpec format (same logic as agents)
                for (let i = 0; i < dimensionSpecs.tests.length; i++) {
                    const test = dimensionSpecs.tests[i];
                    // Normalize input
                    const normalizedInput = this.normalizeInput(test.input);
                    // Determine if this is a multi-run test
                    const isMultiRun = test.multiRun?.enabled || dimension === 'consistency';
                    const runCount = test.multiRun?.runCount || (dimension === 'consistency' ? 3 : 1);
                    if (isMultiRun) {
                        multiRunCount++;
                        const parentTestId = test.id;
                        if (!parentTestId) {
                            console.warn(`Multi-run test missing ID for ${teamName}-${dimension}-${i}`);
                            continue;
                        }
                        const runIds = this.generateRunIds(parentTestId, runCount);
                        const runType = test.multiRun?.runType;
                        const aggregationStrategy = test.multiRun?.aggregationStrategy;
                        const executionMode = test.multiRun?.executionMode;
                        const multiRunConfig = {
                            runCount: runCount,
                            runType: (runType === 'variations' || runType === 'identical') ? runType : 'identical',
                            aggregationStrategy: (aggregationStrategy === 'compare' || aggregationStrategy === 'statistical' || aggregationStrategy === 'sequential') ? aggregationStrategy : 'compare',
                            executionMode: (executionMode === 'parallel' || executionMode === 'sequential') ? executionMode : 'parallel',
                            inputVariations: test.multiRun?.inputVariations,
                        };
                        // Create individual TestSpecs for each run
                        for (let runIndex = 0; runIndex < runCount; runIndex++) {
                            const runTestSpec = {
                                id: runIds[runIndex],
                                dimension: dimension,
                                input: normalizedInput,
                                expected: test.expected,
                                ui_description: test.ui_description, // ✅ CRITICAL: Preserve ui_description from eval-spec.json
                                evaluationCriteria: test.evaluation_criteria || test.evaluationCriteria || [],
                                multiRun: undefined,
                                agent: {
                                    id: teamName,
                                    name: teamName,
                                    framework: 'unknown',
                                },
                                metadata: {
                                    inputIndex: i,
                                    dimension: dimension,
                                    agentName: teamName,
                                    entityType: 'team', // Mark as team test
                                    generatedBy: dimensionSpecs.generatedBy || 'unknown',
                                    testName: test.name || `${dimension} test ${i + 1}`,
                                    rationale: test.name,
                                    category: dimension,
                                    priority: test.priority || 2,
                                    expectedBehavior: test.expected,
                                    totalRuns: runCount,
                                    isMultiRun: false,
                                    originalTestIndex: i,
                                    loadedFromSpec: true,
                                    specGenerated: dimensionSpecs.generated,
                                    parentTestId: parentTestId,
                                    runIndex: runIndex,
                                },
                                priority: test.priority || 2,
                            };
                            testSpecs.push(runTestSpec);
                        }
                        // Create parent test spec
                        const parentTestSpec = {
                            id: parentTestId,
                            dimension: dimension,
                            input: normalizedInput,
                            expected: test.expected,
                            ui_description: test.ui_description, // ✅ CRITICAL: Preserve ui_description from eval-spec.json
                            evaluationCriteria: test.evaluation_criteria || test.evaluationCriteria || [],
                            multiRun: multiRunConfig,
                            agent: {
                                id: teamName,
                                name: teamName,
                                framework: 'unknown',
                            },
                            metadata: {
                                inputIndex: i,
                                dimension: dimension,
                                agentName: teamName,
                                entityType: 'team', // Mark as team test
                                generatedBy: dimensionSpecs.generatedBy || 'unknown',
                                testName: test.name || `${dimension} test ${i + 1}`,
                                rationale: test.name,
                                category: dimension,
                                priority: test.priority || 2,
                                expectedBehavior: test.expected,
                                totalRuns: runCount,
                                isMultiRun: true,
                                originalTestIndex: i,
                                loadedFromSpec: true,
                                specGenerated: dimensionSpecs.generated,
                                isParentTest: true,
                            },
                            priority: test.priority || 2,
                        };
                        testSpecs.push(parentTestSpec);
                    }
                    else {
                        // Single run test
                        const testId = test.id;
                        if (!testId) {
                            console.warn(`Single test missing ID for ${teamName}-${dimension}-${i}`);
                            continue;
                        }
                        const testSpec = {
                            id: testId,
                            dimension: dimension,
                            input: normalizedInput,
                            expected: test.expected,
                            ui_description: test.ui_description, // ✅ CRITICAL: Preserve ui_description from eval-spec.json
                            evaluationCriteria: test.evaluation_criteria || test.evaluationCriteria || [],
                            multiRun: undefined,
                            agent: {
                                id: teamName,
                                name: teamName,
                                framework: 'unknown',
                            },
                            metadata: {
                                inputIndex: i,
                                dimension: dimension,
                                agentName: teamName,
                                entityType: 'team', // Mark as team test
                                generatedBy: dimensionSpecs.generatedBy || 'unknown',
                                testName: test.name || `${dimension} test ${i + 1}`,
                                rationale: test.name,
                                category: dimension,
                                priority: test.priority || 2,
                                expectedBehavior: test.expected,
                                totalRuns: 1,
                                isMultiRun: false,
                                originalTestIndex: i,
                                loadedFromSpec: true,
                                specGenerated: dimensionSpecs.generated,
                            },
                            priority: test.priority || 2,
                        };
                        testSpecs.push(testSpec);
                    }
                }
            }
        }
        return {
            testSpecs,
            metadata: {
                totalTests: testSpecs.length,
                agentCount: selectedTeams.length,
                dimensionCount: selectedDimensions.length,
                multiRunTests: multiRunCount,
                generatedBy: Array.from(generatedBy),
            },
        };
    }
    /**
     * Load flow test specifications from eval-spec.json
     */
    async loadFlowTests(flows, selectedFlows, selectedDimensions) {
        const testSpecs = [];
        const generatedBy = new Set();
        let multiRunCount = 0;
        // Process each selected flow
        for (const flowName of selectedFlows) {
            const flowSpec = flows[flowName];
            if (!flowSpec || !flowSpec.testSpecs) {
                console.warn(`No test specs found for flow: ${flowName}`);
                continue;
            }
            // Process each selected dimension for this flow
            for (const dimension of selectedDimensions) {
                const dimensionSpecs = flowSpec.testSpecs[dimension];
                if (!dimensionSpecs || !dimensionSpecs.tests) {
                    console.warn(`No ${dimension} tests found for flow: ${flowName}`);
                    continue;
                }
                // Track who generated these tests
                if (dimensionSpecs.generatedBy) {
                    generatedBy.add(dimensionSpecs.generatedBy);
                }
                // Convert each test to TestSpec format (same logic as agents/teams)
                for (let i = 0; i < dimensionSpecs.tests.length; i++) {
                    const test = dimensionSpecs.tests[i];
                    // Normalize input
                    const normalizedInput = this.normalizeInput(test.input);
                    // Determine if this is a multi-run test
                    const isMultiRun = test.multiRun?.enabled || dimension === 'consistency';
                    const runCount = test.multiRun?.runCount || (dimension === 'consistency' ? 3 : 1);
                    if (isMultiRun) {
                        multiRunCount++;
                        const parentTestId = test.id;
                        if (!parentTestId) {
                            console.warn(`Multi-run test missing ID for ${flowName}-${dimension}-${i}`);
                            continue;
                        }
                        const runIds = this.generateRunIds(parentTestId, runCount);
                        const runType = test.multiRun?.runType;
                        const aggregationStrategy = test.multiRun?.aggregationStrategy;
                        const executionMode = test.multiRun?.executionMode;
                        const multiRunConfig = {
                            runCount: runCount,
                            runType: (runType === 'variations' || runType === 'identical') ? runType : 'identical',
                            aggregationStrategy: (aggregationStrategy === 'compare' || aggregationStrategy === 'statistical' || aggregationStrategy === 'sequential') ? aggregationStrategy : 'compare',
                            executionMode: (executionMode === 'parallel' || executionMode === 'sequential') ? executionMode : 'parallel',
                            inputVariations: test.multiRun?.inputVariations,
                        };
                        // Create individual TestSpecs for each run
                        for (let runIndex = 0; runIndex < runCount; runIndex++) {
                            const runTestSpec = {
                                id: runIds[runIndex],
                                dimension: dimension,
                                input: normalizedInput,
                                expected: test.expected,
                                ui_description: test.ui_description, // ✅ CRITICAL: Preserve ui_description from eval-spec.json
                                evaluationCriteria: test.evaluation_criteria || test.evaluationCriteria || [],
                                multiRun: undefined,
                                agent: {
                                    id: flowName,
                                    name: flowName,
                                    framework: 'unknown',
                                },
                                metadata: {
                                    inputIndex: i,
                                    dimension: dimension,
                                    agentName: flowName,
                                    entityType: 'flow', // Mark as flow test
                                    generatedBy: dimensionSpecs.generatedBy || 'unknown',
                                    testName: test.name || `${dimension} test ${i + 1}`,
                                    rationale: test.name,
                                    category: dimension,
                                    priority: test.priority || 2,
                                    expectedBehavior: test.expected,
                                    totalRuns: runCount,
                                    isMultiRun: false,
                                    originalTestIndex: i,
                                    loadedFromSpec: true,
                                    specGenerated: dimensionSpecs.generated,
                                    parentTestId: parentTestId,
                                    runIndex: runIndex,
                                },
                                priority: test.priority || 2,
                            };
                            testSpecs.push(runTestSpec);
                        }
                        // Create parent test spec
                        const parentTestSpec = {
                            id: parentTestId,
                            dimension: dimension,
                            input: normalizedInput,
                            expected: test.expected,
                            ui_description: test.ui_description, // ✅ CRITICAL: Preserve ui_description from eval-spec.json
                            evaluationCriteria: test.evaluation_criteria || test.evaluationCriteria || [],
                            multiRun: multiRunConfig,
                            agent: {
                                id: flowName,
                                name: flowName,
                                framework: 'unknown',
                            },
                            metadata: {
                                inputIndex: i,
                                dimension: dimension,
                                agentName: flowName,
                                entityType: 'flow', // Mark as flow test
                                generatedBy: dimensionSpecs.generatedBy || 'unknown',
                                testName: test.name || `${dimension} test ${i + 1}`,
                                rationale: test.name,
                                category: dimension,
                                priority: test.priority || 2,
                                expectedBehavior: test.expected,
                                totalRuns: runCount,
                                isMultiRun: true,
                                originalTestIndex: i,
                                loadedFromSpec: true,
                                specGenerated: dimensionSpecs.generated,
                                isParentTest: true,
                            },
                            priority: test.priority || 2,
                        };
                        testSpecs.push(parentTestSpec);
                    }
                    else {
                        // Single run test
                        const testId = test.id;
                        if (!testId) {
                            console.warn(`Single test missing ID for ${flowName}-${dimension}-${i}`);
                            continue;
                        }
                        const testSpec = {
                            id: testId,
                            dimension: dimension,
                            input: normalizedInput,
                            expected: test.expected,
                            ui_description: test.ui_description, // ✅ CRITICAL: Preserve ui_description from eval-spec.json
                            evaluationCriteria: test.evaluation_criteria || test.evaluationCriteria || [],
                            multiRun: undefined,
                            agent: {
                                id: flowName,
                                name: flowName,
                                framework: 'unknown',
                            },
                            metadata: {
                                inputIndex: i,
                                dimension: dimension,
                                agentName: flowName,
                                entityType: 'flow', // Mark as flow test
                                generatedBy: dimensionSpecs.generatedBy || 'unknown',
                                testName: test.name || `${dimension} test ${i + 1}`,
                                rationale: test.name,
                                category: dimension,
                                priority: test.priority || 2,
                                expectedBehavior: test.expected,
                                totalRuns: 1,
                                isMultiRun: false,
                                originalTestIndex: i,
                                loadedFromSpec: true,
                                specGenerated: dimensionSpecs.generated,
                            },
                            priority: test.priority || 2,
                        };
                        testSpecs.push(testSpec);
                    }
                }
            }
        }
        return {
            testSpecs,
            metadata: {
                totalTests: testSpecs.length,
                agentCount: selectedFlows.length,
                dimensionCount: selectedDimensions.length,
                multiRunTests: multiRunCount,
                generatedBy: Array.from(generatedBy),
            },
        };
    }
    /**
     * Load test specifications from eval-spec.json for selected agents and dimensions
     * @deprecated Use loadAgentTests() instead for explicit agent loading
     */
    async loadTestsFromSpec(evalSpec, selectedAgents, selectedDimensions) {
        // Delegate to loadAgentTests for backward compatibility
        return this.loadAgentTests(evalSpec.agents, selectedAgents, selectedDimensions);
    }
    /**
     * Validate that required test specifications exist
     */
    validateTestSpecs(evalSpec, selectedAgents, selectedDimensions) {
        const missing = [];
        const warnings = [];
        for (const agentName of selectedAgents) {
            const agentSpec = evalSpec.agents[agentName];
            if (!agentSpec) {
                missing.push({
                    agent: agentName,
                    dimension: 'all',
                    reason: 'Agent not found in eval spec',
                });
                continue;
            }
            if (!agentSpec.testSpecs) {
                missing.push({
                    agent: agentName,
                    dimension: 'all',
                    reason: 'No test specifications found for agent',
                });
                continue;
            }
            for (const dimension of selectedDimensions) {
                const dimensionSpecs = agentSpec.testSpecs[dimension];
                if (!dimensionSpecs) {
                    missing.push({
                        agent: agentName,
                        dimension: dimension,
                        reason: 'Dimension not found in agent test specs',
                    });
                    continue;
                }
                if (!dimensionSpecs.tests || dimensionSpecs.tests.length === 0) {
                    missing.push({
                        agent: agentName,
                        dimension: dimension,
                        reason: 'No tests found for dimension',
                    });
                    continue;
                }
                // Check for potential issues
                const testsWithoutCriteria = dimensionSpecs.tests.filter(t => !t.evaluationCriteria);
                if (testsWithoutCriteria.length > 0) {
                    warnings.push(`Agent ${agentName}, dimension ${dimension}: ${testsWithoutCriteria.length} tests missing evaluation criteria`);
                }
                // Check if tests were generated by LLM
                if (!dimensionSpecs.generatedBy || !dimensionSpecs.generatedBy.includes('gpt')) {
                    warnings.push(`Agent ${agentName}, dimension ${dimension}: Tests may not be LLM-generated (generatedBy: ${dimensionSpecs.generatedBy})`);
                }
            }
        }
        return {
            valid: missing.length === 0,
            missing,
            warnings,
        };
    }
    /**
     * Get summary of available test specifications
     */
    getSpecSummary(evalSpec) {
        const agents = [];
        const allDimensions = new Set();
        let totalTests = 0;
        for (const [agentName, agentSpec] of Object.entries(evalSpec.agents)) {
            if (!agentSpec.testSpecs)
                continue;
            const dimensions = Object.keys(agentSpec.testSpecs);
            let agentTestCount = 0;
            let lastGenerated;
            for (const dimension of dimensions) {
                allDimensions.add(dimension);
                const dimensionSpecs = agentSpec.testSpecs[dimension];
                if (dimensionSpecs?.tests) {
                    agentTestCount += dimensionSpecs.tests.length;
                    // Track most recent generation time
                    if (dimensionSpecs.generated) {
                        if (!lastGenerated || dimensionSpecs.generated > lastGenerated) {
                            lastGenerated = dimensionSpecs.generated;
                        }
                    }
                }
            }
            agents.push({
                name: agentName,
                dimensions,
                totalTests: agentTestCount,
                lastGenerated,
            });
            totalTests += agentTestCount;
        }
        return {
            agents,
            totalAgents: agents.length,
            totalDimensions: allDimensions.size,
            totalTests,
        };
    }
}
//# sourceMappingURL=test-spec-loader.js.map