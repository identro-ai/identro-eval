"use strict";
/**
 * Enhanced flow chart builder for CrewAI flows
 *
 * Generates comprehensive flow charts that incorporate router logic,
 * HITL points, external integrations, and complex execution patterns.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEnhancedFlowChart = buildEnhancedFlowChart;
exports.generateEnhancedFlowReport = generateEnhancedFlowReport;
/**
 * Build enhanced flow chart with all analysis data
 */
function buildEnhancedFlowChart(flowSignals, yamlConfig, routerAnalysis, pathMap, hitlWorkflow, integrationAnalysis) {
    const title = `${flowSignals.className} Enhanced Flow Chart`;
    const description = generateFlowDescription(flowSignals, yamlConfig);
    // Build the main flow chart
    const chart = generateEnhancedChart(flowSignals, yamlConfig, routerAnalysis, pathMap, hitlWorkflow, integrationAnalysis);
    // Calculate metadata
    const metadata = calculateFlowMetadata(flowSignals, routerAnalysis, pathMap, hitlWorkflow, integrationAnalysis);
    // Generate sections
    const sections = generateFlowSections(flowSignals, routerAnalysis, hitlWorkflow, integrationAnalysis);
    return {
        title,
        description,
        chart,
        metadata,
        sections
    };
}
/**
 * Generate flow description
 */
function generateFlowDescription(flowSignals, yamlConfig) {
    const parts = [];
    parts.push(`Advanced CrewAI flow with ${flowSignals.methods.length} methods`);
    if (flowSignals.behavioralPatterns.executesCrews) {
        parts.push(`orchestrating ${flowSignals.behavioralPatterns.crewCount} crews`);
    }
    if (flowSignals.behavioralPatterns.hasHumanInLoop) {
        parts.push('including human-in-the-loop interactions');
    }
    if (flowSignals.behavioralPatterns.hasExternalIntegrations) {
        parts.push('with external service integrations');
    }
    if (flowSignals.behavioralPatterns.parallelCrews) {
        parts.push('supporting parallel execution');
    }
    return parts.join(', ') + '.';
}
/**
 * Generate the main enhanced flow chart
 */
function generateEnhancedChart(flowSignals, yamlConfig, routerAnalysis, pathMap, hitlWorkflow, integrationAnalysis) {
    const lines = [];
    // Header
    lines.push(`# ${flowSignals.className} Flow Chart`);
    lines.push('');
    // Generate enhanced ASCII-style flow chart
    const flowChart = generateEnhancedASCIIChart(flowSignals, yamlConfig, routerAnalysis, pathMap, hitlWorkflow, integrationAnalysis);
    lines.push(...flowChart);
    return lines.join('\n');
}
/**
 * Generate enhanced ASCII-style flow chart with crews & agents
 */
function generateEnhancedASCIIChart(flowSignals, yamlConfig, routerAnalysis, pathMap, hitlWorkflow, integrationAnalysis) {
    const lines = [];
    // Generate metadata section
    lines.push(...generateFlowMetadata(flowSignals, yamlConfig, routerAnalysis, hitlWorkflow));
    lines.push('');
    // Generate crews & agents section (show once, not repeated)
    lines.push(...generateCrewsAndAgentsSection(yamlConfig));
    lines.push('');
    // Generate flow execution section
    lines.push('## FLOW EXECUTION');
    lines.push('START');
    // Build flow execution order
    const flowOrder = buildFlowExecutionOrder(flowSignals, routerAnalysis);
    // Generate start method
    const startMethods = flowSignals.frameworkSpecific.decorators.starts;
    if (startMethods.length === 1) {
        const startMethod = startMethods[0];
        const crews = getCrewsForMethod(startMethod, flowSignals, yamlConfig);
        const stateInfo = extractStateInfo(startMethod, flowSignals);
        lines.push('  │');
        lines.push(`  ├─[${startMethod}]`);
        if (crews.length > 0) {
            lines.push(`  │  └─ Uses: ${crews.join(', ')}`);
        }
        if (stateInfo.output) {
            lines.push(`  │  └─ Output: ${stateInfo.output}`);
        }
    }
    // Generate flow steps
    for (const step of flowOrder) {
        lines.push('  │');
        if (step.type === 'method') {
            const decoratorInfo = getMethodDecoratorInfo(step.name, flowSignals);
            const crews = getCrewsForMethod(step.name, flowSignals, yamlConfig);
            const stateInfo = extractStateInfo(step.name, flowSignals);
            lines.push(`  ├─[${step.name}] ${decoratorInfo}`);
            if (crews.length > 0) {
                lines.push(`  │  └─ Uses: ${crews.join(', ')}`);
            }
            if (stateInfo.input) {
                lines.push(`  │  └─ Input: ${stateInfo.input}`);
            }
            if (stateInfo.output) {
                lines.push(`  │  └─ Output: ${stateInfo.output}`);
            }
            // Add HITL information
            const hitlInfo = getHITLForMethod(step.name, hitlWorkflow);
            if (hitlInfo) {
                lines.push(`  │  └─ 👤 Human ${hitlInfo.type} required`);
            }
        }
        else if (step.type === 'router') {
            const router = routerAnalysis.find(r => r.routerMethod === step.name);
            if (router) {
                const crews = getCrewsForMethod(step.name, flowSignals, yamlConfig);
                const stateInfo = extractStateInfo(step.name, flowSignals);
                lines.push(`  ├─[${step.name}] @router`);
                if (crews.length > 0) {
                    lines.push(`  │  └─ Uses: ${crews.join(', ')}`);
                }
                if (stateInfo.input) {
                    lines.push(`  │  └─ Input: ${stateInfo.input}`);
                }
                lines.push(`  │  └─ Routes:`);
                // Generate clean router branches
                generateCleanRouterBranches(lines, router, flowSignals);
            }
        }
    }
    lines.push('  │');
    lines.push('END');
    return lines;
}
/**
 * Generate flow metadata section
 */
