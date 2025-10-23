"use strict";
/**
 * Variable tracker for cross-scope variable resolution
 *
 * Tracks variable assignments, mutations, and flow across
 * different scopes in both Python and TypeScript/JavaScript.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringOperationDetector = exports.VariableTracker = void 0;
/**
 * Tracks variables across scopes
 */
class VariableTracker {
    scopes = new Map();
    currentScope = 'module';
    scopeCounter = 0;
    constructor() {
        // Initialize with module scope
        this.scopes.set('module', {
            name: 'module',
            type: 'module',
            variables: new Map(),
            children: [],
        });
    }
    /**
     * Enter a new scope
     */
    enterScope(type, name) {
        const scopeId = `${type}_${name || this.scopeCounter++}`;
        const parentScope = this.scopes.get(this.currentScope);
        this.scopes.set(scopeId, {
            name: name || scopeId,
            type,
            parent: this.currentScope,
            variables: new Map(),
            children: [],
        });
        if (parentScope) {
            parentScope.children.push(scopeId);
        }
        this.currentScope = scopeId;
        return scopeId;
    }
    /**
     * Exit current scope
     */
    exitScope() {
        const currentScope = this.scopes.get(this.currentScope);
        if (currentScope?.parent) {
            this.currentScope = currentScope.parent;
        }
    }
    /**
     * Track a variable assignment
     */
    trackAssignment(name, value, type, lineNumber) {
        const scope = this.scopes.get(this.currentScope);
        if (!scope)
            return;
        const existing = this.resolveVariable(name);
        if (existing) {
            // Track as mutation
            existing.mutations.push({
                type: 'assignment',
                value,
                lineNumber,
                scope: this.currentScope,
            });
        }
        else {
            // New variable
            scope.variables.set(name, {
                name,
                value,
                type,
                scope: this.currentScope,
                lineNumber,
                mutations: [],
                references: [],
            });
        }
    }
    /**
     * Track a variable mutation (concatenation, format, etc.)
     */
    trackMutation(name, mutationType, value, lineNumber) {
        const variable = this.resolveVariable(name);
        if (variable) {
            variable.mutations.push({
                type: mutationType,
                value,
                lineNumber,
                scope: this.currentScope,
            });
        }
    }
    /**
     * Track a variable reference
     */
    trackReference(name, context, lineNumber) {
        const variable = this.resolveVariable(name);
        if (variable) {
            variable.references.push({
                scope: this.currentScope,
                lineNumber,
                context,
            });
        }
    }
    /**
     * Resolve a variable by looking up the scope chain
     */
    resolveVariable(name) {
        let currentScopeId = this.currentScope;
        while (currentScopeId) {
            const scope = this.scopes.get(currentScopeId);
            if (scope?.variables.has(name)) {
                return scope.variables.get(name);
            }
            currentScopeId = scope?.parent || '';
        }
        return undefined;
    }
    /**
     * Get the final value of a variable after all mutations
     */
    getFinalValue(name) {
        const variable = this.resolveVariable(name);
        if (!variable)
            return undefined;
        let value = variable.value;
        // Apply mutations in order
        for (const mutation of variable.mutations) {
            switch (mutation.type) {
                case 'assignment':
                    value = mutation.value;
                    break;
                case 'concatenation':
                    value = value + mutation.value;
                    break;
                case 'format':
                    // Handle format operations
                    if (typeof value === 'string' && typeof mutation.value === 'object') {
                        value = this.formatString(value, mutation.value);
                    }
                    break;
                case 'join':
                    if (Array.isArray(value)) {
                        value = value.join(mutation.value || '');
                    }
                    break;
                case 'append':
                    if (Array.isArray(value)) {
                        value = [...value, mutation.value];
                    }
                    else if (typeof value === 'string') {
                        value = value + mutation.value;
                    }
                    break;
            }
        }
        return value;
    }
    /**
     * Format a string with variables
     */
    formatString(template, variables) {
        let result = template;
        // Handle {variable} style
        result = result.replace(/\{(\w+)\}/g, (match, key) => {
            return variables[key] !== undefined ? String(variables[key]) : match;
        });
        // Handle ${variable} style
        result = result.replace(/\$\{(\w+)\}/g, (match, key) => {
            return variables[key] !== undefined ? String(variables[key]) : match;
        });
        return result;
    }
    /**
     * Get all variables in current scope chain
     */
    getAllVariables() {
        const allVars = new Map();
        let currentScopeId = this.currentScope;
        while (currentScopeId) {
            const scope = this.scopes.get(currentScopeId);
            if (scope) {
                scope.variables.forEach((variable, name) => {
                    if (!allVars.has(name)) {
                        allVars.set(name, variable);
                    }
                });
            }
            currentScopeId = scope?.parent || '';
        }
        return allVars;
    }
    /**
     * Export scope tree for debugging
     */
    exportScopeTree() {
        const exportScope = (scopeId) => {
            const scope = this.scopes.get(scopeId);
            if (!scope)
                return null;
            return {
                name: scope.name,
                type: scope.type,
                variables: Array.from(scope.variables.entries()).map(([name, variable]) => ({
                    name,
                    value: variable.value,
                    type: variable.type,
                    mutations: variable.mutations.length,
                    references: variable.references.length,
                })),
                children: scope.children.map(childId => exportScope(childId)).filter(Boolean),
            };
        };
        return exportScope('module');
    }
}
exports.VariableTracker = VariableTracker;
/**
 * String operation detector
 */
