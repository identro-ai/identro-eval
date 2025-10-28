/**
 * Router logic analyzer for CrewAI flows
 *
 * Provides advanced analysis of router methods, conditional paths,
 * and branching logic in CrewAI flows.
 */
import { FlowSignals } from './ast-parser';
import { YamlAnalysisResult } from './yaml-analyzer';
export interface RouterPath {
    label: string;
    condition: string;
    targetMethod?: string;
    probability?: number;
    description: string;
}
export interface RouterAnalysis {
    routerMethod: string;
    paths: RouterPath[];
    defaultPath?: string;
    complexity: 'simple' | 'moderate' | 'complex';
    branchingFactor: number;
    hasErrorHandling: boolean;
    dependencies: string[];
}
export interface FlowPathMap {
    startMethods: string[];
    pathSequences: PathSequence[];
    parallelPaths: ParallelPath[];
    convergencePoints: string[];
    endMethods: string[];
}
export interface PathSequence {
    id: string;
    steps: string[];
    routers: RouterBranch[];
    estimatedDuration: number;
    probability: number;
}
export interface ParallelPath {
    triggerMethod: string;
    parallelMethods: string[];
    convergenceMethod?: string;
    synchronizationType: 'and_' | 'or_';
}
export interface RouterBranch {
    routerMethod: string;
    selectedPath: string;
    condition: string;
}
/**
 * Analyze router logic in a flow
 */
export declare function analyzeRouterLogic(flowSignals: FlowSignals, yamlConfig: YamlAnalysisResult): RouterAnalysis[];
/**
 * Build complete flow path map
 */
export declare function buildFlowPathMap(flowSignals: FlowSignals, routerAnalyses: RouterAnalysis[]): FlowPathMap;
/**
 * Generate comprehensive flow analysis report
 */
export declare function generateFlowAnalysisReport(flowSignals: FlowSignals, routerAnalyses: RouterAnalysis[], pathMap: FlowPathMap): string;
//# sourceMappingURL=router-analyzer.d.ts.map