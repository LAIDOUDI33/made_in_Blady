/**
 * PWA (Progressive Web App) Utilities
 * 
 * This module provides utilities for registering and managing
 * the service worker, handling offline functionality, and
 * managing push notifications.
 */

// ============================================
// Service Worker Registration
// ============================================

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return Promise.resolve(null);
  }

  return window.navigator.serviceWorker.register('/sw.js', {
    scope: '/'
  }).then((registration) => {
    console.log('[PWA] Service Worker registered successfully:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, show update prompt
            console.log('[PWA] New content available, refresh to update');
            window.dispatchEvent(new CustomEvent('pwa-update-available'));
          }
        });
      }
    });

    return registration;
  }).catch((error) => {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  });
}

export async function unregisterServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('[PWA] Service Worker unregistered');
    }
  }
}

// ============================================
// PWA Install Detection
// ============================================

interface PWAInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredInstallPrompt: PWAInstallPromptEvent | null = null;

export function setupInstallPromptListener(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e as PWAInstallPromptEvent;
    
    window.dispatchEvent(new CustomEvent('pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

export function getDeferredInstallPrompt(): PWAInstallPromptEvent | null {
  return deferredInstallPrompt;
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;

  try {
    await deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Install prompt failed:', error);
    return false;
  }
}

// ============================================
// Online/Offline Status
// ============================================

type ConnectionStatus = 'online' | 'offline';

export function setupConnectionStatusListener(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => {
    onOnline?.();
    window.dispatchEvent(new CustomEvent('connection-online'));
  };

  const handleOffline = () => {
    onOffline?.();
    window.dispatchEvent(new CustomEvent('connection-offline'));
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

// ============================================
// Cache Management
// ============================================

export async function clearAllCaches(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[PWA] All caches cleared');
  }
}

export async function getCacheSize(): Promise<number> {
  if (!('caches' in window)) return 0;

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

  return totalSize;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================
// Background Sync
// ============================================

export async function registerBackgroundSync(tag: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.log('[PWA] Background sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log(`[PWA] Background sync registered: ${tag}`);
    return true;
  } catch (error) {
    console.error('[PWA] Background sync registration failed:', error);
    return false;
  }
}

// ============================================
// IndexedDB Helpers for Offline Storage
// ============================================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AlgeriaTradeDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('pending_rfqs')) {
        db.createObjectStore('pending_rfqs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_messages')) {
        db.createObjectStore('pending_messages', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_forms')) {
        db.createObjectStore('pending_forms', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offline_data')) {
        db.createObjectStore('offline_data', { keyPath: 'key' });
      }
    };
  });
}

export async function saveOfflineData<T>(key: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_data', 'readwrite');
    const store = tx.objectStore('offline_data');
    store.put({ key, data, timestamp: new Date() });
  } catch (error) {
    console.error('[PWA] Failed to save offline data:', error);
  }
}

export async function getOfflineData<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_data', 'readonly');
    const store = tx.objectStore('offline_data');
    const result = await new Promise<IDBRequest<any>>((resolve) => {
      resolve(store.get(key));
    });
    return result?.data || null;
  } catch (error) {
    console.error('[PWA] Failed to get offline data:', error);
    return null;
  }
}

export async function queueOfflineAction(
  type: 'rfq' | 'message' | 'form',
  data: any
): Promise<string> {
  const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const db = await openDB();
    const storeName = type === 'rfq' ? 'pending_rfqs' : type === 'message' ? 'pending_messages' : 'pending_forms';
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.add({ id, data, timestamp: new Date() });
    
    // Register background sync
    await registerBackgroundSync(`sync-${type}s`);
    
    return id;
  } catch (error) {
    console.error('[PWA] Failed to queue offline action:', error);
    throw error;
  }
}

// ============================================
// PWA Detection Utilities
// ============================================

export function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;

  const standalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  return standalone;
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function canShowInstallPrompt(): boolean {
  return !!deferredInstallPrompt && !isInStandaloneMode();
}

// ============================================
// Initialize PWA (call this in your app)
// ============================================

export async function initializePWA(options?: {
  onInstallable?: () => void;
  onInstalled?: () => void;
  onUpdateAvailable?: () => void;
}): Promise<void> {
  // Register service worker
  await registerServiceWorker();

  // Setup install prompt listener
  setupInstallPromptListener();

  // Setup event listeners for options
  if (options?.onInstallable) {
    window.addEventListener('pwa-installable', options.onInstallable);
  }
  if (options?.onInstalled) {
    window.addEventListener('pwa-installed', options.onInstalled);
  }
  if (options?.onUpdateAvailable) {
    window.addEventListener('pwa-update-available', options.onUpdateAvailable);
  }

  console.log('[PWA] Initialized successfully');
}
