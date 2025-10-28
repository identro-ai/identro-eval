/**
 * Flow Execution Monitor for CrewAI Flows
 *
 * Monitors flow execution for human-in-the-loop (HITL) requests and injects
 * synthetic responses from eval-spec.json to enable automated flow testing.
 *
 * This maintains Identro's architecture by extending existing execution
 * infrastructure rather than creating flow-specific dimensions.
 */
import { EventEmitter } from 'events';
export interface HITLRequest {
    method: string;
    type: 'approval' | 'input' | 'review' | 'confirmation';
    prompt: string;
    context: any;
    timestamp: number;
    processId: string;
}
export interface SyntheticInputResponse {
    action?: 'approve' | 'reject' | 'continue' | 'cancel';
    value?: any;
    reason?: string;
    data?: any;
}
export interface FlowExecutionResult {
    success: boolean;
    finalOutput: string;
    duration: number;
    artifacts: Artifact[];
    syntheticInputsUsed: Record<string, SyntheticInputResponse>;
    executionPath: string[];
    stateEvolution: any[];
    metadata: {
        hitlInteractions: number;
        crewExecutions: number;
        externalCalls: number;
    };
}
export interface Artifact {
    path: string;
    type: string;
    size: number;
    content?: string;
    metadata?: any;
}
export interface FlowExecutionOptions {
    timeout: number;
    syntheticInputs: Record<string, SyntheticInputResponse>;
    captureArtifacts: boolean;
    artifactDirectory?: string;
    dryRunIntegrations?: boolean;
    maxHITLWaitTime?: number;
}
/**
 * Flow Execution Monitor
 *
 * Monitors Python flow processes for HITL requests and injects synthetic responses.
 * Works with existing CrewAI adapter infrastructure.
 */
export declare class FlowExecutionMonitor extends EventEmitter {
    private projectPath;
    private options;
    private logger?;
    private process;
    private isComplete;
    private startTime;
    private hitlRequests;
    private syntheticInputsUsed;
    private executionPath;
    private stateSnapshots;
    private artifacts;
    constructor(projectPath: string, options: FlowExecutionOptions, logger?: {
        addLog: (message: string, level: "info" | "success" | "error" | "warning" | "debug") => void;
    } | undefined);
    /**
     * Start flow execution with monitoring
     */
    startFlow(flowName: string, input: any): Promise<void>;
    /**
     * Wait for flow completion with timeout
     */
    waitForCompletion(): Promise<FlowExecutionResult>;
    /**
     * Create Python script for flow execution with HITL monitoring
     */
    private createFlowExecutionScript;
    /**
     * Set up process monitoring for output parsing
     */
    private setupProcessMonitoring;
    /**
     * Parse process output for flow events and HITL requests
     */
    private parseProcessOutput;
    /**
     * Handle HITL request from flow execution
     */
    private handleHITLRequest;
    /**
     * Inject synthetic response for HITL request
     */
    private injectSyntheticResponse;
    /**
     * Handle flow result
     */
    private handleFlowResult;
    /**
     * Handle flow error
     */
    private handleFlowError;
    /**
     * Handle flow events for progress tracking
     */
    private handleFlowEvent;
    /**
     * Handle process exit
     */
    private handleProcessExit;
    /**
     * Start HITL monitoring loop
     */
    private startHITLMonitoring;
    /**
     * Check if flow execution is complete
     */
    isFlowComplete(): boolean;
    /**
     * Get current execution path
     */
    getExecutionPath(): string[];
    /**
     * Get HITL requests received so far
     */
    getHITLRequests(): HITLRequest[];
    /**
     * Clean up resources
     */
    private cleanup;
    /**
     * Force cleanup (public method)
     */
    forceCleanup(): Promise<void>;
    /**
     * Convert JavaScript types to Python-compatible string representation
     */
    private convertJSToPython;
}
//# sourceMappingURL=flow-execution-monitor.d.ts.map