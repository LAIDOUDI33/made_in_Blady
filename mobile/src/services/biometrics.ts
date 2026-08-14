// Biometric Authentication Service - AlgeriaTrade Mobile
// Service d'authentification biométrique

import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

/**
 * Biometric auth manager
 * Gestionnaire d'authentification biométrique
 */
export class BiometricAuthService {
  private static instance: BiometricAuthService;
  private rnBiometrics: ReactNativeBiometrics;

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  private constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true, // Allow PIN/pattern as fallback
    });
  }

  /**
   * Check if biometrics are available on device
   * Vérifier si la biométrie est disponible sur l'appareil
   */
  async isAvailable(): Promise<{
    available: boolean;
    biometryType?: string;
    error?: string;
  }> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      
      let typeString: string | undefined;
      
      if (biometryType === BiometryTypes.TouchID) {
        typeString = 'Touch ID';
      } else if (biometryType === BiometryTypes.FaceID) {
        typeString = 'Face ID';
      } else if (biometryType === BiometryTypes.Biometrics) {
        typeString = 'Biometric';
      }

      return { available, biometryType: typeString };
    } catch (error: any) {
      console.error('[BiometricAuth] Availability check failed:', error);
      return { 
        available: false, 
        error: error.message || 'Unknown error' 
      };
    }
  }

  /**
   * Create biometric keys for public key cryptography
   * Créer les clés biométriques pour le chiffrement à clé publique
   */
  async createKeys(): Promise<{ publicKey: string; success: boolean }> {
    try {
      const { publicKey } = await this.rnBiometrics.createKeys();
      console.log('[BiometricAuth] Keys created successfully');
      return { publicKey, success: true };
    } catch (error: any) {
      console.error('[BiometricAuth] Key creation failed:', error);
      return { publicKey: '', success: false, error: error.message };
    }
  }

  /**
   * Delete biometric keys
   * Supprimer les clés biométriques
   */
  async deleteKeys(): Promise<boolean> {
    try {
      const { keysDeleted } = await this.rnBiometrics.deleteKeys();
      console.log('[BiometricAuth] Keys deleted:', keysDeleted);
      return keysDeleted;
    } catch (error: any) {
      console.error('[BiometricAuth] Key deletion failed:', error);
      return false;
    }
  }

  /**
   * Check if biometric keys exist
   * Vérifier si les clés biométriques existent
   */
  async biometricKeysExist(): Promise<boolean> {
    try {
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();
      return keysExist;
    } catch (error) {
      console.error('[BiometricAuth] Key check failed:', error);
      return false;
    }
  }

  /**
   * Prompt user for biometric authentication
   * Demander l'authentification biométrique à l'utilisateur
   */
  async authenticate(promptMessage?: string): Promise<{
    success: boolean;
    error?: string;
    signature?: string;
  }> {
    try {
      const { success, signature } = await this.rnBiometrics.createSignature({
        promptMessage: promptMessage || 'Confirm your identity to continue',
        payload: 'algeriatrade-auth-' + Date.now(), // Unique payload each time
      });

      if (success && signature) {
        console.log('[BiometricAuth] Authentication successful');
        return { success: true, signature };
      }

      return { success: false, error: 'Authentication cancelled or failed' };
    } catch (error: any) {
      console.error('[BiometricAuth] Authentication failed:', error);
      
      // Handle specific errors
      if (error.message?.includes('User cancel')) {
        return { success: false, error: 'cancelled' };
      }
      if (error.message?.includes('Lockout')) {
        return { success: false, error: 'lockout' };
      }
      if (error.message?.includes('No credentials enrolled')) {
        return { success: false, error: 'not_enrolled' };
      }

      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Simple biometric verification (no signature)
   * Vérification biométrique simple (sans signature)
   */
  async simpleAuthenticate(promptMessage?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // For simple auth, we can use the built-in method
      // Note: This requires different setup on some platforms
      const result = await this.authenticate(
        promptMessage || 'Use biometrics to verify'
      );
      
      return {
        success: result.success,
        error: result.error,
      };
    } catch (error: any) {
      console.error('[BiometricAuth] Simple auth failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enable biometric login for user
   * Activer la connexion biométrique pour l'utilisateur
   */
  async enableBiometricLogin(userId: string): Promise<{
    enabled: boolean;
    error?: string;
  }> {
    try {
      // First check availability
      const { available, error } = await this.isAvailable();
      if (!available) {
        return { 
          enabled: false, 
          error: error || 'Biometrics not available on this device' 
        };
      }

      // Create keys for this user
      const { success, error: keyError } = await this.createKeys();
      if (!success) {
        return { enabled: false, error: keyError };
      }

      // Store that biometric is enabled for this user
      // In production, store securely in encrypted storage/keychain
      await this.storeBiometricSetting(userId, true);

      return { enabled: true };
    } catch (error: any) {
      console.error('[BiometricAuth] Enable failed:', error);
      return { enabled: false, error: error.message };
    }
  }

  /**
   * Disable biometric login for user
   * Désactiver la connexion biométrique pour l'utilisateur
   */
  async disableBiometricLogin(userId: string): Promise<void> {
    try {
      await this.deleteKeys();
      await this.storeBiometricSetting(userId, false);
      console.log('[BiometricAuth] Biometric login disabled');
    } catch (error) {
      console.error('[BiometricAuth] Disable failed:', error);
    }
  }

  /**
   * Check if biometric login is enabled for user
   * Vérifier si la connexion biométrique est activée pour l'utilisateur
   */
  async isBiometricLoginEnabled(userId: string): Promise<boolean> {
    try {
      const setting = await this.getBiometricSetting(userId);
      return setting === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Store biometric setting securely
   * Stocker le paramètre biométrique de manière sécurisée
   */
  private async storeBiometricSetting(userId: string, enabled: boolean): Promise<void> {
    // In production, use secure storage like:
    // - iOS: Keychain Services
    // - Android: Encrypted SharedPreferences / Keystore
    // For now, we'll use AsyncStorage with a note that this should be secured
    
    const { AsyncStorage } = require('@react-native-async-storage/async-storage');
    
    const settings = await AsyncStorage.getItem('@algeriatrade_biometric_settings') || '{}';
    const parsedSettings = JSON.parse(settings);
    
    parsedSettings[userId] = {
      enabled,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(
      '@algeriatrade_biometric_settings', 
      JSON.stringify(parsedSettings)
    );
  }

  /**
   * Get biometric setting for user
   * Obtenir le paramètre biométrique pour l'utilisateur
   */
  private async getBiometricSetting(userId: string): Promise<boolean | null> {
    try {
      const { AsyncStorage } = require('@react-native-async-storage/async-storage');
      
      const settings = await AsyncStorage.getItem('@algeriatrace_biometric_settings');
      if (!settings) return null;
      
      const parsedSettings = JSON.parse(settings);
      return parsedSettings[userId]?.enabled ?? null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get human-readable biometry type name
   * Obtenir le nom lisible du type de biométrie
   */
  async getBiometryTypeName(): Promise<string> {
    const { available, biometryType } = await this.isAvailable();
    return biometryType || 'Not Available';
  }
}

// Export singleton instance
export const biometricAuthService = BiometricAuthService.getInstance();

/**
 * Error codes for biometric authentication
 * Codes d'erreur pour l'authentification biométrique
 */
export const BIOMETRIC_ERRORS = {
  CANCELLED: 'cancelled',
  LOCKOUT: 'lockout',
  NOT_ENROLLED: 'not_enrolled',
  NOT_AVAILABLE: 'not_available',
  AUTHENTICATION_FAILED: 'authentication_failed',
} as const;
