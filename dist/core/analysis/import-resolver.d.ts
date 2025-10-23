/**
 * Import resolver for building dependency graphs
 *
 * Resolves imports and exports across files to track
 * how prompts and variables flow through a project.
 */
export interface Import {
    source: string;
    target: string;
    imports: ImportedItem[];
    type: 'default' | 'named' | 'namespace' | 'side-effect';
    lineNumber: number;
}
export interface ImportedItem {
    name: string;
    alias?: string;
    type: 'variable' | 'function' | 'class' | 'type' | 'unknown';
}
export interface Export {
    file: string;
    exports: ExportedItem[];
    lineNumber: number;
}
export interface ExportedItem {
    name: string;
    alias?: string;
    type: 'variable' | 'function' | 'class' | 'type' | 'default' | 'unknown';
    value?: any;
}
export interface DependencyNode {
    file: string;
    imports: Import[];
    exports: Export[];
    dependencies: string[];
    dependents: string[];
}
export interface DependencyGraph {
    nodes: Map<string, DependencyNode>;
    rootFiles: string[];
    entryPoints: string[];
}
/**
 * Resolves imports and builds dependency graphs
 */
export declare class ImportResolver {
    private graph;
    private projectRoot;
    private fileCache;
    constructor(projectRoot: string);
    /**
     * Build dependency graph for a project
     */
    buildGraph(entryFiles: string[]): Promise<DependencyGraph>;
    /**
     * Process a single file
     */
    private processFile;
    /**
     * Process Python imports
     */
    private processPythonFile;
    /**
     * Process JavaScript/TypeScript imports
     */
    private processJavaScriptFile;
    /**
     * Resolve Python import to file path
     */
    private resolvePythonImport;
    /**
     * Resolve JavaScript/TypeScript import to file path
     */
    private resolveJavaScriptImport;
    /**
     * Check if file exists
     */
    private fileExists;
    /**
     * Read file with caching
     */
    private readFile;
    /**
     * Get all exported items from a file
     */
    getExports(file: string): ExportedItem[];
    /**
     * Trace variable through imports
     */
    traceVariable(file: string, variableName: string): Array<{
        file: string;
        name: string;
        alias?: string;
    }>;
    /**
     * Get dependency chain between two files
     */
    getDependencyChain(from: string, to: string): string[] | null;
}
//# sourceMappingURL=import-resolver.d.ts.map