/**
 * Report Organizer
 *
 * Handles consistent report naming, organization, and symlink management
 * for the historical reporting system.
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import { ReportManifestManager } from './report-manifest';
export class ReportOrganizer {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.reportsDir = path.join(projectPath, '.identro', 'reports');
        this.manifestManager = new ReportManifestManager(projectPath);
    }
    /**
     * Generate a consistent report filename
     */
    generateReportFilename(type, format, timestamp) {
        const date = timestamp || new Date();
        const isoString = date.toISOString().replace(/[:.]/g, '-');
        return `${type}-${isoString}.${format}`;
    }
    /**
     * Get the organized path for a report (with monthly folders if enabled)
     */
    getOrganizedPath(filename, timestamp, config) {
        if (config.organizeByMonth) {
            const year = timestamp.getFullYear();
            const month = String(timestamp.getMonth() + 1).padStart(2, '0');
            const monthFolder = `${year}-${month}`;
            return path.join(this.reportsDir, monthFolder, filename);
        }
        return path.join(this.reportsDir, filename);
    }
    /**
     * Save a report with proper organization and tracking
     */
    async saveReport(content, type, format, results, options = {}) {
        const timestamp = options.timestamp || new Date();
        const config = options.config || {
            organizeByMonth: true,
            createSymlinks: true,
            compressOld: false,
            compressAfterDays: 7
        };
        // Generate consistent filename
        const filename = this.generateReportFilename(type, format, timestamp);
        // Get organized path
        const reportPath = this.getOrganizedPath(filename, timestamp, config);
        // Ensure directory exists
        await fs.ensureDir(path.dirname(reportPath));
        // Save the report
        await fs.writeFile(reportPath, content, 'utf-8');
        // Add to manifest
        const reportId = await this.manifestManager.addReport(reportPath, format, type, results, {
            duration: options.duration,
            llmCalls: options.llmCalls,
            llmCost: options.llmCost
        });
        // Create symlinks if enabled
        if (config.createSymlinks) {
            await this.createSymlinks(reportPath, format, type);
        }
        return { reportPath, reportId };
    }
    /**
     * Create symlinks to the latest reports
     */
    async createSymlinks(reportPath, format, type) {
        const filename = path.basename(reportPath);
        try {
            // Create latest symlinks
            const latestGenericPath = path.join(this.reportsDir, `latest.${format}`);
            const latestTypedPath = path.join(this.reportsDir, `latest-${type}.${format}`);
            // Remove existing symlinks
            if (await fs.pathExists(latestGenericPath)) {
                await fs.remove(latestGenericPath);
            }
            if (await fs.pathExists(latestTypedPath)) {
                await fs.remove(latestTypedPath);
            }
            // Create new symlinks (relative paths for portability)
            const relativePath = path.relative(this.reportsDir, reportPath);
            await fs.symlink(relativePath, latestGenericPath);
            await fs.symlink(relativePath, latestTypedPath);
        }
        catch (err) {
            // Symlink creation is not critical, just log the error
            console.warn(`Warning: Could not create symlinks: ${err}`);
        }
    }
    /**
     * Organize existing reports into monthly folders
     */
    async organizeExistingReports() {
        const errors = [];
        let organized = 0;
        try {
            // Get all reports from manifest
            const reports = await this.manifestManager.getReports();
            for (const report of reports) {
                try {
                    const currentPath = path.join(this.reportsDir, report.filename);
                    // Skip if file doesn't exist
                    if (!await fs.pathExists(currentPath)) {
                        continue;
                    }
                    // Skip if already in a monthly folder
                    if (report.monthFolder && currentPath.includes(report.monthFolder)) {
                        continue;
                    }
                    // Determine target path
                    const timestamp = new Date(report.timestamp);
                    const year = timestamp.getFullYear();
                    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
                    const monthFolder = `${year}-${month}`;
                    const targetPath = path.join(this.reportsDir, monthFolder, report.filename);
                    // Create month directory
                    await fs.ensureDir(path.dirname(targetPath));
                    // Move the file
                    await fs.move(currentPath, targetPath);
                    // Update manifest
                    await this.manifestManager.updateReport(report.id, {
                        monthFolder
                    });
                    organized++;
                }
                catch (err) {
                    errors.push(`Failed to organize ${report.filename}: ${err.message}`);
                }
            }
        }
        catch (err) {
            errors.push(`Failed to organize reports: ${err.message}`);
        }
        return { organized, errors };
    }
    /**
     * Compress old reports to save space
     */
    async compressOldReports(olderThanDays = 7) {
        const errors = [];
        let compressed = 0;
        let spaceFreed = 0;
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            // Get reports older than cutoff date
            const reports = await this.manifestManager.getReports({
                until: cutoffDate.toISOString()
            });
            for (const report of reports) {
                try {
                    // Skip if already compressed
                    if (report.compressed) {
                        continue;
                    }
                    const reportPath = path.join(this.reportsDir, report.monthFolder ? path.join(report.monthFolder, report.filename) : report.filename);
                    if (!await fs.pathExists(reportPath)) {
                        continue;
                    }
                    // Get original size
                    const originalStats = await fs.stat(reportPath);
                    const originalSize = originalStats.size;
                    // Compress using gzip (simple compression)
                    const zlib = await import('zlib');
                    const { promisify } = await import('util');
                    const gzip = promisify(zlib.gzip);
                    const content = await fs.readFile(reportPath);
                    const compressedContent = await gzip(content);
                    // Save compressed version
                    const compressedPath = `${reportPath}.gz`;
                    await fs.writeFile(compressedPath, compressedContent);
                    // Remove original
                    await fs.remove(reportPath);
                    // Update manifest
                    await this.manifestManager.updateReport(report.id, {
                        filename: `${report.filename}.gz`,
                        compressed: true,
                        size: compressedContent.length
                    });
                    compressed++;
                    spaceFreed += originalSize - compressedContent.length;
                }
                catch (err) {
                    errors.push(`Failed to compress ${report.filename}: ${err.message}`);
                }
            }
        }
        catch (err) {
            errors.push(`Failed to compress reports: ${err.message}`);
        }
        return { compressed, spaceFreed, errors };
    }
    /**
     * Create a report index HTML file for easy browsing
     */
    async createReportIndex() {
        const reports = await this.manifestManager.getReports();
        const stats = await this.manifestManager.getStats();
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Identro Eval - Report Index</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f8f9fa; }
        .header { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .stat-label { color: #6c757d; font-size: 14px; }
        .reports { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .report { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; }
        .report:last-child { border-bottom: none; }
        .report-info { flex: 1; }
        .report-title { font-weight: 600; color: #333; }
        .report-meta { color: #6c757d; font-size: 14px; margin-top: 5px; }
        .report-stats { display: flex; gap: 15px; align-items: center; }
        .success-rate { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .success-high { background: #d4edda; color: #155724; }
        .success-medium { background: #fff3cd; color: #856404; }
        .success-low { background: #f8d7da; color: #721c24; }
        .btn { padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; }
        .btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Identro Eval Reports</h1>
        <p>Historical test reports for your AI agents</p>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${stats.totalReports}</div>
                <div class="stat-label">Total Reports</div>
            </div>
            <div class="stat">
                <div class="stat-value">${stats.averageSuccessRate.toFixed(1)}%</div>
                <div class="stat-label">Avg Success Rate</div>
            </div>
            <div class="stat">
                <div class="stat-value">${this.formatFileSize(stats.totalSize)}</div>
                <div class="stat-label">Total Size</div>
            </div>
            <div class="stat">
                <div class="stat-value">${Object.keys(stats.reportsByType).length}</div>
                <div class="stat-label">Report Types</div>
            </div>
        </div>
    </div>
    
    <div class="reports">
        <h2>📋 All Reports</h2>
        ${reports.map(report => {
            const date = new Date(report.timestamp).toLocaleString();
            const successClass = report.metadata.successRate >= 80 ? 'success-high' :
                report.metadata.successRate >= 60 ? 'success-medium' : 'success-low';
            const relativePath = path.relative(this.reportsDir, path.join(this.reportsDir, report.monthFolder ? path.join(report.monthFolder, report.filename) : report.filename));
            return `
            <div class="report">
                <div class="report-info">
                    <div class="report-title">${report.id}</div>
                    <div class="report-meta">
                        ${date} • ${report.type} • ${report.format} • 
                        ${report.metadata.totalTests} tests • ${report.metadata.agentCount} agents
                    </div>
                </div>
                <div class="report-stats">
                    <span class="success-rate ${successClass}">${report.metadata.successRate.toFixed(1)}%</span>
                    <a href="${relativePath}" class="btn" target="_blank">View</a>
                </div>
            </div>
          `;
        }).join('')}
    </div>
    
    <div style="margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px;">
        Generated by Identro Eval • ${new Date().toLocaleString()}
    </div>
</body>
</html>
    `.trim();
        const indexPath = path.join(this.reportsDir, 'index.html');
        await fs.writeFile(indexPath, html, 'utf-8');
        return indexPath;
    }
    /**
     * Clean up broken symlinks
     */
    async cleanupBrokenSymlinks() {
        let cleaned = 0;
        try {
            const files = await fs.readdir(this.reportsDir);
            for (const file of files) {
                const filePath = path.join(this.reportsDir, file);
                try {
                    const stats = await fs.lstat(filePath);
                    if (stats.isSymbolicLink()) {
                        // Check if the target exists
                        const targetExists = await fs.pathExists(filePath);
                        if (!targetExists) {
                            await fs.remove(filePath);
                            cleaned++;
                        }
                    }
                }
                catch (err) {
                    // If we can't stat the file, it's probably broken
                    try {
                        await fs.remove(filePath);
                        cleaned++;
                    }
                    catch (removeErr) {
                        // Ignore removal errors
                    }
                }
            }
        }
        catch (err) {
            // Ignore directory read errors
        }
        return cleaned;
    }
    /**
     * Get report file path from manifest entry
     */
    getReportPath(report) {
        if (report.monthFolder) {
            return path.join(this.reportsDir, report.monthFolder, report.filename);
        }
        return path.join(this.reportsDir, report.filename);
    }
    /**
     * Migrate reports to new organization structure
     */
    async migrateToNewStructure() {
        const errors = [];
        let migrated = 0;
        try {
            // Get all files in reports directory
            const files = await fs.readdir(this.reportsDir);
            for (const file of files) {
                try {
                    // Skip directories, symlinks, and special files
                    const filePath = path.join(this.reportsDir, file);
                    const stats = await fs.lstat(filePath);
                    if (stats.isDirectory() || stats.isSymbolicLink() ||
                        file === 'manifest.json' || file === 'index.html') {
                        continue;
                    }
                    // Try to extract timestamp from filename
                    const timestampMatch = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
                    if (!timestampMatch) {
                        continue;
                    }
                    const timestamp = new Date(timestampMatch[1].replace(/-/g, ':').replace(/T/, 'T').replace(/:(\d{2})$/, '.$1Z'));
                    // Determine type and format
                    let type = 'cli';
                    if (file.startsWith('interactive-'))
                        type = 'interactive';
                    else if (file.startsWith('watch-'))
                        type = 'watch';
                    else if (file.startsWith('ci-'))
                        type = 'ci';
                    const format = file.endsWith('.html') ? 'html' :
                        file.endsWith('.json') ? 'json' : 'markdown';
                    // Create month folder
                    const year = timestamp.getFullYear();
                    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
                    const monthFolder = `${year}-${month}`;
                    const monthDir = path.join(this.reportsDir, monthFolder);
                    await fs.ensureDir(monthDir);
                    // Move file
                    const targetPath = path.join(monthDir, file);
                    await fs.move(filePath, targetPath);
                    migrated++;
                }
                catch (err) {
                    errors.push(`Failed to migrate ${file}: ${err.message}`);
                }
            }
        }
        catch (err) {
            errors.push(`Failed to migrate reports: ${err.message}`);
        }
        return { migrated, errors };
    }
    /**
     * Format file size helper
     */
    formatFileSize(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}
//# sourceMappingURL=report-organizer.js.map