function generateFlowMetadata(flowSignals, yamlConfig, routerAnalysis, hitlWorkflow) {
    const lines = [];
    lines.push('## METADATA');
    // Determine flow pattern
    const pattern = determineFlowPattern(flowSignals, routerAnalysis);
    lines.push(`- Type: ${pattern}`);
    // Crew and agent counts
    const crewCount = Object.keys(yamlConfig.crews).length;
    const agentCount = Object.keys(yamlConfig.agents).length;
    lines.push(`- Crews: ${crewCount} (${Object.keys(yamlConfig.crews).join(', ')})`);
    lines.push(`- Agents: ${agentCount}`);
    // Router information
    if (routerAnalysis.length > 0) {
        const maxRetries = extractMaxRetries(flowSignals);
        if (maxRetries) {
            lines.push(`- Max iterations: ${maxRetries}`);
        }
    }
    // State management
    const stateModel = extractStateModel(flowSignals);
    if (stateModel) {
        lines.push(`- State: ${stateModel}`);
    }
    // External dependencies
    const externalDeps = flowSignals.externalInteractions.services.length > 0 ?
        flowSignals.externalInteractions.services.map(s => s.name).join(', ') : 'None';
    lines.push(`- External deps: ${externalDeps}`);
    return lines;
}
/**
 * Generate crews and agents section (shown once)
 */
function generateCrewsAndAgentsSection(yamlConfig) {
    const lines = [];
    if (Object.keys(yamlConfig.crews).length === 0) {
        return lines;
    }
    lines.push('## CREWS & AGENTS');
    for (const [crewName, crew] of Object.entries(yamlConfig.crews)) {
        lines.push(`${crewName}:`);
        for (const agentName of crew.agents) {
            const agent = yamlConfig.agents[agentName];
            if (agent) {
                lines.push(`  └─ ${agentName}`);
                lines.push(`     ├─ Role: "${agent.role}"`);
                if (agent.goal) {
                    // Truncate long goals for readability
                    const goal = agent.goal.length > 80 ? agent.goal.substring(0, 80) + '...' : agent.goal;
                    lines.push(`     ├─ Goal: "${goal}"`);
                }
                if (agent.tools && agent.tools.length > 0) {
                    lines.push(`     └─ Tools: [${agent.tools.join(', ')}]`);
                }
                else {
                    lines.push(`     └─ Tools: []`);
                }
            }
        }
        lines.push('');
    }
    return lines;
}
/**
 * Generate clean router branches with 3+ level detail
 */
function generateCleanRouterBranches(lines, router, flowSignals) {
    router.paths.forEach((path, index) => {
        const targetMethod = findActualTargetMethod(path.label, flowSignals);
        // Resolve concrete target method (fix retry → [next_step] ambiguity)
        const concreteTarget = resolveConcreteTarget(path.label, targetMethod, flowSignals);
        // Extract branch guard (code-ish predicate)
        const branchGuard = extractBranchGuard(path.label, flowSignals);
        const guardDisplay = branchGuard ? ` (${branchGuard})` : '';
        // Check for loops
        const isLoop = checkForLoop(path.label, concreteTarget, flowSignals);
        const loopIndicator = isLoop ? ' ↻ (loops back)' : '';
        lines.push(`  │     ├─ "${path.label}" → [${concreteTarget}]${guardDisplay}${loopIndicator}`);
        // Level 2: Show state mutations for this path
        const stateMutations = extractStateMutations(concreteTarget, flowSignals);
        if (stateMutations.reads.length > 0 || stateMutations.writes.length > 0) {
            lines.push(`  │     │  └─ State:`);
            if (stateMutations.reads.length > 0) {
                lines.push(`  │     │     ├─ Reads: ${stateMutations.reads.join(', ')}`);
            }
            if (stateMutations.writes.length > 0) {
                lines.push(`  │     │     └─ Writes: ${stateMutations.writes.join(', ')}`);
            }
        }
        // Level 3: Show artifacts and side effects
        const artifacts = extractArtifacts(concreteTarget, flowSignals);
        if (artifacts.length > 0) {
            lines.push(`  │     │  └─ Artifacts:`);
            artifacts.forEach(artifact => {
                const testMode = artifact.testSafe ? '✅ test-safe' : '⚠️ dry-run only';
                lines.push(`  │     │     └─ ${artifact.type}: ${artifact.path} (${testMode})`);
            });
        }
        // Level 4: Show what happens next (if not a loop)
        if (concreteTarget && !isLoop) {
            const nextMethods = findMethodsListeningTo(concreteTarget, flowSignals);
            if (nextMethods.length > 0) {
                lines.push(`  │     │  └─ Then continues to: ${nextMethods.join(', ')}`);
                // Level 5: Show details of next methods
                nextMethods.forEach(nextMethod => {
                    const nextAction = getMethodAction(nextMethod);
                    if (nextAction) {
                        lines.push(`  │     │     └─ ${nextMethod}: ${nextAction}`);
                    }
                });
            }
        }
    });
}
/**
 * Resolve concrete target method (fix retry → [next_step] ambiguity)
 */
function resolveConcreteTarget(pathLabel, targetMethod, flowSignals) {
    // If we have a concrete target method, use it
    if (targetMethod && targetMethod !== 'next_step') {
        return targetMethod;
    }
    // Handle retry logic - usually goes back to start or generate method
    if (pathLabel.toLowerCase().includes('retry')) {
        // Look for generate methods (common retry target)
        const generateMethod = flowSignals.methods.find(m => m.name.toLowerCase().includes('generate'));
        if (generateMethod) {
            return generateMethod.name;
        }
        // Fallback to start method
        const startMethods = flowSignals.frameworkSpecific.decorators.starts;
        if (startMethods.length > 0) {
            return startMethods[0];
        }
    }
    // Handle complete/success paths
    if (pathLabel.toLowerCase().includes('complete') || pathLabel.toLowerCase().includes('success')) {
        const saveMethod = flowSignals.methods.find(m => m.name.toLowerCase().includes('save') || m.name.toLowerCase().includes('result'));
        if (saveMethod) {
            return saveMethod.name;
        }
    }
    // Handle error/failure paths
    if (pathLabel.toLowerCase().includes('error') || pathLabel.toLowerCase().includes('fail') || pathLabel.toLowerCase().includes('exceed')) {
        const exitMethod = flowSignals.methods.find(m => m.name.toLowerCase().includes('exit') || m.name.toLowerCase().includes('error'));
        if (exitMethod) {
            return exitMethod.name;
        }
    }
    return targetMethod || 'next_step';
}
/**
 * Extract branch guard (code-ish predicate)
 */
