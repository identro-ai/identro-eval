/**
 * Cross-file analysis system
 *
 * Analyzes prompts and variables across multiple files,
 * resolving references and reconstructing complete prompts.
 */
import { DependencyGraph } from './import-resolver';
import { ExtractedPrompt } from './enhanced-ast';
export interface PromptFragment {
    content: string;
    file: string;
    lineNumber: number;
    variables: string[];
    type: 'base' | 'partial' | 'parameter';
}
export interface ResolvedPrompt {
    name: string;
    content: string;
    fragments: PromptFragment[];
    variables: Map<string, any>;
    files: string[];
    confidence: number;
    type: 'complete' | 'partial' | 'template';
}
export interface CrossFileVariable {
    name: string;
    value: any;
    definedIn: string;
    usedIn: string[];
    type: string;
}
export interface ProjectAnalysis {
    prompts: ResolvedPrompt[];
    variables: Map<string, CrossFileVariable>;
    dependencies: DependencyGraph;
    files: string[];
    errors: string[];
}
/**
 * Analyzes prompts across multiple files
 */
export declare class CrossFileAnalyzer {
    private scanner;
    private astAnalyzer;
    private importResolver;
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Analyze entire project
     */
    analyzeProject(_projectPath?: string): Promise<ProjectAnalysis>;
    /**
     * Find files likely to contain prompts
     */
    private findPromptFiles;
    /**
     * Resolve prompt references across files
     */
    resolvePromptReferences(fileAnalyses: Map<string, ExtractedPrompt[]>, fileVariables: Map<string, Map<string, any>>, dependencies: DependencyGraph): Promise<ResolvedPrompt[]>;
    /**
     * Resolve a variable across files
     */
    private resolveVariable;
    /**
     * Build cross-file variable map
     */
    private buildVariableMap;
    /**
     * Reconstruct prompt from template and variables
     */
    private reconstructPrompt;
}
/**
 * Prompt reconstructor
 */
export declare class PromptReconstructor {
    /**
     * Reconstruct complete prompt from fragments
     */
    static reconstruct(fragments: PromptFragment[]): string;
    /**
     * Combine multiple prompts into one
     */
    static combine(prompts: ResolvedPrompt[]): ResolvedPrompt | null;
    /**
     * Validate prompt completeness
     */
    static validate(prompt: ResolvedPrompt): {
        isComplete: boolean;
        missingVariables: string[];
        unresolvedFragments: PromptFragment[];
    };
}
//# sourceMappingURL=cross-file.d.ts.map