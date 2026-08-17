/**
 * AlgeriaTrade.dz - Phase 6 Performance Metrics Definitions
 * 
 * Key performance indicators and metrics to monitor for Phase 6 APIs.
 * Includes API response times, error rates, cache performance, 
 * database query metrics, and resource utilization.
 * 
 * Définitions des métriques de performance pour la Phase 6
 */

// ===========================================
// METRIC TYPES & INTERFACES
// ===========================================

export interface MetricDefinition {
  /** Unique metric identifier */
  name: string;
  /** Human-readable name */
  displayName: string;
  /** Description of what this measures */
  description: string;
  /** Unit of measurement */
  unit: 'ms' | 'percent' | 'count' | 'bytes' | 'requests_per_second' | 'ratio';
  /** Expected value ranges */
  thresholds: {
    good: number;
    warning: number;
    critical: number;
    direction: 'lower_is_better' | 'higher_is_better';
  };
  /** How often to collect this metric */
  collectionInterval: number; // seconds
  /** Labels/dimensions for this metric */
  labels?: string[];
}

export interface PercentileMetrics {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  p999: number;
}

export interface EndpointMetrics {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  responseTimePercentiles: PercentileMetrics;
  errorRate: number;
  throughput: number; // requests per second
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  hitCount: number;
  missCount: number;
  avgHitResponseTime: number;
  avgMissResponseTime: number;
  staleServed: number;
  evictions: number;
  size: number;
  maxSize: number;
}

export interface DatabaseMetrics {
  activeConnections: number;
  idleConnections: number;
  maxConnections: number;
  avgQueryTime: number;
  slowQueryCount: number;
  slowQueries: Array<{ query: string; duration: number; timestamp: Date }>;
  connectionPoolUtilization: number;
  deadlocks: number;
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  arrayBuffers: number;
  heapUsagePercent: number;
}

// ===========================================
// API RESPONSE TIME METRICS
// ===========================================

/**
 * API Response Time Percentile Metrics
 * Métriques de centile de temps de réponse API
 */
export const apiResponseTimeMetrics: Record<string, MetricDefinition> = {
  // General API metrics
  'api.response_time.p50': {
    name: 'api.response_time.p50',
    displayName: 'API Response Time P50',
    description: 'Median API response time across all endpoints',
    unit: 'ms',
    thresholds: { good: 100, warning: 300, critical: 500, direction: 'lower_is_better' },
    collectionInterval: 10,
  },
  'api.response_time.p95': {
    name: 'api.response_time.p95',
    displayName: 'API Response Time P95',
    description: '95th percentile API response time (most users experience this or better)',
    unit: 'ms',
    thresholds: { good: 200, warning: 500, critical: 1000, direction: 'lower_is_better' },
    collectionInterval: 10,
  },
  'api.response_time.p99': {
    name: 'api.response_time.p99',
    displayName: 'API Response Time P99',
    description: '99th percentile API response time (worst case for most users)',
    unit: 'ms',
    thresholds: { good: 500, warning: 1000, critical: 2000, direction: 'lower_is_better' },
    collectionInterval: 30,
  },

  // Search-specific metrics
  'search.response_time.avg': {
    name: 'search.response_time.avg',
    displayName: 'Search API Avg Response Time',
    description: 'Average search query response time',
    unit: 'ms',
    thresholds: { good: 80, warning: 200, critical: 400, direction: 'lower_is_better' },
    collectionInterval: 10,
  },
  'search.response_time.p95': {
    name: 'search.response_time.p95',
    displayName: 'Search API P95 Response Time',
    description: '95th percentile search response time',
    unit: 'ms',
    thresholds: { good: 150, warning: 350, critical: 600, direction: 'lower_is_better' },
    collectionInterval: 15,
  },
  'search.complex_query_time': {
    name: 'search.complex_query_time',
    displayName: 'Complex Search Query Time',
    description: 'Response time for searches with multiple filters/accents',
    unit: 'ms',
    thresholds: { good: 150, warning: 300, critical: 600, direction: 'lower_is_better' },
    collectionInterval: 15,
  },

  // Products-specific metrics
  'products.listing.time': {
    name: 'products.listing.time',
    displayName: 'Product Listing Response Time',
    description: 'Time to return product listing page',
    unit: 'ms',
    thresholds: { good: 100, warning: 250, critical: 500, direction: 'lower_is_better' },
    collectionInterval: 10,
  },
  'products.pagination.deep': {
    name: 'products.pagination.deep',
    displayName: 'Deep Pagination Time',
    description: 'Response time for pages beyond page 50',
    unit: 'ms',
    thresholds: { good: 150, warning: 400, critical: 800, direction: 'lower_is_better' },
    collectionInterval: 30,
  },

  // Trending-specific metrics
  'trending.calculation.time': {
    name: 'trending.calculation.time',
    displayName: 'Trending Calculation Time',
    description: 'Time to compute trending products ranking',
    unit: 'ms',
    thresholds: { good: 50, warning: 150, critical: 300, direction: 'lower_is_better' },
    collectionInterval: 60,
  },

  // Analytics-specific metrics
  'analytics.aggregation.7d': {
    name: 'analytics.aggregation.7d',
    displayName: '7-Day Aggregation Time',
    description: 'Time to aggregate 7 days of analytics data',
    unit: 'ms',
    thresholds: { good: 50, warning: 120, critical: 250, direction: 'lower_is_better' },
    collectionInterval: 60,
  },
  'analytics.aggregation.30d': {
    name: 'analytics.aggregation.30d',
    displayName: '30-Day Aggregation Time',
    description: 'Time to aggregate 30 days of analytics data',
    unit: 'ms',
    thresholds: { good: 80, warning: 180, critical: 400, direction: 'lower_is_better' },
    collectionInterval: 60,
  },
  'analytics.aggregation.90d': {
    name: 'analytics.aggregation.90d',
    displayName: '90-Day Aggregation Time',
    description: 'Time to aggregate 90 days of analytics data',
    unit: 'ms',
    thresholds: { good: 120, warning: 280, critical: 550, direction: 'lower_is_better' },
    collectionInterval: 60,
  },
  'analytics.aggregation.1y': {
    name: 'analytics.aggregation.1y',
    displayName: '1-Year Aggregation Time',
    description: 'Time to aggregate 1 year of analytics data',
    unit: 'ms',
    thresholds: { good: 200, warning: 450, critical: 800, direction: 'lower_is_better' },
    collectionInterval: 300,
  },
};