function extractBranchGuard(pathLabel, flowSignals) {
    // Look for corresponding conditional paths in the flow
    for (const conditionalPath of flowSignals.routingLogic.conditionalPaths) {
        const condition = conditionalPath.condition.toLowerCase();
        const label = pathLabel.toLowerCase();
        // Match retry conditions
        if (label.includes('retry') && condition.includes('retry_count')) {
            const match = condition.match(/retry_count\s*[<>=!]+\s*\d+/);
            if (match) {
                return match[0].replace('self.state.', '');
            }
        }
        // Match complete conditions
        if (label.includes('complete') && condition.includes('valid')) {
            const match = condition.match(/valid\s*[=!]+\s*\w+/);
            if (match) {
                return match[0].replace('self.state.', '');
            }
        }
        // Match max retry conditions
        if (label.includes('max') && condition.includes('retry_count')) {
            const match = condition.match(/retry_count\s*>\s*\d+/);
            if (match) {
                return match[0].replace('self.state.', '');
            }
        }
        // Match score conditions
        if (label.includes('score') && condition.includes('score')) {
            const match = condition.match(/score\s*[<>=!]+\s*[\d.]+/);
            if (match) {
                return match[0];
            }
        }
    }
    return undefined;
}
/**
 * Extract state mutations for a method
 */
function extractStateMutations(methodName, flowSignals) {
    const mutations = { reads: [], writes: [] };
    if (!methodName || methodName === 'next_step') {
        return mutations;
    }
    const methodLower = methodName.toLowerCase();
    const stateFields = flowSignals.stateManagement.stateFields;
    // Analyze method name for state access patterns
    if (methodLower.includes('generate')) {
        mutations.writes.push('x_post', 'content');
        if (methodLower.includes('retry')) {
            mutations.reads.push('retry_count', 'feedback');
            mutations.writes.push('retry_count');
        }
    }
    if (methodLower.includes('evaluate') || methodLower.includes('score')) {
        mutations.reads.push('x_post', 'content');
        mutations.writes.push('valid', 'score', 'feedback');
    }
    if (methodLower.includes('save')) {
        mutations.reads.push('x_post', 'content', 'valid');
    }
    if (methodLower.includes('load')) {
        mutations.writes.push('candidates', 'leads', 'data');
    }
    if (methodLower.includes('human') || methodLower.includes('loop')) {
        mutations.reads.push('scored_leads_feedback', 'candidates');
        mutations.writes.push('scored_leads_feedback');
    }
    // Filter to only include actual state fields
    mutations.reads = mutations.reads.filter(field => stateFields.includes(field));
    mutations.writes = mutations.writes.filter(field => stateFields.includes(field));
    return mutations;
}
/**
 * Extract artifacts and side effects for a method
 */
function extractArtifacts(methodName, flowSignals) {
    const artifacts = [];
    if (!methodName || methodName === 'next_step') {
        return artifacts;
    }
    const methodLower = methodName.toLowerCase();
    // File operations
    if (methodLower.includes('save') || methodLower.includes('write')) {
        if (flowSignals.externalInteractions.fileOperations.formats.includes('CSV')) {
            artifacts.push({
                type: 'file',
                path: './output/results.csv',
                testSafe: true // CSV files are generally test-safe
            });
        }
        if (flowSignals.externalInteractions.fileOperations.formats.includes('MD')) {
            artifacts.push({
                type: 'file',
                path: './output/book.md',
                testSafe: true // Markdown files are test-safe
            });
        }
        if (methodLower.includes('result')) {
            artifacts.push({
                type: 'file',
                path: './output/final_result.txt',
                testSafe: true
            });
        }
    }
    // API calls
    if (methodLower.includes('slack')) {
        artifacts.push({
            type: 'api',
            path: 'POST /slack/api/chat.postMessage',
            testSafe: false // External API calls need dry-run
        });
    }
    if (methodLower.includes('trello')) {
        artifacts.push({
            type: 'api',
            path: 'POST /trello/api/cards',
            testSafe: false // External API calls need dry-run
        });
    }
    if (methodLower.includes('email')) {
        artifacts.push({
            type: 'api',
            path: 'SMTP send email',
            testSafe: false // Email sending needs dry-run
        });
    }
    return artifacts;
}
/**
 * Get action description for a method
 */
function getMethodAction(methodName) {
    const methodLower = methodName.toLowerCase();
    if (methodLower.includes('save')) {
        return 'Persist to storage';
    }
    else if (methodLower.includes('exit')) {
        return 'Terminate flow';
    }
    else if (methodLower.includes('generate')) {
        return 'Create content';
    }
    else if (methodLower.includes('evaluate')) {
        return 'Assess quality';
    }
    else if (methodLower.includes('load')) {
        return 'Load data';
    }
    else if (methodLower.includes('send')) {
        return 'Send notification';
    }
    else if (methodLower.includes('write')) {
        return 'Write content';
    }
    else if (methodLower.includes('score')) {
        return 'Calculate scores';
    }
    return undefined;
}
/**
 * Check if a router path creates a loop
 */
function checkForLoop(pathLabel, targetMethod, flowSignals) {
    if (!targetMethod)
        return false;
    // Check if target method is a start method (indicates loop)
    return flowSignals.frameworkSpecific.decorators.starts.includes(targetMethod);
}
/**
 * Extract state information for a method
 */
