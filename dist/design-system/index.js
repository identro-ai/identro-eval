"use strict";
/**
 * Identro Eval Unified Design System
 *
 * Provides consistent colors, typography, spacing, and components
 * across all CLI interfaces to ensure professional user experience.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentroUI = exports.Symbols = exports.Spacing = exports.Typography = exports.IdentroColors = void 0;
const chalk_1 = __importDefault(require("chalk"));
const boxen_1 = __importDefault(require("boxen"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const gradient_string_1 = __importDefault(require("gradient-string"));
// ============================================================================
// UNIFIED COLOR SYSTEM
// ============================================================================
exports.IdentroColors = {
    // Brand colors - consistent across all components
    brand: {
        primary: chalk_1.default.hex('#0070f3'), // Identro blue
        secondary: chalk_1.default.hex('#00d4ff'), // Light blue
        accent: chalk_1.default.hex('#00ff88'), // Success green
        muted: chalk_1.default.hex('#6B7280'), // Gray-500
    },
    // Status colors - semantic meaning consistent everywhere
    status: {
        success: chalk_1.default.hex('#10B981'), // Emerald-500
        error: chalk_1.default.hex('#EF4444'), // Red-500
        warning: chalk_1.default.hex('#F59E0B'), // Amber-500
        info: chalk_1.default.hex('#3B82F6'), // Blue-500
        pending: chalk_1.default.hex('#6B7280'), // Gray-500
    },
    // Test execution states - consistent across split-pane and reports
    execution: {
        queued: chalk_1.default.hex('#6B7280'), // Gray-500
        running: chalk_1.default.hex('#F59E0B'), // Amber-500
        completed: chalk_1.default.hex('#10B981'), // Emerald-500
        failed: chalk_1.default.hex('#EF4444'), // Red-500
        evaluating: chalk_1.default.hex('#8B5CF6'), // Purple-500
        cached: chalk_1.default.hex('#A855F7'), // Purple-600
    },
    // Text hierarchy - consistent typography colors
    text: {
        primary: chalk_1.default.white, // Primary text
        secondary: chalk_1.default.hex('#D1D5DB'), // Gray-300
        muted: chalk_1.default.hex('#9CA3AF'), // Gray-400
        disabled: chalk_1.default.hex('#6B7280'), // Gray-500
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
exports.Typography = {
    // Headers - consistent hierarchy
    h1: (text) => exports.IdentroColors.brand.primary.bold(text),
    h2: (text) => exports.IdentroColors.brand.secondary.bold(text),
    h3: (text) => exports.IdentroColors.text.primary.bold(text),
    // Body text
    body: (text) => exports.IdentroColors.text.primary(text),
    secondary: (text) => exports.IdentroColors.text.secondary(text),
    muted: (text) => exports.IdentroColors.text.muted(text),
    disabled: (text) => exports.IdentroColors.text.disabled(text),
    // Special formatting
    code: (text) => exports.IdentroColors.brand.secondary(text),
    path: (text) => exports.IdentroColors.text.muted(text),
    number: (text) => exports.IdentroColors.brand.accent(text),
    // Status text
    success: (text) => exports.IdentroColors.status.success(text),
    error: (text) => exports.IdentroColors.status.error(text),
    warning: (text) => exports.IdentroColors.status.warning(text),
    info: (text) => exports.IdentroColors.status.info(text),
    // Special effects - neon gradients for key moments
    gradient: {
        brandHeader: (text) => (0, gradient_string_1.default)(['#0070f3', '#00d4ff'])(text),
        success: (text) => (0, gradient_string_1.default)(['#10B981', '#00ff88'])(text),
        celebration: (text) => (0, gradient_string_1.default)(['#0070f3', '#00ff88', '#00d4ff'])(text),
        stepHeader: (text) => (0, gradient_string_1.default)(['#00d4ff', '#0070f3'])(text),
    }
};
// ============================================================================
// SPACING SYSTEM
// ============================================================================
exports.Spacing = {
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
exports.Symbols = {
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
class IdentroUI {
    /**
     * Consistent header rendering
     */
    static header(text, level = 1) {
        switch (level) {
            case 1:
                return exports.Typography.h1(text);
            case 2:
                return exports.Typography.h2(text);
            case 3:
                return exports.Typography.h3(text);
            default:
                return exports.Typography.h1(text);
        }
    }
    /**
     * Consistent status messages
     */
    static status(text, type) {
        const symbol = exports.Symbols.status[type];
        const color = exports.IdentroColors.status[type === 'pending' ? 'pending' : type];
        return `${color(symbol)} ${exports.Typography.body(text)}`;
    }
    /**
     * Consistent execution status (for test states)
     */
    static executionStatus(text, state) {
        const color = exports.IdentroColors.execution[state];
        const symbol = state === 'queued' ? exports.Symbols.status.pending :
            state === 'running' ? exports.Symbols.status.running :
                state === 'completed' ? exports.Symbols.status.success :
                    state === 'failed' ? exports.Symbols.status.error :
                        state === 'evaluating' ? '🧠' :
                            state === 'cached' ? '💾' : exports.Symbols.status.pending;
        return `${color(symbol)} ${exports.Typography.body(text)}`;
    }
    /**
     * Consistent progress bars
     */
    static progressBar(current, total, width = 20, style = 'bar') {
        const percentage = Math.max(0, Math.min(100, Math.round((current / total) * 100)));
        if (style === 'percentage') {
            return exports.Typography.number(`${percentage}%`);
        }
        const filled = Math.floor((percentage / 100) * width);
        const empty = Math.max(0, width - filled);
        let color = exports.IdentroColors.status.success;
        if (percentage < 33)
            color = exports.IdentroColors.status.error;
        else if (percentage < 66)
            color = exports.IdentroColors.status.warning;
        const bar = color(exports.Symbols.progress.bar.filled.repeat(filled)) +
            exports.IdentroColors.text.disabled(exports.Symbols.progress.bar.empty.repeat(empty));
        return `[${bar}] ${exports.Typography.number(percentage + '%')} (${current}/${total})`;
    }
    /**
     * Consistent progress rings (for split-pane display)
     */
    static progressRing(percentage) {
        const color = percentage >= 75 ? exports.IdentroColors.status.success :
            percentage >= 50 ? exports.IdentroColors.status.warning :
                percentage >= 25 ? exports.IdentroColors.status.error :
                    exports.IdentroColors.text.disabled;
        const symbol = percentage >= 75 ? exports.Symbols.progress.full :
            percentage >= 50 ? exports.Symbols.progress.threeQuarter :
                percentage >= 25 ? exports.Symbols.progress.half :
                    percentage > 0 ? exports.Symbols.progress.quarter :
                        exports.Symbols.progress.empty;
        return color(symbol);
    }
    /**
     * Consistent table creation
     */
    static table(options) {
        const { headers, rows, colWidths, style = 'default' } = options;
        const tableOptions = {
            head: headers.map(h => exports.Typography.h3(h)),
            style: {
                head: [],
                border: [exports.IdentroColors.ui.border.default],
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
        const table = new cli_table3_1.default(tableOptions);
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
            borderColor: exports.IdentroColors.ui.border[borderColor],
        };
        if (width) {
            boxOptions.width = width;
        }
        if (title) {
            boxOptions.title = exports.Typography.h3(title);
            boxOptions.titleAlignment = 'center';
        }
        return (0, boxen_1.default)(content, boxOptions);
    }
    /**
     * Consistent spacing
     */
    static space(size = 'md') {
        return '\n'.repeat(exports.Spacing[size]);
    }
    /**
     * Consistent separator lines
     */
    static separator(width = 80, style = 'light') {
        const char = style === 'heavy' ? '━' : style === 'double' ? '═' : '─';
        return exports.IdentroColors.text.disabled(char.repeat(width));
    }
    /**
     * Consistent entity display (agents/teams)
     */
    static entity(name, type, details) {
        const symbol = exports.Symbols.entities[type];
        const typeColor = type === 'agent' ? exports.IdentroColors.brand.secondary : exports.IdentroColors.status.warning;
        const typeLabel = typeColor(`(${type.charAt(0).toUpperCase() + type.slice(1)})`);
        let result = `${symbol} ${exports.Typography.body(name)} ${typeLabel}`;
        if (details) {
            result += ` ${exports.Typography.muted('- ' + details)}`;
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
        return exports.Typography.code(`[${id}]`);
    }
    /**
     * Consistent loading spinner text
     */
    static loading(message) {
        return `${exports.IdentroColors.execution.running('●')} ${exports.Typography.body(message)}`;
    }
    /**
     * Consistent step indicator
     */
    static step(current, total, title) {
        const stepText = `Step ${current} of ${total}: ${title}`;
        const progress = IdentroUI.progressBar(current, total, 20, 'percentage');
        return exports.Typography.h2(stepText) + '\n' +
            IdentroUI.separator(Math.max(40, stepText.length)) + '\n' +
            exports.Typography.muted(`Progress: ${progress}`);
    }
}
exports.IdentroUI = IdentroUI;
// ============================================================================
// EXPORTS
// ============================================================================
exports.default = {
    Colors: exports.IdentroColors,
    Typography: exports.Typography,
    Spacing: exports.Spacing,
    Symbols: exports.Symbols,
    UI: IdentroUI,
};
//# sourceMappingURL=index.js.map