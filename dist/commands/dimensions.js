"use strict";
/**
 * Dimension Management Commands
 *
 * Provides CLI commands for managing dimension definitions in .identro/dimensions/
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
exports.dimensionsCommand = dimensionsCommand;
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const inquirer_1 = __importDefault(require("inquirer"));
const eval_core_1 = require('../_internal/core');
const eval_core_2 = require('../_internal/core');
const animations_1 = require("../utils/animations");
/**
 * Create the dimensions command with subcommands
 */
function dimensionsCommand() {
    const cmd = new commander_1.Command('dimensions')
        .description('Manage dimension definitions')
        .option('-p, --path <path>', 'Project path', process.cwd());
    // List dimensions subcommand
    cmd.command('list')
        .description('List all available dimensions')
        .action(async (options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await listDimensions(projectPath);
    });
    // Show dimension subcommand
    cmd.command('show <dimension>')
        .description('Show details of a specific dimension')
        .action(async (dimensionName, options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await showDimension(projectPath, dimensionName);
    });
    // Create dimension subcommand
    cmd.command('create <name>')
        .description('Create a new dimension')
        .option('-d, --description <desc>', 'Dimension description')
        .option('-s, --short <short>', 'Short description')
        .option('--template <template>', 'Use template (consistency, safety, performance)')
        .action(async (name, options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await createDimension(projectPath, name, options);
    });
    // Edit dimension subcommand
    cmd.command('edit <dimension>')
        .description('Open dimension file for editing')
        .action(async (dimensionName, options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await editDimension(projectPath, dimensionName);
    });
    // Validate dimensions subcommand
    cmd.command('validate')
        .description('Validate all dimension files')
        .action(async (options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await validateDimensions(projectPath);
    });
    // Reset dimensions subcommand
    cmd.command('reset')
        .description('Reset dimensions to defaults')
        .option('--force', 'Skip confirmation')
        .action(async (options, command) => {
        const projectPath = command.parent?.opts().path || process.cwd();
        await resetDimensions(projectPath, options.force);
    });
    return cmd;
}
/**
 * List all available dimensions
 */
