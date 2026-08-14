/**
 * AlgeriaTrade.dz - Incremental Static Regeneration (ISR) Configuration
 * 
 * Features:
 * - Route-based revalidation intervals
 * - On-demand invalidation triggers
 * - Stale-while-revalidate patterns
 * - Static page generation config
 * - Cache tagging for bulk invalidation
 * - Preview mode support
 */

// ===========================================
// Types & Interfaces
// ===========================================

export interface ISRConfig {
  /** Revalidation interval in seconds */
  revalidate: number | false;
  
  /** Whether to generate static pages at build time */
  generateAtBuild?: boolean;
  
  /** Cache tags for on-demand invalidation */
  tags?: string[];
  
  /** Whether this route supports preview mode */
  supportsPreview?: boolean;
  
  /** Custom headers for cache control */
  headers?: Record<string, string>;
}

export interface RouteISRConfig {
  pattern: RegExp;
  config: ISRConfig;
}

interface InvalidationRequest {
  type: 'tag' | 'path' | 'pattern' | 'all';
  target: string[];
  timestamp: number;
  reason: string;
  triggeredBy: 'webhook' | 'api' | 'manual' | 'schedule';
}

// ===========================================
// Default ISR Configurations
// ===========================================

const DEFAULT_INTERVALS = {
  // Very dynamic - revalidate every 10 seconds
  realtime: 10,
  
  // Frequently updated - every minute
  frequent: 60,
  
  // Updated regularly - every 5 minutes
  regular: 300,
  
  // Occasionally updated - every hour
  hourly: 3600,
  
  // Rarely changes - daily
  daily: 86400,
  
  // Almost never changes - weekly
  weekly: 604800,
  
  // Never revalidate (static)
  never: false as const,
};

// ===========================================
// Route-Based ISR Configuration
// ===========================================

export const ROUTE_ISR_CONFIGS: RouteISRConfig[] = [
  // ===========================================================
  // PUBLIC PAGES
  // ===========================================================
  
  /**
   * Homepage
   * - Shows trending products, featured suppliers
   * - Regenerate frequently to show fresh content
   */
  {
    pattern: /^\/$/,
    config: {
      revalidate: DEFAULT_INTERVALS.frequent, // 1 minute
      generateAtBuild: true,
      tags: ['homepage', 'public'],
      supportsPreview: true,
    },
  },

  /**
   * Product Listing Pages
   * - Search results, category listings
   * - Moderate revalidation for price/stock updates
   */
  {
    pattern: /^\/products/,
    config: {
      revalidate: DEFAULT_INTERVALS.regular, // 5 minutes
      generateAtBuild: true,
      tags: ['products', 'catalog'],
    },
  },

  /**
   * Individual Product Pages
   * - Product details, reviews, pricing
   * - Include product ID in tags for targeted invalidation
   */
  {
    pattern: /^\/products\/[^/]+$/,
    config: {
      revalidate: DEFAULT_INTERVALS.hourly, // 1 hour
      generateAtBuild: false, // Generate on first request
      tags: ['product-detail', 'catalog'],
    },
  },

  /**
   * Category Pages
   * - Category listings with filters
   * - Update when categories change
   */
  {
    pattern: /^\/categories/,
    config: {
      revalidate: DEFAULT_INTERVALS.hourly, // 1 hour
      generateAtBuild: true,
      tags: ['categories', 'catalog'],
    },
  },

  /**
   * Supplier/Company Pages
   * - Company profiles, product lists
   * - Update when supplier info changes
   */
  {
    pattern: /^\/(suppliers|companies)/,
    config: {
      revalidate: DEFAULT_INTERVALS.hourly, // 1 hour
      generateAtBuild: true,
      tags: ['suppliers', 'catalog'],
    },
  },

  /**
   * Marketplace Page
   * - Main marketplace view
   * - Similar to homepage frequency
   */
  {
    pattern: /^\/marketplace$/,
    config: {
      revalidate: DEFAULT_INTERVALS.frequent, // 1 minute
      generateAtBuild: true,
      tags: ['marketplace', 'public'],
    },
  },

  /**
   * Search Results
   * - Always fresh results needed
   * - Short cache to reduce server load
   */
  {
    pattern: /^\/search/,
    config: {
      revalidate: DEFAULT_INTERVALS.realtime, // 10 seconds
      generateAtBuild: false,
      tags: ['search'],
    },
  },

  // ===========================================================
  // AUTH & USER PAGES (No Caching)
  // ===========================================================

  /**
   * Authentication Pages
   * - Login, Register, Forgot Password
   * - Never cache - always dynamic
   */
  {
    pattern: /^\/(login|register|forgot-password|reset-password)/,
    config: {
      revalidate: DEFAULT_INTERVALS.never, // No caching
      generateAtBuild: false,
      headers: {
        'cache-control': 'no-store, must-revalidate',
        'pragma': 'no-cache',
      },
    },
  },

  /**
   * Checkout Flow
   * - Cart, checkout, payment
   * - Never cache - security critical
   */
  {
    pattern: /^\/(cart|checkout|payment|orders)/,
    config: {
      revalidate: DEFAULT_INTERVALS.never,
      generateAtBuild: false,
      headers: {
        'cache-control': 'no-store, no-cache, must-revalidate',
        'pragma': 'no-cache',
      },
    },
  },

  // ===========================================================
  // DASHBOARD PAGES (User-Specific)
  // ===========================================================

  /**
   * Dashboard Pages
   * - User dashboards (buyer/seller)
   * - Short cache, user-specific data
   */
  {
    pattern: /^\/dashboard/,
    config: {
      revalidate: DEFAULT_INTERVALS.frequent, // 1 minute
      generateAtBuild: false,
      tags: ['dashboard'],
      headers: {
        'cache-control': 'private, max-age=0, must-revalidate',
      },
    },
  },

  // ===========================================================
  // STATIC / INFO PAGES
  // ===========================================================

  /**
   * Information Pages
   * - About, Contact, Terms, Privacy, FAQ
   * - Very rarely change
   */
  {
    pattern: /^\/(about|contact|terms|privacy|faq|help)/,
    config: {
      revalidate: DEFAULT_INTERVALS.weekly, // 1 week
      generateAtBuild: true,
      tags: ['info', 'static'],
    },
  },

  /**
   * API Documentation Portal
   * - Developer docs
   * - Changes with API updates
   */
  {
    pattern: /^\/api-portal/,
    config: {
      revalidate: DEFAULT_INTERVALS.daily, // 1 day
      generateAtBuild: true,
      tags: ['docs', 'api-portal'],
    },
  },

  // ===========================================================
  // SEO & TECHNICAL PAGES
  // ===========================================================

  /**
   * Sitemap
   * - Generated dynamically
   * - Daily regeneration sufficient
   */
  {
    pattern: /^\/sitemap\.xml$/,
    config: {
      revalidate: DEFAULT_INTERVALS.daily,
      generateAtBuild: true,
      tags: ['seo'],
    },
  },

  /**
   * Robots.txt
   * - Almost never changes
   */
  {
    pattern: /^\/robots\.txt$/,
    config: {
      revalidate: DEFAULT_INTERVALS.weekly,
      generateAtBuild: true,
      tags: ['seo'],
    },
  },
];

