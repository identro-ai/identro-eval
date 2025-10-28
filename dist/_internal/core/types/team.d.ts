/**
 * Team/Crew entity types for multi-agent testing
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
export interface TeamEntity {
    id: string;
    name: string;
    type: 'crew' | 'team' | 'workflow' | 'pipeline';
    framework: string;
    path: string;
    contract: {
        description: string;
        inputSchema?: any;
        outputSchema?: any;
        capabilities: string[];
    };
    execution: {
        entryPoint: string;
        configPath?: string;
        timeout?: number;
        parameters?: Record<string, any>;
    };
    composition?: {
        memberCount: number;
        members?: string[];
        coordinator?: string;
        process?: string;
    };
    structure?: {
        agents?: any[];
        tasks?: any[];
        process?: string;
        workflow?: any;
    };
    workflowMetadata?: WorkflowMetadata;
    metadata?: {
        language: string;
        lineNumber?: number;
        discovered?: string;
        isTeam?: boolean;
        flowType?: string;
        [key: string]: any;
    };
}
export interface TeamDiscoveryResult {
    teams: TeamEntity[];
    stats: {
        totalFiles: number;
        filesWithTeams: number;
        totalTeams: number;
        teamTypes: Record<string, number>;
    };
}
export interface TeamExecutionResult {
    teamId: string;
    success: boolean;
    output: any;
    error?: string;
    duration: number;
    metadata?: {
        tokenUsage?: number;
        cost?: number;
        [key: string]: any;
    };
}
//# sourceMappingURL=team.d.ts.map