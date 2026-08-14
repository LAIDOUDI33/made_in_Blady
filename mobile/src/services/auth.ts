import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Storage Keys
const STORAGE_KEYS = {
  AUTH_TOKEN: '@algeriatrade_auth_token',
  USER_DATA: '@algeriatrade_user_data',
  ONBOARDING_COMPLETE: '@algeriatrade_onboarding_complete',
  NOTIFICATION_PREFS: '@algeriatrade_notification_prefs',
};

// Types
interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  avatar?: string;
  company?: string;
}

// Auth Service
class AuthService {
  // Save token
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      api.setToken(token);
    } catch (error) {
      console.error('[Auth] Error saving token:', error);
      throw error;
    }
  }

  // Get saved token
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('[Auth] Error getting token:', error);
      return null;
    }
  }

  // Remove token (logout)
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      api.setToken(null);
    } catch (error) {
      console.error('[Auth] Error removing token:', error);
      throw error;
    }
  }

  // Save user data
  async saveUser(user: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('[Auth] Error saving user:', error);
      throw error;
    }
  }

  // Get user data
  async getUser(): Promise<UserData | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('[Auth] Error getting user:', error);
      return null;
    }
  }

  // Remove user data
  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('[Auth] Error removing user:', error);
      throw error;
    }
  }

  // Login
  async login(email: string, password: string): Promise<{ token: string; user: UserData }> {
    const response = await api.login(email, password);
    
    const { token, user } = response;
    
    // Save to storage
    await this.saveToken(token);
    await this.saveUser(user);
    
    return { token, user };
  }

  // Register
  async register(data: any): Promise<{ token: string; user: UserData }> {
    const response = await api.register(data);
    
    const { token, user } = response;
    
    // Save to storage
    await this.saveToken(token);
    await this.saveUser(user);
    
    return { token, user };
  }

  // Logout
  async logout(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  }

  // Check if authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // Initialize auth state from storage
  async initializeAuth(): Promise<{ token: string | null; user: UserData | null }> {
    const [token, user] = await Promise.all([
      this.getToken(),
      this.getUser(),
    ]);

    if (token) {
      api.setToken(token);
    }

    return { token, user };
  }

  // Onboarding
  async setOnboardingComplete(complete: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ONBOARDING_COMPLETE,
        JSON.stringify(complete)
      );
    } catch (error) {
      console.error('[Auth] Error setting onboarding:', error);
    }
  }

  async isOnboardingComplete(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      return value ? JSON.parse(value) : false;
    } catch {
      return false;
    }
  }

  // Notification preferences
  async saveNotificationPrefs(prefs: Record<string, boolean>): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATION_PREFS,
        JSON.stringify(prefs)
      );
    } catch (error) {
      console.error('[Auth] Error saving notification prefs:', error);
    }
  }

  async getNotificationPrefs(): Promise<Record<string, boolean>> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFS);
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      api.setToken(null);
    } catch (error) {
      console.error('[Auth] Error clearing data:', error);
      throw error;
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;

// Also export class for custom instances
export { AuthService };
export { STORAGE_KEYS };
export type { UserData };
