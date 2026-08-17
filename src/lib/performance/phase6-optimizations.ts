/**
 * AlgeriaTrade.dz - Phase 6 Performance Optimizations
 * 
 * Configurations for Redis caching, rate limiting, and performance tuning
 * for Phase 6 features (Videos, Exhibitions, Shipping, Verification, etc.)
 * 
 * Configurations d'optimisation des performances pour la Phase 6
 */

// ===========================================
// CACHE CONFIGURATION TYPES
// ===========================================

export interface CacheConfig {
  /** Time-to-live in seconds */
  ttl: number;
  /** Key prefix for cache entries */
  keyPrefix: string;
  /** Whether to use stale-while-revalidate pattern */
  staleWhileRevalidate?: boolean;
  /** Stale TTL (how long to serve stale content) */
  staleTTL?: number;
  /** Maximum number of cached entries */
  maxEntries?: number;
  /** Tags for cache invalidation */
  tags?: string[];
}

export interface RateLimitConfig {
  /** Window duration in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  max: number;
  /** Custom message when limited */
  message?: string;
  /** Skip successful requests from counting */
  skipSuccessfulRequests?: boolean;
  /** Key generator function (default: IP-based) */
  keyGenerator?: (req: Request) => string;
}

export interface EndpointOptimization {
  cache?: CacheConfig;
  rateLimit?: RateLimitConfig;
  /** Enable compression for responses */
  compress?: boolean;
  /** Enable response streaming */
  stream?: boolean;
  /** Database query timeout in ms */
  queryTimeout?: number;
}

// ===========================================
// PHASE 6 CACHE CONFIGURATIONS
// ===========================================

/**
 * Redis caching strategy for Phase 6 APIs
 * Stratégie de cache Redis pour les API de la Phase 6
 */
export const phase6CacheConfig = {
  /**
   * Trending products and categories
   * Produits et catégories tendance
   */
  trending: {
    ttl: 300, // 5 minutes - trending changes frequently
    keyPrefix: 'trending',
    staleWhileRevalidate: true,
    staleTTL: 60,
    maxEntries: 50,
    tags: ['products', 'trending'],
  } as CacheConfig,

  /**
   * Market insights and analytics data
   * Données d'analyse de marché
   */
  marketInsights: {
    ttl: 3600, // 1 hour - insights are computed periodically
    keyPrefix: 'insights',
    staleWhileRevalidate: true,
    staleTTL: 300,
    maxEntries: 100,
    tags: ['analytics', 'market'],
  } as CacheConfig,

  /**
   * Shipping rates and delivery zones
   * Tarifs d'expédition et zones de livraison
   */
  shippingRates: {
    ttl: 86400, // 24 hours - rates change rarely
    keyPrefix: 'shipping',
    staleWhileRevalidate: true,
    staleTTL: 3600,
    maxEntries: 500,
    tags: ['shipping', 'rates'],
  } as CacheConfig,

  /**
   * Exhibitions and trade shows
   * Expositions et salons professionnels
   */
  exhibitions: {
    ttl: 600, // 10 minutes - moderate change frequency
    keyPrefix: 'exhibitions',
    staleWhileRevalidate: true,
    staleTTL: 120,
    maxEntries: 200,
    tags: ['events', 'exhibitions'],
  } as CacheConfig,

  /**
   * Business verification status
   * Statut de vérification des entreprises
   */
  verification: {
    ttl: 300, // 5 minutes - verification can complete anytime
    keyPrefix: 'verification',
    staleWhileRevalidate: false,
    maxEntries: 1000,
    tags: ['verification', 'business'],
  } as CacheConfig,

  /**
   * Video content metadata
   * Métadonnées du contenu vidéo
   */
  videos: {
    ttl: 1800, // 30 minutes - video metadata is stable
    keyPrefix: 'videos',
    staleWhileRevalidate: true,
    staleTTL: 300,
    maxEntries: 200,
    tags: ['media', 'videos'],
  } as CacheConfig,

  /**
   * Escrow transaction status
   * Statut des transactions en séquestre
   */
  escrow: {
    ttl: 60, // 1 minute - must be near real-time
    keyPrefix: 'escrow',
    staleWhileRevalidate: false,
    maxEntries: 5000,
    tags: ['transactions', 'escrow'],
  } as CacheConfig,

  /**
   * Inspection reports
   * Rapports d'inspection
   */
  inspections: {
    ttl: 900, // 15 minutes
    keyPrefix: 'inspections',
    staleWhileRevalidate: true,
    staleTTL: 180,
    maxEntries: 300,
    tags: ['quality', 'inspections'],
  } as CacheConfig,

  /**
   * Discovery/recommendation results
   * Résultats de découverte/recommandations
   */
  discovery: {
    ttl: 600, // 10 minutes
    keyPrefix: 'discovery',
    staleWhileRevalidate: true,
    staleTTL: 120,
    maxEntries: 1000,
    tags: ['recommendations', 'discovery'],
  } as CacheConfig,

  /**
   * Product search results
   * Résultats de recherche de produits
   */
  searchResults: {
    ttl: 120, // 2 minutes - inventory changes
    keyPrefix: 'search',
    staleWhileRevalidate: true,
    staleTTL: 60,
    maxEntries: 10000,
    tags: ['search', 'products'],
  } as CacheConfig,
};

