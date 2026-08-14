# AlgeriaTrade.dz - Performance Optimization Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Image Optimization](#image-optimization)
4. [Caching Strategy](#caching-strategy)
5. [Code Splitting](#code-splitting)
6. [CDN Configuration](#cdn-configuration)
7. [Database Optimization](#database-optimization)
8. [Middleware & Monitoring](#middleware--monitoring)
9. [PWA Enhancements](#pwa-enhancements)
10. [Compression & Minification](#compression--minification)
11. [Performance Metrics](#performance-metrics)
12. [Troubleshooting](#troubleshooting)

---

## Overview

AlgeriaTrade.dz implements **enterprise-grade performance optimizations** designed for the Africa/MENA region with varying network conditions. Our optimization strategy focuses on:

- **First Contentful Paint (FCP) < 1.5s** on 4G networks
- **Largest Contentful Paint (LCP) < 2.5s**
- **Cumulative Layout Shift (CLS) < 0.1**
- **Time to Interactive (TTI) < 3.5s**
- **Bundle size < 200KB initial load**

### Key Performance Features

| Feature | Implementation | Impact |
|---------|---------------|--------|
| Image Optimization | Multi-provider with WebP/AVIF | -70% image sizes |
| Multi-Tier Caching | Memory → Redis → Database | -90% API latency |
| Code Splitting | Route + Component level | -60% initial bundle |
| CDN Integration | Vercel Edge / Cloudflare | -50% global latency |
| Service Worker | Offline-first PWA | Instant repeat visits |
| Compression | Brotli + Gzip | -80% transfer size |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │ Optimized│ │ Dynamic  │ │ Service  │ │ Performance    │ │
│  │ Images   │ │ Imports  │ │ Worker   │ │ Monitoring     │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬────────┘ │
│       └────────────┴───────────┴──────────────┘            │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    EDGE / CDN LAYER                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ Vercel   │ │ Cloud-   │ │ Cache    │                    │
│  │ Edge     │ │ flare    │ │ Rules    │                    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘                    │
│       └────────────┴───────────┘                            │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION SERVER                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │ Next.js  │ │ Redis    │ │ Prisma   │ │ Query          │ │
│  │ Server   │ │ Cache    │ │ + Pooling│ │ Optimizer      │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Image Optimization

### Configuration

Set up image providers in `.env.local`:

```bash
# Image Provider: 'local' | 'cloudinary' | 'imgix'
NEXT_PUBLIC_IMAGE_PROVIDER=cloudinary

# Cloudinary (if using)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Imgix (if using)
NEXT_PUBLIC_IMAGE_DOMAIN=images.algeriatrade.dz

# Quality settings
NEXT_PUBLIC_IMAGE_QUALITY=80
```

### Using the OptimizedImage Component

```tsx
import OptimizedImage from '@/components/optimized/OptimizedImage';

// Basic usage
<OptimizedImage
  src="/products/laptop.jpg"
  alt="Modern laptop"
  width={800}
  height={600}
/>

// With all options
<OptimizedImage
  src="https://example.com/image.jpg"
  alt="Product image"
  width={1200}
  height={800}
  priority           // Preload above fold images
  placeholder="blur" // Show blur while loading
  rounded             // Rounded corners
  lazy                // Lazy load when in viewport
  fadeIn              // Fade in animation
  objectFit="cover"
/>

// Pre-built variants
import { ProductThumbnail, HeroBanner, UserAvatar } from '@/components/optimized/OptimizedImage';

<ProductThumbnail src={product.image} alt={product.name} />
<HeroBanner src={bannerUrl} alt="Summer Sale" />
<UserAvatar src={user.avatar} alt={user.name} size={48} />
```

### Responsive Images

```tsx
import { generateSrcSet, generateSizes } from '@/lib/performance/image-optimizer';

// Generate responsive srcset
const srcSet = generateSrcSet('/products/photo.jpg', {
  breakpoints: [640, 750, 828, 1080, 1200],
});

// Use with Next.js Image
<Image
  src="/products/photo.jpg"
  alt="Product"
  sizes={generateSizes('desktop')}
  srcSet={srcSet}
/>
```

### Blur Placeholders

Automatic blur placeholders are generated for:

1. **Cloudinary images**: Low-quality blurred version from CDN
2. **Local images**: SVG-based animated placeholder

```tsx
// Enable blur globally or per-image
<OptimizedImage
  src={image.url}
  placeholder="blur" // Auto-generates blur URL
/>
```

---

## Caching Strategy

### Multi-Tier Architecture

```
Request → L1 Memory Cache (5 min TTL)
         ↓ (miss)
         L2 Redis Cache (1 hour TTL)
         ↓ (miss)
         Database Query
         ↓
         Cache result in both layers
```

### Using the Cache Manager

```typescript
import { getCacheManager } from '@/lib/performance/advanced-cache';

const cache = getCacheManager();

// Basic get/set
const data = await cache.get('products:list', {
  fetcher: () => fetchProductsFromDB(),
  ttl: 300, // 5 minutes
  tags: ['products', 'list'],
});

// Set cache explicitly
await cache.set('user:123', userData, {
  ttl: 3600,
  tags: ['users', `user:${userData.id}`],
});

// Delete specific key
await cache.delete('user:123');

// Invalidate by tags (bulk)
await cache.invalidateByTags(['products']); // Deletes all cached products

// Get or create with deduplication
const user = await cache.getOrCreate(
  `user:${userId}`,
  () => fetchUser(userId),
  { tags: ['users'] }
);
```

### Cache Configuration

```typescript
// Customize cache behavior
const cache = getCacheManager({
  memory: {
    enabled: true,
    maxSize: 2000,        // Max items in memory
    ttl: 10 * 60 * 1000, // 10 minutes
  },
  redis: {
    enabled: true,
    url: process.env.REDIS_URL,
    defaultTTL: 7200,    // 2 hours
  },
  behavior: {
    staleWhileRevalidate: 300, // Serve stale for 5 mins while refreshing
    compression: true,
  },
});
```

### Database Query Caching

```typescript
import { getDatabase } from '@/lib/performance/database-optimizer';

const db = getDatabase();

// Cached findMany with pagination
const { data, pagination } = await db.paginatedFindMany('product', {
  where: { category: 'electronics' },
  page: 1,
  pageSize: 20,
}, {
  ttl: 300,
  tags: ['products', 'category:electronics'],
});

// Cached count
const total = await db.cachedCount('product', {
  where: { status: 'active' },
}, { ttl: 60 });

// Batch fetch to prevent N+1 queries
const productMap = await db.batchFetchWithIncludes('product', 
  productIds,
  { category: true, supplier: true }
);

// Transaction with retry
await db.transaction(async (prisma) => {
  await prisma.order.create({ data: orderData });
  await prisma.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } }
  });
});
```

---

## Code Splitting

### Dynamic Imports

All heavy components are automatically lazy-loaded:

```typescript
import dynamic from 'next/dynamic';
import {
  RichTextEditor,
  DataTable,
  Charts,
  MapComponent,
  ChatWidget,
} from '@/lib/performance/code-splitting';

// These are already wrapped with dynamic imports!
// Just use them as regular components:

function ProductPage() {
  return (
    <div>
      {/* Loads only when scrolled into view */}
      <MapComponent location={supplier.address} />
      
      {/* Loads on interaction */}
      <ChatWidget />
      
      {/* Dashboard charts - admin only */}
      {isAdmin && (
        <>
          <Charts.LineChart data={salesData} />
          <Charts.BarChart data={categoryData} />
        </>
      )}
    </div>
  );
}
```

### Page-Level Splitting

Route-based code splitting is automatic with Next.js App Router, but you can optimize further:

```typescript
// Admin pages are lazy-loaded
import { AdminPages } from '@/lib/performance/code-splitting';

function AdminDashboard() {
  const AdminDashboardPage = AdminPages.Dashboard;
  return <AdminDashboardPage />;
}
```

### Preloading Strategies

```typescript
import { preloadComponent, preloadLikelyRoutes } from '@/lib/performance/code-splitting';

// Preload component on hover
<button
  onMouseEnter={() => preloadComponent(() => import('@/components/heavy/Editor'))}
>
  Open Editor
</button>

// Preload likely routes after page load
useEffect(() => {
  preloadLikelyRoutes();
}, []);
```

---

## CDN Configuration

### Vercel Edge (Default)

```javascript
// next.config.js
module.exports = {
  // Vercel handles CDN automatically
  // Configure edge caching via headers:
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};
```

### Cloudflare Setup

```typescript
import { CLOUDFLARE_CDN_CONFIG } from '@/lib/performance/cdn-config';

// Use these settings in Cloudflare dashboard:
// - Page Rules: Apply cache rules based on patterns
// - Rules Engine: Transform headers at edge
// - Argo Smart Routing: Optimize routing
```

### Cache Invalidation

```typescript
import { INVALIDATION_PATTERNS } from '@/lib/performance/cdn-config';

// After product update
const invalidations = INVALIDATION_PATTERNS.productUpdated(productId);
await Promise.all(invalidations.map(inv => purgeCDN(inv)));

// Emergency full site purge
const emergencyInvalidation = INVALIDATION_PATTERNS.fullSitePurge();
await purgeCDN(emergencyInvalidation[0]);
```

---

## Database Optimization

### Connection Pooling

Prisma connection pool is configured automatically:

```typescript
// prisma/schema.prisma
datasource db {
  provider = "sqlite" // or "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pool settings (PostgreSQL only)
  connection_limit = 10
  pool_timeout = 20
}
```

### Query Best Practices

```typescript
// ✅ DO: Use select/partial queries
const products = await db.prisma.product.findMany({
  select: {
    id: true,
    name: true,
    price: true,
    // Only select needed fields
  },
  take: 20,
});

// ✅ DO: Use proper pagination
const page2 = await db.prisma.product.findMany({
  skip: 20, // Offset
  take: 20, // Limit
  cursor: { id: lastId }, // Cursor-based (faster)
});

// ❌ DON'T: Fetch all records
const allProducts = await db.prisma.product.findMany(); // Never do this!

// ✅ DO: Use includes wisely (avoid N+1)
const orders = await db.prisma.order.findMany({
  include: {
    items: { select: { id: true, quantity: true, product: { select: { name: true } } } },
    user: { select: { name: true, email: true } },
  },
});
```

### Slow Query Detection

The database optimizer automatically logs slow queries (>1 second):

```
⚠️ Slow query detected: findMany took 2340ms
```

Monitor query performance:

```typescript
const metrics = db.getQueryMetrics();
console.log(metrics.summary);
// {
//   totalQueries: 150,
//   averageDuration: 45,
//   slowQueries: 2,
//   cacheHitRate: 0.85
// }
```

---

## Middleware & Monitoring

### Built-in Middleware Features

The middleware (`src/middleware.ts`) provides:

1. **Performance Tracking**: Request timing, response times
2. **Rate Limiting**: Per-endpoint rate limits
3. **Security Headers**: CSP, HSTS, XSS protection
4. **Bot Detection**: Block malicious bots
5. **Geo Detection**: Country detection for multi-tenant
6. **Health Check**: `/api/health` endpoint

### Health Check Endpoint

```bash
curl https://algeriatrade.dz/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": "2d 5h 30m",
  "version": "1.0.0",
  "environment": "production",
  "metrics": {
    "totalRequests": 15420,
    "averageResponseTime": 85,
    "p95ResponseTime": 230,
    "p99ResponseTime": 450,
    "errorRate": 0.008,
    "cacheHitRate": 0.82,
    "requestsPerSecond": 45.6
  },
  "memory": {
    "heapUsed": 128,
    "heapTotal": 256,
    "rss": 180
  },
  "issues": []
}
```

### Custom Metrics

Add performance tracking to any API route:

```typescript
import { withPerformanceTracking } from '@/lib/performance/middleware';

export const GET = withPerformanceTracking(async (request) => {
  const products = await fetchProducts();
  return Response.json(products);
}, { routeName: 'products-list' });
```

---

## PWA Enhancements

### Enhanced Service Worker

The service worker (`public/sw-enhanced.js`) implements:

1. **Offline-First Strategy**: Show cached content immediately
2. **Background Sync**: Queue actions when offline, sync when online
3. **Push Notifications**: Real-time updates even when tab is closed
4. **Smart Caching**: Different strategies per resource type

### Register Enhanced SW

```typescript
// In your app layout or root page
'use client';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-enhanced.js')
        .then((reg) => console.log('Enhanced SW registered:', reg.scope))
        .catch((err) => console.log('SW registration failed:', err));
    }
  }, []);

  return null;
}
```

### Background Sync Usage

```typescript
// Queue action for background sync
async function queueAction(action) {
  // Save to IndexedDB
  await savePendingAction({
    type: 'favorite',
    data: { productId: '123', userId: '456' },
  });
  
  // Trigger sync when back online
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    await navigator.serviceWorker.ready;
    await (navigator.serviceWorker as any).sync.register('sync-favorites');
  }
}
```

---

## Compression & Minification

### Automatic Configuration

Next.js handles most compression automatically. Additional config in `src/lib/performance/compression-config.ts`:

```typescript
import { DEFAULT_COMPRESSION_CONFIG } from '@/lib/performance/compression-config';

// Config is applied via next.config.js
module.exports = {
  // ... other config
  
  compress: true, // Enable gzip/brotli
  
  // Production optimizations
  productionBrowserSourceMaps: false,
};
```

### Asset Pipeline

Images and fonts are optimized automatically:

| Asset Type | Optimization | Size Reduction |
|------------|-------------|----------------|
| JPEG/PNG | WebP/AVIF conversion | -50% to -70% |
| SVG | Minification | -20% |
| Fonts | Subset + WOFF2 | -60% |
| JS/CSS | Terser minification | -30% |

---

## Performance Metrics

### Core Web Vitals Targets

| Metric | Target | Good | Needs Work | Poor |
|--------|--------|------|------------|------|
| FCP | < 1.8s | < 1.8s | 1.8s - 3s | > 3s |
| LCP | < 2.5s | < 2.5s | 2.5s - 4s | > 4s |
| CLS | < 0.1 | < 0.1 | 0.1 - 0.25 | > 0.25 |
| FID | < 100ms | < 100ms | 100ms - 300ms | > 300ms |
| TTFB | < 800ms | < 800ms | 800ms - 1800ms | > 1800s |

### Monitoring Tools

1. **Lighthouse CI**: Automated audits in CI/CD
2. **Vercel Analytics**: Real-user monitoring
3. **Sentry**: Error tracking with performance data
4. **Custom Dashboard**: `/api/health` endpoint

### Running Local Audits

```bash
# Run Lighthouse
npx lighthouse https://localhost:3000 --view

# Run with custom thresholds
npx lighthouse https://localhost:3000 \
  --preset=desktop \
  --only-categories=performance \
  --thresholds=performance:0.9,accessibility:0.95
```

---

## Troubleshooting

### Common Issues

#### Images Not Loading

**Symptom**: Images show broken or don't optimize

**Solutions**:
1. Check `NEXT_PUBLIC_IMAGE_PROVIDER` env var
2. For remote images, add domain to `next.config.js`
3. Verify Cloudinary/Imgix credentials

#### Cache Not Working

**Symptom**: Data always fresh, no caching

**Solutions**:
1. Verify Redis is running (`redis-cli ping`)
2. Check `REDIS_URL` environment variable
3. Review cache tags match invalidation calls

#### Large Bundle Size

**Symptom**: Initial JS > 500KB

**Solutions**:
1. Run `npx @next/bundle-analyzer`
2. Identify large dependencies
3. Convert to dynamic imports
4. Remove unused packages

#### Slow API Responses

**Symptom**: API calls > 1 second

**Solutions**:
1. Check database indexes
2. Enable query caching
3. Add pagination
4. Review N+1 queries

### Performance Debug Mode

Enable detailed logging:

```bash
# Development mode with verbose logging
NODE_ENV=development npm run dev

# Check middleware logs for request timing
# Look for ⚠️ SLOW warnings
```

### Getting Help

1. Check `/api/health` endpoint for system status
2. Review browser DevTools Network tab
3. Run Lighthouse audit for recommendations
4. Check GitHub Issues for known problems

---

*Last updated: $(date +%Y-%m-%d)*
*Version: 1.0.0*
