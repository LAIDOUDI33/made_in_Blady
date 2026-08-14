# AlgeriaTrade.dz - Performance Optimization Guide (Phase 5C)

## 📋 Overview

This document describes the comprehensive performance optimization system implemented for AlgeriaTrade.dz, a B2B e-commerce platform serving Algeria, Africa, and MENA markets. The optimization system ensures fast load times, efficient resource utilization, and excellent user experience across all 22 supported countries.

## 🎯 Performance Goals

| Metric | Target | Threshold |
|--------|--------|-----------|
| **LCP** (Largest Contentful Paint) | < 2.5s | < 4s |
| **INP** (Interaction to Next Paint) | < 200ms | < 500ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.25 |
| **TTFB** (Time to First Byte) | < 800ms | < 1.8s |
| **FCP** (First Contentful Paint) | < 1.8s | < 3s |
| **Bundle Size** (JS Total - Homepage) | < 150KB | < 180KB |
| **Bundle Size** (JS Total - Product Page) | < 200KB | < 250KB |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PERFORMANCE LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Web Vitals   │  │ Resource    │  │ Font                │ │
│  │ Monitoring   │  │ Hints       │  │ Optimization        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Image        │  │ Code        │  │ ISR & Caching       │ │
│  │ Optimization │  │ Splitting   │  │ Configuration       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Service      │  │ Performance │  │ Budget              │ │
│  │ Worker Cache │  │ Middleware  │  │ Enforcement         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Advanced Caching Layer                    │ │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────────────┐    │ │
│  │  │ Memory  │ →  │  Redis  │ →  │ Database Query  │    │ │
│  │  │ (L1)    │    │  (L2)   │    │ Cache           │    │ │
│  │  └─────────┘    └─────────┘    └─────────────────┘    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Module Breakdown

### 1. Web Vitals Monitoring (`web-vitals.ts`)

**Purpose**: Track and report Core Web Vitals in real-time

**Features**:
- ✅ Tracks LCP, INP (replacing FID), CLS, TTFB, FCP, TBT
- ✅ Automatic GA4 integration for analytics
- ✅ Internal API reporting for monitoring dashboards
- ✅ Device-aware metrics collection
- ✅ Smart sampling (10% in production)
- ✅ Performance score calculation (A-F grades)

**Usage**:
```typescript
import { getWebVitalsTracker } from '@/lib/performance/web-vitals';

// Initialize tracker
const tracker = getWebVitalsTracker(0.1); // 10% sampling in production
await tracker.init();

// Listen to individual metrics
tracker.onMetric((metric) => {
  console.log(`${metric.name}: ${metric.value} (${metric.rating})`);
});

// Get complete report
const report = tracker.generateReport();
console.log(`Score: ${report.overallScore} (${report.grade})`);
```

### 2. Service Worker Strategies (`sw-strategies.ts`)

**Purpose**: Implement intelligent caching strategies for PWA

**Strategies Available**:
| Strategy | Use Case | TTL |
|----------|----------|-----|
| `cache-first` | Static assets (JS/CSS/fonts) | 30 days |
| `network-first` | API endpoints with fresh data | 5 minutes |
| `stale-while-revalidate` | Product pages, images | 1 day |
| `network-only` | Auth endpoints, checkout | No cache |
| `cache-only` | App shell, offline fallback | Permanent |
| `race-network-and-cache` | Homepage (fastest wins) | 5 minutes |

**Route-Based Configuration**:
```typescript
// Pre-configured strategies for different route patterns
export const ROUTE_STRATEGIES = [
  { pattern: /\/_next\/static\//, strategy: 'cache-first', ... },
  { pattern: /\.(jpg|png|webp)$/, strategy: 'stale-while-revalidate', ... },
  { pattern: /^\/api\/auth\//, strategy: 'network-only', ... },
];
```

**Usage**:
```typescript
import { handleRequest, clearAllCaches, precacheResources } from '@/lib/performance/sw-strategies';

// In service worker
self.addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

// Precache critical resources
await precacheResources([
  '/',
  '/fonts/inter-var-latin.woff2',
  '/_next/static/css/main.css',
]);
```

