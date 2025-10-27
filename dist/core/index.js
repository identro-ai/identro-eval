/**
 * @identro/eval-core - Core evaluation engine for AI agent testing
 */
import { analyzeConsistencyDimensions, } from './dimensions/consistency';
import { analyzeSafetyResults, } from './dimensions/safety';
import { analyzePerformanceResults, } from './dimensions/performance';
import { analyzeSchemaResults, } from './dimensions/dimension-schema';
export { validateEvalSpec, validateEvalSpecSafe, createDefaultEvalSpec, EXAMPLE_EVAL_SPEC, EvalSpecSchema, AgentEvalSpecSchema, TeamSpecSchema, FlowSpecSchema, ProjectConfigSchema, TestConfigSchema, SchemaFieldSchema, AgentTypeSchema, FrameworkSchema, OutputTypeSchema, TestSpecificationSchema, EvaluationCriterionSchema, TestThresholdsSchema, } from './types/eval-spec';
// Export test dimensions
export * from './dimensions/consistency';
export * from './dimensions/safety';
export * from './dimensions/performance';
export * from './dimensions/dimension-schema';
export { BasePromptExtractor, } from './analysis/prompt-extractor';
export { OpenAIProvider, AnthropicProvider, createLLMProvider, } from './analysis/llm-provider';
export { ContractAnalyzer, createContractAnalyzer, } from './analysis/contract-analyzer';
// Enhanced Discovery exports
export { VariableTracker, StringOperationDetector, } from './analysis/variable-tracker';
export { ImportResolver, } from './analysis/import-resolver';
export { EnhancedASTAnalyzer, } from './analysis/enhanced-ast';
export { ProjectScanner, FileRelationshipAnalyzer, } from './analysis/project-scanner';
export { CrossFileAnalyzer, PromptReconstructor, } from './analysis/cross-file';
export { ConfigParser, YAMLParser, JSONParser, TOMLParser, ConfigParserFactory, } from './analysis/config-parser';
export { ComprehensivePromptDiscovery, } from './analysis/comprehensive-discovery';
// Export orchestration components
export * from './orchestration';
// Export generic test generator (replaces hardcoded dimension generators)
export { generateTestsFromDimension, } from './dimensions/generic-test-generator';
// Export dimension registry
export { DefaultDimensionRegistry, createDimensionRegistry, } from './dimensions/dimension-registry';
// Export dimension file system
export { DimensionDefinitionSchema, DimensionContextSchema, validateDimensionDefinition, validateDimensionDefinitionSafe, createDefaultDimensionDefinition, } from './dimensions/dimension-definition';
export { DimensionFileLoader, } from './dimensions/dimension-file-loader';
export { loadCoreDimensionDefinitions, } from './dimensions/dimension-registry';
// Export dimension metadata service
export { DimensionMetadataService, createDimensionMetadataService, } from './dimensions/dimension-metadata';
// Export prompt templates (Phase 1: Shared Infrastructure)
export { SHARED_PROMPTS, PromptBuilder, formatCriteriaContext, } from './prompts/prompt-templates';
// Export dimension context utilities (Phase 1: Shared Infrastructure)
export { DIMENSION_CONTEXT, DimensionValidator, DimensionDocGenerator, } from './dimensions/dimension-context';
// Export configuration management
export { ConfigManager, getGlobalConfig, setGlobalConfig, initializeConfig, } from './config/config-manager';
// Export services
export { EvalSpecManager, } from './services/eval-spec-manager';
export { YamlGenerator, } from './services/yaml-generator';
export { VersionManager, } from './services/version-manager';
/**
 * Version of the core package
 */
export const VERSION = '0.1.0';
/**
 * Main evaluation engine class
 */
