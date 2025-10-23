/**
 * LLM Queue Manager
 *
 * Manages concurrent LLM calls for dimension generation and evaluation.
 * Respects the max_concurrent_llm_calls configuration from YAML.
 * Separate from ExecutionPool which manages test execution concurrency.
 */
export interface LLMTask<T> {
    id: string;
    name: string;
    execute: () => Promise<T>;
    priority?: number;
}
export interface LLMQueueOptions {
    /** Maximum concurrent LLM calls (from config: max_concurrent_llm_calls) */
    maxConcurrentCalls?: number;
    /** Queue processing strategy */
    strategy?: 'fifo' | 'priority' | 'balanced';
    /** Callback when a task starts */
    onTaskStart?: (task: LLMTask<any>) => void;
    /** Callback when a task completes */
    onTaskComplete?: (task: LLMTask<any>, result: any, duration: number) => void;
    /** Callback when a task fails */
    onTaskError?: (task: LLMTask<any>, error: Error, duration: number) => void;
    /** Callback for queue progress */
    onProgress?: (completed: number, total: number, running: number) => void;
}
export declare class LLMQueueManager {
    private maxConcurrentCalls;
    private strategy;
    private options;
    private pendingTasks;
    private runningTasks;
    private completedTasks;
    private failedTasks;
    private totalTasks;
    private startTime?;
    constructor(options?: LLMQueueOptions);
    /**
     * Add a task to the queue
     */
    enqueue<T>(task: LLMTask<T>): Promise<T>;
    /**
     * Add multiple tasks and wait for all to complete
     */
    enqueueBatch<T>(tasks: LLMTask<T>[]): Promise<T[]>;
    /**
     * Process the queue (internal)
     */
    private processQueue;
    /**
     * Get next task based on strategy
     */
    private getNextTask;
    /**
     * Update progress callback
     */
    private updateProgress;
    /**
     * Wait for all tasks to complete
     */
    drain(): Promise<void>;
    /**
     * Clear all pending tasks
     */
    clear(): void;
    /**
     * Get queue statistics
     */
    getStats(): {
        pending: number;
        running: number;
        completed: number;
        failed: number;
        total: number;
        maxConcurrency: number;
        utilization: number;
        strategy: string;
        elapsedMs?: number;
    };
    /**
     * Check if queue is idle (no pending or running tasks)
     */
    isIdle(): boolean;
    /**
     * Check if queue is at capacity
     */
    isAtCapacity(): boolean;
    /**
     * Update concurrency limit (useful for runtime configuration changes)
     */
    setConcurrency(maxConcurrentCalls: number): void;
    /**
     * Set processing strategy
     */
    setStrategy(strategy: 'fifo' | 'priority' | 'balanced'): void;
    /**
     * Get failed tasks with their errors
     */
    getFailedTasks(): Map<string, Error>;
    /**
     * Reset queue (clear all state)
     */
    reset(): void;
}
export declare function getGlobalLLMQueue(options?: LLMQueueOptions): LLMQueueManager;
export declare function resetGlobalLLMQueue(): void;
//# sourceMappingURL=llm-queue-manager.d.ts.map