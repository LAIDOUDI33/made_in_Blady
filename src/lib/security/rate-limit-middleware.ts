/**
 * Next.js Middleware Integration for Redis Rate Limiter v2
 * 
 * Provides middleware-compatible functions for:
 * - API route protection
 * - Route handler integration
 * - Response header injection
 * - Automatic endpoint type detection
 * 
 * @version 2.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimitV2,
  getRateLimitStatusV2,
  resetRateLimitV2,
  getRateLimiterHealth,
  getRateLimiterMetricsV2,
  RedisRateLimitConfigV2,
  RedisRateLimitResultV2,
  initRateLimiterV2,
} from './redis-rate-limiter-v2';

// ===========================================
// Pre-configured Rate Limits
// ===========================================

export const RATE_LIMIT_CONFIGS: Record<string, RedisRateLimitConfigV2> = {
  // Global default
  global: {
    windowMs: 60_000,      // 1 minute
    maxRequests: 100,
    message: 'Trop de requêtes. Veuillez réessayer dans une minute.',
  },

  // Authentication endpoints (strict)
  login: {
    windowMs: 15 * 60_000, // 15 minutes
    maxRequests: 5,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    distributedLock: true,
  },
  register: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 3,
    message: "Trop de tentatives d'inscription. Veuillez réessager dans une heure.",
    distributedLock: true,
  },
  passwordReset: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 3,
    message: 'Trop de demandes de réinitialisation. Veuillez réessayer dans une heure.',
    distributedLock: true,
  },
  emailVerification: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 5,
    message: 'Trop de demandes de vérification. Veuillez réessayer dans une heure.',
  },

  // Two-factor authentication
  twoFactorSetup: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 5,
    message: 'Trop de tentatives de configuration 2FA. Veuillez réessayer dans une heure.',
  },
  twoFactorVerify: {
    windowMs: 15 * 60_000, // 15 minutes
    maxRequests: 10,
    message: 'Trop de tentatives de vérification. Veuillez réessager dans 15 minutes.',
  },

  // Business operations
  contactSupplier: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 20,
    message: 'Limite de contacts atteinte. Veuillez réessayer plus tard.',
  },
  postRFQ: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 10,
    message: "Limite de demandes de devis atteinte. Veuillez réessayer plus tard.",
  },
  sendQuotation: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 30,
    message: 'Limite de devis envoyés atteinte. Veuillez réessayer plus tard.',
  },
  submitReview: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 10,
    message: "Trop d'avis soumis. Veuillez réessayer plus tard.",
  },

  // Search and browsing (higher limits)
  search: {
    windowMs: 60_000,      // 1 minute
    maxRequests: 30,
    message: 'Trop de recherches. Veuillez ralentir.',
    localCacheTtl: 500,    // Aggressive caching for search
  },
  apiGeneral: {
    windowMs: 60_000,      // 1 minute
    maxRequests: 200,
    message: "Limite d'API atteinte. Veuillez réessayer dans une minute.",
  },

  // Admin protection (very strict!)
  adminLogin: {
    windowMs: 15 * 60_000, // 15 minutes
    maxRequests: 3,
    message: 'Tentatives de connexion administrateur bloquées. Contactez le support si nécessaire.',
    distributedLock: true,
  },
  adminAction: {
    windowMs: 60_000,      // 1 minute
    maxRequests: 50,
    message: "Trop d'actions administratives. Veuillez ralentir.",
  },

  // File uploads
  fileUpload: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 50,
    message: 'Limite de téléchargement atteinte. Veuillez réessayer plus tard.',
  },

  // Messages
  sendMessage: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 100,
    message: 'Trop de messages envoyés. Veuillez réessayer plus tard.',
  },

  // AI/Chatbot endpoints
  chatbotMessage: {
    windowMs: 60_000,      // 1 minute
    maxRequests: 20,
    message: "Trop de messages au chatbot. Veuillez patienter.",
  },

  // Payment processing (very strict)
  paymentProcess: {
    windowMs: 60 * 60_000, // 1 hour
    maxRequests: 10,
    message: 'Trop de tentatives de paiement. Veuillez réessayer plus tard.',
    distributedLock: true,
  },
};

// ===========================================
// Helper Functions
// ===========================================

/**
 * Extract client identifier from request
 */
export function extractClientIdentifier(req: NextRequest): string {
  // Priority order:
  // 1. User ID from session/token (if authenticated)
  // 2. API key (for API marketplace)
  // 3. IP address with user-agent hash
  
  const authHeader = req.headers.get('authorization');
  const apiKey = req.headers.get('x-api-key');
  
  if (apiKey) {
    return `api:${apiKey}`;
  }
  
  if (authHeader?.startsWith('Bearer ')) {
    // In production, decode JWT to get user ID
    // For now, use token hash
    return `user:${authHeader.substring(7).substring(0, 16)}`;
  }

  // Fallback to IP + user agent
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  
  // Simple hash of IP + UA for privacy
  const combined = `${ip}:${userAgent}`;
  
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `anon:${Math.abs(hash).toString(16)}`;
}

/**
 * Determine endpoint type from request path and method
 */
