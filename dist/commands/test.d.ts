/**
 * Test command - Run evaluation tests
 *
 * Uses SimplifiedTestRunner (same as interactive command) to ensure:
 * - Process pooling (85% performance improvement)
 * - Single source of truth (TestStateManager)
 * - No double orchestration
 * - Proper concurrency control
 */
import { Command } from 'commander';
export declare function testCommand(): Command;
//# sourceMappingURL=test.d.ts.map