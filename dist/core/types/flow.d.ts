/**
 * Flow entity types for CrewAI workflow testing
 */
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
export interface FlowWorkflowMetadata {
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
export interface FlowEntity {
    id: string;
    name: string;
    type: 'workflow';
    framework: string;
    path: string;
    contract: {
        description: string;
        inputSchema?: any;
        outputSchema?: any;
        capabilities: string[];
        purpose?: string;
        domain?: string;
    };
    execution: {
        entryPoint: string;
        timeout?: number;
        parameters?: Record<string, any>;
        requiresHumanInput?: boolean;
        captureArtifacts?: boolean;
        dryRunIntegrations?: boolean;
    };
    analysis: {
        workflowMetadata: FlowWorkflowMetadata;
        behavioralDimensions: Record<string, any>;
        externalInteractions: Record<string, any>;
        routingLogic: Record<string, any>;
        frameworkSpecific: Record<string, any>;
        flowChart: string;
        yamlConfig?: Record<string, any>;
    };
    metadata?: {
        language: string;
        discovered?: string;
        isFlow: boolean;
        flowType: string;
        complexity: 'simple' | 'moderate' | 'complex' | 'advanced';
        [key: string]: any;
    };
}
export interface FlowDiscoveryResult {
    flows: FlowEntity[];
    stats: {
        totalFiles: number;
        filesWithFlows: number;
        totalFlows: number;
        flowTypes: Record<string, number>;
        yamlConfigsFound: boolean;
    };
}
export interface FlowExecutionResult {
    flowId: string;
    success: boolean;
    output: any;
    error?: string;
    duration: number;
    artifacts?: string[];
    syntheticInputsUsed?: Record<string, any>;
    metadata?: {
        tokenUsage?: number;
        cost?: number;
        hitlInteractions?: number;
        externalServiceCalls?: number;
        [key: string]: any;
    };
}
//# sourceMappingURL=flow.d.ts.map