"use strict";
/**
 * LangChain prompt extractor implementation
 *
 * Uses the enhanced discovery system from core with LangChain-specific patterns
 * to extract prompts, templates, and examples from LangChain code.
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
exports.LangChainPromptExtractor = void 0;
exports.createLangChainPromptExtractor = createLangChainPromptExtractor;
const path = __importStar(require("path"));
const eval_core_1 = require("@identro/eval-core");
/**
 * LangChain-specific patterns and hints
 */
const LANGCHAIN_PATTERNS = {
    // Class names that indicate prompts
    promptClasses: [
        'PromptTemplate',
        'ChatPromptTemplate',
        'FewShotPromptTemplate',
        'SystemMessagePromptTemplate',
        'HumanMessagePromptTemplate',
        'AIMessagePromptTemplate',
        'MessagesPlaceholder',
    ],
    // Function names that create prompts
    promptFunctions: [
        'from_template',
        'fromTemplate',
        'from_messages',
        'fromMessages',
        'format',
        'format_prompt',
        'formatPrompt',
        'create_prompt',
        'createPrompt',
    ],
    // Import patterns to identify LangChain files
    importPatterns: [
        'langchain',
        '@langchain/core',
        'langchain/prompts',
        'langchain.prompts',
        'langchain/schema',
        '@langchain/community',
    ],
    // Variable name patterns that likely contain prompts
    variablePatterns: [
        /prompt/i,
        /template/i,
        /system_?message/i,
        /human_?message/i,
        /ai_?message/i,
        /instruction/i,
    ],
    // Method names on prompt objects
    promptMethods: [
        'format',
        'format_prompt',
        'formatPrompt',
        'partial',
        'invoke',
    ],
};
/**
 * LangChain-specific prompt extractor
 *
 * This extractor uses the comprehensive discovery system from core
 * but provides LangChain-specific patterns and interprets results
 * in the context of LangChain framework.
 */
