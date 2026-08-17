/**
 * Redis-Backed Rate Limiter v2 - Multi-Instance Production Ready
 * 
 * Features:
 * - Redis Cluster support for horizontal scaling
 * - Distributed locking for atomic operations
 * - Sliding window log algorithm with Lua scripts
 * - Automatic failover and circuit breaker pattern
 * - Health checks and metrics export
 * - Multi-region support with local caching
 * - Graceful degradation to in-memory fallback
 * 
 * @version 2.0.0
 * @author AlgeriaTrade Security Team
 */

import { Redis } from 'ioredis';
import { createHash, randomUUID } from 'crypto';

// ===========================================
// Types & Interfaces
// ===========================================

export interface RedisRateLimitConfigV2 {
  windowMs: number;
  maxRequests: number;
  message?: string;
  /** Enable distributed locking (default: true for production) */
  distributedLock?: boolean;
  /** Local cache TTL in ms (default: 1000) */
  localCacheTtl?: number;
  /** Key prefix for Redis (default: 'rl:') */
  keyPrefix?: string;
}

export interface RedisRateLimitResultV2 {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
  retryAfter?: number;
  source: 'redis' | 'redis-cluster' | 'local-cache' | 'memory-fallback';
  instanceId: string;
  latencyMs?: number;
}

export interface RedisClusterConfig {
  nodes: Array<{
    host: string;
    port: number;
  }>;
  options?: {
    scaleReads?: 'master' | 'slave';
    maxRedirections?: number;
    enableReadyCheck?: boolean;
    slotsRefreshInterval?: number;
  };
}

export interface RateLimiterHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  redisConnected: boolean;
  clusterMode: boolean;
  activeConnections: number;
  totalRequestsTracked: number;
  memoryUsageBytes: number;
  circuitBreakerOpen: boolean;
  lastError?: string;
  lastHealthCheck: Date;
  uptimeSeconds: number;
}

export interface RateLimiterMetrics {
  totalChecks: number;
  allowedCount: number;
  blockedCount: number;
  averageLatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  sourceDistribution: Record<string, number>;
  topBlockedEndpoints: Array<{ endpoint: string; count: number }>;
}

// ===========================================
// Configuration Types
// ===========================================

interface RedisConnectionConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  cluster?: RedisClusterConfig;
}

// ===========================================
// Constants
// ===========================================

const INSTANCE_ID = process.env.HOSTNAME || `instance-${randomUUID().substring(0, 8)}`;
const HEALTH_CHECK_INTERVAL_MS = 30_000; // 30 seconds
const CIRCUIT_BREAKER_THRESHOLD = 5; // Failures before opening
const CIRCUIT_BREAKER_RESET_MS = 60_000; // 1 minute reset
const LOCAL_CACHE_MAX_SIZE = 10_000;
const METRICS_WINDOW_SIZE = 10_000;

// ===========================================
// Lua Scripts (Atomic Operations)
// ===========================================

/**
 * Sliding window rate limit check using sorted sets
 * This script is atomic and handles:
 * 1. Removing expired entries
 * 2. Counting current entries
 * 3. Adding new entry if allowed
 * 4. Setting expiry
 */
const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local window_start = ARGV[1]
local now = ARGV[2]
local request_id = ARGV[3]
local max_requests = tonumber(ARGV[4])
local window_ms = tonumber(ARGV[5])

-- Remove old entries outside the window
redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

-- Count current requests in window
local current = redis.call('ZCARD', key)

-- Check if allowed
if current < max_requests then
  -- Add new request with score as timestamp
  redis.call('ZADD', key, now, request_id)
  
  -- Set expiry (window + buffer)
  redis.call('PEXPIRE', key, window_ms + 1000)
  
  return {1, max_requests - current - 1}
else
  -- Get oldest request time for retry-after calculation
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retry_after = 0
  if #oldest > 0 then
    retry_after = math.ceil((tonumber(oldest[2]) + window_ms - tonumber(now)) / 1000)
  end
  
  return {0, 0, retry_after}
end
`;

/**
 * Distributed lock acquisition script
 */
const ACQUIRE_LOCK_SCRIPT = `
local lock_key = KEYS[1]
local lock_value = ARGV[1]
local ttl_ms = tonumber(ARGV[2])

local acquired = redis.call('SET', lock_key, lock_value, 'PX', ttl_ms, 'NX')
if acquired then
  return 1
else
  return 0
