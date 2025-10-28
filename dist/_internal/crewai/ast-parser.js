"use strict";
/**
 * AST-based Python code parsing for CrewAI flows
 *
 * Provides robust parsing of Python code to extract flow patterns,
 * decorators, and complex behavioral patterns that regex cannot handle.
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
exports.parseFlowFile = parseFlowFile;
const fs = __importStar(require("fs/promises"));
/**
 * Parse Python file using AST to extract flow information
 */
async function parseFlowFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        // Quick check if this is a flow file
        if (!isFlowFile(content)) {
            return null;
        }
        // Use Python AST parsing via subprocess
        const astData = await parsePythonAST(filePath, content);
        if (!astData) {
            return null;
        }
        // Extract flow information from AST
        return extractFlowSignals(astData, content);
    }
    catch (error) {
        console.error(`Error parsing flow file ${filePath}:`, error);
        return null;
    }
}
/**
 * Check if file contains flow dimensions
 */
function isFlowFile(content) {
    return (content.includes('@start') ||
        content.includes('@listen') ||
        content.includes('@router') ||
        content.includes('from crewai.flow') ||
        content.includes('import Flow') ||
        content.includes('class ') && content.includes('Flow'));
}
/**
 * Parse Python AST using subprocess
 */
async function parsePythonAST(filePath, content) {
    const { spawn } = require('child_process');
    // Create Python script to parse AST
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
        
        # Add line number and column offset if available
        if hasattr(node, 'lineno'):
            result['lineno'] = node.lineno
        if hasattr(node, 'col_offset'):
            result['col_offset'] = node.col_offset
            
        return result
    else:
        return value

try:
    # Read the file content from stdin
    content = sys.stdin.read()
    
    # Parse the AST
    tree = ast.parse(content)
    
    # Convert to dictionary and output as JSON
    ast_dict = ast_to_dict(tree)
    print(json.dumps(ast_dict, indent=2))
    
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;
    return new Promise((resolve, reject) => {
        const python = spawn('python3', ['-c', pythonScript], {
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
        // Send the file content to Python
        python.stdin.write(content);
        python.stdin.end();
    });
}
/**
 * Extract flow signals from AST data
 */
function extractFlowSignals(astData, content) {
    const classes = findClassDefinitions(astData);
    // Find the actual Flow class (not just any class with "Flow" in the name)
    const flowClass = classes.find(cls => cls.baseClasses.some(base => base.includes('Flow')) ||
        (cls.name.includes('Flow') && !cls.name.includes('State') && !cls.name.includes('Model')));
    if (!flowClass) {
        throw new Error('No flow class found in file');
    }
    // Extract behavioral patterns
    const behavioralPatterns = extractBehavioralPatterns(flowClass, content);
    // Extract external interactions
    const externalInteractions = extractExternalInteractions(flowClass, content);
    // Extract state management
    const stateManagement = extractStateManagement(flowClass, content);
    // Extract routing logic
    const routingLogic = extractRoutingLogic(flowClass, content);
    // Extract CrewAI-specific signals
    const frameworkSpecific = extractCrewAISignals(flowClass, content);
    return {
        className: flowClass.name,
        methods: flowClass.methods,
        behavioralPatterns,
        externalInteractions,
        stateManagement,
        routingLogic,
        frameworkSpecific
    };
}
/**
 * Find class definitions in AST
 */
function findClassDefinitions(astData) {
    const classes = [];
    function traverse(node) {
        if (node.type === 'ClassDef') {
            const classInfo = {
                name: node.name || 'Unknown',
                decorators: extractDecorators(node),
                methods: extractMethods(node),
                baseClasses: extractBaseClasses(node),
                lineno: node.lineno || 0,
                docstring: extractDocstring(node)
            };
            classes.push(classInfo);
        }
        // Recursively traverse child nodes
        if (node.body) {
            node.body.forEach(traverse);
        }
    }
    if (astData.body) {
        astData.body.forEach(traverse);
    }
    return classes;
}
/**
 * Extract decorators from AST node
 */
function extractDecorators(node) {
    const decorators = [];
    if (node.decorator_list) {
        for (const decorator of node.decorator_list) {
            if (decorator.type === 'Name' && decorator.id) {
                decorators.push(decorator.id);
            }
            else if (decorator.type === 'Attribute' && decorator.value?.id && decorator.attr) {
                decorators.push(`${decorator.value.id}.${decorator.attr}`);
            }
            else if (decorator.type === 'Call') {
                if (decorator.func?.type === 'Name' && decorator.func.id) {
                    decorators.push(decorator.func.id);
                }
                else if (decorator.func?.type === 'Attribute' && decorator.func.value?.id && decorator.func.attr) {
                    decorators.push(`${decorator.func.value.id}.${decorator.func.attr}`);
                }
            }
        }
    }
    return decorators;
}
/**
 * Extract methods from class AST node
 */
function extractMethods(classNode) {
    const methods = [];
    if (classNode.body) {
        for (const node of classNode.body) {
            if (node.type === 'FunctionDef' || node.type === 'AsyncFunctionDef') {
                const methodInfo = {
                    name: node.name || 'unknown',
                    decorators: extractDecorators(node),
                    parameters: extractParameters(node),
                    lineno: node.lineno || 0,
                    isAsync: node.type === 'AsyncFunctionDef',
                    docstring: extractDocstring(node)
                };
                methods.push(methodInfo);
            }
        }
    }
    return methods;
}
/**
 * Extract parameters from function AST node
 */
function extractParameters(funcNode) {
    const parameters = [];
    if (funcNode.args?.args && Array.isArray(funcNode.args.args)) {
        for (const arg of funcNode.args.args) {
            if (arg.arg) {
                parameters.push(arg.arg);
            }
        }
    }
    return parameters;
}
/**
 * Extract base classes from class AST node
 */
function extractBaseClasses(classNode) {
    const baseClasses = [];
    if (classNode.bases) {
        for (const base of classNode.bases) {
            if (base.type === 'Name' && base.id) {
                baseClasses.push(base.id);
            }
            else if (base.type === 'Attribute' && base.value?.id && base.attr) {
                baseClasses.push(`${base.value.id}.${base.attr}`);
            }
        }
    }
    return baseClasses;
}
/**
 * Extract docstring from AST node
 */
function extractDocstring(node) {
    if (node.body && node.body.length > 0) {
        const firstNode = node.body[0];
        if (firstNode.type === 'Expr' && firstNode.value?.type === 'Str') {
            return firstNode.value.s;
        }
    }
    return undefined;
}
/**
 * Extract behavioral patterns from flow class
 */
function extractBehavioralPatterns(flowClass, content) {
    return {
        // Existing dimensions
        collectsUserInput: content.includes('input(') || content.includes('get_user_input'),
        makesLLMCalls: content.includes('llm') || content.includes('openai') || content.includes('anthropic'),
        hasFileIO: content.includes('open(') || content.includes('with open') || content.includes('fs.'),
        hasConditionalLogic: content.includes('if ') || content.includes('elif ') || content.includes('else:'),
        hasLoops: content.includes('for ') || content.includes('while '),
        // NEW: Crew orchestration dimensions
        executesCrews: content.includes('.kickoff') || content.includes('Crew('),
        crewCount: (content.match(/\.kickoff/g) || []).length,
        crewChaining: content.includes('crew_output') || content.includes('previous_result'),
        parallelCrews: content.includes('asyncio.gather') || content.includes('concurrent.futures'),
        // NEW: Advanced dimensions
        hasHumanInLoop: flowClass.methods.some(m => m.name.includes('human') || m.name.includes('approval')),
        hasExternalIntegrations: content.includes('requests.') || content.includes('slack') || content.includes('trello'),
        hasStateEvolution: content.includes('state.') || content.includes('self.state'),
        hasParallelExecution: content.includes('asyncio') || content.includes('threading'),
        hasInfiniteLoop: content.includes('while True') || content.includes('infinite')
    };
}
/**
 * Extract external interactions from flow class
 */
function extractExternalInteractions(flowClass, content) {
    const crews = extractCrewReferences(content);
    const apis = extractAPIReferences(content);
    const services = extractExternalServices(content);
    return {
        crews,
        apis,
        databases: content.includes('sqlite') || content.includes('postgres') || content.includes('mongodb'),
        fileOperations: {
            reads: content.includes('read') || content.includes('load'),
            writes: content.includes('write') || content.includes('save'),
            formats: extractFileFormats(content)
        },
        services
    };
}
/**
 * Extract crew references from content
 */
function extractCrewReferences(content) {
    const crews = [];
    const crewDimension = /(\w+)\.kickoff/g;
    let match;
    while ((match = crewDimension.exec(content)) !== null) {
        crews.push(match[1]);
    }
    return [...new Set(crews)]; // Remove duplicates
}
/**
 * Extract API references from content
 */
function extractAPIReferences(content) {
    const apis = [];
    if (content.includes('requests.'))
        apis.push('HTTP');
    if (content.includes('slack'))
        apis.push('Slack');
    if (content.includes('trello'))
        apis.push('Trello');
    if (content.includes('gmail'))
        apis.push('Gmail');
    if (content.includes('github'))
        apis.push('GitHub');
    return apis;
}
/**
 * Extract external services from content
 */
function extractExternalServices(content) {
    const services = [];
    if (content.includes('slack')) {
        services.push({
            name: 'slack',
            envVar: 'SLACK_TOKEN',
            operations: ['post', 'read']
        });
    }
    if (content.includes('trello')) {
        services.push({
            name: 'trello',
            envVar: 'TRELLO_API_KEY',
            operations: ['create', 'update', 'read']
        });
    }
    if (content.includes('gmail')) {
        services.push({
            name: 'gmail',
            envVar: 'GMAIL_CREDENTIALS',
            operations: ['send', 'read']
        });
    }
    return services;
}
/**
 * Extract file formats from content
 */
function extractFileFormats(content) {
    const formats = [];
    if (content.includes('.csv') || content.includes('csv.'))
        formats.push('CSV');
    if (content.includes('.json') || content.includes('json.'))
        formats.push('JSON');
    if (content.includes('.md') || content.includes('markdown'))
        formats.push('MD');
    if (content.includes('.html') || content.includes('html'))
        formats.push('HTML');
    if (content.includes('.pdf'))
        formats.push('PDF');
    if (content.includes('.docx') || content.includes('.doc'))
        formats.push('DOCX');
    return formats;
}
/**
 * Extract state management information
 */
function extractStateManagement(flowClass, content) {
    const hasStateModel = content.includes('BaseModel') || content.includes('pydantic');
    const stateFields = extractStateFields(content);
    const stateEvolution = extractStateEvolution(content);
    return {
        type: hasStateModel ? 'structured' : 'unstructured',
        stateModel: hasStateModel ? extractStateModelName(content) : undefined,
        stateFields,
        stateEvolution
    };
}
/**
 * Extract state fields from content
 */
function extractStateFields(content) {
    const fields = [];
    const stateDimension = /state\.(\w+)/g;
    let match;
    while ((match = stateDimension.exec(content)) !== null) {
        fields.push(match[1]);
    }
    return [...new Set(fields)]; // Remove duplicates
}
/**
 * Extract state evolution dimensions
 */
function extractStateEvolution(content) {
    const evolution = [];
    if (content.includes('state.update'))
        evolution.push('update');
    if (content.includes('state.append'))
        evolution.push('append');
    if (content.includes('state.reset'))
        evolution.push('reset');
    if (content.includes('state ='))
        evolution.push('assignment');
    return evolution;
}
/**
 * Extract state model name
 */
function extractStateModelName(content) {
    const modelDimension = /class (\w+)\(BaseModel\)/;
    const match = modelDimension.exec(content);
    return match ? match[1] : undefined;
}
/**
 * Extract routing logic from flow class
 */
function extractRoutingLogic(flowClass, content) {
    const routerMethods = flowClass.methods
        .filter(m => m.decorators.includes('router'))
        .map(m => m.name);
    const routerLabels = extractRouterLabels(content);
    const conditionalPaths = extractConditionalPaths(content);
    return {
        routerMethods,
        routerLabels,
        conditionalPaths
    };
}
/**
 * Extract router labels from content
 */
function extractRouterLabels(content) {
    const labels = [];
    const returnDimension = /return\s+["'](\w+)["']/g;
    let match;
    while ((match = returnDimension.exec(content)) !== null) {
        labels.push(match[1]);
    }
    return [...new Set(labels)]; // Remove duplicates
}
/**
 * Extract conditional paths from content
 */
function extractConditionalPaths(content) {
    const paths = [];
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        if (line.trim().startsWith('if ') || line.trim().startsWith('elif ')) {
            const condition = line.trim();
            const target = 'next_step'; // Simplified - would need more complex analysis
            paths.push({
                condition,
                target,
                lineno: index + 1
            });
        }
    });
    return paths;
}
/**
 * Extract CrewAI-specific signals
 */
function extractCrewAISignals(flowClass, content) {
    const starts = flowClass.methods
        .filter(m => m.decorators.includes('start'))
        .map(m => m.name);
    const listeners = extractListeners(flowClass, content);
    const routers = extractRouters(flowClass, content);
    const persisters = flowClass.methods
        .filter(m => m.decorators.includes('persist'))
        .map(m => m.name);
    const combinators = extractCombinators(content);
    const asyncMethods = flowClass.methods
        .filter(m => m.isAsync)
        .map(m => m.name);
    return {
        decorators: {
            starts,
            listeners,
            routers,
            persisters
        },
        combinators,
        asyncMethods,
        yamlConfigs: {
            agents: content.includes('agents.yaml') ? 'agents.yaml' : undefined,
            tasks: content.includes('tasks.yaml') ? 'tasks.yaml' : undefined
        }
    };
}
/**
 * Extract listener information
 */
function extractListeners(flowClass, content) {
    const listeners = [];
    flowClass.methods.forEach(method => {
        if (method.decorators.some(d => d.includes('listen'))) {
            const listenerInfo = {
                method: method.name,
                listensTo: extractListenTargets(content, method.name),
                combinator: extractListenCombinator(content, method.name)
            };
            listeners.push(listenerInfo);
        }
    });
    return listeners;
}
/**
 * Extract listen targets for a method
 */
function extractListenTargets(content, methodName) {
    const targets = [];
    const listenDimension = new RegExp(`@listen\\(([^)]+)\\)\\s*(?:async\\s+)?def\\s+${methodName}`, 's');
    const match = listenDimension.exec(content);
    if (match) {
        const listenArgs = match[1];
        // Handle string literals like @listen("complete")
        const stringDimension = /["']([^"']+)["']/g;
        let stringMatch;
        while ((stringMatch = stringDimension.exec(listenArgs)) !== null) {
            targets.push(stringMatch[1]);
        }
        // Handle method references like @listen(generate_shakespeare_x_post)
        const methodDimension = /\b(\w+)\b/g;
        let methodMatch;
        while ((methodMatch = methodDimension.exec(listenArgs)) !== null) {
            const methodName = methodMatch[1];
            if (!methodName.includes('and_') &&
                !methodName.includes('or_') &&
                !targets.includes(methodName) &&
                methodName !== 'and' &&
                methodName !== 'or') {
                targets.push(methodName);
            }
        }
    }
    return targets;
}
/**
 * Extract listen combinator for a method
 */
function extractListenCombinator(content, methodName) {
    const listenDimension = new RegExp(`@listen\\(([^)]+)\\)\\s*def\\s+${methodName}`, 's');
    const match = listenDimension.exec(content);
    if (match) {
        const listenArgs = match[1];
        if (listenArgs.includes('and_'))
            return 'and_';
        if (listenArgs.includes('or_'))
            return 'or_';
    }
    return undefined;
}
/**
 * Extract router information
 */
function extractRouters(flowClass, content) {
    const routers = [];
    flowClass.methods.forEach(method => {
        if (method.decorators.includes('router')) {
            const routerInfo = {
                method: method.name,
                labels: extractRouterLabelsForMethod(content, method.name),
                conditions: extractRouterConditions(content, method.name)
            };
            routers.push(routerInfo);
        }
    });
    return routers;
}
/**
 * Extract router labels for a specific method
 */
function extractRouterLabelsForMethod(content, methodName) {
    const labels = [];
    // Find the method definition
    const methodStart = content.indexOf(`def ${methodName}`);
    if (methodStart === -1)
        return labels;
    // Find method end (next method or end of class)
    const methodEnd = content.indexOf('\n    def ', methodStart + 1);
    const methodContent = content.substring(methodStart, methodEnd !== -1 ? methodEnd : content.length);
    // Extract all return statements with string literals
    const returnDimension = /return\s+["']([^"']+)["']/g;
    let match;
    while ((match = returnDimension.exec(methodContent)) !== null) {
        labels.push(match[1]);
    }
    return [...new Set(labels)]; // Remove duplicates
}
/**
 * Extract router conditions for a specific method
 */
function extractRouterConditions(content, methodName) {
    const conditions = [];
    const methodStart = content.indexOf(`def ${methodName}`);
    if (methodStart !== -1) {
        const methodEnd = content.indexOf('\n    def ', methodStart + 1);
        const methodContent = content.substring(methodStart, methodEnd !== -1 ? methodEnd : content.length);
        const ifDimension = /if\s+([^:]+):/g;
        let match;
        while ((match = ifDimension.exec(methodContent)) !== null) {
            conditions.push(match[1].trim());
        }
    }
    return conditions;
}
/**
 * Extract combinators used in the content
 */
function extractCombinators(content) {
    const combinators = [];
    if (content.includes('and_('))
        combinators.push('and_');
    if (content.includes('or_('))
        combinators.push('or_');
    return combinators;
}
//# sourceMappingURL=ast-parser.js.map