/**
 * Display utilities for CLI
 */
import { Ora } from 'ora';
import Table from 'cli-table3';
/**
 * Display the CLI banner
 */
export declare function displayBanner(): void;
/**
 * Create a spinner for long-running operations
 */
export declare function createSpinner(text: string): Ora;
/**
 * Display success message
 */
export declare function success(message: string): void;
/**
 * Display error message
 */
export declare function error(message: string): void;
/**
 * Display warning message
 */
export declare function warning(message: string): void;
/**
 * Display info message
 */
export declare function info(message: string): void;
/**
 * Display a section header
 */
export declare function section(title: string): void;
/**
 * Display a subsection
 */
export declare function subsection(title: string): void;
/**
 * Display a list item
 */
export declare function listItem(text: string, indent?: number): void;
/**
 * Create a table for displaying data
 */
export declare function createTable(options?: any): Table.Table;
/**
 * Display key-value pairs
 */
export declare function displayKeyValue(key: string, value: string | number, indent?: number): void;
/**
 * Display a progress bar
 */
export declare function displayProgress(current: number, total: number, label?: string): void;
/**
 * Display JSON output (for --json flag)
 */
export declare function displayJson(data: any): void;
/**
 * Display a code block
 */
export declare function displayCode(code: string, language?: string): void;
/**
 * Display test results
 */
export declare function displayTestResults(passed: number, failed: number, skipped?: number): void;
/**
 * Display discovered agents
 */
export declare function displayAgents(agents: Array<{
    name: string;
    type: string;
    framework: string;
}>): void;
/**
 * Display LLM options
 */
export declare function displayLLMOptions(llms: Array<{
    provider: string;
    model: string;
    source: string;
    status: 'available' | 'error' | 'unconfigured';
    cost?: string;
}>): void;
//# sourceMappingURL=display.d.ts.map