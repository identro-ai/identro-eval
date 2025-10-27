/**
 * YAML Service - Handles YAML file generation and updates
 *
 * Manages YAML file operations separate from analysis logic
 */
export class YamlService {
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    /**
     * Generate all YAML files after analysis (initial creation)
     */
    async generateAllAfterAnalysis(evalSpec) {
        try {
            const { YamlGenerator, VersionManager } = await import('@identro/eval-core');
            const versionManager = new VersionManager(this.projectPath);
            await versionManager.initialize();
            const changes = await versionManager.detectChanges(evalSpec);
            if (!changes.hasChanges) {
                return;
            }
            await versionManager.createSnapshot(evalSpec, 'analysis', changes);
            const yamlGenerator = new YamlGenerator(this.projectPath);
            await yamlGenerator.generateAllYamlFiles(evalSpec);
        }
        catch (err) {
            console.warn('Failed to generate YAML files after analysis:', err);
        }
    }
    /**
     * Update YAML files for entities enriched during test generation
     */
    async updateAfterTestGeneration(evalSpec, enrichedEntities) {
        try {
            const { YamlGenerator } = await import('@identro/eval-core');
            const yamlGenerator = new YamlGenerator(this.projectPath);
            // Update agent YAML files (contract + tests)
            if (enrichedEntities.agents) {
                for (const agentId of enrichedEntities.agents) {
                    const agentSpec = evalSpec.agents[agentId];
                    if (agentSpec) {
                        // Update agent contract YAML
                        await yamlGenerator.updateAgentYaml(agentId, agentSpec);
                        // Update test YAML files for this agent
                        if (agentSpec.testSpecs) {
                            await yamlGenerator.updateEntityTestYamls('agent', agentId, agentSpec.testSpecs);
                        }
                    }
                }
            }
            // Update team YAML files (enriched contract + tests)
            if (enrichedEntities.teams && evalSpec.teams) {
                for (const teamName of enrichedEntities.teams) {
                    const teamSpec = evalSpec.teams[teamName];
                    if (teamSpec) {
                        // Update team contract YAML (with LLM-enriched contract)
                        await yamlGenerator.updateTeamYaml(teamName, teamSpec);
                        // Update test YAML files for this team
                        if (teamSpec.testSpecs) {
                            await yamlGenerator.updateEntityTestYamls('team', teamName, teamSpec.testSpecs);
                        }
                    }
                }
            }
        }
        catch (err) {
            console.warn('Failed to update YAML files after test generation:', err);
        }
    }
}
//# sourceMappingURL=yaml-service.js.map