/**
 * Edge Computing Framework for AlgeriaTrade.dz
 * Optimized for MENA region with focus on Algerian users
 * 
 * Features:
 * - Geographic-based routing (Algeria, Tunisia, Morocco, France)
 * - A/B testing at edge level
 * - IP geolocation service
 * - Bot detection and rate limiting at edge
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isEU: boolean;
  isMENA: boolean;
}

export interface EdgeRequestContext {
  ip: string;
  userAgent: string;
  geo: GeoLocation | null;
  isBot: boolean;
  botType?: BotType;
  requestPath: string;
  method: string;
  headers: Record<string, string>;
  timestamp: number;
  abTestVariant?: string;
  requestId: string;
}

export type BotType = 
  | 'good_bot'    // Googlebot, Bingbot, etc.
  | 'bad_bot'     // Scrapers, spammers
  | 'crawler'     // Generic web crawler
  | 'unknown';

export type RegionCode = 
  | 'DZ'  // Algeria
  | 'TN'  // Tunisia
  | 'MA'  // Morocco
  | 'FR'  // France
  | 'OTHER';

export interface RoutingDecision {
  region: RegionCode;
  origin: string;           // Origin server to route to
  cachePolicy: CachePolicy;
  transformRules: TransformRule[];
  headersToAdd: Record<string, string>;
  shouldBlock: boolean;
  blockReason?: string;
}

export interface CachePolicy {
  ttl: number;              // Time-to-live in seconds
  staleWhileRevalidate: number;
  staleIfError: number;
  mustRevalidate: boolean;
  varyOn: string[];         // Headers to vary on
  edgeTTL?: number;         // Edge-specific TTL override
}

export interface TransformRule {
  type: 'image' | 'html' | 'redirect' | 'header';
  pattern: RegExp;
  action: string;
  priority: number;
}

export interface ABTestConfig {
  id: string;
  name: string;
  trafficPercentage: number;  // 0-100
  variants: {
    name: string;
    weight: number;          // 0-100
    config: Record<string, unknown>;
  }[];
  targeting?: {
    countries?: RegionCode[];
    userAgents?: string[];
    paths?: string[];
  };
  startDate: Date;
  endDate?: Date;
}

export interface RateLimitConfig {
  windowMs: number;          // Time window in milliseconds
  maxRequests: number;       // Max requests per window
  keyGenerator?: (ctx: EdgeRequestContext) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  byCountry?: Partial<Record<RegionCode, { windowMs: number; maxRequests: number }>>;
}

export interface EdgeFunctionResult {
  status: number;
  headers: Record<string, string>;
  body?: string | Buffer;
  shouldProxy: boolean;
  proxyTarget?: string;
  cacheKey?: string;
}

// ============================================================================
// Constants & Configuration
// ============================================================================

// MENA-focused CDN PoP locations with latency estimates from major Algerian cities
export const EDGE_LOCATIONS = {
  // Primary - Algeria (lowest latency for core users)
  algiers: {
    code: 'DZ-ALG',
    city: 'Algiers',
    country: 'Algeria',
    provider: 'Cloudflare',
    coordinates: { lat: 36.7538, lng: 3.0588 },
    estimatedLatency: {
      algiers: 5,
      oran: 12,
      constantine: 18,
      blida: 8,
      batna: 35,
      setif: 40,
      annaba: 55,
      bejaia: 45,
      tlemcen: 60,
      ouargla: 80,
    },
  },
  // Secondary - Regional hubs
  paris: {
    code: 'FR-PAR',
    city: 'Paris',
    country: 'France',
    provider: 'Cloudflare',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    estimatedLatency: {
      algiers: 25,
      oran: 38,
      constantine: 42,
    },
  },
  marseille: {
    code: 'FR-MRS',
    city: 'Marseille',
    country: 'France',
    provider: 'Fastly',
    coordinates: { lat: 43.2965, lng: 5.3698 },
    estimatedLatency: {
      algiers: 22,
      oran: 28,
      constantine: 40,
    },
  },
  tunis: {
    code: 'TN-TUN',
    city: 'Tunis',
    country: 'Tunisia',
    provider: 'Cloudflare',
    coordinates: { lat: 36.8065, lng: 10.1815 },
    estimatedLatency: {
      algiers: 45,
      oran: 85,
      constantine: 120,
    },
  },
  casablanca: {
    code: 'MA-CAS',
    city: 'Casablanca',
    country: 'Morocco',
    provider: 'CloudFront',
    coordinates: { lat: 33.5731, lng: -7.5898 },
    estimatedLatency: {
      algiers: 65,
      oran: 95,
      constantine: 130,
    },
  },
  frankfurt: {
    code: 'DE-FRA',
    city: 'Frankfurt',
    country: 'Germany',
    provider: 'Fastly',
    coordinates: { lat: 50.1109, lng: 11.6203 },
    estimatedLatency: {
      algiers: 40,
      oran: 52,
      constantine: 55,
    },
  },
  dubai: {
    code: 'AE-DXB',
    city: 'Dubai',
    country: 'UAE',
    provider: 'CloudFront',
    coordinates: { lat: 25.2048, lng: 55.2708 },
    estimatedLatency: {
      algiers: 85,
      oran: 100,
      constantine: 95,
    },
  },
} as const;

export type EdgeLocation = keyof typeof EDGE_LOCATIONS;

// Default cache policies by content type
export const CACHE_POLICIES = {
  static_assets: {
    ttl: 31536000,        // 1 year
    staleWhileRevalidate: 86400,  // 1 day
    staleIfError: 604800,  // 7 days
    mustRevalidate: false,
    varyOn: ['Accept-Encoding'],
  },
  images: {
    ttl: 2592000,         // 30 days
    staleWhileRevalidate: 3600,   // 1 hour
    staleIfError: 86400,   // 1 day
    mustRevalidate: false,
    varyOn: ['Accept-Encoding', 'Accept'],
  },
  api_responses: {
    ttl: 60,              // 1 minute
    staleWhileRevalidate: 30,
    staleIfError: 300,
    mustRevalidate: true,
    varyOn: ['Authorization', 'Accept-Language'],
  },
  html_pages: {
    ttl: 300,             // 5 minutes (ISR)
    staleWhileRevalidate: 60,
    staleIfError: 600,
    mustRevalidate: true,
    varyOn: ['Accept-Encoding', 'Accept-Language', 'Cookie'],
  },
  personalized: {
    ttl: 0,               // No cache
    staleWhileRevalidate: 0,
    staleIfError: 0,
    mustRevalidate: true,
    varyOn: ['Cookie', 'Authorization'],
  },
} as const;

// Known bot patterns
const BOT_PATTERNS = {
  good_bots: [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,            // Yahoo
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /applebot/i,
    /whatsapp/i,
  ],
  bad_bots: [
    /sqlmap/i,
    /nikto/i,
    /dirbuster/i,
    /nmap/i,
    /masscan/i,
    /gobuster/i,
    /wfuzz/i,
    /hydra/i,
    /medusa/i,
    /brutus/i,
  ],
  scrapers: [
    /ahrefsbot/i,
    /semrushbot/i,
    /mj12bot/i,
    /dotbot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /harvest/i,
    /extractor/i,
  ],
};

// Rate limiting configuration
const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  windowMs: 60000,        // 1 minute
  maxRequests: 100,
  byCountry: {
    DZ: { windowMs: 60000, maxRequests: 150 },   // Higher limit for Algeria
    TN: { windowMs: 60000, maxRequests: 120 },
    MA: { windowMs: 60000, maxRequests: 120 },
    FR: { windowMs: 60000, maxRequests: 200 },   // Higher for France (more legitimate traffic)
  },
};

// A/B Test configurations
const ACTIVE_AB_TESTS: ABTestConfig[] = [
  {
    id: 'homepage_layout_v2',
    name: 'Homepage Layout Optimization',
    trafficPercentage: 50,
    variants: [
      { name: 'control', weight: 50, config: { layout: 'classic', heroSize: 'large' } },
      { name: 'variant_a', weight: 30, config: { layout: 'compact', heroSize: 'medium' } },
      { name: 'variant_b', weight: 20, config: { layout: 'modern', heroSize: 'small' } },
    ],
    targeting: {
      countries: ['DZ', 'TN', 'MA'],
    },
    startDate: new Date('2024-01-01'),
  },
  {
    id: 'product_card_design',
    name: 'Product Card CTR Optimization',
    trafficPercentage: 30,
    variants: [
      { name: 'original', weight: 70, config: { showPrice: true, showRating: true, imageRatio: '4:3' } },
      { name: 'minimal', weight: 30, config: { showPrice: true, showRating: false, imageRatio: '1:1' } },
    ],
    startDate: new Date('2024-02-01'),
  },
];

// ============================================================================
// IP Geolocation Service
// ============================================================================

/**
 * Geolocate an IP address using MaxMind-style database or API fallback
 * For production, integrate with Cloudflare's built-in geo or MaxMind GeoIP2
 */