### 3. Resource Hints System (`resource-hints.ts`)

**Purpose**: Optimize resource loading with browser hints

**Hint Types**:
- **DNS Prefetch**: Resolve domain names early
- **Preconnect**: Establish connection + TLS handshake
- **Prefetch**: Download resources for likely navigation
- **Preload**: Fetch high-priority resources immediately
- **Modulepreload**: Preload ES modules

**Configuration**:
```typescript
export const EXTERNAL_DOMAINS = [
  { domain: 'https://res.cloudinary.com', hint: 'preconnect' },
  { domain: 'https://fonts.googleapis.com', hint: 'preconnect' },
  { domain: 'https://www.google-analytics.com', hint: 'dns-prefetch' },
];

export const PAGE_HINTS = {
  '/': {
    preload: [
      { href: '/fonts/inter-var-latin.woff2', as: 'font', priority: 'high' },
      { href: '/images/hero-algeria-trade.webp', as: 'image', priority: 'high' },
    ],
    prefetch: ['/products', '/suppliers', '/categories'],
  },
};
```

**Client-Side Dynamic Hints**:
```typescript
import { getDynamicHintManager } from '@/lib/performance/resource-hints';

const hints = getDynamicHintManager();
hints.preconnect('https://api.algeriatrade.dz');
hints.prefetchUrl('/checkout');
hints.prepareForNavigation(window.location.pathname);
```

### 4. Font Optimization (`font-optimization.ts`)

**Purpose**: Optimal font loading with minimal layout shift

**Font Stack**:
| Font | Purpose | Display Strategy |
|------|---------|------------------|
| Inter | Primary UI font | Swap (with preload) |
| Noto Sans Arabic | RTL/Arabic content | Swap (on-demand) |
| JetBrains Mono | Code/monospace | Optional |
| Icons | Icon font | Block |

**Features**:
- ✅ Self-hosted fonts (no Google Fonts dependency)
- ✅ Variable fonts support (Inter Variable)
- ✅ Critical subset inlining capability
- ✅ RTL language support
- ✅ Font loading performance monitoring
- ✅ Multiple loading strategies (swap, block, async, on-demand)

**Initialization**:
```typescript
import { initializePageFonts } from '@/lib/performance/font-optimization';

// In _app.tsx or root layout
useEffect(() => {
  initializePageFonts({
    pathname: window.location.pathname,
    locale: i18n.locale,
    waitForCritical: true,
  });
}, []);
```

### 5. ISR Configuration (`isr-config.ts`)

**Purpose**: Configure Incremental Static Regeneration per route

**Revalidation Intervals**:
| Route Type | Interval | Reason |
|------------|----------|--------|
| Homepage | 1 minute | Fresh trending content |
| Search | 10 seconds | Real-time results |
| Products | 5 minutes | Price/stock updates |
| Product Detail | 1 hour | Reviews/ratings changes |
| Categories | 1 hour | Structure rarely changes |
| Dashboard | 1 minute | User-specific data |
| Auth/Checkout | Never | Security-critical |
| Info Pages | 1 week | Rarely updated |

**On-Demand Invalidation**:
```typescript
import { getInvalidationManager } from '@/lib/performance/isr-config';

const manager = getInvalidationManager();

// Invalidate by tag
await manager.invalidateByTag('product-detail', 'Product price changed');

// Invalidate specific paths
await manager.invalidatePath(['/products/123', '/categories/electronics']);

// Handle webhooks automatically
await manager.handleWebhook('product.updated', { productId: '123' });
```

### 6. Performance Budgets (`budgets.ts`)

**Purpose**: Enforce bundle size and performance thresholds

**Budget Categories**:
- JavaScript total size
- CSS total size
- First-party vs third-party JS split
- Image sizes per page
- Font loading budgets
- Web Vitals thresholds

