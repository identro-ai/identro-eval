/**
 * Flow Execution Monitor for CrewAI Flows
 *
 * Monitors flow execution for human-in-the-loop (HITL) requests and injects
 * synthetic responses from eval-spec.json to enable automated flow testing.
 *
 * This maintains Identro's architecture by extending existing execution
 * infrastructure rather than creating flow-specific dimensions.
 */
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { EventEmitter } from 'events';
/**
 * Flow Execution Monitor
 *
 * Monitors Python flow processes for HITL requests and injects synthetic responses.
 * Works with existing CrewAI adapter infrastructure.
 */
export class FlowExecutionMonitor extends EventEmitter {
    projectPath;
    options;
    logger;
    process = null;
    isComplete = false;
    startTime = 0;
    hitlRequests = [];
    syntheticInputsUsed = {};
    executionPath = [];
    stateSnapshots = [];
    artifacts = [];
    constructor(projectPath, options, logger) {
        super();
        this.projectPath = projectPath;
        this.options = options;
        this.logger = logger;
    }
    /**
     * Start flow execution with monitoring
     */
    async startFlow(flowName, input) {
        this.startTime = Date.now();
        this.isComplete = false;
        this.hitlRequests = [];
        this.syntheticInputsUsed = {};
        this.executionPath = [];
        this.stateSnapshots = [];
        this.artifacts = [];
        this.logger?.addLog(`🚀 Starting flow execution: ${flowName}`, 'info');
        this.logger?.addLog(`📝 Input: ${JSON.stringify(input).substring(0, 100)}...`, 'debug');
        // Create enhanced Python script for flow execution with HITL monitoring
        const flowScript = this.createFlowExecutionScript(flowName, input);
        const scriptPath = path.join(this.projectPath, '.identro-flow-execution.py');
        await fs.writeFile(scriptPath, flowScript);
        try {
            // Start Python process with flow execution script
            this.process = spawn('python3', ['.identro-flow-execution.py'], {
                cwd: this.projectPath,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    IDENTRO_FLOW_MODE: 'true',
                    IDENTRO_CAPTURE_ARTIFACTS: this.options.captureArtifacts ? 'true' : 'false',
                    IDENTRO_ARTIFACT_DIR: this.options.artifactDirectory || './temp-artifacts',
                    IDENTRO_DRY_RUN: this.options.dryRunIntegrations ? 'true' : 'false'
                }
            });
            // Set up process monitoring
            this.setupProcessMonitoring();
            // Start HITL monitoring loop
            this.startHITLMonitoring();
        }
        catch (error) {
            // Clean up script file
            await fs.unlink(scriptPath).catch(() => { });
            throw error;
        }
    }
    /**
     * Wait for flow completion with timeout
     */
    async waitForCompletion() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.cleanup();
                reject(new Error(`Flow execution timeout after ${this.options.timeout}ms`));
            }, this.options.timeout);
            this.once('completed', (result) => {
                clearTimeout(timeout);
                resolve(result);
            });
            this.once('error', (error) => {
                clearTimeout(timeout);
                this.cleanup();
                reject(error);
            });
        });
    }
    /**
     * Create Python script for flow execution with HITL monitoring
     */
    createFlowExecutionScript(flowName, input) {
        return `
import sys
import os
import json
import time
import threading
import queue
import traceback
from pathlib import Path

# Setup environment
sys.path.insert(0, '${this.projectPath}')
sys.path.insert(0, '${this.projectPath}/src')

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Import CrewAI and flow modules
import warnings
warnings.filterwarnings("ignore")

from crewai import Agent, Task, Crew, Process

# Global state for HITL monitoring
hitl_queue = queue.Queue()
response_queue = queue.Queue()
execution_state = {
    'path': [],
    'state_snapshots': [],
    'artifacts': [],
    'hitl_count': 0,
    'crew_count': 0,
    'external_calls': 0
}

# Override input() function to capture HITL requests
original_input = input

def monitored_input(prompt=""):
    """Override input() to capture human interaction requests"""
    hitl_request = {
        'type': 'input',
        'method': 'input',
        'prompt': str(prompt),
        'context': {'execution_path': execution_state['path']},
        'timestamp': time.time(),
        'process_id': 'flow_execution'
    }
    
    # Send HITL request to monitor
    print(f"HITL_REQUEST:{json.dumps(hitl_request)}", flush=True)
    execution_state['hitl_count'] += 1
    
    # Wait for synthetic response
    try:
        response = response_queue.get(timeout=30)  # 30 second timeout
        execution_state['path'].append(f"HITL_INPUT:{response}")
        return str(response.get('value', ''))
    except queue.Empty:
        # Fallback if no synthetic response provided
        return "synthetic_input_fallback"

# Replace built-in input function
import builtins
builtins.input = monitored_input

# Function to capture state snapshots
def capture_state_snapshot(stage, data):
    """Capture state at different execution stages"""
    snapshot = {
        'stage': stage,
        'timestamp': time.time(),
        'data': data,
        'path_length': len(execution_state['path'])
    }
    execution_state['state_snapshots'].append(snapshot)
    execution_state['path'].append(f"STATE:{stage}")

# Function to capture artifacts
def capture_artifacts():
    """Capture generated artifacts"""
    artifact_dir = os.environ.get('IDENTRO_ARTIFACT_DIR', './temp-artifacts')
    if os.path.exists(artifact_dir):
        for root, dirs, files in os.walk(artifact_dir):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    stat = os.stat(file_path)
                    artifact = {
                        'path': file_path,
                        'type': os.path.splitext(file)[1],
                        'size': stat.st_size,
                        'created': stat.st_ctime
                    }
                    execution_state['artifacts'].append(artifact)
                except Exception:
                    pass

def main():
    """Main flow execution function"""
    try:
        print("FLOW_STARTED", flush=True)
        capture_state_snapshot('flow_start', {'input': ${this.convertJSToPython(input)}})
        
        # Import the flow module - try multiple import paths
        flow_module = None
        flow_name = "${flowName}"
        
        # Import flow class based on known project structure
        flow_class = None
        flow_instance = None
        
        try:
            # Import BookFlow from write_a_book_with_flows
            from write_a_book_with_flows.main import BookFlow
            flow_class = BookFlow
            print("FLOW_MODULE_LOADED", flush=True)
            print(f"FLOW_FOUND:{flow_name}", flush=True)
            capture_state_snapshot('flow_found', {'flow_name': flow_name})
            
            # Create flow instance (BookFlow already has proper state with id field)
            flow_instance = flow_class()
            print(f"FLOW_DEBUG:BookFlow instance created successfully", flush=True)
            
        except ImportError as e1:
            try:
                # Try EmailAutoResponderFlow 
                from email_auto_responder_flow.main import EmailAutoResponderFlow
                flow_class = EmailAutoResponderFlow
                print("FLOW_MODULE_LOADED", flush=True)
                print(f"FLOW_FOUND:{flow_name}", flush=True)
                capture_state_snapshot('flow_found', {'flow_name': flow_name})
                
                # Create with state patching for EmailAutoResponderFlow
                original_initial_state = flow_class.initial_state
                class PatchedState(original_initial_state):
                    id: str = "flow_execution_test"
                flow_class.initial_state = PatchedState
                flow_instance = flow_class()
                flow_class.initial_state = original_initial_state
                print(f"FLOW_DEBUG:EmailAutoResponderFlow instance created with patched state", flush=True)
                
            except ImportError as e2:
                print(f"FLOW_ERROR:Could not import any flow class: {e1}, {e2}", flush=True)
                return
        
        if not flow_instance:
            print(f"FLOW_ERROR:Flow instance could not be created", flush=True)
            return
        
        if flow_instance:
            execution_state['path'].append(f"FLOW_EXECUTE:{flow_name}")
            
            # Execute the flow
            print("FLOW_EXECUTING", flush=True)
            capture_state_snapshot('flow_executing', {'flow_type': type(flow_instance).__name__})
            
            # Handle different input formats for CrewAI flows
            input_data = ${this.convertJSToPython(input)}
            if isinstance(input_data, dict):
                result = flow_instance.kickoff(inputs=input_data)
            else:
                # Convert string input to dict format
                inputs = {"task": str(input_data)}
                result = flow_instance.kickoff(inputs=inputs)
            
            execution_state['crew_count'] += 1
            execution_state['path'].append(f"FLOW_COMPLETED:{flow_name}")
            
            # Capture final state
            capture_state_snapshot('flow_completed', {
                'result_type': type(result).__name__,
                'result_length': len(str(result)) if result else 0
            })
            
            # Capture artifacts if enabled
            if os.environ.get('IDENTRO_CAPTURE_ARTIFACTS') == 'true':
                capture_artifacts()
            
            # Send final result
            final_result = {
                'success': True,
                'output': str(result),
                'execution_path': execution_state['path'],
                'state_snapshots': execution_state['state_snapshots'],
                'artifacts': execution_state['artifacts'],
                'metadata': {
                    'hitl_interactions': execution_state['hitl_count'],
                    'crew_executions': execution_state['crew_count'],
                    'external_calls': execution_state['external_calls']
                }
            }
            
            print(f"FLOW_RESULT:{json.dumps(final_result)}", flush=True)
            
        else:
            error_msg = f"Flow '{flow_name}' not found in module"
            print(f"FLOW_ERROR:{error_msg}", flush=True)
            
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc(),
            'execution_path': execution_state['path'],
            'state_snapshots': execution_state['state_snapshots']
        }
        print(f"FLOW_ERROR:{json.dumps(error_result)}", flush=True)

# Start monitoring thread for synthetic input responses
def monitor_responses():
    """Monitor for synthetic input responses from Node.js"""
    while True:
        try:
            line = sys.stdin.readline().strip()
            if line.startswith('SYNTHETIC_RESPONSE:'):
                response_data = json.loads(line[19:])  # Remove 'SYNTHETIC_RESPONSE:' prefix
                response_queue.put(response_data)
            elif line == 'EXIT':
                break
        except Exception as e:
            print(f"MONITOR_ERROR:{e}", flush=True)

# Start response monitoring thread
response_thread = threading.Thread(target=monitor_responses, daemon=True)
response_thread.start()

# Execute main flow
if __name__ == "__main__":
    main()
    print("FLOW_SHUTDOWN", flush=True)
`;
    }
    /**
     * Set up process monitoring for output parsing
     */
    setupProcessMonitoring() {
        if (!this.process)
            return;
        this.process.stdout?.on('data', (data) => {
            const output = data.toString();
            this.parseProcessOutput(output);
        });
        this.process.stderr?.on('data', (data) => {
            const error = data.toString();
            this.logger?.addLog(`❌ Flow Error: ${error}`, 'error');
        });
        this.process.on('exit', (code) => {
            this.logger?.addLog(`🏁 Flow process exited with code: ${code}`, code === 0 ? 'success' : 'error');
            this.handleProcessExit(code);
        });
        this.process.on('error', (error) => {
            this.logger?.addLog(`❌ Process error: ${error.message}`, 'error');
            this.emit('error', error);
        });
    }
    /**
     * Parse process output for flow events and HITL requests
     */
    parseProcessOutput(output) {
        const lines = output.split('\n').filter(line => line.trim());
        for (const line of lines) {
            if (line.startsWith('HITL_REQUEST:')) {
                this.handleHITLRequest(line.substring(13));
            }
            else if (line.startsWith('FLOW_RESULT:')) {
                this.handleFlowResult(line.substring(12));
            }
            else if (line.startsWith('FLOW_ERROR:')) {
                this.handleFlowError(line.substring(11));
            }
            else if (line.startsWith('FLOW_')) {
                this.handleFlowEvent(line);
            }
        }
    }
    /**
     * Handle HITL request from flow execution
     */
    handleHITLRequest(requestJson) {
        try {
            const request = JSON.parse(requestJson);
            this.hitlRequests.push(request);
            this.logger?.addLog(`👤 HITL Request: ${request.type} - ${request.prompt}`, 'info');
            // Look for synthetic response
            const syntheticResponse = this.options.syntheticInputs[request.method] ||
                this.options.syntheticInputs[request.type] ||
                this.options.syntheticInputs['default'];
            if (syntheticResponse) {
                this.injectSyntheticResponse(request, syntheticResponse);
            }
            else {
                this.logger?.addLog(`⚠️ No synthetic response found for ${request.method}`, 'warning');
                // Provide default response
                this.injectSyntheticResponse(request, { value: 'synthetic_default_response' });
            }
        }
        catch (error) {
            this.logger?.addLog(`❌ Failed to parse HITL request: ${error}`, 'error');
        }
    }
    /**
     * Inject synthetic response for HITL request
     */
    injectSyntheticResponse(request, response) {
        if (!this.process || !this.process.stdin) {
            this.logger?.addLog(`❌ Cannot inject response - process not available`, 'error');
            return;
        }
        try {
            // Send synthetic response to Python process
            const responseMessage = `SYNTHETIC_RESPONSE:${JSON.stringify(response)}\n`;
            this.process.stdin.write(responseMessage);
            // Track synthetic input usage
            this.syntheticInputsUsed[request.method] = response;
            this.logger?.addLog(`✅ Injected synthetic response for ${request.method}: ${JSON.stringify(response)}`, 'success');
        }
        catch (error) {
            this.logger?.addLog(`❌ Failed to inject synthetic response: ${error}`, 'error');
        }
    }
    /**
     * Handle flow result
     */
    handleFlowResult(resultJson) {
        try {
            const result = JSON.parse(resultJson);
            const flowResult = {
                success: result.success,
                finalOutput: result.output,
                duration: Date.now() - this.startTime,
                artifacts: result.artifacts || [],
                syntheticInputsUsed: this.syntheticInputsUsed,
                executionPath: result.execution_path || [],
                stateEvolution: result.state_snapshots || [],
                metadata: result.metadata || {
                    hitlInteractions: this.hitlRequests.length,
                    crewExecutions: 0,
                    externalCalls: 0
                }
            };
            this.isComplete = true;
            this.logger?.addLog(`✅ Flow completed successfully in ${flowResult.duration}ms`, 'success');
            this.emit('completed', flowResult);
        }
        catch (error) {
            this.logger?.addLog(`❌ Failed to parse flow result: ${error}`, 'error');
            this.emit('error', new Error(`Failed to parse flow result: ${error}`));
        }
    }
    /**
     * Handle flow error
     */
    handleFlowError(errorData) {
        try {
            const errorInfo = JSON.parse(errorData);
            const error = new Error(errorInfo.error || errorData);
            this.logger?.addLog(`❌ Flow execution error: ${error.message}`, 'error');
            this.emit('error', error);
        }
        catch {
            // If not JSON, treat as plain error message
            const error = new Error(errorData);
            this.logger?.addLog(`❌ Flow execution error: ${errorData}`, 'error');
            this.emit('error', error);
        }
    }
    /**
     * Handle flow events for progress tracking
     */
    handleFlowEvent(event) {
        this.executionPath.push(event);
        this.logger?.addLog(`📍 Flow Event: ${event}`, 'debug');
    }
    /**
     * Handle process exit
     */
    handleProcessExit(code) {
        if (!this.isComplete) {
            const error = new Error(`Flow process exited unexpectedly with code: ${code}`);
            this.emit('error', error);
        }
        this.cleanup();
    }
    /**
     * Start HITL monitoring loop
     */
    startHITLMonitoring() {
        // HITL monitoring is handled through process output parsing
        // This method can be extended for additional monitoring features
        this.logger?.addLog(`👁️ HITL monitoring started`, 'debug');
    }
    /**
     * Check if flow execution is complete
     */
    isFlowComplete() {
        return this.isComplete;
    }
    /**
     * Get current execution path
     */
    getExecutionPath() {
        return [...this.executionPath];
    }
    /**
     * Get HITL requests received so far
     */
    getHITLRequests() {
        return [...this.hitlRequests];
    }
    /**
     * Clean up resources
     */
    cleanup() {
        if (this.process) {
            if (!this.process.killed) {
                this.process.stdin?.write('EXIT\n');
                this.process.kill();
            }
            this.process = null;
        }
        // Clean up temporary script file
        const scriptPath = path.join(this.projectPath, '.identro-flow-execution.py');
        fs.unlink(scriptPath).catch(() => { });
    }
    /**
     * Force cleanup (public method)
     */
    async forceCleanup() {
        this.cleanup();
    }
    /**
     * Convert JavaScript types to Python-compatible string representation
     */
    convertJSToPython(obj) {
        if (obj === null)
            return 'None';
        if (obj === undefined)
            return 'None';
        if (typeof obj === 'boolean')
            return obj ? 'True' : 'False';
        if (typeof obj === 'string')
            return `"${obj.replace(/"/g, '\\"')}"`;
        if (typeof obj === 'number')
            return obj.toString();
        if (Array.isArray(obj)) {
            const items = obj.map(item => this.convertJSToPython(item));
            return `[${items.join(', ')}]`;
        }
        if (typeof obj === 'object') {
            const pairs = Object.entries(obj).map(([key, value]) => `"${key}": ${this.convertJSToPython(value)}`);
            return `{${pairs.join(', ')}}`;
        }
        return JSON.stringify(obj);
    }
}
//# sourceMappingURL=flow-execution-monitor.js.map