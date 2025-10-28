"use strict";
/**
 * CrewAI team/crew discovery module
 *
 * Discovers ONLY traditional CrewAI crews and teams.
 * Flows are handled by enhanced-workflow-discovery.ts
 *
 * Enhanced with AST parsing, behavioral analysis, and rich context.
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
exports.discoverTeams = discoverTeams;
exports.discoverTeamsWithDetails = discoverTeamsWithDetails;
exports.analyzeTeamFile = analyzeTeamFile;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const glob = require('glob');
const patterns_1 = require("./utils/patterns");
const agent_discovery_1 = require("./agent-discovery");
const task_extractor_1 = require("./task-extractor");
const crew_ast_parser_1 = require("./crew-ast-parser");
const crew_behavior_analyzer_1 = require("./crew-behavior-analyzer");
const crew_integration_detector_1 = require("./crew-integration-detector");
const crew_flow_chart_builder_1 = require("./crew-flow-chart-builder");
const yaml_analyzer_1 = require("./yaml-analyzer");
/**
 * Discover traditional CrewAI crews/teams ONLY (no flows)
 */
async function discoverTeams(projectPath) {
    const crews = [];
    try {
        // Find all Python files
        const pythonFiles = glob.sync('**/*.py', {
            cwd: projectPath,
            ignore: ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/test/**', '**/*_test.py'],
        });
        for (const file of pythonFiles) {
            if ((0, patterns_1.shouldExcludePath)(file))
                continue;
            const filePath = path.join(projectPath, file);
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                // Quick check if file contains traditional crew definitions (NOT flows)
                if (!hasTraditionalCrewDefinitions(content)) {
                    continue;
                }
                // Extract traditional crews from the file (NOT flows)
                const fileCrews = await extractTraditionalCrewsFromFile(filePath, content);
                crews.push(...fileCrews);
            }
            catch (error) {
                console.error(`Error processing file ${file}:`, error);
            }
        }
        return crews;
    }
    catch (error) {
        console.error('Error discovering CrewAI crews:', error);
        return [];
    }
}
/**
 * Discover teams with detailed information
 */
async function discoverTeamsWithDetails(projectPath) {
    const teams = await discoverTeams(projectPath);
    // Calculate statistics
    const filesWithTeams = new Set(teams.map(t => t.path));
    const teamTypes = {};
    for (const team of teams) {
        const type = team.type || 'unknown';
        teamTypes[type] = (teamTypes[type] || 0) + 1;
    }
    // Count total Python files
    const pythonFiles = glob.sync('**/*.py', {
        cwd: projectPath,
        ignore: ['**/node_modules/**', '**/.venv/**', '**/venv/**'],
    });
    return {
        teams,
        stats: {
            totalFiles: pythonFiles.length,
            filesWithTeams: filesWithTeams.size,
            totalTeams: teams.length,
            teamTypes,
        },
    };
}
/**
 * Check if file content contains traditional crew definitions ONLY (no flows)
 */
function hasTraditionalCrewDefinitions(content) {
    return (
    // Traditional crew dimensions ONLY
    content.includes('Crew(') ||
        content.includes('from crewai import Crew') ||
        content.includes('import crewai'));
}
/**
 * Extract traditional crews from a Python file (crews ONLY, no flows)
 * Enhanced with AST parsing and rich analysis
 */