// ===========================================
// ERROR RATE METRICS BY ENDPOINT
// ===========================================

/**
 * Error Rate Metrics by Endpoint
 * Métriques de taux d'erreur par endpoint
 */
export const errorRateMetrics: Record<string, MetricDefinition> = {
  'errors.rate.overall': {
    name: 'errors.rate.overall',
    displayName: 'Overall Error Rate',
    description: 'Percentage of all requests resulting in errors (4xx + 5xx)',
    unit: 'percent',
    thresholds: { good: 0.5, warning: 2, critical: 5, direction: 'lower_is_better' },
    collectionInterval: 10,
    labels: ['error_type'],
  },
  'errors.rate.4xx': {
    name: 'errors.rate.4xx',
    displayName: 'Client Error Rate (4xx)',
    description: 'Percentage of client errors (bad request, not found, etc.)',
    unit: 'percent',
    thresholds: { good: 2, warning: 5, critical: 10, direction: 'lower_is_better' },
    collectionInterval: 10,
  },
  'errors.rate.5xx': {
    name: 'errors.rate.5xx',
    displayName: 'Server Error Rate (5xx)',
    description: 'Percentage of server errors (internal error, timeout, etc.)',
    unit: 'percent',
    thresholds: { good: 0.1, warning: 0.5, critical: 2, direction: 'lower_is_better' },
    collectionInterval: 10,
  },
  'errors.search.rate': {
    name: 'errors.search.rate',
    displayName: 'Search Error Rate',
    description: 'Error rate specifically for search endpoints',
    unit: 'percent',
    thresholds: { good: 0.3, warning: 1, critical: 3, direction: 'lower_is_better' },
    collectionInterval: 15,
  },
  'errors.products.rate': {
    name: 'errors.products.rate',
    displayName: 'Products API Error Rate',
    description: 'Error rate for products/listing endpoints',
    unit: 'percent',
    thresholds: { good: 0.3, warning: 1, critical: 3, direction: 'lower_is_better' },
    collectionInterval: 15,
  },
  'errors.trending.rate': {
    name: 'errors.trending.rate',
    displayName: 'Trending API Error Rate',
    description: 'Error rate for trending/ranking endpoints',
    unit: 'percent',
    thresholds: { good: 0.2, warning: 1, critical: 2, direction: 'lower_is_better' },
    collectionInterval: 30,
  },
  'errors.analytics.rate': {
    name: 'errors.analytics.rate',
    displayName: 'Analytics API Error Rate',
    description: 'Error rate for analytics/dashboard endpoints',
    unit: 'percent',
    thresholds: { good: 0.5, warning: 2, critical: 5, direction: 'lower_is_better' },
    collectionInterval: 30,
  },
  'errors.videos.rate': {
    name: 'errors.videos.rate',
    displayName: 'Videos API Error Rate',
    description: 'Error rate for video upload/processing endpoints',
    unit: 'percent',
    thresholds: { good: 1, warning: 3, critical: 8, direction: 'lower_is_better' },
    collectionInterval: 30,
  },
  'errors.shipments.rate': {
    name: 'errors.shipments.rate',
    displayName: 'Shipments API Error Rate',
    description: 'Error rate for shipping/tracking endpoints',
    unit: 'percent',
    thresholds: { good: 0.5, warning: 2, critical: 5, direction: 'lower_is_better' },
    collectionInterval: 20,
  },
  'errors.escrow.rate': {
    name: 'errors.escrow.rate',
    displayName: 'Escrow API Error Rate',
    description: 'Error rate for escrow/payment endpoints (critical!)',
    unit: 'percent',
    thresholds: { good: 0.01, warning: 0.1, critical: 0.5, direction: 'lower_is_better' },
    collectionInterval: 10,
  },
};

