/**
 * Flow chart generation for CrewAI crews
 *
 * Generates Mermaid diagrams visualizing:
 * - Agent→Task relationships
 * - Tool usage per agent/task
 * - HITL interaction points
 * - External service integrations
 * - Process flow (sequential/hierarchical)
 */
import { CrewAST } from './crew-ast-parser';
import { YamlAnalysisResult } from './yaml-analyzer';
import { CrewBehavioralPatterns } from './crew-behavior-analyzer';
import { CrewExternalIntegrations } from './crew-integration-detector';
export interface CrewFlowChartData {
    crewAST: CrewAST;
    yamlConfig: YamlAnalysisResult;
    behavioralPatterns: CrewBehavioralPatterns;
    externalIntegrations: CrewExternalIntegrations;
}
/**
 * Build enhanced Mermaid flow chart for crew
 */
export declare function buildCrewFlowChart(data: CrewFlowChartData): string;
/**
 * Generate text-based flow chart for non-Mermaid contexts
 */
export declare function buildTextFlowChart(data: CrewFlowChartData): string;
//# sourceMappingURL=crew-flow-chart-builder.d.ts.map