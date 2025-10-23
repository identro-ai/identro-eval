/**
 * LangChain prompt extractor implementation
 *
 * Uses the enhanced discovery system from core with LangChain-specific patterns
 * to extract prompts, templates, and examples from LangChain code.
 */
import { BasePromptExtractor, ExtractedPrompts, FrameworkHint } from '@identro/eval-core';
/**
 * LangChain-specific prompt extractor
 *
 * This extractor uses the comprehensive discovery system from core
 * but provides LangChain-specific patterns and interprets results
 * in the context of LangChain framework.
 */
export declare class LangChainPromptExtractor extends BasePromptExtractor {
    framework: string;
    supportedExtensions: string[];
    private discovery;
    constructor(projectRoot?: string);
    /**
     * Get LangChain-specific hints for discovery
     */
    getHints(): FrameworkHint;
    /**
     * Extract prompts from a single file using enhanced discovery
     */
    extractFromFile(filePath: string, content: string, _hints?: FrameworkHint): Promise<ExtractedPrompts>;
    /**
     * Extract prompts from an entire project
     */
    extractFromProject(projectPath: string, _hints?: FrameworkHint): Promise<ExtractedPrompts[]>;
    /**
     * Check if content is from a LangChain file
     */
    private isLangChainFile;
    /**
     * Check if a discovered prompt is LangChain-related
     */
    private isLangChainPrompt;
    /**
     * Transform discovery results to ExtractedPrompts format
     */
    private transformDiscoveryResults;
    /**
     * Classify the type of prompt based on content and metadata
     */
    private classifyPromptType;
    /**
     * Extract additional LangChain-specific information
     *
     * This method looks for LangChain-specific patterns that the generic
     * discovery might miss, such as:
     * - Chain compositions
     * - Tool definitions
     * - Example selectors
     * - Memory configurations
     */
    private extractLangChainSpecifics;
    /**
     * Extract tool definitions from a file
     */
    private extractTools;
    /**
     * Extract examples from FewShotPromptTemplate configurations
     */
    private extractExamples;
    /**
     * Extract descriptions from docstrings and comments
     */
    private extractDescriptions;
}
/**
 * Create a LangChain prompt extractor instance
 */
export declare function createLangChainPromptExtractor(projectRoot?: string): LangChainPromptExtractor;
//# sourceMappingURL=prompt-extractor.d.ts.map