/**
 * AlgeriaTrade.dz - Enhanced Service Worker (PWA)
 * 
 * Features:
 * - Offline-first caching strategy
 * - Background sync for API requests
 * - Push notification handling
 * - Cache versioning and invalidation
 * - Network-aware resource loading
 * - Pre-caching of critical assets
 */

// ===========================================
# Service Worker Configuration
// ===========================================

const CONFIG = {
  // Cache names with versions for easy invalidation
  cacheNames: {
    static: 'algeriatrade-static-v2',
    dynamic: 'algeriatrade-dynamic-v2',
    images: 'algeriatrade-images-v1',
    api: 'algeriatrade-api-v1',
    fonts: 'algeriatrade-fonts-v1',
  },

  // Cache limits
  limits: {
    static: 50, // Max cached static files
    dynamic: 100, // Max cached pages
    images: 200, // Max cached images
    api: 50, // Max API responses
    fonts: 20,
  },

  // TTL in seconds
  ttl: {
    static: 30 * 24 * 60 * 60, // 30 days
    dynamic: 24 * 60 * 60, // 1 day
    images: 7 * 24 * 60 * 60, // 7 days
    api: 5 * 60, // 5 minutes
    fonts: 365 * 24 * 60 * 60, // 1 year
  },

  // Pre-cache critical assets on install
  precacheUrls: [
    '/',
    '/offline.html',
    '/manifest.json',
    '/_next/static/css/main.css',
    '/_next/static/js/main.js',
    '/fonts/inter-var-latin.woff2',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
  ],

  // Patterns to cache
  patterns: {
    staticAssets: /\.(js|css|woff2?|ttf|otf)$/,
    images: /\.(jpg|jpeg|png|gif|webp|avif|svg)$/,
    apiRoutes: /^\/api\//,
    sameOrigin: self.location.origin,
  },

  // Network strategies per route type
  strategies: {
    static: 'cacheFirst', // Static assets rarely change
    images: 'staleWhileRevalidate', // Show cached, update in background
    api: 'networkFirst', // Always try network first for data
    pages: 'staleWhileRevalidate', // Show cached page, update
    fonts: 'cacheFirst', // Fonts change very rarely
  },
};

