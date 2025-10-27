/**
 * CrewAI agent discovery module
 *
 * Discovers CrewAI agents in a project and analyzes their structure.
 * Focuses on single agent evaluation (crew evaluation is TODO for future phases).
 */
import * as fs from 'fs/promises';
import * as path from 'path';
const glob = require('glob');
import { shouldExcludePath, hasCrewAIImports, hasAgentDefinitions, extractAgentRole, extractAgentGoal, extractAgentBackstory, classifyAgentType, extractTools, } from './utils/patterns';
/**
 * Discover all CrewAI agents in a project
 */
export async function discoverAgents(projectPath) {
    const agents = [];
    try {
        // Find all Python files
        const pythonFiles = glob.sync('**/*.py', {
            cwd: projectPath,
            ignore: ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/test/**', '**/*_test.py'],
        });
        for (const file of pythonFiles) {
            if (shouldExcludePath(file))
                continue;
            const filePath = path.join(projectPath, file);
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                // Quick check if file might contain CrewAI agents
                if (!hasCrewAIImports(content) && !hasAgentDefinitions(content)) {
                    continue;
                }
                // Extract agents from the file
                const fileAgents = await extractAgentsFromFile(filePath, content);
                agents.push(...fileAgents);
            }
            catch (error) {
                console.error(`Error processing file ${file}:`, error);
            }
        }
        // Also check for YAML configuration files
        const yamlAgents = await discoverAgentsFromYAML(projectPath);
        agents.push(...yamlAgents);
        // Deduplicate agents by name (prefer Python files over YAML)
        const uniqueAgents = new Map();
        // First add Python-defined agents (higher priority)
        for (const agent of agents) {
            if (!agent.metadata?.configFile) {
                uniqueAgents.set(agent.name, agent);
            }
        }
        // Then add YAML agents only if not already defined in Python
        for (const agent of agents) {
            if (agent.metadata?.configFile && !uniqueAgents.has(agent.name)) {
                uniqueAgents.set(agent.name, agent);
            }
        }
        return Array.from(uniqueAgents.values());
    }
    catch (error) {
        console.error('Error discovering CrewAI agents:', error);
        return [];
    }
}
/**
 * Discover agents with detailed information
 */
export async function discoverAgentsWithDetails(projectPath) {
    const agents = await discoverAgents(projectPath);
    // Calculate statistics
    const filesWithAgents = new Set(agents.map(a => a.path));
    const agentTypes = {};
    for (const agent of agents) {
        const type = agent.type || 'unknown';
        agentTypes[type] = (agentTypes[type] || 0) + 1;
    }
    // Count total Python files
    const pythonFiles = glob.sync('**/*.py', {
        cwd: projectPath,
        ignore: ['**/node_modules/**', '**/.venv/**', '**/venv/**'],
    });
    return {
        agents,
        stats: {
            totalFiles: pythonFiles.length,
            filesWithAgents: filesWithAgents.size,
            totalAgents: agents.length,
            agentTypes,
        },
    };
}
/**
 * Extract agents from a Python file
 */
async function extractAgentsFromFile(filePath, content) {
    const agents = [];
    try {
        // Extract agent definitions using regex patterns
        const agentPattern = /(\w+)\s*=\s*Agent\s*\(([\s\S]*?)\)/g;
        let match;
        while ((match = agentPattern.exec(content)) !== null) {
            const agentName = match[1];
            const agentConfig = match[2];
            // Extract agent properties
            const role = extractAgentRole(agentConfig) || 'Unknown Role';
            const goal = extractAgentGoal(agentConfig) || 'Unknown Goal';
            const backstory = extractAgentBackstory(agentConfig) || undefined;
            // Extract tools
            const tools = extractTools(content);
            // Extract LLM configuration
            const llmMatch = agentConfig.match(/llm\s*=\s*([^,\n)]+)/);
            const llm = llmMatch ? llmMatch[1].trim() : undefined;
            // Extract other properties
            const maxIterMatch = agentConfig.match(/max_iter\s*=\s*(\d+)/);
            const maxIter = maxIterMatch ? parseInt(maxIterMatch[1]) : undefined;
            const allowDelegationMatch = agentConfig.match(/allow_delegation\s*=\s*(True|False)/);
            const allowDelegation = allowDelegationMatch ? allowDelegationMatch[1] === 'True' : undefined;
            const verboseMatch = agentConfig.match(/verbose\s*=\s*(True|False|\d+)/);
            const verbose = verboseMatch ?
                (verboseMatch[1] === 'True' || parseInt(verboseMatch[1]) > 0) :
                undefined;
            // Classify agent type based on role and goal
            const agentType = classifyAgentType(role, goal);
            // Find line number
            const lines = content.substring(0, match.index).split('\n');
            const lineNumber = lines.length;
            agents.push({
                id: `${filePath}:${agentName}`,
                name: agentName,
                type: agentType,
                path: filePath,
                framework: 'crewai',
                description: `${role}: ${goal}`,
                metadata: {
                    language: 'python',
                    lineNumber,
                },
                role,
                goal,
                backstory,
                tools,
                llm,
                maxIter,
                allowDelegation,
                verbose,
            });
        }
        // Also try to extract agents from class definitions
        const classAgents = await extractAgentsFromClasses(filePath, content);
        agents.push(...classAgents);
    }
    catch (error) {
        console.error(`Error extracting agents from ${filePath}:`, error);
    }
    return agents;
}
/**
 * Extract agents from class definitions
 */
