/**
 * LLM Discovery Service
 *
 * Automatically discovers LLM configurations from:
 * - Environment variables
 * - Configuration files
 * - Code analysis
 * - Local model servers
 */
/**
 * GPT-5 Models
 */
export declare const GPT5_MODELS: {
    id: string;
    name: string;
    description: string;
    apiAlias: string;
}[];
export declare const DEFAULT_GPT5_MODEL = "gpt-5-chat-latest";
export interface DiscoveredLLM {
    provider: string;
    model: string;
    source: string;
    apiKeyEnv?: string;
    apiKey?: string;
    endpoint?: string;
    status: 'available' | 'error' | 'unconfigured';
    error?: string;
    cost?: string;
}
/**
 * Discover all available LLM configurations
 */
export declare function discoverLLMs(projectPath?: string): Promise<DiscoveredLLM[]>;
/**
 * Test LLM connection
 */
export declare function testLLMConnection(llm: DiscoveredLLM): Promise<boolean>;
/**
 * Estimate cost for analysis
 */
export declare function estimateCost(llm: DiscoveredLLM, estimatedTokens?: number): string;
//# sourceMappingURL=llm-discovery.d.ts.map