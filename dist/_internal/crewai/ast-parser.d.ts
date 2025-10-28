/**
 * AST-based Python code parsing for CrewAI flows
 *
 * Provides robust parsing of Python code to extract flow patterns,
 * decorators, and complex behavioral patterns that regex cannot handle.
 */
export interface ASTNode {
    type: string;
    name?: string;
    decorators?: string[];
    decorator_list?: ASTNode[];
    args?: any;
    bases?: ASTNode[];
    body?: ASTNode[];
    lineno?: number;
    col_offset?: number;
    value?: any;
    targets?: ASTNode[];
    annotation?: ASTNode;
    id?: string;
    attr?: string;
    func?: ASTNode;
    s?: string;
}
export interface FlowMethodInfo {
    name: string;
    decorators: string[];
    parameters: string[];
    returnType?: string;
    lineno: number;
    isAsync: boolean;
    docstring?: string;
}
export interface FlowClassInfo {
    name: string;
    decorators: string[];
    methods: FlowMethodInfo[];
    baseClasses: string[];
    lineno: number;
    docstring?: string;
}
export interface FlowSignals {
    className: string;
    methods: FlowMethodInfo[];
    behavioralPatterns: {
        collectsUserInput: boolean;
        makesLLMCalls: boolean;
        hasFileIO: boolean;
        hasConditionalLogic: boolean;
        hasLoops: boolean;
        executesCrews: boolean;
        crewCount: number;
        crewChaining: boolean;
        parallelCrews: boolean;
        hasHumanInLoop: boolean;
        hasExternalIntegrations: boolean;
        hasStateEvolution: boolean;
        hasParallelExecution: boolean;
        hasInfiniteLoop: boolean;
    };
    externalInteractions: {
        crews: string[];
        apis: string[];
        databases: boolean;
        fileOperations: {
            reads: boolean;
            writes: boolean;
            formats: string[];
        };
        services: ExternalService[];
    };
    stateManagement: {
        type: 'structured' | 'unstructured';
        stateModel?: string;
        stateFields: string[];
        stateEvolution: string[];
    };
    routingLogic: {
        routerMethods: string[];
        routerLabels: string[];
        conditionalPaths: ConditionalPath[];
    };
    frameworkSpecific: CrewAISpecificSignals;
}
export interface ExternalService {
    name: string;
    envVar: string;
    operations: string[];
}
export interface ConditionalPath {
    condition: string;
    target: string;
    lineno: number;
}
export interface CrewAISpecificSignals {
    decorators: {
        starts: string[];
        listeners: ListenerInfo[];
        routers: RouterInfo[];
        persisters: string[];
    };
    combinators: ('or_' | 'and_')[];
    asyncMethods: string[];
    yamlConfigs: {
        agents?: string;
        tasks?: string;
    };
}
export interface ListenerInfo {
    method: string;
    listensTo: string[];
    combinator?: 'and_' | 'or_';
}
export interface RouterInfo {
    method: string;
    labels: string[];
    conditions: string[];
}
/**
 * Parse Python file using AST to extract flow information
 */
export declare function parseFlowFile(filePath: string): Promise<FlowSignals | null>;
//# sourceMappingURL=ast-parser.d.ts.map