/**
 * Integration analyzer for CrewAI flows
 *
 * Provides advanced analysis of external service integrations,
 * API calls, and third-party service dependencies in CrewAI flows.
 */
/**
 * Analyze external integrations in a flow
 */
export function analyzeIntegrations(flowSignals, yamlConfig) {
    // Detect integration points from multiple sources
    const codeBasedIntegrations = detectCodeBasedIntegrations(flowSignals);
    const yamlBasedIntegrations = detectYamlBasedIntegrations(yamlConfig);
    const patternBasedIntegrations = detectPatternBasedIntegrations(flowSignals);
    // Combine and deduplicate
    const allIntegrations = [...codeBasedIntegrations, ...yamlBasedIntegrations, ...patternBasedIntegrations];
    const uniqueIntegrations = deduplicateIntegrations(allIntegrations);
    // Analyze dimensions, risks, and generate recommendations
    const patterns = identifyIntegrationPatterns(uniqueIntegrations);
    const risks = assessIntegrationRisks(uniqueIntegrations);
    const recommendations = generateIntegrationRecommendations(uniqueIntegrations, risks);
    const metrics = calculateIntegrationMetrics(uniqueIntegrations, risks);
    return {
        points: uniqueIntegrations,
        patterns: patterns,
        risks,
        recommendations,
        metrics
    };
}
/**
 * Detect integrations from code analysis
 */
function detectCodeBasedIntegrations(flowSignals) {
    const integrations = [];
    // Analyze external services from flow signals
    for (const service of flowSignals.externalInteractions.services) {
        const integration = createIntegrationFromService(service, flowSignals);
        integrations.push(integration);
    }
    // Analyze API calls
    for (const api of flowSignals.externalInteractions.apis) {
        const integration = createIntegrationFromAPI(api, flowSignals);
        integrations.push(integration);
    }
    // Analyze database interactions
    if (flowSignals.externalInteractions.databases) {
        const integration = createDatabaseIntegration(flowSignals);
        integrations.push(integration);
    }
    // Analyze file operations
    if (flowSignals.externalInteractions.fileOperations.reads ||
        flowSignals.externalInteractions.fileOperations.writes) {
        const integration = createFileSystemIntegration(flowSignals);
        integrations.push(integration);
    }
    return integrations;
}
/**
 * Create integration point from external service
 */
function createIntegrationFromService(service, flowSignals) {
    const serviceType = determineServiceType(service.name);
    const operations = service.operations.map((op) => ({
        method: `${service.name}_${op}`,
        operation: mapOperationType(op),
        frequency: 'conditional',
        criticality: determineCriticality(service.name, op)
    }));
    return {
        id: `service-${service.name}`,
        service: service.name,
        type: serviceType,
        operations,
        configuration: {
            envVars: [service.envVar],
            credentials: [service.envVar],
            endpoints: inferEndpoints(service.name),
            timeouts: [30000], // 30 seconds default
            retryPolicy: {
                maxAttempts: 3,
                backoffStrategy: 'exponential',
                retryableErrors: ['timeout', 'rate_limit', '5xx']
            }
        },
        dependencies: [{
                service: service.name,
                required: true,
                fallback: determineFallback(service.name)
            }],
        reliability: {
            availability: estimateAvailability(service.name),
            errorRate: estimateErrorRate(service.name),
            responseTime: estimateResponseTime(service.name),
            failureImpact: determineFailureImpact(service.name),
            monitoringRequired: true
        },
        security: {
            authMethod: determineAuthMethod(service.name),
            dataClassification: determineDataClassification(service.name),
            encryptionRequired: true,
            auditingRequired: isAuditingRequired(service.name),
            complianceRequirements: getComplianceRequirements(service.name)
        }
    };
}
/**
 * Create integration point from API reference
 */
function createIntegrationFromAPI(api, flowSignals) {
    return {
        id: `api-${api.toLowerCase()}`,
        service: api,
        type: 'api',
        operations: [{
                method: `${api}_call`,
                operation: 'read',
                frequency: 'conditional',
                criticality: 'medium'
            }],
        configuration: {
            envVars: [`${api.toUpperCase()}_API_KEY`],
            credentials: [`${api.toLowerCase()}_credentials`],
            endpoints: [`https://api.${api.toLowerCase()}.com`],
            timeouts: [30000]
        },
        dependencies: [{
                service: api,
                required: true
            }],
        reliability: {
            availability: 0.99,
            errorRate: 0.01,
            responseTime: 1000,
            failureImpact: 'degraded',
            monitoringRequired: true
        },
        security: {
            authMethod: 'api_key',
            dataClassification: 'internal',
            encryptionRequired: true,
            auditingRequired: false,
            complianceRequirements: []
        }
    };
}
/**
 * Create database integration
 */
