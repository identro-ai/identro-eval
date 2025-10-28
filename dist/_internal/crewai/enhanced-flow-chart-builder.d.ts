/**
 * Enhanced flow chart builder for CrewAI flows
 *
 * Generates comprehensive flow charts that incorporate router logic,
 * HITL points, external integrations, and complex execution patterns.
 */
import { FlowSignals } from './ast-parser';
import { YamlAnalysisResult } from './yaml-analyzer';
import { RouterAnalysis, FlowPathMap } from './router-analyzer';
import { HITLWorkflow } from './hitl-detector';
import { IntegrationAnalysis } from './integration-analyzer';
export interface EnhancedFlowChart {
    title: string;
    description: string;
    chart: string;
    metadata: FlowChartMetadata;
    sections: FlowChartSection[];
}
export interface FlowChartMetadata {
    complexity: 'simple' | 'moderate' | 'complex' | 'advanced';
    estimatedDuration: number;
    criticalPath: string[];
    parallelSections: number;
    humanInteractions: number;
    externalIntegrations: number;
    routerDecisions: number;
}
export interface FlowChartSection {
    type: 'start' | 'process' | 'decision' | 'parallel' | 'integration' | 'human' | 'end';
    title: string;
    content: string[];
    connections: string[];
}
/**
 * Build enhanced flow chart with all analysis data
 */
export declare function buildEnhancedFlowChart(flowSignals: FlowSignals, yamlConfig: YamlAnalysisResult, routerAnalysis: RouterAnalysis[], pathMap: FlowPathMap, hitlWorkflow: HITLWorkflow, integrationAnalysis: IntegrationAnalysis): EnhancedFlowChart;
/**
 * Generate comprehensive flow analysis report
 */
export declare function generateEnhancedFlowReport(flowChart: EnhancedFlowChart, flowSignals: FlowSignals, routerAnalysis: RouterAnalysis[], pathMap: FlowPathMap, hitlWorkflow: HITLWorkflow, integrationAnalysis: IntegrationAnalysis): string;
//# sourceMappingURL=enhanced-flow-chart-builder.d.ts.map