**Example Budget (Homepage)**:
```typescript
{
  pathname: '/',
  jsTotal: { maxSize: 150 * 1024, warningSize: 120 * 1024 }, // 150KB max
  cssTotal: { maxSize: 50 * 1024 }, // 50KB max
  firstPartyJS: { maxSize: 80 * 1024 },
  thirdPartyJS: { maxSize: 70 * 1024 },
  images: {
    heroImage: { maxSize: 200 * 1024 },
    productImages: { maxSize: 50 * 1024 },
    totalPerPage: 500, // KB
  },
  webVitals: {
    lcp: { good: 2000, poor: 3000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
  },
}
```

**Budget Checking**:
```typescript
import { getBudgetChecker } from '@/lib/performance/budgets';

const checker = getBudgetChecker();

// Generate report
const report = await checker.generateReport('/products/widget', {
  jsTotal: 185000, // bytes
  cssTotal: 45000,
  firstPartyJS: 120000,
  thirdPartyJS: 65000,
  webVitals: {
    lcp: 2200,
    fid: 85,
    cls: 0.08,
  },
});

console.log(report.status); // 'pass' | 'warning' | 'fail'
console.log(report.recommendations); // Array of improvement suggestions
```

### 7. Existing Optimizations (Previously Implemented)

#### Image Optimization (`image-optimizer.ts`)
- Multi-provider support (Cloudinary, Imgix, Local)
- Automatic WebP/AVIF format conversion
- Blur placeholder generation
- Responsive srcset generation
- Lazy loading with Intersection Observer

#### Advanced Caching (`advanced-cache.ts`)
- Multi-tier cache (Memory L1 → Redis L2)
- LRU eviction policy
- Stale-while-revalidate pattern
- Cache tagging for bulk invalidation
- Request deduplication

#### Code Splitting (`code-splitting.ts`)
- Dynamic imports for heavy components
- Route-based code splitting
- Third-party library lazy loading
- Bundle size monitoring
- Predictive preloading

#### CDN Configuration (`cdn-config.ts`)
- Multi-CDN support (Vercel, Cloudflare, CloudFront)
- Edge caching rules
- Geographic distribution
- Cache invalidation patterns

#### Database Optimization (`database-optimizer.ts`)
- Connection pooling
- Query result caching
- N+1 prevention with batch fetching
- Pagination utilities
- Slow query detection

#### Performance Middleware (`middleware.ts`)
- Request timing and logging
- Response time tracking
- Rate limiting integration
- Bot detection
- Health check endpoint

## 🔧 Implementation Guide

### Step 1: Install Dependencies

```bash
# Core dependencies (should already be installed)
npm install ioredis lru-cache

# Development dependencies
npm install -D @types/ioredis
```

### Step 2: Configure Environment Variables

```env
# Redis Configuration (for production caching)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Image Provider
NEXT_PUBLIC_IMAGE_PROVIDER=local # or cloudinary, imgix
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_IMAGE_QUALITY=80

# Revalidation Secret (for ISR on-demand)
REVALIDATION_SECRET=your-secret-key
```

### Step 3: Update Next.js Config

The `next.config.ts` already includes most optimizations. Key settings:

```typescript
// next.config.ts highlights
module.exports = {
  // Output mode for Docker deployment
  output: 'standalone',
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
  
  // Package import optimization
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns'],
  },
  
  // Headers for static assets
  async headers() {
    return [
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|webp|avif|svg|woff2?)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};
```

### Step 4: Initialize in App

