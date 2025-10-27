/**
 * Project scanner for indexing and analyzing project files
 *
 * Scans project directories, builds file indexes, and manages
 * caching for efficient cross-file analysis.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
/**
 * Scans and indexes project files
 */
export class ProjectScanner {
    projectRoot;
    cache = new Map();
    index = null;
    constructor(projectRoot) {
        this.projectRoot = path.resolve(projectRoot);
    }
    /**
     * Scan the project and build an index
     */
    async scan(options = {}) {
        const { extensions = ['.py', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.yml', '.yaml', '.json', '.toml'], ignore = ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/dist/**', '**/build/**', '**/.git/**'], maxFileSize = 1024 * 1024, // 1MB default
        includeContent = false, } = options;
        // Initialize index
        this.index = {
            root: this.projectRoot,
            files: new Map(),
            directories: new Set(),
            filesByExtension: new Map(),
            totalSize: 0,
            scanTime: new Date(),
        };
        // Scan for each extension
        for (const ext of extensions) {
            const dimension = `**/*${ext}`;
            const files = await glob(dimension, {
                cwd: this.projectRoot,
                ignore,
            });
            for (const file of files) {
                const fullPath = path.join(this.projectRoot, file);
                const projectFile = await this.processFile(fullPath, file, includeContent, maxFileSize);
                if (projectFile) {
                    this.index.files.set(fullPath, projectFile);
                    this.cache.set(fullPath, projectFile);
                    // Add to extension map
                    if (!this.index.filesByExtension.has(projectFile.extension)) {
                        this.index.filesByExtension.set(projectFile.extension, []);
                    }
                    this.index.filesByExtension.get(projectFile.extension).push(projectFile);
                    // Track directories
                    const dir = path.dirname(fullPath);
                    this.index.directories.add(dir);
                    // Update total size
                    this.index.totalSize += projectFile.size;
                }
            }
        }
        return this.index;
    }
    /**
     * Process a single file
     */
    async processFile(fullPath, relativePath, includeContent, maxFileSize) {
        try {
            const stats = await fs.stat(fullPath);
            // Skip if file is too large
            if (stats.size > maxFileSize) {
                console.warn(`Skipping large file: ${relativePath} (${stats.size} bytes)`);
                return null;
            }
            const extension = path.extname(fullPath).toLowerCase();
            const projectFile = {
                path: fullPath,
                relativePath,
                extension,
                size: stats.size,
                lastModified: stats.mtime,
            };
            // Include content if requested
            if (includeContent) {
                projectFile.content = await fs.readFile(fullPath, 'utf-8');
                projectFile.hash = this.hashContent(projectFile.content);
            }
            return projectFile;
        }
        catch (error) {
            console.warn(`Failed to process file ${relativePath}:`, error);
            return null;
        }
    }
    /**
     * Get file content (from cache or disk)
     */
    async getFileContent(filePath) {
        // Check cache first
        const cached = this.cache.get(filePath);
        if (cached?.content) {
            return cached.content;
        }
        // Read from disk
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            // Update cache
            if (cached) {
                cached.content = content;
                cached.hash = this.hashContent(content);
            }
            return content;
        }
        catch (error) {
            console.warn(`Failed to read file ${filePath}:`, error);
            return null;
        }
    }
    /**
     * Find files by dimension
     */
    findFiles(dimension) {
        if (!this.index)
            return [];
        const results = [];
        const regex = typeof dimension === 'string' ? new RegExp(dimension) : dimension;
        for (const file of this.index.files.values()) {
            if (regex.test(file.relativePath)) {
                results.push(file);
            }
        }
        return results;
    }
    /**
     * Find files by extension
     */
    findByExtension(extension) {
        if (!this.index)
            return [];
        const ext = extension.startsWith('.') ? extension : `.${extension}`;
        return this.index.filesByExtension.get(ext) || [];
    }
    /**
     * Find files containing text
     */
    async findContaining(text, options = {}) {
        if (!this.index)
            return [];
        const results = [];
        const dimension = options.regex ? new RegExp(text) : null;
        for (const file of this.index.files.values()) {
            const content = await this.getFileContent(file.path);
            if (content) {
                const matches = dimension ? dimension.test(content) : content.includes(text);
                if (matches) {
                    results.push(file);
                }
            }
        }
        return results;
    }
    /**
     * Get related files (same directory, similar names)
     */
    getRelatedFiles(filePath) {
        if (!this.index)
            return [];
        const dir = path.dirname(filePath);
        const basename = path.basename(filePath, path.extname(filePath));
        const related = [];
        for (const file of this.index.files.values()) {
            // Same directory
            if (path.dirname(file.path) === dir) {
                related.push(file);
                continue;
            }
            // Similar name
            const fileBasename = path.basename(file.path, path.extname(file.path));
            if (fileBasename.includes(basename) || basename.includes(fileBasename)) {
                related.push(file);
            }
        }
        return related;
    }
    /**
     * Clear cache for a file
     */
    clearCache(filePath) {
        if (filePath) {
            this.cache.delete(filePath);
        }
        else {
            this.cache.clear();
        }
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        let memoryUsage = 0;
        let files = 0;
        for (const file of this.cache.values()) {
            if (file.content) {
                memoryUsage += file.content.length;
                files++;
            }
        }
        return {
            size: this.cache.size,
            files,
            memoryUsage,
        };
    }
    /**
     * Simple hash function for content
     */
    hashContent(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }
    /**
     * Get project statistics
     */
    getProjectStats() {
        if (!this.index)
            return null;
        const filesByExtension = {};
        for (const [ext, files] of this.index.filesByExtension) {
            filesByExtension[ext] = files.length;
        }
        const largestFiles = Array.from(this.index.files.values())
            .sort((a, b) => b.size - a.size)
            .slice(0, 10);
        return {
            totalFiles: this.index.files.size,
            totalSize: this.index.totalSize,
            filesByExtension,
            largestFiles,
        };
    }
}
/**
 * File relationship analyzer
 */
