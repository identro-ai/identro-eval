"use strict";
/**
 * YAML configuration analyzer for CrewAI flows
 *
 * Analyzes agents.yaml and tasks.yaml files to extract structured
 * configuration data for flow testing.
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
exports.analyzeYamlConfigs = analyzeYamlConfigs;
exports.generateWorkflowGraph = generateWorkflowGraph;
exports.validateYamlConsistency = validateYamlConsistency;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * Analyze YAML configuration files in a project
 */
async function analyzeYamlConfigs(projectPath) {
    const result = {
        agents: {},
        tasks: {},
        crews: {},
        dependencies: {
            agentTaskMappings: {},
            taskDependencies: {},
            crewCompositions: {}
        },
        humanInteractionPoints: [],
        externalIntegrations: {
            tools: [],
            llmProviders: [],
            callbacks: []
        }
    };
    try {
        // First try simple root-level YAML files
        const agentsConfig = await loadYamlFile(path.join(projectPath, 'agents.yaml'));
        const tasksConfig = await loadYamlFile(path.join(projectPath, 'tasks.yaml'));
        const crewsConfig = await loadYamlFile(path.join(projectPath, 'crews.yaml'));
        // Parse root-level configurations
        if (agentsConfig) {
            result.agents = parseAgentsConfig(agentsConfig);
        }
        if (tasksConfig) {
            result.tasks = parseTasksConfig(tasksConfig);
        }
        if (crewsConfig) {
            result.crews = parseCrewsConfig(crewsConfig);
        }
        // Also scan for nested crew configurations (flow projects)
        await scanNestedCrewConfigs(projectPath, result);
        // Analyze dependencies and relationships
        result.dependencies = analyzeDependencies(result.agents, result.tasks, result.crews);
        // Extract human interaction points
        result.humanInteractionPoints = extractHumanInteractionPoints(result.tasks);
        // Extract external integrations
        result.externalIntegrations = extractExternalIntegrations(result.agents, result.tasks, result.crews);
        return result;
    }
    catch (error) {
        console.error('Error analyzing YAML configs:', error);
        return result;
    }
}
/**
 * Scan for nested crew configurations in flow projects
 */
