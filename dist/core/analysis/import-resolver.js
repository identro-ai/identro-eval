/**
 * Import resolver for building dependency graphs
 *
 * Resolves imports and exports across files to track
 * how prompts and variables flow through a project.
 */
import * as path from 'path';
import * as fs from 'fs/promises';
/**
 * Resolves imports and builds dependency graphs
 */
export class ImportResolver {
    graph;
    projectRoot;
    fileCache = new Map();
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.graph = {
            nodes: new Map(),
            rootFiles: [],
            entryPoints: [],
        };
    }
    /**
     * Build dependency graph for a project
     */
    async buildGraph(entryFiles) {
        // Reset graph
        this.graph = {
            nodes: new Map(),
            rootFiles: [],
            entryPoints: entryFiles,
        };
        // Process entry files
        const queue = [...entryFiles];
        const processed = new Set();
        while (queue.length > 0) {
            const file = queue.shift();
            if (processed.has(file))
                continue;
            processed.add(file);
            try {
                const content = await this.readFile(file);
                const node = await this.processFile(file, content);
                // Add dependencies to queue
                for (const dep of node.dependencies) {
                    if (!processed.has(dep)) {
                        queue.push(dep);
                    }
                }
            }
            catch (error) {
                console.warn(`Failed to process ${file}:`, error);
            }
        }
        // Identify root files (no dependents)
        for (const [file, node] of this.graph.nodes) {
            if (node.dependents.length === 0) {
                this.graph.rootFiles.push(file);
            }
        }
        return this.graph;
    }
    /**
     * Process a single file
     */
    async processFile(file, content) {
        const ext = path.extname(file);
        let node = {
            file,
            imports: [],
            exports: [],
            dependencies: [],
            dependents: [],
        };
        if (ext === '.py') {
            node = await this.processPythonFile(file, content);
        }
        else if (['.ts', '.tsx', '.js', '.jsx', '.mjs'].includes(ext)) {
            node = await this.processJavaScriptFile(file, content);
        }
        this.graph.nodes.set(file, node);
        // Update dependents for dependencies
        for (const dep of node.dependencies) {
            const depNode = this.graph.nodes.get(dep);
            if (depNode && !depNode.dependents.includes(file)) {
                depNode.dependents.push(file);
            }
        }
        return node;
    }
    /**
     * Process Python imports
     */
    async processPythonFile(file, content) {
        const node = {
            file,
            imports: [],
            exports: [],
            dependencies: [],
            dependents: [],
        };
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;
            // import module
            const importMatch = line.match(/^import\s+(\S+)(?:\s+as\s+(\S+))?/);
            if (importMatch) {
                const moduleName = importMatch[1];
                const alias = importMatch[2];
                const resolvedPath = await this.resolvePythonImport(file, moduleName);
                node.imports.push({
                    source: file,
                    target: resolvedPath,
                    imports: [{
                            name: moduleName.split('.').pop(),
                            alias,
                            type: 'unknown',
                        }],
                    type: 'namespace',
                    lineNumber,
                });
                if (resolvedPath && !node.dependencies.includes(resolvedPath)) {
                    node.dependencies.push(resolvedPath);
                }
            }
            // from module import ...
            const fromImportMatch = line.match(/^from\s+(\S+)\s+import\s+(.+)/);
            if (fromImportMatch) {
                const moduleName = fromImportMatch[1];
                const imports = fromImportMatch[2];
                const resolvedPath = await this.resolvePythonImport(file, moduleName);
                const importedItems = [];
                // Parse imported items
                const items = imports.split(',').map(s => s.trim());
                for (const item of items) {
                    const [name, alias] = item.split(/\s+as\s+/).map(s => s.trim());
                    importedItems.push({
                        name,
                        alias,
                        type: 'unknown',
                    });
                }
                node.imports.push({
                    source: file,
                    target: resolvedPath,
                    imports: importedItems,
                    type: 'named',
                    lineNumber,
                });
                if (resolvedPath && !node.dependencies.includes(resolvedPath)) {
                    node.dependencies.push(resolvedPath);
                }
            }
            // Detect exports (Python doesn't have explicit exports, so we track top-level definitions)
            if (line.match(/^(def|class)\s+(\w+)/)) {
                const match = line.match(/^(def|class)\s+(\w+)/);
                if (match) {
                    node.exports.push({
                        file,
                        exports: [{
                                name: match[2],
                                type: match[1] === 'def' ? 'function' : 'class',
                            }],
                        lineNumber,
                    });
                }
            }
            // Variable assignments at module level
            if (!line.startsWith(' ') && !line.startsWith('\t')) {
                const varMatch = line.match(/^(\w+)\s*=/);
                if (varMatch) {
                    node.exports.push({
                        file,
                        exports: [{
                                name: varMatch[1],
                                type: 'variable',
                            }],
                        lineNumber,
                    });
                }
            }
        }
        return node;
    }
    /**
     * Process JavaScript/TypeScript imports
     */
    async processJavaScriptFile(file, content) {
        const node = {
            file,
            imports: [],
            exports: [],
            dependencies: [],
            dependents: [],
        };
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;
            // ES6 imports
            const importMatch = line.match(/^import\s+(.+)\s+from\s+['"]([^'"]+)['"]/);
            if (importMatch) {
                const importClause = importMatch[1];
                const modulePath = importMatch[2];
                const resolvedPath = await this.resolveJavaScriptImport(file, modulePath);
                const importedItems = [];
                // Default import
                if (!importClause.startsWith('{') && !importClause.includes('*')) {
                    const [defaultImport] = importClause.split(',').map(s => s.trim());
                    importedItems.push({
                        name: defaultImport,
                        type: 'unknown',
                    });
                }
                // Named imports
                const namedMatch = importClause.match(/\{([^}]+)\}/);
                if (namedMatch) {
                    const items = namedMatch[1].split(',').map(s => s.trim());
                    for (const item of items) {
                        const [name, alias] = item.split(/\s+as\s+/).map(s => s.trim());
                        importedItems.push({
                            name,
                            alias,
                            type: 'unknown',
                        });
                    }
                }
                // Namespace import
                const namespaceMatch = importClause.match(/\*\s+as\s+(\w+)/);
                if (namespaceMatch) {
                    importedItems.push({
                        name: '*',
                        alias: namespaceMatch[1],
                        type: 'unknown',
                    });
                }
                node.imports.push({
                    source: file,
                    target: resolvedPath,
                    imports: importedItems,
                    type: importedItems.length === 1 && importedItems[0].name === '*' ? 'namespace' : 'named',
                    lineNumber,
                });
                if (resolvedPath && !node.dependencies.includes(resolvedPath)) {
                    node.dependencies.push(resolvedPath);
                }
            }
            // CommonJS require
            const requireMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
            if (requireMatch) {
                const varName = requireMatch[1];
                const modulePath = requireMatch[2];
                const resolvedPath = await this.resolveJavaScriptImport(file, modulePath);
                node.imports.push({
                    source: file,
                    target: resolvedPath,
                    imports: [{
                            name: varName,
                            type: 'unknown',
                        }],
                    type: 'default',
                    lineNumber,
                });
                if (resolvedPath && !node.dependencies.includes(resolvedPath)) {
                    node.dependencies.push(resolvedPath);
                }
            }
            // ES6 exports
            if (line.match(/^export\s+/)) {
                // export default
                if (line.match(/^export\s+default\s+/)) {
                    node.exports.push({
                        file,
                        exports: [{
                                name: 'default',
                                type: 'default',
                            }],
                        lineNumber,
                    });
                }
                // export const/let/var
                else if (line.match(/^export\s+(const|let|var)\s+(\w+)/)) {
                    const match = line.match(/^export\s+(const|let|var)\s+(\w+)/);
                    if (match) {
                        node.exports.push({
                            file,
                            exports: [{
                                    name: match[2],
                                    type: 'variable',
                                }],
                            lineNumber,
                        });
                    }
                }
                // export function/class
                else if (line.match(/^export\s+(function|class)\s+(\w+)/)) {
                    const match = line.match(/^export\s+(function|class)\s+(\w+)/);
                    if (match) {
                        node.exports.push({
                            file,
                            exports: [{
                                    name: match[2],
                                    type: match[1],
                                }],
                            lineNumber,
                        });
                    }
                }
                // export { ... }
                else if (line.match(/^export\s+\{([^}]+)\}/)) {
                    const match = line.match(/^export\s+\{([^}]+)\}/);
                    if (match) {
                        const items = match[1].split(',').map(s => s.trim());
                        const exportedItems = [];
                        for (const item of items) {
                            const [name, alias] = item.split(/\s+as\s+/).map(s => s.trim());
                            exportedItems.push({
                                name,
                                alias,
                                type: 'unknown',
                            });
                        }
                        node.exports.push({
                            file,
                            exports: exportedItems,
                            lineNumber,
                        });
                    }
                }
            }
            // CommonJS exports
            if (line.match(/^module\.exports\s*=/)) {
                node.exports.push({
                    file,
                    exports: [{
                            name: 'default',
                            type: 'default',
                        }],
                    lineNumber,
                });
            }
            else if (line.match(/^exports\.(\w+)\s*=/)) {
                const match = line.match(/^exports\.(\w+)\s*=/);
                if (match) {
                    node.exports.push({
                        file,
                        exports: [{
                                name: match[1],
                                type: 'unknown',
                            }],
                        lineNumber,
                    });
                }
            }
        }
        return node;
    }
    /**
     * Resolve Python import to file path
     */
    async resolvePythonImport(fromFile, importPath) {
        const dir = path.dirname(fromFile);
        // Relative import
        if (importPath.startsWith('.')) {
            const levels = importPath.match(/^\.+/)?.[0].length || 0;
            let targetDir = dir;
            for (let i = 1; i < levels; i++) {
                targetDir = path.dirname(targetDir);
            }
            const modulePath = importPath.slice(levels).replace(/\./g, '/');
            const candidates = [
                path.join(targetDir, `${modulePath}.py`),
                path.join(targetDir, modulePath, '__init__.py'),
                path.join(targetDir, modulePath, 'index.py'),
            ];
            for (const candidate of candidates) {
                if (await this.fileExists(candidate)) {
                    return candidate;
                }
            }
        }
        // Absolute import
        const modulePath = importPath.replace(/\./g, '/');
        const candidates = [
            path.join(this.projectRoot, `${modulePath}.py`),
            path.join(this.projectRoot, modulePath, '__init__.py'),
            path.join(this.projectRoot, modulePath, 'index.py'),
        ];
        for (const candidate of candidates) {
            if (await this.fileExists(candidate)) {
                return candidate;
            }
        }
        return importPath; // Return original if not resolved
    }
    /**
     * Resolve JavaScript/TypeScript import to file path
     */
    async resolveJavaScriptImport(fromFile, importPath) {
        const dir = path.dirname(fromFile);
        // Relative import
        if (importPath.startsWith('.')) {
            const basePath = path.join(dir, importPath);
            const candidates = [
                basePath,
                `${basePath}.ts`,
                `${basePath}.tsx`,
                `${basePath}.js`,
                `${basePath}.jsx`,
                `${basePath}.mjs`,
                path.join(basePath, 'index.ts'),
                path.join(basePath, 'index.tsx'),
                path.join(basePath, 'index.js'),
                path.join(basePath, 'index.jsx'),
                path.join(basePath, 'index.mjs'),
            ];
            for (const candidate of candidates) {
                if (await this.fileExists(candidate)) {
                    return candidate;
                }
            }
        }
        // Node modules or alias (simplified - real implementation would check package.json)
        return importPath;
    }
    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Read file with caching
     */
    async readFile(filePath) {
        if (this.fileCache.has(filePath)) {
            return this.fileCache.get(filePath);
        }
        const content = await fs.readFile(filePath, 'utf-8');
        this.fileCache.set(filePath, content);
        return content;
    }
    /**
     * Get all exported items from a file
     */
    getExports(file) {
        const node = this.graph.nodes.get(file);
        if (!node)
            return [];
        const allExports = [];
        for (const exp of node.exports) {
            allExports.push(...exp.exports);
        }
        return allExports;
    }
    /**
     * Trace variable through imports
     */
    traceVariable(file, variableName) {
        const trace = [];
        const visited = new Set();
        const queue = [{ file, name: variableName }];
        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.file}:${current.name}`;
            if (visited.has(key))
                continue;
            visited.add(key);
            trace.push(current);
            // Check if this variable is imported from somewhere
            const node = this.graph.nodes.get(current.file);
            if (node) {
                for (const imp of node.imports) {
                    for (const item of imp.imports) {
                        if (item.alias === current.name || item.name === current.name) {
                            queue.push({
                                file: imp.target,
                                name: item.name,
                                alias: item.alias,
                            });
                        }
                    }
                }
            }
        }
        return trace;
    }
    /**
     * Get dependency chain between two files
     */
    getDependencyChain(from, to) {
        const visited = new Set();
        const queue = [
            { file: from, path: [from] },
        ];
        while (queue.length > 0) {
            const { file, path } = queue.shift();
            if (file === to) {
                return path;
            }
            if (visited.has(file))
                continue;
            visited.add(file);
            const node = this.graph.nodes.get(file);
            if (node) {
                for (const dep of node.dependencies) {
                    queue.push({
                        file: dep,
                        path: [...path, dep],
                    });
                }
            }
        }
        return null;
    }
}
//# sourceMappingURL=import-resolver.js.map