/**
 * Interactive CLI Wizard - Simplified Architecture
 *
 * Provides a guided, interactive experience for evaluating AI agents
 * with modern UI dimensions and best practices.
 *
 * Uses SimplifiedTestRunner instead of TestOrchestrator to eliminate double orchestration.
 */
import chalk from 'chalk';
import inquirer from 'inquirer';
import boxen from 'boxen';
import figlet from 'figlet';
import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
// Services
import { getEvaluationEngine } from '../services/evaluation-engine';
import { llmConfigManager } from '../services/llm-config-manager';
import { loadConfig } from '../utils/config';
import { displayAgents } from '../utils/display';
import { animations } from '../utils/animations';
import { SplitPaneDisplay } from '../utils/split-pane-display';
import { TestStateManager } from '../utils/test-state-manager';
import { SimplifiedTestRunner } from '../utils/simplified-test-runner';
import { displayTerminalSummary, showInteractiveMenu, displayDetailedResults } from '../utils/terminal-report-formatter';
// New streamlined UI
import { UIManager } from '../utils/ui-manager';
import { IdentroColors, Typography, IdentroUI } from '../design-system';
/**
 * Create the interactive command
 */
export function interactiveCommand() {
    return new Command('interactive')
        .description('Launch interactive evaluation wizard')
        .option('-p, --path <path>', 'Project path', process.cwd())
        .action(async (options) => {
        await runInteractiveWizard(options);
    });
}
/**
 * Main interactive wizard flow
 */
export async function runInteractiveWizard(options = {}) {
    const session = {
        projectPath: path.resolve(options.path || process.cwd()),
        agents: []
    };
    // Initialize streamlined UI manager
    const ui = new UIManager();
    try {
        // Step 1: Display welcome banner and discover framework/agents
        ui.stepIndicator.setCurrentStep(1);
        await displayWelcomeBanner();
        await discoverStep(session, ui);
        // Step 2: Configure LLM
        ui.stepIndicator.setCurrentStep(2);
        await configureLLMStep(session, ui);
        // Step 3: Test Configuration & Generation (combined analyze + configure)
        ui.stepIndicator.setCurrentStep(3);
        await analyzeStep(session, ui);
        await configureTestsStep(session, ui);
        // Step 4: Run tests
        ui.stepIndicator.setCurrentStep(4);
        await runTestsStep(session);
        // Display completion message
        displayCompletion(session, ui);
    }
    catch (err) {
        console.error(chalk.red('\n❌ Error:'), err.message);
        if (process.env.DEBUG) {
            console.error(chalk.gray(err.stack));
        }
        process.exit(1);
    }
}
/**
 * Display modern welcome banner as part of Step 1
 *
 * Testing enhancements:
 * - Exported for testing
 * - Can be skipped in non-interactive mode
 */
export async function displayWelcomeBanner(session) {
    // Skip banner in non-interactive mode
    if (session?.nonInteractive) {
        if (session.testLogger) {
            session.testLogger('=== Identro Eval - Non-Interactive Mode ===', 'info');
        }
        return;
    }
    console.clear();
    // Original Identro banner with cyan color
    const banner = figlet.textSync('Identro Eval', {
        font: 'Standard',
        horizontalLayout: 'default',
    });
    // Display the banner with clean cyan color (static, no animation to avoid artifacts)
    console.log(IdentroColors.brand.primary(banner));
    // Info box with cyan border
    console.log(boxen(chalk.bold.white('🎯 AI Agent Evaluation Suite\n') +
        chalk.hex('#708090')('Test and validate your AI agents with confidence\n') + // Slate gray
        chalk.dim('v1.0.0 • Simplified Architecture'), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
    }));
    // Quick tips
    console.log(chalk.dim('\n💡 Quick Tips:'));
    console.log(chalk.dim('  • Use arrow keys to navigate'));
    console.log(chalk.dim('  • Press space to select/deselect'));
    console.log(chalk.dim('  • Press enter to confirm'));
    console.log();
    // Add 1.5 second timeout before proceeding to Step 1
    await new Promise(resolve => setTimeout(resolve, 1500));
}
/**
 * Step 1: Discover framework and agents
 *
 * Testing enhancements:
 * - Exported for direct testing without UI
 * - Supports mockResponses for non-interactive mode
 * - Uses testLogger when available
 */
export async function discoverStep(session, ui) {
    // Use streamlined UI if available
    if (ui) {
        ui.clearAndShowHeader('Project Discovery');
        console.log(Typography.secondary('Scanning your project for AI agents and frameworks...\n'));
    }
    else {
        console.log(chalk.bold.cyan('\n📂 Step 1 of 4: Project Discovery\n'));
        console.log(chalk.gray('Scanning your project for AI agents and frameworks...\n'));
    }
    const spinner = animations.loading('Analyzing project structure...', 'dots12');
    try {
        // Initialize .identro directory and config file if they don't exist
        const configPath = path.join(session.projectPath, '.identro', 'eval.config.yml');
        if (!await fs.pathExists(configPath)) {
            spinner.update('Initializing Identro configuration...');
            const { initializeIdentroDirectory } = await import('../utils/templates');
            await initializeIdentroDirectory(session.projectPath);
            spinner.update('✅ Created eval.config.yml configuration file');
        }
        // CRITICAL FIX: Always load config from the correct path
        const config = await loadConfig(configPath);
        spinner.update(`🔧 Loaded configuration from ${path.relative(session.projectPath, configPath)}`);
        const engine = getEvaluationEngine();
        await engine.initialize(config);
        // Initialize dimension registry early to create dimension files
        spinner.update('🔧 Initializing dimension registry and creating dimension files...');
        const { DefaultDimensionRegistry } = await import('@identro/eval-core');
        const dimensionRegistry = new DefaultDimensionRegistry();
        await dimensionRegistry.loadDimensionDefinitions(session.projectPath);
        spinner.update('✅ Dimension files created in .identro/dimensions/');
        // Detect framework
        spinner.update('Detecting AI framework...');
        const framework = await engine.detectFramework(session.projectPath);
        if (!framework) {
            spinner.stop();
            await animations.error('No supported framework detected', 1500);
            const { continueAnyway } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'continueAnyway',
                    message: 'No supported framework detected. Would you like to specify one manually?',
                    default: false
                }]);
            if (!continueAnyway) {
                throw new Error('No framework detected. Please ensure your project uses LangChain, CrewAI, or another supported framework.');
            }
            const { selectedFramework } = await inquirer.prompt([{
                    type: 'list',
                    name: 'selectedFramework',
                    message: 'Select your framework:',
                    choices: [
                        { name: 'CrewAI', value: 'crewai' },
                        { name: 'LangChain', value: 'langchain' },
                        { name: 'Other (experimental)', value: 'custom' }
                    ]
                }]);
            session.framework = selectedFramework;
        }
        else {
            session.framework = framework;
            spinner.update(`Framework detected: ${chalk.green(framework)}`);
        }
        // Discover agents
        spinner.update('Discovering AI agents...');
        const discovery = await engine.discoverAgents(session.projectPath, session.framework);
        session.agents = discovery.agents;
        // Discover teams/crews with enhanced structure analysis
        spinner.update('Discovering teams/crews with enhanced analysis...');
        let teams = [];
        try {
            if (session.framework === 'crewai') {
                // Use enhanced team discovery with agent/task extraction
                try {
                    const { discoverTeamsWithDetails } = await import('@identro/eval-crewai');
                    const teamDiscoveryResult = await discoverTeamsWithDetails(session.projectPath);
                    teams = teamDiscoveryResult.teams;
                    spinner.update(`Enhanced team discovery: ${teams.length} teams with full structure analysis`);
                }
                catch (enhancedError) {
                    console.warn('Enhanced team discovery not available, using basic discovery:', enhancedError);
                    // Use basic team discovery
                    const { CrewAIAdapter } = await import('@identro/eval-crewai');
                    const adapter = new CrewAIAdapter();
                    teams = await adapter.discoverTeams(session.projectPath);
                }
            }
        }
        catch (error) {
            console.warn('Enhanced team discovery failed, falling back to basic discovery:', error);
            // Fallback to basic team discovery
            try {
                const { CrewAIAdapter } = await import('@identro/eval-crewai');
                const adapter = new CrewAIAdapter();
                teams = await adapter.discoverTeams(session.projectPath);
            }
            catch (fallbackError) {
                console.warn('Team discovery failed:', fallbackError);
            }
        }
        spinner.stop();
        // Reduced neon usage - more subtle success messages
        console.log(chalk.green(`\n✓ Framework: ${session.framework}`));
        console.log(chalk.green(`✓ Agents found: ${session.agents.length}`));
        console.log(chalk.green(`✓ Teams found: ${teams.length}`));
        if (session.agents.length > 0 || teams.length > 0) {
            console.log();
            // Use standard table display (reduced neon)
            if (session.agents.length > 0) {
                console.log(chalk.bold.cyan('🤖 Individual Agents:'));
                const displayableAgents = session.agents.map(agent => ({
                    name: agent.name,
                    type: agent.type || 'general',
                    framework: session.framework,
                }));
                displayAgents(displayableAgents);
            }
            // Display teams with reduced neon
            if (teams.length > 0) {
                console.log(chalk.bold.cyan('\n👥 Teams/Crews:'));
                console.log();
                for (const team of teams) {
                    console.log(`${chalk.cyan('●')} ${chalk.bold(team.name)} ${chalk.gray(`(${team.type})`)}`);
                    console.log(`  ${chalk.gray('Description:')} ${team.contract.description}`);
                    console.log(`  ${chalk.gray('Members:')} ${team.composition?.memberCount || 0} agents`);
                    console.log(`  ${chalk.gray('Process:')} ${team.composition?.process || 'unknown'}`);
                    console.log(`  ${chalk.gray('Capabilities:')} ${team.contract.capabilities.slice(0, 3).join(', ')}${team.contract.capabilities.length > 3 ? '...' : ''}`);
                    console.log();
                }
            }
        }
        // Store teams in session for later use
        session.teams = teams;
        // Check for existing test specs and offer bypass option
        const evalSpecPath = path.join(session.projectPath, '.identro', 'eval-spec.json');
        const hasExistingSpecs = await fs.pathExists(evalSpecPath);
        if (hasExistingSpecs) {
            try {
                const { EvalSpecManager } = await import('@identro/eval-core');
                const specManager = new EvalSpecManager(session.projectPath);
                const evalSpec = await specManager.load();
                const existingAgents = Object.keys(evalSpec.agents || {});
                const existingTeams = Object.keys(evalSpec.teams || {});
                // Check if any tests exist
                let hasTests = false;
                for (const agentName of existingAgents) {
                    const agent = evalSpec.agents[agentName];
                    if (agent.testSpecs && Object.keys(agent.testSpecs).length > 0) {
                        hasTests = true;
                        break;
                    }
                }
                if (!hasTests && evalSpec.teams) {
                    for (const teamName of existingTeams) {
                        const team = evalSpec.teams[teamName];
                        if (team.testSpecs && Object.keys(team.testSpecs).length > 0) {
                            hasTests = true;
                            break;
                        }
                    }
                }
                if (hasTests) {
                    console.log(chalk.green('\n✓ Found existing test specifications'));
                    const { proceed } = await inquirer.prompt([{
                            type: 'list',
                            name: 'proceed',
                            message: 'How would you like to proceed?',
                            choices: [
                                { name: 'Run existing test specs (skip to execution)', value: 'run' },
                                { name: 'Generate new tests (continue with LLM configuration)', value: 'configure' }
                            ]
                        }]);
                    if (proceed === 'run') {
                        // Skip to test execution - load the spec and set up session
                        session.evalSpec = evalSpec;
                        session.framework = await detectFrameworkQuick(session.projectPath);
                        // CRITICAL: Load LLM config for evaluation (needed by split pane)
                        const llmConfig = await llmConfigManager.discoverAndConfigure(session.projectPath);
                        if (llmConfig && llmConfig.selected) {
                            session.llmConfig = llmConfig.selected;
                        }
                        // CRITICAL FIX: Only include agents/teams that have test specs
                        const agentsWithTests = [];
                        const teamsWithTests = [];
                        const dimensions = new Set();
                        // Find agents with tests
                        for (const agentName of existingAgents) {
                            const agent = evalSpec.agents[agentName];
                            if (agent.testSpecs && Object.keys(agent.testSpecs).length > 0) {
                                agentsWithTests.push(agentName);
                                for (const dimension of Object.keys(agent.testSpecs)) {
                                    dimensions.add(dimension);
                                }
                            }
                        }
                        // Find teams with tests
                        if (evalSpec.teams) {
                            for (const teamName of existingTeams) {
                                const team = evalSpec.teams[teamName];
                                if (team.testSpecs && Object.keys(team.testSpecs).length > 0) {
                                    teamsWithTests.push({ name: teamName });
                                    for (const dimension of Object.keys(team.testSpecs)) {
                                        dimensions.add(dimension);
                                    }
                                }
                            }
                        }
                        session.testConfig = {
                            selectedAgents: agentsWithTests,
                            dimensions: Array.from(dimensions),
                            verbose: true
                        };
                        session.selectedTeams = teamsWithTests;
                        console.log(chalk.green(`\n✓ Loaded ${agentsWithTests.length} agent(s) and ${teamsWithTests.length} team(s) with ${dimensions.size} dimension(s)`));
                        console.log(chalk.gray('Proceeding directly to test execution...\n'));
                        // Skip to Step 4 - run tests directly
                        if (ui) {
                            ui.stepIndicator.setCurrentStep(4);
                        }
                        await runTestsStep(session);
                        await displayCompletion(session, ui);
                        return; // Exit wizard after running tests
                    }
                    else if (proceed === 'configure') {
                        // User chose to generate new tests - skip the "Continue to LLM configuration?" prompt
                        session.skipLLMPrompt = true;
                    }
                    // If user chose 'configure', continue to normal flow below
                }
            }
            catch (err) {
                // If loading fails, continue with normal flow
                console.log(chalk.gray('Could not load existing specs, continuing with normal flow...\n'));
            }
        }
        // Always ask user to continue to next step
        if (session.agents.length === 0 && teams.length === 0) {
            const { continueWithoutAgents } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'continueWithoutAgents',
                    message: chalk.yellow('No agents or teams found. Would you like to continue anyway?'),
                    default: false
                }]);
            if (!continueWithoutAgents) {
                throw new Error('No agents to evaluate. Please check your project structure.');
            }
        }
        else {
            // Add user interaction point to control flow - ask to continue to LLM config
            // Skip this prompt if user already chose to generate new tests from existing specs menu
            if (!session.skipLLMPrompt) {
                const { continueToLLM } = await inquirer.prompt([{
                        type: 'confirm',
                        name: 'continueToLLM',
                        message: 'Continue to LLM configuration?',
                        default: true
                    }]);
                if (!continueToLLM) {
                    console.log(chalk.yellow('\n⚠ Evaluation cancelled'));
                    process.exit(0);
                }
            }
        }
    }
    catch (err) {
        spinner.stop();
        await animations.error('Discovery failed', 1500);
        throw err;
    }
}
/**
 * Step 2: Configure LLM
 *
 * Testing enhancements:
 * - Exported for direct testing
 * - Can use mockResponses.llmConfig for non-interactive mode
 * - Logs to testLogger when available
 */