// ===========================================
// CACHE HIT/MISS RATIO METRICS
// ===========================================

/**
 * Cache Performance Metrics
 * Métriques de performance du cache
 */
export const cacheMetrics: Record<string, MetricDefinition> = {
  'cache.hit_rate.overall': {
    name: 'cache.hit_rate.overall',
    displayName: 'Overall Cache Hit Rate',
    description: 'Percentage of requests served from cache',
    unit: 'percent',
    thresholds: { good: 85, warning: 70, critical: 50, direction: 'higher_is_better' },
    collectionInterval: 15,
  },
  'cache.hit_rate.search': {
    name: 'cache.hit_rate.search',
    displayName: 'Search Cache Hit Rate',
    description: 'Cache hit rate for search results',
    unit: 'percent',
    thresholds: { good: 70, warning: 50, critical: 30, direction: 'higher_is_better' },
    collectionInterval: 15,
  },
  'cache.hit_rate.trending': {
    name: 'cache.hit_rate.trending',
    displayName: 'Trending Cache Hit Rate',
    description: 'Cache hit rate for trending products data',
    unit: 'percent',
    thresholds: { good: 90, warning: 75, critical: 55, direction: 'higher_is_better' },
    collectionInterval: 30,
  },
  'cache.hit_rate.products': {
    name: 'cache.hit_rate.products',
    displayName: 'Products Cache Hit Rate',
    description: 'Cache hit rate for product listings/details',
    unit: 'percent',
    thresholds: { good: 80, warning: 65, critical: 45, direction: 'higher_is_better' },
    collectionInterval: 15,
  },
  'cache.hit_rate.shipping': {
    name: 'cache.hit_rate.shipping',
    displayName: 'Shipping Rates Cache Hit Rate',
    description: 'Cache hit rate for shipping rates (should be very high)',
    unit: 'percent',
    thresholds: { good: 95, warning: 85, critical: 70, direction: 'higher_is_better' },
    collectionInterval: 60,
  },
  'cache.stale_served': {
    name: 'cache.stale_served',
    displayName: 'Stale Content Served',
    description: 'Number of stale-while-revalidate responses served',
    unit: 'count',
    thresholds: { good: 100, warning: 500, critical: 2000, direction: 'lower_is_better' },
    collectionInterval: 60,
  },
  'cache.evictions': {
    name: 'cache.evictions',
    displayName: 'Cache Evictions',
    description: 'Number of entries evicted from cache (memory pressure indicator)',
    unit: 'count',
    thresholds: { good: 10, warning: 100, critical: 500, direction: 'lower_is_better' },
    collectionInterval: 60,
  },
  'cache.memory_usage': {
    name: 'cache.memory_usage',
    displayName: 'Cache Memory Usage',
    description: 'Percentage of allocated cache memory in use',
    unit: 'percent',
    thresholds: { good: 60, warning: 80, critical: 95, direction: 'lower_is_better' },
    collectionInterval: 30,
  },
};

