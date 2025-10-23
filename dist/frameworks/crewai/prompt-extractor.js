"use strict";
/**
 * CrewAI prompt extractor implementation
 *
 * Uses the enhanced discovery system from core with CrewAI-specific dimensions
 * to extract prompts, roles, goals, and backstories from CrewAI agents.
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
exports.CrewAIPromptExtractor = void 0;
exports.createCrewAIPromptExtractor = createCrewAIPromptExtractor;
const path = __importStar(require("path"));
const eval_core_1 = require("@identro/eval-core");
/**
 * CrewAI-specific dimensions and hints
 */
const CREWAI_DIMENSIONS = {
    // Class names that indicate agents
    agentClasses: [
        'Agent',
        'Task',
        'Crew',
        'Process',
    ],
    // Function names that create agents
    agentFunctions: [
        'create_agent',
        'create_task',
        'create_crew',
        'initialize_agent',
        'setup_agent',
    ],
    // Import dimensions to identify CrewAI files
    importDimensions: [
        'crewai',
        'from crewai import',
        'crewai.agent',
        'crewai.task',
        'crewai.crew',
        'crewai_tools',
    ],
    // Variable name dimensions that likely contain prompts/roles/goals
    variableDimensions: [
        /role/i,
        /goal/i,
        /backstory/i,
        /description/i,
        /expected_output/i,
        /context/i,
        /agent/i,
        /task/i,
    ],
    // Property names on agent objects
    agentProperties: [
        'role',
        'goal',
        'backstory',
        'tools',
        'llm',
        'max_iter',
        'allow_delegation',
        'verbose',
    ],
    // Task properties
    taskProperties: [
        'description',
        'expected_output',
        'agent',
        'tools',
        'async_execution',
        'context',
        'output_file',
    ],
};
/**
 * CrewAI-specific prompt extractor
 *
 * This extractor uses the comprehensive discovery system from core
 * but provides CrewAI-specific dimensions and interprets results
 * in the context of CrewAI framework.
 */