export async function configureLLMStep(session, ui) {
    // Use streamlined UI if available
    if (ui) {
        ui.clearAndShowHeader('LLM Configuration');
        console.log(chalk.gray('Setting up LLM provider for intelligent test generation...\n'));
    }
    else {
        console.log(chalk.bold.cyan('\n🤖 Step 2 of 4: LLM Configuration\n'));
        console.log(chalk.gray('Setting up LLM provider for intelligent test generation...\n'));
    }
    try {
        const llmConfig = await llmConfigManager.discoverAndConfigure(session.projectPath);
        if (!llmConfig || !llmConfig.discovered || llmConfig.discovered.length === 0) {
            console.log(chalk.yellow('⚠ No LLM configurations found'));
            console.log(chalk.gray('\nPlease set up an API key (e.g., OPENAI_API_KEY) to enable intelligent test generation.'));
            const { continueWithoutLLM } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'continueWithoutLLM',
                    message: 'Continue without LLM? (Will use basic test generation)',
                    default: true
                }]);
            if (!continueWithoutLLM) {
                console.log(chalk.cyan('\nPlease set up your LLM configuration and run again.'));
                process.exit(0);
            }
            session.llmConfig = null;
            console.log(chalk.yellow('\n⚠ Proceeding without LLM (basic test generation)'));
        }
        else {
            // llmConfigManager.discoverAndConfigure() already handled the user selection
            // Just use the selected config from the result
            session.llmConfig = llmConfig.selected;
            console.log(chalk.green('\n✓ LLM Configuration Selected'));
            console.log(chalk.gray(`  • Provider: ${session.llmConfig.provider}`));
            console.log(chalk.gray(`  • Model: ${session.llmConfig.model}`));
            console.log(chalk.gray(`  • Ready for intelligent test generation`));
        }
    }
    catch (err) {
        console.log(chalk.red('✗ LLM setup failed'));
        console.log(chalk.yellow('Continuing with basic test generation...'));
        session.llmConfig = null;
    }
}
/**
 * Step 3: Analyze agents
 *
 * Testing enhancements:
 * - Exported for direct testing
 * - Uses mockResponses for agent selection in non-interactive mode
 * - Logs progress to testLogger
 */
