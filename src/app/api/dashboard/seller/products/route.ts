import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper to get authenticated user's company
async function getAuthenticatedCompany() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { 
      error: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ), 
      company: null 
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { company: true }
  });

  if (!user?.company) {
    return { 
      error: NextResponse.json(
        { success: false, error: 'No company associated with this account' },
        { status: 403 }
      ), 
      company: null 
    };
  }

  return { error: null, company: user.company };
}

// GET /api/dashboard/seller/products - List products for current supplier (authenticated)
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedCompany();
  if (auth.error) return auth.error;
  
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const companyId = auth.company!.id;
    const where: Record<string, unknown> = { companyId };
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (category && category !== 'all') {
      where.categoryId = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1
          },
          category: {
            select: { name: true }
          },
          _count: {
            select: { favorites: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/seller/products - Create new product (authenticated)
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedCompany();
  if (auth.error) return auth.error;
  
  try {
    const body = await request.json();
    
    const {
      name,
      sku,
      shortDescription,
      description,
      priceType = 'fixed',
      price,
      priceRangeMin,
      priceRangeMax,
      currency = 'DZD',
      negotiablePrice = false,
      moq,
      unit,
      leadTime,
      countryOfOrigin,
      categoryId,
      images = [],
      specifications = [],
      status = 'draft',
    } = body;

    // Validate required fields
    if (!name || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Le nom et la catégorie sont obligatoires' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check slug uniqueness
    const existingProduct = await db.product.findUnique({ where: { slug } });
    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Un produit avec ce nom existe déjà' },
        { status: 409 }
      );
    }

    const companyId = auth.company!.id;

    // Create product with images in transaction
    const product = await db.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          slug,
          sku: sku || null,
          shortDescription: shortDescription || null,
          description: description || null,
          price: priceType === 'fixed' ? parseFloat(price) : null,
          priceRangeMin: priceType === 'range' ? parseFloat(priceRangeMin) : null,
          priceRangeMax: priceType === 'range' ? parseFloat(priceRangeMax) : null,
          currency,
          negotiablePrice,
          moq: moq ? parseInt(moq) : null,
          unit: unit || null,
          leadTime: leadTime || null,
          countryOfOrigin: countryOfOrigin || null,
          categoryId,
          companyId,
          status,
        },
      });

      // Create product images
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img: { url: string; isPrimary?: boolean; alt?: string }, index: number) => ({
            productId: newProduct.id,
            url: img.url,
            isPrimary: img.isPrimary || index === 0,
            alt: img.alt || name,
            sortOrder: index,
          })),
        });
      }

      return newProduct;
    });

    // Audit log for product creation
    await db.auditLog.create({
      data: {
        userId: auth.company!.userId,
        action: 'CREATE_PRODUCT',
        resource: 'product',
        resourceId: product.id,
        oldValue: null,
        newValue: JSON.stringify({ name, slug, companyId }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      }
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        data: product,
        message: 'Produit créé avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du produit' },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/seller/products - Bulk update products (authenticated)
export async function PUT(request: NextRequest) {
  const auth = await getAuthenticatedCompany();
  if (auth.error) return auth.error;
  
  try {
    const body = await request.json();
    const { ids, action } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'IDs des produits requis' },
        { status: 400 }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'activate':
        updateData = { status: 'active' };
        break;
      case 'deactivate':
        updateData = { status: 'inactive' };
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Action non valide' },
          { status: 400 }
        );
    }

    // Only allow updating own company's products
    const result = await db.product.updateMany({
      where: { 
        id: { in: ids },
        companyId: auth.company!.id 
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} produit(s) mis à jour(s)`,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('Error bulk updating products:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour des produits' },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboard/seller/products - Delete products (authenticated)
export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedCompany();
  if (auth.error) return auth.error;
  
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',');

    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'IDs des produits requis' },
        { status: 400 }
      );
    }

    // Only allow deleting own company's products
    await db.product.deleteMany({
      where: { 
        id: { in: ids },
        companyId: auth.company!.id 
      },
    });

    return NextResponse.json({
      success: true,
      message: `${ids.length} produit(s) supprimé(s)`,
    });
  } catch (error) {
    console.error('Error deleting products:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression des produits' },
      { status: 500 }
    );
  }
}