async function listDimensions(projectPath) {
    console.log(chalk_1.default.bold.cyan('\n📋 Available Dimensions\n'));
    try {
        // Load config to get enabled dimensions
        const { loadConfig } = await Promise.resolve().then(() => __importStar(require('../utils/config')));
        const configPath = path.join(projectPath, '.identro', 'eval.config.yml');
        const config = await loadConfig(configPath);
        const enabledDimensions = config.dimensions?.enabled || [];
        const dimensionLoader = new eval_core_1.DimensionFileLoader({
            projectPath,
            createDefaults: true
        });
        const dimensions = await dimensionLoader.loadAllDimensions();
        if (dimensions.size === 0) {
            console.log(chalk_1.default.yellow('No dimensions found. Run with --create-defaults to create default dimensions.'));
            return;
        }
        console.log(`Found ${dimensions.size} dimension(s):\n`);
        for (const [name, dimension] of dimensions) {
            const isEnabled = enabledDimensions.includes(name);
            const status = isEnabled ? chalk_1.default.green('✓ enabled') : chalk_1.default.red('✗ disabled');
            const priority = `priority ${dimension.priority}`;
            const complexity = dimension.metadata.complexity || 'moderate';
            console.log(`${chalk_1.default.bold.cyan('●')} ${chalk_1.default.bold(name)} ${chalk_1.default.gray(`(${status}, ${priority})`)}`);
            console.log(`  ${chalk_1.default.gray('Description:')} ${dimension.description}`);
            console.log(`  ${chalk_1.default.gray('Complexity:')} ${complexity}`);
            console.log(`  ${chalk_1.default.gray('Test count:')} ${dimension.configuration?.test_count || 3}`);
            console.log(`  ${chalk_1.default.gray('Version:')} ${dimension.metadata.version}`);
            if (dimension.metadata.tags && dimension.metadata.tags.length > 0) {
                console.log(`  ${chalk_1.default.gray('Tags:')} ${dimension.metadata.tags.join(', ')}`);
            }
            console.log();
        }
        const dimensionsDir = path.join(projectPath, '.identro', 'dimensions');
        console.log(chalk_1.default.gray(`Dimension files location: ${dimensionsDir}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error listing dimensions:'), error.message);
        process.exit(1);
    }
}
/**
 * Show details of a specific dimension
 */
async function showDimension(projectPath, dimensionName) {
    console.log(chalk_1.default.bold.cyan(`\n📄 Dimension: ${dimensionName}\n`));
    try {
        // Load config to get enabled status
        const { loadConfig } = await Promise.resolve().then(() => __importStar(require('../utils/config')));
        const configPath = path.join(projectPath, '.identro', 'eval.config.yml');
        const config = await loadConfig(configPath);
        const enabledDimensions = config.dimensions?.enabled || [];
        const dimensionLoader = new eval_core_1.DimensionFileLoader({
            projectPath,
            createDefaults: true
        });
        const dimension = await dimensionLoader.loadDimension(dimensionName);
        if (!dimension) {
            console.log(chalk_1.default.red(`❌ Dimension '${dimensionName}' not found.`));
            console.log(chalk_1.default.gray('Available dimensions:'));
            const allDimensions = await dimensionLoader.loadAllDimensions();
            for (const name of allDimensions.keys()) {
                console.log(chalk_1.default.gray(`  • ${name}`));
            }
            return;
        }
        // Display dimension details
        const isEnabled = enabledDimensions.includes(dimensionName);
        console.log(`${chalk_1.default.bold('Name:')} ${dimension.name}`);
        console.log(`${chalk_1.default.bold('Description:')} ${dimension.description}`);
        console.log(`${chalk_1.default.bold('Short Description:')} ${dimension.short_description}`);
        console.log(`${chalk_1.default.bold('Enabled:')} ${isEnabled ? chalk_1.default.green('Yes') : chalk_1.default.red('No')}`);
        console.log(`${chalk_1.default.bold('Priority:')} ${dimension.priority}`);
        console.log();
        // Configuration
        if (dimension.configuration) {
            console.log(chalk_1.default.bold.yellow('⚙️  Configuration:'));
            console.log(`  Test count: ${dimension.configuration.test_count || 3}`);
            console.log(`  Runs per input: ${dimension.configuration.runs_per_input || 3}`);
            console.log(`  Similarity threshold: ${dimension.configuration.similarity_threshold || 0.8}`);
            console.log(`  Timeout: ${dimension.configuration.timeout_ms || 60000}ms`);
            console.log();
        }
        // Prompts
        console.log(chalk_1.default.bold.yellow('📝 Prompts:'));
        console.log(`  Agent requirements (${dimension.prompts.agent_requirements.length} chars):`);
        console.log(chalk_1.default.gray(`    ${dimension.prompts.agent_requirements.substring(0, 100)}...`));
        if (dimension.prompts.team_requirements) {
            console.log(`  Team requirements (${dimension.prompts.team_requirements.length} chars):`);
            console.log(chalk_1.default.gray(`    ${dimension.prompts.team_requirements.substring(0, 100)}...`));
        }
        if (dimension.prompts.evaluation_criteria && dimension.prompts.evaluation_criteria.length > 0) {
            console.log(`  Evaluation criteria (${dimension.prompts.evaluation_criteria.length} items):`);
            dimension.prompts.evaluation_criteria.slice(0, 3).forEach(criteria => {
                console.log(chalk_1.default.gray(`    • ${criteria.substring(0, 80)}${criteria.length > 80 ? '...' : ''}`));
            });
            if (dimension.prompts.evaluation_criteria.length > 3) {
                console.log(chalk_1.default.gray(`    ... and ${dimension.prompts.evaluation_criteria.length - 3} more`));
            }
        }
        console.log();
        // Metadata
        console.log(chalk_1.default.bold.yellow('📊 Metadata:'));
        console.log(`  Version: ${dimension.metadata.version}`);
        console.log(`  Complexity: ${dimension.metadata.complexity}`);
        console.log(`  Author: ${dimension.metadata.author || 'Unknown'}`);
        if (dimension.metadata.tags && dimension.metadata.tags.length > 0) {
            console.log(`  Tags: ${dimension.metadata.tags.join(', ')}`);
        }
        console.log();
        // Variables
        if (dimension.variables && Object.keys(dimension.variables).length > 0) {
            console.log(chalk_1.default.bold.yellow('🔧 Variables:'));
            for (const [key, value] of Object.entries(dimension.variables)) {
                console.log(`  ${key}: ${JSON.stringify(value)}`);
            }
            console.log();
        }
        // File location
        const filePath = dimensionLoader.getDimensionFilePath(dimensionName);
        console.log(chalk_1.default.gray(`File location: ${filePath}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error showing dimension:'), error.message);
        process.exit(1);
    }
}
/**
 * Create a new dimension
 */
async function createDimension(projectPath, name, options) {
    console.log(chalk_1.default.bold.cyan(`\n✨ Creating Dimension: ${name}\n`));
    try {
        const dimensionLoader = new eval_core_1.DimensionFileLoader({
            projectPath,
            createDefaults: true
        });
        // Check if dimension already exists
        if (await dimensionLoader.dimensionExists(name)) {
            console.log(chalk_1.default.red(`❌ Dimension '${name}' already exists.`));
            const { overwrite } = await inquirer_1.default.prompt([{
                    type: 'confirm',
                    name: 'overwrite',
                    message: 'Overwrite existing dimension?',
                    default: false
                }]);
            if (!overwrite) {
                console.log(chalk_1.default.yellow('Dimension creation cancelled.'));
                return;
            }
        }
        let dimension;
        if (options.template) {
            // Use template
            const templateDimension = await dimensionLoader.loadDimension(options.template);
            if (!templateDimension) {
                console.log(chalk_1.default.red(`❌ Template dimension '${options.template}' not found.`));
                return;
            }
            dimension = {
                ...templateDimension,
                name,
                description: options.description || `${name} testing dimension based on ${options.template}`,
                short_description: options.short || `Test ${name} aspects`,
                metadata: {
                    ...templateDimension.metadata,
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
                    message: 'Dimension description:',
                    default: options.description || `${name} testing dimension`,
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
                    message: 'Dimension complexity:',
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
                    message: 'Dimension priority (1-10):',
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
            dimension = (0, eval_core_2.createDefaultDimensionDefinition)(name, answers.description, answers.shortDescription);
            dimension.metadata.complexity = answers.complexity;
            dimension.priority = answers.priority;
            if (dimension.configuration) {
                dimension.configuration.test_count = answers.testCount;
            }
            dimension.metadata.tags = answers.tags;
            dimension.metadata.author = 'User';
        }
        // Save the dimension
        await dimensionLoader.saveDimension(name, dimension);
        console.log(chalk_1.default.green(`\n✅ Dimension '${name}' created successfully!`));
        console.log(chalk_1.default.gray(`File: ${dimensionLoader.getDimensionFilePath(name)}`));
        const { editNow } = await inquirer_1.default.prompt([{
                type: 'confirm',
                name: 'editNow',
                message: 'Open dimension file for editing?',
                default: true
            }]);
        if (editNow) {
            await editDimension(projectPath, name);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error creating dimension:'), error.message);
        process.exit(1);
    }
}
/**
 * Edit a dimension file
 */
async function editDimension(projectPath, dimensionName) {
    try {
        const dimensionLoader = new eval_core_1.DimensionFileLoader({
            projectPath,
            createDefaults: true
        });
        const filePath = dimensionLoader.getDimensionFilePath(dimensionName);
        if (!(await fs.pathExists(filePath))) {
            console.log(chalk_1.default.red(`❌ Dimension '${dimensionName}' not found.`));
            const { create } = await inquirer_1.default.prompt([{
                    type: 'confirm',
                    name: 'create',
                    message: 'Create new dimension?',
                    default: true
                }]);
            if (create) {
                await createDimension(projectPath, dimensionName, {});
                return;
            }
            else {
                return;
            }
        }
        console.log(chalk_1.default.cyan(`\n📝 Opening dimension file: ${dimensionName}`));
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
                console.log(chalk_1.default.green('\n✅ Dimension file editing completed.'));
            }
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error editing dimension:'), error.message);
        process.exit(1);
    }
}
/**
 * Validate all dimension files
 */
async function validateDimensions(projectPath) {
    console.log(chalk_1.default.bold.cyan('\n🔍 Validating Dimension Files\n'));
    const spinner = animations_1.animations.loading('Validating dimensions...', 'dots12');
    try {
        const dimensionLoader = new eval_core_1.DimensionFileLoader({
            projectPath,
            createDefaults: false // Don't create defaults during validation
        });
        const dimensionsDir = path.join(projectPath, '.identro', 'dimensions');
        if (!(await fs.pathExists(dimensionsDir))) {
            spinner.stop();
            console.log(chalk_1.default.yellow('⚠ No dimensions directory found.'));
            console.log(chalk_1.default.gray(`Expected: ${dimensionsDir}`));
            return;
        }
        const files = await fs.readdir(dimensionsDir);
        const ymlFiles = files.filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
        if (ymlFiles.length === 0) {
            spinner.stop();
            console.log(chalk_1.default.yellow('⚠ No dimension files found.'));
            return;
        }
        spinner.update(`Validating ${ymlFiles.length} dimension files...`);
        let validCount = 0;
        let invalidCount = 0;
        const errors = [];
        for (const file of ymlFiles) {
            const dimensionName = path.basename(file, path.extname(file));
            try {
                const dimension = await dimensionLoader.loadDimension(dimensionName);
                if (dimension) {
                    validCount++;
                    spinner.update(`✅ ${dimensionName} - valid`);
                }
                else {
                    invalidCount++;
                    errors.push({ file: dimensionName, error: 'Failed to load dimension' });
                }
            }
            catch (error) {
                invalidCount++;
                errors.push({ file: dimensionName, error: error.message });
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
            console.log(chalk_1.default.green(`${validCount} dimension(s) are valid and ready to use.`));
        }
    }
    catch (error) {
        spinner.stop();
        console.error(chalk_1.default.red('❌ Error validating dimensions:'), error.message);
        process.exit(1);
    }
}
/**
 * Reset dimensions to defaults
 */
async function resetDimensions(projectPath, force = false) {
    console.log(chalk_1.default.bold.cyan('\n🔄 Reset Dimensions to Defaults\n'));
    if (!force) {
        console.log(chalk_1.default.yellow('⚠ This will overwrite all existing dimension files with defaults.'));
        const { confirm } = await inquirer_1.default.prompt([{
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to reset all dimensions?',
                default: false
            }]);
        if (!confirm) {
            console.log(chalk_1.default.yellow('Reset cancelled.'));
            return;
        }
    }
    const spinner = animations_1.animations.loading('Resetting dimensions...', 'dots12');
    try {
        const dimensionsDir = path.join(projectPath, '.identro', 'dimensions');
        // Remove existing dimensions directory
        if (await fs.pathExists(dimensionsDir)) {
            await fs.remove(dimensionsDir);
            spinner.update('Removed existing dimensions...');
        }
        // Create new dimension loader to generate defaults
        const dimensionLoader = new eval_core_1.DimensionFileLoader({
            projectPath,
            createDefaults: true
        });
        // Load all dimensions (this will create defaults)
        const dimensions = await dimensionLoader.loadAllDimensions();
        spinner.stop();
        console.log(chalk_1.default.green(`\n✅ Reset complete! Created ${dimensions.size} default dimensions:`));
        for (const name of dimensions.keys()) {
            console.log(chalk_1.default.cyan(`  • ${name}`));
        }
        console.log(chalk_1.default.gray(`\nDimension files location: ${dimensionsDir}`));
    }
    catch (error) {
        spinner.stop();
        console.error(chalk_1.default.red('❌ Error resetting dimensions:'), error.message);
        process.exit(1);
    }
}
//# sourceMappingURL=dimensions.js.map