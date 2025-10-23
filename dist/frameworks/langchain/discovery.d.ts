/**
 * LangChain agent discovery module
 *
 * This module discovers and catalogs all LangChain agents in a project.
 * It uses AST parsing and pattern matching to identify:
 * - Agent class definitions
 * - Chain instantiations
 * - Agent factory function calls
 * - Tool-using agents
 */
import { AgentInfo } from '@identro/eval-core';
/**
 * Discovered agent with additional metadata
 */
export interface DiscoveredAgent {
    id: string;
    name: string;
    type: AgentInfo['type'];
    path: string;
    framework: AgentInfo['framework'];
    description?: string;
    metadata?: Record<string, any>;
    dependencies?: string[];
    language: 'python' | 'typescript' | 'javascript';
    lineNumber?: number;
    className?: string;
    functionName?: string;
    variableName?: string;
    imports?: string[];
    tools?: string[];
}
/**
 * Main discovery function that finds all LangChain agents in a project
 *
 * @param projectPath - Root directory of the project
 * @returns Array of discovered agents
 */
export declare function discoverAgents(projectPath: string): Promise<AgentInfo[]>;
/**
 * Discovers agents with detailed metadata
 *
 * @param projectPath - Root directory of the project
 * @returns Array of discovered agents with full metadata
 */
export declare function discoverAgentsWithDetails(projectPath: string): Promise<DiscoveredAgent[]>;
//# sourceMappingURL=discovery.d.ts.map