/**
 * Enhanced workflow discovery for CrewAI flows
 *
 * Combines AST parsing and YAML analysis to provide comprehensive
 * workflow discovery with advanced pattern recognition.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseFlowFile } from './ast-parser';
import { analyzeYamlConfigs } from './yaml-analyzer';
import { buildEnhancedFlowChart } from './enhanced-flow-chart-builder';
import { analyzeRouterLogic, buildFlowPathMap } from './router-analyzer';
import { detectHITLPoints } from './hitl-detector';
import { analyzeIntegrations } from './integration-analyzer';
/**
 * Discover enhanced workflows (flows + crews) in a CrewAI project
 */
export async function discoverEnhancedWorkflows(projectPath) {
    const result = {
        flows: [],
        crews: [],
        stats: {
            totalFiles: 0,
            filesWithFlows: 0,
            totalFlows: 0,
            totalCrews: 0,
            flowTypes: {},
            yamlConfigsFound: false
        }
    };
    try {
        // 1. Analyze YAML configurations first
        const yamlConfig = await analyzeYamlConfigs(projectPath);
        result.stats.yamlConfigsFound = Object.keys(yamlConfig.agents).length > 0 ||
            Object.keys(yamlConfig.tasks).length > 0 ||
            Object.keys(yamlConfig.crews).length > 0;
        // 2. Discover Python flow files
        const pythonFiles = await findPythonFiles(projectPath);
        result.stats.totalFiles = pythonFiles.length;
        for (const filePath of pythonFiles) {
            try {
                // Parse flow file with AST
                const flowSignals = await parseFlowFile(filePath);
                if (flowSignals) {
                    result.stats.filesWithFlows++;
                    // Create enhanced team entity for flow
                    const flowEntity = await createFlowEntity(filePath, flowSignals, yamlConfig);
                    result.flows.push(flowEntity);
                    result.stats.totalFlows++;
                    // Track flow types
                    const flowType = flowEntity.type || 'workflow';
                    result.stats.flowTypes[flowType] = (result.stats.flowTypes[flowType] || 0) + 1;
                }
                // Also check for traditional crew definitions in the same file
                const crewEntities = await extractCrewEntitiesFromFile(filePath, yamlConfig);
                result.crews.push(...crewEntities);
                result.stats.totalCrews += crewEntities.length;
            }
            catch (error) {
                console.error(`Error processing file ${filePath}:`, error);
            }
        }
        // 3. Create crew entities from YAML-only configurations
        const yamlOnlyCrews = await createCrewEntitiesFromYaml(projectPath, yamlConfig);
        result.crews.push(...yamlOnlyCrews);
        result.stats.totalCrews += yamlOnlyCrews.length;
        return result;
    }
    catch (error) {
        console.error('Error in enhanced workflow discovery:', error);
        return result;
    }
}
/**
 * Find all Python files in the project
 */
async function findPythonFiles(projectPath) {
    const files = [];
    async function scanDirectory(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    // Skip common directories to ignore
                    if (!['node_modules', '.git', '__pycache__', '.venv', 'venv', '.pytest_cache'].includes(entry.name)) {
                        await scanDirectory(fullPath);
                    }
                }
                else if (entry.isFile() && entry.name.endsWith('.py')) {
                    files.push(fullPath);
                }
            }
        }
        catch (error) {
            // Directory might not be accessible, skip it
        }
    }
    await scanDirectory(projectPath);
    return files;
}
/**
 * Create enhanced team entity from flow signals
 */
