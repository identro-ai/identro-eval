/**
 * Enhanced AST analyzer with variable tracking and import resolution
 *
 * Provides comprehensive AST analysis for both Python and TypeScript/JavaScript,
 * tracking variables across scopes and resolving imports.
 */
import { DependencyGraph } from './import-resolver';
export interface VariableMap {
    [key: string]: {
        value: any;
        type: string;
        scope: string;
        mutations: number;
        references: number;
    };
}
export interface StringOperation {
    type: 'concatenation' | 'format' | 'join' | 'template';
    variables: string[];
    result?: string;
    lineNumber: number;
}
export interface EnhancedASTResult {
    variables: VariableMap;
    stringOperations: StringOperation[];
    imports: DependencyGraph;
    prompts: ExtractedPrompt[];
}
export interface ExtractedPrompt {
    name: string;
    content: string;
    variables: string[];
    type: 'static' | 'dynamic' | 'composed';
    confidence: number;
    location: {
        file: string;
        lineNumber: number;
    };
}
/**
 * Enhanced AST analyzer
 */
export declare class EnhancedASTAnalyzer {
    private variableTracker;
    private importResolver;
    constructor(projectRoot: string);
    /**
     * Track variables across scopes
     */
    trackVariables(ast: any, language: 'python' | 'javascript'): VariableMap;
    /**
     * Track JavaScript/TypeScript variables
     */
    private trackJavaScriptVariables;
    /**
     * Extract value from AST node
     */
    private extractValue;
    /**
     * Extract identifier name from node
     */
    private extractIdentifier;
    /**
     * Infer type from AST node
     */
    private inferType;
    /**
     * Detect string operations in code
     */
    detectStringOperations(code: string): StringOperation[];
    /**
     * Build import graph for files
     */
    buildImportGraph(files: string[]): Promise<DependencyGraph>;
    /**
     * Analyze a file comprehensively
     */
    analyzeFile(filePath: string, content: string): Promise<EnhancedASTResult>;
    /**
     * Extract prompts from tracked variables
     */
    private extractPromptsFromVariables;
    /**
     * Check if a variable looks like a prompt
     */
    private looksLikePrompt;
    /**
     * Extract variables from a template string
     */
    private extractVariablesFromTemplate;
    /**
     * Calculate confidence in prompt detection
     */
    private calculateConfidence;
    /**
     * Analyze Python file using subprocess
     */
    private analyzePythonFile;
}
//# sourceMappingURL=enhanced-ast.d.ts.map