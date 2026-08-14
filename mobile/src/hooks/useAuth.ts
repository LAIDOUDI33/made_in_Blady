import { useState, useEffect, useCallback } from 'react';
import authService from '../services/auth';
import api from '../services/api';
import { UserData } from '../services/auth';

interface UseAuthReturn {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from storage
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const { token: savedToken, user: savedUser } = await authService.initializeAuth();
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);
      }
    } catch (err) {
      console.error('[useAuth] Initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.login(email, password);
      
      setToken(result.token);
      setUser(result.user);
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.register(data);
      
      setToken(result.token);
      setUser(result.user);
    } catch (err: any) {
      setError(err.message || "Erreur d'inscription");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('[useAuth] Logout error:', err);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    error,
    login,
    register,
    logout,
    clearError,
    initializeAuth,
  };
}

export default useAuth;
