/**
 * CDN Configuration Manager for AlgeriaTrade.dz
 * 
 * Manages multi-CDN strategy across Cloudflare, Fastly, and CloudFront
 * Optimized for MENA region delivery
 * 
 * Features:
 * - Asset optimization pipeline
 * - Image transformation rules (WebP, AVIF, resize)
 * - Cache policy configuration per content type
 * - Purge/invalidation management
 * - Multi-CDN fallback strategy
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export type CDNProvider = 'cloudflare' | 'fastly' | 'cloudfront' | 'akamai';

export interface CDNConfig {
  provider: CDNProvider;
  enabled: boolean;
  priority: number;           // Lower = higher priority for failover
  weight: number;             // Traffic percentage (0-100)
  endpoints: {
    api: string;
    purge: string;
    stats: string;
  };
  credentials?: {
    apiKey?: string;
    apiSecret?: string;
    zoneId?: string;
    distributionId?: string;
    serviceId?: string;
  };
  features: {
    imageOptimization: boolean;
    edgeCaching: boolean;
    ddosProtection: boolean;
    botManagement: boolean;
    analytics: boolean;
  };
}

export interface ImageTransformRule {
  id: string;
  name: string;
  pattern: RegExp;
  transformations: ImageTransformation[];
  priority: number;
  enabled: boolean;
}

export interface ImageTransformation {
  type: 'format' | 'resize' | 'quality' | 'crop' | 'rotate' | 'blur';
  params: Record<string, number | string | boolean>;
}

export interface CacheRule {
  id: string;
  name: string;
  pattern: RegExp | string;     // URL pattern to match
  cachePolicy: CachePolicyConfig;
  priority: number;
  enabled: boolean;
  tags?: string[];
}

export interface CachePolicyConfig {
  ttl: number;                  // Time-to-live in seconds
  staleWhileRevalidate: number;
  staleIfError: number;
  mustRevalidate: boolean;
  bypassCache?: boolean;
  varyOnHeaders?: string[];
  edgeTTL?: number;
  browserTTL?: number;
  respectStrongETag?: boolean;
  ignoreQueryString?: boolean;
  queryStringWhitelist?: string[];
  queryStringBlacklist?: string[];
}

export interface PurgeRequest {
  id: string;
  type: 'url' | 'tag' | 'prefix' | 'hostname' | 'all';
  target: string[];             // URLs or tags to purge
  requestedAt: Date;
  requestedBy: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedAt?: Date;
  results?: PurgeResult[];
}

export interface PurgeResult {
  provider: CDNProvider;
  success: boolean;
  purgedUrls?: number;
  error?: string;
  durationMs: number;
}

export interface CDNStats {
  timestamp: Date;
  provider: CDNProvider;
  requests: {
    total: number;
    cached: number;
    uncached: number;
    hits: number;
    misses: number;
    dynamic: number;
  };
  bandwidth: {
    totalBytes: number;
    cachedBytes: number;
    uncachedBytes: number;
  };
  errors: {
    total: number;
    clientErrors: number;
    serverErrors: number;
    rateLimited: number;
  };
  latency: {
    avgMs: number;
    p50: number;
    p95: number;
    p99: number;
  };
  regions: RegionalStats[];
}

export interface RegionalStats {
  region: string;
  countryCode: string;
  requests: number;
  hitRate: number;
  avgLatencyMs: number;
  bandwidthBytes: number;
}

export interface FallbackDecision {
  primaryProvider: CDNProvider;
  fallbackProviders: CDNProvider[];
  reason: string;
  healthScores: Record<CDNProvider, number>;
}

// ============================================================================
// Constants & Configuration
// ============================================================================

// Default CDN configurations for AlgeriaTrade.dz
export const DEFAULT_CDN_CONFIGS: Record<CDNProvider, CDNConfig> = {
  cloudflare: {
    provider: 'cloudflare',
    enabled: true,
    priority: 1,
    weight: 60,
    endpoints: {
      api: 'https://api.cloudflare.com/client/v4',
      purge: 'https://api.cloudflare.com/client/v4/zones/{zoneId}/purge_cache',
      stats: 'https://api.cloudflare.com/client/v4/zones/{zoneId}/analytics/dashboard',
    },
    features: {
      imageOptimization: true,
      edgeCaching: true,
      ddosProtection: true,
      botManagement: true,
      analytics: true,
    },
  },
  fastly: {
    provider: 'fastly',
    enabled: true,
    priority: 2,
    weight: 25,
    endpoints: {
      api: 'https://api.fastly.com',
      purge: 'https://api.fastly.com/purge',
      stats: 'https://api.fastly.com/stats/service/{serviceId}',
    },
    features: {
      imageOptimization: true,
      edgeCaching: true,
      ddosProtection: true,
      botManagement: false,
      analytics: true,
    },
  },
  cloudfront: {
    provider: 'cloudfront',
    enabled: true,
    priority: 3,
    weight: 15,
    endpoints: {
      api: 'https://cloudfront.amazonaws.com',
      purge: 'https://cloudfront.amazonaws.com/2020-05-26/distribution/{distributionId}/invalidation',
      stats: 'https://cloudfront.amazonaws.com/2020-05-26/distribution/{distributionId}/statistics',
    },
    features: {
      imageOptimization: false,   // Use Lambda@Edge or separate image service
      edgeCaching: true,
      ddosProtection: true,
      botManagement: false,
      analytics: true,
    },
  },
  akamai: {
    provider: 'akamai',
    enabled: false,               // Disabled by default (enterprise tier)
    priority: 4,
    weight: 0,
    endpoints: {
      api: 'https://{hostname}.purge.akamaiapis.net',
      purge: 'https://{hostname}.purge.akamapis.net/ccu/v3/delete',
      stats: 'https://{hostname}.p.akamaiedge.net/report-api/v1/reports',
    },
    features: {
      imageOptimization: true,
      edgeCaching: true,
      ddosProtection: true,
      botManagement: true,
      analytics: true,
    },
  },
};

// Default image transformation rules optimized for MENA bandwidth
export const IMAGE_TRANSFORM_RULES: ImageTransformRule[] = [
  {
    id: 'product-images',
    name: 'Product Images Optimization',
    pattern: /\/products\/.*\.(jpg|jpeg|png|gif|webp)$/i,
    transformations: [
      { type: 'format', params: { format: 'webp', fallback: 'jpg', quality: 85 } },
      { type: 'resize', params: { width: 800, height: 600, fit: 'contain' } },
      { type: 'quality', params: { quality: 80, method: 'auto' } },
    ],
    priority: 1,
    enabled: true,
  },
  {
    id: 'thumbnail-images',
    name: 'Thumbnail Generation',
    pattern: /\/(products|companies)\/.*\/thumb\.(jpg|jpeg|png|webp)$/i,
    transformations: [
      { type: 'format', params: { format: 'webp', quality: 75 } },
      { type: 'resize', params: { width: 200, height: 150, fit: 'cover' } },
      { type: 'quality', params: { quality: 70 } },
    ],
    priority: 2,
    enabled: true,
  },
  {
    id: 'gallery-images',
    name: 'Gallery/Showcase Images',
    pattern: /\/gallery|showcase\/.*\.(jpg|jpeg|png|webp)$/i,
    transformations: [
      { type: 'format', params: { format: 'avif', fallback: 'webp', quality: 82 } },
      { type: 'resize', params: { width: 1200, height: 900, fit: 'contain' } },
    ],
    priority: 3,
    enabled: true,
  },
  {
    id: 'avatar-images',
    name: 'User Avatar Optimization',
    pattern: /\/avatars\/.*\.(jpg|jpeg|png|webp)$/i,
    transformations: [
      { type: 'format', params: { format: 'webp', quality: 70 } },
      { type: 'resize', params: { width: 100, height: 100, fit: 'cover' } },
      { type: 'crop', params: { gravity: 'center' } },
    ],
    priority: 4,
    enabled: true,
  },
  {
    id: 'banner-images',
    name: 'Banner/Hero Images',
    pattern: /\/banners?|hero\/.*\.(jpg|jpeg|png|webp)$/i,
    transformations: [
      { type: 'format', params: { format: 'webp', quality: 78 } },
      { type: 'resize', params: { width: 1920, height: 640, fit: 'cover' } },
    ],
    priority: 5,
    enabled: true,
  },
];

// Default cache rules for different content types
export const CACHE_RULES: CacheRule[] = [
  // Static assets - aggressive caching
  {
    id: 'static-assets-js-css',
    name: 'JavaScript & CSS Files',
    pattern: '\\.(js|css)$',
    cachePolicy: {
      ttl: 31536000,            // 1 year (cache-busted via filename hash)
      staleWhileRevalidate: 86400,
      staleIfError: 604800,
      mustRevalidate: false,
      varyOnHeaders: ['Accept-Encoding'],
      edgeTTL: 86400,
      browserTTL: 31536000,
      ignoreQueryString: true,
    },
    priority: 1,
    enabled: true,
    tags: ['static', 'assets'],
  },
  // Font files
  {
    id: 'static-assets-fonts',
    name: 'Font Files',
    pattern: '\\.(woff2?|ttf|eot|otf)$',
    cachePolicy: {
      ttl: 31536000,
      staleWhileRevalidate: 604800,
      staleIfError: 2592000,
      mustRevalidate: false,
      varyOnHeaders: ['Origin'],
      edgeTTL: 604800,
      browserTTL: 31536000,
      ignoreQueryString: true,
    },
    priority: 2,
    enabled: true,
    tags: ['static', 'fonts'],
  },
  // Images
  {
    id: 'images-general',
    name: 'General Images',
    pattern: '\\.(jpg|jpeg|png|gif|webp|avif|bmp|ico|svg)$',
    cachePolicy: {
      ttl: 2592000,             // 30 days
      staleWhileRevalidate: 3600,
      staleIfError: 86400,
      mustRevalidate: false,
      varyOnHeaders: ['Accept-Encoding', 'Accept'],
      edgeTTL: 172800,
      browserTTL: 2592000,
      ignoreQueryString: true,
    },
    priority: 3,
    enabled: true,
    tags: ['static', 'images'],
  },
  // API responses - short cache
  {
    id: 'api-responses',
    name: 'API Responses',
    pattern: '^/api/',
    cachePolicy: {
      ttl: 60,                  // 1 minute
      staleWhileRevalidate: 30,
      staleIfError: 300,
      mustRevalidate: true,
      varyOnHeaders: ['Authorization', 'Accept-Language', 'Cookie'],
      edgeTTL: 45,
      browserTTL: 0,
      ignoreQueryString: false,
      queryStringBlacklist: ['_', 'timestamp', 'nonce'],
    },
    priority: 10,
    enabled: true,
    tags: ['dynamic', 'api'],
  },
  // HTML pages - ISR style
  {
    id: 'html-pages',
    name: 'HTML Pages (ISR)',
    pattern: '\\.html$|^/$|^/[a-z]',
    cachePolicy: {
      ttl: 300,                 // 5 minutes
      staleWhileRevalidate: 60,
      staleIfError: 600,
      mustRevalidate: true,
      varyOnHeaders: ['Accept-Encoding', 'Accept-Language', 'Cookie'],
      edgeTTL: 180,
      browserTTL: 120,
      ignoreQueryString: true,
    },
    priority: 15,
    enabled: true,
    tags: ['dynamic', 'html'],
  },
  // Personalized pages - no cache
  {
    id: 'personalized-content',
    name: 'Personalized Content',
    pattern: '/account|/dashboard|/profile|/cart|/checkout',
    cachePolicy: {
      ttl: 0,
      staleWhileRevalidate: 0,
      staleIfError: 0,
      mustRevalidate: true,
      bypassCache: true,
      varyOnHeaders: ['Cookie', 'Authorization'],
      edgeTTL: 0,
      browserTTL: 0,
    },
    priority: 20,
    enabled: true,
    tags: ['personalized', 'dynamic'],
  },
];

// Health check thresholds
const HEALTH_CHECK_THRESHOLDS = {
  maxErrorRate: 0.05,          // 5% error rate threshold
  maxLatencyP95: 2000,         // 2 seconds P95 latency threshold
  minAvailability: 99.9,       // 99.9% availability threshold
  minHitRate: 0.7,             // 70% minimum cache hit rate
};

// ============================================================================
// CDN Manager Class
// ============================================================================

export class CDNManager {
  private static instance: CDNManager;
  private configs: Map<CDNProvider, CDNConfig> = new Map();
  private healthScores: Map<CDNProvider, number> = new Map();
  private lastHealthCheck: Date | null = null;
  private purgeHistory: PurgeRequest[] = [];
  private statsHistory: CDNStats[] = [];

  static getInstance(): CDNManager {
    if (!CDNManager.instance) {
      CDNManager.instance = new CDNManager();
    }
    return CDNManager.instance;
  }

  constructor() {
    // Initialize with default configs
    Object.entries(DEFAULT_CDN_CONFIGS).forEach(([provider, config]) => {
      this.configs.set(provider as CDNProvider, config);
      this.healthScores.set(provider as CDNProvider, 100); // Start healthy
    });
  }

  // ==========================================================================
  // Configuration Management
  // ==========================================================================

  /**
   * Get configuration for a specific provider
   */
  getConfig(provider: CDNProvider): CDNConfig | undefined {
    return this.configs.get(provider);
  }

  /**
   * Update configuration for a provider
   */
  updateConfig(provider: CDNProvider, updates: Partial<CDNConfig>): void {
    const current = this.configs.get(provider);
    if (current) {
      this.configs.set(provider, { ...current, ...updates });
    }
  }

  /**
   * Get all enabled providers sorted by priority
   */
  getEnabledProviders(): CDNProvider[] {
    return Array.from(this.configs.entries())
      .filter(([, config]) => config.enabled)
      .sort((a, b) => a[1].priority - b[1].priority)
      .map(([provider]) => provider);
  }

  /**
   * Get traffic weights for load balancing
   */
  getTrafficWeights(): Record<CDNProvider, number> {
    const weights: Partial<Record<CDNProvider, number>> = {};
    
    for (const [provider, config] of this.configs.entries()) {
      if (config.enabled && this.isHealthy(provider)) {
        weights[provider] = config.weight;
      }
    }

    return weights as Record<CDNProvider, number>;
  }

  // ==========================================================================
  // Multi-CDN Fallback Strategy
  // ==========================================================================

  /**
   * Determine which CDN(s) to use based on health and performance
   */
  selectProvider(requestContext?: {
    ip?: string;
    path?: string;
    userAgent?: string;
  }): FallbackDecision {
    const enabledProviders = this.getEnabledProviders();
    const healthEntries = Array.from(this.healthScores.entries());

    // Sort providers by health score (descending), then by priority
    const rankedProviders = enabledProviders.sort((a, b) => {
      const healthA = this.healthScores.get(a) || 0;
      const healthB = this.healthScores.get(b) || 0;
      if (healthB !== healthA) return healthB - healthA;
      return (this.configs.get(a)?.priority || 999) - (this.configs.get(b)?.priority || 999);
    });

    const primaryProvider = rankedProviders[0];
    const fallbackProviders = rankedProviders.slice(1);

    // Build health scores object
    const healthScores: Record<CDNProvider, number> = {};
    for (const [provider, score] of healthEntries) {
      healthScores[provider] = score;
    }

    let reason = `Primary: ${primaryProvider} (Health: ${this.healthScores.get(primaryProvider)}%)`;
    
    // Check if primary is degraded
    const primaryHealth = this.healthScores.get(primaryProvider) || 0;
    if (primaryHealth < 80) {
      reason = `${primaryProvider} degraded (${primaryHealth}%), using ${fallbackProviders[0]} as backup`;
    }

    return {
      primaryProvider,
      fallbackProviders,
      reason,
      healthScores,
    };
  }

  /**
   * Check if a provider is considered healthy
   */
  isHealthy(provider: CDNProvider): boolean {
    const score = this.healthScores.get(provider) ?? 0;
    return score >= HEALTH_CHECK_THRESHOLDS.minAvailability;
  }

  /**
   * Perform health checks on all providers
   */
  async performHealthChecks(): Promise<void> {
    const now = new Date();

    for (const [provider, config] of this.configs.entries()) {
      if (!config.enabled) continue;

      try {
        const stats = await this.fetchStats(provider);
        
        // Calculate health score based on multiple factors
        const errorRate = stats.errors.total / Math.max(stats.requests.total, 1);
        const availability = 100 - (errorRate * 100);
        const latencyScore = Math.max(0, 100 - ((stats.latency.p95 - 500) / 20));
        const hitRateScore = (stats.requests.hits / Math.max(stats.requests.cached, 1)) * 100;

        // Weighted average of all factors
        const healthScore = (
          availability * 0.4 +
          latencyScore * 0.35 +
          hitRateScore * 0.25
        );

        this.healthScores.set(provider, Math.min(100, Math.max(0, healthScore)));

        // Store stats in history
        this.statsHistory.push({ ...stats, timestamp: now, provider });
        
        // Keep only last 24 hours of history
        const oneDayAgo = new Date(now.getTime() - 86400000);
        this.statsHistory = this.statsHistory.filter(s => s.timestamp >= oneDayAgo);

      } catch (error) {
        console.error(`Health check failed for ${provider}:`, error);
        // Degrade health score on failure
        const currentScore = this.healthScores.get(provider) || 100;
        this.healthScores.set(provider, Math.max(0, currentScore - 20));
      }
    }

    this.lastHealthCheck = now;
  }

  // ==========================================================================
  // Image Transformation
  // ==========================================================================

  /**
   * Apply image transformation rules to a URL
   */
  transformImageUrl(originalUrl: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
    fit?: 'contain' | 'cover' | 'fill' | 'crop';
  }): string {
    // Find matching rule
    const matchingRule = IMAGE_TRANSFORM_RULES.find(
      rule => rule.enabled && rule.pattern.test(originalUrl)
    );

    if (!matchingRule && !options) {
      return originalUrl;
    }

    // Build transformation parameters
    const params: Record<string, string> = {};

    if (options?.width) params.width = String(options.width);
    if (options?.height) params.height = String(options.height);
    if (options?.quality) params.quality = String(options.quality);
    if (options?.format) params.format = options.format;
    if (options?.fit) params.fit = options.fit;

    // Merge with rule transformations
    if (matchingRule) {
      for (const transform of matchingRule.transformations) {
        switch (transform.type) {
          case 'format':
            if (!params.format && transform.params.format) {
              params.format = transform.params.format as string;
            }
            break;
          case 'resize':
            if (!params.width && transform.params.width) {
              params.width = String(transform.params.width);
            }
            if (!params.height && transform.params.height) {
              params.height = String(transform.params.height);
            }
            break;
          case 'quality':
            if (!params.quality && transform.params.quality) {
              params.quality = String(transform.params.quality);
            }
            break;
        }
      }
    }

    // Generate transformed URL based on active CDN
    const activeProvider = this.selectProvider().primaryProvider;
    return this.buildTransformedUrl(activeProvider, originalUrl, params);
  }

  /**
   * Build transformed URL for each CDN provider
   */
  private buildTransformedUrl(
    provider: CDNProvider,
    originalUrl: string,
    params: Record<string, string>
  ): string {
    const searchParams = new URLSearchParams(params);

    switch (provider) {
      case 'cloudflare':
        // Cloudflare Image Resizing: /cdn-cgi/image/<params>/<url>
        return `/cdn-cgi/image/${searchParams.toString().replace(/&/g, ',')}/${encodeURIComponent(originalUrl)}`;
      
      case 'fastly':
        // Fastly IO: https://<host>/io?<params>&url=<url>
        searchParams.set('url', originalUrl);
        return `https://io.fastly.com?${searchParams.toString()}`;
      
      case 'cloudfront':
        // CloudFront requires Lambda@Edge or separate image service
        searchParams.set('src', originalUrl);
        return `/_image?${searchParams.toString()}`;
      
      default:
        return originalUrl;
    }
  }

  /**
   * Generate responsive srcset for an image
   */
  generateSrcSet(
    originalUrl: string,
    widths: number[] = [320, 480, 640, 768, 1024, 1280, 1536]
  ): string {
    return widths
      .map(width => `${this.transformImageUrl(originalUrl, { width })} ${width}w`)
      .join(', ');
  }

  /**
   * Get optimal image format for user agent
   */
  getOptimalFormat(userAgent: string): 'avif' | 'webp' | 'jpg' {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('chrome') && !ua.includes('opera')) {
      const chromeVersion = parseInt(ua.match(/chrome\/(\d+)/)?.[1] || '0');
      if (chromeVersion >= 121) return 'avif'; // AVIF support from Chrome 121
      return 'webp';
    }
    
    if (ua.includes('firefox')) {
      const firefoxVersion = parseInt(ua.match(/firefox\/(\d+)/)?.[1] || '0');
      if (firefoxVersion >= 113) return 'avif'; // AVIF support from Firefox 113
      return 'webp';
    }
    
    if (ua.includes('safari') || ua.includes('mac os x')) {
      const safariVersion = parseInt(ua.match(/version\/(\d+)/)?.[1] || '0');
      if (safariVersion >= 16.4) return 'avif'; // AVIF support from Safari 16.4
      return 'webp';
    }
    
    if (ua.includes('edge') || ua.includes('edg/')) {
      return 'avif'; // Edge supports AVIF
    }

    return 'jpg'; // Fallback for older browsers
  }

  // ==========================================================================
  // Cache Policy Management
  // ==========================================================================

  /**
   * Get cache policy for a URL
   */
  getCachePolicy(url: string): CachePolicyConfig | null {
    // Find matching rule (highest priority first)
    const sortedRules = [...CACHE_RULES].sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (!rule.enabled) continue;

      if (rule.pattern instanceof RegExp) {
        if (rule.pattern.test(url)) {
          return rule.cachePolicy;
        }
      } else {
        // String pattern
        if (url.includes(rule.pattern)) {
          return rule.cachePolicy;
        }
      }
    }

    return null;
  }

  /**
   * Build Cache-Control header value from policy
   */
  buildCacheControlHeader(policy: CachePolicyConfig): string {
    const parts: string[] = [];

    if (policy.bypassCache) {
      return 'no-store, no-cache, must-revalidate, proxy-revalidate';
    }

    if (policy.mustRevalidate) {
      parts.push('must-revalidate');
    }

    if (policy.ttl > 0) {
      parts.push(`max-age=${policy.ttl}`);
    } else {
      parts.push('no-cache');
    }

    if (policy.staleWhileRevalidate > 0) {
      parts.push(`stale-while-revalidate=${policy.staleWhileRevalidate}`);
    }

    if (policy.staleIfError > 0) {
      parts.push(`stale-if-error=${policy.staleIfError}`);
    }

    parts.push('public');

    return parts.join(', ');
  }

  /**
   * Get CDN-Cache-Control header (edge TTL)
   */
  buildEdgeCacheControlHeader(policy: CachePolicyConfig): string {
    const sMaxAge = policy.edgeTTL ?? policy.ttl;
    const parts = [`public`, `s-maxage=${sMaxAge}`];

    if (policy.staleWhileRevalidate > 0) {
      parts.push(`stale-while-revalidate=${policy.staleWhileRevalidate}`);
    }

    if (policy.staleIfError > 0) {
      parts.push(`stale-if-error=${policy.staleIfError}`);
    }

    return parts.join(', ');
  }

  // ==========================================================================
  // Cache Purge/Invalidation
  // ==========================================================================

  /**
   * Request cache purge across all CDNs
   */
  async purgeCache(request: Omit<PurgeRequest, 'id' | 'status' | 'requestedAt' | 'results'>): Promise<PurgeRequest> {
    const purgeRequest: PurgeRequest = {
      ...request,
      id: `purge-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      status: 'pending',
      requestedAt: new Date(),
    };

    this.purgeHistory.push(purgeRequest);

    try {
      purgeRequest.status = 'processing';
      
      const providers = this.getEnabledProviders();
      const results: PurgeResult[] = await Promise.all(
        providers.map(provider => this.purgeFromProvider(provider, request))
      );

      purgeRequest.results = results;
      purgeRequest.status = results.every(r => r.success) ? 'completed' : 'failed';
      purgeRequest.completedAt = new Date();

    } catch (error) {
      console.error('Purge failed:', error);
      purgeRequest.status = 'failed';
      purgeRequest.completedAt = new Date();
    }

    return purgeRequest;
  }

  /**
   * Execute purge on a specific CDN provider
   */
  private async purgeFromProvider(
    provider: CDNProvider,
    request: Omit<PurgeRequest, 'id' | 'status' | 'requestedAt' | 'results'>
  ): Promise<PurgeResult> {
    const startTime = performance.now();
    const config = this.configs.get(provider);

    if (!config) {
      return {
        provider,
        success: false,
        error: 'Provider not configured',
        durationMs: Math.round(performance.now() - startTime),
      };
    }

    try {
      // In production, make actual API calls to each CDN
      // For demo, simulate the response
      
      const result: PurgeResult = {
        provider,
        success: true,
        purgedUrls: request.target.length,
        durationMs: Math.round(performance.now() - startTime),
      };

      // Simulate occasional failures for realism
      if (Math.random() < 0.05) { // 5% simulated failure rate
        result.success = false;
        result.error = 'Simulated API timeout';
      }

      return result;

    } catch (error) {
      return {
        provider,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Math.round(performance.now() - startTime),
      };
    }
  }

  /**
   * Get purge history
   */
  getPurgeHistory(limit: number = 50): PurgeRequest[] {
    return [...this.purgeHistory]
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
      .slice(0, limit);
  }

  // ==========================================================================
  // Statistics & Monitoring
  // ==========================================================================

  /**
   * Fetch statistics from a CDN provider
   */
  async fetchStats(provider: CDNProvider, period: 'hour' | 'day' | 'week' = 'hour'): Promise<CDNStats> {
    const config = this.configs.get(provider);
    
    if (!config) {
      throw new Error(`Provider ${provider} not configured`);
    }

    // In production, fetch actual data from CDN APIs
    // For demo, generate realistic mock data
    
    return this.generateMockStats(provider, period);
  }

  /**
   * Generate mock statistics for demonstration
   */
  private generateMockStats(provider: CDNProvider, _period: string): CDNStats {
    const baseRequests = {
      cloudflare: 500000,
      fastly: 200000,
      cloudfront: 100000,
      akamai: 50000,
    };

    const total = baseRequests[provider] + Math.round(Math.random() * baseRequests[provider] * 0.2);
    const hitRate = 0.85 + Math.random() * 0.12; // 85-97%
    const cached = Math.round(total * hitRate);
    const uncached = total - cached;
    const hits = Math.round(cached * 0.98);
    const misses = cached - hits;

    return {
      timestamp: new Date(),
      provider,
      requests: {
        total,
        cached,
        uncached,
        hits,
        misses,
        dynamic: Math.round(total * 0.15),
      },
      bandwidth: {
        totalBytes: total * 50000 + Math.round(Math.random() * 10000000000),
        cachedBytes: cached * 45000,
        uncachedBytes: uncached * 55000,
      },
      errors: {
        total: Math.round(total * 0.002),
        clientErrors: Math.round(total * 0.001),
        serverErrors: Math.round(total * 0.0005),
        rateLimited: Math.round(total * 0.0005),
      },
      latency: {
        avgMs: 45 + Math.round(Math.random() * 100),
        p50: 30 + Math.round(Math.random() * 40),
        p95: 100 + Math.round(Math.random() * 300),
        p99: 200 + Math.round(Math.random() * 500),
      },
      regions: this.generateRegionalStats(),
    };
  }

  /**
   * Generate regional statistics for MENA focus
   */
  private generateRegionalStats(): RegionalStats[] {
    return [
      {
        region: 'Algiers',
        countryCode: 'DZ',
        requests: 250000 + Math.round(Math.random() * 50000),
        hitRate: 0.92 + Math.random() * 0.06,
        avgLatencyMs: 12 + Math.round(Math.random() * 18),
        bandwidthBytes: 12500000000 + Math.round(Math.random() * 2500000000),
      },
      {
        region: 'Oran',
        countryCode: 'DZ',
        requests: 85000 + Math.round(Math.random() * 15000),
        hitRate: 0.88 + Math.random() * 0.08,
        avgLatencyMs: 22 + Math.round(Math.random() * 28),
        bandwidthBytes: 4250000000 + Math.round(Math.random() * 750000000),
      },
      {
        region: 'Constantine',
        countryCode: 'DZ',
        requests: 65000 + Math.round(Math.random() * 10000),
        hitRate: 0.86 + Math.random() * 0.09,
        avgLatencyMs: 32 + Math.round(Math.random() * 33),
        bandwidthBytes: 3250000000 + Math.round(Math.random() * 500000000),
      },
      {
        region: 'Paris',
        countryCode: 'FR',
        requests: 45000 + Math.round(Math.random() * 10000),
        hitRate: 0.94 + Math.random() * 0.04,
        avgLatencyMs: 28 + Math.round(Math.random() * 22),
        bandwidthBytes: 2250000000 + Math.round(Math.random() * 500000000),
      },
      {
        region: 'Tunis',
        countryCode: 'TN',
        requests: 35000 + Math.round(Math.random() * 8000),
        hitRate: 0.84 + Math.random() * 0.1,
        avgLatencyMs: 48 + Math.round(Math.random() * 42),
        bandwidthBytes: 1750000000 + Math.round(Math.random() * 400000000),
      },
      {
        region: 'Casablanca',
        countryCode: 'MA',
        requests: 28000 + Math.round(Math.random() * 7000),
        hitRate: 0.83 + Math.random() * 0.11,
        avgLatencyMs: 68 + Math.round(Math.random() * 52),
        bandwidthBytes: 1400000000 + Math.round(Math.random() * 350000000),
      },
    ];
  }

  /**
   * Get aggregated statistics across all providers
   */
  async getAggregatedStats(period: 'hour' | 'day' | 'week' = 'hour'): Promise<{
    totalRequests: number;
    totalBandwidth: number;
    overallHitRate: number;
    avgLatency: number;
    providers: CDNStats[];
    savings: {
      bandwidthSaved: number;
      costSavings: number;
      co2Reduction: number; // kg CO2
    };
  }> {
    const providers = this.getEnabledProviders();
    const statsArray = await Promise.all(
      providers.map(p => this.fetchStats(p, period))
    );

    const totalRequests = statsArray.reduce((sum, s) => sum + s.requests.total, 0);
    const totalHits = statsArray.reduce((sum, s) => sum + s.requests.hits, 0);
    const totalCached = statsArray.reduce((sum, s) => sum + s.requests.cached, 0);
    const totalBandwidth = statsArray.reduce((sum, s) => sum + s.bandwidth.totalBytes, 0);
    const cachedBandwidth = statsArray.reduce((sum, s) => sum + s.bandwidth.cachedBytes, 0);

    // Calculate weighted average latency
    const weightedLatencySum = statsArray.reduce((sum, s) => {
      return sum + s.latency.avgMs * s.requests.total;
    }, 0);
    const avgLatency = totalRequests > 0 ? Math.round(weightedLatencySum / totalRequests) : 0;

    // Calculate savings
    const bandwidthSaved = cachedBandwidth * 0.55; // Assume 55% savings from origin
    const costSavings = bandwidthSaved * 0.00001; // ~$0.01 per GB saved
    const co2Reduction = bandwidthSaved * 0.00000007; // ~70g CO2 per GB transferred

    return {
      totalRequests,
      totalBandwidth,
      overallHitRate: totalCached > 0 ? totalHits / totalCached : 0,
      avgLatency,
      providers: statsArray,
      savings: {
        bandwidthSaved,
        costSavings,
        co2Reduction,
      },
    };
  }

  /**
   * Get health scores for all providers
   */
  getHealthScores(): Record<CDNProvider, number> {
    return Object.fromEntries(this.healthScores.entries()) as Record<CDNProvider, number>;
  }

  /**
   * Get last health check time
   */
  getLastHealthCheck(): Date | null {
    return this.lastHealthCheck;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Format bytes to human-readable string
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format percentage
   */
  static formatPercent(value: number, decimals: number = 1): string {
    return (value * 100).toFixed(decimals) + '%';
  }

  /**
   * Reset manager state (for testing)
   */
  reset(): void {
    this.healthScores.clear();
    this.purgeHistory = [];
    this.statsHistory = [];
    this.lastHealthCheck = null;
    
    Object.keys(DEFAULT_CDN_CONFIGS).forEach(provider => {
      this.healthScores.set(provider as CDNProvider, 100);
    });
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const cdnManager = CDNManager.getInstance();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Determine best CDN endpoint for a given region
 */
export function getBestEndpointForRegion(countryCode: string): string {
  const algerianEndpoints = [
    'https://cdn.algierstrade.dz',
    'https://cdn-algiers.algierstrade.dz',
    'https://d123456.cloudfront.net',
  ];

  const frenchEndpoints = [
    'https://eu-cdn.algierstrade.dz',
    'https://cdn-paris.algierstrade.dz',
  ];

  const menaEndpoints = [
    'https://mena-cdn.algierstrade.dz',
    'https://cdn-dubai.algierstrade.dz',
  ];

  switch (countryCode.toUpperCase()) {
    case 'DZ':
      return algerianEndpoints[Math.floor(Math.random() * algerianEndpoints.length)];
    case 'FR':
    case 'ES':
    case 'IT':
      return frenchEndpoints[Math.floor(Math.random() * frenchEndpoints.length)];
    case 'TN':
    case 'MA':
    case 'EG':
    case 'AE':
    case 'SA':
      return menaEndpoints[Math.floor(Math.random() * menaEndpoints.length)];
    default:
      return 'https://global-cdn.algierstrade.dz';
  }
}

/**
 * Build CDN URL with appropriate optimizations
 */
export function buildCDNUrl(path: string, options?: {
  version?: string;
  format?: string;
}): string {
  const baseUrl = process.env.CDN_URL || 'https://cdn.algierstrade.dz';
  
  let url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  
  // Add cache-busting query param for static assets
  if (options?.version) {
    url += `?v=${options.version}`;
  }
  
  return url;
}
