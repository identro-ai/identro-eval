"use strict";
/**
 * Version Manager
 *
 * Manages versioning and snapshots for .identro YAML files
 * Tracks changes and maintains version history
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionManager = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const js_yaml_1 = __importDefault(require("js-yaml"));
/**
 * Manages version history and snapshots for YAML files
 */
class VersionManager {
    identroPath;
    historyPath;
    snapshotsPath;
    manifestPath;
    versionPointerPath;
    config;
    constructor(projectPath, config) {
        this.identroPath = path.join(projectPath, '.identro');
        this.historyPath = path.join(this.identroPath, 'history');
        this.snapshotsPath = path.join(this.historyPath, 'snapshots');
        this.manifestPath = path.join(this.historyPath, 'manifest.yml');
        this.versionPointerPath = path.join(this.identroPath, '.identro-version');
        // Default configuration
        this.config = {
            enabled: config?.enabled ?? true,
            snapshots: {
                max_count: config?.snapshots?.max_count ?? 20,
                max_age_days: config?.snapshots?.max_age_days ?? 30,
                always_keep_latest: config?.snapshots?.always_keep_latest ?? 5,
                compress_old: config?.snapshots?.compress_old ?? false,
            },
        };
    }
    /**
     * Initialize version management structure
     */
    async initialize() {
        await fs.mkdir(this.snapshotsPath, { recursive: true });
        // Create manifest if it doesn't exist
        const manifestExists = await this.fileExists(this.manifestPath);
        if (!manifestExists) {
            const manifest = {
                current_version: '',
                versions: [],
            };
            await this.saveManifest(manifest);
        }
    }
    /**
     * Detect changes between current and previous eval spec
     */
    async detectChanges(evalSpec) {
        const result = {
            hasChanges: false,
            agents: new Map(),
            teams: new Map(),
            tests: new Map(),
        };
        try {
            // Load previous version if exists
            const currentVersion = await this.getCurrentVersion();
            if (!currentVersion) {
                // No previous version, everything is new
                result.hasChanges = true;
                return result;
            }
            // Load previous eval spec from backup
            const previousSpec = await this.loadPreviousEvalSpec(currentVersion);
            if (!previousSpec) {
                result.hasChanges = true;
                return result;
            }
            // Compare agents
            const agentChanges = this.compareAgents(evalSpec, previousSpec);
            if (agentChanges.size > 0) {
                result.hasChanges = true;
                result.agents = agentChanges;
            }
            // Compare teams
            const teamChanges = this.compareTeams(evalSpec, previousSpec);
            if (teamChanges.size > 0) {
                result.hasChanges = true;
                result.teams = teamChanges;
            }
            // Compare tests
            const testChanges = this.compareTests(evalSpec, previousSpec);
            if (testChanges.size > 0) {
                result.hasChanges = true;
                result.tests = testChanges;
            }
        }
        catch (error) {
            console.warn('Error detecting changes, assuming changes exist:', error);
            result.hasChanges = true;
        }
        return result;
    }
    /**
     * Create a snapshot of current YAML files
     */
    async createSnapshot(evalSpec, trigger, changes) {
        if (!this.config.enabled) {
            return '';
        }
        const versionId = this.generateVersionId();
        const snapshotPath = path.join(this.snapshotsPath, versionId);
        // Create snapshot directory
        await fs.mkdir(snapshotPath, { recursive: true });
        // Copy current YAML files to snapshot
        await this.copyYamlFiles(snapshotPath);
        // Create eval-spec backup
        const evalSpecBackup = `eval-spec-${versionId}.json`;
        const evalSpecBackupPath = path.join(this.historyPath, evalSpecBackup);
        await fs.writeFile(evalSpecBackupPath, JSON.stringify(evalSpec, null, 2), 'utf-8');
        // Generate snapshot manifest
        const snapshotManifest = await this.generateSnapshotManifest(versionId, evalSpec, trigger, evalSpecBackup, changes);
        // Save snapshot manifest
        const snapshotManifestPath = path.join(snapshotPath, 'manifest.yml');
        await fs.writeFile(snapshotManifestPath, js_yaml_1.default.dump(snapshotManifest, { indent: 2 }), 'utf-8');
        // Update main manifest
        await this.updateMainManifest(snapshotManifest);
        // Update version pointer
        await this.updateCurrentVersion(versionId);
        // Cleanup old snapshots
        await this.cleanupSnapshots();
        return versionId;
    }
    /**
     * Generate version ID from timestamp
     */
    generateVersionId() {
        const now = new Date();
        return now.toISOString().replace(/[:.]/g, '-').split('.')[0];
    }
    /**
     * Copy YAML files to snapshot directory
     */
    async copyYamlFiles(snapshotPath) {
        const dirs = ['agents', 'teams', 'tests'];
        for (const dir of dirs) {
            const sourcePath = path.join(this.identroPath, dir);
            const targetPath = path.join(snapshotPath, dir);
            if (await this.dirExists(sourcePath)) {
                await this.copyDirectory(sourcePath, targetPath);
            }
        }
    }
    /**
     * Generate snapshot manifest
     */
    async generateSnapshotManifest(versionId, evalSpec, trigger, evalSpecBackup, changes) {
        const manifest = {
            version_id: versionId,
            timestamp: new Date().toISOString(),
            trigger: trigger,
            changes: {
                agents: [],
                teams: [],
                tests: [],
            },
            dependencies: {
                agent_versions: {},
                team_versions: {},
                dimension_versions: {},
            },
            eval_spec_backup: evalSpecBackup,
            snapshot_path: `snapshots/${versionId}`,
        };
        // Process agent changes
        if (changes) {
            for (const [agentId, change] of changes.agents) {
                manifest.changes.agents.push({
                    name: agentId,
                    change_type: change.changeType,
                    source_hash: change.current?.discovered?.sourceHash,
                });
            }
            for (const [teamName, change] of changes.teams) {
                manifest.changes.teams.push({
                    name: teamName,
                    change_type: change.changeType,
                });
            }
            for (const [testKey, change] of changes.tests) {
                const [entityType, entity, dimension] = testKey.split(':');
                manifest.changes.tests.push({
                    entity,
                    entity_type: entityType,
                    dimension,
                    change_type: change.changeType,
                    test_count: change.current?.tests?.length || 0,
                });
            }
        }
        else {
            // No changes provided, list all agents/teams/tests
            for (const [agentId, agentSpec] of Object.entries(evalSpec.agents)) {
                manifest.changes.agents.push({
                    name: agentId,
                    change_type: 'unmodified',
                    source_hash: agentSpec.discovered?.sourceHash,
                });
            }
            if (evalSpec.teams) {
                for (const [teamName] of Object.entries(evalSpec.teams)) {
                    manifest.changes.teams.push({
                        name: teamName,
                        change_type: 'unmodified',
                    });
                }
            }
        }
        // Extract version dependencies
        for (const [agentId, agentSpec] of Object.entries(evalSpec.agents)) {
            manifest.dependencies.agent_versions[agentId] = agentSpec.discovered?.version || 1;
        }
        if (evalSpec.teams) {
            for (const [teamName, teamSpec] of Object.entries(evalSpec.teams)) {
                manifest.dependencies.team_versions[teamName] = teamSpec.discovered?.version || 1;
            }
        }
        return manifest;
    }
    /**
     * Update main manifest
     */
    async updateMainManifest(entry) {
        let manifest;
        try {
            const content = await fs.readFile(this.manifestPath, 'utf-8');
            manifest = js_yaml_1.default.load(content);
        }
        catch {
            manifest = {
                current_version: '',
                versions: [],
            };
        }
        manifest.current_version = entry.version_id;
        manifest.versions.unshift(entry); // Add to beginning
        // Keep only configured number of versions
        if (manifest.versions.length > this.config.snapshots.max_count) {
            manifest.versions = manifest.versions.slice(0, this.config.snapshots.max_count);
        }
        await this.saveManifest(manifest);
    }
    /**
     * Save manifest to file
     */
    async saveManifest(manifest) {
        await fs.writeFile(this.manifestPath, js_yaml_1.default.dump(manifest, { indent: 2, lineWidth: 100 }), 'utf-8');
    }
    /**
     * Get current version
     */
    async getCurrentVersion() {
        try {
            const content = await fs.readFile(this.versionPointerPath, 'utf-8');
            return content.trim();
        }
        catch {
            return null;
        }
    }
    /**
     * Update current version pointer
     */
    async updateCurrentVersion(versionId) {
        await fs.writeFile(this.versionPointerPath, versionId, 'utf-8');
    }
    /**
     * Load previous eval spec from backup
     */
    async loadPreviousEvalSpec(versionId) {
        try {
            const manifest = await this.loadManifest();
            const versionEntry = manifest.versions.find(v => v.version_id === versionId);
            if (!versionEntry) {
                return null;
            }
            const backupPath = path.join(this.historyPath, versionEntry.eval_spec_backup);
            const content = await fs.readFile(backupPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    /**
     * Load manifest
     */
    async loadManifest() {
        try {
            const content = await fs.readFile(this.manifestPath, 'utf-8');
            return js_yaml_1.default.load(content);
        }
        catch {
            return {
                current_version: '',
                versions: [],
            };
        }
    }
    /**
     * Compare agents between specs
     */
    compareAgents(current, previous) {
        const changes = new Map();
        // Check for new/modified agents
        for (const [agentId, agentSpec] of Object.entries(current.agents)) {
            const prevAgent = previous.agents[agentId];
            if (!prevAgent) {
                changes.set(agentId, {
                    current: agentSpec,
                    previous: null,
                    changeType: 'added',
                });
            }
            else {
                // Compare source hash
                const currentHash = agentSpec.discovered?.sourceHash;
                const prevHash = prevAgent.discovered?.sourceHash;
                if (currentHash !== prevHash) {
                    changes.set(agentId, {
                        current: agentSpec,
                        previous: prevAgent,
                        changeType: 'modified',
                    });
                }
            }
        }
        // Check for removed agents
        for (const agentId of Object.keys(previous.agents)) {
            if (!current.agents[agentId]) {
                changes.set(agentId, {
                    current: null,
                    previous: previous.agents[agentId],
                    changeType: 'removed',
                });
            }
        }
        return changes;
    }
    /**
     * Compare teams between specs
     */
    compareTeams(current, previous) {
        const changes = new Map();
        if (!current.teams && !previous.teams) {
            return changes;
        }
        const currentTeams = current.teams || {};
        const previousTeams = previous.teams || {};
        // Check for new/modified teams
        for (const [teamName, teamSpec] of Object.entries(currentTeams)) {
            const prevTeam = previousTeams[teamName];
            if (!prevTeam) {
                changes.set(teamName, {
                    current: teamSpec,
                    previous: null,
                    changeType: 'added',
                });
            }
            else {
                // Compare by content hash
                const currentHash = this.hashObject(teamSpec);
                const prevHash = this.hashObject(prevTeam);
                if (currentHash !== prevHash) {
                    changes.set(teamName, {
                        current: teamSpec,
                        previous: prevTeam,
                        changeType: 'modified',
                    });
                }
            }
        }
        // Check for removed teams
        for (const teamName of Object.keys(previousTeams)) {
            if (!currentTeams[teamName]) {
                changes.set(teamName, {
                    current: null,
                    previous: previousTeams[teamName],
                    changeType: 'removed',
                });
            }
        }
        return changes;
    }
    /**
     * Compare tests between specs
     */
    compareTests(current, previous) {
        const changes = new Map();
        // Compare agent tests
        for (const [agentId, agentSpec] of Object.entries(current.agents)) {
            const prevAgent = previous.agents[agentId];
            if (agentSpec.testSpecs) {
                for (const [dimension, testSpecs] of Object.entries(agentSpec.testSpecs)) {
                    const key = `agent:${agentId}:${dimension}`;
                    const prevTests = prevAgent?.testSpecs?.[dimension];
                    if (!prevTests) {
                        changes.set(key, {
                            current: testSpecs,
                            previous: null,
                            changeType: 'added',
                        });
                    }
                    else {
                        const currentHash = this.hashObject(testSpecs);
                        const prevHash = this.hashObject(prevTests);
                        if (currentHash !== prevHash) {
                            changes.set(key, {
                                current: testSpecs,
                                previous: prevTests,
                                changeType: 'modified',
                            });
                        }
                    }
                }
            }
        }
        // Compare team tests
        if (current.teams) {
            for (const [teamName, teamSpec] of Object.entries(current.teams)) {
                const prevTeam = previous.teams?.[teamName];
                if (teamSpec.testSpecs) {
                    for (const [dimension, testSpecs] of Object.entries(teamSpec.testSpecs)) {
                        const key = `team:${teamName}:${dimension}`;
                        const prevTests = prevTeam?.testSpecs?.[dimension];
                        if (!prevTests) {
                            changes.set(key, {
                                current: testSpecs,
                                previous: null,
                                changeType: 'added',
                            });
                        }
                        else {
                            const currentHash = this.hashObject(testSpecs);
                            const prevHash = this.hashObject(prevTests);
                            if (currentHash !== prevHash) {
                                changes.set(key, {
                                    current: testSpecs,
                                    previous: prevTests,
                                    changeType: 'modified',
                                });
                            }
                        }
                    }
                }
            }
        }
        return changes;
    }
    /**
     * Hash an object for comparison
     */
    hashObject(obj) {
        const str = JSON.stringify(obj, Object.keys(obj).sort());
        return crypto.createHash('sha256').update(str).digest('hex');
    }
    /**
     * Cleanup old snapshots
     */
    async cleanupSnapshots() {
        try {
            const manifest = await this.loadManifest();
            const now = new Date();
            const maxAge = this.config.snapshots.max_age_days * 24 * 60 * 60 * 1000;
            // Keep track of versions to delete
            const versionsToDelete = [];
            for (let i = this.config.snapshots.always_keep_latest; i < manifest.versions.length; i++) {
                const version = manifest.versions[i];
                const versionDate = new Date(version.timestamp);
                const age = now.getTime() - versionDate.getTime();
                if (age > maxAge) {
                    versionsToDelete.push(version.version_id);
                }
            }
            // Delete old snapshots
            for (const versionId of versionsToDelete) {
                const snapshotPath = path.join(this.snapshotsPath, versionId);
                await this.deleteDirectory(snapshotPath);
            }
            // Remove from manifest
            if (versionsToDelete.length > 0) {
                manifest.versions = manifest.versions.filter(v => !versionsToDelete.includes(v.version_id));
                await this.saveManifest(manifest);
            }
        }
        catch (error) {
            console.warn('Failed to cleanup snapshots:', error);
        }
    }
    /**
     * Restore from a specific version
     */
    async restoreVersion(versionId) {
        const snapshotPath = path.join(this.snapshotsPath, versionId);
        if (!(await this.dirExists(snapshotPath))) {
            throw new Error(`Snapshot ${versionId} not found`);
        }
        // Copy files from snapshot to main directory
        await this.copyYamlFiles(snapshotPath);
        // Update version pointer
        await this.updateCurrentVersion(versionId);
    }
    /**
     * Get version history
     */
    async getVersionHistory() {
        const manifest = await this.loadManifest();
        return manifest.versions;
    }
    /**
     * Utility: Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Utility: Check if directory exists
     */
    async dirExists(dirPath) {
        try {
            const stats = await fs.stat(dirPath);
            return stats.isDirectory();
        }
        catch {
            return false;
        }
    }
    /**
     * Utility: Copy directory recursively
     */
    async copyDirectory(source, target) {
        await fs.mkdir(target, { recursive: true });
        const entries = await fs.readdir(source, { withFileTypes: true });
        for (const entry of entries) {
            const sourcePath = path.join(source, entry.name);
            const targetPath = path.join(target, entry.name);
            if (entry.isDirectory()) {
                await this.copyDirectory(sourcePath, targetPath);
            }
            else {
                await fs.copyFile(sourcePath, targetPath);
            }
        }
    }
    /**
     * Utility: Delete directory recursively
     */
    async deleteDirectory(dirPath) {
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
        }
        catch (error) {
            console.warn(`Failed to delete directory ${dirPath}:`, error);
        }
    }
}
exports.VersionManager = VersionManager;
exports.default = VersionManager;
//# sourceMappingURL=version-manager.js.map