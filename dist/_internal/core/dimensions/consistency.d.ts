/**
 * Consistency test dimension - tests output consistency across multiple runs
 */
import { TestResult, ConsistencyResult } from '../types/framework';
import { DimensionDefinition } from './dimension-definition';
export interface ConsistencyTestOptions {
    /** Number of times to run each input */
    runsPerInput?: number;
    /** Similarity threshold (0-1) to consider outputs consistent */
    similarityThreshold?: number;
    /** Custom similarity function */
    similarityFn?: (a: any, b: any) => number;
}
/**
 * Test consistency of agent outputs
 */
export declare function testConsistency(runner: (input: any) => Promise<TestResult>, inputs: any[], options?: ConsistencyTestOptions): Promise<ConsistencyResult>;
/**
 * Analyze consistency dimensions
 */
export declare function analyzeConsistencyDimensions(results: ConsistencyResult): {
    interpretation: string;
    recommendations: string[];
    score: number;
};
/**
 * Consistency dimension definition
 *
 * IMPORTANT: This dimension file contains ONLY prompts and metadata.
 * ALL configuration values (test_count, runs_per_input, strictness, etc.)
 * come from eval.config.yml
 */
export declare const CONSISTENCY_DIMENSION_DEFINITION: DimensionDefinition;
//# sourceMappingURL=consistency.d.ts.map