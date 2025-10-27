/**
 * Cache Service for Test Results
 * Stores API responses in memory to avoid repeated calls
 */
import * as crypto from 'crypto';
import chalk from 'chalk';
export class CacheService {
    constructor(options = {}) {
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.memoryCache = new Map();
        this.options = {
            enabled: true,
            ttl: 3600, // 1 hour default
            ...options,
        };
    }
    /**
     * Generate cache key from agent ID and input
     */
    generateKey(agentId, input) {
        const content = `${agentId}:${JSON.stringify(input)}`;
        return crypto.createHash('md5').update(content).digest('hex');
    }
    /**
     * Get cached result if available and not expired
     */
    async get(agentId, input) {
        if (!this.options.enabled)
            return null;
        const key = this.generateKey(agentId, input);
        const entry = this.memoryCache.get(key);
        if (entry) {
            // Check if cache is still valid
            const age = Date.now() - new Date(entry.timestamp).getTime();
            if (age < entry.ttl * 1000) {
                this.cacheHits++;
                return entry;
            }
            else {
                // Cache expired, remove it
                this.memoryCache.delete(key);
            }
        }
        this.cacheMisses++;
        return null;
    }
    /**
     * Store result in cache
     */
    async set(agentId, input, response, latency, ttl) {
        if (!this.options.enabled)
            return;
        const key = this.generateKey(agentId, input);
        const entry = {
            response,
            latency,
            timestamp: new Date().toISOString(),
            ttl: ttl || this.options.ttl,
        };
        this.memoryCache.set(key, entry);
    }
    /**
     * Clear all cache
     */
    async clear() {
        this.memoryCache.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
        console.log(chalk.yellow('✓ Cache cleared'));
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.cacheHits + this.cacheMisses;
        return {
            hits: this.cacheHits,
            misses: this.cacheMisses,
            hitRate: total > 0 ? this.cacheHits / total : 0,
        };
    }
    /**
     * Display cache statistics
     */
    displayStats() {
        const stats = this.getStats();
        if (stats.hits + stats.misses > 0) {
            console.log(chalk.gray(`\nCache: ${stats.hits} hits, ${stats.misses} misses (${(stats.hitRate * 100).toFixed(1)}% hit rate)`));
        }
    }
}
// Singleton instance
let cacheInstance = null;
export function getCache(options) {
    if (!cacheInstance) {
        cacheInstance = new CacheService(options);
    }
    return cacheInstance;
}
export function resetCache() {
    cacheInstance = null;
}
//# sourceMappingURL=cache.js.map