async function scanNestedCrewConfigs(projectPath, result) {
    try {
        // Look for dimensions like: src/project_name/crews/crew_name/config/
        const srcPath = path.join(projectPath, 'src');
        if (await pathExists(srcPath)) {
            const srcEntries = await fs.readdir(srcPath, { withFileTypes: true });
            for (const srcEntry of srcEntries) {
                if (srcEntry.isDirectory()) {
                    const projectDir = path.join(srcPath, srcEntry.name);
                    const crewsDir = path.join(projectDir, 'crews');
                    if (await pathExists(crewsDir)) {
                        const crewEntries = await fs.readdir(crewsDir, { withFileTypes: true });
                        for (const crewEntry of crewEntries) {
                            if (crewEntry.isDirectory()) {
                                const crewConfigDir = path.join(crewsDir, crewEntry.name, 'config');
                                if (await pathExists(crewConfigDir)) {
                                    // Load agents.yaml and tasks.yaml from this crew
                                    const crewAgentsConfig = await loadYamlFile(path.join(crewConfigDir, 'agents.yaml'));
                                    const crewTasksConfig = await loadYamlFile(path.join(crewConfigDir, 'tasks.yaml'));
                                    if (crewAgentsConfig) {
                                        const parsedAgents = parseAgentsConfig(crewAgentsConfig);
                                        Object.assign(result.agents, parsedAgents);
                                    }
                                    if (crewTasksConfig) {
                                        const parsedTasks = parseTasksConfig(crewTasksConfig);
                                        Object.assign(result.tasks, parsedTasks);
                                    }
                                    // Create crew entry based on discovered agents and tasks
                                    if (crewAgentsConfig || crewTasksConfig) {
                                        result.crews[crewEntry.name] = {
                                            agents: crewAgentsConfig ? Object.keys(crewAgentsConfig) : [],
                                            tasks: crewTasksConfig ? Object.keys(crewTasksConfig) : [],
                                            process: 'sequential' // Default for flow crews
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    catch (error) {
        // Ignore errors in nested scanning
        console.debug('Error scanning nested crew configs:', error);
    }
}
/**
 * Check if a path exists
 */
async function pathExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Load and parse a YAML file
 */
async function loadYamlFile(filePath) {
    try {
        if (!(await fs.stat(filePath)).isFile()) {
            return null;
        }
        const content = await fs.readFile(filePath, 'utf-8');
        // Use dynamic import for yaml since it might not be available
        const yaml = await Promise.resolve().then(() => __importStar(require('yaml')));
        return yaml.parse(content);
    }
    catch (error) {
        // File doesn't exist or can't be parsed
        return null;
    }
}
/**
 * Parse agents configuration
 */
function parseAgentsConfig(config) {
    const agents = {};
    if (config && typeof config === 'object') {
        for (const [agentName, agentConfig] of Object.entries(config)) {
            if (typeof agentConfig === 'object' && agentConfig !== null) {
                const agent = agentConfig;
                agents[agentName] = {
                    role: agent.role || '',
                    goal: agent.goal || '',
                    backstory: agent.backstory || '',
                    tools: Array.isArray(agent.tools) ? agent.tools : [],
                    llm: agent.llm,
                    max_iter: agent.max_iter,
                    max_execution_time: agent.max_execution_time,
                    verbose: agent.verbose,
                    allow_delegation: agent.allow_delegation,
                    step_callback: agent.step_callback,
                    system_template: agent.system_template,
                    prompt_template: agent.prompt_template,
                    response_template: agent.response_template
                };
            }
        }
    }
    return agents;
}
/**
 * Parse tasks configuration
 */
function parseTasksConfig(config) {
    const tasks = {};
    if (config && typeof config === 'object') {
        for (const [taskName, taskConfig] of Object.entries(config)) {
            if (typeof taskConfig === 'object' && taskConfig !== null) {
                const task = taskConfig;
                tasks[taskName] = {
                    description: task.description || '',
                    expected_output: task.expected_output || '',
                    agent: task.agent,
                    tools: Array.isArray(task.tools) ? task.tools : [],
                    async_execution: task.async_execution,
                    context: Array.isArray(task.context) ? task.context : [],
                    output_json: task.output_json,
                    output_pydantic: task.output_pydantic,
                    output_file: task.output_file,
                    callback: task.callback,
                    human_input: task.human_input
                };
            }
        }
    }
    return tasks;
}
/**
 * Parse crews configuration
 */
function parseCrewsConfig(config) {
    const crews = {};
    if (config && typeof config === 'object') {
        for (const [crewName, crewConfig] of Object.entries(config)) {
            if (typeof crewConfig === 'object' && crewConfig !== null) {
                const crew = crewConfig;
                crews[crewName] = {
                    agents: Array.isArray(crew.agents) ? crew.agents : [],
                    tasks: Array.isArray(crew.tasks) ? crew.tasks : [],
                    process: crew.process || 'sequential',
                    verbose: crew.verbose,
                    memory: crew.memory,
                    cache: crew.cache,
                    max_rpm: crew.max_rpm,
                    language: crew.language,
                    full_output: crew.full_output,
                    step_callback: crew.step_callback,
                    task_callback: crew.task_callback,
                    share_crew: crew.share_crew,
                    manager_llm: crew.manager_llm,
                    manager_agent: crew.manager_agent,
                    function_calling_llm: crew.function_calling_llm,
                    config: crew.config,
                    planning: crew.planning
                };
            }
        }
    }
    return crews;
}
/**
 * Analyze dependencies between agents, tasks, and crews
 */
function analyzeDependencies(agents, tasks, crews) {
    const dependencies = {
        agentTaskMappings: {},
        taskDependencies: {},
        crewCompositions: {}
    };
    // Map agents to their tasks
    for (const [taskName, task] of Object.entries(tasks)) {
        if (task.agent) {
            if (!dependencies.agentTaskMappings[task.agent]) {
                dependencies.agentTaskMappings[task.agent] = [];
            }
            dependencies.agentTaskMappings[task.agent].push(taskName);
        }
    }
    // Map task dependencies (context relationships)
    for (const [taskName, task] of Object.entries(tasks)) {
        if (task.context && task.context.length > 0) {
            dependencies.taskDependencies[taskName] = task.context;
        }
    }
    // Map crew compositions
    for (const [crewName, crew] of Object.entries(crews)) {
        dependencies.crewCompositions[crewName] = {
            agents: crew.agents,
            tasks: crew.tasks
        };
    }
    return dependencies;
}
/**
 * Extract human interaction points from tasks
 */
function extractHumanInteractionPoints(tasks) {
    const humanInteractionPoints = [];
    for (const [taskName, task] of Object.entries(tasks)) {
        if (task.human_input) {
            humanInteractionPoints.push({
                taskName,
                type: 'input',
                description: `Human input required for task: ${task.description}`
            });
        }
        // Check for approval dimensions in task descriptions
        const description = task.description.toLowerCase();
        if (description.includes('approval') || description.includes('approve') || description.includes('review')) {
            humanInteractionPoints.push({
                taskName,
                type: description.includes('review') ? 'review' : 'approval',
                description: `Human ${description.includes('review') ? 'review' : 'approval'} required: ${task.description}`
            });
        }
    }
    return humanInteractionPoints;
}
/**
 * Extract external integrations from configurations
 */
function extractExternalIntegrations(agents, tasks, crews) {
    const integrations = {
        tools: [],
        llmProviders: [],
        callbacks: []
    };
    // Extract tools from agents and tasks
    const allTools = new Set();
    for (const agent of Object.values(agents)) {
        if (agent.tools) {
            agent.tools.forEach(tool => allTools.add(tool));
        }
    }
    for (const task of Object.values(tasks)) {
        if (task.tools) {
            task.tools.forEach(tool => allTools.add(tool));
        }
    }
    integrations.tools = Array.from(allTools);
    // Extract LLM providers
    const llmProviders = new Set();
    for (const agent of Object.values(agents)) {
        if (agent.llm) {
            llmProviders.add(agent.llm);
        }
    }
    for (const crew of Object.values(crews)) {
        if (crew.manager_llm) {
            llmProviders.add(crew.manager_llm);
        }
        if (crew.function_calling_llm) {
            llmProviders.add(crew.function_calling_llm);
        }
    }
    integrations.llmProviders = Array.from(llmProviders);
    // Extract callbacks
    const callbacks = new Set();
    for (const agent of Object.values(agents)) {
        if (agent.step_callback) {
            callbacks.add(agent.step_callback);
        }
    }
    for (const task of Object.values(tasks)) {
        if (task.callback) {
            callbacks.add(task.callback);
        }
    }
    for (const crew of Object.values(crews)) {
        if (crew.step_callback) {
            callbacks.add(crew.step_callback);
        }
        if (crew.task_callback) {
            callbacks.add(crew.task_callback);
        }
    }
    integrations.callbacks = Array.from(callbacks);
    return integrations;
}
/**
 * Generate workflow graph from YAML configurations
 */
function generateWorkflowGraph(agents, tasks, crews) {
    const lines = [];
    lines.push('# Workflow Graph from YAML Configuration');
    lines.push('');
    // For each crew, show its workflow
    for (const [crewName, crew] of Object.entries(crews)) {
        lines.push(`## ${crewName} (${crew.process || 'sequential'})`);
        lines.push('');
        // Show agents
        lines.push('### Agents:');
        for (const agentName of crew.agents) {
            const agent = agents[agentName];
            if (agent) {
                lines.push(`- **${agentName}**: ${agent.role}`);
                lines.push(`  - Goal: ${agent.goal}`);
                if (agent.tools && agent.tools.length > 0) {
                    lines.push(`  - Tools: ${agent.tools.join(', ')}`);
                }
            }
        }
        lines.push('');
        // Show task flow
        lines.push('### Task Flow:');
        if (crew.process === 'sequential') {
            lines.push('```');
            for (let i = 0; i < crew.tasks.length; i++) {
                const taskName = crew.tasks[i];
                const task = tasks[taskName];
                if (task) {
                    lines.push(`${i + 1}. [${taskName}] (${task.agent || 'unassigned'})`);
                    lines.push(`   ${task.description}`);
                    if (task.context && task.context.length > 0) {
                        lines.push(`   Depends on: ${task.context.join(', ')}`);
                    }
                    if (task.human_input) {
                        lines.push(`   👤 Human input required`);
                    }
                    if (i < crew.tasks.length - 1) {
                        lines.push('   ↓');
                    }
                }
            }
            lines.push('```');
        }
        else if (crew.process === 'hierarchical') {
            lines.push('```');
            lines.push(`Manager: ${crew.manager_agent || 'Auto-assigned'}`);
            lines.push('├─ Coordinates task execution');
            lines.push('└─ Delegates to agents:');
            for (const taskName of crew.tasks) {
                const task = tasks[taskName];
                if (task) {
                    lines.push(`   ├─ [${taskName}] → ${task.agent || 'unassigned'}`);
                    if (task.human_input) {
                        lines.push(`   │  👤 Human input required`);
                    }
                }
            }
            lines.push('```');
        }
        lines.push('');
    }
    return lines.join('\n');
}
/**
 * Validate YAML configuration consistency
 */
function validateYamlConsistency(result) {
    const errors = [];
    const warnings = [];
    // Check that all referenced agents exist
    for (const [taskName, task] of Object.entries(result.tasks)) {
        if (task.agent && !result.agents[task.agent]) {
            errors.push(`Task '${taskName}' references unknown agent '${task.agent}'`);
        }
    }
    // Check that all crew agents exist
    for (const [crewName, crew] of Object.entries(result.crews)) {
        for (const agentName of crew.agents) {
            if (!result.agents[agentName]) {
                errors.push(`Crew '${crewName}' references unknown agent '${agentName}'`);
            }
        }
    }
    // Check that all crew tasks exist
    for (const [crewName, crew] of Object.entries(result.crews)) {
        for (const taskName of crew.tasks) {
            if (!result.tasks[taskName]) {
                errors.push(`Crew '${crewName}' references unknown task '${taskName}'`);
            }
        }
    }
    // Check task context dependencies
    for (const [taskName, task] of Object.entries(result.tasks)) {
        if (task.context) {
            for (const contextTask of task.context) {
                if (!result.tasks[contextTask]) {
                    errors.push(`Task '${taskName}' depends on unknown task '${contextTask}'`);
                }
            }
        }
    }
    // Warnings for potential issues
    for (const [agentName, agent] of Object.entries(result.agents)) {
        if (!agent.role) {
            warnings.push(`Agent '${agentName}' has no role defined`);
        }
        if (!agent.goal) {
            warnings.push(`Agent '${agentName}' has no goal defined`);
        }
    }
    for (const [taskName, task] of Object.entries(result.tasks)) {
        if (!task.description) {
            warnings.push(`Task '${taskName}' has no description`);
        }
        if (!task.expected_output) {
            warnings.push(`Task '${taskName}' has no expected output defined`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
//# sourceMappingURL=yaml-analyzer.js.map