"use strict";
/**
 * Cross-file analysis system
 *
 * Analyzes prompts and variables across multiple files,
 * resolving references and reconstructing complete prompts.
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
exports.PromptReconstructor = exports.CrossFileAnalyzer = void 0;
const path = __importStar(require("path"));
const project_scanner_1 = require("./project-scanner");
const import_resolver_1 = require("./import-resolver");
const enhanced_ast_1 = require("./enhanced-ast");
/**
 * Analyzes prompts across multiple files
 */
class CrossFileAnalyzer {
    scanner;
    astAnalyzer;
    importResolver;
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = path.resolve(projectRoot);
        this.scanner = new project_scanner_1.ProjectScanner(this.projectRoot);
        this.astAnalyzer = new enhanced_ast_1.EnhancedASTAnalyzer(this.projectRoot);
        this.importResolver = new import_resolver_1.ImportResolver(this.projectRoot);
    }
    /**
     * Analyze entire project
     */
    async analyzeProject(_projectPath) {
        // Use projectPath if provided, otherwise use projectRoot
        const analysis = {
            prompts: [],
            variables: new Map(),
            dependencies: {
                nodes: new Map(),
                rootFiles: [],
                entryPoints: [],
            },
            files: [],
            errors: [],
        };
        try {
            // Scan project
            const index = await this.scanner.scan({
                includeContent: false,
            });
            // Find potential prompt files
            const promptFiles = this.findPromptFiles(index.files);
            analysis.files = promptFiles.map(f => f.path);
            // Build dependency graph
            analysis.dependencies = await this.importResolver.buildGraph(analysis.files);
            // Analyze each file
            const fileAnalyses = new Map();
            const fileVariables = new Map();
            for (const file of promptFiles) {
                try {
                    const content = await this.scanner.getFileContent(file.path);
                    if (content) {
                        const result = await this.astAnalyzer.analyzeFile(file.path, content);
                        // Store prompts
                        if (result.prompts.length > 0) {
                            fileAnalyses.set(file.path, result.prompts);
                        }
                        // Store variables
                        const vars = new Map();
                        for (const [name, variable] of Object.entries(result.variables)) {
                            vars.set(name, variable.value);
                        }
                        fileVariables.set(file.path, vars);
                    }
                }
                catch (error) {
                    analysis.errors.push(`Failed to analyze ${file.path}: ${error}`);
                }
            }
            // Resolve cross-file references
            analysis.prompts = await this.resolvePromptReferences(fileAnalyses, fileVariables, analysis.dependencies);
            // Build cross-file variable map
            analysis.variables = this.buildVariableMap(fileVariables, analysis.dependencies);
        }
        catch (error) {
            analysis.errors.push(`Project analysis failed: ${error}`);
        }
        return analysis;
    }
    /**
     * Find files likely to contain prompts
     */
    findPromptFiles(files) {
        const promptFiles = [];
        const promptIndicators = [
            /prompt/i,
            /template/i,
            /instruction/i,
            /message/i,
            /agent/i,
            /chain/i,
        ];
        for (const file of files.values()) {
            // Check file name
            const hasIndicator = promptIndicators.some(dimension => dimension.test(file.relativePath));
            // Check extension
            const hasValidExt = ['.py', '.ts', '.tsx', '.js', '.jsx', '.yaml', '.yml', '.json'].includes(file.extension);
            if (hasIndicator || hasValidExt) {
                promptFiles.push(file);
            }
        }
        return promptFiles;
    }
    /**
     * Resolve prompt references across files
     */
    async resolvePromptReferences(fileAnalyses, fileVariables, dependencies) {
        const resolvedPrompts = [];
        const processedPrompts = new Set();
        for (const [file, prompts] of fileAnalyses) {
            for (const prompt of prompts) {
                const key = `${file}:${prompt.name}`;
                if (processedPrompts.has(key))
                    continue;
                processedPrompts.add(key);
                // Resolve variables in prompt
                const resolvedVars = new Map();
                const fragments = [];
                const relatedFiles = new Set([file]);
                // Add main fragment
                fragments.push({
                    content: prompt.content,
                    file,
                    lineNumber: prompt.location.lineNumber,
                    variables: prompt.variables,
                    type: 'base',
                });
                // Resolve each variable
                for (const varName of prompt.variables) {
                    const resolved = await this.resolveVariable(varName, file, fileVariables, dependencies);
                    if (resolved) {
                        resolvedVars.set(varName, resolved.value);
                        relatedFiles.add(resolved.file);
                        // Add as fragment if it's a prompt piece
                        if (typeof resolved.value === 'string' && resolved.value.length > 10) {
                            fragments.push({
                                content: resolved.value,
                                file: resolved.file,
                                lineNumber: 0,
                                variables: [],
                                type: 'parameter',
                            });
                        }
                    }
                }
                // Try to reconstruct complete prompt
                const reconstructed = this.reconstructPrompt(prompt.content, resolvedVars);
                resolvedPrompts.push({
                    name: prompt.name,
                    content: reconstructed,
                    fragments,
                    variables: resolvedVars,
                    files: Array.from(relatedFiles),
                    confidence: prompt.confidence,
                    type: resolvedVars.size > 0 ? 'template' : 'complete',
                });
            }
        }
        return resolvedPrompts;
    }
    /**
     * Resolve a variable across files
     */
    async resolveVariable(varName, currentFile, fileVariables, dependencies) {
        // Check current file first
        const currentVars = fileVariables.get(currentFile);
        if (currentVars?.has(varName)) {
            return {
                value: currentVars.get(varName),
                file: currentFile,
            };
        }
        // Check imports
        const node = dependencies.nodes.get(currentFile);
        if (!node)
            return null;
        for (const imp of node.imports) {
            // Check if variable is imported
            const importedVar = imp.imports.find(i => i.name === varName || i.alias === varName);
            if (importedVar) {
                // Look in target file
                const targetVars = fileVariables.get(imp.target);
                if (targetVars) {
                    const originalName = importedVar.alias === varName ? importedVar.name : varName;
                    if (targetVars.has(originalName)) {
                        return {
                            value: targetVars.get(originalName),
                            file: imp.target,
                        };
                    }
                }
                // Recursively resolve
                return this.resolveVariable(importedVar.name, imp.target, fileVariables, dependencies);
            }
        }
        return null;
    }
    /**
     * Build cross-file variable map
     */
    buildVariableMap(fileVariables, dependencies) {
        const variableMap = new Map();
        for (const [file, vars] of fileVariables) {
            for (const [name, value] of vars) {
                const key = `${file}:${name}`;
                if (!variableMap.has(key)) {
                    variableMap.set(key, {
                        name,
                        value,
                        definedIn: file,
                        usedIn: [],
                        type: typeof value,
                    });
                }
                // Track usage
                const node = dependencies.nodes.get(file);
                if (node) {
                    for (const dependent of node.dependents) {
                        const depNode = dependencies.nodes.get(dependent);
                        if (depNode) {
                            // Check if this file imports the variable
                            const imports = depNode.imports.some(imp => imp.target === file &&
                                imp.imports.some(i => i.name === name));
                            if (imports) {
                                variableMap.get(key).usedIn.push(dependent);
                            }
                        }
                    }
                }
            }
        }
        return variableMap;
    }
    /**
     * Reconstruct prompt from template and variables
     */
    reconstructPrompt(template, variables) {
        let result = template;
        // Replace {variable} style
        for (const [name, value] of variables) {
            const dimension = new RegExp(`\\{${name}\\}`, 'g');
            result = result.replace(dimension, String(value));
        }
        // Replace ${variable} style
        for (const [name, value] of variables) {
            const dimension = new RegExp(`\\$\\{${name}\\}`, 'g');
            result = result.replace(dimension, String(value));
        }
        return result;
    }
}
exports.CrossFileAnalyzer = CrossFileAnalyzer;
/**
 * Prompt reconstructor
 */