export async function analyzeStep(session, ui) {
    // Use streamlined UI if available
    if (ui) {
        ui.clearAndShowHeader('Test Configuration & Generation');
        console.log(chalk.gray('Analyzing agent capabilities and contracts...\n'));
    }
    else {
        console.log(chalk.bold.cyan('\n📊 Step 3 of 4: Test Configuration & Generation\n'));
        console.log(chalk.gray('Analyzing agent capabilities and contracts...\n'));
    }
    const evalSpecPath = path.join(session.projectPath, '.identro', 'eval-spec.json');
    // Initialize EvalSpecManager
    const { EvalSpecManager } = await import('@identro/eval-core');
    const specManager = new EvalSpecManager(session.projectPath);
    await specManager.initialize();
    // Load existing spec
    let evalSpec = await specManager.load();
    // ENTITY SEPARATION FIX: Check both agents and teams sections
    const existingAgents = Object.keys(evalSpec.agents || {});
    const existingTeams = Object.keys(evalSpec.teams || {});
    const allExistingEntities = [...existingAgents, ...existingTeams];
    // Get current agents and teams from discovery - USE NAMES for comparison (eval-spec uses names as keys)
    const currentAgentNames = session.agents.map(a => a.name);
    const currentTeamNames = (session.teams || []).map((t) => t.name);
    const allCurrentEntities = [...currentAgentNames, ...currentTeamNames];
    // Existing entities properly separated
    const existingAgentEntries = existingAgents;
    const existingTeamEntries = existingTeams;
    // Find new entities not in spec
    const newEntities = allCurrentEntities.filter(name => !allExistingEntities.includes(name));
    // Always start fresh - no user prompt
    if (allExistingEntities.length > 0) {
        // CRITICAL BUG FIX: Only remove eval-spec.json and history/, NOT the entire .identro directory!
        // This preserves eval.config.yml and dimensions/ folder which should NOT be deleted
        if (await fs.pathExists(evalSpecPath)) {
            await fs.remove(evalSpecPath);
        }
        const historyDir = path.join(path.dirname(evalSpecPath), 'history');
        if (await fs.pathExists(historyDir)) {
            await fs.remove(historyDir);
        }
        await specManager.initialize();
        evalSpec = await specManager.load();
    }
    if (session.agents.length === 0 && (!session.reanalyzeExisting || session.reanalyzeExisting.length === 0)) {
        console.log(chalk.yellow('\n⚠ No agents to analyze'));
        session.evalSpec = evalSpec;
        return;
    }
    // ENHANCED: Use AnalysisService instead of direct engine.extractContract()
    // This triggers our YAML direct access and integration detection
    const analysisSpinner = animations.loading('Analyzing agents...', 'dots12');
    try {
        // Use AnalysisService for enhanced YAML-based analysis
        const { AnalysisService } = await import('../services/analysis-service');
        const analysisService = new AnalysisService();
        // Prepare agents and teams for analysis
        const agentsToAnalyze = session.agents;
        const teamsToAnalyze = session.teams || [];
        // Run enhanced analysis
        const analysisResult = await analysisService.analyzeAll({
            projectPath: session.projectPath,
            agents: agentsToAnalyze,
            teams: teamsToAnalyze,
            framework: session.framework || 'crewai',
            reanalyzeExisting: session.reanalyzeExisting || []
        });
        // Update session with analyzed spec
        evalSpec = analysisResult.evalSpec;
        analysisSpinner.update(chalk.green(`✓ Analyzed ${analysisResult.analyzedAgents} agents, ${analysisResult.analyzedTeams} teams`));
        if (analysisResult.errors.length > 0) {
            analysisSpinner.update(chalk.yellow(`⚠ ${analysisResult.errors.length} analysis errors`));
            for (const error of analysisResult.errors) {
                console.log(chalk.yellow(`⚠ ${error.entity}: ${error.error}`));
            }
        }
        // Note: EvalSpec is already saved by AnalysisService
        session.evalSpec = evalSpec;
        analysisSpinner.stop();
        console.log(chalk.cyan('✓ Extracted agent contracts and capabilities'));
    }
    catch (err) {
        analysisSpinner.stop();
        await animations.error('Analysis failed', 1500);
        throw err;
    }
}
/**
 * Step 4: Configure tests
 *
 * Testing enhancements:
 * - Exported for direct testing
 * - Uses mockResponses.testConfig for non-interactive mode
 * - Logs configuration to testLogger
 * - Now includes LLM test generation (moved from analyzeStep in LLM-centric architecture)
 */
