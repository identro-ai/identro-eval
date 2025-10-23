/**
 * CrewAI Task Definition Extractor
 *
 * Extracts task definitions with dependencies from CrewAI projects
 * Reuses existing dimensions from discovery.ts
 */
export interface TaskDefinition {
    name: string;
    description: string;
    expectedOutput: string;
    agent?: string;
    dependencies: string[];
    tools?: string[];
    context?: string[];
}
/**
 * Extract task definitions from a file using existing dimension approach
 */
export declare function extractTaskDefinitionsFromFile(filePath: string, taskNames: string[]): Promise<TaskDefinition[]>;
/**
 * Discover all task definitions in a file (similar to agent discovery)
 */
export declare function discoverTaskDefinitions(filePath: string): Promise<TaskDefinition[]>;
/**
 * Load task definitions from standard locations (similar to agent loading)
 */
export declare function loadTaskDefinitions(projectPath: string, taskNames: string[]): Promise<TaskDefinition[]>;
/**
 * Build workflow graph from task dependencies with proper dependency analysis
 */
export declare function buildWorkflowGraph(tasks: TaskDefinition[]): {
    summary: string;
    sequence: string[];
    parallelGroups: string[][];
    dependencyChain: Array<{
        task: string;
        dependsOn: string[];
        level: number;
    }>;
};
//# sourceMappingURL=task-extractor.d.ts.map