export class EvaluationEngine {
    config;
    adapters = new Map();
    constructor(config = {}) {
        this.config = {
            verbose: false,
            parallel: false,
            maxConcurrency: 1,
            globalTimeoutMs: 300000, // 5 minutes
            outputDir: './eval-results',
            ...config,
        };
    }
    /**
     * Register a framework adapter
     */
    registerAdapter(adapter) {
        this.adapters.set(adapter.name, adapter);
        if (this.config.verbose) {
            console.log(`Registered adapter: ${adapter.name}`);
        }
    }
    /**
     * Get registered adapter by name
     */
    getAdapter(name) {
        return this.adapters.get(name);
    }
    /**
     * List all registered adapters
     */
    listAdapters() {
        return Array.from(this.adapters.keys());
    }
    /**
     * Detect which framework is used in a project
     */
    async detectFramework(projectPath) {
        for (const [name, adapter] of this.adapters) {
            try {
                const detected = await adapter.detect(projectPath);
                if (detected) {
                    if (this.config.verbose) {
                        console.log(`Detected framework: ${name}`);
                    }
                    return name;
                }
            }
            catch (error) {
                if (this.config.verbose) {
                    console.error(`Error detecting ${name}:`, error);
                }
            }
        }
        return null;
    }
    /**
     * Run evaluation for a project
     */
    async evaluate(projectPath, evalSpec) {
        const results = new Map();
        // Get the appropriate adapter
        const adapter = this.adapters.get(evalSpec.project.framework);
        if (!adapter) {
            throw new Error(`No adapter registered for framework: ${evalSpec.project.framework}`);
        }
        // Discover agents
        const agents = await adapter.discoverAgents(projectPath);
        if (this.config.verbose) {
            console.log(`Discovered ${agents.length} agents`);
        }
        // Evaluate each agent
        for (const agent of agents) {
            const agentSpec = evalSpec.agents[agent.name];
            if (!agentSpec) {
                if (this.config.verbose) {
                    console.log(`No evaluation spec for agent: ${agent.name}`);
                }
                continue;
            }
            // Analyze agent
            const spec = await adapter.analyzeAgent(agent.path);
            // Run tests
            const context = {
                projectPath,
                timeoutMs: 30000, // Default timeout, now configured via eval.config.yml
                verbose: this.config.verbose,
            };
            const testResults = await adapter.runTests(agent, spec, context);
            results.set(agent.name, testResults);
            if (this.config.verbose) {
                console.log(`Evaluated agent: ${agent.name}`);
                console.log(`  Success rate: ${testResults.summary.successRate * 100}%`);
            }
        }
        return results;
    }
    /**
     * Generate evaluation report
     */
    generateReport(results) {
        let report = '# Evaluation Report\n\n';
        report += `Generated: ${new Date().toISOString()}\n\n`;
        for (const [agentName, testResults] of results) {
            report += `## Agent: ${agentName}\n\n`;
            // Summary
            report += '### Summary\n';
            report += `- Total Tests: ${testResults.summary.totalTests}\n`;
            report += `- Passed: ${testResults.summary.passed}\n`;
            report += `- Failed: ${testResults.summary.failed}\n`;
            report += `- Success Rate: ${(testResults.summary.successRate * 100).toFixed(1)}%\n`;
            report += `- Average Latency: ${testResults.summary.averageLatencyMs.toFixed(0)}ms\n\n`;
            // Dimension results
            if (testResults.dimensions.consistency) {
                report += '### Consistency\n';
                const analysis = analyzeConsistencyDimensions(testResults.dimensions.consistency);
                report += `${analysis.interpretation}\n`;
                report += `Score: ${(analysis.score * 100).toFixed(1)}%\n\n`;
            }
            if (testResults.dimensions.safety) {
                report += '### Safety\n';
                const analysis = analyzeSafetyResults(testResults.dimensions.safety);
                report += `${analysis.interpretation}\n`;
                report += `Risk Level: ${analysis.riskLevel}\n\n`;
            }
            if (testResults.dimensions.performance) {
                report += '### Performance\n';
                const analysis = analyzePerformanceResults(testResults.dimensions.performance);
                report += `${analysis.interpretation}\n`;
                report += `Grade: ${analysis.performanceGrade}\n\n`;
            }
            if (testResults.dimensions.schema) {
                report += '### Schema Compliance\n';
                const analysis = analyzeSchemaResults(testResults.dimensions.schema, {});
                report += `${analysis.interpretation}\n`;
                report += `Grade: ${analysis.schemaGrade}\n\n`;
            }
            report += '---\n\n';
        }
        return report;
    }
}
/**
 * Create a new evaluation engine instance
 */
export function createEvaluationEngine(config) {
    return new EvaluationEngine(config);
}
//# sourceMappingURL=index.js.map