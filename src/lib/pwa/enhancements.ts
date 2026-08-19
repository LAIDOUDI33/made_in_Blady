/**
 * PWA+ Enhanced Features for AlgeriaTrade.dz
 * Mobile-first Progressive Web App with offline capabilities
 */

// ============ Types ============
export interface SyncQueueItem {
  id: string;
  type: 'order' | 'rfq' | 'message' | 'profile' | 'negotiation';
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
  lastSyncTime: Date | null;
  failedItems: SyncQueueItem[];
}

export interface CacheStrategy {
  name: string;
  patterns: string[];
  strategy: 'network-first' | 'cache-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';
  maxAge?: number;
  maxEntries?: number;
}

export interface PushNotificationPayload {
  type: 'order' | 'negotiation' | 'payment' | 'call' | 'system' | 'message';
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  tag?: string;
}

export interface DeviceRegistration {
  userId: string;
  deviceId: string;
  platform: 'web' | 'ios' | 'android';
  pushEndpoint: string;
  pushAuth: string;
  pushP256dh: string;
  preferences: NotificationPreferences;
  registeredAt: Date;
  lastActiveAt: Date;
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  negotiationAlerts: boolean;
  paymentNotifications: boolean;
  callNotifications: boolean;
  systemAnnouncements: boolean;
  messageNotifications: boolean;
  digestMode: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
}

// ============ Offline-First Data Synchronization ============
export class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private syncQueue: SyncQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private readonly STORAGE_KEY = 'algeriatrade_sync_queue';
  private readonly MAX_RETRIES = 3;

  private constructor() {
    this.loadQueue();
    this.setupEventListeners();
    this.startBackgroundSync();
  }

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners();
        this.syncPendingItems();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
      });
    }
  }

  private startBackgroundSync(): void {
    // Try to sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
        this.syncPendingItems();
      }
    }, 30000);
  }

  async addItem(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queueItem: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(queueItem);
    await this.persistQueue();
    this.notifyListeners();

    // Attempt immediate sync if online
    if (this.isOnline) {
      this.syncPendingItems();
    }

    return queueItem.id;
  }

  async removeItem(id: string): Promise<void> {
    this.syncQueue = this.syncQueue.filter((item) => item.id !== id);
    await this.persistQueue();
    this.notifyListeners();
  }

  async clearCompletedItems(completedIds: string[]): Promise<void> {
    this.syncQueue = this.syncQueue.filter((item) => !completedIds.includes(item.id));
    await this.persistQueue();
    this.notifyListeners();
  }

  private async syncPendingItems(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;
    this.notifyListeners();

    // Sort by priority and timestamp
    const sortedQueue = [...this.syncQueue].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });

    const completedIds: string[] = [];
    const failedItems: SyncQueueItem[] = [];

    for (const item of sortedQueue) {
      try {
        await this.sendToServer(item);
        completedIds.push(item.id);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        
        if (item.retryCount < this.MAX_RETRIES) {
          failedItems.push({
            ...item,
            retryCount: item.retryCount + 1,
          });
        }
        // Max retries exceeded - keep in queue for manual handling
      }
    }

    // Update queue
    for (const id of completedIds) {
      this.syncQueue = this.syncQueue.filter((item) => item.id !== id);
    }

    // Update failed items
    for (const failed of failedItems) {
      const index = this.syncQueue.findIndex((item) => item.id === failed.id);
      if (index !== -1) {
        this.syncQueue[index] = failed;
      }
    }

    await this.persistQueue();
    this.isSyncing = false;
    this.notifyListeners();
  }

  private async sendToServer(item: SyncQueueItem): Promise<Response> {
    const response = await fetch('/api/pwa/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    return response;
  }

  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingItems: this.syncQueue.length,
      lastSyncTime: new Date(), // Simplified - track actual last sync time in production
      failedItems: this.syncQueue.filter((item) => item.retryCount >= this.MAX_RETRIES),
    };
  }

  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  private async persistQueue(): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.listeners.clear();
  }
}

// ============ Cache Strategies ============
export class PWACacheManager {
  private static instance: PWACacheManager;
  private cache: Cache | null = null;
  private readonly CACHE_PREFIX = 'algeriatrade-v2';

  private strategies: CacheStrategy[] = [
    {
      name: 'api-cache',
      patterns: ['/api/'],
      strategy: 'network-first',
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxEntries: 100,
    },
    {
      name: 'static-assets',
      patterns: ['/_next/static/', '/icons/', '/images/'],
      strategy: 'cache-first',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxEntries: 200,
    },
    {
      name: 'fonts',
      patterns: ['/fonts/'],
      strategy: 'cache-first',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      maxEntries: 50,
    },
    {
      name: 'images',
      patterns: ['/uploads/', '/products/images/'],
      strategy: 'stale-while-revalidate',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 150,
    },
  ];

  private constructor() {}

  static getInstance(): PWACacheManager {
    if (!PWACacheManager.instance) {
      PWACacheManager.instance = new PWACacheManager();
    }
    return PWACacheManager.instance;
  }

  async initialize(): Promise<void> {
    if ('caches' in window) {
      this.cache = await caches.open(this.CACHE_PREFIX);
    }
  }

  async getCacheStrategy(url: string): Promise<CacheStrategy | undefined> {
    return this.strategies.find((strategy) =>
      strategy.patterns.some((pattern) => url.includes(pattern))
    );
  }

