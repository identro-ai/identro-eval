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
import * as fs from 'fs/promises';
import * as path from 'path';
const glob = require('glob').glob;
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { PYTHON_AGENT_PATTERNS, TYPESCRIPT_AGENT_PATTERNS, shouldExcludePath, getFileLanguage, classifyAgentType, } from './utils/patterns';
const { execa } = require('execa');
/**
 * Discovers agents in Python files using pattern matching and AST parsing
 *
 * @param projectPath - Root directory of the project
 * @returns Array of discovered Python agents
 */
async function discoverPythonAgents(projectPath) {
    const agents = [];
    // Find all Python files
    const pythonFiles = await glob('**/*.py', {
        cwd: projectPath,
        ignore: ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/env/**'],
    });
    for (const file of pythonFiles) {
        if (shouldExcludePath(file))
            continue;
        try {
            const filePath = path.join(projectPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            // Skip files without LangChain imports
            if (!content.includes('langchain'))
                continue;
            // Use Python AST parsing via subprocess for accurate detection
            const pythonScript = `
import ast
import json
import sys

def find_agents(code):
    agents = []
    try:
        tree = ast.parse(code)
        
        for node in ast.walk(tree):
            # Find class definitions
            if isinstance(node, ast.ClassDef):
                if 'Agent' in node.name or 'Chain' in node.name or 'Router' in node.name:
                    agents.append({
                        'type': 'class',
                        'name': node.name,
                        'line': node.lineno,
                        'bases': [base.id if isinstance(base, ast.Name) else str(base) for base in node.bases]
                    })
            
            # Find variable assignments
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        # Check if it's an agent-related assignment
                        if isinstance(node.value, ast.Call):
                            func_name = ''
                            if isinstance(node.value.func, ast.Name):
                                func_name = node.value.func.id
                            elif isinstance(node.value.func, ast.Attribute):
                                func_name = node.value.func.attr
                            
                            if any(keyword in func_name for keyword in ['Agent', 'Chain', 'create_', 'Retrieval']):
                                agents.append({
                                    'type': 'variable',
                                    'name': target.id,
                                    'line': node.lineno,
                                    'function': func_name
                                })
    except:
        pass
    
    return agents

code = sys.stdin.read()
agents = find_agents(code)
print(json.dumps(agents))
`;
            try {
                // Execute Python script to parse AST
                const { stdout } = await execa('python3', ['-c', pythonScript], {
                    input: content,
                    timeout: 5000,
                });
                const parsedAgents = JSON.parse(stdout);
                for (const agent of parsedAgents) {
                    const agentType = classifyAgentType(content, file, PYTHON_AGENT_PATTERNS);
                    agents.push({
                        id: `${file}:${agent.name}`,
                        name: agent.name,
                        type: agentType,
                        path: file,
                        framework: 'langchain',
                        language: 'python',
                        lineNumber: agent.line,
                        className: agent.type === 'class' ? agent.name : undefined,
                        variableName: agent.type === 'variable' ? agent.name : undefined,
                        functionName: agent.function,
                        description: `${agent.type === 'class' ? 'Class' : 'Instance'}: ${agent.name}`,
                        metadata: {
                            discoveryType: agent.type,
                            bases: agent.bases,
                        },
                    });
                }
            }
            catch (error) {
                // Python parsing failed, fall back to regex patterns
                console.warn(`Python AST parsing failed for ${file}, using regex fallback`);
                // Apply regex patterns
                for (const pattern of PYTHON_AGENT_PATTERNS) {
                    const matches = content.matchAll(pattern.pattern);
                    for (const match of matches) {
                        const name = match[1] || match[0];
                        const lineNumber = content.substring(0, match.index).split('\n').length;
                        agents.push({
                            id: `${file}:${name}:${lineNumber}`,
                            name,
                            type: pattern.agentType,
                            path: file,
                            framework: 'langchain',
                            language: 'python',
                            lineNumber,
                            description: pattern.description,
                            metadata: {
                                discoveryType: pattern.type,
                                pattern: pattern.description,
                            },
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }
    return agents;
}
/**
 * Discovers agents in TypeScript/JavaScript files using Babel AST parsing
 *
 * @param projectPath - Root directory of the project
 * @returns Array of discovered TypeScript/JavaScript agents
 */
async function discoverTypeScriptAgents(projectPath) {
    const agents = [];
    // Find all TypeScript and JavaScript files
    const patterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs'];
    for (const pattern of patterns) {
        const files = await glob(pattern, {
            cwd: projectPath,
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        });
        for (const file of files) {
            if (shouldExcludePath(file))
                continue;
            try {
                const filePath = path.join(projectPath, file);
                const content = await fs.readFile(filePath, 'utf-8');
                // Skip files without LangChain imports
                if (!content.includes('langchain') && !content.includes('@langchain'))
                    continue;
                const language = getFileLanguage(file);
                // Parse with Babel
                try {
                    const ast = parser.parse(content, {
                        sourceType: 'module',
                        plugins: ['typescript', 'jsx'],
                        errorRecovery: true,
                    });
                    // Track imports
                    const imports = [];
                    traverse(ast, {
                        // Track imports
                        ImportDeclaration(nodePath) {
                            const source = nodePath.node.source.value;
                            if (source.includes('langchain') || source.includes('@langchain')) {
                                imports.push(source);
                            }
                        },
                        // Find class declarations
                        ClassDeclaration(nodePath) {
                            const className = nodePath.node.id?.name;
                            if (!className)
                                return;
                            // Check if it's an agent-related class
                            if (className.includes('Agent') ||
                                className.includes('Chain') ||
                                className.includes('Router')) {
                                const lineNumber = nodePath.node.loc?.start.line;
                                const agentType = classifyAgentType(content, file, TYPESCRIPT_AGENT_PATTERNS);
                                agents.push({
                                    id: `${file}:${className}`,
                                    name: className,
                                    type: agentType,
                                    path: file,
                                    framework: 'langchain',
                                    language,
                                    lineNumber,
                                    className,
                                    imports,
                                    description: `Class: ${className}`,
                                    metadata: {
                                        discoveryType: 'class',
                                        superClass: nodePath.node.superClass?.name,
                                    },
                                });
                            }
                        },
                        // Find variable declarations with agent instantiation
                        VariableDeclarator(nodePath) {
                            const varName = nodePath.node.id?.name;
                            if (!varName)
                                return;
                            const init = nodePath.node.init;
                            if (!init)
                                return;
                            // Check for new expressions
                            if (t.isNewExpression(init)) {
                                const className = init.callee?.name;
                                if (className && (className.includes('Agent') ||
                                    className.includes('Chain') ||
                                    className.includes('Executor'))) {
                                    const lineNumber = nodePath.node.loc?.start.line;
                                    const agentType = classifyAgentType(content, file, TYPESCRIPT_AGENT_PATTERNS);
                                    agents.push({
                                        id: `${file}:${varName}`,
                                        name: varName,
                                        type: agentType,
                                        path: file,
                                        framework: 'langchain',
                                        language,
                                        lineNumber,
                                        variableName: varName,
                                        className,
                                        imports,
                                        description: `Instance: ${varName} (${className})`,
                                        metadata: {
                                            discoveryType: 'variable',
                                            className,
                                        },
                                    });
                                }
                            }
                            // Check for function calls
                            if (t.isCallExpression(init) || t.isAwaitExpression(init)) {
                                const callExpr = t.isAwaitExpression(init) ? init.argument : init;
                                if (t.isCallExpression(callExpr)) {
                                    let funcName = '';
                                    if (t.isIdentifier(callExpr.callee)) {
                                        funcName = callExpr.callee.name;
                                    }
                                    else if (t.isMemberExpression(callExpr.callee)) {
                                        funcName = callExpr.callee.property?.name || '';
                                    }
                                    if (funcName.includes('create') ||
                                        funcName.includes('Agent') ||
                                        funcName.includes('Chain') ||
                                        funcName.includes('from')) {
                                        const lineNumber = nodePath.node.loc?.start.line;
                                        const agentType = classifyAgentType(content, file, TYPESCRIPT_AGENT_PATTERNS);
                                        agents.push({
                                            id: `${file}:${varName}`,
                                            name: varName,
                                            type: agentType,
                                            path: file,
                                            framework: 'langchain',
                                            language,
                                            lineNumber,
                                            variableName: varName,
                                            functionName: funcName,
                                            imports,
                                            description: `Factory: ${varName} via ${funcName}`,
                                            metadata: {
                                                discoveryType: 'function',
                                                factory: funcName,
                                            },
                                        });
                                    }
                                }
                            }
                        },
                    });
                }
                catch (parseError) {
                    // AST parsing failed, fall back to regex
                    console.warn(`Babel parsing failed for ${file}, using regex fallback`);
                    // Apply regex patterns
                    for (const pattern of TYPESCRIPT_AGENT_PATTERNS) {
                        const matches = content.matchAll(pattern.pattern);
                        for (const match of matches) {
                            const name = match[1] || 'unnamed';
                            const lineNumber = content.substring(0, match.index).split('\n').length;
                            agents.push({
                                id: `${file}:${name}:${lineNumber}`,
                                name,
                                type: pattern.agentType,
                                path: file,
                                framework: 'langchain',
                                language,
                                lineNumber,
                                description: pattern.description,
                                metadata: {
                                    discoveryType: pattern.type,
                                    pattern: pattern.description,
                                },
                            });
                        }
                    }
                }
            }
            catch (error) {
                console.error(`Error processing ${file}:`, error);
            }
        }
    }
    return agents;
}
/**
 * Main discovery function that finds all LangChain agents in a project
 *
 * @param projectPath - Root directory of the project
 * @returns Array of discovered agents
 */
export async function discoverAgents(projectPath) {
    try {
        // Run discovery for both Python and TypeScript
        const [pythonAgents, tsAgents] = await Promise.all([
            discoverPythonAgents(projectPath),
            discoverTypeScriptAgents(projectPath),
        ]);
        // Combine and deduplicate agents
        const allAgents = [...pythonAgents, ...tsAgents];
        // Deduplicate by ID
        const uniqueAgents = new Map();
        for (const agent of allAgents) {
            if (!uniqueAgents.has(agent.id)) {
                uniqueAgents.set(agent.id, agent);
            }
        }
        // Convert to AgentInfo array
        return Array.from(uniqueAgents.values()).map(agent => ({
            id: agent.id,
            name: agent.name,
            type: agent.type,
            path: agent.path,
            framework: agent.framework,
            description: agent.description,
            metadata: agent.metadata,
            dependencies: agent.tools,
        }));
    }
    catch (error) {
        console.error('Error discovering agents:', error);
        return [];
    }
}
/**
 * Discovers agents with detailed metadata
 *
 * @param projectPath - Root directory of the project
 * @returns Array of discovered agents with full metadata
 */
export async function discoverAgentsWithDetails(projectPath) {
    try {
        // Run discovery for both Python and TypeScript
        const [pythonAgents, tsAgents] = await Promise.all([
            discoverPythonAgents(projectPath),
            discoverTypeScriptAgents(projectPath),
        ]);
        // Combine agents
        const allAgents = [...pythonAgents, ...tsAgents];
        // Deduplicate by ID
        const uniqueAgents = new Map();
        for (const agent of allAgents) {
            if (!uniqueAgents.has(agent.id)) {
                uniqueAgents.set(agent.id, agent);
            }
        }
        return Array.from(uniqueAgents.values());
    }
    catch (error) {
        console.error('Error discovering agents:', error);
        return [];
    }
}
//# sourceMappingURL=discovery.js.map