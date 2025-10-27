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
/**
 * Detect all external integrations from AST and YAML
 */
export function detectCrewIntegrations(crewAST, yamlConfig) {
    return {
        tools: detectTools(crewAST, yamlConfig),
        apis: detectAPIs(crewAST, yamlConfig),
        databases: detectDatabases(crewAST),
        fileOperations: detectFileOperations(crewAST),
        llmProviders: detectLLMProviders(crewAST, yamlConfig)
    };
}
/**
 * Detect tool integrations from AST and YAML
 */
function detectTools(crewAST, yamlConfig) {
    const tools = new Map();
    // From AST tool usage
    crewAST.toolUsage.forEach(tool => {
        if (!tools.has(tool.toolName)) {
            tools.set(tool.toolName, {
                name: tool.toolName,
                type: mapToolTypeToIntegrationType(tool.toolType, tool.toolName),
                operations: ['execute'],
                requiredEnvVars: extractToolEnvVars(tool.toolName)
            });
        }
    });
    // From YAML agents - handle both array and object formats
    if (yamlConfig.agents) {
        Object.entries(yamlConfig.agents).forEach(([agentName, agent]) => {
            const agentTools = agent.tools || [];
            // Handle both array of strings and array of objects
            const toolNames = Array.isArray(agentTools)
                ? agentTools.map((t) => typeof t === 'string' ? t : t.name || t.tool).filter(Boolean)
                : [];
            toolNames.forEach((toolName) => {
                if (toolName && !tools.has(toolName)) {
                    tools.set(toolName, {
                        name: toolName,
                        type: determineToolType(toolName),
                        operations: ['execute'],
                        requiredEnvVars: extractToolEnvVars(toolName)
                    });
                }
            });
        });
    }
    // From YAML tasks - handle both array and object formats
    if (yamlConfig.tasks) {
        Object.entries(yamlConfig.tasks).forEach(([taskName, task]) => {
            const taskTools = task.tools || [];
            // Handle both array of strings and array of objects
            const toolNames = Array.isArray(taskTools)
                ? taskTools.map((t) => typeof t === 'string' ? t : t.name || t.tool)
                : [];
            toolNames.forEach((toolName) => {
                if (toolName && !tools.has(toolName)) {
                    tools.set(toolName, {
                        name: toolName,
                        type: determineToolType(toolName),
                        operations: ['execute'],
                        requiredEnvVars: extractToolEnvVars(toolName)
                    });
                }
            });
        });
    }
    return Array.from(tools.values());
}
/**
 * Map tool type from AST to integration type
 */
function mapToolTypeToIntegrationType(toolType, toolName) {
    if (toolName.toLowerCase().includes('search') || toolName.toLowerCase().includes('serper')) {
        return 'search';
    }
    if (toolName.toLowerCase().includes('file') || toolName.toLowerCase().includes('read') || toolName.toLowerCase().includes('write')) {
        return 'file';
    }
    if (toolName.toLowerCase().includes('api') || toolName.toLowerCase().includes('http')) {
        return 'api';
    }
    if (toolName.toLowerCase().includes('database') || toolName.toLowerCase().includes('sql')) {
        return 'database';
    }
    return 'custom';
}
/**
 * Determine tool type from name
 */
function determineToolType(toolName) {
    const lower = toolName.toLowerCase();
    if (lower.includes('search') || lower.includes('serper'))
        return 'search';
    if (lower.includes('file') || lower.includes('read') || lower.includes('write'))
        return 'file';
    if (lower.includes('api') || lower.includes('http'))
        return 'api';
    if (lower.includes('database') || lower.includes('sql'))
        return 'database';
    return 'custom';
}
/**
 * Extract environment variables required by tool
 */
function extractToolEnvVars(toolName) {
    const envVars = [];
    const lower = toolName.toLowerCase();
    if (lower.includes('serper'))
        envVars.push('SERPER_API_KEY');
    if (lower.includes('slack'))
        envVars.push('SLACK_TOKEN');
    if (lower.includes('trello'))
        envVars.push('TRELLO_API_KEY', 'TRELLO_TOKEN');
    if (lower.includes('gmail'))
        envVars.push('GMAIL_CREDENTIALS');
    if (lower.includes('github'))
        envVars.push('GITHUB_TOKEN');
    if (lower.includes('openai'))
        envVars.push('OPENAI_API_KEY');
    return envVars;
}
/**
 * Detect API integrations from AST and YAML
 */
