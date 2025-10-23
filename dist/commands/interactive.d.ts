/**
 * Interactive CLI Wizard - Simplified Architecture
 *
 * Provides a guided, interactive experience for evaluating AI agents
 * with modern UI dimensions and best practices.
 *
 * Uses SimplifiedTestRunner instead of TestOrchestrator to eliminate double orchestration.
 */
import { Command } from 'commander';
import { UIManager } from '../utils/ui-manager';
import type { EvalSpec, TestResults } from '@identro/eval-core';
export interface InteractiveSession {
    projectPath: string;
    framework?: string;
    agents: any[];
    allAgents?: any[];
    llmConfig?: any;
    evalSpec?: EvalSpec;
    reanalyzeExisting?: string[];
    generateTestInputs?: boolean;
    testConfig?: {
        selectedAgents: string[];
        dimensions: string[];
        verbose: boolean;
    };
    results?: Map<string, TestResults>;
    mockResponses?: {
        [key: string]: any;
    };
    nonInteractive?: boolean;
    testLogger?: (message: string, level?: string) => void;
}
/**
 * Create the interactive command
 */
export declare function interactiveCommand(): Command;
/**
 * Main interactive wizard flow
 */
export declare function runInteractiveWizard(options?: {
    path?: string;
}): Promise<void>;
/**
 * Display modern welcome banner as part of Step 1
 *
 * Testing enhancements:
 * - Exported for testing
 * - Can be skipped in non-interactive mode
 */
export declare function displayWelcomeBanner(session?: InteractiveSession): Promise<void>;
/**
 * Step 1: Discover framework and agents
 *
 * Testing enhancements:
 * - Exported for direct testing without UI
 * - Supports mockResponses for non-interactive mode
 * - Uses testLogger when available
 */
export declare function discoverStep(session: InteractiveSession, ui?: UIManager): Promise<void>;
/**
 * Step 2: Configure LLM
 *
 * Testing enhancements:
 * - Exported for direct testing
 * - Can use mockResponses.llmConfig for non-interactive mode
 * - Logs to testLogger when available
 */
export declare function configureLLMStep(session: InteractiveSession, ui?: UIManager): Promise<void>;
/**
 * Step 3: Analyze agents
 *
 * Testing enhancements:
 * - Exported for direct testing
 * - Uses mockResponses for agent selection in non-interactive mode
 * - Logs progress to testLogger
 */
export declare function analyzeStep(session: InteractiveSession, ui?: UIManager): Promise<void>;
/**
 * Step 4: Configure tests
 *
 * Testing enhancements:
 * - Exported for direct testing
 * - Uses mockResponses.testConfig for non-interactive mode
 * - Logs configuration to testLogger
 * - Now includes LLM test generation (moved from analyzeStep in LLM-centric architecture)
 */
export declare function configureTestsStep(session: InteractiveSession, ui?: UIManager): Promise<void>;
/**
 * Step 5: Run tests - Simplified Architecture
 *
 * Uses SimplifiedTestRunner instead of TestOrchestrator to eliminate double orchestration
 */
export declare function runTestsStep(session: InteractiveSession): Promise<void>;
/**
 * Step 6: Generate report
 */
export declare function reportStep(session: InteractiveSession): Promise<void>;
/**
 * Display completion message
 */
export declare function displayCompletion(session: InteractiveSession, ui?: UIManager): Promise<void>;
//# sourceMappingURL=interactive.d.ts.map