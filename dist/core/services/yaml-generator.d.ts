/**
 * YAML Generator
 *
 * Generates human-readable YAML files from eval-spec.json
 * Organizes agents, teams, and tests into browsable folder structure
 */
import { EvalSpec, AgentEvalSpec, TeamSpec, DimensionTestSpecs } from '../types/eval-spec';
export interface YamlGeneratorOptions {
    includeComments?: boolean;
    includeUserNotes?: boolean;
    prettyPrint?: boolean;
}
/**
 * Generates YAML files from eval-spec.json
 */
export declare class YamlGenerator {
    private identroPath;
    constructor(projectPath: string, _options?: YamlGeneratorOptions);
    /**
     * Generate all YAML files from eval spec
     */
    generateAllYamlFiles(evalSpec: EvalSpec): Promise<void>;
    /**
     * Create directory structure
     */
    private createDirectoryStructure;
    /**
     * Generate agent YAML files
     */
    generateAgentYamls(evalSpec: EvalSpec): Promise<void>;
    /**
     * Generate agent YAML data
     */
    private generateAgentYaml;
    /**
     * Generate team YAML files
     */
    generateTeamYamls(evalSpec: EvalSpec): Promise<void>;
    /**
     * Generate team YAML data
     */
    private generateTeamYaml;
    /**
     * Generate flow YAML files
     */
    generateFlowYamls(evalSpec: EvalSpec): Promise<void>;
    /**
     * Generate flow YAML data
     */
    private generateFlowYaml;
    /**
     * Generate test YAML files
     */
    generateTestYamls(evalSpec: EvalSpec): Promise<void>;
    /**
     * Generate tests for a specific entity
     */
    private generateEntityTests;
    /**
     * Generate test YAML data
     */
    private generateTestYaml;
    /**
     * Convert test specification to YAML format
     */
    private convertTestSpecification;
    /**
     * Generate README.md
     */
    generateReadme(evalSpec: EvalSpec): Promise<void>;
    /**
     * Build README content
     */
    private buildReadmeContent;
    /**
     * Dump object to YAML string
     */
    private dumpYaml;
    /**
     * Update specific agent YAML file with enriched contract
     */
    updateAgentYaml(agentId: string, agentSpec: AgentEvalSpec): Promise<void>;
    /**
     * Update specific team YAML file with enriched contract
     */
    updateTeamYaml(teamName: string, teamSpec: TeamSpec): Promise<void>;
    /**
     * Update test YAML files for a specific entity
     */
    updateEntityTestYamls(entityType: 'agent' | 'team' | 'flow', entityName: string, testSpecs: Record<string, DimensionTestSpecs>): Promise<void>;
    /**
     * Sanitize filename
     */
    private sanitizeFilename;
}
export default YamlGenerator;
//# sourceMappingURL=yaml-generator.d.ts.map