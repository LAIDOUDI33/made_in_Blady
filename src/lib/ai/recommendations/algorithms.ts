// Recommendation Algorithms Implementation
import { db } from '@/lib/db';
import { 
  RecommendationResult, 
  RecommendationSource,
  UserPreferenceProfile,
  TrendingItem,
  ProductRecommendationData,
  SupplierRecommendationData,
  CategoryRecommendationData
} from './types';

/**
 * Collaborative Filtering Algorithm
 * "Users like you also liked..." - Based on similar users' interactions
 */
export async function collaborativeFiltering(
  userId: string, 
  limit: number = 10
): Promise<RecommendationResult[]> {
  try {
    // Get user's interaction history
    const userInteractions = await db.userInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (userInteractions.length < 3) {
      return []; // Not enough data for collaborative filtering
    }

    // Extract product IDs user interacted with
    const interactedProductIds = [
      ...new Set(userInteractions.filter(i => i.productId).map(i => i.productId!))
    ];

    // Find users who interacted with same products (similar users)
    const similarUserIds = await findSimilarUsers(userId, interactedProductIds, 5);

    if (similarUserIds.length === 0) {
      return [];
    }

    // Get products that similar users interacted with but current user hasn't
    const recommendations = await getProductsFromSimilarUsers(
      userId, 
      similarUserIds, 
      interactedProductIds,
      limit
    );

    return recommendations.map(r => ({
      id: `cf-${r.productId}`,
      itemId: r.productId,
      type: 'product' as const,
      score: r.score,
      reason: `Les acheteurs similaires ont consulté "${r.productName}"`,
      source: 'collaborative_filtering' as RecommendationSource,
      item: r as unknown as ProductRecommendationData,
    }));
  } catch (error) {
    console.error('Collaborative filtering error:', error);
    return [];
  }
}

async function findSimilarUsers(
  currentUserId: string, 
  productIds: string[], 
  limit: number
): Promise<string[]> {
  // Find users who interacted with at least 2 of the same products
  const similarUsers = await db.userInteraction.groupBy({
    by: ['userId'],
    where: {
      userId: { not: currentUserId },
      productId: { in: productIds },
    },
    having: {
      userId: { _count: { gte: 2 } },
    },
    take: limit * 3, // Get more to filter later
    orderBy: {
      _count: { userId: 'desc' },
    },
  });

  return similarUsers.map(u => u.userId).slice(0, limit);
}

