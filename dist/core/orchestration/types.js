/**
 * Test Orchestration Types
 *
 * Core types for the centralized test orchestration system
 */
/**
 * Test execution state
 */
export var TestState;
(function (TestState) {
    TestState["QUEUED"] = "queued";
    TestState["RUNNING"] = "running";
    TestState["COMPLETED"] = "completed";
    TestState["FAILED"] = "failed";
    TestState["RETRYING"] = "retrying";
    TestState["TIMEOUT"] = "timeout";
    TestState["CANCELLED"] = "cancelled";
})(TestState || (TestState = {}));
//# sourceMappingURL=types.js.map