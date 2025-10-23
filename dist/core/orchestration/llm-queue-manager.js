"use strict";
/**
 * LLM Queue Manager
 *
 * Manages concurrent LLM calls for dimension generation and evaluation.
 * Respects the max_concurrent_llm_calls configuration from YAML.
 * Separate from ExecutionPool which manages test execution concurrency.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMQueueManager = void 0;
exports.getGlobalLLMQueue = getGlobalLLMQueue;
exports.resetGlobalLLMQueue = resetGlobalLLMQueue;
const config_manager_1 = require("../config/config-manager");
class LLMQueueManager {
    maxConcurrentCalls;
    strategy;
    options;
    // Queue management
    pendingTasks = [];
    runningTasks = new Map();
    completedTasks = new Set();
    failedTasks = new Map();
    // Statistics
    totalTasks = 0;
    startTime;
    constructor(options = {}) {
        const config = (0, config_manager_1.getGlobalConfig)();
        const llmConfig = config.getLLM();
        // Use config value for max concurrent LLM calls
        this.maxConcurrentCalls = options.maxConcurrentCalls ?? llmConfig.max_concurrent_llm_calls ?? 3;
        this.strategy = options.strategy ?? 'fifo';
        this.options = options;
    }
    /**
     * Add a task to the queue
     */
    enqueue(task) {
        return new Promise((resolve, reject) => {
            const wrappedTask = {
                ...task,
                execute: async () => {
                    const taskStartTime = Date.now();
                    try {
                        // Notify task start
                        if (this.options.onTaskStart) {
                            this.options.onTaskStart(task);
                        }
                        // Execute the actual task
                        const result = await task.execute();
                        const duration = this.startTime ? Date.now() - this.startTime : 0;
                        // Mark as completed
                        this.completedTasks.add(task.id);
                        // Notify completion
                        if (this.options.onTaskComplete) {
                            this.options.onTaskComplete(task, result, duration);
                        }
                        // Update progress
                        this.updateProgress();
                        resolve(result);
                        return result;
                    }
                    catch (error) {
                        const duration = Date.now() - taskStartTime;
                        const err = error;
                        // Mark as failed
                        this.failedTasks.set(task.id, err);
                        // Notify error
                        if (this.options.onTaskError) {
                            this.options.onTaskError(task, err, duration);
                        }
                        // Update progress
                        this.updateProgress();
                        reject(err);
                        throw err;
                    }
                }
            };
            // Add to pending queue
            this.pendingTasks.push(wrappedTask);
            this.totalTasks++;
            // Start processing if not already started
            if (!this.startTime) {
                this.startTime = Date.now();
            }
            // Try to process immediately
            this.processQueue();
        });
    }
    /**
     * Add multiple tasks and wait for all to complete
     */
    async enqueueBatch(tasks) {
        const promises = tasks.map(task => this.enqueue(task));
        return Promise.all(promises);
    }
    /**
     * Process the queue (internal)
     */
    processQueue() {
        // Check if we can start more tasks
        while (this.runningTasks.size < this.maxConcurrentCalls && this.pendingTasks.length > 0) {
            // Get next task based on strategy
            const task = this.getNextTask();
            if (!task)
                break;
            // Remove from pending
            const index = this.pendingTasks.indexOf(task);
            if (index > -1) {
                this.pendingTasks.splice(index, 1);
            }
            // Start execution immediately (don't await)
            const promise = task.execute().finally(() => {
                // Remove from running tasks when done
                this.runningTasks.delete(task.id);
                // Try to process more tasks
                this.processQueue();
            });
            // Track running task
            this.runningTasks.set(task.id, promise);
        }
    }
    /**
     * Get next task based on strategy
     */
    getNextTask() {
        if (this.pendingTasks.length === 0)
            return null;
        switch (this.strategy) {
            case 'priority':
                // Sort by priority (higher first), then by order added
                this.pendingTasks.sort((a, b) => {
                    const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
                    return priorityDiff !== 0 ? priorityDiff : 0; // Maintain insertion order for same priority
                });
                return this.pendingTasks[0];
            case 'balanced':
                // Try to balance different types of tasks
                // For now, just use FIFO (can be enhanced later)
                return this.pendingTasks[0];
            case 'fifo':
            default:
                return this.pendingTasks[0];
        }
    }
    /**
     * Update progress callback
     */
    updateProgress() {
        if (this.options.onProgress) {
            const completed = this.completedTasks.size + this.failedTasks.size;
            const running = this.runningTasks.size;
            this.options.onProgress(completed, this.totalTasks, running);
        }
    }
    /**
     * Wait for all tasks to complete
     */
    async drain() {
        // Process any pending tasks first
        this.processQueue();
        // Wait for all running tasks to complete
        while (this.runningTasks.size > 0) {
            await Promise.allSettled(Array.from(this.runningTasks.values()));
        }
    }
    /**
     * Clear all pending tasks
     */
    clear() {
        this.pendingTasks = [];
    }
    /**
     * Get queue statistics
     */
    getStats() {
        const stats = {
            pending: this.pendingTasks.length,
            running: this.runningTasks.size,
            completed: this.completedTasks.size,
            failed: this.failedTasks.size,
            total: this.totalTasks,
            maxConcurrency: this.maxConcurrentCalls,
            utilization: this.runningTasks.size / this.maxConcurrentCalls,
            strategy: this.strategy,
            elapsedMs: this.startTime ? Date.now() - this.startTime : undefined,
        };
        return stats;
    }
    /**
     * Check if queue is idle (no pending or running tasks)
     */
    isIdle() {
        return this.pendingTasks.length === 0 && this.runningTasks.size === 0;
    }
    /**
     * Check if queue is at capacity
     */
    isAtCapacity() {
        return this.runningTasks.size >= this.maxConcurrentCalls;
    }
    /**
     * Update concurrency limit (useful for runtime configuration changes)
     */
    setConcurrency(maxConcurrentCalls) {
        this.maxConcurrentCalls = Math.max(1, maxConcurrentCalls);
        // Try to process more tasks if limit was increased
        if (this.pendingTasks.length > 0) {
            this.processQueue();
        }
    }
    /**
     * Set processing strategy
     */
    setStrategy(strategy) {
        this.strategy = strategy;
    }
    /**
     * Get failed tasks with their errors
     */
    getFailedTasks() {
        return new Map(this.failedTasks);
    }
    /**
     * Reset queue (clear all state)
     */
    reset() {
        this.pendingTasks = [];
        this.runningTasks.clear();
        this.completedTasks.clear();
        this.failedTasks.clear();
        this.totalTasks = 0;
        this.startTime = undefined;
    }
}
exports.LLMQueueManager = LLMQueueManager;
/**
 * Global LLM Queue Manager instance
 * Can be used across the application for consistent LLM call management
 */
let globalLLMQueue = null;
function getGlobalLLMQueue(options) {
    if (!globalLLMQueue) {
        globalLLMQueue = new LLMQueueManager(options);
    }
    return globalLLMQueue;
}
function resetGlobalLLMQueue() {
    globalLLMQueue = null;
}
//# sourceMappingURL=llm-queue-manager.js.map