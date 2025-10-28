/**
 * @identro/eval-core - Core evaluation engine for AI agent testing
 */
import type { FrameworkAdapter, TestResults } from './types/framework';
import type { EvalSpec } from './types/eval-spec';
export { type AgentInfo, type AgentSpec, type FrameworkAdapter, type LLMConfig, type TestContext, type TestResult, type TestResults, type ConsistencyResult, type SafetyResult, type PerformanceResult, type SchemaResult, type DeterminismResult, } from './types/framework';
export { type EvalSpec, type AgentEvalSpec, type TeamSpec, type FlowSpec, type ProjectConfig, type TestConfig, type SchemaField, type AgentType, type Framework, type OutputType, type TestSpecification, type EvaluationCriterion, type TestThresholds, validateEvalSpec, validateEvalSpecSafe, createDefaultEvalSpec, EXAMPLE_EVAL_SPEC, EvalSpecSchema, AgentEvalSpecSchema, TeamSpecSchema, FlowSpecSchema, ProjectConfigSchema, TestConfigSchema, SchemaFieldSchema, AgentTypeSchema, FrameworkSchema, OutputTypeSchema, TestSpecificationSchema, EvaluationCriterionSchema, TestThresholdsSchema, } from './types/eval-spec';
export type { TestSpecification as TestSpec } from './types/eval-spec';
export { type TeamEntity, type TeamDiscoveryResult, type TeamExecutionResult, type WorkflowMetadata, type HumanInteractionPoint, type ExternalService, } from './types/team';
export { type FlowEntity, type FlowDiscoveryResult, type FlowExecutionResult, type FlowWorkflowMetadata, } from './types/flow';
export * from './dimensions/consistency';
export * from './dimensions/safety';
export * from './dimensions/performance';
export * from './dimensions/dimension-schema';
export { type ExtractedContract, type AnalysisInput, type ContractAnalysis, type GeneratedTestCase, type ExtractedPrompts, type TestExample, type PerformanceRequirements, type SchemaDefinition, type FrameworkHint, } from './analysis/types';
export { type PromptExtractor, BasePromptExtractor, } from './analysis/prompt-extractor';
export { type LLMProvider, type LLMProviderConfig, type AnalysisContext, OpenAIProvider, AnthropicProvider, createLLMProvider, } from './analysis/llm-provider';
export { type ContractAnalyzerConfig, ContractAnalyzer, createContractAnalyzer, } from './analysis/contract-analyzer';
export { type Variable, type VariableMutation, type VariableReference, type Scope, VariableTracker, StringOperationDetector, } from './analysis/variable-tracker';
export { type Import, type ImportedItem, type Export, type ExportedItem, type DependencyNode, type DependencyGraph, ImportResolver, } from './analysis/import-resolver';
export { type VariableMap, type StringOperation, type EnhancedASTResult, type ExtractedPrompt, EnhancedASTAnalyzer, } from './analysis/enhanced-ast';
export { type ProjectFile, type ProjectIndex, type ScanOptions, ProjectScanner, FileRelationshipAnalyzer, } from './analysis/project-scanner';
export { type PromptFragment, type ResolvedPrompt, type CrossFileVariable, type ProjectAnalysis, CrossFileAnalyzer, PromptReconstructor, } from './analysis/cross-file';
export { type ConfigPrompt, type ParsedConfig, ConfigParser, YAMLParser, JSONParser, TOMLParser, ConfigParserFactory, } from './analysis/config-parser';
export { type DiscoveredPrompts, type DiscoveryOptions, type AnalysisResult, type DiscoveryReport, ComprehensivePromptDiscovery, } from './analysis/comprehensive-discovery';
export * from './orchestration';
export { generateTestsFromDimension, } from './dimensions/generic-test-generator';
export { type DimensionRegistry, DefaultDimensionRegistry, createDimensionRegistry, } from './dimensions/dimension-registry';
export { type DimensionDefinition, type DimensionConfig, type DimensionPrompts, type DimensionMetadata, type DimensionContext, DimensionDefinitionSchema, DimensionContextSchema, validateDimensionDefinition, validateDimensionDefinitionSafe, createDefaultDimensionDefinition, } from './dimensions/dimension-definition';
export { type DimensionFileLoaderOptions, DimensionFileLoader, } from './dimensions/dimension-file-loader';
export { loadCoreDimensionDefinitions, } from './dimensions/dimension-registry';
export { type DimensionBehavior, type DimensionDisplayInfo, DimensionMetadataService, createDimensionMetadataService, } from './dimensions/dimension-metadata';
export { type PromptTemplate, SHARED_PROMPTS, PromptBuilder, formatCriteriaContext, } from './prompts/prompt-templates';
export { type DimensionContextTemplate, type DeveloperGuidanceTemplate, type DimensionMetadataTemplate, DIMENSION_CONTEXT, DimensionValidator, DimensionDocGenerator, } from './dimensions/dimension-context';
export { type EvalConfig, ConfigManager, getGlobalConfig, setGlobalConfig, initializeConfig, } from './config/config-manager';
export { EvalSpecManager, type ChangeDetectionResult, type AgentInfo as AgentInfoSpec, } from './services/eval-spec-manager';
export { YamlGenerator, type YamlGeneratorOptions, } from './services/yaml-generator';
export { VersionManager, type VersionManifest, type VersionEntry, type VersionConfig, type ChangeDetectionResult as VersionChangeDetectionResult, } from './services/version-manager';
/**
 * Version of the core package
 */
export declare const VERSION = "0.1.0";
/**
 * Core evaluation engine configuration
 */
export interface EvalEngineConfig {
    /** Verbose logging */
    verbose?: boolean;
    /** Parallel test execution */
    parallel?: boolean;
    /** Maximum concurrent tests */
    maxConcurrency?: number;
    /** Global timeout for all tests */
    globalTimeoutMs?: number;
    /** Output directory for reports */
    outputDir?: string;
}
/**
 * Main evaluation engine class
 */
export declare class EvaluationEngine {
    private config;
    private adapters;
    constructor(config?: EvalEngineConfig);
    /**
     * Register a framework adapter
     */
    registerAdapter(adapter: FrameworkAdapter): void;
    /**
     * Get registered adapter by name
     */
    getAdapter(name: string): FrameworkAdapter | undefined;
    /**
     * List all registered adapters
     */
    listAdapters(): string[];
    /**
     * Detect which framework is used in a project
     */
    detectFramework(projectPath: string): Promise<string | null>;
    /**
     * Run evaluation for a project
     */
    evaluate(projectPath: string, evalSpec: EvalSpec): Promise<Map<string, TestResults>>;
    /**
     * Generate evaluation report
     */
    generateReport(results: Map<string, TestResults>): string;
}
/**
 * Create a new evaluation engine instance
 */
export declare function createEvaluationEngine(config?: EvalEngineConfig): EvaluationEngine;
//# sourceMappingURL=index.d.ts.map