export class FileRelationshipAnalyzer {
    scanner;
    constructor(scanner) {
        this.scanner = scanner;
    }
    /**
     * Find test files for a source file
     */
    findTestFiles(sourceFile) {
        const basename = path.basename(sourceFile, path.extname(sourceFile));
        const testDimensions = [
            `${basename}.test`,
            `${basename}.spec`,
            `test_${basename}`,
            `${basename}_test`,
        ];
        const results = [];
        for (const dimension of testDimensions) {
            const files = this.scanner.findFiles(new RegExp(dimension));
            results.push(...files);
        }
        return results;
    }
    /**
     * Find implementation file for a test
     */
    findImplementationFile(testFile) {
        const basename = path.basename(testFile, path.extname(testFile));
        const implName = basename
            .replace(/\.(test|spec)$/, '')
            .replace(/^test_/, '')
            .replace(/_test$/, '');
        return this.scanner.findFiles(new RegExp(implName));
    }
    /**
     * Find configuration files
     */
    findConfigFiles() {
        const configDimensions = [
            /^\..*rc(\..*)?$/, // .eslintrc, .prettierrc, etc.
            /config\.(json|yaml|yml|toml|js|ts)$/,
            /settings\.(json|yaml|yml|toml)$/,
            /package\.json$/,
            /tsconfig\.json$/,
            /pyproject\.toml$/,
        ];
        const results = [];
        for (const dimension of configDimensions) {
            const files = this.scanner.findFiles(dimension);
            results.push(...files);
        }
        return results;
    }
    /**
     * Find prompt definition files
     */
    findPromptFiles() {
        const promptDimensions = [
            /prompt/i,
            /template/i,
            /instruction/i,
            /system.*message/i,
            /agent.*config/i,
        ];
        const results = [];
        for (const dimension of promptDimensions) {
            const files = this.scanner.findFiles(dimension);
            results.push(...files);
        }
        // Also check YAML/JSON files that might contain prompts
        const configExtensions = ['.yaml', '.yml', '.json'];
        for (const ext of configExtensions) {
            const files = this.scanner.findByExtension(ext);
            results.push(...files);
        }
        return [...new Set(results)]; // Remove duplicates
    }
}
//# sourceMappingURL=project-scanner.js.map