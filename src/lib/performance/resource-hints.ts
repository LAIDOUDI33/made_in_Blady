/**
 * AlgeriaTrade.dz - Resource Hints & Preloading System
 * 
 * Features:
 * - DNS prefetching for external domains
 * - Preconnect for critical connections
 * - Prefetch for likely navigations
 * - Preload for critical resources
 * - Module preload for ES modules
 * - Priority hints for resource loading
 * - Automatic hint generation based on page type
 */

// ===========================================
// Types & Configuration
// ===========================================

export interface DomainConfig {
  domain: string;
  hint: 'dns-prefetch' | 'preconnect';
  attributes?: Record<string, string>;
}

export interface CriticalResource {
  href: string;
  as: 'script' | 'style' | 'image' | 'font' | 'document' | 'fetch' | 'worker';
  type?: string;
  crossorigin?: '' | 'anonymous' | 'use-credentials';
  integrity?: string;
  priority: 'high' | 'low';
}

export interface PageHints {
  dnsPrefetch: string[];
  preconnect: DomainConfig[];
  prefetch: string[];
  preload: CriticalResource[];
  modulePreload: string[];
}

// ===========================================
// External Domains Configuration
// ===========================================

export const EXTERNAL_DOMAINS: DomainConfig[] = [
  // CDN domains
  {
    domain: 'https://res.cloudinary.com',
    hint: 'preconnect',
    attributes: { crossorigin: '' },
  },
  {
    domain: 'https://images.algeriatrade.dz',
    hint: 'preconnect',
    attributes: { crossorigin: '' },
  },

  // Font providers
  {
    domain: 'https://fonts.googleapis.com',
    hint: 'preconnect',
  },
  {
    domain: 'https://fonts.gstatic.com',
    hint: 'preconnect',
    attributes: { crossorigin: '' },
  },

  // Analytics (lower priority)
  {
    domain: 'https://www.google-analytics.com',
    hint: 'dns-prefetch',
  },
  {
    domain: 'https://analytics.google.com',
    hint: 'dns-prefetch',
  },

  // Payment providers (lazy connect)
  {
    domain: 'https://api.stripe.com',
    hint: 'dns-prefetch',
  },

  // API endpoints
  {
    domain: process.env.NEXT_PUBLIC_API_URL || 'https://api.algeriatrade.dz',
    hint: 'preconnect',
  },
];

// ===========================================
// Page-Specific Hints Configuration
// ===========================================

const PAGE_HINTS: Record<string, PageHints> = {
  // Homepage - maximum optimization
  '/': {
    dnsPrefetch: [
      'https://www.google-analytics.com',
      'https://api.algeriatrade.dz',
    ],
    preconnect: EXTERNAL_DOMAINS.filter(d => d.hint === 'preconnect'),
    prefetch: [
      '/products',
      '/suppliers',
      '/categories',
      '/login',
    ],
    preload: [
      {
        href: '/fonts/inter-var-latin.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
        priority: 'high',
      },
      {
        href: '/_next/static/css/main.css',
        as: 'style',
        priority: 'high',
      },
      {
        href: '/images/hero-algeria-trade.webp',
        as: 'image',
        priority: 'high',
      },
    ],
    modulePreload: [],
  },

  // Product pages
  '/products/[slug]': {
    dnsPrefetch: ['https://res.cloudinary.com'],
    preconnect: [
      {
        domain: 'https://res.cloudinary.com',
        hint: 'preconnect',
        attributes: { crossorigin: '' },
      },
    ],
    prefetch: [
      '/suppliers',
      '/categories',
    ],
    preload: [
      {
        href: '/_next/static/chunks/product-gallery.js',
        as: 'script',
        priority: 'high',
      },
    ],
    modulePreload: [],
  },

  // Category pages
  '/categories/[slug]': {
    dnsPrefetch: ['https://api.algeriatrade.dz'],
    preconnect: [
      {
        domain: 'https://api.algeriatrade.dz',
        hint: 'preconnect',
      },
    ],
    prefetch: ['/products'],
    preload: [
      {
        href: '/_next/static/chunks/product-grid.js',
        as: 'script',
        priority: 'high',
      },
    ],
    modulePreload: [],
  },

  // Dashboard pages
  '/dashboard': {
    dnsPrefetch: ['https://api.algeriatrade.dz'],
    preconnect: [
      {
        domain: 'https://api.algeriatrade.dz',
        hint: 'preconnect',
      },
    ],
    prefetch: [
      '/dashboard/orders',
      '/dashboard/messages',
      '/dashboard/products',
    ],
    preload: [
      {
        href: '/_next/static/charts.js',
        as: 'script',
        priority: 'low',
      },
    ],
    modulePreload: [],
  },

  // Checkout page - critical resources only
  '/checkout': {
    dnsPrefetch: ['https://api.stripe.com', 'https://api.algeriatrade.dz'],
    preconnect: [
      {
        domain: 'https://api.stripe.com',
        hint: 'preconnect',
      },
      {
        domain: 'https://api.algeriatrade.dz',
        hint: 'preconnect',
      },
    ],
    prefetch: [],
    preload: [
      {
        href: 'https://js.stripe.com/v3/',
        as: 'script',
        priority: 'high',
      },
    ],
    modulePreload: [],
  },

  // Login/Register - minimal hints
  '/login': {
    dnsPrefetch: ['https://api.algeriatrade.dz'],
    preconnect: [
      {
        domain: 'https://api.algeriatrade.dz',
        hint: 'preconnect',
      },
    ],
    prefetch: ['/register', '/forgot-password'],
    preload: [],
    modulePreload: [],
  },
};

