/**
 * Pattern definitions for detecting LangChain usage in Python and TypeScript projects
 *
 * These patterns are used to identify:
 * - Framework imports
 * - Agent definitions
 * - Chain instantiations
 * - Tool usage
 * - LLM configurations
 */
export interface ImportPattern {
    pattern: RegExp;
    language: 'python' | 'typescript' | 'javascript';
    description: string;
}
export interface AgentPattern {
    pattern: RegExp;
    type: 'class' | 'function' | 'variable';
    agentType: 'classifier' | 'rag' | 'task_executor' | 'coordinator' | 'custom';
    description: string;
}
/**
 * Python import patterns for LangChain
 */
export declare const PYTHON_IMPORT_PATTERNS: ImportPattern[];
/**
 * TypeScript/JavaScript import patterns for LangChain
 */
export declare const TYPESCRIPT_IMPORT_PATTERNS: ImportPattern[];
/**
 * Python agent patterns
 */
export declare const PYTHON_AGENT_PATTERNS: AgentPattern[];
/**
 * TypeScript/JavaScript agent patterns
 */
export declare const TYPESCRIPT_AGENT_PATTERNS: AgentPattern[];
/**
 * LLM configuration patterns
 */
export declare const LLM_CONFIG_PATTERNS: {
    python: RegExp[];
    typescript: RegExp[];
};
/**
 * Environment variable patterns for LLM API keys
 */
export declare const LLM_ENV_PATTERNS: string[];
/**
 * Configuration file patterns
 */
export declare const CONFIG_FILE_PATTERNS: string[];
/**
 * File extensions to scan for LangChain usage
 */
export declare const SCAN_EXTENSIONS: {
    python: string[];
    typescript: string[];
    javascript: string[];
};
/**
 * Directories to exclude from scanning
 */
export declare const EXCLUDE_DIRS: string[];
/**
 * Helper function to check if a file path should be excluded
 */
export declare function shouldExcludePath(path: string): boolean;
/**
 * Helper function to determine file language
 */
export declare function getFileLanguage(filePath: string): 'python' | 'typescript' | 'javascript' | null;
/**
 * Helper function to classify agent type based on patterns and context
 */
export declare function classifyAgentType(code: string, fileName: string, patterns: AgentPattern[]): 'classifier' | 'rag' | 'task_executor' | 'coordinator' | 'custom';
//# sourceMappingURL=patterns.d.ts.map