// ===========================================
// DATABASE QUERY TIME METRICS
// ===========================================

/**
 * Database Performance Metrics
 * Métriques de performance de base de données
 */
export const databaseMetrics: Record<string, MetricDefinition> = {
  'db.query_time.avg': {
    name: 'db.query_time.avg',
    displayName: 'Average Query Time',
    description: 'Average database query execution time',
    unit: 'ms',
    thresholds: { good: 10, warning: 50, critical: 100, direction: 'lower_is_better' },
    collectionInterval: 15,
  },
  'db.query_time.p95': {
    name: 'db.query_time.p95',
    displayName: 'P95 Query Time',
    description: '95th percentile query execution time',
    unit: 'ms',
    thresholds: { good: 50, warning: 150, critical: 300, direction: 'lower_is_better' },
    collectionInterval: 15,
  },
  'db.query_time.p99': {
    name: 'db.query_time.p99',
    displayName: 'P99 Query Time',
    description: '99th percentile query execution time (slow queries)',
    unit: 'ms',
    thresholds: { good: 100, warning: 300, critical: 800, direction: 'lower_is_better' },
    collectionInterval: 30,
  },
  'db.slow_queries.count': {
    name: 'db.slow_queries.count',
    displayName: 'Slow Query Count',
    description: 'Number of queries exceeding slow query threshold (>100ms)',
    unit: 'count',
    thresholds: { good: 0, warning: 5, critical: 20, direction: 'lower_is_better' },
    collectionInterval: 60,
  },
  'db.connections.active': {
    name: 'db.connections.active',
    displayName: 'Active DB Connections',
    description: 'Currently active database connections',
    unit: 'count',
    thresholds: { good: 10, warning: 25, critical: 45, direction: 'lower_is_better' },
    collectionInterval: 10,
  },
  'db.connections.pool_utilization': {
    name: 'db.connections.pool_utilization',
    displayName: 'Connection Pool Utilization',
    description: 'Percentage of connection pool in use',
    unit: 'percent',
    thresholds: { good: 50, warning: 75, critical: 90, direction: 'lower_is_better' },
    collectionInterval: 10,
  },
  'db.deadlocks': {
    name: 'db.deadlocks',
    displayName: 'Database Deadlocks',
    description: 'Number of deadlock events detected',
    unit: 'count',
    thresholds: { good: 0, warning: 1, critical: 5, direction: 'lower_is_better' },
    collectionInterval: 60,
  },
  'db.search.fulltext_time': {
    name: 'db.search.fulltext_time',
    displayName: 'Full-text Search Query Time',
    description: 'Execution time for full-text search queries with accents',
    unit: 'ms',
    thresholds: { good: 30, warning: 100, critical: 250, direction: 'lower_is_better' },
    collectionInterval: 15,
  },
  'db.pagination.offset_time': {
    name: 'db.pagination.offset_time',
    displayName: 'Offset Pagination Query Time',
    description: 'Query time for deep offset-based pagination',
    unit: 'ms',
    thresholds: { good: 20, warning: 80, critical: 200, direction: 'lower_is_better' },
    collectionInterval: 30,
  },
  'db.aggregation.time': {
    name: 'db.aggregation.time',
    displayName: 'Aggregation Query Time',
    description: 'Time for GROUP BY / COUNT / SUM aggregation queries',
    unit: 'ms',
    thresholds: { good: 50, warning: 200, critical: 500, direction: 'lower_is_better' },
    collectionInterval: 30,
  },
};

// ===========================================
// MEMORY USAGE UNDER LOAD
// ===========================================

/**
 * Memory & Resource Utilization Metrics
 * Métriques d'utilisation mémoire et ressources
 */