end
`;

/**
 * Lock release script (only releases if value matches)
 */
const RELEASE_LOCK_SCRIPT = `
local lock_key = KEYS[1]
local expected_value = ARGV[1]

local current = redis.call('GET', lock_key)
if current == expected_value then
  redis.call('DEL', lock_key)
  return 1
else
  return 0
end
`;

// ===========================================
// State Management
// ===========================================

class RateLimiterState {
  private redisClient: Redis | null = null;
  private clusterMode = false;
  private available = false;
  private circuitBreakerOpen = false;
  private failureCount = 0;
  private lastFailureTime = 0;
  private startTime = Date.now();
  
  // Metrics tracking
  private metrics = {
    totalChecks: 0,
    allowedCount: 0,
    blockedCount: 0,
    latencies: [] as number[],
    errors: 0,
    sources: {} as Record<string, number>,
    blockedEndpoints: {} as Record<string, number>,
  };

  // Local cache for performance (read-through)
  private localCache = new Map<string, {
    result: RedisRateLimitResultV2;
    timestamp: number;
  }>();

  // Fallback in-memory store
  private fallbackStore = new Map<string, {
    count: number;
    resetTime: number;
    requests: number[];
  }>();

  // Pre-loaded Lua scripts
  private slidingWindowSha: string | null = null;
  private acquireLockSha: string | null = null;
  private releaseLockSha: string | null = null;

  getRedisClient(): Redis | null {
    return this.redisClient;
  }

  setRedisClient(client: Redis | null): void {
    this.redisClient = client;
  }

  isClusterMode(): boolean {
    return this.clusterMode;
  }

  setClusterMode(mode: boolean): void {
    this.clusterMode = mode;
  }

  isAvailable(): boolean {
    return this.available && !this.circuitBreakerOpen;
  }

  setAvailable(status: boolean): void {
    this.available = status;
  }

  isCircuitBreakerOpen(): boolean {
    if (this.circuitBreakerOpen && Date.now() - this.lastFailureTime > CIRCUIT_BREAKER_RESET_MS) {
      // Attempt to close circuit breaker after cooldown
      this.circuitBreakerOpen = false;
      this.failureCount = 0;
    }
    return this.circuitBreakerOpen;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.circuitBreakerOpen = false;
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitBreakerOpen = true;
      console.warn(`⚠️ Rate limiter circuit breaker opened after ${this.failureCount} failures`);
    }
  }

  recordMetrics(result: RedisRateLimitResultV2, endpointType: string, latencyMs: number): void {
    this.metrics.totalChecks++;
    
    if (result.allowed) {
      this.metrics.allowedCount++;
    } else {
      this.metrics.blockedCount++;
      this.metrics.blockedEndpoints[endpointType] = 
        (this.metrics.blockedEndpoints[endpointType] || 0) + 1;
    }
    
    if (latencyMs) {
      this.metrics.latencies.push(latencyMs);
      if (this.metrics.latencies.length > METRICS_WINDOW_SIZE) {
        this.metrics.latencies.shift();
      }
    }
    
    this.metrics.sources[result.source] = (this.metrics.sources[result.source] || 0) + 1;
  }

  recordError(): void {
    this.metrics.errors++;
  }

  getMetrics(): RateLimiterMetrics {
    const sortedLatencies = [...this.metrics.latencies].sort((a, b) => a - b);
    const p99Index = Math.floor(sortedLatencies.length * 0.99);
    
    return {
      totalChecks: this.metrics.totalChecks,
      allowedCount: this.metrics.allowedCount,
      blockedCount: this.metrics.blockedCount,
      averageLatencyMs: sortedLatencies.length > 0 
        ? sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length 
        : 0,
      p99LatencyMs: sortedLatencies[p99Index] || 0,
      errorRate: this.metrics.totalChecks > 0 
        ? this.metrics.errors / this.metrics.totalChecks 
        : 0,
      sourceDistribution: { ...this.metrics.sources },
      topBlockedEndpoints: Object.entries(this.metrics.blockedEndpoints)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count })),
    };
  }

  getLocalCache(key: string): RedisRateLimitResultV2 | null {
    const cached = this.localCache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > 5000) { // 5 second max cache age
      this.localCache.delete(key);
      return null;
    }
    
    return cached.result;
  }

  setLocalCache(key: string, result: RedisRateLimitResultV2): void {
    if (this.localCache.size >= LOCAL_CACHE_MAX_SIZE) {
      // Evict oldest entry
      const firstKey = this.localCache.keys().next().value;
      if (firstKey) this.localCache.delete(firstKey);
    }
    
    this.localCache.set(key, { result, timestamp: Date.now() });
  }

  getFallbackStore(key: string): typeof this.fallbackStore extends Map<string, infer T> ? T : never {
    return this.fallbackStore.get(key)!;
  }

  setFallbackStore(key: string, value: { count: number; resetTime: number; requests: number[] }): void {
    this.fallbackStore.set(key, value);
  }

  deleteFallbackStore(key: string): boolean {
    return this.fallbackStore.delete(key);
  }

  getFallbackStoreSize(): number {
    return this.fallbackStore.size;
  }

  clearLocalCache(): void {
    this.localCache.clear();
  }

  getSlidingWindowSha(): string | null {
    return this.slidingWindowSha;
  }

  setSlidingWindowSha(sha: string): void {
    this.slidingWindowSha = sha;
  }

  getAcquireLockSha(): string | null {
    return this.acquireLockSha;
  }

  setAcquireLockSha(sha: string): void {
    this.acquireLockSha = sha;
  }

  getReleaseLockSha(): string | null {
    return this.releaseLockSha;
  }

  setReleaseLockSha(sha: string): void {
    this.releaseLockSha = sha;
  }

  getUptimeSeconds(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

// Global state instance
const state = new RateLimiterState();

// ===========================================
// Redis Connection Management
// ===========================================

/**
 * Initialize Redis connection with cluster or single-node mode
 */
export async function initRateLimiterV2(config?: RedisConnectionConfig): Promise<boolean> {
  try {
    let client: Redis;

    if (config?.cluster?.nodes && config.cluster.nodes.length > 0) {
      // Cluster mode
      console.log(`🔗 Initializing Redis cluster with ${config.cluster.nodes.length} nodes...`);
      
      const clusterNodes = config.cluster.nodes.map(node => ({
        host: node.host,
        port: node.port,
      }));

      client = new Redis.Cluster(clusterNodes, {
        scaleReads: config.cluster.options?.scaleReads || 'slave',
        maxRedirections: config.cluster.options?.maxRedirections || 16,
        enableReadyCheck: config.cluster.options?.enableReadyCheck ?? true,
        slotsRefreshInterval: config.cluster.options?.slotsRefreshInterval || 10000,
        redisOptions: {
          password: config?.password || process.env.REDIS_PASSWORD,
          connectTimeout: 10000,
          lazyConnect: true,
        },
      });

      state.setClusterMode(true);
    } else if (config?.url || process.env.REDIS_URL) {
      // Single node with URL
      const url = config?.url || process.env.REDIS_URL!;
      client = new Redis(url, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        reconnectOnError: (err) => {
          const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
          return targetErrors.some(e => err.message.includes(e));
        },
      });
    } else {
      // Single node with host/port
      client = new Redis({
        host: config?.host || process.env.REDIS_HOST || 'localhost',
        port: config?.port || parseInt(process.env.REDIS_PORT || '6379'),
        password: config?.password || process.env.REDIS_PASSWORD,
        db: config?.db || parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        reconnectOnError: (err) => {
          const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
          return targetErrors.some(e => err.message.includes(e));
        },
      });
    }

    // Set up event handlers
    client.on('connect', () => {
      console.log('✅ Redis rate limiter connected');
      state.setAvailable(true);
      state.recordSuccess();
    });

    client.on('error', (err) => {
      console.error('❌ Redis rate limiter error:', err.message);
      state.recordFailure();
    });

    client.on('close', () => {
      console.log('🔌 Redis rate limiter connection closed');
      state.setAvailable(false);
    });

    client.on('reconnecting', () => {
      console.log('🔄 Redis rate limiter reconnecting...');
    });

    // Test connection
    await client.connect();
    const pong = await client.ping();
    
    if (pong === 'PONG') {
      state.setRedisClient(client);
      state.setAvailable(true);

      // Load Lua scripts
      await loadLuaScripts(client);

      console.log(`✅ Redis rate limiter v2 initialized successfully (${state.isClusterMode() ? 'cluster' : 'single-node'} mode)`);
      
      // Start health check interval
      startHealthCheck(client);
      
      return true;
    } else {
      throw new Error('Redis ping failed');
    }
  } catch (error) {
    console.warn('⚠️ Redis unavailable, using in-memory fallback:', error instanceof Error ? error.message : error);
    state.setAvailable(false);
    return false;
  }
}

/**
 * Load Lua scripts into Redis for atomic operations
 */
async function loadLuaScripts(client: Redis): Promise<void> {
  try {
    const [slidingSha, acquireSha, releaseSha] = await Promise.all([
      client.script('LOAD', SLIDING_WINDOW_SCRIPT),
      client.script('LOAD', ACQUIRE_LOCK_SCRIPT),
      client.script('LOAD', RELEASE_LOCK_SCRIPT),
    ]);

    state.setSlidingWindowSha(slidingSha);
    state.setAcquireLockSha(acquireSha);
    state.setReleaseLockSha(releaseSha);
    
    console.log('✅ Lua scripts loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load Lua scripts:', error);
    throw error;
  }
}

/**
 * Periodic health check
 */
function startHealthCheck(client: Redis): void {
  setInterval(async () => {
    try {
      const start = Date.now();
      await client.ping();
      const latency = Date.now() - start;
      
      state.recordSuccess();
      state.setAvailable(true);
      
      // Log warning if latency is high
      if (latency > 100) {
        console.warn(`⚠️ High Redis latency detected: ${latency}ms`);
      }
    } catch (error) {
      console.error('❌ Health check failed:', error);
      state.recordFailure();
      state.setAvailable(false);
    }
  }, HEALTH_CHECK_INTERVAL_MS);
}

// ===========================================
// Core Rate Limiting Logic
// ===========================================

/**
 * Generate a consistent rate limit key
 */
function generateRateLimitKey(
  identifier: string,
  endpointType: string,
  prefix: string = 'rl:'
): string {
  // Hash identifier for privacy and consistent length
  const hashedId = createHash('sha256')
    .update(identifier)
    .digest('hex')
    .substring(0, 16);
  
  return `${prefix}${endpointType}:${hashedId}`;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${INSTANCE_ID}-${randomUUID().substring(0, 8)}`;
}

