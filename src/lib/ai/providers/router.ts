// Smart AI Router - Intelligent Provider Selection & Load Balancing
// Routeur IA Intelligent - Sélection et équilibrage de charge des providers

import { getAIProvider, resetProvider, setProviderType, getProviderInfo } from './factory';
import { ChatParams, AIResponse, AIProviderType } from './index';

/**
 * Query complexity analysis for optimal provider selection
 */
export interface QueryAnalysis {
  complexity: 'simple' | 'medium' | 'complex';
  language: string;
  requiresReasoning: boolean;
  requiresCreativity: boolean;
  isCodeRelated: boolean;
  estimatedTokens: number;
}

/**
 * Provider capabilities matrix
 */
const PROVIDER_CAPABILITIES: Record<AIProviderType, {
  strengths: string[];
  maxTokens: number;
  costPer1kTokens: number;
  latency: number; // Average latency in ms
  reasoning: boolean;
}> = {
  openai: {
    strengths: ['code', 'analysis', 'structured-data', 'function-calling'],
    maxTokens: 16384,
    costPer1kTokens: 0.00015,
    latency: 800,
    reasoning: true,
  },
  anthropic: {
    strengths: ['reasoning', 'long-context', 'nuanced', 'safety'],
    maxTokens: 4096,
    costPer1kTokens: 0.003,
    latency: 1200,
    reasoning: true,
  },
  local: {
    strengths: ['fast', 'offline', 'simple', 'privacy'],
    maxTokens: 500,
    costPer1kTokens: 0,
    latency: 100,
    reasoning: false,
  },
};

/**
 * Cost tracking for budget management
 */
interface UsageRecord {
  timestamp: Date;
  provider: AIProviderType;
  tokens: number;
  cost: number;
  queryType: string;
}

class AIRouter {
  private usageHistory: UsageRecord[] = [];
  private dailyBudget: number = 10; // Default $10/day
  private dailySpent: number = 0;
  private lastResetDate: string = new Date().toDateString();

  /**
   * Analyze query to determine optimal provider
   */
  analyzeQuery(message: string): QueryAnalysis {
    const lowerMessage = message.toLowerCase();
    
    // Detect language
    const arabicPattern = /[\u0600-\u06FF]/;
    const frenchPatterns = /\b(le|la|les|un|une|des|est|sont|pour|dans|avec|sur)\b/i;
    
    const language = arabicPattern.test(lowerMessage) 
      ? 'ar' 
      : frenchPatterns.test(lowerMessage) 
        ? 'fr' 
        : 'en';

    // Complexity indicators
    const complexIndicators = [
      'explain', 'analyze', 'compare', 'evaluate', 'recommend',
      'strategy', 'plan', 'implement', 'optimize', 'architecture',
      'expliquer', 'analyser', 'comparer', 'évaluer', 'recommander',
      'stratégie', 'plan', 'implémenter', 'optimiser',
      'اشرح', 'حلل', 'قارن', 'قيّم', 'وصي'
    ];
    
    const codeIndicators = [
      'code', 'api', 'function', 'bug', 'error', 'debug',
      'javascript', 'typescript', 'python', 'sql', 'json',
      'كود', 'برمجة', 'خطأ'
    ];

    const isComplex = complexIndicators.some(indicator => lowerMessage.includes(indicator));
    const isCodeRelated = codeIndicators.some(indicator => lowerMessage.includes(indicator));
    
    // Estimate token count (rough: ~4 chars per token)
    const estimatedTokens = Math.ceil(message.length / 4);

    return {
      complexity: isComplex ? 'complex' : message.length > 100 ? 'medium' : 'simple',
      language,
      requiresReasoning: isComplex,
      requiresCreativity: lowerMessage.includes('create') || lowerMessage.includes('write') || lowerMessage.includes('generate'),
      isCodeRelated,
      estimatedTokens,
    };
  }

  /**
   * Select best provider based on query analysis and constraints
   */
  async selectProvider(analysis: QueryAnalysis): Promise<AIProviderType> {
    // Check if we need to reset daily spending
    this.resetDailyIfNeeded();

    // For simple queries, use local provider to save costs
    if (analysis.complexity === 'simple') {
      return 'local';
    }

    // If we've exceeded budget, fall back to local
    if (this.dailySpent >= this.dailyBudget) {
      console.warn('[AI Router] Daily budget exceeded, using local provider');
      return 'local';
    }

    // Code-related queries work better with GPT
    if (analysis.isCodeRelated && process.env.OPENAI_API_KEY) {
      return 'openai';
    }

    // Complex reasoning works better with Claude
    if (analysis.complexity === 'complex' && process.env.ANTHROPIC_API_KEY) {
      return 'anthropic';
    }

    // Arabic queries might benefit from GPT-4's multilingual capabilities
    if (analysis.language === 'ar' && process.env.OPENAI_API_KEY) {
      return 'openai';
    }

    // Default: use configured provider or OpenAI if available
    const configuredProvider = process.env.AI_PROVIDER as AIProviderType;
    if (configuredProvider && configuredProvider !== 'local') {
      return configuredProvider;
    }

    // Fallback hierarchy: OpenAI > Anthropic > Local
    if (process.env.OPENAI_API_KEY) {
      return 'openai';
    }
    if (process.env.ANTHROPIC_API_KEY) {
      return 'anthropic';
    }
    
    return 'local';
  }

