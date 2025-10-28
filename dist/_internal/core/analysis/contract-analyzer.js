"use strict";
/**
 * Contract analyzer for intelligent test generation
 *
 * Uses LLM providers to analyze agent contracts and generate
 * specific, meaningful test cases based on actual capabilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractAnalyzer = void 0;
exports.createContractAnalyzer = createContractAnalyzer;
const llm_provider_1 = require("./llm-provider");
/**
 * Main contract analyzer class
 */
class ContractAnalyzer {
    llmProvider;
    config;
    constructor(config = {}) {
        this.config = {
            provider: config.provider || 'openai',
            testsPerAgent: config.testsPerAgent || 5,
            minConfidence: config.minConfidence || 0.5,
            verbose: config.verbose || false,
            ...config,
        };
        this.llmProvider = (0, llm_provider_1.createLLMProvider)(this.config.provider, this.config.providerConfig);
    }
    /**
     * Analyze a contract from analysis input
     *
     * @param input - Analysis input with prompts and context
     * @returns Contract analysis with test cases
     */
    async analyzeContract(input) {
        if (this.config.verbose) {
            console.log(`Analyzing contract for: ${input.name || 'unnamed agent'}`);
        }
        // Extract contract using LLM
        const contract = await this.llmProvider.analyzePrompt(input, {
            framework: input.framework,
            agentType: input.context?.agentType,
        });
        // Generate test cases
        const testCases = await this.generateTestCases(contract, this.config.testsPerAgent);
        // Determine suggested dimensions based on contract
        const suggestedDimensions = this.suggestDimensions(contract);
        // Create analysis result
        const analysis = {
            contract,
            testCases,
            suggestedDimensions,
            timestamp: new Date().toISOString(),
            tokensUsed: this.llmProvider.getLastTokenUsage(),
        };
        if (this.config.verbose) {
            console.log(`Contract analysis complete. Confidence: ${contract.confidence}`);
            console.log(`Generated ${testCases.length} test cases`);
        }
        return analysis;
    }
    /**
     * Analyze contracts from extracted prompts
     *
     * @param prompts - Extracted prompts from framework
     * @param framework - Framework name
     * @returns Contract analysis
     */
    async analyzeFromPrompts(prompts, framework) {
        // Convert extracted prompts to analysis input
        const input = {
            framework,
            prompt: prompts.templates.find(t => t.type === 'prompt')?.content,
            systemPrompt: prompts.templates.find(t => t.type === 'system')?.content,
            humanTemplate: prompts.templates.find(t => t.type === 'human')?.content,
            examples: prompts.examples.map(e => ({
                input: e.input,
                output: e.output,
            })),
            tools: prompts.tools,
            description: prompts.descriptions.join('\n'),
            name: prompts.templates[0]?.name,
        };
        return this.analyzeContract(input);
    }
    /**
     * Generate test cases from a contract
     *
     * @param contract - Extracted contract
     * @param count - Number of tests to generate
     * @returns Generated test cases
     */
    async generateTestCases(contract, count = 5) {
        if (this.config.verbose) {
            console.log(`Generating ${count} test cases from contract`);
        }
        // Use LLM to generate tests
        const tests = await this.llmProvider.generateTests(contract, count);
        // Add contract-specific tests if not already included
        const contractTests = this.generateContractSpecificTests(contract);
        // Combine and deduplicate
        const allTests = [...tests, ...contractTests];
        const uniqueTests = this.deduplicateTests(allTests);
        // Sort by priority
        uniqueTests.sort((a, b) => a.priority - b.priority);
        // Return requested count
        return uniqueTests.slice(0, count);
    }
    /**
     * Generate a test specification for an agent
     *
     * @param agentName - Name of the agent
     * @param analysis - Contract analysis
     * @param framework - Framework being used
     * @returns Test specification
     */
    generateTestSpecification(agentName, analysis, framework) {
        return {
            agentName,
            discoveredContract: analysis.contract,
            testCases: analysis.testCases,
            evaluationConfig: {
                dimensions: analysis.suggestedDimensions,
                timeout_ms: analysis.contract.performanceHints?.timeoutMs || 30000,
                retries: analysis.contract.performanceHints?.retryable ? 3 : 1,
                parallel: false,
            },
            metadata: {
                generatedAt: analysis.timestamp,
                generatedBy: 'identro-eval',
                confidence: analysis.contract.confidence,
                framework,
            },
        };
    }
    /**
     * Suggest evaluation dimensions based on contract
     *
     * @param contract - Extracted contract
     * @returns Suggested dimension names
     */
    suggestDimensions(contract) {
        const dimensions = [];
        // Always include consistency
        dimensions.push('consistency');
        // Add safety if agent handles user input
        if (contract.capabilities.some(c => c.toLowerCase().includes('user') ||
            c.toLowerCase().includes('input') ||
            c.toLowerCase().includes('prompt'))) {
            dimensions.push('safety');
        }
        // Add performance if requirements specified
        if (contract.performanceHints) {
            dimensions.push('performance');
        }
        // Add schema if output schema is defined
        if (contract.outputSchema) {
            dimensions.push('schema');
        }
        return dimensions;
    }
    /**
     * Generate contract-specific test cases
     *
     * @param contract - Extracted contract
     * @returns Additional test cases
     */
    generateContractSpecificTests(contract) {
        const tests = [];
        // If categories are defined in output schema, test each
        if (contract.outputSchema?.properties?.category?.enum) {
            const categories = contract.outputSchema.properties.category.enum;
            categories.forEach((category) => {
                tests.push({
                    name: `test_category_${category.toLowerCase().replace(/\s+/g, '_')}`,
                    input: { input: `Test input for ${category}` },
                    expected: {
                        category,
                        confidence_min: 0.5,
                    },
                    rationale: `Tests if agent correctly identifies ${category} category`,
                    category: 'functional',
                    priority: 2,
                });
            });
        }
        // If examples are provided, convert to tests
        if (contract.examples) {
            contract.examples.forEach((example, index) => {
                tests.push({
                    name: `example_based_test_${index + 1}`,
                    input: example.input,
                    expected: {
                        output: example.expectedOutput,
                    },
                    rationale: `Test based on example from ${example.source}`,
                    category: 'functional',
                    priority: 1,
                });
            });
        }
        // Add confidence boundary test if confidence is in output
        if (contract.outputSchema?.properties?.confidence) {
            tests.push({
                name: 'ambiguous_input_confidence_test',
                input: { input: '???' },
                expected: {
                    confidence_max: 0.5,
                },
                rationale: 'Tests if agent returns low confidence for ambiguous input',
                category: 'edge_case',
                priority: 3,
            });
        }
        return tests;
    }
    /**
     * Deduplicate test cases by name
     *
     * @param tests - Test cases to deduplicate
     * @returns Unique test cases
     */
    deduplicateTests(tests) {
        const seen = new Set();
        return tests.filter(test => {
            if (seen.has(test.name)) {
                return false;
            }
            seen.add(test.name);
            return true;
        });
    }
    /**
     * Validate a contract meets minimum requirements
     *
     * @param contract - Contract to validate
     * @returns True if valid
     */
    validateContract(contract) {
        // Check confidence threshold
        if (contract.confidence < this.config.minConfidence) {
            if (this.config.verbose) {
                console.warn(`Contract confidence ${contract.confidence} below threshold ${this.config.minConfidence}`);
            }
            return false;
        }
        // Check for basic requirements
        if (!contract.description || contract.capabilities.length === 0) {
            if (this.config.verbose) {
                console.warn('Contract missing description or capabilities');
            }
            return false;
        }
        return true;
    }
    /**
     * Get the LLM provider being used
     *
     * @returns Current LLM provider
     */
    getProvider() {
        return this.llmProvider;
    }
    /**
     * Set a new LLM provider
     *
     * @param provider - New provider to use
     */
    setProvider(provider) {
        this.llmProvider = provider;
    }
}
exports.ContractAnalyzer = ContractAnalyzer;
/**
 * Create a contract analyzer instance
 *
 * @param config - Analyzer configuration
 * @returns Contract analyzer
 */
function createContractAnalyzer(config) {
    return new ContractAnalyzer(config);
}
//# sourceMappingURL=contract-analyzer.js.map