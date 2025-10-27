/**
 * Behavioral pattern analysis for CrewAI crews
 *
 * Analyzes crew behavior patterns similar to flow analysis:
 * - Tool usage dimensions
 * - External integrations
 * - Human-in-the-loop points
 * - Conditional logic
 * - Error handling
 * - State management
 */
/**
 * Analyze crew behavioral patterns from AST and YAML
 */
export function analyzeCrewBehavior(crewAST, yamlConfig) {
    // Extract tool usage
    const hasToolUsage = crewAST.toolUsage.length > 0 ||
        Object.values(yamlConfig.agents).some(a => (a.tools || []).length > 0) ||
        Object.values(yamlConfig.tasks).some(t => (t.tools || []).length > 0);
    const toolsList = extractToolsList(crewAST, yamlConfig);
    // Extract file operations
    const fileOperations = extractFileOperations(crewAST);
    const hasFileIO = fileOperations.reads || fileOperations.writes;
    // Extract API calls
    const apiCalls = extractAPICallsList(crewAST);
    const hasExternalAPIs = apiCalls.length > 0;
    // Extract human-in-the-loop points
    const humanInteractionPoints = extractHITLPoints(yamlConfig, crewAST);
    const hasHumanInLoop = humanInteractionPoints.length > 0;
    // Extract conditional logic
    const conditionalPaths = extractConditionalPaths(crewAST);
    const hasConditionalLogic = conditionalPaths.length > 0;
    // Extract error handling
    const errorHandlers = extractErrorHandlers(crewAST);
    const hasErrorHandling = errorHandlers.length > 0;
    // Extract state management
    const stateVariables = extractStateVariables(crewAST);
    const hasStateManagement = stateVariables.length > 0;
    // Calculate complexity
    const complexityLevel = calculateComplexity(crewAST, yamlConfig, {
        hasToolUsage,
        hasFileIO,
        hasExternalAPIs,
        hasHumanInLoop,
        hasConditionalLogic,
        hasErrorHandling,
        hasStateManagement
    });
    return {
        hasToolUsage,
        toolsList,
        hasFileIO,
        fileOperations,
        hasExternalAPIs,
        apiCalls,
        hasHumanInLoop,
        humanInteractionPoints,
        hasConditionalLogic,
        conditionalPaths,
        hasErrorHandling,
        errorHandlers,
        hasStateManagement,
        stateVariables,
        complexityLevel
    };
}
/**
 * Extract complete tools list from AST and YAML
 */
function extractToolsList(crewAST, yamlConfig) {
    const tools = new Set();
    // From AST
    crewAST.toolUsage.forEach(tool => tools.add(tool.toolName));
    // From YAML agents
    Object.values(yamlConfig.agents).forEach(agent => {
        (agent.tools || []).forEach(tool => tools.add(tool));
    });
    // From YAML tasks
    Object.values(yamlConfig.tasks).forEach(task => {
        (task.tools || []).forEach(tool => tools.add(tool));
    });
    return Array.from(tools);
}
/**
 * Extract file operations from AST
 */
function extractFileOperations(crewAST) {
    const reads = crewAST.externalCalls.some(call => call.callType === 'file' && ['read', 'open', 'load'].includes(call.method));
    const writes = crewAST.externalCalls.some(call => call.callType === 'file' && ['write', 'save'].includes(call.method));
    // Extract file formats from imports and tool usage
    const formats = new Set();
    crewAST.imports.forEach(imp => {
        if (imp.module.includes('csv'))
            formats.add('CSV');
        if (imp.module.includes('json'))
            formats.add('JSON');
        if (imp.module.includes('yaml'))
            formats.add('YAML');
        if (imp.module.includes('pdf'))
            formats.add('PDF');
        if (imp.module.includes('docx'))
            formats.add('DOCX');
    });
    crewAST.toolUsage.forEach(tool => {
        if (tool.toolName.includes('FileRead') || tool.toolName.includes('FileWrite')) {
            formats.add('TXT');
        }
    });
    return {
        reads,
        writes,
        formats: Array.from(formats)
    };
}
/**
 * Extract API calls list from AST
 */
function extractAPICallsList(crewAST) {
    const apis = new Set();
    crewAST.externalCalls.forEach(call => {
        if (call.callType === 'api') {
            apis.add(call.service);
        }
    });
    // Check imports for common API libraries
    crewAST.imports.forEach(imp => {
        if (imp.module === 'requests' || imp.module === 'httpx') {
            apis.add('HTTP');
        }
        if (imp.module.includes('slack'))
            apis.add('Slack');
        if (imp.module.includes('trello'))
            apis.add('Trello');
        if (imp.module.includes('gmail'))
            apis.add('Gmail');
        if (imp.module.includes('github'))
            apis.add('GitHub');
    });
    return Array.from(apis);
}
/**
 * Extract human-in-the-loop points from YAML and AST
 */
function extractHITLPoints(yamlConfig, crewAST) {
    const hitlPoints = [];
    // From YAML config (already analyzed)
    yamlConfig.humanInteractionPoints.forEach(point => {
        hitlPoints.push({
            taskName: point.taskName,
            type: point.type,
            description: point.description,
            blocking: true
        });
    });
    // From AST - look for input() calls or approval dimensions
    crewAST.externalCalls.forEach(call => {
        if (call.service === 'user_input' || call.method === 'input') {
            hitlPoints.push({
                taskName: `input_at_line_${call.lineno}`,
                type: 'input',
                description: 'User input required',
                blocking: true
            });
        }
    });
    return hitlPoints;
}
/**
 * Extract conditional paths from AST
 */