function createDatabaseIntegration(flowSignals) {
    return {
        id: 'database-integration',
        service: 'database',
        type: 'database',
        operations: [
            {
                method: 'db_read',
                operation: 'read',
                frequency: 'multiple',
                criticality: 'high'
            },
            {
                method: 'db_write',
                operation: 'write',
                frequency: 'multiple',
                criticality: 'high'
            }
        ],
        configuration: {
            envVars: ['DATABASE_URL', 'DB_PASSWORD'],
            credentials: ['database_credentials'],
            endpoints: ['database_host'],
            timeouts: [10000]
        },
        dependencies: [{
                service: 'database',
                required: true
            }],
        reliability: {
            availability: 0.999,
            errorRate: 0.001,
            responseTime: 100,
            failureImpact: 'critical',
            monitoringRequired: true
        },
        security: {
            authMethod: 'basic',
            dataClassification: 'confidential',
            encryptionRequired: true,
            auditingRequired: true,
            complianceRequirements: ['GDPR', 'SOX']
        }
    };
}
/**
 * Create file system integration
 */
function createFileSystemIntegration(flowSignals) {
    const operations = [];
    if (flowSignals.externalInteractions.fileOperations.reads) {
        operations.push({
            method: 'file_read',
            operation: 'read',
            frequency: 'multiple',
            criticality: 'medium'
        });
    }
    if (flowSignals.externalInteractions.fileOperations.writes) {
        operations.push({
            method: 'file_write',
            operation: 'write',
            frequency: 'multiple',
            criticality: 'medium'
        });
    }
    return {
        id: 'filesystem-integration',
        service: 'file_system',
        type: 'file_system',
        operations,
        configuration: {
            envVars: ['WORK_DIR', 'OUTPUT_DIR'],
            credentials: [],
            endpoints: [],
            timeouts: [5000]
        },
        dependencies: [{
                service: 'file_system',
                required: true
            }],
        reliability: {
            availability: 0.9999,
            errorRate: 0.0001,
            responseTime: 50,
            failureImpact: 'degraded',
            monitoringRequired: false
        },
        security: {
            authMethod: 'none',
            dataClassification: 'internal',
            encryptionRequired: false,
            auditingRequired: false,
            complianceRequirements: []
        }
    };
}
/**
 * Detect integrations from YAML configuration
 */
function detectYamlBasedIntegrations(yamlConfig) {
    const integrations = [];
    // Analyze tools from YAML
    for (const tool of yamlConfig.externalIntegrations.tools) {
        const integration = {
            id: `yaml-tool-${tool}`,
            service: tool,
            type: determineServiceType(tool),
            operations: [{
                    method: `${tool}_execute`,
                    operation: 'execute',
                    frequency: 'conditional',
                    criticality: 'medium'
                }],
            configuration: {
                envVars: [`${tool.toUpperCase()}_CONFIG`],
                credentials: [],
                endpoints: [],
                timeouts: [60000]
            },
            dependencies: [{
                    service: tool,
                    required: true
                }],
            reliability: {
                availability: 0.95,
                errorRate: 0.05,
                responseTime: 2000,
                failureImpact: 'degraded',
                monitoringRequired: true
            },
            security: {
                authMethod: 'none',
                dataClassification: 'internal',
                encryptionRequired: false,
                auditingRequired: false,
                complianceRequirements: []
            }
        };
        integrations.push(integration);
    }
    // Analyze LLM providers
    for (const provider of yamlConfig.externalIntegrations.llmProviders) {
        const integration = {
            id: `yaml-llm-${provider}`,
            service: provider,
            type: 'api',
            operations: [{
                    method: `${provider}_completion`,
                    operation: 'create',
                    frequency: 'multiple',
                    criticality: 'critical'
                }],
            configuration: {
                envVars: [`${provider.toUpperCase()}_API_KEY`],
                credentials: [`${provider}_api_key`],
                endpoints: [getLLMEndpoint(provider)],
                timeouts: [120000], // 2 minutes for LLM calls
                rateLimits: [{
                        requests: 60,
                        window: 60,
                        scope: 'global'
                    }]
            },
            dependencies: [{
                    service: provider,
                    required: true
                }],
            reliability: {
                availability: 0.99,
                errorRate: 0.01,
                responseTime: 3000,
                failureImpact: 'critical',
                monitoringRequired: true
            },
            security: {
                authMethod: 'api_key',
                dataClassification: 'confidential',
                encryptionRequired: true,
                auditingRequired: true,
                complianceRequirements: ['data_privacy']
            }
        };
        integrations.push(integration);
    }
    return integrations;
}
/**
 * Detect integrations based on common patterns
 */
