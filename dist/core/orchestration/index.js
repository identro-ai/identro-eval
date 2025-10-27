/**
 * Test Orchestration Module - Simplified Architecture
 *
 * Exports only the essential components needed for the simplified architecture.
 * TestOrchestrator, ExecutionPool, TestQueueManager, and CentralLogger have been removed
 * to eliminate double orchestration and simplify the architecture.
 */
export * from './types';
export { LLMQueueManager } from './llm-queue-manager';
export { TestSpecLoader } from './test-spec-loader';
//# sourceMappingURL=index.js.map