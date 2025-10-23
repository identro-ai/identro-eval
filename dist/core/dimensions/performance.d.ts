/**
 * Performance test dimension - measures latency, throughput, and timeout handling
 */
import { TestResult, PerformanceResult } from '../types/framework';
import { DimensionDefinition } from './dimension-definition';
export interface PerformanceTestOptions {
    /** Maximum time to wait for response (ms) */
    timeoutMs?: number;
    /** Number of concurrent requests for throughput testing */
    concurrentRequests?: number;
    /** Warmup runs before measuring */
    warmupRuns?: number;
    /** Number of measurement runs */
    measurementRuns?: number;
}
/**
 * Test performance of agent
 */
export declare function testPerformance(runner: (input: any) => Promise<TestResult>, inputs: any[], options?: PerformanceTestOptions): Promise<PerformanceResult>;
/**
 * Analyze performance results
 */
export declare function analyzePerformanceResults(results: PerformanceResult): {
    interpretation: string;
    recommendations: string[];
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
};
/**
 * Generate performance report
 */
export declare function generatePerformanceReport(results: PerformanceResult): string;
/**
 * Compare performance between two test runs
 */
export declare function comparePerformance(baseline: PerformanceResult, current: PerformanceResult): {
    improved: boolean;
    latencyChange: number;
    throughputChange: number;
    summary: string;
};
/**
 * Performance dimension definition
 *
 * IMPORTANT: This dimension file contains ONLY prompts and metadata.
 * ALL configuration values (test_count, timeout_ms, strictness, etc.)
 * come from eval.config.yml
 */
export declare const PERFORMANCE_DIMENSION_DEFINITION: DimensionDefinition;
//# sourceMappingURL=performance.d.ts.map