  async handleRequest(request: Request): Promise<Response | null> {
    if (!this.cache || !('caches' in window)) {
      return null;
    }

    const url = request.url;
    const strategy = await this.getCacheStrategy(url);

    switch (strategy?.strategy) {
      case 'network-first':
        return this.networkFirst(request, strategy);
      case 'cache-first':
        return this.cacheFirst(request, strategy);
      case 'stale-while-revalidate':
        return this.staleWhileRevalidate(request, strategy);
      case 'network-only':
        return fetch(request);
      case 'cache-only':
        return this.cache.match(request);
      default:
        return null;
    }
  }

  private async networkFirst(
    request: Request,
    strategy: CacheStrategy
  ): Promise<Response> {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const clonedResponse = response.clone();
        await this.cache?.put(request, clonedResponse);
      }
      return response;
    } catch {
      const cachedResponse = await this.cache?.match(request);
      return cachedResponse || new Response('Offline', { status: 503 });
    }
  }

  private async cacheFirst(
    request: Request,
    strategy: CacheStrategy
  ): Promise<Response> {
    const cachedResponse = await this.cache?.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const response = await fetch(request);
      if (response.ok) {
        const clonedResponse = response.clone();
        await this.cache?.put(request, clonedResponse);
      }
      return response;
    } catch {
      return new Response('Resource not available offline', { status: 503 });
    }
  }

  private async staleWhileRevalidate(
    request: Request,
    strategy: CacheStrategy
  ): Promise<Response> {
    const cachedResponse = await this.cache?.match(request);

    // Fetch in background and update cache
    fetch(request).then(async (response) => {
      if (response.ok) {
        await this.cache?.put(request, response.clone());
      }
    }).catch(() => {
      // Silent fail - using cached version
    });

    return cachedResponse || new Response('Loading...', { status: 503 });
  }

  async clearCache(strategyName?: string): Promise<void> {
    if (strategyName) {
      const strategy = this.strategies.find((s) => s.name === strategyName);
      if (strategy) {
        // Clear specific pattern matches
        const keys = await this.cache?.keys() || [];
        for (const key of keys) {
          if (strategy.patterns.some((p) => key.url.includes(p))) {
            await this.cache?.delete(key);
          }
        }
      }
    } else {
      // Clear all caches
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        if (name.startsWith(this.CACHE_PREFIX)) {
          await caches.delete(name);
        }
      }
      this.cache = await caches.open(this.CACHE_PREFIX);
    }
  }

  async getCacheSize(): Promise<number> {
    if (!this.cache) return 0;
    
    const keys = await this.cache.keys();
    let totalSize = 0;
    
    for (const key of keys) {
      const response = await this.cache.match(key);
      if (response) {
        const blob = await response.clone().blob();
        totalSize += blob.size;
      }
    }
    
    return totalSize;
  }
}

// ============ Service Worker Management ============
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private updateListeners: Set<(hasUpdate: boolean) => void> = new Set();
  private hasUpdate: boolean = false;

  private constructor() {}

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw-enhanced.js', {
        scope: '/',
      });

      // Check for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.hasUpdate = true;
              this.notifyUpdateListeners(true);
            }
          });
        }
      });

      // Listen for controller changes (when SW takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload page when new service worker activates
        window.location.reload();
      });

      console.log('Service Worker registered successfully');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      return this.hasUpdate;
    } catch (error) {
      console.error('Error checking for SW updates:', error);
      return false;
    }
  }

  async activateUpdate(): Promise<void> {
    if (!this.registration?.waiting) return;

    // Send message to waiting service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  onUpdate(listener: (hasUpdate: boolean) => void): () => void {
    this.updateListeners.add(listener);
    listener(this.hasUpdate); // Call immediately with current state
    return () => this.updateListeners.delete(listener);
  }

  private notifyUpdateListeners(hasUpdate: boolean): void {
    this.updateListeners.forEach((listener) => listener(hasUpdate));
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  async unregister(): Promise<boolean> {
    if (this.registration) {
      const result = await this.registration.unregister();
      this.registration = null;
      return result;
    }
    return false;
  }
}

// ============ Background Sync Registration ============
export async function registerBackgroundSync(tag: string): Promise<boolean> {
  if (!('serviceWorker' in navigator || 'SyncManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    return true;
  } catch (error) {
    console.error('Background sync registration failed:', error);
    return false;
  }
}

// ============ Haptic Feedback Simulation ============
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error'): void {
  if ('vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(30);
        break;
      case 'selection':
        navigator.vibrate(5);
        break;
      case 'success':
        navigator.vibrate([10, 50, 10]);
        break;
      case 'warning':
        navigator.vibrate([15, 30, 15, 30, 15]);
        break;
      case 'error':
        navigator.vibrate([20, 40, 20, 40, 20, 40, 20]);
        break;
    }
  }
}

// ============ Export Singleton Instances ============
export const offlineSync = typeof window !== 'undefined' ? OfflineSyncManager.getInstance() : null;
export const pwaCache = typeof window !== 'undefined' ? PWACacheManager.getInstance() : null;
export const serviceWorker = typeof window !== 'undefined' ? ServiceWorkerManager.getInstance() : null;

// ============ Utility Functions ============
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone) ||
    document.referrer.includes('android-app://')
  );
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}

export function getDeviceInfo(): {
  isMobile: boolean;
  isPWA: boolean;
  isOnline: boolean;
  connectionType: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
} {
  const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
  
  return {
    isMobile: isMobileDevice(),
    isPWA: isPWAInstalled(),
    isOnline: navigator.onLine,
    connectionType: connection?.effectiveType || 'unknown',
    screenWidth: screen.width,
    screenHeight: screen.height,
    pixelRatio: window.devicePixelRatio || 1,
  };
}
