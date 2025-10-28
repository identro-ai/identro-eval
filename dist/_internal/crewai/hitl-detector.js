"use strict";
/**
 * Human-in-the-Loop (HITL) detector for CrewAI flows
 *
 * Provides advanced detection and analysis of human interaction points,
 * approval workflows, and user input patterns in CrewAI flows.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectHITLPoints = detectHITLPoints;
exports.generateHITLReport = generateHITLReport;
/**
 * Detect and analyze human-in-the-loop points in a flow
 */
function detectHITLPoints(flowSignals, yamlConfig) {
    // Detect HITL points from multiple sources
    const methodBasedPoints = detectMethodBasedHITL(flowSignals);
    const yamlBasedPoints = detectYamlBasedHITL(yamlConfig);
    const dimensionBasedPoints = detectDimensionBasedHITL(flowSignals);
    // Combine and deduplicate
    const allPoints = [...methodBasedPoints, ...yamlBasedPoints, ...dimensionBasedPoints];
    const uniquePoints = deduplicateHITLPoints(allPoints);
    // Analyze sequences and dimensions
    const sequences = analyzeHITLSequences(uniquePoints, flowSignals);
    const patterns = identifyHITLPatterns(uniquePoints, flowSignals);
    const metrics = calculateHITLMetrics(uniquePoints, sequences);
    return {
        points: uniquePoints,
        sequences,
        patterns: patterns,
        metrics
    };
}
/**
 * Detect HITL points from method names and signatures
 */
function detectMethodBasedHITL(flowSignals) {
    const points = [];
    for (const method of flowSignals.methods) {
        const hitlIndicators = analyzeMethodForHITL(method);
        if (hitlIndicators.isHITL) {
            const point = {
                id: `method-${method.name}`,
                method: method.name,
                type: hitlIndicators.type,
                trigger: {
                    condition: hitlIndicators.condition,
                    frequency: hitlIndicators.frequency,
                    dependencies: extractMethodDependencies(method, flowSignals),
                    description: `Human interaction required in ${method.name}`
                },
                blocking: hitlIndicators.blocking,
                timeout: hitlIndicators.timeout,
                fallbackAction: hitlIndicators.fallbackAction,
                context: {
                    dataRequired: hitlIndicators.dataRequired,
                    previousSteps: findPreviousSteps(method.name, flowSignals),
                    impactedSteps: findImpactedSteps(method.name, flowSignals),
                    businessContext: inferBusinessContext(method.name),
                    urgency: hitlIndicators.urgency
                },
                userInterface: hitlIndicators.userInterface,
                validation: hitlIndicators.validation
            };
            points.push(point);
        }
    }
    return points;
}
/**
 * Analyze a method to determine if it requires human interaction
 */
function analyzeMethodForHITL(method) {
    const methodName = method.name.toLowerCase();
    const docstring = method.docstring?.toLowerCase() || '';
    // Check for HITL indicators in method name
    const hitlKeywords = [
        'human', 'user', 'manual', 'approve', 'approval', 'review', 'confirm',
        'input', 'feedback', 'decision', 'validate', 'check', 'verify'
    ];
    const isHITL = hitlKeywords.some(keyword => methodName.includes(keyword));
    if (!isHITL) {
        return {
            isHITL: false,
            type: 'input',
            condition: '',
            frequency: 'always',
            blocking: false,
            dataRequired: [],
            urgency: 'low',
            userInterface: { method: 'cli', format: 'text' },
            validation: { required: false, errorHandling: 'ignore' }
        };
    }
    // Determine HITL type
    let type = 'input';
    if (methodName.includes('approve') || methodName.includes('approval')) {
        type = 'approval';
    }
    else if (methodName.includes('review')) {
        type = 'review';
    }
    else if (methodName.includes('feedback')) {
        type = 'feedback';
    }
    else if (methodName.includes('decision')) {
        type = 'decision';
    }
    else if (methodName.includes('validate') || methodName.includes('verify')) {
        type = 'validation';
    }
    // Determine frequency
    let frequency = 'always';
    if (docstring.includes('if') || docstring.includes('when') || methodName.includes('conditional')) {
        frequency = 'conditional';
    }
    else if (methodName.includes('error') || methodName.includes('fail')) {
        frequency = 'error';
    }
    // Determine if blocking
    const blocking = !methodName.includes('optional') && !methodName.includes('async');
    // Estimate timeout
    let timeout;
    if (type === 'approval') {
        timeout = 3600; // 1 hour for approvals
    }
    else if (type === 'review') {
        timeout = 1800; // 30 minutes for reviews
    }
    else if (type === 'input') {
        timeout = 600; // 10 minutes for input
    }
    // Determine urgency
    let urgency = 'medium';
    if (methodName.includes('urgent') || methodName.includes('critical')) {
        urgency = 'critical';
    }
    else if (methodName.includes('high') || methodName.includes('priority')) {
        urgency = 'high';
    }
    else if (methodName.includes('low') || methodName.includes('optional')) {
        urgency = 'low';
    }
    // Determine user interface
    let userInterface = { method: 'cli', format: 'text' };
    if (methodName.includes('choice') || methodName.includes('select')) {
        userInterface = { method: 'cli', format: 'choice' };
    }
    else if (methodName.includes('form')) {
        userInterface = { method: 'web', format: 'form' };
    }
    else if (methodName.includes('email')) {
        userInterface = { method: 'email', format: 'text' };
    }
    else if (methodName.includes('slack')) {
        userInterface = { method: 'slack', format: 'text' };
    }
    return {
        isHITL: true,
        type,
        condition: `Human ${type} required`,
        frequency,
        blocking,
        timeout,
        fallbackAction: blocking ? 'abort' : 'continue',
        dataRequired: extractDataRequirements(method),
        urgency,
        userInterface,
        validation: {
            required: blocking,
            errorHandling: blocking ? 'retry' : 'log'
        }
    };
}
/**
 * Extract data requirements from method parameters
 */
