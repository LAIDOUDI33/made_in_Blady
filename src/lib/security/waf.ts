/**
 * AlgeriaTrade.dz - Web Application Firewall (WAF)
 * 
 * Enterprise-grade WAF implementation providing:
 * - SQL Injection detection and prevention
 * - XSS (Cross-Site Scripting) protection
 * - CSRF (Cross-Site Request Forgery) tokens
 * - Path Traversal prevention
 * - Command Injection detection
 * - Request size limiting
 * - IP-based access control
 * - Bot detection and mitigation
 * - Geographic blocking
 * - Rate limiting integration
 * - Custom rule engine
 * - Security logging and alerting
 */

// ===========================================
// Types & Interfaces
// ===========================================

export interface WAFRequest {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: any;
  ip: string;
  userAgent: string;
  countryCode?: string;
  contentType?: string;
  contentLength?: number;
}

export interface WAFResponse {
  allowed: boolean;
  blocked: boolean;
  statusCode: number;
  reason?: string;
  ruleId?: string;
  ruleName?: string;
  action: 'allow' | 'block' | 'challenge' | 'rate_limit' | 'captcha';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface WAFFirewallRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // Higher = checked first
  action: 'allow' | 'block' | 'challenge' | 'log' | 'captcha';
  
  // Conditions (AND logic)
  conditions: Array<{
    field: 'url' | 'headers' | 'query' | 'body' | 'ip' | 'userAgent' | 'country' | 'method' | 'contentType';
    operator: 'equals' | 'contains' | 'matches' | 'startsWith' | 'endsWith' | 'in' | 'notIn' | 'exists' | 'notExists' | 'sizeGreaterThan' | 'sizeLessThan';
    value: any;
    caseSensitive?: boolean;
  }>;
  
  // Metadata
  category: 'sqli' | 'xss' | 'csrf' | 'path_traversal' | 'cmd_injection' | 'ssrf' | 'bot' | 'rate_limit' | 'geo' | 'ip_access' | 'custom';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  
  // Rate limiting (for rate_limit action)
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  
  // Statistics
  hits: number;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WAFStatistics {
  totalRequests: number;
  blockedRequests: number;
  challengedRequests: number;
  allowedRequests: number;
  topBlockedIPs: Array<{ ip: string; count: number; reason: string }>;
  topAttackedEndpoints: Array<{ endpoint: string; count: number }>;
  attackTypes: Record<string, number>;
  requestsByCountry: Record<string, number>;
  averageResponseTime: number;
  timestamp: string;
}

export interface WAFConfig {
  enabled: boolean;
  mode: 'detect' | 'prevent' | 'learning'; // detect = log only, prevent = block, learning = learn patterns
  
  // Global settings
  maxRequestBodySize: number; // bytes
  maxUrlLength: number;
  maxHeaderSize: number;
  maxHeadersCount: number;
  
  // Protection toggles
  protections: {
    sqlInjection: boolean;
    xss: boolean;
    csrf: boolean;
    pathTraversal: boolean;
    commandInjection: boolean;
    ssrf: boolean;
    botDetection: boolean;
    rateLimiting: boolean;
    geoBlocking: boolean;
    ipReputation: boolean;
  };
  
  // CSRF settings
  csrf: {
    enabled: boolean;
    tokenLength: number;
    headerName: string;
    cookieName: string;
    cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict' | 'lax' | 'none';
      domain?: string;
      path?: string;
    };
    exemptMethods: string[];
    exemptPaths: RegExp[];
  };
  
  // Rate limiting
  rateLimiting: {
    enabled: boolean;
    globalWindowMs: number;
    globalMaxRequests: number;
    perIPEWindowMs: number;
    perIPMaxRequests: number;
    perEndpointEnabled: boolean;
    perEndpointLimits: Array<{
      pattern: RegExp;
      windowMs: number;
      maxRequests: number;
    }>;
  };
  
  // Bot detection
  botDetection: {
    enabled: boolean;
    blockKnownBots: boolean;
    challengeSuspiciousBots: boolean;
    scoreThreshold: number; // 0-100, higher = more likely bot
    userAgentAnalysis: boolean;
    behaviorAnalysis: boolean;
  };
  
  // Geographic rules
  geoRules: Array<{
    countries: string[]; // ISO 3166-1 alpha-2 codes
    action: 'allow' | 'block' | 'challenge';
    excludePaths?: RegExp[];
  }>;
  
  // IP lists
  ipAllowlist: string[];
  ipBlocklist: string[];
  
  // Logging
  logging: {
    enabled: boolean;
    logAllowedRequests: boolean;
    logBlockedRequests: boolean;
    logRequestHeaders: boolean;
    logRequestBody: boolean;
    sensitiveFields: string[]; // Fields to mask in logs
  };
  
  // Alerting
  alerting: {
    enabled: boolean;
    onBlock: boolean;
    onCriticalAttack: boolean;
    onRateLimitExceeded: boolean;
    threshold: number; // Alert after N blocked requests in window
  };
}

// ===========================================
// Default Configuration
// ===========================================