export const memoryMetrics: Record<string, MetricDefinition> = {
  'memory.heap_used': {
    name: 'memory.heap_used',
    displayName: 'Heap Memory Used',
    description: 'Current V8 heap memory usage in MB',
    unit: 'bytes',
    thresholds: { good: 128 * 1024 * 1024, warning: 256 * 1024 * 1024, critical: 512 * 1024 * 1024, direction: 'lower_is_better' },
    collectionInterval: 10,
  },
  'memory.heap_percent': {
    name: 'memory.heap_percent',
    displayName: 'Heap Usage Percentage',
    description: 'Percentage of available heap memory in use',
    unit: 'percent',
    thresholds: { good: 50, warning: 75, critical: 90, direction: 'lower_is_better' },
    collectionInterval: 10,
  },
  'memory.rss': {
    name: 'memory.rss',
    displayName: 'RSS Memory',
    description: 'Resident Set Size - total memory allocated',
    unit: 'bytes',
    thresholds: { good: 256 * 1024 * 1024, warning: 512 * 1024 * 1024, critical: 1024 * 1024 * 1024, direction: 'lower_is_better' },
    collectionInterval: 15,
  },
  'memory.gc_pause_avg': {
    name: 'memory.gc_pause_avg',
    displayName: 'Average GC Pause Time',
    description: 'Average garbage collection pause duration',
    unit: 'ms',
    thresholds: { good: 10, warning: 50, critical: 150, direction: 'lower_is_better' },
    collectionInterval: 30,
  },
  'memory.gc_frequency': {
    name: 'memory.gc_frequency',
    displayName: 'GC Frequency',
    description: 'Number of garbage collections per minute',
    unit: 'count',
    thresholds: { good: 10, warning: 30, critical: 60, direction: 'lower_is_better' },
    collectionInterval: 60,
  },
  'memory.leak_indicator': {
    name: 'memory.leak_indicator',
    displayName: 'Memory Leak Indicator',
    description: 'Heap growth rate over 5 minutes (bytes/second)',
    unit: 'bytes',
    thresholds: { good: 0, warning: 50000, critical: 200000, direction: 'lower_is_better' },
    collectionInterval: 300,
  },
};

// ===========================================
// THROUGHPUT & CONCURRENCY METRICS
// ===========================================

/**
 * Throughput Metrics
 * Métriques de débit
 */
export const throughputMetrics: Record<string, MetricDefinition> = {
  'throughput.requests_per_second': {
    name: 'throughput.requests_per_second',
    displayName: 'Requests Per Second',
    description: 'Current request throughput',
    unit: 'requests_per_second',
    thresholds: { good: 100, warning: 50, critical: 20, direction: 'higher_is_better' },
    collectionInterval: 5,
  },
  'throughput.concurrent_requests': {
    name: 'throughput.concurrent_requests',
    displayName: 'Concurrent Requests',
    description: 'Number of requests being processed simultaneously',
    unit: 'count',
    thresholds: { good: 25, warning: 75, critical: 150, direction: 'lower_is_better' },
    collectionInterval: 5,
  },
  'throughput.peak_rps': {
    name: 'throughput.peak_rps',
    displayName: 'Peak RPS (1 min)',
    description: 'Peak requests per second in last minute',
    unit: 'requests_per_second',
    thresholds: { good: 200, warning: 100, critical: 40, direction: 'higher_is_better' },
    collectionInterval: 10,
  },
  'throughput.queue_depth': {
    name: 'throughput.queue_depth',
    displayName: 'Request Queue Depth',
    description: 'Number of requests waiting to be processed',
    unit: 'count',
    thresholds: { good: 5, warning: 25, critical: 75, direction: 'lower_is_better' },
    collectionInterval: 5,
  },
};

// ===========================================
// PHASE 6 SPECIFIC BUSINESS METRICS
// ===========================================

/**
 * Phase 6 Business-Specific Metrics
 * Métriques métier spécifiques à la Phase 6
 */
