// AI Recommendation Engine - Main Orchestrator
import { 
  RecommendationInput, 
  RecommendationResult, 
  RecommendationConfig,
  DEFAULT_RECOMMENDATION_CONFIG,
} from './types';
import {
  collaborativeFiltering,
  contentBasedFiltering,
  getTrendingItems,
  getPopularItems,
  getColdStartRecommendations,
  getContextualRecommendations,
  buildUserPreferenceProfile,
} from './algorithms';
import { db } from '@/lib/db';

class RecommendationEngine {
  private config: RecommendationConfig;

  constructor(config?: Partial<RecommendationConfig>) {
    this.config = { ...DEFAULT_RECOMMENDATION_CONFIG, ...config };
  }

  /**
   * Main method to get recommendations for a user
   */
  async getRecommendations(input: RecommendationInput): Promise<RecommendationResult[]> {
    const {
      userId,
      type,
      limit = 10,
      context = 'homepage',
      itemId,
      categoryId,
    } = input;

    // Check if user is in A/B test group (if enabled)
    if (this.config.abTesting.enabled) {
      const hash = this.simpleHash(userId || 'anonymous');
      if (hash % 100 > this.config.abTesting.showToPercentage) {
        return []; // User not in test group
      }
    }

    // Check cache first (for logged-in users)
    if (userId) {
      const cached = await this.getCachedRecommendations(userId, type, context);
      if (cached.length >= limit) {
        return cached.slice(0, limit);
      }
    }

    let results: RecommendationResult[] = [];

    // Determine which algorithm(s) to use based on user history and context
    const hasHistory = await this.userHasSufficientHistory(userId);

    if (!hasHistory) {
      // Cold start - use popular/featured items
      results = await getColdStartRecommendations(type, limit * 1.5, {
        categories: categoryId ? [categoryId] : undefined,
      });
    } else {
      // User has history - use hybrid approach
      results = await this.generateHybridRecommendations(
        userId!,
        type,
        limit * 2, // Get more to allow filtering
        context,
        itemId,
        categoryId
      );
    }

    // Filter by minimum score threshold
    results = results.filter(r => r.score >= this.config.minScoreThreshold);

    // Remove duplicates
    results = this.deduplicateResults(results);

    // Sort by score and limit
    results.sort((a, b) => b.score - a.score);
    results = results.slice(0, limit);

    // Cache results for logged-in users
    if (userId && results.length > 0) {
      await this.cacheRecommendations(userId!, type, results.slice(0, limit), context);
    }

    return results;
  }

