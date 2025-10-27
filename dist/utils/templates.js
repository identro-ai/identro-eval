/**
 * Template utilities for copying and processing template files
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
/**
 * Get the path to a template file
 */
export function getTemplatePath(templateName) {
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
export async function copyTemplate(templateName, destination, variables) {
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
export async function copyTemplates(templates, baseDestination) {
    for (const { template, destination, variables } of templates) {
        const fullDestination = path.join(baseDestination, destination);
        await copyTemplate(template, fullDestination, variables);
    }
}
/**
 * Initialize .identro directory with templates
 */
export async function initializeIdentroDirectory(projectPath, config) {
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
    console.log(chalk.green(`✅ Created ${path.relative(projectPath, path.join(identroPath, 'eval.config.yml'))}`));
}
/**
 * Update project .gitignore with Identro entries
 */
export async function updateGitignore(projectPath) {
    const gitignorePath = path.join(projectPath, '.gitignore');
    const templatePath = getTemplatePath('.gitignore.template');
    if (!await fs.pathExists(templatePath)) {
        console.warn(chalk.yellow('Warning: .gitignore template not found'));
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
        console.log(chalk.gray('✓ .gitignore already contains Identro entries'));
        return;
    }
    // Append template content
    const newContent = existingContent + '\n' + templateContent;
    await fs.writeFile(gitignorePath, newContent, 'utf-8');
    console.log(chalk.green('✅ Updated .gitignore with Identro entries'));
}
/**
 * List available templates
 */
export async function listTemplates() {
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
export async function templateExists(templateName) {
    const templatePath = getTemplatePath(templateName);
    return fs.pathExists(templatePath);
}
//# sourceMappingURL=templates.js.map