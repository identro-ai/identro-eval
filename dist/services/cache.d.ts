/**
 * Cache Service for Test Results
 * Stores API responses in memory to avoid repeated calls
 */
export interface CacheEntry {
    response: any;
    latency: number;
    timestamp: string;
    ttl: number;
}
export interface CacheOptions {
    enabled: boolean;
    ttl: number;
}
export declare class CacheService {
    private options;
    private cacheHits;
    private cacheMisses;
    private memoryCache;
    constructor(options?: Partial<CacheOptions>);
    /**
     * Generate cache key from agent ID and input
     */
    private generateKey;
    /**
     * Get cached result if available and not expired
     */
    get(agentId: string, input: any): Promise<CacheEntry | null>;
    /**
     * Store result in cache
     */
    set(agentId: string, input: any, response: any, latency: number, ttl?: number): Promise<void>;
    /**
     * Clear all cache
     */
    clear(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): {
        hits: number;
        misses: number;
        hitRate: number;
    };
    /**
     * Display cache statistics
     */
    displayStats(): void;
}
export declare function getCache(options?: Partial<CacheOptions>): CacheService;
export declare function resetCache(): void;
//# sourceMappingURL=cache.d.ts.map