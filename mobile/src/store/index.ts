import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  avatar?: string;
  company?: string;
  phone?: string;
  verified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

// Auth Store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      // Actions
      setUser: (user) =>
        set({ user, isAuthenticated: !!get().token }),

      setToken: (token) =>
        set({ token, isAuthenticated: !!get().user }),

      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      initializeAuth: async () => {
        try {
          const { token, user } = get();
          
          if (token && user) {
            set({
              isLoading: false,
              isAuthenticated: true,
            });
          } else {
            set({
              isLoading: false,
              isAuthenticated: false,
            });
          }
        } catch (error) {
          console.error('[Store] Initialize auth error:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'algeriatrade-auth-storage',
      storage: createJSONStorage(() => require('@react-native-async-storage/async-storage').default),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

// UI Store (not persisted)
interface UIState {
  isOnline: boolean;
  showBottomNav: boolean;
  pendingNotifications: number;
  unreadMessages: number;

  // Actions
  setIsOnline: (online: boolean) => void;
  toggleBottomNav: () => void;
  setPendingNotifications: (count: number) => void;
  setUnreadMessages: (count: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isOnline: true,
  showBottomNav: true,
  pendingNotifications: 0,
  unreadMessages: 3,

  setIsOnline: (isOnline) => set({ isOnline }),
  
  toggleBottomNav: () =>
    set((state) => ({ showBottomNav: !state.showBottomNav })),
  
  setPendingNotifications: (pendingNotifications) =>
    set({ pendingNotifications }),
  
  setUnreadMessages: (unreadMessages) => set({ unreadMessages }),
}));

// Cart/Order Store (persisted)
interface CartItem {
  id: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  image?: string;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;

  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      totalAmount: 0,

      addItem: (itemData) => {
        const { items } = get();
        
        // Check if item already exists
        const existingIndex = items.findIndex(
          (i) => i.productId === itemData.productId && i.supplierId === itemData.supplierId
        );

        let newItems: CartItem[];

        if (existingIndex >= 0) {
          // Update quantity
          newItems = items.map((item, index) =>
            index === existingIndex
              ? { ...item, quantity: item.quantity + itemData.quantity }
              : item
          );
        } else {
          // Add new item
          newItems = [
            ...items,
            { ...itemData, id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` },
          ];
        }

        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

        set({
          items: newItems,
          itemCount,
          totalAmount,
        });
      },

      removeItem: (id) => {
        const { items } = get();
        const newItems = items.filter((item) => item.id !== id);
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

        set({
          items: newItems,
          itemCount,
          totalAmount,
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        const { items } = get();
        const newItems = items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        );
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

        set({
          items: newItems,
          itemCount,
          totalAmount,
        });
      },

      clearCart: () =>
        set({
          items: [],
          itemCount: 0,
          totalAmount: 0,
        }),
    }),
    {
      name: 'algeriatrade-cart-storage',
      storage: createJSONStorage(() => require('@react-native-async-storage/async-storage').default),
    }
  )
);

// Favorites Store (persisted)
interface FavoritesState {
  productIds: string[];
  
  // Actions
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      productIds: [],

      addFavorite: (productId) =>
        set((state) => ({ productIds: [...state.productIds, productId] })),

      removeFavorite: (productId) =>
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        })),

      isFavorite: (productId) => get().productIds.includes(productId),

      toggleFavorite: (productId) => {
        const { isFavorite, addFavorite, removeFavorite } = get();
        if (isFavorite(productId)) {
          removeFavorite(productId);
        } else {
          addFavorite(productId);
        }
      },

      clearFavorites: () => set({ productIds: [] }),
    }),
    {
      name: 'algeriatrade-favorites-storage',
      storage: createJSONStorage(() => require('@react-native-async-storage/async-storage').default),
    }
  )
);

// Export all stores
export default {
  useAuthStore,
  useUIStore,
  useCartStore,
  useFavoritesStore,
};
