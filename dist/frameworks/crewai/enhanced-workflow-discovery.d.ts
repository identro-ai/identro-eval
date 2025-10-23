/**
 * Enhanced workflow discovery for CrewAI flows
 *
 * Combines AST parsing and YAML analysis to provide comprehensive
 * workflow discovery with advanced pattern recognition.
 */
import { FlowSignals } from './ast-parser';
import { YamlAnalysisResult } from './yaml-analyzer';
import { TeamEntity } from '@identro/eval-core';
export interface HumanInteractionPoint {
    method: string;
    type: 'approval' | 'input' | 'review';
    blocking: boolean;
    description: string;
}
export interface ExternalService {
    name: string;
    envVar: string;
    operations: string[];
}
export interface WorkflowMetadata {
    stepCount: number;
    routerLabels: string[];
    combinators: ('or_' | 'and_')[];
    crewCount: number;
    crewChaining: boolean;
    parallelCrews: boolean;
    humanInteractionPoints: HumanInteractionPoint[];
    externalServices: ExternalService[];
    producesArtifacts: boolean;
    estimatedDuration: number;
    hasInfiniteLoop: boolean;
}
export interface EnhancedTeamEntity extends TeamEntity {
    workflowMetadata?: WorkflowMetadata;
    flowSignals?: FlowSignals;
    yamlConfig?: YamlAnalysisResult;
    flowChart?: string;
}
export interface FlowDiscoveryResult {
    flows: EnhancedTeamEntity[];
    crews: EnhancedTeamEntity[];
    stats: {
        totalFiles: number;
        filesWithFlows: number;
        totalFlows: number;
        totalCrews: number;
        flowTypes: Record<string, number>;
        yamlConfigsFound: boolean;
    };
}
/**
 * Discover enhanced workflows (flows + crews) in a CrewAI project
 */
export declare function discoverEnhancedWorkflows(projectPath: string): Promise<FlowDiscoveryResult>;
/**
 * Analyze a specific flow file in detail
 */
export declare function analyzeFlowFile(filePath: string): Promise<{
    flowSignals: FlowSignals | null;
    yamlConfig: YamlAnalysisResult;
    entity: EnhancedTeamEntity | null;
    validation: {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
}>;
//# sourceMappingURL=enhanced-workflow-discovery.d.ts.map