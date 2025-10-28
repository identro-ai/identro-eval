/**
 * Variable tracker for cross-scope variable resolution
 *
 * Tracks variable assignments, mutations, and flow across
 * different scopes in both Python and TypeScript/JavaScript.
 */
export interface Variable {
    name: string;
    value: any;
    type: 'string' | 'template' | 'array' | 'object' | 'function' | 'unknown';
    scope: string;
    lineNumber: number;
    mutations: VariableMutation[];
    references: VariableReference[];
}
export interface VariableMutation {
    type: 'assignment' | 'concatenation' | 'format' | 'join' | 'append';
    value: any;
    lineNumber: number;
    scope: string;
}
export interface VariableReference {
    scope: string;
    lineNumber: number;
    context: 'parameter' | 'return' | 'call' | 'access';
}
export interface Scope {
    name: string;
    type: 'module' | 'class' | 'function' | 'block';
    parent?: string;
    variables: Map<string, Variable>;
    children: string[];
}
/**
 * Tracks variables across scopes
 */
export declare class VariableTracker {
    private scopes;
    private currentScope;
    private scopeCounter;
    constructor();
    /**
     * Enter a new scope
     */
    enterScope(type: 'class' | 'function' | 'block', name?: string): string;
    /**
     * Exit current scope
     */
    exitScope(): void;
    /**
     * Track a variable assignment
     */
    trackAssignment(name: string, value: any, type: Variable['type'], lineNumber: number): void;
    /**
     * Track a variable mutation (concatenation, format, etc.)
     */
    trackMutation(name: string, mutationType: VariableMutation['type'], value: any, lineNumber: number): void;
    /**
     * Track a variable reference
     */
    trackReference(name: string, context: VariableReference['context'], lineNumber: number): void;
    /**
     * Resolve a variable by looking up the scope chain
     */
    resolveVariable(name: string): Variable | undefined;
    /**
     * Get the final value of a variable after all mutations
     */
    getFinalValue(name: string): any;
    /**
     * Format a string with variables
     */
    private formatString;
    /**
     * Get all variables in current scope chain
     */
    getAllVariables(): Map<string, Variable>;
    /**
     * Export scope tree for debugging
     */
    exportScopeTree(): any;
}
/**
 * String operation detector
 */
export declare class StringOperationDetector {
    /**
     * Detect string concatenation dimensions
     */
    static detectConcatenation(code: string): Array<{
        variables: string[];
        operator: string;
        lineNumber: number;
    }>;
    /**
     * Detect template formatting dimensions
     */
    static detectTemplateFormatting(code: string): Array<{
        template: string;
        variables: string[];
        method: 'format' | 'f-string' | 'template-literal';
        lineNumber: number;
    }>;
    /**
     * Detect array join operations
     */
    static detectArrayJoins(code: string): Array<{
        array: string;
        separator: string;
        lineNumber: number;
    }>;
}
//# sourceMappingURL=variable-tracker.d.ts.map