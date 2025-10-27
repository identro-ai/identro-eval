/**
 * Configuration file parser for extracting prompts
 *
 * Parses YAML, JSON, and TOML configuration files to extract
 * prompts, templates, and related configuration.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as toml from '@iarna/toml';
/**
 * Base configuration parser
 */
export class ConfigParser {
    filePath;
    constructor(filePath) {
        this.filePath = filePath;
    }
    /**
     * Extract prompts from parsed data
     */
    extractPrompts(data, currentPath = []) {
        const prompts = [];
        if (!data || typeof data !== 'object') {
            return prompts;
        }
        // Check if current object is a prompt
        if (this.isPromptObject(data)) {
            const prompt = this.extractPromptFromObject(data, currentPath);
            if (prompt) {
                prompts.push(prompt);
            }
        }
        // Recursively search for prompts
        for (const [key, value] of Object.entries(data)) {
            const newPath = [...currentPath, key];
            // Check for prompt indicators in key names
            if (this.isPromptKey(key) && typeof value === 'string') {
                prompts.push({
                    name: key,
                    content: value,
                    variables: this.extractVariables(value),
                    source: this.filePath,
                    path: newPath,
                });
            }
            else if (typeof value === 'object' && value !== null) {
                // Recursively extract from nested objects
                prompts.push(...this.extractPrompts(value, newPath));
            }
        }
        return prompts;
    }
    /**
     * Check if a key name indicates a prompt
     */
    isPromptKey(key) {
        const indicators = [
            'prompt',
            'template',
            'instruction',
            'message',
            'system',
            'human',
            'assistant',
            'description',
            'goal',
            'backstory',
            'role',
        ];
        const keyLower = key.toLowerCase();
        return indicators.some(indicator => keyLower.includes(indicator));
    }
    /**
     * Check if an object represents a prompt
     */
    isPromptObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }
        // Check for common prompt object dimensions
        const hasTemplate = 'template' in obj || 'prompt' in obj;
        const hasContent = 'content' in obj || 'text' in obj || 'message' in obj;
        const hasVariables = 'variables' in obj || 'input_variables' in obj || 'params' in obj;
        return hasTemplate || hasContent || (hasVariables && typeof obj === 'object');
    }
    /**
     * Extract prompt from an object
     */
    extractPromptFromObject(obj, currentPath) {
        let content = '';
        let name = currentPath[currentPath.length - 1] || 'unnamed';
        let variables = [];
        // Extract content
        if (obj.template)
            content = obj.template;
        else if (obj.prompt)
            content = obj.prompt;
        else if (obj.content)
            content = obj.content;
        else if (obj.text)
            content = obj.text;
        else if (obj.message)
            content = obj.message;
        else if (obj.instruction)
            content = obj.instruction;
        // Extract name
        if (obj.name)
            name = obj.name;
        else if (obj.id)
            name = obj.id;
        // Extract variables
        if (obj.variables) {
            variables = Array.isArray(obj.variables) ? obj.variables : Object.keys(obj.variables);
        }
        else if (obj.input_variables) {
            variables = Array.isArray(obj.input_variables) ? obj.input_variables : Object.keys(obj.input_variables);
        }
        else if (obj.params) {
            variables = Array.isArray(obj.params) ? obj.params : Object.keys(obj.params);
        }
        else if (content) {
            variables = this.extractVariables(content);
        }
        if (!content) {
            return null;
        }
        return {
            name,
            content,
            variables,
            metadata: obj,
            source: this.filePath,
            path: currentPath,
        };
    }
    /**
     * Extract variables from a template string
     */
    extractVariables(template) {
        const variables = [];
        // Match {variable} style
        const curlyMatches = template.matchAll(/\{(\w+)\}/g);
        for (const match of curlyMatches) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        // Match ${variable} style
        const dollarMatches = template.matchAll(/\$\{(\w+)\}/g);
        for (const match of dollarMatches) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        // Match {{variable}} style (Handlebars/Mustache)
        const doubleMatches = template.matchAll(/\{\{(\w+)\}\}/g);
        for (const match of doubleMatches) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        // Match %{variable} style (some template engines)
        const percentMatches = template.matchAll(/%\{(\w+)\}/g);
        for (const match of percentMatches) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        return variables;
    }
    /**
     * Extract all variables from config
     */
    extractAllVariables(data, prefix = '') {
        const variables = {};
        if (!data || typeof data !== 'object') {
            return variables;
        }
        for (const [key, value] of Object.entries(data)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Recursively extract from nested objects
                Object.assign(variables, this.extractAllVariables(value, fullKey));
            }
            else {
                variables[fullKey] = value;
            }
        }
        return variables;
    }
    /**
     * Resolve environment variables in content
     */
    async resolveEnvVars(content) {
        // Match ${ENV_VAR} or $ENV_VAR dimensions
        const envDimension = /\$\{?([A-Z_][A-Z0-9_]*)\}?/g;
        return content.replace(envDimension, (match, varName) => {
            const value = process.env[varName];
            if (value !== undefined) {
                return value;
            }
            // Try to read from .env file if exists
            // This is a simplified approach - in production, use dotenv
            return match; // Return original if not found
        });
    }
    /**
     * Convert to ExtractedPrompts format
     */
    toExtractedPrompts(parsed) {
        const extracted = {
            templates: [],
            examples: [],
            descriptions: [],
            tools: [],
        };
        for (const prompt of parsed.prompts) {
            extracted.templates.push({
                name: prompt.name,
                content: prompt.content,
                variables: prompt.variables,
                type: this.inferPromptType(prompt),
                location: this.filePath,
                lineNumber: 0, // Config files don't have meaningful line numbers for nested data
            });
        }
        // Extract descriptions from metadata
        if (parsed.metadata.description) {
            extracted.descriptions.push(parsed.metadata.description);
        }
        // Look for examples in the config
        if (parsed.metadata.examples && Array.isArray(parsed.metadata.examples)) {
            for (const example of parsed.metadata.examples) {
                if (example.input && example.output) {
                    extracted.examples.push({
                        input: example.input,
                        output: example.output,
                        description: example.description,
                    });
                }
            }
        }
        // Look for tools in the config
        if (parsed.metadata.tools && Array.isArray(parsed.metadata.tools)) {
            for (const tool of parsed.metadata.tools) {
                extracted.tools.push({
                    name: tool.name || 'unnamed',
                    description: tool.description || '',
                    parameters: tool.parameters || {},
                });
            }
        }
        return extracted;
    }
    /**
     * Infer prompt type from content and metadata
     */
    inferPromptType(prompt) {
        const pathStr = prompt.path.join('.').toLowerCase();
        if (pathStr.includes('system'))
            return 'system';
        if (pathStr.includes('human') || pathStr.includes('user'))
            return 'human';
        if (pathStr.includes('assistant') || pathStr.includes('ai'))
            return 'assistant';
        return 'prompt';
    }
}
/**
 * YAML configuration parser
 */
