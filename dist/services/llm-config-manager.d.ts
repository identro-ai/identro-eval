/**
 * LLM Configuration Manager
 *
 * Handles dynamic discovery of LLM configurations and updating eval.config.yml
 */
export declare class LLMConfigManager {
    /**
     * Discover and configure LLM for the project
     */
    discoverAndConfigure(projectPath: string, options?: {
        interactive?: boolean;
        force?: boolean;
    }): Promise<any>;
    /**
     * Get current LLM configuration
     */
    getCurrentConfig(projectPath: string): Promise<any>;
    /**
     * Check if LLM is configured
     */
    isConfigured(projectPath: string): Promise<boolean>;
    /**
     * Reset LLM configuration (force rediscovery)
     */
    resetConfig(projectPath: string): Promise<any>;
}
export declare const llmConfigManager: LLMConfigManager;
//# sourceMappingURL=llm-config-manager.d.ts.map