function detectPatternBasedIntegrations(flowSignals) {
    const integrations = [];
    // Dimension: Email integration
    if (flowSignals.behavioralPatterns.hasExternalIntegrations) {
        // Check for email dimensions in method names or content
        const hasEmailDimension = flowSignals.methods.some(m => m.name.toLowerCase().includes('email') ||
            m.name.toLowerCase().includes('mail'));
        if (hasEmailDimension) {
            integrations.push({
                id: 'dimension-email',
                service: 'email',
                type: 'messaging',
                operations: [{
                        method: 'send_email',
                        operation: 'create',
                        frequency: 'conditional',
                        criticality: 'medium'
                    }],
                configuration: {
                    envVars: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'],
                    credentials: ['email_credentials'],
                    endpoints: ['smtp.gmail.com:587'],
                    timeouts: [30000]
                },
                dependencies: [{
                        service: 'email_provider',
                        required: false,
                        fallback: 'log_message'
                    }],
                reliability: {
                    availability: 0.99,
                    errorRate: 0.01,
                    responseTime: 2000,
                    failureImpact: 'degraded',
                    monitoringRequired: true
                },
                security: {
                    authMethod: 'basic',
                    dataClassification: 'internal',
                    encryptionRequired: true,
                    auditingRequired: false,
                    complianceRequirements: []
                }
            });
        }
    }
    return integrations;
}
/**
 * Deduplicate integration points
 */
function deduplicateIntegrations(integrations) {
    const uniqueIntegrations = new Map();
    for (const integration of integrations) {
        const key = `${integration.service}-${integration.type}`;
        if (!uniqueIntegrations.has(key)) {
            uniqueIntegrations.set(key, integration);
        }
        else {
            // Merge operations from duplicate integrations
            const existing = uniqueIntegrations.get(key);
            existing.operations.push(...integration.operations);
            existing.configuration.envVars.push(...integration.configuration.envVars);
        }
    }
    return Array.from(uniqueIntegrations.values());
}
/**
 * Identify integration patterns
 */
function identifyIntegrationPatterns(integrations) {
    const patterns = [];
    // Dimension: API Gateway
    const apiIntegrations = integrations.filter(i => i.type === 'api');
    if (apiIntegrations.length > 2) {
        patterns.push({
            name: 'API Gateway Dimension',
            description: 'Multiple API integrations suggest need for API gateway',
            services: apiIntegrations.map(i => i.service),
            complexity: apiIntegrations.length > 5 ? 'complex' : 'moderate',
            reliability: Math.min(...apiIntegrations.map(i => i.reliability.availability))
        });
    }
    // Dimension: Event-Driven Architecture
    const messagingIntegrations = integrations.filter(i => i.type === 'messaging');
    if (messagingIntegrations.length > 0) {
        patterns.push({
            name: 'Event-Driven Dimension',
            description: 'Messaging integrations indicate event-driven architecture',
            services: messagingIntegrations.map(i => i.service),
            complexity: 'moderate',
            reliability: Math.min(...messagingIntegrations.map(i => i.reliability.availability))
        });
    }
    // Dimension: Data Pipeline
    const dataIntegrations = integrations.filter(i => i.type === 'database' || i.type === 'file_system' || i.type === 'storage');
    if (dataIntegrations.length > 1) {
        patterns.push({
            name: 'Data Pipeline Dimension',
            description: 'Multiple data integrations form a data processing pipeline',
            services: dataIntegrations.map(i => i.service),
            complexity: 'moderate',
            reliability: Math.min(...dataIntegrations.map(i => i.reliability.availability))
        });
    }
    return patterns;
}
/**
 * Assess integration risks
 */