function detectAPIs(crewAST, yamlConfig) {
    const apis = new Map();
    // From AST external calls
    crewAST.externalCalls.forEach(call => {
        if (call.callType === 'api') {
            if (!apis.has(call.service)) {
                apis.set(call.service, {
                    name: call.service,
                    operations: [call.method],
                    protocol: 'https',
                    envVar: call.envVars[0]
                });
            }
            else {
                const api = apis.get(call.service);
                if (!api.operations.includes(call.method)) {
                    api.operations.push(call.method);
                }
            }
        }
    });
    // From imports - detect common API integrations
    crewAST.imports.forEach(imp => {
        if (imp.module.includes('slack')) {
            apis.set('slack', {
                name: 'Slack API',
                operations: ['post', 'read'],
                protocol: 'https',
                envVar: 'SLACK_TOKEN'
            });
        }
        if (imp.module.includes('trello')) {
            apis.set('trello', {
                name: 'Trello API',
                operations: ['create', 'update', 'read'],
                protocol: 'https',
                envVar: 'TRELLO_API_KEY'
            });
        }
        if (imp.module.includes('gmail') || imp.module.includes('google')) {
            apis.set('gmail', {
                name: 'Gmail API',
                operations: ['send', 'read'],
                protocol: 'https',
                envVar: 'GMAIL_CREDENTIALS'
            });
        }
        if (imp.module.includes('github')) {
            apis.set('github', {
                name: 'GitHub API',
                operations: ['create', 'update', 'read'],
                protocol: 'https',
                envVar: 'GITHUB_TOKEN'
            });
        }
    });
    return Array.from(apis.values());
}
/**
 * Detect database integrations from AST
 */
function detectDatabases(crewAST) {
    const databases = new Map();
    // From external calls
    crewAST.externalCalls.forEach(call => {
        if (call.callType === 'database') {
            const dbType = inferDatabaseType(call.service);
            if (!databases.has(dbType)) {
                databases.set(dbType, {
                    type: dbType,
                    operations: [call.method],
                    requiredEnvVars: call.envVars
                });
            }
            else {
                const db = databases.get(dbType);
                if (!db.operations.includes(call.method)) {
                    db.operations.push(call.method);
                }
            }
        }
    });
    // From imports
    crewAST.imports.forEach(imp => {
        let dbType = null;
        let envVars = [];
        if (imp.module.includes('sqlite3')) {
            dbType = 'sqlite';
        }
        else if (imp.module.includes('psycopg') || imp.module.includes('postgres')) {
            dbType = 'postgres';
            envVars = ['DATABASE_URL', 'POSTGRES_URL'];
        }
        else if (imp.module.includes('mysql')) {
            dbType = 'mysql';
            envVars = ['DATABASE_URL', 'MYSQL_URL'];
        }
        else if (imp.module.includes('pymongo') || imp.module.includes('mongo')) {
            dbType = 'mongodb';
            envVars = ['MONGODB_URL', 'MONGO_URI'];
        }
        else if (imp.module.includes('redis')) {
            dbType = 'redis';
            envVars = ['REDIS_URL'];
        }
        if (dbType && !databases.has(dbType)) {
            databases.set(dbType, {
                type: dbType,
                operations: ['query', 'insert', 'update', 'delete'],
                requiredEnvVars: envVars
            });
        }
    });
    return Array.from(databases.values());
}
/**
 * Infer database type from service name
 */
function inferDatabaseType(service) {
    const lower = service.toLowerCase();
    if (lower.includes('sqlite'))
        return 'sqlite';
    if (lower.includes('postgres') || lower.includes('pg'))
        return 'postgres';
    if (lower.includes('mysql'))
        return 'mysql';
    if (lower.includes('mongo'))
        return 'mongodb';
    if (lower.includes('redis'))
        return 'redis';
    return 'unknown';
}
/**
 * Detect file operations from AST
 */
function detectFileOperations(crewAST) {
    const reads = new Set();
    const writes = new Set();
    const formats = new Set();
    // From external calls
    crewAST.externalCalls.forEach(call => {
        if (call.callType === 'file') {
            if (['read', 'open', 'load'].includes(call.method)) {
                reads.add(call.method);
            }
            if (['write', 'save'].includes(call.method)) {
                writes.add(call.method);
            }
        }
    });
    // From imports - detect file format libraries
    crewAST.imports.forEach(imp => {
        if (imp.module.includes('csv'))
            formats.add('CSV');
        if (imp.module.includes('json'))
            formats.add('JSON');
        if (imp.module.includes('yaml'))
            formats.add('YAML');
        if (imp.module.includes('xml'))
            formats.add('XML');
        if (imp.module.includes('pdf'))
            formats.add('PDF');
        if (imp.module.includes('docx') || imp.module.includes('python-docx'))
            formats.add('DOCX');
        if (imp.module.includes('openpyxl') || imp.module.includes('xlsx'))
            formats.add('XLSX');
        if (imp.module.includes('markdown'))
            formats.add('MD');
    });
    // From tool usage
    crewAST.toolUsage.forEach(tool => {
        if (tool.toolName.includes('FileRead')) {
            reads.add('read');
            formats.add('TXT');
        }
        if (tool.toolName.includes('FileWrite')) {
            writes.add('write');
            formats.add('TXT');
        }
        if (tool.toolName.toLowerCase().includes('csv'))
            formats.add('CSV');
        if (tool.toolName.toLowerCase().includes('json'))
            formats.add('JSON');
    });
    return {
        reads: Array.from(reads),
        writes: Array.from(writes),
        formats: Array.from(formats)
    };
}
/**
 * Detect LLM providers from AST and YAML
 */
