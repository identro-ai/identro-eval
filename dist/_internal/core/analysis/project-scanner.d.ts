/**
 * Project scanner for indexing and analyzing project files
 *
 * Scans project directories, builds file indexes, and manages
 * caching for efficient cross-file analysis.
 */
export interface ProjectFile {
    path: string;
    relativePath: string;
    extension: string;
    size: number;
    content?: string;
    lastModified: Date;
    hash?: string;
}
export interface ProjectIndex {
    root: string;
    files: Map<string, ProjectFile>;
    directories: Set<string>;
    filesByExtension: Map<string, ProjectFile[]>;
    totalSize: number;
    scanTime: Date;
}
export interface ScanOptions {
    extensions?: string[];
    ignore?: string[];
    maxFileSize?: number;
    includeContent?: boolean;
    followSymlinks?: boolean;
}
/**
 * Scans and indexes project files
 */
export declare class ProjectScanner {
    private projectRoot;
    private cache;
    private index;
    constructor(projectRoot: string);
    /**
     * Scan the project and build an index
     */
    scan(options?: ScanOptions): Promise<ProjectIndex>;
    /**
     * Process a single file
     */
    private processFile;
    /**
     * Get file content (from cache or disk)
     */
    getFileContent(filePath: string): Promise<string | null>;
    /**
     * Find files by dimension
     */
    findFiles(dimension: string | RegExp): ProjectFile[];
    /**
     * Find files by extension
     */
    findByExtension(extension: string): ProjectFile[];
    /**
     * Find files containing text
     */
    findContaining(text: string, options?: {
        regex?: boolean;
    }): Promise<ProjectFile[]>;
    /**
     * Get related files (same directory, similar names)
     */
    getRelatedFiles(filePath: string): ProjectFile[];
    /**
     * Clear cache for a file
     */
    clearCache(filePath?: string): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        files: number;
        memoryUsage: number;
    };
    /**
     * Simple hash function for content
     */
    private hashContent;
    /**
     * Get project statistics
     */
    getProjectStats(): {
        totalFiles: number;
        totalSize: number;
        filesByExtension: Record<string, number>;
        largestFiles: ProjectFile[];
    } | null;
}
/**
 * File relationship analyzer
 */
export declare class FileRelationshipAnalyzer {
    private scanner;
    constructor(scanner: ProjectScanner);
    /**
     * Find test files for a source file
     */
    findTestFiles(sourceFile: string): ProjectFile[];
    /**
     * Find implementation file for a test
     */
    findImplementationFile(testFile: string): ProjectFile[];
    /**
     * Find configuration files
     */
    findConfigFiles(): ProjectFile[];
    /**
     * Find prompt definition files
     */
    findPromptFiles(): ProjectFile[];
}
//# sourceMappingURL=project-scanner.d.ts.map