function assessIntegrationRisks(integrations) {
    const risks = [];
    // Risk: Single point of failure
    const criticalIntegrations = integrations.filter(i => i.operations.some(op => op.criticality === 'critical') &&
        i.reliability.failureImpact === 'critical');
    for (const integration of criticalIntegrations) {
        risks.push({
            id: `spof-${integration.service}`,
            type: 'availability',
            severity: 'high',
            description: `${integration.service} is a single point of failure`,
            mitigation: 'Implement fallback mechanisms and circuit breakers',
            services: [integration.service]
        });
    }
    // Risk: Security vulnerabilities
    const insecureIntegrations = integrations.filter(i => i.security.authMethod === 'none' && i.security.dataClassification !== 'public');
    for (const integration of insecureIntegrations) {
        risks.push({
            id: `security-${integration.service}`,
            type: 'security',
            severity: 'medium',
            description: `${integration.service} lacks proper authentication`,
            mitigation: 'Implement proper authentication and authorization',
            services: [integration.service]
        });
    }
    // Risk: Performance bottlenecks
    const slowIntegrations = integrations.filter(i => i.reliability.responseTime > 5000);
    for (const integration of slowIntegrations) {
        risks.push({
            id: `performance-${integration.service}`,
            type: 'performance',
            severity: 'medium',
            description: `${integration.service} has high response times`,
            mitigation: 'Implement caching and async processing',
            services: [integration.service]
        });
    }
    return risks;
}
/**
 * Generate integration recommendations
 */
function generateIntegrationRecommendations(integrations, risks) {
    const recommendations = [];
    // Recommendation: Implement monitoring
    const unmonitoredIntegrations = integrations.filter(i => !i.reliability.monitoringRequired);
    if (unmonitoredIntegrations.length > 0) {
        recommendations.push({
            type: 'monitoring',
            priority: 'high',
            description: 'Implement comprehensive monitoring for all integrations',
            implementation: 'Add health checks, metrics collection, and alerting',
            services: unmonitoredIntegrations.map(i => i.service)
        });
    }
    // Recommendation: Security hardening
    const securityRisks = risks.filter(r => r.type === 'security');
    if (securityRisks.length > 0) {
        recommendations.push({
            type: 'security',
            priority: 'high',
            description: 'Implement security best practices for integrations',
            implementation: 'Add authentication, encryption, and audit logging',
            services: securityRisks.flatMap(r => r.services)
        });
    }
    // Recommendation: Circuit breakers
    const criticalIntegrations = integrations.filter(i => i.reliability.failureImpact === 'critical');
    if (criticalIntegrations.length > 0) {
        recommendations.push({
            type: 'architecture',
            priority: 'medium',
            description: 'Implement circuit breaker dimension for critical integrations',
            implementation: 'Add circuit breakers with fallback mechanisms',
            services: criticalIntegrations.map(i => i.service)
        });
    }
    return recommendations;
}
/**
 * Calculate integration metrics
 */
