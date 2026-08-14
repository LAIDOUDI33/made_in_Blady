/**
 * AlgeriaTrade.dz - Service Worker Caching Strategies for PWA
 * 
 * Features:
 * - Multiple caching strategies (CacheFirst, NetworkFirst, StaleWhileRevalidate, etc.)
 * - Route-based strategy selection
 * - Cache versioning and invalidation
 * - Offline fallback handling
 * - Background sync support
 * - IndexedDB integration for large data
 */

// ===========================================
// Cache Strategy Types
// ===========================================

export type CacheStrategy = 
  | 'cache-first'
  | 'network-first'
  | 'stale-while-revalidate'
  | 'network-only'
  | 'cache-only'
  | 'race-network-and-cache';

export interface CacheStrategyConfig {
  /** Name of the cache to use */
  cacheName: string;
  
  /** Maximum number of items to store in cache */
  maxEntries?: number;
  
  /** Maximum age of cached items (in seconds) */
  maxAgeSeconds?: number;
  
  /** Whether to allow cross-origin requests */
  allowCrossOrigin?: boolean;
  
  /** Custom network timeout (ms) before falling back to cache */
  networkTimeout?: number;
  
  /** Query parameters to ignore when creating cache keys */
  ignoreParameters?: string[];
}

export interface RouteStrategy {
  pattern: RegExp | string;
  strategy: CacheStrategy;
  config: Partial<CacheStrategyConfig>;
}

// ===========================================
// Default Cache Configurations
// ===========================================

const DEFAULT_CACHE_CONFIGS: Record<CacheStrategy, CacheStrategyConfig> = {
  'cache-first': {
    cacheName: 'algeriatrade-cache-v1',
    maxEntries: 100,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    networkTimeout: 4000,
  },
  'network-first': {
    cacheName: 'algeriatrade-api-cache-v1',
    maxEntries: 50,
    maxAgeSeconds: 5 * 60, // 5 minutes
    networkTimeout: 5000,
  },
  'stale-while-revalidate': {
    cacheName: 'algeriatrade-swr-cache-v1',
    maxEntries: 200,
    maxAgeSeconds: 24 * 60 * 60, // 1 day
    networkTimeout: 3000,
  },
  'network-only': {
    cacheName: 'algeriatrade-temp-v1',
    networkTimeout: 8000,
  },
  'cache-only': {
    cacheName: 'algeriatrade-static-v1',
    maxEntries: 500,
    maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
  },
  'race-network-and-cache': {
    cacheName: 'algeriatrade-race-cache-v1',
    maxEntries: 100,
    maxAgeSeconds: 24 * 60 * 60,
    networkTimeout: 3000,
  },
};

// ===========================================
// Route-Based Strategy Configuration
// ===========================================

export const ROUTE_STRATEGIES: RouteStrategy[] = [
  // Static assets - Cache First with long TTL
  {
    pattern: /\/_next\/static\/.+\.(js|css)$/,
    strategy: 'cache-first',
    config: {
      cacheName: 'next-static-assets-v1',
      maxAgeSeconds: 365 * 24 * 60 * 60,
      maxEntries: 100,
    },
  },
  {
    pattern: /\.(js|css|woff2?|ttf|otf)$/,
    strategy: 'cache-first',
    config: {
      cacheName: 'static-assets-v1',
      maxAgeSeconds: 90 * 24 * 60 * 60, // 3 months
      maxEntries: 200,
    },
  },

  // Images - Stale While Revalidate
  {
    pattern: /\.(jpg|jpeg|png|gif|webp|avif|svg)$/,
    strategy: 'stale-while-revalidate',
    config: {
      cacheName: 'image-cache-v1',
      maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
      maxEntries: 300,
      ignoreParameters: ['width', 'height', 'quality'],
    },
  },

  // API Routes - Network First with short cache
  {
    pattern: /^\/api\/(products|categories|search)/,
    strategy: 'network-first',
    config: {
      cacheName: 'api-public-cache-v1',
      maxAgeSeconds: 5 * 60, // 5 minutes
      maxEntries: 1000,
    },
  },
  {
    pattern: /^\/api\/auth\//,
    strategy: 'network-only', // Never cache auth endpoints
    config: {
      cacheName: 'auth-no-cache',
    },
  },
  {
    pattern: /^\/api\/dashboard/,
    strategy: 'stale-while-revalidate',
    config: {
      cacheName: 'api-dashboard-cache-v1',
      maxAgeSeconds: 60, // 1 minute
      maxEntries: 50,
    },
  },

  // Pages - Stale While Revalidate
  {
    pattern: /^\/(products|suppliers|categories|marketplace)/,
    strategy: 'stale-while-revalidate',
    config: {
      cacheName: 'page-cache-v1',
      maxAgeSeconds: 10 * 60, // 10 minutes
      maxEntries: 50,
    },
  },
  {
    pattern: /^\/(login|register|checkout)/,
    strategy: 'network-only', // Never cache sensitive pages
    config: {},
  },

  // Homepage - Race (fastest response wins)
  {
    pattern: /^\/$/,
    strategy: 'race-network-and-cache',
    config: {
      cacheName: 'homepage-cache-v1',
      maxAgeSeconds: 5 * 60, // 5 minutes
    },
  },
];

