/**
 * CrewAI-specific patterns and utilities
 *
 * This module contains patterns for detecting and analyzing CrewAI agents,
 * tasks, crews, and related constructs.
 */
/**
 * Import patterns for detecting CrewAI usage
 */
export declare const PYTHON_IMPORT_PATTERNS: string[];
export declare const TYPESCRIPT_IMPORT_PATTERNS: string[];
/**
 * Agent patterns for Python
 */
export declare const PYTHON_AGENT_PATTERNS: RegExp[];
/**
 * Task patterns for Python
 */
export declare const PYTHON_TASK_PATTERNS: RegExp[];
/**
 * Crew patterns for Python
 */
export declare const PYTHON_CREW_PATTERNS: RegExp[];
/**
 * Tool patterns for Python
 */
export declare const PYTHON_TOOL_PATTERNS: RegExp[];
/**
 * LLM configuration patterns
 */
export declare const LLM_CONFIG_PATTERNS: RegExp[];
/**
 * Environment variable patterns
 */
export declare const LLM_ENV_PATTERNS: string[];
/**
 * Configuration file patterns
 */
export declare const CONFIG_FILE_PATTERNS: string[];
/**
 * File extensions to scan
 */
export declare const SCAN_EXTENSIONS: string[];
/**
 * Directories to exclude from scanning
 */
export declare const EXCLUDE_DIRS: string[];
/**
 * Import pattern interface
 */
export interface ImportPattern {
    pattern: string | RegExp;
    framework: 'crewai';
    confidence: number;
}
/**
 * Agent pattern interface
 */
export interface AgentPattern {
    pattern: RegExp;
    type: 'agent' | 'task' | 'crew' | 'tool';
    language: 'python' | 'typescript';
}
/**
 * Check if a path should be excluded
 */
export declare function shouldExcludePath(path: string): boolean;
/**
 * Get the language of a file based on extension
 */
export declare function getFileLanguage(filePath: string): 'python' | 'typescript' | 'yaml' | 'unknown';
/**
 * Classify agent type based on role and goal
 */
export declare function classifyAgentType(role: string, goal: string): 'researcher' | 'writer' | 'analyst' | 'coordinator' | 'executor' | 'unknown';
/**
 * Extract agent role from Python code
 */
export declare function extractAgentRole(content: string): string | null;
/**
 * Extract agent goal from Python code
 */
export declare function extractAgentGoal(content: string): string | null;
/**
 * Extract agent backstory from Python code
 */
export declare function extractAgentBackstory(content: string): string | null;
/**
 * Extract task description from Python code
 */
export declare function extractTaskDescription(content: string): string | null;
/**
 * Extract expected output from Python code
 */
export declare function extractExpectedOutput(content: string): string | null;
/**
 * Check if content contains CrewAI imports
 */
export declare function hasCrewAIImports(content: string): boolean;
/**
 * Check if content contains agent definitions
 */
export declare function hasAgentDefinitions(content: string): boolean;
/**
 * Check if content contains task definitions
 */
export declare function hasTaskDefinitions(content: string): boolean;
/**
 * Check if content contains crew definitions
 * TODO: Implement crew evaluation in future phases
 */
export declare function hasCrewDefinitions(content: string): boolean;
/**
 * Extract all agent names from content
 */
export declare function extractAgentNames(content: string): string[];
/**
 * Extract all task names from content
 */
export declare function extractTaskNames(content: string): string[];
/**
 * Detect process type (sequential or hierarchical)
 */
export declare function detectProcessType(content: string): 'sequential' | 'hierarchical' | 'unknown';
/**
 * Extract tools used by agents
 */
export declare function extractTools(content: string): string[];
//# sourceMappingURL=patterns.d.ts.map