async function extractAgentsFromClasses(filePath, content) {
    const agents = [];
    try {
        // Look for class methods that return agents
        const methodDimension = /def\s+(\w+)\s*\([^)]*\)\s*(?:->.*?)?:\s*\n([\s\S]*?)(?=\n\s*def|\n\s*class|\Z)/g;
        let match;
        while ((match = methodDimension.exec(content)) !== null) {
            const methodName = match[1];
            const methodBody = match[2];
            // Check if method creates an agent
            if (methodBody.includes('Agent(') || methodBody.includes('return Agent')) {
                // Extract agent configuration from method
                const agentMatch = methodBody.match(/Agent\s*\(([\s\S]*?)\)/);
                if (agentMatch) {
                    const agentConfig = agentMatch[1];
                    const role = extractAgentRole(agentConfig) || methodName;
                    const goal = extractAgentGoal(agentConfig) || 'Unknown Goal';
                    const backstory = extractAgentBackstory(agentConfig) || undefined;
                    const tools = extractTools(methodBody);
                    const agentType = classifyAgentType(role, goal);
                    const lines = content.substring(0, match.index).split('\n');
                    const lineNumber = lines.length;
                    agents.push({
                        id: `${filePath}:${methodName}`,
                        name: methodName,
                        type: agentType,
                        path: filePath,
                        framework: 'crewai',
                        description: `${role}: ${goal}`,
                        metadata: {
                            language: 'python',
                            lineNumber,
                            isMethod: true,
                        },
                        role,
                        goal,
                        backstory,
                        tools,
                    });
                }
            }
        }
    }
    catch (error) {
        console.error(`Error extracting agents from classes in ${filePath}:`, error);
    }
    return agents;
}
/**
 * Discover agents from YAML configuration files
 */
async function discoverAgentsFromYAML(projectPath) {
    const agents = [];
    try {
        // Look for agents.yaml or similar files
        const yamlFiles = glob.sync('**/agents.{yaml,yml}', {
            cwd: projectPath,
            ignore: ['**/node_modules/**', '**/.venv/**', '**/venv/**'],
        });
        for (const file of yamlFiles) {
            const filePath = path.join(projectPath, file);
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                const yaml = await import('js-yaml');
                const data = yaml.load(content);
                if (data && typeof data === 'object') {
                    // Extract agents from YAML structure
                    for (const [agentName, agentConfig] of Object.entries(data)) {
                        if (typeof agentConfig === 'object' && agentConfig !== null) {
                            const config = agentConfig;
                            const role = config.role || agentName;
                            const goal = config.goal || 'Unknown Goal';
                            const backstory = config.backstory;
                            const tools = config.tools || [];
                            const agentType = classifyAgentType(role, goal);
                            agents.push({
                                id: `${filePath}:${agentName}`,
                                name: agentName,
                                type: agentType,
                                path: filePath,
                                framework: 'crewai',
                                description: `${role}: ${goal}`,
                                metadata: {
                                    language: 'yaml',
                                    configFile: true,
                                },
                                role,
                                goal,
                                backstory,
                                tools: Array.isArray(tools) ? tools : [tools],
                                llm: config.llm,
                                maxIter: config.max_iter,
                                allowDelegation: config.allow_delegation,
                                verbose: config.verbose,
                            });
                        }
                    }
                }
            }
            catch (error) {
                console.error(`Error processing YAML file ${file}:`, error);
            }
        }
    }
    catch (error) {
        console.error('Error discovering agents from YAML:', error);
    }
    return agents;
}
/**
 * Analyze a specific agent file
 */
export async function analyzeAgentFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        // Extract agents
        const agents = await extractAgentsFromFile(filePath, content);
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
        // Extract tools
        const tools = extractTools(content);
        // Check for crews and tasks
        const hasCrews = content.includes('Crew(') || content.includes('from crewai import Crew');
        const hasTasks = content.includes('Task(') || content.includes('from crewai import Task');
        return {
            agents,
            imports,
            tools,
            hasCrews,
            hasTasks,
        };
    }
    catch (error) {
        console.error(`Error analyzing agent file ${filePath}:`, error);
        return {
            agents: [],
            imports: [],
            tools: [],
            hasCrews: false,
            hasTasks: false,
        };
    }
}
/**
 * Get agent dependencies (tasks, tools, other agents)
 * TODO: This will be expanded when we implement crew evaluation
 */
export async function getAgentDependencies(agent, projectPath) {
    const dependencies = {
        tasks: [],
        tools: agent.tools || [],
        delegatesTo: [],
    };
    // TODO: Implement task dependency extraction
    // TODO: Implement delegation chain analysis
    return dependencies;
}
//# sourceMappingURL=agent-discovery.js.map