/**
 * CrewAI framework detector
 *
 * Detects the presence of CrewAI in a project and validates the setup.
 */
/**
 * Detection result interface
 */
export interface DetectionResult {
    detected: boolean;
    confidence: number;
    indicators: string[];
    version?: string;
    language: 'python' | 'unknown';
}
/**
 * Detect if CrewAI is present in the project
 */
export declare function detect(projectPath: string): Promise<boolean>;
/**
 * Detect CrewAI with detailed information
 */
export declare function detectWithDetails(projectPath: string): Promise<DetectionResult>;
/**
 * Validation result interface
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    pythonVersion?: string;
    crewaiVersion?: string;
}
/**
 * Validate CrewAI setup
 */
export declare function validate(projectPath: string): Promise<ValidationResult>;
/**
 * Get CrewAI project metadata
 */
export declare function getProjectMetadata(projectPath: string): Promise<{
    name?: string;
    description?: string;
    author?: string;
    dependencies?: string[];
}>;
//# sourceMappingURL=detector.d.ts.map