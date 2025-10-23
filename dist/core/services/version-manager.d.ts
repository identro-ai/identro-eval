/**
 * Version Manager
 *
 * Manages versioning and snapshots for .identro YAML files
 * Tracks changes and maintains version history
 */
import { EvalSpec } from '../types/eval-spec';
export interface VersionManifest {
    current_version: string;
    versions: VersionEntry[];
}
export interface VersionEntry {
    version_id: string;
    timestamp: string;
    trigger: 'discovery' | 'test_generation' | 'manual' | 'analysis';
    changes: {
        agents: Array<{
            name: string;
            change_type: 'added' | 'modified' | 'unmodified' | 'removed';
            source_hash?: string;
        }>;
        teams: Array<{
            name: string;
            change_type: 'added' | 'modified' | 'unmodified' | 'removed';
        }>;
        tests: Array<{
            entity: string;
            entity_type: 'agent' | 'team' | 'flow';
            dimension: string;
            change_type: 'added' | 'modified' | 'removed';
            test_count: number;
        }>;
    };
    dependencies: {
        agent_versions: Record<string, number>;
        team_versions: Record<string, number>;
        dimension_versions: Record<string, string>;
    };
    eval_spec_backup: string;
    snapshot_path: string;
}
export interface VersionConfig {
    enabled: boolean;
    snapshots: {
        max_count: number;
        max_age_days: number;
        always_keep_latest: number;
        compress_old: boolean;
    };
}
export interface ChangeDetectionResult {
    hasChanges: boolean;
    agents: Map<string, {
        current: any;
        previous: any;
        changeType: 'added' | 'modified' | 'removed';
    }>;
    teams: Map<string, {
        current: any;
        previous: any;
        changeType: 'added' | 'modified' | 'removed';
    }>;
    tests: Map<string, {
        current: any;
        previous: any;
        changeType: 'added' | 'modified' | 'removed';
    }>;
}
/**
 * Manages version history and snapshots for YAML files
 */
export declare class VersionManager {
    private identroPath;
    private historyPath;
    private snapshotsPath;
    private manifestPath;
    private versionPointerPath;
    private config;
    constructor(projectPath: string, config?: Partial<VersionConfig>);
    /**
     * Initialize version management structure
     */
    initialize(): Promise<void>;
    /**
     * Detect changes between current and previous eval spec
     */
    detectChanges(evalSpec: EvalSpec): Promise<ChangeDetectionResult>;
    /**
     * Create a snapshot of current YAML files
     */
    createSnapshot(evalSpec: EvalSpec, trigger: 'discovery' | 'test_generation' | 'manual' | 'analysis', changes?: ChangeDetectionResult): Promise<string>;
    /**
     * Generate version ID from timestamp
     */
    private generateVersionId;
    /**
     * Copy YAML files to snapshot directory
     */
    private copyYamlFiles;
    /**
     * Generate snapshot manifest
     */
    private generateSnapshotManifest;
    /**
     * Update main manifest
     */
    private updateMainManifest;
    /**
     * Save manifest to file
     */
    private saveManifest;
    /**
     * Get current version
     */
    getCurrentVersion(): Promise<string | null>;
    /**
     * Update current version pointer
     */
    private updateCurrentVersion;
    /**
     * Load previous eval spec from backup
     */
    private loadPreviousEvalSpec;
    /**
     * Load manifest
     */
    private loadManifest;
    /**
     * Compare agents between specs
     */
    private compareAgents;
    /**
     * Compare teams between specs
     */
    private compareTeams;
    /**
     * Compare tests between specs
     */
    private compareTests;
    /**
     * Hash an object for comparison
     */
    private hashObject;
    /**
     * Cleanup old snapshots
     */
    private cleanupSnapshots;
    /**
     * Restore from a specific version
     */
    restoreVersion(versionId: string): Promise<void>;
    /**
     * Get version history
     */
    getVersionHistory(): Promise<VersionEntry[]>;
    /**
     * Utility: Check if file exists
     */
    private fileExists;
    /**
     * Utility: Check if directory exists
     */
    private dirExists;
    /**
     * Utility: Copy directory recursively
     */
    private copyDirectory;
    /**
     * Utility: Delete directory recursively
     */
    private deleteDirectory;
}
export default VersionManager;
//# sourceMappingURL=version-manager.d.ts.map