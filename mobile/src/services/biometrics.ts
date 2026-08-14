// Biometric Authentication Service for AlgeriaTrade
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface BiometricInfo {
  available: boolean;
  biometryType: 'Touch ID' | 'Face ID' | 'Empreinte' | null;
}

export interface BiometricConfig {
  allowDeviceCredentials?: boolean;
  promptMessage?: string;
  cancelButtonText?: string;
  fallbackPromptMessage?: string;
}

const DEFAULT_CONFIG: Required<BiometricConfig> = {
  allowDeviceCredentials: true,
  promptMessage: 'Confirmer votre identité',
  cancelButtonText: 'Annuler',
  fallbackPromptMessage: 'Entrez votre code PIN',
};

export class BiometricService {
  private rnb: ReactNativeBiometrics;
  private config: Required<BiometricConfig>;
  private keysExist: boolean = false;

  constructor(config: BiometricConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rnb = new ReactNativeBiometrics({
      allowDeviceCredentials: this.config.allowDeviceCredentials,
    });
  }

  // Check if biometrics is available on device
  async isAvailable(): Promise<BiometricInfo> {
    try {
      const { available, biometryType, error } = await this.rnb.isSensorAvailable();
      
      if (error) {
        console.error('Biometric sensor error:', error);
        return { available: false, biometryType: null };
      }

      let typeLabel: BiometricInfo['biometryType'] = null;
      
      switch (biometryType) {
        case BiometryTypes.TouchID:
          typeLabel = 'Touch ID';
          break;
        case BiometryTypes.FaceID:
          typeLabel = 'Face ID';
          break;
        case BiometryTypes.Biometrics:
          typeLabel = 'Empreinte';
          break;
        default:
          typeLabel = Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'Empreinte digitale';
      }

      return { available, biometryType: typeLabel };
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return { available: false, biometryType: null };
    }
  }

