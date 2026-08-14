import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const KEYS = {
  CACHE_PREFIX: '@algeriatrade_cache_',
  OFFLINE_QUEUE: '@algeriatrade_offline_queue',
  SETTINGS: '@algeriatrade_settings',
  SEARCH_HISTORY: '@algeriatrade_search_history',
};

// Types
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number; // TTL in milliseconds
}

interface OfflineAction {
  id: string;
  type: 'rfq' | 'message' | 'order';
  endpoint: string;
  payload: any;
  createdAt: number;
}

class StorageService {
  // ============================================
  // Cache Management
  // ============================================

  async setCache<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: ttl,
      };
      await AsyncStorage.setItem(
        `${KEYS.CACHE_PREFIX}${key}`,
        JSON.stringify(item)
      );
    } catch (error) {
      console.error('[Storage] Error setting cache:', error);
      throw error;
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(`${KEYS.CACHE_PREFIX}${key}`);
      if (!raw) return null;

      const item: CacheItem<T> = JSON.parse(raw);
      const now = Date.now();

      // Check if expired
      if (now - item.timestamp > item.expiry) {
        await this.removeCache(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('[Storage] Error getting cache:', error);
      return null;
    }
  }

  async removeCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${KEYS.CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('[Storage] Error removing cache:', error);
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(KEYS.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('[Storage] Error clearing cache:', error);
    }
  }

  // ============================================
  // Offline Queue (for background sync)
  // ============================================

  async queueOfflineAction(action: Omit<OfflineAction, 'id' | 'createdAt'>): Promise<string> {
    try {
      const actions = await this.getOfflineQueue();
      
      const newAction: OfflineAction = {
        ...action,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };

      actions.push(newAction);
      await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(actions));

      return newAction.id;
    } catch (error) {
      console.error('[Storage] Error queuing action:', error);
      throw error;
    }
  }

  async getOfflineQueue(): Promise<OfflineAction[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.OFFLINE_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error('[Storage] Error getting offline queue:', error);
      return [];
    }
  }

  async removeOfflineAction(id: string): Promise<void> {
    try {
      const actions = await this.getOfflineQueue();
      const filtered = actions.filter((a) => a.id !== id);
      await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
    } catch (error) {
      console.error('[Storage] Error removing offline action:', error);
    }
  }

  async clearOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.OFFLINE_QUEUE);
    } catch (error) {
      console.error('[Storage] Error clearing offline queue:', error);
    }
  }

  // ============================================
  // Search History
  // ============================================

  async addToSearchHistory(query: string, maxItems: number = 20): Promise<void> {
    try {
      let history = await this.getSearchHistory();
      
      // Remove if already exists (move to top)
      history = history.filter((item) => item.toLowerCase() !== query.toLowerCase());
      
      // Add to beginning
      history.unshift(query);
      
      // Trim to max items
      if (history.length > maxItems) {
        history = history.slice(0, maxItems);
      }

      await AsyncStorage.setItem(KEYS.SEARCH_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('[Storage] Error adding to search history:', error);
    }
  }

  async getSearchHistory(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.SEARCH_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error('[Storage] Error getting search history:', error);
      return [];
    }
  }

  async clearSearchHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.SEARCH_HISTORY);
    } catch (error) {
      console.error('[Storage] Error clearing search history:', error);
    }
  }

  // ============================================
  // Settings
  // ============================================

  async saveSetting(key: string, value: any): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings[key] = value;
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('[Storage] Error saving setting:', error);
      throw error;
    }
  }

  async getSetting<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const settings = await this.getSettings();
      return settings[key] !== undefined ? settings[key] : defaultValue;
    } catch (error) {
      console.error('[Storage] Error getting setting:', error);
      return defaultValue;
    }
  }

  async getSettings(): Promise<Record<string, any>> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error('[Storage] Error getting settings:', error);
      return {};
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('[Storage] Error getting item:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('[Storage] Error setting item:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('[Storage] Error removing item:', error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('[Storage] Error clearing all:', error);
      throw error;
    }
  }

  async getStorageSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }

      return totalSize; // in characters (rough estimate)
    } catch (error) {
      console.error('[Storage] Error getting size:', error);
      return 0;
    }
  }
}

// Export singleton instance
const storageService = new StorageService();
export default storageService;

// Also export class for custom instances
export { StorageService };
export type { CacheItem, OfflineAction };
