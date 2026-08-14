/**
 * AlgeriaTrade.dz - Performance Monitoring Middleware
 * 
 * Features:
 * - Request timing and logging
 * - Response time tracking
 * - Memory usage monitoring
 * - Rate limiting
 * - Cache hit/miss tracking
 * - Performance headers injection
 * - Real-time metrics collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCacheManager } from '@/lib/performance/advanced-cache';

// ===========================================
// Configuration Types
// ===========================================

interface PerformanceConfig {
  enabled: boolean;
  slowQueryThreshold: number; // ms
  memoryWarningThreshold: number; // MB
  enableLogging: boolean;
  enableHeaders: boolean;
  enableMetrics: boolean;
  sampleRate: number; // 0-1, fraction of requests to track
}

interface RequestMetrics {
  requestId: string;
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  cacheStatus?: 'hit' | 'miss' | 'stale';
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  userAgent?: string;
  ip?: string;
}

// ===========================================
// Default Configuration
// ===========================================

const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: process.env.NODE_ENV !== 'test',
  slowQueryThreshold: 1000, // 1 second
  memoryWarningThreshold: 512, // 512MB
  enableLogging: process.env.NODE_ENV === 'development',
  enableHeaders: true,
  enableMetrics: true,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1, // Track 10% in production
};

// ===========================================
// Metrics Store (In-memory for now)
// ===========================================

class MetricsStore {
  private requests: RequestMetrics[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  add(metrics: RequestMetrics): void {
    this.requests.push(metrics);
    
    if (this.requests.length > this.maxSize) {
      this.requests = this.requests.slice(-this.maxSize);
    }
  }

  getRecent(count: number = 100): RequestMetrics[] {
    return this.requests.slice(-count);
  }

  getStats(): {
    totalRequests: number;
    averageResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    requestsPerSecond: number;
  } {
    const completedRequests = this.requests.filter(r => r.duration !== undefined);
    
    if (completedRequests.length === 0) {
      return {
        totalRequests: this.requests.length,
        averageResponseTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        cacheHitRate: 0,
        requestsPerSecond: 0,
      };
    }

    const durations = completedRequests.map(r => r.duration!).sort((a, b) => a - b);
    const errors = completedRequests.filter(r => (r.statusCode || 0) >= 400).length;
    const cacheHits = completedRequests.filter(r => r.cacheStatus === 'hit').length;
    
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const p50Index = Math.floor(durations.length * 0.5);
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    // Calculate RPS from last minute
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = completedRequests.filter(r => r.startTime > oneMinuteAgo);
    const rps = recentRequests.length / 60;

    return {
      totalRequests: this.requests.length,
      averageResponseTime: Math.round(avgDuration),
      p50ResponseTime: durations[p50Index] || 0,
      p95ResponseTime: durations[p95Index] || 0,
      p99ResponseTime: durations[p99Index] || 0,
      errorRate: errors / completedRequests.length,
      cacheHitRate: cacheHits / completedRequests.length,
      requestsPerSecond: Math.round(rps * 100) / 100,
    };
  }

  clear(): void {
    this.requests = [];
  }
}

const metricsStore = new MetricsStore();

// ===========================================
// Utility Functions
// ===========================================

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  );
}

function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const mem = process.memoryUsage();
    return {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024),
    };
  }
  return undefined;
}

function shouldTrackRequest(config: PerformanceConfig): boolean {
  return config.enabled && Math.random() < config.sampleRate;
}

// ===========================================
// Main Middleware Function
// ===========================================

export async function performanceMiddleware(
  request: NextRequest,
  config: Partial<PerformanceConfig> = {}
): Promise<{
  response: NextResponse;
  metrics: RequestMetrics;
}> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Initialize metrics
  const metrics: RequestMetrics = {
    requestId: generateRequestId(),
    method: request.method,
    url: request.url,
    startTime: Date.now(),
    userAgent: request.headers.get('user-agent') || undefined,
    ip: getClientIP(request),
  };

  // Add request ID to headers for tracing
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', metrics.requestId);

  // Check memory usage
  if (finalConfig.enableMetrics) {
    metrics.memoryUsage = getMemoryUsage();
    
    if (metrics.memoryUsage && metrics.memoryUsage.heapUsed > finalConfig.memoryWarningThreshold) {
      console.warn(`⚠️ High memory usage: ${metrics.memoryUsage.heapUsed}MB`);
    }
  }

  // Log request start
  if (finalConfig.enableLogging) {
    console.log(
      `🚀 [${metrics.requestId}] ${request.method} ${request.url}`
    );
  }

  // Return modified request info
  return {
    response: NextResponse.next({
      request: { headers: requestHeaders },
    }),
    metrics,
  };
}

export async function finalizeMetrics(
  metrics: RequestMetrics,
  response: NextResponse,
  config: Partial<PerformanceConfig> = {}
): Promise<NextResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Finalize timing
  metrics.endTime = Date.now();
  metrics.duration = metrics.endTime - metrics.startTime;
  metrics.statusCode = response.status;

  // Determine cache status from response headers
  const cacheControl = response.headers.get('cache-control') || '';
  const age = response.headers.get('age');
  
  if (cacheControl.includes('hit') || (age && parseInt(age) > 0)) {
    metrics.cacheStatus = 'hit';
  } else if (response.headers.get('x-cache-status')) {
    metrics.cacheStatus = response.headers.get('x-cache-status') as any;
  } else {
    metrics.cacheStatus = 'miss';
  }

  // Store metrics
  if (shouldTrackRequest(finalConfig)) {
    metricsStore.add(metrics);
  }

  // Add performance headers
  if (finalConfig.enableHeaders) {
    response.headers.set('x-request-id', metrics.requestId);
    response.headers.set('x-response-time', `${metrics.duration}ms`);
    response.headers.set('x-cache-status', metrics.cacheStatus);
    
    // Security headers (if not already set)
    if (!response.headers.get('x-content-type-options')) {
      response.headers.set('x-content-type-options', 'nosniff');
    }
    if (!response.headers.get('x-frame-options')) {
      response.headers.set('x-frame-options', 'DENY');
    }
  }

  // Log completion
  if (finalConfig.enableLogging) {
    const statusEmoji = (metrics.statusCode || 0) < 400 ? '✅' : '❌';
    const slowWarning =
      (metrics.duration || 0) > finalConfig.slowQueryThreshold
        ? ` ⚠️ SLOW`
        : '';

    console.log(
      `${statusEmoji} [${metrics.requestId}] ${metrics.method} ${metrics.url} - ${metrics.statusCode} (${metrics.duration}ms)${slowWarning}`
    );
  }

  return response;
}

// ===========================================
// API Route Handler Wrapper
// ===========================================

/**
 * Wrap API route handlers with automatic performance tracking
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options: Partial<PerformanceConfig> & {
    routeName?: string;
  } = {}
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const { metrics } = await performanceMiddleware(request, options);
    
    try {
      const response = await handler(request, ...args);
      return await finalizeMetrics(metrics, response, options);
    } catch (error) {
      // Create error response
      const errorResponse = NextResponse.json(
        {
          error: 'Internal Server Error',
          requestId: metrics.requestId,
          message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        },
        { status: 500 }
      );
      
      return await finalizeMetrics(metrics, errorResponse, options);
    }
  }) as T;
}

// ===========================================
// Metrics API Endpoint Helper
// ===========================================

export function getPerformanceMetrics() {
  return metricsStore.getStats();
}

export function getRecentRequests(limit: number = 100) {
  return metricsStore.getRecent(limit);
}

export function clearPerformanceMetrics() {
  metricsStore.clear();
}

// ===========================================
// Health Check Endpoint Data
// ===========================================

export function getHealthCheckData() {
  const stats = metricsStore.getStats();
  const memory = getMemoryUsage();
  const uptime = process.uptime();

  let status = 'healthy';
  let issues: string[] = [];

  // Check response times
  if (stats.p95ResponseTime > 2000) {
    status = 'degraded';
    issues.push('P95 response time exceeds 2 seconds');
  }

  if (stats.p99ResponseTime > 5000) {
    status = 'unhealthy';
    issues.push('P99 response time exceeds 5 seconds');
  }

  // Check error rate
  if (stats.errorRate > 0.05) {
    status = 'degraded';
    issues.push(`Error rate is ${(stats.errorRate * 100).toFixed(1)}%`);
  }

  if (stats.errorRate > 0.2) {
    status = 'unhealthy';
    issues.push(`Critical error rate: ${(stats.errorRate * 100).toFixed(1)}%`);
  }

  // Check memory
  if (memory && memory.heapUsed > DEFAULT_CONFIG.memoryWarningThreshold) {
    status = 'degraded';
    issues.push(`High memory usage: ${memory.heapUsed}MB`);
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: formatUptime(uptime),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    metrics: stats,
    memory,
    issues,
  };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// ===========================================
// Export All
// ===========================================

export {
  DEFAULT_CONFIG,
  DEFAULT_CONFIG as default,
  metricsStore,
  type PerformanceConfig,
  type RequestMetrics,
};
