/**
 * AlgeriaTrade.dz - CDN & Edge Caching Configuration
 * 
 * Features:
 * - Multi-CDN support (Vercel Edge, Cloudflare, AWS CloudFront)
 * - Edge caching strategies
 * - Cache invalidation rules
 * - Geographic distribution
 * - Asset optimization headers
 */

// ===========================================
// CDN Configuration Types
// ===========================================

export interface CDNConfig {
  provider: 'vercel' | 'cloudflare' | 'cloudfront' | 'custom';
  domain?: string;
  zoneId?: string;
  distributionId?: string;
  
  // Caching
  cacheRules: CacheRule[];
  defaultTTL: number;
  maxTTL: number;
  
  // Edge functions
  enableEdgeFunctions: boolean;
  edgeRegions?: string[];
  
  // Image optimization
  imageOptimization: {
    enabled: boolean;
    formats: ('webp' | 'avif')[];
    quality: number;
    sizes: number[];
  };
}

export interface CacheRule {
  pattern: string | RegExp;
  ttl: number;
  staleWhileRevalidate?: number;
  staleOnError?: number;
  bypassCache?: boolean;
  cacheKey?: string;
  mustRevalidate?: boolean;
}

// ===========================================
// Default CDN Configurations
// ===========================================

export const VERCEL_CDN_CONFIG: CDNConfig = {
  provider: 'vercel',
  defaultTTL: 3600,
  maxTTL: 86400,
  enableEdgeFunctions: true,
  edgeRegions: ['iad1', 'sfo1', 'fra1', 'hnd1', 'cdg1'],
  imageOptimization: {
    enabled: true,
    formats: ['webp', 'avif'],
    quality: 80,
    sizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
  cacheRules: [
    // Static assets with content hashes (immutable)
    {
      pattern: '/_next/static/.*\\.(js|css)$',
      ttl: 31536000, // 1 year
      mustRevalidate: false,
      cacheKey: 'full-url', // Include query params for cache busting
    },
    
    // Images
    {
      pattern: '\\.(jpg|jpeg|png|gif|webp|avif|svg)$',
      ttl: 86400, // 1 day
      staleWhileRevalidate: 604800, // 7 days
      staleOnError: 86400,
    },
    
    // Fonts
    {
      pattern: '\\.(woff2?|ttf|otf|eot)$',
      ttl: 31536000, // 1 year
      mustRevalidate: false,
    },
    
    // API responses
    {
      pattern: '^/api/',
      ttl: 60, // 1 minute
      staleWhileRevalidate: 300, // 5 minutes
      bypassCache: true, // Don't cache by default, let API handle it
    },
    
    // HTML pages
    {
      pattern: '\\.html$|/$',
      ttl: 0,
      mustRevalidate: true,
    },
    
    // Sitemap & robots
    {
      pattern: '(sitemap|robots)\\.xml$',
      ttl: 86400, // Rebuild daily
      mustRevalidate: false,
    },
    
    // RSS feeds
    {
      pattern: '\\.(rss|atom|xml)$',
      ttl: 1800, // 30 minutes
      staleWhileRevalidate: 3600,
    },
  ],
};

export const CLOUDFLARE_CDN_CONFIG: CDNConfig = {
  provider: 'cloudflare',
  defaultTTL: 3600,
  maxTTL: 31536000,
  enableEdgeFunctions: true,
  imageOptimization: {
    enabled: true,
    formats: ['webp', 'avif'],
    quality: 85,
    sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  cacheRules: [
    // Static assets
    { pattern: '/_next/static/*', ttl: 31536000 },
    { pattern: '/static/*', ttl: 604800 }, // 1 week
    
    // Media files
    { pattern: '*.jpg', ttl: 2592000 }, // 30 days
    { pattern: '*.png', ttl: 2592000 },
    { pattern: '*.gif', ttl: 2592000 },
    { pattern: '*.webp', ttl: 2592000 },
    { pattern: '*.svg', ttl: 604800 },
    
    // Fonts
    { pattern: '*.woff2', ttl: 31536000 },
    { pattern: '*.woff', ttl: 31536000 },
    { pattern: '*.ttf', ttl: 31536000 },
    
    // API routes (cache at edge)
    { pattern: '/api/products/*', ttl: 300, staleWhileRevalidate: 600 },
    { pattern: '/api/categories/*', ttl: 3600, staleWhileRevalidate: 7200 },
    { pattern: '/api/search*', ttl: 60, staleWhileRevalidate: 300 },
    
    // Pages
    { pattern: '/', ttl: 0, bypassCache: true },
    { pattern: '/products/*', ttl: 900, staleWhileRevalidate: 1800 },
    { pattern: '/suppliers/*', ttl: 1800, staleWhileRevalidate: 3600 },
  ],
};

// ===========================================
// Edge Function Handlers
// ===========================================

/**
 * Vercel Edge Middleware for CDN optimization
 */
export function getEdgeHeaders(requestUrl: string): Record<string, string> {
  const url = new URL(requestUrl);
  const headers: Record<string, string> = {};

  // Determine cache strategy based on path
  if (url.pathname.match(/^\/_next\/static\//)) {
    // Immutable static assets
    headers['cache-control'] = 'public, max-age=31536000, immutable';
    headers['cdn-cache-control'] = 'public, max-age=31536000, immutable';
  } else if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
    // Images with long TTL and SWR
    headers['cache-control'] = 'public, s-maxage=86400, stale-while-revalidate=604800';
    headers['cdn-cache-control'] = 'public, s-maxage=86400, stale-while-revalidate=604800';
    headers['vary'] = 'accept-encoding';
  } else if (url.pathname.startsWith('/api/')) {
    // Short-lived API caching
    headers['cache-control'] = 'public, s-maxage=60, stale-while-revalidate=300';
    headers['vary'] = 'authorization, cookie';
  } else {
    // Default: no cache for dynamic pages
    headers['cache-control'] = 'no-store, must-revalidate';
  }

  // Security headers at edge
  headers['x-content-type-options'] = 'nosniff';
  headers['x-frame-options'] = 'DENY';
  headers['x-xss-protection'] = '1; mode=block';

  return headers;
}

/**
 * Generate Cloudflare-specific headers
 */
export function getCloudflareHeaders(pathname: string): {
  'cache-tag': string[];
  'cache-everything': string;
} {
  const tags: string[] = [];

  // Add cache tags based on path segments
  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] === 'products') {
    tags.push('products');
    if (segments[1]) {
      tags.push(`product:${segments[1]}`);
    }
  } else if (segments[0] === 'suppliers') {
    tags.push('suppliers');
    if (segments[1]) {
      tags.push(`supplier:${segments[1]}`);
    }
  } else if (segments[0] === 'api') {
    tags.push('api');
    if (segments[1]) {
      tags.push(`api:${segments[1]}`);
    }
  }

  return {
    'cache-tag': tags,
    'cache-everything': 'true',
  };
}

