"use strict";
/**
 * AST-based Python code parsing for CrewAI crews
 *
 * Provides robust parsing of Python crew files to extract:
 * - Crew definitions and configurations
 * - Agent and task references
 * - Tool usage dimensions
 * - External service integrations
 * - Control flow and error handling
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCrewFile = parseCrewFile;
const fs = __importStar(require("fs/promises"));
const child_process_1 = require("child_process");
/**
 * Parse crew Python file using AST to extract comprehensive crew information
 */
async function parseCrewFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        // Quick check if this is a crew file
        if (!isCrewFile(content)) {
            return null;
        }
        // Use Python AST parsing
        const astData = await parsePythonAST(filePath, content);
        if (!astData) {
            return null;
        }
        // Extract crew information from AST
        return extractCrewAST(astData, content);
    }
    catch (error) {
        console.error(`Error parsing crew file ${filePath}:`, error);
        return null;
    }
}
/**
 * Check if file contains crew dimensions
 */
function isCrewFile(content) {
    return ((content.includes('Crew(') || content.includes('from crewai import Crew')) &&
        !content.includes('@start') && // Exclude flows
        !content.includes('@listen') &&
        !content.includes('from crewai.flow import Flow'));
}
/**
 * Parse Python AST using subprocess
 */
async function parsePythonAST(filePath, content) {
    const pythonScript = `
import ast
import json
import sys

def ast_to_dict(node):
    if isinstance(node, ast.AST):
        result = {'type': node.__class__.__name__}
        for field, value in ast.iter_fields(node):
            if isinstance(value, list):
                result[field] = [ast_to_dict(item) for item in value]
            elif isinstance(value, ast.AST):
                result[field] = ast_to_dict(value)
            else:
                result[field] = value
        
        if hasattr(node, 'lineno'):
            result['lineno'] = node.lineno
        if hasattr(node, 'col_offset'):
            result['col_offset'] = node.col_offset
            
        return result
    else:
        return value

try:
    content = sys.stdin.read()
    tree = ast.parse(content)
    ast_dict = ast_to_dict(tree)
    print(json.dumps(ast_dict, indent=2))
    
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;
    return new Promise((resolve, reject) => {
        const python = (0, child_process_1.spawn)('python3', ['-c', pythonScript], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        let stdout = '';
        let stderr = '';
        python.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        python.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        python.on('close', (code) => {
            if (code === 0) {
                try {
                    const astData = JSON.parse(stdout);
                    resolve(astData);
                }
                catch (error) {
                    reject(new Error(`Failed to parse AST JSON: ${error}`));
                }
            }
            else {
                reject(new Error(`Python AST parsing failed: ${stderr}`));
            }
        });
        python.on('error', (error) => {
            reject(new Error(`Failed to spawn Python process: ${error}`));
        });
        python.stdin.write(content);
        python.stdin.end();
    });
}
/**
 * Extract crew AST information from parsed AST data
 */
function extractCrewAST(astData, content) {
    const crewAST = {
        crewDefinitions: [],
        toolUsage: [],
        externalCalls: [],
        controlFlow: [],
        errorHandling: [],
        imports: []
    };
    // Extract imports
    crewAST.imports = extractImports(astData);
    // Extract crew definitions
    crewAST.crewDefinitions = extractCrewDefinitions(astData, content);
    // Extract tool usage dimensions
    crewAST.toolUsage = extractToolUsage(astData, content);
    // Extract external calls
    crewAST.externalCalls = extractExternalCalls(astData, content);
    // Extract control flow dimensions
    crewAST.controlFlow = extractControlFlow(astData);
    // Extract error handling dimensions
    crewAST.errorHandling = extractErrorHandling(astData);
    return crewAST;
}
/**
 * Extract import statements
 */
function extractImports(astData) {
    const imports = [];
    function traverse(node) {
        if (node.type === 'Import') {
            node.names?.forEach((alias) => {
                imports.push({
                    module: alias.name || '',
                    names: [alias.asname || alias.name || ''],
                    isFromImport: false,
                    lineno: node.lineno || 0
                });
            });
        }
        else if (node.type === 'ImportFrom') {
            const names = node.names?.map((alias) => alias.name || '') || [];
            imports.push({
                module: node.module || '',
                names,
                isFromImport: true,
                lineno: node.lineno || 0
            });
        }
        // Traverse child nodes
        if (node.body)
            node.body.forEach(traverse);
        if (node.orelse)
            node.orelse.forEach(traverse);
        if (node.finalbody)
            node.finalbody.forEach(traverse);
    }
    if (astData.body) {
        astData.body.forEach(traverse);
    }
    return imports;
}
/**
 * Extract crew definitions from AST
 */
function extractCrewDefinitions(astData, content) {
    const crews = [];
    function traverse(node) {
        // Look for assignments like: crew = Crew(...)
        if (node.type === 'Assign' && node.value?.type === 'Call') {
            const callFunc = node.value.func;
            // Check if this is a Crew() call
            if ((callFunc?.type === 'Name' && callFunc.id === 'Crew') ||
                (callFunc?.type === 'Attribute' && callFunc.attr === 'Crew')) {
                const variableName = extractTargetName(node.targets?.[0]);
                if (variableName) {
                    const configuration = extractCrewConfiguration(node.value);
                    const docstring = extractNearbyDocstring(content, node.lineno);
                    crews.push({
                        name: variableName,
                        variableName,
                        lineno: node.lineno || 0,
                        configuration,
                        docstring
                    });
                }
            }
        }
        // Traverse child nodes
        if (node.body)
            node.body.forEach(traverse);
        if (node.orelse)
            node.orelse.forEach(traverse);
    }
    if (astData.body) {
        astData.body.forEach(traverse);
    }
    return crews;
}
/**
 * Extract target name from assignment
 */
function extractTargetName(target) {
    if (target?.type === 'Name') {
        return target.id || null;
    }
    return null;
}
/**
 * Extract crew configuration from Crew() call
 */
function extractCrewConfiguration(callNode) {
    const config = {
        agents: [],
        tasks: [],
        process: 'unknown'
    };
    // Extract keyword arguments
    callNode.keywords?.forEach((kw) => {
        const argName = kw.arg;
        const value = kw.value;
        switch (argName) {
            case 'agents':
                config.agents = extractListElements(value);
                break;
            case 'tasks':
                config.tasks = extractListElements(value);
                break;
            case 'process':
                config.process = extractProcessType(value);
                break;
            case 'memory':
                config.memory = extractBooleanValue(value);
                break;
            case 'cache':
                config.cache = extractBooleanValue(value);
                break;
            case 'verbose':
                config.verbose = extractBooleanValue(value);
                break;
            case 'manager_llm':
                config.manager_llm = extractStringValue(value);
                break;
            case 'manager_agent':
                config.manager_agent = extractStringValue(value);
                break;
            case 'planning':
                config.planning = extractBooleanValue(value);
                break;
            case 'planning_llm':
                config.planning_llm = extractStringValue(value);
                break;
        }
    });
    return config;
}
/**
 * Extract list elements from AST node
 */
function extractListElements(node) {
    if (node?.type === 'List') {
        return node.elts?.map((elt) => {
            if (elt.type === 'Name')
                return elt.id;
            if (elt.type === 'Constant')
                return String(elt.value);
            return 'unknown';
        }) || [];
    }
    return [];
}
/**
 * Extract process type from AST node
 */
function extractProcessType(node) {
    if (node?.type === 'Attribute' && node.value?.id === 'Process') {
        if (node.attr === 'sequential')
            return 'sequential';
        if (node.attr === 'hierarchical')
            return 'hierarchical';
    }
    return 'unknown';
}
/**
 * Extract boolean value from AST node
 */
function extractBooleanValue(node) {
    if (node?.type === 'Constant') {
        return Boolean(node.value);
    }
    return undefined;
}
/**
 * Extract string value from AST node
 */
function extractStringValue(node) {
    if (node?.type === 'Name') {
        return node.id;
    }
    if (node?.type === 'Constant' && typeof node.value === 'string') {
        return node.value;
    }
    return undefined;
}
/**
 * Extract nearby docstring
 */
function extractNearbyDocstring(content, lineno) {
    const lines = content.split('\n');
    // Look backwards for comments
    for (let i = lineno - 2; i >= 0 && i >= lineno - 5; i--) {
        const line = lines[i]?.trim();
        if (line?.startsWith('#')) {
            return line.substring(1).trim();
        }
    }
    return undefined;
}
/**
 * Extract tool usage dimensions
 */
function extractToolUsage(astData, content) {
    const tools = [];
    const toolNames = new Set();
    function traverse(node) {
        // Look for tool imports and usage
        if (node.type === 'Call' && node.func?.type === 'Name') {
            const funcName = node.func.id;
            if (funcName && funcName.includes('Tool')) {
                if (!toolNames.has(funcName)) {
                    toolNames.add(funcName);
                    tools.push({
                        toolName: funcName,
                        toolType: determineToolType(funcName),
                        usageContext: ['crew_definition'],
                        lineno: node.lineno || 0
                    });
                }
            }
        }
        // Traverse child nodes
        if (node.body && Array.isArray(node.body))
            node.body.forEach(traverse);
        if (node.value)
            traverse(node.value);
        if (node.args && Array.isArray(node.args))
            node.args.forEach(traverse);
    }
    if (astData.body) {
        astData.body.forEach(traverse);
    }
    return tools;
}
/**
 * Determine tool type
 */
function determineToolType(toolName) {
    const builtinTools = ['SerperDevTool', 'ScrapeWebsiteTool', 'FileReadTool', 'FileWriteTool'];
    const integrationTools = ['SlackTool', 'TrelloTool', 'GmailTool', 'GitHubTool'];
    if (builtinTools.some(t => toolName.includes(t)))
        return 'builtin';
    if (integrationTools.some(t => toolName.includes(t)))
        return 'integration';
    return 'custom';
}
/**
 * Extract external calls
 */
function extractExternalCalls(astData, content) {
    const calls = [];
    function traverse(node) {
        if (node.type === 'Call' && node.func?.type === 'Attribute') {
            const obj = node.func.value;
            const method = node.func.attr;
            // Check for API calls
            if (obj?.id === 'requests' || obj?.attr === 'requests') {
                calls.push({
                    service: 'http_api',
                    method: method || 'unknown',
                    callType: 'api',
                    envVars: extractEnvVarsFromCall(node),
                    lineno: node.lineno || 0
                });
            }
            // Check for database calls
            if (content.includes('sqlite') || content.includes('postgres')) {
                if (['execute', 'commit', 'query'].includes(method)) {
                    calls.push({
                        service: 'database',
                        method,
                        callType: 'database',
                        envVars: [],
                        lineno: node.lineno || 0
                    });
                }
            }
            // Check for file operations
            if (['open', 'read', 'write', 'save', 'load'].includes(method)) {
                calls.push({
                    service: 'file_system',
                    method,
                    callType: 'file',
                    envVars: [],
                    lineno: node.lineno || 0
                });
            }
        }
        // Traverse child nodes
        if (node.body && Array.isArray(node.body))
            node.body.forEach(traverse);
        if (node.value)
            traverse(node.value);
        if (node.args && Array.isArray(node.args))
            node.args.forEach(traverse);
    }
    if (astData.body) {
        astData.body.forEach(traverse);
    }
    return calls;
}
/**
 * Extract environment variables from call
 */
function extractEnvVarsFromCall(node) {
    const envVars = [];
    function findEnvVars(n) {
        if (n?.type === 'Subscript' && n.value?.id === 'os' && n.slice?.value?.s) {
            envVars.push(n.slice.value.s);
        }
        if (n?.args)
            n.args.forEach(findEnvVars);
        if (n?.keywords)
            n.keywords.forEach((kw) => findEnvVars(kw.value));
    }
    findEnvVars(node);
    return envVars;
}
/**
 * Extract control flow dimensions
 */
function extractControlFlow(astData) {
    const dimensions = [];
    function traverse(node) {
        if (node.type === 'If') {
            dimensions.push({
                type: 'conditional',
                condition: 'if_statement',
                lineno: node.lineno || 0
            });
        }
        else if (node.type === 'For' || node.type === 'While') {
            dimensions.push({
                type: 'loop',
                lineno: node.lineno || 0
            });
        }
        else if (node.type === 'Try') {
            dimensions.push({
                type: 'try_except',
                lineno: node.lineno || 0
            });
        }
        else if (node.type === 'With') {
            dimensions.push({
                type: 'context_manager',
                lineno: node.lineno || 0
            });
        }
        // Traverse child nodes
        if (node.body)
            node.body.forEach(traverse);
        if (node.orelse)
            node.orelse.forEach(traverse);
        if (node.finalbody)
            node.finalbody.forEach(traverse);
    }
    if (astData.body) {
        astData.body.forEach(traverse);
    }
    return dimensions;
}
/**
 * Extract error handling dimensions
 */
function extractErrorHandling(astData) {
    const dimensions = [];
    function traverse(node) {
        if (node.type === 'Try') {
            const exceptionTypes = [];
            let hasRetry = false;
            let hasFallback = false;
            // Extract exception types
            node.handlers?.forEach((handler) => {
                if (handler.type === 'ExceptHandler') {
                    if (handler.type_?.id) {
                        exceptionTypes.push(handler.type_.id);
                    }
                    // Check for retry logic
                    if (handler.body) {
                        const bodyStr = JSON.stringify(handler.body);
                        if (bodyStr.includes('retry') || bodyStr.includes('attempt')) {
                            hasRetry = true;
                        }
                        if (bodyStr.includes('fallback') || bodyStr.includes('default')) {
                            hasFallback = true;
                        }
                    }
                }
            });
            dimensions.push({
                exceptionTypes,
                hasRetry,
                hasFallback,
                lineno: node.lineno || 0
            });
        }
        // Traverse child nodes
        if (node.body)
            node.body.forEach(traverse);
        if (node.orelse)
            node.orelse.forEach(traverse);
        if (node.finalbody)
            node.finalbody.forEach(traverse);
    }
    if (astData.body) {
        astData.body.forEach(traverse);
    }
    return dimensions;
}
//# sourceMappingURL=crew-ast-parser.js.map