export class IPGeolocationService {
  private static instance: IPGeolocationService;
  private cache: Map<string, { geo: GeoLocation; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour

  static getInstance(): IPGeolocationService {
    if (!IPGeolocationService.instance) {
      IPGeolocationService.instance = new IPGeolocationService();
    }
    return IPGeolocationService.instance;
  }

  /**
   * Get geolocation data for an IP address
   */
  async lookup(ip: string): Promise<GeoLocation | null> {
    // Check cache first
    const cached = this.cache.get(ip);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.geo;
    }

    try {
      // In a real implementation, this would call:
      // - Cloudflare: request.cf.country, request.cf.city, etc.
      // - MaxMind GeoIP2 database
      // - Or external API like ip-api.com
      
      // Simulated response for development/demo
      const geo = await this.resolveGeo(ip);
      
      if (geo) {
        this.cache.set(ip, { geo, timestamp: Date.now() });
      }
      
      return geo;
    } catch (error) {
      console.error('GeoIP lookup failed:', error);
      return null;
    }
  }

  /**
   * Resolve geolocation - in production, replace with actual GeoIP service
   */
  private async resolveGeo(ip: string): Promise<GeoLocation | null> {
    // For demo purposes, simulate based on IP ranges
    // In production, use actual GeoIP database
    
    // Common Algerian ISP prefixes (simplified)
    const algerianRanges = [
      /^41\./,    // Algeria Telecom
      /^41\.10[0-9]/,
      /^41\.11[0-9]/,
      /^41\.20[0-9]/,
      /^41\.21[0-9]/,
      /^41\.66\./,
      /^41\.67\./,
      /^41\.10[0-9]\./,
      /^105\.10[0-9]\./,  // DZ Mobile
      /^196\.2[0-9]\./,   // Algérie Télécom
      /^196\.3[0-9]\./,
      /^197\.11[0-9]\./,  // Mobilis
      /^197\.112\./,
    ];

    const moroccanRanges = [
      /^41\.14[0-9]\./,
      /^41\.24[0-9]\./,
      /^41\.25[0-9]\./,
      /^196\.6[0-9]\./,
      /^105\.10[0-9]\./,
    ];

    const tunisianRanges = [
      /^41\.22[0-9]\./,
      /^41\.23[0-9]\./,
      /^196\.20[0-9]\./,
      /^196\.203\./,
      /^197\.0[0-9]\./,
    ];

    const frenchRanges = [
      /^2\./,
      /^51\./,
      /^81\./,
      /^82\./,
      /^84\./,
      /^88\./,
      /^90\./,
      /^91\./,
    ];

    // Check ranges
    for (const range of algerianRanges) {
      if (range.test(ip)) {
        return this.getAlgerianLocation(ip);
      }
    }

    for (const range of moroccanRanges) {
      if (range.test(ip)) {
        return {
          country: 'Morocco',
          countryCode: 'MA',
          region: 'Casablanca-Settat',
          city: 'Casablanca',
          latitude: 33.5731,
          longitude: -7.5898,
          timezone: 'Africa/Casablanca',
          isEU: false,
          isMENA: true,
        };
      }
    }

    for (const range of tunisianRanges) {
      if (range.test(ip)) {
        return {
          country: 'Tunisia',
          countryCode: 'TN',
          region: 'Tunis',
          city: 'Tunis',
          latitude: 36.8065,
          longitude: 10.1815,
          timezone: 'Africa/Tunis',
          isEU: false,
          isMENA: true,
        };
      }
    }

    for (const range of frenchRanges) {
      if (range.test(ip)) {
        return {
          country: 'France',
          countryCode: 'FR',
          region: 'Île-de-France',
          city: 'Paris',
          latitude: 48.8566,
          longitude: 2.3522,
          timezone: 'Europe/Paris',
          isEU: true,
          isMENA: false,
        };
      }
    }

    // Default: unknown location (treat as international)
    return null;
  }

