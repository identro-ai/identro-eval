"use strict";
/**
 * Cache Service for Test Results
 * Stores API responses in memory to avoid repeated calls
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
exports.CacheService = void 0;
exports.getCache = getCache;
exports.resetCache = resetCache;
const crypto = __importStar(require("crypto"));
const chalk_1 = __importDefault(require("chalk"));
class CacheService {
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
        console.log(chalk_1.default.yellow('✓ Cache cleared'));
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
            console.log(chalk_1.default.gray(`\nCache: ${stats.hits} hits, ${stats.misses} misses (${(stats.hitRate * 100).toFixed(1)}% hit rate)`));
        }
    }
}
exports.CacheService = CacheService;
// Singleton instance
let cacheInstance = null;
function getCache(options) {
    if (!cacheInstance) {
        cacheInstance = new CacheService(options);
    }
    return cacheInstance;
}
function resetCache() {
    cacheInstance = null;
}
//# sourceMappingURL=cache.js.map