function calculateIntegrationMetrics(integrations, risks) {
    const totalIntegrations = integrations.length;
    const criticalIntegrations = integrations.filter(i => i.operations.some(op => op.criticality === 'critical')).length;
    const externalDependencies = integrations.filter(i => i.dependencies.some(dep => dep.required)).length;
    // Calculate security score (0-100)
    const securityScore = integrations.reduce((score, integration) => {
        let integrationScore = 100;
        if (integration.security.authMethod === 'none')
            integrationScore -= 30;
        if (!integration.security.encryptionRequired)
            integrationScore -= 20;
        if (!integration.security.auditingRequired && integration.security.dataClassification !== 'public')
            integrationScore -= 10;
        return score + Math.max(0, integrationScore);
    }, 0) / totalIntegrations;
    // Calculate reliability score (0-100)
    const reliabilityScore = integrations.reduce((score, integration) => {
        return score + (integration.reliability.availability * 100);
    }, 0) / totalIntegrations;
    // Calculate complexity score (0-100, lower is better)
    let complexityScore = 0;
    complexityScore += totalIntegrations * 5; // 5 points per integration
    complexityScore += criticalIntegrations * 10; // Extra points for critical integrations
    complexityScore += risks.length * 15; // Points for risks
    complexityScore = Math.min(100, complexityScore);
    return {
        totalIntegrations,
        criticalIntegrations,
        externalDependencies,
        securityScore,
        reliabilityScore,
        complexityScore
    };
}
// Helper functions
function determineServiceType(serviceName) {
    const name = serviceName.toLowerCase();
    if (name.includes('slack') || name.includes('email') || name.includes('sms')) {
        return 'messaging';
    }
    else if (name.includes('db') || name.includes('database') || name.includes('sql')) {
        return 'database';
    }
    else if (name.includes('s3') || name.includes('storage') || name.includes('blob')) {
        return 'storage';
    }
    else if (name.includes('auth') || name.includes('oauth') || name.includes('login')) {
        return 'auth';
    }
    else if (name.includes('monitor') || name.includes('log') || name.includes('metric')) {
        return 'monitoring';
    }
    else if (name.includes('file') || name.includes('fs')) {
        return 'file_system';
    }
    return 'api';
}
function mapOperationType(operation) {
    const op = operation.toLowerCase();
    if (op.includes('read') || op.includes('get') || op.includes('fetch')) {
        return 'read';
    }
    else if (op.includes('write') || op.includes('save') || op.includes('store')) {
        return 'write';
    }
    else if (op.includes('create') || op.includes('add') || op.includes('insert')) {
        return 'create';
    }
    else if (op.includes('update') || op.includes('modify') || op.includes('edit')) {
        return 'update';
    }
    else if (op.includes('delete') || op.includes('remove')) {
        return 'delete';
    }
    else if (op.includes('execute') || op.includes('run') || op.includes('call')) {
        return 'execute';
    }
    else if (op.includes('subscribe') || op.includes('listen')) {
        return 'subscribe';
    }
    return 'read';
}
function determineCriticality(serviceName, operation) {
    const name = serviceName.toLowerCase();
    const op = operation.toLowerCase();
    if (name.includes('database') || name.includes('auth')) {
        return 'critical';
    }
    else if (name.includes('llm') || name.includes('openai') || name.includes('anthropic')) {
        return 'critical';
    }
    else if (op.includes('write') || op.includes('create') || op.includes('delete')) {
        return 'high';
    }
    else if (name.includes('slack') || name.includes('email')) {
        return 'medium';
    }
    return 'low';
}
function inferEndpoints(serviceName) {
    const name = serviceName.toLowerCase();
    if (name === 'slack') {
        return ['https://slack.com/api/'];
    }
    else if (name === 'trello') {
        return ['https://api.trello.com/'];
    }
    else if (name === 'gmail') {
        return ['https://gmail.googleapis.com/'];
    }
    else if (name === 'github') {
        return ['https://api.github.com/'];
    }
    return [`https://api.${name}.com/`];
}
function getLLMEndpoint(provider) {
    const name = provider.toLowerCase();
    if (name.includes('openai')) {
        return 'https://api.openai.com/v1/';
    }
    else if (name.includes('anthropic')) {
        return 'https://api.anthropic.com/v1/';
    }
    else if (name.includes('cohere')) {
        return 'https://api.cohere.ai/v1/';
    }
    return `https://api.${name}.com/`;
}
function estimateAvailability(serviceName) {
    const name = serviceName.toLowerCase();
    if (name.includes('aws') || name.includes('google') || name.includes('azure')) {
        return 0.999; // 99.9%
    }
    else if (name.includes('openai') || name.includes('anthropic')) {
        return 0.99; // 99%
    }
    else if (name.includes('slack') || name.includes('github')) {
        return 0.995; // 99.5%
    }
    return 0.95; // 95% default
}
function estimateErrorRate(serviceName) {
    return 1 - estimateAvailability(serviceName);
}
function estimateResponseTime(serviceName) {
    const name = serviceName.toLowerCase();
    if (name.includes('database') || name.includes('cache')) {
        return 100; // 100ms
    }
    else if (name.includes('llm') || name.includes('openai') || name.includes('anthropic')) {
        return 3000; // 3 seconds
    }
    else if (name.includes('api')) {
        return 1000; // 1 second
    }
    return 500; // 500ms default
}
function determineFailureImpact(serviceName) {
    const name = serviceName.toLowerCase();
    if (name.includes('database') || name.includes('auth')) {
        return 'critical';
    }
    else if (name.includes('llm') || name.includes('openai')) {
        return 'critical';
    }
    else if (name.includes('api')) {
        return 'blocked';
    }
    else if (name.includes('slack') || name.includes('email')) {
        return 'degraded';
    }
    return 'none';
}
function determineFallback(serviceName) {
    const name = serviceName.toLowerCase();
    if (name.includes('slack')) {
        return 'log_message';
    }
    else if (name.includes('email')) {
        return 'save_to_file';
    }
    else if (name.includes('trello')) {
        return 'create_local_task';
    }
    return undefined;
}
function determineAuthMethod(serviceName) {
    const name = serviceName.toLowerCase();
    if (name.includes('slack') || name.includes('trello') || name.includes('github')) {
        return 'oauth';
    }
    else if (name.includes('openai') || name.includes('anthropic')) {
        return 'api_key';
    }
    else if (name.includes('database')) {
        return 'basic';
    }
    else if (name.includes('auth')) {
        return 'jwt';
    }
    return 'api_key';
}
function determineDataClassification(serviceName) {
    const name = serviceName.toLowerCase();
    if (name.includes('database') || name.includes('auth')) {
        return 'confidential';
    }
    else if (name.includes('llm') || name.includes('openai') || name.includes('anthropic')) {
        return 'confidential';
    }
    else if (name.includes('slack') || name.includes('email')) {
        return 'internal';
    }
    return 'internal';
}
function isAuditingRequired(serviceName) {
    const name = serviceName.toLowerCase();
    return name.includes('database') ||
        name.includes('auth') ||
        name.includes('payment') ||
        name.includes('financial');
}
function getComplianceRequirements(serviceName) {
    const name = serviceName.toLowerCase();
    const requirements = [];
    if (name.includes('database') || name.includes('auth')) {
        requirements.push('GDPR', 'SOX');
    }
    if (name.includes('payment') || name.includes('financial')) {
        requirements.push('PCI-DSS');
    }
    if (name.includes('health') || name.includes('medical')) {
        requirements.push('HIPAA');
    }
    return requirements;
}
/**
 * Generate integration analysis report
 */