  /**
   * Get specific Algerian location based on IP prefix
   */
  private getAlgerianLocation(ip: string): GeoLocation {
    // Simplified logic - in production, use actual GeoIP database
    const locations = [
      { prefix: '41.101', city: 'Algiers', region: 'Algiers', lat: 36.7538, lng: 3.0588 },
      { prefix: '41.102', city: 'Oran', region: 'Oran', lat: 35.6911, lng: -0.6157 },
      { prefix: '41.103', city: 'Constantine', region: 'Constantine', lat: 36.3650, lng: 6.6147 },
      { prefix: '41.104', city: 'Batna', region: 'Batna', lat: 35.5553, lng: 6.1745 },
      { prefix: '41.105', city: 'Setif', region: 'Setif', lat: 36.1893, lng: 5.4094 },
      { prefix: '41.106', city: 'Annaba', region: 'Annaba', lat: 36.9030, lng: 7.7691 },
      { prefix: '41.107', city: 'Bejaia', region: 'Bejaia', lat: 36.7177, lng: 5.0651 },
      { prefix: '41.108', city: 'Tlemcen', region: 'Tlemcen', lat: 34.8888, lng: -1.3156 },
      { prefix: '41.109', city: 'Blida', region: 'Blida', lat: 36.4772, lng: 2.8264 },
      { prefix: '41.110', city: 'Ouargla', region: 'Ouargla', lat: 33.4505, lng: 5.3209 },
    ];

    const match = locations.find(loc => ip.startsWith(loc.prefix));
    
    return {
      country: 'Algeria',
      countryCode: 'DZ',
      region: match?.region || 'Algiers',
      city: match?.city || 'Algiers',
      latitude: match?.lat || 36.7538,
      longitude: match?.lng || 3.0588,
      timezone: 'Africa/Algiers',
      isEU: false,
      isMENA: true,
    };
  }