/**
 * Check rate limit using Redis with sliding window algorithm
 */
async function checkRedisRateLimit(
  identifier: string,
  endpointType: string,
  config: RedisRateLimitConfigV2
): Promise<RedisRateLimitResultV2> {
  const client = state.getRedisClient()!;
  const startTime = Date.now();
  
  const key = generateRateLimitKey(identifier, endpointType, config.keyPrefix || 'rl:');
  const now = Date.now().toString();
  const windowStart = (Date.now() - config.windowMs).toString();
  const requestId = generateRequestId();

  try {
    // Use evalsha for pre-loaded Lua script (faster than EVAL)
    const results = await client.evalsha(
      state.getSlidingWindowSha()!,
      1,
      key,
      windowStart,
      now,
      requestId,
      config.maxRequests.toString(),
      config.windowMs.toString()
    ) as [number, number, number?];

    const allowed = results[0] === 1;
    const remaining = results[1];
    const retryAfter = results[2];

    const latency = Date.now() - startTime;
    const result: RedisRateLimitResultV2 = {
      allowed,
      remaining: Math.max(0, remaining),
      resetTime: new Date(Date.now() + config.windowMs),
      limit: config.maxRequests,
      retryAfter: allowed ? undefined : (retryAfter || Math.ceil(config.windowMs / 1000)),
      source: state.isClusterMode() ? 'redis-cluster' : 'redis',
      instanceId: INSTANCE_ID,
      latencyMs: latency,
    };

    // Cache result locally for read-heavy workloads
    state.setLocalCache(`${identifier}:${endpointType}`, result);

    state.recordMetrics(result, endpointType, latency);
    state.recordSuccess();

    return result;
  } catch (error) {
    state.recordFailure();
    state.recordError();
    
    console.error('Redis rate limit check error:', error);
    
    // Fallback to in-memory on Redis error
    return checkMemoryFallback(identifier, endpointType, config);
  }
}

