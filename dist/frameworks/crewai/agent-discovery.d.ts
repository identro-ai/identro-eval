/**
 * CrewAI agent discovery module
 *
 * Discovers CrewAI agents in a project and analyzes their structure.
 * Focuses on single agent evaluation (crew evaluation is TODO for future phases).
 */
import { AgentInfo } from '@identro/eval-core';
/**
 * Discovered agent interface
 */
export interface DiscoveredAgent extends AgentInfo {
    role?: string;
    goal?: string;
    backstory?: string;
    tools?: string[];
    llm?: string;
    maxIter?: number;
    allowDelegation?: boolean;
    verbose?: boolean;
}
/**
 * Discover all CrewAI agents in a project
 */
export declare function discoverAgents(projectPath: string): Promise<DiscoveredAgent[]>;
/**
 * Discover agents with detailed information
 */
export declare function discoverAgentsWithDetails(projectPath: string): Promise<{
    agents: DiscoveredAgent[];
    stats: {
        totalFiles: number;
        filesWithAgents: number;
        totalAgents: number;
        agentTypes: Record<string, number>;
    };
}>;
/**
 * Analyze a specific agent file
 */
export declare function analyzeAgentFile(filePath: string): Promise<{
    agents: DiscoveredAgent[];
    imports: string[];
    tools: string[];
    hasCrews: boolean;
    hasTasks: boolean;
}>;
/**
 * Get agent dependencies (tasks, tools, other agents)
 * TODO: This will be expanded when we implement crew evaluation
 */
export declare function getAgentDependencies(agent: DiscoveredAgent, projectPath: string): Promise<{
    tasks: string[];
    tools: string[];
    delegatesTo: string[];
}>;
//# sourceMappingURL=agent-discovery.d.ts.map