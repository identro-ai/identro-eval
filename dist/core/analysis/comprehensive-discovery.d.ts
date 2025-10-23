/**
 * Comprehensive prompt discovery system
 *
 * Main orchestrator that combines all discovery methods to find
 * and reconstruct prompts from any source.
 */
import { ResolvedPrompt } from './cross-file';
export interface DiscoveredPrompts {
    prompts: ResolvedPrompt[];
    sources: {
        code: ResolvedPrompt[];
        config: ResolvedPrompt[];
        dynamic: ResolvedPrompt[];
    };
    statistics: {
        totalPrompts: number;
        completePrompts: number;
        partialPrompts: number;
        filesAnalyzed: number;
        configFiles: number;
        codeFiles: number;
        averageConfidence: number;
    };
    errors: string[];
}
export interface DiscoveryOptions {
    includeConfigs?: boolean;
    includeDynamic?: boolean;
    followImports?: boolean;
    maxDepth?: number;
    extensions?: string[];
    ignore?: string[];
}
export interface AnalysisResult {
    prompts: DiscoveredPrompts;
    confidence: number;
    report: DiscoveryReport;
}
export interface DiscoveryReport {
    summary: string;
    details: {
        promptCount: number;
        fileCount: number;
        coverage: number;
        issues: string[];
        recommendations: string[];
    };
    promptDetails: Array<{
        name: string;
        type: string;
        confidence: number;
        sources: string[];
        variables: string[];
        isComplete: boolean;
    }>;
}
/**
 * Main discovery orchestrator
 */
export declare class ComprehensivePromptDiscovery {
    private projectRoot;
    private scanner;
    private crossFileAnalyzer;
    private astAnalyzer;
    constructor(projectRoot: string);
    /**
     * Discover all prompts in the project
     */
    discoverAll(_projectPath?: string, options?: DiscoveryOptions): Promise<DiscoveredPrompts>;
    /**
     * Discover prompts from code files
     */
    private discoverFromCode;
    /**
     * Discover prompts from config files
     */
    private discoverFromConfigs;
    /**
     * Discover dynamically constructed prompts
     */
    private discoverDynamicPrompts;
    /**
     * Check if a string looks like a prompt
     */
    private looksLikePrompt;
    /**
     * Deduplicate prompts
     */
    private deduplicatePrompts;
    /**
     * Analyze discovered prompts with confidence scoring
     */
    analyzeWithConfidence(prompts: DiscoveredPrompts): Promise<AnalysisResult>;
    /**
     * Generate discovery report
     */
    generateReport(result: DiscoveredPrompts): DiscoveryReport;
    /**
     * Generate summary text
     */
    private generateSummary;
    /**
     * Calculate coverage percentage
     */
    private calculateCoverage;
    /**
     * Identify issues in discovered prompts
     */
    private identifyIssues;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
}
//# sourceMappingURL=comprehensive-discovery.d.ts.map