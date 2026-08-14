/**
 * AlgeriaTrade.dz - Advanced Rate Limiting & DDoS Protection
 * 
 * Enterprise-grade protection providing:
 * - Multi-tier rate limiting (IP, User, Endpoint, Global)
 * - DDoS mitigation (challenge/response, rate limiting, geo-blocking)
 * - Adaptive throttling based on system load
 * - IP reputation integration
 * - CAPTCHA challenge system
 * - Traffic analysis and anomaly detection
 * - Whitelist/Blacklist management
 * - Real-time dashboard metrics
 */

// ===========================================
// Types & Interfaces
// ===========================================

export interface RateLimitConfig {
  enabled: boolean;
  
  // Global limits
  global: {
    requestsPerSecond: number;
    burstSize: number; // Max concurrent requests in a burst
    cleanupIntervalMs: number;
  };
  
  // Per-IP limits
  ip: {
    enabled: boolean;
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    
    // Stricter limits for suspicious IPs
    suspiciousMultiplier: number;
    suspiciousThreshold: number; // Score above this = "suspicious"
  };
  
  // Per-User limits
  user: {
    enabled: boolean;
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    authenticatedMultiplier: number; // Bonus capacity for logged-in users
  };
  
  // Per-Endpoint limits
  endpoint: {
    enabled: boolean;
    defaults: {
      GET: { requestsPerSecond: number; requestsPerMinute: number };
      POST: { requestsPerSecond: number; requestsPerMinute: number };
      PUT: { requestsPerSecond: number; requestsPerMinute: number };
      DELETE: { requestsPerSecond: number; requestsPerMinute: number };
      PATCH: { requestsPerSecond: number; requestsPerMinute: number };
    };
    custom: Array<{
      pattern: RegExp;
      methods: string[];
      requestsPerSecond?: number;
      requestsPerMinute?: number;
      requestsPerHour?: number;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
  
  // DDoS Protection
  ddos: {
    enabled: boolean;
    mode: 'monitor' | 'mitigate' | 'block'; // Block = extreme measure
    
    // Challenge settings
    challenge: {
      enabled: true;
      type: 'javascript' | 'captcha' | 'interactive' | 'static';
      showTo: 'all' | 'suspicious' | 'critical';
      durationSeconds: number;
      passRate: number; // Required correct answers to pass
      maxAttempts: number;
      cooldownMinutes: number;
    };
    
    // Rate limiting under attack
    attackModeLimits: {
      globalRpsReduction: number; // Reduce global RPS by this factor
      enableAdaptiveThrottling: boolean;
      adaptiveThreshold: number; // Start throttling when queue > this
      maxQueueSize: number;
      queueWaitTimeMs: number;
    };
    
    // Geo-blocking
    geoBlocking: {
      enabled: false;
      blockHighRiskCountries: string[]; // ISO codes
      allowAlgeriaOnly: boolean; // Business requirement
      allowedCountries: string[]; // Explicitly allowed
    };
    
    // IP Reputation
    ipReputation: {
      enabled: false;
      serviceEndpoint?: string;
      cacheTimeMs: number;
      checkOnFirstRequest: boolean;
      knownAbuseIPs: string[];
      whitelistServices: string[];
    };
  };
  
  // CAPTCHA Configuration
  captcha: {
    provider: 'recaptcha-v3' | 'hcaptcha' | 'custom';
    secretKey?: string;
    siteKey?: string;
    verifyUrl?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    timeoutSeconds: number;
  };
  
  // Logging & Alerting
  logging: {
    logRateLimitExceeded: boolean;
    logDdosMitigation: boolean;
    logChallengesServed: boolean;
    alertChannels: string[];
  };
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
  firstRequestTime: number;
  blockUntil?: number;
  isBlocked: boolean;
  challengeRequired: boolean;
  warningsIssued: number;
  totalRequests: number;
}

export interface ClientInfo {
  ipAddress: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  country?: string;
  isMobile?: boolean;
  isBot?: boolean;
  reputationScore?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  blocked: boolean;
  challenged: boolean;
  retryAfter?: number;
  statusCode: number;
  headers?: Record<string, string>;
  reason?: string;
  ruleId?: string;
  metadata?: Record<string, any>;
}

export interface DDoSMetric {
  timestamp: string;
  totalRequests: number;
  blockedRequests: number;
  challengedRequests: number;
  allowedRequests: number;
  averageResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  activeConnections: number;
  uniqueIPs: number;
  topAttackingIPs: Array<{ ip: string; requests: number }>;
  topAttackedEndpoints: Array<{ endpoint: string; requests: number }>;
  countries: Array<{ country: string; requests: number }>;
  currentGlobalRps: number;
  mitigationActive: boolean;
  mitigationMode: string;
}

export interface IPReputationData {
  ip: string;
  score: number; // 0-100, higher = worse
  category: 'clean' | 'suspicious' | 'malicious' | 'known-abuser';
  lastSeen: string;
  totalRequests: number;
  firstSeen: string;
  datacenter?: string;
  asn?: string;
  organization?: string;
}

// ===========================================
// Default Configuration
// ===========================================

const DEFAULT_CONFIG: RateLimitConfig = {
  enabled: true,
  
  global: {
    requestsPerSecond: 1000,
    burstSize: 50,
    cleanupIntervalMs: 60000, // Clean up every minute
  },
  
  ip: {
    enabled: true,
    requestsPerSecond: 30,
    requestsPerMinute: 200,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    suspiciousMultiplier: 0.25, // Suspicious IPs get 1/4th normal limit
    suspiciousThreshold: 70, // Score above this = suspicious
  },
  
  user: {
    enabled: true,
    requestsPerSecond: 60,
    requestsPerMinute: 300,
    requestsPerHour: 1800,
    authenticatedMultiplier: 5, // Logged-in users get 5x capacity
  },
  
  endpoint: {
    enabled: true,
    defaults: {
      GET: { requestsPerSecond: 60, requestsPerMinute: 1200 },
      POST: { requestsPerSecond: 20, requestsPerMinute: 300 },
      PUT: { requestsPerSecond: 20, requestsPerMinute: 300 },
      DELETE: { requestsPerSecond: 10, requestsPerMinute: 60 },
      PATCH: { requestsPerSecond: 10, requestsPerMinute: 60 },
    },
    custom: [
      // Authentication endpoints - very strict
      {
        pattern: /^\/api\/auth\/login/,
        methods: ['POST'],
        requestsPerSecond: 5,
        requestsPerMinute: 10,
        requestsPerHour: 20,
        priority: 'critical',
      },
      {
        pattern: /^\/api\/auth\/register/,
        methods: ['POST'],
        requestsPerSecond: 3,
        requestsPerMinute: 10,
        requestsPerHour: 20,
        priority: 'critical',
      },
      {
        pattern: /^\/api\/auth\/password/,
        methods: ['PUT', 'POST'],
        requestsPerSecond: 3,
        requestsPerMinute: 10,
        requestsPerHour: 15,
        priority: 'high',
      },
      // Payment endpoints - strict
      {
        pattern: /^\/api\/(payments|checkout|orders)/,
        methods: ['POST', 'PUT', 'PATCH'],
        requestsPerSecond: 10,
        requestsPerMinute: 30,
        requestsPerHour: 100,
        priority: 'critical',
      },
      {
        pattern: /^\/api\/rfq/,
        methods: ['POST'],
        requestsPerSecond: 10,
        requestsPerMinute: 30,
        requestsPerHour: 100,
        priority: 'high',
      },
      // Search endpoints - moderate
      {
        pattern: /^\/api\/search/,
        methods: ['GET', 'POST'],
        requestsPerSecond: 30,
        requestsPerMinute: 200,
        priority: 'medium',
      },
      // Public endpoints - lenient
      {
        pattern: /^\/api\/public\//,
        methods: ['GET'],
        requestsPerSecond: 100,
        requestsPerMinute: 500,
        priority: 'low',
      },
    ],
  },
  
  ddos: {
    enabled: true,
    mode: 'mitigate',
    
    challenge: {
      enabled: true,
      type: 'javascript',
      showTo: 'suspicious',
      durationSeconds: 30,
      passRate: 0.8, // 80% must solve correctly
      maxAttempts: 3,
      cooldownMinutes: 15,
    },
    
    attackModeLimits: {
      globalRpsReduction: 0.5, // Reduce to 50% during attack
      enableAdaptiveThrottling: true,
      adaptiveThreshold: 80, // Start throttling when queue > 80% full
      maxQueueSize: 10000,
      queueWaitTimeMs: 100,
    },
    
    geoBlocking: {
      enabled: false,
      blockHighRiskCountries: [],
      allowAlgeriaOnly: true,
      allowedCountries: ['DZ'], // Primary market
    },
    
    ipReputation: {
      enabled: false,
      cacheTimeMs: 3600000, // Cache for 1 hour
      checkOnFirstRequest: true,
      knownAbuseIPs: [],
      whitelistServices: [],
    },
  },
  
  captcha: {
    provider: 'custom',
    difficulty: 'medium',
    timeoutSeconds: 30,
  },
  
  logging: {
    logRateLimitExceeded: true,
    logDdosMitigation: true,
    logChallengesServed: true,
    alertChannels: ['security-team', 'devops'],
  },
};

// ===========================================
// Main Rate Limiter Class
// ===========================================

class RateLimiterDDoS {
  private config: RateLimitConfig;
  
  // Storage
  private ipStore: Map<string, RateLimitEntry> = new Map();
  private userStore: Map<string, RateLimitEntry> = new Map();
  private endpointStore: Map<string, Map<string, RateLimitEntry>> = new Map();
  
  // DDoS State
  private ddosMode: 'normal' | 'mitigate' | 'block' = 'normal';
  private ddosModeStartTime: number = 0;
  private ddosModeTriggeredBy: string = '';
  
  // Metrics
  private metrics: DDoSMetric;
  private metricsHistory: DDoSMetric[] = [];
  
  // Blocked IPs
  private blockedIPs: Map<string, { until: number; reason: string }> = new Map();
  private challengedIPs: Map<string, { attempts: number; until: number }> = new Map();
  
  // Cleanup interval
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.metrics = this.initializeMetrics();
    
    // Start cleanup
    this.startCleanup();
  }

  /**
   * Main method: Check if request should be allowed
   */
  async checkRateLimit(client: ClientInfo): Promise<RateLimitResult> {
    if (!this.config.enabled) {
      return this.createResult(true);
    }

    const now = Date.now();

    // Check if IP is permanently blocked
    if (this.isPermanentlyBlocked(client.ipAddress)) {
      return this.createBlockResult(client, 'PERMANENTLY_BLOCKED');
    }

    // Check if IP is temporarily blocked
    const tempBlock = this.blockedIPs.get(client.ipAddress);
    if (tempBlock && tempBlock.until > now) {
      return this.createBlockResult(client, 'TEMPORARILY_BLOCKED');
    }

    // Check if IP needs CAPTCHA challenge
    const challenge = this.challengedIPs.get(client.ipAddress);
    if (challenge && challenge.until > now) {
      return this.createChallengeResult(client, challenge);
    }

    // Determine which limits to apply
    let limitResult: RateLimitResult | null = null;

    // Global rate limiting
    limitResult = await this.checkGlobalLimit(client);

    // If not limited by global, check more specific limits
    if (limitResult.allowed) {
      limitResult = await this.checkIPLimit(client);
    }

    if (limitResult.allowed && client.userId) {
      limitResult = await this.checkUserLimit(client);
    }

    if (limitResult.allowed) {
      limitResult = await this.checkEndpointLimit(client);
    }

    // Apply DDoS protections if enabled
    if (this.config.ddos.enabled && this.ddosMode !== 'normal') {
      limitResult = this.applyDdoSProtection(client, limitResult);
    }

    // Update metrics
    this.updateMetrics(client, limitResult);

    return limitResult || this.createResult(true);
  }

  // ===========================================
  // Limit Check Methods
  // ===========================================

  private async function checkGlobalLimit(client: ClientInfo): Promise<RateLimitResult | null> {
    if (!this.config.global.enabled) return null;

    const entry = this.getOrCreateIPEntry(client.ipAddress);
    const now = now = Date.now();

    // Reset counter if window has passed
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + (1000 / this.config.global.requestsPerSecond); // Convert RPS to ms
    }

    // Check limit
    if (entry.count >= this.config.global.requestsPerSecond) {
      entry.count++;
      
      return {
        allowed: false,
        blocked: false,
        challenged: false,
        statusCode: 429,
        headers: {
          'Retry-After': '1',
          'X-RateLimit-Limit': String(this.config.global.requestsPerSecond),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.max(0, (entry.resetTime - now) / 1000)),
        },
        reason: 'Global rate limit exceeded',
        ruleId: 'global',
        metadata: { currentRPS: entry.count + 1, limit: this.config.global.requestsPerSecond },
      };
    }