export async function configureTestsStep(session, ui) {
    // Use streamlined UI if available
    if (ui) {
        ui.clearAndShowHeader('Test Configuration & Generation');
        console.log(chalk.gray('Configure which tests to run and how to run them...\n'));
    }
    else {
        console.log(chalk.gray('Configure which tests to run and how to run them...\n'));
    }
    if (!session.evalSpec || Object.keys(session.evalSpec.agents).length === 0) {
        console.log(chalk.yellow('⚠ No agents available for testing'));
        return;
    }
    const allAgents = Object.keys(session.evalSpec.agents);
    const allTeams = session.teams || [];
    // Testing enhancements: Use mockResponses for non-interactive mode
    let selectedAgents;
    let dimensions;
    let testOptions;
    if (session.nonInteractive && session.mockResponses?.testConfig) {
        // Use mock responses for testing
        selectedAgents = session.mockResponses.testConfig.selectedAgents;
        dimensions = session.mockResponses.testConfig.dimensions;
        testOptions = session.mockResponses.testConfig.testOptions || ['verbose'];
        if (session.testLogger) {
            session.testLogger(`Using mock test config: ${selectedAgents.length} agents, ${dimensions.length} dimensions`, 'info');
        }
    }
    else {
        // Interactive mode - prompt user for what to test
        let testingChoice = 'both';
        if (allAgents.length > 0 && allTeams.length > 0) {
            const { choice } = await inquirer.prompt([{
                    type: 'list',
                    name: 'choice',
                    message: 'What would you like to test?',
                    choices: [
                        { name: `🤖 Test agents only (${allAgents.length} agents)`, value: 'agents' },
                        { name: `👥 Test teams only (${allTeams.length} teams)`, value: 'teams' }
                    ],
                    default: 'agents'
                }]);
            testingChoice = choice;
        }
        else if (allTeams.length > 0) {
            testingChoice = 'teams';
        }
        else {
            testingChoice = 'agents';
        }
        // Select agents if needed
        if (testingChoice === 'agents' || testingChoice === 'both') {
            const agentSelection = await inquirer.prompt([{
                    type: 'checkbox',
                    name: 'selectedAgents',
                    message: 'Select agents to test:',
                    choices: allAgents.map(name => ({
                        name: `${chalk.cyan(name)} - ${chalk.gray(session.evalSpec.agents[name].type)}`,
                        value: name,
                        checked: true
                    }))
                }]);
            selectedAgents = agentSelection.selectedAgents;
        }
        else {
            selectedAgents = [];
        }
        // Select teams if needed
        let selectedTeams = [];
        if (testingChoice === 'teams' || testingChoice === 'both') {
            const teamSelection = await inquirer.prompt([{
                    type: 'checkbox',
                    name: 'selectedTeams',
                    message: 'Select teams to test:',
                    choices: allTeams.map((team) => ({
                        name: `${chalk.cyan(team.name)} - ${chalk.gray(`${team.composition?.memberCount || 0} agents, ${team.composition?.process || 'unknown'}`)}`,
                        value: team,
                        checked: true
                    }))
                }]);
            selectedTeams = teamSelection.selectedTeams;
        }
        // Store selected teams in session
        session.selectedTeams = selectedTeams;
        if (selectedAgents.length === 0 && selectedTeams.length === 0) {
            console.log(chalk.yellow('\n⚠ No agents or teams selected for testing'));
            return;
        }
        // Select test dimensions - load dynamically from dimension files
        const { DefaultDimensionRegistry } = await import('@identro/eval-core');
        const dimensionRegistry = new DefaultDimensionRegistry();
        await dimensionRegistry.loadDimensionDefinitions(session.projectPath);
        // Load config to get enabled dimensions list
        const configPath = path.join(session.projectPath, '.identro', 'eval.config.yml');
        const config = await loadConfig(configPath);
        // Load enabled dimensions from config or use all available dimensions
        const enabledDimensions = config.dimensions?.enabled && config.dimensions.enabled.length > 0
            ? config.dimensions.enabled
            : await dimensionRegistry.getAvailableDimensions();
        const availableDimensions = await dimensionRegistry.getDimensionsWithDescriptions();
        const dimensionChoices = availableDimensions.map((dimension) => ({
            name: `${dimension.name.charAt(0).toUpperCase() + dimension.name.slice(1)} - ${dimension.shortDescription}`,
            value: dimension.name,
            checked: enabledDimensions.includes(dimension.name) // Read from config, not hardcoded!
        }));
        const dimensionSelection = await inquirer.prompt([{
                type: 'checkbox',
                name: 'dimensions',
                message: 'Select evaluation dimensions:',
                choices: dimensionChoices,
                pageSize: 15 // Increased from default 7 to show more dimensions at once
            }]);
        dimensions = dimensionSelection.dimensions;
        // Default to verbose mode and cache enabled (no user prompt needed)
        testOptions = ['verbose', 'cache'];
    }
    session.testConfig = {
        selectedAgents,
        dimensions: dimensions,
        verbose: testOptions.includes('verbose')
    };
    // CRITICAL FIX: Only check existing test specs for agents, not teams
    // Teams always use LLM generation (no static content allowed)
    if (selectedAgents.length > 0) {
        const { TestSpecLoader } = await import('@identro/eval-core');
        const testSpecLoader = new TestSpecLoader();
        const validation = testSpecLoader.validateTestSpecs(session.evalSpec, selectedAgents, dimensions);
        if (validation.valid) {
            console.log(chalk.green('\n✓ Using existing test specifications for agents'));
            console.log(chalk.gray('  • Tests already generated for selected agents and dimensions'));
            console.log(chalk.gray('  • Skipping LLM generation step for agents'));
            // Show test summary
            const summary = testSpecLoader.getSpecSummary(session.evalSpec);
            console.log(chalk.cyan(`  • Found ${summary.totalTests} tests across ${summary.totalAgents} agents`));
            // If only testing agents (no teams), skip LLM generation
            const selectedTeams = session.selectedTeams || [];
            if (selectedTeams.length === 0) {
                return; // Skip LLM generation, go directly to TestSpecLoader in Step 5
            }
            else {
                console.log(chalk.yellow('\n⚠ Teams selected - will generate team-specific tests using LLM'));
            }
        }
    }
    // LLM-centric architecture: Generate tests NOW (moved from analyzeStep)
    // This is where LLM test generation happens after user selects agents and dimensions
    if (session.llmConfig) {
        console.log(Typography.h2('\nTest & Evaluation Criteria Generation'));
        console.log(Typography.secondary('Generating intelligent test cases and evaluation criteria using LLM...\n'));
        const spinner = animations.loading('Generating tests...', 'dots12');
        try {
            // Load configuration for concurrency limits
            const config = await loadConfig();
            // Create dimension registry with file-based dimension support
            const { DefaultDimensionRegistry } = await import('@identro/eval-core');
            const dimensionRegistry = new DefaultDimensionRegistry();
            // Load dimension definitions from files first
            await dimensionRegistry.loadDimensionDefinitions(session.projectPath);
            // Initialize LLM provider with dimension registry
            let llmProvider = null;
            if (session.llmConfig.provider === 'openai') {
                const { OpenAIProvider } = await import('@identro/eval-core');
                // Get the actual API key value - prioritize the stored key from discovery
                const apiKey = session.llmConfig.apiKey || process.env.OPENAI_API_KEY || process.env[session.llmConfig.apiKeyEnv];
                if (!apiKey) {
                    throw new Error(`OpenAI API key not found. Please ensure OPENAI_API_KEY is set in your .env file.`);
                }
                llmProvider = new OpenAIProvider({
                    apiKey: apiKey,
                    model: session.llmConfig.model || 'gpt-4-turbo-preview',
                }, dimensionRegistry); // Pass dimension registry for proper safety prompts
                // Testing enhancements: Log to testLogger
                if (session.testLogger) {
                    const maskedKey = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'NOT_FOUND';
                    session.testLogger(`Initialized OpenAI LLM provider: ${session.llmConfig.model} (Key: ${maskedKey})`, 'info');
                }
            }
            else if (session.llmConfig.provider === 'anthropic') {
                const { AnthropicProvider } = await import('@identro/eval-core');
                // Get the actual API key value
                const apiKey = process.env.ANTHROPIC_API_KEY || process.env[session.llmConfig.apiKeyEnv] || session.llmConfig.apiKey;
                if (!apiKey) {
                    throw new Error(`Anthropic API key not found. Please set ANTHROPIC_API_KEY environment variable.`);
                }
                llmProvider = new AnthropicProvider({
                    apiKey: apiKey,
                    model: session.llmConfig.model || 'claude-3-opus-20240229',
                }, dimensionRegistry); // Pass dimension registry for proper safety prompts
                // Testing enhancements: Log to testLogger
                if (session.testLogger) {
                    const maskedKey = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'NOT_FOUND';
                    session.testLogger(`Initialized Anthropic LLM provider: ${session.llmConfig.model} (Key: ${maskedKey})`, 'info');
                }
            }
            if (!llmProvider) {
                throw new Error('Failed to initialize LLM provider');
            }
            // Initialize LLM Queue Manager for concurrent test generation with progress tracking
            const { LLMQueueManager } = await import('@identro/eval-core');
            // Track running tasks for better UI display - use task names as they're enqueued
            const runningTasks = new Map();
            const completedTasks = new Set();
            const allTaskNames = new Map(); // Track all task names for display
            const llmQueueManager = new LLMQueueManager({
                maxConcurrentCalls: config?.llm?.max_concurrent_llm_calls || 3,
                onTaskStart: (task) => {
                    runningTasks.set(task.id, task.name);
                    updateQueueDisplay();
                    if (session.testLogger) {
                        session.testLogger(`🚀 Started: ${task.name}`, 'info');
                    }
                },
                onTaskComplete: (task, result, duration) => {
                    runningTasks.delete(task.id);
                    completedTasks.add(task.name);
                    updateQueueDisplay();
                    if (session.testLogger) {
                        session.testLogger(`✅ Completed: ${task.name} (${duration}ms)`, 'success');
                    }
                },
                onTaskError: (task, error, duration) => {
                    runningTasks.delete(task.id);
                    updateQueueDisplay();
                    if (session.testLogger) {
                        session.testLogger(`❌ Failed: ${task.name} - ${error.message}`, 'error');
                    }
                },
                onProgress: (completed, total, running) => {
                    updateQueueDisplay();
                }
            });
            // Enhanced queue display function with mathematical consistency
            const updateQueueDisplay = () => {
                const stats = llmQueueManager.getStats();
                // Ensure mathematical consistency: completed + running + pending = total
                const actualRunning = Math.max(0, runningTasks.size); // Use actual running tasks count
                const actualCompleted = Math.max(0, stats.completed);
                const actualPending = Math.max(0, stats.total - actualCompleted - actualRunning);
                // Build multi-line display with mathematically consistent counts
                let displayText = `Test Generation Queue: ${actualCompleted}/${stats.total} completed (${actualRunning} running, ${actualPending} queued)`;
                // Show completed tasks (ALL completed tasks)
                if (completedTasks.size > 0) {
                    displayText += '\n';
                    const completedArray = Array.from(completedTasks); // Show ALL completed tasks
                    for (const taskName of completedArray) {
                        displayText += `\n  ✅ ${taskName}`;
                    }
                }
                // Show running tasks on separate lines - use actual running tasks from our tracking
                if (actualRunning > 0 && runningTasks.size > 0) {
                    displayText += '\n';
                    const runningArray = Array.from(runningTasks.values());
                    // Show up to 3 running task names
                    for (let i = 0; i < Math.min(3, runningArray.length); i++) {
                        displayText += `\n  ⚡ ${runningArray[i]}`;
                    }
                    if (runningArray.length > 3) {
                        displayText += `\n  ... and ${runningArray.length - 3} more`;
                    }
                }
                else if (actualRunning > 0) {
                    // Fallback: show generic running tasks if we don't have names yet
                    displayText += '\n';
                    for (let i = 0; i < Math.min(3, actualRunning); i++) {
                        displayText += `\n  ⚡ Generating tests...`;
                    }
                }
                spinner.update(displayText);
            };
            // Use the new generic test generator instead of hardcoded dimension generators
            const { generateTestsFromDimension } = await import('@identro/eval-core');
            // Initialize EvalSpecManager
            const { EvalSpecManager } = await import('@identro/eval-core');
            const specManager = new EvalSpecManager(session.projectPath);
            spinner.update('🔧 Generating tests for selected agents and dimensions...');
            // Generate tests for each agent+dimension combination in parallel
            const generationTasks = [];
            let totalGenerations = 0;
            // Pre-populate task names for immediate display - AGENTS ONLY (exclude teams)
            const selectedTeams = session.selectedTeams || [];
            const teamNames = selectedTeams.map((team) => team.name);
            for (const agentName of selectedAgents) {
                // CRITICAL FIX: Skip teams that are in selectedAgents but should be processed as teams
                if (teamNames.includes(agentName)) {
                    continue; // Skip this - it will be processed in the team section below
                }
                const agent = session.evalSpec.agents[agentName];
                const contract = agent.contract;
                for (const dimension of dimensions) {
                    // Get dimension definition from dimension registry (loaded from YAML files)
                    const dimensionDefinition = await dimensionRegistry.getDimensionDefinition(dimension);
                    if (dimensionDefinition) {
                        totalGenerations++;
                        const taskId = `${agentName}-${dimension}`;
                        const taskName = `${chalk.gray(dimension)} tests for ${agentName}`;
                        // Store task name for display purposes
                        allTaskNames.set(taskId, taskName);
                        // Create LLM queue task for this agent+dimension combination using generic generator
                        const queueTask = {
                            id: taskId,
                            name: taskName,
                            execute: async () => {
                                // Convert contract to ExtractedContract format if it exists
                                let extractedContract = undefined;
                                if (contract) {
                                    extractedContract = {
                                        description: contract.goal || contract.role || `${agentName} agent`,
                                        capabilities: contract.capabilities || [],
                                        confidence: 0.8, // Default confidence
                                        extractedFrom: [agent.discovered?.path || 'agent definition'],
                                        inputSchema: contract.inputSchema,
                                        outputSchema: contract.outputSchema,
                                        metadata: contract
                                    };
                                }
                                // Use generic test generator with dimension definition from YAML file
                                const testSpecs = await generateTestsFromDimension(dimensionDefinition, { name: agentName, ...agent }, llmProvider, {
                                    contract: extractedContract,
                                    multiRunEnabled: config?.dimensions?.consistency?.enabled !== false,
                                    runsPerInput: config?.dimensions?.consistency?.runs_per_input || 3,
                                    variationsPerInput: 3, // Default value since not in config yet
                                    // Pass config values for test count
                                    testCount: config?.dimensions?.[dimension]?.test_count || 3,
                                    config: config?.dimensions?.[dimension] || {},
                                    entityType: 'agent'
                                });
                                // Update eval spec with generated tests
                                // Convert TestSpec[] to TestSpecification[] format with proper UUID generation
                                const { randomUUID } = await import('crypto');
                                const testSpecifications = testSpecs.map((spec) => {
                                    // Generate base UUID for the test
                                    const baseId = spec.id || randomUUID();
                                    return {
                                        id: baseId,
                                        name: spec.metadata?.testName || spec.id,
                                        input: spec.input,
                                        expected: spec.expected,
                                        ui_description: spec.ui_description, // ✅ CRITICAL FIX: Preserve ui_description when mapping during test generation
                                        evaluationCriteria: spec.evaluation_criteria || spec.evaluationCriteria || [], // FIX: Use snake_case first
                                        priority: spec.priority || 1,
                                        tags: spec.tags || [],
                                        multiRun: spec.multiRun,
                                        userModified: false,
                                        generatedBy: session.llmConfig.model,
                                        generatedAt: new Date().toISOString(),
                                    };
                                });
                                await specManager.updateAgent(session.evalSpec, { id: agentName, path: '', source: '', type: 'general' }, undefined, // contract (already set in analyzeStep)
                                { [dimension]: { tests: testSpecifications, generated: new Date().toISOString(), generatedBy: session.llmConfig.model } });
                                return { agentName, dimension, testSpecs };
                            }
                        };
                        // Enqueue the task and store the promise
                        generationTasks.push(llmQueueManager.enqueue(queueTask));
                    }
                }
            }
            // Process teams separately - team already exists from analyzeStep, just generate tests
            for (const team of selectedTeams) {
                // Team should already exist in evalSpec.teams from analyzeStep
                // We don't need to call updateTeam() here, just add test specs below
                // Generate tests for teams using generic test generator (UNIFIED)
                for (const dimension of dimensions) {
                    // Get dimension definition from dimension registry (loaded from YAML files)
                    const dimensionDefinition = await dimensionRegistry.getDimensionDefinition(dimension);
                    if (dimensionDefinition) {
                        totalGenerations++;
                        const taskId = `${team.name}-${dimension}`;
                        const taskName = `${chalk.gray(dimension)} tests for ${team.name}`;
                        // Store task name for display purposes
                        allTaskNames.set(taskId, taskName);
                        // Create LLM queue task using generic test generator (UNIFIED)
                        const teamQueueTask = {
                            id: taskId,
                            name: taskName,
                            execute: async () => {
                                // Build team structure for sophisticated LLM analysis
                                const teamStructure = {
                                    name: team.name,
                                    process: team.composition?.process || 'sequential',
                                    agents: team.structure?.agents || [],
                                    tasks: team.structure?.tasks || [],
                                    workflow: team.structure?.workflow || { summary: 'Unknown workflow' }
                                };
                                // Create entity object to capture LLM-enriched contract
                                const teamEntity = {
                                    name: team.name,
                                    type: 'team',
                                    framework: 'crewai',
                                    path: team.path || '',
                                    description: team.contract.description,
                                    metadata: { isTeam: true }
                                };
                                // Use generic test generator with dimension definition from YAML file
                                const testSpecs = await generateTestsFromDimension(dimensionDefinition, teamEntity, // Pass entity object that will be enriched
                                llmProvider, {
                                    structure: teamStructure, // Enhanced team structure for LLM analysis
                                    multiRunEnabled: config?.dimensions?.consistency?.enabled !== false,
                                    runsPerInput: config?.dimensions?.consistency?.runs_per_input || 3,
                                    variationsPerInput: 3,
                                    testCount: config?.dimensions?.[dimension]?.test_count || 3,
                                    config: config?.dimensions?.[dimension] || {},
                                    entityType: 'team' // Critical: Mark as team for different LLM processing
                                });
                                // Extract LLM-enriched contract if it was generated
                                // Update team with enriched contract in evalSpec
                                if (teamEntity.metadata?.llmGeneratedContract && session.evalSpec.teams) {
                                    const currentTeamSpec = session.evalSpec.teams[team.name];
                                    if (currentTeamSpec && currentTeamSpec.contract) {
                                        // Merge enriched contract with existing contract (preserve all data)
                                        currentTeamSpec.contract = {
                                            ...currentTeamSpec.contract,
                                            ...teamEntity.metadata.llmGeneratedContract
                                        };
                                    }
                                }
                                // Update eval spec with generated tests (SAME as agents)
                                const { randomUUID } = await import('crypto');
                                const testSpecifications = testSpecs.map((spec) => {
                                    const baseId = spec.id || randomUUID();
                                    return {
                                        id: baseId,
                                        name: spec.metadata?.testName || spec.id,
                                        input: spec.input,
                                        expected: spec.expected,
                                        ui_description: spec.ui_description, // ✅ CRITICAL FIX: Preserve ui_description for team tests too
                                        evaluationCriteria: spec.evaluation_criteria || spec.evaluationCriteria || [], // FIX: Use snake_case first
                                        priority: spec.priority || 1,
                                        tags: [...(spec.tags || []), 'team-test'],
                                        multiRun: spec.multiRun,
                                        userModified: false,
                                        generatedBy: session.llmConfig.model,
                                        generatedAt: new Date().toISOString(),
                                    };
                                });
                                // PHASE 2 FIX: Store team tests in evalSpec.teams (NOT evalSpec.agents)
                                await specManager.updateTeam(session.evalSpec, {
                                    name: team.name,
                                    members: (team.structure?.agents || []).map((a) => typeof a === 'string' ? a : a.name || a.role)
                                }, undefined, // contract already set above
                                { [dimension]: { tests: testSpecifications, generated: new Date().toISOString(), generatedBy: session.llmConfig.model } });
                                return { agentName: team.name, dimension, testSpecs };
                            }
                        };
                        // Enqueue the team task exactly like agent tasks
                        generationTasks.push(llmQueueManager.enqueue(teamQueueTask));
                    }
                }
            }
            // Show initial state immediately after all tasks are enqueued
            spinner.update(`🚀 Queued ${totalGenerations} LLM generation tasks...`);
            updateQueueDisplay(); // Show initial state immediately
            // Testing enhancements: Log concurrent generation progress
            if (session.testLogger) {
                session.testLogger(`Starting ${totalGenerations} parallel LLM generation tasks (max concurrent: ${config?.llm?.max_concurrent_llm_calls || 3})`, 'info');
            }
            // Execute all generation tasks with concurrency control
            const results = await Promise.allSettled(generationTasks);
            let successfulTasks = 0;
            let failedTasks = 0;
            let totalTestsGenerated = 0;
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    successfulTasks++;
                    const { agentName, dimension, testSpecs } = result.value;
                    const testsCount = testSpecs.length;
                    totalTestsGenerated += testsCount;
                    // Testing enhancements: Log successful generation
                    if (session.testLogger) {
                        session.testLogger(`✅ Generated ${testsCount} ${dimension} tests for ${agentName}`, 'success');
                    }
                }
                else {
                    failedTasks++;
                    // Testing enhancements: Log generation failures
                    if (session.testLogger) {
                        session.testLogger(`❌ Test generation failed: ${result.reason}`, 'error');
                    }
                }
            }
            // Save updated eval spec
            await specManager.save(session.evalSpec, { backup: true });
            // Update YAML files with enriched contracts from test generation
            try {
                const { YamlService } = await import('../services/yaml-service');
                const yamlService = new YamlService(session.projectPath);
                // Track which entities were enriched
                const enrichedEntities = {
                    agents: selectedAgents.filter(name => !teamNames.includes(name)),
                    teams: selectedTeams.map((team) => team.name)
                };
                await yamlService.updateAfterTestGeneration(session.evalSpec, enrichedEntities);
            }
            catch (yamlErr) {
                console.warn('Warning: Failed to update YAML files after test generation:', yamlErr);
            }
            // Clean, combined completion display
            spinner.stop();
            console.log(Typography.h3('\nLLM Generation Complete'));
            console.log(IdentroUI.separator(60, 'heavy'));
            console.log();
            // Combined summary with both details and statistics
            const entityCounts = [];
            if (selectedAgents.length > 0) {
                entityCounts.push(`${selectedAgents.length} agent(s)`);
            }
            if (selectedTeams.length > 0) {
                entityCounts.push(`${selectedTeams.length} team(s)`);
            }
            console.log(Typography.success(`${chalk.green('✓')} Generated ${Typography.number(totalTestsGenerated.toString())} tests for ${Typography.body(entityCounts.join(' and '))} using ${Typography.number(dimensions.length.toString())} dimensions`));
            console.log();
            // Show completed test suites in a clean way
            if (completedTasks.size > 0) {
                console.log(Typography.h3('📋 Test Suites Created:'));
                // Group and format the completed tasks better
                const taskList = Array.from(completedTasks).map(taskName => {
                    // Parse task name to improve formatting
                    const parts = taskName.split(' tests for ');
                    if (parts.length === 2) {
                        const dimension = parts[0];
                        const entity = parts[1];
                        return `  ${Typography.muted('•')} ${Typography.code(dimension)} tests for ${Typography.body(entity)}`;
                    }
                    return `  ${Typography.muted('•')} ${taskName}`;
                });
                console.log(taskList.join('\n'));
                console.log();
            }
            console.log(IdentroUI.separator(60, 'light'));
            // Testing enhancements: Log final generation stats
            if (session.testLogger) {
                session.testLogger(`LLM test generation completed: ${successfulTasks}/${totalGenerations} successful (${((successfulTasks / totalGenerations) * 100).toFixed(1)}%)`, 'success');
            }
        }
        catch (err) {
            spinner.stop();
            await animations.error('LLM test generation failed', 1500);
            console.log(chalk.red(`❌ Error: ${err.message}`));
            console.log(chalk.yellow('Falling back to static test generation...'));
            // Testing enhancements: Log error to testLogger
            if (session.testLogger) {
                session.testLogger(`LLM test generation failed: ${err.message}`, 'error');
                session.testLogger('Falling back to static test generation', 'warning');
            }
        }
    }
    else {
        console.log(chalk.green('\n✓ Test configuration complete'));
        console.log(chalk.gray(`  • Testing ${selectedAgents.length} agent(s)`));
        console.log(chalk.gray(`  • Using ${dimensions.length} dimension(s)`));
        // Testing enhancements: Log configuration completion
        if (session.testLogger) {
            session.testLogger(`Test configuration complete: ${selectedAgents.length} agents, ${dimensions.length} dimensions`, 'success');
        }
    }
}
/**
 * Step 5: Run tests - Simplified Architecture
 *
 * Uses SimplifiedTestRunner instead of TestOrchestrator to eliminate double orchestration
 */