export const phase6BusinessMetrics: Record<string, MetricDefinition> = {
  // Video processing metrics
  'videos.processing_queue_size': {
    name: 'videos.processing_queue_size',
    displayName: 'Video Processing Queue Size',
    description: 'Number of videos waiting to be processed',
    unit: 'count',
    thresholds: { good: 5, warning: 25, critical: 75, direction: 'lower_is_better' },
    collectionInterval: 30,
  },
  'videos.processing_time_avg': {
    name: 'videos.processing_time_avg',
    displayName: 'Avg Video Processing Time',
    description: 'Average time to process a video upload',
    unit: 'ms',
    thresholds: { good: 5000, warning: 15000, critical: 30000, direction: 'lower_is_better' },
    collectionInterval: 60,
  },

  // Verification metrics
  'verification.pending_count': {
    name: 'verification.pending_count',
    displayName: 'Pending Verifications',
    description: 'Number of business verifications awaiting review',
    unit: 'count',
    thresholds: { good: 10, warning: 50, critical: 150, direction: 'lower_is_better' },
    collectionInterval: 60,
  },
  'verification.avg_processing_time': {
    name: 'verification.avg_processing_time',
    displayName: 'Avg Verification Processing Time',
    description: 'Average time to complete business verification',
    unit: 'ms',
    thresholds: { good: 3600000, warning: 86400000, critical: 172800000, direction: 'lower_is_better' }, // ms
    collectionInterval: 3600,
  },

  // Exhibition metrics
  'exhibitions.active_count': {
    name: 'exhibitions.active_count',
    displayName: 'Active Exhibitions',
    description: 'Number of currently active/published exhibitions',
    unit: 'count',
    thresholds: { good: 10, warning: 5, critical: 0, direction: 'higher_is_better' },
    collectionInterval: 300,
  },
  'exhibitions.registration_conversion': {
    name: 'exhibitions.registration_conversion',
    displayName: 'Exhibition Registration Conversion',
    description: 'Percentage of exhibition visitors who register',
    unit: 'percent',
    thresholds: { good: 5, warning: 2, critical: 0.5, direction: 'higher_is_better' },
    collectionInterval: 3600,
  },

  // Shipping metrics
  'shipments.active_tracking': {
    name: 'shipments.active_tracking',
    displayName: 'Active Shipments Tracking',
    description: 'Number of shipments currently being tracked',
    unit: 'count',
    thresholds: { good: 100, warning: 500, critical: 1500, direction: 'lower_is_better' },
    collectionInterval: 30,
  },
  'shipments.rate_lookup_time': {
    name: 'shipments.rate_lookup_time',
    displayName: 'Shipping Rate Lookup Time',
    description: 'Time to calculate shipping rates',
    unit: 'ms',
    thresholds: { good: 50, warning: 150, critical: 350, direction: 'lower_is_better' },
    collectionInterval: 15,
  },

  // Escrow metrics (critical financial)
  'escrow.active_transactions': {
    name: 'escrow.active_transactions',
    displayName: 'Active Escrow Transactions',
    description: 'Number of transactions currently in escrow',
    unit: 'count',
    thresholds: { good: 50, warning: 200, critical: 500, direction: 'lower_is_better' },
    collectionInterval: 15,
  },
  'escrow.dispute_rate': {
    name: 'escrow.dispute_rate',
    displayName: 'Escrow Dispute Rate',
    description: 'Percentage of escrow transactions that are disputed',
    unit: 'percent',
    thresholds: { good: 1, warning: 3, critical: 7, direction: 'lower_is_better' },
    collectionInterval: 3600,
  },
};

// ===========================================
// ALERTING RULES CONFIGURATION
// ===========================================

export interface AlertRule {
  id: string;
  name: string;
  metricName: string;
  condition: 'gt' | 'lt' | 'gte' | 'lte';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  cooldownSeconds: number;
  notificationChannels: string[];
  messageTemplate: string;
}

/**
 * Pre-configured alerting rules for Phase 6 metrics
 * Règles d'alerte préconfigurées pour les métriques Phase 6
 */
