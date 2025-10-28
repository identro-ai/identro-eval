/**
 * AST-based Python code parsing for CrewAI crews
 *
 * Provides robust parsing of Python crew files to extract:
 * - Crew definitions and configurations
 * - Agent and task references
 * - Tool usage dimensions
 * - External service integrations
 * - Control flow and error handling
 */
export interface CrewAST {
    crewDefinitions: CrewDefinition[];
    toolUsage: ToolUsageDimension[];
    externalCalls: ExternalCallDimension[];
    controlFlow: ControlFlowDimension[];
    errorHandling: ErrorHandlingDimension[];
    imports: ImportStatement[];
}
export interface CrewDefinition {
    name: string;
    variableName: string;
    lineno: number;
    configuration: {
        agents: string[];
        tasks: string[];
        process: 'sequential' | 'hierarchical' | 'unknown';
        memory?: boolean;
        cache?: boolean;
        verbose?: boolean;
        manager_llm?: string;
        manager_agent?: string;
        planning?: boolean;
        planning_llm?: string;
    };
    docstring?: string;
}
export interface ToolUsageDimension {
    toolName: string;
    toolType: 'custom' | 'builtin' | 'integration';
    usageContext: string[];
    lineno: number;
}
export interface ExternalCallDimension {
    service: string;
    method: string;
    callType: 'api' | 'database' | 'file' | 'llm';
    envVars: string[];
    lineno: number;
}
export interface ControlFlowDimension {
    type: 'conditional' | 'loop' | 'try_except' | 'context_manager';
    condition?: string;
    lineno: number;
}
export interface ErrorHandlingDimension {
    exceptionTypes: string[];
    hasRetry: boolean;
    hasFallback: boolean;
    lineno: number;
}
export interface ImportStatement {
    module: string;
    names: string[];
    isFromImport: boolean;
    lineno: number;
}
/**
 * Parse crew Python file using AST to extract comprehensive crew information
 */
export declare function parseCrewFile(filePath: string): Promise<CrewAST | null>;
//# sourceMappingURL=crew-ast-parser.d.ts.map