export async function runTestsStep(session) {
    const selectedAgents = session.testConfig?.selectedAgents || [];
    const selectedTeams = session.selectedTeams || [];
    if (selectedAgents.length === 0 && selectedTeams.length === 0) {
        return;
    }
    const totalEntities = selectedAgents.length + selectedTeams.length;
    const entityDescription = [];
    if (selectedAgents.length > 0)
        entityDescription.push(`${selectedAgents.length} agent(s)`);
    if (selectedTeams.length > 0)
        entityDescription.push(`${selectedTeams.length} team(s)`);
    const { confirmRun } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirmRun',
            message: `Ready to test ${entityDescription.join(' and ')}. Continue?`,
            default: true
        }]);
    if (!confirmRun) {
        console.log(chalk.yellow('\n⚠ Test execution cancelled'));
        return;
    }
    await animations.countdown(3, 'Starting tests in');
    // Declare split pane display outside try block for error handling
    let splitPane;
    try {
        // Load configuration
        const configPath = path.join(session.projectPath, '.identro', 'eval.config.yml');
        const config = await loadConfig(configPath);
        // Import the simplified CrewAI adapter and cache service
        const { CrewAIAdapter } = await import('@identro/eval-crewai');
        const { CacheService } = await import('../services/cache');
        const adapter = new CrewAIAdapter();
        const cache = new CacheService();
        // Create test state manager and initialize split-pane display
        const testStateManager = new TestStateManager();
        splitPane = new SplitPaneDisplay(testStateManager, config?.performance?.maxConcurrency || 5);
        splitPane.initialize();
        // Initialize dimension registry for dynamic metrics
        const { DefaultDimensionRegistry, createDimensionMetadataService } = await import('@identro/eval-core');
        const dimensionRegistry = new DefaultDimensionRegistry();
        await dimensionRegistry.loadDimensionDefinitions(session.projectPath);
        const metadataService = createDimensionMetadataService(dimensionRegistry);
        // Create LLM provider if configured
        let llmProvider = null;
        if (session.llmConfig) {
            if (session.llmConfig.provider === 'openai') {
                const { OpenAIProvider } = await import('@identro/eval-core');
                const apiKey = process.env.OPENAI_API_KEY || process.env[session.llmConfig.apiKeyEnv] || session.llmConfig.apiKey;
                if (!apiKey) {
                    splitPane?.addLog('❌ OpenAI API key not found for test execution', 'error');
                    throw new Error(`OpenAI API key not found. Please set OPENAI_API_KEY environment variable.`);
                }
                llmProvider = new OpenAIProvider({
                    apiKey: apiKey,
                    model: session.llmConfig.model || 'gpt-4-turbo-preview',
                });
                splitPane?.addLog('🧠 Initialized OpenAI LLM provider for evaluation', 'info');
            }
            else if (session.llmConfig.provider === 'anthropic') {
                const { AnthropicProvider } = await import('@identro/eval-core');
                const apiKey = process.env.ANTHROPIC_API_KEY || process.env[session.llmConfig.apiKeyEnv] || session.llmConfig.apiKey;
                if (!apiKey) {
                    splitPane?.addLog('❌ Anthropic API key not found for test execution', 'error');
                    throw new Error(`Anthropic API key not found. Please set ANTHROPIC_API_KEY environment variable.`);
                }
                llmProvider = new AnthropicProvider({
                    apiKey: apiKey,
                    model: session.llmConfig.model || 'claude-3-opus-20240229',
                });
                splitPane?.addLog('🧠 Initialized Anthropic LLM provider for evaluation', 'info');
            }
        }
        // Create SimplifiedTestRunner (eliminates double orchestration)
        const simplifiedTestRunner = new SimplifiedTestRunner(testStateManager, llmProvider, {
            maxConcurrency: config?.performance?.maxConcurrency || 5,
            maxLLMCalls: config?.llm?.max_concurrent_llm_calls || 3,
            timeoutMs: config?.performance?.testTimeoutMs || 60000,
            retryEnabled: config?.performance?.retryEnabled ?? true,
            maxRetries: config?.performance?.maxRetries || 2,
            retryDelayMs: config?.performance?.retryDelayMs || 2000
        });
        splitPane?.addLog('🚀 Initialized SimplifiedTestRunner (no double orchestration)', 'info');
        if (llmProvider) {
            splitPane?.addLog('🧠 Configured with LLM for direct evaluation', 'info');
        }
        // Load test specifications
        const { EvalSpecManager, TestSpecLoader } = await import('@identro/eval-core');
        const specManager = new EvalSpecManager(session.projectPath);
        const evalSpec = await specManager.load();
        const testSpecLoader = new TestSpecLoader();
        // Validate test specifications exist (only for agents, teams use dynamic generation)
        if (selectedAgents.length > 0) {
            const validation = testSpecLoader.validateTestSpecs(evalSpec, selectedAgents, session.testConfig.dimensions);
            if (!validation.valid) {
                splitPane?.addLog('❌ Missing test specifications detected:', 'error');
                for (const missing of validation.missing) {
                    splitPane?.addLog(`  • ${missing.agent} - ${missing.dimension}: ${missing.reason}`, 'error');
                }
                throw new Error('Missing test specifications. Please run test generation first.');
            }
        }
        // Execute agent tests if any selected
        if (selectedAgents.length > 0) {
            // Load test specifications for selected agents and dimensions
            const loadedTests = await testSpecLoader.loadTestsFromSpec(evalSpec, selectedAgents, session.testConfig.dimensions);
            splitPane?.addLog(`📋 Loaded ${loadedTests.testSpecs.length} agent test specifications`, 'info');
            splitPane?.addLog(`📊 Agent test breakdown: ${loadedTests.metadata.agentCount} agents, ${loadedTests.metadata.dimensionCount} dimensions`, 'info');
            if (loadedTests.testSpecs.length === 0) {
                splitPane?.addLog('❌ No agent tests found for selected agents and dimensions', 'error');
                throw new Error('No agent tests found. Please run test generation first.');
            }
            // Pre-create ALL agent tests in StateManager
            splitPane?.addLog('🔧 Pre-creating agent tests in StateManager...', 'info');
            for (const testSpec of loadedTests.testSpecs) {
                const agentName = testSpec.agent?.name || testSpec.metadata?.agentName || 'unknown';
                const dimension = testSpec.dimension;
                const inputIndex = testSpec.metadata?.inputIndex || 0;
                const input = testSpec.input;
                const runIndex = testSpec.metadata?.runIndex;
                testStateManager.createTestWithId(testSpec.id, agentName, dimension, inputIndex, input, runIndex);
                // Mark parent tests appropriately
                if (testSpec.metadata?.isParentTest) {
                    testStateManager.updateTest(testSpec.id, {
                        isMultiRun: true,
                        isParentTest: true,
                        visibleInQueue: false,
                        totalRuns: testSpec.metadata.totalRuns || 3,
                        completedRuns: 0,
                        testDescription: testSpec.ui_description // Load description from spec
                    });
                }
            }
            const agentTests = testStateManager.getAllTests();
            splitPane?.addLog(`✅ Pre-created ${agentTests.length} agent tests in StateManager`, 'info');
            // Execute agent tests using SimplifiedTestRunner
            await simplifiedTestRunner.runAllTests(loadedTests.testSpecs, adapter, {
                projectPath: session.projectPath,
                cache,
                splitPane: {
                    addLog: (message, level) => splitPane?.addLog(message, level),
                    updateMetrics: (apiCall, cacheHit) => splitPane?.updateMetrics(apiCall, cacheHit)
                }
            });
        }
        // Execute team tests if any selected - PHASE 2 FIX: Load from evalSpec.teams
        const sessionSelectedTeams = session.selectedTeams || [];
        if (sessionSelectedTeams.length > 0) {
            splitPane?.addLog(`👥 Starting team test execution for ${sessionSelectedTeams.length} teams`, 'info');
            // Get team names for TestSpecLoader
            const teamNames = sessionSelectedTeams.map((team) => team.name);
            // PHASE 2 FIX: Load team test specifications from evalSpec.teams (NOT evalSpec.agents)
            const teamLoadedTests = await testSpecLoader.loadTeamTests(evalSpec.teams || {}, teamNames, session.testConfig.dimensions);
            splitPane?.addLog(`📋 Loaded ${teamLoadedTests.testSpecs.length} team test specifications`, 'info');
            splitPane?.addLog(`📊 Team test breakdown: ${teamLoadedTests.metadata.agentCount} teams, ${teamLoadedTests.metadata.dimensionCount} dimensions`, 'info');
            if (teamLoadedTests.testSpecs.length === 0) {
                splitPane?.addLog('❌ No team tests found for selected teams and dimensions', 'error');
                throw new Error('No team tests found. Please run test generation first.');
            }
            // Pre-create ALL team tests in StateManager (SAME as agents)
            splitPane?.addLog('🔧 Pre-creating team tests in StateManager...', 'info');
            for (const testSpec of teamLoadedTests.testSpecs) {
                const teamName = testSpec.agent?.name || testSpec.metadata?.agentName || 'unknown';
                const dimension = testSpec.dimension;
                const inputIndex = testSpec.metadata?.inputIndex || 0;
                const input = testSpec.input;
                const runIndex = testSpec.metadata?.runIndex;
                // Mark as team test in metadata
                testSpec.metadata = {
                    ...testSpec.metadata,
                    isTeamTest: true,
                    teamName: teamName
                };
                testStateManager.createTestWithId(testSpec.id, teamName, dimension, inputIndex, input, runIndex);
                // Mark parent tests appropriately (SAME as agents)
                if (testSpec.metadata?.isParentTest) {
                    testStateManager.updateTest(testSpec.id, {
                        isMultiRun: true,
                        isParentTest: true,
                        visibleInQueue: false,
                        totalRuns: testSpec.metadata.totalRuns || 3,
                        completedRuns: 0,
                        testDescription: testSpec.ui_description // Load description from spec
                    });
                }
            }
            const teamTests = testStateManager.getAllTests();
            splitPane?.addLog(`✅ Pre-created ${teamTests.length} team tests in StateManager`, 'info');
            // Execute team tests using SAME runAllTests method as agents
            await simplifiedTestRunner.runAllTests(teamLoadedTests.testSpecs, adapter, {
                projectPath: session.projectPath,
                cache,
                splitPane: {
                    addLog: (message, level) => splitPane?.addLog(message, level),
                    updateMetrics: (apiCall, cacheHit) => splitPane?.updateMetrics(apiCall, cacheHit)
                }
            });
        }
        // Get results from TestStateManager - use the COMPLETED section data directly
        const completedTests = testStateManager.getAllTests().filter(test => test.status === 'completed' || test.status === 'failed');
        // Build results using TestStateManager data which has the correct test information
        const results = new Map();
        const agentData = new Map();
        // Group data by agent and test
        for (const test of completedTests) {
            const agentName = test.agentName;
            if (!agentData.has(agentName)) {
                agentData.set(agentName, {
                    tests: new Map(),
                    runs: [],
                    dimensions: new Set()
                });
            }
            const agent = agentData.get(agentName);
            agent.runs.push({
                input: test.input,
                output: test.result,
                latencyMs: test.latencyMs || 0,
                success: test.status === 'completed',
                error: test.error
            });
            // Group runs by test (using dimension + input as test identifier)
            const testId = `${test.dimension}-${test.inputIndex}`;
            if (!agent.tests.has(testId)) {
                agent.tests.set(testId, []);
            }
            agent.tests.get(testId).push({
                input: test.input,
                output: test.result,
                latencyMs: test.latencyMs || 0,
                success: test.status === 'completed',
                error: test.error,
                dimension: test.dimension
            });
            agent.dimensions.add(test.dimension);
        }
        // Build TestResults for each agent using the correct test data
        for (const agentName of selectedAgents) {
            const agent = agentData.get(agentName);
            if (!agent)
                continue;
            const actualTestCount = agent.tests.size;
            const totalRuns = agent.runs.length;
            // Count passed/failed tests (not runs)
            let passedTests = 0;
            let failedTests = 0;
            for (const [testId, runs] of agent.tests) {
                const passedRuns = runs.filter(r => r.success).length;
                const testPassed = passedRuns > runs.length / 2; // Majority rule for multi-run tests
                if (testPassed) {
                    passedTests++;
                }
                else {
                    failedTests++;
                }
            }
            let totalLatency = 0;
            for (const run of agent.runs) {
                totalLatency += run.latencyMs;
            }
            // Build dimension data from actual test data
            const dimensions = {};
            for (const dimension of agent.dimensions) {
                const dimensionTests = Array.from(agent.tests.entries()).filter(([testId, runs]) => runs[0].dimension === dimension);
                const dimensionTestCount = dimensionTests.length;
                const dimensionPassedTests = dimensionTests.filter(([_, runs]) => {
                    const passedRuns = runs.filter(r => r.success).length;
                    return passedRuns > runs.length / 2;
                }).length;
                const dimensionRuns = agent.runs.filter(r => Array.from(agent.tests.values()).flat().some(tr => tr.dimension === dimension && tr.input === r.input));
                // Build dimension-specific metrics dynamically
                const dimensionMetrics = {};
                // Check if dimension supports multi-run (for consistency-type metrics)
                const supportsMultiRun = await metadataService.supportsMultiRun(dimension);
                if (supportsMultiRun) {
                    dimensionMetrics.isConsistent = dimensionPassedTests === dimensionTestCount;
                    dimensionMetrics.outputVariance = 1 - dimensionPassedTests / dimensionTestCount;
                    dimensionMetrics.confidence = dimensionPassedTests / dimensionTestCount;
                }
                // Add generic metrics for all dimensions
                dimensionMetrics.score = dimensionPassedTests / dimensionTestCount;
                dimensionMetrics.passedTests = dimensionPassedTests;
                dimensionMetrics.totalTests = dimensionTestCount;
                dimensions[dimension] = dimensionMetrics;
            }
            const testResult = {
                agentId: agentName,
                timestamp: new Date(),
                tests: agent.runs,
                dimensions: dimensions,
                summary: {
                    totalTests: actualTestCount,
                    passed: passedTests,
                    failed: failedTests,
                    averageLatencyMs: totalRuns > 0 ? totalLatency / totalRuns : 0,
                    successRate: actualTestCount > 0 ? passedTests / actualTestCount : 0
                }
            };
            results.set(agentName, testResult);
        }
        // CRITICAL FIX: Also build TestResults for teams (same logic as agents)
        for (const team of sessionSelectedTeams) {
            const teamName = team.name;
            const teamData = agentData.get(teamName);
            if (!teamData)
                continue;
            const actualTestCount = teamData.tests.size;
            const totalRuns = teamData.runs.length;
            // Count passed/failed tests (not runs) - same logic as agents
            let passedTests = 0;
            let failedTests = 0;
            for (const [testId, runs] of teamData.tests) {
                const passedRuns = runs.filter(r => r.success).length;
                const testPassed = passedRuns > runs.length / 2; // Majority rule for multi-run tests
                if (testPassed) {
                    passedTests++;
                }
                else {
                    failedTests++;
                }
            }
            let totalLatency = 0;
            for (const run of teamData.runs) {
                totalLatency += run.latencyMs;
            }
            // Build dimension data from actual test data - same logic as agents
            const dimensions = {};
            for (const dimension of teamData.dimensions) {
                const dimensionTests = Array.from(teamData.tests.entries()).filter(([testId, runs]) => runs[0].dimension === dimension);
                const dimensionTestCount = dimensionTests.length;
                const dimensionPassedTests = dimensionTests.filter(([_, runs]) => {
                    const passedRuns = runs.filter(r => r.success).length;
                    return passedRuns > runs.length / 2;
                }).length;
                const dimensionRuns = teamData.runs.filter(r => Array.from(teamData.tests.values()).flat().some(tr => tr.dimension === dimension && tr.input === r.input));
                // Build dimension-specific metrics dynamically (same as agents)
                const dimensionMetrics = {};
                // Check if dimension supports multi-run (for consistency-type metrics)
                const supportsMultiRun = await metadataService.supportsMultiRun(dimension);
                if (supportsMultiRun) {
                    dimensionMetrics.isConsistent = dimensionPassedTests === dimensionTestCount;
                    dimensionMetrics.outputVariance = 1 - dimensionPassedTests / dimensionTestCount;
                    dimensionMetrics.confidence = dimensionPassedTests / dimensionTestCount;
                }
                // Add generic metrics for all dimensions
                dimensionMetrics.score = dimensionPassedTests / dimensionTestCount;
                dimensionMetrics.passedTests = dimensionPassedTests;
                dimensionMetrics.totalTests = dimensionTestCount;
                dimensions[dimension] = dimensionMetrics;
            }
            const testResult = {
                agentId: teamName,
                timestamp: new Date(),
                tests: teamData.runs,
                dimensions: dimensions,
                summary: {
                    totalTests: actualTestCount,
                    passed: passedTests,
                    failed: failedTests,
                    averageLatencyMs: totalRuns > 0 ? totalLatency / totalRuns : 0,
                    successRate: actualTestCount > 0 ? passedTests / actualTestCount : 0
                }
            };
            results.set(teamName, testResult);
        }
        session.results = results;
        // Display final results
        splitPane.addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        splitPane.addLog('All tests completed! 🎉', 'success');
        // Calculate totals
        let totalTests = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        for (const [agentName, result] of results) {
            totalTests += result.summary.totalTests;
            totalPassed += result.summary.passed;
            totalFailed += result.summary.failed;
        }
        const successRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : '0';
        splitPane.addLog(`📊 Final Results: ${totalPassed}/${totalTests} passed (${successRate}% success rate)`, parseFloat(successRate) >= 80 ? 'success' : parseFloat(successRate) >= 60 ? 'warning' : 'error');
        // Show completion options
        splitPane.addLog('🎯 Tests completed! Choose your next action:', 'success');
        splitPane.addLog('  [R] Generate detailed report', 'info');
        splitPane.addLog('  [V] View results summary', 'info');
        splitPane.addLog('  [Q] Quit to terminal', 'info');
        // Wait for user input
        process.stdin.setRawMode(true);
        process.stdin.resume();
        const userChoice = await new Promise((resolve) => {
            const onKeypress = (chunk) => {
                const key = chunk.toString().toLowerCase();
                process.stdin.setRawMode(false);
                process.stdin.pause();
                process.stdin.removeListener('data', onKeypress);
                resolve(key);
            };
            process.stdin.on('data', onKeypress);
        });
        // Stop the split-pane display
        splitPane.stop();
        // Generate HTML report using TestStateManager data (same source as terminal and split-pane)
        const reportModule = await import('./report');
        const reportData = await reportModule.generateRichReportData(results, session.projectPath, testStateManager);
        // Save HTML report with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportsDir = path.join(session.projectPath, '.identro', 'reports');
        await fs.ensureDir(reportsDir);
        const reportPath = path.join(reportsDir, `interactive-${timestamp}.html`);
        const htmlReport = await reportModule.generateRichHtmlReport(reportData, session.projectPath);
        await fs.writeFile(reportPath, htmlReport);
        // Track report in manifest using TestStateManager data for accurate counts
        const { ReportManifestManager } = await import('../utils/report-manifest');
        const manifestManager = new ReportManifestManager(session.projectPath);
        const metrics = testStateManager.getMetrics();
        await manifestManager.addReportFromTestStateManager(reportPath, 'html', 'interactive', testStateManager, {
            duration: Date.now() - metrics.startTime.getTime(),
            llmCalls: metrics.totalLLMCalls,
            llmCost: metrics.totalCost
        });
        // Display beautiful terminal summary using same data source as split-pane
        await displayTerminalSummary(results, testStateManager);
        // Show interactive menu and handle user choices
        let continueMenu = true;
        while (continueMenu) {
            const action = await showInteractiveMenu(reportPath);
            switch (action) {
                case 'dashboard':
                    const open = await import('open');
                    await open.default(reportPath);
                    console.log(chalk.green('\n📖 Rich dashboard opened in your browser!'));
                    console.log(chalk.gray('Press any key to return to menu...'));
                    // Wait for keypress
                    process.stdin.setRawMode(true);
                    process.stdin.resume();
                    await new Promise((resolve) => {
                        const onKeypress = () => {
                            process.stdin.setRawMode(false);
                            process.stdin.pause();
                            process.stdin.removeListener('data', onKeypress);
                            resolve();
                        };
                        process.stdin.on('data', onKeypress);
                    });
                    break;
                case 'details':
                    await displayDetailedResults(results, testStateManager);
                    break;
                case 'export':
                    await handleExportReport(session, results);
                    break;
                case 'compare':
                    console.log(chalk.yellow('\n🔄 Report comparison feature coming soon!'));
                    console.log(chalk.gray('This will allow you to compare with previous test runs.'));
                    console.log(chalk.gray('Press any key to continue...'));
                    process.stdin.setRawMode(true);
                    process.stdin.resume();
                    await new Promise((resolve) => {
                        const onKeypress = () => {
                            process.stdin.setRawMode(false);
                            process.stdin.pause();
                            process.stdin.removeListener('data', onKeypress);
                            resolve();
                        };
                        process.stdin.on('data', onKeypress);
                    });
                    break;
                case 'rerun':
                    console.log(chalk.yellow('\n🔁 Re-run failed tests feature coming soon!'));
                    console.log(chalk.gray('This will allow you to re-run only the failed tests.'));
                    console.log(chalk.gray('Press any key to continue...'));
                    process.stdin.setRawMode(true);
                    process.stdin.resume();
                    await new Promise((resolve) => {
                        const onKeypress = () => {
                            process.stdin.setRawMode(false);
                            process.stdin.pause();
                            process.stdin.removeListener('data', onKeypress);
                            resolve();
                        };
                        process.stdin.on('data', onKeypress);
                    });
                    break;
                case 'quit':
                default:
                    continueMenu = false;
                    break;
            }
        }
    }
    catch (err) {
        if (splitPane) {
            splitPane.stop();
        }
        console.clear();
        await animations.error('Test execution failed', 2000);
        console.error(chalk.red('\n❌ Error:'), err.message);
        throw err;
    }
}
/**
 * Step 6: Generate report
 */
