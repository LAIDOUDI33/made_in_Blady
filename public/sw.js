// ============================================
// AlgeriaTrade Service Worker v1.0
// Progressive Web App - B2B Platform Algeria
// ============================================

// Cache Names
const CACHE_NAME = 'algeriatrade-v1';
const STATIC_CACHE = 'algeriatrade-static-v1';
const DYNAMIC_CACHE = 'algeriatrade-dynamic-v1';
const IMAGE_CACHE = 'algeriatrade-images-v1';
const API_CACHE = 'algeriatrade-api-v1';

// Cache TTL (in milliseconds)
const CACHE_TTL = {
  static: 30 * 24 * 60 * 60 * 1000, // 30 days
  dynamic: 24 * 60 * 60 * 1000,      // 1 day
  images: 7 * 24 * 60 * 60 * 1000,   // 7 days
  api: 5 * 60 * 1000,                // 5 minutes
};

// Critical assets to pre-cache during install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo.svg',
];

// API endpoints that should be cached
const API_PATTERNS = [
  /\/api\/products/,
  /\/api\/categories/,
  /\/api\/search/,
];

// ============================================
// Install Event - Pre-cache critical assets
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Pre-cache failed:', error);
      })
  );
});

// ============================================
// Activate Event - Clean up old caches
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && 
                         name !== STATIC_CACHE && 
                         name !== DYNAMIC_CACHE &&
                         name !== IMAGE_CACHE &&
                         name !== API_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ============================================
// Fetch Event - Handle different request types
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Route to appropriate strategy based on request type
  if (isAPIRequest(url)) {
    // Network First with Cache Fallback for API calls
    event.respondWith(networkFirstWithCache(request));
  } else if (isImageRequest(request)) {
    // Stale While Revalidate for images
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
  } else if (isStaticAsset(url)) {
    // Cache First for static assets
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else {
    // Network First for navigation and other requests
    event.respondWith(networkFirstWithCache(request));
  }
});

// ============================================
// Caching Strategies
// ============================================

/**
 * Cache First Strategy - Best for static assets
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache First failed:', error);
    return getOfflinePage();
  }
}

/**
 * Network First Strategy - Best for API and dynamic content
 */
async function networkFirstWithCache(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response before putting in cache
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For navigation requests, show offline page
    if (request.mode === 'navigate') {
      return getOfflinePage();
    }
    
    return new Response(JSON.stringify({ error: 'Offline', message: 'Vous êtes hors ligne' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Stale While Revalidate Strategy - Best for images
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch updated version in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null); // Don't fail if offline
  
  // Return cached version immediately if available
  return cachedResponse || fetchPromise || getOfflinePlaceholder();
}

// ============================================
// Helper Functions
// ============================================

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isImageRequest(request) {
  const contentType = request.headers.get('accept') || '';
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(new URL(request.url).pathname);
}

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff2', '.woff', '.ttf', '.otf'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname.startsWith('/_next/static/');
}

async function getOfflinePage() {
  const cache = await caches.open(STATIC_CACHE);
  const offlinePage = await cache.match('/offline.html');
  return offlinePage || new Response('Hors ligne - Vérifiez votre connexion internet', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

function getOfflinePlaceholder() {
  return new Response('', {
    status: 404,
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

// ============================================
// Background Sync for Offline Actions
// ============================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-rfq') {
    event.waitUntil(syncPendingRFQs());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncPendingMessages());
  } else if (event.tag === 'sync-forms') {
    event.waitUntil(syncPendingForms());
  }
});

async function syncPendingRFQs() {
  try {
    const pendingRFQs = await getFromIndexedDB('pending_rfqs');
    
    for (const rfq of pendingRFQs) {
      try {
        await fetch('/api/rfqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rfq.data)
        });
        
        await removeFromIndexedDB('pending_rfqs', rfq.id);
        
        // Notify user of success
        notifyClient({ type: 'rfq_synced', id: rfq.id });
      } catch (error) {
        console.error('[SW] Failed to sync RFQ:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Error syncing RFQs:', error);
  }
}

async function syncPendingMessages() {
  try {
    const pendingMessages = await getFromIndexedDB('pending_messages');
    
    for (const msg of pendingMessages) {
      try {
        await fetch(`/api/messages/${msg.conversationId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg.data)
        });
        
        await removeFromIndexedDB('pending_messages', msg.id);
        
        notifyClient({ type: 'message_synced', id: msg.id });
      } catch (error) {
        console.error('[SW] Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Error syncing messages:', error);
  }
}

async function syncPendingForms() {
  // Generic form sync handler
  console.log('[WS] Syncing pending forms...');
}

// ============================================
// Push Notifications
// ============================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'AlgeriaTrade',
    body: 'Vous avez une nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: '/' }
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'dismiss', title: 'Fermer' }
    ],
    dir: 'ltr',
    lang: 'fr-DZ'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================
// Message Handling from Main Thread
// ============================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data?.type);
  
  switch (event.data?.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      const urls = event.data.urls || [];
      caches.open(DYNAMIC_CACHE).then((cache) => cache.addAll(urls));
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.source?.postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then((size) => {
        event.source?.postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
      
    default:
      break;
  }
});

// ============================================
// IndexedDB Helpers for Offline Storage
// ============================================

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AlgeriaTradeDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for pending RFQs
      if (!db.objectStoreNames.contains('pending_rfqs')) {
        db.createObjectStore('pending_rfqs', { keyPath: 'id' });
      }
      
      // Store for pending messages
      if (!db.objectStoreNames.contains('pending_messages')) {
        db.createObjectStore('pending_messages', { keyPath: 'id' });
      }
      
      // Store for offline data
      if (!db.objectStoreNames.contains('offline_data')) {
        db.createObjectStore('offline_data', { keyPath: 'key' });
      }
    };
  });
}

async function getFromIndexedDB(storeName) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removeFromIndexedDB(storeName, id) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============================================
// Utility Functions
// ============================================

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.clone().blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize; // in bytes
}

function notifyClient(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message);
    });
  });
}

console.log('[SW] Service Worker loaded successfully');