async function extractTraditionalCrewsFromFile(filePath, content) {
    const crews = [];
    try {
        const projectPath = path.dirname(filePath);
        // Step 1: Parse file with AST for comprehensive analysis
        const crewAST = await (0, crew_ast_parser_1.parseCrewFile)(filePath);
        if (!crewAST || crewAST.crewDefinitions.length === 0) {
            // No crews found in this file
            return [];
        }
        // Step 2: Analyze YAML configurations
        const yamlConfig = await (0, yaml_analyzer_1.analyzeYamlConfigs)(projectPath);
        // Step 3: Analyze behavioral patterns
        const behavioralPatterns = (0, crew_behavior_analyzer_1.analyzeCrewBehavior)(crewAST, yamlConfig);
        // Step 4: Detect external integrations
        const externalIntegrations = (0, crew_integration_detector_1.detectCrewIntegrations)(crewAST, yamlConfig);
        // Step 5: Create enhanced crew entities (generate flow chart per crew)
        for (const crewDef of crewAST.crewDefinitions) {
            // Generate crew-specific flow chart
            const crewSpecificAST = {
                ...crewAST,
                crewDefinitions: [crewDef] // Only include this specific crew
            };
            const flowChartData = {
                crewAST: crewSpecificAST,
                yamlConfig,
                behavioralPatterns,
                externalIntegrations
            };
            const flowChart = (0, crew_flow_chart_builder_1.buildCrewFlowChart)(flowChartData);
            const textFlowChart = (0, crew_flow_chart_builder_1.buildTextFlowChart)(flowChartData);
            // Load agent and task definitions
            const agentDefinitions = await loadAgentDefinitions(projectPath, crewDef.configuration.agents);
            const taskDefinitions = await (0, task_extractor_1.loadTaskDefinitions)(projectPath, crewDef.configuration.tasks);
            const workflow = (0, task_extractor_1.buildWorkflowGraph)(taskDefinitions);
            // Build enhanced capabilities based on analysis
            const capabilities = buildEnhancedCapabilities(crewDef, behavioralPatterns, externalIntegrations);
            // Estimate timeout based on complexity
            const timeout = estimateTimeout(behavioralPatterns, crewDef);
            // Build enhanced description
            const description = crewDef.docstring ||
                `CrewAI crew: ${crewDef.name} (${crewDef.configuration.process} process)`;
            crews.push({
                id: `${filePath}:${crewDef.name}`,
                name: crewDef.name,
                type: 'crew',
                framework: 'crewai',
                path: filePath,
                contract: {
                    description,
                    capabilities,
                },
                execution: {
                    entryPoint: `${crewDef.name}.kickoff`,
                    timeout,
                    parameters: {
                        crewVariable: crewDef.name,
                    },
                },
                composition: {
                    memberCount: crewDef.configuration.agents.length,
                    members: crewDef.configuration.agents,
                    coordinator: crewDef.configuration.manager_llm || crewDef.configuration.manager_agent,
                    process: crewDef.configuration.process,
                },
                structure: {
                    agents: agentDefinitions,
                    tasks: taskDefinitions,
                    process: crewDef.configuration.process,
                    workflow
                },
                metadata: {
                    language: 'python',
                    lineNumber: crewDef.lineno,
                    discovered: new Date().toISOString(),
                    isTeam: true,
                    // Enhanced metadata
                    analysis: {
                        // Crew configuration metadata
                        crewMetadata: {
                            process: crewDef.configuration.process,
                            agentCount: crewDef.configuration.agents.length,
                            taskCount: crewDef.configuration.tasks.length,
                            hasMemory: crewDef.configuration.memory || false,
                            hasCache: crewDef.configuration.cache || false,
                            verboseMode: crewDef.configuration.verbose || false,
                            estimatedDuration: timeout / 1000, // Convert to seconds
                        },
                        behavioralPatterns,
                        externalIntegrations,
                        flowChart,
                        textFlowChart,
                        yamlConfig,
                        humanInteractionPoints: behavioralPatterns.humanInteractionPoints || [],
                    },
                },
            });
        }
    }
    catch (error) {
        console.error(`Error extracting crews from ${filePath}:`, error);
        return [];
    }
    return crews;
}
/**
 * Build enhanced capabilities based on comprehensive analysis
 */
function buildEnhancedCapabilities(crewDef, dimensions, integrations) {
    const capabilities = [];
    // Process-based capabilities
    capabilities.push(`${crewDef.configuration.process}_execution`);
    // Configuration-based capabilities
    if (crewDef.configuration.memory) {
        capabilities.push('shared_memory');
    }
    if (crewDef.configuration.cache) {
        capabilities.push('caching');
    }
    if (crewDef.configuration.verbose) {
        capabilities.push('detailed_logging');
    }
    if (crewDef.configuration.manager_llm || crewDef.configuration.manager_agent) {
        capabilities.push('hierarchical_management');
    }
    // Dimension-based capabilities
    if (dimensions.hasToolUsage) {
        capabilities.push('tool_integration');
    }
    if (dimensions.hasFileIO) {
        capabilities.push('file_operations');
    }
    if (dimensions.hasExternalAPIs) {
        capabilities.push('external_api_integration');
    }
    if (dimensions.hasHumanInLoop) {
        capabilities.push('human_in_the_loop');
    }
    if (dimensions.hasConditionalLogic) {
        capabilities.push('conditional_logic');
    }
    if (dimensions.hasErrorHandling) {
        capabilities.push('error_handling');
    }
    // Integration-based capabilities
    if (integrations.databases.length > 0) {
        capabilities.push('database_integration');
    }
    if (integrations.llmProviders.length > 1) {
        capabilities.push('multi_llm_provider');
    }
    // General crew capabilities
    capabilities.push('multi_agent_coordination');
    capabilities.push('task_orchestration');
    return capabilities;
}
/**
 * Estimate timeout based on complexity and dimensions
 */
