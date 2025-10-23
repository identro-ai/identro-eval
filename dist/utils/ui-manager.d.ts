/**
 * UI Manager for Streamlined Interactive CLI
 *
 * Provides consistent, clean UI components using the unified design system
 * for professional user experience across all interfaces.
 */
/**
 * Step progress indicator using unified design system
 */
export declare class StepIndicator {
    private currentStep;
    private totalSteps;
    private stepNames;
    setCurrentStep(step: number): void;
    renderHeader(stepName: string): string;
    renderProgress(): string;
}
/**
 * Enhanced table renderer for agents and teams using unified design system
 */
export declare class TableRenderer {
    /**
     * Render agents table with consistent styling
     */
    static renderAgentsTable(agents: Array<{
        name: string;
        type: string;
        framework: string;
    }>): string;
    /**
     * Render teams table with enhanced styling
     */
    static renderTeamsTable(teams: Array<{
        name: string;
        type: string;
        contract: {
            description: string;
            capabilities: string[];
        };
        composition?: {
            memberCount?: number;
            process?: string;
        };
    }>): string;
}
/**
 * Progress bar renderer using unified design system
 */
export declare class ProgressBar {
    static render(current: number, total: number, label?: string, width?: number): string;
}
/**
 * Status box renderer using unified design system
 */
export declare class StatusBox {
    static render(title: string, content: string, status?: 'info' | 'success' | 'warning' | 'error'): string;
}
/**
 * Choice renderer using unified design system
 */
export declare class ChoiceRenderer {
    static renderDimensionChoices(dimensions: Array<{
        name: string;
        description: string;
        shortDescription: string;
    }>): Array<{
        name: string;
        value: string;
        checked?: boolean;
    }>;
    static renderLLMChoices(llms: Array<{
        provider: string;
        model: string;
        source?: string;
        status: 'available' | 'error' | 'unconfigured';
    }>): Array<{
        name: string;
        value: number;
    }>;
}
/**
 * Animated text effects using unified design system
 */
export declare class TextEffects {
    static typewriter(text: string, delay?: number): Promise<void>;
    static pulse(text: string, duration?: number): Promise<void>;
    static countdown(seconds: number, message?: string): Promise<void>;
}
/**
 * Verbose mode toggle using unified design system
 */
export declare class VerboseMode {
    private static isVerbose;
    static toggle(): void;
    static set(verbose: boolean): void;
    static get(): boolean;
    static log(message: string, level?: 'info' | 'debug' | 'warn'): void;
}
/**
 * Main UI Manager class
 */
export declare class UIManager {
    stepIndicator: StepIndicator;
    tableRenderer: typeof TableRenderer;
    progressBar: typeof ProgressBar;
    statusBox: typeof StatusBox;
    choiceRenderer: typeof ChoiceRenderer;
    textEffects: typeof TextEffects;
    verboseMode: typeof VerboseMode;
    /**
     * Clear screen and show header
     */
    clearAndShowHeader(stepName: string): void;
    /**
     * Show completion message using unified design system
     */
    showCompletion(summary: {
        agentCount: number;
        teamCount: number;
        dimensions: string[];
        duration?: string;
    }): void;
    /**
     * Show help text for current step using unified design system
     */
    showHelp(step: number): void;
}
//# sourceMappingURL=ui-manager.d.ts.map