/**
 * LangChain Adapter for Identro Eval
 *
 * This package provides automatic evaluation capabilities for LangChain agents.
 * It discovers agents in your codebase, analyzes their capabilities, and runs
 * comprehensive evaluation tests without requiring manual configuration.
 *
 * @packageDocumentation
 */
// Main adapter
import { LangChainAdapter } from './adapter';
export { LangChainAdapter };
// Detection utilities
export { detect, detectWithDetails, validate } from './detector';
// Discovery utilities
export { discoverAgents, discoverAgentsWithDetails } from './discovery';
// Prompt extraction utilities
export { LangChainPromptExtractor, createLangChainPromptExtractor } from './prompt-extractor';
// Pattern utilities
export { PYTHON_IMPORT_PATTERNS, TYPESCRIPT_IMPORT_PATTERNS, PYTHON_AGENT_PATTERNS, TYPESCRIPT_AGENT_PATTERNS, LLM_CONFIG_PATTERNS, LLM_ENV_PATTERNS, CONFIG_FILE_PATTERNS, SCAN_EXTENSIONS, EXCLUDE_DIRS, shouldExcludePath, getFileLanguage, classifyAgentType, } from './utils/patterns';
/**
 * Default export - LangChain adapter instance
 */
const adapter = new LangChainAdapter();
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
export async function evaluateLangChainProject(projectPath) {
    const adapter = new LangChainAdapter();
    // Detect LangChain
    const detected = await adapter.detect(projectPath);
    if (!detected) {
        return {
            detected: false,
            agents: [],
            results: [],
            averageScore: 0,
            errors: ['LangChain not detected in project'],
        };
    }
    // Validate setup
    const validation = await adapter.validate(projectPath);
    if (!validation.valid) {
        return {
            detected: true,
            agents: [],
            results: [],
            averageScore: 0,
            errors: validation.errors || [],
        };
    }
    // Discover agents
    const agents = await adapter.discoverAgents(projectPath);
    if (agents.length === 0) {
        return {
            detected: true,
            agents: [],
            results: [],
            averageScore: 0,
            errors: ['No agents found in project'],
        };
    }
    // Evaluate each agent
    const results = [];
    let totalScore = 0;
    for (const agent of agents) {
        try {
            const spec = await adapter.analyzeAgent(agent.path);
            const testResults = await adapter.runTests(agent, spec, {
                projectPath,
                verbose: false,
                timeoutMs: 30000,
            });
            results.push({
                agent,
                spec,
                results: testResults,
                score: testResults.summary.successRate * 100,
            });
            totalScore += testResults.summary.successRate * 100;
        }
        catch (error) {
            console.error(`Error evaluating agent ${agent.name}:`, error);
            results.push({
                agent,
                error: error.message,
                score: 0,
            });
        }
    }
    return {
        detected: true,
        agents,
        results,
        averageScore: results.length > 0 ? totalScore / results.length : 0,
        errors: [],
    };
}
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
export async function evaluateAndReport(projectPath, options = {}) {
    const { verbose = false, outputFormat = 'text' } = options;
    if (verbose) {
        console.log('🔍 Detecting LangChain in project...');
    }
    const results = await evaluateLangChainProject(projectPath);
    if (!results.detected) {
        console.error('❌ LangChain not detected in project');
        return;
    }
    if (results.errors.length > 0) {
        console.error('❌ Errors found:');
        results.errors.forEach(error => console.error(`  - ${error}`));
        return;
    }
    if (verbose) {
        console.log(`✅ Found ${results.agents.length} agents`);
    }
    // Format output based on requested format
    switch (outputFormat) {
        case 'json':
            console.log(JSON.stringify(results, null, 2));
            break;
        case 'html':
            // HTML output would be implemented here
            console.log('HTML output not yet implemented');
            break;
        case 'text':
        default:
            console.log('\n📊 Evaluation Results\n');
            console.log('='.repeat(50));
            for (const result of results.results) {
                if (result.error) {
                    console.log(`\n❌ ${result.agent.name}: ERROR`);
                    console.log(`   ${result.error}`);
                }
                else {
                    console.log(`\n✅ ${result.agent.name}: ${result.score.toFixed(1)}%`);
                    console.log(`   Type: ${result.agent.type}`);
                    console.log(`   Path: ${result.agent.path}`);
                    if (result.results?.patterns) {
                        const patterns = result.results.patterns;
                        if (patterns.consistency) {
                            console.log(`   Consistency: ${patterns.consistency.isConsistent ? '✅' : '❌'}`);
                        }
                        if (patterns.safety) {
                            console.log(`   Safety Score: ${(patterns.safety.safetyScore * 100).toFixed(1)}%`);
                        }
                        if (patterns.performance) {
                            console.log(`   P50 Latency: ${patterns.performance.latencyPercentiles.p50}ms`);
                        }
                    }
                }
            }
            console.log('\n' + '='.repeat(50));
            console.log(`\n📈 Overall Score: ${results.averageScore.toFixed(1)}%\n`);
            break;
    }
    // Save to file if requested
    if (options.outputFile) {
        const fs = await import('fs/promises');
        const output = outputFormat === 'json'
            ? JSON.stringify(results, null, 2)
            : 'Text output saved to file';
        await fs.writeFile(options.outputFile, output, 'utf-8');
        if (verbose) {
            console.log(`📁 Results saved to ${options.outputFile}`);
        }
    }
}
//# sourceMappingURL=index.js.map