function extractStateInfo(methodName, flowSignals) {
    const info = {};
    // Analyze method name for state hints
    const methodLower = methodName.toLowerCase();
    if (methodLower.includes('generate')) {
        info.output = methodLower.includes('post') ? 'x_post_content' :
            methodLower.includes('email') ? 'email_content' :
                methodLower.includes('task') ? 'task_list' :
                    methodLower.includes('outline') ? 'book_outline' :
                        'generated_content';
    }
    if (methodLower.includes('evaluate') || methodLower.includes('score')) {
        info.input = 'content_to_evaluate';
        info.output = 'evaluation_result';
    }
    if (methodLower.includes('save') || methodLower.includes('write')) {
        info.input = 'content_to_save';
    }
    if (methodLower.includes('load')) {
        info.output = 'loaded_data';
    }
    return info;
}
/**
 * Determine flow pattern type
 */
function determineFlowPattern(flowSignals, routerAnalysis) {
    // Check for retry patterns
    const hasRetry = routerAnalysis.some(r => r.paths.some(p => p.label.toLowerCase().includes('retry')));
    if (hasRetry) {
        return 'Retry-until-success';
    }
    // Check for approval patterns
    const hasApproval = flowSignals.behavioralPatterns.hasHumanInLoop;
    if (hasApproval) {
        return 'Human-approval-workflow';
    }
    // Check for parallel patterns
    if (flowSignals.behavioralPatterns.parallelCrews) {
        return 'Parallel-orchestration';
    }
    // Check for infinite loop patterns
    if (flowSignals.behavioralPatterns.hasInfiniteLoop) {
        return 'Continuous-monitoring';
    }
    return 'Sequential-workflow';
}
/**
 * Extract max retries from flow signals
 */
function extractMaxRetries(flowSignals) {
    // Look for retry count patterns in conditional paths
    for (const path of flowSignals.routingLogic.conditionalPaths) {
        const condition = path.condition.toLowerCase();
        // Look for patterns like "retry_count > 3"
        const retryMatch = condition.match(/retry_count\s*>\s*(\d+)/);
        if (retryMatch) {
            return parseInt(retryMatch[1]) + 1; // +1 because condition is "greater than"
        }
        // Look for patterns like "retries >= 5"
        const retriesMatch = condition.match(/retries?\s*>=?\s*(\d+)/);
        if (retriesMatch) {
            return parseInt(retriesMatch[1]);
        }
    }
    return undefined;
}
/**
 * Extract state model information
 */
function extractStateModel(flowSignals) {
    if (flowSignals.stateManagement.type === 'structured' && flowSignals.stateManagement.stateModel) {
        const fields = flowSignals.stateManagement.stateFields;
        return `${flowSignals.stateManagement.stateModel} {${fields.join(', ')}}`;
    }
    if (flowSignals.stateManagement.stateFields.length > 0) {
        return `{${flowSignals.stateManagement.stateFields.join(', ')}}`;
    }
    return undefined;
}
/**
 * Generate router branches with 3+ levels of depth showing where flow continues
 */
function generateRouterBranches(lines, router, flowSignals, yamlConfig, integrationAnalysis, hitlWorkflow, depth) {
    const indent = '  '.repeat(depth + 1);
    const branchIndent = '  '.repeat(depth + 2);
    router.paths.forEach((path, index) => {
        const isLast = index === router.paths.length - 1;
        const connector = isLast ? '└─→' : '├─→';
        // Show the branch with the actual target method (where flow continues)
        const targetMethod = findActualTargetMethod(path.label, flowSignals);
        const targetDisplay = targetMethod || 'next_step';
        lines.push(`${indent}${connector} IF ${path.label}: [${targetDisplay}]`);
        // Level 1: Show what happens in the target method
        if (targetMethod) {
            // Show crews active in this target method
            const crews = getCrewsForMethod(targetMethod, flowSignals, yamlConfig);
            if (crews.length > 0) {
                lines.push(`${branchIndent}└─ Executes Crews: ${crews.join(', ')}`);
                // Level 2: Show agents for each crew
                crews.forEach(crew => {
                    const agents = getAgentsForCrew(crew, yamlConfig);
                    if (agents.length > 0) {
                        lines.push(`${branchIndent}   └─ ${crew} → Agents: ${agents.join(', ')}`);
                        // Level 3: Show agent roles and what they do
                        agents.forEach(agent => {
                            const agentDetails = getAgentDetails(agent, yamlConfig);
                            if (agentDetails) {
                                lines.push(`${branchIndent}      └─ ${agent}: ${agentDetails.role || 'Unknown role'}`);
                                if (agentDetails.goal) {
                                    lines.push(`${branchIndent}         └─ Goal: ${agentDetails.goal}`);
                                }
                                if (agentDetails.tools && agentDetails.tools.length > 0) {
                                    lines.push(`${branchIndent}         └─ Tools: ${agentDetails.tools.join(', ')}`);
                                }
                            }
                        });
                    }
                });
            }
            // Show what happens next after this target method
            const nextMethods = findMethodsListeningTo(targetMethod, flowSignals);
            if (nextMethods.length > 0) {
                lines.push(`${branchIndent}└─ Then continues to: ${nextMethods.join(', ')}`);
                // Level 2: Show details of next methods
                nextMethods.forEach(nextMethod => {
                    const nextCrews = getCrewsForMethod(nextMethod, flowSignals, yamlConfig);
                    if (nextCrews.length > 0) {
                        lines.push(`${branchIndent}   └─ ${nextMethod} → Crews: ${nextCrews.join(', ')}`);
                    }
                    // Check if next method is also a router
                    const isNextRouter = flowSignals.frameworkSpecific.decorators.routers.find(r => r.method === nextMethod);
                    if (isNextRouter) {
                        lines.push(`${branchIndent}   └─ ${nextMethod} → Another decision point with ${isNextRouter.labels.length} options`);
                    }
                });
            }
            // Show integrations for this path
            const integrations = getIntegrationsForMethod(targetMethod, integrationAnalysis);
            if (integrations.length > 0) {
                lines.push(`${branchIndent}└─ External Services: ${integrations.join(', ')}`);
            }
            // Show HITL for this path
            const hitlInfo = getHITLForMethod(targetMethod, hitlWorkflow);
            if (hitlInfo) {
                lines.push(`${branchIndent}└─ Human Interaction: ${hitlInfo.type} required`);
                if (hitlInfo.blocking) {
                    lines.push(`${branchIndent}   └─ ⚠️  Flow pauses until human responds`);
                }
            }
        }
    });
}
/**
 * Find the actual target method that a router path leads to
 */
