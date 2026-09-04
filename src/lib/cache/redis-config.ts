/**
 * Redis Configuration - AlgeriaTrade.dz
 * Configuration Redis pour le cache, sessions, et rate limiting en production
 */

export interface RedisConfig {
  url: string;
  tls: boolean;
  password?: string;
  db: number;
  keyPrefix: string;
  maxRetriesPerRequest: number;
  enableReadyCheck: boolean;
  retryDelayOnFailover: number;
  connectTimeout: number;
  commandTimeout: number;
  maxClientsPerCluster: number;
}

// Default Redis configuration
export function getRedisConfig(): RedisConfig {
  return {
    url: process.env.REDIS_PRIMARY_URL || 'redis://localhost:6379',
    tls: process.env.REDIS_TLS === 'true',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'algeriatrade:',
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
    retryDelayOnFailover: parseInt(process.env.RETRY_DELAY_ON_FAILOVER || '100'),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000'),
    maxClientsPerCluster: parseInt(process.env.REDIS_MAX_CLIENTS || '10'),
  };
}

// Key namespaces for different data types
export const REDIS_KEYS = {
  // Session storage
  session: (userId: string) => `session:${userId}`,
  
  // Rate limiting
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${endpoint}:${ip}`,
  
  // Cache
  cache: (key: string) => `cache:${key}`,
  product: (id: string) => `cache:product:${id}`,
  company: (id: string) => `cache:company:${id}`,
  searchResults: (query: string) => `cache:search:${query.hashCode()}`,
  
  // Real-time features
  onlineUsers: 'online:users',
  userPresence: (userId: string) => `presence:${userId}`,
  websocketSession: (sessionId: string) => `ws:session:${sessionId}`,
  
  // Queue jobs
  queue: (name: string) => `queue:${name}`,
  job: (queueName: string, jobId: string) => `queue:${queueName}:job:${jobId}`,
  
  // Analytics counters
  pageView: (path: string) => `analytics:page:${path}`,
  eventCount: (event: string) => `analytics:event:${event}`,
  
  // Rate limiters
  apiRateLimit: (ip: string) => `limit:api:${ip}`,
  authRateLimit: (ip: string) => `limit:auth:${ip}`,
  uploadRateLimit: (ip: string) => `limit:upload:${ip}`,
  
  // Feature flags
  featureFlag: (flag: string) => `feature:${flag}`,
  
  // Temporary locks
  lock: (resource: string) => `lock:${resource}`,
};

// TTL values (in seconds)
export const REDIS_TTL = {
  // Sessions
  session: 7 * 24 * 60 * 60, // 7 days
  
  // Cache
  product: 5 * 60, // 5 minutes
  company: 10 * 60, // 10 minutes
  searchResults: 60, // 1 minute
  static: 24 * 60 * 60, // 24 hours
  
  // Rate limiting
  rateLimitWindow: 15 * 60, // 15 minutes
  authRateLimitWindow: 15 * 60, // 15 minutes
  
  // Presence
  userPresence: 30, // 30 seconds
  
  // Locks
  lock: 30, // 30 seconds
  
  // Analytics (aggregated before persisting)
  analyticsBuffer: 60, // 1 minute
};

/**
 * Redis client factory - creates connection based on environment
 */
export async function createRedisClient() {
  const config = getRedisConfig();
  
  // Dynamic import to avoid loading redis in environments without it
  try {
    const redis = await import('redis');

    const client = redis.createClient({
      url: config.url,
      password: config.password,
      socket: {
        tls: config.tls,
        reconnectStrategy: (retries: number) => {
          if (retries > config.maxRetriesPerRequest) {
            console.error('[Redis] Max retries reached');
            return new Error('Too many retries');
          }
          return Math.min(retries * 100, 3000);
        },
      },
      database: config.db,
      prefix: config.keyPrefix,
    });

    client.on('error', (err: Error) => {
      console.error('[Redis] Connection error:', err.message);
    });

    client.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.warn('[Redis] Redis package not available, using in-memory fallback');
    return createInMemoryFallback();
  }
}

/**
 * In-memory fallback when Redis is not available
 * WARNING: This does not work across multiple instances!
 */
function createInMemoryFallback() {
  const store = new Map<string, { value: string; expiry?: number }>();
  
  return {
    async get(key: string): Promise<string | null> {
      const item = store.get(key);
      if (!item) return null;
      if (item.expiry && item.expiry < Date.now()) {
        store.delete(key);
        return null;
      }
      return item.value;
    },
    
    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
      store.set(key, {
        value,
        expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
      });
    },
    
    async del(key: string): Promise<void> {
      store.delete(key);
    },
    
    async incr(key: string): Promise<number> {
      const item = store.get(key);
      const value = item ? parseInt(item.value) || 0 : 0;
      const newValue = value + 1;
      store.set(key, { value: String(newValue), expiry: item?.expiry });
      return newValue;
    },
    
    async expire(key: string, seconds: number): Promise<boolean> {
      const item = store.get(key);
      if (!item) return false;
      item.expiry = Date.now() + seconds * 1000;
      return true;
    },
    
    async exists(key: string): Promise<number> {
      const item = store.get(key);
      if (!item) return 0;
      if (item.expiry && item.expiry < Date.now()) {
        store.delete(key);
        return 0;
      }
      return 1;
    },
    
    async quit(): Promise<void> {
      store.clear();
    },
    
    on(event: string, callback: Function): void {
      // No-op for in-memory fallback
    },
    
    isFallback: true,
  };
}

// Singleton instance
let redisInstance: any = null;

/**
 * Get or create Redis client singleton
 */
export async function getRedisClient(): Promise<any> {
  if (!redisInstance || !redisInstance.isOpen) {
    redisInstance = await createRedisClient();
  }
  return redisInstance;
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  error?: string;
}> {
  try {
    const client = await getRedisClient();
    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;
    
    if (latency > 100) {
      return { status: 'degraded', latency, error: 'High latency' };
    }
    
    return { status: 'healthy', latency };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
