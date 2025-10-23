/**
 * Human-in-the-Loop (HITL) detector for CrewAI flows
 *
 * Provides advanced detection and analysis of human interaction points,
 * approval workflows, and user input patterns in CrewAI flows.
 */
import { FlowSignals } from './ast-parser';
import { YamlAnalysisResult } from './yaml-analyzer';
export interface HITLPoint {
    id: string;
    method: string;
    type: 'input' | 'approval' | 'review' | 'feedback' | 'decision' | 'validation';
    trigger: HITLTrigger;
    blocking: boolean;
    timeout?: number;
    fallbackAction?: string;
    context: HITLContext;
    userInterface: HITLInterface;
    validation: HITLValidation;
}
export interface HITLTrigger {
    condition: string;
    frequency: 'always' | 'conditional' | 'error' | 'threshold';
    dependencies: string[];
    description: string;
}
export interface HITLContext {
    dataRequired: string[];
    previousSteps: string[];
    impactedSteps: string[];
    businessContext: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
}
export interface HITLInterface {
    method: 'cli' | 'web' | 'email' | 'slack' | 'api' | 'file';
    format: 'text' | 'json' | 'form' | 'choice' | 'binary';
    options?: string[];
    validation?: string[];
}
export interface HITLValidation {
    required: boolean;
    format?: string;
    constraints?: string[];
    errorHandling: string;
}
export interface HITLWorkflow {
    points: HITLPoint[];
    sequences: HITLSequence[];
    patterns: HITLPattern[];
    metrics: HITLMetrics;
}
export interface HITLSequence {
    id: string;
    points: string[];
    type: 'sequential' | 'parallel' | 'conditional';
    totalTimeout: number;
    criticalPath: boolean;
}
export interface HITLPattern {
    name: string;
    description: string;
    points: string[];
    frequency: number;
    complexity: 'simple' | 'moderate' | 'complex';
}
export interface HITLMetrics {
    totalPoints: number;
    blockingPoints: number;
    averageTimeout: number;
    criticalPathImpact: number;
    userExperienceScore: number;
}
/**
 * Detect and analyze human-in-the-loop points in a flow
 */
export declare function detectHITLPoints(flowSignals: FlowSignals, yamlConfig: YamlAnalysisResult): HITLWorkflow;
/**
 * Generate HITL analysis report
 */
export declare function generateHITLReport(workflow: HITLWorkflow): string;
//# sourceMappingURL=hitl-detector.d.ts.map