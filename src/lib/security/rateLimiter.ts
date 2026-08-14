/**
 * Rate Limiter Service
 * In-memory rate limiting for API endpoints
 * For AlgeriaTrade.dz B2B Platform
 */

// Types for rate limiting
export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests allowed in window
  message?: string;      // Custom error message (French)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
  retryAfter?: number;   // Seconds until retry is allowed
}

interface RequestRecord {
  count: number;
  resetTime: number;     // Unix timestamp when window resets
}

// Rate limit configurations for different endpoint types
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // General limits
  global: { 
    windowMs: 60_000, 
    maxRequests: 100, 
    message: 'Trop de requêtes. Veuillez réessayer dans une minute.' 
  },
  
  // Authentication endpoints (strict)
  login: { 
    windowMs: 15 * 60_000, // 15 minutes
    maxRequests: 5, 
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.' 
  },
  register: { 
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 3, 
    message: 'Trop de tentatives d\'inscription. Veuillez réessayer dans une heure.' 
  },
  passwordReset: { 
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 3, 
    message: 'Trop de demandes de réinitialisation. Veuillez réessayer dans une heure.' 
  },
  emailVerification: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 5,
    message: 'Trop de demandes de vérification. Veuillez réessayer dans une heure.'
  },
  
  // 2FA endpoints (very strict)
  twoFactorSetup: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 5,
    message: 'Trop de tentatives de configuration 2FA. Veuillez réessayer dans une heure.'
  },
  twoFactorVerify: {
    windowMs: 15 * 60_000, // 15 minutes
    maxRequests: 10,
    message: 'Trop de tentatives de vérification. Veuillez réessayer dans 15 minutes.'
  },
  
  // Business operations
  contactSupplier: { 
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 20, 
    message: 'Limite de contacts atteinte. Veuillez réessayer plus tard.' 
  },
  postRFQ: { 
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 10, 
    message: 'Limite de demandes de devis atteinte. Veuillez réessayer plus tard.' 
  },
  sendQuotation: { 
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 30, 
    message: 'Limite de devis envoyés atteinte. Veuillez réessayer plus tard.' 
  },
  submitReview: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 10,
    message: 'Trop d\'avis soumis. Veuillez réessayer plus tard.'
  },
  
  // Search and browsing
  search: { 
    windowMs: 60_000, // 1 minute
    maxRequests: 30, 
    message: 'Trop de recherches. Veuillez ralentir.' 
  },
  apiGeneral: { 
    windowMs: 60_000, // 1 minute
    maxRequests: 200, 
    message: 'Limite d\'API atteinte. Veuillez réessayer dans une minute.' 
  },
  
  // Admin protection (very strict!)
  adminLogin: { 
    windowMs: 15 * 60_000, // 15 minutes
    maxRequests: 3, 
    message: 'Tentatives de connexion administrateur bloquées. Contactez le support si nécessaire.' 
  },
  adminAction: {
    windowMs: 60_000, // 1 minute
    maxRequests: 50,
    message: 'Trop d\'actions administratives. Veuillez ralentir.'
  },
  
  // File uploads
  fileUpload: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 50,
    message: 'Limite de téléchargement atteinte. Veuillez réessayer plus tard.'
  },
  
  // Messages
  sendMessage: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 100,
    message: 'Trop de messages envoyés. Veuillez réessayer plus tard.'
  },
};

// In-memory storage for request records
const requestStore = new Map<string, Map<string, RequestRecord>>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60_1000;

/**
 * Clean up expired entries from the store
 */
function cleanup(): void {
  const now = Date.now();
  
  for (const [endpointKey, endpointMap] of requestStore.entries()) {
    for (const [identifier, record] of endpointMap.entries()) {
      if (now > record.resetTime) {
        endpointMap.delete(identifier);
      }
    }
    
    if (endpointMap.size === 0) {
      requestStore.delete(endpointKey);
    }
  }
}

// Start cleanup interval
if (typeof globalThis !== 'undefined') {
  setInterval(cleanup, CLEANUP_INTERVAL);
}

/**
 * Check if a request is allowed under rate limits
 */
