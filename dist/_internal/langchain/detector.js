"use strict";
/**
 * LangChain framework detection module
 *
 * This module is responsible for detecting whether a project uses LangChain.
 * It scans for:
 * - Package dependencies (package.json, requirements.txt, etc.)
 * - Import statements in source files
 * - LangChain-specific patterns in code
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
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const glob = require('glob').glob;
const patterns_1 = require("./utils/patterns");
/**
 * Detects if LangChain is used in a Python project
 *
 * How it works:
 * 1. Checks for LangChain in requirements files
 * 2. Scans Python files for LangChain imports
 * 3. Validates that imports are not just in comments
 *
 * @param projectPath - Root directory of the project
 * @returns Detection result with evidence
 */
async function detectPythonLangChain(projectPath) {
    const evidence = {
        packageFiles: [],
        importFiles: [],
        patterns: [],
    };
    let confidence = 0;
    // Check requirements files
    const requirementFiles = [
        'requirements.txt',
        'requirements-dev.txt',
        'requirements.in',
        'pyproject.toml',
        'setup.py',
        'setup.cfg',
        'Pipfile',
        'poetry.lock',
    ];
    for (const reqFile of requirementFiles) {
        const filePath = path.join(projectPath, reqFile);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            if (content.includes('langchain')) {
                evidence.packageFiles.push(reqFile);
                confidence += 30;
                // Check for specific LangChain packages
                if (content.includes('langchain-community'))
                    confidence += 10;
                if (content.includes('langchain-openai'))
                    confidence += 10;
                if (content.includes('langchain-anthropic'))
                    confidence += 10;
            }
        }
        catch {
            // File doesn't exist, continue
        }
    }
    // Scan Python files for imports
    const pythonFiles = await glob('**/*.py', {
        cwd: projectPath,
        ignore: ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/env/**'],
    });
    for (const file of pythonFiles.slice(0, 100)) { // Limit to first 100 files for performance
        if ((0, patterns_1.shouldExcludePath)(file))
            continue;
        try {
            const filePath = path.join(projectPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            // Check for import patterns
            for (const pattern of patterns_1.PYTHON_IMPORT_PATTERNS) {
                if (pattern.pattern.test(content)) {
                    evidence.importFiles.push(file);
                    evidence.patterns.push(pattern.description);
                    confidence = Math.min(100, confidence + 20);
                    break; // One import per file is enough evidence
                }
            }
        }
        catch {
            // Error reading file, continue
        }
        // Stop if we have high confidence
        if (confidence >= 100)
            break;
    }
    return {
        detected: confidence >= 50,
        languages: confidence >= 50 ? ['python'] : [],
        confidence: Math.min(100, confidence),
        evidence,
    };
}
/**
 * Detects if LangChain is used in a TypeScript/JavaScript project
 *
 * How it works:
 * 1. Checks package.json for LangChain dependencies
 * 2. Scans TS/JS files for LangChain imports
 * 3. Identifies specific LangChain packages used
 *
 * @param projectPath - Root directory of the project
 * @returns Detection result with evidence
 */
async function detectTypeScriptLangChain(projectPath) {
    const evidence = {
        packageFiles: [],
        importFiles: [],
        patterns: [],
    };
    let confidence = 0;
    const languages = [];
    // Check package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    try {
        const content = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(content);
        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };
        // Check for LangChain packages
        for (const dep of Object.keys(allDeps)) {
            if (dep.includes('langchain') || dep.startsWith('@langchain/')) {
                evidence.packageFiles.push('package.json');
                confidence += 40;
                // Specific packages add more confidence
                if (dep === 'langchain')
                    confidence += 20;
                if (dep === '@langchain/core')
                    confidence += 10;
                if (dep === '@langchain/openai')
                    confidence += 10;
                if (dep === '@langchain/community')
                    confidence += 10;
            }
        }
    }
    catch {
        // No package.json or invalid JSON
    }
    // Scan TypeScript and JavaScript files
    const patterns = [
        '**/*.ts',
        '**/*.tsx',
        '**/*.js',
        '**/*.jsx',
        '**/*.mjs',
    ];
    for (const pattern of patterns) {
        const files = await glob(pattern, {
            cwd: projectPath,
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        });
        for (const file of files.slice(0, 50)) { // Limit for performance
            if ((0, patterns_1.shouldExcludePath)(file))
                continue;
            const lang = (0, patterns_1.getFileLanguage)(file);
            if (lang === 'typescript' && !languages.includes('typescript')) {
                languages.push('typescript');
            }
            else if (lang === 'javascript' && !languages.includes('javascript')) {
                languages.push('javascript');
            }
            try {
                const filePath = path.join(projectPath, file);
                const content = await fs.readFile(filePath, 'utf-8');
                // Check for import patterns
                for (const importPattern of patterns_1.TYPESCRIPT_IMPORT_PATTERNS) {
                    if (importPattern.pattern.test(content)) {
                        evidence.importFiles.push(file);
                        evidence.patterns.push(importPattern.description);
                        confidence = Math.min(100, confidence + 15);
                        break;
                    }
                }
            }
            catch {
                // Error reading file, continue
            }
            if (confidence >= 100)
                break;
        }
        if (confidence >= 100)
            break;
    }
    return {
        detected: confidence >= 50,
        languages: confidence >= 50 ? languages : [],
        confidence: Math.min(100, confidence),
        evidence,
    };
}
/**
 * Main detection function that checks for LangChain in any supported language
 *
 * @param projectPath - Root directory of the project to analyze
 * @returns true if LangChain is detected, false otherwise
 */
