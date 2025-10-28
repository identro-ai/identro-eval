"use strict";
/**
 * @identro/eval-core - Core evaluation engine for AI agent testing
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHARED_PROMPTS = exports.createDimensionMetadataService = exports.DimensionMetadataService = exports.loadCoreDimensionDefinitions = exports.DimensionFileLoader = exports.createDefaultDimensionDefinition = exports.validateDimensionDefinitionSafe = exports.validateDimensionDefinition = exports.DimensionContextSchema = exports.DimensionDefinitionSchema = exports.createDimensionRegistry = exports.DefaultDimensionRegistry = exports.generateTestsFromDimension = exports.ComprehensivePromptDiscovery = exports.ConfigParserFactory = exports.TOMLParser = exports.JSONParser = exports.YAMLParser = exports.ConfigParser = exports.PromptReconstructor = exports.CrossFileAnalyzer = exports.FileRelationshipAnalyzer = exports.ProjectScanner = exports.EnhancedASTAnalyzer = exports.ImportResolver = exports.StringOperationDetector = exports.VariableTracker = exports.createContractAnalyzer = exports.ContractAnalyzer = exports.createLLMProvider = exports.AnthropicProvider = exports.OpenAIProvider = exports.BasePromptExtractor = exports.TestThresholdsSchema = exports.EvaluationCriterionSchema = exports.TestSpecificationSchema = exports.OutputTypeSchema = exports.FrameworkSchema = exports.AgentTypeSchema = exports.SchemaFieldSchema = exports.TestConfigSchema = exports.ProjectConfigSchema = exports.FlowSpecSchema = exports.TeamSpecSchema = exports.AgentEvalSpecSchema = exports.EvalSpecSchema = exports.EXAMPLE_EVAL_SPEC = exports.createDefaultEvalSpec = exports.validateEvalSpecSafe = exports.validateEvalSpec = void 0;
exports.EvaluationEngine = exports.VERSION = exports.VersionManager = exports.YamlGenerator = exports.EvalSpecManager = exports.initializeConfig = exports.setGlobalConfig = exports.getGlobalConfig = exports.ConfigManager = exports.DimensionDocGenerator = exports.DimensionValidator = exports.DIMENSION_CONTEXT = exports.formatCriteriaContext = exports.PromptBuilder = void 0;
exports.createEvaluationEngine = createEvaluationEngine;
const consistency_1 = require("./dimensions/consistency");
const safety_1 = require("./dimensions/safety");
const performance_1 = require("./dimensions/performance");
const dimension_schema_1 = require("./dimensions/dimension-schema");
var eval_spec_1 = require("./types/eval-spec");
Object.defineProperty(exports, "validateEvalSpec", { enumerable: true, get: function () { return eval_spec_1.validateEvalSpec; } });
Object.defineProperty(exports, "validateEvalSpecSafe", { enumerable: true, get: function () { return eval_spec_1.validateEvalSpecSafe; } });
Object.defineProperty(exports, "createDefaultEvalSpec", { enumerable: true, get: function () { return eval_spec_1.createDefaultEvalSpec; } });
Object.defineProperty(exports, "EXAMPLE_EVAL_SPEC", { enumerable: true, get: function () { return eval_spec_1.EXAMPLE_EVAL_SPEC; } });
Object.defineProperty(exports, "EvalSpecSchema", { enumerable: true, get: function () { return eval_spec_1.EvalSpecSchema; } });
Object.defineProperty(exports, "AgentEvalSpecSchema", { enumerable: true, get: function () { return eval_spec_1.AgentEvalSpecSchema; } });
Object.defineProperty(exports, "TeamSpecSchema", { enumerable: true, get: function () { return eval_spec_1.TeamSpecSchema; } });
Object.defineProperty(exports, "FlowSpecSchema", { enumerable: true, get: function () { return eval_spec_1.FlowSpecSchema; } });
Object.defineProperty(exports, "ProjectConfigSchema", { enumerable: true, get: function () { return eval_spec_1.ProjectConfigSchema; } });
Object.defineProperty(exports, "TestConfigSchema", { enumerable: true, get: function () { return eval_spec_1.TestConfigSchema; } });
Object.defineProperty(exports, "SchemaFieldSchema", { enumerable: true, get: function () { return eval_spec_1.SchemaFieldSchema; } });
Object.defineProperty(exports, "AgentTypeSchema", { enumerable: true, get: function () { return eval_spec_1.AgentTypeSchema; } });
Object.defineProperty(exports, "FrameworkSchema", { enumerable: true, get: function () { return eval_spec_1.FrameworkSchema; } });
Object.defineProperty(exports, "OutputTypeSchema", { enumerable: true, get: function () { return eval_spec_1.OutputTypeSchema; } });
Object.defineProperty(exports, "TestSpecificationSchema", { enumerable: true, get: function () { return eval_spec_1.TestSpecificationSchema; } });
Object.defineProperty(exports, "EvaluationCriterionSchema", { enumerable: true, get: function () { return eval_spec_1.EvaluationCriterionSchema; } });
Object.defineProperty(exports, "TestThresholdsSchema", { enumerable: true, get: function () { return eval_spec_1.TestThresholdsSchema; } });
// Export test dimensions
__exportStar(require("./dimensions/consistency"), exports);
__exportStar(require("./dimensions/safety"), exports);
__exportStar(require("./dimensions/performance"), exports);
__exportStar(require("./dimensions/dimension-schema"), exports);
var prompt_extractor_1 = require("./analysis/prompt-extractor");
Object.defineProperty(exports, "BasePromptExtractor", { enumerable: true, get: function () { return prompt_extractor_1.BasePromptExtractor; } });
var llm_provider_1 = require("./analysis/llm-provider");
Object.defineProperty(exports, "OpenAIProvider", { enumerable: true, get: function () { return llm_provider_1.OpenAIProvider; } });
Object.defineProperty(exports, "AnthropicProvider", { enumerable: true, get: function () { return llm_provider_1.AnthropicProvider; } });
Object.defineProperty(exports, "createLLMProvider", { enumerable: true, get: function () { return llm_provider_1.createLLMProvider; } });
var contract_analyzer_1 = require("./analysis/contract-analyzer");
Object.defineProperty(exports, "ContractAnalyzer", { enumerable: true, get: function () { return contract_analyzer_1.ContractAnalyzer; } });
Object.defineProperty(exports, "createContractAnalyzer", { enumerable: true, get: function () { return contract_analyzer_1.createContractAnalyzer; } });
// Enhanced Discovery exports
var variable_tracker_1 = require("./analysis/variable-tracker");
Object.defineProperty(exports, "VariableTracker", { enumerable: true, get: function () { return variable_tracker_1.VariableTracker; } });
Object.defineProperty(exports, "StringOperationDetector", { enumerable: true, get: function () { return variable_tracker_1.StringOperationDetector; } });
var import_resolver_1 = require("./analysis/import-resolver");
Object.defineProperty(exports, "ImportResolver", { enumerable: true, get: function () { return import_resolver_1.ImportResolver; } });
var enhanced_ast_1 = require("./analysis/enhanced-ast");
Object.defineProperty(exports, "EnhancedASTAnalyzer", { enumerable: true, get: function () { return enhanced_ast_1.EnhancedASTAnalyzer; } });
var project_scanner_1 = require("./analysis/project-scanner");
Object.defineProperty(exports, "ProjectScanner", { enumerable: true, get: function () { return project_scanner_1.ProjectScanner; } });
Object.defineProperty(exports, "FileRelationshipAnalyzer", { enumerable: true, get: function () { return project_scanner_1.FileRelationshipAnalyzer; } });
var cross_file_1 = require("./analysis/cross-file");
Object.defineProperty(exports, "CrossFileAnalyzer", { enumerable: true, get: function () { return cross_file_1.CrossFileAnalyzer; } });
Object.defineProperty(exports, "PromptReconstructor", { enumerable: true, get: function () { return cross_file_1.PromptReconstructor; } });
var config_parser_1 = require("./analysis/config-parser");
Object.defineProperty(exports, "ConfigParser", { enumerable: true, get: function () { return config_parser_1.ConfigParser; } });
Object.defineProperty(exports, "YAMLParser", { enumerable: true, get: function () { return config_parser_1.YAMLParser; } });
Object.defineProperty(exports, "JSONParser", { enumerable: true, get: function () { return config_parser_1.JSONParser; } });
Object.defineProperty(exports, "TOMLParser", { enumerable: true, get: function () { return config_parser_1.TOMLParser; } });
Object.defineProperty(exports, "ConfigParserFactory", { enumerable: true, get: function () { return config_parser_1.ConfigParserFactory; } });
var comprehensive_discovery_1 = require("./analysis/comprehensive-discovery");
Object.defineProperty(exports, "ComprehensivePromptDiscovery", { enumerable: true, get: function () { return comprehensive_discovery_1.ComprehensivePromptDiscovery; } });
// Export orchestration components
__exportStar(require("./orchestration"), exports);
// Export generic test generator (replaces hardcoded dimension generators)
var generic_test_generator_1 = require("./dimensions/generic-test-generator");
Object.defineProperty(exports, "generateTestsFromDimension", { enumerable: true, get: function () { return generic_test_generator_1.generateTestsFromDimension; } });
// Export dimension registry
var dimension_registry_1 = require("./dimensions/dimension-registry");
Object.defineProperty(exports, "DefaultDimensionRegistry", { enumerable: true, get: function () { return dimension_registry_1.DefaultDimensionRegistry; } });
Object.defineProperty(exports, "createDimensionRegistry", { enumerable: true, get: function () { return dimension_registry_1.createDimensionRegistry; } });
// Export dimension file system
var dimension_definition_1 = require("./dimensions/dimension-definition");
Object.defineProperty(exports, "DimensionDefinitionSchema", { enumerable: true, get: function () { return dimension_definition_1.DimensionDefinitionSchema; } });
Object.defineProperty(exports, "DimensionContextSchema", { enumerable: true, get: function () { return dimension_definition_1.DimensionContextSchema; } });
Object.defineProperty(exports, "validateDimensionDefinition", { enumerable: true, get: function () { return dimension_definition_1.validateDimensionDefinition; } });
Object.defineProperty(exports, "validateDimensionDefinitionSafe", { enumerable: true, get: function () { return dimension_definition_1.validateDimensionDefinitionSafe; } });
Object.defineProperty(exports, "createDefaultDimensionDefinition", { enumerable: true, get: function () { return dimension_definition_1.createDefaultDimensionDefinition; } });
var dimension_file_loader_1 = require("./dimensions/dimension-file-loader");
Object.defineProperty(exports, "DimensionFileLoader", { enumerable: true, get: function () { return dimension_file_loader_1.DimensionFileLoader; } });
var dimension_registry_2 = require("./dimensions/dimension-registry");
Object.defineProperty(exports, "loadCoreDimensionDefinitions", { enumerable: true, get: function () { return dimension_registry_2.loadCoreDimensionDefinitions; } });
// Export dimension metadata service
var dimension_metadata_1 = require("./dimensions/dimension-metadata");
Object.defineProperty(exports, "DimensionMetadataService", { enumerable: true, get: function () { return dimension_metadata_1.DimensionMetadataService; } });
Object.defineProperty(exports, "createDimensionMetadataService", { enumerable: true, get: function () { return dimension_metadata_1.createDimensionMetadataService; } });
// Export prompt templates (Phase 1: Shared Infrastructure)
var prompt_templates_1 = require("./prompts/prompt-templates");
Object.defineProperty(exports, "SHARED_PROMPTS", { enumerable: true, get: function () { return prompt_templates_1.SHARED_PROMPTS; } });
Object.defineProperty(exports, "PromptBuilder", { enumerable: true, get: function () { return prompt_templates_1.PromptBuilder; } });
Object.defineProperty(exports, "formatCriteriaContext", { enumerable: true, get: function () { return prompt_templates_1.formatCriteriaContext; } });
// Export dimension context utilities (Phase 1: Shared Infrastructure)
var dimension_context_1 = require("./dimensions/dimension-context");
Object.defineProperty(exports, "DIMENSION_CONTEXT", { enumerable: true, get: function () { return dimension_context_1.DIMENSION_CONTEXT; } });
Object.defineProperty(exports, "DimensionValidator", { enumerable: true, get: function () { return dimension_context_1.DimensionValidator; } });
Object.defineProperty(exports, "DimensionDocGenerator", { enumerable: true, get: function () { return dimension_context_1.DimensionDocGenerator; } });
// Export configuration management
var config_manager_1 = require("./config/config-manager");
Object.defineProperty(exports, "ConfigManager", { enumerable: true, get: function () { return config_manager_1.ConfigManager; } });
Object.defineProperty(exports, "getGlobalConfig", { enumerable: true, get: function () { return config_manager_1.getGlobalConfig; } });
Object.defineProperty(exports, "setGlobalConfig", { enumerable: true, get: function () { return config_manager_1.setGlobalConfig; } });
Object.defineProperty(exports, "initializeConfig", { enumerable: true, get: function () { return config_manager_1.initializeConfig; } });
// Export services
var eval_spec_manager_1 = require("./services/eval-spec-manager");
Object.defineProperty(exports, "EvalSpecManager", { enumerable: true, get: function () { return eval_spec_manager_1.EvalSpecManager; } });
var yaml_generator_1 = require("./services/yaml-generator");
Object.defineProperty(exports, "YamlGenerator", { enumerable: true, get: function () { return yaml_generator_1.YamlGenerator; } });
var version_manager_1 = require("./services/version-manager");
Object.defineProperty(exports, "VersionManager", { enumerable: true, get: function () { return version_manager_1.VersionManager; } });
/**
 * Version of the core package
 */