function extractConditionalPaths(crewAST) {
    const paths = [];
    crewAST.controlFlow.forEach(flow => {
        if (flow.type === 'conditional' && flow.condition) {
            paths.push({
                condition: flow.condition,
                target: 'next_step',
                lineno: flow.lineno
            });
        }
    });
    return paths;
}
/**
 * Extract error handlers from AST
 */
function extractErrorHandlers(crewAST) {
    return crewAST.errorHandling.map(eh => ({
        exceptionTypes: eh.exceptionTypes,
        hasRetry: eh.hasRetry,
        hasFallback: eh.hasFallback,
        lineno: eh.lineno
    }));
}
/**
 * Extract state variables from AST
 */
function extractStateVariables(crewAST) {
    const stateVars = new Set();
    // Look for common state variable dimensions in crew definitions
    crewAST.crewDefinitions.forEach(crew => {
        // Check for state-related configuration
        if (crew.configuration.memory) {
            stateVars.add('shared_memory');
        }
        if (crew.configuration.cache) {
            stateVars.add('cache_state');
        }
    });
    return Array.from(stateVars);
}
/**
 * Calculate complexity level based on dimensions
 */
function calculateComplexity(crewAST, yamlConfig, dimensions) {
    let complexityScore = 0;
    // Base complexity from crew configuration
    const crewCount = crewAST.crewDefinitions.length;
    const agentCount = Object.keys(yamlConfig.agents).length;
    const taskCount = Object.keys(yamlConfig.tasks).length;
    complexityScore += crewCount * 2;
    complexityScore += agentCount * 1;
    complexityScore += taskCount * 1;
    // Add complexity from dimensions
    if (dimensions.hasToolUsage)
        complexityScore += 2;
    if (dimensions.hasFileIO)
        complexityScore += 2;
    if (dimensions.hasExternalAPIs)
        complexityScore += 3;
    if (dimensions.hasHumanInLoop)
        complexityScore += 2;
    if (dimensions.hasConditionalLogic)
        complexityScore += 1;
    if (dimensions.hasErrorHandling)
        complexityScore += 1;
    if (dimensions.hasStateManagement)
        complexityScore += 2;
    // Add complexity from control flow
    complexityScore += crewAST.controlFlow.length * 0.5;
    // Classify complexity
    if (complexityScore <= 5)
        return 'simple';
    if (complexityScore <= 10)
        return 'moderate';
    if (complexityScore <= 15)
        return 'complex';
    return 'advanced';
}
/**
 * Generate behavior summary for LLM context
 */
export function generateBehaviorSummary(dimensions) {
    const lines = [];
    lines.push(`# Behavioral Dimensions Analysis`);
    lines.push(``);
    lines.push(`Complexity Level: ${dimensions.complexityLevel}`);
    lines.push(``);
    if (dimensions.hasToolUsage) {
        lines.push(`## Tools Used`);
        dimensions.toolsList.forEach(tool => {
            lines.push(`- ${tool}`);
        });
        lines.push(``);
    }
    if (dimensions.hasFileIO) {
        lines.push(`## File Operations`);
        lines.push(`- Reads: ${dimensions.fileOperations.reads ? 'Yes' : 'No'}`);
        lines.push(`- Writes: ${dimensions.fileOperations.writes ? 'Yes' : 'No'}`);
        if (dimensions.fileOperations.formats.length > 0) {
            lines.push(`- Formats: ${dimensions.fileOperations.formats.join(', ')}`);
        }
        lines.push(``);
    }
    if (dimensions.hasExternalAPIs) {
        lines.push(`## External APIs`);
        dimensions.apiCalls.forEach(api => {
            lines.push(`- ${api}`);
        });
        lines.push(``);
    }
    if (dimensions.hasHumanInLoop) {
        lines.push(`## Human Interaction Points`);
        dimensions.humanInteractionPoints.forEach(point => {
            lines.push(`- ${point.taskName} (${point.type}): ${point.description}`);
        });
        lines.push(``);
    }
    if (dimensions.hasConditionalLogic) {
        lines.push(`## Conditional Logic`);
        lines.push(`- ${dimensions.conditionalPaths.length} conditional path(s) detected`);
        lines.push(``);
    }
    if (dimensions.hasErrorHandling) {
        lines.push(`## Error Handling`);
        lines.push(`- ${dimensions.errorHandlers.length} error handler(s) implemented`);
        dimensions.errorHandlers.forEach(handler => {
            if (handler.exceptionTypes.length > 0) {
                lines.push(`  - Handles: ${handler.exceptionTypes.join(', ')}`);
            }
            if (handler.hasRetry) {
                lines.push(`  - Includes retry logic`);
            }
            if (handler.hasFallback) {
                lines.push(`  - Includes fallback logic`);
            }
        });
        lines.push(``);
    }
    return lines.join('\n');
}
//# sourceMappingURL=crew-behavior-analyzer.js.map