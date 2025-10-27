/**
 * Flow chart generation for CrewAI crews
 *
 * Generates Mermaid diagrams visualizing:
 * - Agent→Task relationships
 * - Tool usage per agent/task
 * - HITL interaction points
 * - External service integrations
 * - Process flow (sequential/hierarchical)
 */
/**
 * Build enhanced Mermaid flow chart for crew
 */
export function buildCrewFlowChart(data) {
    const lines = [];
    // Add title and graph type
    lines.push('```mermaid');
    lines.push('graph TB');
    lines.push('');
    // Get primary crew definition
    const crew = data.crewAST.crewDefinitions[0];
    if (!crew) {
        lines.push('  Start[No Crew Found]');
        lines.push('```');
        return lines.join('\n');
    }
    // Add start node
    lines.push('  Start((Start))');
    lines.push('');
    // Add crew metadata
    lines.push(`  CrewInfo[\"🤖 ${crew.name}\\n${crew.configuration.process} process\"]`);
    lines.push('  Start --> CrewInfo');
    lines.push('');
    // Generate agent nodes
    const agentNodes = generateAgentNodes(crew, data.yamlConfig);
    lines.push(...agentNodes);
    lines.push('');
    // Generate task flow
    const taskFlow = generateTaskFlow(crew, data.yamlConfig);
    lines.push(...taskFlow);
    lines.push('');
    // Add HITL points
    if (data.behavioralPatterns.hasHumanInLoop) {
        const hitlNodes = generateHITLNodes(data.behavioralPatterns);
        lines.push(...hitlNodes);
        lines.push('');
    }
    // Add external integrations
    if (data.externalIntegrations.tools.length > 0 ||
        data.externalIntegrations.apis.length > 0) {
        const integrationNodes = generateIntegrationNodes(data.externalIntegrations);
        lines.push(...integrationNodes);
        lines.push('');
    }
    // Add end node
    lines.push('  End((Complete))');
    const lastTask = crew.configuration.tasks[crew.configuration.tasks.length - 1];
    if (lastTask) {
        lines.push(`  ${sanitizeId(lastTask)} --> End`);
    }
    lines.push('');
    // Add styling
    lines.push(...generateStyling());
    lines.push('```');
    return lines.join('\n');
}
/**
 * Generate agent nodes with their configurations
 */
function generateAgentNodes(crew, yamlConfig) {
    const lines = [];
    lines.push('  %% Agents');
    crew.configuration.agents.forEach((agentName, index) => {
        const agentConfig = yamlConfig.agents[agentName];
        if (agentConfig) {
            const tools = agentConfig.tools?.length ? `\\nTools: ${agentConfig.tools.slice(0, 2).join(', ')}` : '';
            lines.push(`  ${sanitizeId(agentName)}[\"👤 ${agentName}\\n${agentConfig.role}${tools}\"]:::agent`);
        }
        else {
            lines.push(`  ${sanitizeId(agentName)}[\"👤 ${agentName}\"]:::agent`);
        }
    });
    // Connect CrewInfo to agents
    lines.push('  CrewInfo --> ' + crew.configuration.agents.map(a => sanitizeId(a)).join(' & '));
    return lines;
}
/**
 * Generate task flow based on process type
 */
function generateTaskFlow(crew, yamlConfig) {
    const lines = [];
    lines.push('  %% Tasks');
    if (crew.configuration.process === 'sequential') {
        return generateSequentialTaskFlow(crew, yamlConfig);
    }
    else if (crew.configuration.process === 'hierarchical') {
        return generateHierarchicalTaskFlow(crew, yamlConfig);
    }
    else {
        return generateGenericTaskFlow(crew, yamlConfig);
    }
}
/**
 * Generate sequential task flow
 */
