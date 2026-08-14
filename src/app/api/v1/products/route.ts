import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/v1/products
 * 
 * List products with advanced filtering and pagination
 * 
 * Query Parameters:
 * - category: Filter by category slug
 * - search: Search in name and description
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - wilaya: Filter by wilaya code
 * - min_price: Minimum price filter (DZD)
 * - max_price: Maximum price filter (DZD)
 * - sort: Sort order (price_asc, price_desc, newest, popular)
 * - is_verified: Only verified suppliers' products
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const wilaya = searchParams.get('wilaya');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const sort = searchParams.get('sort') || 'newest';
    const isVerified = searchParams.get('is_verified') === 'true';

    // Build where clause
    const where: any = { status: 'published' };
    
    if (category) {
      where.category = { slug: category };
    }
    
    if (wilaya) {
      where.company = { wilaya };
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    
    if (isVerified) {
      where.company = { ...(where.company || {}), isVerified: true };
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build order clause based on sort parameter
    let orderBy: any = { createdAt: 'desc' }; // default: newest
    
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Execute queries in parallel
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
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
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      db.product.count({ where }),
    ]);

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Return standardized response
    return NextResponse.json(
      {
        success: true,
        data: products.map(product => formatProduct(product)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
        meta: {
          queriedAt: new Date().toISOString(),
          apiVersion: '1.0.0',
          responseTimeMs: responseTime,
          filters: {
            category,
            search,
            wilaya,
            minPrice,
            maxPrice,
            sort,
            isVerified,
          },
        },
      },
      {
        headers: {
          'X-Response-Time': `${responseTime}ms`,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Products API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while fetching products.',
        meta: {
          timestamp: new Date().toISOString(),
          apiVersion: '1.0.0',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/products
 * 
 * Create a new product (requires products:write permission)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get API key info from middleware headers
    const ownerId = request.headers.get('X-API-Owner-Id');
    
    if (!ownerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const { name, categoryId, price, ...rest } = body;
    
    if (!name || !categoryId || price === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          code: 'VALIDATION_ERROR',
          message: 'name, categoryId, and price are required.',
        },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = generateSlug(name);
    
    // Check if company exists for this user
    const company = await db.company.findFirst({
      where: { ownerId },
    });

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: 'Company profile required',
          code: 'COMPANY_REQUIRED',
          message: 'You need to create a company profile before adding products.',
        },
        { status: 400 }
      );
    }

    // Create product
    const product = await db.product.create({
      data: {
        name,
        slug,
        price: parseFloat(price),
        companyId: company.id,
        categoryId,
        status: 'draft', // Products start as draft
        ...rest,
      },
      include: {
        company: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: formatProduct(product),
        meta: {
          queriedAt: new Date().toISOString(),
          apiVersion: '1.0.0',
          responseTimeMs: responseTime,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create product error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format product for API response
 */
function formatProduct(product: any): any {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    nameAr: product.nameAr,
    description: product.description,
    price: product.price,
    currency: 'DZD',
    unit: product.unit || 'unité',
    stockQuantity: product.stockQuantity,
    sku: product.sku,
    status: product.status,
    images: product.images?.map((img: any) => ({
      url: img.url,
      alt: img.alt,
    })) || [],
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
      logoUrl: product.company.logoUrl,
    } : null,
    features: product.features ? JSON.parse(product.features) : null,
    specifications: product.specifications ? JSON.parse(product.specifications) : null,
    viewCount: product.viewCount,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/**
 * Generate URL-friendly slug from text
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')   // Remove special chars
    .replace(/\s+/g, '-')             // Replace spaces with hyphens
    .replace(/-+/g, '-')              // Remove duplicate hyphens
    .trim();
}
