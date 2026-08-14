/**
 * AlgeriaTrade.dz - Application Performance Monitoring (APM) Dashboard
 * 
 * Features:
 * - Real-time performance metrics collection
 * - Request tracing with spans
 * - Custom metrics tracking (counters, gauges, histograms)
 * - Performance dashboards data generation
 * - Slow endpoint detection
 * - Error rate monitoring
 * - User experience scoring
 * - Geographic performance breakdown
 * - Export capabilities for external tools
 */

// ===========================================
// Types & Interfaces
// ===========================================

export interface MetricPoint {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

export interface TimeSeries {
  name: string;
  unit: string;
  type: 'counter' | 'gauge' | 'histogram';
  points: MetricPoint[];
}

export interface Span {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  startTime: number;
  duration?: number; // ms
  status: 'ok' | 'error';
  tags?: Record<string, string>;
  logs?: Array<{ timestamp: number; level: string; message: string }>;
  children?: Span[];
}

export interface Trace {
  id: string;
  rootSpan: Span;
  startTime: number;
  duration?: number;
  status: 'ok' | 'error';
  metadata?: {
    url?: string;
    method?: string;
    statusCode?: number;
    userId?: string;
    tenantId?: string;
    userAgent?: string;
    ip?: string;
  };
}

export interface EndpointPerformance {
  path: string;
  method: string;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  avgDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  minDuration: number;
  maxDuration: number;
  lastRequestAt: number;
}

export interface DashboardData {
  period: '1h' | '6h' | '24h' | '7d' | '30d';
  generatedAt: string;
  overview: {
    totalRequests: number;
    errorRate: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    activeUsers: number;
    requestsPerSecond: number;
  };
  endpoints: EndpointPerformance[];
  timeSeries: {
    requests: TimeSeries;
    errors: TimeSeries;
    responseTime: TimeSeries;
    activeUsers: TimeSeries;
  };
  topSlowEndpoints: EndpointPerformance[];
  topErrorEndpoints: EndpointPerformance[];
  geographicBreakdown: Array<{
    country: string;
    requests: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
  userExperience: {
    apdexScore: number; // Application Performance Index
    satisfiedUsers: number;
    toleratingUsers: number;
    frustratedUsers: number;
  };
}

// ===========================================
// Metrics Store
// ===========================================

class MetricsStore {
  private counters: Map<string, { value: number; points: MetricPoint[] }> = new Map();
  private gauges: Map<string, { value: number; points: MetricPoint[] }> = new Map();
  private histograms: Map<string, { values: number[]; points: MetricPoint[] }> = new Map();

  // Counter operations
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    const counter = this.counters.get(name) || { value: 0, points: [] };
    counter.value += value;
    counter.points.push({ timestamp: Date.now(), value: counter.value, tags });
    
    // Keep only last 1000 points per counter
    if (counter.points.length > 1000) {
      counter.points = counter.points.slice(-1000);
    }
    
    this.counters.set(name, counter);
  }

  getCounter(name: string): { value: number; points: MetricPoint[] } | undefined {
    return this.counters.get(name);
  }

  // Gauge operations
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    const gauge = this.gauges.get(name) || { value: 0, points: [] };
    gauge.value = value;
    gauge.points.push({ timestamp: Date.now(), value, tags });
    
    if (gauge.points.length > 1000) {
      gauge.points = gauge.points.slice(-1000);
    }
    
    this.gauges.set(name, gauge);
  }

  getGauge(name: string): { value: number; points: MetricPoint[] } | undefined {
    return this.gauges.get(name);
  }

  // Histogram operations
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const histogram = this.histograms.get(name) || { values: [], points: [] };
    histogram.values.push(value);
    
    // Keep only last 10000 values for percentile calculations
    if (histogram.values.length > 10000) {
      histogram.values = histogram.values.slice(-10000);
    }
    
    // Calculate and store aggregate point periodically
    if (histogram.values.length % 100 === 0) {
      const stats = this.calculateStats(histogram.values);
      histogram.points.push({ 
        timestamp: Date.now(), 
        value: stats.p95,
        tags: { ...tags, ...stats as any } 
      });
      
      if (histogram.points.length > 500) {
        histogram.points = histogram.points.slice(-500);
      }
    }
    
