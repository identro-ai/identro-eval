/**
 * External integration detection for CrewAI crews
 *
 * Detects and analyzes external integrations:
 * - Tools (builtin, custom, integration)
 * - APIs (REST, GraphQL, webhooks)
 * - Databases (SQL, NoSQL)
 * - File operations (read/write, formats)
 * - LLM providers (OpenAI, Anthropic, etc.)
 */
import { CrewAST } from './crew-ast-parser';
import { YamlAnalysisResult } from './yaml-analyzer';
export interface CrewExternalIntegrations {
    tools: ToolIntegration[];
    apis: APIIntegration[];
    databases: DatabaseIntegration[];
    fileOperations: FileOperationIntegration;
    llmProviders: LLMProviderIntegration[];
}
export interface ToolIntegration {
    name: string;
    type: 'search' | 'file' | 'api' | 'database' | 'custom';
    operations: string[];
    requiredEnvVars: string[];
}
export interface APIIntegration {
    name: string;
    endpoint?: string;
    envVar?: string;
    operations: string[];
    protocol: 'http' | 'https' | 'websocket' | 'grpc';
}
export interface DatabaseIntegration {
    type: 'sqlite' | 'postgres' | 'mysql' | 'mongodb' | 'redis' | 'unknown';
    operations: string[];
    requiredEnvVars: string[];
}
export interface FileOperationIntegration {
    reads: string[];
    writes: string[];
    formats: string[];
}
export interface LLMProviderIntegration {
    provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'aws' | 'custom';
    model: string;
    agent: string;
}
/**
 * Detect all external integrations from AST and YAML
 */
export declare function detectCrewIntegrations(crewAST: CrewAST, yamlConfig: YamlAnalysisResult): CrewExternalIntegrations;
/**
 * Generate integration summary for LLM context
 */
export declare function generateIntegrationSummary(integrations: CrewExternalIntegrations): string;
//# sourceMappingURL=crew-integration-detector.d.ts.map