export async function reportStep(session) {
    if (!session.results || session.results.size === 0) {
        return;
    }
    console.log(chalk.bold.cyan('\n📈 Step 6: Report Generation\n'));
    console.log(chalk.gray('Generate detailed reports of your test results...\n'));
    const { generateReport } = await inquirer.prompt([{
            type: 'confirm',
            name: 'generateReport',
            message: 'Would you like to generate a detailed report?',
            default: true
        }]);
    if (!generateReport) {
        return;
    }
    const { format } = await inquirer.prompt([{
            type: 'list',
            name: 'format',
            message: 'Select report format:',
            choices: [
                { name: '📝 Markdown', value: 'markdown' },
                { name: '📊 HTML', value: 'html' },
                { name: '📋 JSON', value: 'json' },
                { name: '📄 Plain Text', value: 'text' }
            ]
        }]);
    const reportPath = path.join(session.projectPath, '.identro', `report.${format === 'markdown' ? 'md' : format}`);
    const spinner = animations.loading('Generating report...', 'dots12');
    try {
        const engine = getEvaluationEngine();
        const report = engine.generateReport(session.results, format);
        await fs.ensureDir(path.dirname(reportPath));
        await fs.writeFile(reportPath, report);
        spinner.stop();
        await animations.success(`Report saved to ${path.relative(session.projectPath, reportPath)}`, 1500);
        const { openReport } = await inquirer.prompt([{
                type: 'confirm',
                name: 'openReport',
                message: 'Open report now?',
                default: true
            }]);
        if (openReport) {
            const open = await import('open');
            await open.default(reportPath);
        }
    }
    catch (err) {
        spinner.stop();
        await animations.error('Report generation failed', 1500);
        console.log(chalk.yellow('You can still view the results above'));
    }
}
/**
 * Display test summary
 */
