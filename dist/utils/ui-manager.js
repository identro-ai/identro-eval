"use strict";
/**
 * UI Manager for Streamlined Interactive CLI
 *
 * Provides consistent, clean UI components using the unified design system
 * for professional user experience across all interfaces.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIManager = exports.VerboseMode = exports.TextEffects = exports.ChoiceRenderer = exports.StatusBox = exports.ProgressBar = exports.TableRenderer = exports.StepIndicator = void 0;
const design_system_1 = require("../design-system");
/**
 * Step progress indicator using unified design system
 */
class StepIndicator {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 4;
        this.stepNames = [
            'Discovery',
            'LLM Config',
            'Test Config & Generation',
            'Execution'
        ];
    }
    setCurrentStep(step) {
        this.currentStep = step;
    }
    renderHeader(stepName) {
        const stepText = `Step ${this.currentStep} of ${this.totalSteps}: ${stepName}`;
        return design_system_1.Typography.gradient.stepHeader(stepText) + '\n' +
            design_system_1.IdentroUI.separator(Math.max(40, stepText.length));
    }
    renderProgress() {
        return design_system_1.IdentroUI.progressBar(this.currentStep, this.totalSteps, 20, 'percentage');
    }
}
exports.StepIndicator = StepIndicator;
/**
 * Enhanced table renderer for agents and teams using unified design system
 */
class TableRenderer {
    /**
     * Render agents table with consistent styling
     */
    static renderAgentsTable(agents) {
        if (agents.length === 0) {
            return design_system_1.Typography.warning('No agents found');
        }
        const headers = ['Agent Name', 'Type', 'Framework'];
        const rows = agents.map(agent => [
            design_system_1.IdentroUI.entity(agent.name, 'agent'),
            design_system_1.Typography.secondary(agent.type),
            design_system_1.Typography.code(agent.framework)
        ]);
        return design_system_1.IdentroUI.table({
            headers,
            rows,
            colWidths: [25, 15, 12]
        });
    }
    /**
     * Render teams table with enhanced styling
     */
    static renderTeamsTable(teams) {
        if (teams.length === 0) {
            return design_system_1.Typography.warning('No teams found');
        }
        const lines = [];
        teams.forEach((team, index) => {
            lines.push(design_system_1.IdentroUI.entity(team.name, 'team', team.type));
            // Description
            const desc = team.contract.description.length > 60
                ? team.contract.description.substring(0, 57) + '...'
                : team.contract.description;
            lines.push(`  ${design_system_1.Typography.muted('Description:')} ${design_system_1.Typography.secondary(desc)}`);
            // Members and process
            const memberCount = team.composition?.memberCount || 0;
            const process = team.composition?.process || 'unknown';
            lines.push(`  ${design_system_1.Typography.muted('Members:')} ${design_system_1.Typography.number(memberCount.toString())} agents`);
            lines.push(`  ${design_system_1.Typography.muted('Process:')} ${design_system_1.Typography.code(process)}`);
            // Capabilities (first 3)
            const caps = team.contract.capabilities.slice(0, 3);
            const capsText = caps.join(', ') + (team.contract.capabilities.length > 3 ? '...' : '');
            lines.push(`  ${design_system_1.Typography.muted('Capabilities:')} ${design_system_1.Typography.secondary(capsText)}`);
            if (index < teams.length - 1) {
                lines.push(''); // Add spacing between teams
            }
        });
        return lines.join('\n');
    }
}
exports.TableRenderer = TableRenderer;
/**
 * Progress bar renderer using unified design system
 */
class ProgressBar {
    static render(current, total, label, width = 30) {
        return design_system_1.IdentroUI.progressBar(current, total, width);
    }
}
exports.ProgressBar = ProgressBar;
/**
 * Status box renderer using unified design system
 */
class StatusBox {
    static render(title, content, status = 'info') {
        const borderColor = status === 'info' ? 'active' : status;
        const statusText = design_system_1.IdentroUI.status(title, status === 'info' ? 'info' : status);
        return design_system_1.IdentroUI.box(`${statusText}\n\n${content}`, {
            borderColor: borderColor,
            width: Math.min(80, process.stdout.columns || 80),
        });
    }
}
exports.StatusBox = StatusBox;
/**
 * Choice renderer using unified design system
 */
class ChoiceRenderer {
    static renderDimensionChoices(dimensions) {
        return dimensions.map(dimension => ({
            name: `${design_system_1.Typography.code(dimension.name)} - ${design_system_1.Typography.secondary(dimension.shortDescription)}`,
            value: dimension.name,
            checked: true // Default to all selected
        }));
    }
    static renderLLMChoices(llms) {
        return llms.map((llm, index) => {
            const statusIcon = llm.status === 'available' ? design_system_1.IdentroColors.status.success('✓') :
                llm.status === 'error' ? design_system_1.IdentroColors.status.error('✗') :
                    design_system_1.IdentroColors.status.warning('○');
            const provider = design_system_1.Typography.h3(llm.provider);
            const model = design_system_1.Typography.code(llm.model);
            const source = llm.source ? design_system_1.Typography.muted(`(${llm.source})`) : '';
            return {
                name: `${statusIcon} ${provider} - ${model} ${source}`,
                value: index
            };
        });
    }
}
exports.ChoiceRenderer = ChoiceRenderer;
/**
 * Animated text effects using unified design system
 */
