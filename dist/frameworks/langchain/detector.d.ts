/**
 * LangChain framework detection module
 *
 * This module is responsible for detecting whether a project uses LangChain.
 * It scans for:
 * - Package dependencies (package.json, requirements.txt, etc.)
 * - Import statements in source files
 * - LangChain-specific patterns in code
 */
/**
 * Result of framework detection
 */
export interface DetectionResult {
    detected: boolean;
    languages: ('python' | 'typescript' | 'javascript')[];
    confidence: number;
    evidence: {
        packageFiles: string[];
        importFiles: string[];
        patterns: string[];
    };
}
/**
 * Main detection function that checks for LangChain in any supported language
 *
 * @param projectPath - Root directory of the project to analyze
 * @returns true if LangChain is detected, false otherwise
 */
export declare function detect(projectPath: string): Promise<boolean>;
/**
 * Detailed detection function that returns comprehensive results
 *
 * @param projectPath - Root directory of the project
 * @returns Detailed detection results including confidence and evidence
 */
export declare function detectWithDetails(projectPath: string): Promise<DetectionResult>;
/**
 * Validates that LangChain is properly set up in the project
 *
 * @param projectPath - Root directory of the project
 * @returns Validation result with any errors found
 */
export declare function validate(projectPath: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
}>;
//# sourceMappingURL=detector.d.ts.map