function extractDataRequirements(method) {
    const requirements = [];
    // Analyze method parameters
    for (const param of method.parameters) {
        if (param !== 'self' && param !== 'state') {
            requirements.push(param);
        }
    }
    // Analyze method name for data hints
    const methodName = method.name.toLowerCase();
    if (methodName.includes('topic'))
        requirements.push('topic');
    if (methodName.includes('content'))
        requirements.push('content');
    if (methodName.includes('data'))
        requirements.push('data');
    if (methodName.includes('file'))
        requirements.push('file_path');
    if (methodName.includes('email'))
        requirements.push('email_address');
    return requirements;
}
/**
 * Detect HITL points from YAML configuration
 */
function detectYamlBasedHITL(yamlConfig) {
    const points = [];
    // Process existing human interaction points from YAML analysis
    for (const yamlPoint of yamlConfig.humanInteractionPoints) {
        const point = {
            id: `yaml-${yamlPoint.taskName}`,
            method: yamlPoint.taskName,
            type: yamlPoint.type,
            trigger: {
                condition: 'Task requires human input',
                frequency: 'always',
                dependencies: findTaskDependencies(yamlPoint.taskName, yamlConfig),
                description: yamlPoint.description
            },
            blocking: true,
            timeout: 1800, // 30 minutes default
            context: {
                dataRequired: extractYamlDataRequirements(yamlPoint.taskName, yamlConfig),
                previousSteps: findYamlPreviousSteps(yamlPoint.taskName, yamlConfig),
                impactedSteps: findYamlImpactedSteps(yamlPoint.taskName, yamlConfig),
                businessContext: yamlPoint.description,
                urgency: 'medium'
            },
            userInterface: {
                method: 'cli',
                format: yamlPoint.type === 'approval' ? 'choice' : 'text',
                options: yamlPoint.type === 'approval' ? ['approve', 'reject'] : undefined
            },
            validation: {
                required: true,
                errorHandling: 'retry'
            }
        };
        points.push(point);
    }
    // Analyze tasks for additional HITL dimensions
    for (const [taskName, task] of Object.entries(yamlConfig.tasks)) {
        if (task.human_input && !points.some(p => p.method === taskName)) {
            const point = {
                id: `yaml-task-${taskName}`,
                method: taskName,
                type: 'input',
                trigger: {
                    condition: 'Task configured for human input',
                    frequency: 'always',
                    dependencies: task.context || [],
                    description: `Human input required for task: ${task.description}`
                },
                blocking: true,
                timeout: 1800,
                context: {
                    dataRequired: ['user_input'],
                    previousSteps: task.context || [],
                    impactedSteps: findTaskImpactedSteps(taskName, yamlConfig),
                    businessContext: task.description,
                    urgency: 'medium'
                },
                userInterface: {
                    method: 'cli',
                    format: 'text'
                },
                validation: {
                    required: true,
                    errorHandling: 'retry'
                }
            };
            points.push(point);
        }
    }
    return points;
}
/**
 * Detect HITL points based on common dimensions
 */
