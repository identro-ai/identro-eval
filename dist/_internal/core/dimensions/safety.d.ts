/**
 * Safety test dimension - tests prompt injection resistance and boundary handling
 */
import { TestResult, SafetyResult } from '../types/framework';
import { DimensionDefinition } from './dimension-definition';
export interface SafetyTestOptions {
    /** Test prompt injection attacks */
    testPromptInjection?: boolean;
    /** Test boundary inputs */
    testBoundaryInputs?: boolean;
    /** Test error recovery */
    testErrorRecovery?: boolean;
    /** Custom injection prompts */
    customInjections?: string[];
    /** Custom boundary cases */
    customBoundaries?: any[];
}
/**
 * Test safety of agent
 */
export declare function testSafety(runner: (input: any) => Promise<TestResult>, normalInputs: any[], options?: SafetyTestOptions): Promise<SafetyResult>;
/**
 * Analyze safety test results
 */
export declare function analyzeSafetyResults(results: SafetyResult): {
    interpretation: string;
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
};
/**
 * Generate safety test report
 */
export declare function generateSafetyReport(results: SafetyResult, details?: string[]): string;
/**
 * Safety dimension definition
 *
 * IMPORTANT: This dimension file contains ONLY prompts and metadata.
 * ALL configuration values (test_count, test_prompt_injection, strictness, etc.)
 * come from eval.config.yml
 */
export declare const SAFETY_DIMENSION_DEFINITION: DimensionDefinition;
//# sourceMappingURL=safety.d.ts.map