  /**
   * Clear cached entries
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; oldestEntry: number | null } {
    let oldestEntry: number | null = null;
    this.cache.forEach((value) => {
      if (!oldestEntry || value.timestamp < oldestEntry) {
        oldestEntry = value.timestamp;
      }
    });
    return {
      size: this.cache.size,
      oldestEntry,
    };
  }
}

// ============================================================================
// Bot Detection Service
// ============================================================================

export class BotDetectionService {
  private static instance: BotDetectionService;

  static getInstance(): BotDetectionService {
    if (!BotDetectionService.instance) {
      BotDetectionService.instance = new BotDetectionService();
    }
    return BotDetectionService.instance;
  }

  /**
   * Analyze user agent and determine if it's a bot
   */
  analyze(userAgent: string, ip: string): { isBot: boolean; botType: BotType; confidence: number } {
    const ua = userAgent.toLowerCase();

    // Check for good bots first
    for (const pattern of BOT_PATTERNS.good_bots) {
      if (pattern.test(ua)) {
        return { isBot: true, botType: 'good_bot', confidence: 0.95 };
      }
    }

    // Check for bad bots
    for (const pattern of BOT_PATTERNS.bad_bots) {
      if (pattern.test(ua)) {
        return { isBot: true, botType: 'bad_bot', confidence: 0.99 };
      }
    }

    // Check for scrapers
    for (const pattern of BOT_PATTERNS.scrapers) {
      if (pattern.test(ua)) {
        return { isBot: true, botType: 'crawler', confidence: 0.70 };
      }
    }

    // Additional heuristics
    const suspiciousIndicators = [
      !ua.includes('mozilla'),                    // Non-standard browsers
      ua.includes('bot') || ua.includes('crawl'), // Explicit bot keywords
      ua.includes('python') || ua.includes('curl'), // Scripting tools
      ua.includes('wget') || ua.includes('httpie'), // CLI tools
      ua.length < 20,                             // Too short UA
      ua.includes('+http://'),                    // URL in UA (often bots)
    ];

    const suspicionScore = suspiciousIndicators.filter(Boolean).length;
    
    if (suspicionScore >= 3) {
      return { isBot: true, botType: 'unknown', confidence: 0.60 + (suspicionScore * 0.08) };
    }

    return { isBot: false, botType: 'unknown', confidence: 0 };
  }

