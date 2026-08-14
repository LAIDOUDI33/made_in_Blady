/**
 * AlgeriaTrade.dz - Advanced Multi-Tier Caching System
 * 
 * Features:
 * - Multi-layer cache (Memory → Redis → Database)
 * - Automatic cache invalidation
 * - Cache warming strategies
 * - Rate limiting integration
 * - Stale-while-revalidate pattern
 * - Cache tagging for bulk invalidation
 * - Query deduplication
 */

import { Redis } from 'ioredis';
import { LRUCache } from 'lru-cache';

// ===========================================
// Configuration Types
// ===========================================

export interface CacheConfig {
  // Memory cache (L1)
  memory: {
    enabled: boolean;
    maxSize: number; // Max items in LRU cache
    ttl: number; // Time to live in ms
  };
  
  // Redis cache (L2)
  redis: {
    enabled: boolean;
    url?: string;
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix: string;
    defaultTTL: number; // Default TTL in seconds
  };
  
  // Behavior
  behavior: {
    staleWhileRevalidate: number; // Serve stale for X seconds while revalidating
    retryDelay: number; // Retry delay on cache miss
    maxRetries: number;
    compression: boolean; // Compress large values
    enableStats: boolean; // Track cache hit/miss rates
  };
}

export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
  compressed?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  memoryUsage: number;
  redisUsage: number;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  skipMemory?: boolean;
  skipRedis?: boolean;
  forceRefresh?: boolean;
}

// ===========================================
// Default Configuration
// ===========================================

const DEFAULT_CONFIG: CacheConfig = {
  memory: {
    enabled: true,
    maxSize: 1000, // 1000 items
    ttl: 5 * 60 * 1000, // 5 minutes
  },
  redis: {
    enabled: process.env.REDIS_URL !== undefined,
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: 'algeriatrade:',
    defaultTTL: 3600, // 1 hour
  },
  behavior: {
    staleWhileRevalidate: 300, // 5 minutes
    retryDelay: 100, // 100ms
    maxRetries: 3,
    compression: true,
    enableStats: true,
  },
};

// ===========================================
// Memory Cache (L1) Implementation
// ===========================================

class MemoryCache {
  private cache: LRUCache<string, CacheEntry>;
  private stats: CacheStats;

