/**
 * CrewAI Task Definition Extractor
 *
 * Extracts task definitions with dependencies from CrewAI projects
 * Reuses existing dimensions from discovery.ts
 */
import * as fs from 'fs/promises';
import * as path from 'path';
/**
 * Extract task definitions from a file using existing dimension approach
 */
export async function extractTaskDefinitionsFromFile(filePath, taskNames) {
    const content = await fs.readFile(filePath, 'utf-8');
    const tasks = [];
    for (const taskName of taskNames) {
        // Find the task assignment
        const taskStart = content.indexOf(`${taskName} = Task(`);
        if (taskStart === -1)
            continue;
        // Find the matching closing parenthesis
        const openParenIndex = content.indexOf('(', taskStart);
        let parenCount = 1;
        let currentIndex = openParenIndex + 1;
        while (parenCount > 0 && currentIndex < content.length) {
            const char = content[currentIndex];
            if (char === '(')
                parenCount++;
            else if (char === ')')
                parenCount--;
            currentIndex++;
        }
        if (parenCount === 0) {
            const taskConfig = content.substring(openParenIndex + 1, currentIndex - 1);
            tasks.push({
                name: taskName,
                description: extractTaskProperty(taskConfig, 'description') || 'No description provided',
                expectedOutput: extractTaskProperty(taskConfig, 'expected_output') || 'No expected output specified',
                agent: extractTaskProperty(taskConfig, 'agent'),
                dependencies: extractTaskDependencies(taskConfig),
                tools: extractTaskTools(taskConfig),
                context: extractTaskContext(taskConfig)
            });
        }
    }
    return tasks;
}
/**
 * Extract a string property from task configuration (reuses agent extraction pattern)
 */
function extractTaskProperty(config, property) {
    // Handle both single and double quotes, multiline strings (same as agent extractor)
    const dimensions = [
        new RegExp(`${property}\\s*=\\s*"""([\\s\\S]*?)"""`, 'g'),
        new RegExp(`${property}\\s*=\\s*'''([\\s\\S]*?)'''`, 'g'),
        new RegExp(`${property}\\s*=\\s*"([^"]*)"`, 'g'),
        new RegExp(`${property}\\s*=\\s*'([^']*)'`, 'g'),
        // Handle variable references (like agent=research_agent)
        new RegExp(`${property}\\s*=\\s*([\\w_]+)`, 'g')
    ];
    for (const dimension of dimensions) {
        const match = dimension.exec(config);
        if (match) {
            return match[1].trim();
        }
    }
    return undefined;
}
/**
 * Extract task dependencies (context tasks)
 */
function extractTaskDependencies(config) {
    const contextMatch = config.match(/context\s*=\s*\[([^\]]*)\]/);
    if (!contextMatch)
        return [];
    const contextString = contextMatch[1];
    const dependencies = [];
    // Extract task variable names (more specific dimension)
    const taskDimension = /(\w+_task|\w+Task)/g;
    let match;
    while ((match = taskDimension.exec(contextString)) !== null) {
        const taskName = match[1];
        if (taskName && !dependencies.includes(taskName)) {
            dependencies.push(taskName);
        }
    }
    return dependencies;
}
/**
 * Extract tools from task configuration
 */
function extractTaskTools(config) {
    const toolsMatch = config.match(/tools\s*=\s*\[([^\]]*)\]/);
    if (!toolsMatch)
        return [];
    const toolsString = toolsMatch[1];
    const tools = [];
    // Extract tool names (same dimension as agent tools)
    const toolDimension = /(\w+(?:_tool)?|\w+\(\))/g;
    let match;
    while ((match = toolDimension.exec(toolsString)) !== null) {
        const toolName = match[1].replace(/\(\)$/, ''); // Remove () if present
        if (toolName && !tools.includes(toolName)) {
            tools.push(toolName);
        }
    }
    return tools;
}
/**
 * Extract context references from task configuration
 */
function extractTaskContext(config) {
    return extractTaskDependencies(config); // Same as dependencies for now
}
/**
 * Discover all task definitions in a file (similar to agent discovery)
 */
export async function discoverTaskDefinitions(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const tasks = [];
    // Find all task variable assignments (same dimension as agent discovery)
    const taskDimension = /(\w+)\s*=\s*Task\s*\(/g;
    let match;
    while ((match = taskDimension.exec(content)) !== null) {
        const taskName = match[1];
        const taskDefinitions = await extractTaskDefinitionsFromFile(filePath, [taskName]);
        tasks.push(...taskDefinitions);
    }
    return tasks;
}
/**
 * Load task definitions from standard locations (similar to agent loading)
 */
export async function loadTaskDefinitions(projectPath, taskNames) {
    const possibleFiles = [
        path.join(projectPath, 'tasks.py'),
        path.join(projectPath, 'src', 'tasks.py'),
        path.join(projectPath, 'crew', 'tasks.py')
    ];
    for (const filePath of possibleFiles) {
        try {
            await fs.access(filePath);
            return await extractTaskDefinitionsFromFile(filePath, taskNames);
        }
        catch (error) {
            // File doesn't exist, try next location
            continue;
        }
    }
    // If no dedicated tasks file found, return empty array
    return [];
}
/**
 * Build workflow graph from task dependencies with proper dependency analysis
 */
export function buildWorkflowGraph(tasks) {
    const taskMap = new Map(tasks.map(t => [t.name, t]));
    const dependencyChain = [];
    // Build dependency levels
    const visited = new Set();
    const levels = new Map();
    function calculateLevel(taskName) {
        if (levels.has(taskName)) {
            return levels.get(taskName);
        }
        const task = taskMap.get(taskName);
        if (!task || task.dependencies.length === 0) {
            levels.set(taskName, 0);
            return 0;
        }
        const maxDepLevel = Math.max(...task.dependencies.map(dep => calculateLevel(dep)));
        const level = maxDepLevel + 1;
        levels.set(taskName, level);
        return level;
    }
    // Calculate levels for all tasks
    tasks.forEach(task => {
        const level = calculateLevel(task.name);
        dependencyChain.push({
            task: task.name,
            dependsOn: task.dependencies,
            level
        });
    });
    // Sort by dependency level
    dependencyChain.sort((a, b) => a.level - b.level);
    // Build sequence and parallel groups
    const sequence = [];
    const parallelGroups = [];
    const levelGroups = new Map();
    // Group tasks by level
    dependencyChain.forEach(({ task, level }) => {
        if (!levelGroups.has(level)) {
            levelGroups.set(level, []);
        }
        levelGroups.get(level).push(task);
    });
    // Build workflow description
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    const workflowParts = [];
    sortedLevels.forEach(level => {
        const tasksAtLevel = levelGroups.get(level);
        if (tasksAtLevel.length === 1) {
            sequence.push(tasksAtLevel[0]);
            workflowParts.push(tasksAtLevel[0]);
        }
        else {
            parallelGroups.push(tasksAtLevel);
            workflowParts.push(`[${tasksAtLevel.join(' || ')}]`);
        }
    });
    const summary = workflowParts.join(' → ');
    return {
        summary,
        sequence,
        parallelGroups,
        dependencyChain
    };
}
//# sourceMappingURL=task-extractor.js.map