  /**
   * Check if request should be blocked based on bot analysis
   */
  shouldBlock(
    botAnalysis: { isBot: boolean; botType: BotType; confidence: number },
    ctx: EdgeRequestContext
  ): { shouldBlock: boolean; reason?: string } {
    // Block bad bots unconditionally
    if (botAnalysis.botType === 'bad_bot') {
      return { shouldBlock: true, reason: 'Malicious bot detected' };
    }

    // Rate limit crawlers on sensitive endpoints
    const sensitivePaths = ['/api/', '/login', '/register', '/admin'];
    const isSensitivePath = sensitivePaths.some(path => ctx.requestPath.startsWith(path));
    
    if (botAnalysis.botType === 'crawler' && isSensitivePath) {
      return { shouldBlock: true, reason: 'Crawler blocked on sensitive endpoint' };
    }

    return { shouldBlock: false };
  }
}

// ============================================================================
// Rate Limiter Service
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

export class EdgeRateLimiter {
  private static instance: EdgeRateLimiter;
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): EdgeRateLimiter {
    if (!EdgeRateLimiter.instance) {
      EdgeRateLimiter.instance = new EdgeRateLimiter();
    }
    return EdgeRateLimiter.instance;
  }

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
  }

  /**
   * Check if request is allowed under rate limits
   */
  check(ctx: EdgeRequestContext, config: RateLimitConfig = DEFAULT_RATE_LIMITS): {
    allowed: boolean;
    remaining: number;
    retryAfter: number;
    limit: number;
  } {
    const key = (config.keyGenerator ? config.keyGenerator(ctx) : this.generateKey(ctx));
    const now = Date.now();

    // Get country-specific limits if available
    const countryConfig = ctx.geo?.countryCode 
      ? config.byCountry?.[ctx.geo.countryCode as RegionCode]
      : undefined;

    const windowMs = countryConfig?.windowMs || config.windowMs;
    const maxRequests = countryConfig?.maxRequests || config.maxRequests;

    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // New window or expired entry
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
        lastRequest: now,
      });

      return {
        allowed: true,
        remaining: maxRequests - 1,
        retryAfter: 0,
        limit: maxRequests,
      };
    }

    // Within current window
    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.max(1, retryAfter),
        limit: maxRequests,
      };
    }

    // Increment counter
    entry.count++;
    entry.lastRequest = now;

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      retryAfter: 0,
      limit: maxRequests,
    };
  }

  /**
   * Generate rate limit key from context
   */
  private generateKey(ctx: EdgeRequestContext): string {
    // Use IP + path combination for more granular limiting
    return `ratelimit:${ctx.ip}:${ctx.requestPath.split('?')[0]}`;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get current store size
   */
  getStoreSize(): number {
    return this.store.size;
  }

  /**
   * Destroy instance and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// ============================================================================
// A/B Testing Service
// ============================================================================

export class ABTestingService {
  private static instance: ABTestingService;
  private userAssignments: Map<string, { testId: string; variant: string; assignedAt: number }> = new Map();

  static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }

  /**
   * Determine which variant a user should see for each active test
   */
  getVariants(ctx: EdgeRequestContext): Record<string, string> {
    const variants: Record<string, string> = {};

    for (const test of ACTIVE_AB_TESTS) {
      // Skip if test hasn't started or has ended
      if (new Date(test.startDate) > new Date()) continue;
      if (test.endDate && new Date(test.endDate) < new Date()) continue;

      // Check targeting rules
      if (!this.matchesTargeting(ctx, test.targeting)) {
        // Use control variant for non-targeted users
        variants[test.id] = test.variants[0].name;
        continue;
      }

      // Traffic allocation
      if (this.shouldIncludeInTest(ctx, test.trafficPercentage)) {
        const variant = this.assignVariant(ctx.requestId, test);
        variants[test.id] = variant;
      } else {
        // Not in test - use control
        variants[test.id] = test.variants[0].name;
      }
    }

    return variants;
  }

  /**
   * Check if user matches targeting criteria
   */
  private matchesTargeting(
    ctx: EdgeRequestContext,
    targeting?: ABTestConfig['targeting']
  ): boolean {
    if (!targeting) return true;

    // Country targeting
    if (targeting.countries && targeting.countries.length > 0) {
      if (!ctx.geo || !targeting.countries.includes(ctx.geo.countryCode as RegionCode)) {
        return false;
      }
    }

    // Path targeting
    if (targeting.paths && targeting.paths.length > 0) {
      if (!targeting.paths.some(path => ctx.requestPath.startsWith(path))) {
        return false;
      }
    }

    return true;
  }

  /**
   * Deterministic check if user should be included in test
   */
  private shouldIncludeInTest(ctx: EdgeRequestContext, percentage: number): boolean {
    // Use hash of IP + request ID for deterministic assignment
    const hash = this.hashString(`${ctx.ip}:${ctx.requestId}`);
    return (hash % 100) < percentage;
  }

  /**
   * Assign variant based on weights
   */
  private assignVariant(requestId: string, test: ABTestConfig): string {
    // Check existing assignment
    const existing = this.userAssignments.get(`${test.id}:${requestId}`);
    if (existing && Date.now() - existing.assignedAt < 86400000) { // 24h stickiness
      return existing.variant;
    }

    // Weighted random selection
    const hash = this.hashString(`${test.id}:${requestId}`);
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    let cumulative = 0;
    const target = hash % totalWeight;

    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (target < cumulative) {
        this.userAssignments.set(`${test.id}:${requestId}`, {
          testId: test.id,
          variant: variant.name,
          assignedAt: Date.now(),
        });
        return variant.name;
      }
    }

    // Fallback to first variant
    return test.variants[0].name;
  }

  /**
   * Simple string hashing function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get active tests info
   */
  getActiveTests(): ABTestConfig[] {
    return ACTIVE_AB_TESTS.filter(test => {
      const now = new Date();
      return now >= new Date(test.startDate) && (!test.endDate || now <= test.endDate);
    });
  }
}