function displayTestSummary(results) {
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    for (const [agentName, result] of results) {
        totalTests += result.summary.totalTests;
        totalPassed += result.summary.passed;
        totalFailed += result.summary.failed;
    }
    const successRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : '0';
    console.log(boxen(chalk.bold('Test Summary\n\n') +
        `${chalk.green('✓ Passed:')} ${totalPassed}\n` +
        `${chalk.red('✗ Failed:')} ${totalFailed}\n` +
        `${chalk.cyan('Total:')} ${totalTests}\n\n` +
        `${chalk.bold('Success Rate:')} ${successRate}%`, {
        padding: 1,
        borderStyle: 'round',
        borderColor: parseFloat(successRate) >= 80 ? 'green' : parseFloat(successRate) >= 60 ? 'yellow' : 'red'
    }));
}
/**
 * Handle export report functionality
 */
async function handleExportReport(session, results) {
    console.log(chalk.cyan('\n💾 Export Report'));
    console.log(chalk.gray('Choose export format and options...\n'));
    const { format } = await inquirer.prompt([{
            type: 'list',
            name: 'format',
            message: 'Select export format:',
            choices: [
                { name: '📝 Markdown (.md)', value: 'markdown' },
                { name: '📊 HTML (.html)', value: 'html' },
                { name: '📋 JSON (.json)', value: 'json' },
                { name: '📄 Plain Text (.txt)', value: 'text' },
                { name: '📈 Rich Dashboard (.html)', value: 'rich' }
            ]
        }]);
    const { customPath } = await inquirer.prompt([{
            type: 'confirm',
            name: 'customPath',
            message: 'Specify custom export path?',
            default: false
        }]);
    let exportPath;
    if (customPath) {
        const { path: userPath } = await inquirer.prompt([{
                type: 'input',
                name: 'path',
                message: 'Enter export path:',
                default: `./identro-report.${format === 'markdown' ? 'md' : format === 'rich' ? 'html' : format}`
            }]);
        exportPath = path.resolve(userPath);
    }
    else {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = format === 'markdown' ? 'md' : format === 'rich' ? 'html' : format;
        exportPath = path.join(session.projectPath, '.identro', 'exports', `report-${timestamp}.${extension}`);
    }
    const spinner = animations.loading('Exporting report...', 'dots12');
    try {
        let reportContent;
        if (format === 'rich') {
            // Generate rich HTML report
            const reportModule = await import('./report');
            const reportData = await reportModule.generateRichReportData(results, session.projectPath);
            reportContent = await reportModule.generateRichHtmlReport(reportData, session.projectPath);
        }
        else {
            // Use existing report generation
            const engine = getEvaluationEngine();
            const config = await loadConfig();
            await engine.initialize(config);
            reportContent = engine.generateReport(results, format);
        }
        // Ensure directory exists and write file
        await fs.ensureDir(path.dirname(exportPath));
        await fs.writeFile(exportPath, reportContent, 'utf-8');
        spinner.stop();
        await animations.success(`Report exported successfully!`, 1500);
        console.log(chalk.green(`\n✨ Export complete!`));
        console.log(chalk.gray(`Saved to: ${chalk.white.bold(exportPath)}`));
        const { openExported } = await inquirer.prompt([{
                type: 'confirm',
                name: 'openExported',
                message: 'Open exported report?',
                default: format === 'rich' || format === 'html'
            }]);
        if (openExported) {
            const open = await import('open');
            await open.default(exportPath);
            console.log(chalk.green('📖 Exported report opened!'));
        }
    }
    catch (err) {
        spinner.stop();
        await animations.error('Export failed', 1500);
        console.log(chalk.red(`❌ Export failed: ${err.message}`));
    }
    console.log(chalk.gray('Press any key to return to menu...'));
    process.stdin.setRawMode(true);
    process.stdin.resume();
    await new Promise((resolve) => {
        const onKeypress = () => {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', onKeypress);
            resolve();
        };
        process.stdin.on('data', onKeypress);
    });
}
/**
 * Helper function to quickly detect framework without full engine initialization
 */
