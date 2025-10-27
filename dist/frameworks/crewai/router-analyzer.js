/**
 * Router logic analyzer for CrewAI flows
 *
 * Provides advanced analysis of router methods, conditional paths,
 * and branching logic in CrewAI flows.
 */
/**
 * Analyze router logic in a flow
 */
export function analyzeRouterLogic(flowSignals, yamlConfig) {
    const analyses = [];
    for (const router of flowSignals.frameworkSpecific.decorators.routers) {
        const analysis = analyzeIndividualRouter(router, flowSignals, yamlConfig);
        analyses.push(analysis);
    }
    return analyses;
}
/**
 * Analyze an individual router method
 */
function analyzeIndividualRouter(router, flowSignals, yamlConfig) {
    const paths = extractRouterPaths(router, flowSignals);
    const complexity = determineRouterComplexity(paths, router.conditions);
    const dependencies = extractRouterDependencies(router, flowSignals);
    return {
        routerMethod: router.method,
        paths,
        defaultPath: findDefaultPath(paths),
        complexity,
        branchingFactor: paths.length,
        hasErrorHandling: hasErrorHandlingPath(paths),
        dependencies
    };
}
/**
 * Extract router paths with conditions and targets
 */
function extractRouterPaths(router, flowSignals) {
    const paths = [];
    // Combine labels and conditions
    for (let i = 0; i < router.labels.length; i++) {
        const label = router.labels[i];
        const condition = router.conditions[i] || 'default';
        // Find target method for this path
        const targetMethod = findTargetMethodForPath(label, flowSignals);
        // Estimate probability based on condition complexity
        const probability = estimatePathProbability(condition, router.conditions);
        paths.push({
            label,
            condition,
            targetMethod,
            probability,
            description: generatePathDescription(label, condition, targetMethod)
        });
    }
    return paths;
}
/**
 * Find the target method that listens to a router path
 */
function findTargetMethodForPath(label, flowSignals) {
    // Look for listener methods that depend on this router path
    for (const listener of flowSignals.frameworkSpecific.decorators.listeners) {
        // Check if this listener depends on the router method
        // This is a simplified implementation - in reality, we'd need to parse
        // the @listen decorator arguments more carefully
        if (listener.listensTo.some(target => target.includes(label))) {
            return listener.method;
        }
    }
    return undefined;
}
/**
 * Estimate probability of taking a specific path
 */
function estimatePathProbability(condition, allConditions) {
    // Don't make up probabilities - return undefined to indicate unknown
    return undefined;
}
/**
 * Generate human-readable description for a path
 */
function generatePathDescription(label, condition, targetMethod) {
    let description = `Path '${label}'`;
    if (condition !== 'default') {
        description += ` when ${condition}`;
    }
    if (targetMethod) {
        description += ` → leads to ${targetMethod}`;
    }
    return description;
}
/**
 * Determine router complexity based on paths and conditions
 */
function determineRouterComplexity(paths, conditions) {
    if (paths.length <= 2) {
        return 'simple';
    }
    if (paths.length <= 4 && conditions.every(c => c.length < 50)) {
        return 'moderate';
    }
    return 'complex';
}
/**
 * Find default path in router paths
 */
function findDefaultPath(paths) {
    const defaultPath = paths.find(p => p.condition.includes('default') ||
        p.condition.includes('else') ||
        p.label.toLowerCase().includes('default'));
    return defaultPath?.label;
}
/**
 * Check if router has error handling paths
 */
function hasErrorHandlingPath(paths) {
    return paths.some(p => p.label.toLowerCase().includes('error') ||
        p.label.toLowerCase().includes('fail') ||
        p.condition.toLowerCase().includes('error') ||
        p.condition.toLowerCase().includes('exception'));
}
/**
 * Extract router dependencies
 */
function extractRouterDependencies(router, flowSignals) {
    const dependencies = [];
    // Find methods that this router depends on
    for (const listener of flowSignals.frameworkSpecific.decorators.listeners) {
        if (listener.method === router.method) {
            dependencies.push(...listener.listensTo);
        }
    }
    return dependencies;
}
/**
 * Build complete flow path map
 */
export function buildFlowPathMap(flowSignals, routerAnalyses) {
    const startMethods = flowSignals.frameworkSpecific.decorators.starts;
    const pathSequences = generatePathSequences(flowSignals, routerAnalyses);
    const parallelPaths = extractParallelPaths(flowSignals);
    const convergencePoints = findConvergencePoints(flowSignals);
    const endMethods = findEndMethods(flowSignals);
    return {
        startMethods,
        pathSequences,
        parallelPaths,
        convergencePoints,
        endMethods
    };
}
/**
 * Generate all possible path sequences through the flow
 */
