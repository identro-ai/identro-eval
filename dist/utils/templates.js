"use strict";
/**
 * Template utilities for copying and processing template files
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
exports.getTemplatePath = getTemplatePath;
exports.copyTemplate = copyTemplate;
exports.copyTemplates = copyTemplates;
exports.initializeIdentroDirectory = initializeIdentroDirectory;
exports.updateGitignore = updateGitignore;
exports.listTemplates = listTemplates;
exports.templateExists = templateExists;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Get the path to a template file
 */
function getTemplatePath(templateName) {
    // Handle both development (src) and production (dist) paths
    const possiblePaths = [
        path.join(__dirname, '../../templates', templateName), // From dist/utils
        path.join(__dirname, '../../../templates', templateName), // From dist/src/utils
        path.join(__dirname, '../../../../templates', templateName), // Alternative path
    ];
    // Try each path and return the first one that exists
    for (const templatePath of possiblePaths) {
        if (require('fs').existsSync(templatePath)) {
            return templatePath;
        }
    }
    // Fallback: construct absolute path from package root
    const packageRoot = path.resolve(__dirname, '../../../');
    return path.join(packageRoot, 'templates', templateName);
}
/**
 * Copy a template file to a destination, optionally processing it
 */
async function copyTemplate(templateName, destination, variables) {
    const templatePath = getTemplatePath(templateName);
    if (!await fs.pathExists(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
    }
    // Ensure destination directory exists
    await fs.ensureDir(path.dirname(destination));
    // Read template content
    let content = await fs.readFile(templatePath, 'utf-8');
    // Process variables if provided
    if (variables) {
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            content = content.replace(new RegExp(placeholder, 'g'), value);
        }
    }
    // Remove .template extension from filename if copying to same name
    if (templateName.endsWith('.template') && path.basename(destination) === templateName) {
        destination = destination.replace('.template', '');
    }
    // Write processed content
    await fs.writeFile(destination, content, 'utf-8');
}
/**
 * Copy multiple templates to a directory
 */
async function copyTemplates(templates, baseDestination) {
    for (const { template, destination, variables } of templates) {
        const fullDestination = path.join(baseDestination, destination);
        await copyTemplate(template, fullDestination, variables);
    }
}
/**
 * Initialize .identro directory with templates
 */
async function initializeIdentroDirectory(projectPath, config) {
    const identroPath = path.join(projectPath, '.identro');
    // Ensure .identro directory exists
    await fs.ensureDir(identroPath);
    // Prepare template variables
    const variables = {
        framework: config?.framework || 'auto-detect',
        llmProvider: config?.llmProvider || 'openai',
        llmModel: config?.llmModel || 'gpt-4-turbo-preview',
        outputFormat: config?.outputFormat || 'json',
        outputDirectory: config?.outputDirectory || './identro-reports',
    };
    // Copy configuration template
    await copyTemplate('eval.config.yml.template', path.join(identroPath, 'eval.config.yml'), variables);
    console.log(chalk_1.default.green(`✅ Created ${path.relative(projectPath, path.join(identroPath, 'eval.config.yml'))}`));
}
/**
 * Update project .gitignore with Identro entries
 */
async function updateGitignore(projectPath) {
    const gitignorePath = path.join(projectPath, '.gitignore');
    const templatePath = getTemplatePath('.gitignore.template');
    if (!await fs.pathExists(templatePath)) {
        console.warn(chalk_1.default.yellow('Warning: .gitignore template not found'));
        return;
    }
    // Read template content
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    let existingContent = '';
    if (await fs.pathExists(gitignorePath)) {
        existingContent = await fs.readFile(gitignorePath, 'utf-8');
    }
    // Check if Identro entries already exist
    if (existingContent.includes('.identro/')) {
        console.log(chalk_1.default.gray('✓ .gitignore already contains Identro entries'));
        return;
    }
    // Append template content
    const newContent = existingContent + '\n' + templateContent;
    await fs.writeFile(gitignorePath, newContent, 'utf-8');
    console.log(chalk_1.default.green('✅ Updated .gitignore with Identro entries'));
}
/**
 * List available templates
 */
async function listTemplates() {
    const templatesDir = path.join(__dirname, '../../templates');
    if (!await fs.pathExists(templatesDir)) {
        return [];
    }
    const files = await fs.readdir(templatesDir);
    return files.filter(file => file.endsWith('.template'));
}
/**
 * Check if a template exists
 */
async function templateExists(templateName) {
    const templatePath = getTemplatePath(templateName);
    return fs.pathExists(templatePath);
}
//# sourceMappingURL=templates.js.map