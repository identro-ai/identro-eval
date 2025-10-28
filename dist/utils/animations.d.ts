/**
 * Enhanced Animation Utilities for Rich Terminal UI
 */
import cliSpinners from 'cli-spinners';
export declare class AnimatedDisplay {
    private animation;
    /**
     * Show animated success message
     */
    success(message: string, duration?: number): Promise<void>;
    /**
     * Show animated error message
     */
    error(message: string, duration?: number): Promise<void>;
    /**
     * Show rainbow text animation
     */
    rainbow(text: string, duration?: number): Promise<void>;
    /**
     * Show pulse animation
     */
    pulse(text: string, duration?: number): Promise<void>;
    /**
     * Show glitch animation
     */
    glitch(text: string, duration?: number): Promise<void>;
    /**
     * Show loading animation with custom spinner
     */
    loading(text: string, spinnerName?: keyof typeof cliSpinners): any;
    /**
     * Show progress bar with animation
     */
    progressBar(current: number, total: number, label?: string): void;
    /**
     * Clear the screen with animation
     */
    clearScreen(): void;
    /**
     * Show typing animation
     */
    typeWriter(text: string, delay?: number): Promise<void>;
    /**
     * Show countdown animation
     */
    countdown(seconds: number, message?: string): Promise<void>;
}
export declare const animations: AnimatedDisplay;
//# sourceMappingURL=animations.d.ts.map