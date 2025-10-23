"use strict";
/**
 * Pattern Management Commands
 *
 * Provides CLI commands for managing pattern definitions in .identro/patterns/
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patternsCommand = patternsCommand;
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const inquirer_1 = __importDefault(require("inquirer"));
const eval_core_1 = require("@identro/eval-core");
const eval_core_2 = require("@identro/eval-core");
const animations_1 = require("../utils/animations");
/**
 * Create the patterns command with subcommands
 */
function patternsCommand() {
    const cmd = new commander_1.Command('patterns')
        .description('Manage pattern definitions')
        .option('-p, --path <path>', 'Project path', process.cwd());
    // List patterns subcommand
    cmd.command('list')
        .description('List all available patterns')
        .action(async (options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await listPatterns(projectPath);
    });
    // Show pattern subcommand
    cmd.command('show <pattern>')
        .description('Show details of a specific pattern')
        .action(async (patternName, options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await showPattern(projectPath, patternName);
    });
    // Create pattern subcommand
    cmd.command('create <name>')
        .description('Create a new pattern')
        .option('-d, --description <desc>', 'Pattern description')
        .option('-s, --short <short>', 'Short description')
        .option('--template <template>', 'Use template (consistency, safety, performance)')
        .action(async (name, options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await createPattern(projectPath, name, options);
    });
    // Edit pattern subcommand
    cmd.command('edit <pattern>')
        .description('Open pattern file for editing')
        .action(async (patternName, options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await editPattern(projectPath, patternName);
    });
    // Validate patterns subcommand
    cmd.command('validate')
        .description('Validate all pattern files')
        .action(async (options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await validatePatterns(projectPath);
    });
    // Reset patterns subcommand
    cmd.command('reset')
        .description('Reset patterns to defaults')
        .option('--force', 'Skip confirmation')
        .action(async (options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await resetPatterns(projectPath, options.force);
    });
    return cmd;
}
/**
 * List all available patterns
 */
