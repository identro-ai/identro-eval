/**
 * Identro Eval Unified Design System
 *
 * Provides consistent colors, typography, spacing, and components
 * across all CLI interfaces to ensure professional user experience.
 */
import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import gradient from 'gradient-string';
// ============================================================================
// UNIFIED COLOR SYSTEM
// ============================================================================
export const IdentroColors = {
    // Brand colors - consistent across all components
    brand: {
        primary: chalk.hex('#0070f3'), // Identro blue
        secondary: chalk.hex('#00d4ff'), // Light blue
        accent: chalk.hex('#00ff88'), // Success green
        muted: chalk.hex('#6B7280'), // Gray-500
    },
    // Status colors - semantic meaning consistent everywhere
    status: {
        success: chalk.hex('#10B981'), // Emerald-500
        error: chalk.hex('#EF4444'), // Red-500
        warning: chalk.hex('#F59E0B'), // Amber-500
        info: chalk.hex('#3B82F6'), // Blue-500
        pending: chalk.hex('#6B7280'), // Gray-500
    },
    // Test execution states - consistent across split-pane and reports
    execution: {
        queued: chalk.hex('#6B7280'), // Gray-500
        running: chalk.hex('#F59E0B'), // Amber-500
        completed: chalk.hex('#10B981'), // Emerald-500
        failed: chalk.hex('#EF4444'), // Red-500
        evaluating: chalk.hex('#8B5CF6'), // Purple-500
        cached: chalk.hex('#A855F7'), // Purple-600
    },
    // Text hierarchy - consistent typography colors
    text: {
        primary: chalk.white, // Primary text
        secondary: chalk.hex('#D1D5DB'), // Gray-300
        muted: chalk.hex('#9CA3AF'), // Gray-400
        disabled: chalk.hex('#6B7280'), // Gray-500
    },
    // UI elements - borders, backgrounds, etc.
    ui: {
        border: {
            default: 'gray',
            active: 'cyan',
            success: 'green',
            error: 'red',
            warning: 'yellow',
        },
        background: {
            default: 'black',
            subtle: '#111827', // Gray-900
        }
    }
};
// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================
export const Typography = {
    // Headers - consistent hierarchy
    h1: (text) => IdentroColors.brand.primary.bold(text),
    h2: (text) => IdentroColors.brand.secondary.bold(text),
    h3: (text) => IdentroColors.text.primary.bold(text),
    // Body text
    body: (text) => IdentroColors.text.primary(text),
    secondary: (text) => IdentroColors.text.secondary(text),
    muted: (text) => IdentroColors.text.muted(text),
    disabled: (text) => IdentroColors.text.disabled(text),
    // Special formatting
    code: (text) => IdentroColors.brand.secondary(text),
    path: (text) => IdentroColors.text.muted(text),
    number: (text) => IdentroColors.brand.accent(text),
    // Status text
    success: (text) => IdentroColors.status.success(text),
    error: (text) => IdentroColors.status.error(text),
    warning: (text) => IdentroColors.status.warning(text),
    info: (text) => IdentroColors.status.info(text),
    // Special effects - neon gradients for key moments
    gradient: {
        brandHeader: (text) => gradient(['#0070f3', '#00d4ff'])(text),
        success: (text) => gradient(['#10B981', '#00ff88'])(text),
        celebration: (text) => gradient(['#0070f3', '#00ff88', '#00d4ff'])(text),
        stepHeader: (text) => gradient(['#00d4ff', '#0070f3'])(text),
    }
};
// ============================================================================
// SPACING SYSTEM
// ============================================================================
export const Spacing = {
    none: 0,
    xs: 1, // 1 line
    sm: 2, // 2 lines
    md: 3, // 3 lines
    lg: 4, // 4 lines
    xl: 6, // 6 lines
    xxl: 8, // 8 lines
};
// ============================================================================
// SYMBOLS & ICONS
// ============================================================================
export const Symbols = {
    // Status indicators - consistent across all components
    status: {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ',
        pending: '○',
        running: '●',
    },
    // Progress indicators - unified system
    progress: {
        empty: '◯', // 0%
        quarter: '◔', // 25%
        half: '◑', // 50%
        threeQuarter: '◕', // 75%
        full: '●', // 100%
        bar: {
            filled: '█',
            empty: '░',
        }
    },
    // Entity types
    entities: {
        agent: '🤖',
        team: '👥',
        test: '🧪',
        dimension: '📋',
    },
    // Actions
    actions: {
        dashboard: '📈',
        details: '📋',
        export: '💾',
        compare: '🔄',
        rerun: '🔁',
        quit: '🚪',
    },
    // Arrows and connectors
    connectors: {
        arrow: '→',
        arrowBack: '←',
        branch: '├─',
        lastBranch: '└─',
        pipe: '│',
        bullet: '•',
    }
};
// ============================================================================
// UNIFIED COMPONENT SYSTEM
// ============================================================================
export class IdentroUI {
    /**
     * Consistent header rendering
     */
    static header(text, level = 1) {
        switch (level) {
            case 1:
                return Typography.h1(text);
            case 2:
                return Typography.h2(text);
            case 3:
                return Typography.h3(text);
            default:
                return Typography.h1(text);
        }
    }
    /**
     * Consistent status messages
     */
    static status(text, type) {
        const symbol = Symbols.status[type];
        const color = IdentroColors.status[type === 'pending' ? 'pending' : type];
        return `${color(symbol)} ${Typography.body(text)}`;
    }
    /**
     * Consistent execution status (for test states)
     */
    static executionStatus(text, state) {
        const color = IdentroColors.execution[state];
        const symbol = state === 'queued' ? Symbols.status.pending :
            state === 'running' ? Symbols.status.running :
                state === 'completed' ? Symbols.status.success :
                    state === 'failed' ? Symbols.status.error :
                        state === 'evaluating' ? '🧠' :
                            state === 'cached' ? '💾' : Symbols.status.pending;
        return `${color(symbol)} ${Typography.body(text)}`;
    }
    /**
     * Consistent progress bars
     */
    static progressBar(current, total, width = 20, style = 'bar') {
        const percentage = Math.max(0, Math.min(100, Math.round((current / total) * 100)));
        if (style === 'percentage') {
            return Typography.number(`${percentage}%`);
        }
        const filled = Math.floor((percentage / 100) * width);
        const empty = Math.max(0, width - filled);
        let color = IdentroColors.status.success;
        if (percentage < 33)
            color = IdentroColors.status.error;
        else if (percentage < 66)
            color = IdentroColors.status.warning;
        const bar = color(Symbols.progress.bar.filled.repeat(filled)) +
            IdentroColors.text.disabled(Symbols.progress.bar.empty.repeat(empty));
        return `[${bar}] ${Typography.number(percentage + '%')} (${current}/${total})`;
    }
    /**
     * Consistent progress rings (for split-pane display)
     */
    static progressRing(percentage) {
        const color = percentage >= 75 ? IdentroColors.status.success :
            percentage >= 50 ? IdentroColors.status.warning :
                percentage >= 25 ? IdentroColors.status.error :
                    IdentroColors.text.disabled;
        const symbol = percentage >= 75 ? Symbols.progress.full :
            percentage >= 50 ? Symbols.progress.threeQuarter :
                percentage >= 25 ? Symbols.progress.half :
                    percentage > 0 ? Symbols.progress.quarter :
                        Symbols.progress.empty;
        return color(symbol);
    }
    /**
     * Consistent table creation
     */
    static table(options) {
        const { headers, rows, colWidths, style = 'default' } = options;
        const tableOptions = {
            head: headers.map(h => Typography.h3(h)),
            style: {
                head: [],
                border: [IdentroColors.ui.border.default],
                'padding-left': style === 'minimal' ? 0 : 1,
                'padding-right': style === 'minimal' ? 0 : 1,
            },
        };
        if (colWidths) {
            tableOptions.colWidths = colWidths;
        }
        if (style === 'minimal') {
            tableOptions.chars = {
                'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
                'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
                'left': '', 'left-mid': '', 'mid': '', 'mid-mid': '',
                'right': '', 'right-mid': '', 'middle': ' '
            };
        }
        const table = new Table(tableOptions);
        rows.forEach(row => {
            table.push(row);
        });
        return table.toString();
    }
    /**
     * Consistent box rendering
     */
    static box(content, options = {}) {
        const { title, padding = 1, margin = 1, borderColor = 'default', borderStyle = 'round', width } = options;
        const boxOptions = {
            padding,
            margin,
            borderStyle,
            borderColor: IdentroColors.ui.border[borderColor],
        };
        if (width) {
            boxOptions.width = width;
        }
        if (title) {
            boxOptions.title = Typography.h3(title);
            boxOptions.titleAlignment = 'center';
        }
        return boxen(content, boxOptions);
    }
    /**
     * Consistent spacing
     */
    static space(size = 'md') {
        return '\n'.repeat(Spacing[size]);
    }
    /**
     * Consistent separator lines
     */
    static separator(width = 80, style = 'light') {
        const char = style === 'heavy' ? '━' : style === 'double' ? '═' : '─';
        return IdentroColors.text.disabled(char.repeat(width));
    }
    /**
     * Consistent entity display (agents/teams)
     */
    static entity(name, type, details) {
        const symbol = Symbols.entities[type];
        const typeColor = type === 'agent' ? IdentroColors.brand.secondary : IdentroColors.status.warning;
        const typeLabel = typeColor(`(${type.charAt(0).toUpperCase() + type.slice(1)})`);
        let result = `${symbol} ${Typography.body(name)} ${typeLabel}`;
        if (details) {
            result += ` ${Typography.muted('- ' + details)}`;
        }
        return result;
    }
    /**
     * Consistent test ID formatting
     */
    static testId(dimension, inputIndex, runIndex, totalRuns) {
        let id = `T${inputIndex + 1}.${dimension.charAt(0).toUpperCase()}`;
        if (runIndex !== undefined && totalRuns !== undefined) {
            id += `.${runIndex + 1}/${totalRuns}`;
        }
        return Typography.code(`[${id}]`);
    }
    /**
     * Consistent loading spinner text
     */
    static loading(message) {
        return `${IdentroColors.execution.running('●')} ${Typography.body(message)}`;
    }
    /**
     * Consistent step indicator
     */
    static step(current, total, title) {
        const stepText = `Step ${current} of ${total}: ${title}`;
        const progress = IdentroUI.progressBar(current, total, 20, 'percentage');
        return Typography.h2(stepText) + '\n' +
            IdentroUI.separator(Math.max(40, stepText.length)) + '\n' +
            Typography.muted(`Progress: ${progress}`);
    }
}
// ============================================================================
// EXPORTS
// ============================================================================
export default {
    Colors: IdentroColors,
    Typography,
    Spacing,
    Symbols,
    UI: IdentroUI,
};
//# sourceMappingURL=index.js.map