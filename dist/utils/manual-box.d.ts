/**
 * Manual Box Drawing Utilities
 *
 * Provides manual ASCII box drawing with exact dimension control.
 * Works reliably with any package versions since we control every character.
 */
export type BorderStyle = 'round' | 'single' | 'double';
export type BorderColor = 'gray' | 'yellow' | 'green' | 'red' | 'cyan';
interface BoxOptions {
    borderStyle?: BorderStyle;
    borderColor?: BorderColor;
    padding?: number;
}
/**
 * Draw a box with exact dimensions
 */
export declare function drawBox(content: string, width: number, height: number, options?: BoxOptions): string;
/**
 * Pad lines to exact width, accounting for ANSI codes
 */
export declare function padLinesToWidth(lines: string[], width: number): string[];
export {};
//# sourceMappingURL=manual-box.d.ts.map