// ===========================================
// Hint Generators
// ===========================================

/**
 * Generate DNS prefetch link tags
 */
function generateDNSPrefetchLinks(domains: string[]): string[] {
  return domains.map(domain =>
    `<link rel="dns-prefetch" href="${domain}">`
  );
}

/**
 * Generate preconnect link tags
 */
function generatePreconnectLinks(domains: DomainConfig[]): string[] {
  return domains.map(config => {
    const attrs = Object.entries(config.attributes || {})
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    return `<link rel="preconnect" href="${config.domain}"${attrs ? ` ${attrs}` : ''}>`;
  });
}

/**
 * Generate prefetch link tags
 */
function generatePrefetchLinks(urls: string[]): string[] {
  return urls.map(url =>
    `<link rel="prefetch" href="${url}">`
  );
}

/**
 * Generate preload link tags with full attributes
 */
function generatePreloadLinks(resources: CriticalResource[]): string[] {
  return resources.map(resource => {
    const attrs = [
      `rel="preload"`,
      `href="${resource.href}"`,
      `as="${resource.as}"`,
      resource.type ? `type="${resource.type}"` : '',
      resource.crossorigin ? `crossorigin="${resource.crossorigin}"` : '',
      resource.integrity ? `integrity="${resource.integrity}"` : '',
      resource.priority === 'low' ? 'fetchpriority="low"' : 'fetchpriority="high"',
    ]
      .filter(Boolean)
      .join(' ');

    return `<link ${attrs}>`;
  });
}

/**
 * Generate modulepreload link tags for ES modules
 */
function generateModulePreloadLinks(urls: string[]): string[] {
  return urls.map(url =>
    `<link rel="modulepreload" href="${url}">`
  );
}

// ===========================================
// Main Resource Hints Generator
// ===========================================

/**
 * Get appropriate hints for current path
 */
export function getHintsForPath(pathname: string): PageHints {
  // Check exact match first
  if (PAGE_HINTS[pathname]) {
    return PAGE_HINTS[pathname];
  }

  // Check dynamic routes
  for (const [pattern, hints] of Object.entries(PAGE_HINTS)) {
    if (pattern.includes('[')) {
      // Convert pattern to regex
      const regexPattern = pattern
        .replace(/\[([^\]]+)\]/g, '[^/]+')
        .replace('/', '\\/');
      
      const regex = new RegExp(`^${regexPattern}$`);
      
      if (regex.test(pathname)) {
        return hints;
      }
    }
  }

  // Default hints
  return {
    dnsPrefetch: EXTERNAL_DOMAINS.map(d => d.domain),
    preconnect: EXTERNAL_DOMAINS.filter(d => d.hint === 'preconnect'),
    prefetch: [],
    preload: [],
    modulePreload: [],
  };
}

/**
 * Generate all resource hint tags for a given pathname
 */
export function generateResourceHints(pathname: string): {
  headTags: string[];
  hints: PageHints;
} {
  const hints = getHintsForPath(pathname);

  const headTags = [
    ...generateDNSPrefetchLinks(hints.dnsPrefetch),
    ...generatePreconnectLinks(hints.preconnect),
    ...generatePrefetchLinks(hints.prefetch),
    ...generatePreloadLinks(hints.preload),
    ...generateModulePreloadLinks(hints.modulePreload),
  ];

  return { headTags, hints };
}

