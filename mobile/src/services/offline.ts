// Offline Storage Service - AlgeriaTrade Mobile
// Service de stockage hors ligne pour l'application mobile

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetInfo } from '@react-native-community/netinfo';

/**
 * Storage keys
 * Clés de stockage
 */
const STORAGE_KEYS = {
  AUTH_TOKEN: '@algeriatrade_auth_token',
  USER_DATA: '@algeriatrade_user_data',
  FAVORITES: '@algeriatrade_favorites',
  RECENT_SEARCHES: '@algeriatrade_recent_searches',
  CART_ITEMS: '@algeriatrade_cart_items',
  OFFLINE_PRODUCTS: '@algeriatrade_offline_products',
  UNsyncED_ACTIONS: '@algeriatrade_unsynced_actions',
  SETTINGS: '@algeriatrade_settings',
  NOTIFICATION_PREFS: '@algeriatrade_notification_prefs',
  LAST_SYNC: '@algeriatrade_last_sync',
};

/**
 * Offline storage manager
 * Gestionnaire de stockage hors ligne
 */
export class OfflineStorageService {
  private static instance: OfflineStorageService;
  private isOnline: boolean = true;
  private syncQueue: Array<{
    id: string;
    action: string;
    data: any;
    timestamp: number;
  }> = [];

  static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  /**
   * Initialize offline storage
   * Initialiser le stockage hors ligne
   */
  async initialize(): Promise<void> {
    // Set up network listener
    this.setupNetworkListener();
    
    // Load unsynced actions
    await this.loadSyncQueue();
    
    console.log('[OfflineStorage] Initialized');
  }

