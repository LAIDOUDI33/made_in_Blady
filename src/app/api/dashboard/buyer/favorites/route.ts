import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { FavoriteType } from '@prisma/client';

// GET /api/dashboard/buyer/favorites - Get buyer's favorites
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
    const type = searchParams.get('type'); // PRODUCT, SUPPLIER, RFQ (or 'all')
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId: user.id };
    
    if (type && type !== 'all') {
      where.itemType = type as FavoriteType;
    }

    // Get favorites with related data
    const [favorites, total] = await Promise.all([
      db.favorite.findMany({
        where,
        include: {
          product: type === 'SUPPLIER' || type === 'RFQ' ? false : {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  isVerified: true,
                  rating: true
                }
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              },
              _count: {
                select: { reviews: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.favorite.count({ where })
    ]);

    return NextResponse.json({
      favorites: favorites.map(fav => ({
        id: fav.id,
        itemId: fav.itemId,
        itemType: fav.itemType,
        savedAt: fav.createdAt.toISOString(),
        product: fav.product ? {
          id: fav.product.id,
          name: fav.product.name,
          slug: fav.product.slug,
          price: fav.product.price,
          priceRangeMin: fav.product.priceRangeMin,
          priceRangeMax: fav.product.priceRangeMax,
          currency: fav.product.currency,
          unit: fav.product.unit,
          image: null, // Would get from ProductImage
          supplier: fav.product.company?.name,
          supplierId: fav.product.company?.id,
          isVerified: fav.product.company?.isVerified,
          rating: fav.product.company?.rating || 0,
          reviewCount: fav.product._count.reviews,
          category: fav.product.category?.name,
          categoryId: fav.product.category?.id,
          inStock: fav.product.availability === 'in_stock'
        } : null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        productsTotal: await db.favorite.count({ 
          where: { userId: user.id, itemType: 'PRODUCT' } 
        }),
        suppliersTotal: await db.favorite.count({ 
          where: { userId: user.id, itemType: 'SUPPLIER' } 
        })
      }
    });

  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des favoris' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/buyer/favorites - Add to favorites
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, itemType } = body;

    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: 'itemId et itemType sont requis' },
        { status: 400 }
      );
    }

    if (!['PRODUCT', 'SUPPLIER', 'RFQ'].includes(itemType)) {
      return NextResponse.json(
        { error: 'itemType doit être PRODUCT, SUPPLIER ou RFQ' },
        { status: 400 }
      );
    }

    // Check if already in favorites
    const existing = await db.favorite.findUnique({
      where: {
        userId_itemType_itemId: {
          userId: user.id,
          itemType: itemType as FavoriteType,
          itemId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Déjà dans les favoris' },
        { status: 409 }
      );
    }

    // Add to favorites
    const favorite = await db.favorite.create({
      data: {
        userId: user.id,
        itemType: itemType as FavoriteType,
        itemId
      }
    });

    return NextResponse.json({
      success: true,
      favorite: {
        id: favorite.id,
        itemId: favorite.itemId,
        itemType: favorite.itemType
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding to favorites:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout aux favoris' },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboard/buyer/favorites - Remove from favorites
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const itemType = searchParams.get('itemType');
    
    // Support both single delete and batch delete
    let itemIds: string[] = [];
    
    if (searchParams.has('ids')) {
      // Batch delete - ids parameter is comma-separated
      itemIds = searchParams.get('ids')!.split(',');
    } else if (itemId && itemType) {
      // Single delete
      itemIds = [itemId];
      
      // Delete single favorite
      const deleted = await db.favorite.deleteMany({
        where: {
          userId: user.id,
          itemType: itemType as FavoriteType,
          itemId
        }
      });

      if (deleted.count === 0) {
        return NextResponse.json({ error: 'Favori non trouvé' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Retiré des favoris avec succès'
      });
    }

    // Batch delete by IDs
    if (itemIds.length > 0) {
      const deleted = await db.favorite.deleteMany({
        where: {
          userId: user.id,
          id: { in: itemIds }
        }
      });

      return NextResponse.json({
        success: true,
        message: `${deleted.count} favori(s) retiré(s) avec succès`
      });
    }

    return NextResponse.json(
      { error: 'IDs des favoris requis' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des favoris' },
      { status: 500 }
    );
  }
}
