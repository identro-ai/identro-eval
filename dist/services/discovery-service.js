/**
 * Discovery Service - Unified agent and team discovery logic
 *
 * Extracts discovery functionality from interactive mode to be shared
 * between interactive and standalone commands.
 */
import * as path from 'path';
import * as fs from 'fs-extra';
import { getEvaluationEngine } from './evaluation-engine';
import { loadConfig } from '../utils/config';
export class DiscoveryService {
    /**
     * Discover all agents and teams in a project
     */
    async discoverAll(options) {
        const { projectPath, framework, includeTeams = true, initializeDimensions = true, initializeConfig = true } = options;
        // Initialize .identro directory and config file if needed
        if (initializeConfig) {
            await this.initializeIdentroDirectory(projectPath);
        }
        // Initialize dimension files if needed
        if (initializeDimensions) {
            await this.initializeDimensions(projectPath);
        }
        // Load config and initialize engine
        const configPath = path.join(projectPath, '.identro', 'eval.config.yml');
        const config = await loadConfig(configPath);
        const engine = getEvaluationEngine();
        await engine.initialize(config);
        // Detect framework
        let detectedFramework = framework;
        if (!detectedFramework) {
            const detected = await engine.detectFramework(projectPath);
            detectedFramework = detected || undefined;
            if (!detectedFramework) {
                throw new Error('No supported framework detected. Please specify framework manually or ensure your project uses LangChain, CrewAI, or another supported framework.');
            }
        }
        // Discover agents
        const discovery = await engine.discoverAgents(projectPath, detectedFramework);
        const agents = discovery.agents;
        // Discover teams/crews if requested
        let teams = [];
        if (includeTeams) {
            teams = await this.discoverTeams(projectPath, detectedFramework);
        }
        return {
            framework: detectedFramework,
            agents,
            teams,
            projectPath
        };
    }
    /**
     * Initialize .identro directory and config file
     */
    async initializeIdentroDirectory(projectPath) {
        const configPath = path.join(projectPath, '.identro', 'eval.config.yml');
        if (!await fs.pathExists(configPath)) {
            const { initializeIdentroDirectory } = await import('../utils/templates');
            await initializeIdentroDirectory(projectPath);
        }
    }
    /**
     * Initialize dimension files
     */
    async initializeDimensions(projectPath) {
        const { DefaultDimensionRegistry } = await import('@identro/eval-core');
        const dimensionRegistry = new DefaultDimensionRegistry();
        await dimensionRegistry.loadDimensionDefinitions(projectPath);
    }
    /**
     * Discover teams/crews with enhanced structure analysis
     */
    async discoverTeams(projectPath, framework) {
        let teams = [];
        try {
            if (framework === 'crewai') {
                // Try enhanced team discovery first
                try {
                    const { discoverTeamsWithDetails } = await import('@identro/eval-crewai');
                    const teamDiscoveryResult = await discoverTeamsWithDetails(projectPath);
                    teams = teamDiscoveryResult.teams;
                }
                catch (enhancedError) {
                    console.warn('Enhanced team discovery not available, using basic discovery:', enhancedError);
                    // Fallback to basic team discovery
                    const { CrewAIAdapter } = await import('@identro/eval-crewai');
                    const adapter = new CrewAIAdapter();
                    teams = await adapter.discoverTeams(projectPath);
                }
            }
        }
        catch (error) {
            console.warn('Team discovery failed:', error);
            // Return empty array instead of throwing
        }
        return teams;
    }
    /**
     * Get discovery summary for display
     */
    getDiscoverySummary(result) {
        return {
            framework: result.framework,
            agentCount: result.agents.length,
            teamCount: result.teams.length,
            totalEntities: result.agents.length + result.teams.length
        };
    }
    /**
     * Format agents for display
     */
    formatAgentsForDisplay(agents, framework) {
        return agents.map(agent => ({
            name: agent.name,
            type: agent.type || 'general',
            framework,
            path: agent.path ? path.relative(process.cwd(), agent.path) : undefined
        }));
    }
    /**
     * Format teams for display
     */
    formatTeamsForDisplay(teams) {
        return teams.map(team => ({
            name: team.name,
            type: team.type || 'crew',
            description: team.contract?.description || 'No description',
            memberCount: team.composition?.memberCount || 0,
            process: team.composition?.process || 'unknown',
            capabilities: team.contract?.capabilities || []
        }));
    }
}
//# sourceMappingURL=discovery-service.js.map