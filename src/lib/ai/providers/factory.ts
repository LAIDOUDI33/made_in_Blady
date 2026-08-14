// Usine de Providers AI - Création et gestion des instances
// AI Provider Factory - Instance Creation and Management

import { AIProvider, AIProviderType } from './index';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { LocalProvider } from './local';

/**
 * Configuration du provider par défaut
 * Default provider configuration
 */
const DEFAULT_PROVIDER: AIProviderType = 'local';
const FALLBACK_PROVIDER: AIProviderType = 'local'; // Fallback en cas d'erreur / Fallback on error

/**
 * Types de providers disponibles avec leurs configurations
 * Available providers with their configurations
 */
interface ProviderConfig {
  type: AIProviderType;
  envKey?: string; // Variable d'environnement pour la clé API / Env var for API key
  modelEnvKey?: string; // Variable d'environnement pour le modèle / Env var for model
}

const PROVIDER_CONFIGS: Record<AIProviderType, ProviderConfig> = {
  openai: {
    type: 'openai',
    envKey: 'OPENAI_API_KEY',
    modelEnvKey: 'OPENAI_MODEL',
  },
  anthropic: {
    type: 'anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    modelEnvKey: 'ANTHROPIC_MODEL',
  },
  local: {
    type: 'local',
  },
};

/**
 * Créer une instance de provider AI basée sur la configuration
 * Create an AI provider instance based on configuration
 * 
 * @param type Type de provider souhaité (optionnel, utilise AI_PROVIDER ou local)
 * @returns Instance du provider AI
 */
export function createAIProvider(type?: AIProviderType): AIProvider {
  const providerType = type || (process.env.AI_PROVIDER as AIProviderType) || DEFAULT_PROVIDER;
  
  console.log(`[AI Factory] Creating provider: ${providerType}`);

  switch (providerType) {
    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn(
          '[AI Factory] ⚠️ OPENAI_API_KEY non configurée. ' +
          'Fallback vers le provider local. / Not configured. Falling back to local.'
        );
        return new LocalProvider();
      }
      return new OpenAIProvider(apiKey, process.env.OPENAI_MODEL);
    }
    
    case 'anthropic': {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.warn(
          '[AI Factory] ⚠️ ANTHROPIC_API_KEY non configurée. ' +
          'Fallback vers le provider local. / Not configured. Falling back to local.'
        );
        return new LocalProvider();
      }
      return new AnthropicProvider(apiKey, process.env.ANTHROPIC_MODEL);
    }
    
    case 'local':
    default:
      return new LocalProvider();
  }
}

/**
 * Singleton - Instance globale du provider AI
 * Singleton - Global AI provider instance
 */
let providerInstance: AIProvider | null = null;

/**
 * Obtenir l'instance singleton du provider AI
 * Get the singleton AI provider instance
 * 
 * L'instance est créée au premier appel et réutilisée ensuite.
 * Pour forcer une recréation, utiliser resetProvider().
 * 
 * The instance is created on first call and reused afterwards.
 * To force recreation, use resetProvider().
 * 
 * @returns Instance du provider AI
 */
export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    providerInstance = createAIProvider();
    
    // Vérifier la santé du provider au démarrage / Check health at startup
    providerInstance.healthCheck().then(isHealthy => {
      console.log(`[AI Factory] Provider "${providerInstance?.name}" health check: ${isHealthy ? '✅ OK' : '❌ Failed'}`);
    }).catch(() => {
      console.warn('[AI Factory] Health check failed, provider may not work correctly');
    });
  }
  
  return providerInstance;
}

/**
 * Réinitialiser l'instance du provider (utile pour les tests ou changements de config)
 * Reset the provider instance (useful for testing or config changes)
 */
export function resetProvider(): void {
  if (providerInstance) {
    console.log(`[AI Factory] Resetting provider: ${providerInstance.name}`);
  }
  providerInstance = null;
}

/**
 * Forcer un type de provider spécifique
 * Force a specific provider type
 * 
 * @param type Type de provider à utiliser
 * @returns Nouvelle instance du provider
 */
export function setProviderType(type: AIProviderType): AIProvider {
  resetProvider();
  providerInstance = createAIProvider(type);
  return providerInstance;
}

/**
 * Obtenir des informations sur le provider actuel
 * Get information about current provider
 */
export function getProviderInfo(): {
  name: AIProviderType;
  isConfigured: boolean;
  hasApiKey: boolean;
} {
  const provider = providerInstance || getAIProvider();
  const config = PROVIDER_CONFIGS[provider.name];
  
  return {
    name: provider.name,
    isConfigured: provider.name !== 'local',
    hasApiKey: config.envKey ? !!process.env[config.envKey] : true,
  };
}

/**
 * Vérifier si un provider cloud est disponible
 * Check if a cloud provider is available
 */
export async function isCloudProviderAvailable(): Promise<boolean> {
  const providerType = (process.env.AI_PROVIDER as AIProviderType) || DEFAULT_PROVIDER;
  
  if (providerType === 'local') {
    return false;
  }

  const hasApiKey = providerType === 'openai' 
    ? !!process.env.OPENAI_API_KEY 
    : !!process.env.ANTHROPIC_API_KEY;

  if (!hasApiKey) {
    return false;
  }

  try {
    const provider = createAIProvider(providerType);
    return await provider.healthCheck();
  } catch {
    return false;
  }
}

export default {
  createAIProvider,
  getAIProvider,
  resetProvider,
  setProviderType,
  getProviderInfo,
  isCloudProviderAvailable,
};