function findActualTargetMethod(pathLabel, flowSignals) {
    // Look for methods that listen to this path label
    for (const listener of flowSignals.frameworkSpecific.decorators.listeners) {
        if (listener.listensTo.includes(pathLabel)) {
            return listener.method;
        }
    }
    // If no direct listener, check if the label matches a method name
    const matchingMethod = flowSignals.methods.find(m => m.name.toLowerCase() === pathLabel.toLowerCase() ||
        pathLabel.toLowerCase().includes(m.name.toLowerCase()));
    return matchingMethod?.name;
}
/**
 * Find methods that listen to a specific method
 */
function findMethodsListeningTo(methodName, flowSignals) {
    const listeners = [];
    for (const listener of flowSignals.frameworkSpecific.decorators.listeners) {
        if (listener.listensTo.includes(methodName)) {
            listeners.push(listener.method);
        }
    }
    return listeners;
}
/**
 * Build flow execution order
 */
function buildFlowExecutionOrder(flowSignals, routerAnalysis) {
    const order = [];
    const processed = new Set();
    // Start with listener methods (excluding start methods)
    const listeners = flowSignals.frameworkSpecific.decorators.listeners;
    const routers = routerAnalysis.map(r => r.routerMethod);
    // Add methods in listener dependency order
    for (const listener of listeners) {
        if (!processed.has(listener.method)) {
            if (routers.includes(listener.method)) {
                order.push({ type: 'router', name: listener.method });
            }
            else {
                order.push({ type: 'method', name: listener.method });
            }
            processed.add(listener.method);
        }
    }
    // Add any remaining methods
    for (const method of flowSignals.methods) {
        if (!processed.has(method.name) &&
            !flowSignals.frameworkSpecific.decorators.starts.includes(method.name)) {
            if (routers.includes(method.name)) {
                order.push({ type: 'router', name: method.name });
            }
            else {
                order.push({ type: 'method', name: method.name });
            }
            processed.add(method.name);
        }
    }
    return order;
}
/**
 * Get crews associated with a method
 */
function getCrewsForMethod(methodName, flowSignals, yamlConfig) {
    const crews = [];
    // Check if method name contains crew references
    const methodLower = methodName.toLowerCase();
    // Look for crew references in external interactions
    for (const crew of flowSignals.externalInteractions.crews) {
        if (methodLower.includes(crew.toLowerCase()) || crew.toLowerCase().includes(methodLower)) {
            crews.push(crew);
        }
    }
    // Look for crew references in YAML config
    if (yamlConfig.crews) {
        for (const [crewName, crewConfig] of Object.entries(yamlConfig.crews)) {
            if (methodLower.includes(crewName.toLowerCase()) || crewName.toLowerCase().includes(methodLower)) {
                crews.push(crewName);
            }
        }
    }
    // Enhanced mapping: Look for common patterns in flow projects
    // Many flow methods execute crews even if not directly named
    if (crews.length === 0) {
        // If this method executes crews (based on behavioral patterns), show available crews
        if (flowSignals.behavioralPatterns.executesCrews) {
            // For flow projects, often the crew name is related to the flow name
            const flowName = flowSignals.className.toLowerCase();
            // Look for crews that match the flow pattern
            for (const [crewName, crewConfig] of Object.entries(yamlConfig.crews)) {
                const crewLower = crewName.toLowerCase();
                // Check if crew name relates to flow name or method
                if (flowName.includes(crewLower) ||
                    crewLower.includes(flowName.replace('flow', '')) ||
                    methodLower.includes('crew') ||
                    methodLower.includes('execute') ||
                    methodLower.includes('run')) {
                    crews.push(crewName);
                }
            }
            // If still no crews found but we know crews are executed, show all available crews
            if (crews.length === 0 && Object.keys(yamlConfig.crews).length > 0) {
                crews.push(...Object.keys(yamlConfig.crews));
            }
        }
    }
    return [...new Set(crews)]; // Remove duplicates
}
/**
 * Get agents for a specific method
 */
function getAgentsForMethod(methodName, yamlConfig) {
    const agents = [];
    if (yamlConfig.agents) {
        const methodLower = methodName.toLowerCase();
        for (const [agentName, agentConfig] of Object.entries(yamlConfig.agents)) {
            if (methodLower.includes(agentName.toLowerCase()) ||
                agentName.toLowerCase().includes(methodLower) ||
                (agentConfig.role && methodLower.includes(agentConfig.role.toLowerCase()))) {
                agents.push(agentName);
            }
        }
    }
    return agents;
}
/**
 * Get agents for a specific crew
 */
function getAgentsForCrew(crewName, yamlConfig) {
    const agents = [];
    if (yamlConfig.crews && yamlConfig.crews[crewName]) {
        const crewConfig = yamlConfig.crews[crewName];
        if (crewConfig.agents) {
            agents.push(...crewConfig.agents);
        }
    }
    return agents;
}
/**
 * Get agent details
 */
function getAgentDetails(agentName, yamlConfig) {
    if (yamlConfig.agents && yamlConfig.agents[agentName]) {
        return yamlConfig.agents[agentName];
    }
    return null;
}
/**
 * Get method decorator information
 */