async function createFlowEntity(filePath, flowSignals, yamlConfig) {
    const fileName = path.basename(filePath, '.py');
    const relativePath = path.relative(process.cwd(), filePath);
    // Generate enhanced flow chart with full analysis
    const routerAnalysis = analyzeRouterLogic(flowSignals, yamlConfig);
    const pathMap = buildFlowPathMap(flowSignals, routerAnalysis);
    const hitlWorkflow = detectHITLPoints(flowSignals, yamlConfig);
    const integrationAnalysis = analyzeIntegrations(flowSignals, yamlConfig);
    const enhancedFlowChart = buildEnhancedFlowChart(flowSignals, yamlConfig, routerAnalysis, pathMap, hitlWorkflow, integrationAnalysis);
    const flowChart = enhancedFlowChart.chart;
    // Extract workflow metadata
    const workflowMetadata = extractWorkflowMetadata(flowSignals, yamlConfig);
    // Determine capabilities
    const capabilities = extractFlowCapabilities(flowSignals, yamlConfig);
    // Create the enhanced team entity
    const entity = {
        id: `${relativePath}:${flowSignals.className}`,
        name: flowSignals.className,
        type: 'workflow',
        framework: 'crewai',
        path: filePath,
        contract: {
            description: `CrewAI Flow: ${flowSignals.className}`,
            capabilities
        },
        execution: {
            entryPoint: `${flowSignals.className}.kickoff`,
            timeout: workflowMetadata.estimatedDuration * 1000, // Convert to milliseconds
            parameters: {
                flowClass: flowSignals.className
            }
        },
        composition: {
            memberCount: workflowMetadata.crewCount,
            members: flowSignals.externalInteractions.crews,
            process: workflowMetadata.parallelCrews ? 'parallel' : 'sequential'
        },
        metadata: {
            language: 'python',
            discovered: new Date().toISOString(),
            isTeam: true,
            flowType: 'crewai_flow'
        },
        // Enhanced properties
        workflowMetadata,
        flowSignals,
        yamlConfig,
        flowChart
    };
    return entity;
}
/**
 * Extract workflow metadata from flow signals
 */
function extractWorkflowMetadata(flowSignals, yamlConfig) {
    // Calculate step count (methods with decorators)
    const stepCount = flowSignals.methods.filter(m => m.decorators.some(d => ['start', 'listen', 'router'].includes(d))).length;
    // Extract router labels
    const routerLabels = flowSignals.routingLogic.routerLabels;
    // Extract combinators
    const combinators = flowSignals.frameworkSpecific.combinators;
    // Count crews
    const crewCount = flowSignals.externalInteractions.crews.length;
    // Detect crew chaining
    const crewChaining = flowSignals.behavioralPatterns.crewChaining;
    // Detect parallel crews
    const parallelCrews = flowSignals.behavioralPatterns.parallelCrews;
    // Extract human interaction points
    const humanInteractionPoints = [];
    // From flow methods
    flowSignals.methods.forEach(method => {
        if (method.name.includes('human') || method.name.includes('approval')) {
            humanInteractionPoints.push({
                method: method.name,
                type: method.name.includes('approval') ? 'approval' : 'input',
                blocking: true,
                description: `Human interaction required in ${method.name}`
            });
        }
    });
    // From YAML config
    yamlConfig.humanInteractionPoints.forEach(point => {
        humanInteractionPoints.push({
            method: point.taskName,
            type: point.type,
            blocking: true,
            description: point.description
        });
    });
    // Extract external services
    const externalServices = flowSignals.externalInteractions.services;
    // Detect artifact production
    const producesArtifacts = flowSignals.externalInteractions.fileOperations.writes ||
        flowSignals.externalInteractions.fileOperations.formats.length > 0;
    // Estimate duration based on complexity
    let estimatedDuration = 300; // 5 minutes base
    estimatedDuration += crewCount * 120; // 2 minutes per crew
    estimatedDuration += humanInteractionPoints.length * 180; // 3 minutes per human interaction
    estimatedDuration += externalServices.length * 60; // 1 minute per external service
    // Cap at 15 minutes for typical flows
    estimatedDuration = Math.min(estimatedDuration, 900);
    // Detect infinite loops
    const hasInfiniteLoop = flowSignals.behavioralPatterns.hasInfiniteLoop;
    return {
        stepCount,
        routerLabels,
        combinators,
        crewCount,
        crewChaining,
        parallelCrews,
        humanInteractionPoints,
        externalServices,
        producesArtifacts,
        estimatedDuration,
        hasInfiniteLoop
    };
}
/**
 * Extract flow capabilities
 */
