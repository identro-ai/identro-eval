/**
 * Generic Test Generator - Dimension File-Based Test Generation
 *
 * Generates test specifications using dimension definitions from YAML files
 * instead of hardcoded generators. This is the single source of truth for
 * test generation that uses user-editable dimension files.
 */
import { TestSpec } from '../orchestration/types';
import { LLMProvider } from '../analysis/llm-provider';
import { ExtractedContract } from '../analysis/types';
import { LLMQueueManager } from '../orchestration/llm-queue-manager';
import { DimensionDefinition } from './dimension-definition';
/**
 * Generate test specifications from dimension definition (YAML file)
 *
 * This replaces the hardcoded dimension generators and uses dimension definitions
 * loaded from .identro/dimensions/*.yml files that users can edit.
 */
export declare function generateTestsFromDimension(dimensionDefinition: DimensionDefinition, entity: any, llmProvider: LLMProvider, options?: {
    runsPerInput?: number;
    variationsPerInput?: number;
    contract?: ExtractedContract;
    structure?: any;
    multiRunEnabled?: boolean;
    testCount?: number;
    entityType?: 'agent' | 'team';
    config?: any;
    llmQueue?: LLMQueueManager;
    context?: any;
}): Promise<TestSpec[]>;
//# sourceMappingURL=generic-test-generator.d.ts.map