async function getProductsFromSimilarUsers(
  currentUserId: string,
  similarUserIds: string[],
  excludeProductIds: string[],
  limit: number
): Promise<{ productId: string; productName: string; score: number }[]> {
  // Get interactions from similar users
  const similarInteractions = await db.userInteraction.findMany({
    where: {
      userId: { in: similarUserIds },
      productId: { notIn: excludeProductIds },
      productId: { not: null },
    },
    include: {
      user: true,
    },
  });

  // Score products based on frequency and recency
  const productScores = new Map<string, { count: number; name: string; totalScore: number }>();

  for (const interaction of similarInteractions) {
    if (!interaction.productId) continue;
    
    const existing = productScores.get(interaction.productId);
    
    // Weight recent interactions higher
    const daysAgo = Math.max(1, (Date.now() - interaction.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const recencyWeight = 1 / daysAgo;

    // Different weights for different interaction types
    const typeWeights: Record<string, number> = {
      view: 1,
      favorite: 3,
      contact: 4,
      rfq: 5,
      order: 6,
      search: 0.5,
      click: 1.5,
      add_to_cart: 4,
    };
    
    const weight = typeWeights[interaction.type] || 1;

    if (existing) {
      existing.count += 1;
      existing.totalScore += weight * recencyWeight;
    } else {
      productScores.set(interaction.productId, {
        count: 1,
        name: `Produit ${interaction.productId}`,
        totalScore: weight * recencyWeight,
      });
    }
  }

  // Sort by score and return top results
  const sorted = Array.from(productScores.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      score: Math.min(1, data.totalScore / 10), // Normalize to 0-1
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Enrich with actual product data
  const enrichedResults = await Promise.all(
    sorted.map(async (item) => {
      try {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          include: {
            company: { select: { name: true, slug: true } },
            category: { select: { name: true, slug: true } },
            images: { where: { isPrimary: true }, take: 1 },
          },
        });
        
        if (product) {
          return {
            ...item,
            productName: product.name,
          };
        }
        return item;
      } catch {
        return item;
      }
    })
  );

  return enrichedResults;
}

/**
 * Content-Based Filtering Algorithm
 * "Similar to products you've viewed" - Based on category, tags, attributes matching
 */
export async function contentBasedFiltering(
  userId: string,
  limit: number = 10,
  contextItemId?: string
): Promise<RecommendationResult[]> {
  try {
    // Get user's viewed products
    const viewedProducts = await db.userInteraction.findMany({
      where: {
        userId,
        type: 'view',
        productId: { not: null },
      },
      distinct: ['productId'],
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    if (viewedProducts.length === 0 && !contextItemId) {
      return [];
    }

    // Get categories user is interested in
    const categoryWeights = await getUserCategoryPreferences(userId);

    // If we have a context item, prioritize similar items to it
    let targetCategories: string[] = [];
    let targetPriceRange: { min: number; max: number } | null = null;

    if (contextItemId) {
      const contextProduct = await db.product.findUnique({
        where: { id: contextItemId },
        select: { categoryId: true, price: true, priceRangeMin: true, priceRangeMax: true },
      });
      
      if (contextProduct) {
        targetCategories = [contextProduct.categoryId];
        targetPriceRange = {
          min: (contextProduct.priceRangeMin || contextProduct.price || 0) * 0.5,
          max: (contextProduct.priceRangeMax || contextProduct.price || 0) * 1.5,
        };
      }
    }

    // Use user's preferred categories if no specific context
    if (targetCategories.length === 0) {
      targetCategories = categoryWeights.slice(0, 3).map(c => c.id);
    }

    if (targetCategories.length === 0) {
      return [];
    }

    // Find products in those categories that user hasn't viewed
    const excludedIds = viewedProducts.map(p => p.productId!).filter(Boolean);

    const recommendedProducts = await db.product.findMany({
      where: {
        categoryId: { in: targetCategories },
        id: { notIn: excludedIds.length > 0 ? excludedIds : undefined },
        status: 'published',
        isActive: true,
        ...(targetPriceRange ? {
          OR: [
            { price: { gte: targetPriceRange.min, lte: targetPriceRange.max } },
            { priceRangeMin: { gte: targetPriceRange.min, lte: targetPriceRange.max } },
            { price: null }, // Include products without price
          ],
        } : {}),
      },
      include: {
        company: { select: { name: true, slug: true, isVerified: true } },
        category: { select: { name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      take: limit * 2, // Get extra for scoring
      orderBy: { viewCount: 'desc' },
    });

    // Score and rank products
    const scoredProducts = recommendedProducts.map(product => {
      const categoryIndex = targetCategories.indexOf(product.categoryId);
      const categoryScore = categoryIndex >= 1 ? (1 - categoryIndex * 0.2) : 1;
      
      // View popularity score (normalized)
      const maxViews = Math.max(...recommendedProducts.map(p => p.viewCount), 1);
      const popularityScore = product.viewCount / maxViews;

      // Price similarity (if we have target range)
      let priceScore = 0.5;
      if (targetPriceRange && (product.price || product.priceRangeMin)) {
        const productPrice = product.price || product.priceRangeMin || 0;
        const midTarget = (targetPriceRange.min + targetPriceRange.max) / 2;
        const priceDiff = Math.abs(productPrice - midTarget) / midTarget;
        priceScore = Math.max(0, 1 - priceDiff);
      }

      // Final weighted score
      const score = (categoryScore * 0.4 + popularityScore * 0.35 + priceScore * 0.25);

      return {
        id: `cb-${product.id}`,
        itemId: product.id,
        type: 'product' as const,
        score: Math.min(1, score),
        reason: contextItemId 
          ? `Similaire à votre recherche`
          : `Parce que vous consultez la catégorie "${product.category.name}"`,
        source: 'content_based' as RecommendationSource,
        item: {
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
          rating: undefined, // Would need separate query
          viewCount: product.viewCount,
          moq: product.moq ?? undefined,
        } satisfies ProductRecommendationData,
      };
    });

    // Sort by score and return top results
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Content-based filtering error:', error);
    return [];
  }
}

async function getUserCategoryPreferences(
  userId: string
): Promise<{ id: string; name: string; weight: number }[]> {
  const interactions = await db.userInteraction.findMany({
    where: {
      userId,
      OR: [
        { categoryId: { not: null } },
        { productId: { not: null } },
      ],
    },
  });

  const categoryScores = new Map<string, number>();

  for (const interaction of interactions) {
    if (interaction.categoryId) {
      const current = categoryScores.get(interaction.categoryId) || 0;
      categoryScores.set(interaction.categoryId, current + 1);
    } else if (interaction.productId) {
      // Look up product's category
      const product = await db.product.findUnique({
        where: { id: interaction.productId },
        select: { categoryId: true },
      });
      if (product) {
        const current = categoryScores.get(product.categoryId) || 0;
        categoryScores.set(product.categoryId, current + 1);
      }
    }
  }

  // Convert to array and sort by weight
  const result = await Promise.all(
    Array.from(categoryScores.entries()).map(async ([id, count]) => {
      const category = await db.category.findUnique({ where: { id } });
      return {
        id,
        name: category?.name || 'Catégorie',
        weight: count,
      };
    })
  );

  return result.sort((a, b) => b.weight - a.weight);
}

/**
 * Trending/Popular Items Algorithm
 * "Trending in your region" - Based on recent views/purchases across platform
 */
export async function getTrendingItems(
  type: 'products' | 'suppliers' | 'categories',
  limit: number = 10,
  periodHours: number = 24
): Promise<RecommendationResult[]> {
  try {
    const since = new Date(Date.now() - periodHours * 60 * 60 * 1000);

    switch (type) {
      case 'products':
        return await getTrendingProducts(limit, since);
      case 'suppliers':
        return await getTrendingSuppliers(limit, since);
      case 'categories':
        return await getTrendingCategories(limit, since);
      default:
        return [];
    }
  } catch (error) {
    console.error('Trending items error:', error);
    return [];
  }
}

async function getTrendingProducts(
  limit: number,
  since: Date
): Promise<RecommendationResult[]> {
  // Get recently viewed products ordered by view count
  const trendingInteractions = await db.userInteraction.groupBy({
    by: ['productId'],
    where: {
      productId: { not: null },
      type: 'view',
      createdAt: { gte: since },
    },
    _count: { productId: true },
    take: limit * 3,
    orderBy: { _count: { productId: 'desc' } },
  });

  // Also get previous period data for calculating trend
  const previousSince = new Date(since.getTime() - 24 * 60 * 60 * 1000);
  
  const previousInteractions = await db.userInteraction.groupBy({
    by: ['productId'],
    where: {
      productId: { not: null },
      type: 'view',
      createdAt: { gte: previousSince, lt: since },
    },
    _count: { productId: true },
  });

  const prevMap = new Map(previousInteractions.map(p => [p.productId, p._count.productId]));

  // Enrich with product data and calculate trends
  const results = await Promise.all(
    trendingInteractions.slice(0, limit).map(async (ti) => {
      const product = await db.product.findUnique({
        where: { id: ti.productId! },
        include: {
          company: { select: { name: true, slug: true, isVerified: true } },
          category: { select: { name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
        },
      });

      if (!product) return null;

      const prevCount = prevMap.get(ti.productId!) || 0;
      const changePercent = prevCount > 0 
        ? ((ti._count.productId - prevCount) / prevCount) * 100 
        : 100;

      return {
        id: `trend-${product.id}`,
        itemId: product.id,
        type: 'product' as const,
        score: Math.min(1, ti._count.productId / 50),
        reason: changePercent > 20 
          ? `Tendance en hausse (+${Math.round(changePercent)}%)` 
          : 'Populaire sur AlgeriaTrade',
        source: 'trending' as RecommendationSource,
        item: {
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
          moq: product.moq ?? undefined,
        } satisfies ProductRecommendationData,
        trendChangePercent: changePercent,
      };
    })
  );

  return results.filter((r): r is RecommendationResult => r !== null);
}

async function getTrendingSuppliers(
  limit: number,
  since: Date
): Promise<RecommendationResult[]> {
  // Get suppliers with most profile views or contacts
  const trendingSuppliers = await db.userInteraction.groupBy({
    by: ['companyId'],
    where: {
      companyId: { not: null },
      type: { in: ['contact', 'view'] },
      createdAt: { gte: since },
    },
    _count: { companyId: true },
    take: limit,
    orderBy: { _count: { companyId: 'desc' } },
  });

  const results = await Promise.all(
    trendingSuppliers.map(async (ts) => {
      const company = await db.company.findUnique({
        where: { id: ts.companyId! },
        include: {
          _count: { select: { products: true } },
        },
      });

      if (!company) return null;

      return {
        id: `trend-supplier-${company.id}`,
        itemId: company.id,
        type: 'supplier' as const,
        score: Math.min(1, ts._count.companyId / 20),
        reason: 'Fournisseur populaire cette semaine',
        source: 'trending' as RecommendationSource,
        item: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          logo: company.logo,
          description: company.description,
          wilaya: company.wilaya,
          isVerified: company.isVerified,
          rating: company.rating,
          reviewCount: company.reviewCount,
          responseRate: company.responseRate,
          productCount: company._count.products,
          categories: [], // Would need additional query
          matchPercentage: Math.round(Math.random() * 15 + 85), // Mock match % for now
        } satisfies SupplierRecommendationData,
      };
    })
  );

  return results.filter((r): r is RecommendationResult => r !== null);
}

async function getTrendingCategories(
  limit: number,
  since: Date
): Promise<RecommendationResult[]> {
  const trendingCategories = await db.userInteraction.groupBy({
    by: ['categoryId'],
    where: {
      categoryId: { not: null },
      createdAt: { gte: since },
    },
    _count: { categoryId: true },
    take: limit,
    orderBy: { _count: { categoryId: 'desc' } },
  });

  const results = await Promise.all(
    trendingCategories.map(async (tc) => {
      const category = await db.category.findUnique({
        where: { id: tc.categoryId! },
        include: {
          _count: { select: { products: true } },
        },
      });

      if (!category) return null;

      return {
        id: `trend-cat-${category.id}`,
        itemId: category.id,
        type: 'category' as const,
        score: Math.min(1, tc._count.categoryId / 100),
        reason: 'Catégorie populaire',
        source: 'trending' as RecommendationSource,
        item: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          image: category.image,
          icon: category.icon,
          productCount: category._count.products,
        } satisfies CategoryRecommendationData,
      };
    })
  );

  return results.filter((r): r is RecommendationResult => r !== null);
}

/**
 * Popular Items Algorithm (All-time)
 * For cold start and fallback
 */
export async function getPopularItems(
  type: 'products' | 'suppliers' | 'categories',
  limit: number = 10
): Promise<RecommendationResult[]> {
  try {
    switch (type) {
      case 'products':
        const popularProducts = await db.product.findMany({
          where: { status: 'published', isActive: true },
          include: {
            company: { select: { name: true, slug: true, isVerified: true } },
            category: { select: { name: true, slug: true } },
            images: { where: { isPrimary: true }, take: 1 },
          },
          orderBy: { viewCount: 'desc' },
          take: limit,
        });

        return popularProducts.map(product => ({
          id: `popular-${product.id}`,
          itemId: product.id,
          type: 'product' as const,
          score: Math.min(1, product.viewCount / 1000),
          reason: 'Produit populaire sur AlgeriaTrade',
          source: 'popular' as RecommendationSource,
          item: {
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
            moq: product.moq ?? undefined,
          } satisfies ProductRecommendationData,
        }));

      case 'suppliers':
        const popularSuppliers = await db.company.findMany({
          where: { isActive: true, isVerified: true },
          include: {
            _count: { select: { products: true } },
          },
          orderBy: { rating: 'desc' },
          take: limit,
        });

        return popularSuppliers.map(company => ({
          id: `popular-supplier-${company.id}`,
          itemId: company.id,
          type: 'supplier' as const,
          score: company.rating / 5,
          reason: 'Fournisseur de confiance',
          source: 'popular' as RecommendationSource,
          item: {
            id: company.id,
            name: company.name,
            slug: company.slug,
            logo: company.logo,
            description: company.description,
            wilaya: company.wilaya,
            isVerified: company.isVerified,
            rating: company.rating,
            reviewCount: company.reviewCount,
            responseRate: company.responseRate,
            productCount: company._count.products,
            categories: [],
            matchPercentage: Math.round(company.responseRate),
          } satisfies SupplierRecommendationData,
        }));

      case 'categories':
        const popularCategories = await db.category.findMany({
          where: { isActive: true },
          include: {
            _count: { select: { products: true } },
          },
          orderBy: { products: { _count: 'desc' } },
          take: limit,
        });

        return popularCategories.map(category => ({
          id: `popular-cat-${category.id}`,
          itemId: category.id,
          type: 'category' as const,
          score: Math.min(1, category._count.products / 500),
          reason: 'Catégorie populaire',
          source: 'popular' as RecommendationSource,
          item: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            image: category.image,
            icon: category.icon,
            productCount: category._count.products,
          } satisfies CategoryRecommendationData,
        }));

      default:
        return [];
    }
  } catch (error) {
    console.error('Popular items error:', error);
    return [];
  }
}

/**
 * Cold Start Recommendations
 * For new users without history
 */
export async function getColdStartRecommendations(
  type: 'products' | 'suppliers' | 'categories',
  limit: number = 10,
  preferences?: {
    categories?: string[];
    location?: string;
  }
): Promise<RecommendationResult[]> {
  try {
    // Use featured/popular items as defaults
    let whereClause: Record<string, unknown> = {};

    if (preferences?.categories && preferences.categories.length > 0) {
      whereClause = { categoryId: { in: preferences.categories } };
    }

    switch (type) {
      case 'products':
        const products = await db.product.findMany({
          where: {
            status: 'published',
            isActive: true,
            isFeatured: true,
            ...whereClause,
          },
          include: {
            company: { select: { name: true, slug: true, isVerified: true } },
            category: { select: { name: true, slug: true } },
            images: { where: { isPrimary: true }, take: 1 },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        });

        // If not enough featured, fill with popular
        if (products.length < limit) {
          const remaining = limit - products.length;
          const popular = await db.product.findMany({
            where: {
              status: 'published',
              isActive: true,
              id: { notIn: products.map(p => p.id) },
              ...whereClause,
            },
            include: {
              company: { select: { name: true, slug: true, isVerified: true } },
              category: { select: { name: true, slug: true } },
              images: { where: { isPrimary: true }, take: 1 },
            },
            take: remaining,
            orderBy: { viewCount: 'desc' },
          });
          products.push(...popular);
        }

        return products.slice(0, limit).map(product => ({
          id: `cold-${product.id}`,
          itemId: product.id,
          type: 'product' as const,
          score: 0.7, // Default score for cold start
          reason: 'Recommandé pour vous',
          source: 'cold_start' as RecommendationSource,
          item: {
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
            moq: product.moq ?? undefined,
          } satisfies ProductRecommendationData,
        }));

      case 'suppliers':
        const suppliers = await db.company.findMany({
          where: {
            isActive: true,
            isVerified: true,
            ...(preferences?.location ? { wilaya: preferences.location } : {}),
          },
          include: {
            _count: { select: { products: true } },
          },
          take: limit,
          orderBy: { rating: 'desc' },
        });

        return suppliers.map(company => ({
          id: `cold-supplier-${company.id}`,
          itemId: company.id,
          type: 'supplier' as const,
          score: 0.7,
          reason: 'Fournisseur recommandé',
          source: 'cold_start' as RecommendationSource,
          item: {
            id: company.id,
            name: company.name,
            slug: company.slug,
            logo: company.logo,
            description: company.description,
            wilaya: company.wilaya,
            isVerified: company.isVerified,
            rating: company.rating,
            reviewCount: company.reviewCount,
            responseRate: company.responseRate,
            productCount: company._count.products,
            categories: [],
            matchPercentage: Math.round(company.responseRate),
          } satisfies SupplierRecommendationData,
        }));

      case 'categories':
        const categories = await db.category.findMany({
          where: { isActive: true, parentId: null },
          include: {
            _count: { select: { products: true } },
          },
          take: limit,
          orderBy: { sortOrder: 'asc' },
        });

        return categories.map(category => ({
          id: `cold-cat-${category.id}`,
          itemId: category.id,
          type: 'category' as const,
          score: 0.6,
          reason: 'Catégorie populaire',
          source: 'cold_start' as RecommendationSource,
          item: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            image: category.image,
            icon: category.icon,
            productCount: category._count.products,
          } satisfies CategoryRecommendationData,
        }));

      default:
        return [];
    }
  } catch (error) {
    console.error('Cold start recommendations error:', error);
    return [];
  }
}

/**
 * Contextual Recommendations
 * "People who searched X also looked at Y"
 */
export async function getContextualRecommendations(
  searchTerm: string,
  limit: number = 10
): Promise<RecommendationResult[]> {
  try {
    // Find similar search terms
    const similarSearches = await db.userInteraction.findMany({
      where: {
        type: 'search',
        searchTerm: { contains: searchTerm.split(' ')[0] }, // Match first word
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
      distinct: ['searchTerm'],
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // Get products that were viewed after these searches
    const productIds = new Set<string>();
    
    for (const search of similarSearches) {
      // Find views that happened after this search by same session/user
      const subsequentViews = await db.userInteraction.findMany({
        where: {
          sessionId: search.sessionId,
          type: 'view',
          productId: { not: null },
          createdAt: { gt: search.createdAt },
        },
        distinct: ['productId'],
        take: 3,
      });

      subsequentViews.forEach(v => v.productId && productIds.add(v.productId));
    }

    if (productIds.size === 0) {
      return [];
    }

    // Get product details
    const products = await db.product.findMany({
      where: {
        id: { in: Array.from(productIds) },
        status: 'published',
        isActive: true,
      },
      include: {
        company: { select: { name: true, slug: true, isVerified: true } },
        category: { select: { name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      take: limit,
    });

    return products.map(product => ({
      id: `ctx-${product.id}`,
      itemId: product.id,
      type: 'product' as const,
      score: 0.75,
      reason: `Les personnes qui ont recherché "${searchTerm}" ont aussi consulté ceci`,
      source: 'contextual' as RecommendationSource,
      item: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price ?? undefined,
        priceRangeMin: product.priceRangeMin ?? undefined,
        priceRangeMax: product.priceMax ?? undefined,
        currency: product.currency,
        image: product.images[0]?.url,
        companyName: product.company.name,
        companySlug: product.company.slug,
        category: product.category.name,
        categorySlug: product.category.slug,
        isVerified: product.company.isVerified,
        viewCount: product.viewCount,
        moq: product.moq ?? undefined,
      } satisfies ProductRecommendationData,
    }));
  } catch (error) {
    console.error('Contextual recommendations error:', error);
    return [];
  }
}

/**
 * Build User Preference Profile
 */
export async function buildUserPreferenceProfile(
  userId: string
): Promise<UserPreferenceProfile> {
  const interactions = await db.userInteraction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  // Calculate category preferences
  const categoryMap = new Map<string, { id: string; name: string; count: number }>();
  
  for (const interaction of interactions) {
    if (interaction.categoryId) {
      const existing = categoryMap.get(interaction.categoryId);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(interaction.categoryId, {
          id: interaction.categoryId,
          name: `Catégorie ${interaction.categoryId}`,
          count: 1,
        });
      }
    }
  }

  // Fetch category names
  const favoriteCategories = await Promise.all(
    Array.from(categoryMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(async ([id, data]) => {
        const cat = await db.category.findUnique({ where: { id } });
        return {
          id,
          name: cat?.name || data.name,
          weight: data.count / interactions.length,
        };
      })
  );

  // Extract other preferences
  const viewedProducts = [...new Set(interactions.filter(i => i.productId).map(i => i.productId!))];
  const favoriteProducts = interactions.filter(i => i.type === 'favorite').map(i => i.productId!).filter(Boolean);
  const searchHistory = [...new Set(interactions.filter(i => i.searchTerm).map(i => i.searchTerm!))];
  const supplierIds = [...new Set(interactions.filter(i => i.companyId).map(i => i.companyId!))];

  return {
    favoriteCategories,
    preferredPriceRange: { min: 0, max: 1000000 }, // Would need price analysis
    preferredSuppliers: supplierIds,
    searchHistory,
    viewedProducts,
    favoriteProducts,
    recentInteractions: interactions.slice(0, 20),
  };
}
