/**
 * Production Security Middleware - AlgeriaTrade.dz
 * Middleware de sécurité pour la production avec CSP, rate limiting, et headers de sécurité
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitStatus, createRateLimitResponse } from '@/lib/security/rateLimiter';

// Paths that don't require rate limiting
const BYPASS_PATHS = [
  '/_next',
  '/api/health',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/images/',
  '/icons/',
];

// Paths with stricter rate limiting (auth endpoints)
const AUTH_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

// Bot/scraper detection
const SUSPICIOUS_USER_AGENTS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
];

function isSuspiciousUserAgent(userAgent: string): boolean {
  const allowedBots = ['googlebot', 'bingbot', 'slurp', 'duckduckbot'];
  const lowerUA = userAgent.toLowerCase();
  
  if (allowedBots.some(bot => lowerUA.includes(bot))) {
    return false;
  }
  
  return SUSPICIOUS_USER_AGENTS.some(pattern => pattern.test(userAgent));
}

// IP blacklist
const IP_BLACKLIST = new Set<string>();
if (process.env.BLOCKED_IPS) {
  process.env.BLOCKED_IPS.split(',').forEach(ip => IP_BLACKLIST.add(ip.trim()));
}

// CSP Nonce generator
let nonceCache: string | null = null;
const NONCE_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function generateNonce(): string {
  const now = Date.now();
  if (nonceCache && (nonceCache as any)._timestamp && now - (nonceCache as any)._timestamp < NONCE_CACHE_TTL) {
    return nonceCache;
  }
  
  const nonce = crypto.randomUUID().replace(/-/g, '');
  nonceCache = nonce;
  (nonceCache as any)._timestamp = now;
  return nonceCache;
}

// Security headers configuration
function getSecurityHeaders(nonce?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  // Content Security Policy (only in production)
  if (process.env.NODE_ENV === 'production' && nonce) {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com wss:",
      "frame-src https://js.stripe.com https://*.docusign.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');
  }

  return headers;
}

export async function securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const ip = request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown';
  const userAgent = request.headers.get('user-agent') || '';

  // Check IP blacklist
  if (IP_BLACKLIST.has(ip)) {
    return new NextResponse(
      JSON.stringify({ error: 'Accès refusé' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Block suspicious bots on API routes
  if (pathname.startsWith('/api/') && isSuspiciousUserAgent(userAgent)) {
    return new NextResponse(
      JSON.stringify({ error: 'Bot détecté et bloqué' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Skip rate limiting for static assets and health checks
  const shouldBypass = BYPASS_PATHS.some(path => pathname.startsWith(path));
  if (!shouldBypass) {
    // Determine endpoint type for rate limiting
    let endpointType = 'global';
    
    if (AUTH_PATHS.some(path => pathname.startsWith(path))) {
      endpointType = 'login'; // Use strict login limits for auth
    } else if (pathname.startsWith('/api/')) {
      endpointType = 'global'; // Standard API limits
    }

    // Check rate limit
    const result = checkRateLimit(ip, endpointType);
    
    if (!result.allowed) {
      return createRateLimitResponse(
        { windowMs: 60000, maxRequests: 100, message: 'Trop de requêtes' },
        result
      );
    }
  }

  // Generate nonce for CSP
  const nonce = generateNonce();

  // Create response with security headers
  const response = NextResponse.next();
  
  const securityHeaders = getSecurityHeaders(nonce);
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Store nonce in header for use in pages
  response.headers.set('x-nonce', nonce);

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = (process.env.CORS_ORIGINS || 'https://algeriatrade.dz').split(',');
    
    if (origin && allowedOrigins.some(o => o.trim() === origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-nonce');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  // Request ID for tracing
  const requestId = crypto.randomUUID();
  response.headers.set('x-request-id', requestId);

  return null; // Continue to next middleware/handler
}

// Default export for Next.js middleware
export default async function middleware(request: NextRequest): Promise<NextResponse | undefined> {
  const result = await securityMiddleware(request);
  return result || undefined;
}

// Export utilities for use in API routes
export { generateNonce, getSecurityHeaders };
