/**
 * YAML Service - Handles YAML file generation and updates
 *
 * Manages YAML file operations separate from analysis logic
 */
import type { EvalSpec } from '@identro/eval-core';
export declare class YamlService {
    private projectPath;
    constructor(projectPath: string);
    /**
     * Generate all YAML files after analysis (initial creation)
     */
    generateAllAfterAnalysis(evalSpec: EvalSpec): Promise<void>;
    /**
     * Update YAML files for entities enriched during test generation
     */
    updateAfterTestGeneration(evalSpec: EvalSpec, enrichedEntities: {
        agents?: string[];
        teams?: string[];
    }): Promise<void>;
}
//# sourceMappingURL=yaml-service.d.ts.map