function generateSequentialTaskFlow(crew, yamlConfig) {
    const lines = [];
    crew.configuration.tasks.forEach((taskName, index) => {
        const taskConfig = yamlConfig.tasks[taskName];
        const agentName = taskConfig?.agent || crew.configuration.agents[index];
        if (taskConfig) {
            const humanInput = taskConfig.human_input ? ' 👤' : '';
            const tools = taskConfig.tools?.length ? `\\nTools: ${taskConfig.tools.slice(0, 2).join(', ')}` : '';
            lines.push(`  ${sanitizeId(taskName)}[\"📋 ${taskName}${humanInput}\\n${taskConfig.description.substring(0, 50)}...${tools}\"]:::task`);
        }
        else {
            lines.push(`  ${sanitizeId(taskName)}[\"📋 ${taskName}\"]:::task`);
        }
        // Connect agent to task
        if (agentName) {
            lines.push(`  ${sanitizeId(agentName)} --> ${sanitizeId(taskName)}`);
        }
        // Connect tasks sequentially
        if (index > 0) {
            const prevTask = crew.configuration.tasks[index - 1];
            lines.push(`  ${sanitizeId(prevTask)} --> ${sanitizeId(taskName)}`);
        }
    });
    return lines;
}
/**
 * Generate hierarchical task flow
 */
function generateHierarchicalTaskFlow(crew, yamlConfig) {
    const lines = [];
    // Add manager node
    const manager = crew.configuration.manager_llm || crew.configuration.manager_agent || 'Manager';
    lines.push(`  ${sanitizeId(manager)}[\"🎯 ${manager}\\nManager\"]:::manager`);
    lines.push(`  CrewInfo --> ${sanitizeId(manager)}`);
    lines.push('');
    // Manager delegates to tasks
    crew.configuration.tasks.forEach((taskName, index) => {
        const taskConfig = yamlConfig.tasks[taskName];
        const agentName = taskConfig?.agent || crew.configuration.agents[index];
        if (taskConfig) {
            const humanInput = taskConfig.human_input ? ' 👤' : '';
            lines.push(`  ${sanitizeId(taskName)}[\"📋 ${taskName}${humanInput}\\n${taskConfig.description.substring(0, 50)}...\"]:::task`);
        }
        else {
            lines.push(`  ${sanitizeId(taskName)}[\"📋 ${taskName}\"]:::task`);
        }
        // Manager assigns to agent
        lines.push(`  ${sanitizeId(manager)} -.delegates.-> ${sanitizeId(agentName)}`);
        // Agent executes task
        if (agentName) {
            lines.push(`  ${sanitizeId(agentName)} --> ${sanitizeId(taskName)}`);
        }
        // Task reports back to manager
        lines.push(`  ${sanitizeId(taskName)} -.reports.-> ${sanitizeId(manager)}`);
    });
    return lines;
}
/**
 * Generate generic task flow (unknown process)
 */
function generateGenericTaskFlow(crew, yamlConfig) {
    const lines = [];
    crew.configuration.tasks.forEach((taskName, index) => {
        const taskConfig = yamlConfig.tasks[taskName];
        const agentName = taskConfig?.agent || crew.configuration.agents[index];
        if (taskConfig) {
            lines.push(`  ${sanitizeId(taskName)}[\"📋 ${taskName}\\n${taskConfig.description.substring(0, 50)}...\"]:::task`);
        }
        else {
            lines.push(`  ${sanitizeId(taskName)}[\"📋 ${taskName}\"]:::task`);
        }
        // Connect agent to task
        if (agentName) {
            lines.push(`  ${sanitizeId(agentName)} --> ${sanitizeId(taskName)}`);
        }
    });
    return lines;
}
/**
 * Generate HITL (Human-in-the-Loop) nodes
 */
function generateHITLNodes(patterns) {
    const lines = [];
    lines.push('  %% Human Interaction Points');
    patterns.humanInteractionPoints.forEach((point, index) => {
        const nodeId = `hitl_${sanitizeId(point.taskName)}`;
        lines.push(`  ${nodeId}{\"👤 Human ${point.type}\\n${point.description}\"}:::hitl`);
        lines.push(`  ${sanitizeId(point.taskName)} --> ${nodeId}`);
        lines.push(`  ${nodeId} --> ${sanitizeId(point.taskName)}_continue[Continue]`);
    });
    return lines;
}
/**
 * Generate external integration nodes
 */