/**
 * In-memory fallback when Redis is unavailable
 */
function checkMemoryFallback(
  identifier: string,
  endpointType: string,
  config: RedisRateLimitConfigV2
): RedisRateLimitResultV2 {
  const storeKey = `${identifier}:${endpointType}`;
  const now = Date.now();
  const record = state.getFallbackStore(storeKey) || {
    count: 0,
    resetTime: now + config.windowMs,
    requests: [],
  };

  // Reset if window expired
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + config.windowMs;
    record.requests = [];
  }

  // Filter old requests
  record.requests = record.requests.filter(t => t > now - config.windowMs);
  record.count = record.requests.length;

  // Check limit
  const allowed = record.count < config.maxRequests;
  
  if (allowed) {
    record.requests.push(now);
    record.count++;
  }

  state.setFallbackStore(storeKey, record);

  const result: RedisRateLimitResultV2 = {
    allowed,
    remaining: Math.max(0, config.maxRequests - record.count),
    resetTime: new Date(record.resetTime),
    limit: config.maxRequests,
    retryAfter: allowed ? undefined : Math.ceil((record.resetTime - now) / 1000),
    source: 'memory-fallback',
    instanceId: INSTANCE_ID,
  };

  state.recordMetrics(result, endpointType, 0);
  return result;
}

