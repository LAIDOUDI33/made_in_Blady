/**
 * Multi-CDN Provider Integration for AlgeriaTrade.dz
 * 
 * Comprehensive abstraction layer for managing multiple CDN providers:
 * - Cloudflare (Primary - 60% traffic)
 * - Fastly (Secondary - 25% traffic)
 * - CloudFront (Tertiary - 15% traffic)
 * 
 * Features:
 * - Automatic failover between providers
 * - Health check aggregation
 * - Unified purge API
 * - Performance monitoring hooks
 * - Geographic routing optimization for MENA region
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export type CDNProviderName = 'cloudflare' | 'fastly' | 'cloudfront';
export type CDNHealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface CDNProviderConfig {
  name: CDNProviderName;
  displayName: string;
  enabled: boolean;
  priority: number;           // Lower = higher priority (1, 2, 3)
  weight: number;             // Traffic percentage (0-100)
  
  // API Configuration
  api: {
    baseUrl: string;
    apiKey?: string;
    apiSecret?: string;
    zoneId?: string;          // Cloudflare zone ID
    serviceId?: string;       // Fastly service ID
    distributionId?: string;  // CloudFront distribution ID
    accountId?: string;
  };
  
  // Endpoints
  endpoints: {
    purge: string;
    stats: string;
    health: string;
  };
  
  // Capabilities
  capabilities: {
    imageOptimization: boolean;
    edgeFunctions: boolean;
    waf: boolean;
    ddosProtection: boolean;
    botManagement: boolean;
    realtimeLogs: boolean;
    analytics: boolean;
  };
  
  // Regional Performance Targets
  performanceTargets: {
    algeriaMs: number;        // Target latency for Algeria (<50ms)
    menaMs: number;           // Target latency for MENA (<100ms)
    europeMs: number;         // Target latency for Europe (<100ms)
    globalMs: number;         // Global target (<200ms)
  };
}

export interface HealthCheckResult {
  provider: CDNProviderName;
  status: CDNHealthStatus;
  timestamp: Date;
  responseTimeMs: number;
  errorCount: number;
  lastError?: string;
  details: Record<string, unknown>;
}

export interface PurgeRequest {
  urls?: string[];
  tags?: string[];
  wildcardPatterns?: string[];
  surrogateKeys?: string[];
}

export interface PurgeResult {
  provider: CDNProviderName;
  success: boolean;
  purgedUrls: string[];
  purgedTags: string[];
  errors: string[];
  timestamp: Date;
  durationMs: number;
}

export interface TrafficDistributionResult {
  provider: CDNProviderName;
  percentage: number;
  reason: string;
}

export interface CDNMetricsSnapshot {
  timestamp: Date;
  totalRequests: number;
  cacheHitRatio: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  bandwidthUsedGB: number;
  providerMetrics: Record<CDNProviderName, ProviderMetrics>;
}

export interface ProviderMetrics {
  requests: number;
  hits: number;
  misses: number;
  bandwidthBytes: number;
  avgResponseTimeMs: number;
  errorCount: number;
  statusCodes: Record<number, number>;
  topCountries: Array<{ country: string; requests: number }>;
  topURIs: Array<{ uri: string; requests: number }>;
}

export interface FailoverEvent {
  id: string;
  timestamp: Date;
  fromProvider: CDNProviderName;
  toProvider: CDNProviderName;
  reason: string;
  automatic: boolean;
  resolvedAt?: Date;
}

export interface GeoRoutingRule {
  countryCode: string;
  primaryProvider: CDNProviderName;
  fallbackProviders: CDNProviderName[];
  targetLatencyMs: number;
  preferredPOPs: string[];
}

// ============================================================================
// Constants & Default Configuration
// ============================================================================

const DEFAULT_PROVIDERS: Record<CDNProviderName, CDNProviderConfig> = {
  cloudflare: {
    name: 'cloudflare',
    displayName: 'Cloudflare',
    enabled: true,
    priority: 1,
    weight: 60,
    api: {
      baseUrl: 'https://api.cloudflare.com/client/v4',
      zoneId: process.env.CLOUDFLARE_ZONE_ID || '',
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    },
    endpoints: {
      purge: '/zones/{zoneId}/purge_cache',
      stats: '/zones/{zoneId}/analytics/dashboard',
      health: '/client/v4/user/tokens/verify',
    },
    capabilities: {
      imageOptimization: true,
      edgeFunctions: true,
      waf: true,
      ddosProtection: true,
      botManagement: true,
      realtimeLogs: true,
      analytics: true,
    },
    performanceTargets: {
      algeriaMs: 50,
      menaMs: 80,
      europeMs: 80,
      globalMs: 150,
    },
  },
  fastly: {
    name: 'fastly',
    displayName: 'Fastly',
    enabled: true,
    priority: 2,
    weight: 25,
    api: {
      baseUrl: 'https://api.fastly.com',
      serviceId: process.env.FASTLY_SERVICE_ID || '',
    },
    endpoints: {
      purge: '/purge',
      stats: '/stats/service/{serviceId}',
      health: '/',
    },
    capabilities: {
      imageOptimization: true,
      edgeFunctions: true,
      waf: true,
      ddosProtection: true,
      botManagement: false,
      realtimeLogs: true,
      analytics: true,
    },
    performanceTargets: {
      algeriaMs: 60,
      menaMs: 90,
      europeMs: 70,
      globalMs: 160,
    },
  },
  cloudfront: {
    name: 'cloudfront',
    displayName: 'AWS CloudFront',
    enabled: true,
    priority: 3,
    weight: 15,
    api: {
      baseUrl: 'https://cloudfront.amazonaws.com/',
      distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || '',
    },
    endpoints: {
      purge: '/2020-05-31/distribution/{distributionId}/invalidation',
      stats: '/2020-05-01/distribution/{distributionId}/usage',
      health: '/',
    },
    capabilities: {
      imageOptimization: false,
      edgeFunctions: true,
      waf: true,
      ddosProtection: true,
      botManagement: false,
      realtimeLogs: true,
      analytics: true,
    },
    performanceTargets: {
      algeriaMs: 80,
      menaMs: 100,
      europeMs: 60,
      globalMs: 140,
    },
  },
};

// Geographic routing rules optimized for Algeria/MENA region
const GEO_ROUTING_RULES: GeoRoutingRule[] = [
  {
    countryCode: 'DZ',  // Algeria - Primary market
    primaryProvider: 'cloudflare',
    fallbackProviders: ['fastly', 'cloudfront'],
    targetLatencyMs: 50,
    preferredPOPs: ['ALG-Algiers', 'ORN-Oran', 'CST-Constantine'],
  },
  {
    countryCode: 'TN',  // Tunisia
    primaryProvider: 'cloudflare',
    fallbackProviders: ['fastly', 'cloudfront'],
    targetLatencyMs: 80,
    preferredPOPs: ['TUN-Tunis', 'MRS-Marseille'],
  },
  {
    countryCode: 'MA',  // Morocco
    primaryProvider: 'fastly',
    fallbackProviders: ['cloudflare', 'cloudfront'],
    targetLatencyMs: 80,
    preferredPOPs: ['CAS-Casablanca', 'MAD-Madrid'],
  },
  {
    countryCode: 'FR',  // France - Large Algerian diaspora
    primaryProvider: 'cloudflare',
    fallbackProviders: ['fastly', 'cloudfront'],
    targetLatencyMs: 40,
    preferredPOPs: ['PAR-Paris', 'CDG-Paris'],
  },
  {
    countryCode: '*',  // Default/Global
    primaryProvider: 'cloudflare',
    fallbackProviders: ['fastly', 'cloudfront'],
    targetLatencyMs: 200,
    preferredPOPs: [],
  },
];

// ============================================================================
// Error Classes
// ============================================================================

export class CDNError extends Error {
  constructor(
    message: string,
    public provider?: CDNProviderName,
    public code?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'CDNError';
  }
}

export class PurgeError extends CDNError {
  constructor(provider: CDNProviderName, message: string, originalError?: Error) {
    super(`Purge failed on ${provider}: ${message}`, provider, 'PURGE_ERROR', originalError);
    this.name = 'PurgeError';
  }
}

export class HealthCheckError extends CDNError {
  constructor(provider: CDNProviderName, message: string) {
    super(`Health check failed for ${provider}: ${message}`, provider, 'HEALTH_CHECK_ERROR');
    this.name = 'HealthCheckError';
  }
}

export class FailoverError extends CDNError {
  constructor(message: string, public event: FailoverEvent) {
    super(message, event.fromProvider, 'FAILOVER_ERROR');
    this.name = 'FailoverError';
  }
}

// ============================================================================
// Main CDN Providers Class
// ============================================================================

export class CDNProviders {
  private providers: Map<CDNProviderName, CDNProviderConfig>;
  private healthStatus: Map<CDNProviderName, HealthCheckResult>;
  private failoverHistory: FailoverEvent[];
  private currentDistribution: Map<string, TrafficDistributionResult>;
  private metricsCache: CDNMetricsSnapshot | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor(customConfigs?: Partial<Record<CDNProviderName, Partial<CDNProviderConfig>>>) {
    this.providers = new Map();
    this.healthStatus = new Map();
    this.failoverHistory = [];
    this.currentDistribution = new Map();

    // Initialize with default configs and merge any custom overrides
    const providerNames: CDNProviderName[] = ['cloudflare', 'fastly', 'cloudfront'];
    for (const name of providerNames) {
      const config = customConfigs?.[name]
        ? { ...DEFAULT_PROVIDERS[name], ...customConfigs[name] }
        : { ...DEFAULT_PROVIDERS[name] };
      this.providers.set(name, config);
      
      // Initialize health status as unknown
      this.healthStatus.set(name, {
        provider: name,
        status: 'unknown',
        timestamp: new Date(),
        responseTimeMs: 0,
        errorCount: 0,
        details: {},
      });
    }
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initialize the multi-CDN system
   * Sets up health checks and initial configuration validation
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('[CDN] Initializing multi-CDN provider system...');

    try {
      // Validate configurations
      await this.validateConfigurations();

      // Perform initial health checks
      await this.performAllHealthChecks();

      // Calculate initial traffic distribution
      this.calculateTrafficDistribution();

      // Start periodic health checks (every 30 seconds)
      this.startHealthCheckMonitoring(30000);

      this.isInitialized = true;
      console.log('[CDN] Multi-CDN system initialized successfully');
      console.log(`[CDN] Active providers: ${this.getActiveProviders().join(', ')}`);
      console.log(`[CDN] Current distribution:`, Object.fromEntries(this.currentDistribution));
    } catch (error) {
      console.error('[CDN] Failed to initialize multi-CDN system:', error);
      throw new CDNError('Failed to initialize CDN providers', undefined, 'INIT_ERROR', error as Error);
    }
  }

  /**
   * Clean up resources when shutting down
   */
  async destroy(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isInitialized = false;
    console.log('[CDN] Multi-CDN system shut down');
  }

  // ============================================================================
  // Configuration Management
  // ============================================================================

  /**
   * Get configuration for a specific provider
   */
  getProviderConfig(provider: CDNProviderName): CDNProviderConfig | undefined {
    return this.providers.get(provider);
  }

  /**
   * Get all provider configurations
   */
  getAllProviderConfigs(): Record<CDNProviderName, CDNProviderConfig> {
    return Object.fromEntries(this.providers);
  }

  /**
   * Update provider configuration at runtime
   */
  updateProviderConfig(
    provider: CDNProviderName,
    updates: Partial<CDNProviderConfig>
  ): void {
    const existing = this.providers.get(provider);
    if (existing) {
      this.providers.set(provider, { ...existing, ...updates });
      this.calculateTrafficDistribution();
      console.log(`[CDN] Updated configuration for ${provider}`);
    }
  }

  /**
   * Enable or disable a provider
   */
  setProviderEnabled(provider: CDNProviderName, enabled: boolean): void {
    this.updateProviderConfig(provider, { enabled });
    console.log(`[CDN] Provider ${provider} ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Validate all provider configurations
   */
  private async validateConfigurations(): Promise<void> {
    const errors: string[] = [];

    for (const [name, config] of this.providers) {
      if (!config.enabled) continue;

      // Check required API credentials
      if (!config.api.apiKey && !config.api.zoneId && !config.api.serviceId) {
        // Allow missing keys in development
        if (process.env.NODE_ENV === 'production') {
          errors.push(`${name}: Missing API credentials`);
        }
      }

      // Validate weights sum to approximately 100
      const totalWeight = Array.from(this.providers.values())
        .filter(p => p.enabled)
        .reduce((sum, p) => sum + p.weight, 0);

      if (Math.abs(totalWeight - 100) > 5) {
        console.warn(`[CDN] Warning: Total weight (${totalWeight}) does not equal 100`);
      }
    }

    if (errors.length > 0 && process.env.NODE_ENV === 'production') {
      throw new CDNError(`Configuration validation failed: ${errors.join('; ')}`, undefined, 'CONFIG_ERROR');
    }
  }

  // ============================================================================
  // Health Checks
  // ============================================================================

  /**
   * Perform health check for a single provider
   */
  async checkProviderHealth(provider: CDNProviderName): Promise<HealthCheckResult> {
    const config = this.providers.get(provider);
    if (!config) {
      throw new CDNError(`Unknown provider: ${provider}`);
    }

    const startTime = Date.now();
    
    try {
      let status: CDNHealthStatus = 'healthy';
      let responseTimeMs = 0;
      let errorCount = 0;
      const details: Record<string, unknown> = {};

      switch (provider) {
        case 'cloudflare':
          ({ status, responseTimeMs, details } = await this.checkCloudflareHealth(config));
          break;
        case 'fastly':
          ({ status, responseTimeMs, details } = await this.checkFastlyHealth(config));
          break;
        case 'cloudfront':
          ({ status, responseTimeMs, details } = await this.checkCloudFrontHealth(config));
          break;
      }

      const result: HealthCheckResult = {
        provider,
        status,
        timestamp: new Date(),
        responseTimeMs,
        errorCount,
        details,
      };

      this.healthStatus.set(provider, result);

      // Trigger failover if needed
      if (status === 'unhealthy') {
        await this.handleUnhealthyProvider(provider);
      }

      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        provider,
        status: 'unhealthy',
        timestamp: new Date(),
        responseTimeMs: Date.now() - startTime,
        errorCount: 1,
        lastError: (error as Error).message,
        details: {},
      };

      this.healthStatus.set(provider, result);
      await this.handleUnhealthyProvider(provider);

      return result;
    }
  }

  /**
   * Perform health checks for all providers
   */
  async performAllHealthChecks(): Promise<Map<CDNProviderName, HealthCheckResult>> {
    const results = new Map<CDNProviderName, HealthCheckResult>();

    const promises = Array.from(this.providers.keys()).map(async (provider) => {
      const result = await this.checkProviderHealth(provider);
      results.set(provider, result);
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Get current health status of all providers
   */
  getHealthStatus(): Map<CDNProviderName, HealthCheckResult> {
    return new Map(this.healthStatus);
  }

  /**
   * Get list of healthy providers sorted by priority
   */
  getHealthyProviders(): CDNProviderName[] {
    return Array.from(this.healthStatus.entries())
      .filter(([, status]) => status.status === 'healthy' || status.status === 'degraded')
      .sort((a, b) => {
        const configA = this.providers.get(a[0])!;
        const configB = this.providers.get(b[0])!;
        return configA.priority - configB.priority;
      })
      .map(([name]) => name);
  }

  /**
   * Get list of active (enabled) providers
   */
  getActiveProviders(): CDNProviderName[] {
    return Array.from(this.providers.entries())
      .filter(([, config]) => config.enabled)
      .map(([name]) => name);
  }

  // Private health check implementations
  private async checkCloudflareHealth(config: CDNProviderConfig): Promise<{
    status: CDNHealthStatus;
    responseTimeMs: number;
    details: Record<string, unknown>;
  }> {
    const startTime = Date.now();
    
    try {
      // Use Cloudflare's trace endpoint for quick health check
      const response = await fetch('https://1.1.1.1/api/v1/00ffffff000000000000000000000000000/cdn-cgi/trace', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      const responseTimeMs = Date.now() - startTime;
      const text = await response.text();
      const data = Object.fromEntries(text.split('\n').filter(Boolean).map(line => line.split('=')));

      return {
        status: response.ok ? 'healthy' : 'degraded',
        responseTimeMs,
        details: {
          colo: data.colo || 'unknown',
          ip: data.ip || 'unknown',
          loc: data.loc || 'unknown',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTimeMs: Date.now() - startTime,
        details: { error: (error as Error).message },
      };
    }
  }

  private async checkFastlyHealth(config: CDNProviderConfig): Promise<{
    status: CDNHealthStatus;
    responseTimeMs: number;
    details: Record<string, unknown>;
  }> {
    const startTime = Date.now();
    
    try {
      // Ping Fastly's main domain
      const response = await fetch('https://www.fastly.com/status', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      return {
        status: response.ok ? 'healthy' : 'degraded',
        responseTimeMs: Date.now() - startTime,
        details: {
          statusCode: response.status,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTimeMs: Date.now() - startTime,
        details: { error: (error as Error).message },
      };
    }
  }

  private async checkCloudFrontHealth(config: CDNProviderConfig): Promise<{
    status: CDNHealthStatus;
    responseTimeMs: number;
    details: Record<string, unknown>;
  }> {
    const startTime = Date.now();
    
    try {
      // Check AWS health endpoint
      const response = await fetch('https://d111111abcdef8.cloudfront.net/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      return {
        status: response.ok ? 'healthy' : 'degraded',
        responseTimeMs: Date.now() - startTime,
        details: {
          statusCode: response.status,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTimeMs: Date.now() - startTime,
        details: { error: (error as Error).message },
      };
    }
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthCheckMonitoring(intervalMs: number): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performAllHealthChecks();
    }, intervalMs);

    // Don't prevent Node.js from exiting in non-server contexts
    if (this.healthCheckInterval.unref) {
      this.healthCheckInterval.unref();
    }
  }

  // ============================================================================
  // Traffic Distribution
  // ============================================================================

  /**
   * Calculate traffic distribution based on provider health and weights
   */
  calculateTrafficDistribution(): Map<string, TrafficDistributionResult> {
    const distribution = new Map<string, TrafficDistributionResult>();
    const healthyProviders = this.getHealthyProviders().filter(p => 
      this.providers.get(p)?.enabled
    );

    if (healthyProviders.length === 0) {
      // Emergency: use all enabled providers regardless of health
      const emergencyProviders = this.getActiveProviders();
      const equalWeight = Math.floor(100 / emergencyProviders.length);
      
      for (const provider of emergencyProviders) {
        distribution.set('global', {
          provider,
          percentage: equalWeight,
          reason: 'Emergency mode - no healthy providers',
        });
      }
      return distribution;
    }

    // Calculate adjusted weights based on healthy providers only
    const totalWeight = healthyProviders.reduce((sum, p) => {
      return sum + (this.providers.get(p)?.weight || 0);
    }, 0);

    for (const provider of healthyProviders) {
      const config = this.providers.get(provider)!;
      const percentage = Math.round((config.weight / totalWeight) * 100);

      distribution.set('global', {
        provider,
        percentage,
        reason: `Normal operation - ${config.displayName}`,
      });
    }

    this.currentDistribution = distribution;
    return distribution;
  }

  /**
   * Get best provider for a specific country code
   */
  getBestProviderForCountry(countryCode: string): CDNProviderName {
    const rule = GEO_ROUTING_RULES.find(r => 
      r.countryCode === countryCode.toUpperCase()
    ) || GEO_ROUTING_RULES.find(r => r.countryCode === '*')!;

    // Check if primary is healthy
    const primaryHealth = this.healthStatus.get(rule.primaryProvider);
    if (primaryHealth?.status !== 'unhealthy' && this.providers.get(rule.primaryProvider)?.enabled) {
      return rule.primaryProvider;
    }

    // Fall back to next available
    for (const fallback of rule.fallbackProviders) {
      const fallbackHealth = this.healthStatus.get(fallback);
      if (fallbackHealth?.status !== 'unhealthy' && this.providers.get(fallback)?.enabled) {
        return fallback;
      }
    }

    // Last resort: return first healthy provider
    const healthyProviders = this.getHealthyProviders();
    return healthyProviders[0] || 'cloudflare';
  }

  /**
   * Get current traffic distribution
   */
  getCurrentDistribution(): Map<string, TrafficDistributionResult> {
    return new Map(this.currentDistribution);
  }

  // ============================================================================
  // Cache Purging
  // ============================================================================

  /**
   * Purge cache across all or specific providers
   */
  async purge(request: PurgeRequest, providers?: CDNProviderName[]): Promise<PurgeResult[]> {
    const targetProviders = providers || this.getActiveProviders();
    const results: PurgeResult[] = [];

    const purgePromises = targetProviders.map(async (provider) => {
      try {
        const result = await this.purgeFromProvider(provider, request);
        results.push(result);
      } catch (error) {
        results.push({
          provider,
          success: false,
          purgedUrls: [],
          purgedTags: [],
          errors: [(error as Error).message],
          timestamp: new Date(),
          durationMs: 0,
        });
      }
    });

    await Promise.allSettled(purgePromises);
    return results;
  }

  /**
   * Purge specific URLs from cache
   */
  async purgeURLs(urls: string[], providers?: CDNProviderName[]): Promise<PurgeResult[]> {
    return this.purge({ urls }, providers);
  }

  /**
   * Purge by cache tags
   */
  async purgeByTags(tags: string[], providers?: CDNProviderName[]): Promise<PurgeResult[]> {
    return this.purge({ tags }, providers);
  }

  /**
   * Purge everything (emergency only!)
   */
  async purgeAll(providers?: CDNProviderName[]): Promise<PurgeResult[]> {
    console.warn('[CDN] WARNING: Full cache purge initiated!');
    return this.purge({ wildcardPatterns: ['*'] }, providers);
  }

  /**
   * Purge from a single provider
   */
  private async purgeFromProvider(
    provider: CDNProviderName,
    request: PurgeRequest
  ): Promise<PurgeResult> {
    const config = this.providers.get(provider)!;
    const startTime = Date.now();

    try {
      switch (provider) {
        case 'cloudflare':
          return await this.purgeFromCloudflare(config, request, startTime);
        case 'fastly':
          return await this.purgeFromFastly(config, request, startTime);
        case 'cloudfront':
          return await this.purgeFromCloudFront(config, request, startTime);
        default:
          throw new CDNError(`Unknown provider: ${provider}`);
      }
    } catch (error) {
      throw new PurgeError(provider, (error as Error).message, error as Error);
    }
  }

  private async purgeFromCloudflare(
    config: CDNProviderConfig,
    request: PurgeRequest,
    startTime: number
  ): Promise<PurgeResult> {
    const apiKey = config.api.apiKey || process.env.CLOUDFLARE_API_KEY;
    const zoneId = config.api.zoneId || process.env.CLOUDFLARE_ZONE_ID;

    if (!apiKey || !zoneId) {
      // Simulate success in dev/test environments
      if (process.env.NODE_ENV !== 'production') {
        return {
          provider: 'cloudflare',
          success: true,
          purgedUrls: request.urls || [],
          purgedTags: request.tags || [],
          errors: [],
          timestamp: new Date(),
          durationMs: Date.now() - startTime,
        };
      }
      throw new CDNError('Missing Cloudflare API credentials');
    }

    const body: Record<string, unknown> = {};
    if (request.urls?.length) body.files = request.urls;
    if (request.tags?.length) body.tags = request.tags;
    if (request.wildcardPatterns?.length && request.wildcardPatterns.includes('*')) {
      body.purge_everything = true;
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new CDNError(data.errors?.[0]?.message || 'Purge failed');
    }

    return {
      provider: 'cloudflare',
      success: true,
      purgedUrls: request.urls || [],
      purgedTags: request.tags || [],
      errors: [],
      timestamp: new Date(),
      durationMs: Date.now() - startTime,
    };
  }

  private async purgeFromFastly(
    config: CDNProviderConfig,
    request: PurgeRequest,
    startTime: number
  ): Promise<PurgeResult> {
    const apiKey = config.api.apiKey || process.env.FASTLY_API_KEY;

    if (!apiKey) {
      if (process.env.NODE_ENV !== 'production') {
        return {
          provider: 'fastly',
          success: true,
          purgedUrls: request.urls || [],
          purgedTags: request.tags || [],
          errors: [],
          timestamp: new Date(),
          durationMs: Date.now() - startTime,
        };
      }
      throw new CDNError('Missing Fastly API key');
    }

    const results: PurgeResult = {
      provider: 'fastly',
      success: true,
      purgedUrls: [],
      purgedTags: [],
      errors: [],
      timestamp: new Date(),
      durationMs: Date.now() - startTime,
    };

    // Fastly supports URL purging via POST to /purge/{url} or batch via /purge
    if (request.urls?.length) {
      const response = await fetch('https://api.fastly.com/purge', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Fastly-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surrogate_keys: request.surrogateKeys || [],
          ...(request.urls.length === 1 ? { url: request.urls[0] } : {}),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        results.errors.push(error.detail || 'Fastly purge failed');
        results.success = false;
      } else {
        results.purgedUrls = request.urls;
      }
    }

    if (request.surrogateKeys?.length) {
      const response = await fetch('https://api.fastly.com/purge', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Fastly-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ surrogate_keys: request.surrogateKeys }),
      });

      if (!response.ok) {
        const error = await response.json();
        results.errors.push(error.detail || 'Fastly surrogate key purge failed');
        results.success = false;
      } else {
        results.purgedTags = request.surrogateKeys;
      }
    }

    results.durationMs = Date.now() - startTime;
    return results;
  }

  private async purgeFromCloudFront(
    config: CDNProviderConfig,
    request: PurgeRequest,
    startTime: number
  ): Promise<PurgeResult> {
    // CloudFront requires AWS SDK for proper invalidation
    // This is a simplified implementation
    if (process.env.NODE_ENV !== 'production') {
      return {
        provider: 'cloudfront',
        success: true,
        purgedUrls: request.urls || [],
        purgedTags: request.tags || [],
        errors: [],
        timestamp: new Date(),
        durationMs: Date.now() - startTime,
      };
    }

    throw new CDNError(
      'CloudFront purge requires AWS SDK integration',
      'cloudfront',
      'NOT_IMPLEMENTED'
    );
  }

  // ============================================================================
  // Failover Management
  // ============================================================================

  /**
   * Handle an unhealthy provider by redistributing traffic
   */
  private async handleUnhealthyProvider(unhealthyProvider: CDNProviderName): Promise<void> {
    const health = this.healthStatus.get(unhealthyProvider);
    if (!health || health.status !== 'unhealthy') return;

    // Check if we've already failed over recently for this provider
    const recentFailover = this.failoverHistory.find(
      f => f.fromProvider === unhealthyProvider && !f.resolvedAt &&
      Date.now() - f.timestamp.getTime() < 5 * 60 * 1000 // Within 5 minutes
    );

    if (recentFailover) {
      return; // Already handled
    }

    // Find best alternative provider
    const healthyAlternatives = this.getHealthyProviders().filter(
      p => p !== unhealthyProvider && this.providers.get(p)?.enabled
    );

    if (healthyAlternatives.length === 0) {
      console.error(`[CDN] CRITICAL: No healthy alternatives for ${unhealthyProvider}`);
      return;
    }

    const alternativeProvider = healthyAlternatives[0];

    // Create failover event
    const event: FailoverEvent = {
      id: `fo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      fromProvider: unhealthyProvider,
      toProvider: alternativeProvider,
      reason: `Provider ${unhealthyProvider} is ${health.status}: ${health.lastError || 'Unknown error'}`,
      automatic: true,
    };

    this.failoverHistory.push(event);

    // Redistribute traffic
    const unhealthyConfig = this.providers.get(unhealthyProvider)!;
    const alternativeConfig = this.providers.get(alternativeProvider)!;

    // Move weight from unhealthy to alternative
    this.updateProviderConfig(unhealthyProvider, { weight: 0 });
    this.updateProviderConfig(alternativeProvider, {
      weight: alternativeConfig.weight + unhealthyConfig.weight,
    });

    this.calculateTrafficDistribution();

    console.warn(`[CDN] FAILOVER: ${unhealthyProvider} -> ${alternativeProvider} (${event.reason})`);

    // Emit alert (would integrate with notification system here)
    this.emitFailoverAlert(event);
  }

  /**
   * Handle recovery of a previously unhealthy provider
   */
  private handleRecoveredProvider(recoveredProvider: CDNProviderName): void {
    const recentFailover = this.failoverHistory.find(
      f => f.fromProvider === recoveredProvider && !f.resolvedAt
    );

    if (recentFailover) {
      recentFailover.resolvedAt = new Date();
      console.log(`[CDN] RECOVERY: ${recoveredProvider} has recovered`);

      // Restore original weights
      const originalConfig = DEFAULT_PROVIDERS[recoveredProvider];
      const currentAlternative = this.providers.get(recentFailover.toProvider);
      const originalAlternative = DEFAULT_PROVIDERS[recentFailover.toProvider];

      if (currentAlternative && originalAlternative) {
        this.updateProviderConfig(recoveredProvider, { weight: originalConfig.weight });
        this.updateProviderConfig(recentFailover.toProvider, { weight: originalAlternative.weight });
      }

      this.calculateTrafficDistribution();
    }
  }

  /**
   * Get failover history
   */
  getFailoverHistory(limit = 50): FailoverEvent[] {
    return this.failoverHistory.slice(-limit);
  }

  /**
   * Emit failover alert (placeholder for notification integration)
   */
  private emitFailoverAlert(event: FailoverEvent): void {
    // Integration point for PagerDuty, Slack, email, etc.
    console.error(`[CDN] ALERT: Failover Event - ${JSON.stringify({
      id: event.id,
      from: event.fromProvider,
      to: event.toProvider,
      reason: event.reason,
      automatic: event.automatic,
    })}`);

    // In production, you would call your notification service here
    // Example: await notificationService.sendAlert({ ... });
  }

  // ============================================================================
  // Metrics & Monitoring
  // ============================================================================

  /**
   * Collect metrics from all providers
   */
  async collectMetrics(): Promise<CDNMetricsSnapshot> {
    const snapshot: CDNMetricsSnapshot = {
      timestamp: new Date(),
      totalRequests: 0,
      cacheHitRatio: 0,
      avgLatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      errorRate: 0,
      bandwidthUsedGB: 0,
      providerMetrics: {} as Record<CDNProviderName, ProviderMetrics>,
    };

    // Collect from each provider (simplified - would use actual APIs in production)
    for (const [name, config] of this.providers) {
      if (!config.enabled) continue;

      // Placeholder metrics - in production, these would come from provider APIs
      snapshot.providerMetrics[name] = {
        requests: 0,
        hits: 0,
        misses: 0,
        bandwidthBytes: 0,
        avgResponseTimeMs: 0,
        errorCount: 0,
        statusCodes: {},
        topCountries: [],
        topURIs: [],
      };
    }

    this.metricsCache = snapshot;
    return snapshot;
  }

  /**
   * Get cached metrics
   */
  getCachedMetrics(): CDNMetricsSnapshot | null {
    return this.metricsCache;
  }

  /**
   * Get performance summary for dashboard display
   */
  async getPerformanceSummary(): Promise<{
    overallHealth: 'healthy' | 'degraded' | 'critical';
    activeProviders: number;
    totalProviders: number;
    averageLatencyMs: number;
    cacheHitRatioPercent: number;
    uptimePercent: number;
    recentFailovers: number;
    recommendedActions: string[];
  }> {
    const healthValues = Array.from(this.healthStatus.values());
    const healthyCount = healthValues.filter(h => h.status === 'healthy').length;
    const degradedCount = healthValues.filter(h => h.status === 'degraded').length;
    const unhealthyCount = healthValues.filter(h => h.status === 'unhealthy').length;

    let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (unhealthyCount > 0) overallHealth = 'critical';
    else if (degradedCount > 0) overallHealth = 'degraded';

    const recentFailovers = this.failoverHistory.filter(
      f => Date.now() - f.timestamp.getTime() < 24 * 60 * 60 * 1000
    ).length;

    const recommendedActions: string[] = [];
    if (overallHealth === 'critical') {
      recommendedActions.push('Immediate investigation required: One or more CDN providers are down');
    }
    if (recentFailovers > 5) {
      recommendedActions.push('High failover frequency detected: Review provider stability');
    }

    return {
      overallHealth,
      activeProviders: this.getActiveProviders().length,
      totalProviders: this.providers.size,
      averageLatencyMs: 0, // Would be calculated from real metrics
      cacheHitRatioPercent: 0, // Would be calculated from real metrics
      uptimePercent: healthyCount / healthValues.length * 100,
      recentFailovers,
      recommendedActions,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get geographic routing rules
   */
  getGeoRoutingRules(): GeoRoutingRule[] {
    return [...GEO_ROUTING_RULES];
  }

  /**
   * Get POP locations for a given country
   */
  getPOPLocationsForCountry(countryCode: string): string[] {
    const rule = GEO_ROUTING_RULES.find(r =>
      r.countryCode === countryCode.toUpperCase()
    );
    return rule?.preferredPOPs || [];
  }

  /**
   * Generate report of current CDN status
   */
  generateStatusReport(): {
    generatedAt: Date;
    initialized: boolean;
    providers: Array<{
      name: string;
      displayName: string;
      enabled: boolean;
      priority: number;
      weight: number;
      health: CDNHealthStatus;
      responseTimeMs: number;
    }>;
    distribution: Array<{ provider: string; percentage: number; reason: string }>;
    recentFailovers: FailoverEvent[];
  } {
    return {
      generatedAt: new Date(),
      initialized: this.isInitialized,
      providers: Array.from(this.providers.entries()).map(([name, config]) => ({
        name,
        displayName: config.displayName,
        enabled: config.enabled,
        priority: config.priority,
        weight: config.weight,
        health: this.healthStatus.get(name)?.status || 'unknown',
        responseTimeMs: this.healthStatus.get(name)?.responseTimeMs || 0,
      })),
      distribution: Array.from(this.currentDistribution.values()),
      recentFailovers: this.failoverHistory.slice(-10),
    };
  }
}

// ============================================================================
// Singleton Export
// =============================================================================

let cdnInstance: CDNProviders | null = null;

/**
 * Get the singleton CDN providers instance
 */
export function getCDNProviders(customConfigs?: Partial<Record<CDNProviderName, Partial<CDNProviderConfig>>>): CDNProviders {
  if (!cdnInstance) {
    cdnInstance = new CDNProviders(customConfigs);
  }
  return cdnInstance;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetCDNProviders(): void {
  if (cdnInstance) {
    cdnInstance.destroy();
    cdnInstance = null;
  }
}

// ============================================================================
// Default Export
// =============================================================================

export default CDNProviders;

// ============================================================================
// Usage Examples (for documentation purposes)
// =============================================================================

/*
// Initialization
import { getCDNProviders } from '@/lib/cdn/providers';

async function setupCDN() {
  const cdn = getCDNProviders();
  await cdn.initialize();
  
  // Get status
  const status = cdn.generateStatusReport();
  console.log(status);
  
  // Best provider for Algeria
  const algeriaProvider = cdn.getBestProviderForCountry('DZ'); // Returns 'cloudflare'
  
  // Purge product images
  await cdn.purgeByTags(['products', 'images']);
  
  // Get performance summary
  const summary = await cdn.getPerformanceSummary();
  console.log(summary);
}
*/
