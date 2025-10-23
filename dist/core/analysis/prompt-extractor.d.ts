/**
 * Prompt extractor interface for framework implementations
 *
 * Each framework adapter must implement this interface to
 * extract prompts, templates, and examples from agent code.
 */
import { ExtractedPrompts, FrameworkHint } from './types';
/**
 * Interface for prompt extraction from framework code
 */
export interface PromptExtractor {
    /** Framework name */
    framework: string;
    /** Supported file extensions */
    supportedExtensions: string[];
    /**
     * Extract prompts from a file
     *
     * @param filePath - Path to the file
     * @param content - File content
     * @param hints - Framework-specific hints
     * @returns Extracted prompts and templates
     */
    extractFromFile(filePath: string, content: string, hints?: FrameworkHint): Promise<ExtractedPrompts>;
    /**
     * Extract prompts from an entire project
     *
     * @param projectPath - Root directory of the project
     * @param hints - Framework-specific hints
     * @returns All extracted prompts
     */
    extractFromProject(projectPath: string, hints?: FrameworkHint): Promise<ExtractedPrompts[]>;
    /**
     * Check if a file should be processed
     *
     * @param filePath - Path to check
     * @returns True if file should be processed
     */
    shouldProcess(filePath: string): boolean;
    /**
     * Get framework-specific hints
     *
     * @returns Framework hints for better extraction
     */
    getHints(): FrameworkHint;
}
/**
 * Base implementation of prompt extractor
 */
export declare abstract class BasePromptExtractor implements PromptExtractor {
    abstract framework: string;
    abstract supportedExtensions: string[];
    /**
     * Check if a file should be processed
     */
    shouldProcess(filePath: string): boolean;
    /**
     * Get framework-specific hints
     */
    abstract getHints(): FrameworkHint;
    /**
     * Extract prompts from a file
     */
    abstract extractFromFile(filePath: string, content: string, hints?: FrameworkHint): Promise<ExtractedPrompts>;
    /**
     * Extract prompts from an entire project
     */
    abstract extractFromProject(projectPath: string, hints?: FrameworkHint): Promise<ExtractedPrompts[]>;
    /**
     * Helper to extract variables from a template string
     */
    protected extractVariables(template: string): string[];
    /**
     * Helper to clean and normalize prompt text
     */
    protected cleanPromptText(text: string): string;
}
//# sourceMappingURL=prompt-extractor.d.ts.map