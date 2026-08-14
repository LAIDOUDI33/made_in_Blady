// Provider Local (Fallback) - Basé sur les règles d'intentions
// Local Fallback Provider - Rule-based Intent System

import { AIProvider, ChatParams, AIResponse, AIStreamChunk, AIProviderType } from './index';
import { detectIntent, extractEntities } from '../chatbot/intents';
import { getResponse, BotResponse } from '../chatbot/responses';

/**
 * Provider Local - Utilise le système basé sur les règles existant
 * Local Provider - Uses existing rule-based system
 * 
 * Ce provider fonctionne sans API externe et sert de fallback
 * quand aucun provider cloud n'est configuré.
 * 
 * This provider works without external API and serves as fallback
 * when no cloud provider is configured.
 */
export class LocalProvider implements AIProvider {
  readonly name: AIProviderType = 'local';

  /**
   * Complétion de chat utilisant le système d'intentions
   * Chat completion using intent-based system
   */
  async chat(params: ChatParams): Promise<AIResponse> {
    // Extraire le dernier message de l'utilisateur / Extract last user message
    const lastMessage = params.messages[params.messages.length - 1]?.content || '';
    
    if (!lastMessage.trim()) {
      return this.emptyResponse();
    }

    // Utiliser le système d'intentions existant / Use existing intent system
    const startTime = Date.now();
    
    try {
      const { intent, confidence } = detectIntent(lastMessage);
      const entities = extractEntities(lastMessage);
      const botResponse: BotResponse = getResponse(intent, entities);

      console.log(`[LocalProvider] Intent: ${intent.id}, Confidence: ${confidence.toFixed(2)}, Time: ${Date.now() - startTime}ms`);

      return {
        content: botResponse.message,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        model: 'intent-based-v1',
        provider: 'local',
        suggestions: botResponse.suggestions,
        cards: botResponse.cards?.map(card => ({
          type: 'product' as const,
          title: card.name,
          description: card.supplier,
          imageUrl: card.image,
          actionUrl: card.link,
          actionText: 'Voir le produit',
          metadata: {
            id: card.id,
            price: card.price,
          },
        })),
      };
    } catch (error) {
      console.error('Erreur LocalProvider:', error);
      return this.errorResponse();
    }
  }

  /**
   * Streaming - Simulation pour le provider local
   * Streaming - Simulation for local provider
   */
  async *chatStream(params: ChatParams): AsyncGenerator<AIStreamChunk> {
    // Simuler un streaming en envoyant la réponse complète
    // Simulate streaming by sending complete response
    const response = await this.chat(params);
    
    // Envoyer mot par mot pour simuler le streaming
    // Send word by word to simulate streaming
    const words = response.content.split(' ');
    
    for (const word of words) {
      yield {
        type: 'content',
        content: word + ' ',
      };
      
      // Petit délai pour l'effet de frappe / Small delay for typing effect
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    // Envoyer les suggestions / Send suggestions
    for (const suggestion of response.suggestions || []) {
      yield {
        type: 'suggestion',
        suggestion,
      };
    }
    
    yield { type: 'done' };
  }

  /**
   * Embeddings simplifiés (basés sur les mots-clés)
   * Simplified embeddings (keyword-based)
   */
  async embed(text: string): Promise<number[]> {
    // Implémentation basique : extraire les mots-clés et créer un vecteur simple
    // Basic implementation: extract keywords and create a simple vector
    const keywords = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // Créer un vecteur de hachage simple / Create a simple hash vector
    const vector = new Array(384).fill(0);
    
    for (const keyword of keywords) {
      let hash = 0;
      for (let i = 0; i < keyword.length; i++) {
        hash = ((hash << 5) - hash + keyword.charCodeAt(i)) | 0;
      }
      const index = Math.abs(hash) % 384;
      vector[index] += 1;
    }
    
    // Normaliser le vecteur / Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  /**
   * Vérification de santé - Toujours OK pour le provider local
   * Health check - Always OK for local provider
   */
  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Réponse vide pour message invalide
   * Empty response for invalid message
   */
  private emptyResponse(): AIResponse {
    return {
      content: "Je n'ai pas reçu votre message. Pouvez-vous réessayer ?",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      model: 'intent-based-v1',
      provider: 'local',
      suggestions: ['Réessayer', 'Contacter le support'],
    };
  }

  /**
   * Réponse d'erreur générique
   * Generic error response
   */
  private errorResponse(): AIResponse {
    return {
      content: "Désolé, une erreur s'est produite. Veuillez réessayer ou contacter notre support.",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      model: 'intent-based-v1',
      provider: 'local',
      suggestions: ['Réessayer', 'Contacter le support', 'FAQ'],
    };
  }
}

export default LocalProvider;