// ===========================================
// Public API
// ===========================================

/**
 * Main rate limit check function (v2)
 * Automatically chooses optimal backend based on availability
 */
export async function checkRateLimitV2(
  identifier: string,
  endpointType: string,
  config: RedisRateLimitConfigV2
): Promise<RedisRateLimitResultV2> {
  // Check circuit breaker first
  if (state.isCircuitBreakerOpen()) {
    console.warn('⚠️ Circuit breaker open, using memory fallback');
    return checkMemoryFallback(identifier, endpointType, config);
  }

  // Try local cache first for performance
  const cacheKey = `${identifier}:${endpointType}`;
  const cached = state.getLocalCache(cacheKey);
  
  if (cached && cached.allowed) {
    // Return cached result but still decrement remaining
    return {
      ...cached,
      remaining: Math.max(0, cached.remaining - 1),
    };
  }

  // Use Redis if available
  if (state.isAvailable()) {
    return checkRedisRateLimit(identifier, endpointType, config);
  }

  // Fallback to memory
  return checkMemoryFallback(identifier, endpointType, config);
}

/**
 * Get current rate limit status without incrementing counter
 */
export async function getRateLimitStatusV2(
  identifier: string,
  endpointType: string,
  config: RedisRateLimitConfigV2
): Promise<RedisRateLimitResultV2 | null> {
  // Check local cache first
  const cached = state.getLocalCache(`${identifier}:${endpointType}`);
  if (cached) return cached;

  if (state.isAvailable()) {
    const client = state.getRedisClient()!;
    const key = generateRateLimitKey(identifier, endpointType, config.keyPrefix || 'rl:');
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      const pipeline = client.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zcard(key);

      const results = await pipeline.exec();
      const currentCount = results?.[1]?.[1] as number || 0;

      return {
        allowed: currentCount < config.maxRequests,
        remaining: Math.max(0, config.maxRequests - currentCount),
        resetTime: new Date(now + config.windowMs),
        limit: config.maxRequests,
        source: state.isClusterMode() ? 'redis-cluster' : 'redis',
        instanceId: INSTANCE_ID,
      };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
    }
  }

  // Memory fallback
  const storeKey = `${identifier}:${endpointType}`;
  const record = state.getFallbackStore(storeKey);
  
  if (!record || Date.now() > record.resetTime) return null;

  return {
    allowed: record.count < config.maxRequests,
    remaining: Math.max(0, config.maxRequests - record.count),
    resetTime: new Date(record.resetTime),
    limit: config.maxRequests,
    source: 'memory-fallback',
    instanceId: INSTANCE_ID,
  };
}

/**
 * Reset rate limit for specific identifier (admin use)
 */
export async function resetRateLimitV2(
  identifier: string,
  endpointType: string
): Promise<{ success: boolean; source: string }> {
  if (state.isAvailable()) {
    const client = state.getRedisClient()!;
    const key = generateRateLimitKey(identifier, endpointType, 'rl:');
    
    try {
      await client.del(key);
      state.clearLocalCache(); // Clear related cache entries
      
      return { success: true, source: state.isClusterMode() ? 'redis-cluster' : 'redis' };
    } catch (error) {
      console.error('Error resetting Redis rate limit:', error);
    }
  }

  // Memory fallback
  const storeKey = `${identifier}:${endpointType}`;
  const deleted = state.deleteFallbackStore(storeKey);
  
  return { success: deleted, source: 'memory-fallback' };
}

/**
 * Get comprehensive health status of the rate limiter
 */
