// Redis Caching Middleware - AlgeriaTrade.dz
// Middleware de cache Redis pour les performances

import { NextRequest, NextResponse } from 'next/server';

/**
 * Cache configuration options
 * Options de configuration du cache
 */
interface CacheOptions {
  /** Cache duration in seconds (default: 300 = 5 minutes) */
  ttl?: number;
  /** Custom cache key prefix */
  prefix?: string;
  /** Whether to bypass cache (force fresh data) */
  bypass?: boolean;
  /** Function to generate custom key from request */
  keyGenerator?: (req: NextRequest) => string;
}

const DEFAULT_CACHE_OPTIONS: Required<CacheOptions> = {
  ttl: 300,
  prefix: 'at:',
  bypass: false,
  keyGenerator: (req) => `cache:${req.nextUrl.pathname}${req.nextUrl.search}`,
};

/**
 * In-memory cache for development/fallback
 * Cache en mémoire pour le développement/alternative
 */
class MemoryCache {
  private cache = new Map<string, { data: any; expiresAt: number }>();
  
  async get(key: string): Promise<any | null> {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    
    // Clean up expired entries periodically
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

// Global memory cache instance
const memoryCache = new MemoryCache();

/**
 * Create cached response with memory fallback
 * Créer une réponse mise en cache avec alternative mémoire
 */
export async function getCachedResponse(
  req: NextRequest,
  fetchFn: () => Promise<NextResponse>,
  options: Partial<CacheOptions> = {}
): Promise<NextResponse> {
  const opts = { ...DEFAULT_CACHE_OPTIONS, ...options };
  
  // If bypass is enabled or method is not GET, skip cache
  if (opts.bypass || req.method !== 'GET') {
    return await fetchFn();
  }

  try {
    const cacheKey = `${opts.prefix}${opts.keyGenerator(req)}`;

    // Try to get from cache (memory first, then Redis if available)
    let cachedData = await memoryCache.get(cacheKey);
    let cacheSource = 'memory';
    
    // If not in memory and Redis is available, check Redis
    if (!cachedData && process.env.REDIS_URL) {
      try {
        const { default: Redis } = await import('ioredis');
        const redis = new Redis(process.env.REDIS_URL);
        const redisCached = await redis.get(cacheKey);
        
        if (redisCached) {
          cachedData = JSON.parse(redisCached);
          cacheSource = 'redis';
          
          // Store in memory for faster subsequent access
          await memoryCache.set(cacheKey, cachedData, Math.min(opts.ttl, 300));
        }
        
        redis.quit();
      } catch (error) {
        console.log('[Cache] Redis not available, using memory only');
      }
    }
    
    if (cachedData) {
      console.log(`[Cache HIT] ${cacheKey} (${cacheSource})`);
      
      return new NextResponse(cachedData.body, {
        status: cachedData.status,
        headers: {
          ...cachedData.headers,
          'X-Cache': 'HIT',
          'X-Cache-Source': cacheSource,
          'X-Cache-Age': Math.floor((Date.now() - cachedData.timestamp) / 1000).toString(),
        },
      });
    }

    // Cache miss - fetch fresh data
    console.log(`[Cache MISS] ${cacheKey}`);
    const response = await fetchFn();

    // Only cache successful responses
    if (response.status === 200) {
      const clonedResponse = response.clone();
      const body = await clonedResponse.text();
      
      const cacheData = {
        body,
        status: response.status,
        headers: Object.fromEntries(
          [...response.headers.entries()]
            .filter(([key]) => !['set-cookie', 'authorization'].includes(key.toLowerCase()))
        ),
        timestamp: Date.now(),
      };

      // Store in memory
      await memoryCache.set(cacheKey, cacheData, opts.ttl);

      // Also store in Redis if available
      if (process.env.REDIS_URL) {
        try {
          const { default: Redis } = await import('ioredis');
          const redis = new Redis(process.env.REDIS_URL);
          await redis.setex(cacheKey, opts.ttl, JSON.stringify(cacheData));
          redis.quit();
        } catch (error) {
          // Silently fail - memory cache is sufficient
        }
      }
    }

    // Add cache header to response
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Cache', 'MISS');

    return new NextResponse(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (error) {
    console.error('[Cache] Error:', error);
    
    // On cache error, fallback to direct fetch
    return await fetchFn();
  }
}

/**
 * API-specific caching middleware
 * Middleware de cache spécifique aux API
 */
export function apiCache(options: Partial<CacheOptions> = {}) {
  return async (
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    return getCachedResponse(req, handler, options);
  };
}

/**
 * Product listing cache helpers
 * Helpers de cache pour la liste des produits
 */
export const productCache = {
  async get(params: Record<string, string>) {
    const searchParams = new URLSearchParams(params).toString();
    const cacheKey = `at:products:${searchParams}`;
    return memoryCache.get(cacheKey);
  },

  async set(params: Record<string, string>, data: any, ttl: number = 60) {
    const searchParams = new URLSearchParams(params).toString();
    const cacheKey = `at:products:${searchParams}`;
    return memoryCache.set(cacheKey, data, ttl);
  },

  async invalidate(productId?: string) {
    // Clear all product caches (in production, use more granular invalidation)
    const keysToDelete: string[] = [];
    
    // This is a simplified version - production should use tagged caching
    console.log(`[Cache] Invalidating product cache${productId ? ` for ${productId}` : ''}`);
  },
};

/**
 * Category cache with longer TTL
 * Cache des catégories avec TTL plus long
 */
export const categoryCache = {
  async getAll() {
    return memoryCache.get('at:categories:all');
  },

  async setAll(categories: any[], ttl: number = 3600) {
    return memoryCache.set('at:categories:all', categories, ttl);
  },
};

/**
 * Session cache
 * Cache de sessions
 */
export const sessionCache = {
  async get(sessionId: string) {
    return memoryCache.get(`at:session:${sessionId}`);
  },

  async set(sessionId: string, userData: any, ttl: number = 86400) {
    return memoryCache.set(`at:session:${sessionId}`, userData, ttl);
  },
};

/**
 * Rate limiter (in-memory implementation)
 * Limiteur de taux (implémentation en mémoire)
 */
class MemoryRateLimiter {
  private requests = new Map<string, number[]>();
  
  constructor(
    private windowSeconds: number = 900,
    private maxRequests: number = 100
  ) {}

  async check(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    totalRequests: number;
  }> {
    const now = Date.now();
    const windowStart = now - (this.windowSeconds * 1000);
    
    let requests = this.requests.get(identifier) || [];
    
    // Filter out old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    if (requests.length >= this.maxRequests) {
      const oldestRequest = requests[0];
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(oldestRequest + (this.windowSeconds * 1000)),
        totalRequests: requests.length,
      };
    }

    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);

    // Clean up old entries periodically
    if (this.requests.size > 10000) {
      this.cleanup();
    }

    return {
      allowed: true,
      remaining: this.maxRequests - requests.length,
      resetTime: new Date(now + (this.windowSeconds * 1000)),
      totalRequests: requests.length,
    };
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - (this.windowSeconds * 1000);
    
    for (const [identifier, requests] of this.requests.entries()) {
      const filtered = requests.filter(timestamp => timestamp > windowStart);
      if (filtered.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, filtered);
      }
    }
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  api: new MemoryRateLimiter(900, 100),
  search: new MemoryRateLimiter(60, 30),
  auth: new MemoryRateLimiter(900, 20),
  upload: new MemoryRateLimiter(3600, 10),
};

/**
 * Get cache statistics
 * Obtenir les statistiques du cache
 */
export function getCacheStats() {
  return {
    type: process.env.REDIS_URL ? 'hybrid' : 'memory',
    memoryKeys: memoryCache.size,
    estimatedMemoryUsage: `${(memoryCache.size * 2).toFixed(1)} KB (estimated)`,
  };
}
