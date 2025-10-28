"use strict";
/**
 * LangChain Adapter for Identro Eval
 *
 * This package provides automatic evaluation capabilities for LangChain agents.
 * It discovers agents in your codebase, analyzes their capabilities, and runs
 * comprehensive evaluation tests without requiring manual configuration.
 *
 * @packageDocumentation
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
exports.classifyAgentType = exports.getFileLanguage = exports.shouldExcludePath = exports.EXCLUDE_DIRS = exports.SCAN_EXTENSIONS = exports.CONFIG_FILE_PATTERNS = exports.LLM_ENV_PATTERNS = exports.LLM_CONFIG_PATTERNS = exports.TYPESCRIPT_AGENT_PATTERNS = exports.PYTHON_AGENT_PATTERNS = exports.TYPESCRIPT_IMPORT_PATTERNS = exports.PYTHON_IMPORT_PATTERNS = exports.createLangChainPromptExtractor = exports.LangChainPromptExtractor = exports.discoverAgentsWithDetails = exports.discoverAgents = exports.validate = exports.detectWithDetails = exports.detect = exports.LangChainAdapter = void 0;
exports.evaluateLangChainProject = evaluateLangChainProject;
exports.evaluateAndReport = evaluateAndReport;
// Main adapter
const adapter_1 = require("./adapter");
Object.defineProperty(exports, "LangChainAdapter", { enumerable: true, get: function () { return adapter_1.LangChainAdapter; } });
// Detection utilities
var detector_1 = require("./detector");
Object.defineProperty(exports, "detect", { enumerable: true, get: function () { return detector_1.detect; } });
Object.defineProperty(exports, "detectWithDetails", { enumerable: true, get: function () { return detector_1.detectWithDetails; } });
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return detector_1.validate; } });
// Discovery utilities
var discovery_1 = require("./discovery");
Object.defineProperty(exports, "discoverAgents", { enumerable: true, get: function () { return discovery_1.discoverAgents; } });
Object.defineProperty(exports, "discoverAgentsWithDetails", { enumerable: true, get: function () { return discovery_1.discoverAgentsWithDetails; } });
// Prompt extraction utilities
var prompt_extractor_1 = require("./prompt-extractor");
Object.defineProperty(exports, "LangChainPromptExtractor", { enumerable: true, get: function () { return prompt_extractor_1.LangChainPromptExtractor; } });
Object.defineProperty(exports, "createLangChainPromptExtractor", { enumerable: true, get: function () { return prompt_extractor_1.createLangChainPromptExtractor; } });
// Pattern utilities
var patterns_1 = require("./utils/patterns");
Object.defineProperty(exports, "PYTHON_IMPORT_PATTERNS", { enumerable: true, get: function () { return patterns_1.PYTHON_IMPORT_PATTERNS; } });
Object.defineProperty(exports, "TYPESCRIPT_IMPORT_PATTERNS", { enumerable: true, get: function () { return patterns_1.TYPESCRIPT_IMPORT_PATTERNS; } });
Object.defineProperty(exports, "PYTHON_AGENT_PATTERNS", { enumerable: true, get: function () { return patterns_1.PYTHON_AGENT_PATTERNS; } });
Object.defineProperty(exports, "TYPESCRIPT_AGENT_PATTERNS", { enumerable: true, get: function () { return patterns_1.TYPESCRIPT_AGENT_PATTERNS; } });
Object.defineProperty(exports, "LLM_CONFIG_PATTERNS", { enumerable: true, get: function () { return patterns_1.LLM_CONFIG_PATTERNS; } });
Object.defineProperty(exports, "LLM_ENV_PATTERNS", { enumerable: true, get: function () { return patterns_1.LLM_ENV_PATTERNS; } });
Object.defineProperty(exports, "CONFIG_FILE_PATTERNS", { enumerable: true, get: function () { return patterns_1.CONFIG_FILE_PATTERNS; } });
Object.defineProperty(exports, "SCAN_EXTENSIONS", { enumerable: true, get: function () { return patterns_1.SCAN_EXTENSIONS; } });
Object.defineProperty(exports, "EXCLUDE_DIRS", { enumerable: true, get: function () { return patterns_1.EXCLUDE_DIRS; } });
Object.defineProperty(exports, "shouldExcludePath", { enumerable: true, get: function () { return patterns_1.shouldExcludePath; } });
Object.defineProperty(exports, "getFileLanguage", { enumerable: true, get: function () { return patterns_1.getFileLanguage; } });
Object.defineProperty(exports, "classifyAgentType", { enumerable: true, get: function () { return patterns_1.classifyAgentType; } });
/**
 * Default export - LangChain adapter instance
 */
const adapter = new adapter_1.LangChainAdapter();
exports.default = adapter;
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
async function evaluateLangChainProject(projectPath) {
    const adapter = new adapter_1.LangChainAdapter();
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
async function evaluateAndReport(projectPath, options = {}) {
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
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
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