function estimateTimeout(dimensions, crewDef) {
    let timeout = 300000; // 5 minutes base
    // Add time for agents and tasks
    const agentCount = crewDef.configuration.agents.length;
    const taskCount = crewDef.configuration.tasks.length;
    timeout += (agentCount + taskCount) * 30000; // 30s per agent/task
    // Add time based on complexity
    switch (dimensions.complexityLevel) {
        case 'simple':
            timeout += 60000; // +1 minute
            break;
        case 'moderate':
            timeout += 120000; // +2 minutes
            break;
        case 'complex':
            timeout += 240000; // +4 minutes
            break;
        case 'advanced':
            timeout += 480000; // +8 minutes
            break;
    }
    // Add time for external integrations
    if (dimensions.hasExternalAPIs) {
        timeout += 60000; // +1 minute for API calls
    }
    if (dimensions.hasFileIO) {
        timeout += 30000; // +30s for file operations
    }
    if (dimensions.hasHumanInLoop) {
        timeout += 180000; // +3 minutes for human interaction
    }
    // Cap at 15 minutes for typical crews
    return Math.min(timeout, 900000);
}
/**
 * Extract referenced agents from crew configuration
 */
function extractReferencedAgents(crewConfig) {
    const agentsMatch = crewConfig.match(/agents\s*=\s*\[([^\]]*)\]/);
    return agentsMatch ?
        agentsMatch[1].split(',').map(a => a.trim().replace(/[,\s]/g, '')).filter(a => a.length > 0) : [];
}
/**
 * Extract referenced tasks from crew configuration
 */
function extractReferencedTasks(crewConfig) {
    const tasksMatch = crewConfig.match(/tasks\s*=\s*\[([^\]]*)\]/);
    return tasksMatch ?
        tasksMatch[1].split(',').map(t => t.trim().replace(/[,\s]/g, '')).filter(t => t.length > 0) : [];
}
/**
 * Load agent definitions using existing discovery logic
 */
async function loadAgentDefinitions(projectPath, agentNames) {
    try {
        // Use existing agent discovery to get all agents in project
        const allAgents = await (0, agent_discovery_1.discoverAgents)(projectPath);
        // Filter to only the agents referenced in the crew
        return allAgents.filter(agent => agentNames.some(name => agent.name === name || agent.id.includes(name)));
    }
    catch (error) {
        console.error('Error loading agent definitions:', error);
        return [];
    }
}
/**
 * Extract crew description from comments or docstrings
 */
function extractCrewDescription(content, crewName) {
    // Look for comments above the crew definition
    const crewIndex = content.indexOf(`${crewName} = Crew(`);
    if (crewIndex === -1)
        return undefined;
    const beforeCrew = content.substring(0, crewIndex);
    const lines = beforeCrew.split('\n');
    // Look backwards for comments
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('#')) {
            return line.substring(1).trim();
        }
        if (line.length > 0 && !line.startsWith('#')) {
            break; // Stop at first non-comment, non-empty line
        }
    }
    return undefined;
}
/**
 * Extract crew capabilities based on configuration
 */
function extractCrewCapabilities(crewConfig, process) {
    const capabilities = [];
    // Add process-based capabilities
    capabilities.push(`${process}_execution`);
    // Check for specific features
    if (crewConfig.includes('memory=True')) {
        capabilities.push('shared_memory');
    }
    if (crewConfig.includes('cache=True')) {
        capabilities.push('caching');
    }
    if (crewConfig.includes('verbose=True')) {
        capabilities.push('detailed_logging');
    }
    if (crewConfig.includes('manager_llm')) {
        capabilities.push('hierarchical_management');
    }
    // Add general crew capabilities
    capabilities.push('multi_agent_coordination');
    capabilities.push('task_orchestration');
    return capabilities;
}
/**
 * Extract crew execution functions (like run_crew)
 * NOTE: Functions are not real teams/crews and should not be shown to users
 */
function extractCrewExecutionFunctions(filePath, content) {
    // Don't include function-based "teams" - they're not real teams
    // Functions like run_crew() are utility functions, not actual teams to test
    return [];
}
/**
 * Analyze a specific team file
 */
async function analyzeTeamFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        // Extract teams
        const teams = await extractTraditionalCrewsFromFile(filePath, content);
        // Extract imports
        const imports = [];
        const importDimension = /(?:from\s+([\w.]+)\s+)?import\s+([^;\n]+)/g;
        let match;
        while ((match = importDimension.exec(content)) !== null) {
            if (match[1]) {
                imports.push(`${match[1]}.${match[2]}`);
            }
            else {
                imports.push(match[2]);
            }
        }
        // Check for agents and tasks
        const hasAgents = content.includes('Agent(') || content.includes('from agents import');
        const hasTasks = content.includes('Task(') || content.includes('from tasks import');
        return {
            teams,
            imports,
            hasAgents,
            hasTasks,
        };
    }
    catch (error) {
        console.error(`Error analyzing team file ${filePath}:`, error);
        return {
            teams: [],
            imports: [],
            hasAgents: false,
            hasTasks: false,
        };
    }
}
//# sourceMappingURL=team-discovery.js.map