class TextEffects {
    static typewriter(text, delay = 50) {
        return new Promise((resolve) => {
            let i = 0;
            const timer = setInterval(() => {
                process.stdout.write(text[i]);
                i++;
                if (i >= text.length) {
                    clearInterval(timer);
                    resolve();
                }
            }, delay);
        });
    }
    static pulse(text, duration = 1000) {
        return new Promise((resolve) => {
            console.log(design_system_1.Typography.h2(text));
            setTimeout(resolve, duration);
        });
    }
    static countdown(seconds, message = 'Starting in') {
        return new Promise((resolve) => {
            let count = seconds;
            const timer = setInterval(() => {
                process.stdout.write(`\r${design_system_1.Typography.warning(message)} ${design_system_1.Typography.number(count.toString())}...`);
                count--;
                if (count < 0) {
                    clearInterval(timer);
                    process.stdout.write('\r' + ' '.repeat(50) + '\r'); // Clear line
                    resolve();
                }
            }, 1000);
        });
    }
}
exports.TextEffects = TextEffects;
/**
 * Verbose mode toggle using unified design system
 */
class VerboseMode {
    static toggle() {
        this.isVerbose = !this.isVerbose;
    }
    static set(verbose) {
        this.isVerbose = verbose;
    }
    static get() {
        return this.isVerbose;
    }
    static log(message, level = 'debug') {
        if (!this.isVerbose)
            return;
        const logFunction = level === 'info' ? design_system_1.Typography.info :
            level === 'warn' ? design_system_1.Typography.warning :
                design_system_1.Typography.secondary;
        console.log(logFunction(`[VERBOSE] ${message}`));
    }
}
exports.VerboseMode = VerboseMode;
VerboseMode.isVerbose = false;
/**
 * Main UI Manager class
 */
class UIManager {
    constructor() {
        this.stepIndicator = new StepIndicator();
        this.tableRenderer = TableRenderer;
        this.progressBar = ProgressBar;
        this.statusBox = StatusBox;
        this.choiceRenderer = ChoiceRenderer;
        this.textEffects = TextEffects;
        this.verboseMode = VerboseMode;
    }
    /**
     * Clear screen and show header
     */
    clearAndShowHeader(stepName) {
        console.clear();
        console.log(this.stepIndicator.renderHeader(stepName));
        console.log();
    }
    /**
     * Show completion message using unified design system
     */
    showCompletion(summary) {
        const title = design_system_1.Typography.h1('✨ Evaluation Complete!');
        let content = design_system_1.Typography.success('Your AI evaluation is complete!\n\n');
        content += design_system_1.Typography.h3('📊 Summary:\n');
        if (summary.agentCount > 0) {
            content += `  • ${design_system_1.Symbols.entities.agent} Agents tested: ${design_system_1.Typography.number(summary.agentCount.toString())}\n`;
        }
        if (summary.teamCount > 0) {
            content += `  • ${design_system_1.Symbols.entities.team} Teams tested: ${design_system_1.Typography.number(summary.teamCount.toString())}\n`;
        }
        content += `  • ${design_system_1.Symbols.entities.dimension} Dimensions used: ${design_system_1.Typography.code(summary.dimensions.join(', '))}\n`;
        if (summary.duration) {
            content += `  • ⏱️ Duration: ${design_system_1.Typography.secondary(summary.duration)}\n`;
        }
        content += '\n' + design_system_1.Typography.h3('🚀 Next steps:\n');
        content += design_system_1.Typography.muted('  • Review the detailed report\n');
        content += design_system_1.Typography.muted('  • Fix any failing tests\n');
        content += design_system_1.Typography.muted('  • Integrate into CI/CD pipeline');
        console.log(design_system_1.IdentroUI.box(content, {
            borderStyle: 'double',
            borderColor: 'success',
            width: Math.min(80, process.stdout.columns || 80),
        }));
    }
    /**
     * Show help text for current step using unified design system
     */
    showHelp(step) {
        const helpTexts = {
            1: 'Discovery scans your project for AI agents and teams using framework detection.',
            2: 'LLM Configuration sets up the AI provider for intelligent test generation.',
            3: 'Analysis extracts agent capabilities and contracts for test generation.',
            4: 'Test Configuration selects what to test and generates intelligent test cases.',
            5: 'Execution runs all tests with real-time progress tracking.'
        };
        const helpText = helpTexts[step] || 'No help available for this step.';
        console.log(design_system_1.IdentroUI.status(`💡 ${helpText}`, 'info'));
    }
}
exports.UIManager = UIManager;
//# sourceMappingURL=ui-manager.js.map