export const alertRules: AlertRule[] = [
  // Critical alerts
  {
    id: 'high-error-rate',
    name: 'High Error Rate Detected',
    metricName: 'errors.rate.5xx',
    condition: 'gt',
    threshold: 1,
    severity: 'critical',
    cooldownSeconds: 300,
    notificationChannels: ['slack', 'pagerduty', 'email'],
    messageTemplate: 'Server error rate is {{value}}%, threshold is {{threshold}}%',
  },
  {
    id: 'slow-response-time',
    name: 'Slow API Response Times',
    metricName: 'api.response_time.p95',
    condition: 'gt',
    threshold: 1000,
    severity: 'critical',
    cooldownSeconds: 300,
    notificationChannels: ['slack', 'email'],
    messageTemplate: 'P95 response time is {{value}}ms, exceeds {{threshold}}ms threshold',
  },
  {
    id: 'memory-critical',
    name: 'Critical Memory Usage',
    metricName: 'memory.heap_percent',
    condition: 'gt',
    threshold: 90,
    severity: 'critical',
    cooldownSeconds: 120,
    notificationChannels: ['slack', 'pagerduty'],
    messageTemplate: 'Heap memory at {{value}}%, approaching OOM risk',
  },
  {
    id: 'database-slow-queries',
    name: 'Excessive Slow Queries',
    metricName: 'db.slow_queries.count',
    condition: 'gt',
    threshold: 15,
    severity: 'warning',
    cooldownSeconds: 600,
    notificationChannels: ['slack', 'email'],
    messageTemplate: '{{value}} slow queries detected in last hour (threshold: {{threshold}})',
  },

  // Warning alerts
  {
    id: 'low-cache-hit-rate',
    name: 'Low Cache Hit Rate',
    metricName: 'cache.hit_rate.overall',
    condition: 'lt',
    threshold: 65,
    severity: 'warning',
    cooldownSeconds: 900,
    notificationChannels: ['slack'],
    messageTemplate: 'Cache hit rate dropped to {{value}}% (threshold: {{threshold}}%)',
  },
  {
    id: 'high-concurrent-requests',
    name: 'High Concurrent Requests',
    metricName: 'throughput.concurrent_requests',
    condition: 'gt',
    threshold: 100,
    severity: 'warning',
    cooldownSeconds: 120,
    notificationChannels: ['slack'],
    messageTemplate: '{{value}} concurrent requests being processed',
  },
  {
    id: 'connection-pool-exhaustion',
    name: 'Connection Pool Near Exhaustion',
    metricName: 'db.connections.pool_utilization',
    condition: 'gt',
    threshold: 85,
    severity: 'warning',
    cooldownSeconds: 180,
    notificationChannels: ['slack', 'email'],
    messageTemplate: 'DB connection pool at {{value}}% capacity',
  },

  // Info alerts
  {
    id: 'video-processing-backlog',
    name: 'Video Processing Backlog',
    metricName: 'videos.processing_queue_size',
    condition: 'gt',
    threshold: 20,
    severity: 'info',
    cooldownSeconds: 3600,
    notificationChannels: ['slack'],
    messageTemplate: '{{value}} videos waiting to be processed',
  },
];

// ===========================================
// DASHBOARD WIDGET DEFINITIONS
// ===========================================

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'gauge' | 'line' | 'bar' | 'counter' | 'table' | 'heatmap';
  metrics: string[];
  refreshInterval: number;
  gridSpan: { x: number; y: number; width: number; height: number };
}

/**
 * Pre-defined dashboard widgets for monitoring
 * Widgets de tableau de bord prédéfinis pour le monitoring
 */
export const dashboardWidgets: DashboardWidget[] = [
  {
    id: 'overview-health',
    title: 'System Health Overview',
    type: 'gauge',
    metrics: ['api.response_time.p95', 'errors.rate.overall', 'cache.hit_rate.overall', 'memory.heap_percent'],
    refreshInterval: 10,
    gridSpan: { x: 0, y: 0, width: 4, height: 2 },
  },
  {
    id: 'response-times-chart',
    title: 'API Response Times',
    type: 'line',
    metrics: ['api.response_time.p50', 'api.response_time.p95', 'api.response_time.p99'],
    refreshInterval: 10,
    gridSpan: { x: 4, y: 0, width: 4, height: 2 },
  },
  {
    id: 'error-rates-chart',
    title: 'Error Rates by Endpoint',
    type: 'bar',
    metrics: Object.keys(errorRateMetrics).slice(0, 6),
    refreshInterval: 15,
    gridSpan: { x: 8, y: 0, width: 4, height: 2 },
  },
  {
    id: 'cache-performance',
    title: 'Cache Performance',
    type: 'line',
    metrics: ['cache.hit_rate.overall', 'cache.hit_rate.search', 'cache.hit_rate.trending', 'cache.hit_rate.products'],
    refreshInterval: 15,
    gridSpan: { x: 0, y: 2, width: 4, height: 2 },
  },
  {
    id: 'database-performance',
    title: 'Database Metrics',
    type: 'line',
    metrics: ['db.query_time.avg', 'db.query_time.p95', 'db.connections.pool_utilization'],
    refreshInterval: 15,
    gridSpan: { x: 4, y: 2, width: 4, height: 2 },
  },
  {
    id: 'throughput-monitoring',
    title: 'Request Throughput',
    type: 'line',
    metrics: ['throughput.requests_per_second', 'throughput.concurrent_requests', 'throughput.peak_rps'],
    refreshInterval: 5,
    gridSpan: { x: 8, y: 2, width: 4, height: 2 },
  },
  {
    id: 'phase6-business-metrics',
    title: 'Phase 6 Business Metrics',
    type: 'table',
    metrics: [
      'videos.processing_queue_size',
      'verification.pending_count',
      'exhibitions.active_count',
      'shipments.active_tracking',
      'escrow.active_transactions',
    ],
    refreshInterval: 60,
    gridSpan: { x: 0, y: 4, width: 12, height: 2 },
  },
];

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Get all metric definitions
 * Obtenir toutes les définitions de métriques
 */