class PromptReconstructor {
    /**
     * Reconstruct complete prompt from fragments
     */
    static reconstruct(fragments) {
        if (fragments.length === 0)
            return '';
        // Sort fragments by type priority
        const sorted = fragments.sort((a, b) => {
            const priority = { base: 0, partial: 1, parameter: 2 };
            return priority[a.type] - priority[b.type];
        });
        // Start with base
        let result = sorted[0].content;
        // Apply partials and parameters
        for (let i = 1; i < sorted.length; i++) {
            const fragment = sorted[i];
            if (fragment.type === 'parameter') {
                // Replace variables with parameter values
                for (const variable of fragment.variables) {
                    const dimension = new RegExp(`\\{${variable}\\}|\\$\\{${variable}\\}`, 'g');
                    result = result.replace(dimension, fragment.content);
                }
            }
            else if (fragment.type === 'partial') {
                // Append or prepend partial
                if (result.includes('{content}') || result.includes('${content}')) {
                    result = result.replace(/\{content\}|\$\{content\}/g, fragment.content);
                }
                else {
                    result = `${result}\n${fragment.content}`;
                }
            }
        }
        return result;
    }
    /**
     * Combine multiple prompts into one
     */
    static combine(prompts) {
        if (prompts.length === 0)
            return null;
        if (prompts.length === 1)
            return prompts[0];
        // Collect all fragments
        const allFragments = [];
        const allVariables = new Map();
        const allFiles = new Set();
        for (const prompt of prompts) {
            allFragments.push(...prompt.fragments);
            prompt.variables.forEach((value, key) => {
                allVariables.set(key, value);
            });
            prompt.files.forEach(file => allFiles.add(file));
        }
        // Reconstruct combined prompt
        const combinedContent = this.reconstruct(allFragments);
        return {
            name: 'combined',
            content: combinedContent,
            fragments: allFragments,
            variables: allVariables,
            files: Array.from(allFiles),
            confidence: Math.min(...prompts.map(p => p.confidence)),
            type: 'complete',
        };
    }
    /**
     * Validate prompt completeness
     */
    static validate(prompt) {
        const missingVariables = [];
        const unresolvedFragments = [];
        // Check for unresolved variables in content
        const variableDimension = /\{(\w+)\}|\$\{(\w+)\}/g;
        const matches = prompt.content.matchAll(variableDimension);
        for (const match of matches) {
            const varName = match[1] || match[2];
            if (!prompt.variables.has(varName)) {
                missingVariables.push(varName);
            }
        }
        // Check fragments
        for (const fragment of prompt.fragments) {
            for (const variable of fragment.variables) {
                if (!prompt.variables.has(variable)) {
                    unresolvedFragments.push(fragment);
                    break;
                }
            }
        }
        return {
            isComplete: missingVariables.length === 0 && unresolvedFragments.length === 0,
            missingVariables,
            unresolvedFragments,
        };
    }
}
exports.PromptReconstructor = PromptReconstructor;
//# sourceMappingURL=cross-file.js.map