    this.histograms.set(name, histogram);
  }

  getHistogram(name: string): { values: number[]; points: MetricPoint[] } | undefined {
    return this.histograms.get(name);
  }

  getHistogramStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  } | null {
    const histogram = this.histograms.get(name);
    if (!histogram || histogram.values.length === 0) return null;

    return this.calculateStats(histogram.values);
  }

  // Utility methods
  getAllMetrics(): {
    counters: Map<string, { value: number; points: MetricPoint[] }>;
    gauges: Map<string, { value: number; points: MetricPoint[] }>;
    histograms: Map<string, { values: number[]; points: MetricPoint[] }>;
  } {
    return {
      counters: new Map(this.counters),
      gauges: new Map(this.gauges),
      histograms: new Map(this.histograms),
    };
  }

  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private calculateStats(values: number[]): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  } {
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    const percentile = (p: number) => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };

    return {
      count: sorted.length,
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: percentile(50),
      p90: percentile(90),
      p95: percentile(95),
      p99: percentile(99),
    };
  }
}

const metricsStore = new MetricsStore();

// ===========================================
// Trace Collector
// ===========================================

class TraceCollector {
  private traces: Map<string, Trace> = new Map();
  private activeSpans: Map<string, Span> = new Map();
  private maxTraces: number = 10000;

  startTrace(metadata?: Trace['metadata']): Trace {
    const traceId = this.generateId();
    const spanId = this.generateId();

    const rootSpan: Span = {
      id: spanId,
      traceId,
      name: metadata?.url || metadata?.method || 'unknown',
      startTime: Date.now(),
      status: 'ok',
      tags: {
        ...(metadata?.url && { 'http.url': metadata.url }),
        ...(metadata?.method && { 'http.method': metadata.method }),
        ...(metadata?.statusCode !== undefined && { 'http.status_code': String(metadata.statusCode) }),
        ...(metadata?.userId && { 'user.id': metadata.userId }),
        ...(metadata?.tenantId && { 'tenant.id': metadata.tenantId }),
      },
      children: [],
    };

    const trace: Trace = {
      id: traceId,
      rootSpan,
      startTime: rootSpan.startTime,
      status: 'ok',
      metadata,
    };

    this.traces.set(traceId, trace);
    this.activeSpans.set(spanId, rootSpan);

    return trace;
  }

  startSpan(traceId: string, name: string, parentId?: string, tags?: Record<string, string>): Span | null {
    const trace = this.traces.get(traceId);
    if (!trace) return null;

    const spanId = this.generateId();
    const span: Span = {
      id: spanId,
      traceId,
      parentId,
      name,
      startTime: Date.now(),
      status: 'ok',
      tags,
      children: [],
    };

    this.activeSpans.set(spanId, span);
    return span;
  }

  finishSpan(spanId: string, status: Span['status'] = 'ok', logs?: Span['logs']): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.duration = Date.now() - span.startTime;
    span.status = status;
    if (logs) span.logs = logs;

    // If it has a parent, add to parent's children
    if (span.parentId) {
      const parentSpan = this.activeSpans.get(span.parentId);
      if (parentSpan) {
        parentSpan.children = parentSpan.children || [];
        parentSpan.children.push(span);
      }
    } else {
      // This is the root span, finalize the trace
      const trace = this.traces.get(span.traceId);
      if (trace) {
        trace.rootSpan = span;
        trace.duration = span.duration;
        trace.status = status;
      }
    }

    this.activeSpans.delete(spanId);