// ============================================================================
// Geographic Router
// ============================================================================

export class GeographicRouter {
  private static instance: GeographicRouter;

  static getInstance(): GeographicRouter {
    if (!GeographicRouter.instance) {
      GeographicRouter.instance = new GeographicRouter();
    }
    return GeographicRouter.instance;
  }

  /**
   * Make routing decision based on geolocation
   */
  route(geo: GeoLocation | null): RoutingDecision {
    const countryCode = geo?.countryCode || 'OTHER';
    const region = countryCode as RegionCode;

    // Determine optimal origin based on location
    const origin = this.selectOrigin(region, geo);

    // Select cache policy based on content type inference
    const cachePolicy = this.getCachePolicyForRegion(region);

    // Define transform rules
    const transformRules = this.getTransformRules(region);

    // Add regional headers
    const headersToAdd = this.getRegionalHeaders(region, geo);

    return {
      region,
      origin,
      cachePolicy,
      transformRules,
      headersToAdd,
      shouldBlock: false,
    };
  }

  /**
   * Select best origin server for the region
   */
  private selectOrigin(region: RegionCode, geo: GeoLocation | null): string {
    switch (region) {
      case 'DZ':
        // Route to closest Algerian PoP or main origin
        if (geo?.city === 'Oran') return 'https://origin-algierstrade-dz.oran.cdn';
        if (geo?.city === 'Constantine') return 'https://origin-algierstrade-dz.const.cdn';
        return 'https://origin.algierstrade.dz'; // Default Algiers origin
        
      case 'TN':
        return 'https://origin.algierstrade.dz'; // Tunisia routes to main origin
        
      case 'MA':
        return 'https://origin.algierstrade.dz'; // Morocco routes to main origin
        
      case 'FR':
        return 'https://eu-origin.algierstrade.dz'; // EU origin (Paris/Marseille)
        
      default:
        return 'https://origin.algierstrade.dz'; // Global default
    }
  }

  /**
   * Get cache policy adjusted for region
   */
  private getCachePolicyForRegion(region: RegionCode): CachePolicy {
    const basePolicy = { ...CACHE_POLICIES.html_pages };

    // Adjust TTL based on region (longer cache for regions farther from origin)
    switch (region) {
      case 'DZ':
        return { ...basePolicy, ttl: 180 }; // 3 min for Algeria (frequent updates)
      case 'TN':
      case 'MA':
        return { ...basePolicy, ttl: 300 }; // 5 min for neighbors
      case 'FR':
        return { ...basePolicy, ttl: 420 }; // 7 min for Europe
      default:
        return { ...basePolicy, ttl: 600 }; // 10 min for others
    }
  }

