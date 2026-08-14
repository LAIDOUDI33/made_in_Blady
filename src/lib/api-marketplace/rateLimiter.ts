// In-memory rate limiter for API marketplace
// In production, use Redis for distributed rate limiting

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit entries by apiKeyId
const limiters = new Map<string, RateLimitEntry>();

// Cleanup interval (remove expired entries)
const CLEANUP_INTERVAL = 60 * 1000; // Clean up every minute

// Periodic cleanup of old entries
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of limiters.entries()) {
      if (entry.resetTime < now) {
        limiters.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

/**
 * Check if a request is allowed under the rate limit
 * 
 * @param apiKeyId - Unique identifier for the API key
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60 seconds = 1 minute)
 * @returns Rate limit result with allowance status and metadata
 */
export function checkRateLimit(
  apiKeyId: string,
  limit: number,
  windowMs: number = 60000 // 1 minute default
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const now = Date.now();
  const entry = limiters.get(apiKeyId);

  // No existing entry or entry has expired - create new
  if (!entry || entry.resetTime < now) {
    limiters.set(apiKeyId, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { 
      allowed: true, 
      remaining: limit - 1, 
      resetTime: now + windowMs 
    };
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Increment count and allow
  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get HTTP headers for rate limit information
 * These should be included in every API response
 */
export function getRateLimitHeaders(result: ReturnType<typeof checkRateLimit>): Record<string, string> {
  return {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };
}

/**
 * Create a standardized rate limit response
 */
export function createRateLimitResponse(rateLimitResult: ReturnType<typeof checkRateLimit>) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMITED',
      message: `Too many requests. Please retry after ${rateLimitResult.retryAfter || 60} seconds.`,
      retryAfter: rateLimitResult.retryAfter || 60,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...getRateLimitHeaders(rateLimitResult),
        'Retry-After': String(rateLimitResult.retryAfter || 60),
      },
    }
  );
}

/**
 * Get current rate limit status for an API key (without incrementing)
 */
export function getRateLimitStatus(apiKeyId: string): {
  remaining: number;
  resetTime: number;
  limit: number;
} | null {
  const entry = limiters.get(apiKeyId);
  
  if (!entry) {
    return null;
  }

  return {
    remaining: Math.max(0, 100 - entry.count), // Assuming default limit of 100
    resetTime: entry.resetTime,
    limit: 100,
  };
}

/**
 * Reset rate limit for an API key (admin use only)
 */
export function resetRateLimit(apiKeyId: string): boolean {
  return limiters.delete(apiKeyId);
}

/**
 * Get statistics about current rate limiter state (for monitoring)
 */
export function getRateLimiterStats(): {
  totalTrackedKeys: number;
  activeWindows: number;
} {
  const now = Date.now();
  let activeWindows = 0;

  for (const entry of limiters.values()) {
    if (entry.resetTime >= now) {
      activeWindows++;
    }
  }

  return {
    totalTrackedKeys: limiters.size,
    activeWindows,
  };
}

// Export for testing purposes
export { limiters };
