/**
 * Schema validation test dimension - validates output structure against expected schema
 */
import { TestResult, SchemaResult } from '../types/framework';
import { SchemaField } from '../types/eval-spec';
export interface SchemaTestOptions {
    /** Expected schema definition */
    schema: Record<string, SchemaField>;
    /** Strict mode - fail if extra fields present */
    strict?: boolean;
    /** Allow null values for optional fields */
    allowNull?: boolean;
}
/**
 * Test schema compliance of agent outputs
 */
export declare function testSchema(runner: (input: any) => Promise<TestResult>, inputs: any[], options: SchemaTestOptions): Promise<SchemaResult>;
/**
 * Analyze schema test results
 */
export declare function analyzeSchemaResults(results: SchemaResult, _schema: Record<string, SchemaField>): {
    interpretation: string;
    recommendations: string[];
    schemaGrade: 'A' | 'B' | 'C' | 'D' | 'F';
};
/**
 * Generate schema validation report
 */
export declare function generateSchemaReport(results: SchemaResult, schema: Record<string, SchemaField>): string;
/**
 * Generate example output that matches schema
 */
export declare function generateSchemaExample(schema: Record<string, SchemaField>): any;
/**
 * Schema dimension definition
 *
 * IMPORTANT: This dimension file contains ONLY prompts and metadata.
 * ALL configuration values (test_count, strictness, etc.)
 * come from eval.config.yml
 */
import { DimensionDefinition } from './dimension-definition';
export declare const SCHEMA_DIMENSION_DEFINITION: DimensionDefinition;
//# sourceMappingURL=dimension-schema.d.ts.map