class StringOperationDetector {
    /**
     * Detect string concatenation dimensions
     */
    static detectConcatenation(code) {
        const dimensions = [
            // Python: str1 + str2
            /(\w+)\s*\+\s*(\w+)/g,
            // JavaScript: str1 + str2
            /(\w+)\s*\+\s*(\w+)/g,
            // Python: "".join([...])
            /["'].*?["']\.join\s*\(\s*\[([^\]]+)\]\s*\)/g,
            // JavaScript: array.join()
            /(\w+)\.join\s*\(\s*["']?([^"')]*)?["']?\s*\)/g,
        ];
        const results = [];
        const lines = code.split('\n');
        lines.forEach((line, index) => {
            for (const dimension of dimensions) {
                const matches = line.matchAll(dimension);
                for (const match of matches) {
                    results.push({
                        variables: [match[1], match[2]].filter(Boolean),
                        operator: '+',
                        lineNumber: index + 1,
                    });
                }
            }
        });
        return results;
    }
    /**
     * Detect template formatting dimensions
     */
    static detectTemplateFormatting(code) {
        const results = [];
        const lines = code.split('\n');
        lines.forEach((line, index) => {
            // Python f-strings
            const fStringMatch = line.match(/f["']([^"']*\{[^}]+\}[^"']*)["']/);
            if (fStringMatch) {
                const template = fStringMatch[1];
                const variables = Array.from(template.matchAll(/\{(\w+)\}/g)).map(m => m[1]);
                results.push({
                    template,
                    variables,
                    method: 'f-string',
                    lineNumber: index + 1,
                });
            }
            // Python .format()
            const formatMatch = line.match(/["']([^"']*\{[^}]*\}[^"']*)["']\.format\s*\(/);
            if (formatMatch) {
                const template = formatMatch[1];
                const variables = Array.from(template.matchAll(/\{(\w+)\}/g)).map(m => m[1]);
                results.push({
                    template,
                    variables,
                    method: 'format',
                    lineNumber: index + 1,
                });
            }
            // JavaScript template literals
            const templateLiteralMatch = line.match(/`([^`]*\$\{[^}]+\}[^`]*)`/);
            if (templateLiteralMatch) {
                const template = templateLiteralMatch[1];
                const variables = Array.from(template.matchAll(/\$\{(\w+)\}/g)).map(m => m[1]);
                results.push({
                    template,
                    variables,
                    method: 'template-literal',
                    lineNumber: index + 1,
                });
            }
        });
        return results;
    }
    /**
     * Detect array join operations
     */
    static detectArrayJoins(code) {
        const dimensions = [
            // Python: separator.join(array)
            /["']([^"']*)["']\.join\s*\(\s*(\w+)\s*\)/g,
            // JavaScript: array.join(separator)
            /(\w+)\.join\s*\(\s*["']([^"']*)["']\s*\)/g,
        ];
        const results = [];
        const lines = code.split('\n');
        lines.forEach((line, index) => {
            for (const dimension of dimensions) {
                const matches = line.matchAll(dimension);
                for (const match of matches) {
                    results.push({
                        array: match[2] || match[1],
                        separator: match[1] || match[2],
                        lineNumber: index + 1,
                    });
                }
            }
        });
        return results;
    }
}
exports.StringOperationDetector = StringOperationDetector;
//# sourceMappingURL=variable-tracker.js.map