function extractFlowCapabilities(flowSignals, yamlConfig) {
    const capabilities = [];
    // Basic flow capabilities
    capabilities.push('workflow_orchestration');
    // Crew orchestration
    if (flowSignals.behavioralPatterns.executesCrews) {
        capabilities.push('crew_orchestration');
    }
    // Parallel execution
    if (flowSignals.behavioralPatterns.parallelCrews) {
        capabilities.push('parallel_execution');
    }
    // Human-in-the-loop
    if (flowSignals.behavioralPatterns.hasHumanInLoop || yamlConfig.humanInteractionPoints.length > 0) {
        capabilities.push('human_in_the_loop');
    }
    // External integrations
    if (flowSignals.behavioralPatterns.hasExternalIntegrations) {
        capabilities.push('external_integrations');
    }
    // State management
    if (flowSignals.behavioralPatterns.hasStateEvolution) {
        capabilities.push('state_management');
    }
    // File operations
    if (flowSignals.externalInteractions.fileOperations.reads ||
        flowSignals.externalInteractions.fileOperations.writes) {
        capabilities.push('file_operations');
    }
    // Conditional routing
    if (flowSignals.routingLogic.routerMethods.length > 0) {
        capabilities.push('conditional_routing');
    }
    // Long-running processes
    if (flowSignals.behavioralPatterns.hasInfiniteLoop) {
        capabilities.push('long_running_process');
    }
    return capabilities;
}
/**
 * Generate flow chart from signals and YAML config
 */
function generateFlowChart(flowSignals, yamlConfig) {
    const lines = [];
    lines.push(`# ${flowSignals.className} Flow Chart`);
    lines.push('');
    // Start methods
    const startMethods = flowSignals.frameworkSpecific.decorators.starts;
    if (startMethods.length > 0) {
        if (startMethods.length === 1) {
            lines.push(`START: [${startMethods[0]}]`);
        }
        else {
            lines.push('START (parallel):');
            startMethods.forEach(method => {
                lines.push(`  ├─ [${method}] @start`);
            });
        }
        lines.push('  ↓');
    }
    // Listener methods with dependencies
    const listeners = flowSignals.frameworkSpecific.decorators.listeners;
    listeners.forEach(listener => {
        const combinator = listener.combinator ? `${listener.combinator}(${listener.listensTo.join(', ')})` : listener.listensTo.join(', ');
        lines.push(`[${listener.method}] @listen(${combinator})`);
        // Check if this method executes crews
        const methodCrews = flowSignals.externalInteractions.crews.filter(crew => flowSignals.className.toLowerCase().includes(crew.toLowerCase()));
        if (methodCrews.length > 0) {
            lines.push(`  - executes: ${methodCrews.join(', ')}`);
        }
        lines.push('  ↓');
    });
    // Router methods
    const routers = flowSignals.frameworkSpecific.decorators.routers;
    routers.forEach(router => {
        lines.push(`<${router.method}> @router`);
        router.labels.forEach(label => {
            lines.push(`  ├─→ IF ${label}: [next_step]`);
        });
        lines.push('  ↓');
    });
    // Human interaction points
    if (yamlConfig.humanInteractionPoints.length > 0) {
        lines.push('');
        lines.push('Human Interaction Points:');
        yamlConfig.humanInteractionPoints.forEach(point => {
            lines.push(`  👤 [${point.taskName}] - ${point.type}: ${point.description}`);
        });
    }
    // External services
    if (flowSignals.externalInteractions.services.length > 0) {
        lines.push('');
        lines.push('External Services:');
        flowSignals.externalInteractions.services.forEach(service => {
            lines.push(`  🔗 ${service.name}: ${service.operations.join(', ')}`);
        });
    }
    lines.push('');
    lines.push('END');
    return lines.join('\n');
}
/**
 * Extract crew entities from a Python file (traditional crews, not flows)
 */