/**
 * Generate CloudFront cache policy
 */
export function getCloudFrontPolicy(pathname: string): {
  minTTL: number;
  maxTTL: number;
  defaultTTL: number;
  queryStringBehavior: 'all' | 'none' | 'whitelist';
  cookiesBehavior: 'all' | 'none' | 'whitelist';
  headersBehavior: 'all' | 'none' | 'whitelist';
} {
  if (pathname.match(/^\/_next\/static\//)) {
    return {
      minTTL: 31536000,
      maxTTL: 31536000,
      defaultTTL: 31536000,
      queryStringBehavior: 'none',
      cookiesBehavior: 'none',
      headersBehavior: ['host', 'accept-encoding'],
    };
  }

  if (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
    return {
      minTTL: 86400,
      maxTTL: 2592000,
      defaultTTL: 86400,
      queryStringBehavior: 'all', // For image optimization params
      cookiesBehavior: 'none',
      headersBehavior: ['accept'],
    };
  }

  if (pathname.startsWith('/api/')) {
    return {
      minTTL: 0,
      maxTTL: 300,
      defaultTTL: 60,
      queryStringBehavior: 'all',
      cookiesBehavior: 'all',
      headersBehavior: ['authorization', 'cookie'],
    };
  }

  // Default for pages
  return {
    minTTL: 0,
    maxTTL: 86400,
    defaultTTL: 0,
    queryStringBehavior: 'all',
    cookiesBehavior: 'all',
    headersBehavior: 'all',
  };
}

// ===========================================
// Cache Invalidation Utilities
// ===========================================

interface CacheInvalidationRequest {
  type: 'exact' | 'prefix' | 'tag' | 'wildcard';
  target: string;
  cdnProvider: 'vercel' | 'cloudflare' | 'cloudfront';
}

/**
 * Build cache invalidation request
 */
export function buildInvalidationRequest(
  type: CacheInvalidationRequest['type'],
  target: string,
  provider: CDNConfig['provider']
): CacheInvalidationRequest {
  return {
    type,
    target,
    cdnProvider: provider,
  };
}

/**
 * Common invalidation patterns
 */
export const INVALIDATION_PATTERNS = {
  // Product updates
  productUpdated: (productId: string) => [
    buildInvalidationRequest('exact', `/api/products/${productId}`, 'vercel'),
    buildInvalidationRequest('prefix', `/products/${productId}`, 'vercel'),
    buildInvalidationRequest('tag', `product:${productId}`, 'cloudflare'),
  ],

  // Category changes
  categoryChanged: (categoryId: string) => [
    buildInvalidationRequest('prefix', `/api/categories/${categoryId}`, 'vercel'),
    buildInvalidationRequest('tag', `category:${categoryId}`, 'cloudflare'),
  ],

  // Supplier profile update
  supplierUpdated: (supplierId: string) => [
    buildInvalidationRequest('exact', `/api/suppliers/${supplierId}`, 'vercel'),
    buildInvalidationRequest('prefix', `/suppliers/${supplierId}`, 'vercel'),
    buildInvalidationRequest('tag', `supplier:${supplierId}`, 'cloudflare'),
  ],

  // Full site invalidation (emergency)
  fullSitePurge: () => [
    buildInvalidationRequest('wildcard', '*', 'vercel'),
    buildInvalidationRequest('prefix', '', 'cloudflare'),
  ],
};

// ===========================================
// Performance Headers Generator
// ===========================================

export function generatePerformanceHeaders(options: {
  pathname: string;
  isStaticAsset: boolean;
  isAPIRoute: boolean;
  isImage: boolean;
}): Record<string, string> {
  const headers: Record<string, string> = {};

  // Core performance headers
  headers['x-request-id'] = crypto.randomUUID();
  headers['x-powered-by'] = 'AlgeriaTrade.dz';

  // Compression hint
  if (!options.isImage) {
    headers['vary'] = 'accept-encoding';
  }

  // Preload hints based on page type
  if (!options.isStaticAsset && !options.isAPIRoute) {
    headers['link'] = [
      '</fonts/inter-var-latin.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
      '</_next/static/css/main.css>; rel=preload; as=style',
    ].join(', ');
  }

  // DNS prefetch for external domains
  headers['x-dns-prefetch-control'] = 'on';

  return headers;
}

// ===========================================
// Export All
// ===========================================

export {
  VERCEL_CDN_CONFIG,
  CLOUDFLARE_CDN_CONFIG,
};

export default {
  VERCEL_CDN_CONFIG,
  CLOUDFLARE_CDN_CONFIG,
};
