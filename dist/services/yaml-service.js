"use strict";
/**
 * YAML Service - Handles YAML file generation and updates
 *
 * Manages YAML file operations separate from analysis logic
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.YamlService = void 0;
class YamlService {
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    /**
     * Generate all YAML files after analysis (initial creation)
     */
    async generateAllAfterAnalysis(evalSpec) {
        try {
            const { YamlGenerator, VersionManager } = await Promise.resolve().then(() => __importStar(require('@identro/eval-core')));
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
            const { YamlGenerator } = await Promise.resolve().then(() => __importStar(require('@identro/eval-core')));
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
exports.YamlService = YamlService;
//# sourceMappingURL=yaml-service.js.map