async function listPatterns(projectPath) {
    console.log(chalk_1.default.bold.cyan('\n📋 Available Patterns\n'));
    try {
        // Load config to get enabled patterns
        const { loadConfig } = await Promise.resolve().then(() => __importStar(require('../utils/config')));
        const configPath = path.join(projectPath, '.identro', 'eval.config.yml');
        const config = await loadConfig(configPath);
        const enabledPatterns = config.patterns?.enabled || [];
        const patternLoader = new eval_core_1.PatternFileLoader({
            projectPath,
            createDefaults: true
        });
        const patterns = await patternLoader.loadAllPatterns();
        if (patterns.size === 0) {
            console.log(chalk_1.default.yellow('No patterns found. Run with --create-defaults to create default patterns.'));
            return;
        }
        console.log(`Found ${patterns.size} pattern(s):\n`);
        for (const [name, pattern] of patterns) {
            const isEnabled = enabledPatterns.includes(name);
            const status = isEnabled ? chalk_1.default.green('✓ enabled') : chalk_1.default.red('✗ disabled');
            const priority = `priority ${pattern.priority}`;
            const complexity = pattern.metadata.complexity || 'moderate';
            console.log(`${chalk_1.default.bold.cyan('●')} ${chalk_1.default.bold(name)} ${chalk_1.default.gray(`(${status}, ${priority})`)}`);
            console.log(`  ${chalk_1.default.gray('Description:')} ${pattern.description}`);
            console.log(`  ${chalk_1.default.gray('Complexity:')} ${complexity}`);
            console.log(`  ${chalk_1.default.gray('Test count:')} ${pattern.configuration?.test_count || 3}`);
            console.log(`  ${chalk_1.default.gray('Version:')} ${pattern.metadata.version}`);
            if (pattern.metadata.tags && pattern.metadata.tags.length > 0) {
                console.log(`  ${chalk_1.default.gray('Tags:')} ${pattern.metadata.tags.join(', ')}`);
            }
            console.log();
        }
        const patternsDir = path.join(projectPath, '.identro', 'patterns');
        console.log(chalk_1.default.gray(`Pattern files location: ${patternsDir}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error listing patterns:'), error.message);
        process.exit(1);
    }
}
/**
 * Show details of a specific pattern
 */
async function showPattern(projectPath, patternName) {
    console.log(chalk_1.default.bold.cyan(`\n📄 Pattern: ${patternName}\n`));
    try {
        // Load config to get enabled status
        const { loadConfig } = await Promise.resolve().then(() => __importStar(require('../utils/config')));
        const configPath = path.join(projectPath, '.identro', 'eval.config.yml');
        const config = await loadConfig(configPath);
        const enabledPatterns = config.patterns?.enabled || [];
        const patternLoader = new eval_core_1.PatternFileLoader({
            projectPath,
            createDefaults: true
        });
        const pattern = await patternLoader.loadPattern(patternName);
        if (!pattern) {
            console.log(chalk_1.default.red(`❌ Pattern '${patternName}' not found.`));
            console.log(chalk_1.default.gray('Available patterns:'));
            const allPatterns = await patternLoader.loadAllPatterns();
            for (const name of allPatterns.keys()) {
                console.log(chalk_1.default.gray(`  • ${name}`));
            }
            return;
        }
        // Display pattern details
        const isEnabled = enabledPatterns.includes(patternName);
        console.log(`${chalk_1.default.bold('Name:')} ${pattern.name}`);
        console.log(`${chalk_1.default.bold('Description:')} ${pattern.description}`);
        console.log(`${chalk_1.default.bold('Short Description:')} ${pattern.short_description}`);
        console.log(`${chalk_1.default.bold('Enabled:')} ${isEnabled ? chalk_1.default.green('Yes') : chalk_1.default.red('No')}`);
        console.log(`${chalk_1.default.bold('Priority:')} ${pattern.priority}`);
        console.log();
        // Configuration
        if (pattern.configuration) {
            console.log(chalk_1.default.bold.yellow('⚙️  Configuration:'));
            console.log(`  Test count: ${pattern.configuration.test_count || 3}`);
            console.log(`  Runs per input: ${pattern.configuration.runs_per_input || 3}`);
            console.log(`  Similarity threshold: ${pattern.configuration.similarity_threshold || 0.8}`);
            console.log(`  Timeout: ${pattern.configuration.timeout_ms || 60000}ms`);
            console.log();
        }
        // Prompts
        console.log(chalk_1.default.bold.yellow('📝 Prompts:'));
        console.log(`  Agent requirements (${pattern.prompts.agent_requirements.length} chars):`);
        console.log(chalk_1.default.gray(`    ${pattern.prompts.agent_requirements.substring(0, 100)}...`));
        if (pattern.prompts.team_requirements) {
            console.log(`  Team requirements (${pattern.prompts.team_requirements.length} chars):`);
            console.log(chalk_1.default.gray(`    ${pattern.prompts.team_requirements.substring(0, 100)}...`));
        }
        if (pattern.prompts.evaluation_criteria && pattern.prompts.evaluation_criteria.length > 0) {
            console.log(`  Evaluation criteria (${pattern.prompts.evaluation_criteria.length} items):`);
            pattern.prompts.evaluation_criteria.slice(0, 3).forEach(criteria => {
                console.log(chalk_1.default.gray(`    • ${criteria.substring(0, 80)}${criteria.length > 80 ? '...' : ''}`));
            });
            if (pattern.prompts.evaluation_criteria.length > 3) {
                console.log(chalk_1.default.gray(`    ... and ${pattern.prompts.evaluation_criteria.length - 3} more`));
            }
        }
        console.log();
        // Metadata
        console.log(chalk_1.default.bold.yellow('📊 Metadata:'));
        console.log(`  Version: ${pattern.metadata.version}`);
        console.log(`  Complexity: ${pattern.metadata.complexity}`);
        console.log(`  Author: ${pattern.metadata.author || 'Unknown'}`);
        if (pattern.metadata.tags && pattern.metadata.tags.length > 0) {
            console.log(`  Tags: ${pattern.metadata.tags.join(', ')}`);
        }
        console.log();
        // Variables
        if (pattern.variables && Object.keys(pattern.variables).length > 0) {
            console.log(chalk_1.default.bold.yellow('🔧 Variables:'));
            for (const [key, value] of Object.entries(pattern.variables)) {
                console.log(`  ${key}: ${JSON.stringify(value)}`);
            }
            console.log();
        }
        // File location
        const filePath = patternLoader.getPatternFilePath(patternName);
        console.log(chalk_1.default.gray(`File location: ${filePath}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error showing pattern:'), error.message);
        process.exit(1);
    }
}
/**
 * Create a new pattern
 */
async function createPattern(projectPath, name, options) {
    console.log(chalk_1.default.bold.cyan(`\n✨ Creating Pattern: ${name}\n`));
    try {
        const patternLoader = new eval_core_1.PatternFileLoader({
            projectPath,
            createDefaults: true
        });
        // Check if pattern already exists
        if (await patternLoader.patternExists(name)) {
            console.log(chalk_1.default.red(`❌ Pattern '${name}' already exists.`));
            const { overwrite } = await inquirer_1.default.prompt([{
                    type: 'confirm',
                    name: 'overwrite',
                    message: 'Overwrite existing pattern?',
                    default: false
                }]);
            if (!overwrite) {
                console.log(chalk_1.default.yellow('Pattern creation cancelled.'));
                return;
            }
        }
        let pattern;
        if (options.template) {
            // Use template
            const templatePattern = await patternLoader.loadPattern(options.template);
            if (!templatePattern) {
                console.log(chalk_1.default.red(`❌ Template pattern '${options.template}' not found.`));
                return;
            }
            pattern = {
                ...templatePattern,
                name,
                description: options.description || `${name} testing pattern based on ${options.template}`,
                short_description: options.short || `Test ${name} aspects`,
                metadata: {
                    ...templatePattern.metadata,
                    version: '1.0.0',
                    created_at: new Date().toISOString(),
                    author: 'User',
                    tags: [name, 'custom', `based-on-${options.template}`]
                }
            };
        }
        else {
            // Interactive creation
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'description',
                    message: 'Pattern description:',
                    default: options.description || `${name} testing pattern`,
                    validate: (input) => input.length > 0 || 'Description is required'
                },
                {
                    type: 'input',
                    name: 'shortDescription',
                    message: 'Short description:',
                    default: options.short || `Test ${name} aspects`,
                    validate: (input) => input.length > 0 || 'Short description is required'
                },
                {
                    type: 'list',
                    name: 'complexity',
                    message: 'Pattern complexity:',
                    choices: [
                        { name: 'Simple - Basic testing', value: 'simple' },
                        { name: 'Moderate - Standard testing', value: 'moderate' },
                        { name: 'Complex - Advanced testing', value: 'complex' },
                        { name: 'Advanced - Expert-level testing', value: 'advanced' }
                    ],
                    default: 'moderate'
                },
                {
                    type: 'number',
                    name: 'priority',
                    message: 'Pattern priority (1-10):',
                    default: 5,
                    validate: (input) => (input >= 1 && input <= 10) || 'Priority must be between 1 and 10'
                },
                {
                    type: 'number',
                    name: 'testCount',
                    message: 'Default test count:',
                    default: 3,
                    validate: (input) => input > 0 || 'Test count must be positive'
                },
                {
                    type: 'input',
                    name: 'tags',
                    message: 'Tags (comma-separated):',
                    default: name,
                    filter: (input) => input.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
                }
            ]);
            pattern = (0, eval_core_2.createDefaultPatternDefinition)(name, answers.description, answers.shortDescription);
            pattern.metadata.complexity = answers.complexity;
            pattern.priority = answers.priority;
            if (pattern.configuration) {
                pattern.configuration.test_count = answers.testCount;
            }
            pattern.metadata.tags = answers.tags;
            pattern.metadata.author = 'User';
        }
        // Save the pattern
        await patternLoader.savePattern(name, pattern);
        console.log(chalk_1.default.green(`\n✅ Pattern '${name}' created successfully!`));
        console.log(chalk_1.default.gray(`File: ${patternLoader.getPatternFilePath(name)}`));
        const { editNow } = await inquirer_1.default.prompt([{
                type: 'confirm',
                name: 'editNow',
                message: 'Open pattern file for editing?',
                default: true
            }]);
        if (editNow) {
            await editPattern(projectPath, name);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error creating pattern:'), error.message);
        process.exit(1);
    }
}
/**
 * Edit a pattern file
 */