function getMethodDecoratorInfo(methodName, flowSignals) {
    const decorators = [];
    // Check for @listen decorators
    const listener = flowSignals.frameworkSpecific.decorators.listeners.find(l => l.method === methodName);
    if (listener) {
        const listenTargets = listener.listensTo.join(', ');
        decorators.push(`@listen(${listenTargets})`);
    }
    // Check for @router decorators
    const router = flowSignals.frameworkSpecific.decorators.routers.find(r => r.method === methodName);
    if (router) {
        decorators.push('@router');
    }
    return decorators.length > 0 ? decorators.join(' ') : '';
}
/**
 * Get integrations for a method
 */
function getIntegrationsForMethod(methodName, integrationAnalysis) {
    const integrations = [];
    for (const point of integrationAnalysis.points) {
        for (const operation of point.operations) {
            if (operation.method.includes(methodName)) {
                integrations.push(point.service);
                break;
            }
        }
    }
    return [...new Set(integrations)];
}
/**
 * Get integration details
 */
function getIntegrationDetails(serviceName, integrationAnalysis) {
    const point = integrationAnalysis.points.find(p => p.service === serviceName);
    return point ? {
        type: point.type,
        availability: point.reliability.availability,
        responseTime: point.reliability.responseTime
    } : null;
}
/**
 * Get HITL information for a method
 */
function getHITLForMethod(methodName, hitlWorkflow) {
    const point = hitlWorkflow.points.find(p => p.method === methodName);
    return point ? {
        type: point.type,
        urgency: point.context.urgency,
        timeout: point.timeout,
        blocking: point.blocking
    } : null;
}
/**
 * Generate start nodes
 */
function generateStartNodes(startMethods) {
    const lines = [];
    if (startMethods.length === 1) {
        lines.push(`    START([🚀 START: ${startMethods[0]}])`);
    }
    else {
        lines.push('    START([🚀 PARALLEL START])');
        startMethods.forEach((method, index) => {
            lines.push(`    START${index}([${method}])`);
            lines.push(`    START --> START${index}`);
        });
    }
    return lines;
}
/**
 * Generate process nodes with enhanced information
 */
function generateProcessNodes(flowSignals, routerAnalysis, hitlWorkflow, integrationAnalysis) {
    const lines = [];
    for (const method of flowSignals.methods) {
        const methodId = method.name.toUpperCase();
        // Skip start methods and routers (handled separately)
        if (flowSignals.frameworkSpecific.decorators.starts.includes(method.name) ||
            routerAnalysis.some(r => r.routerMethod === method.name)) {
            continue;
        }
        // Determine node type and styling
        let nodeType = '[]';
        let icon = '⚙️';
        let extraInfo = '';
        // Check if this is a crew execution method
        if (flowSignals.externalInteractions.crews.length > 0) {
            const crewsInMethod = flowSignals.externalInteractions.crews.filter(crew => method.name.toLowerCase().includes(crew.toLowerCase()));
            if (crewsInMethod.length > 0) {
                icon = '👥';
                extraInfo = `<br/>Crews: ${crewsInMethod.join(', ')}`;
            }
        }
        // Check if this method has integrations
        const methodIntegrations = integrationAnalysis.points.filter(point => point.operations.some(op => op.method.includes(method.name)));
        if (methodIntegrations.length > 0) {
            icon = '🔗';
            extraInfo += `<br/>Integrations: ${methodIntegrations.map(i => i.service).join(', ')}`;
        }
        // Check if this is async
        if (method.isAsync) {
            extraInfo += '<br/>⚡ Async';
        }
        lines.push(`    ${methodId}${nodeType.replace('[]', `[${icon} ${method.name}${extraInfo}]`)}`);
    }
    return lines;
}
/**
 * Generate router decision nodes
 */
function generateRouterNodes(routerAnalysis) {
    const lines = [];
    for (const router of routerAnalysis) {
        const routerId = router.routerMethod.toUpperCase();
        // Router decision node
        lines.push(`    ${routerId}{🔀 ${router.routerMethod}<br/>Complexity: ${router.complexity}<br/>Paths: ${router.branchingFactor}}`);
        // Path nodes
        router.paths.forEach((path, index) => {
            const pathId = `${routerId}_PATH${index}`;
            const probability = Math.round((path.probability || 0) * 100);
            lines.push(`    ${pathId}[📍 ${path.label}<br/>${probability}% probability]`);
            lines.push(`    ${routerId} -->|${path.condition}| ${pathId}`);
        });
    }
    return lines;
}
/**
 * Generate HITL interaction nodes
 */
function generateHITLNodes(hitlWorkflow) {
    const lines = [];
    for (const point of hitlWorkflow.points) {
        const pointId = point.id.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        let icon = '👤';
        if (point.type === 'approval')
            icon = '✅';
        else if (point.type === 'review')
            icon = '📋';
        else if (point.type === 'decision')
            icon = '🤔';
        else if (point.type === 'validation')
            icon = '✔️';
        const timeout = point.timeout ? `<br/>Timeout: ${Math.round(point.timeout / 60)}min` : '';
        const urgency = `<br/>Urgency: ${point.context.urgency}`;
        const blocking = point.blocking ? '<br/>🚫 Blocking' : '<br/>⚡ Non-blocking';
        lines.push(`    ${pointId}{{${icon} ${point.method}<br/>Type: ${point.type}${timeout}${urgency}${blocking}}}`);
    }
    return lines;
}
/**
 * Generate integration nodes
 */
function generateIntegrationNodes(integrationAnalysis) {
    const lines = [];
    for (const point of integrationAnalysis.points) {
        const pointId = point.id.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        let icon = '🔗';
        if (point.type === 'database')
            icon = '🗄️';
        else if (point.type === 'messaging')
            icon = '📨';
        else if (point.type === 'file_system')
            icon = '📁';
        else if (point.type === 'storage')
            icon = '💾';
        else if (point.type === 'auth')
            icon = '🔐';
        else if (point.type === 'monitoring')
            icon = '📊';
        const availability = Math.round(point.reliability.availability * 100);
        const responseTime = point.reliability.responseTime;
        const criticality = point.operations.map(op => op.criticality).join(', ');
        lines.push(`    ${pointId}[${icon} ${point.service}<br/>Type: ${point.type}<br/>Availability: ${availability}%<br/>Response: ${responseTime}ms<br/>Criticality: ${criticality}]`);
    }
    return lines;
}
/**
 * Generate parallel execution nodes
 */
