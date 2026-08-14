// Fournisseur Anthropic (Claude) pour AlgeriaTrade.dz
// Anthropic/Claude Provider Implementation

import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, ChatParams, AIResponse, AIStreamChunk, AIProviderType } from './index';

/**
 * Configuration des modèles Claude disponibles
 * Available Claude model configurations
 */
export const CLAUDE_MODELS = {
  'claude-sonnet-4-20250514': { name: 'Claude 4 Sonnet', maxTokens: 4096, costPer1kTokens: 0.003 },
  'claude-3-5-sonnet-20241022': { name: 'Claude 3.5 Sonnet', maxTokens: 4096, costPer1kTokens: 0.003 },
  'claude-3-haiku-20240307': { name: 'Claude 3 Haiku', maxTokens: 4096, costPer1kTokens: 0.00025 },
} as const;

export type ClaudeModel = keyof typeof CLAUDE_MODELS;

/**
 * Provider Anthropic - Intégration avec l'API Claude
 * Anthropic Provider - Claude API Integration
 */
export class AnthropicProvider implements AIProvider {
  readonly name: AIProviderType = 'anthropic';
  
  private client: Anthropic;
  private model: string;
  private modelName: string;

  /**
   * Créer une instance du provider Anthropic
   * @param apiKey Clé API Anthropic
   * @param model Modèle à utiliser (défaut: claude-3-5-sonnet)
   */
  constructor(apiKey: string, model?: string) {
    this.model = model || 'claude-3-5-sonnet-20241022';
    this.modelName = CLAUDE_MODELS[this.model as ClaudeModel]?.name || this.model;
    
    this.client = new Anthropic({
      apiKey,
      // Timeout augmenté / Increased timeout
      timeout: 30000,
    });
  }

  /**
   * Complétion de chat standard
   * Standard chat completion
   */
  async chat(params: ChatParams): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(params.context);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: params.maxTokens ?? CLAUDE_MODELS[this.model as ClaudeModel]?.maxTokens ?? 1024,
        system: systemPrompt,
        messages: this.formatMessages(params.messages),
      });

      // Extraire le texte de la réponse / Extract response text
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as Anthropic.TextBlock).text)
        .join('\n');

      return {
        content,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: this.model,
        provider: 'anthropic',
        suggestions: this.extractSuggestions(content),
      };
    } catch (error) {
      console.error('Erreur Anthropic chat:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Complétion de chat en streaming
   * Streaming chat completion
   */
  async *chatStream(params: ChatParams): AsyncGenerator<AIStreamChunk> {
    try {
      const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: params.maxTokens ?? CLAUDE_MODELS[this.model as ClaudeModel]?.maxTokens ?? 1024,
        system: this.buildSystemPrompt(params.context),
        messages: this.formatMessages(params.messages),
      });

      let fullContent = '';

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta;
          
          if (delta.type === 'text_delta' && delta.text) {
            fullContent += delta.text;
            yield {
              type: 'content',
              content: delta.text,
            };
          }
        }
      }

      // Envoyer les suggestions à la fin / Send suggestions at the end
      const suggestions = this.extractSuggestions(fullContent);
      for (const suggestion of suggestions) {
        yield {
          type: 'suggestion',
          suggestion,
        };
      }

      yield { type: 'done' };
    } catch (error) {
      console.error('Erreur Anthropic stream:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Streaming error',
      };
    }
  }

  /**
   * Générer des embeddings - Non supporté nativement par Claude
   * Generate embeddings - Not natively supported by Claude
   */
  async embed(_text: string): Promise<number[]> {
    // Claude ne supporte pas les embeddings nativement
    // Utiliser un autre provider ou une solution externe
    // Claude doesn't support native embeddings
    // Use another provider or external solution
    console.warn('Les embeddings ne sont pas supportés par le provider Anthropic');
    return [];
  }

  /**
   * Vérifier la santé du provider Anthropic
   * Check Anthropic provider health
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Vérification simple / Simple health check
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Formater les messages pour l'API Anthropic
   * Format messages for Anthropic API
   */
  private formatMessages(messages: ChatParams['messages']): Anthropic.MessageParam[] {
    return messages
      .filter(m => m.role !== 'system') // Le système est géré séparément / System handled separately
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: m.content,
      }));
  }

  /**
   * Construire le prompt système pour AlgeriaTrade
   * Build system prompt for AlgeriaTrade context
   */
  private buildSystemPrompt(context?: string): string {
    return `Tu es **Claude**, un assistant IA expert pour **AlgeriaTrade.dz**, une marketplace B2B leader en Afrique du Nord.

## Détails de la Plateforme :
- Connecte les acheteurs aux fournisseurs vérifiés
- Supporte le Français, l'Arabe, et l'Anglais
- Couvre : Algérie, Tunisie, Maroc, Égypte, Sénégal, Côte d'Ivoire, Arabie Saoudite, EAU
- Paiements : CIB, CCP, BaridiMob, Orange Money, Wave, STC Pay, virement bancaire

## Ton Expertise :
- Pratiques commerciales africaines et MENA
- Réglementations import/export
- Approvisionnement de produits
- Processus de vérification fournisseurs
- Conseils en paiement et logistique

## Directives :
- Sois toujours utile, précis et culturellement conscient
- Adapte ton style au contexte professionnel B2B
- Propose des actions concrètes quand possible
- En cas de doute, suggère de contacter le support
- Réponds dans la langue de l'utilisateur

${context ? `\n## Contexte Actuel :\n${context}` : ''}

---
Réponds de manière professionnelle et utile.`;
  }

  /**
   * Extraire des suggestions du contenu de la réponse
   * Extract suggestions from response content
   */
  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = [];
    
    const lowerContent = content.toLowerCase();
    
    // Suggestions basées sur le contexte / Context-based suggestions
    if (lowerContent.includes('produit') || lowerContent.includes('recherch') || lowerContent.includes('trouver')) {
      suggestions.push('Rechercher un produit');
    }
    if (lowerContent.includes('appel d\'offre') || lowerContent.includes('ao') || lowerContent.includes('devis')) {
      suggestions.push('Créer un appel d\'offres');
    }
    if (lowerContent.includes('paiement') || lowerContent.includes('payer') || lowerContent.includes('baridimob')) {
      suggestions.push('Modes de paiement');
    }
    if (lowerContent.includes('livraison') || lowerContent.includes('expédition') || lowerContent.includes('délai')) {
      suggestions.push('Informations livraison');
    }
    if (lowerContent.includes('vérification') || lowerContent.includes('certifié')) {
      suggestions.push('Devenir vérifié');
    }
    
    // Toujours inclure une option par défaut / Always include default option
    if (suggestions.length === 0) {
      suggestions.push('Autre question', 'Contacter le support');
    }
    
    return suggestions.slice(0, 3); // Maximum 3 suggestions
  }

  /**
   * Gérer et formater les erreurs Anthropic
   * Handle and format Anthropic errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Anthropic.APIError) {
      switch (error.status) {
        case 401:
          return new Error('Clé API Anthropic invalide');
        case 429:
          return new Error('Limite de taux dépassée - Veuillez réessayer plus tard');
        case 500:
          return new Error('Erreur serveur Anthropic - Veuillez réessayer');
        default:
          return new Error(`Erreur Anthropic: ${error.message}`);
      }
    }
    return error instanceof Error ? error : new Error('Unknown Anthropic error');
  }
}

export default AnthropicProvider;