// ===========================================
// ISR Config Getter
// ===========================================

/**
 * Get ISR configuration for a given pathname
 */
export function getISRConfig(pathname: string): ISRConfig {
  for (const route of ROUTE_ISR_CONFIGS) {
    if (route.pattern.test(pathname)) {
      return route.config;
    }
  }

  // Default configuration
  return {
    revalidate: DEFAULT_INTERVALS.regular, // 5 minutes
    generateAtBuild: false,
    tags: ['default'],
  };
}

/**
 * Check if a path should be statically generated
 */
export function shouldGenerateStatic(pathname: string): boolean {
  const config = getISRConfig(pathname);
  return config.generateAtBuild === true && config.revalidate !== false;
}

/**
 * Get all paths that should be pre-rendered at build time
 */
export function getStaticPaths(): string[] {
  return ROUTE_ISR_CONFIGS
    .filter(route => route.config.generateAtBuild)
    .map(route => route.pattern.source)
    .filter(pattern => !pattern.includes('[^/') && !pattern.includes('.*'))
    .map(pattern => pattern.replace(/^\^/, '').replace(/\$$/, ''));
}

// ===========================================
// On-Demand Invalidation System
// ===========================================

class InvalidationManager {
  private invalidationLog: InvalidationRequest[] = [];
  private webhookHandlers: Map<string, Array<(data: any) => Promise<void>>> = new Map();

