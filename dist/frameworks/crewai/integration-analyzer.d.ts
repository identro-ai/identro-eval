/**
 * Integration analyzer for CrewAI flows
 *
 * Provides advanced analysis of external service integrations,
 * API calls, and third-party service dependencies in CrewAI flows.
 */
import { FlowSignals } from './ast-parser';
import { YamlAnalysisResult } from './yaml-analyzer';
export interface IntegrationPoint {
    id: string;
    service: string;
    type: 'api' | 'database' | 'file_system' | 'messaging' | 'storage' | 'auth' | 'monitoring';
    operations: IntegrationOperation[];
    configuration: IntegrationConfig;
    dependencies: IntegrationDependency[];
    reliability: IntegrationReliability;
    security: IntegrationSecurity;
}
export interface IntegrationOperation {
    method: string;
    operation: 'read' | 'write' | 'create' | 'update' | 'delete' | 'execute' | 'subscribe';
    endpoint?: string;
    payload?: string;
    frequency: 'once' | 'multiple' | 'continuous' | 'conditional';
    criticality: 'low' | 'medium' | 'high' | 'critical';
}
export interface IntegrationConfig {
    envVars: string[];
    credentials: string[];
    endpoints: string[];
    timeouts: number[];
    retryPolicy?: RetryPolicy;
    rateLimits?: RateLimit[];
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential' | 'fixed';
    retryableErrors: string[];
}
export interface RateLimit {
    requests: number;
    window: number;
    scope: 'global' | 'user' | 'endpoint';
}
export interface IntegrationDependency {
    service: string;
    version?: string;
    required: boolean;
    fallback?: string;
}
export interface IntegrationReliability {
    availability: number;
    errorRate: number;
    responseTime: number;
    failureImpact: 'none' | 'degraded' | 'blocked' | 'critical';
    monitoringRequired: boolean;
}
export interface IntegrationSecurity {
    authMethod: 'none' | 'api_key' | 'oauth' | 'jwt' | 'basic' | 'certificate';
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    encryptionRequired: boolean;
    auditingRequired: boolean;
    complianceRequirements: string[];
}
export interface IntegrationAnalysis {
    points: IntegrationPoint[];
    patterns: IntegrationPattern[];
    risks: IntegrationRisk[];
    recommendations: IntegrationRecommendation[];
    metrics: IntegrationMetrics;
}
export interface IntegrationPattern {
    name: string;
    description: string;
    services: string[];
    complexity: 'simple' | 'moderate' | 'complex';
    reliability: number;
}
export interface IntegrationRisk {
    id: string;
    type: 'availability' | 'security' | 'performance' | 'compliance' | 'cost';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation: string;
    services: string[];
}
export interface IntegrationRecommendation {
    type: 'architecture' | 'security' | 'monitoring' | 'testing' | 'documentation';
    priority: 'low' | 'medium' | 'high';
    description: string;
    implementation: string;
    services: string[];
}
export interface IntegrationMetrics {
    totalIntegrations: number;
    criticalIntegrations: number;
    externalDependencies: number;
    securityScore: number;
    reliabilityScore: number;
    complexityScore: number;
}
/**
 * Analyze external integrations in a flow
 */
export declare function analyzeIntegrations(flowSignals: FlowSignals, yamlConfig: YamlAnalysisResult): IntegrationAnalysis;
/**
 * Generate integration analysis report
 */
export declare function generateIntegrationReport(analysis: IntegrationAnalysis): string;
//# sourceMappingURL=integration-analyzer.d.ts.map