function generatePathSequences(flowSignals, routerAnalyses) {
    const sequences = [];
    // Start from each start method
    for (const startMethod of flowSignals.frameworkSpecific.decorators.starts) {
        const pathsFromStart = tracePathsFromMethod(startMethod, flowSignals, routerAnalyses);
        sequences.push(...pathsFromStart);
    }
    return sequences;
}
/**
 * Trace all possible paths from a given method
 */
function tracePathsFromMethod(startMethod, flowSignals, routerAnalyses, visited = new Set(), currentPath = []) {
    if (visited.has(startMethod)) {
        // Avoid infinite loops
        return [];
    }
    visited.add(startMethod);
    currentPath.push(startMethod);
    const sequences = [];
    // Find next methods that listen to this method
    const nextMethods = findNextMethods(startMethod, flowSignals);
    if (nextMethods.length === 0) {
        // End of path
        sequences.push({
            id: `path-${sequences.length}`,
            steps: [...currentPath],
            routers: extractRoutersInPath(currentPath, routerAnalyses),
            estimatedDuration: estimatePathDuration(currentPath, flowSignals),
            probability: calculatePathProbability(currentPath, routerAnalyses)
        });
    }
    else {
        // Continue tracing from next methods
        for (const nextMethod of nextMethods) {
            const subPaths = tracePathsFromMethod(nextMethod, flowSignals, routerAnalyses, new Set(visited), [...currentPath]);
            sequences.push(...subPaths);
        }
    }
    return sequences;
}
/**
 * Find methods that listen to a given method
 */
function findNextMethods(method, flowSignals) {
    const nextMethods = [];
    for (const listener of flowSignals.frameworkSpecific.decorators.listeners) {
        if (listener.listensTo.includes(method)) {
            nextMethods.push(listener.method);
        }
    }
    return nextMethods;
}
/**
 * Extract routers that appear in a path
 */
function extractRoutersInPath(path, routerAnalyses) {
    const routers = [];
    for (const step of path) {
        const routerAnalysis = routerAnalyses.find(r => r.routerMethod === step);
        if (routerAnalysis) {
            // For now, assume the most probable path is taken
            const mostProbablePath = routerAnalysis.paths.reduce((max, path) => path.probability && (!max.probability || path.probability > max.probability) ? path : max);
            routers.push({
                routerMethod: step,
                selectedPath: mostProbablePath.label,
                condition: mostProbablePath.condition
            });
        }
    }
    return routers;
}
/**
 * Estimate duration for a path
 */
function estimatePathDuration(path, flowSignals) {
    let duration = 0;
    for (const step of path) {
        // Base duration per step
        duration += 30; // 30 seconds base
        // Add extra time for crew execution
        if (flowSignals.externalInteractions.crews.length > 0) {
            duration += 120; // 2 minutes for crew execution
        }
        // Add extra time for human interaction
        const method = flowSignals.methods.find(m => m.name === step);
        if (method && (method.name.includes('human') || method.name.includes('approval'))) {
            duration += 180; // 3 minutes for human interaction
        }
    }
    return duration;
}
/**
 * Calculate probability of a path being taken
 */
function calculatePathProbability(path, routerAnalyses) {
    let probability = 1.0;
    for (const step of path) {
        const routerAnalysis = routerAnalyses.find(r => r.routerMethod === step);
        if (routerAnalysis) {
            // Multiply by the probability of the most likely path
            const mostProbablePath = routerAnalysis.paths.reduce((max, path) => path.probability && (!max.probability || path.probability > max.probability) ? path : max);
            if (mostProbablePath.probability) {
                probability *= mostProbablePath.probability;
            }
        }
    }
    return probability;
}
/**
 * Extract parallel execution paths
 */
function extractParallelPaths(flowSignals) {
    const parallelPaths = [];
    // Look for methods that trigger parallel execution
    for (const listener of flowSignals.frameworkSpecific.decorators.listeners) {
        if (listener.combinator === 'or_') {
            // OR combinator suggests parallel paths that can converge
            const parallelMethods = listener.listensTo;
            const convergenceMethod = listener.method;
            // Find the trigger method (method that starts the parallel execution)
            const triggerMethod = findCommonTrigger(parallelMethods, flowSignals);
            if (triggerMethod) {
                parallelPaths.push({
                    triggerMethod,
                    parallelMethods,
                    convergenceMethod,
                    synchronizationType: 'or_'
                });
            }
        }
        else if (listener.combinator === 'and_') {
            // AND combinator suggests parallel paths that must all complete
            const parallelMethods = listener.listensTo;
            const convergenceMethod = listener.method;
            const triggerMethod = findCommonTrigger(parallelMethods, flowSignals);
            if (triggerMethod) {
                parallelPaths.push({
                    triggerMethod,
                    parallelMethods,
                    convergenceMethod,
                    synchronizationType: 'and_'
                });
            }
        }
    }
    return parallelPaths;
}
/**
 * Find common trigger method for parallel paths
 */