async function editPattern(projectPath, patternName) {
    try {
        const patternLoader = new eval_core_1.PatternFileLoader({
            projectPath,
            createDefaults: true
        });
        const filePath = patternLoader.getPatternFilePath(patternName);
        if (!(await fs.pathExists(filePath))) {
            console.log(chalk_1.default.red(`❌ Pattern '${patternName}' not found.`));
            const { create } = await inquirer_1.default.prompt([{
                    type: 'confirm',
                    name: 'create',
                    message: 'Create new pattern?',
                    default: true
                }]);
            if (create) {
                await createPattern(projectPath, patternName, {});
                return;
            }
            else {
                return;
            }
        }
        console.log(chalk_1.default.cyan(`\n📝 Opening pattern file: ${patternName}`));
        console.log(chalk_1.default.gray(`File: ${filePath}\n`));
        // Try to open with default editor
        const { spawn } = await Promise.resolve().then(() => __importStar(require('child_process')));
        const editor = process.env.EDITOR || process.env.VISUAL || 'code';
        const child = spawn(editor, [filePath], {
            stdio: 'inherit',
            detached: true
        });
        child.on('error', (error) => {
            console.log(chalk_1.default.yellow(`⚠ Could not open editor '${editor}': ${error.message}`));
            console.log(chalk_1.default.gray(`Please manually edit: ${filePath}`));
        });
        child.on('exit', (code) => {
            if (code === 0) {
                console.log(chalk_1.default.green('\n✅ Pattern file editing completed.'));
            }
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error editing pattern:'), error.message);
        process.exit(1);
    }
}
/**
 * Validate all pattern files
 */
async function validatePatterns(projectPath) {
    console.log(chalk_1.default.bold.cyan('\n🔍 Validating Pattern Files\n'));
    const spinner = animations_1.animations.loading('Validating patterns...', 'dots12');
    try {
        const patternLoader = new eval_core_1.PatternFileLoader({
            projectPath,
            createDefaults: false // Don't create defaults during validation
        });
        const patternsDir = path.join(projectPath, '.identro', 'patterns');
        if (!(await fs.pathExists(patternsDir))) {
            spinner.stop();
            console.log(chalk_1.default.yellow('⚠ No patterns directory found.'));
            console.log(chalk_1.default.gray(`Expected: ${patternsDir}`));
            return;
        }
        const files = await fs.readdir(patternsDir);
        const ymlFiles = files.filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
        if (ymlFiles.length === 0) {
            spinner.stop();
            console.log(chalk_1.default.yellow('⚠ No pattern files found.'));
            return;
        }
        spinner.update(`Validating ${ymlFiles.length} pattern files...`);
        let validCount = 0;
        let invalidCount = 0;
        const errors = [];
        for (const file of ymlFiles) {
            const patternName = path.basename(file, path.extname(file));
            try {
                const pattern = await patternLoader.loadPattern(patternName);
                if (pattern) {
                    validCount++;
                    spinner.update(`✅ ${patternName} - valid`);
                }
                else {
                    invalidCount++;
                    errors.push({ file: patternName, error: 'Failed to load pattern' });
                }
            }
            catch (error) {
                invalidCount++;
                errors.push({ file: patternName, error: error.message });
            }
        }
        spinner.stop();
        console.log(chalk_1.default.green(`\n✅ Validation complete: ${validCount} valid, ${invalidCount} invalid\n`));
        if (errors.length > 0) {
            console.log(chalk_1.default.red('❌ Validation errors:'));
            for (const error of errors) {
                console.log(chalk_1.default.red(`  • ${error.file}: ${error.error}`));
            }
            console.log();
        }
        if (validCount > 0) {
            console.log(chalk_1.default.green(`${validCount} pattern(s) are valid and ready to use.`));
        }
    }
    catch (error) {
        spinner.stop();
        console.error(chalk_1.default.red('❌ Error validating patterns:'), error.message);
        process.exit(1);
    }
}
/**
 * Reset patterns to defaults
 */
async function resetPatterns(projectPath, force = false) {
    console.log(chalk_1.default.bold.cyan('\n🔄 Reset Patterns to Defaults\n'));
    if (!force) {
        console.log(chalk_1.default.yellow('⚠ This will overwrite all existing pattern files with defaults.'));
        const { confirm } = await inquirer_1.default.prompt([{
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to reset all patterns?',
                default: false
            }]);
        if (!confirm) {
            console.log(chalk_1.default.yellow('Reset cancelled.'));
            return;
        }
    }
    const spinner = animations_1.animations.loading('Resetting patterns...', 'dots12');
    try {
        const patternsDir = path.join(projectPath, '.identro', 'patterns');
        // Remove existing patterns directory
        if (await fs.pathExists(patternsDir)) {
            await fs.remove(patternsDir);
            spinner.update('Removed existing patterns...');
        }
        // Create new pattern loader to generate defaults
        const patternLoader = new eval_core_1.PatternFileLoader({
            projectPath,
            createDefaults: true
        });
        // Load all patterns (this will create defaults)
        const patterns = await patternLoader.loadAllPatterns();
        spinner.stop();
        console.log(chalk_1.default.green(`\n✅ Reset complete! Created ${patterns.size} default patterns:`));
        for (const name of patterns.keys()) {
            console.log(chalk_1.default.cyan(`  • ${name}`));
        }
        console.log(chalk_1.default.gray(`\nPattern files location: ${patternsDir}`));
    }
    catch (error) {
        spinner.stop();
        console.error(chalk_1.default.red('❌ Error resetting patterns:'), error.message);
        process.exit(1);
    }
}
//# sourceMappingURL=patterns.js.map