class CrewAIPromptExtractor extends eval_core_1.BasePromptExtractor {
    framework = 'crewai';
    supportedExtensions = ['.py', '.yaml', '.yml', '.toml'];
    discovery;
    constructor(projectRoot) {
        super();
        this.discovery = new eval_core_1.ComprehensivePromptDiscovery(projectRoot || process.cwd());
    }
    /**
     * Get CrewAI-specific hints for discovery
     */
    getHints() {
        return {
            framework: 'crewai',
            dimensions: CREWAI_DIMENSIONS.agentClasses,
            imports: CREWAI_DIMENSIONS.importDimensions,
            classNames: CREWAI_DIMENSIONS.agentClasses,
            functionNames: CREWAI_DIMENSIONS.agentFunctions,
        };
    }
    /**
     * Extract prompts from a single file using enhanced discovery
     */
    async extractFromFile(filePath, content, _hints) {
        // Check if this is a CrewAI file
        if (!this.isCrewAIFile(content)) {
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
        // Configure discovery for CrewAI-specific dimensions
        const options = {
            extensions: this.supportedExtensions,
            includeConfigs: true,
            includeDynamic: true,
            followImports: true, // Enable cross-file analysis
            ignore: [
                '**/node_modules/**',
                '**/.venv/**',
                '**/venv/**',
                '**/env/**',
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
            // Check if this is a CrewAI-related prompt
            if (!this.isCrewAIPrompt(prompt)) {
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
                const promptType = this.classifyPromptType(prompt);
                if (promptType === 'role' || promptType === 'goal' || promptType === 'backstory') {
                    // These are agent-specific prompts - map to 'system' type for now
                    filePrompts.templates.push({
                        name: prompt.name,
                        content: this.cleanPromptText(prompt.content),
                        variables: Array.from(prompt.variables.keys()),
                        type: 'system', // Map CrewAI-specific types to system
                        location: file,
                        lineNumber: prompt.fragments[0]?.lineNumber || 0,
                    });
                }
                else if (promptType === 'description' || promptType === 'expected_output') {
                    // These are task-specific prompts
                    filePrompts.descriptions.push(this.cleanPromptText(prompt.content));
                }
                else {
                    // Generic prompt
                    filePrompts.templates.push({
                        name: prompt.name,
                        content: this.cleanPromptText(prompt.content),
                        variables: Array.from(prompt.variables.keys()),
                        type: 'prompt',
                        location: file,
                        lineNumber: prompt.fragments[0]?.lineNumber || 0,
                    });
                }
            }
        }
        // Extract additional CrewAI-specific information
        await this.extractCrewAISpecifics(projectPath, promptsByFile);
        return Array.from(promptsByFile.values());
    }
    /**
     * Check if content is from a CrewAI file
     */
    isCrewAIFile(content) {
        return CREWAI_DIMENSIONS.importDimensions.some(dimension => content.includes(dimension));
    }
    /**
     * Check if a discovered prompt is CrewAI-related
     */
    isCrewAIPrompt(prompt) {
        // Check if the prompt name matches CrewAI dimensions
        const nameMatches = CREWAI_DIMENSIONS.variableDimensions.some(dimension => dimension.test(prompt.name));
        // Check if any fragment mentions CrewAI classes
        const hasCrewAIClass = prompt.fragments.some((f) => CREWAI_DIMENSIONS.agentClasses.some(cls => f.content?.includes(cls)));
        // Check files for CrewAI imports
        const fromCrewAIFile = prompt.files.some((file) => file.includes('agent') || file.includes('task') || file.includes('crew'));
        return nameMatches || hasCrewAIClass || fromCrewAIFile;
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
            const promptType = this.classifyPromptType(prompt);
            if (promptType === 'description' || promptType === 'expected_output') {
                result.descriptions.push(this.cleanPromptText(prompt.content));
            }
            else {
                result.templates.push({
                    name: prompt.name,
                    content: this.cleanPromptText(prompt.content),
                    variables: Array.from(prompt.variables.keys()),
                    type: promptType,
                    location: filePath,
                    lineNumber: prompt.fragments[0]?.lineNumber || 0,
                });
            }
        }
        return result;
    }
    /**
     * Classify the type of prompt based on content and metadata
     */
    classifyPromptType(prompt) {
        const name = prompt.name.toLowerCase();
        const content = prompt.content.toLowerCase();
        // Agent-specific prompts
        if (name.includes('role'))
            return 'role';
        if (name.includes('goal'))
            return 'goal';
        if (name.includes('backstory'))
            return 'backstory';
        // Task-specific prompts
        if (name.includes('description') || name.includes('desc'))
            return 'description';
        if (name.includes('expected_output') || name.includes('output'))
            return 'expected_output';
        // Context analysis
        if (content.includes('you are') || content.includes('your role'))
            return 'role';
        if (content.includes('your goal') || content.includes('objective'))
            return 'goal';
        if (content.includes('background') || content.includes('experience'))
            return 'backstory';
        return 'prompt';
    }
    /**
     * Extract additional CrewAI-specific information
     *
     * This method looks for CrewAI-specific dimensions that the generic
     * discovery might miss, such as:
     * - Agent configurations
     * - Task definitions
     * - Tool configurations
     * - Crew compositions (TODO: for future phases)
     */
    async extractCrewAISpecifics(_projectPath, promptsByFile) {
        // Look for additional dimensions specific to CrewAI
        for (const [file, prompts] of promptsByFile) {
            // Extract tool definitions if any
            const tools = await this.extractTools(file);
            if (tools.length > 0) {
                prompts.tools.push(...tools);
            }
            // Extract examples from task definitions
            const examples = await this.extractTaskExamples(file);
            if (examples.length > 0) {
                prompts.examples.push(...examples);
            }
        }
    }
    /**
     * Extract tool definitions from a file
     */
    async extractTools(_filePath) {
        // This would look for tool definitions in CrewAI agents
        // Tools are typically imported from crewai_tools or langchain
        // For now, return empty array - can be enhanced later
        return [];
    }
    /**
     * Extract task examples from a file
     */
    async extractTaskExamples(_filePath) {
        // This would extract example outputs from task definitions
        // For now, return empty array - can be enhanced later
        return [];
    }
}
exports.CrewAIPromptExtractor = CrewAIPromptExtractor;
/**
 * Create a CrewAI prompt extractor instance
 */
function createCrewAIPromptExtractor(projectRoot) {
    return new CrewAIPromptExtractor(projectRoot);
}
//# sourceMappingURL=prompt-extractor.js.map