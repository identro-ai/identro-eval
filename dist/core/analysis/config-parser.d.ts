/**
 * Configuration file parser for extracting prompts
 *
 * Parses YAML, JSON, and TOML configuration files to extract
 * prompts, templates, and related configuration.
 */
import { ExtractedPrompts } from './types';
export interface ConfigPrompt {
    name: string;
    content: string;
    variables: string[];
    metadata?: Record<string, any>;
    source: string;
    path: string[];
}
export interface ParsedConfig {
    prompts: ConfigPrompt[];
    variables: Record<string, any>;
    metadata: Record<string, any>;
    errors: string[];
}
/**
 * Base configuration parser
 */
export declare abstract class ConfigParser {
    protected filePath: string;
    constructor(filePath: string);
    /**
     * Parse configuration file
     */
    abstract parse(content: string): Promise<ParsedConfig>;
    /**
     * Extract prompts from parsed data
     */
    protected extractPrompts(data: any, currentPath?: string[]): ConfigPrompt[];
    /**
     * Check if a key name indicates a prompt
     */
    protected isPromptKey(key: string): boolean;
    /**
     * Check if an object represents a prompt
     */
    protected isPromptObject(obj: any): boolean;
    /**
     * Extract prompt from an object
     */
    protected extractPromptFromObject(obj: any, currentPath: string[]): ConfigPrompt | null;
    /**
     * Extract variables from a template string
     */
    protected extractVariables(template: string): string[];
    /**
     * Extract all variables from config
     */
    protected extractAllVariables(data: any, prefix?: string): Record<string, any>;
    /**
     * Resolve environment variables in content
     */
    protected resolveEnvVars(content: string): Promise<string>;
    /**
     * Convert to ExtractedPrompts format
     */
    toExtractedPrompts(parsed: ParsedConfig): ExtractedPrompts;
    /**
     * Infer prompt type from content and metadata
     */
    private inferPromptType;
}
/**
 * YAML configuration parser
 */
export declare class YAMLParser extends ConfigParser {
    parse(content: string): Promise<ParsedConfig>;
}
/**
 * JSON configuration parser
 */
export declare class JSONParser extends ConfigParser {
    parse(content: string): Promise<ParsedConfig>;
}
/**
 * TOML configuration parser
 */
export declare class TOMLParser extends ConfigParser {
    parse(content: string): Promise<ParsedConfig>;
}
/**
 * Factory for creating appropriate parser
 */
export declare class ConfigParserFactory {
    static create(filePath: string): ConfigParser | null;
    /**
     * Parse any supported config file
     */
    static parseFile(filePath: string): Promise<ExtractedPrompts | null>;
}
//# sourceMappingURL=config-parser.d.ts.map