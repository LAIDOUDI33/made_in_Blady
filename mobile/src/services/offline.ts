// Offline storage service using AsyncStorage and SQLite
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface QueuedAction {
  type: 'rfq' | 'message' | 'order';
  payload: any;
  endpoint: string;
  queuedAt: number;
  retryCount: number;
}

export class OfflineService {
  private static instance: OfflineService;
  private cache: Map<string, CacheItem> = new Map();
  
  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  // Check connectivity
  async isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  // Subscribe to connectivity changes
  onConnectivityChange(callback: (isConnected: boolean) => void): () => void {
    const unsubscribe = NetInfo.addEventListener(state => {
      callback(state.isConnected ?? false);
    });
    return unsubscribe;
  }

  // Cache data with TTL (in minutes)
  async cacheData<T>(key: string, data: T, ttlMinutes: number = 30): Promise<void> {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    };
    
    // Memory cache
    this.cache.set(key, item as CacheItem);
    
    // Persistent cache
    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  // Get cached data
  async getCachedData<T>(key: string): Promise<T | null> {
    // Check memory first
    const memCached = this.cache.get(key);
    if (memCached && !this.isExpired(memCached)) {
      return memCached.data as T;
    }
    
    // Check persistent storage
    try {
      const stored = await AsyncStorage.getItem(`cache_${key}`);
      if (stored) {
        const item: CacheItem = JSON.parse(stored);
        if (!this.isExpired(item)) {
          this.cache.set(key, item); // Restore to memory
          return item.data as T;
        }
        // Remove expired
        await AsyncStorage.removeItem(`cache_${key}`);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    
    return null;
  }

  // Queue actions for when offline
  async queueAction(action: {
    type: 'rfq' | 'message' | 'order';
    payload: any;
    endpoint: string;
  }): Promise<void> {
    const queue = await this.getActionQueue();
    queue.push({
      ...action,
      queuedAt: Date.now(),
      retryCount: 0,
    });
    await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
  }

  // Get pending actions
  async getActionQueue(): Promise<QueuedAction[]> {
    try {
      const queue = await AsyncStorage.getItem('offline_queue');
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  }

  // Get queue count
  async getQueueCount(): Promise<number> {
    const queue = await this.getActionQueue();
    return queue.length;
  }

  // Process queued actions when back online
  async processQueue(apiService: { request: (endpoint: string, data?: any, method?: string) => Promise<any> }): Promise<{ success: number; failed: number }> {
    const queue = await this.getActionQueue();
    let success = 0;
    let failed = 0;
    
    const remaining: QueuedAction[] = [];
    
    for (const action of queue) {
      try {
        await apiService.request(action.endpoint, action.payload, 'POST');
        success++;
      } catch (error) {
        action.retryCount++;
        if (action.retryCount < 3) {
          remaining.push(action);
        }
        failed++;
      }
    }
    
    // Update queue
    await AsyncStorage.setItem('offline_queue', JSON.stringify(remaining));
    
    return { success, failed };
  }

  // Clear all caches
  async clearCache(): Promise<void> {
    this.cache.clear();
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith('cache_'));
    await AsyncStorage.multiRemove(cacheKeys);
  }

  // Clear only expired caches
  async clearExpiredCache(): Promise<number> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith('cache_'));
    let clearedCount = 0;

    for (const key of cacheKeys) {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const item: CacheItem = JSON.parse(stored);
          if (this.isExpired(item)) {
            await AsyncStorage.removeItem(key);
            clearedCount++;
          }
        }
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }

    return clearedCount;
  }

  // Clear the action queue
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem('offline_queue');
  }

  // Get cache statistics
  async getCacheStats(): Promise<{ totalItems: number; totalSize: number; queueLength: number }> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith('cache_'));
    const queue = await this.getActionQueue();
    
    let totalSize = 0;
    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length * 2; // Approximate size in bytes (UTF-16)
      }
    }

    return {
      totalItems: cacheKeys.length,
      totalSize,
      queueLength: queue.length,
    };
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }
}

export const offlineService = OfflineService.getInstance();

// Hook for React components
import { useEffect, useState, useCallback } from 'react';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await offlineService.isConnected();
      setIsOnline(connected);
    };

    const unsubscribe = offlineService.onConnectivityChange((connected) => {
      setIsOnline(connected);
    });

    checkConnection();

    return unsubscribe;
  }, []);

  return { isOnline, isOffline: !isOnline };
}

// Higher-order function for data fetching with offline support
export function withOfflineCache<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  ttlMinutes: number = 30
) {
  return async (): Promise<{ data: T | null; fromCache: boolean; error: Error | null }> => {
    try {
      // Try cache first
      const cached = await offlineService.getCachedData<T>(cacheKey);
      
      // Fetch fresh data in background if online
      const isOnline = await offlineService.isConnected();
      
      if (isOnline) {
        try {
          const freshData = await fetchFn();
          await offlineService.cacheData(cacheKey, freshData, ttlMinutes);
          return { data: freshData, fromCache: false, error: null };
        } catch (fetchError) {
          // Return cached data if fetch fails
          if (cached) {
            return { data: cached, fromCache: true, error: null };
          }
          throw fetchError;
        }
      }
      
      // Offline - return cached data
      if (cached) {
        return { data: cached, fromCache: true, error: null };
      }
      
      return { data: null, fromCache: false, error: new Error('No cached data available') };
    } catch (error) {
      return { data: null, fromCache: false, error: error as Error };
    }
  };
}