export function determineEndpointType(req: NextRequest): string {
  const path = req.nextUrl.pathname;
  const method = req.method;

  // Authentication endpoints
  if (path.startsWith('/api/auth/login') && method === 'POST') return 'login';
  if (path.startsWith('/api/auth/register') && method === 'POST') return 'register';
  if (path.startsWith('/api/auth/reset-password')) return 'passwordReset';
  if (path.startsWith('/api/auth/verify-email')) return 'emailVerification';
  if (path.startsWith('/api/auth/2fa/setup')) return 'twoFactorSetup';
  if (path.startsWith('/api/auth/2fa/verify') || path.startsWith('/api/auth/2fa/login-verify')) return 'twoFactorVerify';

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

  // Chatbot/AI
  if (path.includes('chatbot/message')) return 'chatbotMessage';

  // Payments
  if (path.startsWith('/api/payments/') && !path.includes('status')) return 'paymentProcess';

  // Default to general API limit
  return 'apiGeneral';
}

// ===========================================
// Middleware Functions
// ===========================================

/**
 * Create a rate limiting middleware for Next.js API routes
 * 
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await applyRateLimit(request);
 *   if (!rateLimitResult.allowed) {
 *     return createRateLimitResponse(rateLimitResult);
 *   }
 *   // ... handle request
 * }
 * ```
 */
export async function applyRateLimit(
  req: NextRequest,
  customConfig?: RedisRateLimitConfigV2
): Promise<RedisRateLimitResultV2> {
  const identifier = extractClientIdentifier(req);
  const endpointType = determineEndpointType(req);
  const config = customConfig || RATE_LIMIT_CONFIGS[endpointType] || RATE_LIMIT_CONFIGS.global;

  return checkRateLimitV2(identifier, endpointType, config);
}

/**
 * Create rate-limited response headers
 */
export function createRateLimitHeaders(result: RedisRateLimitResultV2): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime.getTime() / 1000)),
    'X-RateLimit-Source': result.source,
    'X-RateLimit-Instance': result.instanceId,
    ...(result.latencyMs ? { 'X-RateLimit-Latency': `${result.latencyMs}ms` } : {}),
    ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}),
  };
}

/**
 * Create a JSON error response for rate limited requests
 */
export function createRateLimitResponse(
  result: RedisRateLimitResultV2,
  customMessage?: string
): NextResponse {
  const config = RATE_LIMIT_CONFIGS[determineEndpointType({ 
    nextUrl: { pathname: '' }, 
    method: 'GET',
    headers: new Headers(),
  } as NextRequest)] || RATE_LIMIT_CONFIGS.global;

  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: customMessage || config.message || 'Too many requests. Please try again later.',
      retryAfter: result.retryAfter,
      resetAt: result.resetTime.toISOString(),
      code: 'RATE_LIMIT_EXCEEDED_V2',
      source: result.source,
    },
    {
      status: 429,
      headers: {
        ...createRateLimitHeaders(result),
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Higher-order function to wrap route handlers with rate limiting
 * 
 * @example
 * ```ts
 * export const POST = withRateLimit(async (request) => {
 *   // Your handler logic
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withRateLimit<T extends NextRequest>(
  handler: (req: T, ...args: any[]) => Promise<NextResponse>,
  options?: {
    config?: RedisRateLimitConfigV2;
    customIdentifier?: (req: T) => string;
  }
) {
  return async (req: T, ...args: any[]): Promise<NextResponse> => {
    try {
      const identifier = options?.customIdentifier 
        ? options.customIdentifier(req)
        : extractClientIdentifier(req);

      const endpointType = determineEndpointType(req as unknown as NextRequest);
      const config = options?.config || RATE_LIMIT_CONFIGS[endpointType] || RATE_LIMIT_CONFIGS.global;

      const result = await checkRateLimitV2(identifier, endpointType, config);

      // Add rate limit headers to all responses
      const headers = createRateLimitHeaders(result);

      if (!result.allowed) {
        return createRateLimitResponse(result);
      }

      // Call original handler
      const response = await handler(req, ...args);

      // Add rate limit headers to successful response
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      
      // On error, allow request through but log
      return handler(req, ...args);
    }
  };
}

/**
 * Initialize rate limiter (call in layout.tsx or _app.tsx)
 */
export async function initializeRateLimiter(): Promise<void> {
  const initialized = await initRateLimiterV2({
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : undefined,
  });
  
  if (initialized) {
    console.log('✅ Rate limiter v2 initialized');
  } else {
    console.log('⚠️ Rate limiter using memory fallback mode');
  }
}

// ===========================================
// Admin/Monitoring Functions
// ===========================================

/**
 * Get current rate limiter health status
 */
export async function getHealthStatus() {
  return getRateLimiterHealth();
}

/**
 * Get detailed metrics
 */
export function getMetrics() {
  return getRateLimiterMetricsV2();
}

/**
 * Reset rate limit for a specific user/IP (admin only)
 */
export async function adminResetRateLimit(
  identifier: string,
  endpointType: string
) {
  return resetRateLimitV2(identifier, endpointType);
}

// Export types
export type {
  RedisRateLimitConfigV2,
  RedisRateLimitResultV2,
  RateLimiterHealthStatus,
  RateLimiterMetrics,
};