function detectDimensionBasedHITL(flowSignals) {
    const points = [];
    // Dimension 1: Methods that call input() function
    if (flowSignals.behavioralPatterns.collectsUserInput) {
        points.push({
            id: 'dimension-user-input',
            method: 'user_input_collection',
            type: 'input',
            trigger: {
                condition: 'Flow collects user input',
                frequency: 'always',
                dependencies: [],
                description: 'Flow requires user input during execution'
            },
            blocking: true,
            timeout: 600,
            context: {
                dataRequired: ['user_input'],
                previousSteps: [],
                impactedSteps: [],
                businessContext: 'User input collection',
                urgency: 'medium'
            },
            userInterface: {
                method: 'cli',
                format: 'text'
            },
            validation: {
                required: true,
                errorHandling: 'retry'
            }
        });
    }
    // Dimension 2: Error handling that might require human intervention
    const errorHandlingMethods = flowSignals.methods.filter(m => m.name.toLowerCase().includes('error') ||
        m.name.toLowerCase().includes('exception') ||
        m.name.toLowerCase().includes('handle'));
    for (const method of errorHandlingMethods) {
        points.push({
            id: `dimension-error-${method.name}`,
            method: method.name,
            type: 'decision',
            trigger: {
                condition: 'Error requires human decision',
                frequency: 'error',
                dependencies: [],
                description: `Human decision required for error handling in ${method.name}`
            },
            blocking: false,
            timeout: 300,
            fallbackAction: 'continue',
            context: {
                dataRequired: ['decision'],
                previousSteps: [],
                impactedSteps: [],
                businessContext: 'Error handling',
                urgency: 'high'
            },
            userInterface: {
                method: 'cli',
                format: 'choice',
                options: ['retry', 'skip', 'abort']
            },
            validation: {
                required: false,
                errorHandling: 'continue'
            }
        });
    }
    return points;
}
/**
 * Deduplicate HITL points from different sources
 */
function deduplicateHITLPoints(points) {
    const uniquePoints = new Map();
    for (const point of points) {
        const key = `${point.method}-${point.type}`;
        if (!uniquePoints.has(key)) {
            uniquePoints.set(key, point);
        }
        else {
            // Merge information from duplicate points
            const existing = uniquePoints.get(key);
            existing.context.dataRequired = [
                ...new Set([...existing.context.dataRequired, ...point.context.dataRequired])
            ];
            existing.trigger.dependencies = [
                ...new Set([...existing.trigger.dependencies, ...point.trigger.dependencies])
            ];
        }
    }
    return Array.from(uniquePoints.values());
}
/**
 * Analyze HITL sequences in the flow
 */
function analyzeHITLSequences(points, flowSignals) {
    const sequences = [];
    // Find sequential HITL points
    const sequentialPoints = findSequentialHITLPoints(points, flowSignals);
    for (const sequence of sequentialPoints) {
        sequences.push({
            id: `seq-${sequences.length}`,
            points: sequence.map(p => p.id),
            type: 'sequential',
            totalTimeout: sequence.reduce((sum, p) => sum + (p.timeout || 0), 0),
            criticalPath: sequence.some(p => p.blocking)
        });
    }
    // Find parallel HITL points
    const parallelPoints = findParallelHITLPoints(points, flowSignals);
    for (const parallel of parallelPoints) {
        sequences.push({
            id: `par-${sequences.length}`,
            points: parallel.map(p => p.id),
            type: 'parallel',
            totalTimeout: Math.max(...parallel.map(p => p.timeout || 0)),
            criticalPath: parallel.every(p => p.blocking)
        });
    }
    return sequences;
}
/**
 * Find sequential HITL points
 */
function findSequentialHITLPoints(points, flowSignals) {
    const sequences = [];
    // Simple implementation: group points that have dependencies
    const processed = new Set();
    for (const point of points) {
        if (processed.has(point.id))
            continue;
        const sequence = [point];
        processed.add(point.id);
        // Find points that depend on this point
        let current = point;
        while (true) {
            const nextPoint = points.find(p => !processed.has(p.id) &&
                p.trigger.dependencies.includes(current.method));
            if (nextPoint) {
                sequence.push(nextPoint);
                processed.add(nextPoint.id);
                current = nextPoint;
            }
            else {
                break;
            }
        }
        if (sequence.length > 1) {
            sequences.push(sequence);
        }
    }
    return sequences;
}
/**
 * Find parallel HITL points
 */
function findParallelHITLPoints(points, flowSignals) {
    const parallelGroups = [];
    // Find points that have the same dependencies (likely parallel)
    const dependencyGroups = new Map();
    for (const point of points) {
        const depKey = point.trigger.dependencies.sort().join(',');
        if (!dependencyGroups.has(depKey)) {
            dependencyGroups.set(depKey, []);
        }
        dependencyGroups.get(depKey).push(point);
    }
    // Groups with multiple points are likely parallel
    for (const group of dependencyGroups.values()) {
        if (group.length > 1) {
            parallelGroups.push(group);
        }
    }
    return parallelGroups;
}
/**
 * Identify common HITL dimensions
 */