  /**
   * Generate recommendations using multiple algorithms and combine scores
   */
  private async generateHybridRecommendations(
    userId: string,
    type: 'products' | 'suppliers' | 'categories',
    limit: number,
    context: string,
    itemId?: string,
    categoryId?: string
  ): Promise<RecommendationResult[]> {
    const allResults: Map<string, RecommendationResult> = new Map();
    const weights = this.config.weights;

    // Run algorithms in parallel
    const [cfResults, cbResults, trendingResults, popularResults] = await Promise.all([
      weights.collaborativeFiltering > 0 
        ? collaborativeFiltering(userId, Math.ceil(limit * 0.4)).catch(() => [])
        : Promise.resolve([]),
      
      weights.contentBased > 0
        ? contentBasedFiltering(userId, Math.ceil(limit * 0.5), itemId).catch(() => [])
        : Promise.resolve([]),
      
      weights.trending > 0
        ? getTrendingItems(type, Math.ceil(limit * 0.3)).catch(() => [])
        : Promise.resolve([]),
      
      weights.popular > 0
        ? getPopularItems(type, Math.ceil(limit * 0.2)).catch(() => [])
        : Promise.resolve([]),
    ]);

    // Apply weights and merge results
    this.mergeWeightedResults(allResults, cfResults, weights.collaborativeFiltering, 'collaborative_filtering');
    this.mergeWeightedResults(allResults, cbResults, weights.contentBased, 'content_based');
    this.mergeWeightedResults(allResults, trendingResults, weights.trending, 'trending');
    this.mergeWeightedResults(allResults, popularResults, weights.popular, 'popular');

    // Add contextual boost for specific contexts
    if (context === 'search' || context === 'product_detail') {
      const ctxResults = await getContextualRecommendations('', Math.ceil(limit * 0.2));
      this.mergeWeightedResults(allResults, ctxResults, 0.15, 'contextual');
    }

    return Array.from(allResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Merge results from one algorithm with weighted scoring
   */
  private mergeWeightedResults(
    allResults: Map<string, RecommendationResult>,
    newResults: RecommendationResult[],
    weight: number,
    source: string
  ): void {
    for (const result of newResults) {
      const existing = allResults.get(result.itemId);
      
      if (existing) {
        // Item already recommended by another algorithm - combine scores
        existing.score = Math.min(1, existing.score + result.score * weight);
        
        // Update source to show it's a hybrid recommendation
        if (!existing.source.includes(source)) {
          existing.source = 'hybrid';
        }
        
        // Keep the better reason
        if (result.reason && result.score > existing.score * 0.8) {
          existing.reason = result.reason;
        }
      } else {
        // New item - apply weight
        allResults.set(result.itemId, {
          ...result,
          score: result.score * weight,
          source: source as RecommendationResult['source'],
        });
      }
    }
  }

  /**
   * Check if user has enough interaction history for personalized recommendations
   */
  private async userHasSufficientHistory(userId?: string): Promise<boolean> {
    if (!userId) return false;

    try {
      const interactionCount = await db.userInteraction.count({
        where: { userId },
      });

      return interactionCount >= 3; // Minimum 3 interactions for personalization
    } catch {
      return false;
    }
  }

  /**
   * Get cached recommendations from database
   */
  private async getCachedRecommendations(
    userId: string,
    type: string,
    context: string
  ): Promise<RecommendationResult[]> {
    try {
      const cached = await db.recommendation.findMany({
        where: {
          userId,
          type: type === 'products' ? 'product' : type === 'suppliers' ? 'supplier' : 'category',
          expiresAt: { gte: new Date() },
          dismissed: false,
        },
        orderBy: { score: 'desc' },
        take: 20,
      });

      if (cached.length === 0) return [];

      // Convert cached records to recommendation results
      const results: RecommendationResult[] = [];
      
      for (const rec of cached) {
        let itemData = null;
        
        try {
          switch (type) {
            case 'products':
              const product = await db.product.findUnique({
                where: { id: rec.itemId },
                include: {
                  company: { select: { name: true, slug: true, isVerified: true } },
                  category: { select: { name: true, slug: true } },
                  images: { where: { isPrimary: true }, take: 1 },
                },
              });
              
              if (product) {
                itemData = {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price ?? undefined,
                  priceRangeMin: product.priceRangeMin ?? undefined,
                  priceRangeMax: product.priceRangeMax ?? undefined,
                  currency: product.currency,
                  image: product.images[0]?.url,
                  companyName: product.company.name,
                  companySlug: product.company.slug,
                  category: product.category.name,
                  categorySlug: product.category.slug,
                  isVerified: product.company.isVerified,
                  viewCount: product.viewCount,
                };
              }
              break;

            case 'suppliers':
              const company = await db.company.findUnique({
                where: { id: rec.itemId },
                include: { _count: { select: { products: true } } },
              });
              
              if (company) {
                itemData = {
                  id: company.id,
                  name: company.name,
                  slug: company.slug,
                  logo: company.logo,
                  wilaya: company.wilaya,
                  isVerified: company.isVerified,
                  rating: company.rating,
                  reviewCount: company.reviewCount,
                  responseRate: company.responseRate,
                  productCount: company._count.products,
                  categories: [],
                };
              }
              break;
          }
        } catch {
          // Item might have been deleted
        }

        if (itemData) {
          results.push({
            id: rec.id,
            itemId: rec.itemId,
            type: rec.type as RecommendationResult['type'],
            score: rec.score,
            reason: rec.reason || '',
            source: rec.source as RecommendationResult['source'],
            item: itemData as any,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error getting cached recommendations:', error);
      return [];
    }
  }

  /**
   * Cache recommendations in database
   */
  private async cacheRecommendations(
    userId: string,
    type: string,
    results: RecommendationResult[],
    context: string
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + this.config.recommendationTTL * 60 * 60 * 1000);

      // Delete old cached recommendations of same type
      await db.recommendation.deleteMany({
        where: {
          userId,
          type: type === 'products' ? 'product' : type === 'suppliers' ? 'supplier' : 'category',
        },
      });

      // Insert new recommendations
      const recData = results.map(result => ({
        userId,
        type: type === 'products' ? 'product' : type === 'suppliers' ? 'supplier' : 'category',
        itemId: result.itemId,
        score: result.score,
        reason: result.reason,
        source: result.source,
        expiresAt,
      }));

      await db.recommendation.createMany({
        data: recData,
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('Error caching recommendations:', error);
    }
  }

  /**
   * Remove duplicate items from results
   */
  private deduplicateResults(results: RecommendationResult[]): RecommendationResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.itemId)) {
        return false;
      }
      seen.add(result.itemId);
      return true;
    });
  }

  /**
   * Simple hash function for A/B testing
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Record feedback on a recommendation
   */
  async recordFeedback(
    recommendationId: string,
    action: 'clicked' | 'dismissed' | 'converted' | 'viewed',
    userId?: string
  ): Promise<void> {
    try {
      const updateData: Record<string, any> = {};
      
      switch (action) {
        case 'clicked':
          updateData.clicked = true;
          break;
        case 'dismissed':
          updateData.dismissed = true;
          break;
        case 'converted':
          updateData.converted = true;
          updateData.clicked = true;
          break;
        case 'viewed':
          // Just record impression - no DB change needed currently
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await db.recommendation.update({
          where: { id: recommendationId },
          data: updateData,
        });
      }
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  }

  /**
   * Get user's preference profile
   */
  async getUserProfile(userId: string) {
    return buildUserPreferenceProfile(userId);
  }

  /**
   * Get trending items (public endpoint)
   */
  async getTrending(type: 'products' | 'suppliers' | 'categories', limit = 10) {
    return getTrendingItems(type, limit);
  }

  /**
   * Clear user's recommendation cache
   */
  async clearCache(userId: string): Promise<void> {
    try {
      await db.recommendation.deleteMany({ where: { userId } });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();

// Also export class for custom instances
export { RecommendationEngine };
export default RecommendationEngine;
