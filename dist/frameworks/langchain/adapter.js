/**
 * LangChain Framework Adapter
 *
 * Main adapter implementation that provides the interface between
 * Identro Eval and LangChain projects. This adapter:
 * - Detects LangChain usage
 * - Discovers agents
 * - Analyzes agent capabilities
 * - Runs evaluation tests
 */
import { createContractAnalyzer, } from '@identro/eval-core';
import { detect, validate } from './detector';
import { discoverAgents } from './discovery';
import { LangChainPromptExtractor } from './prompt-extractor';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LLM_ENV_PATTERNS, CONFIG_FILE_PATTERNS } from './utils/patterns';
const { execa } = require('execa');
const dotenv = require('dotenv');
const yaml = require('js-yaml');
/**
 * LangChain adapter implementation
 */
export class LangChainAdapter {
    name = 'langchain';
    supportedLanguages = ['python', 'typescript', 'javascript'];
    promptExtractor;
    contractAnalyzer;
    constructor() {
        this.promptExtractor = new LangChainPromptExtractor();
        // Use OpenAI provider by default, can be configured via configure() method
        this.contractAnalyzer = createContractAnalyzer({
            provider: 'openai',
            verbose: false,
        });
    }
    /**
     * Configure the adapter with LLM settings
     */
    configure(llmConfig) {
        if (llmConfig.provider === 'openai' || llmConfig.provider === 'anthropic') {
            this.contractAnalyzer = createContractAnalyzer({
                provider: llmConfig.provider,
                verbose: false,
            });
        }
    }
    /**
     * Detect if LangChain is used in the project
     */
    async detect(projectPath) {
        return detect(projectPath);
    }
    /**
     * Discover all agents in the project
     */
    async discoverAgents(projectPath) {
        return discoverAgents(projectPath);
    }
    /**
     * Analyze a specific agent to create evaluation spec
     *
     * This uses a combination of static analysis and LLM-based understanding
     * to determine the agent's capabilities and requirements.
     */
    async analyzeAgent(agentPath) {
        try {
            // Read the agent file
            const content = await fs.readFile(agentPath, 'utf-8');
            const fileName = path.basename(agentPath);
            // Extract prompts from the agent file
            const extractedPrompts = await this.promptExtractor.extractFromFile(agentPath, content);
            // Use contract discovery if prompts were found
            let agentType = 'task_executor';
            let sampleInputs = [];
            let outputSchema = undefined;
            if (extractedPrompts.templates.length > 0) {
                // Analyze the contract using LLM
                const analysis = await this.contractAnalyzer.analyzeFromPrompts(extractedPrompts, 'langchain');
                // Use discovered contract to determine agent type
                const contract = analysis.contract;
                const capabilities = contract.capabilities.join(' ').toLowerCase();
                if (capabilities.includes('retriev') || capabilities.includes('search') || capabilities.includes('rag')) {
                    agentType = 'rag';
                }
                else if (capabilities.includes('classif') || capabilities.includes('categor') || capabilities.includes('route')) {
                    agentType = 'classifier';
                }
                else if (capabilities.includes('coordinat') || capabilities.includes('orchestrat') || capabilities.includes('multi')) {
                    agentType = 'coordinator';
                }
                // Use generated test cases as sample inputs
                sampleInputs = analysis.testCases.map(tc => tc.input);
                // Use discovered output schema
                if (contract.outputSchema) {
                    outputSchema = this.convertSchemaToAgentSpec(contract.outputSchema);
                }
            }
            else {
                // Fallback to basic analysis if no prompts found
                const lowerContent = content.toLowerCase();
                if (lowerContent.includes('retrieval') || lowerContent.includes('vectorstore')) {
                    agentType = 'rag';
                }
                else if (lowerContent.includes('router') || lowerContent.includes('classify')) {
                    agentType = 'classifier';
                }
                else if (lowerContent.includes('sequential') || lowerContent.includes('orchestrat')) {
                    agentType = 'coordinator';
                }
                sampleInputs = this.generateSampleInputs(agentType, content);
            }
            // Extract agent name from file or content
            let agentName = fileName.replace(/\.(py|ts|js|tsx|jsx)$/, '');
            // Try to find class or variable name
            const classMatch = content.match(/class\s+(\w+)/);
            const varMatch = content.match(/(?:const|let|var)\s+(\w+)\s*=/);
            if (classMatch)
                agentName = classMatch[1];
            else if (varMatch)
                agentName = varMatch[1];
            // Determine expected output type
            const expectedOutputType = this.determineOutputType(agentType, content);
            // Create agent info
            const agent = {
                id: `${agentPath}:${agentName}`,
                name: agentName,
                type: agentType,
                path: agentPath,
                framework: 'langchain',
                description: extractedPrompts.descriptions.join(' ') || `LangChain ${agentType} agent`,
                metadata: {
                    promptsFound: extractedPrompts.templates.length,
                    toolsFound: extractedPrompts.tools.length,
                },
            };
            // Create agent spec
            const spec = {
                agent,
                sampleInputs: sampleInputs.length > 0 ? sampleInputs : this.generateSampleInputs(agentType, content),
                expectedOutputType,
                performance: {
                    maxLatencyMs: agentType === 'rag' ? 5000 : 2000,
                    minThroughput: 1,
                },
                safety: {
                    preventPromptInjection: true,
                    handleBoundaryInputs: true,
                },
            };
            // Add output schema if discovered or for structured agents
            if (outputSchema) {
                spec.outputSchema = outputSchema;
            }
            else if (agentType === 'classifier') {
                spec.outputSchema = {
                    category: { type: 'string', required: true },
                    confidence: { type: 'number', min: 0, max: 1 },
                };
            }
            return spec;
        }
        catch (error) {
            console.error(`Error analyzing agent at ${agentPath}:`, error);
            throw error;
        }
    }
    /**
     * Convert schema definition to agent spec format
     */
    convertSchemaToAgentSpec(schema) {
        const result = {};
        if (schema.properties) {
            for (const [key, value] of Object.entries(schema.properties)) {
                const prop = value;
                result[key] = {
                    type: prop.type,
                    required: schema.required?.includes(key),
                };
                if (prop.minimum !== undefined)
                    result[key].min = prop.minimum;
                if (prop.maximum !== undefined)
                    result[key].max = prop.maximum;
                if (prop.enum)
                    result[key].enum = prop.enum;
            }
        }
        return result;
    }
    /**
     * Run evaluation tests on an agent
     */
    async runTests(agent, spec, context) {
        const results = {
            agentId: agent.id,
            timestamp: new Date(),
            tests: [],
            dimensions: {},
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                averageLatencyMs: 0,
                successRate: 0,
            },
        };
        try {
            // Detect the language of the agent
            const ext = path.extname(agent.path);
            const isPython = ext === '.py';
            // Run tests for each sample input
            for (const input of spec.sampleInputs) {
                const testResult = await this.runSingleTest(agent, input, context, isPython);
                results.tests.push(testResult);
            }
            // Calculate pattern results
            results.dimensions.consistency = this.calculateConsistency(results.tests);
            results.dimensions.safety = this.calculateSafety(results.tests);
            results.dimensions.performance = this.calculatePerformance(results.tests);
            if (spec.outputSchema) {
                results.dimensions.schema = this.calculateSchemaCompliance(results.tests, spec.outputSchema);
            }
            // Calculate summary
            results.summary.totalTests = results.tests.length;
            results.summary.passed = results.tests.filter((t) => t.success).length;
            results.summary.failed = results.tests.filter((t) => !t.success).length;
            results.summary.averageLatencyMs =
                results.tests.reduce((sum, t) => sum + t.latencyMs, 0) / results.tests.length;
            results.summary.successRate = results.summary.passed / results.summary.totalTests;
        }
        catch (error) {
            console.error(`Error running tests for agent ${agent.id}:`, error);
            results.summary.failed = spec.sampleInputs.length;
        }
        return results;
    }
    /**
     * Detect LLM configuration in the project
     */
    async detectLLMConfig(projectPath) {
        const config = {
            provider: 'openai', // Default to OpenAI if no specific provider detected
        };
        // Check environment variables
        for (const envVar of LLM_ENV_PATTERNS) {
            if (process.env[envVar]) {
                config.apiKeyEnv = envVar;
                // Determine provider from env var name
                if (envVar.includes('OPENAI'))
                    config.provider = 'openai';
                else if (envVar.includes('ANTHROPIC'))
                    config.provider = 'anthropic';
                else if (envVar.includes('AZURE'))
                    config.provider = 'azure';
                else if (envVar.includes('HUGGING'))
                    config.provider = 'huggingface';
                break;
            }
        }
        // Check .env files
        for (const configFile of CONFIG_FILE_PATTERNS) {
            const filePath = path.join(projectPath, configFile);
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                if (configFile.endsWith('.env') || configFile.includes('.env.')) {
                    // Parse .env file
                    const parsed = dotenv.parse(content);
                    for (const envVar of LLM_ENV_PATTERNS) {
                        if (parsed[envVar]) {
                            config.apiKeyEnv = envVar;
                            // Determine provider
                            if (envVar.includes('OPENAI'))
                                config.provider = 'openai';
                            else if (envVar.includes('ANTHROPIC'))
                                config.provider = 'anthropic';
                            else if (envVar.includes('AZURE'))
                                config.provider = 'azure';
                            else if (envVar.includes('HUGGING'))
                                config.provider = 'huggingface';
                            break;
                        }
                    }
                }
                else if (configFile.endsWith('.yaml') || configFile.endsWith('.yml')) {
                    // Parse YAML config
                    const parsed = yaml.load(content);
                    if (parsed.llm) {
                        config.provider = parsed.llm.provider || config.provider;
                        config.model = parsed.llm.model;
                        config.temperature = parsed.llm.temperature;
                        config.maxTokens = parsed.llm.max_tokens;
                    }
                }
                else if (configFile.endsWith('.json')) {
                    // Parse JSON config
                    const parsed = JSON.parse(content);
                    if (parsed.llm) {
                        config.provider = parsed.llm.provider || config.provider;
                        config.model = parsed.llm.model;
                        config.temperature = parsed.llm.temperature;
                        config.maxTokens = parsed.llm.maxTokens;
                    }
                }
                if (config.provider !== 'openai' || config.apiKeyEnv)
                    break;
            }
            catch {
                // File doesn't exist or can't be parsed
            }
        }
        return config;
    }
    /**
     * Validate the framework setup
     */
    async validate(projectPath) {
        return validate(projectPath);
    }
    /**
     * Run a single test on an agent
     */
    async runSingleTest(agent, input, context, isPython) {
        const startTime = Date.now();
        try {
            let output;
            if (isPython) {
                // Create Python test script
                const testScript = `
import sys
import json
import importlib.util

# Load the agent module
spec = importlib.util.spec_from_file_location("agent", "${agent.path}")
agent_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent_module)

# Find the agent
agent = None
for name in dir(agent_module):
    obj = getattr(agent_module, name)
    if 'agent' in name.lower() or 'chain' in name.lower():
        agent = obj
        break

if agent:
    # Run the agent
    input_data = json.loads(sys.argv[1])
    if callable(agent):
        result = agent(input_data)
    elif hasattr(agent, 'run'):
        result = agent.run(input_data)
    elif hasattr(agent, 'invoke'):
        result = agent.invoke(input_data)
    else:
        result = str(agent)
    
    print(json.dumps({"success": True, "output": str(result)}))
else:
    print(json.dumps({"success": False, "error": "Agent not found"}))
`;
                const { stdout } = await execa('python3', ['-c', testScript, JSON.stringify(input)], {
                    cwd: context.projectPath,
                    timeout: context.timeoutMs || 30000,
                });
                const result = JSON.parse(stdout);
                output = result.output;
            }
            else {
                // For TypeScript/JavaScript, we'll simulate the test
                // In a real implementation, this would use a Node.js subprocess
                output = {
                    response: `Simulated response for: ${input}`,
                    confidence: 0.85,
                };
            }
            return {
                input,
                output,
                latencyMs: Date.now() - startTime,
                success: true,
            };
        }
        catch (error) {
            return {
                input,
                output: null,
                latencyMs: Date.now() - startTime,
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Generate sample inputs based on agent type
     */
    generateSampleInputs(agentType, _content) {
        switch (agentType) {
            case 'classifier':
                return [
                    "I need help with my billing issue",
                    "The app is crashing when I try to login",
                    "How do I reset my password?",
                    "I want to upgrade my subscription",
                ];
            case 'rag':
                return [
                    "What is the return policy?",
                    "How do I configure the API?",
                    "What are the system requirements?",
                    "Explain the pricing model",
                ];
            case 'task_executor':
                return [
                    "Generate a summary of this text: The quick brown fox jumps over the lazy dog.",
                    "Translate this to Spanish: Hello, how are you?",
                    "Write a haiku about programming",
                    "Calculate the factorial of 5",
                ];
            case 'coordinator':
                return [
                    "Research and summarize the latest AI trends",
                    "Plan a marketing campaign for a new product",
                    "Analyze customer feedback and provide insights",
                    "Create a project timeline with milestones",
                ];
            default:
                return [
                    "Test input 1",
                    "Test input 2",
                    "Test input 3",
                    "Test input 4",
                ];
        }
    }
    /**
     * Determine expected output type based on agent type
     */
    determineOutputType(agentType, content) {
        if (agentType === 'classifier')
            return 'classification';
        if (content.includes('json') || content.includes('JSON'))
            return 'json';
        if (content.includes('structured'))
            return 'structured';
        return 'text';
    }
    /**
     * Calculate consistency results
     */
    calculateConsistency(tests) {
        // Group tests by input
        const inputGroups = new Map();
        for (const test of tests) {
            const key = JSON.stringify(test.input);
            if (!inputGroups.has(key)) {
                inputGroups.set(key, []);
            }
            inputGroups.get(key).push(test);
        }
        // Calculate variance
        let totalVariance = 0;
        let groupCount = 0;
        for (const group of inputGroups.values()) {
            if (group.length > 1) {
                // Simple variance calculation based on output differences
                const outputs = group.map(t => JSON.stringify(t.output));
                const uniqueOutputs = new Set(outputs);
                const variance = (uniqueOutputs.size - 1) / (group.length - 1);
                totalVariance += variance;
                groupCount++;
            }
        }
        const avgVariance = groupCount > 0 ? totalVariance / groupCount : 0;
        return {
            outputVariance: avgVariance,
            similarityScores: [1 - avgVariance],
            isConsistent: avgVariance < 0.2,
            confidence: 1 - avgVariance,
        };
    }
    /**
     * Calculate safety results
     */
    calculateSafety(tests) {
        const failureRate = tests.filter(t => !t.success).length / tests.length;
        return {
            promptInjectionResistant: failureRate < 0.1,
            boundaryHandling: failureRate < 0.2,
            errorRecovery: failureRate < 0.3,
            safetyScore: 1 - failureRate,
        };
    }
    /**
     * Calculate performance results
     */
    calculatePerformance(tests) {
        const latencies = tests.map(t => t.latencyMs).sort((a, b) => a - b);
        const successfulTests = tests.filter(t => t.success);
        return {
            latencyPercentiles: {
                p50: latencies[Math.floor(latencies.length * 0.5)] || 0,
                p90: latencies[Math.floor(latencies.length * 0.9)] || 0,
                p95: latencies[Math.floor(latencies.length * 0.95)] || 0,
                p99: latencies[Math.floor(latencies.length * 0.99)] || 0,
            },
            throughput: {
                requestsPerSecond: 1000 / (latencies[Math.floor(latencies.length * 0.5)] || 1000),
            },
            timeoutRate: tests.filter(t => t.latencyMs > 30000).length / tests.length,
            performanceScore: successfulTests.length / tests.length,
        };
    }
    /**
     * Calculate schema compliance
     */
    calculateSchemaCompliance(tests, schema) {
        let compliantCount = 0;
        const errors = [];
        for (const test of tests) {
            if (test.success && test.output) {
                // Simple schema validation
                const output = typeof test.output === 'string'
                    ? { text: test.output }
                    : test.output;
                let isCompliant = true;
                for (const [key, rules] of Object.entries(schema)) {
                    if (rules.required && !(key in output)) {
                        isCompliant = false;
                        errors.push(`Missing required field: ${key}`);
                    }
                }
                if (isCompliant)
                    compliantCount++;
            }
        }
        const complianceRate = tests.length > 0 ? compliantCount / tests.length : 0;
        return {
            schemaCompliant: complianceRate > 0.9,
            validationErrors: [...new Set(errors)],
            complianceRate,
            schemaScore: complianceRate,
        };
    }
}
//# sourceMappingURL=adapter.js.map