export function generateIntegrationReport(analysis) {
    const lines = [];
    lines.push('# Integration Analysis Report');
    lines.push('');
    // Summary
    lines.push('## Summary');
    lines.push(`- **Total Integrations**: ${analysis.metrics.totalIntegrations}`);
    lines.push(`- **Critical Integrations**: ${analysis.metrics.criticalIntegrations}`);
    lines.push(`- **External Dependencies**: ${analysis.metrics.externalDependencies}`);
    lines.push(`- **Security Score**: ${Math.round(analysis.metrics.securityScore)}/100`);
    lines.push(`- **Reliability Score**: ${Math.round(analysis.metrics.reliabilityScore)}/100`);
    lines.push(`- **Complexity Score**: ${Math.round(analysis.metrics.complexityScore)}/100`);
    lines.push('');
    // Integration Points
    lines.push('## Integration Points');
    lines.push('');
    for (const point of analysis.points) {
        lines.push(`### ${point.service} (${point.type})`);
        lines.push(`- **Operations**: ${point.operations.map(op => op.operation).join(', ')}`);
        lines.push(`- **Criticality**: ${point.operations.map(op => op.criticality).join(', ')}`);
        lines.push(`- **Availability**: ${Math.round(point.reliability.availability * 100)}%`);
        lines.push(`- **Response Time**: ${point.reliability.responseTime}ms`);
        lines.push(`- **Auth Method**: ${point.security.authMethod}`);
        lines.push(`- **Data Classification**: ${point.security.dataClassification}`);
        if (point.configuration.envVars.length > 0) {
            lines.push(`- **Environment Variables**: ${point.configuration.envVars.join(', ')}`);
        }
        lines.push('');
    }
    // Dimensions
    if (analysis.patterns.length > 0) {
        lines.push('## Integration Dimensions');
        lines.push('');
        for (const pattern of analysis.patterns) {
            lines.push(`### ${pattern.name} (${pattern.complexity})`);
            lines.push(`- **Description**: ${pattern.description}`);
            lines.push(`- **Services**: ${pattern.services.join(', ')}`);
            lines.push(`- **Reliability**: ${Math.round(pattern.reliability * 100)}%`);
            lines.push('');
        }
    }
    // Risks
    if (analysis.risks.length > 0) {
        lines.push('## Identified Risks');
        lines.push('');
        for (const risk of analysis.risks) {
            lines.push(`### ${risk.type.toUpperCase()}: ${risk.description} (${risk.severity})`);
            lines.push(`- **Services**: ${risk.services.join(', ')}`);
            lines.push(`- **Mitigation**: ${risk.mitigation}`);
            lines.push('');
        }
    }
    // Recommendations
    if (analysis.recommendations.length > 0) {
        lines.push('## Recommendations');
        lines.push('');
        for (const rec of analysis.recommendations) {
            lines.push(`### ${rec.type.toUpperCase()}: ${rec.description} (${rec.priority} priority)`);
            lines.push(`- **Implementation**: ${rec.implementation}`);
            lines.push(`- **Services**: ${rec.services.join(', ')}`);
            lines.push('');
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=integration-analyzer.js.map