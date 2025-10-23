/**
 * Report command - Generate evaluation reports
 */
import { Command } from 'commander';
import type { TestResults } from '@identro/eval-core';
/**
 * Generate rich report data structure from TestStateManager data only
 * Completely data-driven with no hardcoded dimension references or fallbacks
 */
export declare function generateRichReportData(results: Map<string, TestResults>, projectPath: string, testStateManager?: any): Promise<any>;
/**
 * Generate rich HTML report by combining template with data
 */
export declare function generateRichHtmlReport(reportData: any, projectPath: string): Promise<string>;
export declare function reportCommand(): Command;
//# sourceMappingURL=report.d.ts.map