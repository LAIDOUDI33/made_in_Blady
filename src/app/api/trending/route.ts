import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/trending?period=weekly&category=xxx - Get trending products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'weekly'; // daily, weekly, monthly
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const includeMovement = searchParams.get('includeMovement') === 'true';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
        break;
      case 'weekly':
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
    }

    // Build base where clause for products
    const productWhere: Record<string, unknown> = {
      isActive: true,
      status: 'published',
    };

    if (category) {
      productWhere.category = {
        slug: category,
      };
    }

    // Get products with their engagement metrics
    const products = await db.product.findMany({
      where: productWhere,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            isVerified: true,
            logo: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, alt: true },
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
            orderItems: {
              where: {
                order: {
                  createdAt: { gte: startDate },
                  status: { not: 'CANCELLED' },
                },
              },
            },
          },
        },
      },
      orderBy: { viewCount: 'desc' },
      take: limit * 2, // Get more to allow for ranking
    });

    // Calculate trending scores and rank products
    const scoredProducts = await Promise.all(
      products.map(async (product) => {
        // Get views in current period (simplified - using recent activity)
        const currentViews = Math.min(product.viewCount || 0, 10000); // Cap for scoring
        
        // Get orders in period
        const ordersInPeriod = product._count.orderItems;
        
        // Get favorites added recently
        const recentFavorites = await db.favorite.count({
          where: {
            productId: product.id,
            createdAt: { gte: startDate },
          },
        });
        
        // Get recent reviews
        const recentReviews = await db.review.count({
          where: {
            productId: product.id,
            createdAt: { gte: startDate },
          },
        });

        // Calculate trending score (weighted algorithm)
        const orderWeight = 10;
        const favoriteWeight = 3;
        const reviewWeight = 5;
        const viewWeight = 0.001;

        const score =
          ordersInPeriod * orderWeight +
          recentFavorites * favoriteWeight +
          recentReviews * reviewWeight +
          currentViews * viewWeight;

        // Get previous period data for movement calculation if needed
        let movement: 'up' | 'down' | 'same' | 'new' = 'new';
        let previousRank: number | null = null;

        if (includeMovement) {
          const previousOrders = await db.orderItem.count({
            where: {
              productId: product.id,
              order: {
                createdAt: { gte: previousStartDate, lt: startDate },
                status: { not: 'CANCELLED' },
              },
            },
          });

          const previousFavorites = await db.favorite.count({
            where: {
              productId: product.id,
              createdAt: { gte: previousStartDate, lt: startDate },
            },
          });

          const previousScore =
            previousOrders * orderWeight +
            previousFavorites * favoriteWeight;

          if (previousScore > 0) {
            const changePercent = ((score - previousScore) / previousScore) * 100;
            if (changePercent > 20) {
              movement = 'up';
            } else if (changePercent < -20) {
              movement = 'down';
            } else {
              movement = 'same';
            }
          }
        }

        return {
          ...product,
          trendingScore: Math.round(score * 100) / 100,
          metrics: {
            ordersInPeriod: ordersInPeriod,
            favoritesInPeriod: recentFavorites,
            reviewsInPeriod: recentReviews,
            totalViews: currentViews,
          },
          ...(includeMovement && { movement }),
        };
      })
    );

    // Sort by trending score and limit results
    const rankedProducts = scoredProducts
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)
      .map((product, index) => ({
        ...product,
        rank: index + 1,
      }));

    // Get category breakdown of trending products
    const categoryBreakdown = rankedProducts.reduce(
      (acc, product) => {
        const catName = product.category?.name || 'Other';
        acc[catName] = (acc[catName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      data: {
        products: rankedProducts,
        period: {
          type: period,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        },
        summary: {
          totalProducts: rankedProducts.length,
          averageScore:
            rankedProducts.length > 0
              ? Math.round(
                  rankedProducts.reduce((sum, p) => sum + p.trendingScore, 0) /
                    rankedProducts.length *
                    100
                ) / 100
              : 0,
          topCategory: Object.entries(categoryBreakdown).sort(
            ([, a], [, b]) => b - a
          )[0]?.[0],
          categoryBreakdown,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending products' },
      { status: 500 }
    );
  }
}

// POST /api/trending/refresh - Force refresh trending cache (admin)
export async function POST(request: NextRequest) {
  try {
    // This endpoint would trigger a recalculation of trending data
    // For now, just acknowledge the request
    
    const body = await request.json();
    const { categories, period } = body;

    // Log the refresh request
    console.log('Trending refresh requested:', {
      timestamp: new Date().toISOString(),
      categories,
      period: period || 'weekly',
    });

    // In a real implementation, this would:
    // 1. Clear any cached trending data
    // 2. Trigger background job to recalculate
    // 3. Return job ID for tracking

    return NextResponse.json({
      success: true,
      message: 'Trending data refresh initiated',
      jobId: `trend-${Date.now()}`,
      estimatedCompletion: '30 seconds',
    });
  } catch (error) {
    console.error('Error refreshing trending data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh trending data' },
      { status: 500 }
    );
  }
}
