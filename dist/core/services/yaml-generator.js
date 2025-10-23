"use strict";
/**
 * YAML Generator
 *
 * Generates human-readable YAML files from eval-spec.json
 * Organizes agents, teams, and tests into browsable folder structure
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YamlGenerator = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
/**
 * Generates YAML files from eval-spec.json
 */
class YamlGenerator {
    identroPath;
    constructor(projectPath, _options) {
        this.identroPath = path.join(projectPath, '.identro');
        // Options reserved for future use (Phase 2: bidirectional sync)
    }
    /**
     * Generate all YAML files from eval spec
     */
    async generateAllYamlFiles(evalSpec) {
        // Create directory structure
        await this.createDirectoryStructure();
        // Generate agent YAML files
        await this.generateAgentYamls(evalSpec);
        // Generate team YAML files
        if (evalSpec.teams) {
            await this.generateTeamYamls(evalSpec);
        }
        // Generate flow YAML files
        if (evalSpec.flows) {
            await this.generateFlowYamls(evalSpec);
        }
        // Generate test YAML files
        await this.generateTestYamls(evalSpec);
        // Generate README
        await this.generateReadme(evalSpec);
    }
    /**
     * Create directory structure
     */
    async createDirectoryStructure() {
        const dirs = [
            'agents',
            'teams',
            'flows',
            'tests',
            'tests/agents',
            'tests/teams',
            'tests/flows',
        ];
        for (const dir of dirs) {
            await fs.mkdir(path.join(this.identroPath, dir), { recursive: true });
        }
    }
    /**
     * Generate agent YAML files
     */
    async generateAgentYamls(evalSpec) {
        const agentsPath = path.join(this.identroPath, 'agents');
        for (const [agentId, agentSpec] of Object.entries(evalSpec.agents)) {
            const yamlData = this.generateAgentYaml(agentId, agentSpec);
            const filename = this.sanitizeFilename(agentId) + '.yml';
            const filepath = path.join(agentsPath, filename);
            await fs.writeFile(filepath, yamlData, 'utf-8');
        }
    }
    /**
     * Generate agent YAML data
     */
    generateAgentYaml(agentId, agentSpec) {
        const data = {
            _version: {
                version: agentSpec.discovered?.version || 1,
                generated_at: new Date().toISOString(),
                source_hash: agentSpec.discovered?.sourceHash,
                previous_version: agentSpec.discovered?.version ? agentSpec.discovered.version - 1 : undefined,
            },
            name: agentId,
            type: agentSpec.type,
            description: agentSpec.description || '',
        };
        // Discovery metadata
        if (agentSpec.discovered) {
            data.discovered = {
                first_seen: agentSpec.discovered.firstSeen,
                last_modified: agentSpec.discovered.lastModified,
                source_hash: agentSpec.discovered.sourceHash,
                path: agentSpec.discovered.path,
                version: agentSpec.discovered.version,
            };
        }
        // Complete contract
        if (agentSpec.contract) {
            data.contract = {
                role: agentSpec.contract.role,
                goal: agentSpec.contract.goal,
                capabilities: agentSpec.contract.capabilities,
                inputSchema: agentSpec.contract.inputSchema,
                outputSchema: agentSpec.contract.outputSchema,
            };
        }
        // Performance tracking
        if (agentSpec.performance) {
            data.performance = {
                last_run: agentSpec.performance.lastRun,
                total_runs: agentSpec.performance.totalRuns,
                average_score: agentSpec.performance.averageScore,
                score_history: agentSpec.performance.scoreHistory?.slice(-10), // Last 10 runs
                trends: agentSpec.performance.trends,
            };
        }
        // User notes section
        data.notes = '';
        return this.dumpYaml(data);
    }
    /**
     * Generate team YAML files
     */
    async generateTeamYamls(evalSpec) {
        if (!evalSpec.teams)
            return;
        const teamsPath = path.join(this.identroPath, 'teams');
        for (const [teamName, teamSpec] of Object.entries(evalSpec.teams)) {
            const yamlData = this.generateTeamYaml(teamName, teamSpec);
            const filename = this.sanitizeFilename(teamName) + '.yml';
            const filepath = path.join(teamsPath, filename);
            await fs.writeFile(filepath, yamlData, 'utf-8');
        }
    }
    /**
     * Generate team YAML data
     */
    generateTeamYaml(teamName, teamSpec) {
        const data = {
            _version: {
                version: teamSpec.discovered?.version || 1,
                generated_at: new Date().toISOString(),
            },
            name: teamName,
            type: 'crew',
            description: teamSpec.description || '',
        };
        // Team composition
        data.members = teamSpec.members;
        if (teamSpec.coordinator) {
            data.coordinator = teamSpec.coordinator;
        }
        // Discovery metadata
        if (teamSpec.discovered) {
            data.discovered = {
                first_seen: teamSpec.discovered.firstSeen,
                last_modified: teamSpec.discovered.lastModified,
                path: teamSpec.discovered.path,
                version: teamSpec.discovered.version,
            };
        }
        // Complete contract
        if (teamSpec.contract) {
            data.contract = teamSpec.contract;
        }
        // Analysis data (only include if it exists and is not part of contract)
        if (teamSpec.analysis) {
            data.analysis = {
                crew_metadata: teamSpec.analysis.crewMetadata,
                behavioral_dimensions: teamSpec.analysis.behavioralDimensions,
                external_interactions: teamSpec.analysis.externalInteractions,
                flow_chart: teamSpec.analysis.flowChart,
                yaml_config: teamSpec.analysis.yamlConfig,
            };
        }
        // Execution config
        if (teamSpec.executionConfig) {
            data.execution_config = teamSpec.executionConfig;
        }
        // Performance tracking
        if (teamSpec.performance) {
            data.performance = {
                last_run: teamSpec.performance.lastRun,
                total_runs: teamSpec.performance.totalRuns,
                average_score: teamSpec.performance.averageScore,
                score_history: teamSpec.performance.scoreHistory?.slice(-10),
                trends: teamSpec.performance.trends,
            };
        }
        // User notes section
        data.notes = '';
        return this.dumpYaml(data);
    }
    /**
     * Generate flow YAML files
     */
    async generateFlowYamls(evalSpec) {
        if (!evalSpec.flows)
            return;
        const flowsPath = path.join(this.identroPath, 'flows');
        for (const [flowName, flowSpec] of Object.entries(evalSpec.flows)) {
            const yamlData = this.generateFlowYaml(flowName, flowSpec);
            const filename = this.sanitizeFilename(flowName) + '.yml';
            const filepath = path.join(flowsPath, filename);
            await fs.writeFile(filepath, yamlData, 'utf-8');
        }
    }
    /**
     * Generate flow YAML data
     */
    generateFlowYaml(flowName, flowSpec) {
        const data = {
            _version: {
                version: flowSpec.discovered?.version || 1,
                generated_at: new Date().toISOString(),
            },
            name: flowName,
            type: 'workflow',
            description: flowSpec.description || '',
        };
        // Discovery metadata
        if (flowSpec.discovered) {
            data.discovered = {
                first_seen: flowSpec.discovered.firstSeen,
                last_modified: flowSpec.discovered.lastModified,
                path: flowSpec.discovered.path,
                version: flowSpec.discovered.version,
            };
        }
        // Analysis data
        if (flowSpec.analysis) {
            data.analysis = flowSpec.analysis;
        }
        // Contract
        if (flowSpec.contract) {
            data.contract = flowSpec.contract;
        }
        // Execution config
        if (flowSpec.executionConfig) {
            data.execution_config = flowSpec.executionConfig;
        }
        // Performance tracking
        if (flowSpec.performance) {
            data.performance = {
                last_run: flowSpec.performance.lastRun,
                total_runs: flowSpec.performance.totalRuns,
                average_score: flowSpec.performance.averageScore,
                score_history: flowSpec.performance.scoreHistory?.slice(-10),
                trends: flowSpec.performance.trends,
            };
        }
        // User notes section
        data.notes = '';
        return this.dumpYaml(data);
    }
    /**
     * Generate test YAML files
     */
    async generateTestYamls(evalSpec) {
        // Generate agent tests
        for (const [agentId, agentSpec] of Object.entries(evalSpec.agents)) {
            if (agentSpec.testSpecs) {
                await this.generateEntityTests('agent', agentId, agentSpec.testSpecs);
            }
        }
        // Generate team tests
        if (evalSpec.teams) {
            for (const [teamName, teamSpec] of Object.entries(evalSpec.teams)) {
                if (teamSpec.testSpecs) {
                    await this.generateEntityTests('team', teamName, teamSpec.testSpecs);
                }
            }
        }
        // Generate flow tests
        if (evalSpec.flows) {
            for (const [flowName, flowSpec] of Object.entries(evalSpec.flows)) {
                if (flowSpec.testSpecs) {
                    await this.generateEntityTests('flow', flowName, flowSpec.testSpecs);
                }
            }
        }
    }
    /**
     * Generate tests for a specific entity
     */
    async generateEntityTests(entityType, entityName, testSpecs) {
        const entityDir = path.join(this.identroPath, 'tests', `${entityType}s`, this.sanitizeFilename(entityName));
        await fs.mkdir(entityDir, { recursive: true });
        for (const [dimension, dimensionTests] of Object.entries(testSpecs)) {
            const yamlData = this.generateTestYaml(entityType, entityName, dimension, dimensionTests);
            const filename = `${dimension}.yml`;
            const filepath = path.join(entityDir, filename);
            await fs.writeFile(filepath, yamlData, 'utf-8');
        }
    }
    /**
     * Generate test YAML data
     */
    generateTestYaml(entityType, entityName, dimension, dimensionTests) {
        const data = {
            dimension: dimension,
            entity_type: entityType,
            entity: entityName,
            generated_at: dimensionTests.generated,
            generated_by: dimensionTests.generatedBy,
        };
        // Convert tests
        data.tests = dimensionTests.tests.map(test => this.convertTestSpecification(test));
        // User notes section
        data.notes = '';
        return this.dumpYaml(data);
    }
    /**
     * Convert test specification to YAML format
     */
    convertTestSpecification(test) {
        const testData = {
            id: test.id,
            name: test.name,
            ui_description: test.ui_description,
            input: test.input,
        };
        // Expected output
        if (test.expected) {
            testData.expected = test.expected;
        }
        // Evaluation criteria
        if (test.evaluation_criteria) {
            testData.evaluation_criteria = test.evaluation_criteria;
        }
        else if (test.evaluationCriteria) {
            // Handle legacy format
            testData.evaluation_criteria = Array.isArray(test.evaluationCriteria)
                ? test.evaluationCriteria
                : [];
        }
        // Test-level thresholds
        if (test.thresholds) {
            testData.thresholds = test.thresholds;
        }
        // Multi-run configuration
        if (test.multiRun) {
            testData.multi_run = {
                enabled: test.multiRun.enabled,
                run_count: test.multiRun.runCount,
                run_type: test.multiRun.runType,
                variations: test.multiRun.variations,
                aggregation_strategy: test.multiRun.aggregationStrategy,
                execution_mode: test.multiRun.executionMode,
                input_variations: test.multiRun.inputVariations,
            };
        }
        // Flow metadata
        if (test.flowMetadata) {
            testData.flow_metadata = test.flowMetadata;
        }
        // Synthetic inputs
        if (test.syntheticInputs) {
            testData.synthetic_inputs = test.syntheticInputs;
        }
        // Test metadata
        testData.priority = test.priority || 3;
        if (test.tags) {
            testData.tags = test.tags;
        }
        // User modifications
        if (test.userModified) {
            testData.user_modified = true;
        }
        if (test.userNotes) {
            testData.user_notes = test.userNotes;
        }
        // Generation metadata
        if (test.generatedBy) {
            testData.generated_by = test.generatedBy;
        }
        if (test.generatedAt) {
            testData.generated_at = test.generatedAt;
        }
        // LLM generation context
        if (test.llmGeneration) {
            testData.llm_generation = test.llmGeneration;
        }
        return testData;
    }
    /**
     * Generate README.md
     */
    async generateReadme(evalSpec) {
        const readme = this.buildReadmeContent(evalSpec);
        const readmePath = path.join(this.identroPath, 'README.md');
        await fs.writeFile(readmePath, readme, 'utf-8');
    }
    /**
     * Build README content
     */
    buildReadmeContent(evalSpec) {
        const agentCount = Object.keys(evalSpec.agents).length;
        const teamCount = evalSpec.teams ? Object.keys(evalSpec.teams).length : 0;
        const flowCount = evalSpec.flows ? Object.keys(evalSpec.flows).length : 0;
        let content = `# .identro Folder Structure

This folder contains human-readable YAML files generated from your \`eval-spec.json\`.

## Overview

- **Project**: ${evalSpec.project.framework} (${evalSpec.project.language})
- **Agents**: ${agentCount}
- **Teams/Crews**: ${teamCount}
- **Flows**: ${flowCount}
- **Version**: ${evalSpec.version}
- **Last Updated**: ${evalSpec.metadata?.updated_at || 'N/A'}

## Folder Structure

\`\`\`
.identro/
├── agents/              # Individual agent specifications
│   ├── agent_name.yml   # One file per agent
│   └── ...
│
├── teams/               # Team/crew specifications  
│   ├── team_name.yml    # One file per team
│   └── ...
│
├── flows/               # Workflow specifications (if applicable)
│   ├── flow_name.yml    # One file per flow
│   └── ...
│
├── tests/               # Test specifications by entity
│   ├── agents/
│   │   ├── agent_name/
│   │   │   ├── accuracy.yml
│   │   │   ├── consistency.yml
│   │   │   └── ...
│   │   └── ...
│   ├── teams/
│   │   └── ...
│   └── flows/
│       └── ...
│
├── dimensions/          # Dimension configurations (existing)
│   ├── accuracy.yml
│   ├── consistency.yml
│   └── ...
│
├── history/             # Version history
│   ├── snapshots/       # Versioned snapshots
│   │   └── 2025-10-23T14-30-15/
│   ├── manifest.yml     # Version tracking
│   └── eval-spec-*.json # Eval spec backups
│
├── reports/             # Generated reports (existing)
│   ├── manifest.json
│   └── report-*.html
│
├── eval-spec.json       # SOURCE OF TRUTH (programmatic)
├── eval.config.yml      # User configuration (existing)
├── .identro-version     # Current version pointer
└── README.md            # This file
\`\`\`

## File Purposes

### agents/*.yml
Individual agent specifications with:
- Discovery metadata (when found, source hash, version)
- Complete contract (role, goal, backstory, capabilities)
- Performance tracking (runs, scores, history)
- User-editable notes section

### teams/*.yml
Team/crew specifications with:
- Team composition (members, coordinator, process)
- Complete contract and analysis
- Workflow visualization
- YAML configuration (agents.yaml/tasks.yaml content)
- Performance tracking
- User-editable notes section

### flows/*.yml
Workflow specifications with:
- Flow metadata and analysis
- Behavioral patterns
- External integrations
- Execution configuration
- Performance tracking
- User-editable notes section

### tests/{entity_type}/{entity_name}/{dimension}.yml
Test specifications organized by entity and dimension:
- Test metadata (dimension, entity, generation info)
- Multiple test cases
- Input data and expected outputs
- **User-editable evaluation criteria**
- Test-level threshold overrides
- Multi-run configuration
- User notes section

## Important Notes

### Source of Truth
- **eval-spec.json** is the authoritative source
- YAML files are generated from eval-spec.json
- Future versions may support bidirectional sync

### Version Management
- Snapshots created on analysis/test generation
- Version history tracked in \`history/manifest.yml\`
- Current version pointer in \`.identro-version\`
- Old snapshots automatically cleaned up

### Editing YAML Files

**Phase 1 (Current)**: YAML files are **read-only**
- Generated automatically from eval-spec.json
- Regenerated on analysis and test generation
- Manual edits will be overwritten

**Future**: Bidirectional sync planned
- Edit YAML files directly
- Changes synced back to eval-spec.json
- User modifications preserved

### Safe Editing Areas

Even in read-only phase, these sections are planned for user editing:
- \`notes:\` sections in all files
- \`evaluation_criteria:\` in test files (with strictness levels)
- \`user_notes:\` in test specifications

## Regeneration

YAML files are automatically regenerated:
- After agent/team analysis
- After test generation
- Version snapshots created before regeneration

## Related Commands

\`\`\`bash
# Run evaluation (auto-generates YAML)
identro-eval interactive --path <project>

# View test reports
identro-eval report list
identro-eval report view <id>

# Future: Manual regeneration
identro-eval refresh-yaml

# Future: Version management
identro-eval versions list
identro-eval versions compare <v1> <v2>
identro-eval versions restore <version>
\`\`\`

## Questions?

For more information:
- See main README.md in project root
- Check documentation at https://github.com/identro-ai/identro-eval
- Report issues using GitHub Issues
`;
        // Add agent list
        if (agentCount > 0) {
            content += `\n## Agents in This Project\n\n`;
            for (const agentId of Object.keys(evalSpec.agents)) {
                content += `- **${agentId}**: \`agents/${this.sanitizeFilename(agentId)}.yml\`\n`;
            }
        }
        // Add team list
        if (teamCount > 0) {
            content += `\n## Teams in This Project\n\n`;
            for (const teamName of Object.keys(evalSpec.teams)) {
                content += `- **${teamName}**: \`teams/${this.sanitizeFilename(teamName)}.yml\`\n`;
            }
        }
        // Add flow list
        if (flowCount > 0) {
            content += `\n## Flows in This Project\n\n`;
            for (const flowName of Object.keys(evalSpec.flows)) {
                content += `- **${flowName}**: \`flows/${this.sanitizeFilename(flowName)}.yml\`\n`;
            }
        }
        content += `\n---

*Generated by Identro Eval v${evalSpec.version} on ${new Date().toISOString()}*\n`;
        return content;
    }
    /**
     * Dump object to YAML string
     */
    dumpYaml(data) {
        return js_yaml_1.default.dump(data, {
            indent: 2,
            lineWidth: 100,
            noRefs: true,
            sortKeys: false,
        });
    }
    /**
     * Update specific agent YAML file with enriched contract
     */
    async updateAgentYaml(agentId, agentSpec) {
        const agentsPath = path.join(this.identroPath, 'agents');
        const filename = this.sanitizeFilename(agentId) + '.yml';
        const filepath = path.join(agentsPath, filename);
        const yamlData = this.generateAgentYaml(agentId, agentSpec);
        await fs.writeFile(filepath, yamlData, 'utf-8');
    }
    /**
     * Update specific team YAML file with enriched contract
     */
    async updateTeamYaml(teamName, teamSpec) {
        const teamsPath = path.join(this.identroPath, 'teams');
        const filename = this.sanitizeFilename(teamName) + '.yml';
        const filepath = path.join(teamsPath, filename);
        const yamlData = this.generateTeamYaml(teamName, teamSpec);
        await fs.writeFile(filepath, yamlData, 'utf-8');
    }
    /**
     * Update test YAML files for a specific entity
     */
    async updateEntityTestYamls(entityType, entityName, testSpecs) {
        await this.generateEntityTests(entityType, entityName, testSpecs);
    }
    /**
     * Sanitize filename
     */
    sanitizeFilename(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }
}
exports.YamlGenerator = YamlGenerator;
exports.default = YamlGenerator;
//# sourceMappingURL=yaml-generator.js.map