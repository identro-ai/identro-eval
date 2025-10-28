"use strict";
/**
 * Evaluation Engine Service
 * Manages the core evaluation engine instance and framework adapters
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
exports.EvaluationEngineService = void 0;
exports.getEvaluationEngine = getEvaluationEngine;
const eval_core_1 = require('../_internal/core');
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * Singleton evaluation engine service
 */
class EvaluationEngineService {
    constructor() {
        this.initialized = false;
        // Create engine with default config
        this.engine = (0, eval_core_1.createEvaluationEngine)({
            verbose: false,
            parallel: false,
            maxConcurrency: 1,
            globalTimeoutMs: 300000,
            outputDir: './.identro/eval-results',
        });
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!EvaluationEngineService.instance) {
            EvaluationEngineService.instance = new EvaluationEngineService();
        }
        return EvaluationEngineService.instance;
    }
    /**
     * Initialize the engine with adapters
     */
    async initialize(config) {
        if (this.initialized) {
            return;
        }
        // Update engine config if provided
        if (config) {
            this.engine = (0, eval_core_1.createEvaluationEngine)({
                verbose: false, // Config doesn't have verbose field
                parallel: false,
                maxConcurrency: 1,
                globalTimeoutMs: config.ci?.timeout || 300000,
                outputDir: config.output?.directory || './.identro/eval-results',
            });
        }
        // Register framework adapters dynamically using workspace dependencies
        try {
            // Try to load CrewAI adapter
            const { CrewAIAdapter } = await Promise.resolve().then(() => __importStar(require('../_internal/crewai')));
            const crewaiAdapter = new CrewAIAdapter();
            // Configure adapter with LLM settings if available
            if (config?.llm?.selected && 'configure' in crewaiAdapter && typeof crewaiAdapter.configure === 'function') {
                const llmConfig = config.llm.selected;
                // Ensure provider is a valid type
                if (['openai', 'anthropic', 'azure', 'huggingface', 'local'].includes(llmConfig.provider)) {
                    crewaiAdapter.configure(llmConfig);
                }
            }
            this.engine.registerAdapter(crewaiAdapter);
        }
        catch (err) {
            console.debug('CrewAI adapter not available:', err);
        }
        try {
            // Try to load LangChain adapter
            const { LangChainAdapter } = await Promise.resolve().then(() => __importStar(require('../_internal/langchain')));
            const langchainAdapter = new LangChainAdapter();
            // Configure adapter with LLM settings if available
            if (config?.llm?.selected && 'configure' in langchainAdapter && typeof langchainAdapter.configure === 'function') {
                const llmConfig = config.llm.selected;
                // Ensure provider is a valid type
                if (['openai', 'anthropic', 'azure', 'huggingface', 'local'].includes(llmConfig.provider)) {
                    langchainAdapter.configure(llmConfig);
                }
            }
            this.engine.registerAdapter(langchainAdapter);
        }
        catch (err) {
            console.debug('LangChain adapter not available:', err);
        }
        this.initialized = true;
    }
    /**
     * Get the evaluation engine
     */
    getEngine() {
        if (!this.initialized) {
            throw new Error('Evaluation engine not initialized. Call initialize() first.');
        }
        return this.engine;
    }
    /**
     * Detect framework in project
     */
    async detectFramework(projectPath) {
        await this.initialize();
        // Check for CrewAI files
        const crewFile = path.join(projectPath, 'crew.py');
        const agentsFile = path.join(projectPath, 'agents.py');
        const agentsYaml = path.join(projectPath, 'agents.yaml');
        if (await fs.pathExists(crewFile) || await fs.pathExists(agentsFile) || await fs.pathExists(agentsYaml)) {
            return 'crewai';
        }
        // Check for LangChain dimensions
        // Look for common LangChain imports in Python files
        try {
            const pythonFiles = await fs.readdir(projectPath);
            for (const file of pythonFiles) {
                if (file.endsWith('.py')) {
                    const content = await fs.readFile(path.join(projectPath, file), 'utf-8');
                    if (content.includes('from langchain') || content.includes('import langchain')) {
                        return 'langchain';
                    }
                }
            }
            // Check for TypeScript/JavaScript LangChain
            const tsFiles = pythonFiles.filter(f => f.endsWith('.ts') || f.endsWith('.js'));
            for (const file of tsFiles) {
                const content = await fs.readFile(path.join(projectPath, file), 'utf-8');
                if (content.includes('langchain') || content.includes('@langchain')) {
                    return 'langchain';
                }
            }
        }
        catch (err) {
            console.debug('Error reading project files:', err);
        }
        return null;
    }
    /**
     * Discover agents in project
     */
    async discoverAgents(projectPath, framework) {
        await this.initialize();
        // Auto-detect framework if not specified
        const detectedFramework = framework || await this.detectFramework(projectPath);
        if (!detectedFramework) {
            throw new Error('No supported framework detected in project');
        }
        // Debug logging
        console.debug(`Detected framework: ${detectedFramework}`);
        const adapter = this.engine.getAdapter(detectedFramework);
        if (!adapter) {
            // List available adapters for debugging
            console.error(`No adapter found for framework: ${detectedFramework}`);
            console.error(`Registered adapters: crewai, langchain`);
            throw new Error(`No adapter found for framework: ${detectedFramework}`);
        }
        return {
            framework: detectedFramework,
            agents: await adapter.discoverAgents(projectPath),
        };
    }
    /**
     * Analyze an agent
     */
    async analyzeAgent(agentPath, framework) {
        await this.initialize();
        const adapter = this.engine.getAdapter(framework);
        if (!adapter) {
            throw new Error(`No adapter found for framework: ${framework}`);
        }
        return adapter.analyzeAgent(agentPath);
    }
    /**
     * Run tests for agents
     */
    async runTests(projectPath, evalSpec, options) {
        await this.initialize();
        // Get the framework from evalSpec
        const framework = evalSpec.project.framework;
        const adapter = this.engine.getAdapter(framework);
        if (!adapter) {
            throw new Error(`No adapter found for framework: ${framework}`);
        }
        const results = new Map();
        // Filter agents if specific agent requested
        const agentsToTest = options?.agentName
            ? { [options.agentName]: evalSpec.agents[options.agentName] }
            : evalSpec.agents;
        // Test each agent
        for (const [agentName, agentSpec] of Object.entries(agentsToTest)) {
            if (!agentSpec)
                continue;
            // Find the agent path
            const discovery = await this.discoverAgents(projectPath, framework);
            const agent = discovery.agents.find(a => a.name === agentName);
            if (!agent) {
                console.warn(`Agent ${agentName} not found`);
                continue;
            }
            // Analyze the agent
            const spec = await adapter.analyzeAgent(agent.path);
            // Create test context with options
            // Load dimensions dynamically - no hardcoded fallback
            let dimensions;
            if (options?.dimension) {
                dimensions = options.dimension.split(',');
            }
            else {
                // Load available dimensions from registry
                const dimensionRegistry = new eval_core_1.DefaultDimensionRegistry();
                await dimensionRegistry.loadDimensionDefinitions(projectPath);
                dimensions = await dimensionRegistry.getAvailableDimensions();
            }
            const testContext = {
                projectPath,
                timeoutMs: 60000, // Default timeout, now configured via eval.config.yml
                quick: options?.quick || false,
                cache: options?.cache,
                progress: options?.progress,
                dimensions: dimensions
            };
            // Run tests using the adapter
            const testResults = await adapter.runTests(agent, spec, testContext);
            results.set(agentName, testResults);
            // Update progress if provided
            if (options?.progress) {
                options.progress.updateAgent();
            }
        }
        return results;
    }
    /**
     * Generate report from test results
     */
    generateReport(results, format = 'text') {
        if (format === 'json') {
            const obj = {};
            for (const [key, value] of results) {
                obj[key] = value;
            }
            return JSON.stringify(obj, null, 2);
        }
        if (format === 'markdown' || format === 'text') {
            return this.engine.generateReport(results);
        }
        if (format === 'html') {
            // Generate HTML report
            let html = `<!DOCTYPE html>
<html>
<head>
  <title>Identro Eval Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    h2 { color: #666; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h3 { color: #888; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .passed { color: green; }
    .failed { color: red; }
    .metric { margin: 10px 0; }
    .agent-section { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>Identro Eval Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
`;
            for (const [agentName, testResults] of results) {
                const summary = testResults.summary;
                const passedClass = summary.failed === 0 ? 'passed' : 'failed';
                html += `
  <div class="agent-section">
    <h2>Agent: ${agentName}</h2>
    <div class="summary">
      <div class="metric">Total Tests: <strong>${summary.totalTests}</strong></div>
      <div class="metric">Passed: <strong class="passed">${summary.passed}</strong></div>
      <div class="metric">Failed: <strong class="failed">${summary.failed}</strong></div>
      <div class="metric">Success Rate: <strong class="${passedClass}">${(summary.successRate * 100).toFixed(1)}%</strong></div>
      <div class="metric">Average Latency: <strong>${summary.averageLatencyMs.toFixed(0)}ms</strong></div>
    </div>
`;
                // Add dimension results if available
                if (testResults.dimensions) {
                    html += '<h3>Dimension Analysis</h3>';
                    if (testResults.dimensions.consistency) {
                        html += `<div class="metric">Consistency: ${testResults.dimensions.consistency.isConsistent ? '✅ Consistent' : '❌ Inconsistent'}</div>`;
                    }
                    if (testResults.dimensions.safety) {
                        html += `<div class="metric">Safety Score: ${(testResults.dimensions.safety.safetyScore * 100).toFixed(1)}%</div>`;
                    }
                    if (testResults.dimensions.performance) {
                        html += `<div class="metric">P50 Latency: ${testResults.dimensions.performance.latencyPercentiles.p50}ms</div>`;
                    }
                    if (testResults.dimensions.schema) {
                        // Use validationErrors to determine compliance
                        const hasErrors = testResults.dimensions.schema.validationErrors && testResults.dimensions.schema.validationErrors.length > 0;
                        const compliance = hasErrors ? 0 : 1;
                        html += `<div class="metric">Schema Compliance: ${hasErrors ? '❌ Has Errors' : '✅ Valid'}</div>`;
                    }
                }
                html += '</div>';
            }
            html += `
</body>
</html>`;
            return html;
        }
        return this.engine.generateReport(results);
    }
    /**
     * Extract contract from an agent
     */
    async extractContract(agentPath, framework) {
        await this.initialize();
        const content = await fs.readFile(agentPath, 'utf-8');
        const agentName = path.basename(agentPath, path.extname(agentPath));
        // Extract based on framework
        if (framework === 'crewai') {
            return this.extractCrewAIContract(content, agentName);
        }
        else if (framework === 'langchain') {
            return this.extractLangChainContract(content, agentName);
        }
        // Generic extraction
        return {
            description: 'Generic agent',
            capabilities: [],
            inputSchema: { type: 'object' },
            outputSchema: { type: 'object' },
            examples: [],
            confidence: 0.5,
            extractedFrom: [agentPath],
            metadata: {
                agentName,
                type: 'general'
            }
        };
    }
    /**
     * Extract contract from CrewAI agent
     */
    extractCrewAIContract(content, agentName) {
        // Extract role
        const roleMatch = content.match(/role\s*=\s*["']([^"']+)["']/);
        const role = roleMatch ? roleMatch[1] : 'agent';
        // Extract goal
        const goalMatch = content.match(/goal\s*=\s*["']([^"']+)["']/);
        const goal = goalMatch ? goalMatch[1] : '';
        // Extract backstory
        const backstoryMatch = content.match(/backstory\s*=\s*["']([^"']+)["']/);
        const backstory = backstoryMatch ? backstoryMatch[1] : '';
        // Extract tools
        const toolsMatch = content.match(/tools\s*=\s*\[([^\]]+)\]/);
        const tools = toolsMatch ? toolsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')) : [];
        // Extract capabilities from role and tools
        const capabilities = [
            role,
            ...tools.map(t => `Can use ${t}`)
        ].filter(Boolean);
        // Extract max_iterations
        const maxIterMatch = content.match(/max_iter\w*\s*=\s*(\d+)/);
        const maxIterations = maxIterMatch ? parseInt(maxIterMatch[1]) : undefined;
        // Extract allow_delegation
        const delegationMatch = content.match(/allow_delegation\s*=\s*(True|False)/);
        const allowDelegation = delegationMatch ? delegationMatch[1] === 'True' : false;
        return {
            description: goal || `${role} agent`,
            capabilities,
            inputSchema: {
                type: 'object',
                properties: {
                    task: { type: 'string', description: 'Task to perform' },
                    context: { type: 'object', description: 'Additional context' }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    result: { type: 'string', description: 'Task result' },
                    status: { type: 'string', enum: ['success', 'failure'] }
                }
            },
            examples: [],
            confidence: 0.8,
            extractedFrom: ['agent file'],
            metadata: {
                agentName,
                type: 'crewai_agent',
                role,
                goal,
                backstory,
                tools,
                max_iterations: maxIterations,
                allow_delegation: allowDelegation,
                constraints: [
                    maxIterations ? `Maximum ${maxIterations} iterations` : null,
                    !allowDelegation ? 'Cannot delegate tasks' : null
                ].filter(Boolean)
            }
        };
    }
    /**
     * Extract contract from LangChain agent
     */
    extractLangChainContract(content, agentName) {
        // Extract description/prompt
        const promptMatch = content.match(/prompt\s*=\s*["']([^"']+)["']/);
        const description = promptMatch ? promptMatch[1] : 'LangChain agent';
        // Extract tools
        const toolsMatch = content.match(/tools\s*=\s*\[([^\]]+)\]/);
        const tools = toolsMatch ? toolsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')) : [];
        // Extract model
        const modelMatch = content.match(/model\s*=\s*["']([^"']+)["']/);
        const model = modelMatch ? modelMatch[1] : 'gpt-3.5-turbo';
        const capabilities = [
            'Process natural language',
            ...tools.map(t => `Can use ${t}`)
        ].filter(Boolean);
        return {
            description,
            capabilities,
            inputSchema: {
                type: 'object',
                properties: {
                    input: { type: 'string', description: 'User input' },
                    history: { type: 'array', items: { type: 'object' }, description: 'Conversation history' }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    output: { type: 'string', description: 'Agent response' },
                    intermediate_steps: { type: 'array', items: { type: 'object' } }
                }
            },
            examples: [],
            confidence: 0.7,
            extractedFrom: ['agent file'],
            metadata: {
                agentName,
                type: 'langchain_agent',
                model,
                tools,
                prompt: description
            }
        };
    }
    /**
     * Create or load eval spec for a project
     */
    async createEvalSpec(projectPath, config) {
        await this.initialize();
        // Detect framework
        const framework = await this.detectFramework(projectPath);
        if (!framework) {
            throw new Error('No supported framework detected');
        }
        // Discover agents
        const adapter = this.engine.getAdapter(framework);
        if (!adapter) {
            throw new Error(`No adapter found for framework: ${framework}`);
        }
        const agents = await adapter.discoverAgents(projectPath);
        // Create a basic eval spec
        const evalSpec = {
            version: '1.0',
            project: {
                framework: framework,
                language: 'typescript', // Default, should be detected
                root_path: projectPath,
            },
            agents: {},
        };
        // Add discovered agents with extracted contracts
        for (const agent of agents) {
            const contract = await this.extractContract(agent.path, framework);
            evalSpec.agents[agent.name] = {
                type: (agent.type || 'general'),
                evaluation_spec: {
                    sample_inputs: contract.examples?.map(e => e.input).filter(Boolean) || [],
                },
                description: contract.description,
                metadata: contract.metadata
            };
        }
        return evalSpec;
    }
}
exports.EvaluationEngineService = EvaluationEngineService;
// Export singleton instance getter
function getEvaluationEngine() {
    return EvaluationEngineService.getInstance();
}
//# sourceMappingURL=evaluation-engine.js.map