async function extractCrewEntitiesFromFile(filePath, yamlConfig) {
    // This would use the existing team-discovery logic
    // For now, return empty array as we're focusing on flows
    return [];
}
/**
 * Create crew entities from YAML-only configurations
 */
async function createCrewEntitiesFromYaml(projectPath, yamlConfig) {
    const entities = [];
    for (const [crewName, crew] of Object.entries(yamlConfig.crews)) {
        const entity = {
            id: `yaml:${crewName}`,
            name: crewName,
            type: 'crew',
            framework: 'crewai',
            path: path.join(projectPath, 'crews.yaml'),
            contract: {
                description: `YAML-defined crew: ${crewName}`,
                capabilities: [
                    `${crew.process}_execution`,
                    'multi_agent_coordination',
                    'task_orchestration'
                ]
            },
            execution: {
                entryPoint: `${crewName}.kickoff`,
                timeout: 300000, // 5 minutes default
                parameters: {
                    crewName
                }
            },
            composition: {
                memberCount: crew.agents.length,
                members: crew.agents,
                process: crew.process || 'sequential'
            },
            metadata: {
                language: 'yaml',
                discovered: new Date().toISOString(),
                isTeam: true,
                source: 'yaml_config'
            },
            yamlConfig
        };
        entities.push(entity);
    }
    return entities;
}
/**
 * Analyze a specific flow file in detail
 */
export async function analyzeFlowFile(filePath) {
    try {
        const projectPath = path.dirname(filePath);
        // Parse the flow file
        const flowSignals = await parseFlowFile(filePath);
        // Analyze YAML configs
        const yamlConfig = await analyzeYamlConfigs(projectPath);
        // Create entity if flow signals found
        let entity = null;
        if (flowSignals) {
            entity = await createFlowEntity(filePath, flowSignals, yamlConfig);
        }
        // Validate the configuration
        const validation = validateFlowConfiguration(flowSignals, yamlConfig);
        return {
            flowSignals,
            yamlConfig,
            entity,
            validation
        };
    }
    catch (error) {
        return {
            flowSignals: null,
            yamlConfig: {
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
            },
            entity: null,
            validation: {
                valid: false,
                errors: [`Failed to analyze flow file: ${error}`],
                warnings: []
            }
        };
    }
}
/**
 * Validate flow configuration
 */
function validateFlowConfiguration(flowSignals, yamlConfig) {
    const errors = [];
    const warnings = [];
    if (!flowSignals) {
        errors.push('No flow signals found - file may not contain a valid CrewAI flow');
        return { valid: false, errors, warnings };
    }
    // Check for start methods
    if (flowSignals.frameworkSpecific.decorators.starts.length === 0) {
        errors.push('Flow has no @start methods - flow cannot be executed');
    }
    // Check for crew references
    if (flowSignals.externalInteractions.crews.length === 0) {
        warnings.push('Flow does not reference any crews - may not be a crew orchestration flow');
    }
    // Check for human interaction without proper handling
    if (flowSignals.behavioralPatterns.hasHumanInLoop && yamlConfig.humanInteractionPoints.length === 0) {
        warnings.push('Flow appears to have human interaction but no YAML configuration found');
    }
    // Check for external services without environment variables
    for (const service of flowSignals.externalInteractions.services) {
        if (!process.env[service.envVar]) {
            warnings.push(`External service ${service.name} requires environment variable ${service.envVar}`);
        }
    }
    // Validate YAML consistency
    const yamlValidation = require('./yaml-analyzer').validateYamlConsistency(yamlConfig);
    errors.push(...yamlValidation.errors);
    warnings.push(...yamlValidation.warnings);
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
//# sourceMappingURL=enhanced-workflow-discovery.js.map