export function getAllMetricDefinitions(): Record<string, MetricDefinition> {
  return {
    ...apiResponseTimeMetrics,
    ...errorRateMetrics,
    ...cacheMetrics,
    ...databaseMetrics,
    ...memoryMetrics,
    ...throughputMetrics,
    ...phase6BusinessMetrics,
  };
}

/**
 * Get metrics by category
 * Obtenir les métriques par catégorie
 */
export function getMetricsByCategory(
  category: 'response_time' | 'error_rate' | 'cache' | 'database' | 'memory' | 'throughput' | 'business'
): Record<string, MetricDefinition> {
  const categoryMap: Record<string, Record<string, MetricDefinition>> = {
    response_time: apiResponseTimeMetrics,
    error_rate: errorRateMetrics,
    cache: cacheMetrics,
    database: databaseMetrics,
    memory: memoryMetrics,
    throughput: throughputMetrics,
    business: phase6BusinessMetrics,
  };

  return categoryMap[category] || {};
}

/**
 * Evaluate metric against thresholds
 * Évaluer la métrique par rapport aux seuils
 */
export function evaluateMetric(
  definition: MetricDefinition,
  value: number
): 'good' | 'warning' | 'critical' {
  const { thresholds } = definition;

  if (thresholds.direction === 'lower_is_better') {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'critical';
  } else {
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.warning) return 'warning';
    return 'critical';
  }
}

/**
 * Calculate overall system health score
 * Calculer le score global de santé du système
 */
export function calculateHealthScore(
  metricValues: Record<string, number>
): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F'; breakdown: Record<string, string> } {
  const allMetrics = getAllMetricDefinitions();
  const breakdown: Record<string, string> = {};
  let totalWeight = 0;
  let weightedSum = 0;

  // Key metrics with weights
  const keyMetricWeights: Record<string, number> = {
    'api.response_time.p95': 20,
    'errors.rate.5xx': 20,
    'cache.hit_rate.overall': 15,
    'db.query_time.p95': 15,
    'memory.heap_percent': 15,
    'throughput.requests_per_second': 15,
  };

  for (const [metricName, weight] of Object.entries(keyMetricWeights)) {
    const definition = allMetrics[metricName];
    const value = metricValues[metricName];

    if (definition && value !== undefined) {
      const status = evaluateMetric(definition, value);
      const statusScores: Record<string, number> = { good: 100, warning: 65, critical: 25 };
      
      breakdown[metricName] = status;
      totalWeight += weight;
      weightedSum += statusScores[status] * weight;
    }
  }

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return { score, grade, breakdown };
}

/**
 * Generate metrics report payload
 * Générer le payload du rapport de métriques
 */
export function generateMetricsReport(
  values: Record<string, number>,
  timestamp: Date = new Date()
): object {
  const healthScore = calculateHealthScore(values);
  
  return {
    timestamp: timestamp.toISOString(),
    health: healthScore,
    metrics: values,
    alertRules: alertRules.map((rule) => ({
      ...rule,
      triggered: values[rule.metricName] !== undefined && 
        ((rule.condition === 'gt' && values[rule.metricName]! > rule.threshold) ||
         (rule.condition === 'lt' && values[rule.metricName]! < rule.threshold)),
    })),
  };
}

// Export default with all configurations
export default {
  apiResponseTimes: apiResponseTimeMetrics,
  errorRates: errorRateMetrics,
  cache: cacheMetrics,
  database: databaseMetrics,
  memory: memoryMetrics,
  throughput: throughputMetrics,
  business: phase6BusinessMetrics,
  alertRules,
  dashboardWidgets,
  utilities: {
    getAllMetricDefinitions,
    getMetricsByCategory,
    evaluateMetric,
    calculateHealthScore,
    generateMetricsReport,
  },
};