  /**
   * Get transform rules for region
   */
  private getTransformRules(_region: RegionCode): TransformRule[] {
    return [
      {
        type: 'image',
        pattern: /\.(jpg|jpeg|png|gif)$/i,
        action: 'webp,avif',
        priority: 1,
      },
      {
        type: 'header',
        pattern: /.*/i,
        action: 'add-security-headers',
        priority: 10,
      },
    ];
  }

  /**
   * Get regional headers
   */
  private getRegionalHeaders(region: RegionCode, geo: GeoLocation | null): Record<string, string> {
    return {
      'X-Region': region,
      'X-Country': geo?.country || 'Unknown',
      'X-City': geo?.city || 'Unknown',
      'X-Timezone': geo?.timezone || 'UTC',
      'X-Is-MENA': String(geo?.isMENA || false),
      'X-Cache-Status': 'MISS',
      'Vary': 'Accept-Language, Accept-Encoding',
    };
  }

  /**
   * Estimate latency to user from nearest edge location
   */
  estimateLatency(geo: GeoLocation | null): { location: EdgeLocation; latencyMs: number } {
    if (!geo) {
      return { location: 'paris', latencyMs: 50 }; // Default estimate
    }

    // Find closest edge location
    let closestEdge: EdgeLocation = 'paris';
    let lowestLatency = Infinity;

    for (const [location, data] of Object.entries(EDGE_LOCATIONS)) {
      // Calculate approximate distance
      const distance = this.haversineDistance(
        geo.latitude,
        geo.longitude,
        data.coordinates.lat,
        data.coordinates.lng
      );

      // Rough latency estimation (1ms per ~100km + base)
      const estimatedLatency = Math.round(distance / 100) + 10;

      if (estimatedLatency < lowestLatency) {
        lowestLatency = estimatedLatency;
        closestEdge = location as EdgeLocation;
      }
    }

    return { location: closestEdge, latencyMs: lowestLatency };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// ============================================================================
// Main Edge Middleware Function
// ============================================================================

export class EdgeMiddleware {
  private geoService: IPGeolocationService;
  private botService: BotDetectionService;
  private rateLimiter: EdgeRateLimiter;
  private abTesting: ABTestingService;
  private router: GeographicRouter;

  constructor() {
    this.geoService = IPGeolocationService.getInstance();
    this.botService = BotDetectionService.getInstance();
    this.rateLimiter = EdgeRateLimiter.getInstance();
    this.abTesting = ABTestingService.getInstance();
    this.router = GeographicRouter.getInstance();
  }

  /**
   * Process incoming request through all edge functions
   */
  async processRequest(request: Request): Promise<EdgeFunctionResult> {
    const startTime = performance.now();
    
    // Extract request context
    const ctx = await this.buildContext(request);

    // 1. Bot Detection
    const botAnalysis = this.botService.analyze(ctx.userAgent, ctx.ip);
    ctx.isBot = botAnalysis.isBot;
    ctx.botType = botAnalysis.botType;

    const blockDecision = this.botService.shouldBlock(botAnalysis, ctx);
    if (blockDecision.shouldBlock) {
      return this.blockResponse(blockDecision.reason!, ctx);
    }

    // 2. Rate Limiting
    const rateLimitResult = this.rateLimiter.check(ctx);
    if (!rateLimitResult.allowed) {
      return this.rateLimitResponse(rateLimitResult, ctx);
    }

    // 3. Geolocation & Routing
    const geo = await this.geoService.lookup(ctx.ip);
    ctx.geo = geo;
    const routingDecision = this.router.route(geo);

    // 4. A/B Testing
    const variants = this.abTesting.getVariants(ctx);
    ctx.abTestVariant = Object.values(variants).join(',');

    // Build final result
    const processingTime = Math.round(performance.now() - startTime);

    return {
      status: 200,
      headers: {
        ...routingDecision.headersToAdd,
        'X-Edge-Processing-Time': `${processingTime}ms`,
        'X-Request-ID': ctx.requestId,
        'X-AB-Variants': ctx.abTestVariant || '',
        'X-Bot-Detected': String(botAnalysis.isBot),
        'X-Rate-Limit-Remaining': String(rateLimitResult.remaining),
        'X-Rate-Limit-Limit': String(rateLimitResult.limit),
        'X-Origin': routingDecision.origin,
        'Cache-Control': this.buildCacheControlHeader(routingDecision.cachePolicy),
        'CDN-Cache-Control': `public, s-maxage=${routingDecision.cachePolicy.ttl}, stale-while-revalidate=${routingDecision.cachePolicy.staleWhileRevalidate}`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      shouldProxy: true,
      proxyTarget: routingDecision.origin,
      cacheKey: this.generateCacheKey(ctx, routingDecision),
    };
  }

  /**
   * Build request context from incoming request
   */
  private async buildContext(request: Request): Promise<EdgeRequestContext> {
    // Extract client IP (considering proxies)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    const ip = cfConnectingIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1');

    // Generate unique request ID
    const requestId = this.generateRequestId();

    return {
      ip,
      userAgent: request.headers.get('user-agent') || '',
      geo: null,
      isBot: false,
      requestPath: new URL(request.url).pathname,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: Date.now(),
      requestId,
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `edge-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate cache key considering Vary headers
   */
  private generateCacheKey(ctx: EdgeRequestContext, routing: RoutingDecision): string {
    const parts = [ctx.requestPath];
    
    // Add varying factors
    if (routing.cachePolicy.varyOn.includes('Accept-Language')) {
      parts.push(`lang:${ctx.headers['accept-language'] || 'default'}`);
    }
    if (routing.cachePolicy.varyOn.includes('Accept-Encoding')) {
      parts.push(`enc:${ctx.headers['accept-encoding'] || 'identity'}`);
    }
    if (ctx.abTestVariant) {
      parts.push(`ab:${ctx.abTestVariant}`);
    }

    return parts.join('|');
  }

  /**
   * Build Cache-Control header value
   */
  private buildCacheControlHeader(policy: CachePolicy): string {
    const parts: string[] = [];
    
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
   * Return blocked response
   */
  private blockResponse(reason: string, ctx: EdgeRequestContext): EdgeFunctionResult {
    return {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-Block-Reason': reason,
        'X-Request-ID': ctx.requestId,
      },
      body: JSON.stringify({
        error: 'Forbidden',
        message: reason,
        requestId: ctx.requestId,
      }),
      shouldProxy: false,
    };
  }

  /**
   * Return rate limited response
   */
  private rateLimitResponse(
    rateLimitResult: { retryAfter: number; limit: number },
    ctx: EdgeRequestContext
  ): EdgeFunctionResult {
    return {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(rateLimitResult.retryAfter),
        'X-Rate-Limit-Limit': String(rateLimitResult.limit),
        'X-Request-ID': ctx.requestId,
      },
      body: JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
        requestId: ctx.requestId,
      }),
      shouldProxy: false,
    };
  }

  /**
   * Get health/status information about edge services
   */
  getStatus(): {
    geoCacheStats: ReturnType<IPGeolocationService['getCacheStats']>;
    rateLimitStoreSize: number;
    activeTests: number;
  } {
    return {
      geoCacheStats: this.geoService.getCacheStats(),
      rateLimitStoreSize: this.rateLimiter.getStoreSize(),
      activeTests: this.abTesting.getActiveTests().length,
    };
  }
}

// ============================================================================
// Export singleton instances for convenience
// ============================================================================

export const edgeMiddleware = new EdgeMiddleware();
export const geoService = IPGeolocationService.getInstance();
export const botDetection = BotDetectionService.getInstance();
export const rateLimiter = EdgeRateLimiter.getInstance();
export const abTesting = ABTestingService.getInstance();
export const geoRouter = GeographicRouter.getInstance();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Determine content type from request path
 */
export function inferContentType(path: string): keyof typeof CACHE_POLICIES {
  if (/\.(js|css|woff2?|ttf|eot|svg|ico)$/.test(path)) return 'static_assets';
  if (/\.(jpg|jpeg|png|gif|webp|avif|bmp)$/.test(path)) return 'images';
  if (/^\/api\//.test(path)) return 'api_responses';
  if (/\/account|\/dashboard|\/profile/.test(path)) return 'personalized';
  return 'html_pages';
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in ms to human-readable
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}
