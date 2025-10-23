/**
 * Discovery Service - Unified agent and team discovery logic
 *
 * Extracts discovery functionality from interactive mode to be shared
 * between interactive and standalone commands.
 */
export interface DiscoveryResult {
    framework: string;
    agents: any[];
    teams: any[];
    projectPath: string;
}
export interface DiscoveryOptions {
    projectPath: string;
    framework?: string;
    includeTeams?: boolean;
    initializeDimensions?: boolean;
    initializeConfig?: boolean;
}
export declare class DiscoveryService {
    /**
     * Discover all agents and teams in a project
     */
    discoverAll(options: DiscoveryOptions): Promise<DiscoveryResult>;
    /**
     * Initialize .identro directory and config file
     */
    private initializeIdentroDirectory;
    /**
     * Initialize dimension files
     */
    initializeDimensions(projectPath: string): Promise<void>;
    /**
     * Discover teams/crews with enhanced structure analysis
     */
    private discoverTeams;
    /**
     * Get discovery summary for display
     */
    getDiscoverySummary(result: DiscoveryResult): {
        framework: string;
        agentCount: number;
        teamCount: number;
        totalEntities: number;
    };
    /**
     * Format agents for display
     */
    formatAgentsForDisplay(agents: any[], framework: string): {
        name: any;
        type: any;
        framework: string;
        path: string | undefined;
    }[];
    /**
     * Format teams for display
     */
    formatTeamsForDisplay(teams: any[]): {
        name: any;
        type: any;
        description: any;
        memberCount: any;
        process: any;
        capabilities: any;
    }[];
}
//# sourceMappingURL=discovery-service.d.ts.map