function detectLLMProviders(crewAST, yamlConfig) {
    const providers = [];
    const seen = new Set();
    // From YAML agent configurations
    Object.entries(yamlConfig.agents).forEach(([agentName, agent]) => {
        if (agent.llm) {
            const { provider, model } = parseLLMString(agent.llm);
            const key = `${provider}:${model}:${agentName}`;
            if (!seen.has(key)) {
                seen.add(key);
                providers.push({
                    provider,
                    model,
                    agent: agentName
                });
            }
        }
    });
    // From imports - detect LLM libraries
    crewAST.imports.forEach(imp => {
        if (imp.module.includes('openai')) {
            const key = 'openai:gpt-4:default';
            if (!seen.has(key)) {
                seen.add(key);
                providers.push({
                    provider: 'openai',
                    model: 'gpt-4',
                    agent: 'default'
                });
            }
        }
        if (imp.module.includes('anthropic')) {
            const key = 'anthropic:claude-3:default';
            if (!seen.has(key)) {
                seen.add(key);
                providers.push({
                    provider: 'anthropic',
                    model: 'claude-3',
                    agent: 'default'
                });
            }
        }
        if (imp.module.includes('google') && imp.module.includes('genai')) {
            const key = 'google:gemini:default';
            if (!seen.has(key)) {
                seen.add(key);
                providers.push({
                    provider: 'google',
                    model: 'gemini',
                    agent: 'default'
                });
            }
        }
    });
    // If no specific providers found, assume OpenAI (CrewAI default)
    if (providers.length === 0) {
        providers.push({
            provider: 'openai',
            model: 'gpt-4',
            agent: 'default'
        });
    }
    return providers;
}
/**
 * Parse LLM string from YAML (e.g., "openai/gpt-4", "anthropic/claude-3")
 */
function parseLLMString(llmString) {
    const parts = llmString.split('/');
    let provider = 'custom';
    let model = 'unknown';
    if (parts.length >= 1) {
        const providerStr = parts[0].toLowerCase();
        if (providerStr.includes('openai'))
            provider = 'openai';
        else if (providerStr.includes('anthropic'))
            provider = 'anthropic';
        else if (providerStr.includes('google') || providerStr.includes('gemini'))
            provider = 'google';
        else if (providerStr.includes('azure'))
            provider = 'azure';
        else if (providerStr.includes('aws') || providerStr.includes('bedrock'))
            provider = 'aws';
    }
    if (parts.length >= 2) {
        model = parts[1];
    }
    else {
        model = llmString;
    }
    return { provider, model };
}
/**
 * Generate integration summary for LLM context
 */
export function generateIntegrationSummary(integrations) {
    const lines = [];
    lines.push(`# External Integrations`);
    lines.push(``);
    if (integrations.tools.length > 0) {
        lines.push(`## Tools (${integrations.tools.length})`);
        integrations.tools.forEach(tool => {
            lines.push(`- **${tool.name}** (${tool.type})`);
            if (tool.requiredEnvVars.length > 0) {
                lines.push(`  - Required: ${tool.requiredEnvVars.join(', ')}`);
            }
        });
        lines.push(``);
    }
    if (integrations.apis.length > 0) {
        lines.push(`## APIs (${integrations.apis.length})`);
        integrations.apis.forEach(api => {
            lines.push(`- **${api.name}**`);
            lines.push(`  - Operations: ${api.operations.join(', ')}`);
            if (api.envVar) {
                lines.push(`  - Required: ${api.envVar}`);
            }
        });
        lines.push(``);
    }
    if (integrations.databases.length > 0) {
        lines.push(`## Databases (${integrations.databases.length})`);
        integrations.databases.forEach(db => {
            lines.push(`- **${db.type}**`);
            lines.push(`  - Operations: ${db.operations.join(', ')}`);
            if (db.requiredEnvVars.length > 0) {
                lines.push(`  - Required: ${db.requiredEnvVars.join(', ')}`);
            }
        });
        lines.push(``);
    }
    if (integrations.fileOperations.reads.length > 0 || integrations.fileOperations.writes.length > 0) {
        lines.push(`## File Operations`);
        if (integrations.fileOperations.reads.length > 0) {
            lines.push(`- Reads: ${integrations.fileOperations.reads.join(', ')}`);
        }
        if (integrations.fileOperations.writes.length > 0) {
            lines.push(`- Writes: ${integrations.fileOperations.writes.join(', ')}`);
        }
        if (integrations.fileOperations.formats.length > 0) {
            lines.push(`- Formats: ${integrations.fileOperations.formats.join(', ')}`);
        }
        lines.push(``);
    }
    if (integrations.llmProviders.length > 0) {
        lines.push(`## LLM Providers`);
        integrations.llmProviders.forEach(llm => {
            lines.push(`- Agent **${llm.agent}**: ${llm.provider}/${llm.model}`);
        });
        lines.push(``);
    }
    return lines.join('\n');
}
//# sourceMappingURL=crew-integration-detector.js.map