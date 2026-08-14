import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { UserRole, Prisma } from '@prisma/client';
import { db } from '@/lib/db';

// GET /api/admin/products - List products for moderation
export async function GET(request: NextRequest) {
  try {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]);

    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'ALL';

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    if (status !== 'ALL' && status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category !== 'ALL' && category) {
      where.category = {
        slug: category,
      };
    }

    // Fetch products with pagination
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          },
          _count: {
            select: {
              reviews: true,
              orderItems: true,
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // REPORTED first
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    // Transform data
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images.find(img => img.isPrimary)?.url || product.images[0]?.url,
      companyName: product.company.name,
      companyId: product.company.id,
      categoryName: product.category.name,
      categorySlug: product.category.slug,
      price: product.price,
      priceRangeMin: product.priceRangeMin,
      priceRangeMax: product.priceRangeMax,
      currency: product.currency,
      status: product.status,
      viewCount: product.viewCount,
      isActive: product.isActive,
      reviewsCount: product._count.reviews,
      ordersCount: product._count.orderItems,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products - Bulk update products (approve/suspend)
export async function PATCH(request: NextRequest) {
  try {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

    const body = await request.json();
    const { productIds, action } = body; // action: 'approve', 'suspend', 'delete'

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'IDs de produits requis' },
        { status: 400 }
      );
    }

    if (!['approve', 'suspend'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action invalide' },
        { status: 400 }
      );
    }

    let newStatus: string;
    let auditMessage: string;

    switch (action) {
      case 'approve':
        newStatus = 'active';
        auditMessage = `Admin approved ${productIds.length} product(s)`;
        break;
      case 'suspend':
        newStatus = 'suspended';
        auditMessage = `Admin suspended ${productIds.length} product(s)`;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Action non supportée' },
          { status: 400 }
        );
    }

    // Update all products
    const result = await db.product.updateMany({
      where: {
        id: { in: productIds }
      },
      data: {
        status: newStatus,
        isActive: action === 'approve',
      }
    });

    // Log audit
    console.log(`[AUDIT] ${auditMessage}`);

    return NextResponse.json({
      success: true,
      message: `${result.count} produit(s) mis à jour(s)`,
      data: {
        updatedCount: result.count,
        action,
        newStatus
      }
    });
  } catch (error) {
    console.error('Error bulk updating products:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour des produits' },
      { status: 500 }
    );
  }
}
