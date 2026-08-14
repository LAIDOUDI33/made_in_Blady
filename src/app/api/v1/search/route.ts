import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/v1/search
 * 
 * Global search across products and suppliers/companies
 * 
 * Query Parameters:
 * - q: Search query (required, minimum 2 characters)
 * - type: Search scope (all, products, suppliers) - default: all
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    // Validate search query
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid search query',
          code: 'INVALID_QUERY',
          message: 'Search query must be at least 2 characters long.',
          meta: {
            timestamp: new Date().toISOString(),
            apiVersion: '1.0.0',
          },
        },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
    let results: Record<string, any> = {};
    let totalResults = 0;

    // Execute searches in parallel based on type
    const searchPromises: Promise<void>[] = [];

    if (type === 'all' || type === 'products') {
      searchPromises.push(
        db.product.findMany({
          where: {
            status: 'published',
            OR: [
              { name: { contains: trimmedQuery, mode: 'insensitive' } },
              { nameAr: { contains: trimmedQuery } },
              { description: { contains: trimmedQuery, mode: 'insensitive' } },
              { tags: { contains: trimmedQuery } },
              { sku: { contains: trimmedQuery, mode: 'insensitive' } },
            ],
          },
          take: limit,
          skip: (page - 1) * limit,
          include: {
            company: { 
              select: { 
                id: true, 
                name: true, 
                slug: true, 
                isVerified: true,
                logoUrl: true,
              } 
            },
            category: { 
              select: { 
                id: true, 
                name: true, 
                slug: true,
                nameAr: true,
              } 
            },
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true, alt: true }
            },
          },
          orderBy: [
            { isFeatured: 'desc' },
            { viewCount: 'desc' },
          ],
        }).then(products => {
          results.products = products.map(formatProductForSearch);
          totalResults += products.length;
        })
      );
    }

    if (type === 'all' || type === 'suppliers') {
      searchPromises.push(
        db.company.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: trimmedQuery, mode: 'insensitive' } },
              { nameAr: { contains: trimmedQuery } },
              { description: { contains: trimmedQuery, mode: 'insensitive' } },
              { tags: { contains: trimmedQuery } },
            ],
          },
          take: limit,
          skip: (page - 1) * limit,
          include: {
            _count: { 
              select: { 
                products: { where: { status: 'published' } } 
              } 
            },
            images: {
              where: { isLogo: true },
              take: 1,
              select: { url: true }
            },
          },
          orderBy: [
            { isVerified: 'desc' },
            { createdAt: 'desc' },
          ],
        }).then(companies => {
          results.suppliers = companies.map(formatCompanyForSearch);
          totalResults += companies.length;
        })
      );
    }

    // Wait for all searches to complete
    await Promise.all(searchPromises);

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Return standardized response
    return NextResponse.json(
      {
        success: true,
        query: trimmedQuery,
        type,
        results,
        pagination: {
          page,
          limit,
          totalResults,
          totalPages: Math.ceil(totalResults / limit) || 1,
        },
        meta: {
          searchedAt: new Date().toISOString(),
          apiVersion: '1.0.0',
          responseTimeMs: responseTime,
          suggestions: generateSuggestions(trimmedQuery),
        },
      },
      {
        headers: {
          'X-Response-Time': `${responseTime}ms`,
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
          'Vary': 'Accept-Language',
        },
      }
    );
  } catch (error) {
    console.error('Search API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        code: 'SEARCH_ERROR',
        message: 'An unexpected error occurred while performing the search.',
        meta: {
          timestamp: new Date().toISOString(),
          apiVersion: '1.0.0',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format product for search results (lighter format)
 */
function formatProductForSearch(product: any): any {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    nameAr: product.nameAr,
    price: product.price,
    currency: 'DZD',
    unit: product.unit || 'unité',
    image: product.images?.[0]?.url || null,
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
      nameAr: product.category.nameAr,
      slug: product.category.slug,
    } : null,
    company: product.company ? {
      id: product.company.id,
      name: product.company.name,
      slug: product.company.slug,
      isVerified: product.company.isVerified,
    } : null,
    isFeatured: product.isFeatured,
    rating: product.rating,
    reviewCount: product.reviewCount,
    matchType: determineMatchType(product, ''),
  };
}

/**
 * Format company for search results
 */
function formatCompanyForSearch(company: any): any {
  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    nameAr: company.nameAr,
    description: company.description?.substring(0, 200),
    logoUrl: company.images?.[0]?.url || company.logoUrl,
    isVerified: company.isVerified,
    wilaya: company.wilaya,
    city: company.city,
    productCount: company._count?.products || 0,
    foundedYear: company.foundedYear,
    employeeCount: company.employeeCount,
    matchType: 'company',
  };
}

/**
 * Determine how well a result matches the query
 */
function determineMatchType(item: any, query: string): string {
  // This would be enhanced with actual relevance scoring
  if (item.name?.toLowerCase() === query.toLowerCase()) {
    return 'exact';
  }
  if (item.name?.toLowerCase().includes(query.toLowerCase())) {
    return 'name_match';
  }
  return 'partial';
}

/**
 * Generate search suggestions based on common patterns
 */
function generateSuggestions(query: string): string[] {
  const suggestions: string[] = [];
  
  // Add common Algerian market categories as suggestions
  const commonTerms = [
    'panneau solaire', 'climatisation', 'matériel construction',
    'fourniture bureau', 'équipement agricole', 'textile',
    'produits alimentaires', 'électronique', 'mobilier'
  ];
  
  for (const term of commonTerms) {
    if (term.includes(query.toLowerCase()) || query.toLowerCase().includes(term.substring(0, 3))) {
      suggestions.push(term);
    }
    if (suggestions.length >= 5) break;
  }
  
  return suggestions;
}
