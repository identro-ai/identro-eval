/**
 * YAML configuration analyzer for CrewAI flows
 *
 * Analyzes agents.yaml and tasks.yaml files to extract structured
 * configuration data for flow testing.
 */
export interface YamlAgentConfig {
    role: string;
    goal: string;
    backstory: string;
    tools?: string[];
    llm?: string;
    max_iter?: number;
    max_execution_time?: number;
    verbose?: boolean;
    allow_delegation?: boolean;
    step_callback?: string;
    system_template?: string;
    prompt_template?: string;
    response_template?: string;
}
export interface YamlTaskConfig {
    description: string;
    expected_output: string;
    agent?: string;
    tools?: string[];
    async_execution?: boolean;
    context?: string[];
    output_json?: any;
    output_pydantic?: string;
    output_file?: string;
    callback?: string;
    human_input?: boolean;
}
export interface YamlCrewConfig {
    agents: string[];
    tasks: string[];
    process?: 'sequential' | 'hierarchical';
    verbose?: boolean;
    memory?: boolean;
    cache?: boolean;
    max_rpm?: number;
    language?: string;
    full_output?: boolean;
    step_callback?: string;
    task_callback?: string;
    share_crew?: boolean;
    manager_llm?: string;
    manager_agent?: string;
    function_calling_llm?: string;
    config?: Record<string, any>;
    planning?: boolean;
}
export interface YamlAnalysisResult {
    agents: Record<string, YamlAgentConfig>;
    tasks: Record<string, YamlTaskConfig>;
    crews: Record<string, YamlCrewConfig>;
    dependencies: {
        agentTaskMappings: Record<string, string[]>;
        taskDependencies: Record<string, string[]>;
        crewCompositions: Record<string, {
            agents: string[];
            tasks: string[];
        }>;
    };
    humanInteractionPoints: {
        taskName: string;
        type: 'input' | 'approval' | 'review';
        description: string;
    }[];
    externalIntegrations: {
        tools: string[];
        llmProviders: string[];
        callbacks: string[];
    };
}
/**
 * Analyze YAML configuration files in a project
 */
export declare function analyzeYamlConfigs(projectPath: string): Promise<YamlAnalysisResult>;
/**
 * Generate workflow graph from YAML configurations
 */
export declare function generateWorkflowGraph(agents: Record<string, YamlAgentConfig>, tasks: Record<string, YamlTaskConfig>, crews: Record<string, YamlCrewConfig>): string;
/**
 * Validate YAML configuration consistency
 */
export declare function validateYamlConsistency(result: YamlAnalysisResult): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
//# sourceMappingURL=yaml-analyzer.d.ts.map