// ===========================================
// RATE LIMITING RULES FOR PHASE 6
// ===========================================

/**
 * Rate limiting configuration for Phase 6 endpoints
 * Configuration de limitation de débit pour les endpoints Phase 6
 */
export const phase6RateLimits: Record<string, RateLimitConfig> = {
  /**
   * Video uploads - expensive operation (storage + processing)
   * Téléchargements vidéos - opération coûteuse
   */
  '/api/videos': {
    windowMs: 60000, // 1 minute window
    max: 10, // 10 uploads per minute
    message: 'Too many upload attempts. Please try again later.',
  },

  /**
   * Video processing requests
   * Demandes de traitement vidéo
   */
  '/api/videos/process': {
    windowMs: 60000,
    max: 5,
    message: 'Too many processing requests. Please wait.',
  },

  /**
   * Business verification submissions
   * Soumissions de vérification d'entreprise
   */
  '/api/verification': {
    windowMs: 3600000, // 1 hour window
    max: 5, // 5 verifications per hour
    message: 'Verification limit reached. Please try again later.',
  },

  /**
   * Verification document uploads
   * Téléchargements de documents de vérification
   */
  '/api/verification/documents': {
    windowMs: 3600000,
    max: 20,
    message: 'Document upload limit reached.',
  },

  /**
   * Exhibition CRUD operations
   * Opérations CRUD sur les expositions
   */
  '/api/exhibitions': {
    windowMs: 60000, // 1 minute window
    max: 20, // 20 requests per minute
    message: 'Too many exhibition updates. Please slow down.',
  },

  /**
   * Exhibition registration
   * Inscription aux expositions
   */
  '/api/exhibitions/register': {
    windowMs: 3600000,
    max: 10,
    message: 'Registration limit reached.',
  },

  /**
   * Shipment creation/tracking
   * Création/suivi des expéditions
   */
  '/api/shipments': {
    windowMs: 60000, // 1 minute window
    max: 30, // 30 requests per minute
    message: 'Shipment rate limit exceeded.',
  },

  /**
   * Shipping rate calculations
   * Calculs de tarifs d'expédition
   */
  '/api/shipments/rates': {
    windowMs: 60000,
    max: 60,
    message: 'Rate calculation limit reached.',
  },

  /**
   * Escrow operations (sensitive financial)
   * Opérations de séquestre (financières sensibles)
   */
  '/api/escrow': {
    windowMs: 60000,
    max: 15,
    message: 'Escrow operation limit reached.',
  },

  /**
   * Escrow payment processing
   * Traitement des paiements en séquestre
   */
  '/api/escrow/payments': {
    windowMs: 60000,
    max: 5,
    message: 'Payment processing limit reached.',
  },

  /**
   * Inspection requests
   * Demandes d'inspection
   */
  '/api/inspections': {
    windowMs: 3600000,
    max: 25,
    message: 'Inspection request limit reached.',
  },

  /**
   * Discovery/recommendation API
   * API de découverte/recommandations
   */
  '/api/discovery': {
    windowMs: 60000,
    max: 100,
    message: 'Discovery API rate limit exceeded.',
  },

  /**
   * Analytics dashboard (admin)
   * Tableau de bord analytique (admin)
   */
  '/api/admin/analytics': {
    windowMs: 60000,
    max: 60,
    message: 'Analytics rate limit exceeded.',
  },
};

