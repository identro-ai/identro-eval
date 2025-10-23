"use strict";
/**
 * Analysis Service - Unified agent and team analysis logic
 *
 * Extracts analysis functionality from interactive mode to be shared
 * between interactive and standalone commands.
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
exports.AnalysisService = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const evaluation_engine_1 = require("./evaluation-engine");
const config_1 = require("../utils/config");
const eval_crewai_1 = require("@identro/eval-crewai");
class AnalysisService {
    /**
     * Analyze agents and teams, extracting contracts and capabilities
     */
    async analyzeAll(options) {
        const { projectPath, agents = [], teams = [], flows = [], framework = 'crewai', reanalyzeExisting = [], contractsOnly = false } = options;
        // Initialize EvalSpecManager
        const { EvalSpecManager } = await Promise.resolve().then(() => __importStar(require('@identro/eval-core')));
        const specManager = new EvalSpecManager(projectPath);
        await specManager.initialize();
        // Load existing spec
        let evalSpec = await specManager.load();
        const result = {
            analyzedAgents: 0,
            analyzedTeams: 0,
            analyzedFlows: 0,
            skippedAgents: 0,
            skippedTeams: 0,
            skippedFlows: 0,
            evalSpec,
            errors: []
        };
        // Analyze agents
        if (agents.length > 0) {
            const agentResult = await this.analyzeAgents(agents, evalSpec, specManager, framework, reanalyzeExisting);
            result.analyzedAgents = agentResult.analyzed;
            result.skippedAgents = agentResult.skipped;
            result.errors.push(...agentResult.errors);
        }
        // Analyze teams
        if (teams.length > 0) {
            const teamResult = await this.analyzeTeams(teams, evalSpec, specManager, framework);
            result.analyzedTeams = teamResult.analyzed;
            result.skippedTeams = teamResult.skipped;
            result.errors.push(...teamResult.errors);
        }
        // Analyze flows (NEW)
        if (flows.length > 0) {
            const flowResult = await this.analyzeFlows(flows, evalSpec, specManager, framework);
            result.analyzedFlows = flowResult.analyzed;
            result.skippedFlows = flowResult.skipped;
            result.errors.push(...flowResult.errors);
        }
        // Save eval spec
        if (result.analyzedAgents > 0 || result.analyzedTeams > 0 || result.analyzedFlows > 0) {
            await specManager.save(evalSpec, { backup: true });
            result.evalSpec = evalSpec;
            // Generate YAML files after analysis using YamlService
            const { YamlService } = await Promise.resolve().then(() => __importStar(require('./yaml-service')));
            const yamlService = new YamlService(projectPath);
            await yamlService.generateAllAfterAnalysis(evalSpec);
        }
        return result;
    }
    /**
     * Analyze individual agents - ENHANCED with integration detection
     */
    async analyzeAgents(agents, evalSpec, specManager, framework, reanalyzeExisting = []) {
        const engine = (0, evaluation_engine_1.getEvaluationEngine)();
        const config = await (0, config_1.loadConfig)();
        let analyzed = 0;
        let skipped = 0;
        const errors = [];
        // Combine agents to analyze with existing ones to re-analyze
        const agentsToAnalyze = [
            ...agents,
            ...reanalyzeExisting.map(name => ({ name, type: 'general', path: '' }))
        ];
        for (const agent of agentsToAnalyze) {
            try {
                let contract = undefined;
                // ENHANCED: Check if we have YAML config - skip LLM extraction
                if (agent.metadata?.yamlConfig && agent.metadata?.source === 'yaml') {
                    const yamlConfig = agent.metadata.yamlConfig;
                    // Detect integrations using crew-integration-detector
                    const integrations = await this.detectAgentIntegrations(agent, yamlConfig);
                    // Generate contract locally from YAML + integrations
                    contract = {
                        description: yamlConfig.goal || `${yamlConfig.role} agent`,
                        capabilities: this.inferCapabilitiesFromIntegrations(yamlConfig, integrations),
                        role: yamlConfig.role,
                        goal: yamlConfig.goal,
                        backstory: yamlConfig.backstory,
                        tools: yamlConfig.tools || [],
                        llmConfig: {
                            model: yamlConfig.llm,
                            maxIterations: yamlConfig.max_iter,
                            verbose: yamlConfig.verbose
                        },
                        behaviorConfig: {
                            allowDelegation: yamlConfig.allow_delegation,
                            maxIterations: yamlConfig.max_iter
                        },
                        // NEW: Integration metadata
                        integrations: {
                            tools: integrations.tools,
                            apis: integrations.apis,
                            databases: integrations.databases,
                            fileOperations: integrations.fileOperations,
                            llmProviders: integrations.llmProviders
                        },
                        requiredEnvVars: this.extractRequiredEnvVars(integrations),
                        confidence: 1.0, // High confidence - direct from config
                        extractedFrom: ['agents.yaml'],
                        metadata: {
                            hasDirectConfig: true,
                            configSource: 'yaml',
                            hasIntegrationAnalysis: true,
                            discoveredAt: agent.metadata.discoveredAt
                        }
                    };
                }
                else {
                    // Fallback: LLM extraction for Python-only agents
                    if (agent.path) {
                        try {
                            contract = await engine.extractContract(agent.path, framework);
                            // Enhance contract with better description if missing
                            if (contract && !contract.description) {
                                const goal = contract.metadata?.goal || contract.goal;
                                const role = contract.metadata?.role || contract.role;
                                if (goal) {
                                    contract.description = goal;
                                }
                                else if (role) {
                                    contract.description = `${role} agent`;
                                }
                            }
                            // Ensure contract has proper structure
                            if (contract) {
                                contract = {
                                    description: contract.description || contract.goal || contract.metadata?.goal || `${agent.name} agent`,
                                    capabilities: contract.capabilities || [],
                                    role: contract.role || contract.metadata?.role,
                                    goal: contract.goal || contract.metadata?.goal,
                                    tools: contract.tools || contract.metadata?.tools || [],
                                    inputSchema: contract.inputSchema,
                                    outputSchema: contract.outputSchema,
                                    confidence: contract.confidence || 0.8,
                                    extractedFrom: contract.extractedFrom || ['agent file'],
                                    metadata: contract.metadata || {}
                                };
                            }
                        }
                        catch (err) {
                            console.warn(`Could not extract contract for ${agent.name}:`, err);
                        }
                    }
                }
                // Update agent in eval spec - use agent.id for consistent storage
                await specManager.updateAgent(evalSpec, {
                    id: agent.id || agent.name, // Use id (YAML key or Python variable name)
                    path: agent.path || '',
                    source: agent.metadata?.source || agent.source || '',
                    type: agent.type,
                    description: contract?.description || agent.description || `${agent.name} agent`
                }, contract, {} // No test specs in analysis step
                );
                analyzed++;
            }
            catch (err) {
                errors.push({ entity: agent.name, error: err.message });
                skipped++;
            }
        }
        return { analyzed, skipped, errors };
    }
    /**
     * Detect integrations for a single agent using crew-integration-detector
     */
    async detectAgentIntegrations(agent, yamlConfig) {
        // Create minimal AST structure for agent (matching CrewAST interface)
        const agentAST = {
            imports: [],
            toolUsage: (yamlConfig.tools || []).map((tool) => {
                const toolName = typeof tool === 'string' ? tool : (tool.name || tool.tool || 'unknown');
                return {
                    toolName,
                    toolType: 'builtin',
                    location: { line: 0, column: 0 }
                };
            }),
            externalCalls: [],
            agentDefinitions: [],
            taskDefinitions: [],
            crewDefinitions: [],
            controlFlow: {
                conditionals: [],
                loops: [],
                routerCalls: []
            },
            errorHandling: {
                tryBlocks: [],
                errorCallbacks: []
            }
        };
        // Create YAML structure with just this agent (matching YamlAnalysisResult interface)
        const agentYaml = {
            agents: { [agent.name || agent.id]: yamlConfig },
            tasks: {},
            crews: {},
            dependencies: [],
            humanInteractionPoints: [],
            externalIntegrations: []
        };
        // Use existing detector from crew-integration-detector
        return (0, eval_crewai_1.detectCrewIntegrations)(agentAST, agentYaml);
    }
    /**
     * Infer agent capabilities from integration metadata
     */
    inferCapabilitiesFromIntegrations(yamlConfig, integrations) {
        const capabilities = [];
        // Infer from tools
        integrations.tools.forEach((tool) => {
            switch (tool.type) {
                case 'search':
                    capabilities.push('web_search', 'information_retrieval');
                    break;
                case 'file':
                    capabilities.push('file_operations', 'data_processing');
                    break;
                case 'api':
                    capabilities.push('api_integration', 'external_services');
                    break;
                case 'database':
                    capabilities.push('data_storage', 'database_operations');
                    break;
            }
        });
        // Infer from APIs
        if (integrations.apis.length > 0) {
            capabilities.push('external_api_calls');
        }
        // Infer from databases
        if (integrations.databases.length > 0) {
            capabilities.push('data_persistence');
        }
        // Infer from file operations
        if (integrations.fileOperations.reads.length > 0) {
            capabilities.push('file_reading');
        }
        if (integrations.fileOperations.writes.length > 0) {
            capabilities.push('file_writing', 'content_generation');
        }
        // Infer from role keywords
        const role = yamlConfig.role?.toLowerCase() || '';
        if (role.includes('research')) {
            capabilities.push('research', 'analysis');
        }
        if (role.includes('writer')) {
            capabilities.push('content_creation', 'writing');
        }
        if (role.includes('analyst')) {
            capabilities.push('data_analysis', 'dimension_recognition');
        }
        if (role.includes('manager') || role.includes('coordinator')) {
            capabilities.push('task_coordination', 'team_management');
        }
        // Remove duplicates
        return [...new Set(capabilities)];
    }
    /**
     * Extract required environment variables from integrations
     */
    extractRequiredEnvVars(integrations) {
        const envVars = new Set();
        // From tools
        integrations.tools.forEach((tool) => {
            tool.requiredEnvVars?.forEach((v) => envVars.add(v));
        });
        // From APIs
        integrations.apis.forEach((api) => {
            if (api.envVar)
                envVars.add(api.envVar);
        });
        // From databases
        integrations.databases.forEach((db) => {
            db.requiredEnvVars?.forEach((v) => envVars.add(v));
        });
        // From LLM providers (always need API key)
        integrations.llmProviders.forEach((llm) => {
            if (llm.provider === 'openai')
                envVars.add('OPENAI_API_KEY');
            if (llm.provider === 'anthropic')
                envVars.add('ANTHROPIC_API_KEY');
            if (llm.provider === 'google')
                envVars.add('GOOGLE_API_KEY');
        });
        return Array.from(envVars);
    }
    /**
     * Analyze teams/crews - CRITICAL FIX: Use updateTeam, not updateAgent
     */
    async analyzeTeams(teams, evalSpec, specManager, framework) {
        let analyzed = 0;
        let skipped = 0;
        const errors = [];
        for (const team of teams) {
            try {
                // Store full team structure data in eval spec
                const fullTeamStructure = {
                    name: team.name,
                    process: team.composition?.process || 'sequential',
                    agents: team.structure?.agents || [],
                    tasks: team.structure?.tasks || [],
                    workflow: team.structure?.workflow || { summary: 'Unknown workflow' },
                    discoveredAt: new Date().toISOString(),
                    extractedFrom: 'enhanced-team-discovery'
                };
                // CRITICAL FIX: Use updateTeam to store in evalSpec.teams, NOT evalSpec.agents
                // Store analysis data in correct TeamSpec.analysis field, not contract.enhancedAnalysis
                const teamInfo = {
                    name: team.name,
                    path: team.path || '',
                    description: team.contract?.description || `Team: ${team.name}`,
                    members: (team.structure?.agents || []).map((a) => typeof a === 'string' ? a : (a.name || a.role || 'unknown')),
                    coordinator: team.composition?.process
                };
                const teamContract = {
                    description: team.contract?.description || `Team: ${team.name}`,
                    capabilities: team.contract?.capabilities || [],
                    goal: `Team coordination and collaboration for ${team.name}`,
                    role: `Multi-agent team with ${team.composition?.memberCount || 0} members`,
                    memberCount: team.composition?.memberCount,
                    process: team.composition?.process,
                    teamType: team.type,
                    teamStructure: fullTeamStructure,
                    extractedAgents: team.structure?.agents || [],
                    extractedTasks: team.structure?.tasks || [],
                    extractedWorkflow: team.structure?.workflow || {}
                };
                await specManager.updateTeam(evalSpec, teamInfo, teamContract, {} // No test specs in analysis step
                );
                // CRITICAL: Store enhanced analysis at TeamSpec.analysis level (not in contract)
                if (team.metadata?.analysis) {
                    const teamSpec = evalSpec.teams[team.name];
                    if (teamSpec) {
                        teamSpec.analysis = team.metadata.analysis;
                    }
                }
                analyzed++;
            }
            catch (err) {
                errors.push({ entity: team.name, error: err.message });
                skipped++;
            }
        }
        return { analyzed, skipped, errors };
    }
    /**
     * Analyze flows and populate evalSpec.flows with complete Phase 1 & 2 analysis
     */
    async analyzeFlows(flows, evalSpec, specManager, framework) {
        let analyzed = 0;
        let skipped = 0;
        const errors = [];
        // Initialize flows section if it doesn't exist
        if (!evalSpec.flows) {
            evalSpec.flows = {};
        }
        for (const flow of flows) {
            try {
                // Convert discovered flow to FlowSpec format with complete analysis
                const flowSpec = {
                    name: flow.name,
                    type: 'workflow',
                    description: flow.contract?.description || `CrewAI Flow: ${flow.name}`,
                    // Discovery metadata
                    discovered: {
                        firstSeen: new Date().toISOString(),
                        lastModified: new Date().toISOString(),
                        path: flow.path,
                        version: 1
                    },
                    // Complete Phase 1 & 2 analysis data
                    analysis: {
                        // Phase 1: Workflow metadata
                        workflowMetadata: flow.workflowMetadata || {
                            stepCount: 0,
                            routerLabels: [],
                            combinators: [],
                            crewCount: 0,
                            crewChaining: false,
                            parallelCrews: false,
                            humanInteractionPoints: [],
                            externalServices: [],
                            producesArtifacts: false,
                            estimatedDuration: 300,
                            hasInfiniteLoop: false
                        },
                        // Phase 2: AST analysis
                        behavioralDimensions: flow.flowSignals?.behavioralDimensions || {},
                        externalInteractions: flow.flowSignals?.externalInteractions || {},
                        routingLogic: flow.flowSignals?.routingLogic || {},
                        frameworkSpecific: flow.flowSignals?.frameworkSpecific || {},
                        // Enhanced analysis
                        flowChart: flow.flowChart || 'Flow chart not available',
                        yamlConfig: flow.yamlConfig
                    },
                    // Execution configuration
                    executionConfig: {
                        timeout: (flow.workflowMetadata?.estimatedDuration || 300) * 1000, // Convert to milliseconds
                        allowExternalCalls: flow.workflowMetadata?.externalServices?.length > 0,
                        captureArtifacts: flow.workflowMetadata?.producesArtifacts || false,
                        dryRunIntegrations: false,
                        maxRetries: 2
                    }
                };
                // Store flow in evalSpec.flows
                evalSpec.flows[flow.name] = flowSpec;
                analyzed++;
            }
            catch (err) {
                errors.push({ entity: flow.name, error: err.message });
                skipped++;
            }
        }
        return { analyzed, skipped, errors };
    }
    /**
     * Extract contract from a single entity (agent or team)
     */
    async extractContract(entityPath, framework) {
        const engine = (0, evaluation_engine_1.getEvaluationEngine)();
        const config = await (0, config_1.loadConfig)();
        await engine.initialize(config);
        try {
            return await engine.extractContract(entityPath, framework);
        }
        catch (err) {
            console.warn(`Could not extract contract from ${entityPath}:`, err);
            return undefined;
        }
    }
    /**
     * Check if eval spec exists and has agents
     */
    async hasExistingAnalysis(projectPath) {
        const evalSpecPath = path.join(projectPath, '.identro', 'eval-spec.json');
        if (!await fs.pathExists(evalSpecPath)) {
            return {
                exists: false,
                agentCount: 0,
                teamCount: 0,
                agents: [],
                teams: []
            };
        }
        try {
            const evalSpec = await fs.readJson(evalSpecPath);
            const allAgents = Object.keys(evalSpec.agents || {});
            // Separate agents and teams
            const agents = allAgents.filter(name => {
                const agent = evalSpec.agents[name];
                return !agent.contract?.metadata?.isTeam;
            });
            const teams = allAgents.filter(name => {
                const agent = evalSpec.agents[name];
                return agent.contract?.metadata?.isTeam;
            });
            return {
                exists: true,
                agentCount: agents.length,
                teamCount: teams.length,
                agents,
                teams
            };
        }
        catch (err) {
            return {
                exists: false,
                agentCount: 0,
                teamCount: 0,
                agents: [],
                teams: []
            };
        }
    }
    /**
     * Get analysis summary for display
     */
    getAnalysisSummary(result) {
        const totalAnalyzed = result.analyzedAgents + result.analyzedTeams;
        const totalSkipped = result.skippedAgents + result.skippedTeams;
        const totalErrors = result.errors.length;
        const totalAttempted = totalAnalyzed + totalSkipped;
        return {
            totalAnalyzed,
            totalSkipped,
            totalErrors,
            hasErrors: totalErrors > 0,
            successRate: totalAttempted > 0 ? totalAnalyzed / totalAttempted : 0
        };
    }
}
exports.AnalysisService = AnalysisService;
//# sourceMappingURL=analysis-service.js.map