export class YAMLParser extends ConfigParser {
    async parse(content) {
        const parsed = {
            prompts: [],
            variables: {},
            metadata: {},
            errors: [],
        };
        try {
            // Resolve environment variables
            const resolved = await this.resolveEnvVars(content);
            // Parse YAML
            const data = yaml.load(resolved);
            if (!data || typeof data !== 'object') {
                parsed.errors.push('Invalid YAML structure');
                return parsed;
            }
            // Extract prompts
            parsed.prompts = this.extractPrompts(data);
            // Extract variables
            parsed.variables = this.extractAllVariables(data);
            // Store metadata
            parsed.metadata = data;
        }
        catch (error) {
            parsed.errors.push(`YAML parsing error: ${error}`);
        }
        return parsed;
    }
}
/**
 * JSON configuration parser
 */
export class JSONParser extends ConfigParser {
    async parse(content) {
        const parsed = {
            prompts: [],
            variables: {},
            metadata: {},
            errors: [],
        };
        try {
            // Resolve environment variables
            const resolved = await this.resolveEnvVars(content);
            // Parse JSON
            const data = JSON.parse(resolved);
            if (!data || typeof data !== 'object') {
                parsed.errors.push('Invalid JSON structure');
                return parsed;
            }
            // Extract prompts
            parsed.prompts = this.extractPrompts(data);
            // Extract variables
            parsed.variables = this.extractAllVariables(data);
            // Store metadata
            parsed.metadata = data;
        }
        catch (error) {
            parsed.errors.push(`JSON parsing error: ${error}`);
        }
        return parsed;
    }
}
/**
 * TOML configuration parser
 */
export class TOMLParser extends ConfigParser {
    async parse(content) {
        const parsed = {
            prompts: [],
            variables: {},
            metadata: {},
            errors: [],
        };
        try {
            // Resolve environment variables
            const resolved = await this.resolveEnvVars(content);
            // Parse TOML
            const data = toml.parse(resolved);
            if (!data || typeof data !== 'object') {
                parsed.errors.push('Invalid TOML structure');
                return parsed;
            }
            // Extract prompts
            parsed.prompts = this.extractPrompts(data);
            // Extract variables
            parsed.variables = this.extractAllVariables(data);
            // Store metadata
            parsed.metadata = data;
        }
        catch (error) {
            parsed.errors.push(`TOML parsing error: ${error}`);
        }
        return parsed;
    }
}
/**
 * Factory for creating appropriate parser
 */
export class ConfigParserFactory {
    static create(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.yaml':
            case '.yml':
                return new YAMLParser(filePath);
            case '.json':
                return new JSONParser(filePath);
            case '.toml':
                return new TOMLParser(filePath);
            default:
                return null;
        }
    }
    /**
     * Parse any supported config file
     */
    static async parseFile(filePath) {
        const parser = this.create(filePath);
        if (!parser) {
            console.warn(`Unsupported config file type: ${filePath}`);
            return null;
        }
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await parser.parse(content);
            if (parsed.errors.length > 0) {
                console.warn(`Errors parsing ${filePath}:`, parsed.errors);
            }
            return parser.toExtractedPrompts(parsed);
        }
        catch (error) {
            console.error(`Failed to parse config file ${filePath}:`, error);
            return null;
        }
    }
}
//# sourceMappingURL=config-parser.js.map