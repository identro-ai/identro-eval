/**
 * Template utilities for copying and processing template files
 */
/**
 * Get the path to a template file
 */
export declare function getTemplatePath(templateName: string): string;
/**
 * Copy a template file to a destination, optionally processing it
 */
export declare function copyTemplate(templateName: string, destination: string, variables?: Record<string, string>): Promise<void>;
/**
 * Copy multiple templates to a directory
 */
export declare function copyTemplates(templates: Array<{
    template: string;
    destination: string;
    variables?: Record<string, string>;
}>, baseDestination: string): Promise<void>;
/**
 * Initialize .identro directory with templates
 */
export declare function initializeIdentroDirectory(projectPath: string, config?: {
    framework?: string;
    llmProvider?: string;
    llmModel?: string;
    outputFormat?: string;
    outputDirectory?: string;
}): Promise<void>;
/**
 * Update project .gitignore with Identro entries
 */
export declare function updateGitignore(projectPath: string): Promise<void>;
/**
 * List available templates
 */
export declare function listTemplates(): Promise<string[]>;
/**
 * Check if a template exists
 */
export declare function templateExists(templateName: string): Promise<boolean>;
//# sourceMappingURL=templates.d.ts.map