function generateParallelNodes(parallelPaths) {
    const lines = [];
    parallelPaths.forEach((parallel, index) => {
        const parallelId = `PARALLEL${index}`;
        const syncType = parallel.synchronizationType === 'and_' ? 'ALL' : 'ANY';
        lines.push(`    ${parallelId}_START[⚡ PARALLEL START<br/>Sync: ${syncType}]`);
        lines.push(`    ${parallelId}_END[⚡ PARALLEL END<br/>Converge: ${parallel.convergenceMethod || 'auto'}]`);
        parallel.parallelMethods.forEach((method, methodIndex) => {
            const methodId = `${parallelId}_${methodIndex}`;
            lines.push(`    ${methodId}[${method}]`);
            lines.push(`    ${parallelId}_START --> ${methodId}`);
            lines.push(`    ${methodId} --> ${parallelId}_END`);
        });
    });
    return lines;
}
/**
 * Generate connections between nodes
 */
function generateConnections(flowSignals, routerAnalysis, pathMap, hitlWorkflow) {
    const lines = [];
    // Basic method connections based on listeners
    for (const listener of flowSignals.frameworkSpecific.decorators.listeners) {
        const targetId = listener.method.toUpperCase();
        for (const dependency of listener.listensTo) {
            const sourceId = dependency.toUpperCase();
            if (listener.combinator) {
                const combinator = listener.combinator === 'and_' ? 'AND' : 'OR';
                lines.push(`    ${sourceId} -->|${combinator}| ${targetId}`);
            }
            else {
                lines.push(`    ${sourceId} --> ${targetId}`);
            }
        }
    }
    // Router path connections
    for (const router of routerAnalysis) {
        const routerId = router.routerMethod.toUpperCase();
        router.paths.forEach((path, index) => {
            const pathId = `${routerId}_PATH${index}`;
            if (path.targetMethod) {
                const targetId = path.targetMethod.toUpperCase();
                lines.push(`    ${pathId} --> ${targetId}`);
            }
        });
    }
    // HITL connections
    for (const point of hitlWorkflow.points) {
        const pointId = point.id.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        // Connect dependencies to HITL point
        for (const dep of point.trigger.dependencies) {
            const depId = dep.toUpperCase();
            lines.push(`    ${depId} --> ${pointId}`);
        }
        // Connect HITL point to impacted steps
        for (const impacted of point.context.impactedSteps) {
            const impactedId = impacted.toUpperCase();
            lines.push(`    ${pointId} --> ${impactedId}`);
        }
    }
    return lines;
}
/**
 * Generate styling for the flow chart
 */
function generateStyling() {
    const lines = [];
    lines.push('    %% Styling');
    lines.push('    classDef startNode fill:#e1f5fe,stroke:#01579b,stroke-width:3px');
    lines.push('    classDef processNode fill:#f3e5f5,stroke:#4a148c,stroke-width:2px');
    lines.push('    classDef routerNode fill:#fff3e0,stroke:#e65100,stroke-width:2px');
    lines.push('    classDef hitlNode fill:#ffebee,stroke:#c62828,stroke-width:2px');
    lines.push('    classDef integrationNode fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px');
    lines.push('    classDef parallelNode fill:#fce4ec,stroke:#ad1457,stroke-width:2px');
    lines.push('    classDef endNode fill:#efebe9,stroke:#3e2723,stroke-width:3px');
    return lines;
}
/**
 * Generate legend for the flow chart
 */
function generateLegend() {
    const lines = [];
    lines.push('## Flow Chart Legend');
    lines.push('');
    lines.push('| Symbol | Meaning |');
    lines.push('|--------|---------|');
    lines.push('| 🚀 | Start point |');
    lines.push('| ⚙️ | Process/Method |');
    lines.push('| 👥 | Crew execution |');
    lines.push('| 🔀 | Router/Decision |');
    lines.push('| 👤 | Human interaction |');
    lines.push('| ✅ | Approval required |');
    lines.push('| 📋 | Review required |');
    lines.push('| 🤔 | Decision required |');
    lines.push('| 🔗 | External integration |');
    lines.push('| 🗄️ | Database |');
    lines.push('| 📨 | Messaging |');
    lines.push('| 📁 | File system |');
    lines.push('| 🔐 | Authentication |');
    lines.push('| ⚡ | Parallel execution |');
    lines.push('| 🚫 | Blocking operation |');
    lines.push('| ⚡ | Non-blocking operation |');
    return lines;
}
/**
 * Calculate flow metadata
 */
function calculateFlowMetadata(flowSignals, routerAnalysis, pathMap, hitlWorkflow, integrationAnalysis) {
    // Determine complexity
    let complexity = 'simple';
    const complexityFactors = [
        routerAnalysis.length > 2,
        hitlWorkflow.points.length > 3,
        integrationAnalysis.points.length > 5,
        pathMap.parallelPaths.length > 1,
        flowSignals.methods.length > 10
    ];
    const complexityScore = complexityFactors.filter(Boolean).length;
    if (complexityScore >= 4)
        complexity = 'advanced';
    else if (complexityScore >= 3)
        complexity = 'complex';
    else if (complexityScore >= 2)
        complexity = 'moderate';
    // Estimate duration
    let estimatedDuration = 300; // 5 minutes base
    estimatedDuration += flowSignals.behavioralPatterns.crewCount * 120; // 2 min per crew
    estimatedDuration += hitlWorkflow.points.length * 180; // 3 min per HITL
    estimatedDuration += integrationAnalysis.points.length * 60; // 1 min per integration
    estimatedDuration += routerAnalysis.length * 30; // 30 sec per router
    // Find critical path (longest path through the flow)
    const criticalPath = findCriticalPath(pathMap);
    return {
        complexity,
        estimatedDuration,
        criticalPath,
        parallelSections: pathMap.parallelPaths.length,
        humanInteractions: hitlWorkflow.points.length,
        externalIntegrations: integrationAnalysis.points.length,
        routerDecisions: routerAnalysis.length
    };
}
/**
 * Find the critical path through the flow
 */
