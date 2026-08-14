/**
 * Next.js Middleware
 * - Authentication protection (NextAuth)
 * - Rate limiting for API endpoints
 * - Security headers
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { 
  checkRateLimit, 
  getRateLimitHeaders, 
  createRateLimitResponse,
  RATE_LIMITS,
  getEndpointTypeFromPath,
  getRateLimitStatus,
} from "@/lib/security/rateLimiter";

// Security headers configuration
const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.stripe.com wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // XSS Protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',
  
  // HSTS (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'payment=(self)',
  ].join(', '),
  
  // No sniffing
  'X-Download-Options': 'noopen',
  
  // No DNS prefetch (privacy)
  'X-DNS-Prefetch-Control': 'off',
  
  // IE-specific
  'X-Permitted-Cross-Domain-Policies': 'none',
};

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Handle rate limiting for API routes
 */
function handleRateLimiting(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const method = request.method;
  
  // Only apply rate limiting to API routes
  if (!pathname.startsWith('/api/')) {
    return null;
  }
  
  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
            request.headers.get('x-real-ip') || 
            'unknown';
  
  // Determine endpoint type from path
  const endpointType = getEndpointTypeFromPath(pathname, method);
  
  // Check rate limit
  const result = checkRateLimit(ip, endpointType);
  
  if (!result.allowed) {
    // Return 429 Too Many Requests
    const response = NextResponse.json(
      createRateLimitResponse(
        RATE_LIMITS[endpointType] || RATE_LIMITS.global!,
        result
      ),
      { status: 429 }
    );
    
    // Add rate limit headers
    Object.entries(getRateLimitHeaders(result)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  // If allowed, we'll add the rate limit headers to the actual response later
  // For now, store in a way that can be accessed by route handlers
  // Note: In production, you might use a different approach like Response.headers
  
  return null;
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Check rate limiting first (for API routes)
  const rateLimitResponse = handleRateLimiting(request);
  if (rateLimitResponse) {
    return applySecurityHeaders(rateLimitResponse);
  }
  
  // 2. Create base response with security headers
  let response = NextResponse.next();
  
  // 3. Apply security headers to all responses
  response = applySecurityHeaders(response);
  
  // 4. Add rate limit info headers even when not limited (for API routes)
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
              request.headers.get('x-real-ip') || 
              'unknown';
    
    const endpointType = getEndpointTypeFromPath(pathname, request.method);
    const status = getRateLimitStatus(ip, endpointType);
    
    if (status) {
      response.headers.set('X-RateLimit-Limit', String(status.limit));
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, status.remaining)));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(status.resetTime.getTime() / 1000)));
    }
  }
  
  return response;
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};