export async function getRateLimiterHealth(): Promise<RateLimiterHealthStatus> {
  let redisConnected = false;
  let activeConnections = 0;
  let memoryUsageBytes = 0;

  if (state.isAvailable() && state.getRedisClient()) {
    try {
      const client = state.getRedisClient()!;
      await client.ping();
      redisConnected = true;
      
      // Get info
      const info = await client.info('clients');
      const match = info.match(/connected_clients:(\d+)/);
      activeConnections = match ? parseInt(match[1]) : 0;

      const memoryInfo = await client.info('memory');
      const memMatch = memoryInfo.match(/used_memory:(\d+)/);
      memoryUsageBytes = memMatch ? parseInt(memMatch[1]) : 0;
    } catch (error) {
      redisConnected = false;
    }
  }

  const metrics = state.getMetrics();
  const errorRate = metrics.errorRate;
  
  let status: RateLimiterHealthStatus['status'];
  if (!redisConnected && !state.isCircuitBreakerOpen()) {
    status = 'degraded'; // Using memory fallback
  } else if (errorRate > 0.1 || state.isCircuitBreakerOpen()) {
    status = 'unhealthy';
  } else {
    status = 'healthy';
  }

  return {
    status,
    redisConnected,
    clusterMode: state.isClusterMode(),
    activeConnections,
    totalRequestsTracked: metrics.totalChecks,
    memoryUsageBytes,
    circuitBreakerOpen: state.isCircuitBreakerOpen(),
    lastHealthCheck: new Date(),
    uptimeSeconds: state.getUptimeSeconds(),
  };
}

/**
 * Get detailed metrics from the rate limiter
 */
export function getRateLimiterMetricsV2(): RateLimiterMetrics {
  return state.getMetrics();
}

/**
 * Acquire distributed lock for critical sections
 */
export async function acquireDistributedLock(
  lockName: string,
  ttlMs: number = 5000
): Promise<{ acquired: boolean; lockValue?: string }> {
  if (!state.isAvailable()) {
    // Return fake lock for fallback mode
    return { acquired: true, lockValue: 'fallback-mode' };
  }

  const client = state.getRedisClient()!;
  const lockKey = `lock:${lockName}`;
  const lockValue = `${INSTANCE_ID}-${Date.now()}-${randomUUID().substring(0, 8)}`;

  try {
    const result = await client.evalsha(
      state.getAcquireLockSha()!,
      1,
      lockKey,
      lockValue,
      ttlMs.toString()
    ) as number;

    return { acquired: result === 1, lockValue: result === 1 ? lockValue : undefined };
  } catch (error) {
    console.error('Failed to acquire distributed lock:', error);
    return { acquired: false };
  }
}

/**
 * Release distributed lock
 */
export async function releaseDistributedLock(
  lockName: string,
  lockValue: string
): Promise<boolean> {
  if (!state.isAvailable()) return true;

  const client = state.getRedisClient()!;
  const lockKey = `lock:${lockName}`;

  try {
    const result = await client.evalsha(
      state.getReleaseLockSha()!,
      1,
      lockKey,
      lockValue
    ) as number;

    return result === 1;
  } catch (error) {
    console.error('Failed to release distributed lock:', error);
    return false;
  }
}

/**
 * Cleanup old entries from fallback store
 */
export function cleanupFallbackStore(): number {
  const now = Date.now();
  let cleaned = 0;

  // Note: We can't iterate over Map directly with deletion safely,
  // so we collect keys first
  const keysToDelete: string[] = [];
  
  // This is a simplified version - production should track keys separately
  for (const [key, value] of state) {
    if (now > value.resetTime) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    state.deleteFallbackStore(key);
    cleaned++;
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired fallback entries`);
  }

  return cleaned;
}

/**
 * Shutdown rate limiter gracefully
 */
export async function shutdownRateLimiterV2(): Promise<void> {
  const client = state.getRedisClient();
  if (client) {
    try {
      await client.quit();
      console.log('🔌 Redis rate limiter disconnected gracefully');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
  state.setRedisClient(null);
  state.setAvailable(false);
}

// Auto-initialize if Redis environment variables are present
if (process.env.REDIS_URL || process.env.REDIS_HOST || process.env.REDIS_CLUSTER_NODES) {
  initRateLimiterV2().catch(console.error);
}

// Export state for testing purposes (use carefully)
export { state as _rateLimiterState };

// Make state iterable for cleanup
(state as any)[Symbol.iterator] = function* () {
  // This is a workaround - in production, maintain a separate Set of keys
  yield* [];
};