// ===========================================
// ENDPOINT-SPECIFIC OPTIMIZATIONS
// ===========================================

/**
 * Complete optimization configuration by endpoint
 * Configuration complète d'optimisation par endpoint
 */
export const endpointOptimizations: Record<string, EndpointOptimization> = {
  // Search endpoints
  '/api/search': {
    cache: phase6CacheConfig.searchResults,
    rateLimit: { windowMs: 60000, max: 120 },
    compress: true,
    queryTimeout: 5000,
  },
  '/api/v1/search': {
    cache: phase6CacheConfig.searchResults,
    rateLimit: { windowMs: 60000, max: 120 },
    compress: true,
    queryTimeout: 5000,
  },

  // Products endpoints
  '/api/products': {
    cache: { ...phase6CacheConfig.searchResults, ttl: 180 },
    rateLimit: { windowMs: 60000, max: 200 },
    compress: true,
    queryTimeout: 3000,
  },
  '/api/v1/products': {
    cache: { ...phase6CacheConfig.searchResults, ttl: 180 },
    rateLimit: { windowMs: 60000, max: 200 },
    compress: true,
    queryTimeout: 3000,
  },

  // Trending endpoints
  '/api/trending': {
    cache: phase6CacheConfig.trending,
    rateLimit: { windowMs: 60000, max: 300 },
    compress: true,
    queryTimeout: 2000,
  },

  // Videos endpoints
  '/api/videos': {
    rateLimit: phase6RateLimits['/api/videos'],
    compress: true,
    stream: true,
    queryTimeout: 30000,
  },

  // Exhibitions endpoints
  '/api/exhibitions': {
    cache: phase6CacheConfig.exhibitions,
    rateLimit: phase6RateLimits['/api/exhibitions'],
    compress: true,
    queryTimeout: 3000,
  },

  // Shipping endpoints
  '/api/shipments': {
    cache: phase6CacheConfig.shippingRates,
    rateLimit: phase6RateLimits['/api/shipments'],
    compress: true,
    queryTimeout: 5000,
  },
  '/api/shipments/rates': {
    cache: phase6CacheConfig.shippingRates,
    rateLimit: phase6RateLimits['/api/shipments/rates'],
    compress: true,
    queryTimeout: 3000,
  },

  // Verification endpoints
  '/api/verification': {
    cache: phase6CacheConfig.verification,
    rateLimit: phase6RateLimits['/api/verification'],
    queryTimeout: 10000,
  },

  // Escrow endpoints
  '/api/escrow': {
    cache: phase6CacheConfig.escrow,
    rateLimit: phase6RateLimits['/api/escrow'],
    queryTimeout: 5000,
  },

  // Inspections endpoints
  '/api/inspections': {
    cache: phase6CacheConfig.inspections,
    rateLimit: phase6RateLimits['/api/inspections'],
    queryTimeout: 8000,
  },

  // Discovery endpoints
  '/api/discovery': {
    cache: phase6CacheConfig.discovery,
    rateLimit: phase6RateLimits['/api/discovery'],
    compress: true,
    queryTimeout: 4000,
  },

  // Analytics endpoints
  '/api/admin/analytics': {
    cache: phase6CacheConfig.marketInsights,
    rateLimit: phase6RateLimits['/api/admin/analytics'],
    compress: true,
    queryTimeout: 15000,
  },
  '/api/admin/analytics/sales': {
    cache: { ...phase6CacheConfig.marketInsights, ttl: 300 },
    queryTimeout: 10000,
  },
  '/api/admin/analytics/traffic': {
    cache: { ...phase6CacheConfig.marketInsights, ttl: 300 },
    queryTimeout: 10000,
  },
  '/api/admin/analytics/realtime': {
    cache: { ttl: 30, keyPrefix: 'analytics:realtime' }, // Very short cache
    queryTimeout: 5000,
  },
};

// ===========================================
// DATABASE QUERY OPTIMIZATIONS
// ===========================================

/**
 * Query optimization hints for Prisma
 * Conseils d'optimisation des requêtes pour Prisma
 */