    // Record metrics
    metricsStore.recordHistogram(`span.duration.${name}`, span.duration, {
      span_name: name,
      status,
    });
  }

  getTrace(traceId: string): Trace | undefined {
    return this.traces.get(traceId);
  }

  getRecentTraces(limit: number = 100): Trace[] {
    const traces = Array.from(this.traces.values());
    return traces
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  clearOldTraces(olderThanMs: number = 3600000): void {
    const cutoff = Date.now() - olderThanMs;
    
    for (const [traceId, trace] of this.traces.entries()) {
      if (trace.startTime < cutoff) {
        this.traces.delete(traceId);
      }
    }
  }

  private generateId(): string {
    return `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

const traceCollector = new TraceCollector();

// ===========================================
// APM Manager Class
// ===========================================

export class APMManager {
  private endpointStats: Map<string, EndpointPerformance> = new Map();
  private geographicData: Map<string, { requests: number; totalTime: number; errors: number }> = new Map();
  private userSessions: Map<string, { startTime: number; lastActivity: number; pageViews: number; errors: number }> = new Map();

  /**
   * Record an incoming request
   */
  recordRequest(data: {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    userId?: string;
    tenantId?: string;
    country?: string;
    userAgent?: string;
    ip?: string;
  }): void {
    const key = `${data.method}:${data.path}`;
    
    // Update endpoint stats
    let stats = this.endpointStats.get(key);
    if (!stats) {
      stats = {
        path: data.path,
        method: data.method,
        requestCount: 0,
        errorCount: 0,
        errorRate: 0,
        avgDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        lastRequestAt: Date.now(),
      };
      this.endpointStats.set(key, stats);
    }

    stats.requestCount++;
    stats.lastRequestAt = Date.now();
    
    if (data.statusCode >= 400) {
      stats.errorCount++;
    }

    // Update duration statistics
    const durations = metricsStore.getHistogram(`request.duration.${key}`);
    if (durations) {
      const durationStats = metricsStore.getHistogramStats(`request.duration.${key}`);
      if (durationStats) {
        stats.avgDuration = durationStats.avg;
        stats.p50Duration = durationStats.p50;
        stats.p95Duration = durationStats.p95;
        stats.p99Duration = durationStats.p99;
        stats.minDuration = durationStats.min;
        stats.maxDuration = durationStats.max;
      }
    }

    stats.errorRate = stats.requestCount > 0 ? (stats.errorCount / stats.requestCount) * 100 : 0;

    // Record in histogram
    metricsStore.recordHistogram(`request.duration.${key}`, data.duration, {
      method: data.method,
      path: data.path,
      statusCode: String(data.statusCode),
    });

    // Update counters
    metricsStore.increment('requests.total', 1, { method: data.method, path: data.path });
    if (data.statusCode >= 400) {
      metricsStore.increment('errors.total', 1, { 
        method: data.method, 
        path: data.path, 
        statusCode: String(data.statusCode) 
      });
    }

    // Track geographic data
    if (data.country) {
      let geoData = this.geographicData.get(data.country);
      if (!geoData) {
        geoData = { requests: 0, totalTime: 0, errors: 0 };
        this.geographicData.set(data.country, geoData);
      }
      geoData.requests++;
      geoData.totalTime += data.duration;
      if (data.statusCode >= 400) geoData.errors++;
    }

    // Track user session
    if (data.userId) {
      let session = this.userSessions.get(data.userId);
      if (!session) {
        session = { startTime: Date.now(), lastActivity: Date.now(), pageViews: 0, errors: 0 };
        this.userSessions.set(data.userId, session);
      }
      session.lastActivity = Date.now();
      session.pageViews++;
      if (data.statusCode >= 400) session.errors++;
    }
  }

  /**
   * Generate dashboard data
   */
  async generateDashboard(period: DashboardData['period'] = '24h'): Promise<DashboardData> {
    const now = Date.now();
    const periodMs = this.getPeriodMs(period);

    // Calculate overview metrics
    const totalRequestsCounter = metricsStore.getCounter('requests.total');
    const totalErrorsCounter = metricsStore.getCounter('errors.total');
    const totalRequests = totalRequestsCounter?.value || 0;
    const totalErrors = totalErrorsCounter?.value || 0;
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    const responseTimeHist = metricsStore.getHistogramStats('request.duration.*');
    const avgResponseTime = responseTimeHist?.avg || 0;
    const p95ResponseTime = responseTimeHist?.p95 || 0;

    // Active users (sessions active in last 30 minutes)
    const thirtyMinAgo = now - 1800000;
    let activeUsers = 0;
    for (const session of this.userSessions.values()) {
      if (session.lastActivity > thirtyMinAgo) {
        activeUsers++;
      }
    }

    // Get endpoints data
    const endpoints = Array.from(this.endpointStats.values())
      .sort((a, b) => b.requestCount - a.requestCount);

    // Top slow endpoints
    const topSlowEndpoints = [...endpoints]
      .filter(e => e.requestCount >= 10) // At least 10 requests
      .sort((a, b) => b.p95Duration - a.p95Duration)
      .slice(0, 10);

    // Top error endpoints
    const topErrorEndpoints = [...endpoints]
      .filter(e => e.errorCount > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 10);

    // Geographic breakdown
    const geographicBreakdown = Array.from(this.geographicData.entries())
      .map(([country, data]) => ({
        country,
        requests: data.requests,
        avgResponseTime: data.requests > 0 ? data.totalTime / data.requests : 0,
        errorRate: data.requests > 0 ? (data.errors / data.requests) * 100 : 0,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 20);

    // User Experience (APDEX calculation)
    const userExperience = this.calculateUserExperience();

    // Build time series (simplified - would use actual time-bucketed data)
    const timeSeries = {
      requests: this.buildTimeSeries('requests', period),
      errors: this.buildTimeSeries('errors', period),
      responseTime: this.buildTimeSeries('response_time', period),
      activeUsers: this.buildTimeSeries('active_users', period),
    };

    return {
      period,
      generatedAt: new Date().toISOString(),
      overview: {
        totalRequests,
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        p95ResponseTime: Math.round(p95ResponseTime),
        activeUsers,
        requestsPerSecond: Math.round((totalRequests / (periodMs / 1000)) * 100) / 100,
      },
      endpoints: endpoints.slice(0, 50), // Top 50 endpoints
      timeSeries,
      topSlowEndpoints,
      topErrorEndpoints,
      geographicBreakdown,
      userExperience,
    };
  }

  /**
   * Start a traced operation
   */
  startTrace(metadata?: Trace['metadata']): Trace {
    return traceCollector.startTrace(metadata);
  }

  /**
   * Create custom metric
   */
  createMetric(type: 'counter' | 'gauge' | 'histogram', name: string): void {
    // Initialize empty metric
    switch (type) {
      case 'counter':
        metricsStore.increment(name, 0);
        break;
      case 'gauge':
        metricsStore.setGauge(name, 0);
        break;
      case 'histogram':
        metricsStore.recordHistogram(name, 0);
        break;
    }
  }

  /**
   * Increment a counter
   */
  increment(name: string, value?: number, tags?: Record<string, string>): void {
    metricsStore.increment(name, value, tags);
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    metricsStore.setGauge(name, value, tags);
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    metricsStore.recordHistogram(name, value, tags);
  }

  /**
   * Get all current metrics
   */
  getMetrics(): ReturnType<MetricsStore['getAllMetrics']> {
    return metricsStore.getAllMetrics();
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusFormat(): string {
    const metrics = metricsStore.getAllMetrics();
    const lines: string[] = [];

    // Counters
    for (const [name, counter] of metrics.counters) {
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name} ${counter.value}`);
    }

    // Gauges
    for (const [name, gauge] of metrics.gauges) {
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name} ${gauge.value}`);
    }

    // Histograms (summary format)
    for (const [name, hist] of metrics.histograms) {
      const stats = metricsStore.getHistogramStats(name);
      if (stats) {
        lines.push(`# TYPE ${name} summary`);
        lines.push(`${name}_count ${stats.count}`);
        lines.push(`${name}_sum ${(stats.avg * stats.count).toFixed(2)}`);
        lines.push(`${name}{quantile="0.5"} ${stats.p50.toFixed(2)}`);
        lines.push(`${name}{quantile="0.9"} ${stats.p90.toFixed(2)}`);
        lines.push(`${name}{quantile="0.95"} ${stats.p95.toFixed(2)}`);
        lines.push(`${name}{quantile="0.99"} ${stats.p99.toFixed(2)}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Clear all stored data
   */
  reset(): void {
    metricsStore.clear();
    this.endpointStats.clear();
    this.geographicData.clear();
    this.userSessions.clear();
    traceCollector.clearOldTraces(0);
  }

  // Private helper methods

  private calculateUserExperience(): DashboardData['userExperience'] {
    const TOLERATED_THRESHOLD = 2000; // ms
    const FRUSTRATED_THRESHOLD = 8000; // ms

    let satisfied = 0;
    let tolerating = 0;
    let frustrated = 0;

    for (const session of this.userSessions.values()) {
      // Simplified: consider sessions without recent errors as satisfied
      if (session.errors === 0) {
        satisfied++;
      } else if (session.errors <= 3) {
        tolerating++;
      } else {
        frustrated++;
      }
    }

    const total = satisfied + tolerating + frustrated;
    const apdexScore = total > 0 ? ((satisfied + tolerating * 0.5) / total) * 100 : 100;

    return {
      apdexScore: Math.round(apdexScore * 100) / 100,
      satisfiedUsers: satisfied,
      toleratingUsers: tolerating,
      frustratedUsers: frustrated,
    };
  }

  private buildTimeSeries(metricType: string, period: string): TimeSeries {
    // Simplified time series generation
    // In production, would use proper time-bucketed aggregation
    const unit = metricType === 'response_time' ? 'ms' : 
                 metricType === 'active_users' ? 'users' : 'count';
    
    return {
      name: metricType,
      unit,
      type: 'gauge',
      points: this.generateMockTimePoints(period),
    };
  }

  private generateMockTimePoints(period: string): MetricPoint[] {
    const now = Date.now();
    const periodMs = this.getPeriodMs(period as any);
    const interval = periodMs / 60; // 60 data points
    const points: MetricPoint[] = [];

    for (let i = 59; i >= 0; i--) {
      points.push({
        timestamp: now - (i * interval),
        value: Math.random() * 100, // Mock data - replace with real aggregation
      });
    }

    return points;
  }

  private getPeriodMs(period: string): number {
    switch (period) {
      case '1h': return 3600000;
      case '6h': return 21600000;
      case '24h': return 86400000;
      case '7d': return 604800000;
      case '30d': return 2592000000;
      default: return 86400000;
    }
  }
}

// ===========================================
// Singleton & Exports
// ===========================================

let apmInstance: APMManager | null = null;

export function getAPMManager(): APMManager {
  if (!apmInstance) {
    apmInstance = new APMManager();
  }
  return apmInstance;
}

// Convenience exports
export const apm = getAPMManager();

// Export utilities
export { metricsStore, traceCollector };

export default {
  getAPMManager,
  APMManager,
};
