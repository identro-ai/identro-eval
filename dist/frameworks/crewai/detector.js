"use strict";
/**
 * CrewAI framework detector
 *
 * Detects the presence of CrewAI in a project and validates the setup.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.detect = detect;
exports.detectWithDetails = detectWithDetails;
exports.validate = validate;
exports.getProjectMetadata = getProjectMetadata;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const glob = require('glob');
const patterns_1 = require("./utils/patterns");
/**
 * Detect if CrewAI is present in the project
 */
async function detect(projectPath) {
    const result = await detectWithDetails(projectPath);
    return result.detected;
}
/**
 * Detect CrewAI with detailed information
 */
async function detectWithDetails(projectPath) {
    const indicators = [];
    let confidence = 0;
    let version;
    let language = 'unknown';
    try {
        // Check for Python requirements files
        const requirementFiles = [
            'requirements.txt',
            'requirements.in',
            'requirements-dev.txt',
            'Pipfile',
            'pyproject.toml',
            'setup.py',
            'setup.cfg',
        ];
        for (const reqFile of requirementFiles) {
            const reqPath = path.join(projectPath, reqFile);
            try {
                const content = await fs.readFile(reqPath, 'utf-8');
                // Check for CrewAI in dependencies
                if (content.includes('crewai')) {
                    indicators.push(`CrewAI found in ${reqFile}`);
                    confidence += 30;
                    language = 'python';
                    // Try to extract version
                    const versionMatch = content.match(/crewai[=~<>]+([0-9.]+)/);
                    if (versionMatch) {
                        version = versionMatch[1];
                    }
                }
                // Check for related dependencies
                if (content.includes('crewai-tools')) {
                    indicators.push(`CrewAI tools found in ${reqFile}`);
                    confidence += 10;
                }
            }
            catch {
                // File doesn't exist, continue
            }
        }
        // Check for CrewAI configuration files
        for (const configFile of patterns_1.CONFIG_FILE_PATTERNS) {
            const configPath = path.join(projectPath, configFile);
            try {
                await fs.access(configPath);
                indicators.push(`Configuration file found: ${configFile}`);
                confidence += 5;
            }
            catch {
                // File doesn't exist, continue
            }
        }
        // Scan Python files for CrewAI imports
        const pythonFiles = glob.sync('**/*.py', {
            cwd: projectPath,
            ignore: ['**/node_modules/**', '**/.venv/**', '**/venv/**'],
        });
        let filesWithImports = 0;
        const maxFilesToCheck = 50; // Limit for performance
        for (const file of pythonFiles.slice(0, maxFilesToCheck)) {
            if ((0, patterns_1.shouldExcludePath)(file))
                continue;
            try {
                const content = await fs.readFile(path.join(projectPath, file), 'utf-8');
                if ((0, patterns_1.hasCrewAIImports)(content)) {
                    filesWithImports++;
                    if (filesWithImports === 1) {
                        indicators.push(`CrewAI imports found in Python files`);
                        confidence += 20;
                        language = 'python';
                    }
                }
            }
            catch {
                // Error reading file, continue
            }
        }
        if (filesWithImports > 5) {
            indicators.push(`Multiple files with CrewAI imports (${filesWithImports})`);
            confidence += 10;
        }
        // Check for crew.py or agents.py files
        const crewFiles = ['crew.py', 'agents.py', 'tasks.py', 'main.py', 'app.py'];
        for (const crewFile of crewFiles) {
            const files = glob.sync(`**/${crewFile}`, {
                cwd: projectPath,
                ignore: ['**/node_modules/**', '**/.venv/**', '**/venv/**'],
            });
            if (files.length > 0) {
                indicators.push(`CrewAI-related file found: ${crewFile}`);
                confidence += 5;
            }
        }
        // Normalize confidence to 0-100
        confidence = Math.min(100, confidence);
        return {
            detected: confidence >= 30,
            confidence,
            indicators,
            version,
            language,
        };
    }
    catch (error) {
        console.error('Error detecting CrewAI:', error);
        return {
            detected: false,
            confidence: 0,
            indicators: [],
            language: 'unknown',
        };
    }
}
/**
 * Validate CrewAI setup
 */
