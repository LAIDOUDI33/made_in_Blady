import { NextRequest, NextResponse } from 'next/server';
import { apiKeyManager } from '@/lib/api-marketplace/keyManager';
import { checkRateLimit, getRateLimitHeaders, createRateLimitResponse } from '@/lib/api-marketplace/rateLimiter';

/**
 * API Middleware for AlgeriaTrade Developer Portal
 * 
 * This middleware handles:
 * - API Key authentication
 * - Rate limiting per key
 * - IP whitelist validation
 * - Request logging
 * - CORS headers for API routes
 * 
 * Apply to: /api/v1/* routes
 */

// Paths that don't require authentication (public endpoints)
const PUBLIC_PATHS = [
  '/api/v1/health',
  '/api/v1/status',
  '/api/v1/docs',
  '/api/v1/openapi.json',
];

// CORS configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400', // 24 hours
};

export async function apiMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Only apply to API v1 routes
  const { pathname } = request.nextUrl;
  
  if (!pathname.startsWith('/api/v1/')) {
    return null; // Let other middleware handle it
  }

  // Handle preflight requests (CORS)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  // Skip authentication for public endpoints
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  
  if (isPublicPath) {
    const response = NextResponse.next();
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Extract API key from header (try multiple formats)
  const apiKey = extractApiKey(request);
  
  if (!apiKey) {
    return createErrorResponse({
      error: 'API key required',
      code: 'MISSING_API_KEY',
      message: 'Please provide an API key in the X-API-Key or Authorization header.',
      status: 401,
      headers: {
        ...CORS_HEADERS,
        'WWW-Authenticate': 'ApiKey realm="AlgeriaTrade API"',
      },
    });
  }

  // Validate API key
  const startTime = Date.now();
  const validation = await apiKeyManager.validateApiKey(apiKey);
  
  if (!validation.valid) {
    return createErrorResponse({
      error: validation.error || 'Authentication failed',
      code: 'INVALID_API_KEY',
      message: 'The provided API key is invalid or has been revoked.',
      status: 401,
      headers: CORS_HEADERS,
    });
  }

  // Check IP whitelist
  const ip = getClientIp(request);
  if (!apiKeyManager.isIpAllowed(ip, validation.apiKey?.allowedIps)) {
    return createErrorResponse({
      error: 'IP address not allowed',
      code: 'IP_FORBIDDEN',
      message: `Your IP address (${ip}) is not in the allowed list for this API key.`,
      status: 403,
      headers: CORS_HEADERS,
    });
  }

  // Check rate limit
  const rateLimitResult = checkRateLimit(
    validation.apiKey!.id,
    validation.apiKey!.rateLimit
  );

  if (!rateLimitResult.allowed) {
    return createErrorResponse({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMITED',
      message: `You have exceeded the rate limit. Please retry after ${rateLimitResult.retryAfter || 60} seconds.`,
      status: 429,
      headers: {
        ...CORS_HEADERS,
        ...getRateLimitHeaders(rateLimitResult),
        'Retry-After': String(rateLimitResult.retryAfter || 60),
      },
    });
  }

  // Create response with all necessary headers
  const response = NextResponse.next();
  
  // Add CORS headers
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add rate limit headers
  Object.entries(getRateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add custom headers for downstream route handlers
  response.headers.set('X-API-Owner-Id', validation.apiKey!.ownerId);
  response.headers.set('X-API-Key-Id', validation.apiKey!.id);
  response.headers.set('X-API-Key-Prefix', validation.apiKey!.keyPrefix);

  // Add request ID for tracing
  const requestId = request.headers.get('X-Request-ID') || generateRequestId();
  response.headers.set('X-Request-ID', requestId);

  // Log usage asynchronously (don't block the response)
  const responseTime = Date.now() - startTime;
  logApiUsage({
    apiKeyId: validation.apiKey!.id,
    endpoint: pathname,
    method: request.method,
    ip,
    userAgent: request.headers.get('user-agent') || undefined,
    responseTime,
  }).catch(console.error);

  return response;
}

/**
 * Extract API key from various header formats
 */
function extractApiKey(request: NextRequest): string | null {
  // Try X-API-Key header first (preferred)
  const xApiKey = request.headers.get('X-API-Key');
  if (xApiKey && xApiKey.trim().length > 0) {
    return xApiKey.trim();
  }

  // Try Authorization header (Bearer token format)
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      return match[1].trim();
    }
  }

  // Try api_key query parameter (less secure, but convenient)
  const { searchParams } = new URL(request.url);
  const queryKey = searchParams.get('api_key');
  if (queryKey && queryKey.trim().length > 0) {
    return queryKey.trim();
  }

  return null;
}

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to connection info
  // Note: In Next.js middleware, we don't have direct access to socket
  // so we use a placeholder that will be updated by the server
  return request.ip || 'unknown';
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a standardized error response
 */
interface ErrorResponseOptions {
  error: string;
  code: string;
  message?: string;
  status: number;
  headers?: Record<string, string>;
}

function createErrorResponse(options: ErrorResponseOptions): NextResponse {
  const body = {
    success: false,
    error: options.error,
    code: options.code,
    ...(options.message && { message: options.message }),
    meta: {
      timestamp: new Date().toISOString(),
      requestId: options.headers?.['X-Request-ID'] || generateRequestId(),
    },
  };

  return new NextResponse(JSON.stringify(body), {
    status: options.status,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Log API usage asynchronously
 */
async function logApiUsage(params: {
  apiKeyId: string;
  endpoint: string;
  method: string;
  ip: string;
  userAgent?: string;
  responseTime: number;
}): Promise<void> {
  try {
    await apiKeyManager.recordUsage({
      apiKeyId: params.apiKeyId,
      endpoint: params.endpoint,
      method: params.method,
      statusCode: 200, // Will be updated by actual response
      responseTime: params.responseTime,
      ip: params.ip,
      userAgent: params.userAgent,
    });
  } catch (error) {
    // Don't let logging errors affect the API response
    console.error('Failed to log API usage:', error);
  }
}

// Export utilities for use in route handlers
export { extractApiKey, getClientIp, generateRequestId };
export default apiMiddleware;