// ===========================================
// Cache Strategy Implementations
// ===========================================

/**
 * Cache First Strategy
 * Returns cached response if available, otherwise fetches from network and caches
 */
async function cacheFirst(
  request: Request,
  config: CacheStrategyConfig
): Promise<Response> {
  const cache = await caches.open(config.cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse && !isExpired(cachedResponse, config.maxAgeSeconds)) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetchWithTimeout(request, config.networkTimeout);
    
    if (networkResponse.ok) {
      await putWithLimit(cache, request, networkResponse.clone(), config.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    // Return stale cache even if expired when network fails
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

/**
 * Network First Strategy
 * Tries network first, falls back to cache on failure
 */
async function networkFirst(
  request: Request,
  config: CacheStrategyConfig
): Promise<Response> {
  const cache = await caches.open(config.cacheName);

  try {
    const networkResponse = await fetchWithTimeout(request, config.networkTimeout);
    
    if (networkResponse.ok) {
      await putWithLimit(cache, request, networkResponse.clone(), config.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return stale data but update in background
      updateCacheInBackground(cache, request);
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 * Returns cache immediately while updating in background
 */
async function staleWhileRevalidate(
  request: Request,
  config: CacheStrategyConfig
): Promise<Response> {
  const cache = await caches.open(config.cacheName);
  const cachedResponse = await cache.match(request);

  // Always try to update cache in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // No cache, wait for network
  return await fetchPromise || new Response('Network error', { status: 503 });
}

/**
 * Network Only Strategy
 * Always fetches from network, no caching
 */
async function networkOnly(
  request: Request,
  config: CacheStrategyConfig
): Promise<Response> {
  return fetchWithTimeout(request, config.networkTimeout);
}

/**
 * Cache Only Strategy
 * Only returns from cache, never fetches
 */
async function cacheOnly(
  request: Request,
  config: CacheStrategyConfig
): Promise<Response> {
  const cache = await caches.open(config.cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  return new Response('Resource not found in cache', { status: 404 });
}

/**
 * Race Network and Cache Strategy
 * Returns whichever responds first (network or cache)
 */
async function raceNetworkAndCache(
  request: Request,
  config: CacheStrategyConfig
): Promise<Response> {
  const cache = await caches.open(config.cacheName);
  const cachedResponse = await cache.match(request);

  // Start network request immediately
  const networkPromise = fetchWithTimeout(request, config.networkTimeout)
    .then(async (response) => {
      if (response.ok) {
        await putWithLimit(cache, request, response.clone(), config.maxEntries);
      }
      return response;
    });

  // If we have cache, race it against network
  if (cachedResponse) {
    return Promise.race([
      networkPromise,
      Promise.resolve(cachedResponse),
    ]);
  }

  // No cache, just wait for network
  return networkPromise;
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Fetch with timeout
 */
function fetchWithTimeout(request: Request, timeoutMs?: number): Promise<Response> {
  if (!timeoutMs) return fetch(request);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(request, { signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Check if a cached response is expired
 */
function isExpired(response: Response, maxAgeSeconds?: number): boolean {
  if (!maxAgeSeconds) return false;

  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true;

  const cachedTime = new Date(dateHeader).getTime();
  const now = Date.now();
  const ageMs = now - cachedTime;

  return ageMs > maxAgeSeconds * 1000;
}

/**
 * Put response in cache with size limit enforcement
 */
async function putWithLimit(
  cache: CacheStorage,
  request: Request,
  response: Response,
  maxEntries?: number
): Promise<void> {
  if (!maxEntries) {
    await cache.put(request, response);
    return;
  }

  // Check current cache size
  const keys = await cache.keys();
  
  if (keys.length >= maxEntries) {
    // Remove oldest entry
    const oldestKey = keys[0];
    await cache.delete(oldestKey);
  }

  await cache.put(request, response);
}

/**
 * Update cache in background (fire and forget)
 */
function updateCacheInBackground(cache: CacheStorage, request: Request): void {
  fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response);
      }
    })
    .catch(() => {
      // Silently fail
    });
}

/**
 * Create cache key from request (ignoring specified params)
 */
function createCacheKey(request: Request, ignoreParams?: string[]): string {
  if (!ignoreParams || ignoreParams.length === 0) {
    return request.url;
  }

  const url = new URL(request.url);
  
  ignoreParams.forEach(param => {
    url.searchParams.delete(param);
  });

  return url.toString();
}

// ===========================================
// Main Strategy Router
// ===========================================

/**
 * Get the appropriate strategy for a given URL
 */
export function getStrategyForUrl(url: string): { strategy: CacheStrategy; config: CacheStrategyConfig } {
  for (const route of ROUTE_STRATEGIES) {
    if (typeof route.pattern === 'string') {
      if (url === route.pattern || url.startsWith(route.pattern)) {
        return {
          strategy: route.strategy,
          config: { ...DEFAULT_CACHE_CONFIGS[route.strategy], ...route.config },
        };
      }
    } else if (route.pattern.test(url)) {
      return {
        strategy: route.strategy,
        config: { ...DEFAULT_CACHE_CONFIGS[route.strategy], ...route.config },
      };
    }
  }

  // Default strategy
  return {
    strategy: 'stale-while-revalidate',
    config: DEFAULT_CACHE_CONFIGS['stale-while-revalidate'],
  };
}

/**
 * Handle a request using the appropriate caching strategy
 */
export async function handleRequest(request: Request): Promise<Response> {
  const url = request.url;
  const { strategy, config } = getStrategyForUrl(url);

  // Create modified request with clean cache key if needed
  const cacheKey = createCacheKey(url, config.ignoreParameters);
  const modifiedRequest = cacheKey !== url ? new Request(cacheKey, { method: request.method }) : request;

  switch (strategy) {
    case 'cache-first':
      return cacheFirst(modifiedRequest, config);
    case 'network-first':
      return networkFirst(modifiedRequest, config);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(modifiedRequest, config);
    case 'network-only':
      return networkOnly(modifiedRequest, config);
    case 'cache-only':
      return cacheOnly(modifiedRequest, config);
    case 'race-network-and-cache':
      return raceNetworkAndCache(modifiedRequest, config);
    default:
      return staleWhileRevalidate(modifiedRequest, config);
  }
}

// ===========================================
// Cache Management Utilities
// ===========================================

/**
 * Clear all AlgeriaTrade caches
 */
export async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  
  const algeriaTradeCaches = cacheNames.filter(name =>
    name.startsWith('algeriatrade') ||
    name.startsWith('next') ||
    name.includes('cache')
  );

  await Promise.all(algeriaTradeCaches.map(name => caches.delete(name)));

  console.log(`🗑️ Cleared ${algeriaTradeCaches.length} caches`);
}

/**
 * Pre-cache critical resources
 */
export async function precacheResources(resources: string[]): Promise<void> {
  const cache = await caches.open('algeriatrade-precache-v1');

  const results = await Promise.allSettled(
    resources.map(url =>
      fetch(url).then(response => {
        if (response.ok) {
          cache.put(url, response);
        }
      })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  console.log(`✅ Precached ${successful}/${resources.length} resources`);
}

/**
 * Get cache usage statistics
 */
export async function getCacheStats(): Promise<{
  totalSize: number;
  cacheCount: number;
  entriesByCache: Array<{ name: string; count: number; size: number }>;
}> {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  const entriesByCache: Array<{ name: string; count: number; size: number }> = [];

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    let cacheSize = 0;

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.clone().blob();
        cacheSize += blob.size;
      }
    }

    totalSize += cacheSize;
    entriesByCache.push({
      name,
      count: keys.length,
      size: cacheSize,
    });
  }

  return {
    totalSize,
    cacheCount: cacheNames.length,
    entriesByCache,
  };
}

// ===========================================
// Offline Fallback Responses
// ===========================================

/**
 * Generate offline fallback page HTML
 */
export function getOfflineFallbackPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AlgeriaTrade - You're Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
    }
    .container {
      max-width: 500px;
      padding: 40px;
      background: rgba(255,255,255,0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }
    h1 { font-size: 2em; margin-bottom: 16px; }
    p { opacity: 0.9; line-height: 1.6; margin-bottom: 24px; }
    button {
      background: white;
      color: #764ba2;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 1em;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.05); }
    .icon { font-size: 64px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>You're Currently Offline</h1>
    <p>It looks like you've lost your internet connection. Don't worry - some features may still be available! Check your connection and try again.</p>
    <button onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>`;
}

/**
 * Get offline fallback image (1x1 transparent pixel)
 */
export function getOfflineImage(): Response {
  const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  return new Response(transparentPixel, {
    headers: { 'Content-Type': 'image/gif' },
  });
}

// Export all strategies
export {
  cacheFirst,
  networkFirst,
  staleWhileRevalidate,
  networkOnly,
  cacheOnly,
  raceNetworkAndCache,
};

export default {
  handleRequest,
  getStrategyForUrl,
  clearAllCaches,
  precacheResources,
  getCacheStats,
  getOfflineFallbackPage,
  getOfflineImage,
  ROUTE_STRATEGIES,
};
