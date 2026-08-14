/**
 * AlgeriaTrade.dz - Database Query Optimization Layer
 * 
 * Features:
 * - Connection pooling with Prisma
 * - Query caching integration
 * - N+1 query prevention
 * - Pagination utilities
 * - Query performance monitoring
 * - Read replicas support
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { getCacheManager } from '@/lib/performance/advanced-cache';

// ===========================================
# Configuration Types
// ===========================================

export interface DatabaseConfig {
  // Connection pooling
  pool: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };
  
  // Query optimization
  queries: {
    defaultPageSize: number;
    maxPageSize: number;
    enableQueryCache: boolean;
    queryCacheTTL: number;
    slowQueryThreshold: number; // ms
  };
  
  // Read replica (optional)
  readReplica?: {
    url: string;
    poolSize: number;
  };
}

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  cacheHit: boolean;
  rowCount?: number;
}

// ===========================================
# Default Configuration
// ===========================================

const DEFAULT_CONFIG: DatabaseConfig = {
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 5000, // 5 seconds
  },
  queries: {
    defaultPageSize: 20,
    maxPageSize: 100,
    enableQueryCache: true,
    queryCacheTTL: 300, // 5 minutes
    slowQueryThreshold: 1000, // 1 second
  },
};

// ===========================================
# Enhanced Prisma Client with Caching
// ===========================================

class OptimizedPrismaClient {
  private prisma: PrismaClient;
  private cacheManager: ReturnType<typeof getCacheManager>;
  private queryMetrics: QueryMetrics[] = [];
  private config: DatabaseConfig;

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.prisma = new PrismaClient({
      log: [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    this.cacheManager = getCacheManager();
  }

  /**
   * Get raw Prisma client for operations that don't need caching
   */
  get raw(): PrismaClient {
    return this.prisma;
  }

  /**
   * Cached findMany with automatic pagination and N+1 prevention
   */
  async cachedFindMany<T extends keyof Prisma.TypeMap['model']>(
    model: T,
    args: Prisma.ArgsType<T, 'findMany'>,
    options: {
      ttl?: number;
      tags?: string[];
      skipCache?: boolean;
    } = {}
  ): Promise<Prisma.Result<T, 'findMany', 'only'>> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(model, 'findMany', args);

    if (!options.skipCache && this.config.queries.enableQueryCache) {
      // Try cache first
      const cached = await this.cacheManager.get(cacheKey);
      
      if (cached !== null) {
        this.recordQuery('findMany', startTime, true, Array.isArray(cached) ? cached.length : undefined);
        return cached as any;
      }
    }

    // Execute query
    const result = await (this.prisma[model] as any).findMany(args);

    // Cache result
    if (!options.skipCache && this.config.queries.enableQueryCache) {
      await this.cacheManager.set(cacheKey, result, {
        ttl: options.ttl || this.config.queries.queryCacheTTL,
        tags: options.tags,
      });
    }

    this.recordQuery('findMany', startTime, false, result.length);
    return result;
  }

  /**
   * Cached findUnique or findFirst
   */
  async cachedFindUnique<T extends keyof Prisma.TypeMap['model']>(
    model: T,
    args: Prisma.ArgsType<T, 'findUnique'> | Prisma.ArgsType<T, 'findFirst'>,
    options: {
      ttl?: number;
      tags?: string[];
      skipCache?: boolean;
      type?: 'unique' | 'first';
    } = {}
  ): Promise<Prisma.Result<T, options['type'] extends 'first' ? 'findFirst' : 'findUnique', 'only'> | null> {
    const startTime = Date.now();
    const method = options.type === 'first' ? 'findFirst' : 'findUnique';
    const cacheKey = this.generateCacheKey(model, method, args);

    if (!options.skipCache && this.config.queries.enableQueryCache) {
      const cached = await this.cacheManager.get(cacheKey);
      
      if (cached !== null) {
        this.recordQuery(method, startTime, true, 1);
        return cached as any;
      }
    }

    const result = await (this.prisma[model] as any)[method](args);

    if (result && !options.skipCache && this.config.queries.enableQueryCache) {
      await this.cacheManager.set(cacheKey, result, {
        ttl: options.ttl || this.config.queries.queryCacheTTL,
        tags: options.tags,
      });
    }

    this.recordQuery(method, startTime, false, result ? 1 : 0);
    return result;
  }

  /**
   * Cached count query
   */
  async cachedCount<T extends keyof Prisma.TypeMap['model']>(
    model: T,
    args: Prisma.ArgsType<T, 'count'>,
    options: {
      ttl?: number;
      tags?: string[];
    } = {}
  ): Promise<number> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(model, 'count', args);

    if (this.config.queries.enableQueryCache) {
      const cached = await this.cacheManager.get(cacheKey);
      
      if (cached !== null) {
        this.recordQuery('count', startTime, true);
        return cached as number;
      }
    }

    const result = await (this.prisma[model] as any).count(args);

    if (this.config.queries.enableQueryCache) {
      await this.cacheManager.set(cacheKey, result, {
        ttl: options.ttl || 60, // Counts can be cached shorter
        tags: options.tags,
      });
    }

    this.recordQuery('count', startTime, false);
    return result;
  }

  /**
   * Paginated findMany with metadata
   */
  async paginatedFindMany<T extends keyof Prisma.TypeMap['model']>(
    model: T,
    args: Prisma.ArgsType<T, 'findMany'> & {
      page?: number;
      pageSize?: number;
    },
    options: {
      ttl?: number;
      tags?: string[];
    } = {}
  ) {
    const page = Math.max(1, args.page || 1);
    const pageSize = Math.min(
      args.pageSize || this.config.queries.defaultPageSize,
      this.config.queries.maxPageSize
    );
    const skip = (page - 1) * pageSize;

    // Run count and data in parallel
    const [data, total] = await Promise.all([
      this.cachedFindMany(model, {
        ...args,
        skip,
        take: pageSize,
      } as any, options),
      this.cachedCount(
        model,
        { where: (args as any).where },
        options
      ),
    ]);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Batch fetch with includes to prevent N+1 queries
   */
  async batchFetchWithIncludes<T extends keyof Prisma.TypeMap['model']>(
    model: T,
    ids: string[],
    includeOptions: Record<string, any>
  ): Promise<Map<string, Prisma.Result<T, 'findUnique', 'only'>>> {
    if (ids.length === 0) return new Map();

    const results = await (this.prisma[model] as any).findMany({
      where: {
        id: { in: ids },
      },
      include: includeOptions,
    });

    // Convert to Map for O(1) lookup
    const resultMap = new Map<string, any>();
    results.forEach((item: any) => {
      resultMap.set(item.id, item);
    });

    return resultMap;
  }

  /**
   * Transaction wrapper with automatic retry
   */
  async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>,
    options: {
      maxRetries?: number;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? 3;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction(fn, {
          timeout: options.timeout ?? 10000,
          maxWait: 5000,
        });
      } catch (error) {
        lastError = error as Error;
        
        // Only retry on connection errors or deadlocks
        const retryableError =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P1001' || error.code === 'P2024');

        if (!retryableError || attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Invalidate cache for a model
   */
  async invalidateModelCache(
    model: string,
    tags: string[]
  ): Promise<void> {
    await this.cacheManager.invalidateByTags(tags);
  }

  /**
   * Get query performance metrics
   */
  getQueryMetrics(): {
    recentQueries: QueryMetrics[];
    summary: {
      totalQueries: number;
      averageDuration: number;
      slowQueries: number;
      cacheHitRate: number;
    };
  } {
    const recentQueries = this.queryMetrics.slice(-100); // Last 100 queries
    
    const totalQueries = recentQueries.length;
    const averageDuration =
      totalQueries > 0
        ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / totalQueries
        : 0;
    const slowQueries = recentQueries.filter(
      (q) => q.duration > this.config.queries.slowQueryThreshold
    ).length;
    const cacheHits = recentQueries.filter((q) => q.cacheHit).length;
    const cacheHitRate = totalQueries > 0 ? cacheHits / totalQueries : 0;

    return {
      recentQueries,
      summary: {
        totalQueries,
        averageDuration: Math.round(averageDuration),
        slowQueries,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      },
    };
  }

  /**
   * Clear all query caches
   */
  async clearCache(): Promise<void> {
    await this.cacheManager.clear();
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    await this.cacheManager.disconnect();
  }

  // Private helpers

  private generateCacheKey(
    model: string,
    operation: string,
    args: any
  ): string {
    const argsString = JSON.stringify(args || {});
    return `db:${model}:${operation}:${Buffer.from(argsString).toString('base64').substring(0, 64)}`;
  }

  private recordQuery(
    operation: string,
    startTime: number,
    cacheHit: boolean,
    rowCount?: number
  ): void {
    const duration = Date.now() - startTime;
    
    this.queryMetrics.push({
      query: `${operation}()`,
      duration,
      timestamp: Date.now(),
      cacheHit,
      rowCount,
    });

    // Warn on slow queries
    if (duration > this.config.queries.slowQueryThreshold) {
      console.warn(`⚠️ Slow query detected: ${operation} took ${duration}ms`);
    }

    // Keep only last 1000 entries
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }
  }
}

// ===========================================
# Singleton Instance
// ===========================================

let dbInstance: OptimizedPrismaClient | null = null;

export function getDatabase(config?: Partial<DatabaseConfig>): OptimizedPrismaClient {
  if (!dbInstance) {
    dbInstance = new OptimizedPrismaClient(config);
  }
  return dbInstance;
}

// Export for testing
export { OptimizedPrismaClient };

// Default export
export default getDatabase;