/**
 * Generate Link header for server-side injection (HTTP/2 push)
 */
export function generateLinkHeader(pathname: string): string {
  const hints = getHintsForPath(pathname);
  
  const links: string[] = [];

  // DNS prefetch
  hints.dnsPrefetch.forEach(domain => {
    links.push(`<${domain}>; rel=dns-prefetch`);
  });

  // Preconnect
  hints.preconnect.forEach(config => {
    links.push(`<${config.domain}>; rel=preconnect`);
  });

  // Preload (high priority only)
  hints.preload
    .filter(r => r.priority === 'high')
    .forEach(resource => {
      let link = `<${resource.href}>; rel=preload; as=${resource.as}`;
      if (resource.type) link += `; type=${resource.type}`;
      links.push(link);
    });

  return links.join(', ');
}

// ===========================================
// Client-Side Runtime Hints
// ===========================================

/**
 * Add resource hints dynamically (for client-side navigation)
 */
export class DynamicHintManager {
  private addedHints: Set<string> = new Set();

  /**
   * Add a single hint
   */
  addHint(href: string, rel: string, attributes: Record<string, string> = {}): void {
    const key = `${rel}:${href}`;
    
    if (this.addedHints.has(key)) return;
    
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    
    Object.entries(attributes).forEach(([key, value]) => {
      link.setAttribute(key, value);
    });

    document.head.appendChild(link);
    this.addedHints.add(key);
  }

  /**
   * Prefetch a URL for navigation
   */
  prefetchUrl(url: string): void {
    this.addHint(url, 'prefetch');
  }

  /**
   * Preload a critical resource
   */
  preloadResource(resource: CriticalResource): void {
    this.addHint(
      resource.href,
      'preload',
      {
        as: resource.as,
        ...(resource.type && { type: resource.type }),
        ...(resource.crossorigin && { crossorigin: resource.crossorigin }),
        ...(resource.integrity && { integrity: resource.integrity }),
      }
    );
  }

  /**
   * Preconnect to a domain
   */
  preconnect(domain: string, crossorigin?: boolean): void {
    this.addHint(domain, 'preconnect', ...(crossorigin ? [{ crossorigin: '' }] : []));
  }

  /**
   * Add hints for next likely route
   */
  prepareForNavigation(currentPath: string): void {
    const hints = getHintsForPath(currentPath);

    // Prefetch likely next pages
    hints.prefetch.forEach(url => this.prefetchUrl(url));

    // Preload low-priority critical resources
    hints.preload
      .filter(r => r.priority === 'low')
      .forEach(resource => this.preloadResource(resource));
  }

  /**
   * Clear all added hints
   */
  clear(): void {
    this.addedHints.clear();
  }
}

// Singleton instance for client-side use
let hintManagerInstance: DynamicHintManager | null = null;

export function getDynamicHintManager(): DynamicHintManager {
  if (!hintManagerInstance && typeof window !== 'undefined') {
    hintManagerInstance = new DynamicHintManager();
  }
  return hintManagerInstance!;
}

// ===========================================
// Priority Hints Integration
// ===========================================

/**
 * Apply fetchpriority attribute to images based on viewport position
 */
export function getImagePriority(
  element: HTMLElement,
  isInViewport: boolean,
  isAboveFold: boolean
): 'high' | 'low' | 'auto' {
  if (isAboveFold) return 'high';
  if (isInViewport) return 'auto';
  return 'low';
}

/**
 * Generate importance hints for scripts
 */
export function getScriptImportance(scriptType: 'critical' | 'deferred' | 'lazy'): 'high' | 'low' {
  switch (scriptType) {
    case 'critical': return 'high';
    case 'lazy': return 'low';
    default: return 'auto' as any;
  }
}

// ===========================================
// Export All
// ===========================================

export {
  generateDNSPrefetchLinks,
  generatePreconnectLinks,
  generatePrefetchLinks,
  generatePreloadLinks,
  generateModulePreloadLinks,
};

export default {
  getHintsForPath,
  generateResourceHints,
  generateLinkHeader,
  getDynamicHintManager,
  EXTERNAL_DOMAINS,
  PAGE_HINTS,
};