function findCriticalPath(pathMap) {
    if (pathMap.pathSequences.length === 0) {
        return [];
    }
    // Find the longest path by duration
    const longestPath = pathMap.pathSequences.reduce((longest, current) => current.estimatedDuration > longest.estimatedDuration ? current : longest);
    return longestPath.steps;
}
/**
 * Generate flow sections for detailed analysis
 */
function generateFlowSections(flowSignals, routerAnalysis, hitlWorkflow, integrationAnalysis) {
    const sections = [];
    // Start section
    sections.push({
        type: 'start',
        title: 'Flow Initialization',
        content: [
            `Start methods: ${flowSignals.frameworkSpecific.decorators.starts.join(', ')}`,
            `Initialization pattern: ${flowSignals.frameworkSpecific.decorators.starts.length > 1 ? 'Parallel' : 'Sequential'}`
        ],
        connections: flowSignals.frameworkSpecific.decorators.starts
    });
    // Router sections
    if (routerAnalysis.length > 0) {
        sections.push({
            type: 'decision',
            title: 'Decision Points',
            content: routerAnalysis.map(router => `${router.routerMethod}: ${router.branchingFactor} paths (${router.complexity})`),
            connections: routerAnalysis.map(r => r.routerMethod)
        });
    }
    // HITL sections
    if (hitlWorkflow.points.length > 0) {
        sections.push({
            type: 'human',
            title: 'Human Interactions',
            content: hitlWorkflow.points.map(point => `${point.method}: ${point.type} (${point.context.urgency} urgency)`),
            connections: hitlWorkflow.points.map(p => p.method)
        });
    }
    // Integration sections
    if (integrationAnalysis.points.length > 0) {
        sections.push({
            type: 'integration',
            title: 'External Integrations',
            content: integrationAnalysis.points.map(point => `${point.service}: ${point.type} (${Math.round(point.reliability.availability * 100)}% availability)`),
            connections: integrationAnalysis.points.map(p => p.service)
        });
    }
    // Process sections
    const processMethods = flowSignals.methods.filter(m => !flowSignals.frameworkSpecific.decorators.starts.includes(m.name) &&
        !routerAnalysis.some(r => r.routerMethod === m.name));
    if (processMethods.length > 0) {
        sections.push({
            type: 'process',
            title: 'Core Processing',
            content: processMethods.map(method => `${method.name}${method.isAsync ? ' (async)' : ''}`),
            connections: processMethods.map(m => m.name)
        });
    }
    return sections;
}
/**
 * Generate comprehensive flow analysis report
 */
function generateEnhancedFlowReport(flowChart, flowSignals, routerAnalysis, pathMap, hitlWorkflow, integrationAnalysis) {
    const lines = [];
    lines.push(`# ${flowChart.title} - Comprehensive Analysis`);
    lines.push('');
    lines.push(`**Description**: ${flowChart.description}`);
    lines.push('');
    // Metadata summary
    lines.push('## Flow Metadata');
    lines.push(`- **Complexity**: ${flowChart.metadata.complexity}`);
    lines.push(`- **Estimated Duration**: ${Math.round(flowChart.metadata.estimatedDuration / 60)} minutes`);
    lines.push(`- **Critical Path**: ${flowChart.metadata.criticalPath.join(' → ')}`);
    lines.push(`- **Parallel Sections**: ${flowChart.metadata.parallelSections}`);
    lines.push(`- **Human Interactions**: ${flowChart.metadata.humanInteractions}`);
    lines.push(`- **External Integrations**: ${flowChart.metadata.externalIntegrations}`);
    lines.push(`- **Router Decisions**: ${flowChart.metadata.routerDecisions}`);
    lines.push('');
    // Flow chart
    lines.push('## Enhanced Flow Chart');
    lines.push(flowChart.chart);
    lines.push('');
    // Detailed sections
    lines.push('## Flow Sections');
    for (const section of flowChart.sections) {
        lines.push(`### ${section.title} (${section.type})`);
        for (const content of section.content) {
            lines.push(`- ${content}`);
        }
        lines.push('');
    }
    // Path analysis
    if (pathMap.pathSequences.length > 0) {
        lines.push('## Execution Paths');
        const topPaths = pathMap.pathSequences
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 3);
        for (const path of topPaths) {
            lines.push(`### ${path.id} (${Math.round(path.probability * 100)}% probability)`);
            lines.push(`- **Duration**: ${Math.round(path.estimatedDuration / 60)} minutes`);
            lines.push(`- **Steps**: ${path.steps.join(' → ')}`);
            if (path.routers.length > 0) {
                lines.push('- **Router Decisions**:');
                for (const router of path.routers) {
                    lines.push(`  - ${router.routerMethod}: ${router.selectedPath}`);
                }
            }
            lines.push('');
        }
    }
    // Recommendations
    lines.push('## Recommendations');
    if (flowChart.metadata.complexity === 'advanced') {
        lines.push('- **High Complexity**: Consider breaking down into smaller, more manageable flows');
    }
    if (flowChart.metadata.humanInteractions > 5) {
        lines.push('- **Many Human Interactions**: Consider automating some approval processes');
    }
    if (flowChart.metadata.externalIntegrations > 10) {
        lines.push('- **High Integration Count**: Implement circuit breakers and monitoring');
    }
    if (flowChart.metadata.estimatedDuration > 900) {
        lines.push('- **Long Duration**: Consider parallel execution and optimization');
    }
    return lines.join('\n');
}
//# sourceMappingURL=enhanced-flow-chart-builder.js.map