  // Authenticate user with biometrics
  async authenticate(promptMessage?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // First ensure keys exist
      if (!this.keysExist) {
        const { keysCreated } = await this.rnb.createKeys('AlgeriaTradeKey');
        if (!keysCreated) {
          return { success: false, error: 'Impossible de créer les clés biométriques' };
        }
        this.keysExist = true;
      }

      // Create signature to verify identity
      const { signatureVerified, error } = await this.rnb.createSignature({
        promptMessage: promptMessage || this.config.promptMessage,
        payload: `AlgeriaTrade_Auth_${Date.now()}`,
        cancelButtonText: this.config.cancelButtonText,
      });

      if (error) {
        // User cancelled or biometric failed
        return { success: false, error: error };
      }

      return { success: signatureVerified };
    } catch (error) {
      console.error('Biometric auth error:', error);
      return { 
        success: false, 
        error: 'Erreur d\'authentification biométrique' 
      };
    }
  }

  // Simple authentication (no key management)
  async simpleAuthenticate(promptMessage?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { success, error } = await this.rnb.simplePrompt({
        promptMessage: promptMessage || this.config.promptMessage,
        cancelButtonText: this.config.cancelButtonText,
        fallbackPromptMessage: this.config.fallbackPromptMessage,
      });

      if (error) {
        return { success: false, error };
      }

      return { success };
    } catch (error) {
      console.error('Simple biometric auth error:', error);
      return { 
        success: false, 
        error: 'Erreur d\'authentification' 
      };
    }
  }

  // Create biometric keys for user
  async createKeys(): Promise<boolean> {
    try {
      const { keysCreated } = await this.rnb.createKeys('AlgeriaTradeKey');
      this.keysExist = keysCreated;
      
      if (keysCreated) {
        await AsyncStorage.setItem('biometric_keys_created', 'true');
      }
      
      return keysCreated;
    } catch (error) {
      console.error('Create keys error:', error);
      return false;
    }
  }

  // Delete stored keys (on logout)
  async deleteKeys(): Promise<void> {
    try {
      const { keysDeleted } = await this.rnb.deleteKeys('AlgeriaTradeKey');
      this.keysExist = !keysDeleted;
      
      if (keysDeleted) {
        await AsyncStorage.removeItem('biometric_keys_created');
        await AsyncStorage.removeItem('biometric_enabled');
      }
    } catch (error) {
      console.error('Delete keys error:', error);
    }
  }

  // Check if biometric keys exist
  async keysExistCheck(): Promise<boolean> {
    try {
      const { keysExist } = await this.rnb.biometricKeysExist();
      this.keysExist = keysExist;
      return keysExist;
    } catch (error) {
      console.error('Keys exist check error:', error);
      return false;
    }
  }

  // Enable biometric login for user
  async enableBiometric(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check availability first
      const { available, biometryType } = await this.isAvailable();
      
      if (!available) {
        return { 
          success: false, 
          error: `Aucune ${biometryType || 'biométrie'} disponible sur cet appareil` 
        };
      }

      // Test authentication works
      const authResult = await this.authenticate(`Activer ${biometryType || 'la biométrie'}`);
      
      if (!authResult.success) {
        return { 
          success: false, 
          error: authResult.error || 'Authentification échouée' 
        };
      }

      // Save user preference
      await AsyncStorage.setItem('biometric_enabled', 'true');
      await AsyncStorage.setItem('biometric_user_id', userId);

      return { success: true };
    } catch (error) {
      console.error('Enable biometric error:', error);
      return { success: false, error: 'Erreur lors de l\'activation' };
    }
  }

  // Disable biometric login
  async disableBiometric(): Promise<void> {
    await this.deleteKeys();
    await AsyncStorage.removeItem('biometric_user_id');
  }

  // Check if biometric is enabled for current user
  async isEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  // Get the user ID associated with biometric login
  async getAssociatedUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('biometric_user_id');
    } catch {
      return null;
    }
  }

  // Get display name for biometric type
  async getBiometricDisplayName(): Promise<string> {
    const { biometryType } = await this.isAvailable();
    
    switch (biometryType) {
      case 'Face ID':
        return 'Face ID';
      case 'Touch ID':
        return 'Touch ID';
      case 'Empreinte':
        return 'Empreinte digitale';
      default:
        return Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'Empreinte digitale';
    }
  }

  // Get icon name for biometric type
  async getBiometricIconName(): Promise<string> {
    const { biometryType } = await this.isAvailable();
    
    switch (biometryType) {
      case 'Face ID':
        return 'face-recognition';
      case 'Touch ID':
        return 'finger-print';
      case 'Empreinte':
        return 'finger-print';
      default:
        return 'shield-checkmark';
    }
  }
}

// Singleton instance
export const biometricService = new BiometricService();

// React hook for biometric authentication
import { useState, useEffect, useCallback } from 'react';

export function useBiometrics() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometricInfo['biometryType']>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeBiometrics();
  }, []);

  const initializeBiometrics = useCallback(async () => {
    try {
      const info = await biometricService.isAvailable();
      setIsAvailable(info.available);
      setBiometryType(info.biometryType);
      
      const enabled = await biometricService.isEnabled();
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Initialize biometrics error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authenticate = useCallback(async (promptMessage?: string) => {
    return biometricService.authenticate(promptMessage);
  }, []);

  const enableBiometric = useCallback(async (userId: string) => {
    const result = await biometricService.enableBiometric(userId);
    if (result.success) {
      setIsEnabled(true);
    }
    return result;
  }, []);

  const disableBiometric = useCallback(async () => {
    await biometricService.disableBiometric();
    setIsEnabled(false);
  }, []);

  return {
    isLoading,
    isAvailable,
    biometryType,
    isEnabled,
    authenticate,
    enableBiometric,
    disableBiometric,
    getDisplayName: biometricService.getBiometricDisplayName.bind(biometricService),
    getIconName: biometricService.getBiometricIconName.bind(biometricService),
  };
}