async function detect(projectPath) {
    try {
        // Check if directory exists
        await fs.access(projectPath);
        // Run detection for both Python and TypeScript
        const [pythonResult, tsResult] = await Promise.all([
            detectPythonLangChain(projectPath),
            detectTypeScriptLangChain(projectPath),
        ]);
        // Return true if either language detected LangChain
        return pythonResult.detected || tsResult.detected;
    }
    catch (error) {
        console.error('Error detecting LangChain:', error);
        return false;
    }
}
/**
 * Detailed detection function that returns comprehensive results
 *
 * @param projectPath - Root directory of the project
 * @returns Detailed detection results including confidence and evidence
 */
async function detectWithDetails(projectPath) {
    try {
        // Check if directory exists
        await fs.access(projectPath);
        // Run detection for both languages
        const [pythonResult, tsResult] = await Promise.all([
            detectPythonLangChain(projectPath),
            detectTypeScriptLangChain(projectPath),
        ]);
        // Combine results
        const languages = [
            ...pythonResult.languages,
            ...tsResult.languages,
        ];
        const confidence = Math.max(pythonResult.confidence, tsResult.confidence);
        const evidence = {
            packageFiles: [
                ...pythonResult.evidence.packageFiles,
                ...tsResult.evidence.packageFiles,
            ],
            importFiles: [
                ...pythonResult.evidence.importFiles,
                ...tsResult.evidence.importFiles,
            ],
            patterns: [
                ...pythonResult.evidence.patterns,
                ...tsResult.evidence.patterns,
            ],
        };
        return {
            detected: confidence >= 50,
            languages,
            confidence,
            evidence,
        };
    }
    catch (error) {
        console.error('Error detecting LangChain:', error);
        return {
            detected: false,
            languages: [],
            confidence: 0,
            evidence: {
                packageFiles: [],
                importFiles: [],
                patterns: [],
            },
        };
    }
}
/**
 * Validates that LangChain is properly set up in the project
 *
 * @param projectPath - Root directory of the project
 * @returns Validation result with any errors found
 */
async function validate(projectPath) {
    const errors = [];
    const warnings = [];
    const detectionResult = await detectWithDetails(projectPath);
    if (!detectionResult.detected) {
        errors.push('LangChain not detected in project');
        return { valid: false, errors, warnings };
    }
    // Check for Python setup
    if (detectionResult.languages.includes('python')) {
        // Check if LangChain is in package files but not in imports
        if (detectionResult.evidence.packageFiles.length > 0 &&
            detectionResult.evidence.importFiles.length === 0) {
            warnings.push('LangChain is installed but no imports found in Python files');
        }
        // Check for virtual environment
        try {
            await fs.access(path.join(projectPath, '.venv'));
        }
        catch {
            try {
                await fs.access(path.join(projectPath, 'venv'));
            }
            catch {
                warnings.push('No Python virtual environment detected (.venv or venv)');
            }
        }
    }
    // Check for TypeScript/JavaScript setup
    if (detectionResult.languages.includes('typescript') ||
        detectionResult.languages.includes('javascript')) {
        // Check if node_modules exists
        try {
            await fs.access(path.join(projectPath, 'node_modules'));
        }
        catch {
            errors.push('node_modules not found. Run npm install or yarn install');
        }
        // Check if LangChain is in package.json but not in imports
        if (detectionResult.evidence.packageFiles.includes('package.json') &&
            detectionResult.evidence.importFiles.length === 0) {
            warnings.push('LangChain is in package.json but no imports found in code');
        }
    }
    // Check for LLM configuration
    const envFiles = ['.env', '.env.local'];
    let hasEnvFile = false;
    for (const envFile of envFiles) {
        try {
            await fs.access(path.join(projectPath, envFile));
            hasEnvFile = true;
            break;
        }
        catch {
            // Continue checking
        }
    }
    if (!hasEnvFile) {
        warnings.push('No .env file found. LLM API keys may not be configured');
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
//# sourceMappingURL=detector.js.map