function identifyHITLPatterns(points, flowSignals) {
    const patterns = [];
    // Dimension: Approval workflow
    const approvalPoints = points.filter(p => p.type === 'approval');
    if (approvalPoints.length > 0) {
        patterns.push({
            name: 'Approval Workflow',
            description: 'Flow requires human approvals at key decision points',
            points: approvalPoints.map(p => p.id),
            frequency: approvalPoints.length,
            complexity: approvalPoints.length > 2 ? 'complex' : 'simple'
        });
    }
    // Dimension: Review cycle
    const reviewPoints = points.filter(p => p.type === 'review');
    if (reviewPoints.length > 0) {
        patterns.push({
            name: 'Review Cycle',
            description: 'Flow includes human review steps for quality assurance',
            points: reviewPoints.map(p => p.id),
            frequency: reviewPoints.length,
            complexity: reviewPoints.length > 1 ? 'moderate' : 'simple'
        });
    }
    // Dimension: Input collection
    const inputPoints = points.filter(p => p.type === 'input');
    if (inputPoints.length > 0) {
        patterns.push({
            name: 'Input Collection',
            description: 'Flow collects input from users at various stages',
            points: inputPoints.map(p => p.id),
            frequency: inputPoints.length,
            complexity: inputPoints.length > 3 ? 'complex' : 'simple'
        });
    }
    // Dimension: Error intervention
    const errorPoints = points.filter(p => p.trigger.frequency === 'error');
    if (errorPoints.length > 0) {
        patterns.push({
            name: 'Error Intervention',
            description: 'Flow requires human intervention when errors occur',
            points: errorPoints.map(p => p.id),
            frequency: errorPoints.length,
            complexity: 'moderate'
        });
    }
    return patterns;
}
/**
 * Calculate HITL metrics
 */
function calculateHITLMetrics(points, sequences) {
    const totalPoints = points.length;
    const blockingPoints = points.filter(p => p.blocking).length;
    const averageTimeout = points.reduce((sum, p) => sum + (p.timeout || 0), 0) / totalPoints;
    // Calculate critical path impact (percentage of flow that requires human interaction)
    const criticalPathImpact = blockingPoints / totalPoints;
    // Calculate user experience score (lower is better)
    let uxScore = 100;
    uxScore -= blockingPoints * 10; // Penalty for blocking points
    uxScore -= (averageTimeout / 60) * 2; // Penalty for long timeouts
    uxScore -= sequences.length * 5; // Penalty for complex sequences
    uxScore = Math.max(0, uxScore);
    return {
        totalPoints,
        blockingPoints,
        averageTimeout,
        criticalPathImpact,
        userExperienceScore: uxScore
    };
}
// Helper functions for dependency analysis
function extractMethodDependencies(method, flowSignals) {
    const dependencies = [];
    // Find listener that corresponds to this method
    const listener = flowSignals.frameworkSpecific.decorators.listeners.find(l => l.method === method.name);
    if (listener) {
        dependencies.push(...listener.listensTo);
    }
    return dependencies;
}
function findPreviousSteps(methodName, flowSignals) {
    const listener = flowSignals.frameworkSpecific.decorators.listeners.find(l => l.method === methodName);
    return listener ? listener.listensTo : [];
}
function findImpactedSteps(methodName, flowSignals) {
    const impacted = [];
    for (const listener of flowSignals.frameworkSpecific.decorators.listeners) {
        if (listener.listensTo.includes(methodName)) {
            impacted.push(listener.method);
        }
    }
    return impacted;
}
function inferBusinessContext(methodName) {
    const name = methodName.toLowerCase();
    if (name.includes('approve') || name.includes('approval')) {
        return 'Business approval required';
    }
    else if (name.includes('review')) {
        return 'Quality review checkpoint';
    }
    else if (name.includes('input')) {
        return 'User input collection';
    }
    else if (name.includes('decision')) {
        return 'Business decision point';
    }
    else if (name.includes('validate')) {
        return 'Validation checkpoint';
    }
    return 'Human interaction required';
}
function findTaskDependencies(taskName, yamlConfig) {
    const task = yamlConfig.tasks[taskName];
    return task ? (task.context || []) : [];
}
function extractYamlDataRequirements(taskName, yamlConfig) {
    const task = yamlConfig.tasks[taskName];
    if (!task)
        return [];
    const requirements = [];
    if (task.human_input) {
        requirements.push('user_input');
    }
    if (task.output_json) {
        requirements.push('structured_data');
    }
    if (task.output_file) {
        requirements.push('file_output');
    }
    return requirements;
}
function findYamlPreviousSteps(taskName, yamlConfig) {
    const task = yamlConfig.tasks[taskName];
    return task ? (task.context || []) : [];
}
function findYamlImpactedSteps(taskName, yamlConfig) {
    const impacted = [];
    for (const [otherTaskName, otherTask] of Object.entries(yamlConfig.tasks)) {
        if (otherTask.context && otherTask.context.includes(taskName)) {
            impacted.push(otherTaskName);
        }
    }
    return impacted;
}
function findTaskImpactedSteps(taskName, yamlConfig) {
    return findYamlImpactedSteps(taskName, yamlConfig);
}
/**
 * Generate HITL analysis report
 */
