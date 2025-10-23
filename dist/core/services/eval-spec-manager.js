"use strict";
/**
 * Eval Spec Manager
 *
 * Core operations for managing the eval-spec.json living document
 * Handles loading, saving, versioning, and change detection
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
exports.EvalSpecManager = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const eval_spec_1 = require("../types/eval-spec");
class EvalSpecManager {
    identroPath;
    specPath;
    historyPath;
    constructor(projectPath) {
        this.identroPath = path.join(projectPath, '.identro');
        this.specPath = path.join(this.identroPath, 'eval-spec.json');
        this.historyPath = path.join(this.identroPath, 'history');
    }
    /**
     * Initialize the .identro directory structure
     */
    async initialize() {
        // Create .identro directory if it doesn't exist
        await fs.mkdir(this.identroPath, { recursive: true });
        // Create history directory
        await fs.mkdir(this.historyPath, { recursive: true });
    }
    /**
     * Load the eval spec, creating a default if it doesn't exist
     */
    async load() {
        try {
            const content = await fs.readFile(this.specPath, 'utf-8');
            const spec = JSON.parse(content);
            // Validate the spec
            const validation = (0, eval_spec_1.validateEvalSpecSafe)(spec);
            if (validation.success && validation.data) {
                return validation.data;
            }
            else {
                console.warn('Invalid eval spec, creating new one');
                console.warn('Validation errors:', validation.errors?.issues?.slice(0, 3)); // Show first 3 errors
                return this.createDefault();
            }
        }
        catch (error) {
            // File doesn't exist, create default
            return this.createDefault();
        }
    }
    /**
     * Save the eval spec with optional backup
     */
    async save(spec, options) {
        // Update metadata
        spec.metadata = spec.metadata || {};
        spec.metadata.updated_at = new Date().toISOString();
        // Create backup if requested
        if (options?.backup) {
            await this.createBackup();
        }
        // Save the spec
        const content = JSON.stringify(spec, null, 2);
        await fs.writeFile(this.specPath, content, 'utf-8');
        // Create history snapshot
        await this.createHistorySnapshot(spec);
    }
    /**
     * Create a backup of the current spec
     */
    async createBackup() {
        try {
            const backupPath = path.join(this.identroPath, 'eval-spec.backup.json');
            await fs.copyFile(this.specPath, backupPath);
        }
        catch (error) {
            // Ignore if file doesn't exist
        }
    }
    /**
     * Create a history snapshot
     */
    async createHistorySnapshot(spec) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const version = spec.version || '1.0';
        const filename = `eval-spec-${timestamp}-v${version}.json`;
        const historyFile = path.join(this.historyPath, filename);
        const content = JSON.stringify(spec, null, 2);
        await fs.writeFile(historyFile, content, 'utf-8');
        // Clean up old history files (keep last 10)
        await this.cleanupHistory();
    }
    /**
     * Clean up old history files
     */
    async cleanupHistory() {
        try {
            const files = await fs.readdir(this.historyPath);
            const historyFiles = files
                .filter(f => f.startsWith('eval-spec-'))
                .sort()
                .reverse();
            // Keep only the last 10 files
            const filesToDelete = historyFiles.slice(10);
            for (const file of filesToDelete) {
                await fs.unlink(path.join(this.historyPath, file));
            }
        }
        catch (error) {
            // Ignore errors
        }
    }
    /**
     * Create a default eval spec
     */
    createDefault() {
        const spec = (0, eval_spec_1.createDefaultEvalSpec)('crewai', 'python');
        spec.projectId = this.generateProjectId();
        spec.lastScanned = new Date().toISOString();
        return spec;
    }
    /**
     * Generate a unique project ID
     */
    generateProjectId() {
        return crypto.randomBytes(16).toString('hex');
    }
    /**
     * Detect changes between current spec and discovered agents
     */
    async detectChanges(spec, discoveredAgents) {
        const result = {
            new: [],
            modified: [],
            unchanged: [],
            removed: []
        };
        // Check each discovered agent
        for (const agent of discoveredAgents) {
            const existingAgent = spec.agents[agent.id];
            if (!existingAgent) {
                // New agent
                result.new.push(agent.id);
            }
            else {
                // Check if agent has been modified
                const currentHash = this.hashAgentSource(agent.source);
                const existingHash = existingAgent.discovered?.sourceHash;
                if (currentHash !== existingHash) {
                    result.modified.push(agent.id);
                }
                else {
                    result.unchanged.push(agent.id);
                }
            }
        }
        // Check for removed agents
        const discoveredIds = new Set(discoveredAgents.map(a => a.id));
        for (const agentId in spec.agents) {
            if (!discoveredIds.has(agentId)) {
                result.removed.push(agentId);
            }
        }
        return result;
    }
    /**
     * Hash agent source code for change detection
     */
    hashAgentSource(source) {
        return crypto.createHash('sha256').update(source).digest('hex');
    }
    /**
     * Update agent in spec with new information
     */
    async updateAgent(spec, agentInfo, contract, testSpecs) {
        const agentId = agentInfo.id;
        const now = new Date().toISOString();
        // Get or create agent spec
        let agentSpec = spec.agents[agentId];
        if (!agentSpec) {
            agentSpec = {
                type: 'custom',
                description: agentInfo.description || ''
                // Removed evaluation_spec since it's now optional and we use testSpecs instead
            };
            spec.agents[agentId] = agentSpec;
        }
        // Update discovery metadata
        if (!agentSpec.discovered) {
            agentSpec.discovered = {
                firstSeen: now,
                lastModified: now,
                sourceHash: this.hashAgentSource(agentInfo.source),
                path: agentInfo.path,
                version: 1
            };
        }
        else {
            const currentHash = this.hashAgentSource(agentInfo.source);
            if (currentHash !== agentSpec.discovered.sourceHash) {
                agentSpec.discovered.sourceHash = currentHash;
                agentSpec.discovered.lastModified = now;
                agentSpec.discovered.version = (agentSpec.discovered.version || 1) + 1;
            }
        }
        // Update contract if provided
        if (contract) {
            agentSpec.contract = contract;
        }
        // Merge test specs, preserving user modifications
        if (testSpecs) {
            agentSpec.testSpecs = agentSpec.testSpecs || {};
            for (const [dimension, newSpecs] of Object.entries(testSpecs)) {
                const existingSpecs = agentSpec.testSpecs[dimension];
                if (!existingSpecs) {
                    // New dimension, add all tests
                    agentSpec.testSpecs[dimension] = newSpecs;
                }
                else {
                    // Merge tests, preserving user modifications
                    const mergedTests = this.mergeTestSpecs(existingSpecs.tests, newSpecs.tests);
                    agentSpec.testSpecs[dimension] = {
                        ...newSpecs,
                        tests: mergedTests
                    };
                }
            }
        }
        // Initialize performance tracking if not present
        if (!agentSpec.performance) {
            agentSpec.performance = {
                totalRuns: 0,
                averageScore: 0,
                scoreHistory: []
            };
        }
    }
    /**
     * Merge test specs, preserving user modifications
     */
    mergeTestSpecs(existing, newTests) {
        const merged = [];
        const processedIds = new Set();
        // Keep user-modified tests
        for (const test of existing) {
            if (test.userModified) {
                merged.push(test);
                processedIds.add(test.id);
            }
        }
        // Add new tests that aren't already present
        for (const test of newTests) {
            if (!processedIds.has(test.id)) {
                merged.push(test);
            }
        }
        return merged;
    }
    /**
     * Update performance metrics after a test run
     */
    async updatePerformance(spec, agentId, dimension, score, passed, details) {
        const agent = spec.agents[agentId];
        if (!agent)
            return;
        // Initialize performance if not present
        if (!agent.performance) {
            agent.performance = {
                totalRuns: 0,
                averageScore: 0,
                scoreHistory: []
            };
        }
        const performance = agent.performance;
        // Update metrics
        performance.lastRun = new Date().toISOString();
        performance.totalRuns++;
        // Add to history
        const historyEntry = {
            timestamp: new Date().toISOString(),
            dimension,
            score,
            passed,
            details
        };
        performance.scoreHistory.push(historyEntry);
        // Keep only last 100 entries
        if (performance.scoreHistory.length > 100) {
            performance.scoreHistory = performance.scoreHistory.slice(-100);
        }
        // Calculate average score
        const scores = performance.scoreHistory.map(h => h.score);
        performance.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        // Calculate trends
        performance.trends = this.calculateTrends(performance.scoreHistory);
    }
    /**
     * Calculate performance trends
     */
    calculateTrends(history) {
        if (history.length < 5) {
            return { improving: false, degrading: false, stable: true };
        }
        // Get last 10 scores
        const recentScores = history.slice(-10).map(h => h.score);
        const olderScores = history.slice(-20, -10).map(h => h.score);
        if (olderScores.length === 0) {
            return { improving: false, degrading: false, stable: true };
        }
        const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
        const threshold = 0.05; // 5% change threshold
        if (recentAvg > olderAvg + threshold) {
            return { improving: true, degrading: false, stable: false };
        }
        else if (recentAvg < olderAvg - threshold) {
            return { improving: false, degrading: true, stable: false };
        }
        else {
            return { improving: false, degrading: false, stable: true };
        }
    }
    /**
     * Add a test run to history
     */
    async addTestRun(spec, runId, agentsTestedCount, dimensionsRun, overallScore, duration, tokenUsage, cost) {
        // Initialize test history if not present
        if (!spec.testHistory) {
            spec.testHistory = { runs: [] };
        }
        const entry = {
            runId,
            timestamp: new Date().toISOString(),
            agentsTestedCount,
            dimensionsRun,
            overallScore,
            duration,
            tokenUsage,
            cost
        };
        spec.testHistory.runs.push(entry);
        // Keep only last 50 runs
        if (spec.testHistory.runs.length > 50) {
            spec.testHistory.runs = spec.testHistory.runs.slice(-50);
        }
    }
    /**
     * Get test specs for an agent and dimension
     */
    getTestSpecs(spec, agentId, dimension) {
        const agent = spec.agents[agentId];
        if (!agent || !agent.testSpecs || !agent.testSpecs[dimension]) {
            return [];
        }
        return agent.testSpecs[dimension].tests;
    }
    /**
     * Mark a test as user-modified
     */
    markTestAsModified(spec, agentId, dimension, testId, notes) {
        const agent = spec.agents[agentId];
        if (!agent || !agent.testSpecs || !agent.testSpecs[dimension]) {
            return;
        }
        const test = agent.testSpecs[dimension].tests.find(t => t.id === testId);
        if (test) {
            test.userModified = true;
            if (notes) {
                test.userNotes = notes;
            }
        }
    }
    /**
     * Update agent test specs with LLM-generated tests
     */
    async updateAgentTestSpecs(spec, agentId, testSpecs) {
        const agent = spec.agents[agentId];
        if (!agent) {
            throw new Error(`Agent ${agentId} not found in spec`);
        }
        // Initialize testSpecs if not present
        if (!agent.testSpecs) {
            agent.testSpecs = {};
        }
        // Update test specs for each dimension
        for (const [dimension, dimensionSpecs] of Object.entries(testSpecs)) {
            agent.testSpecs[dimension] = dimensionSpecs;
        }
        // Update metadata
        spec.metadata = spec.metadata || {};
        spec.metadata.updated_at = new Date().toISOString();
    }
    /**
     * Update team in spec with new information
     */
    async updateTeam(spec, teamInfo, contract, testSpecs) {
        const teamName = teamInfo.name;
        const now = new Date().toISOString();
        // Initialize teams section if not present
        if (!spec.teams) {
            spec.teams = {};
        }
        // Get or create team spec
        let teamSpec = spec.teams[teamName];
        if (!teamSpec) {
            teamSpec = {
                name: teamName,
                members: teamInfo.members,
                coordinator: teamInfo.coordinator,
                description: teamInfo.description || ''
            };
            spec.teams[teamName] = teamSpec;
        }
        else {
            // Update basic info
            teamSpec.members = teamInfo.members;
            if (teamInfo.coordinator)
                teamSpec.coordinator = teamInfo.coordinator;
            if (teamInfo.description)
                teamSpec.description = teamInfo.description;
        }
        // Update contract if provided
        if (contract) {
            teamSpec.contract = contract;
        }
        // Update test specs if provided
        if (testSpecs) {
            teamSpec.testSpecs = teamSpec.testSpecs || {};
            for (const [dimension, newSpecs] of Object.entries(testSpecs)) {
                const existingSpecs = teamSpec.testSpecs[dimension];
                if (!existingSpecs) {
                    // New dimension, add all tests
                    teamSpec.testSpecs[dimension] = newSpecs;
                }
                else {
                    // Merge tests, preserving user modifications
                    const mergedTests = this.mergeTestSpecs(existingSpecs.tests, newSpecs.tests);
                    teamSpec.testSpecs[dimension] = {
                        ...newSpecs,
                        tests: mergedTests
                    };
                }
            }
        }
        // Update metadata
        spec.metadata = spec.metadata || {};
        spec.metadata.updated_at = now;
    }
    /**
     * Update flow in spec with new information
     */
    async updateFlow(spec, flowInfo, analysis, testSpecs) {
        const flowName = flowInfo.name;
        const now = new Date().toISOString();
        // Initialize flows section if not present
        if (!spec.flows) {
            spec.flows = {};
        }
        // Get or create flow spec
        let flowSpec = spec.flows[flowName];
        if (!flowSpec) {
            flowSpec = {
                name: flowName,
                type: 'workflow',
                description: flowInfo.description || ''
            };
            spec.flows[flowName] = flowSpec;
        }
        else {
            // Update basic info
            if (flowInfo.description)
                flowSpec.description = flowInfo.description;
        }
        // Initialize discovery metadata if not present
        if (!flowSpec.discovered) {
            flowSpec.discovered = {
                firstSeen: now,
                lastModified: now,
                path: flowInfo.path,
                version: 1
            };
        }
        // Update analysis if provided
        if (analysis) {
            flowSpec.analysis = analysis;
        }
        // Update test specs if provided
        if (testSpecs) {
            flowSpec.testSpecs = flowSpec.testSpecs || {};
            for (const [dimension, newSpecs] of Object.entries(testSpecs)) {
                flowSpec.testSpecs[dimension] = newSpecs;
            }
        }
        // Initialize performance tracking if not present
        if (!flowSpec.performance) {
            flowSpec.performance = {
                totalRuns: 0,
                averageScore: 0,
                scoreHistory: []
            };
        }
        // Update metadata
        spec.metadata = spec.metadata || {};
        spec.metadata.updated_at = now;
    }
    /**
     * Get performance summary for all agents
     */
    getPerformanceSummary(spec) {
        const agents = Object.values(spec.agents);
        const withPerformance = agents.filter(a => a.performance && a.performance.totalRuns > 0);
        if (withPerformance.length === 0) {
            return {
                totalAgents: agents.length,
                averageScore: 0,
                improving: 0,
                degrading: 0,
                stable: 0
            };
        }
        const scores = withPerformance.map(a => a.performance.averageScore);
        const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        let improving = 0;
        let degrading = 0;
        let stable = 0;
        for (const agent of withPerformance) {
            if (agent.performance.trends?.improving)
                improving++;
            else if (agent.performance.trends?.degrading)
                degrading++;
            else
                stable++;
        }
        return {
            totalAgents: agents.length,
            averageScore,
            improving,
            degrading,
            stable
        };
    }
}
exports.EvalSpecManager = EvalSpecManager;
exports.default = EvalSpecManager;
//# sourceMappingURL=eval-spec-manager.js.map