  /**
   * Setup network status listener
   * Configurer l'écouteur d'état du réseau
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      
      if (this.isOnline) {
        this.syncPendingActions();
      }
    });
  }

  // ============================================
  // AUTHENTICATION STORAGE
  // ============================================

  async saveAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async getAuthToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
  }

  // ============================================
  // USER DATA
  // ============================================

  async saveUserData(user: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  async getUserData(): Promise<any | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  }

  // ============================================
  // FAVORITES (OFFLINE-FIRST)
  // ============================================

  async addToFavorites(productId: string): Promise<void> {
    const favorites = await getFavorites();
    
    if (!favorites.includes(productId)) {
      favorites.push(productId);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      
      // Queue for sync when online
      if (!this.isOnline) {
        await this.queueAction('add_favorite', { productId });
      }
    }
  }

  async removeFromFavorites(productId: string): Promise<void> {
    const favorites = await getFavorites();
    const updated = favorites.filter((id: string) => id !== productId);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    
    if (!this.isOnline) {
      await this.queueAction('remove_favorite', { productId });
    }
  }

  async getFavorites(): Promise<string[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  }

  async isFavorite(productId: string): Promise<boolean> {
    const favorites = await getFavorites();
    return favorites.includes(productId);
  }

  // ============================================
  // RECENT SEARCHES
  // ============================================

  async addRecentSearch(query: string): Promise<void> {
    const searches = await getRecentSearches();
    
    // Remove if already exists (move to top)
    const filtered = searches.filter((s: string) => s.toLowerCase() !== query.toLowerCase());
    
    // Add to beginning and limit to 10
    const updated = [query, ...filtered].slice(0, 10);
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
  }

  async getRecentSearches(): Promise<string[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
    return data ? JSON.parse(data) : [];
  }

  async clearRecentSearches(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  }

  // ============================================
  // CART (OFFLINE SUPPORT)
  // ============================================

  async addToCart(item: CartItem): Promise<void> {
    const cart = await getCartItems();
    
    const existingIndex = cart.findIndex(i => i.productId === item.productId);
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += item.quantity;
    } else {
      cart.push(item);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(cart));
    
    if (!this.isOnline) {
      await this.queueAction('add_to_cart', item);
    }
  }

  async removeFromCart(productId: string): Promise<void> {
    const cart = await getCartItems();
    const updated = cart.filter(item => item.productId !== productId);
    await AsyncStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(updated));
  }

  async updateCartQuantity(productId: string, quantity: number): Promise<void> {
    const cart = await getCartItems();
    const index = cart.findIndex(item => item.productId === productId);
    
    if (index >= 0) {
      if (quantity <= 0) {
        await removeFromCart(productId);
      } else {
        cart[index].quantity = quantity;
        await AsyncStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(cart));
      }
    }
  }

  async getCartItems(): Promise<CartItem[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CART_ITEMS);
    return data ? JSON.parse(data) : [];
  }

  async clearCart(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.CART_ITEMS);
  }

  async getCartTotal(): Promise<number> {
    const items = await getCartItems();
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // ============================================
  // OFFLINE PRODUCT CACHE
  // ============================================

  async cacheProducts(products: Product[]): Promise<void> {
    const existing = await getCachedProducts();
    const updated = [...existing, ...products];
    
    // Deduplicate by ID
    const unique = updated.filter((product, index, self) =>
      index === self.findIndex(p => p.id === product.id)
    );
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.OFFLINE_PRODUCTS, 
      JSON.stringify(unique.slice(0, 500)) // Limit cache size
    );
    
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  async getCachedProducts(): Promise<Product[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_PRODUCTS);
    return data ? JSON.parse(data) : [];
  }

  async searchCachedProducts(query: string): Promise<Product[]> {
    const products = await getCachedProducts();
    const lowerQuery = query.toLowerCase();
    
    return products.filter(product =>
      product.name?.toLowerCase().includes(lowerQuery) ||
      product.description?.toLowerCase().includes(lowerQuery) ||
      product.category?.toLowerCase().includes(lowerQuery)
    );
  }

  async getLastSyncTime(): Promise<Date | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return data ? new Date(data) : null;
  }

  // ============================================
  // SYNC QUEUE
  // ============================================

  private async queueAction(action: string, data: any): Promise<void> {
    const actionItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: Date.now(),
    };
    
    this.syncQueue.push(actionItem);
    await AsyncStorage.setItem(
      STORAGE_KEYS.UNSYNCED_ACTIONS, 
      JSON.stringify(this.syncQueue)
    );
  }

  private async loadSyncQueue(): Promise<void> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.UNSYNCED_ACTIONS);
    this.syncQueue = data ? JSON.parse(data) : [];
  }

  async syncPendingActions(): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    for (const action of this.syncQueue) {
      try {
        // In production, send to API server
        console.log('[OfflineStorage] Syncing:', action.action, action.data);
        
        // Simulate successful sync
        synced++;
      } catch (error) {
        console.error('[OfflineStorage] Sync failed:', error);
        failed++;
      }
    }

    // Clear synced actions
    this.syncQueue = this.syncQueue.slice(failed);
    await AsyncStorage.setItem(
      STORAGE_KEYS.UNSYNCED_ACTIONS, 
      JSON.stringify(this.syncQueue)
    );

    return { synced, failed };
  }

  // ============================================
  // SETTINGS & PREFERENCES
  // ============================================

  async saveSettings(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  async getSettings(): Promise<AppSettings> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data 
      ? JSON.parse(data) 
      : {
          language: 'fr',
          notificationsEnabled: true,
          darkMode: false,
          currency: 'DZD',
          offlineMode: true,
        };
  }

  async saveNotificationPreferences(prefs: NotificationPrefs): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFS, JSON.stringify(prefs));
  }

  async getNotificationPreferences(): Promise<NotificationPrefs> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFS);
    return data
      ? JSON.parse(data)
      : {
          messages: true,
          orders: true,
          rfq: true,
          promotions: false,
        };
  }

  // ============================================
  // UTILITIES
  // ============================================

  async isOnlineStatus(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  async clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    this.syncQueue = [];
  }

  async getStorageSize(): Promise<number> {
    let totalSize = 0;
    
    const keys = await AsyncStorage.getAllKeys();
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length * 2; // Approximate bytes
      }
    }
    
    return totalSize;
  }
}

// Type definitions
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  supplierId?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
  supplierId?: string;
}

interface AppSettings {
  language: 'fr' | 'ar' | 'en';
  notificationsEnabled: boolean;
  darkMode: boolean;
  currency: string;
  offlineMode: boolean;
}

interface NotificationPrefs {
  messages: boolean;
  orders: boolean;
  rfq: boolean;
  promotions: boolean;
}

// Export singleton instance
export const offlineStorage = OfflineStorageService.getInstance();

// Helper functions for internal use
async function getFavorites() {
  return offlineStorage.getFavorites();
}
async function getRecentSearches() {
  return offlineStorage.getRecentSearches();
}
async function getCartItems() {
  return offlineStorage.getCartItems();
}
function removeFromCart(productId: string) {
  return offlineStorage.removeFromCart(productId);
}
async function getCachedProducts() {
  return offlineStorage.getCachedProducts();
}
