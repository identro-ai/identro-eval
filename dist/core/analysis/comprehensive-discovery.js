/**
 * Comprehensive prompt discovery system
 *
 * Main orchestrator that combines all discovery methods to find
 * and reconstruct prompts from any source.
 */
import * as path from 'path';
import { ProjectScanner } from './project-scanner';
import { CrossFileAnalyzer, PromptReconstructor } from './cross-file';
import { ConfigParserFactory } from './config-parser';
import { EnhancedASTAnalyzer } from './enhanced-ast';
/**
 * Main discovery orchestrator
 */
export class ComprehensivePromptDiscovery {
    projectRoot;
    scanner;
    crossFileAnalyzer;
    astAnalyzer;
    constructor(projectRoot) {
        this.projectRoot = path.resolve(projectRoot);
        this.scanner = new ProjectScanner(this.projectRoot);
        this.crossFileAnalyzer = new CrossFileAnalyzer(this.projectRoot);
        this.astAnalyzer = new EnhancedASTAnalyzer(this.projectRoot);
    }
    /**
     * Discover all prompts in the project
     */
    async discoverAll(_projectPath, options = {}) {
        const { includeConfigs = true, includeDynamic = true, followImports = true, extensions = ['.py', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.yml', '.yaml', '.json', '.toml'], ignore = ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/dist/**', '**/build/**'], } = options;
        // Use projectPath if provided, otherwise use projectRoot
        const discovered = {
            prompts: [],
            sources: {
                code: [],
                config: [],
                dynamic: [],
            },
            statistics: {
                totalPrompts: 0,
                completePrompts: 0,
                partialPrompts: 0,
                filesAnalyzed: 0,
                configFiles: 0,
                codeFiles: 0,
                averageConfidence: 0,
            },
            errors: [],
        };
        try {
            // Scan project
            const index = await this.scanner.scan({
                extensions,
                ignore,
                includeContent: false,
            });
            discovered.statistics.filesAnalyzed = index.files.size;
            // Separate config and code files
            const configFiles = [];
            const codeFiles = [];
            for (const file of index.files.values()) {
                if (['.yaml', '.yml', '.json', '.toml'].includes(file.extension)) {
                    configFiles.push(file.path);
                }
                else {
                    codeFiles.push(file.path);
                }
            }
            discovered.statistics.configFiles = configFiles.length;
            discovered.statistics.codeFiles = codeFiles.length;
            // Discover from code files
            if (codeFiles.length > 0) {
                const codePrompts = await this.discoverFromCode(codeFiles, followImports);
                discovered.sources.code = codePrompts;
                discovered.prompts.push(...codePrompts);
            }
            // Discover from config files
            if (includeConfigs && configFiles.length > 0) {
                const configPrompts = await this.discoverFromConfigs(configFiles);
                discovered.sources.config = configPrompts;
                discovered.prompts.push(...configPrompts);
            }
            // Discover dynamic constructions
            if (includeDynamic) {
                const dynamicPrompts = await this.discoverDynamicPrompts(codeFiles);
                discovered.sources.dynamic = dynamicPrompts;
                discovered.prompts.push(...dynamicPrompts);
            }
            // Deduplicate prompts
            discovered.prompts = this.deduplicatePrompts(discovered.prompts);
            // Calculate statistics
            discovered.statistics.totalPrompts = discovered.prompts.length;
            discovered.statistics.completePrompts = discovered.prompts.filter(p => p.type === 'complete').length;
            discovered.statistics.partialPrompts = discovered.prompts.filter(p => p.type === 'partial').length;
            if (discovered.prompts.length > 0) {
                const totalConfidence = discovered.prompts.reduce((sum, p) => sum + p.confidence, 0);
                discovered.statistics.averageConfidence = totalConfidence / discovered.prompts.length;
            }
        }
        catch (error) {
            discovered.errors.push(`Discovery failed: ${error}`);
        }
        return discovered;
    }
    /**
     * Discover prompts from code files
     */
    async discoverFromCode(files, followImports) {
        const prompts = [];
        try {
            if (followImports) {
                // Use cross-file analysis
                const analysis = await this.crossFileAnalyzer.analyzeProject();
                prompts.push(...analysis.prompts);
            }
            else {
                // Analyze files individually
                for (const file of files) {
                    try {
                        const content = await this.scanner.getFileContent(file);
                        if (content) {
                            const result = await this.astAnalyzer.analyzeFile(file, content);
                            // Convert to ResolvedPrompt format
                            for (const prompt of result.prompts) {
                                prompts.push({
                                    name: prompt.name,
                                    content: prompt.content,
                                    fragments: [{
                                            content: prompt.content,
                                            file,
                                            lineNumber: prompt.location.lineNumber,
                                            variables: prompt.variables,
                                            type: 'base',
                                        }],
                                    variables: new Map(prompt.variables.map(v => [v, undefined])),
                                    files: [file],
                                    confidence: prompt.confidence,
                                    type: prompt.type === 'static' ? 'complete' : 'template',
                                });
                            }
                        }
                    }
                    catch (error) {
                        console.warn(`Failed to analyze ${file}:`, error);
                    }
                }
            }
        }
        catch (error) {
            console.error('Code discovery failed:', error);
        }
        return prompts;
    }
    /**
     * Discover prompts from config files
     */
    async discoverFromConfigs(files) {
        const prompts = [];
        for (const file of files) {
            try {
                const extracted = await ConfigParserFactory.parseFile(file);
                if (extracted) {
                    // Convert to ResolvedPrompt format
                    for (const template of extracted.templates) {
                        prompts.push({
                            name: template.name,
                            content: template.content,
                            fragments: [{
                                    content: template.content,
                                    file,
                                    lineNumber: template.lineNumber || 0,
                                    variables: template.variables,
                                    type: 'base',
                                }],
                            variables: new Map(template.variables.map(v => [v, undefined])),
                            files: [file],
                            confidence: 0.8, // Config files have high confidence
                            type: template.variables.length > 0 ? 'template' : 'complete',
                        });
                    }
                }
            }
            catch (error) {
                console.warn(`Failed to parse config ${file}:`, error);
            }
        }
        return prompts;
    }
    /**
     * Discover dynamically constructed prompts
     */
    async discoverDynamicPrompts(files) {
        const prompts = [];
        for (const file of files) {
            try {
                const content = await this.scanner.getFileContent(file);
                if (content) {
                    const result = await this.astAnalyzer.analyzeFile(file, content);
                    // Look for string operations that might build prompts
                    for (const op of result.stringOperations) {
                        if (op.result && this.looksLikePrompt(op.result)) {
                            prompts.push({
                                name: `dynamic_${path.basename(file)}_${op.lineNumber}`,
                                content: op.result,
                                fragments: [{
                                        content: op.result,
                                        file,
                                        lineNumber: op.lineNumber,
                                        variables: op.variables,
                                        type: 'base',
                                    }],
                                variables: new Map(op.variables.map(v => [v, undefined])),
                                files: [file],
                                confidence: 0.5, // Lower confidence for dynamic
                                type: 'partial',
                            });
                        }
                    }
                }
            }
            catch (error) {
                console.warn(`Failed to analyze dynamic prompts in ${file}:`, error);
            }
        }
        return prompts;
    }
    /**
     * Check if a string looks like a prompt
     */
    looksLikePrompt(text) {
        if (!text || text.length < 20)
            return false;
        const indicators = [
            /you are/i,
            /you will/i,
            /please/i,
            /should/i,
            /must/i,
            /task:/i,
            /instruction:/i,
            /goal:/i,
        ];
        return indicators.some(dimension => dimension.test(text));
    }
    /**
     * Deduplicate prompts
     */
    deduplicatePrompts(prompts) {
        const seen = new Map();
        for (const prompt of prompts) {
            const key = `${prompt.name}:${prompt.content.substring(0, 100)}`;
            if (!seen.has(key)) {
                seen.set(key, prompt);
            }
            else {
                // Merge information
                const existing = seen.get(key);
                existing.files = [...new Set([...existing.files, ...prompt.files])];
                existing.confidence = Math.max(existing.confidence, prompt.confidence);
                // Merge variables
                prompt.variables.forEach((value, key) => {
                    if (!existing.variables.has(key) || existing.variables.get(key) === undefined) {
                        existing.variables.set(key, value);
                    }
                });
            }
        }
        return Array.from(seen.values());
    }
    /**
     * Analyze discovered prompts with confidence scoring
     */
    async analyzeWithConfidence(prompts) {
        const report = this.generateReport(prompts);
        // Calculate overall confidence
        let confidence = 0;
        if (prompts.statistics.totalPrompts > 0) {
            // Base confidence from average
            confidence = prompts.statistics.averageConfidence;
            // Adjust based on completeness
            const completenessRatio = prompts.statistics.completePrompts / prompts.statistics.totalPrompts;
            confidence = confidence * 0.7 + completenessRatio * 0.3;
            // Adjust based on errors
            if (prompts.errors.length > 0) {
                confidence *= 0.9;
            }
        }
        return {
            prompts,
            confidence,
            report,
        };
    }
    /**
     * Generate discovery report
     */
    generateReport(result) {
        const report = {
            summary: this.generateSummary(result),
            details: {
                promptCount: result.statistics.totalPrompts,
                fileCount: result.statistics.filesAnalyzed,
                coverage: this.calculateCoverage(result),
                issues: this.identifyIssues(result),
                recommendations: this.generateRecommendations(result),
            },
            promptDetails: [],
        };
        // Add prompt details
        for (const prompt of result.prompts) {
            const validation = PromptReconstructor.validate(prompt);
            report.promptDetails.push({
                name: prompt.name,
                type: prompt.type,
                confidence: prompt.confidence,
                sources: prompt.files,
                variables: Array.from(prompt.variables.keys()),
                isComplete: validation.isComplete,
            });
        }
        return report;
    }
    /**
     * Generate summary text
     */
    generateSummary(result) {
        const lines = [];
        lines.push(`Discovered ${result.statistics.totalPrompts} prompts across ${result.statistics.filesAnalyzed} files.`);
        lines.push(`- ${result.statistics.completePrompts} complete prompts`);
        lines.push(`- ${result.statistics.partialPrompts} partial prompts`);
        lines.push(`- ${result.prompts.length - result.statistics.completePrompts - result.statistics.partialPrompts} template prompts`);
        if (result.sources.code.length > 0) {
            lines.push(`\nCode Analysis: ${result.sources.code.length} prompts from ${result.statistics.codeFiles} code files`);
        }
        if (result.sources.config.length > 0) {
            lines.push(`Config Files: ${result.sources.config.length} prompts from ${result.statistics.configFiles} config files`);
        }
        if (result.sources.dynamic.length > 0) {
            lines.push(`Dynamic Construction: ${result.sources.dynamic.length} dynamically built prompts detected`);
        }
        lines.push(`\nAverage Confidence: ${(result.statistics.averageConfidence * 100).toFixed(1)}%`);
        if (result.errors.length > 0) {
            lines.push(`\n⚠️ ${result.errors.length} errors encountered during discovery`);
        }
        return lines.join('\n');
    }
    /**
     * Calculate coverage percentage
     */
    calculateCoverage(result) {
        if (result.statistics.filesAnalyzed === 0)
            return 0;
        const filesWithPrompts = new Set();
        for (const prompt of result.prompts) {
            prompt.files.forEach(f => filesWithPrompts.add(f));
        }
        return (filesWithPrompts.size / result.statistics.filesAnalyzed) * 100;
    }
    /**
     * Identify issues in discovered prompts
     */
    identifyIssues(result) {
        const issues = [];
        // Check for incomplete prompts
        const incompleteCount = result.prompts.filter(p => {
            const validation = PromptReconstructor.validate(p);
            return !validation.isComplete;
        }).length;
        if (incompleteCount > 0) {
            issues.push(`${incompleteCount} prompts have unresolved variables`);
        }
        // Check for low confidence prompts
        const lowConfidenceCount = result.prompts.filter(p => p.confidence < 0.5).length;
        if (lowConfidenceCount > 0) {
            issues.push(`${lowConfidenceCount} prompts have low confidence scores`);
        }
        // Check for prompts split across many files
        const fragmentedPrompts = result.prompts.filter(p => p.files.length > 3);
        if (fragmentedPrompts.length > 0) {
            issues.push(`${fragmentedPrompts.length} prompts are fragmented across multiple files`);
        }
        // Add errors
        issues.push(...result.errors);
        return issues;
    }
    /**
     * Generate recommendations
     */
    generateRecommendations(result) {
        const recommendations = [];
        // Recommend consolidation for fragmented prompts
        const fragmentedPrompts = result.prompts.filter(p => p.files.length > 3);
        if (fragmentedPrompts.length > 0) {
            recommendations.push('Consider consolidating prompts that are split across many files');
        }
        // Recommend variable resolution
        const incompletePrompts = result.prompts.filter(p => {
            const validation = PromptReconstructor.validate(p);
            return !validation.isComplete;
        });
        if (incompletePrompts.length > 0) {
            recommendations.push('Define missing variables or provide default values for incomplete prompts');
        }
        // Recommend documentation
        if (result.statistics.averageConfidence < 0.7) {
            recommendations.push('Add clear naming and documentation to improve prompt detection confidence');
        }
        // Recommend config usage
        if (result.sources.config.length === 0 && result.statistics.configFiles === 0) {
            recommendations.push('Consider using configuration files for prompt management');
        }
        return recommendations;
    }
}
//# sourceMappingURL=comprehensive-discovery.js.map