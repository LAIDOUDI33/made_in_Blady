/**
 * AlgeriaTrade.dz - Next.js Middleware
 * 
 * Features:
 * - Performance monitoring
 * - Response compression hints
 * - Cache control headers
 * - Security headers
 * - Bot detection
 * - Geographic routing (multi-tenant)
 * - A/B testing support
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  performanceMiddleware,
  finalizeMetrics,
  getHealthCheckData,
} from '@/lib/performance/middleware';

// ===========================================
// Configuration
// ===========================================

const CONFIG = {
  // Performance monitoring
  performance: {
    enabled: true,
    slowQueryThreshold: 1000,
    enableLogging: process.env.NODE_ENV === 'development',
  },

  // Security headers
  security: {
    enableCSP: true,
    enableHSTS: true,
    enableXSSProtection: true,
    allowedOrigins: [
      'https://algeriatrade.dz',
      'https://www.algeriatrade.dz',
      'https://staging.algeriatrade.dz',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
    ],
  },

  // Cache configuration
  cache: {
    staticAssets: 'public, max-age=31536000, immutable', // 1 year for hashed assets
    apiResponses: 'public, max-age=60, stale-while-revalidate=300', // 1 min + 5 min SWR
    htmlPages: 'public, max-age=0, must-revalidate', // Always revalidate HTML
    images: 'public, max-age=86400, stale-while-revalidate=604800', // 1 day + 7 days SWR
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    windowMs: 60000, // 1 minute
    maxRequests: {
      default: 100,
      api: 60,
      auth: 10,
      search: 30,
    },
  },

  // Request size limits (NEW - prevents DoS attacks)
  requestSizeLimits: {
    enabled: true,
    maxBodySizeBytes: 10 * 1024 * 1024, // 10MB max body size
    maxUrlLength: 2048, // 2KB max URL length
    // Stricter limits for sensitive endpoints
    authMaxBodySize: 1024 * 1024, // 1MB for auth endpoints
    uploadMaxBodySize: 50 * 1024 * 1024, // 50MB for upload endpoints
  },

  // Bot detection - Updated to be more permissive for SEO
  bots: {
    blockBadBots: true,
    goodBots: [
      // Major search engines (allow these)
      'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
      'yandexbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
      'applebot', 'sogou', 'exabot', 'ahrefsbot', 'semrushbot',
      'mj12bot', 'petalbot', 'ia_archiver', 'archive.org_bot'
    ],
    badBots: [
      // Known malicious bots (block these)
      'sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab', 'gobuster',
      'dirbuster', 'wfuzz', 'ffuf', 'hydra', 'medusa', 'patator',
      'brute', 'acunetix', 'nessus', 'burpsuite', 'w3af', 'arachni'
    ],
  },
};

// ===========================================
// In-Memory Rate Limiting Store
// ===========================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // New window or expired
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

// ===========================================
// Helper Functions
// ===========================================

function getRouteCategory(pathname: string): string {
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth')) return 'auth';
    if (pathname.startsWith('/api/search')) return 'search';
    return 'api';
  }
  if (pathname.startsWith('/_next/static') || pathname.startsWith('/static/')) return 'static';
  if (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) return 'image';
  return 'default';
}

function isBot(userAgent: string): boolean {
  const lowerUA = userAgent.toLowerCase();
  
  // Always allow good bots (search engines, social media crawlers)
  if (CONFIG.bots.goodBots.some(bot => lowerUA.includes(bot))) {
    return false;
  }
  
  // Block known bad/malicious bots
  if (CONFIG.bots.blockBadBots && CONFIG.bots.badBots.some(bot => lowerUA.includes(bot))) {
    return true;
  }
  
  // Only block if user-agent is empty or clearly fake (not generic bot detection)
  if (!userAgent || userAgent.length < 10) {
    return true; // Block requests with no/short user-agent
  }
  
  // Allow all other user-agents (including benign bots and scrapers)
  return false;
}

function getClientIdentifier(request: NextRequest): string {
  // Use IP + user agent as identifier
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  
  const ua = request.headers.get('user-agent') || '';
  
  return `${ip}:${ua.substring(0, 50)}`;
}

// ===========================================
// Request Size Validation (DoS Prevention)
// ===========================================

function validateRequestSize(request: NextRequest, pathname: string): { valid: boolean; error?: string } {
  if (!CONFIG.requestSizeLimits.enabled) return { valid: true };
  
  // Check URL length
  const url = request.url;
  if (url.length > CONFIG.requestSizeLimits.maxUrlLength) {
    return {
      valid: false,
      error: `URL too long. Maximum length is ${CONFIG.requestSizeLimits.maxUrlLength} characters.`,
    };
  }
  
  // Check content length header for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    
    // Determine appropriate limit based on endpoint
    let maxSize = CONFIG.requestSizeLimits.maxBodySizeBytes;
    
    if (pathname.startsWith('/api/auth')) {
      maxSize = CONFIG.requestSizeLimits.authMaxBodySize;
    } else if (pathname.includes('/upload')) {
      maxSize = CONFIG.requestSizeLimits.uploadMaxBodySize;
    }
    
    if (contentLength > maxSize) {
      return {
        valid: false,
        error: `Request body too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB for this endpoint.`,
      };
    }
  }
  
  return { valid: true };
}

// ===========================================
// Main Middleware Function
// ===========================================

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = new URL(request.url);
  const startTime = Date.now();

  // ===========================================
  // Health Check Endpoint (skip all processing)
  // ===========================================
  if (pathname === '/api/health') {
    const healthData = getHealthCheckData();
    return NextResponse.json(healthData, {
      status: healthData.status === 'healthy' ? 200 : 503,
      headers: {
        'cache-control': 'no-store',
      },
    });
  }

  // ===========================================
  // Request Size Validation (DoS Prevention)
  // ===========================================
  if (CONFIG.requestSizeLimits.enabled) {
    const sizeValidation = validateRequestSize(request, pathname);
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { error: 'Payload Too Large', message: sizeValidation.error },
        { status: 413, headers: { 'cache-control': 'no-store' } }
      );
    }
  }

  // ===========================================
  // Performance Monitoring Setup
  // ===========================================
  let metrics;
  try {
    ({ response: _, metrics } = await performanceMiddleware(request, CONFIG.performance));
  } catch (error) {
    console.error('Performance middleware error:', error);
  }

  // ===========================================
  // Bot Detection & Blocking
  // ===========================================
  const userAgent = request.headers.get('user-agent') || '';
  
  if (isBot(userAgent)) {
    return new NextResponse('Access denied', {
      status: 403,
      headers: {
        'x-blocked-reason': 'bot-detected',
        'cache-control': 'no-store',
      },
    });
  }

  // ===========================================
  // Rate Limiting
  // ===========================================
  if (CONFIG.rateLimit.enabled) {
    const category = getRouteCategory(pathname);
    const maxRequests = CONFIG.rateLimit.maxRequests[category] || CONFIG.rateLimit.maxRequests.default;
    const clientIdentifier = getClientIdentifier(request);
    
    const rateLimitResult = checkRateLimit(clientIdentifier, maxRequests, CONFIG.rateLimit.windowMs);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'retry-after': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
            'x-ratelimit-limit': String(maxRequests),
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(Math.ceil(rateLimitResult.resetTime / 1000)),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('x-ratelimit-limit', String(maxRequests));
    response.headers.set('x-ratelimit-remaining', String(rateLimitResult.remaining));
    response.headers.set('x-ratelimit-reset', String(Math.ceil(rateLimitResult.resetTime / 1000)));
    
    return finalizeMetrics(metrics!, response, CONFIG.performance);
  }

  // ===========================================
  // Static Asset Caching
  // ===========================================
  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(js|css|woff2?|ttf|eot)(\?.*)?$/)
  ) {
    const response = NextResponse.next();
    response.headers.set('cache-control', CONFIG.cache.staticAssets);
    return finalizeMetrics(metrics!, response, CONFIG.performance);
  }

  // Image caching
  if (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)(\?.*)?$/)) {
    const response = NextResponse.next();
    response.headers.set('cache-control', CONFIG.cache.images);
    response.headers.set('vary', 'accept-encoding');
    return finalizeMetrics(metrics!, response, CONFIG.performance);
  }

  // ===========================================
  // API Route Handling
  // ===========================================
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // API-specific headers
    response.headers.set('cache-control', CONFIG.cache.apiResponses);
    response.headers.set('vary', 'origin, authorization');
    
    // CORS headers for API routes
    const origin = request.headers.get('origin');
    if (origin && CONFIG.security.allowedOrigins.includes(origin)) {
      response.headers.set('access-control-allow-origin', origin);
      response.headers.set('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('access-control-allow-headers', 'content-type, authorization');
      response.headers.set('access-control-max-age', '86400');
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204 });
    }

    return finalizeMetrics(metrics!, response, CONFIG.performance);
  }

  // ===========================================
  // Page Route Handling
  // ===========================================
  const response = NextResponse.next();

  // HTML page caching
  response.headers.set('cache-control', CONFIG.cache.htmlPages);

  // ===========================================
  // Security Headers
  // ===========================================
  
  // Content Security Policy (Strengthened)
  if (CONFIG.security.enableCSP) {
    response.headers.set(
      'content-security-policy',
      [
        "default-src 'self'",
        // Removed 'unsafe-eval' - requires refactoring code that uses eval()/new Function()
        // Removed 'unsafe-inline' - requires using nonces or hashes for inline scripts
        "script-src 'self' 'nonce-${cspNonce}' https://cdn.jsdelivr.net https://analytics.google.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net", // 'unsafe-inline' needed for CSS frameworks
        "img-src 'self' data: blob: https://res.cloudinary.com https://images.algeriatrade.dz https: *.googleapis.com *.gstatic.com",
        "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
        "connect-src 'self' wss: https://api.stripe.com https://*.algeriatrade.dz",
        "frame-src https://www.youtube.com https://player.vimeo.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
        // Additional security directives
        "require-trusted-types-for 'script'", // Prevent DOM XSS
      ].join('; ')
    );
  }

  // HSTS
  if (CONFIG.security.enableHSTS && process.env.NODE_ENV === 'production') {
    response.headers.set(
      'strict-transport-security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Other security headers
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('x-xss-protection', '1; mode=block');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');

  // Remove server info
  response.headers.delete('x-powered-by');

  // ===========================================
  // Multi-Tenant / Geo Routing
  // ===========================================
  
  // Detect country from header or IP
  const countryHeader = request.headers.get('x-vercel-ip-country') ||
                       request.headers.get('x-country-code');
  
  if (countryHeader) {
    response.headers.set('x-detected-country', countryHeader);
    
    // Could redirect to country-specific subdomain here
    // Example: dz.algeriatrade.dz for Algeria
  }

  // Language preference
  const acceptLanguage = request.headers.get('accept-language') || '';
  const preferredLanguage = acceptLanguage.split(',')[0]?.split('-')[0] || 'en';
  response.headers.set('x-preferred-language', preferredLanguage);

  // ===========================================
  // Finalize and Return
  // ===========================================
  return finalizeMetrics(metrics!, response, CONFIG.performance);
}

// ===========================================
// Middleware Config
// ===========================================

export const config = {
  matcher: [
    // Match all paths except for:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder files (robots.txt, etc.)
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
