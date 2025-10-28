"use strict";
/**
 * Test Orchestration Module - Simplified Architecture
 *
 * Exports only the essential components needed for the simplified architecture.
 * TestOrchestrator, ExecutionPool, TestQueueManager, and CentralLogger have been removed
 * to eliminate double orchestration and simplify the architecture.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestSpecLoader = exports.LLMQueueManager = void 0;
__exportStar(require("./types"), exports);
var llm_queue_manager_1 = require("./llm-queue-manager");
Object.defineProperty(exports, "LLMQueueManager", { enumerable: true, get: function () { return llm_queue_manager_1.LLMQueueManager; } });
var test_spec_loader_1 = require("./test-spec-loader");
Object.defineProperty(exports, "TestSpecLoader", { enumerable: true, get: function () { return test_spec_loader_1.TestSpecLoader; } });
//# sourceMappingURL=index.js.map