function findCommonTrigger(parallelMethods, flowSignals) {
    // Look for a method that all parallel methods depend on
    const triggers = new Set();
    for (const method of parallelMethods) {
        const listener = flowSignals.frameworkSpecific.decorators.listeners.find(l => l.method === method);
        if (listener) {
            listener.listensTo.forEach(trigger => triggers.add(trigger));
        }
    }
    // Find the most common trigger
    const triggerCounts = new Map();
    for (const trigger of triggers) {
        let count = 0;
        for (const method of parallelMethods) {
            const listener = flowSignals.frameworkSpecific.decorators.listeners.find(l => l.method === method);
            if (listener && listener.listensTo.includes(trigger)) {
                count++;
            }
        }
        triggerCounts.set(trigger, count);
    }
    // Return the trigger that appears most frequently
    let maxCount = 0;
    let bestTrigger;
    for (const [trigger, count] of triggerCounts) {
        if (count > maxCount) {
            maxCount = count;
            bestTrigger = trigger;
        }
    }
    return bestTrigger;
}
/**
 * Find convergence points in the flow
 */
function findConvergencePoints(flowSignals) {
    const convergencePoints = [];
    for (const listener of flowSignals.frameworkSpecific.decorators.listeners) {
        if (listener.listensTo.length > 1) {
            // Methods that listen to multiple other methods are convergence points
            convergencePoints.push(listener.method);
        }
    }
    return convergencePoints;
}
/**
 * Find end methods (methods that no other method listens to)
 */
function findEndMethods(flowSignals) {
    const allMethods = flowSignals.methods.map(m => m.name);
    const listenedToMethods = new Set();
    // Collect all methods that are listened to
    for (const listener of flowSignals.frameworkSpecific.decorators.listeners) {
        listener.listensTo.forEach(method => listenedToMethods.add(method));
    }
    // Methods that are not listened to by any other method are end methods
    return allMethods.filter(method => !listenedToMethods.has(method));
}
/**
 * Generate comprehensive flow analysis report
 */
export function generateFlowAnalysisReport(flowSignals, routerAnalyses, pathMap) {
    const lines = [];
    lines.push(`# Flow Analysis Report: ${flowSignals.className}`);
    lines.push('');
    // Router Analysis
    lines.push('## Router Analysis');
    lines.push('');
    for (const router of routerAnalyses) {
        lines.push(`### ${router.routerMethod} (${router.complexity})`);
        lines.push(`- **Branching Factor**: ${router.branchingFactor}`);
        lines.push(`- **Error Handling**: ${router.hasErrorHandling ? 'Yes' : 'No'}`);
        lines.push(`- **Dependencies**: ${router.dependencies.join(', ') || 'None'}`);
        lines.push('');
        lines.push('**Paths**:');
        for (const path of router.paths) {
            lines.push(`- ${path.description} (${Math.round((path.probability || 0) * 100)}% probability)`);
        }
        lines.push('');
    }
    // Path Sequences
    lines.push('## Execution Paths');
    lines.push('');
    const sortedPaths = pathMap.pathSequences.sort((a, b) => b.probability - a.probability);
    for (const path of sortedPaths.slice(0, 5)) { // Show top 5 most probable paths
        lines.push(`### ${path.id} (${Math.round(path.probability * 100)}% probability)`);
        lines.push(`**Duration**: ~${Math.round(path.estimatedDuration / 60)} minutes`);
        lines.push(`**Steps**: ${path.steps.join(' → ')}`);
        if (path.routers.length > 0) {
            lines.push('**Router Decisions**:');
            for (const router of path.routers) {
                lines.push(`- ${router.routerMethod}: ${router.selectedPath} (${router.condition})`);
            }
        }
        lines.push('');
    }
    // Parallel Paths
    if (pathMap.parallelPaths.length > 0) {
        lines.push('## Parallel Execution');
        lines.push('');
        for (const parallel of pathMap.parallelPaths) {
            lines.push(`### Triggered by: ${parallel.triggerMethod}`);
            lines.push(`**Parallel Methods**: ${parallel.parallelMethods.join(', ')}`);
            lines.push(`**Synchronization**: ${parallel.synchronizationType === 'and_' ? 'All must complete' : 'Any can complete'}`);
            if (parallel.convergenceMethod) {
                lines.push(`**Converges at**: ${parallel.convergenceMethod}`);
            }
            lines.push('');
        }
    }
    // Summary
    lines.push('## Summary');
    lines.push(`- **Start Methods**: ${pathMap.startMethods.join(', ')}`);
    lines.push(`- **End Methods**: ${pathMap.endMethods.join(', ')}`);
    lines.push(`- **Convergence Points**: ${pathMap.convergencePoints.join(', ')}`);
    lines.push(`- **Total Paths**: ${pathMap.pathSequences.length}`);
    lines.push(`- **Parallel Sections**: ${pathMap.parallelPaths.length}`);
    return lines.join('\n');
}
//# sourceMappingURL=router-analyzer.js.map