/**
 * Test Specification Loader
 *
 * Loads pre-generated test specifications from eval-spec.json files
 * and converts them to TestSpec format for execution orchestration.
 *
 * This component bridges the gap between the analysis phase (where tests
 * are generated and saved) and the execution phase (where tests are run).
 */
import { TestSpec } from './types';
import { EvalSpec } from '../types/eval-spec';
import { DimensionMetadataService } from '../dimensions/dimension-metadata';
export interface LoadedTestSpecs {
    testSpecs: TestSpec[];
    metadata: {
        totalTests: number;
        agentCount: number;
        dimensionCount: number;
        multiRunTests: number;
        generatedBy: string[];
    };
}
export declare class TestSpecLoader {
    private metadataService?;
    /**
     * Set dimension metadata service for dynamic multi-run detection
     */
    setMetadataService(service: DimensionMetadataService): void;
    /**
     * Check if a dimension supports multi-run based on test config or dimension metadata
     */
    private supportsMultiRun;
    /**
     * Get default run count for a dimension
     */
    private getDefaultRunCount;
    /**
     * Normalize input by extracting from nested structures if needed
     */
    private normalizeInput;
    /**
     * Generate run IDs for multi-run tests based on parent test ID
     */
    private generateRunIds;
    /**
     * Load agent test specifications from eval-spec.json
     */
    loadAgentTests(agents: Record<string, any>, selectedAgents: string[], selectedDimensions: string[]): Promise<LoadedTestSpecs>;
    /**
     * Load team test specifications from eval-spec.json
     */
    loadTeamTests(teams: Record<string, any>, selectedTeams: string[], selectedDimensions: string[]): Promise<LoadedTestSpecs>;
    /**
     * Load flow test specifications from eval-spec.json
     */
    loadFlowTests(flows: Record<string, any>, selectedFlows: string[], selectedDimensions: string[]): Promise<LoadedTestSpecs>;
    /**
     * Load test specifications from eval-spec.json for selected agents and dimensions
     * @deprecated Use loadAgentTests() instead for explicit agent loading
     */
    loadTestsFromSpec(evalSpec: EvalSpec, selectedAgents: string[], selectedDimensions: string[]): Promise<LoadedTestSpecs>;
    /**
     * Validate that required test specifications exist
     */
    validateTestSpecs(evalSpec: EvalSpec, selectedAgents: string[], selectedDimensions: string[]): {
        valid: boolean;
        missing: Array<{
            agent: string;
            dimension: string;
            reason: string;
        }>;
        warnings: string[];
    };
    /**
     * Get summary of available test specifications
     */
    getSpecSummary(evalSpec: EvalSpec): {
        agents: Array<{
            name: string;
            dimensions: string[];
            totalTests: number;
            lastGenerated?: string;
        }>;
        totalAgents: number;
        totalDimensions: number;
        totalTests: number;
    };
}
//# sourceMappingURL=test-spec-loader.d.ts.map