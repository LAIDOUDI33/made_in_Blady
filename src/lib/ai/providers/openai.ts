// Fournisseur OpenAI pour AlgeriaTrade.dz
// OpenAI Provider Implementation

import OpenAI from 'openai';
import { AIProvider, ChatParams, AIResponse, AIStreamChunk, AIProviderType, ChatMessage } from './index';

/**
 * Configuration des modèles OpenAI disponibles
 * Available OpenAI model configurations
 */
export const OPENAI_MODELS = {
  'gpt-4o': { name: 'GPT-4o', maxTokens: 4096, costPer1kTokens: 0.005 },
  'gpt-4o-mini': { name: 'GPT-4o Mini', maxTokens: 16384, costPer1kTokens: 0.00015 },
  'gpt-4-turbo-preview': { name: 'GPT-4 Turbo', maxTokens: 4096, costPer1kTokens: 0.01 },
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', maxTokens: 4096, costPer1kTokens: 0.0005 },
} as const;

export type OpenAIModel = keyof typeof OPENAI_MODELS;

/**
 * Provider OpenAI - Intégration avec l'API GPT
 * OpenAI Provider - GPT API Integration
 */
export class OpenAIProvider implements AIProvider {
  readonly name: AIProviderType = 'openai';
  
  private client: OpenAI;
  private model: string;
  private modelName: string;

  /**
   * Créer une instance du provider OpenAI
   * @param apiKey Clé API OpenAI
   * @param model Modèle à utiliser (défaut: gpt-4o-mini pour coût/performance)
   */
  constructor(apiKey: string, model?: string) {
    this.model = model || 'gpt-4o-mini';
    this.modelName = OPENAI_MODELS[this.model as OpenAIModel]?.name || this.model;
    
    this.client = new OpenAI({
      apiKey,
      // Timeout augmenté pour les réponses longues / Increased timeout for long responses
      timeout: 30000,
    });
  }