    // Increment and continue
    entry.count++;
    entry.lastRequest = now;
    return null; // Pass - not limited by global
  }

  private async function checkIPLimit(client: ClientInfo): Promise<RateLimitResult | null> {
    if (!this.config.ip.enabled) return null;

    const entry = this.getOrCreateIPEntry(client.ipAddress);
    const now = Date.now();

    // Minute window
    if (!entry.minuteReset || now >= entry.minuteReset) {
      entry.count = 0;
      entry.minuteReset = now + 60000;
    }

    // Hour window
    if (!entry.hourReset || now >= entry.hourReset) {
      entry.count = 0;
      entry.hourReset = now + 3600000;
    }

    // Day window
    if (!entry.dayReset || now >= entry.dayReset) {
      entry.count = 0;
      entry.dayReset = now + 86400000;
    }

    // Apply suspicious multiplier if needed
    const score = this.getIPScore(client.ipAddress);
    const effectiveLimit = score > this.config.ip.suspiciousThreshold ?
      Math.floor(this.config.ip.requestsPerMinute * this.config.ip.suspiciousMultiplier) :
      this.config.ip.requestsPerMinute;

    if (entry.count >= effectiveLimit) {
      entry.count++;
      
      // For high-frequency violations, consider challenging or blocking
      if (entry.count > effectiveLimit * 2) {
        this.handleFrequentViolator(client, entry);
      }
      
      return {
        allowed: false,
        blocked: false,
        challenged: entry.count > effectiveLimit * 3,
        statusCode: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(effectiveLimit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Window': 'minute',
        },
        reason: `IP rate limit exceeded (${entry.count}/${effectiveLimit}/min)`,
        ruleId: 'ip-minute',
        metadata: { ip: client.ipAddress, count: entry.count, limit: effectiveLimit, window: 'minute' },
      };
    }

    entry.count++;
    return null;
  }

  private async function checkUserLimit(client: ClientInfo): Promise<RateLimitResult | null> {
    if (!client.userId || !this.config.user.enabled) return null;

    const entry = this.getOrCreateUserEntry(client.userId!);
    const now = Date.now();

    // Reset counters based on time windows
    if (!entry.minuteReset || now >= entry.minuteReset) {
      entry.count = 0;
      entry.minuteReset = now + 60000;
    }

    if (!entry.hourReset || now >= entry.hourReset) {
      entry.count = 0;
      entry.hourReset = now + 3600000;
    }

    const effectiveLimit = this.config.user.requestsPerMinute * this.config.user.authenticatedMultiplier;

    if (entry.count >= effectiveLimit) {
      entry.count++;
      
      return {
        allowed: false,
        blocked: false,
        challenged: false,
        statusCode: 429,
        headers: {
          'Retry-After: '60',
          'X-RateLimit-Limit': String(effectiveLimit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Window': 'minute',
        },
        reason: `User rate limit exceeded`,
        ruleId: 'user-minute',
        metadata: { user: client.userId, count: entry.count, limit: effectiveLimit },
      };
    }

    entry.count++;
    return null;
  }

  private async function checkEndpointLimit(client: ClientInfo): Promise<RateLimitResult | null> {
    if (!this.config.endpoint.enabled) return null;

    const path = client.url?.split('?')[0] || '/';
    const method = client.method || 'GET';

    // Find matching endpoint rule
    const endpointRules = this.config.endpoint.custom;
    let matchedRule = endpointRules.find(rule => 
      rule.pattern.test(path) && rule.methods.includes(method)
    );

    // Use default if no custom match
    if (!matchedRule) {
      const methodDefaults = this.endpoint.defaults[method.toUpperCase()];
      matchedRule = {
        pattern: /.*/,
        methods: [method],
        requestsPerSecond: methodDefaults.requestsPerSecond,
        requestsPerMinute: methodDefaults.requestsPerMinute,
      };
    }

    if (!matchedRule) return null;

    const endpointKey = `${method}:${path}`;
    let endpointStore = this.endpointStore.get(endpointKey);
    const now = Date.now();

    if (!endpointStore || !endpointStore || now >= endpointStore.resetTime) {
      endpointStore = {
        count: 0,
        resetTime: now + (matchedRule.requestsPerMinute ? 60000 : 60000), // Default 1 min
      };
      this.endpointStore.set(endpointKey, endpointStore);
    }

    if (endpointStore.count >= matchedRule.requestsPerMinute) {
      endpointStore.count++;

      return {
        allowed: false,
        blocked: false,
        challenged: false,
        statusCode: 429,
        headers: {
          'Retry-After: '30',
          'X-RateLimit-Limit': String(matchedRule.requestsPerMinute),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Endpoint': path,
        },
        reason: `Endpoint rate limit exceeded`,
        ruleId: 'endpoint',
        metadata: { endpoint: path, method, count: endpointStore.count, limit: matchedRule.requestsPerMinute },
      };
    }

    endpointStore.count++;
    return null;
  }

  // ===========================================
  // DDoS Protection Methods
  // ===========================================

  private applyDdoSProtection(client: ClientInput, baseResult: RateLimitResult): RateLimitResult {
    const now = Date.now();
    const metrics = this.metrics;

    // Check if we should enter/mitigate mode
    if (this.shouldActivateDdoS()) {
      if (this.ddosMode === 'normal') {
        this.activateDdoS('Automatic activation due to traffic anomaly');
      }
    }

    switch (this.ddos.mode) {
      case 'block':
        return this.createBlockResult(client, 'DDOS_PROTECTION_ACTIVE');

      case 'mitigate':
        // Apply aggressive rate limiting during attacks
        const reductionFactor = this.config.ddos.attackModeLimits.globalRpsReduction;
        
        if (baseResult.headers) {
          const currentLimit = parseInt(baseResult.headers['X-RateLimit-Limit'] || '1000');
          const reducedLimit = Math.floor(currentLimit * reductionFactor);
          
          return {
            ...baseResult,
            allowed: false,
            blocked: false,
            challenged: false,
            statusCode: 429,
            headers: {
              ...baseResult.headers,
              'X-RateLimit-Limit': String(reducedLimit),
              'X-DDoS-Mitigation': 'active',
              'X-RateLimit-Reduction: String(reductionFactor),
            },
            reason: `DDoS mitigation active - reduced to ${Math.round(reductionFactor * 100)}%`,
            ruleId: 'ddos-mitigation',
            metadata: { originalLimit: currentLimit, reducedLimit, mode: 'mitigate' },
          };
        }
        
      case 'monitor':
        // Just log and allow with monitoring
        console.warn(`[DDoS] High traffic detected from ${client.ipAddress}`);
        return baseResult;
    }

    return baseResult;
  }

  private shouldActivateDdoS(): boolean {
    if (!this.config.ddos.enabled) return false;
    if (this.ddosMode !== 'normal') return true; // Already in mitigation/block mode

    // Heuristic: Activate if many requests are being blocked
    const recentBlocked = Array.from(this.blockedIPs.values())
      .filter(b => b.until > Date.now())
      .length;

    if (recentBlocked.length > 10) return true;

    // Check if we're receiving many challenges (attackers trying to break through)
    const recentChallenges = Array.from(this.challengedIPs.values())
      .filter(c => c.until > Date.now())
      .length;

    if (recentChallenges.length > 20) return true;

    // Check global request rate anomaly
    const recentMetrics = this.metricsHistory.slice(-5);
    const avgRps = recentMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / recentMetrics.length;
    
    if (avgRps > this.config.ddos.attackModeLimits.adaptiveThreshold) {
      this.metrics.queueSize = this.config.ddos.attackModeLimits.maxQueueSize;
      return this.config.ddos.attackModeLimits.enableAdaptiveThrottling &&
             avgRps > this.config.ddos.attackModeLimits.adaptiveThreshold;
    }

    return false;
  }

  private activateDdoS(reason: string): void {
    this.ddosModeStartTime = Date.now();
    this.ddosModeTriggeredBy = reason;
    this.ddosMode = 'mitigate';
    
    console.error(`[DDoS] ${reason} - Activating mitigation mode`);
  }

  // ===========================================
  // IP Management
  // ===========================================

  /**
   * Permanently block an IP address
   */
  blockIP(ip: string, durationMinutes: number = 60, reason: string = 'Manual block'): void {
    this.blockedIPs.set(ip, {
      until: Date.now() + durationMinutes * 60 * 1000,
      reason,
    });
    
    // Log
    if (this.config.logging.logRateLimitExceeded) {
      console.log(`[RateLimiter] IP blocked: ${ip} for ${durationMinutes} minutes - Reason: ${reason}`);
    }
  }

  /**
   * Unblock an IP address
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.challengedIPs.delete(ip);
  }

  /**
   * Get list of blocked IPs
   */
  getBlockedIPs(limit: number = 50): Array<{ ip: string; until: number; reason: string }> {
    const now = Date.now();
    return Array.from(this.blockedIPs.entries())
      .filter(([_, block]) => block.until > now)
      .sort((a, b) => b.until - a.until)
      .slice(0, limit)
      .map(([ip, block]) => ({ ip, until: block.until, reason: block.reason }));
  }

  /**
   * Challenge an IP (require JavaScript challenge)
   */
  challengeIP(ip: string): void {
    const existing = this.challengedIPs.get(ip);
    
    if (existing && existing.until > Date.now()) {
      // Already challenged recently, extend cooldown
      existing.until = Date.now() + (this.config.challenge.cooldownMinutes * 60 * 1000);
    } else {
      // New challenge
      this.challengedIPs.set(ip, {
        attempts: 0,
        until: Date.now() + (this.config.challenge.durationSeconds * 1000),
      });
    }
  }

  // ===========================================
  // Metrics & Reporting
  // ===========================================

  private initializeMetrics(): DDoSMetric {
    return {
      timestamp: new Date().toISOString(),
      totalRequests: 0,
      blockedRequests: 0,
      challengedRequests: 0,
      allowedRequests: 0,
      averageResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      activeConnections: 0,
      uniqueIPs: 0,
      topAttackingIPs: [],
      topAttackedEndpoints: [],
      countries: [],
      currentGlobalRps: 0,
      mitigationActive: false,
      mitigationMode: 'normal',
    };
  }

  private updateMetrics(client: ClientInput, result: RateLimitResult): void {
    const metrics = this.metrics;
    
    metrics.totalRequests++;
    
    if (result.blocked) metrics.blockedRequests++;
    else if (result.challenged) metrics.challengedRequests++;
    else metrics.allowedRequests++;

    // Track attacking IPs
    if (!result.allowed) {
      const existing = metrics.topAttackingIPs.find(i => i.ip === client.ipAddress);
      if (existing) {
        existing.requests++;
      } else {
        metrics.topAttackingIPs.push({ ip: client.ipAddress, requests: 1 });
      }
    }

    // Track attacked endpoints
    if (!result.allowed && client.url) {
      const endpoint = client.url.split('?')[0];
      const existing = metrics.topAttackedEndpoints.find(e => e.endpoint === endpoint);
      if (existing) {
        existing.requests++;
      } else {
        metrics.topAttackedEndpoints.push({ endpoint, requests: 1 });
      }
    }

    // Track countries
    if (client.country) {
      const existing = metrics.countries.find(c => c.country === client.country);
      if (existing) {
        existing.requests++;
      } else {
        metrics.countries.push({ country: client.country, requests: 1 });
      }
    }

    // Calculate rates
    metrics.currentGlobalRps = metrics.totalRequests / ((Date.now() - metrics.timestamp) / 1000);
    metrics.errorRate = (metrics.blockedRequests + metrics.challengedRequests) / metrics.totalRequests;
  }

  // Store history (keep last 100 entries)
  this.metricsHistory.push({ ...metrics });
  if (this.metricsHistory.length > 100) {
    this.metricsHistory.shift();
  }

  // Log significant events
  if ((result.blocked || result.challenged) && this.config.logging.logRateLimitExceeded) {
    console.warn(`[RateLimiter] ${result.blocked ? 'BLOCKED' : result.challenged ? 'CHALLENGED' : ''} `request from ${client.ipAddress} (${client.url})`);
  }

  // Auto-cleanup expired entries periodically
  if (!this.cleanupTimer) {
    this.cleanupTimer = setInterval(() => this.cleanup(), this.config.global.cleanupIntervalMs);
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }
}

// ===========================================
// Result Creation Helpers
// ===========================================

function createResult(allowed: boolean, overrides?: Partial<RateLimitResult>): RateLimitResult {
  return {
    allowed,
    blocked: false,
    challenged: false,
    statusCode: allowed ? 200 : 429,
    reason: undefined,
    ...overrides,
  };
}

function createBlockResult(client: ClientInput, reason: string): RateLimitResult {
  return {
    allowed: false,
    blocked: true,
    challenged: false,
    statusCode: 403,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': '900', // 15 minutes
      'X-Block-Reason': encodeURIComponent(reason),
      'X-Block-Duration: '900',
    },
    reason,
    ruleId: 'blocked',
    metadata: { ip: client.ipAddress },
  };
}

function createChallengeResult(client: ClientInput, challenge: any): RateLimitResult {
  return {
    allowed: false,
    blocked: false,
    challenged: true,
    statusCode: 429,
    headers: {
      'Content-Type': 'application/javascript',
      'X-Challenge-Required': 'true',
      'X-Challenge-Type': 'javascript',
      'X-Challenge-Timeout': String(this.DEFAULT_CONFIG.challenge.durationSeconds),
    },
    reason: 'JavaScript challenge required',
    ruleId: 'challenge-required',
    metadata: { ip: client.ipAddress, challengeId: challenge.id },
  };
}