export const queryOptimizations = {
  /**
   * Pagination settings
   * Paramètres de pagination
   */
  pagination: {
    defaultPageSize: 24,
    maxPageSize: 100,
    cursorPaginationEnabled: true,
    offsetPaginationMaxOffset: 10000,
  },

  /**
   * Select fields to reduce payload size
   * Champs à sélectionner pour réduire la taille de la charge utile
   */
  lightweightSelects: {
    productListItem: {
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        currency: true,
        thumbnailUrl: true,
        supplierName: true,
        rating: true,
        verified: true,
      },
    },
    searchResultItem: {
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        thumbnailUrl: true,
        matchScore: true,
      },
    },
  },

  /**
   * Eager loading configurations
   * Configurations de chargement anticipé
   */
  includes: {
    productDetail: {
      include: {
        supplier: { select: { id: true, name: true, verified: true, rating: true } },
        category: true,
        images: { take: 5 },
        certifications: true,
        shippingInfo: true,
      },
    },
    exhibitionDetail: {
      include: {
        organizer: true,
        exhibitors: { take: 20 },
        sponsors: true,
      },
    },
  },
};

// ===========================================
// CONNECTION POOL SETTINGS
// ===========================================

/**
 * Database connection pool configuration for high-load scenarios
 * Configuration du pool de connexions pour les scénarios à forte charge
 */
export const connectionPoolConfig = {
  development: {
    minConnections: 2,
    maxConnections: 10,
    connectionTimeout: 30000,
    idleTimeout: 600000,
    maxLifetime: 1800000,
  },
  production: {
    minConnections: 5,
    maxConnections: 50,
    connectionTimeout: 10000,
    idleTimeout: 300000,
    maxLifetime: 1800000,
  },
  highLoad: {
    minConnections: 10,
    maxConnections: 100,
    connectionTimeout: 5000,
    idleTimeout: 180000,
    maxLifetime: 900000,
  },
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Get cache configuration for an endpoint
 * Obtenir la configuration de cache pour un endpoint
 */
export function getCacheConfig(endpoint: string): CacheConfig | undefined {
  return endpointOptimizations[endpoint]?.cache;
}

/**
 * Get rate limit configuration for an endpoint
 * Obtenir la configuration de limite de débit pour un endpoint
 */
export function getRateLimitConfig(endpoint: string): RateLimitConfig | undefined {
  return endpointOptimizations[endpoint]?.rateLimit ?? phase6RateLimits[endpoint];
}

/**
 * Get full optimization config for an endpoint
 * Obtenir la configuration complète d'optimisation pour un endpoint
 */
export function getEndpointOptimization(endpoint: string): EndpointOptimization | undefined {
  return endpointOptimizations[endpoint];
}

/**
 * Generate cache key from request parameters
 * Générer une clé de cache à partir des paramètres de requête
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, string | undefined>,
  additionalSegments?: string[]
): string {
  const sortedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const segments = [prefix, ...additionalSegments].filter(Boolean);
  
  if (sortedParams) {
    segments.push(sortedParams);
  }

  return `at:${segments.join(':')}`;
}

/**
 * Calculate optimal TTL based on access patterns
 * Calculer le TTL optimal basé sur les modèles d'accès
 */
export function calculateDynamicTTL(
  baseTTL: number,
  accessFrequency: number,
  stalenessTolerance: 'low' | 'medium' | 'high' = 'medium'
): number {
  const frequencyMultiplier = Math.max(0.5, Math.min(2, accessFrequency / 100));
  
  const toleranceFactors = {
    low: 0.5,
    medium: 1,
    high: 2,
  };

  return Math.round(baseTTL * frequencyMultiplier * toleranceFactors[stalenessTolerance]);
}

/**
 * Validate rate limit headers format
 * Valider le format des en-têtes de limite de débit
 */
export function generateRateLimitHeaders(
  config: RateLimitConfig,
  currentUsage: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': config.max.toString(),
    'X-RateLimit-Remaining': Math.max(0, config.max - currentUsage).toString(),
    'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString(),
  };
}

// Export default with all configs
export default {
  cache: phase6CacheConfig,
  rateLimits: phase6RateLimits,
  endpoints: endpointOptimizations,
  queries: queryOptimizations,
  connectionPool: connectionPoolConfig,
};