  /**
   * Complétion de chat standard
   * Standard chat completion
   */
  async chat(params: ChatParams): Promise<AIResponse> {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: this.buildSystemPrompt(params.context),
    };

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [systemMessage, ...params.messages],
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? OPENAI_MODELS[this.model as OpenAIModel]?.maxTokens ?? 1000,
        // Fonction calling pour données structurées / Function calling for structured data
        tools: this.getTools(),
        tool_choice: 'auto',
      });

      const choice = response.choices[0];
      
      // Extraire le contenu de la réponse / Extract response content
      let content = choice?.message?.content || '';
      
      // Traiter les appels de fonction si présents / Handle function calls if present
      if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
        content += this.processToolCalls(choice.message.tool_calls as any);
      }

      return {
        content: content.trim(),
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
        model: this.model,
        provider: 'openai',
        suggestions: this.extractSuggestions(content),
      };
    } catch (error) {
      console.error('Erreur OpenAI chat:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Complétion de chat en streaming
   * Streaming chat completion
   */
  async *chatStream(params: ChatParams): AsyncGenerator<AIStreamChunk> {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: this.buildSystemPrompt(params.context),
    };

    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [systemMessage, ...params.messages],
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? OPENAI_MODELS[this.model as OpenAIModel]?.maxTokens ?? 1000,
        stream: true,
      });

      let fullContent = '';

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        
        if (delta) {
          fullContent += delta;
          yield {
            type: 'content',
            content: delta,
          };
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
      console.error('Erreur OpenAI stream:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Streaming error',
      };
    }
  }

  /**
   * Générer des embeddings pour la recherche sémantique
   * Generate embeddings for semantic search
   */
  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000), // Limiter la longueur / Limit length
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Erreur OpenAI embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  /**
   * Vérifier la santé du provider OpenAI
   * Check OpenAI provider health
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Construire le prompt système pour AlgeriaTrade
   * Build system prompt for AlgeriaTrade context
   */
  private buildSystemPrompt(context?: string): string {
    return `Tu es un assistant IA utile pour **AlgeriaTrade.dz**, une marketplace B2B de premier plan qui connecte les fournisseurs et acheteurs en Algérie et dans toute l'Afrique/MENA.

## Ton Rôle :
- Aider les utilisateurs à trouver des produits et fournisseurs
- Assister avec la publication d'appels d'offres (AO/RFQ)
- Répondre aux questions sur les paiements, expédition, vérification
- Fournir des conseils business pour le marché africain
- Répondre dans la langue de l'utilisateur (Français, Arabe, ou Anglais)

## Directives :
- Sois professionnel mais amical
- Fournis des informations spécifiques et actionnables
- En mentionnant des produits, suggère de rechercher sur la plateforme
- Pour les questions complexes, propose de mettre en relation avec le support humain
- Garde les réponses concises mais complètes
- Utilise un format Markdown quand approprié

## Plateforme AlgeriaTrade :
- Pays couverts : Algérie, Tunisie, Maroc, Égypte, Sénégal, Côte d'Ivoire, Arabie Saoudite, EAU
- Paiements acceptés : CIB, CCP, BaridiMob, Orange Money, Wave, STC Pay, virement bancaire
- Langues : Français (principale), Arabe, Anglais

${context ? `\n## Contexte Additionnel :\n${context}` : ''}

---
Réponds toujours de manière utile et professionnelle.`;
  }

  /**
   * Définir les outils/fonctions disponibles pour le modèle
   * Define available tools/functions for the model
   */
  private getTools() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'search_products',
          description: 'Rechercher des produits sur la plateforme',
          parameters: {
            type: 'object' as const,
            properties: {
              query: { type: 'string', description: 'Recherche textuelle' },
              category: { type: 'string', description: 'Catégorie de produit' },
              location: { type: 'string', description: 'Localisation/wilaya utilisateur' },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'create_rfq',
          description: "Aider l'utilisateur à créer un appel d'offres",
          parameters: {
            type: 'object' as const,
            properties: {
              product: { type: 'string', description: 'Produit recherché' },
              quantity: { type: 'number', description: 'Quantité souhaitée' },
              budget: { type: 'string', description: 'Budget estimé' },
              deadline: { type: 'string', description: 'Date limite souhaitée' },
            },
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_supplier_info',
          description: 'Obtenir des informations sur les fournisseurs vérifiés',
          parameters: {
            type: 'object' as const,
            properties: {
              industry: { type: 'string', description: 'Secteur d\'activité' },
              location: { type: 'string', description: 'Localisation' },
            },
          },
        },
      },
    ];
  }

  /**
   * Traiter les appels de fonction du modèle
   * Process model function calls
   */
  private processToolCalls(tool_calls: any[]): string {
    let result = '\n\n---\n**Actions suggérées :**\n';
    
    for (const call of tool_calls) {
      switch (call.function.name) {
        case 'search_products':
          result += '🔍 **Recherche de produits** disponible\n';
          break;
        case 'create_rfq':
          result += '📋 **Création d\'appel d\'offres** disponible\n';
          break;
        case 'get_supplier_info':
          result += '🏭 **Informations fournisseurs** disponibles\n';
          break;
      }
    }
    
    return result;
  }

  /**
   * Extraire des suggestions du contenu de la réponse
   * Extract suggestions from response content
   */
  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = [];
    
    // Suggestions basées sur le contexte / Context-based suggestions
    if (content.toLowerCase().includes('produit') || content.toLowerCase().includes('recherch')) {
      suggestions.push('Rechercher un produit');
    }
    if (content.toLowerCase().includes('ao') || content.toLowerCase().includes('appel') || content.toLowerCase().includes('rfq')) {
      suggestions.push('Créer un appel d\'offres');
    }
    if (content.toLowerCase().includes('paiement') || content.toLowerCase().includes('payer')) {
      suggestions.push('Modes de paiement');
    }
    if (content.toLowerCase().includes('support') || content.toLowerCase().includes('aide')) {
      suggestions.push('Contacter le support');
    }
    
    // Toujours inclure une option par défaut / Always include default option
    if (suggestions.length === 0) {
      suggestions.push('Autre question', 'Contacter le support');
    }
    
    return suggestions.slice(0, 3); // Maximum 3 suggestions
  }

  /**
   * Gérer et formater les erreurs OpenAI
   * Handle and format OpenAI errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 401:
          return new Error('Clé API OpenAI invalide');
        case 429:
          return new Error('Limite de taux dépassée - Veuillez réessayer plus tard');
        case 500:
          return new Error('Erreur serveur OpenAI - Veuillez réessayer');
        default:
          return new Error(`Erreur OpenAI: ${error.message}`);
      }
    }
    return error instanceof Error ? error : new Error('Unknown OpenAI error');
  }
}

export default OpenAIProvider;
