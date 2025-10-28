/**
 * Behavioral pattern analysis for CrewAI crews
 *
 * Analyzes crew behavior patterns similar to flow analysis:
 * - Tool usage dimensions
 * - External integrations
 * - Human-in-the-loop points
 * - Conditional logic
 * - Error handling
 * - State management
 */
import { CrewAST } from './crew-ast-parser';
import { YamlAnalysisResult } from './yaml-analyzer';
export interface CrewBehavioralPatterns {
    hasToolUsage: boolean;
    toolsList: string[];
    hasFileIO: boolean;
    fileOperations: {
        reads: boolean;
        writes: boolean;
        formats: string[];
    };
    hasExternalAPIs: boolean;
    apiCalls: string[];
    hasHumanInLoop: boolean;
    humanInteractionPoints: HITLPoint[];
    hasConditionalLogic: boolean;
    conditionalPaths: ConditionalPath[];
    hasErrorHandling: boolean;
    errorHandlers: ErrorHandler[];
    hasStateManagement: boolean;
    stateVariables: string[];
    complexityLevel: 'simple' | 'moderate' | 'complex' | 'advanced';
}
export interface HITLPoint {
    taskName: string;
    type: 'input' | 'approval' | 'review';
    description: string;
    blocking: boolean;
}
export interface ConditionalPath {
    condition: string;
    target: string;
    lineno: number;
}
export interface ErrorHandler {
    exceptionTypes: string[];
    hasRetry: boolean;
    hasFallback: boolean;
    lineno: number;
}
/**
 * Analyze crew behavioral patterns from AST and YAML
 */
export declare function analyzeCrewBehavior(crewAST: CrewAST, yamlConfig: YamlAnalysisResult): CrewBehavioralPatterns;
/**
 * Generate behavior summary for LLM context
 */
export declare function generateBehaviorSummary(dimensions: CrewBehavioralPatterns): string;
//# sourceMappingURL=crew-behavior-analyzer.d.ts.map