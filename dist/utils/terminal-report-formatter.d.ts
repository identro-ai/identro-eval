/**
 * Terminal Report Formatter - Modern Terminal UI
 *
 * Creates beautiful terminal displays for test results with modern aesthetics
 * Now supports dynamic dimensions via DimensionMetadataService
 */
import type { TestResults } from '@identro/eval-core';
import { DimensionMetadataService } from '@identro/eval-core';
/**
 * Initialize dimension metadata service for dynamic dimension support
 */
export declare function initializeDimensionMetadata(service: DimensionMetadataService): void;
/**
 * Display beautiful terminal summary after test completion
 * Now uses TestStateManager directly - same source as split-pane display
 */
export declare function displayTerminalSummary(results: Map<string, TestResults>, testStateManager?: any): Promise<void>;
/**
 * Display interactive menu for post-test actions
 */
export declare function showInteractiveMenu(reportPath: string): Promise<string>;
/**
 * Display detailed test results in terminal
 * Returns true if user wants to quit (pressed Q or Ctrl+C)
 */
export declare function displayDetailedResults(results: Map<string, TestResults>, testStateManager?: any): Promise<boolean>;
/**
 * Pre-load dimension metadata for all dimensions in results
 * Should be called before displaying terminal summary
 */
export declare function preloadDimensionMetadata(dimensions: string[]): Promise<void>;
//# sourceMappingURL=terminal-report-formatter.d.ts.map