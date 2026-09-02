import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { db } from '@/lib/db';

// This API handles following/unfollowing suppliers
// In a real implementation, you might have a separate Follow table or use Favorites with SUPPLIER type

// GET /api/dashboard/buyer/suppliers - Get followed suppliers for buyer
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (user.role !== 'BUYER') {
      return NextResponse.json({ error: 'Accès réservé aux acheteurs' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get followed suppliers (using Favorite table with SUPPLIER type)
    const whereClause = {
      userId: user.id,
      itemType: 'SUPPLIER'
    };

    // Get favorites that are suppliers
    const [followedSuppliers, total] = await Promise.all([
      db.favorite.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.favorite.count({ where: whereClause })
    ]);

    // Fetch company details for each followed supplier
    const supplierIds = followedSuppliers.map((f) => f.itemId);
    
    const companies = await db.company.findMany({
      where: {
        id: { in: supplierIds }
      },
      include: {
        _count: {
          select: { 
            products: true,
            reviews: true 
          }
        }
      }
    });

    // Map companies to their follow data
    const result = followedSuppliers
      .map((follow) => {
        const company = companies.find((c) => c.id === follow.itemId);
        if (!company) return null;
        
        return {
          id: follow.id,
          supplierId: follow.itemId,
          isFollowed: true,
          followDate: follow.createdAt.toISOString(),
          name: company.name,
          slug: company.slug,
          logo: company.logo,
          category: company.description?.substring(0, 50),
          location: company.wilaya,
          wilayaCode: company.wilaya.match(/\((\d+)\)/)?.[1] || '',
          rating: company.rating,
          reviewCount: company._count.reviews,
          productsCount: company._count.products,
          responseRate: company.responseRate,
          isVerified: company.isVerified,
          hasNewProducts: false,
          lastActive: company.updatedAt.toISOString(),
          description: company.description
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return NextResponse.json({
      suppliers: result,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalFollowed: total,
        verifiedCount: companies.filter((c) => c.isVerified).length
      }
    });
  } catch (error) {
    console.error('Error fetching followed suppliers:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des fournisseurs suivis' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/buyer/suppliers - Follow/Unfollow supplier
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { supplierId, action } = body;

    if (!supplierId) {
      return NextResponse.json({ error: 'ID du fournisseur requis' }, { status: 400 });
    }

    // Verify supplier exists
    const company = await db.company.findUnique({
      where: { id: supplierId }
    });

    if (!company) {
      return NextResponse.json({ error: 'Fournisseur non trouvé' }, { status: 404 });
    }

    switch (action) {
      case 'follow': {
        // Check if already following
        const existingFollow = await db.favorite.findUnique({
          where: {
            userId_itemType_itemId: {
              userId: user.id,
              itemType: 'SUPPLIER',
              itemId: supplierId
            }
          }
        });

        if (existingFollow) {
          return NextResponse.json(
            { error: 'Vous suivez déjà ce fournisseur' },
            { status: 409 }
          );
        }

        // Create follow (as favorite)
        const follow = await db.favorite.create({
          data: {
            userId: user.id,
            itemType: 'SUPPLIER',
            itemId: supplierId
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Fournisseur suivi avec succès',
          followId: follow.id
        }, { status: 201 });
      }

      case 'unfollow': {
        // Remove follow
        const deleted = await db.favorite.deleteMany({
          where: {
            userId: user.id,
            itemType: 'SUPPLIER',
            itemId: supplierId
          }
        });

        if (deleted.count === 0) {
          return NextResponse.json(
            { error: 'Vous ne suivez pas ce fournisseur' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Fournisseur retiré de votre liste'
        });
      }

      case 'toggle_notifications': {
        // Toggle notifications for this supplier
        console.log('Toggle notifications for supplier:', supplierId);
        
        return NextResponse.json({
          success: true,
          message: 'Préférences de notification mises à jour'
        });
      }

      default:
        return NextResponse.json({ error: 'Action non valide' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error managing supplier follow:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la gestion du suivi du fournisseur' },
      { status: 500 }
    );
  }
}

// GET /api/dashboard/buyer/suppliers/[id]/products - Get new products from followed supplier
export async function GETSupplierProducts(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user follows this supplier
    const isFollowing = await db.favorite.findUnique({
      where: {
        userId_itemType_itemId: {
          userId: user.id,
          itemType: 'SUPPLIER',
          itemId: id
        }
      }
    });

    if (!isFollowing) {
      return NextResponse.json(
        { error: 'Vous ne suivez pas ce fournisseur' },
        { status: 403 }
      );
    }

    // Get recent products from this supplier
    const products = await db.product.findMany({
      where: {
        companyId: id,
        isActive: true,
        status: 'published'
      },
      include: {
        category: {
          select: { name: true, slug: true }
        },
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        currency: p.currency,
        unit: p.unit,
        image: null,
        category: p.category.name,
        rating: 0,
        reviewCount: p._count.reviews,
        createdAt: p.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    );
  }
}
