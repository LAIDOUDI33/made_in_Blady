// Interface unifiée pour les fournisseurs AI
// Unified AI Provider Interface for AlgeriaTrade.dz

/**
 * Types de fournisseurs AI supportés
 * Supported AI Provider types
 */
export type AIProviderType = 'openai' | 'anthropic' | 'local';

/**
 * Message de conversation
 * Chat message structure
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Paramètres pour la complétion de chat
 * Parameters for chat completion
 */
export interface ChatParams {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  context?: string; // Contexte additionnel sur l'utilisateur/produits
}

/**
 * Statistiques d'utilisation des tokens (pour le suivi des coûts)
 * Token usage statistics (for cost tracking)
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Carte interactive retournée par l'AI
 * Interactive card returned by AI
 */
export interface AICard {
  type: 'product' | 'supplier' | 'rfq' | 'article';
  title: string;
  description: string;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Réponse complète de l'AI
 * Complete AI response
 */
export interface AIResponse {
  content: string;
  usage: TokenUsage;
  model: string;
  provider: string;
  suggestions?: string[];
  cards?: AICard[];
}

/**
 * Chunk de réponse en streaming
 * Streaming response chunk
 */
export interface AIStreamChunk {
  type: 'content' | 'suggestion' | 'card' | 'done' | 'error';
  content?: string;
  suggestion?: string;
  card?: AICard;
  error?: string;
}

/**
 * Interface principale du fournisseur AI
 * Main AI Provider Interface
 */
export interface AIProvider {
  /** Nom du fournisseur / Provider name */
  readonly name: AIProviderType;

  /** 
   * Complétion de chat standard
   * Standard chat completion
   */
  chat(params: ChatParams): Promise<AIResponse>;

  /**
   * Complétion de chat en streaming (réponses en temps réel)
   * Streaming chat completion (real-time responses)
   */
  chatStream(params: ChatParams): AsyncGenerator<AIStreamChunk>;

  /**
   * Générer des embeddings (pour la recherche sémantique)
   * Generate embeddings (for semantic search)
   */
  embed(text: string): Promise<number[]>;

  /**
   * Vérifier l'état de santé du fournisseur
   * Check provider health status
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Configuration du fournisseur AI
 * AI Provider configuration
 */
export interface AIProviderConfig {
  type: AIProviderType;
  apiKey?: string;
  model?: string;
  baseUrl?: string; // Pour les endpoints personnalisés / For custom endpoints
}