async function validate(projectPath) {
    const errors = [];
    const warnings = [];
    let pythonVersion;
    let crewaiVersion;
    try {
        // Check if Python is available
        try {
            const { execa } = await Promise.resolve().then(() => __importStar(require('execa')));
            const pythonResult = await execa('python', ['--version'], { cwd: projectPath });
            pythonVersion = pythonResult.stdout.replace('Python ', '');
            // Check Python version (CrewAI requires Python 3.8+)
            if (pythonVersion) {
                const [major, minor] = pythonVersion.split('.').map(Number);
                if (major < 3 || (major === 3 && minor < 8)) {
                    errors.push(`Python version ${pythonVersion} is not supported. CrewAI requires Python 3.8+`);
                }
            }
        }
        catch {
            errors.push('Python is not installed or not in PATH');
        }
        // Check if CrewAI is installed
        try {
            const { execa } = await Promise.resolve().then(() => __importStar(require('execa')));
            const pipResult = await execa('pip', ['show', 'crewai'], { cwd: projectPath });
            const versionMatch = pipResult.stdout.match(/Version:\s+([0-9.]+)/);
            if (versionMatch) {
                crewaiVersion = versionMatch[1];
            }
        }
        catch {
            warnings.push('CrewAI package not found in pip. Make sure it is installed.');
        }
        // Check for required environment variables
        const envPath = path.join(projectPath, '.env');
        try {
            const envContent = await fs.readFile(envPath, 'utf-8');
            // Check for API keys
            if (!envContent.includes('OPENAI_API_KEY') && !envContent.includes('ANTHROPIC_API_KEY')) {
                warnings.push('No LLM API key found in .env file. Make sure to configure your LLM provider.');
            }
        }
        catch {
            warnings.push('No .env file found. Environment variables may need to be configured.');
        }
        // Check for at least one agent file
        const pythonFiles = glob.sync('**/*.py', {
            cwd: projectPath,
            ignore: ['**/node_modules/**', '**/.venv/**', '**/venv/**'],
        });
        let hasAgentFile = false;
        for (const file of pythonFiles) {
            if ((0, patterns_1.shouldExcludePath)(file))
                continue;
            try {
                const content = await fs.readFile(path.join(projectPath, file), 'utf-8');
                if (content.includes('Agent(') || content.includes('from crewai import Agent')) {
                    hasAgentFile = true;
                    break;
                }
            }
            catch {
                // Error reading file, continue
            }
        }
        if (!hasAgentFile) {
            warnings.push('No agent definitions found in the project');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            pythonVersion,
            crewaiVersion,
        };
    }
    catch (error) {
        console.error('Error validating CrewAI setup:', error);
        return {
            valid: false,
            errors: ['Failed to validate CrewAI setup: ' + error.message],
            warnings,
        };
    }
}
/**
 * Get CrewAI project metadata
 */
async function getProjectMetadata(projectPath) {
    const metadata = {};
    try {
        // Try to read from pyproject.toml
        const pyprojectPath = path.join(projectPath, 'pyproject.toml');
        try {
            const content = await fs.readFile(pyprojectPath, 'utf-8');
            // Basic TOML parsing (simplified)
            const nameMatch = content.match(/name\s*=\s*["']([^"']+)["']/);
            if (nameMatch)
                metadata.name = nameMatch[1];
            const descMatch = content.match(/description\s*=\s*["']([^"']+)["']/);
            if (descMatch)
                metadata.description = descMatch[1];
            const authorMatch = content.match(/authors\s*=\s*\[["']([^"']+)["']/);
            if (authorMatch)
                metadata.author = authorMatch[1];
        }
        catch {
            // File doesn't exist
        }
        // Try to read from setup.py
        if (!metadata.name) {
            const setupPath = path.join(projectPath, 'setup.py');
            try {
                const content = await fs.readFile(setupPath, 'utf-8');
                const nameMatch = content.match(/name\s*=\s*["']([^"']+)["']/);
                if (nameMatch)
                    metadata.name = nameMatch[1];
                const descMatch = content.match(/description\s*=\s*["']([^"']+)["']/);
                if (descMatch)
                    metadata.description = descMatch[1];
                const authorMatch = content.match(/author\s*=\s*["']([^"']+)["']/);
                if (authorMatch)
                    metadata.author = authorMatch[1];
            }
            catch {
                // File doesn't exist
            }
        }
        // Get dependencies from requirements.txt
        const reqPath = path.join(projectPath, 'requirements.txt');
        try {
            const content = await fs.readFile(reqPath, 'utf-8');
            metadata.dependencies = content
                .split('\n')
                .filter(line => line.trim() && !line.startsWith('#'))
                .map(line => line.split(/[<>=~]/)[0].trim());
        }
        catch {
            // File doesn't exist
        }
        // Default name from directory
        if (!metadata.name) {
            metadata.name = path.basename(projectPath);
        }
        return metadata;
    }
    catch (error) {
        console.error('Error getting project metadata:', error);
        return metadata;
    }
}
//# sourceMappingURL=detector.js.map