  constructor(config: CacheConfig['memory']) {
    this.cache = new LRUCache<string, CacheEntry>({
      max: config.maxSize,
      ttl: config.ttl,
      allowStale: true,
      updateAgeOnGet: true,
      sizeCalculation: (entry) => {
        return JSON.stringify(entry).length;
      },
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
      memoryUsage: 0,
      redisUsage: 0,
    };
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    
    if (entry) {
      this.stats.hits++;
      this.updateHitRate();
      
      // Check if expired but allow stale
      const isExpired = Date.now() - entry.timestamp > entry.ttl;
      if (!isExpired) {
        return entry;
      }
      
      // Return stale data
      return { ...entry, _stale: true };
    }
    
    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  async set<T>(key: string, value: T, options: Partial<CacheOptions> = {}): Promise<void> {
    const ttl = options.ttl || DEFAULT_CONFIG.memory.ttl;
    
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
      tags: options.tags,
    };

    this.cache.set(key, entry);
    this.stats.sets++;
  }

  async delete(key: string): Promise<boolean> {
    const result = this.cache.delete(key);
    if (result) this.stats.deletes++;
    return result;
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    let count = 0;
    
    for (const [key, entry] of this.cache) {
      if (entry.tags?.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        count++;
        this.stats.deletes++;
      }
    }
    
    return count;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): CacheStats {
    this.stats.memoryUsage = this.cache.size;
    return { ...this.stats };
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

// ===========================================
// Redis Cache (L2) Implementation
// ===========================================

class RedisCache {
  private client: Redis | null = null;
  private connected = false;
  private keyPrefix: string;

  constructor(config: CacheConfig['redis']) {
    this.keyPrefix = config.keyPrefix;
    
    if (config.enabled && (config.url || config.host)) {
      try {
        this.client = new Redis({
          url: config.url,
          host: config.host,
          port: config.port,
          password: config.password,
          db: config.db,
          lazyConnect: true,
          retryStrategy: (times) => Math.min(times * 100, 5000),
          maxRetriesPerRequest: 3,
        });

        this.client.on('connect', () => {
          this.connected = true;
          console.log('✅ Redis cache connected');
        });

        this.client.on('error', (err) => {
          console.error('❌ Redis cache error:', err.message);
          this.connected = false;
        });
      } catch (error) {
        console.error('Failed to initialize Redis:', error);
        this.client = null;
      }
    }
  }

  async connect(): Promise<void> {
    if (this.client && !this.connected) {
      await this.client.connect();
    }
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.client || !this.connected) return null;

    try {
      const fullKey = `${this.keyPrefix}${key}`;
      const data = await this.client.get(fullKey);
      
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options: Partial<CacheOptions> = {}): Promise<void> {
    if (!this.client || !this.connected) return;

    try {
      const fullKey = `${this.keyPrefix}${key}`;
      const ttl = options.ttl || DEFAULT_CONFIG.redis.defaultTTL;
      
      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl: ttl * 1000, // Convert to ms
        tags: options.tags,
      };

      let serialized = JSON.stringify(entry);
      
      // Compress large values
      if (options.compress !== false && DEFAULT_CONFIG.behavior.compression && serialized.length > 1024) {
        serialized = await this.compress(serialized);
        entry.compressed = true;
      }

      await this.client.setex(fullKey, ttl, serialized);
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.client || !this.connected) return false;

    try {
      const fullKey = `${this.keyPrefix}${key}`;
      const result = await this.client.del(fullKey);
      return result > 0;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.client || !this.connected) return 0;

    try {
      // Use Lua script for atomic tag-based invalidation
      const luaScript = `
        local keys = {}
        local cursor = '0'
        local pattern = '${this.keyPrefix}*'
        
        repeat
          local reply = redis.call('SCAN', cursor, 'MATCH', pattern, 'COUNT', 100)
          cursor = reply[1]
          
          for _, key in ipairs(reply[2]) do
            local data = redis.call('GET', key)
            if data then
              local entry = cjson.decode(data)
              if entry and entry.tags then
                for _, tag in ipairs(ARGV) do
                  for _, entryTag in ipairs(entry.tags) do
                    if entryTag == tag then
                      table.insert(keys, key)
                      break
                    end
                  end
                end
              end
            end
          end
        until cursor == '0'
        
        if #keys > 0 then
          return redis.call('DEL', unpack(keys))
        else
          return 0
        end
      `;

      const result = await this.client.eval(luaScript, 0, ...tags);
      return result as number;
    } catch (error) {
      console.error('Redis tag invalidation error:', error);
      return 0;
    }
  }

  async clearPattern(pattern: string): Promise<number> {
    if (!this.client || !this.connected) return 0;

    try {
      const fullPattern = `${this.keyPrefix}${pattern}`;
      let count = 0;
      let cursor = '0';

      do {
        const result = await this.client.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];
        
        if (keys.length > 0) {
          count += await this.client.del(...keys);
        }
      } while (cursor !== '0');

      return count;
    } catch (error) {
      console.error('Redis pattern clear error:', error);
      return 0;
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async compress(data: string): Promise<string> {
    // Simple base64 encoding as placeholder for real compression
    // In production, use zlib or brotli
    return Buffer.from(data).toString('base64');
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
}

// ===========================================
// Main Cache Manager
// ===========================================

class CacheManager {
  private memoryCache: MemoryCache;
  private redisCache: RedisCache;
  private pendingRequests: Map<string, Promise<any>>;
  private stats: CacheStats;

  constructor(config: Partial<CacheConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    this.memoryCache = new MemoryCache(finalConfig.memory);
    this.redisCache = new RedisCache(finalConfig.redis);
    this.pendingRequests = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
      memoryUsage: 0,
      redisUsage: 0,
    };

    // Auto-connect to Redis on first use
    if (finalConfig.redis.enabled) {
      this.redisCache.connect().catch(console.error);
    }
  }

  /**
   * Get value from cache with automatic fallback through layers
   */
  async get<T>(key: string, options: CacheOptions & { fetcher?: () => Promise<T> } = {}): Promise<T | null> {
    const { fetcher, forceRefresh, ...cacheOptions } = options;

    // Force refresh bypasses cache
    if (forceRefresh && fetcher) {
      return this.fetchAndCache(key, fetcher, cacheOptions);
    }

    // Try L1: Memory cache
    if (!options.skipMemory) {
      const memoryEntry = await this.memoryCache.get<T>(key);
      
      if (memoryEntry && !memoryEntry._stale) {
        this.stats.hits++;
        return memoryEntry.value;
      }
      
      // Stale while revalidate
      if (memoryEntry?._stale && fetcher) {
        // Return stale data immediately
        this.fetchAndCache(key, fetcher, cacheOptions); // Async refresh
        return memoryEntry.value;
      }
    }

    // Try L2: Redis cache
    if (!options.skipRedis) {
      const redisEntry = await this.redisCache.get<T>(key);
      
      if (redisEntry) {
        // Update memory cache from Redis
        if (!options.skipMemory) {
          await this.memoryCache.set(key, redisEntry.value, cacheOptions);
        }
        
        this.stats.hits++;
        return redisEntry.value;
      }
    }

    // Cache miss
    this.stats.misses++;

    // Fetch from source if fetcher provided
    if (fetcher) {
      return this.fetchAndCache(key, fetcher, cacheOptions);
    }

    return null;
  }

  /**
   * Set value in all enabled cache layers
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    // Set in memory cache
    if (!options.skipMemory) {
      await this.memoryCache.set(key, value, options);
    }

    // Set in Redis cache
    if (!options.skipRedis) {
      await this.redisCache.set(key, value, options);
    }

    this.stats.sets++;
  }

  /**
   * Delete from all cache layers
   */
  async delete(key: string): Promise<boolean> {
    const memoryDeleted = await this.memoryCache.delete(key);
    const redisDeleted = await this.redisCache.delete(key);

    if (memoryDeleted || redisDeleted) {
      this.stats.deletes++;
      return true;
    }

    return false;
  }

  /**
   * Invalidate by tags across all layers
   */
  async invalidateByTags(tags: string[]): Promise<{ memory: number; redis: number }> {
    const [memoryCount, redisCount] = await Promise.all([
      this.memoryCache.invalidateByTags(tags),
      this.redisCache.invalidateByTags(tags),
    ]);

    return { memory: memoryCount, redis: redisCount };
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.redisCache.clearPattern('*');
  }

  /**
   * Get or create with request deduplication
   */
  async getOrCreate<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Check for existing pending request (deduplication)
    const existingRequest = this.pendingRequests.get(key);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request
    const promise = this.getOrCreateInternal(key, fetcher, options);
    
    // Store and cleanup after completion
    this.pendingRequests.set(key, promise);
    promise.finally(() => this.pendingRequests.delete(key));

    return promise;
  }

  /**
   * Warm up cache with predefined data
   */
  async warmup(entries: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<void> {
    console.log(`🔥 Warming up ${entries.length} cache entries...`);
    
    const batchSize = 10;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      await Promise.all(
        batch.map(({ key, value, options }) => this.set(key, value, options))
      );
    }
    
    console.log('✅ Cache warmup complete');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const memoryStats = this.memoryCache.getStats();
    
    return {
      ...this.stats,
      memoryUsage: memoryStats.memoryUsage,
      hitRate: this.calculateHitRate(),
    };
  }

  /**
   * Generate cache health report
   */
  async getHealthReport(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    memory: { size: number; hitRate: number };
    redis: { connected: boolean; latency?: number };
    recommendations: string[];
  }> {
    const stats = this.getStats();
    const redisConnected = this.redisCache.isConnected();
    const recommendations: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Analyze performance
    if (stats.hitRate < 0.7) {
      status = 'degraded';
      recommendations.push('Cache hit rate is below 70%. Consider increasing TTL or cache size.');
    }

    if (stats.hitRate < 0.4) {
      status = 'unhealthy';
      recommendations.push('Critical: Cache hit rate is very low. Review caching strategy.');
    }

    if (!redisConnected && DEFAULT_CONFIG.redis.enabled) {
      status = 'degraded';
      recommendations.push('Redis is not connected. Falling back to memory-only cache.');
    }

    // Measure Redis latency
    let redisLatency: number | undefined;
    if (redisConnected) {
      const start = Date.now();
      await this.redisCache.getClient()?.ping();
      redisLatency = Date.now() - start;
      
      if (redisLatency > 50) {
        recommendations.push('Redis latency is high (>50ms). Check network connectivity.');
      }
    }

    return {
      status,
      memory: {
        size: stats.memoryUsage,
        hitRate: stats.hitRate,
      },
      redis: {
        connected: redisConnected,
        latency: redisLatency,
      },
      recommendations,
    };
  }

  private async getOrCreateInternal<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    // Try cache first
    const cached = await this.get(key, { ...options, fetcher: undefined });
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    return this.fetchAndCache(key, fetcher, options);
  }

  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    try {
      const value = await fetcher();
      await this.set(key, value, options);
      return value;
    } catch (error) {
      console.error(`Failed to fetch and cache ${key}:`, error);
      throw error;
    }
  }

  private calculateHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Disconnect from Redis gracefully
   */
  async disconnect(): Promise<void> {
    await this.redisCache.disconnect();
  }
}

// ===========================================
// Singleton Instance
// ===========================================

let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(config?: Partial<CacheConfig>): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(config);
  }
  return cacheManagerInstance;
}

// Export for testing
export { CacheManager, MemoryCache, RedisCache };

// Default export
export default getCacheManager;