function generateIntegrationNodes(integrations) {
    const lines = [];
    lines.push('  %% External Integrations');
    // Group tools by type
    const toolsByType = {};
    integrations.tools.forEach(tool => {
        if (!toolsByType[tool.type]) {
            toolsByType[tool.type] = [];
        }
        toolsByType[tool.type].push(tool.name);
    });
    // Create integration nodes
    Object.entries(toolsByType).forEach(([type, tools]) => {
        if (tools.length > 0) {
            const nodeId = `integration_${type}`;
            const toolList = tools.slice(0, 3).join(', ') + (tools.length > 3 ? '...' : '');
            lines.push(`  ${nodeId}[(\"🔌 ${type} Tools\\n${toolList}\")]:::integration`);
        }
    });
    // API integrations
    if (integrations.apis.length > 0) {
        const apiList = integrations.apis.slice(0, 3).map(a => a.name).join(', ');
        lines.push(`  api_integration[(\"🌐 APIs\\n${apiList}\")]:::integration`);
    }
    // Database integrations
    if (integrations.databases.length > 0) {
        const dbList = integrations.databases.map(d => d.type).join(', ');
        lines.push(`  db_integration[(\"💾 Databases\\n${dbList}\")]:::integration`);
    }
    return lines;
}
/**
 * Generate chart styling
 */
function generateStyling() {
    return [
        '  %% Styling',
        '  classDef agent fill:#e1f5ff,stroke:#01579b,stroke-width:2px',
        '  classDef task fill:#fff9c4,stroke:#f57f17,stroke-width:2px',
        '  classDef manager fill:#f3e5f5,stroke:#4a148c,stroke-width:3px',
        '  classDef hitl fill:#ffebee,stroke:#b71c1c,stroke-width:2px',
        '  classDef integration fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px'
    ];
}
/**
 * Sanitize ID for Mermaid
 */
function sanitizeId(id) {
    return id
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/^(\d)/, '_$1'); // Mermaid IDs can't start with numbers
}
/**
 * Generate text-based flow chart for non-Mermaid contexts
 */
export function buildTextFlowChart(data) {
    const lines = [];
    const crew = data.crewAST.crewDefinitions[0];
    if (!crew) {
        return 'No crew found';
    }
    lines.push(`# ${crew.name} Flow`);
    lines.push('');
    lines.push(`Process: ${crew.configuration.process}`);
    lines.push('');
    // Agents
    lines.push('## Agents');
    crew.configuration.agents.forEach(agentName => {
        const agentConfig = data.yamlConfig.agents[agentName];
        if (agentConfig) {
            lines.push(`- **${agentName}**: ${agentConfig.role}`);
            if (agentConfig.tools && agentConfig.tools.length > 0) {
                lines.push(`  - Tools: ${agentConfig.tools.join(', ')}`);
            }
        }
        else {
            lines.push(`- **${agentName}**`);
        }
    });
    lines.push('');
    // Tasks
    lines.push('## Task Flow');
    crew.configuration.tasks.forEach((taskName, index) => {
        const taskConfig = data.yamlConfig.tasks[taskName];
        const agentName = taskConfig?.agent || crew.configuration.agents[index];
        lines.push(`${index + 1}. **${taskName}** (${agentName})`);
        if (taskConfig) {
            lines.push(`   - ${taskConfig.description}`);
            if (taskConfig.human_input) {
                lines.push(`   - 👤 Requires human input`);
            }
            if (taskConfig.tools && taskConfig.tools.length > 0) {
                lines.push(`   - Tools: ${taskConfig.tools.join(', ')}`);
            }
        }
        if (index < crew.configuration.tasks.length - 1) {
            lines.push('   ↓');
        }
    });
    lines.push('');
    // HITL points
    if (data.behavioralPatterns.hasHumanInLoop) {
        lines.push('## Human Interaction Points');
        data.behavioralPatterns.humanInteractionPoints.forEach(point => {
            lines.push(`- **${point.taskName}** (${point.type}): ${point.description}`);
        });
        lines.push('');
    }
    // External integrations
    if (data.externalIntegrations.tools.length > 0 ||
        data.externalIntegrations.apis.length > 0) {
        lines.push('## External Integrations');
        if (data.externalIntegrations.tools.length > 0) {
            lines.push('### Tools');
            data.externalIntegrations.tools.forEach(tool => {
                lines.push(`- ${tool.name} (${tool.type})`);
            });
        }
        if (data.externalIntegrations.apis.length > 0) {
            lines.push('### APIs');
            data.externalIntegrations.apis.forEach(api => {
                lines.push(`- ${api.name}`);
            });
        }
        if (data.externalIntegrations.databases.length > 0) {
            lines.push('### Databases');
            data.externalIntegrations.databases.forEach(db => {
                lines.push(`- ${db.type}`);
            });
        }
        lines.push('');
    }
    return lines.join('\n');
}
//# sourceMappingURL=crew-flow-chart-builder.js.map