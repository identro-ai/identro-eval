/**
 * LangChain Adapter for Identro Eval
 *
 * This package provides automatic evaluation capabilities for LangChain agents.
 * It discovers agents in your codebase, analyzes their capabilities, and runs
 * comprehensive evaluation tests without requiring manual configuration.
 *
 * @packageDocumentation
 */
import { LangChainAdapter } from './adapter';
export { LangChainAdapter };
export { detect, detectWithDetails, validate } from './detector';
export type { DetectionResult } from './detector';
export { discoverAgents, discoverAgentsWithDetails } from './discovery';
export type { DiscoveredAgent } from './discovery';
export { LangChainPromptExtractor, createLangChainPromptExtractor } from './prompt-extractor';
export { PYTHON_IMPORT_PATTERNS, TYPESCRIPT_IMPORT_PATTERNS, PYTHON_AGENT_PATTERNS, TYPESCRIPT_AGENT_PATTERNS, LLM_CONFIG_PATTERNS, LLM_ENV_PATTERNS, CONFIG_FILE_PATTERNS, SCAN_EXTENSIONS, EXCLUDE_DIRS, shouldExcludePath, getFileLanguage, classifyAgentType, } from './utils/patterns';
export type { ImportPattern, AgentPattern } from './utils/patterns';
export type { FrameworkAdapter, AgentInfo, AgentSpec, AgentType, TestContext, TestResults, TestResult, ConsistencyResult, SafetyResult, PerformanceResult, SchemaResult, } from '@identro/eval-core';
/**
 * Default export - LangChain adapter instance
 */
declare const adapter: LangChainAdapter;
export default adapter;
/**
 * Quick start function for evaluating a LangChain project
 *
 * @example
 * ```typescript
 * import { evaluateLangChainProject } from '@identro/eval-langchain';
 *
 * const results = await evaluateLangChainProject('./my-langchain-project');
 * console.log(`Found ${results.agents.length} agents`);
 * console.log(`Average score: ${results.averageScore}%`);
 * ```
 */
export declare function evaluateLangChainProject(projectPath: string): Promise<{
    detected: boolean;
    agents: any[];
    results: any[];
    averageScore: number;
    errors: string[];
}>;
/**
 * CLI-friendly evaluation function
 *
 * @example
 * ```typescript
 * import { evaluateAndReport } from '@identro/eval-langchain';
 *
 * await evaluateAndReport('./my-project', {
 *   verbose: true,
 *   outputFormat: 'json',
 * });
 * ```
 */
export declare function evaluateAndReport(projectPath: string, options?: {
    verbose?: boolean;
    outputFormat?: 'json' | 'text' | 'html';
    outputFile?: string;
}): Promise<void>;
//# sourceMappingURL=index.d.ts.map