const DEFAULT_CONFIG: WAFConfig = {
  enabled: true,
  mode: 'prevent',
  
  maxRequestBodySize: 10 * 1024 * 1024, // 10MB
  maxUrlLength: 2048,
  maxHeaderSize: 8192,
  maxHeadersCount: 100,
  
  protections: {
    sqlInjection: true,
    xss: true,
    csrf: true,
    pathTraversal: true,
    commandInjection: true,
    ssrf: true,
    botDetection: true,
    rateLimiting: true,
    geoBlocking: false, // Disabled by default
    ipReputation: true,
  },
  
  csrf: {
    enabled: true,
    tokenLength: 32,
    headerName: 'X-CSRF-Token',
    cookieName: '_csrf_token',
    cookieOptions: {
      httpOnly: false, // Need JS access for AJAX
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    },
    exemptMethods: ['GET', 'HEAD', 'OPTIONS'],
    exemptPaths: [/^\/api\/public\//, /^\/webhook/],
  },
  
  rateLimiting: {
    enabled: true,
    globalWindowMs: 60 * 1000, // 1 minute
    globalMaxRequests: 1000, // Per IP
    perIPEWindowMs: 60 * 1000,
    perIPMaxRequests: 200,
    perEndpointEnabled: true,
    perEndpointLimits: [
      { pattern: /^\/api\/auth\/login/, windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 login attempts per 15 min
      { pattern: /^\/api\/auth\/register/, windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 registrations per hour
      { pattern: /^\/api\/(rfq|orders|payments)/, windowMs: 60 * 1000, maxRequests: 60 }, // 60 actions per minute
      { pattern: /^\/api\/search/, windowMs: 60 * 1000, maxRequests: 120 }, // 120 searches per minute
    ],
  },
  
  botDetection: {
    enabled: true,
    blockKnownBots: true,
    challengeSuspiciousBots: true,
    scoreThreshold: 70,
    userAgentAnalysis: true,
    behaviorAnalysis: true,
  },
  
  geoRules: [],
  ipAllowlist: [],
  ipBlocklist: [],
  
  logging: {
    enabled: true,
    logAllowedRequests: false,
    logBlockedRequests: true,
    logRequestHeaders: true,
    logRequestBody: false,
    sensitiveFields: ['password', 'token', 'secret', 'apiKey', 'creditCard', 'cvv'],
  },
  
  alerting: {
    enabled: true,
    onBlock: false,
    onCriticalAttack: true,
    onRateLimitExceeded: true,
    threshold: 50, // Alert after 50 blocks in 5 minutes
  },
};

// ===========================================
// Attack Pattern Definitions
// ===========================================

const SQL_INJECTION_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /((\%27)|(\'))union/i,
  /exec(\s|\+)+(insert|update|delete|select|create|alter|drop|exec)/i,
  /((\%3C)|<)[^\n]+((\%3E)|>)/i, // Basic SQL injection in XML
];

const XSS_PATTERNS = [
  /((\%3C)|<)[^\n]+((\%3E)|>)/i, // Basic script tag
  /javascript:/i,
  /on(error|load|click|mouseover|focus|blur|submit|change|key|mouse|touch)/i,
  /((\%3C)|<).*script/i,
  /eval\s*\(/i,
  /document\.cookie/i,
  /document\.write/i,
  /expression\s*\(/i,
  /vbscript:/i,
  /data:\s*text\/html/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e[\/\\]/i,
  /%252e%252e/i,
  /..%c0%af/i,
  /..%c1%9c/i,
  /\/etc\/passwd/i,
  /\/etc\/shadow/i,
  /\/proc\/self/i,
  /windows\\system32/i,
];

const COMMAND_INJECTION_PATTERNS = [
  /;\s*(ls|cat|wget|curl|nc|netcat|bash|sh|python|perl|ruby|php|whoami|id|uname)/i,
  /\|(.*?)(ls|cat|wget|curl|nc|bash|sh|python|perl|ruby|php)/i,
  /`[^`]*`/,
  /\$\([^)]*\)/i,
  /&&\s*(rm|del|format|shutdown|reboot)/i,
  /\$\{.*\}/i,
];

const SSRF_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/i,
  /\[::1\]/i,
  /0177\.0\.0\.1/i,
  /2130706433/i,
  /0x7f000001/i,
  /169\.254\.\d+\.\d+/i, // Link-local
  /10\.\d+\.\d+\.\d+/, // Private RFC1918
  /172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/, // Private RFC1918
  /192\.168\.\d+\.\d+/, // Private RFC1918
  /metadata\.google\.internal/i,
  /169\.254\.169\.254/i, // AWS/GCP/Azure metadata
];

const KNOWN_BOT_USER_AGENTS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /harvest/i,
  /fetch/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /go-http-client/i,
  /java\/\d/i,
  /apache-httpclient/i,
  /httpclient/i,
  /scrapy/i,
  /selenium/i,
  /phantomjs/i,
  /headless/i,
  /chrome\/lighthouse/i,
];

const SUSPICIOUS_USER_AGENTS = [
  /^\s*$/, // Empty user agent
  /^-$/, // Single dash
  /^<.*>$/, // HTML-like user agent
  /^[^a-zA-Z]/, // Doesn't start with letter
  /.{500,}/, // Very long user agent
];

// ===========================================
// Main WAF Class
// ===========================================

class WebApplicationFirewall {
  private config: WAFConfig;
  private customRules: Map<string, WAFFirewallRule> = new Map();
  private statistics: WAFStatistics;
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private blockedIPs: Map<string, { until: number; reason: string }> = new Map();
  private captchaChallenges: Map<string, { challenge: string; expires: number }> = new Map();

  constructor(config?: Partial<WAFConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.statistics = {
      totalRequests: 0,
      blockedRequests: 0,
      challengedRequests: 0,
      allowedRequests: 0,
      topBlockedIPs: [],
      topAttackedEndpoints: [],
      attackTypes: {},
      requestsByCountry: {},
      averageResponseTime: 0,
      timestamp: new Date().toISOString(),
    };

    // Load built-in rules
    this.loadBuiltInRules();
  }

  /**
   * Main request inspection method
   */
  async inspectRequest(request: Partial<WAFRequest>): Promise<WAFResponse> {
    const startTime = Date.now();
    
    // Build complete request object
    const wafRequest: WAFRequest = {
      id: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      method: request.method || 'GET',
      url: request.url || '/',
      headers: request.headers || {},
      query: request.query || {},
      body: request.body,
      ip: request.ip || 'unknown',
      userAgent: request.userAgent || '',
      contentType: request.contentType,
      contentLength: request.contentLength,
    };

    // Update statistics
    this.statistics.totalRequests++;

    // Quick checks first (fastest to evaluate)
    
    // 1. Check if WAF is enabled
    if (!this.config.enabled) {
      return this.createResponse('allow', wafRequest, startTime);
    }

    // 2. IP Allowlist/Blocklist check
    const ipCheck = this.checkIPAccess(wafRequest);
    if (!ipCheck.allowed) {
      return ipCheck.response!;
    }

    // 3. Check if IP is temporarily blocked
    const tempBlockCheck = this.checkTemporaryBlock(wafRequest);
    if (!tempBlockCheck.allowed) {
      return tempBlockCheck.response!;
    }

    // 4. Size validations
    const sizeCheck = this.checkRequestSizes(wafRequest);
    if (!sizeCheck.allowed) {
      return sizeCheck.response!;
    }

    // 5. Geographic blocking
    if (this.config.protections.geoBlocking && this.config.geoRules.length > 0) {
      const geoCheck = this.checkGeoRules(wafRequest);
      if (!geoCheck.allowed) {
        return geoCheck.response!;
      }
    }

    // 6. Bot detection
    if (this.config.protections.botDetection && this.config.botDetection.enabled) {
      const botCheck = this.checkBotDetection(wafRequest);
      if (!botCheck.allowed) {
        return botCheck.response!;
      }
    }

    // 7. Rate limiting
    if (this.config.protections.rateLimiting && this.config.rateLimiting.enabled) {
      const rateLimitCheck = this.checkRateLimit(wafRequest);
      if (!rateLimitCheck.allowed) {
        return rateLimitCheck.response!;
      }
    }

    // 8. Attack pattern detection (order matters for performance)
    
    // SQL Injection
    if (this.config.protections.sqlInjection) {
      const sqliCheck = this.checkSQLInjection(wafRequest);
      if (!sqliCheck.allowed) {
        return sqliCheck.response!;
      }
    }

    // XSS
    if (this.config.protections.xss) {
      const xssCheck = this.checkXSS(wafRequest);
      if (!xssCheck.allowed) {
        return xssCheck.response!;
      }
    }

    // Path Traversal
    if (this.config.protections.pathTraversal) {
      const pathCheck = this.checkPathTraversal(wafRequest);
      if (!pathCheck.allowed) {
        return pathCheck.response!;
      }
    }

    // Command Injection
    if (this.config.protections.commandInjection) {
      const cmdCheck = this.checkCommandInjection(wafRequest);
      if (!cmdCheck.allowed) {
        return cmdCheck.response!;
      }
    }

    // SSRF
    if (this.config.protections.ssrf) {
      const ssrfCheck = this.checkSSRF(wafRequest);
      if (!ssrfCheck.allowed) {
        return ssrfCheck.response!;
      }
    }

    // 9. CSRF Token validation (for state-changing requests)
    if (this.config.protections.csrf && this.config.csrf.enabled) {
      const csrfCheck = this.checkCSRF(wafRequest);
      if (!csrfCheck.allowed) {
        return csrfCheck.response!;
      }
    }

    // 10. Custom rules evaluation
    for (const [ruleId, rule] of this.customRules) {
      if (rule.enabled && this.evaluateRule(rule, wafRequest)) {
        return this.handleRuleMatch(rule, wafRequest, startTime);
      }
    }

    // Request passed all checks
    return this.createResponse('allow', wafRequest, startTime);
  }

  // ===========================================
  // CSRF Token Management
  // ===========================================

  generateCSRFToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < this.config.csrf.tokenLength; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  validateCSRFToken(token: string, sessionToken?: string): boolean {
    if (!token) return false;
    
    // In production, compare against server-stored token
    // For now, validate format
    return token.length === this.config.csrf.tokenLength && /^[A-Za-z0-9]+$/.test(token);
  }

  getCSRFCookieOptions(): CookieOptions {
    return this.config.csrf.cookieOptions;
  }

  // ===========================================
  // CAPTCHA Challenge Management
  // ===========================================

  generateCaptchaChallenge(ip: string): { challengeId: string; imageData: string } {
    const challengeId = `captcha_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const challenge = Math.random().toString(36).substring(2, 8); // Simple numeric captcha
    
    this.captchaChallenges.set(challengeId, {
      challenge,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    // In production, generate actual image
    return {
      challengeId,
      imageData: `data:image/svg+xml;base64,${Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80">
          <text x="10" y="50" font-family="monospace" font-size="40" fill="#333">${challenge}</text>
        </svg>`
      ).toString('base64')}`,
    };
  }

  validateCaptcha(challengeId: string, answer: string): boolean {
    const stored = this.captchaChallenges.get(challengeId);
    
    if (!stored || Date.now() > stored.expires) {
      this.captchaChallenges.delete(challengeId);
      return false;
    }

    const valid = stored.challenge === answer.toLowerCase();
    this.captchaChallenges.delete(challengeId);
    
    return valid;
  }

  // ===========================================
  // Rule Management
  // ===========================================

  addRule(rule: Omit<WAFFirewallRule, 'id' | 'hits' | 'createdAt' | 'updatedAt'>): WAFFirewallRule {
    const newRule: WAFFirewallRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      hits: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.customRules.set(newRule.id, newRule);
    return newRule;
  }

  removeRule(ruleId: string): boolean {
    return this.customRules.delete(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<Omit<WAFFirewallRule, 'id' | 'createdAt'>>): WAFFirewallRule | null {
    const rule = this.customRules.get(ruleId);
    if (!rule) return null;

    Object.assign(rule, updates, { updatedAt: new Date().toISOString() });
    return rule;
  }

  getRules(): WAFFirewallRule[] {
    return Array.from(this.customRules.values()).sort((a, b) => b.priority - a.priority);
  }

  getRule(ruleId: string): WAFFirewallRule | undefined {
    return this.customRules.get(ruleId);
  }

  enableRule(ruleId: string): boolean {
    const rule = this.customRules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      rule.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  disableRule(ruleId: string): boolean {
    const rule = this.customRules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      rule.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // ===========================================
  // IP Management
  // ===========================================

  blockIP(ip: string, durationMinutes: number = 60, reason: string = 'Manual block'): void {
    this.blockedIPs.set(ip, {
      until: Date.now() + durationMinutes * 60 * 1000,
      reason,
    });
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
  }

  isIPBlocked(ip: string): boolean {
    const blocked = this.blockedIPs.get(ip);
    return blocked !== undefined && blocked.until > Date.now();
  }

  addToAllowlist(ip: string): void {
    if (!this.config.ipAllowlist.includes(ip)) {
      this.config.ipAllowlist.push(ip);
    }
  }

  removeFromAllowlist(ip: string): void {
    const index = this.config.ipAllowlist.indexOf(ip);
    if (index > -1) {
      this.config.ipAllowlist.splice(index, 1);
    }
  }

  addToBlocklist(ip: string): void {
    if (!this.config.ipBlocklist.includes(ip)) {
      this.config.ipBlocklist.push(ip);
    }
  }

  removeFromBlocklist(ip: string): void {
    const index = this.config.ipBlocklist.indexOf(ip);
    if (index > -1) {
      this.config.ipBlocklist.splice(index, 1);
    }
  }

  // ===========================================
  // Statistics & Reporting
  // ===========================================

  getStatistics(): WAFStatistics {
    return { ...this.statistics };
  }

  resetStatistics(): void {
    this.statistics = {
      totalRequests: 0,
      blockedRequests: 0,
      challengedRequests: 0,
      allowedRequests: 0,
      topBlockedIPs: [],
      topAttackedEndpoints: [],
      attackTypes: {},
      requestsByCountry: {},
      averageResponseTime: 0,
      timestamp: new Date().toISOString(),
    };
  }

  getBlockedIPs(limit: number = 50): Array<{ ip: string; until: number; reason: string }> {
    const now = Date.now();
    return Array.from(this.blockedIPs.entries())
      .filter(([_, block]) => block.until > now)
      .map(([ip, block]) => ({ ip, ...block }))
      .sort((a, b) => a.until - b.until)
      .slice(0, limit);
  }

  getActiveRateLimitEntries(): Array<{ key: string; count: number; resetTime: number; max: number }> {
    const now = Date.now();
    return Array.from(this.rateLimitStore.entries())
      .filter(([_, entry]) => entry.resetTime > now)
      .map(([key, entry]) => ({ key, ...entry }));
  }

  exportLogs(since: Date): Array<{ request: WAFRequest; response: WAFResponse; duration: number }> {
    // In production, would query from database/log store
    console.warn('[WAF] Export logs not implemented - would need persistent storage');
    return [];
  }

  // ===========================================
  // Configuration Management
  // ===========================================

  getConfig(): WAFConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<WAFConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  setMode(mode: 'detect' | 'prevent' | 'learning'): void {
    this.config.mode = mode;
  }

  enableProtection(protection: keyof WAFConfig['protections']): void {
    this.config.protections[protection] = true;
  }

  disableProtection(protection: keyof WAFConfig['protections']): void {
    this.config.protections[protection] = false;
  }

  // ===========================================
  // Private Methods - Checks
  // ===========================================

  private checkIPAccess(request: WAFRequest): { allowed: boolean; response?: WAFResponse } {
    // Check allowlist first
    if (this.config.ipAllowlist.length > 0 && this.config.ipAllowlist.includes(request.ip)) {
      return { allowed: true };
    }

    // Check blocklist
    if (this.config.ipBlocklist.includes(request.ip)) {
      return {
        allowed: false,
        response: this.createResponse('block', request, Date.now(), {
          reason: 'IP address is on blocklist',
          ruleId: 'ip_blocklist',
          ruleName: 'IP Blocklist',
          severity: 'high',
        }),
      };
    }

    return { allowed: true };
  }

  private checkTemporaryBlock(request: WAFRequest): { allowed: boolean; response?: WAFResponse } {
    if (this.isIPBlocked(request.ip)) {
      const blockInfo = this.blockedIPs.get(request.ip)!;
      return {
        allowed: false,
        response: this.createResponse('block', request, Date.now(), {
          reason: `Temporarily blocked: ${blockInfo.reason}`,
          ruleId: 'temp_block',
          ruleName: 'Temporary Block',
          severity: 'high',
        }),
      };
    }

    return { allowed: true };
  }

  private checkRequestSizes(request: WAFRequest): { allowed: boolean; response?: WAFResponse } {
    if (request.url.length > this.config.maxUrlLength) {
      return {
        allowed: false,
        response: this.createResponse('block', request, Date.now(), {
          reason: `URL exceeds maximum length (${this.config.maxUrlLength})`,
          ruleId: 'url_size',
          ruleName: 'URL Size Limit',
          severity: 'medium',
        }),
      };
    }

    if (request.contentLength && request.contentLength > this.config.maxRequestBodySize) {
      return {
        allowed: false,
        response: this.createResponse('block', request, Date.now(), {
          reason: `Request body exceeds maximum size (${this.config.maxRequestBodySize} bytes)`,
          ruleId: 'body_size',
          ruleName: 'Body Size Limit',
          severity: 'medium',
        }),
      };
    }

    const headerCount = Object.keys(request.headers).length;
    if (headerCount > this.config.maxHeadersCount) {
      return {
        allowed: false,
        response: this.createResponse('block', request, Date.now(), {
          reason: `Too many headers (${headerCount} > ${this.config.maxHeadersCount})`,
          ruleId: 'header_count',
          ruleName: 'Header Count Limit',
          severity: 'low',
        }),
      };
    }

    return { allowed: true };
  }

  private checkGeoRules(request: WAFRequest): { allowed: boolean; response?: WAFResponse } {
    if (!request.countryCode) {
      return { allowed: true }; // Can't determine country, allow
    }

    for (const rule of this.config.geoRules) {
      if (rule.countries.includes(request.countryCode)) {
        // Check exclusions
        const isExcluded = rule.excludePaths?.some(pattern => pattern.test(request.url));
        
        if (!isExcluded) {
          return {
            allowed: false,
            response: this.createResponse(rule.action, request, Date.now(), {
              reason: `Geographic restriction: ${request.countryCode}`,
              ruleId: 'geo_rule',
              ruleName: 'Geographic Blocking',
              severity: 'medium',
              metadata: { country: request.countryCode, action: rule.action },
            }),
          };
        }
      }
    }

    return { allowed: true };
  }

  private checkBotDetection(request: WAFRequest): { allowed: boolean; response?: WAFResponse } {
    const ua = request.userAgent;
    let botScore = 0;

    // User agent analysis
    if (this.config.botDetection.userAgentAnalysis) {
      // Known bots
      for (const pattern of KNOWN_BOT_USER_AGENTS) {
        if (pattern.test(ua)) {
          botScore += 90;
          break;
        }
      }

      // Suspicious user agents
      for (const pattern of SUSPICIOUS_USER_AGENTS) {
        if (pattern.test(ua)) {
          botScore += 40;
        }
      }
    }

    // Behavior analysis would go here (requires session history)
    // For now, just use UA analysis

    if (botScore >= this.config.botDetection.scoreThreshold) {
      const action = botScore >= 90 ? 
        (this.config.blockKnownBots ? 'block' : 'challenge') :
        (this.config.challengeSuspiciousBots ? 'challenge' : 'allow');

      if (action !== 'allow') {
        return {
          allowed: false,
          response: this.createResponse(action, request, Date.now(), {
            reason: `Bot detected (score: ${botScore})`,
            ruleId: 'bot_detection',
            ruleName: 'Bot Detection',
            severity: botScore >= 90 ? 'medium' : 'low',
            metadata: { botScore, userAgent: ua.substring(0, 100) },
          }),
        };
      }
    }

    return { allowed: true };
  }

  private checkRateLimit(request: WAFRequest): { allowed: boolean; response?: WAFResponse } {
    const now = Date.now();
    const ipKey = `ip:${request.ip}`;
    const globalKey = `global:${request.ip}`;
    const endpointKey = `endpoint:${request.method}:${request.ip}:${request.url.split('?')[0]}`;

    // Check global IP limit
    const globalEntry = this.getOrCreateRateLimitEntry(
      globalKey,
      this.config.rateLimiting.perIPEWindowMs,
      this.config.rateLimiting.perIPMaxRequests
    );

    if (globalEntry.count > globalEntry.max) {
      // Auto-block for repeated violations
      if (globalEntry.count > globalEntry.max * 2) {
        this.blockIP(request.ip, 30, 'Excessive rate limiting violations');
      }

      return {
        allowed: false,
        response: this.createResponse('rate_limit', request, Date.now(), {
          reason: 'IP rate limit exceeded',
          ruleId: 'rate_limit_ip',
          ruleName: 'IP Rate Limiting',
          severity: 'low',
          metadata: { 
            current: globalEntry.count, 
            max: globalEntry.max, 
            resetIn: Math.ceil((globalEntry.resetTime - now) / 1000) 
          },
        }),
      };
    }

    // Check per-endpoint limits
    if (this.config.rateLimiting.perEndpointEnabled) {
      for (const limit of this.config.rateLimiting.perEndpointLimits) {
        if (limit.pattern.test(request.url)) {
          const endpointEntry = this.getOrCreateRateLimitEntry(
            endpointKey,
            limit.windowMs,
            limit.maxRequests
          );

          if (endpointEntry.count > endpointEntry.max) {
            return {
              allowed: false,
              response: this.createResponse('rate_limit', request, Date.now(), {
                reason: 'Endpoint rate limit exceeded',
                ruleId: 'rate_limit_endpoint',
                ruleName: 'Endpoint Rate Limiting',
                severity: 'low',
                metadata: {
                  current: endpointEntry.count,
                  max: endpointEntry.max,
                  resetIn: Math.ceil((endpointEntry.resetTime - now) / 1000),
                  endpoint: request.url.split('?')[0],
                },
              }),
            };
          }
          
          break;
        }
      }
    }

    // Increment counters
    globalEntry.count++;
    endpointKey && this.incrementRateLimit(endpointKey);

    return { allowed: true };
  }

  private checkSQLInjection(request: WAFRequest): { allowed: boolean; response?: WAFResponse } {
    const targets = [
      request.url,
      ...Object.values(request.query),
      ...(typeof request.body === 'string' ? [request.body] : 
          typeof request.body === 'object' ? Object.values(request.body) : []),
      JSON.stringify(request.headers),
    ];

    for (const target of targets) {
      if (typeof target !== 'string') continue;
      
      for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(target)) {
          return {
            allowed: false,
            response: this.createResponse(
              this.config.mode === 'prevent' ? 'block' : 'challenge',
              request,
              Date.now(),
              {
                reason: 'SQL Injection attempt detected',
                ruleId: 'sqli_detection',
                ruleName: 'SQL Injection Protection',
                severity: 'critical',
                metadata: { pattern: pattern.toString(), matchedIn: target.substring(0, 100) },
              }
            ),
          };
        }
      }
    }

    return { allowed: true };
  }

  private checkXSS(request: WAFRequest): { allowed: boolean; response?: WAFResponse } {
    const targets = [
      request.url,
      ...Object.values(request.query),
      ...(typeof request.body === 'string' ? [request.body] : 
          typeof request.body === 'object' ? Object.values(request.body) : []),
    ];

    for (const target of targets) {
      if (typeof target !== 'string') continue;

      for (const pattern of XSS_PATTERNS) {
        if (pattern.test(target)) {
          return {
            allowed: false,
            response: this.createResponse(
              this.config.mode === 'prevent' ? 'block' : 'challenge',
              request,
              Date.now(),
              {
                reason: 'XSS attempt detected',
                ruleId: 'xss_detection',
                ruleName: 'XSS Protection',
                severity: 'high',
                metadata: { pattern: pattern.toString(), matchedIn: target.substring(0, 100) },
              }
            ),
          };
        }
      }
    }

    return { allowed: true };
  }

  private checkPathTraversal(request: WAFRequest): { allowed: boolean; response?: WAFResponse } {
    const targets = [request.url, ...Object.values(request.query)];

    for (const target of targets) {
      if (typeof target !== 'string') continue;

      for (const pattern of PATH_TRAVERSAL_PATTERNS) {
        if (pattern.test(target)) {
          return {
            allowed: false,
            response: this.createResponse(
              this.config.mode === 'prevent' ? 'block' : 'challenge',
              request,
              Date.now(),
              {
                reason: 'Path traversal attempt detected',
                ruleId: 'path_traversal',
                ruleName: 'Path Traversal Protection',
                severity: 'high',
                metadata: { pattern: pattern.toString() },
              }
            ),
          };
        }
      }
    }

    return { allowed: true };
  }

  private checkCommandInjection(request: WAFRequest): { allowed: boolean; response?: WAFResponse } {
    const targets = [
      ...Object.values(request.query),
      ...(typeof request.body === 'string' ? [request.body] : 
          typeof request.body === 'object' ? Object.values(request.body) : []),
    ];

    for (const target of targets) {
      if (typeof target !== 'string') continue;

      for (const pattern of COMMAND_INJECTION_PATTERNS) {
        if (pattern.test(target)) {
          return {
            allowed: false,
            response: this.createResponse(
              this.config.mode === 'prevent' ? 'block' : 'challenge',
              request,
              Date.now(),
              {
                reason: 'Command injection attempt detected',
                ruleId: 'cmd_injection',
                ruleName: 'Command Injection Protection',
                severity: 'critical',
                metadata: { pattern: pattern.toString() },
              }
            ),
          };
        }
      }
    }

    return { allowed: true };
  }

  private checkSSRF(request: WAFRequest): { allowed: boolean; response?: WAFResponse } {
    // Check URL parameters and body for SSRF patterns
    const targets = [
      ...Object.values(request.query),
      ...(typeof request.body === 'object' ? Object.values(request.body).filter(v => 
          typeof v === 'string' && (v.startsWith('http') || v.startsWith('https'))
        ) : []),
    ];

    for (const target of targets) {
      if (typeof target !== 'string') continue;

      for (const pattern of SSRF_PATTERNS) {
        if (pattern.test(target)) {
          return {
            allowed: false,
            response: this.createResponse(
              this.config.mode === 'prevent' ? 'block' : 'challenge',
              request,
              Date.now(),
              {
                reason: 'Server-Side Request Forgery attempt detected',
                ruleId: 'ssrf_detection',
                ruleName: 'SSRF Protection',
                severity: 'critical',
                metadata: { pattern: pattern.toString() },
              }
            ),
          };
        }
      }
    }

    return { allowed: true };
  }

  private checkCSRF(request: WAFRequest): { allowed: boolean; response?: WAFResponse } {
    // Only check state-changing methods
    if (this.config.csrf.exemptMethods.includes(request.method.toUpperCase())) {
      return { allowed: true };
    }

    // Check exempt paths
    if (this.config.csrf.exemptPaths.some(pattern => pattern.test(request.url))) {
      return { allowed: true };
    }

    // In a real implementation, we'd validate the token against the session
    // For now, just check presence for non-exempt methods
    const csrfToken = 
      request.headers[this.config.csrf.headerName.toLowerCase()] ||
      request.headers['x-csrf-token'] ||
      request.query._csrf;

    if (!csrfToken) {
      return {
        allowed: false,
        response: this.createResponse('block', request, Date.now(), {
          reason: 'Missing CSRF token',
          ruleId: 'csrf_missing',
          ruleName: 'CSRF Protection',
          severity: 'medium',
        }),
      };
    }

    // Validate token format (actual validation would be session-based)
    if (!this.validateCSRFToken(csrfToken)) {
      return {
        allowed: false,
        response: this.createResponse('block', request, Date.now(), {
          reason: 'Invalid CSRF token',
          ruleId: 'csrf_invalid',
          ruleName: 'CSRF Protection',
          severity: 'medium',
        }),
      };
    }

    return { allowed: true };
  }

  // ===========================================
  // Private Helpers
  // ===========================================

  private createResponse(
    action: WAFResponse['action'],
    request: WAFRequest,
    startTime: number,
    options?: Partial<WAFResponse>
  ): WAFResponse {
    const duration = Date.now() - startTime;
    const blocked = action === 'block' || action === 'rate_limit';

    // Update statistics
    if (blocked) {
      this.statistics.blockedRequests++;
      
      // Track blocked IPs
      const existing = this.statistics.topBlockedIPs.find(entry => entry.ip === request.ip);
      if (existing) {
        existing.count++;
      } else {
        this.statistics.topBlockedIPs.push({ ip: request.ip, count: 1, reason: options?.reason || 'Unknown' });
      }

      // Track attack types
      const attackType = options?.ruleName || 'Unknown';
      this.statistics.attackTypes[attackType] = (this.statistics.attackTypes[attackType] || 0) + 1;

      // Track attacked endpoints
      const endpoint = `${request.method} ${request.url.split('?')[0]}`;
      const existingEndpoint = this.statistics.topAttackedEndpoints.find(e => e.endpoint === endpoint);
      if (existingEndpoint) {
        existingEndpoint.count++;
      } else {
        this.statistics.topAttackedEndpoints.push({ endpoint, count: 1 });
      }
    } else if (action === 'challenge') {
      this.statistics.challengedRequests++;
    } else {
      this.statistics.allowedRequests++;
    }

    // Track by country
    if (request.countryCode) {
      this.statistics.requestsByCountry[request.countryCode] = 
        (this.statistics.requestsByCountry[request.countryCode] || 0) + 1;
    }

    // Update average response time
    this.statistics.averageResponseTime = 
      (this.statistics.averageResponseTime + duration) / 2;

    // Log if configured
    if (this.config.logging.enabled && ((blocked && this.config.logging.logBlockedRequests) || 
        (!blocked && this.config.logging.logAllowedRequests))) {
      this.logRequest(request, { ...options, action, duration } as WAFResponse);
    }

    // Trigger alerts if needed
    if (this.config.alerting.enabled && blocked) {
      this.checkAndTriggerAlert(options?.severity);
    }

    return {
      allowed: !blocked,
      blocked,
      statusCode: this.getStatusCode(action),
      reason: options?.reason,
      ruleId: options?.ruleId,
      ruleName: options?.ruleName,
      action,
      severity: options?.severity || 'low',
      metadata: options?.metadata,
    };
  }

  private getStatusCode(action: WAFResponse['action']): number {
    switch (action) {
      case 'block': return 403;
      case 'challenge': return 429;
      case 'rate_limit': return 429;
      case 'captcha': return 403;
      case 'allow': return 200;
      default: return 200;
    }
  }

  private handleRuleMatch(
    rule: WAFFirewallRule,
    request: WAFRequest,
    startTime: number
  ): WAFResponse {
    // Update rule statistics
    rule.hits++;
    rule.lastTriggered = new Date().toISOString();

    return this.createResponse(rule.action, request, startTime, {
      reason: `Custom rule triggered: ${rule.description}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity === 'info' ? 'low' : 
               rule.severity === 'critical' ? 'critical' : rule.severity,
    });
  }

  private evaluateRule(rule: WAFFirewallRule, request: WAFRequest): boolean {
    // All conditions must match (AND logic)
    return rule.conditions.every(condition => {
      const value = this.getFieldValue(request, condition.field);
      return this.evaluateCondition(value, condition);
    });
  }

  private getFieldValue(request: WAFRequest, field: WAFFirewallRule['conditions'][0]['field']): any {
    switch (field) {
      case 'url': return request.url;
      case 'headers': return JSON.stringify(request.headers);
      case 'query': return JSON.stringify(request.query);
      case 'body': return typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
      case 'ip': return request.ip;
      case 'userAgent': return request.userAgent;
      case 'country': return request.countryCode;
      case 'method': return request.method;
      case 'contentType': return request.contentType;
      default: return undefined;
    }
  }

  private evaluateCondition(value: any, condition: WAFFirewallRule['conditions'][0]): boolean {
    const { operator, operand, caseSensitive = true } = condition;
    let compareValue = value;
    let conditionValue = operand;

    if (!caseSensitive && typeof value === 'string' && typeof operand === 'string') {
      compareValue = value.toLowerCase();
      conditionValue = operand.toLowerCase();
    }

    switch (operator) {
      case 'equals':
        return compareValue === conditionValue;
      case 'contains':
        return typeof compareValue === 'string' && compareValue.includes(conditionValue as string);
      case 'matches':
        return typeof compareValue === 'string' && new RegExp(conditionValue as string).test(compareValue);
      case 'startsWith':
        return typeof compareValue === 'string' && compareValue.startsWith(conditionValue as string);
      case 'endsWith':
        return typeof compareValue === 'string' && compareValue.endsWith(conditionValue as string);
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(compareValue);
      case 'notIn':
        return !Array.isArray(conditionValue) || !conditionValue.includes(compareValue);
      case 'exists':
        return value !== undefined && value !== null;
      case 'notExists':
        return value === undefined || value === null;
      case 'sizeGreaterThan':
        return typeof value === 'number' && value > (conditionValue as number);
      case 'sizeLessThan':
        return typeof value === 'number' && value < (conditionValue as number);
      default:
        return false;
    }
  }

  private getOrCreateRateLimitEntry(key: string, windowMs: number, max: number): { count: number; resetTime: number; max: number } {
    let entry = this.rateLimitStore.get(key);
    const now = Date.now();

    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
        max,
      };
      this.rateLimitStore.set(key, entry);

      // Clean up expired entries periodically
      if (Math.random() < 0.01) { // 1% chance to clean
        this.cleanExpiredRateLimitEntries();
      }
    }

    return entry;
  }

  private incrementRateLimit(key: string): void {
    const entry = this.rateLimitStore.get(key);
    if (entry) {
      entry.count++;
    }
  }

  private cleanExpiredRateLimitEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (entry.resetTime <= now) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  private loadBuiltInRules(): void {
    // Common attack patterns as built-in rules
    
    // Block common vulnerability scanners
    this.addRule({
      name: 'Block Vulnerability Scanners',
      description: 'Blocks requests from known vulnerability scanning tools',
      enabled: true,
      priority: 100,
      action: 'block',
      conditions: [
        {
          field: 'userAgent',
          operator: 'matches',
          value: '(nikto|sqlmap|nmap|nessus|openvas|acunetix|burp|owasp|w3af)',
        },
      ],
      category: 'bot',
      severity: 'low',
      tags: ['scanner', 'reconnaissance'],
    });

    // Block directory traversal attempts on sensitive files
    this.addRule({
      name: 'Sensitive File Access',
      description: 'Blocks attempts to access sensitive files like /etc/passwd',
      enabled: true,
      priority: 90,
      action: 'block',
      conditions: [
        {
          field: 'url',
          operator: 'matches',
          value: '(\\/etc\\/(passwd|shadow|hosts)|\\/proc\\/self|\\.env|\\.git|wp-admin)',
        },
      ],
      category: 'path_traversal',
      severity: 'high',
      tags: ['sensitive-files', 'reconnaissance'],
    });

    // Challenge suspicious POST requests without referer
    this.addRule({
      name: 'Suspicious POST Without Referer',
      description: 'Challenges POST requests that lack a referer header',
      enabled: true,
      priority: 50,
      action: 'challenge',
      conditions: [
        { field: 'method', operator: 'equals', value: 'POST' },
        { field: 'headers', operator: 'notExists', value: 'referer' },
        { field: 'url', operator: 'matches', value: '^\\/api\\/' },
      ],
      category: 'custom',
      severity: 'low',
      tags: ['suspicious-behavior'],
    });
  }

  private logRequest(request: WAFRequest, response: WAFResponse): void {
    // Mask sensitive fields
    const maskedRequest = { ...request };
    if (this.config.logging.sensitiveFields.length > 0 && maskedRequest.body) {
      maskedRequest.body = this.maskSensitiveData(maskedRequest.body);
    }

    // In production, send to log aggregation service
    console.log(`[WAF] ${response.action.toUpperCase()} | ${request.method} ${request.url} | IP: ${request.ip} | Reason: ${response.reason}`);
  }

  private maskSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) return data;

    const masked = Array.isArray(data) ? [...data] : { ...data };

    for (const key of Object.keys(masked)) {
      if (this.config.logging.sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase()))) {
        (masked as any)[key] = '[MASKED]';
      } else if (typeof (masked as any)[key] === 'object') {
        (masked as any)[key] = this.maskSensitiveData((masked as any)[key]);
      }
    }

    return masked;
  }

  private checkAndTriggerAlert(severity?: string): void {
    // Implement alert triggering logic
    // Would integrate with the alert manager from monitoring module
    if (severity === 'critical' && this.config.alerting.onCriticalAttack) {
      console.error('[WAF ALERT] Critical attack detected! Immediate attention required.');
    }
  }

  private generateRequestId(): string {
    return `waf_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// ===========================================
// Types for external use
// ===========================================

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
  path?: string;
}

// ===========================================
// Singleton & Exports
// ===========================================

let wafInstance: WebApplicationFirewall | null = null;

export function getWAF(config?: Partial<WAFConfig>): WebApplicationFirewall {
  if (!wafInstance) {
    wafInstance = new WebApplicationFirewall(config);
  }
  return wafInstance;
}

// Convenience export
export const waf = getWAF();

export default {
  getWAF,
  WebApplicationFirewall,
};
