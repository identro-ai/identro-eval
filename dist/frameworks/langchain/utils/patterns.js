/**
 * Pattern definitions for detecting LangChain usage in Python and TypeScript projects
 *
 * These patterns are used to identify:
 * - Framework imports
 * - Agent definitions
 * - Chain instantiations
 * - Tool usage
 * - LLM configurations
 */
/**
 * Python import patterns for LangChain
 */
export const PYTHON_IMPORT_PATTERNS = [
    {
        pattern: /from\s+langchain/,
        language: 'python',
        description: 'Standard langchain import',
    },
    {
        pattern: /import\s+langchain/,
        language: 'python',
        description: 'Direct langchain import',
    },
    {
        pattern: /from\s+langchain_community/,
        language: 'python',
        description: 'LangChain community import',
    },
    {
        pattern: /from\s+langchain_openai/,
        language: 'python',
        description: 'LangChain OpenAI import',
    },
    {
        pattern: /from\s+langchain_anthropic/,
        language: 'python',
        description: 'LangChain Anthropic import',
    },
    {
        pattern: /from\s+langchain\.agents/,
        language: 'python',
        description: 'LangChain agents import',
    },
    {
        pattern: /from\s+langchain\.chains/,
        language: 'python',
        description: 'LangChain chains import',
    },
    {
        pattern: /from\s+langchain\.llms/,
        language: 'python',
        description: 'LangChain LLMs import',
    },
    {
        pattern: /from\s+langchain\.tools/,
        language: 'python',
        description: 'LangChain tools import',
    },
    {
        pattern: /from\s+langchain\.memory/,
        language: 'python',
        description: 'LangChain memory import',
    },
];
/**
 * TypeScript/JavaScript import patterns for LangChain
 */
