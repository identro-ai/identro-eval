/**
 * CrewAI team/crew discovery module
 *
 * Discovers ONLY traditional CrewAI crews and teams.
 * Flows are handled by enhanced-workflow-discovery.ts
 *
 * Enhanced with AST parsing, behavioral analysis, and rich context.
 */
import { TeamEntity, TeamDiscoveryResult } from '@identro/eval-core';
/**
 * Discover traditional CrewAI crews/teams ONLY (no flows)
 */
export declare function discoverTeams(projectPath: string): Promise<TeamEntity[]>;
/**
 * Discover teams with detailed information
 */
export declare function discoverTeamsWithDetails(projectPath: string): Promise<TeamDiscoveryResult>;
/**
 * Analyze a specific team file
 */
export declare function analyzeTeamFile(filePath: string): Promise<{
    teams: TeamEntity[];
    imports: string[];
    hasAgents: boolean;
    hasTasks: boolean;
}>;
//# sourceMappingURL=team-discovery.d.ts.map