  /**
   * Route chat request to optimal provider
   */
  async routeChat(params: ChatParams): Promise<AIResponse> {
    const userMessage = params.messages[params.messages.length - 1]?.content || '';
    const analysis = this.analyzeQuery(userMessage);
    
    console.log(`[AI Router] Query analysis:`, {
      complexity: analysis.complexity,
      language: analysis.language,
      codeRelated: analysis.isCodeRelated,
      tokens: analysis.estimatedTokens,
    });

    const selectedProvider = await this.selectProvider(analysis);
    
    // Switch to selected provider if different from current
    const currentInfo = getProviderInfo();
    if (currentInfo.name !== selectedProvider) {
      console.log(`[AI Router] Switching from ${currentInfo.name} to ${selectedProvider}`);
      setProviderType(selectedProvider);
    }

    const provider = getAIProvider();
    const startTime = Date.now();

    try {
      const response = await provider.chat(params);
      const latency = Date.now() - startTime;

      // Track usage
      this.trackUsage({
        timestamp: new Date(),
        provider: selectedProvider,
        tokens: response.usage.totalTokens,
        cost: this.calculateCost(selectedProvider, response.usage.totalTokens),
        queryType: `${analysis.complexity}-${analysis.language}`,
      });

      console.log(`[AI Router] Response from ${selectedProvider}:`, {
        latency: `${latency}ms`,
        tokens: response.usage.totalTokens,
        cost: `$${this.calculateCost(selectedProvider, response.usage.totalTokens).toFixed(4)}`,
      });

      // Add routing metadata to response
      return {
        ...response,
        metadata: {
          ...response.metadata,
          routedTo: selectedProvider,
          routingReason: analysis.complexity,
          latency,
          originalProvider: currentInfo.name,
        },
      };
    } catch (error) {
      console.error(`[AI Router] Error with ${selectedProvider}:`, error);

      // Fallback to local provider on error
      if (selectedProvider !== 'local') {
        console.log('[AI Router] Falling back to local provider');
        setProviderType('local');
        const fallbackProvider = getAIProvider();
        return fallbackProvider.chat(params);
      }

      throw error;
    }
  }

  /**
   * Calculate cost for a given provider and token count
   */
  private calculateCost(provider: AIProviderType, tokens: number): number {
    const caps = PROVIDER_CAPABILITIES[provider];
    return (tokens / 1000) * caps.costPer1kTokens;
  }

  /**
   * Track API usage for budget management
   */
  private trackUsage(record: UsageRecord): void {
    this.usageHistory.push(record);
    this.dailySpent += record.cost;

    // Keep only last 1000 records
    if (this.usageHistory.length > 1000) {
      this.usageHistory = this.usageHistory.slice(-1000);
    }
  }

  /**
   * Reset daily spending counter if needed
   */
  private resetDailyIfNeeded(): void {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailySpent = 0;
      this.lastResetDate = today;
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    dailySpent: number;
    dailyBudget: number;
    providerBreakdown: Record<string, { requests: number; tokens: number; cost: number }>;
    averageLatency: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsage = this.usageHistory.filter(u => u.timestamp >= today);

    const providerBreakdown: Record<string, { requests: number; tokens: number; cost: number }> = {};

    for (const record of todayUsage) {
      if (!providerBreakdown[record.provider]) {
        providerBreakdown[record.provider] = { requests: 0, tokens: 0, cost: 0 };
      }
      providerBreakdown[record.provider].requests++;
      providerBreakdown[record.provider].tokens += record.tokens;
      providerBreakdown[record.provider].cost += record.cost;
    }

    return {
      totalRequests: todayUsage.length,
      totalTokens: todayUsage.reduce((sum, u) => sum + u.tokens, 0),
      totalCost: todayUsage.reduce((sum, u) => sum + u.cost, 0),
      dailySpent: this.dailySpent,
      dailyBudget: this.dailyBudget,
      providerBreakdown,
      averageLatency: PROVIDER_CAPABILITIES[getProviderInfo().name]?.latency || 0,
    };
  }

  /**
   * Set daily budget limit
   */
  setDailyBudget(budget: number): void {
    this.dailyBudget = budget;
  }

  /**
   * Get provider recommendations based on query type
   */
  getRecommendation(queryType: string): {
    recommended: AIProviderType;
    alternative: AIProviderType;
    reason: string;
  } {
    switch (queryType) {
      case 'code':
        return {
          recommended: 'openai',
          alternative: 'anthropic',
          reason: 'GPT excels at code generation and debugging',
        };
      case 'reasoning':
        return {
          recommended: 'anthropic',
          alternative: 'openai',
          reason: 'Claude provides nuanced reasoning and analysis',
        };
      case 'creative':
        return {
          recommended: 'anthropic',
          alternative: 'openai',
          reason: 'Claude produces more creative and varied content',
        };
      case 'fast':
        return {
          recommended: 'local',
          alternative: 'openai',
          reason: 'Local provider offers fastest response times',
        };
      default:
        return {
          recommended: 'openai',
          alternative: 'anthropic',
          reason: 'GPT provides good balance of quality and speed',
        };
    }
  }
}

// Export singleton instance
export const aiRouter = new AIRouter();

// Export class for custom instances
export { AIRouter };
export default AIRouter;
