/**
 * Identro Eval Unified Design System
 *
 * Provides consistent colors, typography, spacing, and components
 * across all CLI interfaces to ensure professional user experience.
 */
import chalk from 'chalk';
export declare const IdentroColors: {
    brand: {
        primary: chalk.Chalk;
        secondary: chalk.Chalk;
        accent: chalk.Chalk;
        muted: chalk.Chalk;
    };
    status: {
        success: chalk.Chalk;
        error: chalk.Chalk;
        warning: chalk.Chalk;
        info: chalk.Chalk;
        pending: chalk.Chalk;
    };
    execution: {
        queued: chalk.Chalk;
        running: chalk.Chalk;
        completed: chalk.Chalk;
        failed: chalk.Chalk;
        evaluating: chalk.Chalk;
        cached: chalk.Chalk;
    };
    text: {
        primary: chalk.Chalk;
        secondary: chalk.Chalk;
        muted: chalk.Chalk;
        disabled: chalk.Chalk;
    };
    ui: {
        border: {
            default: string;
            active: string;
            success: string;
            error: string;
            warning: string;
        };
        background: {
            default: string;
            subtle: string;
        };
    };
};
export declare const Typography: {
    h1: (text: string) => string;
    h2: (text: string) => string;
    h3: (text: string) => string;
    body: (text: string) => string;
    secondary: (text: string) => string;
    muted: (text: string) => string;
    disabled: (text: string) => string;
    code: (text: string) => string;
    path: (text: string) => string;
    number: (text: string) => string;
    success: (text: string) => string;
    error: (text: string) => string;
    warning: (text: string) => string;
    info: (text: string) => string;
    gradient: {
        brandHeader: (text: string) => string;
        success: (text: string) => string;
        celebration: (text: string) => string;
        stepHeader: (text: string) => string;
    };
};
export declare const Spacing: {
    none: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
};
export declare const Symbols: {
    status: {
        success: string;
        error: string;
        warning: string;
        info: string;
        pending: string;
        running: string;
    };
    progress: {
        empty: string;
        quarter: string;
        half: string;
        threeQuarter: string;
        full: string;
        bar: {
            filled: string;
            empty: string;
        };
    };
    entities: {
        agent: string;
        team: string;
        test: string;
        dimension: string;
    };
    actions: {
        dashboard: string;
        details: string;
        export: string;
        compare: string;
        rerun: string;
        quit: string;
    };
    connectors: {
        arrow: string;
        arrowBack: string;
        branch: string;
        lastBranch: string;
        pipe: string;
        bullet: string;
    };
};
export declare class IdentroUI {
    /**
     * Consistent header rendering
     */
    static header(text: string, level?: 1 | 2 | 3): string;
    /**
     * Consistent status messages
     */
    static status(text: string, type: 'success' | 'error' | 'warning' | 'info' | 'pending'): string;
    /**
     * Consistent execution status (for test states)
     */
    static executionStatus(text: string, state: 'queued' | 'running' | 'completed' | 'failed' | 'evaluating' | 'cached'): string;
    /**
     * Consistent progress bars
     */
    static progressBar(current: number, total: number, width?: number, style?: 'bar' | 'percentage'): string;
    /**
     * Consistent progress rings (for split-pane display)
     */
    static progressRing(percentage: number): string;
    /**
     * Consistent table creation
     */
    static table(options: {
        headers: string[];
        rows: string[][];
        colWidths?: number[];
        style?: 'default' | 'minimal' | 'bordered';
    }): string;
    /**
     * Consistent box rendering
     */
    static box(content: string, options?: {
        title?: string;
        padding?: number;
        margin?: number | {
            top?: number;
            bottom?: number;
            left?: number;
            right?: number;
        };
        borderColor?: 'default' | 'active' | 'success' | 'error' | 'warning';
        borderStyle?: 'single' | 'double' | 'round' | 'bold';
        width?: number;
    }): string;
    /**
     * Consistent spacing
     */
    static space(size?: keyof typeof Spacing): string;
    /**
     * Consistent separator lines
     */
    static separator(width?: number, style?: 'light' | 'heavy' | 'double'): string;
    /**
     * Consistent entity display (agents/teams)
     */
    static entity(name: string, type: 'agent' | 'team', details?: string): string;
    /**
     * Consistent test ID formatting
     */
    static testId(dimension: string, inputIndex: number, runIndex?: number, totalRuns?: number): string;
    /**
     * Consistent loading spinner text
     */
    static loading(message: string): string;
    /**
     * Consistent step indicator
     */
    static step(current: number, total: number, title: string): string;
}
declare const _default: {
    Colors: {
        brand: {
            primary: chalk.Chalk;
            secondary: chalk.Chalk;
            accent: chalk.Chalk;
            muted: chalk.Chalk;
        };
        status: {
            success: chalk.Chalk;
            error: chalk.Chalk;
            warning: chalk.Chalk;
            info: chalk.Chalk;
            pending: chalk.Chalk;
        };
        execution: {
            queued: chalk.Chalk;
            running: chalk.Chalk;
            completed: chalk.Chalk;
            failed: chalk.Chalk;
            evaluating: chalk.Chalk;
            cached: chalk.Chalk;
        };
        text: {
            primary: chalk.Chalk;
            secondary: chalk.Chalk;
            muted: chalk.Chalk;
            disabled: chalk.Chalk;
        };
        ui: {
            border: {
                default: string;
                active: string;
                success: string;
                error: string;
                warning: string;
            };
            background: {
                default: string;
                subtle: string;
            };
        };
    };
    Typography: {
        h1: (text: string) => string;
        h2: (text: string) => string;
        h3: (text: string) => string;
        body: (text: string) => string;
        secondary: (text: string) => string;
        muted: (text: string) => string;
        disabled: (text: string) => string;
        code: (text: string) => string;
        path: (text: string) => string;
        number: (text: string) => string;
        success: (text: string) => string;
        error: (text: string) => string;
        warning: (text: string) => string;
        info: (text: string) => string;
        gradient: {
            brandHeader: (text: string) => string;
            success: (text: string) => string;
            celebration: (text: string) => string;
            stepHeader: (text: string) => string;
        };
    };
    Spacing: {
        none: number;
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
        xxl: number;
    };
    Symbols: {
        status: {
            success: string;
            error: string;
            warning: string;
            info: string;
            pending: string;
            running: string;
        };
        progress: {
            empty: string;
            quarter: string;
            half: string;
            threeQuarter: string;
            full: string;
            bar: {
                filled: string;
                empty: string;
            };
        };
        entities: {
            agent: string;
            team: string;
            test: string;
            dimension: string;
        };
        actions: {
            dashboard: string;
            details: string;
            export: string;
            compare: string;
            rerun: string;
            quit: string;
        };
        connectors: {
            arrow: string;
            arrowBack: string;
            branch: string;
            lastBranch: string;
            pipe: string;
            bullet: string;
        };
    };
    UI: typeof IdentroUI;
};
export default _default;
//# sourceMappingURL=index.d.ts.map