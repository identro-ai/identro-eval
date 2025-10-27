/**
 * CrewAI-specific patterns and utilities
 *
 * This module contains patterns for detecting and analyzing CrewAI agents,
 * tasks, crews, and related constructs.
 */
/**
 * Import patterns for detecting CrewAI usage
 */
export const PYTHON_IMPORT_PATTERNS = [
    'from crewai import',
    'import crewai',
    'from crewai.agent import',
    'from crewai.task import',
    'from crewai.crew import',
    'from crewai.process import',
    'from crewai.tools import',
];
export const TYPESCRIPT_IMPORT_PATTERNS = [
    // CrewAI doesn't have official TypeScript support yet
    // But we'll prepare for it
    'crewai',
    '@crewai/core',
];
/**
 * Agent patterns for Python
 */
export const PYTHON_AGENT_PATTERNS = [
    // Class instantiation
    /Agent\s*\(/,
    // Variable assignment
    /\w+\s*=\s*Agent\s*\(/,
    // Agent configuration
    /role\s*=\s*['"]/,
    /goal\s*=\s*['"]/,
    /backstory\s*=\s*['"]/,
    /tools\s*=\s*\[/,
    /verbose\s*=\s*True/,
    /allow_delegation\s*=/,
    /max_iter\s*=/,
];
/**
 * Task patterns for Python
 */
export const PYTHON_TASK_PATTERNS = [
    // Task instantiation
    /Task\s*\(/,
    // Task configuration
    /description\s*=\s*['"]/,
    /expected_output\s*=\s*['"]/,
    /agent\s*=\s*/,
    /tools\s*=\s*\[/,
    /async_execution\s*=/,
    /context\s*=\s*\[/,
    /output_file\s*=/,
];
/**
 * Crew patterns for Python
 */
export const PYTHON_CREW_PATTERNS = [
    // Crew instantiation
    /Crew\s*\(/,
    // Crew configuration
    /agents\s*=\s*\[/,
    /tasks\s*=\s*\[/,
    /process\s*=\s*Process\./,
    /verbose\s*=\s*\d+/,
    /manager_llm\s*=/,
    /function_calling_llm\s*=/,
    /config\s*=/,
    /max_rpm\s*=/,
];
/**
 * Tool patterns for Python
 */
export const PYTHON_TOOL_PATTERNS = [
    // Tool imports
    /from crewai_tools import/,
    /from langchain.tools import/,
    /from langchain_community.tools import/,
    // Tool usage
    /tools\s*=\s*\[.*Tool/,
    /SerperDevTool/,
    /WebsiteSearchTool/,
    /FileReadTool/,
    /MDXSearchTool/,
    /ScrapeWebsiteTool/,
];
/**
 * LLM configuration patterns
 */
export const LLM_CONFIG_PATTERNS = [
    /llm\s*=\s*ChatOpenAI/,
    /llm\s*=\s*OpenAI/,
    /llm\s*=\s*Ollama/,
    /llm\s*=\s*ChatAnthropic/,
    /model\s*=\s*['"]/,
    /temperature\s*=\s*[\d.]+/,
    /api_key\s*=/,
];
/**
 * Environment variable patterns
 */
export const LLM_ENV_PATTERNS = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'SERPER_API_KEY',
    'BROWSERLESS_API_KEY',
    'OPENAI_MODEL_NAME',
    'OPENAI_API_BASE',
];
/**
 * Configuration file patterns
 */
export const CONFIG_FILE_PATTERNS = [
    'agents.yaml',
    'tasks.yaml',
    'crew.yaml',
    'config.yaml',
    '.env',
    'pyproject.toml',
];
/**
 * File extensions to scan
 */
export const SCAN_EXTENSIONS = [
    '.py',
    '.yaml',
    '.yml',
    '.toml',
    '.env',
];
/**
 * Directories to exclude from scanning
 */
export const EXCLUDE_DIRS = [
    'node_modules',
    '__pycache__',
    '.venv',
    'venv',
    'env',
    '.git',
    'dist',
    'build',
    '.pytest_cache',
    '.mypy_cache',
    'htmlcov',
    '.coverage',
    'site-packages',
];
/**
 * Check if a path should be excluded
 */
export function shouldExcludePath(path) {
    return EXCLUDE_DIRS.some(dir => path.includes(`/${dir}/`) || path.includes(`\\${dir}\\`));
}
/**
 * Get the language of a file based on extension
 */
export function getFileLanguage(filePath) {
    if (filePath.endsWith('.py'))
        return 'python';
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))
        return 'typescript';
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx'))
        return 'typescript'; // Treat JS as TS
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml'))
        return 'yaml';
    return 'unknown';
}
/**
 * Classify agent type based on role and goal
 */
export function classifyAgentType(role, goal) {
    const roleGoalText = `${role} ${goal}`.toLowerCase();
    // Researcher patterns
    if (roleGoalText.match(/research|investigate|explore|discover|find|search|gather/)) {
        return 'researcher';
    }
    // Writer patterns
    if (roleGoalText.match(/write|author|compose|draft|create content|blog|article|report/)) {
        return 'writer';
    }
    // Analyst patterns
    if (roleGoalText.match(/analyze|analyse|evaluate|assess|review|examine|study/)) {
        return 'analyst';
    }
    // Coordinator patterns
    if (roleGoalText.match(/coordinate|manage|organize|orchestrate|lead|supervise|delegate/)) {
        return 'coordinator';
    }
    // Executor patterns
    if (roleGoalText.match(/execute|implement|perform|complete|accomplish|carry out|do/)) {
        return 'executor';
    }
    return 'unknown';
}
/**
 * Extract agent role from Python code
 */
export function extractAgentRole(content) {
    const roleMatch = content.match(/role\s*=\s*["']([^"']+)["']/);
    return roleMatch ? roleMatch[1] : null;
}
/**
 * Extract agent goal from Python code
 */
export function extractAgentGoal(content) {
    const goalMatch = content.match(/goal\s*=\s*["']([^"']+)["']/);
    return goalMatch ? goalMatch[1] : null;
}
/**
 * Extract agent backstory from Python code
 */
export function extractAgentBackstory(content) {
    // Handle multi-line strings
    const backstoryMatch = content.match(/backstory\s*=\s*(["']{1,3})([\s\S]*?)\1/);
    return backstoryMatch ? backstoryMatch[2].trim() : null;
}
/**
 * Extract task description from Python code
 */
export function extractTaskDescription(content) {
    // Handle multi-line strings
    const descMatch = content.match(/description\s*=\s*(["']{1,3})([\s\S]*?)\1/);
    return descMatch ? descMatch[2].trim() : null;
}
/**
 * Extract expected output from Python code
 */
export function extractExpectedOutput(content) {
    // Handle multi-line strings
    const outputMatch = content.match(/expected_output\s*=\s*(["']{1,3})([\s\S]*?)\1/);
    return outputMatch ? outputMatch[2].trim() : null;
}
/**
 * Check if content contains CrewAI imports
 */
export function hasCrewAIImports(content) {
    return PYTHON_IMPORT_PATTERNS.some(pattern => content.includes(pattern));
}
/**
 * Check if content contains agent definitions
 */
export function hasAgentDefinitions(content) {
    return PYTHON_AGENT_PATTERNS.some(pattern => pattern.test(content));
}
/**
 * Check if content contains task definitions
 */
export function hasTaskDefinitions(content) {
    return PYTHON_TASK_PATTERNS.some(pattern => pattern.test(content));
}
/**
 * Check if content contains crew definitions
 * TODO: Implement crew evaluation in future phases
 */
export function hasCrewDefinitions(content) {
    return PYTHON_CREW_PATTERNS.some(pattern => pattern.test(content));
}
/**
 * Extract all agent names from content
 */
export function extractAgentNames(content) {
    const names = [];
    // Pattern 1: variable = Agent(...)
    const varPattern = /(\w+)\s*=\s*Agent\s*\(/g;
    let match;
    while ((match = varPattern.exec(content)) !== null) {
        names.push(match[1]);
    }
    // Pattern 2: agents = [agent1, agent2, ...]
    const listPattern = /agents\s*=\s*\[([^\]]+)\]/;
    const listMatch = content.match(listPattern);
    if (listMatch) {
        const agentList = listMatch[1];
        const agentNames = agentList.split(',').map(name => name.trim());
        names.push(...agentNames);
    }
    return [...new Set(names)]; // Remove duplicates
}
/**
 * Extract all task names from content
 */
export function extractTaskNames(content) {
    const names = [];
    // Pattern 1: variable = Task(...)
    const varPattern = /(\w+)\s*=\s*Task\s*\(/g;
    let match;
    while ((match = varPattern.exec(content)) !== null) {
        names.push(match[1]);
    }
    // Pattern 2: tasks = [task1, task2, ...]
    const listPattern = /tasks\s*=\s*\[([^\]]+)\]/;
    const listMatch = content.match(listPattern);
    if (listMatch) {
        const taskList = listMatch[1];
        const taskNames = taskList.split(',').map(name => name.trim());
        names.push(...taskNames);
    }
    return [...new Set(names)]; // Remove duplicates
}
/**
 * Detect process type (sequential or hierarchical)
 */
export function detectProcessType(content) {
    if (content.includes('Process.sequential'))
        return 'sequential';
    if (content.includes('Process.hierarchical'))
        return 'hierarchical';
    return 'unknown';
}
/**
 * Extract tools used by agents
 */
export function extractTools(content) {
    const tools = [];
    // Look for tool imports
    const toolImportPattern = /from\s+crewai_tools\s+import\s+([^;\n]+)/g;
    let match;
    while ((match = toolImportPattern.exec(content)) !== null) {
        const imports = match[1].split(',').map(t => t.trim());
        tools.push(...imports);
    }
    // Look for tool instantiations
    const toolPatterns = [
        'SerperDevTool',
        'WebsiteSearchTool',
        'FileReadTool',
        'MDXSearchTool',
        'ScrapeWebsiteTool',
        'DirectoryReadTool',
        'CSVSearchTool',
        'DOCXSearchTool',
        'PDFSearchTool',
        'TXTSearchTool',
    ];
    toolPatterns.forEach(toolName => {
        if (content.includes(toolName)) {
            tools.push(toolName);
        }
    });
    return [...new Set(tools)]; // Remove duplicates
}
//# sourceMappingURL=patterns.js.map