class LangChainPromptExtractor extends eval_core_1.BasePromptExtractor {
    framework = 'langchain';
    supportedExtensions = ['.py', '.ts', '.tsx', '.js', '.jsx', '.mjs'];
    discovery;
    constructor(projectRoot) {
        super();
        this.discovery = new eval_core_1.ComprehensivePromptDiscovery(projectRoot || process.cwd());
    }
    /**
     * Get LangChain-specific hints for discovery
     */
    getHints() {
        return {
            framework: 'langchain',
            dimensions: LANGCHAIN_PATTERNS.promptClasses,
            imports: LANGCHAIN_PATTERNS.importPatterns,
            classNames: LANGCHAIN_PATTERNS.promptClasses,
            functionNames: LANGCHAIN_PATTERNS.promptFunctions,
        };
    }
    /**
     * Extract prompts from a single file using enhanced discovery
     */
    async extractFromFile(filePath, content, _hints) {
        // Check if this is a LangChain file
        if (!this.isLangChainFile(content)) {
            return {
                templates: [],
                examples: [],
                descriptions: [],
                tools: [],
            };
        }
        // Use the comprehensive discovery for this specific file
        const options = {
            extensions: [path.extname(filePath)],
            includeConfigs: true,
            includeDynamic: true,
            followImports: false, // Single file analysis
        };
        // Create a temporary project with just this file for analysis
        const discovered = await this.discovery.discoverAll(path.dirname(filePath), options);
        // Filter and transform results for this specific file
        return this.transformDiscoveryResults(discovered, filePath);
    }
    /**
     * Extract prompts from an entire project
     */
    async extractFromProject(projectPath, _hints) {
        // Configure discovery for LangChain-specific patterns
        const options = {
            extensions: this.supportedExtensions,
            includeConfigs: true,
            includeDynamic: true,
            followImports: true, // Enable cross-file analysis
            ignore: [
                '**/node_modules/**',
                '**/.venv/**',
                '**/venv/**',
                '**/dist/**',
                '**/build/**',
                '**/test/**',
                '**/*.test.*',
                '**/*.spec.*',
            ],
        };
        // Use comprehensive discovery
        const discovered = await this.discovery.discoverAll(projectPath, options);
        // Group results by file and transform
        const promptsByFile = new Map();
        for (const prompt of discovered.prompts) {
            // Check if this is a LangChain-related prompt
            if (!this.isLangChainPrompt(prompt)) {
                continue;
            }
            for (const file of prompt.files) {
                if (!promptsByFile.has(file)) {
                    promptsByFile.set(file, {
                        templates: [],
                        examples: [],
                        descriptions: [],
                        tools: [],
                    });
                }
                const filePrompts = promptsByFile.get(file);
                // Transform resolved prompt to template format
                filePrompts.templates.push({
                    name: prompt.name,
                    content: this.cleanPromptText(prompt.content),
                    variables: Array.from(prompt.variables.keys()),
                    type: this.classifyPromptType(prompt),
                    location: file,
                    lineNumber: prompt.fragments[0]?.lineNumber || 0,
                });
            }
        }
        // Extract additional LangChain-specific information
        await this.extractLangChainSpecifics(projectPath, promptsByFile);
        return Array.from(promptsByFile.values());
    }
    /**
     * Check if content is from a LangChain file
     */
    isLangChainFile(content) {
        return LANGCHAIN_PATTERNS.importPatterns.some(pattern => content.includes(pattern));
    }
    /**
     * Check if a discovered prompt is LangChain-related
     */
    isLangChainPrompt(prompt) {
        // Check if the prompt name matches LangChain patterns
        const nameMatches = LANGCHAIN_PATTERNS.variablePatterns.some(pattern => pattern.test(prompt.name));
        // Check if any fragment mentions LangChain classes
        const hasLangChainClass = prompt.fragments.some((f) => LANGCHAIN_PATTERNS.promptClasses.some(cls => f.content?.includes(cls)));
        // Check files for LangChain imports
        const fromLangChainFile = prompt.files.some((file) => file.includes('langchain') || file.includes('prompt'));
        return nameMatches || hasLangChainClass || fromLangChainFile;
    }
    /**
     * Transform discovery results to ExtractedPrompts format
     */
    transformDiscoveryResults(discovered, filePath) {
        const result = {
            templates: [],
            examples: [],
            descriptions: [],
            tools: [],
        };
        // Filter prompts for this specific file
        const filePrompts = discovered.prompts.filter((p) => p.files.includes(filePath));
        for (const prompt of filePrompts) {
            result.templates.push({
                name: prompt.name,
                content: this.cleanPromptText(prompt.content),
                variables: Array.from(prompt.variables.keys()),
                type: this.classifyPromptType(prompt),
                location: filePath,
                lineNumber: prompt.fragments[0]?.lineNumber || 0,
            });
        }
        return result;
    }
    /**
     * Classify the type of prompt based on content and metadata
     */
    classifyPromptType(prompt) {
        const name = prompt.name.toLowerCase();
        const content = prompt.content.toLowerCase();
        if (name.includes('system') || content.includes('you are')) {
            return 'system';
        }
        else if (name.includes('human') || name.includes('user')) {
            return 'human';
        }
        else if (name.includes('assistant') || name.includes('ai')) {
            return 'assistant';
        }
        return 'prompt';
    }
    /**
     * Extract additional LangChain-specific information
     *
     * This method looks for LangChain-specific patterns that the generic
     * discovery might miss, such as:
     * - Chain compositions
     * - Tool definitions
     * - Example selectors
     * - Memory configurations
     */
    async extractLangChainSpecifics(_projectPath, promptsByFile) {
        // Look for additional patterns specific to LangChain
        for (const [file, prompts] of promptsByFile) {
            // Extract tool definitions if any
            const tools = await this.extractTools(file);
            if (tools.length > 0) {
                prompts.tools.push(...tools);
            }
            // Extract examples if using FewShotPromptTemplate
            const examples = await this.extractExamples(file);
            if (examples.length > 0) {
                prompts.examples.push(...examples);
            }
            // Extract descriptions from docstrings or comments
            const descriptions = await this.extractDescriptions(file);
            if (descriptions.length > 0) {
                prompts.descriptions.push(...descriptions);
            }
        }
    }
    /**
     * Extract tool definitions from a file
     */
    async extractTools(_filePath) {
        // This would look for tool definitions in LangChain agents
        // For now, return empty array - can be enhanced later
        return [];
    }
    /**
     * Extract examples from FewShotPromptTemplate configurations
     */
    async extractExamples(_filePath) {
        // This would extract examples from FewShotPromptTemplate
        // For now, return empty array - can be enhanced later
        return [];
    }
    /**
     * Extract descriptions from docstrings and comments
     */
    async extractDescriptions(_filePath) {
        // This would extract descriptions from docstrings
        // For now, return empty array - can be enhanced later
        return [];
    }
}
exports.LangChainPromptExtractor = LangChainPromptExtractor;
/**
 * Create a LangChain prompt extractor instance
 */
function createLangChainPromptExtractor(projectRoot) {
    return new LangChainPromptExtractor(projectRoot);
}
//# sourceMappingURL=prompt-extractor.js.map