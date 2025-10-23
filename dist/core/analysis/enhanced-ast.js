"use strict";
/**
 * Enhanced AST analyzer with variable tracking and import resolution
 *
 * Provides comprehensive AST analysis for both Python and TypeScript/JavaScript,
 * tracking variables across scopes and resolving imports.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedASTAnalyzer = void 0;
const parser = __importStar(require("@babel/parser"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const t = __importStar(require("@babel/types"));
const execa_1 = require("execa");
const variable_tracker_1 = require("./variable-tracker");
const import_resolver_1 = require("./import-resolver");
/**
 * Enhanced AST analyzer
 */
class EnhancedASTAnalyzer {
    variableTracker;
    importResolver;
    constructor(projectRoot) {
        this.variableTracker = new variable_tracker_1.VariableTracker();
        this.importResolver = new import_resolver_1.ImportResolver(projectRoot);
    }
    /**
     * Track variables across scopes
     */
    trackVariables(ast, language) {
        const variables = {};
        if (language === 'javascript') {
            this.trackJavaScriptVariables(ast);
        }
        else {
            // For Python, we'll use a different approach
            // This would require Python AST parsing
        }
        // Convert tracked variables to VariableMap
        const allVars = this.variableTracker.getAllVariables();
        allVars.forEach((variable, name) => {
            variables[name] = {
                value: this.variableTracker.getFinalValue(name),
                type: variable.type,
                scope: variable.scope,
                mutations: variable.mutations.length,
                references: variable.references.length,
            };
        });
        return variables;
    }
    /**
     * Track JavaScript/TypeScript variables
     */
    trackJavaScriptVariables(ast) {
        (0, traverse_1.default)(ast, {
            // Track function declarations
            FunctionDeclaration: (path) => {
                const name = path.node.id?.name;
                if (name) {
                    this.variableTracker.enterScope('function', name);
                }
            },
            // Exit function scope
            exit: (path) => {
                if (t.isFunctionDeclaration(path.node)) {
                    this.variableTracker.exitScope();
                }
                else if (t.isArrowFunctionExpression(path.node)) {
                    this.variableTracker.exitScope();
                }
                else if (t.isClassDeclaration(path.node)) {
                    this.variableTracker.exitScope();
                }
            },
            // Track arrow functions
            ArrowFunctionExpression: () => {
                this.variableTracker.enterScope('function', 'arrow');
            },
            // Track class declarations
            ClassDeclaration: (path) => {
                const name = path.node.id?.name;
                if (name) {
                    this.variableTracker.enterScope('class', name);
                }
            },
            // Track variable declarations
            VariableDeclarator: (path) => {
                if (t.isIdentifier(path.node.id)) {
                    const name = path.node.id.name;
                    const value = this.extractValue(path.node.init);
                    const type = this.inferType(path.node.init);
                    const lineNumber = path.node.loc?.start.line || 0;
                    this.variableTracker.trackAssignment(name, value, type, lineNumber);
                }
            },
            // Track assignments
            AssignmentExpression: (path) => {
                if (t.isIdentifier(path.node.left)) {
                    const name = path.node.left.name;
                    const value = this.extractValue(path.node.right);
                    const lineNumber = path.node.loc?.start.line || 0;
                    if (path.node.operator === '=') {
                        this.variableTracker.trackMutation(name, 'assignment', value, lineNumber);
                    }
                    else if (path.node.operator === '+=') {
                        this.variableTracker.trackMutation(name, 'concatenation', value, lineNumber);
                    }
                }
            },
            // Track binary expressions (concatenation)
            BinaryExpression: (path) => {
                if (path.node.operator === '+') {
                    const left = this.extractIdentifier(path.node.left);
                    const right = this.extractIdentifier(path.node.right);
                    const lineNumber = path.node.loc?.start.line || 0;
                    if (left && right) {
                        // Track as potential string concatenation
                        const parent = path.parent;
                        if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
                            const targetVar = parent.id.name;
                            this.variableTracker.trackMutation(targetVar, 'concatenation', { left, right }, lineNumber);
                        }
                    }
                }
            },
            // Track method calls (join, format, etc.)
            CallExpression: (path) => {
                const callee = path.node.callee;
                // Track array.join()
                if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
                    const methodName = callee.property.name;
                    const object = this.extractIdentifier(callee.object);
                    const lineNumber = path.node.loc?.start.line || 0;
                    if (methodName === 'join' && object) {
                        const separator = path.node.arguments[0];
                        const sepValue = t.isStringLiteral(separator) ? separator.value : '';
                        // Track join operation
                        const parent = path.parent;
                        if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
                            const targetVar = parent.id.name;
                            this.variableTracker.trackMutation(targetVar, 'join', sepValue, lineNumber);
                        }
                    }
                }
            },
            // Track template literals
            TemplateLiteral: (path) => {
                const lineNumber = path.node.loc?.start.line || 0;
                const parts = [];
                const variables = [];
                for (let i = 0; i < path.node.quasis.length; i++) {
                    parts.push(path.node.quasis[i].value.raw);
                    if (i < path.node.expressions.length) {
                        const expr = path.node.expressions[i];
                        if (t.isIdentifier(expr)) {
                            variables.push(expr.name);
                            this.variableTracker.trackReference(expr.name, 'access', lineNumber);
                        }
                    }
                }
                // Track template literal as a format operation
                const parent = path.parent;
                if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
                    const targetVar = parent.id.name;
                    const template = parts.join('{}');
                    this.variableTracker.trackAssignment(targetVar, template, 'template', lineNumber);
                    // Track format operation with variables
                    if (variables.length > 0) {
                        const varValues = {};
                        variables.forEach(v => {
                            varValues[v] = this.variableTracker.getFinalValue(v);
                        });
                        this.variableTracker.trackMutation(targetVar, 'format', varValues, lineNumber);
                    }
                }
            },
        });
    }
    /**
     * Extract value from AST node
     */
    extractValue(node) {
        if (!node)
            return undefined;
        if (t.isStringLiteral(node)) {
            return node.value;
        }
        else if (t.isNumericLiteral(node)) {
            return node.value;
        }
        else if (t.isBooleanLiteral(node)) {
            return node.value;
        }
        else if (t.isArrayExpression(node)) {
            return node.elements.map(el => this.extractValue(el));
        }
        else if (t.isObjectExpression(node)) {
            const obj = {};
            node.properties.forEach((prop) => {
                if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                    obj[prop.key.name] = this.extractValue(prop.value);
                }
            });
            return obj;
        }
        else if (t.isIdentifier(node)) {
            return this.variableTracker.getFinalValue(node.name);
        }
        else if (t.isTemplateLiteral(node)) {
            const parts = [];
            for (let i = 0; i < node.quasis.length; i++) {
                parts.push(node.quasis[i].value.raw);
                if (i < node.expressions.length) {
                    parts.push('${expr}');
                }
            }
            return parts.join('');
        }
        return undefined;
    }
    /**
     * Extract identifier name from node
     */
    extractIdentifier(node) {
        if (t.isIdentifier(node)) {
            return node.name;
        }
        return undefined;
    }
    /**
     * Infer type from AST node
     */
    inferType(node) {
        if (!node)
            return 'unknown';
        if (t.isStringLiteral(node)) {
            return 'string';
        }
        else if (t.isTemplateLiteral(node)) {
            return 'template';
        }
        else if (t.isArrayExpression(node)) {
            return 'array';
        }
        else if (t.isObjectExpression(node)) {
            return 'object';
        }
        else if (t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) {
            return 'function';
        }
        return 'unknown';
    }
    /**
     * Detect string operations in code
     */
    detectStringOperations(code) {
        const operations = [];
        // Detect concatenations
        const concatenations = variable_tracker_1.StringOperationDetector.detectConcatenation(code);
        concatenations.forEach(concat => {
            operations.push({
                type: 'concatenation',
                variables: concat.variables,
                lineNumber: concat.lineNumber,
            });
        });
        // Detect template formatting
        const templates = variable_tracker_1.StringOperationDetector.detectTemplateFormatting(code);
        templates.forEach(template => {
            operations.push({
                type: 'format',
                variables: template.variables,
                result: template.template,
                lineNumber: template.lineNumber,
            });
        });
        // Detect array joins
        const joins = variable_tracker_1.StringOperationDetector.detectArrayJoins(code);
        joins.forEach(join => {
            operations.push({
                type: 'join',
                variables: [join.array],
                result: join.separator,
                lineNumber: join.lineNumber,
            });
        });
        return operations;
    }
    /**
     * Build import graph for files
     */
    async buildImportGraph(files) {
        return await this.importResolver.buildGraph(files);
    }
    /**
     * Analyze a file comprehensively
     */
    async analyzeFile(filePath, content) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const language = ext === 'py' ? 'python' : 'javascript';
        let variables = {};
        let stringOperations = [];
        let prompts = [];
        if (language === 'javascript') {
            // Parse with Babel
            try {
                const ast = parser.parse(content, {
                    sourceType: 'module',
                    plugins: ['typescript', 'jsx'],
                    errorRecovery: true,
                });
                // Track variables
                variables = this.trackVariables(ast, language);
                // Detect string operations
                stringOperations = this.detectStringOperations(content);
                // Extract prompts from variables
                prompts = this.extractPromptsFromVariables(variables, filePath);
            }
            catch (error) {
                console.warn(`Failed to parse ${filePath}:`, error);
            }
        }
        else if (language === 'python') {
            // For Python, we'll use a subprocess approach
            prompts = await this.analyzePythonFile(filePath, content);
            stringOperations = this.detectStringOperations(content);
        }
        // Build import graph
        const imports = await this.buildImportGraph([filePath]);
        return {
            variables,
            stringOperations,
            imports,
            prompts,
        };
    }
    /**
     * Extract prompts from tracked variables
     */
    extractPromptsFromVariables(variables, filePath) {
        const prompts = [];
        for (const [name, variable] of Object.entries(variables)) {
            // Check if variable looks like a prompt
            if (this.looksLikePrompt(name, variable.value)) {
                const extractedVars = this.extractVariablesFromTemplate(variable.value);
                prompts.push({
                    name,
                    content: variable.value,
                    variables: extractedVars,
                    type: variable.mutations > 0 ? 'dynamic' : 'static',
                    confidence: this.calculateConfidence(name, variable.value),
                    location: {
                        file: filePath,
                        lineNumber: 0, // Would need to track this in variable tracker
                    },
                });
            }
        }
        return prompts;
    }
    /**
     * Check if a variable looks like a prompt
     */
    looksLikePrompt(name, value) {
        if (typeof value !== 'string')
            return false;
        // Check variable name
        const nameIndicators = ['prompt', 'template', 'instruction', 'system', 'message'];
        const hasNameIndicator = nameIndicators.some(indicator => name.toLowerCase().includes(indicator));
        // Check content
        const hasVariables = value.includes('{') && value.includes('}');
        const hasLength = value.length > 20;
        const hasInstructions = /you are|you will|please|should|must/i.test(value);
        return hasNameIndicator || (hasVariables && hasLength) || hasInstructions;
    }
    /**
     * Extract variables from a template string
     */
    extractVariablesFromTemplate(template) {
        const variables = [];
        // Match {variable} style
        const curlyMatches = template.matchAll(/\{(\w+)\}/g);
        for (const match of curlyMatches) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        // Match ${variable} style
        const dollarMatches = template.matchAll(/\$\{(\w+)\}/g);
        for (const match of dollarMatches) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        return variables;
    }
    /**
     * Calculate confidence in prompt detection
     */
    calculateConfidence(name, value) {
        let confidence = 0.5;
        // Strong indicators
        if (name.toLowerCase().includes('prompt'))
            confidence += 0.2;
        if (name.toLowerCase().includes('template'))
            confidence += 0.2;
        if (value.includes('{') && value.includes('}'))
            confidence += 0.1;
        if (value.length > 50)
            confidence += 0.1;
        if (/you are|you will/i.test(value))
            confidence += 0.2;
        // Weak indicators
        if (value.includes('\n'))
            confidence += 0.05;
        if (value.includes(':'))
            confidence += 0.05;
        return Math.min(confidence, 1.0);
    }
    /**
     * Analyze Python file using subprocess
     */
    async analyzePythonFile(filePath, content) {
        const pythonScript = `
import ast
import json
import sys

def analyze_python_code(code):
    prompts = []
    
    try:
        tree = ast.parse(code)
        
        class PromptExtractor(ast.NodeVisitor):
            def __init__(self):
                self.prompts = []
                self.variables = {}
                
            def visit_Assign(self, node):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        name = target.id
                        value = self.extract_value(node.value)
                        
                        if value and isinstance(value, str):
                            # Check if it looks like a prompt
                            if self.looks_like_prompt(name, value):
                                self.prompts.append({
                                    'name': name,
                                    'content': value,
                                    'variables': self.extract_variables(value),
                                    'type': 'static',
                                    'confidence': self.calculate_confidence(name, value),
                                    'location': {
                                        'file': '${filePath}',
                                        'lineNumber': node.lineno
                                    }
                                })
                        
                        self.variables[name] = value
                
                self.generic_visit(node)
            
            def extract_value(self, node):
                if isinstance(node, ast.Constant):
                    return node.value
                elif isinstance(node, ast.Str):
                    return node.s
                elif isinstance(node, ast.JoinedStr):
                    # f-string
                    parts = []
                    for value in node.values:
                        if isinstance(value, ast.Constant):
                            parts.append(str(value.value))
                        elif isinstance(value, ast.FormattedValue):
                            parts.append('{' + (value.value.id if isinstance(value.value, ast.Name) else 'expr') + '}')
                    return ''.join(parts)
                return None
            
            def looks_like_prompt(self, name, value):
                name_lower = name.lower()
                name_indicators = ['prompt', 'template', 'instruction', 'system', 'message']
                has_name_indicator = any(ind in name_lower for ind in name_indicators)
                
                has_variables = '{' in value and '}' in value
                has_length = len(value) > 20
                has_instructions = any(phrase in value.lower() for phrase in ['you are', 'you will', 'please', 'should', 'must'])
                
                return has_name_indicator or (has_variables and has_length) or has_instructions
            
            def extract_variables(self, template):
                import re
                variables = []
                
                # Match {variable} style
                for match in re.finditer(r'\\{(\\w+)\\}', template):
                    if match.group(1) not in variables:
                        variables.append(match.group(1))
                
                return variables
            
            def calculate_confidence(self, name, value):
                confidence = 0.5
                
                if 'prompt' in name.lower():
                    confidence += 0.2
                if 'template' in name.lower():
                    confidence += 0.2
                if '{' in value and '}' in value:
                    confidence += 0.1
                if len(value) > 50:
                    confidence += 0.1
                if any(phrase in value.lower() for phrase in ['you are', 'you will']):
                    confidence += 0.2
                
                return min(confidence, 1.0)
        
        extractor = PromptExtractor()
        extractor.visit(tree)
        prompts = extractor.prompts
        
    except:
        pass
    
    return prompts

code = sys.stdin.read()
result = analyze_python_code(code)
print(json.dumps(result))
`;
        try {
            const { stdout } = await (0, execa_1.execa)('python3', ['-c', pythonScript], {
                input: content,
                timeout: 5000,
            });
            return JSON.parse(stdout);
        }
        catch (error) {
            console.warn(`Python analysis failed for ${filePath}:`, error);
            return [];
        }
    }
}
exports.EnhancedASTAnalyzer = EnhancedASTAnalyzer;
//# sourceMappingURL=enhanced-ast.js.map