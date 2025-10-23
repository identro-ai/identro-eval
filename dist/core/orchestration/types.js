"use strict";
/**
 * Test Orchestration Types
 *
 * Core types for the centralized test orchestration system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestState = void 0;
/**
 * Test execution state
 */
var TestState;
(function (TestState) {
    TestState["QUEUED"] = "queued";
    TestState["RUNNING"] = "running";
    TestState["COMPLETED"] = "completed";
    TestState["FAILED"] = "failed";
    TestState["RETRYING"] = "retrying";
    TestState["TIMEOUT"] = "timeout";
    TestState["CANCELLED"] = "cancelled";
})(TestState || (exports.TestState = TestState = {}));
//# sourceMappingURL=types.js.map