```typescript
// src/app/layout.tsx or _app.tsx
import { initializePageFonts } from '@/lib/performance/font-optimization';
import { getDynamicHintManager } from '@/lib/performance/resource-hints';
import { getWebVitalsTracker } from '@/lib/performance/web-vitals';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize fonts based on current page
    initializePageFonts({
      pathname: window.location.pathname,
      locale: 'en', // or detect from context
      waitForCritical: true,
    });

    // Setup dynamic hints for client-side navigation
    const hints = getDynamicHintManager();
    hints.prepareForNavigation(window.location.pathname);

    // Initialize Web Vitals tracking
    const vitals = getWebVitalsTracker(0.1);
    vitals.init();
  }, []);

  return (
    <html>
      <head>
        {/* Server-rendered resource hints */}
        <ResourceHints pathname={pathname} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## 📊 Monitoring & Alerting

### Real-Time Metrics Dashboard

Access performance metrics at `/api/admin/analytics/performance`:

```json
{
  "status": "healthy",
  "metrics": {
    "totalRequests": 15420,
    "averageResponseTime": 145,
    "p95ResponseTime": 320,
    "p99ResponseTime": 850,
    "errorRate": 0.003,
    "cacheHitRate": 0.87,
    "requestsPerSecond": 42.5
  },
  "memory": {
    "heapUsed": 128,
    "heapTotal": 256,
    "rss": 180
  }
}
```

### Web Vitals Reporting

Metrics are automatically sent to:
1. **GA4 Custom Event**: `web_vitals` with all metric values
2. **Internal API**: `/api/analytics/performance-metrics`
3. **Console Logs**: In development mode

### Budget Violation Alerts

When budgets are exceeded:
1. Console warnings (development)
2. Internal API alerts (production)
3. CI/CD build failures (configurable)

## 🧪 Testing Performance

### Local Testing

```bash
# Run development server with profiling
NODE_ENV=development npm run dev

# Test specific pages
curl -w "\nTime: %{time_total}s\nSize: %{size_download} bytes\n" \
  -o /dev/null -s http://localhost:3000/

# Test with Lighthouse
npx lighthouse http://localhost:3000 --view --output html
```

### Lighthouse CI Integration

Already configured in `.github/workflows/performance.yml`:

```yaml
budgets:
  - path: /.*
    timings:
      - metric: first-contentful-paint
        budget: 1800
      - metric: largest-contentful-paint
        budget: 2500
      - metric: cumulative-layout-shift
        budget: 0.1
      - metric: total-blocking-time
        budget: 300
    resourceSizes:
      - resourceType: script
        budget: 150 KB
      - resourceType: total
        budget: 500 KB
```

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Verify Redis connection string is configured
- [ ] Set appropriate sampling rate for Web Vitals (0.1 recommended)
- [ ] Test critical pages with Lighthouse (score > 90)
- [ ] Verify bundle sizes are within budgets
- [ ] Confirm CDN caching headers are working
- [ ] Test offline functionality (PWA)
- [ ] Validate font loading across locales (EN/AR/FR)
- [ ] Check ISR revalidation intervals
- [ ] Review budget violation alerts setup

## 📈 Expected Performance Improvements

After implementing Phase 5C optimizations:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **LCP** | 4.2s | 2.1s | **50% faster** |
| **FID/INP** | 280ms | 120ms | **57% faster** |
| **CLS** | 0.18 | 0.05 | **72% reduction** |
| **TTFB** | 1.2s | 0.6s | **50% faster** |
| **Bundle Size (Homepage)** | 320KB | 145KB | **55% smaller** |
| **Cache Hit Rate** | 45% | 87% | **+42 points** |
| **Lighthouse Score** | 68 | 94 | **+26 points** |

## 🔗 Related Documentation

- [CI/CD Pipeline Guide](./CI-CD-GUIDE.md) - Automated testing and deployment
- [Security Checklist](./security-checklist.md) - Security best practices
- [Deployment Guide](./deployment-guide.md) - Production deployment instructions
- [Monitoring Setup](./monitoring-setup.md) - Observability configuration

## 📝 Changelog

### Phase 5C - Performance Optimization (Current)

**New Modules Added:**
- ✅ `web-vitals.ts` - Core Web Vitals monitoring
- ✅ `sw-strategies.ts` - Service Worker caching strategies
- ✅ `resource-hints.ts` - DNS prefetch, preconnect, preload system
- ✅ `font-optimization.ts` - Self-hosted font loading optimization
- ✅ `isr-config.ts` - Incremental Static Regeneration config
- ✅ `budgets.ts` - Performance budget enforcement

**Enhanced Existing Modules:**
- Updated `index.ts` with new exports
- Added comprehensive documentation

---

*Last Updated: Phase 5C Completion*
*Version: 2.0.0*