async function detectFrameworkQuick(projectPath) {
    // Quick framework detection - check for common framework files
    if (await fs.pathExists(path.join(projectPath, 'crew.py')) ||
        await fs.pathExists(path.join(projectPath, 'agents.yaml'))) {
        return 'crewai';
    }
    // Check package.json for langchain
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJSON(packageJsonPath);
        if (packageJson.dependencies?.langchain || packageJson.devDependencies?.langchain) {
            return 'langchain';
        }
    }
    return undefined;
}
/**
 * Display completion message
 */
export async function displayCompletion(session, ui) {
    const selectedAgents = session.testConfig?.selectedAgents || [];
    const selectedTeams = session.selectedTeams || [];
    // Use test logger in non-interactive mode
    if (session.nonInteractive && session.testLogger) {
        session.testLogger('=== Evaluation Complete ===', 'success');
        if (selectedAgents.length > 0) {
            session.testLogger(`Agents tested: ${selectedAgents.length}`, 'info');
        }
        if (selectedTeams.length > 0) {
            session.testLogger(`Teams tested: ${selectedTeams.length}`, 'info');
        }
        session.testLogger(`Dimensions used: ${session.testConfig?.dimensions.join(', ') || 'none'}`, 'info');
        return;
    }
    console.log();
    console.log(chalk.green.bold('✨ Evaluation Complete!'));
    // Build summary text based on what was tested
    let summaryText = chalk.bold.green('Your AI evaluation is complete!\n\n') + chalk.white('📊 Summary:\n');
    if (selectedAgents.length > 0) {
        summaryText += chalk.gray(`  • 🤖 Agents tested: ${selectedAgents.length}\n`);
    }
    if (selectedTeams.length > 0) {
        summaryText += chalk.gray(`  • 👥 Teams tested: ${selectedTeams.length}\n`);
    }
    if (selectedAgents.length === 0 && selectedTeams.length === 0) {
        summaryText += chalk.gray(`  • No entities tested\n`);
    }
    summaryText += chalk.gray(`  • Dimensions used: ${session.testConfig?.dimensions.join(', ') || 'none'}\n`);
    summaryText += chalk.gray(`  • Architecture: Simplified (no double orchestration)\n\n`);
    summaryText += chalk.white('🚀 Next steps:\n');
    summaryText += chalk.gray('  • Review the detailed report\n');
    summaryText += chalk.gray('  • Fix any failing tests\n');
    summaryText += chalk.gray('  • Try watch mode: identro-eval watch\n');
    summaryText += chalk.gray('  • Integrate into CI/CD pipeline');
    console.log(boxen(summaryText, {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'green',
    }));
    console.log(chalk.gray('\n💡 Pro tip: Use ') + chalk.cyan('identro-eval watch') + chalk.gray(' for auto-rerun on file changes'));
    console.log(chalk.gray('\nThank you for using Identro Eval! 🎯\n'));
}
//# sourceMappingURL=interactive.js.map