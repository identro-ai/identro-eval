/**
 * CrewAI prompt extractor implementation
 *
 * Uses the enhanced discovery system from core with CrewAI-specific dimensions
 * to extract prompts, roles, goals, and backstories from CrewAI agents.
 */
import { BasePromptExtractor, ExtractedPrompts, FrameworkHint } from '@identro/eval-core';
/**
 * CrewAI-specific prompt extractor
 *
 * This extractor uses the comprehensive discovery system from core
 * but provides CrewAI-specific dimensions and interprets results
 * in the context of CrewAI framework.
 */
export declare class CrewAIPromptExtractor extends BasePromptExtractor {
    framework: string;
    supportedExtensions: string[];
    private discovery;
    constructor(projectRoot?: string);
    /**
     * Get CrewAI-specific hints for discovery
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
     * Check if content is from a CrewAI file
     */
    private isCrewAIFile;
    /**
     * Check if a discovered prompt is CrewAI-related
     */
    private isCrewAIPrompt;
    /**
     * Transform discovery results to ExtractedPrompts format
     */
    private transformDiscoveryResults;
    /**
     * Classify the type of prompt based on content and metadata
     */
    private classifyPromptType;
    /**
     * Extract additional CrewAI-specific information
     *
     * This method looks for CrewAI-specific dimensions that the generic
     * discovery might miss, such as:
     * - Agent configurations
     * - Task definitions
     * - Tool configurations
     * - Crew compositions (TODO: for future phases)
     */
    private extractCrewAISpecifics;
    /**
     * Extract tool definitions from a file
     */
    private extractTools;
    /**
     * Extract task examples from a file
     */
    private extractTaskExamples;
}
/**
 * Create a CrewAI prompt extractor instance
 */
export declare function createCrewAIPromptExtractor(projectRoot?: string): CrewAIPromptExtractor;
//# sourceMappingURL=prompt-extractor.d.ts.map