// ===========================================
# Install Event - Precache Critical Assets
// ===========================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    Promise.all([
      // Precache critical assets
      caches.open(CONFIG.cacheNames.static).then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(CONFIG.precacheUrls);
      }),

      // Create offline page cache
      caches.open(CONFIG.cacheNames.dynamic).then((cache) => {
        return cache.add('/offline.html');
      }),
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// ===========================================
# Activate Event - Clean Up Old Caches
// ===========================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !Object.values(CONFIG.cacheNames).includes(name))
            .map((name) => {
              console.log(`[SW] Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      }),

      // Take control of all clients immediately
      self.clients.claim(),
    ]).then(() => {
      console.log('[SW] Activation complete');
    })
  );
});

// ===========================================
# Fetch Event - Main Request Handler
// ===========================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    handleNonGetRequest(event);
    return;
  }

  // Skip cross-origin requests (except CDN)
  if (!isSameOrAllowedOrigin(url)) {
    return;
  }

  // Route to appropriate strategy
  if (CONFIG.patterns.staticAssets.test(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
  } else if (CONFIG.patterns.images.test(url.pathname)) {
    event.respondWith(handleImage(request));
  } else if (CONFIG.patterns.apiRoutes.test(url.pathname)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleDynamicContent(request));
  }
});

// ===========================================
# Strategy Implementations
// ===========================================

/**
 * Cache First Strategy - For static assets
 */
async function handleStaticAsset(request: Request): Promise<Response> {
  const cache = await caches.open(CONFIG.cacheNames.static);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Enforce cache size limit
      await enforceCacheLimit(cache, CONFIG.limits.static);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Stale While Revalidate Strategy - For images
 */
async function handleImage(request: Request): Promise<Response> {
  const cache = await caches.open(CONFIG.cacheNames.images);
  const cachedResponse = await cache.match(request);

  // Return cached immediately if available
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        enforceCacheLimit(cache, CONFIG.limits.images);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse); // Fallback to cache on error

  return cachedResponse || fetchPromise;
}

/**
 * Network First Strategy - For API requests
 */
async function handleAPIRequest(request: Request): Promise<Response> {
  const cache = await caches.open(CONFIG.cacheNames.api);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone and cache successful API responses
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.warn('[SW] API request failed, trying cache:', request.url);
    
    // Try cache as fallback
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add header to indicate stale data
      const headers = new Headers(cachedResponse.headers);
      headers.set('x-sw-cache-status', 'stale');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers,
      });
    }

    // Return offline response for API failures
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are currently offline. This data is not available.',
      }),
      {
        status: 503,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}

/**
 * Navigation Request Handler - For HTML pages
 */
async function handleNavigationRequest(request: Request): Promise<Response> {
  const cache = await caches.open(CONFIG.cacheNames.dynamic);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful navigation responses
      const responseToCache = networkResponse.clone();
      enforceCacheLimit(cache, CONFIG.limits.dynamic);
      cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.warn('[SW] Navigation failed, trying cache:', request.url);

    // Try cache
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    const offlinePage = await cache.match('/offline.html');
    return (
      offlinePage ||
      new Response(
        `<!DOCTYPE html>
        <html lang="en">
        <head><title>Offline - AlgeriaTrade.dz</title></head>
        <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6;">
          <div style="text-align: center; padding: 2rem;">
            <h1 style="color: #1f2937; margin-bottom: 0.5rem;">You're Offline</h1>
            <p style="color: #6b7280;">Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
              Retry
            </button>
          </div>
        </body>
        </html>`,
        {
          headers: { 'content-type': 'text/html' },
          status: 503,
        }
      )
    );
  }
}

/**
 * Dynamic Content Handler - Stale while revalidate
 */
async function handleDynamicContent(request: Request): Promise<Response> {
  const cache = await caches.open(CONFIG.cacheNames.dynamic);
  const cachedResponse = await cache.match(request);

  // Always fetch from network
  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        enforceCacheLimit(cache, CONFIG.limits.dynamic);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    });

  // Return cached or wait for network
  return cachedResponse || fetchPromise;
}

// ===========================================
# Background Sync
// ===========================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  } else if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  } else if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

async function syncPendingActions(): Promise<void> {
  // Get all pending actions from IndexedDB
  const pendingActions = await getPendingActions();

  for (const action of pendingActions) {
    try {
      await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: JSON.stringify(action.data),
      });

      // Remove successful actions
      await removePendingAction(action.id);
    } catch (error) {
      console.error('[SW] Failed to sync action:', action.id, error);
    }
  }
}

async function syncFavorites(): Promise<void> {
  // Sync favorited items with server
  console.log('[SW] Syncing favorites...');
}

async function syncCart(): Promise<void> {
  // Sync cart items with server
  console.log('[SW] Syncing cart...');
}

// ===========================================
# Push Notifications
// ===========================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: 'AlgeriaTrade.dz',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {},
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error('[SW] Failed to parse push data:', e);
    }
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'view') {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// ===========================================
# Message Handling (from main thread)
// ===========================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      clearCaches();
      break;

    case 'PRECACHE_URLS':
      precacheUrls(event.data.urls);
      break;

    case 'INVALIDATE_CACHE':
      invalidateCache(event.data.pattern);
      break;
  }
});

async function clearCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

async function precacheUrls(urls: string[]): Promise<void> {
  const cache = await caches.open(CONFIG.cacheNames.static);
  await cache.addAll(urls.filter(Boolean));
  console.log(`[SW] Precached ${urls.length} URLs`);
}

async function invalidateCache(pattern: RegExp): Promise<void> {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    keys.forEach((request) => {
      if (pattern.test(request.url)) {
        cache.delete(request);
      }
    });
  }
  
  console.log('[SW] Cache invalidated for pattern:', pattern);
}

// ===========================================
# Utility Functions
// ===========================================

function isSameOrAllowedOrigin(url: URL): boolean {
  // Allow same origin
  if (url.origin === self.location.origin) return true;

  // Allow common CDNs
  const allowedCDNs = [
    'res.cloudinary.com',
    'images.algeriatrade.dz',
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
  ];

  return allowedCDNs.some((cdn) => url.hostname === cdn);
}

function isNavigationRequest(request: Request): boolean {
  return (
    request.mode === 'navigate' &&
    request.destination === 'document'
  );
}

async function enforceCacheLimit(
  cache: Cache,
  maxSize: number
): Promise<void> {
  const keys = await cache.keys();
  
  if (keys.length <= maxSize) return;

  // Delete oldest entries to maintain limit
  const deleteCount = keys.length - maxSize;
  const oldKeys = keys.slice(0, deleteCount);
  
  await Promise.all(oldKeys.map((key) => cache.delete(key)));
}

// IndexedDB helpers for background sync
async function getPendingActions(): Promise<any[]> {
  // Implementation would use IndexedDB
  return [];
}

async function removePendingAction(id: string): Promise<void> {
  // Implementation would use IndexedDB
}

console.log('[SW] Service worker loaded');
