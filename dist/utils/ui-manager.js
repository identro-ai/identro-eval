/**
 * UI Manager for Streamlined Interactive CLI
 *
 * Provides consistent, clean UI components using the unified design system
 * for professional user experience across all interfaces.
 */
import { IdentroColors, Typography, Symbols, IdentroUI } from '../design-system';
/**
 * Step progress indicator using unified design system
 */
export class StepIndicator {
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
        return Typography.gradient.stepHeader(stepText) + '\n' +
            IdentroUI.separator(Math.max(40, stepText.length));
    }
    renderProgress() {
        return IdentroUI.progressBar(this.currentStep, this.totalSteps, 20, 'percentage');
    }
}
/**
 * Enhanced table renderer for agents and teams using unified design system
 */
export class TableRenderer {
    /**
     * Render agents table with consistent styling
     */
    static renderAgentsTable(agents) {
        if (agents.length === 0) {
            return Typography.warning('No agents found');
        }
        const headers = ['Agent Name', 'Type', 'Framework'];
        const rows = agents.map(agent => [
            IdentroUI.entity(agent.name, 'agent'),
            Typography.secondary(agent.type),
            Typography.code(agent.framework)
        ]);
        return IdentroUI.table({
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
            return Typography.warning('No teams found');
        }
        const lines = [];
        teams.forEach((team, index) => {
            lines.push(IdentroUI.entity(team.name, 'team', team.type));
            // Description
            const desc = team.contract.description.length > 60
                ? team.contract.description.substring(0, 57) + '...'
                : team.contract.description;
            lines.push(`  ${Typography.muted('Description:')} ${Typography.secondary(desc)}`);
            // Members and process
            const memberCount = team.composition?.memberCount || 0;
            const process = team.composition?.process || 'unknown';
            lines.push(`  ${Typography.muted('Members:')} ${Typography.number(memberCount.toString())} agents`);
            lines.push(`  ${Typography.muted('Process:')} ${Typography.code(process)}`);
            // Capabilities (first 3)
            const caps = team.contract.capabilities.slice(0, 3);
            const capsText = caps.join(', ') + (team.contract.capabilities.length > 3 ? '...' : '');
            lines.push(`  ${Typography.muted('Capabilities:')} ${Typography.secondary(capsText)}`);
            if (index < teams.length - 1) {
                lines.push(''); // Add spacing between teams
            }
        });
        return lines.join('\n');
    }
}
/**
 * Progress bar renderer using unified design system
 */
export class ProgressBar {
    static render(current, total, label, width = 30) {
        return IdentroUI.progressBar(current, total, width);
    }
}
/**
 * Status box renderer using unified design system
 */
export class StatusBox {
    static render(title, content, status = 'info') {
        const borderColor = status === 'info' ? 'active' : status;
        const statusText = IdentroUI.status(title, status === 'info' ? 'info' : status);
        return IdentroUI.box(`${statusText}\n\n${content}`, {
            borderColor: borderColor,
            width: Math.min(80, process.stdout.columns || 80),
        });
    }
}
/**
 * Choice renderer using unified design system
 */
export class ChoiceRenderer {
    static renderDimensionChoices(dimensions) {
        return dimensions.map(dimension => ({
            name: `${Typography.code(dimension.name)} - ${Typography.secondary(dimension.shortDescription)}`,
            value: dimension.name,
            checked: true // Default to all selected
        }));
    }
    static renderLLMChoices(llms) {
        return llms.map((llm, index) => {
            const statusIcon = llm.status === 'available' ? IdentroColors.status.success('✓') :
                llm.status === 'error' ? IdentroColors.status.error('✗') :
                    IdentroColors.status.warning('○');
            const provider = Typography.h3(llm.provider);
            const model = Typography.code(llm.model);
            const source = llm.source ? Typography.muted(`(${llm.source})`) : '';
            return {
                name: `${statusIcon} ${provider} - ${model} ${source}`,
                value: index
            };
        });
    }
}
/**
 * Animated text effects using unified design system
 */
export class TextEffects {
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
            console.log(Typography.h2(text));
            setTimeout(resolve, duration);
        });
    }
    static countdown(seconds, message = 'Starting in') {
        return new Promise((resolve) => {
            let count = seconds;
            const timer = setInterval(() => {
                process.stdout.write(`\r${Typography.warning(message)} ${Typography.number(count.toString())}...`);
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
/**
 * Verbose mode toggle using unified design system
 */
export class VerboseMode {
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
        const logFunction = level === 'info' ? Typography.info :
            level === 'warn' ? Typography.warning :
                Typography.secondary;
        console.log(logFunction(`[VERBOSE] ${message}`));
    }
}
VerboseMode.isVerbose = false;
/**
 * Main UI Manager class
 */
export class UIManager {
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
        const title = Typography.h1('✨ Evaluation Complete!');
        let content = Typography.success('Your AI evaluation is complete!\n\n');
        content += Typography.h3('📊 Summary:\n');
        if (summary.agentCount > 0) {
            content += `  • ${Symbols.entities.agent} Agents tested: ${Typography.number(summary.agentCount.toString())}\n`;
        }
        if (summary.teamCount > 0) {
            content += `  • ${Symbols.entities.team} Teams tested: ${Typography.number(summary.teamCount.toString())}\n`;
        }
        content += `  • ${Symbols.entities.dimension} Dimensions used: ${Typography.code(summary.dimensions.join(', '))}\n`;
        if (summary.duration) {
            content += `  • ⏱️ Duration: ${Typography.secondary(summary.duration)}\n`;
        }
        content += '\n' + Typography.h3('🚀 Next steps:\n');
        content += Typography.muted('  • Review the detailed report\n');
        content += Typography.muted('  • Fix any failing tests\n');
        content += Typography.muted('  • Integrate into CI/CD pipeline');
        console.log(IdentroUI.box(content, {
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
        console.log(IdentroUI.status(`💡 ${helpText}`, 'info'));
    }
}
//# sourceMappingURL=ui-manager.js.map