export function checkRateLimit(
  identifier: string,       // IP address or user ID
  endpointType: string,     // Key from RATE_LIMITS
  customConfig?: RateLimitConfig
): RateLimitResult {
  const config = customConfig || RATE_LIMITS[endpointType] || RATE_LIMITS.global;
  const now = Date.now();
  
  // Get or create endpoint store
  let endpointMap = requestStore.get(endpointType);
  if (!endpointMap) {
    endpointMap = new Map();
    requestStore.set(endpointType, endpointMap);
  }
  
  // Get or create record for this identifier
  let record = endpointMap.get(identifier);
  
  // If no record or window has expired, create a new one
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    endpointMap.set(identifier, record);
  }
  
  // Increment and check
  record.count++;
  
  const remaining = Math.max(0, config.maxRequests - record.count);
  const allowed = record.count <= config.maxRequests;
  
  return {
    allowed,
    remaining,
    resetTime: new Date(record.resetTime),
    limit: config.maxRequests,
    retryAfter: allowed ? undefined : Math.ceil((record.resetTime - now) / 1000),
  };
}

/**
 * Get current rate limit status without incrementing counter
 */
export function getRateLimitStatus(
  identifier: string,
  endpointType: string
): RateLimitResult | null {
  const config = RATE_LIMITS[endpointType];
  if (!config) return null;
  
  const endpointMap = requestStore.get(endpointType);
  if (!endpointMap) return null;
  
  const record = endpointMap.get(identifier);
  if (!record || Date.now() > record.resetTime) return null;
  
  return {
    allowed: record.count < config.maxRequests,
    remaining: Math.max(0, config.maxRequests - record.count),
    resetTime: new Date(record.resetTime),
    limit: config.maxRequests,
  };
}

/**
 * Reset rate limit for a specific identifier (admin use)
 */
export function resetRateLimit(
  identifier: string,
  endpointType: string
): boolean {
  const endpointMap = requestStore.get(endpointType);
  if (!endpointMap) return false;
  
  return endpointMap.delete(identifier);
}

/**
 * Get all active rate limits (for admin monitoring)
 */
export function getActiveRateLimits(): Array<{
  endpointType: string;
  identifiers: number;
}> {
  const result: Array<{ endpointType: string; identifiers: number }> = [];
  
  for (const [endpointType, endpointMap] of requestStore.entries()) {
    result.push({
      endpointType,
      identifiers: endpointMap.size,
    });
  }
  
  return result;
}

/**
 * Middleware-compatible rate limiter for Next.js
 * Returns response headers and status
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime.getTime() / 1000)),
    ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}),
  };
}

/**
 * Create a JSON error response for rate limited requests
 */
export function createRateLimitResponse(config: RateLimitConfig, result: RateLimitResult) {
  return {
    error: 'Too Many Requests',
    message: config.message || 'Trop de requêtes. Veuillez réessayer plus tard.',
    retryAfter: result.retryAfter,
    resetAt: result.resetTime.toISOString(),
    code: 'RATE_LIMIT_EXCEEDED',
  };
}

/**
 * Determine endpoint type from request path
 */
export function getEndpointTypeFromPath(path: string, method: string): string {
  // Authentication endpoints
  if (path.startsWith('/api/auth/login') && method === 'POST') return 'login';
  if (path.startsWith('/api/auth/register') && method === 'POST') return 'register';
  if (path.startsWith('/api/auth/reset-password')) return 'passwordReset';
  if (path.startsWith('/api/auth/verify-email')) return 'emailVerification';
  if (path.startsWith('/api/auth/2fa/setup')) return 'twoFactorSetup';
  if (path.startsWith('/api/auth/2fa/verify')) return 'twoFactorVerify';
  
  // Admin endpoints
  if (path.startsWith('/api/admin') && path.includes('login')) return 'adminLogin';
  if (path.startsWith('/api/admin')) return 'adminAction';
  
  // Business operations
  if (path.includes('contact-supplier')) return 'contactSupplier';
  if (path.includes('rfqs') && method === 'POST') return 'postRFQ';
  if (path.includes('quotations') && method === 'POST') return 'sendQuotation';
  if (path.includes('reviews') && method === 'POST') return 'submitReview';
  
  // Search
  if (path.includes('search')) return 'search';
  
  // File upload
  if (path.includes('upload')) return 'fileUpload';
  
  // Messages
  if (path.includes('messages') && method === 'POST') return 'sendMessage';
  
  // Default to general API limit
  return 'apiGeneral';
}