exports.VERSION = '0.1.0';
/**
 * Main evaluation engine class
 */
class EvaluationEngine {
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
                const analysis = (0, consistency_1.analyzeConsistencyDimensions)(testResults.dimensions.consistency);
                report += `${analysis.interpretation}\n`;
                report += `Score: ${(analysis.score * 100).toFixed(1)}%\n\n`;
            }
            if (testResults.dimensions.safety) {
                report += '### Safety\n';
                const analysis = (0, safety_1.analyzeSafetyResults)(testResults.dimensions.safety);
                report += `${analysis.interpretation}\n`;
                report += `Risk Level: ${analysis.riskLevel}\n\n`;
            }
            if (testResults.dimensions.performance) {
                report += '### Performance\n';
                const analysis = (0, performance_1.analyzePerformanceResults)(testResults.dimensions.performance);
                report += `${analysis.interpretation}\n`;
                report += `Grade: ${analysis.performanceGrade}\n\n`;
            }
            if (testResults.dimensions.schema) {
                report += '### Schema Compliance\n';
                const analysis = (0, dimension_schema_1.analyzeSchemaResults)(testResults.dimensions.schema, {});
                report += `${analysis.interpretation}\n`;
                report += `Grade: ${analysis.schemaGrade}\n\n`;
            }
            report += '---\n\n';
        }
        return report;
    }
}
exports.EvaluationEngine = EvaluationEngine;
/**
 * Create a new evaluation engine instance
 */
function createEvaluationEngine(config) {
    return new EvaluationEngine(config);
}
//# sourceMappingURL=index.js.map