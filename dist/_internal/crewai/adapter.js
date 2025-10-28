"use strict";
/**
 * CrewAI Adapter - Simplified Architecture
 *
 * Direct execution without internal orchestration.
 * Works with TestStateManager as single source of truth.
 *
 * This replaces the OrchestratedCrewAIAdapter to eliminate double orchestration.
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
exports.CrewAIAdapter = void 0;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const team_discovery_1 = require("./team-discovery");
const enhanced_workflow_discovery_1 = require("./enhanced-workflow-discovery");
class CrewAIAdapter {
    name = 'crewai';
    supportedLanguages = ['python'];
    // Process pool for reusing Python processes
    processPool = new Map();
    maxProcessAge = 5 * 60 * 1000; // 5 minutes
    cleanupInterval = null;
    async detect(projectPath) {
        try {
            // Check for crew.py or main.py with CrewAI imports
            const crewFile = path.join(projectPath, 'crew.py');
            const mainFile = path.join(projectPath, 'main.py');
            if (await fs.pathExists(crewFile)) {
                const content = await fs.readFile(crewFile, 'utf-8');
                return content.includes('from crewai') || content.includes('import crewai');
            }
            if (await fs.pathExists(mainFile)) {
                const content = await fs.readFile(mainFile, 'utf-8');
                return content.includes('from crewai') || content.includes('import crewai');
            }
            // Check for requirements.txt with crewai
            const reqFile = path.join(projectPath, 'requirements.txt');
            if (await fs.pathExists(reqFile)) {
                const content = await fs.readFile(reqFile, 'utf-8');
                return content.includes('crewai');
            }
            return false;
        }
        catch {
            return false;
        }
    }
    async discoverAgents(projectPath) {
        const agents = [];
        // Check Python files
        const pythonFiles = ['agents.py', 'crew.py', 'main.py'];
        for (const file of pythonFiles) {
            const filePath = path.join(projectPath, file);
            if (await fs.pathExists(filePath)) {
                const content = await fs.readFile(filePath, 'utf-8');
                // Look for Agent instantiations
                const agentDimension = /(\w+)\s*=\s*Agent\s*\(/g;
                let match;
                while ((match = agentDimension.exec(content)) !== null) {
                    const varName = match[1];
                    // Extract agent details
                    const roleMatch = new RegExp(`${varName}\\s*=\\s*Agent\\s*\\([^)]*role\\s*=\\s*["']([^"']+)["']`, 's').exec(content);
                    const goalMatch = new RegExp(`${varName}\\s*=\\s*Agent\\s*\\([^)]*goal\\s*=\\s*["']([^"']+)["']`, 's').exec(content);
                    agents.push({
                        id: varName.toLowerCase(),
                        name: varName, // Use variable name as the agent name
                        type: this.inferAgentType(roleMatch?.[1] || varName),
                        path: filePath,
                        framework: 'crewai',
                        metadata: {
                            variable: varName,
                            role: roleMatch?.[1],
                            goal: goalMatch?.[1],
                            source: 'python'
                        }
                    });
                }
            }
        }
        // Check YAML config - ENHANCED to capture ALL data
        const yamlFile = path.join(projectPath, 'agents.yaml');
        if (await fs.pathExists(yamlFile)) {
            try {
                const yaml = await Promise.resolve().then(() => __importStar(require('yaml')));
                const content = await fs.readFile(yamlFile, 'utf-8');
                const config = yaml.parse(content);
                // Support both formats: {agents: {...}} and direct agent definitions at root
                const agentConfigs = config.agents || config;
                if (agentConfigs && typeof agentConfigs === 'object') {
                    for (const [key, agentConfig] of Object.entries(agentConfigs)) {
                        const agent = agentConfig;
                        // Skip if this is not an agent definition (e.g., if it's the "agents" key itself)
                        if (key === 'agents' || !agent || typeof agent !== 'object')
                            continue;
                        // Enhanced type inference from tools and role
                        const agentType = this.inferAgentTypeEnhanced(agent.role || key, agent.tools || []);
                        agents.push({
                            id: key,
                            name: key, // Use YAML key as name, not role
                            type: agentType,
                            path: yamlFile,
                            framework: 'crewai',
                            metadata: {
                                // Core config (existing)
                                role: agent.role,
                                goal: agent.goal,
                                // ENHANCED: Additional YAML fields
                                backstory: agent.backstory,
                                tools: agent.tools || [],
                                llm: agent.llm,
                                maxIterations: agent.max_iter,
                                verbose: agent.verbose,
                                allowDelegation: agent.allow_delegation,
                                // Store complete YAML config for integration detection
                                yamlConfig: agent,
                                source: 'yaml',
                                discoveredAt: new Date().toISOString()
                            }
                        });
                    }
                }
            }
            catch (err) {
                console.warn('Failed to parse agents.yaml:', err);
            }
        }
        // Deduplicate agents - prefer YAML over Python (YAML has richer data)
        const uniqueAgents = new Map();
        for (const agent of agents) {
            const key = agent.id.toLowerCase();
            const existing = uniqueAgents.get(key);
            // If we already have this agent, prefer YAML over Python
            if (!existing || agent.metadata?.source === 'yaml') {
                uniqueAgents.set(key, agent);
            }
        }
        return Array.from(uniqueAgents.values());
    }
    /**
     * Enhanced agent type inference using tools and role
     */
    inferAgentTypeEnhanced(role, tools) {
        const lowerRole = role.toLowerCase();
        const toolNames = tools.map(t => typeof t === 'string' ? t.toLowerCase() : '');
        // Infer from tools first (more reliable)
        if (toolNames.some(t => t.includes('search') || t.includes('serper'))) {
            return 'rag';
        }
        if (toolNames.some(t => t.includes('file') || t.includes('read') || t.includes('write'))) {
            return 'task_executor';
        }
        if (toolNames.some(t => t.includes('database') || t.includes('sql'))) {
            return 'rag';
        }
        // Fallback to role-based inference
        if (lowerRole.includes('research') || lowerRole.includes('analyst')) {
            return 'rag';
        }
        if (lowerRole.includes('writer') || lowerRole.includes('content')) {
            return 'task_executor';
        }
        if (lowerRole.includes('manager') || lowerRole.includes('coordinator')) {
            return 'coordinator';
        }
        if (lowerRole.includes('classifier') || lowerRole.includes('categoriz')) {
            return 'classifier';
        }
        return 'custom';
    }
    async analyzeAgent(agentPath) {
        // This would analyze the agent to create a spec
        // For now, return a basic spec
        return {
            agent: {
                id: 'unknown',
                name: 'Unknown Agent',
                type: 'custom',
                path: agentPath,
                framework: 'crewai'
            },
            sampleInputs: [
                "What is your primary function?",
                "Can you help me with a task?",
                "Explain your capabilities"
            ]
        };
    }
    /**
     * NEW: Simple test execution method for SimplifiedTestRunner
     * Enhanced to support flow execution with synthetic inputs
     */
    async executeTest(testSpec, context) {
        // Check if this is a flow test with synthetic inputs
        if (testSpec.syntheticInputs && Object.keys(testSpec.syntheticInputs).length > 0) {
            return await this.executeFlow(testSpec, context);
        }
        // Regular agent/crew execution
        const agent = {
            id: testSpec.agent?.id || 'unknown',
            name: testSpec.agent?.name || 'unknown',
            type: 'custom',
            path: '',
            framework: 'crewai',
            metadata: testSpec.metadata
        };
        return await this.executeCrewAI(agent, testSpec.input, context);
    }
    /**
     * Execute flow with synthetic input injection
     */
    async executeFlow(testSpec, context) {
        const { FlowExecutionMonitor } = await Promise.resolve().then(() => __importStar(require('./flow-execution-monitor')));
        const flowName = testSpec.agent?.name || testSpec.metadata?.flowName || 'unknown_flow';
        // Determine timeout - flows typically take longer
        const flowTimeout = testSpec.flowMetadata?.estimatedDuration
            ? (testSpec.flowMetadata.estimatedDuration * 1000) + 120000 // Add 2 minute buffer
            : Math.max(context.timeoutMs || 60000, 300000); // Minimum 5 minutes for flows
        const monitor = new FlowExecutionMonitor(context.projectPath, {
            timeout: flowTimeout,
            syntheticInputs: testSpec.syntheticInputs || {},
            captureArtifacts: testSpec.flowMetadata?.captureArtifacts || false,
            artifactDirectory: testSpec.flowMetadata?.artifactDirectory,
            dryRunIntegrations: testSpec.flowMetadata?.dryRunIntegrations || false,
            maxHITLWaitTime: 30000 // 30 seconds max wait for HITL responses
        }, context.splitPane);
        try {
            context.splitPane?.addLog(`🌊 Starting flow execution: ${flowName}`, 'info');
            context.splitPane?.addLog(`⏱️ Flow timeout: ${flowTimeout}ms`, 'debug');
            if (testSpec.syntheticInputs && Object.keys(testSpec.syntheticInputs).length > 0) {
                context.splitPane?.addLog(`🤖 Synthetic inputs configured: ${Object.keys(testSpec.syntheticInputs).join(', ')}`, 'info');
            }
            // Start flow execution
            await monitor.startFlow(flowName, testSpec.input);
            // Wait for completion
            const result = await monitor.waitForCompletion();
            if (result.success) {
                context.splitPane?.addLog(`✅ Flow completed successfully (${result.duration}ms, ${result.metadata.hitlInteractions} HITL interactions)`, 'success');
                // Log synthetic inputs used
                if (Object.keys(result.syntheticInputsUsed).length > 0) {
                    context.splitPane?.addLog(`🤖 Synthetic inputs used: ${Object.keys(result.syntheticInputsUsed).join(', ')}`, 'info');
                }
                // Log artifacts captured
                if (result.artifacts.length > 0) {
                    context.splitPane?.addLog(`📁 Artifacts captured: ${result.artifacts.length} files`, 'info');
                }
                return result.finalOutput;
            }
            else {
                throw new Error('Flow execution failed');
            }
        }
        catch (error) {
            context.splitPane?.addLog(`❌ Flow execution failed: ${error.message}`, 'error');
            throw error;
        }
        finally {
            await monitor.forceCleanup();
        }
    }
    /**
     * Legacy method for backward compatibility - simplified without orchestration
     */
    async runTests(agent, spec, context) {
        // This method is simplified - no internal orchestrator
        const testResults = [];
        let totalLatency = 0;
        let successCount = 0;
        // Execute each sample input directly
        for (const input of spec.sampleInputs) {
            try {
                const startTime = Date.now();
                const output = await this.executeCrewAI(agent, input, {
                    projectPath: context.projectPath,
                    timeoutMs: context.timeoutMs || 60000,
                    splitPane: context.splitPane
                });
                const latencyMs = Date.now() - startTime;
                testResults.push({
                    input,
                    output,
                    latencyMs,
                    success: true
                });
                totalLatency += latencyMs;
                successCount++;
            }
            catch (error) {
                const errorMessage = error.message;
                testResults.push({
                    input,
                    output: null,
                    latencyMs: 0,
                    success: false,
                    error: errorMessage
                });
            }
        }
        return {
            agentId: agent.id,
            timestamp: new Date(),
            tests: testResults,
            dimensions: {}, // No pattern analysis in simplified version
            summary: {
                totalTests: testResults.length,
                passed: successCount,
                failed: testResults.length - successCount,
                averageLatencyMs: testResults.length > 0 ? totalLatency / testResults.length : 0,
                successRate: testResults.length > 0 ? successCount / testResults.length : 0
            }
        };
    }
    async executeCrewAI(agent, input, context) {
        // Get agent metadata
        const role = agent.metadata?.role || 'agent';
        const goal = agent.metadata?.goal || 'complete tasks';
        const backstory = agent.metadata?.backstory || '';
        // Get or create a reusable Python process for this project
        const pythonProcess = await this.getOrCreatePythonProcess(context.projectPath, context);
        try {
            const startTime = Date.now();
            // Log that we're making an API call
            if (context.splitPane) {
                context.splitPane.addLog(`🚀 Executing CrewAI agent: ${agent.name} (process reuse)`, 'info');
                // Handle both string and object inputs
                const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
                context.splitPane.addLog(`📝 Input: "${inputStr.substring(0, 50)}..."`, 'info');
            }
            // Create request object
            const request = {
                role: role,
                goal: goal,
                backstory: backstory,
                input: input
            };
            // Send request to the long-running Python process
            pythonProcess.process.stdin?.write(JSON.stringify(request) + '\n');
            // Wait for response
            const response = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Request timeout'));
                }, context.timeoutMs || 60000);
                const onData = (data) => {
                    const output = data.toString();
                    try {
                        const lines = output.split('\n').filter(line => line.trim());
                        for (const line of lines) {
                            if (line.startsWith('{') && line.includes('"success"')) {
                                clearTimeout(timeout);
                                pythonProcess.process.stdout?.off('data', onData);
                                resolve(JSON.parse(line));
                                return;
                            }
                        }
                    }
                    catch (e) {
                        // Continue waiting for valid JSON
                    }
                };
                pythonProcess.process.stdout?.on('data', onData);
                // Handle process errors
                const onError = (error) => {
                    clearTimeout(timeout);
                    pythonProcess.process.stdout?.off('data', onData);
                    pythonProcess.process.off('error', onError);
                    reject(error);
                };
                pythonProcess.process.on('error', onError);
            });
            const latency = Date.now() - startTime;
            if (response.success) {
                if (context.splitPane) {
                    context.splitPane.addLog(`✅ Got response (${response.result.length} chars) in ${latency}ms`, 'success');
                }
                return response.result;
            }
            else {
                throw new Error(response.error || 'Unknown error from Python process');
            }
        }
        catch (error) {
            // If the process failed, remove it from the pool so a new one will be created
            this.processPool.delete(context.projectPath);
            // Provide clear error messages for common issues
            if (error.message?.includes('OPENAI_API_KEY')) {
                throw new Error('OpenAI API key issue: ' + error.message);
            }
            else if (error.message?.includes('timeout')) {
                throw new Error('CrewAI execution timed out. This may indicate an issue with the LLM provider.');
            }
            else {
                throw new Error(`Failed to execute CrewAI agent: ${error.message}`);
            }
        }
        finally {
            // Mark process as not busy
            if (pythonProcess) {
                pythonProcess.busy = false;
                pythonProcess.lastUsed = Date.now();
            }
        }
    }
    async getOrCreatePythonProcess(projectPath, context) {
        // Check if we have an existing process for this project
        let processPool = this.processPool.get(projectPath);
        if (processPool && !processPool.busy && processPool.process.exitCode === null) {
            // Reuse existing process
            processPool.busy = true;
            if (context.splitPane) {
                context.splitPane.addLog(`♻️ Reusing existing Python process`, 'debug');
            }
            return processPool;
        }
        // Create new process
        if (context.splitPane) {
            context.splitPane.addLog(`🐍 Starting new Python process for CrewAI...`, 'info');
        }
        // Create the Python server script
        const serverScript = `
import sys
import os
import json
import time

# Setup environment once
sys.path.insert(0, '${projectPath}')
# Process is already spawned in the correct directory (projectPath)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Import CrewAI once (this is the expensive part)
from crewai import Agent, Task, Crew

print("READY", flush=True)

# Process requests in a loop
while True:
    try:
        # Read request from stdin
        line = sys.stdin.readline().strip()
        if not line or line == "EXIT":
            break
            
        request = json.loads(line)
        
        start_time = time.time()
        
        # Create agent for this request
        agent = Agent(
            role=request['role'],
            goal=request['goal'],
            backstory=request['backstory'],
            verbose=False,
            allow_delegation=False
        )
        
        # Handle both string and object inputs
        input_data = request['input']
        if isinstance(input_data, dict):
            # Extract task from object input
            task_description = input_data.get('task', str(input_data))
        else:
            # Use input directly if it's a string
            task_description = str(input_data)
        
        # Create task
        task = Task(
            description=task_description,
            agent=agent,
            expected_output='A helpful response'
        )
        
        # Create crew
        crew = Crew(
            agents=[agent],
            tasks=[task],
            verbose=False
        )
        
        # Execute
        result = crew.kickoff()
        
        end_time = time.time()
        
        # Send response
        response = {
            "success": True,
            "result": str(result),
            "latency_ms": int((end_time - start_time) * 1000)
        }
        
        print(json.dumps(response), flush=True)
        
    except Exception as e:
        error_response = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_response), flush=True)

print("SERVER_SHUTDOWN", flush=True)
`;
        const serverPath = path.join(projectPath, '.crewai_server.py');
        await fs.writeFile(serverPath, serverScript);
        try {
            // Find the correct Python interpreter (check for venv first)
            const pythonCmd = await this.findPythonInterpreter(projectPath, context);
            if (context.splitPane) {
                context.splitPane.addLog(`🐍 Using Python: ${pythonCmd}`, 'debug');
            }
            // Start the Python server process with RELATIVE path
            // This ensures Python imports work correctly with global installs
            const pythonProcess = (0, child_process_1.spawn)(pythonCmd, ['.crewai_server.py'], {
                cwd: projectPath, // Critical: Execute FROM user's project directory
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env } // Preserve environment variables
            });
            // Wait for the server to be ready
            await new Promise((resolve, reject) => {
                let stderrOutput = '';
                let stdoutOutput = '';
                const timeout = setTimeout(() => {
                    const errorDetails = [
                        `Python server startup timeout after 30s`,
                        `Working directory: ${projectPath}`,
                        `Script file: .crewai_server.py`,
                        stderrOutput ? `Python stderr: ${stderrOutput}` : 'No stderr output',
                        stdoutOutput ? `Python stdout: ${stdoutOutput}` : 'No stdout output (expected "READY")'
                    ];
                    reject(new Error(errorDetails.join('\n')));
                }, 30000);
                pythonProcess.stdout?.on('data', (data) => {
                    const output = data.toString();
                    stdoutOutput += output;
                    if (context.splitPane) {
                        context.splitPane.addLog(`Python stdout: ${output.trim()}`, 'debug');
                    }
                    if (output.includes('READY')) {
                        clearTimeout(timeout);
                        if (context.splitPane) {
                            context.splitPane.addLog(`✅ Python process ready for reuse`, 'success');
                        }
                        resolve();
                    }
                });
                pythonProcess.stderr?.on('data', (data) => {
                    const error = data.toString();
                    stderrOutput += error;
                    if (context.splitPane) {
                        context.splitPane.addLog(`❌ Python stderr: ${error.trim()}`, 'error');
                    }
                });
                pythonProcess.on('error', (error) => {
                    clearTimeout(timeout);
                    reject(new Error(`Failed to spawn Python process: ${error.message}`));
                });
                pythonProcess.on('exit', (code, signal) => {
                    if (code !== null && code !== 0) {
                        clearTimeout(timeout);
                        reject(new Error(`Python process exited with code ${code}. stderr: ${stderrOutput}`));
                    }
                });
            });
            // Create process pool entry
            processPool = {
                process: pythonProcess,
                busy: true,
                projectPath: projectPath,
                lastUsed: Date.now()
            };
            this.processPool.set(projectPath, processPool);
            // Set up cleanup when process exits
            pythonProcess.on('exit', () => {
                this.processPool.delete(projectPath);
                // Clean up server file
                fs.unlink(serverPath).catch(() => { });
            });
            // Start cleanup interval if not already running
            if (!this.cleanupInterval) {
                this.startCleanupInterval();
            }
            return processPool;
        }
        catch (error) {
            // Clean up server file on error
            try {
                await fs.unlink(serverPath);
            }
            catch { }
            if (error instanceof Error && error.message.includes('ENOENT')) {
                throw new Error('Python is not installed. Please install Python 3.8+ to run CrewAI agents.');
            }
            throw error;
        }
    }
    /**
     * Find the correct Python interpreter for the project
     * Checks for virtual environments in order of preference
     */
    async findPythonInterpreter(projectPath, context) {
        // Check for common virtual environment locations
        const venvPaths = [
            path.join(projectPath, 'venv', 'bin', 'python'),
            path.join(projectPath, '.venv', 'bin', 'python'),
            path.join(projectPath, 'env', 'bin', 'python'),
            path.join(projectPath, '.env', 'bin', 'python'),
        ];
        for (const venvPython of venvPaths) {
            if (await fs.pathExists(venvPython)) {
                if (context.splitPane) {
                    context.splitPane.addLog(`✅ Found virtual environment: ${path.basename(path.dirname(path.dirname(venvPython)))}`, 'info');
                }
                return venvPython;
            }
        }
        // Check for Poetry environment
        try {
            const { execSync } = require('child_process');
            const poetryEnv = execSync('poetry env info -p', {
                cwd: projectPath,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
            if (poetryEnv) {
                const poetryPython = path.join(poetryEnv, 'bin', 'python');
                if (await fs.pathExists(poetryPython)) {
                    if (context.splitPane) {
                        context.splitPane.addLog(`✅ Found Poetry environment`, 'info');
                    }
                    return poetryPython;
                }
            }
        }
        catch {
            // Poetry not available or no environment
        }
        // Fall back to system python3 - manually search PATH for reliability
        // This is more reliable than 'which' when running from global npm install
        const pathEnv = process.env.PATH || '';
        const pathDirs = pathEnv.split(':').filter(Boolean);
        // Search PATH directories for python3
        for (const dir of pathDirs) {
            const pythonPath = path.join(dir, 'python3');
            try {
                if (await fs.pathExists(pythonPath)) {
                    // Verify it's executable and can import crewai
                    try {
                        const { execSync } = require('child_process');
                        execSync(`"${pythonPath}" -c "import crewai"`, {
                            stdio: ['pipe', 'pipe', 'pipe'],
                            timeout: 5000
                        });
                        if (context.splitPane) {
                            context.splitPane.addLog(`✅ Found Python with crewai: ${pythonPath}`, 'info');
                        }
                        return pythonPath;
                    }
                    catch {
                        // This python doesn't have crewai, continue searching
                        continue;
                    }
                }
            }
            catch {
                continue;
            }
        }
        // Last resort fallback
        if (context.splitPane) {
            context.splitPane.addLog(`⚠️  Falling back to 'python3' command (no python3 with crewai found in PATH)`, 'warning');
        }
        return 'python3';
    }
    startCleanupInterval() {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [projectPath, processPool] of this.processPool.entries()) {
                // Clean up old, unused processes
                if (!processPool.busy && (now - processPool.lastUsed) > this.maxProcessAge) {
                    processPool.process.stdin?.write('EXIT\n');
                    processPool.process.kill();
                    this.processPool.delete(projectPath);
                }
            }
            // Stop cleanup interval if no processes remain
            if (this.processPool.size === 0 && this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
                this.cleanupInterval = null;
            }
        }, 60000); // Check every minute
    }
    // Clean up all processes when adapter is destroyed
    async cleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        for (const [projectPath, processPool] of this.processPool.entries()) {
            processPool.process.stdin?.write('EXIT\n');
            processPool.process.kill();
        }
        this.processPool.clear();
    }
    inferAgentType(name) {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('research') || lowerName.includes('analyst')) {
            return 'rag';
        }
        if (lowerName.includes('writer') || lowerName.includes('content')) {
            return 'task_executor';
        }
        if (lowerName.includes('manager') || lowerName.includes('coordinator')) {
            return 'coordinator';
        }
        if (lowerName.includes('classifier') || lowerName.includes('categoriz')) {
            return 'classifier';
        }
        return 'custom';
    }
    async detectLLMConfig(projectPath) {
        const config = {};
        // Check for .env file
        const envPath = path.join(projectPath, '.env');
        if (await fs.pathExists(envPath)) {
            const content = await fs.readFile(envPath, 'utf-8');
            if (content.includes('OPENAI_API_KEY')) {
                config.provider = 'openai';
                config.configured = true;
            }
            else if (content.includes('ANTHROPIC_API_KEY')) {
                config.provider = 'anthropic';
                config.configured = true;
            }
        }
        return config;
    }
    async validate(projectPath) {
        const errors = [];
        // Check for required files
        const requiredFiles = ['crew.py', 'agents.py', 'tasks.py'];
        for (const file of requiredFiles) {
            const filePath = path.join(projectPath, file);
            if (!await fs.pathExists(filePath)) {
                errors.push(`Missing required file: ${file}`);
            }
        }
        // Check for Python
        try {
            const { execSync } = require('child_process');
            execSync('python --version', { stdio: 'ignore' });
        }
        catch {
            errors.push('Python is not installed or not in PATH');
        }
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }
    // ===== TEAM/CREW METHODS =====
    /**
     * Discover teams/crews in the project (teams/crews ONLY, NOT flows)
     */
    async discoverTeams(projectPath) {
        const allEntities = [];
        try {
            // 1. Discover traditional crews using team-discovery
            const traditionalCrews = await (0, team_discovery_1.discoverTeams)(projectPath);
            allEntities.push(...traditionalCrews);
            // 2. Discover crews (NOT flows) using enhanced-workflow-discovery
            const enhancedResult = await (0, enhanced_workflow_discovery_1.discoverEnhancedWorkflows)(projectPath);
            allEntities.push(...enhancedResult.crews); // Only crews, NOT flows
            return allEntities;
        }
        catch (error) {
            console.error('Error in adapter discoverTeams:', error);
            // Fallback to traditional discovery only
            return await (0, team_discovery_1.discoverTeams)(projectPath);
        }
    }
    /**
     * Discover teams with detailed statistics
     */
    async discoverTeamsWithDetails(projectPath) {
        return await (0, team_discovery_1.discoverTeamsWithDetails)(projectPath);
    }
    /**
     * NEW: Discover flows separately with complete Phase 1 & 2 analysis
     */
    async discoverFlows(projectPath) {
        try {
            // Use enhanced workflow discovery to get flows with complete analysis
            const enhancedResult = await (0, enhanced_workflow_discovery_1.discoverEnhancedWorkflows)(projectPath);
            // Return only flows with complete Phase 1 & 2 analysis data
            return enhancedResult.flows.map(flow => ({
                ...flow,
                type: 'workflow', // Ensure correct type
                metadata: {
                    ...flow.metadata,
                    language: flow.metadata?.language || 'python', // Fix required field
                    entityType: 'flow', // Mark as flow for proper handling
                    hasCompleteAnalysis: true,
                    phase1Data: {
                        workflowMetadata: flow.workflowMetadata
                    },
                    phase2Data: {
                        flowSignals: flow.flowSignals,
                        yamlConfig: flow.yamlConfig,
                        flowChart: flow.flowChart
                    }
                }
            }));
        }
        catch (error) {
            console.error('Error in adapter discoverFlows:', error);
            return [];
        }
    }
    /**
     * Execute a team/crew test
     */
    async executeTeam(team, input, context) {
        const startTime = Date.now();
        try {
            if (context.splitPane) {
                context.splitPane.addLog(`🚀 Executing CrewAI team: ${team.name}`, 'info');
                const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
                context.splitPane.addLog(`📝 Input: "${inputStr.substring(0, 50)}..."`, 'info');
            }
            // Get or create a reusable Python process for this project
            const pythonProcess = await this.getOrCreateTeamProcess(context.projectPath, context);
            // Create request object for team execution
            const request = {
                teamName: team.name,
                entryPoint: team.execution.entryPoint,
                input: input,
                parameters: team.execution.parameters || {}
            };
            // Send request to the long-running Python process
            pythonProcess.process.stdin?.write(JSON.stringify(request) + '\n');
            // Wait for response
            const response = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Team execution timeout'));
                }, team.execution.timeout || context.timeoutMs || 120000);
                const onData = (data) => {
                    const output = data.toString();
                    try {
                        const lines = output.split('\n').filter(line => line.trim());
                        for (const line of lines) {
                            if (line.startsWith('{') && line.includes('"success"')) {
                                clearTimeout(timeout);
                                pythonProcess.process.stdout?.off('data', onData);
                                resolve(JSON.parse(line));
                                return;
                            }
                        }
                    }
                    catch (e) {
                        // Continue waiting for valid JSON
                    }
                };
                pythonProcess.process.stdout?.on('data', onData);
                // Handle process errors
                const onError = (error) => {
                    clearTimeout(timeout);
                    pythonProcess.process.stdout?.off('data', onData);
                    pythonProcess.process.off('error', onError);
                    reject(error);
                };
                pythonProcess.process.on('error', onError);
            });
            const duration = Date.now() - startTime;
            if (response.success) {
                if (context.splitPane) {
                    context.splitPane.addLog(`✅ Team completed (${response.result.length} chars) in ${duration}ms`, 'success');
                }
                return {
                    teamId: team.id,
                    success: true,
                    output: response.result,
                    duration,
                    metadata: {
                        tokenUsage: response.token_usage,
                        cost: response.cost
                    }
                };
            }
            else {
                throw new Error(response.error || 'Unknown error from team execution');
            }
        }
        catch (error) {
            const duration = Date.now() - startTime;
            if (context.splitPane) {
                context.splitPane.addLog(`❌ Team execution failed: ${error.message}`, 'error');
            }
            return {
                teamId: team.id,
                success: false,
                output: null,
                error: error.message,
                duration
            };
        }
        finally {
            // Mark process as not busy
            const processPool = this.processPool.get(context.projectPath);
            if (processPool) {
                processPool.busy = false;
                processPool.lastUsed = Date.now();
            }
        }
    }
    /**
     * Get or create a Python process specifically for team execution
     */
    async getOrCreateTeamProcess(projectPath, context) {
        // Check if we have an existing process for this project
        let processPool = this.processPool.get(projectPath + '_team');
        if (processPool && !processPool.busy && processPool.process.exitCode === null) {
            // Reuse existing process
            processPool.busy = true;
            if (context.splitPane) {
                context.splitPane.addLog(`♻️ Reusing existing team Python process`, 'debug');
            }
            return processPool;
        }
        // Create new process for team execution
        if (context.splitPane) {
            context.splitPane.addLog(`🐍 Starting new Python process for team execution...`, 'info');
        }
        // Create the Python team server script
        const teamServerScript = `
import sys
import os
import json
import time
import importlib.util

# Setup environment once
sys.path.insert(0, '${projectPath}')
# Process is already spawned in the correct directory (projectPath)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Import CrewAI and project modules
import warnings
import sys

# Suppress ALL warnings for cleaner output
warnings.filterwarnings("ignore")
# Also suppress stderr warnings
sys.stderr = open(os.devnull, 'w')

from crewai import Agent, Task, Crew, Process

# Restore stderr after imports
sys.stderr = sys.__stderr__

# Try to import the crew module
try:
    import crew as crew_module
    print("DEBUG: Successfully imported crew module", flush=True)
except ImportError as e:
    crew_module = None
    print(f"DEBUG: Failed to import crew module: {e}", flush=True)

print("TEAM_READY", flush=True)

# Process team execution requests in a loop
while True:
    try:
        # Read request from stdin
        line = sys.stdin.readline().strip()
        if not line or line == "EXIT":
            break
            
        request = json.loads(line)
        
        start_time = time.time()
        
        team_name = request['teamName']
        entry_point = request['entryPoint']
        input_data = request['input']
        parameters = request.get('parameters', {})
        
        # Execute the team based on entry point
        print(f"DEBUG: Attempting to execute team {team_name}", flush=True)
        print(f"DEBUG: crew_module available: {crew_module is not None}", flush=True)
        
        if crew_module and hasattr(crew_module, team_name):
            print(f"DEBUG: Found crew variable {team_name}", flush=True)
            # Direct crew variable execution
            crew_instance = getattr(crew_module, team_name)
            print(f"DEBUG: Got crew instance: {type(crew_instance)}", flush=True)
            
            # Handle different input formats
            if isinstance(input_data, dict):
                print(f"DEBUG: Executing crew with dict input: {input_data}", flush=True)
                result = crew_instance.kickoff(inputs=input_data)
            else:
                # Convert string input to dict format
                inputs = {"task": str(input_data)}
                print(f"DEBUG: Executing crew with converted input: {inputs}", flush=True)
                result = crew_instance.kickoff(inputs=inputs)
                
        elif crew_module and hasattr(crew_module, 'run_crew'):
            print(f"DEBUG: Using run_crew function", flush=True)
            # Use run_crew function if available
            if isinstance(input_data, dict):
                result = crew_module.run_crew(inputs=input_data)
            else:
                inputs = {"task": str(input_data)}
                result = crew_module.run_crew(inputs=inputs)
                
        else:
            print(f"DEBUG: Using fallback execution", flush=True)
            # Fallback: try to find and execute the crew
            result = f"Team {team_name} executed with input: {input_data}"
        
        print(f"DEBUG: Crew execution completed, result type: {type(result)}", flush=True)
        print(f"DEBUG: Result length: {len(str(result)) if result else 0} characters", flush=True)
        
        end_time = time.time()
        
        # Send response
        response = {
            "success": True,
            "result": str(result),
            "latency_ms": int((end_time - start_time) * 1000),
            "team_name": team_name
        }
        
        print(json.dumps(response), flush=True)
        
    except Exception as e:
        error_response = {
            "success": False,
            "error": str(e),
            "team_name": request.get('teamName', 'unknown')
        }
        print(json.dumps(error_response), flush=True)

print("TEAM_SERVER_SHUTDOWN", flush=True)
`;
        const teamServerPath = path.join(projectPath, '.crewai_team_server.py');
        await fs.writeFile(teamServerPath, teamServerScript);
        try {
            // Start the Python team server process with correct working directory
            const pythonProcess = (0, child_process_1.spawn)('python3', ['.crewai_team_server.py'], {
                cwd: projectPath,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            // Wait for the server to be ready
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Team Python server startup timeout'));
                }, 30000);
                pythonProcess.stdout?.on('data', (data) => {
                    const output = data.toString();
                    if (output.includes('TEAM_READY')) {
                        clearTimeout(timeout);
                        if (context.splitPane) {
                            context.splitPane.addLog(`✅ Team Python process ready`, 'success');
                        }
                        resolve();
                    }
                });
                pythonProcess.stderr?.on('data', (data) => {
                    const error = data.toString();
                    if (context.splitPane) {
                        context.splitPane.addLog(`❌ Team Python Error: ${error}`, 'error');
                    }
                });
                pythonProcess.on('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });
            // Create process pool entry for team execution
            processPool = {
                process: pythonProcess,
                busy: true,
                projectPath: projectPath + '_team',
                lastUsed: Date.now()
            };
            this.processPool.set(projectPath + '_team', processPool);
            // Set up cleanup when process exits
            pythonProcess.on('exit', () => {
                this.processPool.delete(projectPath + '_team');
                // Clean up server file
                fs.unlink(teamServerPath).catch(() => { });
            });
            return processPool;
        }
        catch (error) {
            // Clean up server file on error
            try {
                await fs.unlink(teamServerPath);
            }
            catch { }
            if (error instanceof Error && error.message.includes('ENOENT')) {
                throw new Error('Python is not installed. Please install Python 3.8+ to run CrewAI teams.');
            }
            throw error;
        }
    }
}
exports.CrewAIAdapter = CrewAIAdapter;
//# sourceMappingURL=adapter.js.map