  /**
   * Invalidate by cache tag
   */
  async invalidateByTag(tag: string, reason: string = 'Manual invalidation'): Promise<{
    success: boolean;
    invalidatedPaths?: string[];
  }> {
    const request: InvalidationRequest = {
      type: 'tag',
      target: [tag],
      timestamp: Date.now(),
      reason,
      triggeredBy: 'manual',
    };

    try {
      // Call Next.js revalidation API if available
      const response = await fetch('/api/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      });

      if (!response.ok) {
        throw new Error(`Invalidation failed: ${response.statusText}`);
      }

      this.invalidationLog.push(request);
      
      return {
        success: true,
        invalidatedPaths: await response.json().then((d: any) => d.paths),
      };
    } catch (error) {
      console.error('Tag invalidation error:', error);
      this.invalidationLog.push({ ...request, reason: (error as Error).message });
      return { success: false };
    }
  }

  /**
   * Invalidate specific path(s)
   */
  async invalidatePath(paths: string[], reason: string = 'Path invalidation'): Promise<boolean> {
    const request: InvalidationRequest = {
      type: 'path',
      target: paths,
      timestamp: Date.now(),
      reason,
      triggeredBy: 'manual',
    };

    try {
      await Promise.all(
        paths.map(path =>
          fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path }),
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to invalidate ${path}`);
          })
        )
      );

      this.invalidationLog.push(request);
      return true;
    } catch (error) {
      console.error('Path invalidation error:', error);
      return false;
    }
  }

  /**
   * Register webhook handler for automatic invalidation
   */
  registerWebhook(eventType: string, handler: (data: any) => Promise<void>): void {
    const handlers = this.webhookHandlers.get(eventType) || [];
    handlers.push(handler);
    this.webhookHandlers.set(eventType, handlers);
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(eventType: string, data: any): Promise<void> {
    const handlers = this.webhookHandlers.get(eventType) || [];
    
    const request: InvalidationRequest = {
      type: 'pattern',
      target: [eventType],
      timestamp: Date.now(),
      reason: `Webhook: ${eventType}`,
      triggeredBy: 'webhook',
    };

    try {
      await Promise.all(handlers.map(handler => handler(data)));
      this.invalidationLog.push(request);
    } catch (error) {
      console.error('Webhook handling error:', error);
      this.invalidationLog.push({ ...request, reason: (error as Error).message });
    }
  }

  /**
   * Get invalidation history
   */
  getHistory(limit: number = 50): InvalidationRequest[] {
    return this.invalidationLog.slice(-limit);
  }

  /**
   * Clear old invalidation logs
   */
  clearHistory(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    this.invalidationLog = this.invalidationLog.filter(req => req.timestamp > cutoff);
  }
}

// Singleton instance
let invalidationManagerInstance: InvalidationManager | null = null;

export function getInvalidationManager(): InvalidationManager {
  if (!invalidationManagerInstance) {
    invalidationManagerInstance = new InvalidationManager();
    
    // Register default webhook handlers
    invalidationManagerInstance.registerWebhook('product.updated', async (data) => {
      await invalidationManagerInstance!.invalidateByTag('product-detail', `Product updated: ${data.productId}`);
      await invalidationManagerInstance!.invalidateByTag('products', `Product listing changed`);
    });

    invalidationManagerInstance.registerWebhook('order.created', async () => {
      await invalidationManagerInstance!.invalidateByTag('dashboard', 'New order created');
    });

    invalidationManagerInstance.registerWebhook('category.changed', async () => {
      await invalidationManagerInstance!.invalidateByTag('categories', 'Category structure changed');
    });

    invalidationManagerInstance.registerWebhook('supplier.updated', async () => {
      await invalidationManagerInstance!.invalidateByTag('suppliers', 'Supplier info updated');
    });
  }
  
  return invalidationManagerInstance;
}

// ===========================================
// Revalidation API Route Handler Helper
// ===========================================

/**
 * Generate Next.js revalidation config for getStaticProps / generateMetadata
 */
export function generateRevalidationConfig(pathname: string) {
  const config = getISRConfig(pathname);
  
  return {
    revalidate: config.revalidate,
    tags: config.tags,
  };
}

/**
 * Create API route handler for revalidation requests
 */
export function createRevalidationHandler() {
  return async function handleRevalidation(request: Request) {
    try {
      const body = await request.json();
      const { path, tag, secret } = body;

      // Verify secret (if configured)
      if (process.env.REVALIDATION_SECRET && secret !== process.env.REVALIDATION_SECRET) {
        return Response.json({ error: 'Invalid secret' }, { status: 401 });
      }

      // Handle tag-based invalidation
      if (tag) {
        // This would use Next.js's revalidateTag or custom logic
        console.log(`🔄 Invalidating tag: ${tag}`);
        
        return Response.json({
          success: true,
          message: `Tag "${tag}" invalidated`,
          timestamp: new Date().toISOString(),
        });
      }

      // Handle path-based invalidation
      if (path) {
        // This would use Next.js's revalidatePath or res.unstable_revalidate()
        console.log(`🔄 Invalidating path: ${path}`);
        
        return Response.json({
          success: true,
          message: `Path "${path}" invalidated`,
          timestamp: new Date().toISOString(),
        });
      }

      return Response.json(
        { error: 'Must provide "path" or "tag"' },
        { status: 400 }
      );
    } catch (error) {
      console.error('Revalidation error:', error);
      return Response.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
  };
}

// ===========================================
// Export All
// ===========================================

export {
  DEFAULT_INTERVALS,
  InvalidationManager,
};

export default {
  getISRConfig,
  shouldGenerateStatic,
  getStaticPaths,
  getInvalidationManager,
  createRevalidationHandler,
  generateRevalidationConfig,
  ROUTE_ISR_CONFIGS,
};