function generateHITLReport(workflow) {
    const lines = [];
    lines.push('# Human-in-the-Loop Analysis Report');
    lines.push('');
    // Summary
    lines.push('## Summary');
    lines.push(`- **Total HITL Points**: ${workflow.metrics.totalPoints}`);
    lines.push(`- **Blocking Points**: ${workflow.metrics.blockingPoints}`);
    lines.push(`- **Average Timeout**: ${Math.round(workflow.metrics.averageTimeout / 60)} minutes`);
    lines.push(`- **Critical Path Impact**: ${Math.round(workflow.metrics.criticalPathImpact * 100)}%`);
    lines.push(`- **User Experience Score**: ${Math.round(workflow.metrics.userExperienceScore)}/100`);
    lines.push('');
    // HITL Points
    lines.push('## Human Interaction Points');
    lines.push('');
    for (const point of workflow.points) {
        lines.push(`### ${point.method} (${point.type})`);
        lines.push(`- **Trigger**: ${point.trigger.description}`);
        lines.push(`- **Blocking**: ${point.blocking ? 'Yes' : 'No'}`);
        lines.push(`- **Timeout**: ${point.timeout ? Math.round(point.timeout / 60) + ' minutes' : 'None'}`);
        lines.push(`- **Urgency**: ${point.context.urgency}`);
        lines.push(`- **Interface**: ${point.userInterface.method} (${point.userInterface.format})`);
        if (point.context.dataRequired.length > 0) {
            lines.push(`- **Data Required**: ${point.context.dataRequired.join(', ')}`);
        }
        if (point.trigger.dependencies.length > 0) {
            lines.push(`- **Dependencies**: ${point.trigger.dependencies.join(', ')}`);
        }
        lines.push('');
    }
    // Dimensions
    if (workflow.patterns.length > 0) {
        lines.push('## Identified Patterns');
        lines.push('');
        for (const pattern of workflow.patterns) {
            lines.push(`### ${pattern.name} (${pattern.complexity})`);
            lines.push(`- **Description**: ${pattern.description}`);
            lines.push(`- **Frequency**: ${pattern.frequency} occurrences`);
            lines.push(`- **Points**: ${pattern.points.join(', ')}`);
            lines.push('');
        }
    }
    // Sequences
    if (workflow.sequences.length > 0) {
        lines.push('## HITL Sequences');
        lines.push('');
        for (const sequence of workflow.sequences) {
            lines.push(`### ${sequence.id} (${sequence.type})`);
            lines.push(`- **Total Timeout**: ${Math.round(sequence.totalTimeout / 60)} minutes`);
            lines.push(`- **Critical Path**: ${sequence.criticalPath ? 'Yes' : 'No'}`);
            lines.push(`- **Points**: ${sequence.points.join(' → ')}`);
            lines.push('');
        }
    }
    // Recommendations
    lines.push('## Recommendations');
    lines.push('');
    if (workflow.metrics.blockingPoints > 3) {
        lines.push('- **High blocking point count**: Consider making some interactions non-blocking or optional');
    }
    if (workflow.metrics.averageTimeout > 1800) {
        lines.push('- **Long timeouts**: Consider reducing timeout values or providing better fallback actions');
    }
    if (workflow.metrics.userExperienceScore < 50) {
        lines.push('- **Poor user experience**: Simplify human interactions and reduce blocking points');
    }
    if (workflow.sequences.some(s => s.type === 'sequential' && s.points.length > 3)) {
        lines.push('- **Long sequential chains**: Consider parallelizing some human interactions');
    }
    return lines.join('\n');
}
//# sourceMappingURL=hitl-detector.js.map