export const TYPESCRIPT_IMPORT_PATTERNS = [
    {
        pattern: /from\s+["']langchain/,
        language: 'typescript',
        description: 'Standard langchain import',
    },
    {
        pattern: /from\s+["']@langchain\//,
        language: 'typescript',
        description: 'Scoped langchain import',
    },
    {
        pattern: /require\(["']langchain/,
        language: 'javascript',
        description: 'CommonJS langchain require',
    },
    {
        pattern: /require\(["']@langchain\//,
        language: 'javascript',
        description: 'CommonJS scoped langchain require',
    },
    {
        pattern: /import.*from\s+["']langchain\/agents/,
        language: 'typescript',
        description: 'LangChain agents import',
    },
    {
        pattern: /import.*from\s+["']langchain\/chains/,
        language: 'typescript',
        description: 'LangChain chains import',
    },
    {
        pattern: /import.*from\s+["']langchain\/llms/,
        language: 'typescript',
        description: 'LangChain LLMs import',
    },
    {
        pattern: /import.*from\s+["']@langchain\/core/,
        language: 'typescript',
        description: 'LangChain core import',
    },
    {
        pattern: /import.*from\s+["']@langchain\/openai/,
        language: 'typescript',
        description: 'LangChain OpenAI import',
    },
];
/**
 * Python agent patterns
 */
export const PYTHON_AGENT_PATTERNS = [
    // Class-based agents
    {
        pattern: /class\s+(\w*Agent\w*)\s*\([^)]*\):/,
        type: 'class',
        agentType: 'custom',
        description: 'Custom agent class definition',
    },
    {
        pattern: /class\s+(\w*Chain\w*)\s*\([^)]*\):/,
        type: 'class',
        agentType: 'task_executor',
        description: 'Custom chain class definition',
    },
    {
        pattern: /class\s+(\w*Router\w*)\s*\([^)]*\):/,
        type: 'class',
        agentType: 'classifier',
        description: 'Router/classifier agent class',
    },
    // Function-based agent creation
    {
        pattern: /create_react_agent\s*\(/,
        type: 'function',
        agentType: 'task_executor',
        description: 'ReAct agent creation',
    },
    {
        pattern: /create_openai_functions_agent\s*\(/,
        type: 'function',
        agentType: 'task_executor',
        description: 'OpenAI functions agent',
    },
    {
        pattern: /create_structured_chat_agent\s*\(/,
        type: 'function',
        agentType: 'task_executor',
        description: 'Structured chat agent',
    },
    {
        pattern: /create_sql_agent\s*\(/,
        type: 'function',
        agentType: 'task_executor',
        description: 'SQL agent creation',
    },
    // Variable assignments
    {
        pattern: /(\w+)\s*=\s*AgentExecutor\s*\(/,
        type: 'variable',
        agentType: 'task_executor',
        description: 'Agent executor instantiation',
    },
    {
        pattern: /(\w+)\s*=\s*LLMChain\s*\(/,
        type: 'variable',
        agentType: 'task_executor',
        description: 'LLM chain instantiation',
    },
    {
        pattern: /(\w+)\s*=\s*RetrievalQA/,
        type: 'variable',
        agentType: 'rag',
        description: 'RAG chain instantiation',
    },
    {
        pattern: /(\w+)\s*=\s*ConversationalRetrievalChain/,
        type: 'variable',
        agentType: 'rag',
        description: 'Conversational RAG chain',
    },
    {
        pattern: /(\w+)\s*=\s*SequentialChain\s*\(/,
        type: 'variable',
        agentType: 'coordinator',
        description: 'Sequential chain coordinator',
    },
    {
        pattern: /(\w+)\s*=\s*SimpleSequentialChain\s*\(/,
        type: 'variable',
        agentType: 'coordinator',
        description: 'Simple sequential chain',
    },
];
/**
 * TypeScript/JavaScript agent patterns
 */
export const TYPESCRIPT_AGENT_PATTERNS = [
    // Class-based agents
    {
        pattern: /class\s+(\w*Agent\w*)\s+extends/,
        type: 'class',
        agentType: 'custom',
        description: 'Custom agent class',
    },
    {
        pattern: /class\s+(\w*Chain\w*)\s+extends/,
        type: 'class',
        agentType: 'task_executor',
        description: 'Custom chain class',
    },
    {
        pattern: /class\s+(\w*Router\w*)\s+extends/,
        type: 'class',
        agentType: 'classifier',
        description: 'Router/classifier class',
    },
    // Function-based creation
    {
        pattern: /AgentExecutor\.fromAgentAndTools/,
        type: 'function',
        agentType: 'task_executor',
        description: 'Agent executor creation',
    },
    {
        pattern: /initializeAgentExecutorWithOptions/,
        type: 'function',
        agentType: 'task_executor',
        description: 'Agent with options',
    },
    {
        pattern: /createOpenAIFunctionsAgent/,
        type: 'function',
        agentType: 'task_executor',
        description: 'OpenAI functions agent',
    },
    {
        pattern: /createReactAgent/,
        type: 'function',
        agentType: 'task_executor',
        description: 'ReAct agent creation',
    },
    // Variable assignments
    {
        pattern: /(?:const|let|var)\s+(\w+)\s*=\s*new\s+AgentExecutor/,
        type: 'variable',
        agentType: 'task_executor',
        description: 'Agent executor instance',
    },
    {
        pattern: /(?:const|let|var)\s+(\w+)\s*=\s*new\s+LLMChain/,
        type: 'variable',
        agentType: 'task_executor',
        description: 'LLM chain instance',
    },
    {
        pattern: /(?:const|let|var)\s+(\w+)\s*=\s*RetrievalQAChain/,
        type: 'variable',
        agentType: 'rag',
        description: 'RAG chain instance',
    },
    {
        pattern: /(?:const|let|var)\s+(\w+)\s*=\s*ConversationalRetrievalQAChain/,
        type: 'variable',
        agentType: 'rag',
        description: 'Conversational RAG chain',
    },
    {
        pattern: /(?:const|let|var)\s+(\w+)\s*=\s*new\s+SequentialChain/,
        type: 'variable',
        agentType: 'coordinator',
        description: 'Sequential chain instance',
    },
    {
        pattern: /(?:const|let|var)\s+(\w+)\s*=\s*await\s+\w+Chain\.from/,
        type: 'variable',
        agentType: 'task_executor',
        description: 'Chain factory method',
    },
];
/**
 * LLM configuration patterns
 */
export const LLM_CONFIG_PATTERNS = {
    python: [
        /OpenAI\s*\(/,
        /ChatOpenAI\s*\(/,
        /Anthropic\s*\(/,
        /ChatAnthropic\s*\(/,
        /AzureOpenAI\s*\(/,
        /HuggingFaceHub\s*\(/,
        /Cohere\s*\(/,
        /GooglePalm\s*\(/,
        /Bedrock\s*\(/,
        /Ollama\s*\(/,
        /LlamaCpp\s*\(/,
    ],
    typescript: [
        /new\s+OpenAI\s*\(/,
        /new\s+ChatOpenAI\s*\(/,
        /new\s+Anthropic\s*\(/,
        /new\s+ChatAnthropic\s*\(/,
        /new\s+AzureOpenAI\s*\(/,
        /new\s+HuggingFaceInference\s*\(/,
        /new\s+Cohere\s*\(/,
        /new\s+GooglePalm\s*\(/,
        /new\s+Bedrock\s*\(/,
        /new\s+Ollama\s*\(/,
    ],
};
/**
 * Environment variable patterns for LLM API keys
 */
export const LLM_ENV_PATTERNS = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'AZURE_OPENAI_API_KEY',
    'AZURE_OPENAI_KEY',
    'HUGGINGFACE_API_KEY',
    'HUGGINGFACE_TOKEN',
    'COHERE_API_KEY',
    'GOOGLE_API_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'REPLICATE_API_TOKEN',
];
/**
 * Configuration file patterns
 */
export const CONFIG_FILE_PATTERNS = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    'config.yaml',
    'config.yml',
    'settings.json',
    'settings.yaml',
    'llm_config.py',
    'llm_config.js',
    'llm_config.ts',
    'config.py',
    'config.js',
    'config.ts',
];
/**
 * File extensions to scan for LangChain usage
 */
export const SCAN_EXTENSIONS = {
    python: ['.py'],
    typescript: ['.ts', '.tsx'],
    javascript: ['.js', '.jsx', '.mjs'],
};
/**
 * Directories to exclude from scanning
 */
export const EXCLUDE_DIRS = [
    'node_modules',
    '.git',
    '.venv',
    'venv',
    'env',
    '__pycache__',
    'dist',
    'build',
    'out',
    '.next',
    '.nuxt',
    'coverage',
    '.pytest_cache',
    '.mypy_cache',
    'site-packages',
];
/**
 * Helper function to check if a file path should be excluded
 */
export function shouldExcludePath(path) {
    const normalizedPath = path.replace(/\\/g, '/');
    return EXCLUDE_DIRS.some(dir => normalizedPath.includes(`/${dir}/`) ||
        normalizedPath.endsWith(`/${dir}`));
}
/**
 * Helper function to determine file language
 */
export function getFileLanguage(filePath) {
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    if (SCAN_EXTENSIONS.python.includes(ext))
        return 'python';
    if (SCAN_EXTENSIONS.typescript.includes(ext))
        return 'typescript';
    if (SCAN_EXTENSIONS.javascript.includes(ext))
        return 'javascript';
    return null;
}
/**
 * Helper function to classify agent type based on patterns and context
 */
export function classifyAgentType(code, fileName, patterns) {
    // Check for specific keywords in code
    const lowerCode = code.toLowerCase();
    const lowerFileName = fileName.toLowerCase();
    // RAG indicators
    if (lowerCode.includes('retrieval') ||
        lowerCode.includes('vectorstore') ||
        lowerCode.includes('embedding') ||
        lowerCode.includes('similarity_search') ||
        lowerFileName.includes('rag') ||
        lowerFileName.includes('retrieval')) {
        return 'rag';
    }
    // Classifier/Router indicators
    if (lowerCode.includes('router') ||
        lowerCode.includes('classify') ||
        lowerCode.includes('categorize') ||
        lowerCode.includes('route') ||
        lowerFileName.includes('router') ||
        lowerFileName.includes('classifier')) {
        return 'classifier';
    }
    // Coordinator indicators
    if (lowerCode.includes('sequential') ||
        lowerCode.includes('orchestrat') ||
        lowerCode.includes('coordinat') ||
        lowerCode.includes('supervisor') ||
        lowerFileName.includes('orchestrator') ||
        lowerFileName.includes('coordinator')) {
        return 'coordinator';
    }
    // Check patterns for type hints
    for (const pattern of patterns) {
        if (pattern.pattern.test(code)) {
            return pattern.agentType;
        }
    }
    // Default to task_executor for general agents
    return 'task_executor';
}
//# sourceMappingURL=patterns.js.map