/**
 * Redis-Backed Rate Limiter for Production Scalability
 * 
 * Features:
 * - Redis-based storage for horizontal scaling
 * - Fallback to in-memory if Redis unavailable
 * - Sliding window algorithm for accurate rate limiting
 * - Automatic cleanup of expired keys
 * - Metrics and monitoring support
 */

import { Redis } from 'ioredis';

// Types
export interface RedisRateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export interface RedisRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
  retryAfter?: number;
  source: 'redis' | 'memory'; // For monitoring
}

interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

// Fallback in-memory store (used when Redis unavailable)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

// Redis client instance (lazy initialization)
let redisClient: Redis | null = null;
let redisAvailable = false;

/**
 * Initialize Redis connection
 */
export async function initRedisRateLimiter(config?: RedisConfig): Promise<boolean> {
  try {
    if (config?.url) {
      redisClient = new Redis(config.url);
    } else {
      redisClient = new Redis({
        host: config?.host || process.env.REDIS_HOST || 'localhost',
        port: config?.port || parseInt(process.env.REDIS_PORT || '6379'),
        password: config?.password || process.env.REDIS_PASSWORD,
        db: config?.db || parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryDelayOnFailover: 100,
        lazyConnect: true,
      });
    }

    // Test connection
    await redisClient.ping();
    redisAvailable = true;
    
    console.log('✅ Redis rate limiter connected successfully');
    return true;
  } catch (error) {
    console.warn('⚠️ Redis unavailable, falling back to in-memory rate limiting:', error);
    redisAvailable = false;
    return false;
  }
}

/**
 * Generate rate limit key
 */
function getRateLimitKey(identifier: string, endpointType: string): string {
  return `ratelimit:${endpointType}:${identifier}`;
}

/**
 * Check rate limit using Redis (sliding window)
 */
async function checkRedisRateLimit(
  identifier: string,
  endpointType: string,
  config: RedisRateLimitConfig
): Promise<RedisRateLimitResult> {
  const key = getRateLimitKey(identifier, endpointType);
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redisClient!.pipeline();
    
    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests in window
    pipeline.zcard(key);
    
    // Add new request
    pipeline.zadd(key, now, `${now}-${Math.random().toString(36).substring(7)}`);
    
    // Set expiry on the key (auto-cleanup)
    pipeline.pexpire(key, config.windowMs + 1000);
    
    const results = await pipeline.exec();
    
    if (!results) throw new Error('Pipeline execution failed');
    
    const currentCount = results[1][1] as number; // zcard result
    
    const remaining = Math.max(0, config.maxRequests - currentCount);
    const allowed = currentCount <= config.maxRequests;
    
    return {
      allowed,
      remaining,
      resetTime: new Date(now + config.windowMs),
      limit: config.maxRequests,
      retryAfter: allowed ? undefined : Math.ceil(config.windowMs / 1000),
      source: 'redis',
    };
  } catch (error) {
    console.error('Redis rate limit error, falling back to memory:', error);
    return checkMemoryRateLimit(identifier, endpointType, config);
  }
}

/**
 * Fallback in-memory rate limit check
 */
function checkMemoryRateLimit(
  identifier: string,
  endpointType: string,
  config: RedisRateLimitConfig
): RedisRateLimitResult {
  const key = `${identifier}:${endpointType}`;
  const now = Date.now();
  const record = memoryStore.get(key);
  
  // Create new record if none exists or window expired
  if (!record || now > record.resetTime) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: new Date(now + config.windowMs),
      limit: config.maxRequests,
      source: 'memory',
    };
  }
  
  // Increment counter
  record.count++;
  
  const remaining = Math.max(0, config.maxRequests - record.count);
  const allowed = record.count <= config.maxRequests;
  
  return {
    allowed,
    remaining,
    resetTime: new Date(record.resetTime),
    limit: config.maxRequests,
    retryAfter: allowed ? undefined : Math.ceil((record.resetTime - now) / 1000),
    source: 'memory',
  };
}

/**
 * Main rate limit check function (automatically chooses Redis or Memory)
 */
export async function checkRateLimit(
  identifier: string,
  endpointType: string,
  config: RedisRateLimitConfig
): Promise<RedisRateLimitResult> {
  // Try Redis first if available
  if (redisAvailable && redisClient) {
    return checkRedisRateLimit(identifier, endpointType, config);
  }
  
  // Fall back to memory
  return checkMemoryRateLimit(identifier, endpointType, config);
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  identifier: string,
  endpointType: string,
  config: RedisRateLimitConfig
): Promise<RedisRateLimitResult | null> {
  if (redisAvailable && redisClient) {
    const key = getRateLimitKey(identifier, endpointType);
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    try {
      const pipeline = redisClient.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zcard(key);
      
      const results = await pipeline.exec();
      const currentCount = results ? (results[1][1] as number) : 0;
      
      return {
        allowed: currentCount < config.maxRequests,
        remaining: Math.max(0, config.maxRequests - currentCount),
        resetTime: new Date(now + config.windowMs),
        limit: config.maxRequests,
        source: 'redis',
      };
    } catch (error) {
      console.error('Error getting Redis rate limit status:', error);
    }
  }
  
  // Memory fallback
  const key = `${identifier}:${endpointType}`;
  const record = memoryStore.get(key);
  
  if (!record || Date.now() > record.resetTime) return null;
  
  return {
    allowed: record.count < config.maxRequests,
    remaining: Math.max(0, config.maxRequests - record.count),
    resetTime: new Date(record.resetTime),
    limit: config.maxRequests,
    source: 'memory',
  };
}

/**
 * Reset rate limit for a specific identifier (admin use)
 */
export async function resetRateLimit(
  identifier: string,
  endpointType: string
): Promise<boolean> {
  if (redisAvailable && redisClient) {
    const key = getRateLimitKey(identifier, endpointType);
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Error resetting Redis rate limit:', error);
      return false;
    }
  }
  
  // Memory fallback
  const key = `${identifier}:${endpointType}`;
  return memoryStore.delete(key);
}

/**
 * Get metrics about rate limiter usage
 */
export function getRateLimiterMetrics(): {
  redisAvailable: boolean;
  memoryEntries: number;
  uptime: number | null;
} {
  return {
    redisAvailable,
    memoryEntries: memoryStore.size,
    uptime: redisClient ? redisClient.status === 'ready' ? null : 0 : null,
  };
}

/**
 * Cleanup old memory entries (call periodically)
 */
export function cleanupMemoryStore(): void {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of memoryStore.entries()) {
    if (now > value.resetTime) {
      memoryStore.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired rate limit entries`);
  }
}

// Auto-cleanup memory store every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(cleanupMemoryStore, 5 * 60_000);
}

// Initialize Redis on import if configured
if (process.env.REDIS_URL || process.env.REDIS_HOST) {
  initRedisRateLimiter().catch(console.error);
}
